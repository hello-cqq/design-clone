# 三 agent 端到端实证（M54-E）

方法：`install.sh --agent all --src <repo>` 真装到本机三 agent 全局 skills 目录（含依赖），
随后用**装好的副本**（非仓库副本）以各 agent 的 headless 模式执行同一条任务：
克隆自研靶站 http://127.0.0.1:4210（宠物乐园 demo，web，≤2 页起）→ 写视图 → `clone.mjs --gates-only` 全门收口。
任务 prompt 见各日志；agent 仅被告知"读 SKILL.md 并按其工作流执行"，未给脚本级提示以外的特权。

| agent | 命令 | 结果 | 证据 |
|---|---|---|---|
| opencode 1.18.30 | `opencode run "<prompt>"`（cwd 内相对路径；/tmp 被其权限系统自动拒） | ✅ interact dead=0 · inspect 42/0 · eval PASS 99 · EXIT=0 | ~/dc-e2e/opencode/run/run（5 视图）· /tmp/e2e-opencode.log |
| codex 0.134.0 | `codex exec --skip-git-repo-check -s workspace-write -c approval_policy=never -c model_reasoning_effort=high -c model_catalog_json=<abs>` | ✅ interact dead=0 · inspect 42/0 · parity/collect-design EXIT=0 | ~/dc-e2e/codex/run/run · /tmp/e2e-codex.log |
| claude 2.1.153 | `claude -p "<prompt>" --permission-mode bypassPermissions` | ⛔ 未能执行：`403 Access to model denied`（headless 模型资格，换 --model 亦同；账号/订阅侧限制，**与 skill 无关**） | 安装验证 ✅（~/.claude/skills/design-clone + deps + doctor）；e2e 待有资格的机器复跑 |

## 环境侧发现（非 skill 缺陷，已入 LESSONS 150）
- opencode headless 拒绝一切 cwd 外路径（/tmp 自动拒）→ e2e prompt 必须约束 cwd 内相对路径。
- codex 0.134 旗标漂移：`--ask-for-approval` 已移除；用户 config.toml 的 `model_reasoning_effort="max"`、`~` 前缀 `model_catalog_json` 会直接启动失败 → 需 `-c` 覆盖。
- macOS 无 `timeout` 命令；agent 自发使用会失败。
- codex sandbox 中 ui-smoke 的 variant-save 一度红（写路径受限），agent 自愈后终局 42/0。

## 复跑方式
```bash
bash install.sh --agent all --src <repo>          # 或 --ref <tag>
cd ~/dc-e2e/<agent> && <agent-headless-cmd> "<prompt>"   # prompt 模板见 install.sh 装后提示与本报告方法段
```
