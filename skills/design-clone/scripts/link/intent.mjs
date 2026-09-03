#!/usr/bin/env node
/**
 * 链接意图解析 + 六级路由梯编排（link-intent 模块）。
 * 用法:
 *   node intent.mjs "<分享文本或URL>"                      # 只解析，输出 JSON
 *   node intent.mjs "<...>" --out <capture目录> --run      # 解析+跑梯级取材
 *   可选: --allow-headed（允许 L3 弹浏览器让用户登录） --allow-app（允许 L5 拉起手机 app）
 * 梯级: L1 CLI直下 → L2 headless web-sim → L3 headed+登录 → L4 Web GUI(滑动/clip) → L5 手机深链 → 失败回落
 * 全程写 <out>/ladder.json。发现 github/官网 URL 会追加 secondary_sources 供 Web Clone。
 */
import { parseArgs } from "node:util";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("用法:\nnode intent.mjs \"<分享文本或URL>\"                      # 只解析，输出 JSON\nnode intent.mjs \"<...>\" --out <capture目录> --run      # 解析+跑梯级取材\n梯级: L1 CLI直下 → L2 headless web-sim → L3 headed+登录 → L4 Web GUI(滑动/clip) → L5 手机深链 → 失败回落\n全程写 <out>/ladder.json。发现 github/官网 URL 会追加 secondary_sources 供 Web Clone。");
  process.exit(0);
}
const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    out: { type: "string" },
    run: { type: "boolean", default: false },
    "allow-headed": { type: "boolean", default: false },
    "allow-app": { type: "boolean", default: false },
  },
});
const raw = positionals[0] || "";
const out = path.resolve(values.out || ".");
fs.mkdirSync(out, { recursive: true });

/* ---------- adapters 注册表（新增平台只需加一行） ---------- */
const ADAPTERS = [
  { id: "douyin", hosts: ["douyin.com", "iesdouyin.com"], short: ["v.douyin.com"], cli: ["fetch"], web: true, login: true, swipe: true, deep: "snssdk1128://aweme/detail?url={url}" },
  { id: "xiaohongshu", hosts: ["xiaohongshu.com", "xhslink.com", "xhslink.cn"], short: ["xhslink.com", "xhslink.cn"], cli: ["xhs"], web: true, login: true, swipe: true, deep: "xhsdiscover://home?url={url}" },
  { id: "bilibili", hosts: ["bilibili.com", "b23.tv"], short: ["b23.tv"], cli: ["fetch"], web: true, login: false, swipe: false, deep: "bilibili://video/{bv}" },
  { id: "kuaishou", hosts: ["kuaishou.com", "v.kuaishou.com"], short: ["v.kuaishou.com"], cli: ["fetch"], web: true, login: true, swipe: true },
  { id: "weibo", hosts: ["weibo.com", "m.weibo.cn"], short: [], cli: ["fetch"], web: true, login: false, swipe: false },
  { id: "youtube", hosts: ["youtube.com", "youtu.be"], short: ["youtu.be"], cli: [], web: true, login: false, swipe: false, region: "player" },
  { id: "tiktok", hosts: ["tiktok.com", "vm.tiktok.com", "vt.tiktok.com"], short: ["vm.tiktok.com", "vt.tiktok.com"], cli: [], web: true, login: false, swipe: true },
  { id: "facebook", hosts: ["facebook.com", "fb.com", "fb.watch"], short: [], cli: [], web: true, login: true, swipe: false, region: "content", proxy: true },
  { id: "web", hosts: [], short: [], cli: [], web: true, login: false, swipe: false },
];

/* ---------- ① 文本挖掘：抽 URL + 保留上下文 ---------- */
const urlMatch = raw.match(/https?:\/\/[^\s\u4e00-\u9fa5，。；！？、）】]+/);
const url = urlMatch ? urlMatch[0].replace(/[.,;!?]+$/, "") : raw.trim();
const context = raw.replace(url, "").trim();

/* ---------- ② 平台识别 ---------- */
let host = "";
try { host = new URL(url).hostname.replace(/^www\./, "").replace(/^m\./, ""); } catch {}
const adapter =
  ADAPTERS.find((a) => a.short.some((h) => host === h || host.endsWith("." + h))) ||
  ADAPTERS.find((a) => a.hosts.some((h) => host === h || host.endsWith(h))) ||
  ADAPTERS[ADAPTERS.length - 1];

/* ---------- ③ 意图初判（VLM 分析阶段可修正） ---------- */
const STYLE_WORDS = /风景|摄影|插画|审美|穿搭|氛围|配色|海报|壁纸|艺术/;
const UI_WORDS = /app|界面|ui|ux|原型|设计|交互|功能|开源|工具/;
const projUrls = [...raw.matchAll(/https?:\/\/(github\.com|gitlab\.com|gitee\.com)[^\s]+/gi)].map((m) => m[0]);
let intent = "mixed";
if (projUrls.length) intent = "project_ref";
else if (STYLE_WORDS.test(context) && !UI_WORDS.test(context)) intent = "style_only";
else if (UI_WORDS.test(context)) intent = "product_ui";

