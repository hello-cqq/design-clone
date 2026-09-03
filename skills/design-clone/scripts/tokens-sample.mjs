#!/usr/bin/env node
/**
 * 证据图像素采样 → 精确色值（写回 tokens.css 用）。
 * 用法: node tokens-sample.mjs <image> --points "x,y,--color-primary;120,300,--color-bg"
 * 输出 JSON: { name: "#hex" }
 */
import sharp from "sharp";
import { parseArgs } from "node:util";


if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("用法: node tokens-sample.mjs <image> --points \"x,y,--color-primary;120,300,--color-bg\"");
  process.exit(0);
}
const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { points: { type: "string" } },
});
const img = positionals[0];
if (!img || !values.points) {
  console.log("用法: node tokens-sample.mjs <image> --points \"x,y,name;...\"");
  process.exit(1);
}
const { data, info } = await sharp(img).raw().toBuffer({ resolveWithObject: true });
const at = (x, y) => {
  const i = (Math.round(y) * info.width + Math.round(x)) * info.channels;
  return "#" + [0, 1, 2].map((k) => data[i + k].toString(16).padStart(2, "0")).join("");
};
const out = {};
for (const p of values.points.split(";")) {
  const [x, y, ...nm] = p.split(",");
  const name = nm.join(",").trim() || `p_${x}_${y}`;
  out[name] = at(+x, +y);
}
console.log(JSON.stringify(out, null, 2));
