#!/usr/bin/env node
import sharp from "sharp";
import path from "node:path";
import fs from "node:fs";

const HELP = `img/view.mjs — 读图前按需预处理（上下文预算纪律，M16）

Usage:
  node scripts/img/view.mjs <img> [more imgs...] [--max N] [--q N] [--out FILE] [--grid] [--json]

Why:
  直接 Read 原图（1080x2400+ / 多 MB）会频繁触发上下文压缩。view.mjs 用 sharp
  lanczos3 降到可控预览再读；打印的 factor 用于把预览坐标映射回原图像素
  （extract-assets bbox）。

Options:
  --max N   预览长边上限（默认 1000；--grid 默认 1200）
  --q N     jpeg 质量（默认 82；合图默认 75）
  --out F   预览路径（默认 /tmp/dc-view-<name>.jpg）
  --grid    多图拼成一张联系表（2 列、间距 8、白底），只 Read 这一张
  --json    每张图输出一行 JSON

Behavior:
  - 长边 <= max 且 <= 400KB 的 jpeg/png：打印原路径（no-op）
  - 否则写 q<..> jpeg 预览并打印 {orig, out, factor}
`;

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h") || args.length === 0) {
  console.log(HELP);
  process.exit(0);
}

let max = null, outArg = null, json = false, grid = false, q = null;
const files = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--max") max = +args[++i];
  else if (a === "--q") q = +args[++i];
  else if (a === "--out") outArg = args[++i];
  else if (a === "--grid") grid = true;
  else if (a === "--json") json = true;
  else files.push(a);
}
if (max == null) max = grid ? 1200 : 1000;
if (q == null) q = grid ? 75 : 82;

const emit = (r) => console.log(json ? JSON.stringify(r) : `${r.out}  (${r.origW}x${r.origH}${r.noop ? ", noop" : ` -> ${r.outW}x${r.outH}, factor ${r.factor}`})`);

if (grid) {
  if (files.length < 2) { console.log("--grid 需要 >=2 张图"); process.exit(1); }
  const COLW = 560, GAP = 8;
  const cells = [];
  for (const f of files) {
    const buf0 = await sharp(f).resize({ width: COLW }).jpeg({ quality: 90 }).toBuffer();
    const m2 = await sharp(buf0).metadata();
    cells.push({ buf: buf0, w: m2.width, h: m2.height, label: path.basename(f) });
  }
  const cols = 2;
  const colH = new Array(cols).fill(0);
  const placed = cells.map((c, i) => {
    const col = i % cols;
    const x = col * (COLW + GAP);
    const y = colH[col];
    colH[col] += c.h + GAP;
    return { ...c, x, y };
  });
  const W = cols * COLW + (cols - 1) * GAP;
  const H = Math.max(...colH) - GAP;
  const sc = Math.min(1, max / Math.max(W, H));
  const cw = Math.round(W * sc), ch = Math.round(H * sc);
  const scaled = [];
  for (const p of placed) {
    const buf = await sharp(p.buf).resize(Math.round(p.w * sc), Math.round(p.h * sc)).jpeg({ quality: 90 }).toBuffer();
    scaled.push({ input: buf, left: Math.round(p.x * sc), top: Math.round(p.y * sc) });
  }
  const out = outArg || "/tmp/dc-view-grid.jpg";
  await sharp({ create: { width: cw, height: ch, channels: 3, background: { r: 255, g: 255, b: 255 } } })
    .composite(scaled)
    .jpeg({ quality: q })
    .toFile(out);
  const origMeta = await sharp(files[0]).metadata();
  emit({ src: files.join(","), origW: origMeta.width, origH: origMeta.height, outW: Math.round(COLW * sc), gridH: ch, factor: +(origMeta.width / (COLW * sc)).toFixed(4), out, noop: false, grid: true, cellScale: +sc.toFixed(4), cells: placed.map((p) => ({ label: p.label, x: p.x, y: p.y, w: p.w, h: p.h })) });
  process.exit(0);
}

for (const f of files) {
  const st = fs.statSync(f);
  const meta = await sharp(f).metadata();
  const long = Math.max(meta.width, meta.height);
  const small = long <= max && st.size <= 400 * 1024 && /jpeg|png/.test(meta.format);
  if (small && !outArg) {
    emit({ src: f, origW: meta.width, origH: meta.height, outW: meta.width, outH: meta.height, factor: 1, out: f, noop: true });
    continue;
  }
  const scale = Math.min(1, max / long);
  const outW = Math.round(meta.width * scale);
  const outH = Math.round(meta.height * scale);
  const base = path.basename(f).replace(/\.[a-z0-9]+$/i, "");
  const out = outArg || `/tmp/dc-view-${base}.jpg`;
  await sharp(f).resize(outW, outH, { fit: "inside", kernel: "lanczos3" }).jpeg({ quality: q }).toFile(out);
  emit({ src: f, origW: meta.width, origH: meta.height, outW, outH, factor: +(meta.width / outW).toFixed(4), out, noop: false });
}
