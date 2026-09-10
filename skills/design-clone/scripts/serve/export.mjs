/**
 * /__dc_export__ 处理（M45 抽出）：headless chromium 元素级截屏编排。
 * - chrome=0：只出原型本体，不含外壳像素
 * - page+ann：标注层是 #dc-stage 的兄弟节点，locator 截图会漏 → 按 #dc-phone 盒裁剪整块像素
 * - path：首选 [data-pathrow]，旧 run 缺失时退回画布整体（不至于 500）
 * - returnFiles：回传 base64（上限 MAX_RETURN_BYTES），供浏览器端打 zip 直接下载到本地
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { json, MAX_RETURN_BYTES } from "./policy.mjs";

const require = createRequire(import.meta.url);

export async function runExport({ root, base, job, res }) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outDir = path.join(root, "export", ts);
  fs.mkdirSync(path.join(outDir, "pages"), { recursive: true });
  const files = [];
  let browser = null;
  try {
    const items = job.items || [];
    const needBrowser = items.some((i) => i.type !== "board");
    if (needBrowser) {
      const { chromium } = require("playwright");
      browser = await chromium.launch();
    }
    const page = browser ? await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 }) : null;
    const videoItem = items.find((i) => i.type === "video");
    if (videoItem && browser) {
      const ctx = await browser.newContext({ recordVideo: { dir: outDir, size: { width: 900, height: 1000 } } });
      const vp = await ctx.newPage();
      await vp.goto(`${base}/prototype/?view=path&root=${videoItem.root || ""}&path=${videoItem.path || 0}&play=1`, { waitUntil: "networkidle" });
      await vp.waitForTimeout(Math.min(30000, 6000 + (videoItem.steps || 4) * 2600));
      await vp.close();
      const vid = await vp.video().path();
      fs.renameSync(vid, path.join(outDir, `path-${videoItem.path || 0}.webm`));
      files.push(`path-${videoItem.path || 0}.webm`);
    }
    for (const it of items) {
      // M51：设计产物=对 live base 重采集（edit-overrides 运行时已作用 → 天然含用户编辑）
      if (it.type === "design-json" || it.type === "figma") {
        // M51：对 live base 重采集（edit-overrides 运行时已作用 → 天然含用户编辑），产物落 outDir/design/ 随 zip 下载
        const { collectDesign } = await import("../gen/collect-design.mjs");
        await collectDesign(root, base, it.id || undefined);
        fs.mkdirSync(path.join(outDir, "design"), { recursive: true });
        if (it.type === "design-json") {
          const pagesDir = path.join(root, "prototype", "pages");
          for (const f of fs.readdirSync(pagesDir).filter((x) => x.endsWith(".spec.json"))) {
            if (it.id && f !== it.id + ".spec.json") continue;
            fs.copyFileSync(path.join(pagesDir, f), path.join(outDir, "design", f));
            files.push("design/" + f);
          }
        } else {
          fs.copyFileSync(path.join(root, "prototype", "design", "figma-source.json"), path.join(outDir, "design", "figma-source.json"));
          files.push("design/figma-source.json");
        }
        continue;
      }
      if (it.type === "board") {
        fs.writeFileSync(path.join(outDir, "board.json"), JSON.stringify(it.board, null, 2));
        files.push("board.json"); continue;
      }
      const ann = it.ann ? 1 : 0;
      let url, sel, name;
      if (it.type === "page") { url = `${base}/prototype/?chrome=0&ann=${ann}#${it.id}`; sel = "#dc-stage"; name = `pages/${it.id}${it.ann ? "+ann" : ""}.png`; }
      else if (it.type === "scene-full") { url = `${base}/prototype/?chrome=0&view=tree&root=__all__`; sel = "#dc-flow-canvas"; name = "scene-full.png"; }
      else if (it.type === "node") { url = `${base}/prototype/?chrome=0&view=tree&root=${it.id}`; sel = "#dc-flow-canvas"; name = `node-${it.id}.png`; }
      else if (it.type === "path") { url = `${base}/prototype/?chrome=0&view=path&root=${it.root || ""}&path=${it.id}`; sel = `[data-pathrow="${it.id}"]`; name = `path-${it.id}.png`; }
      else continue;
      await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForTimeout(700);
      try { await page.waitForSelector(sel, { timeout: 4000 }); }
      catch {
        if (sel.startsWith("[data-pathrow")) { sel = "#dc-flow-canvas"; await page.waitForSelector(sel, { timeout: 5000 }); }
        else throw new Error(`selector not found: ${sel} (${name})`);
      }
      if (it.type === "page" && it.ann) {
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(200);
        const box = await page.locator("#dc-phone").boundingBox();
        if (!box || box.width < 10) throw new Error("无法定位 #dc-phone 以裁剪标注图");
        await page.screenshot({ path: path.join(outDir, name), clip: box, captureBeyondViewport: true });
      } else {
        await page.locator(sel).screenshot({ path: path.join(outDir, name) });
      }
      files.push(name);
    }
    fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify({ at: new Date().toISOString(), scope: job.scope || "custom", files }, null, 2));
    if (browser) await browser.close();
    const out = { ok: true, dir: path.relative(process.cwd(), outDir), files };
    if (job.returnFiles) {
      const payload = [];
      let total = 0;
      for (const rel of files) {
        const abs = path.join(outDir, rel);
        if (!fs.existsSync(abs)) continue;
        const buf = fs.readFileSync(abs);
        total += buf.length;
        if (total > MAX_RETURN_BYTES) { out.truncated = true; break; }
        payload.push({ name: rel, b64: buf.toString("base64") });
      }
      out.payload = payload;
      out.dirAbs = outDir;
    }
    return json(res, 200, out);
  } catch (e) {
    if (browser) await browser.close().catch(() => {});
    return json(res, 500, { ok: false, error: String(e.message).slice(0, 300) });
  }
}
