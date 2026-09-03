# 动作协议（action-protocol）

宿主 agent 的决策循环与动作执行语法。决策权始终在宿主 VLM：
**看（截图+控件树）→ 想（下一步动作与理由）→ 做（执行）→ 记（actions.jsonl + graph）**。

## 决策输入

每轮决策同时参考：
1. 最新截图（`capture/screens/<最新屏>.png`）
2. 控件树（Android：uiautomator dump 的 XML，含 `text/resource-id/bounds/clickable`；
   Web：capture 脚本输出的 ui-tree JSON，含选择器与坐标）
3. 捕获计划（范围/预算）与已走过的路径（`graph.json`）

控件树优先于纯视觉：有明确控件时用 `bounds` 中心点点击；自绘界面（无节点）才用视觉估计坐标。

## Android 动作语法（adb）

```bash
# 截图 + 控件树（每轮必做；多屏设备必须用 capture.sh，见下）
bash {SKILL_DIR}/scripts/android/capture.sh capture/screens/<screen-id>.png
adb shell uiautomator dump /sdcard/ui.xml && adb pull /sdcard/ui.xml capture/ui-tree/<screen-id>.xml
```

**多屏设备坑（折叠屏/平板常见）**：`adb exec-out screencap -p` 会把
"[Warning] Multiple displays..." 写进 stdout 污染 PNG；`-d 0` 在部分 HyperOS 版本无效。
正确姿势：`screencap -p -d <SurfaceFlinger长id> /sdcard/x.png && adb pull`，
长 id 用 `adb shell dumpsys SurfaceFlinger --display-id` 获取。`capture.sh` 已封装并缓存 id。

```bash
# 点击（x y 为 bounds 中心）
adb shell input tap <x> <y>
# 长按
adb shell input swipe <x> <y> <x> <y> 800
# 滑动（方向用屏幕比例换算；300-500ms 模拟人手）
adb shell input swipe 540 1800 540 600 400     # 上滑
adb shell input swipe 540 600 540 1800 400     # 下滑
adb shell input swipe 900 1200 200 1200 400    # 左滑
# 返回 / 主页 / 最近任务
adb shell input keyevent 4    # BACK
adb shell input keyevent 3    # HOME
adb shell input keyevent 187  # RECENTS
# 文本输入（仅 ASCII；中文见下）
adb shell input text "hello"
```

中文输入：优先 `npx @midscene/android ai-input "<文本>"`（走 yadb），
或提示用户手动输入后继续。不要用 `input text` 输中文（会丢字）。

等待：动作后 `sleep 1.5`（页面切换/动画稳定）再截图；加载中的页面 `sleep 3` 重试一次。

### Midscene 增强（可选，需 MIDSCENE_MODEL_* 环境变量）

视觉定位比手工坐标更稳，尤其是自绘 UI：

```bash
npx @midscene/android ai-tap "底部第二个标签'通讯录'"
npx @midscene/android ai-input "搜索框" --text "关键词"
npx @midscene/android ai-swipe "列表区域" --direction up
npx @midscene/android ai-screenshot --output capture/screens/xx.png
```

## Web 动作语法（Playwright）

Web 捕获由 `scripts/web/capture.mjs` 自动完成（链接点击/页面跳转/截图/录屏）。
需要更精细的手动操作时：

```bash
npx @midscene/web ai-tap "登录" --url <当前页>
```

## 探索策略

### 指定场景（默认推荐）

按计划路径逐步推进；遇到计划外的分叉只在 `graph.json` 记录入口（边指向 `null`，
`note` 写明"范围外入口：<名称>"），不进入。到达终点或安全边界即停。

### 全量遍历（用户明确要求时）

1. 从首页开始，广度优先处理"一级入口"（底部标签栏/顶部主导航）
2. 每个页面最多执行 `clicks_per_screen`（默认 3）个动作，优先：未访问的导航项 > 列表首项 > 返回
3. 动作总预算 `max_steps`（默认 30）用尽或无未探索入口时停止
4. 弹窗处理：广告/引导弹窗先关闭（找"关闭/跳过/以后再说"）；权限弹窗按安全规则
5. 每 10 步向用户汇报一次进度（已覆盖屏数/剩余预算）

## 录屏（Android）

`adb shell screenrecord` 单次最长 180 秒且无声，且**输出路径必须在设备端**（/sdcard/...）。
用 `scripts/android/record.sh` 循环录制：设备端录 160s 一段后回拉，产物
`videos/record-01.mp4`、`record-02.mp4`…，`Ctrl+C` 停止；连续失败 3 次自动熔断。
scrcpy 可用时优先（支持音频、无时长限制）：

```bash
scrcpy --no-window --no-playback --record capture/videos/main.mp4
```

## 动作失败处理

- 点击无反应（截图哈希不变）：重试一次 → 换控件树里相邻可点元素 → 记录失败边跳过
- **注入疑似被系统拦截**（tap 与 keyevent 都无效）：走 human-takeover §2（厂商安全开关）
- 页面卡死/白屏：等待 5s，截图仍异常则 `keyevent 4` 回退
- 连续 3 次失败：暂停，把现状（截图+问题）交给用户决定

## 稳健性规则（真机实测沉淀）

1. **启动后等稳定**：`am start`/`monkey` 后等到连续两次 `uiautomator dump` 内容一致再决策
   （闪屏/广告/加载会让首 tap 落空，微信实测踩过）
2. **动作后验证**：每次 tap/swipe 后截图对比哈希；未变化 = 未生效 → 重新 dump 用 bounds 中心重试一次
3. **灭屏自检**：每轮决策前 `adb shell dumpsys power | grep mWakefulness`，Asleep 则 `keyevent 224`
   唤醒；醒来是锁屏 → 交用户（human-takeover §3）
4. **截图先压缩再看**：原图常 >1MB/2K 分辨率，宿主读取前用 sharp 或 sips resize 到 ~540 宽
   （`node -e "require('sharp')(f).resize(540).toFile(out)"`）
5. **后台进程防杀**：录屏/serve 等长进程用 `nohup ... &` + `disown`，避免宿主 shell 超时连带杀死
6. **pkill 精确匹配**：停止自启脚本用完整特征（如 `pkill -f "android/record.sh"`），别用宽泛模式误杀

## 桌面点击决策树（M18，默认路径）

1. `desktop/capture.sh raise <process>` 前置（frontmost+AXRaise）
2. **fresh shot** 再读图取坐标（禁复用旧坐标，LESSONS 91）
3. `clickv <x> <y>`（CGEvent 真实 HID + 点前后 diff 闭环，miss 自动偏移重试≤2）
4. 仍 miss → 检查挡窗：告知用户后临时移走（`set position {-2200,400}`，完事恢复）→ 重试
5. 仍 miss → human-takeover loop（`capture.sh loop`，用户点我截）兜底，并记 LESSONS
坐标换算：逻辑点 = 预览坐标 × (物理宽/预览宽) / 2（Retina，LESSONS 87）。
一键 sweep：`DC_FRONT=<proc> SWEEP_OUT=<dir> bash capture.sh sweep "x y name;x y name"`。
