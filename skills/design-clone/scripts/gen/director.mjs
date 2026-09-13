#!/usr/bin/env node
/**
 * director.mjs —— 概念导演（M77-W1）：稀薄/简短描述 → 全套设计 brief（豆包对标+九 aspect 全驱动）。
 * 用法: node director.mjs --concept "<描述>" [--out <brief.json>] [--hints <json>] [--refs <dir>]
 *       [--scenario <key>] [--style <anchor>] [--pages <n>] [--name <名>] [--auto]
 * 产出 brief.json schema（九 aspect）:
 *   identity{name_zh,name_en,logline,palette[],tokens{}} style_baseline{anchor,words}
 *   characters[{id,name,persona,prompt}] pages[{id,name,function,goals[],layout[],controls[{dc,kind,react}],prompt}]
 *   assets[{id,kind,prompt,w,h}] icon{prompt} cover{prompt} tags[] flows[{from,to,story}]
 *   scenes[{id,motif,particles}] video_prompts[] design_notes[] suggested_questions[]
 * 纪律：仅服务 source=original/concept run；clone 链路（capture/spec）不读本文件（门 brief-director 仅 original 生效）。
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

const { values: V } = parseArgs({
  options: {
    concept: { type: "string" }, out: { type: "string" }, hints: { type: "string" }, refs: { type: "string" },
    scenario: { type: "string" }, style: { type: "string" }, pages: { type: "string" }, name: { type: "string" }, auto: { type: "boolean", default: false },
  },
});
if (!V.concept || process.argv.includes("--help")) {
  console.log("用法: node director.mjs --concept \"<描述>\" [--out brief.json] [--hints json] [--refs dir] [--scenario key] [--style anchor] [--pages n] [--name 名]");
  process.exit(V.concept ? 0 : 1);
}
const hints = V.hints && fs.existsSync(V.hints) ? JSON.parse(fs.readFileSync(V.hints, "utf8")) : {};
const c = V.concept.trim();

/* ---------- 场景识别 ---------- */
const SCEN_DETECT = [
  ["virtual-assistant", /助理|助手|陪伴|对话|chatbot|assistant|ai 角色|虚拟人/],
  ["animal-park", /动物|宠物|乐园|动物园|养成|park|pet|zoo/],
  ["education", /学习|背单词|错题|课堂|笔记|study|edu|考试/],
  ["music", /音乐|播放器|歌|乐队|music|player/],
  ["culture-tea", /茶|国风|汉服|诗词|古风|tea|文化/],
  ["commerce", /电商|秒杀|商城|购物|下单|shop|store|flash/],
  ["game-tech", /赛博|朋克|游戏|cyber|game/],
  ["travel", /旅行|地图|攻略|出行|travel/],
];
const scenario = V.scenario || (SCEN_DETECT.find(([k, re]) => re.test(c)) || [])[0] || "generic";

/* ---------- 风格锚点（用户词优先） ---------- */
const STYLE_ANCHORS = {
  "anime-cel": "premium anime key visual, crisp cel shading 2-3 tone steps, strong rim light, volumetric god rays, layered atmospheric depth, saturated-yet-soft palette, studio key art quality, NOT photoreal",
  "shinkai-2.5d": "Makoto Shinkai film style 2.5D anime, clean transparent cinematic light, tyndall beams, luminous sky and sea reflections, delicate hair strands, emotional color script, 8k key visual, NOT photoreal",
  "zootopia-3d": "Disney Zootopia-grade cinematic 3D cartoon render, PBR fur and fabric materials, soft natural light and volumetrics, juicy macaron palette, anthropomorphic characters, rounded modern game UI, OC render 8k, clean background",
  "pixar-3d": "pixar style 3d render, soft volumetric lighting, detailed fur and textures, subsurface scattering, cinematic still",
  cyberpunk: "cyberpunk neon art, rain-slick reflections, magenta-cyan rim light, holographic ui glow, moody night atmosphere",
  guofeng: "Chinese guofeng ink-wash illustration, xuan paper texture, flowing brush lines, subtle mineral pigments, 留白 negative space",
  "flat-corporate": "clean flat corporate illustration, geometric simplified shapes, consistent 2-tone brand palette, crisp edges",
};
const styleAnchor = V.style || (hints.style_anchor) ||
  (/新海诚|shinkai/.test(c) ? "shinkai-2.5d"
    : /动物城|zootopia|疯狂动物/.test(c) ? "zootopia-3d"
      : /二次元|2\.5d|动漫/.test(c) ? "anime-cel"
        : /赛博|cyber/.test(c) ? "cyberpunk"
          : /国风|古风|茶/.test(c) ? "guofeng"
            : /3d/.test(c) ? "pixar-3d"
              : ({ "virtual-assistant": "shinkai-2.5d", "animal-park": "zootopia-3d", "culture-tea": "guofeng", "game-tech": "cyberpunk" })[scenario] || "anime-cel");

