# SESSION-HANDOFF — 会话接力索引

> **用途**：新开会话时先读这一篇，就能知道「之前做了什么 / 准备做什么 / 项目资源在哪」。
> **落盘**：2026-09-15 ｜ 仓库 HEAD `f59be15`（工作树干净）
> **数据来源**：opencode 会话库 `~/.local/share/opencode/opencode.db` 中 design-clone 项目空间的全部 16 个 session（15,403 message / 69,055 part / 21 todo），逐会话抽取用户指令流 + 助手输出流 + patch 文件清单 + todo 后归纳。
> **与其他文档的关系**：本文**不重复** `ROADMAP.md`（M0–M77 里程碑表）与 `SESSION-SUMMARY-M76-M94.md`（最近波次 + 门禁 + 端口 + 脚本索引）。它负责三件那两篇没有的事：① 会话 ↔ 里程碑的映射与 resume 入口；② **文档记账缺口的补全**（M45–M78 段）；③ 只存在于会话记录、从未落盘的隐性知识。

---

## ① 会话时间线（resume 入口）

16 个 session 已于 2026-09-15 全部迁回当前项目空间（原 project `e3dc8d62…` → `global` + `path=Users/cqq/Project/design-clone`）。在空间根 `/Users/cqq/Project/design-clone` 启动 opencode 即可在会话列表看到 4 个主会话；12 个子代理会话挂在父会话下，不单独列出。

| # | session id | 标题 | 时间 | msg | 覆盖里程碑 | 备注 |
|---|---|---|---|---|---|---|
| 1 | `ses_fa51a4abdffeS6Nh5oRuSPVVnj` | design-clone | 09-01 10:56 → 09-15 16:44 | 5446 | **M0–M94 主干** | 唯一主干会话；另两个会话的产物都被要求 merge 回这里；**M0–M20 的中间过程只存在于此会话**（首个 commit `b2f1b07` 一次性 squash） |
| 2 | `ses_f740c68a3ffeuvvmVITZuYyS2x` | design-clone-prototype | 09-10 23:33 → 09-11 22:49 | 4626 | M55–M73 | proto 仓 + 官网 site/ 线；**前 250 条"用户指令"是上一会话的 compact 回放**（时间戳全压平成 `09-10 23:33`），真实新内容从 `[09-10 23:42]` 起 |
| 3 | `ses_f7227de4cffettVoe64ktAMoK6` | 配置阿里云百炼团队版 Token | 09-11 08:22 → 11:46 | 67 | 无（环境配置） | 与 skill 无关，但记录了 4 个 agent 工具的百炼接入方式，见 §4.6 |
| 4 | `ses_f66b13af8ffeHEDUiBm3EJllDb` | design-clone-1 | 09-13 13:47 → 09-14 11:06 | 5010 | **M77 + M76-W8** | 是会话 1 的 fork；302 条指令里 294 条继承，**真实新内容只在尾部**（`assistant` 流第 18366–18502 行） |

**子代理会话（12 个，均挂在父会话下）**

| 父 | 子会话 | 时间 | 结论落点 |
|---|---|---|---|
| 1 | 调研 GUI Agent 框架 / 设备控制与录屏 / 媒体下载与视频理解 / 原型生成与动效库 / 规格驱动设计与Figma / Skill分发生态（6 路并行） | 09-01 11:47–11:48 | `docs/RESEARCH.md` |
| 1 | PM-web 全链路验收 / PM-android 真机验收 / 测试角色全量测试 / 设计师走查三demo（4 路并行） | 09-01 20:37 | `docs/QA.md` + `docs/QA/{pm-acceptance,test-report,design-review}.md` |
| 3 | Extract OpenClaw token plan config / Extract Hermes Agent token plan config | 09-11 08:55 | 会话 3 正文 |

> 读会话的性价比排序：**会话 1 的用户指令流**（346 条，86KB，是全部设计意图的来源）> 会话 4 尾部 137 行 > 会话 2 的 `[09-10 23:42]` 之后。助手输出流三个大会话各约 600–720KB，按需 grep。

---

## ② 之前做了什么

### 2.1 已有权威记录（别重读会话）
- **M0–M77**：`docs/ROADMAP.md`（M44 系列记得最细）
- **M76–M94**：`docs/SESSION-SUMMARY-M76-M94.md`（§0 空间布局 / §1 波次纪要 / §2 门禁清单 / §3 端口 map / §4 脚本索引 / §5 未决项）
- **逐条变更**：`CHANGELOG.md`（M23–M83 基本齐全，与 git log 一一对应）
- **架构决策**：`docs/DECISIONS.md`（A1–A56）｜**踩坑账本**：`docs/LESSONS.md`（1–165，但 151–160 段编号重复错位，见 §3.2）｜**门禁**：`docs/GATES.md`

