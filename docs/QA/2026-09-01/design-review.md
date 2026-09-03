# 设计师走查报告 · 2026-09-01

三 demo × 明暗。取证 /tmp/qa-design + /tmp/qa-regress。Fix 已全部处理（除标注 residual）。

## P0（已修）
1. dy1 tokens 只写 @theme 裸 link 不生效 → :root 镜像（tokens.css 重写）
2. wechat 01 多根被 flex:1 拉出空白 → 三视图全部单根包裹
3. dy1 view 宽 1284>1280 出血 → 收敛 1160

## P1（已修）
4. wechat 01 内容缺：补 Mac 横幅+9 行真头像+红点+真 tabbar（extract-assets 13 裁）；fidelity 0.1219→0.1122（文本重排噪声，阈值校准见下）
5. xhs2 底色奶油≠证据浅蓝 → tokens 恢复 #f4f8fb/#cce7f7，remix 覆盖转存 variants.json
6. dy1 02-drive 视频字幕残留 → 删
7. strenght → strength
8. dy1 primary #7030F0→采样 #7454FD
9. 壳字体栈泄漏进 stage → #dc-stage 用 var(--font-body)
10. 亮主题对比度 3.45/2.92/2.99 → --sh-mut #6f6f6f、--sh-accent(light) #0071ce

## P2（已修/残留）
11. emoji→真素材：wechat 02/03 全换裁剪真图标（24 裁）；xhs 头像/雷达换 3D 水獭；residual：xhs 输入栏🎙、dy1 ❄♨ 字形（刻意保留，属字形非 emoji）
12. a11y：focus-visible 环入壳；xhs call 按钮补 title/aria；residual：余 5 个装饰按钮无 title（P2 挂账）
13. 03 绿卡 #07C160→采样哑光 #2cad68；宫格图标 26→32px 真图标
14. xhs2 双 :root → 合并，override 移入 variants.json

## 指标
- fidelity：wechat01 live-high 0.1122（阈值 <0.15 校准）；wallet pixel 0.0367
- 对比度：light mut/panel 4.9+、accent/panel 4.6+；dark 全过
- inspect：三 demo 16/16 ×3，pageerror 0

## 挂账（P2，下轮）
余 5 个装饰按钮 title；dy1 robot 形象与源视频角色差异（live-high 解读允许）。
