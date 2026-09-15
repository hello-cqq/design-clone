#!/usr/bin/env node
/**
 * publish.mjs —— 把本地 run 的标准原型发布到 community 仓（design-clone-prototype）并提 PR。
 * 用法:
 *   node publish.mjs --run <runDir> --app <app> --title "<title.en>" --title-zh "<title.zh>"
 *                    [--desc "..."] [--desc-zh "..."] [--tags a,b] [--license CC-BY-4.0] [--version 1.0.0]
 *                    [--attest original|licensed|public-material] [--note "..."]
 *                    [--repo hello-cqq/design-clone-prototype] [--dry]
 * 前置（强验）：run 的 interact/inspect/ui-smoke 三门 summary 全绿 + knowledge/privacy.json 在场。
 * 产出：PR（分支 publish/<app>-<flavor>-<ts>），合并后 Pages 可玩 + 自动 Release 打 tag。
 */
import fs from "node:fs";
import path from "node:path";
import { execSync, spawnSync } from "node:child_process";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    run: { type: "string" }, app: { type: "string" }, title: { type: "string" }, "title-zh": { type: "string", default: "" },
    desc: { type: "string", default: "" }, "desc-zh": { type: "string", default: "" }, tags: { type: "string", default: "" }, license: { type: "string", default: "CC-BY-4.0" },
    version: { type: "string" }, attest: { type: "string" }, note: { type: "string", default: "" }, retire: { type: "string", default: "" },
    repo: { type: "string", default: "hello-cqq/design-clone-prototype" }, dry: { type: "boolean", default: false },
  },
});
const die = (m) => { console.error("✗ " + m); process.exit(1); };
if (!values.run || !values.app) die("需 --run --app（v2 已去 flavor，变体=独立 app）");
if (!/^[a-z0-9][a-z0-9-]{1,39}$/.test(values.app)) die("app 名非法");

const run = path.resolve(values.run);
const protoSrc = path.join(run, "prototype");
if (!fs.existsSync(path.join(protoSrc, "index.html"))) die("run 缺 prototype/index.html");

/* ---------- 1. 门前置 ---------- */
const gates = [];
const readJ = (p) => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; } };
const ia = readJ(path.join(run, "qa/interact.json"));
const ins = readJ(path.join(run, "qa/inspect.json"));
const smk = readJ(path.join(run, "qa/ui-smoke.json"));
if (!ia || (ia.total_dead || 0) !== 0) die("交互门未绿（interact dead≠0 或未跑）");
if (!ins || (ins.fail || 0) !== 0) die("inspect 门未绿（fail≠0 或未跑）");
if (!smk || (smk.fail || 0) !== 0) die("ui-smoke 门未绿（fail≠0 或未跑）");
if (!fs.existsSync(path.join(run, "knowledge/privacy.json"))) die("缺 knowledge/privacy.json（隐私账本）");
gates.push(`interact dead=${ia.total_dead}`, `inspect fail=${ins.fail} pass=${ins.pass}`, `ui-smoke fail=${smk.fail} pass=${smk.pass}`);

