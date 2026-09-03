# 品牌资产协议（brand-protocol，借鉴 huashu-design，MIT）

Remix 涉及**具体品牌**（"改成 Stripe 那种"/用户公司品牌）且预设库没有时，强制执行 5 步。
核心戒律：**绝不从记忆猜品牌色**——模型记忆里的品牌色方差极大。

| 步 | 动作 | 失败兜底 |
|---|---|---|
| 1 问 | 用户有 brand guidelines / 品牌手册 / logo 文件吗？有则直接用 | 无 → 2 |
| 2 搜官方品牌页 | `<brand>.com/brand`、`brand.<brand>.com`、`<brand>.com/press`（Playwright 打开抓取） | 404/墙 → 3 |
| 3 下载资产 | ① 官方 SVG/logo 文件 → ② 官网 HTML 全文 → ③ 产品截图取色（tokens.mjs） | 逐条降级 |
| 4 提取色值 | 从资产 grep 全部 `#xxxxxx`，按频率排序，过滤黑白灰；字体从 CSS font-family 链读 | — |
| 5 固化 | 写 `knowledge/brand-spec.md` + tokens.css 变量（`--brand-*`），所有视图引用变量 | — |

`brand-spec.md` 格式：

```markdown
# brand-spec · <brand>
source: <抓取的官方 URL 与时间>
colors: primary #xxx (freq n) / secondary / bg / text
type: display <族> / body <族>
radius/shadow/spacing 观察: ...
confidence: high|medium（来源为截图取色时标 medium）
```

绑定后它是**契约不是建议**：不得发明体系外颜色；与用户指令冲突时先问。
多品牌并存时指定 primary（拥整体观感、冲突时胜出），其余只借组件级元素。
刷新/追加/换主/移除都更新 `brand-spec.md` 的 change_log。