/* ---------- 场景配方（页骨架/控件/角色/场景母题） ---------- */
const UI = "圆角玻璃卡片+半透明磨砂控件+柔和阴影+清晰信息层级+手机竖屏";
const R = {
  "virtual-assistant": {
    name: ["星海对话", "Starsea Talk"],
    palette: ["#0e2a4a 夜海", "#8fd0ff 星蓝", "#fff6e9 昼奶油", "#ffd166 月光金", "#7edcc3 薄荷"],
    characters: [
      { id: "ch-xinghai", name: "星海", persona: "夜晚星空人设：清冷少年音，深夜问答/思考陪伴", prompt: "深蓝凌乱短发少年，清澈蓝眼睛，白衬衫，侧脸，夜晚海边+漫天银河+海面月光倒影" },
      { id: "ch-haixi", name: "海汐", persona: "白日晴空人设：温柔少女音，日常陪伴/轻松对话", prompt: "黑色清爽短碎发少女，棕色温柔眼眸，宽松白衬衫，侧脸，白日大海+蓝天白云+海面波光" },
    ],
    pages: [
      { id: "00-launch", name: "启动页", function: "世界观第一印象：双角色隔海相望+标题+开始按钮", layout: ["全屏隔海相望插画", "中央大标题+副标题", "底部圆角开始按钮"], controls: [{ dc: "as/start", kind: "goto", react: "进入首页" }] },
      { id: "01-home", name: "首页·角色选择", function: "双角色大卡切换+音色入口+底部导航", layout: ["左右两张竖立绘大卡（夜/昼）", "卡下小字：切换角色/更换音色", "底部导航 首页|对话|视频|设置"], controls: [{ dc: "as/personas", kind: "radio", react: "切换昼夜主题令牌+背景层" }, { dc: "as/voice-entry", kind: "goto", react: "跳设置音色" }] },
      { id: "02-chat", name: "文字聊天", function: "问答对话：气泡+小头像+虚化海面背景", layout: ["顶栏角色头像+名+音色切换钮", "左 AI 右用户气泡带小头像", "底部输入框+发送"], controls: [{ dc: "as/flow", kind: "toast", react: "打字指示动画" }, { dc: "as/send", kind: "toast", react: "追加 AI 气泡" }] },
      { id: "03-call", name: "视频通话", function: "半身角色 70% 画面+磨砂控制栏", layout: ["全屏角色半身+虚化海星背景", "底部磨砂钮：麦克风/摄像头/挂断/表情"], controls: [{ dc: "as/mic", kind: "toggle", react: "波形静止" }, { dc: "as/end", kind: "toast", react: "计时结束" }] },
      { id: "04-settings", name: "设置·形象音色", function: "形象预览+音色四档+背景切换", layout: ["形象立绘预览卡", "音色列表 少年/少女/清冷/暖阳", "背景切换 星空/晴空"], controls: [{ dc: "as/voices", kind: "radio", react: "音色标签高亮" }, { dc: "as/bgs", kind: "radio", react: "背景层切换" }] },
    ],
    scenes: [{ id: "sc-night", motif: "夜海+银河+月光倒影", particles: "sparkles" }, { id: "sc-day", motif: "昼海+蓝天白云+波光", particles: "motes" }],
    tags: ["assistant", "ai-companion", "anime", "voice", "video-call"],
  },
  "animal-park": {
    name: ["动物乐园", "Animal Paradise"],
    palette: ["#7edcc3 草薄荷", "#ffd66b 阳光金", "#8ecdf0 天空蓝", "#f2a65a 暖橙", "#fff6e9 奶油"],
    characters: [
      { id: "ch-fox", name: "耳廓狐", persona: "主唱担当：大耳挥手，彩色小围巾", prompt: "拟人耳廓狐，毛茸茸大耳，明亮眼睛，彩色小围巾，开心挥手" },
      { id: "ch-ragdoll", name: "布偶猫", persona: "治愈互动：蓝眼浅蓝围巾", prompt: "布偶猫，温柔蓝眼，浅蓝围巾，坐姿" },
      { id: "ch-golden", name: "金渐层", persona: "跳舞担当：金色短毛", prompt: "金渐层猫，金色短毛，可爱舞步" },
      { id: "ch-lion", name: "狮子猫", persona: "表演担当：华丽长毛红金披肩", prompt: "狮子猫，华丽长毛，红金披肩" },
      { id: "ch-dog", name: "田园犬", persona: "舞蹈/陪伴：黄白立耳", prompt: "田园犬，黄白立耳，热情活泼" },
      { id: "ch-slider", name: "巴西龟", persona: "节奏演奏：彩色龟壳小沙锤", prompt: "巴西龟，彩色龟壳，拿小沙锤" },
      { id: "ch-grass", name: "草龟", persona: "音乐演奏：稳重小木琴", prompt: "草龟，稳重龟壳，敲小木琴" },
    ],
    pages: [
      { id: "00-launch", name: "启动页", function: "动物城全景+群像挥手+开始冒险", layout: ["城门口群像挥手", "大标题+副标题", "底部开始按钮"], controls: [{ dc: "pp/start", kind: "goto", react: "进首页" }] },
      { id: "01-home", name: "首页·大世界", function: "开放场景总入口：资源栏+任务气泡+双入口", layout: ["3D 城市公园全景", "顶资源栏 金币/钻石/体力", "任务气泡", "左下家园/右下舞台入口", "底导 乐园|动物|乐队|家园|任务"], controls: [{ dc: "pp/entry-home", kind: "goto", react: "跳家园" }, { dc: "pp/entry-stage", kind: "goto", react: "跳乐队" }] },
      { id: "02-interact", name: "单动物互动", function: "圆形互动舞台+抚摸/喂食/唱歌+好感", layout: ["角色居中圆形舞台+表情气泡爱心粒子", "顶资源栏+返回", "右三圆钮 抚摸/喂食/唱歌", "底动作面板 主钮开始互动/副钮查看好感"], controls: [{ dc: "pp/pet", kind: "toast", react: "爱心粒子+表情切换" }, { dc: "pp/feed", kind: "toast", react: "好感+1" }, { dc: "pp/sing", kind: "toast", react: "音符粒子" }] },
      { id: "03-band", name: "动物乐队", function: "五人乐队舞台+卡槽+播放控制", layout: ["森林露天舞台五动物持乐器", "左队员卡槽 主唱/键盘/吉他/鼓/沙锤", "底控制 播放/换歌/换装/保存", "曲目标签"], controls: [{ dc: "pp/play", kind: "toggle", react: "舞台灯光动画启停" }, { dc: "pp/slots", kind: "radio", react: "卡槽高亮" }] },
      { id: "04-map", name: "地图导游", function: "3D 城市地图+分区气泡+向导卡", layout: ["等距 3D 城地图", "分区标签气泡", "顶搜索+导航钮", "底向导卡 狐狸向导+地图/收藏/任务"], controls: [{ dc: "pp/zones", kind: "radio", react: "分区气泡高亮+向导语切换" }] },
      { id: "05-build", name: "家园搭建", function: "素材栏+3D 地块+放置/旋转/撤销/保存", layout: ["略俯 3D 草地地块", "左素材栏 房屋/植物/家具/装饰", "底操作栏四钮"], controls: [{ dc: "pp/mats", kind: "radio", react: "素材高亮" }, { dc: "pp/place", kind: "toast", react: "地块落物动画" }] },
      { id: "06-dex", name: "动物图鉴", function: "三列卡片网格：解锁/锁", layout: ["顶标题+筛选 按性格/按乐器", "3 列卡网格", "底导"], controls: [{ dc: "pp/dexcard", kind: "dialog", react: "动物简介弹窗" }] },
      { id: "07-tasks", name: "任务与活动", function: "任务卡+进度+活动面板", layout: ["三任务卡（头像+进度+去完成）", "活动面板 周末音乐节"], controls: [{ dc: "pp/go", kind: "toast", react: "进度+10%" }] },
    ],
    scenes: [{ id: "sc-city", motif: "动物城中央广场+喷泉电车", particles: "motes" }, { id: "sc-stage", motif: "森林舞台+彩光斑", particles: "sparkles" }],
    tags: ["pets", "3d", "band", "build", "collection"],
  },
  education: {
    name: ["拾光书房", "Study Loft"],
    palette: ["#f4efe4 纸白", "#3f7f6a 松绿", "#e8a53c 书签金", "#5a8fd8 笔记蓝"],
    characters: [{ id: "ch-owl", name: "守书鸮", persona: "学习伙伴：督学+鼓励", prompt: "圆眼猫头鹰学者，小圆眼镜，披肩书卷气" }],
    pages: [
      { id: "01-home", name: "今日书桌", function: "今日目标+连续天数+开始学习", layout: ["书桌场景插画", "目标三环进度", "大按钮开始专注"], controls: [{ dc: "ed/start", kind: "toast", react: "番茄钟启动动画" }] },
      { id: "02-cards", name: "单词卡", function: "翻卡记忆：认识/模糊/忘记", layout: ["中央翻卡", "底三判钮"], controls: [{ dc: "ed/flip", kind: "toggle", react: "翻面动画" }, { dc: "ed/judge", kind: "toast", react: "进度+1" }] },
      { id: "03-wrong", name: "错题本", function: "错题列表+重做", layout: ["科目筛选胶囊", "错题卡列表"], controls: [{ dc: "ed/redo", kind: "toast", react: "标记已掌握" }] },
      { id: "04-stats", name: "学情报告", function: "周曲线+薄弱点", layout: ["折线图卡", "薄弱知识点胶囊"], controls: [{ dc: "ed/range", kind: "radio", react: "曲线切换" }] },
    ],
    scenes: [{ id: "sc-desk", motif: "暖光书桌+纸页", particles: "motes" }],
    tags: ["study", "cards", "focus", "stats"],
  },
  music: {
    name: ["霓虹磁带", "Neon Tape"],
    palette: ["#0b0f1c 夜底", "#ff4fd8 霓虹粉", "#4fd8ff 霓青", "#ffd166 磁带走灯"],
    characters: [{ id: "ch-dj", name: "磁带猫", persona: "DJ 向导：打碟甩尾", prompt: "赛博猫 DJ，耳机+荧光项圈，爪搭打碟机" }],
    pages: [
      { id: "01-home", name: "今夜电台", function: "推荐歌单瀑布+播放条", layout: ["霓虹城市背景", "歌单双列卡", "底迷你播放条"], controls: [{ dc: "mu/play", kind: "toggle", react: "播放条波形动" }] },
      { id: "02-player", name: "播放器", function: "旋转磁带+歌词滚动", layout: ["中央磁带盘旋转", "歌词三行", "控制排"], controls: [{ dc: "mu/like", kind: "toggle", react: "心形粒子" }] },
      { id: "03-eq", name: "均衡器", function: "八段推杆+预设", layout: ["推杆排", "预设胶囊"], controls: [{ dc: "mu/eq", kind: "slider", react: "频谱动画" }] },
      { id: "04-live", name: "live 房", function: "弹幕+礼物", layout: ["舞台光斑", "弹幕流", "礼物排"], controls: [{ dc: "mu/gift", kind: "toast", react: "礼物飘屏" }] },
    ],
    scenes: [{ id: "sc-neon", motif: "雨夜霓虹街", particles: "sparkles" }],
    tags: ["music", "cyberpunk", "player", "live"],
  },
  "culture-tea": {
    name: ["山海茶事", "Mountain Tea"],
    palette: ["#f7f2e7 宣纸", "#5c8a6a 茶绿", "#b8563e 朱砂", "#d9b36c 缃色"],
    characters: [{ id: "ch-tea", name: "茶灵", persona: "执壶仙子：讲茶史", prompt: "国风茶灵，素衣执壶，发间茶花" }],
    pages: [
      { id: "01-home", name: "今日茶单", function: "节气荐茶+冲泡开始", layout: ["山水留白背景", "茶单竖排卡", "冲泡按钮"], controls: [{ dc: "te/brew", kind: "toast", react: "水汽动画" }] },
      { id: "02-brew", name: "冲泡", function: "三步水温/时间/出汤", layout: ["盏中汤色渐变", "三步滑杆"], controls: [{ dc: "te/step", kind: "slider", react: "汤色变化" }] },
      { id: "03-story", name: "茶史卷", function: "长卷横向阅读", layout: ["横滑卷卡"], controls: [{ dc: "te/scroll", kind: "goto", react: "卷页翻动" }] },
      { id: "04-mine", name: "茶仓", function: "藏茶格+品鉴记录", layout: ["九宫格茶仓"], controls: [{ dc: "te/cell", kind: "dialog", react: "茶档案弹窗" }] },
    ],
    scenes: [{ id: "sc-ink", motif: "远山留白+水汽", particles: "petals" }],
    tags: ["guofeng", "tea", "culture", "ritual"],
  },
  commerce: {
    name: ["闪购集市", "Flash Bazaar"],
    palette: ["#fff3ea 暖白", "#ff5a3c 秒杀橙", "#ffd166 价签金", "#2b3a55 墨蓝"],
    characters: [{ id: "ch-mascot", name: "集市狸", persona: "砍价助手：举牌报时", prompt: "圆润狸猫掌柜，举小价牌" }],
    pages: [
      { id: "01-home", name: "秒杀主场", function: "倒计时+场次 tab+商品瀑", layout: ["顶倒计时牌", "场次胶囊", "双列商品卡"], controls: [{ dc: "co/tab", kind: "radio", react: "场次切换" }, { dc: "co/grab", kind: "toast", react: "库存-1" }] },
      { id: "02-detail", name: "商品详情", function: "轮播+规格+领券", layout: ["轮播图", "规格胶囊", "领券条"], controls: [{ dc: "co/spec", kind: "radio", react: "价格联动" }, { dc: "co/coupon", kind: "toast", react: "券入包" }] },
      { id: "03-cart", name: "购物车", function: "勾选+凑单", layout: ["勾选列表", "凑单推荐条"], controls: [{ dc: "co/check", kind: "toggle", react: "总价重算" }] },
      { id: "04-pay", name: "收银台", function: "支付方式+提交", layout: ["金额大字", "支付 radio", "提交钮"], controls: [{ dc: "co/pay", kind: "radio", react: "方式高亮" }] },
    ],
    scenes: [{ id: "sc-market", motif: "暖光集市摊位", particles: "motes" }],
    tags: ["commerce", "flash-sale", "cart", "coupon"],
  },
  generic: {
    name: ["灵感盒子", "Idea Box"],
    palette: ["#eef4f8 雾蓝", "#3fb899 薄荷", "#ffd166 暖金", "#12333f 墨"],
    characters: [{ id: "ch-box", name: "盒灵", persona: "向导小精灵", prompt: "圆润小精灵，头顶天线灯" }],
    pages: [
      { id: "01-home", name: "首页", function: "核心入口+今日焦点", layout: ["焦点大卡", "四入口磁贴"], controls: [{ dc: "gn/focus", kind: "goto", react: "跳详情" }] },
      { id: "02-list", name: "列表", function: "筛选+卡片流", layout: ["筛选胶囊", "卡片流"], controls: [{ dc: "gn/filter", kind: "radio", react: "列表过滤" }] },
      { id: "03-detail", name: "详情", function: "图文详情+主操作", layout: ["头图", "信息行", "主按钮"], controls: [{ dc: "gn/cta", kind: "toast", react: "状态回执" }] },
      { id: "04-me", name: "我的", function: "档案+设置行", layout: ["头像卡", "设置行"], controls: [{ dc: "gn/sw", kind: "toggle", react: "开关翻转" }] },
    ],
    scenes: [{ id: "sc-soft", motif: "柔光渐变空间", particles: "motes" }],
    tags: ["lifestyle", "tools"],
  },
};
const rec = R[scenario] || R.generic;

