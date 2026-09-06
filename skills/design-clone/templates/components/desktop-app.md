# desktop-app 组件库（M18）

mac/win 桌面应用（飞书/WorkBuddy/Slack/IDE 类）live 视图积木。外壳（红绿灯/标题栏）由 c_desktop shell 注入，视图只写窗口内容。

> **M44f 硬契约**：视图**禁止**自带红绿灯/标题栏/窗口边框——shell `c_desktop` 的 `.dc-framebar` 已注入（`chrome=0` 截屏不含外壳属正常，不是缺陷）。
> 在视图里塞标题栏会因 `da-root` 是 flex-row 而被挤成竖列（M44f 事故）。inspect `layout-sanity` 会对"视图内重复窗口 chrome"报警。
> 侧栏/列表必须 `overflow-y:auto` 防末项被裁；聊天输入条用 `.da-input` 且主区 flex-column 吸底（`margin-top:auto`）。

## 三栏骨架（rail+side+main）
```html
<div data-dc="lk/root" class="da-root">
  <nav data-dc="lk/rail" class="da-rail">
    <svg class="ic on" data-goto="01-messages" viewBox="0 0 24 24" style="fill:none;stroke:currentColor;stroke-width:2"><path d="M4 6h16v10H9l-5 4z"/></svg>
    <svg class="ic" data-goto="02-calendar" viewBox="0 0 24 24" style="fill:none;stroke:currentColor;stroke-width:2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18"/></svg>
    <svg class="ic" data-goto="04-project" viewBox="0 0 24 24" style="fill:none;stroke:currentColor;stroke-width:2"><path d="M3 7h6l2 2h10v10H3z"/></svg>
  </nav>
  <aside data-dc="lk/side" class="da-side">
    <div class="search">搜索 (⌘K)</div>
    <a data-dc="lk/i1" data-goto="11-chat" class="da-item on"><span class="lb">设计评审群</span><span class="meta">14:03</span></a>
    <a data-dc="lk/i2" data-goto="01-messages" class="da-item"><span class="lb">自动化测试</span><span class="meta">14:01</span></a>
  </aside>
  <main data-dc="lk/main" class="da-main">…</main>
</div>
```

## 聊天主区（头+气泡+输入）
```html
<header data-dc="lk/head" class="da-head"><span class="t">设计评审群</span>
  <svg class="act" data-goto="15-group-settings" viewBox="0 0 24 24" style="fill:none;stroke:currentColor;stroke-width:2"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>
</header>
<div data-dc="lk/body" class="da-body flex flex-col gap-3">
  <div class="da-bubble ai">纪要已生成：本次评审通过 3 项，待改 2 项。</div>
  <div class="da-bubble user">收到，我下午更新设计稿</div>
</div>
<div data-dc="lk/input" class="da-input"><span class="flex-1">发送消息</span><span>⌘↵</span></div>
```

## 工作台卡片宫格
```html
<div data-dc="wb/grid" class="da-cards">
  <a data-dc="wb/c1" data-goto="09-multitable" class="da-card"><span class="ic" style="background:#ece5fb;color:#7a5af8">◇</span><span class="t">多维表格</span><span class="d">结构化数据协作</span></a>
  <a data-dc="wb/c2" data-goto="08-automation" class="da-card"><span class="ic" style="background:#e6f4ea;color:#1f7a48">⚙</span><span class="t">自动化</span><span class="d">定时任务模板</span></a>
</div>
```

## 模态（新建项目类）
```html
<div data-dc="pj/modal" class="da-modal"><div class="box">
  <span class="t">新建项目</span>
  <div class="da-field">项目名称：心灵奇旅风格冥想 App</div>
  <div class="da-btnrow"><span class="da-btn ghost">取消</span><a data-goto="04-project" class="da-btn pri">创建</a></div>
</div></div>
```

纪律：文案虚构；图标 inline style；状态对用 `.mi-skeleton` 同款骨架；
群成员/联系人等资料页用 da-cell 行（mi-cell 同构）+ 虚构昵称；隐私真名零容忍。
