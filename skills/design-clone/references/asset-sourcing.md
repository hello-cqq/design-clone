# 资产取材（图标/封面/素材）工作流 —— M75-W4

原则：**官方源优先 → 系统源 → 生成兜底 → 自检循环**。每一次取材都记录来源于 `knowledge/asset-sources.json`（append-only）。

## 图标链（appicon.mjs 档位顺序）
1. `system:manual`：用户输入自带（--src）。
2. `system:web-official`：`gen/probe-icon.mjs --url <官网>` 抓 favicon/apple-touch/manifest/og:image 候选 →
   VLM/人工选型（品牌匹配、干净、方形、≥256）→ `appicon.mjs --mode cloned --src <cand>`。
3. `system:mac`：/Applications/*.app 的 icns（sips 转 png）。
4. `cloned`：capture 裁切（autocrop-icons）。
5. `generated`：style-pick + genimg（品牌描述 prompt）+ 自检循环（VLM 评"像该品牌/干净/可用"，≤3 轮改 prompt）。

## 名称链（gallery-meta.mjs）
1. 输入/图文/视频明确给出的名称 → 2. `references/official-names.json` 官方名（微信/阿里云/飞书/抖音…）→
3. 生成"符合原型主题的产品义名"。**禁止**把"· 手机版（学习复刻）"等后缀进 name（只进 description 与 brand_disclaimer）。

## 封面链（cover.mjs）
合成=category 色板+设备框+首视图真截图+图标+名称（自适应字号不截字）+tags；3:2 1200×800 ≤300KB；
生成后自检：VLM 验"文字完整/图标清晰/场景匹配"，不过则调字号/换 hero 视图重合成（≤2 轮）。

## 商标与自律（硬门不变）
官方图标/名称仅用于 study-replica：`meta.ip_attestation ∈ {licensed, public-material}` 时必须有 `brand_disclaimer`；
publish.mjs 自动插免责声明；禁整包官方素材入库；画廊卡片角标=图标但详情页显式标注"非官方学习复刻"。

## 记录格式
`knowledge/asset-sources.json`: [{asset:"icon", source:"system:web-official", ref:"https://www.feishu.cn/favicon.ico", at, note}]

## M76-W2b 策展图标优先序（硬纪律）
1. `references/official-icons/<key>.png` 仓内策展件（官方品牌 CDN/品牌资产策展，归属登记于 docs/THIRD-PARTY.md §Curated official icons；wechat/lark 另有本地手绘 SVG 副件）；
2. `probe-icon.mjs` 官方站候选 + 主色校验（wechat 需 #07C160 主导、lark 需青蓝主导），不达标弃；
3. `appicon.mjs` 内容生成（原创/链接内容克隆默认）。
禁止：未校验的抓取结果直接入库（M75 曾入花朵/灰相机错图）。
