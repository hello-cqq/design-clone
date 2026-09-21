#!/usr/bin/env node
/**
 * media-consent.mjs（M101）——生成 means 发现+授权门辅助（skill=指挥者，agent=履约者）。
 * 用法:
 *   node media-consent.mjs --discover          # 枚举可用 means 与配额形态（不联网生成）
 *   node media-consent.mjs --ask-text --kind image|video|layers [--what "<拟生成内容>"]
 *                                            # 打印标准申请话术（agent 向用户展示，每 session 至多一次）
 *   node media-consent.mjs --check             # 校验本 session 授权：DC_MEDIA_CONSENT 存在即 0，否则 4
 * 授权纪律：按需申请、一个 session 至多一次；匿名 pollinations 档免申请（PROVENANCE 披露）。
 * 批准后宿主 agent 在其 shell 导出 DC_MEDIA_CONSENT=<means 列表|all> 供后续脚本/登记引用。
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { parseArgs } from "node:util";
import { discoverAgentPlan, officialSkillPath, vlmChat, arkStandardKey, arkPaidKey, consentAskText } from "./gen/providers.mjs";

const { values } = parseArgs({ options: { discover: { type: "boolean" }, "ask-text": { type: "boolean" }, check: { type: "boolean" }, kind: { type: "string", default: "image" }, what: { type: "string", default: "原型所需的艺术资产/动效素材" }, help: { type: "boolean" } } });
if (values.help) { console.log("用法: node media-consent.mjs --discover | --ask-text --kind <k> [--what ...] | --check"); process.exit(0); }

if (values.check) {
  if (process.env.DC_MEDIA_CONSENT) { console.log(JSON.stringify({ ok: true, consent: process.env.DC_MEDIA_CONSENT })); process.exit(0); }
  console.error("本 session 尚无生成授权。请先运行 --ask-text 向用户申请，批准后再履约。");
  process.exit(4);
}

if (values.discover) {
  const srcs = discoverAgentPlan();
  const means = [];
  const sk = officialSkillPath("image"), sv = officialSkillPath("video");
  if (sk) means.push({ id: "official-seedream", kind: "image/layers", path: sk, quota: "AgentPlan 订阅内（火山方舟 plan base）" });
  if (sv) means.push({ id: "official-seedance", kind: "video", path: sv, quota: "AgentPlan 订阅内（seedance-1.5-pro；2.5 需余额/资源包）" });
  for (const root of [path.join(os.homedir(), ".config", "opencode", "skills"), path.join(os.homedir(), ".claude", "skills"), path.join(os.homedir(), ".codex", "skills")]) {
    for (const n of ["imagegen", "gc-minimal-zine-poster-v0-1"]) {
      if (fs.existsSync(path.join(root, n, "SKILL.md"))) means.push({ id: `host-skill:${n}`, kind: "image", path: path.join(root, n), quota: "宿主 agent 自配" });
    }
  }
  const vlm = await vlmChat("只回 ok 两个字母", null, { maxTokens: 8 }).catch(() => null);
  means.push({ id: "vlm-channel", kind: "semantic", engine: vlm ? vlm.engine : null, quota: "AgentPlan LLM（skill 自控策略，免单独申请）", available: !!vlm });
  const paid = arkPaidKey();
  if (paid) means.push({ id: "ark-standard", kind: "image+video", key: paid.key.slice(0, 8) + "…" + paid.key.slice(-4), source: paid.source, quota: "标准 Ark key 后付费（/api/v3 images+video；image seedream 4.5/5.0-lite 尺寸钳制；video 2.0 mini 480p≈0.2 元/s）", available: true });
  means.push({ id: "pollinations-anon", kind: "image", quota: "匿名免费档（免申请，PROVENANCE 披露）", available: true });
  console.log(JSON.stringify({ agentplan_sources: srcs.map((s) => ({ agent: s.agent, provider: s.provider, volc: s.volc })), means }, null, 1));
  process.exit(0);
}

if (values["ask-text"]) {
  console.log(consentAskText(values.kind, values.what, arkPaidKey()));
  process.exit(0);
}
