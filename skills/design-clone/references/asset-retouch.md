# 资产修图 / 小物件擦除（patch-erase 配方）

工具：`scripts/gen/patch-erase.mjs`（零新增依赖，sharp only）。
定位：**小物件擦除**（铅笔/水印/角标/瑕疵/夹带物），静帧或逐帧视频；**不适用**大面积或语义复杂背景
（人脸重建、结构缺失）→ 有 POLLINATIONS_TOKEN 时走 genimg kontext img2img，否则重取材。

## 模式
| 模式 | 用法 | 场景 |
|---|---|---|
| 静帧 mask | `--mask poly/rect/color[@region]` + `--streak --feather N` | 单图去物 |
| 颜色键 | `--mask color:RRGGBB,tol@x,y,w,h`（限定区域防误伤肤色/落日） | 高饱和小物件 |
| 帧目录 | `--in dir --out dir`（逐帧独立选源，抗运动） | 视频批处理 |
| 模板跟踪 | `--track <tpl.png> --trackmask poly --window 24 --tracktol N` | 视频中小物件随镜头漂移；score>tol 的帧自动跳过 |
| 参考帧移植 | `--srcreplace <clean.png>`（与 track 同坐标系） | 同镜头静漂移：清洗帧直接移植，**完美源** |

原理：边界环 SSD 选最优同帧源补丁（patch-match lite）；`--streak` 按邻域主梯度方向加权候选（发丝/毛发/木纹）；
距离场羽化融合；逐帧"同帧相对补丁"天然抗运动。

## 首用例：女形象耳后铅笔（M75/W8）
- 静帧 `site/assets/logo-girl.png`（1280×1178）：4 段 poly 顺序擦除（ shaft → 金属箍/橡皮残影 → 耳上残黄 → 发际缝），
  每段 `--streak --feather 4-7`；收尾用"严格黄扫描"（r>195,130<g<200,b<95）验残留=0。
- `site/assets/logo-main.png`（双联图，左女）**禁用全图自动循环**（落日暖光会误匹配拉出横条）：手工 poly 两段 + 残黄 rect 收尾；
  logo-main-256/favicon 由清洗后 main 重缩放。
- 视频 `ident-light.mp4`（880×660@24, 179 帧）：女生躺姿镜头分三段键帧模板：
  f2（poly 643,443;670,452;693,477;690,480;660,460;641,448）→ f150（664,454;700,466;726,490;722,502;694,482;660,466）→
  f160（668,474;724,486;728,506;672,506），各配 `--srcreplace` 清洗帧、`--tracktol 1500-1600 --dilate 3 --feather 5`，
  顺序串联三遍（后遍自动跳过前遍已修帧）；`ident-dark.mp4` 无女生特写（皮肤像素检测=0）不处理。
- 原片备份：`design-clone-runs/_asset-backups/`（gitignore，不入仓）。

## 自检清单（每次修图后）
1. 严格色扫描残留=0（脚本见上）；2. 100% zoom 目检接缝/耳/发丝自然；3. 视频抽 3 帧（段首/中/尾）zoom 目检；
4. 站点 e2e 不受影响（资产仅替换不改引用）；5. VLM 复核"无残留物件、无新伪影"。

## 开源复用提示
mask/模板坐标是**该素材的配方**而非工具逻辑；新素材先 zoom 定位→小 poly→扫描验证循环；
颜色键务必加 region 限定（肤色/暖光误匹配是第一大坑）。
