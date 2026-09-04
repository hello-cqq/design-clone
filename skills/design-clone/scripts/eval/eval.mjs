#!/usr/bin/env node
/**
 * M15 评测器：性能/体验/稳定性 三维评分 + issues 清单（驱动有界自修复循环）。
 * 用法:
 *   node eval.mjs --run <runDir> --base <serve-url> 双跑 inspect + 评分 + 写 <run>/qa/eval.json
 *   node eval.mjs --run <runDir>                    仅基于已有 qa/inspect.json 静态评分
 *   node eval.mjs --all                             聚合全部 run 的 eval.json → docs/EVAL-REPORT.md
 *   node eval.mjs --diff <runDir>                   与上一次 eval.json 对比（自修复循环用）
 * 评分见 references/eval-protocol.md。零容忍项（hard fail / consoleError / pageError）直接判不通过。
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { parseArgs } from "node:util";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const SCRIPTS = path.join(HERE, "..");

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(fs.readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(2, 10).join("\n").replace(/ \*\/?/g, "").replace(/^ \* ?/gm, ""));
  process.exit(0);
}

const { values } = parseArgs({
  options: {
    run: { type: "string" },
    base: { type: "string" },
    all: { type: "boolean", default: false },
    diff: { type: "boolean", default: false },
  },
});

const RUNS_ROOT = path.resolve(SCRIPTS, "../../../design-clone-runs");

function du(dir) {
  let n = 0;
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else n += fs.statSync(p).size;
    }
  };
  if (fs.existsSync(dir)) walk(dir);
  return n;
}

const ramp = (v, best, worst) => Math.max(0, Math.min(1, (worst - v) / (worst - best)));

function scoreRun(runDir, base, runInspect) {
  const qd = path.join(runDir, "qa");
  fs.mkdirSync(qd, { recursive: true });
  let inspectRuns = [];
  if (runInspect) {
    for (let i = 0; i < 2; i++) {
      const r = spawnSync("node", [path.join(SCRIPTS, "qa/inspect.mjs"), base, path.basename(runDir), "--shots", path.join("/tmp", "eval-" + path.basename(runDir) + "-" + i), "--run", runDir], { encoding: "utf8", timeout: 240000 });
      if (r.status !== 0 && r.status !== 2) throw new Error("inspect run failed: " + (r.stderr || r.stdout || "").slice(0, 300));
      const j = JSON.parse(fs.readFileSync(path.join(qd, "inspect.json"), "utf8"));
      inspectRuns.push(j);
    }
    fs.writeFileSync(path.join(qd, "inspect.json"), JSON.stringify(inspectRuns[1], null, 2));
  } else {
    const p = path.join(qd, "inspect.json");
    if (!fs.existsSync(p)) throw new Error("无 qa/inspect.json，先用 --port 跑一次");
    inspectRuns = [JSON.parse(fs.readFileSync(p, "utf8")), JSON.parse(fs.readFileSync(p, "utf8"))];
  }
  const [a, b] = inspectRuns;

  // ---- perf：goto networkidle 双次均值 + 产物体积 ----
  const gotoMs = async () => {
    const { chromium } = await import("playwright");
    const br = await chromium.launch();
    const pg = await br.newPage();
    const t0 = Date.now();
    await pg.goto(base + "/prototype/", { waitUntil: "networkidle", timeout: 30000 });
    const ms = Date.now() - t0;
    await br.close();
    return ms;
  };
  let goto1 = 0, goto2 = 0;
  const perf = { goto_ms: null, bytes_kb: Math.round(du(path.join(runDir, "prototype")) / 1024) };
  return (async () => {
    if (runInspect || base) {
      try { goto1 = await gotoMs(); goto2 = await gotoMs(); perf.goto_ms = Math.round((goto1 + goto2) / 2); } catch (e) { perf.goto_ms = null; perf.note = String(e.message).slice(0, 120); }
    }
    const perfScore = Math.round(100 * (0.6 * (perf.goto_ms == null ? 0.5 : ramp(perf.goto_ms, 1200, 5000)) + 0.4 * ramp(perf.bytes_kb, 600, 3000)));

    // ---- ux：硬检查通过率 - warn 惩罚 + 覆盖加成 ----
    const s = b.summary;
    const hard = (s.pass / Math.max(1, s.pass + s.fail)) * 100;
    let cov = 0;
    const has = (rel, test) => { const p = path.join(runDir, rel); if (!fs.existsSync(p)) return false; try { return test ? test(JSON.parse(fs.readFileSync(p, "utf8"))) : true; } catch { return false; } };
    const covBits = {
      paths: has("prototype/paths.json", (j) => (j.nodes || []).length >= 1 && (j.edges || []).length >= 1),
      annotations: has("prototype/annotations.json", (j) => Object.keys(j).length > 0),
      products: has("prototype/products.json", (j) => Object.keys(j).length > 0),
      journeys: has("prototype/journeys.json", (j) => (Array.isArray(j) ? j : Object.values(j)).length > 0),
    };
    cov = Object.values(covBits).filter(Boolean).length * 5;
    const uxScore = Math.max(0, Math.min(100, Math.round(hard - 5 * s.warnFail + cov - (s.warnFail ? 0 : 0))));

    // ---- stab：零错误 + 双跑幂等 ----
    const errs = (b.consoleErrors || []).length + (b.pageErrors || []).length;
    const keysA = JSON.stringify(Object.entries(a.checks).map(([k, v]) => [k, !!v.pass]));
    const keysB = JSON.stringify(Object.entries(b.checks).map(([k, v]) => [k, !!v.pass]));
    const idem = keysA === keysB;
    const stabScore = Math.max(0, 100 - 30 * errs - (idem ? 0 : 20));

    // ---- issues ----
    const issues = [];
    for (const [k, v] of Object.entries(b.checks)) if (!v.pass && !v.warn) issues.push({ dim: "ux", kind: "hard", check: k, note: v.note || "", fix: "#hard-checks" });
    for (const [k, v] of Object.entries(b.checks)) if (!v.pass && v.warn) issues.push({ dim: "ux", kind: "warn", check: k, note: v.note || "", fix: "#warn-playbook" });
    if ((b.consoleErrors || []).length) issues.push({ dim: "stab", kind: "hard", check: "consoleErrors", note: JSON.stringify(b.consoleErrors).slice(0, 200), fix: "#stab-zero-tolerance" });
    if ((b.pageErrors || []).length) issues.push({ dim: "stab", kind: "hard", check: "pageErrors", note: JSON.stringify(b.pageErrors).slice(0, 200), fix: "#stab-zero-tolerance" });
    if (!idem) issues.push({ dim: "stab", kind: "hard", check: "idempotence", note: "双跑 checks 不一致", fix: "#stab-zero-tolerance" });
    if (perf.goto_ms != null && perf.goto_ms > 3000) issues.push({ dim: "perf", kind: "warn", check: "goto_ms", note: String(perf.goto_ms), fix: "#perf-playbook" });
    if (perf.bytes_kb > 1500) issues.push({ dim: "perf", kind: "warn", check: "bytes_kb", note: String(perf.bytes_kb), fix: "#perf-playbook" });

    // ---- completeness（M16）：scope=full 时 views/ia_coverage 门槛 ----
    let scope = null, ia = null;
    try { scope = JSON.parse(fs.readFileSync(path.join(runDir, "knowledge/scope.json"), "utf8")); } catch {}
    try { ia = JSON.parse(fs.readFileSync(path.join(runDir, "knowledge/ia-plan.json"), "utf8")); } catch {}
    const viewsDir = path.join(runDir, "prototype/views");
    const views = fs.existsSync(viewsDir) ? fs.readdirSync(viewsDir).filter((f) => f.endsWith(".html")).length : 0;
    let iaCov = null, iaDetail = null;
    if (ia) {
      let g = { nodes: [] };
      try { g = JSON.parse(fs.readFileSync(path.join(runDir, "capture/graph.json"), "utf8")); } catch {}
      const titles = (g.nodes || []).map((x) => (x.title || "") + " " + (x.id || ""));
      const all = [...(ia.tabs || []), ...Object.values(ia.entries || {}).flat()];
      const hit = all.filter((t) => titles.some((x) => x.includes(t)));
      iaCov = all.length ? Math.round((hit.length / all.length) * 100) / 100 : null;
      iaDetail = { total: all.length, hit: hit.length, missing: all.filter((t) => !hit.includes(t)).slice(0, 12) };
    }
    const scopeMode = (scope && scope.scope) || "demo";
    let shellMode = "c_mobile";
    try { shellMode = JSON.parse(fs.readFileSync(path.join(runDir, "knowledge/platform.json"), "utf8")).shell || "c_mobile"; } catch {}
    const srcKind = (scope && scope.source) || (fs.existsSync(path.join(runDir, "capture/video.mp4")) ? "link-video" : "crawl");
    const viewFloor = srcKind === "link-video" ? 1 : (shellMode === "c_browser" ? 8 : 10);
    let liveRatio = null;
    try {
      const idx = fs.readFileSync(path.join(runDir, "prototype/index.html"), "utf8");
      const m = idx.match(/window\.DC\s*=\s*(\{.*?\});/s);
      if (m) { const pages = JSON.parse(m[1]).pages || []; liveRatio = pages.length ? Math.round(pages.filter((p) => p.fidelity !== "pixel").length / pages.length * 100) / 100 : null; }
    } catch {}
    if (scopeMode === "full") {
      if (views < viewFloor) issues.push({ dim: "ux", kind: "warn", check: "completeness-views", note: `views=${views}<${viewFloor}`, fix: "completeness-protocol#4" });
      if (liveRatio != null && liveRatio < 1) issues.push({ dim: "ux", kind: "warn", check: "live-ratio", note: `live_ratio=${liveRatio}<1（交付视图必须 live，M18）`, fix: "prototype-spec#fidelity" });
      let fid = null;
      try { fid = JSON.parse(fs.readFileSync(path.join(runDir, "report/fidelity.json"), "utf8")); } catch {}
      if (!fid) issues.push({ dim: "ux", kind: "warn", check: "fidelity-not-run", note: "缺 report/fidelity.json（M19 门：viewshot+fidelity 核心视图≥3）", fix: "eval-protocol#fidelity" });
      else for (const [k, v] of Object.entries(fid.checks || {})) {
        const hardF = shellMode === "c_browser" ? 0.30 : 0.40, warnF = shellMode === "c_browser" ? 0.15 : 0.20;
        if (v.waive) issues.push({ dim: "ux", kind: "warn", check: "fidelity-waived", note: `${k} ratio=${v.ratio} 豁免(${v.waive})`, fix: "eval-protocol#fidelity" });
        else if (v.ratio > hardF) issues.push({ dim: "ux", kind: "hard", check: "fidelity", note: `${k} ratio=${v.ratio}>${hardF}`, fix: "prototype-spec#资产阶梯" });
        else if (v.ratio > warnF) issues.push({ dim: "ux", kind: "warn", check: "fidelity", note: `${k} ratio=${v.ratio}>${warnF}`, fix: "prototype-spec#资产阶梯" });
      }
      if (iaCov != null && iaCov < 0.8) issues.push({ dim: "ux", kind: "warn", check: "completeness-ia", note: `ia_coverage=${iaCov}`, fix: "completeness-protocol#3" });
    }

    const total = Math.round(perfScore * 0.3 + uxScore * 0.4 + stabScore * 0.3);
    const verdict = s.fail === 0 && errs === 0 && idem && total >= 80 ? "PASS" : "FIX";
    const out = {
      run: path.basename(runDir), at: new Date().toISOString(),
      perf: perfScore, ux: uxScore, stab: stabScore, total,
      detail: { ...perf, hard_pass: s.pass, hard_fail: s.fail, warn_fail: s.warnFail, coverage: covBits, idempotent: idem, console_errors: (b.consoleErrors || []).length, page_errors: (b.pageErrors || []).length, scope: scopeMode, views, ia_coverage: iaCov, ia: iaDetail, live_ratio: liveRatio },
      issues, verdict,
    };
    const hist = path.join(qd, "eval-history.jsonl");
    fs.appendFileSync(hist, JSON.stringify(out) + "\n");
    fs.writeFileSync(path.join(qd, "eval.json"), JSON.stringify(out, null, 2));
    return out;
  })();
}

async function main() {
  if (values.all) {
    const rows = [];
    for (const e of fs.readdirSync(RUNS_ROOT)) {
      const p = path.join(RUNS_ROOT, e, "qa/eval.json");
      if (!fs.existsSync(p)) continue;
      const r = JSON.parse(fs.readFileSync(p, "utf8"));
      if (r.scores && r.perf == null) Object.assign(r, { perf: r.scores.perf, ux: r.scores.ux, stab: r.scores.stab, total: r.scores.total, verdict: r.verdict || (r.scores.total >= 80 ? "PASS" : "FIX"), issues: r.issues || [] });
      if (r.perf == null) continue;
      rows.push(r);
    }
    rows.sort((x, y) => y.total - x.total);
    const md = ["# EVAL-REPORT（M15+M23 评测汇总，含 parity 逐控件/交互覆盖）", "", "| run | perf | ux | stab | total | verdict | ctrl覆盖 | 交互覆盖 | issues |", "|---|---|---|---|---|---|---|---|---|"];
    for (const r of rows) {
      let ctrl = "—", inter = "—";
      try {
        const p = JSON.parse(fs.readFileSync(path.join(RUNS_ROOT, r.run, "qa/parity.json"), "utf8"));
        const vs = Object.values(p);
        const c = vs.filter((v) => v.control_coverage != null);
        ctrl = c.length ? (c.reduce((s, v) => s + v.control_coverage, 0) / c.length).toFixed(2) : "—";
        inter = vs.length ? (vs.reduce((s, v) => s + v.interaction_coverage, 0) / vs.length).toFixed(2) : "—";
      } catch {}
      md.push(`| ${r.run} | ${r.perf} | ${r.ux} | ${r.stab} | ${r.total} | ${r.verdict} | ${ctrl} | ${inter} | ${r.issues.length ? r.issues.map((i) => i.check).join(",") : "—" } |`);
    }
    md.push("", "生成时间：" + new Date().toISOString(), "");
    const docDir = path.resolve(SCRIPTS, "../../../docs");
    fs.mkdirSync(docDir, { recursive: true });
    fs.writeFileSync(path.join(docDir, "EVAL-REPORT.md"), md.join("\n"));
    console.log(md.join("\n"));
    return;
  }
  if (!values.run) { console.log("用法见 --help"); process.exit(1); }
  const runDir = path.resolve(values.run);
  const prev = path.join(runDir, "qa/eval.json");
  const before = fs.existsSync(prev) ? JSON.parse(fs.readFileSync(prev, "utf8")) : null;
  const base = (values.base || "").replace(/\/+$/, "").replace(/\/prototype$/, "");
  const out = await scoreRun(runDir, base || null, !!base);
  console.log(JSON.stringify({ run: out.run, perf: out.perf, ux: out.ux, stab: out.stab, total: out.total, verdict: out.verdict, issues: out.issues.map((i) => `${i.dim}/${i.kind}:${i.check}`) }));
  if (values.diff && before) {
    const d = { total: out.total - before.total, perf: out.perf - before.perf, ux: out.ux - before.ux, stab: out.stab - before.stab };
    console.log("diff vs prev:", JSON.stringify(d));
  }
  process.exit(out.verdict === "PASS" ? 0 : 3);
}
main().catch((e) => { console.error(e.message); process.exit(1); });
