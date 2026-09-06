#!/usr/bin/env bash
# design-clone 安装（M44h）：把 skill 链接到常见 agent 技能目录 + 环境自检。
# 用法: bash scripts/install.sh [--target opencode|claude|codex|all]
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
SKILL="$(dirname "$HERE")"
TARGET="${2:-all}"
link_one() {
  local dir="$1"
  mkdir -p "$dir"
  ln -sfn "$SKILL" "$dir/design-clone"
  echo "linked: $dir/design-clone -> $SKILL"
}
case "$TARGET" in
  opencode) link_one "${XDG_CONFIG_HOME:-$HOME/.config}/opencode/skills" ;;
  claude)   link_one "$HOME/.claude/skills" ;;
  codex)    link_one "${CODEX_HOME:-$HOME/.codex}/skills" ;;
  all)
    link_one "${XDG_CONFIG_HOME:-$HOME/.config}/opencode/skills"
    link_one "$HOME/.claude/skills"
    link_one "${CODEX_HOME:-$HOME/.codex}/skills"
    ;;
esac
echo "--- doctor ---"
node "$HERE/doctor.mjs" || true
echo "--- onboard（能力矩阵）---"
node "$HERE/doctor.mjs" --onboard || true
echo "完成。入口：node $HERE/clone.mjs --entry \"<一句话|链接|图片|app名>\""
