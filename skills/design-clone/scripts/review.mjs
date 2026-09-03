#!/usr/bin/env node
/**
 * 五维评审输入生成：逐屏截屏 + tokens 对比度 + anti-slop grep，产出 report/review-input.json。
 * 用法: node review.mjs <run目录> [--port 4190]
 * agent 读 report/review-*.png + review-input.json，按 remix-protocol §5.5 输出
 * Keep/Fix/QuickWins 写进 report/notes.md（Fix 当轮修，QuickWins 列给用户勾选）。
 */
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { createRequire } from "node:module";
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("用法: node review.mjs <run目录> [--port 4190]");
  process.exit(0);
}


const runDir = path.resolve(process.argv[2] || ".");
const port = +(process.argv.find((a) => a.startsWith("--port="))?.split("=")[1] || 4190);
const protoDir = path.join(runDir, "prototype");
const reportDir = path.join(runDir, "report");
fs.mkdirSync(reportDir, { recursive: true });

const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg" };
const server = http.createServer((req, res) => {
  let pn = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (pn.endsWith("/")) pn += "index.html";
  const p = path.normalize(path.join(runDir, pn));
  if (!p.startsWith(runDir) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": MIME[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(port, r));

const views = fs.readdirSync(path.join(protoDir, "views")).filter((f) => f.endsWith(".html"));
let DC = { pages: [] };
try { DC = JSON.parse(fs.readFileSync(path.join(protoDir, "index.html"), "utf8").match(/window\.DC = (\{[\s\S]*?\});/)?.[1]); } catch {}
if (!DC?.pages?.length)
  DC.pages = views
    .map((f) => f.replace(/\.html$/, ""))
    .map((id) => ({ id, name: id }));

// tokens 对比度（WCAG 相对亮度）
function lum(hex) {
  const m = hex.replace("#", "").match(/.{2}/g); if (!m) return 0;
  const [r, g, b] = m.map((v) => { const c = parseInt(v, 16) / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const css = fs.readFileSync(path.join(runDir, "knowledge", "tokens.css"), "utf8");
const tok = (name) => (css.match(new RegExp(name + ":\\s*([^;]+);")) || [])[1]?.trim();
const contrasts = {};
const tp = tok("--color-text-primary"), bg = tok("--color-bg"), sf = tok("--color-surface");
if (tp && bg) contrasts.text_on_bg = +(((Math.max(lum(tp), lum(bg)) + 0.05) / (Math.min(lum(tp), lum(bg)) + 0.05)).toFixed(2));
if (tp && sf) contrasts.text_on_surface = +(((Math.max(lum(tp), lum(sf)) + 0.05) / (Math.min(lum(tp), lum(sf)) + 0.05)).toFixed(2));

// anti-slop grep（views 全量）
const SLOP = [/linear-gradient\([^)]*#6366f1/i, /linear-gradient\([^)]*purple/i, /border-left:\s*\d+px\s+solid/, /font-family:[^;]*Inter\b/, /emoji/i];
const slop_hits = [];
for (const v of views) {
  const t = fs.readFileSync(path.join(protoDir, "views", v), "utf8");
  SLOP.forEach((re, i) => { if (re.test(t)) slop_hits.push(`${v}: pattern#${i} ${re}`); });
}

// 逐屏截屏
const req2 = createRequire(import.meta.url);
const { chromium } = req2("playwright");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 950 } });
const shots = [];
for (const p of DC.pages || []) {
  await page.goto(`http://localhost:${port}/prototype/#${p.id}`);
  await page.reload(); // hash-only 导航不重载，需强制重读 hash
  await page.waitForTimeout(1200);
  const f = `review-${p.id}.png`;
  await page.screenshot({ path: path.join(reportDir, f) });
  shots.push(f);
}
await browser.close();
server.close();

const var_tokens = [...new Set(views.flatMap((v) => fs.readFileSync(path.join(protoDir, "views", v), "utf8").match(/var\(--[\w-]+\)/g) || []))].sort();
fs.writeFileSync(path.join(reportDir, "review-input.json"), JSON.stringify({ contrasts, slop_hits, shots, wcag_aa: 4.5, var_tokens }, null, 2));
console.log(`✅ 评审输入就绪：${shots.length} 屏截屏 · 对比度 ${JSON.stringify(contrasts)} · slop ${slop_hits.length} 命中`);
console.log("下一步：agent 读 report/review-*.png，按五维(哲学/层级/细节/功能/创新)输出 Keep/Fix/QuickWins → report/notes.md");
