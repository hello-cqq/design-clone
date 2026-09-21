#!/usr/bin/env node
/**
 * providers.mjs（M99-2）——生图/生视频 provider 抽象层。
 * 探测序：DC_IMAGE_PROVIDER / DC_VIDEO_PROVIDER 显式指定 > env key 自动探测 > null（调用方回落 pollinations / agent-native 协议）。
 * 支持：火山方舟 Ark（Seedream 图 / Seedance 视频）、dashscope（万相图/视频）、MiniMax（图/视频）、可灵 Kling（视频，JWT）。
 * 纪律：不假设 key 存在；无 key 静默返回 null；所有调用带超时与轮询上限；不打印 key/响应体全文。
 */
import { createHmac } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const ENV = process.env;
const j = (r) => r.json();
const auth = (k) => ({ "Authorization": `Bearer ${k}`, "Content-Type": "application/json" });

async function poll(fn, { interval = 4000, timeout = 300000 } = {}) {
  const t0 = Date.now();
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() - t0 > timeout) throw new Error("provider 任务轮询超时");
    await new Promise((r) => setTimeout(r, interval));
  }
}

const b64buf = (s) => Buffer.from(s, "base64");
// M101: Seedream 5.0 size 契约——总像素 [921600, 4624220]、宽高比 [1/16,16]；不达标等比缩放
export function clampArkSize(w, h) {
  let W = Math.max(16, w | 0), H = Math.max(16, h | 0);
  const ratio = W / H;
  if (ratio > 16) W = H * 16; else if (ratio < 1 / 16) H = W * 16;
  let px = W * H;
  if (px < 921600) { const k = Math.sqrt(921600 / px); W = Math.round(W * k); H = Math.round(H * k); }
  else if (px > 4624220) { const k = Math.sqrt(4624220 / px); W = Math.round(W * k); H = Math.round(H * k); }
  return `${W}x${H}`;
}
async function urlbuf(u) { return Buffer.from(await (await fetch(u, { signal: AbortSignal.timeout(120000) })).arrayBuffer()); }

/* ---------- 火山方舟 Ark ---------- */
const ark = {
  name: "ark-seedream",
  async image({ prompt, w, h, seed }) {
    const r = await fetch("https://ark.cn-beijing.volces.com/api/v3/images/generations", {
      method: "POST", headers: auth(ENV.ARK_API_KEY),
      body: JSON.stringify({ model: ENV.ARK_IMAGE_MODEL || "doubao-seedream-4-5-251128", prompt, size: `${w}x${h}`, response_format: "b64_json", ...(seed != null ? { seed } : {}) }),
      signal: AbortSignal.timeout(180000),
    });
    if (!r.ok) throw new Error(`ark image ${r.status}`);
    const d = await j(r);
    const it = (d.data || [])[0];
    if (!it) throw new Error("ark image 空响应");
    return it.b64_json ? b64buf(it.b64_json) : urlbuf(it.url);
  },
  vname: "ark-seedance",
  async video({ prompt, duration = 5, aspect = "16:9" }) {
    const r = await fetch("https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks", {
      method: "POST", headers: auth(ENV.ARK_API_KEY),
      body: JSON.stringify({ model: ENV.ARK_VIDEO_MODEL || "doubao-seedance-1-5-pro-251215", content: [{ type: "text", text: prompt }], ...(aspect ? { ratio: aspect } : {}), ...(duration ? { duration: String(duration) } : {}) }),
      signal: AbortSignal.timeout(60000),
    });
    if (!r.ok) throw new Error(`ark video submit ${r.status}`);
    const id = (await j(r)).id;
    return poll(async () => {
      const q = await fetch(`https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/${id}`, { headers: auth(ENV.ARK_API_KEY), signal: AbortSignal.timeout(30000) });
      const d = await j(q);
      if (d.status === "failed") throw new Error("ark video failed");
      if (d.status === "succeeded") return urlbuf(d.content.video_url);
      return null;
    });
  },
};

