#!/usr/bin/env node
/**
 * 两图像素差（M17 click-verify 用）：80×80 灰度平均绝对差。
 * 用法: node diff2.mjs <a.png> <b.png>   → 打印数值
 */
import sharp from "sharp";
const [a, b] = process.argv.slice(2);
if (!a || !b) { console.log("用法: node diff2.mjs <a> <b>"); process.exit(1); }
const sig = async (f) => (await sharp(f).resize(80, 80, { fit: "fill" }).grayscale().raw().toBuffer({ resolveWithObject: true })).data;
const [sa, sb] = [await sig(a), await sig(b)];
let s = 0;
for (let i = 0; i < sa.length; i++) s += Math.abs(sa[i] - sb[i]);
console.log((s / sa.length).toFixed(3));
