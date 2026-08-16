window.MATH_VISUAL_SCENES = window.MATH_VISUAL_SCENES || {};

(function () {
  const CARD_ID = "jm_model_m08";
  const STYLE_ID = "math-perpendicular-bisector-locus-model-style";
  const NS = "http://www.w3.org/2000/svg";
  const VIEWBOX_X = -30;
  const VIEWBOX_Y = -34;
  const VIEWBOX_WIDTH = 780;
  const VIEWBOX_HEIGHT = 708;
  const VIEWBOX = `${VIEWBOX_X} ${VIEWBOX_Y} ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`;
  const DEFAULT_ZOOM = 1;
  const MIN_ZOOM = 0.58;
  const MAX_ZOOM = 1.65;
  const mounts = new WeakMap();

  const SCENES = [
    {
      id: "locus",
      title: "等距轨迹",
      subtitle: "PA = PB 的所有点形成垂直平分线",
      focus: "locus"
    },
    {
      id: "construction",
      title: "尺规作图",
      subtitle: "以 A、B 为圆心同半径作弧，交点连线就是垂直平分线",
      focus: "construction"
    },
    {
      id: "triangle",
      title: "等腰顶点",
      subtitle: "已知 PA = PB，顶点 P 必在底边 AB 的垂直平分线上",
      focus: "triangle"
    }
  ];

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .perpendicular-bisector-locus-model-scene,
      .perpendicular-bisector-locus-model-panel {
        display: block;
        width: 100%;
        height: 100%;
        min-height: 0;
        color: #f8fafc;
        font-family: Inter, "Microsoft YaHei UI", "Microsoft YaHei", system-ui, sans-serif;
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
      }
    `;
    document.head.appendChild(style);
  }

  function makeShadowHost(className) {
    const host = document.createElement("div");
    host.className = className;
    host.dataset.cardId = CARD_ID;
    const shadow = host.attachShadow({ mode: "open" });
    return { host, shadow };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function midpoint(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function normalize(v) {
    const len = Math.hypot(v.x, v.y) || 1;
    return { x: v.x / len, y: v.y / len };
  }

  function perpendicularUnit(a, b) {
    const u = normalize({ x: b.x - a.x, y: b.y - a.y });
    return { x: -u.y, y: u.x };
  }

  function formatNumber(value) {
    return Number.isFinite(value) ? value.toFixed(1) : "--";
  }

  function screenToSvg(svg, event) {
    if (typeof svg.createSVGPoint === "function") {
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const matrix = svg.getScreenCTM?.();
      if (matrix) {
        const next = point.matrixTransform(matrix.inverse());
        return { x: next.x, y: next.y };
      }
    }
    const rect = svg.getBoundingClientRect();
    return {
      x: VIEWBOX_X + ((event.clientX - rect.left) / Math.max(1, rect.width)) * VIEWBOX_WIDTH,
      y: VIEWBOX_Y + ((event.clientY - rect.top) / Math.max(1, rect.height)) * VIEWBOX_HEIGHT
    };
  }

  function polarPoint(center, radius, angle) {
    return {
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle)
    };
  }

  function svgEl(tag, attrs = {}, children = []) {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (value !== null && value !== undefined) el.setAttribute(key, String(value));
    });
    children.forEach(child => el.appendChild(child));
    return el;
  }

  function setAttrs(el, attrs) {
    Object.entries(attrs).forEach(([key, value]) => {
      if (value !== null && value !== undefined) el.setAttribute(key, String(value));
    });
  }
  function unifiedJmModelHudStandardStyle() {
    return `
      /* HUD_UNIFIED_CHALKBOARD_EXPANDED / HUD_UNIFIED_SIMILARITY_COLLAPSED */
      #hud-chalkboard-panel.hud-panel,
      #hud-panel.hud-panel,
      #hud-panel.collapsible-hud,
      .hud-panel,
      .hud-board,
      .collapsible-hud,
      [data-hud] {
        left: 18px !important;
        top: 18px !important;
        right: auto !important;
        width: min(330px, calc(100% - 36px)) !important;
        max-height: min(420px, calc(100% - 36px)) !important;
        display: flex !important;
        flex-direction: column !important;
        border: 1px solid rgba(148, 163, 184, 0.35) !important;
        border-radius: 12px !important;
        background: rgba(255, 255, 255, 0.96) !important;
        color: #0f172a !important;
        box-shadow: 0 14px 34px rgba(15, 23, 42, 0.12) !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        overflow: hidden !important;
        opacity: 1 !important;
        transform: none !important;
        pointer-events: auto !important;
      }
      #hud-chalkboard-panel .hud-header,
      #hud-panel .hud-header,
      .hud-panel .hud-header,
      .hud-board .hud-header,
      .collapsible-hud .hud-header,
      [data-hud] .hud-header {
        min-height: 38px !important;
        height: auto !important;
        padding: 7px 12px !important;
        background: rgba(248, 250, 252, 0.72) !important;
        border-bottom: 1px solid #e2e8f0 !important;
        color: #0f172a !important;
        gap: 8px !important;
      }
      #hud-chalkboard-panel .hud-title,
      #hud-panel .hud-title,
      .hud-panel .hud-title,
      .hud-board .hud-title,
      .collapsible-hud .hud-title,
      [data-hud] .hud-title,
      .hud-header h2 {
        display: inline-flex !important;
        align-items: center !important;
        gap: 7px !important;
        min-width: 0 !important;
        color: #0f172a !important;
        font-size: 12.5px !important;
        font-weight: 800 !important;
        line-height: 1.2 !important;
        letter-spacing: 0 !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        text-shadow: none !important;
      }
      #hud-chalkboard-panel .hud-content,
      #hud-chalkboard-panel .hud-body,
      #hud-chalkboard-panel #steps-hud-chalkboard,
      #hud-panel .hud-content,
      #hud-panel .hud-body,
      #hud-panel #steps-chalkboard,
      .hud-panel .hud-content,
      .hud-panel .hud-body,
      .hud-board .hud-content,
      .hud-board .hud-body,
      .collapsible-hud .hud-content,
      .collapsible-hud .hud-body,
      [data-hud] .hud-content,
      [data-hud] .hud-body {
        display: grid !important;
        gap: 7px !important;
        padding: 0 12px 12px !important;
        border-top: 1px solid #e2e8f0 !important;
        color: #334155 !important;
        font-size: 11.5px !important;
        line-height: 1.45 !important;
        max-height: min(350px, calc(100vh - 150px)) !important;
        overflow-y: auto !important;
      }
      #hud-chalkboard-panel.hud-panel.collapsed,
      #hud-panel.hud-panel.collapsed,
      #hud-panel.collapsible-hud.collapsed,
      .hud-panel.collapsed,
      .hud-board.collapsed,
      .collapsible-hud.collapsed,
      [data-hud].collapsed {
        width: auto !important;
        min-width: 158px !important;
        max-width: min(230px, calc(100% - 36px)) !important;
        height: 42px !important;
        min-height: 42px !important;
        max-height: 42px !important;
        border-radius: 999px !important;
        background: rgba(255, 255, 255, 0.96) !important;
        box-shadow: 0 12px 26px rgba(15, 23, 42, 0.13), inset 0 1px 0 rgba(255, 255, 255, 0.9) !important;
        overflow: hidden !important;
        opacity: 1 !important;
        transform: none !important;
        pointer-events: auto !important;
      }
      .hud-panel.collapsed .hud-header,
      .hud-board.collapsed .hud-header,
      .collapsible-hud.collapsed .hud-header,
      [data-hud].collapsed .hud-header {
        height: 42px !important;
        min-height: 42px !important;
        padding: 6px 8px 6px 14px !important;
        border-bottom: 0 !important;
        background: transparent !important;
      }
      .hud-panel.collapsed .hud-content,
      .hud-panel.collapsed .hud-body,
      .hud-panel.collapsed #steps-hud-chalkboard,
      .hud-panel.collapsed #steps-chalkboard,
      #hud-chalkboard-panel.hud-panel.collapsed .hud-chip,
      #hud-panel.hud-panel.collapsed .hud-chip,
      .hud-panel.collapsed .hud-chip,
      .hud-board.collapsed .hud-chip,
      .collapsible-hud.collapsed .hud-chip,
      [data-hud].collapsed .hud-chip,
      .hud-panel.collapsed .hud-header > span:not(.hud-title),
      .hud-board.collapsed .hud-header > span:not(.hud-title),
      .collapsible-hud.collapsed .hud-header > span:not(.hud-title),
      [data-hud].collapsed .hud-header > span:not(.hud-title),
      /* JM_MODEL_COLLAPSED_CHIP_HIDDEN */
      .hud-board.collapsed .hud-content,
      .hud-board.collapsed .hud-body,
      .collapsible-hud.collapsed .hud-content,
      .collapsible-hud.collapsed .hud-body,
      [data-hud].collapsed .hud-content,
      [data-hud].collapsed .hud-body {
        display: none !important;
      }
      .hud-panel.collapsed .hud-title::before,
      .hud-board.collapsed .hud-title::before,
      .collapsible-hud.collapsed .hud-title::before,
      [data-hud].collapsed .hud-title::before,
      .hud-panel.collapsed .hud-header h2::before,
      .hud-board.collapsed .hud-header h2::before {
        content: "" !important;
        width: 14px !important;
        height: 14px !important;
        flex: 0 0 auto !important;
        border-radius: 999px !important;
        background:
          radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.96) 0 30%, transparent 32%),
          conic-gradient(from 0deg, #38bdf8, #f59e0b, #22c55e, #38bdf8) !important;
      }
      .hud-panel .hud-control-btn,
      .hud-panel .btn-hud-toggle,
      .hud-panel .hud-toggle,
      .hud-panel [data-hud-toggle],
      .hud-board .hud-control-btn,
      .hud-board .btn-hud-toggle,
      .hud-board .hud-toggle,
      .hud-board [data-hud-toggle],
      .collapsible-hud .hud-control-btn,
      .collapsible-hud .btn-hud-toggle,
      .collapsible-hud .hud-toggle,
      .collapsible-hud [data-hud-toggle] {
        width: 26px !important;
        height: 26px !important;
        min-width: 26px !important;
        min-height: 26px !important;
        flex: 0 0 26px !important;
        border-radius: 999px !important;
        border: 0 !important;
        background: rgba(245, 158, 11, 0.16) !important;
        color: #92400e !important;
        box-shadow: none !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
    `;
  }



  function unifiedJmModelHudFinalOverrides() {
    return `
      /* JM_MODEL_HUD_FINAL_UNIFIED_OVERRIDES */
      #hud-chalkboard-panel.hud-panel,
      #hud-panel.hud-panel,
      #hud-panel.collapsible-hud,
      .hud-panel,
      .hud-board,
      .collapsible-hud,
      [data-hud] {
        left: 18px !important;
        top: 18px !important;
        right: auto !important;
        bottom: auto !important;
        width: min(330px, calc(100% - 36px)) !important;
        max-width: min(330px, calc(100% - 36px)) !important;
        max-height: min(420px, calc(100% - 36px)) !important;
        display: flex !important;
        flex-direction: column !important;
        border: 1px solid rgba(148, 163, 184, 0.35) !important;
        border-radius: 12px !important;
        background: rgba(255, 255, 255, 0.96) !important;
        color: #0f172a !important;
        box-shadow: 0 14px 34px rgba(15, 23, 42, 0.12) !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        overflow: hidden !important;
        opacity: 1 !important;
        transform: none !important;
        pointer-events: auto !important;
      }
      #hud-chalkboard-panel .hud-header,
      #hud-panel .hud-header,
      .hud-panel .hud-header,
      .hud-board .hud-header,
      .collapsible-hud .hud-header,
      [data-hud] .hud-header {
        min-height: 38px !important;
        height: auto !important;
        padding: 7px 12px !important;
        background: rgba(248, 250, 252, 0.72) !important;
        border-bottom: 1px solid #e2e8f0 !important;
        color: #0f172a !important;
        gap: 8px !important;
      }
      #hud-chalkboard-panel .hud-title,
      #hud-panel .hud-title,
      .hud-panel .hud-title,
      .hud-board .hud-title,
      .collapsible-hud .hud-title,
      [data-hud] .hud-title,
      #hud-chalkboard-panel .hud-header > span,
      #hud-panel .hud-header > span,
      .hud-panel .hud-header > span,
      .hud-header h2 {
        display: inline-flex !important;
        align-items: center !important;
        gap: 7px !important;
        min-width: 0 !important;
        color: #0f172a !important;
        font-size: 12.5px !important;
        font-weight: 800 !important;
        line-height: 1.2 !important;
        letter-spacing: 0 !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        text-shadow: none !important;
      }
      #hud-chalkboard-panel .hud-content,
      #hud-chalkboard-panel .hud-body,
      #hud-chalkboard-panel #steps-hud-chalkboard,
      #hud-panel .hud-content,
      #hud-panel .hud-body,
      #hud-panel #steps-chalkboard,
      .hud-panel .hud-content,
      .hud-panel .hud-body,
      .hud-board .hud-content,
      .hud-board .hud-body,
      .collapsible-hud .hud-content,
      .collapsible-hud .hud-body,
      [data-hud] .hud-content,
      [data-hud] .hud-body {
        display: grid !important;
        gap: 7px !important;
        padding: 0 12px 12px !important;
        border-top: 1px solid #e2e8f0 !important;
        color: #334155 !important;
        font-size: 11.5px !important;
        line-height: 1.45 !important;
        max-height: min(350px, calc(100vh - 150px)) !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
      }
      #hud-chalkboard-panel .hud-body *,
      #hud-chalkboard-panel #steps-hud-chalkboard *,
      #hud-panel .hud-body *,
      #hud-panel .hud-content *,
      .hud-panel .hud-body *,
      .hud-panel .hud-content *,
      .hud-board .hud-body *,
      .collapsible-hud .hud-body *,
      [data-hud] .hud-body * {
        color: inherit !important;
        text-shadow: none !important;
        letter-spacing: 0 !important;
      }
      #hud-chalkboard-panel.hud-panel.collapsed,
      #hud-panel.hud-panel.collapsed,
      #hud-panel.collapsible-hud.collapsed,
      .hud-panel.collapsed,
      .hud-board.collapsed,
      .collapsible-hud.collapsed,
      [data-hud].collapsed {
        width: auto !important;
        min-width: 158px !important;
        max-width: min(230px, calc(100% - 36px)) !important;
        height: 42px !important;
        min-height: 42px !important;
        max-height: 42px !important;
        border-radius: 999px !important;
        background: rgba(255, 255, 255, 0.96) !important;
        box-shadow: 0 12px 26px rgba(15, 23, 42, 0.13), inset 0 1px 0 rgba(255, 255, 255, 0.9) !important;
        overflow: hidden !important;
        opacity: 1 !important;
        transform: none !important;
        pointer-events: auto !important;
      }
      #hud-chalkboard-panel.hud-panel.collapsed .hud-header,
      #hud-panel.hud-panel.collapsed .hud-header,
      .hud-panel.collapsed .hud-header,
      .hud-board.collapsed .hud-header,
      .collapsible-hud.collapsed .hud-header,
      [data-hud].collapsed .hud-header {
        height: 42px !important;
        min-height: 42px !important;
        padding: 6px 8px 6px 14px !important;
        border-bottom: 0 !important;
        background: transparent !important;
      }
      #hud-chalkboard-panel.hud-panel.collapsed .hud-content,
      #hud-chalkboard-panel.hud-panel.collapsed .hud-body,
      #hud-chalkboard-panel.hud-panel.collapsed #steps-hud-chalkboard,
      #hud-panel.hud-panel.collapsed .hud-content,
      #hud-panel.hud-panel.collapsed .hud-body,
      .hud-panel.collapsed .hud-content,
      .hud-panel.collapsed .hud-body,
      .hud-panel.collapsed #steps-chalkboard,
      .hud-board.collapsed .hud-content,
      .hud-board.collapsed .hud-body,
      .collapsible-hud.collapsed .hud-content,
      .collapsible-hud.collapsed .hud-body,
      [data-hud].collapsed .hud-content,
      [data-hud].collapsed .hud-body {
        display: none !important;
      }
      #hud-chalkboard-panel.hud-panel.collapsed .hud-title::before,
      #hud-panel.hud-panel.collapsed .hud-title::before,
      .hud-panel.collapsed .hud-title::before,
      .hud-board.collapsed .hud-title::before,
      .collapsible-hud.collapsed .hud-title::before,
      [data-hud].collapsed .hud-title::before,
      #hud-chalkboard-panel.hud-panel.collapsed .hud-header > span::before,
      #hud-panel.hud-panel.collapsed .hud-header > span::before,
      .hud-panel.collapsed .hud-header > span::before,
      .hud-panel.collapsed .hud-header h2::before,
      .hud-board.collapsed .hud-header h2::before {
        content: "" !important;
        width: 14px !important;
        height: 14px !important;
        flex: 0 0 auto !important;
        border-radius: 999px !important;
        background:
          radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.96) 0 30%, transparent 32%),
          conic-gradient(from 0deg, #38bdf8, #f59e0b, #22c55e, #38bdf8) !important;
      }
      #hud-chalkboard-panel .hud-control-btn,
      #hud-chalkboard-panel .btn-hud-toggle,
      #hud-chalkboard-panel #btn-hud-toggle,
      #hud-chalkboard-panel .hud-toggle,
      #hud-chalkboard-panel [data-hud-toggle],
      #hud-panel .hud-control-btn,
      #hud-panel .btn-hud-toggle,
      #hud-panel #btn-hud-toggle,
      #hud-panel .hud-toggle,
      #hud-panel [data-hud-toggle],
      .hud-panel .hud-control-btn,
      .hud-panel .btn-hud-toggle,
      .hud-panel .hud-toggle,
      .hud-panel [data-hud-toggle],
      .hud-board .hud-control-btn,
      .hud-board .btn-hud-toggle,
      .hud-board .hud-toggle,
      .hud-board [data-hud-toggle],
      .collapsible-hud .hud-control-btn,
      .collapsible-hud .btn-hud-toggle,
      .collapsible-hud .hud-toggle,
      .collapsible-hud [data-hud-toggle] {
        width: 26px !important;
        height: 26px !important;
        min-width: 26px !important;
        min-height: 26px !important;
        flex: 0 0 26px !important;
        border-radius: 999px !important;
        border: 0 !important;
        background: rgba(245, 158, 11, 0.16) !important;
        color: #92400e !important;
        box-shadow: none !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
    `;
  }

  function cssText() {
    return `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        min-height: 0;
        color: #f8fafc;
        font-family: Inter, "Microsoft YaHei UI", "Microsoft YaHei", system-ui, sans-serif;
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
      }
      *,
      *::before,
      *::after {
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
      }
      .scene-shell {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 0;
        overflow: hidden;
        border-radius: 8px;
        background-color: #f8fafc;
        background-image:
          linear-gradient(rgba(226, 232, 240, 0.72) 1px, transparent 1px),
          linear-gradient(90deg, rgba(226, 232, 240, 0.72) 1px, transparent 1px);
        background-size: 40px 40px;
        touch-action: none;
        overscroll-behavior: contain;
        cursor: pointer;
      }
      .scene-shell.dragging {
        cursor: grabbing;
      }
      .scene-svg {
        width: 100%;
        height: 100%;
        display: block;
        overflow: visible;
        shape-rendering: geometricPrecision;
        text-rendering: geometricPrecision;
      }
      .scene-svg line,
      .scene-svg path,
      .scene-svg circle,
      .scene-svg rect,
      .scene-svg text {
        vector-effect: non-scaling-stroke;
      }
      .board-bg {
        fill: transparent;
        stroke: transparent;
        stroke-width: 1;
      }
      .minor-grid {
        stroke: rgba(203, 213, 225, 0.42);
        stroke-width: 1;
      }
      .axis-line {
        stroke: rgba(148, 163, 184, 0.5);
        stroke-width: 1.2;
      }
      .segment-ab {
        stroke: #0f172a;
        stroke-width: 5;
        stroke-linecap: round;
      }
      .segment-p {
        stroke-width: 4;
        stroke-linecap: round;
      }
      .segment-pa {
        stroke: #3b82f6;
      }
      .segment-pb {
        stroke: #8b5cf6;
      }
      .bisector-line {
        stroke: #10b981;
        stroke-width: 4;
        stroke-linecap: round;
      }
      .bisector-ghost {
        stroke: rgba(16, 185, 129, 0.16);
        stroke-width: 20;
        stroke-linecap: round;
      }
      .construction-circle {
        fill: none;
        stroke-width: 2.2;
        stroke-dasharray: 9 7;
      }
      .circle-a {
        stroke: rgba(59, 130, 246, 0.62);
      }
      .circle-b {
        stroke: rgba(139, 92, 246, 0.62);
      }
      .distance-guide {
        fill: none;
        stroke-width: 2.5;
        stroke-dasharray: 7 6;
        stroke-linecap: round;
      }
      .distance-guide-a {
        stroke: rgba(59, 130, 246, 0.9);
      }
      .distance-guide-b {
        stroke: rgba(139, 92, 246, 0.9);
      }
      .construction-intersection {
        fill: rgba(236, 253, 245, 0.96);
        stroke: rgba(5, 150, 105, 0.9);
        stroke-width: 2.4;
      }
      .locus-sample {
        fill: rgba(16, 185, 129, 0.2);
        stroke: rgba(5, 150, 105, 0.78);
        stroke-width: 1.5;
      }
      .right-angle {
        fill: rgba(139, 92, 246, 0.1);
        stroke: #8b5cf6;
        stroke-width: 2;
      }
      .mid-mark {
        stroke: #0f172a;
        stroke-width: 3;
        stroke-linecap: round;
      }
      .handle {
        cursor: grab;
        filter: drop-shadow(0 8px 12px rgba(15, 23, 42, 0.18));
      }
      .handle:active {
        cursor: grabbing;
      }
      .hit-zone {
        fill: transparent;
        stroke: transparent;
        pointer-events: all;
      }
      .handle-ring {
        fill: rgba(255, 255, 255, 0.92);
        stroke: rgba(15, 23, 42, 0.86);
        stroke-width: 3;
      }
      .handle-core {
        stroke: rgba(255, 255, 255, 0.96);
        stroke-width: 3;
      }
      .handle-a .handle-core {
        fill: #3b82f6;
      }
      .handle-b .handle-core {
        fill: #8b5cf6;
      }
      .handle-p .handle-core {
        fill: #10b981;
      }
      .label-pill {
        fill: rgba(255, 255, 255, 0.92);
        stroke: rgba(148, 163, 184, 0.42);
        stroke-width: 1;
      }
      .label-text {
        fill: #0f172a;
        font-size: 17px;
        font-weight: 900;
        paint-order: stroke;
        stroke: rgba(255, 255, 255, 0.96);
        stroke-width: 5;
        stroke-linejoin: round;
      }
      .small-label {
        fill: #334155;
        font-size: 14px;
        font-weight: 800;
        paint-order: stroke;
        stroke: rgba(255, 255, 255, 0.96);
        stroke-width: 5;
      }
      .hud-board,
      .hud-panel {
        position: absolute;
        left: 12px;
        top: 12px;
        z-index: 4;
        width: min(300px, calc(100% - 24px));
        max-height: none;
        border: 1px solid rgba(148, 163, 184, 0.24);
        border-radius: 14px;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(248, 250, 252, 0.92));
        color: #0f172a;
        box-shadow: 0 18px 42px rgba(15, 23, 42, 0.14), 0 2px 8px rgba(15, 23, 42, 0.06);
        overflow: visible;
        pointer-events: auto;
      }
      .hud-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        min-height: 38px;
        padding: 7px 10px;
        border-bottom: 1px solid rgba(226, 232, 240, 0.76);
        background: rgba(248, 250, 252, 0.72);
      }
      .hud-title {
        flex: 1;
        min-width: 0;
        color: #0f172a;
        font-size: 12.5px;
        font-weight: 800;
        line-height: 1.2;
        white-space: nowrap;
        overflow: visible;
        text-overflow: clip;
      }
      .hud-toggle {
        width: 26px;
        height: 26px;
        flex: 0 0 26px;
        border: 1px solid rgba(148, 163, 184, 0.18);
        border-radius: 8px;
        display: grid;
        place-items: center;
        background: rgba(15, 23, 42, 0.05);
        color: #475569;
        font-size: 15px;
        font-weight: 950;
        cursor: pointer;
        touch-action: manipulation;
      }
      .hud-body {
        display: grid;
        gap: 6px;
        padding: 8px 10px 10px;
        max-height: none;
        overflow: visible;
      }
      .hud-board.collapsed {
        width: auto;
        min-width: max-content;
        max-width: calc(100% - 24px);
      }
      .hud-board.collapsed .hud-body {
        display: none;
      }
      .hud-line {
        display: grid;
        grid-template-columns: 48px minmax(0, 1fr);
        gap: 8px;
        align-items: start;
        padding: 6px 8px;
        border-radius: 8px;
        background: rgba(248, 250, 252, 0.76);
        border: 1px solid rgba(148, 163, 184, 0.16);
      }
      .hud-line b {
        color: #2563eb;
        font-size: 11px;
        line-height: 1.35;
      }
      .hud-line span {
        color: #334155;
        font-size: 11.5px;
        line-height: 1.35;
        font-weight: 760;
      }
      .hud-equation {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 7px 9px;
        border-radius: 8px;
        background: linear-gradient(90deg, rgba(59, 130, 246, 0.12), rgba(16, 185, 129, 0.12));
        border: 1px solid rgba(59, 130, 246, 0.14);
        color: #0f172a;
        font-size: 12px;
        font-weight: 920;
      }
      .hud-result {
        color: #047857;
      }
      .zoom-tools {
        position: absolute;
        right: 12px;
        bottom: 12px;
        z-index: 5;
        display: grid;
        gap: 8px;
      }
      .tool-btn {
        width: 40px;
        height: 40px;
        border: 1px solid rgba(148, 163, 184, 0.34);
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.9);
        color: #475569;
        font-size: 18px;
        font-weight: 950;
        display: grid;
        place-items: center;
        cursor: pointer;
        touch-action: manipulation;
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
      }
      .tool-btn:hover {
        color: #2563eb;
        border-color: rgba(59, 130, 246, 0.34);
      }
      .panel-shell {
        width: 100%;
        height: 100%;
        min-height: 0;
        overflow-x: hidden;
        overflow-y: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        background: transparent;
        color: #f8fafc;
      }
      .panel-shell::-webkit-scrollbar {
        width: 0;
        height: 0;
      }
      .control-column {
        width: 100%;
        min-height: 100%;
        display: grid;
        grid-auto-rows: min-content;
        align-content: start;
        gap: 8px;
        padding: 10px;
      }
      .panel-section {
        border: 1px solid rgba(148, 163, 184, 0.16);
        border-radius: 8px;
        background: rgba(15, 23, 42, 0.64);
        box-shadow: none;
        padding: 10px;
      }
      .panel-title {
        margin: 0 0 8px;
        color: rgba(226, 232, 240, 0.74);
        font-size: 12px;
        line-height: 1.2;
        font-weight: 800;
        letter-spacing: 0;
      }
      .scene-buttons {
        display: grid;
        gap: 8px;
      }
      .scene-button,
      .btn-preset {
        width: 100%;
        min-height: 34px;
        border: 1px solid rgba(148, 163, 184, 0.18);
        border-radius: 8px;
        padding: 10px;
        display: grid;
        grid-template-columns: 28px minmax(0, 1fr);
        column-gap: 10px;
        align-items: center;
        text-align: left;
        background: rgba(2, 6, 23, 0.36);
        color: rgba(226, 232, 240, 0.82);
        cursor: pointer;
        touch-action: manipulation;
      }
      .scene-button.active,
      .btn-preset.active {
        border-color: rgba(250, 204, 21, 0.42);
        background: rgba(250, 204, 21, 0.12);
        color: #fef3c7;
      }
      .scene-index,
      .preset-num {
        width: 26px;
        height: 26px;
        display: grid;
        place-items: center;
        border-radius: 8px;
        background: rgba(148, 163, 184, 0.14);
        color: rgba(226, 232, 240, 0.78);
        font-size: 12px;
        font-weight: 950;
      }
      .scene-button.active .scene-index,
      .btn-preset.active .preset-num {
        background: rgba(250, 204, 21, 0.88);
        color: #111827;
      }
      .scene-button strong {
        display: block;
        color: rgba(248, 250, 252, 0.92);
        font-size: 12.5px;
        line-height: 1.25;
      }
      .scene-button span:last-child {
        display: block;
        margin-top: 3px;
        color: rgba(203, 213, 225, 0.78);
        font-size: 11px;
        line-height: 1.35;
      }
      .control-grid {
        display: grid;
        gap: 9px;
      }
      .field {
        display: grid;
        gap: 6px;
      }
      .field-row {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        color: rgba(203, 213, 225, 0.78);
        font-size: 12px;
        font-weight: 820;
      }
      .field-value {
        color: #f8fafc;
        font-variant-numeric: tabular-nums;
      }
      input[type="range"] {
        width: 100%;
        accent-color: #3b82f6;
      }
      .mode-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }
      .chip-button {
        min-height: 40px;
        border: 1px solid rgba(148, 163, 184, 0.18);
        border-radius: 8px;
        background: rgba(2, 6, 23, 0.36);
        color: rgba(226, 232, 240, 0.82);
        font-size: 12px;
        font-weight: 900;
        cursor: pointer;
        touch-action: manipulation;
      }
      .chip-button.active {
        border-color: rgba(250, 204, 21, 0.42);
        background: rgba(250, 204, 21, 0.12);
        color: #fef3c7;
      }
      .action-row {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }
      .action-btn {
        min-height: 42px;
        border: 1px solid rgba(250, 204, 21, 0.3);
        border-radius: 8px;
        background: rgba(250, 204, 21, 0.1);
        color: #fef3c7;
        font-size: 12px;
        font-weight: 920;
        cursor: pointer;
        touch-action: manipulation;
      }
      .proof-card {
        display: grid;
        gap: 7px;
      }
      .proof-line {
        padding: 8px 9px;
        border-radius: 8px;
        background: rgba(2, 6, 23, 0.24);
        border: 1px solid rgba(148, 163, 184, 0.14);
        color: rgba(226, 232, 240, 0.88);
        font-size: 12px;
        font-weight: 760;
        line-height: 1.55;
      }
      .proof-line strong {
        color: #f8fafc;
      }
      @media (max-width: 760px), (max-height: 620px) {
        .hud-board {
          width: min(290px, calc(100% - 18px));
          left: 9px;
          top: 9px;
        }
        .hud-body {
          gap: 6px;
          padding: 7px 8px 8px;
        }
        .hud-line {
          grid-template-columns: 50px minmax(0, 1fr);
          padding: 6px 7px;
        }
        .hud-line b,
        .hud-line span {
          font-size: 11px;
        }
      }
    `;
  }

  function createSceneMarkup() {
    return `
      <section class="scene-shell" data-scene-shell>
        <svg class="scene-svg" viewBox="${VIEWBOX}" preserveAspectRatio="xMidYMid meet" aria-label="垂直平分线寻点模型模拟框">
          <defs>
            <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="7" result="blur"/>
              <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.125 0 0 0 0 0.773 0 0 0 0 0.333 0 0 0 0.55 0"/>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <g data-viewport>
            <rect class="board-bg" x="6" y="6" width="708" height="628" rx="0"></rect>
            <g data-grid></g>
            <g data-locus-layer></g>
            <g data-construction-layer></g>
            <g data-geometry-layer></g>
            <g data-label-layer></g>
            <g data-handle-layer></g>
          </g>
        </svg>
        <aside class="hud-board hud-panel collapsed" data-hud>
          <div class="hud-header">
            <span class="hud-title">垂直平分线寻点模型板书</span>
            <button class="hud-toggle" type="button" data-hud-toggle aria-label="展开/折叠板书">+</button>
          </div>
          <div class="hud-body">
            <div class="hud-equation">
              <span data-hud-main>PA = PB</span>
              <span class="hud-result" data-hud-result>点 P 在垂直平分线上</span>
            </div>
            <div class="hud-line"><b>中点</b><span data-hud-mid>M 是 AB 的中点，AM = MB</span></div>
            <div class="hud-line"><b>垂直</b><span data-hud-perp>PM ⊥ AB</span></div>
            <div class="hud-line"><b>结论</b><span data-hud-proof>线段垂直平分线上的点，到线段两端距离相等。</span></div>
          </div>
        </aside>
        <div class="zoom-tools" aria-label="视图工具">
          <button class="tool-btn" type="button" data-zoom-in aria-label="放大画布">+</button>
          <button class="tool-btn" type="button" data-zoom-out aria-label="缩小画布">−</button>
          <button class="tool-btn" type="button" data-reset-view aria-label="重置视角">⌂</button>
        </div>
      </section>
    `;
  }

  function createPanelMarkup() {
    return `
      <aside class="panel-shell">
        <div class="control-column">
          <section class="panel-section">
            <h3 class="panel-title">教学演示场景</h3>
            <div class="scene-buttons" data-scene-buttons></div>
          </section>
          <section class="panel-section">
            <h3 class="panel-title">几何参数调节</h3>
            <div class="control-grid">
              <label class="field">
                <span class="field-row"><span>AB 长度</span><span class="field-value" data-length-value>390</span></span>
                <input type="range" min="260" max="470" step="10" value="390" data-length-range>
              </label>
              <label class="field">
                <span class="field-row"><span>P 点高度</span><span class="field-value" data-height-value>180</span></span>
                <input type="range" min="-210" max="140" step="10" value="-180" data-height-range>
              </label>
              <label class="field">
                <span class="field-row"><span>等距容差</span><span class="field-value" data-tolerance-value>6 px</span></span>
                <input type="range" min="2" max="18" step="1" value="6" data-tolerance-range>
              </label>
            </div>
          </section>
          <section class="panel-section">
            <h3 class="panel-title">图上标记</h3>
            <div class="mode-grid">
              <button class="chip-button active" type="button" data-show="distance">距离读数</button>
              <button class="chip-button active" type="button" data-show="construction">尺规痕迹</button>
              <button class="chip-button active" type="button" data-show="locus">轨迹采样</button>
              <button class="chip-button active" type="button" data-show="labels">字母标记</button>
            </div>
          </section>
          <section class="panel-section">
            <h3 class="panel-title">教学演示控制</h3>
            <div class="action-row">
              <button class="action-btn" type="button" data-auto-demo>自动演示</button>
              <button class="action-btn" type="button" data-reset-model>重置模型</button>
            </div>
          </section>
          <section class="panel-section">
            <h3 class="panel-title">证明链</h3>
            <div class="proof-card">
              <div class="proof-line"><strong>正向：</strong>若 M 是 AB 中点且 PM ⊥ AB，则 △PAM 与 △PBM 全等，PA = PB。</div>
              <div class="proof-line"><strong>逆向：</strong>若 PA = PB，则 P 到 A、B 等距，P 落在线段 AB 的垂直平分线上。</div>
              <div class="proof-line"><strong>寻点：</strong>题目出现“到两定点距离相等”“等腰三角形顶点”“垂直平分线交点”，优先找垂直平分线。</div>
            </div>
          </section>
        </div>
      </aside>
    `;
  }

  function createRefs(root) {
    return {
      shell: root.querySelector("[data-scene-shell]"),
      svg: root.querySelector("svg"),
      viewport: root.querySelector("[data-viewport]"),
      grid: root.querySelector("[data-grid]"),
      locusLayer: root.querySelector("[data-locus-layer]"),
      constructionLayer: root.querySelector("[data-construction-layer]"),
      geometryLayer: root.querySelector("[data-geometry-layer]"),
      labelLayer: root.querySelector("[data-label-layer]"),
      handleLayer: root.querySelector("[data-handle-layer]"),
      hud: root.querySelector("[data-hud]"),
      hudToggle: root.querySelector("[data-hud-toggle]"),
      hudMain: root.querySelector("[data-hud-main]"),
      hudResult: root.querySelector("[data-hud-result]"),
      hudMid: root.querySelector("[data-hud-mid]"),
      hudPerp: root.querySelector("[data-hud-perp]"),
      hudProof: root.querySelector("[data-hud-proof]"),
      zoomIn: root.querySelector("[data-zoom-in]"),
      zoomOut: root.querySelector("[data-zoom-out]"),
      resetView: root.querySelector("[data-reset-view]")
    };
  }

  function createPanelRefs(root) {
    return {
      sceneButtons: root.querySelector("[data-scene-buttons]"),
      lengthRange: root.querySelector("[data-length-range]"),
      lengthValue: root.querySelector("[data-length-value]"),
      heightRange: root.querySelector("[data-height-range]"),
      heightValue: root.querySelector("[data-height-value]"),
      toleranceRange: root.querySelector("[data-tolerance-range]"),
      toleranceValue: root.querySelector("[data-tolerance-value]"),
      showButtons: Array.from(root.querySelectorAll("[data-show]")),
      autoDemo: root.querySelector("[data-auto-demo]"),
      resetModel: root.querySelector("[data-reset-model]")
    };
  }

  function makeState() {
    return {
      sceneId: "locus",
      center: { x: 374, y: 382 },
      length: 390,
      pOffsetX: 0,
      pHeight: -190,
      tolerance: 6,
      pan: { x: 0, y: 0 },
      zoom: DEFAULT_ZOOM,
      show: {
        distance: true,
        construction: true,
        locus: true,
        labels: true
      },
      dragging: null,
      activePointerId: null,
      demoTimer: null
    };
  }

  function getPoints(state) {
    const half = state.length / 2;
    const a = { x: state.center.x - half, y: state.center.y };
    const b = { x: state.center.x + half, y: state.center.y };
    const m = midpoint(a, b);
    const p = { x: state.center.x + state.pOffsetX, y: state.center.y + state.pHeight };
    const perp = perpendicularUnit(a, b);
    return { a, b, m, p, perp };
  }

  function pointLabel(group, label, x, y, options = {}) {
    const width = options.width || Math.max(34, label.length * 15 + 14);
    const height = 26;
    group.appendChild(svgEl("rect", {
      class: "label-pill",
      x: x - width / 2,
      y: y - height / 2,
      width,
      height,
      rx: 8
    }));
    const text = svgEl("text", {
      class: options.small ? "small-label" : "label-text",
      x,
      y: y + (options.small ? 5 : 6),
      "text-anchor": "middle"
    });
    text.textContent = label;
    group.appendChild(text);
  }

  function lineLabel(group, label, x, y) {
    const text = svgEl("text", {
      class: "small-label",
      x,
      y,
      "text-anchor": "middle"
    });
    text.textContent = label;
    group.appendChild(text);
  }

  function segmentLabelPoint(start, end, opposite, options = {}) {
    const t = options.t ?? 0.52;
    const offset = options.offset ?? 24;
    const base = {
      x: start.x + (end.x - start.x) * t,
      y: start.y + (end.y - start.y) * t
    };
    const u = normalize({ x: end.x - start.x, y: end.y - start.y });
    let normal = { x: -u.y, y: u.x };
    const toOpposite = { x: opposite.x - base.x, y: opposite.y - base.y };
    if (normal.x * toOpposite.x + normal.y * toOpposite.y > 0) {
      normal = { x: -normal.x, y: -normal.y };
    }
    return {
      x: clamp(base.x + normal.x * offset, 56, 664),
      y: clamp(base.y + normal.y * offset, 78, 592)
    };
  }

  function drawGrid(refs) {
    refs.grid.innerHTML = "";
    for (let x = 40; x <= 680; x += 40) {
      refs.grid.appendChild(svgEl("line", { class: "minor-grid", x1: x, y1: 28, x2: x, y2: 612 }));
    }
    for (let y = 36; y <= 604; y += 40) {
      refs.grid.appendChild(svgEl("line", { class: "minor-grid", x1: 40, y1: y, x2: 680, y2: y }));
    }
    refs.grid.appendChild(svgEl("line", { class: "axis-line", x1: 54, y1: 382, x2: 684, y2: 382 }));
    refs.grid.appendChild(svgEl("line", { class: "axis-line", x1: 374, y1: 60, x2: 374, y2: 596 }));
  }

  function drawHandle(layer, id, point, label, className) {
    const group = svgEl("g", { class: `handle ${className}`, "data-drag": id });
    group.appendChild(svgEl("circle", { class: "hit-zone", cx: point.x, cy: point.y, r: 28 }));
    group.appendChild(svgEl("circle", { class: "handle-ring", cx: point.x, cy: point.y, r: 16 }));
    group.appendChild(svgEl("circle", { class: "handle-core", cx: point.x, cy: point.y, r: 9.5 }));
    const text = svgEl("text", {
      class: "label-text",
      x: point.x,
      y: point.y + 34,
      "text-anchor": "middle"
    });
    text.textContent = label;
    group.appendChild(text);
    layer.appendChild(group);
  }

  function drawRightAngle(layer, m) {
    layer.appendChild(svgEl("path", {
      class: "right-angle",
      d: `M ${m.x + 18} ${m.y} L ${m.x + 18} ${m.y - 18} L ${m.x} ${m.y - 18}`
    }));
  }

  function drawMidTicks(layer, a, b, m) {
    const u = normalize({ x: b.x - a.x, y: b.y - a.y });
    const p = perpendicularUnit(a, b);
    const tickA = {
      x: (a.x + m.x) / 2,
      y: (a.y + m.y) / 2
    };
    const tickB = {
      x: (b.x + m.x) / 2,
      y: (b.y + m.y) / 2
    };
    [tickA, tickB].forEach((pt, index) => {
      const offset = index === 0 ? -6 : 6;
      const cx = pt.x + u.x * offset;
      const cy = pt.y + u.y * offset;
      layer.appendChild(svgEl("line", {
        class: "mid-mark",
        x1: cx - p.x * 9,
        y1: cy - p.y * 9,
        x2: cx + p.x * 9,
        y2: cy + p.y * 9
      }));
    });
  }

  function drawConstruction(refs, state, pts, values, onBisector) {
    refs.constructionLayer.innerHTML = "";
    if (!state.show.construction && state.sceneId !== "construction") return;
    const half = state.length / 2;
    const drawDistanceGuide = (center, point, className, direction) => {
      const radiusToP = distance(center, point);
      const endAngle = Math.atan2(point.y - center.y, point.x - center.x);
      const startAngle = endAngle + direction * 0.62;
      const start = polarPoint(center, radiusToP, startAngle);
      refs.constructionLayer.appendChild(svgEl("path", {
        class: `distance-guide ${className}`,
        d: `M ${start.x} ${start.y} A ${radiusToP} ${radiusToP} 0 0 ${direction > 0 ? 1 : 0} ${point.x} ${point.y}`
      }));
    };

    // 只有 P 真正在线段垂直平分线上时，才可以把 P 作为两等半径圆的公共交点。
    // 偏离时显示两条以 P 为终点的测距虚线，避免把不等距离伪装成尺规交点。
    if (!onBisector || Math.abs(state.pHeight) < 2) {
      drawDistanceGuide(pts.a, pts.p, "distance-guide-a", 1);
      drawDistanceGuide(pts.b, pts.p, "distance-guide-b", -1);
      return;
    }

    const radius = Math.max(half + 1, (values.pa + values.pb) / 2);
    const h = Math.sqrt(Math.max(0, radius * radius - half ** 2));
    const angleA = Math.atan2(h, half);
    const arcPad = 0.34;
    const arc = (center, startAngle, endAngle, className) => {
      const start = polarPoint(center, radius, startAngle);
      const end = polarPoint(center, radius, endAngle);
      const largeArc = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;
      refs.constructionLayer.appendChild(svgEl("path", {
        class: `construction-circle ${className}`,
        d: `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`
      }));
    };
    arc(pts.a, -angleA - arcPad, -angleA + arcPad, "circle-a");
    arc(pts.a, angleA - arcPad, angleA + arcPad, "circle-a");
    arc(pts.b, -Math.PI + angleA - arcPad, -Math.PI + angleA + arcPad, "circle-b");
    arc(pts.b, Math.PI - angleA - arcPad, Math.PI - angleA + arcPad, "circle-b");
    const top = { x: pts.m.x, y: pts.m.y - h };
    const bottom = { x: pts.m.x, y: pts.m.y + h };
    refs.constructionLayer.appendChild(svgEl("circle", {
      class: "construction-intersection",
      cx: top.x,
      cy: top.y,
      r: 6.5
    }));
    refs.constructionLayer.appendChild(svgEl("circle", {
      class: "construction-intersection",
      cx: bottom.x,
      cy: bottom.y,
      r: 6.5
    }));
  }

  function drawLocus(refs, state, pts) {
    refs.locusLayer.innerHTML = "";
    const y1 = 78;
    const y2 = 596;
    refs.locusLayer.appendChild(svgEl("line", {
      class: "bisector-ghost",
      x1: pts.m.x,
      y1,
      x2: pts.m.x,
      y2
    }));
    refs.locusLayer.appendChild(svgEl("line", {
      class: "bisector-line",
      x1: pts.m.x,
      y1,
      x2: pts.m.x,
      y2
    }));
    if (!state.show.locus) return;
    [-210, -154, -98, -42, 42, 98, 154, 210].forEach(offset => {
      refs.locusLayer.appendChild(svgEl("circle", {
        class: "locus-sample",
        cx: pts.m.x,
        cy: pts.m.y + offset,
        r: 4.5
      }));
    });
  }

  function drawGeometry(refs, state, pts, values) {
    refs.geometryLayer.innerHTML = "";
    refs.geometryLayer.appendChild(svgEl("line", { class: "segment-ab", x1: pts.a.x, y1: pts.a.y, x2: pts.b.x, y2: pts.b.y }));
    refs.geometryLayer.appendChild(svgEl("line", { class: "segment-p segment-pa", x1: pts.p.x, y1: pts.p.y, x2: pts.a.x, y2: pts.a.y }));
    refs.geometryLayer.appendChild(svgEl("line", { class: "segment-p segment-pb", x1: pts.p.x, y1: pts.p.y, x2: pts.b.x, y2: pts.b.y }));
    refs.geometryLayer.appendChild(svgEl("line", {
      class: "segment-p",
      x1: pts.p.x,
      y1: pts.p.y,
      x2: pts.m.x,
      y2: pts.m.y,
      stroke: "rgba(34,197,94,.72)",
      "stroke-dasharray": "7 7"
    }));
    drawRightAngle(refs.geometryLayer, pts.m);
    drawMidTicks(refs.geometryLayer, pts.a, pts.b, pts.m);
    if (state.sceneId === "triangle") {
      refs.geometryLayer.appendChild(svgEl("path", {
        d: `M ${pts.a.x} ${pts.a.y} L ${pts.p.x} ${pts.p.y} L ${pts.b.x} ${pts.b.y} Z`,
        fill: "rgba(34,197,94,.08)",
        stroke: "rgba(187,247,208,.5)",
        "stroke-width": 2
      }));
    }
  }

  function drawLabels(refs, state, pts, values) {
    refs.labelLayer.innerHTML = "";
    if (!state.show.labels) return;
    pointLabel(refs.labelLayer, "A", pts.a.x - 22, pts.a.y + 34);
    pointLabel(refs.labelLayer, "B", pts.b.x + 22, pts.b.y + 34);
    pointLabel(refs.labelLayer, "M", pts.m.x + 34, pts.m.y + 32);
    pointLabel(refs.labelLayer, "P", pts.p.x + 34, pts.p.y - 28);
    lineLabel(refs.labelLayer, "垂直平分线", pts.m.x + 82, 126);
    if (state.show.distance) {
      const paLabel = segmentLabelPoint(pts.p, pts.a, pts.b, { t: 0.5, offset: 26 });
      const pbLabel = segmentLabelPoint(pts.p, pts.b, pts.a, { t: 0.5, offset: 26 });
      lineLabel(refs.labelLayer, `PA=${formatNumber(values.pa)}`, paLabel.x, paLabel.y);
      lineLabel(refs.labelLayer, `PB=${formatNumber(values.pb)}`, pbLabel.x, pbLabel.y);
      lineLabel(refs.labelLayer, `AM = MB = ${formatNumber(state.length / 2)}`, pts.m.x, pts.m.y + 64);
    }
  }

  function render(refs, panelRefs, state) {
    const pts = getPoints(state);
    const values = {
      pa: distance(pts.p, pts.a),
      pb: distance(pts.p, pts.b)
    };
    const diff = Math.abs(values.pa - values.pb);
    const equal = diff <= state.tolerance;
    const onBisector = Math.abs(pts.p.x - pts.m.x) <= 1;

    setAttrs(refs.viewport, {
      transform: `translate(${state.pan.x} ${state.pan.y}) scale(${state.zoom})`
    });

    drawGrid(refs);
    drawLocus(refs, state, pts);
    drawConstruction(refs, state, pts, values, onBisector);
    drawGeometry(refs, state, pts, values);
    drawLabels(refs, state, pts, values);
    refs.handleLayer.innerHTML = "";
    drawHandle(refs.handleLayer, "a", pts.a, "", "handle-a");
    drawHandle(refs.handleLayer, "b", pts.b, "", "handle-b");
    drawHandle(refs.handleLayer, "p", pts.p, "", "handle-p");

    refs.hudMain.textContent = `PA=${formatNumber(values.pa)}，PB=${formatNumber(values.pb)}`;
    refs.hudResult.textContent = onBisector
      ? "P 在垂直平分线上"
      : equal
        ? `PA、PB 近似相等，继续拖到绿线`
        : `差值 ${formatNumber(diff)}，拖回绿线`;
    refs.hudResult.style.color = onBisector ? "#047857" : "#b45309";
    refs.hudMid.textContent = `M 是 AB 的中点，AM = MB = ${formatNumber(state.length / 2)}`;
    refs.hudPerp.textContent = onBisector
      ? "P 在绿色直线上，PM ⊥ AB"
      : "绿色直线过 M 且垂直于 AB；P 还没有落在线上";
    refs.hudProof.textContent = state.sceneId === "construction"
      ? "同半径圆的交点到 A、B 距离相等，两个交点连线就是垂直平分线。"
      : state.sceneId === "triangle"
      ? "等腰三角形 PAB 的顶点 P 到 A、B 等距，所以 P 在底边 AB 的垂直平分线上。"
      : "线段垂直平分线上的点，到线段两端距离相等；反过来也成立。";

    if (panelRefs) {
      panelRefs.lengthRange.value = String(state.length);
      panelRefs.lengthValue.textContent = `${Math.round(state.length)} px`;
      panelRefs.heightRange.value = String(state.pHeight);
      panelRefs.heightValue.textContent = `${Math.abs(Math.round(state.pHeight))} px`;
      panelRefs.toleranceRange.value = String(state.tolerance);
      panelRefs.toleranceValue.textContent = `${Math.round(state.tolerance)} px`;
      panelRefs.showButtons.forEach(button => {
        const key = button.dataset.show;
        button.classList.toggle("active", state.show[key] === true);
      });
      Array.from(panelRefs.sceneButtons.querySelectorAll("[data-scene-id]")).forEach(button => {
        button.classList.toggle("active", button.dataset.sceneId === state.sceneId);
      });
    }
  }

  function bindScene(refs, panelRefs, state, cleanup) {
    const rerender = () => render(refs, panelRefs, state);

    const beginDrag = event => {
      const target = event.target.closest?.("[data-drag]");
      if (!target) {
        state.dragging = "pan";
        refs.shell.classList.add("dragging");
      } else {
        state.dragging = target.dataset.drag;
      }
      state.activePointerId = event.pointerId;
      refs.svg.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    };

    const moveDrag = event => {
      if (!state.dragging || state.activePointerId !== event.pointerId) return;
      const pt = screenToSvg(refs.svg, event);
      const adjusted = {
        x: (pt.x - state.pan.x) / state.zoom,
        y: (pt.y - state.pan.y) / state.zoom
      };
      if (state.dragging === "a" || state.dragging === "b") {
        const current = getPoints(state);
        const other = state.dragging === "a" ? current.b : current.a;
        const nextX = clamp(adjusted.x, 78, 662);
        const nextLength = clamp(Math.abs(other.x - nextX), 260, 470);
        const direction = state.dragging === "a" ? -1 : 1;
        state.length = nextLength;
        state.center.x = clamp(other.x + direction * nextLength / 2, 250, 470);
        state.center.y = clamp(adjusted.y, 280, 485);
      } else if (state.dragging === "p") {
        state.pOffsetX = clamp(adjusted.x - state.center.x, -220, 220);
        state.pHeight = clamp(adjusted.y - state.center.y, -260, 190);
      } else if (state.dragging === "pan") {
        state.pan.x = clamp(state.pan.x + event.movementX, -130, 130);
        state.pan.y = clamp(state.pan.y + event.movementY, -90, 90);
      }
      rerender();
      event.preventDefault();
    };

    const endDrag = event => {
      if (state.activePointerId === event.pointerId) {
        refs.svg.releasePointerCapture?.(event.pointerId);
        state.dragging = null;
        state.activePointerId = null;
        refs.shell.classList.remove("dragging");
      }
    };

    const wheelZoom = event => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.08 : 0.08;
      state.zoom = clamp(state.zoom + delta, MIN_ZOOM, MAX_ZOOM);
      rerender();
    };

    cleanup.add(refs.svg, "pointerdown", beginDrag);
    cleanup.add(refs.svg, "pointermove", moveDrag);
    cleanup.add(refs.svg, "pointerup", endDrag);
    cleanup.add(refs.svg, "pointercancel", endDrag);
    cleanup.add(refs.shell, "wheel", wheelZoom, { passive: false });

    cleanup.add(refs.hudToggle, "click", () => {
      refs.hud.classList.toggle("collapsed");
      refs.hudToggle.textContent = refs.hud.classList.contains("collapsed") ? "+" : "−";
    });
    cleanup.add(refs.zoomIn, "click", () => {
      state.zoom = clamp(state.zoom + 0.12, MIN_ZOOM, MAX_ZOOM);
      rerender();
    });
    cleanup.add(refs.zoomOut, "click", () => {
      state.zoom = clamp(state.zoom - 0.12, MIN_ZOOM, MAX_ZOOM);
      rerender();
    });
    cleanup.add(refs.resetView, "click", () => {
      state.zoom = DEFAULT_ZOOM;
      state.pan = { x: 0, y: 0 };
      rerender();
    });
  }

  function bindPanel(panelRefs, state, rerender, cleanup) {
    SCENES.forEach((scene, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "scene-button btn-preset";
      button.dataset.sceneId = scene.id;
      button.innerHTML = `
        <span class="scene-index preset-num">${index + 1}</span>
        <span><strong class="preset-name">${scene.title}</strong><span class="preset-desc">${scene.subtitle}</span></span>
      `;
      panelRefs.sceneButtons.appendChild(button);
      cleanup.add(button, "click", () => {
        state.sceneId = scene.id;
        rerender();
      });
    });

    cleanup.add(panelRefs.lengthRange, "input", () => {
      state.length = Number(panelRefs.lengthRange.value);
      rerender();
    });
    cleanup.add(panelRefs.heightRange, "input", () => {
      state.pHeight = Number(panelRefs.heightRange.value);
      rerender();
    });
    cleanup.add(panelRefs.toleranceRange, "input", () => {
      state.tolerance = Number(panelRefs.toleranceRange.value);
      rerender();
    });
    panelRefs.showButtons.forEach(button => {
      cleanup.add(button, "click", () => {
        const key = button.dataset.show;
        state.show[key] = !state.show[key];
        rerender();
      });
    });
    cleanup.add(panelRefs.resetModel, "click", () => {
      const next = makeState();
      Object.keys(state).forEach(key => delete state[key]);
      Object.assign(state, next);
      rerender();
    });
    cleanup.add(panelRefs.autoDemo, "click", () => {
      if (state.demoTimer) window.clearInterval(state.demoTimer);
      let step = 0;
      const script = [
        () => { state.sceneId = "locus"; state.center.x = 374; state.center.y = 382; state.length = 390; state.pOffsetX = 0; state.pHeight = -190; },
        () => { state.pOffsetX = 112; state.pHeight = -138; },
        () => { state.pOffsetX = 0; state.pHeight = -138; },
        () => { state.pOffsetX = 0; state.pHeight = 148; },
        () => { state.sceneId = "construction"; state.pOffsetX = 0; state.pHeight = -190; state.show.construction = true; },
        () => { state.sceneId = "triangle"; state.pOffsetX = 0; state.pHeight = -160; },
        () => { state.sceneId = "locus"; state.pOffsetX = 0; state.pHeight = -190; }
      ];
      script[0]();
      rerender();
      state.demoTimer = window.setInterval(() => {
        step += 1;
        if (step >= script.length) {
          window.clearInterval(state.demoTimer);
          state.demoTimer = null;
          return;
        }
        script[step]();
        rerender();
      }, 1200);
      cleanup.timers.add(state.demoTimer);
    });
  }

  function createCleanup() {
    return {
      listeners: [],
      timers: new Set(),
      add(target, type, handler, options) {
        if (!target || typeof target.addEventListener !== "function") return;
        target.addEventListener(type, handler, options);
        this.listeners.push([target, type, handler, options]);
      },
      dispose() {
        this.listeners.forEach(([target, type, handler, options]) => target.removeEventListener(type, handler, options));
        this.timers.forEach(id => {
          window.clearInterval(id);
          window.clearTimeout(id);
        });
        this.listeners = [];
        this.timers.clear();
      }
    };
  }

  function blockNativeMenus(target, cleanup) {
    ["contextmenu", "selectstart", "dragstart", "copy", "cut", "paste"].forEach(type => {
      cleanup.add(target, type, event => event.preventDefault());
    });
    cleanup.add(target, "touchstart", event => {
      if (event.touches && event.touches.length > 1) event.preventDefault();
    }, { passive: false });
  }

  window.MATH_VISUAL_SCENES[CARD_ID] = {
    mount(container, context = {}) {
      injectStyle();
      const cleanup = createCleanup();
      const sceneHost = makeShadowHost("perpendicular-bisector-locus-model-scene");
      const panelHost = makeShadowHost("perpendicular-bisector-locus-model-panel");
      mounts.set(container, cleanup);

      container.innerHTML = "";
      const platformPositioned = /\b(absolute|relative|fixed|sticky)\b/.test(String(container.className || ""));
      if (platformPositioned) {
        container.style.position = "";
      } else if (!container.style.position) {
        container.style.position = "relative";
      }
      container.style.overflow = "hidden";
      container.appendChild(sceneHost.host);
      sceneHost.host.style.position = "absolute";
      sceneHost.host.style.inset = "0";
      sceneHost.host.style.width = "100%";
      sceneHost.host.style.height = "100%";
      sceneHost.host.style.minHeight = "0";
      sceneHost.host.style.overflow = "hidden";

      sceneHost.shadow.innerHTML = `<style>${cssText()}
