#!/usr/bin/env node
/**
 * 零依赖静态服务器：本地预览原型 + inspector 本地写/导出编排（仅 loopback）。
 * 实现拆分在 scripts/serve/{policy,static,write,export}.mjs（policy 有单测）；本文件只做路由与生命周期。
 *
 * 用法: node serve.mjs <产物目录> [--port 4173]
 * POST /__dc_write__  {file, content} —— 白名单见 serve/policy.mjs
 * POST /__dc_export__ {items:[…], returnFiles?:bool} —— 见 serve/export.mjs
 * 安全：仅 loopback 可 POST；写盘走白名单；静态读做 root 分隔符前缀校验；请求体上限 8MB。
 */
import http from "node:http";
import path from "node:path";
import { parseArgs } from "node:util";
import { loopback, readBody, json } from "./serve/policy.mjs";
import { makeStaticHandler } from "./serve/static.mjs";
import { makeWriteHandler } from "./serve/write.mjs";
import { runExport } from "./serve/export.mjs";

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
const serveStatic = makeStaticHandler(root);
const handleWrite = makeWriteHandler(root);

const server = http.createServer((req, res) =>
  handle(req, res).catch((e) => {
    if (!res.headersSent) json(res, 500, { ok: false, error: String((e && e.message) || e).slice(0, 200) });
    else res.end();
  }));

async function handle(req, res) {
  const u = new URL(req.url, "http://x");
  if (req.method === "POST") {
    if (!loopback(req)) { res.writeHead(403); return res.end("loopback only"); }
    let j;
    try { j = JSON.parse((await readBody(req)) || "{}"); }
    catch (e) { return json(res, 400, { ok: false, error: "bad json: " + e.message }); }
    if (u.pathname === "/__dc_write__") return handleWrite(res, j);
    if (u.pathname === "/__dc_export__") return runExport({ root, base: `http://localhost:${attempt}`, job: j, res });
    res.writeHead(404); return res.end();
  }
  return serveStatic(req, res, u);
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

// 本地预览服务不应因单次异常整体退出（导出/写盘失败只影响该请求）
process.on("unhandledRejection", (e) => console.error("⚠️ unhandledRejection:", (e && e.message) || e));
process.on("uncaughtException", (e) => console.error("⚠️ uncaughtException:", (e && e.message) || e));
