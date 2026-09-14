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
const idxUrl = process.argv.includes("--index") ? process.argv[process.argv.indexOf("--index") + 1] : "https://hello-cqq.github.io/design-clone-prototype/index.json";
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const OUT = path.join(ROOT, "data", "thumbs");
fs.mkdirSync(OUT, { recursive: true });
const PROTO = "https://hello-cqq.github.io/design-clone-prototype";
const idx = await (await fetch(idxUrl)).json();
for (const a of idx.apps || []) {
  for (const [kind, src, dst] of [
    ["cover", a.cover ? `${PROTO}/${a.cover}` : `${PROTO}/${a.app}/cover.png`, `${a.app}-cover.jpg`],
    ["icon", `${PROTO}/${a.app}/icon.png`, `${a.app}-icon.png`],
  ]) {
    try {
      const r = await fetch(src);
      if (!r.ok) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      if (kind === "cover") await sharp(buf).jpeg({ quality: 78 }).resize({ width: 640 }).toFile(path.join(OUT, dst));
      else await sharp(buf).resize({ width: 128, height: 128, fit: "cover" }).png().toFile(path.join(OUT, dst));
      console.log("thumb", dst);
    } catch (e) { console.log("skip", dst, String(e).slice(0, 60)); }
  }
}
console.log("sync-thumbs done");
