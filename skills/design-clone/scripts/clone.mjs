#!/usr/bin/env node
/**
 * clone.mjs — 一条命令编排：应用抓取 → 结构化 → 可交互原型 → 门禁验收 → 起服务（M44）。
 *
 * 用法:
 *   node clone.mjs --target <名> --platform <web|android|ios|desktop> [--url <url>]
 *                  [--scope full|scene] [--out <runDir>] [--port 4200] [--serve]
 *                  [--skip-capture] [--gates-only] [--viewport mobile|desktop|WxH]
 *
 * 设计：确定性步骤（脚手架/抓取/去重/tokens/外壳/门禁/服务）由本脚本跑完；
 *       需要宿主 VLM 的步骤（逐页 s2c 誊写、平台检测裁决、语义 pass）打印精确交接命令，
 *       由宿主 agent 执行后再次运行本脚本（--gates-only）收口。web 目标可近乎全自动。
 *
 * 退出码: 0=完成/门禁通过 3=门禁 FIX 4=交互门 fail 5=环境缺失 6=需 agent 交接（已打印步骤）
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync, spawn } from "node:child_process";
import { parseArgs } from "node:util";
import http from "node:http";
import { buildInspector } from "./build-shell.mjs";
import { createHash } from "node:crypto";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const TPL = path.join(HERE, "..", "templates", "prototype");

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(fs.readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(2, 22).join("\n").replace(/^ \*\/?/gm, "").replace(/^ \* ?/gm, ""));
  process.exit(0);
}

const { values } = parseArgs({
  options: {
    target: { type: "string" }, platform: { type: "string" }, url: { type: "string" },
    scope: { type: "string", default: "full" }, out: { type: "string" },
    port: { type: "string", default: "4200" }, serve: { type: "boolean", default: false },
    "skip-capture": { type: "boolean", default: false }, "gates-only": { type: "boolean", default: false }, resume: { type: "boolean", default: false },
    viewport: { type: "string", default: "mobile" }, "max-pages": { type: "string", default: "25" },
    entry: { type: "string" }, sentence: { type: "string" }, images: { type: "string" },
  },
});

const log = (s) => console.log(s);
const step = (n, s) => log(`\n\x1b[36m[${n}]\x1b[0m ${s}`);
const ok = (s) => log(`  \x1b[32m✓\x1b[0m ${s}`);
const warn = (s) => log(`  \x1b[33m⚠\x1b[0m ${s}`);
const fail = (s) => log(`  \x1b[31m✗\x1b[0m ${s}`);
const run = (cmd, args, opts = {}) => spawnSync(cmd, args, { stdio: "inherit", encoding: "utf8", ...opts });

// M44h 统一入口：一句话/链接/图片/app名 → entry.mjs 意图路由
const entryText = values.entry || values.sentence || null;
if (entryText) {
  const r = spawnSync("node", [path.join(HERE, "entry.mjs"), entryText], { encoding: "utf8" });
  let e = {}; try { e = JSON.parse(r.stdout.trim()); } catch {}
  if (e.mode === "ask") { console.log("需要一点信息：" + (e.question || "目标是什么？")); process.exit(6); }
  if (e.mode === "link") { console.log("→ Link 模式：node link/intent.mjs \"" + entryText + "\" --out <run>/capture --run（六级梯取材）"); process.exit(6); }
  if (e.mode === "remix") { console.log("→ Remix 模式：见 SKILL §C（apply-patch --variant 保留原版）"); process.exit(6); }
  if (e.mode === "export") { console.log("→ Export 模式：node figma/export.mjs <run>（--validate 自检）"); process.exit(6); }
  values.target = values.target || e.target; values.platform = values.platform || e.platform || "web";
  values.url = values.url || e.url || null; values.scope = e.scope || values.scope;
  if (e.images && e.images.length) values.images = values.images || e.images.join(",");
  log("entry 路由: " + JSON.stringify({ mode: e.mode, target: values.target, platform: values.platform, source: e.source, scope: values.scope }));
}
if (!values.target) { console.log("用法见 --help（至少 --target 或 --entry \"一句话\"）"); process.exit(1); }
const platform = values.platform || "web";
const runDir = path.resolve(values.out || path.join(HERE, "..", "..", "..", "design-clone-runs", values.target));
const protoDir = path.join(runDir, "prototype");
const viewsDir = path.join(protoDir, "views");
// M44h run-state：中断可续（--resume 跳过已完成阶段）
const STATE = path.join(runDir, "knowledge", "run-state.json");
let state = { stages: {} }; try { state = JSON.parse(fs.readFileSync(STATE, "utf8")); } catch {}
const mark = (n, st, extra) => { state.stages[n] = { status: st, at: new Date().toISOString(), ...(extra || {}) }; fs.mkdirSync(path.dirname(STATE), { recursive: true }); fs.writeFileSync(STATE, JSON.stringify(state, null, 1)); };
const done = (n) => values.resume && state.stages[n] && state.stages[n].status === "ok";

/* ---------- [1] 环境自检 ---------- */
step(1, "环境自检 doctor.mjs");
const doc = run("node", [path.join(HERE, "doctor.mjs")]);
if (doc.status === 1) { warn("doctor 报告缺失项（见上）；web 抓取需 playwright chromium"); }

