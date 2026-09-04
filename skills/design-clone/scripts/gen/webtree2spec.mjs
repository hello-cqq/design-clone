#!/usr/bin/env node
/**
 * web ui-tree JSON → 统一 region spec（M28）。用法: node webtree2spec.mjs <ui-tree.json> <capture.png> [--out spec.json]
 */
import fs from "node:fs";
const [jp, png, ...r] = process.argv.slice(2);
if (!jp || r.includes("--help")) { console.log("用法: node webtree2spec.mjs <ui-tree.json> <capture.png> [--out spec.json]"); process.exit(jp ? 0 : 1); }
const j = JSON.parse(fs.readFileSync(jp, "utf8"));
const els = j.elements || [];
const W = j.viewport?.width || Math.max(...els.map((e) => e.rect.x + e.rect.w), 1280);
const H = j.viewport?.height || Math.max(...els.map((e) => e.rect.y + e.rect.h), 800);
const nodes = els.filter((e) => e.rect.w > 4 && e.rect.h > 4).map((e, i) => ({ id: "n" + i, bbox: [e.rect.x, e.rect.y, e.rect.w, e.rect.h], text: e.text || "", rid: e.selector || "", cls: e.tag, clickable: !!e.clickable, kind: e.tag === "img" ? "image" : (e.text ? "text" : "box") }));
const spec = { source: "web-dom", png, frame: { w: W, h: H }, nodes };
if (r.includes("--out")) fs.writeFileSync(r[r.indexOf("--out") + 1], JSON.stringify(spec, null, 1));
console.log(JSON.stringify({ nodes: nodes.length, frame: spec.frame }));
