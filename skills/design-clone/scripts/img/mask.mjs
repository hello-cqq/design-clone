#!/usr/bin/env node
/**
 * 隐私打码（M17）：pixel 资产进原型前，对真人信息区域 blur 或填色。
 * 用法: node mask.mjs <img> --rects "x,y,w,h;x,y,w,h" [--mode blur|fill] [--color #1a1a1a] [--out f]
 * rects 为原图像素坐标；mask 清单应落 knowledge/privacy-rects.json 可复查。
 */
import sharp from "sharp";
import fs from "node:fs";

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h") || args.length === 0) {
  console.log("用法: node mask.mjs <img> --rects \"x,y,w,h;...\" [--mode blur|fill] [--color #1a1a1a] [--out f]");
  process.exit(0);
}
let rects = "", mode = "blur", color = "#1a1a1a", out = null;
const files = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--rects") rects = args[++i];
  else if (a === "--mode") mode = args[++i];
  else if (a === "--color") color = args[++i];
  else if (a === "--out") out = args[++i];
  else files.push(a);
}
const src = files[0];
if (!src || !rects) { console.log("缺 img 或 --rects"); process.exit(1); }
const list = rects.split(";").filter(Boolean).map((r) => { const [left, top, width, height] = r.split(",").map(Number); return { left, top, width, height }; });

const layers = [];
for (const r of list) {
  if (mode === "blur") {
    const buf = await sharp(src).extract(r).blur(16).toBuffer();
    layers.push({ input: buf, left: r.left, top: r.top });
  } else {
    layers.push({ input: { create: { width: r.width, height: r.height, channels: 3, background: color } }, left: r.left, top: r.top });
  }
}
out = out || src.replace(/(\.[a-z0-9]+)$/i, "-masked$1");
await sharp(src).composite(layers).jpeg({ quality: 82 }).toFile(out);
console.log(JSON.stringify({ out, rects: list.length, mode }));
