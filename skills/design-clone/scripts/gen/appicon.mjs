#!/usr/bin/env node
/**
 * appicon.mjs（M44i）：为每个原型根目录生成一组应用图标 + 展示清单（为原型展示网站铺路）。
 *  - cloned：从 capture 自动裁原应用图标（饱和方形块启发式）；找不到回落 generated
 *  - generated：style-pick 场景风格 + genimg 生成（方形、少/无文字、安全后缀）
 *  - 统一后处理：多尺寸 16/32/64/128/256/512 + icon-maskable-512（80% 安全区+底色）
 *  - icon-spec.json：source/mode/base/style/palette/radius/bg/seed/prompt/badge → 用户改 spec 后 --regen 即调整图标
 *  - knowledge/showcase.json：展示网站契约 {id,title,subtitle,platform,shell,source,tags,icon,iconMaskable,cover,views,updatedAt}
 * 用法:
 *   node appicon.mjs --run <runDir> [--mode auto|cloned|generated] [--src <png> --bbox x,y,w,h] [--title <名>]
 *   node appicon.mjs --run <runDir> --regen          # 按 icon-spec.json 重渲染（用户调整后）
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const sharp = require("sharp");
const HERE = path.dirname(new URL(import.meta.url).pathname);
const A = process.argv.slice(2);
const get = (k, d) => (A.includes(k) ? A[A.indexOf(k) + 1] : d);
const run = path.resolve(get("--run", ""));
if (!run || A.includes("--help")) { console.log("用法: node appicon.mjs --run <runDir> [--mode auto|cloned|generated] [--src p --bbox x,y,w,h] [--title t] [--regen]"); process.exit(run ? 0 : 1); }
const mode = get("--mode", "auto");
const regen = A.includes("--regen");
const proto = path.join(run, "prototype");
const outDir = path.join(proto, "appicon");
fs.mkdirSync(outDir, { recursive: true });
const SIZES = [16, 32, 64, 128, 256, 512];

let spec = {};
const specP = path.join(outDir, "icon-spec.json");
if (regen && fs.existsSync(specP)) spec = JSON.parse(fs.readFileSync(specP, "utf8"));

// M62-A：真图标优先链——输入/系统获取（web favicon/manifest、mac icns）先于 autocrop/生成
async function pickSystem() {
  const manual = path.join(run, "knowledge", "source-icon.png");
  if (fs.existsSync(manual)) return { base: manual, how: "system:manual" };
  const scope = (() => { try { return JSON.parse(fs.readFileSync(path.join(run, "knowledge", "scope.json"), "utf8")); } catch { return {}; } })();
  const manifest = (() => { try { return JSON.parse(fs.readFileSync(path.join(run, "capture", "manifest.json"), "utf8")); } catch { return {}; } })();
  const url = manifest.url || "";
  if (/^https?:/.test(url)) {
    try {
      const html = await (await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } })).text();
      const cand = [...html.matchAll(/<link[^>]+rel=["']?(?:apple-touch-icon|icon|shortcut icon)["']?[^>]*>/gi)]
        .map((m) => (m[0].match(/href=["']([^"']+)["']/) || [])[1]).filter(Boolean);
      const manHref = (html.match(/<link[^>]+rel=["']?manifest["']?[^>]*>/i) || [""])[0].match(/href=["']([^"']+)["']/);
      let best = null, bestSize = 0;
      for (const h of cand) {
        const abs = new URL(h, url).href;
        const sz = parseInt((h.match(/-(\d+)x\d+/) || h.match(/\/(\d+)\.png/) || [])[1] || "0", 10);
        if (sz >= bestSize) { bestSize = sz; best = abs; }
      }
      if (manHref) {
        const mj = await (await fetch(new URL(manHref[1], url).href)).json().catch(() => null);
        const ic = (mj?.icons || []).sort((a, b) => parseInt(b.sizes || "0") - parseInt(a.sizes || "0"))[0];
        if (ic) { best = new URL(ic.src, url).href; bestSize = 999; }
      }
      if (best) {
        const buf = Buffer.from(await (await fetch(best)).arrayBuffer());
        const dst = path.join(run, "knowledge", "source-icon.png");
        await sharp(buf).resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(dst);
        return { base: dst, how: "system:web" };
      }
    } catch {}
  }
  if (/mac|desktop/.test(scope.platform || "") && fs.existsSync("/Applications")) {
    const t = String(scope.target || "").toLowerCase();
    for (const app of fs.readdirSync("/Applications").filter((x) => x.endsWith(".app"))) {
      if (t && !app.toLowerCase().includes(t.split(/[-_]/)[0])) continue;
      const res = path.join("/Applications", app, "Contents", "Resources");
      if (!fs.existsSync(res)) continue;
      const icns = fs.readdirSync(res).find((x) => x.endsWith(".icns"));
      if (!icns) continue;
      const dst = path.join(run, "knowledge", "source-icon.png");
      const r = spawnSync("sips", ["-s", "format", "png", path.join(res, icns), "--out", dst], { encoding: "utf8" });
      if (r.status === 0 && fs.existsSync(dst)) return { base: dst, how: "system:mac" };
    }
  }
  return null;
}

async function pickCloned() {
  if (get("--src", null)) {
    const b = get("--bbox", null);
    if (b) { const [x, y, w, h] = b.split(",").map(Number); const t = path.join(outDir, "_base.png"); await sharp(path.resolve(run, get("--src"))).extract({ left: x, top: y, width: w, height: h }).png().toFile(t); return { base: t, how: "manual-bbox" }; }
    return { base: path.resolve(run, get("--src")), how: "manual-src" };
  }
  const tmp = path.join(outDir, "_cand");
  fs.mkdirSync(tmp, { recursive: true });
  const screens = path.join(run, "capture", "screens");
  if (!fs.existsSync(screens)) return null;
  for (const f of fs.readdirSync(screens).filter((x) => x.endsWith(".png")).slice(0, 6)) {
    spawnSync("node", [path.join(HERE, "..", "img", "autocrop-icons.mjs"), path.join(screens, f), tmp, "--min", "48", "--max", "240", "--sat", "0.35", "--prefix", "c-"], { encoding: "utf8" });
  }
  const cands = fs.existsSync(tmp) ? fs.readdirSync(tmp).filter((x) => x.endsWith(".png")) : [];
  let best = null, bestScore = -1;
  for (const c of cands) {
    const m = await sharp(path.join(tmp, c)).metadata();
    const asp = Math.min(m.width, m.height) / Math.max(m.width, m.height);
    if (asp < 0.85) continue;
    const { data, info } = await sharp(path.join(tmp, c)).resize({ width: 32, height: 32 }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    let sat = 0; for (let i = 0; i < 32 * 32; i++) { const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2]; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx && (mx - mn) / mx > 0.4) sat++; }
    const score = asp * 2 + (sat / 1024) * 3 + Math.min(m.width, m.height) / 240;
    if (score > bestScore) { bestScore = score; best = path.join(tmp, c); }
  }
  if (best) { const t = path.join(outDir, "_base.png"); fs.copyFileSync(best, t); return { base: t, how: "autocrop" }; }
  return null;
}

async function genBase() {
  const st = spawnSync("node", [path.join(HERE, "style-pick.mjs"), "--run", run, "--kind", "icon", "--subject", (get("--title", "") || path.basename(run)) + " app icon glyph"], { encoding: "utf8" });
  let P = { style: "flat", prompt: "app icon" }; try { P = JSON.parse(st.stdout.trim()); } catch {}
  const base = path.join(outDir, "_base.png");
  const userPrompt = get("--prompt", null);
  const g = spawnSync("node", [path.join(HERE, "..", "genimg.mjs"), "--style", P.style, "--w", "512", "--h", "512", "--out", base, "--prompt", (userPrompt || P.prompt) + ", single centered emblem on solid brand-color rounded-square background, minimal geometric glyph, no text, no letters"], { encoding: "utf8" });
  if (g.status !== 0 || !fs.existsSync(base)) return null;
  return { base, how: "generated", style: P.style, prompt: P.prompt };
}

async function compose(base, sp) {
  const radius = sp.radius != null ? sp.radius : 0.22;
  for (const s of SIZES) {
    let img = sharp(base).resize({ width: s, height: s, fit: "cover" });
    if (radius > 0) {
      const r = Math.round(s * radius);
      const mask = Buffer.from(`<svg width="${s}" height="${s}"><rect width="${s}" height="${s}" rx="${r}" ry="${r}" fill="#fff"/></svg>`);
      img = img.composite([{ input: mask, blend: "dest-in" }]);
    }
    await img.png().toFile(path.join(outDir, `icon-${s}.png`));
  }
  // maskable: bg + 80% safe icon
  const { data } = await sharp(base).resize({ width: 1, height: 1 }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const bg = sp.bg || `rgb(${data[0]},${data[1]},${data[2]})`;
  const inner = Math.round(512 * 0.8);
  await sharp({ create: { width: 512, height: 512, channels: 3, background: bg } })
    .composite([{ input: await sharp(base).resize({ width: inner, height: inner, fit: "contain" }).png().toBuffer(), left: 32, top: 32 }])
    .png().toFile(path.join(outDir, "icon-maskable-512.png"));
}

let base = null, how = "";
if (regen && spec.base && fs.existsSync(spec.base)) { base = spec.base; how = spec.source || "regen"; }
else {
  if (mode !== "generated") { const sy = await pickSystem(); if (sy) { base = sy.base; how = sy.how; } }
  if (!base && mode !== "generated") { const c = await pickCloned(); if (c) { base = c.base; how = "cloned:" + c.how; } }
  if (!base && mode !== "cloned") { const g = await genBase(); if (g) { base = g.base; how = "generated"; spec.style = g.style; spec.prompt = g.prompt; } }
}
if (!base) { console.log(JSON.stringify({ ok: false, reason: "no icon source" })); process.exit(3); }
// M62-A：画廊三件套之 icon.png（run 根，512）
try { fs.copyFileSync(path.join(outDir, "icon-512.png"), path.join(run, "icon.png")); } catch {}
spec = { ...spec, source: how.startsWith("cloned") ? "cloned" : how.startsWith("system") ? "system" : "generated", icon_how: how, mode, base, radius: spec.radius != null ? spec.radius : 0.22, generated_at: new Date().toISOString() };
await compose(base, spec);
fs.writeFileSync(specP, JSON.stringify(spec, null, 1));

// showcase.json
const idx = fs.existsSync(path.join(proto, "index.html")) ? fs.readFileSync(path.join(proto, "index.html"), "utf8") : "";
const title = get("--title", null) || (idx.match(/<title>([^<]+)<\/title>/) || [])[1] || path.basename(run);
let shell = "", pages = [];
try { const dc = JSON.parse((idx.match(/window\.DC = ([^\n]+?);<\/script>/) || [])[1]); shell = dc.shell || ""; pages = dc.pages || []; } catch {}
let scope = {}; try { scope = JSON.parse(fs.readFileSync(path.join(run, "knowledge/scope.json"), "utf8")); } catch {}
// cover: first view stage thumb
const coverP = path.join(outDir, "cover.png");
{
  const { chromium } = require("playwright");
  const { spawn } = require("node:child_process");
  const port = 4420 + (process.pid % 60);
  const srv = spawn("node", [path.join(HERE, "..", "serve.mjs"), run, "--port", String(port)], { stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 1400));
  try {
    const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
    const first = pages[0] ? pages[0].id : "";
    await p.goto(`http://localhost:${port}/prototype/?chrome=0#pages/${first}`, { waitUntil: "domcontentloaded" }).catch(() => {});
    await p.waitForTimeout(900);
    const buf = await p.locator("#dc-stage").screenshot().catch(() => null);
    if (buf) await sharp(buf).resize({ width: 480 }).png().toFile(coverP);
    await b.close();
  } catch {}
  srv.kill();
}
const showcase = {
  id: path.basename(run), title, subtitle: (scope.scope === "full" ? "全功能原型" : "场景原型"),
  platform: scope.platform || "web", shell, source: scope.source || "device",
  tags: [scope.platform || "web", scope.scope || "demo"], blurb: "",
  icon: "appicon/icon-256.png", iconMaskable: "appicon/icon-maskable-512.png",
  cover: fs.existsSync(coverP) ? "appicon/cover.png" : "", views: pages.length,
  iconSource: spec.source, updatedAt: new Date().toISOString(),
};
fs.writeFileSync(path.join(run, "knowledge", "showcase.json"), JSON.stringify(showcase, null, 1));
console.log(JSON.stringify({ ok: true, icon: spec.source, sizes: SIZES, maskable: true, showcase: path.join("knowledge", "showcase.json") }));
