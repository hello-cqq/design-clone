# 移动壳组件模式（生成视图时先查这里，禁止临场发挥）

借鉴 open-design（Apache-2.0，仅借鉴模式不抄代码，见 docs/RESEARCH.md）：标准感来自「壳组件模板化」，不来自素材生成。
所有 UI 字形图标一律内联 SVG（lucide 风格 1.8 stroke），**禁止 emoji 充当图标**（no-emoji-ui 检查会扫）。

## 状态栏（视图首行，h≈44）

iOS（有灵动岛时 inspector 边框档自动注入；视图内只画时间+右三件）：

```html
<div class="flex items-center justify-between px-6 pt-3 text-[13px] font-semibold">
  <span>20:31</span>
  <span class="flex items-center gap-1.5">
    <svg width="15" height="11" viewBox="0 0 17 11" style="fill:currentColor;stroke:none"><rect x="0" y="7" width="3" height="4" rx="0.6"/><rect x="4" y="5" width="3" height="6" rx="0.6"/><rect x="8" y="3" width="3" height="8" rx="0.6"/><rect x="12" y="0" width="3" height="11" rx="0.6"/></svg>
    <svg width="15" height="11" viewBox="0 0 17 11" style="fill:currentColor;stroke:none"><path d="M8.5 1.5C5.5 1.5 2.7 2.6 0.5 4.6L2 6.1C3.8 4.5 6.1 3.6 8.5 3.6c2.4 0 4.7 0.9 6.5 2.5l1.5-1.5c-2.2-2-5-3.1-8-3.1zM3.5 7.6L5 9.1c1-0.9 2.2-1.4 3.5-1.4 1.3 0 2.5 0.5 3.5 1.4l1.5-1.5c-1.4-1.3-3.1-2-5-2-1.9 0-3.6 0.7-5 2zM6.5 10.6l2 2 2-2c-0.5-0.5-1.2-0.8-2-0.8s-1.5 0.3-2 0.8z"/></svg>
    <svg width="22" height="11" viewBox="0 0 25 11" style="fill:none;stroke:none"><rect x="0.5" y="0.5" width="21" height="10" rx="2.5" stroke="currentColor" stroke-opacity="0.45" stroke-width="1"/><rect x="22.5" y="3.5" width="1.5" height="4" rx="0.4" fill="currentColor" fill-opacity="0.45"/><rect x="2" y="2" width="13.5" height="7" rx="1.4" fill="currentColor"/></svg>
  </span>
</div>
```

图标必须是**填充式**（信号四柱/wifi 双弧点/电池描边+电平），描边弧式显脏。换色/填充一律写 **inline style**（`style="fill:currentColor;stroke:none"`）——全局 `svg{stroke:currentColor;fill:none}` 是 CSS，会覆盖 fill/stroke 表现属性，写属性必变空心。

Android：同结构，时间可左、右三件保留；不画灵动岛。

## 圆形图标按钮（铃铛/加号/搜索）

白底圆 + 细线图标 + 极轻投影：`grid h-11 w-11 place-items-center rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)]`，图标 18-19px stroke 1.8。

## 渐变字符头像（无资产兜底，零素材也标准）

```html
<span class="grid h-12 w-12 place-items-center rounded-xl text-[18px] font-semibold text-white"
  style="background:linear-gradient(135deg,#8ea8f0,#b48ee0)">苏</span>
```

色相按行哈希取（蓝/紫/青/橙/棕），圆角头像 rounded-xl、个人主页 rounded-full。有真资产时优先 `extract-assets.mjs` 裁剪（--matte light 去浅底）。

## 列表行（聊天/档案/设置通用）

```html
<a class="flex items-center gap-3 px-4 py-3">
  <avatar>
  <span class="flex-1 min-w-0">
    <span class="flex items-baseline justify-between"><b class="text-[15px]">姓名</b><i class="text-[11px] not-italic text-[var(--color-text-secondary)]">14:20</i></span>
    <span class="flex items-center justify-between"><span class="truncate text-[12px] text-[var(--color-text-secondary)]">摘要</span>
      <b class="grid h-4 min-w-4 place-items-center rounded-full bg-[#FA5151] px-1 text-[10px] text-white">2</b></span>
  </span>
</a>
```

红 badge #FA5151、时间 11px 次级灰、摘要单行 truncate。

## 搜索栏

`flex items-center gap-2 rounded-xl bg-white px-3 py-2.5` + search svg 16px + `text-[13px] text-secondary` 占位。

## 底部 tabbar（悬浮胶囊式）

黑圆主 tab（白填充图标）+ 白胶囊 `rounded-full bg-white/95 px-6 py-3.5 shadow` 内 4 项，图标 18px stroke 1.8，选中项 ink 色加粗。

## 资产梯（mascot/hero 图）

1. `extract-assets.mjs` 源帧裁剪（深色主体浅底加 `"matte":"light"`，杂物加 `erase` 矩形）
2. `genimg.mjs --style pixar-3d`（3D 质感锚：soft volumetric lighting / detailed fur / cinematic still）
3. CSS 渐变字符头像（仅头像位）

UI 图标位不接受 emoji 兜底（no-emoji-ui 检查 fail）。

## 布局纪律（overlap-audit / no-h-overflow 检查）

- flow 布局优先（flex/grid）；绝对定位仅用于：悬浮 tabbar、hero 叠卡（须 z-10 + pointer-events-none + 透明底）
- 任何元素不得超出 390 宽（stage 横向零溢出）
- 文本/背景对比度 ≥ 4.5:1（contrast 检查）
- 图片容器锁定比例（h-×w- + object-cover/contain），禁裸 img 流式撑破

## anti-fake-device 清单（M14b，借自 open-design checklist.md）

任一命中即「卡片假扮手机」，必修：
- 外圆角未明显大于内圆角（framed 档外 44/内 24 起步）
- 状态栏文字发灰/低透明（必须 var(--color-text-primary) 全浓度）
- tabbar 无顶边或无 backdrop-blur
- 点击目标 < 44px；正文 < 14px
- accent 同屏出现 > 2 处（active tab + 主 CTA 是默认预算）
- 数字未用等宽（价格/计数/时长/日期）
- 外部图床 CDN（unsplash/picsum/placehold）——脆弱且一眼假，用本地资产或占位类
- 默认 indigo（#6366f1 系）当主色、hero 紫蓝渐变——AI 味七宗罪前两条

## 产出前自查 P0/P1/P2（M14b，借自 open-design anti-ai-slop + craft）

- P0 必过：五态意识（loading/empty/error/满/极值至少不留白）；无 emoji 图标；无 lorem/占位文案；accent≤2；tap≥44
- P1 应过：真实感具体文案（「麻酱 · 猫猫」胜「User Name」）；首屏主 CTA 不折行入折叠；状态栏填充式图标
- P2 加分：一个只有真用过产品的人才会放的细节（快捷键提示、场景化 badge 文案）
