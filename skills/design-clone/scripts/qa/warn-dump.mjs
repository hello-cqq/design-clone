#!/usr/bin/env node
/**
 * warn 明细导出器：遍历全部页面，输出 emoji / 低对比问题节点明细（供 retrofit 批量修）。
 * 用法: node warn-dump.mjs <base-url> [--out <file>]
 * 输出: { page, emoji: [{text,tag,dc}], contrast: [{text,tag,dc,color,bg,ratio,fs}] }
 */
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("用法: node warn-dump.mjs <base-url> [--out <file>]");
  process.exit(0);
}
const { positionals, values } = parseArgs({ allowPositionals: true, options: { out: { type: "string" } } });
const base = (positionals[0] || "").replace(/\/+$/, "").replace(/\/prototype$/, "");
if (!base) { console.log("用法: node warn-dump.mjs <base-url> [--out <file>]"); process.exit(1); }

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.emulateMedia({ reducedMotion: "reduce" });
await page.goto(base + "/prototype/", { waitUntil: "networkidle" });
await page.waitForTimeout(600);

const dumpOne = () => page.evaluate(() => {
  const re = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
  const emoji = [];
  for (const n of document.querySelectorAll("#dc-stage a, #dc-stage button, #dc-stage span, #dc-stage div")) {
    if (n.querySelector("svg, img")) continue;
    const t = (n.childNodes.length === 1 && n.firstChild.nodeType === 3) ? n.textContent.trim() : "";
    if (t && t.length <= 3 && re.test(t)) emoji.push({ text: t, tag: n.tagName.toLowerCase(), dc: n.closest("[data-dc]")?.getAttribute("data-dc") || "", cls: (n.className || "").toString().slice(0, 60) });
  }
  const cv = document.createElement("canvas"); cv.width = cv.height = 1;
  const cx2 = cv.getContext("2d", { willReadFrequently: true });
  const lum = (c) => { cx2.clearRect(0, 0, 1, 1); cx2.fillStyle = "#fff"; cx2.fillRect(0, 0, 1, 1); cx2.fillStyle = c; cx2.fillRect(0, 0, 1, 1); const d = cx2.getImageData(0, 0, 1, 1).data; const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(d[0]) + 0.7152 * f(d[1]) + 0.0722 * f(d[2]); };
  const toRGB = (c) => { cx2.clearRect(0, 0, 1, 1); cx2.fillStyle = c; cx2.fillRect(0, 0, 1, 1); const d = cx2.getImageData(0, 0, 1, 1).data; return `rgba(${d[0]}, ${d[1]}, ${d[2]}, ${(d[3] / 255).toFixed(2)})`; };
  const contrast = [];
  for (const n of [...document.querySelectorAll("#dc-stage *")].slice(0, 300)) {
    if (!n.textContent.trim() || n.children.length) continue;
    const cs = getComputedStyle(n);
    if (parseFloat(cs.fontSize) > 18) continue;
    const layers = [];
    let p = n, hasImg = false;
    while (p && p !== document.documentElement) { const cs3 = getComputedStyle(p); if (cs3.backgroundImage !== "none") hasImg = true; const b = cs3.backgroundColor; if (b !== "rgba(0, 0, 0, 0)") layers.push(b); p = p.parentElement; }
    if (hasImg) continue;
    cx2.clearRect(0, 0, 1, 1); cx2.fillStyle = "#fff"; cx2.fillRect(0, 0, 1, 1);
    for (const c of layers.reverse()) { cx2.fillStyle = c; cx2.fillRect(0, 0, 1, 1); }
    const d = cx2.getImageData(0, 0, 1, 1).data;
    if (d[3] < 200) continue;
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    const lb = 0.2126 * f(d[0]) + 0.7152 * f(d[1]) + 0.0722 * f(d[2]);
    const r = (lum(cs.color) + 0.05) / (lb + 0.05);
    const ratio = Math.max(r, 1 / r);
    if (ratio < 4.5) contrast.push({ text: n.textContent.trim().slice(0, 24), tag: n.tagName.toLowerCase(), dc: n.closest("[data-dc]")?.getAttribute("data-dc") || "", color: toRGB(cs.color), bg: `rgba(${d[0]}, ${d[1]}, ${d[2]}, 1)`, ratio: Math.round(ratio * 100) / 100, fs: cs.fontSize });
  }
  const privacy = [];
  const pre = [/1[3-9]\d{9}/, /wxid_[a-z0-9_]+/i, /微信号[:：]/, /[\w.+-]+@[\w-]+\.(com|cn|net|org)/i, /\d{17}[\dXx]/];
  for (const n of [...document.querySelectorAll("#dc-stage *")].slice(0, 400)) {
    if (n.children.length) continue;
    const t = (n.textContent || "").trim();
    if (!t) continue;
    for (const r of pre) if (r.test(t)) { privacy.push({ text: t.slice(0, 30), dc: n.closest("[data-dc]")?.getAttribute("data-dc") || "" }); break; }
  }
  return { emoji, contrast, privacy };
});

const out = [];
const btns = page.locator("#dc-pages button");
const n = await btns.count();
for (let i = 0; i < n; i++) {
  await btns.nth(i).click();
  await page.waitForTimeout(450);
  const label = (await btns.nth(i).textContent() || "").trim();
  const d = await dumpOne();
  if (d.emoji.length || d.contrast.length) out.push({ page: label, ...d });
}
await browser.close();
const json = JSON.stringify(out, null, 1);
if (values.out) fs.writeFileSync(path.resolve(values.out), json);
console.log(json);