const analysis = { url, platform: adapter.id, context, intent, secondary_sources: projUrls, adapter_flags: { login: adapter.login, swipe: adapter.swipe, region: adapter.region || null } };
console.log(JSON.stringify(analysis, null, 2));
if (!values.run) {
  fs.writeFileSync(path.join(out, "ladder.json"), JSON.stringify({ ...analysis, ladder: [], final_ok: null, note: "analysis only（未带 --run）" }, null, 2));
  process.exit(0);
}

/* ---------- ④ 六级路由梯 ---------- */
const here = (f) => path.join(__dirname, f);
const run = (cmd, timeout = 420000) => { try { execSync(cmd, { encoding: "utf8", timeout, stdio: ["ignore", "pipe", "pipe"] }); return true; } catch { return false; } };
const hasDevice = () => { try { return /\tdevice/.test(execSync("adb devices", { encoding: "utf8" })); } catch { return false; } };
const MEDIA = /\.(mp4|webm|mkv|mov|m4v)$/i;
const IMG = /\.(png|jpe?g|webp)$/i;
const success = () => {
  const f = fs.readdirSync(out);
  const frames = fs.existsSync(path.join(out, "frames")) ? fs.readdirSync(path.join(out, "frames")).filter((x) => IMG.test(x)) : [];
  return f.some((x) => MEDIA.test(x)) || f.some((x) => IMG.test(x)) || frames.length > 0;
};
const ladder = [];
const step = (level, name, ok, note = "") => { ladder.push({ level, name, ok, note, at: new Date().toISOString() }); console.log(`${ok ? "✅" : "⛔"} ${level} ${name}${note ? " · " + note : ""}`); };

const localFile = (() => {
  try {
    const p = path.resolve(raw.trim().replace(/^["']|["']$/g, ""));
    if (fs.existsSync(p) && fs.statSync(p).isFile() && (MEDIA.test(p) || IMG.test(p))) return p;
  } catch {}
  return null;
})();
if (localFile) {
  fs.copyFileSync(localFile, path.join(out, path.basename(localFile)));
  step("L0", "本地素材直拷", true, path.basename(localFile));
} else if (success()) step("L0", "已有素材", true);
else if (adapter.cli.length && run(`node ${here("fetch.mjs")} "${url}" --out "${out}"`)) step("L1", "CLI 级联下载", true);
else if (adapter.id === "xiaohongshu" && run(`node ${here("xhs.mjs")} "${url}" --out "${out}"`)) step("L1", "xhs.mjs 匿名提取", true);
else if (adapter.id === "youtube" && run(`yt-dlp -o "${out}/%(title)s.%(ext)s" "${url}"`)) step("L1", "yt-dlp", true);
else if (adapter.id === "tiktok" && run(`yt-dlp -o "${out}/%(title)s.%(ext)s" "${url}"`)) step("L1", "yt-dlp(tiktok)", true);
else {
  step("L1", "CLI 直下", false, "失败或不适用");
  if (adapter.web && run(`node ${here("web-sim.mjs")} "${url}" --out "${out}" --platform ${adapter.id === "xiaohongshu" ? "douyin" : adapter.id} --wait-login 20`, 180000)) step("L2", "headless web-sim", true);
  else {
    step("L2", "headless web-sim", false);
    if (values["allow-headed"] && adapter.web && run(`node ${here("web-sim.mjs")} "${url}" --out "${out}" --headed --wait-login 240`, 420000)) step("L3", "headed+用户登录", true);
    else {
      step("L3", "headed+登录", false, values["allow-headed"] ? "失败" : "未启用 --allow-headed");
      if (values["allow-app"] && adapter.deep && hasDevice() && run(`node ${here("../android/deeplink-capture.mjs")} "${url}" --out "${out}"`, 420000)) step("L5", "手机深链 GUI", true);
      else step("L5", "手机深链", false, !values["allow-app"] ? "未启用 --allow-app" : !hasDevice() ? "无设备→应回落 L4" : "失败");
      if (!success() && adapter.web) {
        step("L4", "Web GUI-agent(滑动/clip)", run(`node ${here("web-sim.mjs")} "${url}" --out "${out}" --headed --swipe --clip --wait-login 240`, 420000));
      }
    }
  }
}

// 成功后补页面解析（标题/描述/置顶评论/项目 URL），best-effort
if (success()) run(`node ${here("meta.mjs")} "${url}" --out "${out}"`, 120000);

const metaPath = path.join(out, "meta.json");
let secondary = [...projUrls];
if (fs.existsSync(metaPath)) {
  try { secondary = [...new Set([...secondary, ...JSON.parse(fs.readFileSync(metaPath, "utf8")).urls_found])]; } catch {}
}

fs.writeFileSync(path.join(out, "ladder.json"), JSON.stringify({ ...analysis, secondary_sources: secondary, ladder, final_ok: success() }, null, 2));
if (secondary.length) console.log("🔗 二级源（建议追加 Web Clone）:", secondary.slice(0, 3).join(" | "));
console.log(success() ? "✅ 取材成功" : "❌ 全梯失败，见 ladder.json");
process.exit(success() ? 0 : 2);