### 2.2 文档缺口补全：M45–M78

`ROADMAP.md` 止于 M77 且中间有洞，`CHANGELOG.md` 缺 M84 之后。下表补齐**只在 git log / 会话记录里**的部分（`✅`=已有文档，`❌`=真空白）：

| 编号 | 时间 | 成果 | ROADMAP | CHANGELOG |
|---|---|---|---|---|
| M47.1–.3 | 09-09 | regress 只认「无 summary 的瞬态崩溃」；子门超时 900s→**2400s**；slytherin emoji 清零 | ❌ | ✅ |
| **M48** | 09-09 | 用户四图打回后一轮清 W1–W7：字重预算（chrome/画布/看板 ≤500、视图 ≤600，回收 **45 视图**）；paths-gen **BFS 方向化**（`depth[to]<depth[from]`，`role=back` 不入路径/树/nav 叶，**32 run 重生成**）；**五道新门** `canvas-text-budget`/`view-weight-budget`/`back-in-path`/`nav-back-leaf`/`mutual-forward`；最终 **19/19 ALL GREEN** | ❌ | ✅ |
| M48.1–.4 | 09-09→10 | utility-css `bold/extrabold/black` 封顶 600（CJK 黑粗根治到生成器）；preflight 封顶裸 `<b>/<strong>`；**link-xhs5 整 run 三视图无任何 CSS**（静默坏块、旧门全绿）→ 新门 `unstyled-view-classes`，后改 computed 视觉判定消误报 | ❌ | ✅ |
| M49.1 | 09-10 | parity 选择器 tag-agnostic；存量保真债校准（新 run 硬拦/存量 warn）→ `report/parity-debt.md` | ❌ | ✅ |
| M51.1 | 09-10 | `collect-design` 宽松解析旧 run 的 `window.DC`（键未加引号致 `JSON.parse` 失败 = 导出门**假红**根因） | ❌ | ✅ |
| **M52** | 09-10 | 圆周轨迹探索页**结构化重建非贴图**（地图底=内联 SVG，城市名/圆点为独立可选元素，删整屏裁切 `explore-map.jpg`）；新门 `inspect: pasted-screenshot`（单 `<img>` 覆盖 ≥45% 舞台且同根无绝对定位兄弟 → hard） | ❌ | ✅ |
| M54.1 | 09-11 | `release.mjs` ROOT 路径修正（scripts→repo 三级） | ❌ | ✅ |
| **M57** | 09-11 | 官网三轮打磨：hero 三行居中、logo v3、功能演示全宽真实场景动画、精选 3:2 封面、详情页恰好一屏 + 面包屑 | ❌ | ✅ |
| **M58** | 09-11 | **测试三件套建成**：`site/tools/e2e.mjs`（20 轮）+ `loadtest.mjs` + CI site job；star 数改构建期内嵌 `site/data/stars.json`（消除 GitHub API 60/hr 限额）；**1000req/200 并发 0 错，rps 1160，p95 167ms** | ❌ | ✅ + `report/site-perf.md` |
| **M59–M61** | 09-11 | 吉祥物三连试错：Q 版设计师 SVG → genimg pixar-3d → 圆框眼镜 + 水镜微电影。**三版全被用户否「好丑」**，最终 M64 改用户自产 AI 视频 | ❌ | ✅ |
| M62.1/.2 | 09-11 | ⚠️ **并发 session 回滚残留**：把 M67 已删的渠道 pill / release 徽章重新接了回来 → 靠 e2e「三无元素计数=0」断言物理钉死（LESSONS 164） | ❌ | ✅ |
| **M63** + M63.1 | 09-11 | 资源治理：cover 桌面窗口框/浏览器框分流 + category 计分制；publish **FORBID 生图中间件**（`_raw-`/`assets/_`）；四种子 v1.2.0；修画廊封面**双前缀 404** | ❌ | ✅ |
| **M74** | 09-12 | **并发方案归并裁决**（唯一 ROADMAP + CHANGELOG 双缺）：① 安装 UI = **站点单命令方案胜出**，渠道仅保留 CLI `--ref/--channel` 旗标，不恢复渠道 UI；② `index v5 pages` 定为 spec 页数据源；③ 死代码清理（`site.js` relbadge 块、`pages.yml` release.json 嵌入步）；④ 核实 M63.1 修复在 M73 后仍生效 | ❌ | ❌ |
| M76-W6 | 09-13 | 用户自供干净源替换 ident-light；brand-qa 升级（暗发邻域残铅 + 连通域 + 角标文字行 + **椭圆掩膜感知**） | ❌ | ✅ |
| **M76-W7a–h** | 09-13 | ⚠️ 全部由**并发会话**提交：live-proof iframe 延迟到 `load+idle`；`hash-assets.mjs` 入 CI（破 Pages 边缘 `max-age=600` 旧 js 混搭）；画廊缩略图 IO 延载 + ident `preload=none`（**此改动正是 W8 故障的诱因**）；e2e 改 load 语义；`afterLoadOr` DCL+3.5/4s 兜底；ident-light 降码率 704×528 crf23（2.6MB→~1MB）；**双 poster 内联 base64** | ❌ | ✅ |
| **M76-W8/b/c/d/f** | 09-14 | ident 不播放抢修（见 §2.3）| ❌ | ✅ |
| M78-1 / M78-3 | 09-14 | ⚠️ 并发会话：v1 女生视频回归 + 铅笔根除（簇跟踪色彩擦 + 笔杆几何 poly 插值擦，179 帧）；`sync-thumbs.mjs` 同源缩略图入 `pages.yml` | ❌ | ✅ |
| M78-2 | — | **编号跳空，三处均无记录** | ❌ | ❌ |
| **M84/M85/M88/M91/M93/M94** | 09-14→15 | 演示点击即播、选中框 rAF 活跟踪 + `sel-ring-align` 门、导出 `all.zip`、logo 换用户图 + 主题冰蓝、导航 logo 动图 webp、透明纯度 veil 门 | ❌ | ❌（M93/M94 仅在 SESSION-SUMMARY） |

