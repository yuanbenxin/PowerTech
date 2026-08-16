window.MATH_VISUAL_SCENES = window.MATH_VISUAL_SCENES || {};

(function () {
  const CARD_ID = "j7b_m02";
  const STYLE_ID = "math-translation-scene-style";
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
      .math-translation-scene,
      .math-translation-scene *,
      .math-translation-panel,
      .math-translation-panel * {
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -webkit-user-drag: none;
        user-select: none;
      }
      .math-translation-scene {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        color: #f8fafc;
        background:
          radial-gradient(circle at 22% 18%, rgba(34,211,238,0.14), transparent 32%),
          radial-gradient(circle at 78% 70%, rgba(250,204,21,0.10), transparent 34%),
          linear-gradient(145deg, #020617 0%, #07111f 56%, #020617 100%);
        font-family: Inter, "Noto Sans SC", "Microsoft YaHei UI", sans-serif;
        touch-action: none;
      }
      .math-translation-svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: block;
        user-select: none;
        touch-action: none;
      }
      .math-translation-grid {
        stroke: rgba(148,163,184,0.16);
        stroke-width: 1;
      }
      .math-translation-axis {
        stroke: rgba(226,232,240,0.48);
        stroke-width: 2.4;
      }
      .math-translation-tick {
        fill: rgba(203,213,225,0.68);
        font-size: 11px;
        font-weight: 850;
        text-anchor: middle;
        dominant-baseline: middle;
        paint-order: stroke;
        stroke: rgba(2,6,23,0.82);
        stroke-width: 3;
      }
      .math-translation-poly.orig {
        fill: rgba(56,189,248,0.14);
        stroke: #38bdf8;
        stroke-width: 3;
        filter: drop-shadow(0 0 12px rgba(56,189,248,0.28));
      }
      .math-translation-poly.trans {
        fill: rgba(250,204,21,0.18);
        stroke: #facc15;
        stroke-width: 3.5;
        filter: drop-shadow(0 0 14px rgba(250,204,21,0.36));
        cursor: grab;
      }
      .math-translation-poly.trans:active {
        cursor: grabbing;
      }
      .math-translation-trail {
        fill: none;
        stroke: rgba(250,204,21,0.42);
        stroke-width: 2;
        stroke-dasharray: 7 7;
      }
      .math-translation-arrow {
        stroke: rgba(34,211,238,0.78);
        stroke-width: 2.4;
        stroke-linecap: round;
        marker-end: url(#mathTranslationArrow);
        filter: drop-shadow(0 0 8px rgba(34,211,238,0.24));
      }
      .math-translation-arrow.main {
        stroke: #facc15;
        stroke-width: 4;
        marker-end: url(#mathTranslationArrowGold);
        filter: drop-shadow(0 0 14px rgba(250,204,21,0.42));
      }
      .math-translation-step {
        fill: none;
        stroke: #a78bfa;
        stroke-width: 2.6;
        stroke-dasharray: 8 7;
        marker-end: url(#mathTranslationArrowViolet);
      }
      .math-translation-point {
        fill: #ffffff;
        stroke: #38bdf8;
        stroke-width: 3;
        cursor: pointer;
      }
      .math-translation-point.trans {
        stroke: #facc15;
      }
      .math-translation-point.active {
        r: 8;
        stroke-width: 4;
        filter: drop-shadow(0 0 12px rgba(250,204,21,0.7));
      }
      .math-translation-label {
        fill: #ffffff;
        font-size: 13px;
        font-weight: 950;
        paint-order: stroke;
        stroke: rgba(2,6,23,0.9);
        stroke-width: 4;
        stroke-linejoin: round;
        pointer-events: none;
      }
      .math-translation-hud {
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
      .math-translation-stat {
        min-width: 0;
        border: 1px solid rgba(148,163,184,0.18);
        border-radius: 8px;
        background: rgba(2,6,23,0.62);
        backdrop-filter: blur(12px);
        padding: 8px 10px;
      }
      .math-translation-stat-label {
        color: rgba(226,232,240,0.56);
        font-size: 10px;
        font-weight: 900;
      }
      .math-translation-stat-value {
        margin-top: 2px;
        color: #ffffff;
        font-size: 17px;
        line-height: 1;
        font-weight: 950;
        white-space: nowrap;
      }
      .math-translation-panel {
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
      .math-translation-panel::-webkit-scrollbar {
        width: 0;
        height: 0;
      }
      .math-translation-card {
        min-height: 0;
        border: 1px solid rgba(148,163,184,0.16);
        border-radius: 8px;
        background: rgba(15,23,42,0.64);
        padding: 8px;
      }
      .math-translation-modes,
      .math-translation-actions {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 7px;
      }
      .math-translation-button {
        min-width: 0;
        min-height: var(--bio-touch-target, 40px);
        border: 1px solid rgba(148,163,184,0.18);
        border-radius: 8px;
        background: rgba(2,6,23,0.36);
        color: rgba(226,232,240,0.78);
        font-size: 11px;
        font-weight: 950;
        line-height: 1.16;
        padding: 6px 7px;
        cursor: pointer;
      }
      .math-translation-button.active {
        border-color: rgba(56,189,248,0.72);
        background: rgba(56,189,248,0.14);
        color: #e0f2fe;
      }
      .math-translation-button:active {
        transform: scale(0.98);
      }
      .math-translation-field {
        display: grid;
        gap: 6px;
      }
      .math-translation-field label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: rgba(226,232,240,0.72);
        font-size: 11px;
        font-weight: 900;
      }
      .math-translation-chip {
        color: #facc15;
        font-size: 16px;
        line-height: 1;
        font-weight: 950;
      }
      .math-translation-stepper {
        display: grid;
        grid-template-columns: 42px minmax(0, 1fr) 42px;
        gap: 7px;
        align-items: center;
      }
      .math-translation-range {
        width: 100%;
        height: 30px;
        margin: 0;
        accent-color: #38bdf8;
        touch-action: none;
      }
      .math-translation-invariants {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 7px;
      }
      .math-translation-badge {
        min-height: 30px;
        display: grid;
        place-items: center;
        border: 1px solid rgba(34,197,94,0.26);
        border-radius: 8px;
        background: rgba(34,197,94,0.08);
        color: #bbf7d0;
        font-size: 10px;
        font-weight: 950;
      }
      .math-translation-formula {
        display: grid;
        gap: 5px;
      }
      .math-translation-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        min-height: 27px;
        color: rgba(226,232,240,0.78);
        font-size: 11px;
        font-weight: 850;
      }
      .math-translation-row strong {
        color: #ffffff;
        white-space: nowrap;
      }
      .math-translation-note {
        color: rgba(203,213,225,0.78);
        font-size: 11px;
        line-height: 1.4;
        font-weight: 750;
      }
      .math-translation-panel[data-size="micro"] {
        gap: 6px;
        padding: 8px;
      }
      .math-translation-panel[data-size="micro"] .math-translation-card {
        padding: 7px;
      }
      .math-translation-panel[data-size="micro"] .math-translation-button {
        min-height: 32px;
        font-size: 9px;
        padding: 4px 5px;
      }
      .math-translation-panel[data-size="micro"] .math-translation-note {
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
    const shapes = {
      triangle: [
        { id: "A", x: 0, y: 3 },
        { id: "B", x: -3, y: -2 },
        { id: "C", x: 3, y: -2 }
      ],
      quad: [
        { id: "A", x: -2, y: 2 },
        { id: "B", x: -3, y: -2 },
        { id: "C", x: 2, y: -2 },
        { id: "D", x: 3, y: 2 }
      ],
      pentagon: [
        { id: "A", x: 0, y: 3 },
        { id: "B", x: -3, y: 1 },
        { id: "C", x: -2, y: -2 },
        { id: "D", x: 2, y: -2 },
        { id: "E", x: 3, y: 1 }
      ]
    };
    const state = {
      shape: "triangle",
      dx: 4,
      dy: -2,
      activeIndex: 0,
      showTrail: true,
      showStep: false,
      dragging: false,
      dragPointerId: null,
      dragStart: null,
      raf: 0,
      viewScale: 1
    };
    const view = { width: 0, height: 0, cx: 0, cy: 0, baseUnit: 42, unit: 42 };
    const zoomGesture = { pointers: new Map(), startDistance: 0, startScale: 1 };
    const refs = {};

    container.innerHTML = "";
    const scene = document.createElement("div");
    scene.className = "math-translation-scene";
    scene.innerHTML = `
      <div class="math-translation-hud">
        <div class="math-translation-stat"><div class="math-translation-stat-label">平移向量</div><div class="math-translation-stat-value" data-hud-vector></div></div>
        <div class="math-translation-stat"><div class="math-translation-stat-label">选中顶点</div><div class="math-translation-stat-value" data-hud-point></div></div>
        <div class="math-translation-stat"><div class="math-translation-stat-label">图形性质</div><div class="math-translation-stat-value">不变</div></div>
      </div>
      <svg class="math-translation-svg" data-svg>
        <defs>
          <marker id="mathTranslationArrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 0 1 L 10 5 L 0 9 Z" fill="#22d3ee"/></marker>
          <marker id="mathTranslationArrowGold" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 1 L 10 5 L 0 9 Z" fill="#facc15"/></marker>
          <marker id="mathTranslationArrowViolet" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 0 1 L 10 5 L 0 9 Z" fill="#a78bfa"/></marker>
        </defs>
        <g data-grid></g>
        <g data-trails></g>
        <g data-arrows></g>
        <g data-polygons></g>
        <g data-points></g>
      </svg>
    `;
    container.appendChild(scene);

    let panel = null;
    if (panelHost) {
      panelHost.innerHTML = "";
      panel = document.createElement("div");
      panel.className = "math-translation-panel";
      panel.innerHTML = `
        <div class="math-translation-card math-translation-modes">
          <button class="math-translation-button active" type="button" data-shape="triangle">三角形</button>
          <button class="math-translation-button" type="button" data-shape="quad">四边形</button>
          <button class="math-translation-button" type="button" data-shape="pentagon">五边形</button>
        </div>
        <div class="math-translation-card math-translation-field">
          <label>水平 dx <span class="math-translation-chip" data-dx-chip></span></label>
          <div class="math-translation-stepper">
            <button class="math-translation-button" type="button" data-step="dx:-1">-1</button>
            <input class="math-translation-range" data-dx-slider type="range" min="-8" max="8" step="1" value="4">
            <button class="math-translation-button" type="button" data-step="dx:1">+1</button>
          </div>
        </div>
        <div class="math-translation-card math-translation-field">
          <label>竖直 dy <span class="math-translation-chip" data-dy-chip></span></label>
          <div class="math-translation-stepper">
            <button class="math-translation-button" type="button" data-step="dy:-1">-1</button>
            <input class="math-translation-range" data-dy-slider type="range" min="-8" max="8" step="1" value="-2">
            <button class="math-translation-button" type="button" data-step="dy:1">+1</button>
          </div>
        </div>
        <div class="math-translation-card math-translation-actions">
          <button class="math-translation-button active" type="button" data-toggle="trail">轨迹</button>
          <button class="math-translation-button" type="button" data-toggle="step">分步</button>
          <button class="math-translation-button" type="button" data-reset>归零</button>
        </div>
        <div class="math-translation-card math-translation-invariants">
          <div class="math-translation-badge">面积不变</div>
          <div class="math-translation-badge">边长不变</div>
          <div class="math-translation-badge">角度不变</div>
        </div>
        <div class="math-translation-card math-translation-formula">
          <div class="math-translation-row"><span>对应点</span><strong data-point-row></strong></div>
          <div class="math-translation-row"><span>坐标式</span><strong data-formula-row></strong></div>
          <div class="math-translation-note">拖动黄色图形可直接改变平移向量。</div>
        </div>
      `;
      panelHost.appendChild(panel);
      fitPanel(panel);
    }

    const els = {
      svg: scene.querySelector("[data-svg]"),
      grid: scene.querySelector("[data-grid]"),
      trails: scene.querySelector("[data-trails]"),
      arrows: scene.querySelector("[data-arrows]"),
      polygons: scene.querySelector("[data-polygons]"),
      points: scene.querySelector("[data-points]"),
      hudVector: scene.querySelector("[data-hud-vector]"),
      hudPoint: scene.querySelector("[data-hud-point]"),
      panel,
      dxChip: panel?.querySelector("[data-dx-chip]"),
      dyChip: panel?.querySelector("[data-dy-chip]"),
      dxSlider: panel?.querySelector("[data-dx-slider]"),
      dySlider: panel?.querySelector("[data-dy-slider]"),
      pointRow: panel?.querySelector("[data-point-row]"),
      formulaRow: panel?.querySelector("[data-formula-row]")
    };

    const nativeTouchAbort = typeof AbortController !== "undefined" ? new AbortController() : null;
    const nativeTouchOptions = nativeTouchAbort ? { signal: nativeTouchAbort.signal } : undefined;
    const wheelOptions = nativeTouchAbort ? { passive: false, signal: nativeTouchAbort.signal } : { passive: false };
    [scene, els.svg, panel, panelHost].forEach(target => blockNativeTouchMenus(target, nativeTouchOptions));

    function setZoom(scale) {
      state.viewScale = clamp(scale, 0.75, 2.4);
      view.unit = view.baseUnit * state.viewScale;
      drawGrid();
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

    function vertices() {
      return shapes[state.shape];
    }

    function moved(v) {
      return { id: `${v.id}'`, x: v.x + state.dx, y: v.y + state.dy };
    }

    function sx(x) {
      return view.cx + x * view.unit;
    }

    function sy(y) {
      return view.cy - y * view.unit;
    }

    function fromScreen(clientX, clientY) {
      const rect = els.svg.getBoundingClientRect();
      return {
        x: (clientX - rect.left - view.cx) / view.unit,
        y: (view.cy - (clientY - rect.top)) / view.unit
      };
    }

    function pointsString(list) {
      return list.map(v => `${sx(v.x)},${sy(v.y)}`).join(" ");
    }

    function centroid(list) {
      return list.reduce((acc, v) => ({ x: acc.x + v.x / list.length, y: acc.y + v.y / list.length }), { x: 0, y: 0 });
    }

    function addText(parent, x, y, text, cls = "math-translation-label") {
      const node = svgEl("text", { x, y, class: cls });
      node.textContent = text;
      parent.appendChild(node);
      return node;
    }

    function drawGrid() {
      els.grid.innerHTML = "";
      const minX = Math.floor((0 - view.cx) / view.unit) - 1;
      const maxX = Math.ceil((view.width - view.cx) / view.unit) + 1;
      const minY = Math.floor((view.cy - view.height) / view.unit) - 1;
      const maxY = Math.ceil(view.cy / view.unit) + 1;
      for (let x = minX; x <= maxX; x += 1) {
        els.grid.appendChild(svgEl("line", { class: x === 0 ? "math-translation-axis" : "math-translation-grid", x1: sx(x), y1: 0, x2: sx(x), y2: view.height }));
        if (x !== 0 && x % 2 === 0) addText(els.grid, sx(x), sy(0) + 18, String(x), "math-translation-tick");
      }
      for (let y = minY; y <= maxY; y += 1) {
        els.grid.appendChild(svgEl("line", { class: y === 0 ? "math-translation-axis" : "math-translation-grid", x1: 0, y1: sy(y), x2: view.width, y2: sy(y) }));
        if (y !== 0 && y % 2 === 0) addText(els.grid, sx(0) - 18, sy(y), String(y), "math-translation-tick");
      }
      addText(els.grid, sx(0) - 12, sy(0) + 18, "O", "math-translation-tick");
    }

    function draw() {
      const orig = vertices();
      const trans = orig.map(moved);
      const active = orig[state.activeIndex] || orig[0];
      const activeMoved = moved(active);
      els.trails.innerHTML = "";
      els.arrows.innerHTML = "";
      els.polygons.innerHTML = "";
      els.points.innerHTML = "";
      if (state.showTrail) {
        els.trails.appendChild(svgEl("polygon", { class: "math-translation-trail", points: pointsString(orig) }));
        orig.forEach(v => {
          els.trails.appendChild(svgEl("line", { class: "math-translation-arrow", x1: sx(v.x), y1: sy(v.y), x2: sx(v.x + state.dx), y2: sy(v.y + state.dy) }));
        });
      }
      const c1 = centroid(orig);
      const c2 = centroid(trans);
      els.arrows.appendChild(svgEl("line", { class: "math-translation-arrow main", x1: sx(c1.x), y1: sy(c1.y), x2: sx(c2.x), y2: sy(c2.y) }));
      addText(els.arrows, (sx(c1.x) + sx(c2.x)) / 2, (sy(c1.y) + sy(c2.y)) / 2 - 16, `(${state.dx}, ${state.dy})`);
      if (state.showStep) {
        els.arrows.appendChild(svgEl("path", {
          class: "math-translation-step",
          d: `M ${sx(active.x)} ${sy(active.y)} L ${sx(active.x + state.dx)} ${sy(active.y)} L ${sx(activeMoved.x)} ${sy(activeMoved.y)}`
        }));
      }
      els.polygons.appendChild(svgEl("polygon", { class: "math-translation-poly orig", points: pointsString(orig) }));
      els.polygons.appendChild(svgEl("polygon", { class: "math-translation-poly trans", points: pointsString(trans), "data-drag-poly": "true" }));
      orig.forEach((v, index) => {
        const p1 = svgEl("circle", { class: `math-translation-point ${index === state.activeIndex ? "active" : ""}`, cx: sx(v.x), cy: sy(v.y), r: index === state.activeIndex ? 8 : 6, "data-index": index });
        const mv = moved(v);
        const p2 = svgEl("circle", { class: `math-translation-point trans ${index === state.activeIndex ? "active" : ""}`, cx: sx(mv.x), cy: sy(mv.y), r: index === state.activeIndex ? 8 : 6, "data-index": index });
        els.points.append(p1, p2);
        addText(els.points, sx(v.x) + 10, sy(v.y) - 10, v.id);
        addText(els.points, sx(mv.x) + 10, sy(mv.y) - 10, `${v.id}'`);
      });
      updatePanel();
    }

    function updatePanel() {
      const active = vertices()[state.activeIndex] || vertices()[0];
      const target = moved(active);
      els.hudVector.textContent = `(${state.dx}, ${state.dy})`;
      els.hudPoint.textContent = `${active.id} -> ${active.id}'`;
      if (!panel) return;
      panel.querySelectorAll("[data-shape]").forEach(btn => btn.classList.toggle("active", btn.dataset.shape === state.shape));
      panel.querySelector('[data-toggle="trail"]')?.classList.toggle("active", state.showTrail);
      panel.querySelector('[data-toggle="step"]')?.classList.toggle("active", state.showStep);
      els.dxChip.textContent = state.dx > 0 ? `+${state.dx}` : String(state.dx);
      els.dyChip.textContent = state.dy > 0 ? `+${state.dy}` : String(state.dy);
      els.dxSlider.value = String(state.dx);
      els.dySlider.value = String(state.dy);
      els.pointRow.textContent = `${active.id}(${active.x},${active.y}) -> ${active.id}'(${target.x},${target.y})`;
      els.formulaRow.textContent = `(${active.x}${state.dx >= 0 ? "+" : ""}${state.dx}, ${active.y}${state.dy >= 0 ? "+" : ""}${state.dy})`;
      fitPanel(panel);
    }

    function resize() {
      const rect = els.svg.getBoundingClientRect();
      view.width = Math.max(320, rect.width);
      view.height = Math.max(240, rect.height);
      view.cx = view.width / 2;
      view.cy = view.height / 2 + 18;
      view.baseUnit = clamp(Math.min(view.width, view.height) / 14, 28, 52);
      view.unit = view.baseUnit * state.viewScale;
      drawGrid();
      draw();
    }

    function setDelta(axis, value) {
      state[axis] = clamp(Math.round(value), -8, 8);
      draw();
    }

    els.svg.addEventListener("pointerdown", event => {
      zoomGesture.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (zoomGesture.pointers.size >= 2) {
        state.dragging = false;
        state.dragPointerId = null;
        state.dragStart = null;
        startPinchZoom();
        event.preventDefault();
        return;
      }
      const indexNode = event.target.closest("[data-index]");
      if (indexNode) {
        state.activeIndex = Number(indexNode.dataset.index);
        draw();
      }
      if (event.target.closest("[data-drag-poly]") || event.target.closest(".math-translation-point.trans")) {
        state.dragging = true;
        state.dragPointerId = event.pointerId;
        state.dragStart = { point: fromScreen(event.clientX, event.clientY), dx: state.dx, dy: state.dy };
        els.svg.setPointerCapture?.(event.pointerId);
        event.preventDefault();
      }
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
      if (!state.dragging || !state.dragStart) return;
      if (event.pointerId !== state.dragPointerId) return;
      const steps = event.getCoalescedEvents?.().length ? event.getCoalescedEvents() : [event];
      steps.forEach(step => {
        const p = fromScreen(step.clientX, step.clientY);
        setDelta("dx", state.dragStart.dx + p.x - state.dragStart.point.x);
        setDelta("dy", state.dragStart.dy + p.y - state.dragStart.point.y);
      });
      event.preventDefault();
    });
    const stopDrag = event => {
      zoomGesture.pointers.delete(event.pointerId);
      if (zoomGesture.pointers.size >= 2) startPinchZoom();
      if (!state.dragging || event.pointerId !== state.dragPointerId) return;
      state.dragging = false;
      state.dragPointerId = null;
      state.dragStart = null;
      els.svg.releasePointerCapture?.(event.pointerId);
    };
    els.svg.addEventListener("pointerup", stopDrag);
    els.svg.addEventListener("pointercancel", stopDrag);
    els.svg.addEventListener("wheel", event => {
      event.preventDefault();
      setZoom(state.viewScale * (event.deltaY < 0 ? 1.12 : 0.88));
    }, wheelOptions);

    panel?.addEventListener("click", event => {
      const shape = event.target.closest("[data-shape]");
      if (shape) {
        state.shape = shape.dataset.shape;
        state.activeIndex = 0;
        draw();
        return;
      }
      const step = event.target.closest("[data-step]");
      if (step) {
        const [axis, amount] = step.dataset.step.split(":");
        setDelta(axis, state[axis] + Number(amount));
        return;
      }
      const toggle = event.target.closest("[data-toggle]");
      if (toggle) {
        if (toggle.dataset.toggle === "trail") state.showTrail = !state.showTrail;
        if (toggle.dataset.toggle === "step") state.showStep = !state.showStep;
        draw();
        return;
      }
      if (event.target.closest("[data-reset]")) {
        state.dx = 0;
        state.dy = 0;
        draw();
      }
    });
    els.dxSlider?.addEventListener("input", event => setDelta("dx", Number(event.target.value)));
    els.dySlider?.addEventListener("input", event => setDelta("dy", Number(event.target.value)));

    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    resizeObserver?.observe(container);
    if (panelHost) resizeObserver?.observe(panelHost);
    if (!resizeObserver) window.addEventListener("resize", resize);
    const raf = window.requestAnimationFrame || (fn => window.setTimeout(fn, 16));
    state.raf = raf(resize);

    container.__mathTranslationCleanup = () => {
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
      if (container.__mathTranslationCleanup) {
        container.__mathTranslationCleanup();
        delete container.__mathTranslationCleanup;
      } else {
        container.innerHTML = "";
      }
    }
  };
})();
