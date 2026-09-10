#!/usr/bin/env node
/**
 * 常驻回归器 v4（inspector v4 IA）：双菜单/双画布/详情看板/底栏/播放器/演示/URL 状态 + 质量软警告。
 * 用法: node inspect.mjs <base-url> <name> [--shots <dir>] [--run <runDir>]
 * 零容忍：pageError / 非可选 requestfailed / 硬检查 fail；质量类（emoji/overlap/contrast）记 warn 不阻断。
 */
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { parseArgs } from "node:util";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const HERE = path.dirname(new URL(import.meta.url).pathname);

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("常驻回归器 v4：自动遍历双菜单/双画布/详情看板/底栏/播放器/演示/URL 状态并取证。\n用法: node inspect.mjs <base-url> <name> [--shots <dir>]");
  process.exit(0);
}
const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { shots: { type: "string", default: "/tmp/qa-shots" }, run: { type: "string" } },
});
const [baseRaw, name] = positionals;
if (!baseRaw || !name) { console.log("用法: node inspect.mjs <base-url> <name> [--shots <dir>] [--run <runDir>]"); process.exit(1); }
const base = baseRaw.replace(/\/+$/, "").replace(/\/prototype$/, "");
const shots = path.resolve(values.shots);
fs.mkdirSync(shots, { recursive: true });

