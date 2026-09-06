#!/usr/bin/env node
/**
 * privacy.mjs — 通用隐私门（M44c，全平台全 run）。
 * 用法:
 *   node privacy.mjs --run <runDir>             # 门：prototype 不得出现 anon_map 真键/PII；face_assets 必须已 genimg 虚构
 *   node privacy.mjs --run <runDir> --discover  # 起草辅助：从 capture ui-tree/DOM 提取候选真名/真句 + 列头像类资产
 * 配置: <run>/knowledge/privacy.json {anon_map:{真:假}, face_assets:[], keep_assets:[], keep_brands:[]}
 * 退出码: 0=通过/无配置 4=泄露或未虚构化
 */
import fs from "node:fs";
import path from "node:path";

const A = process.argv.slice(2);
const get = (k, d) => (A.includes(k) ? A[A.indexOf(k) + 1] : d);
const run = path.resolve(get("--run", ""));
if (!run || A.includes("--help") || A.includes("-h")) {
  console.log("用法: node privacy.mjs --run <runDir> [--discover]");
  process.exit(run ? 0 : 1);
}
const privP = path.join(run, "knowledge/privacy.json");
const protoDir = path.join(run, "prototype");
const PII = [/(?<!\d)1[3-9]\d{9}(?!\d)/, /wxid_[a-z0-9_]{6,}/i, /[\w.+-]+@[\w-]+\.(com|cn|net|org)/i, /(?<!\d)\d{17}[\dXx](?!\d)/, /(?<!\d)\d{19}(?!\d)/];
const SKIP_GEN = new Set(["assets-qa.json", "assets-manifest.json", "images.json"]);
const KIN = new Set(["爸", "妈", "妈妈", "爸爸", "姐", "哥", "弟", "妹", "爷", "奶", "咱妈", "咱爸", "家", "我", "你", "他", "她"]);
const APPUI = new Set(["微信", "通讯录", "发现", "我", "服务", "收藏", "设置", "朋友圈", "视频号", "直播", "扫一扫", "听一听", "看一看", "搜一搜", "附近的人", "游戏", "小程序", "搜索", "群聊", "标签", "公众号", "服务号", "新的朋友", "群聊名称", "群二维码", "群公告", "群管理", "备注", "查找聊天记录", "消息免打扰", "置顶聊天", "保存到通讯录", "我在群里的昵称", "聊天信息", "标为未读", "置顶", "删除该聊天", "取消", "发消息", "删除", "朋友权限", "仅聊天", " Mac 微信已登录", "Mac 微信已登录", "加载完成", "最近使用", "搜索结果", "全部", "订阅", "首页", "我的", "余额", "交易记录", "信用卡", "理财通", "保险", "账单", "收付款", "钱包", "文件传输助手", "支付设置", "零钱通", "亲属卡", "身份信息", "生活服务", "我的设备", "WLAN", "VPN", "个人热点", "云存储空间已满", "妙享背屏", "已关闭", "已开启", "搜索系统设置项", "我的计划", "我的足迹", "热门城市", "新旅行", "已结束", "计划", "探索", "发起群聊", "添加朋友", "收付款", "扫一扫"]);

function protoFiles() {
  const out = [];
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (e.name !== ".cache" && e.name !== "assets") walk(p); } else if (/\.(html|json)$/.test(e.name)) out.push(p); } };
  if (fs.existsSync(protoDir)) walk(protoDir);
  return out;
}

if (A.includes("--discover")) {
  const trees = path.join(run, "capture/ui-tree");
  const texts = new Set();
  const push = (t) => {
    t = String(t || "").replace(/&#\d+;/g, " ").trim();
    if (!t || t.length < 2 || t.length > 40) return;
    if (/^[\d:.\s]+$/.test(t)) return;
    if (KIN.has(t) || APPUI.has(t)) return;
    texts.add(t);
  };
  if (fs.existsSync(trees)) for (const f of fs.readdirSync(trees)) {
    const p = path.join(trees, f);
    if (f.endsWith(".xml")) { for (const m of fs.readFileSync(p, "utf8").matchAll(/text="([^"]+)"/g)) push(m[1]); }
    else if (f.endsWith(".json")) { // web DOM / desktop AX 树
      let j = null; try { j = JSON.parse(fs.readFileSync(p, "utf8")); } catch {}
      const nodes = (j && (j.elements || j.nodes)) || (Array.isArray(j) ? j : []);
      const walk = (n) => { if (!n || typeof n !== "object") return; push(n.text || n.label || n.name || n.value); for (const c of (n.children || n.subnodes || [])) walk(c); };
      if (Array.isArray(nodes)) nodes.forEach(walk); else walk(nodes);
    }
  }
  const assetsDir = path.join(protoDir, "assets");
  const avatars = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir).filter((f) => /^(ava|mem|head|avatar|face|cover|post)/i.test(f)) : [];
  console.log(JSON.stringify({ candidate_personal_strings: [...texts].sort(), avatar_like_assets: avatars, note: " curate 进 knowledge/privacy.json：个人真名/真句/真ID→anon_map；真人脸/真人照片→face_assets；官方/系统头像→keep_assets；商家/品牌→keep_brands；称呼不入 map" }, null, 1));
  process.exit(0);
}

if (!fs.existsSync(privP)) { console.log(JSON.stringify({ configured: false, note: "无 knowledge/privacy.json（跑 --discover 起草）" })); process.exit(0); }
const priv = JSON.parse(fs.readFileSync(privP, "utf8"));
const anon = priv.anon_map || {};
const faces = priv.face_assets || [];
const leaks = [], pii = [], faceBad = [];
for (const f of protoFiles()) {
  if (SKIP_GEN.has(path.basename(f))) continue;
  const txt = fs.readFileSync(f, "utf8");
  const rel = path.relative(run, f);
  for (const key of Object.keys(anon)) if (key && txt.includes(key)) leaks.push({ file: rel, key });
  for (const re of PII) { const m = txt.match(re); if (m) pii.push({ file: rel, hit: m[0].slice(0, 24) }); }
}
let manifest = { assets: {} };
try { manifest = JSON.parse(fs.readFileSync(path.join(protoDir, "assets-manifest.json"), "utf8")); } catch {}
for (const fa of faces) {
  const base = path.basename(fa);
  const entry = manifest.assets && manifest.assets[base];
  if (!entry) faceBad.push({ asset: fa, reason: "no-provenance(未登记 manifest，视为未处理的真照片)" });
  else if (entry.source !== "genimg") faceBad.push({ asset: fa, reason: "source=" + entry.source + "(真人照片未换虚构)" });
}
const bad = leaks.length || pii.length || faceBad.length;
const qd = path.join(run, "qa");
fs.mkdirSync(qd, { recursive: true });
fs.writeFileSync(path.join(qd, "privacy.json"), JSON.stringify({ at: new Date().toISOString(), configured: true, leaks, pii, face_bad: faceBad, ok: !bad }, null, 1));
console.log(JSON.stringify({ configured: true, leaks, pii, face_bad: faceBad, ok: !bad }));
process.exit(bad ? 4 : 0);
