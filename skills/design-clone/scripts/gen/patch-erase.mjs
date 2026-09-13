#!/usr/bin/env node
/**
 * patch-erase.mjs —— 通用小物件擦除（M75/W8）：静帧或逐帧视频中擦除 mask 区域并以同帧最优源补丁融合。
 * 去铅笔/水印/角标/瑕疵等首选调；大面积或语义复杂背景不适用（见 references/asset-retouch.md 边界）。
 *
 * 用法:
 *   node patch-erase.mjs --in <file|framesDir> --out <file|framesDir> --mask <spec> [opts]
 * mask spec:
 *   poly:x1,y1;x2,y2;...          多边形
 *   rect:x,y,w,h                  矩形
 *   color:RRGGBB,tol[@x,y,w,h]    颜色键（可选限定区域）——如黄色铅笔 color:e8b34a,60@760,260,160,220
 *   file:<mask.png>               掩膜图（亮=擦除）
 * opts:
 *   --feather <px=6>              边界羽化
 *   --streak                      方向性纹理（发丝/毛发/木纹）：候选偏移向主梯度方向加权
 *   --preview <out.png>           输出 mask 叠加预览
 *   --ring <px=6>                 接缝评分环宽
 *
 * 原理：边界环 SSD 选最优同帧源偏移（patch-match lite）→ 距离场羽化融合 → 颗粒匹配。
 * 逐帧模式下每帧独立选源（同帧相对补丁），天然抗运动，无需跟踪器。
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { createRequire } from "node:module";
const sharp = createRequire(import.meta.url)("sharp");

function s_usage() { return "patch-erase.mjs —— 通用小物件擦除\n用法: node patch-erase.mjs --in <file|framesDir> --out <file|framesDir> --mask <spec> [opts]\nmask spec: poly:x1,y1;x2,y2;... | rect:x,y,w,h | color:RRGGBB,tol[@x,y,w,h]\nopts: --feather --ring --dilate --streak --preview --track --trackmask --window --tracktol --srcreplace\n详见文件头注释与 references/asset-retouch.md"; }
if (process.argv.includes("--help") || process.argv.includes("-h")) { console.log(s_usage()); process.exit(0); }
const { values: V } = parseArgs({
  options: {
    in: { type: "string" }, out: { type: "string" }, mask: { type: "string" },
    feather: { type: "string", default: "6" }, ring: { type: "string", default: "6" },
    streak: { type: "boolean", default: false }, preview: { type: "string" }, dilate: { type: "string", default: "0" },
    track: { type: "string" }, trackmask: { type: "string" }, window: { type: "string", default: "24" }, tracktol: { type: "string", default: "900" }, srcreplace: { type: "string" },
  },
});
if (!V.in || !V.out || (!V.mask && !V.track)) { console.log(s_usage()); process.exit(1); }
const FE = +V.feather, RING = +V.ring;

/* ---------- mask 构建 ---------- */
function parseMaskSpec(spec, w, h, px) {
  const m = new Uint8Array(w * h);
  if (spec.startsWith("poly:")) {
    const pts = spec.slice(5).split(";").map((p) => p.split(",").map(Number));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (inPoly(x + .5, y + .5, pts)) m[y * w + x] = 1;
  } else if (spec.startsWith("rect:")) {
    const [x0, y0, rw, rh] = spec.slice(5).split(",").map(Number);
    for (let y = Math.max(0, y0); y < Math.min(h, y0 + rh); y++) for (let x = Math.max(0, x0); x < Math.min(w, x0 + rw); x++) m[y * w + x] = 1;
  } else if (spec.startsWith("color:")) {
    const [ct, region] = spec.slice(6).split("@");
    const [hex, tol] = ct.split(",");
    const t = +tol || 40;
    const cr = parseInt(hex.slice(0, 2), 16), cg = parseInt(hex.slice(2, 4), 16), cb = parseInt(hex.slice(4, 6), 16);
    let rx0 = 0, ry0 = 0, rw = w, rh = h;
    if (region) [rx0, ry0, rw, rh] = region.split(",").map(Number);
    for (let y = ry0; y < Math.min(h, ry0 + rh); y++) for (let x = rx0; x < Math.min(w, rx0 + rw); x++) {
      const i = (y * w + x) * 4;
      const d = Math.hypot(px[i] - cr, px[i + 1] - cg, px[i + 2] - cb);
      if (d < t) m[y * w + x] = 1;
    }
  } else if (spec.startsWith("file:")) {
    throw new Error("file mask 暂未实现（用 poly/rect/color）");
  } else throw new Error("未知 mask spec");
  const DL = +((V && V.dilate) || 0);
  for (let k = 0; k < DL; k++) {
    const cp = Uint8Array.from(m);
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (!cp[i] && (cp[i - 1] || cp[i + 1] || cp[i - w] || cp[i + w])) m[i] = 1;
    }
  }
  let n = 0; for (let i = 0; i < m.length; i++) n += m[i];
  return { m, n };
}
function inPoly(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/* ---------- 距离场（mask 内深度，用于羽化） ---------- */
function innerDist(m, w, h) {
  const d = new Int16Array(w * h).fill(0);
  const q = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (m[i] && (x === 0 || y === 0 || x === w - 1 || y === h - 1 || !m[i - 1] || !m[i + 1] || !m[i - w] || !m[i + w])) { d[i] = 1; q.push(i); }
  }
  for (let qi = 0; qi < q.length; qi++) {
    const i = q[qi], dd = d[i];
    for (const j of [i - 1, i + 1, i - w, i + w]) if (j >= 0 && j < w * h && m[j] && !d[j]) { d[j] = dd + 1; q.push(j); }
  }
  return d;
}

