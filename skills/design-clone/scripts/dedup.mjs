#!/usr/bin/env node
/**
 * 感知哈希去重：扫描 <capture目录>/screens/*.png，计算 aHash，
 * 把哈希与重复标记写回 <capture目录>/graph.json（duplicate_of）。
 *
 * 用法: node dedup.mjs <capture目录> [--threshold 6]
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { createRequire } from "node:module";


if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("用法: node dedup.mjs <capture目录> [--threshold 6] [--sub screens|frames] [--cull]\n兼做帧质量体检：每帧算 stddev（空白/黑屏）与 Laplacian 方差（模糊），写回 graph.json 并警告。");
  process.exit(0);
}
const { positionals, values } = parseArgs({ allowPositionals: true, options: { threshold: { type: "string", default: "6" }, sub: { type: "string", default: "screens" }, cull: { type: "boolean", default: false }, json: { type: "boolean", default: false } } });
const dir = positionals[0];
if (!dir) { console.log("用法: node dedup.mjs <capture目录> [--sub screens|frames] [--threshold 6]"); process.exit(1); }

const req = createRequire(import.meta.url);
const sharp = req("sharp");
const threshold = parseInt(values.threshold, 10);
let sub = values.sub;
if (!fs.existsSync(path.join(dir, sub)) && fs.existsSync(path.join(dir, "frames"))) sub = "frames";
const screensDir = path.join(dir, sub);
const graphFile = path.join(dir, "graph.json");

async function aHash(file) {
  const raw = await sharp(file).resize(8, 8, { fit: "fill" }).grayscale().raw().toBuffer();
  const avg = raw.reduce((a, b) => a + b, 0) / raw.length;
  let hex = "";
  for (let i = 0; i < 64; i += 4) {
    let nib = 0;
    for (let j = 0; j < 4; j++) nib = (nib << 1) | (raw[i + j] > avg ? 1 : 0);
    hex += nib.toString(16);
  }
  return hex;
}

async function frameQuality(file) {
  const { data, info } = await sharp(file).grayscale().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height, n = w * h;
  let sum = 0, sum2 = 0;
  for (let i = 0; i < n; i++) { sum += data[i]; sum2 += data[i] * data[i]; }
  const mean = sum / n;
  const stddev = Math.sqrt(Math.max(0, sum2 / n - mean * mean));
  let ls = 0, ls2 = 0, m = 0;
  for (let y = 2; y < h - 2; y += 4)
    for (let x = 2; x < w - 2; x += 4) {
      const i = y * w + x;
      const v = 4 * data[i] - data[i - 1] - data[i + 1] - data[i - w] - data[i + w];
      ls += v; ls2 += v * v; m++;
    }
  const lm = ls / m;
  const sharp_ = ls2 / m - lm * lm;
  return { stddev: +stddev.toFixed(1), sharp: +sharp_.toFixed(1), issue: stddev < 6 ? "blank" : mean < 12 ? "black" : sharp_ < 8 ? "blurry" : null };
}

function hamming(a, b) {
  let d = 0;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    let x = (parseInt(a[i], 16) || 0) ^ (parseInt(b[i], 16) || 0);
    while (x) { d += x & 1; x >>= 1; }
  }
  return d;
}

const files = fs.readdirSync(screensDir).filter((f) => /\.(png|jpe?g)$/i.test(f)).sort();
const hashes = [];
const lowQ = [];
for (const f of files) {
  const id = f.replace(/\.(png|jpe?g)$/i, "");
  const q = await frameQuality(path.join(screensDir, f));
  if (q.issue) lowQ.push({ id, ...q });
  hashes.push({ id, hash: await aHash(path.join(screensDir, f)), quality: q });
}

let marked = 0;
const dupOf = {};
for (let i = 0; i < hashes.length; i++) {
  for (let j = 0; j < i; j++) {
    if (dupOf[hashes[j].id]) continue;
    if (hamming(hashes[i].hash, hashes[j].hash) <= threshold) {
      dupOf[hashes[i].id] = hashes[j].id;
      marked++;
      break;
    }
  }
}

if (fs.existsSync(graphFile)) {
  const graph = JSON.parse(fs.readFileSync(graphFile, "utf8"));
  for (const n of graph.nodes || []) {
    const h = hashes.find((x) => x.id === n.id);
    if (h) { n.hash = h.hash; n.quality = h.quality; }
    if (dupOf[n.id]) n.duplicate_of = dupOf[n.id];
  }
  for (const e of graph.edges || []) {
    if (e.to && dupOf[e.to]) e.to = dupOf[e.to];
  }
  fs.writeFileSync(graphFile, JSON.stringify(graph, null, 2));
}

console.log(`扫描 ${files.length} 屏，标记 ${marked} 屏为重复`);
for (const [id, of] of Object.entries(dupOf)) console.log(`  ${id} → 重复于 ${of}`);
if (lowQ.length) {
  console.log(`⚠ 帧质量体检：${lowQ.length} 帧异常（blank/黑屏/模糊），见下；低质量帧会污染 VLM 分析与裁剪素材`);
  for (const q of lowQ) console.log(`  ${q.id}: ${q.issue} (stddev=${q.stddev}, sharp=${q.sharp})`);
}
if (values.json) console.log(JSON.stringify({ scanned: files.length, marked, dupOf, lowQ }));

if (values.cull && Object.keys(dupOf).length) {
  const dupDir = path.join(screensDir, "_dup");
  fs.mkdirSync(dupDir, { recursive: true });
  for (const id of Object.keys(dupOf)) {
    const f = files.find((x) => x.replace(/\.(png|jpe?g)$/i, "") === id);
    if (f && fs.existsSync(path.join(screensDir, f))) fs.renameSync(path.join(screensDir, f), path.join(dupDir, f));
  }
  console.log(`已把重复帧移入 ${values.sub}/_dup/`);
}
