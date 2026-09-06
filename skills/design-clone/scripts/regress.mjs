#!/usr/bin/env node
/**
 * regress.mjs（M44h）：全 run 全门回归汇总（CI 可用）。
 * 每 run：interact + inspect(含 privacy/paths-sanity/appicon/layout-sanity/critique) [+ --full 时 fidelity-all]
 * 输出 report/regress-<ts>.md + 退出码（0 全绿 / 3 有 fail）。
 * 用法: node regress.mjs [--runs a,b] [--full] [--port-base 4500]
 */
import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
const HERE = path.dirname(new URL(import.meta.url).pathname);
const A = process.argv.slice(2);
const get = (k, d) => (A.includes(k) ? A[A.indexOf(k) + 1] : d);
const ROOT = path.resolve(HERE, "..", "..", "..", "design-clone-runs");
const full = A.includes("--full");
const portBase = +get("--port-base", "4500");
let runs = fs.readdirSync(ROOT).filter((d) => fs.existsSync(path.join(ROOT, d, "prototype/views")) && fs.readdirSync(path.join(ROOT, d, "prototype/views")).some((x) => x.endsWith(".html")));
if (get("--runs", null)) runs = get("--runs", "").split(",");
const rows = [];
let bad = 0;
for (let i = 0; i < runs.length; i++) {
  const r = runs[i];
  const port = portBase + i;
  const srv = spawn("node", [path.join(HERE, "serve.mjs"), path.join(ROOT, r), "--port", String(port)], { stdio: "ignore" });
  await new Promise((res) => setTimeout(res, 1400));
  const base = `http://localhost:${port}`;
  const ia = spawnSync("node", [path.join(HERE, "qa/interact.mjs"), "--run", path.join(ROOT, r), "--base", base], { encoding: "utf8" });
  let iaj = {}; try { iaj = JSON.parse((ia.stdout || "").trim().split("\n").pop()); } catch {}
  const ins = spawnSync("node", [path.join(HERE, "qa/inspect.mjs"), base, r, "--run", path.join(ROOT, r), "--shots", path.join("/tmp", "regress-" + r)], { encoding: "utf8" });
  let insj = {}; try { insj = JSON.parse((ins.stdout || "").trim().split("\n").pop()); } catch {}
  let fid = "";
  if (full) { const f = spawnSync("node", [path.join(HERE, "qa/fidelity-all.mjs"), "--run", path.join(ROOT, r), "--base", base], { encoding: "utf8" }); const fj = (() => { try { return JSON.parse((f.stdout || "").trim().split("\n").pop()); } catch { return {}; } })(); fid = (fj.hard || []).length ? `fid-hard=${fj.hard.length}` : "fid-ok"; }
  srv.kill();
  const dead = iaj.total_dead || 0;
  const fail = (insj.summary || {}).fail || 0;
  const ok = dead === 0 && fail === 0 && !(iaj.bad || []).length;
  if (!ok) bad++;
  rows.push(`| ${r} | dead=${dead} | inspect ${fail ? "FAIL" + fail : "pass" + ((insj.summary || {}).pass || 0)} | ${(insj.summary || {}).warnFail || 0} warn | ${fid || "-"} | ${ok ? "✅" : "❌"} |`);
  console.log(`${r}: dead=${dead} inspectFail=${fail} warnFail=${(insj.summary || {}).warnFail || 0} ${fid || ""} ${ok ? "OK" : "BAD"}`);
}
const ts = new Date().toISOString().replace(/[:.]/g, "-");
const md = `# 回归报告 ${ts}\n\n| run | interact | inspect | warn | fidelity | 结果 |\n|---|---|---|---|---|---|\n${rows.join("\n")}\n`;
fs.mkdirSync(path.join(HERE, "..", "..", "report"), { recursive: true });
fs.writeFileSync(path.join(HERE, "..", "..", "report", `regress-${ts}.md`), md);
console.log(bad ? `REGRESS BAD: ${bad} run(s)` : "REGRESS ALL GREEN");
process.exit(bad ? 3 : 0);
