#!/usr/bin/env node
/**
 * export-zip.mjs（M84）——为 run 预构建 prototype/export/all.zip（静态托管"导出全部"离线包）。
 * 复用 serve/export.mjs 的 runExport（headless 截屏编排），stub res 直调，无需 HTTP。
 * 用法: node export-zip.mjs --run <runDir> [--port 4599]
 */
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { parseArgs } from "node:util";
import { createRequire } from "node:module";
const { values: V } = parseArgs({ options: { run: { type: "string" }, port: { type: "string", default: "4599" } } });
if (!run0()) process.exit(1);
function run0() { return !!V.run; }
const require = createRequire(import.meta.url);
const HERE = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(V.run);
const port = +V.port;
const base = `http://localhost:${port}`;
const srv = spawn("node", [path.join(HERE, "..", "serve.mjs"), root, "--port", String(port)], { stdio: "ignore" });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let up = false;
for (let i = 0; i < 40 && !up; i++) {
  await wait(250);
  up = await fetch(base + "/prototype/index.html").then((r) => r.ok).catch(() => false);
}
if (!up) { console.log("✗ serve 未起"); srv.kill(); process.exit(1); }
const dc = JSON.parse(fs.readFileSync(path.join(root, "prototype", "index.html"), "utf8").match(/window\.DC = (\{[\s\S]*?\});/)[1]);
const items = [];
(dc.pages || []).forEach((p) => { items.push({ type: "page", id: p.id, ann: false }); items.push({ type: "page", id: p.id, ann: true }); });
items.push({ type: "scene-full" }, { type: "board", board: { at: new Date().toISOString(), preset: "all" } }, { type: "design-json" }, { type: "figma" });
const { runExport } = await import("../serve/export.mjs");
const captured = {};
const stubRes = { writeHead(code, hdr) { captured.code = code; }, setHeader() {}, end(body) { captured.body = body; } };
await runExport({ root, base, job: { items, scope: "all", returnFiles: false }, res: stubRes });
srv.kill();
const out = JSON.parse(captured.body || "{}");
if (!out.ok) { console.log("✗ runExport:", out.error); process.exit(1); }
const outDir = path.resolve(out.dir);
const Z = require(path.join(HERE, "..", "..", "templates", "prototype", "zipstore.js"));
const entries = [];
const walk = (dir, rel) => {
  for (const f of fs.readdirSync(dir)) {
    const abs = path.join(dir, f), r = rel ? rel + "/" + f : f;
    if (fs.statSync(abs).isDirectory()) walk(abs, r);
    else entries.push({ name: r, data: new Uint8Array(fs.readFileSync(abs)) });
  }
};
walk(outDir, "");
const zipBuf = Buffer.from(Z.zipStoreBytes(entries));
const dst = path.join(root, "prototype", "export");
fs.mkdirSync(dst, { recursive: true });
fs.writeFileSync(path.join(dst, "all.zip"), zipBuf);
console.log("✓ export/all.zip", entries.length, "files", Math.round(zipBuf.length / 1024) + "KB");
