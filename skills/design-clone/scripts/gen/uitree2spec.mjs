#!/usr/bin/env node
/**
 * Android uiautomator XML → 统一 region spec（M28 神经符号管线 Stage 0）。
 * 用法: node uitree2spec.mjs <ui-tree.xml> <capture.png> [--out spec.json]
 * 输出节点：id/bbox/text/rid/cls/clickable/leaf(是否叶子可见)/kind(text|icon|image|row)
 */
import fs from "node:fs";

const [xmlP, pngP, ...rest] = process.argv.slice(2);
if (!xmlP || rest.includes("--help") || rest.includes("-h")) { console.log("用法: node uitree2spec.mjs <ui-tree.xml> <capture.png> [--out spec.json]"); process.exit(xmlP ? 0 : 1); }
const outP = rest.includes("--out") ? rest[rest.indexOf("--out") + 1] : null;
const xml = fs.readFileSync(xmlP, "utf8");

const nodes = [];
const re = /<node[^>]*>/g;
let m, i = 0;
while ((m = re.exec(xml))) {
  const tag = m[0];
  const g = (k) => { const r = tag.match(new RegExp(k + '="([^"]*)"')); return r ? r[1] : ""; };
  const b = g("bounds").match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
  if (!b) continue;
  const [x1, y1, x2, y2] = [+b[1], +b[2], +b[3], +b[4]];
  const w = x2 - x1, h = y2 - y1;
  if (w <= 4 || h <= 4) continue;
  const text = g("text"), rid = g("resource-id"), cls = g("class"), click = g("clickable") === "true";
  const leafText = text && !/<node[^>]*text="[^"]+"/.test(xml.slice(re.lastIndex, re.lastIndex + 400));
  nodes.push({ id: "n" + i++, bbox: [x1, y1, w, h], text, rid, cls, clickable: click, kind: /ImageView/.test(cls) ? "image" : (text ? "text" : "box") });
}
// frame = 最大 bounds
const frame = nodes.reduce((a, n) => ({ w: Math.max(a.w, n.bbox[0] + n.bbox[2]), h: Math.max(a.h, n.bbox[1] + n.bbox[3]) }), { w: 0, h: 0 });
const spec = { source: "android-uiautomator", xml: xmlP, png: pngP, frame, nodes };
if (outP) fs.writeFileSync(outP, JSON.stringify(spec, null, 1));
console.log(JSON.stringify({ nodes: nodes.length, frame, clickable: nodes.filter((n) => n.clickable).length, texts: nodes.filter((n) => n.text).length }));
