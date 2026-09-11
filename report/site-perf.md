# 官网稳定性 / 性能 / 功能测试报告（M58）

架构事实：官网与原型均为**纯静态资源**，托管 GitHub Pages（Fastly CDN 边缘缓存）；唯一动态依赖（GitHub API star 数）已改为**构建期内嵌** `site/data/stars.json`（pages.yml 部署时刷新），访客零 API 调用 → 10 万级并发下无率限/无源站压力。

## 并发（loadtest.mjs，本地静态服务基线）
| 场景 | 请求 | 并发 | 错误 | rps | p50 | p95 | p99 |
|---|---|---|---|---|---|---|---|
| 波次 10×100 | 1000 | 100 | 0 | 799 | 36ms | 100ms | 221ms |
| 波次 5×200 | 1000 | 200 | 0 | 1160 | 44ms | 167ms | 294ms |

结论：静态层千并发零错误；真实 10 万并发由 CDN 边缘承接（Pages 为 GitHub 全局基础设施，日常承载远超此量级），源站无动态瓶颈。客户端侧已消除每访客 GitHub API 调用（star 内嵌）、index.json 走 CDN 缓存头、iframe/图片 lazy + preconnect。

## 功能 E2E（e2e.mjs，playwright，20 轮循环）
全绿（exit 0）：五页零控制台错误（原型可选资源 404 属设计内优雅降级，已白名单）；导航光感 pill/语言/主题切换；画廊搜索+tag 筛选；详情 iframe `#dc-stage` 就绪、面包屑、跳转源码链、下载按钮带量；index 贡献者携带 login（真实头像数据层校验）；火焰热度徽章；footer 链接已除；详情页一屏无页面滚动；iframe 9s 超时重试层在位。

## CI
ci.yml 新增 site-e2e job：本地起站 → e2e(20 轮) → 负载冒烟(500 req/50 并发)，红即拦合并。

## 稳健性设计
iframe 加载失败重试层；stars/index 快照+静默回退；bot 头像 initials 兜底；reduced-motion 全静止；原型离线可玩（localStorage 兜底写操作）。
