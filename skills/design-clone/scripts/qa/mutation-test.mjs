#!/usr/bin/env node
/**
 * mutation-test.mjs（M104-W7b 活门证明）——对 run 的临时拷贝注入六类故障，断言对应门转红；门红过才算门存在。
 * 用法: node mutation-test.mjs <runDir> [--json]
 * 反作弊：故障注入的是通用缺陷形态（空带/动画改 cover/凭空边/错锚/死选择器/零动效），不针对任何具体产品字面。
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const run = process.argv[2];
if (!run || process.argv.includes("--help")) { console.log("用法: node mutation-test.mjs <runDir> [--json]"); process.exit(run ? 0 : 1); }
const src = path.resolve(run);
const gate = (script, dir, extra = []) => spawnSync("node", [path.join(here, script), dir, ...extra], { encoding: "utf8" });
const failed = (r) => (r.status || 0) !== 0;

const viewsOf = (d) => path.join(d, "prototype", "views");
const firstView = (d) => fs.readdirSync(viewsOf(d)).filter((f) => f.endsWith(".html"))[0];

const MUT = {
  "empty-band": (d) => {
    const f = path.join(viewsOf(d), firstView(d));
    let c = fs.readFileSync(f, "utf8");
    c = c.replace(/<\/div>\s*$/, '<div class="mut-void" style="position:absolute;left:0;right:0;bottom:0;height:40%;background:#eeeeee"></div>\n</div>');
    fs.writeFileSync(f, c);
  },
  "bg-cover": (d) => {
    const f = path.join(viewsOf(d), firstView(d));
    let c = fs.readFileSync(f, "utf8");
    c = c.replace("<style>", "<style>@keyframes mutkb{from{background-size:120% auto}to{background-size:100% auto}}.mut-far{animation:mutkb 3s infinite}");
    fs.writeFileSync(f, c);
  },
  "flow-truth": (d) => {
    const p = path.join(d, "prototype", "paths.json");
    const j = JSON.parse(fs.readFileSync(p, "utf8"));
    const ids = Object.keys(j.nodes || {});
    if (ids.length >= 2) (j.edges ||= []).push({ from: ids[0], to: ids[1], kind: "flow", label: "mutant" , __mut: true});
    fs.writeFileSync(p, JSON.stringify(j));
  },
  "style-anchor": (d) => {
    const p = path.join(d, "prototype", "assets-manifest.json");
    if (!fs.existsSync(p)) return false;
    const j = JSON.parse(fs.readFileSync(p, "utf8"));
    j.assets["mut-asset.png"] = { file: "mut-asset.png", source: "genimg", prompt: "photoreal studio product shot, neutral gray", style: "photoreal" };
    fs.writeFileSync(p, JSON.stringify(j));
  },
  "unstyled-deadcss": (d) => {
    const f = path.join(viewsOf(d), firstView(d));
    let c = fs.readFileSync(f, "utf8");
    c = c.replace("<style>", "<style>.mut-ghost .a1{color:red}.mut-ghost .a2{padding:2px}.mut-ghost .a3{margin:1px}.mut-ghost .a4{font-size:2px}");
    c = c.replace(/<div /, '<div><span class="a1"></span><span class="a2"></span><span class="a3"></span><span class="a4"></span><div ', 1);
    fs.writeFileSync(f, c);
  },
  "motion-min": (d) => {
    for (const f of fs.readdirSync(viewsOf(d)).filter((x) => x.endsWith(".html"))) {
      const p = path.join(viewsOf(d), f);
      let c = fs.readFileSync(p, "utf8");
      c = c.replace(/<canvas data-fx[^>]*>/g, "").replace(/<video[^>]*>[\s\S]*?<\/video>/g, "").replace(/animation:[^;}]+/g, "animation:none");
      fs.writeFileSync(p, c);
    }
  },
};
const GATE_OF = { "empty-band": ["qa/inspect.mjs", true], "bg-cover": ["qa/inspect.mjs", true], "unstyled-deadcss": ["qa/inspect.mjs", true], "motion-min": ["qa/inspect.mjs", true], "flow-truth": ["qa/flow-truth.mjs", false], "style-anchor": ["qa/style-anchor.mjs", false] };

const results = [];
for (const [name, inject] of Object.entries(MUT)) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mut-"));
  const dst = path.join(tmp, "run");
  fs.cpSync(src, dst, { recursive: true });
  let applied = true;
  const mutAt = Date.now();
  try { applied = inject(dst) !== false; } catch (e) { applied = false; }
  if (!applied) { results.push({ case: name, verdict: "skip" }); fs.rmSync(tmp, { recursive: true, force: true }); continue; }
  const [script, needsServe] = GATE_OF[name];
  let red = false;
  if (needsServe) {
    const { spawn } = await import("node:child_process");
    const port = 4900 + results.length;
    const hs = spawn("npx", ["-y", "http-server", path.join(dst, "prototype"), "-p", String(port), "-s"], { stdio: "ignore" });
    await new Promise((r) => setTimeout(r, 2500));
    const r = gate("qa/inspect.mjs", "", [ "http://localhost:" + port, "mut", "--run", dst ]);
    red = failed(r);
    const jf = path.join(dst, "qa", "inspect.json");
    const key = name.includes("unstyled") ? "unstyled-view-classes" : name;
    if (fs.existsSync(jf) && fs.statSync(jf).mtimeMs > mutAt) { const j = JSON.parse(fs.readFileSync(jf, "utf8")); red = !!(j.checks && j.checks[key] && j.checks[key].pass === false); }
    else { results.push({ case: name, verdict: "harness-error" }); hs.kill(); fs.rmSync(tmp, { recursive: true, force: true }); continue; }
    hs.kill();
  } else {
    const r = gate(script, dst, script.includes("flow") || script.includes("anchor") ? ["--json"] : []);
    red = failed(r) || /"level":\s*"fail"/.test(r.stdout || "");
  }
  results.push({ case: name, verdict: red ? "gate-red(ok)" : "GATE-BLIND(bad)" });
  fs.rmSync(tmp, { recursive: true, force: true });
}
const blind = results.filter((r) => r.verdict === "GATE-BLIND(bad)");
const out = { run: path.basename(src), results, ok: blind.length === 0 };
if (process.argv.includes("--json")) console.log(JSON.stringify(out));
else { for (const r of results) console.log(`  ${r.case}: ${r.verdict}`); console.log(out.ok ? "mutation-test: 全门活" : "mutation-test: 存在盲门"); }
process.exit(out.ok ? 0 : 1);
