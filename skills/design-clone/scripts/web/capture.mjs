#!/usr/bin/env node
/**
 * design-clone Web 捕获：对目标网站做广度优先爬取，
 * 逐页截图 + 提取交互元素树 + 记录页面跳转图，输出结构化捕获产物。
 *
 * 用法:
 *   node capture.mjs --url <网址> --out <capture目录> [选项]
 *
 * 选项:
 *   --max-pages <n>        最多捕获页面数（默认 5，续跑时为累计上限）
 *   --clicks <n>           每页最多跟随的链接数（默认 3）
 *   --max-depth <n>        BFS 深度上限（默认 99，起始页=0）
 *   --budget-seconds <n>   墙钟预算秒数（0=不限）
 *   --viewport <模式>      mobile | desktop | WxH（默认 desktop）
 *   --wait <ms>            页面加载后额外等待（默认 1500）
 *   --record               录制操作视频
 *   --headed               可见浏览器窗口（需要用户登录时用）
 *   --scope <名称>         范围标记，写入 manifest（默认 full）
 *   --resume               读 state.json 断点续跑（不重拍已捕获节点）
 *
 * 预算制：max-pages / budget-seconds / max-depth 三者取最先触发者停爬，
 * stop_reason 写入 manifest；每完成一屏增量落盘 state.json + graph.json，被杀不丢进度。
 */