> **M92 从未使用**（M91 → M93 跳号）。

### 2.3 ident 视频不播放：三层根因（从未统一落盘）

用户 09-13 23:01 报「视频不会播放了，会卡住不播放」，抢修跨 M76-W8/W8b/W8c/W8d/W8f 五步。真根因是三层叠加：

1. **`ident.js` 播放启动挂在 `window.load`** —— Pages 边缘对 2MB 级大图偶发 stall（实测 `logo-main.png` 在边缘 stall **11s** 并占住连接，把视频请求挤进队列），load 永不触发 → `play()` 永不执行。
2. **`ident-dark` 非 faststart**（moov 在 mdat 之后）—— 无 Range 支持的服务下起播即卡。
3. **`ident.js` 无哈希名** + 并发会话正在换 mp4 —— 边缘缓存反复发旧脚本，**修复根本到不了浏览器**。

修复：DCL+300ms 起播 + 看门狗 ≤4 次重试 + **元素级自愈引导**（不依赖 wire 闭包/重建时序）；`ident-dark` 重封装 faststart（`2e1d52dc`→`bc4c173a`，字节数不变）；`ident.js` 改哈希名 `ident.1bf01469.js`；`logo-main.png` 1.9MB→**358KB** palette png 消除首屏连接争用。
门禁固化：e2e 增「**无 Range HTTP 服务下 ident 必须推进 currentTime**」（本地起 `http.server` 跑 `site/` 模拟最坏服务）+ brand-qa 增 `moov<mdat` 检查。验收：部署站 dark boot 即播（currentTime 3.94s→6.45s）、切主题后 light 亦播（3.30s）。

> **诊断误判自白（值得记住）**：此前多次「部署站仍卡」的探测其实**查错了对象**——查的是非当前主题的视频，它按设计就是 `preload=none`。
> **本地测试为何长期假绿**：`file://` 无网络挂起，e2e 一直绿，掩盖了 load 依赖问题。教训 = 必须起真 HTTP、且无 Range 支持的服务测最坏情况。

### 2.4 M77 概念导演管线（会话 4 的主交付）

起因：用户 09-13 14:10「目前我们的**非 clone 的原型生成效果还是很差**……我希望的是用户输入描述，我们可以引导用户丰富描述」+ 粘贴豆包完整问答。核心判断：**与豆包的差距不在生图质量，在有没有 brief 这一层**（`clone.mjs` 无概念编排、`enrich.mjs` 只做单图富化、无「整套提示词 + 参考图」产出）。

护栏（用户 09-13 14:16 明确要求「千万要保证不能影响到已经做好的」）：所有 brief 逻辑**仅在 `knowledge/brief.json` 存在或 `scope.source=original` 时生效**，clone 代码路径零改动；发布前硬条件 = 3 个代表 clone run 的门 JSON 前后 diff 为零。实测 **25 run 回归 ALL GREEN**（此前 21）。

新增脚本（`skills/design-clone/scripts/gen/`）：

