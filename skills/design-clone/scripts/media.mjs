#!/usr/bin/env node
/**
 * media.mjs（M99-2）——媒体后处理工具集（sharp + ffmpeg）。
 * 用法:
 *   node media.mjs webp     --in <png|jpg> --out <webp> [--q 80]
 *   node media.mjs avif     --in <png|jpg> --out <avif> [--q 60]
 *   node media.mjs gif      --in <mp4|webm> --out <gif> [--fps 12] [--width 480]
 *   node media.mjs frames   --in <mp4|webm> --out <dir> [--fps 1]
 *   node media.mjs matte    --in <png> --out <png>            # 近纯色底抠透明（转调 gen/keybg.mjs）
 *   node media.mjs compress --in <png> --out <png> [--kb 300] # palette 双档压到目标 KB
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const sharp = require("sharp");

const { values, positionals } = parseArgs({ allowPositionals: true, options: { in: { type: "string" }, out: { type: "string" }, q: { type: "string" }, fps: { type: "string" }, width: { type: "string" }, kb: { type: "string" }, help: { type: "boolean" } } });
const cmd = positionals[0];
const IN = values.in, OUT = values.out;
if (values.help || !cmd || !IN || !OUT) { console.log("用法: node media.mjs <webp|avif|gif|frames|matte|compress> --in <f> --out <f> [opts]"); process.exit(values.help ? 0 : 1); }
fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });
const ff = (c) => execSync(c, { stdio: "pipe" });

if (cmd === "webp") await sharp(IN).webp({ quality: +(values.q || 80) }).toFile(OUT);
else if (cmd === "avif") await sharp(IN).avif({ quality: +(values.q || 60) }).toFile(OUT);
else if (cmd === "gif") ff(`ffmpeg -y -v error -i "${IN}" -vf "fps=${values.fps || 12},scale=${values.width || 480}:-1:flags=lanczos,split[a][b];[a]palettegen=reserve_transparent=on[p];[b][p]paletteuse=alpha_threshold=128" -loop 0 "${OUT}"`);
else if (cmd === "frames") { fs.mkdirSync(OUT, { recursive: true }); ff(`ffmpeg -y -v error -i "${IN}" -vf fps=${values.fps || 1} "${path.join(OUT, "f-%03d.png")}"`); }
else if (cmd === "matte") execSync(`node "${path.join(path.dirname(new URL(import.meta.url).pathname), "gen", "keybg.mjs")}" --in "${IN}" --out "${OUT}"`, { stdio: "inherit" });
else if (cmd === "compress") {
  const target = +(values.kb || 300) * 1024;
  for (const [q, colors] of [[80, 256], [60, 128], [45, 96]]) {
    await sharp(IN).png({ palette: true, quality: q, compressionLevel: 9, colors }).toFile(OUT);
    if (fs.statSync(OUT).size <= target) break;
  }
} else { console.error("未知子命令: " + cmd); process.exit(1); }
console.log("media:", cmd, path.basename(OUT), fs.statSync(OUT).size + "B");