${unifiedJmModelHudStandardStyle()}
${unifiedJmModelHudFinalOverrides()}</style>${createSceneMarkup()}`;
      panelHost.shadow.innerHTML = `<style>${cssText()}
${unifiedJmModelHudStandardStyle()}
${unifiedJmModelHudFinalOverrides()}</style>${createPanelMarkup()}`;

      const sceneRefs = createRefs(sceneHost.shadow);
      const panelRefs = createPanelRefs(panelHost.shadow);
      const state = makeState();
      const rerender = () => render(sceneRefs, panelRefs, state);

      if (context.externalPanel) {
        context.externalPanel.innerHTML = "";
        context.externalPanel.appendChild(panelHost.host);
        panelHost.host.style.width = "100%";
        panelHost.host.style.height = "100%";
      } else {
        panelHost.host.style.position = "absolute";
        panelHost.host.style.right = "12px";
        panelHost.host.style.top = "12px";
        panelHost.host.style.width = "320px";
        panelHost.host.style.height = "calc(100% - 24px)";
        panelHost.host.style.zIndex = "6";
        container.appendChild(panelHost.host);
      }

      blockNativeMenus(sceneHost.shadow, cleanup);
      blockNativeMenus(panelHost.shadow, cleanup);
      bindScene(sceneRefs, panelRefs, state, cleanup);
      bindPanel(panelRefs, state, rerender, cleanup);
      rerender();
    },
    unmount(container, context = {}) {
      const cleanup = mounts.get(container);
      if (cleanup) cleanup.dispose();
      mounts.delete(container);
      container.innerHTML = "";
      if (context.externalPanel) context.externalPanel.innerHTML = "";
    }
  };
})();