| 脚本 | 大小 | 用途 |
|---|---|---|
| `director.mjs` | 23KB | 稀薄描述 → `knowledge/brief.json` **九 aspect**（identity / style_baseline / characters / pages（含控件清单）/ assets / icon / cover / tags / flows / scenes / video_prompts / design_notes / suggested_questions）。场景识别 9 类；8 页骨架按题材映射 |
| `ref-images.mjs` | 2KB | 按 brief 逐页生参考图 → `references/ref-<page>.png` + manifest |
| `brief-tokens.mjs` | 1KB | brief → `tokens.css` |
| `brief-products.mjs` | 1KB | brief → `products.json` |
| `brief-flows.mjs` | 2.6KB | `brief.flows` → `paths.json` |
| `brief-views.mjs` | 8.7KB | 全控件接线 2.5D 基线视图合成 |

新门：`qa/inspect.mjs` 的 `brief-director`。新文档：`references/concept-director.md`。
实测四稀薄输入（均 4 视图、门绿、publish 1.0.0）：「做一个学习app」→ **拾光书房** `gen-study`；「赛博朋克音乐播放器」→ **霓虹磁带** `gen-music`；「国风茶饮小程序」→ **山海茶事** `gen-tea`；「闪购电商app」→ **闪购集市** `gen-shop`。
两个旗舰重建：`demo-assistant` → **星海对话** v3.0.0（5 视图）；`demo-petpark` → **动物乐园** v3.0.0（8 视图 7 角色 15 资产）。

### 2.5 W 波次体系（读 commit message 必备）

- **M = 里程碑**，全局单调递增，**跨会话共享同一编号空间**——不同会话可以同时在 M76 和 M77 上工作。
- **W = M 内的工作流/波次**（W1..W8），由计划阶段的「批准即开工」清单定义。W 编号在一个 M 内唯一，**跨 M 会重用**（M75-W7 与 M76-W7 无关）。
- **W 后小写字母 = 该波次内的补丁轮次**（`W7 hotfix → W7b → … → W7h`）。W8a/W8e 是诊断/验证步，不产生独立 commit。
- **并发组织方式**：多个会话在**同一 working copy、同一 git 目录**上接力提交（无分支、无 PR），靠 commit message 前缀 `M<n>-W<m>` 归属。M74 就是专门为此开的归并裁决里程碑；M62.1/M62.2 是一次失败案例。
- 副作用已知：里程碑编号撞车（ROADMAP 有**两条 M62 行**）、LESSONS 编号重复（见 §3.2）。

---

## ③ 准备做什么

### 3.1 M95 — 已批准未执行（最高优先）

用户 09-15 16:32 提供了**绿幕 day/night 两个源视频**，16:39 出计划，16:43 用户回「执行」，但会话在此结束，**未落地**。

- 源：`archive/logo-source-day.mp4`、`archive/logo-source-night.mp4`
- 帧已抽好在 **`/tmp/ls-day/`、`/tmp/ls-night/`（各 193 帧，仍在，重启即失）**
- 规格：720×720 / 24fps / 193 帧
- ⚠️ 背景是**鼠尾草绿非纯绿**（day ≈ `(153,170,158)`、night ≈ `(124,146,133)`）→ 需 despill 去绿边，不能用纯 chroma key
- 两个视频都含**底部 `design-clone` 字行** + 部分帧左上「豆包AI生成」水印 → 先用 bg 填充
- 管线：despill + `a=clamp((dist-24)/12)` + despeckle(<4px 连通域) + 只保留主连通域 + frame1 固定 bbox
- **输出文件名必须保持不变**（`logo-anim-light.webp` / `logo-anim-dark.webp` / `logo-mark{,-dark}.png` / `favicon{,-dark}.png` / `apple-touch-icon.png`），否则要改站点引用
- 参考实现：`/tmp/m94-process.mjs`（M94 白底启发式键控版，仍在）；复跑命令见 `SESSION-SUMMARY-M76-M94.md` §4
- 完成后 veil 门阈值可从 0.75% 收紧回 0.5%

### 3.2 文档记账债（建议一次性清）

1. **`docs/ROADMAP.md` 止于 M77**，缺 M10、M19c/d、M20–M23、M29–M43、M48、M52、M57–M61、M63、M74、M78–M94。要么补行，要么在文件头显式声明「M78+ 以 `SESSION-SUMMARY-M76-M94.md` 为权威」。
2. **`ROADMAP.md` 有两条都叫 M62 的行**（:61「首页片头 ident」+ :65「画廊就绪三件套」）——M74 计划里本就写了要修订措辞，未执行。
3. **`docs/LESSONS.md` 编号重复**：151/152/153 各出现两次（M55/M56 一组、M62/M75 一组），151–160 段整体错位交叉（第 197–199 行顺序为 164、165、153）。需重排。
4. **`CHANGELOG.md` 缺 M84/M85/M88/M91/M93/M94**；**M74 在 ROADMAP 和 CHANGELOG 双缺**（内容见本文 §2.2）。
5. `index.json` 版本号语义混乱：文件内恒为 `version: 3`，而文档口语称 v4（creator/icon/files.json）、v5（pages）。建议字段代次与 `version` 对齐。

