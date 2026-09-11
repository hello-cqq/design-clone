# Publish 指南（community 原型平台）

平台 = [design-clone-prototype](https://github.com/hello-cqq/design-clone-prototype)：
社区上传 design-clone 标准原型，GitHub Pages 直挂可交互；官网画廊聚合展示+贡献者归属。

## 目录契约（proto 仓 SPEC.md v1）
`<app>/{meta.json,icon,cover.png,prototype/,PROVENANCE.md}` 平铺（v2：flavor 已废，变体=独立 app，如 wechat / wechat-pad / wechat-desktop）；
meta 必填双语 `name{en,zh}`/`description{en,zh}`/`tags[]`/shell/source/license/ip_attestation/version；
每 app 只存当前版；改 prototype/** 必须 bump version（CI 红防静默覆盖）；
合并自动打 tag `<app>-<version>` + Release（离线 zip）；热度=Release zip download_count 之和。

## 发布流程
1. 本地门全绿：`interact`（dead=0）、`inspect`（0 fail）、`ui-smoke`（0 fail）、privacy 账本在场。
2. `publish.mjs --dry` 目检 payload（白名单剥离：无 node_modules/export/qa/capture/视频/字体；meta 双语齐）。
3. 正式 publish → PR（标题 `publish(app): name.en`，body 含门摘要+IP 自律+隐私勾选）。
4. CI：结构/meta schema/flavor-shell 映射/体积/禁名单/PII grep/版本 bump 纪律 + playwright 静态冒烟。
5. maintainer 人工审批合并（禁 automerge）→ index.yml 重建索引+缩略图 → release.yml 发版 → 官网画廊出现。

## 隐私与 IP 红线
真名/电话/证件/车牌/真人脸零容忍；聊天与示例文本虚构；上传者昵称匿名；
品牌克隆必须 original≠ 自律档 + app 级 brand_disclaimer（publish 自动插免责声明）；
禁整包官方素材（字体/图标包），图标自绘 SVG 或注明来源小裁切。

## 版本
SemVer；meta.version 与 prototype/version.json 双写一致（publish 生成后者）；
界面 `?about` 与看板脚注显示 app/flavor vVersion；历史=git+Release 列表。
