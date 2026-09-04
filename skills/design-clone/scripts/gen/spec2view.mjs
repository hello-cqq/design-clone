#!/usr/bin/env node
/**
 * spec+capture → 保真 HTML 视图（M28 神经符号管线 Stage 3 编译）。
 * 用法: node spec2view.mjs --spec <spec.json> [--overlay <spec.json>] [--anon <map.json>] --out <view.html> [--name 视图名]
 * 文本 span 按 bbox% 定位、字号按 bbox 高；ImageView 按 bbox 真裁成 <img>；背景像素采样；
 * overlay 成层盖在 base 上（暗罩）；clickable 节点可经 --goto <json> wire data-goto。
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const A = process.argv.slice(2);
const get = (k) => (A.includes(k) ? A[A.indexOf(k) + 1] : null);
if (A.includes("--help") || A.includes("-h") || !get("--spec")) {
  console.log("用法: node spec2view.mjs --spec <spec.json> [--overlay <spec.json>] [--anon <map.json>] [--goto <json>] --out <view.html>");
  process.exit(get("--spec") ? 0 : 1);
}
const spec = JSON.parse(fs.readFileSync(get("--spec"), "utf8"));
const overlay = get("--overlay") ? JSON.parse(fs.readFileSync(get("--overlay"), "utf8")) : null;
const anon = get("--anon") ? JSON.parse(fs.readFileSync(get("--anon"), "utf8")) : {};
const gotoMap = get("--goto") ? JSON.parse(fs.readFileSync(get("--goto"), "utf8")) : {};
const out = get("--out");
const png = spec.png;
const F = spec.frame;
const assetsDir = path.join(path.dirname(out), "..", "assets");
fs.mkdirSync(assetsDir, { recursive: true });
const scale = 390 / F.w;

const px = async (x, y) => { const { data } = await sharp(png).extract({ left: Math.min(F.w - 1, x | 0), top: Math.min(F.h - 1, y | 0), width: 1, height: 1 }).raw().toBuffer({ resolveWithObject: true }); return data; };
const rgb = (d) => `rgb(${d[0]},${d[1]},${d[2]})`;
const t = (s) => { let r = s; for (const [k, v] of Object.entries(anon)) r = r.split(k).join(v); return r; };

async function renderNodes(sp, isOverlay) {
  const els = [];
  let ai = 0;
  // 先画容器底色（非全屏 box），再画图标/文本
  for (const n of sp.nodes) {
    const [x, y, w, h] = n.bbox;
    if (n.kind === "box" && w < F.w * 0.98 && h < F.h * 0.9 && w > 40 && h > 20) {
      const c = await px(x + Math.round(w / 2), y + Math.round(h / 2));
      const edge = await px(x + 2, y + 2);
      if (Math.abs(c[0] - edge[0]) + Math.abs(c[1] - edge[1]) + Math.abs(c[2] - edge[2]) < 60)
        els.push(`<div style="position:absolute;left:${(x / F.w * 100).toFixed(2)}%;top:${(y / F.h * 100).toFixed(2)}%;width:${(w / F.w * 100).toFixed(2)}%;height:${(h / F.h * 100).toFixed(2)}%;background:${rgb(c)};border-radius:${Math.round(8 * scale)}px"></div>`);
    }
  }
  for (const n of sp.nodes) {
    const [x, y, w, h] = n.bbox;
    const L = (x / F.w * 100).toFixed(2), T = (y / F.h * 100).toFixed(2), W = (w / F.w * 100).toFixed(2), H = (h / F.h * 100).toFixed(2);
    const go = gotoMap[n.text] || gotoMap[n.rid];
    const clickAttr = go ? ` data-goto="${go}"` : (n.clickable ? ` data-dc="c/${n.id}"` : "");
    if (n.kind === "image" && w < F.w * 0.5 && h < F.h * 0.2) {
      const f = `gen-${path.basename(out, ".html")}-${ai++}.png`;
      try { await sharp(png).extract({ left: x, top: y, width: w, height: h }).toFile(path.join(assetsDir, f)); els.push(`<img src="assets/${f}" alt="" style="position:absolute;left:${L}%;top:${T}%;width:${W}%;height:${H}%;object-fit:contain;border-radius:${Math.round(6 * scale)}px">`); } catch {}
    } else if (n.text) {
      // 文字色取 bbox 内最暗像素（避免采样到背景导致白字隐形）
      let best = [255, 255, 255], bl = 1e9;
      for (let gy = 0; gy < 4; gy++) for (let gx = 0; gx < 6; gx++) {
        const c = await px(x + 2 + Math.round((w - 6) * gx / 5), y + 2 + Math.round((h - 6) * gy / 3));
        const l = c[0] + c[1] + c[2];
        if (l < bl) { bl = l; best = c; }
      }
      const c = best;
      const fsz = Math.max(10, Math.round(h * scale * 0.78));
      const tag = go || n.clickable ? "a" : "span";
      els.push(`<${tag}${clickAttr} style="position:absolute;left:${L}%;top:${T}%;width:${W}%;height:${H}%;font-size:${fsz}px;line-height:${h * scale}px;color:${rgb(c)};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t(n.text)}</${tag}>`);
    }
  }
  return els.join("\n");
}

const bgTop = await px(4, 4), bgMid = await px(4, F.h >> 1);
let html = `<div data-dc="g/root" style="position:relative;width:100%;height:100%;min-height:844px;background:${rgb(bgTop)};overflow:hidden;font-family:system-ui,'PingFang SC',sans-serif">\n`;
html += await renderNodes(spec, false);
if (overlay) {
  if (A.includes("--dim")) html += `\n<div style="position:absolute;inset:0;background:rgba(0,0,0,.45)"></div>\n`;
  html += await renderNodes(overlay, true);
}
html += `\n</div>\n`;
fs.writeFileSync(out, html);
console.log("✅", out, "els:", (html.match(/position:absolute/g) || []).length);
