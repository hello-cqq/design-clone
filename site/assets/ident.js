/* ident.js —— 首页片头 ident（M62）：设计师坐水面→躺下→铅笔描云→水面倒映背影。
   单 9s 时间轴连续骨骼动画（零切帧）：关节组嵌套 + rotate 关键帧同 duration 同步。
   播放一次定格终帧；点击重播；reduced-motion = 终帧。背景=genimg anime 镜湖静帧。 */
window.DCIdent = `
<svg viewBox="0 0 420 240" role="img" aria-label="design-clone ident: designer on mirror water">
  <defs>
    <linearGradient id="idSwe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf3e6"/><stop offset="1" stop-color="#e9d5b8"/></linearGradient>
    <linearGradient id="idHair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a6248"/><stop offset="1" stop-color="#5d3f30"/></linearGradient>
    <linearGradient id="idSkin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9d6"/><stop offset="1" stop-color="#ffd9b8"/></linearGradient>
    <linearGradient id="idReflFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity=".18"/></linearGradient>
    <mask id="idReflMask"><rect x="0" y="150" width="420" height="90" fill="url(#idReflFade)"/></mask>
    <clipPath id="idClip"><rect x="0" y="0" width="420" height="240" rx="18"/></clipPath>
  </defs>
  <g clip-path="url(#idClip)">
    <image class="id-bg" href="assets/ident-bg.png" x="0" y="0" width="420" height="240" preserveAspectRatio="xMidYMid slice"/>
    <g class="id-cam">
      <g class="id-shimmer" opacity=".5">
        <path d="M40 176 q30 -5 60 0 t60 0 t60 0 t60 0 t60 0" stroke="#fff" stroke-width="1.6" fill="none" opacity=".5"/>
        <path d="M20 198 q34 -6 68 0 t68 0 t68 0 t68 0" stroke="#fff" stroke-width="1.3" fill="none" opacity=".35"/>
        <path d="M60 220 q40 -6 80 0 t80 0 t80 0" stroke="#fff" stroke-width="1.1" fill="none" opacity=".25"/>
      </g>

      <g class="id-refl" mask="url(#idReflMask)">
        <g transform="matrix(1,0,0,-1,0,300)">
          <g class="id-rtorso">
            <path d="M198 152 q-6 -30 2 -42 q4 -8 12 -8 q10 0 12 9 q5 15 -1 41 z" fill="url(#idSwe)"/>
            <g class="id-rhead">
              <path d="M208 70 q-17 0 -18 19 q0 13 5 20 q3 4 5 1 q-3 -10 -2 -16 l20 0 q1 6 -2 16 q2 3 5 -1 q5 -7 5 -20 q-1 -19 -18 -19 z" fill="url(#idHair)"/>
              <circle cx="208" cy="88" r="14" fill="url(#idHair)"/>
            </g>
            <g class="id-rthigh">
              <path d="M210 150 q14 -14 24 -20" stroke="url(#idSwe)" stroke-width="10" fill="none" stroke-linecap="round"/>
              <g class="id-rshin"><path d="M232 128 q6 12 8 20" stroke="url(#idSwe)" stroke-width="8" fill="none" stroke-linecap="round"/></g>
            </g>
          </g>
        </g>
      </g>

      <g class="id-char">
        <g class="id-torso">
          <path d="M198 152 q-6 -30 2 -42 q4 -8 12 -8 q10 0 12 9 q5 15 -1 41 z" fill="url(#idSwe)"/>
          <path d="M200 118 q8 5 16 0" stroke="#e6d2b4" stroke-width="1.4" fill="none" opacity=".8"/>
          <g class="id-armR">
            <path d="M216 112 q8 8 10 18" stroke="url(#idSwe)" stroke-width="7.5" fill="none" stroke-linecap="round"/>
            <circle cx="227" cy="132" r="3.6" fill="url(#idSkin)"/>
          </g>
          <g class="id-armL">
            <path d="M202 112 q-6 9 -6 16" stroke="url(#idSwe)" stroke-width="7.5" fill="none" stroke-linecap="round"/>
            <g class="id-fore">
              <path d="M196 128 q12 4 26 2" stroke="url(#idSwe)" stroke-width="7" fill="none" stroke-linecap="round"/>
              <circle cx="224" cy="130" r="3.8" fill="url(#idSkin)"/>
              <g class="id-pencil" transform="rotate(24 224 130)">
                <rect x="222" y="108" width="3.6" height="24" rx="1.8" fill="#e07856"/>
                <path d="M222 108 l1.8 -6 l1.8 6 z" fill="#ffd9b8"/>
                <circle class="id-spark" cx="223.8" cy="100" r="2.6" fill="#fff6d8"/>
              </g>
            </g>
          </g>
          <path d="M200 106 q8 7 16 0 l2 5 q-10 8 -20 0 z" fill="#e07856"/>
          <g class="id-head">
            <path d="M208 70 q-17 0 -18 19 q0 13 5 20 q3 4 5 1 q-3 -10 -2 -16 l20 0 q1 6 -2 16 q2 3 5 -1 q5 -7 5 -20 q-1 -19 -18 -19 z" fill="url(#idHair)"/>
            <circle cx="208" cy="88" r="14" fill="url(#idSkin)"/>
            <path d="M194 86 q2 -12 14 -12 q12 0 14 12 q-4 -5 -8 -4 q2 -3 1 -4 q-4 3 -8 3 q-6 0 -9 -2 q0 2 2 3 q-4 0 -6 4 z" fill="url(#idHair)"/>
            <path d="M193 88 q-2 9 1 15 q2 3 3 1 q-2 -8 -1 -15 z" fill="url(#idHair)"/>
            <path d="M223 88 q2 9 -1 15 q-2 3 -3 1 q2 -8 1 -15 z" fill="url(#idHair)"/>
            <circle cx="202" cy="89" r="5.4" fill="none" stroke="#b98a44" stroke-width="1.4"/>
            <circle cx="214" cy="89" r="5.4" fill="none" stroke="#b98a44" stroke-width="1.4"/>
            <path d="M207.4 89 h1.2 M196.6 88 l-2.4 -.8 M219.4 88 l2.4 -.8" stroke="#b98a44" stroke-width="1.2" stroke-linecap="round"/>
            <g class="id-eyes">
              <ellipse cx="202" cy="89.5" rx="1.6" ry="2.2" fill="#4a332c"/>
              <ellipse cx="214" cy="89.5" rx="1.6" ry="2.2" fill="#4a332c"/>
              <circle cx="202.6" cy="88.6" r=".6" fill="#fff"/>
              <circle cx="214.6" cy="88.6" r=".6" fill="#fff"/>
            </g>
            <circle cx="197" cy="94" r="2.2" fill="#ff9d86" opacity=".4"/>
            <circle cx="219" cy="94" r="2.2" fill="#ff9d86" opacity=".4"/>
            <path d="M205 96 q3 2.2 6 0" stroke="#b06a4a" stroke-width="1.3" fill="none" stroke-linecap="round"/>
            <path d="M198 76 q5 -3 9 -2" stroke="#c99b76" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".8"/>
          </g>
        </g>
        <g class="id-thigh">
          <path d="M210 150 q14 -14 24 -20" stroke="url(#idSwe)" stroke-width="10" fill="none" stroke-linecap="round"/>
          <g class="id-shin">
            <path d="M232 128 q6 12 8 20" stroke="url(#idSwe)" stroke-width="8" fill="none" stroke-linecap="round"/>
            <circle cx="241" cy="149" r="3.4" fill="#fff"/>
          </g>
        </g>
      </g>

      <g class="id-ripples" fill="none" stroke="#ffffff">
        <ellipse class="id-rp1" cx="210" cy="152" rx="26" ry="5" stroke-width="1.4" opacity=".5"/>
        <ellipse class="id-rp2" cx="210" cy="152" rx="40" ry="7.5" stroke-width="1.1" opacity=".32"/>
        <ellipse class="id-rp3" cx="210" cy="152" rx="56" ry="10" stroke-width=".9" opacity=".2"/>
      </g>

      <path pathLength="100" class="id-cloud1" d="M150 62 q10 -14 26 -10 q8 -12 24 -8 q14 -6 24 4 q14 0 16 12 q-4 10 -18 8 q-10 8 -26 6 q-16 4 -28 -2 q-14 2 -18 -10 z" fill="#ffffff" fill-opacity=".92" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
      <path pathLength="100" class="id-cloud2" d="M282 74 q7 -9 18 -7 q6 -8 17 -5 q10 -3 16 4 q9 1 10 8 q-3 7 -13 6 q-8 5 -18 4 q-11 2 -19 -2 q-9 1 -11 -8 z" fill="#ffffff" fill-opacity=".85" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round"/>
    </g>

    <g class="id-lockup" text-anchor="middle">
      <text x="210" y="216" font-family="-apple-system,'SF Pro Text','PingFang SC',sans-serif" font-size="13" font-weight="600" letter-spacing="2.5" fill="#ffffff" style="paint-order:stroke" stroke="rgba(40,60,80,.35)" stroke-width="2">design-clone</text>
      <text x="210" y="228" font-family="-apple-system,'SF Pro Text','PingFang SC',sans-serif" font-size="6.5" letter-spacing="1.2" fill="#ffffff" opacity=".85" style="paint-order:stroke" stroke="rgba(40,60,80,.3)" stroke-width="1.4">CLONE ANY APP INTO A PLAYABLE PROTOTYPE</text>
    </g>
  </g>
</svg>`;
