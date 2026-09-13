#!/usr/bin/env node
/**
 * hash-assets.mjs（M76-W7）——CI 部署前给站点子资产加内容哈希名并重写 html 引用。
 * 根因：GitHub Pages 边缘对未哈希子资产 max-age=600，部署后仍吐旧 js → 新旧混搭故障。
 * 未哈希原件保留（供边缘旧 index.html 兼容），新 index 引用哈希名立即生效。
 * 用法: node hash-assets.mjs（仅 CI pages.yml 部署前运行；本地 html 保持未哈希引用）
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const A = path.join(ROOT, "assets");
const TARGETS = ["site.css", "site.js", "ident.js", "demo-anim.js", "zip.min.js"];
const htmls = fs.readdirSync(ROOT).filter((f) => f.endsWith(".html"));
for (const t of TARGETS) {
  const src = path.join(A, t);
  if (!fs.existsSync(src)) continue;
  const h = crypto.createHash("md5").update(fs.readFileSync(src)).digest("hex").slice(0, 8);
  const ext = path.extname(t), base = path.basename(t, ext);
  const hashed = `${base}.${h}${ext}`;
  fs.copyFileSync(src, path.join(A, hashed));
  for (const hf of htmls) {
    const p = path.join(ROOT, hf);
    let s = fs.readFileSync(p, "utf8");
    const re = new RegExp(`assets/${base}\\${ext}(?![.?\\w-])`, "g");
    const s2 = s.replace(re, `assets/${hashed}`);
    if (s2 !== s) fs.writeFileSync(p, s2);
  }
  console.log("hashed", t, "->", hashed);
}
