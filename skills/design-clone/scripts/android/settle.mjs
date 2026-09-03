#!/usr/bin/env node
/**
 * 稳定检测截图（M17）：页面加载未完成不交付。
 * 用法: node settle.mjs <out.png> [tries=4] [eps=1.5] [interval=900ms]
 * 逻辑：capture.sh 拍一张 → 80×80 灰度签名与上一张比平均绝对差 →
 *       差 < eps 视为渲染稳定，落盘 out；否则间隔后重拍，tries 用尽取最后一张并标记 unstable。
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import sharp from "sharp";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const [out, triesArg, epsArg, intArg] = process.argv.slice(2);
if (!out || ["--help", "-h"].includes(out)) {
  console.log("用法: node settle.mjs <out.png> [tries=4] [eps=1.5] [interval=900]");
  process.exit(out ? 0 : 1);
}
const tries = parseInt(triesArg || "4"), eps = parseFloat(epsArg || "1.5"), interval = parseInt(intArg || "900");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sig = async (f) => (await sharp(f).resize(80, 80, { fit: "fill" }).grayscale().raw().toBuffer({ resolveWithObject: true })).data;
const diff = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return s / a.length; };

const tmp = out + ".settle-tmp.png";
let prev = null, last = tmp;
for (let i = 0; i < tries; i++) {
  spawnSync("bash", [path.join(HERE, "capture.sh"), tmp], { encoding: "utf8" });
  if (!fs.existsSync(tmp)) { console.error("capture failed"); process.exit(1); }
  const cur = await sig(tmp);
  if (prev != null && diff(prev, cur) < eps) {
    fs.copyFileSync(tmp, out); fs.rmSync(tmp, { force: true });
    console.log(JSON.stringify({ out, stable: true, attempts: i + 1 }));
    process.exit(0);
  }
  prev = cur;
  if (i < tries - 1) await sleep(interval);
}
fs.copyFileSync(last, out); fs.rmSync(last, { force: true });
console.log(JSON.stringify({ out, stable: false, attempts: tries }));
