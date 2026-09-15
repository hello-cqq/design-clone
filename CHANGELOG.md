# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/); versioning is SemVer and mirrors `SKILL.md → metadata.version`.

## [Unreleased]

未发车的快照变更（M74 与 M84–M95；此前仅记于 git log / SESSION-SUMMARY / SESSION-HANDOFF）。

### M74
- : 并发方案归并裁决——安装 UI=站点单命令方案胜出（渠道仅留 CLI `--ref/--channel` 旗标，不恢复渠道 UI）；index v5 pages 定为 spec 页数据源；死代码清理（site.js relbadge 块、pages.yml release.json 嵌入步，落于 M75-W7a）；核实 M63.1 修复在 M73 后仍生效（详见 docs/SESSION-HANDOFF.md §2.2）

### M84
- : replay 图标 34px+去步进整箱闪动；静态托管导出全部=预构建 export/all.zip（gen/export-zip.mjs+publish 集成+110-export 405 回退 GET zip）；播放 journeys 缺失时 paths 兜底+assistant/petpark 真 journeys；五 app 重发布含 all.zip+journeys；e2e 播放/导出 zip 断言

### M85
- : 选中框/演示 ring 活跟踪（rAF ticker 每帧贴合）+标注 scroll/zoom 节流重绘+inspect sel-ring-align 门；五 app 外壳同步并重发布 x.1

### M86
- : 仓库卫生——剔除根媒体/参考图/publish-out/thumbs/旧 demo 资产等 tracked 垃圾+gitignore 生成物；prototype-repo 统一纳管 proto 仓+publish 复用；fix：featured 卡片 thumbs manifest 先载再渲染（修无哈希 404）+e2e iframe ready 重试抗边缘冷启动；fix2：loadView 后 redraw() 根除选中框跟踪脱靶；28 run 外壳同步、五 app x.2 重发布

### M87
- : 项目空间重组——repo/ 双仓统一+archive/ 归档+publish 管理副本切同级 proto 仓+仓内 prototype-repo 删除；fix：管理副本切换补落

### M88
- : 功能演示点击即播——show() 强制活层+舞台不可见时最小滚入；IO 恢复分支对已跑完场景重播；e2e 离屏点击自动播放/重播断言

### M89/M90
- : 空间布局定稿——GitHub 代码入 repo/design-clone/、proto 仓 repo/design-clone-prototype/、archive/ 归空间根；publish 管理路径与 .gitignore/AGENTS/CHANGELOG 同步（M89 为目录修正中间步）

### M91
- : 站点 logo 换用户新标（lockup/mark/favicon/apple/og 派生资产+导航页脚锁排图）+主题冰蓝微调（light/dark acc 系/btn.pri 止色）+字标 CSS/e2e 断言退役更新

### M93
- : 导航 logo 改用户视频动图（193 帧去水印+硬键透明+裁切去字行，60 帧@12fps 96px animated webp，img2webp mixed）；标签/og/apple 保持静图；暗主题亮度提升融入

### M94
- : logo 透明纯度+暗色适配——逐帧四角中位数 bg+硬键+alpha-unmix+雾斑/碎片清除+底部字行填充；暗变体=flood-key 封闭填充保留+三档冰蓝 posterize+仅主连通域；主题联动切换 lock src+favicon href；brand-qa veil 门（<0.75%，实测 0.499/0.193%）

### M97
- : 仓清理 ~17.4MB——智能助理/ 四参考图（13MB 零引用）移空间 archive/智能助理-ref/ 后 git rm；site/assets 死资产九件 git rm（logo-girl/boy、logo-light/dark、logo-main-256、logo-lockup、logo-anim.webp、ident 双 poster jpg——poster 已内联 base64）；死代码清（site.js .logoimg 切换行、site.css 双 .logoimg 块）；brand-qa 铅笔/角标门名单收敛为不透明合成资产（logo-main/favicon），透明键控资产走 veil 门；架构图 v2 分层重画（六层带+mono 模块盒+层间数据流产物芯片+宿主 VLM 贯穿轨，文字量-70%）替换 docs/img/architecture{,-dark}.png

### M96
- : README 美化+双图——头部 🥷 换双主题动图 GIF（<picture> light/dark，168px）；hero alt 错配修正（PetPark→星海对话）；新增 Architecture 节（核心管线六阶段双主题 PNG，不涉官网）与 From any source to a playable prototype 节（官网四演示 s1/s3/s4 层拆分合成的双语全景图）；六资产入 docs/img/；zh 版同步

