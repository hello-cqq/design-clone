#!/usr/bin/env node
/**
 * 应用元数据采集（M28）：品牌锚点（标签/版本/主题色/OG/DESIGN.md）。
 * 用法: node meta.mjs <platform> <id>   platform: android|web|desktop
 *  android <pkg>  → adb dumpsys package（label/version）
 *  web <url>      → 页内 OG/title/theme-color
 *  desktop <app>  → Info.plist（CFBundleName/ShortVersionString）
 */
import { execSync } from "node:child_process";
const [plat, id] = process.argv.slice(2);
if (!plat || ["--help", "-h"].includes(plat)) { console.log("用法: node meta.mjs <android|web|desktop> <pkg|url|app>"); process.exit(id ? 0 : 1); }
const out = { platform: plat, id };
try {
  if (plat === "android") {
    const d = execSync(`adb shell dumpsys package ${id} | head -40`, { encoding: "utf8" });
    out.version = (d.match(/versionName=([\w.]+)/) || [])[1];
    out.label = (d.match(/application-label='?([^'\n]+)'?/) || [])[1];
  } else if (plat === "desktop") {
    const p = execSync(`osascript -e 'tell application "System Events" to tell application process "${id}" to get short name of first application process' 2>/dev/null || true`, { encoding: "utf8" });
    const plist = execSync(`defaults read "/Applications/${id}.app/Contents/Info" CFBundleName 2>/dev/null || echo ${id}`, { encoding: "utf8" });
    out.label = plist.trim();
    out.version = execSync(`defaults read "/Applications/${id}.app/Contents/Info" CFBundleShortVersionString 2>/dev/null || echo ""`, { encoding: "utf8" }).trim();
  } else {
    out.note = "web OG 由 capture.mjs --probe 提取";
  }
} catch (e) { out.error = String(e.message).slice(0, 120); }
console.log(JSON.stringify(out));