### 3.3 已核实的代码缺陷（可直接修）

| 位置 | 问题 | 影响 |
|---|---|---|
| `skills/design-clone/scripts/publish.mjs:125` | PROVENANCE 模板仍引用 v2 已删除的 `values.flavor` | 线上五个 app 的 PROVENANCE 标题全是 `# X (app/undefined)`。同文件 `:10` 注释也仍写 `publish/<app>-<flavor>-<ts>`（实际分支是 `publish/<app>-<ts>`）。注：`gates` 拼接是正确的，不受影响 |
| `repo/design-clone-prototype/README.md`、`CONTRIBUTING.md` | 仍是 **v1（flavor 两级目录）** | 与 `SPEC.md` v2 + `validate.mjs:79`（flavor 残留即 fail）**自相矛盾**；新贡献者照 README 做必被 pr-gate 拒 |
| `repo/design-clone-prototype/scripts/index.mjs:73` | 用了 `execSync` 但顶部 import（:6-8）**没有引入** | GitHub API 失败时的 `creator` 回退路径会抛 ReferenceError；当前靠 API 成功掩盖 |
| `repo/design-clone-prototype/scripts/index.mjs` | `apps.push({...})` 对象字面量里 `icon` 键出现两次 | 前者是死代码 |
| proto 仓本地工作副本 | 空 flavor 残留目录：`aliyun-console/web/`、`lark/desktop-mac/` 等 | M56 迁移用 shutil 覆盖而非 `git mv` 留下；git 不跟踪空目录，仅本地脏 |
| `skills/design-clone/references/publish-guide.md` | 标题写「SPEC.md v1」，步骤 4 仍列已删除的「flavor-shell 映射」门 | 半陈旧 |
| `site/data/release.json`、`site/favicon-test.html` | M72 删徽章后的遗留物（站点已不读 release.json） | 死文件 |
| 五个 app 的 `meta.platform` | `aliyun-console`/`lark` 为空串（run 的 `knowledge/scope.json` 缺字段） | 展示不全 |
| `ai-assistant` 的 meta | en 描述是通用模板句、zh 是具体内容，**双语不同源** | 违反 SPEC §3 |

### 3.4 长期未决（承接自 SESSION-SUMMARY §5）

- `brand-qa` 的 `logo-main.png stick-like=27` 仍是 warn（水波/发丝高光误报），未 fail，属目视复核项。
- 暗色 favicon 依赖 JS `applyTheme()` 切换，**无 `prefers-color-scheme` 静态回退**。
- logo 动图 316KB/214KB 仍可瘦身（降帧至 40 或尺寸 80px）。
- 三 agent headless 实证只 2/3：**claude code `-p` 在本机 403「Access to model denied」**（账号/模型资格问题，非 skill 问题），待有资格账号复验。
- 平台缺口：iOS 真机 WDA 未跑（本机无 Xcode）；Windows/Linux/HarmonyOS 只在 `doctor --onboard` 的 capability roadmap 里；三指/捏合手势 adb 不支持（已如实声明）。
- proto 仓 `index.json` 由仓 workflow 重扫；新增 app 发布走 `publish.mjs`。

---

## ④ 项目资源地图

### 4.1 空间布局（M89/M90 定稿，别改）
```
/Users/cqq/Project/design-clone/          项目空间根 = 非 git 仓，只有 repo/ + archive/
├── repo/design-clone/                    主仓（GitHub hello-cqq/design-clone）
│   └── design-clone-runs/                48 条目 / 2.3GB / gitignored ← 全部 run 产物
├── repo/design-clone-prototype/          proto 仓唯一管理副本（publish/批量 PR 均经此）
└── archive/                              过期资源：design-clone-runs-stale-20260915/、
                                          logo-source.png(1.7MB)、logo-source.mp4、
                                          logo-source-day.mp4、logo-source-night.mp4
```
生成物不入库：`publish-out/`、`site/data/thumbs/`（CI `pages.yml` 部署前 `sync-thumbs` 生成）。根目录禁放媒体源文件（M86）。

> ⚠️ **空间根不是 git 仓，这会导致 opencode 把会话归到 `global` 项目**。2026-09-15 已手动把 16 个 session 迁回；若将来又"丢会话"，先查这一点。回滚脚本：`/tmp/design-clone-session-rollback.sql`。

