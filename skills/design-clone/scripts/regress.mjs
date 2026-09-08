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
let runs = fs.readdirSync(ROOT).filter((d) => !d.endsWith("-v1") && fs.existsSync(path.join(ROOT, d, "prototype/views")) && fs.readdirSync(path.join(ROOT, d, "prototype/views")).some((x) => x.endsWith(".html"))); // M46: -v1 为重修前冻结快照，不参与回归
if (get("--runs", null)) runs = get("--runs", "").split(",");
const rows = [];
let bad = 0;
for (let i = 0; i < runs.length; i++) {
  const r = runs[i];
  const port = portBase + i;
  const srv = spawn("node", [path.join(HERE, "serve.mjs"), path.join(ROOT, r), "--port", String(port)], { stdio: "ignore" });
  const base = `http://localhost:${port}`;
  // 就绪探测：固定 sleep 曾在慢机上让 inspect/interact 打到未监听端口 → 空输出被误判为全绿（M45 门禁完整性修复）
  let ready = false;
  for (let i = 0; i < 60 && !ready; i++) {
    try { const rr = await fetch(base + "/prototype/"); ready = rr.ok || rr.status === 404; } catch {}
    if (!ready) await new Promise((res) => setTimeout(res, 500));
  }
  const lastJson = (t) => { try { return JSON.parse(String(t || "").trim().split("\n").pop()); } catch { return null; } };
  // M46：子门被资源竞争 SIGKILL 时重试一次（瞬态问题不该判死刑），仍失败才记 BROKEN
  const runChild = (args, timeout) => {
    let o = spawnSync("node", args, { encoding: "utf8", timeout });
    if ((o.status !== 0 || !lastJson(o.stdout)) && !o.error) o = spawnSync("node", args, { encoding: "utf8", timeout });
    return o;
  };
  const ia = runChild([path.join(HERE, "qa/interact.mjs"), "--run", path.join(ROOT, r), "--base", base], 900000);
  const iaj = lastJson(ia.stdout) || {};
  const iaBroken = !ready || ia.status !== 0 || !iaj || !(iaj.views > 0);
  const ins = runChild([path.join(HERE, "qa/inspect.mjs"), base, r, "--run", path.join(ROOT, r), "--shots", path.join("/tmp", "regress-" + r)], 900000);
  const insj = lastJson(ins.stdout) || {};
  // inspect/ui-smoke 的 stdout 是**扁平** summary（{pass,fail,warnFail,…}），没有 .summary 包装；
  // 历史上 regress 读 insj.summary.* 恒 undefined → 全 run 假绿（LESSONS 132 的真正根因）
  const insBroken = !ready || ins.status !== 0 || typeof insj.fail !== "number" || typeof insj.pass !== "number";
  // 外壳冒烟全量门（含真实导出下载）：inspect 内只跑 --fast，这里补真实下载与标注入图
  const smk = runChild([path.join(HERE, "qa/ui-smoke.mjs"), "--run", path.join(ROOT, r), "--base", base, "--out", path.join(ROOT, r, "qa/ui-smoke.json")], 900000);
  const smkj = lastJson(smk.stdout) || {};
  const smkBroken = !ready || smk.status !== 0 || typeof smkj.pass !== "number";
  const smkFail = smkBroken ? 1 : (smkj.fail || 0);
  if (process.env.REGRESS_DEBUG) fs.writeFileSync("/tmp/regress-dbg.json", JSON.stringify({ r, iaStatus: ia.status, iaOut: (ia.stdout || "").length, insStatus: ins.status, insSignal: ins.signal, insOut: (ins.stdout || "").slice(-200), insErr: (ins.stderr || "").slice(-300), smkStatus: smk.status, smkSignal: smk.signal, smkOut: (smk.stdout || "").slice(-200), smkErr: (smk.stderr || "").slice(-300) }, null, 1));
  let fid = "";
  if (full) { const f = spawnSync("node", [path.join(HERE, "qa/fidelity-all.mjs"), "--run", path.join(ROOT, r), "--base", base], { encoding: "utf8" }); const fj = (() => { try { return JSON.parse((f.stdout || "").trim().split("\n").pop()); } catch { return {}; } })(); fid = (fj.hard || []).length ? `fid-hard=${fj.hard.length}` : "fid-ok"; }
  srv.kill();
  const dead = iaBroken ? -1 : (iaj.total_dead || 0);
  const fail = insBroken ? -1 : insj.fail;
  // 完整性：输出不可解析/进程异常/serve 未就绪 一律记为失败，绝不静默全绿
  const ok = ready && !iaBroken && !insBroken && !smkBroken && dead === 0 && fail === 0 && smkFail === 0 && !(iaj.bad || []).length;
  if (!ok) bad++;
  const brokenNote = !ready ? "serve-not-ready" : iaBroken ? "interact-broken" : insBroken ? "inspect-broken" : smkBroken ? "smoke-broken" : "";
  rows.push(`| ${r} | dead=${dead} | inspect ${fail < 0 ? "BROKEN" : fail ? "FAIL" + fail : "pass" + insj.pass} | smoke ${smkBroken ? "BROKEN" : smkFail ? "FAIL" + smkFail : "pass" + smkj.pass} | ${insj.warnFail || 0} warn | ${fid || "-"} | ${ok ? "✅" : "❌ " + brokenNote} |`);
  console.log(`${r}: ready=${ready} dead=${dead} inspectFail=${fail} smokeFail=${smkFail} warnFail=${insj.warnFail || 0} ${fid || ""} ${ok ? "OK" : "BAD " + brokenNote}`);
}
const ts = new Date().toISOString().replace(/[:.]/g, "-");
const md = `# 回归报告 ${ts}\n\n| run | interact | inspect | smoke | warn | fidelity | 结果 |\n|---|---|---|---|---|---|---|\n${rows.join("\n")}\n`;
fs.mkdirSync(path.join(HERE, "..", "..", "report"), { recursive: true });
fs.writeFileSync(path.join(HERE, "..", "..", "report", `regress-${ts}.md`), md);
console.log(bad ? `REGRESS BAD: ${bad} run(s)` : "REGRESS ALL GREEN");
process.exit(bad ? 3 : 0);
