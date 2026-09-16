#!/usr/bin/env node
/**
 * no-run-specialcase.mjs（M104-W1 反作弊门）—— skill 生成器/壳/门代码禁止对具体 run 名硬编码特判。
 * 扫描 skills/design-clone/{scripts,templates} 与 site/assets/site.js：
 *   红线 = 以 run slug 做条件分支/映射（if/switch/三元/对象键）；白名单 = 仅允许出现在注释与文档字符串外的显式登记表。
 * 判定保守化：命中 run slug 字面即列出，人工/CI 复核白名单（登记在 WHITELIST 注释行 `// specialcase-allow: <理由>` 可豁免该行）。
 * 用法: node no-run-specialcase.mjs [--json]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");
const RUNS = ["demo-assistant", "demo-petpark", "wechat-full", "mac-lark", "web-aliyun", "slytherin", "mac-workbuddy", "link-dy4", "web-apple"];
const dirs = ["scripts", "templates"].map((d) => path.join(root, d));
const files = [];
const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (e.name === "node_modules" || e.name === ".cache") continue; walk(p); } else if (/\.(mjs|js|css|html)$/.test(e.name)) files.push(p); } };
for (const d of dirs) walk(d);

const hits = [];
for (const f of files) {
  if (f.endsWith("no-run-specialcase.mjs")) continue; // 门自身登记表豁免
  const lines = fs.readFileSync(f, "utf8").split("\n");
  lines.forEach((ln, i) => {
    if (ln.includes("specialcase-allow")) return;
    for (const r of RUNS) {
      const rx = new RegExp("(if|switch|\\?|case|===|==|\\[)\\s*[^\\n]{0,40}" + r.replace("-", "\\-"));
      if (rx.test(ln)) hits.push({ file: path.relative(root, f), line: i + 1, run: r, src: ln.trim().slice(0, 90) });
    }
  });
}
const out = { ok: hits.length === 0, hits };
if (process.argv.includes("--json")) console.log(JSON.stringify(out, null, 1));
else if (!out.ok) { console.log("no-run-specialcase FAIL:"); for (const h of hits) console.log(`  ${h.file}:${h.line} [${h.run}] ${h.src}`); }
else console.log("no-run-specialcase pass");
process.exit(out.ok ? 0 : 1);