### M95
- : logo 绿幕源重制（archive/logo-source-{day,night}.mp4）——平面拟合逐像素 bg+软键+despill+去字行/水印填充+主块保留；light=day 原色（白填充保留）、dark=night 三档冰蓝 posterize；webp 262/243KB（原 323/218）；veil 门收紧 0.5%（实测 0.221/0.366%）

## [0.6.0-snapshot.20260914.5] - 2026-09-14

Snapshot build（prerelease）。覆盖自上一 tag 的全部变更；正式版手动发车（--minor）。

### M83
- : 演示四场景预挂零卡顿切换(167ms)+replay 刷新图标+规范卡/可玩原型场景差异化与循环交互动效(tap/sheet/heart/tab/caret/row/status)+在线体验白名单五 app+原型仓下架五 app(PR47)+e2e 断言

## [0.6.0-snapshot.20260914.4] - 2026-09-14

Snapshot build（prerelease）。覆盖自上一 tag 的全部变更；正式版手动发车（--minor）。

### M82
- : 功能演示修正——微信去真名改虚构通用会话；步骤描述改用户视角（打开/捕获/解析/生成）；右侧重做=设计规范卡(s3)+站点风成品原型卡(s4, 规范卡淡出为底)+解析/生成连接标签；e2e 增无真名与步骤文案断言

## [0.6.0-snapshot.20260914.3] - 2026-09-14

Snapshot build（prerelease）。覆盖自上一 tag 的全部变更；正式版手动发车（--minor）。

### M81-fix
- : qsuggest[hidden] display none（面板不再挡标签行）+ e2e blur/单行/推荐断言修正

### M81-W1/W2/W3
- : 六 app 概念图标+封面重生成并重发；sync-thumbs 哈希化+manifest（根治旧封面缓存）；功能演示=品牌微文案迷你 UI 重做；标签行单行高频+搜索标签推荐下拉

## [0.6.0-snapshot.20260914.2] - 2026-09-14

Snapshot build（prerelease）。覆盖自上一 tag 的全部变更；正式版手动发车（--minor）。

### M80
- : ident-light 整源替换为用户无铅笔新视频（女生视频3）——左上水印+倒影逐帧 inpaint、hflip 对齐现网构图（坐姿朝右/躺姿头右）、880x660 crf19 faststart；poster 内联+logo-light 重裁+ident js 重哈希；brand-qa 增细长笔杆签名(warn 级)+木杆/角标/faststart 硬门全绿

## [0.6.0-snapshot.20260914.1] - 2026-09-14

Snapshot build（prerelease）。覆盖自上一 tag 的全部变更；正式版手动发车（--minor）。

### M79-W2/W3
- : 功能演示改站点风矢量引导动画（线描设备 glyph+描绘连接+进度+帧芯片门控，弃截图）；ident 光晕掩膜收紧（亮色灰烟环消除）；全 179 帧木杆签名复核 0 残铅

### M79-W1
- : 官方图标修正——飞书双翼/阿里云橙标入 official-icons 并替换 run icon+三封面重生成（修封面内嵌旧图标）+v1.5.0 重发+probe-icon 官方 URL 策展表

## [0.6.0-snapshot.20260914] - 2026-09-14

Snapshot build（prerelease）。覆盖自上一 tag 的全部变更；正式版手动发车（--minor）。

### M78-3
- : 画廊缩略图同源缓存 sync-thumbs.mjs（cover jpg+icon 取自发布 icon.png）+卡片优先同源 onerror 兜底 proto+featured 挂 IO；pages.yml 部署前同步——根治封面/图标空白

### M76-W8f
- : ident 元素级自愈引导（跨重建/闭包失配/stall 仍能拉起当前主题视频）+新哈希名

### M78-1
- : v1 女生视频回归+铅笔根除（簇跟踪色彩擦+笔杆几何 poly 插值擦，179 帧）→ ident-light.ffdc4887；poster/ logo-light 同步 v1 帧；ident.js 重哈希；brand-qa 绿

### M76-W8d
- : 合并并发会话 ident 资产（ident-light 9d02b717 无铅笔快循环+logo-light 更新）与 W8 播放修复（去 load 门控/看门狗/boot preload/duo 懒挂/logo 减重/ident.js 哈希名）；brand-qa faststart+e2e 无Range HTTP 门全绿

### M76-W8c
- : ident.js 文件名哈希防边缘缓存发旧（preload/看门狗版必达）

