#!/usr/bin/env node
/**
 * flows-skeleton.mjs（M44j）：存量 run 无录制事件时，由结构推导产出**草稿**流 knowledge/flows-skeleton.json，
 * 供宿主 agent 对照 viewsheet/逐屏目视修正为真实交互流后另存为 knowledge/flows.json（paths-gen 优先消费）。
 * 用法: node flows-skeleton.mjs <runDir>
 */
import fs from "node:fs";
import path from "node:path";
const run = path.resolve(process.argv[2] || ".");
const P = path.join(run, "prototype", "paths.json");
if (!fs.existsSync(P)) { console.log("先跑 paths-gen.mjs"); process.exit(1); }
const j = JSON.parse(fs.readFileSync(P, "utf8"));
const flows = [];
for (const r of j.roots) {
  const pn = j.perNode[r] || {};
  (pn.paths || []).forEach((p, i) => {
    const steps = [{ node: r, action: "enter", note: "" }];
    for (const ei of p.edges) { const e = j.edges[ei]; if (!e) continue; steps.push({ node: e.to, action: e.role === "modal" ? "sheet" : "tap", note: e.label }); }
    if (steps.length > 1) flows.push({ id: `${r}-p${i + 1}`, module: j.nodes[r] ? j.nodes[r].title : r, name: steps.map((s) => s.node).join(" → "), source: "derived-draft", steps, _todo: "草稿：对照截图/真实 app 交互修正步骤与命名，确认后复制到 knowledge/flows.json" });
  });
}
fs.writeFileSync(path.join(run, "knowledge", "flows-skeleton.json"), JSON.stringify({ generated_at: new Date().toISOString(), flows }, null, 1));
console.log(`flows-skeleton.json: ${flows.length} 条草稿流（agent 修正后存为 flows.json）`);
