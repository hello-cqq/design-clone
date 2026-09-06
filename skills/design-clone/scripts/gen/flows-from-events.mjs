#!/usr/bin/env node
/**
 * flows-from-events.mjs（M44j）：把采集期的真实交互事件 capture/events.jsonl 归纳为 knowledge/flows.json（ground-truth 路径）。
 * events.jsonl 行: {"ts":...,"action":"tap|back|module-switch|sheet|input","from":"<view>","to":"<view>","note":"点的是什么"}
 * 分组规则：module-switch / launch 开新流；back 结束当前流（回溯）；其余追加步骤。
 * 用法: node flows-from-events.mjs <runDir>
 */
import fs from "node:fs";
import path from "node:path";
const run = path.resolve(process.argv[2] || ".");
const evP = path.join(run, "capture", "events.jsonl");
if (!fs.existsSync(evP)) { console.log("无 capture/events.jsonl（采集时按协议记录事件后再跑）"); process.exit(0); }
const lines = fs.readFileSync(evP, "utf8").split("\n").map((l) => l.trim()).filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
const flows = [];
let cur = null;
for (const e of lines) {
  if (!e.from) continue;
  if (!cur || e.action === "module-switch" || e.action === "launch") {
    if (cur && cur.steps.length > 1) flows.push(cur);
    cur = { id: "f" + (flows.length + 1), module: e.note || e.from, name: "", source: "recorded", steps: [{ node: e.from, action: "enter", note: e.note || "" }] };
  }
  if (e.action === "back") { if (cur && cur.steps.length > 1) cur.steps.pop(); continue; }
  if (e.to && (!cur.steps.length || cur.steps[cur.steps.length - 1].node !== e.to)) cur.steps.push({ node: e.to, action: e.action || "tap", note: e.note || "" });
}
if (cur && cur.steps.length > 1) flows.push(cur);
flows.forEach((f, i) => { f.id = "f" + (i + 1); f.name = f.steps.map((s) => s.node).join(" → "); });
fs.mkdirSync(path.join(run, "knowledge"), { recursive: true });
fs.writeFileSync(path.join(run, "knowledge", "flows.json"), JSON.stringify({ generated_at: new Date().toISOString(), source: "recorded-events", flows }, null, 1));
console.log(`flows.json: ${flows.length} 条真实流 ← events.jsonl (${lines.length} 事件)`);
