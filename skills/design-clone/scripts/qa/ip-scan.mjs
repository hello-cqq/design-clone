#!/usr/bin/env node
/**
 * IP 扫描门（M45，docs/PROVENANCE.md §5）：保证仓库跟踪文件里永不混入第三方资产/产物。
 * 检查（git ls-files 为唯一事实源）：
 *  1. 跟踪的二进制媒体（png/jpg/webp/gif/woff/ttf/mp4/zip…）必须为 0 —— 本仓库不随附任何截图/logo/字体；
 *  2. design-clone-runs/ 与 dist/*.zip 不得被跟踪（捕获物与打包产物）；
 *  3. 第三方权利声明头（非本仓 MIT 声明者）列出供人工确认（warn）。
 * 用法: node ip-scan.mjs [--warn-as-fail]
 */
import { execSync } from "node:child_process";

const warnAsFail = process.argv.includes("--warn-as-fail");
const tracked = execSync("git ls-files", { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).trim().split("\n").filter(Boolean);
const untracked = execSync("git ls-files --others --exclude-standard", { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).trim().split("\n").filter(Boolean);
const files = [...new Set([...tracked, ...untracked])];
const BIN = /\.(png|jpe?g|webp|gif|bmp|ico|woff2?|ttf|otf|eot|mp4|webm|mov|avi|zip|tar|gz|7z|pdf)$/i;
const hard = [], warns = [];

for (const f of files) {
  if (BIN.test(f)) hard.push("binary-asset: " + f);
  if (f.startsWith("design-clone-runs/") || /^dist\/.*\.zip$/.test(f)) hard.push("artifact-tracked: " + f);
}

// 权利声明头：出现权利声明关键字但声明者不是本仓（关键字用拼接避免自匹配）
import fs from "node:fs";
for (const f of files) {
  if (/\.(md|json|ya?ml)$/.test(f)) continue;
  if (/(ip-scan|secret-scan)\.mjs$/.test(f)) continue; // 扫描器自身必然含关键字
  let txt = "";
  try { txt = fs.readFileSync(f, "utf8").slice(0, 4000); } catch { continue; }
  const KW1 = new RegExp("copy" + "right[^\\n]{0,120}", "i");
  const KW2 = new RegExp("@lic" + "ense[^\\n]{0,80}", "i");
  const m = txt.match(KW1) || txt.match(KW2);
  if (m && !/design-clone contributors/i.test(m[0])) warns.push("foreign-copyright?: " + f + " → " + m[0].slice(0, 80));
}

const out = { files: files.length, hard, warns, ok: hard.length === 0 && (!warnAsFail || warns.length === 0) };
console.log(JSON.stringify(out, null, 1));
process.exit(out.ok ? 0 : 4);
