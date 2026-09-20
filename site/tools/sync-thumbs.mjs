#!/usr/bin/env node
/**
 * sync-thumbs.mjs（M78-3）——画廊缩略图同源缓存：proto 边缘冷启动慢导致封面/图标空白，
 * CI/本地把每 app 的 cover/icon 拉回 site/data/thumbs/（jpg 压缩），画廊优先同源、proto 作 onerror 兜底。
 * 用法: node sync-thumbs.mjs [--index <url>]
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const sharp = createRequire(import.meta.url)("sharp");
const PAGES = "https://hello-cqq.github.io/design-clone-prototype";
const RAW = "https://raw.githubusercontent.com/hello-cqq/design-clone-prototype/main";
// Pages 快但部署滞后（CI 竞态 404）；raw 即时一致但个别网络慢 → 双源超时回落
const fetchT = async (url, ms = 12000) => { const r = await fetch(url, { signal: AbortSignal.timeout(ms) }); if (!r.ok) throw new Error(r.status); return r; };
const fetchDual = async (rel) => { try { return await fetchT(`${PAGES}/${rel}`); } catch { return await fetchT(`${RAW}/${rel}`, 60000); } };
const idxUrl = process.argv.includes("--index") ? process.argv[process.argv.indexOf("--index") + 1] : null;
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const OUT = path.join(ROOT, "data", "thumbs");
fs.mkdirSync(OUT, { recursive: true });

const crypto = await import("node:crypto");
const idx = idxUrl ? await (await fetchT(idxUrl)).json() : await (await fetchDual("index.json")).json();
const MANIFEST_P = path.join(OUT, "thumbs-index.json");
let prev = {};
try { prev = JSON.parse(fs.readFileSync(MANIFEST_P, "utf8")); } catch {}
const manifest = {};
for (const a of idx.apps || []) {
  manifest[a.app] = {};
  for (const [kind, src] of [
    ["cover", a.cover || `${a.app}/cover.png`],
    ["icon", `${a.app}/icon.png`],
  ]) {
    try {
      const r = await fetchDual(src);
      if (!r.ok) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      const h = crypto.createHash("md5").update(buf).digest("hex").slice(0, 8);
      const dst = kind === "cover" ? `${a.app}-cover.${h}.jpg` : `${a.app}-icon.${h}.png`;
      if (kind === "cover") await sharp(buf).jpeg({ quality: 78 }).resize({ width: 640 }).toFile(path.join(OUT, dst));
      else await sharp(buf).resize({ width: 128, height: 128, fit: "cover" }).png().toFile(path.join(OUT, dst));
      manifest[a.app][kind] = dst;
      console.log("thumb", dst);
    } catch (e) { console.log("skip", a.app, kind, String(e).slice(0, 60)); }
  }
}
for (const [app, kinds] of Object.entries(prev)) {
  manifest[app] = Object.assign({}, kinds, manifest[app] || {});
  for (const [kind, fn] of Object.entries(manifest[app])) if (!fs.existsSync(path.join(OUT, fn))) delete manifest[app][kind];
}
fs.writeFileSync(path.join(OUT, "thumbs-index.json"), JSON.stringify(manifest, null, 1));
console.log("sync-thumbs done (hashed + manifest)");
