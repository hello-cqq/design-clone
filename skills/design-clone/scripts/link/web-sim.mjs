#!/usr/bin/env node
/**
 * 网页模拟取材（登录墙/反下载兜底，抖音主用）：
 * 可见浏览器打开 → 用户登录一次（持久化 profile 后续免登）→ 轮询提取页面数据 → 带 cookie 下载媒体。
 * 用法: node web-sim.mjs <url> --out <目录> [--platform douyin] [--profile <目录>] [--headed] [--wait-login <秒>]
 * 产物: <目录>/note.json + video.mp4 | frames/img-NN.*
 */
import { parseArgs } from "node:util";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";


if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("可见浏览器打开 → 用户登录一次（持久化 profile 后续免登）→ 轮询提取页面数据 → 带 cookie 下载媒体。\n用法: node web-sim.mjs <url> --out <目录> [--platform douyin] [--profile <目录>] [--headed] [--wait-login <秒>]");
  process.exit(0);
}
const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    out: { type: "string" },
    platform: { type: "string", default: "auto" },
    profile: { type: "string", default: "/tmp/dc-browser-profile" },
    headed: { type: "boolean", default: false },
    "wait-login": { type: "string", default: "180" },
    swipe: { type: "boolean", default: false },
    clip: { type: "string" },
    "clip-norm": { type: "string" },
  },
});

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
let url = positionals[0];
const sh2 = (cmd) => { try { return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(); } catch { return ""; } };
// 抖音短链规范化：share/note|video → www.douyin.com/note|video/<id>（iesdouyin 老页 headless 会挂）
if (/v\.douyin\.com/.test(url)) {
  const loc = sh2(`curl -sIL -A "facebookexternalhit/1.1" "${url}" | grep -i '^location:' | tail -1 | sed 's/^[Ll]ocation: //' | tr -d '\\r'`);
  const m = loc.match(/\/(note|video)\/(\d+)/);
  if (m) url = `https://www.douyin.com/${m[1]}/${m[2]}`;
  else if (loc.startsWith("http")) url = loc;
  console.log(`[web-sim] 短链规范化 → ${url}`);
}
if (values.platform === "auto") {
  values.platform = /bilibili|b23\.tv/.test(url) ? "bilibili" : /tiktok/.test(url) ? "tiktok" : /facebook|fb\.com|fb\.watch/.test(url) ? "facebook" : "douyin";
}
const out = path.resolve(values.out || ".");
fs.mkdirSync(path.join(out, "frames"), { recursive: true });
const req = createRequire(import.meta.url);
const { chromium } = req("playwright");

const proxy = sysProxy();
const browser = await chromium.launchPersistentContext(values.profile, {
  headless: !values.headed,
  proxy: proxy ? { server: proxy } : undefined,
  userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  viewport: { width: 1280, height: 900 },
});
const page = browser.pages()[0] || await browser.newPage();

// 抖音：拦截 aweme/detail API 响应拿 play_addr/images（RENDER_DATA 异步为空时的正解）
let captured = null;
page.on("response", async (r) => {
  if (captured || !r.url().includes("/aweme/v1/web/aweme/detail")) return;
  try {
    const j = await r.json();
    const a = j && j.aweme_detail;
    if (!a) return;
    const plays = a.video && a.video.play_addr && a.video.play_addr.url_list ? a.video.play_addr.url_list : [];
    const imgs = Array.isArray(a.images) ? a.images.map((i) => (i.url_list || []).find((u) => u.startsWith("http")) || i.download_url).filter(Boolean) : [];
    if (plays.length || imgs.length) {
      captured = { type: imgs.length ? "images" : "video", desc: a.desc || "", video: plays.find((u) => u.startsWith("http")) || plays[0] || "", images: imgs };
    }
  } catch {}
});

await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});

const collectDyImages = () => page.evaluate(() =>
  [...new Set([...document.querySelectorAll("img")].map((i) => i.src).filter((s) => /aweme-images/.test(s)))]);
const extractDouyin = async () => {
  if (captured) return captured;
  // 图集兜底：翻轮播收集 aweme-images 原图
  const seen = new Set();
  let stale = 0;
  for (let k = 0; k < 30 && stale < 2; k++) {
    (await collectDyImages()).forEach((u) => seen.add(u));
    const before = seen.size;
    let clicked = await page.evaluate(() => {
      const b = document.querySelector("button[class*=playswitch-next]");
      if (b && !String(b.className).includes("disabled")) { b.click(); return true; }
      return false;
    }).catch(() => false);
    if (!clicked && values.swipe) {
      // 拖拽滑动兜底（无箭头按钮的轮播）
      await page.mouse.move(820, 450); await page.mouse.down();
      await page.mouse.move(340, 450, { steps: 12 }); await page.mouse.up();
      clicked = true;
    }
    await page.waitForTimeout(1000);
    (await collectDyImages()).forEach((u) => seen.add(u));
    if (!clicked || seen.size === before) stale++; else stale = 0;
  }
  if (!seen.size) return null;
  return { type: "images", desc: await page.title(), video: "", images: [...seen] };
};

const collectTtImages = () => page.evaluate(() =>
  [...new Set([...document.querySelectorAll("img")].map((i) => i.src).filter((s) => /tiktokcdn|p\d+-sign/.test(s) && !/avatar/.test(s)))]);