/* ---------- 用户词覆盖（名字/角色/风格词注入） ---------- */
const nameZh = V.name || (hints.name_zh) || rec.name[0];
const nameEn = hints.name_en || rec.name[1] || nameZh;
const extraChars = (hints.characters || []).map((x, i) => ({ id: "ch-h" + i, name: x.name || "角色" + i, persona: x.persona || "", prompt: x.prompt || x.name }));
const characters = [...(hints.characters ? extraChars : rec.characters)];
const styleWords = STYLE_ANCHORS[styleAnchor] || STYLE_ANCHORS["anime-cel"];
const styleBaseline = `${styleWords}；${UI}；统一视觉系统：背景沿用「${rec.scenes[0].motif}」母题；角色为第一视觉，UI 半透明轻量低干扰`;

/* ---------- 页提示词组装（豆包级长 prompt） ---------- */
const pagePrompt = (p) =>
  `一张高品质手机竖屏 APP UI 原型设计稿，${nameZh}${p.name}页面，${p.function}；布局：${p.layout.join("；")}；控件：${p.controls.map((k) => k.dc + "(" + k.kind + ")").join("、")}；${styleBaseline}；界面分层清晰，柔和阴影，精致图标，圆润字体，可直接用于产品原型评审，无水印`;

const pages = rec.pages.slice(0, +(V.pages || rec.pages.length)).map((p) => ({ ...p, prompt: pagePrompt(p) }));