/* ---------- 1.5 M84: 预构建导出包（静态托管"导出全部"离线 zip） ---------- */
if (!fs.existsSync(path.join(protoSrc, "export", "all.zip"))) {
  const r = spawnSync("node", [path.join(path.dirname(new URL(import.meta.url).pathname), "gen", "export-zip.mjs"), "--run", run, "--port", "4599"], { encoding: "utf8", timeout: 600000 });
  if (r.status === 0) console.log("✓ export/all.zip 预构建:", (r.stdout || "").trim().split("\n").pop());
  else console.log("· export/all.zip 跳过:", (r.stderr || r.stdout || "").slice(0, 120));
}
/* ---------- 2. 白名单复制 + 禁名单/PII/体积 ---------- */
const ALLOW_DIR = new Set(["views", "assets", "variants", "design", "pages", "appicon", "export"]);
const ALLOW_FILE = /^(index\.html|inspector\.[a-z0-9.]+|runtime\.[a-z0-9.]+|zipstore\.[a-z0-9.]+|utilities\.css|paths\.json|journeys\.json|products\.json|annotations\.json|version\.json)$/;
const FORBID = [/(^|\/)node_modules\//, /(^|\/)export\//, /(^|\/)qa\//, /(^|\/)capture\//, /(^|\/)\.cache\//, /\.(mp4|webm|mov)$/i, /\.map$/i, /\.(ttf|otf|woff2?)$/i, /(^|\/)assets\/_/, /_raw-/]; // M63: 生图中间件（带水印原图）禁入社区仓
const PII = [/1[3-9]\d{9}/, /\b\d{6}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\b/];
const tmp = fs.mkdtempSync(path.join(process.env.TMPDIR || "/tmp", "dcp-pub-"));
const fdir = path.join(tmp, values.app);
const pdir = path.join(fdir, "prototype");
fs.mkdirSync(pdir, { recursive: true });
let bytes = 0;
const copyRec = (src, dst, rel) => {
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const r = rel + "/" + e.name;
    if (FORBID.some((x) => x.test(r))) continue;
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) { if (rel === "" && !ALLOW_DIR.has(e.name)) continue; fs.mkdirSync(d, { recursive: true }); copyRec(s, d, r); }
    else { if (rel === "" && !ALLOW_FILE.test(e.name)) continue; if (r.startsWith("export" + path.sep) && e.name !== "all.zip") continue; fs.copyFileSync(s, d); bytes += fs.statSync(d).size; }
  }
};
copyRec(protoSrc, pdir, "");
if (bytes > 80 * 1024 * 1024) die(`剥离后仍 ${Math.round(bytes / 1e6)}MB > 80MB（SPEC §7）`);
for (const f of fs.readdirSync(path.join(pdir, "views"))) {
  const s = fs.readFileSync(path.join(pdir, "views", f), "utf8");
  for (const re of PII) if (re.test(s)) die(`视图 ${f} 含疑似 PII（电话/证件号），先匿名化再发布`);
}

