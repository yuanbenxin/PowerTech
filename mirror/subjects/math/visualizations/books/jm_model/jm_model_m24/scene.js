window.MATH_VISUAL_SCENES = window.MATH_VISUAL_SCENES || {};

(function () {
  const CARD_ID = "jm_model_m24";
  const STYLE_ID = "math-equilateral-60-rotation-model-style";
  const NS = "http://www.w3.org/2000/svg";
  const VIEWBOX_WIDTH = 760;
  const VIEWBOX_HEIGHT = 640;
  const FULL_ANGLE = 60;
  const mounts = new WeakMap();

  const SCENES = [
    { id: "construct", title: "等边构造", subtitle: "AB 旋转 60°得到 AC" },
    { id: "rotate", title: "点的旋转", subtitle: "P 绕 A 到 P′" },
    { id: "congruence", title: "全等判定", subtitle: "△ABP 与 △ACP′对应" },
    { id: "extract", title: "中考提取", subtitle: "把散点关系转成等边旋转" }
  ];

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function midpoint(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function normalize(vector) {
    const len = Math.hypot(vector.x, vector.y) || 1;
    return { x: vector.x / len, y: vector.y / len };
  }

  function rotatePoint(point, center, degrees) {
    const rad = degrees * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    return {
      x: center.x + dx * cos - dy * sin,
      y: center.y + dx * sin + dy * cos
    };
  }

  function polarPoint(center, radius, degrees) {
    const rad = degrees * Math.PI / 180;
    return {
      x: center.x + Math.cos(rad) * radius,
      y: center.y + Math.sin(rad) * radius
    };
  }

  function pointAngle(center, point) {
    return Math.atan2(point.y - center.y, point.x - center.x) * 180 / Math.PI;
  }

  function formatNumber(value) {
    return Number(value).toFixed(1).replace(/\.0$/, "");
  }

  function svgEl(name, attrs = {}) {
    const node = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(([key, value]) => {
      if (value === null || value === undefined) return;
      node.setAttribute(key, String(value));
    });
    return node;
  }

  function setAttrs(node, attrs) {
    Object.entries(attrs).forEach(([key, value]) => {
      if (value === null || value === undefined) return;
      node.setAttribute(key, String(value));
    });
  }

  function makeShadowHost(className) {
    const host = document.createElement("div");
    host.className = className;
    const shadow = host.attachShadow({ mode: "open" });
    return { host, shadow };
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .equilateral-60-rotation-model-scene,
      .equilateral-60-rotation-model-panel {
        display: block;
        width: 100%;
        height: 100%;
        min-height: 0;
      }
    `;
    document.head.appendChild(style);
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
        font-family: "Microsoft YaHei", "PingFang SC", "Segoe UI", sans-serif;
        color: #f8fafc;
        -webkit-user-select: none;
        user-select: none;
        -webkit-touch-callout: none;
      }
      * {
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent;
      }
      button,
      input {
        font: inherit;
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
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: block;
        touch-action: none;
        shape-rendering: geometricPrecision;
        text-rendering: geometricPrecision;
      }
      .scene-svg line,
      .scene-svg path,
      .scene-svg circle,
      .scene-svg rect,
      .scene-svg polygon,
      .scene-svg text {
        vector-effect: non-scaling-stroke;
      }
      .board-bg {
        fill: transparent;
        stroke: transparent;
      }
      .minor-grid {
        stroke: rgba(203, 213, 225, 0.42);
        stroke-width: 1;
      }
      .axis-line {
        stroke: rgba(148, 163, 184, 0.38);
        stroke-width: 1.2;
      }
      .base-triangle {
        fill: rgba(250, 204, 21, 0.12);
        stroke: rgba(217, 119, 6, 0.72);
        stroke-width: 3;
        stroke-linejoin: round;
      }
      .source-triangle {
        fill: rgba(59, 130, 246, 0.14);
        stroke: #2563eb;
        stroke-width: 3.2;
        stroke-linejoin: round;
      }
      .rotated-triangle {
        fill: rgba(139, 92, 246, 0.14);
        stroke: #7c3aed;
        stroke-width: 3.2;
        stroke-linejoin: round;
      }
      .ghost-triangle {
        fill: rgba(148, 163, 184, 0.08);
        stroke: rgba(100, 116, 139, 0.45);
        stroke-width: 2;
        stroke-dasharray: 8 8;
      }
      .main-segment {
        stroke: #0f172a;
        stroke-width: 4.5;
        stroke-linecap: round;
      }
      .source-side {
        stroke: #2563eb;
        stroke-width: 4;
        stroke-linecap: round;
      }
      .rotated-side {
        stroke: #7c3aed;
        stroke-width: 4;
        stroke-linecap: round;
      }
      .equal-side-a {
        stroke: #0ea5e9;
      }
      .equal-side-b {
        stroke: #f59e0b;
      }
      .rotation-arc {
        fill: none;
        stroke: #10b981;
        stroke-width: 4;
        stroke-linecap: round;
        marker-end: url(#arrowGreen);
      }
      .angle-arc {
        fill: rgba(16, 185, 129, 0.14);
        stroke: #059669;
        stroke-width: 2;
      }
      .angle-sector {
        fill: rgba(245, 158, 11, 0.15);
        stroke: rgba(217, 119, 6, 0.72);
        stroke-width: 2;
      }
      .tick {
        stroke: #0f172a;
        stroke-width: 3;
        stroke-linecap: round;
      }
      .corresponding-mark {
        fill: none;
        stroke-width: 3;
        stroke-linecap: round;
      }
      .mark-blue {
        stroke: #2563eb;
      }
      .mark-purple {
        stroke: #7c3aed;
      }
      .dash-helper {
        stroke: rgba(15, 23, 42, 0.28);
        stroke-width: 2;
        stroke-dasharray: 7 7;
      }
      .demo-highlight-line {
        fill: none;
        stroke-width: 9;
        stroke-linecap: round;
        stroke-linejoin: round;
        opacity: 0.92;
        filter: drop-shadow(0 4px 10px rgba(15, 23, 42, 0.16));
      }
      .demo-highlight-fill {
        stroke-width: 5;
        stroke-linejoin: round;
        opacity: 0.95;
        filter: drop-shadow(0 8px 16px rgba(15, 23, 42, 0.12));
      }
      .demo-blue {
        stroke: rgba(37, 99, 235, 0.42);
      }
      .demo-purple {
        stroke: rgba(124, 58, 237, 0.44);
      }
      .demo-gold {
        stroke: rgba(245, 158, 11, 0.5);
      }
      .demo-green {
        stroke: rgba(16, 185, 129, 0.5);
      }
      .demo-blue-fill {
        fill: rgba(37, 99, 235, 0.16);
        stroke: rgba(37, 99, 235, 0.7);
      }
      .demo-purple-fill {
        fill: rgba(124, 58, 237, 0.16);
        stroke: rgba(124, 58, 237, 0.72);
      }
      .demo-angle {
        fill: rgba(245, 158, 11, 0.2);
        stroke: rgba(245, 158, 11, 0.86);
        stroke-width: 4;
      }
      .demo-badge-bg {
        fill: rgba(255, 255, 255, 0.97);
        stroke: rgba(148, 163, 184, 0.32);
        stroke-width: 1;
        filter: drop-shadow(0 8px 18px rgba(15, 23, 42, 0.14));
      }
      .demo-badge-text {
        fill: #0f172a;
        font-size: 15px;
        font-weight: 950;
        paint-order: stroke;
        stroke: rgba(255, 255, 255, 0.95);
        stroke-width: 4;
        stroke-linejoin: round;
      }
      .handle {
        cursor: pointer;
        touch-action: none;
        filter: drop-shadow(0 8px 12px rgba(15, 23, 42, 0.18));
      }
      .handle:active {
        cursor: grabbing;
      }
      .hit-zone {
        fill: transparent;
        stroke: transparent;
        pointer-events: all;
        cursor: pointer;
        touch-action: none;
      }
      .handle-ring {
        fill: rgba(255, 255, 255, 0.94);
        stroke: rgba(15, 23, 42, 0.86);
        stroke-width: 3;
      }
      .handle-core {
        stroke: rgba(255, 255, 255, 0.96);
        stroke-width: 3;
      }
      .handle-a .handle-core {
        fill: #0f172a;
      }
      .handle-b .handle-core {
        fill: #2563eb;
      }
      .handle-p .handle-core {
        fill: #10b981;
      }
      .point-ghost {
        fill: rgba(255, 255, 255, 0.88);
        stroke: #7c3aed;
        stroke-width: 3;
      }
      .label-pill {
        fill: rgba(255, 255, 255, 0.94);
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
        font-weight: 820;
        paint-order: stroke;
        stroke: rgba(255, 255, 255, 0.96);
        stroke-width: 5;
        stroke-linejoin: round;
      }
      .relation-label {
        fill: #0f172a;
        font-size: 13px;
        font-weight: 900;
        paint-order: stroke;
        stroke: rgba(255, 255, 255, 0.96);
        stroke-width: 5;
        stroke-linejoin: round;
      }
      .hud-board,
      .hud-panel {
        position: absolute;
        left: 12px;
        top: 12px;
        z-index: 4;
        width: min(314px, calc(100% - 24px));
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
        grid-template-columns: 54px minmax(0, 1fr);
        gap: 8px;
        align-items: start;
        padding: 6px 8px;
        border-radius: 8px;
        background: rgba(248, 250, 252, 0.76);
        border: 1px solid rgba(148, 163, 184, 0.16);
      }
      .hud-line.active {
        background: linear-gradient(90deg, rgba(59, 130, 246, 0.13), rgba(16, 185, 129, 0.11));
        border-color: rgba(37, 99, 235, 0.28);
        box-shadow: inset 3px 0 0 rgba(37, 99, 235, 0.5);
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
        white-space: nowrap;
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
        overflow: hidden;
        color: #e5eefb;
        -webkit-user-select: none;
        user-select: none;
        -webkit-touch-callout: none;
      }
      .control-column {
        display: grid;
        gap: 10px;
        align-content: start;
        height: 100%;
        overflow: auto;
        padding: 2px 2px 12px;
        scrollbar-width: thin;
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
        grid-template-columns: 26px minmax(0, 1fr);
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
        display: grid;
        gap: 2px;
      }
      .scene-button span span {
        color: rgba(203, 213, 225, 0.72);
        font-size: 11px;
        line-height: 1.25;
        font-weight: 720;
      }
      .control-grid {
        display: grid;
        gap: 10px;
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
        gap: 8px;
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
        color: #fde68a;
      }
    `;
  }

  function createSceneMarkup() {
    return `
      <section class="scene-shell" data-scene-shell>
        <svg class="scene-svg" viewBox="0 0 760 640" preserveAspectRatio="xMidYMid slice" aria-label="60 度等边旋转模型模拟框">
          <defs>
            <marker id="arrowGreen" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1 L 9 5 L 0 9 Z" fill="#10b981"></path>
            </marker>
          </defs>
          <g data-viewport>
            <rect class="board-bg" x="6" y="6" width="748" height="628" rx="0"></rect>
            <g data-grid></g>
            <g data-base-layer></g>
            <g data-rotation-layer></g>
            <g data-triangle-layer></g>
            <g data-demo-layer></g>
            <g data-mark-layer></g>
            <g data-label-layer></g>
            <g data-handle-layer></g>
          </g>
        </svg>
        <aside class="hud-board hud-panel collapsed" data-hud>
          <div class="hud-header">
            <span class="hud-title">60 度等边旋转模型板书</span>
            <button class="hud-toggle" type="button" data-hud-toggle aria-label="展开/折叠板书">+</button>
          </div>
          <div class="hud-body">
            <div class="hud-equation">
              <span data-hud-main>∠BAC = 60°</span>
              <span class="hud-result" data-hud-result>旋转闭合</span>
            </div>
            <div class="hud-line" data-hud-step="construct"><b>等边</b><span data-hud-eq>AB = AC，∠BAC = 60°</span></div>
            <div class="hud-line" data-hud-step="rotate"><b>旋转</b><span data-hud-rot>P 绕 A 旋转 60° 到 P′，AP = AP′</span></div>
            <div class="hud-line" data-hud-step="congruence"><b>全等</b><span data-hud-cong>△ABP ≌ △ACP′（SAS）</span></div>
            <div class="hud-line" data-hud-step="result"><b>结论</b><span data-hud-proof>BP = CP′，散点关系转成对应边</span></div>
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
                <span class="field-row"><span>AB 长度</span><span class="field-value" data-length-value>300</span></span>
                <input type="range" min="230" max="430" step="10" value="300" data-length-range>
              </label>
              <label class="field">
                <span class="field-row"><span>旋转进度</span><span class="field-value" data-angle-value>60°</span></span>
                <input type="range" min="0" max="60" step="1" value="60" data-angle-range>
              </label>
              <label class="field">
                <span class="field-row"><span>AP 长度</span><span class="field-value" data-radius-value>210</span></span>
                <input type="range" min="120" max="310" step="5" value="210" data-radius-range>
              </label>
            </div>
          </section>
          <section class="panel-section">
            <h3 class="panel-title">图上标记</h3>
            <div class="mode-grid">
              <button class="chip-button active" type="button" data-show="base">等边底座</button>
              <button class="chip-button active" type="button" data-show="rotation">旋转轨迹</button>
              <button class="chip-button active" type="button" data-show="congruence">全等标记</button>
              <button class="chip-button active" type="button" data-show="labels">字母标记</button>
            </div>
          </section>
          <section class="panel-section">
            <h3 class="panel-title">构造方向</h3>
            <div class="mode-grid">
              <button class="chip-button active" type="button" data-orientation="-1">上方等边</button>
              <button class="chip-button" type="button" data-orientation="1">下方等边</button>
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
              <div class="proof-line"><strong>构造：</strong>以 AB 为边作等边 △ABC，得到 AB = AC，∠BAC = 60°。</div>
              <div class="proof-line"><strong>旋转：</strong>将 P 绕 A 旋转 60° 到 P′，AP = AP′，∠PAP′ = 60°。</div>
              <div class="proof-line"><strong>判定：</strong>当 P′旋到位，△ABP 与 △ACP′由 SAS 全等，BP = CP′。</div>
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
      baseLayer: root.querySelector("[data-base-layer]"),
      rotationLayer: root.querySelector("[data-rotation-layer]"),
      triangleLayer: root.querySelector("[data-triangle-layer]"),
      markLayer: root.querySelector("[data-mark-layer]"),
      demoLayer: root.querySelector("[data-demo-layer]"),
      labelLayer: root.querySelector("[data-label-layer]"),
      handleLayer: root.querySelector("[data-handle-layer]"),
      hud: root.querySelector("[data-hud]"),
      hudToggle: root.querySelector("[data-hud-toggle]"),
      hudMain: root.querySelector("[data-hud-main]"),
      hudResult: root.querySelector("[data-hud-result]"),
      hudEq: root.querySelector("[data-hud-eq]"),
      hudRot: root.querySelector("[data-hud-rot]"),
      hudCong: root.querySelector("[data-hud-cong]"),
      hudProof: root.querySelector("[data-hud-proof]"),
      hudSteps: Array.from(root.querySelectorAll("[data-hud-step]")),
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
      angleRange: root.querySelector("[data-angle-range]"),
      angleValue: root.querySelector("[data-angle-value]"),
      radiusRange: root.querySelector("[data-radius-range]"),
      radiusValue: root.querySelector("[data-radius-value]"),
      showButtons: Array.from(root.querySelectorAll("[data-show]")),
      orientationButtons: Array.from(root.querySelectorAll("[data-orientation]")),
      autoDemo: root.querySelector("[data-auto-demo]"),
      resetModel: root.querySelector("[data-reset-model]")
    };
  }

  function makeState() {
    return {
      sceneId: "rotate",
      a: { x: 360, y: 430 },
      b: { x: 660, y: 430 },
      p: { x: 530, y: 300 },
      progress: 60,
      orientation: -1,
      pan: { x: 0, y: 0 },
      zoom: 1,
      demoStep: null,
      show: {
        base: true,
        rotation: true,
        congruence: true,
        labels: true
      },
      dragging: null,
      activePointerId: null,
      pointers: new Map(),
      pinch: null,
      demoTimer: null,
      lastPointer: null
    };
  }

  function getGeometry(state) {
    const a = state.a;
    const baseVector = { x: state.b.x - state.a.x, y: state.b.y - state.a.y };
    const baseLength = clamp(Math.hypot(baseVector.x, baseVector.y), 230, 430);
    const unit = normalize(baseVector);
    const b = { x: a.x + unit.x * baseLength, y: a.y + unit.y * baseLength };
    const fullDegrees = state.orientation * FULL_ANGLE;
    const progressDegrees = state.orientation * state.progress;
    const c = rotatePoint(b, a, fullDegrees);
    const p = state.p;
    const pCurrent = rotatePoint(p, a, progressDegrees);
    const pFinal = rotatePoint(p, a, fullDegrees);
    return { a, b, c, p, pCurrent, pFinal, baseLength };
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
      x: ((event.clientX - rect.left) / Math.max(1, rect.width)) * VIEWBOX_WIDTH,
      y: ((event.clientY - rect.top) / Math.max(1, rect.height)) * VIEWBOX_HEIGHT
    };
  }

  function clampPan(state) {
    state.pan.x = clamp(state.pan.x, -260, 260);
    state.pan.y = clamp(state.pan.y, -200, 200);
  }

  function zoomAt(state, center, nextZoom) {
    const targetZoom = clamp(nextZoom, 0.62, 2.25);
    const oldZoom = state.zoom || 1;
    if (Math.abs(targetZoom - oldZoom) < 0.001) return;
    const world = {
      x: (center.x - state.pan.x) / oldZoom,
      y: (center.y - state.pan.y) / oldZoom
    };
    state.zoom = targetZoom;
    state.pan.x = center.x - world.x * targetZoom;
    state.pan.y = center.y - world.y * targetZoom;
    clampPan(state);
  }

  function midpointOfTouches(first, second) {
    return {
      x: (first.x + second.x) / 2,
      y: (first.y + second.y) / 2
    };
  }

  function distanceOfTouches(first, second) {
    return Math.hypot(first.x - second.x, first.y - second.y) || 1;
  }

  function drawGrid(refs) {
    refs.grid.innerHTML = "";
    for (let x = 40; x <= 720; x += 40) {
      refs.grid.appendChild(svgEl("line", { class: "minor-grid", x1: x, y1: 28, x2: x, y2: 612 }));
    }
    for (let y = 36; y <= 604; y += 40) {
      refs.grid.appendChild(svgEl("line", { class: "minor-grid", x1: 40, y1: y, x2: 720, y2: y }));
    }
    refs.grid.appendChild(svgEl("line", { class: "axis-line", x1: 56, y1: 402, x2: 704, y2: 402 }));
    refs.grid.appendChild(svgEl("line", { class: "axis-line", x1: 244, y1: 64, x2: 244, y2: 580 }));
  }

  function pathTriangle(a, b, c) {
    return `M ${a.x} ${a.y} L ${b.x} ${b.y} L ${c.x} ${c.y} Z`;
  }

  function arcPath(center, radius, startDegrees, endDegrees) {
    const start = polarPoint(center, radius, startDegrees);
    const end = polarPoint(center, radius, endDegrees);
    const largeArc = Math.abs(endDegrees - startDegrees) > 180 ? 1 : 0;
    const sweep = endDegrees > startDegrees ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`;
  }

  function drawBase(refs, state, pts) {
    refs.baseLayer.innerHTML = "";
    if (!state.show.base) return;
    refs.baseLayer.appendChild(svgEl("path", {
      class: "base-triangle",
      d: pathTriangle(pts.a, pts.b, pts.c)
    }));
    refs.baseLayer.appendChild(svgEl("line", {
      class: "main-segment",
      x1: pts.a.x,
      y1: pts.a.y,
      x2: pts.b.x,
      y2: pts.b.y
    }));
    refs.baseLayer.appendChild(svgEl("line", {
      class: "main-segment",
      x1: pts.a.x,
      y1: pts.a.y,
      x2: pts.c.x,
      y2: pts.c.y
    }));
    const start = pointAngle(pts.a, pts.b);
    const end = pointAngle(pts.a, pts.c);
    refs.baseLayer.appendChild(svgEl("path", {
      class: "angle-sector",
      d: arcPath(pts.a, 48, start, end)
    }));
  }

  function drawRotation(refs, state, pts) {
    refs.rotationLayer.innerHTML = "";
    if (!state.show.rotation) return;
    const radius = clamp(distance(pts.a, pts.p), 76, 320);
    const start = pointAngle(pts.a, pts.p);
    const end = start + state.orientation * state.progress;
    if (state.progress > 2) {
      refs.rotationLayer.appendChild(svgEl("path", {
        class: "rotation-arc",
        d: arcPath(pts.a, radius, start, end)
      }));
    }
    refs.rotationLayer.appendChild(svgEl("line", {
      class: "dash-helper",
      x1: pts.a.x,
      y1: pts.a.y,
      x2: pts.p.x,
      y2: pts.p.y
    }));
    refs.rotationLayer.appendChild(svgEl("line", {
      class: "dash-helper",
      x1: pts.a.x,
      y1: pts.a.y,
      x2: pts.pFinal.x,
      y2: pts.pFinal.y
    }));
    if (state.progress < FULL_ANGLE) {
      refs.rotationLayer.appendChild(svgEl("circle", {
        class: "point-ghost",
        cx: pts.pFinal.x,
        cy: pts.pFinal.y,
        r: 10
      }));
    }
  }

  function drawTriangles(refs, state, pts) {
    refs.triangleLayer.innerHTML = "";
    const currentPoint = pts.pCurrent;
    if (state.sceneId !== "construct") {
      refs.triangleLayer.appendChild(svgEl("path", {
        class: "source-triangle",
        d: pathTriangle(pts.a, pts.b, pts.p)
      }));
      refs.triangleLayer.appendChild(svgEl("path", {
        class: state.progress === FULL_ANGLE ? "rotated-triangle" : "ghost-triangle",
        d: pathTriangle(pts.a, pts.c, currentPoint)
      }));
    }
    refs.triangleLayer.appendChild(svgEl("line", {
      class: "source-side",
      x1: pts.a.x,
      y1: pts.a.y,
      x2: pts.p.x,
      y2: pts.p.y
    }));
    refs.triangleLayer.appendChild(svgEl("line", {
      class: "rotated-side",
      x1: pts.a.x,
      y1: pts.a.y,
      x2: currentPoint.x,
      y2: currentPoint.y
    }));
    if (state.sceneId === "congruence" || state.sceneId === "extract") {
      refs.triangleLayer.appendChild(svgEl("line", {
        class: "source-side equal-side-a",
        x1: pts.b.x,
        y1: pts.b.y,
        x2: pts.p.x,
        y2: pts.p.y
      }));
      refs.triangleLayer.appendChild(svgEl("line", {
        class: "rotated-side equal-side-b",
        x1: pts.c.x,
        y1: pts.c.y,
        x2: currentPoint.x,
        y2: currentPoint.y
      }));
    }
  }

  function tickMark(layer, start, end, offset, className = "tick") {
    const mid = midpoint(start, end);
    const u = normalize({ x: end.x - start.x, y: end.y - start.y });
    const n = { x: -u.y, y: u.x };
    layer.appendChild(svgEl("line", {
      class: className,
      x1: mid.x + n.x * offset - u.x * 10,
      y1: mid.y + n.y * offset - u.y * 10,
      x2: mid.x + n.x * offset + u.x * 10,
      y2: mid.y + n.y * offset + u.y * 10
    }));
  }

  function sideLabelPoint(start, end, awayFrom, offset = 25) {
    const base = midpoint(start, end);
    const u = normalize({ x: end.x - start.x, y: end.y - start.y });
    let n = { x: -u.y, y: u.x };
    const away = { x: awayFrom.x - base.x, y: awayFrom.y - base.y };
    if (n.x * away.x + n.y * away.y > 0) n = { x: -n.x, y: -n.y };
    return {
      x: clamp(base.x + n.x * offset, 56, 704),
      y: clamp(base.y + n.y * offset, 70, 592)
    };
  }

  function spacedSideLabelPoint(start, end, avoidPoints, options = {}) {
    const t = options.t ?? 0.5;
    const offset = options.offset ?? 34;
    const base = {
      x: start.x + (end.x - start.x) * t,
      y: start.y + (end.y - start.y) * t
    };
    const u = normalize({ x: end.x - start.x, y: end.y - start.y });
    const candidates = [
      { x: base.x + -u.y * offset, y: base.y + u.x * offset },
      { x: base.x + u.y * offset, y: base.y + -u.x * offset },
      { x: base.x + -u.y * (offset + 24), y: base.y + u.x * (offset + 24) },
      { x: base.x + u.y * (offset + 24), y: base.y + -u.x * (offset + 24) }
    ];
    const best = candidates
      .map(point => ({
        point,
        score: avoidPoints.reduce((sum, avoid) => sum + Math.min(180, distance(point, avoid)), 0)
      }))
      .sort((left, right) => right.score - left.score)[0].point;
    return {
      x: clamp(best.x, 66, 694),
      y: clamp(best.y, 80, 582)
    };
  }

  function drawMarks(refs, state, pts, values) {
    refs.markLayer.innerHTML = "";
    if (!state.show.congruence && state.sceneId !== "congruence" && state.sceneId !== "extract") return;

    tickMark(refs.markLayer, pts.a, pts.b, 0, "tick");
    tickMark(refs.markLayer, pts.a, pts.c, 0, "tick");
    tickMark(refs.markLayer, pts.a, pts.p, 0, "corresponding-mark mark-blue");
    tickMark(refs.markLayer, pts.a, pts.pCurrent, 0, "corresponding-mark mark-purple");

    const p1 = spacedSideLabelPoint(pts.b, pts.p, [pts.a, pts.pCurrent, pts.c], { t: 0.62, offset: 40 });
    const p2 = spacedSideLabelPoint(pts.c, pts.pCurrent, [pts.a, pts.p, pts.b, p1], { t: 0.42, offset: 54 });
    lineLabel(refs.markLayer, `BP=${formatNumber(values.bp)}`, p1.x, p1.y, 84);
    lineLabel(refs.markLayer, `CP′=${formatNumber(values.cp)}`, p2.x, p2.y, 90);
  }

  function demoBadge(layer, label, x, y, width = 118) {
    const h = 30;
    layer.appendChild(svgEl("rect", {
      class: "demo-badge-bg",
      x: x - width / 2,
      y: y - h / 2,
      width,
      height: h,
      rx: 10
    }));
    const text = svgEl("text", {
      class: "demo-badge-text",
      x,
      y: y + 5,
      "text-anchor": "middle"
    });
    text.textContent = label;
    layer.appendChild(text);
  }

  function demoLine(layer, start, end, className) {
    layer.appendChild(svgEl("line", {
      class: `demo-highlight-line ${className}`,
      x1: start.x,
      y1: start.y,
      x2: end.x,
      y2: end.y
    }));
  }

  function demoTriangle(layer, a, b, c, className) {
    layer.appendChild(svgEl("path", {
      class: `demo-highlight-fill ${className}`,
      d: pathTriangle(a, b, c)
    }));
  }

  function drawDemoHighlights(refs, state, pts, values) {
    refs.demoLayer.innerHTML = "";
    const step = state.demoStep;
    if (!step) return;

    if (step === "construct") {
      demoLine(refs.demoLayer, pts.a, pts.b, "demo-gold");
      demoLine(refs.demoLayer, pts.a, pts.c, "demo-gold");
      const start = pointAngle(pts.a, pts.b);
      const end = pointAngle(pts.a, pts.c);
      refs.demoLayer.appendChild(svgEl("path", {
        class: "demo-angle",
        d: arcPath(pts.a, 70, start, end)
      }));
      demoBadge(refs.demoLayer, "作等边 △ABC", pts.a.x + 120, pts.a.y - 42, 138);
      return;
    }

    if (step === "rotate" || step === "equal") {
      demoLine(refs.demoLayer, pts.a, pts.p, "demo-blue");
      demoLine(refs.demoLayer, pts.a, pts.pCurrent, "demo-purple");
      const radius = clamp(distance(pts.a, pts.p), 76, 320);
      const start = pointAngle(pts.a, pts.p);
      const end = start + state.orientation * Math.max(8, state.progress);
      refs.demoLayer.appendChild(svgEl("path", {
        class: "demo-highlight-line demo-green",
        d: arcPath(pts.a, radius + 12, start, end)
      }));
      const label = step === "equal" ? "AP = AP′" : `旋转 ${state.progress}°`;
      demoBadge(refs.demoLayer, label, clamp(pts.pCurrent.x + 64, 108, 650), clamp(pts.pCurrent.y - 38, 92, 560), 104);
      return;
    }

    if (step === "congruence") {
      demoTriangle(refs.demoLayer, pts.a, pts.b, pts.p, "demo-blue-fill");
      demoTriangle(refs.demoLayer, pts.a, pts.c, pts.pCurrent, "demo-purple-fill");
      demoLine(refs.demoLayer, pts.a, pts.b, "demo-gold");
      demoLine(refs.demoLayer, pts.a, pts.c, "demo-gold");
      demoLine(refs.demoLayer, pts.a, pts.p, "demo-blue");
      demoLine(refs.demoLayer, pts.a, pts.pCurrent, "demo-purple");
      demoBadge(refs.demoLayer, "SAS 全等", pts.a.x + 80, pts.a.y - 112, 104);
      return;
    }

    if (step === "result") {
      demoLine(refs.demoLayer, pts.b, pts.p, "demo-blue");
      demoLine(refs.demoLayer, pts.c, pts.pCurrent, "demo-purple");
      demoBadge(refs.demoLayer, "BP = CP′", pts.a.x + 218, pts.a.y - 226, 110);
    }
  }

  function pointLabel(group, label, x, y, width) {
    const w = width || Math.max(34, label.length * 15 + 14);
    const h = 26;
    group.appendChild(svgEl("rect", {
      class: "label-pill",
      x: x - w / 2,
      y: y - h / 2,
      width: w,
      height: h,
      rx: 8
    }));
    const text = svgEl("text", {
      class: "label-text",
      x,
      y: y + 6,
      "text-anchor": "middle"
    });
    text.textContent = label;
    group.appendChild(text);
  }

  function lineLabel(group, label, x, y, width) {
    const w = width || Math.max(52, label.length * 10 + 18);
    const h = 24;
    group.appendChild(svgEl("rect", {
      class: "label-pill",
      x: x - w / 2,
      y: y - h / 2,
      width: w,
      height: h,
      rx: 8
    }));
    const text = svgEl("text", {
      class: "relation-label",
      x,
      y: y + 5,
      "text-anchor": "middle"
    });
    text.textContent = label;
    group.appendChild(text);
  }

  function drawLabels(refs, state, pts, values) {
    refs.labelLayer.innerHTML = "";
    if (!state.show.labels) return;

    pointLabel(refs.labelLayer, "A", pts.a.x - 30, pts.a.y + 34);
    pointLabel(refs.labelLayer, "B", pts.b.x + 30, pts.b.y + 34);
    pointLabel(refs.labelLayer, "C", pts.c.x + (state.orientation < 0 ? 28 : 30), pts.c.y + (state.orientation < 0 ? -28 : 34));
    pointLabel(refs.labelLayer, "P", pts.p.x + 32, pts.p.y - 26);
    pointLabel(
      refs.labelLayer,
      state.progress === FULL_ANGLE ? "P′" : "Pθ",
      pts.pCurrent.x + (state.orientation < 0 ? -34 : 34),
      pts.pCurrent.y + (state.orientation < 0 ? -18 : 34),
      40
    );

    const anglePos = polarPoint(pts.a, 78, pointAngle(pts.a, pts.b) + state.orientation * 30);
    lineLabel(refs.labelLayer, `${Math.abs(FULL_ANGLE)}°`, anglePos.x, anglePos.y, 48);

    if ((state.sceneId === "congruence" || state.sceneId === "extract") && state.demoStep !== "result") {
      const l1 = sideLabelPoint(pts.a, pts.p, pts.b, 24);
      const l2 = sideLabelPoint(pts.a, pts.pCurrent, pts.c, 24);
      lineLabel(refs.labelLayer, `AP=${formatNumber(values.ap)}`, l1.x, l1.y, 82);
      lineLabel(refs.labelLayer, `AP′=${formatNumber(values.apRot)}`, l2.x, l2.y, 86);
    }
  }

  function drawHandle(layer, id, point, className) {
    const group = svgEl("g", { class: `handle ${className}`, "data-drag": id });
    group.appendChild(svgEl("circle", { class: "hit-zone", cx: point.x, cy: point.y, r: 42 }));
    group.appendChild(svgEl("circle", { class: "handle-ring", cx: point.x, cy: point.y, r: 16 }));
    group.appendChild(svgEl("circle", { class: "handle-core", cx: point.x, cy: point.y, r: 9.5 }));
    layer.appendChild(group);
  }

  function updatePanel(panelRefs, state, pts, values) {
    if (!panelRefs.sceneButtons) return;
    Array.from(panelRefs.sceneButtons.querySelectorAll(".scene-button")).forEach(button => {
      button.classList.toggle("active", button.dataset.sceneId === state.sceneId);
    });
    panelRefs.lengthRange.value = String(Math.round(values.ab / 10) * 10);
    panelRefs.lengthValue.textContent = `${formatNumber(values.ab)} px`;
    panelRefs.angleRange.value = String(state.progress);
    panelRefs.angleValue.textContent = `${state.progress}°`;
    panelRefs.radiusRange.value = String(Math.round(values.ap / 5) * 5);
    panelRefs.radiusValue.textContent = `${formatNumber(values.ap)} px`;
    panelRefs.showButtons.forEach(button => {
      button.classList.toggle("active", state.show[button.dataset.show] === true);
    });
    panelRefs.orientationButtons.forEach(button => {
      button.classList.toggle("active", Number(button.dataset.orientation) === state.orientation);
    });
  }

  function updateHud(refs, state, values) {
    const closed = state.progress === FULL_ANGLE;
    const step = state.demoStep || (state.sceneId === "extract" ? "result" : state.sceneId);
    refs.hudSteps.forEach(row => {
      const rowStep = row.dataset.hudStep;
      row.classList.toggle("active", rowStep === step || (step === "equal" && rowStep === "rotate"));
    });

    if (step === "construct") {
      refs.hudMain.textContent = "先作等边 △ABC";
      refs.hudResult.textContent = "固定 60°";
      refs.hudResult.style.color = "#2563eb";
      refs.hudEq.textContent = `AB = AC = ${formatNumber(values.ab)}，∠BAC = 60°`;
      refs.hudRot.textContent = "下一步让点 P 绕 A 转 60°";
      refs.hudCong.textContent = "全等条件先不急，先把等边底座搭好";
      refs.hudProof.textContent = "目标：把 BP 转成另一条可对应的线段";
      return;
    }

    if (step === "rotate") {
      refs.hudMain.textContent = `P 绕 A 旋转：${state.progress}° / 60°`;
      refs.hudResult.textContent = closed ? "到位" : "继续旋转";
      refs.hudResult.style.color = closed ? "#047857" : "#b45309";
      refs.hudEq.textContent = `AB = AC，∠BAC = 60°`;
      refs.hudRot.textContent = closed ? `P → P′，AP = AP′ = ${formatNumber(values.ap)}` : "观察 P 的轨迹和 P′的落点";
      refs.hudCong.textContent = "旋到 60°后，两个夹角才能对上";
      refs.hudProof.textContent = "先看旋转闭合，再读对应边";
      return;
    }

    if (step === "equal") {
      refs.hudMain.textContent = "旋转保长、保角";
      refs.hudResult.textContent = "条件齐";
      refs.hudResult.style.color = "#047857";
      refs.hudEq.textContent = `AB = AC = ${formatNumber(values.ab)}，∠BAC = 60°`;
      refs.hudRot.textContent = `AP = AP′ = ${formatNumber(values.ap)}，∠PAP′ = 60°`;
      refs.hudCong.textContent = "两边及夹角正在对齐到 SAS";
      refs.hudProof.textContent = "把“旋转产生的等量”喂给全等判定";
      return;
    }

    if (step === "congruence") {
      refs.hudMain.textContent = "SAS 判定全等";
      refs.hudResult.textContent = "对应成立";
      refs.hudResult.style.color = "#047857";
      refs.hudEq.textContent = "AB = AC";
      refs.hudRot.textContent = "AP = AP′，夹角同为 60°";
      refs.hudCong.textContent = "△ABP ≌ △ACP′（SAS）";
      refs.hudProof.textContent = "下一步只取需要的对应边";
      return;
    }

    refs.hudMain.textContent = closed ? "读结论：BP = CP′" : `旋转中：${state.progress}° / 60°`;
    refs.hudResult.textContent = closed ? "最短/等量转化" : "继续旋到 60°";
    refs.hudResult.style.color = closed ? "#047857" : "#b45309";
    refs.hudEq.textContent = `AB = AC = ${formatNumber(values.ab)}，∠BAC = 60°`;
    refs.hudRot.textContent = closed ? `P → P′，AP = AP′ = ${formatNumber(values.ap)}` : `P 正在绕 A 旋转，当前 ${state.progress}°`;
    refs.hudCong.textContent = closed ? "△ABP ≌ △ACP′（SAS）" : "旋到 60°后再读全等对应";
    refs.hudProof.textContent = closed ? `BP = CP′ = ${formatNumber(values.bp)}` : "先观察轨迹，再落到对应边";
  }

  function render(refs, panelRefs, state) {
    const pts = getGeometry(state);
    const values = {
      ab: distance(pts.a, pts.b),
      ac: distance(pts.a, pts.c),
      ap: distance(pts.a, pts.p),
      apRot: distance(pts.a, pts.pCurrent),
      bp: distance(pts.b, pts.p),
      cp: distance(pts.c, pts.pCurrent)
    };

    setAttrs(refs.viewport, {
      transform: `translate(${state.pan.x} ${state.pan.y}) scale(${state.zoom})`
    });

    drawGrid(refs);
    drawBase(refs, state, pts);
    drawRotation(refs, state, pts);
    drawTriangles(refs, state, pts);
    drawMarks(refs, state, pts, values);
    drawDemoHighlights(refs, state, pts, values);
    drawLabels(refs, state, pts, values);

    refs.handleLayer.innerHTML = "";
    drawHandle(refs.handleLayer, "a", pts.a, "handle-a");
    drawHandle(refs.handleLayer, "b", pts.b, "handle-b");
    drawHandle(refs.handleLayer, "p", pts.p, "handle-p");

    updateHud(refs, state, values);
    updatePanel(panelRefs, state, pts, values);
  }

  function setBaseLength(state, length) {
    const pts = getGeometry(state);
    const unit = normalize({ x: pts.b.x - pts.a.x, y: pts.b.y - pts.a.y });
    const nextA = { ...state.a };
    const nextB = {
      x: state.a.x + unit.x * length,
      y: state.a.y + unit.y * length
    };
    let shiftX = 0;
    let shiftY = 0;
    if (nextB.x > 704) shiftX = 704 - nextB.x;
    if (nextB.x < 112) shiftX = 112 - nextB.x;
    if (nextB.y > 560) shiftY = 560 - nextB.y;
    if (nextB.y < 104) shiftY = 104 - nextB.y;
    if (nextA.x + shiftX < 92) shiftX = 92 - nextA.x;
    if (nextA.x + shiftX > 620) shiftX = 620 - nextA.x;
    if (nextA.y + shiftY < 116) shiftY = 116 - nextA.y;
    if (nextA.y + shiftY > 520) shiftY = 520 - nextA.y;
    state.a = { x: nextA.x + shiftX, y: nextA.y + shiftY };
    state.b = { x: nextB.x + shiftX, y: nextB.y + shiftY };
    state.p = { x: state.p.x + shiftX, y: state.p.y + shiftY };
  }

  function setPointRadius(state, radius) {
    const angle = pointAngle(state.a, state.p);
    state.p = polarPoint(state.a, radius, angle);
    state.p.x = clamp(state.p.x, 96, 680);
    state.p.y = clamp(state.p.y, 82, 560);
  }

  function stopDemo(state, cleanup) {
    if (!state.demoTimer) return;
    window.clearInterval(state.demoTimer);
    window.clearTimeout(state.demoTimer);
    cleanup?.timers?.delete?.(state.demoTimer);
    state.demoTimer = null;
  }

  function clearDemoStep(state) {
    state.demoStep = null;
  }

  function bindScene(refs, panelRefs, state, cleanup) {
    const rerender = () => render(refs, panelRefs, state);

    cleanup.add(refs.hudToggle, "click", () => {
      refs.hud.classList.toggle("collapsed");
      refs.hudToggle.textContent = refs.hud.classList.contains("collapsed") ? "+" : "−";
    });

    cleanup.add(refs.svg, "pointerdown", event => {
      const dragTarget = event.target.closest?.("[data-drag]");
      const point = screenToSvg(refs.svg, event);
      stopDemo(state, cleanup);
      clearDemoStep(state);
      state.pointers.set(event.pointerId, point);
      if (state.pointers.size >= 2) {
        const points = Array.from(state.pointers.values()).slice(0, 2);
        state.dragging = "pinch";
        state.activePointerId = null;
        state.lastPointer = midpointOfTouches(points[0], points[1]);
        state.pinch = {
          distance: distanceOfTouches(points[0], points[1]),
          center: state.lastPointer,
          zoom: state.zoom,
          pan: { ...state.pan }
        };
      } else {
        state.activePointerId = event.pointerId;
        state.dragging = dragTarget ? dragTarget.dataset.drag : "pan";
        state.lastPointer = point;
        state.pinch = null;
      }
      refs.shell.classList.add("dragging");
      refs.svg.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    }, { passive: false });

    cleanup.add(refs.svg, "pointermove", event => {
      const raw = screenToSvg(refs.svg, event);
      if (state.pointers.has(event.pointerId)) {
        state.pointers.set(event.pointerId, raw);
      }
      if (state.pointers.size >= 2) {
        const points = Array.from(state.pointers.values()).slice(0, 2);
        const center = midpointOfTouches(points[0], points[1]);
        const nextDistance = distanceOfTouches(points[0], points[1]);
        if (!state.pinch) {
          state.pinch = {
            distance: nextDistance,
            center,
            zoom: state.zoom,
            pan: { ...state.pan }
          };
        }
        const scale = nextDistance / Math.max(1, state.pinch.distance);
        state.pan = {
          x: state.pinch.pan.x + center.x - state.pinch.center.x,
          y: state.pinch.pan.y + center.y - state.pinch.center.y
        };
        zoomAt(state, center, state.pinch.zoom * scale);
        state.dragging = "pinch";
        state.activePointerId = null;
        state.lastPointer = center;
        rerender();
        event.preventDefault();
        return;
      }
      if (state.activePointerId !== event.pointerId || !state.dragging || state.dragging === "pinch") return;
      const adjusted = {
        x: (raw.x - state.pan.x) / state.zoom,
        y: (raw.y - state.pan.y) / state.zoom
      };
      if (state.dragging === "a") {
        state.a = { x: clamp(adjusted.x, 120, 530), y: clamp(adjusted.y, 190, 500) };
      } else if (state.dragging === "b") {
        const vec = { x: adjusted.x - state.a.x, y: adjusted.y - state.a.y };
        const length = clamp(Math.hypot(vec.x, vec.y), 230, 430);
        const unit = normalize(vec);
        state.b = {
          x: clamp(state.a.x + unit.x * length, 112, 704),
          y: clamp(state.a.y + unit.y * length, 104, 560)
        };
      } else if (state.dragging === "p") {
        state.p = { x: clamp(adjusted.x, 92, 684), y: clamp(adjusted.y, 78, 562) };
      } else if (state.dragging === "pan" && state.lastPointer) {
        state.pan.x += raw.x - state.lastPointer.x;
        state.pan.y += raw.y - state.lastPointer.y;
        clampPan(state);
        state.lastPointer = raw;
      }
      rerender();
      event.preventDefault();
    }, { passive: false });

    const endDrag = event => {
      refs.svg.releasePointerCapture?.(event.pointerId);
      state.pointers.delete(event.pointerId);
      if (state.pointers.size >= 2) {
        const points = Array.from(state.pointers.values()).slice(0, 2);
        const center = midpointOfTouches(points[0], points[1]);
        state.pinch = {
          distance: distanceOfTouches(points[0], points[1]),
          center,
          zoom: state.zoom,
          pan: { ...state.pan }
        };
        state.dragging = "pinch";
        state.activePointerId = null;
        state.lastPointer = center;
        return;
      }
      if (state.pointers.size === 1) {
        const [nextPointerId, nextPoint] = Array.from(state.pointers.entries())[0];
        state.activePointerId = nextPointerId;
        state.dragging = "pan";
        state.lastPointer = nextPoint;
        state.pinch = null;
        return;
      }
      state.dragging = null;
      state.activePointerId = null;
      state.lastPointer = null;
      state.pinch = null;
      refs.shell.classList.remove("dragging");
    };
    cleanup.add(refs.svg, "pointerup", endDrag);
    cleanup.add(refs.svg, "pointercancel", endDrag);
    cleanup.add(refs.svg, "pointerleave", endDrag);

    cleanup.add(refs.svg, "wheel", event => {
      stopDemo(state, cleanup);
      clearDemoStep(state);
      const center = screenToSvg(refs.svg, event);
      const factor = Math.exp(-event.deltaY * 0.0012);
      zoomAt(state, center, state.zoom * factor);
      rerender();
      event.preventDefault();
    }, { passive: false });

    cleanup.add(refs.zoomIn, "click", () => {
      stopDemo(state, cleanup);
      clearDemoStep(state);
      zoomAt(state, { x: VIEWBOX_WIDTH / 2, y: VIEWBOX_HEIGHT / 2 }, state.zoom + 0.16);
      rerender();
    });
    cleanup.add(refs.zoomOut, "click", () => {
      stopDemo(state, cleanup);
      clearDemoStep(state);
      zoomAt(state, { x: VIEWBOX_WIDTH / 2, y: VIEWBOX_HEIGHT / 2 }, state.zoom - 0.16);
      rerender();
    });
    cleanup.add(refs.resetView, "click", () => {
      stopDemo(state, cleanup);
      clearDemoStep(state);
      state.pointers.clear();
      state.pinch = null;
      state.dragging = null;
      state.activePointerId = null;
      state.lastPointer = null;
      refs.shell.classList.remove("dragging");
      state.zoom = 1;
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
        stopDemo(state, cleanup);
        clearDemoStep(state);
        state.sceneId = scene.id;
        if (scene.id === "construct") state.progress = 0;
        if (scene.id === "rotate") state.progress = Math.max(state.progress, 30);
        if (scene.id === "congruence" || scene.id === "extract") state.progress = FULL_ANGLE;
        rerender();
      });
    });

    cleanup.add(panelRefs.lengthRange, "input", () => {
      stopDemo(state, cleanup);
      clearDemoStep(state);
      setBaseLength(state, Number(panelRefs.lengthRange.value));
      rerender();
    });
    cleanup.add(panelRefs.angleRange, "input", () => {
      stopDemo(state, cleanup);
      clearDemoStep(state);
      state.progress = Number(panelRefs.angleRange.value);
      rerender();
    });
    cleanup.add(panelRefs.radiusRange, "input", () => {
      stopDemo(state, cleanup);
      clearDemoStep(state);
      setPointRadius(state, Number(panelRefs.radiusRange.value));
      rerender();
    });
    panelRefs.showButtons.forEach(button => {
      cleanup.add(button, "click", () => {
        stopDemo(state, cleanup);
        clearDemoStep(state);
        const key = button.dataset.show;
        state.show[key] = !state.show[key];
        rerender();
      });
    });
    panelRefs.orientationButtons.forEach(button => {
      cleanup.add(button, "click", () => {
        stopDemo(state, cleanup);
        clearDemoStep(state);
        state.orientation = Number(button.dataset.orientation);
        rerender();
      });
    });
    cleanup.add(panelRefs.resetModel, "click", () => {
      stopDemo(state, cleanup);
      const next = makeState();
      Object.keys(state).forEach(key => delete state[key]);
      Object.assign(state, next);
      rerender();
    });
    cleanup.add(panelRefs.autoDemo, "click", () => {
      stopDemo(state, cleanup);
      state.pointers.clear();
      state.pinch = null;
      state.dragging = null;
      state.activePointerId = null;
      state.lastPointer = null;
      state.sceneId = "construct";
      state.progress = 0;
      state.demoStep = "construct";
      state.pan = { x: 0, y: 0 };
      state.zoom = 1;
      state.show.base = true;
      state.show.rotation = true;
      state.show.congruence = true;
      state.show.labels = true;
      rerender();
      const frames = [
        { sceneId: "construct", progress: 0, demoStep: "construct", hold: 1150 },
        { sceneId: "rotate", progress: 12, demoStep: "rotate", hold: 320 },
        { sceneId: "rotate", progress: 24, demoStep: "rotate", hold: 320 },
        { sceneId: "rotate", progress: 36, demoStep: "rotate", hold: 320 },
        { sceneId: "rotate", progress: 48, demoStep: "rotate", hold: 320 },
        { sceneId: "rotate", progress: 60, demoStep: "equal", hold: 1150 },
        { sceneId: "congruence", progress: 60, demoStep: "congruence", hold: 1250 },
        { sceneId: "extract", progress: 60, demoStep: "result", hold: 0 }
      ];
      let frame = 0;
      const applyFrame = () => {
        const current = frames[frame];
        state.sceneId = current.sceneId;
        state.progress = current.progress;
        state.demoStep = current.demoStep;
        rerender();
        if (frame >= frames.length - 1) {
          state.demoTimer = null;
          return;
        }
        const timerId = window.setTimeout(() => {
          cleanup.timers.delete(timerId);
          if (state.demoTimer !== timerId) return;
          frame += 1;
          applyFrame();
        }, current.hold);
        state.demoTimer = timerId;
        cleanup.timers.add(timerId);
      };
      applyFrame();
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
      const sceneHost = makeShadowHost("equilateral-60-rotation-model-scene");
      const panelHost = makeShadowHost("equilateral-60-rotation-model-panel");
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