### M76-W8b
- : 首屏连接争用修复——logo-main 1.9MB→358KB(palette png)、duo 背景懒挂、boot 即 preload 当前主题视频、demo 真景图进视口才 mount；e2e 适配懒挂载

### M76-W8
- : ident 播放修复——去 window.load 门控+看门狗重试（Pages stall 不再卡播放）；ident-dark 重封装 faststart；publish 白名单补 knowledge/tokens.css 并重发六 app；门禁：e2e 无 Range HTTP ident 推进断言+brand-qa faststart 检查

## [0.6.0-snapshot.20260913.3] - 2026-09-13

Snapshot build（prerelease）。覆盖自上一 tag 的全部变更；正式版手动发车（--minor）。

### M77-W4
- : 四稀薄场景全流程实测发布（拾光书房/霓虹磁带/山海茶事/闪购集市）+brief-views 基线视图合成入 skill+privacy 账本模板+docs M77 记账

### M76-W7h
- fix: poster 内联改用模板插值 ${POSTER_*}（修复字面量 URL）
- : ident 双 poster 内联 base64——hero 视觉零远程依赖，边缘再慢也先出海报帧，视频作渐进增强

### M76-W7g
- : ident-light 降码率重编（704x528 crf23 faststart，2.6MB→~1MB）——冷边缘首载提速；哈希更新

### M76-W7f
- : afterLoadOr 兜底——边缘拖死 load 时缩略图/live-proof 于 DCL+3.5/4s 照挂（ident 已有 2.5s 兜底），页面功能不依赖 load 事件

### M76-W7e
- : breadcrumb 断言含英文名（Animal Paradise）

### M76-W7d
- : e2e 改 load 语义（懒加载远程嵌入不再适用 networkidle）+breadcrumb 断言对齐精选=智能助理

### M77-W1..W3
- : 概念导演管线（director/ref-images/brief-tokens/products/flows/views+九aspect集成+brief-director门）；星海对话 v3.0.0（新海诚2.5D双角色5视图）；动物乐园 v3.0.0（疯狂动物城3D 8视图7角色）；genimg 缓存键含风格+双路径擦水印+shinkai/zootopia 锚点

### M76-W7c
- : 画廊缩略图 IO 延载+ident preload=none 且 load 后开播——主文档 load 不再等待任何 proto 边缘/媒体请求（首页卡加载根除）

### M76-W7b
- : hash-assets.mjs 入 CI——部署前站点子资产内容哈希+html 重写（破 Pages 边缘 max-age=600 旧 js 混搭）；未哈希原件保留兼容旧边缘 index

### M76-W7
- hotfix: live-proof iframe 延迟到 load+idle 挂 src（proto 边缘慢不再拖主文档 load）；ident 1.5s 空载强制 load()+play() 重试+活跃视频 preload=auto

## [0.6.0-snapshot.20260913.2] - 2026-09-13

Snapshot build（prerelease）。覆盖自上一 tag 的全部变更；正式版手动发车（--minor）。

## [0.6.0-snapshot.20260913.1] - 2026-09-13

Snapshot build（prerelease）。覆盖自上一 tag 的全部变更；正式版手动发车（--minor）。

### M77-W1(并发会话产物收口)
- : brief-flows.mjs（brief.flows→paths.json）+ appicon/cover/gallery-meta/inspect 的 brief.json 联动；根目录用户源文件移除（已归档 _clean-src）

### M76-W6
- : 用户干净源替换——ident-light 重编码(无铅笔)+poster+logo-light 帧裁；logo-girl/duo/256/favicon/fill 由无铅笔 jpg 重建(水印渐变域填充)；brand-qa 升级(暗发邻域残铅+连通域+角标文字行+椭圆掩膜感知)

## [0.6.0-snapshot.20260913] - 2026-09-13

Snapshot build（prerelease）。覆盖自上一 tag 的全部变更；正式版手动发车（--minor）。

### M76-W5b
- : e2e 主题断言改渐变材质差值（字标不再用 background-position 换主题）

### M76-W5a
- : e2e 画廊全 app 巡检（proto 页舞台+console 干净）+__DC_STATE 测试钩子+docs M76 记账

### M76-W4
- : 功能演示真景化——demo-shots.mjs 四场景真截屏入仓，demo-anim 设备框内嵌真图+扫描线/spec chip/playable 叠层，替换灰色骨架

