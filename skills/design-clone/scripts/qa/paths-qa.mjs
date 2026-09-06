#!/usr/bin/env node
/**
 * paths-qa.mjs（M44j）：场景/路径决策 sanity 门。
 * 检查：①无"纯 hub 链"场景（路径边不得全为 module）②无"巨型单链"（某根树覆盖>60%节点且深度>4 ⇒ 疑似把导航当路径）
 *      ③每个根至少 1 条 content 流或 nav>0（孤立节点 warn）④flows.json 的步骤边必须存在 ⑤back-pair 与 drill 一致。
 * 用法: node paths-qa.mjs <runDir>   （写 qa/paths-qa.json，exit 4=hard fail）
 */
import fs from "node:fs";
import path from "node:path";
const run = path.resolve(process.argv[2] || ".");
const P = path.join(run, "prototype", "paths.json");
const out = { ok: true, hard: [], warn: [] };
if (!fs.existsSync(P)) { out.warn.push("no-paths.json"); }
else {
  const j = JSON.parse(fs.readFileSync(P, "utf8"));
  const N = Object.keys(j.nodes || {}).length;
  const countTree = (t) => { if (!t) return 0; let c = 1, d = 0; const walk = (n, dep) => { d = Math.max(d, dep); n.children.forEach((k) => { c++; walk(k.child, dep + 1); }); }; walk(t, 0); return { c, d }; };
  for (const r of j.roots || []) {
    const pn = j.perNode[r] || {};
    const { c, d } = countTree(pn.tree) || { c: 0, d: 0 };
    if (N > 3 && c > Math.max(3, N * 0.6) && d > 4) out.hard.push(`giant-chain@${r}(覆盖${c}/${N}深${d}：导航被当路径)`);
    const contentPaths = (pn.paths || []).filter((p) => (Array.isArray(p) ? p : p.edges || []).some((ei) => { const e = j.edges[ei]; return e && e.role !== "module" && e.role !== "back"; }));
    if (!contentPaths.length && !((pn.nav || []).length)) out.warn.push(`isolated-root@${r}`);
    for (const p of pn.paths || []) {
      const roles = (Array.isArray(p) ? p : p.edges || []).map((ei) => (j.edges[ei] || {}).role);
      if (roles.length && roles.every((x) => x === "module")) out.hard.push(`hub-chain@${r}`);
    }
  }
  if (j.flowsUsed) {
    const flows = (() => { try { return JSON.parse(fs.readFileSync(path.join(run, "knowledge/flows.json"), "utf8")).flows || []; } catch { return []; } })();
    for (const f of flows) for (let i = 1; i < f.steps.length; i++) {
      const a = f.steps[i - 1].node, b = f.steps[i].node;
      if (!j.edges.some((e) => e.from === a && e.to === b)) out.warn.push(`flow-missing-edge@${f.id}:${a}->${b}`);
    }
  }
  for (const e of j.edges || []) if (e.role === "drill" && !j.edges.some((o) => o.from === e.to && o.to === e.from && o.role === "back")) out.warn.push(`drill-without-back@${e.from}->${e.to}`);
}
out.ok = !out.hard.length;
fs.mkdirSync(path.join(run, "qa"), { recursive: true });
fs.writeFileSync(path.join(run, "qa", "paths-qa.json"), JSON.stringify({ at: new Date().toISOString(), ...out }, null, 1));
console.log(JSON.stringify(out));
process.exit(out.hard.length ? 4 : 0);
