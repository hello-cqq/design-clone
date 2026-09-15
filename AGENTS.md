# AGENTS.md

本仓库是 Agent Skill「design-clone」，遵循 Agent Skills 规范（agentskills.io）。

## 必读文档（改任何东西前）

- `docs/SESSION-HANDOFF.md` — **新会话第一篇**：历史会话索引（可 resume 的 session id）+ 文档缺口补全（M45–M78）+ 待办 + 资源地图
- `docs/VISION.md` — 诉求与定位（"活 PRD"，唯一权威）
- `docs/DECISIONS.md` — 架构决策（ADR），偏离前先改这里
- `docs/RESEARCH.md` — 调研结论与许可存档
- `docs/LESSONS.md` — 实战经验账本（新坑先记再修）
- `docs/ROADMAP.md` — 里程碑状态与验收标准

## 仓库布局

- `skills/design-clone/` — skill 本体（SKILL.md + scripts/ + references/ + schema/ + presets/ + templates/）
- `dist/` — 给无 CLI 平台（WorkBuddy 等）的 zip 产物，CI 打包，勿手工编辑
- 项目空间布局（M90）：空间根 `design-clone/`=项目目录（非 git 仓，仅 `repo/` + `archive/` + 一个指路用 `AGENTS.md`）；`repo/design-clone/`=本仓 GitHub 代码（run 产物在其 gitignore 的 `design-clone-runs/`）；`repo/design-clone-prototype/`=proto 仓唯一管理副本；`archive/`=开发过程过期资源归档；两 GitHub 仓独立、本空间单点管理
- ⚠️ 空间根**故意不是 git 仓**：opencode 按 git 根解析项目，所以在空间根启动时会话归入 `global` 项目而非独立项目。2026-09-15 已把 design-clone 的 16 个历史 session 迁到该归属下（详见 `docs/SESSION-HANDOFF.md` §4.1）。**不要在空间根 `git init`**，否则会再次改变会话归属。
- 生成物不入库：`publish-out/`、`site/data/thumbs/`（CI 部署前 sync-thumbs 生成）；run 产物在仓内 gitignore 的 `design-clone-runs/`
- 生成物不入库：`publish-out/`、`site/data/thumbs/`（CI 部署前 sync-thumbs 生成）；根目录禁放媒体源文件（源素材归档于 gitignore 的 design-clone-runs/_clean-src 等，M86）

## 开发约定

- `SKILL.md` frontmatter 只允许 6 个字段：`name, description, license, compatibility, metadata`（+ name 必须等于目录名），禁止平台私有字段（`context: fork`、`hooks` 等），保证跨端可移植
- `scripts/` 内脚本必须是可被裸 bash 调用的独立入口（`node scripts/xxx.mjs --help`），不依赖任何特定 MCP
- 脚本只允许使用 `scripts/package.json` 声明的依赖 + 系统命令（adb/ffmpeg 等）；禁止引入需要付费或需 GPU 的运行时依赖
- 修改工作流时同步更新：SKILL.md 总控 → 对应 references/*.md → schema（如涉及产物格式）
- 所有路径引用用相对路径；产物目录规范见 `skills/design-clone/references/directory-spec.md`

## 验证

```bash
node skills/design-clone/scripts/doctor.mjs
node skills/design-clone/scripts/web/capture.mjs --url https://news.ycombinator.com --out /tmp/dc-test --max-pages 2
# 一条命令编排（抓取→可交互原型→四门→起服务）：
node skills/design-clone/scripts/clone.mjs --target <名> --platform web --url <网址> --serve
# 交互门（每控件点击必须有反应，dead=0）：
node skills/design-clone/scripts/qa/interact.mjs --run <run目录> --base http://localhost:4200
```

## 技术选型（已定稿）

- 执行层：Midscene CLI（`npx @midscene/*`）+ 原生工具兜底（adb / simctl / Playwright）
- 决策：宿主 agent 的 VLM；可选本地 MAI-UI-2B / GUI-Owl（vLLM OpenAI 兼容端点）
- 生成：规格驱动（spec.yaml + tokens.css），静态 HTML + 自带组件库 + 本地编译 utilities.css（无运行时 CDN），动效 GSAP
- Figma：官方远程 MCP 优先，talk-to-figma-mcp 降级
- 分发：npx skills（vercel-labs/skills）+ dist/*.zip 兜底
