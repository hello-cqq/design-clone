#!/usr/bin/env node
/**
 * 零依赖静态服务器：本地预览原型 + inspector v3 本地写/导出编排（仅 loopback）。
 * 用法: node serve.mjs <产物目录> [--port 4173]
 * POST /__dc_write__  {file, content} —— 白名单: prototype/{edit-overrides,layout-overrides,annotations,products,paths}.json
 * POST /__dc_export__ {items:[{type:page|scene-full|node|path|board, id?, ann?, board?}]}
 *      → headless chromium 元素级截屏（chrome=0，原型本体不含外壳）→ <产物目录>/export/<ts>/
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { parseArgs } from "node:util";

const require = createRequire(import.meta.url);

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("用法: node serve.mjs <产物目录> [--port 4173]");
  process.exit(0);
}
const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { port: { type: "string", default: "4173" } },
});

const root = path.resolve(positionals[0] || ".");
const port = parseInt(values.port, 10);
const WRITE_WHITELIST = new Set([
  "prototype/edit-overrides.json", "prototype/layout-overrides.json", "prototype/annotations.json",
  "prototype/products.json", "prototype/paths.json",
]);
const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml",
  ".mp4": "video/mp4", ".gif": "image/gif", ".ico": "image/x-icon",
  ".yaml": "text/yaml; charset=utf-8", ".woff2": "font/woff2", ".webm": "video/webm",
};
const OPTIONAL_DEFAULTS = {
  "/prototype/edit-overrides.json": "{}",
  "/prototype/variants.json": "{}",
  "/prototype/paths.json": "null",
  "/prototype/annotations.json": "{}",
  "/prototype/journeys.json": "[]",
  "/prototype/products.json": "{}",
  "/knowledge/source-map.json": "{}",
};
const loopback = (req) => ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket.remoteAddress);
const body = (req) => new Promise((res) => { let d = ""; req.on("data", (c) => (d += c)); req.on("end", () => res(d)); });

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  if (req.method === "POST") {
    if (!loopback(req)) { res.writeHead(403); return res.end("loopback only"); }
    const j = JSON.parse(await body(req) || "{}");
    if (u.pathname === "/__dc_write__") {
      if (!WRITE_WHITELIST.has(j.file)) { res.writeHead(400); return res.end("not whitelisted: " + j.file); }
      fs.writeFileSync(path.join(root, j.file), typeof j.content === "string" ? j.content : JSON.stringify(j.content, null, 2));
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify({ ok: true, file: j.file }));
    }
    if (u.pathname === "/__dc_export__") return runExport(j, res);
    res.writeHead(404); return res.end();
  }

  let p = decodeURIComponent(u.pathname);
  if (p.endsWith("/")) p += "index.html";
  const file = path.normalize(path.join(root, p));
  if (!file.startsWith(root) || !fs.existsSync(file)) {
    const opt = OPTIONAL_DEFAULTS[p];
    if (opt !== undefined) {
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(opt);
    }
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    return res.end("404");
  }
  if (fs.statSync(file).isDirectory()) {
    res.writeHead(301, { location: p.endsWith("/") ? p : p + "/" });
    return res.end();
  }
  const ext = path.extname(file);
  const headers = { "content-type": MIME[ext] || "application/octet-stream" };
  if (ext === ".html") headers["cache-control"] = "no-store";
  res.writeHead(200, headers);
  fs.createReadStream(file).pipe(res);
});

async function runExport(job, res) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outDir = path.join(root, "export", ts);
  fs.mkdirSync(path.join(outDir, "pages"), { recursive: true });
  const files = [];
  let browser = null;
  try {
    const items = job.items || [];
    const needBrowser = items.some((i) => i.type !== "board");
    if (needBrowser) {
      const { chromium } = require("playwright");
      browser = await chromium.launch();
    }
    const page = browser ? await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 }) : null;
    const base = `http://localhost:${attempt}`;
    const videoItem = items.find((i) => i.type === "video");
    if (videoItem && browser) {
      const ctx = await browser.newContext({ recordVideo: { dir: outDir, size: { width: 900, height: 1000 } } });
      const vp = await ctx.newPage();
      await vp.goto(`${base}/prototype/?view=path&root=${videoItem.root || ""}&path=${videoItem.path || 0}&play=1`, { waitUntil: "networkidle" });
      await vp.waitForTimeout(Math.min(30000, 6000 + (videoItem.steps || 4) * 2600));
      await vp.close();
      const vid = await vp.video().path();
      fs.renameSync(vid, path.join(outDir, `path-${videoItem.path || 0}.webm`));
      files.push(`path-${videoItem.path || 0}.webm`);
    }
    for (const it of items) {
      if (it.type === "board") {
        fs.writeFileSync(path.join(outDir, "board.json"), JSON.stringify(it.board, null, 2));
        files.push("board.json"); continue;
      }
      const ann = it.ann ? 1 : 0;
      let url, sel, name;
      if (it.type === "page") { url = `${base}/prototype/?chrome=0&ann=${ann}#${it.id}`; sel = "#dc-stage"; name = `pages/${it.id}${it.ann ? "+ann" : ""}.png`; }
      else if (it.type === "scene-full") { url = `${base}/prototype/?chrome=0&view=tree&root=__all__`; sel = "#dc-flow-canvas"; name = "scene-full.png"; }
      else if (it.type === "node") { url = `${base}/prototype/?chrome=0&view=tree&root=${it.id}`; sel = "#dc-flow-canvas"; name = `node-${it.id}.png`; }
      else if (it.type === "path") { url = `${base}/prototype/?chrome=0&view=path&root=${it.root || ""}&path=${it.id}`; sel = `[data-pathrow="${it.id}"]`; name = `path-${it.id}.png`; }
      else continue;
      await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForTimeout(700);
      await page.waitForSelector(sel, { timeout: 5000 });
      await page.locator(sel).screenshot({ path: path.join(outDir, name) });
      files.push(name);
    }
    fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify({ at: new Date().toISOString(), scope: job.scope || "custom", files }, null, 2));
    if (browser) await browser.close();
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, dir: path.relative(process.cwd(), outDir), files }));
  } catch (e) {
    if (browser) await browser.close().catch(() => {});
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: String(e.message).slice(0, 300) }));
  }
}

let attempt = port;
server.listen(attempt, () => {
  console.log(`✅ 原型服务已启动: http://localhost:${attempt}`);
  console.log(`目录: ${root}`);
});
server.on("error", (e) => {
  if (e.code === "EADDRINUSE" && attempt <= 4200) {
    console.log(`⚠️ 端口 ${attempt} 被占用，尝试 ${attempt + 1}`);
    attempt += 1;
    server.listen(attempt);
  } else {
    console.error(`❌ 服务启动失败: ${e.message}`);
    process.exit(1);
  }
});
