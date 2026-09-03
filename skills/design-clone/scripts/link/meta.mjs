#!/usr/bin/env node
/**
 * 页面解析：title/desc/author/置顶(热门)评论/评论与描述中的项目 URL。
 * 用法: node meta.mjs <url> --out <目录>
 * 产物: <目录>/meta.json —— urls_found 命中 github/官网时，调用方应追加为二级源走 Web Clone。
 * 走系统代理（自动感知）+ 持久化 profile（免重复登录）。
 */
import { parseArgs } from "node:util";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";


if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("页面解析：title/desc/author/置顶(热门)评论/评论与描述中的项目 URL。\n用法: node meta.mjs <url> --out <目录>");
  process.exit(0);
}
const { positionals, values } = parseArgs({ allowPositionals: true, options: { out: { type: "string" }, profile: { type: "string", default: "/tmp/dc-browser-profile" } } });
const url = positionals[0];
const out = path.resolve(values.out || ".");
fs.mkdirSync(out, { recursive: true });
const req = createRequire(import.meta.url);
const { chromium } = req("playwright");

function sysProxy() {
  if (process.env.HTTPS_PROXY) return process.env.HTTPS_PROXY;
  if (process.platform !== "darwin") return null;
  for (const s of ["Wi-Fi", "Ethernet"]) {
    for (const c of [`networksetup -getsecurewebproxy "${s}"`, `networksetup -getwebproxy "${s}"`]) {
      try {
        const t = execSync(c, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
        if (/Enabled:\s*Yes/i.test(t)) {
          const sv = (t.match(/Server:\s*(\S+)/) || [])[1], po = (t.match(/Port:\s*(\d+)/) || [])[1];
          if (sv && po) return `http://${sv}:${po}`;
        }
      } catch {}
    }
  }
  return null;
}

const COMMENT_SEL = '[data-e2e="comment-content"], [data-e2e="comment-text"], [data-testid*="comment_comment"], .reply-item .root-content-text, #content-text, [class*="commentItem"] [class*="content"], .comment-item .content';

const browser = await chromium.launchPersistentContext(values.profile, {
  headless: true,
  proxy: sysProxy() ? { server: sysProxy() } : undefined,
  userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  viewport: { width: 1280, height: 900 },
});
const page = browser.pages()[0] || (await browser.newPage());
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 }).catch(() => {});
await page.waitForTimeout(6000);

const meta = await page.evaluate((sel) => {
  const q = (s) => document.querySelector(s);
  const og = (p) => q(`meta[property="${p}"]`)?.content || q(`meta[name="${p}"]`)?.content || "";
  const comments = [...document.querySelectorAll(sel)].map((n) => n.innerText.trim()).filter((t) => t && t.length > 2).slice(0, 8);
  return {
    title: og("og:title") || document.title,
    desc: og("og:description") || og("description"),
    author: og("og:article:author") || (q('[data-e2e="comment-nick-name"], .author-name, [class*="AuthorName"]')?.innerText || ""),
    comments,
  };
}, COMMENT_SEL);
await browser.close();

const haystack = `${meta.title}\n${meta.desc}\n${meta.comments.join("\n")}`;
const urls_found = [...new Set([...haystack.matchAll(/https?:\/\/[^\s"'<>）】]+/g)].map((m) => m[0]))
  ].filter((u) => /github\.com|gitlab\.com|gitee\.com|vercel\.app|netlify\.app|\.dev\b|\.io\b/i.test(u) || !/youtube|tiktok|facebook|douyin|bilibili|xiaohongshu/.test(u));

const result = { url, ...meta, urls_found, extracted_at: new Date().toISOString() };
fs.writeFileSync(path.join(out, "meta.json"), JSON.stringify(result, null, 2));
console.log(`✅ meta.json · 评论${meta.comments.length} · URL${urls_found.length}`);
if (urls_found.length) console.log("   二级源候选:", urls_found.slice(0, 3).join(" | "));
