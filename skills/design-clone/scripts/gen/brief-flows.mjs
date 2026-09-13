#!/usr/bin/env node
/**
 * brief-flows.mjs（M77-W1）——brief.flows → prototype/paths.json（perNode.nav + depths BFS）。
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
const adj = new Map(ids.map((i) => [i, new Set()]));
for (const f of brief.flows || []) if (adj.has(f.from) && adj.has(f.to)) adj.get(f.from).add(f.to);
const root = ids[0];
const depth = new Map([[root, 0]]);
const q = [root];
while (q.length) { const cur = q.shift(); for (const nx of adj.get(cur)) if (!depth.has(nx)) { depth.set(nx, depth.get(cur) + 1); q.push(nx); } }
for (const [a, set] of adj) for (const b of [...set]) if (depth.has(b) && depth.has(a) && depth.get(b) < depth.get(a)) set.delete(b);
const perNode = ids.map((id) => ({ id, nav: [...adj.get(id)] }));
const paths = [];
const walk = (cur, acc) => { const nxt = [...adj.get(cur)]; if (!nxt.length) { paths.push([...acc, cur]); return; } for (const n of nxt) walk(n, [...acc, cur]); };
walk(root, []);
const out = { version: 3, root, perNode, depths: Object.fromEntries(depth), paths: paths.slice(0, 24), stories: (brief.flows || []).map((f) => f.story) };
fs.writeFileSync(path.join(run, "prototype", "paths.json"), JSON.stringify(out, null, 2));
console.log("paths.json:", perNode.length, "nodes,", paths.length, "paths");
