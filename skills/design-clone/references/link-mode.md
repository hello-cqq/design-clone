# Link 模式细则（从视频/图文链接取材）

## 六级路由梯（总架构）

```
intent.mjs "<原始分享文本>" --run
 L1 CLI 直下   fetch.mjs(lux→yt-dlp→you-get) / xhs.mjs / yt-dlp(YT,TT)
 L2 headless   web-sim.mjs（DOM/API 解析；FB 走 og；免登优先）
 L3 headed     web-sim --headed（登录墙：用户扫码，profile 持久化免重复）
 L4 Web GUI    web-sim --headed --swipe --clip（拖拽轮播+关键区域截图）
 L5 手机深链   android/deeplink-capture.mjs（横滑/长按保存/区域裁剪；无网检测）
 回落          无设备 L5→L4；全败 ladder.json 留痕交人决策
```

辅助：`proxy-env.mjs`（系统代理感知，被墙平台先 eval）、`meta.mjs`（标题/描述/置顶评论/
desc+评论里的 GitHub·官网 URL→secondary_sources 追加 Web Clone）、
`region-crop.mjs`（关键区域裁图/裁视频，bbox 三档）、`keyframes.sh`+`dedup.mjs`。
意图 style_only（非产品 UI 的审美素材）→ `style-extraction.md`。
一屏放不下的内容：捕获侧 fullPage 证据；原型壳双向滚动；演示自动 scrollIntoView。

## 短链解析

分享短链先展开成网页链接（HEAD 跟随重定向，保留全部参数，小红书必须保留 `xsec_token`）：

```bash
curl -sIL -A "facebookexternalhit/1.1" "https://v.douyin.com/xxxx" | grep -i '^location'
```

抖音分享口令文本里正则提取 `https?://v\.douyin\.com/\w+/?` 再解析。

## 一键脚本

```bash
# 通用级联下载（抖音/B站/快手/微博/TikTok…）：lux → yt-dlp → you-get，失败 exit 2 转网页模拟
node {SKILL_DIR}/scripts/link/fetch.mjs "<url>" --out <产物>/capture

# 小红书专用（图文原图/视频，解析 __INITIAL_STATE__，登录墙用 --headed 人工登录）
node {SKILL_DIR}/scripts/link/xhs.mjs "<url>" --out <产物>/capture [--headed]
```

## 平台下载矩阵（按序尝试，失败降级）

| 平台 | 首选 | 次选 | 说明 |
|---|---|---|---|
| 抖音 | `lux "<url>" -o <frames目录>` | `yt-dlp "<url>"` | lux 同时支持视频与图集 |
| B站 | `yt-dlp "<url>"` | `lux "<url>"` | 高清需登录 cookies |
| 小红书·视频 | `yt-dlp "<url>"` | `lux "<url>"` | 需 cookies（a1/web_session） |
| 小红书·图文 | 网页模拟提取 | — | yt-dlp 拿不到原图，只能拿缩略图 |
| 快手 | `you-get "<url>"` | 网页模拟 | yt-dlp 不支持快手 |
| 微博/TikTok/YouTube | `yt-dlp "<url>"` | `lux` | — |
| 其他 | `yt-dlp` | `lux` → 网页模拟 | — |

cookies 用法：`yt-dlp --cookies cookies.txt`、`lux -c cookies.txt`（Netscape 格式）。
提示用户从浏览器导出（或手动粘贴关键字段），**不要把 cookies 写进任何产物**。

## 网页模拟方案（下载失败的兜底）

适用：登录墙、反下载、小红书图文帖。用可见浏览器让用户先登录：

```bash
# 方案1: Midscene（配置了 MIDSCENE_MODEL_* 时）
npx @midscene/web ai-scroll "向下滚动" --url "<目标页>"
# 方案2: 手工脚本化（Playwright，headed 模式）
```

流程：打开目标页 → 若出现登录框，暂停请用户在窗口内登录 → 用户确认 →
滚动浏览完整帖子 → 截图保存 `capture/frames/` → 图文帖提取全部图片：
页面内 `window.__INITIAL_STATE__` 里 `note.imageList[].urlDefault`（带 Referer 下载原图），
或直接从 `<img>` 的 src 收集。

## 手机模拟方案（仅 app 内可打开的内容）

分享链接用 deeplink 拉起对应 app，走 Clone 模式的 Android 循环边播边录：

```bash
adb shell am start -a android.intent.action.VIEW -d "<分享链接>"
```

## 抽帧与去重

```bash
bash {SKILL_DIR}/scripts/link/keyframes.sh <视频文件> <输出目录>
```

内部逻辑：`select='gt(scene,0.4)'` 场景切换帧 + `fps=1` 采样，合并后按文件名排序，
再跑 `node {SKILL_DIR}/scripts/dedup.mjs` 去重。短视频（<60s）1fps 足够。

## 转录（可选，视频含口播/设计讲解时）

优先 `faster-whisper`（MIT，离线免费）：

```bash
pip install faster-whisper
python -c "
from faster_whisper import WhisperModel
m = WhisperModel('large-v3-turbo', compute_type='int8')
segs, _ = m.transcribe('<音频>', vad_filter=True)
print('\n'.join(f'{s.start:.1f}\t{s.text}' for s in segs))
" > capture/transcript.tsv
ffmpeg -i <视频> -vn -ar 16000 -ac 1 audio.wav   # 先分离音频
```

无 GPU 时 `large-v3-turbo` int8 可 CPU 跑；嫌慢降 `small`。
转录文本按时间戳对齐到关键帧，作为页面语义证据（作者讲的设计思路写进 DESIGN.md）。

## 帧 → 页面识别

你（宿主 VLM）批量看帧，输出识别结果到 `capture/graph.json`（与 Clone 模式同构）：
- 每个识别出的页面一个 node，`screenshot` 指向最清晰的证据帧，
  `evidence` 字段列出全部相关帧与时间戳
- 转场关系写 edges（`action.type` 用 `video_transition`，`note` 写时间戳区间）
- 一闪而过（<0.5s）或模糊的屏：`fidelity: low`，生成原型时降低细节承诺并在交付时说明

之后的 tokens 提取、DESIGN.md、原型生成与 Clone 模式完全一致（§A 的 A3/A4）。
