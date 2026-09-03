#!/usr/bin/env node
/**
 * 关键区域截录裁剪：只保留关键区域，不保留整页（用户诉求）。
 * 用法:
 *   node region-crop.mjs <输入 图|视频> <输出> (--bbox x,y,w,h | --norm nx,ny,nw,nh | --bars top,bottom)
 * bbox 三档优先级: 显式 --bbox > VLM 归一化 --norm（宿主读缩略图给框）> --bars 设备常量裁系统栏
 * 图=sharp extract；视频=ffmpeg crop（全录后裁，零平台差异）。
 */
import { parseArgs } from "node:util";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";


if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("用法:\nnode region-crop.mjs <输入 图|视频> <输出> (--bbox x,y,w,h | --norm nx,ny,nw,nh | --bars top,bottom)");
  process.exit(0);
}
const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { bbox: { type: "string" }, norm: { type: "string" }, bars: { type: "string" } },
});
const [inp, outp] = positionals;
if (!inp || !outp || (!values.bbox && !values.norm && !values.bars)) {
  console.log("用法: node region-crop.mjs <输入> <输出> --bbox x,y,w,h | --norm nx,ny,nw,nh | --bars top,bottom");
  process.exit(1);
}
const req = createRequire(import.meta.url);
const isVideo = /\.(mp4|webm|mov|mkv|m4v)$/i.test(inp);

async function dims() {
  if (!isVideo) {
    const sharp = req("sharp");
    const m = await sharp(inp).metadata();
    return { w: m.width, h: m.height };
  }
  const s = execSync(`ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "${inp}"`, { encoding: "utf8" });
  const [w, h] = s.trim().split(",").map(Number);
  return { w, h };
}

const D = await dims();
let x, y, w, h;
if (values.bbox) [x, y, w, h] = values.bbox.split(",").map(Number);
else if (values.norm) { const [nx, ny, nw, nh] = values.norm.split(",").map(Number); [x, y, w, h] = [nx * D.w, ny * D.h, nw * D.w, nh * D.h]; }
else { const [top, bottom] = values.bars.split(",").map(Number); [x, y, w, h] = [0, top, D.w, D.h - top - bottom]; }
x = Math.max(0, Math.round(x)); y = Math.max(0, Math.round(y));
w = Math.min(D.w - x, Math.round(w)); h = Math.min(D.h - y, Math.round(h));
w -= w % 2; h -= h % 2;
console.log(`[crop] ${D.w}x${D.h} → x${x} y${y} ${w}x${h}`);

if (!isVideo) {
  const sharp = req("sharp");
  await sharp(inp).extract({ left: x, top: y, width: w, height: h }).toFile(outp);
} else {
  execSync(`ffmpeg -y -loglevel error -i "${inp}" -vf "crop=${w}:${h}:${x}:${y}" "${outp}"`);
}
console.log(`✅ ${path.basename(outp)}`);