### M76-W3
- : 原神级 2.5D 质感——art-direction.md+anime-cel 锚点+enrich art_direction；模板 particles/parallax FX；inspect art-depth 门；genimg 落盘自动擦水印；assistant/petpark 十视图重做全门绿并发布 v2.0.0

### M76-W2c
- : 贡献者展示=owner∪作者、 commits 序、去 creator 标签；publish 提交作者固定 hello-cqq noreply（头像归属正确）

### M76-W2a
- : dy-note→pet-health-note（萌宠健康笔记）——link 来源名称跟内容走（gallery-meta IS_LINK）+内容图标/封面+publish --retire 同 PR 下架旧 slug

### M76-W1b
- : 字标逐字错落艺术字——12 字独立 baseline/旋转/字号差+主题高饱和渐变材质 clip（亮=海蓝金橙/暗=星蓝紫青），nav 27px；e2e 断言错落与材质

### M76-W1a
- : 铅笔根除——logo-main 双笔尖+logo-girl 坏补丁清理（patch-erase 多 pass+缝模糊）；衍生 256/favicon/fill 重生成；ident mp4+poster 文件名哈希防缓存；brand-qa.mjs 分区像素门入 CI 前置

## [0.6.0-snapshot.20260912] - 2026-09-12

Snapshot build（prerelease）。覆盖自上一 tag 的全部变更；正式版手动发车（--minor）。

### M75
- docs: LESSONS 168-170 + ROADMAP M75

### M75-W7b
- : e2e 断言对齐 M75-W1 字标（wordmark span/art-clip/footer）+ demo-assistant products.json 三要素补齐并发布 v1.1.0

### M75-W7a
- : M74 遗留清理——删 relbadge 死块与 pages.yml release.json 步；specrow 改 index v5 pages 优先（旧索引回退）

### M75-W5
- : 移动端横溢清零（顶栏 wrap+ghbtn 紧凑+ident 内夹）360/390 全页 0 溢出；e2e 移动套件加 360+proto 横溢断言与步骤轨断言

### M75-W6
- : 四功能演示真景化——编号步骤引导轨(1-4 可点跳步/双语/主题感知)+微信绿头+底部 tabbar/抖音关注推荐顶 tabs+底 nav/mac 菜单栏+Dock/网页多标签；demo-anim z-order 修正

### M75-W3
- : 智能助理 demo（brief+5 视图全门绿：interact 0/inspect 43-0/ui-smoke 28-0/critique 5x5）发布 ai-assistant v1.0.0；官网 live proof/精选置顶/README banner 换助理；波形 inline 修复；appicon icon.png 复制时序修复

### M75-W2
- : enrich.mjs 稀薄输入富化（离线词表+hints 注入+rubric 自检循环建议）+ references/prompt-enrichment.md + SKILL 工作流硬步骤

### M75-W4
- : 官方名优先(official-names.json+gallery-meta 自动命中)+probe-icon.mjs 官方图标探测+asset-sourcing.md 取材工作流+封面名称自适应不截字；种子五 app v1.3.0/v2.1.0 重发布（微信/阿里云/飞书/抖音/PetPark 短名+官方形图标+新封面）；publish 缓存克隆复用修超时

### M75-W1
- : 艺术字标——主题生图双联(昼/夜)作字形填充(background-clip:text)，亮=海空带/暗=星月带，与头像图标同源；nav+footer 统一；SVG 字标下线

### M75-W8
- : 通用 patch-erase.mjs（patch-match lite+streak+track+srcreplace）+ 女形象耳后铅笔完美去除（logo-girl/logo-main/256/favicon/ident-light.mp4 179 帧三段键帧移植）+ references/asset-retouch.md 配方与边界；原片备份于 gitignore 目录

### M63.1
- : 修画廊封面双前缀 404（card 模板对已拼接 cover 再缀 PROTO_BASE）

### M72+M73
- : 安装框清净(删release徽章/渠道pill+断言防回潮)+卡片语义(封面截图+角标图标+贡献者留详情页)+移动端重做(chromeless嵌入+页面chips+体验条/安装/jump适配)；proto仓index v5 pages字段；LESSONS 164-165/ROADMAP M72+M73

### M63
- : 资源治理——cover 桌面窗口框/浏览器框分流+category 计分制；publish FORBID 生图中间件；四种子 v1.2.0 重发布（icon+3:2 cover 全就位）；proto 仓 pr-gate 资源硬验+SPEC 1b（中英）；petpark 图标糖果薄荷爪印化；清理 _raw 中间件

