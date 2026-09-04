#!/usr/bin/env node
/**
 * 逐控件/逐交互 parity 门（M22/M23，不敷衍评测）。
 * 用法: node parity.mjs --run <runDir> --base <url> [--views a,b,c]
 * 模式: android ui-tree XML 自动 / web ui-tree JSON 自动 / 无树→要求 qa/parity-log.md
 * 输出: <run>/qa/parity.json { view:{ctrl_src,ctrl_proto,control_coverage,inter_src,inter_match,interaction_coverage,mode} }
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) { console.log("用法: node parity.mjs --run <runDir> --base <url> [--views a,b]"); process.exit(0); }
const run = path.resolve(args[args.indexOf("--run") + 1]);
const base = (args[args.indexOf("--base") + 1] || "").replace(/\/+$/, "");
const viewsArg = args.includes("--views") ? args[args.indexOf("--views") + 1].split(",") : null;

const viewsDir = path.join(run, "prototype/views");
let views = viewsArg || fs.readdirSync(viewsDir).filter((f) => f.endsWith(".html")).map((f) => f.replace(".html", ""));

let graph = { nodes: [], edges: [] };
try { graph = JSON.parse(fs.readFileSync(path.join(run, "capture/graph.json"), "utf8")); } catch {}

function androidTree(id) {
  const p = path.join(run, "capture/ui-tree", id + ".xml");
  if (!fs.existsSync(p)) return null;
  const xml = fs.readFileSync(p, "utf8");
  const click = [...xml.matchAll(/clickable="true"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/g)].length;
  const click2 = [...xml.matchAll(/<node[^>]*clickable="true"/g)].length;
  return { mode: "android", ctrl: Math.max(click, click2) };
}
function webTree(id) {
  const p = path.join(run, "capture/ui-tree", id + ".json");
  if (!fs.existsSync(p)) return null;
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  const c = (j.elements || []).filter((e) => e.clickable).length;
  return { mode: "web", ctrl: c };
}

const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1280, height: 900 } });
const out = {};
for (const v of views) {
  const tree = androidTree(v) || webTree(v);
  await page.goto(base + "/prototype/#pages/" + v, { waitUntil: "networkidle" }).catch(() => {});
  await page.waitForTimeout(500);
  const proto = await page.evaluate(() => ({
    ctrl: document.querySelectorAll("#dc-stage a[href],#dc-stage a[data-goto],#dc-stage button,#dc-stage input,#dc-stage select,#dc-stage [role=button]").length,
    goto: [...document.querySelectorAll("#dc-stage [data-goto]")].map((e) => e.getAttribute("data-goto")),
  }));
  const edges = graph.edges.filter((e) => e.from === v);
  const matched = edges.filter((e) => proto.goto.includes(e.to)).length;
  const hasLog = fs.existsSync(path.join(run, "qa/parity-log.md"));
  out[v] = {
    mode: tree ? tree.mode : (hasLog ? "inventory" : "none"),
    ctrl_src: tree ? tree.ctrl : null,
    ctrl_proto: proto.ctrl,
    control_coverage: tree ? Math.min(1, proto.ctrl / Math.max(1, tree.ctrl)) : (hasLog ? 1 : null),
    inter_src: edges.length,
    inter_match: matched,
    interaction_coverage: edges.length ? matched / edges.length : 1,
  };
}
await b.close();
fs.writeFileSync(path.join(run, "qa/parity.json"), JSON.stringify(out, null, 1));
const bad = Object.entries(out).filter(([k, v]) => (v.control_coverage != null && v.control_coverage < 0.8) || v.interaction_coverage < 0.9 || v.mode === "none");
console.log(JSON.stringify({ views: Object.keys(out).length, bad: bad.map(([k]) => k) }));
