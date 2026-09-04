#!/usr/bin/env bash
# Android 截图助手：处理多屏设备 screencap 警告污染 stdout 的坑。
# 用法: bash capture.sh <输出.png>
# 首次运行缓存 SurfaceFlinger display id 到 /tmp/dc-display-id（换设备后删除该文件）
set -euo pipefail
# M23: snap 模式 = settle+shot+uiautomator dump 绑定（防丢控件树，LESSONS 101）
if [ "${1:-}" = "snap" ]; then
  HERE="$(cd "$(dirname "$0")" && pwd)"; ID="${2:?id}"; RUND="${3:?runDir}"
  mkdir -p "$RUND/capture/screens" "$RUND/capture/ui-tree"
  node "$HERE/settle.mjs" "$RUND/capture/screens/$ID.png" 3 1.2
  adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1 && adb pull /sdcard/ui.xml "$RUND/capture/ui-tree/$ID.xml" >/dev/null 2>&1 || true
  echo "✅ snap $ID"
  exit 0
fi
OUT="${1:?用法: capture.sh <输出.png> | capture.sh snap <id> <runDir>}"
CACHE="${DC_DISPLAY_CACHE:-/tmp/dc-display-id}"
if [ ! -s "$CACHE" ]; then
  adb shell dumpsys SurfaceFlinger --display-id 2>/dev/null | grep -oE '[0-9]{10,}' | head -1 > "$CACHE"
fi
DID="$(cat "$CACHE")"
adb shell screencap -p -d "$DID" /sdcard/dc-cap.png
adb pull /sdcard/dc-cap.png "$OUT" >/dev/null 2>&1
adb shell rm /sdcard/dc-cap.png