/* ---------- 资产/图标/封面/视频 ---------- */
const assets = [
  ...characters.map((ch) => ({ id: "ast-" + ch.id, kind: "character", prompt: `${ch.prompt}；${styleWords}；半身立绘，干净背景，竖构 3:4`, w: 768, h: 1024 })),
  ...rec.scenes.map((sc, i) => ({ id: "ast-bg-" + i, kind: "background", prompt: `${sc.motif}；空景无人无字；${styleWords}；横构 4:3`, w: 1024, h: 768 })),
  ...pages.filter((p) => /地图|舞台|地块|全景|大世界/.test(p.name + p.function)).map((p) => ({ id: "ast-scene-" + p.id, kind: "scene", prompt: `${p.function}场景，${styleWords}，无人无 UI 纯场景`, w: 1024, h: 768 })),
];
const icon = { prompt: `圆角方形 app 图标，${characters[0] ? characters[0].prompt.split("，")[0] : nameZh}头部特写，${styleWords}，居中，纯色底取 palette[1]，光泽顶高光，无文字` };
const cover = { prompt: `3:2 横幅封面，${nameZh}：${characters.slice(0, 2).map((x) => x.prompt.split("，")[0]).join(" 与 ")}立于${rec.scenes[0].motif}前，${styleWords}，电影级构图，无文字无水印` };
const video_prompts = characters.slice(0, 2).map((ch) => `${styleWords}；${ch.prompt}；轻微头部微动+眨眼+呼吸感，循环短视频，人像居中特写，电影级运镜`);

