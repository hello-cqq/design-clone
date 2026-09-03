#!/usr/bin/env node
/**
 * Remix 落回：把 Tweaks/编辑模式导出的 patch 应用到原型（GUI 版 Remix 的持久层）。
 * 用法:
 *   node apply-patch.mjs <run目录> <tokens-patch.json|layout-patch.json>
 * tokens-patch → 追加/更新 knowledge/tokens.css 末尾的 :root 覆盖块 + spec change_log 提醒
 * layout-patch → 写 prototype/layout-overrides.json（inspector 每次视图加载后应用）
 */
import fs from "node:fs";
import path from "node:path";
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("用法:\nnode apply-patch.mjs <run目录> <tokens-patch.json|layout-patch.json>");
  process.exit(0);
}


const [runDir, patchFile] = process.argv.slice(2);
if (!runDir || !patchFile) { console.log("用法: node apply-patch.mjs <run目录> <patch.json>"); process.exit(1); }
const patch = JSON.parse(fs.readFileSync(patchFile, "utf8"));

if (patch.type === "tokens-patch" || patch.overrides) {
  const cssPath = path.join(runDir, "knowledge", "tokens.css");
  let css = fs.readFileSync(cssPath, "utf8");
  const block =
    "\n/* remix-override " + new Date().toISOString() + " */\n:root {\n" +
    Object.entries(patch.overrides).map(([k, v]) => `  ${k}: ${v};`).join("\n") +
    "\n}\n";
  css = css.replace(/\/\* remix-override[\s\S]*$/, ""); // 旧覆盖块只留最新
  fs.writeFileSync(cssPath, css + block);
  console.log(`✅ tokens 已落回 ${cssPath}（${Object.keys(patch.overrides).length} 项）`);
  console.log("提示：在对应 pages/*.spec.yaml 的 meta.change_log 追加一条 remix 记录");
} else if (Array.isArray(patch.changes)) {
  const ovPath = path.join(runDir, "prototype", "layout-overrides.json");
  let ov = {};
  try { ov = JSON.parse(fs.readFileSync(ovPath, "utf8")); } catch {}
  for (const c of patch.changes) {
    ov[c.page] = ov[c.page] || {};
    ov[c.page][c.target] = { dx: c.dx, dy: c.dy };
  }
  fs.writeFileSync(ovPath, JSON.stringify(ov, null, 2));
  console.log(`✅ layout 覆盖已写入 ${ovPath}（inspector 打开即生效）`);
  console.log("提示：结构性改动请在下次 Remix 时由 agent 落进 views/*.html 与 spec");
} else {
  console.log("❌ 未识别的 patch 格式（需 type=tokens-patch 或 changes[]）");
  process.exit(1);
}
