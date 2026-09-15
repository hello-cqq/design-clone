#!/usr/bin/env node
/**
 * brand-qa.mjs（M76-W1）——品牌资产铅笔残渍/伪影像素门。
 * 扫描 site/assets 下在用品牌图（logo-main/favicon/logo-mark{,-dark}）与
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
const IMGS = ["logo-main.png", "favicon.png"]; // 铅笔/角标门仅适用不透明合成资产；透明键控资产（logo-mark*）走 veil 门
// 铅笔只在耳上发区出现；全图扫会把暖发丝/皮肤误报 → 分区扫描（M76-W1）
const ZONES = {
  "logo-main.png": [400, 340, 180, 180],
};

const lumAt = (data, w, i) => 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
function pencilHits(data, w, h) {
  // M76-W6: 双签名——亮木杆橙 OR 暗发邻域阴影橙（修 M76-W1 假绿）；皮肤 g-b 小故不误报
  const hits = [];
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = (y * w + x) * 4;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (y > h * 0.9) continue; // 水面落日闪边误报豁免（铅笔从不到底边）
    const bright = r - b > 85 && r - g > 40 && g - b > 45 && r > 110;
    let darkNb = false;
    if (r - b > 60 && r - g > 30 && g - b > 30 && r > 90) {
      for (const j of [i - 4, i + 4, i - w * 4, i + w * 4]) if (lumAt(data, w, j) < 70) { darkNb = true; break; }
    }
    if (bright || darkNb) hits.push([x, y]);
  }
  return cluster4(hits, w);
}
function cluster4(hits, w) {
  // 连通域 ≥4px 才计（单像素暖闪误报过滤）
  const set = new Set(hits.map(([x, y]) => y * 100000 + x));
  const seen = new Set();
  const out = [];
  for (const [x, y] of hits) {
    const k = y * 100000 + x;
    if (seen.has(k)) continue;
    const q = [[x, y]];
    const comp = [];
    seen.add(k);
    while (q.length) {
      const [cx, cy] = q.pop();
      comp.push([cx, cy]);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nk = (cy + dy) * 100000 + (cx + dx);
        if (set.has(nk) && !seen.has(nk)) { seen.add(nk); q.push([cx + dx, cy + dy]); }
      }
    }
    if (comp.length >= 4) out.push(...comp);
  }
  return out;
}
// ident 显示带椭圆掩膜（site.css .idf-video mask）：掩膜外角标不可见 → 门只查掩膜内
function ellipseVis(x, y, w, h) {
  const dx = (x - w * 0.5) / (w * 0.58), dy = (y - h * 0.47) / (h * 0.52);
  const r = Math.sqrt(dx * dx + dy * dy);
  return r < 0.8 ? Math.max(0, 1 - r / 0.8) : 0;
}
// M80: 细长暖/银组件签名（笔杆形状防复发）：连通域对角>=18 且短边<=8 且暗发邻域比>=0.6
function stickHits(data, w, h) {
  const lumAt2 = (i) => 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  const cand = new Uint8Array(w * h);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = (y * w + x) * 4;
    const R = data[i], G = data[i + 1], B = data[i + 2], L = lumAt2(i);
    const warm = R - G >= 8 && R - G <= 60 && Math.abs(G - B) <= 28 && L >= 40 && L <= 230;
    const m = (lumAt2(i - 40) + lumAt2(i + 40) + lumAt2(i - w * 10) + lumAt2(i + w * 10)) / 4;
    const silver = Math.abs(R - G) <= 12 && Math.abs(G - B) <= 12 && L > 150 && L - m > 30;
    if (warm || silver) cand[y * w + x] = 1;
  }
  const seen = new Uint8Array(w * h);
  const out = [];
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i0 = y * w + x;
    if (!cand[i0] || seen[i0]) continue;
    const q = [[x, y]]; seen[i0] = 1;
    let x0 = x, x1 = x, y0 = y, y1 = y, n = 0, dark = 0;
    while (q.length) {
      const [cx, cy] = q.pop();
      n++;
      x0 = Math.min(x0, cx); x1 = Math.max(x1, cx); y0 = Math.min(y0, cy); y1 = Math.max(y1, cy);
      const ci = (cy * w + cx) * 4;
      let dn = 0, dt = 0;
      for (const [dx, dy] of [[-4, 0], [4, 0], [0, -4], [0, 4], [-3, -3], [3, 3], [-3, 3], [3, -3]]) {
        const xx = cx + dx, yy = cy + dy;
        if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
        dt++; if (lumAt2((yy * w + xx) * 4) < 80) dn++;
      }
      if (dt && dn / dt >= 0.5) dark++;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const xx = cx + dx, yy = cy + dy;
        if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
        const j = yy * w + xx;
        if (cand[j] && !seen[j]) { seen[j] = 1; q.push([xx, yy]); }
      }
    }
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
    const diag = Math.hypot(bw, bh);
    if (y0 > h * 0.78) continue; // 水面落日闪带豁免（铅笔从不到水面带）
    const fill = n / (bw * bh);
    if (diag >= 16 && fill <= 0.45 && n >= 8 && dark / n >= 0.45) out.push([x0, y0, bw, bh, n]);
  }
  return out;
}
// M94: logo 透明纯度——半透明 veil 像素(0<a<40)占比 <0.5%
async function logoVeilCheck() {
  const A = path.join(ROOT, "assets");
  let bad = 0;
  for (const f of ["logo-mark.png", "logo-mark-dark.png"]) { // 小尺寸 AA 主导，仅门 512 静图
    const { data, info } = await sharp(path.join(A, f)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    // veil = 半透明且不邻接(2px 内)不透明像素 → 背景雾残留；AA 边像素邻接不透明=合法
    const w = info.width, h = info.height;
    const solid = (x, y) => { for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; if (data[(yy * w + xx) * 4 + 3] > 120) return true; } return false; };
    let veil = 0, tot = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const a = data[(y * w + x) * 4 + 3];
      tot++;
      if (a > 0 && a < 25 && !solid(x, y)) veil++;
    }
    const ratio = veil / tot;
    if (ratio > 0.005) { bad++; console.log(`FAIL ${f}: veil ${(ratio * 100).toFixed(2)}%`); } else console.log(`ok ${f} veil ${(ratio * 100).toFixed(3)}%`);
  }
  return bad;
}
function cornerWatermarkHits(data, w, h, masked) {
  // 豆包/pollinations 角标白字：角落矩形内高亮像素计数
  const regs = [[w - Math.min(220, w >> 2), h - Math.min(110, h >> 2), Math.min(220, w >> 2), Math.min(110, h >> 2)], [0, 0, Math.min(220, w >> 2), Math.min(110, h >> 2)]];
  let n = 0;
  for (const [x0, y0, rw, rh] of regs) {
    let textRows = 0, bright = 0;
    for (let y = y0; y < y0 + rh; y++) {
      let runs = 0, prev = false;
      for (let x = x0; x < x0 + rw; x++) {
        const i = (y * w + x) * 4;
        const b = lumAt(data, w, i) > 235 && (!masked || ellipseVis(x, y, w, h) > 0.15);
        if (b) bright++;
        if (b && !prev) runs++;
        prev = b;
      }
      if (runs >= 4) textRows++;
    }
    if (textRows >= 4) n += bright; // 文字行模式才计（月亮/星=少 run）
  }
  return n;
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
// M76-W8: ident mp4 必须 faststart（moov 先于 mdat）——无 Range 服务下否则卡住不播
for (const v of fs.readdirSync(A).filter((f) => /^ident-.*\.mp4$/.test(f))) {
  const buf = fs.readFileSync(path.join(A, v));
  const order = [];
  let i = 0;
  while (i + 8 <= buf.length && order.length < 4) {
    const size = buf.readUInt32BE(i);
    const typ = buf.toString("latin1", i + 4, i + 8);
    order.push(typ);
    if (size < 8) break;
    i += size;
  }
  const moov = order.indexOf("moov"), mdat = order.indexOf("mdat");
  if (moov === -1 || mdat === -1 || moov > mdat) { fail = 1; console.log(`FAIL ${v}: 非 faststart（${order.join(",")}）`); } else console.log(`ok ${v} faststart`);
}
fail += await logoVeilCheck();
for (const im of IMGS) {
  const f = path.join(A, im);
  if (!fs.existsSync(f)) { console.log("skip", im); continue; }
  const hits = await scanFile(f, ZONES[im]);
  const { data: d2, info: i2 } = await sharp(f).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const wm = cornerWatermarkHits(d2, i2.width, i2.height);
  const sticks = stickHits(d2, i2.width, i2.height);
  if (sticks.length) console.log(`warn ${im}: stick-like=${sticks.length}（目视复核项，非 fail：水波/发丝高光可误报）`);
  if (hits.length || wm > 25) { fail = 1; console.log(`FAIL ${im}: pencil=${hits.length} wm=${wm}`); } else console.log(`ok ${im}`);
}
const frames = fs.readdirSync(framesDir).filter((f) => f.endsWith(".png")).sort();
let fbad = 0;
for (const f of frames) {
  const { data, info } = await sharp(path.join(framesDir, f)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const hits = pencilHits(data, info.width, info.height);
  const wm = cornerWatermarkHits(data, info.width, info.height, true);
  const sticks = stickHits(data, info.width, info.height);
  if (sticks.length) console.log(`warn frame ${f}: stick-like=${sticks.length}`, sticks.slice(0, 2));
  if (hits.length || wm > 25) { fbad++; if (fbad < 4) console.log(`FAIL frame ${f}: pencil=${hits.length} wm=${wm}`); }
}
console.log(fbad ? `FAIL ident frames: ${fbad}/${frames.length}` : `ok ident frames (${frames.length} sampled)`);
if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
if (fail || fbad) process.exit(1);
console.log("brand-qa ALL GREEN");