/* ---------- flows（场景树/路径） ---------- */
const flows = pages.slice(1).map((p, i) => ({ from: pages[0].id, to: p.id, story: `${pages[0].name} → ${p.name}：${p.function}` }));
for (let i = 1; i < pages.length - 1; i++) flows.push({ from: pages[i].id, to: pages[i + 1].id, story: `${pages[i].name} → ${pages[i + 1].name} 主链路` });

/* ---------- tokens ---------- */
const tokens = {
  "--c-bg": rec.palette[0].split(" ")[0], "--c-primary": rec.palette[1].split(" ")[0], "--c-accent": rec.palette[2].split(" ")[0],
  "--c-warn": (rec.palette[3] || rec.palette[1]).split(" ")[0], "--c-ink": "#1c2b33", "--glass": "rgba(255,255,255,.6)",
  "--radius": "22px", "--blur": "14px", "--font-view": 'ui-rounded, -apple-system, "PingFang SC", "Segoe UI", sans-serif', "--w-view-max": "600",
};

/* ---------- 建议追问（auto 时仅公示不阻塞） ---------- */
const suggested = [];
if (!/风格|风|style|二次元|3d|国风|赛博/.test(c)) suggested.push("想要什么视觉风格？（二次元 2.5D / 疯狂动物城 3D / 国风 / 赛博 / 扁平）");
if (characters.length < 2 && /助理|陪伴|乐园|动物/.test(scenario)) suggested.push("需要几个角色/吉祥物？各自人设？");
if (!/页|page|屏/.test(c)) suggested.push("期望几个核心页面？（默认 " + pages.length + " 页骨架）");
if (!V.auto && suggested.length) console.log("建议追问（--auto 跳过）:\n- " + suggested.join("\n- "));

const brief = {
  schema: "design-clone/brief@2",
  concept: c, scenario, style_anchor: styleAnchor,
  identity: { name_zh: nameZh, name_en: nameEn, logline: `${nameZh}：${pages.map((p) => p.name).join("/")}——${styleAnchor} 质感可玩原型`, palette: rec.palette, tokens },
  style_baseline: { anchor: styleAnchor, words: styleBaseline },
  characters, pages, assets, icon, cover,
  tags: rec.tags, flows, scenes: rec.scenes, video_prompts,
  design_notes: ["角色/场景为第一视觉，UI 半透明轻量低干扰", "所有背景沿用同一母题保持世界观统一", "控件全接线：任何可点元素必须有可见反应（interact 门）"],
  suggested_questions: suggested,
  refs_dir: V.refs || null,
  provenance: { hints: V.hints || null, at: new Date().toISOString() },
};
const out = V.out || "knowledge/brief.json";
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(brief, null, 2));
console.log(JSON.stringify({ out, scenario, style_anchor: styleAnchor, name: nameZh, pages: pages.length, characters: characters.length, assets: assets.length, suggested: suggested.length }));
