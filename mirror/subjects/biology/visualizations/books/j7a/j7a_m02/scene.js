window.BIO_VISUAL_SCENES = window.BIO_VISUAL_SCENES || {};

(() => {
  const DEFAULT_CONFIG = {
    phases: [
      { id: "select", label: "选择标本" },
      { id: "prep", label: "制作装片" },
      { id: "microscope", label: "显微镜观察" }
    ],
    prepSequence: [
      { id: "liquid", label: "滴加液体" },
      { id: "sample", label: "放置材料" },
      { id: "cover", label: "盖盖玻片" },
      { id: "stain", label: "染色处理" },
      { id: "done", label: "装片完成" }
    ],
    specimens: [
      {
        id: "onion",
        label: "洋葱鳞片叶内表皮细胞",
        shortLabel: "洋葱表皮细胞",
        type: "植物细胞",
        accent: "#6ee7b7",
        summary: "重点观察植物细胞的细胞壁、液泡和细胞核。",
        focusHint: "先用低倍镜定位，再换高倍镜观察细胞壁和细胞核。",
        targets: [
          "细胞呈长方形，排列较整齐",
          "细胞壁清晰可见",
          "液泡较大，细胞核常偏向一侧"
        ],
        analysis: [
          "细胞呈长方形，排列整齐。",
          "细胞壁明显，是植物细胞的重要特征。",
          "液泡较大，细胞核常被挤到边缘。",
          "一般看不到叶绿体。"
        ],
        prepSteps: [
          "在洁净载玻片中央滴一滴清水。",
          "用镊子撕取一小块洋葱鳞片叶内表皮，展平在水滴中。",
          "使盖玻片一侧先接触液滴，再缓缓放下，避免产生气泡。",
          "在盖玻片一侧滴加稀碘液，另一侧用吸水纸引流完成染色。",
          "装片制作完成，可以转入显微镜观察。"
        ]
      },
      {
        id: "cheek",
        label: "人口腔上皮细胞",
        shortLabel: "口腔上皮细胞",
        type: "动物细胞",
        accent: "#7dd3fc",
        summary: "重点观察动物细胞的细胞膜和细胞核，并与植物细胞比较。",
        focusHint: "低倍镜先找完整细胞，再在高倍镜下观察细胞膜和细胞核。",
        targets: [
          "细胞形态不规则，分布较分散",
          "细胞膜边界较薄",
          "染色后细胞核更明显"
        ],
        analysis: [
          "细胞多呈扁平不规则形。",
          "最外侧边界是细胞膜，没有细胞壁。",
          "染色后细胞核较明显，常位于中央附近。",
          "动物细胞没有大液泡。"
        ],
        prepSteps: [
          "在洁净载玻片中央滴一滴生理盐水，保持细胞正常形态。",
          "用消毒牙签轻刮口腔内侧壁，将材料涂抹在生理盐水中。",
          "使盖玻片一侧先接触液滴，再缓缓盖下，防止产生气泡。",
          "在盖玻片一侧滴加稀碘液，另一侧用吸水纸引流完成染色。",
          "装片制作完成，可以转入显微镜观察。"
        ]
      }
    ],
    objectives: [
      {
        id: "low",
        value: 10,
        label: "低倍镜",
        magnification: "10x",
        tip: "先找到物像，再将其移到视野中央。"
      },
      {
        id: "high",
        value: 40,
        label: "高倍镜",
        magnification: "40x",
        tip: "换高倍镜后只调细准焦，避免压碎装片。"
      }
    ],
    operationRules: [
      "先低倍，后高倍。",
      "先粗准焦，后细准焦。",
      "高倍镜下不再使用粗准焦。"
    ]
  };

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function escapeHtml(value) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    };
    return String(value == null ? "" : value).replace(/[&<>"']/g, item => map[item]);
  }


  function loadModelViewer() {
    if (window.BiologyApp && typeof window.BiologyApp.loadBiologyModelViewer === "function") {
      return window.BiologyApp.loadBiologyModelViewer();
    }
    if (window.customElements && window.customElements.get("model-viewer")) {
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }

  function normalizeConfig(input) {
    const source = input && typeof input === "object" ? input : {};
    return {
      ...DEFAULT_CONFIG,
      ...source,
      phases: Array.isArray(source.phases) && source.phases.length ? source.phases : DEFAULT_CONFIG.phases,
      prepSequence: Array.isArray(source.prepSequence) && source.prepSequence.length ? source.prepSequence : DEFAULT_CONFIG.prepSequence,
      specimens: Array.isArray(source.specimens) && source.specimens.length ? source.specimens : DEFAULT_CONFIG.specimens,
      objectives: Array.isArray(source.objectives) && source.objectives.length ? source.objectives : DEFAULT_CONFIG.objectives,
      operationRules: Array.isArray(source.operationRules) && source.operationRules.length ? source.operationRules : DEFAULT_CONFIG.operationRules
    };
  }

  function getLayoutMode(container) {
    const width = container.clientWidth || 0;
    const height = container.clientHeight || 0;
    if (width < 760 || height < 470) return "tight";
    if (width < 920 || height < 560) return "compact";
    return "regular";
  }

  function renderDotList(items) {
    return items.map(item => `
      <div class="bio-microscope-lab__bullet">
        <span class="bio-microscope-lab__bulletDot"></span>
        <span>${escapeHtml(item)}</span>
      </div>
    `).join("");
  }

  function renderSpecimenGlyph(specimenId, accent) {
    if (specimenId === "cheek") {
      return `
        <svg viewBox="0 0 280 160" class="bio-microscope-lab__glyphSvg" aria-hidden="true">
          <defs>
            <linearGradient id="cheekGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="rgba(125,211,252,0.34)"></stop>
              <stop offset="100%" stop-color="rgba(14,165,233,0.08)"></stop>
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="280" height="160" fill="transparent"></rect>
          <g fill="url(#cheekGlow)" stroke="${accent}" stroke-width="2.4" stroke-opacity="0.85">
            <path d="M 52 76 C 32 46, 86 18, 114 48 C 142 78, 110 128, 74 116 C 56 108, 42 96, 52 76 Z"></path>
            <path d="M 140 54 C 118 28, 182 16, 204 46 C 224 74, 198 120, 162 112 C 140 106, 126 82, 140 54 Z"></path>
            <path d="M 178 108 C 162 82, 214 66, 234 92 C 254 118, 230 146, 198 142 C 182 138, 168 126, 178 108 Z"></path>
          </g>
          <g fill="rgba(15,23,42,0.72)">
            <circle cx="86" cy="76" r="10"></circle>
            <circle cx="172" cy="66" r="10"></circle>
            <circle cx="206" cy="116" r="9"></circle>
          </g>
        </svg>
      `;
    }

    return `
      <svg viewBox="0 0 280 160" class="bio-microscope-lab__glyphSvg" aria-hidden="true">
        <defs>
          <linearGradient id="onionGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="rgba(110,231,183,0.28)"></stop>
            <stop offset="100%" stop-color="rgba(5,150,105,0.08)"></stop>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="280" height="160" fill="transparent"></rect>
        <g fill="url(#onionGlow)" stroke="${accent}" stroke-width="2.2" stroke-opacity="0.82">
          <rect x="32" y="30" width="64" height="46" rx="10"></rect>
          <rect x="102" y="26" width="68" height="52" rx="10"></rect>
          <rect x="176" y="32" width="70" height="46" rx="10"></rect>
          <rect x="42" y="84" width="70" height="50" rx="10"></rect>
          <rect x="120" y="84" width="74" height="48" rx="10"></rect>
          <rect x="202" y="88" width="44" height="44" rx="9"></rect>
        </g>
        <g fill="rgba(6,95,70,0.72)">
          <circle cx="70" cy="54" r="8"></circle>
          <circle cx="142" cy="52" r="8"></circle>
          <circle cx="210" cy="56" r="8"></circle>
          <circle cx="76" cy="110" r="8"></circle>
          <circle cx="156" cy="108" r="8"></circle>
          <circle cx="224" cy="110" r="7"></circle>
        </g>
      </svg>
    `;
  }

  function renderMicroscopeSvg({ objectiveId, lightOn, slidePlaced, coarseFocus, accent }) {
    const stageY = 314 - coarseFocus * 0.68;
    const objectiveRotation = objectiveId === "high" ? 54 : 0;
    const lightCore = lightOn ? accent : "#3f4753";
    const lightHalo = lightOn ? "url(#bioMicroscopeGlow)" : "none";

    return `
      <svg viewBox="0 0 380 460" class="bio-microscope-lab__microscopeSvg" aria-hidden="true">
        <defs>
          <linearGradient id="bioMicroscopeShell" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff"></stop>
            <stop offset="46%" stop-color="#d7dde8"></stop>
            <stop offset="100%" stop-color="#96a1b2"></stop>
          </linearGradient>
          <linearGradient id="bioMicroscopeDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#48505c"></stop>
            <stop offset="100%" stop-color="#181c22"></stop>
          </linearGradient>
          <linearGradient id="bioMicroscopeChrome" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#cfcfcf"></stop>
            <stop offset="20%" stop-color="#ffffff"></stop>
            <stop offset="50%" stop-color="#8b94a1"></stop>
            <stop offset="80%" stop-color="#eceff4"></stop>
            <stop offset="100%" stop-color="#636b77"></stop>
          </linearGradient>
          <linearGradient id="bioMicroscopeBeam" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="rgba(255,255,255,0.75)"></stop>
            <stop offset="100%" stop-color="rgba(255,255,255,0.02)"></stop>
          </linearGradient>
          <filter id="bioMicroscopeShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="8" dy="10" stdDeviation="8" flood-color="#000000" flood-opacity="0.42"></feDropShadow>
          </filter>
          <filter id="bioMicroscopeGlow">
            <feGaussianBlur stdDeviation="7" result="coloredBlur"></feGaussianBlur>
            <feMerge>
              <feMergeNode in="coloredBlur"></feMergeNode>
              <feMergeNode in="SourceGraphic"></feMergeNode>
            </feMerge>
          </filter>
        </defs>

        <path d="M 58 438 L 322 438 Q 334 438 330 428 L 304 400 L 156 400 L 122 420 Q 114 424 104 424 Z" fill="url(#bioMicroscopeShell)" filter="url(#bioMicroscopeShadow)"></path>
        <rect x="72" y="438" width="32" height="7" rx="3.5" fill="#12161b"></rect>
        <rect x="282" y="438" width="32" height="7" rx="3.5" fill="#12161b"></rect>

        <path d="M 90 420 L 164 420 C 164 420 156 376 128 376 C 100 376 90 420 90 420 Z" fill="url(#bioMicroscopeDark)"></path>
        <ellipse cx="128" cy="376" rx="24" ry="8" fill="${lightCore}" stroke="#11151a" stroke-width="2"></ellipse>
        <ellipse cx="128" cy="376" rx="18" ry="5.5" fill="${lightCore}" filter="${lightHalo}"></ellipse>

        <path d="M 150 400 C 348 400 386 144 262 86 L 166 86 C 156 86 150 94 150 104 L 150 132 C 272 146 304 336 180 346 L 150 346 Z" fill="url(#bioMicroscopeShell)" filter="url(#bioMicroscopeShadow)"></path>
        <path d="M 262 86 C 370 140 328 384 150 400" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.5"></path>

        <rect x="174" y="186" width="38" height="160" rx="5" fill="url(#bioMicroscopeDark)" filter="url(#bioMicroscopeShadow)"></rect>
        <line x1="184" y1="194" x2="184" y2="338" stroke="#0b0d10" stroke-width="7" stroke-dasharray="4 2"></line>

        ${lightOn ? `
          <g opacity="0.9">
            <polygon points="114,376 142,376 142,${stageY + 38} 114,${stageY + 38}" fill="url(#bioMicroscopeBeam)" opacity="0.46"></polygon>
            <polygon points="118,${stageY + 4} 138,${stageY + 4} 138,196 118,196" fill="url(#bioMicroscopeBeam)" opacity="0.68"></polygon>
          </g>
        ` : ""}

        <g transform="translate(0, ${stageY})">
          <path d="M 100 12 L 156 12 L 148 38 L 108 38 Z" fill="url(#bioMicroscopeDark)"></path>
          <ellipse cx="128" cy="38" rx="16" ry="5.5" fill="url(#bioMicroscopeChrome)"></ellipse>
          <rect x="42" y="0" width="148" height="14" rx="2" fill="url(#bioMicroscopeDark)" filter="url(#bioMicroscopeShadow)"></rect>
          <rect x="42" y="0" width="148" height="3" fill="#5d6674"></rect>
          <rect x="154" y="14" width="22" height="26" fill="url(#bioMicroscopeChrome)"></rect>
          <rect x="149" y="32" width="30" height="6" rx="2" fill="#11151a"></rect>
          <rect x="149" y="40" width="30" height="6" rx="2" fill="#11151a"></rect>
          <path d="M 60 0 Q 60 -14 86 -10 L 92 0 Z" fill="url(#bioMicroscopeChrome)" filter="url(#bioMicroscopeShadow)"></path>
          ${slidePlaced ? `
            <g>
              <rect x="98" y="-7" width="60" height="8" fill="rgba(210,242,255,0.34)" stroke="rgba(255,255,255,0.76)" stroke-width="1"></rect>
              <circle cx="128" cy="-3" r="7" fill="${accent}" opacity="0.55"></circle>
            </g>
          ` : ""}
        </g>

        <path d="M 92 104 L 168 104 L 158 142 L 102 142 Z" fill="url(#bioMicroscopeShell)" filter="url(#bioMicroscopeShadow)"></path>
        <ellipse cx="128" cy="142" rx="34" ry="11" fill="url(#bioMicroscopeDark)" stroke="#555d69" stroke-width="2"></ellipse>

        <g transform="translate(128, 142) rotate(${objectiveRotation})">
          <g transform="translate(0, 10)">
            <path d="M -14 0 L 14 0 L 11 34 L -11 34 Z" fill="url(#bioMicroscopeChrome)"></path>
            <rect x="-13" y="18" width="26" height="6" fill="#f0c847"></rect>
            <rect x="-8" y="34" width="16" height="5" fill="url(#bioMicroscopeDark)"></rect>
          </g>
          <g transform="rotate(-54) translate(0, 10)">
            <path d="M -12 0 L 12 0 L 8 48 L -8 48 Z" fill="url(#bioMicroscopeChrome)"></path>
            <rect x="-10" y="30" width="20" height="6" fill="#3b82f6"></rect>
            <rect x="-5" y="48" width="10" height="5" fill="url(#bioMicroscopeDark)"></rect>
          </g>
          <g transform="rotate(54) translate(0, 10)">
            <path d="M -10 0 L 10 0 L 7 38 L -7 38 Z" fill="url(#bioMicroscopeChrome)" opacity="0.56"></path>
            <rect x="-8" y="22" width="16" height="5" fill="#ffffff" opacity="0.6"></rect>
          </g>
        </g>

        <rect x="92" y="54" width="88" height="58" rx="14" fill="url(#bioMicroscopeShell)" filter="url(#bioMicroscopeShadow)"></rect>
        <path d="M 92 112 C 92 76 180 76 180 112" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.45"></path>

        <g transform="translate(122, 82) rotate(-35)">
          <rect x="-15" y="-56" width="30" height="56" fill="url(#bioMicroscopeDark)"></rect>
          <rect x="-20" y="-76" width="40" height="20" rx="2" fill="#0f1217"></rect>
          <rect x="-20" y="-76" width="40" height="3" fill="#343b46"></rect>
        </g>
        <g transform="translate(146, 86) rotate(-35)">
          <rect x="-15" y="-56" width="30" height="56" fill="url(#bioMicroscopeChrome)" filter="url(#bioMicroscopeShadow)"></rect>
          <rect x="-20" y="-76" width="40" height="20" rx="2" fill="#151920"></rect>
          <rect x="-20" y="-76" width="40" height="3" fill="#444b57"></rect>
          <rect x="-15" y="-56" width="30" height="4" fill="#06080b"></rect>
        </g>

        <g transform="translate(254, 274)">
          <circle cx="0" cy="0" r="40" fill="url(#bioMicroscopeDark)" filter="url(#bioMicroscopeShadow)"></circle>
          <circle cx="0" cy="0" r="36" fill="none" stroke="#080a0e" stroke-width="6" stroke-dasharray="4 4" opacity="0.75"></circle>
          <circle cx="0" cy="0" r="26" fill="url(#bioMicroscopeShell)"></circle>
          <circle cx="0" cy="0" r="18" fill="url(#bioMicroscopeDark)" filter="url(#bioMicroscopeShadow)"></circle>
          <circle cx="0" cy="0" r="16" fill="none" stroke="#080a0e" stroke-width="4" stroke-dasharray="2 2" opacity="0.8"></circle>
          <circle cx="0" cy="0" r="9" fill="#10131a"></circle>
        </g>
      </svg>
    `;
  }

  function renderOnionObservation({ stained, objectiveId }) {
    const scale = objectiveId === "high" ? 1.82 : 1.16;
    const wallColor = stained ? "#8b5a2b" : "#94d7b1";
    const cytoplasm = stained ? "rgba(245,209,168,0.52)" : "rgba(229,255,240,0.18)";
    const nucleus = stained ? "#5a371f" : "#178c62";
    const backdrop = stained ? "rgba(252,238,212,0.68)" : "rgba(213,255,232,0.18)";
    const cells = [
      { x: 18, y: 18, w: 94, h: 76, nx: 38, ny: 42 },
      { x: 112, y: 14, w: 98, h: 80, nx: 138, ny: 40 },
      { x: 210, y: 18, w: 100, h: 76, nx: 286, ny: 50 },
      { x: 26, y: 96, w: 90, h: 82, nx: 42, ny: 126 },
      { x: 120, y: 98, w: 100, h: 80, nx: 196, ny: 122 },
      { x: 222, y: 100, w: 90, h: 80, nx: 238, ny: 126 },
      { x: 34, y: 180, w: 94, h: 78, nx: 112, ny: 206 },
      { x: 132, y: 182, w: 94, h: 78, nx: 150, ny: 210 },
      { x: 228, y: 184, w: 88, h: 74, nx: 298, ny: 212 }
    ];

    return `
      <svg viewBox="0 0 340 280" preserveAspectRatio="xMidYMid meet" class="bio-microscope-lab__sampleSvg" aria-hidden="true">
        <defs>
          <radialGradient id="bioOnionField" cx="50%" cy="48%" r="72%">
            <stop offset="0%" stop-color="rgba(255,255,255,0.30)"></stop>
            <stop offset="100%" stop-color="rgba(255,255,255,0)"></stop>
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="340" height="280" fill="${backdrop}"></rect>
        <rect x="0" y="0" width="340" height="280" fill="url(#bioOnionField)"></rect>
        <g transform="translate(170 140) scale(${scale}) translate(-170 -140)">
          ${cells.map(cell => `
            <g>
              <rect x="${cell.x}" y="${cell.y}" width="${cell.w}" height="${cell.h}" rx="10" fill="${cytoplasm}" stroke="${wallColor}" stroke-width="3"></rect>
              <ellipse cx="${cell.x + cell.w * 0.56}" cy="${cell.y + cell.h * 0.48}" rx="${cell.w * 0.32}" ry="${cell.h * 0.22}" fill="rgba(255,255,255,0.24)"></ellipse>
              <circle cx="${cell.nx}" cy="${cell.ny}" r="9" fill="${nucleus}" opacity="0.86"></circle>
            </g>
          `).join("")}
        </g>
      </svg>
    `;
  }

  function renderCheekObservation({ stained, objectiveId }) {
    const scale = objectiveId === "high" ? 2.16 : 1.22;
    const membrane = stained ? "#7f9bb8" : "#c3d7e8";
    const nucleus = stained ? "#23374d" : "#5d7f9d";
    const backdrop = stained ? "rgba(236,244,252,0.82)" : "rgba(221,236,247,0.24)";
    const cells = [
      { x: 74, y: 80, r: -14, s: 1.08, path: "M -30 -18 C -14 -42, 22 -38, 38 -12 C 50 8, 32 36, 4 40 C -18 42, -42 24, -44 2 C -46 -10, -40 -18, -30 -18 Z" },
      { x: 170, y: 70, r: 16, s: 1.02, path: "M -28 -22 C -8 -42, 26 -34, 42 -8 C 54 12, 34 42, 2 42 C -20 42, -42 28, -44 4 C -46 -8, -40 -18, -28 -22 Z" },
      { x: 238, y: 122, r: -28, s: 0.94, path: "M -30 -16 C -8 -40, 28 -32, 40 -8 C 50 10, 34 38, 4 40 C -22 42, -44 20, -42 -2 C -40 -10, -36 -14, -30 -16 Z" },
      { x: 128, y: 178, r: 26, s: 1.08, path: "M -34 -14 C -10 -42, 30 -38, 46 -4 C 58 18, 30 42, -2 40 C -26 40, -50 16, -48 -4 C -46 -10, -42 -12, -34 -14 Z" },
      { x: 228, y: 192, r: 8, s: 0.92, path: "M -28 -16 C -6 -38, 24 -32, 40 -6 C 50 10, 34 34, 6 38 C -18 40, -42 22, -42 2 C -42 -6, -38 -12, -28 -16 Z" }
    ];

    return `
      <svg viewBox="0 0 320 260" preserveAspectRatio="xMidYMid meet" class="bio-microscope-lab__sampleSvg" aria-hidden="true">
        <defs>
          <radialGradient id="bioCheekField" cx="50%" cy="50%" r="72%">
            <stop offset="0%" stop-color="rgba(255,255,255,0.34)"></stop>
            <stop offset="100%" stop-color="rgba(255,255,255,0)"></stop>
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="320" height="260" fill="${backdrop}"></rect>
        <rect x="0" y="0" width="320" height="260" fill="url(#bioCheekField)"></rect>
        <g transform="translate(160 130) scale(${scale}) translate(-160 -130)">
          ${cells.map(cell => `
            <g transform="translate(${cell.x} ${cell.y}) rotate(${cell.r}) scale(${cell.s})">
              <path d="${cell.path}" fill="rgba(255,255,255,0.09)" stroke="${membrane}" stroke-width="2.5"></path>
              <circle cx="6" cy="2" r="9" fill="${nucleus}" opacity="0.92"></circle>
              <circle cx="3" cy="0" r="2.4" fill="rgba(15,23,42,0.66)"></circle>
            </g>
          `).join("")}
          <circle cx="264" cy="212" r="18" fill="none" stroke="rgba(71,85,105,0.36)" stroke-width="2"></circle>
          <circle cx="258" cy="206" r="12" fill="none" stroke="rgba(71,85,105,0.22)" stroke-width="1"></circle>
        </g>
      </svg>
    `;
  }

  function renderObservationSvg(options) {
    if (options.specimenId === "cheek") {
      return renderCheekObservation(options);
    }
    return renderOnionObservation(options);
  }

  window.BIO_VISUAL_SCENES["j7a_m02"] = {
    mount(container, context) {
      const config = normalizeConfig(context && context.config);
      const phaseList = config.phases;
      const prepSequence = config.prepSequence;
      const specimens = config.specimens;
      const objectives = config.objectives;
      const specimenMap = Object.fromEntries(specimens.map(item => [item.id, item]));
      const objectiveMap = Object.fromEntries(objectives.map(item => [item.id, item]));
      const terminalPrepIndex = Math.max(0, prepSequence.length - 1);
      const defaultObjectiveId = objectives[0]?.id || "low";
      let layoutMode = getLayoutMode(container);
      let resizeObserver = null;
      let modelViewerLoadCancelled = false;

      const state = {
        phase: "select",
        specimenId: null,
        prepStep: 0,
        slidePlaced: false,
        lightOn: false,
        objectiveId: defaultObjectiveId,
        coarseFocus: 14,
        fineFocus: 50,
        showRealImage: false,
        showMicroscopeModel: false
      };

      function getBasePath() {
        return context?.sceneEntry?.folder ? `${context.sceneEntry.folder}/` : "";
      }

      function resolveAssetPath(path) {
        if (!path) return "";
        if (/^(?:https?:)?\/\//i.test(path) || /^(?:data|blob):/i.test(path)) return path;
        return `${getBasePath()}${path}`;
      }

      function resolveModelPath(path) {
        const modelSource = {
          desktop: resolveAssetPath(path),
          tablet: resolveAssetPath(path).replace(/\.glb(?:([?#].*)?)$/i, ".tablet.glb$1"),
          mobile: resolveAssetPath(path).replace(/\.glb(?:([?#].*)?)$/i, ".mobile.glb$1")
        };
        if (window.BiologyApp && typeof window.BiologyApp.resolveBiologyModelVariantSource === "function") {
          return window.BiologyApp.resolveBiologyModelVariantSource(modelSource);
        }
        return modelSource.desktop;
      }

      function getActiveSpecimen() {
        return state.specimenId ? specimenMap[state.specimenId] : null;
      }

      function getObjective() {
        return objectiveMap[state.objectiveId] || objectives[0];
      }

      function isPreparationComplete() {
        return state.prepStep >= terminalPrepIndex;
      }

      function isStained() {
        return state.prepStep >= Math.max(terminalPrepIndex - 1, 0);
      }

      function resetMicroscopeState() {
        state.slidePlaced = false;
        state.lightOn = false;
        state.objectiveId = defaultObjectiveId;
        state.coarseFocus = 14;
        state.fineFocus = 50;
        state.showRealImage = false;
        state.showMicroscopeModel = false;
      }

      function chooseSpecimen(specimenId) {
        if (!specimenMap[specimenId]) return;
        state.specimenId = specimenId;
        state.phase = "prep";
        state.prepStep = 0;
        resetMicroscopeState();
        render();
      }

      function goPhase(phaseId) {
        if (phaseId === "select") {
          state.phase = "select";
          render();
          return;
        }
        if (phaseId === "prep" && state.specimenId) {
          state.phase = "prep";
          render();
          return;
        }
        if (phaseId === "microscope" && state.specimenId && isPreparationComplete()) {
          state.phase = "microscope";
          render();
        }
      }

      function getActualFocus() {
        return state.coarseFocus + (state.fineFocus - 50) * 0.12;
      }

      function getBlurAmount() {
        if (!state.lightOn || !state.slidePlaced) return 0;
        const focusDiff = Math.abs(50 - getActualFocus());
        const blur = state.objectiveId === "high" ? focusDiff * 1.9 : focusDiff * 0.42;
        return clamp(blur, 0, 24);
      }

      function isPerfectFocus() {
        return state.lightOn && state.slidePlaced && getBlurAmount() < 1.35;
      }

      function getGuideItems(specimen) {
        const items = [];

        if (!state.slidePlaced) {
          items.push("先将装片固定在载物台中央。");
        }
        if (!state.lightOn) {
          items.push("打开光源后再观察视野。");
        }
        if (state.objectiveId === "high") {
          items.push("高倍镜下只调细准焦，缓慢微调到清晰。");
        } else {
          items.push("先用低倍镜把物像移到视野中央。");
        }
        if (state.slidePlaced && state.lightOn && getBlurAmount() > 10) {
          items.push("如果视野仍很模糊，先回低倍镜重新找像。");
        }
        items.push(specimen.focusHint);

        return items.slice(0, layoutMode === "tight" ? 3 : 4);
      }

      function getPromptText(specimen) {
        if (!state.slidePlaced) return "请先把制作完成的装片放到载物台中央。";
        if (!state.lightOn) return "请先打开光源，让视野变亮。";
        if (isPerfectFocus()) return `聚焦成功，可以开始识别${specimen.shortLabel}的结构特征。`;
        if (state.objectiveId === "high") return "高倍镜下只能使用细准焦，轻微调节直到结构边界清晰。";
        return "请继续调节粗准焦和细准焦，把物像调清楚。";
      }

      function getFocusSummary(specimen, objective) {
        return {
          specimen,
          objective,
          perfectFocus: isPerfectFocus(),
          blurAmount: getBlurAmount(),
          scale: objective.id === "high" ? 2.38 : 1.16,
          statusLabel: isPerfectFocus() ? "聚焦成功" : "调焦中",
          prompt: getPromptText(specimen)
        };
      }

      function buildPhaseChip(phase) {
        const activeSpecimen = getActiveSpecimen();
        let status = "locked";

        if (phase.id === "select") {
          status = state.phase === "select" ? "active" : activeSpecimen ? "complete" : "active";
        } else if (phase.id === "prep") {
          if (!activeSpecimen) {
            status = "locked";
          } else if (state.phase === "prep") {
            status = "active";
          } else {
            status = isPreparationComplete() || state.phase === "microscope" ? "complete" : "available";
          }
        } else if (phase.id === "microscope") {
          if (!activeSpecimen || !isPreparationComplete()) {
            status = "locked";
          } else if (state.phase === "microscope") {
            status = "active";
          } else {
            status = "available";
          }
        }

        return `
          <button
            class="bio-microscope-lab__phaseChip bio-microscope-lab__phaseChip--${status}"
            data-action="go-phase"
            data-phase="${escapeHtml(phase.id)}"
            ${status === "locked" ? "disabled" : ""}
          >
            <span class="bio-microscope-lab__phaseIndex">${escapeHtml(String(phaseList.findIndex(item => item.id === phase.id) + 1))}</span>
            <span>${escapeHtml(phase.label)}</span>
          </button>
        `;
      }

      function buildTopbar() {
        const activeSpecimen = getActiveSpecimen();
        const accent = activeSpecimen?.accent || "#6ee7b7";
        return `
          <div class="bio-microscope-lab__topbar">
            <div class="bio-microscope-lab__phaseBar">
              ${phaseList.map(buildPhaseChip).join("")}
            </div>
            <div class="bio-microscope-lab__topbarActions">
              ${activeSpecimen ? `
                <div class="bio-microscope-lab__metaChip" style="--accent:${accent}">
                  <span class="bio-microscope-lab__metaChipDot"></span>
                  <span>${escapeHtml(activeSpecimen.shortLabel)}</span>
                </div>
              ` : `
                <div class="bio-microscope-lab__metaChip" style="--accent:#6ee7b7">
                  <span class="bio-microscope-lab__metaChipDot"></span>
                  <span>显微镜与细胞观察</span>
                </div>
              `}
            </div>
          </div>
        `;
      }

      function buildSelectPhase() {
        return `
          <div class="bio-microscope-lab__selectLayout">
            <div class="bio-microscope-lab__introPanel">
              <div class="bio-microscope-lab__eyebrow">显微观察任务</div>
              <div class="bio-microscope-lab__introTitle">先选择标本，再进入装片制作和显微观察流程。</div>
              <div class="bio-microscope-lab__introText">本课件保留了标本选择、临时装片制作、显微镜操作与细胞结构识别的完整核心流程。</div>
            </div>

            <div class="bio-microscope-lab__specimenGrid">
              ${specimens.map(specimen => `
                <button
                  class="bio-microscope-lab__specimenCard ${state.specimenId === specimen.id ? "is-selected" : ""}"
                  data-action="choose-specimen"
                  data-specimen="${escapeHtml(specimen.id)}"
                  style="--accent:${escapeHtml(specimen.accent)}"
                >
                  <div class="bio-microscope-lab__specimenVisual">
                    ${renderSpecimenGlyph(specimen.id, specimen.accent)}
                  </div>
                  <div class="bio-microscope-lab__specimenType">${escapeHtml(specimen.type)}</div>
                  <div class="bio-microscope-lab__specimenTitle">${escapeHtml(specimen.label)}</div>
                  <div class="bio-microscope-lab__specimenSummary">${escapeHtml(specimen.summary)}</div>
                  <div class="bio-microscope-lab__bulletGroup">
                    ${renderDotList(specimen.targets)}
                  </div>
                  <div class="bio-microscope-lab__specimenAction">进入装片制作</div>
                </button>
              `).join("")}
            </div>
          </div>
        `;
      }

      function buildPrepPhase(specimen) {
        const progress = terminalPrepIndex > 0 ? (state.prepStep / terminalPrepIndex) * 100 : 0;
        const isOnion = specimen.id === "onion";

        return `
          <div class="bio-microscope-lab__prepLayout">
            <div class="bio-microscope-lab__panel">
              <div class="bio-microscope-lab__panelHead">
                <div>
                  <div class="bio-microscope-lab__eyebrow">装片模拟区</div>
                  <div class="bio-microscope-lab__panelTitle">临时装片制作</div>
                </div>
                <div class="bio-microscope-lab__metaChip" style="--accent:${escapeHtml(specimen.accent)}">
                  <span class="bio-microscope-lab__metaChipDot"></span>
                  <span>${escapeHtml(specimen.shortLabel)}</span>
                </div>
              </div>

              <div class="bio-microscope-lab__prepStage">
                <div class="bio-microscope-lab__glassSlideLabel">载玻片</div>
                <div class="bio-microscope-lab__glassSlide">
                  ${state.prepStep >= 1 ? `<div class="bio-microscope-lab__prepLiquid"></div>` : ""}
                  ${state.prepStep >= 2 ? `
                    <div class="bio-microscope-lab__prepSample ${isOnion ? "bio-microscope-lab__prepSample--onion" : "bio-microscope-lab__prepSample--cheek"}"></div>
                  ` : ""}
                  ${state.prepStep >= 3 ? `<div class="bio-microscope-lab__coverSlip"></div>` : ""}
                  ${state.prepStep >= 4 ? `<div class="bio-microscope-lab__stainHalo"></div>` : ""}
                </div>
                <div class="bio-microscope-lab__prepHint">${escapeHtml(specimen.focusHint)}</div>
              </div>

              <div class="bio-microscope-lab__progressCard">
                <div class="bio-microscope-lab__progressMeta">
                  <span>当前进度</span>
                  <strong>${escapeHtml(prepSequence[state.prepStep]?.label || prepSequence[0]?.label || "")}</strong>
                </div>
                <div class="bio-microscope-lab__progressTrack">
                  <div class="bio-microscope-lab__progressFill" style="width:${progress.toFixed(2)}%; --accent:${escapeHtml(specimen.accent)}"></div>
                </div>
              </div>
            </div>

            <div class="bio-microscope-lab__panel">
              <div class="bio-microscope-lab__panelHead">
                <div>
                  <div class="bio-microscope-lab__eyebrow">操作步骤</div>
                  <div class="bio-microscope-lab__panelTitle">${escapeHtml(prepSequence[state.prepStep]?.label || "")}</div>
                </div>
              </div>

              <div class="bio-microscope-lab__instructionCard">
                ${escapeHtml(specimen.prepSteps[state.prepStep] || specimen.prepSteps[0] || "")}
              </div>

              <div class="bio-microscope-lab__stepGrid">
                ${prepSequence.map((step, index) => {
                  const status = index < state.prepStep ? "done" : index === state.prepStep ? "active" : "pending";
                  return `
                    <div class="bio-microscope-lab__stepCard bio-microscope-lab__stepCard--${status}">
                      <span class="bio-microscope-lab__stepIndex">${index + 1}</span>
                      <span>${escapeHtml(step.label)}</span>
                    </div>
                  `;
                }).join("")}
              </div>

              <div class="bio-microscope-lab__bulletGroup bio-microscope-lab__bulletGroup--soft">
                ${renderDotList(specimen.targets)}
              </div>

              <div class="bio-microscope-lab__actionRow">
                <button
                  class="bio-microscope-lab__ghostButton"
                  data-action="prep-prev"
                  ${state.prepStep === 0 ? "disabled" : ""}
                >上一步</button>

                ${state.prepStep < terminalPrepIndex ? `
                  <button class="bio-microscope-lab__primaryButton" data-action="prep-next" style="--accent:${escapeHtml(specimen.accent)}">
                    执行当前步骤
                  </button>
                ` : `
                  <button class="bio-microscope-lab__primaryButton" data-action="enter-microscope" style="--accent:${escapeHtml(specimen.accent)}">
                    进入显微镜观察
                  </button>
                `}
              </div>
            </div>
          </div>
        `;
      }

      function buildStatusPills(summary) {
        return `
          <div class="bio-microscope-lab__statusPill ${state.slidePlaced ? "is-on" : ""}">${state.slidePlaced ? "装片已放置" : "等待放置装片"}</div>
          <div class="bio-microscope-lab__statusPill ${state.lightOn ? "is-on" : ""}">${state.lightOn ? "光源已开启" : "光源未开启"}</div>
          <div class="bio-microscope-lab__statusPill ${summary.perfectFocus ? "is-on" : ""}">${summary.statusLabel}</div>
        `;
      }

      function buildObservationOverlay(summary) {
        if (!state.slidePlaced) {
          return `<div class="bio-microscope-lab__overlayMessage">请先放置装片</div>`;
        }
        if (!state.lightOn) {
          return `<div class="bio-microscope-lab__overlayMessage">请先打开光源</div>`;
        }
        if (summary.blurAmount > 10 && !summary.perfectFocus) {
          return `<div class="bio-microscope-lab__overlayMessage bio-microscope-lab__overlayMessage--warn">视野较模糊，请继续调焦</div>`;
        }
        if (summary.perfectFocus) {
          return `
            <button class="bio-microscope-lab__zoomRealBtn" data-action="view-real-image" title="查看真实显微实拍图">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <line x1="11" y1="8" x2="11" y2="14"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
              </svg>
              <span>查看真实教具图</span>
            </button>
          `;
        }
        return "";
      }

      function buildInsightItems(summary) {
        const items = summary.perfectFocus
          ? summary.specimen.analysis.slice(0, layoutMode === "tight" ? 3 : 4)
          : getGuideItems(summary.specimen);
        return renderDotList(items);
      }

      function buildMicroscopePhase(specimen) {
        const objective = getObjective();
        const summary = getFocusSummary(specimen, objective);

        return `
          <div class="bio-microscope-lab__microscopeLayout">
            <div class="bio-microscope-lab__panel bio-microscope-lab__panel--control">
              <div class="bio-microscope-lab__panelHead">
                <div>
                  <div class="bio-microscope-lab__eyebrow">操作面板</div>
                  <div class="bio-microscope-lab__panelTitle">显微镜控制</div>
                </div>
                <div class="bio-microscope-lab__metaChip" style="--accent:${escapeHtml(specimen.accent)}">
                  <span class="bio-microscope-lab__metaChipDot"></span>
                  <span>${escapeHtml(objective.label)}</span>
                </div>
              </div>

              <button class="bio-microscope-lab__microscopeFigure" type="button" data-role="microscope-figure" data-action="view-microscope-model" aria-label="打开显微镜 3D 模型">
                ${renderMicroscopeSvg({
                  objectiveId: state.objectiveId,
                  lightOn: state.lightOn,
                  slidePlaced: state.slidePlaced,
                  coarseFocus: state.coarseFocus,
                  accent: specimen.accent
                })}
                <span class="bio-microscope-lab__modelHint">点击观察 3D 显微镜</span>
              </button>

              <div class="bio-microscope-lab__actionGrid">
                <button class="bio-microscope-lab__toggleButton ${state.slidePlaced ? "is-on" : ""}" data-action="place-slide">
                  ${state.slidePlaced ? "移除装片" : "放置装片"}
                </button>
                <button class="bio-microscope-lab__toggleButton ${state.lightOn ? "is-on" : ""}" data-action="toggle-light">
                  ${state.lightOn ? "关闭光源" : "打开光源"}
                </button>
              </div>

              <div class="bio-microscope-lab__objectiveRow">
                ${objectives.map(item => `
                  <button
                    class="bio-microscope-lab__objectiveButton ${state.objectiveId === item.id ? "is-active" : ""}"
                    data-action="set-objective"
                    data-objective="${escapeHtml(item.id)}"
                    style="--accent:${escapeHtml(specimen.accent)}"
                  >
                    <span>${escapeHtml(item.label)}</span>
                    <strong>${escapeHtml(item.magnification)}</strong>
                  </button>
                `).join("")}
              </div>

              <div class="bio-microscope-lab__focusCard">
                <div class="bio-microscope-lab__focusRow">
                  <div class="bio-microscope-lab__focusMeta">
                    <span>粗准焦</span>
                    <strong data-role="coarse-value">${escapeHtml(String(state.coarseFocus))}</strong>
                  </div>
                  <input
                    class="bio-microscope-lab__slider"
                    type="range"
                    min="0"
                    max="100"
                    value="${escapeHtml(String(state.coarseFocus))}"
                    data-focus-control="coarse"
                    style="accent-color:${escapeHtml(specimen.accent)}"
                    ${state.objectiveId === "high" ? "disabled" : ""}
                  />
                </div>
                <div class="bio-microscope-lab__focusNote" data-role="coarse-note">
                  ${state.objectiveId === "high" ? "高倍镜下禁用粗准焦，请改用细准焦。" : "低倍镜下先用粗准焦找像。"}
                </div>

                <div class="bio-microscope-lab__focusRow">
                  <div class="bio-microscope-lab__focusMeta">
                    <span>细准焦</span>
                    <strong data-role="fine-value">${escapeHtml(String(state.fineFocus))}</strong>
                  </div>
                  <input
                    class="bio-microscope-lab__slider"
                    type="range"
                    min="0"
                    max="100"
                    value="${escapeHtml(String(state.fineFocus))}"
                    data-focus-control="fine"
                    style="accent-color:${escapeHtml(specimen.accent)}"
                  />
                </div>
              </div>

              <div class="bio-microscope-lab__ruleCard">
                ${renderDotList(config.operationRules)}
              </div>
            </div>

            <div class="bio-microscope-lab__panel bio-microscope-lab__panel--view">
              <div class="bio-microscope-lab__viewTop">
                <div>
                  <div class="bio-microscope-lab__eyebrow">显微视野</div>
                  <div class="bio-microscope-lab__panelTitle" data-role="view-title">${escapeHtml(specimen.shortLabel)} · ${escapeHtml(objective.magnification)}</div>
                </div>
                <div data-role="focus-badge">
                  ${summary.perfectFocus ? `<div class="bio-microscope-lab__focusBadge" style="--accent:${escapeHtml(specimen.accent)}">聚焦成功</div>` : ""}
                </div>
              </div>

              <div class="bio-microscope-lab__statusRow" data-role="status-pills">
                ${buildStatusPills(summary)}
              </div>

              <div class="bio-microscope-lab__eyepieceShell">
                <div class="bio-microscope-lab__eyepiece">
                  <div class="bio-microscope-lab__eyepieceGlow" style="opacity:${state.lightOn ? "1" : "0.18"}"></div>
                  <div class="bio-microscope-lab__eyepieceCrossX"></div>
                  <div class="bio-microscope-lab__eyepieceCrossY"></div>
                  <div
                    class="bio-microscope-lab__sampleLayer"
                    data-role="observation-layer"
                    style="opacity:${state.lightOn && state.slidePlaced ? "1" : "0"}; transform:scale(${summary.scale}); filter:blur(${summary.blurAmount.toFixed(2)}px);"
                  >
                    ${renderObservationSvg({
                      specimenId: specimen.id,
                      stained: isStained(),
                      objectiveId: objective.id
                    })}
                  </div>
                  <div class="bio-microscope-lab__dustLayer" aria-hidden="true">
                    <span></span><span></span><span></span><span></span>
                  </div>
                  <div data-role="observation-overlay">
                    ${buildObservationOverlay(summary)}
                  </div>
                </div>
              </div>

              <div class="bio-microscope-lab__insightCard">
                <div class="bio-microscope-lab__insightHead">
                  <div class="bio-microscope-lab__eyebrow" data-role="insight-title">${summary.perfectFocus ? "结构解析" : "观察提示"}</div>
                  <div class="bio-microscope-lab__insightPrompt" data-role="prompt-text">${escapeHtml(summary.prompt)}</div>
                </div>
                <div class="bio-microscope-lab__bulletGroup bio-microscope-lab__bulletGroup--soft" data-role="insight-list">
                  ${buildInsightItems(summary)}
                </div>
                <div class="bio-microscope-lab__tipLine" data-role="objective-tip">${escapeHtml(objective.tip)}</div>
              </div>
            </div>
          </div>
        `;
      }

      function buildPhaseContent() {
        const specimen = getActiveSpecimen();
        if (state.phase === "select" || !specimen) {
          return buildSelectPhase();
        }
        if (state.phase === "prep") {
          return buildPrepPhase(specimen);
        }
        return buildMicroscopePhase(specimen);
      }

      function buildMicroscopeModelModal() {
        const modelSrc = resolveModelPath("assets/models/microscope.glb?v=2913da270ca8");
        return `
          <div class="bio-microscope-lab__modelModal" data-action="close-microscope-model-bg">
            <div class="bio-microscope-lab__modelDialog" role="dialog" aria-modal="true" aria-label="显微镜 3D 模型观察窗">
              <div class="bio-microscope-lab__modelHeader">
                <div>
                  <div class="bio-microscope-lab__eyebrow">3D MODEL VIEWER</div>
                  <div class="bio-microscope-lab__modelTitle">显微镜结构模型</div>
                </div>
                <button class="bio-microscope-lab__modelClose" type="button" data-action="close-microscope-model" aria-label="关闭 3D 模型">×</button>
              </div>
              <div class="bio-microscope-lab__modelViewport">
                <model-viewer
                  class="bio-microscope-lab__modelViewer"
                  src="${escapeHtml(modelSrc)}"
                  camera-controls
                  auto-rotate
                  interaction-prompt="none"
                  shadow-intensity="0.85"
                  exposure="1"
                  environment-image="neutral"
                  loading="eager"
                  field-of-view="38deg"
                  min-field-of-view="14deg"
                  max-field-of-view="78deg"
                  camera-orbit="35deg 68deg 115%"
                  alt="显微镜 3D 模型">
                  <div class="bio-microscope-lab__modelLoading" slot="poster">模型加载中...</div>
                </model-viewer>
              </div>
              <div class="bio-microscope-lab__modelFooter">
                <span>拖拽旋转</span>
                <span>滚轮缩放</span>
                <span>双击复位视角</span>
              </div>
            </div>
          </div>
        `;
      }

      function getStyles() {
        return `
          .bio-microscope-lab {
            --accent: #6ee7b7;
            --panel-bg: rgba(8, 12, 16, 0.84);
            --panel-soft: rgba(255, 255, 255, 0.04);
            --line: rgba(255, 255, 255, 0.08);
            --line-strong: rgba(255, 255, 255, 0.16);
            --text: #f8fafc;
            --muted: rgba(248, 250, 252, 0.66);
            width: 100%;
            height: 100%;
            min-width: 0;
            min-height: 0;
            display: grid;
            grid-template-rows: auto minmax(0, 1fr);
            gap: 12px;
            padding: 14px;
            box-sizing: border-box;
            overflow: hidden;
            color: var(--text);
            font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
            background:
              radial-gradient(circle at 18% 16%, rgba(110, 231, 183, 0.12), transparent 24%),
              radial-gradient(circle at 86% 10%, rgba(125, 211, 252, 0.12), transparent 22%),
              linear-gradient(180deg, rgba(11, 17, 23, 0.98), rgba(3, 5, 8, 0.98));
          }

          .bio-microscope-lab[data-layout="compact"] {
            gap: 10px;
            padding: 12px;
          }

          .bio-microscope-lab[data-layout="tight"] {
            gap: 8px;
            padding: 10px;
          }

          .bio-microscope-lab * {
            box-sizing: border-box;
          }

          .bio-microscope-lab button,
          .bio-microscope-lab input {
            font: inherit;
          }

          .bio-microscope-lab__topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            min-width: 0;
          }

          .bio-microscope-lab__phaseBar {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            min-width: 0;
          }

          .bio-microscope-lab__topbarActions {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
            justify-content: flex-end;
          }

          .bio-microscope-lab__phaseChip,
          .bio-microscope-lab__metaChip,
          .bio-microscope-lab__ghostButton,
          .bio-microscope-lab__primaryButton,
          .bio-microscope-lab__toggleButton,
          .bio-microscope-lab__objectiveButton,
          .bio-microscope-lab__specimenCard {
            border: 1px solid var(--line);
            background: var(--panel-soft);
            color: var(--text);
          }

          .bio-microscope-lab__phaseChip {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            min-height: var(--bio-touch-target, 44px);
            padding: 8px 12px;
            border-radius: 999px;
            cursor: pointer;
            transition: 180ms ease;
          }

          .bio-microscope-lab__phaseChip:disabled {
            cursor: not-allowed;
            opacity: 0.42;
          }

          .bio-microscope-lab__phaseChip--active {
            border-color: rgba(110, 231, 183, 0.56);
            background: rgba(110, 231, 183, 0.12);
          }

          .bio-microscope-lab__phaseChip--complete,
          .bio-microscope-lab__phaseChip--available {
            background: rgba(255, 255, 255, 0.05);
          }

          .bio-microscope-lab__phaseIndex {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: inline-grid;
            place-items: center;
            background: rgba(255, 255, 255, 0.08);
            font-size: 11px;
            font-weight: 700;
          }

          .bio-microscope-lab__metaChip {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            border-radius: 999px;
            padding: 8px 12px;
            color: rgba(248, 250, 252, 0.88);
            font-size: 12px;
          }

          .bio-microscope-lab__metaChipDot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--accent);
            box-shadow: 0 0 14px var(--accent);
          }

          .bio-microscope-lab__ghostButton,
          .bio-microscope-lab__primaryButton,
          .bio-microscope-lab__toggleButton,
          .bio-microscope-lab__objectiveButton {
            border-radius: 18px;
            min-height: var(--bio-touch-target, 44px);
            padding: 10px 14px;
            cursor: pointer;
            transition: 180ms ease;
          }

          .bio-microscope-lab__ghostButton:hover:not(:disabled),
          .bio-microscope-lab__toggleButton:hover:not(:disabled),
          .bio-microscope-lab__objectiveButton:hover:not(:disabled),
          .bio-microscope-lab__specimenCard:hover {
            border-color: var(--line-strong);
            transform: translateY(-1px);
          }

          .bio-microscope-lab__ghostButton:disabled,
          .bio-microscope-lab__primaryButton:disabled {
            opacity: 0.38;
            cursor: not-allowed;
          }

          .bio-microscope-lab__primaryButton {
            border-color: transparent;
            background: var(--accent);
            color: #03110e;
            font-weight: 700;
          }

          .bio-microscope-lab__toggleButton.is-on,
          .bio-microscope-lab__objectiveButton.is-active {
            border-color: rgba(110, 231, 183, 0.48);
            background: rgba(110, 231, 183, 0.14);
          }

          .bio-microscope-lab__body,
          .bio-microscope-lab__selectLayout,
          .bio-microscope-lab__prepLayout,
          .bio-microscope-lab__microscopeLayout {
            width: 100%;
            min-width: 0;
            min-height: 0;
            height: 100%;
          }

          .bio-microscope-lab__body {
            overflow: hidden;
          }

          .bio-microscope-lab__selectLayout {
            display: grid;
            grid-template-rows: auto minmax(0, 1fr);
            gap: 12px;
          }

          .bio-microscope-lab__introPanel,
          .bio-microscope-lab__panel {
            border: 1px solid var(--line);
            border-radius: 26px;
            background: var(--panel-bg);
            backdrop-filter: blur(18px);
            min-height: 0;
          }

          .bio-microscope-lab__introPanel {
            padding: 18px 20px;
          }

          .bio-microscope-lab__eyebrow {
            font-size: 10px;
            letter-spacing: 0.24em;
            text-transform: uppercase;
            color: rgba(248, 250, 252, 0.42);
            margin-bottom: 8px;
          }

          .bio-microscope-lab__introTitle,
          .bio-microscope-lab__panelTitle {
            font-size: 24px;
            line-height: 1.12;
            font-weight: 700;
            margin: 0;
          }

          .bio-microscope-lab__introText {
            margin-top: 8px;
            color: var(--muted);
            font-size: 14px;
            line-height: 1.75;
            max-width: 820px;
          }

          .bio-microscope-lab__specimenGrid {
            min-height: 0;
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }

          .bio-microscope-lab__specimenCard {
            min-height: 0;
            border-radius: 28px;
            padding: 18px;
            text-align: left;
            display: grid;
            grid-template-rows: 110px auto auto auto 1fr auto;
            gap: 10px;
            overflow: hidden;
            cursor: pointer;
            position: relative;
          }

          .bio-microscope-lab__specimenCard.is-selected {
            border-color: rgba(110, 231, 183, 0.46);
            box-shadow: inset 0 0 0 1px rgba(110, 231, 183, 0.1);
          }

          .bio-microscope-lab__specimenCard::before {
            content: "";
            position: absolute;
            inset: 0;
            background: radial-gradient(circle at top left, color-mix(in srgb, var(--accent) 22%, transparent), transparent 42%);
            opacity: 0.9;
            pointer-events: none;
          }

          .bio-microscope-lab__specimenVisual,
          .bio-microscope-lab__glyphSvg {
            width: 100%;
            height: 100%;
          }

          .bio-microscope-lab__specimenType,
          .bio-microscope-lab__glassSlideLabel {
            display: inline-flex;
            width: fit-content;
            border-radius: 999px;
            padding: 4px 10px;
            background: rgba(255, 255, 255, 0.06);
            color: rgba(248, 250, 252, 0.7);
            font-size: 11px;
          }

          .bio-microscope-lab__specimenTitle {
            font-size: 22px;
            font-weight: 700;
            line-height: 1.18;
          }

          .bio-microscope-lab__specimenSummary {
            color: var(--muted);
            font-size: 13px;
            line-height: 1.7;
          }

          .bio-microscope-lab__specimenAction {
            margin-top: auto;
            color: var(--accent);
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.12em;
          }

          .bio-microscope-lab__prepLayout {
            display: grid;
            grid-template-columns: minmax(0, 1.08fr) minmax(300px, 0.92fr);
            gap: 12px;
          }

          .bio-microscope-lab__panel {
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 18px;
            overflow: hidden;
          }

          .bio-microscope-lab__panelHead {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 10px;
          }

          .bio-microscope-lab__prepStage {
            flex: 1;
            min-height: 0;
            border-radius: 24px;
            border: 1px solid var(--line);
            background:
              radial-gradient(circle at center, rgba(255, 255, 255, 0.06), transparent 64%),
              rgba(255, 255, 255, 0.02);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 14px;
            padding: 18px;
          }

          .bio-microscope-lab__glassSlide {
            width: min(100%, 360px);
            aspect-ratio: 3 / 1;
            position: relative;
            border-radius: 22px;
            border: 1px solid rgba(255, 255, 255, 0.16);
            background:
              linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02)),
              rgba(240, 249, 255, 0.05);
            box-shadow: inset 0 0 24px rgba(255, 255, 255, 0.04);
            overflow: hidden;
          }

          .bio-microscope-lab__prepLiquid,
          .bio-microscope-lab__prepSample,
          .bio-microscope-lab__coverSlip,
          .bio-microscope-lab__stainHalo {
            position: absolute;
            transition: 220ms ease;
          }

          .bio-microscope-lab__prepLiquid {
            width: 88px;
            height: 88px;
            left: calc(50% - 44px);
            top: calc(50% - 44px);
            border-radius: 50%;
            background: rgba(96, 165, 250, 0.18);
            filter: blur(6px);
          }

          .bio-microscope-lab__prepSample {
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            background: rgba(110, 231, 183, 0.3);
          }

          .bio-microscope-lab__prepSample--onion {
            width: 40px;
            height: 28px;
            border-radius: 10px;
            border: 1px solid rgba(110, 231, 183, 0.4);
            transform: translate(-50%, -50%) rotate(12deg);
          }

          .bio-microscope-lab__prepSample--cheek {
            width: 34px;
            height: 24px;
            border-radius: 50%;
            background: rgba(248, 113, 113, 0.28);
            filter: blur(1px);
          }

          .bio-microscope-lab__coverSlip {
            width: 96px;
            height: 96px;
            left: calc(50% - 48px);
            top: calc(50% - 48px);
            border: 1px solid rgba(255, 255, 255, 0.34);
            background: rgba(255, 255, 255, 0.05);
            transform: rotate(-3deg);
            box-shadow: 3px 3px 16px rgba(255, 255, 255, 0.08);
          }

          .bio-microscope-lab__stainHalo {
            width: 110px;
            height: 110px;
            left: calc(50% - 55px);
            top: calc(50% - 55px);
            border-radius: 50%;
            background: rgba(234, 179, 8, 0.24);
            filter: blur(14px);
            mix-blend-mode: screen;
          }

          .bio-microscope-lab__prepHint,
          .bio-microscope-lab__instructionCard,
          .bio-microscope-lab__tipLine,
          .bio-microscope-lab__focusNote {
            color: var(--muted);
            font-size: 13px;
            line-height: 1.72;
          }

          .bio-microscope-lab__progressCard,
          .bio-microscope-lab__focusCard,
          .bio-microscope-lab__ruleCard,
          .bio-microscope-lab__insightCard,
          .bio-microscope-lab__instructionCard {
            border-radius: 20px;
            border: 1px solid var(--line);
            background: rgba(255, 255, 255, 0.03);
            padding: 14px 16px;
          }

          .bio-microscope-lab__progressMeta,
          .bio-microscope-lab__focusMeta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
            font-size: 12px;
            color: rgba(248, 250, 252, 0.72);
          }

          .bio-microscope-lab__progressMeta strong,
          .bio-microscope-lab__focusMeta strong {
            color: #ffffff;
          }

          .bio-microscope-lab__progressTrack {
            width: 100%;
            height: 8px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.06);
            overflow: hidden;
          }

          .bio-microscope-lab__progressFill {
            height: 100%;
            background: linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 60%, #ffffff));
            border-radius: inherit;
          }

          .bio-microscope-lab__stepGrid {
            display: grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 8px;
          }

          .bio-microscope-lab__stepCard {
            padding: 10px 8px;
            border-radius: 18px;
            border: 1px solid var(--line);
            background: rgba(255, 255, 255, 0.03);
            font-size: 12px;
            line-height: 1.5;
            text-align: center;
            color: rgba(248, 250, 252, 0.66);
          }

          .bio-microscope-lab__stepCard--active {
            border-color: rgba(110, 231, 183, 0.42);
            color: #ffffff;
            background: rgba(110, 231, 183, 0.08);
          }

          .bio-microscope-lab__stepCard--done {
            border-color: rgba(255, 255, 255, 0.16);
            color: rgba(248, 250, 252, 0.88);
          }

          .bio-microscope-lab__stepIndex {
            display: block;
            font-weight: 700;
            margin-bottom: 4px;
          }

          .bio-microscope-lab__bulletGroup {
            display: grid;
            gap: 10px;
          }

          .bio-microscope-lab__bulletGroup--soft {
            margin-top: auto;
          }

          .bio-microscope-lab__bullet {
            display: flex;
            align-items: flex-start;
            gap: 9px;
            font-size: 13px;
            line-height: 1.72;
            color: rgba(248, 250, 252, 0.82);
          }

          .bio-microscope-lab__bulletDot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--accent);
            margin-top: 8px;
            flex: none;
          }

          .bio-microscope-lab__actionRow,
          .bio-microscope-lab__objectiveRow,
          .bio-microscope-lab__statusRow {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }

          .bio-microscope-lab__actionRow {
            justify-content: flex-end;
          }

          .bio-microscope-lab__microscopeLayout {
            display: grid;
            grid-template-columns: minmax(290px, 0.92fr) minmax(0, 1.08fr);
            gap: 12px;
          }

          .bio-microscope-lab__panel--control,
          .bio-microscope-lab__panel--view {
            min-height: 0;
          }

          .bio-microscope-lab__microscopeFigure {
            flex: 1 1 148px;
            min-height: 148px;
            border-radius: 24px;
            border: 1px solid var(--line);
            background:
              radial-gradient(circle at center, rgba(255, 255, 255, 0.04), transparent 58%),
              rgba(255, 255, 255, 0.02);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 10px;
            overflow: hidden;
            position: relative;
            cursor: zoom-in;
            transition: border-color 180ms ease, background 180ms ease, transform 180ms ease;
            color: inherit;
          }

          .bio-microscope-lab__microscopeFigure:hover {
            border-color: rgba(110, 231, 183, 0.38);
            background:
              radial-gradient(circle at center, rgba(110, 231, 183, 0.08), transparent 60%),
              rgba(255, 255, 255, 0.03);
          }

          .bio-microscope-lab__microscopeFigure:focus-visible {
            outline: 2px solid rgba(110, 231, 183, 0.8);
            outline-offset: 3px;
          }

          .bio-microscope-lab__microscopeSvg {
            width: 100%;
            height: 100%;
            max-width: 260px;
            max-height: 100%;
            overflow: visible;
          }

          .bio-microscope-lab__modelHint {
            position: absolute;
            left: 50%;
            bottom: 10px;
            transform: translateX(-50%);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            max-width: calc(100% - 24px);
            min-height: 28px;
            padding: 6px 12px;
            border-radius: 999px;
            border: 1px solid rgba(110, 231, 183, 0.28);
            background: rgba(3, 7, 18, 0.62);
            color: rgba(209, 250, 229, 0.94);
            font-size: 12px;
            line-height: 1.2;
            white-space: nowrap;
            pointer-events: none;
            backdrop-filter: blur(10px);
          }

          .bio-microscope-lab__actionGrid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }

          .bio-microscope-lab__objectiveButton {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            min-width: 0;
          }

          .bio-microscope-lab__focusCard {
            display: grid;
            gap: 12px;
          }

          .bio-microscope-lab__focusRow {
            display: grid;
            gap: 8px;
          }

          .bio-microscope-lab__slider {
            width: 100%;
            margin: 0;
            cursor: pointer;
          }

          .bio-microscope-lab__slider:disabled {
            cursor: not-allowed;
            opacity: 0.45;
          }

          .bio-microscope-lab__ruleCard {
            margin-top: 0;
          }

          .bio-microscope-lab__viewTop {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
          }

          .bio-microscope-lab__focusBadge {
            border-radius: 999px;
            padding: 8px 12px;
            border: 1px solid color-mix(in srgb, var(--accent) 58%, transparent);
            background: color-mix(in srgb, var(--accent) 20%, transparent);
            color: color-mix(in srgb, var(--accent) 82%, #ffffff);
            font-size: 12px;
            font-weight: 700;
            white-space: nowrap;
          }

          .bio-microscope-lab__statusPill {
            padding: 8px 12px;
            border-radius: 999px;
            border: 1px solid var(--line);
            background: rgba(255, 255, 255, 0.03);
            color: rgba(248, 250, 252, 0.7);
            font-size: 12px;
          }

          .bio-microscope-lab__statusPill.is-on {
            border-color: rgba(110, 231, 183, 0.32);
            background: rgba(110, 231, 183, 0.08);
            color: rgba(248, 250, 252, 0.96);
          }

          .bio-microscope-lab__eyepieceShell {
            flex: 1;
            min-height: 0;
            border-radius: 28px;
            border: 1px solid var(--line);
            background:
              radial-gradient(circle at center, rgba(255, 255, 255, 0.03), transparent 60%),
              rgba(0, 0, 0, 0.42);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 12px;
            overflow: hidden;
          }

          .bio-microscope-lab__eyepiece {
            position: relative;
            width: min(100%, 350px);
            aspect-ratio: 1 / 1;
            border-radius: 50%;
            overflow: hidden;
            border: 14px solid #0b0c0f;
            background: #030405;
            box-shadow: 0 0 0 2px rgba(82, 82, 91, 0.66), 0 0 42px rgba(0, 0, 0, 0.52);
          }

          .bio-microscope-lab__eyepieceGlow,
          .bio-microscope-lab__sampleLayer,
          .bio-microscope-lab__dustLayer,
          .bio-microscope-lab__eyepieceCrossX,
          .bio-microscope-lab__eyepieceCrossY {
            position: absolute;
            inset: 0;
          }

          .bio-microscope-lab__eyepieceGlow {
            background: radial-gradient(circle at center, rgba(255, 255, 255, 0.96) 0%, rgba(224, 231, 255, 0.84) 45%, rgba(148, 163, 184, 0.44) 78%, rgba(0, 0, 0, 0.08) 100%);
            transition: opacity 180ms ease;
          }

          .bio-microscope-lab__sampleLayer {
            display: flex;
            align-items: center;
            justify-content: center;
            transition: opacity 180ms ease, filter 180ms ease, transform 180ms ease;
            transform-origin: center center;
          }

          .bio-microscope-lab__sampleSvg {
            width: 100%;
            height: 100%;
          }

          .bio-microscope-lab__eyepieceCrossX,
          .bio-microscope-lab__eyepieceCrossY {
            pointer-events: none;
            background: transparent;
          }

          .bio-microscope-lab__eyepieceCrossX::before,
          .bio-microscope-lab__eyepieceCrossY::before {
            content: "";
            position: absolute;
            background: rgba(15, 23, 42, 0.18);
          }

          .bio-microscope-lab__eyepieceCrossX::before {
            left: 0;
            right: 0;
            top: calc(50% - 0.5px);
            height: 1px;
          }

          .bio-microscope-lab__eyepieceCrossY::before {
            top: 0;
            bottom: 0;
            left: calc(50% - 0.5px);
            width: 1px;
          }

          .bio-microscope-lab__dustLayer span {
            position: absolute;
            display: block;
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: rgba(15, 23, 42, 0.18);
          }

          .bio-microscope-lab__dustLayer span:nth-child(1) { left: 20%; top: 34%; }
          .bio-microscope-lab__dustLayer span:nth-child(2) { left: 68%; top: 60%; width: 6px; height: 6px; }
          .bio-microscope-lab__dustLayer span:nth-child(3) { left: 54%; top: 78%; width: 3px; height: 3px; }
          .bio-microscope-lab__dustLayer span:nth-child(4) { left: 78%; top: 24%; width: 4px; height: 4px; }

          .bio-microscope-lab__overlayMessage {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            border-radius: 999px;
            padding: 10px 14px;
            background: rgba(3, 7, 18, 0.68);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: rgba(248, 250, 252, 0.88);
            font-size: 12px;
            white-space: nowrap;
            backdrop-filter: blur(12px);
          }

          .bio-microscope-lab__overlayMessage--warn {
            border-color: rgba(248, 113, 113, 0.36);
            color: #fca5a5;
          }

          .bio-microscope-lab__zoomRealBtn {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 20px;
            border-radius: 999px;
            background: rgba(110, 231, 183, 0.16);
            border: 1px solid rgba(110, 231, 183, 0.4);
            color: #6ee7b7;
            font-size: 14px;
            font-weight: 700;
            backdrop-filter: blur(8px);
            cursor: pointer;
            transition: 0.2s ease;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
            pointer-events: auto;
            animation: bioZoomPulse 2s infinite ease-in-out;
          }

          @keyframes bioZoomPulse {
            0% { box-shadow: 0 0 0 0 rgba(110, 231, 183, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(110, 231, 183, 0); }
            100% { box-shadow: 0 0 0 0 rgba(110, 231, 183, 0); }
          }

          .bio-microscope-lab__zoomRealBtn:hover {
            background: rgba(110, 231, 183, 0.28);
            transform: translate(-50%, -50%) scale(1.05);
          }

          .bio-microscope-lab__realImageModal {
            position: absolute;
            inset: 0;
            z-index: 100;
            background: rgba(2, 6, 12, 0.85);
            backdrop-filter: blur(12px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            animation: bioFadeIn 0.25s ease-out forwards;
          }

          @keyframes bioFadeIn {
            from { opacity: 0; transform: scale(0.98); }
            to { opacity: 1; transform: scale(1); }
          }

          .bio-microscope-lab__realImageBox {
            position: relative;
            background: #0f1218;
            border: 1px solid var(--line-strong);
            border-radius: 20px;
            padding: 16px;
            max-width: 800px;
            width: 100%;
            height: 90%;
            display: flex;
            flex-direction: column;
            gap: 16px;
            box-shadow: 0 24px 60px rgba(0, 0, 0, 0.8);
          }

          .bio-microscope-lab__modalClose {
            position: absolute;
            top: -12px;
            right: -12px;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: #ef4444;
            color: #fff;
            border: 2px solid #fff;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 10;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            transition: all 0.2s;
          }
          .bio-microscope-lab__modalClose:hover {
            transform: scale(1.1);
            background: #dc2626;
          }

          .bio-microscope-lab__realImage {
            width: 100%;
            flex: 1;
            min-height: 0;
            object-fit: contain;
            border-radius: 12px;
            background: #000;
          }

          .bio-microscope-lab__realImageCaption {
            flex-shrink: 0;
            text-align: center;
            color: rgba(248, 250, 252, 0.9);
            font-size: 15px;
          }

          .bio-microscope-lab__realImageCaption strong {
            color: var(--accent);
          }

          .bio-microscope-lab__modelModal {
            position: absolute;
            inset: 0;
            z-index: 120;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 22px;
            background: rgba(2, 6, 12, 0.86);
            backdrop-filter: blur(14px);
            animation: bioFadeIn 0.22s ease-out forwards;
          }

          .bio-microscope-lab__modelDialog {
            width: min(920px, 100%);
            height: min(650px, 100%);
            min-height: 0;
            display: grid;
            grid-template-rows: auto minmax(0, 1fr) auto;
            gap: 12px;
            border-radius: 24px;
            border: 1px solid rgba(110, 231, 183, 0.24);
            background:
              radial-gradient(circle at 26% 14%, rgba(110, 231, 183, 0.12), transparent 32%),
              linear-gradient(180deg, rgba(15, 18, 24, 0.98), rgba(5, 8, 12, 0.98));
            box-shadow: 0 28px 80px rgba(0, 0, 0, 0.78);
            padding: 16px;
            overflow: hidden;
          }

          .bio-microscope-lab__modelHeader {
            min-height: 48px;
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 14px;
          }

          .bio-microscope-lab__modelTitle {
            color: #f8fafc;
            font-size: 24px;
            line-height: 1.15;
            font-weight: 800;
          }

          .bio-microscope-lab__modelClose {
            width: 38px;
            height: 38px;
            flex: none;
            border-radius: 50%;
            border: 1px solid rgba(255, 255, 255, 0.18);
            background: rgba(255, 255, 255, 0.08);
            color: #ffffff;
            font-size: 26px;
            line-height: 1;
            display: grid;
            place-items: center;
            cursor: pointer;
            transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
          }

          .bio-microscope-lab__modelClose:hover {
            transform: scale(1.06);
            border-color: rgba(248, 113, 113, 0.54);
            background: rgba(248, 113, 113, 0.16);
          }

          .bio-microscope-lab__modelViewport {
            min-height: 0;
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            background:
              radial-gradient(circle at center, rgba(110, 231, 183, 0.1), transparent 48%),
              radial-gradient(circle at bottom, rgba(15, 23, 42, 0.9), rgba(0, 0, 0, 0.96));
            overflow: hidden;
          }

          .bio-microscope-lab__modelViewer {
            width: 100%;
            height: 100%;
            min-height: 280px;
            background: transparent;
            --poster-color: transparent;
          }

          .bio-microscope-lab__modelLoading {
            width: 100%;
            height: 100%;
            display: grid;
            place-items: center;
            color: rgba(209, 250, 229, 0.86);
            font-size: 14px;
            background: rgba(2, 6, 12, 0.72);
          }

          .bio-microscope-lab__modelFooter {
            min-height: 34px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-wrap: wrap;
            gap: 8px;
            color: rgba(209, 250, 229, 0.78);
            font-size: 12px;
          }

          .bio-microscope-lab__modelFooter span {
            display: inline-flex;
            align-items: center;
            min-height: 28px;
            padding: 6px 10px;
            border-radius: 999px;
            border: 1px solid rgba(110, 231, 183, 0.18);
            background: rgba(110, 231, 183, 0.06);
            white-space: nowrap;
          }

          .bio-microscope-lab__modalClose {
            position: absolute;
            top: -12px;
            right: -12px;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: #ef4444;
            color: white;
            border: 2px solid #0f1218;
            display: grid;
            place-items: center;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
            transition: 0.2s;
          }
          .bio-microscope-lab__modalClose:hover {
            transform: scale(1.1);
            background: #dc2626;
          }

          .bio-microscope-lab__insightCard {
            display: grid;
            gap: 10px;
          }

          .bio-microscope-lab__insightHead {
            display: grid;
            gap: 6px;
          }

          .bio-microscope-lab__insightPrompt {
            color: rgba(248, 250, 252, 0.9);
            font-size: 13px;
            line-height: 1.72;
          }

          .bio-microscope-lab[data-layout="compact"] .bio-microscope-lab__introTitle,
          .bio-microscope-lab[data-layout="compact"] .bio-microscope-lab__panelTitle {
            font-size: 22px;
          }

          .bio-microscope-lab[data-layout="compact"] .bio-microscope-lab__specimenCard {
            padding: 16px;
            grid-template-rows: 96px auto auto auto 1fr auto;
          }

          .bio-microscope-lab[data-layout="compact"] .bio-microscope-lab__microscopeFigure {
            min-height: 132px;
          }

          .bio-microscope-lab[data-layout="compact"] .bio-microscope-lab__eyepiece {
            width: min(100%, 300px);
          }

          .bio-microscope-lab[data-layout="compact"] .bio-microscope-lab__stepGrid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__topbar {
            align-items: flex-start;
            flex-direction: column;
          }

          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__phaseBar {
            gap: 6px;
          }

          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__phaseChip,
          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__metaChip {
            min-height: 40px;
            padding: 6px 9px;
            font-size: 12px;
          }

          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__phaseIndex {
            width: 18px;
            height: 18px;
          }

          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__body {
            min-height: 0;
            overflow-x: hidden;
            overflow-y: auto;
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
            padding-right: 2px;
          }

          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__body::-webkit-scrollbar {
            width: 4px;
          }

          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__body::-webkit-scrollbar-thumb {
            border-radius: 999px;
            background: rgba(148, 163, 184, 0.28);
          }

          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__specimenGrid,
          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__prepLayout,
          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__microscopeLayout {
            grid-template-columns: 1fr;
          }

          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__selectLayout,
          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__prepLayout,
          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__microscopeLayout {
            gap: 8px;
            height: auto;
            min-height: 100%;
            align-content: start;
          }

          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__selectLayout {
            display: flex;
            flex-direction: column;
          }

          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__specimenGrid {
            height: auto;
            min-height: 0;
            overflow: visible;
          }

          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__introTitle,
          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__panelTitle,
          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__specimenTitle {
            font-size: 20px;
          }

          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__panel,
          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__introPanel {
            padding: 14px;
            border-radius: 22px;
            overflow: visible;
          }

          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__specimenCard {
            border-radius: 24px;
            gap: 8px;
            min-height: 0;
            padding: 14px;
            grid-template-rows: 70px auto auto auto auto auto;
            overflow: visible;
          }

          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__specimenSummary,
          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__bullet,
          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__prepHint,
          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__instructionCard,
          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__tipLine,
          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__focusNote,
          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__insightPrompt {
            font-size: 12px;
            line-height: 1.52;
          }

          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__bulletGroup {
            gap: 6px;
          }

          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__specimenVisual {
            min-height: 0;
          }

          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__prepStage {
            flex: 0 0 auto;
            min-height: 172px;
            padding: 14px;
            gap: 10px;
          }

          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__glassSlide {
            width: min(100%, 300px);
          }

          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__microscopeFigure {
            flex: 0 0 auto;
            height: clamp(148px, 24vh, 190px);
            min-height: 0;
            padding: 8px;
          }

          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__microscopeSvg {
            max-height: calc(100% - 24px);
          }

          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__modelHint {
            min-height: 24px;
            padding: 5px 9px;
            font-size: 11px;
          }

          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__actionGrid,
          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__objectiveRow,
          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__actionRow {
            gap: 6px;
          }

          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__ghostButton,
          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__primaryButton,
          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__toggleButton,
          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__objectiveButton {
            min-height: 40px;
            border-radius: 14px;
            padding: 8px 10px;
            font-size: 12px;
          }

          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__progressCard,
          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__focusCard,
          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__ruleCard,
          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__insightCard,
          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__instructionCard {
            padding: 12px;
            border-radius: 16px;
          }

          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__stepCard {
            padding: 8px 6px;
            border-radius: 14px;
            font-size: 11px;
            line-height: 1.35;
          }

          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__eyepieceShell {
            flex: 0 0 auto;
            min-height: 252px;
            padding: 10px;
          }

          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__viewTop,
          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__panelHead {
            gap: 8px;
          }

          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__statusRow {
            gap: 6px;
          }

          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__statusPill {
            padding: 6px 9px;
            font-size: 11px;
          }

          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__zoomRealBtn {
            max-width: calc(100% - 32px);
            padding: 10px 14px;
            font-size: 12px;
            white-space: normal;
            justify-content: center;
            text-align: center;
          }

          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__modelModal {
            padding: 10px;
          }

          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__modelDialog {
            border-radius: 20px;
            padding: 12px;
            gap: 10px;
          }

          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__modelTitle {
            font-size: 20px;
          }

          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__modelViewer {
            min-height: 220px;
          }

          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__eyepiece {
            width: min(100%, 240px);
            border-width: 12px;
          }

          .bio-microscope-lab[data-layout="tight"] .bio-microscope-lab__stepGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        `;
      }

      function render() {
        const activeSpecimen = getActiveSpecimen();
        const accent = activeSpecimen?.accent || "#6ee7b7";

        container.innerHTML = `
          <style>${getStyles()}</style>
          <div class="bio-microscope-lab" data-layout="${layoutMode}" style="--accent:${escapeHtml(accent)}">
            ${buildTopbar()}
            <div class="bio-microscope-lab__body">
              ${buildPhaseContent()}
            </div>
            ${state.showRealImage ? `
              <div class="bio-microscope-lab__realImageModal" data-action="close-real-image-bg">
                <div class="bio-microscope-lab__realImageBox">
                  <button class="bio-microscope-lab__modalClose" data-action="close-real-image">✕</button>
                  <img class="bio-microscope-lab__realImage" src="assets/real-cells/${activeSpecimen.id}.png" alt="${activeSpecimen.shortLabel}真实视图" />
                  <div class="bio-microscope-lab__realImageCaption">
                     <strong>教学实拍视图</strong>：${activeSpecimen.label} (${getObjective().magnification})
                  </div>
                </div>
              </div>
            ` : ""}
            ${state.showMicroscopeModel ? buildMicroscopeModelModal() : ""}
          </div>
        `;
      }

      function syncMicroscopeDom() {
        if (state.phase !== "microscope") return;
        const specimen = getActiveSpecimen();
        if (!specimen) return;

        const objective = getObjective();
        const summary = getFocusSummary(specimen, objective);
        const coarseValue = container.querySelector('[data-role="coarse-value"]');
        const fineValue = container.querySelector('[data-role="fine-value"]');
        const microscopeFigure = container.querySelector('[data-role="microscope-figure"]');
        const observationLayer = container.querySelector('[data-role="observation-layer"]');
        const overlay = container.querySelector('[data-role="observation-overlay"]');
        const statusPills = container.querySelector('[data-role="status-pills"]');
        const focusBadge = container.querySelector('[data-role="focus-badge"]');
        const insightTitle = container.querySelector('[data-role="insight-title"]');
        const promptText = container.querySelector('[data-role="prompt-text"]');
        const insightList = container.querySelector('[data-role="insight-list"]');
        const objectiveTip = container.querySelector('[data-role="objective-tip"]');
        const coarseNote = container.querySelector('[data-role="coarse-note"]');

        if (coarseValue) coarseValue.textContent = String(state.coarseFocus);
        if (fineValue) fineValue.textContent = String(state.fineFocus);
        if (microscopeFigure) {
          microscopeFigure.innerHTML = renderMicroscopeSvg({
            objectiveId: state.objectiveId,
            lightOn: state.lightOn,
            slidePlaced: state.slidePlaced,
            coarseFocus: state.coarseFocus,
            accent: specimen.accent
          }) + '<span class="bio-microscope-lab__modelHint">点击观察 3D 显微镜</span>';
        }
        if (observationLayer) {
          observationLayer.style.opacity = state.lightOn && state.slidePlaced ? "1" : "0";
          observationLayer.style.transform = `scale(${summary.scale})`;
          observationLayer.style.filter = `blur(${summary.blurAmount.toFixed(2)}px)`;
        }
        if (overlay) overlay.innerHTML = buildObservationOverlay(summary);
        if (statusPills) statusPills.innerHTML = buildStatusPills(summary);
        if (focusBadge) {
          focusBadge.innerHTML = summary.perfectFocus
            ? `<div class="bio-microscope-lab__focusBadge" style="--accent:${escapeHtml(specimen.accent)}">聚焦成功</div>`
            : "";
        }
        if (insightTitle) insightTitle.textContent = summary.perfectFocus ? "结构解析" : "观察提示";
        if (promptText) promptText.textContent = summary.prompt;
        if (insightList) insightList.innerHTML = buildInsightItems(summary);
        if (objectiveTip) objectiveTip.textContent = objective.tip;
        if (coarseNote) {
          coarseNote.textContent = state.objectiveId === "high"
            ? "高倍镜下禁用粗准焦，请改用细准焦。"
            : "低倍镜下先用粗准焦找像。";
        }
      }

      const handleClick = event => {
        const trigger = event.target.closest("button") || event.target.closest("[data-action]");
        if (!trigger) return;

        const action = trigger.dataset.action;
        if (!action) return;

        if (action === "view-real-image") {
          state.showRealImage = true;
          render();
          return;
        }

        if (action === "view-microscope-model") {
          state.showMicroscopeModel = true;
          render();
          loadModelViewer().then(() => {
            if (modelViewerLoadCancelled || !state.showMicroscopeModel) return;
            const viewer = container.querySelector(".bio-microscope-lab__modelViewer");
            if (viewer) viewer.dismissPoster?.();
          });
          return;
        }

        if (action === "close-real-image") {
          state.showRealImage = false;
          render();
          return;
        }

        if (action === "close-real-image-bg") {
          if (event.target === trigger) {
            state.showRealImage = false;
            render();
          }
          return;
        }

        if (action === "close-microscope-model") {
          state.showMicroscopeModel = false;
          window.BiologyApp?.releaseBiologyModelViewers?.(container);
          render();
          return;
        }

        if (action === "close-microscope-model-bg") {
          if (event.target === trigger) {
            state.showMicroscopeModel = false;
            window.BiologyApp?.releaseBiologyModelViewers?.(container);
            render();
          }
          return;
        }

        if (action === "choose-specimen") {
          chooseSpecimen(trigger.dataset.specimen);
          return;
        }
        if (action === "go-phase") {
          goPhase(trigger.dataset.phase);
          return;
        }
        if (action === "prep-prev") {
          state.prepStep = clamp(state.prepStep - 1, 0, terminalPrepIndex);
          render();
          return;
        }
        if (action === "prep-next") {
          state.prepStep = clamp(state.prepStep + 1, 0, terminalPrepIndex);
          render();
          return;
        }
        if (action === "enter-microscope") {
          if (isPreparationComplete()) {
            state.phase = "microscope";
            render();
          }
          return;
        }
        if (action === "place-slide") {
          state.slidePlaced = !state.slidePlaced;
          render();
          return;
        }
        if (action === "toggle-light") {
          state.lightOn = !state.lightOn;
          render();
          return;
        }
        if (action === "set-objective" && trigger.dataset.objective) {
          state.objectiveId = trigger.dataset.objective;
          render();
          return;
        }
      };

      const handleInput = event => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) return;
        const control = target.dataset.focusControl;
        if (!control) return;

        const value = clamp(Number(target.value) || 0, 0, 100);
        if (control === "coarse") {
          if (state.objectiveId === "high") return;
          state.coarseFocus = value;
          syncMicroscopeDom();
          return;
        }
        if (control === "fine") {
          state.fineFocus = value;
          syncMicroscopeDom();
        }
      };

      const handleResize = () => {
        const nextMode = getLayoutMode(container);
        if (nextMode !== layoutMode) {
          layoutMode = nextMode;
          render();
        }
      };

      container.addEventListener("click", handleClick);
      container.addEventListener("input", handleInput);
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container);

      container.__bioSceneCleanup = () => {
        modelViewerLoadCancelled = true;
        window.BiologyApp?.releaseBiologyModelViewers?.(container);
        container.removeEventListener("click", handleClick);
        container.removeEventListener("input", handleInput);
        resizeObserver?.disconnect();
      };

      render();
    },

    unmount(container) {
      if (container.__bioSceneCleanup) {
        container.__bioSceneCleanup();
        delete container.__bioSceneCleanup;
      }
      container.innerHTML = "";
    }
  };
})();
