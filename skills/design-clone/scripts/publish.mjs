#!/usr/bin/env node
/**
 * publish.mjs —— 把本地 run 的标准原型发布到 community 仓（design-clone-prototype）并提 PR。
 * 用法:
 *   node publish.mjs --run <runDir> --app <app> --flavor <flavor> --title "<title>"
 *                    [--desc "..."] [--tags a,b] [--license CC-BY-4.0] [--version 1.0.0]
 *                    [--attest original|licensed|public-material] [--note "..."]
 *                    [--repo hello-cqq/design-clone-prototype] [--dry]
 * 前置（强验）：run 的 interact/inspect/ui-smoke 三门 summary 全绿 + knowledge/privacy.json 在场。
 * 产出：PR（分支 publish/<app>-<flavor>-<ts>），合并后 Pages 可玩 + 自动 Release 打 tag。
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    run: { type: "string" }, app: { type: "string" }, flavor: { type: "string" }, title: { type: "string" },
    desc: { type: "string", default: "" }, tags: { type: "string", default: "" }, license: { type: "string", default: "CC-BY-4.0" },
    version: { type: "string" }, attest: { type: "string" }, note: { type: "string", default: "" },
    repo: { type: "string", default: "hello-cqq/design-clone-prototype" }, dry: { type: "boolean", default: false },
  },
});
const die = (m) => { console.error("✗ " + m); process.exit(1); };
if (!values.run || !values.app || !values.flavor || !values.title) die("需 --run --app --flavor --title");
const FLAVOR_RE = /^(mobile|tablet|desktop|web)(-(android|ios|ipad|mac|win|linux))?(-(cn|global))?$/;
if (!FLAVOR_RE.test(values.flavor)) die("flavor 不在受控词表：" + values.flavor + "（见 proto 仓 SPEC.md §1）");
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

/* ---------- 2. 白名单复制 + 禁名单/PII/体积 ---------- */
const ALLOW_DIR = new Set(["views", "assets", "variants", "design", "pages", "appicon"]);
const ALLOW_FILE = /^(index\.html|inspector\.[a-z0-9.]+|runtime\.[a-z0-9.]+|zipstore\.[a-z0-9.]+|utilities\.css|paths\.json|journeys\.json|products\.json|annotations\.json|version\.json)$/;
const FORBID = [/(^|\/)node_modules\//, /(^|\/)export\//, /(^|\/)qa\//, /(^|\/)capture\//, /(^|\/)\.cache\//, /\.(mp4|webm|mov)$/i, /\.map$/i, /\.(ttf|otf|woff2?)$/i];
const PII = [/1[3-9]\d{9}/, /\b\d{6}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\b/];
const tmp = fs.mkdtempSync(path.join(process.env.TMPDIR || "/tmp", "dcp-pub-"));
const fdir = path.join(tmp, values.app, values.flavor);
const pdir = path.join(fdir, "prototype");
fs.mkdirSync(pdir, { recursive: true });
let bytes = 0;
const copyRec = (src, dst, rel) => {
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const r = rel + "/" + e.name;
    if (FORBID.some((x) => x.test(r))) continue;
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) { if (rel === "" && !ALLOW_DIR.has(e.name)) continue; fs.mkdirSync(d, { recursive: true }); copyRec(s, d, r); }
    else { if (rel === "" && !ALLOW_FILE.test(e.name)) continue; fs.copyFileSync(s, d); bytes += fs.statSync(d).size; }
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
const form = values.flavor.split("-")[0];
const SHELL_BY_FORM = { mobile: "c_mobile", tablet: "c_tablet", desktop: "c_desktop", web: "c_browser" };
if (dcShell !== SHELL_BY_FORM[form]) console.log(`⚠ run shell=${dcShell} 与 flavor 形态映射 ${SHELL_BY_FORM[form]} 不一致（CI 会以 meta.shell 校验，请确认 flavor 选择）`);
const attest = values.attest || (scope.source === "original" ? "original" : "public-material");
if (!["original", "licensed", "public-material"].includes(attest)) die("--attest 非法");
const skillVer = (() => { try { const m = fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), "..", "SKILL.md"), "utf8").match(/version:\s*"([^"]+)"/); return m ? m[1] : "dev"; } catch { return "dev"; } })();
const version = values.version || "1.0.0";
if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) die("--version 非 SemVer");
fs.writeFileSync(path.join(pdir, "version.json"), JSON.stringify({ app: values.app, flavor: values.flavor, version, published_at: new Date().toISOString(), skill_version: skillVer }, null, 1));
fs.writeFileSync(path.join(fdir, "meta.json"), JSON.stringify({
  shell: SHELL_BY_FORM[form], platform: scope.platform || form,
  source: { kind: scope.source || "original", ref: scope.target || values.app },
  license: values.license, ip_attestation: attest, attestation_note: values.note || "",
  version, created_at: new Date().toISOString(),
}, null, 1));
const brand = attest === "original" ? "" : `\n> Unofficial study replica generated with design-clone. All trademarks and brand assets belong to their respective owners; no affiliation or endorsement implied.\n`;
fs.writeFileSync(path.join(fdir, "PROVENANCE.md"), `# ${values.title} (${values.app}/${values.flavor})\n${brand}\n- source: ${scope.source || "original"} / ${scope.target || values.app}\n- skill version: ${skillVer}\n- gates: ${gates.join(" | ")}\n\n## Changes\n- v${version}: initial publish\n`);
const appMeta = { title: values.title, description: values.desc || `${values.title} — interactive prototype generated with design-clone`, tags: values.tags ? values.tags.split(",").map((x) => x.trim()) : [], category: scope.platform === "web" ? "web" : "app" };
if (attest !== "original") appMeta.brand_disclaimer = "Unofficial study replica; trademarks belong to their owners.";
fs.writeFileSync(path.join(tmp, values.app, "meta.json"), JSON.stringify(appMeta, null, 1));

