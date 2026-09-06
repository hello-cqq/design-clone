# controls 组件库（M44）— 全控件类型可交互 snippet

每个控件都接 `data-act`（运行时 `templates/prototype/runtime.js` 事件委托驱动，CSS 由 runtime 自动注入）。
**纪律：每个可见控件点击必须有可观测反应**（翻转/选中/展开/弹层/提示/跳转），杜绝死按钮。
导航用 `data-goto="<目标视图 id>"`；其余用下表 `data-act`。文案全虚构、个人文本匿名。
验收：`node scripts/qa/interact.mjs --run <run> --base <url>` → dead=0、act_pass=1。

## data-act 目录（与 runtime.js 一致）

| act | 控件 | 关键属性 | 可观测反应 |
|---|---|---|---|
| `goto` | 行/卡/头像/按钮 | `data-goto="视图id"` 或 `data-act="goto" data-to="视图id"` | 切页（hash 变） |
| `back` | 返回箭头 | — | 回上一页 |
| `toggle` | 开关/switch | `role="switch" aria-checked` | 翻转 + 滑块位移 |
| `checkbox` | 多选 | `role="checkbox" aria-checked` | 勾选切换 |
| `radio` | 单选 | `data-group="g" role="radio"`，容器 `data-radio-group` | 组内互斥选中 |
| `select` | 下拉 | 配合 `[data-select-menu]` + `[data-select-opt]` + `[data-select-value]` | 展开→选值→收起 |
| `accordion` | 折叠区 | `data-target="<面板选择器>"`，面板 `[data-acc-panel]`/`.dc-acc-panel` | 展开/收起 |
| `tab` | 分段/tab | `data-group="g" data-tab="名"`，面板 `[data-tab-panel="名"]`，容器 `data-tab-group` | 切换激活+面板 |
| `sheet` | 底部弹层 | `data-title` `data-items="A|B|C"`（或 `data-sheet-id="#el"`） | 弹层升起 |
| `dialog` | 确认弹窗 | `data-title` `data-body` `data-ok` `data-ok-toast` | 模态+焦点圈闭+Esc |
| `toast` | 轻反馈 | `data-msg="..."` | 浮提示 |
| `step` | 步进 ±  | `data-dir="1|-1" data-step data-target="[data-stepper-val]" data-min data-max` | 数值增减 |
| `slider` | 滑杆 | `.dc-slider` 内含 `.tr/.fl/.th`，`data-target="[data-slider-val]"` | 拖动改值 |
| `input` | 输入/搜索 | 直接用原生 `<input>`（无需 data-act）或 `data-act="input" data-target="#inp"` | 聚焦可键入 |
| `noop` | 范围外占位 | `data-msg="..."` | 提示"原型占位" |

## 开关 toggle
```html
<div class="mi-cell"><span class="lb">消息免打扰</span>
  <span class="dc-sw" data-act="toggle" role="switch" aria-checked="false"><i></i></span></div>
```

## 单选 radio（设置选项/朋友权限）
```html
<div data-radio-group class="flex flex-col gap-3">
  <label class="flex items-center justify-between"><span>仅聊天</span>
    <span class="dc-radio on" data-act="radio" data-group="perm" role="radio" aria-checked="true"></span></label>
  <label class="flex items-center justify-between"><span>聊天、朋友圈、状态</span>
    <span class="dc-radio" data-act="radio" data-group="perm" role="radio" aria-checked="false"></span></label>
</div>
```

## 多选 checkbox
```html
<label class="flex items-center gap-2"><span class="dc-check" data-act="checkbox" role="checkbox" aria-checked="false"></span>同意条款</label>
```

## 下拉 select
```html
<div class="dc-select mi-cell" style="position:relative">
  <span class="lb">排序</span>
  <span data-act="select" role="button" aria-expanded="false"><span data-select-value>最新</span> ▾</span>
  <div data-select-menu class="dc-select-menu">
    <div class="dc-select-opt sel" data-act="select-opt" data-value="最新">最新</div>
    <div class="dc-select-opt" data-act="select-opt" data-value="最热">最热</div>
    <div class="dc-select-opt" data-act="select-opt" data-value="附近">附近</div>
  </div>
</div>
```

## 折叠 accordion
```html
<div class="mi-cell" data-act="accordion" data-target="#acc1" aria-expanded="false"><span class="lb">高级设置</span><span>▾</span></div>
<div id="acc1" class="dc-acc-panel"><div class="mi-cell"><span class="lb">子项 A</span></div></div>
```

## 分段 tab（带面板）
```html
<div data-tab-group class="flex gap-2">
  <span class="dc-tab on" data-act="tab" data-group="g" data-tab="a" role="tab" aria-selected="true">吃榜</span>
  <span class="dc-tab" data-act="tab" data-group="g" data-tab="b" role="tab" aria-selected="false">玩榜</span>
</div>
<div data-tab-panel="a" class="on">A 面板</div>
<div data-tab-panel="b">B 面板</div>
```

## 步进 stepper
```html
<div class="mi-cell"><span class="lb">数量</span>
  <span data-act="step" data-dir="-1" data-target="#q" data-min="1">−</span>
  <span id="q" data-stepper-val style="min-width:24px;text-align:center">1</span>
  <span data-act="step" data-dir="1" data-target="#q" data-max="99">＋</span></div>
```

## 滑杆 slider
```html
<div class="dc-slider" data-act="slider" role="slider" aria-valuenow="40" data-target="#sv" style="--p:40%">
  <div class="tr"><div class="fl"></div><div class="th"></div></div>
</div><span id="sv" data-slider-val>40%</span>
```

## 底部弹层 sheet / 确认 dialog / 轻提示 toast
```html
<span data-act="sheet" data-title="分享" data-items="发送给朋友|分享到朋友圈|复制链接">分享</span>
<span data-act="dialog" data-title="删除" data-body="确定删除？此操作不可撤销" data-ok="删除" data-ok-toast="已删除（演示）">删除</span>
<span data-act="toast" data-msg="已收藏">收藏</span>
```

## 面包屑 breadcrumb（桌面/网页常见，移动端少）
```html
<nav data-dc="bc/nav" class="flex items-center gap-1 text-[13px]" style="color:var(--color-text-secondary)">
  <a data-goto="01-home">首页</a><span>/</span>
  <a data-goto="05-list">列表</a><span>/</span>
  <span style="color:var(--color-text-primary)">详情</span>
</nav>
```

## 输入 / 搜索（原生 input，自动可聚焦键入）
```html
<input data-dc="se/input" class="flex-1 text-[14px]" style="border:none;outline:none;background:transparent" placeholder="搜索">
```

> 键盘可达：runtime 自动给 `[data-act]` 补 `role`/`tabindex`/`aria-*`，Enter/Space 触发，弹层 Esc 关闭、焦点圈闭。
