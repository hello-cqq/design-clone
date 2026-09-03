#!/usr/bin/env node
/**
 * 导出路径演示视频：驱动原型演示模式自动播放并录屏（借鉴 huashu HTML→MP4 管线）。
 * 用法: node export-walkthrough.mjs <run目录> [--journey <索引>] [--gif]
 * 产物: <run>/report/walkthrough-<journey-id>.webm（有 ffmpeg 时另出 .mp4 / .gif）
 * 零额外依赖：Playwright 录屏；ffmpeg 可选。
 */
import { parseArgs } from "node:util";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { createRequire } from "node:module";


if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("用法: node export-walkthrough.mjs <run目录> [--journey <索引>] [--gif]");
  process.exit(0);
}
const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { journey: { type: "string", default: "0" }, gif: { type: "boolean", default: false } },
});
const runDir = path.resolve(positionals[0] || ".");
const protoDir = path.join(runDir, "prototype");
const reportDir = path.join(runDir, "report");
fs.mkdirSync(reportDir, { recursive: true });

if (!fs.existsSync(path.join(protoDir, "index.html"))) {
  console.error("❌ 未找到 prototype/index.html"); process.exit(1);
}
const journeys = JSON.parse(fs.readFileSync(path.join(protoDir, "journeys.json"), "utf8"));
const ji = Math.min(+values.journey, journeys.length - 1);
const journey = journeys[ji];

const hasFfmpeg = (() => { try { execSync("ffmpeg -version", { stdio: "ignore" }); return true; } catch { return false; } })();

const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml" };
const server = http.createServer((req, res) => {
  let pn = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (pn.endsWith("/")) pn += "index.html";
  const p = path.normalize(path.join(runDir, pn));
  if (!p.startsWith(runDir) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end("404"); }
  res.writeHead(200, { "content-type": MIME[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
});

const req = createRequire(import.meta.url);
const { chromium } = req("playwright");

await new Promise((r) => server.listen(0, r));
const port = server.address().port;
console.log(`[walkthrough] 服务 :${port} · 路径「${journey.name}」(${journey.steps.length} 步)`);

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1000, height: 950 },
  recordVideo: { dir: reportDir, size: { width: 1000, height: 950 } },
});
const page = await context.newPage();
await page.goto(`http://localhost:${port}/prototype/?demo=${ji}`);
try {
  await page.waitForFunction(() => window.__dcDemo === "done", { timeout: 180000 });
} catch {
  console.warn("⚠️ 等待演示结束超时，按当前进度导出");
}
await page.waitForTimeout(1200);
const video = page.video();
await context.close();
await browser.close();
server.close();

const tmp = await video.path();
const outBase = path.join(reportDir, `walkthrough-${journey.id}`);
fs.renameSync(tmp, outBase + ".webm");
console.log(`✅ ${outBase}.webm`);

if (hasFfmpeg) {
  execSync(`ffmpeg -y -loglevel error -i "${outBase}.webm" -vf "scale=800:-2" "${outBase}.mp4"`);
  console.log(`✅ ${outBase}.mp4`);
  if (values.gif) {
    execSync(`ffmpeg -y -loglevel error -i "${outBase}.webm" -vf "fps=12,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" "${outBase}.gif"`);
    console.log(`✅ ${outBase}.gif`);
  }
} else {
  console.log("ℹ️ 未装 ffmpeg，仅导出 webm（brew install ffmpeg 后可转 mp4/gif）");
}
