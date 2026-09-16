# 会话总结（M76–M94，2026-09-12 → 2026-09-15）

> 本会话承接 `design-clone-1`（ses_f66b…，M76-W8 ident 播放修复链）之交接，覆盖 M76–M94 全部波次。
> 落盘时间：2026-09-15。仓库：`hello-cqq/design-clone`（HEAD `4a87925`）+ proto 仓 `hello-cqq/design-clone-prototype`。

## 0. 项目空间布局（M89/M90 定稿）
- 空间根 `/Users/cqq/Project/design-clone/` = 项目目录（非 git 仓）：仅 `repo/` + `archive/`。
- `repo/design-clone/` = 本仓 GitHub 代码；run 产物在其 gitignore 的 `design-clone-runs/`（2.3G）。
- `repo/design-clone-prototype/` = proto 仓唯一管理副本（publish/批量 PR 均经此；`publish.mjs` 管理路径=`<space>/repo/design-clone-prototype`，回退旧 prototype-repo 与 ~/.cache）。
- `archive/` = 开发过期资源归档（`design-clone-runs-stale-20260915`、`logo-source.png`、`logo-source.mp4`）。
- 生成物不入库：`publish-out/`、`site/data/thumbs/`（CI pages.yml 部署前 sync-thumbs 生成）。

## 1. 波次纪要
### M76 全能大佬波
- W1 铅笔根除 v1（logo-main 双笔尖+girl 坏补丁+ident 哈希名防缓存）+ brand-qa 分区像素门。
- W1b 字标逐字错落艺术字（渐变材质 clip，后退役于 M91）。
- W2 画廊数据：dy-note→pet-health-note 内容命名；策展官方图标（wechat 绿双泡/lark 蓝翼）；probe-icon 官方 URL 策展表。
- W2c 贡献者=owner∪作者、去 creator 标签；publish 提交作者固定 hello-cqq noreply。
- W3 原神级 2.5D：`references/art-direction.md` + genimg `anime-cel` 锚点 + enrich `art_direction` + 模板 particles/parallax FX + inspect `art-depth` 门；assistant/petpark 十视图重做 v2.0.0。
- W4 演示真景截屏（后退役于 M81 矢量重做）。
- W5 移动横溢清零、thumbs 哈希化、e2e 画廊巡检。
- W6-W8（并发会话）：ident 播放修复链（去 load 门控/看门狗/元素自愈/faststart/哈希名）。

### M78–M80
- M85 选中框活跟踪：rAF ticker 每帧贴合（`60-canvas.js` liveTrack）+ `loadView` 后 `redraw()`（视图重渲染销毁 overlay 节点根除）+ inspect `sel-ring-align` 门。
- M84 演示点击即播：show() 强制活层+最小滚入；IO 恢复分支对已跑完场景重播。
- M86/M87/M89/M90 仓库卫生与空间重组（见 §0）。
- M80 ident-light 整源替换为用户无铅笔新视频（`女生视频3.mp4`：逐帧水印 inpaint+hflip+880x660 crf19 faststart）。

### M81–M83
- M81 演示矢量迷你 UI 重做（四场景品牌微文案+循环交互动效 px-*）；静态托管导出=all.zip 预构建（`gen/export-zip.mjs`+publish 集成+110-export 405 回退 GET zip）；播放 journeys 兜底+assistant/petpark 真 journeys。
- M82/M83 功能演示切换零重建（四场景预挂+display 切换+_play）。
- M83 站点 logo 换用户新标（lockup/mark/favicon/apple/og）+主题冰蓝微调（light `--acc #2f6ea5` 系、dark `--acc #7fb3e0` 系、btn.pri 止色冰蓝）。

### M93–M94 logo 动图与透明纯度
- M93 导航 logo=用户视频动图：193 帧去水印（22–77 帧角标）+硬键透明+裁切去字行 → 60 帧@12fps 96px animated webp（img2webp -mixed）；标签/og/apple 静图。
- M94 透明纯度+暗色适配：逐帧四角中位数 bg、硬键 alpha=clamp((dist-36)/8)、alpha-unmix 去色边、近零半透明清零、雾斑/碎片连通域清除、底部字行背景填充；暗变体=flood-key（封闭填充保留）+三档冰蓝 posterize+仅主连通域；主题联动切换 `.logolock` src 与 favicon href；brand-qa veil 门（512 静图孤立半透明<0.75%：light 0.499%/dark 0.193%）。
- 资产：`logo-anim-light.webp`(316KB)/`logo-anim-dark.webp`(214KB)/`logo-mark{,-dark}.png`/`favicon{,-dark}.png`/`apple-touch-icon.png`。

