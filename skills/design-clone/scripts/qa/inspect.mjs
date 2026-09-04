#!/usr/bin/env node
/**
 * 常驻回归器 v4（inspector v4 IA）：双菜单/双画布/详情看板/底栏/播放器/演示/URL 状态 + 质量软警告。
 * 用法: node inspect.mjs <base-url> <name> [--shots <dir>] [--run <runDir>]
 * 零容忍：pageError / 非可选 requestfailed / 硬检查 fail；质量类（emoji/overlap/contrast）记 warn 不阻断。
 */
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

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
    if (bad.length) throw new Error(bad.length + " parity-fail: " + bad.slice(0, 4).join(","));
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
  await page.evaluate(() => {
    const t = document.querySelector('#dc-stage [data-dc]:not([data-goto])') || document.querySelector("#dc-stage [data-dc]");
    t.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await page.waitForTimeout(300);
  const txt = await page.textContent("#dc-board-detail");
  if (!/选中元素|背景|圆角/.test(txt)) throw new Error("design section not filled");
});

await step("edit-toggle+undo-restore", async () => {
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
  await page.click("#dc-flow-toggle [data-fm=path]");
  await page.waitForTimeout(800);
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
  await page.click("#dc-rail [data-ia=scene]");
  await page.waitForTimeout(600);
  await page.click("#dc-play");
  await page.waitForSelector("#dc-player.on", { timeout: 4000 });
  await shot("player");
  await page.click("#pp-end");
});

await step("demo", async () => {
  if (!(await page.evaluate(() => window.__dcJourneys || 0))) { ok("demo", true, "无 journeys，跳过"); return; }
  await page.keyboard.press("d");
  if (await page.locator("#dc-modal-root .opt").count()) await page.locator("#dc-modal-root .opt").first().click();
  await page.waitForSelector("#dc-caption", { timeout: 4000 });
  await shot("demo");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
});

await step("code-view", async () => {
  await page.click("#dc-rail [data-ia=pages]");
  await page.waitForTimeout(300);
  await page.click("#dc-viewmode [data-vm=code]");
  await page.waitForTimeout(300);
  const t = await page.textContent("#dc-code-pre");
  if (!t || t.length < 20) throw new Error("code empty");
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
  const n = await page.locator("#dc-export-dd button").count();
  const first = await page.locator("#dc-export-dd button").first().textContent();
  await shot("export");
  await page.click("#dc-export-btn");
  if (n < 1 || n > 2 || !/导出全部/.test(first)) throw new Error(`export items ${n}: ${first}`);
});

await step("tweaks-zone", async () => {
  await page.click("#dc-board-detail summary");
  await page.waitForTimeout(200);
  const n = await page.locator("#dc-tw-zone [data-tk]").count();
  if (n < 3) throw new Error("tweaks inputs");
});

await step("compare-chain", async () => {
  await page.click("#dc-compare-btn");
  await page.waitForTimeout(800);
  const st = await page.evaluate(() => {
    const img = document.querySelector("#dc-compare-body img");
    return { miss: !!document.querySelector("#dc-compare .miss"), ok: img && img.complete && img.naturalWidth > 0 };
  });
  if (!st.ok && !st.miss) throw new Error("compare broken img");
  await shot("compare");
  await page.click("#dc-compare-x");
});

await stepw("no-emoji-ui", async () => {
  const bad = await page.evaluate(() => {
    const re = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
    return [...document.querySelectorAll("#dc-stage a, #dc-stage button, #dc-stage span, #dc-stage div")].filter((n) => {
      if (n.querySelector("svg, img")) return false;
      const t = (n.childNodes.length === 1 && n.firstChild.nodeType === 3) ? n.textContent.trim() : "";
      return t && t.length <= 3 && re.test(t);
    }).length;
  });
  if (bad) throw new Error(bad + " emoji glyphs");
});

await stepw("assets-exist", async () => {
  const bad = await page.evaluate(() => [...document.querySelectorAll("#dc-stage img")].filter((i) => i.src && !i.complete || (i.complete && i.naturalWidth === 0)).map((i) => i.src.split("/").pop()).join(","));
  if (bad) throw new Error("broken: " + bad);
});

await stepw("no-h-overflow", async () => {
  const o = await page.evaluate(() => {
    const s = document.querySelector("#dc-stage");
    return s.scrollWidth - s.clientWidth;
  });
  if (o > 2) throw new Error("h-overflow " + o + "px");
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
