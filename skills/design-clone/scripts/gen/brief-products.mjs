#!/usr/bin/env node
/**
 * brief-products.mjs（M77-W1）——brief.pages → prototype/products.json（再生提示词面板源）。
 * 用法: node brief-products.mjs --run <runDir>
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
const { values: V } = parseArgs({ options: { run: { type: "string" } } });
if (!V.run || process.argv.includes("--help")) { console.log("用法: node brief-products.mjs --run <runDir>"); process.exit(V.run ? 0 : 1); }
const run = path.resolve(V.run);
const brief = JSON.parse(fs.readFileSync(path.join(run, "knowledge/brief.json"), "utf8"));
const products = {};
for (const p of brief.pages) {
  const el = {};
  for (const ctl of p.controls || []) el[ctl.dc] = `${ctl.kind} 控件：${ctl.react}`;
  products[p.id] = { function: p.function, goals: p.goals || [p.function], page_prompt: p.prompt, element_prompts: el };
}
fs.writeFileSync(path.join(run, "prototype", "products.json"), JSON.stringify(products, null, 2));
console.log("products.json:", Object.keys(products).length, "pages");
