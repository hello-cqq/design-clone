#!/usr/bin/env node
/**
 * critique.mjs — 结构 critique 门（M44d）。pixelmatch/recall 抓不到"缺整栏/错页/布局漂移"，
 * 由宿主 VLM 对照 capture|原型 并排图（qa/audit-<view>-side.jpg 或 viewshot）逐视图打 layout 分(1-5) 写入 qa/critique.json；
 * 本脚本做门禁：full run 必须存在且每视图 layout>=3（<3 须 fixed:true 并重修）。
 * 用法:
 *   node critique.mjs --run <runDir>                 # 门禁
 *   node critique.mjs --run <runDir> --skeleton      # 生成待填骨架（列出全部视图）
 *   node critique.mjs --run <runDir> --set <view> --layout <1-5> --notes "..." [--fixed]
 */
import fs from "node:fs";
import path from "node:path";
const A = process.argv.slice(2);
const get = (k, d) => (A.includes(k) ? A[A.indexOf(k) + 1] : d);
const run = path.resolve(get("--run", ""));
if (!run || A.includes("--help")) { console.log("用法: node critique.mjs --run <runDir> [--skeleton | --set <view> --layout N --notes ...]"); process.exit(run ? 0 : 1); }
const P = path.join(run, "qa/critique.json");
const viewsDir = path.join(run, "prototype/views");
const views = fs.existsSync(viewsDir) ? fs.readdirSync(viewsDir).filter((f) => f.endsWith(".html")).map((f) => f.replace(".html", "")) : [];

if (A.includes("--skeleton")) {
  const cur = fs.existsSync(P) ? JSON.parse(fs.readFileSync(P, "utf8")) : {};
  const obj = { views: cur.views || {} };
  for (const v of views) if (!obj.views[v]) obj.views[v] = { layout: 0, notes: "TODO: VLM 对照并排图打分", fixed: false };
  fs.mkdirSync(path.dirname(P), { recursive: true });
  fs.writeFileSync(P, JSON.stringify(obj, null, 1));
  console.log("skeleton:", views.length, "views ->", P);
  process.exit(0);
}
if (A.includes("--set")) {
  const v = get("--set"); const layout = parseInt(get("--layout", "0"), 10);
  const cur = fs.existsSync(P) ? JSON.parse(fs.readFileSync(P, "utf8")) : { views: {} };
  cur.views[v] = { layout, notes: get("--notes", ""), fixed: A.includes("--fixed"), at: new Date().toISOString() };
  fs.mkdirSync(path.dirname(P), { recursive: true });
  fs.writeFileSync(P, JSON.stringify(cur, null, 1));
  console.log("set", v, layout);
  process.exit(0);
}
// gate: 只对"客观信号可疑"的视图 + 核心样本强制 VLM layout 分（把 VLM 算力花在刀刃上）
let scope = "demo"; try { scope = (JSON.parse(fs.readFileSync(path.join(run, "knowledge/scope.json"), "utf8")).scope) || "demo"; } catch {}
if (!fs.existsSync(P)) { console.log(JSON.stringify({ ok: scope !== "full", missing: true, scope })); process.exit(scope === "full" ? 4 : 0); }
const j = JSON.parse(fs.readFileSync(P, "utf8"));
let fid = {}, aud = {};
try { fid = JSON.parse(fs.readFileSync(path.join(run, "report/fidelity.json"), "utf8")).checks || {}; } catch {}
try { aud = JSON.parse(fs.readFileSync(path.join(run, "qa/audit.json"), "utf8")); } catch {}
const required = new Set(views.slice(0, 3));
for (const v of views) {
  const f = fid[v], a = aud[v];
  if (f && f.ratio > 0.2) required.add(v);
  if (a && (a.recall != null && a.recall < 0.9)) required.add(v);
}
const bad = [];
for (const v of required) {
  const e = (j.views || {})[v];
  if (!e || !e.layout) bad.push(v + ":unscored");
  else if (e.layout < 3 && !e.fixed) bad.push(v + ":layout" + e.layout);
}
console.log(JSON.stringify({ ok: !bad.length, scope, required: [...required], bad: bad.slice(0, 8), scored: Object.keys(j.views || {}).length }));
process.exit(bad.length && scope === "full" ? 4 : 0);