/* ---------- dashscope 通义万相 ---------- */
const dash = {
  name: "dashscope-wanx",
  async image({ prompt, w, h }) {
    const r = await fetch("https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis", {
      method: "POST", headers: { ...auth(ENV.DASHSCOPE_API_KEY), "X-DashScope-Async": "enable" },
      body: JSON.stringify({ model: ENV.DASHSCOPE_IMAGE_MODEL || "wanx2.1-t2i-turbo", input: { prompt }, parameters: { size: `${w}*${h}` } }),
      signal: AbortSignal.timeout(60000),
    });
    if (!r.ok) throw new Error(`dashscope image submit ${r.status}`);
    const id = (await j(r)).output?.task_id;
    return poll(async () => {
      const q = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${id}`, { headers: auth(ENV.DASHSCOPE_API_KEY), signal: AbortSignal.timeout(30000) });
      const d = (await j(q)).output || {};
      if (d.task_status === "FAILED") throw new Error("dashscope image failed");
      const u = (d.results || [])[0]?.url;
      return d.task_status === "SUCCEEDED" && u ? urlbuf(u) : null;
    });
  },
  vname: "dashscope-wanx-video",
  async video({ prompt, duration = 5 }) {
    const r = await fetch("https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis", {
      method: "POST", headers: { ...auth(ENV.DASHSCOPE_API_KEY), "X-DashScope-Async": "enable" },
      body: JSON.stringify({ model: ENV.DASHSCOPE_VIDEO_MODEL || "wanx2.1-t2v-turbo", input: { prompt }, parameters: { duration } }),
      signal: AbortSignal.timeout(60000),
    });
    if (!r.ok) throw new Error(`dashscope video submit ${r.status}`);
    const id = (await j(r)).output?.task_id;
    return poll(async () => {
      const q = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${id}`, { headers: auth(ENV.DASHSCOPE_API_KEY), signal: AbortSignal.timeout(30000) });
      const d = (await j(q)).output || {};
      if (d.task_status === "FAILED") throw new Error("dashscope video failed");
      return d.task_status === "SUCCEEDED" && d.video_url ? urlbuf(d.video_url) : null;
    }, { timeout: 600000 });
  },
};

/* ---------- MiniMax ---------- */
const minimax = {
  name: "minimax-image",
  async image({ prompt }) {
    const r = await fetch("https://api.minimax.chat/v1/image_generation", {
      method: "POST", headers: auth(ENV.MINIMAX_API_KEY),
      body: JSON.stringify({ model: "image-01", prompt, response_format: "base64" }),
      signal: AbortSignal.timeout(180000),
    });
    if (!r.ok) throw new Error(`minimax image ${r.status}`);
    const d = await j(r);
    const b = d.data?.image_base64;
    if (!b) throw new Error("minimax image 空响应");
    return b64buf(b);
  },
  vname: "minimax-video",
  async video({ prompt }) {
    const r = await fetch("https://api.minimax.chat/v1/video_generation", {
      method: "POST", headers: auth(ENV.MINIMAX_API_KEY),
      body: JSON.stringify({ model: "video-01", content: { prompt, text: prompt } }),
      signal: AbortSignal.timeout(60000),
    });
    if (!r.ok) throw new Error(`minimax video submit ${r.status}`);
    const tid = (await j(r)).task_id;
    return poll(async () => {
      const q = await fetch(`https://api.minimax.chat/v1/query/video_generation?task_id=${tid}`, { headers: auth(ENV.MINIMAX_API_KEY), signal: AbortSignal.timeout(30000) });
      const d = await j(q);
      if (d.status === "Fail") throw new Error("minimax video failed");
      if (d.status === "Success" && d.file_id) {
        const f = await fetch(`https://api.minimax.chat/v1/files/retrieve?file_id=${d.file_id}`, { headers: auth(ENV.MINIMAX_API_KEY), signal: AbortSignal.timeout(30000) });
        const fd = await j(f);
        return fd.file?.download_url ? urlbuf(fd.file.download_url) : null;
      }
      return null;
    }, { timeout: 600000 });
  },
};

