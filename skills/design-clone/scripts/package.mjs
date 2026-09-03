#!/usr/bin/env node
/**
 * 打包 skill 主体为 dist/design-clone.zip（无 CLI 平台兜底，AGENTS.md 既定）。
 * 用法: node package.mjs [--out dist/design-clone.zip]
 * 排除: node_modules / 缓存 / 运行产物。
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const SKILL = path.join(HERE, "..");
const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log("用法: node package.mjs [--out dist/design-clone.zip]");
  process.exit(0);
}
const out = path.resolve(args[args.indexOf("--out") + 1] || path.join(SKILL, "../../dist/design-clone.zip"));
fs.mkdirSync(path.dirname(out), { recursive: true });
execSync(`cd "${SKILL}" && zip -r -q "${out}" SKILL.md references schema presets templates scripts -x "scripts/node_modules/*" -x "*/.cache/*"`, { stdio: "inherit" });
console.log("✅", out, fs.statSync(out).size, "bytes");
