# Privacy / 隐私边界

1. capture 原图仅存本机 `design-clone-runs/`（.gitignore 排除，永不入仓/不入交付物）。
2. 支付确认/凭证/敏感权限：不自动执行、不记录控件树密码节点（safety-rules §1-3）。
3. 文本层全虚构 + inspect `privacy-scan` 扫手机号/wxid/微信号/邮箱/身份证，交付前清零。
3b. 视觉资产：所有者 run 默认真视觉+文本匿名；他人/第三方 run 用真视觉资产前必须询问授权。
4. handoff 必声明匿名化范围。
