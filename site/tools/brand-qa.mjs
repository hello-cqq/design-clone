#!/usr/bin/env node
/**
 * brand-qa.mjs（M76-W1）——品牌资产铅笔残渍/伪影像素门。
 * 扫描 site/assets 下品牌图（logo-main/logo-girl/logo-main-256/favicon/logomark-fill）与
 * ident 视频抽帧，统计"铅笔木杆橙"签名像素（高饱和橙：r-b>85, r-g>40, g-b>45）。
 * 皮肤/暖光不满足 g-b>45，故不误报。任何命中即 exit 1（CI 部署前门禁）。
 * 用法: node brand-qa.mjs [--frames-dir <dir>] （默认抽 ident 视频 20 帧到临时目录）
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
const sharp = createRequire(import.meta.url)("sharp");

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const A = path.join(ROOT, "assets");
const IMGS = ["logo-main.png", "logo-girl.png", "logo-main-256.png", "favicon.png", "logomark-fill.png", "logo-light.png", "logo-dark.png"];
// 铅笔只在耳上发区出现；全图扫会把暖发丝/皮肤误报 → 分区扫描（M76-W1）
const ZONES = {
  "logo-girl.png": [700, 260, 220, 220],
  "logo-main.png": [400, 340, 180, 180],
  "logomark-fill.png": [400, 340, 180, 180],
  "logo-main-256.png": [80, 68, 36, 36],
};

function pencilHits(data, w, h) {
  const hits = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (r - b > 85 && r - g > 40 && g - b > 45 && r > 110) hits.push([x, y]);
  }
  return hits;
}
async function scanFile(f, zone) {
  const { data, info } = await sharp(f).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (!zone) return pencilHits(data, info.width, info.height);
  const [zx, zy, zw, zh] = zone;
  const hits = [];
  for (const [x, y] of pencilHits(data, info.width, info.height)) if (x >= zx && x < zx + zw && y >= zy && y < zy + zh) hits.push([x, y]);
  return hits;
}
const argFrames = process.argv.includes("--frames-dir") ? process.argv[process.argv.indexOf("--frames-dir") + 1] : null;
let framesDir = argFrames, tmpDir = null;
if (!framesDir) {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brand-qa-"));
  framesDir = tmpDir;
  for (const pat of [/^ident-light\..*\.mp4$/, /^ident-dark\..*\.mp4$/]) {
    const v = fs.readdirSync(A).find((f) => pat.test(f));
    if (!v) continue;
    const src = path.join(A, v);
    execFileSync("ffmpeg", ["-v", "error", "-i", src, "-vf", "select=not(mod(n\\,9))", "-fps_mode", "vfr", path.join(framesDir, v.split(".")[0] + "-%03d.png")]);
  }
}
let fail = 0;
for (const im of IMGS) {
  const f = path.join(A, im);
  if (!fs.existsSync(f)) { console.log("skip", im); continue; }
  const hits = await scanFile(f, ZONES[im]);
  if (hits.length) { fail = 1; console.log(`FAIL ${im}: ${hits.length} pencil-px @`, hits.slice(0, 4)); } else console.log(`ok ${im}`);
}
const frames = fs.readdirSync(framesDir).filter((f) => f.endsWith(".png")).sort();
let fbad = 0;
for (const f of frames) {
  const hits = await scanFile(path.join(framesDir, f));
  if (hits.length) { fbad++; if (fbad < 4) console.log(`FAIL frame ${f}: ${hits.length} pencil-px @`, hits.slice(0, 4)); }
}
console.log(fbad ? `FAIL ident frames: ${fbad}/${frames.length}` : `ok ident frames (${frames.length} sampled)`);
if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
if (fail || fbad) process.exit(1);
console.log("brand-qa ALL GREEN");
