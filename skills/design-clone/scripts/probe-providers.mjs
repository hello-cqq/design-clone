#!/usr/bin/env node
/**
 * probe-providers.mjs（M100-W2）——AgentPlan/provider 能力矩阵探测（小配额验证）。
 * 用法: node probe-providers.mjs [--no-video] [--out <report.json>]
 * 探测项：① OpenAI-compat GET /models（plan 与标准两 base）② 生图 512px 探针 ③ 生视频 seedance 端到端（可 --no-video 跳过）④ vlmChat 文本+视觉。
 * 结果留档 report/provider-probe-<ts>.json（key 掩码）。
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { discoverAgentPlan, imageProviders, videoProviders, vlmChat } from "./gen/providers.mjs";

const { values } = parseArgs({ options: { "no-video": { type: "boolean" }, out: { type: "string" }, help: { type: "boolean" } } });
if (values.help) { console.log("用法: node probe-providers.mjs [--no-video] [--out report.json]"); process.exit(0); }
const mask = (k) => (k ? k.slice(0, 8) + "…" + k.slice(-4) : null);
const rep = { at: new Date().toISOString(), sources: [], models: {}, image: null, video: null, vlm: null };

for (const s of discoverAgentPlan()) {
  rep.sources.push({ agent: s.agent, provider: s.provider, volc: s.volc, baseURL: s.baseURL, apiKey: mask(s.apiKey), models: (s.models || []).slice(0, 12) });
  if (!s.volc) continue;
  const u = new URL(s.baseURL);
  for (const base of [`${u.origin}/api/plan/v3`, `${u.origin}/api/v3`, s.baseURL]) {
    try {
      const r = await fetch(`${base.replace(/\/$/, "")}/models`, { headers: { Authorization: `Bearer ${s.apiKey}` }, signal: AbortSignal.timeout(20000) });
      const d = r.ok ? await r.json() : {};
      rep.models[base] = { status: r.status, ids: ((d.data || []).map((x) => x.id) || []).slice(0, 30) };
    } catch (e) { rep.models[base] = { status: "ERR", err: String(e.message).slice(0, 80) }; }
  }
}

const ip = imageProviders();
if (ip.length) {
  try {
    const t0 = Date.now();
    const r = await ip[0].image({ prompt: "a tiny red paper crane on white paper, minimal, soft light", w: 512, h: 512, seed: 7 });
    rep.image = { ok: true, engine: ip[0].name, bytes: r.length, ms: Date.now() - t0 };
  } catch (e) { rep.image = { ok: false, engine: ip[0].name, err: String(e.message).slice(0, 120) }; }
} else rep.image = { ok: false, err: "no image provider discovered" };

if (!values["no-video"]) {
  const vp = videoProviders();
  if (vp.length) {
    try {
      const t0 = Date.now();
      const buf = await vp[0].video({ prompt: "a paper crane slowly unfolding its wings, gentle breeze, studio light, 3 seconds", duration: 3 });
      rep.video = { ok: true, engine: vp[0].vname, bytes: buf.length, ms: Date.now() - t0 };
    } catch (e) { rep.video = { ok: false, engine: vp[0].vname, err: String(e.message).slice(0, 120) }; }
  } else rep.video = { ok: false, err: "no video provider discovered" };
} else rep.video = { skipped: true };

try {
  const v = await vlmChat("用一行 JSON 回答：{\"subject\":<画面主体>,\"quality\":<1-5>}");
  rep.vlm = v ? { ok: true, engine: v.engine, sample: v.text.slice(0, 120) } : { ok: false, err: "no vlm source" };
} catch (e) { rep.vlm = { ok: false, err: String(e.message).slice(0, 120) }; }

const out = values.out || path.join(path.dirname(new URL(import.meta.url).pathname), "..", "..", "report", `provider-probe-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(rep, null, 1));
console.log(JSON.stringify({ sources: rep.sources.map((x) => `${x.agent}:${x.provider}${x.volc ? "(volc)" : ""}`), image: rep.image, video: rep.video, vlm: rep.vlm && rep.vlm.ok ? rep.vlm.engine : rep.vlm, report: out }, null, 1));
