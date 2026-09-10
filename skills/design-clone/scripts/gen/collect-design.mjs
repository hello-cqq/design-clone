#!/usr/bin/env node
/**
 * collect-design.mjs —— 每页"完整产品设计 JSON" + Figma 初始源 采集器（M51）
 *
 * 心智模型（用户定稿）：初始产物在**生成期**就存在；"导出"= 用户编辑后对 live 状态**重采集**。
 * 本脚本对 live base 渲染每页并读**真实 computed 值**（edit-overrides 在运行时已作用于 DOM，
 * 故重采集天然包含用户编辑），产出：
 *   prototype/pages/<id>.spec.json   —— 符合 schema/page.spec.schema.json 的每页产品设计 JSON
 *   prototype/design/figma-source.json —— Figma 初始源（variables + pages/frames/nodes），
 *                                          可经插件/官方 MCP 导入；.fig 二进制离线不可生成
 *
 * 用法: node collect-design.mjs --run <runDir> --base <url> [--only <pageId>]
 * 导出: import { collectDesign } from "./collect-design.mjs"（serve/export.mjs 复用）
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const SURFACE = { c_mobile: "c_mobile", c_tablet: "c_tablet", c_desktop: "c_desktop", c_browser: "b_desktop" };

function pageType(id, surface) {
  const mobile = surface === "c_mobile" || surface === "c_tablet";
  if (/home|index|splash/.test(id)) return mobile ? "c_home" : "web_landing";
  if (/chat|msg|im\b/.test(id)) return "c_chat";
  if (/detail|info|profile|me$|-me/.test(id)) return mobile ? "c_detail" : "b_detail_page";
  if (/form|setting|login|edit/.test(id)) return mobile ? "c_form" : "b_form_page";
  if (/list|feed|rank|search/.test(id)) return mobile ? "c_list" : "b_list_page";
  if (/dash|board|work|bench/.test(id)) return "b_dashboard";
  return mobile ? "c_list" : "web_other";
}

const ACT_KIND = {
  toggle: "switch", checkbox: "checkbox", radio: "radio", slider: "slider", step: "stepper",
  tab: "tab", sheet: "sheet", dialog: "dialog", input: "input", select: "select",
};

function regionType(dc, cls) {
  const s = (dc + " " + cls).toLowerCase();
  if (/tabbar|tab-bar|tabs/.test(s)) return "tab_bar";
  if (/nav|top|header/.test(s)) return "nav_bar";
  if (/search/.test(s)) return "search_bar";
  if (/hero|banner/.test(s)) return "banner";
  if (/sheet|modal|dialog|pop|menu/.test(s)) return "modal";
  if (/list|rows|feed/.test(s)) return "list";
  if (/grid|cards/.test(s)) return "grid";
  if (/bar|toolbar|footer|bbar/.test(s)) return "toolbar";
  if (/side|aside/.test(s)) return "sidebar";
  if (/form|field/.test(s)) return "form_section";
  if (/empty/.test(s)) return "empty_state";
  return "custom";
}

const COLLECTOR = () => {
  const ACT_KIND = { toggle: "switch", checkbox: "checkbox", radio: "radio", slider: "slider", step: "stepper", tab: "tab", sheet: "sheet", dialog: "dialog", input: "input", select: "select" };
  const regionTypeOf = (dc, cls) => {
    const s = (dc + " " + cls).toLowerCase();
    if (/tabbar|tab-bar|tabs/.test(s)) return "tab_bar";
    if (/nav|top|header/.test(s)) return "nav_bar";
    if (/search/.test(s)) return "search_bar";
    if (/hero|banner/.test(s)) return "banner";
    if (/sheet|modal|dialog|pop|menu/.test(s)) return "modal";
    if (/list|rows|feed/.test(s)) return "list";
    if (/grid|cards/.test(s)) return "grid";
    if (/bar|toolbar|footer|bbar/.test(s)) return "toolbar";
    if (/side|aside/.test(s)) return "sidebar";
    if (/form|field/.test(s)) return "form_section";
    if (/empty/.test(s)) return "empty_state";
    return "custom";
  };
  const stage = document.querySelector("#dc-stage");
  if (!stage) return null;
  const sr = stage.getBoundingClientRect();
  const px = (v) => Math.round(v);
  const nodes = [];
  const regions = [];
  const dcEls = [...stage.querySelectorAll("[data-dc]")];
  for (const el of dcEls) {
    const dc = el.getAttribute("data-dc");
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const text = (el.textContent || "").trim().slice(0, 60);
    const leaf = el.children.length === 0 && text;
    const interactive = el.hasAttribute("data-act") || el.hasAttribute("data-goto");
    const kind = el.tagName === "IMG" ? "image" : interactive ? "button" : leaf ? "text" : "frame";
    nodes.push({
      dc, kind,
      rect: { x: px(r.left - sr.left), y: px(r.top - sr.top), w: px(r.width), h: px(r.height) },
      fill: cs.backgroundColor, color: cs.color, cornerRadius: px(parseFloat(cs.borderRadius) || 0),
      font: { family: cs.fontFamily.split(",")[0], size: px(parseFloat(cs.fontSize) || 0), weight: parseInt(cs.fontWeight, 10) || 400, lineHeight: px(parseFloat(cs.lineHeight) || 0) },
      text: leaf ? text : "",
    });
    if (dc.endsWith("/root")) continue;
    const rid = ("r_" + dc.replace(/^[0-9]+-?/, "").replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "")).toLowerCase().slice(0, 40) || "r_region";
    const comps = [];
    for (const c of el.querySelectorAll("[data-act],[data-goto],button,input,select,textarea,img")) {
      if (comps.length >= 40) break;
      const act = c.getAttribute("data-act") || (c.getAttribute("data-goto") ? "goto" : "");
      const goto = c.getAttribute("data-goto");
      let kindc = c.tagName === "IMG" ? "image" : ACT_KIND[act] || (act === "goto" || goto ? "button" : act ? "button" : "text");
      if (!act && !goto && c.tagName !== "IMG") kindc = (c.textContent || "").trim() ? "text" : "button";
      const inter = {};
      if (act) inter.act = act;
      if (goto) { inter.act = "goto"; inter.to = goto; }
      const msg = c.getAttribute("data-msg"); if (msg) inter.msg = msg;
      const tgt = c.getAttribute("data-target"); if (tgt) inter.target = tgt;
      const grp = c.getAttribute("data-group"); if (grp) inter.group = grp;
      const comp = { kind: kindc, label: (c.getAttribute("aria-label") || (c.textContent || "").trim()).slice(0, 40) };
      if (Object.keys(inter).length) comp.interaction = inter;
      const sv = (c.textContent || "").trim(); if (sv) comp.sample_value = sv.slice(0, 40);
      comps.push(comp);
    }
    const region = { id: rid, type: regionTypeOf(dc, el.className.toString()), label: text.slice(0, 40) };
    if (comps.length) region.components = comps;
    regions.push(region);
  }
  return { canvas: { width: px(sr.width), height: px(sr.height) }, nodes, regions };
};

function regionTypeOf(dc, cls) { return regionType(dc, cls); }

export async function collectDesign(runDir, base, only) {
  const proto = path.join(runDir, "prototype");
  const html = fs.readFileSync(path.join(proto, "index.html"), "utf8");
  const m = html.match(/window\.DC = (\{[\s\S]*?\});?<\/script>/) || html.match(/window\.DC = (\{[\s\S]*?\})<\/script>/);
  if (!m) throw new Error("index.html 缺 window.DC");
  const DC = JSON.parse(m[1]);
  const shell = DC.shell || "c_mobile";
  const surface = SURFACE[shell] || "c_mobile";
  let products = {};
  try { products = JSON.parse(fs.readFileSync(path.join(proto, "products.json"), "utf8")); } catch {}
  const variables = {};
  try {
    const css = fs.readFileSync(path.join(runDir, "knowledge", "tokens.css"), "utf8");
    for (const mm of css.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/gi)) variables[mm[1]] = mm[2].trim();
  } catch {}
  const { chromium } = require("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const pagesOut = [];
  const pagesDir = path.join(proto, "pages");
  fs.mkdirSync(pagesDir, { recursive: true });
  fs.mkdirSync(path.join(proto, "design"), { recursive: true });
  const now = new Date().toISOString();
  for (const p of DC.pages || []) {
    if (only && p.id !== only) continue;
    await page.goto(`${base}/prototype/?chrome=0#${p.id}`, { waitUntil: "networkidle" }).catch(() => {});
    await page.waitForTimeout(700);
    const data = await page.evaluate(COLLECTOR);
    if (!data) continue;
    const ev = [];
    for (const ext of ["png", "jpg", "jpeg"]) {
      const rel = `capture/screens/${p.id}.${ext}`;
      if (fs.existsSync(path.join(runDir, rel))) ev.push(rel);
    }
    const prod = products[p.id] || {};
    const spec = {
      meta: {
        page_id: p.id, page_name: p.name || p.id, surface, page_type: pageType(p.id, surface),
        canvas: data.canvas, evidence: ev, fidelity: "high",
        product: {
          function: prod.function || "（克隆时按 vlm-analysis 补 product 三要素）",
          goals: prod.goals || [], page_prompt: prod.page_prompt || "",
          element_prompts: prod.element_prompts || {},
        },
        spec_version: 1,
        change_log: [{ at: now, by: "clone", note: "collect-design 初始/重采集（computed 真值）" }],
      },
      regions: data.regions.length ? data.regions : [{ id: "r_root", type: "custom", label: p.name || p.id }],
    };
    fs.writeFileSync(path.join(pagesDir, `${p.id}.spec.json`), JSON.stringify(spec, null, 2));
    pagesOut.push({ id: p.id, name: p.name || p.id, frame: data.canvas, nodes: data.nodes });
  }
  await browser.close();
  const figma = {
    meta: { generator: "design-clone collect-design", generated_at: now, source_run: path.basename(runDir), schema: "figma-source/v1" },
    variables, pages: pagesOut,
  };
  fs.writeFileSync(path.join(proto, "design", "figma-source.json"), JSON.stringify(figma, null, 2));
  return { pages: pagesOut.length, regions: pagesOut.reduce((a, p) => a + p.nodes.length, 0) };
}

if (process.argv[1] && process.argv[1].endsWith("collect-design.mjs")) {
  const { values } = parseArgs({ options: { run: { type: "string" }, base: { type: "string" }, only: { type: "string" } } });
  if (!values.run || !values.base) { console.log("用法: node collect-design.mjs --run <runDir> --base <url> [--only <pageId>]"); process.exit(1); }
  const out = await collectDesign(path.resolve(values.run), values.base, values.only);
  console.log(JSON.stringify(out));
}