/* ---------- [1.5] 图片入口：用户给截图 → 作为 capture/screens ---------- */
if (values.images) {
  const scr = path.join(runDir, "capture", "screens");
  fs.mkdirSync(scr, { recursive: true });
  values.images.split(",").map((x) => x.trim()).filter(Boolean).forEach((f, i) => {
    const src = path.resolve(f);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(scr, String(i + 1).padStart(2, "0") + "-" + path.basename(f)));
  });
  log("images 入口: " + values.images.split(",").length + " 张截图 → capture/screens");
}
/* ---------- [1.6] GUI 采集同意收据（红线） ---------- */
function ensureConsent(platform) {
  const c = path.join(runDir, "knowledge", "consent.json");
  if (fs.existsSync(c)) return true;
  fail("GUI 采集需用户同意：请先询问用户并写入 knowledge/consent.json {granted:true,scope:\"gui-capture\",platform,at,by:\"user-verbal\"}");
  return false;
}

/* ---------- [2] 脚手架 ---------- */
step(2, `脚手架 run 目录：${runDir}`);
for (const d of ["capture/screens", "capture/ui-tree", "capture/frames", "capture/videos", "capture/assets",
  "knowledge", "knowledge/flows", "prototype/views", "prototype/assets", "qa", "report"]) {
  fs.mkdirSync(path.join(runDir, d), { recursive: true });
}
fs.writeFileSync(path.join(runDir, "knowledge/scope.json"), JSON.stringify({ scope: values.scope, platform, target: values.target, source: values.url ? "crawl" : "device", budget_screens: +values["max-pages"], stop_reason: null }, null, 1));
ok("目录就绪 + scope.json");

/* ---------- [3] 抓取 ---------- */
if (!values["skip-capture"] && !values["gates-only"] && !done("capture")) {
  step(3, `抓取（platform=${platform}）`);
  if (platform === "web" && values.url) {
    const r = run("node", [path.join(HERE, "web/capture.mjs"), "--url", values.url,
      "--out", path.join(runDir, "capture"), "--scope", values.scope,
      "--viewport", values.viewport, "--max-pages", values["max-pages"], "--wait", "2500"]);
    if (r.status === 0) ok("web 抓取完成（screens/ui-tree/graph/manifest）");
    else warn("web 抓取返回非 0（见上）；可加 --resume 续跑或 --seeds 补入口");
  } else if (platform === "android") {
    if (!ensureConsent(platform)) process.exit(6);
    warn("Android 抓取需宿主 agent 决策循环（截图→VLM 决策→动作），脚本无法替代。请执行：");
    log(`    bash ${path.join(HERE, "android/prepare.sh")}`);
    log(`    bash ${path.join(HERE, "android/record.sh")} ${runDir}/capture/videos   # 后台录屏`);
    log(`    adb shell monkey -p <包名> -c android.intent.category.LAUNCHER 1`);
    log(`    # 循环：bash android/capture.sh snap <screen-id> ${runDir}  （settle+shot+uiautomator dump，特征文本验页）`);
    log(`    # 每步按 references/action-protocol.md 决策动作；动作走 android/gesture.sh；等待走 android/settle.mjs`);
    log(`    # 收尾：node ${path.join(HERE, "dedup.mjs")} ${runDir}/capture`);
    log(`  完成后重跑：node clone.mjs --target ${values.target} --platform android --gates-only --out ${runDir}`);
    process.exit(6);
  } else {
    warn(`${platform} 抓取细则见 references/ios-desktop.md（simctl / desktop capture.sh，默认人接管点击或 CGEvent 闭环）`);
    log(`  完成后重跑：node clone.mjs --target ${values.target} --platform ${platform} --gates-only --out ${runDir}`);
    process.exit(6);
  }
  mark("capture", "ok");
}

