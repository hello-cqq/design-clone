#!/usr/bin/env node
/**
 * autocrop-icons.mjs — 通用品牌资产自动裁（M44g）：在 capture 里找"饱和色块"（图标/彩色 tile/头像底）并逐个裁出。
 * 不靠手猜坐标：下采样→饱和度掩膜→连通域→尺寸过滤→映射回原图裁切。适用于任何 run 的图标/-logo-tile 复制。
 * 用法: node autocrop-icons.mjs <capture.png> <outDir> [--min 36] [--max 220] [--sat 0.30] [--prefix ic-] [--sheet /tmp/s.png]
 *      [--region X,Y,W,H]（原图像素，限定搜索区，如侧栏图标列） [--mode sat|ink]
 *      ink 模式=与区域背景亮度差掩膜，用于低饱和灰色 glyph（导航/rail 图标），sat 模式=饱和色块（彩色 tile/头像底）
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const sharp = require("sharp");
const A = process.argv.slice(2);
const get = (k, d) => (A.includes(k) ? A[A.indexOf(k) + 1] : d);
const src = A[0], outDir = A[1];
if (!src || !outDir || A.includes("--help")) { console.log("用法: node autocrop-icons.mjs <capture.png> <outDir> [--min 36] [--max 220] [--sat 0.30] [--prefix ic-]"); process.exit(src ? 0 : 1); }
const MIN = +get("--min", 36), MAX = +get("--max", 220), SAT = +get("--sat", 0.30), PREFIX = get("--prefix", "ic-");
const MODE = get("--mode", "sat");
const REGION = get("--region", null);
fs.mkdirSync(outDir, { recursive: true });
const meta = await sharp(src).metadata();
// region 裁剪后再下采样：小图标列也能拿到足够分辨率
let input = sharp(src);
let offX = 0, offY = 0, baseW = meta.width, baseH = meta.height;
if (REGION) {
  const [rx, ry, rw, rh] = REGION.split(",").map(Number);
  offX = rx; offY = ry; baseW = rw; baseH = rh;
  input = input.extract({ left: Math.max(0, rx), top: Math.max(0, ry), width: Math.min(rw, meta.width - rx), height: Math.min(rh, meta.height - ry) });
}
const DW = 400;
const scale = DW / baseW;
const DH = Math.max(1, Math.round(baseH * scale));
const { data } = await input.resize({ width: DW, height: DH, fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const sat = (r, g, b) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx === 0 ? 0 : (mx - mn) / mx; };
const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
// ink 模式：区域背景=亮度中位数；掩膜=与背景亮度差>阈值 或 饱和色
const lums = new Float64Array(DW * DH);
for (let i = 0; i < DW * DH; i++) lums[i] = lum(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]);
const sorted = Array.from(lums).sort((a, b) => a - b);
const bgLum = sorted[Math.floor(sorted.length / 2)];
const mask = new Uint8Array(DW * DH);
for (let i = 0; i < DW * DH; i++) {
  const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
  const isSat = sat(r, g, b) > SAT && Math.max(r, g, b) > 60;
  const isInk = Math.abs(lums[i] - bgLum) > 45;
  mask[i] = (MODE === "ink" ? (isInk || isSat) : isSat) ? 1 : 0;
}
const seen = new Uint8Array(DW * DH);
const comps = [];
for (let y = 0; y < DH; y++) for (let x = 0; x < DW; x++) {
  const i = y * DW + x;
  if (!mask[i] || seen[i]) continue;
  const stack = [[x, y]]; seen[i] = 1;
  let minx = x, maxx = x, miny = y, maxy = y, cnt = 0;
  while (stack.length) {
    const [cx, cy] = stack.pop(); cnt++;
    minx = Math.min(minx, cx); maxx = Math.max(maxx, cx); miny = Math.min(miny, cy); maxy = Math.max(maxy, cy);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= DW || ny >= DH) continue;
      const ni = ny * DW + nx;
      if (mask[ni] && !seen[ni]) { seen[ni] = 1; stack.push([nx, ny]); }
    }
  }
  const w = (maxx - minx + 1) / scale, h = (maxy - miny + 1) / scale;
  if (w >= MIN && w <= MAX && h >= MIN && h <= MAX && cnt > 20) comps.push({ x: minx / scale, y: miny / scale, w, h, cnt });
}
comps.sort((a, b) => (a.y - b.y) || (a.x - b.x));
const kept = [];
for (const c of comps) {
  if (kept.some((k) => Math.abs(k.x - c.x) < 20 && Math.abs(k.y - c.y) < 20)) continue;
  kept.push(c);
}
let n = 0;
for (const c of kept.slice(0, 40)) {
  const pad = 4;
  // region 模式下组件坐标相对裁剪区，映射回原图需加偏移
  const left = Math.max(0, Math.round(c.x - pad) + offX), top = Math.max(0, Math.round(c.y - pad) + offY);
  const width = Math.min(meta.width - left, Math.round(c.w + pad * 2)), height = Math.min(meta.height - top, Math.round(c.h + pad * 2));
  await sharp(src).extract({ left, top, width, height }).png().toFile(path.join(outDir, `${PREFIX}${++n}.png`));
}
console.log(JSON.stringify({ found: kept.length, written: n }));
if (get("--sheet", null) && n) {
  const cells = [];
  for (let i = 1; i <= n; i++) { const b = await sharp(path.join(outDir, `${PREFIX}${i}.png`)).resize({ width: 90 }).png().toBuffer(); const m = await sharp(b).metadata(); cells.push({ b, h: m.height }); }
  const cols = 8; const colH = new Array(cols).fill(0); const placed = [];
  cells.forEach((c, i) => { const col = i % cols; placed.push({ input: c.b, left: col * 96, top: colH[col] }); colH[col] += c.h + 6; });
  await sharp({ create: { width: cols * 96, height: Math.max(...colH), channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } }).composite(placed).png().toFile(get("--sheet"));
}
