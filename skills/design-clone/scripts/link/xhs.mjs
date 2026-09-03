#!/usr/bin/env node
/**
 * 小红书取材：短链解析 → 网页提取 __INITIAL_STATE__ → 图文原图/视频下载。
 * 用法: node xhs.mjs <url> --out <目录> [--headed] [--wait-login <秒,默认90>]
 * 产物: <目录>/note.json + <目录>/frames/img-NN.* 或 <目录>/video.mp4
 * 登录墙：--headed 打开可见浏览器，提示用户扫码/登录，轮询直到数据可读。
 */
import { parseArgs } from "node:util";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";


if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("小红书取材：短链解析 → 网页提取 __INITIAL_STATE__ → 图文原图/视频下载。\n用法: node xhs.mjs <url> --out <目录> [--headed] [--wait-login <秒,默认90>]\n登录墙：--headed 打开可见浏览器，提示用户扫码/登录，轮询直到数据可读。");
  process.exit(0);
}
const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { out: { type: "string" }, headed: { type: "boolean", default: false }, "wait-login": { type: "string", default: "90" } },
});
let url = positionals[0];
const out = path.resolve(values.out || ".");
fs.mkdirSync(path.join(out, "frames"), { recursive: true });
const req = createRequire(import.meta.url);
const { chromium } = req("playwright");

function sh(cmd) { try { return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(); } catch { return null; } }

if (url.includes("xhslink.com") || url.includes("xhslink.cn")) {
  const loc = sh(`curl -sIL -A "facebookexternalhit/1.1" "${url}" | grep -i '^location:' | tail -1 | sed 's/^[Ll]ocation: //' | tr -d '\\r'`);
  if (loc && loc.startsWith("http")) { console.log(`[xhs] 短链解析 → ${loc.trim()}`); url = loc.trim(); }
}
const noteId = (url.match(/explore\/([a-f0-9]+)|discovery\/item\/([a-f0-9]+)|\/([a-f0-9]{24})/i) || []).filter(Boolean)[1] || "";

const browser = await chromium.launch({ headless: !values.headed });
const ctx = await browser.newContext({
  userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  viewport: { width: 1280, height: 900 },
});
const page = await ctx.newPage();
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 }).catch(() => {});

const readNote = () => page.evaluate((id) => {
  const s = window.__INITIAL_STATE__;
  if (!s || !s.note) return null;
  const map = s.note.noteDetailMap || {};
  const n = map[id] ? map[id].note : Object.values(map)[0]?.note;
  if (!n) return null;
  return {
    type: n.type, title: n.title || "", desc: n.desc || "",
    author: n.user ? (n.user.nickname || "") : "",
    tags: (n.tagList || []).map((t) => t.name),
    images: (n.imageList || []).map((i) => i.urlDefault || i.urlPre).filter(Boolean),
    video: n.video && n.video.media ? (n.video.media.stream?.h264?.[0]?.masterUrl || n.video.consumer?.originVideoKey || "") : "",
  };
}, noteId);

let note = await readNote();
if (!note && values.headed) {
  console.log("⏸ 可能需要登录：请在打开的浏览器里登录小红书，登录后自动继续…");
  const deadline = Date.now() + (+values["wait-login"] * 1000);
  while (!note && Date.now() < deadline) { await page.waitForTimeout(3000); note = await readNote(); }
}
if (!note) { console.error("❌ 读不到笔记数据（登录墙/风控）。用 --headed 人工登录后重试。"); await browser.close(); process.exit(2); }
await browser.close();

console.log(`[xhs] ${note.type === "video" ? "视频" : "图文"} · ${note.title || note.desc.slice(0, 30)} · 图${note.images.length}`);

const dl = (u, dest) => execSync(`curl -s -e "https://www.xiaohongshu.com/" -A "Mozilla/5.0" -o "${dest}" "${u}"`);

if (note.type === "video" && note.video) {
  const vurl = note.video.startsWith("http") ? note.video : `https://sns-video-bd.xhscdn.com/${note.video}`;
  dl(vurl, path.join(out, "video.mp4"));
  console.log("✅ video.mp4");
} else {
  let i = 0;
  for (const u of note.images) {
    i++;
    const ext = u.includes(".png") ? "png" : "jpg";
    try { dl(u, path.join(out, "frames", `img-${String(i).padStart(2, "0")}.${ext}`)); } catch {}
  }
  console.log(`✅ ${i} 张原图 → frames/`);
}
fs.writeFileSync(path.join(out, "note.json"), JSON.stringify({ url, ...note }, null, 2));
