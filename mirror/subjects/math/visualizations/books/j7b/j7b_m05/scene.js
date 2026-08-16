window.MATH_VISUAL_SCENES = window.MATH_VISUAL_SCENES || {};

(function () {
  const CARD_ID = "j7b_m05";
  const STYLE_ID = "math-linear-system-style";
  const SVG_NS = "http://www.w3.org/2000/svg";
  const MIN_VIEW_SCALE = 0.4;
  const MAX_VIEW_SCALE = 5;
  const WHEEL_ZOOM_STEP = 1.1;

  const presets = {
    unique: {
      label: "唯一解",
      eq1: { A: 2, B: 1, C: 8 },
      eq2: { A: 1, B: -1, C: 1 },
      probe: { x: 0, y: 0 }
    },
    parallel: {
      label: "无解",
      eq1: { A: 1, B: -1, C: 2 },
      eq2: { A: 2, B: -2, C: 1 },
      probe: { x: -2, y: -2 }
    },
    coincident: {
      label: "无数解",
      eq1: { A: 1, B: -2, C: 3 },
      eq2: { A: 2, B: -4, C: 6 },
      probe: { x: 3, y: 0 }
    }
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function round1(value) {
    const rounded = Math.round(value * 10) / 10;
    return Object.is(rounded, -0) ? 0 : rounded;
  }

  function fmt(value) {
    const rounded = round1(value);
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  }

  function svgEl(tag, attrs = {}) {
    const node = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  }

  function setAttrs(node, attrs = {}) {
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  }

  function equationText(eq) {
    const a = fmt(eq.A);
    const b = fmt(Math.abs(eq.B));
    const sign = eq.B >= 0 ? "+" : "-";
    return `${a}x ${sign} ${b}y = ${fmt(eq.C)}`;
  }

  function intersection(eq1, eq2) {
    const det = eq1.A * eq2.B - eq2.A * eq1.B;
    const dx = eq1.C * eq2.B - eq2.C * eq1.B;
    const dy = eq1.A * eq2.C - eq2.A * eq1.C;
    if (Math.abs(det) < 1e-9) {
      if (Math.abs(dx) < 1e-9 && Math.abs(dy) < 1e-9) return { type: "coincident" };
      return { type: "parallel" };
    }
    return { type: "unique", x: dx / det, y: dy / det };
  }

  function lineResidual(eq, point) {
    const len = Math.hypot(eq.A, eq.B) || 1;
    const raw = eq.A * point.x + eq.B * point.y - eq.C;
    return { raw, distance: raw / len, abs: Math.abs(raw / len) };
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .math-linsys-scene,
      .math-linsys-scene *,
      .math-linsys-panel,
      .math-linsys-panel * {
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -webkit-user-drag: none;
        user-select: none;
      }
      .math-linsys-scene {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        color: #f8fafc;
        background:
          linear-gradient(rgba(148,163,184,0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(148,163,184,0.06) 1px, transparent 1px),
          radial-gradient(circle at 25% 22%, rgba(34,211,238,0.16), transparent 28%),
          radial-gradient(circle at 78% 70%, rgba(251,113,133,0.13), transparent 32%),
          linear-gradient(145deg, #020617 0%, #07111f 58%, #020617 100%);
        background-size: 34px 34px, 34px 34px, auto, auto, auto;
        font-family: Inter, "Noto Sans SC", "Microsoft YaHei UI", sans-serif;
        touch-action: none;
      }
      .math-linsys-svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: block;
        cursor: grab;
        user-select: none;
        touch-action: none;
      }
      .math-linsys-svg.is-panning {
        cursor: grabbing;
      }
      .math-linsys-grid {
        stroke: rgba(148,163,184,0.18);
        stroke-width: 1;
      }
      .math-linsys-axis {
        stroke: rgba(226,232,240,0.55);
        stroke-width: 2.4;
      }
      .math-linsys-label {
        fill: rgba(203,213,225,0.76);
        font-size: 12px;
        font-weight: 850;
        text-anchor: middle;
        dominant-baseline: middle;
        paint-order: stroke;
        stroke: rgba(2,6,23,0.9);
        stroke-width: 3;
        pointer-events: none;
      }
      .math-linsys-line {
        stroke-width: 5;
        stroke-linecap: round;
        filter: drop-shadow(0 0 12px rgba(255,255,255,0.14));
      }
      .math-linsys-line.one {
        stroke: #22d3ee;
      }
      .math-linsys-line.two {
        stroke: #fb7185;
      }
      .math-linsys-line.coincident {
        stroke: #facc15;
        stroke-dasharray: 12 9;
      }
      .math-linsys-strip {
        fill: rgba(250,204,21,0.09);
        stroke: rgba(250,204,21,0.24);
        stroke-width: 1;
        pointer-events: none;
      }
      .math-linsys-error {
        stroke-width: 4;
        stroke-linecap: round;
        stroke-dasharray: 6 6;
        opacity: 0.92;
        pointer-events: none;
      }
      .math-linsys-error.one {
        stroke: #67e8f9;
      }
      .math-linsys-error.two {
        stroke: #fda4af;
      }
      .math-linsys-intersection {
        fill: #ffffff;
        stroke: #22c55e;
        stroke-width: 4;
        filter: drop-shadow(0 0 18px rgba(34,197,94,0.72));
      }
      .math-linsys-solution-dot {
        fill: #facc15;
        stroke: rgba(254,249,195,0.9);
        stroke-width: 3;
        filter: drop-shadow(0 0 12px rgba(250,204,21,0.6));
      }
      .math-linsys-probe-hit {
        fill: transparent;
        cursor: grab;
        pointer-events: all;
      }
      .math-linsys-probe {
        fill: #ffffff;
        stroke: #a78bfa;
        stroke-width: 4;
        pointer-events: none;
        filter: drop-shadow(0 0 18px rgba(167,139,250,0.68));
      }
      .math-linsys-probe.ok {
        stroke: #22c55e;
        filter: drop-shadow(0 0 20px rgba(34,197,94,0.78));
      }
      .math-linsys-text {
        fill: #ffffff;
        font-size: 14px;
        font-weight: 950;
        text-anchor: middle;
        dominant-baseline: middle;
        paint-order: stroke;
        stroke: rgba(2,6,23,0.92);
        stroke-width: 5;
        stroke-linejoin: round;
        pointer-events: none;
      }
      .math-linsys-text.big {
        font-size: 18px;
      }
      .math-linsys-hud {
        position: absolute;
        left: 14px;
        top: 14px;
        z-index: 4;
        display: grid;
        grid-template-columns: repeat(3, minmax(78px, 1fr));
        gap: 8px;
        width: min(520px, calc(100% - 28px));
        pointer-events: none;
      }
      .math-linsys-stat {
        min-width: 0;
        border: 1px solid rgba(148,163,184,0.18);
        border-radius: 8px;
        background: rgba(2,6,23,0.64);
        backdrop-filter: blur(12px);
        padding: 8px 10px;
      }
      .math-linsys-stat-label {
        color: rgba(226,232,240,0.56);
        font-size: 10px;
        font-weight: 900;
      }
      .math-linsys-stat-value {
        margin-top: 2px;
        color: #ffffff;
        font-size: 16px;
        line-height: 1;
        font-weight: 950;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .math-linsys-panel {
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
        gap: 8px;
        padding: 10px;
        color: #f8fafc;
        font-family: Inter, "Noto Sans SC", "Microsoft YaHei UI", sans-serif;
        touch-action: pan-y;
      }
      .math-linsys-panel::-webkit-scrollbar {
        width: 0;
        height: 0;
      }
      .math-linsys-card {
        min-height: 0;
        border: 1px solid rgba(148,163,184,0.16);
        border-radius: 8px;
        background: rgba(15,23,42,0.64);
        padding: 8px;
        display: grid;
        gap: 7px;
      }
      .math-linsys-presets,
      .math-linsys-actions {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 6px;
      }
      .math-linsys-actions {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .math-linsys-button {
        min-width: 0;
        min-height: var(--bio-touch-target, 38px);
        border: 1px solid rgba(148,163,184,0.18);
        border-radius: 8px;
        background: rgba(2,6,23,0.36);
        color: rgba(226,232,240,0.8);
        font-size: 11px;
        font-weight: 950;
        line-height: 1.14;
        padding: 5px 6px;
        cursor: pointer;
      }
      .math-linsys-button.active {
        border-color: rgba(34,211,238,0.72);
        background: rgba(34,211,238,0.14);
        color: #e0f2fe;
      }
      .math-linsys-button:active {
        transform: scale(0.98);
      }
      .math-linsys-eq-head,
      .math-linsys-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        min-height: 26px;
        color: rgba(226,232,240,0.74);
        font-size: 11px;
        font-weight: 850;
      }
      .math-linsys-eq-head strong,
      .math-linsys-row strong {
        color: #ffffff;
        font-size: 12px;
        font-weight: 950;
        white-space: nowrap;
      }
      .math-linsys-coefs {
        display: grid;
        gap: 6px;
      }
      .math-linsys-coef {
        min-width: 0;
        display: grid;
        grid-template-columns: 34px minmax(0, 1fr) 34px;
        align-items: center;
        border: 1px solid rgba(148,163,184,0.14);
        border-radius: 8px;
        background: rgba(2,6,23,0.25);
        overflow: hidden;
      }
      .math-linsys-step {
        height: 32px;
        border: 0;
        background: rgba(255,255,255,0.04);
        color: #f8fafc;
        font-size: 15px;
        font-weight: 950;
        cursor: pointer;
      }
      .math-linsys-step:active {
        background: rgba(255,255,255,0.13);
      }
      .math-linsys-val {
        min-width: 0;
        text-align: center;
        color: #ffffff;
        font-size: 13px;
        font-weight: 950;
      }
      .math-linsys-meter {
        height: 8px;
        border-radius: 999px;
        background: rgba(148,163,184,0.14);
        overflow: hidden;
      }
      .math-linsys-meter > span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: var(--meter-color);
        width: 0%;
      }
      .math-linsys-verdict {
        color: rgba(203,213,225,0.82);
        font-size: 11px;
        line-height: 1.38;
        font-weight: 760;
      }
      .math-linsys-panel[data-size="micro"] {
        gap: 6px;
        padding: 8px;
      }
      .math-linsys-panel[data-size="micro"] .math-linsys-card {
        padding: 7px;
      }
      .math-linsys-panel[data-size="micro"] .math-linsys-button {
        min-height: 31px;
        font-size: 9px;
      }
      .math-linsys-panel[data-size="micro"] .math-linsys-step {
        height: 28px;
      }
      .math-linsys-panel[data-size="micro"] .math-linsys-verdict {
        display: none;
      }
      @media (max-width: 640px) {
        .math-linsys-hud {
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 6px;
        }
        .math-linsys-stat {
          padding: 6px 7px;
        }
        .math-linsys-stat-value {
          font-size: 13px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function fitPanel(panel) {
    const height = panel.getBoundingClientRect().height || 0;
    panel.dataset.size = height < 520 ? "micro" : height < 680 ? "compact" : "normal";
  }

  function blockNativeTouchMenus(target, options) {
    if (!target) return;
    target.setAttribute?.("draggable", "false");
    target.addEventListener("contextmenu", event => event.preventDefault(), options);
    target.addEventListener("selectstart", event => event.preventDefault(), options);
    target.addEventListener("dragstart", event => event.preventDefault(), options);
  }

  function mount(container, context = {}) {
    ensureStyle();
    const panelHost = context.externalPanel && context.externalPanel.nodeType === 1 ? context.externalPanel : null;
    const state = {
      preset: "unique",
      eq1: { ...presets.unique.eq1 },
      eq2: { ...presets.unique.eq2 },
      probe: { ...presets.unique.probe },
      dragging: false,
      dragPointerId: null,
      panning: false,
      panPointerId: null,
      panStartX: 0,
      panStartY: 0,
      viewPanX: 0,
      viewPanY: 0,
      raf: 0,
      viewScale: 1
    };
    const view = { width: 0, height: 0, cx: 0, cy: 0, baseUnit: 40, unit: 40, limit: 12 };
    const zoomGesture = { pointers: new Map(), startDistance: 0, startScale: 1 };

    container.innerHTML = "";
    const scene = document.createElement("div");
    scene.className = "math-linsys-scene";
    scene.innerHTML = `
      <div class="math-linsys-hud">
        <div class="math-linsys-stat"><div class="math-linsys-stat-label">交点状态</div><div class="math-linsys-stat-value" data-hud-kind></div></div>
        <div class="math-linsys-stat"><div class="math-linsys-stat-label">探测点 P</div><div class="math-linsys-stat-value" data-hud-probe></div></div>
        <div class="math-linsys-stat"><div class="math-linsys-stat-label">判定</div><div class="math-linsys-stat-value" data-hud-verdict></div></div>
      </div>
      <svg class="math-linsys-svg" data-svg>
        <g data-grid></g>
        <g data-strip></g>
        <g data-lines>
          <line class="math-linsys-line one" data-line-one></line>
          <line class="math-linsys-line two" data-line-two></line>
        </g>
        <g data-errors>
          <line class="math-linsys-error one" data-error-one></line>
          <line class="math-linsys-error two" data-error-two></line>
        </g>
        <g data-solutions></g>
        <g data-points>
          <circle class="math-linsys-intersection" r="9" data-intersection></circle>
          <text class="math-linsys-text big" data-intersection-label></text>
          <circle class="math-linsys-probe-hit" r="30" data-probe-hit></circle>
          <circle class="math-linsys-probe" r="11" data-probe></circle>
          <text class="math-linsys-text" data-probe-label></text>
        </g>
      </svg>
    `;
    container.appendChild(scene);

    let panel = null;
    if (panelHost) {
      panelHost.innerHTML = "";
      panel = document.createElement("div");
      panel.className = "math-linsys-panel";
      panel.innerHTML = `
        <div class="math-linsys-card math-linsys-presets">
          <button class="math-linsys-button active" type="button" data-preset="unique">唯一解</button>
          <button class="math-linsys-button" type="button" data-preset="parallel">无解</button>
          <button class="math-linsys-button" type="button" data-preset="coincident">无数解</button>
        </div>
        <div class="math-linsys-card" data-eq-card="1">
          <div class="math-linsys-eq-head"><span>方程 1</span><strong data-formula-one></strong></div>
          <div class="math-linsys-coefs" data-eq="1"></div>
        </div>
        <div class="math-linsys-card" data-eq-card="2">
          <div class="math-linsys-eq-head"><span>方程 2</span><strong data-formula-two></strong></div>
          <div class="math-linsys-coefs" data-eq="2"></div>
        </div>
        <div class="math-linsys-card math-linsys-actions">
          <button class="math-linsys-button" type="button" data-snap>吸附到解</button>
          <button class="math-linsys-button" type="button" data-reset>重置探测点</button>
        </div>
        <div class="math-linsys-card">
          <div class="math-linsys-row"><span>方程1误差</span><strong data-error-one-text></strong></div>
          <div class="math-linsys-meter"><span data-error-one-meter style="--meter-color:#22d3ee"></span></div>
          <div class="math-linsys-row"><span>方程2误差</span><strong data-error-two-text></strong></div>
          <div class="math-linsys-meter"><span data-error-two-meter style="--meter-color:#fb7185"></span></div>
          <div class="math-linsys-verdict" data-verdict></div>
        </div>
      `;
      panelHost.appendChild(panel);
      fitPanel(panel);
    }

    const els = {
      svg: scene.querySelector("[data-svg]"),
      grid: scene.querySelector("[data-grid]"),
      strip: scene.querySelector("[data-strip]"),
      lineOne: scene.querySelector("[data-line-one]"),
      lineTwo: scene.querySelector("[data-line-two]"),
      errorOne: scene.querySelector("[data-error-one]"),
      errorTwo: scene.querySelector("[data-error-two]"),
      solutions: scene.querySelector("[data-solutions]"),
      intersection: scene.querySelector("[data-intersection]"),
      intersectionLabel: scene.querySelector("[data-intersection-label]"),
      probeHit: scene.querySelector("[data-probe-hit]"),
      probe: scene.querySelector("[data-probe]"),
      probeLabel: scene.querySelector("[data-probe-label]"),
      hudKind: scene.querySelector("[data-hud-kind]"),
      hudProbe: scene.querySelector("[data-hud-probe]"),
      hudVerdict: scene.querySelector("[data-hud-verdict]"),
      panel,
      formulaOne: panel?.querySelector("[data-formula-one]"),
      formulaTwo: panel?.querySelector("[data-formula-two]"),
      coefsOne: panel?.querySelector('[data-eq="1"]'),
      coefsTwo: panel?.querySelector('[data-eq="2"]'),
      errorOneText: panel?.querySelector("[data-error-one-text]"),
      errorTwoText: panel?.querySelector("[data-error-two-text]"),
      errorOneMeter: panel?.querySelector("[data-error-one-meter]"),
      errorTwoMeter: panel?.querySelector("[data-error-two-meter]"),
      verdict: panel?.querySelector("[data-verdict]")
    };

    const nativeTouchAbort = typeof AbortController !== "undefined" ? new AbortController() : null;
    const nativeTouchOptions = nativeTouchAbort ? { signal: nativeTouchAbort.signal } : undefined;
    const wheelOptions = nativeTouchAbort ? { passive: false, signal: nativeTouchAbort.signal } : { passive: false };
    [scene, els.svg, panel, panelHost].forEach(target => blockNativeTouchMenus(target, nativeTouchOptions));

    function setZoom(scale) {
      state.viewScale = clamp(scale, MIN_VIEW_SCALE, MAX_VIEW_SCALE);
      view.unit = view.baseUnit * state.viewScale;
      view.limit = Math.ceil(Math.max(view.width, view.height) / view.unit / 2) + 2;
      drawGrid();
      update();
    }

    function updateViewCenter() {
      view.cx = view.width / 2 + state.viewPanX;
      view.cy = view.height / 2 + (view.height < 420 ? 22 : 14) + state.viewPanY;
    }

    function stopPanning() {
      state.panning = false;
      state.panPointerId = null;
      els.svg.classList.remove("is-panning");
    }

    function moveViewFromEvent(event) {
      state.viewPanX = event.clientX - state.panStartX;
      state.viewPanY = event.clientY - state.panStartY;
      updateViewCenter();
      drawGrid();
      update();
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
      zoomGesture.startDistance = Math.max(1, distanceBetween(points[0], points[1]));
      zoomGesture.startScale = state.viewScale;
    }

    function updatePinchZoom() {
      const points = pointerList();
      if (points.length < 2 || !zoomGesture.startDistance) return;
      const distance = Math.max(1, distanceBetween(points[0], points[1]));
      setZoom(zoomGesture.startScale * (distance / zoomGesture.startDistance));
    }

    function mathToScreen(x, y) {
      return { x: view.cx + x * view.unit, y: view.cy - y * view.unit };
    }

    function screenToMath(clientX, clientY) {
      const rect = els.svg.getBoundingClientRect();
      return {
        x: (clientX - rect.left - view.cx) / view.unit,
        y: (view.cy - (clientY - rect.top)) / view.unit
      };
    }

    function linePoints(eq) {
      const min = -view.limit;
      const max = view.limit;
      if (Math.abs(eq.B) > 1e-9) {
        return [
          mathToScreen(min, (eq.C - eq.A * min) / eq.B),
          mathToScreen(max, (eq.C - eq.A * max) / eq.B)
        ];
      }
      const x = eq.C / (eq.A || 1);
      return [mathToScreen(x, min), mathToScreen(x, max)];
    }

    function footPoint(eq, point) {
      const len2 = eq.A * eq.A + eq.B * eq.B || 1;
      const raw = eq.A * point.x + eq.B * point.y - eq.C;
      return {
        x: point.x - (raw * eq.A) / len2,
        y: point.y - (raw * eq.B) / len2
      };
    }

    function drawGrid() {
      els.grid.innerHTML = "";
      for (let i = -view.limit; i <= view.limit; i += 1) {
        const vx = mathToScreen(i, 0).x;
        const hy = mathToScreen(0, i).y;
        els.grid.appendChild(svgEl("line", {
          class: i === 0 ? "math-linsys-axis" : "math-linsys-grid",
          x1: vx,
          y1: 0,
          x2: vx,
          y2: view.height
        }));
        els.grid.appendChild(svgEl("line", {
          class: i === 0 ? "math-linsys-axis" : "math-linsys-grid",
          x1: 0,
          y1: hy,
          x2: view.width,
          y2: hy
        }));
        if (i !== 0 && i % 2 === 0) {
          const tx = svgEl("text", { class: "math-linsys-label", x: vx, y: view.cy + 18 });
          tx.textContent = String(i);
          els.grid.appendChild(tx);
          const ty = svgEl("text", { class: "math-linsys-label", x: view.cx - 22, y: hy });
          ty.textContent = String(i);
          els.grid.appendChild(ty);
        }
      }
      const xLabel = svgEl("text", { class: "math-linsys-label", x: view.width - 18, y: view.cy - 16 });
      xLabel.textContent = "x";
      els.grid.appendChild(xLabel);
      const yLabel = svgEl("text", { class: "math-linsys-label", x: view.cx + 18, y: 18 });
      yLabel.textContent = "y";
      els.grid.appendChild(yLabel);
    }

    function drawCoefControls() {
      if (!panel) return;
      const build = (host, eqNum, eq) => {
        host.innerHTML = "";
        [
          ["A", "x系数"],
          ["B", "y系数"],
          ["C", "常数项"]
        ].forEach(([key, label]) => {
          const item = document.createElement("div");
          item.className = "math-linsys-coef";
          item.innerHTML = `
            <button class="math-linsys-step" type="button" data-step="-1" data-eq="${eqNum}" data-key="${key}">-</button>
            <div class="math-linsys-val" data-val="${eqNum}-${key}">${label}: ${fmt(eq[key])}</div>
            <button class="math-linsys-step" type="button" data-step="1" data-eq="${eqNum}" data-key="${key}">+</button>
          `;
          host.appendChild(item);
        });
      };
      build(els.coefsOne, 1, state.eq1);
      build(els.coefsTwo, 2, state.eq2);
    }

    function drawParallelStrip(result) {
      els.strip.innerHTML = "";
      if (result.type !== "parallel") return;
      const p1 = linePoints(state.eq1);
      const p2 = linePoints(state.eq2);
      const poly = svgEl("polygon", {
        class: "math-linsys-strip",
        points: `${p1[0].x},${p1[0].y} ${p1[1].x},${p1[1].y} ${p2[1].x},${p2[1].y} ${p2[0].x},${p2[0].y}`
      });
      els.strip.appendChild(poly);
    }

    function drawCoincidentDots(result) {
      els.solutions.innerHTML = "";
      if (result.type !== "coincident") return;
      for (let x = -6; x <= 6; x += 3) {
        let y;
        if (Math.abs(state.eq1.B) > 1e-9) y = (state.eq1.C - state.eq1.A * x) / state.eq1.B;
        else y = -6 + x + 6;
        const p = mathToScreen(x, y);
        if (p.x < -30 || p.x > view.width + 30 || p.y < -30 || p.y > view.height + 30) continue;
        els.solutions.appendChild(svgEl("circle", { class: "math-linsys-solution-dot", cx: p.x, cy: p.y, r: 6 }));
      }
    }

    function updatePanel(result, r1, r2) {
      const ok1 = r1.abs < 0.08;
      const ok2 = r2.abs < 0.08;
      const hit = ok1 && ok2;
      els.hudKind.textContent = result.type === "unique" ? `(${fmt(result.x)}, ${fmt(result.y)})` : presets[result.type]?.label || "自定义";
      els.hudProbe.textContent = `(${fmt(state.probe.x)}, ${fmt(state.probe.y)})`;
      els.hudVerdict.textContent = hit ? "同时成立" : "继续移动";
      els.probe.classList.toggle("ok", hit);
      if (!panel) return;
      panel.querySelectorAll("[data-preset]").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.preset === state.preset);
      });
      els.formulaOne.textContent = equationText(state.eq1);
      els.formulaTwo.textContent = equationText(state.eq2);
      panel.querySelectorAll("[data-val]").forEach(node => {
        const match = node.dataset.val.match(/(\d)-([ABC])/);
        if (!match) return;
        const eq = match[1] === "1" ? state.eq1 : state.eq2;
        const label = match[2] === "A" ? "x系数" : match[2] === "B" ? "y系数" : "常数项";
        node.textContent = `${label}: ${fmt(eq[match[2]])}`;
      });
      els.errorOneText.textContent = fmt(r1.abs);
      els.errorTwoText.textContent = fmt(r2.abs);
      els.errorOneMeter.style.width = `${clamp(r1.abs / 4, 0, 1) * 100}%`;
      els.errorTwoMeter.style.width = `${clamp(r2.abs / 4, 0, 1) * 100}%`;
      if (result.type === "unique") {
        els.verdict.textContent = hit
          ? `P 就是方程组的解：x=${fmt(result.x)}, y=${fmt(result.y)}。`
          : `两条直线交于 (${fmt(result.x)}, ${fmt(result.y)})，把 P 拖到交点可同时满足。`;
      } else if (result.type === "parallel") {
        els.verdict.textContent = "两条直线平行，公共点不存在，方程组无解。";
      } else {
        els.verdict.textContent = "两条直线重合，线上任意点都同时满足，方程组有无数解。";
      }
      fitPanel(panel);
    }

    function snapProbe() {
      const result = intersection(state.eq1, state.eq2);
      if (result.type === "unique") {
        state.probe.x = round1(result.x);
        state.probe.y = round1(result.y);
      } else if (result.type === "coincident") {
        const foot = footPoint(state.eq1, state.probe);
        state.probe.x = round1(clamp(foot.x, -view.limit, view.limit));
        state.probe.y = round1(clamp(foot.y, -view.limit, view.limit));
      }
      update();
    }

    function update() {
      const p1 = linePoints(state.eq1);
      const p2 = linePoints(state.eq2);
      setAttrs(els.lineOne, { x1: p1[0].x, y1: p1[0].y, x2: p1[1].x, y2: p1[1].y });
      setAttrs(els.lineTwo, { x1: p2[0].x, y1: p2[0].y, x2: p2[1].x, y2: p2[1].y });

      const result = intersection(state.eq1, state.eq2);
      els.lineTwo.classList.toggle("coincident", result.type === "coincident");
      drawParallelStrip(result);
      drawCoincidentDots(result);

      if (result.type === "unique") {
        const ip = mathToScreen(result.x, result.y);
        setAttrs(els.intersection, { cx: ip.x, cy: ip.y });
        els.intersection.style.display = "";
        els.intersectionLabel.style.display = "";
        setAttrs(els.intersectionLabel, { x: ip.x, y: ip.y - 30 });
        els.intersectionLabel.textContent = `解 (${fmt(result.x)}, ${fmt(result.y)})`;
      } else {
        els.intersection.style.display = "none";
        els.intersectionLabel.style.display = "";
        setAttrs(els.intersectionLabel, { x: view.width / 2, y: 76 });
        els.intersectionLabel.textContent = result.type === "parallel" ? "平行：无解" : "重合：无数解";
      }

      const pp = mathToScreen(state.probe.x, state.probe.y);
      const f1 = mathToScreen(footPoint(state.eq1, state.probe).x, footPoint(state.eq1, state.probe).y);
      const f2 = mathToScreen(footPoint(state.eq2, state.probe).x, footPoint(state.eq2, state.probe).y);
      setAttrs(els.errorOne, { x1: pp.x, y1: pp.y, x2: f1.x, y2: f1.y });
      setAttrs(els.errorTwo, { x1: pp.x, y1: pp.y, x2: f2.x, y2: f2.y });
      setAttrs(els.probeHit, { cx: pp.x, cy: pp.y });
      setAttrs(els.probe, { cx: pp.x, cy: pp.y });
      setAttrs(els.probeLabel, { x: pp.x, y: pp.y - 30 });
      els.probeLabel.textContent = `P(${fmt(state.probe.x)}, ${fmt(state.probe.y)})`;

      updatePanel(result, lineResidual(state.eq1, state.probe), lineResidual(state.eq2, state.probe));
    }

    function resize() {
      const rect = els.svg.getBoundingClientRect();
      view.width = Math.max(320, rect.width);
      view.height = Math.max(240, rect.height);
      updateViewCenter();
      view.baseUnit = clamp(Math.min(view.width, view.height) / 16, 24, 50);
      view.unit = view.baseUnit * state.viewScale;
      view.limit = Math.ceil(Math.max(view.width, view.height) / view.unit / 2) + 2;
      drawGrid();
      update();
      if (panel) fitPanel(panel);
    }

    function setPreset(key) {
      const preset = presets[key];
      if (!preset) return;
      state.preset = key;
      state.eq1 = { ...preset.eq1 };
      state.eq2 = { ...preset.eq2 };
      state.probe = { ...preset.probe };
      drawCoefControls();
      update();
    }

    function moveProbeFromEvent(event) {
      const next = screenToMath(event.clientX, event.clientY);
      const result = intersection(state.eq1, state.eq2);
      if (result.type === "unique" && Math.hypot(next.x - result.x, next.y - result.y) < 0.42) {
        state.probe.x = round1(result.x);
        state.probe.y = round1(result.y);
      } else {
        state.probe.x = round1(clamp(next.x, -view.limit, view.limit));
        state.probe.y = round1(clamp(next.y, -view.limit, view.limit));
      }
      update();
    }

    function onPointerDown(event) {
      zoomGesture.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      els.svg.setPointerCapture?.(event.pointerId);
      if (zoomGesture.pointers.size >= 2) {
        state.dragging = false;
        state.dragPointerId = null;
        stopPanning();
        startPinchZoom();
        event.preventDefault();
        return;
      }
      if (event.target.closest("[data-probe-hit]")) {
        state.dragging = true;
        state.dragPointerId = event.pointerId;
        moveProbeFromEvent(event);
      } else {
        state.panning = true;
        state.panPointerId = event.pointerId;
        state.panStartX = event.clientX - state.viewPanX;
        state.panStartY = event.clientY - state.viewPanY;
        els.svg.classList.add("is-panning");
      }
      event.preventDefault();
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
      if (state.dragging && event.pointerId === state.dragPointerId) {
        const steps = event.getCoalescedEvents?.().length ? event.getCoalescedEvents() : [event];
        steps.forEach(step => moveProbeFromEvent(step));
        event.preventDefault();
        return;
      }
      if (!state.panning || event.pointerId !== state.panPointerId) return;
      moveViewFromEvent(event);
      event.preventDefault();
    }

    function onPointerUp(event) {
      zoomGesture.pointers.delete(event.pointerId);
      if (zoomGesture.pointers.size >= 2) startPinchZoom();
      if (state.dragging && event.pointerId === state.dragPointerId) {
        state.dragging = false;
        state.dragPointerId = null;
      }
      if (state.panning && event.pointerId === state.panPointerId) stopPanning();
      if (els.svg.hasPointerCapture?.(event.pointerId)) {
        els.svg.releasePointerCapture(event.pointerId);
      }
    }

    panel?.addEventListener("click", event => {
      const presetBtn = event.target.closest("[data-preset]");
      if (presetBtn) {
        setPreset(presetBtn.dataset.preset);
        return;
      }
      if (event.target.closest("[data-snap]")) {
        snapProbe();
        return;
      }
      if (event.target.closest("[data-reset]")) {
        const preset = presets[state.preset] || presets.unique;
        state.probe = { ...preset.probe };
        update();
        return;
      }
      const stepBtn = event.target.closest("[data-step]");
      if (!stepBtn) return;
      const eq = stepBtn.dataset.eq === "1" ? state.eq1 : state.eq2;
      const key = stepBtn.dataset.key;
      const delta = Number(stepBtn.dataset.step);
      eq[key] = clamp(eq[key] + delta, -9, 9);
      if ((key === "A" || key === "B") && eq.A === 0 && eq.B === 0) eq[key] = delta > 0 ? 1 : -1;
      state.preset = "custom";
      update();
    });

    els.svg.addEventListener("pointerdown", onPointerDown);
    els.svg.addEventListener("pointermove", onPointerMove);
    els.svg.addEventListener("pointerup", onPointerUp);
    els.svg.addEventListener("pointercancel", onPointerUp);
    els.svg.addEventListener("wheel", event => {
      event.preventDefault();
      setZoom(state.viewScale * (event.deltaY < 0 ? WHEEL_ZOOM_STEP : 1 / WHEEL_ZOOM_STEP));
    }, wheelOptions);

    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    resizeObserver?.observe(container);
    if (panelHost) resizeObserver?.observe(panelHost);
    if (!resizeObserver) window.addEventListener("resize", resize);
    drawCoefControls();
    state.raf = requestAnimationFrame(resize);

    container.__mathLinSysCleanup = () => {
      nativeTouchAbort?.abort();
      resizeObserver?.disconnect();
      if (!resizeObserver) window.removeEventListener("resize", resize);
      cancelAnimationFrame(state.raf);
      els.svg.removeEventListener("pointerdown", onPointerDown);
      els.svg.removeEventListener("pointermove", onPointerMove);
      els.svg.removeEventListener("pointerup", onPointerUp);
      els.svg.removeEventListener("pointercancel", onPointerUp);
      container.innerHTML = "";
      if (panelHost) panelHost.innerHTML = "";
    };
  }

  window.MATH_VISUAL_SCENES[CARD_ID] = {
    mount,
    unmount(container) {
      if (container.__mathLinSysCleanup) {
        container.__mathLinSysCleanup();
        delete container.__mathLinSysCleanup;
      } else {
        container.innerHTML = "";
      }
    }
  };
})();
