window.MATH_VISUAL_SCENES = window.MATH_VISUAL_SCENES || {};

(function () {
  const CARD_ID = "j7b_m03";
  const STYLE_ID = "math-ineq-numberline-style";
  const SVG_NS = "http://www.w3.org/2000/svg";

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function svgEl(tag, attrs = {}) {
    const node = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .math-ineq-scene,
      .math-ineq-scene *,
      .math-ineq-panel,
      .math-ineq-panel * {
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -webkit-user-drag: none;
        user-select: none;
      }
      .math-ineq-scene {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        color: #f8fafc;
        background:
          radial-gradient(circle at 24% 18%, rgba(56,189,248,0.14), transparent 32%),
          radial-gradient(circle at 80% 72%, rgba(167,139,250,0.12), transparent 34%),
          linear-gradient(145deg, #020617 0%, #07111f 56%, #020617 100%);
        font-family: Inter, "Noto Sans SC", "Microsoft YaHei UI", sans-serif;
        touch-action: none;
      }
      .math-ineq-svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: block;
        user-select: none;
        touch-action: none;
      }
      .math-ineq-axis {
        stroke: rgba(226,232,240,0.54);
        stroke-width: 3;
        stroke-linecap: round;
      }
      .math-ineq-tick {
        stroke: rgba(148,163,184,0.36);
        stroke-width: 1.5;
      }
      .math-ineq-num {
        fill: rgba(203,213,225,0.75);
        font-size: 12px;
        font-weight: 850;
        text-anchor: middle;
        dominant-baseline: middle;
        paint-order: stroke;
        stroke: rgba(2,6,23,0.85);
        stroke-width: 3;
      }
      .math-ineq-ray {
        stroke: var(--ray-color);
        stroke-width: 8;
        stroke-linecap: round;
        marker-end: url(#mathIneqArrow);
        filter: drop-shadow(0 0 12px var(--ray-color));
      }
      .math-ineq-ray.ghost {
        opacity: 0.42;
        stroke-width: 5;
      }
      .math-ineq-solution {
        stroke: #22c55e;
        stroke-width: 12;
        stroke-linecap: round;
        filter: drop-shadow(0 0 18px rgba(34,197,94,0.58));
      }
      .math-ineq-solution-point {
        fill: #22c55e;
        stroke: rgba(240,253,244,0.96);
        stroke-width: 5;
        filter: drop-shadow(0 0 18px rgba(34,197,94,0.62));
      }
      .math-ineq-empty {
        fill: none;
        stroke: #fb7185;
        stroke-width: 5;
        stroke-linecap: round;
        filter: drop-shadow(0 0 14px rgba(251,113,133,0.55));
      }
      .math-ineq-point {
        fill: #020617;
        stroke: var(--point-color);
        stroke-width: 4;
        filter: drop-shadow(0 0 12px var(--point-color));
      }
      .math-ineq-point.solid {
        fill: var(--point-color);
      }
      .math-ineq-test {
        fill: #ffffff;
        stroke: #22c55e;
        stroke-width: 4;
        cursor: grab;
        filter: drop-shadow(0 0 14px rgba(34,197,94,0.65));
      }
      .math-ineq-test.bad {
        stroke: #fb7185;
        filter: drop-shadow(0 0 14px rgba(251,113,133,0.65));
      }
      .math-ineq-label {
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
      .math-ineq-label.small {
        font-size: 12px;
      }
      .math-ineq-hud {
        position: absolute;
        left: 14px;
        top: 14px;
        z-index: 4;
        display: grid;
        grid-template-columns: repeat(3, minmax(78px, 1fr));
        gap: 8px;
        width: min(500px, calc(100% - 28px));
        pointer-events: none;
      }
      .math-ineq-stat {
        min-width: 0;
        border: 1px solid rgba(148,163,184,0.18);
        border-radius: 8px;
        background: rgba(2,6,23,0.62);
        backdrop-filter: blur(12px);
        padding: 8px 10px;
      }
      .math-ineq-stat-label {
        color: rgba(226,232,240,0.56);
        font-size: 10px;
        font-weight: 900;
      }
      .math-ineq-stat-value {
        margin-top: 2px;
        color: #ffffff;
        font-size: 16px;
        line-height: 1;
        font-weight: 950;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .math-ineq-panel {
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
      .math-ineq-panel::-webkit-scrollbar {
        width: 0;
        height: 0;
      }
      .math-ineq-card {
        min-height: 0;
        border: 1px solid rgba(148,163,184,0.16);
        border-radius: 8px;
        background: rgba(15,23,42,0.64);
        padding: 8px;
        display: grid;
        gap: 7px;
      }
      .math-ineq-ops,
      .math-ineq-actions,
      .math-ineq-state {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 6px;
      }
      .math-ineq-actions {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .math-ineq-button {
        min-width: 0;
        min-height: var(--bio-touch-target, 38px);
        border: 1px solid rgba(148,163,184,0.18);
        border-radius: 8px;
        background: rgba(2,6,23,0.36);
        color: rgba(226,232,240,0.78);
        font-size: 11px;
        font-weight: 950;
        line-height: 1.14;
        padding: 5px 6px;
        cursor: pointer;
      }
      .math-ineq-button.active {
        border-color: rgba(56,189,248,0.72);
        background: rgba(56,189,248,0.14);
        color: #e0f2fe;
      }
      .math-ineq-button:active {
        transform: scale(0.98);
      }
      .math-ineq-field {
        display: grid;
        gap: 6px;
      }
      .math-ineq-field label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: rgba(226,232,240,0.72);
        font-size: 11px;
        font-weight: 900;
      }
      .math-ineq-chip {
        color: #facc15;
        font-size: 16px;
        line-height: 1;
        font-weight: 950;
      }
      .math-ineq-stepper {
        display: grid;
        grid-template-columns: 42px minmax(0, 1fr) 42px;
        gap: 7px;
        align-items: center;
      }
      .math-ineq-range {
        width: 100%;
        height: 30px;
        margin: 0;
        accent-color: #38bdf8;
        touch-action: none;
      }
      .math-ineq-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        min-height: 27px;
        color: rgba(226,232,240,0.78);
        font-size: 11px;
        font-weight: 850;
      }
      .math-ineq-row strong {
        color: #ffffff;
        white-space: nowrap;
      }
      .math-ineq-note {
        color: rgba(203,213,225,0.78);
        font-size: 11px;
        line-height: 1.4;
        font-weight: 750;
      }
      .math-ineq-panel[data-size="micro"] {
        gap: 6px;
        padding: 8px;
      }
      .math-ineq-panel[data-size="micro"] .math-ineq-card {
        padding: 7px;
      }
      .math-ineq-panel[data-size="micro"] .math-ineq-button {
        min-height: 31px;
        font-size: 9px;
      }
      .math-ineq-panel[data-size="micro"] .math-ineq-note {
        display: none;
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
    const panelHost = context.externalPanel || null;
    const state = {
      op1: ">",
      a: 2,
      useSecond: true,
      op2: "<=",
      b: 6,
      paramMode: false,
      test: 3,
      draggingTest: false,
      dragPointerId: null,
      raf: 0,
      viewScale: 1
    };
    const view = { width: 0, height: 0, left: 0, right: 0, y: 0, min: -10, max: 10 };
    const colors = { one: "#38bdf8", two: "#a78bfa", sol: "#22c55e" };
    const zoomGesture = { pointers: new Map(), startDistance: 0, startScale: 1 };

    container.innerHTML = "";
    const scene = document.createElement("div");
    scene.className = "math-ineq-scene";
    scene.innerHTML = `
      <div class="math-ineq-hud">
        <div class="math-ineq-stat"><div class="math-ineq-stat-label">不等式</div><div class="math-ineq-stat-value" data-hud-ineq></div></div>
        <div class="math-ineq-stat"><div class="math-ineq-stat-label">解集</div><div class="math-ineq-stat-value" data-hud-solution></div></div>
        <div class="math-ineq-stat"><div class="math-ineq-stat-label">试数 t</div><div class="math-ineq-stat-value" data-hud-test></div></div>
      </div>
      <svg class="math-ineq-svg" data-svg>
        <defs>
          <marker id="mathIneqArrowOne" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 0 1 L 10 5 L 0 9 Z" fill="#38bdf8"/></marker>
          <marker id="mathIneqArrowTwo" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 0 1 L 10 5 L 0 9 Z" fill="#f59e0b"/></marker>
        </defs>
        <g data-axis></g>
        <g data-rays></g>
        <g data-points></g>
        <g data-test-layer></g>
      </svg>
    `;
    container.appendChild(scene);

    let panel = null;
    if (panelHost) {
      panelHost.innerHTML = "";
      panel = document.createElement("div");
      panel.className = "math-ineq-panel";
      panel.innerHTML = `
        <div class="math-ineq-card">
          <div class="math-ineq-row"><span>不等式 1</span><strong data-ineq1-row></strong></div>
          <div class="math-ineq-ops">
            <button class="math-ineq-button active" type="button" data-op="1:>">x&gt;</button>
            <button class="math-ineq-button" type="button" data-op="1:>=">x≥</button>
            <button class="math-ineq-button" type="button" data-op="1:<">x&lt;</button>
            <button class="math-ineq-button" type="button" data-op="1:<=">x≤</button>
          </div>
          <div class="math-ineq-field">
            <label>端点 a <span class="math-ineq-chip" data-a-chip></span></label>
            <div class="math-ineq-stepper">
              <button class="math-ineq-button" type="button" data-step="a:-1">-1</button>
              <input class="math-ineq-range" data-a-slider type="range" min="-9" max="9" step="1" value="2">
              <button class="math-ineq-button" type="button" data-step="a:1">+1</button>
            </div>
          </div>
        </div>
        <div class="math-ineq-card">
          <div class="math-ineq-actions">
            <button class="math-ineq-button active" type="button" data-toggle-second>不等式组</button>
            <button class="math-ineq-button" type="button" data-toggle-param>参数 m</button>
            <button class="math-ineq-button" type="button" data-reset>重置</button>
          </div>
          <div class="math-ineq-row"><span>不等式 2</span><strong data-ineq2-row></strong></div>
          <div class="math-ineq-ops">
            <button class="math-ineq-button" type="button" data-op="2:>">x&gt;</button>
            <button class="math-ineq-button" type="button" data-op="2:>=">x≥</button>
            <button class="math-ineq-button" type="button" data-op="2:<">x&lt;</button>
            <button class="math-ineq-button active" type="button" data-op="2:<=">x≤</button>
          </div>
          <div class="math-ineq-field">
            <label><span data-b-label>端点 b</span><span class="math-ineq-chip" data-b-chip></span></label>
            <div class="math-ineq-stepper">
              <button class="math-ineq-button" type="button" data-step="b:-1">-1</button>
              <input class="math-ineq-range" data-b-slider type="range" min="-9" max="9" step="1" value="6">
              <button class="math-ineq-button" type="button" data-step="b:1">+1</button>
            </div>
          </div>
        </div>
        <div class="math-ineq-card">
          <div class="math-ineq-field">
            <label>试数 t <span class="math-ineq-chip" data-test-chip></span></label>
            <div class="math-ineq-stepper">
              <button class="math-ineq-button" type="button" data-step="test:-1">-1</button>
              <input class="math-ineq-range" data-test-slider type="range" min="-10" max="10" step="1" value="3">
              <button class="math-ineq-button" type="button" data-step="test:1">+1</button>
            </div>
          </div>
        </div>
        <div class="math-ineq-card">
          <div class="math-ineq-row"><span>当前解集</span><strong data-solution-row></strong></div>
          <div class="math-ineq-row"><span>试数判断</span><strong data-test-row></strong></div>
          <div class="math-ineq-note" data-note></div>
        </div>
      `;
      panelHost.appendChild(panel);
      fitPanel(panel);
    }

    const els = {
      svg: scene.querySelector("[data-svg]"),
      axis: scene.querySelector("[data-axis]"),
      rays: scene.querySelector("[data-rays]"),
      points: scene.querySelector("[data-points]"),
      testLayer: scene.querySelector("[data-test-layer]"),
      hudIneq: scene.querySelector("[data-hud-ineq]"),
      hudSolution: scene.querySelector("[data-hud-solution]"),
      hudTest: scene.querySelector("[data-hud-test]"),
      panel,
      aChip: panel?.querySelector("[data-a-chip]"),
      bChip: panel?.querySelector("[data-b-chip]"),
      bLabel: panel?.querySelector("[data-b-label]"),
      testChip: panel?.querySelector("[data-test-chip]"),
      aSlider: panel?.querySelector("[data-a-slider]"),
      bSlider: panel?.querySelector("[data-b-slider]"),
      testSlider: panel?.querySelector("[data-test-slider]"),
      ineq1Row: panel?.querySelector("[data-ineq1-row]"),
      ineq2Row: panel?.querySelector("[data-ineq2-row]"),
      solutionRow: panel?.querySelector("[data-solution-row]"),
      testRow: panel?.querySelector("[data-test-row]"),
      note: panel?.querySelector("[data-note]")
    };

    const nativeTouchAbort = typeof AbortController !== "undefined" ? new AbortController() : null;
    const nativeTouchOptions = nativeTouchAbort ? { signal: nativeTouchAbort.signal } : undefined;
    const wheelOptions = nativeTouchAbort ? { passive: false, signal: nativeTouchAbort.signal } : { passive: false };
    [scene, els.svg, panel, panelHost].forEach(target => blockNativeTouchMenus(target, nativeTouchOptions));

    function updateAxisBounds() {
      const baseLeft = Math.max(26, view.width * 0.08);
      const baseRight = view.width - baseLeft;
      const center = view.width / 2;
      const span = (baseRight - baseLeft) * state.viewScale;
      view.left = center - span / 2;
      view.right = center + span / 2;
    }

    function setZoom(scale) {
      state.viewScale = clamp(scale, 0.75, 2.4);
      updateAxisBounds();
      draw();
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

    function sx(x) {
      return view.left + ((x - view.min) / (view.max - view.min)) * (view.right - view.left);
    }

    function valueFromX(clientX) {
      const rect = els.svg.getBoundingClientRect();
      const ratio = clamp((clientX - rect.left - view.left) / (view.right - view.left), 0, 1);
      return Math.round(view.min + ratio * (view.max - view.min));
    }

    function ineqText(op, val, variable = "x") {
      return `${variable} ${op.replace(">=", "≥").replace("<=", "≤")} ${val}`;
    }

    function intervalOf(op, val) {
      if (op === ">" || op === ">=") return { min: val, minInc: op === ">=", max: Infinity, maxInc: false };
      return { min: -Infinity, minInc: false, max: val, maxInc: op === "<=" };
    }

    function intersect(a, b) {
      const min = a.min > b.min ? a.min : b.min;
      const max = a.max < b.max ? a.max : b.max;
      let minInc = a.min === min ? a.minInc : b.minInc;
      let maxInc = a.max === max ? a.maxInc : b.maxInc;
      if (a.min === b.min) minInc = a.minInc && b.minInc;
      if (a.max === b.max) maxInc = a.maxInc && b.maxInc;
      if (min > max) return { empty: true };
      if (min === max && !(minInc && maxInc)) return { empty: true };
      return { min, minInc, max, maxInc, empty: false };
    }

    function solution() {
      const first = intervalOf(state.op1, state.a);
      if (!state.useSecond) return first;
      return intersect(first, intervalOf(state.op2, state.b));
    }

    function contains(interval, x) {
      if (interval.empty) return false;
      const geMin = interval.min === -Infinity || (interval.minInc ? x >= interval.min : x > interval.min);
      const leMax = interval.max === Infinity || (interval.maxInc ? x <= interval.max : x < interval.max);
      return geMin && leMax;
    }

    function solutionText(interval = solution()) {
      if (interval.empty) return "空集";
      if (interval.min === interval.max) return `{${interval.min}}`;
      const left = interval.min === -Infinity ? "(-∞" : `${interval.minInc ? "[" : "("}${interval.min}`;
      const right = interval.max === Infinity ? "+∞)" : `${interval.max}${interval.maxInc ? "]" : ")"}`;
      return `${left}, ${right}`;
    }

    function drawAxis() {
      els.axis.innerHTML = "";
      els.axis.appendChild(svgEl("line", { class: "math-ineq-axis", x1: view.left, y1: view.y, x2: view.right, y2: view.y }));
      for (let x = view.min; x <= view.max; x += 1) {
        const px = sx(x);
        els.axis.appendChild(svgEl("line", { class: "math-ineq-tick", x1: px, y1: view.y - 10, x2: px, y2: view.y + 10 }));
        if (x % 2 === 0) {
          const t = svgEl("text", { class: "math-ineq-num", x: px, y: view.y + 28 });
          t.textContent = String(x);
          els.axis.appendChild(t);
        }
      }
    }

    function drawRay(op, val, color, yOffset, ghost = false) {
      const dir = op === ">" || op === ">=" ? 1 : -1;
      const px = sx(val);
      const y = view.y + yOffset;
      const end = dir > 0 ? view.right - 12 : view.left + 12;
      const ray = svgEl("line", {
        class: `math-ineq-ray ${ghost ? "ghost" : ""}`,
        x1: px,
        y1: y,
        x2: end,
        y2: y,
        "marker-end": color === colors.two ? "url(#mathIneqArrowTwo)" : "url(#mathIneqArrowOne)"
      });
      ray.style.setProperty("--ray-color", color);
      ray.style.color = color;
      els.rays.appendChild(ray);
      const point = svgEl("circle", { class: `math-ineq-point ${op.includes("=") ? "solid" : ""}`, cx: px, cy: view.y, r: 9 });
      point.style.setProperty("--point-color", color);
      els.points.appendChild(point);
      const tag = svgEl("text", { class: "math-ineq-label small", x: px, y: view.y - 30 });
      tag.textContent = op.includes("=") ? "可取" : "不取";
      els.points.appendChild(tag);
    }

    function drawSolution(interval) {
      if (interval.empty) {
        const x = view.left + (view.right - view.left) / 2;
        els.rays.appendChild(svgEl("line", { class: "math-ineq-empty", x1: x - 24, y1: view.y - 24, x2: x + 24, y2: view.y + 24 }));
        els.rays.appendChild(svgEl("line", { class: "math-ineq-empty", x1: x + 24, y1: view.y - 24, x2: x - 24, y2: view.y + 24 }));
        const text = svgEl("text", { class: "math-ineq-label", x, y: view.y - 46 });
        text.textContent = "空集";
        els.rays.appendChild(text);
        return;
      }
      const y = view.y - 46;
      if (interval.min === interval.max) {
        const px = sx(interval.min);
        const node = svgEl("circle", { class: "math-ineq-solution-point", cx: px, cy: view.y, r: 12 });
        els.rays.appendChild(node);
        return;
      }
      const x1 = interval.min === -Infinity ? view.left + 12 : sx(interval.min);
      const x2 = interval.max === Infinity ? view.right - 12 : sx(interval.max);
      els.rays.appendChild(svgEl("line", { class: "math-ineq-solution", x1, y1: y, x2, y2: y }));
    }

    function drawTest(interval) {
      const x = sx(state.test);
      const ok = contains(interval, state.test);
      const node = svgEl("circle", { class: `math-ineq-test ${ok ? "" : "bad"}`, cx: x, cy: view.y + 66, r: 10, "data-test-point": "true" });
      els.testLayer.appendChild(node);
      const guide = svgEl("line", { class: "math-ineq-tick", x1: x, y1: view.y - 58, x2: x, y2: view.y + 66 });
      els.testLayer.insertBefore(guide, node);
      const text = svgEl("text", { class: "math-ineq-label", x, y: view.y + 94 });
      text.textContent = `t=${state.test} ${ok ? "满足" : "不满足"}`;
      els.testLayer.appendChild(text);
    }

    function draw() {
      const sol = solution();
      els.rays.innerHTML = "";
      els.points.innerHTML = "";
      els.testLayer.innerHTML = "";
      drawAxis();
      drawRay(state.op1, state.a, colors.one, -82, state.useSecond);
      if (state.useSecond) drawRay(state.op2, state.b, colors.two, 36, true);
      drawSolution(sol);
      drawTest(sol);
      updatePanel(sol);
    }

    function updatePanel(sol = solution()) {
      const secondText = ineqText(state.op2, state.b, "x");
      const firstText = ineqText(state.op1, state.a, "x");
      els.hudIneq.textContent = state.useSecond ? `${firstText}; ${secondText}` : firstText;
      els.hudSolution.textContent = solutionText(sol);
      els.hudTest.textContent = contains(sol, state.test) ? "满足" : "不满足";
      if (!panel) return;
      panel.querySelectorAll("[data-op]").forEach(btn => {
        const [which, op] = btn.dataset.op.split(":");
        btn.classList.toggle("active", (which === "1" ? state.op1 : state.op2) === op);
      });
      panel.querySelector("[data-toggle-second]")?.classList.toggle("active", state.useSecond);
      panel.querySelector("[data-toggle-param]")?.classList.toggle("active", state.paramMode);
      els.aChip.textContent = String(state.a);
      els.bChip.textContent = state.paramMode ? `m=${state.b}` : String(state.b);
      els.bLabel.textContent = state.paramMode ? "参数 m" : "端点 b";
      els.testChip.textContent = String(state.test);
      els.aSlider.value = String(state.a);
      els.bSlider.value = String(state.b);
      els.testSlider.value = String(state.test);
      els.ineq1Row.textContent = firstText;
      els.ineq2Row.textContent = state.useSecond ? (state.paramMode ? ineqText(state.op2, "m", "x") : secondText) : "关闭";
      els.solutionRow.textContent = solutionText(sol);
      els.testRow.textContent = contains(sol, state.test) ? "满足" : "不满足";
      if (!state.useSecond) els.note.textContent = "看方向和端点：空心不取，实心可取。";
      else if (sol.empty) els.note.textContent = "没有公共部分，解集为空。";
      else if (sol.min === sol.max) els.note.textContent = "只剩一个公共端点。";
      else els.note.textContent = "绿色部分是两个解集的公共部分。";
      fitPanel(panel);
    }

    function resize() {
      const rect = els.svg.getBoundingClientRect();
      view.width = Math.max(320, rect.width);
      view.height = Math.max(240, rect.height);
      updateAxisBounds();
      view.y = Math.round(view.height * 0.52);
      draw();
    }

    function setValue(key, value) {
      state[key] = clamp(Math.round(value), key === "test" ? -10 : -9, key === "test" ? 10 : 9);
      draw();
    }

    panel?.addEventListener("click", event => {
      const op = event.target.closest("[data-op]");
      if (op) {
        const [which, value] = op.dataset.op.split(":");
        if (which === "1") state.op1 = value;
        else state.op2 = value;
        draw();
        return;
      }
      const step = event.target.closest("[data-step]");
      if (step) {
        const [key, amount] = step.dataset.step.split(":");
        setValue(key, state[key] + Number(amount));
        return;
      }
      if (event.target.closest("[data-toggle-second]")) {
        state.useSecond = !state.useSecond;
        draw();
        return;
      }
      if (event.target.closest("[data-toggle-param]")) {
        state.paramMode = !state.paramMode;
        state.useSecond = true;
        draw();
        return;
      }
      if (event.target.closest("[data-reset]")) {
        state.op1 = ">";
        state.a = 2;
        state.useSecond = true;
        state.op2 = "<=";
        state.b = 6;
        state.paramMode = false;
        state.test = 3;
        draw();
      }
    });
    els.aSlider?.addEventListener("input", event => setValue("a", Number(event.target.value)));
    els.bSlider?.addEventListener("input", event => setValue("b", Number(event.target.value)));
    els.testSlider?.addEventListener("input", event => setValue("test", Number(event.target.value)));

    els.svg.addEventListener("pointerdown", event => {
      zoomGesture.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (zoomGesture.pointers.size >= 2) {
        state.draggingTest = false;
        state.dragPointerId = null;
        startPinchZoom();
        event.preventDefault();
        return;
      }
      if (!event.target.closest("[data-test-point]")) return;
      state.draggingTest = true;
      state.dragPointerId = event.pointerId;
      els.svg.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    });
    els.svg.addEventListener("pointermove", event => {
      if (zoomGesture.pointers.has(event.pointerId)) {
        zoomGesture.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      }
      if (zoomGesture.pointers.size >= 2) {
        updatePinchZoom();
        event.preventDefault();
        return;
      }
      if (!state.draggingTest) return;
      if (event.pointerId !== state.dragPointerId) return;
      const steps = event.getCoalescedEvents?.().length ? event.getCoalescedEvents() : [event];
      steps.forEach(step => setValue("test", valueFromX(step.clientX)));
      event.preventDefault();
    });
    const stopDrag = event => {
      zoomGesture.pointers.delete(event.pointerId);
      if (zoomGesture.pointers.size >= 2) startPinchZoom();
      if (!state.draggingTest || event.pointerId !== state.dragPointerId) return;
      state.draggingTest = false;
      state.dragPointerId = null;
      els.svg.releasePointerCapture?.(event.pointerId);
    };
    els.svg.addEventListener("pointerup", stopDrag);
    els.svg.addEventListener("pointercancel", stopDrag);
    els.svg.addEventListener("wheel", event => {
      event.preventDefault();
      setZoom(state.viewScale * (event.deltaY < 0 ? 1.12 : 0.88));
    }, wheelOptions);

    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    resizeObserver?.observe(container);
    if (panelHost) resizeObserver?.observe(panelHost);
    if (!resizeObserver) window.addEventListener("resize", resize);
    const raf = window.requestAnimationFrame || (fn => window.setTimeout(fn, 16));
    state.raf = raf(resize);

    container.__mathIneqCleanup = () => {
      nativeTouchAbort?.abort();
      resizeObserver?.disconnect();
      if (!resizeObserver) window.removeEventListener("resize", resize);
      const caf = window.cancelAnimationFrame || window.clearTimeout;
      caf(state.raf);
      container.innerHTML = "";
      if (panelHost) panelHost.innerHTML = "";
    };
  }

  window.MATH_VISUAL_SCENES[CARD_ID] = {
    mount,
    unmount(container) {
      if (container.__mathIneqCleanup) {
        container.__mathIneqCleanup();
        delete container.__mathIneqCleanup;
      } else {
        container.innerHTML = "";
      }
    }
  };
})();
