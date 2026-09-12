<div align="center">

# 🥷 design-clone

**把任何应用克隆成可交互原型。** · *Clone any app into a playable prototype.*

[![release](https://img.shields.io/github/v/release/hello-cqq/design-clone?include_prereleases&label=发布)](https://github.com/hello-cqq/design-clone/releases)
[![license](https://img.shields.io/badge/license-MIT-3fae83)](LICENSE)
[![ci](https://img.shields.io/github/actions/workflow/status/hello-cqq/design-clone/ci.yml?label=ci)](https://github.com/hello-cqq/design-clone/actions)
[![stars](https://img.shields.io/github/stars/hello-cqq/design-clone?style=social)](https://github.com/hello-cqq/design-clone)

**[🌐 官网与在线画廊 →](https://hello-cqq.github.io/design-clone/)** · [English](README.md) · [Gallery 画廊](https://hello-cqq.github.io/design-clone/gallery.html)

<img src="https://raw.githubusercontent.com/hello-cqq/design-clone-prototype/main/ai-assistant/cover.png" alt="PetPark —— 由 design-clone 端到端生成的 3D 萌宠乐园原型" width="720" />

*↑ [智能助理](https://hello-cqq.github.io/design-clone/proto.html?app=ai-assistant)：skill 端到端生成——切换形象/音色、聊天、通话、可播可导出。*

</div>

---

## 它做什么

一个跑在 opencode / Claude Code / Codex / Qoder / Qwen Code / Trae 里的 [Agent Skill](https://agentskills.io)。你的 agent 自动捕获真实 app、网站、桌面软件或视频/图文链接，重建为**活的产品设计稿（living PRD）**：离线可交互的 Web 原型 + 结构化设计资产（tokens、规格、路径、图标、封面）。无需付费 API、无需私有 MCP；视觉判断由*你的* agent 自有 VLM 完成。

- 📱 **四类来源**——app 界面（adb/HID）、网站（headless Chromium）、视频/图文链接（抖音/B站/小红书/YouTube…）、纯原创设计。
- 🎛 **每个控件都能点**——硬门保证：死控件=0、活 HTML 视图（禁止截图当视图）。
- 📐 **附设计规格**——每页 `spec.json` + 可导入 Figma 的源、tokens、标注、交互路径。
- 🖼 **画廊就绪**——双语 `meta.json` + 图标 + 3:2 封面自动生成；一条命令发布到社区画廊。

## 安装（一条命令）

```bash
curl -fsSL https://raw.githubusercontent.com/hello-cqq/design-clone/main/install.sh | bash
```

| Agent | 或钉版 |
|---|---|
| opencode / claude / codex（自动探测） | `--agent opencode` · `--ref v0.6.0` · `--channel snapshot` · `--skip-deps` |
| 任意 Agent-Skills 客户端 | `npx skills add hello-cqq/design-clone -g -y --copy` |
| 无 CLI 平台 | 从 [Releases](https://github.com/hello-cqq/design-clone/releases) 下载 `design-clone.zip` |

然后把首句粘进你的 agent：

> **用 design-clone 克隆 <某个 app 或网址> 的设计原型**

## 快速开始

```bash
node <skill>/scripts/clone.mjs --target hn --platform web --url https://news.ycombinator.com --serve
# → 捕获 → 视图 → 门禁 → http://localhost:4200/prototype/
```

## 在线体验

| | |
|---|---|
| [画廊](https://hello-cqq.github.io/design-clone/gallery.html) | 社区原型，浏览器内即玩 |
| [指南](https://hello-cqq.github.io/design-clone/guide.html) | 安装 → 克隆 → 发布 三步 |
| [发布页](https://github.com/hello-cqq/design-clone/releases) | semver 发布车 + 快照渠道 + zip 资产 |

## 文档与边界

- 技能手册：[`skills/design-clone/SKILL.md`](skills/design-clone/SKILL.md) · 门禁矩阵：[`docs/GATES.md`](docs/GATES.md) · 决策/愿景/经验：[`docs/`](docs)
- **隐私与 IP**：真名/真人脸/PII 一律匿名化或生成替换；品牌资产需 consent；每个 run 带 `PROVENANCE`。克隆是学习基线，不是原创设计的替代品。
- **许可**：代码 MIT；捕获素材版权归属原主。

<div align="center"><sub>made with 🐾 by clones, for clones</sub></div>
