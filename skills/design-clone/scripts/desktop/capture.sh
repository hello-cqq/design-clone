#!/usr/bin/env bash
# macOS 桌面捕获助手（screencapture + AppleScript 键鼠，权限门控）。
# 用法:
#   bash capture.sh check                          # 权限自检（屏幕录制/辅助功能）
#   bash capture.sh shot <输出.png> [x,y,w,h]      # 全屏或区域截屏
#   bash capture.sh click <x> <y>                  # 点击（需辅助功能权限）
#   bash capture.sh clickv <x> <y> [eps=1.5]       # 闭环点击：点前后截屏 diff，未命中偏移重试≤2（M17）
#   bash capture.sh wheel <x> <y> [notches=-3]     # 移到(x,y)发滚轮事件（负=向下滚，需辅助功能）
#   bash capture.sh type <文本>                    # 键入（需辅助功能权限）
#   bash capture.sh loop <目录> [间隔秒=2] [张数=10]
#   bash capture.sh rec <输出.mp4> [秒=10]          # 录屏（ffmpeg avfoundation）
# Windows 见 references/ios-desktop.md §win。
set -euo pipefail
if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ] || [ "${1:-}" = "help" ]; then echo "用法: bash capture.sh check|shot <out.png>|click <x> <y>|type <text>|loop <dir> [间隔秒] [张数]|rec <out.mp4> [秒]"; exit 0; fi
CMD="${1:?用法: bash capture.sh check|shot|click|type|loop ...}"

case "$CMD" in
  check)
    echo "-- 屏幕录制：截一张测试图（无权限时得到空白/被拒）"
    if screencapture -x /tmp/dc-perm-test.png 2>/dev/null && [ -s /tmp/dc-perm-test.png ]; then
      SZ=$(stat -f%z /tmp/dc-perm-test.png); echo "   ✅ screencapture 可用（${SZ} bytes；若画面是空白壁纸=未授权屏幕录制）"
    else
      echo "   ❌ screencapture 失败 → 系统设置-隐私与安全性-屏幕录制 给终端授权"
    fi
    echo "-- 辅助功能：尝试读进程名（click/type 需要辅助功能）"
    if osascript -e 'tell application "System Events" to return name of first process' >/dev/null 2>&1; then
      echo "   ⚪ System Events 可达；click 若报 -1719/-25211 = 未授权辅助功能"
    else
      echo "   ❌ System Events 不可用"
    fi
    ;;
  shot)
    OUT="${2:?输出路径}"; REGION="${3:-}"
    if [ -n "$REGION" ]; then screencapture -x -R "$REGION" "$OUT"; else screencapture -x "$OUT"; fi
    echo "✅ $OUT"
    ;;
  click)
    X="${2:?x}"; Y="${3:?y}"
    if [ "${DC_CLICK_ASE:-0}" = "1" ]; then
      osascript -e "tell application \"System Events\" to click at {$X, $Y}"
    else
      python3 "$(cd "$(dirname "$0")" && pwd)/clickcg.py" "$X" "$Y"
    fi
    ;;
  raise)
    PROC="${2:?process名，如 Feishu/Electron}"
    osascript -e "tell application \"System Events\" to tell process \"${PROC}\" to set frontmost to true" \
              -e "tell application \"System Events\" to tell process \"${PROC}\" to try" \
              -e "perform action \"AXRaise\" of window 1" -e "end try"
    echo "✅ raise ${PROC}"
    ;;
  sweep)
    # 用法: bash capture.sh sweep "x y name;x y name" [DC_FRONT] —— 逐项 clickv+settle+shot（M18 一键 sweep）
    LIST="${2:?清单}"; HERE="$(cd "$(dirname "$0")" && pwd)"; OUT="${SWEEP_OUT:-capture/screens}"
    mkdir -p "$OUT"; OLDIFS=$IFS; IFS=';'; set -- $LIST; IFS=$OLDIFS
    for item in "$@"; do
      set -- $item; X=$1; Y=$2; NAME=$3
      DC_FRONT="${DC_FRONT:-}" bash "$HERE/capture.sh" clickv "$X" "$Y" || echo "skip $NAME (miss)"
      sleep 0.8
      node "$HERE/../android/settle.mjs" "$OUT/$NAME.png" 3 1.2 || bash "$HERE/capture.sh" shot "$OUT/$NAME.png"
    done
    echo "✅ sweep done"
    ;;
  clickv)
    X="${2:?x}"; Y="${3:?y}"; EPS="${4:-1.0}"
    HERE="$(cd "$(dirname "$0")" && pwd)"
    if [ -n "${DC_FRONT:-}" ]; then osascript -e "tell application \"System Events\" to tell process \"${DC_FRONT}\" to set frontmost to true" -e "tell application \"System Events\" to tell process \"${DC_FRONT}\" to try" -e "perform action \"AXRaise\" of window 1" -e "end try" >/dev/null 2>&1; sleep 0.4; fi
    for TRY in 0 1 2; do
      OX=$X; OY=$Y
      if [ "$TRY" = "1" ]; then OY=$((Y+24)); fi
      if [ "$TRY" = "2" ]; then OX=$((X+24)); fi
      screencapture -x /tmp/dc-cv-pre.png
      python3 "$HERE/clickcg.py" "$OX" "$OY" >/dev/null 2>&1
      sleep 1.2
      screencapture -x /tmp/dc-cv-post.png
      D=$(node "$HERE/diff2.mjs" /tmp/dc-cv-pre.png /tmp/dc-cv-post.png 2>/dev/null || echo 0)
      HIT=$(node -e "console.log(parseFloat(process.argv[1]) >= parseFloat(process.argv[2]) ? 1 : 0)" "$D" "$EPS" 2>/dev/null || echo 0)
      if [ "$HIT" = "1" ]; then echo "clickv-ok ($OX,$Y) diff=$D try=$TRY"; exit 0; fi
    done
    echo "clickv-miss ($X,$Y)" >&2; exit 3
    ;;
  wheel)
    X="${2:?x}"; Y="${3:?y}"; N="${4:--3}"
    python3 - "$X" "$Y" "$N" <<'PY'
