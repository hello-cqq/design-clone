#!/usr/bin/env node
/**
 * 把 templates/prototype 的新外壳（index.html/inspector.css/inspector.js）同步到存量 run，
 * 保留每个 run 自己的 __DC_JSON__、标题、视图自定义 CSS。
 * 用法: node sync-shell.mjs [prototype目录...]   （不带参数=扫描全部 design-clone-runs）
 */
import fs from "node:fs";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const TPL = path.join(HERE, "../templates/prototype");
const RUNS = path.join(HERE, "../../../design-clone-runs");

function findRuns() {
  const out = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      const p = path.join(d, e.name);
      if (e.name === "prototype" && fs.existsSync(path.join(p, "index.html"))) out.push(p);
      else if (e.name !== "node_modules") walk(p);
    }
  };
  if (fs.existsSync(RUNS)) walk(RUNS);
  return out;
}

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("用法: node sync-shell.mjs [prototype目录...]（不带参数=扫描全部 design-clone-runs）");
  process.exit(0);
}
const tplIndex = fs.readFileSync(path.join(TPL, "index.html"), "utf8");
const targets = process.argv.slice(2).filter((a) => !a.startsWith("-")).map((p) => path.resolve(p));
const dirs = targets.length ? targets : findRuns();

let ok = 0, skip = 0;
for (const dir of dirs) {
  const old = path.join(dir, "index.html");
  if (!fs.existsSync(old)) { console.log("skip(无 index.html):", dir); skip++; continue; }
  const src = fs.readFileSync(old, "utf8");
  const mTitle = src.match(/<title>([^<]*?) — design-clone 原型<\/title>/);
  const mDC = src.match(/<script>window\.DC = ([\s\S]*?);<\/script>/);
  if (!mDC) { console.log("skip(无 DC JSON):", dir); skip++; continue; }
  const title = mTitle ? mTitle[1] : path.basename(path.dirname(dir));
  let viewCss = "";
  const mStyle = src.match(/<style>([\s\S]*?)<\/style>/);
  if (mStyle) viewCss = mStyle[1].replace(/html\s*,\s*body\s*\{[^}]*\}/, "").trim();

  const html = tplIndex
    .replaceAll("__TITLE__", title)
    .replaceAll("__VIEW_CSS__", viewCss)
    .replaceAll("__DC_JSON__", mDC[1].trim());
  fs.writeFileSync(old, html);
  fs.copyFileSync(path.join(TPL, "inspector.css"), path.join(dir, "inspector.css"));
  fs.copyFileSync(path.join(TPL, "inspector.js"), path.join(dir, "inspector.js"));
  console.log("synced:", path.relative(process.cwd(), dir));
  ok++;
}
console.log(`完成 ${ok} 个，跳过 ${skip} 个`);
