# Media Engine（M99-2）——生图/生视频 provider 路由与 agent-native 协议

> 目标：把「豆包级」生图生视频能力接入 skill，且**无 key 环境永不硬失败**。
> 单一挂点：生图=`scripts/genimg.mjs`（全链路 chokepoint）；生视频=`scripts/genvideo.mjs`；后处理=`scripts/media.mjs`。

## 1. Provider 矩阵（`scripts/gen/providers.mjs` 探测序）

| 厂商 | 生图 | 生视频 | key env | 备注 |
|---|---|---|---|---|
| 火山方舟 Ark | Seedream 4.5（`doubao-seedream-4-5-251128`） | Seedance 1.5（`doubao-seedance-1-5-pro-251215`） | `ARK_API_KEY` | 豆包同源；模型名可 `ARK_IMAGE_MODEL`/`ARK_VIDEO_MODEL` 覆写 |
| 可灵 Kling | — | kling-v2-master | `KLING_ACCESS_KEY`+`KLING_SECRET_KEY` | HS256 JWT 自签（30min） |
| dashscope | 万相 wanx2.1-t2i-turbo（异步任务） | wanx2.1-t2v-turbo | `DASHSCOPE_API_KEY` | X-DashScope-Async + 任务轮询 |
| MiniMax | image-01 | video-01（task+file 两段） | `MINIMAX_API_KEY` | Bearer |
| pollinations | flux 匿名 / kontext(需 token) | — | 无 | **最终回落档**；落盘即擦水印（M76 纪律不变） |

- 显式指定：`DC_IMAGE_PROVIDER` / `DC_VIDEO_PROVIDER`（子串匹配，如 `seedream`）。
- 多 provider 顺序回落：前者抛错自动试下一个，全败才回落 pollinations（图）/ exit 3（视频）。
- 缓存纪律：genimg 缓存键不变，另写 `<cache>.eng` 记录引擎；**仅 pollinations 档擦水印**，provider 档不擦。
- manifest 登记：`images.json` 的 `engine` 字段写真引擎名（溯源/门禁可核）。

## 1b. AgentPlan 适配（M100 实测）

三端配置形态（`discoverAgentPlan()` 自动解析，不假设 env）：
- **opencode** `~/.config/opencode/opencode.json(c)` → `provider.volcengine-agent-plan`（baseURL `https://ark.cn-beijing.volces.com/api/plan/v3` + `ark-…` key，OpenAI/Responses 兼容）
- **claude code** `~/.claude/settings.json` env（ANTHROPIC_BASE_URL/AUTH_TOKEN）
- **codex** `~/.codex/config.toml` `[model_providers.*]`（base_url + env_key/api_key）

**实测结论（report/provider-probe-*.json 留档）**：AgentPlan key 仅授权 `/api/plan/v3` 的 LLM/VLM（chat/completions 含 vision）；标准 `/api/v3` 返回 401、生图/生视频端点全 base 败 → **生图/生视频仍走 pollinations 回落 + agent-native 履约协议**；**VLM 语义面已接入**：gen-loop 四维 rubric（切题/质感/美感/可用性）由 doubao-seed-2.1-turbo 打分（无配置静默回落启发式），`vlmChat()` 亦可供 critique/语义自检复用。
配额纪律：probe-providers.mjs 单次仅 1 张 512 图+1 条 3s 视频任务+1 次 chat；结果掩码留档。

## 2. agent-native 回落协议（无 key 时的主路径）

宿主 agent（opencode/Claude Code/Codex/Qoder…）通常自配了图像/视频模型（豆包、可灵、MiniMax、千问、imagegen 工具等）。skill 不假设 key，改走**履约请求**：

1. `genvideo.mjs` 无 provider → exit 3 并写 `<outdir>/media-request.json`：
   `{kind:"video", items:[{prompt, out(绝对路径), duration, aspect}]}`。
2. 宿主 agent 用**自配工具**逐条产出 `out` 指向的 mp4（ prompt 原样使用，不得改写语义）。
3. 重跑 `node genvideo.mjs --brief/--prompt ... --verify`：skill 校验文件存在+ffprobe 通过→ffmpeg 归一化（H.264+faststart）+登记 `engine:"agent-native"`。
4. 生图同构：agent 直接产 png 到目标路径后，跑 `img/gen-loop.mjs --verify-only`（或 asset-qa）验收并登记 provenance。

纪律：agent-native 产物同样过 `img/asset-qa.mjs` + privacy 门；PROVENANCE/assets-manifest 记 `engine:"agent-native:<工具名>"`。

## 3. 后处理工具集（`scripts/media.mjs`）

`webp | avif | gif | frames | matte | compress`——sharp(libvips) 编码 webp/avif、ffmpeg 编 gif/抽帧、keybg 抠透明、palette 双档压缩。原型资产统一 webp 优先（体积），hero 视频配 poster 静帧（`frames --fps 1` 首帧）。

## 4. 视频进原型的约定（ADR-M99-video）

- 允许 `<video>` 作 **hero 层**（`.far` 远景或角色 idle 层）：必须 `muted loop playsinline` + `poster=` 静帧 + `prefers-reduced-motion` 下 `pause()+显示 poster`。
- 门禁口径：`<video>` 不计入 pasted-screenshot 的 img 覆盖门，但**必须**有同层活控件或 `data-act` 热点（禁整屏视频当 UI）；video 文件入 assets-manifest（source=genvideo/agent-native）。
- 体积：单 video ≤ 2MB（webm 优先），封面/画廊仍静态图。
