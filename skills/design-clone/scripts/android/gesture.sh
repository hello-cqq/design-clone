#!/usr/bin/env bash
# Android 手势助手（M17）：把 action-protocol 的散件手势收成子命令。
# 用法:
#   bash gesture.sh tap <x> <y>
#   bash gesture.sh longpress <x> <y> [ms=800]
#   bash gesture.sh swipe <up|down|left|right> [x=600] [y=1600] [dist=1000] [ms=400]
#   bash gesture.sh pulldown            # 顶部下拉（会话列表→小程序托盘/刷新）
#   bash gesture.sh text <ascii>
# 坐标为设备物理像素（1200x2608 基准可按比例换）。
set -euo pipefail
CMD="${1:?用法: bash gesture.sh tap|longpress|swipe|pulldown|text ...}"
shift
case "$CMD" in
  tap) adb shell input tap "${1:?x}" "${2:?y}" ;;
  longpress) X="${1:?x}"; Y="${2:?y}"; MS="${3:-800}"; adb shell input swipe "$X" "$Y" "$X" "$Y" "$MS" ;;
  swipe)
    D="${1:?up|down|left|right}"; X="${2:-600}"; Y="${3:-1600}"; DIST="${4:-1000}"; MS="${5:-400}"
    case "$D" in
      up)    adb shell input swipe "$X" "$Y" "$X" $((Y-DIST)) "$MS" ;;
      down)  adb shell input swipe "$X" "$Y" "$X" $((Y+DIST)) "$MS" ;;
      left)  adb shell input swipe "$X" "$Y" $((X-DIST)) "$Y" "$MS" ;;
      right) adb shell input swipe "$X" "$Y" $((X+DIST)) "$Y" "$MS" ;;
      *) echo "❌ 方向: up|down|left|right" >&2; exit 1 ;;
    esac ;;
  pulldown) adb shell input swipe 600 400 600 1700 500 ;;
  text) adb shell input text "${1:?文本}" ;;
  *) echo "❌ 子命令: tap|longpress|swipe|pulldown|text" >&2; exit 1 ;;
esac
