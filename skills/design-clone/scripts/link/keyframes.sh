#!/usr/bin/env bash
# 视频抽帧：场景切换帧 + 1fps 采样，输出 <输出目录>/kf-NNN-<时间戳>.png
# 用法: bash keyframes.sh <视频文件> <输出目录> [场景阈值，默认0.4]
set -euo pipefail

VIDEO="${1:?用法: keyframes.sh <视频文件> <输出目录> [阈值]}"
OUT="${2:?缺少输出目录}"
TH="${3:-0.4}"

command -v ffmpeg >/dev/null || { echo "❌ 需要 ffmpeg: brew install ffmpeg"; exit 1; }
mkdir -p "$OUT"

TMP="$OUT/.tmp"
mkdir -p "$TMP"

echo "[keyframes] 场景切换抽帧（阈值 ${TH}）..."
ffmpeg -hide_banner -loglevel error -i "$VIDEO" \
  -vf "select='gt(scene,${TH})',showinfo" -fps_mode vfr \
  "$TMP/scene_%04d.png" 2>&1 | grep -o 'pts_time:[0-9.]*' | sed 's/pts_time://' > "$TMP/scene_times.txt" || true

echo "[keyframes] 1fps 定时采样..."
ffmpeg -hide_banner -loglevel error -i "$VIDEO" -vf fps=1 "$TMP/sample_%04d.png"

i=0
for f in $(ls "$TMP"/scene_*.png "$TMP"/sample_*.png 2>/dev/null | sort); do
  i=$((i+1))
  mv "$f" "$OUT/kf-$(printf '%03d' "$i").png"
done
rm -rf "$TMP"

echo "✅ 抽帧完成: ${i} 帧 → $OUT"
echo "提示: 接下来运行 node <skill>/scripts/dedup.mjs <capture目录> 去重"
