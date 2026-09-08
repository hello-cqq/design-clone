/* inspector 分段 10-config.js —— 单一真源配置：DEVICES/SHELL_ALIAS/SHORTCUTS/EXPORT_MODES/TOKEN_KEYS/KIND_*
 * 源文件按文件名顺序拼接为 prototype/inspector.js（scripts/build-shell.mjs），同一 IIFE 闭包。
 * 约定：JS 只写几何与状态；排版/配色一律 inspector.css 类 + 主题变量。
 */
  /* ---------- 单一真源配置（M44k）：设备/壳类/尺寸/快捷键此前散落在 index.html + 3 处 JS 映射，
     改名与改档必须多处同步（用户看到的"浏览器窗/桌面窗"与代码里的 dc-browser 就是因此对不上）。 ---------- */
  const DEVICES = [
    { cls: "dc-mobile", label: "手机", long: "移动端页面", size: [390, 844], touch: true },
    { cls: "dc-tablet", label: "平板", long: "平板应用", size: [834, 1194], touch: true },
    { cls: "dc-desktop", label: "桌面", long: "原生桌面应用（OS 窗）", size: [1280, 800], touch: false },
    { cls: "dc-browser", label: "网页", long: "桌面网页（浏览器窗）", size: [1280, 800], touch: false },
  ];
  /** platform.json 的 shell 取值 → 设备档（含历史别名） */
  const SHELL_ALIAS = {
    c_mobile: "dc-mobile", mobile: "dc-mobile",
    c_tablet: "dc-tablet", tablet: "dc-tablet",
    c_desktop: "dc-desktop", desktop: "dc-desktop",
    c_browser: "dc-browser", c_browser2: "dc-browser", web: "dc-browser",
  };
  const deviceOf = (cls) => DEVICES.find((d) => d.cls === cls) || DEVICES[0];
  const SHORTCUTS = [
    ["1", "页面模式"], ["2", "场景模式（树 / 路径）"], ["P", "播放路径（页面模式=从当前页起播）"],
    ["D", "演示模式（字幕 + 模拟弹窗 + 总结卡）"], ["E", "编辑模式（拖拽 / 改样式，Ctrl+Z 撤销）"],
    ["A", "标注模式（点元素即可新增/编辑批注）"], ["H", "抓手平移"], ["F", "设备边框 + 状态栏"],
    ["0", "缩放 1:1"], ["+ / −", "缩放"], ["Ctrl/⌘ + 滚轮", "画布缩放"], ["Alt + 悬停元素", "测量间距"],
    ["Esc", "退出播放 / 演示"], ["?", "本帮助"],
  ];
  const EXPORT_MODES = [
    { id: "download", label: "本地下载 zip" },
    { id: "dir", label: "选目录导出" },
    { id: "server", label: "仅存服务端" },
  ];

  const el = (sel) => String(sel || "").startsWith("auto:")
    ? W.stage.querySelector(`[data-dc-auto="${sel}"]`)
    : W.stage.querySelector(`[data-dc="${sel}"]`);
  // M47：无 data-dc 的小控件合成选中 id（能点有反应的就该能选中/进看板）
  const synthId = (t) => "auto:" + t.tagName.toLowerCase() + ":" + (t.getAttribute("data-act") || t.getAttribute("data-goto") || t.getAttribute("role") || "ctl") + ":" + String(t.getAttribute("data-msg") || t.textContent || t.getAttribute("name") || "").trim().replace(/\s+/g, "").slice(0, 12);
  const toWS = (r) => { const w = W.workspace.getBoundingClientRect(); return { x: r.left - w.left, y: r.top - w.top, r: r.right - w.left, b: r.bottom - w.top, cx: (r.left + r.right) / 2 - w.left, cy: (r.top + r.bottom) / 2 - w.top, w: r.width, h: r.height }; };
  const rgb2hex = (c) => { const m = c.match(/rgba?\(([\d.]+), ([\d.]+), ([\d.]+)/); if (!m) return c; return "#" + [m[1], m[2], m[3]].map((v) => Math.round(+v).toString(16).padStart(2, "0")).join(""); };
  const idxOf = (id) => (id || "").slice(0, 2);
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
