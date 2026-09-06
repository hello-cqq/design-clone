# demo/ —— 自研原创示例站（Orbit Tasks）

用途：给 design-clone 一个**零 IP 风险、完全离线**的克隆目标（README 演示、CI 冒烟、新门校准）。
不含任何第三方品牌资产；页面自带 data-dc / data-goto / data-act 以便交互门有真控件可点。

```bash
# 起静态服务（任意）
python3 -m http.server 8099 --directory demo
# 克隆它
node skills/design-clone/scripts/clone.mjs --target orbit --platform web --url http://127.0.0.1:8099/ --serve
```
