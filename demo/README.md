# demo/ —— 自研原创示例站（宠物乐园 · PetPark）

用途：给 design-clone 一个**零 IP 风险、完全离线可复跑**的克隆目标（README 演示、CI 冒烟、新门校准）。
M53 起替换原 Orbit Tasks：移动端 app 形态、2.5D 粘土质感萌宠风，展示 skill 的视觉上限。
不含任何第三方品牌资产；页面自带 data-dc / data-goto / data-act 以便交互门有真控件可点；
萌宠图为 genimg.mjs clay-icon 免费档生成（动物形象，非真人脸）。

```bash
# 起静态服务（任意）
python3 -m http.server 8099 --directory demo
# 克隆它
node skills/design-clone/scripts/clone.mjs --target petpark --platform mobile --url http://127.0.0.1:8099/ --serve
```

存量 showcase run：design-clone-runs/demo-petpark（全门绿：interact 0 死 / inspect 42-0 / ui-smoke 27-0 / critique 5×5）。