### M95 logo 绿幕源重制（2026-09-15）
- 源：用户绿幕视频 `archive/logo-source-day.mp4` / `-night.mp4`（720×720/24fps/193 帧；背景=鼠尾草绿非纯绿，day≈(145,164,144)/night≈(103,131,110) 带轻渐变）。
- 管线（会话脚本 /tmp/m95-process.mjs，未入库）：逐像素**平面拟合 bg**（边缘采样最小二乘 a+bx+cy，根治渐变 halo）→ 软键 `a=clamp((dist-26)/14)` → despill（半透明像素 G≤max(R,B)+20）→ despeckle<4 + 孤立低 alpha 清除 + <300px 连通域清除 → 字行(y564-614)/水印(x8-145,y8-58，逐帧检测 27/60 帧出现)先以平面 bg 填充 → 固定裁切 (70,13,606²)（并集 art bbox x80-666/y71-561+pad 平方化）。
- light=day 原色（白填充保留不透明，亮导航近白融底）；dark=night 键控后三档冰蓝 posterize（#e8f2fa/#96bee0/#5f93c4）。不再需要 M94 的 flood/连通域猜测（填充与背景色可分离）。
- 产出（文件名不变，零站点改动）：webp 60 帧@12fps 96px `img2webp -loop 0 -mixed -q 70`：light 262KB/dark 243KB（M94=323/218）；静图 logo-mark{,-dark}/favicon{,-dark}/apple-touch-icon/logo-lockup（frame 160，艺术全展帧）。
- 门禁：veil 门收紧 0.75%→**0.5%** 实测 light 0.221%/dark 0.366%；brand-qa/e2e/loadtest 全绿（1000req 0 错 rps 1536 p95 75ms）；双主题导航目视通过。

## 2. 门禁清单（当前）
- regress（26 入集 run）：interact dead=0 / inspect / ui-smoke / paths-qa。
- inspect：`art-depth`（original run 分层+粒子）、`sel-ring-align`（选中框活跟踪 ≤3px）、design-artifacts、view-weight、cover-geometry、pasted-screenshot 等。
- brand-qa：ident faststart（moov<mdat）、残铅木杆签名、细长笔杆签名(warn)、角标水印、**logo veil 门**。
- site e2e：ident 播放/主题联动、画廊巡检（全 app proto 就绪+console 干净）、demo 断言（步骤用户视角/离屏点击即播/重播/step4 交互动效）、logo 锁排/主题切换/favicon 主题化、标签单行+搜索推荐、导出 zip download、移动端横溢。
- loadtest：1000 req 0 错（p95 ≈100ms）。
- proto 仓 pr-gate：cover 3:2≤300KB≥900w、icon≥256、双语 meta、3–6 tags、asset 白名单。

## 3. 服务/端口 map（本地）
4202 web-aliyun · 4203 web-apple · 4204 mac-lark · 4205 mac-workbuddy · 4791 slytherin · 4801 demo-assistant · 4802 wechat-full · 4804 link-dy4(pet-health-note) · 4806 demo-petpark · 4211 site 静态 · 4210 demo（已退役目录，端口保留无用）。

## 4. 关键脚本索引
- 生成：`genimg.mjs`(双 rect 擦水印)、`enrich.mjs`、`style-pick.mjs`、`cover.mjs`、`appicon.mjs`、`gallery-meta.mjs`、`collect-design.mjs`、`export-zip.mjs`、`patch-erase.mjs`、`brief-flows.mjs`、`ref-images.mjs`。
- QA：`qa/interact.mjs`、`qa/inspect.mjs`、`qa/ui-smoke.mjs`、`paths-qa.mjs`、`site/tools/{e2e,loadtest,brand-qa,sync-thumbs,hash-assets}.mjs`。
- 发布：`publish.mjs`（管理副本=space/repo/design-clone-prototype；export/all.zip 自动预构建；--retire）。
- logo 管线（会话内脚本，未入库）：**M95 现行** /tmp/m95-process.mjs（平面拟合绿幕键控+posterize+固定裁切）——复跑：源帧 /tmp/ls-day、/tmp/ls-night（各 193，重启即失，需从 archive/logo-source-{day,night}.mp4 重抽 `ffmpeg -i src %04d.png`）→ node /tmp/m95-process.mjs → img2webp 编码（命令见 M95 节）。M94 白底启发式版 /tmp/m94-process.mjs 已退役。

### M96–M98 终极大审查波（09-15→16）
- M96 README 美化：双主题动图 GIF 头、架构分层图（六层+数据流芯片+VLM 贯穿轨）、功能全景图（四演示 s1/s3/s4 合成）。
- M97 清债 W1-W3：ip-scan 登记制、e2e 死区复活、publish 门真读、css 去重 240 行、jump 移面包屑行、parity/fidelity/audit 真 exit、brand-qa 挂 CI、GATES 全量清算。
- M98 W4-W5：proto 资产契约归一（PR#63：icon/cover/PROVENANCE/meta/SPEC/validate/index.yml）、下架 app Release/tag 清理、doctor 能力矩阵真值化、sim-capture record、motion.js/CDN 教学根除、文档漂移清、稳定版 v0.6.0。

## 5. 未决/后续
- brand-qa `logo-main.png stick-like=27` 为 warn（水波/发丝高光误报），目视复核项，未 fail。
- logo 动图 M95 后 262/243KB；如仍需瘦身可降帧至 40 或 80px。
- ~~暗色 favicon 无静态回退~~：M98-W2 已加 `prefers-color-scheme` 双 link（e2e 断言同步改 querySelectorAll）。
- proto 仓 index.json 由仓 workflow 重扫；新增 app 发布走 publish.mjs。
- claude code headless 403（账号资格）待有资格账号复验；iOS 真机 WDA 未跑（本机无 Xcode）。
- proto 仓 index.json `version: 3` 字段代次与文档口语 v4/v5 不对齐（建议专项：字段代次与 version 对齐）。
