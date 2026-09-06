#!/usr/bin/env node
/**
 * 视图截屏（M19 fidelity 循环用）：截 #dc-stage 元素图，供 fidelity.mjs 与源对比。
 * 用法: node viewshot.mjs <base-url> <viewId> <out.png>
 */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const [base, viewId, out] = process.argv.slice(2);
if (!base || !viewId || !out || ["--help", "-h"].includes(base)) {
  console.log("用法: node viewshot.mjs <base-url> <viewId> <out.png>");
  process.exit(base ? 0 : 1);
}
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
await p.emulateMedia({ reducedMotion: "reduce" });
// chrome=0：长页面元素截屏会滚动拼接，固定定位的外壳（底栏/缩放条）会渗进图里 → 必须去壳
await p.goto(base.replace(/\/+$/, "") + "/prototype/?chrome=0&ann=0#pages/" + viewId, { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
await p.waitForTimeout(1200);
const el = p.locator("#dc-stage");
await el.screenshot({ path: out });
await b.close();
console.log("✅", out);