### 4.2 两个 GitHub 仓
| 仓 | remote | 内容 | HEAD |
|---|---|---|---|
| 主仓 | `git@github.com:hello-cqq/design-clone.git` | skill 本体 + 官网 `site/` + docs；133 commits；tag 至 `v0.6.0-snapshot.20260914.5` | `f59be15` |
| proto 仓 | `git@github.com:hello-cqq/design-clone-prototype.git` | 5 个已发布原型 + `index.json` + 3 workflow | — |

- 官网：https://hello-cqq.github.io/design-clone/
- 画廊数据源：https://hello-cqq.github.io/design-clone-prototype/index.json
- 首个 commit `b2f1b07`（09-03）把 M0–M20 一次性 squash；远程仓是 09-07 用户口头授权后才建的。

### 4.3 五个已发布原型
| slug | 中文名 | 来源 run | 版本 | downloads | pages | 备注 |
|---|---|---|---|---|---|---|
| `wechat` | — | `wechat-full` | 1.6.2 | 5 | 19 | `ip_attestation=public-material` + brand_disclaimer；shell `c_mobile` |
| `ai-assistant` | 星海对话 | `demo-assistant` | 2.1.2 | 4 | 5 | M75-W3 引入，M76-W3 十视图重做 v2.0.0；中英描述不同源待修 |
| `lark` | — | `mac-lark` | 1.6.2 | 4 | 14 | shell `c_desktop`；pages id 跳号（01-11,14,15,16） |
| `aliyun-console` | — | `web-aliyun` | 1.6.2 | 3 | 7 | shell `c_browser`；`meta.platform` 空串 |
| `petpark` | 动物乐园 | `demo-petpark` | 2.2.2 | 2 | 8 | commits 最多(19)；官网 live proof / 精选置顶默认用它 |

> M55 的五种子 ≠ 今天的五个：种子之一 `dy-note`（源 `link-dy4`）→ M76-W2 `--retire` 改名 `pet-health-note` → 再被 `ai-assistant` 替换；`pet-health-note` 现亦不在仓。

### 4.4 run 产物（`design-clone-runs/`，2.3GB）
28 个回归 run + 5 个 `<run>-v1` 重修前物理备份 + 3 个非 run 目录（`_asset-backups`/`_clean-src`/`_icon-probe`）+ 4 个 M77 概念 run（`gen-music`/`gen-shop`/`gen-study`/`gen-tea`）+ 8 个海外链接 run（`intl-yt1-3`/`tt1-2`/`fb1-2`）。

### 4.5 端口 map
`SESSION-SUMMARY-M76-M94.md` §3 的终态：4202 web-aliyun · 4203 web-apple · 4204 mac-lark · 4205 mac-workbuddy · 4791 slytherin · 4801 demo-assistant · 4802 wechat-full · 4804 link-dy4(pet-health-note) · 4806 demo-petpark · 4211 site 静态 · **4210 demo（已退役目录，端口保留无用）**。

**该 map 已丢失的 M77 四端口**（09-13 22:58 汇报的 13 服务）：**4811 拾光书房 · 4812 霓虹磁带 · 4813 山海茶事 · 4814 闪购集市**。另外 `publish.mjs` 内 `export-zip` 用 **4599**；分镜审阅页曾用 4310。

**早期端口约定（无处可查）**：4181/4182/4183 = 09-01 三 demo（微信 / 抖音车载 HMI / Moor AI），当时明令子代理「不要 kill 4181-4183」；4191/4192 = PM 子代理临时；4195–4205 = M14–M18 批量回归；4200 = `clone.mjs --serve` 默认。

### 4.6 本机环境配置
- **阿里云百炼 Token Plan 团队版**（会话 3 配置，base_url `https://token-plan.cn-beijing.maas.aliyuncs.com/apps/anthropic`）：
  | 工具 | 配置路径 | 状态 |
  |---|---|---|
  | Claude Code | `~/.claude/settings.json` | ✅ 验证通过 |
  | Codex | `~/.codex/config.toml` | ✅ 验证通过 |
  | Hermes Agent | `~/.hermes/config.yaml` | ✅ 验证通过 |
  | OpenClaw | `openclaw.json` 局部合并 + gateway restart | ⚠️ gateway `ready`、`agent model: bailian-token-plan/qwen3.6-plus`，但 CLI 被**与 key 无关**的飞书插件 bug 卡住（`@larksuiteoapi/feishu-openclaw-plugin@2026.3.8` manifest id 是 `feishu-openclaw-plugin` 而 JS export id 是 `feishu`，自身不一致） |
  - opencode 侧 provider = `bailian-token-plan`，模型 `qwen3.8-max`（可用池还含 qwen3.7-max / 3.6-plus / 3.8-flash / 3.7-plus / 3.6-flash / qwen-image-2.0）
  - 401 排错表：用错 base_url（`dashscope.aliyuncs.com` 是通用百炼、非团队版）/ 用了按量计费或 Coding Plan 的 key / key 复制不全 → 均报 401，症状不同但根因都是"计费模式与 base_url 不匹配"
