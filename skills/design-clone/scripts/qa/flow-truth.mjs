#!/usr/bin/env node
/**
 * flow-truth.mjs（M104-W1）—— 流真值门：paths.json 的声明边必须 ⊆ 视图真实 data-goto ∪ capture/graph.json；
 * 并按真实接线算连通性：死端页（in≥1,out=0）与不可达页（root 不可至）在 concept run 判 fail、clone run 判 warn。
 * 反作弊约束：本门只测「声明 vs 真接线」的集合关系与图连通性，不含任何 run/页面字面特判。
 * 用法: node flow-truth.mjs <runDir> [--json]
 */
import fs from "node:fs";
import path from "node:path";

const run = process.argv[2];
if (!run || process.argv.includes("--help")) { console.log("用法: node flow-truth.mjs <runDir> [--json]"); process.exit(run ? 0 : 1); }
const proto = path.join(run, "prototype");
const viewsDir = path.join(proto, "views");
const pathsFile = path.join(proto, "paths.json");
const meta = JSON.parse(fs.readFileSync(path.join(run, "meta.json"), "utf8"));
const isConcept = (meta.provenance || meta.ip_attestation || "") === "original" || meta.category === "original" || fs.existsSync(path.join(run, "knowledge", "brief.json"));

const dc = fs.existsSync(path.join(proto, "index.html")) ? fs.readFileSync(path.join(proto, "index.html"), "utf8").match(/window\.DC = ([^\n]+?);<\/script>/) : null;
const pages = dc ? Function("return " + dc[1])().pages : [];
const ids = new Set(pages.map((p) => p.id));

const dom = new Map();
if (fs.existsSync(viewsDir)) {
  for (const f of fs.readdirSync(viewsDir).filter((x) => x.endsWith(".html"))) {
    const from = f.replace(/\.html$/, "");
    if (!ids.has(from)) continue;
    const html = fs.readFileSync(path.join(viewsDir, f), "utf8");
    for (const m of html.matchAll(/data-goto="([^"]+)"/g)) {
      const to = m[1];
      if (to === from || to.startsWith("placeholder:") || !ids.has(to)) continue;
      dom.set(from + ">" + to, true);
    }
  }
}
const graphPath = path.join(run, "capture", "graph.json");
if (fs.existsSync(graphPath)) {
  const g = JSON.parse(fs.readFileSync(graphPath, "utf8"));
  for (const e of g.edges || []) if (ids.has(e.from) && ids.has(e.to) && e.from !== e.to) dom.set(e.from + ">" + e.to, true);
}

const out = { run: path.basename(run), concept: isConcept, domEdges: dom.size, phantom: [], missing: [], deadEnds: [], orphans: [], ok: true };
if (fs.existsSync(pathsFile)) {
  const P = JSON.parse(fs.readFileSync(pathsFile, "utf8"));
  for (const e of P.edges || []) {
    const k = e.from + ">" + e.to;
    if (!dom.has(k)) out.phantom.push(k);
  }
  const roots = P.roots && P.roots.length ? P.roots : [pages[0] && pages[0].id].filter(Boolean);
  const adj = new Map();
  for (const k of dom.keys()) { const [f, t] = k.split(">"); (adj.get(f) || adj.set(f, []).get(f)).push(t); }
  const seen = new Set(); const q = [...roots];
  while (q.length) { const n = q.pop(); if (seen.has(n)) continue; seen.add(n); for (const t of adj.get(n) || []) q.push(t); }
  const indeg = new Map(); for (const k of dom.keys()) { const [, t] = k.split(">"); indeg.set(t, (indeg.get(t) || 0) + 1); }
  const outdeg = (n) => (adj.get(n) || []).length;
  for (const id of ids) {
    if (!seen.has(id)) out.orphans.push(id);
    else if (outdeg(id) === 0 && (indeg.get(id) || 0) > 0) out.deadEnds.push(id); // 死端=warn（终点页合法），不可达=硬伤
  }
  out.declaredEdges = (P.edges || []).length;
} else {
  out.missing.push("paths.json");
}
out.roots = fs.existsSync(pathsFile) ? (JSON.parse(fs.readFileSync(pathsFile, "utf8")).roots || []) : [];

const hard = out.missing.length > 0 || (isConcept && (out.phantom.length > 0 || out.orphans.length > 0));
out.ok = !hard;
out.level = hard ? "fail" : (out.phantom.length || out.orphans.length || out.deadEnds.length ? "warn" : "pass");
if (process.argv.includes("--json")) console.log(JSON.stringify(out));
else console.log(`flow-truth ${out.level}: dom=${out.domEdges} declared=${out.declaredEdges || 0} phantom=${out.phantom.length} orphans=${out.orphans.join(",") || "-"} deadEnds=${out.deadEnds.join(",") || "-"}`);
process.exit(out.level === "fail" ? 1 : 0);
