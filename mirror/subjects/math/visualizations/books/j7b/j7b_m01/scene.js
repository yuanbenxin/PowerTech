window.MATH_VISUAL_SCENES = window.MATH_VISUAL_SCENES || {};

(function () {
  const CARD_ID = "j7b_m01";
  const STYLE_ID = "math-parallel-lines-style";
  const SVG_NS = "http://www.w3.org/2000/svg";

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function fmt(value) {
    return `${Math.round(value)}°`;
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
      .math-parallel-scene,
      .math-parallel-scene *,
      .math-parallel-panel,
      .math-parallel-panel * {
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -webkit-user-drag: none;
        user-select: none;
      }
      .math-parallel-scene {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        color: #f8fafc;
        background:
          radial-gradient(circle at 22% 18%, rgba(34,211,238,0.14), transparent 32%),
          radial-gradient(circle at 78% 72%, rgba(250,204,21,0.12), transparent 34%),
          linear-gradient(145deg, #020617 0%, #07111d 55%, #020617 100%);
        font-family: Inter, "Noto Sans SC", "Microsoft YaHei UI", sans-serif;
        touch-action: none;
      }
      .math-parallel-svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: block;
        user-select: none;
        touch-action: none;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -webkit-user-drag: none;
        transform: scale(var(--math-parallel-zoom, 1));
        transform-origin: center center;
        will-change: transform;
      }
      .math-parallel-line {
        stroke-linecap: round;
        filter: drop-shadow(0 0 12px rgba(255,255,255,0.16));
      }
      .math-parallel-line.base {
        stroke: #22d3ee;
        stroke-width: 6;
      }
      .math-parallel-line.lower {
        stroke: #f472b6;
        stroke-width: 6;
      }
      .math-parallel-line.cross {
        stroke: #facc15;
        stroke-width: 7;
      }
      .math-parallel-hit {
        stroke: transparent;
        stroke-width: 34;
        stroke-linecap: round;
        cursor: grab;
      }
      .math-parallel-hit:active {
        cursor: grabbing;
      }
      .math-parallel-point {
        fill: #ffffff;
        stroke: #a7f3d0;
        stroke-width: 4;
        filter: drop-shadow(0 0 14px rgba(52,211,153,0.62));
        pointer-events: none;
      }
      .math-parallel-angle path.fill {
        fill: rgba(71,85,105,0.22);
      }
      .math-parallel-angle path.stroke {
        fill: none;
        stroke: rgba(148,163,184,0.44);
        stroke-width: 3;
        stroke-linecap: round;
      }
      .math-parallel-angle text {
        fill: rgba(226,232,240,0.66);
        font-size: 13px;
        font-weight: 950;
        text-anchor: middle;
        dominant-baseline: middle;
        paint-order: stroke;
        stroke: rgba(2,6,23,0.86);
        stroke-width: 4;
        stroke-linejoin: round;
        pointer-events: none;
      }
      .math-parallel-angle.active path.fill {
        fill: color-mix(in srgb, var(--angle-color) 30%, transparent);
      }
      .math-parallel-angle.active path.stroke {
        stroke: var(--angle-color);
        filter: drop-shadow(0 0 10px var(--angle-color));
      }
      .math-parallel-angle.active text {
        fill: #ffffff;
      }
      .math-parallel-label {
        fill: #ffffff;
        font-size: 18px;
        font-weight: 950;
        paint-order: stroke;
        stroke: rgba(2,6,23,0.9);
        stroke-width: 5;
        stroke-linejoin: round;
        pointer-events: none;
      }
      .math-parallel-proof {
        fill: none;
        stroke: #22c55e;
        stroke-width: 5;
        stroke-linecap: round;
        stroke-dasharray: 10 10;
        filter: drop-shadow(0 0 14px rgba(34,197,94,0.62));
        opacity: 0;
      }
      .math-parallel-guide {
        fill: none;
        stroke: var(--guide-color, #22d3ee);
        stroke-width: 6;
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke-dasharray: 14 10;
        opacity: 0;
        filter: drop-shadow(0 0 14px var(--guide-color, #22d3ee));
        pointer-events: none;
      }
      .math-parallel-guide.active {
        opacity: 0.82;
      }
      .math-parallel-guide-label,
      .math-parallel-diff-label {
        fill: #ffffff;
        font-size: 17px;
        font-weight: 950;
        text-anchor: middle;
        dominant-baseline: middle;
        paint-order: stroke;
        stroke: rgba(2,6,23,0.9);
        stroke-width: 5;
        stroke-linejoin: round;
        pointer-events: none;
      }
      .math-parallel-diff-label {
        fill: #fecaca;
        font-size: 15px;
      }
      .math-parallel-hud {
        position: absolute;
        left: 14px;
        top: 14px;
        z-index: 4;
        display: grid;
        grid-template-columns: repeat(3, minmax(78px, 1fr));
        gap: 8px;
        width: min(460px, calc(100% - 28px));
        pointer-events: none;
      }
      .math-parallel-stat {
        min-width: 0;
        border: 1px solid rgba(148,163,184,0.18);
        border-radius: 8px;
        background: rgba(2,6,23,0.62);
        backdrop-filter: blur(12px);
        padding: 8px 10px;
      }
      .math-parallel-stat-label {
        color: rgba(226,232,240,0.56);
        font-size: 10px;
        font-weight: 900;
        letter-spacing: 0.12em;
      }
      .math-parallel-stat-value {
        margin-top: 2px;
        color: #ffffff;
        font-size: 17px;
        line-height: 1;
        font-weight: 950;
        white-space: nowrap;
      }
      .math-parallel-panel {
        width: 100%;
        height: 100%;
        min-height: 0;
        overflow-x: hidden;
        overflow-y: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        display: grid;
        grid-auto-rows: min-content;
        align-content: start;
        gap: 10px;
        padding: 14px;
        color: #f8fafc;
        font-family: Inter, "Noto Sans SC", "Microsoft YaHei UI", sans-serif;
        touch-action: pan-y;
      }
      .math-parallel-panel::-webkit-scrollbar {
        width: 0;
        height: 0;
      }
      .math-parallel-card {
        min-height: 0;
        border: 1px solid rgba(148,163,184,0.16);
        border-radius: 8px;
        background: rgba(15,23,42,0.64);
        padding: 10px;
      }
      .math-parallel-switch {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 8px;
        align-items: center;
      }
      .math-parallel-button {
        min-width: 0;
        min-height: var(--bio-touch-target, 44px);
        border: 1px solid rgba(148,163,184,0.18);
        border-radius: 8px;
        background: rgba(2,6,23,0.36);
        color: rgba(226,232,240,0.76);
        font-size: 11px;
        font-weight: 950;
        line-height: 1.18;
        padding: 7px 8px;
        cursor: pointer;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -webkit-user-drag: none;
        user-select: none;
      }
      .math-parallel-button.active {
        border-color: rgba(34,211,238,0.72);
        background: rgba(34,211,238,0.14);
        color: #e0f2fe;
      }
      .math-parallel-button:active {
        transform: scale(0.98);
      }
      .math-parallel-field {
        display: grid;
        gap: 6px;
      }
      .math-parallel-field label {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        color: rgba(226,232,240,0.7);
        font-size: 11px;
        font-weight: 900;
      }
      .math-parallel-chip {
        color: #ffffff;
        font-size: 16px;
        line-height: 1;
        font-weight: 950;
      }
      .math-parallel-range {
        width: 100%;
        height: 30px;
        margin: 0;
        accent-color: #f472b6;
        touch-action: none;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -webkit-user-drag: none;
        user-select: none;
      }
      .math-parallel-stepper {
        display: grid;
        grid-template-columns: 42px minmax(0, 1fr) 42px;
        gap: 7px;
        align-items: center;
      }
      .math-parallel-field-actions {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 7px;
      }
      .math-parallel-filters {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 7px;
      }
      .math-parallel-proof-btn {
        width: 100%;
      }
      .math-parallel-results {
        min-height: 0;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        gap: 8px;
      }
      .math-parallel-pairs {
        display: grid;
        gap: 6px;
        min-height: 0;
        overflow: hidden;
      }
      .math-parallel-pair {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        min-height: 27px;
        border-left: 4px solid var(--pair-color);
        border-radius: 7px;
        background: rgba(2,6,23,0.26);
        padding: 5px 8px;
        color: rgba(226,232,240,0.78);
        font-size: 11px;
        font-weight: 850;
      }
      .math-parallel-pair strong {
        color: #ffffff;
        white-space: nowrap;
      }
      .math-parallel-explain {
        min-height: 0;
        overflow: hidden;
        color: rgba(203,213,225,0.78);
        font-size: 12px;
        line-height: 1.5;
        font-weight: 750;
      }
      .math-parallel-panel[data-size="compact"] {
        gap: 8px;
        padding: 10px;
      }
      .math-parallel-panel[data-size="compact"] .math-parallel-card {
        padding: 8px;
      }
      .math-parallel-panel[data-size="compact"] .math-parallel-button {
        min-height: 34px;
        font-size: 10px;
        padding: 5px 6px;
      }
      .math-parallel-panel[data-size="micro"] {
        gap: 6px;
        padding: 8px;
      }
      .math-parallel-panel[data-size="micro"] .math-parallel-card {
        padding: 7px;
      }
      .math-parallel-panel[data-size="micro"] .math-parallel-button {
        min-height: 31px;
        font-size: 9px;
        padding: 4px 5px;
      }
      .math-parallel-panel[data-size="micro"] .math-parallel-range {
        height: 22px;
      }
      .math-parallel-panel[data-size="micro"] .math-parallel-pair {
        min-height: 22px;
        font-size: 10px;
        padding: 3px 6px;
      }
      .math-parallel-panel[data-size="micro"] .math-parallel-explain {
        display: none;
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

  function polar(x, y, radius, deg) {
    const rad = deg * Math.PI / 180;
    return { x: x + radius * Math.cos(rad), y: y - radius * Math.sin(rad) };
  }

  function sectorPath(x, y, radius, start, end) {
    const s = polar(x, y, radius, start);
    const e = polar(x, y, radius, end);
    const large = Math.abs(end - start) > 180 ? 1 : 0;
    return `M ${x} ${y} L ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 0 ${e.x} ${e.y} Z`;
  }

  function arcPath(x, y, radius, start, end) {
    const s = polar(x, y, radius, start);
    const e = polar(x, y, radius, end);
    const large = Math.abs(end - start) > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 0 ${e.x} ${e.y}`;
  }

  function mount(container, context = {}) {
    ensureStyle();
    const panelHost = context.externalPanel || null;
    const colors = {
      all: "#94a3b8",
      cor: "#22d3ee",
      alt: "#facc15",
      con: "#a78bfa",
      ver: "#fb923c",
      sup: "#34d399"
    };
    const labels = {
      all: "查看全部",
      cor: "同位角",
      alt: "内错角",
      con: "同旁内角",
      ver: "对顶角",
      sup: "邻补角"
    };
    const state = {
      isParallel: true,
      angleC: 58,
      bOffset: 0,
      distance: 190,
      activeType: "all",
      dragMode: null,
      dragPointerId: null,
      proofActive: false,
      proofProgress: 0,
      raf: 0,
      viewScale: 1
    };
    const view = { width: 0, height: 0, cx: 0, cy: 0 };
    let geometry = null;
    const zoomGesture = {
      pointers: new Map(),
      startScale: 1,
      startDistance: 0
    };

    container.innerHTML = "";
    const scene = document.createElement("div");
    scene.className = "math-parallel-scene";
    scene.innerHTML = `
      <div class="math-parallel-hud">
        <div class="math-parallel-stat"><div class="math-parallel-stat-label">截线角</div><div class="math-parallel-stat-value" data-hud-c></div></div>
        <div class="math-parallel-stat"><div class="math-parallel-stat-label">直线关系</div><div class="math-parallel-stat-value" data-hud-parallel></div></div>
        <div class="math-parallel-stat"><div class="math-parallel-stat-label">当前规律</div><div class="math-parallel-stat-value" data-hud-type></div></div>
      </div>
      <svg class="math-parallel-svg" data-svg>
        <g data-traces>
          <path class="math-parallel-guide" data-guide></path>
          <text class="math-parallel-guide-label" data-guide-label></text>
          <text class="math-parallel-diff-label" data-diff-label></text>
          <path class="math-parallel-proof" data-proof></path>
        </g>
        <g data-angles></g>
        <g data-lines>
          <line class="math-parallel-line base" data-line-a></line>
          <line class="math-parallel-line lower" data-line-b></line>
          <line class="math-parallel-line cross" data-line-c></line>
          <line class="math-parallel-hit" data-hit-c></line>
          <line class="math-parallel-hit" data-hit-gap></line>
        </g>
        <g data-points>
          <circle class="math-parallel-point" r="7" data-point-top></circle>
          <circle class="math-parallel-point" r="7" data-point-bottom></circle>
          <text class="math-parallel-label" data-label-a>a</text>
          <text class="math-parallel-label" data-label-b>b</text>
          <text class="math-parallel-label" data-label-c>c</text>
        </g>
      </svg>
    `;
    container.appendChild(scene);

    let panel = null;
    if (panelHost) {
      panelHost.innerHTML = "";
      panel = document.createElement("div");
      panel.className = "math-parallel-panel";
      panel.innerHTML = `
        <div class="math-parallel-card math-parallel-switch">
          <button class="math-parallel-button active" type="button" data-toggle-parallel>保持 a ∥ b</button>
          <div class="math-parallel-chip" data-parallel-chip>平行</div>
        </div>
        <div class="math-parallel-card math-parallel-field">
          <label>截线角 <span class="math-parallel-chip" data-c-angle>58°</span></label>
          <div class="math-parallel-stepper">
            <button class="math-parallel-button" type="button" data-angle-step="-1">-1°</button>
            <input class="math-parallel-range" data-slider-c type="range" min="28" max="78" step="1" value="58">
            <button class="math-parallel-button" type="button" data-angle-step="1">+1°</button>
          </div>
        </div>
        <div class="math-parallel-card math-parallel-field">
          <label>下方直线偏转 <span class="math-parallel-chip" data-b-offset>0°</span></label>
          <input class="math-parallel-range" data-slider-b type="range" min="-28" max="28" step="1" value="0">
          <div class="math-parallel-field-actions">
            <button class="math-parallel-button" type="button" data-b-step="-1">-1°</button>
            <button class="math-parallel-button" type="button" data-b-zero>归零</button>
            <button class="math-parallel-button" type="button" data-b-step="1">+1°</button>
          </div>
        </div>
        <div class="math-parallel-card math-parallel-filters">
          <button class="math-parallel-button active" type="button" data-filter="all">全部</button>
          <button class="math-parallel-button" type="button" data-filter="cor">同位角</button>
          <button class="math-parallel-button" type="button" data-filter="alt">内错角</button>
          <button class="math-parallel-button" type="button" data-filter="con">同旁内角</button>
          <button class="math-parallel-button" type="button" data-filter="ver">对顶角</button>
          <button class="math-parallel-button" type="button" data-filter="sup">邻补角</button>
        </div>
        <div class="math-parallel-card math-parallel-results">
          <button class="math-parallel-button math-parallel-proof-btn" type="button" data-proof-btn>播放同位角平移证明</button>
          <div class="math-parallel-pairs" data-pairs></div>
          <div class="math-parallel-explain" data-explain></div>
        </div>
      `;
      panelHost.appendChild(panel);
      fitPanel(panel);
    }

    const els = {
      svg: scene.querySelector("[data-svg]"),
      traces: scene.querySelector("[data-traces]"),
      angles: scene.querySelector("[data-angles]"),
      lineA: scene.querySelector("[data-line-a]"),
      lineB: scene.querySelector("[data-line-b]"),
      lineC: scene.querySelector("[data-line-c]"),
      hitC: scene.querySelector("[data-hit-c]"),
      hitGap: scene.querySelector("[data-hit-gap]"),
      pointTop: scene.querySelector("[data-point-top]"),
      pointBottom: scene.querySelector("[data-point-bottom]"),
      labelA: scene.querySelector("[data-label-a]"),
      labelB: scene.querySelector("[data-label-b]"),
      labelC: scene.querySelector("[data-label-c]"),
      guide: scene.querySelector("[data-guide]"),
      guideLabel: scene.querySelector("[data-guide-label]"),
      diffLabel: scene.querySelector("[data-diff-label]"),
      proof: scene.querySelector("[data-proof]"),
      hudC: scene.querySelector("[data-hud-c]"),
      hudParallel: scene.querySelector("[data-hud-parallel]"),
      hudType: scene.querySelector("[data-hud-type]"),
      panel,
      toggleParallel: panel?.querySelector("[data-toggle-parallel]"),
      parallelChip: panel?.querySelector("[data-parallel-chip]"),
      sliderC: panel?.querySelector("[data-slider-c]"),
      cAngle: panel?.querySelector("[data-c-angle]"),
      sliderB: panel?.querySelector("[data-slider-b]"),
      bOffset: panel?.querySelector("[data-b-offset]"),
      pairs: panel?.querySelector("[data-pairs]"),
      explain: panel?.querySelector("[data-explain]")
    };

    const nativeTouchAbort = typeof AbortController !== "undefined" ? new AbortController() : null;
    const nativeTouchOptions = nativeTouchAbort ? { signal: nativeTouchAbort.signal } : undefined;
    const wheelOptions = nativeTouchAbort ? { passive: false, signal: nativeTouchAbort.signal } : { passive: false };
    [scene, els.svg, panel, panelHost].forEach(target => {
      if (!target) return;
      target.setAttribute?.("draggable", "false");
      blockNativeTouchMenus(target, nativeTouchOptions);
    });
    scene.querySelectorAll("svg, g, line, path, circle, text").forEach(node => node.setAttribute("draggable", "false"));
    panel?.querySelectorAll("button, input, label, span, strong, div").forEach(node => node.setAttribute("draggable", "false"));

    const pairDefs = {
      cor: [["∠1", "∠5", "相等"], ["∠2", "∠6", "相等"], ["∠3", "∠7", "相等"], ["∠4", "∠8", "相等"]],
      alt: [["∠3", "∠6", "相等"], ["∠4", "∠5", "相等"]],
      con: [["∠3", "∠5", "互补"], ["∠4", "∠6", "互补"]],
      ver: [["∠1", "∠4", "相等"], ["∠2", "∠3", "相等"], ["∠5", "∠8", "相等"], ["∠6", "∠7", "相等"]],
      sup: [["∠1", "∠2", "互补"], ["∠1", "∠3", "互补"], ["∠3", "∠4", "互补"], ["∠2", "∠4", "互补"], ["∠5", "∠6", "互补"], ["∠5", "∠7", "互补"], ["∠7", "∠8", "互补"], ["∠6", "∠8", "互补"]]
    };

    function applyViewportZoom() {
      scene.style.setProperty("--math-parallel-zoom", state.viewScale.toFixed(4));
    }

    function pointerList() {
      return Array.from(zoomGesture.pointers.values());
    }

    function distanceBetween(a, b) {
      return Math.hypot(a.x - b.x, a.y - b.y);
    }

    function startPinchZoom() {
      const points = pointerList();
      if (points.length < 2) return;
      zoomGesture.startScale = state.viewScale;
      zoomGesture.startDistance = Math.max(1, distanceBetween(points[0], points[1]));
    }

    function updatePinchZoom() {
      const points = pointerList();
      if (points.length < 2) return;
      const distance = Math.max(1, distanceBetween(points[0], points[1]));
      state.viewScale = clamp(zoomGesture.startScale * (distance / zoomGesture.startDistance), 1, 3);
      applyViewportZoom();
    }

    const angleTypes = {
      1: ["cor", "ver", "sup"],
      2: ["cor", "ver", "sup"],
      3: ["cor", "alt", "con", "ver", "sup"],
      4: ["cor", "alt", "con", "ver", "sup"],
      5: ["cor", "alt", "con", "ver", "sup"],
      6: ["cor", "alt", "con", "ver", "sup"],
      7: ["cor", "ver", "sup"],
      8: ["cor", "ver", "sup"]
    };

    function lineExtentThrough(point, deg, length = 2200) {
      const rad = deg * Math.PI / 180;
      const dx = Math.cos(rad) * length;
      const dy = -Math.sin(rad) * length;
      return { x1: point.x - dx, y1: point.y - dy, x2: point.x + dx, y2: point.y + dy };
    }

    function computeGeometry() {
      const cRad = state.angleC * Math.PI / 180;
      const half = state.distance / 2;
      const xTop = view.cx + half / Math.tan(cRad);
      const xBottom = view.cx - half / Math.tan(cRad);
      const top = { x: xTop, y: view.cy - half };
      const bottom = { x: xBottom, y: view.cy + half };
      return {
        top,
        bottom,
        a: lineExtentThrough(top, 0),
        b: lineExtentThrough(bottom, state.isParallel ? 0 : state.bOffset),
        c: lineExtentThrough(top, state.angleC),
        lowerAngle: state.isParallel ? state.angleC : clamp(state.angleC - state.bOffset, 18, 162)
      };
    }

    function makeAngle(id, center, start, end, value, activeColor) {
      const group = svgEl("g", { class: "math-parallel-angle", "data-angle": id });
      group.style.setProperty("--angle-color", activeColor);
      const fill = svgEl("path", { class: "fill", d: sectorPath(center.x, center.y, 54, start, end) });
      const stroke = svgEl("path", { class: "stroke", d: arcPath(center.x, center.y, 54, start, end) });
      const mid = (start + end) / 2;
      const pos = polar(center.x, center.y, 80, mid);
      const text = svgEl("text", { x: pos.x, y: pos.y });
      text.textContent = `${id}:${fmt(value)}`;
      group.append(fill, stroke, text);
      const shouldActive = state.activeType === "all" || angleTypes[id]?.includes(state.activeType);
      group.classList.toggle("active", shouldActive);
      if (state.activeType !== "all" && !shouldActive) {
        group.style.opacity = "0.22";
      }
      return group;
    }

    function drawAngles() {
      els.angles.innerHTML = "";
      const c = state.angleC;
      const topAcute = c;
      const topObtuse = 180 - c;
      const lower = geometry.lowerAngle;
      const lowAcute = lower;
      const lowObtuse = 180 - lower;
      const bAngle = state.isParallel ? 0 : state.bOffset;
      const bLeft = 180 + bAngle;
      const activeColor = colors[state.activeType] || colors.all;
      [
        [1, geometry.top, c, 180, topObtuse],
        [2, geometry.top, 0, c, topAcute],
        [3, geometry.top, 180, 180 + c, topAcute],
        [4, geometry.top, 180 + c, 360, topObtuse],
        [5, geometry.bottom, c, bLeft, lowObtuse],
        [6, geometry.bottom, bAngle, c, lowAcute],
        [7, geometry.bottom, bLeft, 180 + c, lowAcute],
        [8, geometry.bottom, 180 + c, 360 + bAngle, lowObtuse]
      ].forEach(args => els.angles.appendChild(makeAngle(...args, activeColor)));
    }

    function drawRelationGuide() {
      const type = state.activeType;
      const top = geometry.top;
      const bottom = geometry.bottom;
      const color = colors[type] || colors.all;
      els.guide.style.setProperty("--guide-color", color);
      els.guide.classList.toggle("active", ["cor", "alt", "con", "sup", "ver"].includes(type));
      els.guideLabel.textContent = "";
      els.diffLabel.textContent = "";
      let d = "";
      let label = "";
      let lx = (top.x + bottom.x) / 2;
      let ly = (top.y + bottom.y) / 2;
      if (type === "cor") {
        const arm = 120;
        const stem = Math.min(top.x, bottom.x) - 108;
        const topEnd = top.x + 54;
        const bottomEnd = bottom.x + 54;
        d = `M ${stem} ${top.y} L ${topEnd} ${top.y} M ${stem} ${top.y} L ${stem} ${bottom.y} M ${stem} ${bottom.y} L ${bottomEnd} ${bottom.y}`;
        label = "F";
        lx = stem - 24;
        ly = (top.y + bottom.y) / 2;
      } else if (type === "alt") {
        const s = 92;
        d = `M ${top.x - s} ${top.y} L ${top.x + s} ${top.y} L ${bottom.x - s} ${bottom.y} L ${bottom.x + s} ${bottom.y}`;
        label = "Z";
      } else if (type === "con") {
        const h = 74;
        const rightOuter = Math.max(top.x, bottom.x) + 128;
        const leftOuter = Math.min(top.x, bottom.x) - 128;
        d = [
          `M ${top.x - h} ${top.y} L ${leftOuter} ${top.y} L ${leftOuter} ${bottom.y} L ${bottom.x - h} ${bottom.y}`,
          `M ${top.x + h} ${top.y} L ${rightOuter} ${top.y} L ${rightOuter} ${bottom.y} L ${bottom.x + h} ${bottom.y}`
        ].join(" ");
        label = "U";
        lx = rightOuter + 26;
        ly = (top.y + bottom.y) / 2;
      } else if (type === "sup") {
        d = [
          arcPath(top.x, top.y, 98, 0, 180),
          arcPath(bottom.x, bottom.y, 98, 0, 180)
        ].join(" ");
        label = "180°";
        lx = top.x;
        ly = top.y - 116;
      } else if (type === "ver") {
        const s = 72;
        d = [
          `M ${top.x - s} ${top.y - s * 0.45} L ${top.x + s} ${top.y + s * 0.45} M ${top.x - s} ${top.y + s * 0.45} L ${top.x + s} ${top.y - s * 0.45}`,
          `M ${bottom.x - s} ${bottom.y - s * 0.45} L ${bottom.x + s} ${bottom.y + s * 0.45} M ${bottom.x - s} ${bottom.y + s * 0.45} L ${bottom.x + s} ${bottom.y - s * 0.45}`
        ].join(" ");
        label = "X";
        lx = top.x;
        ly = top.y - 94;
      }
      els.guide.setAttribute("d", d);
      els.guideLabel.setAttribute("x", lx);
      els.guideLabel.setAttribute("y", ly);
      els.guideLabel.textContent = label;
      if (!state.isParallel && ["cor", "alt", "con"].includes(type)) {
        const diff = Math.abs(state.bOffset);
        els.diffLabel.setAttribute("x", view.cx);
        els.diffLabel.setAttribute("y", view.cy - state.distance / 2 - 76);
        els.diffLabel.textContent = type === "con" ? `互补偏差 ${fmt(diff)}` : `角度差 ${fmt(diff)}`;
      }
    }

    function updatePanel() {
      els.hudC.textContent = fmt(state.angleC);
      els.hudParallel.textContent = state.isParallel ? "a ∥ b" : "非平行";
      els.hudType.textContent = labels[state.activeType] || "查看全部";
      if (!panel) return;
      els.toggleParallel.classList.toggle("active", state.isParallel);
      els.toggleParallel.textContent = state.isParallel ? "保持 a ∥ b" : "允许 b 偏转";
      els.parallelChip.textContent = state.isParallel ? "平行" : "偏转";
      els.sliderC.value = String(Math.round(state.angleC));
      els.cAngle.textContent = fmt(state.angleC);
      els.sliderB.disabled = state.isParallel;
      els.sliderB.value = String(state.bOffset);
      els.bOffset.textContent = fmt(state.bOffset);
      panel.querySelectorAll("[data-filter]").forEach(btn => btn.classList.toggle("active", btn.dataset.filter === state.activeType));

      const typeList = state.activeType === "all" ? ["cor", "alt", "con"] : [state.activeType];
      els.pairs.innerHTML = "";
      const rowLimit = state.activeType === "all" ? (panel.dataset.size === "micro" ? 4 : 6) : 8;
      const verdictText = (type, target) => {
        if (type === "ver" || type === "sup") return target;
        if (target === "相等") return state.isParallel ? "相等" : "不一定";
        if (target === "互补") return state.isParallel ? "互补" : `偏差 ${fmt(Math.abs(state.bOffset))}`;
        return target;
      };
      typeList.flatMap(type => (pairDefs[type] || []).map(row => ({ type, row }))).slice(0, rowLimit).forEach(({ type, row }) => {
        const item = document.createElement("div");
        item.className = "math-parallel-pair";
        item.style.setProperty("--pair-color", colors[state.activeType === "all" ? type : state.activeType]);
        item.innerHTML = `<span>${row[0]} 与 ${row[1]}</span><strong>${verdictText(type, row[2])}</strong>`;
        els.pairs.appendChild(item);
      });
      if (state.activeType === "cor") {
        els.explain.textContent = state.isParallel ? "F 形同位角相等。" : `偏差 ${fmt(Math.abs(state.bOffset))}。`;
      } else if (state.activeType === "alt") {
        els.explain.textContent = state.isParallel ? "Z 形内错角相等。" : `偏差 ${fmt(Math.abs(state.bOffset))}。`;
      } else if (state.activeType === "con") {
        els.explain.textContent = state.isParallel ? "U 形同旁内角互补。" : `互补偏差 ${fmt(Math.abs(state.bOffset))}。`;
      } else {
        els.explain.textContent = "拖截线调角度，拖中线调距离。";
      }
      fitPanel(panel);
    }

    function update() {
      geometry = computeGeometry();
      setAttrs(els.lineA, geometry.a);
      setAttrs(els.lineB, geometry.b);
      setAttrs(els.lineC, geometry.c);
      setAttrs(els.hitC, geometry.c);
      setAttrs(els.hitGap, { x1: view.cx - 400, y1: view.cy, x2: view.cx + 400, y2: view.cy });
      setAttrs(els.pointTop, { cx: geometry.top.x, cy: geometry.top.y });
      setAttrs(els.pointBottom, { cx: geometry.bottom.x, cy: geometry.bottom.y });
      setAttrs(els.labelA, { x: 48, y: geometry.top.y - 12 });
      setAttrs(els.labelB, { x: 48, y: geometry.bottom.y + 26 });
      setAttrs(els.labelC, { x: geometry.c.x2 - 72, y: geometry.c.y2 + 24 });
      els.svg.appendChild(els.traces);
      drawAngles();
      drawRelationGuide();
      updatePanel();
      if (state.proofActive) {
        const p = state.proofProgress;
        const x = geometry.top.x + (geometry.bottom.x - geometry.top.x) * p;
        const y = geometry.top.y + (geometry.bottom.y - geometry.top.y) * p;
        els.proof.style.opacity = String(1 - Math.abs(p - 0.5) * 0.9);
        els.proof.setAttribute("d", arcPath(x, y, 64, 0, state.angleC));
      } else {
        els.proof.style.opacity = "0";
      }
    }

    function resize() {
      const rect = els.svg.getBoundingClientRect();
      view.width = Math.max(320, els.svg.clientWidth || rect.width / state.viewScale);
      view.height = Math.max(240, els.svg.clientHeight || rect.height / state.viewScale);
      view.cx = view.width / 2;
      view.cy = view.height / 2 + 20;
      state.distance = clamp(state.distance, Math.min(130, view.height * 0.42), Math.max(160, view.height * 0.62));
      applyViewportZoom();
      update();
      if (panel) fitPanel(panel);
    }

    function startProof() {
      if (state.proofActive) return;
      state.activeType = "cor";
      state.proofActive = true;
      state.proofProgress = 0;
      const nowTime = () => (window.performance?.now ? window.performance.now() : Date.now());
      const raf = window.requestAnimationFrame || (fn => window.setTimeout(() => fn(nowTime()), 16));
      const start = nowTime();
      const tick = now => {
        const t = clamp((now - start) / 1800, 0, 1);
        state.proofProgress = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        update();
        if (t < 1) {
          state.raf = raf(tick);
        } else {
          state.proofActive = false;
          update();
        }
      };
      state.raf = raf(tick);
    }

    function onPointerDown(event) {
      zoomGesture.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (zoomGesture.pointers.size >= 2) {
        state.dragMode = null;
        state.dragPointerId = null;
        startPinchZoom();
        event.preventDefault();
        return;
      }
      if (event.target.closest("[data-hit-c]")) {
        state.dragMode = "angle";
      } else if (event.target.closest("[data-hit-gap]")) {
        state.dragMode = "gap";
      }
      if (state.dragMode) {
        state.dragPointerId = event.pointerId;
        try {
          els.svg.setPointerCapture?.(event.pointerId);
        } catch (error) {
          // Embedded WebViews may already own capture for quick gesture starts.
        }
        event.preventDefault();
      }
    }

    function onPointerMove(event) {
      if (zoomGesture.pointers.has(event.pointerId)) {
        zoomGesture.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      }
      if (zoomGesture.pointers.size >= 2) {
        updatePinchZoom();
        event.preventDefault();
        return;
      }
      if (!state.dragMode) return;
      if (event.pointerId !== state.dragPointerId) return;
      const steps = event.getCoalescedEvents?.().length ? event.getCoalescedEvents() : [event];
      steps.forEach(step => {
        const rect = els.svg.getBoundingClientRect();
        const x = (step.clientX - rect.left) / state.viewScale;
        const y = (step.clientY - rect.top) / state.viewScale;
        if (state.dragMode === "angle") {
          const dx = Math.abs(x - view.cx);
          const dy = Math.abs(view.cy - y);
          const angle = Math.atan2(dy, Math.max(60, dx)) * 180 / Math.PI;
          state.angleC = clamp(angle, 28, 78);
        } else {
          state.distance = clamp(Math.abs(y - view.cy) * 2, 120, Math.max(180, view.height * 0.7));
        }
      });
      update();
      event.preventDefault();
    }

    function onPointerUp(event) {
      zoomGesture.pointers.delete(event.pointerId);
      if (zoomGesture.pointers.size >= 2) {
        startPinchZoom();
      }
      if (!state.dragMode || event.pointerId !== state.dragPointerId) return;
      state.dragMode = null;
      state.dragPointerId = null;
      try {
        els.svg.releasePointerCapture?.(event.pointerId);
      } catch (error) {
        // Capture may already be released after browser-level cancel.
      }
      event.preventDefault();
    }

    function onLostPointerCapture(event) {
      zoomGesture.pointers.delete(event.pointerId);
      if (event.pointerId !== state.dragPointerId) return;
      state.dragMode = null;
      state.dragPointerId = null;
    }

    function onWheel(event) {
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.12 : 0.88;
      state.viewScale = clamp(state.viewScale * factor, 1, 3);
      applyViewportZoom();
    }

    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    resizeObserver?.observe(container);
    if (panelHost) resizeObserver?.observe(panelHost);
    if (!resizeObserver) window.addEventListener("resize", resize);
    els.svg.addEventListener("pointerdown", onPointerDown);
    els.svg.addEventListener("pointermove", onPointerMove);
    els.svg.addEventListener("pointerup", onPointerUp);
    els.svg.addEventListener("pointercancel", onPointerUp);
    els.svg.addEventListener("lostpointercapture", onLostPointerCapture);
    els.svg.addEventListener("wheel", onWheel, wheelOptions);

    panel?.addEventListener("click", event => {
      const toggle = event.target.closest("[data-toggle-parallel]");
      if (toggle) {
        state.isParallel = !state.isParallel;
        if (state.isParallel) state.bOffset = 0;
        update();
        return;
      }
      const filter = event.target.closest("[data-filter]");
      if (filter) {
        state.activeType = filter.dataset.filter;
        update();
        return;
      }
      if (event.target.closest("[data-proof-btn]")) {
        startProof();
        return;
      }
      const angleStep = event.target.closest("[data-angle-step]");
      if (angleStep) {
        state.angleC = clamp(state.angleC + Number(angleStep.dataset.angleStep), 28, 78);
        update();
        return;
      }
      const bStep = event.target.closest("[data-b-step]");
      if (bStep) {
        state.isParallel = false;
        state.bOffset = clamp(state.bOffset + Number(bStep.dataset.bStep), -28, 28);
        update();
        return;
      }
      if (event.target.closest("[data-b-zero]")) {
        state.bOffset = 0;
        state.isParallel = true;
        update();
      }
    });
    els.sliderC?.addEventListener("input", event => {
      state.angleC = Number(event.target.value);
      update();
    });
    els.sliderB?.addEventListener("input", event => {
      state.isParallel = false;
      state.bOffset = Number(event.target.value);
      update();
    });

    const raf = window.requestAnimationFrame || (fn => window.setTimeout(fn, 16));
    state.raf = raf(resize);

    container.__mathParallelCleanup = () => {
      resizeObserver?.disconnect();
      nativeTouchAbort?.abort();
      if (!resizeObserver) window.removeEventListener("resize", resize);
      const caf = window.cancelAnimationFrame || window.clearTimeout;
      caf(state.raf);
      els.svg.removeEventListener("pointerdown", onPointerDown);
      els.svg.removeEventListener("pointermove", onPointerMove);
      els.svg.removeEventListener("pointerup", onPointerUp);
      els.svg.removeEventListener("pointercancel", onPointerUp);
      els.svg.removeEventListener("lostpointercapture", onLostPointerCapture);
      els.svg.removeEventListener("wheel", onWheel, wheelOptions);
      container.innerHTML = "";
      if (panelHost) panelHost.innerHTML = "";
    };
  }

  window.MATH_VISUAL_SCENES[CARD_ID] = {
    mount,
    unmount(container) {
      if (container.__mathParallelCleanup) {
        container.__mathParallelCleanup();
        delete container.__mathParallelCleanup;
      } else {
        container.innerHTML = "";
      }
    }
  };
})();