import { parseArgs } from "node:util";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const { values: args } = parseArgs({
  options: {
    url: { type: "string" },
    out: { type: "string" },
    "max-pages": { type: "string", default: "5" },
    clicks: { type: "string", default: "3" },
    "max-depth": { type: "string", default: "99" },
    "budget-seconds": { type: "string", default: "0" },
    viewport: { type: "string", default: "desktop" },
    wait: { type: "string", default: "1500" },
    record: { type: "boolean", default: false },
    headed: { type: "boolean", default: false },
    scope: { type: "string", default: "full" },
    seeds: { type: "string", default: "" },
    assets: { type: "string", default: "0" },
    resume: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
});

if (args.help || !args.url || !args.out) {
  console.log("用法: node capture.mjs --url <网址> --out <capture目录> [--max-pages 5] [--clicks 3] [--max-depth 99] [--budget-seconds 0] [--viewport mobile|desktop|WxH] [--wait 1500] [--record] [--headed] [--scope 名称] [--resume]");
  process.exit(args.help ? 0 : 1);
}

const req = createRequire(import.meta.url);
const { chromium } = req("playwright");
const sharp = req("sharp");
const playwrightVersion = req("playwright/package.json").version;

const VIEWPORTS = { desktop: { width: 1280, height: 800 }, mobile: { width: 390, height: 844 } };
const viewport = VIEWPORTS[args.viewport] ?? (() => {
  const m = /^(\d+)x(\d+)$/.exec(args.viewport);
  if (!m) { console.error(`无效 --viewport: ${args.viewport}`); process.exit(1); }
  return { width: +m[1], height: +m[2] };
})();

const maxPages = Math.max(1, parseInt(args["max-pages"], 10));
const clicksPerPage = Math.max(0, parseInt(args.clicks, 10));
const maxDepth = Math.max(0, parseInt(args["max-depth"], 10));
const budgetSec = Math.max(0, parseInt(args["budget-seconds"], 10));
const extraWait = parseInt(args.wait, 10);
const outDir = path.resolve(args.out);
const screensDir = path.join(outDir, "screens");
const treeDir = path.join(outDir, "ui-tree");
const videosDir = path.join(outDir, "videos");
fs.mkdirSync(screensDir, { recursive: true });
fs.mkdirSync(treeDir, { recursive: true });
if (args.record) fs.mkdirSync(videosDir, { recursive: true });

const startUrl = new URL(args.url);
const origin = startUrl.origin;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function aHash(file) {
  const raw = await sharp(file).resize(8, 8, { fit: "fill" }).grayscale().raw().toBuffer();
  const avg = raw.reduce((a, b) => a + b, 0) / raw.length;
  let hex = "";
  for (let i = 0; i < 64; i += 4) {
    let nib = 0;
    for (let j = 0; j < 4; j++) nib = (nib << 1) | (raw[i + j] > avg ? 1 : 0);
    hex += nib.toString(16);
  }
  return hex;
}

function hamming(a, b) {
  let d = 0;
  for (let i = 0; i < a.length; i++) {
    let x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (x) { d += x & 1; x >>= 1; }
  }
  return d;
}

function slugify(urlObj) {
  let p = urlObj.pathname.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
  if (urlObj.search) p += "-" + urlObj.search.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
  return (p || "index").slice(0, 40);
}

const UI_TREE_SCRIPT = () => {
  const sel = "a, button, input, select, textarea, img, h1, h2, h3, [role=button], [role=tab], [onclick]";
  const out = [];
  document.querySelectorAll(sel).forEach((el, idx) => {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    if (r.bottom < 0 || r.top > document.documentElement.scrollHeight) return;
    const text = (el.innerText || el.value || el.alt || el.getAttribute("aria-label") || "").trim().slice(0, 80);
    out.push({
      idx,
      tag: el.tagName.toLowerCase(),
      type: el.getAttribute("type") || undefined,
      text: text || undefined,
      href: el.tagName === "A" ? el.getAttribute("href") : undefined,
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      clickable: el.tagName === "A" || el.tagName === "BUTTON" || el.getAttribute("role") === "button" || !!el.getAttribute("onclick") || el.closest("a") !== null,
    });
  });
  return {
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content || undefined,
    url: location.href,
    elements: out,
  };
};

const DOM_TOKENS_SCRIPT = () => {
  const freq = (m, v) => m.set(v, (m.get(v) || 0) + 1);
  const colors = new Map(), fonts = new Map(), radii = new Map();
  const els = [...document.querySelectorAll("*")].slice(0, 800);
  for (const el of els) {
    const cs = getComputedStyle(el);
    if (cs.backgroundColor && cs.backgroundColor !== "rgba(0, 0, 0, 0)") freq(colors, cs.backgroundColor);
    freq(colors, cs.color);
    freq(fonts, cs.fontFamily.split(",")[0].replace(/["']/g, "").trim());
    if (cs.borderRadius && cs.borderRadius !== "0px") freq(radii, cs.borderRadius);
  }
  const top = (m, n) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([value, count]) => ({ value, count }));
  return { colors: top(colors, 12), fonts: top(fonts, 6), radii: top(radii, 6) };
};

/* ---------- 增量状态（断点续跑） ---------- */
const statePath = path.join(outDir, "state.json");
let state = { seq: 0, visited: [], queue: [], nodes: [], edges: [], domTokens: null, started_at: new Date().toISOString() };
if (args.resume && fs.existsSync(statePath)) {
  state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  console.log(`[capture] resume：恢复 ${state.nodes.length} 节点 / ${state.queue.length} 积压，seq=${state.seq}`);
}
const nodes = state.nodes;
const edges = state.edges;
const visited = new Set(state.visited);
const queue = state.queue; // [{url, edgeIdx|null, depth}]
let seq = state.seq;
let domTokens = state.domTokens;
let videoPath = null;

function log(msg) { console.log(`[capture] ${msg}`); }

function saveState() {
  state.seq = seq; state.visited = [...visited]; state.queue = queue;
  state.nodes = nodes; state.edges = edges; state.domTokens = domTokens;
  fs.writeFileSync(statePath, JSON.stringify(state));
  fs.writeFileSync(path.join(outDir, "graph.json"), JSON.stringify({ nodes, edges }, null, 2));
}

function recordAction(step, screenId, action, resultScreen, note = "") {
  const entry = { t: new Date().toISOString(), step, screen: screenId, action, result_screen: resultScreen, note };
  fs.appendFileSync(path.join(outDir, "actions.jsonl"), JSON.stringify(entry) + "\n");
}

async function capturePage(context, url, viaEdge, depth) {
  seq += 1;
  const u = new URL(url);
  const id = `${String(seq).padStart(2, "0")}-${slugify(u)}`;
  const page = await context.newPage();
  const stepNo = actionsCount() + 1;
  try {
    log(`(${nodes.length + 1}/${maxPages}) d${depth} ${url}`);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
    try { await page.waitForLoadState("networkidle", { timeout: 8000 }); } catch {}
    await sleep(extraWait);

    const shot = path.join(screensDir, `${id}.png`);
    await page.screenshot({ path: shot });
    await page.screenshot({ path: path.join(screensDir, `${id}-full.png`), fullPage: true }).catch(() => {});
    if (parseInt(args.assets || "0", 10) > 0) {
      const want = parseInt(args.assets, 10);
      const srcs = await page.evaluate((minW) => {
        const out = [];
        for (const im of document.querySelectorAll("img")) {
          const u = im.currentSrc || im.src;
          if (u && u.startsWith("http") && im.naturalWidth >= minW && !out.includes(u)) out.push(u);
        }
        return out;
      }, 300);
      const assetsDir = path.join(outDir, "assets");
      fs.mkdirSync(assetsDir, { recursive: true });
      const manifest = (() => { try { return JSON.parse(fs.readFileSync(path.join(assetsDir, "assets-manifest.json"), "utf8")); } catch { return {}; } })();
      let got = Object.keys(manifest).length;
      for (const u of srcs) {
        if (got >= want * 3 || manifest[u]) continue;
        try {
          const r = await fetch(u, { headers: { "user-agent": "Mozilla/5.0 (Macintosh) design-clone/1.0" } });
          if (!r.ok) continue;
          const ct = (r.headers.get("content-type") || "image/jpeg").split(";")[0];
          const ext = { "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp", "image/svg+xml": ".svg" }[ct] || ".jpg";
          const f = `${id}-a${got}${ext}`;
          fs.writeFileSync(path.join(assetsDir, f), Buffer.from(await r.arrayBuffer()));
          manifest[u] = f; got++;
        } catch {}
      }
      fs.writeFileSync(path.join(assetsDir, "assets-manifest.json"), JSON.stringify(manifest, null, 1));
    }
    const tree = await page.evaluate(UI_TREE_SCRIPT);
    fs.writeFileSync(path.join(treeDir, `${id}.json`), JSON.stringify(tree, null, 2));
    if (!domTokens) {
      domTokens = await page.evaluate(DOM_TOKENS_SCRIPT).catch(() => null);
      if (domTokens) {
        domTokens.source_url = page.url();
        domTokens._note = "读真实样式表（借鉴 baoyu-design）：与像素提取 tokens 互校，优先级更高";
        fs.writeFileSync(path.join(outDir, "tokens.dom.json"), JSON.stringify(domTokens, null, 2));
      }
    }

    const hash = await aHash(shot);
    let duplicateOf = null;
    for (const n of nodes) {
      if (n.hash && hamming(n.hash, hash) <= 6) { duplicateOf = n.id; break; }
    }

    const node = {
      id, title: tree.title, url: page.url(),
      screenshot: `screens/${id}.png`, ui_tree: `ui-tree/${id}.json`,
      first_seen_at: new Date().toISOString(), hash, depth,
      fidelity: "high",
      ...(duplicateOf ? { duplicate_of: duplicateOf } : {}),
    };
    nodes.push(node);

    if (viaEdge) {
      viaEdge.to = id;
      recordAction(stepNo, viaEdge.from, viaEdge.action, duplicateOf ?? id, duplicateOf ? `与 ${duplicateOf} 重复` : "");
    }

    if (page.url() !== url) visited.add(page.url());

    const links = [];
    if (nodes.filter((n) => !n.duplicate_of).length <= maxPages) {
      const anchors = await page.$$eval("a[href]", (as) =>
        as.map((a) => ({
          href: a.href,
          text: (a.innerText || a.getAttribute("aria-label") || "").trim().slice(0, 60),
        })).filter((l) => {
          try {
            const lu = new URL(l.href);
            return lu.origin === location.origin && lu.protocol.startsWith("http");
          } catch { return false; }
        })
      );
      const seen = new Set();
      for (const a of anchors) {
        const key = a.href.split("#")[0];
        if (seen.has(key) || visited.has(key) || visited.has(a.href)) continue;
        seen.add(key);
        links.push({ href: key, text: a.text });
        if (links.length >= clicksPerPage) break;
      }
    }
    return { node, links, pageUrl: page.url() };
  } catch (e) {
    log(`  ⚠ 失败: ${e.message}`);
    if (viaEdge) recordAction(stepNo, viaEdge.from, viaEdge.action, null, `失败: ${e.message}`);
    return null;
  } finally {
    await page.close();
  }
}

function actionsCount() {
  try { return fs.readFileSync(path.join(outDir, "actions.jsonl"), "utf8").trim().split("\n").filter(Boolean).length; } catch { return 0; }
}

(async () => {
  const browser = await chromium.launch({ headless: !args.headed });
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: viewport.width < 500 ? 2 : 1,
    recordVideo: args.record ? { dir: videosDir, size: viewport } : undefined,
  });

  if (!queue.length && !nodes.length) {
    queue.push({ url: startUrl.href, edgeIdx: null, depth: 0 });
  }
  {
    const seen = new Set([...state.visited, ...queue.map((q) => q.url), ...state.nodes.map((n) => n.url)]);
    for (const s of String(args.seeds || "").split(",").map((x) => x.trim()).filter(Boolean)) {
      try { const u = new URL(s, startUrl.href).href; if (!seen.has(u)) queue.push({ url: u, edgeIdx: null, depth: 1 }); } catch {}
    }
    visited.add(startUrl.href);
  }

  const t0 = Date.now();
  let stopReason = "drained";
  let skippedDeep = 0;
  while (queue.length) {
    if (nodes.length >= maxPages) { stopReason = "pages"; break; }
    if (budgetSec && Date.now() - t0 > budgetSec * 1000) { stopReason = "seconds"; break; }
    const item = queue.shift();
    if (item.depth > maxDepth) { skippedDeep++; continue; }
    const viaEdge = item.edgeIdx != null ? edges[item.edgeIdx] : null;
    const res = await capturePage(context, item.url, viaEdge, item.depth);
    if (res) {
      for (const l of res.links) {
        if (visited.has(l.href)) continue;
        visited.add(l.href);
        edges.push({
          from: res.node.id,
          action: { type: "tap", target: l.text || l.href },
          to: null, depth: item.depth + 1,
          at: new Date().toISOString(),
        });
        queue.push({ url: l.href, edgeIdx: edges.length - 1, depth: item.depth + 1 });
      }
    }
    saveState();
    if (budgetSec && Date.now() - t0 > budgetSec * 1000) { stopReason = "seconds"; break; }
  }
  if (stopReason === "drained" && nodes.length >= maxPages) stopReason = "pages";
  if (stopReason === "drained" && skippedDeep) stopReason = "depth";

  const ctxPages = context.pages();
  let videoObj = null;
  if (args.record && ctxPages.length) videoObj = ctxPages[0].video();
  await context.close();
  await browser.close();
  if (videoObj) videoPath = await videoObj.path().catch(() => null);

  if (args.record) {
    const vids = fs.readdirSync(videosDir).filter((f) => f.endsWith(".webm")).sort();
    vids.forEach((f, i) => {
      const renamed = `record-${String(i + 1).padStart(2, "0")}.webm`;
      fs.renameSync(path.join(videosDir, f), path.join(videosDir, renamed));
      if (videoPath && videoPath.endsWith(f)) videoPath = path.join(videosDir, renamed);
    });
  }

  /* ---------- coverage（DESIGN.md 深化输入） ---------- */
  const capturedUrls = new Set(nodes.map((n) => n.url));
  const unvisited = [...visited].filter((u) => !capturedUrls.has(u));
  const byPrefix = {};
  for (const u of visited) {
    const seg = new URL(u).pathname.split("/")[1] || "/";
    byPrefix[seg] = (byPrefix[seg] || 0) + 1;
  }
  const depthDist = {};
  for (const n of nodes) depthDist["d" + n.depth] = (depthDist["d" + n.depth] || 0) + 1;
  const coverage = {
    captured: nodes.length,
    discovered: visited.size,
    unvisited_count: unvisited.length,
    unvisited_top: unvisited.slice(0, 30),
    by_path_prefix: Object.fromEntries(Object.entries(byPrefix).sort((a, b) => b[1] - a[1])),
    depth_distribution: depthDist,
    duplicates: nodes.filter((n) => n.duplicate_of).length,
    stop_reason: stopReason,
    backlog: queue.length,
  };
  fs.writeFileSync(path.join(outDir, "coverage.json"), JSON.stringify(coverage, null, 2));

  const manifest = {
    target: startUrl.hostname,
    target_type: "web",
    scope: args.scope,
    platform_info: { browser: `chromium (playwright ${playwrightVersion})` },
    url: startUrl.href,
    viewport,
    started_at: state.started_at,
    ended_at: new Date().toISOString(),
    screen_count: nodes.length,
    budgets: { max_pages: maxPages || null, budget_seconds: budgetSec || null, max_depth: maxDepth || null, clicks: clicksPerPage },
    stop_reason: stopReason,
    tool_versions: { node: process.version, playwright: playwrightVersion },
    video: videoPath ? path.relative(outDir, videoPath) : undefined,
  };
  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  saveState();

  const dupes = nodes.filter((n) => n.duplicate_of).length;
  console.log(`\n✅ 捕获完成: ${nodes.length} 屏（重复 ${dupes}）, ${edges.filter((e) => e.to).length} 条跳转 · stop=${stopReason} · 积压 ${queue.length}`);
  console.log(`发现 ${visited.size} URL，未访问 ${unvisited.length}（coverage.json 见 top30）`);
  console.log(`产物目录: ${outDir}`);
})().catch((e) => { console.error(e); process.exit(1); });
