#!/usr/bin/env node
/**
 * paths-gen v2（M44j）：场景树/路径按**真实交互逻辑**决策，不再机械 DFS 全图。
 * 边角色四分类：
 *   module = 持久 chrome 容器（tabbar/rail/navbar/wm-nav/ap-nav/da-rail…）或 hub 目标（≥60% 节点链接它）→ 切模块，不进路径
 *   drill  = 内容列表行/卡片且目标屏有 back 边回源（back-pair 强信号）→ 父→子
 *   task   = 内容内 CTA/按钮 → 任务步
 *   modal  = 目标为 sheet/dialog/弹窗 → 分支
 *   back   = 返回/‹/data-act=back → 仅校验父子，不进 fwd
 * 数据优先级：knowledge/flows.json（真实流：录制 events 归纳或 agent 推断）> 结构推导（role 分类后仅沿 drill/task/modal）> 朴素 DFS 兜底。
 * 每条 path 带 source: flow|derived。nav 边保留 role=module 供画布淡显 + perNode[].nav 平铺。
 * 用法: node paths-gen.mjs <runDir> [--max-depth 6] [--max-paths 20]
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("场景树/路径按真实交互逻辑决策（module/drill/task/modal/back + flows.json 优先）。\n用法: node paths-gen.mjs <runDir> [--max-depth 6] [--max-paths 20]");
  process.exit(0);
}
const { positionals, values } = parseArgs({ allowPositionals: true, options: { "max-depth": { type: "string", default: "6" }, "max-paths": { type: "string", default: "20" } } });
const run = path.resolve(positionals[0] || ".");
const MAXD = +values["max-depth"], MAXP = +values["max-paths"];
const proto = path.join(run, "prototype");
const CHROME_RE = /tabbar|mi-tab|rail|navbar|wm-nav|ap-nav|da-rail|tab-bar|bottombar|topbar|framebar/i;
const BACK_RE = /返回|back|‹|←/i;
const MODAL_RE = /弹窗|弹层|dialog|sheet|menu|菜单/i;

let nodes = {}, raw = [];
const graphPath = path.join(run, "capture", "graph.json");
if (fs.existsSync(graphPath)) {
  const g = JSON.parse(fs.readFileSync(graphPath, "utf8"));
  const dup = {};
  for (const n of g.nodes || []) { if (n.duplicate_of) dup[n.id] = n.duplicate_of; else nodes[n.id] = { title: n.title || n.id, index: n.id.slice(0, 2) }; }
  const remap = (id) => { const seen = new Set(); while (dup[id] && !seen.has(id)) { seen.add(id); id = dup[id]; } return nodes[id] ? id : null; };
  for (const e of g.edges || []) {
    const f = remap(e.from), t = remap(e.to);
    if (!f || !t || f === t) continue;
    const act = (e.action && e.action.type) || "tap";
    const tgt = (e.action && e.action.target) || "";
    raw.push({ from: f, to: t, label: `${act} · ${tgt}`.trim(), chrome: CHROME_RE.test((e.action && e.action.container) || ""), back: act === "back" || BACK_RE.test(tgt), modal: act === "sheet" || act === "dialog" || MODAL_RE.test(tgt) });
  }
}
// M47：视图内 data-goto 始终参与（capture graph 可能只爬到部分页；交付视图的导航才是用户能点到的图）
{
  const viewsDir = path.join(proto, "views");
  const dc = (fs.existsSync(path.join(proto, "index.html")) ? fs.readFileSync(path.join(proto, "index.html"), "utf8").match(/window\.DC = ([^\n]+?);<\/script>/) : null);
  const pages = dc ? (Function("return " + dc[1])()).pages : [];
  for (const p of pages) if (!nodes[p.id]) nodes[p.id] = { title: p.name || p.id, index: p.id.slice(0, 2) };
  if (fs.existsSync(viewsDir)) for (const f of fs.readdirSync(viewsDir).filter((x) => x.endsWith(".html"))) {
    const from = f.replace(/\.html$/, "");
    const html = fs.readFileSync(path.join(viewsDir, f), "utf8");
    for (const m of html.matchAll(/data-goto="([^"]+)"/g)) {
      const to = m[1];
      if (to.startsWith("placeholder:") || !nodes[to]) continue;
      const win = html.slice(Math.max(0, m.index - 600), m.index);
      const cls = [...win.matchAll(/class="([^"]+)"/g)].pop();
      const dcd = [...win.matchAll(/data-dc="([^"]+)"/g)].pop();
      const ctx = ((cls && cls[1]) || "") + " " + ((dcd && dcd[1]) || "");
      const actm = [...win.matchAll(/data-act="([^"]+)"/g)].pop();
      const act = actm ? actm[1] : "";
      const title = (win.match(/title="([^"]+)"/) || [])[1] || "";
      raw.push({ from, to, label: `tap · ${title || to}`, chrome: CHROME_RE.test(ctx), back: act === "back" || BACK_RE.test(title), modal: act === "sheet" || act === "dialog" || MODAL_RE.test(title) });
    }
  }
}
raw = raw.filter((e, i) => !raw.some((o, j) => j < i && o.from === e.from && o.to === e.to));

// hub 规则：目标被 ≥60% 节点链接 → module
const linkers = {};
raw.forEach((e) => { (linkers[e.to] = linkers[e.to] || new Set()).add(e.from); });
const N = Math.max(1, Object.keys(nodes).length);
raw.forEach((e) => { if ((linkers[e.to] || new Set()).size / N >= 0.6) e.chrome = true; });

// back-pair：A→B 且 B→A(back) ⇒ A→B 为 drill
const hasBack = (a, b) => raw.some((e) => e.from === b && e.to === a && e.back);
const edges = raw.map((e, i) => {
  let role = e.back ? "back" : e.chrome ? "module" : e.modal ? "modal" : "task";
  if (role === "task" && hasBack(e.from, e.to)) role = "drill";
  return { i, from: e.from, to: e.to, label: e.label, kind: role === "modal" ? "dialog" : "navigate", role };
});

// flows.json 优先（真实交互流）
let flows = null;
const flowsPath = path.join(run, "knowledge", "flows.json");
if (fs.existsSync(flowsPath)) { try { flows = JSON.parse(fs.readFileSync(flowsPath, "utf8")).flows || null; } catch {} }

const contentOf = (id) => edges.filter((e) => e.from === id && (e.role === "drill" || e.role === "task" || e.role === "modal"));
const navOf = (id) => edges.filter((e) => e.from === id && e.role === "module").map((e) => e.to);

const indeg = {};
edges.forEach((e) => { if (e.role !== "module" && e.role !== "back") indeg[e.to] = (indeg[e.to] || 0) + 1; });
let roots = Object.keys(nodes).filter((id) => !indeg[id]).sort();
if (!roots.length && N) roots = [Object.keys(nodes).sort()[0]];

function enumPaths(start) {
  const res = [];
  const walk = (cur, acc, visited) => {
    if (res.length >= MAXP || acc.length > MAXD) return;
    const nexts = contentOf(cur);
    if (!nexts.length || acc.length === MAXD) { if (acc.length) res.push(acc.map((e) => e.i)); return; }
    for (const n of nexts) {
      if (visited.has(n.to)) continue;
      acc.push(n); visited.add(n.to);
      walk(n.to, acc, visited);
      acc.pop(); visited.delete(n.to);
    }
    if (acc.length && nexts.every((n) => visited.has(n.to))) res.push(acc.map((e) => e.i));
  };
  walk(start, [], new Set([start]));
  return res.length ? res : [];
}
function buildTree(start) {
  const mk = (cur, depth, visited) => {
    const kids = [];
    if (depth >= MAXD) return { node: cur, children: kids };
    for (const n of contentOf(cur)) {
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
if (flows && flows.length) {
  // flows 为主：每个 flow 是一条真实路径；trie 按起点合并；source=flow
  roots = [...new Set(flows.map((f) => f.steps[0] && f.steps[0].node).filter(Boolean))].sort();
  const byStart = {};
  flows.forEach((f) => { (byStart[f.steps[0].node] = byStart[f.steps[0].node] || []).push(f); });
  for (const id of Object.keys(nodes)) {
    const fs0 = byStart[id] || [];
    const tree = { node: id, children: [] };
    const paths = []; const pathInfo = [];
    for (const f of fs0) {
      let cur = tree; const eAcc = [];
      for (let s = 1; s < f.steps.length; s++) {
        const a = f.steps[s - 1].node, b = f.steps[s].node;
        let e = edges.find((x) => x.from === a && x.to === b);
        if (!e) { e = { i: edges.length, from: a, to: b, label: f.steps[s].action || "tap", kind: "navigate", role: "drill", flow: f.id }; edges.push(e); }
        eAcc.push(e.i);
        let kid = cur.children.find((k) => k.child.node === b);
        if (!kid) { kid = { edge: e.i, child: { node: b, children: [] } }; cur.children.push(kid); }
        cur = kid.child;
      }
      paths.push(eAcc); pathInfo.push({ source: "flow", flow: f.id, name: f.name });
    }
    perNode[id] = { paths, pathInfo, tree, nav: navOf(id) };
  }
  for (const id of Object.keys(nodes)) if (!perNode[id]) perNode[id] = { paths: [], pathInfo: [], tree: buildTree(id), nav: navOf(id) };
} else {
  for (const id of Object.keys(nodes)) { const pp = enumPaths(id); perNode[id] = { paths: pp, pathInfo: pp.map(() => ({ source: "derived" })), tree: buildTree(id), nav: navOf(id) }; }
}

const result = { generated_at: new Date().toISOString(), version: 2, flowsUsed: !!(flows && flows.length), nodes, edges, roots, perNode };
fs.mkdirSync(proto, { recursive: true });
fs.writeFileSync(path.join(proto, "paths.json"), JSON.stringify(result, null, 2));
const roles = {};
edges.forEach((e) => (roles[e.role] = (roles[e.role] || 0) + 1));
console.log(`paths.json v2: ${N} 节点 ${edges.length} 边(${JSON.stringify(roles)}) ${roots.length} 根 flows=${result.flowsUsed} → ${path.relative(process.cwd(), proto)}/paths.json`);
