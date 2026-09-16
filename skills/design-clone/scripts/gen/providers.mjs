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
const makeArk = (src, tag) => ({
  name: `ark-${tag}`,
  _bases: arkBases(src),
  _key: src.apiKey,
  async image(args) {
    for (const base of this._bases) {
      try {
        const r = await fetch(`${base.replace(/\/$/, "")}/images/generations`, {
          method: "POST", headers: auth(this._key),
          body: JSON.stringify({ model: ENV.ARK_IMAGE_MODEL || "doubao-seedream-4-5-251128", prompt: args.prompt, size: `${args.w}x${args.h}`, response_format: "b64_json", ...(args.seed != null ? { seed: args.seed } : {}) }),
          signal: AbortSignal.timeout(180000),
        });
        if (!r.ok) { if (r.status === 404 || r.status === 401 || r.status === 403) continue; throw new Error(`ark ${r.status}`); }
        const d = await j(r);
        const it = (d.data || [])[0];
        if (!it) throw new Error("ark 空响应");
        this._imgBase = base;
        return it.b64_json ? b64buf(it.b64_json) : urlbuf(it.url);
      } catch (e) { if (/ark \d|空响应/.test(String(e.message))) continue; }
    }
    throw new Error("ark bases 全败");
  },
  vname: `ark-${tag}-seedance`,
  async video(args) {
    for (const base of this._bases) {
      try {
        const r = await fetch(`${base.replace(/\/$/, "")}/contents/generations/tasks`, {
          method: "POST", headers: auth(this._key),
          body: JSON.stringify({ model: ENV.ARK_VIDEO_MODEL || "doubao-seedance-1-5-pro-251215", content: [{ type: "text", text: args.prompt }] }),
          signal: AbortSignal.timeout(60000),
        });
        if (!r.ok) { if ([401, 403, 404].includes(r.status)) continue; throw new Error(`ark video ${r.status}`); }
        const id = (await j(r)).id;
        this._vidBase = base;
        return poll(async () => {
          const q = await fetch(`${base.replace(/\/$/, "")}/contents/generations/tasks/${id}`, { headers: auth(this._key), signal: AbortSignal.timeout(30000) });
          const d = await j(q);
          if (d.status === "failed") throw new Error("ark video failed");
          if (d.status === "succeeded") return urlbuf(d.content.video_url);
          return null;
        });
      } catch (e) { if (/ark video \d/.test(String(e.message))) continue; throw e; }
    }
    throw new Error("ark video bases 全败");
  },
});

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

/* ---------- 探测与路由 ---------- */
export function imageProviders() {
  const list = [];
  if (ENV.ARK_API_KEY) list.push(ark);
  for (const src of volcSources()) list.push(makeArk(src, "agentplan"));
  if (ENV.DASHSCOPE_API_KEY) list.push(dash);
  if (ENV.MINIMAX_API_KEY) list.push(minimax);
  const want = ENV.DC_IMAGE_PROVIDER;
  if (want) { const p = list.find((x) => x.name.includes(want)); return p ? [p] : list; }
  return list;
}
export function videoProviders() {
  const list = [];
  if (ENV.ARK_API_KEY) list.push(ark);
  for (const src of volcSources()) list.push(makeArk(src, "agentplan"));
  if (ENV.KLING_ACCESS_KEY && ENV.KLING_SECRET_KEY) list.push(kling);
  if (ENV.DASHSCOPE_API_KEY) list.push(dash);
  if (ENV.MINIMAX_API_KEY) list.push(minimax);
  const want = ENV.DC_VIDEO_PROVIDER;
  if (want) { const p = list.find((x) => (x.vname || "").includes(want)); return p ? [p] : list; }
  return list;
}
export async function genImage(args) {
  for (const p of imageProviders()) {
    try { return { engine: p.name, buf: await p.image(args) }; }
    catch (e) { console.warn(`provider ${p.name} 失败回落：${String(e.message).slice(0, 90)}`); }
  }
  return null;
}
export async function genVideo(args) {
  for (const p of videoProviders()) {
    try { return { engine: p.vname, buf: await p.video(args) }; }
    catch (e) { console.warn(`provider ${p.vname} 失败回落：${String(e.message).slice(0, 90)}`); }
  }
  return null;
}
export const providerSummary = () => ({
  image: imageProviders().map((p) => p.name),
  video: videoProviders().map((p) => p.vname),
});
