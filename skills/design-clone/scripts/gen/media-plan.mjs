#!/usr/bin/env node
/**
 * media-plan.mjs（M102）——clone/Remix 知识提炼后的媒体规划：识别资产槽位×means×成本预估×回落。
 * 用法: node media-plan.mjs --run <runDir> [--brief <brief.json>]
 * 产物: <run>/knowledge/media-plan.json（consent 申请附摘要；inspect media-plan 步公示履约率）
 * 策略见 references/media-strategy.md。
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { officialSkillPath, arkStandardKey } from "./providers.mjs";

const { values } = parseArgs({ options: { run: { type: "string" }, brief: { type: "string" }, help: { type: "boolean" } } });
if (values.help || !values.run) { console.log("用法: node media-plan.mjs --run <runDir> [--brief <brief.json>]"); process.exit(values.help ? 0 : 1); }
const run = path.resolve(values.run);
const briefP = values.brief ? path.resolve(values.brief) : path.join(run, "knowledge/brief.json");
const brief = fs.existsSync(briefP) ? JSON.parse(fs.readFileSync(briefP, "utf8")) : null;
const viewsDir = path.join(run, "prototype/views");
const views = fs.existsSync(viewsDir) ? fs.readdirSync(viewsDir).filter((f) => f.endsWith(".html")) : [];
const allHtml = views.map((f) => fs.readFileSync(path.join(viewsDir, f), "utf8")).join("\n");
const manifestP = path.join(run, "prototype/assets-manifest.json");
const manifest = fs.existsSync(manifestP) ? JSON.parse(fs.readFileSync(manifestP, "utf8")).assets || {} : {};

const slots = [];
const has = (re) => re.test(allHtml);
const cost = (secs, rate = 0.2) => +(secs * rate).toFixed(1);
// 虚拟人/角色槽：brief 提及角色/形象/对话 或 视图有 .vh 层
if ((brief && /角色|形象|对话|虚拟人|persona|character/.test(JSON.stringify(brief))) || has(/class="vh"/)) {
  slots.push({ slot: "virtual-human", kind: "image+layers", need: "全身立绘+layer_decomposition 透明人物层", means_order: ["reuse-manifest", "agentplan-seedream-pro", "ark-standard-image(consent)", "pollinations-anon"], cost_est: 0, fallback: "静态分层 idle 动效" });
  slots.push({ slot: "virtual-human-idle", kind: "video", need: "首帧 idle 4-5s 无声 480p 无缝循环", means_order: ["css-sprite-parallax(0元默认)", "ark-standard(consent,≈" + cost(4) + "元/条)", "agentplan-large", "agent-native"], cost_est: cost(4), fallback: "CSS/精灵假动效" });
}
// 场景带槽：视图有 .far 但无背景资产登记
if (has(/class="far"/) && !Object.keys(manifest).some((k) => /far|bg|band/.test(k))) {
  slots.push({ slot: "far-band", kind: "image", need: "横幅场景带（16:9/21:9，无主体人物）", means_order: ["capture-reuse", "pollinations-anon", "agentplan-seedream-lite"], cost_est: 0, fallback: "渐变+粒子" });
}
// 图标槽：original attestation 且无 icon 登记
const meta = fs.existsSync(path.join(run, "meta.json")) ? JSON.parse(fs.readFileSync(path.join(run, "meta.json"), "utf8")) : {};
if ((meta.ip_attestation === "original" || (brief && brief.icon)) && !Object.keys(manifest).some((k) => /icon/.test(k))) {
  slots.push({ slot: "icon", kind: "image", need: "full-bleed 圆角图标", means_order: ["official-icons(品牌)", "agentplan-seedream-pro", "pollinations-anon"], cost_est: 0, fallback: "字标混合" });
}
// hero 视频槽：brief video_prompts 存在
if (brief && (brief.video_prompts || []).length) {
  slots.push({ slot: "hero-video", kind: "video", need: (brief.video_prompts[0] || "").slice(0, 60), means_order: ["export-walkthrough(真录屏)", "ark-standard(consent,≈" + cost(5) + "元/条)", "draft-1.5pro-先样片", "agent-native"], cost_est: cost(5), fallback: "禁用于 UI 反馈/文字精度场景" });
}
const plan = {
  at: new Date().toISOString(), run: path.basename(run), policy: "consent-per-session",
  means_available: { official_seedream: !!officialSkillPath("image"), official_seedance: !!officialSkillPath("video"), ark_standard_key: !!arkStandardKey() },
  slots,
  summary: `${slots.length} 槽位；付费预估合计 ≈${slots.reduce((a, s) => a + (s.cost_est || 0), 0).toFixed(1)} 元（仅视频直连档）`,
};
const out = path.join(run, "knowledge/media-plan.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(plan, null, 1));
console.log(JSON.stringify(plan, null, 1));
