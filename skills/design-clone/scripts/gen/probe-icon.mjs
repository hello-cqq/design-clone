#!/usr/bin/env node
/**
 * probe-icon.mjs —— 官方/系统图标探测（M75-W4）：从给定官网抓取候选图标供人工/VLM 选型。
 * 用法: node probe-icon.mjs --url <官网> --out <dir> [--min 128]
 * 产出: <dir>/cand-<n>.<ext> + candidates.json（src/size/type）
 * 纪律: 仅用于 study-replica 自律场景（meta.ip_attestation + brand_disclaimer 硬门不变）；
 *       商标归原主，画廊展示=学习研究用途并附免责声明。见 references/asset-sourcing.md。
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

// M79-W1: 官方图标策展 URL 表（优先于抓取候选；视觉核验过）
const OFFICIAL_ICON_URLS = {
  aliyun: "https://img.alicdn.com/imgextra/i1/O1CN012QgtoH1c1Mu70xD3w_!!6000000003540-2-tps-640-640.png",
  lark: "https://p1-hera.feishucdn.com/tos-cn-i-jbbdkfciu3/84a9f036fe2b44f99b899fff4beeb963~tplv-jbbdkfciu3-image:100:100.image",
  feishu: "https://p1-hera.feishucdn.com/tos-cn-i-jbbdkfciu3/84a9f036fe2b44f99b899fff4beeb963~tplv-jbbdkfciu3-image:100:100.image",
};
const { values: V } = parseArgs({ options: { url: { type: "string" }, out: { type: "string" }, min: { type: "string", default: "128" } } });
if (!V.url || !V.out) { console.log("用法: node probe-icon.mjs --url <官网> --out <dir> [--min 128]"); process.exit(1); }
fs.mkdirSync(V.out, { recursive: true });
for (const [k, u] of Object.entries(OFFICIAL_ICON_URLS)) {
  if (!(V.url || "").includes(k)) continue;
  try {
    const r = await fetch(u, { headers: { "user-agent": "Mozilla/5.0 (design-clone probe)" } });
    if (r.ok) {
      const buf = Buffer.from(await r.arrayBuffer());
      const ext = u.includes(".ico") ? "ico" : "png";
      fs.writeFileSync(path.join(V.out, `cand-official-${k}.${ext}`), buf);
      console.log("official cand:", k, u.slice(0, 60));
    }
  } catch {}
}
const base = new URL(V.url);
const html = await (await fetch(base, { headers: { "user-agent": "Mozilla/5.0 (design-clone probe)" }, redirect: "follow" })).text();
const cands = [];
for (const m of html.matchAll(/<link[^>]+>/gi)) {
  const tag = m[0];
  const rel = (tag.match(/rel=["']([^"']+)["']/i) || [])[1] || "";
  if (!/icon|apple-touch/i.test(rel)) continue;
  const href = (tag.match(/href=["']([^"']+)["']/i) || [])[1];
  const sizes = (tag.match(/sizes=["']([^"']+)["']/i) || [])[1] || "";
  if (href) cands.push({ src: new URL(href, base).href, sizes, kind: rel });
}
const man = (html.match(/<link[^>]+rel=["']manifest["'][^>]*>/i) || [""])[0].match(/href=["']([^"']+)["']/i);
if (man) {
  try {
    const mj = await (await fetch(new URL(man[1], base))).json();
    for (const ic of mj.icons || []) cands.push({ src: new URL(ic.src, base).href, sizes: ic.sizes || "", kind: "manifest" });
  } catch {}
}
const og = (html.match(/<meta[^>]+property=["']og:image["'][^>]*>/i) || [""])[0].match(/content=["']([^"']+)["']/i);
if (og) cands.push({ src: new URL(og[1], base).href, sizes: "", kind: "og" });
const out = [];
let n = 0;
for (const c of cands) {
  try {
    const r = await fetch(c.src, { headers: { "user-agent": "Mozilla/5.0 (design-clone probe)" } });
    if (!r.ok) continue;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 200 || buf.length > 2_000_000) continue;
    const ext = (c.src.match(/\.(png|svg|jpe?g|webp|ico)/i) || [, "png"])[1].replace("jpeg", "jpg");
    const f = `cand-${++n}.${ext}`;
    fs.writeFileSync(path.join(V.out, f), buf);
    out.push({ file: f, src: c.src, sizes: c.sizes, kind: c.kind, bytes: buf.length });
  } catch {}
}
fs.writeFileSync(path.join(V.out, "candidates.json"), JSON.stringify({ url: V.url, at: new Date().toISOString(), cands: out }, null, 2));
console.log(JSON.stringify({ url: V.url, saved: out.length, cands: out.slice(0, 8) }));
