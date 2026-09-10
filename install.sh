#!/usr/bin/env bash
# design-clone 一键安装器（M54）
#
#   curl -fsSL https://raw.githubusercontent.com/hello-cqq/design-clone/main/install.sh | bash
#   curl -fsSL .../install.sh | bash -s -- --agent opencode --skip-deps
#   bash install.sh --agent all --channel snapshot --ref v0.6.0-snapshot.20260910
#
# 行为：克隆（ref 默认=最新稳定 release → 无则最新 snapshot → main）→ 装入 agent 全局 skills 目录
# （auto=探测已有配置目录，全无则三家装齐）→ 默认全量装依赖（npm i + playwright chromium；--skip-deps 秒装）
# → 幂等（重跑=rsync --delete 更新；目标已存在同名 skill 需 --force 才覆盖）
# Windows：请在 WSL2 / Git Bash 中运行。
set -euo pipefail

REPO="https://github.com/hello-cqq/design-clone.git"
AGENT="auto"; REF=""; CHANNEL="stable"; DEPS=1; FORCE=0; PROJECT=0; SKILL_SRC=""

usage() { sed -n '2,12p' "$0"; exit 0; }
while [[ $# -gt 0 ]]; do
  case "$1" in
    --agent) AGENT="$2"; shift 2;;
    --ref) REF="$2"; shift 2;;
    --channel) CHANNEL="$2"; shift 2;;
    --skip-deps) DEPS=0; shift;;
    --with-deps) DEPS=1; shift;;
    --force) FORCE=1; shift;;
    --project) PROJECT=1; shift;;
    --src) SKILL_SRC="$2"; shift 2;;   # 本地仓库直装（CI/开发自用）
    -h|--help) usage;;
    *) echo "未知参数: $1" >&2; usage;;
  esac
done

log() { printf '\033[36m[install]\033[0m %s\n' "$*"; }
die() { printf '\033[31m[install]\033[0m %s\n' "$*" >&2; exit 1; }

command -v git >/dev/null || die "需要 git"
command -v node >/dev/null || die "需要 Node ≥20.19（见 references/install-guide.md 依赖矩阵）"

# ---- 目标目录 ----
home_dir() { echo "${HOME:-$(cd ~ && pwd)}"; }
global_dest() {
  case "$1" in
    opencode) echo "$(home_dir)/.config/opencode/skills";;
    claude)   echo "$(home_dir)/.claude/skills";;
    codex)    echo "$(home_dir)/.codex/skills";;
  esac
}
project_dest() {
  case "$1" in
    opencode) echo ".opencode/skills";;
    claude)   echo ".claude/skills";;
    codex)    echo ".codex/skills";;
  esac
}
detect_agents() {
  local out=()
  [[ -d "$(home_dir)/.config/opencode" ]] && out+=(opencode)
  [[ -d "$(home_dir)/.claude" ]] && out+=(claude)
  [[ -d "$(home_dir)/.codex" ]] && out+=(codex)
  if [[ ${#out[@]} -eq 0 ]]; then out=(opencode claude codex); fi
  echo "${out[@]}"
}
if [[ "$AGENT" == "auto" ]]; then AGENTS=$(detect_agents); elif [[ "$AGENT" == "all" ]]; then AGENTS="opencode claude codex"; else AGENTS="$AGENT"; fi

# ---- 取源码 ----
TMP=""
cleanup() { [[ -n "$TMP" && -d "$TMP" ]] && rm -rf "$TMP"; }
trap cleanup EXIT
if [[ -n "$SKILL_SRC" ]]; then
  SRC_ROOT="$(cd "$SKILL_SRC" && pwd)"
  [[ -f "$SRC_ROOT/skills/design-clone/SKILL.md" ]] || die "--src 目录无 skills/design-clone/SKILL.md"
else
  if [[ -z "$REF" ]]; then
    REF=$(curl -fsSL "https://api.github.com/repos/hello-cqq/design-clone/releases/latest" 2>/dev/null \
      | sed -n 's/.*"tag_name": *"\([^"]*\)".*/\1/p' | head -1 || true)
    if [[ -z "$REF" || "$CHANNEL" == "snapshot" ]]; then
      SNAP=$(curl -fsSL "https://api.github.com/repos/hello-cqq/design-clone/releases?per_page=10" 2>/dev/null \
        | sed -n 's/.*"tag_name": *"\([^"]*snapshot[^"]*\)".*/\1/p' | head -1 || true)
      [[ -n "$SNAP" ]] && REF="$SNAP"
    fi
    [[ -z "$REF" ]] && REF="main"
  fi
  TMP=$(mktemp -d)
  log "克隆 $REPO @ ${REF}（depth 1）"
  git clone --depth 1 --branch "$REF" "$REPO" "$TMP/repo" >/dev/null 2>&1 || git clone --depth 1 "$REPO" "$TMP/repo" >/dev/null 2>&1 || die "克隆失败（网络/ref 不存在）"
  SRC_ROOT="$TMP/repo"
fi
SKILL_DIR="$SRC_ROOT/skills/design-clone"
log "源: ${SKILL_DIR}（ref=${REF:-local}）"

# ---- 安装 ----
for a in $AGENTS; do
  case "$a" in opencode|claude|codex) ;; *) die "未知 agent: ${a}（可选 opencode/claude/codex/all/auto）";; esac
  if [[ "$PROJECT" == "1" ]]; then DEST=$(project_dest "$a"); else DEST=$(global_dest "$a"); fi
  TARGET="$DEST/design-clone"
  if [[ -e "$TARGET" && "$FORCE" != "1" && ! -e "$TARGET/.dc-managed" ]]; then
    die "$TARGET 已存在且非本安装器管理（--force 覆盖）"
  fi
  mkdir -p "$DEST"
  log "安装 → $TARGET"
  rm -rf "$TARGET"
  if command -v rsync >/dev/null; then
    rsync -a --exclude node_modules --exclude .git "$SKILL_DIR/" "$TARGET/"
  else
    mkdir -p "$TARGET"
    (cd "$SKILL_DIR" && tar cf - --exclude=node_modules --exclude=.git .) | (cd "$TARGET" && tar xf -)
  fi
  touch "$TARGET/.dc-managed"
done

# ---- 依赖（默认全量一键）----
if [[ "$DEPS" == "1" ]]; then
  for a in $AGENTS; do
    if [[ "$PROJECT" == "1" ]]; then DEST=$(project_dest "$a"); else DEST=$(global_dest "$a"); fi
    SD="$DEST/design-clone/scripts"
    log "依赖安装: ${SD}（npm i + playwright chromium，首次约数分钟）"
    (cd "$SD" && npm install --no-audit --no-fund >/dev/null 2>&1 && npx playwright install chromium >/dev/null 2>&1) \
      || log "⚠ 依赖安装未完成（可稍后手动: cd $SD && npm install && npx playwright install chromium）"
  done
else
  log "跳过依赖（--skip-deps）；首次跑门禁前请: cd <skill>/scripts && npm install && npx playwright install chromium"
fi

cat <<EOF

✅ 安装完成（agent: ${AGENTS}）
下一步：打开你的 agent，粘贴首句即可开始——
  用 design-clone 克隆 <某个 app 或网址> 的设计原型
环境自检（可选）：node ~/.claude/skills/design-clone/scripts/doctor.mjs   # 路径按 agent 替换
钉版/渠道：--ref <tag> | --channel snapshot | 秒装档 --skip-deps
EOF
