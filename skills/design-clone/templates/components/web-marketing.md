# web-marketing 组件库（M18）

官网/营销/商店/文档类（apple/aliyun/HN 类）live 视图积木，c_browser 壳内使用。

## nav + 双 hero
```html
<div data-dc="pg/root" class="wm-root">
  <nav data-dc="pg/nav" class="wm-nav"><span>apple</span><a data-goto="02-store">Store</a><a data-goto="03-mac">Mac</a><a data-goto="05-iphone">iPhone</a></nav>
  <section data-dc="pg/hero" class="wm-hero"><h1>iPhone 17 Pro</h1><div class="s">All out of Pro.</div>
    <div class="wm-cta"><span class="pri">Learn more</span><a class="ghost" data-goto="05-iphone">Buy</a></div></section>
  <section data-dc="pg/band" class="wm-band"><h2 style="font-size:30px;font-weight:600">MacBook Air</h2><div class="s" style="margin-top:8px;font-size:16px;color:var(--color-text-secondary)">Speed of lightness.</div></section>
</div>
```

## 三卡带（云厂商类）
```html
<div data-dc="pg/cards" class="wm-grid">
  <a data-goto="05-ecs-features" class="wm-card"><div class="t">弹性计算</div><div class="d">秒级扩容，按量付费</div></a>
  <a data-goto="06-ecs-pricing" class="wm-card"><div class="t">成本优化</div><div class="d">预留实例与节省计划</div></a>
  <a data-goto="07-price-strategy" class="wm-card"><div class="t">定价透明</div><div class="d">全地域价格明细可查</div></a>
</div>
```

## 产品页（图+信息栏）与价格表
```html
<div data-dc="pg/prod" class="wm-prod">
  <div class="fig">产品渲染位（live-low 占位，不贴截图）</div>
  <div class="info"><div class="t" style="font-size:24px;font-weight:600">云服务器 ECS</div>
    <div class="d" style="font-size:13px;color:var(--color-text-secondary)">高性能弹性计算，99.995% 可用性</div>
    <div class="wm-price">¥0.45/小时 起</div><span class="wm-cta" style="margin:0"><span class="pri">立即购买</span></span></div>
</div>
<table class="wm-table"><tr><th>规格</th><th>vCPU</th><th>内存</th><th>按量价</th></tr>
<tr><td>ecs.g7.large</td><td>2</td><td>8GiB</td><td>¥0.45/h</td></tr></table>
```

纪律：文案自撰（品牌口号可仿写不可照抄长段）；产品图位用 live-low 占位或 genimg；
价格/规格等数字可虚构但格式真实；loading 态用骨架块（`.mi-skeleton`）。
