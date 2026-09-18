#!/usr/bin/env node
/**
 * matte.mjs（M112）：泛洪背景抠透明。从四边种子泛洪，把与背景色相近且与边缘连通的像素置透明，
 * 主体内部同色高光不受影响（全局色键会误杀）；alpha 边缘羽化。
 * 用法: node matte.mjs <in> <out> [--tol 0.10] [--feather 1.2] [--bg auto]
 *   tol = 与背景色的归一化 RGB 距离阈值；feather = alpha 高斯模糊半径（px）
 */
import sharp from "sharp";
import { parseArgs } from "node:util";

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  allowPositionals: true,
  options: { tol: { type: "string" }, feather: { type: "string" }, bg: { type: "string" }, mode: { type: "string" }, help: { type: "boolean", default: false } },
});
const [inp, outp] = positionals;
if (!inp || !outp || values.help) {
  console.log("用法: node matte.mjs <in> <out> [--tol 0.10] [--feather 1.2] [--mode flood|global] [--bg #hex]  global=全局色键(保留主体同色内部), flood=边缘泛洪(默认)");
  process.exit(inp && outp ? 0 : 1);
}
const tol = +(values.tol || 0.10);
const feather = +(values.feather ?? 1.2);

const img = sharp(inp);
const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;

function cornerBg() {
  const pts = [[0, 0], [W - 1, 0], [0, H - 1], [W - 1, H - 1]];
  let r = 0, g = 0, b = 0, n = 0;
  for (const [x, y] of pts) for (let dy = 0; dy < 6; dy++) for (let dx = 0; dx < 6; dx++) {
    const xx = Math.min(W - 1, x + (x ? -dx : dx)), yy = Math.min(H - 1, y + (y ? -dy : dy));
    const i = (yy * W + xx) * C;
    r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
  }
  return [r / n, g / n, b / n];
}
let BG = values.bg && values.bg !== "auto"
  ? [1, 3, 5].map((i) => parseInt(values.bg.slice(i, i + 2), 16))
  : cornerBg();

const near = (i) => {
  const dr = (data[i] - BG[0]) / 255, dg = (data[i + 1] - BG[1]) / 255, db = (data[i + 2] - BG[2]) / 255;
  return Math.sqrt(dr * dr + dg * dg + db * db) <= tol;
};
if ((values.mode || "flood") === "global") {
  {
    let r = 0, g = 0, b = 0, n = 0;
    for (let x = 0; x < W; x++) for (let y = 0; y < 10; y++) { const i = (y * W + x) * C; r += data[i]; g += data[i + 1]; b += data[i + 2]; n++; }
    BG[0] = r / n; BG[1] = g / n; BG[2] = b / n;
  }
  let killed = 0;
  for (let p = 0; p < W * H; p++) {
    const i = p * C;
    if (near(i)) { data[i + 3] = 0; killed++; }
  }
  let outg = sharp(Buffer.from(data), { raw: { width: W, height: H, channels: C } });
  if (feather > 0) {
    const alpha = await sharp(Buffer.from(data), { raw: { width: W, height: H, channels: C } }).extractChannel(3).toBuffer();
    const blurred = await sharp(alpha, { raw: { width: W, height: H, channels: 1 } }).blur(feather).raw().toBuffer();
    for (let p = 0; p < W * H; p++) data[p * C + 3] = blurred[p];
    outg = sharp(Buffer.from(data), { raw: { width: W, height: H, channels: C } });
  }
  await outg.png().toFile(outp);
  console.log(JSON.stringify({ ok: true, mode: "global", bg: BG.map(Math.round), keyed_pct: +(100 * killed / (W * H)).toFixed(1) }));
  process.exit(0);
}
const seen = new Uint8Array(W * H);
const stack = [];
for (let x = 0; x < W; x++) { stack.push(x, (H - 1) * W + x); }
for (let y = 0; y < H; y++) { stack.push(y * W, y * W + W - 1); }
let sp = 0;
while (sp < stack.length) {
  const p = stack[sp++];
  if (seen[p]) continue;
  const i = p * C;
  if (!near(i)) continue;
  seen[p] = 1;
  data[i + 3] = 0;
  const x = p % W, y = (p - x) / W;
  if (x > 0) stack.push(p - 1);
  if (x < W - 1) stack.push(p + 1);
  if (y > 0) stack.push(p - W);
  if (y < H - 1) stack.push(p + W);
}
let killed = 0;
for (let p = 0; p < W * H; p++) if (seen[p]) killed++;

let out = sharp(Buffer.from(data), { raw: { width: W, height: H, channels: C } });
if (feather > 0) {
  const alpha = await sharp(Buffer.from(data), { raw: { width: W, height: H, channels: C } }).extractChannel(3).toBuffer();
  const blurred = await sharp(alpha, { raw: { width: W, height: H, channels: 1 } }).blur(feather).raw().toBuffer();
  for (let p = 0; p < W * H; p++) data[p * C + 3] = blurred[p];
  out = sharp(Buffer.from(data), { raw: { width: W, height: H, channels: C } });
}
await out.png().toFile(outp);
console.log(JSON.stringify({ ok: true, bg: BG.map(Math.round), keyed_pct: +(100 * killed / (W * H)).toFixed(1) }));