/* ---------- 3. meta / version / PROVENANCE ---------- */
const dcShell = (() => { try { const m = fs.readFileSync(path.join(protoSrc, "index.html"), "utf8").match(/window\.DC = (\{[\s\S]*?\});/); return JSON.parse(m[1]).shell || "c_mobile"; } catch { return "c_mobile"; } })();
const scope = readJ(path.join(run, "knowledge/scope.json")) || {};
const SHELL_GUESS = { mobile: "c_mobile", android: "c_mobile", ios: "c_mobile", tablet: "c_tablet", desktop: "c_desktop", mac: "c_desktop", win: "c_desktop", web: "c_browser" };
const form = (scope.platform || "").split("-")[0];
if (dcShell !== (SHELL_GUESS[form] || dcShell)) console.log(`⚠ run shell=${dcShell} 与 platform 推断不一致，meta.shell 以 run 实际 shell 为准`);
// M62-A：gallery 三件套搬运+合并（run/meta.json 为基线，CLI 旗标覆盖；缺则现场补）
const runMeta = readJ(path.join(run, "meta.json"));
if (!values.title) values.title = (runMeta && runMeta.name && runMeta.name.en) || values.app;
if (!values["title-zh"] && runMeta && runMeta.name) values["title-zh"] = runMeta.name.zh || "";
if (!values.desc && runMeta && runMeta.description) values.desc = runMeta.description.en || "";
if (!values["desc-zh"] && runMeta && runMeta.description) values["desc-zh"] = runMeta.description.zh || "";
if (!values.tags && runMeta && runMeta.tags) values.tags = runMeta.tags.join(",");
if (!fs.existsSync(path.join(run, "icon.png"))) {
  const r = spawnSync("node", [path.join(path.dirname(new URL(import.meta.url).pathname), "gen/appicon.mjs"), "--run", run], { encoding: "utf8" });
  if (r.status !== 0) die("缺 icon.png 且自动补失败：" + String(r.stderr || "").slice(0, 120));
}
if (!fs.existsSync(path.join(run, "cover.png"))) die("缺 cover.png：先跑 node gen/cover.mjs --run <run> --base <url>（或 clone 收口自动产）");
// M62-B(G4)：design 产物强验（M51 链）
{
  const pages = (() => { try { return fs.readdirSync(path.join(protoSrc, "pages")).filter((x) => x.endsWith(".spec.json")); } catch { return []; } })();
  const fig = fs.existsSync(path.join(protoSrc, "design/figma-source.json"));
  if (!pages.length || !fig) die(`缺设计产物（pages/*.spec.json ×${pages.length}、design/figma-source.json=${fig}）：跑 node gen/collect-design.mjs --run <run> --base <url>`);
}
const attest = values.attest || (scope.source === "original" ? "original" : "public-material");
if (!["original", "licensed", "public-material"].includes(attest)) die("--attest 非法");
const skillVer = (() => { try { const m = fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), "..", "SKILL.md"), "utf8").match(/version:\s*"([^"]+)"/); return m ? m[1] : "dev"; } catch { return "dev"; } })();
const version = values.version || "1.0.0";
if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) die("--version 非 SemVer");
const skillChannel = skillVer.includes("snapshot") ? "snapshot" : "stable";
fs.writeFileSync(path.join(pdir, "version.json"), JSON.stringify({ app: values.app, version, published_at: new Date().toISOString(), skill_version: skillVer, skill_channel: skillChannel }, null, 1));
fs.copyFileSync(path.join(run, "icon.png"), path.join(fdir, "icon.png"));
// M76-W8c: 外壳 link ../knowledge/tokens.css → 社区仓也要带 knowledge/tokens.css（否则 Pages 404）
const tkSrc = path.join(run, "knowledge", "tokens.css");
if (fs.existsSync(tkSrc)) { fs.mkdirSync(path.join(fdir, "knowledge"), { recursive: true }); fs.copyFileSync(tkSrc, path.join(fdir, "knowledge", "tokens.css")); }
fs.copyFileSync(path.join(run, "cover.png"), path.join(fdir, "cover.png"));
const baseMeta = runMeta || {};
fs.writeFileSync(path.join(fdir, "meta.json"), JSON.stringify({
  ...baseMeta,
  name: { en: values.title || (baseMeta.name || {}).en || values.app, zh: values["title-zh"] || (baseMeta.name || {}).zh || values.title || values.app },
  description: { en: values.desc || (baseMeta.description || {}).en || values.title, zh: values["desc-zh"] || (baseMeta.description || {}).zh || values.desc || values.title },
  tags: values.tags ? values.tags.split(",").map((x) => x.trim()) : baseMeta.tags || [],
  shell: dcShell, platform: scope.platform || form,
  source: baseMeta.source || { kind: scope.source || "original", ref: scope.target || values.app },
  license: values.license || baseMeta.license || "CC-BY-4.0", ip_attestation: attest, attestation_note: values.note || baseMeta.attestation_note || "",
  version, created_at: new Date().toISOString(),
}, null, 1));
const brand = attest === "original" ? "" : `\n> Unofficial study replica generated with design-clone. All trademarks and brand assets belong to their respective owners; no affiliation or endorsement implied.\n`;
fs.writeFileSync(path.join(fdir, "PROVENANCE.md"), `# ${values.title} (${values.app}/${values.flavor})\n${brand}\n- source: ${scope.source || "original"} / ${scope.target || values.app}\n- retire: ${values.retire || "—"}\n- skill version: ${skillVer}\n- gates: ${gates.join(" | ")}\n\n## Changes\n- v${version}: initial publish\n`);
// v2：app 级 meta 即 flavor meta（平铺），不再写第二份 app meta

