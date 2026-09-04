#!/usr/bin/env node
/**
 * Set-of-Mark 标注（M28 Stage 1）：在预览上画编号 bounds+标签，并切 per-node crops，喂 VLM 语义 pass。
 * 用法: node annotate.mjs <spec.json> [--out /tmp/som.png] [--crops dir]
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
const A = process.argv.slice(2);
const specP = A[0];
if (!specP || A.includes("--help")) { console.log("用法: node annotate.mjs <spec.json> [--out som.png] [--crops dir]"); process.exit(specP ? 0 : 1); }
const spec = JSON.parse(fs.readFileSync(specP, "utf8"));
const out = A.includes("--out") ? A[A.indexOf("--out") + 1] : "/tmp/som.png";
const F = spec.frame;
const nodes = spec.nodes.filter((n) => (n.text || n.clickable) && n.bbox[2] > 20).slice(0, 60);
const rects = nodes.map((n, i) => { const [x, y, w, h] = n.bbox; return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#f43f5e" stroke-width="4"/><text x="${x + 6}" y="${y + 40}" font-size="34" fill="#f43f5e" font-family="sans-serif">${i}</text>`; }).join("");
await sharp(spec.png).resize({ width: 900 }).composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${F.w}" height="${F.h}">${rects}</svg>`), left: 0, top: 0 }]).resize({ width: 900 }).jpeg({ quality: 80 }).toFile(out);
if (A.includes("--crops")) {
  const dir = A[A.indexOf("--crops") + 1]; fs.mkdirSync(dir, { recursive: true });
  for (let i = 0; i < nodes.length; i++) { const [x, y, w, h] = nodes[i].bbox; try { await sharp(spec.png).extract({ left: x, top: y, width: w, height: h }).toFile(path.join(dir, `n${i}.png`)); } catch {} }
}
console.log("✅", out, "marks:", nodes.length);
