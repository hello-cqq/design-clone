#!/usr/bin/env node
/**
 * 审美纠正闭环取证器（M14b）：把「生成视图」与「源帧」拼成左右对照图，
 * 供宿主 VLM 按 critique-loop.md 清单打分修正。
 *
 * 用法:
 *   node shotdiff.mjs <runDir> [view-id] [--port <n>] [--out <dir>] [--w 390] [--h 844]
 *   不传 view-id = 全部视图逐个出拼图。
 */
import { parseArgs } from "node:util";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { createRequire } from "node:module";

const req = createRequire(import.meta.url);
const { chromium } = req("playwright");
const sharp = req("sharp");

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("用法: node shotdiff.mjs <runDir> [view-id] [--port n] [--out dir] [--w 390] [--h 844]\n产出 <out>/shotdiff-<view>.png（左=生成，右=源帧，同宽并排）。");
  process.exit(0);
}

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { port: { type: "string" }, out: { type: "string" }, w: { type: "string", default: "390" }, h: { type: "string", default: "844" } },
});
const runDir = path.resolve(positionals[0]);
if (!fs.existsSync(path.join(runDir, "prototype", "index.html"))) { console.error("runDir 缺 prototype/index.html"); process.exit(1); }

const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".png": "image/png", ".jpeg": "image/jpeg", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".webp": "image/webp", ".webm": "video/webm" };
const server = http.createServer((rq, rs) => {
  const p = path.normalize(path.join(runDir, decodeURIComponent(new URL(rq.url, "http://x").pathname))).replace(/\/$/, "") ;
  let f = p;
  if (!path.extname(f)) f += "/index.html";
  fs.readFile(f, (e, buf) => {
    if (e) { rs.statusCode = 404; rs.end("404"); return; }
    rs.setHeader("content-type", TYPES[path.extname(f)] || "application/octet-stream");
    rs.end(buf);
  });
});
const port = +(values.port || 0);
await new Promise((r) => server.listen(port, "127.0.0.1", r));
const realPort = server.address().port;

const viewsDir = path.join(runDir, "prototype", "views");
const views = positionals[1] ? [positionals[1]] : fs.readdirSync(viewsDir).filter((f) => f.endsWith(".html")).map((f) => f.replace(/\.html$/, "")).sort();
let srcmap = {};
try { srcmap = JSON.parse(fs.readFileSync(path.join(runDir, "knowledge", "source-map.json"), "utf8")); } catch {}
const outDir = path.resolve(values.out || path.join(runDir, "qa"));
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +values.w, height: +values.h }, deviceScaleFactor: 2 });
await page.emulateMedia({ reducedMotion: "reduce" });

const made = [];
for (const v of views) {
  await page.goto(`http://127.0.0.1:${realPort}/prototype/?chrome=0&embed=1#${v}`, { waitUntil: "networkidle" }).catch(() => {});
  const cur = await page.evaluate(() => location.hash);
  if (cur !== `#${v}` && cur !== `#pages/${v}`) await page.evaluate((h) => { location.hash = h; }, v);
  await page.waitForTimeout(900);
  const shot = await page.locator("#dc-phone").screenshot().catch(() => null);
  if (!shot) { console.warn("⚠ 截图失败:", v); continue; }
  const src = srcmap[v] ? path.join(runDir, srcmap[v]) : path.join(runDir, "capture", "frames", `img-${v.slice(0, 2)}.jpeg`);
  if (!fs.existsSync(src)) { console.warn("⚠ 无源帧:", v, "→ 仅存生成图"); fs.writeFileSync(path.join(outDir, `shotdiff-${v}-gen.png`), shot); continue; }
  const meta = await sharp(shot).metadata();
  const srcBuf = await sharp(src).resize({ width: meta.width }).toBuffer();
  const srcMeta = await sharp(srcBuf).metadata();
  const H = Math.max(meta.height, srcMeta.height);
  const gap = 12;
  const canvas = sharp({ create: { width: meta.width * 2 + gap, height: H, channels: 3, background: { r: 17, g: 17, b: 17 } } });
  const out = path.join(outDir, `shotdiff-${v}.png`);
  await canvas.composite([
    { input: shot, left: 0, top: 0 },
    { input: srcBuf, left: meta.width + gap, top: 0 },
  ]).png().toFile(out);
  made.push(out);
  console.log("shotdiff:", path.relative(process.cwd(), out));
}
await browser.close();
server.close();
console.log(`共 ${made.length} 张对照图 → ${path.relative(process.cwd(), outDir)}（左=生成 右=源帧；按 critique-loop.md 审查）`);
