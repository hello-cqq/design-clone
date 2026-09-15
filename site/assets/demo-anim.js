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

  /* M81-W2: 可辨认迷你 UI 引导动画——每场景=品牌色板+真实微文案的矢量迷你界面（借 enrich/brief 经验） */
  const glow = `
    <ellipse cx="260" cy="150" rx="252" ry="142" fill="var(--bg2)" opacity=".7"/>
    <circle cx="90" cy="70" r="60" fill="var(--acc)" opacity=".07"/>
    <circle cx="440" cy="220" r="70" fill="var(--acc2)" opacity=".08"/>`;
  const T = (x, y, str, size, fill, anchor, weight) => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}"${anchor ? ` text-anchor="${anchor}"` : ""}${weight ? ` font-weight="${weight}"` : ""} font-family="ui-rounded,-apple-system,'PingFang SC',sans-serif">${str}</text>`;
  const dev = {
    mobile: `
      <rect x="52" y="26" width="132" height="238" rx="20" fill="var(--card)" stroke="var(--line)"/>
      <rect x="60" y="38" width="116" height="214" rx="12" fill="#ededed"/>
      <rect x="60" y="38" width="116" height="20" rx="10" fill="#07c160"/>
      ${T(118, 51, "微信(38)", 8, "#ffffff", "middle", 600)}
      <circle cx="166" cy="48" r="4" fill="none" stroke="#fff" stroke-width="1.2"/>
      ${[[68, "#8ea6c9", "小兰", "票拿到了吗？", "10:26", 0], [68, "#07c160", "文件传输助手", "图片已收到", "10:12", 0], [68, "#b78ae8", "项目组", "周会改到三点", "09:48", 1], [68, "#4a9be0", "公众号", "新一期推送上线", "08:30", 0]].map((r, i) => `
        <rect x="60" y="${62 + i * 34}" width="116" height="34" fill="#f6f6f6"/>
        <circle cx="72" cy="${79 + i * 34}" r="8" fill="${r[1]}"/>
        ${T(84, 76 + i * 34, r[2], 7, "#2b3440", "", 600)}
        ${T(84, 86 + i * 34, r[3], 5.6, "#9aa3ad")}
        ${T(172, 76 + i * 34, r[4], 5.4, "#b3bac2", "end")}
        ${r[5] ? `<circle cx="170" cy="${84 + i * 34}" r="3.4" fill="#fa5151"/>${T(170, 86 + i * 34, "1", 4.6, "#fff", "middle")}` : ""}`).join("")}
      <rect x="60" y="232" width="116" height="20" rx="10" fill="#f6f6f6"/>
      <g fill="#07c160"><circle cx="80" cy="242" r="4"/><circle cx="106" cy="242" r="4" opacity=".35"/><circle cx="132" cy="242" r="4" opacity=".35"/><circle cx="158" cy="242" r="4" opacity=".35"/></g>`,
    link: `
      <rect x="52" y="26" width="132" height="238" rx="20" fill="#161823" stroke="var(--line)"/>
      <circle cx="72" cy="48" r="9" fill="#e8b04b"/>
      ${T(86, 46, "沫沫的调色盘", 7, "#ffffff", "", 600)}
      ${T(86, 55, "抖音号: momomo_palette", 5.2, "#8b93a0")}
      <rect x="146" y="40" width="30" height="13" rx="6.5" fill="#fe2c55"/>
      ${T(161, 49, "关注", 6, "#ffffff", "middle", 600)}
      ${T(64, 82, "中午好,", 9, "#ffffff", "", 600)}
      ${T(64, 95, "Serenaqng", 9, "#ffffff", "", 600)}
      <circle cx="150" cy="102" r="12" fill="none" stroke="#ffffff" stroke-width="1.4" opacity=".7"/>
      <circle cx="96" cy="126" r="7" fill="#f4f4f4"/><circle cx="120" cy="126" r="7" fill="#f4f4f4"/>
      <rect x="62" y="146" width="112" height="76" rx="10" fill="#ffffff"/>
      ${T(70, 160, "今日健康分", 6, "#5b4636")}
      ${T(70, 178, "100%", 13, "#3d2c1e", "", 700)}
      ${T(70, 190, "正常", 6, "#2f9e63", "", 600)}
      <circle cx="146" cy="180" r="20" fill="#f7f3ee"/>
      <circle cx="146" cy="176" r="9" fill="#ffffff"/><circle cx="143" cy="174" r="1.6" fill="#2b2b2b"/><circle cx="149" cy="174" r="1.6" fill="#2b2b2b"/>
      <rect x="70" y="198" width="44" height="14" rx="7" fill="#7a4a2b"/>
      ${T(92, 207.5, "和我聊聊", 6, "#ffffff", "middle", 600)}
      ${T(64, 244, "◦ 原创声线 · 沫沫的调色盘", 5.2, "#8b93a0")} `,
    desktop: `
      <rect x="40" y="46" width="200" height="150" rx="12" fill="var(--card)" stroke="var(--line)"/>
      <rect x="40" y="46" width="200" height="20" rx="12" fill="var(--bg2)"/>
      <circle cx="54" cy="56" r="3.2" fill="#ff5f57"/><circle cx="65" cy="56" r="3.2" fill="#febc2e"/><circle cx="76" cy="56" r="3.2" fill="#28c840"/>
      ${T(140, 59, "飞书文档 · 产品周报", 6.6, "var(--mut)", "middle")}
      <rect x="48" y="72" width="46" height="116" rx="8" fill="#eef4ff"/>
      <rect x="54" y="80" width="34" height="6" rx="3" fill="#3370ff"/>
      <rect x="54" y="92" width="28" height="5" rx="2.5" fill="#9db9f5"/>
      <rect x="54" y="102" width="32" height="5" rx="2.5" fill="#9db9f5"/>
      <rect x="54" y="112" width="24" height="5" rx="2.5" fill="#9db9f5"/>
      ${T(104, 86, "产品周报 · 第 32 期", 8.4, "var(--ink)", "", 700)}
      <rect x="104" y="94" width="120" height="5" rx="2.5" fill="var(--mut)" opacity=".4"/>
      <rect x="104" y="104" width="104" height="5" rx="2.5" fill="var(--mut)" opacity=".4"/>
      <rect x="104" y="114" width="112" height="5" rx="2.5" fill="var(--mut)" opacity=".4"/>
      <rect x="104" y="128" width="86" height="18" rx="6" fill="#e8f2ff" stroke="#3370ff" stroke-opacity=".5"/>
      ${T(110, 139, "@设计组 补交互说明", 5.8, "#2456c4")}
      <rect x="104" y="152" width="120" height="28" rx="6" fill="var(--bg2)"/>
      <rect x="110" y="158" width="40" height="5" rx="2.5" fill="var(--mut)" opacity=".5"/>
      <rect x="110" y="168" width="70" height="5" rx="2.5" fill="var(--mut)" opacity=".35"/>`,
    web: `
      <rect x="40" y="40" width="200" height="160" rx="12" fill="var(--card)" stroke="var(--line)"/>
      <rect x="40" y="40" width="200" height="22" rx="12" fill="var(--bg2)"/>
      <rect x="48" y="45" width="64" height="13" rx="6.5" fill="var(--card)" stroke="var(--line)"/>
      ${T(80, 54, "阿里云控制台", 6, "var(--ink)", "middle", 600)}
      <rect x="116" y="45" width="52" height="13" rx="6.5" fill="transparent"/>
      ${T(142, 54, "监控大盘", 6, "var(--mut)", "middle")}
      <rect x="48" y="68" width="184" height="10" rx="5" fill="var(--bg2)"/>
      ${T(54, 75.5, "ecs.console.aliyun.com", 5.4, "var(--mut)")}
      <rect x="48" y="84" width="40" height="108" rx="6" fill="var(--bg2)"/>
      <rect x="54" y="92" width="28" height="5" rx="2.5" fill="#ff6a00"/>
      <rect x="54" y="102" width="24" height="5" rx="2.5" fill="var(--mut)" opacity=".45"/>
      <rect x="54" y="112" width="26" height="5" rx="2.5" fill="var(--mut)" opacity=".45"/>
      <rect x="94" y="84" width="138" height="14" rx="4" fill="var(--bg2)"/>
      ${T(100, 93.5, "实例", 5.6, "var(--mut)", "", 600)}${T(150, 93.5, "状态", 5.6, "var(--mut)", "", 600)}${T(200, 93.5, "地域", 5.6, "var(--mut)", "", 600)}
      ${[0, 1, 2].map((i) => `
        <rect x="94" y="${100 + i * 18}" width="138" height="16" rx="4" fill="transparent" stroke="var(--line)" stroke-opacity=".6"/>
        ${T(100, 110 + i * 18, "web-0" + (i + 1), 5.6, "var(--ink)")}
        <circle cx="152" cy="${108 + i * 18}" r="2.6" fill="#2f9e63"/>${T(158, 110 + i * 18, "运行中", 5.6, "#2f9e63")}
        ${T(200, 110 + i * 18, "杭州", 5.6, "var(--mut)")}`).join("")}`,
  };
  const beam = (x, y) => `
    <g class="s2">
      <rect class="scanline" x="${x}" y="${y}" width="116" height="4" rx="2" fill="var(--acc)" opacity=".85"/>
      <g class="fly"><rect x="${x + 128}" y="${y + 8}" width="26" height="34" rx="6" fill="var(--card)" stroke="var(--acc)"/><rect x="${x + 132}" y="${y + 14}" width="18" height="3" rx="1.5" fill="var(--mut)" opacity=".5"/><rect x="${x + 132}" y="${y + 20}" width="14" height="3" rx="1.5" fill="var(--mut)" opacity=".35"/></g>
      <g class="fly" style="animation-delay:.5s"><rect x="${x + 150}" y="${y + 44}" width="26" height="34" rx="6" fill="var(--card)" stroke="var(--acc)"/><circle cx="${x + 163}" cy="${y + 56}" r="5" fill="var(--acc2)" opacity=".5"/><rect x="${x + 154}" y="${y + 66}" width="18" height="3" rx="1.5" fill="var(--mut)" opacity=".4"/></g>
    </g>`;
  const SPEC = {
    mobile: { pal: ["#07c160", "#ededed", "#fa5151", "#2b3440"], pages: ["会话", "聊天", "发现", "我的"], rule: "圆角 22 · 软阴影 · 列表行高 56", glyph: "phone" },
    link: { pal: ["#161823", "#fe2c55", "#ffffff", "#e8b04b"], pages: ["笔记", "评论", "作者"], rule: "沉浸暗 · 图文 3:4 · 关注粉 #fe2c55", glyph: "cols" },
    desktop: { pal: ["#3370ff", "#eef4ff", "#28c840", "#2b3440"], pages: ["文档", "评论", "知识库"], rule: "侧栏 240 · 行高 1.8 · 评论蓝 #3370ff", glyph: "win" },
    web: { pal: ["#ff6a00", "#f5f5f6", "#2f9e63", "#2b3440"], pages: ["概览", "实例", "监控"], rule: "行高 48 · 状态色语义 · 主橙 #ff6a00", glyph: "table" },
  };
  const GLYPH = {
    phone: `<rect x="0" y="0" width="10" height="16" rx="3" fill="none" stroke="var(--mut)" stroke-width="1.2"/><rect x="2" y="3" width="6" height="8" rx="1" fill="var(--mut)" opacity=".4"/>`,
    cols: `<rect x="0" y="0" width="7" height="16" rx="2" fill="none" stroke="var(--mut)" stroke-width="1.2"/><rect x="9" y="0" width="7" height="16" rx="2" fill="none" stroke="var(--mut)" stroke-width="1.2"/><rect x="1.5" y="3" width="4" height="5" rx="1" fill="var(--mut)" opacity=".4"/>`,
    win: `<rect x="0" y="0" width="16" height="12" rx="2.5" fill="none" stroke="var(--mut)" stroke-width="1.2"/><rect x="0" y="0" width="16" height="3.5" rx="1.7" fill="var(--mut)" opacity=".4"/>`,
    table: `<rect x="0" y="0" width="16" height="12" rx="2" fill="none" stroke="var(--mut)" stroke-width="1.2"/><rect x="0" y="3.5" width="16" height="1" fill="var(--mut)" opacity=".5"/><rect x="5" y="0" width="1" height="12" fill="var(--mut)" opacity=".5"/>`,
  };
  const agent = (kind) => `
    <g class="s3 spec">
      <path class="draw" d="M196 150 C 240 150 250 120 292 116" fill="none" stroke="var(--acc)" stroke-width="2" stroke-dasharray="6 5"/>
      ${T(248, 140, "解析", 6.4, "var(--acc)", "middle", 600)}
      <rect x="292" y="58" width="184" height="126" rx="16" fill="var(--card)" stroke="var(--line)"/>
      <g transform="translate(452,70)">${GLYPH[SPEC[kind].glyph]}</g>
      ${T(306, 78, "设计规范", 8, "var(--ink)", "", 700)}
      ${SPEC[kind].pal.map((c, i) => `<circle cx="${312 + i * 20}" cy="94" r="7" fill="${c}" stroke="var(--line)"/>`).join("")}
      ${T(398, 97, "Aa 14/12", 7, "var(--mut)")}
      <rect x="306" y="108" width="156" height="1" fill="var(--line)"/>
      ${SPEC[kind].pages.map((pg, i) => `<rect x="${306 + i * 40}" y="118" width="36" height="14" rx="7" fill="var(--bg2)" stroke="var(--line)"/>${T(324 + i * 40, 127.5, pg, 6, "var(--mut)", "middle")}`).join("")}
      <rect x="306" y="142" width="86" height="16" rx="8" fill="var(--bg2)" stroke="var(--acc2)" stroke-opacity=".5"/>
      ${T(349, 153, "页面 5 · 交互 12", 6.2, "var(--acc2)", "middle")}
      <rect x="400" y="142" width="62" height="16" rx="8" fill="var(--bg2)" stroke="var(--line)"/>
      ${T(431, 153, "tokens 38", 6.2, "var(--mut)", "middle")}
      ${T(306, 174, SPEC[kind].rule, 6, "var(--mut)")}
    </g>`;
  const PFRAME = (header) => `
      <rect x="318" y="96" width="112" height="152" rx="16" fill="var(--card)" stroke="var(--acc2)" stroke-width="1.6"/>
      ${header}`;
  const finale = {
    mobile: () => `
    <g class="s4">
      <path class="draw" d="M240 210 C 280 214 292 200 318 196" fill="none" stroke="var(--acc2)" stroke-width="2" stroke-dasharray="6 5"/>
      ${T(280, 226, "生成", 6.4, "var(--acc2)", "middle", 600)}
      ${PFRAME(`<rect x="326" y="104" width="96" height="16" rx="7" fill="#07c160"/>${T(374, 115, "会话", 6.4, "#ffffff", "middle", 600)}`)}
      <g class="px-rowhl"><rect x="326" y="126" width="96" height="26" rx="7" fill="#07c160" opacity=".14"/></g>
      <circle cx="338" cy="139" r="7" fill="#8ea6c9"/><rect x="350" y="133" width="52" height="4.5" rx="2.2" fill="var(--mut)" opacity=".55"/><rect x="350" y="141" width="38" height="4" rx="2" fill="var(--mut)" opacity=".35"/>
      <circle cx="338" cy="167" r="7" fill="#07c160"/><rect x="350" y="161" width="46" height="4.5" rx="2.2" fill="var(--mut)" opacity=".55"/><rect x="350" y="169" width="34" height="4" rx="2" fill="var(--mut)" opacity=".35"/>
      <g class="px-tap" transform="translate(374,139)"><circle r="9" fill="none" stroke="#07c160" stroke-width="2"/></g>
      <g class="px-sheet"><rect x="326" y="182" width="96" height="40" rx="10" fill="var(--bg2)" stroke="var(--line)"/><rect x="334" y="190" width="44" height="12" rx="6" fill="#07c160" opacity=".25"/><circle class="px-send" cx="412" cy="196" r="6" fill="#07c160"/><rect x="334" y="208" width="60" height="6" rx="3" fill="var(--bg2)" stroke="var(--line)"/></g>
      <circle class="px-dot1" cx="340" cy="236" r="3.4" fill="#07c160"/><circle class="px-dot2" cx="362" cy="236" r="3.4" fill="var(--mut)" opacity=".4"/><circle cx="384" cy="236" r="3.4" fill="var(--mut)" opacity=".4"/><circle cx="406" cy="236" r="3.4" fill="var(--mut)" opacity=".4"/>
      <g transform="translate(374,266)"><rect x="-56" y="-14" width="112" height="27" rx="13.5" fill="var(--acc2)"/>${T(0, 4, "可玩原型 ✓", 8, "#08331f", "middle", 700)}</g>
    </g>`,
    link: () => `
    <g class="s4">
      <path class="draw" d="M240 210 C 280 214 292 200 318 196" fill="none" stroke="var(--acc2)" stroke-width="2" stroke-dasharray="6 5"/>
      ${T(280, 226, "生成", 6.4, "var(--acc2)", "middle", 600)}
      ${PFRAME(`<rect x="326" y="104" width="96" height="16" rx="7" fill="#161823"/>${T(352, 115, "关注", 6.2, "#8b93a0", "middle")}${T(392, 115, "推荐", 6.2, "#ffffff", "middle", 600)}<rect class="px-under" x="378" y="118" width="28" height="2" rx="1" fill="#fe2c55"/>`)}
      <rect x="326" y="126" width="96" height="62" rx="8" fill="#1f2129"/>
      <circle cx="374" cy="152" r="14" fill="#e8b04b" opacity=".85"/>
      <g class="px-heart" transform="translate(408,136)"><path d="M0 3 C -4 -2 -9 1 -6 5 L 0 10 L 6 5 C 9 1 4 -2 0 3 Z" fill="#fe2c55"/></g>
      <g class="px-plus" transform="translate(408,124)">${T(0, 0, "+1", 6.4, "#fe2c55", "middle", 700)}</g>
      <rect x="334" y="196" width="52" height="5" rx="2.5" fill="#ffffff" opacity=".75"/>
      <rect x="334" y="205" width="38" height="4.5" rx="2.2" fill="#8b93a0" opacity=".6"/>
      <rect x="326" y="216" width="96" height="14" rx="7" fill="#fe2c55"/>
      ${T(374, 225.5, "和我聊聊", 6, "#ffffff", "middle", 600)}
      <g transform="translate(374,266)"><rect x="-56" y="-14" width="112" height="27" rx="13.5" fill="var(--acc2)"/>${T(0, 4, "可玩原型 ✓", 8, "#08331f", "middle", 700)}</g>
    </g>`,
    desktop: () => `
    <g class="s4">
      <path class="draw" d="M240 210 C 280 214 292 200 318 196" fill="none" stroke="var(--acc2)" stroke-width="2" stroke-dasharray="6 5"/>
      ${T(280, 226, "生成", 6.4, "var(--acc2)", "middle", 600)}
      ${PFRAME(`<rect x="326" y="104" width="96" height="14" rx="6" fill="var(--bg2)"/><circle cx="334" cy="111" r="2.2" fill="#ff5f57"/><circle cx="341" cy="111" r="2.2" fill="#febc2e"/><circle cx="348" cy="111" r="2.2" fill="#28c840"/>${T(392, 113.5, "产品周报", 5.8, "var(--mut)", "middle")}`)}
      <rect x="326" y="122" width="26" height="102" rx="6" fill="#eef4ff"/>
      <rect x="330" y="128" width="18" height="4" rx="2" fill="#3370ff"/><rect x="330" y="136" width="14" height="4" rx="2" fill="#9db9f5"/><rect x="330" y="144" width="16" height="4" rx="2" fill="#9db9f5"/>
      ${T(358, 132, "产品周报 · 32 期", 6.4, "var(--ink)", "", 600)}
      <rect x="358" y="138" width="62" height="4" rx="2" fill="var(--mut)" opacity=".45"/>
      <rect class="px-caret" x="358" y="146" width="1.6" height="8" fill="#3370ff"/>
      <rect x="358" y="148" width="54" height="4" rx="2" fill="var(--mut)" opacity=".45"/>
      <rect x="358" y="156" width="58" height="4" rx="2" fill="var(--mut)" opacity=".45"/>
      <g class="px-chip"><rect x="358" y="166" width="52" height="14" rx="7" fill="#e8f2ff" stroke="#3370ff" stroke-opacity=".5"/>${T(384, 175.5, "补交互说明", 5.4, "#2456c4", "middle")}</g>
      <g class="px-press" transform="translate(410,214)"><rect x="-8" y="-6" width="16" height="12" rx="4" fill="var(--bg2)" stroke="var(--line)"/><circle r="2.4" fill="#3370ff"/></g>
      <rect x="326" y="228" width="96" height="10" rx="5" fill="var(--bg2)"/>
      <g transform="translate(374,266)"><rect x="-56" y="-14" width="112" height="27" rx="13.5" fill="var(--acc2)"/>${T(0, 4, "可玩原型 ✓", 8, "#08331f", "middle", 700)}</g>
    </g>`,
    web: () => `
    <g class="s4">
      <path class="draw" d="M240 210 C 280 214 292 200 318 196" fill="none" stroke="var(--acc2)" stroke-width="2" stroke-dasharray="6 5"/>
      ${T(280, 226, "生成", 6.4, "var(--acc2)", "middle", 600)}
      ${PFRAME(`<rect x="326" y="104" width="96" height="14" rx="6" fill="var(--bg2)"/><rect x="332" y="107" width="30" height="8" rx="4" fill="var(--card)" stroke="var(--line)"/>${T(347, 113, "控制台", 5.2, "var(--ink)", "middle", 600)}${T(382, 113, "监控", 5.2, "var(--mut)", "middle")}`)}
      <rect x="326" y="122" width="96" height="10" rx="3" fill="var(--bg2)"/>
      ${T(332, 129, "实例", 5, "var(--mut)", "", 600)}${T(372, 129, "状态", 5, "var(--mut)", "", 600)}${T(406, 129, "地域", 5, "var(--mut)", "", 600)}
      ${[0, 1, 2].map((i) => `
        <rect x="326" y="${134 + i * 16}" width="96" height="14" rx="3" fill="transparent" stroke="var(--line)" stroke-opacity=".6"/>
        ${T(332, 143 + i * 16, "web-0" + (i + 1), 5, "var(--ink)")}
        <circle class="px-stat-g${i}" cx="370" cy="${141 + i * 16}" r="2.6" fill="#2f9e63"/>
        <circle class="px-stat-y${i}" cx="370" cy="${141 + i * 16}" r="2.6" fill="#e8a53c" opacity="0"/>
        ${T(378, 143 + i * 16, "运行中", 5, "#2f9e63")}
        ${T(406, 143 + i * 16, "杭州", 5, "var(--mut)")}`).join("")}
      <g class="px-rowhl"><rect x="326" y="150" width="96" height="14" rx="3" fill="#ff6a00" opacity=".12"/></g>
      <circle class="px-dot1" cx="362" cy="190" r="3" fill="#ff6a00"/><circle class="px-dot2" cx="374" cy="190" r="3" fill="var(--mut)" opacity=".4"/><circle cx="386" cy="190" r="3" fill="var(--mut)" opacity=".4"/>
      <rect x="326" y="200" width="96" height="16" rx="6" fill="var(--bg2)"/>
      <rect x="332" y="205" width="40" height="6" rx="3" fill="#ff6a00" opacity=".8"/>
      <g transform="translate(374,266)"><rect x="-56" y="-14" width="112" height="27" rx="13.5" fill="var(--acc2)"/>${T(0, 4, "可玩原型 ✓", 8, "#08331f", "middle", 700)}</g>
    </g>`,
  };
  const scene = (kind, bp) => glow + `<g class="s1">${dev[kind]}</g>` + beam(...bp) + agent(kind) + finale[kind]();
  const SCENES = {
    mobile: {
      steps: [
        ["Open the app and browse the chat list as usual", "打开应用，像平时一样浏览会话列表"],
        ["One-click capture — every screen and tap is recorded", "一键捕获——逐屏截图与点击被自动记录"],
        ["AI reads structure, colors and type into a design spec", "AI 解析结构、配色与字号，形成设计规范"],
        ["A playable prototype is generated — ready to share", "生成浏览器可玩原型——即刻可分享"],
      ],
      svg: scene("mobile", [60, 66]),
    },
    link: {
      steps: [
        ["Paste a Douyin / Xiaohongshu share link", "粘贴抖音 / 小红书分享链接"],
        ["Author, images and body text are parsed automatically", "作者、图文与正文被自动解析"],
        ["Content is reorganized into pages and a design spec", "内容被重组为页面与设计规范"],
        ["A playable note prototype is generated", "生成可玩的笔记原型"],
      ],
      svg: scene("link", [60, 66]),
    },
    desktop: {
      steps: [
        ["Open a desktop app (Feishu etc.) and use it normally", "打开桌面软件（飞书等），正常使用"],
        ["Screen capture records windows and control interactions", "截屏自动记录窗口与控件交互"],
        ["Control tree and layout become a design spec", "控件树与布局被解析为设计规范"],
        ["A playable desktop prototype is generated", "生成可玩的桌面原型"],
      ],
      svg: scene("desktop", [48, 78]),
    },
    web: {
      steps: [
        ["Enter a website link (console, docs…)", "输入网站链接（控制台、文档…）"],
        ["A headless browser walks and captures every page", "无头浏览器自动遍历并捕获页面"],
        ["DOM structure and style tokens are extracted", "抽取 DOM 结构与样式 tokens"],
        ["A playable website prototype is generated", "生成可玩的网站原型"],
      ],
      svg: scene("web", [48, 70]),
    },
  };

  function mount(el, sceneKey) {
    const sc = SCENES[sceneKey];
    el.innerHTML = `
      <div class="cap"><span class="captxt"></span>
        <span class="steps">${[1, 2, 3, 4].map((n) => `<b data-s="${n}">${n}</b>`).join("")}</span>
        <button class="replay" aria-label="replay" title="replay"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M20 11a8 8 0 1 0-2.3 6.3"/><path d="M20 5v6h-6"/></svg></button></div>
      <div class="svgbox"><svg viewBox="0 0 520 290" data-step="1">${sc.svg}</svg><canvas class="dvfx"></canvas></div>`;
    const svgEl = el.querySelector("svg");
    const cap = el.querySelector(".captxt");
    const dots = [...el.querySelectorAll(".steps b")];
    const lang = () => (document.documentElement.lang === "zh-CN" ? 1 : 0);
    let step = 1, timer = null;
    const paint = (swap) => {
      el.setAttribute("data-step", step);
      svgEl.setAttribute("data-step", step);
      cap.textContent = `${step}/4 · ${sc.steps[step - 1][lang()]}`;
      dots.forEach((d, i) => { d.classList.toggle("on", i + 1 === step); d.classList.toggle("done", i + 1 < step); });
    };
    const cycle = () => { clearInterval(timer); timer = setInterval(() => { if (step < 4) { step++; paint(); } else clearInterval(timer); }, 2600); };
    const play = () => { clearInterval(timer); step = 1; paint(); cycle(); };
    dots.forEach((d) => (d.onclick = () => { clearInterval(timer); step = +d.dataset.s; paint(); cycle(); }));
    el.querySelector(".replay").onclick = play;
    el._replayLang = () => paint(false);
    el._play = play;
    // M78: 视口才播（离屏暂停）+ 粒子浮尘层（借鉴原型 particles 经验）
    const rm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!rm) {
      const cv = el.querySelector(".dvfx");
      const ctx = cv.getContext("2d");
      let W = 0, H = 0, ps = [], raf = null, live = false;
      const fit = () => { const d = window.devicePixelRatio || 1; W = cv.width = cv.clientWidth * d; H = cv.height = cv.clientHeight * d; };
      const mk = () => ({ x: Math.random() * W, y: Math.random() * H, r: (0.8 + Math.random() * 1.6) * (window.devicePixelRatio || 1), v: 0.12 + Math.random() * 0.3, ph: Math.random() * 6.283 });
      const tick = () => {
        if (!live) return;
        ctx.clearRect(0, 0, W, H);
        const dark = document.documentElement.dataset.theme === "dark";
        for (const p of ps) {
          p.y -= p.v; p.x += Math.sin(p.ph + p.y * 0.01) * 0.25;
          if (p.y < -6) { p.y = H + 6; p.x = Math.random() * W; }
          ctx.globalAlpha = 0.25 + 0.2 * Math.sin(p.ph + performance.now() * 0.001);
          ctx.fillStyle = dark ? "#9fd8ef" : "#ffffff";
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
        }
        ctx.globalAlpha = 1;
        raf = requestAnimationFrame(tick);
      };
      const io = new IntersectionObserver((es) => {
        for (const e of es) {
          if (e.isIntersecting && !live) {
            live = true; fit(); if (!ps.length) ps = Array.from({ length: 14 }, mk);
            if (!raf) tick();
            // M88: 未开始或已跑完 → 重播；其余续播
            if (!el._started || (step >= 4 && !timer)) { el._started = true; play(); } else cycle();
          } else if (!e.isIntersecting && live) { live = false; clearInterval(timer); if (raf) cancelAnimationFrame(raf); raf = null; }
        }
      }, { threshold: 0.25 });
      io.observe(el);
      // M88: 点击菜单即播——绕过 IO 等待强制开启粒子/画布活层
      el._forceLive = () => { live = true; fit(); if (!ps.length) ps = Array.from({ length: 14 }, mk); if (!raf) tick(); };
      window.addEventListener("resize", () => { if (live) fit(); }, { passive: true });
    } else {
      play();
    }
    paint(false);
    return el;
  }

  window.DCAnim = { mount, scenes: Object.keys(SCENES) };
})();