- **系统代理 `127.0.0.1:29758`**：⚠️ **不回环 localhost**，经它访问本地服务一律 503（QA G4 因此判 env-fail，用例改直连断言 301）
- 生图：pollinations 免费匿名档（`genimg.mjs`）；图标：Iconify 免 key（`extract-assets --icon`）
- 设备：Xiaomi 真机（需开「USB 调试(安全设置)」）；macOS 需屏幕录制 + 辅助功能权限；本机**无 Xcode**
- `npx skills -g -y --copy` 需 `SKILLS_CLONE_TIMEOUT_MS=600000`

### 4.7 未入库的临时资产（重启即失，需要就趁早固化）
| 路径 | 内容 | 状态 |
|---|---|---|
| `/tmp/ls-day/`、`/tmp/ls-night/` | **M95 输入帧，各 193 帧** | 仍在 |
| `/tmp/m94-process.mjs` | M94 logo 双模式键控管线 | 仍在 |
| `/tmp/logo-anim-f/` | M93/M94 帧 | 仍在 |
| `/tmp/dc-handoff/` | 本次导出的 4 会话信号文本（user/assistant/files/todo） | 本次生成 |
| `/tmp/s2c` | s2c 源码克隆（M29–M41 深研） | 未核实 |
| `/tmp/qa-{pm-web,pm-android,test,design}` | 09-01 四子代理取证（结论已入 `docs/QA/`） | 未核实 |
| `/tmp/qa-gen-{music,shop,study,tea}` | M77 四稀薄输入验收 | 未核实 |
| `/tmp/qa-m84-*`、`/tmp/qa-m85{,b}-{as,pp,wx}` | 星海/动物乐园/微信选中框验收 | 未核实 |
| `/tmp/dc-*.log` ×98 | 各 run 回归日志 | 未核实 |
| M78-1 的「簇跟踪色彩擦 + 笔杆几何 poly 插值擦 179 帧」脚本 | ident 铅笔根除管线 | **很可能只在 /tmp，复跑需重建** |

### 4.8 脚本索引
见 `SESSION-SUMMARY-M76-M94.md` §4。总量：`skills/design-clone/scripts/` 下 **103 个脚本**（.mjs/.sh/.py），全部 `--help` 可裸 bash 调用。分组：入口（`entry`/`clone`/`doctor`）、采集（`web/`、`android/`、`desktop/`、`ios/`、`link/`）、知识（`tokens`/`dedup`/`extract-assets`）、生成（`gen/` 29 个）、图像（`img/` 5 个 + `genimg`）、QA（`qa/` 14 个 + `eval/eval.mjs` + `regress.mjs` + `autofix.mjs`）、外壳（`build-shell.mjs` 17 段 concat + `sync-shell` + `serve` 4 模块）、发布（`install.sh`/`release.mjs`/`publish.mjs`/`package.mjs`）。站点侧 `site/tools/{e2e,loadtest,brand-qa,sync-thumbs,hash-assets}.mjs`。

---

## ⑤ 如何继续

### 5.1 起步动作
```bash
cd /Users/cqq/Project/design-clone          # 空间根（非 git 仓）
cat repo/design-clone/AGENTS.md             # 开发约定 + 必读文档清单
cat repo/design-clone/docs/VISION.md        # 诉求与定位（唯一权威）
cat repo/design-clone/docs/SESSION-SUMMARY-M76-M94.md   # 当前状态 + 门禁 + 端口
```
改任何东西前的必读顺序：`VISION` → `DECISIONS` → `LESSONS` → `ROADMAP`。

### 5.2 门禁命令（发布前必跑）
```bash
cd repo/design-clone
node skills/design-clone/scripts/doctor.mjs
node skills/design-clone/scripts/regress.mjs          # 28 run 全门汇总
node skills/design-clone/scripts/qa/interact.mjs --run <run> --base http://localhost:<port>   # dead=0 硬门
node skills/design-clone/scripts/qa/inspect.mjs --run <run>
node skills/design-clone/scripts/qa/ui-smoke.mjs --run <run> --base http://localhost:<port>
node site/tools/e2e.mjs && node site/tools/loadtest.mjs && node site/tools/brand-qa.mjs
```
门清单详见 `docs/GATES.md` + `SESSION-SUMMARY-M76-M94.md` §2。

