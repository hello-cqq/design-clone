/**
 * ESLint flat config（M45，dev-only）。
 * 目标是"从第一天就绿、随后逐步收紧"：错误级只留真正会导致故障的规则（重复键/不可达/const 赋值等），
 * 风格类先 warn；no-undef 关闭（浏览器/Node 全局混用，正确性由 node:test + qa 门兜底）。
 * 收紧路线见 CONTRIBUTING.md。
 */
export default [
  {
    ignores: ["**/node_modules/**", "dist/**", "design-clone-runs/**", "report/**", "**/*.html", "**/package-lock.json",
    // ins/* 是 IIFE 片段（单独不可解析）；整体由 build-shell 拼出后以 inspector.built.js 受检
    "skills/design-clone/templates/prototype/ins/**"],
  },
  {
    // Node ESM 脚本
    files: ["skills/design-clone/scripts/**/*.mjs"],
    languageOptions: { ecmaVersion: 2023, sourceType: "module" },
    rules: {
      "no-var": "error",
      "no-dupe-keys": "error",
      "no-dupe-args": "error",
      "no-unreachable": "error",
      "no-const-assign": "error",
      "no-debugger": "error",
      "no-fallthrough": "warn",
      "eqeqeq": ["warn", "smart"],
      "no-unused-vars": ["warn", { args: "none", varsIgnorePattern: "^_" }],
    },
  },
  {
    // 浏览器 classic scripts（inspector 分段 + UMD 叶子）：非模块、无 import/export
    files: ["skills/design-clone/templates/prototype/**/*.js"],
    languageOptions: { ecmaVersion: 2023, sourceType: "script" },
    rules: {
      "no-var": "warn",
      "no-dupe-keys": "error",
      "no-dupe-args": "error",
      "no-unreachable": "error",
      "no-const-assign": "error",
      "no-debugger": "error",
      "no-fallthrough": "warn",
      "eqeqeq": ["warn", "smart"],
      "no-unused-vars": ["warn", { args: "none", varsIgnorePattern: "^_" }],
    },
  },
];
