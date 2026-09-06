/**
 * 静态文件服务（M45 抽出）。含路径包含校验与可选产物兜底。
 */
import fs from "node:fs";
import path from "node:path";
import { MIME, OPTIONAL_DEFAULTS, makeInsideRoot } from "./policy.mjs";

export function makeStaticHandler(root) {
  const insideRoot = makeInsideRoot(root);
  return function serveStatic(req, res, u) {
    let p;
    try { p = decodeURIComponent(u.pathname); } catch { res.writeHead(400); return res.end("bad url"); }
    if (p.endsWith("/")) p += "index.html";
    const file = path.normalize(path.join(root, p));
    if (!insideRoot(file) || !fs.existsSync(file)) {
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
  };
}
