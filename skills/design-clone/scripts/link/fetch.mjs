#!/usr/bin/env node
/**
 * 链接级联下载：短链解析 → 平台识别 → lux → yt-dlp → you-get 依次降级。
 * 用法: node fetch.mjs <url> --out <目录> [--cookies <文件>]
 * 退出码: 0 成功 · 2 全部工具失败（调用方转网页模拟方案）
 * 输出: <目录>/fetch.json {platform, tool, files, title}
 */
import { parseArgs } from "node:util";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";


if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("用法: node fetch.mjs <url> --out <目录> [--cookies <文件>]");
  process.exit(0);
}
const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { out: { type: "string" }, cookies: { type: "string" } },
});
let url = positionals[0];
const out = path.resolve(values.out || ".");
fs.mkdirSync(out, { recursive: true });

function sh(cmd, timeout = 180000) {
  try { return execSync(cmd, { encoding: "utf8", timeout, stdio: ["ignore", "pipe", "pipe"] }); }
  catch { return null; }
}

// 短链解析（保留全部参数，xhs 的 xsec_token 不能丢）
const SHORT_HOSTS = ["v.douyin.com", "xhslink.com", "xhslink.cn", "b23.tv", "vm.tiktok.com", "vt.tiktok.com", "v.kuaishou.com"];
try {
  const u = new URL(url);
  if (SHORT_HOSTS.includes(u.hostname)) {
    const loc = sh(`curl -sIL -A "facebookexternalhit/1.1" "${url}" | grep -i '^location:' | tail -1 | sed 's/^[Ll]ocation: //' | tr -d '\\r'`).trim();
    if (loc) {
      const TARGET_ORIGIN = { "b23.tv": "https://www.bilibili.com", "v.douyin.com": "https://www.douyin.com", "xhslink.com": "https://www.xiaohongshu.com", "xhslink.cn": "https://www.xiaohongshu.com" };
      const full = loc.startsWith("http") ? loc : (TARGET_ORIGIN[u.hostname] || u.origin) + loc;
      console.log(`[fetch] 短链解析 → ${full.slice(0, 80)}…`);
      url = full;
    }
  }
} catch {}

const host = new URL(url).hostname;
const platform =
  host.includes("douyin") ? "douyin" :
  host.includes("xiaohongshu") || host.includes("xhslink") ? "xiaohongshu" :
  host.includes("bilibili") || host.includes("b23.tv") ? "bilibili" :
  host.includes("kuaishou") ? "kuaishou" :
  host.includes("weibo") ? "weibo" :
  host.includes("tiktok") ? "tiktok" : "other";
console.log(`[fetch] 平台: ${platform}`);

const cookieArg = values.cookies ? ` -c "${values.cookies}"` : "";
const before = () => new Set(fs.readdirSync(out));
const newFiles = (prev) => fs.readdirSync(out).filter((f) => !prev.has(f) && !f.endsWith(".json"));

const attempts = [];
if (platform !== "kuaishou") attempts.push(["lux", `lux -o "${out}"${cookieArg} "${url}"`]);
attempts.push(["yt-dlp", `yt-dlp -o "${out}/%(title)s.%(ext)s"${values.cookies ? ` --cookies "${values.cookies}"` : ""} "${url}"`]);
if (platform === "kuaishou") attempts.push(["you-get", `you-get -o "${out}" "${url}"`]);

let tool = null;
let files = [];
for (const [name, cmd] of attempts) {
  console.log(`[fetch] 尝试 ${name}...`);
  const prev = before();
  const r = sh(cmd);
  const got = newFiles(prev);
  if (r !== null && got.length) { tool = name; files = got; break; }
}

if (!tool) {
  console.log("[fetch] ⚠️ 所有下载工具失败 → 转网页模拟方案（references/link-mode.md）");
  fs.writeFileSync(path.join(out, "fetch.json"), JSON.stringify({ platform, tool: null, url }, null, 2));
  process.exit(2);
}

const title = (files[0] || "").replace(/\.[^.]+$/, "");
fs.writeFileSync(path.join(out, "fetch.json"), JSON.stringify({ platform, tool, url, files, title }, null, 2));
console.log(`✅ ${tool} 下载完成: ${files.join(", ")}`);
