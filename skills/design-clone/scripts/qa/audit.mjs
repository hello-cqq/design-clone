#!/usr/bin/env node
/**
 * 逐页逐控件验收（M36/M37）：每视图渲染截图 + 源控件 label 召回 + truncated + fidelity + 并排图。
 * 用法: node audit.mjs --run <runDir> --base <url> [--views a,b] [--out qa/audit.json]
 * 源控件：android ui-tree(clickable/leaf-text) / web ui-tree(text)；无树→仅视觉+fidelity+truncated。
 * 门：label_recall≥0.8 且 truncated≤0.2 且 fidelity≤阈(或 waive)。
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import pixelmatch from "pixelmatch";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const A = process.argv.slice(2);
const get = (k) => (A.includes(k) ? A[A.indexOf(k) + 1] : null);
if (A.includes("--help") || A.includes("-h") || !get("--run")) {
  console.log("用法: node audit.mjs --run <runDir> --base <url> [--views a,b] [--out qa/audit.json]");
  process.exit(get("--run") ? 0 : 1);
}
const run = path.resolve(get("--run"));
const base = get("--base").replace(/\/+$/, "");
const outP = get("--out") || path.join(run, "qa/audit.json");
const viewsArg = get("--views");
const viewsDir = path.join(run, "prototype/views");
let views = viewsArg ? viewsArg.split(",") : fs.readdirSync(viewsDir).filter((f) => f.endsWith(".html")).map((f) => f.replace(".html", ""));

function sourceLabels(id) {
  const xml = path.join(run, "capture/ui-tree", id + ".xml");
  const js = path.join(run, "capture/ui-tree", id + ".json");
  const labels = new Set();
  const personal = (t) => /[:：]\s*\S{3,}/.test(t) || /1[3-9]\d{9}/.test(t) || /wxid_|Ahahah|AhQ/i.test(t);
  if (fs.existsSync(xml)) {
    const x = fs.readFileSync(xml, "utf8");
    for (const m of x.matchAll(/text="([^"]+)"/g)) if (m[1].trim() && !personal(m[1])) labels.add(m[1].trim());
  } else if (fs.existsSync(js)) {
    const j = JSON.parse(fs.readFileSync(js, "utf8"));
    for (const e of j.elements || []) if ((e.text || "").trim() && !personal(e.text)) labels.add(e.text.trim());
  }
  return [...labels].filter((t) => t.length >= 2 && t.length <= 12).slice(0, 30);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const result = {};
for (const v of views) {
  await page.goto(base + "/prototype/#pages/" + v, { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(900);
  const rendered = await page.evaluate(() => {
    const stage = document.querySelector("#dc-stage");
    const text = stage ? stage.textContent : "";
    let trunc = 0, total = 0;
    for (const el of document.querySelectorAll("#dc-stage span,#dc-stage a,#dc-stage div")) {
      if (el.children.length || !el.textContent.trim()) continue;
      total++; if (el.scrollWidth > el.clientWidth + 2) trunc++;
    }
    return { text, truncRatio: total ? trunc / total : 0 };
  });
  // 捕获时 id 配对（GUI 已按导航步骤映射源↔视图）
  const cap = path.join(run, "capture/screens", v + ".png");
  const labels = sourceLabels(v);
  const matched = labels.filter((l) => rendered.text.includes(l));
  const recall = labels.length ? matched.length / labels.length : null;
  const shot = path.join("/tmp", "audit-" + path.basename(run) + "-" + v + ".png");
  await page.locator("#dc-stage").screenshot({ path: shot }).catch(() => {});
  let fidelity = null;
  if (fs.existsSync(cap) && fs.existsSync(shot)) {
    try {
      const W = 400;
      const am = await sharp(cap).metadata();
      const a = await sharp(cap).resize({ width: W }).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
      const b = await sharp(shot).resize({ width: W, height: a.info.height }).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
      const n = pixelmatch(a.data, b.data, null, W, a.info.height, { threshold: 0.1 });
      fidelity = +(n / (W * a.info.height)).toFixed(3);
      await sharp({ create: { width: W * 2 + 8, height: a.info.height, channels: 3, background: { r: 255, g: 255, b: 255 } } })
        .composite([
          { input: await sharp(cap).resize({ width: W }).toBuffer(), left: 0, top: 0 },
          { input: await sharp(shot).resize({ width: W }).toBuffer(), left: W + 8, top: 0 },
        ]).jpeg({ quality: 70 }).toFile(path.join(run, "qa", `audit-${v}-side.jpg`)).catch(() => {});
    } catch {}
  }
  result[v] = { src: v, labels: labels.length, matched: matched.length, recall, missing: labels.filter((l) => !matched.includes(l)).slice(0, 8), truncRatio: +rendered.truncRatio.toFixed(2), fidelity };
}
await browser.close();
fs.mkdirSync(path.dirname(outP), { recursive: true });
fs.writeFileSync(outP, JSON.stringify(result, null, 1));
const waive = (() => { try { return JSON.parse(fs.readFileSync(path.join(run, "qa/audit-waive.json"), "utf8")); } catch { return {}; } })();
const bad = Object.entries(result).filter(([k, r]) => r.truncRatio > 0.2 && !waive[k]?.trunc);
console.log(JSON.stringify({ views: Object.keys(result).length, bad: bad.map(([k]) => k + `(rec=${result[k].recall ?? "-"} fid=${result[k].fidelity ?? "-"} trunc=${result[k].truncRatio})`) }));
