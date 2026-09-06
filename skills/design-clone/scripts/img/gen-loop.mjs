#!/usr/bin/env node
/**
 * gen-loop.mjs — 生图循环自检（M44e）：generate → 自检 → 不过则变异重试（换 seed→加纠正词→换风格），≤N 轮。
 * 自检项：blank / blurry / collage(拼贴) / 单主体 / 头像禁纯灰底（AI 味特征）。风格由 style-pick 按场景决策。
 * 用法: node gen-loop.mjs --out <asset> --run <runDir> [--scenario s] [--kind avatar|cover|scene|icon] [--subject "..."] [--rounds 3] [--sheet /tmp/sheet.jpg] [--w 512 --h 512]
 * 产物写 prototype/assets-manifest.json（source=genimg, style, scenario, rounds, checks）。
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
const out = get("--out", null);
const run = get("--run", null) ? path.resolve(get("--run")) : null;
if (!out || A.includes("--help") || A.includes("-h")) { console.log("用法: node gen-loop.mjs --out <asset> --run <runDir> [--kind avatar] [--subject ...] [--rounds 3] [--sheet p]"); process.exit(out ? 0 : 1); }
const kind = get("--kind", "avatar");
const rounds = parseInt(get("--rounds", "3"), 10);
const W = get("--w", "512"), H = get("--h", "512");
const outAbs = path.resolve(out);

const pick = spawnSync("node", [path.join(HERE, "..", "gen", "style-pick.mjs"), ...(run ? ["--run", run] : ["--scenario", get("--scenario", "default")]), "--kind", kind, "--subject", get("--subject", kind === "avatar" ? "a friendly fictional person" : "an evocative motif")], { encoding: "utf8" });
const P = JSON.parse(pick.stdout.trim());
const FALLBACK = { illustration: "anime", anime: "illustration", "flat-corporate": "flat", photographic: "illustration", guofeng: "illustration", cyberpunk: "illustration", disney: "anime", "pixar-3d": "illustration", flat: "sticker", sticker: "flat", "clay-icon": "flat" };

async function selfcheck(f) {
  const issues = [];
  const meta = await sharp(f).metadata();
  const { data, info } = await sharp(f).grayscale().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height, n = w * h;
  let sum = 0, sum2 = 0; for (let i = 0; i < n; i++) { sum += data[i]; sum2 += data[i] * data[i]; }
  const stddev = Math.sqrt(Math.max(0, sum2 / n - (sum / n) ** 2));
  let ls = 0, ls2 = 0, m = 0;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x, v = 4 * data[i] - data[i - 1] - data[i + 1] - data[i - w] - data[i + w]; ls += v; ls2 += v * v; m++; }
  const shp = ls2 / m - (ls / m) ** 2;
  if (stddev < 6 && kind !== "cover" && kind !== "scene") issues.push("blank"); // 渐变封面/场景 legitimately 低 stddev
  if (shp < 8) issues.push("blurry");
  // collage: thin light separators with content both sides
  const g = await (async () => { const d = (await sharp(f).grayscale().resize({ width: 96, height: 96, fit: "fill" }).raw().toBuffer({ resolveWithObject: true })).data; const W2 = 96; const rm = (y) => { let s = 0; for (let x = 0; x < W2; x++) s += d[y * W2 + x]; return s / W2; }; const cm = (x) => { let s = 0; for (let y = 0; y < W2; y++) s += d[y * W2 + x]; return s / W2; }; const seps = (mean, nn) => { let c = 0, i = Math.round(nn * .1); const hi = Math.round(nn * .9), mx = Math.max(2, Math.round(nn * .08)); while (i < hi) { if (mean(i) > 205) { let j = i; while (j < hi && mean(j) > 205) j++; if ((j - i) <= mx && i - 2 >= 0 && mean(i - 2) < 180 && j + 2 < nn && mean(j + 2) < 180) c++; i = j; } else i++; } return c; }; return { rb: seps(rm, W2), cb: seps(cm, W2) }; })();
  if (g.rb >= 1 && g.cb >= 1) issues.push("collage");
  // plain/desaturated uniform bg (AI tell) for avatars: corners uniform low-saturation (any luminance) → fail
  if (kind === "avatar") {
    const c = await sharp(f).resize({ width: 8, height: 8, fit: "fill" }).raw().toBuffer({ resolveWithObject: true });
    const corners = [0, 7, 56, 63].map((i) => [c.data[i * 3], c.data[i * 3 + 1], c.data[i * 3 + 2]]);
    const uniform = corners.every(([r, gg, b]) => Math.max(r, gg, b) - Math.min(r, gg, b) < 14);
    const sameish = corners.every(([r, gg, b]) => Math.abs(r - corners[0][0]) < 18 && Math.abs(b - corners[0][2]) < 18);
    if (uniform && sameish) issues.push("plain-bg");
  }
  return { issues, stddev: +stddev.toFixed(1), sharp: +shp.toFixed(1), w: meta.width, h: meta.height };
}

const tmpBase = path.join(path.dirname(outAbs), ".genloop-" + path.basename(outAbs));
const attempts = [];
let finalOk = null;
for (let r = 1; r <= rounds; r++) {
  const style = r >= 3 ? (FALLBACK[P.style] || "illustration") : P.style;
  let prompt = P.prompt;
  if ((kind === "cover" || kind === "scene") && !A.includes("--with-people")) prompt += ", no people, no human figures, no faces";
  if (run) { try { const t = JSON.parse(fs.readFileSync(path.join(run, "knowledge/tokens.dom.json"), "utf8")); const hex = Object.values(t).filter((v) => typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v)).slice(0, 4); if (hex.length) prompt += ", color palette harmonized with " + hex.join(" "); } catch {} }
  if (r === 2) prompt += ", single centered subject, uncluttered clean composition";
  if (r >= 3) prompt += ", rich environmental background with soft color (not plain gray), distinct personality";
  const target = `${tmpBase}-r${r}.png`;
  const g = spawnSync("node", [path.join(HERE, "..", "genimg.mjs"), "--prompt", prompt, "--style", style, "--w", W, "--h", H, "--seeds", String(40 + r * 17), "--out", target], { encoding: "utf8" });
  if (g.status !== 0 || !fs.existsSync(target)) { attempts.push({ r, style, issues: ["gen-failed"] }); continue; }
  const chk = await selfcheck(target);
  attempts.push({ r, style, issues: chk.issues, stddev: chk.stddev, sharp: chk.sharp });
  if (!chk.issues.length) { finalOk = { file: target, r, style, chk }; break; }
}
if (!finalOk && attempts.length) { // 兜底：取问题最少的一轮
  const best = attempts.filter((a) => a.issues && a.issues.length).sort((a, b) => a.issues.length - b.issues.length)[0];
  const f = `${tmpBase}-r${best.r}.png`;
  if (fs.existsSync(f)) finalOk = { file: f, r: best.r, style: best.style, chk: { issues: best.issues, warn: true } };
}
if (finalOk) {
  fs.copyFileSync(finalOk.file, outAbs);
  if (run) {
    const mp = path.join(run, "prototype", "assets-manifest.json");
    fs.mkdirSync(path.dirname(mp), { recursive: true });
    const prev = fs.existsSync(mp) ? JSON.parse(fs.readFileSync(mp, "utf8")) : { assets: {} };
    prev.assets[path.basename(outAbs)] = { file: path.basename(outAbs), source: "genimg", style: finalOk.style, scenario: P.scenario, kind, rounds: finalOk.r, checks: finalOk.chk, at: new Date().toISOString() };
    prev.generated_at = new Date().toISOString();
    fs.writeFileSync(mp, JSON.stringify(prev, null, 1));
  }
}
// 清理临时
for (const f of fs.readdirSync(path.dirname(outAbs))) if (f.startsWith(".genloop-")) { const p = path.join(path.dirname(outAbs), f); if (!finalOk || p !== finalOk.file) fs.rmSync(p, { force: true }); }
if (get("--sheet", null) && attempts.length) {
  const files = attempts.map((a) => `${tmpBase}-r${a.r}.png`).filter((f) => fs.existsSync(f));
  if (files.length) {
    const bufs = []; const COLW = 240; const colH = [0, 0]; const placed = [];
    for (let i = 0; i < files.length; i++) { const b = await sharp(files[i]).resize({ width: COLW }).jpeg({ quality: 85 }).toBuffer(); const mm = await sharp(b).metadata(); const col = i % 2; placed.push({ input: b, left: col * (COLW + 8), top: colH[col] }); colH[col] += mm.height + 8; }
    await sharp({ create: { width: COLW * 2 + 8, height: Math.max(...colH), channels: 3, background: { r: 255, g: 255, b: 255 } } }).composite(placed).jpeg({ quality: 85 }).toFile(get("--sheet"));
  }
}
console.log(JSON.stringify({ ok: !!finalOk && !(finalOk.chk && finalOk.chk.warn), out: path.basename(outAbs), scenario: P.scenario, style: finalOk ? finalOk.style : P.style, rounds: finalOk ? finalOk.r : rounds, attempts }, null, 1));
process.exit(finalOk && !finalOk.chk.warn ? 0 : 3);