### M71
- : 字标v2(紧凑+clone自克隆残影+细镜像横)+精选按钮只留更多+移动端820/560断点全页适配+e2e移动套件；删M62-B渠道pill残留+release.json落盘；LESSONS 163/ROADMAP M71

### M62.2
- : specrow 取值移到 side 渲染之后（此前 IIFE 先于 innerHTML 执行导致恒空）

### M62.1
- : 站点渠道切换/release 徽章与 M67 单命令设计共存重接；proto contributors login override（头像渲染）

### M70
- : 下载可用(release直链+files.json客户端zip兜底)+贡献者圆头像(creator首位/排bot/链主页)+原型iframe主题联动(postMessage+?theme=)+画廊appicon瓷砖/去标题/搜索铺满；vendored zipstore；LESSONS 162/ROADMAP M70

## [0.6.0-snapshot.20260911.1] - 2026-09-11

Snapshot build（prerelease）。覆盖自上一 tag 的全部变更；正式版手动发车（--minor）。

### M69
- : 双联图织入动画——seam 循环片尾定格卡(hold 1.4s 兼循环缝合)+bridge 主题转场桥(昼夜之门)；移除首页静态 mark；相位机+__ident.phase() 钩子；LESSONS 161/ROADMAP M69

### M68
- : 定制 SVG 字标——design+克隆对连字符+渐变clone+回声残影(hover微交互)，CSS变量主题自适应，导航+footer单源注入；LESSONS 160/ROADMAP M68

### M67
- : 定稿 logo 羽毛融合（女昼/男夜导航+双联主 logo/favicon）+安装单命令化+删三处副标题

### M62
- : 画廊就绪三件套+petpark 3D 萌宠重建+README 重设计+站点适配
- : 首页片头 ident——设计师坐水面→躺下→铅笔描云→水镜倒映背影（9s 单时间轴连续骨骼动画、零切帧）；genimg anime 镜湖背景+圆框眼镜静态头像(nav/favicon)；播放一次定格+点击重播+reduced-motion 终帧；LESSONS 154/ROADMAP M62

### M66
- : 生成式干净头像 logo（女左/男右）——genimg 肖像+rembg 抠像+裁水印+主题渐变底合成，替换视频帧裁切；LESSONS 158/ROADMAP M66

### M65
- : ident 循环播放(片尾冻结1.4s+dip缝合)+双video/halo主题交叉淡化转场+页面token过渡+去lockup/replay文字+头像logo(男右女左)

### M64
- : 视频 ident（用户 AI 视频终源）+灵宠浮景去矩形+新海诚质感双主题+logo 主题联动

### M61
- : 圆框眼镜设计师+水镜微电影首页（抱膝坐→镜头缓移→躺下→水面镜像=克隆隐喻，14s 单时间轴 loop、reduced-motion 静态水镜帧）；favicon/导航=静态头像 logo-head.svg；M60 位图吉祥物下线

### M60
- : 吉祥物升级 genimg pixar-3d 生图版（与 3D 萌宠同管线）——seed22 选定、裁水印/头切 favicon、CSS 分身薄荷虚影+烟雾环+星点+接地投影装配、reduced-motion 静止；旧手写 SVG 吉祥物下线；prompt 存档 mascot-prompt.md

### M59
- : 原创 Q 版设计师吉祥物（影分身概念、零 IP 参照）——针织帽+橙卫衣+stylus 画笔+薄荷分身；favicon.svg 头部标 16px 可辨 + logo-static.svg 导航态 + 首页动态（弹跳/分身错时弹出/烟雾环/火花画线框/眨眼/帽球摆）；reduced-motion 静止

### M58
- docs: report/site-perf.md（并发/性能/功能测试报告：千并发零错误 p95<200ms、E2E 20 轮全绿、CI site job）
- : logo 影分身结印重画+首行动画组/火焰热度/封面底直角/footer 链接移除/头像真实 login(index API)/star 内嵌快照/iframe 重试；测试三件套 e2e(20轮)+loadtest+CI site job

### M57
- : 官网三轮打磨——hero 三行居中+灵动 logo v3(蹲姿结印+分身)/功能演示全宽真实场景动画/精选 3:2 封面+名称行+头像/详情一屏+面包屑+看板五项+免责脚注/导航 GitHub 按钮同款 pill+star/对齐统一

