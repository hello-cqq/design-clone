# 安装指南（跨平台）

doctor 会按当前平台给出对应命令。本表为权威参考。
**Windows 注意**：本 skill 的 `scripts/**/*.sh` 是 bash 脚本，Windows 请在 **WSL2 或 Git Bash** 中运行；
adb/ffmpeg 等二进制本身三平台通用。

## 依赖矩阵

| 依赖 | macOS | Linux (Debian/Ubuntu) | Windows |
|---|---|---|---|
| Node ≥20.19 | `brew install node` | `apt install nodejs npm`（或 nvm） | `winget install OpenJS.NodeJS.LTS` |
| adb | `brew install android-platform-tools` | `apt install adb`（或官方 platform-tools zip） | `winget install Google.PlatformTools`（或 zip+PATH） |
| ffmpeg | `brew install ffmpeg` | `apt install ffmpeg` | `winget install Gyan.FFmpeg`（或静态构建） |
| scrcpy | `brew install scrcpy` | `apt install scrcpy` | GitHub Releases 解压 |
| lux | `brew install lux` / `go install` | GitHub Releases 二进制 | GitHub Releases 二进制 |
| yt-dlp | `brew install yt-dlp` / `pip install yt-dlp` | `pip install yt-dlp` | `winget install yt-dlp` / pip |
| you-get | `pip install you-get` | 同左 | 同左 |
| Playwright Chromium | 统一：`cd <skill>/scripts && npm install && npx playwright install chromium` | 同左（Linux 需 `--with-deps` 补系统库） | 同左 |
| faster-whisper（可选） | `pip install faster-whisper` | 同左 | 同左 |

## 平台特有坑

### macOS
- **quarantine 挂起**：brew 安装的 adb 首次运行可能被 Gatekeeper 卡住（命令无任何输出挂起）。
  修复：`xattr -cr $(brew --prefix)/Caskroom/android-platform-tools/*/platform-tools/` 或对具体二进制 `xattr -d com.apple.quarantine <path>`。
- **5037 端口被 Android Studio 占用**：版本不一致时先 `adb kill-server`。
- 桌面/iOS 镜像模式需要给终端/IDE 授「辅助功能 + 屏幕录制」：系统设置 → 隐私与安全性。
- 长任务防睡眠：`caffeinate -i &`。

### Linux
- **adb 无权限（`no permissions` / `insufficient permissions`）**：需 udev 规则。
  ```bash
  echo 'SUBSYSTEM=="usb", ATTR{idVendor}=="*", MODE="0666", GROUP="plugdev"' | sudo tee /etc/udev/rules.d/51-android.rules
  # 更严谨写法按厂商 idVendor 列出（小米 2717、华为 12d1、OPPO 22d9、vivo 2d95、三星 04e8）
  sudo udevadm control --reload-rules && sudo udevadm trigger
  ```
- Wayland 下 nut.js/pyautogui 桌面自动化不可用（M5 桌面模式走 X11）。
- 无头环境跑 Playwright：`npx playwright install --with-deps chromium`。

### Windows
- **USB 驱动**：部分设备需 Google USB Driver 或厂商驱动（设备管理器里出现感叹号即驱动问题）。
- PowerShell 执行策略不影响 bash 脚本（走 WSL/Git Bash）。
- screenrecord/scrcpy 行为与 Android 侧一致，无平台差异。

### 通用（Android 设备侧）
- 开发者选项：设置 → 关于手机 → 连点「版本号」7 次。
- 必开：USB 调试。厂商加固项见 human-takeover.md（小米"USB 调试(安全设置)"等）。
- 首次连接手机会弹「允许 USB 调试？」→ 勾选"一律允许"。
- 只充电不传数据的线很常见：`adb devices` 空且以上都对 → 换线/换口。
- 无线备选：开发者选项 → 无线调试 → `adb pair <ip:port> <配对码>` 后 `adb connect <ip:port>`。

### Android 模拟器（无真机时，QA 协议第二档）
- 推荐 Android Studio（含 AVD Manager）；纯 CLI：`sdkmanager "platform-tools" "emulator" "system-images;android-34;google_apis;arm64-v8a"`（Apple Silicon 用 arm64 镜像）
- 建 AVD：`avdmanager create avd -n qa -k "system-images;android-34;google_apis;arm64-v8a"`
- 启动：`emulator -avd qa -no-snapshot-load`，`adb devices` 见 `emulator-5554` 即就绪
- 与真机同走 A0–A2 流程；录屏/截图命令无差异。卡启动（HAXM/Hypervisor）→ human-takeover 四段式
