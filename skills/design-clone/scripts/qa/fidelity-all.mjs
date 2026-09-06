#!/usr/bin/env node
/**
 * fidelity-all.mjs — 逐视图保真复测（M44/P3），修"view id ≠ capture id"配对缺陷。
 * 源帧解析优先级：knowledge/source-map.json[view] → capture/screens/<view>.png → <view>-full.png
 *   → source-map 反向模糊（capture 名含 view 去数字前缀的词干）。截屏用 chrome=0（防固定外壳渗入长页拼接）。
 * 保留既有 waive 理由（读旧 report 合并），不静默覆盖。
 * 用法: node fidelity-all.mjs --run <runDir> --base <url> [--views a,b] [--hard 0.4] [--warn 0.2]
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const sharp = require("sharp");
const pixelmatch = require("pixelmatch");

const A = process.argv.slice(2);
const get = (k, d) => (A.includes(k) ? A[A.indexOf(k) + 1] : d);
const run = path.resolve(get("--run", ""));
const base = (get("--base", "") || "").replace(/\/+$/, "");
if (!run || !base || A.includes("--help")) { console.log("用法: node fidelity-all.mjs --run <runDir> --base <url> [--views a,b]"); process.exit(get("--run") ? 0 : 1); }
const hardF = parseFloat(get("--hard", "0.40"));
const warnF = parseFloat(get("--warn", "0.20"));
const structHard = parseFloat(get("--struct-hard", "0.60"));
const structWarn = parseFloat(get("--struct-warn", "0.75"));
const viewsDir = path.join(run, "prototype/views");
const screensDir = path.join(run, "capture/screens");
const reportP = path.join(run, "report/fidelity.json");
let map = {};
try { map = JSON.parse(fs.readFileSync(path.join(run, "knowledge/source-map.json"), "utf8")); } catch {}
const oldRep = fs.existsSync(reportP) ? JSON.parse(fs.readFileSync(reportP, "utf8")) : { checks: {} };
const views = (get("--views", null) ? get("--views", "").split(",") : fs.readdirSync(viewsDir).filter((f) => f.endsWith(".html")).map((f) => f.replace(".html", "")));

function srcFor(v) {
  if (map[v]) { const p = path.join(run, map[v]); if (fs.existsSync(p)) return p; }
  const direct = path.join(screensDir, v + ".png"); if (fs.existsSync(direct)) return direct;
  const full = path.join(screensDir, v + "-full.png"); if (fs.existsSync(full)) return full;
  // 模糊：view 去 NN- 前缀的词干出现在 capture 名中
  const stem = v.replace(/^\d+-/, "");
  if (fs.existsSync(screensDir)) {
    const hit = fs.readdirSync(screensDir).find((f) => f.includes(stem) && f.endsWith(".png"));
    if (hit) return path.join(screensDir, hit);
  }
  return null;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.emulateMedia({ reducedMotion: "reduce" });
// M44d 结构分：12x12 墨度网格归一化后总变差距离。pixelmatch 对浅色稀疏 UI 的"缺整栏/错页"失明，struct 能抓住。
const inkGrid = async (p) => {
  const { data } = await sharp(p).grayscale().resize({ width: 12, height: 12, fit: "fill" }).raw().toBuffer({ resolveWithObject: true });
  const ink = [...data].map((v) => 255 - v);
  const sum = ink.reduce((a, b) => a + b, 0) || 1;
  return ink.map((v) => v / sum);
};
const structOf = (ga, gb) => +(1 - 0.5 * ga.reduce((s, v, i) => s + Math.abs(v - gb[i]), 0)).toFixed(4);
// M44g 风格丰富度：Hasler-Susstrunk colorfulness + 饱和像素占比（capture vs 原型），抓"太素/风格不一致"
const styleOf = async (p) => {
  const { data } = await sharp(p).resize({ width: 64, height: 64, fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let srg = 0, syb = 0, srg2 = 0, syb2 = 0, sat = 0; const n = 64 * 64;
  for (let i = 0; i < n; i++) { const R = data[i*3], G = data[i*3+1], B = data[i*3+2];
    const rg = R - G, yb = 0.5*(R+G) - B; srg += rg; syb += yb; srg2 += rg*rg; syb2 += yb*yb;
    const mx = Math.max(R,G,B), mn = Math.min(R,G,B); if (mx && (mx-mn)/mx > 0.35) sat++; }
  const mrg = srg/n, myb = syb/n;
  const c = Math.sqrt(Math.max(0,srg2/n - mrg*mrg) + Math.max(0,syb2/n - myb*myb)) + 0.3*Math.sqrt(mrg*mrg + myb*myb);
  return { c: +c.toFixed(1), sat: +(sat/n).toFixed(3) };
};
const checks = { ...oldRep.checks };
const out = {};
for (const v of views) {
  const src = srcFor(v);
  if (!src) { out[v] = { note: "no-source-frame" }; continue; }
  const shot = path.join("/tmp", `fid-${path.basename(run)}-${v}.png`);
  await page.goto(base + "/prototype/?chrome=0&ann=0#pages/" + v, { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
  await page.waitForFunction((id) => { const s = document.querySelector("#dc-stage"); return location.hash.includes(id) && s && s.children.length > 0; }, v, { timeout: 6000 }).catch(() => {});
  await page.waitForTimeout(500);
  await page.locator("#dc-stage").screenshot({ path: shot });
  const ma = await sharp(src).metadata();
  const W = ma.width, H = ma.height;
  const raw = (f) => sharp(f).resize(W, H, { fit: "fill" }).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const a = await raw(src), b = await raw(shot);
  const n = pixelmatch(a.data, b.data, null, W, H, { threshold: 0.1 });
  const ratio = +(n / (W * H)).toFixed(4);
  const struct = structOf(await inkGrid(src), await inkGrid(shot));
  const stA = await styleOf(src), stB = await styleOf(shot);
  const styleDelta = { c: Math.abs(stA.c - stB.c), sat: +Math.abs(stA.sat - stB.sat).toFixed(3), src: stA, proto: stB };
  const prevWaive = (oldRep.checks[v] && oldRep.checks[v].waive) || null;
  checks[v] = { ratio, struct, style: styleDelta, waive: prevWaive, src: path.relative(run, src) };
  out[v] = { ratio, struct, waive: prevWaive, hard: (ratio > hardF) && !prevWaive, warn: (ratio > warnF && ratio <= hardF) };
}
await browser.close();
fs.mkdirSync(path.dirname(reportP), { recursive: true });
fs.writeFileSync(reportP, JSON.stringify({ generated_at: new Date().toISOString(), checks }, null, 2));
const bad = Object.entries(out).filter(([k, v]) => v.hard);
console.log(JSON.stringify({ views: Object.keys(out).length, hard: bad.map(([k]) => k + ":r" + out[k].ratio + "/s" + out[k].struct), detail: Object.fromEntries(Object.entries(out).map(([k, v]) => [k, { r: v.ratio, s: v.struct }])) }));
