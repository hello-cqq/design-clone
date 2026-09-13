#!/usr/bin/env node
/**
 * brief-flows.mjs（M77-W1）——brief.flows → prototype/paths.json（shell 场景树/路径 schema v3）。
 * 用法: node brief-flows.mjs --run <runDir>
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
const { values: V } = parseArgs({ options: { run: { type: "string" } } });
if (!V.run || process.argv.includes("--help")) { console.log("用法: node brief-flows.mjs --run <runDir>"); process.exit(V.run ? 0 : 1); }
const run = path.resolve(V.run);
const brief = JSON.parse(fs.readFileSync(path.join(run, "knowledge/brief.json"), "utf8"));
const ids = brief.pages.map((p) => p.id);
const nodes = Object.fromEntries(brief.pages.map((p) => [p.id, { title: p.name }]));
const edges = [];
for (const f of brief.flows || []) if (ids.includes(f.from) && ids.includes(f.to)) edges.push({ from: f.from, to: f.to, kind: "flow", label: (f.story || f.to).slice(0, 18) });
const adj = new Map(ids.map((i) => [i, []]));
edges.forEach((e, i) => adj.get(e.from).push(i));
const root = ids[0];
const depth = new Map([[root, 0]]);
{ const q = [root]; while (q.length) { const cur = q.shift(); for (const ei of adj.get(cur)) { const nx = edges[ei].to; if (!depth.has(nx)) { depth.set(nx, depth.get(cur) + 1); q.push(nx); } } } }
for (const [nid, list] of adj) for (const ei of [...list]) if (depth.get(edges[ei].to) < depth.get(nid)) list.splice(list.indexOf(ei), 1);
const allPaths = (start) => {
  const out = [];
  const walk = (cur, acc) => { const nxt = adj.get(cur); if (!nxt.length) { if (acc.length) out.push(acc); return; } for (const ei of nxt) walk(edges[ei].to, [...acc, ei]); };
  walk(start, []);
  return out.slice(0, 12);
};
const mkTree = (nid, seen = new Set()) => {
  if (seen.has(nid)) return { node: nid, children: [] };
  seen.add(nid);
  const kids = adj.get(nid).map((ei) => ({ edge: ei, child: mkTree(edges[ei].to, new Set(seen)) }));
  return { node: nid, children: kids };
};
const perNode = {};
for (const id of ids) {
  const paths = allPaths(id);
  perNode[id] = {
    paths,
    pathInfo: paths.map((_, i) => ({ source: "brief", flow: "b" + (i + 1), name: `${nodes[id].title} 链路 ${i + 1}` })),
    nav: adj.get(id).map((ei) => edges[ei].to),
    tree: mkTree(id),
  };
}
const out = { generated_at: new Date().toISOString(), version: 3, flowsUsed: true, nodes, edges, roots: [root], depths: Object.fromEntries(depth), perNode };
fs.writeFileSync(path.join(run, "prototype", "paths.json"), JSON.stringify(out, null, 2));
console.log("paths.json v3:", ids.length, "nodes,", edges.length, "edges");
