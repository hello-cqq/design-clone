#!/usr/bin/env node
/**
 * Figma 导出计划生成器（Export 模式第一步，MCP 无关的确定性中间层）。
 * 用法:
 *   node export.mjs <run目录>                 # 生成 report/figma-plan.json
 *   node export.mjs <run目录> --apply-nodeids <map.json>
 *        # map: {"<page-id>::<data-dc>": "<nodeId>", "<page-id>::__frame": "<frameNodeId>"}
 *        # 回填进 figma-plan.json（agent 在 MCP 创建后调用，增量修改靠它定向 patch）
 *
 * plan 结构：tokens→Figma variables（0-1 浮点）+ pages[].nodes[]（dc/rect/样式/文本），
 * agent 按 references/figma-export.md 把 nodes 翻译成官方 MCP 或 talk-to-figma 调用。
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const runDir = path.resolve(process.argv[2] || ".");
const applyFile = process.argv.includes("--apply-nodeids")
  ? process.argv[process.argv.indexOf("--apply-nodeids") + 1]
  : null;
const planPath = path.join(runDir, "report", "figma-plan.json");

if (applyFile) {
  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
  const map = JSON.parse(fs.readFileSync(applyFile, "utf8"));
  for (const p of plan.pages) {
    if (map[`${p.id}::__frame`]) p.frame_node_id = map[`${p.id}::__frame`];
    for (const n of p.nodes) {
      const k = `${p.id}::${n.dc}`;
      if (map[k]) n.figma_node_id = map[k];
    }
  }
  plan.exported_at = new Date().toISOString();
  fs.writeFileSync(planPath, JSON.stringify(plan, null, 2));
  console.log(`✅ nodeId 已回填 ${planPath}（${Object.keys(map).length} 条）`);
  process.exit(0);
}

const protoDir = path.join(runDir, "prototype");
const tokensCss = fs.readFileSync(path.join(runDir, "knowledge", "tokens.css"), "utf8");
const viewsDir = path.join(protoDir, "views");
const views = fs.readdirSync(viewsDir).filter((f) => f.endsWith(".html")).sort();

const DC_INDEX = fs.readFileSync(path.join(protoDir, "index.html"), "utf8").match(/window\.DC = (\{[\s\S]*?\});/);
let pagesMeta = views.map((v) => ({ id: v.replace(/\.html$/, ""), name: v.replace(/\.html$/, "") }));

function rgbaToFigma(c) {
  const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/.exec(c || "");
  if (!m) return null;
  return { r: +(+m[1] / 255).toFixed(4), g: +(+m[2] / 255).toFixed(4), b: +(+m[3] / 255).toFixed(4), a: m[4] != null ? +m[4] : 1 };
}

const req = createRequire(import.meta.url);
const { chromium } = req("playwright");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

const variables = {};
for (const m of tokensCss.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
  const v = m[2].trim();
  const fig = rgbaToFigma(v) || (v.startsWith("#") ? rgbaToFigma(hexToRgba(v)) : null);
  if (fig) variables[m[1]] = { css: v, figma: fig };
  else variables[m[1]] = { css: v };
}
function hexToRgba(h) {
  const x = h.replace("#", "");
  if (x.length < 6) return null;
  return `rgb(${parseInt(x.slice(0, 2), 16)}, ${parseInt(x.slice(2, 4), 16)}, ${parseInt(x.slice(4, 6), 16)})`;
}

const plan = { generated_at: new Date().toISOString(), shell: "mobile", variables, pages: [] };

for (const v of views) {
  const id = v.replace(/\.html$/, "");
  const html = fs.readFileSync(path.join(viewsDir, v), "utf8");
  await page.setContent(`<style>${tokensCss}</style><div id="root">${html}</div>`);
  await page.waitForTimeout(200);
  const data = await page.evaluate(() => {
    const root = document.getElementById("root").firstElementChild;
    const rr = root.getBoundingClientRect();
    const out = { frame: { w: Math.round(rr.width) || 390, h: Math.round(Math.max(rr.height, 844)) }, nodes: [] };
    root.querySelectorAll("[data-dc]").forEach((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const kids = el.querySelectorAll("*").length;
      const text = el.children.length === 0 ? (el.innerText || "").trim().slice(0, 120) : null;
      out.nodes.push({
        dc: el.getAttribute("data-dc"),
        tag: el.tagName.toLowerCase(),
        kind: text ? "text" : el.tagName === "BUTTON" || el.getAttribute("role") === "button" ? "button"
          : el.tagName === "IMG" ? "image" : kids > 0 ? "frame" : "rect",
        text: text || undefined,
        rect: { x: Math.round(r.x - rr.x), y: Math.round(r.y - rr.y), w: Math.round(r.width), h: Math.round(r.height) },
        fill: cs.backgroundColor !== "rgba(0, 0, 0, 0)" ? cs.backgroundColor : null,
        color: cs.color,
        cornerRadius: cs.borderRadius,
        fontSize: cs.fontSize, fontWeight: cs.fontWeight, fontFamily: cs.fontFamily.split(",")[0].replace(/["']/g, ""),
      });
    });
    return out;
  });
  for (const n of data.nodes) {
    n.fill = rgbaToFigma(n.fill); n.color = rgbaToFigma(n.color);
    n.cornerRadius = parseFloat(n.cornerRadius) || 0;
    n.fontSize = parseFloat(n.fontSize) || 14; n.fontWeight = +n.fontWeight || 400;
  }
  plan.pages.push({ id, name: (pagesMeta.find((p) => p.id === id) || {}).name || id, ...data });
}
await browser.close();

fs.mkdirSync(path.join(runDir, "report"), { recursive: true });
fs.writeFileSync(planPath, JSON.stringify(plan, null, 2));
console.log(`✅ figma-plan.json：${plan.pages.length} 页 / ${plan.pages.reduce((a, p) => a + p.nodes.length, 0)} 节点 / ${Object.keys(variables).length} variables`);
console.log("下一步：agent 按 references/figma-export.md 用官方 MCP（首选）或 talk-to-figma 逐节点创建，" +
  "完成后 --apply-nodeids 回填");
