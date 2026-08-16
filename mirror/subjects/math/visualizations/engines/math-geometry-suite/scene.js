window.MATH_VISUAL_SCENES = window.MATH_VISUAL_SCENES || {};

(function () {
  const STYLE_ID = "math-geometry-suite-style";
  const SVG_NS = "http://www.w3.org/2000/svg";

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function round(value, digits = 1) {
    const factor = 10 ** digits;
    const result = Math.round(value * factor) / factor;
    return Object.is(result, -0) ? 0 : result;
  }

  function fmt(value, digits = 1) {
    return String(round(value, digits)).replace(/\.0$/, "");
  }

  function svgEl(tag, attrs = {}) {
    const node = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  }

  function setAttrs(node, attrs = {}) {
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function pointText(svg, x, y, text, className = "mg-label") {
    const label = svgEl("text", { x, y, class: className });
    label.textContent = text;
    svg.appendChild(label);
    return label;
  }

  function polygon(svg, points, className, attrs = {}) {
    const node = svgEl("polygon", {
      points: points.map(point => `${point.x},${point.y}`).join(" "),
      class: className,
      ...attrs
    });
    svg.appendChild(node);
    return node;
  }

  function line(svg, x1, y1, x2, y2, className, attrs = {}) {
    const node = svgEl("line", { x1, y1, x2, y2, class: className, ...attrs });
    svg.appendChild(node);
    return node;
  }

  function rect(svg, x, y, width, height, className, attrs = {}) {
    const node = svgEl("rect", { x, y, width, height, class: className, ...attrs });
    svg.appendChild(node);
    return node;
  }

  function circle(svg, cx, cy, r, className, attrs = {}) {
    const node = svgEl("circle", { cx, cy, r, class: className, ...attrs });
    svg.appendChild(node);
    return node;
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .mg-scene,
      .mg-scene *,
      .mg-panel,
      .mg-panel * {
        box-sizing: border-box;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -webkit-user-drag: none;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
      }
      .mg-scene {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        color: #f8fafc;
        background:
          radial-gradient(circle at 24% 18%, rgba(56,189,248,0.14), transparent 32%),
          radial-gradient(circle at 78% 74%, rgba(244,114,182,0.11), transparent 35%),
          linear-gradient(145deg, #020617 0%, #07111d 54%, #020617 100%);
        font-family: Inter, "Noto Sans SC", "Microsoft YaHei UI", sans-serif;
        touch-action: none;
      }
      .mg-scene::before {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        background:
          linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
        background-size: 40px 40px;
        opacity: 0.72;
      }
      .mg-svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: block;
        user-select: none;
        touch-action: none;
        cursor: grab;
      }
      .mg-scene.is-panning .mg-svg {
        cursor: grabbing;
      }
      .mg-zoom-tools {
        position: absolute;
        top: 14px;
        right: 14px;
        z-index: 4;
        display: grid;
        grid-template-columns: 34px 52px 34px;
        gap: 5px;
        align-items: center;
        padding: 5px;
        border: 1px solid rgba(250,204,21,0.24);
        border-radius: 10px;
        background: rgba(2,6,23,0.70);
        box-shadow: 0 12px 30px rgba(2,6,23,0.35);
        backdrop-filter: blur(12px);
        touch-action: none;
      }
      .mg-zoom-tools button {
        width: 34px;
        height: 32px;
        min-height: 32px;
        border: 1px solid rgba(148,163,184,0.22);
        border-radius: 8px;
        background: rgba(15,23,42,0.78);
        color: #e0f2fe;
        font: 950 16px/1 "Microsoft YaHei", sans-serif;
        padding: 0;
        cursor: pointer;
        touch-action: manipulation;
      }
      .mg-zoom-tools button[data-mg-zoom="reset"] {
        width: 52px;
        font-size: 11px;
      }
      .mg-zoom-tools span {
        grid-column: 1 / -1;
        text-align: center;
        color: #fde68a;
        font: 900 10px/1 "Microsoft YaHei", sans-serif;
      }
      @media (max-width: 720px) {
        .mg-zoom-tools {
          top: auto;
          right: 10px;
          bottom: 10px;
          grid-template-columns: 32px 48px 32px;
          padding: 4px;
        }
        .mg-zoom-tools button {
          width: 32px;
          height: 30px;
          min-height: 30px;
        }
        .mg-zoom-tools button[data-mg-zoom="reset"] {
          width: 48px;
        }
      }
      .mg-hud {
        position: absolute;
        left: 14px;
        top: 14px;
        z-index: 3;
        display: grid;
        grid-template-columns: repeat(3, minmax(74px, 1fr));
        gap: 8px;
        width: min(480px, calc(100% - 28px));
        pointer-events: none;
      }
      .mg-stat {
        min-width: 0;
        border: 1px solid rgba(148,163,184,0.18);
        border-radius: 8px;
        background: rgba(2,6,23,0.62);
        backdrop-filter: blur(12px);
        padding: 8px 10px;
      }
      .mg-stat-label {
        color: rgba(226,232,240,0.54);
        font-size: 10px;
        font-weight: 900;
        letter-spacing: 0.11em;
      }
      .mg-stat-value {
        margin-top: 2px;
        color: #fff;
        font-size: 17px;
        line-height: 1.05;
        font-weight: 950;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .mg-panel {
        --mg-panel-accent: #38bdf8;
        --mg-panel-accent-strong: #67e8f9;
        --mg-panel-gold: #facc15;
        --mg-panel-violet: #a78bfa;
        --mg-panel-line: rgba(255,255,255,0.086);
        --mg-panel-card: rgba(8,13,24,0.46);
        --mg-panel-control: rgba(255,255,255,0.052);
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
      .mg-panel::-webkit-scrollbar {
        width: 0;
        height: 0;
      }
      .mg-card {
        min-height: 0;
        overflow: hidden;
        border: 1px solid var(--mg-panel-line);
        border-radius: 12px;
        background:
          linear-gradient(180deg, rgba(255,255,255,0.046), rgba(255,255,255,0.026)),
          var(--mg-panel-card);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.045);
        backdrop-filter: blur(12px);
        padding: 11px;
      }
      .mg-card.tight {
        padding: 9px;
      }
      .mg-grid {
        display: grid;
        gap: 8px;
      }
      .mg-grid.two {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .mg-grid.three {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .mg-btn {
        min-height: var(--bio-touch-target, 44px);
        appearance: none;
        border: 1px solid rgba(255,255,255,0.10);
        border-radius: 10px;
        background: var(--mg-panel-control);
        color: rgba(241,245,249,0.88);
        font-size: 12px;
        line-height: 1.2;
        font-weight: 900;
        cursor: pointer;
        transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease, color 0.16s ease;
        touch-action: manipulation;
      }
      .mg-btn:active {
        transform: scale(0.975);
      }
      .mg-btn.active,
      .mg-btn.good {
        border-color: rgba(103,232,249,0.62);
        background:
          linear-gradient(180deg, rgba(56,189,248,0.22), rgba(14,165,233,0.10)),
          rgba(8,13,24,0.42);
        color: #ecfeff;
        box-shadow: inset 3px 0 0 rgba(56,189,248,0.82), 0 0 18px rgba(56,189,248,0.10);
      }
      .mg-btn.warn {
        border-color: rgba(244,114,182,0.62);
        background: rgba(244,114,182,0.14);
        color: #f9a8d4;
      }
      .mg-row {
        display: grid;
        grid-template-columns: minmax(58px, 0.68fr) minmax(0, 1fr) minmax(42px, 0.46fr);
        align-items: center;
        gap: 8px;
        min-height: 34px;
      }
      .mg-row span:first-child,
      .mg-kicker {
        color: rgba(226,232,240,0.62);
        font-size: 11px;
        font-weight: 900;
      }
      .mg-value {
        color: #facc15;
        font-size: 13px;
        font-weight: 950;
        text-align: right;
        white-space: nowrap;
      }
      .mg-range {
        width: 100%;
        height: 44px;
        min-height: 44px;
        min-width: 0;
        appearance: none;
        background: transparent;
        cursor: pointer;
        touch-action: none;
      }
      .mg-range::-webkit-slider-runnable-track {
        height: 6px;
        border-radius: 999px;
        background: rgba(226,232,240,0.16);
      }
      .mg-range::-webkit-slider-thumb {
        width: 24px;
        height: 24px;
        margin-top: -9px;
        border: 2px solid #fff;
        border-radius: 999px;
        appearance: none;
        background: #22d3ee;
        box-shadow: 0 0 14px rgba(34,211,238,0.46);
      }
      .mg-readout {
        display: grid;
        gap: 6px;
        color: rgba(226,232,240,0.78);
        font-size: 12px;
        font-weight: 800;
        line-height: 1.45;
      }
      .mg-readout-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        border-radius: 10px;
        background: rgba(255,255,255,0.04);
        padding: 7px 9px;
      }
      .mg-readout strong {
        color: #fff;
        font-weight: 950;
        white-space: nowrap;
      }
      .mg-area-bars {
        display: grid;
        gap: 7px;
      }
      .mg-area-bar {
        display: grid;
        grid-template-columns: minmax(64px, 0.78fr) minmax(0, 1fr) minmax(42px, 0.46fr);
        align-items: center;
        gap: 8px;
        min-height: 24px;
        color: rgba(226,232,240,0.78);
        font-size: 11px;
        font-weight: 900;
      }
      .mg-area-track {
        min-width: 0;
        height: 8px;
        border-radius: 999px;
        background: rgba(255,255,255,0.08);
        overflow: hidden;
      }
      .mg-area-fill {
        height: 100%;
        border-radius: inherit;
        background: var(--bar-color, #22d3ee);
        box-shadow: 0 0 12px rgba(34,211,238,0.22);
        transition: width 0.2s ease;
      }
      .mg-formula {
        border-radius: 12px;
        border: 1px solid rgba(250,204,21,0.18);
        background:
          linear-gradient(180deg, rgba(250,204,21,0.055), rgba(255,255,255,0.018)),
          rgba(8,13,24,0.48);
        color: var(--mg-panel-gold);
        padding: 9px 10px;
        text-align: center;
        font-size: 17px;
        line-height: 1.24;
        font-weight: 950;
      }
      .mg-formula-term {
        display: inline-block;
        border-radius: 8px;
        padding: 1px 4px;
        transition: color 0.16s ease, background 0.16s ease, box-shadow 0.16s ease;
      }
      .mg-formula-term.hot {
        color: #ffffff;
        background: rgba(56,189,248,0.18);
        box-shadow: 0 0 16px rgba(56,189,248,0.22);
      }
      .mg-formula-term.hot.ab {
        background: rgba(168,85,247,0.20);
        box-shadow: 0 0 16px rgba(168,85,247,0.24);
      }
      .mg-formula-term.hot.b2 {
        background: rgba(250,204,21,0.20);
        box-shadow: 0 0 16px rgba(250,204,21,0.24);
      }
      .mg-step {
        border-radius: 10px;
        background: rgba(255,255,255,0.045);
        color: rgba(226,232,240,0.76);
        padding: 7px 9px;
        font-size: 11px;
        line-height: 1.35;
        font-weight: 850;
      }
      .mg-step.active {
        border-left: 3px solid #facc15;
        background: rgba(250,204,21,0.12);
        color: #fef9c3;
      }
      .mg-verdict {
        display: grid;
        place-items: center;
        min-height: 44px;
        border-radius: 12px;
        border: 1px solid var(--mg-panel-line);
        background: rgba(8,13,24,0.48);
        color: rgba(226,232,240,0.72);
        text-align: center;
        font-size: 13px;
        font-weight: 950;
        line-height: 1.35;
      }
      .mg-verdict.good {
        border-color: rgba(103,232,249,0.62);
        background: rgba(56,189,248,0.16);
        color: var(--mg-panel-accent-strong);
      }
      .mg-verdict.warn {
        border-color: rgba(244,114,182,0.62);
        background: rgba(244,114,182,0.13);
        color: #f9a8d4;
      }
      .mg-meter {
        height: 14px;
        border: 1px solid rgba(148,163,184,0.2);
        border-radius: 999px;
        overflow: hidden;
        background: rgba(2,6,23,0.62);
      }
      .mg-fill {
        height: 100%;
        width: 0;
        border-radius: inherit;
        background: linear-gradient(90deg, #0284c7, #22d3ee);
        box-shadow: 0 0 14px rgba(34,211,238,0.42);
        transition: width 0.16s ease;
      }
      .mg-fill.gold {
        background: linear-gradient(90deg, #b45309, #facc15);
        box-shadow: 0 0 14px rgba(250,204,21,0.42);
      }
      .mg-label {
        fill: #f8fafc;
        font-size: 18px;
        font-weight: 950;
        text-anchor: middle;
        dominant-baseline: middle;
        paint-order: stroke;
        stroke: rgba(2,6,23,0.9);
        stroke-width: 5;
        stroke-linejoin: round;
        pointer-events: none;
      }
      .mg-small-label {
        fill: rgba(226,232,240,0.82);
        font-size: 13px;
        font-weight: 900;
        text-anchor: middle;
        dominant-baseline: middle;
        paint-order: stroke;
        stroke: rgba(2,6,23,0.9);
        stroke-width: 4;
        stroke-linejoin: round;
        pointer-events: none;
      }
      .mg-line {
        stroke: rgba(226,232,240,0.8);
        stroke-width: 4;
        stroke-linecap: round;
        filter: drop-shadow(0 0 9px rgba(255,255,255,0.12));
      }
      .mg-dash {
        stroke-dasharray: 8 8;
      }
      .mg-poly {
        stroke: rgba(226,232,240,0.82);
        stroke-width: 3;
        stroke-linejoin: round;
      }
      .mg-hit {
        cursor: pointer;
        touch-action: manipulation;
      }
      .mg-control-dot {
        cursor: grab;
        fill: #ffffff;
        stroke-width: 3;
        filter: drop-shadow(0 0 9px currentColor);
        touch-action: none;
      }
      .mg-control-dot:active {
        cursor: grabbing;
      }
      .mg-angle-sector {
        opacity: 0.2;
        transition: opacity 0.15s ease, filter 0.15s ease;
      }
      .mg-angle-sector.active {
        opacity: 0.58;
        filter: drop-shadow(0 0 13px rgba(250,204,21,0.62));
      }
      .mg-angle-sector.scan {
        opacity: 0.48;
        filter: drop-shadow(0 0 11px rgba(34,211,238,0.52));
      }
      .mg-piece {
        stroke: rgba(255,255,255,0.86);
        stroke-width: 2.5;
        stroke-linejoin: round;
        filter: drop-shadow(0 12px 18px rgba(0,0,0,0.34));
        transition: opacity 0.18s ease;
      }
      .mg-removed-area {
        fill: rgba(244,63,94,0.08);
        stroke: rgba(244,63,94,0.92);
        stroke-width: 3;
        stroke-dasharray: 8 6;
        stroke-linejoin: round;
        filter: drop-shadow(0 0 12px rgba(244,63,94,0.28));
      }
      .mg-piece-hot {
        stroke: #ffffff;
        stroke-width: 4;
        filter: drop-shadow(0 0 16px rgba(250,204,21,0.54)) drop-shadow(0 14px 18px rgba(0,0,0,0.32));
      }
      .mg-piece-hit {
        cursor: pointer;
        touch-action: manipulation;
      }
      .mg-trace {
        fill: none;
        stroke-width: 7;
        stroke-linecap: round;
        stroke-linejoin: round;
        opacity: 0.78;
        stroke-dasharray: 14 10;
        filter: drop-shadow(0 0 13px currentColor);
      }
      .mg-trap {
        fill: rgba(244,63,94,0.9);
        stroke: rgba(255,255,255,0.42);
        stroke-width: 1;
        filter: drop-shadow(0 14px 26px rgba(244,63,94,0.36));
      }
      .mg-panel[data-size="micro"] {
        gap: 7px;
        padding: 7px;
      }
      .mg-panel[data-size="micro"] .mg-card {
        padding: 8px;
        border-radius: 10px;
      }
      .mg-panel[data-size="micro"] .mg-less {
        opacity: 0.92;
      }
      .mg-panel[data-size="micro"] .mg-btn {
        min-height: 42px;
        font-size: 11px;
      }
      .mg-panel[data-size="micro"] .mg-row {
        grid-template-columns: 48px minmax(0, 1fr) 38px;
      }
      .mg-panel[data-size="micro"] .mg-formula {
        font-size: 14px;
        padding: 6px 8px;
      }
      .mg-panel[data-size="micro"] .mg-step {
        padding: 6px 8px;
        font-size: 10px;
        line-height: 1.28;
      }
      .mg-panel[data-size="compact"] .mg-less-compact {
        opacity: 0.92;
      }
    `;
    document.head.appendChild(style);
  }

  function fitPanel(panel) {
    if (!panel) return;
    const height = panel.getBoundingClientRect().height || 0;
    let size = height < 480 ? "micro" : height < 620 ? "compact" : "normal";
    panel.dataset.size = size;
    if (panel.scrollHeight > panel.clientHeight + 1 && size === "normal") {
      size = "compact";
      panel.dataset.size = size;
    }
    if (panel.scrollHeight > panel.clientHeight + 1 && size !== "micro") {
      panel.dataset.size = "micro";
    }
  }

  function createBase(container, context, theme = "cyan") {
    ensureStyle();
    if (container.__mathGeometryCleanup) {
      container.__mathGeometryCleanup();
      delete container.__mathGeometryCleanup;
    }
    const panelHost = context.externalPanel || null;
    container.innerHTML = "";
    if (panelHost) panelHost.innerHTML = "";

    const scene = document.createElement("div");
    scene.className = "mg-scene";
    scene.dataset.theme = theme;
    const svg = svgEl("svg", { class: "mg-svg", "aria-hidden": "true" });
    const hud = document.createElement("div");
    hud.className = "mg-hud";
    hud.innerHTML = `
      <div class="mg-stat"><div class="mg-stat-label" data-hud-a-label></div><div class="mg-stat-value" data-hud-a></div></div>
      <div class="mg-stat"><div class="mg-stat-label" data-hud-b-label></div><div class="mg-stat-value" data-hud-b></div></div>
      <div class="mg-stat"><div class="mg-stat-label" data-hud-c-label></div><div class="mg-stat-value" data-hud-c></div></div>
    `;
    scene.append(svg, hud);
    container.appendChild(scene);

    let panel = null;
    if (panelHost) {
      panel = document.createElement("div");
      panel.className = "mg-panel";
      panelHost.appendChild(panel);
    }

    const api = {
      container,
      context,
      scene,
      svg,
      panel,
      panelHost,
      hud,
      view: { width: 0, height: 0, cx: 0, cy: 0, zoom: 1, panX: 0, panY: 0 },
      listeners: [],
      timers: [],
      resizeObserver: null,
      draw: null,
      on(target, type, handler, options) {
        if (!target) return;
        target.addEventListener(type, handler, options);
        api.listeners.push([target, type, handler, options]);
      },
      setHud(aLabel, aValue, bLabel, bValue, cLabel, cValue) {
        hud.querySelector("[data-hud-a-label]").textContent = aLabel;
        hud.querySelector("[data-hud-a]").textContent = aValue;
        hud.querySelector("[data-hud-b-label]").textContent = bLabel;
        hud.querySelector("[data-hud-b]").textContent = bValue;
        hud.querySelector("[data-hud-c-label]").textContent = cLabel;
        hud.querySelector("[data-hud-c]").textContent = cValue;
      },
      refresh() {
        const rect = svg.getBoundingClientRect();
        const baseWidth = Math.max(320, rect.width || container.getBoundingClientRect().width || 320);
        const baseHeight = Math.max(240, rect.height || container.getBoundingClientRect().height || 240);
        const zoom = clamp(Number(api.view.zoom) || 1, 0.72, 2.4);
        api.view.zoom = zoom;
        api.view.width = baseWidth;
        api.view.height = baseHeight;
        api.view.cx = api.view.width / 2;
        api.view.cy = api.view.height / 2;
        const panLimitX = baseWidth * Math.max(0.18, (zoom - 1) * 0.62 + 0.18);
        const panLimitY = baseHeight * Math.max(0.18, (zoom - 1) * 0.62 + 0.18);
        api.view.panX = clamp(Number(api.view.panX) || 0, -panLimitX, panLimitX);
        api.view.panY = clamp(Number(api.view.panY) || 0, -panLimitY, panLimitY);
        const viewWidth = baseWidth / zoom;
        const viewHeight = baseHeight / zoom;
        svg.setAttribute("viewBox", `${(baseWidth - viewWidth) / 2 - api.view.panX} ${(baseHeight - viewHeight) / 2 - api.view.panY} ${viewWidth} ${viewHeight}`);
        fitPanel(panel);
        if (api.draw) api.draw();
      },
      destroy() {
        api.listeners.forEach(([target, type, handler, options]) => target.removeEventListener(type, handler, options));
        api.listeners = [];
        api.timers.forEach(id => {
          cancelAnimationFrame(id);
          clearInterval(id);
          clearTimeout(id);
        });
        api.timers = [];
        if (api.resizeObserver) api.resizeObserver.disconnect();
        container.innerHTML = "";
        if (panelHost) panelHost.innerHTML = "";
      }
    };

    const resize = () => api.refresh();
    const blockNativeMenu = event => event.preventDefault();
    [scene, svg, panel].filter(Boolean).forEach(target => {
      target.setAttribute?.("draggable", "false");
      ["contextmenu", "selectstart", "dragstart"].forEach(type => api.on(target, type, blockNativeMenu, false));
    });
    if (typeof ResizeObserver === "function") {
      api.resizeObserver = new ResizeObserver(resize);
      api.resizeObserver.observe(container);
      if (panelHost) api.resizeObserver.observe(panelHost);
    } else {
      api.on(window, "resize", resize);
    }
    container.__mathGeometryCleanup = api.destroy;
    requestAnimationFrame(resize);
    return api;
  }

  function setActiveButtons(panel, selector, value) {
    panel?.querySelectorAll(selector).forEach(button => {
      const target = String(value);
      button.classList.toggle(
        "active",
        button.dataset.value === target || button.dataset.mode === target || button.dataset.preset === target
      );
    });
  }

  function setupViewZoomControls(api) {
    if (!api || api.scene.querySelector(".mg-zoom-tools")) return;
    const tools = document.createElement("div");
    tools.className = "mg-zoom-tools";
    tools.innerHTML = `
      <button type="button" data-mg-zoom="out" aria-label="缩小">-</button>
      <button type="button" data-mg-zoom="reset" aria-label="重置缩放">100%</button>
      <button type="button" data-mg-zoom="in" aria-label="放大">+</button>
      <span data-mg-zoom-label>缩放 100%</span>
    `;
    api.scene.appendChild(tools);
    const label = tools.querySelector("[data-mg-zoom-label]");
    const resetButton = tools.querySelector('[data-mg-zoom="reset"]');
    const getMetrics = (zoom = api.view.zoom, panX = api.view.panX, panY = api.view.panY) => {
      const rect = api.svg.getBoundingClientRect();
      const baseWidth = Math.max(320, rect.width || api.container.getBoundingClientRect().width || 320);
      const baseHeight = Math.max(240, rect.height || api.container.getBoundingClientRect().height || 240);
      const safeZoom = clamp(Number(zoom) || 1, 0.72, 2.4);
      const viewWidth = baseWidth / safeZoom;
      const viewHeight = baseHeight / safeZoom;
      return {
        baseWidth,
        baseHeight,
        zoom: safeZoom,
        viewWidth,
        viewHeight,
        x: (baseWidth - viewWidth) / 2 - (Number(panX) || 0),
        y: (baseHeight - viewHeight) / 2 - (Number(panY) || 0)
      };
    };
    const clampPan = () => {
      const metrics = getMetrics(api.view.zoom, 0, 0);
      const panLimitX = metrics.baseWidth * Math.max(0.18, (metrics.zoom - 1) * 0.62 + 0.18);
      const panLimitY = metrics.baseHeight * Math.max(0.18, (metrics.zoom - 1) * 0.62 + 0.18);
      api.view.panX = clamp(Number(api.view.panX) || 0, -panLimitX, panLimitX);
      api.view.panY = clamp(Number(api.view.panY) || 0, -panLimitY, panLimitY);
    };
    const syncZoomLabel = () => {
      const pct = Math.round(api.view.zoom * 100) + "%";
      if (label) label.textContent = "缩放 " + pct;
      if (resetButton) resetButton.textContent = pct;
    };
    const applyZoom = (value, focus = null, resetPan = false) => {
      const current = getMetrics();
      const nextZoom = clamp(Number(value) || 1, 0.72, 2.4);
      if (resetPan) {
        api.view.panX = 0;
        api.view.panY = 0;
      } else if (focus) {
        const box = api.svg.getBoundingClientRect();
        const fx = clamp((focus.clientX - box.left) / Math.max(1, box.width), 0, 1);
        const fy = clamp((focus.clientY - box.top) / Math.max(1, box.height), 0, 1);
        const worldX = current.x + fx * current.viewWidth;
        const worldY = current.y + fy * current.viewHeight;
        const nextWidth = current.baseWidth / nextZoom;
        const nextHeight = current.baseHeight / nextZoom;
        api.view.panX = (current.baseWidth - nextWidth) / 2 - (worldX - fx * nextWidth);
        api.view.panY = (current.baseHeight - nextHeight) / 2 - (worldY - fy * nextHeight);
      }
      api.view.zoom = nextZoom;
      clampPan();
      syncZoomLabel();
      api.refresh();
    };
    const applyPan = (dx, dy) => {
      const zoom = clamp(Number(api.view.zoom) || 1, 0.72, 2.4);
      api.view.panX = (Number(api.view.panX) || 0) + dx / zoom;
      api.view.panY = (Number(api.view.panY) || 0) + dy / zoom;
      clampPan();
      api.refresh();
    };
    const onClick = event => {
      const button = event.target.closest("[data-mg-zoom]");
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      const action = button.dataset.mgZoom;
      if (action === "in") applyZoom(api.view.zoom * 1.15);
      else if (action === "out") applyZoom(api.view.zoom / 1.15);
      else applyZoom(1, null, true);
    };
    const onWheel = event => {
      if (event.target.closest(".mg-zoom-tools")) return;
      event.preventDefault();
      applyZoom(api.view.zoom * (event.deltaY < 0 ? 1.12 : 0.88), event);
    };
    const pinch = {
      pointers: new Map(),
      startDistance: 0,
      startZoom: 1,
      lastMid: null,
      panId: 0,
      lastPan: null,
      moved: false
    };
    const distance = () => {
      const list = Array.from(pinch.pointers.values());
      return list.length >= 2 ? Math.hypot(list[0].x - list[1].x, list[0].y - list[1].y) : 0;
    };
    const midpoint = () => {
      const list = Array.from(pinch.pointers.values());
      if (list.length < 2) return null;
      return {
        clientX: (list[0].x + list[1].x) / 2,
        clientY: (list[0].y + list[1].y) / 2
      };
    };
    const startPinch = () => {
      const nextDistance = distance();
      if (!nextDistance) return;
      pinch.startDistance = nextDistance;
      pinch.startZoom = api.view.zoom;
      pinch.lastMid = midpoint();
    };
    const onPointerDown = event => {
      if (event.target.closest(".mg-zoom-tools")) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      pinch.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      api.svg.setPointerCapture?.(event.pointerId);
      if (pinch.pointers.size >= 2) {
        startPinch();
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      pinch.panId = event.pointerId;
      pinch.lastPan = { x: event.clientX, y: event.clientY };
      pinch.moved = false;
    };
    const onPointerMove = event => {
      if (!pinch.pointers.has(event.pointerId)) return;
      pinch.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pinch.pointers.size >= 2 && pinch.startDistance) {
        const mid = midpoint();
        if (mid && pinch.lastMid) applyPan(mid.clientX - pinch.lastMid.clientX, mid.clientY - pinch.lastMid.clientY);
        applyZoom(pinch.startZoom * (Math.max(1, distance()) / pinch.startDistance), mid || event);
        pinch.lastMid = mid;
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (pinch.panId !== event.pointerId || !pinch.lastPan) return;
      const dx = event.clientX - pinch.lastPan.x;
      const dy = event.clientY - pinch.lastPan.y;
      pinch.lastPan = { x: event.clientX, y: event.clientY };
      if (Math.hypot(dx, dy) < 0.4 && !pinch.moved) return;
      pinch.moved = true;
      api.scene.classList.add("is-panning");
      applyPan(dx, dy);
      event.preventDefault();
      event.stopPropagation();
    };
    const onPointerUp = event => {
      pinch.pointers.delete(event.pointerId);
      api.svg.releasePointerCapture?.(event.pointerId);
      if (pinch.pointers.size >= 2) startPinch();
      else {
        pinch.startDistance = 0;
        pinch.lastMid = null;
        pinch.panId = 0;
        pinch.lastPan = null;
        pinch.moved = false;
        api.scene.classList.remove("is-panning");
      }
    };
    const stopTools = event => event.stopPropagation();
    api.on(tools, "click", onClick, false);
    api.on(api.scene, "wheel", onWheel, { passive: false });
    api.on(api.svg, "pointerdown", onPointerDown, { passive: false, capture: true });
    api.on(api.svg, "pointermove", onPointerMove, { passive: false, capture: true });
    api.on(api.svg, "pointerup", onPointerUp, true);
    api.on(api.svg, "pointercancel", onPointerUp, true);
    ["pointerdown", "pointermove", "touchstart", "touchmove", "mousedown", "mousemove"].forEach(type => api.on(tools, type, stopTools, true));
    applyZoom(api.view.zoom || 1);
  }

  function sectorPath(cx, cy, radius, startDeg, endDeg) {
    const start = polar(cx, cy, radius, startDeg);
    const end = polar(cx, cy, radius, endDeg);
    const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${large} 0 ${end.x} ${end.y} Z`;
  }

  function polar(cx, cy, radius, deg) {
    const rad = deg * Math.PI / 180;
    return { x: cx + radius * Math.cos(rad), y: cy - radius * Math.sin(rad) };
  }

  function mountAngleIdentifier(container, context = {}) {
    const api = createBase(container, context, "cyan");
    const COLOR = {
      top: "#22d3ee",
      bottom: "#f472b6",
      third: "#facc15",
      fourth: "#a78bfa",
      scanCor: "#22d3ee",
      scanAlt: "#facc15",
      scanCon: "#a855f7",
      trap: "#f43f5e"
    };

    const presets = {
      hash: [
        { p1: { x: -300, y: -100 }, p2: { x: 300, y: -100 } },
        { p1: { x: -300, y: 150 }, p2: { x: 300, y: 150 } },
        { p1: { x: -100, y: -250 }, p2: { x: -250, y: 300 } },
        { p1: { x: 150, y: -250 }, p2: { x: 250, y: 300 } }
      ],
      standard: [
        { p1: { x: -300, y: -100 }, p2: { x: 300, y: -100 } },
        { p1: { x: -300, y: 150 }, p2: { x: 300, y: 150 } },
        { p1: { x: 100, y: -250 }, p2: { x: -100, y: 300 } },
        { p1: { x: -2000, y: 2000 }, p2: { x: -1900, y: 2000 } }
      ],
      ashape: [
        { p1: { x: -300, y: -50 }, p2: { x: 300, y: -50 } },
        { p1: { x: -300, y: 150 }, p2: { x: 300, y: 150 } },
        { p1: { x: -200, y: 250 }, p2: { x: 100, y: -250 } },
        { p1: { x: 200, y: 250 }, p2: { x: -100, y: -250 } }
      ],
      zbend: [
        { p1: { x: -300, y: -100 }, p2: { x: 100, y: -100 } },
        { p1: { x: -100, y: 200 }, p2: { x: 300, y: 200 } },
        { p1: { x: 50, y: -200 }, p2: { x: -50, y: 300 } },
        { p1: { x: -2000, y: 2000 }, p2: { x: -1900, y: 2000 } }
      ]
    };

    const relationPairs = {
      cor: [[1, 5], [2, 6], [3, 7], [4, 8]],
      alt: [[3, 6], [4, 5]],
      con: [[3, 5], [4, 6]]
    };
    const relationLabel = { cor: "同位角", alt: "内错角", con: "同旁内角" };
    const relationTone = { cor: COLOR.scanCor, alt: COLOR.scanAlt, con: COLOR.scanCon };
    const state = {
      preset: "hash",
      lines: clonePreset("hash"),
      parallel: true,
      radar: false,
      degrees: false,
      selectedIds: [],
      dragging: null,
      radarOriginId: null,
      scanCount: 0,
      alert: "",
      alertTimer: 0,
      animId: 0
    };

    api.panel.innerHTML = `
      <div class="mg-card">
        <div class="mg-grid two">
          <button class="mg-btn active" type="button" data-preset="hash">标准井字</button>
          <button class="mg-btn" type="button" data-preset="standard">经典三线</button>
          <button class="mg-btn" type="button" data-preset="ashape">A 字型</button>
          <button class="mg-btn" type="button" data-preset="zbend">Z 字型</button>
        </div>
      </div>
      <div class="mg-card">
        <div class="mg-grid three">
          <button class="mg-btn active" type="button" data-toggle="radar">关系雷达</button>
          <button class="mg-btn active" type="button" data-toggle="parallel">强制 L1 // L2</button>
          <button class="mg-btn" type="button" data-toggle="degrees">显示度数</button>
        </div>
      </div>
      <div class="mg-card">
        <div class="mg-readout">
          <div class="mg-readout-row"><span>左上角</span><strong data-slot-1>未选择</strong></div>
          <div class="mg-readout-row"><span>右下角</span><strong data-slot-2>未选择</strong></div>
          <div class="mg-readout-row"><span>扫描结果</span><strong data-scan-result>等待点击角</strong></div>
        </div>
        <div class="mg-verdict" data-verdict style="margin-top:8px;">点选两个角，系统会自动判断关系。</div>
      </div>
      <div class="mg-card">
        <div class="mg-grid two">
          <button class="mg-btn" type="button" data-clear>清空选择</button>
          <button class="mg-btn warn" type="button" data-reset>重置扫描器</button>
        </div>
      </div>
    `;

    const refs = {
      slot1: api.panel.querySelector("[data-slot-1]"),
      slot2: api.panel.querySelector("[data-slot-2]"),
      scanResult: api.panel.querySelector("[data-scan-result]"),
      verdict: api.panel.querySelector("[data-verdict]")
    };

    function clonePreset(key) {
      return presets[key].map((line, index) => ({
        id: `L${index + 1}`,
        p1: { x: line.p1.x, y: line.p1.y },
        p2: { x: line.p2.x, y: line.p2.y },
        color: [COLOR.top, COLOR.bottom, COLOR.third, COLOR.fourth][index]
      }));
    }

    function clampValue(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function vec(a, b) {
      return { x: b.x - a.x, y: b.y - a.y };
    }

    function normalize(v) {
      const len = Math.hypot(v.x, v.y) || 1;
      return { x: v.x / len, y: v.y / len };
    }

    function dot(a, b) {
      return a.x * b.x + a.y * b.y;
    }

    function cross(a, b) {
      return a.x * b.y - a.y * b.x;
    }

    function isParallel(a, b) {
      return Math.abs(cross(a, b)) < 0.05;
    }

    function midpoint(line) {
      return { x: (line.p1.x + line.p2.x) / 2, y: (line.p1.y + line.p2.y) / 2 };
    }

    function lineVector(line) {
      return normalize(vec(line.p1, line.p2));
    }

    function getScale() {
      const { width, height } = api.view;
      return Math.max(0.62, Math.min(width / 960, height / 680, 1.05));
    }

    function toScreen(point) {
      const scale = getScale();
      return {
        x: api.view.cx + point.x * scale,
        y: api.view.cy + point.y * scale
      };
    }

    function toLogic(clientX, clientY) {
      const rect = api.svg.getBoundingClientRect();
      const scale = getScale();
      return {
        x: (clientX - rect.left - api.view.cx) / scale,
        y: (clientY - rect.top - api.view.cy) / scale
      };
    }

    function segmentIntersection(a, b) {
      const p = a.p1;
      const r = vec(a.p1, a.p2);
      const q = b.p1;
      const s = vec(b.p1, b.p2);
      const denom = cross(r, s);
      if (Math.abs(denom) < 1e-6) return null;
      const qmp = vec(p, q);
      const t = cross(qmp, s) / denom;
      return { x: p.x + t * r.x, y: p.y + t * r.y };
    }

    function samePoint(a, b) {
      return Math.hypot(a.x - b.x, a.y - b.y) < 0.01;
    }

    function samePair(pair, a, b) {
      return pair.includes(a) && pair.includes(b);
    }

    function relationOf(a, b, relationPairs) {
      return Object.keys(relationPairs).find(key => relationPairs[key].some(pair => samePair(pair, a, b))) || "";
    }

    function computeRelationAngles(angles, relationPairs, originId) {
      const result = [];
      if (!originId) return result;
      const target = angles.find(angle => angle.id === originId);
      if (!target) return result;
      angles.forEach(angle => {
        if (angle.id === target.id) return;
        const res = relationOf(target.id, angle.id, relationPairs);
        if (res === "cor" || res === "alt" || res === "con") {
          result.push({ angle, type: res });
        }
      });
      return result;
    }

    function sectorPath(cx, cy, radius, startRad, endRad) {
      let a = startRad;
      let b = endRad;
      while (b < a) b += Math.PI * 2;
      const large = (b - a) > Math.PI ? 1 : 0;
      const start = { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
      const end = { x: cx + radius * Math.cos(b), y: cy + radius * Math.sin(b) };
      return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${large} 1 ${end.x} ${end.y} Z`;
    }

    function normalizeAngle(rad) {
      let value = rad;
      while (value < 0) value += Math.PI * 2;
      while (value >= Math.PI * 2) value -= Math.PI * 2;
      return value;
    }

    function selectAngle(id) {
      if (state.radar) {
        state.selectedIds = [id];
        state.radarOriginId = id;
        state.scanCount = 0;
      } else if (state.selectedIds.includes(id)) {
        state.selectedIds = state.selectedIds.filter(item => item !== id);
      } else {
        if (state.selectedIds.length >= 2) state.selectedIds = [];
        state.selectedIds = [...state.selectedIds, id];
      }
      if (!state.radar && state.selectedIds.length === 2) {
        const [a, b] = state.selectedIds;
        const actual = relationOf(a, b, relationPairs);
        if (!actual) showAlert("陷阱警报：这组角没有公共截线");
      }
      update();
    }

    function showAlert(text) {
      state.alert = text;
      if (state.alertTimer) {
        clearTimeout(state.alertTimer);
      }
      state.alertTimer = window.setTimeout(() => {
        state.alert = "";
        state.alertTimer = 0;
        update();
      }, 1600);
      if (!api.timers.includes(state.alertTimer)) api.timers.push(state.alertTimer);
    }

    function transitionPreset(key) {
      if (state.animId) cancelAnimationFrame(state.animId);
      const start = state.lines.map(line => ({
        id: line.id,
        color: line.color,
        p1: { x: line.p1.x, y: line.p1.y },
        p2: { x: line.p2.x, y: line.p2.y }
      }));
      const end = clonePreset(key);
      state.preset = key;
      let progress = 0;
      const step = () => {
        progress = clampValue(progress + 0.06, 0, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        state.lines = start.map((line, index) => ({
          id: line.id,
          color: line.color,
          p1: {
            x: line.p1.x + (end[index].p1.x - line.p1.x) * ease,
            y: line.p1.y + (end[index].p1.y - line.p1.y) * ease
          },
          p2: {
            x: line.p2.x + (end[index].p2.x - line.p2.x) * ease,
            y: line.p2.y + (end[index].p2.y - line.p2.y) * ease
          }
        }));
        enforceParallel();
        draw();
        if (progress < 1) {
          state.animId = requestAnimationFrame(step);
          api.timers.push(state.animId);
        } else {
          state.animId = 0;
        }
      };
      state.selectedIds = [];
      state.radarOriginId = null;
      step();
    }

    function enforceParallel() {
      if (!state.parallel || state.lines.length < 2) return;
      const base = state.lines[0];
      const follow = state.lines[1];
      const vector = vec(base.p1, base.p2);
      const center = midpoint(follow);
      follow.p1 = { x: center.x - vector.x / 2, y: center.y - vector.y / 2 };
      follow.p2 = { x: center.x + vector.x / 2, y: center.y + vector.y / 2 };
    }

    function computeAngles() {
      const angles = [];
      let id = 1;
      for (let i = 0; i < state.lines.length; i += 1) {
        for (let j = i + 1; j < state.lines.length; j += 1) {
          const lineA = state.lines[i];
          const lineB = state.lines[j];
          const intersection = segmentIntersection(lineA, lineB);
          if (!intersection) continue;
          const screen = toScreen(intersection);
          if (screen.x < -120 || screen.x > api.view.width + 120 || screen.y < -120 || screen.y > api.view.height + 120) continue;
          const vA = lineVector(lineA);
          const vB = lineVector(lineB);
          const rays = [
            { line: lineA, v: vA, rad: Math.atan2(vA.y, vA.x) },
            { line: lineA, v: { x: -vA.x, y: -vA.y }, rad: Math.atan2(-vA.y, -vA.x) },
            { line: lineB, v: vB, rad: Math.atan2(vB.y, vB.x) },
            { line: lineB, v: { x: -vB.x, y: -vB.y }, rad: Math.atan2(-vB.y, -vB.x) }
          ].sort((a, b) => a.rad - b.rad);
          for (let k = 0; k < 4; k += 1) {
            const r1 = rays[k];
            const r2 = rays[(k + 1) % 4];
            let deg = Math.abs(r2.rad - r1.rad) * 180 / Math.PI;
            if (deg > 180) deg = 360 - deg;
            angles.push({
              id,
              vtx: screen,
              lines: [r1.line, r2.line],
              rays: [r1.v, r2.v],
              r1,
              r2,
              degree: deg
            });
            id += 1;
          }
        }
      }
      return angles;
    }

    function updatePanel(angles) {
      setActiveButtons(api.panel, "[data-preset]", state.preset);
      const radarBtn = api.panel.querySelector('[data-toggle="radar"]');
      const parallelBtn = api.panel.querySelector('[data-toggle="parallel"]');
      const degreeBtn = api.panel.querySelector('[data-toggle="degrees"]');
      radarBtn?.classList.toggle("active", state.radar);
      parallelBtn?.classList.toggle("active", state.parallel);
      degreeBtn?.classList.toggle("active", state.degrees);

      const first = state.selectedIds[0] || null;
      const second = state.selectedIds[1] || null;
      refs.slot1.textContent = first ? `∠${first}` : "未选择";
      refs.slot2.textContent = state.radar ? (first ? "雷达扫描" : "等待点击") : (second ? `∠${second}` : "未选择");

      if (state.radar && first) {
        const hits = computeRelationAngles(angles, relationPairs, first);
        state.scanCount = hits.length;
        refs.scanResult.textContent = hits.length ? `找到 ${hits.length} 组` : "暂无特殊关系";
        refs.verdict.className = `mg-verdict ${hits.length ? "good" : "warn"}`;
        refs.verdict.textContent = hits.length ? `已启动雷达：∠${first} 共捕获 ${hits.length} 组同位角、内错角或同旁内角。` : `∠${first} 没有可直接归类的对应角。`;
        return;
      }

      if (state.selectedIds.length < 2) {
        refs.scanResult.textContent = "等待点击角";
        refs.verdict.className = "mg-verdict";
        refs.verdict.textContent = "点选两个角，系统会判断它们的关系。";
        return;
      }

      const [a, b] = state.selectedIds;
      const actual = relationOf(a, b, relationPairs);
      refs.scanResult.textContent = actual ? relationLabel[actual] : "无特定关系";
      refs.verdict.className = `mg-verdict ${actual ? "good" : "warn"}`;
      if (!actual) {
        refs.verdict.textContent = `∠${a} 与 ∠${b} 不是这组典型关系。`;
      } else {
        refs.verdict.textContent = `判断结果：这是 ${relationLabel[actual]}。`;
      }
    }

    function drawAngles(svg, angles, relationHighlights) {
      const scale = getScale();
      angles.forEach(angle => {
        const selected = state.selectedIds.includes(angle.id);
        const radarHit = relationHighlights.find(item => item.angle.id === angle.id);
        const fillColor = selected ? "#facc15" : radarHit ? relationTone[radarHit.type] : "#94a3b8";
        const group = svgEl("g", { class: "mg-hit", "data-angle": angle.id });
        const sector = svgEl("path", {
          d: sectorPath(angle.vtx.x, angle.vtx.y, Math.max(26, 54 * scale), normalizeAngle(angle.r1.rad), normalizeAngle(angle.r2.rad)),
          class: `mg-angle-sector ${selected ? "active" : ""} ${radarHit ? "scan" : ""}`,
          fill: fillColor
        });
        const mid = normalizeAngle((normalizeAngle(angle.r1.rad) + normalizeAngle(angle.r2.rad)) / 2);
        const labelRadius = Math.max(30, 72 * scale);
        const label = svgEl("text", {
          x: angle.vtx.x + Math.cos(mid) * labelRadius,
          y: angle.vtx.y + Math.sin(mid) * labelRadius,
          class: "mg-label"
        });
        label.textContent = `∠${angle.id}`;
        if (state.degrees) {
          const deg = svgEl("text", {
            x: angle.vtx.x + Math.cos(mid) * (labelRadius + 18),
            y: angle.vtx.y + Math.sin(mid) * (labelRadius + 18),
            class: "mg-small-label"
          });
          deg.textContent = `${angle.degree.toFixed(1)}°`;
          group.append(sector, label, deg);
        } else {
          group.append(sector, label);
        }
        svg.appendChild(group);
      });
    }

    function drawControls(svg) {
      state.lines.forEach((line, index) => {
        [line.p1, line.p2].forEach((point, pointIndex) => {
          const screen = toScreen(point);
          const dot = svgEl("circle", {
            cx: screen.x,
            cy: screen.y,
            r: 7.2,
            class: "mg-control-dot",
            "data-control": `${index}:${pointIndex}`,
            fill: line.color,
            stroke: line.color
          });
          svg.appendChild(dot);
        });
      });
    }

    function drawTraces(svg, relationHighlights) {
      relationHighlights.forEach(({ angle, type }) => {
        const center = angle.vtx;
        const radius = 64;
        const path = svgEl("path", {
          d: sectorPath(center.x, center.y, radius, normalizeAngle(angle.r1.rad), normalizeAngle(angle.r2.rad)),
          class: "mg-trace",
          stroke: relationTone[type]
        });
        svg.appendChild(path);
      });
    }

    function drawTrap(svg) {
      if (!state.alert) return;
      const x = api.view.cx;
      const y = 34;
      const box = svgEl("rect", { x: x - 150, y: y - 22, width: 300, height: 44, rx: 12, class: "mg-trap" });
      const text = svgEl("text", {
        x,
        y: y + 6,
        fill: "#fff",
        "text-anchor": "middle",
        "dominant-baseline": "middle",
        "font-size": "16",
        "font-weight": "950"
      });
      text.textContent = state.alert;
      svg.append(box, text);
    }

    function drawLines(svg) {
      state.lines.forEach(line => {
        const p1 = toScreen(line.p1);
        const p2 = toScreen(line.p2);
        const vector = { x: p2.x - p1.x, y: p2.y - p1.y };
        const extend = 120;
        const start = { x: p1.x - vector.x * extend, y: p1.y - vector.y * extend };
        const end = { x: p2.x + vector.x * extend, y: p2.y + vector.y * extend };
        const el = lineEl(start.x, start.y, end.x, end.y, "mg-line", { stroke: line.color, "stroke-width": 6 });
        svg.appendChild(el);
      });
    }

    function lineEl(x1, y1, x2, y2, className, attrs = {}) {
      return svgEl("line", { x1, y1, x2, y2, class: className, ...attrs });
    }

    function draw() {
      const { svg, view } = api;
      clear(svg);
      api.setHud("图元", state.preset, "模式", state.radar ? "雷达" : state.parallel ? "平行" : "自由", "状态", state.degrees ? "显示度数" : "标准");
      enforceParallel();
      const angles = computeAngles();
      state.angles = angles;
      const relationPairs = {
        cor: [[1, 5], [2, 6], [3, 7], [4, 8]],
        alt: [[3, 6], [4, 5]],
        con: [[3, 5], [4, 6]]
      };
      const relationHighlights = state.radar && state.selectedIds[0]
        ? computeRelationAngles(angles, relationPairs, state.selectedIds[0])
        : [];

      drawLines(svg);
      drawTraces(svg, relationHighlights);
      drawAngles(svg, angles, relationHighlights);
      drawControls(svg);
      drawTrap(svg);

      const labelA = toScreen({ x: -360, y: -220 });
      const labelB = toScreen({ x: -360, y: 220 });
      const labelC = toScreen({ x: -60, y: -260 });
      pointText(svg, labelA.x, labelA.y, "a", "mg-label");
      pointText(svg, labelB.x, labelB.y, "b", "mg-label");
      pointText(svg, labelC.x, labelC.y, "c", "mg-label");

      updatePanel(angles);
    }

    api.draw = draw;

    api.on(api.panel, "click", event => {
      const presetBtn = event.target.closest("[data-preset]");
      if (presetBtn) {
        if (presetBtn.dataset.preset !== state.preset) {
          transitionPreset(presetBtn.dataset.preset);
        }
        return;
      }
      if (event.target.closest('[data-toggle="radar"]')) {
        state.radar = !state.radar;
        if (state.radar) {
          state.selectedIds = state.selectedIds.slice(0, 1);
          state.radarOriginId = state.selectedIds[0] || null;
        }
        update();
        return;
      }
      if (event.target.closest('[data-toggle="parallel"]')) {
        state.parallel = !state.parallel;
        if (state.parallel) {
          state.lines = clonePreset(state.preset);
          const base = state.lines[0];
          const follow = state.lines[1];
          const vector = vec(base.p1, base.p2);
          const center = midpoint(follow);
          follow.p1 = { x: center.x - vector.x / 2, y: center.y - vector.y / 2 };
          follow.p2 = { x: center.x + vector.x / 2, y: center.y + vector.y / 2 };
        }
        update();
        return;
      }
      if (event.target.closest('[data-toggle="degrees"]')) {
        state.degrees = !state.degrees;
        update();
        return;
      }
      if (event.target.closest("[data-clear]")) {
        state.selectedIds = [];
        state.radarOriginId = null;
        state.scanCount = 0;
        update();
        return;
      }
      if (event.target.closest("[data-reset]")) {
        state.lines = clonePreset("hash");
        state.preset = "hash";
        state.parallel = true;
        state.radar = false;
        state.degrees = false;
        state.selectedIds = [];
        state.radarOriginId = null;
        state.scanCount = 0;
        state.alert = "";
        update();
      }
    });

    api.on(api.svg, "click", event => {
      const target = event.target.closest("[data-angle]");
      if (!target) return;
      selectAngle(Number(target.dataset.angle));
    });

    api.on(api.svg, "pointerdown", event => {
      const control = event.target.closest("[data-control]");
      if (!control) return;
      const [lineIndex, pointIndex] = control.dataset.control.split(":").map(Number);
      const line = state.lines[lineIndex];
      if (!line) return;
      state.dragging = { lineIndex, pointIndex };
      api.svg.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    });

    api.on(api.svg, "pointermove", event => {
      if (!state.dragging) return;
      const { lineIndex, pointIndex } = state.dragging;
      const point = toLogic(event.clientX, event.clientY);
      const line = state.lines[lineIndex];
      if (!line) return;
      if (pointIndex === 0) line.p1 = point;
      else line.p2 = point;
      if (state.parallel && lineIndex === 0) {
        const baseVector = vec(line.p1, line.p2);
        const follow = state.lines[1];
        const center = midpoint(follow);
        follow.p1 = { x: center.x - baseVector.x / 2, y: center.y - baseVector.y / 2 };
        follow.p2 = { x: center.x + baseVector.x / 2, y: center.y + baseVector.y / 2 };
      }
      update();
    });

    api.on(api.svg, "pointerup", event => {
      if (!state.dragging) return;
      api.svg.releasePointerCapture?.(event.pointerId);
      state.dragging = null;
    });

    api.on(api.svg, "pointercancel", event => {
      if (!state.dragging) return;
      api.svg.releasePointerCapture?.(event.pointerId);
      state.dragging = null;
    });

    function update() {
      api.refresh();
    }

    update();
  }

  function mountSquarePuzzle(container, context = {}) {
    const api = createBase(container, context, "gold");
    const state = { a: 4, b: 3, split: 0.12, mode: "assemble" };
    api.panel.innerHTML = `
      <div class="mg-card">
        <div class="mg-grid three">
          <button class="mg-btn active" type="button" data-mode="assemble">拼合</button>
          <button class="mg-btn" type="button" data-mode="split">拆分</button>
          <button class="mg-btn" type="button" data-mode="verify">验算</button>
        </div>
      </div>
      <div class="mg-card">
        <div class="mg-row"><span>a</span><input class="mg-range" type="range" min="2" max="8" step="0.5" value="4" data-a><span class="mg-value" data-a-val>4</span></div>
        <div class="mg-row"><span>b</span><input class="mg-range" type="range" min="1" max="7" step="0.5" value="3" data-b><span class="mg-value" data-b-val>3</span></div>
        <div class="mg-row"><span>展开</span><input class="mg-range" type="range" min="0" max="1" step="0.01" value="0.12" data-split><span class="mg-value" data-split-val>12%</span></div>
      </div>
      <div class="mg-card">
        <div class="mg-readout">
          <div class="mg-readout-row"><span>(a+b)²</span><strong data-total>49</strong></div>
          <div class="mg-readout-row"><span>a²+2ab+b²</span><strong data-sum>49</strong></div>
          <div class="mg-readout-row"><span>拼图块</span><strong>a² / ab / ab / b²</strong></div>
        </div>
      </div>
      <div class="mg-card mg-less">
        <div class="mg-meter"><div class="mg-fill gold" data-fill></div></div>
        <div class="mg-verdict good" data-verdict style="margin-top:8px;">四块面积正好填满边长 a+b 的正方形。</div>
      </div>
    `;
    const refs = {
      a: api.panel.querySelector("[data-a]"),
      b: api.panel.querySelector("[data-b]"),
      split: api.panel.querySelector("[data-split]"),
      aVal: api.panel.querySelector("[data-a-val]"),
      bVal: api.panel.querySelector("[data-b-val]"),
      splitVal: api.panel.querySelector("[data-split-val]"),
      total: api.panel.querySelector("[data-total]"),
      sum: api.panel.querySelector("[data-sum]"),
      fill: api.panel.querySelector("[data-fill]"),
      verdict: api.panel.querySelector("[data-verdict]")
    };

    function setMode(mode) {
      state.mode = mode;
      if (mode === "split") state.split = 0.72;
      if (mode === "assemble") state.split = 0.08;
      if (mode === "verify") state.split = 0.34;
      update();
    }

    function updatePanel() {
      setActiveButtons(api.panel, "[data-mode]", state.mode);
      refs.a.value = String(state.a);
      refs.b.value = String(state.b);
      refs.split.value = String(state.split);
      refs.aVal.textContent = fmt(state.a);
      refs.bVal.textContent = fmt(state.b);
      refs.splitVal.textContent = `${Math.round(state.split * 100)}%`;
      const total = (state.a + state.b) ** 2;
      const sum = state.a ** 2 + 2 * state.a * state.b + state.b ** 2;
      refs.total.textContent = fmt(total);
      refs.sum.textContent = fmt(sum);
      refs.fill.style.width = `${clamp((sum / total) * 100, 0, 100)}%`;
      refs.verdict.textContent = state.mode === "verify"
        ? `${fmt(state.a)}² + 2×${fmt(state.a)}×${fmt(state.b)} + ${fmt(state.b)}² = ${fmt(total)}`
        : "拖动 a、b 或展开度，观察四块如何保持总面积不变。";
    }

    function drawPiece(svg, x, y, width, height, label, fill, cx, cy, split) {
      const center = { x: x + width / 2, y: y + height / 2 };
      const dx = (center.x - cx) * split;
      const dy = (center.y - cy) * split;
      rect(svg, x + dx, y + dy, width, height, "mg-piece", { fill, rx: 8 });
      pointText(svg, x + dx + width / 2, y + dy + height / 2, label, "mg-label");
    }

    function draw() {
      const { svg, view } = api;
      clear(svg);
      const sideUnits = state.a + state.b;
      const side = Math.min(view.width * 0.56, view.height * 0.62);
      const unit = side / sideUnits;
      const a = state.a * unit;
      const b = state.b * unit;
      const x = view.cx - side / 2;
      const y = view.cy - side / 2 + 12;
      const split = state.split * 0.42;
      rect(svg, x, y, side, side, "", { fill: "rgba(255,255,255,0.025)", stroke: "rgba(255,255,255,0.34)", "stroke-width": 3, rx: 10 });
      line(svg, x + a, y, x + a, y + side, "mg-line mg-dash", { stroke: "rgba(250,204,21,0.46)", "stroke-width": 2 });
      line(svg, x, y + a, x + side, y + a, "mg-line mg-dash", { stroke: "rgba(250,204,21,0.46)", "stroke-width": 2 });
      drawPiece(svg, x, y, a, a, "a²", "rgba(34,211,238,0.34)", view.cx, view.cy, split);
      drawPiece(svg, x + a, y, b, a, "ab", "rgba(244,114,182,0.32)", view.cx, view.cy, split);
      drawPiece(svg, x, y + a, a, b, "ab", "rgba(168,85,247,0.32)", view.cx, view.cy, split);
      drawPiece(svg, x + a, y + a, b, b, "b²", "rgba(250,204,21,0.34)", view.cx, view.cy, split);
      pointText(svg, view.cx, y - 28, `边长 a+b = ${fmt(state.a + state.b)}`, "mg-label");
      pointText(svg, x - 30, y + a / 2, "a", "mg-small-label");
      pointText(svg, x - 30, y + a + b / 2, "b", "mg-small-label");
      pointText(svg, x + a / 2, y + side + 30, "a", "mg-small-label");
      pointText(svg, x + a + b / 2, y + side + 30, "b", "mg-small-label");
      api.setHud("边长", `a+b=${fmt(state.a + state.b)}`, "总面积", fmt((state.a + state.b) ** 2), "状态", state.mode === "split" ? "拆分" : state.mode === "verify" ? "验算" : "拼合");
      updatePanel();
    }

    api.draw = draw;
    api.on(api.panel, "click", event => {
      const panelPiece = event.target.closest("[data-piece]");
      if (panelPiece) {
        state.selectedPiece = panelPiece.dataset.piece;
        state.mode = "plus";
        update();
        return;
      }
      const mode = event.target.closest("[data-mode]");
      if (mode) setMode(mode.dataset.mode);
    });
    [refs.a, refs.b, refs.split].forEach(input => {
      api.on(input, "input", event => {
        const value = Number(event.target.value);
        if (event.target === refs.a) state.a = value;
        if (event.target === refs.b) state.b = value;
        if (event.target === refs.split) state.split = value;
        update();
      });
    });
    function update() { api.refresh(); }
    update();
  }

  function mountSquarePuzzleComplete(container, context = {}) {
    const api = createBase(container, context, "gold");
    setupViewZoomControls(api);
    const state = {
      mode: "plus",
      a: 5,
      b: 2,
      plusSpread: 0,
      grid: false,
      foil: false,
      minusProgress: 1,
      diffProgress: 1,
      selectedPiece: "all",
      timer: 0
    };

    api.panel.innerHTML = `
      <div class="mg-card tight">
        <div class="mg-grid three">
          <button class="mg-btn active" type="button" data-mode="plus">和平方</button>
          <button class="mg-btn" type="button" data-mode="minus">差平方</button>
          <button class="mg-btn" type="button" data-mode="diff">平方差</button>
        </div>
      </div>
      <div class="mg-card tight">
        <div class="mg-grid two">
          <button class="mg-btn" type="button" data-toggle="grid">网格</button>
          <button class="mg-btn" type="button" data-toggle="foil">乘法分块</button>
        </div>
      </div>
      <div class="mg-card">
        <div class="mg-row"><span>a</span><input class="mg-range" type="range" min="2" max="8" step="0.5" value="5" data-a><span class="mg-value" data-a-val>5</span></div>
        <div class="mg-row"><span>b</span><input class="mg-range" type="range" min="1" max="7" step="0.5" value="2" data-b><span class="mg-value" data-b-val>2</span></div>
        <div class="mg-row" data-spread-row><span>散开</span><input class="mg-range" type="range" min="0" max="1" step="0.01" value="0" data-spread><span class="mg-value" data-spread-val>0%</span></div>
      </div>
      <div class="mg-card"><div class="mg-formula" data-formula></div></div>
      <div class="mg-card mg-less"><div class="mg-area-bars" data-bars></div></div>
      <div class="mg-card"><div class="mg-grid" data-steps></div></div>
      <div class="mg-card tight">
        <div class="mg-grid two">
          <button class="mg-btn" type="button" data-scatter>散开拼图</button>
          <button class="mg-btn good" type="button" data-assemble>一键拼合</button>
          <button class="mg-btn warn" type="button" data-play-minus>相减动画</button>
          <button class="mg-btn good" type="button" data-play-diff>翻折动画</button>
        </div>
      </div>
      <div class="mg-card mg-less">
        <div class="mg-readout">
          <div class="mg-readout-row"><span data-area-label-a></span><strong data-area-a></strong></div>
          <div class="mg-readout-row"><span data-area-label-b></span><strong data-area-b></strong></div>
          <div class="mg-readout-row"><span data-area-label-c></span><strong data-area-c></strong></div>
        </div>
      </div>
    `;

    const refs = {
      a: api.panel.querySelector("[data-a]"),
      b: api.panel.querySelector("[data-b]"),
      spread: api.panel.querySelector("[data-spread]"),
      spreadRow: api.panel.querySelector("[data-spread-row]"),
      aVal: api.panel.querySelector("[data-a-val]"),
      bVal: api.panel.querySelector("[data-b-val]"),
      spreadVal: api.panel.querySelector("[data-spread-val]"),
      formula: api.panel.querySelector("[data-formula]"),
      bars: api.panel.querySelector("[data-bars]"),
      steps: api.panel.querySelector("[data-steps]"),
      scatter: api.panel.querySelector("[data-scatter]"),
      assemble: api.panel.querySelector("[data-assemble]"),
      playMinus: api.panel.querySelector("[data-play-minus]"),
      playDiff: api.panel.querySelector("[data-play-diff]"),
      grid: api.panel.querySelector("[data-toggle='grid']"),
      foil: api.panel.querySelector("[data-toggle='foil']"),
      areaLabelA: api.panel.querySelector("[data-area-label-a]"),
      areaLabelB: api.panel.querySelector("[data-area-label-b]"),
      areaLabelC: api.panel.querySelector("[data-area-label-c]"),
      areaA: api.panel.querySelector("[data-area-a]"),
      areaB: api.panel.querySelector("[data-area-b]"),
      areaC: api.panel.querySelector("[data-area-c]")
    };

    function stopAnimation() {
      if (!state.timer) return;
      clearInterval(state.timer);
      state.timer = 0;
    }

    function setRichSvgLabel(textNode, value) {
      textNode.textContent = "";
      String(value).split("^2").forEach((part, index, list) => {
        if (part) {
          const text = svgEl("tspan");
          text.textContent = part;
          textNode.appendChild(text);
        }
        if (index < list.length - 1) {
          const sup = svgEl("tspan", { "baseline-shift": "super", "font-size": "70%" });
          sup.textContent = "2";
          textNode.appendChild(sup);
        }
      });
    }

    function drawLabel(parent, x, y, label, className = "mg-label") {
      const node = svgEl("text", { x, y, class: className });
      setRichSvgLabel(node, label);
      parent.appendChild(node);
      return node;
    }

    function drawPiece(svg, x, y, width, height, label, fill, attrs = {}) {
      const group = svgEl("g", attrs.transform ? { transform: attrs.transform } : {});
      if (attrs.key) {
        group.setAttribute("data-piece", attrs.key);
        group.setAttribute("class", "mg-piece-hit");
      }
      const radius = Math.min(8, Math.max(3, Math.min(width, height) * 0.08));
      const piece = svgEl("rect", {
        x,
        y,
        width,
        height,
        rx: radius,
        class: "mg-piece" + (attrs.hot ? " mg-piece-hot" : ""),
        fill,
        stroke: attrs.stroke || "rgba(255,255,255,0.82)",
        opacity: attrs.opacity ?? 1
      });
      group.appendChild(piece);
      drawLabel(group, x + width / 2, y + height / 2, label, Math.min(width, height) < 54 ? "mg-small-label" : "mg-label");
      svg.appendChild(group);
      return group;
    }

    function drawGrid(svg, x, y, width, height, unit) {
      if (!state.grid || unit < 10) return;
      const cols = Math.round(width / unit);
      const rows = Math.round(height / unit);
      for (let i = 1; i < cols; i += 1) {
        line(svg, x + i * unit, y, x + i * unit, y + height, "mg-line", { stroke: "rgba(255,255,255,0.16)", "stroke-width": 1 });
      }
      for (let i = 1; i < rows; i += 1) {
        line(svg, x, y + i * unit, x + width, y + i * unit, "mg-line", { stroke: "rgba(255,255,255,0.16)", "stroke-width": 1 });
      }
    }

    function drawRemovedArea(svg, x, y, width, height, label, opacity = 1, labelX = x + width / 2, labelY = y + height / 2) {
      if (opacity <= 0.02) return;
      rect(svg, x, y, width, height, "mg-removed-area", {
        rx: Math.min(8, Math.max(3, Math.min(width, height) * 0.08)),
        opacity
      });
      drawLabel(svg, labelX, labelY, label, Math.min(width, height) < 58 ? "mg-small-label" : "mg-label");
    }

    function lerp(start, end, t) {
      return start + (end - start) * t;
    }

    function selectedClass(keys, ownClass = "") {
      const selected = state.selectedPiece;
      return keys.includes(selected) || selected === "all" ? " hot " + ownClass : ownClass;
    }

    function mathHtml(value) {
      return String(value).replace(/\^2/g, "<sup>2</sup>");
    }

    function renderAreaBars(rows) {
      const max = Math.max(1, ...rows.map(row => row.value));
      refs.bars.innerHTML = rows.map(row => "<div class=\"mg-area-bar\" data-piece=\"" + row.key + "\"><span>" + mathHtml(row.label) + "</span><span class=\"mg-area-track\"><span class=\"mg-area-fill\" style=\"width:" + Math.max(4, row.value / max * 100) + "%; --bar-color:" + row.color + "\"></span></span><strong>" + fmt(row.value) + "</strong></div>").join("");
    }

    function updateFormulaAndSteps() {
      const stepsByMode = {
        plus: [
          "边长 a+b 按 a、b 分割。",
          "得到 a^2、ab、ab、b^2 四块。",
          "两个 ab 合并成 2ab。"
        ],
        minus: [
          "从 a^2 中切掉右侧 ab。",
          "再切掉下方 ab。",
          "角上 b^2 被切了两次，补回一次。"
        ],
        diff: [
          "在 a^2 中挖掉角上的 b^2。",
          "把下方 a-b 长条翻到右侧。",
          "拼成长 a+b、宽 a-b 的长方形。"
        ]
      };
      const activeIndex = state.mode === "plus"
        ? (state.plusSpread > 0.56 ? 0 : state.plusSpread > 0.08 ? 1 : 2)
        : state.mode === "minus"
          ? clamp(Math.ceil(state.minusProgress * 3), 1, 3) - 1
          : clamp(Math.ceil(state.diffProgress * 3), 1, 3) - 1;
      refs.steps.innerHTML = stepsByMode[state.mode].map((step, index) => (
        "<div class=\"mg-step " + (index === activeIndex ? "active" : "") + "\">" + (index + 1) + ". " + mathHtml(step) + "</div>"
      )).join("");

      if (state.mode === "plus") {
        refs.formula.innerHTML = "<span class=\"mg-formula-term" + selectedClass(["total"]) + "\">(a+b)<sup>2</sup></span> = <span class=\"mg-formula-term" + selectedClass(["a2"]) + "\">a<sup>2</sup></span> + <span class=\"mg-formula-term" + selectedClass(["ab1", "ab2"], "ab") + "\">2ab</span> + <span class=\"mg-formula-term" + selectedClass(["b2"], "b2") + "\">b<sup>2</sup></span>";
        refs.areaLabelA.textContent = "总面积";
        refs.areaLabelB.textContent = "分块面积";
        refs.areaLabelC.textContent = "选中块";
        refs.areaA.textContent = fmt((state.a + state.b) ** 2);
        refs.areaB.textContent = fmt(state.a ** 2 + 2 * state.a * state.b + state.b ** 2);
        refs.areaC.innerHTML = state.selectedPiece === "a2" ? "a<sup>2</sup> = " + fmt(state.a ** 2)
          : state.selectedPiece === "b2" ? "b<sup>2</sup> = " + fmt(state.b ** 2)
          : state.selectedPiece === "ab1" || state.selectedPiece === "ab2" ? "ab = " + fmt(state.a * state.b)
          : "a<sup>2</sup> / ab / ab / b<sup>2</sup>";
        renderAreaBars([
          { key: "a2", label: "a^2", value: state.a ** 2, color: "#22d3ee" },
          { key: "ab1", label: "ab", value: state.a * state.b, color: "#a855f7" },
          { key: "ab2", label: "ab", value: state.a * state.b, color: "#c084fc" },
          { key: "b2", label: "b^2", value: state.b ** 2, color: "#facc15" }
        ]);
      } else if (state.mode === "minus") {
        refs.formula.innerHTML = "(a-b)<sup>2</sup> = a<sup>2</sup> - 2ab + b<sup>2</sup>";
        refs.areaLabelA.textContent = "剩余面积";
        refs.areaLabelB.textContent = "切掉";
        refs.areaLabelC.textContent = "补回";
        refs.areaA.textContent = fmt((state.a - state.b) ** 2);
        refs.areaB.textContent = "2ab = " + fmt(2 * state.a * state.b);
        refs.areaC.innerHTML = "b<sup>2</sup>";
        renderAreaBars([
          { key: "a2", label: "原图 a^2", value: state.a ** 2, color: "#22d3ee" },
          { key: "ab", label: "减去 2ab", value: 2 * state.a * state.b, color: "#f43f5e" },
          { key: "b2", label: "补回 b^2", value: state.b ** 2, color: "#facc15" },
          { key: "result", label: "结果", value: (state.a - state.b) ** 2, color: "#34d399" }
        ]);
      } else {
        refs.formula.innerHTML = "a<sup>2</sup> - b<sup>2</sup> = (a+b)(a-b)";
        refs.areaLabelA.textContent = "剩余图形";
        refs.areaLabelB.textContent = "长方形";
        refs.areaLabelC.textContent = "因式";
        refs.areaA.textContent = fmt(state.a ** 2 - state.b ** 2);
        refs.areaB.textContent = fmt(state.a + state.b) + " × " + fmt(state.a - state.b);
        refs.areaC.textContent = "(a+b)(a-b)";
        renderAreaBars([
          { key: "a2", label: "原图 a^2", value: state.a ** 2, color: "#22d3ee" },
          { key: "b2", label: "减去 b^2", value: state.b ** 2, color: "#f43f5e" },
          { key: "result", label: "面积差", value: state.a ** 2 - state.b ** 2, color: "#facc15" }
        ]);
      }
    }

    function updatePanel() {
      state.b = Math.min(state.b, state.a - 0.5);
      refs.a.value = String(state.a);
      refs.b.max = String(Math.max(1, state.a - 0.5));
      refs.b.value = String(state.b);
      refs.spread.value = String(state.plusSpread);
      refs.aVal.textContent = fmt(state.a);
      refs.bVal.textContent = fmt(state.b);
      refs.spreadVal.textContent = `${Math.round(state.plusSpread * 100)}%`;
      refs.spreadRow.style.display = state.mode === "plus" ? "grid" : "none";
      refs.scatter.style.display = state.mode === "plus" ? "" : "none";
      refs.assemble.style.display = state.mode === "plus" ? "" : "none";
      refs.playMinus.style.display = state.mode === "minus" ? "" : "none";
      refs.playDiff.style.display = state.mode === "diff" ? "" : "none";
      setActiveButtons(api.panel, "[data-mode]", state.mode);
      refs.grid.classList.toggle("active", state.grid);
      refs.foil.classList.toggle("active", state.foil);
      updateFormulaAndSteps();
      fitPanel(api.panel);
    }

    function drawFoil(svg, x, y, a, b, unit) {
      if (!state.foil || state.mode !== "plus") return;
      const side = a + b;
      line(svg, x, y - 28, x + side, y - 28, "mg-line", { stroke: "rgba(250,204,21,0.68)", "stroke-width": 2 });
      line(svg, x - 28, y, x - 28, y + side, "mg-line", { stroke: "rgba(250,204,21,0.68)", "stroke-width": 2 });
      [0, a, side].forEach(offset => {
        line(svg, x + offset, y - 34, x + offset, y - 22, "mg-line", { stroke: "rgba(250,204,21,0.68)", "stroke-width": 2 });
        line(svg, x - 34, y + offset, x - 22, y + offset, "mg-line", { stroke: "rgba(250,204,21,0.68)", "stroke-width": 2 });
      });
      line(svg, x + a, y - 10, x + a, y + side + 10, "mg-line mg-dash", { stroke: "rgba(250,204,21,0.78)", "stroke-width": 2 });
      line(svg, x - 10, y + a, x + side + 10, y + a, "mg-line mg-dash", { stroke: "rgba(250,204,21,0.78)", "stroke-width": 2 });
      pointText(svg, x + a / 2, y - 48, "a", "mg-small-label");
      pointText(svg, x + a + b / 2, y - 48, "b", "mg-small-label");
      pointText(svg, x - 50, y + a / 2, "a", "mg-small-label");
      pointText(svg, x - 50, y + a + b / 2, "b", "mg-small-label");
      if (unit >= 12) pointText(svg, x + side / 2, y + side + 46, "乘法分块：a×a、a×b、b×a、b×b", "mg-small-label");
    }

    function drawPlus() {
      const { svg, view } = api;
      const totalUnits = state.a + state.b;
      const side = Math.min(view.width * 0.54, view.height * 0.58, 420);
      const unit = side / totalUnits;
      const a = state.a * unit;
      const b = state.b * unit;
      const x = view.cx - side / 2;
      const y = view.cy - side / 2 + 16;
      const spread = state.plusSpread;
      const targets = {
        a2: { x, y, w: a, h: a },
        ab1: { x: x + a, y, w: b, h: a },
        ab2: { x, y: y + a, w: a, h: b },
        b2: { x: x + a, y: y + a, w: b, h: b }
      };
      const loose = {
        a2: { x: x - side * 0.16, y: y - side * 0.12 },
        ab1: { x: x + side * 0.64, y: y - side * 0.18 },
        ab2: { x: x - side * 0.12, y: y + side * 0.78 },
        b2: { x: x + side * 0.82, y: y + side * 0.58 }
      };
      rect(svg, x, y, side, side, "", {
        fill: "rgba(255,255,255,0.018)",
        stroke: "rgba(255,255,255,0.34)",
        "stroke-width": 3,
        rx: 10,
        opacity: 1 - spread * 0.45
      });
      drawGrid(svg, x, y, side, side, unit);
      line(svg, x + a, y, x + a, y + side, "mg-line mg-dash", { stroke: "rgba(250,204,21,0.5)", "stroke-width": 2 });
      line(svg, x, y + a, x + side, y + a, "mg-line mg-dash", { stroke: "rgba(250,204,21,0.5)", "stroke-width": 2 });
      Object.entries(targets).forEach(([key, target]) => {
        const loosePoint = loose[key];
        const px = lerp(target.x, loosePoint.x, spread);
        const py = lerp(target.y, loosePoint.y, spread);
        const label = key === "a2" ? "a^2" : key === "b2" ? "b^2" : "ab";
        const fill = key === "a2" ? "rgba(34,211,238,0.35)" : key === "b2" ? "rgba(250,204,21,0.36)" : "rgba(168,85,247,0.34)";
        drawPiece(svg, px, py, target.w, target.h, label, fill, {
          key,
          hot: state.selectedPiece === "all" || state.selectedPiece === key || (key.startsWith("ab") && String(state.selectedPiece).startsWith("ab"))
        });
      });
      drawFoil(svg, x, y, a, b, unit);
      pointText(svg, view.cx, y - 20, `边长 a+b = ${fmt(totalUnits)}`, "mg-label");
      pointText(svg, x - 26, y + a / 2, "a", "mg-small-label");
      pointText(svg, x - 26, y + a + b / 2, "b", "mg-small-label");
      pointText(svg, x + a / 2, y + side + 28, "a", "mg-small-label");
      pointText(svg, x + a + b / 2, y + side + 28, "b", "mg-small-label");
      api.setHud("模式", "(a+b)²", "边长", `a+b=${fmt(totalUnits)}`, "面积", fmt(totalUnits ** 2));
    }

    function drawMinus() {
      const { svg, view } = api;
      const side = Math.min(view.width * 0.52, view.height * 0.58, 410);
      const unit = side / state.a;
      const b = state.b * unit;
      const remain = Math.max(24, side - b);
      const x = view.cx - side / 2;
      const y = view.cy - side / 2 + 18;
      const p = clamp(state.minusProgress, 0, 1);
      rect(svg, x, y, side, side, "", { fill: "rgba(34,211,238,0.08)", stroke: "rgba(34,211,238,0.62)", "stroke-width": 3, rx: 10 });
      drawGrid(svg, x, y, side, side, unit);
      drawPiece(svg, x, y, remain, remain, "(a-b)^2", "rgba(34,211,238,0.34)", { stroke: "rgba(34,211,238,0.88)" });
      drawRemovedArea(svg, x + remain, y, b, side, "减 ab", clamp(p * 3, 0, 1), x + remain + b / 2, y + remain / 2);
      drawRemovedArea(svg, x, y + remain, side, b, "再减 ab", clamp((p - 0.33) * 3, 0, 1), x + remain / 2, y + remain + b / 2);
      drawPiece(svg, x + remain, y + remain, b, b, "补 b^2", "rgba(250,204,21,0.38)", { opacity: clamp((p - 0.66) * 3, 0, 1), stroke: "rgba(250,204,21,0.9)" });
      line(svg, x + remain, y, x + remain, y + side, "mg-line mg-dash", { stroke: "rgba(250,204,21,0.55)", "stroke-width": 2 });
      line(svg, x, y + remain, x + side, y + remain, "mg-line mg-dash", { stroke: "rgba(250,204,21,0.55)", "stroke-width": 2 });
      drawLabel(svg, view.cx, y - 24, "a^2 - 2ab + b^2", "mg-small-label");
      pointText(svg, x + remain / 2, y + remain + 28, "a-b", "mg-small-label");
      pointText(svg, x - 34, y + remain / 2, "a-b", "mg-small-label");
      api.setHud("模式", "(a-b)²", "剩余", "(a-b)²", "面积", fmt((state.a - state.b) ** 2));
    }

    function drawDiff() {
      const { svg, view } = api;
      const side = Math.min(view.width * 0.5, view.height * 0.56, 390);
      const unit = side / state.a;
      const b = state.b * unit;
      const remain = Math.max(24, side - b);
      const p = clamp(state.diffProgress, 0, 1);
      const startX = view.cx - side / 2 - b * 0.12;
      const startY = view.cy - side / 2 + 20;
      const finalWidth = side + b;
      const finalX = view.cx - finalWidth / 2;
      const finalY = view.cy - remain / 2 + 12;
      const topX = lerp(startX, finalX, p);
      const topY = lerp(startY, finalY, p);
      const bottom = {
        x: lerp(startX, finalX + side, p),
        y: lerp(startY + remain, finalY, p),
        w: lerp(remain, b, p),
        h: lerp(b, remain, p)
      };
      rect(svg, startX, startY, side, side, "", { fill: "rgba(255,255,255,0.018)", stroke: "rgba(255,255,255,0.24)", "stroke-width": 2, rx: 10, opacity: 1 - p * 0.65 });
      drawGrid(svg, startX, startY, side, side, unit);
      drawPiece(svg, topX, topY, side, remain, "a(a-b)", "rgba(34,211,238,0.34)", { stroke: "rgba(34,211,238,0.88)" });
      drawPiece(svg, bottom.x, bottom.y, bottom.w, bottom.h, "b(a-b)", "rgba(168,85,247,0.34)", { stroke: "rgba(168,85,247,0.9)" });
      const removedOpacity = 1 - clamp(p * 2, 0, 1);
      drawRemovedArea(svg, startX + remain, startY + remain, b, b, "减去 b^2", removedOpacity);
      if (p > 0.72) {
        rect(svg, finalX, finalY, finalWidth, remain, "", { fill: "none", stroke: "rgba(250,204,21,0.74)", "stroke-width": 3, rx: 10 });
        pointText(svg, view.cx, finalY - 24, "长 a+b，宽 a-b", "mg-label");
        pointText(svg, view.cx, finalY + remain + 30, "(a+b)(a-b)", "mg-small-label");
      } else {
        drawLabel(svg, view.cx, startY - 24, "从 a^2 中去掉 b^2", "mg-small-label");
      }
      api.setHud("模式", "a²-b²", "因式", "(a+b)(a-b)", "面积", fmt(state.a ** 2 - state.b ** 2));
    }

    function draw() {
      clear(api.svg);
      if (state.mode === "minus") drawMinus();
      else if (state.mode === "diff") drawDiff();
      else drawPlus();
      updatePanel();
    }

    function setMode(mode) {
      if (state.mode !== mode) stopAnimation();
      state.mode = mode;
      state.selectedPiece = "all";
      if (mode === "minus" && state.minusProgress < 1) state.minusProgress = 1;
      if (mode === "diff" && state.diffProgress < 1) state.diffProgress = 1;
      update();
    }

    function runProgress(key, duration) {
      stopAnimation();
      state[key] = 0;
      const started = performance.now();
      state.timer = setInterval(() => {
        state[key] = clamp((performance.now() - started) / duration, 0, 1);
        update();
        if (state[key] >= 1) stopAnimation();
      }, 32);
      api.timers.push(state.timer);
      update();
    }

    api.draw = draw;
    api.on(api.panel, "click", event => {
      const mode = event.target.closest("[data-mode]");
      if (mode) {
        setMode(mode.dataset.mode);
        return;
      }
      const toggle = event.target.closest("[data-toggle]");
      if (toggle) {
        const key = toggle.dataset.toggle;
        state[key] = !state[key];
        if (key === "foil" && state.foil) state.mode = "plus";
        update();
        return;
      }
      if (event.target.closest("[data-scatter]")) {
        state.mode = "plus";
        state.plusSpread = 0.9;
        update();
        return;
      }
      if (event.target.closest("[data-assemble]")) {
        state.mode = "plus";
        state.plusSpread = 0;
        update();
        return;
      }
      if (event.target.closest("[data-play-minus]")) {
        state.mode = "minus";
        runProgress("minusProgress", 2600);
        return;
      }
      if (event.target.closest("[data-play-diff]")) {
        state.mode = "diff";
        runProgress("diffProgress", 2400);
      }
    });
    api.on(api.svg, "pointerdown", event => {
      const piece = event.target.closest("[data-piece]");
      if (!piece || state.mode !== "plus") return;
      state.selectedPiece = piece.dataset.piece;
      update();
    });

    [refs.a, refs.b, refs.spread].forEach(input => {
      api.on(input, "input", event => {
        stopAnimation();
        const value = Number(event.target.value);
        if (event.target === refs.a) {
          state.a = value;
          state.b = Math.min(state.b, state.a - 0.5);
        }
        if (event.target === refs.b) state.b = Math.min(value, state.a - 0.5);
        if (event.target === refs.spread) {
          state.mode = "plus";
          state.plusSpread = value;
        }
        state.selectedPiece = "all";
        update();
      });
    });

    function update() { api.refresh(); }
    update();
  }

  function mountHL(container, context = {}) {
    const api = createBase(container, context, "purple");
    const state = { h: 6, l: 3.8, error: 0, fold: false, marks: true };
    api.panel.innerHTML = `
      <div class="mg-card">
        <div class="mg-grid two">
          <button class="mg-btn active" type="button" data-fold>重合验证</button>
          <button class="mg-btn active" type="button" data-marks>标记 H/L</button>
        </div>
      </div>
      <div class="mg-card">
        <div class="mg-row"><span>斜边 H</span><input class="mg-range" type="range" min="4" max="9" step="0.2" value="6" data-h><span class="mg-value" data-h-val>6</span></div>
        <div class="mg-row"><span>直角边 L</span><input class="mg-range" type="range" min="2" max="7.5" step="0.2" value="3.8" data-l><span class="mg-value" data-l-val>3.8</span></div>
        <div class="mg-row"><span>误差</span><input class="mg-range" type="range" min="-1.4" max="1.4" step="0.1" value="0" data-error><span class="mg-value" data-error-val>0</span></div>
      </div>
      <div class="mg-card">
        <div class="mg-grid two">
          <button class="mg-btn good" type="button" data-snap>HL 吸附</button>
          <button class="mg-btn warn" type="button" data-trap>制造陷阱</button>
        </div>
      </div>
      <div class="mg-card">
        <div class="mg-readout">
          <div class="mg-readout-row"><span>另一边</span><strong data-other>4.6</strong></div>
          <div class="mg-readout-row"><span>判定</span><strong>直角 + H + L</strong></div>
        </div>
        <div class="mg-verdict good" data-verdict style="margin-top:8px;">HL 条件满足，两个直角三角形全等。</div>
      </div>
    `;
    const refs = {
      h: api.panel.querySelector("[data-h]"),
      l: api.panel.querySelector("[data-l]"),
      error: api.panel.querySelector("[data-error]"),
      hVal: api.panel.querySelector("[data-h-val]"),
      lVal: api.panel.querySelector("[data-l-val]"),
      errorVal: api.panel.querySelector("[data-error-val]"),
      other: api.panel.querySelector("[data-other]"),
      verdict: api.panel.querySelector("[data-verdict]")
    };

    function valid() {
      return state.l > 0 && state.l < state.h && state.l + state.error > 0 && state.l + state.error < state.h;
    }

    function updatePanel() {
      const ok = valid();
      const congruent = ok && Math.abs(state.error) < 0.05;
      refs.h.value = String(state.h);
      refs.l.max = String(Math.max(2.2, state.h - 0.2));
      refs.l.value = String(state.l);
      refs.error.value = String(state.error);
      refs.hVal.textContent = fmt(state.h);
      refs.lVal.textContent = fmt(state.l);
      refs.errorVal.textContent = fmt(state.error);
      refs.other.textContent = ok ? `√(${fmt(state.h)}²-${fmt(state.l)}²)=${fmt(Math.sqrt(state.h * state.h - state.l * state.l))}` : "无效";
      refs.verdict.className = `mg-verdict ${congruent ? "good" : "warn"}`;
      refs.verdict.textContent = !ok
        ? "直角边必须小于斜边，当前无法构成直角三角形。"
        : congruent
          ? "HL 条件满足：斜边和一条直角边分别相等。"
          : "斜边相等，但直角边出现误差，不能用 HL 判定。";
      api.panel.querySelector("[data-fold]").classList.toggle("active", state.fold);
      api.panel.querySelector("[data-marks]").classList.toggle("active", state.marks);
    }

    function triPoints(cx, cy, scale, leg, other, mirror = 1) {
      return [
        { x: cx, y: cy },
        { x: cx + mirror * leg * scale, y: cy },
        { x: cx, y: cy - other * scale }
      ];
    }

    function drawTriangle(svg, points, tint, labelPrefix) {
      polygon(svg, points, "mg-piece", { fill: tint, stroke: tint.replace("0.28", "0.92") });
      line(svg, points[1].x, points[1].y, points[2].x, points[2].y, "mg-line", { stroke: "#facc15", "stroke-width": 5 });
      line(svg, points[0].x, points[0].y, points[1].x, points[1].y, "mg-line", { stroke: "#22d3ee", "stroke-width": 5 });
      const r = 18;
      const right = svgEl("path", {
        d: `M ${points[0].x} ${points[0].y - r} L ${points[0].x + Math.sign(points[1].x - points[0].x) * r} ${points[0].y - r} L ${points[0].x + Math.sign(points[1].x - points[0].x) * r} ${points[0].y}`,
        fill: "none",
        stroke: "#fff",
        "stroke-width": 3
      });
      svg.appendChild(right);
      pointText(svg, (points[1].x + points[2].x) / 2, (points[1].y + points[2].y) / 2 - 12, `${labelPrefix}H`, "mg-small-label");
      pointText(svg, (points[0].x + points[1].x) / 2, points[0].y + 24, `${labelPrefix}L`, "mg-small-label");
    }

    function draw() {
      const { svg, view } = api;
      clear(svg);
      const ok = valid();
      const leg2 = clamp(state.l + state.error, 0.2, state.h - 0.1);
      const other1 = Math.sqrt(Math.max(state.h * state.h - state.l * state.l, 0));
      const other2 = Math.sqrt(Math.max(state.h * state.h - leg2 * leg2, 0));
      const scale = Math.min(view.width * 0.12, view.height * 0.12, 48);
      const centerGap = state.fold ? 0 : view.width * 0.26;
      const left = triPoints(view.cx - centerGap, view.cy + view.height * 0.18, scale, state.l, other1, 1);
      const right = triPoints(view.cx + centerGap, view.cy + view.height * 0.18, scale, leg2, other2, state.fold ? 1 : -1);
      drawTriangle(svg, left, "rgba(34,211,238,0.28)", "");
      drawTriangle(svg, right, Math.abs(state.error) < 0.05 && ok ? "rgba(168,85,247,0.28)" : "rgba(244,114,182,0.28)", "'");
      if (state.fold) {
        pointText(svg, view.cx, view.cy - view.height * 0.28, "重合后三边位置一致", "mg-label");
      } else {
        line(svg, view.cx, view.cy - view.height * 0.3, view.cx, view.cy + view.height * 0.28, "mg-line mg-dash", { stroke: "rgba(148,163,184,0.34)", "stroke-width": 2 });
      }
      if (state.marks) {
        circle(svg, left[1].x, left[1].y, 6, "mg-piece", { fill: "#22d3ee", stroke: "#fff" });
        circle(svg, right[1].x, right[1].y, 6, "mg-piece", { fill: "#22d3ee", stroke: "#fff" });
        circle(svg, left[2].x, left[2].y, 6, "mg-piece", { fill: "#facc15", stroke: "#fff" });
        circle(svg, right[2].x, right[2].y, 6, "mg-piece", { fill: "#facc15", stroke: "#fff" });
      }
      api.setHud("H", fmt(state.h), "L", fmt(state.l), "误差", fmt(state.error));
      updatePanel();
    }

    api.draw = draw;
    api.on(api.panel, "click", event => {
      if (event.target.closest("[data-fold]")) state.fold = !state.fold;
      if (event.target.closest("[data-marks]")) state.marks = !state.marks;
      if (event.target.closest("[data-snap]")) state.error = 0;
      if (event.target.closest("[data-trap]")) state.error = state.error === 0 ? 0.8 : 0;
      update();
    });
    [refs.h, refs.l, refs.error].forEach(input => {
      api.on(input, "input", event => {
        const value = Number(event.target.value);
        if (event.target === refs.h) {
          state.h = value;
          state.l = Math.min(state.l, state.h - 0.2);
        }
        if (event.target === refs.l) state.l = value;
        if (event.target === refs.error) state.error = value;
        update();
      });
    });
    function update() { api.refresh(); }
    update();
  }

  function squareOnSegment(p1, p2, anchor) {
    const vx = p2.x - p1.x;
    const vy = p2.y - p1.y;
    const len = Math.hypot(vx, vy) || 1;
    let nx = -vy / len;
    let ny = vx / len;
    const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    if ((mid.x + nx * len * 0.5 - anchor.x) ** 2 + (mid.y + ny * len * 0.5 - anchor.y) ** 2 <
        (mid.x - nx * len * 0.5 - anchor.x) ** 2 + (mid.y - ny * len * 0.5 - anchor.y) ** 2) {
      nx *= -1;
      ny *= -1;
    }
    return [p1, p2, { x: p2.x + nx * len, y: p2.y + ny * len }, { x: p1.x + nx * len, y: p1.y + ny * len }];
  }

  function mountPythagorean(container, context = {}) {
    const api = createBase(container, context, "cyan");
    const state = { a: 3, b: 4, progress: 0.28, mode: "squares", raf: 0 };
    api.panel.innerHTML = `
      <div class="mg-card">
        <div class="mg-grid three">
          <button class="mg-btn active" type="button" data-mode="squares">三边平方</button>
          <button class="mg-btn" type="button" data-mode="flow">面积流动</button>
          <button class="mg-btn" type="button" data-mode="proof">公式追踪</button>
        </div>
      </div>
      <div class="mg-card">
        <div class="mg-row"><span>a</span><input class="mg-range" type="range" min="2" max="6" step="0.2" value="3" data-a><span class="mg-value" data-a-val>3</span></div>
        <div class="mg-row"><span>b</span><input class="mg-range" type="range" min="2" max="7" step="0.2" value="4" data-b><span class="mg-value" data-b-val>4</span></div>
        <div class="mg-row"><span>进度</span><input class="mg-range" type="range" min="0" max="1" step="0.01" value="0.28" data-progress><span class="mg-value" data-progress-val>28%</span></div>
      </div>
      <div class="mg-card">
        <div class="mg-grid two">
          <button class="mg-btn good" type="button" data-play>播放证明</button>
          <button class="mg-btn" type="button" data-reset>复位</button>
        </div>
      </div>
      <div class="mg-card">
        <div class="mg-readout">
          <div class="mg-readout-row"><span>c</span><strong data-c>5</strong></div>
          <div class="mg-readout-row"><span>a²+b²</span><strong data-left>25</strong></div>
          <div class="mg-readout-row"><span>c²</span><strong data-right>25</strong></div>
        </div>
        <div class="mg-meter" style="margin-top:8px;"><div class="mg-fill" data-fill></div></div>
      </div>
    `;
    const refs = {
      a: api.panel.querySelector("[data-a]"),
      b: api.panel.querySelector("[data-b]"),
      progress: api.panel.querySelector("[data-progress]"),
      aVal: api.panel.querySelector("[data-a-val]"),
      bVal: api.panel.querySelector("[data-b-val]"),
      progressVal: api.panel.querySelector("[data-progress-val]"),
      c: api.panel.querySelector("[data-c]"),
      left: api.panel.querySelector("[data-left]"),
      right: api.panel.querySelector("[data-right]"),
      fill: api.panel.querySelector("[data-fill]")
    };

    function updatePanel() {
      setActiveButtons(api.panel, "[data-mode]", state.mode);
      const c = Math.hypot(state.a, state.b);
      refs.a.value = String(state.a);
      refs.b.value = String(state.b);
      refs.progress.value = String(state.progress);
      refs.aVal.textContent = fmt(state.a);
      refs.bVal.textContent = fmt(state.b);
      refs.progressVal.textContent = `${Math.round(state.progress * 100)}%`;
      refs.c.textContent = fmt(c, 2);
      refs.left.textContent = `${fmt(state.a ** 2)} + ${fmt(state.b ** 2)} = ${fmt(state.a ** 2 + state.b ** 2)}`;
      refs.right.textContent = fmt(c ** 2);
      refs.fill.style.width = `${Math.round(state.progress * 100)}%`;
    }

    function drawFlow(svg, from, to, color, count, progress) {
      for (let i = 0; i < count; i += 1) {
        const t = clamp(progress - i * 0.08, 0, 1);
        if (t <= 0 || t >= 1) continue;
        circle(svg, from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t, 5, "mg-piece", {
          fill: color,
          stroke: "#fff",
          opacity: 0.9
        });
      }
    }

    function draw() {
      const { svg, view } = api;
      clear(svg);
      const scale = Math.min(view.width * 0.095, view.height * 0.1, 46);
      const p0 = { x: view.cx - state.a * scale * 0.52, y: view.cy + state.b * scale * 0.26 };
      const pA = { x: p0.x + state.a * scale, y: p0.y };
      const pB = { x: p0.x, y: p0.y - state.b * scale };
      const tri = [p0, pA, pB];
      const sqA = squareOnSegment(p0, pA, pB);
      const sqB = squareOnSegment(pB, p0, pA);
      const sqC = squareOnSegment(pA, pB, p0);
      polygon(svg, sqA, "mg-piece", { fill: "rgba(34,211,238,0.28)", stroke: "#22d3ee" });
      polygon(svg, sqB, "mg-piece", { fill: "rgba(244,114,182,0.28)", stroke: "#f472b6" });
      polygon(svg, sqC, "mg-piece", { fill: "rgba(250,204,21,0.22)", stroke: "#facc15" });
      polygon(svg, tri, "mg-piece", { fill: "rgba(255,255,255,0.08)", stroke: "#fff" });
      pointText(svg, (sqA[2].x + sqA[3].x) / 2, (sqA[2].y + sqA[3].y) / 2, "a²", "mg-label");
      pointText(svg, (sqB[2].x + sqB[3].x) / 2, (sqB[2].y + sqB[3].y) / 2, "b²", "mg-label");
      pointText(svg, (sqC[2].x + sqC[3].x) / 2, (sqC[2].y + sqC[3].y) / 2, "c²", "mg-label");
      if (state.mode !== "squares") {
        const cMid = { x: (sqC[2].x + sqC[3].x) / 2, y: (sqC[2].y + sqC[3].y) / 2 };
        drawFlow(svg, { x: (sqA[2].x + sqA[3].x) / 2, y: (sqA[2].y + sqA[3].y) / 2 }, cMid, "#22d3ee", 7, state.progress);
        drawFlow(svg, { x: (sqB[2].x + sqB[3].x) / 2, y: (sqB[2].y + sqB[3].y) / 2 }, cMid, "#f472b6", 7, state.progress);
      }
      pointText(svg, view.cx, 42, `a² + b² = c²`, "mg-label");
      api.setHud("a", fmt(state.a), "b", fmt(state.b), "c", fmt(Math.hypot(state.a, state.b), 2));
      updatePanel();
    }

    function play() {
      cancelAnimationFrame(state.raf);
      const start = performance.now();
      const tick = now => {
        const t = clamp((now - start) / 1800, 0, 1);
        state.mode = "flow";
        state.progress = t;
        update();
        if (t < 1) state.raf = requestAnimationFrame(tick);
      };
      state.raf = requestAnimationFrame(tick);
      api.timers.push(state.raf);
    }

    api.draw = draw;
    api.on(api.panel, "click", event => {
      const mode = event.target.closest("[data-mode]");
      if (mode) state.mode = mode.dataset.mode;
      if (event.target.closest("[data-play]")) play();
      if (event.target.closest("[data-reset]")) {
        cancelAnimationFrame(state.raf);
        state.progress = 0.2;
        state.mode = "squares";
      }
      update();
    });
    [refs.a, refs.b, refs.progress].forEach(input => {
      api.on(input, "input", event => {
        const value = Number(event.target.value);
        if (event.target === refs.a) state.a = value;
        if (event.target === refs.b) state.b = value;
        if (event.target === refs.progress) state.progress = value;
        update();
      });
    });
    function update() { api.refresh(); }
    update();
  }

  function mountQuadrilateralMorph(container, context = {}) {
    const api = createBase(container, context, "green");
    const state = { a: 5.2, b: 4.0, angle: 72, mode: "free", diagonals: true };
    api.panel.innerHTML = `
      <div class="mg-card">
        <div class="mg-grid three">
          <button class="mg-btn active" type="button" data-mode="free">自由</button>
          <button class="mg-btn" type="button" data-mode="rect">矩形</button>
          <button class="mg-btn" type="button" data-mode="rhomb">菱形</button>
        </div>
      </div>
      <div class="mg-card">
        <div class="mg-row"><span>边 a</span><input class="mg-range" type="range" min="3" max="8" step="0.2" value="5.2" data-a><span class="mg-value" data-a-val>5.2</span></div>
        <div class="mg-row"><span>边 b</span><input class="mg-range" type="range" min="3" max="8" step="0.2" value="4" data-b><span class="mg-value" data-b-val>4</span></div>
        <div class="mg-row"><span>夹角</span><input class="mg-range" type="range" min="42" max="132" step="1" value="72" data-angle><span class="mg-value" data-angle-val>72°</span></div>
      </div>
      <div class="mg-card">
        <div class="mg-grid two">
          <button class="mg-btn active" type="button" data-diagonals>显示对角线</button>
          <button class="mg-btn good" type="button" data-square>正方形</button>
        </div>
      </div>
      <div class="mg-card">
        <div class="mg-readout">
          <div class="mg-readout-row"><span>矩形条件</span><strong data-rect>未满足</strong></div>
          <div class="mg-readout-row"><span>菱形条件</span><strong data-rhomb>未满足</strong></div>
          <div class="mg-readout-row"><span>面积</span><strong data-area>0</strong></div>
        </div>
        <div class="mg-meter" style="margin-top:8px;"><div class="mg-fill gold" data-fill></div></div>
      </div>
    `;
    const refs = {
      a: api.panel.querySelector("[data-a]"),
      b: api.panel.querySelector("[data-b]"),
      angle: api.panel.querySelector("[data-angle]"),
      aVal: api.panel.querySelector("[data-a-val]"),
      bVal: api.panel.querySelector("[data-b-val]"),
      angleVal: api.panel.querySelector("[data-angle-val]"),
      rect: api.panel.querySelector("[data-rect]"),
      rhomb: api.panel.querySelector("[data-rhomb]"),
      area: api.panel.querySelector("[data-area]"),
      fill: api.panel.querySelector("[data-fill]")
    };

    function applyMode(mode) {
      state.mode = mode;
      if (mode === "rect") state.angle = 90;
      if (mode === "rhomb") state.b = state.a;
      update();
    }

    function conditions() {
      const isRect = Math.abs(state.angle - 90) <= 1;
      const isRhomb = Math.abs(state.a - state.b) <= 0.08;
      return { isRect, isRhomb, isSquare: isRect && isRhomb };
    }

    function updatePanel() {
      const c = conditions();
      setActiveButtons(api.panel, "[data-mode]", state.mode);
      refs.a.value = String(state.a);
      refs.b.value = String(state.b);
      refs.angle.value = String(state.angle);
      refs.aVal.textContent = fmt(state.a);
      refs.bVal.textContent = fmt(state.b);
      refs.angleVal.textContent = `${fmt(state.angle, 0)}°`;
      refs.rect.textContent = c.isRect ? "四角为直角" : "夹角不是 90°";
      refs.rhomb.textContent = c.isRhomb ? "四边相等" : "邻边不相等";
      refs.rect.style.color = c.isRect ? "#67e8f9" : "#f9a8d4";
      refs.rhomb.style.color = c.isRhomb ? "#67e8f9" : "#f9a8d4";
      const area = state.a * state.b * Math.sin(state.angle * Math.PI / 180);
      refs.area.textContent = fmt(area);
      refs.fill.style.width = `${clamp(area / 64 * 100, 0, 100)}%`;
      api.panel.querySelector("[data-diagonals]").classList.toggle("active", state.diagonals);
    }

    function draw() {
      const { svg, view } = api;
      clear(svg);
      const scale = Math.min(view.width * 0.095, view.height * 0.105, 52);
      const rad = state.angle * Math.PI / 180;
      const A = { x: view.cx - state.a * scale * 0.48, y: view.cy + state.b * scale * 0.26 };
      const B = { x: A.x + state.a * scale, y: A.y };
      const D = { x: A.x + Math.cos(rad) * state.b * scale, y: A.y - Math.sin(rad) * state.b * scale };
      const C = { x: B.x + D.x - A.x, y: B.y + D.y - A.y };
      const cond = conditions();
      polygon(svg, [A, B, C, D], "mg-piece", {
        fill: cond.isSquare ? "rgba(250,204,21,0.28)" : cond.isRect ? "rgba(34,211,238,0.26)" : cond.isRhomb ? "rgba(244,114,182,0.24)" : "rgba(16,185,129,0.2)",
        stroke: cond.isSquare ? "#facc15" : cond.isRect ? "#22d3ee" : cond.isRhomb ? "#f472b6" : "#34d399"
      });
      if (state.diagonals) {
        line(svg, A.x, A.y, C.x, C.y, "mg-line mg-dash", { stroke: "#facc15", "stroke-width": 3 });
        line(svg, B.x, B.y, D.x, D.y, "mg-line mg-dash", { stroke: "#22d3ee", "stroke-width": 3 });
      }
      [A, B, C, D].forEach((p, index) => {
        circle(svg, p.x, p.y, 6, "mg-piece", { fill: "#fff", stroke: "#34d399" });
        pointText(svg, p.x + (index === 0 ? -18 : index === 1 ? 18 : 0), p.y + (index < 2 ? 22 : -22), ["A", "B", "C", "D"][index], "mg-small-label");
      });
      pointText(svg, (A.x + B.x) / 2, A.y + 28, `a=${fmt(state.a)}`, "mg-small-label");
      pointText(svg, (A.x + D.x) / 2 - 24, (A.y + D.y) / 2, `b=${fmt(state.b)}`, "mg-small-label");
      pointText(svg, view.cx, 42, cond.isSquare ? "正方形：矩形 ∩ 菱形" : cond.isRect ? "矩形条件成立" : cond.isRhomb ? "菱形条件成立" : "平行四边形动态形变", "mg-label");
      api.setHud("夹角", `${fmt(state.angle, 0)}°`, "边长", `${fmt(state.a)} / ${fmt(state.b)}`, "类型", cond.isSquare ? "正方形" : cond.isRect ? "矩形" : cond.isRhomb ? "菱形" : "平行四边形");
      updatePanel();
    }

    api.draw = draw;
    api.on(api.panel, "click", event => {
      const mode = event.target.closest("[data-mode]");
      if (mode) {
        applyMode(mode.dataset.mode);
        return;
      }
      if (event.target.closest("[data-diagonals]")) {
        state.diagonals = !state.diagonals;
        update();
        return;
      }
      if (event.target.closest("[data-square]")) {
        state.mode = "free";
        state.b = state.a;
        state.angle = 90;
        update();
      }
    });
    [refs.a, refs.b, refs.angle].forEach(input => {
      api.on(input, "input", event => {
        const value = Number(event.target.value);
        if (event.target === refs.a) {
          state.a = value;
          if (state.mode === "rhomb") state.b = value;
        }
        if (event.target === refs.b) state.b = value;
        if (event.target === refs.angle) state.angle = value;
        state.mode = "free";
        update();
      });
    });
    function update() { api.refresh(); }
    update();
  }

  const sceneMap = {
    j7b_m04: mountAngleIdentifier,
    j8a_m03: mountSquarePuzzleComplete,
    j8a_m04: mountHL,
    j8b_m01: mountPythagorean,
    j8b_m03: mountQuadrilateralMorph
  };

  Object.entries(sceneMap).forEach(([cardId, mount]) => {
    window.MATH_VISUAL_SCENES[cardId] = {
      mount,
      unmount(container) {
        if (container.__mathGeometryCleanup) {
          container.__mathGeometryCleanup();
          delete container.__mathGeometryCleanup;
        } else {
          container.innerHTML = "";
        }
      }
    };
  });
})();
