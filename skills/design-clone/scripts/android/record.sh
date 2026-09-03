#!/usr/bin/env bash
# Android 循环录屏：绕过 screenrecord 单次 180s 限制，每 160s 切一段回拉。
# 用法: bash record.sh <videos输出目录>   （Ctrl+C 停止）
# 注意：screenrecord 在设备端运行，输出路径必须是 /sdcard/...，录完 adb pull 回本地。
# 若已安装 scrcpy，优先用: scrcpy --no-window --no-playback --record <目录>/main.mp4
set -euo pipefail

OUT="${1:?用法: record.sh <videos输出目录>}"
mkdir -p "$OUT"

command -v adb >/dev/null || { echo "❌ 需要 adb"; exit 1; }
adb devices | grep -q 'device$' || { echo "❌ 未检测到已连接的 Android 设备"; exit 1; }

if command -v scrcpy >/dev/null; then
  echo "[record] 使用 scrcpy 录制（支持音频、无时长限制），Ctrl+C 结束"
  exec scrcpy --no-window --no-playback --record "$OUT/main.mp4"
fi

echo "[record] 使用 screenrecord 循环录制（每段160s，无音频），Ctrl+C 结束"
cleanup() {
  adb shell pkill -f "screenrecord" 2>/dev/null || true
  echo; echo "[record] 已停止，共 $((seq-1)) 段 → $OUT"
  exit 0
}
trap cleanup INT TERM

seq=1
fails=0
while true; do
  DEV="/sdcard/dc-rec-$(printf '%02d' "$seq").mp4"
  LOC="$OUT/record-$(printf '%02d' "$seq").mp4"
  echo "[record] 第 $seq 段 → $LOC"
  if adb shell screenrecord --time-limit 160 "$DEV"; then
    adb pull "$DEV" "$LOC" >/dev/null 2>&1 && rm -f "$LOC.failed" || true
    adb shell rm -f "$DEV"
    [ -s "$LOC" ] && fails=0 || fails=$((fails+1))
    seq=$((seq+1))
  else
    fails=$((fails+1))
  fi
  if [ "$fails" -ge 3 ]; then
    echo "❌ 连续失败 3 次，停止录屏（设备可能不支持 screenrecord）"
    exit 1
  fi
done