/* ---------- 可灵 Kling（视频，HS256 JWT） ---------- */
const klingJwt = () => {
  const ak = ENV.KLING_ACCESS_KEY, sk = ENV.KLING_SECRET_KEY;
  if (!ak || !sk) return null;
  const b64u = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const head = b64u({ alg: "HS256", typ: "JWT" });
  const body = b64u({ iss: ak, exp: now + 1800, nbf: now - 5, iat: now, nonce: 1 });
  const sigBuf = createHmac("sha256", sk).update(`${head}.${body}`).digest("base64url");
  return `${head}.${body}.${sigBuf}`;
};
const kling = {
  name: null,
  vname: "kling-video",
  async video({ prompt, duration = 5, aspect = "16:9" }) {
    const tok = klingJwt();
    if (!tok) throw new Error("kling key 缺");
    const H = { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" };
    const r = await fetch("https://api.klingai.com/v1/videos/text2video", {
      method: "POST", headers: H,
      body: JSON.stringify({ model_name: "kling-v2-master", prompt, duration: String(duration), aspect_ratio: aspect, mode: "std" }),
      signal: AbortSignal.timeout(60000),
    });
    if (!r.ok) throw new Error(`kling submit ${r.status}`);
    const id = (await j(r)).data?.task_id;
    return poll(async () => {
      const q = await fetch(`https://api.klingai.com/v1/videos/text2video/${id}`, { headers: H, signal: AbortSignal.timeout(30000) });
      const d = (await j(q)).data || {};
      if (d.task_status === "failed") throw new Error("kling failed");
      const u = (d.task_result?.videos || [])[0]?.url;
      return d.task_status === "succeed" && u ? urlbuf(u) : null;
    }, { timeout: 600000 });
  },
};

/* ---------- Agent 配置发现（M100：火山 AgentPlan 等不假设 env，读三端配置） ---------- */
const stripJsonc = (t) => t
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/(^|[^:"'\\])\/\/[^\n]*/g, "$1") // 行注释剥离但保护 URL 的 ://
  .replace(/,\s*([}\]])/g, "$1");
export function discoverAgentPlan() {
  const sources = [];
  for (const f of ["opencode.json", "opencode.jsonc"]) {
    const fp = path.join(os.homedir(), ".config", "opencode", f);
    if (!fs.existsSync(fp)) continue;
    try {
      const d = JSON.parse(stripJsonc(fs.readFileSync(fp, "utf8")));
      for (const [name, prov] of Object.entries(d.provider || {})) {
        const o = (prov && prov.options) || {};
        if (!o.baseURL || !o.apiKey) continue;
        sources.push({ agent: "opencode", provider: name, baseURL: o.baseURL, apiKey: o.apiKey, volc: /volces\.com/.test(o.baseURL), models: Object.keys(prov.models || {}) });
      }
    } catch {}
  }
  const cs = path.join(os.homedir(), ".claude", "settings.json");
  if (fs.existsSync(cs)) {
    try {
      const e = JSON.parse(fs.readFileSync(cs, "utf8")).env || {};
      const k = e.ANTHROPIC_AUTH_TOKEN || e.ANTHROPIC_API_KEY;
      if (e.ANTHROPIC_BASE_URL && k) sources.push({ agent: "claude", provider: "anthropic-env", baseURL: e.ANTHROPIC_BASE_URL, apiKey: k, volc: /volces\.com/.test(e.ANTHROPIC_BASE_URL), models: [e.ANTHROPIC_MODEL].filter(Boolean), anthropic: true });
    } catch {}
  }
  const ct = path.join(os.homedir(), ".codex", "config.toml");
  if (fs.existsSync(ct)) {
    try {
      const t = fs.readFileSync(ct, "utf8");
      for (const m of t.matchAll(/\[model_providers\.([^\]]+)\]([\s\S]*?)(?=\n\[|$)/g)) {
        const block = m[2];
        const bu = (block.match(/base_url\s*=\s*"([^"]+)"/) || [])[1];
        const ek = (block.match(/env_key\s*=\s*"([^"]+)"/) || [])[1];
        const kv = ek ? process.env[ek] || "" : "";
        const inline = (block.match(/api_key\s*=\s*"([^"]+)"/) || [])[1];
        const key = kv || inline;
        if (bu && key) sources.push({ agent: "codex", provider: m[1], baseURL: bu, apiKey: key, volc: /volces\.com/.test(bu), models: [] });
      }
    } catch {}
  }
  return sources;
}
const volcSources = () => discoverAgentPlan().filter((x) => x.volc);
const arkBases = (src) => {
  const u = new URL(src.baseURL);
  const cand = [ENV.ARK_BASE_URL, `${u.origin}/api/v3`, `${u.origin}/api/plan/v3`, src.baseURL].filter(Boolean);
  return [...new Set(cand)];
};
// M101 教义：skill 不直调生图/生视频端点——直连能力仅以「请求规格」形式交给宿主 agent/官方 skill 履约。
export function arkRequestSpec(kind, args = {}) {
  const src = volcSources()[0];
  const base = src ? src.baseURL : null;
  if (kind === "image" || kind === "layers") {
    return {
      kind, engine_hint: "official-skill:byted-ark-seedream-skill | agent-native",
      endpoint: base ? `${base.replace(/\/$/, "")}/images/generations` : null,
      models: [ENV.ARK_IMAGE_MODEL || "doubao-seedream-5.0-pro", "doubao-seedream-5.0-lite"],
      prompt: args.prompt || null,
      size: clampArkSize(args.w || 1024, args.h || 1024),
      output_format: "png", watermark: false,
      ...(kind === "layers" ? { layer_decomposition: true, size: "auto" } : {}),
      ...(args.reference ? { reference_images: [args.reference] } : {}),
      ...(args.transparent ? { background: "transparent" } : {}),
      constraints: ["总像素[921600,4624220]", "宽高比[1/16,16]", "URL 24h 有效→落地即下载", "拆图层预扣 17 IPM"],
    };
  }
  return {
    kind: "video", engine_hint: "official-skill:byted-ark-seedance-skill | agent-native",
    endpoint: base ? `${base.replace(/\/$/, "")}/contents/generations/tasks` : null,
    models: [ENV.ARK_VIDEO_MODEL || "doubao-seedance-1.5-pro", "doubao-seedance-2.0", "doubao-seedance-2.5"],
    prompt: args.prompt || null, ratio: args.ratio || "adaptive", duration: args.duration || 5, resolution: args.resolution || "480p",
    ...(args.firstFrame ? { content_roles: [{ type: "image_url", image_url: { url: args.firstFrame }, role: "first_frame" }], ratio: "adaptive" } : {}),
    constraints: ["视频 URL 24h/100 次下载→即下载", "首帧任务 ratio 必须 adaptive", "2.5 需余额/资源包（AgentPlan 可能未含）", "不收真人人脸参考"],
  };
}

/* ---------- VLM 语义通道（M100：AgentPlan doubao-seed / claude-env anthropic） ---------- */
export async function vlmChat(text, imageB64, opts = {}) {
  const srcs = discoverAgentPlan();
  const volc = srcs.find((x) => x.volc && !x.anthropic);
  if (volc && !opts.force) {
    const model = opts.model || (volc.models || []).find((m) => /seed-2\.1|seed-evolving/.test(m)) || "doubao-seed-2.1-turbo";
    const content = imageB64 ? [{ type: "text", text }, { type: "image_url", image_url: { url: `data:image/png;base64,${imageB64}` } }] : text;
    for (const base of [volc.baseURL, new URL(volc.baseURL).origin + "/api/plan/v3"]) {
      try {
        const r = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
          method: "POST", headers: auth(volc.apiKey),
          body: JSON.stringify({ model, messages: [{ role: "user", content }], max_tokens: opts.maxTokens || 600 }),
          signal: AbortSignal.timeout(90000),
        });
        if (!r.ok) continue;
        const d = await j(r);
        const t = (d.choices || [])[0]?.message?.content;
        if (t) return { engine: `agent-plan:${volc.provider}/${model}`, text: t };
      } catch {}
    }
  }
  const anth = srcs.find((x) => x.anthropic);
  if (anth) {
    try {
      const content = imageB64 ? [{ type: "text", text }, { type: "image", source: { type: "base64", media_type: "image/png", data: imageB64 } }] : [{ type: "text", text }];
      const r = await fetch(`${anth.baseURL.replace(/\/$/, "")}/messages`, {
        method: "POST",
        headers: { "x-api-key": anth.apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
        body: JSON.stringify({ model: opts.model || (anth.models || [])[0] || "claude-sonnet-4-5", max_tokens: opts.maxTokens || 600, messages: [{ role: "user", content }] }),
        signal: AbortSignal.timeout(90000),
      });
      if (r.ok) {
        const d = await j(r);
        const t = (d.content || []).map((c) => c.text || "").join("");
        if (t) return { engine: `claude-env:${anth.models?.[0] || "sonnet"}`, text: t };
      }
    } catch {}
  }
  return null;
}

