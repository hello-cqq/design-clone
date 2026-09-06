# Privacy / 隐私边界

design-clone 处理的是**别人产品的界面**和**可能含个人信息的捕获物**，因此隐私不是附加项而是门。规则如下，全部有代码强制执行点。

## 数据在哪里

1. capture 原图/录屏/控件树仅存本机 `design-clone-runs/`（`.gitignore` 排除，永不入仓、不进交付 zip、CI 不上传）。
2. 本地服务 `serve.mjs` 只绑定 loopback；写接口白名单 + 路径包含校验 + 8MB 上限（见 `SECURITY.md`）。
3. 导出产物（zip/目录/服务端 `export/<ts>/`）只含原型像素与看板 JSON，不含 capture 原图。

## 不做什么（安全红线）

4. 支付不自动执行、密码不代输、验证码暂停等人（`references/safety-rules.md`）；控件树中的密码节点不记录。
5. GUI 采集真实设备/App 前必须有 `knowledge/consent.json` 收据（clone.mjs/entry.mjs 硬门）。
6. 不联网上传任何捕获物；生图走用户自有/免费通道，prompt 不含个人身份内容。

## 文本与视觉匿名化（门：qa/privacy.mjs + inspect privacy-scan）

7. 文本层全虚构：真名→场景化假名（`gen/fakename.mjs`），称呼保留；`privacy-scan` 扫手机号/wxid/微信号/邮箱/身份证，交付前清零。
8. 视觉层：个人真人脸必须 genimg 虚构同名替换（`knowledge/privacy.json.face_assets`）；官方/商家标识可保留但需登记 `keep_brands` 且来源为操作者自有 capture。
9. 每 run `knowledge/privacy.json`（anon_map/face_assets/keep_assets/keep_brands）是匿名化契约，`--discover` 可从 android XML / web AX JSON 起草。

## 对外声明

10. handoff 与 showcase 必声明匿名化范围与排除项；复刻产物不得冒充原创（README 许可节）。
11. 仓库自身不含任何第三方截图/logo/字体（`docs/PROVENANCE.md`）；README/站点视觉只允许自研 demo 目标。

## 如果你在自己的 run 里发现漏网的个人信息

跑 `node scripts/qa/privacy.mjs --run <run> --discover` 起草补充映射 → 修正 `knowledge/privacy.json` → 重跑门；必要时删 capture 原图重抓。
