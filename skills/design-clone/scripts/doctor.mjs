#!/usr/bin/env node
/**
 * design-clone 环境自检（平台感知）。
 * 用法: node doctor.mjs
 * 退出码: 0=必需项就绪 1=有必需项缺失
 * 安装命令按平台给出，权威清单见 references/install-guide.md
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import net from "node:net";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const platform = process.platform;
// M54：版本+渠道打印（报障定位：快照/正式/开发副本）
try {
  const sk = readFileSync(path.join(__dirname, "..", "SKILL.md"), "utf8");
  const ver = (sk.match(/version:\s*"([^"]+)"/) || [])[1] || "?";
  const channel = ver.includes("snapshot") ? "snapshot" : "stable";
  const managed = existsSync(path.join(__dirname, "..", ".dc-managed")) ? "installer" : (existsSync(path.join(__dirname, "..", "..", "..", ".git")) ? "dev-repo" : "manual");
  console.log(`design-clone v${ver}（渠道 ${channel} · 来源 ${managed}）`);
} catch {}
const rows = [];
const add = (level, name, detail) => rows.push({ level, name, detail });

function sh(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

const INSTALL = {
  adb: { darwin: "brew install android-platform-tools", linux: "apt install adb（或官方 platform-tools zip）", win32: "winget install Google.PlatformTools（WSL2/Git Bash 中用本 skill）" },
  ffmpeg: { darwin: "brew install ffmpeg", linux: "apt install ffmpeg", win32: "winget install Gyan.FFmpeg" },
  scrcpy: { darwin: "brew install scrcpy", linux: "apt install scrcpy", win32: "GitHub Releases 解压" },
  lux: { darwin: "brew install lux", linux: "GitHub Releases 二进制", win32: "GitHub Releases 二进制" },
  "yt-dlp": { darwin: "brew install yt-dlp", linux: "pip install yt-dlp", win32: "winget install yt-dlp" },
  "you-get": { darwin: "pip install you-get", linux: "pip install you-get", win32: "pip install you-get" },
};
const inst = (name) => (INSTALL[name] || {})[platform] || "见 references/install-guide.md";

console.log(`\ndesign-clone doctor（平台: ${platform}/${process.arch}）\n===================\n`);

// ---- 必需项 ----
const nodeV = process.version.replace(/^v/, "");
const [maj, min] = nodeV.split(".").map(Number);
add(maj > 20 || (maj === 20 && min >= 19) ? "ok" : "need", "node", `v${nodeV}（需 ≥ 20.19）${maj < 20 ? ` → ${platform === "darwin" ? "brew install node" : "见 install-guide"}` : ""}`);

const depsOk = existsSync(path.join(__dirname, "node_modules", "playwright")) &&
  existsSync(path.join(__dirname, "node_modules", "sharp"));
add(depsOk ? "ok" : "need", "脚本依赖", depsOk ? "playwright+sharp 已安装" : `运行: cd ${__dirname} && npm install`);

if (depsOk) {
  const req = createRequire(path.join(__dirname, "package.json"));
  try {
    const exe = req("playwright").chromium.executablePath();
    add(existsSync(exe) ? "ok" : "need", "Chromium", existsSync(exe) ? "已安装" : `运行: cd ${__dirname} && npx playwright install chromium${platform === "linux" ? " --with-deps" : ""}`);
  } catch (e) {
    add("need", "Chromium", `检测失败: ${e.message}`);
  }
}

// ---- adb 链路（Android 模式必需）----
const adbPath = sh(platform === "win32" ? "where adb" : "which adb");
if (!adbPath) {
  add("warn", "adb", `未安装 → ${inst("adb")}`);
} else {
  if (platform === "darwin") {
    const q = sh(`xattr ${adbPath.split("\n")[0]} 2>/dev/null | grep -c quarantine`);
    if (q === "1") add("warn", "adb·quarantine", `隔离属性会导致命令挂起 → xattr -d com.apple.quarantine ${adbPath.split("\n")[0]}`);
  }
  const ver = sh("adb version");
  if (!ver) {
    add("warn", "adb", "命令挂起/无输出（mac 多为 quarantine，见上；或 5037 冲突 → adb kill-server）");
  } else {
    const list = sh("adb devices") || "";
    const lines = list.split("\n").slice(1).filter((l) => l.trim());
    if (lines.some((l) => /\tdevice/.test(l))) {
      add("ok", "adb", `已连接: ${lines.find((l) => /\tdevice/.test(l)).split("\t")[0]}`);
      const displays = sh("adb shell dumpsys SurfaceFlinger --display-id 2>/dev/null | grep -c 'Display'") || "1";
      const multi = (sh("adb shell dumpsys display 2>/dev/null | grep -c 'mDisplayId='") || "1");
      if (parseInt(multi, 10) > 1) add("info", "多屏设备", "折叠屏/平板：截图请用 scripts/android/capture.sh（自动处理 display id）");
    } else if (lines.some((l) => /unauthorized/.test(l))) {
      add("warn", "adb·授权", "手机未授权：看手机弹「允许 USB 调试？」勾一律允许；无弹窗则拔插/撤销授权重试（human-takeover §1.2）");
    } else if (lines.some((l) => /offline/.test(l))) {
      add("warn", "adb·offline", "设备 offline：拔插换口；Linux 查 udev 权限（install-guide）；或换无线调试");
    } else {
      add("warn", "adb·无设备", "未连接设备：查数据线/开发者选项/USB 调试/授权弹窗（human-takeover §1.1）");
    }
  }
}

// ---- 端口 ----
await new Promise((resolve) => {
  const s = net.createServer();
  s.once("error", () => { add("warn", "端口4173", "被占用：serve.mjs 会自动尝试 4174+，或 lsof -i :4173 查占用人"); s.close(resolve); });
  s.once("listening", () => { s.close(resolve); });
  s.listen(4173);
});

// ---- 可选能力 ----
for (const [name, cmd, usage] of [
  ["scrcpy", "scrcpy --version", "Android 高质量录屏"],
  ["ffmpeg", "ffmpeg -version", "Link 模式抽帧"],
  ["lux", "lux --version", "抖音/B站下载"],
  ["yt-dlp", "yt-dlp --version", "视频下载兜底"],
  ["you-get", "you-get --version", "快手下载"],
  ["xcrun simctl", "xcrun simctl list devices", "iOS 模拟器"],
]) {
  const v = sh(cmd);
  add(v ? "opt" : "skip", name, v ? v.split("\n")[0].slice(0, 50) : `未安装（${usage}）→ ${inst(name)}`);
}

add(process.env.MIDSCENE_MODEL_API_KEY ? "opt" : "skip", "Midscene 模型",
  process.env.MIDSCENE_MODEL_API_KEY ? "已配置" : "未配置 MIDSCENE_MODEL_*（可选增强）");
add("skip", "Figma MCP", "需宿主配置 https://mcp.figma.com/mcp（免费账号）后可用 Export 模式");
if (platform === "darwin") {
  add(sh("command -v screencapture") ? "opt" : "skip", "screencapture", sh("command -v screencapture") ? "桌面捕获可用（权限跑 desktop/capture.sh check）" : "缺失");
  const cg = sh("python3 -c \"import ctypes,ctypes.util;ctypes.CDLL(ctypes.util.find_library('CoreGraphics'))\" && echo y");
  add(cg ? "ok" : "need", "桌面点击通道", cg ? "CGEvent 真实 HID 可用（capture.sh click/clickv/sweep 默认）" : "CoreGraphics 加载失败 → click 回落 DC_CLICK_ASE=1（System Events，Electron 不可靠）");
  add(sh("osascript -e 'tell application \"System Events\" to return name of first process' >/dev/null 2>&1 && echo y") ? "ok" : "need", "辅助功能", sh("osascript -e 'tell application \"System Events\" to return name of first process' >/dev/null 2>&1 && echo y") ? "System Events 可达" : "系统设置→隐私与安全性→辅助功能 给终端授权");
  add("skip", "mac 权限", "屏幕录制授权：desktop/capture.sh check；Electron app a11y 空属正常，走 CGEvent 不走元素点击（ios-desktop.md）");
}
// 手机捕获前置提示（M37）：亮屏+前台，防错捕
if (sh("command -v adb") && sh("adb devices 2>/dev/null | grep -c '\tdevice'") >= 1) {
  add(sh("adb shell dumpsys power 2>/dev/null | grep -c mWakefulness=Awake") === "1" ? "ok" : "warn", "手机亮屏",
    sh("adb shell dumpsys power 2>/dev/null | grep -c mWakefulness=Awake") === "1" ? "屏幕已亮" : "屏幕灭→dump 会错捕；请解锁亮屏（capture.sh snap 已自动跳过灭屏）");
  add("info", "前台 app", "snap 请传 --pkg <包名> 校验前台（防 tap 打在别的 app，如钉钉）；dump 后用 gen/verify-page.mjs 验页");
}
// s2c 可选加速（opt-in，不假设 key，跨 agent）
const s2cKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY;
let _ps = { image: [], video: [] };
add(s2cKey ? "opt" : "skip", "s2c 加速", s2cKey ? "检测到 provider key→可用 gen/s2c-adapter 加速（可选）" : "无 key→用内置宿主-agent 免费管线（默认）；如需完美复刻自备 key 或起本地 backend:7001");
{
  const { providerSummary, officialSkillPath } = await import("./gen/providers.mjs");
  const ps = providerSummary(); void ps; _ps = ps;
  add(officialSkillPath("image") ? "opt" : "skip", "生图 means", officialSkillPath("image") ? "官方 byted-ark-seedream-skill 在位（agent 履约通道）" : "官方 seedream skill 未装→agent-native/匿名档");
  add(officialSkillPath("video") ? "opt" : "skip", "生视频 means", officialSkillPath("video") ? "官方 byted-ark-seedance-skill 在位（agent 履约通道）" : "官方 seedance skill 未装→agent-native 待办");
  { const pd = (await import("./gen/providers.mjs")).arkPaidKey(); add(pd ? "opt" : "skip", "标准 Ark key 直连档（image+video）", pd ? `在位（${pd.key.slice(0, 8)}…${pd.key.slice(-4)}，来源 ${pd.source}；image/video 均 consent 门控）` : "未配置（~/.config/design-clone/ark.key 或 ARK_API_KEY；生图将回落匿名档）"); }
  {
    const { discoverAgentPlan } = await import("./gen/providers.mjs");
    const srcs = discoverAgentPlan();
    const volc = srcs.find((x) => x.volc);
    add(volc ? "opt" : (srcs.length ? "opt" : "skip"), "VLM 语义通道", volc ? `AgentPlan(${volc.provider})→gen-loop 四维 rubric/语义自检` : (srcs.length ? `agent 配置(${srcs.map((x) => x.agent).join("/")})→vlmChat 可用` : "无 agent 配置→gen-loop 纯启发式自检"));
  }
}
add(sh("command -v chromium || ls ~/.cache/ms-playwright 2>/dev/null | grep -c chromium") !== "" ? "opt" : "skip", "preview chromium", "playwright install chromium 启用自渲染视觉门（audit/qa 无它自动降级）");
add("info", "真视觉资产", "默认用 capture 真头像/图标+文本匿名；首次生成前询问用户授权（R1/隐私，safety-rules §10）");
if (platform === "win32") add("info", "Windows", "bash 脚本请在 WSL2/Git Bash 运行；adb 驱动问题见 install-guide");

const icon = { ok: "✅", need: "❌", warn: "⚠️", opt: "🔧", skip: "⚪", info: "ℹ️" };
for (const r of rows) console.log(`${icon[r.level]} ${r.name.padEnd(16)} ${r.detail}`);

const missing = rows.filter((r) => r.level === "need");
const warnings = rows.filter((r) => r.level === "warn");
console.log("");
if (process.argv.includes("--onboard")) {
  const lvl = (n) => (rows.find((r) => r.name === n) || {}).level;
  const okc = (n) => lvl(n) === "ok";
  const optc = (n) => lvl(n) === "ok" || lvl(n) === "opt";
  const OS_SUPPORT = { mac: "yes", android: "yes", web: "yes", ios: "partial(simctl)", windows: "roadmap", linux: "roadmap", harmony: "roadmap" };
  const cap = {
    platforms: OS_SUPPORT,
    capabilities: {
      web_capture: okc("Chromium"), android_gui: okc("adb"), desktop_gui: platform === "darwin" && okc("桌面点击通道"),
      ios_sim: platform === "darwin" && !!sh("command -v xcrun"), link_ladder: optc("lux") || optc("yt-dlp") || optc("you-get"),
      figma_export: lvl("Figma MCP") === "opt", genimg: true, vlm: true,
      genimg_provider: (_ps.image[0] || "pollinations"), genvideo_provider: (_ps.video[0] || "agent-native"), // genimg=匿名免费档无需 key；vlm=宿主 agent 自带（skill 运行前提）
    },
    entry: "node scripts/entry.mjs \"<一句话|链接|图片|app名>\" → clone/link/remix/export",
    note: "windows/linux/harmony 采集为 roadmap；当前 mac/android/web 全支持",
  };
  const { mkdirSync, writeFileSync } = await import("node:fs");
  mkdirSync(path.join(__dirname, "..", "report"), { recursive: true });
  writeFileSync(path.join(__dirname, "..", "report", "capability.json"), JSON.stringify(cap, null, 1));
  console.log("能力矩阵（report/capability.json）:");
  for (const [k, v] of Object.entries(cap.capabilities)) console.log("  " + k.padEnd(14) + (v ? "✅" : "❌"));
  for (const [k, v] of Object.entries(OS_SUPPORT)) console.log("  os:" + k.padEnd(9) + v);
  console.log("降级：无 playwright→仅 link/图片入口；无 adb→android 转 web/链接或用户供截图；离线→genimg 退化为 crop/iconify/css-clay。");
}
if (missing.length) { console.log(`❌ ${missing.length} 项必需缺失，按提示安装后重试。`); process.exit(1); }
console.log(`✅ 必需项就绪。${warnings.length ? `⚠️ ${warnings.length} 项警告需处理（多为设备侧，话术见 references/human-takeover.md）。` : "无警告。"} ⚪ 可选项用到再装。`);