/* ---------- 官方 AgentPlan skill 桥（M101：means③，尊重官方纪律不跨模型重试/不转后付费） ---------- */
export function officialSkillPath(kind) {
  const name = kind === "video" ? "byted-ark-seedance-skill" : "byted-ark-seedream-skill";
  const roots = [
    path.join(os.homedir(), ".config", "opencode", "skills"), path.join(os.homedir(), ".claude", "skills"),
    path.join(os.homedir(), ".codex", "skills"), path.join(os.homedir(), ".agents", "skills"), "/tmp/skills",
  ];
  for (const r of roots) { const p = path.join(r, name); if (fs.existsSync(path.join(p, "SKILL.md"))) return p; }
  return null;
}
export const arkKeyForOfficial = () => { const v = volcSources()[0]; return v ? v.apiKey : (ENV.ARK_API_KEY || null); };

/* ---------- 标准 Ark key 直连档（M102：后付费 /api/v3，仅视频；consent 门控） ---------- */
export function arkPaidKey() {
  if (ENV.ARK_API_KEY && /^ark-/.test(ENV.ARK_API_KEY)) return { key: ENV.ARK_API_KEY, source: "env:ARK_API_KEY" };
  try {
    const f = path.join(os.homedir(), ".config", "design-clone", "ark.key");
    if (fs.existsSync(f)) { const k = fs.readFileSync(f, "utf8").trim(); if (/^ark-/.test(k)) return { key: k, source: "~/.config/design-clone/ark.key" }; }
  } catch {}
  return null;
}
// M115: 标准 key 解禁 image+video（成本门=consent+策略层钳制）；旧名保留兼容
export function arkStandardKey() { const p = arkPaidKey(); return p ? p.key : null; }
// M115: seedream-4-5 图像接口要求 >=3686400 px（<=4624220）；5.0-lite 标准 key 无权限不入序
export function clampArkImageSize(w, h) {
  let W = Math.max(16, w | 0), H = Math.max(16, h | 0);
  const ratio = W / H;
  if (ratio > 4) W = H * 4; else if (ratio < 0.25) H = W * 4;
  let px = W * H;
  if (px < 3686400) { const k = Math.sqrt(3686400 / px); W = Math.round(W * k); H = Math.round(H * k); }
  else if (px > 4624220) { const k = Math.sqrt(4624220 / px); W = Math.round(W * k); H = Math.round(H * k); }
  return `${W}x${H}`;
}
const IMG_MODEL_SEQ = () => (ENV.ARK_IMAGE_MODEL ? [ENV.ARK_IMAGE_MODEL] : ["doubao-seedream-4-5-251128"]);
export async function arkStandardImage(args = {}) {
  const paid = arkPaidKey();
  if (!paid) throw new Error("无标准 Ark key（ARK_API_KEY 或 ~/.config/design-clone/ark.key）");
  const size = clampArkImageSize(args.w || 1024, args.h || 1024);
  let lastErr = null;
  for (const model of IMG_MODEL_SEQ()) {
    try {
      const res = await fetch(`${STD_BASE}/images/generations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${paid.key}` },
        body: JSON.stringify({ model, prompt: args.prompt, size, response_format: "b64_json", watermark: false }),
        signal: AbortSignal.timeout(180000),
      });
      const j = await res.json();
      if (!res.ok || !j.data || !j.data[0]) { lastErr = new Error((j.error && j.error.message) || `HTTP ${res.status}`); continue; }
      return { buf: Buffer.from(j.data[0].b64_json, "base64"), engine: `ark-standard:${model}`, model };
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("ark image failed");
}
// M115: 标准申请话术（genimg/genvideo/media-consent 共用）——首句声明钥匙已检测到、只需花钱同意、每 session 一次
export function consentAskText(kind, what, keyMeta) {
  const km = keyMeta || arkPaidKey();
  const cost = kind === "video" ? `预估 ≈${((+(process.env.DC_EST_DURATION || 4)) * 0.2).toFixed(1)} 元/条（2.0 mini 480p 无声）` : "按张后付费（seedream 4.5/5.0-lite，尺寸钳制内）";
  return [
    "【design-clone 生成授权申请（本 session 仅此次）】",
    km ? `已检测到你配置的 Ark key（来源 ${km.source}，后付费）。无需提供 key。` : "未检测到已配置 key；批准后由你 agent 已配置的生图/生视频通道履约。",
    `拟${kind === "video" ? "生成短视频素材" : kind === "layers" ? "对图做图层拆分" : "生成图片资产"}：${what || "原型所需的艺术资产/动效素材"}。${km ? cost : ""}`,
    "不批准的回落：匿名免费档（图片）/静态分层动效（视频），效果上限较低。",
    "批准请回复「同意」或指定 means；批准后导出 DC_MEDIA_CONSENT，本 session 内不再询问。",
  ].join("\n");
}
const STD_BASE = "https://ark.cn-beijing.volces.com/api/v3";
const VIDEO_MODEL_SEQ = () => (ENV.ARK_VIDEO_MODEL ? [ENV.ARK_VIDEO_MODEL] : ["doubao-seedance-2-0-mini-260615", "doubao-seedance-2-0-260128", "doubao-seedance-2-5-260628"]);
export async function arkStandardVideo(args = {}) {
  const key = arkStandardKey();
  if (!key) throw new Error("无标准 Ark key（ARK_API_KEY 或 ~/.config/design-clone/ark.key）");
  const content = [{ type: "text", text: args.prompt }];
  if (args.firstFrame) {
    const buf = fs.existsSync(args.firstFrame) ? fs.readFileSync(args.firstFrame) : null;
    if (!buf) throw new Error("首帧文件不存在: " + args.firstFrame);
    const mime = args.firstFrame.endsWith(".png") ? "image/png" : "image/jpeg";
    content.push({ type: "image_url", image_url: { url: `data:${mime};base64,${buf.toString("base64")}` }, role: "first_frame" });
  }
  let lastErr = null;
  for (const model of VIDEO_MODEL_SEQ()) {
    try {
      let r = await fetch(`${STD_BASE}/contents/generations/tasks`, {
        method: "POST", headers: auth(key),
        body: JSON.stringify({ model, content, ratio: args.firstFrame ? "adaptive" : (args.ratio || "adaptive"), duration: args.duration || 4, resolution: args.resolution || "480p", generate_audio: false, watermark: false }),
        signal: AbortSignal.timeout(60000),
      });
      if (!r.ok) {
        const t = await r.text();
        if (/SetLimitExceeded|Too Many Requests|429/.test(t + r.status)) { // 限流退避：同模型重试 ≤2 次
          for (let k = 0; k < 2; k++) {
            await new Promise((res) => setTimeout(res, 30000));
            r = await fetch(`${STD_BASE}/contents/generations/tasks`, { method: "POST", headers: auth(key), body: JSON.stringify({ model, content, ratio: args.firstFrame ? "adaptive" : (args.ratio || "adaptive"), duration: args.duration || 4, resolution: args.resolution || "480p", generate_audio: false, watermark: false }), signal: AbortSignal.timeout(60000) });
            if (r.ok) break;
          }
        }
        if (!r.ok) { lastErr = new Error(`${model}: ${r.status} ${t.slice(0, 120)}`); continue; }
      }
      const id = (await j(r)).id;
      const task = await poll(async () => {
        const q = await fetch(`${STD_BASE}/contents/generations/tasks/${id}`, { headers: auth(key), signal: AbortSignal.timeout(30000) });
        const d = await j(q);
        if (d.status === "failed") throw new Error(`${model} failed: ${(d.error || {}).code || ""}`);
        if (d.status === "succeeded") return d;
        return null;
      }, { interval: 10000, timeout: 1800000 });
      const url = task.content && task.content.video_url;
      if (!url) throw new Error("无 video_url");
      const buf = await urlbuf(url); // 24h/100 次→即下载
      return { engine: `ark-standard:${model}`, buf, meta: { duration: task.duration, ratio: task.ratio, resolution: task.resolution, tokens: (task.usage || {}).completion_tokens } };
    } catch (e) { lastErr = e; if (/UnsupportedModel/.test(String(e.message))) continue; throw e; }
  }
  throw lastErr || new Error("标准档视频全模型败");
}

/* ---------- 探测与路由 ---------- */
export function imageProviders() { return []; } // M101: 生图一律 agent 履约；此处仅保留接口兼容
export function videoProviders() { return []; }
export const providerSummary = () => ({
  image: imageProviders().map((p) => p.name),
  video: videoProviders().map((p) => p.vname),
});