/* ---------- 4. 提交 PR ---------- */
const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 16);
const branch = `publish/${values.app}-${ts}`;
if (values.dry) {
  const out = path.resolve("publish-out", values.app);
  fs.rmSync(out, { recursive: true, force: true });
  fs.cpSync(path.join(tmp, values.app), out, { recursive: true });
  console.log(`✓ dry-run 产出: ${out}（meta/version/PROVENANCE + prototype 白名单，${Math.round(bytes / 1e6 * 10) / 10}MB）`);
  fs.rmSync(tmp, { recursive: true, force: true });
  process.exit(0);
}
const work = fs.mkdtempSync(path.join(process.env.TMPDIR || "/tmp", "dcp-work-"));
// M75: 缓存克隆复用——proto 仓体积大、全量 clone 慢且易超时；固定缓存目录 fetch --depth 1 增量更新
// M87: proto 仓统一纳管——优先同级 repo/design-clone-prototype（唯一管理副本），回退旧 prototype-repo/ 与 ~/.cache
const here = path.dirname(new URL(import.meta.url).pathname);
// M90: 空间布局=<space>/repo/{design-clone,design-clone-prototype}；管理副本=同级 proto 仓
const managed = fs.existsSync(path.resolve(here, "..", "..", "..", "..", "repo", "design-clone-prototype", ".git"))
  ? path.resolve(here, "..", "..", "..", "..", "repo", "design-clone-prototype")
  : path.resolve(here, "..", "..", "..", "repo", "design-clone-prototype");
const cache = fs.existsSync(path.join(managed, ".git")) ? managed : path.join(process.env.HOME || "/tmp", ".cache", "design-clone-publish", values.repo);
fs.mkdirSync(path.dirname(cache), { recursive: true });
if (fs.existsSync(path.join(cache, ".git"))) {
  execSync(`git -C "${cache}" fetch --depth 1 origin main`, { stdio: "inherit" });
  execSync(`git -C "${cache}" checkout -B main origin/main --force`, { stdio: "inherit" });
  execSync(`git -C "${cache}" clean -fdx -e .git`, { stdio: "inherit" });
  fs.rmSync(work, { recursive: true, force: true });
  fs.cpSync(cache, work, { recursive: true });
} else {
  execSync(`git clone --depth 1 git@github.com:${values.repo}.git ${cache}`, { stdio: "inherit" });
  fs.cpSync(cache, work, { recursive: true });
}
// M76-W2a: --retire a,b → 同 PR 下架旧 slug（目录删除，index 由 proto 仓 workflow 重扫）
for (const r of (values.retire || "").split(",").map((x) => x.trim()).filter(Boolean)) {
  if (r === values.app) die("retire 不能等于新 app");
  const rd = path.join(work, r);
  if (fs.existsSync(rd)) { fs.rmSync(rd, { recursive: true, force: true }); console.log("✓ retire:", r); } else console.log("· retire 跳过（不存在）:", r);
}
const appDir = path.join(work, values.app);
fs.mkdirSync(appDir, { recursive: true });
if (!fs.existsSync(path.join(appDir, "meta.json"))) fs.copyFileSync(path.join(tmp, values.app, "meta.json"), path.join(appDir, "meta.json"));
fs.cpSync(fdir, appDir, { recursive: true });
// M76-W2c: 提交作者固定映射到仓库 owner 的 noreply 身份（GitHub 归属=hello-cqq，头像正确）
const DC_AUTHOR = process.env.DC_AUTHOR || "cqq <37357551+hello-cqq@users.noreply.github.com>";
execSync(`git -C ${work} checkout -b ${branch} && git -C ${work} add -A && git -C ${work} commit --author="${DC_AUTHOR}" -m "publish(${values.app}): ${values.title} v${version}"`, { stdio: "inherit" });
execSync(`git -C ${work} push -u origin ${branch}`, { stdio: "inherit" });
const body = `## What\n- app: ${values.app}\n- source: ${scope.source || "original"} / ${scope.target || values.app}\n- gates: ${gates.join(" | ")}\n- preview (after merge): https://hello-cqq.github.io/design-clone-prototype/${values.app}/prototype/\n\n## IP attestation\n- [x] ${attest}${values.note ? " — " + values.note : ""}\n\n## Privacy\n- [x] no real personal data; sample text fictionalized\n\n## Spec\n- [x] SPEC v2 followed (flat app dir, bilingual meta, whitelist, ≤80MB, version=${version})\n`;
execSync(`gh pr create --repo ${values.repo} --base main --head ${branch} --title "publish(${values.app}): ${values.title}" --body "${body.replace(/"/g, '\\"')}"`, { stdio: "inherit" });
fs.rmSync(tmp, { recursive: true, force: true });
fs.rmSync(work, { recursive: true, force: true });
console.log(`✓ PR 已创建：${values.repo} ${branch}`);
