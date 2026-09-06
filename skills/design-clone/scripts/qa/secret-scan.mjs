#!/usr/bin/env node
/**
 * 密钥/PII 扫描门（M45）：跟踪的**代码与数据**文件里不允许出现凭据或真实个人信息。
 * 散文（*.md）豁免手机号/身份证/邮箱（文档会讨论这些模式本身），但凭据类全文件扫描。
 * 用法: node secret-scan.mjs
 */
import { execSync } from "node:child_process";
import fs from "node:fs";

const tracked = execSync("git ls-files", { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).trim().split("\n").filter(Boolean);
const untracked = execSync("git ls-files --others --exclude-standard", { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).trim().split("\n").filter(Boolean);
const files = [...new Set([...tracked, ...untracked])];
const CRED = [
  ["aws-key", /AKIA[0-9A-Z]{16}/],
  ["private-key", /-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----/],
  ["generic-secret", /(api[_-]?key|secret|token|passwd|password)\s*[:=]\s*["'][A-Za-z0-9+/_-]{24,}["']/i],
  ["github-token", /gh[pousr]_[A-Za-z0-9]{36,}/],
  ["slack-token", /xox[baprs]-[A-Za-z0-9-]{10,}/],
];
const PII = [
  ["cn-phone", /(?<!\d)1[3-9]\d{9}(?!\d)/],
  ["cn-idcard", /(?<!\d)\d{17}[\dXx](?!\d)/],
  ["wxid", /wxid_[a-z0-9_]{6,}/i],
];
const hits = [];
for (const f of files) {
  if (/\.(png|jpe?g|webp|gif|zip|woff2?|ttf|mp4|webm)$/i.test(f)) continue;
  let txt = "";
  try { txt = fs.readFileSync(f, "utf8"); } catch { continue; }
  const isProse = /\.md$/i.test(f);
  for (const [name, re] of CRED) if (re.test(txt)) hits.push(`${name}: ${f}`);
  if (!isProse) for (const [name, re] of PII) if (re.test(txt)) hits.push(`${name}: ${f}`);
}
const out = { files: files.length, hits, ok: hits.length === 0 };
console.log(JSON.stringify(out, null, 1));
process.exit(out.ok ? 0 : 4);
