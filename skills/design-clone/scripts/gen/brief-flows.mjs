#!/usr/bin/env node
/**
 * brief-flows.mjs —— 【M104-W1 退役】原 brief.flows→paths.json 生成器已废（不读视图=凭空边根因）。
 * 本文件保留为转调 wrapper：一律委托 paths-gen.mjs（读 data-goto+capture graph 的真值单源）。
 * 用法不变: node brief-flows.mjs --run <runDir>
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const argRun = process.argv[process.argv.indexOf("--run") + 1] || process.argv[2];
console.error("[brief-flows] deprecated → delegating to paths-gen.mjs (DOM truth single source, M104-W1)");
const r = spawnSync(process.execPath, [path.join(here, "..", "paths-gen.mjs"), argRun].filter(Boolean), { stdio: "inherit" });
process.exit(r.status || 0);
