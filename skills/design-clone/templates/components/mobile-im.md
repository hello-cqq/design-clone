# mobile-im 组件库（M18）

移动 IM/工具类 app（微信/钉钉/抖音个人主页类）live 视图积木。
**用法**：视图文件顶部 `<link rel="stylesheet" href="../components-mobile-im.css">` 不可行（views 是 fragment）——
把本 css 内容并入 run 的 index `__VIEW_CSS__`（sync-shell 已会把 templates/components/*.css 收集进新 run；存量 run 手工 copy 一次），
然后按下面 snippet 拼视图。所有交互元素带 `data-dc` + `data-goto`，文案**全虚构**。

## 会话列表行
```html
<a data-dc="wx/row1" data-goto="11-single-chat" class="mi-row">
  <span class="mi-ava" style="background:#2a7f4f">传</span>
  <span class="main"><span class="name">文件传输助手</span><span class="sub">这版动效很自然</span></span>
  <span class="time">11:55</span>
</a>
```

## 聊天气泡（入/出）
```html
<div data-dc="ch/list" class="flex flex-col gap-3 px-4 py-3">
  <div class="mi-bubble-in">收到，下午同步你</div>
  <div class="mi-bubble-out">好，记得带上设计稿</div>
</div>
```

## 设置/资料 cell
```html
<a data-dc="set/cell" data-goto="13-group-settings" class="mi-cell">
  <svg class="ic" viewBox="0 0 24 24" style="fill:none;stroke:#5b8fc9;stroke-width:2"><circle cx="9" cy="8" r="3.5"/><path d="M3 20c1-4 3.5-6 6-6s5 2 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.5c2.5.3 4.5 2 5.5 5.5"/></svg>
  <span class="lb">群设置</span>
  <svg class="ar" viewBox="0 0 24 24" style="fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round"><path d="m9 6 6 6-6 6"/></svg>
</a>
```

## 底部 tabbar（四 tab）
```html
<nav data-dc="wx/tabbar" class="mi-tabbar">
  <span class="mi-tab on"><svg viewBox="0 0 24 24" style="fill:none;stroke:currentColor;stroke-width:2"><path d="M4 6h16v10H9l-5 4z"/></svg>微信</span>
  <a class="mi-tab" data-goto="02-contacts"><svg viewBox="0 0 24 24" style="fill:none;stroke:currentColor;stroke-width:2"><circle cx="10" cy="8" r="3.5"/><path d="M3 20c1-4 4-6 7-6s6 2 7 6"/></svg>通讯录</a>
  <a class="mi-tab" data-goto="03-discover"><svg viewBox="0 0 24 24" style="fill:none;stroke:currentColor;stroke-width:2"><circle cx="12" cy="12" r="9"/><path d="m15 9-2 5-4 1 2-5z"/></svg>发现</a>
  <a class="mi-tab" data-goto="04-me"><svg viewBox="0 0 24 24" style="fill:none;stroke:currentColor;stroke-width:2"><circle cx="12" cy="8" r="4"/><path d="M5 21c1-4 3.5-6 7-6s6 2 7 6"/></svg>我</a>
</nav>
```

## 加载态（状态对用，非主体）
```html
<div data-dc="st/loading" data-state="loading" class="flex flex-col gap-3 p-4">
  <div class="mi-skeleton" style="height:52px"></div>
  <div class="mi-skeleton" style="height:52px"></div>
  <div class="mi-skeleton" style="height:52px"></div>
</div>
```

纪律：snippet 里 svg 一律 inline style（赢全局 svg CSS，LESSONS 70/79）；emoji 禁入 UI（LESSONS retrofit）；
色值只引 tokens 变量，不硬编码品牌色以外的值。