/* ---------- 4. 提交 PR ---------- */
const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 16);
const branch = `publish/${values.app}-${values.flavor}-${ts}`;
if (values.dry) {
  const out = path.resolve("publish-out", `${values.app}-${values.flavor}`);
  fs.rmSync(out, { recursive: true, force: true });
  fs.cpSync(path.join(tmp, values.app), out, { recursive: true });
  console.log(`✓ dry-run 产出: ${out}（app meta + flavor meta/version/PROVENANCE + prototype 白名单，${Math.round(bytes / 1e6 * 10) / 10}MB）`);
  fs.rmSync(tmp, { recursive: true, force: true });
  process.exit(0);
}
const work = fs.mkdtempSync(path.join(process.env.TMPDIR || "/tmp", "dcp-work-"));
execSync(`git clone --depth 50 git@github.com:${values.repo}.git ${work}`, { stdio: "inherit" });
const appDir = path.join(work, values.app);
fs.mkdirSync(appDir, { recursive: true });
if (!fs.existsSync(path.join(appDir, "meta.json"))) fs.copyFileSync(path.join(tmp, values.app, "meta.json"), path.join(appDir, "meta.json"));
fs.cpSync(fdir, path.join(appDir, values.flavor), { recursive: true });
execSync(`git -C ${work} checkout -b ${branch} && git -C ${work} add -A && git -C ${work} commit -m "publish(${values.app}/${values.flavor}): ${values.title} v${version}"`, { stdio: "inherit" });
execSync(`git -C ${work} push -u origin ${branch}`, { stdio: "inherit" });
const body = `## What\n- app / flavor: ${values.app} / ${values.flavor}\n- source: ${scope.source || "original"} / ${scope.target || values.app}\n- gates: ${gates.join(" | ")}\n- preview (after merge): https://hello-cqq.github.io/design-clone-prototype/${values.app}/${values.flavor}/prototype/\n\n## IP attestation\n- [x] ${attest}${values.note ? " — " + values.note : ""}\n\n## Privacy\n- [x] no real personal data; sample text fictionalized\n\n## Spec\n- [x] SPEC.md followed (whitelist, ≤80MB, flavor vocabulary, version=${version})\n`;
execSync(`gh pr create --repo ${values.repo} --base main --head ${branch} --title "publish(${values.app}/${values.flavor}): ${values.title}" --body "${body.replace(/"/g, '\\"')}"`, { stdio: "inherit" });
fs.rmSync(tmp, { recursive: true, force: true });
fs.rmSync(work, { recursive: true, force: true });
console.log(`✓ PR 已创建：${values.repo} ${branch}`);
