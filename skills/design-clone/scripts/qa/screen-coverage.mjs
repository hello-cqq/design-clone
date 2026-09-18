#!/usr/bin/env node
/**
 * screen-coverage（M111）：knowledge/screen-inventory.md 登记的每屏必须有对应视图文件。
 * 用法: node screen-coverage.mjs <runDir>
 * 退出码: 0 全覆盖 / 3 有缺屏
 */
import fs from "node:fs";
import path from "node:path";
const run = process.argv[2];
if (!run || process.argv.includes("--help")) { console.log("用法: node screen-coverage.mjs <runDir>"); process.exit(0); }
const inv = path.join(run, "knowledge/screen-inventory.md");
if (!fs.existsSync(inv)) { console.log(JSON.stringify({ ok: true, note: "无库存清单（非链接/桌面源可豁免）" })); process.exit(0); }
const md = fs.readFileSync(inv, "utf8");
const screens = [...md.matchAll(/\|\s*\d+\s*\|[^|]+\|\s*([a-z0-9-]+)\s*\|/gi)].map((m) => m[1]);
const viewsDir = path.join(run, "prototype/views");
const have = new Set(fs.existsSync(viewsDir) ? fs.readdirSync(viewsDir).filter((f) => f.endsWith(".html")).map((f) => f.replace(/\.html$/, "")) : []);
const missing = screens.filter((s) => !have.has(s));
console.log(JSON.stringify({ screens: screens.length, have: have.size, missing, ok: missing.length === 0 }));
process.exit(missing.length ? 3 : 0);
