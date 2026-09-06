/**
 * serve 安全策略与公共原语（M45 从 serve.mjs 抽出，可单测）。
 * 只含纯函数/常量，不做 IO（readBody 除外，它只读流）。
 */
import path from "node:path";

/** 可写文件白名单（相对 run 根）。其余一律 400 —— 本地服务也不开任意写。 */
export const WRITE_WHITELIST = new Set([
  "prototype/edit-overrides.json", "prototype/layout-overrides.json", "prototype/annotations.json",
  "prototype/products.json", "prototype/paths.json", "prototype/variants-index.json",
]);
/** 变体产物：prototype/variants/<name>/{tokens.json,tokens-override.css,layout-overrides.json} */
export const VARIANT_RE = /^prototype\/variants\/[A-Za-z0-9._-]{1,64}\/(tokens\.json|tokens-override\.css|layout-overrides\.json)$/;
export const canWrite = (file) => typeof file === "string" && (WRITE_WHITELIST.has(file) || VARIANT_RE.test(file));

/** 请求体上限，防误用/内存打爆（导出 job 与 JSON 覆盖都远小于此） */
export const MAX_BODY = 8 * 1024 * 1024;
/** 单次导出回传给浏览器的字节上限（超出则只落服务端目录，前端提示改用目录） */
export const MAX_RETURN_BYTES = 48 * 1024 * 1024;

export const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml",
  ".mp4": "video/mp4", ".gif": "image/gif", ".ico": "image/x-icon",
  ".yaml": "text/yaml; charset=utf-8", ".woff2": "font/woff2", ".webm": "video/webm",
};

/** 可选产物缺失时的兜底响应（run 没有该文件时不让前端 404 噪音） */
export const OPTIONAL_DEFAULTS = {
  "/prototype/edit-overrides.json": "{}",
  "/prototype/variants.json": "{}",
  "/prototype/variants-index.json": "{\"variants\":{}}",
  "/prototype/layout-overrides.json": "{}",
  "/prototype/paths.json": "null",
  "/prototype/annotations.json": "{}",
  "/prototype/journeys.json": "[]",
  "/prototype/products.json": "{}",
  "/knowledge/source-map.json": "{}",
};

export const loopback = (req) => ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket.remoteAddress);

/**
 * root 前缀包含校验。必须按分隔符比较：startsWith(root) 会把 /a/run-secret 误判为 /a/run 内。
 * 返回闭包以绑定 root，调用方无需每次传参。
 */
export function makeInsideRoot(root) {
  const r = path.resolve(root);
  // 归一化在策略层兜底：即使调用方忘了 normalize，.. 也不会骗过前缀比较
  return (file) => { const f = path.normalize(String(file)); return f === r || f.startsWith(r + path.sep); };
}

export function readBody(req, limit = MAX_BODY) {
  return new Promise((res, rej) => {
    let d = "", n = 0;
    req.on("data", (c) => {
      n += c.length;
      if (n > limit) { rej(new Error("body too large")); req.destroy(); return; }
      d += c;
    });
    req.on("end", () => res(d));
    req.on("error", rej);
  });
}

export const json = (res, code, obj) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(obj)); };