/* ---------- [4] 去重 + [5] tokens ---------- */
if (!values["gates-only"]) {
  step(4, "感知哈希去重 dedup.mjs");
  if (fs.existsSync(path.join(runDir, "capture/screens")) && fs.readdirSync(path.join(runDir, "capture/screens")).length) {
    run("node", [path.join(HERE, "dedup.mjs"), path.join(runDir, "capture")]);
  } else warn("capture/screens 为空，跳过去重");
  step(5, "设计 tokens 提取 tokens.mjs");
  run("node", [path.join(HERE, "tokens.mjs"), path.join(runDir, "capture/screens"), "--out", path.join(runDir, "knowledge")]);
}

/* ---------- [6] 外壳 + 交互运行时 ---------- */
let views = fs.existsSync(viewsDir) ? fs.readdirSync(viewsDir).filter((f) => f.endsWith(".html")).map((f) => f.replace(".html", "")).sort() : [];
if (!values["gates-only"]) {
  step(6, "复制原型外壳 + 交互运行时（runtime.js）");
  for (const f of ["inspector.css", "runtime.js", "zipstore.js"]) {
    fs.copyFileSync(path.join(TPL, f), path.join(protoDir, f));
  }
  // inspector.js = ins/* 分段拼接产物（build-shell.mjs）
  fs.writeFileSync(path.join(protoDir, "inspector.js"), buildInspector());
  // M49：文件名哈希副本（与 sync-shell 同口径，真破启发式缓存）
  const bh0 = createHash("md5").update(
    buildInspector() + fs.readFileSync(path.join(TPL, "inspector.css"), "utf8") +
    fs.readFileSync(path.join(TPL, "runtime.js"), "utf8") +
    fs.readFileSync(path.join(TPL, "zipstore.js"), "utf8")).digest("hex").slice(0, 8);
  fs.writeFileSync(path.join(protoDir, "inspector." + bh0 + ".css"), fs.readFileSync(path.join(TPL, "inspector.css"), "utf8"));
  fs.writeFileSync(path.join(protoDir, "inspector." + bh0 + ".js"), buildInspector());
  fs.writeFileSync(path.join(protoDir, "runtime." + bh0 + ".js"), fs.readFileSync(path.join(TPL, "runtime.js"), "utf8"));
  fs.writeFileSync(path.join(protoDir, "zipstore." + bh0 + ".js"), fs.readFileSync(path.join(TPL, "zipstore.js"), "utf8"));
  // M45：utility 子集本地编译（替代 Tailwind CDN）
  run("node", [path.join(HERE, "gen/utility-css.mjs"), "--run", runDir, "--out", path.join(protoDir, "utilities.css")]);
  // 组件库 css 并入 index 的 __VIEW_CSS__
  let viewCss = "";
  const compDir = path.join(HERE, "..", "templates", "components");
  if (fs.existsSync(compDir)) for (const f of fs.readdirSync(compDir)) if (f.endsWith(".css")) viewCss += `\n/* ${f} */\n` + fs.readFileSync(path.join(compDir, f), "utf8");

  const shell = { web: "c_browser", android: "c_mobile", ios: "c_mobile", desktop: "c_desktop" }[platform] || "c_mobile";
  let names = {};
  try { names = JSON.parse(fs.readFileSync(path.join(runDir, "capture/graph.json"), "utf8")).nodes?.reduce((a, n) => (a[n.id] = n.title || n.id, a), {}) || {}; } catch {}
  const pages = views.map((id) => ({ id, name: names[id] || id, fidelity: "live-high" }));
  const dc = { pages, shell, platform: { platform } };
  let html = fs.readFileSync(path.join(TPL, "index.html"), "utf8");
  const buildHash = createHash("md5").update(
    buildInspector() + fs.readFileSync(path.join(TPL, "inspector.css"), "utf8") +
    fs.readFileSync(path.join(TPL, "runtime.js"), "utf8") +
    fs.readFileSync(path.join(TPL, "zipstore.js"), "utf8")).digest("hex").slice(0, 8);
  html = html.replaceAll("__TITLE__", values.target).replaceAll("__VIEW_CSS__", viewCss).replace("__DC_JSON__", JSON.stringify(dc)).replaceAll("__BUILD__", buildHash);
  fs.writeFileSync(path.join(protoDir, "index.html"), html);
  ok(`index.html（${views.length} 视图，shell=${platform}）+ runtime.js + inspector.*`);
} else {
  // gates-only：确保交互运行时存在（不重建已手工装配的 index.html）
  if (!fs.existsSync(path.join(protoDir, "runtime.js"))) fs.copyFileSync(path.join(TPL, "runtime.js"), path.join(protoDir, "runtime.js"));
  step(6, `gates-only：复用已装配原型（${views.length} 视图），仅补 runtime.js`);
}