import ctypes, ctypes.util, sys, time
x, y, n = int(sys.argv[1]), int(sys.argv[2]), int(sys.argv[3])
class CGPoint(ctypes.Structure): _fields_ = [("x", ctypes.c_double), ("y", ctypes.c_double)]
cg = ctypes.CDLL(ctypes.util.find_library("CoreGraphics"))
cg.CGEventCreateMouseEvent.restype = ctypes.c_void_p
cg.CGEventCreateMouseEvent.argtypes = [ctypes.c_void_p, ctypes.c_uint32, CGPoint, ctypes.c_uint32]
cg.CGEventCreateScrollWheelEvent.restype = ctypes.c_void_p
cg.CGEventCreateScrollWheelEvent.argtypes = [ctypes.c_void_p, ctypes.c_uint32, ctypes.c_uint32, ctypes.c_int32]
cg.CGEventPost.argtypes = [ctypes.c_uint32, ctypes.c_void_p]
cg.CFRelease.argtypes = [ctypes.c_void_p]
p = CGPoint(x, y)
mv = cg.CGEventCreateMouseEvent(None, 5, p, 0)
cg.CGEventPost(0, mv); cg.CFRelease(mv)
time.sleep(0.05)
ev = cg.CGEventCreateScrollWheelEvent(None, 0, 1, n)
cg.CGEventPost(0, ev); cg.CFRelease(ev)
print(f"✅ wheel ({x},{y}) notches={n}")
PY
    ;;
  type)
    T="${2:?文本}"
    osascript -e "tell application \"System Events\" to keystroke \"$T\""
    ;;
  loop)
    DIR="${2:?目录}"; IV="${3:-2}"; N="${4:-10}"
    mkdir -p "$DIR"
    for i in $(seq 1 "$N"); do
      OUT="$DIR/screen-$(printf %02d "$i").png"
      screencapture -x "$OUT"
      echo "[$i/$N] $OUT（${IV}s 后下一张）"
      sleep "$IV"
    done
    ;;
  rec)
    OUT="${2:?输出.mp4}"; DUR="${3:-10}"
    DEV=$(ffmpeg -hide_banner -f avfoundation -list_devices true -i "" 2>&1 | grep -i "Capture screen" | head -1 | sed -E 's/.*\[[0-9]+\] //')
    [ -n "$DEV" ] || { echo "❌ 无屏幕录制设备 → 系统设置授权屏幕录制给 ffmpeg/终端" >&2; exit 1; }
    ffmpeg -y -hide_banner -loglevel error -f avfoundation -framerate 30 -i "$DEV:none" -t "$DUR" \
      -c:v libx264 -preset veryfast -pix_fmt yuv420p -vf scale=iw:-2 "$OUT"
    echo "✅ $OUT（${DUR}s）"
    ;;
  *) echo "未知子命令: $CMD" >&2; exit 1 ;;
esac
