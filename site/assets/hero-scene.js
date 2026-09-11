/* hero-scene.js —— 首页水镜微电影（M61）：圆框眼镜设计师 · 抱膝坐→镜头缓移→躺下→水面镜像（水天一色）
   单 master timeline 14s：camera/poses/reflection/waves 共用同 duration 与 % 偏移 = 有镜头、有动作、连贯。
   reduced-motion → 静态水镜全景帧（base 状态即幕3）。 */
window.DCScene = `
<svg viewBox="0 0 960 420" role="img" aria-label="designer by mirror-water: clone metaphor">
  <defs>
    <linearGradient id="hsSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cdeaf7"/><stop offset=".72" stop-color="#eaf7fb"/><stop offset="1" stop-color="#fdf1e3"/></linearGradient>
    <linearGradient id="hsWater" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdf1e3"/><stop offset=".2" stop-color="#dff2f8"/><stop offset="1" stop-color="#bfe0ee"/></linearGradient>
    <linearGradient id="hsSand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6e7d0"/><stop offset="1" stop-color="#e8d3b4"/></linearGradient>
    <linearGradient id="hsHair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a6248"/><stop offset="1" stop-color="#5d3f30"/></linearGradient>
    <linearGradient id="hsSkin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9d6"/><stop offset="1" stop-color="#ffd9b8"/></linearGradient>
    <linearGradient id="hsSwe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf3e6"/><stop offset="1" stop-color="#ecd9bd"/></linearGradient>
    <radialGradient id="hsSun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6dc"/><stop offset=".55" stop-color="#ffe9b0" stop-opacity=".85"/><stop offset="1" stop-color="#ffe9b0" stop-opacity="0"/></radialGradient>
    <radialGradient id="hsVig" cx=".5" cy=".5" r=".72"><stop offset=".72" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#123" stop-opacity=".16"/></radialGradient>
    <linearGradient id="hsReflFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".75" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <mask id="hsReflMask"><rect x="0" y="270" width="960" height="150" fill="url(#hsReflFade)"/></mask>
  </defs>

  <g class="hs-cam">
    <rect x="-200" y="-160" width="1360" height="430" fill="url(#hsSky)"/>
    <circle cx="720" cy="104" r="64" fill="url(#hsSun)"/>
    <circle cx="720" cy="104" r="26" fill="#fff8e2" opacity=".95"/>
    <g class="hs-clouds" fill="#ffffff">
      <g opacity=".85"><ellipse cx="180" cy="84" rx="46" ry="13"/><ellipse cx="214" cy="74" rx="30" ry="11"/><ellipse cx="150" cy="76" rx="24" ry="9"/></g>
      <g opacity=".7"><ellipse cx="520" cy="56" rx="38" ry="11"/><ellipse cx="548" cy="48" rx="24" ry="9"/></g>
      <g opacity=".6"><ellipse cx="846" cy="120" rx="34" ry="10"/><ellipse cx="820" cy="112" rx="20" ry="8"/></g>
    </g>
    <g class="hs-birds" stroke="#7d94a5" stroke-width="2" fill="none" stroke-linecap="round">
      <path d="M300 96 q5 -5 10 0 q5 -5 10 0"/>
      <path d="M342 112 q4 -4 8 0 q4 -4 8 0"/>
    </g>
    <rect x="-200" y="270" width="1360" height="310" fill="url(#hsWater)"/>
    <rect x="-200" y="266" width="1360" height="7" fill="#ffffff" opacity=".55"/>
    <path class="hs-glitter" d="M716 288 q6 10 0 20 q-6 10 0 20 q6 10 0 20" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-dasharray="6 10"/>
    <g fill="none" stroke="#ffffff" stroke-linecap="round">
      <path class="hs-w1" d="M-100 306 q40 -8 80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0" opacity=".4" stroke-width="2.4"/>
      <path class="hs-w2" d="M-140 340 q46 -9 92 0 t92 0 t92 0 t92 0 t92 0 t92 0 t92 0 t92 0 t92 0 t92 0 t92 0" opacity=".28" stroke-width="2"/>
      <path class="hs-w3" d="M-100 382 q52 -10 104 0 t104 0 t104 0 t104 0 t104 0 t104 0 t104 0 t104 0 t104 0 t104 0" opacity=".18" stroke-width="2"/>
    </g>
    <rect x="-200" y="252" width="1360" height="18" fill="url(#hsSand)" opacity=".95"/>

    <g id="hs-sit" transform="translate(330,252)">
      <ellipse cx="8" cy="2" rx="38" ry="6" fill="#d9c1a0" opacity=".5"/>
      <path d="M-10 0 q-6 -30 2 -44 q4 -8 12 -8 q10 0 12 10 q4 16 -2 42 z" fill="url(#hsSwe)"/>
      <path d="M2 -2 q-2 -30 20 -34 q24 -4 26 16 q2 16 -14 18 z" fill="url(#hsSwe)"/>
      <path d="M26 -30 q8 4 8 12" stroke="#e6d2b4" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/>
      <path d="M0 -38 q18 -10 30 2 q8 8 2 14" stroke="url(#hsSwe)" stroke-width="10" fill="none" stroke-linecap="round"/>
      <circle cx="34" cy="-20" r="5" fill="url(#hsSkin)"/>
      <path d="M-6 -46 q10 8 20 0 l3 6 q-13 9 -26 0 z" fill="#e07856"/>
      <path d="M14 -44 q8 6 6 16 q-1 6 -6 4 q3 -10 -3 -16 z" fill="#e07856" opacity=".9"/>
      <path d="M-2 -80 q-18 0 -19 20 q0 12 4 20 q3 4 5 1 q-3 -10 -2 -18 l24 0 q1 8 -2 18 q2 3 5 -1 q4 -8 4 -20 q-1 -20 -19 -20 z" fill="url(#hsHair)"/>
      <circle cx="-2" cy="-62" r="16" fill="url(#hsSkin)"/>
      <path d="M-17 -64 q2 -12 15 -12 q13 0 15 12 q-5 -5 -9 -4 q2 -3 1 -5 q-4 3 -8 3 q-7 0 -10 -2 q0 2 2 4 q-4 0 -6 4 z" fill="url(#hsHair)"/>
      <path d="M-18 -62 q-3 10 1 18 q2 3 4 1 q-3 -9 -1 -17 z" fill="url(#hsHair)"/>
      <path d="M14 -62 q3 10 -1 18 q-2 3 -4 1 q3 -9 1 -17 z" fill="url(#hsHair)"/>
      <circle cx="-8.5" cy="-60" r="6" fill="none" stroke="#3a2e26" stroke-width="1.6"/>
      <circle cx="4.5" cy="-60" r="6" fill="none" stroke="#3a2e26" stroke-width="1.6"/>
      <path d="M-2.5 -60 h1 M-14.5 -61 l-3 -1 M10.5 -61 l3 -1" stroke="#3a2e26" stroke-width="1.5" stroke-linecap="round"/>
      <ellipse cx="-8.5" cy="-59.5" rx="1.8" ry="2.4" fill="#4a332c"/>
      <ellipse cx="4.5" cy="-59.5" rx="1.8" ry="2.4" fill="#4a332c"/>
      <circle cx="-7.8" cy="-60.5" r=".7" fill="#fff"/>
      <circle cx="5.2" cy="-60.5" r=".7" fill="#fff"/>
      <circle cx="-13" cy="-55" r="2.6" fill="#ff9d86" opacity=".4"/>
      <circle cx="9.5" cy="-55" r="2.6" fill="#ff9d86" opacity=".4"/>
      <path d="M-4 -52 q3 2.4 6 0" stroke="#b06a4a" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <path d="M-12 -74 q5 -3 10 -2" stroke="#c99b76" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".8"/>
    </g>

    <g id="hs-lie" transform="translate(600,252)">
      <ellipse cx="0" cy="3" rx="62" ry="6" fill="#d9c1a0" opacity=".45"/>
      <path d="M-46 -14 q-16 -6 -26 2 q-8 6 -2 10 q10 6 22 2 z" fill="url(#hsHair)"/>
      <path d="M-50 -22 q-14 -2 -20 6 q8 4 18 2 z" fill="url(#hsHair)" opacity=".9"/>
      <circle cx="-40" cy="-14" r="15" fill="url(#hsSkin)"/>
      <path d="M-52 -18 q4 -10 14 -9 q10 1 12 10 q-5 -4 -9 -3 q1 -3 0 -4 q-3 3 -8 2 q-6 -1 -9 4 z" fill="url(#hsHair)"/>
      <circle cx="-45" cy="-13" r="5.6" fill="none" stroke="#3a2e26" stroke-width="1.5"/>
      <circle cx="-33" cy="-13" r="5.6" fill="none" stroke="#3a2e26" stroke-width="1.5"/>
      <path d="M-39.4 -13 h1.8" stroke="#3a2e26" stroke-width="1.4" stroke-linecap="round"/>
      <ellipse cx="-45" cy="-12.5" rx="1.6" ry="2.1" fill="#4a332c"/>
      <ellipse cx="-33" cy="-12.5" rx="1.6" ry="2.1" fill="#4a332c"/>
      <circle cx="-44.4" cy="-13.4" r=".6" fill="#fff"/>
      <circle cx="-32.4" cy="-13.4" r=".6" fill="#fff"/>
      <circle cx="-49" cy="-8" r="2.2" fill="#ff9d86" opacity=".4"/>
      <circle cx="-29" cy="-8" r="2.2" fill="#ff9d86" opacity=".4"/>
      <path d="M-42 -6 q3 2 6 0" stroke="#b06a4a" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      <path d="M-26 -6 q8 6 16 2 l2 5 q-10 5 -20 -2 z" fill="#e07856"/>
      <path d="M-24 -4 q10 -12 26 -10 q16 2 22 8 q4 4 0 6 l-46 2 q-4 -2 -2 -6 z" fill="url(#hsSwe)"/>
      <path d="M-14 -10 q8 -6 16 -2" stroke="url(#hsSwe)" stroke-width="7" fill="none" stroke-linecap="round"/>
      <circle cx="4" cy="-12" r="4" fill="url(#hsSkin)"/>
      <path d="M22 -8 q12 -8 18 0 q4 6 -4 8 l-14 0 q-4 -4 0 -8 z" fill="url(#hsSwe)"/>
      <path d="M36 -2 q8 2 12 0" stroke="url(#hsSwe)" stroke-width="6" fill="none" stroke-linecap="round"/>
      <circle cx="50" cy="-2" r="3.5" fill="#fff"/>
    </g>

    <g class="hs-refl" mask="url(#hsReflMask)">
      <g transform="matrix(1,0,0,-1,0,540)"><use href="#hs-lie"/></g>
    </g>
  </g>
  <rect class="hs-fade" x="0" y="0" width="960" height="420" fill="#fdf6ec" opacity="0"/>
  <rect x="0" y="0" width="960" height="420" fill="url(#hsVig)" pointer-events="none"/>
</svg>`;
