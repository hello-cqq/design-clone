# Contributing

- 先读 docs/VISION.md / DECISIONS.md / LESSONS.md；改工作流同步 SKILL.md→references→schema。
- **skill-first 纪律**：使用中发现问题，先修 skill（脚本/协议/模板）再修 run；记 LESSONS 时附"落地（skill 位置）"。
- 脚本必须裸 bash/node 可跑、带 --help；依赖只许 scripts/package.json 声明的免费包。
- SKILL.md frontmatter 只许 name/description/license/compatibility/metadata。
- 提交前：`node scripts/doctor.mjs` + 目标 run `qa/inspect.mjs` 全绿。
