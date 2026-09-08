#!/usr/bin/env node
/**
 * 把 templates/prototype 的新外壳（index.html/inspector.css/inspector.js=ins/* 拼接产物）同步到存量 run，
 * 保留每个 run 自己的 __DC_JSON__、标题、视图自定义 CSS。
 * 用法: node sync-shell.mjs [prototype目录...]   （不带参数=扫描全部 design-clone-runs）
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { buildInspector } from "./build-shell.mjs";

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
// M46：跳过 *-v1 重修备份目录（备份必须保持重修前原状）
const dirs = (targets.length ? targets : findRuns()).filter((d) => !/[-/]v1(\/|$)/.test(d.replace(/\/prototype\/?$/, "")) && !d.endsWith("-v1/prototype"));

let ok = 0, skip = 0;
for (const dir of dirs) {
  const old = path.join(dir, "index.html");
  if (!fs.existsSync(old)) { console.log("skip(无 index.html):", dir); skip++; continue; }
  const src = fs.readFileSync(old, "utf8");
  const mTitle = src.match(/<title>([^<]*?) — design-clone 原型<\/title>/);
  const mDC = src.match(/<script>window\.DC = ([\s\S]*?);<\/script>/);
  if (!mDC) { console.log("skip(无 DC JSON):", dir); skip++; continue; }
  const title = mTitle ? mTitle[1] : path.basename(path.dirname(dir));
  // M44f: __VIEW_CSS__ 以组件库为唯一源重建（库更新可传播到存量 run），不再沿用 run 内烘焙旧 css
  let shell = "c_mobile";
  try { shell = JSON.parse(mDC[1]).shell || "c_mobile"; } catch {}
  const CSSFOR = { c_mobile: "mobile-im.css", mobile: "mobile-im.css", c_tablet: "mobile-im.css", tablet: "mobile-im.css", c_desktop: "desktop-app.css", desktop: "desktop-app.css", c_browser: "web-marketing.css", c_browser2: "web-marketing.css", web: "web-marketing.css" };
  const cssFile = path.join(TPL, "../components", CSSFOR[shell] || "mobile-im.css");
  const libCss = fs.existsSync(cssFile) ? fs.readFileSync(cssFile, "utf8") : "";
  const mStyle = src.match(/<style>([\s\S]*?)<\/style>/);
  const runExtra = mStyle ? mStyle[1].replace(/html\s*,\s*body\s*\{[^}]*\}/, "").trim() : "";
  // run 额外 css 在前、组件库在后（库为权威，更新可传播；run 特有类保留）
  let viewCss = (runExtra ? runExtra + "\n" : "") + libCss;

  const html = tplIndex
    .replaceAll("__TITLE__", title)
    .replaceAll("__VIEW_CSS__", viewCss)
    .replaceAll("__DC_JSON__", mDC[1].trim());
  fs.writeFileSync(old, html);
  fs.copyFileSync(path.join(TPL, "inspector.css"), path.join(dir, "inspector.css"));
  // inspector.js 是 ins/* 分段的拼接产物（build-shell.mjs），不再手维护单文件
  fs.writeFileSync(path.join(dir, "inspector.js"), buildInspector());
  fs.copyFileSync(path.join(TPL, "runtime.js"), path.join(dir, "runtime.js"));
  fs.copyFileSync(path.join(TPL, "zipstore.js"), path.join(dir, "zipstore.js"));
  // M45：utility 子集本地编译（替代 Tailwind CDN）；失败不阻断换壳，但必须可见
  const uc = spawnSync("node", [path.join(HERE, "gen/utility-css.mjs"), "--run", path.dirname(dir), "--out", path.join(dir, "utilities.css")], { encoding: "utf8" });
  if (uc.status !== 0) console.log("  ⚠️ utilities.css 生成失败:", (uc.stderr || "").slice(0, 200));
  console.log("synced:", path.relative(process.cwd(), dir));
  ok++;
}
console.log(`完成 ${ok} 个，跳过 ${skip} 个`);
