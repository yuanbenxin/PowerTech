window.MATH_VISUAL_SCENES = window.MATH_VISUAL_SCENES || {};

(function () {
  const CARD_ID = "j7a_m03";
  const STYLE_ID = "math-abs-scene-style";
  const SVG_NS = "http://www.w3.org/2000/svg";

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function round1(value) {
    const rounded = Math.round(value * 10) / 10;
    return Object.is(rounded, -0) ? 0 : rounded;
  }

  function fmt(value) {
    return round1(value).toFixed(1).replace(/\.0$/, "");
  }

  function svgEl(tag, attrs = {}) {
    const node = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  }

  function setAttrs(node, attrs = {}) {
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .math-abs-scene,
      .math-abs-scene *,
      .math-abs-panel,
      .math-abs-panel * {
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -webkit-user-drag: none;
        user-select: none;
      }
      .math-abs-scene {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        color: #f8fafc;
        background:
          radial-gradient(circle at 22% 18%, rgba(45,212,191,0.15), transparent 32%),
          radial-gradient(circle at 78% 74%, rgba(244,114,182,0.12), transparent 34%),
          linear-gradient(145deg, #020617 0%, #08111d 52%, #020617 100%);
        font-family: Inter, "Noto Sans SC", "Microsoft YaHei UI", sans-serif;
        touch-action: none;
      }
      .math-abs-svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: block;
        user-select: none;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -webkit-user-drag: none;
        touch-action: none;
      }
      .math-abs-axis-line {
        stroke: rgba(226,232,240,0.44);
        stroke-width: 4;
        stroke-linecap: round;
      }
      .math-abs-axis-arrow {
        fill: rgba(226,232,240,0.66);
      }
      .math-abs-zone {
        opacity: 0.36;
        pointer-events: none;
      }
      .math-abs-zone.neg {
        fill: url(#math-abs-neg-zone);
      }
      .math-abs-zone.pos {
        fill: url(#math-abs-pos-zone);
      }
      .math-abs-tick {
        stroke: rgba(148,163,184,0.68);
        stroke-width: 2;
      }
      .math-abs-tick.zero {
        stroke: #f8fafc;
        stroke-width: 3;
      }
      .math-abs-tick-text {
        fill: rgba(226,232,240,0.72);
        font-size: 13px;
        font-weight: 800;
        text-anchor: middle;
        dominant-baseline: hanging;
        pointer-events: none;
      }
      .math-abs-tick-text.zero {
        fill: #ffffff;
        font-size: 17px;
      }
      .math-abs-guide {
        stroke: rgba(148,163,184,0.28);
        stroke-width: 2;
        stroke-dasharray: 7 8;
      }
      .math-abs-mirror-line {
        stroke: rgba(244,114,182,0.58);
        stroke-width: 3;
        stroke-linecap: round;
        stroke-dasharray: 10 9;
        filter: drop-shadow(0 0 10px rgba(244,114,182,0.38));
      }
      .math-abs-distance-line {
        stroke: #facc15;
        stroke-width: 9;
        stroke-linecap: round;
        opacity: 0.35;
        filter: drop-shadow(0 0 12px rgba(250,204,21,0.32));
      }
      .math-abs-point {
        cursor: grab;
        stroke: rgba(255,255,255,0.92);
        stroke-width: 3;
        filter: drop-shadow(0 0 16px rgba(255,255,255,0.28));
        touch-action: none;
      }
      .math-abs-point:active {
        cursor: grabbing;
      }
      .math-abs-point.x {
        fill: #22d3ee;
      }
      .math-abs-point.opp {
        fill: #f472b6;
      }
      .math-abs-point.y {
        fill: #facc15;
      }
      .math-abs-label {
        fill: #f8fafc;
        font-size: 18px;
        font-weight: 900;
        text-anchor: middle;
        dominant-baseline: middle;
        paint-order: stroke;
        stroke: rgba(2,6,23,0.88);
        stroke-width: 5;
        stroke-linejoin: round;
        pointer-events: none;
      }
      .math-abs-arc {
        fill: none;
        stroke: #f472b6;
        stroke-width: 4;
        stroke-linecap: round;
        stroke-dasharray: 9 8;
        filter: drop-shadow(0 0 10px rgba(244,114,182,0.42));
      }
      .math-abs-bracket {
        fill: none;
        stroke: #facc15;
        stroke-width: 5;
        stroke-linecap: round;
        stroke-linejoin: round;
        filter: drop-shadow(0 0 12px rgba(250,204,21,0.35));
      }
      .math-abs-arrow {
        fill: none;
        stroke-width: 3;
        stroke-linecap: round;
        stroke-linejoin: round;
        filter: drop-shadow(0 0 12px rgba(34,211,238,0.35));
      }
      .math-abs-hud {
        position: absolute;
        left: 14px;
        top: 14px;
        z-index: 4;
        display: grid;
        grid-template-columns: repeat(3, minmax(78px, 1fr));
        gap: 8px;
        width: min(430px, calc(100% - 28px));
        pointer-events: none;
      }
      .math-abs-stat {
        min-width: 0;
        border: 1px solid rgba(148,163,184,0.18);
        border-radius: 8px;
        background: rgba(2,6,23,0.62);
        backdrop-filter: blur(12px);
        padding: 8px 10px;
      }
      .math-abs-stat-label {
        color: rgba(226,232,240,0.56);
        font-size: 10px;
        font-weight: 900;
        letter-spacing: 0.12em;
      }
      .math-abs-stat-value {
        margin-top: 2px;
        color: #ffffff;
        font-size: 18px;
        line-height: 1;
        font-weight: 950;
        white-space: nowrap;
      }
      .math-abs-panel {
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
        gap: 8px;
        padding: 10px;
        color: #f8fafc;
        font-family: Inter, "Noto Sans SC", "Microsoft YaHei UI", sans-serif;
        touch-action: pan-y;
      }
      .math-abs-panel::-webkit-scrollbar {
        width: 0;
        height: 0;
      }
      .math-abs-card {
        flex: 0 0 auto;
        min-height: 0;
        border: 1px solid rgba(148,163,184,0.16);
        border-radius: 8px;
        background: rgba(15,23,42,0.64);
        padding: 8px;
      }
      .math-abs-card-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 6px;
        color: rgba(226,232,240,0.66);
        font-size: 11px;
        font-weight: 950;
      }
      .math-abs-tabs,
      .math-abs-two,
      .math-abs-toggles,
      .math-abs-quick {
        display: grid;
        gap: 6px;
      }
      .math-abs-tabs {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .math-abs-two {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .math-abs-toggles {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .math-abs-quick {
        grid-template-columns: repeat(5, minmax(0, 1fr));
        margin-top: 7px;
      }
      .math-abs-button {
        min-width: 0;
        min-height: 32px;
        border: 1px solid rgba(148,163,184,0.18);
        border-radius: 8px;
        background: rgba(2,6,23,0.36);
        color: rgba(226,232,240,0.76);
        font-size: 12px;
        font-weight: 950;
        line-height: 1.2;
        padding: 6px 7px;
        cursor: pointer;
        transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease, color 0.16s ease;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -webkit-user-drag: none;
        user-select: none;
      }
      .math-abs-button:active {
        transform: scale(0.98);
      }
      .math-abs-button.active {
        border-color: rgba(34,211,238,0.72);
        background: rgba(34,211,238,0.14);
        color: #e0f2fe;
      }
      .math-abs-field {
        display: grid;
        gap: 4px;
      }
      .math-abs-field label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        color: rgba(226,232,240,0.64);
        font-size: 11px;
        font-weight: 900;
      }
      .math-abs-chip {
        color: #ffffff;
        font-size: 16px;
        line-height: 1;
        font-weight: 950;
      }
      .math-abs-range {
        width: 100%;
        height: 24px;
        margin: 0;
        accent-color: #22d3ee;
        cursor: pointer;
        touch-action: none;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -webkit-user-drag: none;
        user-select: none;
      }
      .math-abs-range.y {
        accent-color: #facc15;
      }
      .math-abs-result {
        min-height: 0;
        display: grid;
        gap: 4px;
      }
      .math-abs-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        min-height: 24px;
        color: rgba(226,232,240,0.72);
        font-size: 12px;
        font-weight: 850;
      }
      .math-abs-row strong {
        color: #ffffff;
        font-size: 16px;
        line-height: 1;
        white-space: nowrap;
      }
      .math-abs-explain {
        min-height: 0;
        overflow: hidden;
        color: rgba(203,213,225,0.78);
        font-size: 12px;
        line-height: 1.42;
        font-weight: 700;
      }
      .math-abs-panel[data-size="compact"] {
        gap: 7px;
        padding: 8px;
      }
      .math-abs-panel[data-size="compact"] .math-abs-card {
        padding: 8px;
      }
      .math-abs-panel[data-size="compact"] .math-abs-button {
        min-height: 36px;
        font-size: 11px;
        padding: 6px 7px;
      }
      .math-abs-panel[data-size="compact"] .math-abs-row {
        min-height: 25px;
        font-size: 11px;
      }
      .math-abs-panel[data-size="compact"] .math-abs-row strong,
      .math-abs-panel[data-size="compact"] .math-abs-chip {
        font-size: 16px;
      }
      .math-abs-panel[data-size="micro"] {
        gap: 6px;
        padding: 7px;
      }
      .math-abs-panel[data-size="micro"] .math-abs-card {
        padding: 7px;
      }
      .math-abs-panel[data-size="micro"] .math-abs-button {
        min-height: 28px;
        font-size: 10px;
        padding: 5px 6px;
      }
      .math-abs-panel[data-size="micro"] .math-abs-field {
        gap: 3px;
      }
      .math-abs-panel[data-size="micro"] .math-abs-field label,
      .math-abs-panel[data-size="micro"] .math-abs-row {
        font-size: 10px;
      }
      .math-abs-panel[data-size="micro"] .math-abs-explain {
        font-size: 10px;
        line-height: 1.35;
      }
      .math-abs-panel[data-size="micro"] .math-abs-range {
        height: 20px;
      }
      .math-abs-panel[data-wide="true"] .math-abs-two {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .math-abs-panel[data-wide="false"] .math-abs-two {
        grid-template-columns: minmax(0, 1fr);
      }
      .math-abs-panel[data-wide="false"] .math-abs-toggles {
        grid-template-columns: minmax(0, 1fr);
      }
    `;
    document.head.appendChild(style);
  }

  function fitPanel(panel) {
    const rect = panel.getBoundingClientRect();
    const height = rect.height || 0;
    panel.dataset.size = height < 500 ? "micro" : height < 650 ? "compact" : "normal";
    panel.dataset.wide = rect.width >= 430 ? "true" : "false";
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
    const state = {
      mode: 1,
      x: 4.5,
      y: -3,
      showOpposite: true,
      showAbsolute: true,
      snap: true,
      dragTarget: null,
      dragPointerId: null
    };
    const metrics = {
      width: 0,
      height: 0,
      originX: 0,
      originY: 0,
      unit: 50
    };

    container.innerHTML = "";
    const scene = document.createElement("div");
    scene.className = "math-abs-scene";
    scene.innerHTML = `
      <div class="math-abs-hud">
        <div class="math-abs-stat"><div class="math-abs-stat-label">当前数</div><div class="math-abs-stat-value" data-hud-x></div></div>
        <div class="math-abs-stat"><div class="math-abs-stat-label">距离</div><div class="math-abs-stat-value" data-hud-abs></div></div>
        <div class="math-abs-stat"><div class="math-abs-stat-label">对称点</div><div class="math-abs-stat-value" data-hud-opp></div></div>
      </div>
      <svg class="math-abs-svg" data-svg>
        <defs>
          <linearGradient id="math-abs-neg-zone" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stop-color="#f472b6" stop-opacity="0.28"></stop>
            <stop offset="100%" stop-color="#f472b6" stop-opacity="0.04"></stop>
          </linearGradient>
          <linearGradient id="math-abs-pos-zone" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stop-color="#22d3ee" stop-opacity="0.04"></stop>
            <stop offset="100%" stop-color="#22d3ee" stop-opacity="0.28"></stop>
          </linearGradient>
          <marker id="math-abs-arrow-cyan" markerWidth="13" markerHeight="13" refX="11" refY="6.5" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M0,2 L11,6.5 L0,11 Z" fill="#22d3ee"></path>
          </marker>
          <marker id="math-abs-arrow-pink" markerWidth="13" markerHeight="13" refX="11" refY="6.5" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M0,2 L11,6.5 L0,11 Z" fill="#f472b6"></path>
          </marker>
        </defs>
        <g data-zones>
          <rect class="math-abs-zone neg" data-zone-neg></rect>
          <rect class="math-abs-zone pos" data-zone-pos></rect>
        </g>
        <g data-axis></g>
        <g data-graphics>
          <line class="math-abs-guide" data-guide-zero></line>
          <line class="math-abs-distance-line" data-distance-line></line>
          <line class="math-abs-mirror-line" data-mirror-line></line>
          <path class="math-abs-bracket" data-bracket></path>
          <path class="math-abs-arc" data-arc></path>
          <path class="math-abs-arrow" data-arrow></path>
          <text class="math-abs-label" data-arrow-label></text>
          <circle class="math-abs-point opp" r="10" data-drag="opp" data-point-opp></circle>
          <text class="math-abs-label" data-label-opp>-x</text>
          <circle class="math-abs-point y" r="11" data-drag="y" data-point-y></circle>
          <text class="math-abs-label" data-label-y>b</text>
          <circle class="math-abs-point x" r="12" data-drag="x" data-point-x></circle>
          <text class="math-abs-label" data-label-x>x</text>
        </g>
      </svg>
    `;
    container.appendChild(scene);

    let panel = null;
    if (panelHost) {
      panelHost.innerHTML = "";
      panel = document.createElement("div");
      panel.className = "math-abs-panel";
      panel.innerHTML = `
        <div class="math-abs-card math-abs-tabs">
          <button class="math-abs-button active" type="button" data-mode="1">|x| 与 -x</button>
          <button class="math-abs-button" type="button" data-mode="2">|a-b| 距离</button>
        </div>
        <div class="math-abs-card">
          <div class="math-abs-card-head"><span>参数</span><span data-snap-state>0.5 吸附</span></div>
          <div class="math-abs-two">
            <div class="math-abs-field">
              <label>x / a <span class="math-abs-chip" data-panel-x></span></label>
              <input class="math-abs-range" data-slider-x type="range" min="-10" max="10" step="0.5" value="4.5">
            </div>
            <div class="math-abs-field" data-y-field>
              <label>b <span class="math-abs-chip" data-panel-y></span></label>
              <input class="math-abs-range y" data-slider-y type="range" min="-10" max="10" step="0.5" value="-3">
            </div>
          </div>
          <div class="math-abs-quick">
            <button class="math-abs-button" type="button" data-quick="-6">-6</button>
            <button class="math-abs-button" type="button" data-quick="-3">-3</button>
            <button class="math-abs-button" type="button" data-quick="0">0</button>
            <button class="math-abs-button" type="button" data-quick="3">3</button>
            <button class="math-abs-button" type="button" data-quick="6">6</button>
          </div>
        </div>
        <div class="math-abs-card math-abs-toggles">
          <button class="math-abs-button active" type="button" data-toggle="opp">显示 -x</button>
          <button class="math-abs-button active" type="button" data-toggle="abs">显示 |x|</button>
          <button class="math-abs-button active" type="button" data-toggle="snap">0.5 吸附</button>
        </div>
        <div class="math-abs-card math-abs-result">
          <div>
            <div class="math-abs-row"><span data-row-a-label>当前数值 x</span><strong data-row-x></strong></div>
            <div class="math-abs-row" data-row-opp-wrap><span>相反数 -x</span><strong data-row-opp></strong></div>
            <div class="math-abs-row" data-row-abs-wrap><span data-row-abs-label>绝对值 |x|</span><strong data-row-abs></strong></div>
          </div>
          <div class="math-abs-explain" data-explain></div>
        </div>
      `;
      panelHost.appendChild(panel);
      fitPanel(panel);
    }

    const els = {
      svg: scene.querySelector("[data-svg]"),
      zoneNeg: scene.querySelector("[data-zone-neg]"),
      zonePos: scene.querySelector("[data-zone-pos]"),
      axis: scene.querySelector("[data-axis]"),
      guideZero: scene.querySelector("[data-guide-zero]"),
      distanceLine: scene.querySelector("[data-distance-line]"),
      mirrorLine: scene.querySelector("[data-mirror-line]"),
      bracket: scene.querySelector("[data-bracket]"),
      arc: scene.querySelector("[data-arc]"),
      arrow: scene.querySelector("[data-arrow]"),
      arrowLabel: scene.querySelector("[data-arrow-label]"),
      pointX: scene.querySelector("[data-point-x]"),
      pointY: scene.querySelector("[data-point-y]"),
      pointOpp: scene.querySelector("[data-point-opp]"),
      labelX: scene.querySelector("[data-label-x]"),
      labelY: scene.querySelector("[data-label-y]"),
      labelOpp: scene.querySelector("[data-label-opp]"),
      hudX: scene.querySelector("[data-hud-x]"),
      hudAbs: scene.querySelector("[data-hud-abs]"),
      hudOpp: scene.querySelector("[data-hud-opp]"),
      panel,
      sliderX: panel?.querySelector("[data-slider-x]"),
      sliderY: panel?.querySelector("[data-slider-y]"),
      yField: panel?.querySelector("[data-y-field]"),
      panelX: panel?.querySelector("[data-panel-x]"),
      panelY: panel?.querySelector("[data-panel-y]"),
      snapState: panel?.querySelector("[data-snap-state]"),
      rowALabel: panel?.querySelector("[data-row-a-label]"),
      rowX: panel?.querySelector("[data-row-x]"),
      rowOpp: panel?.querySelector("[data-row-opp]"),
      rowOppWrap: panel?.querySelector("[data-row-opp-wrap]"),
      rowAbs: panel?.querySelector("[data-row-abs]"),
      rowAbsWrap: panel?.querySelector("[data-row-abs-wrap]"),
      rowAbsLabel: panel?.querySelector("[data-row-abs-label]"),
      explain: panel?.querySelector("[data-explain]")
    };

    const markerCyan = scene.querySelector("#math-abs-arrow-cyan");
    const markerPink = scene.querySelector("#math-abs-arrow-pink");
    const nativeTouchAbort = typeof AbortController !== "undefined" ? new AbortController() : null;
    const nativeTouchOptions = nativeTouchAbort ? { signal: nativeTouchAbort.signal } : undefined;

    [scene, els.svg, panel, panelHost].forEach(target => {
      if (!target) return;
      target.setAttribute?.("draggable", "false");
      blockNativeTouchMenus(target, nativeTouchOptions);
    });
    scene.querySelectorAll("svg, g, line, rect, circle, path, text, polygon").forEach(node => node.setAttribute("draggable", "false"));
    panel?.querySelectorAll("button, input, label, span, strong, div").forEach(node => node.setAttribute("draggable", "false"));

    function sx(value) {
      return metrics.originX + value * metrics.unit;
    }

    function valueFromClient(clientX) {
      const rect = els.svg.getBoundingClientRect();
      const raw = clamp((clientX - rect.left - metrics.originX) / metrics.unit, -10, 10);
      return state.snap ? Math.round(raw * 2) / 2 : round1(raw);
    }

    function drawAxis() {
      els.axis.innerHTML = "";
      const y = metrics.originY;
      setAttrs(els.zoneNeg, {
        x: 0,
        y: y - 88,
        width: metrics.originX,
        height: 176
      });
      setAttrs(els.zonePos, {
        x: metrics.originX,
        y: y - 88,
        width: metrics.width - metrics.originX,
        height: 176
      });
      els.axis.appendChild(svgEl("line", {
        class: "math-abs-axis-line",
        x1: 34,
        y1: y,
        x2: metrics.width - 34,
        y2: y
      }));
      els.axis.appendChild(svgEl("polygon", {
        class: "math-abs-axis-arrow",
        points: `${metrics.width - 24},${y} ${metrics.width - 42},${y - 10} ${metrics.width - 42},${y + 10}`
      }));
      for (let i = -10; i <= 10; i += 1) {
        const x = sx(i);
        const major = i === 0;
        els.axis.appendChild(svgEl("line", {
          class: `math-abs-tick${major ? " zero" : ""}`,
          x1: x,
          y1: y - (major ? 22 : 14),
          x2: x,
          y2: y + (major ? 22 : 14)
        }));
        const text = svgEl("text", {
          class: `math-abs-tick-text${major ? " zero" : ""}`,
          x,
          y: y + 27
        });
        text.textContent = i;
        els.axis.appendChild(text);
      }
    }

    function updatePanel() {
      const x = round1(state.x);
      const y = round1(state.y);
      const opp = round1(-x);
      const abs = state.mode === 1 ? Math.abs(x) : Math.abs(x - y);

      els.hudX.textContent = state.mode === 1 ? fmt(x) : `a=${fmt(x)}`;
      els.hudAbs.textContent = state.mode === 1 ? `|x|=${fmt(abs)}` : `|a-b|=${fmt(abs)}`;
      els.hudOpp.textContent = state.mode === 1 ? fmt(opp) : `b=${fmt(y)}`;

      if (!panel) return;
      els.sliderX.value = String(x);
      els.sliderY.value = String(y);
      els.panelX.textContent = fmt(x);
      els.panelY.textContent = fmt(y);
      if (els.snapState) els.snapState.textContent = state.snap ? "0.5 吸附" : "自由拖动";
      els.yField.style.display = state.mode === 2 ? "" : "none";
      els.rowALabel.textContent = state.mode === 1 ? "当前数值 x" : "点 a 的坐标";
      els.rowX.textContent = state.mode === 1 ? fmt(x) : fmt(x);
      els.rowOppWrap.style.display = state.mode === 1 ? "" : "none";
      els.rowOpp.textContent = fmt(opp);
      els.rowAbsLabel.textContent = state.mode === 1 ? "绝对值 |x|" : "两点距离 |a-b|";
      els.rowAbs.textContent = fmt(abs);
      els.rowAbsWrap.style.display = state.showAbsolute ? "" : "none";
      els.explain.textContent = state.mode === 1
        ? `|x| 是到 0 的距离；-x 与 x 关于 0 对称。`
        : `|a-b| 是 a、b 两点的距离。`;

      panel.querySelectorAll("[data-mode]").forEach(btn => btn.classList.toggle("active", Number(btn.dataset.mode) === state.mode));
      panel.querySelector('[data-toggle="opp"]')?.classList.toggle("active", state.showOpposite);
      panel.querySelector('[data-toggle="abs"]')?.classList.toggle("active", state.showAbsolute);
      panel.querySelector('[data-toggle="snap"]')?.classList.toggle("active", state.snap);
      panel.querySelectorAll("[data-quick]").forEach(btn => {
        btn.classList.toggle("active", Math.abs(Number(btn.dataset.quick) - x) < 0.01);
      });
    }

    function updateGraphics() {
      const y = metrics.originY;
      const x = round1(state.x);
      const b = round1(state.y);
      const pxX = sx(x);
      const pxZero = sx(0);
      const pxOpp = sx(-x);
      const pxB = sx(b);
      const showModeOne = state.mode === 1;
      const absVisible = state.showAbsolute;

      setAttrs(els.guideZero, {
        x1: pxZero,
        y1: y - 120,
        x2: pxZero,
        y2: y + 80
      });

      setAttrs(els.pointX, { cx: pxX, cy: y, r: showModeOne ? 12 : 11 });
      setAttrs(els.labelX, { x: pxX, y: y - 36 });
      els.labelX.textContent = showModeOne ? `x=${fmt(x)}` : `a=${fmt(x)}`;

      if (showModeOne) {
        els.pointY.style.display = "none";
        els.labelY.style.display = "none";
        els.arrow.style.display = "none";
        els.arrowLabel.style.display = "none";
        els.distanceLine.style.display = absVisible ? "" : "none";
        setAttrs(els.distanceLine, {
          x1: pxZero,
          y1: y + 62,
          x2: pxX,
          y2: y + 62
        });
        els.pointOpp.style.display = state.showOpposite ? "" : "none";
        els.labelOpp.style.display = state.showOpposite ? "" : "none";
        els.arc.style.display = state.showOpposite ? "" : "none";
        els.mirrorLine.style.display = state.showOpposite ? "" : "none";
        setAttrs(els.mirrorLine, {
          x1: pxX,
          y1: y,
          x2: pxOpp,
          y2: y
        });
        setAttrs(els.pointOpp, { cx: pxOpp, cy: y, r: 10 });
        setAttrs(els.labelOpp, { x: pxOpp, y: y - 36 });
        els.labelOpp.textContent = `-x=${fmt(-x)}`;
        const arcHeight = clamp(Math.abs(pxX - pxOpp) * 0.28, 42, 150);
        els.arc.setAttribute("d", `M ${pxX} ${y - 7} Q ${pxZero} ${y - arcHeight} ${pxOpp} ${y - 7}`);
        if (absVisible) {
          const left = Math.min(pxZero, pxX);
          const right = Math.max(pxZero, pxX);
          els.bracket.style.display = "";
          els.bracket.setAttribute("d", `M ${left} ${y + 48} L ${left} ${y + 62} L ${right} ${y + 62} L ${right} ${y + 48}`);
        } else {
          els.bracket.style.display = "none";
          els.distanceLine.style.display = "none";
        }
      } else {
        els.pointOpp.style.display = "none";
        els.labelOpp.style.display = "none";
        els.arc.style.display = "none";
        els.mirrorLine.style.display = "none";
        els.pointY.style.display = "";
        els.labelY.style.display = "";
        const samePoint = Math.abs(x - b) < 0.001;
        setAttrs(els.pointX, { cx: pxX, cy: samePoint ? y - 9 : y, r: 11 });
        setAttrs(els.labelX, { x: clamp(pxX, 48, metrics.width - 48), y: samePoint ? y - 44 : y - 36 });
        setAttrs(els.pointY, { cx: pxB, cy: samePoint ? y + 9 : y, r: 11 });
        setAttrs(els.labelY, { x: pxB, y: y - 36 });
        els.labelX.textContent = samePoint ? `a=b=${fmt(x)}` : `a=${fmt(x)}`;
        els.labelY.textContent = samePoint ? "" : `b=${fmt(b)}`;
        const left = Math.min(pxX, pxB);
        const right = Math.max(pxX, pxB);
        if (absVisible && !samePoint) {
          els.bracket.style.display = "";
          els.bracket.setAttribute("d", `M ${left} ${y + 48} L ${left} ${y + 62} L ${right} ${y + 62} L ${right} ${y + 48}`);
          els.distanceLine.style.display = "";
          setAttrs(els.distanceLine, {
            x1: pxX,
            y1: y + 62,
            x2: pxB,
            y2: y + 62
          });
        } else {
          els.bracket.style.display = "none";
          els.distanceLine.style.display = "none";
        }
        els.arrowLabel.style.display = "";
        if (samePoint) {
          els.arrow.style.display = "none";
          els.arrowLabel.setAttribute("x", clamp(pxX, 78, metrics.width - 78));
          els.arrowLabel.setAttribute("y", y - 92);
          els.arrowLabel.textContent = "距离=0";
        } else {
          const dir = pxX >= pxB ? 1 : -1;
          const arrowStart = pxB + dir * 14;
          const arrowEnd = pxX - dir * 16;
          els.arrow.style.display = "";
          els.arrow.setAttribute("stroke", x - b >= 0 ? "#22d3ee" : "#f472b6");
          els.arrow.setAttribute("marker-end", x - b >= 0 ? "url(#math-abs-arrow-cyan)" : "url(#math-abs-arrow-pink)");
          els.arrow.setAttribute("d", `M ${arrowStart} ${y - 62} C ${(arrowStart + arrowEnd) / 2} ${y - 100}, ${(arrowStart + arrowEnd) / 2} ${y - 100}, ${arrowEnd} ${y - 62}`);
          els.arrowLabel.setAttribute("x", (pxX + pxB) / 2);
          els.arrowLabel.setAttribute("y", y - 112);
          els.arrowLabel.textContent = `a-b=${fmt(x - b)}`;
        }
      }
      updatePanel();
    }

    function resize() {
      const rect = els.svg.getBoundingClientRect();
      metrics.width = Math.max(320, rect.width);
      metrics.height = Math.max(240, rect.height);
      metrics.originX = metrics.width / 2;
      metrics.originY = metrics.height * 0.58;
      metrics.unit = clamp((metrics.width - 90) / 22, 28, 64);
      const arrowScale = clamp(metrics.width / 560, 0.62, 1);
      const markerSize = 13 * arrowScale;
      const markerRefX = 11 * arrowScale;
      const markerRefY = 6.5 * arrowScale;
      [markerCyan, markerPink].forEach(marker => {
        setAttrs(marker, {
          markerWidth: markerSize,
          markerHeight: markerSize,
          refX: markerRefX,
          refY: markerRefY
        });
      });
      els.arrow.style.strokeWidth = String(clamp(metrics.width / 180, 2.1, 3.2));
      drawAxis();
      updateGraphics();
      if (panel) fitPanel(panel);
    }

    function setMode(mode) {
      state.mode = mode;
      if (state.mode === 2) {
        state.showOpposite = false;
      } else {
        state.showOpposite = true;
      }
      updateGraphics();
    }

    function onPointerDown(event) {
      const target = event.target?.closest?.("[data-drag]");
      if (!target) return;
      if (state.dragPointerId !== null) return;
      const drag = target.dataset.drag;
      if (drag === "opp") {
        state.dragTarget = "x";
      } else if (drag === "y" && state.mode === 2) {
        state.dragTarget = "y";
      } else if (drag === "x") {
        state.dragTarget = "x";
      }
      if (state.dragTarget) {
        state.dragPointerId = event.pointerId;
        try {
          els.svg.setPointerCapture?.(event.pointerId);
        } catch (error) {
          // Some embedded WebViews can throw when capture is already owned.
        }
        event.preventDefault();
      }
    }

    function onPointerMove(event) {
      if (!state.dragTarget) return;
      if (event.pointerId !== state.dragPointerId) return;
      event.preventDefault();
      const steps = event.getCoalescedEvents?.().length ? event.getCoalescedEvents() : [event];
      steps.forEach(step => {
        const value = valueFromClient(step.clientX);
        if (state.dragTarget === "x") {
          state.x = value;
        } else {
          state.y = value;
        }
      });
      updateGraphics();
    }

    function onPointerUp(event) {
      if (!state.dragTarget) return;
      if (event.pointerId !== state.dragPointerId) return;
      event.preventDefault();
      try {
        els.svg.releasePointerCapture?.(event.pointerId);
      } catch (error) {
        // Pointer capture may already be released after browser-level cancel.
      }
      state.dragTarget = null;
      state.dragPointerId = null;
    }

    function onLostPointerCapture(event) {
      if (event.pointerId !== state.dragPointerId) return;
      state.dragTarget = null;
      state.dragPointerId = null;
    }

    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    if (resizeObserver) {
      resizeObserver.observe(container);
      if (panelHost) resizeObserver.observe(panelHost);
    }
    window.addEventListener("resize", resize);

    els.svg.addEventListener("pointerdown", onPointerDown);
    els.svg.addEventListener("pointermove", onPointerMove);
    els.svg.addEventListener("pointerup", onPointerUp);
    els.svg.addEventListener("pointercancel", onPointerUp);
    els.svg.addEventListener("pointerleave", onPointerUp);
    els.svg.addEventListener("lostpointercapture", onLostPointerCapture);

    panel?.addEventListener("click", event => {
      const modeBtn = event.target.closest("[data-mode]");
      if (modeBtn) {
        setMode(Number(modeBtn.dataset.mode));
        return;
      }
      const toggle = event.target.closest("[data-toggle]");
      if (toggle?.dataset.toggle === "opp") {
        state.showOpposite = !state.showOpposite;
        updateGraphics();
      }
      if (toggle?.dataset.toggle === "abs") {
        state.showAbsolute = !state.showAbsolute;
        updateGraphics();
      }
      if (toggle?.dataset.toggle === "snap") {
        state.snap = !state.snap;
        updateGraphics();
      }
      const quick = event.target.closest("[data-quick]");
      if (quick) {
        state.x = Number(quick.dataset.quick);
        updateGraphics();
      }
    });
    els.sliderX?.addEventListener("input", event => {
      state.x = round1(Number(event.target.value));
      updateGraphics();
    });
    els.sliderY?.addEventListener("input", event => {
      state.y = round1(Number(event.target.value));
      updateGraphics();
    });

    resize();

    container.__mathAbsCleanup = () => {
      if (resizeObserver) resizeObserver.disconnect();
      nativeTouchAbort?.abort();
      window.removeEventListener("resize", resize);
      els.svg.removeEventListener("pointerdown", onPointerDown);
      els.svg.removeEventListener("pointermove", onPointerMove);
      els.svg.removeEventListener("pointerup", onPointerUp);
      els.svg.removeEventListener("pointercancel", onPointerUp);
      els.svg.removeEventListener("pointerleave", onPointerUp);
      els.svg.removeEventListener("lostpointercapture", onLostPointerCapture);
      container.innerHTML = "";
      if (panelHost) panelHost.innerHTML = "";
    };
  }

  window.MATH_VISUAL_SCENES[CARD_ID] = {
    mount,
    unmount(container) {
      if (container.__mathAbsCleanup) {
        container.__mathAbsCleanup();
        delete container.__mathAbsCleanup;
      } else {
        container.innerHTML = "";
      }
    }
  };
})();
