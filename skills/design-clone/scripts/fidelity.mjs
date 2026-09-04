#!/usr/bin/env node
/**
 * 保真 QA：原型截屏 vs 源截图 像素差异率（pixelmatch）。
 * 用法: node fidelity.mjs <a.png 源> <b.png 原型> [--out diff.png] [--report <file> --name <key>]
 * 输出: { diffPixels, total, ratio } —— pixel 档应≈0，live-high 经验阈值 <0.08
 */
import sharp from "sharp";
import pixelmatch from "pixelmatch";
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";


if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("用法: node fidelity.mjs <a.png 源> <b.png 原型> [--out diff.png] [--report <file> --name <key>]");
  process.exit(0);
}
const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { out: { type: "string" }, report: { type: "string" }, name: { type: "string" }, waive: { type: "string" } },
});
const waiveArg = values.waive || null;
const [fa, fb] = positionals;
const metaA = await sharp(fa).metadata();
const W = metaA.width, H = metaA.height;
const raw = (f) => sharp(f).resize(W, H, { fit: "fill" }).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
const a = await raw(fa), b = await raw(fb);
const diff = values.out ? Buffer.alloc(W * H * 4) : null;
const n = pixelmatch(a.data, b.data, diff, W, H, { threshold: 0.1 });
const result = { diffPixels: n, total: W * H, ratio: +(n / (W * H)).toFixed(4), waive: waiveArg || null };
if (values.out) fs.writeFileSync(values.out, await sharp(diff, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer());
if (values.report) {
  fs.mkdirSync(path.dirname(path.resolve(values.report)), { recursive: true });
  const rep = fs.existsSync(values.report) ? JSON.parse(fs.readFileSync(values.report, "utf8")) : { generated_at: new Date().toISOString(), checks: {} };
  rep.checks[values.name || path.basename(fa)] = result;
  fs.writeFileSync(values.report, JSON.stringify(rep, null, 2));
}
console.log(JSON.stringify(result));
