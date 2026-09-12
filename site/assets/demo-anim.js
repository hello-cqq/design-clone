/* demo-anim.js v2 —— 四场景四步骤"真实场景感"矢量动画播放器
   每场景=可识别的产品 UI 模拟（微信/抖音/mac/浏览器）+ 光标点击涟漪/打字点/进度条/截帧闪/星点；
   纯 SVG+CSS（主题感知、双语字幕、replay），比 Lottie 更 crisp 可控。 */
(() => {
  const P = {
    dark: "#171c24", dark2: "#1f2630", line: "rgba(255,255,255,.14)", mut: "#8b95a3",
    light: "#f6f8fb", white: "#ffffff", ink: "#2b3440",
    acc: "#ff8a5c", acc2: "#6fd3b2", acc3: "#7fb7ef", green: "#3fca6b", red: "#ff5b6b", yellow: "#ffd166",
  };

  const cursor = (x, y, cls = "") => `<g class="${cls}"><circle cx="${x}" cy="${y}" r="4" fill="#fff" stroke="#2b3440" stroke-width="1.4"/><circle class="ripple" cx="${x}" cy="${y}" r="6" fill="none" stroke="${P.acc}" stroke-width="2"/></g>`;
  const rippleCss = true; void rippleCss;

  const badge = (x, y) => `
    <g class="s4" transform="translate(${x},${y})">
      <rect x="-46" y="-14" width="92" height="26" rx="13" fill="${P.acc2}"/>
      <text x="0" y="3" text-anchor="middle" font-size="10" font-weight="600" fill="#08331f">playable ✓</text>
      <g class="spark"><path d="M-58 -18 l3 6 6 3 -6 3 -3 6 -3 -6 -6 -3 6 -3 z" fill="${P.yellow}"/></g>
      <g class="spark2"><path d="M56 -20 l2.5 5 5 2.5 -5 2.5 -2.5 5 -2.5 -5 -5 -2.5 5 -2.5 z" fill="${P.yellow}"/></g>
    </g>`;

  const agentWin = (x, y, link) => `
    <g class="s3" transform="translate(${x},${y})">
      <rect width="190" height="96" rx="12" fill="${P.dark}" stroke="${P.line}"/>
      <rect width="190" height="22" rx="12" fill="rgba(255,255,255,.06)"/>
      <circle cx="12" cy="11" r="3" fill="${P.red}"/><circle cx="22" cy="11" r="3" fill="${P.yellow}"/><circle cx="32" cy="11" r="3" fill="${P.green}"/>
      <text x="95" y="15" text-anchor="middle" font-size="8" fill="${P.mut}">agent · design-clone</text>
      <rect x="10" y="30" width="120" height="16" rx="8" fill="rgba(127,183,239,.16)" stroke="rgba(127,183,239,.5)"/>
      <text x="18" y="41" font-size="7.5" fill="${P.acc3}">${link}</text>
      <g class="typing"><circle cx="18" cy="58" r="2.4" fill="${P.mut}"/><circle cx="26" cy="58" r="2.4" fill="${P.mut}"/><circle cx="34" cy="58" r="2.4" fill="${P.mut}"/></g>
      <rect x="10" y="70" width="170" height="7" rx="3.5" fill="rgba(255,255,255,.1)"/>
      <rect class="prog" x="10" y="70" width="40" height="7" rx="3.5" fill="${P.acc2}"/>
      <text x="10" y="89" font-size="7" fill="${P.mut}">capture → spec → views → gates</text>
    </g>`;

  const SCENES = {
    mobile: {
      steps: [
        ["Phone app runs — chat list scrolls, tokens observed", "手机 App 运行——会话列表滚动，采集 tokens"],
        ["adb/scrcpy mirror captures each screen (frame flash)", "adb/scrcpy 镜像逐屏捕获（截帧闪光）"],
        ["Frames + UI tree feed the agent generator", "帧 + UI 树喂给 agent 生成器"],
        ["Playable prototype assembled — gates green", "可玩原型组装完成——门禁全绿"],
      ],
      svg: `
      <g class="s1" transform="translate(40,30)">
        <rect width="120" height="230" rx="20" fill="${P.dark}"/>
        <rect x="5" y="5" width="110" height="220" rx="16" fill="${P.white}"/>
        <rect x="44" y="10" width="32" height="6" rx="3" fill="${P.dark}"/>
        <rect x="5" y="20" width="110" height="14" rx="7" fill="#07c160" opacity=".92"/>
        <text x="60" y="29.5" text-anchor="middle" font-size="6.5" fill="#fff" font-weight="600">微信</text>
        <rect x="12" y="40" width="60" height="9" rx="4" fill="${P.ink}" opacity=".85"/>
        <g class="scrollfeed">
          <g transform="translate(12,44)"><circle cx="10" cy="10" r="10" fill="${P.acc2}"/><rect x="26" y="3" width="60" height="6" rx="3" fill="${P.ink}" opacity=".7"/><rect x="26" y="13" width="70" height="5" rx="2.5" fill="${P.mut}" opacity=".5"/></g>
          <g transform="translate(12,72)"><circle cx="10" cy="10" r="10" fill="${P.acc3}"/><rect x="26" y="3" width="52" height="6" rx="3" fill="${P.ink}" opacity=".7"/><rect x="26" y="13" width="66" height="5" rx="2.5" fill="${P.mut}" opacity=".5"/></g>
          <g transform="translate(12,100)"><circle cx="10" cy="10" r="10" fill="${P.yellow}"/><rect x="26" y="3" width="58" height="6" rx="3" fill="${P.ink}" opacity=".7"/><rect x="26" y="13" width="62" height="5" rx="2.5" fill="${P.mut}" opacity=".5"/></g>
          <g transform="translate(12,128)"><circle cx="10" cy="10" r="10" fill="${P.acc}"/><rect x="26" y="3" width="48" height="6" rx="3" fill="${P.ink}" opacity=".7"/><rect x="26" y="13" width="70" height="5" rx="2.5" fill="${P.mut}" opacity=".5"/></g>
          <g transform="translate(12,156)"><circle cx="10" cy="10" r="10" fill="#c9b6f2"/><rect x="26" y="3" width="56" height="6" rx="3" fill="${P.ink}" opacity=".7"/><rect x="26" y="13" width="64" height="5" rx="2.5" fill="${P.mut}" opacity=".5"/></g>
        </g>
        <g transform="translate(5,209)"><rect width="110" height="16" rx="8" fill="#f6f7f9"/>
          <g fill="${P.mut}" opacity=".8"><circle cx="16" cy="7" r="3.4"/><circle cx="40" cy="7" r="3.4"/><circle cx="64" cy="7" r="3.4"/><circle cx="88" cy="7" r="3.4"/></g>
          <circle cx="16" cy="7" r="3.4" fill="#07c160"/>
          <g font-size="4.6" fill="${P.mut}" text-anchor="middle"><text x="16" y="13.6">聊天</text><text x="40" y="13.6">通讯录</text><text x="64" y="13.6">发现</text><text x="88" y="13.6">我</text></g></g>
      </g>
      <g class="s2" transform="translate(190,40)">
        <rect width="150" height="150" rx="12" fill="${P.dark}" stroke="${P.line}"/>
        <rect width="150" height="20" rx="12" fill="rgba(255,255,255,.06)"/>
        <circle cx="11" cy="10" r="3" fill="${P.red}"/><circle cx="20" cy="10" r="3" fill="${P.yellow}"/><circle cx="29" cy="10" r="3" fill="${P.green}"/>
        <text x="75" y="13.5" text-anchor="middle" font-size="7.5" fill="${P.mut}">scrcpy · mirror</text>
        <rect x="45" y="28" width="60" height="104" rx="10" fill="${P.white}"/>
        <rect x="51" y="36" width="48" height="8" rx="4" fill="${P.acc}" opacity=".8"/>
        <rect x="51" y="50" width="48" height="26" rx="5" fill="${P.light}"/>
        <rect x="51" y="80" width="48" height="26" rx="5" fill="${P.light}"/>
        <rect class="flash" x="45" y="28" width="60" height="104" rx="10" fill="#fff"/>
        <text class="framecount" x="75" y="143" text-anchor="middle" font-size="7" fill="${P.mut}">frame 12 / 48</text>
      </g>
      ${agentWin(250, 150, "views:5 · tokens:38 · journeys:3")}
      <g class="s4" transform="translate(370,40)">
        <rect width="90" height="170" rx="16" fill="${P.dark}"/>
        <rect x="4" y="4" width="82" height="162" rx="13" fill="${P.white}"/>
        <rect x="12" y="16" width="44" height="8" rx="4" fill="${P.acc}"/>
        <rect x="12" y="32" width="66" height="30" rx="7" fill="${P.light}"/>
        <rect x="12" y="68" width="66" height="30" rx="7" fill="${P.light}"/>
        <rect x="12" y="104" width="40" height="14" rx="7" fill="${P.acc2}"/>
      </g>
      ${badge(415, 235)}`,
    },
    link: {
      steps: [
        ["Scroll the Douyin feed — like, comment, share rail", "刷抖音视频流——点赞/评论/分享侧栏"],
        ["Share sheet → tap “copy link”", "分享面板 → 点“复制链接”"],
        ["Paste into agent — it parses frames & notes", "粘贴进 agent——解析帧与图文"],
        ["Note rebuilt as a playable prototype", "笔记重建为可玩原型"],
      ],
      svg: `
      <g class="s1" transform="translate(40,26)">
        <rect width="118" height="236" rx="20" fill="${P.dark}"/>
        <rect x="5" y="5" width="108" height="226" rx="16" fill="#101418"/>
        <g class="scrollfeed">
          <rect x="5" y="10" width="108" height="210" rx="12" fill="url(#vid1)"/>
          <rect x="5" y="226" width="108" height="210" rx="12" fill="url(#vid2)"/>
        </g>
        <text x="36" y="16" font-size="6.5" fill="rgba(255,255,255,.55)">关注</text>
        <text x="60" y="16" font-size="6.5" fill="#fff" font-weight="600">推荐</text>
        <rect x="58" y="18" width="14" height="1.6" rx=".8" fill="#fff"/>
        <g transform="translate(92,120)" fill="#fff">
          <g><path d="M6 0 C9 0 11 2.4 11 5 C11 8 6 12 6 12 C6 12 1 8 1 5 C1 2.4 3 0 6 0z" fill="${P.red}"/><text x="6" y="20" text-anchor="middle" font-size="6" fill="#fff">1.2w</text></g>
          <g transform="translate(0,30)"><path d="M1 1h10v7H4l-3 3z" fill="#fff"/><text x="6" y="18" text-anchor="middle" font-size="6" fill="#fff">863</text></g>
          <g transform="translate(0,60)"><path d="M6 1 L11 6 L6 11 L1 6z" fill="#fff"/><text x="6" y="18" text-anchor="middle" font-size="6" fill="#fff">share</text></g>
        </g>
        <rect x="12" y="188" width="70" height="6" rx="3" fill="rgba(255,255,255,.85)"/>
        <rect x="12" y="198" width="52" height="5" rx="2.5" fill="rgba(255,255,255,.5)"/>
        <g transform="translate(5,214)"><rect width="108" height="17" rx="8" fill="rgba(0,0,0,.55)"/>
          <g fill="rgba(255,255,255,.75)"><circle cx="14" cy="7" r="3.2"/><circle cx="38" cy="7" r="3.2"/><circle cx="62" cy="7" r="3.2"/><circle cx="86" cy="7" r="3.2"/></g>
          <circle cx="38" cy="7" r="3.2" fill="#fff"/>
          <g font-size="4.4" fill="rgba(255,255,255,.7)" text-anchor="middle"><text x="14" y="14">首页</text><text x="38" y="14">朋友</text><text x="62" y="14">拍摄</text><text x="86" y="14">消息</text></g></g>
      </g>
      <g class="s2" transform="translate(40,150)">
        <rect x="5" y="40" width="108" height="92" rx="14" fill="rgba(255,255,255,.97)"/>
        <text x="16" y="58" font-size="7.5" fill="${P.ink}">分享到</text>
        <g transform="translate(14,66)"><circle cx="8" cy="8" r="8" fill="${P.green}"/><circle cx="28" cy="8" r="8" fill="${P.acc3}"/><circle cx="48" cy="8" r="8" fill="${P.yellow}"/><circle cx="68" cy="8" r="8" fill="${P.mut}"/></g>
        <rect x="14" y="88" width="90" height="14" rx="7" fill="${P.light}"/>
        <rect x="14" y="106" width="90" height="16" rx="8" fill="#fff" stroke="${P.acc}" stroke-width="1.6"/>
        <text x="24" y="117" font-size="7.5" fill="${P.acc}" font-weight="600">复制链接</text>
        ${cursor(88, 114, "tapcursor")}
      </g>
      <g class="s3"><path class="flylink" d="M150 262 q60 -40 120 -30" stroke="${P.acc}" stroke-width="1.8" fill="none" stroke-dasharray="5 4"/></g>
      ${agentWin(250, 150, "https://v.douyin.com/iRnB4k/ …")}
      <g class="s4" transform="translate(372,40)">
        <rect width="92" height="176" rx="16" fill="${P.dark}"/>
        <rect x="4" y="4" width="84" height="168" rx="13" fill="${P.white}"/>
        <rect x="10" y="14" width="72" height="60" rx="8" fill="url(#vid1)"/>
        <rect x="10" y="80" width="60" height="7" rx="3.5" fill="${P.ink}" opacity=".8"/>
        <rect x="10" y="92" width="72" height="5" rx="2.5" fill="${P.mut}" opacity=".6"/>
        <g transform="translate(10,104)" fill="${P.mut}" font-size="6"><text x="0" y="6">♥ 2.4w</text><text x="26" y="6">💬 863</text><text x="52" y="6">★ 5121</text></g>
        <rect x="10" y="118" width="72" height="26" rx="6" fill="${P.light}"/>
      </g>
      ${badge(418, 240)}
      <defs>
        <linearGradient id="vid1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#31435c"/><stop offset="1" stop-color="#7a4a3a"/></linearGradient>
        <linearGradient id="vid2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2c3a2e"/><stop offset="1" stop-color="#4c6a86"/></linearGradient>
      </defs>`,
    },
    desktop: {
      steps: [
        ["Desktop app operates — sidebar, panels, clicks", "桌面应用操作——侧栏、面板、点击"],
        ["Screen capture snapshots each state (flash)", "屏幕捕获逐状态快照（闪光）"],
        ["Tokens & layout extracted from computed styles", "从 computed 样式抽取 tokens 与布局"],
        ["Desktop-faithful prototype assembled", "组装桌面保真原型"],
      ],
      svg: `
      <g class="s1" transform="translate(36,36)">
        <rect x="-6" y="-12" width="212" height="9" rx="4.5" fill="rgba(120,130,145,.35)"/>
        <circle cx="2" cy="-7.5" r="2.6" fill="rgba(255,255,255,.85)"/>
        <g font-size="5" fill="rgba(255,255,255,.85)"><text x="10" y="-5.6">Finder</text><text x="26" y="-5.6">文件</text><text x="38" y="-5.6">编辑</text><text x="50" y="-5.6">显示</text></g>
        <rect width="200" height="140" rx="12" fill="${P.white}" stroke="rgba(0,0,0,.12)"/>
        <rect width="200" height="20" rx="12" fill="#eceff3"/>
        <circle cx="12" cy="10" r="3" fill="${P.red}"/><circle cx="22" cy="10" r="3" fill="${P.yellow}"/><circle cx="32" cy="10" r="3" fill="${P.green}"/>
        <rect x="8" y="26" width="42" height="106" rx="8" fill="#f2f4f7"/>
        <rect x="14" y="34" width="30" height="7" rx="3.5" fill="${P.acc3}"/>
        <rect x="14" y="47" width="26" height="6" rx="3" fill="${P.mut}" opacity=".5"/>
        <rect x="14" y="59" width="28" height="6" rx="3" fill="${P.mut}" opacity=".5"/>
        <rect x="58" y="26" width="80" height="106" rx="8" fill="#fafbfc"/>
        <rect x="66" y="34" width="56" height="8" rx="4" fill="${P.ink}" opacity=".8"/>
        <rect x="66" y="50" width="64" height="24" rx="6" fill="${P.light}"/>
        <rect x="66" y="80" width="64" height="24" rx="6" fill="${P.light}"/>
        <rect x="146" y="26" width="46" height="106" rx="8" fill="#f7f8fa"/>
        <g transform="translate(52,146)"><rect width="96" height="13" rx="6.5" fill="rgba(120,130,145,.3)"/>
          <g><circle cx="12" cy="6.5" r="4" fill="${P.acc3}"/><circle cx="28" cy="6.5" r="4" fill="${P.acc2}"/><circle cx="44" cy="6.5" r="4" fill="${P.acc}"/><circle cx="60" cy="6.5" r="4" fill="#c9b6f2"/><circle cx="76" cy="6.5" r="4" fill="${P.yellow}"/><rect x="86" y="2.5" width="1.4" height="8" rx=".7" fill="rgba(255,255,255,.5)"/></g></g>
        ${cursor(96, 62, "tapcursor")}
      </g>
      <g class="s2" transform="translate(250,30)">
        <rect width="120" height="76" rx="10" fill="${P.dark}" stroke="${P.line}"/>
        <text x="60" y="14" text-anchor="middle" font-size="7.5" fill="${P.mut}">capture · states</text>
        <g><rect class="flashseq" x="8" y="22" width="32" height="22" rx="5" fill="rgba(255,255,255,.16)"/>
        <rect class="flashseq2" x="44" y="22" width="32" height="22" rx="5" fill="rgba(255,255,255,.16)"/>
        <rect class="flashseq3" x="80" y="22" width="32" height="22" rx="5" fill="rgba(255,255,255,.16)"/>
        <rect class="flashseq" x="8" y="48" width="32" height="22" rx="5" fill="rgba(255,255,255,.16)"/>
        <rect class="flashseq2" x="44" y="48" width="32" height="22" rx="5" fill="rgba(255,255,255,.16)"/>
        <rect class="flashseq3" x="80" y="48" width="32" height="22" rx="5" fill="rgba(255,255,255,.16)"/></g>
      </g>
      <g class="s3" transform="translate(250,120)">
        <rect width="120" height="76" rx="10" fill="${P.dark}" stroke="${P.line}"/>
        <text x="60" y="14" text-anchor="middle" font-size="7.5" fill="${P.mut}">tokens.css</text>
        <circle cx="18" cy="30" r="7" fill="${P.acc}"/><circle cx="36" cy="30" r="7" fill="${P.acc2}"/><circle cx="54" cy="30" r="7" fill="${P.acc3}"/><circle cx="72" cy="30" r="7" fill="#c9b6f2"/><circle cx="90" cy="30" r="7" fill="${P.yellow}"/>
        <rect x="10" y="44" width="100" height="6" rx="3" fill="rgba(255,255,255,.22)"/>
        <rect x="10" y="54" width="76" height="5" rx="2.5" fill="rgba(255,255,255,.15)"/>
        <rect x="10" y="63" width="52" height="4" rx="2" fill="rgba(255,255,255,.1)"/>
      </g>
      ${agentWin(250, 208, "states:14 · tokens:52 · layout:3-col")}
      <g class="s4" transform="translate(390,40)">
        <rect width="120" height="150" rx="12" fill="${P.white}" stroke="rgba(0,0,0,.14)"/>
        <rect width="120" height="18" rx="12" fill="#eceff3"/>
        <circle cx="10" cy="9" r="2.6" fill="${P.red}"/><circle cx="18" cy="9" r="2.6" fill="${P.yellow}"/><circle cx="26" cy="9" r="2.6" fill="${P.green}"/>
        <rect x="6" y="24" width="26" height="118" rx="6" fill="#f2f4f7"/>
        <rect x="36" y="24" width="52" height="118" rx="6" fill="#fafbfc"/>
        <rect x="92" y="24" width="22" height="118" rx="6" fill="#f7f8fa"/>
        <rect x="42" y="32" width="34" height="7" rx="3.5" fill="${P.acc}"/>
      </g>
      ${badge(450, 216)}`,
    },
    web: {
      steps: [
        ["Type the URL — crawl starts", "输入网址——开始爬取"],
        ["Page graph grows: nav + content edges", "页面图生长：导航 + 内容边"],
        ["Every page rebuilt as a view", "每页重建为视图"],
        ["Whole-site prototype, playable offline", "整站原型，离线可玩"],
      ],
      svg: `
      <g class="s1" transform="translate(36,40)">
        <rect width="190" height="120" rx="12" fill="${P.white}" stroke="rgba(0,0,0,.12)"/>
        <rect width="190" height="22" rx="12" fill="#eceff3"/>
        <circle cx="12" cy="11" r="3" fill="${P.red}"/><circle cx="22" cy="11" r="3" fill="${P.yellow}"/><circle cx="32" cy="11" r="3" fill="${P.green}"/>
        <rect x="44" y="5" width="104" height="12" rx="6" fill="#fff"/>
        <rect x="152" y="5" width="26" height="12" rx="6" fill="rgba(0,0,0,.07)"/>
        <text x="165" y="13.5" text-anchor="middle" font-size="7" fill="${P.mut}">+</text>
        <rect class="urltype" x="48" y="8" width="20" height="6" rx="3" fill="${P.acc3}"/>
        <text x="50" y="13.5" font-size="6.5" fill="${P.ink}" opacity=".75">https://example.com</text>
        <rect x="10" y="30" width="170" height="34" rx="8" fill="url(#heroG)"/>
        <rect x="20" y="40" width="70" height="8" rx="4" fill="#fff" opacity=".9"/>
        <rect x="20" y="52" width="40" height="9" rx="4.5" fill="${P.acc}"/>
        <rect x="10" y="70" width="52" height="40" rx="7" fill="${P.light}"/>
        <rect x="68" y="70" width="52" height="40" rx="7" fill="${P.light}"/>
        <rect x="126" y="70" width="52" height="40" rx="7" fill="${P.light}"/>
        ${cursor(150, 11, "tapcursor")}
      </g>
      <g class="s2" transform="translate(250,40)">
        <g stroke="${P.acc2}" stroke-width="1.4" fill="none">
          <path class="draw" d="M20 20 q26 2 44 -8"/><path class="draw2" d="M20 24 q26 8 44 16"/><path class="draw3" d="M20 30 q30 24 50 40"/>
        </g>
        <circle cx="16" cy="24" r="8" fill="${P.dark}" stroke="${P.acc3}" stroke-width="1.6"/>
        <circle class="pop1" cx="68" cy="10" r="6.5" fill="${P.dark}" stroke="${P.acc2}" stroke-width="1.4"/>
        <circle class="pop2" cx="68" cy="40" r="6.5" fill="${P.dark}" stroke="${P.acc2}" stroke-width="1.4"/>
        <circle class="pop3" cx="74" cy="72" r="6.5" fill="${P.dark}" stroke="${P.acc2}" stroke-width="1.4"/>
        <text x="16" y="44" text-anchor="middle" font-size="6.5" fill="${P.mut}">01</text>
        <text x="86" y="12" font-size="6.5" fill="${P.mut}">02</text><text x="86" y="42" font-size="6.5" fill="${P.mut}">03</text><text x="92" y="74" font-size="6.5" fill="${P.mut}">04</text>
      </g>
      <g class="s3" transform="translate(250,140)">
        <g class="fan">
          <rect x="0" y="8" width="44" height="32" rx="6" fill="${P.white}" stroke="rgba(0,0,0,.14)" transform="rotate(-8 22 24)"/>
          <rect x="34" y="2" width="44" height="32" rx="6" fill="${P.white}" stroke="rgba(0,0,0,.14)" transform="rotate(-2 56 18)"/>
          <rect x="68" y="6" width="44" height="32" rx="6" fill="${P.white}" stroke="rgba(0,0,0,.14)" transform="rotate(6 90 22)"/>
        </g>
        <text x="56" y="56" text-anchor="middle" font-size="7" fill="${P.mut}">views ×7</text>
      </g>
      ${agentWin(250, 208, "pages:7 · edges:21 · shell:c_browser")}
      <g class="s4" transform="translate(390,44)">
        <rect width="126" height="140" rx="12" fill="${P.white}" stroke="rgba(0,0,0,.14)"/>
        <rect width="126" height="18" rx="12" fill="#eceff3"/>
        <circle cx="10" cy="9" r="2.6" fill="${P.red}"/><circle cx="18" cy="9" r="2.6" fill="${P.yellow}"/><circle cx="26" cy="9" r="2.6" fill="${P.green}"/>
        <rect x="8" y="26" width="110" height="30" rx="7" fill="url(#heroG)"/>
        <rect x="14" y="34" width="46" height="6" rx="3" fill="#fff" opacity=".9"/>
        <rect x="8" y="62" width="34" height="30" rx="6" fill="${P.light}"/>
        <rect x="46" y="62" width="34" height="30" rx="6" fill="${P.light}"/>
        <rect x="84" y="62" width="34" height="30" rx="6" fill="${P.light}"/>
        <rect x="8" y="98" width="110" height="10" rx="5" fill="${P.light}"/>
      </g>
      ${badge(452, 210)}
      <defs><linearGradient id="heroG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${P.acc3}"/><stop offset="1" stop-color="#c9b6f2"/></linearGradient></defs>`,
    },
  };

  function mount(el, sceneKey) {
    const sc = SCENES[sceneKey];
    el.innerHTML = `
      <div class="cap"><span class="captxt"></span>
        <span class="steps">${[1, 2, 3, 4].map((n) => `<b data-s="${n}">${n}</b>`).join("")}</span>
        <button class="replay">replay</button></div>
      <div class="svgbox"><svg viewBox="0 0 520 290" data-step="1">${sc.svg}</svg></div>`;
    const svgEl = el.querySelector("svg");
    const cap = el.querySelector(".captxt");
    const dots = [...el.querySelectorAll(".steps b")];
    const lang = () => (document.documentElement.lang === "zh-CN" ? 1 : 0);
    let step = 1, timer = null;
    const paint = () => {
      svgEl.setAttribute("data-step", step);
      cap.textContent = `${step}/4 · ${sc.steps[step - 1][lang()]}`;
      dots.forEach((d, i) => { d.classList.toggle("on", i + 1 === step); d.classList.toggle("done", i + 1 < step); });
    };
    const play = () => {
      clearInterval(timer);
      step = 1; paint();
      timer = setInterval(() => { if (step < 4) { step++; paint(); } else clearInterval(timer); }, 2400);
    };
    dots.forEach((d) => (d.onclick = () => { clearInterval(timer); step = +d.dataset.s; paint(); timer = setInterval(() => { if (step < 4) { step++; paint(); } else clearInterval(timer); }, 2400); }));
    el.querySelector(".replay").onclick = play;
    el._replayLang = () => paint();
    play();
    return el;
  }
  window.DCAnim = { mount, scenes: Object.keys(SCENES) };
})();
