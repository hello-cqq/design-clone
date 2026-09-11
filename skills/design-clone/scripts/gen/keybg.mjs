#!/usr/bin/env node
/**
 * keybg.mjs —— 近纯色背景抠透明（角落取样 + 容差 + 羽化），并可选裁掉底部水印带（M62-D）
 * 用法: node keybg.mjs --in <png> --out <png> [--tol 40] [--crop-bottom 50] [--feather 2]
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { createRequire } from "node:module";
const sharp = createRequire(import.meta.url)("sharp");
const { values } = parseArgs({ options: { in: { type: "string" }, out: { type: "string" }, tol: { type: "string", default: "40" }, "crop-bottom": { type: "string", default: "50" }, feather: { type: "string", default: "2" } } });
if (!values.in || !values.out) { console.log("用法: node keybg.mjs --in <png> --out <png> [--tol 40] [--crop-bottom 50]"); process.exit(1); }
const tol = +values.tol, cb = +values["crop-bottom"], fe = +values.feather;
let img = sharp(values.in);
const meta0 = await img.metadata();
if (cb > 0 && meta0.height - cb > 100) img = img.extract({ left: 0, top: 0, width: meta0.width, height: meta0.height - cb });
const meta = await img.metadata();
const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const px = (x, y) => { const i = (y * info.width + x) * info.channels; return [data[i], data[i + 1], data[i + 2]]; };
// 逐行背景估计（抗暗角/渐变底）：每行取左右各 8px 中位数作为该行 bg
const med = (arr) => { const a = [...arr].sort((x, y) => x - y); return a[a.length >> 1]; };
const rowBg = [];
for (let y = 0; y < info.height; y++) {
  const ls = [], rs = [];
  for (let k = 0; k < 8; k++) { ls.push(...px(k + 1, y)); rs.push(...px(info.width - 2 - k, y)); }
  rowBg.push([0, 1, 2].map((ch) => med([ls[ch], ls[ch + 3], ls[ch + 6], rs[ch], rs[ch + 3], rs[ch + 6]])));
}
const bg = rowBg[0];
for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    const i = (y * info.width + x) * info.channels;
    const d = Math.sqrt((data[i] - rowBg[y][0]) ** 2 + (data[i + 1] - rowBg[y][1]) ** 2 + (data[i + 2] - rowBg[y][2]) ** 2);
    let a = d < tol ? 0 : d < tol + fe * 12 ? (d - tol) / (fe * 12) : 1;
    data[i + 3] = Math.min(data[i + 3], Math.round(a * 255));
  }
}
await sharp(Buffer.from(data), { raw: { width: info.width, height: info.height, channels: info.channels } }).png().toFile(values.out);
console.log(JSON.stringify({ out: values.out, bg: bg.map(Math.round), size: [info.width, info.height] }));