const R = { name, base, at: new Date().toISOString(), checks: {}, consoleErrors: [], pageErrors: [] };
const ok = (k, v, note = "") => { R.checks[k] = { pass: !!v, note }; };
const okw = (k, v, note = "") => { R.checks[k] = { pass: !!v, warn: true, note }; };
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.emulateMedia({ reducedMotion: "reduce" });
page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) R.consoleErrors.push(m.text().slice(0, 160)); });
page.on("pageerror", (e) => R.pageErrors.push(e.message.slice(0, 160)));
page.on("requestfailed", (r) => {
  try { if (r.frame() && r.frame() !== page.mainFrame()) return; } catch {}
  if (!/layout-overrides\.json|variants\.json|favicon|edit-overrides\.json|products\.json|paths\.json|source-map\.json|annotations\.json|journeys\.json|capture\/(screens|frames)\//.test(r.url())) R.consoleErrors.push("requestfailed: " + r.url());
});

const shot = (k) => page.screenshot({ path: path.join(shots, `qa-${name}-${k}.png`) });
const step = async (k, fn) => { try { await fn(); ok(k, true); } catch (e) { ok(k, false, String(e.message).slice(0, 120)); } };
const stepw = async (k, fn) => { try { const note = await fn(); okw(k, true, note || ""); } catch (e) { okw(k, false, String(e.message).slice(0, 120)); } };

await step("redirect-no-slash", async () => {
  await page.goto(base.replace(/\/$/, "") + "/prototype", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(300);
  if (!page.url().includes("/prototype/")) throw new Error("no redirect");
});
await page.goto(base + "/prototype/", { waitUntil: "networkidle" });
await page.waitForTimeout(700);

{
  let scopeMode = "demo";
  if (values.run) { try { scopeMode = (JSON.parse(fs.readFileSync(path.join(values.run, "knowledge/scope.json"), "utf8")).scope) || "demo"; } catch {} }
  const check = async () => {
    const btns = page.locator("#dc-pages button");
    const n = await btns.count();
    const bad = [];
    for (let i = 0; i < n; i++) {
      await btns.nth(i).click(); await page.waitForTimeout(250);
      const r = await page.evaluate(() => {
        const stage = document.querySelector("#dc-stage");
        if (!stage) return 0;
        const sr = stage.getBoundingClientRect();
        let max = 0;
        for (const im of stage.querySelectorAll("img")) { const r0 = im.getBoundingClientRect(); max = Math.max(max, (r0.width * r0.height) / (sr.width * sr.height)); }
        return max;
      });
      if (r > 0.8) bad.push(i + 1);
    }
    return bad;
  };
  if (scopeMode === "full") {
    await step("live-views", async () => { const bad = await check(); if (bad.length) throw new Error(bad.length + " screenshot-views: " + bad.join(",")); });
  } else {
    await stepw("live-views", async () => { const bad = await check(); return bad.length ? bad.length + " screenshot-views(demo 允许)" : ""; });
  }
  const phCheck = async () => {
    const btns = page.locator("#dc-pages button");
    const n = await btns.count();
    const bad = [];
    for (let i = 0; i < n; i++) {
      await btns.nth(i).click(); await page.waitForTimeout(200);
      const c = await page.evaluate(() => {
        let cnt = 0;
        for (const el of document.querySelectorAll("#dc-stage *")) {
          if (el.closest("[data-state=loading]")) continue;
          const t = (el.childNodes.length === 1 && el.firstChild.nodeType === 3) ? el.textContent : "";
          if (/占位|渲染位/.test(t || "")) { cnt++; continue; }
          const cls = el.className ? String(el.className) : "";
          if (cls.includes("mi-skeleton")) { const r = el.getBoundingClientRect(); if (r.height >= 100) cnt++; }
          if (cls.split(" ").includes("fig")) cnt++;
        }
        return cnt;
      });
      if (c > 0) bad.push(i + 1);
    }
    return bad;
  };
  if (scopeMode === "full") {
    await step("placeholder-scan", async () => { const bad = await phCheck(); if (bad.length) throw new Error(bad.length + " placeholder-views(资产阶梯:原图→裁剪→asset-qa→genimg→仅loading占位): " + bad.join(",")); });
  } else {
    await stepw("placeholder-scan", async () => { const bad = await phCheck(); return bad.length ? bad.length + " placeholder-views(demo 允许)" : ""; });
  }
  await step("parity", async () => {
    if (scopeMode !== "full") return;
    const pf = values.run ? path.join(values.run, "qa/parity.json") : null;
    if (!pf || !fs.existsSync(pf)) throw new Error("parity-not-run（跑 qa/parity.mjs --run <run> --base <url>）");
    const parity = JSON.parse(fs.readFileSync(pf, "utf8"));
    const bad = Object.entries(parity).filter(([k, v]) => v.mode === "none").map(([k]) => k + ":no-parity-evidence");
    const lowCov = Object.entries(parity).filter(([k, v]) => v.mode !== "na" && v.control_coverage != null && v.control_coverage < 0.8).map(([k, v]) => k + ":ctrl-cov-" + v.control_coverage.toFixed(2));
    if (bad.length) throw new Error(bad.length + " parity-fail: " + bad.slice(0, 4).join(","));
    // M49：控件覆盖/交互覆盖=存量保真债。M49 门落地后新建 run 硬拦（demo-orbit 已证新管线达标）；
    // 存量 run 记 warn 并进 report/parity-debt.md 公示，不清债不删门。
    let legacy = false;
    try { legacy = fs.statSync(path.join(values.run, "knowledge/scope.json")).mtimeMs < 1788998400000; } catch {}
    if (lowCov.length) {
      if (legacy) { ok("parity", true, "存量保真债（warn）: " + lowCov.slice(0, 6).join(",")); R.checks.parity.warn = true; }
      else throw new Error(lowCov.length + " parity 控件覆盖不足: " + lowCov.slice(0, 4).join(","));
    }
  });
  await step("truncated-text", async () => {
    const btns = page.locator("#dc-pages button");
    const n = await btns.count();
    let worst = 0, worstPage = "";
    for (let i = 0; i < n; i++) {
      await btns.nth(i).click(); await page.waitForTimeout(200);
      const c = await page.evaluate(() => {
        let trunc = 0, total = 0;
        for (const el of document.querySelectorAll("#dc-stage span, #dc-stage a, #dc-stage div")) {
          if (el.children.length || !el.textContent.trim()) continue;
          total++;
          if (el.scrollWidth > el.clientWidth + 2) trunc++;
        }
        return total ? trunc / total : 0;
      });
      if (c > worst) { worst = c; worstPage = String(i + 1); }
    }
    if (worst > 0.2) throw new Error(`page ${worstPage} truncated=${(worst * 100).toFixed(0)}%（碎片布局/窄文本截断）`);
  });
  await step("asset-refs", async () => {
    if (!values.run) return;
    const viewsDir = path.join(values.run, "prototype/views");
    const assetsDir = path.join(values.run, "prototype/assets");
    const missing = [];
    if (fs.existsSync(viewsDir)) for (const f of fs.readdirSync(viewsDir)) {
      if (!f.endsWith(".html")) continue;
      const html = fs.readFileSync(path.join(viewsDir, f), "utf8");
      for (const m of html.matchAll(/src="assets\/([^"']+)"/g)) {
        if (!fs.existsSync(path.join(assetsDir, m[1]))) missing.push(f + ":" + m[1]);
      }
    }
    if (missing.length) throw new Error(missing.length + " missing asset refs: " + missing.slice(0, 4).join(","));
  });
  await step("icon-render", async () => {
    const btns = page.locator("#dc-pages button");
    const n = await btns.count();
    const bad = [];
    for (let i = 0; i < n; i++) {
      await btns.nth(i).click(); await page.waitForTimeout(200);
      const r = await page.evaluate(() => {
        const out = [];
        const st = document.querySelector("#dc-stage");
        const scale = st && st.offsetWidth ? st.getBoundingClientRect().width / st.offsetWidth : 1;
        for (const im of document.querySelectorAll("#dc-stage .da-rail img, #dc-stage .da-cards img, #dc-stage .ric")) {
          const rect = im.getBoundingClientRect();
          const w = rect.width / (scale || 1), h = rect.height / (scale || 1);
          if (!im.naturalWidth || w < 14 || h < 14) { out.push(im.src.split("/").pop()); continue; }
          const c = document.createElement("canvas"); c.width = 8; c.height = 8;
          const cx = c.getContext("2d");
          try { cx.drawImage(im, 0, 0, 8, 8); const d = cx.getImageData(0, 0, 8, 8).data; let mn = 255, mx = 0; for (let k = 0; k < d.length; k += 4) { const l = (d[k] + d[k + 1] + d[k + 2]) / 3; mn = Math.min(mn, l); mx = Math.max(mx, l); } if (mx - mn < 12) out.push(im.src.split("/").pop() + ":flat"); } catch {}
        }
        return out;
      });
      if (r.length) bad.push(i + 1 + ":" + r[0]);
    }
    if (bad.length) throw new Error(bad.length + " icon-render issues: " + bad.slice(0, 4).join(","));
  });
  await step("asset-qa", async () => {
    if (scopeMode !== "full") return;
    let qa = null;
    if (values.run) { try { qa = JSON.parse(fs.readFileSync(path.join(values.run, "prototype/assets-qa.json"), "utf8")).assets; } catch {} }
    const btns = page.locator("#dc-pages button");
    const n = await btns.count();
    const bad = [];
    for (let i = 0; i < n; i++) {
      await btns.nth(i).click(); await page.waitForTimeout(200);
      const refs = await page.evaluate(() => [...document.querySelectorAll("#dc-stage img")].map((im) => (im.getAttribute("src") || "").match(/assets\/([^"']+)/)?.[1]).filter(Boolean));
      for (const r of refs) {
        if (!qa) continue;
        const q = qa[r];
        if (q && q.verdict === "fail") bad.push(r);
      }
    }
    if (bad.length) throw new Error(bad.length + " assets-failqa: " + [...new Set(bad)].join(","));
  });
}

await step("shell-v4", async () => {
  for (const sel of ["#dc-rail [data-ia=pages]", "#dc-rail [data-ia=scene]", "#dc-pages button", "#dc-bottombar", "#dc-boardhead", "#dc-export-btn", "#dc-frame-toggle", "#dc-viewmode", "#dc-device-btn"])
    await page.waitForSelector(sel, { timeout: 3000 });
});

for (const theme of ["light", "dark"]) {
  await step("theme-" + theme, async () => {
    await page.evaluate((t) => { localStorage.setItem("dc-theme", t); document.documentElement.dataset.theme = t; }, theme);
    await page.waitForTimeout(150);
    if ((await page.evaluate(() => document.documentElement.dataset.theme)) !== theme) throw new Error("theme");
    await shot(theme);
  });
}
await step("theme-toggle", async () => {
  const b = await page.evaluate(() => document.documentElement.dataset.theme);
  await page.click("#dc-theme");
  if ((await page.evaluate(() => document.documentElement.dataset.theme)) === b) throw new Error("no-op");
  await page.click("#dc-theme");
});

await step("url-crumb-sync", async () => {
  await page.locator("#dc-pages [data-nav]").nth(0).click();
  await page.waitForTimeout(400);
  const h1 = await page.evaluate(() => location.hash);
  if (!/^#pages\//.test(h1)) throw new Error("hash not pages/: " + h1);
  const c1 = await page.textContent("#dc-crumb");
  const btns = page.locator("#dc-pages [data-nav]");
  if ((await btns.count()) > 1) { await btns.nth(1).click(); await page.waitForTimeout(400); }
  const h2 = await page.evaluate(() => location.hash);
  const c2 = await page.textContent("#dc-crumb");
  if (h2 === h1 && (await btns.count()) > 1) throw new Error("hash unchanged");
  if (c2 === c1 && (await btns.count()) > 1) throw new Error("crumb unchanged");
  await page.locator("#dc-pages [data-nav]").nth(0).click();
  await page.waitForTimeout(300);
});

await step("pages-nav+detail-board", async () => {
  const btns = page.locator("#dc-pages [data-nav]");
  if ((await btns.count()) < 1) throw new Error("no pages");
  await btns.nth(0).click();
  await page.waitForTimeout(500);
  const txt = await page.textContent("#dc-board-detail");
  if (!/功能|再生成提示词/.test(txt)) throw new Error("detail board empty");
});

await step("detail-design-section", async () => {
  const has = await page.evaluate(() => !!document.querySelector("#dc-stage [data-dc]:not([data-goto])"));
  if (!has) { ok("detail-design-section", true, "run 无 data-dc 标注（设计看板空，demo 可接受）"); R.checks["detail-design-section"].warn = true; return; }
  await page.evaluate(() => {
    const t = document.querySelector('#dc-stage [data-dc]:not([data-goto])') || document.querySelector("#dc-stage [data-dc]");
    t.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await page.waitForTimeout(300);
  const txt = await page.textContent("#dc-board-detail");
  if (!/选中元素|背景|圆角/.test(txt)) throw new Error("design section not filled");
});

await step("edit-toggle+undo-restore", async () => {
  const has = await page.evaluate(() => !!document.querySelector("#dc-stage [data-dc]:not([data-goto])"));
  if (!has) { ok("edit-toggle+undo-restore", true, "run 无 data-dc 标注，跳过编辑态断言"); R.checks["edit-toggle+undo-restore"].warn = true; return; }
  await page.click("#dc-edit");
  if (!(await page.evaluate(() => document.querySelector("#dc-edit").classList.contains("on")))) throw new Error("edit on");
  await page.waitForTimeout(200);
  const ro = await page.evaluate(() => {
    const i = document.querySelector('#dc-board-detail input.dc-inp[data-sk="borderRadius"]');
    return i ? i.hasAttribute("readonly") : null;
  });
  if (ro !== false) throw new Error("should be editable in edit mode");
  await page.click("#dc-read");
  await page.click("#dc-undo");
  await page.click("#dc-restore");
  await page.waitForSelector("#dc-modal-root .dc-modal", { timeout: 3000 });
  await page.click("#dc-modal-root .acts button:not(.pr)");
});

await step("annotations-toggle+count", async () => {
  await page.click("#dc-ann-toggle");
  await page.waitForTimeout(300);
  await shot("ann");
  await page.click("#dc-ann-toggle");
});

await step("frame-toggle", async () => {
  await page.click("#dc-frame-toggle");
  await page.waitForTimeout(200);
  if (!(await page.evaluate(() => document.body.classList.contains("dc-framed")))) throw new Error("framed class");
  await shot("framed");
  await page.click("#dc-frame-toggle");
});

await step("scene-tree-canvas", async () => {
  await page.click("#dc-rail [data-ia=scene]");
  await page.waitForTimeout(1800);
  const cards = await page.locator(".fc-card").count();
  if (cards < 1) throw new Error("no flow cards");
  const hash = await page.evaluate(() => location.hash);
  if (!/^#scene\//.test(hash)) throw new Error("scene hash: " + hash);
  await shot("tree");
  await page.evaluate(() => Promise.race([
    Promise.all([...document.querySelectorAll("#dc-flow-canvas iframe")].map((f) => new Promise((r) => { f.addEventListener("load", r, { once: true }); f.addEventListener("error", r, { once: true }); }))),
    new Promise((r) => setTimeout(r, 3000)),
  ]));
});

await step("scene-zoom", async () => {
  const b = parseInt(await page.textContent("#dc-zoom-pct"));
  await page.click("#dc-zoom-in");
  const a = parseInt(await page.textContent("#dc-zoom-pct"));
  if (!(a > b)) throw new Error(`scene zoom ${b}->${a}`);
  await page.click("#dc-zoom-fit");
});

await step("scene-path-mode", async () => {
  // M45：选一个"真有出向路径"的节点再断言（默认 root 可能无路径，如 hub 型站点）；全 run 无路径则降级 warn
  let nodeWithPaths = null;
  if (values.run) {
    try {
      const P = JSON.parse(fs.readFileSync(path.join(values.run, "prototype/paths.json"), "utf8"));
      nodeWithPaths = Object.entries(P.perNode || {}).find(([, n]) => (n.paths || []).some((p) => (p || []).length));
      nodeWithPaths = nodeWithPaths ? nodeWithPaths[0] : null;
    } catch {}
  }
  if (!nodeWithPaths) { ok("scene-path-mode", true, "run 无可用出向路径，跳过"); R.checks["scene-path-mode"].warn = true; return; }
  await page.goto(base + "/prototype/?t=" + Date.now() + "#scene/path/" + nodeWithPaths, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(900);
  if ((await page.locator(".fc-chain").count()) < 1) throw new Error("no path chain");
  if ((await page.locator(".fc-chain .fc-card").count()) < 2) throw new Error("chain too short");
  if ((await page.locator(".wires path.band.flow-loop").count()) < 1) throw new Error("no flow-loop band");
  const chips = await page.locator(".fc-chip").count();
  if (chips > 1) { await page.locator(".fc-chip").nth(1).click(); await page.waitForTimeout(400); }
  const txt = await page.textContent("#dc-board-detail");
  if (!/场景路径|复现/.test(txt)) throw new Error("path detail board");
  await shot("path");
  await page.click("#dc-flow-toggle [data-fm=tree]");
});

await step("play-path", async () => {
  // M45：步骤自包含——先清模态/演示态，再按"有路径节点 > journeys 回退"起播；三种反应都算通过
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  const hasJourneys = await page.evaluate(() => window.__dcJourneys || 0);
  let nodeWithPaths = null;
  if (values.run) {
    try {
      const P = JSON.parse(fs.readFileSync(path.join(values.run, "prototype/paths.json"), "utf8"));
      const hit = Object.entries(P.perNode || {}).find(([, n]) => (n.paths || []).some((p) => (p || []).length));
      nodeWithPaths = hit ? hit[0] : null;
    } catch {}
  }
  if (!nodeWithPaths && !hasJourneys) { ok("play-path", true, "无路径且无 journeys，跳过"); R.checks["play-path"].warn = true; return; }
  if (nodeWithPaths) {
    await page.goto(base + "/prototype/?t=" + Date.now() + "#scene/path/" + nodeWithPaths, { waitUntil: "domcontentloaded" });
  } else {
    await page.goto(base + "/prototype/?t=" + Date.now(), { waitUntil: "domcontentloaded" });
  }
  await page.waitForTimeout(900);
  await page.click("#dc-play");
  let reacted = false;
  try { await page.waitForSelector("#dc-player.on", { timeout: 6000 }); reacted = true; }
  catch {
    reacted = (await page.evaluate(() => document.body.classList.contains("dc-demo") ||
      !!document.querySelector("#dc-caption") || !!document.querySelector("#dc-summary") || !!document.querySelector("#dc-modal-root .dc-modal")));
  }
  if (!reacted) {
    const st = await page.evaluate(() => ({ cls: document.body.className, modal: !!document.querySelector("#dc-modal-root .dc-modal"), ia: location.hash, player: !!document.querySelector("#dc-player"), capTxt: ((document.querySelector("#dc-caption") || {}).textContent || "").slice(0, 40) }));
    await shot("play-fail");
    throw new Error("播放无任何反应 " + JSON.stringify(st));
  }
  if (await page.locator("#dc-player.on").count()) { await shot("player"); if (await page.locator("#pp-end").count()) await page.click("#pp-end"); }
  else { await shot("player"); await page.keyboard.press("Escape"); await page.waitForTimeout(300); await page.keyboard.press("Escape"); }
  await page.waitForTimeout(300);
});

await step("demo", async () => {
  if (!(await page.evaluate(() => window.__dcJourneys || 0))) { ok("demo", true, "无 journeys，跳过"); return; }
  // 若上一步的回退演示仍在跑，先退出，保证本步从干净状态起
  if (await page.evaluate(() => document.body.classList.contains("dc-demo"))) { await page.keyboard.press("Escape"); await page.waitForTimeout(400); }
  await page.locator("#dc-workspace").click({ position: { x: 4, y: 4 } }).catch(() => {});
  await page.keyboard.press("d");
  if (await page.locator("#dc-modal-root .opt").count()) await page.locator("#dc-modal-root .opt").first().click();
  await page.waitForSelector("#dc-caption", { timeout: 9000 });
  await shot("demo");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
});

await step("code-view", async () => {
  // M47：与当前页状态解耦——先落到列表首页再验，避免前置步骤留下的状态造成假失败
  await page.click("#dc-rail [data-ia=pages]");
  await page.waitForTimeout(300);
  await page.locator("#dc-pages [data-nav]").first().click();
  await page.waitForTimeout(500);
  await page.click("#dc-viewmode [data-vm=code]");
  try { await page.waitForFunction(() => ((document.querySelector("#dc-code-pre") || {}).textContent || "").length > 20, null, { timeout: 4000 }); }
  catch { throw new Error("code empty"); }
  await page.click("#dc-viewmode [data-vm=preview]");
});

await step("zoom-hand", async () => {
  const before = parseInt(await page.textContent("#dc-zoom-pct"));
  await page.click("#dc-zoom-in");
  const pct = parseInt(await page.textContent("#dc-zoom-pct"));
  if (!(pct > before)) throw new Error("zoom " + before + "->" + pct);
  await page.click("#dc-zoom-fit");
  await page.click("#dc-hand"); await page.click("#dc-hand");
});

await step("export-menu-two", async () => {
  await page.click("#dc-export-btn");
  // M45 新契约：方式档(data-m)恰好 3 + 范围项(data-x) 1–2 且首项=导出全部（ADR-048 取代 A42 的"恰两项"）
  const nm = await page.locator("#dc-export-dd [data-m]").count();
  const n = await page.locator("#dc-export-dd [data-x]").count();
  const first = await page.locator("#dc-export-dd [data-x]").first().textContent();
  await shot("export");
  await page.click("#dc-export-btn");
  if (nm !== 3) throw new Error(`export modes ${nm} (应 3)`);
  if (n < 1 || n > 2 || !/导出全部/.test(first)) throw new Error(`export items ${n}: ${first}`);
});

await step("tweaks-zone", async () => {
  await page.click("#dc-board-detail summary");
  await page.waitForTimeout(200);
  const n = await page.locator("#dc-tw-zone [data-tk]").count();
  if (n < 3) throw new Error("tweaks inputs");
});

await step("compare-chain", async () => {
  // M47：先落到有列表首页（必有 capture 配对概率最高），并等回退链走完再判定
  await page.locator("#dc-pages [data-nav]").first().click();
  await page.waitForTimeout(500);
  await page.click("#dc-compare-btn");
  try {
    await page.waitForFunction(() => {
      const img = document.querySelector("#dc-compare-body img");
      return !!document.querySelector("#dc-compare .miss") || (img && img.complete && img.naturalWidth > 0);
    }, null, { timeout: 6000 });
  } catch { throw new Error("compare broken img"); }
  await shot("compare");
  await page.click("#dc-compare-x");
});

await step("no-emoji-ui", async () => {
  const bad = await page.evaluate(() => {
    const re = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
    return [...document.querySelectorAll("#dc-stage a, #dc-stage button, #dc-stage span, #dc-stage div")].filter((n) => {
      if (n.querySelector("svg, img")) return false;
      if (n.closest("[data-emoji-ok]")) return false; // 内容型 emoji（聊天/表情选择）豁免
      const t = (n.childNodes.length === 1 && n.firstChild.nodeType === 3) ? n.textContent.trim() : "";
      return t && re.test(t);
    }).length;
  });
  let scope = "demo"; try { scope = (JSON.parse(fs.readFileSync(path.join(values.run, "knowledge/scope.json"), "utf8")).scope) || "demo"; } catch {}
  if (bad && scope === "full") throw new Error(bad + " emoji glyphs（full 禁 emoji 作 UI/内容：换 inline SVG 或文字）");
  if (bad) { ok("no-emoji-ui", true, bad + " emoji glyphs（demo 仅 warn）"); R.checks["no-emoji-ui"].warn = true; }
});

// M44f 布局 sanity（通用硬门，逐页）：元素级裁切 / 空槽 / 坏图 / 视图内重复窗口 chrome
await step("layout-sanity", async () => {
  const btns = page.locator("#dc-pages button");
  const n = await btns.count();
  const all = [];
  for (let i = 0; i < n; i++) {
    await btns.nth(i).click(); await page.waitForTimeout(220);
    const r = await page.evaluate(() => {
    const out = { clipped: [], empty: [], broken: [], chrome: 0 };
    const stage = document.querySelector("#dc-stage");
    if (!stage) return out;
    const desktop = document.body.classList.contains("dc-desktop");
    const dots = [...stage.querySelectorAll("span,i,div")].filter((n) => { const cs = getComputedStyle(n); return cs.borderRadius === "50%" && /255,\s*95,\s*87|254,\s*188,\s*46|40,\s*200,\s*64/.test(cs.backgroundColor); });
    if (desktop && dots.length >= 3) out.chrome = dots.length;
    for (const el of stage.querySelectorAll("*")) {
      const cs = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4) continue;
      const scrollable = /auto|scroll/.test(cs.overflowX + cs.overflowY);
      const ellipsis = cs.textOverflow === "ellipsis";
      if (!scrollable && !ellipsis && (el.textContent || "").trim() &&
        (el.scrollWidth - el.clientWidth > 8 || el.scrollHeight - el.clientHeight > 8)) {
        if (out.clipped.length < 5) out.clipped.push((el.getAttribute("data-dc") || el.tagName) + ":" + (el.textContent || "").trim().slice(0, 12));
      }
      const transparent = /rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor);
      const tapCatcher = transparent && (el.hasAttribute("data-goto") || el.hasAttribute("data-act"));
      const rgba = cs.backgroundColor.match(/rgba\([^)]*,\s*([0-9.]+)\)/);
      const scrim = (cs.position === "absolute" || cs.position === "fixed") && rgba && parseFloat(rgba[1]) < 0.6;
      const decorative = cs.borderRadius === "50%" || /gradient/.test(cs.backgroundImage);
      // M47：源忠实空态（未选会话的空主区等）用 data-placeholder-ok 显式声明后豁免
      const intentional = el.hasAttribute("data-placeholder-ok") || !!el.closest("[data-placeholder-ok],[data-state=loading]");
      if (!tapCatcher && !scrim && !decorative && !intentional && el.children.length === 0 && !(el.textContent || "").trim() &&
        !cs.backgroundImage.includes("url") && el.tagName !== "IMG" &&
        rect.width >= 120 && rect.height >= 120) {
        if (out.empty.length < 5) out.empty.push((el.getAttribute("data-dc") || el.className || el.tagName) + ":" + Math.round(rect.width) + "x" + Math.round(rect.height));
      }
      if (el.tagName === "IMG" && el.complete && el.naturalWidth === 0) {
        if (out.broken.length < 5) out.broken.push(el.getAttribute("src") || "?");
      }
    }
    return out;
    });
    const tag = (i + 1);
    if (r.clipped.length) all.push("p" + tag + " clipped:" + r.clipped.join(","));
    if (r.empty.length) all.push("p" + tag + " empty-slot:" + r.empty.join(","));
    if (r.broken.length) all.push("p" + tag + " broken-img:" + r.broken.join(","));
    if (r.chrome) all.push("p" + tag + " in-view-window-chrome(shell已提供)=" + r.chrome);
  }
  if (all.length) {
    let scope = "demo"; try { scope = (JSON.parse(fs.readFileSync(path.join(values.run, "knowledge/scope.json"), "utf8")).scope) || "demo"; } catch {}
    if (scope === "full") throw new Error(all.slice(0, 6).join(" | "));
    ok("layout-sanity", true, "demo warn: " + all.slice(0, 4).join(" | ")); R.checks["layout-sanity"].warn = true;
  }
});

await stepw("assets-exist", async () => {
  const bad = await page.evaluate(() => [...document.querySelectorAll("#dc-stage img")].filter((i) => i.src && !i.complete || (i.complete && i.naturalWidth === 0)).map((i) => i.src.split("/").pop()).join(","));
  if (bad) throw new Error("broken: " + bad);
});

await step("no-h-overflow", async () => {
  const btns = page.locator("#dc-pages button");
  const n = await btns.count();
  const bad = [];
  for (let i = 0; i < n; i++) {
    await btns.nth(i).click(); await page.waitForTimeout(220);
    const o = await page.evaluate(() => {
      const s = document.querySelector("#dc-stage");
      const sc = document.querySelector("#dc-screen");
      return Math.max(s.scrollWidth - s.clientWidth, sc.scrollWidth - sc.clientWidth);
    });
    if (o > 2) bad.push((i + 1) + ":" + o + "px");
  }
  if (bad.length) throw new Error(bad.length + " 视图横向溢出（390 宽装不下，需换行/收缩）: " + bad.slice(0, 5).join(","));
});

await step("interactive-controls", async () => {
  let scope = "demo";
  if (values.run) { try { scope = (JSON.parse(fs.readFileSync(path.join(values.run, "knowledge/scope.json"), "utf8")).scope) || "demo"; } catch {} }
  if (scope !== "full") return;
  const f = values.run ? path.join(values.run, "qa/interact.json") : null;
  if (!f || !fs.existsSync(f)) throw new Error("interact-not-run（跑 qa/interact.mjs --run <run> --base <url>，M44 交互门）");
  const ia = JSON.parse(fs.readFileSync(f, "utf8"));
  const bad = Object.entries(ia).filter(([k, v]) => v.error || (v.dead && v.dead.length) || v.act_pass < 1 || v.goto_pass < 1)
    .map(([k, v]) => k + "(dead=" + ((v.dead || []).length) + (v.act_pass < 1 ? ",act=" + v.act_pass.toFixed(2) : "") + (v.goto_pass < 1 ? ",goto" : "") + ")");
  if (bad.length) throw new Error(bad.length + " 视图存在死控件/无响应（每个控件点击必须有可观测反应）: " + bad.slice(0, 5).join(","));
});

await step("unstyled-view-classes", async () => {
  // M48：视图"带类却无任何视觉处理"=静默坏块（link-xhs5 教训）。 styled 判定三选一：
  // inline style / 任一 class 有 CSS 规则（选择器词边界匹配，含后代选择器）/ computed 有视觉处理
  const st = await page.evaluate(() => {
    const cache = {};
    const hasRule = (cls) => {
      if (cls in cache) return cache[cls];
      const sel = "." + CSS.escape(cls);
      const rx = new RegExp("(^|[,:\\s])" + sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([^a-zA-Z0-9_-]|$)");
      let hit = false;
      for (const sh of document.styleSheets) {
        let rules; try { rules = sh.cssRules; } catch { continue; }
        for (const r of rules) { if (r.selectorText && rx.test(r.selectorText)) { hit = true; break; } }
        if (hit) break;
      }
      return (cache[cls] = hit);
    };
    let withCls = 0, unstyled = 0;
    for (const n of document.querySelectorAll("#dc-stage [class]")) {
      if (n.closest(".dc-statusbar")) continue;
      const cls = [...n.classList].filter((c) => !/^(on|active|sel|ld|show)$/.test(c));
      if (!cls.length) continue;
      withCls++;
      const cs = getComputedStyle(n);
      const treated = (n.getAttribute("style") || "") !== "" ||
        cs.backgroundColor !== "rgba(0, 0, 0, 0)" || cs.borderRadius !== "0px" ||
        cs.padding !== "0px" || /flex|grid/.test(cs.display) || cs.boxShadow !== "none";
      if (!treated && cls.every((c) => !hasRule(c))) unstyled++;
    }
    return { withCls, unstyled };
  });
  if (st.withCls >= 8 && st.unstyled / st.withCls > 0.5) throw new Error(`视图 ${st.unstyled}/${st.withCls} 带类元素无 CSS 规则（缺样式表）`);
});

await step("view-weight-budget", async () => {
  // M48：视图文本字重预算 <=600（700/800 在 CJK 下观感=黑粗；OS 状态栏保真豁免）
  const bad = await page.evaluate(() => {
    const out = [];
    for (const n of document.querySelectorAll("#dc-stage *")) {
      if (n.closest(".dc-statusbar")) continue;
      const t = (n.childNodes.length === 1 && n.firstChild && n.firstChild.nodeType === 3) ? n.textContent.trim() : "";
      if (!t) continue;
      const w = parseInt(getComputedStyle(n).fontWeight, 10) || 400;
      if (w > 600 && out.length < 6) out.push((n.className || n.tagName).toString().slice(0, 20) + ":" + w);
    }
    return out;
  });
  if (bad.length) throw new Error(bad.length + " 处视图文本字重>600: " + bad.slice(0, 4).join(","));
});

await step("privacy-anon", async () => {
  if (!values.run) return;
  const r = spawnSync("node", [path.join(HERE, "privacy.mjs"), "--run", values.run], { encoding: "utf8" });
  let j = {}; try { j = JSON.parse((r.stdout || "").trim().split("\n").pop()); } catch {}
  if (j.configured === false) {
    let scope = "demo"; try { scope = (JSON.parse(fs.readFileSync(path.join(values.run, "knowledge/scope.json"), "utf8")).scope) || "demo"; } catch {}
    if (scope === "full") throw new Error("privacy-not-configured（full 必须有 knowledge/privacy.json：跑 qa/privacy.mjs --discover 起草）");
    ok("privacy-anon", true, "demo 无 privacy.json（建议 --discover 起草）"); R.checks["privacy-anon"].warn = true; return;
  }
  if (!j.ok) {
    const parts = [];
    if ((j.leaks || []).length) parts.push("真名泄露:" + j.leaks.slice(0, 3).map((l) => l.key + "@" + l.file).join(","));
    if ((j.pii || []).length) parts.push("PII:" + j.pii.slice(0, 3).map((p) => p.hit + "@" + p.file).join(","));
    if ((j.face_bad || []).length) parts.push("真人脸未虚构:" + j.face_bad.slice(0, 3).map((f) => f.asset).join(","));
    throw new Error(parts.join(" | ") || "privacy fail");
  }
});

await step("appicon-present", async () => {
  if (!values.run) return;
  let scope = "demo"; try { scope = (JSON.parse(fs.readFileSync(path.join(values.run, "knowledge/scope.json"), "utf8")).scope) || "demo"; } catch {}
  const icon = path.join(values.run, "prototype/appicon/icon-256.png");
  const sc = path.join(values.run, "knowledge/showcase.json");
  const miss = [];
  if (!fs.existsSync(icon)) miss.push("appicon/icon-256.png");
  if (!fs.existsSync(sc)) miss.push("knowledge/showcase.json");
  if (miss.length) {
    if (scope === "full") throw new Error("缺应用图标/展示清单（展示网站契约）: " + miss.join(",") + " → node gen/appicon.mjs --run <run>");
    ok("appicon-present", true, "demo warn: 缺 " + miss.join(",")); R.checks["appicon-present"].warn = true;
  }
});

await step("paths-sanity", async () => {
  if (!values.run) return;
  const r = spawnSync("node", [path.join(HERE, "paths-qa.mjs"), values.run], { encoding: "utf8" });
  let j = {}; try { j = JSON.parse((r.stdout || "").trim().split("\n").pop()); } catch {}
  if ((j.hard || []).length) throw new Error("路径决策违反真实交互逻辑: " + j.hard.slice(0, 3).join(","));
  if ((j.warn || []).length) { ok("paths-sanity", true, "warn: " + j.warn.slice(0, 3).join(",")); R.checks["paths-sanity"].warn = true; }
});

await step("structural-critique", async () => {
  if (!values.run) return;
  // M46：桌面/网页壳的 run 及格线抬到 4 + 全视图必评 + notes 必须带证据（简陋页不再靠 3 分蒙混）
  const args = [path.join(HERE, "critique.mjs"), "--run", values.run];
  let plat = "";
  try { plat = JSON.stringify(JSON.parse(fs.readFileSync(path.join(values.run, "knowledge/platform.json"), "utf8"))); } catch {}
  let scopeMode = "demo";
  try { scopeMode = (JSON.parse(fs.readFileSync(path.join(values.run, "knowledge/scope.json"), "utf8")).scope) || "demo"; } catch {}
  if (scopeMode === "full" && /desktop|browser|web/.test(plat)) args.push("--min-layout", "4", "--all-views", "--require-evidence");
  const r = spawnSync("node", args, { encoding: "utf8" });
  let j = {}; try { j = JSON.parse((r.stdout || "").trim().split("\n").pop()); } catch {}
  if (j.missing) {
    if (j.scope === "full") throw new Error("critique-not-run（full 必须 VLM 对照并排图逐视图打 layout 分：qa/critique.mjs --skeleton 后 --set 填写；pixelmatch/recall 抓不到缺栏/错页）");
    ok("structural-critique", true, "demo 无 critique.json（建议补）"); R.checks["structural-critique"].warn = true; return;
  }
  if (!j.ok) throw new Error("结构 critique 不达标: " + (j.bad || []).join(","));
});

// M46 硬门：空色块占位（capture 有图/有图标而视图放空色块）——"简陋/不像"的最直接信号。
// 规则通用：stage 内 ≥28×28、无文本、无 img、无背景图的实底色块 = 占位嫌疑；loading 骨架豁免。
await step("placeholder-blocks", async () => {
  const bad = await page.evaluate(() => {
    const out = [];
    for (const n of document.querySelectorAll("#dc-stage div, #dc-stage span, #dc-stage section, #dc-stage a, #dc-stage li")) {
      if (n.closest("[data-state=loading], [data-placeholder-ok]")) continue;
      const r = n.getBoundingClientRect();
      if (r.width < 28 || r.height < 28) continue;
      if ((n.textContent || "").trim()) continue;
      if (n.querySelector("img, svg, video, canvas")) continue;
      const cs = getComputedStyle(n);
      if (cs.backgroundImage !== "none") continue;
      const bg = cs.backgroundColor;
      if (bg === "rgba(0, 0, 0, 0)" || bg === "transparent") continue;
      // 模态 scrim（absolute/fixed + 半透明）不是占位色块（与 layout-sanity 同口径）
      const rgba = bg.match(/rgba\([^)]*,\s*([0-9.]+)\)/);
      if ((cs.position === "absolute" || cs.position === "fixed") && rgba && parseFloat(rgba[1]) < 0.6) continue;
      if (n.children.length) continue; // 有子元素说明是容器而非色块
      out.push((n.getAttribute("data-dc") || n.className || n.tagName).toString().slice(0, 40) + `@${Math.round(r.width)}x${Math.round(r.height)}`);
    }
    return out;
  });
  if (bad.length) throw new Error(bad.length + " 空色块占位: " + bad.slice(0, 5).join(","));
});

// M44k 外壳冒烟门：真点播放/导出/分享/设备/标注写回，并锁画布标签排版。
// 此前所有门只覆盖"原型内容"，外壳功能退化（播放静默、导出不下载、标签太粗）门全绿，故补此硬门。
// --fast：不跑真实导出下载（regress 会单独跑全量，含下载），控制单 run 门时长。
await step("ui-smoke", async () => {
  if (!values.run) return;
  const runDir = path.resolve(values.run);
  const r = spawnSync("node", [path.join(HERE, "ui-smoke.mjs"), "--run", runDir, "--base", base, "--fast", "--out", path.join(runDir, "qa/ui-smoke.json")], { encoding: "utf8", timeout: 240000 });
  let j = {};
  try { j = JSON.parse((r.stdout || "").trim().split("\n").pop()); } catch {}
  if (!j || j.fail) throw new Error("外壳冒烟门失败: " + (((j || {}).summary || {}).bad || ["no-output"]).join(","));
  ok("ui-smoke", true, `${j.pass} 项通过`);
});

// M45：utility 编译覆盖（warn 级）。"长得像 utility 却编译不出且任何样式源都没定义"=疑似笔误（实战：gap8 静默失效）
await stepw("utility-coverage", async () => {
  if (!values.run) return;
  const probe = path.join(shots, "utilities-probe.css");
  const r = spawnSync("node", [path.join(HERE, "..", "gen", "utility-css.mjs"), "--run", values.run, "--out", probe], { encoding: "utf8" });
  let j = {};
  try { j = JSON.parse((r.stdout || "").trim().split("\n").pop()); } catch {}
  if ((j.unknownCount || 0) > 0) throw new Error("疑似笔误 utility: " + (j.unknown || []).slice(0, 6).join(","));
  return `${j.compiled} rules / ${j.bytes}B`;
});

await stepw("contrast", async () => {
  const bad = await page.evaluate(() => {
    const cv = document.createElement("canvas"); cv.width = cv.height = 1;
    const cx = cv.getContext("2d", { willReadFrequently: true });
    const lum = (c) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = "#fff"; cx.fillRect(0, 0, 1, 1); cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(d[0]) + 0.7152 * f(d[1]) + 0.0722 * f(d[2]); };
    let bad = 0;
    for (const n of [...document.querySelectorAll("#dc-stage *")].slice(0, 300)) {
      if (!n.textContent.trim() || n.children.length) continue;
      const cs = getComputedStyle(n);
      if (parseFloat(cs.fontSize) > 18) continue;
      const layers = [];
      let p = n, hasImg = false;
      while (p && p !== document.documentElement) { const cs2 = getComputedStyle(p); if (cs2.backgroundImage !== "none") hasImg = true; const b = cs2.backgroundColor; if (b !== "rgba(0, 0, 0, 0)") layers.push(b); p = p.parentElement; }
      if (hasImg) continue;
      cx.clearRect(0, 0, 1, 1); cx.fillStyle = "#fff"; cx.fillRect(0, 0, 1, 1);
      for (const c of layers.reverse()) { cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); }
      const d = cx.getImageData(0, 0, 1, 1).data;
      if (d[3] < 200) continue;
      const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      const lb = 0.2126 * f(d[0]) + 0.7152 * f(d[1]) + 0.0722 * f(d[2]);
      const r = (lum(cs.color) + 0.05) / (lb + 0.05);
      if (Math.max(r, 1 / r) < 4.5) bad++;
    }
    return bad;
  });
  if (bad) throw new Error(bad + " low-contrast nodes");
});

await stepw("privacy-scan", async () => {
  const bad = await page.evaluate(() => {
    const res = [];
    const re = [/1[3-9]\d{9}/, /wxid_[a-z0-9_]+/i, /微信号[:：]/, /[\w.+-]+@[\w-]+\.(com|cn|net|org)/i, /\d{17}[\dXx]/];
    for (const n of [...document.querySelectorAll("#dc-stage *")].slice(0, 400)) {
      if (n.children.length) continue;
      const t = (n.textContent || "").trim();
      if (!t) continue;
      for (const r of re) if (r.test(t)) { res.push(t.slice(0, 20)); break; }
    }
    return res;
  });
  if (bad.length) throw new Error(bad.length + " privacy hits: " + bad.slice(0, 3).join(","));
});

await stepw("overlap-audit", async () => {
  const bad = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll("#dc-stage [data-dc]")].filter((n) => getComputedStyle(n).position !== "absolute");
    let bad = 0;
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i].getBoundingClientRect(), b = nodes[j].getBoundingClientRect();
      if (nodes[i].contains(nodes[j]) || nodes[j].contains(nodes[i])) continue;
      const ix = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
      const iy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      const ia = ix * iy, min = Math.min(a.width * a.height, b.width * b.height);
      if (min > 0 && ia / min > 0.35) bad++;
    }
    return bad;
  });
  if (bad) throw new Error(bad + " overlaps");
});

await page.waitForLoadState("networkidle").catch(() => {});
await page.waitForTimeout(400);
await browser.close();
const hard = Object.values(R.checks).filter((c) => !c.warn);
const soft = Object.values(R.checks).filter((c) => c.warn);
R.summary = {
  pass: hard.filter((c) => c.pass).length,
  fail: hard.filter((c) => !c.pass).length,
  warnFail: soft.filter((c) => !c.pass).length,
  warnPass: soft.filter((c) => c.pass).length,
  consoleErrors: R.consoleErrors.length, pageErrors: R.pageErrors.length,
};
fs.writeFileSync(path.join(shots, `qa-${name}.json`), JSON.stringify(R, null, 2));
if (values.run) {
  const qd = path.join(path.resolve(values.run), "qa");
  fs.mkdirSync(qd, { recursive: true });
  fs.writeFileSync(path.join(qd, "inspect.json"), JSON.stringify(R, null, 2));
}
console.log(JSON.stringify(R.summary));
process.exit(R.summary.fail || R.pageErrors.length ? 2 : 0);
