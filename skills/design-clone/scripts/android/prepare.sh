#!/usr/bin/env bash
# Android 捕获前一键准备 / 捕获后恢复。
# 用法:
#   bash prepare.sh            # 准备：唤醒+常亮+长超时+锁屏检测+状态记录
#   bash prepare.sh --restore  # 恢复：关常亮+还原超时+提醒事项
set -euo pipefail

STATE="${DC_PREPARE_STATE:-/tmp/dc-android-state}"

restore() {
  if [ -f "$STATE" ]; then
    . "$STATE"
    adb shell svc power stayon off 2>/dev/null || true
    [ -n "${OLD_TIMEOUT:-}" ] && adb shell settings put system screen_off_timeout "$OLD_TIMEOUT"
    rm -f "$STATE"
    echo "✅ 已恢复：关闭 USB 常亮、还原屏幕超时"
  else
    adb shell svc power stayon off 2>/dev/null || true
    echo "✅ 已关闭 USB 常亮（无历史状态文件）"
  fi
  cat <<'EOF'
 请检查（涉及你的隐私设置，自动化不代操作）：
 - 若捕获期间临时关闭了锁屏密码 → 现在恢复
 - 若启用了无线调试 → 可关闭
 - capture/ 里的截图与录屏含个人信息，分享前先检查
EOF
  exit 0
}

[ "${1:-}" = "--restore" ] && restore

adb devices | grep -q 'device$' || { echo "❌ 无已连接设备，先按 references/human-takeover.md §1 处理"; exit 1; }

# 记录原值
OLD_TIMEOUT=$(adb shell settings get system screen_off_timeout 2>/dev/null | tr -d '\r')
echo "OLD_TIMEOUT=$OLD_TIMEOUT" > "$STATE"

# 唤醒
WAKE=$(adb shell dumpsys power 2>/dev/null | grep -c 'mWakefulness=Awake' || true)
if [ "$WAKE" -eq 0 ]; then
  adb shell input keyevent 224
  echo "· 已唤醒屏幕"
fi

# 锁屏检测（解锁必须用户）
FOCUS=$(adb shell dumpsys window 2>/dev/null | grep -E 'mCurrentFocus' | tr -d '\r')
case "$FOCUS" in
  *keyguard*|*Keyguard*|*lock*)
    echo "🔒 检测到锁屏界面：请手动解锁（或临时取消锁屏密码，结束用 --restore 时我会再提醒）";;
esac

# USB 连接时常亮 + 30 分钟超时
adb shell svc power stayon usb
adb shell settings put system screen_off_timeout 1800000
echo "· 已设置：USB 连接时常亮 + 超时 30 分钟（--restore 可还原）"

# 勿扰建议（不代开）
echo "· 建议：开启勿扰模式，避免通知污染截图/录屏（不代操作）"
echo "✅ 准备完成，可以开始捕获"
