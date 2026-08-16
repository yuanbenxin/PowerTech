window.MATH_VISUAL_SCENES = window.MATH_VISUAL_SCENES || {};

(function () {
  const CARD_ID = "j7a_m05";
  const STYLE_ID = "math-exp-scene-style";
  const SVG_NS = "http://www.w3.org/2000/svg";

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function svgEl(tag, attrs = {}) {
    const node = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  }

  function formatNumber(value) {
    if (typeof value === "bigint") {
      const str = value.toString();
      return str.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    if (value >= 1e9) return value.toExponential(2);
    return Math.round(value).toLocaleString("zh-CN");
  }

  function formatThickness(mm) {
    if (mm < 10) return `${mm.toFixed(2)} mm`;
    if (mm < 10000) return `${(mm / 10).toFixed(1)} cm`;
    if (mm < 1e9) return `${(mm / 1e6).toFixed(2)} km`;
    return `${(mm / 1.496e14).toExponential(2)} AU`;
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .math-exp-scene,
      .math-exp-scene *,
      .math-exp-panel,
      .math-exp-panel * {
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -webkit-user-drag: none;
        user-select: none;
      }
      .math-exp-scene {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        color: #f8fafc;
        background:
          radial-gradient(circle at 18% 20%, rgba(34,211,238,0.15), transparent 32%),
          radial-gradient(circle at 82% 72%, rgba(250,204,21,0.10), transparent 36%),
          linear-gradient(145deg, #020617 0%, #07111c 55%, #020617 100%);
        font-family: Inter, "Noto Sans SC", "Microsoft YaHei UI", sans-serif;
        touch-action: none;
      }
      .math-exp-view {
        position: absolute;
        inset: 0;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.22s ease;
        transform: translate3d(var(--math-exp-pan-x, 0px), var(--math-exp-pan-y, 0px), 0) scale(var(--math-exp-zoom, 1));
        transform-origin: 0 0;
        will-change: transform;
      }
      .math-exp-view.active {
        opacity: 1;
        pointer-events: auto;
      }
      .math-exp-canvas,
      .math-exp-svg {
        width: 100%;
        height: 100%;
        display: block;
        touch-action: none;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -webkit-user-drag: none;
        user-select: none;
      }
      .math-exp-bg-number {
        position: absolute;
        right: 4%;
        bottom: 4%;
        font-size: clamp(76px, 18vw, 220px);
        line-height: 0.8;
        color: rgba(255,255,255,0.035);
        font-weight: 950;
        pointer-events: none;
        white-space: nowrap;
      }
      .math-exp-hud {
        position: absolute;
        left: 14px;
        top: 14px;
        z-index: 5;
        display: grid;
        grid-template-columns: repeat(3, minmax(80px, 1fr));
        gap: 8px;
        width: min(500px, calc(100% - 28px));
        pointer-events: none;
      }
      .math-exp-stat {
        min-width: 0;
        border: 1px solid rgba(148,163,184,0.18);
        border-radius: 8px;
        background: rgba(2,6,23,0.62);
        backdrop-filter: blur(12px);
        padding: 8px 10px;
      }
      .math-exp-stat-label {
        color: rgba(226,232,240,0.56);
        font-size: 10px;
        font-weight: 900;
        letter-spacing: 0;
      }
      .math-exp-stat-value {
        margin-top: 2px;
        color: #ffffff;
        font-size: 17px;
        line-height: 1;
        font-weight: 950;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .math-exp-chess {
        position: absolute;
        inset: 14% 8% 7%;
        display: grid;
        grid-template-columns: repeat(8, minmax(0, 1fr));
        grid-template-rows: repeat(8, minmax(0, 1fr));
        gap: 4px;
        transform: perspective(900px) rotateX(48deg) rotateZ(-8deg);
        transform-origin: center;
      }
      .math-exp-cell {
        min-width: 0;
        min-height: 0;
        border: 1px solid rgba(148,163,184,0.18);
        border-radius: 6px;
        background: rgba(15,23,42,0.66);
        box-shadow: inset 0 0 0 1px rgba(255,255,255,0.03);
        position: relative;
        overflow: visible;
      }
      .math-exp-cell.filled {
        background: linear-gradient(145deg, rgba(30,41,59,0.84), rgba(15,23,42,0.68));
        box-shadow: inset 0 0 0 1px rgba(250,204,21,0.12), 0 0 16px rgba(250,204,21,0.12);
      }
      .math-exp-cell.current {
        border-color: rgba(250,204,21,0.72);
        box-shadow: inset 0 0 0 1px rgba(250,204,21,0.22), 0 0 26px rgba(250,204,21,0.34);
      }
      .math-exp-cell::after {
        content: attr(data-index);
        position: absolute;
        left: 5px;
        top: 4px;
        color: rgba(255,255,255,0.48);
        font-size: 10px;
        font-weight: 900;
        z-index: 3;
      }
      .math-exp-grain-stack {
        position: absolute;
        left: 20%;
        right: 20%;
        bottom: 8%;
        height: 0;
        min-height: 0;
        border-radius: 6px 6px 2px 2px;
        background: linear-gradient(180deg, #fef08a, #facc15 48%, #b45309);
        box-shadow: 0 0 14px rgba(250,204,21,0.32);
        opacity: 0;
        transform-origin: bottom center;
        transition: height 0.22s ease, opacity 0.18s ease, transform 0.18s ease;
      }
      .math-exp-cell.filled .math-exp-grain-stack {
        opacity: 0.9;
      }
      .math-exp-cell.current .math-exp-grain-stack {
        opacity: 1;
        transform: scaleX(1.14);
      }
      .math-exp-grain-label {
        position: absolute;
        left: 50%;
        bottom: calc(8% + var(--grain-height, 0px) + 4px);
        transform: translateX(-50%) rotateZ(8deg);
        color: #fef3c7;
        font-size: 9px;
        font-weight: 950;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        text-shadow: 0 2px 8px rgba(2,6,23,0.95);
      }
      .math-exp-cell.current .math-exp-grain-label,
      .math-exp-cell.milestone .math-exp-grain-label {
        opacity: 1;
      }
      .math-exp-paper-stage {
        position: absolute;
        inset: 10% 11% 9%;
        display: grid;
        grid-template-columns: 80px minmax(0, 1fr);
        gap: 24px;
        align-items: end;
      }
      .math-exp-scale {
        height: 100%;
        border-right: 2px solid rgba(226,232,240,0.28);
        position: relative;
      }
      .math-exp-scale span {
        position: absolute;
        right: 12px;
        color: rgba(226,232,240,0.55);
        font-size: 11px;
        font-weight: 900;
      }
      .math-exp-paper-column {
        position: relative;
        height: 100%;
        border-radius: 8px;
        background: linear-gradient(180deg, rgba(34,211,238,0.05), rgba(34,211,238,0.14));
        overflow: hidden;
      }
      .math-exp-paper-fill {
        position: absolute;
        left: 18%;
        right: 18%;
        bottom: 0;
        min-height: 6px;
        border-radius: 8px 8px 0 0;
        background: linear-gradient(180deg, #f8fafc, #22d3ee 40%, #075985);
        box-shadow: 0 0 24px rgba(34,211,238,0.45);
        transition: height 0.25s ease;
      }
      .math-exp-milestone {
        position: absolute;
        left: 50%;
        bottom: 8%;
        transform: translateX(-50%);
        min-width: min(360px, 78%);
        border: 1px solid rgba(148,163,184,0.18);
        border-radius: 8px;
        background: rgba(2,6,23,0.68);
        color: rgba(226,232,240,0.86);
        padding: 10px 12px;
        text-align: center;
        font-weight: 900;
        line-height: 1.45;
      }
      .math-exp-graph-grid {
        stroke: rgba(148,163,184,0.14);
        stroke-width: 1;
      }
      .math-exp-graph-axis {
        stroke: rgba(226,232,240,0.42);
        stroke-width: 2.5;
      }
      .math-exp-curve {
        fill: none;
        stroke: #38bdf8;
        stroke-width: 5;
        stroke-linecap: round;
        filter: drop-shadow(0 0 14px rgba(56,189,248,0.48));
      }
      .math-exp-linear {
        fill: none;
        stroke: rgba(248,250,252,0.48);
        stroke-width: 3;
        stroke-dasharray: 8 8;
      }
      .math-exp-point {
        fill: #ffffff;
        stroke: #facc15;
        stroke-width: 4;
        filter: drop-shadow(0 0 14px rgba(250,204,21,0.52));
      }
      .math-exp-graph-text {
        fill: #ffffff;
        font-size: 14px;
        font-weight: 950;
        text-anchor: middle;
        paint-order: stroke;
        stroke: rgba(2,6,23,0.88);
        stroke-width: 5;
        stroke-linejoin: round;
      }
      .math-exp-graph-compare {
        fill: rgba(226,232,240,0.82);
        font-size: 12px;
        font-weight: 900;
        paint-order: stroke;
        stroke: rgba(2,6,23,0.9);
        stroke-width: 4;
        stroke-linejoin: round;
      }
      .math-exp-panel {
        --math-exp-accent: #38bdf8;
        --math-exp-accent-strong: #67e8f9;
        --math-exp-gold: #facc15;
        --math-exp-violet: #a78bfa;
        --math-exp-line: rgba(255,255,255,0.086);
        --math-exp-card: rgba(8,13,24,0.46);
        --math-exp-control: rgba(255,255,255,0.052);
        width: 100%;
        height: 100%;
        min-height: 0;
        overflow-x: hidden;
        overflow-y: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
        padding: 10px;
        color: #f8fafc;
        background: transparent;
        border: 0;
        border-radius: 0;
        box-shadow: none;
        font-family: Inter, "Noto Sans SC", "Microsoft YaHei UI", sans-serif;
        touch-action: pan-y;
      }
      .math-exp-panel::-webkit-scrollbar {
        width: 0;
        height: 0;
      }
      .math-exp-card {
        flex: 0 0 auto;
        min-height: 0;
        overflow: hidden;
        border: 1px solid var(--math-exp-line);
        border-radius: 12px;
        background:
          linear-gradient(180deg, rgba(255,255,255,0.046), rgba(255,255,255,0.026)),
          var(--math-exp-card);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.045);
        backdrop-filter: blur(12px);
        padding: 11px;
      }
      .math-exp-modes {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }
      .math-exp-button {
        min-width: 0;
        min-height: var(--bio-touch-target, 44px);
        border: 1px solid var(--math-exp-line);
        border-radius: 8px;
        background: var(--math-exp-control);
        color: rgba(248,250,252,0.88);
        font-size: 11px;
        font-weight: 950;
        line-height: 1.18;
        padding: 7px 8px;
        cursor: pointer;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.035);
        transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease, color 0.16s ease, box-shadow 0.16s ease;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -webkit-user-drag: none;
        user-select: none;
      }
      .math-exp-button:hover {
        border-color: rgba(56,189,248,0.52);
        background: rgba(56,189,248,0.09);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 0 0 1px rgba(103,232,249,0.06);
      }
      .math-exp-button.active {
        border-color: rgba(103,232,249,0.68);
        background: linear-gradient(135deg, rgba(14,165,233,0.74), rgba(37,99,235,0.66));
        color: #f8fafc;
        box-shadow: 0 8px 20px rgba(14,165,233,0.16);
      }
      .math-exp-button:active {
        transform: scale(0.98);
      }
      .math-exp-field {
        display: grid;
        gap: 6px;
      }
      .math-exp-field label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        color: rgba(226,232,240,0.7);
        font-size: 11px;
        font-weight: 900;
      }
      .math-exp-chip {
        color: var(--math-exp-gold);
        font-size: 17px;
        line-height: 1;
        font-weight: 950;
      }
      .math-exp-range {
        width: 100%;
        height: 44px;
        min-height: 44px;
        margin: 0;
        accent-color: var(--math-exp-accent);
        touch-action: none;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -webkit-user-drag: none;
        user-select: none;
      }
      .math-exp-actions {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }
      .math-exp-stepper {
        display: grid;
        grid-template-columns: 44px minmax(0, 1fr) 44px;
        gap: 8px;
        align-items: center;
      }
      .math-exp-stepper .math-exp-range {
        min-width: 0;
      }
      .math-exp-result {
        flex: 0 0 auto;
        min-height: 58px;
        display: grid;
        grid-template-rows: auto auto;
        gap: 8px;
      }
      .math-exp-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        min-height: 30px;
        color: rgba(226,232,240,0.76);
        font-size: 12px;
        font-weight: 850;
      }
      .math-exp-row strong {
        color: var(--math-exp-gold);
        font-size: 15px;
        line-height: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 62%;
      }
      .math-exp-explain {
        min-height: 0;
        overflow: hidden;
        color: rgba(203,213,225,0.78);
        font-size: 12px;
        line-height: 1.5;
        font-weight: 750;
      }
      .math-exp-panel[data-size="compact"] {
        gap: 8px;
        padding: 10px;
      }
      .math-exp-panel[data-size="compact"] .math-exp-card {
        padding: 8px;
      }
      .math-exp-panel[data-size="compact"] .math-exp-button {
        min-height: max(var(--bio-touch-target, 36px), 36px);
        font-size: 10px;
        padding: 5px 6px;
      }
      .math-exp-panel[data-size="compact"] .math-exp-row {
        min-height: 25px;
        font-size: 11px;
      }
      .math-exp-panel[data-size="micro"] {
        gap: 6px;
        padding: 8px;
      }
      .math-exp-panel[data-size="micro"] .math-exp-card {
        padding: 7px;
      }
      .math-exp-panel[data-size="micro"] .math-exp-modes {
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 6px;
      }
      .math-exp-panel[data-size="micro"] .math-exp-button {
        min-height: max(var(--bio-touch-target, 36px), 36px);
        font-size: 9px;
        padding: 4px 5px;
      }
      .math-exp-panel[data-size="micro"] .math-exp-range {
        height: 40px;
        min-height: 40px;
      }
      .math-exp-panel[data-size="micro"] .math-exp-row {
        min-height: 22px;
        font-size: 10px;
      }
      .math-exp-panel[data-size="micro"] .math-exp-explain {
        display: none;
      }
      .math-exp-panel[data-wide="true"] .math-exp-modes {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
      .math-exp-panel[data-wide="true"] .math-exp-button {
        min-height: 36px;
      }
    `;
    document.head.appendChild(style);
  }

  function fitPanel(panel) {
    const rect = panel.getBoundingClientRect();
    const height = rect.height || 0;
    panel.dataset.size = height < 500 ? "micro" : height < 650 ? "compact" : "normal";
    panel.dataset.wide = rect.width >= 560 ? "true" : "false";
  }

  function blockNativeTouchMenus(target, options) {
    if (!target) return;
    target.addEventListener("contextmenu", event => event.preventDefault(), options);
    target.addEventListener("selectstart", event => event.preventDefault(), options);
    target.addEventListener("dragstart", event => event.preventDefault(), options);
  }

  function mount(container, context = {}) {
    ensureStyle();
    const panelHost = context.externalPanel || null;
    const modes = {
      tree: { label: "分形树", min: 0, max: 12, value: 7 },
      chess: { label: "棋盘麦粒", min: 1, max: 64, value: 16 },
      paper: { label: "折纸厚度", min: 0, max: 42, value: 18 },
      graph: { label: "函数曲线", min: 0, max: 12, value: 5 }
    };
    const state = {
      mode: "tree",
      n: modes.tree.value,
      base: 2,
      auto: false,
      timer: 0,
      raf: 0,
      viewScale: 1,
      viewPanX: 0,
      viewPanY: 0
    };
    const size = { width: 0, height: 0 };

    container.innerHTML = "";
    const scene = document.createElement("div");
    scene.className = "math-exp-scene";
    scene.innerHTML = `
      <div class="math-exp-hud">
        <div class="math-exp-stat"><div class="math-exp-stat-label">指数步数</div><div class="math-exp-stat-value" data-hud-n></div></div>
        <div class="math-exp-stat"><div class="math-exp-stat-label">当前数量</div><div class="math-exp-stat-value" data-hud-value></div></div>
        <div class="math-exp-stat"><div class="math-exp-stat-label">增长方式</div><div class="math-exp-stat-value" data-hud-mode></div></div>
      </div>
      <div class="math-exp-bg-number" data-bg-number>2^0</div>
      <div class="math-exp-view active" data-view="tree"><canvas class="math-exp-canvas" data-tree-canvas></canvas></div>
      <div class="math-exp-view" data-view="chess"><div class="math-exp-chess" data-chess></div></div>
      <div class="math-exp-view" data-view="paper">
        <div class="math-exp-paper-stage">
          <div class="math-exp-scale">
            <span style="top: 4%">月球</span>
            <span style="top: 34%">高楼</span>
            <span style="top: 66%">书本</span>
            <span style="bottom: 0">纸张</span>
          </div>
          <div class="math-exp-paper-column"><div class="math-exp-paper-fill" data-paper-fill></div></div>
          <div class="math-exp-milestone" data-paper-text></div>
        </div>
      </div>
      <div class="math-exp-view" data-view="graph">
        <svg class="math-exp-svg" data-graph-svg>
          <g data-graph-grid></g>
          <path class="math-exp-linear" data-linear></path>
          <path class="math-exp-curve" data-curve></path>
          <circle class="math-exp-point" r="8" data-graph-point></circle>
          <text class="math-exp-graph-text" data-graph-text></text>
          <text class="math-exp-graph-compare" data-graph-compare></text>
        </svg>
      </div>
    `;
    container.appendChild(scene);

    let panel = null;
    if (panelHost) {
      panelHost.innerHTML = "";
      panel = document.createElement("div");
      panel.className = "math-exp-panel";
      panel.innerHTML = `
        <div class="math-exp-card math-exp-modes">
          <button class="math-exp-button active" type="button" data-mode="tree">分形树</button>
          <button class="math-exp-button" type="button" data-mode="chess">棋盘麦粒</button>
          <button class="math-exp-button" type="button" data-mode="paper">折纸厚度</button>
          <button class="math-exp-button" type="button" data-mode="graph">函数曲线</button>
        </div>
        <div class="math-exp-card math-exp-field">
          <label><span data-slider-label>代数 n</span><span class="math-exp-chip" data-n-chip></span></label>
          <div class="math-exp-stepper">
            <button class="math-exp-button" type="button" data-step="-1">-1</button>
            <input class="math-exp-range" data-n-slider type="range" min="0" max="12" step="1" value="7">
            <button class="math-exp-button" type="button" data-step="1">+1</button>
          </div>
          <div class="math-exp-field" data-base-field style="display:none;">
            <label>底数 a <span class="math-exp-chip" data-base-chip>2.0</span></label>
            <input class="math-exp-range" data-base-slider type="range" min="1.1" max="5" step="0.1" value="2">
          </div>
        </div>
        <div class="math-exp-card math-exp-actions">
          <button class="math-exp-button" type="button" data-auto>自动演示</button>
          <button class="math-exp-button" type="button" data-reset>重新开始</button>
        </div>
        <div class="math-exp-card math-exp-result">
          <div>
            <div class="math-exp-row"><span data-row-label-one>当前项</span><strong data-row-value-one></strong></div>
            <div class="math-exp-row"><span data-row-label-two>累计量</span><strong data-row-value-two></strong></div>
          </div>
          <div class="math-exp-explain" data-explain></div>
        </div>
      `;
      panelHost.appendChild(panel);
      fitPanel(panel);
    }

    const els = {
      views: scene.querySelectorAll("[data-view]"),
      treeCanvas: scene.querySelector("[data-tree-canvas]"),
      chess: scene.querySelector("[data-chess]"),
      paperFill: scene.querySelector("[data-paper-fill]"),
      paperText: scene.querySelector("[data-paper-text]"),
      graphSvg: scene.querySelector("[data-graph-svg]"),
      graphGrid: scene.querySelector("[data-graph-grid]"),
      linear: scene.querySelector("[data-linear]"),
      curve: scene.querySelector("[data-curve]"),
      graphPoint: scene.querySelector("[data-graph-point]"),
      graphText: scene.querySelector("[data-graph-text]"),
      graphCompare: scene.querySelector("[data-graph-compare]"),
      bgNumber: scene.querySelector("[data-bg-number]"),
      hudN: scene.querySelector("[data-hud-n]"),
      hudValue: scene.querySelector("[data-hud-value]"),
      hudMode: scene.querySelector("[data-hud-mode]"),
      panel,
      nSlider: panel?.querySelector("[data-n-slider]"),
      nChip: panel?.querySelector("[data-n-chip]"),
      sliderLabel: panel?.querySelector("[data-slider-label]"),
      baseField: panel?.querySelector("[data-base-field]"),
      baseSlider: panel?.querySelector("[data-base-slider]"),
      baseChip: panel?.querySelector("[data-base-chip]"),
      rowLabelOne: panel?.querySelector("[data-row-label-one]"),
      rowLabelTwo: panel?.querySelector("[data-row-label-two]"),
      rowValueOne: panel?.querySelector("[data-row-value-one]"),
      rowValueTwo: panel?.querySelector("[data-row-value-two]"),
      explain: panel?.querySelector("[data-explain]"),
      auto: panel?.querySelector("[data-auto]")
    };

    const nativeTouchAbort = typeof AbortController !== "undefined" ? new AbortController() : null;
    const nativeTouchOptions = nativeTouchAbort ? { signal: nativeTouchAbort.signal } : undefined;
    const wheelOptions = nativeTouchAbort ? { passive: false, signal: nativeTouchAbort.signal } : { passive: false };
    const gesture = {
      pointers: new Map(),
      mode: null,
      startScale: 1,
      startPanX: 0,
      startPanY: 0,
      startPoint: null,
      startMidpoint: null,
      startDistance: 0
    };
    [scene, els.treeCanvas, els.graphSvg, panel, panelHost].forEach(target => {
      if (!target) return;
      target.setAttribute?.("draggable", "false");
      blockNativeTouchMenus(target, nativeTouchOptions);
    });
    scene.querySelectorAll("svg, canvas, g, line, path, circle, text, div").forEach(node => node.setAttribute("draggable", "false"));
    panel?.querySelectorAll("button, input, label, span, strong, div").forEach(node => node.setAttribute("draggable", "false"));

    function applyViewportTransform() {
      scene.style.setProperty("--math-exp-zoom", state.viewScale.toFixed(4));
      scene.style.setProperty("--math-exp-pan-x", `${state.viewPanX.toFixed(1)}px`);
      scene.style.setProperty("--math-exp-pan-y", `${state.viewPanY.toFixed(1)}px`);
    }

    function constrainViewportPan() {
      const rect = scene.getBoundingClientRect();
      if (state.viewScale <= 1.01 || !rect.width || !rect.height) {
        state.viewScale = 1;
        state.viewPanX = 0;
        state.viewPanY = 0;
        return;
      }
      const minX = rect.width - rect.width * state.viewScale;
      const minY = rect.height - rect.height * state.viewScale;
      state.viewPanX = clamp(state.viewPanX, minX, 0);
      state.viewPanY = clamp(state.viewPanY, minY, 0);
    }

    function zoomViewportAt(clientX, clientY, nextScale) {
      const rect = scene.getBoundingClientRect();
      const oldScale = state.viewScale;
      const scale = clamp(nextScale, 1, 3);
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;
      const contentX = (localX - state.viewPanX) / oldScale;
      const contentY = (localY - state.viewPanY) / oldScale;
      state.viewScale = scale;
      state.viewPanX = localX - contentX * scale;
      state.viewPanY = localY - contentY * scale;
      constrainViewportPan();
      applyViewportTransform();
    }

    function pointerList() {
      return Array.from(gesture.pointers.values());
    }

    function distanceBetween(a, b) {
      return Math.hypot(a.x - b.x, a.y - b.y);
    }

    function midpoint(a, b) {
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }

    function startPanGesture(point) {
      gesture.mode = "pan";
      gesture.startPoint = { ...point };
      gesture.startPanX = state.viewPanX;
      gesture.startPanY = state.viewPanY;
    }

    function startPinchGesture() {
      const points = pointerList();
      if (points.length < 2) return;
      gesture.mode = "pinch";
      gesture.startScale = state.viewScale;
      gesture.startPanX = state.viewPanX;
      gesture.startPanY = state.viewPanY;
      gesture.startDistance = Math.max(1, distanceBetween(points[0], points[1]));
      gesture.startMidpoint = midpoint(points[0], points[1]);
    }

    function onStagePointerDown(event) {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      gesture.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      try {
        scene.setPointerCapture?.(event.pointerId);
      } catch (error) {
        // Capture can already be owned by an embedded WebView during quick taps.
      }
      if (gesture.pointers.size === 1) {
        startPanGesture({ x: event.clientX, y: event.clientY });
      } else if (gesture.pointers.size === 2) {
        startPinchGesture();
      }
      event.preventDefault();
    }

    function onStagePointerMove(event) {
      if (!gesture.pointers.has(event.pointerId)) return;
      gesture.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (gesture.pointers.size >= 2 && gesture.mode === "pinch") {
        const points = pointerList();
        const currentMidpoint = midpoint(points[0], points[1]);
        const currentDistance = Math.max(1, distanceBetween(points[0], points[1]));
        const rect = scene.getBoundingClientRect();
        const startLocalX = gesture.startMidpoint.x - rect.left;
        const startLocalY = gesture.startMidpoint.y - rect.top;
        const contentX = (startLocalX - gesture.startPanX) / gesture.startScale;
        const contentY = (startLocalY - gesture.startPanY) / gesture.startScale;
        state.viewScale = clamp(gesture.startScale * (currentDistance / gesture.startDistance), 1, 3);
        state.viewPanX = currentMidpoint.x - rect.left - contentX * state.viewScale;
        state.viewPanY = currentMidpoint.y - rect.top - contentY * state.viewScale;
        constrainViewportPan();
        applyViewportTransform();
      } else if (gesture.pointers.size === 1 && gesture.mode === "pan" && state.viewScale > 1.01) {
        const point = pointerList()[0];
        state.viewPanX = gesture.startPanX + point.x - gesture.startPoint.x;
        state.viewPanY = gesture.startPanY + point.y - gesture.startPoint.y;
        constrainViewportPan();
        applyViewportTransform();
      }
      event.preventDefault();
    }

    function onStagePointerEnd(event) {
      if (!gesture.pointers.has(event.pointerId)) return;
      gesture.pointers.delete(event.pointerId);
      try {
        scene.releasePointerCapture?.(event.pointerId);
      } catch (error) {
        // Pointer capture may already be gone after browser-level cancel.
      }
      if (gesture.pointers.size >= 2) {
        startPinchGesture();
      } else if (gesture.pointers.size === 1) {
        startPanGesture(pointerList()[0]);
      } else {
        gesture.mode = null;
        gesture.startPoint = null;
      }
      event.preventDefault();
    }

    function onStageLostPointerCapture(event) {
      if (!gesture.pointers.has(event.pointerId)) return;
      gesture.pointers.delete(event.pointerId);
      if (!gesture.pointers.size) gesture.mode = null;
    }

    function onStageWheel(event) {
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.12 : 0.88;
      zoomViewportAt(event.clientX, event.clientY, state.viewScale * factor);
    }

    scene.addEventListener("pointerdown", onStagePointerDown, nativeTouchOptions);
    scene.addEventListener("pointermove", onStagePointerMove, nativeTouchOptions);
    scene.addEventListener("pointerup", onStagePointerEnd, nativeTouchOptions);
    scene.addEventListener("pointercancel", onStagePointerEnd, nativeTouchOptions);
    scene.addEventListener("lostpointercapture", onStageLostPointerCapture, nativeTouchOptions);
    scene.addEventListener("wheel", onStageWheel, wheelOptions);
    applyViewportTransform();

    function buildChess() {
      els.chess.innerHTML = "";
      for (let i = 1; i <= 64; i += 1) {
        const cell = document.createElement("div");
        cell.className = "math-exp-cell";
        cell.dataset.index = i;
        cell.innerHTML = `<div class="math-exp-grain-stack"></div><div class="math-exp-grain-label"></div>`;
        els.chess.appendChild(cell);
      }
    }

    function resizeCanvas() {
      const ratio = window.devicePixelRatio || 1;
      size.width = Math.max(320, container.clientWidth || 320);
      size.height = Math.max(240, container.clientHeight || 240);
      els.treeCanvas.width = Math.floor(size.width * ratio);
      els.treeCanvas.height = Math.floor(size.height * ratio);
      els.treeCanvas.style.width = `${size.width}px`;
      els.treeCanvas.style.height = `${size.height}px`;
      const ctx = els.treeCanvas.getContext("2d");
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function drawTree() {
      const ctx = els.treeCanvas.getContext("2d");
      ctx.clearRect(0, 0, size.width, size.height);
      ctx.save();
      ctx.translate(size.width / 2, size.height * 0.88);
      const n = clamp(state.n, 0, 12);
      const baseLen = Math.min(size.height * 0.22, 120);
      const scale = n > 8 ? 0.72 : 0.78;
      ctx.lineCap = "round";
      function branch(len, depth) {
        const hue = 175 + depth * 11;
        ctx.strokeStyle = `hsla(${hue}, 90%, ${62 - depth * 2}%, ${Math.max(0.18, 0.92 - depth * 0.045)})`;
        ctx.lineWidth = Math.max(1, 11 - depth * 0.72);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -len);
        ctx.stroke();
        ctx.translate(0, -len);
        if (depth >= n) {
          ctx.fillStyle = "rgba(250,204,21,0.78)";
          ctx.beginPath();
          ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.translate(0, len);
          return;
        }
        ctx.save();
        ctx.rotate(-0.55);
        branch(len * scale, depth + 1);
        ctx.restore();
        ctx.save();
        ctx.rotate(0.55);
        branch(len * scale, depth + 1);
        ctx.restore();
        ctx.translate(0, len);
      }
      branch(baseLen, 0);
      ctx.restore();
    }

    function updateChess() {
      const cells = Array.from(els.chess.children);
      cells.forEach((cell, index) => {
        const number = index + 1;
        const filled = number <= state.n;
        const current = number === state.n;
        const logHeight = number <= 1 ? 4 : 4 + Math.log2(number) * 10;
        const height = Math.min(96, Math.max(8, logHeight + number * 0.72));
        cell.classList.toggle("filled", filled);
        cell.classList.toggle("current", current);
        cell.classList.toggle("milestone", filled && [8, 16, 32, 64].includes(number));
        cell.style.setProperty("--grain-height", `${height}px`);
        const stack = cell.querySelector(".math-exp-grain-stack");
        const label = cell.querySelector(".math-exp-grain-label");
        if (stack) stack.style.height = filled ? `${height}%` : "0";
        if (label) {
          const value = 1n << BigInt(number - 1);
          label.textContent = number >= 10 ? formatNumber(value) : `2^${number - 1}`;
        }
      });
    }

    function updatePaper() {
      const mm = 0.1 * Math.pow(2, state.n);
      const minLog = Math.log10(0.1);
      const maxLog = Math.log10(0.1 * Math.pow(2, 42));
      const pct = clamp((Math.log10(mm) - minLog) / (maxLog - minLog), 0.02, 1);
      els.paperFill.style.height = `${pct * 100}%`;
      let milestone = "普通纸张仍很薄";
      if (mm >= 100 && mm < 30000) milestone = "厚度超过一本书";
      if (mm >= 30000 && mm < 8.8e6) milestone = "已经超过高楼尺度";
      if (mm >= 8.8e6 && mm < 3.84e11) milestone = "进入山脉与城市尺度";
      if (mm >= 3.84e11) milestone = "理论厚度超过地月距离";
      els.paperText.textContent = `${state.n} 次对折：${formatThickness(mm)}，${milestone}`;
    }

    function drawGraph() {
      const w = Math.max(320, size.width);
      const h = Math.max(240, size.height);
      const pad = Math.min(72, Math.max(44, w * 0.08));
      const ox = pad;
      const oy = h - pad;
      const graphW = w - pad * 1.55;
      const graphH = h - pad * 1.65;
      const maxX = 12;
      const maxY = Math.pow(state.base, maxX);
      const sx = graphW / maxX;
      const sy = graphH / maxY;
      els.graphGrid.innerHTML = "";
      for (let i = 0; i <= maxX; i += 2) {
        const x = ox + i * sx;
        els.graphGrid.appendChild(svgEl("line", { class: "math-exp-graph-grid", x1: x, y1: pad * 0.65, x2: x, y2: oy }));
      }
      for (let i = 0; i <= 5; i += 1) {
        const y = oy - graphH * (i / 5);
        els.graphGrid.appendChild(svgEl("line", { class: i === 0 ? "math-exp-graph-axis" : "math-exp-graph-grid", x1: ox, y1: y, x2: ox + graphW, y2: y }));
      }
      els.graphGrid.appendChild(svgEl("line", { class: "math-exp-graph-axis", x1: ox, y1: pad * 0.65, x2: ox, y2: oy }));
      let curve = "";
      let linear = "";
      for (let px = 0; px <= graphW; px += 3) {
        const x = px / sx;
        const y = Math.pow(state.base, x);
        const py = oy - y * sy;
        curve += `${curve ? "L" : "M"} ${ox + px} ${py}`;
        const ly = state.base * x;
        linear += `${linear ? "L" : "M"} ${ox + px} ${oy - ly * sy}`;
      }
      els.curve.setAttribute("d", curve);
      els.linear.setAttribute("d", linear);
      const px = ox + state.n * sx;
      const py = oy - Math.pow(state.base, state.n) * sy;
      els.graphPoint.setAttribute("cx", px);
      els.graphPoint.setAttribute("cy", py);
      els.graphText.setAttribute("x", px);
      els.graphText.setAttribute("y", Math.max(36, py - 18));
      els.graphText.textContent = `(${state.n}, ${formatNumber(Math.pow(state.base, state.n))})`;
      const linearNow = state.base * state.n;
      const compareY = Math.min(h - 26, py + 34);
      els.graphCompare.setAttribute("x", Math.min(w - 140, Math.max(70, px + 12)));
      els.graphCompare.setAttribute("y", compareY);
      els.graphCompare.textContent = `${state.base.toFixed(1)}^x 对比 ${state.base.toFixed(1)}x`;
    }

    function currentValue() {
      if (state.mode === "chess") return 1n << BigInt(state.n - 1);
      if (state.mode === "paper") return 0.1 * Math.pow(2, state.n);
      if (state.mode === "graph") return Math.pow(state.base, state.n);
      return Math.pow(2, state.n);
    }

    function currentTotal() {
      if (state.mode === "chess") return (1n << BigInt(state.n)) - 1n;
      if (state.mode === "tree") return Math.pow(2, state.n + 1) - 1;
      return currentValue();
    }

    function updatePanel() {
      const mode = modes[state.mode];
      const value = currentValue();
      const total = currentTotal();
      els.hudN.textContent = `${state.n}`;
      els.hudValue.textContent = state.mode === "paper" ? formatThickness(value) : formatNumber(value);
      els.hudMode.textContent = mode.label;
      els.bgNumber.textContent = state.mode === "graph" ? `${state.base.toFixed(1)}^${state.n}` : `2^${state.n}`;
      if (!panel) return;
      panel.querySelectorAll("[data-mode]").forEach(btn => btn.classList.toggle("active", btn.dataset.mode === state.mode));
      els.nSlider.min = String(mode.min);
      els.nSlider.max = String(mode.max);
      els.nSlider.value = String(state.n);
      els.nChip.textContent = String(state.n);
      els.sliderLabel.textContent = state.mode === "chess" ? "棋盘格序号" : state.mode === "paper" ? "对折次数" : state.mode === "graph" ? "自变量 x" : "分叉代数";
      els.baseField.style.display = state.mode === "graph" ? "" : "none";
      els.baseSlider.value = String(state.base);
      els.baseChip.textContent = state.base.toFixed(1);
      els.auto.textContent = state.auto ? "暂停演示" : "自动演示";
      els.auto.classList.toggle("active", state.auto);
      if (state.mode === "paper") {
        els.rowLabelOne.textContent = "当前厚度";
        els.rowLabelTwo.textContent = "指数式";
        els.rowValueOne.textContent = formatThickness(value);
        els.rowValueTwo.textContent = `0.1mm × 2^${state.n}`;
        els.explain.textContent = "每折一次，厚度乘 2。";
      } else if (state.mode === "chess") {
        els.rowLabelOne.textContent = "本格麦粒";
        els.rowLabelTwo.textContent = "累计麦粒";
        els.rowValueOne.textContent = formatNumber(value);
        els.rowValueTwo.textContent = formatNumber(total);
        els.explain.textContent = "本格 2^(n-1)，累计 2^n-1。";
      } else if (state.mode === "graph") {
        els.rowLabelOne.textContent = "函数值";
        els.rowLabelTwo.textContent = "表达式";
        els.rowValueOne.textContent = formatNumber(value);
        els.rowValueTwo.textContent = `${state.base.toFixed(1)}^${state.n}`;
        els.explain.textContent = "x 每加 1，函数值乘同一个底数。";
      } else {
        els.rowLabelOne.textContent = "新分支";
        els.rowLabelTwo.textContent = "累计节点";
        els.rowValueOne.textContent = formatNumber(value);
        els.rowValueTwo.textContent = formatNumber(total);
        els.explain.textContent = "每一代翻倍，规模快速展开。";
      }
      fitPanel(panel);
    }

    function update() {
      els.views.forEach(view => view.classList.toggle("active", view.dataset.view === state.mode));
      if (state.mode === "tree") drawTree();
      if (state.mode === "chess") updateChess();
      if (state.mode === "paper") updatePaper();
      if (state.mode === "graph") drawGraph();
      updatePanel();
    }

    function setMode(modeName) {
      const mode = modes[modeName];
      if (!mode) return;
      state.mode = modeName;
      state.n = mode.value;
      update();
    }

    function startAuto() {
      state.auto = !state.auto;
      clearInterval(state.timer);
      if (state.auto) {
        state.timer = setInterval(() => {
          const mode = modes[state.mode];
          state.n += 1;
          if (state.n > mode.max) state.n = mode.min;
          update();
        }, state.mode === "chess" ? 360 : 520);
      }
      updatePanel();
    }

    function resize() {
      resizeCanvas();
      constrainViewportPan();
      applyViewportTransform();
      update();
      if (panel) fitPanel(panel);
    }

    buildChess();
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    resizeObserver?.observe(container);
    if (panelHost) resizeObserver?.observe(panelHost);
    if (!resizeObserver) window.addEventListener("resize", resize);

    panel?.addEventListener("click", event => {
      const modeBtn = event.target.closest("[data-mode]");
      if (modeBtn) {
        clearInterval(state.timer);
        state.auto = false;
        setMode(modeBtn.dataset.mode);
        return;
      }
      if (event.target.closest("[data-auto]")) {
        startAuto();
        return;
      }
      if (event.target.closest("[data-reset]")) {
        clearInterval(state.timer);
        state.auto = false;
        state.n = modes[state.mode].min;
        update();
        return;
      }
      const stepBtn = event.target.closest("[data-step]");
      if (stepBtn) {
        clearInterval(state.timer);
        state.auto = false;
        const mode = modes[state.mode];
        state.n = clamp(state.n + Number(stepBtn.dataset.step), mode.min, mode.max);
        update();
      }
    });
    els.nSlider?.addEventListener("input", event => {
      clearInterval(state.timer);
      state.auto = false;
      state.n = Number(event.target.value);
      update();
    });
    els.baseSlider?.addEventListener("input", event => {
      state.base = Number(event.target.value);
      update();
    });

    const raf = window.requestAnimationFrame || (fn => window.setTimeout(fn, 16));
    state.raf = raf(resize);

    container.__mathExpCleanup = () => {
      resizeObserver?.disconnect();
      nativeTouchAbort?.abort();
      if (!resizeObserver) window.removeEventListener("resize", resize);
      clearInterval(state.timer);
      const caf = window.cancelAnimationFrame || window.clearTimeout;
      caf(state.raf);
      container.innerHTML = "";
      if (panelHost) panelHost.innerHTML = "";
    };
  }

  window.MATH_VISUAL_SCENES[CARD_ID] = {
    mount,
    unmount(container) {
      if (container.__mathExpCleanup) {
        container.__mathExpCleanup();
        delete container.__mathExpCleanup;
      } else {
        container.innerHTML = "";
      }
    }
  };
})();
