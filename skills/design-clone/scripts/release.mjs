#!/usr/bin/env node
/**
 * release.mjs —— 发布车（M54）：快照/正式 semver + 三处版本同步 + CHANGELOG 自动起草 + tag
 *
 * 用法:
 *   node scripts/release.mjs --snapshot [--dry] [--push]     # 快照版 v0.6.0-snapshot.YYYYMMDD[.N]（GitHub prerelease）
 *   node scripts/release.mjs --minor|--patch|--major [--dry] [--push]   # 手动正式车
 *
 * 纪律（AGENTS.md）：禁止手打 tag；版本真源=SKILL.md metadata.version，本脚本同步
 * package.json 与 CHANGELOG 头条；CI version-sync 门防漂移。
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const A = process.argv.slice(2);
const has = (f) => A.includes(f);
const dry = has("--dry");

const sh = (c) => execSync(c, { cwd: ROOT, encoding: "utf8" }).trim();
const skillPath = path.join(ROOT, "skills/design-clone/SKILL.md");
const pkgPath = path.join(ROOT, "package.json");
const changelogPath = path.join(ROOT, "CHANGELOG.md");

const skill = fs.readFileSync(skillPath, "utf8");
const cur = (skill.match(/version:\s*"([^"]+)"/) || [])[1];
if (!cur) { console.error("SKILL.md 缺 metadata.version"); process.exit(1); }

if (sh("git status --porcelain").length) { console.error("工作区不干净，先提交/暂存再发版"); process.exit(1); }

const tags = sh("git tag -l").split("\n").filter(Boolean);
const lastTag = tags.length ? sh("git describe --tags --abbrev=0") : null;

// ---- 目标版本 ----
const [maj, min, pat] = cur.split("-")[0].split(".").map(Number);
let next;
if (has("--snapshot")) {
  const base = cur.includes("-snapshot.") ? cur.split("-snapshot.")[0] : `${maj}.${min + 1}.0`;
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const same = tags.filter((t) => t.startsWith(`v${base}-snapshot.${d}`));
  next = same.length ? `${base}-snapshot.${d}.${same.length}` : `${base}-snapshot.${d}`;
} else if (has("--minor")) next = `${maj}.${min + 1}.0`;
else if (has("--patch")) next = `${maj}.${min}.${pat + 1}`;
else if (has("--major")) next = `${maj + 1}.0.0`;
else { console.error("需指定 --snapshot | --minor | --patch | --major"); process.exit(1); }
if (tags.includes("v" + next)) { console.error(`tag v${next} 已存在`); process.exit(1); }

// ---- CHANGELOG 起草（按 M 前缀分组）----
const range = lastTag ? `${lastTag}..HEAD` : "HEAD";
const log = sh(`git log --oneline ${range}`) || "";
const groups = new Map();
for (const line of log.split("\n").filter(Boolean)) {
  const m = line.match(/^[a-f0-9]+ (M(\d+)[^\s:：]*)?\s*(.*)$/);
  const key = m && m[1] ? m[1] : "Other";
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push((m && m[3]) || line);
}
const today = new Date().toISOString().slice(0, 10);
let section = `## [${next}] - ${today}\n\n`;
section += cur.includes("-snapshot.") || next.includes("-snapshot.")
  ? `Snapshot build（prerelease）。覆盖自上一 tag 的全部变更；正式版手动发车（--minor）。\n\n`
  : `Release train（手动发车）。\n\n`;
for (const [g, items] of groups) {
  section += `### ${g}\n`;
  for (const it of items.slice(0, 40)) section += `- ${it}\n`;
  section += "\n";
}

if (dry) {
  console.log(`[dry] 当前 ${cur} → ${next}\n`);
  console.log(section.slice(0, 1500));
  process.exit(0);
}

// ---- 落盘三处 ----
fs.writeFileSync(skillPath, skill.replace(/version:\s*"[^"]+"/, `version: "${next}"`));
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
pkg.version = next;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
const cl = fs.readFileSync(changelogPath, "utf8");
const anchor = cl.indexOf("## [");
fs.writeFileSync(changelogPath, cl.slice(0, anchor) + section + cl.slice(anchor));

sh(`git add -A && git commit -q -m "release: v${next}"`);
sh(`git tag -a "v${next}" -m "design-clone v${next}"`);
console.log(`已提交并打 tag: v${next}`);
if (has("--push")) {
  sh("git push origin HEAD");
  sh(`git push origin "v${next}"`);
  console.log("已 push（release.yml 将创建 GitHub Release + zip 资产）");
} else {
  console.log("未 push；确认后: node scripts/release.mjs 已无需重跑，直接 git push origin HEAD && git push origin v" + next);
}