### 5.3 发布新原型
```bash
node skills/design-clone/scripts/gen/cover.mjs --run <run> --base <url>   # cover 必须先有，否则 publish die
node skills/design-clone/scripts/publish.mjs --run <run> --app <slug> \
  --title "<name.en>" --title-zh "<name.zh>" --tags a,b,c \
  --attest original|licensed|public-material [--retire oldSlug] [--dry]
```
管理副本路径规则：优先 `<space>/repo/design-clone-prototype`，回退旧 prototype-repo，再回退 `~/.cache/design-clone-publish/<repo>`。门强验：`interact total_dead=0` + `inspect fail=0` + `ui-smoke fail=0` + `knowledge/privacy.json` 在场，否则 die。

### 5.4 协作约定（会话里反复确立、文档没写）
- **口令**：用户回「开工 / 继续 / 执行 / 开始」= 批准上一轮计划立刻执行。助手侧固定套路 = 研究完毕 → 出计划 → 确认即执行。
- **夜间授权自主跑**：用户两次说过「我下班了，所有权交给你了」「不要停下来，不要问我，我要睡觉了」。
- **有界自修复纪律**：≤3 轮、单轮只修一类、分数回退即回滚、超限写 LESSONS 交人工。
- **skill-first**：用户 09-03 15:09「问题优先要在 skill 中解决，别我们自己在使用过程中逐个解决了，结果给别人用的时候还是一堆坑」→ 先改工具链，再 retrofit 存量 run。
- **通用性优先**：反复被否的是「特定问题特定解法」（09-04 20:01「难道只针对微信就够了」）。品牌规范不许写进 prompt，要走 `templates/components/{mobile-im,desktop-app,web-marketing}`。
- **上下文预算**：用户三次报「直接截图并读取会频繁触发 opencode compact」→ **逐张读或先 downscale/裁剪再喂 VLM，绝不循环压缩**；读图前先过 `img/view.mjs`。
- **「改了没变化」类报障的固定排查序**：① 先怀疑缓存（查询串破缓存会被浏览器启发式缓存忽略，必须**文件名哈希**，M49 才根治）→ ② 再怀疑 serve 未重启（LESSONS 147：改 serve/export 代码必重启）→ ③ 最后才看代码。
- **品牌资产一律以用户定稿源为准**（LESSONS 155/159/160）：角色美术的最终裁决权在用户的生成工具，别和免费档模型硬磕风格。手绘 SVG 吉祥物连做三版全被否「好丑」。
- **图片附件会静默丢失**（M52 复现坑）：用户发的图可能只到「JPG 占位图标」，需要时明确要求给本地路径。
- **环境坑**：macOS 无 `timeout` 命令；bash UTF-8 locale 下 `$VAR（中文括号` 会吞多字节字符进变量名（安装器必须写 `${VAR}`）；opencode headless `run` **自动拒绝外部目录**（/tmp 全禁，e2e 必须用 cwd 内相对路径）；pollinations 匿名档 `nologo` 参数无效，落盘后必须 `patch-erase` 右下 165×36。

### 5.5 想读原始会话
```bash
cd /Users/cqq/Project/design-clone
opencode session list -n 30        # 4 个主会话在列；子代理会话挂在父会话下不单独列出
# 或在 TUI 里直接 resume 上表任一 session id
```

只读直查会话库（不启动 opencode）：
```bash
DB="file:$HOME/.local/share/opencode/opencode.db?mode=ro"
IDS="('ses_fa51a4abdffeS6Nh5oRuSPVVnj','ses_f740c68a3ffeuvvmVITZuYyS2x','ses_f7227de4cffettVoe64ktAMoK6','ses_f66b13af8ffeHEDUiBm3EJllDb')"
# 用户指令流（设计意图的来源，最值钱，共约 982 条 / 120KB）
sqlite3 "$DB" "SELECT datetime(p.time_created/1000,'unixepoch','localtime')||'  '||json_extract(p.data,'\$.text')
  FROM part p JOIN message m ON m.id=p.message_id
  WHERE p.session_id IN $IDS AND json_extract(p.data,'\$.type')='text'
    AND json_extract(m.data,'\$.role')='user' ORDER BY p.time_created;"
# 助手输出流（约 6769 条 / 2.4MB，按需 grep）：把上面的 role 改 'assistant'
# 触及过的文件：json_extract(p.data,'\$.type')='patch' → json_extract(p.data,'\$.files')
# 未决 todo：SELECT status,priority,content FROM todo WHERE session_id IN $IDS;
```
> ⚠️ 库 3.3GB / WAL 模式。查询务必带 `?mode=ro`，且**不要在 opencode 运行时写库**。
> 本文的原始抽取产物在 `/tmp/dc-handoff/`（重启即失，可按上面的 SQL 重建）。

