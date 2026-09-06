/**
 * build-shell 单测：分段顺序/拼接确定性/产物形态（单 IIFE、boot 收尾、无重复 const 声明冲突的粗检）。
 */
import test from "node:test";
import assert from "node:assert/strict";
import { buildInspector, INSPECTOR_SECTIONS } from "../build-shell.mjs";

test("sections are ordered by numeric prefix, not lexicographic", () => {
  const files = INSPECTOR_SECTIONS();
  const nums = files.map((f) => parseInt(f, 10));
  assert.deepEqual(nums, [...nums].sort((a, b) => a - b));
  assert.ok(files.length >= 13, "inspector 至少拆成 13 段");
  assert.ok(files[0].startsWith("00-head"), "head 段必须最先");
  assert.ok(files[files.length - 1].startsWith("160-boot"), "boot 段必须最后");
});

test("build is deterministic and a single IIFE", () => {
  const a = buildInspector();
  const b = buildInspector();
  assert.equal(a, b, "重复构建必须逐字节一致");
  assert.equal(a.match(/\(function \(\) \{/g).length, 1, "只允许一个 IIFE 入口");
  assert.equal((a.match(/\}\)\(\);/g) || []).length >= 1, true);
  assert.ok(a.trimEnd().endsWith("})();"), "以 IIFE 收尾");
  assert.ok(/\n\s*boot\(\);/.test(a), "boot() 必须被调用");
});

test("no top-level const/let redeclaration across sections", () => {
  const src = buildInspector();
  const decls = [...src.matchAll(/^\s{2}(?:const|let|function)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
  const seen = new Set();
  const dup = [];
  for (const d of decls) { if (seen.has(d)) dup.push(d); seen.add(d); }
  assert.deepEqual(dup, [], "同名顶层声明会在拼接后直接 SyntaxError/覆盖：" + dup.join(","));
});
