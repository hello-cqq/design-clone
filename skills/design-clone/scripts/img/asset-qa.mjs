#!/usr/bin/env node
/**
 * 资产质量门（M19）：进视图的图必须"有效"——不模糊、无空白、不截断、无无关因素。
 * 用法: node asset-qa.mjs <runDir> [--sheet /tmp/qa-sheet.jpg] [--review]
 * 流程: 启发式（blur/blank 复用 extract-assets 阈值 + 截断=主体贴边启发）→ 自动判 pass/fail/flag
 *       → 出 contact sheet 交宿主 VLM 复核（--review 时打印清单）→ 落 <run>/prototype/assets-qa.json
 * 处理梯（fail 时）: 重拍(settle) / 加边重裁 / 换源原图(web --assets) / sharp 增强重 matte / genimg 风格锚
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const [runDir, ...rest] = process.argv.slice(2);
if (!runDir || rest.includes("--help") || rest.includes("-h")) {
  console.log("用法: node asset-qa.mjs <runDir> [--sheet /tmp/sheet.jpg] [--review]");
  process.exit(runDir ? 0 : 1);
}
const sheet = rest[rest.indexOf("--sheet") + 1] || null;
const review = rest.includes("--review");
const assetsDir = path.join(path.resolve(runDir), "prototype/assets");
if (!fs.existsSync(assetsDir)) { console.log(JSON.stringify({ checked: 0, note: "no assets dir" })); process.exit(0); }

const stats = async (f) => {
  const { data, info } = await sharp(f).grayscale().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  let sum = 0, sum2 = 0;
  for (let i = 0; i < data.length; i++) { sum += data[i]; sum2 += data[i] * data[i]; }
  const n = data.length, mean = sum / n, stddev = Math.sqrt(Math.max(0, sum2 / n - mean * mean));
  let ls = 0, ls2 = 0, lc = 0;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x, v = 4 * data[i] - data[i - 1] - data[i + 1] - data[i - w] - data[i + w];
    ls += v; ls2 += v * v; lc++;
  }
  const sharp_ = ls2 / lc - (ls / lc) ** 2;
  // 截断启发：四边 6% 条带的 laplacian 能量占比过高=主体可能贴边被切
  const bw = Math.max(2, Math.round(w * 0.06)), bh = Math.max(2, Math.round(h * 0.06));
  let be = 0, bc = 0, ie = 0, ic = 0;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x, v = Math.abs(4 * data[i] - data[i - 1] - data[i + 1] - data[i - w] - data[i + w]);
    if (x < bw || x >= w - bw || y < bh || y >= h - bh) { be += v; bc++; } else { ie += v; ic++; }
  }
  const edgeRatio = bc && ic ? (be / bc) / Math.max(1e-6, ie / ic) : 0;
  return { stddev, sharp: sharp_, edgeRatio };
};

const files = fs.readdirSync(assetsDir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
if (!files.length) { console.log(JSON.stringify({ checked: 0, note: "no assets" })); process.exit(0); }
const qa = {};
for (const f of files) {
  const p = path.join(assetsDir, f);
  const meta = await sharp(p).metadata();
  const s = await stats(p);
  const issues = [];
  if (s.stddev < 6) issues.push("blank");
  if (s.sharp < 8) issues.push("blurry");
  if (s.edgeRatio > 2.2) issues.push("maybe-truncated");
  if ((meta.width || 0) < 48 || (meta.height || 0) < 48) issues.push("too-small");
  qa[f] = { ...s, edgeRatio: +s.edgeRatio.toFixed(2), verdict: issues.length ? (issues.includes("blank") || issues.includes("blurry") ? "fail" : "flag") : "pass", issues };
}
fs.writeFileSync(path.join(assetsDir, "..", "assets-qa.json"), JSON.stringify({ generated_at: new Date().toISOString(), assets: qa }, null, 1));
if (sheet) {
  const COLW = 260, GAP = 8, cols = 4;
  const cells = [];
  for (const f of files.slice(0, 12)) {
    const buf = await sharp(path.join(assetsDir, f)).resize({ width: COLW }).jpeg({ quality: 85 }).toBuffer();
    const m = await sharp(buf).metadata();
    cells.push({ buf, w: m.width, h: m.height });
  }
  const colH = new Array(cols).fill(0);
  const placed = cells.map((c, i) => { const col = i % cols; const x = col * (COLW + GAP), y = colH[col]; colH[col] += c.h + GAP; return { ...c, x, y }; });
  const W = cols * COLW + (cols - 1) * GAP, H = Math.max(...colH) - GAP;
  await sharp({ create: { width: W, height: H, channels: 3, background: { r: 255, g: 255, b: 255 } } })
    .composite(placed.map((p) => ({ input: p.buf, left: p.x, top: p.y }))).jpeg({ quality: 80 }).toFile(sheet);
}
const summary = { checked: files.length, pass: Object.values(qa).filter((q) => q.verdict === "pass").length, fail: Object.values(qa).filter((q) => q.verdict === "fail").length, flag: Object.values(qa).filter((q) => q.verdict === "flag").length };
if (review) for (const [f, q] of Object.entries(qa)) if (q.verdict !== "pass") console.log(`${q.verdict}: ${f} ${q.issues.join(",")} (sharp=${q.sharp.toFixed(1)} stddev=${q.stddev.toFixed(1)} edge=${q.edgeRatio})`);
console.log(JSON.stringify({ ...summary, sheet }));