### M56
- docs: LESSONS 153 + ROADMAP M56
- : 官网 v2 —— 影分身忍者 logo+光感滑动 nav+star 徽章+Home(hero/安装/体验位/四tab步骤动画/Top4 按下载)+Gallery(tags 筛选/搜索)+详情左交互右看板(下载量按钮/跳转源码)；契约 v2 配套（publish 去 flavor、meta 双语）；proto 仓 SPEC v2+平铺迁移+cover 修复

### M55(D-E)
- : 官网挂入口+LESSONS 151-152+ROADMAP M55（平台全链路：建仓→publish→PR→Release→索引→官网 E2E 全绿）

## [0.6.0-snapshot.20260911] - 2026-09-11

Snapshot build（prerelease）。覆盖自上一 tag 的全部变更；正式版手动发车（--minor）。

### M54.1
- : release.mjs ROOT 路径修正（scripts→repo 三级）

### M54(D-F)
- : 三 agent 真装验证 + headless 端到端实证（opencode/codex 全绿、claude 账号资格 403 如实记录）+ report/agent-e2e.md + LESSONS 149-150/ROADMAP M54

### M55(A-C)
- : 官网 site/（EN 默认+中文切换、archify 式五页、画廊+proto 详情 iframe+贡献者/版本/zip）+ pages.yml（含画廊 fallback 快照）+ publish.mjs（--app/--flavor 发布器：门强验/白名单剥离/PII/80MB/meta+version.json+PROVENANCE/gh PR）+ SKILL §F Publish 模式 + references/publish-guide.md

### M54(A-C)
- : install.sh 一键安装器 + release.mjs/release.yml 发布车 + version-sync 门 + doctor 版本打印 + npx skills 实测 + README/SKILL/install-guide 安装与发布文档

### M53
- : 宠物乐园 2.5D 萌宠 demo 替换 orbit（自研原创 run + 源站）

### M51.1
- : collect-design 宽松解析旧 run 的 window.DC（JS 对象字面量键未加引号 → JSON.parse 失败，link-dy1/xhs2 导出门假红根因）

### M51
- : 设计产物链——生成期初始 spec/figma 源 + 导出=编辑后重导出

### M52
- : 圆周轨迹探索页按参考图精细化重建（矢量地图+组件层，根除贴图）+ 普适防复发门

### M50
- : 双 id 空间归一(白卡/双根根除)+树=BFS 层级树(毛发球/组合爆炸根除)+giant-chain 改评 paths

### M49.1
- : parity 选择器 tag-agnostic（漏 data-act/span-goto 致覆盖假低）+ 存量保真债校准（新 run 硬拦/存量 warn+report/parity-debt.md 公示）+ sly/wechat 补接线一轮；LESSONS 143

### M49
- : 缓存根治(文件名哈希+boot自愈)+数据线/标注定稿+树/路径职责定稿+sly探索页重建+demo全门

### M48.4
- : unstyled-view-classes 门改 computed 视觉处理判定（后代选择器/inline style/hook 类不再误报，wb 49/50 误报修复）；xhs5 卡片接线（dead 4→0）

### M48.3
- : link-xhs5 三视图补样式表（此前整 run 无 CSS=静默坏块）；inspect 新门 unstyled-view-classes（带类元素 >50% 无规则=缺样式表，杜绝此类静默全绿）

### M48.2
- : utilities preflight 封顶裸 b/strong=600（link-dy1/xhs2 的 <b> 默认 700 被新门拦，根治到生成器）；全 run 重生成

### M48.1
- : utility-css 字重封顶 600（bold/extrabold/black→600，CJK 黑粗根治到生成器）+ 任意值 shadow-[…]/drop-shadow-[…] 编译支持（此前 9 个 unknown 令牌丢阴影）；全 run utilities 重生成

### M48
- : 排版预算+路径方向化+overlay 保真（用户四图打回后全量清）

### M47.3
- : regress insBroken/smkBroken 改 summary 判定（门失败 exit 2 带 summary 是有效结果，此前被误标 BROKEN；M47.1 只修了 iaBroken）

### M47.2
- : slytherin emoji 字形清零；regress 子门超时 900s→2400s

### M47.1
- : regress 重试只认无 summary 的瞬态崩溃；placeholder-blocks 豁免模态 scrim

### M47
- : 选中回退链+壳缓存废+hub 画布不空+门解耦

### M46
- : 五 run 视觉重修+门加严（用户逐图打回后）

