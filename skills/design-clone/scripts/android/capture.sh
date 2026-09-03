#!/usr/bin/env bash
# Android 截图助手：处理多屏设备 screencap 警告污染 stdout 的坑。
# 用法: bash capture.sh <输出.png>
# 首次运行缓存 SurfaceFlinger display id 到 /tmp/dc-display-id（换设备后删除该文件）
set -euo pipefail
OUT="${1:?用法: capture.sh <输出.png>}"
CACHE="${DC_DISPLAY_CACHE:-/tmp/dc-display-id}"
if [ ! -s "$CACHE" ]; then
  adb shell dumpsys SurfaceFlinger --display-id 2>/dev/null | grep -oE '[0-9]{10,}' | head -1 > "$CACHE"
fi
DID="$(cat "$CACHE")"
adb shell screencap -p -d "$DID" /sdcard/dc-cap.png
adb pull /sdcard/dc-cap.png "$OUT" >/dev/null 2>&1
adb shell rm /sdcard/dc-cap.png