/* ---------- [7] 生成（宿主 VLM 誊写）交接 ---------- */
if (!views.length && !values["gates-only"]) {
  step(7, "逐页保真誊写（宿主 agent 执行 — s2c 循环）");
  warn("原型视图需宿主 VLM 逐页誊写（脚本不内置模型）。对每个去重屏执行：");
  log(`    1) 读高清 capture：node ${path.join(HERE, "img/view.mjs")} ${runDir}/capture/screens/<id>.png --max 1400`);
  log(`    2) 按 references/s2c-prompt.md 逐元素誊写单文件 HTML → ${viewsDir}/<id>.html`);
  log(`       · 先逐 capture 盘点控件类型（开关/单选/多选/下拉/折叠/tab/输入/按钮…）`);
  log(`       · 每个控件接线：导航 data-goto="<目标视图>"；其余 data-act="toggle|radio|checkbox|select|accordion|tab|sheet|dialog|toast|step|slider|input|back"（见 templates/prototype/runtime.js）`);
  log(`       · 真素材：node ${path.join(HERE, "extract-assets.mjs")} ${runDir} <spec.json>；精确色 tokens-sample.mjs；质感图 genimg.mjs`);
  log(`       · 个人文本一律虚构（chrome 照准、昵称/ID/聊天文字虚构）`);
  log(`    3) 自渲染目检：node ${path.join(HERE, "qa/viewshot.mjs")} <base> <id> /tmp/<id>.png 并与源并排比对，不对就改，循环到像`);
  log(`  全部视图写完后收口：node clone.mjs --target ${values.target} --platform ${platform} --gates-only --out ${runDir} --serve`);
  process.exit(6);
}