const extractTiktok = async () => {
  const vid = await page.evaluate(() => {
    const v = document.querySelector("video[src], video source[src]");
    return v ? v.src : null;
  }).catch(() => null);
  if (vid) return { type: "video", desc: await page.title(), video: vid, audio: null, images: [] };
  const seen = new Set();
  let stale = 0;
  for (let k = 0; k < 20 && stale < 2; k++) {
    (await collectTtImages()).forEach((u) => seen.add(u));
    const before = seen.size;
    if (values.swipe) {
      await page.mouse.move(820, 450); await page.mouse.down();
      await page.mouse.move(340, 450, { steps: 12 }); await page.mouse.up();
    }
    await page.waitForTimeout(1000);
    (await collectTtImages()).forEach((u) => seen.add(u));
    if (seen.size === before) stale++; else stale = 0;
  }
  if (!seen.size) return null;
  return { type: "images", desc: await page.title(), video: "", images: [...seen] };
};

const extractFacebook = () => page.evaluate(() => {
  const og = (p) => document.querySelector(`meta[property="${p}"]`)?.content || "";
  const big = [...document.querySelectorAll("img")].filter((i) => /fbcdn|scontent/.test(i.src) && i.naturalWidth > 300).map((i) => i.src);
  const list = big.length ? big : (og("og:image") ? [og("og:image")] : []);
  const video = og("og:video") || og("og:video:url") || "";
  if (!list.length && !video) return null;
  return { type: video ? "video" : "images", desc: og("og:description") || og("og:title") || document.title, video, images: list };
});

const extractBilibili = () => page.evaluate(() => {
  const pi = window.__playinfo__; const st = window.__INITIAL_STATE__;
  if (!pi || !pi.data || !pi.data.dash) return null;
  const v = pi.data.dash.video && pi.data.dash.video[0];
  const a = pi.data.dash.audio && pi.data.dash.audio[0];
  if (!v) return null;
  return {
    type: "video",
    desc: st && st.videoData ? st.videoData.title : document.title,
    video: v.baseUrl || v.base_url,
    audio: a ? a.baseUrl || a.base_url : null,
    images: [],
  };
});

let note = null;
const deadline = Date.now() + (+values["wait-login"] * 1000);
let asked = false;
while (!note && Date.now() < deadline) {
  note = values.platform === "douyin" ? await extractDouyin().catch(() => null)
       : values.platform === "bilibili" ? await extractBilibili().catch(() => null)
       : values.platform === "tiktok" ? await extractTiktok().catch(() => null)
       : values.platform === "facebook" ? await extractFacebook().catch(() => null) : null;
  if (!note) {
    if (!asked) {
      asked = true;
      console.log(`⏸ 需要登录：请在弹出的浏览器窗口完成扫码/登录；本进程将等待并自动轮询（--wait-login 秒），登录成功后 profile 持久化、之后免登。请勿关闭窗口…`);
      if (!values.headed) console.log("（headless 模式下请改用 --headed 重试）");
    }
    await page.waitForTimeout(3000);
  }
}
// 关键区域截图（只截关键区域而非整页）：--clip x,y,w,h 或 --clip-norm nx,ny,nw,nh
if (values.clip || values["clip-norm"]) {
  let c = values.clip ? values.clip.split(",").map(Number) : values["clip-norm"].split(",").map((v, i) => i < 2 ? v * 1280 : v * 900);
  await page.screenshot({ path: path.join(out, "frames", "web-clip.png"), clip: { x: c[0], y: c[1], width: c[2], height: c[3] } }).catch(() => {});
  console.log("✅ web-clip.png（关键区域）");
}

if (!note) { console.error("❌ 提取失败：登录未完成或页面结构变化"); await browser.close(); process.exit(2); }

const cookies = await browser.cookies();
const cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
await browser.close();

console.log(`[web-sim] ${note.type === "images" ? "图集" : "视频"} · ${note.desc.slice(0, 40)} · 图${note.images.length}`);
const referer = values.platform === "bilibili" ? "https://www.bilibili.com/" : values.platform === "tiktok" ? "https://www.tiktok.com/" : "https://www.douyin.com/";
const dl = (u, dest) => {
  for (let i = 0; i < 3; i++) {
    try {
      execSync(`curl -sL --retry 2 -e "${referer}" -A "Mozilla/5.0" -H "Cookie: ${cookieStr}" -o "${dest}" "${u}"`, { timeout: 240000 });
      if (fs.existsSync(dest) && fs.statSync(dest).size > 1024) return;
    } catch {}
    execSync("sleep 2");
  }
  throw new Error(`下载失败: ${u.slice(0, 60)}`);
};

if (note.type === "video" && note.video) {
  if (note.audio) {
    dl(note.video, path.join(out, "_v.m4s"));
    dl(note.audio, path.join(out, "_a.m4s"));
    execSync(`ffmpeg -y -loglevel error -i "${out}/_v.m4s" -i "${out}/_a.m4s" -c copy "${out}/video.mp4"`);
    fs.rmSync(path.join(out, "_v.m4s")); fs.rmSync(path.join(out, "_a.m4s"));
  } else {
    dl(note.video, path.join(out, "video.mp4"));
  }
  console.log("✅ video.mp4");
} else {
  let i = 0;
  for (const u of note.images) {
    i++;
    try { dl(u, path.join(out, "frames", `img-${String(i).padStart(2, "0")}.jpeg`)); } catch {}
  }
  console.log(`✅ ${i} 张图 → frames/`);
}
fs.writeFileSync(path.join(out, "note.json"), JSON.stringify({ url, platform: values.platform, source: "web-sim", ...note }, null, 2));
