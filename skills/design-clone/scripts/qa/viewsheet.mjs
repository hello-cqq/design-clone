#!/usr/bin/env node
/**
 * viewsheet.mjs — 逐视图缩略拼图（M44d critique 工作流）：把 run 的所有视图 #dc-stage 截屏拼成一张 contact sheet，
 * 供宿主 VLM 一次看全并逐视图打 layout 分（qa/critique.mjs --set）。chrome=0 去壳。
 * 用法: node viewsheet.mjs --run <runDir> --base <url> --out /tmp/sheet.jpg [--width 300] [--views a,b]
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const sharp = require("sharp");
const A = process.argv.slice(2);
const get = (k, d) => (A.includes(k) ? A[A.indexOf(k) + 1] : d);
const run = path.resolve(get("--run", ""));
const base = (get("--base", "") || "").replace(/\/+$/, "");
const out = get("--out", "/tmp/viewsheet.jpg");
const COLW = parseInt(get("--width", "300"), 10);
if (!run || !base || A.includes("--help")) { console.log("用法: node viewsheet.mjs --run <runDir> --base <url> --out <jpg>"); process.exit(get("--run") ? 0 : 1); }
const viewsDir = path.join(run, "prototype/views");
const views = (get("--views", null) ? get("--views", "").split(",") : fs.readdirSync(viewsDir).filter((f) => f.endsWith(".html")).map((f) => f.replace(".html", "")));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.emulateMedia({ reducedMotion: "reduce" });
const cells = [];
for (const v of views) {
  await page.goto(base + "/prototype/?chrome=0&ann=0#pages/" + v, { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
  await page.waitForFunction((id) => { const s = document.querySelector("#dc-stage"); return location.hash.includes(id) && s && s.children.length > 0; }, v, { timeout: 6000 }).catch(() => {});
  await page.waitForTimeout(350);
  const buf = await page.locator("#dc-stage").screenshot();
  let small = await sharp(buf).resize({ width: COLW }).jpeg({ quality: 80 }).toBuffer();
  let m = await sharp(small).metadata();
  const MAXH = 1500;
  if (m.height > MAXH) { small = await sharp(small).extract({ left: 0, top: 0, width: m.width, height: MAXH }).jpeg({ quality: 80 }).toBuffer(); m = await sharp(small).metadata(); }
  cells.push({ v, buf: small, h: m.height });
}
await browser.close();
const cols = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(cells.length))));
const colH = new Array(cols).fill(0);
const placed = [];
for (let i = 0; i < cells.length; i++) {
  const c = i % cols;
  placed.push({ input: cells[i].buf, left: c * (COLW + 8), top: colH[c] });
  colH[c] += cells[i].h + 8;
}
const W = cols * COLW + (cols - 1) * 8, H = Math.max(...colH) - 8;
await sharp({ create: { width: W, height: H, channels: 3, background: { r: 250, g: 250, b: 250 } } }).composite(placed).jpeg({ quality: 80 }).toFile(out);
console.log(JSON.stringify({ out, views: cells.map((c) => c.v), cols, W, H }));