### Other
- docs: 仓库地址指向实际 GitHub 账号 hello-cqq/design-clone
- design-clone skill M0-M20: capture→live-prototype pipeline with quality gates (live-views/asset-qa/fidelity/privacy), 16 validated runs excluded via .gitignore, CI+packaging, MIT

### M45(repo)
- : 开源工程面——双语文档/许可边界/CI/lint/ts/自证扫描/单测入口

### M44k+M45(skill)
- : 外壳功能修复+冒烟门+serve 加固拆分+inspector 分段源+utility 本地编译

### M44c-h
- : interactive+privacy+paths-logic+appicon+entry+regress ultimate pass

### M41
- : 照猫画猫 principle (per-capture inventory, no app-specific convention, no approximation); wechat 09/11/13 avatars fixed as transcription outputs; 19 views audit bad=[]

### M40
- : general faithful-regen pipeline as sole generation path (app-agnostic, no special-casing); wechat 13/15/17 regenerated faithfully (5 real member avatars, bottom tabbar, local-life miniprogram); 19 views audit bad=[]

### M39
- : autonomous per-view regen loop (one-command, agent self-iterates to fidelity<=0.15/truncated=0, no user prompting); fix 04-me header+avatar, 12 right-strip; wechat 19 views audit bad=[]

### M38
- : s2c-effect via host-agent-as-generator (zero-key, cross-agent); vendor s2c prompt (s2c-prompt.md); wechat 01/02/03/04/12 faithful rebuild (colored SVG icons/avatars, block name/sub, tabbar pin); audit bad=[]

### M35-37
- finish: doctor prompt table (unlock/foreground/s2c-opt/chromium/visual-consent); s2c-adapter+s2c_gen+translate (opt-in no-key-assume); spec2view hierarchical rewrite; 16 runs fail:0 eval 17 PASS

### M36/37
- : qa/audit.mjs per-view render+label-recall+truncated+side-by-side (capture-time id mapping); verify-page + capture.sh snap awake/foreground guard; mobile-im tabbar pin; slytherin component rebuild; wechat 11/12/13 capture-waive (phone off/DingTalk, need recapture)

### M30/31
- : rebuild wechat broken compiled views as component views (01/02/03/04/05/11/13) with real cropped icons/avatars; add truncated-text hard gate; s2c deep-research (self-render loop/VLM asset extraction) + decision hybrid; R1-R3

### M29
- : SKILL.md gen-pipeline section + ROADMAP M24-M28; interaction link-up (wechat 01 inter .45/04 .5); compile 11-single-chat .021; spec2view --width for web/desktop; restore web hand homes + parity-log; gates green

### M28c
- : unlock-phone re-dump wechat 02/05/12/13 (full trees); compile 02/05/13 (0.02-0.05); fidelity --waive for anonymized views; eval respects waive; gates green

### M28
- neuro-symbolic pipeline: measurement adapters (ui-tree/DOM/AX) + annotate SoM + spec2view compile (bounds->%, pixel-sample, bbox-crop, overlay layers); wechat trees dumped w/ page-verify; wechat01=0.08 slytherin01=0.055; meta/semantic-pass; A46+LESSONS102-105; all runs PASS

### M23
- final: 1:1 audit rebuild (apple DESIGN.md tokens, aliyun/lark/workbuddy/wechat/slytherin parity), parity.mjs per-control/interaction gates, capture snap settle+dump, asset-qa waive, critique 9-dim, tokens 3-layer; 17 runs PASS

## [0.5.0] - 2026-09-06

