#!/usr/bin/env bash
# iOS 模拟器捕获助手（simctl 一等公民）。
# 用法:
#   bash sim-capture.sh list                     # 列出已启动模拟器
#   bash sim-capture.sh shot <输出.png>          # 截当前模拟器屏
#   bash sim-capture.sh launch <bundle-id>       # 启动 app
#   bash sim-capture.sh openurl <url>            # 深链拉起（L5 同款）
#   bash sim-capture.sh loop <目录> [间隔秒=2] [张数=10]   # 用户手动操作+定时截屏
# 无 simctl（未装 Xcode）时 exit 3 并打印回落路径（真机 WDA / 人接管）。
set -euo pipefail
CMD="${1:?用法: bash sim-capture.sh list|shot|launch|openurl|loop ...}"

if ! xcrun simctl help >/dev/null 2>&1; then
  echo "❌ 未找到 simctl（需要 Xcode/Command Line Tools 含模拟器运行时）。" >&2
  echo "回落路径：" >&2
  echo "  1) 真机：references/ios-desktop.md §WDA 引导（Appium WebDriverAgent）" >&2
  echo "  2) 人接管：references/human-takeover.md（用户操作+口述，agent 截图取证）" >&2
  echo "  3) 链接取材：Link 模式 web-sim（Safari 移动 UA 模拟）" >&2
  exit 3
fi

case "$CMD" in
  list)
    xcrun simctl list devices booted
    ;;
  shot)
    OUT="${2:?输出路径}"
    xcrun simctl io booted screenshot "$OUT"
    echo "✅ $OUT"
    ;;
  launch)
    B="${2:?bundle-id}"
    xcrun simctl launch booted "$B"
    ;;
  openurl)
    U="${2:?url}"
    xcrun simctl openurl booted "$U"
    ;;
  loop)
    DIR="${2:?目录}"; IV="${3:-2}"; N="${4:-10}"
    mkdir -p "$DIR"
    for i in $(seq 1 "$N"); do
      OUT="$DIR/screen-$(printf %02d "$i").png"
      xcrun simctl io booted screenshot "$OUT" 2>/dev/null || true
      echo "[$i/$N] $OUT（操作目标 app，${IV}s 后下一张）"
      sleep "$IV"
    done
    ;;
  *) echo "未知子命令: $CMD" >&2; exit 1 ;;
esac
