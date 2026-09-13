#!/usr/bin/env node
/**
 * demo-shots.mjs（M76-W4）——官网功能演示真景截屏：四场景各取首页舞台截图入 site/assets/demo/。
 * 用法: node demo-shots.mjs [--base-mobile http://localhost:4802 ...]（默认本地端口）
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
const get = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SC = [
  ["mobile", get("--mobile", "http://localhost:4802"), 300, 620],
  ["link", get("--link", "http://localhost:4804"), 300, 620],
  ["desktop", get("--desktop", "http://localhost:4204"), 560, 360],
  ["web", get("--web", "http://localhost:4202"), 560, 360],
];
const b = await chromium.launch();
for (const [key, base, w, h] of SC) {
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(base + "/prototype/"); await p.waitForTimeout(1400);
  await p.locator("#dc-pages button").first().click().catch(() => {});
  await p.waitForTimeout(1200);
  await p.locator("#dc-stage").screenshot({ path: path.join(ROOT, "assets", "demo", key + ".png") });
  await p.close();
  console.log("shot", key, w + "x" + h);
}
await b.close();
console.log("demo-shots done");