/* ---------- 主处理 ---------- */
let _tpl = null;
function ssdAt(px, w, h, dx, dy) {
  const t = _tpl; let sc = 0, n = 0;
  for (let y = 0; y < t.h; y += 2) for (let x = 0; x < t.w; x += 2) {
    const ti = y * t.w + x;
    if (!t.mask[ti]) continue;
    const fx = x + dx, fy = y + dy;
    if (fx < 0 || fy < 0 || fx >= w || fy >= h) return Infinity;
    const fi = (fy * w + fx) * 4, qi = ti * 4;
    sc += (px[fi] - t.px[qi]) ** 2 + (px[fi + 1] - t.px[qi + 1]) ** 2 + (px[fi + 2] - t.px[qi + 2]) ** 2;
    n++;
  }
  return n ? sc / n : Infinity;
}
async function trackOffset(px, w, h) {
  if (!_tpl) {
    const t = await sharp(V.track).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    _tpl = { px: new Uint8ClampedArray(t.data), w: t.info.width, h: t.info.height };
    _tpl.mask = parseMaskSpec(V.trackmask, _tpl.w, _tpl.h, _tpl.px).m;
  }
  const W = +V.window;
  let best = [0, 0], bestSc = Infinity;
  for (let dy = -W; dy <= W; dy += 2) for (let dx = -W; dx <= W; dx += 2) {
    const sc = ssdAt(px, w, h, dx, dy);
    if (sc < bestSc) { bestSc = sc; best = [dx, dy]; }
  }
  for (let dy = best[1] - 2; dy <= best[1] + 2; dy++) for (let dx = best[0] - 2; dx <= best[0] + 2; dx++) {
    const sc = ssdAt(px, w, h, dx, dy);
    if (sc < bestSc) { bestSc = sc; best = [dx, dy]; }
  }
  return { off: best, score: bestSc };
}
async function processOne(srcPath, dstPath) {
  const img = sharp(srcPath).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  const px = new Uint8ClampedArray(data);
  let mask, maskN;
  if (V.track) {
    const { off, score } = await trackOffset(px, w, h);
    if (score > +V.tracktol) return null; // 该帧无目标或置信度不足 → 跳过
    const pts = V.trackmask.slice(5).split(";").map((q) => q.split(",").map(Number));
    mask = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (inPoly(x + .5 - off[0], y + .5 - off[1], pts)) mask[y * w + x] = 1;
    const DL = +V.dilate;
    for (let k = 0; k < DL; k++) { const cp = Uint8Array.from(mask); for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x; if (!cp[i] && (cp[i - 1] || cp[i + 1] || cp[i - w] || cp[i + w])) mask[i] = 1; } }
    for (let i = 0; i < mask.length; i++) maskN = (maskN || 0) + mask[i];
    if (!maskN) return null;
  } else {
    const r = parseMaskSpec(V.mask, w, h, px);
    mask = r.m; maskN = r.n;
    if (!maskN) return null; // 该帧无目标（视频其他镜头）→ 跳过
  }
  // bbox
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (mask[y * w + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1, d0 = Math.max(bw, bh);
  // ring（mask 外 RING 内）
  const dist = innerDist(mask, w, h);
  const ring = [];
  for (let y = Math.max(0, y0 - RING); y < Math.min(h, y1 + RING); y++) for (let x = Math.max(0, x0 - RING); x < Math.min(w, x1 + RING); x++) {
    const i = y * w + x;
    if (!mask[i] && nearMask(x, y, mask, w)) ring.push(i);
  }
  // 主梯度方向（streak）
  let domAng = null;
  if (V.streak) {
    const hist = new Array(12).fill(0);
    for (const i of ring) {
      const x = i % w, y = (i / w) | 0;
      if (x < 1 || y < 1 || x >= w - 1 || y >= h - 1) continue;
      const gx = lum(px, i + 1) - lum(px, i - 1), gy = lum(px, i + w) - lum(px, i - w);
      const mag = Math.hypot(gx, gy);
      if (mag > 12) hist[Math.floor(((Math.atan2(gy, gx) + Math.PI) / (Math.PI * 2)) * 12) % 12] += mag;
    }
    let bi = 0; for (let i = 1; i < 12; i++) if (hist[i] > hist[bi]) bi = i;
    domAng = (bi / 12) * Math.PI * 2 - Math.PI; // 梯度方向；纹理方向=梯度+90°
    domAng += Math.PI / 2;
  }
  // M75: 清洗参考帧直接移植（视频同镜头静漂移场景的完美源）
  if (V.srcreplace) {
    const sr = await sharp(V.srcreplace).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const spx = new Uint8ClampedArray(sr.data);
    if (sr.info.width !== w || sr.info.height !== h) throw new Error("srcreplace 尺寸需与帧一致");
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = y * w + x;
      if (!mask[i]) continue;
      const a = Math.min(1, (dist[i] + 1) / FE);
      for (let c = 0; c < 3; c++) px[i * 4 + c] = px[i * 4 + c] * (1 - a) + spx[i * 4 + c] * a;
    }
    if (V.preview) { const ov = Buffer.from(px); for (let i = 0; i < w * h; i++) if (mask[i]) { ov[i * 4] = 255; ov[i * 4 + 1] = 0; ov[i * 4 + 2] = 0; } await sharp(ov, { raw: { width: w, height: h, channels: 4 } }).png().toFile(V.preview); }
    await sharp(Buffer.from(px), { raw: { width: w, height: h, channels: 4 } }).png().toFile(dstPath);
    return { off: [0, 0], score: 0, mode: "srcreplace", px: [w, h] };
  }
  // 候选偏移
  const cands = [];
  for (let k = 0; k < 64; k++) for (const r of [d0, d0 * 1.6, d0 * 2.4, d0 * 3.2]) {
    const a = (k / 64) * Math.PI * 2;
    cands.push([Math.round(Math.cos(a) * r), Math.round(Math.sin(a) * r)]);
  }
  for (let k = 0; k < 40; k++) cands.push([Math.round((Math.random() - .5) * w * .8), Math.round((Math.random() - .5) * h * .8)]);
  let best = null, bestScore = Infinity;
  for (const [ox, oy] of cands) {
    if (!ox && !oy) continue;
    // 源区不得与 mask 相交（bbox 粗判+抽样细判）
    if (ox < bw && ox > -bw && oy < bh && oy > -bh) {
      let hit = false;
      for (let s = 0; s < 200; s++) {
        const i = (y0 + ((Math.random() * bh) | 0)) * w + x0 + ((Math.random() * bw) | 0);
        const j = i + oy * w + ox;
        if (j >= 0 && j < w * h && mask[i] && mask[j]) { hit = true; break; }
      }
      if (hit) continue;
    }
    let sc = 0, cnt = 0;
    for (let s = 0; s < ring.length; s += 2) {
      const i = ring[s], j = i + oy * w + ox;
      if (j < 0 || j >= w * h) { sc = Infinity; break; }
      const x = i % w, y = (i / w) | 0;
      const xj = j % w;
      sc += (px[i * 4] - px[j * 4]) ** 2 + (px[i * 4 + 1] - px[j * 4 + 1]) ** 2 + (px[i * 4 + 2] - px[j * 4 + 2]) ** 2;
      cnt++;
    }
    if (sc === Infinity) continue;
    sc /= Math.max(1, cnt);
    if (domAng != null) {
      const ang = Math.atan2(oy, ox);
      let da = Math.abs(((ang - domAng + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      da = Math.PI - da; // 与主方向夹角（0=同向）
      if (da < 0.45) sc *= 0.75; else if (da > 1.2) sc *= 1.15;
    }
    if (sc < bestScore) { bestScore = sc; best = [ox, oy]; }
  }
  if (!best) throw new Error("未找到可行源补丁（mask 过大或画面过匀）");
  const [ox, oy] = best;
  // 融合
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const i = y * w + x;
    if (!mask[i]) continue;
    const j = i + oy * w + ox;
    if (j < 0 || j >= w * h) continue;
    const a = Math.min(1, (dist[i] + 1) / FE);
    for (let c = 0; c < 3; c++) px[i * 4 + c] = px[i * 4 + c] * (1 - a) + px[j * 4 + c] * a;
  }
  if (V.preview) {
    const ov = Buffer.from(px);
    for (let i = 0; i < w * h; i++) if (mask[i]) { ov[i * 4] = 255; ov[i * 4 + 1] = 0; ov[i * 4 + 2] = 0; ov[i * 4 + 3] = Math.max(ov[i * 4 + 3], 120); }
    await sharp(ov, { raw: { width: w, height: h, channels: 4 } }).png().toFile(V.preview);
  }
  await sharp(Buffer.from(px), { raw: { width: w, height: h, channels: 4 } }).png().toFile(dstPath);
  return { off: best, score: Math.round(bestScore), px: [w, h] };
}
function lum(px, i) { return .299 * px[i * 4] + .587 * px[i * 4 + 1] + .114 * px[i * 4 + 2]; }
function nearMask(x, y, m, w) { return m[x - 1 + y * w] || m[x + 1 + y * w] || m[x + (y - 1) * w] || m[x + (y + 1) * w] || false; }

/* ---------- 入口：单文件或帧目录 ---------- */
const st = fs.statSync(V.in);
if (st.isDirectory()) {
  fs.mkdirSync(V.out, { recursive: true });
  const files = fs.readdirSync(V.in).filter((f) => /\.(png|jpe?g)$/i.test(f)).sort();
  let done = 0, skipped = 0;
  for (const f of files) {
    const dst = path.join(V.out, f.replace(/\.jpe?g$/i, ".png"));
    const r = await processOne(path.join(V.in, f), dst);
    if (!r) { fs.copyFileSync(path.join(V.in, f), dst); skipped++; continue; }
    done++;
    if (done === 1) console.log(JSON.stringify(r));
  }
  console.log(`frames: ${files.length}, patched: ${done}, skipped: ${skipped}`);
} else {
  const r = await processOne(V.in, V.out);
  if (!r) { fs.copyFileSync(V.in, V.out); console.log("mask 为空，原样复制"); }
  else console.log(JSON.stringify(r));
}
