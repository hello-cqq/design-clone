#!/usr/bin/env node
/**
 * 从 capture/graph.json（或 views 的 data-goto 回落）生成 prototype/paths.json：
 * 场景树/路径画布的数据源。DFS 简单路径枚举（深度≤6/每节点≤20），前缀合并成 trie 树。
 * 用法: node paths-gen.mjs <runDir> [--max-depth 6] [--max-paths 20]
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";


if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("场景树/路径画布的数据源。DFS 简单路径枚举（深度≤6/每节点≤20），前缀合并成 trie 树。\n用法: node paths-gen.mjs <runDir> [--max-depth 6] [--max-paths 20]");
  process.exit(0);
}
const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { "max-depth": { type: "string", default: "6" }, "max-paths": { type: "string", default: "20" } },
});
const run = path.resolve(positionals[0] || ".");
const MAXD = +values["max-depth"], MAXP = +values["max-paths"];
const proto = path.join(run, "prototype");

let nodes = {}, edges = [];
const graphPath = path.join(run, "capture", "graph.json");
if (fs.existsSync(graphPath)) {
  const g = JSON.parse(fs.readFileSync(graphPath, "utf8"));
  const dup = {};
  for (const n of g.nodes || []) {
    if (n.duplicate_of) dup[n.id] = n.duplicate_of;
    else nodes[n.id] = { title: n.title || n.id, index: n.id.slice(0, 2) };
  }
  const remap = (id) => { const seen = new Set(); while (dup[id] && !seen.has(id)) { seen.add(id); id = dup[id]; } return nodes[id] ? id : null; };
  for (const e of g.edges || []) {
    const f = remap(e.from), t = remap(e.to);
    if (f && t && f !== t)
      edges.push({ from: f, to: t, label: `${e.action?.type || "tap"} · ${e.action?.target || ""}`.trim(), kind: "navigate" });
  }
} else {
  const viewsDir = path.join(proto, "views");
  const dc = (fs.existsSync(path.join(proto, "index.html")) ? fs.readFileSync(path.join(proto, "index.html"), "utf8").match(/window\.DC = ([^\n]+?);<\/script>/) : null);
  const pages = dc ? (Function("return " + dc[1])()).pages : [];
  for (const p of pages) nodes[p.id] = { title: p.name || p.id, index: p.id.slice(0, 2) };
  if (fs.existsSync(viewsDir))
    for (const f of fs.readdirSync(viewsDir).filter((x) => x.endsWith(".html"))) {
      const from = f.replace(/\.html$/, "");
      const html = fs.readFileSync(path.join(viewsDir, f), "utf8");
      for (const m of html.matchAll(/data-goto="([^"]+)"/g)) {
        const to = m[1];
        if (to.startsWith("placeholder:") || !nodes[to]) continue;
        const seg = html.slice(Math.max(0, m.index - 200), m.index);
        const title = (seg.match(/title="([^"]+)"/) || [])[1] || "";
        edges.push({ from, to, label: `tap · ${title || to}`, kind: /弹窗|dialog/.test(title) ? "dialog" : "navigate" });
      }
    }
}
edges = edges.filter((e, i) => !edges.some((o, j) => j < i && o.from === e.from && o.to === e.to));

const indeg = {};
edges.forEach((e) => (indeg[e.to] = (indeg[e.to] || 0) + 1));
const roots = Object.keys(nodes).filter((id) => !indeg[id]);
if (!roots.length && Object.keys(nodes).length) roots.push(Object.keys(nodes)[0]);

/* 正向序：BFS 从根扩散；边 to 的序 > from 的序 = fwd，否则 back（返回/回退边）。
   路径/树只沿 fwd 边枚举，保证场景顺序永远从前往后（M14 #6）。 */
const order = {};
{
  const q = [...roots].sort();
  q.forEach((r, i) => (order[r] = i));
  const adj = {};
  edges.forEach((e) => (adj[e.from] = adj[e.from] || []).push(e.to));
  let head = 0;
  while (head < q.length) {
    const cur = q[head++];
    for (const t of (adj[cur] || []).slice().sort()) if (order[t] == null) { order[t] = q.length; q.push(t); }
  }
  Object.keys(nodes).forEach((id, i) => { if (order[id] == null) order[id] = 1000 + i; });
}
edges.forEach((e) => (e.dir = order[e.to] > order[e.from] ? "fwd" : "back"));

const out = {};
edges.forEach((e, i) => { if (e.dir === "fwd") (out[e.from] = out[e.from] || []).push({ i, to: e.to }); });

function enumPaths(start) {
  const res = [];
  const walk = (cur, acc, visited) => {
    if (res.length >= MAXP || acc.length > MAXD) return;
    const nexts = out[cur] || [];
    if (!nexts.length || acc.length === MAXD) { if (acc.length) res.push([...acc]); return; }
    for (const n of nexts) {
      if (visited.has(n.to)) { continue; }
      acc.push(n.i); visited.add(n.to);
      walk(n.to, acc, visited);
      acc.pop(); visited.delete(n.to);
    }
    if (acc.length && nexts.every((n) => visited.has(n.to))) res.push([...acc]);
  };
  walk(start, [], new Set([start]));
  return res.length ? res : [[]];
}

function buildTree(start) {
  const mk = (cur, depth, visited) => {
    const kids = [];
    if (depth >= MAXD) return { node: cur, children: kids };
    for (const n of out[cur] || []) {
      if (visited.has(n.to)) continue;
      visited.add(n.to);
      kids.push({ edge: n.i, child: mk(n.to, depth + 1, visited) });
      visited.delete(n.to);
    }
    return { node: cur, children: kids };
  };
  return mk(start, 0, new Set([start]));
}

const perNode = {};
for (const id of Object.keys(nodes)) perNode[id] = { paths: enumPaths(id), tree: buildTree(id) };

const result = { generated_at: new Date().toISOString(), nodes, edges, roots, perNode };
fs.mkdirSync(proto, { recursive: true });
fs.writeFileSync(path.join(proto, "paths.json"), JSON.stringify(result, null, 2));
console.log(`paths.json: ${Object.keys(nodes).length} 节点 ${edges.length} 边 ${roots.length} 根 → ${path.relative(process.cwd(), proto)}/paths.json`);
