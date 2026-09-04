#!/usr/bin/env node
/**
 * spec+capture → 层级/组件 HTML（M31/M37 重写，弃平铺绝对）。
 * 用 ui-tree 嵌套包含树推断布局：容器→flex(col/row)+gap，叶文本→span，ImageView→真裁 img。
 * 用法: node spec2view.mjs --spec <spec.json> [--overlay spec] [--dim] [--anon map] [--goto map] [--width N] --out <view.html>
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
const A = process.argv.slice(2);
const get = (k) => (A.includes(k) ? A[A.indexOf(k) + 1] : null);
if (A.includes("--help") || A.includes("-h") || !get("--spec")) { console.log("用法: node spec2view.mjs --spec <spec.json> [--overlay <spec>] [--dim] [--anon <map>] [--goto <map>] [--width N] --out <view.html>"); process.exit(get("--spec") ? 0 : 1); }
const spec = JSON.parse(fs.readFileSync(get("--spec"), "utf8"));
const overlay = get("--overlay") ? JSON.parse(fs.readFileSync(get("--overlay"), "utf8")) : null;
const anon = get("--anon") ? JSON.parse(fs.readFileSync(get("--anon"), "utf8")) : {};
const gotoMap = get("--goto") ? JSON.parse(fs.readFileSync(get("--goto"), "utf8")) : {};
const out = get("--out");
const png = spec.png;
const F = spec.frame;
const assetsDir = get("--assets") || (path.basename(path.dirname(out)) === "views" ? path.join(path.dirname(out), "..", "assets") : path.join(path.dirname(out), "assets"));
fs.mkdirSync(assetsDir, { recursive: true });
const targetW = parseInt(get("--width") || "390", 10);
const scale = targetW / F.w;
const t = (s) => { let r = s; for (const [k, v] of Object.entries(anon)) r = r.split(k).join(v); return r; };
const px = async (x, y) => { const { data } = await sharp(png).extract({ left: Math.max(0, Math.min(F.w - 1, x | 0)), top: Math.max(0, Math.min(F.h - 1, y | 0)), width: 1, height: 1 }).raw().toBuffer({ resolveWithObject: true }); return data; };
const rgb = (d) => `rgb(${d[0]},${d[1]},${d[2]})`;

// 包含树：B 的父 = 最小包含 B 的节点
function buildTree(nodes) {
  const ns = nodes.map((n) => ({ ...n, children: [] }));
  const area = (n) => n.bbox[2] * n.bbox[3];
  const within = (a, b) => a.bbox[0] >= b.bbox[0] - 2 && a.bbox[1] >= b.bbox[1] - 2 && a.bbox[0] + a.bbox[2] <= b.bbox[0] + b.bbox[2] + 2 && a.bbox[1] + a.bbox[3] <= b.bbox[1] + b.bbox[3] + 2;
  for (const c of ns) {
    let best = null;
    for (const p of ns) if (p !== c && within(c, p) && (!best || area(p) < area(best))) best = p;
    if (best) best.children.push(c); else c.root = true;
  }
  return ns.filter((n) => n.root);
}
function axis(n) {
  const k = n.children;
  if (k.length < 2) return "col";
  const dy = Math.abs(k[1].bbox[1] - k[0].bbox[1]);
  const dx = Math.abs(k[1].bbox[0] - k[0].bbox[0]);
  return dy > dx ? "col" : "row";
}
let ai = 0;
async function emit(n, depth) {
  const [x, y, w, h] = n.bbox;
  const S = (o) => Object.entries(o).map(([k, v]) => `${k}:${v}`).join(";");
  if (n.kind === "image" && w < F.w * 0.6) {
    const f = `gen-${path.basename(out, ".html")}-${ai++}.png`;
    try { await sharp(png).extract({ left: x, top: y, width: w, height: h }).toFile(path.join(assetsDir, f)); return `<img src="assets/${f}" alt="" style="${S({ width: (w * scale) + "px", height: (h * scale) + "px", "object-fit": "contain", "border-radius": Math.round(6 * scale) + "px" })}">`; } catch { return ""; }
  }
  if (n.kind === "text" && n.text) {
    let best = [255, 255, 255], bl = 1e9;
    for (let gy = 0; gy < 3; gy++) for (let gx = 0; gx < 4; gx++) { const c = await px(x + 2 + (w - 6) * gx / 3, y + 2 + (h - 6) * gy / 2); const l = c[0] + c[1] + c[2]; if (l < bl) { bl = l; best = c; } }
    const go = gotoMap[n.text];
    const tag = go ? "a" : "span";
    const fsz = Math.max(10, Math.round(h * scale * 0.78));
    return `<${tag}${go ? ` data-goto="${go}"` : ""} style="${S({ "font-size": fsz + "px", color: rgb(best), "line-height": h * scale + "px", "white-space": "nowrap", overflow: "hidden", "text-overflow": "ellipsis" })}">${t(n.text)}</${tag}>`;
  }
  if (n.children.length) {
    const bg = await px(x + 2, y + 2);
    const ax = axis(n);
    const inner = [];
    for (const c of n.children) inner.push(await emit(c, depth + 1));
    return `<div style="${S({ display: "flex", "flex-direction": ax, gap: Math.round(4 * scale) + "px", padding: Math.round(4 * scale) + "px", background: rgb(bg), "border-radius": Math.round(8 * scale) + "px", ...(ax === "col" ? { width: (w * scale) + "px" } : { "align-items": "center" }) })}">${inner.join("")}</div>`;
  }
  return "";
}
const roots = buildTree(spec.nodes);
let body = "";
for (const r of roots) body += await emit(r, 0);
let html = `<div data-dc="g/root" style="position:relative;width:100%;min-height:${Math.round(F.h * scale)}px;background:${rgb(await px(4, 4))};overflow:hidden;display:flex;flex-direction:column;font-family:system-ui,'PingFang SC',sans-serif">${body}</div>\n`;
if (overlay) {
  if (A.includes("--dim")) html = html.replace('data-dc="g/root"', 'data-dc="g/root"') + "";
  const oroots = buildTree(overlay.nodes);
  let ob = "";
  for (const r of oroots) ob += await emit(r, 0);
  html += `<div style="position:absolute;top:0;right:0;${A.includes("--dim") ? "background:rgba(0,0,0,.4);inset:0;" : ""}display:flex;flex-direction:column;align-items:flex-end;padding:${Math.round(60 * scale)}px ${Math.round(12 * scale)}px">${ob}</div>\n`;
}
fs.writeFileSync(out, html);
console.log("✅", out, "els:", (html.match(/<(div|span|a|img)/g) || []).length);