### Added
- `qa/ui-smoke.mjs` — shell smoke gate: real clicks on play / export download / share / device switch / annotation-product-variant writes / canvas label typography / `?chrome=0` / left-rail filter / shortcut help / code view. Wired into `inspect` (fast) and `regress` (full, incl. a real zip download).
- Export to the user's machine: zero-dependency store-only zip builder in the inspector, `showDirectoryPicker` directory export, export concurrency lock + busy state; server returns file payloads via `returnFiles`.
- Writable living-PRD: annotation editor (click element in annotate mode), product-note editor in the detail board, "save as variant" persisting `prototype/variants/<name>/` + `variants-index.json` (same contract as `apply-patch.mjs --variant`), all with offline localStorage fallback and explicit toasts when only local.
- Left-rail page/scene filter, `?` shortcut help overlay, share dropdown (state link / clean embed / card view / fullscreen demo), device dropdown rendered from a single `DEVICES` source with persistence + URL sync.
- `docs/PROVENANCE.md`, `docs/THIRD-PARTY.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `CHANGELOG.md`, `.editorconfig`, issue/PR templates; English-first `README.md` + `README.zh.md`.

### Fixed
- Exported `+ann` PNGs were byte-identical to unannotated ones (annotation overlay is a sibling of `#dc-stage`): annotation exports now clip-capture the device box.
- Path PNG export always 500s (selector `data-pathrow` never rendered) — rendered + server-side fallback.
- Play button was scene-only and silently no-op in pages mode; play now resolves from the current page/roots, falls back to demo journeys, and reports missing `paths.json`/`journeys.json` with the fix command. Play-chain crashes (`null.edges`) after a session ended mid-await are guarded.
- Canvas wire labels/numbers rendered near-black and scaled with canvas zoom: typography moved out of JS inline styles into CSS (`--sh-mark`, `.wbadge/.wnum/.elabel`) with `1/z` counter-scaling.
- Mobile IM rows rendered name+sub on one line (`display:block` on `.mi-row .name/.sub`); desktop conversation rows gained a proper `.da-conv` definition.
- Stale annotations (target renamed/removed) no longer vanish silently — surfaced in the detail board and excluded from the count badge.
- `serve.mjs`: path prefix check now separator-aware, malformed POST JSON returns 400 instead of crashing, 8 MB body cap, handler-level error catch, unhandled-rejection guards, variants added to the write whitelist.
- Variant index name mismatch (`variants.json` vs `variants-index.json`) made CLI-created variants unreachable via `?variant=`.
- Demo captions rendered literal `undefined` for journey steps lacking `result.kind`.
- `critique` gate accepts placeholder `TODO:` notes as passing — now a hard fail for required views.

### Changed
- Device labels normalized to 手机 / 平板 / 桌面 / 网页 across UI, prompts and docs.
- Status bar and toast styling moved from JS inline `cssText` into `inspector.css` (`.dc-sb-injected`, `#dc-toast`).

## [0.4.0] - 2026-09-05..06

M44 series: full-control interactivity (`runtime.js` + `qa/interact.mjs`, dead=0 gate), one-command `clone.mjs`, generic privacy gate + asset provenance, structural critique gate, adaptive genimg with self-check loops, geometry gates (layout-sanity), unified entry router, app icons + showcase contract, regression/autofix infrastructure. See `docs/ROADMAP.md` and `docs/LESSONS.md` 106–121.

## [0.1.0] - 2026-09-03

Initial public shape: capture (web/android/desktop/link), spec-driven generation, inspector v4 shell, fidelity/eval gates, MIT license.

## M86 仓库卫生与统一纳管
- 剔除 tracked 垃圾：根媒体 8 件（旧 ident 源 mp4×2、女生/男生/男女 jpg、女生视频3.mp4、手机1/2.jpg）、动物乐园/ 参考图×7、publish-out/、site/data/thumbs/（改 CI 生成）、site/assets/demo/*+demo-shots.mjs（M81 后零引用）、logomark-fill.png（零引用）、根 demo/ 静态页；
- proto 仓以 prototype-repo/ 统一纳管（双仓独立 GitHub，本目录单点管理）；publish.mjs 优先复用该目录；
- 仅清理当前树，不重写历史。

## M87 项目空间重组
- 新建 `<space>/repo/`：design-clone 与 design-clone-prototype 两仓迁入其下统一管理；过期同级 design-clone-runs（12K 空壳）归档至 `<space>/archive/design-clone-runs-stale-20260915`；清理 .DS_Store；
- publish.mjs 管理副本切换为同级 proto 仓（仓内 prototype-repo/ 重复克隆删除）；AGENTS 布局记账。

## M89 目录修正（撤销 M87 父级搬迁）
- 工作区根恢复为 `design-clone/`（所有代码/资源/项目文件仍在当前目录）；`repo/` 改建于当前目录内收纳 proto 仓（`repo/design-clone-prototype/`）；`archive/` 收进当前目录；父级空间仅留本仓与个人项目；
- publish.mjs 管理路径=`<root>/repo/design-clone-prototype`；.gitignore 增 /repo/ /archive/。

## M90 空间布局定稿
- 空间根 `design-clone/` 为项目目录（非 git 仓）；GitHub 代码迁入 `repo/design-clone/`；proto 仓 `repo/design-clone-prototype/`；开发过期资源归档于空间根 `archive/`；
- publish.mjs 管理副本=`<space>/repo/design-clone-prototype`；.gitignore 移除已不适用的 /repo/ /archive/ 条目。