/* ---------- [8] 起服务 + 门禁 ---------- */
step(8, "起本地服务并跑四门（interact / audit / inspect / eval）");
const port = +values.port;
const base = `http://localhost:${port}`;
const srv = spawn("node", [path.join(HERE, "serve.mjs"), runDir, "--port", String(port)], { stdio: "ignore", detached: true });
srv.unref();
// 等服务就绪
const waitUp = async () => {
  for (let i = 0; i < 40; i++) {
    const up = await new Promise((res) => { const rq = http.get(base + "/prototype/", (r) => { r.resume(); res(r.statusCode === 200); }); rq.on("error", () => res(false)); rq.setTimeout(1500, () => { rq.destroy(); res(false); }); });
    if (up) return true;
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
};
const up = await waitUp();
if (!up) { fail(`服务未就绪（${base}）；端口可能被占，serve 会自动 +1，请用实际端口重跑门禁`); process.exit(5); }
ok(`服务已起：${base}/prototype/`);

// M51：生成期即产出设计产物（每页 spec.json + figma-source.json）；导出按钮之后只做"编辑后重采集"
try {
  const { collectDesign } = await import("./gen/collect-design.mjs");
  const cd = await collectDesign(runDir, base);
  ok(`设计产物已生成：prototype/pages/*.spec.json ×${cd.pages} + prototype/design/figma-source.json`);
} catch (e) { log(`  ⚠ collect-design 失败（不阻断）：${String(e.message || e).slice(0, 120)}`); }

// M62-A：画廊就绪三件套（meta.json + icon.png + cover.png）生成期即产出
try {
  run("node", [path.join(HERE, "gen/gallery-meta.mjs"), "--run", runDir]);
  if (!fs.existsSync(path.join(runDir, "icon.png"))) run("node", [path.join(HERE, "gen/appicon.mjs"), "--run", runDir]);
  if (!fs.existsSync(path.join(runDir, "cover.png"))) run("node", [path.join(HERE, "gen/cover.mjs"), "--run", runDir, "--base", base]);
  ok("画廊就绪: meta.json + icon.png + cover.png");
} catch (e) { log(`  ⚠ 画廊三件套未完成（publish 时会补）：${String(e.message || e).slice(0, 120)}`); }

mark("shell", "ok");
let exitCode = 0;
const gate = (name, args) => { const r = run("node", args); return r.status; };
const sPriv = gate("privacy", [path.join(HERE, "qa/privacy.mjs"), "--run", runDir]);
if (sPriv === 4) { fail("隐私门 FAIL：真名/PII 泄露或真人脸未虚构（knowledge/privacy.json + qa/privacy.mjs）"); exitCode = 4; }
const sCrit = gate("critique", [path.join(HERE, "qa/critique.mjs"), "--run", runDir]);
if (sCrit === 4) { fail("结构 critique FAIL：full run 需 VLM 对照并排图给可疑视图打 layout 分（qa/critique.mjs --skeleton/--set）"); exitCode = 4; }
const sInteract = gate("interact", [path.join(HERE, "qa/interact.mjs"), "--run", runDir, "--base", base]);
if (sInteract === 4) { fail("交互门 FAIL：存在死控件/无响应（每个控件点击必须有可观测反应）"); exitCode = 4; }
const sAudit = gate("audit", [path.join(HERE, "qa/audit.mjs"), "--run", runDir, "--base", base]);
const sInspect = gate("inspect", [path.join(HERE, "qa/inspect.mjs"), base, values.target, "--run", runDir, "--shots", path.join("/tmp", "clone-" + values.target)]);
const sEval = gate("eval", [path.join(HERE, "eval/eval.mjs"), "--run", runDir, "--base", base]);
if (sEval === 3 && !exitCode) exitCode = 3;

/* ---------- [9] 收口 ---------- */
step(9, "结论");
let ev = {}; try { ev = JSON.parse(fs.readFileSync(path.join(runDir, "qa/eval.json"), "utf8")); } catch {}
let ia = {}; try { ia = JSON.parse(fs.readFileSync(path.join(runDir, "qa/interact.json"), "utf8")); } catch {}
const dead = Object.values(ia).reduce((s, v) => s + ((v.dead && v.dead.length) || 0), 0);
log(`  视图 ${views.length} | 死控件 ${dead} | eval ${ev.verdict || "?"} total=${ev.total ?? "?"} (perf=${ev.perf} ux=${ev.ux} stab=${ev.stab})`);
log(`  打开即用：${base}/prototype/  （普通视角点任意控件都有反应；按 2 看场景路径，按 D 演示）`);
mark("gates", exitCode === 0 ? "ok" : "fail", { exitCode });
if (!values.serve) { try { process.kill(-srv.pid); } catch { try { srv.kill(); } catch {} } log("  （未加 --serve，已关闭服务；重跑加 --serve 保持运行）"); }
else log("  服务保持运行中（--serve）。");
process.exit(exitCode);
