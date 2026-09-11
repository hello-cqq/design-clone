#!/usr/bin/env node
/**
 * UI 冒烟门（M44k）：真点 inspector 外壳的关键控件，断言"有反应且反应正确"。
 *
 * 为什么需要它：既有门（interact/inspect/fidelity）覆盖的是**原型内容**（视图里的控件、像素、路径），
 * 外壳自身的功能（播放、导出下载、分享、设备档、标注写回、画布标签排版）只能靠人肉点。
 * 结果就是用户连续报"播放没反应 / 导出没下载到本地 / 画布字太粗 / 设备名不对"，而所有门全绿。
 * 本门把这些人工验收点固化成断言，任何一条退化即 fail（退出码 4）。
 *
 * 用法: node ui-smoke.mjs --run <runDir> --base <url> [--out qa/ui-smoke.json] [--fast] [--keep]
 *   --fast  跳过真实导出下载（只验导出菜单与方式切换）
 *   --keep  保留写盘类检查产生的文件（默认检查后还原）
 * 依赖：目标 run 已由 scripts/serve.mjs 提供服务（写盘/导出接口只在 loopback 开放）。
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const A = process.argv.slice(2);
const get = (k) => (A.includes(k) ? A[A.indexOf(k) + 1] : null);
if (A.includes("--help") || A.includes("-h") || !get("--run") || !get("--base")) {
  console.log("用法: node ui-smoke.mjs --run <runDir> --base <url> [--out qa/ui-smoke.json] [--fast] [--keep]");
  process.exit(get("--run") && get("--base") ? 0 : 1);
}
const run = path.resolve(get("--run"));
const base = get("--base").replace(/\/+$/, "");
const outP = get("--out") || path.join(run, "qa/ui-smoke.json");
const fast = A.includes("--fast");
const keep = A.includes("--keep");
const proto = path.join(run, "prototype");

const checks = {};
const ok = (k, v, note = "") => { checks[k] = { pass: !!v, note }; };
const step = async (k, fn) => {
  try { const note = await fn(); ok(k, true, note || ""); }
  catch (e) { ok(k, false, String((e && e.message) || e).slice(0, 200)); }
};
const readJSON = (p, fb) => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return fb; } };
const backup = (f) => { const p = path.join(proto, f); return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null; };
const restore = (f, content) => {
  const p = path.join(proto, f);
  if (content == null) { if (fs.existsSync(p)) fs.rmSync(p); } else fs.writeFileSync(p, content);
};
/** 点空白处把焦点从输入框挪走，否则外壳快捷键被 input 过滤掉 */
const focusBody = () => page.locator("#dc-workspace").click({ position: { x: 4, y: 4 } }).catch(() => {});
/** 幂等打开下拉：已开就不再点（这些按钮是 toggle，重复点会关掉） */
async function openDD(btnSel, ddSel) {
  const hidden = await page.evaluate((s) => { const n = document.querySelector(s); return !n || n.hidden; }, ddSel);
  if (hidden) await page.click(btnSel);
  await page.waitForSelector(ddSel + ":not([hidden])", { timeout: 4000 });
}
/** 保险丝：演示/播放态会隐藏全部外壳，若残留则后续点击全超时 —— 每个检查前强制退出 */
async function ensureChrome() {
  const stuck = await page.evaluate(() => document.body.classList.contains("dc-demo") || !!document.querySelector("#dc-player.on"));
  if (!stuck) return;
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
}

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  acceptDownloads: true,
  permissions: ["clipboard-read", "clipboard-write"],
});
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + String(e.message).slice(0, 140) + " @ " + String(e.stack||"").split("\n").slice(1,3).join(" | ")));
page.on("console", (m) => {
  if (m.type() !== "error") return;
  const t = m.text();
  // 可选产物缺失（404）属正常降级，不算外壳故障
  if (/Failed to load resource|404|variants|layout-overrides|edit-overrides|source-map/.test(t)) return;
  errors.push("console: " + t.slice(0, 140));
});
const writes = [];
page.on("request", (r) => { if (r.url().includes("/__dc_write__")) writes.push(r.postData() || ""); });

