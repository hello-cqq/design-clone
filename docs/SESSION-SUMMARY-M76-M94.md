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

## 2. 门禁清单（当前）
- regress（28 run）：interact dead=0 / inspect / ui-smoke / paths-qa。
- inspect：`art-depth`（original run 分层+粒子）、`sel-ring-align`（选中框活跟踪 ≤3px）、design-artifacts、view-weight、cover-geometry、pasted-screenshot 等。
- brand-qa：ident faststart（moov<mdat）、残铅木杆签名、细长笔杆签名(warn)、角标水印、**logo veil 门**。
- site e2e：ident 播放/主题联动、画廊巡检（全 app proto 就绪+console 干净）、demo 断言（步骤用户视角/离屏点击即播/重播/step4 交互动效）、logo 锁排/主题切换/favicon 主题化、标签单行+搜索推荐、导出 zip download、移动端横溢。
- loadtest：1000 req 0 错（p95 ≈100ms）。
- proto 仓 pr-gate：cover 3:2≤300KB≥900w、icon≥256、双语 meta、3–6 tags、asset 白名单。

## 3. 服务/端口 map（本地）
4202 web-aliyun · 4203 web-apple · 4204 mac-lark · 4205 mac-workbuddy · 4791 slytherin · 4801 demo-assistant · 4802 wechat-full · 4804 link-dy4(pet-health-note) · 4806 demo-petpark · 4211 site 静态 · 4210 demo（已退役目录，端口保留无用）。

## 4. 关键脚本索引
- 生成：`genimg.mjs`(双 rect 擦水印)、`enrich.mjs`、`style-pick.mjs`、`cover.mjs`、`appicon.mjs`、`gallery-meta.mjs`、`collect-design.mjs`、`export-zip.mjs`、`patch-erase.mjs`、`brief-flows.mjs`、`ref-images.mjs`。
- QA：`qa/interact.mjs`、`qa/inspect.mjs`、`qa/ui-smoke.mjs`、`paths-qa.mjs`、`site/tools/{e2e,loadtest,brand-qa,sync-thumbs,demo-shots(退役引用)}.mjs`。
- 发布：`publish.mjs`（管理副本=space/repo/design-clone-prototype；export/all.zip 自动预构建；--retire）。
- logo 管线（会话内脚本，未入库）：/tmp/m94-process.mjs（双模式键控+posterize+裁切）——如需复跑：源=`archive/logo-source.mp4` 抽帧 /tmp/logo-anim-f → node /tmp/m94-process.mjs → img2webp 编码。

## 5. 未决/后续
- brand-qa `logo-main.png stick-like=27` 为 warn（水波/发丝高光误报），目视复核项，未 fail。
- logo 动图 316/214KB：如仍需瘦身可降帧至 40 或 80px。
- proto 仓 index.json 由仓 workflow 重扫；新增 app 发布走 publish.mjs。
- 暗色 favicon 依赖 JS 切换（无 prefers-color-scheme 静态回退）。
