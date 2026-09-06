/* inspector 分段 00-head.js —— IIFE 入口 + DOM 助手($/$$) + 元素引用(W) + 全局状态(S) + query(Q)
 * 源文件按文件名顺序拼接为 prototype/inspector.js（scripts/build-shell.mjs），同一 IIFE 闭包。
 * 约定：JS 只写几何与状态；排版/配色一律 inspector.css 类 + 主题变量。
 */
/* design-clone inspector v4 — M14：URL 状态/面包屑/整卡场景/flowZoom/无边框标注/图标底栏/
   边框开关+状态栏/详情单看板/导出分组/分享截图/modal/播放器/代码视图/设备下拉/对照回退链 */
(function () {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const W = {};
  W.workspace = $("#dc-workspace"); W.zoomwrap = $("#dc-zoomwrap"); W.phone = $("#dc-phone");
  W.screen = $("#dc-screen"); W.stage = $("#dc-stage"); W.overlay = $("#dc-overlay");
  W.single = $("#dc-single"); W.flow = $("#dc-flow"); W.canvas = $("#dc-flow-canvas");

  const S = {
    ia: "pages", flowMode: "tree", selNode: null, selPath: 0, page: null, selected: null,
    edit: false, ann: false, hand: false, scale: 1, fzoom: 1, vm: "preview",
    frame: localStorage.getItem("dc-frame") === "1", labels: localStorage.getItem("dc-labels") === "1",
    device: null, ann_data: {}, journeys: [], products: {}, paths: null, srcmap: {},
    overrides: {}, undo: [], demo: { active: false, timer: null, speed: 1, paused: false },
    play: null, lastHTML: "", variants: {}, filter: "",
  };
  const KIND_COLOR = { navigate: "#07C160", dialog: "#1677FF", toast: "#FA9D3B", state: "#1677FF", instant: "#FA9D3B", blocked: "#FA5151" };
  const KIND_CN = { navigate: "跳转", dialog: "弹窗", toast: "提示", state: "状态变化", instant: "即时反馈", blocked: "安全拦截" };
  const TOKEN_KEYS = ["--color-primary", "--color-accent", "--color-bg", "--color-surface", "--color-text-primary", "--color-text-secondary", "--color-border", "--color-link", "--radius-card"];
  const Q = new URLSearchParams(location.search);
