#!/usr/bin/env node
/**
 * s2c 适配器（M35，opt-in，不假设 key，跨 agent）。
 * 检测：env 任意 provider key + S2C_DIR(默认 /tmp/s2c) 存在 → 调 s2c_gen.py 生成 HTML；
 *       否则 exit 3（调用方回落内置宿主-agent 管线）。
 * 产出：prototype/assets/s2c-<id>.html + 视图 <iframe> 包装（保 s2c 保真）。
 * 用法: node s2c-adapter.mjs <screenshot.png> <runDir> <viewId>
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
const [img, runDir, viewId] = process.argv.slice(2);
if (!img || !runDir || !viewId || process.argv.includes("--help")) {
  console.log("用法: node s2c-adapter.mjs <screenshot.png> <runDir> <viewId>");
  process.exit(img ? 0 : 1);
}
const key = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY;
const s2c = process.env.S2C_DIR || "/tmp/s2c";
if (!key || !fs.existsSync(path.join(s2c, "backend"))) { console.log("s2c 不可用(无 key 或无 S2C_DIR)→回落内置管线"); process.exit(3); }
const HERE = path.dirname(new URL(import.meta.url).pathname);
const r = spawnSync("python3", [path.join(HERE, "s2c_gen.py"), img], { encoding: "utf8", timeout: 180000, env: { ...process.env, S2C_DIR: s2c } });
if (r.status !== 0 || !r.stdout) { console.log("s2c 生成失败→回落内置管线"); process.exit(3); }
const assets = path.join(path.resolve(runDir), "prototype/assets");
fs.mkdirSync(assets, { recursive: true });
const htmlAsset = `s2c-${viewId}.html`;
fs.writeFileSync(path.join(assets, htmlAsset), r.stdout);
const view = `<div data-dc="s2c/root" style="position:relative;width:100%;height:100%;min-height:844px;overflow:hidden"><iframe src="assets/${htmlAsset}" style="position:absolute;inset:0;width:100%;height:100%;border:0" title="${viewId}"></iframe></div>\n`;
fs.writeFileSync(path.join(path.resolve(runDir), "prototype/views", viewId + ".html"), view);
console.log("✅ s2c view:", viewId);