await page.goto(base + "/prototype/?t=" + Date.now(), { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(700);

await step("boot", async () => {
  const dc = await page.evaluate(() => !!(window.DC && (window.DC.pages || []).length));
  if (!dc) throw new Error("window.DC / DC.pages 缺失");
  const n = await page.evaluate(() => (document.querySelector("#dc-stage") || { children: [] }).children.length);
  if (!n) throw new Error("stage 为空（视图未注入）");
  if (errors.length) throw new Error(errors.slice(0, 2).join(" | "));
  return `${n} 个视图节点`;
});

/* ---------- 设备档：名称、切换、持久化（用户点名要 手机/平板/桌面/网页） ---------- */
const DEVICE_LABELS = ["手机", "平板", "桌面", "网页"];
let origDeviceCls = "dc-mobile";
await step("device-names", async () => {
  origDeviceCls = await page.evaluate(() => ["dc-mobile", "dc-tablet", "dc-desktop", "dc-browser"].find((c) => document.body.classList.contains(c)) || "dc-mobile");
  await openDD("#dc-device-btn", "#dc-device-dd");
  const got = await page.$$eval("#dc-device-dd button", (bs) => bs.map((b) => (b.firstChild ? b.firstChild.textContent : b.textContent).trim()));
  const label = await page.$eval("#dc-device-label", (n) => n.textContent.trim());
  await page.keyboard.press("Escape");
  if (got.join(",") !== DEVICE_LABELS.join(",")) throw new Error(`设备下拉=${got.join("/")}，应为 ${DEVICE_LABELS.join("/")}`);
  if (!DEVICE_LABELS.includes(label)) throw new Error("当前设备标签=" + label);
  return got.join("/");
});

await step("device-switch-persist", async () => {
  const want = origDeviceCls === "dc-tablet" ? "dc-mobile" : "dc-tablet";
  const wantLabel = want === "dc-tablet" ? "平板" : "手机";
  await openDD("#dc-device-btn", "#dc-device-dd");
  await page.click(`#dc-device-dd button[data-cls="${want}"]`);
  await page.waitForTimeout(400);
  const st = await page.evaluate(() => ({
    cls: document.body.className,
    label: document.querySelector("#dc-device-label").textContent.trim(),
    search: location.search,
  }));
  if (!st.cls.includes(want)) throw new Error(`切换后 body 未加 ${want}: ${st.cls}`);
  if (st.label !== wantLabel) throw new Error("标签未更新: " + st.label);
  if (!st.search.includes("device=" + want)) throw new Error("URL 未带 device 参数: " + st.search);
  await page.reload({ waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(600);
  const after = await page.$eval("#dc-device-label", (n) => n.textContent.trim());
  if (after !== wantLabel) throw new Error("刷新后设备档未持久化: " + after);
  // 还原到该 run 原生设备档，避免影响后续检查与截图口径
  await openDD("#dc-device-btn", "#dc-device-dd");
  await page.click(`#dc-device-dd button[data-cls="${origDeviceCls}"]`);
  await page.waitForTimeout(400);
  return `${wantLabel} 切换 + URL + 刷新持久化 OK`;
});

/* ---------- 播放：必须有可观测反应（此前 pages 模式静默 no-op） ---------- */
await step("play-reacts", async () => {
  await focusBody();
  const pid = await page.evaluate(() => {
    const on = document.querySelector("#dc-pages button.on");
    return on ? on.dataset.nav : "";
  });
  const paths = readJSON(path.join(proto, "paths.json"), null);
  const usableHere = !!(paths && pid && ((paths.perNode || {})[pid] || {}).paths?.some?.((p) => p && p.length));
  await page.click("#dc-play");
  const seen = { player: false, toast: "", modal: false, demo: false };
  try { await page.waitForSelector("#dc-player.on", { timeout: 5000 }); seen.player = true; }
  catch {
    Object.assign(seen, await page.evaluate(() => ({
      toast: (() => { const t = document.querySelector("#dc-toast"); return t && !t.hidden ? (t.textContent || "").trim() : ""; })(),
      modal: !!document.querySelector("#dc-modal-root .dc-modal"),
      demo: document.body.classList.contains("dc-demo") || !!document.querySelector("#dc-caption") || !!document.querySelector("#dc-summary"),
      // 文案必须在退出演示**之前**抓（endDemo 会移除字幕条与总结卡）
      cap: (((document.querySelector("#dc-caption") || document.querySelector("#dc-summary")) || {}).textContent || "").trim(),
    })));
  }
  // 先取证、后收尾：Escape 会立刻 endPlay，若在取到步骤文案前按掉，播放链会在
  // "等待期间会话已结束"的守卫处正确中止，文案就永远不会出现（gate 自身曾犯此错）。
  const cleanupErrs = [];
  const cleanup = async () => {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
    if (seen.player) {
      const closed = await page.evaluate(() => !document.querySelector("#dc-player").classList.contains("on"));
      if (!closed) cleanupErrs.push("Esc 未能结束播放");
    }
    const chromeBack = await page.evaluate(() => {
      const n = document.querySelector("#dc-topbar");
      return !!n && getComputedStyle(n).display !== "none";
    });
    if (!chromeBack) cleanupErrs.push("播放/演示结束后外壳未恢复（顶栏仍隐藏）");
  };
  const reacted = seen.player || seen.toast || seen.modal || seen.demo;
  let note = "";
  try {
    if (!reacted) throw new Error("点「播放」无任何反应（无播放器 / 无提示 / 无弹窗 / 未进演示）");
    if (usableHere && !seen.player) throw new Error("当前页有可播路径却未出播放器，只有：" + JSON.stringify(seen));
    if (seen.player) {
      try { await page.waitForFunction(() => ((document.querySelector("#dc-player .txt") || {}).textContent || "").trim().length > 0, null, { timeout: 8000 }); }
      catch { throw new Error("播放器已出现但 8s 内无步骤文案"); }
      note = "播放器出现并进第 1 步：" + (await page.evaluate(() => ((document.querySelector("#dc-player .txt") || {}).textContent || "").trim())).slice(0, 40);
    } else if (seen.demo) {
      if (!seen.cap) throw new Error("回退进演示但无字幕/总结卡");
      note = "当前页无出向路径，回退演示旅程：" + seen.cap.slice(0, 40);
    } else {
      note = "无可播路径，已给出明确提示：" + (seen.toast || "弹窗");
    }
  } finally {
    await cleanup();
  }
  if (cleanupErrs.length) throw new Error(cleanupErrs.join("；") + (note ? "（反应判定: " + note + "）" : ""));
  return note;
});

/* ---------- 导出：菜单/方式档位 + 真实下载到本地 ---------- */
await ensureChrome();
await step("export-menu", async () => {
  await openDD("#dc-export-btn", "#dc-export-dd");
  const modes = await page.$$eval("#dc-export-dd [data-m]", (b) => b.map((x) => x.textContent.trim()));
  const items = await page.$$eval("#dc-export-dd [data-x]", (b) => b.map((x) => x.textContent.trim()));
  if (modes.length !== 3) throw new Error("导出方式档位=" + modes.length + "（应 3：本地下载/选目录/仅服务端）");
  if (!items.length) throw new Error("导出范围为空");
  await page.click('#dc-export-dd [data-m="server"]');
  await page.waitForTimeout(200);
  const m = await page.evaluate(() => localStorage.getItem("dc-export-mode"));
  if (m !== "server") throw new Error("切换导出方式未持久化: " + m);
  return `${modes.join("/")} · ${items.length} 个范围项`;
});

if (!fast) {
  await step("export-download", async () => {
    await page.evaluate(() => localStorage.setItem("dc-export-mode", "download"));
    await openDD("#dc-export-btn", "#dc-export-dd");
    const btn = (await page.$('#dc-export-dd [data-x="sel-page"]')) ||
      (await page.$('#dc-export-dd [data-x="sel-node"]')) ||
      (await page.$('#dc-export-dd [data-x="all"]'));
    if (!btn) throw new Error("导出菜单里没有可点的范围项");
    const dl = page.waitForEvent("download", { timeout: 120000 });
    await btn.click();
    const d = await dl;
    const name = d.suggestedFilename();
    const tmp = path.join("/tmp", "dc-uismoke-" + Date.now() + ".zip");
    await d.saveAs(tmp);
    const buf = fs.readFileSync(tmp);
    fs.rmSync(tmp, { force: true });
    if (!/\.zip$/.test(name)) throw new Error("下载文件名不是 zip: " + name);
    if (buf.length < 200 || buf[0] !== 0x50 || buf[1] !== 0x4b) throw new Error("下载内容不是有效 zip（" + buf.length + " B）");
    return `${name} ${buf.length} B`;
  });
}

/* ---------- 分享：下拉四项 + 复制链接有反馈 ---------- */
await ensureChrome();
await step("share-menu", async () => {
  await openDD("#dc-share-btn", "#dc-share-dd");
  const ids = await page.$$eval("#dc-share-dd button", (b) => b.map((x) => x.dataset.s));
  for (const want of ["link", "clean", "card", "full"]) if (!ids.includes(want)) throw new Error("分享菜单缺 " + want + "（实有 " + ids.join("/") + "）");
  await page.click('#dc-share-dd [data-s="link"]');
  await page.waitForTimeout(500);
  const fb = await page.evaluate(() => {
    const t = document.querySelector("#dc-toast");
    return ((t && !t.hidden ? t.textContent : "") || "") + "|" + (document.querySelector("#dc-modal-root .dc-modal") || {}).textContent || "";
  });
  if (!/已复制|http/.test(fb)) throw new Error("复制状态链接无反馈: " + fb.slice(0, 80));
  await page.keyboard.press("Escape");
  return ids.join("/");
});

/* ---------- 标注可写：点元素 → 编辑 → 落 annotations.json ---------- */
const annBak = backup("annotations.json");
await ensureChrome();
await step("annotate-write", async () => {
  const has = await page.evaluate(() => !!document.querySelector("#dc-stage [data-dc]"));
  if (!has) throw new Error("视图内无 data-dc 元素，无法标注");
  const pid = await page.evaluate(() => {
    const on = document.querySelector("#dc-pages button.on");
    return on ? on.dataset.nav : (location.hash.replace(/^#pages\//, "").split("/")[0] || "");
  });
  if (!pid) throw new Error("无法确定当前页面 id");
  await page.click("#dc-ann-toggle");
  await page.waitForTimeout(200);
  // 点第一个带 data-dc 的元素（实际命中的可能是其带 data-dc 的后代，故不预设 target）
  await page.locator("#dc-stage [data-dc]").first().click({ timeout: 5000 });
  await page.waitForSelector("#dc-modal-root .dc-modal", { timeout: 4000 });
  await page.fill("#dcf-label", "冒烟标注");
  await page.fill("#dcf-response", "跳转到详情");
  await page.click("#dc-modal-root .dc-modal .acts button.pr");
  await page.waitForTimeout(900);
  if (!writes.some((w) => w.includes("annotations.json"))) throw new Error("未见 /__dc_write__ 写 annotations.json（可能未起 serve）");
  const disk = readJSON(path.join(proto, "annotations.json"), {});
  const hit = (disk[pid] || []).find((a) => a.label === "冒烟标注");
  if (!hit) throw new Error(`标注未写入 annotations.json（页 ${pid}，实有 ${Object.keys(disk).length} 页）`);
  if (!hit.target) throw new Error("写入的标注缺 target");
  const inStage = await page.evaluate((t) => !!document.querySelector(`#dc-stage [data-dc="${t}"]`), hit.target);
  if (!inStage) throw new Error("写入的 target 在视图里不存在: " + hit.target);
  if (!(hit.notes || []).some((n) => /跳转到详情/.test(n.response || ""))) throw new Error("交互响应未写入 notes");
  await page.click("#dc-ann-toggle");
  return `${pid} · ${hit.target} 写回 OK`;
});

/* 标注必须真出现在导出视图里（旧 bug：+ann 截图只裁 #dc-stage，覆盖层整层漏掉 → 两图逐字节相同） */
await step("annotate-render-export", async () => {
  const pid = await page.evaluate(() => {
    const on = document.querySelector("#dc-pages button.on");
    return on ? on.dataset.nav : (location.hash.replace(/^#pages\//, "").split("/")[0] || "");
  });
  const ann = readJSON(path.join(proto, "annotations.json"), {});
  if (!(ann[pid] || []).some((a) => a.label === "冒烟标注")) throw new Error("前置标注不存在（annotate-write 应先通过）");
  const p2 = await ctx.newPage();
  await p2.goto(base + "/prototype/?chrome=0&ann=1#pages/" + pid, { waitUntil: "networkidle", timeout: 30000 });
  await p2.waitForTimeout(1400);
  const n = await p2.evaluate(() => ({ pin: document.querySelectorAll("#dc-overlay .dc-pin").length, card: document.querySelectorAll("#dc-overlay .dc-card").length }));
  await p2.close();
  if (!n.pin || !n.card) throw new Error(`导出视图未渲染标注（pin=${n.pin} card=${n.card}）→ +ann 导出会漏批注`);
  return `pin=${n.pin} card=${n.card}`;
});

/* 视图改版后失效的标注必须被显式提示，而不是静默消失 */
await step("annotate-stale-notice", async () => {
  const bak = backup("annotations.json");
  const cur = readJSON(path.join(proto, "annotations.json"), {});
  const pid = Object.keys(cur)[0];
  if (!pid) throw new Error("无可用页面挂失效样例");
  (cur[pid] = cur[pid] || []).push({ target: "zz/不存在的元素", label: "失效样例", notes: [{ event: "tap", response: "x" }] });
  fs.writeFileSync(path.join(proto, "annotations.json"), JSON.stringify(cur, null, 1));
  await page.goto(base + "/prototype/?t=" + Date.now() + "#pages/" + pid, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(900);
  await page.click("#dc-ann-toggle");
  await page.waitForTimeout(700);
  const txt = await page.$eval("#dc-board-detail", (n) => n.textContent);
  await page.click("#dc-ann-toggle");
  restore("annotations.json", bak);
  await page.goto(base + "/prototype/?t=" + Date.now(), { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(800);
  if (!/失效|不在视图/.test(txt)) throw new Error("失效标注未在详情看板提示（静默丢失）");
  return "失效标注已显式提示";
});

/* ---------- 产品说明可写（活 PRD） ---------- */
const prodBak = backup("products.json");
await ensureChrome();
await step("product-write", async () => {
  const btn = await page.$("#dc-board-detail [data-editprod]");
  if (!btn) throw new Error("详情看板缺「编辑」产品说明入口");
  const id = await btn.getAttribute("data-editprod");
  await btn.click();
  await page.waitForSelector("#dc-modal-root .dc-modal", { timeout: 4000 });
  await page.fill("#dcf-function", "冒烟：产品说明可写");
  await page.click("#dc-modal-root .dc-modal .acts button.pr");
  await page.waitForTimeout(900);
  if (!writes.some((w) => w.includes("products.json"))) throw new Error("未见 /__dc_write__ 写 products.json");
  const disk = readJSON(path.join(proto, "products.json"), {});
  if (!disk[id] || !/冒烟/.test(disk[id].function || "")) throw new Error("产品说明未写入 products.json（" + id + "）");
  return id + " 写回 OK";
});

/* ---------- 变体落盘（此前只进 localStorage，换机即丢） ---------- */
const idxBak = backup("variants-index.json");
await ensureChrome();
await step("variant-save", async () => {
  const sum = await page.$("#dc-board-detail details summary");
  if (!sum) throw new Error("详情看板缺 tokens 调参折叠节");
  await sum.click();
  await page.waitForSelector("#dc-tw-save", { timeout: 3000 });
  await page.click("#dc-tw-save");
  await page.waitForSelector("#dc-modal-root .dc-modal", { timeout: 4000 });
  await page.fill("#dc-modal-root .dc-modal input.dc-inp", "_smoke");
  await page.click("#dc-modal-root .dc-modal .acts button.pr");
  await page.waitForTimeout(1200);
  const dir = path.join(proto, "variants/_smoke");
  if (!fs.existsSync(path.join(dir, "tokens.json"))) throw new Error("变体未落盘 prototype/variants/_smoke/tokens.json");
  if (!fs.existsSync(path.join(dir, "tokens-override.css"))) throw new Error("变体缺 tokens-override.css");
  const idx = readJSON(path.join(proto, "variants-index.json"), {});
  if (!idx.variants || !idx.variants._smoke) throw new Error("variants-index.json 未登记 _smoke");
  return "variants/_smoke 落盘 + 索引登记";
});

/* ---------- M47：小控件可选中进看板（选中回退链） ---------- */
await step("board-select-fallback", async () => {
  const has = await page.evaluate(() => [...document.querySelectorAll("#dc-stage [data-act]")]
    .some((x) => !x.closest("[data-dc]") && !/^(goto|back)$/.test(x.getAttribute("data-act") || "")));
  if (!has) return "视图无未挂 data-dc 的接线小控件，跳过";
  await page.evaluate(() => {
    const t = [...document.querySelectorAll("#dc-stage [data-act]")]
      .find((x) => !x.closest("[data-dc]") && !/^(goto|back)$/.test(x.getAttribute("data-act") || ""));
    t.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
  });
  await page.waitForTimeout(500);
  const shown = await page.evaluate(() => ((document.querySelector("#dc-board-detail") || {}).textContent || "").includes("选中元素"));
  if (!shown) throw new Error("点接线小控件后右看板未展示选中元素（选中回退链失效）");
});

/* ---------- M47：场景树不为空（hub 型 run 的 nav 叶必须渲染） ---------- */
await step("tree-dir-clean", async () => {
  // M49：左栏=纯节点目录（用户：不要一堆 tag）
  await page.click("#dc-rail [data-ia=scene]").catch(() => {});
  await page.waitForTimeout(500);
  const n = await page.locator("#dc-tree .tr-nav").count();
  if (n) throw new Error("左栏仍有 " + n + " 处导航标签块");
});

await step("wire-ink", async () => {
  // M49：数据线=细线（亮浅黑/暗灰白），band 同色不蓝；亮暗双主题验
  const probe = async () => {
    await page.click("#dc-rail [data-ia=scene]").catch(() => {});
    await page.waitForTimeout(500);
    await page.locator("#dc-flow-toggle [data-fm=tree], #dc-flow-toggle button:has-text(\"树\")").first().click().catch(() => {});
    // hub 根无子树线：逐行找有内容子树的节点（数据线只在真子树上）
    const rowsN = await page.locator("#dc-tree .tr-row").count();
    for (let i = 0; i < Math.min(rowsN, 12); i++) {
      await page.locator("#dc-tree .tr-row").nth(i).click();
      await page.waitForTimeout(500);
      if (await page.locator(".wires path.wire").count()) break;
    }
    await page.waitForTimeout(500);
    return page.evaluate(() => {
      const w = document.querySelector(".wires path.wire");
      const b = document.querySelector(".wires path.band");
      if (!w) return null;
      const cw = getComputedStyle(w), cb = b ? getComputedStyle(b) : null;
      return { stroke: cw.stroke, width: parseFloat(cw.strokeWidth), band: cb ? cb.stroke : null };
    });
  };
  const lum = (rgb) => { const m = rgb.match(/\d+/g).map(Number); return (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255; };
  const light = await probe();
  if (!light) throw new Error("树模式无数据线可验");
  if (light.width > 1.2) throw new Error("数据线过粗 " + light.width);
  const ll = lum(light.stroke);
  if (!(ll > 0.15 && ll < 0.5)) throw new Error("亮色数据线应浅黑，实际 " + light.stroke);
  if (light.band && light.band !== light.stroke) throw new Error("band 与数据线不同色: " + light.band);
  await page.click("#dc-theme").catch(() => {});
  await page.waitForTimeout(500);
  const dark = await probe();
  await page.click("#dc-theme").catch(() => {});
  if (dark && lum(dark.stroke) < 0.6) throw new Error("暗色数据线应灰白，实际 " + dark.stroke);
});

await step("wire-label-lite", async () => {
  // M49：线上标注/序号不黑不粗（两模式共用 svg 样式）
  const st = await page.evaluate(() => {
    const el = document.querySelector(".wires .elabel");
    const nu = document.querySelector(".wires .wnum");
    if (!el) return null;
    const ce = getComputedStyle(el), cn = nu ? getComputedStyle(nu) : null;
    return { fw: parseInt(ce.fontWeight, 10), fs: parseFloat(ce.fontSize), nfw: cn ? parseInt(cn.fontWeight, 10) : 400 };
  });
  if (!st) return;
  if (st.fw > 400 || st.nfw > 400) throw new Error("线上标注/序号字重>400: " + st.fw + "/" + st.nfw);
  if (st.fs > 10) throw new Error("线上标注字号过大: " + st.fs);
});

await step("path-rows-all", async () => {
  // M49：路径模式=列出所选根节点全部路径行
  await page.click("#dc-rail [data-ia=scene]").catch(() => {});
  await page.waitForTimeout(500);
  await page.locator("#dc-tree .tr-row").first().click();
  await page.waitForTimeout(300);
  await page.locator("#dc-flow-toggle [data-fm=path], #dc-flow-toggle button:has-text(\"路径\")").first().click().catch(() => {});
  await page.waitForTimeout(900);
  const st = await page.evaluate(async () => {
    const rows = document.querySelectorAll("#dc-flow-canvas .fc-chain, #dc-canvas .fc-chain").length;
    const node = (location.hash.match(/#scene\/path\/([^/]+)/) || [])[1];
    let want = null;
    if (node) { try { const j = await (await fetch("paths.json")).json(); const ps = ((j.perNode || {})[decodeURIComponent(node)] || {}).paths || []; want = ps.length ? ps.length : 1; } catch {} }
    return { rows, want };
  });
  if (!st.rows) throw new Error("路径模式无路径行");
  if (st.want != null && st.rows !== st.want) throw new Error(`路径行 ${st.rows} ≠ perNode.paths ${st.want}`);
});

await step("export-design-artifacts", async () => {
  // M51：导出 zip 必含每页设计 JSON + figma 源（对 live 重采集=含编辑）
  const r = await page.evaluate(async () => {
    const res = await fetch("/__dc_export__", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items: [{ type: "design-json" }, { type: "figma" }], returnFiles: true }) });
    return res.json();
  });
  const names = (r.files || []).map((f) => f.name || f);
  if (!names.some((n) => /figma-source\.json$/.test(n))) throw new Error("导出缺 figma-source.json");
  if (!names.some((n) => /\.spec\.json$/.test(n))) throw new Error("导出缺 pages/*.spec.json");
  return names.length + " 设计文件入 zip";
});

await step("cover-geometry", async () => {
  // M62-A：cover.png 严格 3:2、≤300KB、宽≥900；icon.png ≥256
  const cp = path.join(values.run, "cover.png");
  const ip = path.join(values.run, "icon.png");
  if (!fs.existsSync(cp) || !fs.existsSync(ip)) return "存量 run 无三件套，跳过（inspect gallery-ready 记 warn）";
  const sharp = require("sharp");
  const cm = await sharp(cp).metadata();
  if (cm.width !== 1200 || cm.height !== 800) throw new Error(`cover 非 3:2 1200x800: ${cm.width}x${cm.height}`);
  const kb = fs.statSync(cp).size / 1024;
  if (kb > 300) throw new Error(`cover ${Math.round(kb)}KB > 300KB`);
  const im = await sharp(ip).metadata();
  if (Math.min(im.width, im.height) < 256) throw new Error(`icon 过小: ${im.width}x${im.height}`);
  return `cover ${cm.width}x${cm.height} ${Math.round(kb)}KB`;
});

await step("canvas-text-budget", async () => {
  // M48：画布/看板为"工具 chrome"，文本字重一律 <=500（用户多轮反馈"粗黑"）；OS 状态栏与代码视图保真豁免
  const bad = await page.evaluate(() => {
    const out = [];
    for (const scope of ["#dc-canvas", "#dc-board", "#dc-top"]) {
      for (const n of document.querySelectorAll(scope + " *")) {
        if (n.closest(".dc-statusbar, #dc-code-pre, #dc-player")) continue;
        const t = (n.childNodes.length === 1 && n.firstChild && n.firstChild.nodeType === 3) ? n.textContent.trim() : "";
        if (!t) continue;
        const w = parseInt(getComputedStyle(n).fontWeight, 10) || 400;
        if (w > 500 && out.length < 6) out.push(scope + " " + (n.className || n.tagName).toString().slice(0, 24) + ":" + w + " " + t.slice(0, 10));
      }
    }
    return out;
  });
  if (bad.length) throw new Error(bad.length + " 处 chrome 文本字重>500: " + bad.slice(0, 4).join(" | "));
});

await step("scene-tree-not-empty", async () => {
  const nPages = await page.evaluate(() => ((window.DC && window.DC.pages) || []).length);
  if (nPages < 3) return "页面过少，跳过";
  await focusBody();
  await page.keyboard.press("2");
  await page.waitForTimeout(1800);
  const cards = await page.locator("#dc-flow-canvas .fc-card").count();
  // M49：树=纯子树（用户指令），hub 孤根合法；"不空白"改由路径模式兜底：树≥2 卡 或 路径行≥1
  let rows = 0;
  if (cards < 2) {
    await page.locator("#dc-flow-toggle [data-fm=path]").click().catch(() => {});
    await page.waitForTimeout(900);
    rows = await page.locator("#dc-canvas .fc-chain, #dc-flow-canvas .fc-chain").count();
    await page.locator("#dc-flow-toggle [data-fm=tree]").click().catch(() => {});
    await page.waitForTimeout(400);
  }
  await focusBody();
  await page.keyboard.press("1");
  await page.waitForTimeout(500);
  if (cards < 2 && rows < 1) throw new Error("树仅 " + cards + " 卡且路径模式 0 行（真空白画布）");
  return cards + " 卡/路径 " + rows + " 行";
});

/* ---------- 画布连线标签排版（"太黑太粗"反复出现的回归锁） ---------- */
await ensureChrome();
await step("canvas-label-style", async () => {
  await focusBody();
  await page.keyboard.press("2");
  await page.waitForTimeout(1500);
  const m = await page.evaluate(() => {
    const lum = (c) => {
      const v = String(c).match(/[\d.]+/g);
      if (!v) return 1;
      const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * f(v[0]) + 0.7152 * f(v[1]) + 0.0722 * f(v[2]);
    };
    const grab = (sel) => {
      const n = document.querySelector(sel);
      if (!n) return null;
      const cs = getComputedStyle(n);
      return { fill: cs.fill, lum: lum(cs.fill), size: parseFloat(cs.fontSize), weight: parseFloat(cs.fontWeight), inline: n.getAttribute("style") || "" };
    };
    return { label: grab(".wires .elabel"), num: grab(".wires .wnum"), badge: grab(".wires .wbadge") };
  });
  await focusBody();
  await page.keyboard.press("1");
  await page.waitForTimeout(400);
  if (!m.label) return "该 run 画布无连线标签（跳过）";
  // 相对亮度阈值 0.08：#111（旧值）≈0.006，#8a9099（现值）≈0.28 —— 只拦"近黑"，不误伤中灰
  if (m.label.lum < 0.08) throw new Error("连线标签颜色过黑 fill=" + m.label.fill);
  if (m.label.weight > 500) throw new Error("连线标签字重过大 " + m.label.weight);
  if (m.label.size > 10) throw new Error("连线标签字号过大 " + m.label.size + "px");
  if (/font|fill/i.test(m.label.inline)) throw new Error("标签仍带 inline 排版样式: " + m.label.inline);
  if (m.num) {
    if (m.num.lum < 0.08) throw new Error("编号颜色过黑 fill=" + m.num.fill);
    if (m.num.weight > 600) throw new Error("编号字重过大 " + m.num.weight);
    if (/font|fill/i.test(m.num.inline)) throw new Error("编号仍带 inline 排版样式: " + m.num.inline);
  }
  if (m.badge && /fill|stroke/i.test(m.badge.inline)) throw new Error("编号底盘仍带 inline 配色: " + m.badge.inline);
  return `label ${m.label.size}px/${m.label.weight} ${m.label.fill}`;
});

/* ---------- ?chrome=0 必须真的无壳（导出/嵌入口径） ---------- */
await step("chromeless-view", async () => {
  const p2 = await ctx.newPage();
  await p2.goto(base + "/prototype/?chrome=0", { waitUntil: "networkidle", timeout: 30000 });
  await p2.waitForTimeout(700);
  const vis = await p2.evaluate(() => {
    const v = (s) => {
      const n = document.querySelector(s);
      if (!n) return false;
      const r = n.getBoundingClientRect();
      return getComputedStyle(n).display !== "none" && r.height > 0 && r.width > 0;
    };
    return { topbar: v("#dc-topbar"), left: v("#dc-left"), right: v("#dc-right"), bottom: v("#dc-bottombar"), zoom: v("#dc-zoombar"), stage: v("#dc-stage") };
  });
  await p2.close();
  const shown = Object.entries(vis).filter(([k, x]) => x && k !== "stage").map(([k]) => k);
  if (shown.length) throw new Error("?chrome=0 仍显示外壳: " + shown.join(","));
  if (!vis.stage) throw new Error("?chrome=0 下原型内容也不可见");
  return "无壳视图 OK";
});

/* ---------- 左栏筛选 / 快捷键帮助 / 代码视图 ---------- */
await ensureChrome();
await step("left-filter", async () => {
  const total = await page.$$eval("#dc-pages [data-nav]", (b) => b.length);
  if (!total) throw new Error("页面列表为空");
  await page.fill("#dc-q", "zzz-不存在-zzz");
  await page.waitForTimeout(250);
  const hidden = await page.$$eval("#dc-pages [data-nav]", (b) => b.filter((x) => x.classList.contains("hide")).length);
  const empty = await page.$("#dc-left .dc-empty");
  if (hidden !== total) throw new Error(`无匹配时仍显示 ${total - hidden} 项`);
  if (!empty) throw new Error("无匹配时缺空态提示");
  await page.fill("#dc-q", "");
  await page.waitForTimeout(250);
  const hidden2 = await page.$$eval("#dc-pages [data-nav]", (b) => b.filter((x) => x.classList.contains("hide")).length);
  if (hidden2) throw new Error("清空筛选后仍有 " + hidden2 + " 项被隐藏");
  return total + " 页可筛选";
});

await ensureChrome();
await step("shortcut-help", async () => {
  await focusBody();
  await page.keyboard.press("?");
  await page.waitForSelector("#dc-modal-root .dc-modal", { timeout: 3000 });
  const n = await page.$$eval("#dc-modal-root kbd", (k) => k.length);
  const txt = await page.$eval("#dc-modal-root .dc-modal", (x) => x.textContent);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  if (n < 8) throw new Error("帮助里快捷键条目过少: " + n);
  if (!/播放|演示/.test(txt)) throw new Error("帮助缺播放/演示说明");
  return n + " 条";
});

await ensureChrome();
await step("code-view", async () => {
  await page.click('#dc-viewmode button[data-vm="code"]');
  await page.waitForSelector("#dc-code:not([hidden])", { timeout: 3000 });
  const len = await page.$eval("#dc-code-pre", (n) => n.textContent.length);
  await page.click('#dc-viewmode button[data-vm="preview"]');
  await page.waitForTimeout(200);
  if (len < 50) throw new Error("代码视图内容过短: " + len);
  return len + " 字符";
});

/* ---------- 静态纪律：JS 里不许再写排版 inline（否则必然压过 CSS 又随 zoom 放大） ---------- */
await step("no-inline-typography", async () => {
  const js = fs.readFileSync(path.join(proto, "inspector.js"), "utf8");
  const banned = ["font:600", "font: 600", "font:700", "font: 700", "font-weight:600", "fill:var(--sh-line)", "stroke:var(--sh-line)"];
  const hit = banned.filter((p) => js.includes(p));
  if (hit.length) throw new Error("inspector.js 仍有 inline 重排版/黑线: " + hit.join(","));
  const css = fs.readFileSync(path.join(proto, "inspector.css"), "utf8");
  const m = css.match(/\.wires \.elabel\s*\{[^}]*font:\s*(\d+)\s+([\d.]+)px/);
  if (!m) throw new Error("inspector.css 缺 .wires .elabel 排版规则");
  if (+m[1] > 500 || parseFloat(m[2]) > 10) throw new Error(`.wires .elabel 仍偏重: ${m[1]} ${m[2]}px`);
  if (!/\.wires \.wnum/.test(css) || !/\.wires \.wbadge/.test(css)) throw new Error("缺 .wires .wnum/.wbadge 规则（编号排版必须在 CSS）");
  return `.elabel ${m[1]}/${m[2]}px`;
});

await step("no-runtime-errors", async () => {
  if (errors.length) throw new Error(errors.slice(0, 3).join(" | "));
  return "全程无 pageerror / console error";
});

await browser.close();

if (!keep) {
  restore("annotations.json", annBak);
  restore("products.json", prodBak);
  restore("variants-index.json", idxBak);
  fs.rmSync(path.join(proto, "variants/_smoke"), { recursive: true, force: true });
  const vdir = path.join(proto, "variants");
  try { if (fs.existsSync(vdir) && !fs.readdirSync(vdir).length) fs.rmdirSync(vdir); } catch { /* 非空即保留 */ }
}

fs.mkdirSync(path.dirname(outP), { recursive: true });
const bad = Object.entries(checks).filter(([, c]) => !c.pass);
const out = { run: path.basename(run), base, at: new Date().toISOString(), fast, checks, summary: { pass: Object.keys(checks).length - bad.length, fail: bad.length, bad: bad.map(([k]) => k) } };
fs.writeFileSync(outP, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out.summary));
for (const [k, c] of bad) console.error(`  ✗ ${k}: ${c.note}`);
process.exit(bad.length ? 4 : 0);
