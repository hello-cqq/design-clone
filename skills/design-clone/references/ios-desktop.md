# iOS 模拟器 / 真机 / 桌面捕获细则

## §sim 模拟器工作流（simctl 一等）

前置：`xcrun simctl help` 可用（Xcode + 模拟器运行时）。无则见 §WDA / §人接管。

1. `bash {SKILL_DIR}/scripts/ios/sim-capture.sh list` 确认有 booted 设备；
   无则 `xcrun simctl boot "iPhone 16" && open -a Simulator`
2. 启动目标：`sim-capture.sh launch <bundle-id>` 或 `openurl <深链>`（深链拉起同 Android L5 思路）
3. 进入"截屏 → 决策 → 操作"循环：
   - 截屏：`sim-capture.sh shot capture/screens/<screen-id>.png`
   - 操作：simctl **无原生 tap**——两档：
     a. 人接管（默认）：按 `human-takeover.md` 请用户在模拟器里点，agent 读截屏决策下一步
     b. 坐标自动（可选，需辅助功能权限）：`desktop/capture.sh click x y` 点 Simulator 窗口
        （坐标=窗口偏移+截图坐标，先 shot 一张量偏移）
4. 用户手动操作+定时取证：`sim-capture.sh loop capture/screens 2 20`
5. ui-tree：模拟器无 uiautomator 等价物——以截屏+人接管口述组件为准，
   或在 app 自有 debug 菜单 dump（若目标是我们自己的 app）

产物与 Android/Web 同目录规范（screens/ui-tree/graph.json…），manifest.platform_info 填
`{"os":"iOS Simulator","device":<simctl list 的型号>,"app_bundle":...}`。

## §WDA 真机引导（simctl 缺失或必须真机时）

零付费约束下 WDA 需自签编译，步骤（用户本机 Xcode 免费账号即可）：
1. clone appium/WebDriverAgent，Xcode 打开 WebDriverAgent.xcodeproj
2. 给 WebDriverAgentRunner 配个人团队签名，连真机跑一次测试 target（首次需设备信任开发者）
3. `xcodebuild -project WebDriverAgent.xcodeproj -scheme WebDriverAgentRunner -destination 'id=<udid>' test` 起服务（8100 端口）
4. 之后 agent 用 `curl 127.0.0.1:8100/...` 走 W3C 协议 tap/swipe，截屏 `/screenshot`
全程首次签名需人在 Xcode 点几下 → 按 human-takeover 协议走。
装不起来就回 §人接管 或 Link 模式。

## §mac 桌面

`desktop/capture.sh check` 先验权限（屏幕录制→截屏；辅助功能→click/type）。
- 全屏/区域：`shot out.png [x,y,w,h]`
- 操作：click/type（AppleScript）；应用切换 `osascript -e 'tell app "X" to activate'`
- 循环取证：`loop <目录>`
manifest platform_info：`{"os":"macOS <sw_vers>","display":<分辨率>}`。

## §win 桌面（无本机验证，给命令模板）

- 截屏：PowerShell `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Screen]::PrimaryScreen | ...`
  或 nircmd（免费小工具）`nircmd savescreenshot out.png`
- 键鼠：PowerShell `Add-Type -MemberDefinition ... SendInput` 或 AutoHotkey 脚本
- 循环：`for /L` + timeout
agent 在 win 环境按上面模板生成 `.ps1` 放产物目录 scripts/ 副本，首次运行请人确认执行策略。

## Electron 应用专节（M18）

- a11y 树默认空（4 个无名元素）：**不要**尝试元素名点击；走 CGEvent 坐标+clickv（action-protocol 决策树）。
- accessory 类（如 WorkBuddy）`activate` 不 raise 主窗：捕获用 `windowid.sh <name>` + `screencapture -l <wid>` 窗裁；操作仍 clickv。
- 可选增强：`open -a <App> --args --force-renderer-accessibility` 重启后 a11y 暴露 DOM，
  可元素级点击——**重启用户应用必须先征得同意**。
- 视图交付必须 live（templates/components/desktop-app.*），截图仅 compare。
- rail/侧栏图标：从 capture 裁真图标（`extract-assets` 批量 bbox，44-60px 物理即可 2x 显示），选中态白圆角 pill（`.da-rail span.on`），见 mac-lark 05-workbench 范例。
