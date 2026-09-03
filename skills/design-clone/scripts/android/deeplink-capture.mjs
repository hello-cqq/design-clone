#!/usr/bin/env node
/**
 * L5 手机 app 路由：分享链接深链拉起对应 app → GUI 捕获（截图/横滑/长按保存）→ 关键区域裁剪。
 * 用法:
 *   node deeplink-capture.mjs "<url或分享文本>" --out <目录> [--swipes <n>] [--longpress] [--bars top,bottom]
 * 无设备 exit 3（调用方回落 L4 Web GUI）。
 * 长按保存：长按画面中心 → 控件树找"保存/保存图片/Save" → tap → pull /sdcard 最新媒体。
 */
import { parseArgs } from "node:util";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { out: { type: "string" }, swipes: { type: "string", default: "0" }, longpress: { type: "boolean", default: false }, bars: { type: "string", default: "120,90" } },
});
const raw = positionals[0] || "";
const out = path.resolve(values.out || ".");
fs.mkdirSync(path.join(out, "frames"), { recursive: true });

const sh = (cmd, timeout = 60000) => execSync(cmd, { encoding: "utf8", timeout, stdio: ["ignore", "pipe", "pipe"] });
let devices = "";
try { devices = sh("adb devices"); } catch {}
if (!/\tdevice/.test(devices)) { console.log("❌ 无已连接设备 → 回落 L4"); process.exit(3); }

const url = (raw.match(/https?:\/\/[^\s\u4e00-\u9fa5，。；！？、）】]+/) || [raw])[0];
const cap = (dest) => sh(`bash ${__dirname}/capture.sh "${dest}"`);
const dump = () => { sh("adb shell uiautomator dump /sdcard/ui.xml"); return sh("adb shell cat /sdcard/ui.xml"); };

console.log(`[L5] 深链拉起: ${url.slice(0, 60)}`);
try { sh(`adb shell am start -a android.intent.action.VIEW -d "${url}"`); } catch (e) { console.log("❌ 深链失败"); process.exit(1); }
sh("sleep 4");

const n = Math.max(1, +values.swipes + 1);
for (let i = 1; i <= n; i++) {
  const f = path.join(out, "frames", `app-${String(i).padStart(2, "0")}.png`);
  cap(f);
  console.log(`[L5] 第 ${i} 屏 → ${path.basename(f)}`);
  if (i === 1) {
    // 无网/出错检测：app 拉起了但内容不可达（如国内手机开 TikTok）
    try {
      const xml = dump();
      if (/无网络|网络连接|出错|重试|Network|Connection/i.test(xml)) {
        console.log("⚠️ app 提示无网络/出错：手机网络不可达该平台 → 建议回落 L4 或换网络");
      }
    } catch {}
  }
  if (i < n) sh("adb shell input swipe 900 1300 300 1300 300; sleep 1.5");
}

if (values.longpress) {
  console.log("[L5] 长按尝试保存…");
  sh("adb shell input swipe 600 1300 600 1300 900");
  sh("sleep 1.5");
  const xml = dump();
  const m = xml.match(/text="(保存|保存图片|保存图像|Save[^"]*)"([^>]*?)bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
  if (m) {
    const cx = (+m[3] + +m[5]) / 2, cy = (+m[4] + +m[6]) / 2;
    sh(`adb shell input tap ${cx} ${cy}`);
    sh("sleep 2");
    const latest = sh("adb shell ls -t /sdcard/DCIM/Camera /sdcard/Pictures /sdcard/DCIM/Screenshots 2>/dev/null | head -1").trim();
    if (latest) {
      sh(`adb pull "${latest}" "${path.join(out, "frames", "saved-01.png")}"`);
      console.log("✅ 长按保存并回拉:", latest);
    }
  } else console.log("⚠️ 未找到保存按钮（可能无需长按或文案不同）");
}

// 关键区域裁剪（裁掉状态栏/手势条）
const files = fs.readdirSync(path.join(out, "frames")).filter((f) => f.startsWith("app-"));
for (const f of files) {
  const src = path.join(out, "frames", f);
  try { sh(`node ${__dirname}/../link/region-crop.mjs "${src}" "${src.replace(".png", "-crop.png")}" --bars ${values.bars}`); } catch {}
}
console.log("✅ L5 完成");
