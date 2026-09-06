#!/usr/bin/env node
/**
 * fakename.mjs — 场景化假名生成（M44e）。匿名化的"假"值也按产品场景统一风格，不穿帮。
 * 用法: node fakename.mjs --scenario <social-im|travel-life|work-collab|ecommerce-marketing|game-tech|culture-reading|default> --n <K> [--seed N]
 * 称呼（爸/姐/妈妈/家 等）保留不替换；本工具只产出"个人名/昵称"假值。
 */
const A = process.argv.slice(2);
const get = (k, d) => (A.includes(k) ? A[A.indexOf(k) + 1] : d);
if (A.includes("--help") || A.includes("-h")) { console.log("用法: node fakename.mjs --scenario <s> --n <K> [--seed N]"); process.exit(0); }
const POOL = {
  "social-im": ["桃桃", "柚子", "糯糯", "团团", "椰椰", "芒果", "豆豆", "奶盖", "布丁", "雪梨子", "阿禾", "小满"],
  "travel-life": ["山风", "晚晴", "拾光", "远山", "云游", "小舟", "星野", "苔苔", "路遥", "青柠"],
  "work-collab": ["林晓", "陈默", "周航", "苏叶", "何屿", "郑好", "吴迪", "赵晴", "孙策", "李想"],
  "ecommerce-marketing": ["优选君", "惠惠", "小购", "掌柜的", "买手阿May", "客服小蜜"],
  "game-tech": ["夜行者", "像素猫", "NeonFox", "字节侠", "Glitch", "赛博道士"],
  "culture-reading": ["沈砚秋", "顾清让", "苏幕遮", "晏几道", "柳如是", "谢桥"],
  default: ["小A", "小B", "阿明", "阿华", "小美", "小强"],
};
const scen = get("--scenario", "default");
const n = parseInt(get("--n", "4"), 10);
let seed = parseInt(get("--seed", "7"), 10);
const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const pool = [...(POOL[scen] || POOL.default)];
const out = [];
while (out.length < n && pool.length) out.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
console.log(JSON.stringify({ scenario: scen, names: out }));
