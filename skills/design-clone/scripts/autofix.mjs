#!/usr/bin/env node
/**
 * autofix.mjs（M44h）：门禁 fail → 修复动作 的自检-自修闭环（≤3 轮）。
 * 映射：dead>0→wire.mjs；no-emoji→retrofit.mjs；appicon-present→appicon.mjs；
 *       layout-sanity/clip/empty/broken→sync-shell(库 css 传播)+提示手工；structural-critique/privacy/paths→提示手工(需 VLM/人)。
 * 每轮重跑 interact+inspect；全绿即停。剩余 manual 项打印 recovery.md 指引。
 * 用法: node autofix.mjs --run <runDir> [--base <url>] [--rounds 3]
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
const HERE = path.dirname(new URL(import.meta.url).pathname);
const A = process.argv.slice(2);
const get = (k, d) => (A.includes(k) ? A[A.indexOf(k) + 1] : d);
const run = path.resolve(get("--run", ""));
const base = get("--base", "");
const rounds = +get("--rounds", "3");
if (!run || !base) { console.log("用法: node autofix.mjs --run <runDir> --base <url>"); process.exit(run ? 0 : 1); }
const run1 = (f, args) => spawnSync("node", [path.join(HERE, f), ...args], { encoding: "utf8" });
const gates = () => {
  const ia = run1("qa/interact.mjs", ["--run", run, "--base", base]);
  let iaj = {}; try { iaj = JSON.parse((ia.stdout || "").trim().split("\n").pop()); } catch {}
  const ins = run1("qa/inspect.mjs", [base, path.basename(run), "--run", run, "--shots", path.join("/tmp", "autofix-" + path.basename(run))]);
  let insj = {}; try { insj = JSON.parse((ins.stdout || "").trim().split("\n").pop()); } catch {}
  return { iaj, insj };
};
for (let r = 1; r <= rounds; r++) {
  const { iaj, insj } = gates();
  const fails = Object.entries(insj.checks || {}).filter(([k, v]) => !v.pass && !v.warn).map(([k]) => k);
  const dead = iaj.total_dead || 0;
  if (!fails.length && !dead && !(iaj.bad || []).length) { console.log(`autofix: 全绿（第 ${r} 轮检查）`); process.exit(0); }
  console.log(`— 轮 ${r}: dead=${dead} fails=${fails.join(",") || "none"}`);
  if (dead || (iaj.bad || []).length) run1("gen/wire.mjs", [run]);
  if (fails.includes("no-emoji-ui")) run1("retrofit.mjs", [path.join(run, "prototype/views")]);
  if (fails.includes("appicon-present")) run1("gen/appicon.mjs", ["--run", run]);
  if (fails.some((f) => /layout-sanity|no-h-overflow/.test(f))) run1("sync-shell.mjs", [path.join(run, "prototype")]);
  const manual = fails.filter((f) => !/no-emoji-ui|appicon-present|layout-sanity|no-h-overflow/.test(f));
  if (manual.length) { console.log("  需人工/VLM: " + manual.join(",") + "（见 references/recovery.md）"); }
  if (!dead && !fails.some((f) => /no-emoji-ui|appicon-present|layout-sanity|no-h-overflow/.test(f))) break;
}
const { iaj, insj } = gates();
const ok = !(iaj.total_dead || 0) && !Object.entries(insj.checks || {}).some(([k, v]) => !v.pass && !v.warn);
console.log(ok ? "autofix: DONE 全绿" : "autofix: 仍有 fail（见上/recovery.md）");
process.exit(ok ? 0 : 3);
