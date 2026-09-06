#!/usr/bin/env node
/**
 * entry.mjs（M44h）：统一入口意图路由——一句话 / 图片 / 链接 / app 名 → 意图 JSON。
 * 输出 {mode: clone|link|remix|export|ask, target, platform, source, scope, url?, images?, question?}
 * 规则：URL(视频/图文宿主→link；普通站点→web clone)；本地图片路径→clone --images；
 *       app 词典(微信/抖音/相机/圆周轨迹/飞书/workbuddy/小红书/b站…)→clone+platform；
 *       平台词(手机/安卓/android|mac/桌面/desktop|网页/web|ios)；范围词(全量/full|场景/scene)。
 * 用法: node entry.mjs "<自由文本>"   |   node entry.mjs --text "<...>"
 */
const A = process.argv.slice(2);
const text = A.includes("--text") ? A[A.indexOf("--text") + 1] : A.join(" ");
if (!text || A.includes("--help")) { console.log("用法: node entry.mjs \"<一句话/链接/图片路径/app名>\""); process.exit(text ? 0 : 1); }
const t = text.toLowerCase();
const out = { mode: null, target: null, platform: null, source: null, scope: "full", raw: text };

const urlm = text.match(/https?:\/\/[^\s]+|[a-z0-9.-]+\.(com|cn|tv|net|org)[^\s]*/i);
const VIDEO_HOST = /douyin|tiktok|kuaishou|bilibili|b23\.tv|xiaohongshu|xhslink|weibo|mp\.weixin|youtube|youtu\.be|instagram/;
const imgs = [...text.matchAll(/[^\s"']+\.(png|jpe?g|webp|gif)/gi)].map((m) => m[0]);

const APPS = [
  [/微信|wechat|wx/i, "wechat", "android"], [/抖音|douyin|tiktok/i, "douyin", "android"],
  [/相机|camera/i, "camera", "android"], [/圆周轨迹|slytherin/i, "slytherin", "android"],
  [/飞书|lark|feishu/i, "mac-lark", "desktop"], [/workbuddy|work\s*buddy/i, "mac-workbuddy", "desktop"],
  [/小红书|xhs|redbook/i, "link-xhs", "web"], [/b站|bilibili|哔哩/i, "link-bili", "web"],
  [/支付宝|alipay/i, "alipay", "android"], [/淘宝|taobao/i, "taobao", "android"],
  [/设置|settings/i, "settings", "android"], [/slack|notion|figma|linear/i, (m) => m[0].toLowerCase(), "desktop"],
];
const platm = t.match(/安卓|android|手机|移动端/) ? "android" : t.match(/\bmac\b|桌面|desktop|电脑/) ? "desktop" : t.match(/\bios\b|iphone|ipad/) ? "ios" : t.match(/网页|网站|web|浏览器/) ? "web" : null;
const scope = t.match(/全量|全部|所有|full|全功能/) ? "full" : t.match(/场景|某个|指定|部分|scene/) ? "scene" : "full";

if (imgs.length) { out.mode = "clone"; out.source = "images"; out.images = imgs; out.target = (text.match(/(?:叫|名为|目标[:：])\s*([\w-]+)/) || [])[1] || "from-images"; out.platform = platm || "web"; }
else if (urlm) { const u = urlm[0]; out.url = u.startsWith("http") ? u : "https://" + u; out.mode = VIDEO_HOST.test(u) ? "link" : "clone"; out.source = out.mode === "link" ? "link" : "crawl"; out.platform = platm || (out.mode === "link" ? "web" : "web"); out.target = (text.match(/(?:叫|名为|目标[:：])\s*([\w-]+)/) || [])[1] || new URL(out.url).hostname.replace(/^www\./, "").split(".")[0]; }
else {
  const hit = APPS.find(([re]) => re.test(text));
  if (hit) { out.mode = "clone"; out.target = typeof hit[1] === "function" ? hit[1](text.match(hit[0])) : hit[1]; out.platform = platm || hit[2]; out.source = "device"; }
  else if (t.match(/改造|调整|换色|改风格|remix|在此基础上/)) { out.mode = "remix"; }
  else if (t.match(/导出\s*figma|figma\s*稿|export/)) { out.mode = "export"; }
  else out.mode = "ask";
}
out.scope = scope;
if (out.mode === "ask") out.question = "想克隆哪个应用/网站？给个名字、链接、或几张截图都行；也可以说「在 xx 原型上改 yy」。";
console.log(JSON.stringify(out, null, 1));
