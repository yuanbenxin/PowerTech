window.MATH_VISUAL_SCENES = window.MATH_VISUAL_SCENES || {};

(function () {
  const CARD_ID = "jm_topic_m13";
  const STYLE_ID = "math-circle-properties-topic-style";
  const FALLBACK_ERROR = "圆的性质综合专题课件加载失败，请检查本卡片目录内 source.html、style.css?v=794731b986e4 与 scene.js?v=30f0d085f357";
  const mounts = new WeakMap();

  function appendRuntimeVersion(path) {
    const app = window.MathApp || {};
    if (typeof app.appendRuntimeVersion === "function") return app.appendRuntimeVersion(path);
    return path;
  }

  function resolveSourceUrl(context) {
    const folder = String(context?.sceneEntry?.folder || "").replace(/\/+$/, "");
    return appendRuntimeVersion((folder ? folder + "/" : "") + "source.html");
  }

  function createCleanup() {
    return {
      disposed: false,
      listeners: [],
      rafs: new Set(),
      timeouts: new Set(),
      intervals: new Set(),
      roots: [],
      shadowHosts: [],
      addListener(target, type, handler, options) {
        if (!target || typeof target.addEventListener !== "function") return;
        target.addEventListener(type, handler, options);
        this.listeners.push([target, type, handler, options]);
      },
      dispose() {
        if (this.disposed) return;
        this.disposed = true;
        this.listeners.forEach(([target, type, handler, options]) => {
          target.removeEventListener(type, handler, options);
        });
        this.rafs.forEach(id => window.cancelAnimationFrame(id));
        this.timeouts.forEach(id => window.clearTimeout(id));
        this.intervals.forEach(id => window.clearInterval(id));
        this.roots.forEach(root => root.remove());
        this.shadowHosts.forEach(host => host.remove());
      }
    };
  }

  async function fetchTextAsset(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`${url} ${response.status}`);
    return response.text();
  }

  function resolveRelativeUrl(value, sourceUrl) {
    if (!value) return "";
    try {
      const url = new URL(value, sourceUrl);
      if (url.origin !== window.location.origin) return "";
      return url.href;
    } catch (error) {
      return "";
    }
  }

  async function collectSource(doc, sourceUrl) {
    const scriptParts = [];
    const styleParts = [];

    const inlineStyleText = Array.from(doc.querySelectorAll("style"))
      .map(node => node.textContent || "")
      .join("\n");
    if (inlineStyleText) styleParts.push(inlineStyleText);

    for (const node of Array.from(doc.querySelectorAll('link[rel="stylesheet"], link[as="style"]'))) {
      const href = resolveRelativeUrl(node.getAttribute("href"), sourceUrl);
      if (href) styleParts.push(await fetchTextAsset(href));
      node.remove();
    }

    doc.querySelectorAll("script").forEach(node => {
      if (node.src) {
        return;
      }
      const type = String(node.getAttribute("type") || "").trim().toLowerCase();
      if (type && type !== "text/javascript" && type !== "application/javascript") {
        node.remove();
        return;
      }
      scriptParts.push(node.textContent || "");
      node.remove();
    });

    for (const node of Array.from(doc.querySelectorAll("script[src]"))) {
      const type = String(node.getAttribute("type") || "").trim().toLowerCase();
      if (type && type !== "text/javascript" && type !== "application/javascript") {
        node.remove();
        continue;
      }
      const src = resolveRelativeUrl(node.getAttribute("src"), sourceUrl);
      if (src) scriptParts.push(await fetchTextAsset(src));
      node.remove();
    }

    doc.querySelectorAll('style, script[src], link[rel="stylesheet"], link[as="style"]').forEach(node => node.remove());

    return {
      styleText: styleParts.join("\n"),
      script: scriptParts.join("\n"),
      body: doc.body
    };
  }

  function makeShadowHost(className) {
    const host = document.createElement("div");
    host.className = className;
    host.dataset.cardId = CARD_ID;
    const shadow = host.attachShadow({ mode: "open" });
    return { host, shadow };
  }

  function baseStyleText() {
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
      :host {
        --bg-app: #020617;
        --card-bg: rgba(15, 23, 42, 0.64);
        --border-color: rgba(148, 163, 184, 0.16);
        --text-primary: #f8fafc;
        --text-secondary: rgba(226, 232, 240, 0.76);
        --text-muted: rgba(148, 163, 184, 0.74);
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
      .source-shell {
        width: 100%;
        height: 100%;
        min-height: 0;
        overflow: hidden;
      }
      .app-header {
        display: none !important;
      }
      .simulation-column,
      .sandbox-column,
      .sandbox-area {
        position: relative !important;
        width: 100% !important;
        height: 100% !important;
        min-height: 0 !important;
        flex: none !important;
        border-radius: 8px !important;
      }
      .sandbox-container,
      .geometry-canvas-container,
      .canvas-3d-container,
      #canvas-container {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 0;
        overflow: hidden;
        cursor: pointer;
        touch-action: none;
        overscroll-behavior: contain;
      }
      #main-canvas,
      canvas {
        cursor: inherit;
      }
      .control-panel,
      #control-panel {
        position: relative;
        width: 100%;
        max-width: none;
        height: auto;
        min-height: 100%;
        overflow: visible;
        padding: 0;
        background: transparent;
      }
      .circle-properties-topic-panel-scroll {
        width: 100%;
        height: 100%;
        min-height: 0;
        overflow-x: hidden;
        overflow-y: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        background: transparent;
      }
      .circle-properties-topic-panel-scroll::-webkit-scrollbar {
        width: 0;
        height: 0;
      }
      .control-column,
      .control-panel {
        width: 100% !important;
        min-height: 100% !important;
        display: grid !important;
        grid-auto-rows: min-content !important;
        align-content: start !important;
        gap: 8px !important;
        overflow: visible !important;
        padding: 10px !important;
      }
      .panel-section {
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        border: 1px solid rgba(148, 163, 184, 0.16) !important;
        border-radius: 8px !important;
        background: rgba(15, 23, 42, 0.64) !important;
        box-shadow: none !important;
        padding: 10px !important;
        color: #172033 !important;
        backdrop-filter: none !important;
      }
      .panel-section h3,
      .theory-card h3 {
        color: rgba(226, 232, 240, 0.74) !important;
        font-size: 12px !important;
        line-height: 1.2 !important;
        margin-bottom: 8px !important;
      }
      .hud-panel {
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.9)) !important;
        border: 1px solid rgba(148, 163, 184, 0.24) !important;
        color: #0f172a !important;
        box-shadow: 0 18px 42px rgba(15, 23, 42, 0.14), 0 2px 8px rgba(15, 23, 42, 0.06) !important;
        left: 22px !important;
        top: 20px !important;
        width: min(340px, calc(100% - 44px)) !important;
        max-height: min(380px, calc(100% - 36px)) !important;
        border-radius: 14px !important;
        overflow: hidden !important;
        backdrop-filter: blur(18px) saturate(1.08) !important;
        -webkit-backdrop-filter: blur(18px) saturate(1.08) !important;
      }
      .hud-panel.collapsed {
        background: rgba(255, 255, 255, 0.92) !important;
        border-color: rgba(148, 163, 184, 0.28) !important;
        box-shadow: 0 12px 26px rgba(15, 23, 42, 0.13), inset 0 1px 0 rgba(255, 255, 255, 0.9) !important;
        width: 150px !important;
        max-height: 46px !important;
        border-radius: 999px !important;
      }
      .hud-panel.expanded {
        left: 14px !important;
        width: min(300px, calc(100% - 28px)) !important;
        max-height: min(380px, calc(100% - 36px)) !important;
      }
      .hud-header {
        background: rgba(248, 250, 252, 0.72) !important;
        border-bottom-color: rgba(226, 232, 240, 0.76) !important;
        min-height: 44px !important;
        padding: 10px 14px !important;
      }
      .hud-title {
        color: #0f172a !important;
        font-size: 13px !important;
        font-weight: 800 !important;
        white-space: nowrap !important;
      }
      .hud-panel.collapsed .hud-title {
        display: inline-flex !important;
        align-items: center !important;
        color: #334155 !important;
        max-width: none !important;
        overflow: hidden !important;
        text-overflow: clip !important;
      }
      .hud-panel.collapsed .hud-title::before {
        content: none !important;
      }
      .hud-control-btn {
        color: #475569 !important;
        background: rgba(15, 23, 42, 0.05) !important;
        border: 1px solid rgba(148, 163, 184, 0.18) !important;
        width: 28px !important;
        height: 28px !important;
        border-radius: 8px !important;
      }
      .hud-panel.collapsed .hud-control-btn {
        width: 26px !important;
        height: 26px !important;
        flex: 0 0 26px !important;
        border-radius: 50% !important;
        background: rgba(15, 23, 42, 0.06) !important;
      }
      .hud-body,
      .hud-row-val {
        color: #334155 !important;
      }
      .hud-body {
        max-height: calc(min(380px, calc(100vh - 120px)) - 46px) !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        overscroll-behavior: contain !important;
        touch-action: pan-y !important;
        -webkit-overflow-scrolling: touch !important;
        padding: 12px 14px !important;
      }
      .hud-row-label {
        color: #64748b !important;
      }
      .hud-equation-box,
      .hud-equation-box .formula,
      .hud-equation-box .formula > span {
        color: #334155 !important;
      }
      .hud-equation-box .math-num {
        color: #1e293b !important;
        text-shadow: none !important;
      }
      .hud-equation-box .math-num.highlight,
      .hud-equation-box .formula span.highlight {
        color: #2563eb !important;
      }
      .teaching-status-card {
        position: absolute !important;
        top: 18px !important;
        right: 18px !important;
        left: auto !important;
        width: min(240px, calc(100% - 214px)) !important;
        min-width: 180px !important;
        display: grid !important;
        gap: 4px !important;
        padding: 10px 12px !important;
        border-radius: 10px !important;
        background: rgba(255, 255, 255, 0.94) !important;
        border: 1px solid rgba(15, 23, 42, 0.1) !important;
        box-shadow: 0 14px 34px rgba(15, 23, 42, 0.14) !important;
        z-index: 7 !important;
        pointer-events: none !important;
        color: #0f172a !important;
      }
      .teaching-status-card .status-eyebrow {
        font-size: 11px !important;
        font-weight: 800 !important;
        color: #475569 !important;
        letter-spacing: 0.08em !important;
      }
      .teaching-status-card strong {
        font-size: 18px !important;
        line-height: 1.12 !important;
        color: #0f172a !important;
      }
      .teaching-status-card #status-detail {
        font-size: 12px !important;
        line-height: 1.35 !important;
        color: #475569 !important;
      }
      .teaching-status-card.is-demo {
        border-color: rgba(59, 130, 246, 0.22) !important;
        background: linear-gradient(180deg, rgba(239, 246, 255, 0.96), rgba(255, 255, 255, 0.92)) !important;
      }
      .teaching-status-card.is-proof {
        border-color: rgba(139, 92, 246, 0.24) !important;
        background: linear-gradient(180deg, rgba(245, 243, 255, 0.96), rgba(255, 255, 255, 0.92)) !important;
      }
      .teaching-status-card.is-result {
        border-color: rgba(16, 185, 129, 0.24) !important;
        background: linear-gradient(180deg, rgba(240, 253, 244, 0.96), rgba(255, 255, 255, 0.92)) !important;
      }
      .btn-preset,
      .btn-step,
      .btn-secondary,
      .btn-primary,
      .btn-icon {
        min-height: 34px !important;
        border: 1px solid rgba(148, 163, 184, 0.18) !important;
        border-radius: 8px !important;
        background: rgba(2, 6, 23, 0.36) !important;
        color: rgba(226, 232, 240, 0.82) !important;
        box-shadow: none !important;
        touch-action: manipulation;
      }
      .btn-preset {
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        display: grid !important;
        grid-template-columns: 28px minmax(0, 1fr) !important;
        column-gap: 10px !important;
        align-items: center !important;
        padding: 10px !important;
        text-align: left !important;
      }
      .preset-num {
        grid-row: 1 / span 2 !important;
        width: 26px !important;
        height: 26px !important;
        border-radius: 8px !important;
        margin: 0 !important;
        background: rgba(148, 163, 184, 0.14) !important;
        color: rgba(226, 232, 240, 0.78) !important;
      }
      .btn-preset.active .preset-num {
        background: rgba(250, 204, 21, 0.88) !important;
        color: #111827 !important;
      }
      .btn-preset.active::after {
        background: #3b82f6 !important;
      }
      .btn-preset.active,
      .btn-step.active,
      .btn-primary,
      .highlight-btn {
        border-color: rgba(250, 204, 21, 0.42) !important;
        background: rgba(250, 204, 21, 0.12) !important;
        color: #fef3c7 !important;
      }
      .btn-preset:hover,
      .btn-step:hover,
      .btn-secondary:hover,
      .btn-primary:hover,
      .btn-icon:hover {
        border-color: rgba(250, 204, 21, 0.3) !important;
        background: rgba(15, 23, 42, 0.82) !important;
        color: #172033 !important;
        transform: none !important;
      }
      .btn-step {
        min-height: 36px !important;
        padding: 8px 9px !important;
      }
      .step-index {
        background: rgba(148, 163, 184, 0.14) !important;
        color: rgba(226, 232, 240, 0.78) !important;
      }
      .btn-step.active .step-index {
        background: rgba(250, 204, 21, 0.88) !important;
        color: #111827 !important;
      }
      .demo-step-btn {
        width: 100% !important;
      }
      .preset-desc,
      .slider-label,
      .btn-mark-mode,
      .btn-mark-mode small,
      .theory-content,
      .theory-content p,
      .theory-content li {
        color: rgba(203, 213, 225, 0.78) !important;
      }
      .mark-mode-grid {
        display: grid !important;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        gap: 8px !important;
      }
      .btn-mark-mode {
        min-height: 42px !important;
        border: 1px solid rgba(148, 163, 184, 0.18) !important;
        border-radius: 8px !important;
        background: rgba(2, 6, 23, 0.28) !important;
        box-shadow: none !important;
        padding: 8px 6px !important;
      }
      .btn-mark-mode span {
        color: rgba(248, 250, 252, 0.88) !important;
        font-size: 11.5px !important;
        font-weight: 800 !important;
      }
      .btn-mark-mode small {
        color: rgba(148, 163, 184, 0.8) !important;
        font-size: 9.5px !important;
      }
      .btn-mark-mode.active {
        border-color: rgba(250, 204, 21, 0.42) !important;
        background: rgba(250, 204, 21, 0.11) !important;
      }
      .btn-mark-mode.active span {
        color: #fef3c7 !important;
      }
      .theory-mini-card,
      .theory-result-card {
        border: 1px solid rgba(148, 163, 184, 0.14) !important;
        border-radius: 8px !important;
        background: rgba(2, 6, 23, 0.24) !important;
        color: #f8fafc !important;
      }
      .theory-result-card {
        border-color: rgba(250, 204, 21, 0.24) !important;
        background: rgba(250, 204, 21, 0.08) !important;
      }
      .theory-mini-card span,
      .theory-result-card span,
      .theory-step-note.muted {
        color: rgba(148, 163, 184, 0.86) !important;
      }
      .theory-mini-card strong,
      .theory-result-card strong,
      .theory-step-note {
        color: rgba(248, 250, 252, 0.92) !important;
      }
      .proof-flow {
        display: grid !important;
        gap: 8px !important;
      }
      .proof-chip,
      .proof-result {
        display: grid !important;
        grid-template-columns: 44px minmax(0, 1fr) !important;
        align-items: center !important;
        gap: 8px !important;
        padding: 9px 10px !important;
        border-radius: 8px !important;
        background: rgba(2, 6, 23, 0.24) !important;
        border: 1px solid rgba(148, 163, 184, 0.14) !important;
      }
      .proof-chip span,
      .proof-result span {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        min-height: 24px !important;
        border-radius: 7px !important;
        background: rgba(59, 130, 246, 0.16) !important;
        color: #bfdbfe !important;
        font-size: 11px !important;
        font-weight: 800 !important;
      }
      .proof-chip strong,
      .proof-result strong {
        min-width: 0 !important;
        color: rgba(248, 250, 252, 0.9) !important;
        font-size: 12.5px !important;
        line-height: 1.45 !important;
      }
      .proof-result {
        border-color: rgba(250, 204, 21, 0.24) !important;
        background: rgba(250, 204, 21, 0.08) !important;
      }
      .proof-result span {
        background: rgba(250, 204, 21, 0.16) !important;
        color: #fef3c7 !important;
      }
      .proof-result strong {
        color: #fde68a !important;
        font-size: 13.5px !important;
      }
      .canvas-info-card {
        background: rgba(255, 255, 255, 0.94) !important;
        border-color: rgba(15, 23, 42, 0.1) !important;
        color: #0f172a !important;
      }
      .canvas-info-card b {
        color: #0f172a !important;
      }
      .canvas-info-card span {
        color: #475569 !important;
      }
      .canvas-info-card em {
        color: #d97706 !important;
      }
      .canvas-info-card.fixed-corner {
        top: 18px !important;
        right: 18px !important;
        left: auto !important;
        transform: none !important;
        min-width: 170px !important;
        max-width: 230px !important;
        z-index: 6 !important;
      }
      .slider-val-indicator,
      .preset-name {
        color: #f8fafc !important;
      }
      .controls-row {
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) auto !important;
        gap: 8px !important;
      }
      .controls-row.flex-wrap {
        display: grid !important;
        grid-template-columns: repeat(auto-fit, minmax(118px, 1fr)) !important;
        gap: 8px !important;
      }
      .presets-grid,
      .slider-group,
      .theory-content {
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
      }
      .controls-row.flex-wrap > button {
        width: 100% !important;
        min-width: 0 !important;
        white-space: normal !important;
      }
      .flex-btn {
        min-width: 0 !important;
        border-radius: 8px !important;
        padding: 9px 10px !important;
      }
      .geo-label {
        fill: #111827 !important;
        stroke: rgba(255, 255, 255, 0.92) !important;
        stroke-width: 4px !important;
        paint-order: stroke !important;
      }
      .geo-triangle-patch.patch-main {
        fill: rgba(59, 130, 246, 0.14) !important;
        stroke: rgba(37, 99, 235, 0.36) !important;
      }
      .geo-triangle-patch.patch-rotated {
        fill: rgba(245, 158, 11, 0.16) !important;
        stroke: rgba(217, 119, 6, 0.42) !important;
      }
      .geo-line-construction {
        stroke: #7c3aed !important;
        stroke-width: 3px !important;
        stroke-linecap: round !important;
        stroke-dasharray: 8 5 !important;
        opacity: 0.9 !important;
      }
      .geo-equality-tick line {
        stroke-width: 3px !important;
        stroke-linecap: round !important;
        filter: drop-shadow(0 1px 2px rgba(15, 23, 42, 0.18)) !important;
      }
      .geo-equality-tick.tick-midpoint line {
        stroke: #10b981 !important;
      }
      .geo-equality-tick.tick-median line {
        stroke: #3b82f6 !important;
      }
      .geo-equality-tick.tick-corresponding line {
        stroke: #8b5cf6 !important;
      }
      .geo-rotation-guide {
        fill: none !important;
        stroke: rgba(59, 130, 246, 0.45) !important;
        stroke-width: 2.5px !important;
        stroke-linecap: round !important;
        stroke-dasharray: 8 6 !important;
      }
      .geo-construction-point circle {
        fill: #ffffff !important;
        stroke: #7c3aed !important;
        stroke-width: 3px !important;
      }
      .geo-construction-point text {
        fill: #111827 !important;
        stroke: rgba(255, 255, 255, 0.92) !important;
        stroke-width: 4px !important;
        paint-order: stroke !important;
        font-weight: 800 !important;
      }
      .brace-label {
        border-radius: 8px !important;
        color: #0f172a !important;
        background: rgba(255, 255, 255, 0.9) !important;
        border-color: rgba(15, 23, 42, 0.1) !important;
        box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12) !important;
      }
      .brace-label.angle {
        color: #b45309 !important;
        background: rgba(255, 251, 235, 0.94) !important;
        border-color: rgba(245, 158, 11, 0.28) !important;
      }
      .canvas-controls {
        right: 18px !important;
        bottom: 18px !important;
      }
      .btn-zoom {
        width: 38px !important;
        height: 38px !important;
        background: rgba(255, 255, 255, 0.9) !important;
        color: #475569 !important;
        border: 1px solid rgba(148, 163, 184, 0.24) !important;
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12) !important;
        cursor: pointer !important;
      }
      .geo-point-wrapper.draggable,
      .geo-point-wrapper.draggable * {
        cursor: grab !important;
      }
      .geo-point-wrapper.draggable:active,
      .geo-point-wrapper.draggable:active * {
        cursor: grabbing !important;
      }
      input[type="range"] {
        accent-color: #facc15;
      }
      .modal-overlay {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
      }
      .particles-canvas {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
      }
      @media (pointer: coarse), (hover: none), (max-width: 768px) {
        #hint-keyboard {
          display: none;
        }
        .hud-panel {
          left: 12px !important;
          top: 12px !important;
          width: min(320px, calc(100% - 24px)) !important;
          max-height: 58% !important;
        }
        .hud-panel.collapsed {
          width: 140px !important;
        }
        .teaching-status-card {
          top: 12px !important;
          right: 12px !important;
          width: min(210px, calc(100% - 166px)) !important;
          min-width: 150px !important;
          padding: 9px 10px !important;
        }
        .teaching-status-card strong {
          font-size: 15px !important;
        }
        .canvas-controls {
          right: 12px !important;
          bottom: 12px !important;
        }
      }
    `;
  }


  function topicCoursewareStyle() {
    return `
      .app-container,
      .app-main {
        width: 100% !important;
        height: 100% !important;
        min-height: 0 !important;
        overflow: hidden !important;
        background: transparent !important;
      }
      .source-shell {
        background: #f8fafc !important;
        border-radius: 8px !important;
      }
      .sandbox-column,
      .sandbox-area,
      .simulation-column {
        position: relative !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 10px !important;
        padding: 10px !important;
        background: #f8fafc !important;
        box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.18) !important;
        border: 0 !important;
      }
      .geometry-canvas-container,
      .canvas-3d-container {
        flex: 1 1 auto !important;
        min-height: 0 !important;
        width: 100% !important;
        border-radius: 8px !important;
        overflow: hidden !important;
        touch-action: none !important;
        background:
          radial-gradient(circle at center, rgba(148, 163, 184, 0.24) 1px, transparent 1.4px) 0 0 / 20px 20px,
          linear-gradient(180deg, #ffffff, #f8fafc) !important;
      }
      #geometry-svg,
      #canvas-3d,
      canvas {
        width: 100% !important;
        height: 100% !important;
        display: block !important;
        background: transparent !important;
      }
      .projection-row {
        flex: 0 0 auto !important;
        width: 100% !important;
        max-height: 34% !important;
        min-height: 136px !important;
        display: grid !important;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        gap: 8px !important;
      }
      .proj-plate-card {
        min-width: 0 !important;
        overflow: hidden !important;
      }
      .proj-grid {
        min-width: 0 !important;
      }
      .rotation-tip {
        pointer-events: none !important;
        max-width: calc(100% - 24px) !important;
      }
      .analysis-hud,
      .analysis-hud-card {
        position: absolute !important;
        z-index: 12 !important;
        left: 18px !important;
        top: 18px !important;
        width: min(360px, calc(100% - 36px)) !important;
        max-height: min(420px, calc(100% - 36px)) !important;
        overflow: hidden !important;
        border-radius: 14px !important;
        border: 1px solid rgba(148, 163, 184, 0.24) !important;
        background: rgba(255, 255, 255, 0.94) !important;
        color: #0f172a !important;
        box-shadow: 0 18px 42px rgba(15, 23, 42, 0.16) !important;
      }
      .analysis-hud.collapsed,
      .analysis-hud-card.collapsed {
        width: auto !important;
        min-width: 176px !important;
        max-width: calc(100% - 36px) !important;
        max-height: 44px !important;
        border-radius: 999px !important;
        border-color: rgba(226, 232, 240, 0.98) !important;
        background: rgba(255, 255, 255, 0.96) !important;
        box-shadow: 0 8px 20px rgba(15, 23, 42, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.92) !important;
      }
      .analysis-hud.collapsed .hud-content,
      .analysis-hud-card.collapsed .hud-content {
        display: none !important;
      }
      .hud-header,
      #btn-hud-toggle.btn-hud-toggle,
      .analysis-hud > .btn-hud-toggle {
        min-height: 42px !important;
        width: 100% !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 10px !important;
        padding: 8px 10px 8px 14px !important;
        border: 0 !important;
        background: transparent !important;
        color: #1e293b !important;
        font-size: 12.5px !important;
        font-weight: 800 !important;
        cursor: pointer !important;
      }
      .hud-content {
        max-height: calc(min(420px, calc(100vh - 120px)) - 44px) !important;
        overflow: auto !important;
        padding: 10px 12px 12px !important;
        color: #334155 !important;
        line-height: 1.48 !important;
      }
      .hud-content p,
      .hud-content li,
      .hud-content b,
      .hud-content strong {
        color: inherit !important;
      }
      .source-panel-scroll,
      .circle-properties-topic-panel-scroll {
        padding: 0 !important;
      }
      .control-column,
      .control-panel {
        width: 100% !important;
        min-width: 0 !important;
        max-width: 100% !important;
        padding: 10px !important;
        gap: 8px !important;
        background: transparent !important;
        box-shadow: none !important;
        border: 0 !important;
        display: grid !important;
        grid-auto-rows: min-content !important;
        align-content: start !important;
      }
      .panel-section,
      .tab-selection-container,
      .formula-section,
      .stats-section,
      .topic-teaching-flow,
      .actions-section {
        width: 100% !important;
        min-width: 0 !important;
        max-width: 100% !important;
        padding: 10px !important;
        border-radius: 8px !important;
        border: 1px solid rgba(148, 163, 184, 0.16) !important;
        background: rgba(15, 23, 42, 0.64) !important;
        box-shadow: none !important;
        color: #f8fafc !important;
        overflow: hidden !important;
      }
      .section-title,
      .topic-flow-title,
      .panel-title,
      .panel-section h2,
      .panel-section h3 {
        color: rgba(226, 232, 240, 0.86) !important;
        font-size: 12px !important;
        line-height: 1.25 !important;
        font-weight: 800 !important;
        margin: 0 0 8px !important;
      }
      .tab-grid,
      .theme-tabs,
      .snap-buttons,
      .presets-row,
      .action-buttons-grid,
      .action-grid,
      .vis-options-row {
        width: 100% !important;
        min-width: 0 !important;
        display: grid !important;
        grid-template-columns: repeat(auto-fit, minmax(112px, 1fr)) !important;
        gap: 8px !important;
        padding: 0 !important;
        border: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
      }
      .height-control-grid {
        width: 100% !important;
        min-width: 0 !important;
        display: grid !important;
        grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
        gap: 6px !important;
      }
      .stats-grid,
      .live-stats-container {
        width: 100% !important;
        min-width: 0 !important;
        display: grid !important;
        gap: 8px !important;
      }
      .stat-card,
      .stat-item,
      .formula-card-body,
      .quest-card,
      .option-checkbox,
      .height-control-cell,
      .control-stats-row {
        min-width: 0 !important;
        max-width: 100% !important;
        border-radius: 8px !important;
        border: 1px solid rgba(148, 163, 184, 0.14) !important;
        background: rgba(2, 6, 23, 0.24) !important;
        color: rgba(226, 232, 240, 0.82) !important;
        box-shadow: none !important;
      }
      .formula-card-body {
        padding: 10px !important;
        overflow-wrap: anywhere !important;
      }
      .formula-card-body *,
      .quest-card *,
      .stat-card *,
      .stat-item * {
        max-width: 100% !important;
        overflow-wrap: anywhere !important;
      }
      button,
      .tab-btn,
      .btn-snap,
      .btn-preset,
      .btn-clear-cubes,
      .btn-quest-start,
      .btn-quest-submit,
      .action-grid button,
      .action-buttons-grid button,
      .height-control-cell button,
      .height-cell button {
        min-width: 0 !important;
        min-height: 34px !important;
        border: 1px solid rgba(148, 163, 184, 0.18) !important;
        border-radius: 8px !important;
        background: rgba(2, 6, 23, 0.36) !important;
        color: rgba(226, 232, 240, 0.86) !important;
        box-shadow: none !important;
        transform: none !important;
        touch-action: manipulation !important;
        white-space: normal !important;
        line-height: 1.25 !important;
      }
      button:hover,
      .tab-btn:hover,
      .btn-snap:hover,
      .btn-preset:hover,
      .btn-clear-cubes:hover,
      .btn-quest-start:hover,
      .btn-quest-submit:hover,
      .action-grid button:hover,
      .action-buttons-grid button:hover {
        border-color: rgba(250, 204, 21, 0.3) !important;
        background: rgba(15, 23, 42, 0.82) !important;
        color: #f8fafc !important;
      }
      button.active,
      .tab-btn.active,
      .btn-snap.active,
      .btn-preset.active {
        border-color: rgba(250, 204, 21, 0.42) !important;
        background: rgba(250, 204, 21, 0.12) !important;
        color: #fef3c7 !important;
      }
      .analysis-hud-card .hud-title {
        display: inline-flex !important;
        align-items: center !important;
        gap: 7px !important;
        min-width: 0 !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
        color: #172033 !important;
        line-height: 1 !important;
      }
      .analysis-hud-card .hud-title i {
        display: none !important;
      }
      .analysis-hud-card.collapsed {
        min-width: 176px !important;
        height: 44px !important;
      }
      .analysis-hud-card.collapsed .hud-title::before {
        content: none !important;
        display: none !important;
      }
      .analysis-hud-card.collapsed .btn-hud-toggle .fa-chevron-down::before,
      .analysis-hud-card.collapsed .hud-control-btn .fa-chevron-down::before {
        content: "\\203a" !important;
        font-size: 18px !important;
        line-height: 1 !important;
      }
      .analysis-hud-card .hud-control-btn,
      .analysis-hud-card .btn-hud-toggle {
        width: 28px !important;
        height: 28px !important;
        min-width: 28px !important;
        display: inline-grid !important;
        place-items: center !important;
        border-radius: 999px !important;
        border: 1px solid rgba(203, 213, 225, 0.92) !important;
        background: rgba(248, 250, 252, 0.96) !important;
        color: #475569 !important;
        padding: 0 !important;
      }
      .analysis-hud-card.collapsed .hud-control-btn,
      .analysis-hud-card.collapsed .btn-hud-toggle {
        border-color: rgba(203, 213, 225, 0.92) !important;
        background: rgba(248, 250, 252, 0.96) !important;
        color: #475569 !important;
      }
      .circle-properties-topic-panel-scroll {
        --m13-panel-bg: rgba(7, 12, 24, 0.76);
        --m13-panel-bg-strong: rgba(10, 16, 31, 0.9);
        --m13-panel-border: rgba(148, 163, 184, 0.24);
        --m13-panel-hot: rgba(245, 158, 11, 0.62);
        --m13-panel-text: #f8fafc;
        --m13-panel-muted: #aeb8c7;
        --m13-panel-blue: #60a5fa;
        --m13-panel-green: #34d399;
        --m13-panel-amber: #fbbf24;
        --m13-panel-purple: #a78bfa;
      }
      .circle-properties-topic-panel-scroll .control-panel {
        gap: 10px !important;
        padding: 10px 2px 14px !important;
      }
      .circle-properties-topic-panel-scroll .tab-selection-container,
      .circle-properties-topic-panel-scroll .panel-section,
      .circle-properties-topic-panel-scroll .topic-teaching-flow {
        position: relative !important;
        border-radius: 8px !important;
        border: 1px solid var(--m13-panel-border) !important;
        background:
          linear-gradient(135deg, rgba(96, 165, 250, 0.08), rgba(251, 191, 36, 0.055)),
          var(--m13-panel-bg) !important;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.07), 0 14px 30px rgba(0, 0, 0, 0.18) !important;
        backdrop-filter: blur(12px) !important;
      }
      .circle-properties-topic-panel-scroll .tab-btn,
      .circle-properties-topic-panel-scroll .action-grid button,
      .circle-properties-topic-panel-scroll .topic-reset-current {
        position: relative !important;
        min-height: 40px !important;
        border-radius: 8px !important;
        border: 1px solid rgba(148, 163, 184, 0.2) !important;
        background: rgba(255, 255, 255, 0.055) !important;
        color: #e5edf8 !important;
        font-size: 12px !important;
        font-weight: 850 !important;
        line-height: 1.25 !important;
      }
      .circle-properties-topic-panel-scroll .tab-btn.active,
      .circle-properties-topic-panel-scroll .action-grid button.active,
      .circle-properties-topic-panel-scroll .topic-flow-step.is-active {
        color: #ffffff !important;
        border-color: var(--m13-panel-hot) !important;
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.22), rgba(96, 165, 250, 0.1)) !important;
      }
      .circle-properties-topic-panel-scroll .tab-btn.active::before {
        content: "";
        position: absolute;
        left: 0;
        top: 8px;
        bottom: 8px;
        width: 4px;
        border-radius: 0 999px 999px 0;
        background: linear-gradient(180deg, var(--m13-panel-blue), var(--m13-panel-amber));
        box-shadow: 0 0 16px rgba(96, 165, 250, 0.42);
      }
      .circle-properties-topic-panel-scroll .stats-grid,
      .circle-properties-topic-panel-scroll #live-stats-container {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }
      .circle-properties-topic-panel-scroll .stat-card,
      .circle-properties-topic-panel-scroll .stat-item {
        --m13-stat-accent: var(--m13-panel-blue);
        position: relative !important;
        padding-left: 14px !important;
        background: rgba(255, 255, 255, 0.07) !important;
        color: #edf4ff !important;
      }
      .circle-properties-topic-panel-scroll .stat-card::before,
      .circle-properties-topic-panel-scroll .stat-item::before {
        content: "";
        position: absolute;
        left: 0;
        top: 8px;
        bottom: 8px;
        width: 4px;
        border-radius: 0 999px 999px 0;
        background: var(--m13-stat-accent);
      }
      .circle-properties-topic-panel-scroll .stat-card:nth-child(2),
      .circle-properties-topic-panel-scroll .stat-item:nth-child(2) { --m13-stat-accent: var(--m13-panel-purple); }
      .circle-properties-topic-panel-scroll .stat-card:nth-child(3),
      .circle-properties-topic-panel-scroll .stat-item:nth-child(3) { --m13-stat-accent: var(--m13-panel-amber); }
      .circle-properties-topic-panel-scroll .stat-card:nth-child(4),
      .circle-properties-topic-panel-scroll .stat-item:nth-child(4) { --m13-stat-accent: var(--m13-panel-green); }
      .circle-properties-topic-panel-scroll .formula-card-body {
        border-radius: 8px !important;
        background: rgba(3, 7, 18, 0.28) !important;
        color: #dbe7f6 !important;
      }
      .circle-properties-topic-panel-scroll .panel-formula-summary {
        display: grid !important;
        gap: 9px !important;
        align-items: start !important;
      }
      .circle-properties-topic-panel-scroll .formula-kicker {
        display: inline-flex !important;
        width: fit-content !important;
        align-items: center !important;
        min-height: 22px !important;
        border-radius: 999px !important;
        border: 1px solid rgba(96, 165, 250, 0.24) !important;
        background: rgba(96, 165, 250, 0.12) !important;
        color: #bfdbfe !important;
        padding: 2px 8px !important;
        font-size: 10px !important;
        font-weight: 900 !important;
        letter-spacing: 0.08em !important;
      }
      .circle-properties-topic-panel-scroll .formula-chip-row {
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 6px !important;
      }
      .circle-properties-topic-panel-scroll .formula-card-body strong,
      .circle-properties-topic-panel-scroll .formula-card-body b {
        color: #f8fafc !important;
      }
      :host(.circle-properties-topic-scene) #geometry-svg .geo-line {
        vector-effect: non-scaling-stroke !important;
        filter: drop-shadow(0 1px 1px rgba(15, 23, 42, 0.12)) !important;
      }
      :host(.circle-properties-topic-scene) #geometry-svg .geo-line:not(.dashed) {
        stroke-width: 2.6px !important;
      }
      :host(.circle-properties-topic-scene) #geometry-svg .geo-line.blue { stroke: #2563eb !important; }
      :host(.circle-properties-topic-scene) #geometry-svg .geo-line.orange { stroke: #d97706 !important; }
      :host(.circle-properties-topic-scene) #geometry-svg .geo-line.purple { stroke: #7c3aed !important; }
      :host(.circle-properties-topic-scene) #geometry-svg .geo-line.green { stroke: #059669 !important; }
      :host(.circle-properties-topic-scene) #geometry-svg .geo-line.red { stroke: #dc2626 !important; }
      :host(.circle-properties-topic-scene) #geometry-svg .geo-text {
        font-size: 13px !important;
        font-weight: 900 !important;
        paint-order: stroke !important;
        stroke: rgba(255, 255, 255, 0.92) !important;
        stroke-width: 4px !important;
      }
      :host(.circle-properties-topic-scene) #geometry-svg .drag-point {
        cursor: grab !important;
        filter: drop-shadow(0 3px 7px rgba(37, 99, 235, 0.2)) !important;
      }
      :host(.circle-properties-topic-scene) #geometry-svg .drag-point:active {
        cursor: grabbing !important;
      }
      :host(.circle-properties-topic-scene) #geometry-svg .drag-point-hit {
        fill: rgba(37, 99, 235, 0.001) !important;
        stroke: transparent !important;
        pointer-events: all !important;
      }
      :host(.circle-properties-topic-scene) #geometry-svg .drag-point-outer {
        animation: m13-drag-ring 1.9s ease-in-out infinite;
        fill: rgba(37, 99, 235, 0.16) !important;
        stroke: #2563eb !important;
        stroke-width: 1.7px !important;
      }
      :host(.circle-properties-topic-scene) #geometry-svg .drag-point-inner {
        fill: #ffffff !important;
        stroke: #2563eb !important;
        stroke-width: 2.5px !important;
      }
      :host(.circle-properties-topic-scene) #geometry-svg .drag-point.is-dragging .drag-point-hit {
        fill: rgba(37, 99, 235, 0.1) !important;
        stroke: rgba(37, 99, 235, 0.22) !important;
        stroke-width: 1.5px !important;
      }
      :host(.circle-properties-topic-scene) #geometry-svg .drag-point.is-dragging .drag-point-outer {
        animation: none !important;
        fill: rgba(245, 158, 11, 0.22) !important;
        stroke: #d97706 !important;
        stroke-width: 3px !important;
      }
      :host(.circle-properties-topic-scene) #geometry-svg .drag-point.is-dragging .drag-point-inner {
        stroke: #d97706 !important;
      }
      .circle-properties-topic-panel-scroll .hover-term {
        border-radius: 7px !important;
        border: 1px solid rgba(148, 163, 184, 0.2) !important;
        background: rgba(15, 23, 42, 0.72) !important;
        color: #dbeafe !important;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
      }
      .circle-properties-topic-panel-scroll .hover-term:hover,
      .circle-properties-topic-panel-scroll .hover-term.locked-active {
        border-color: rgba(250, 204, 21, 0.46) !important;
        background: rgba(250, 204, 21, 0.14) !important;
        color: #fef3c7 !important;
        transform: none !important;
      }
      .circle-properties-topic-panel-scroll .stat-item.interactive-shape:hover {
        border-color: rgba(250, 204, 21, 0.34) !important;
        background: rgba(255, 255, 255, 0.1) !important;
      }
      @keyframes m13-drag-ring {
        0%, 100% { opacity: 0.74; stroke-width: 1.5px; }
        50% { opacity: 1; stroke-width: 2.4px; }
      }
      @media (pointer: coarse), (hover: none), (max-width: 768px) {
        :host(.circle-properties-topic-scene) #geometry-svg .drag-point {
          touch-action: none !important;
        }
        :host(.circle-properties-topic-scene) #geometry-svg .drag-point-hit {
          r: 34px !important;
        }
        :host(.circle-properties-topic-scene) #geometry-svg .drag-point-outer {
          r: 10px !important;
          stroke-width: 2.3px !important;
        }
        :host(.circle-properties-topic-scene) #geometry-svg .drag-point-inner {
          r: 4px !important;
          stroke-width: 3px !important;
        }
        .circle-properties-topic-panel-scroll .tab-btn,
        .circle-properties-topic-panel-scroll .btn-action,
        .circle-properties-topic-panel-scroll .hover-term,
        .circle-properties-topic-panel-scroll .stat-item {
          min-height: 44px !important;
          touch-action: manipulation !important;
        }
        .circle-properties-topic-panel-scroll .hover-term {
          display: inline-flex !important;
          align-items: center !important;
        }
        .circle-properties-topic-panel-scroll .control-panel {
          gap: 8px !important;
          padding: 8px 2px 10px !important;
        }
        .circle-properties-topic-panel-scroll .topic-teaching-flow {
          padding: 9px !important;
        }
        .circle-properties-topic-panel-scroll .topic-flow-steps {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
        .circle-properties-topic-panel-scroll .tab-selection-container,
        .circle-properties-topic-panel-scroll .panel-section {
          padding: 9px !important;
        }
        .circle-properties-topic-panel-scroll .formula-card-body {
          max-height: 126px !important;
          overflow-y: auto !important;
        }
        .circle-properties-topic-panel-scroll .action-grid {
          grid-template-columns: minmax(0, 1fr) !important;
        }
      }
      .height-control-cell {
        display: grid !important;
        grid-template-rows: 24px minmax(22px, auto) 24px !important;
        align-items: stretch !important;
        gap: 2px !important;
        padding: 4px !important;
        overflow: hidden !important;
      }
      .height-control-cell button {
        min-height: 22px !important;
        height: 24px !important;
        padding: 0 !important;
        border-color: transparent !important;
        background: rgba(148, 163, 184, 0.16) !important;
        color: rgba(226, 232, 240, 0.82) !important;
      }
      .height-control-cell span {
        color: #f8fafc !important;
        font-size: 13px !important;
        font-weight: 900 !important;
        line-height: 1.2 !important;
      }
      .fa-chevron-down::before { content: "\\25be"; }
      .fa-graduation-cap::before { content: "\\25c7"; }
      .fa-compass-drafting::before { content: "\\25ce"; }
      .katex-lite,
      .katex-display {
        display: inline-block !important;
        max-width: 100% !important;
        color: inherit !important;
        font-family: "Microsoft YaHei UI", "Microsoft YaHei", system-ui, sans-serif !important;
        white-space: normal !important;
        overflow-wrap: anywhere !important;
      }
      .topic-teaching-flow {
        display: grid !important;
        gap: 9px !important;
      }
      .topic-flow-head {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 8px !important;
      }
      .topic-flow-title {
        margin: 0 !important;
      }
      .topic-reset-current {
        min-height: 28px !important;
        padding: 5px 9px !important;
        font-size: 11px !important;
      }
      .topic-flow-steps {
        display: grid !important;
        grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
        gap: 6px !important;
      }
      .topic-flow-step {
        min-width: 0 !important;
        border-radius: 8px !important;
        border: 1px solid rgba(148, 163, 184, 0.14) !important;
        background: rgba(2, 6, 23, 0.24) !important;
        padding: 6px 5px !important;
        color: rgba(226, 232, 240, 0.84) !important;
        text-align: center !important;
        font-size: 10.5px !important;
        font-weight: 800 !important;
        line-height: 1.2 !important;
      }
      .topic-flow-step.is-active {
        border-color: rgba(250, 204, 21, 0.36) !important;
        background: rgba(250, 204, 21, 0.1) !important;
        color: #fef3c7 !important;
      }
      @media (max-width: 720px), (max-height: 560px) {
        .sandbox-column,
        .sandbox-area,
        .simulation-column {
          padding: 8px !important;
          gap: 8px !important;
        }
        .analysis-hud,
        .analysis-hud-card {
          left: 10px !important;
          top: 10px !important;
          width: min(320px, calc(100% - 20px)) !important;
          max-height: 58% !important;
        }
        .analysis-hud.collapsed,
        .analysis-hud-card.collapsed {
          width: auto !important;
          max-width: calc(100% - 20px) !important;
        }
        .projection-row {
          min-height: 120px !important;
          gap: 6px !important;
        }
        .height-control-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        }
      }
    `;
  }

  function unifiedHudBoardStyle() {
    return `
      /* 平台嵌入态 HUD 统一规则：完整标题、完整内容、无内部滚动 */
      #hud-chalkboard-panel.hud-panel,
      #hud-chalkboard-panel.hud-panel.expanded,
      #hud-chalkboard-panel.hud-panel:not(.collapsed) {
        left: 12px !important;
        top: 12px !important;
        width: min(300px, calc(100% - 24px)) !important;
        max-height: none !important;
        overflow: hidden !important;
        transform-origin: top left !important;
      }
      #hud-chalkboard-panel.hud-panel.collapsed {
        width: auto !important;
        min-width: max-content !important;
        max-width: calc(100% - 24px) !important;
        max-height: none !important;
        overflow: hidden !important;
      }
      #hud-chalkboard-panel.hud-panel.collapsed .hud-body,
      #hud-chalkboard-panel.hud-panel.collapsed #steps-hud-chalkboard {
        display: none !important;
      }
      #hud-chalkboard-panel .hud-header {
        min-height: 38px !important;
        padding: 7px 10px !important;
        gap: 8px !important;
      }
      #hud-chalkboard-panel .hud-title,
      #hud-chalkboard-panel.hud-panel.collapsed .hud-title {
        max-width: none !important;
        overflow: visible !important;
        text-overflow: clip !important;
        white-space: nowrap !important;
        font-size: 12.5px !important;
        line-height: 1.2 !important;
      }
      #hud-chalkboard-panel .hud-control-btn {
        width: 26px !important;
        height: 26px !important;
        flex: 0 0 26px !important;
      }
      #hud-chalkboard-panel .hud-body,
      #hud-chalkboard-panel #steps-hud-chalkboard {
        max-height: none !important;
        overflow: visible !important;
        overflow-x: visible !important;
        overflow-y: visible !important;
        flex: 0 0 auto !important;
        padding: 8px 10px 10px !important;
        font-size: 11.5px !important;
        line-height: 1.35 !important;
        scrollbar-gutter: auto !important;
        overscroll-behavior: auto !important;
        touch-action: manipulation !important;
        -webkit-overflow-scrolling: auto !important;
      }
      #hud-chalkboard-panel .hud-row {
        margin-bottom: 6px !important;
        padding-bottom: 5px !important;
      }
      #hud-chalkboard-panel .hud-row-label {
        font-size: 10.5px !important;
        line-height: 1.25 !important;
        margin-bottom: 1px !important;
      }
      #hud-chalkboard-panel .hud-row-val {
        font-size: 11.5px !important;
        line-height: 1.35 !important;
      }
      #hud-chalkboard-panel .hud-equation-box,
      #hud-chalkboard-panel .hud-proof-line,
      #hud-chalkboard-panel .hud-kpi,
      #hud-chalkboard-panel .hud-proof {
        margin-top: 5px !important;
        padding: 7px 9px !important;
        font-size: 11.5px !important;
        line-height: 1.32 !important;
      }
      #hud-chalkboard-panel .hud-equation-box .title {
        font-size: 10px !important;
        line-height: 1.2 !important;
        margin-bottom: 3px !important;
      }
      #hud-chalkboard-panel .hud-equation-box .formula,
      #hud-chalkboard-panel .hud-equation-box .formula > span {
        font-size: 11.5px !important;
        line-height: 1.3 !important;
        gap: 4px !important;
      }
      #hud-chalkboard-panel .hud-mini {
        gap: 5px !important;
      }
      #hud-chalkboard-panel .hud-mini div {
        padding: 5px 6px !important;
      }
      #hud-chalkboard-panel .hud-mini span,
      #hud-chalkboard-panel .hud-kpi span {
        font-size: 10px !important;
      }
      #hud-chalkboard-panel .hud-mini b,
      #hud-chalkboard-panel .hud-kpi strong {
        font-size: 11.5px !important;
      }
      #hud-chalkboard-panel .math-seg {
        padding: 1px 4px !important;
      }
      @media (max-height: 430px) {
        #hud-chalkboard-panel.hud-panel,
        #hud-chalkboard-panel.hud-panel.expanded,
        #hud-chalkboard-panel.hud-panel:not(.collapsed) {
          width: min(286px, calc(100% - 20px)) !important;
          left: 10px !important;
          top: 10px !important;
        }
        #hud-chalkboard-panel .hud-header {
          min-height: 34px !important;
          padding: 6px 9px !important;
        }
        #hud-chalkboard-panel .hud-body,
        #hud-chalkboard-panel #steps-hud-chalkboard {
          padding: 6px 9px 8px !important;
          font-size: 10.8px !important;
          line-height: 1.28 !important;
        }
        #hud-chalkboard-panel .hud-row {
          margin-bottom: 4px !important;
          padding-bottom: 4px !important;
        }
        #hud-chalkboard-panel .hud-row-val,
        #hud-chalkboard-panel .hud-equation-box,
        #hud-chalkboard-panel .hud-proof-line,
        #hud-chalkboard-panel .hud-kpi,
        #hud-chalkboard-panel .hud-proof {
          font-size: 10.8px !important;
          line-height: 1.28 !important;
        }
      }
      @media (max-width: 520px) {
        #hud-chalkboard-panel.hud-panel.collapsed {
          min-width: 0 !important;
        }
        #hud-chalkboard-panel .hud-title,
        #hud-chalkboard-panel.hud-panel.collapsed .hud-title {
          white-space: normal !important;
          line-height: 1.22 !important;
        }
      }
    `;
  }

  function unifiedTopicHudStandardStyle() {
    return `
      /* HUD_UNIFIED_CHALKBOARD_EXPANDED / HUD_UNIFIED_SIMILARITY_COLLAPSED */
      .analysis-hud,
      .analysis-hud-card,
      #hud-chalkboard-panel.hud-panel,
      .hud-panel {
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
      }
      .analysis-hud .hud-header,
      .analysis-hud-card .hud-header,
      #hud-chalkboard-panel .hud-header,
      .hud-panel .hud-header {
        min-height: 38px !important;
        height: auto !important;
        padding: 7px 12px !important;
        background: rgba(248, 250, 252, 0.72) !important;
        border-bottom: 1px solid #e2e8f0 !important;
        color: #0f172a !important;
        gap: 8px !important;
      }
      .analysis-hud .hud-title,
      .analysis-hud-card .hud-title,
      .analysis-hud .hud-header > span,
      .analysis-hud-card .hud-header > span,
      #hud-chalkboard-panel .hud-title,
      .hud-panel .hud-title {
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
      .analysis-hud .hud-content,
      .analysis-hud-card .hud-content,
      #hud-chalkboard-panel .hud-content,
      #hud-chalkboard-panel .hud-body,
      #hud-chalkboard-panel #steps-hud-chalkboard,
      .hud-panel .hud-content,
      .hud-panel .hud-body {
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
      #hud-chalkboard-panel .hud-body *,
      #hud-chalkboard-panel #steps-hud-chalkboard *,
      .hud-panel .hud-body *,
      .analysis-hud .hud-content *,
      .analysis-hud-card .hud-content * {
        color: inherit !important;
        text-shadow: none !important;
        letter-spacing: 0 !important;
      }
      #hud-chalkboard-panel .hud-row,
      .hud-panel .hud-row {
        margin-bottom: 6px !important;
        padding-bottom: 5px !important;
      }
      #hud-chalkboard-panel .hud-row-label,
      .hud-panel .hud-row-label {
        color: #64748b !important;
        font-size: 10.5px !important;
        line-height: 1.25 !important;
      }
      #hud-chalkboard-panel .hud-row-val,
      #hud-chalkboard-panel strong,
      .hud-panel .hud-row-val,
      .hud-panel strong {
        color: #0f172a !important;
      }
      #hud-chalkboard-panel .hud-equation-box,
      #hud-chalkboard-panel .hud-proof-line,
      #hud-chalkboard-panel .hud-kpi,
      #hud-chalkboard-panel .hud-proof,
      .hud-panel .hud-equation-box,
      .hud-panel .hud-proof-line,
      .hud-panel .hud-kpi,
      .hud-panel .hud-proof {
        margin-top: 5px !important;
        padding: 7px 9px !important;
        border: 1px solid rgba(148, 163, 184, 0.18) !important;
        border-radius: 8px !important;
        background: rgba(248, 250, 252, 0.96) !important;
        color: #334155 !important;
        font-size: 11.5px !important;
        line-height: 1.32 !important;
      }
      .analysis-hud.collapsed,
      .analysis-hud-card.collapsed,
      #hud-chalkboard-panel.hud-panel.collapsed,
      .hud-panel.collapsed {
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
      }
      .analysis-hud.collapsed .hud-header,
      .analysis-hud-card.collapsed .hud-header,
      #hud-chalkboard-panel.hud-panel.collapsed .hud-header,
      .hud-panel.collapsed .hud-header {
        height: 42px !important;
        min-height: 42px !important;
        padding: 6px 8px 6px 14px !important;
        border-bottom: 0 !important;
        background: transparent !important;
      }
      .analysis-hud.collapsed .hud-content,
      .analysis-hud-card.collapsed .hud-content,
      #hud-chalkboard-panel.hud-panel.collapsed .hud-content,
      #hud-chalkboard-panel.hud-panel.collapsed .hud-body,
      #hud-chalkboard-panel.hud-panel.collapsed #steps-hud-chalkboard,
      .hud-panel.collapsed .hud-content,
      .hud-panel.collapsed .hud-body {
        display: none !important;
      }
      .analysis-hud.collapsed .hud-title::before,
      .analysis-hud-card.collapsed .hud-title::before,
      .analysis-hud.collapsed .hud-header > span::before,
      .analysis-hud-card.collapsed .hud-header > span::before,
      #hud-chalkboard-panel.hud-panel.collapsed .hud-title::before,
      .hud-panel.collapsed .hud-title::before {
        content: "" !important;
        width: 14px !important;
        height: 14px !important;
        flex: 0 0 auto !important;
        border-radius: 999px !important;
        background:
          radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.96) 0 30%, transparent 32%),
          conic-gradient(from 0deg, #38bdf8, #f59e0b, #22c55e, #38bdf8) !important;
      }
      .analysis-hud .btn-hud-toggle,
      .analysis-hud-card .btn-hud-toggle,
      .analysis-hud .hud-control-btn,
      .analysis-hud-card .hud-control-btn,
      #hud-chalkboard-panel .hud-control-btn,
      .hud-panel .hud-control-btn {
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
      .analysis-hud.collapsed .btn-hud-toggle,
      .analysis-hud-card.collapsed .btn-hud-toggle,
      .analysis-hud.collapsed #btn-hud-toggle.btn-hud-toggle,
      .analysis-hud-card.collapsed #btn-hud-toggle.btn-hud-toggle,
      .analysis-hud.collapsed .hud-control-btn,
      .analysis-hud-card.collapsed .hud-control-btn,
      #hud-chalkboard-panel.hud-panel.collapsed .hud-control-btn,
      .hud-panel.collapsed .hud-control-btn {
        border: 0 !important;
        background: rgba(245, 158, 11, 0.16) !important;
        color: #92400e !important;
        box-shadow: none !important;
      }
    `;
  }

  function attachStyle(shadow, sourceStyle) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    const normalizedSourceStyle = String(sourceStyle || "").replace(/:root/g, ":host");
    style.textContent = `${normalizedSourceStyle}\n${baseStyleText()}\n${topicCoursewareStyle()}\n${unifiedHudBoardStyle()}\n${unifiedTopicHudStandardStyle()}`;
    shadow.appendChild(style);
  }

  function extractLayout(body, sourceStyle, cleanup) {
    const canvasNode = body.querySelector(".simulation-column, .sandbox-column, .sandbox-area, #canvas-container, #sandbox-wrapper, #sandbox-canvas-parent");
    const panelNode = body.querySelector(".control-column, .control-panel, #control-panel");
    if (!canvasNode) throw new Error("simulation container missing");
    if (!panelNode) throw new Error("control panel missing");
    const headerNode = body.querySelector(".app-header");
    const modalNode = body.querySelector("#modal-help");
    const particlesNode = body.querySelector("#particles-canvas");
    if (canvasNode.id === "canvas-container") canvasNode.className = "";
    if (panelNode.id === "control-panel") panelNode.className = "";

    const scene = makeShadowHost("circle-properties-topic-scene");
    const sceneShell = document.createElement("div");
    sceneShell.className = "source-shell";
    attachStyle(scene.shadow, sourceStyle);
    sceneShell.appendChild(canvasNode);
    if (particlesNode) sceneShell.appendChild(particlesNode);
    scene.shadow.appendChild(sceneShell);
    scene.host.style.cssText = "position:absolute;inset:0;width:100%;height:100%;min-height:0;overflow:hidden;";

    const panel = makeShadowHost("circle-properties-topic-panel");
    const panelShell = document.createElement("div");
    panelShell.className = "circle-properties-topic-panel-scroll";
    attachStyle(panel.shadow, sourceStyle);
    if (headerNode) panelShell.appendChild(headerNode);
    panelShell.appendChild(panelNode);
    if (modalNode) panelShell.appendChild(modalNode);
    panel.shadow.appendChild(panelShell);
    panel.host.style.cssText = "display:block;width:100%;height:100%;min-height:0;overflow:hidden;";

    cleanup.shadowHosts.push(scene.host, panel.host);
    return { sceneRoot: scene.shadow, sceneHost: scene.host, panelRoot: panel.shadow, panelHost: panel.host };
  }

  function scopedQuery(sceneRoot, panelRoot, selector) {
    if (!selector) return null;
    try {
      return sceneRoot.querySelector(selector) || panelRoot.querySelector(selector);
    } catch (error) {
      return null;
    }
  }

  function scopedQueryAll(sceneRoot, panelRoot, selector) {
    const results = [];
    if (!selector) return results;
    try { results.push(...sceneRoot.querySelectorAll(selector)); } catch (error) {}
    try { results.push(...panelRoot.querySelectorAll(selector)); } catch (error) {}
    return results;
  }

  function makeScopedDocument(sceneRoot, panelRoot, cleanup) {
    const docListenerRecords = [];
    return new Proxy(document, {
      get(target, prop) {
        if (prop === "getElementById") {
          return id => scopedQuery(sceneRoot, panelRoot, "#" + CSS.escape(String(id)));
        }
        if (prop === "querySelector") {
          return selector => scopedQuery(sceneRoot, panelRoot, selector);
        }
        if (prop === "querySelectorAll") {
          return selector => scopedQueryAll(sceneRoot, panelRoot, selector);
        }
        if (prop === "addEventListener") {
          return (type, handler, options) => {
            if (type === "DOMContentLoaded") {
              const id = window.setTimeout(() => {
                cleanup.timeouts.delete(id);
                if (!cleanup.disposed) handler(new Event("DOMContentLoaded"));
              }, 0);
              cleanup.timeouts.add(id);
              return;
            }
            const targets = [sceneRoot, panelRoot, window];
            targets.forEach(eventTarget => cleanup.addListener(eventTarget, type, handler, options));
            docListenerRecords.push({ type, handler, options, targets });
          };
        }
        if (prop === "removeEventListener") {
          return (type, handler) => {
            for (let index = docListenerRecords.length - 1; index >= 0; index -= 1) {
              const record = docListenerRecords[index];
              if (record.type !== type || record.handler !== handler) continue;
              record.targets.forEach(eventTarget => eventTarget.removeEventListener(type, handler, record.options));
              docListenerRecords.splice(index, 1);
            }
          };
        }
        if (prop === "body") return sceneRoot;
        const value = target[prop];
        return typeof value === "function" ? value.bind(target) : value;
      }
    });
  }

  function makeScopedWindow(sceneHost, cleanup) {
    const visualViewportProxy = window.visualViewport ? new Proxy(window.visualViewport, {
      get(target, prop) {
        if (prop === "addEventListener") {
          return (type, handler, options) => cleanup.addListener(target, type, handler, options);
        }
        if (prop === "removeEventListener") return target.removeEventListener.bind(target);
        const value = target[prop];
        return typeof value === "function" ? value.bind(target) : value;
      }
    }) : window.visualViewport;

    return new Proxy(window, {
      get(target, prop) {
        if (prop === "innerWidth") return Math.max(1, Math.round(sceneHost.clientWidth || target.innerWidth || 1));
        if (prop === "innerHeight") return Math.max(1, Math.round(sceneHost.clientHeight || target.innerHeight || 1));
        if (prop === "visualViewport") return visualViewportProxy;
        if (prop === "addEventListener") {
          return (type, handler, options) => cleanup.addListener(target, type, handler, options);
        }
        if (prop === "removeEventListener") return target.removeEventListener.bind(target);
        if (prop === "requestAnimationFrame") {
          return callback => {
            const id = target.requestAnimationFrame(time => {
              cleanup.rafs.delete(id);
              if (!cleanup.disposed) callback(time);
            });
            cleanup.rafs.add(id);
            return id;
          };
        }
        if (prop === "cancelAnimationFrame") {
          return id => {
            cleanup.rafs.delete(id);
            target.cancelAnimationFrame(id);
          };
        }
        if (prop === "setTimeout") {
          return (handler, delay, ...args) => {
            const id = target.setTimeout(() => {
              cleanup.timeouts.delete(id);
              if (!cleanup.disposed) handler(...args);
            }, delay);
            cleanup.timeouts.add(id);
            return id;
          };
        }
        if (prop === "clearTimeout") {
          return id => {
            cleanup.timeouts.delete(id);
            target.clearTimeout(id);
          };
        }
        if (prop === "setInterval") {
          return (handler, delay, ...args) => {
            const id = target.setInterval(() => {
              if (!cleanup.disposed) handler(...args);
            }, delay);
            cleanup.intervals.add(id);
            return id;
          };
        }
        if (prop === "clearInterval") {
          return id => {
            cleanup.intervals.delete(id);
            target.clearInterval(id);
          };
        }
        const value = target[prop];
        return typeof value === "function" ? value.bind(target) : value;
      },
      set(target, prop, value) {
        target[prop] = value;
        return true;
      }
    });
  }

  function blockNativeTouchMenus(root, cleanup) {
    ["contextmenu", "selectstart", "dragstart", "copy", "cut", "paste"].forEach(type => {
      cleanup.addListener(root, type, event => event.preventDefault());
    });
    cleanup.addListener(root, "touchstart", event => {
      if (event.touches && event.touches.length > 1 && !event.target.closest?.("#control-panel, .control-column")) {
        event.preventDefault();
      }
    }, { passive: false });
  }

  function bridgeAnalysisHudTouchToggle(sceneRoot, cleanup) {
    const hudTriggerSelector = "#btn-hud-toggle, .btn-hud-toggle, .analysis-hud";
    const onHudTouchEnd = event => {
      const target = event.target?.closest?.(hudTriggerSelector);
      const hud = target?.closest?.("#analysis-hud-card, .analysis-hud");
      if (!target || !hud || !sceneRoot.contains(hud)) return;
      const hudToggle = hud.querySelector("#btn-hud-toggle") || target;
      if (event.cancelable) event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      hudToggle.click();
    };
    cleanup.addListener(sceneRoot, "touchend", onHudTouchEnd, { passive: false, capture: true });
  }

  function installHudBoardFit(sceneRoot, sceneHost, cleanup) {
    const hudPanel = sceneRoot.querySelector("#hud-chalkboard-panel");
    if (!hudPanel) return;

    let rafId = 0;
    const fit = () => {
      if (!hudPanel.isConnected) return;
      const collapsed = hudPanel.classList.contains("collapsed");
      hudPanel.style.transformOrigin = "top left";
      if (collapsed) {
        if (hudPanel.style.scale !== "1") hudPanel.style.scale = "1";
        return;
      }

      const hostRect = sceneHost.getBoundingClientRect();
      const hudRect = hudPanel.getBoundingClientRect();
      const currentScale = Number.parseFloat(hudPanel.style.scale || "1") || 1;
      const top = Math.max(0, hudRect.top - hostRect.top);
      const availableHeight = Math.max(120, hostRect.height - top - 10);
      const naturalHeight = Math.max(hudPanel.scrollHeight, hudRect.height / currentScale);
      const scale = Math.min(1, Math.max(0.58, availableHeight / Math.max(1, naturalHeight)));
      const nextScale = scale.toFixed(3);
      if (hudPanel.style.scale !== nextScale) hudPanel.style.scale = nextScale;
    };

    const scheduleFit = () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        cleanup.rafs.delete(rafId);
        rafId = 0;
        fit();
      });
      cleanup.rafs.add(rafId);
    };

    const observer = new MutationObserver(scheduleFit);
    observer.observe(hudPanel, { attributes: true, childList: true, subtree: true, characterData: true });
    cleanup.roots.push({ remove: () => observer.disconnect() });

    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(scheduleFit);
      resizeObserver.observe(hudPanel);
      resizeObserver.observe(sceneHost);
      cleanup.roots.push({ remove: () => resizeObserver.disconnect() });
    }

    cleanup.addListener(window, "resize", scheduleFit);
    scheduleFit();
  }


  function createKatexLite() {
    function formatLatex(source) {
      let text = String(source || "");
      text = text
        .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "$1/$2")
        .replace(/\\sqrt\{([^{}]+)\}/g, "√($1)")
        .replace(/\\widehat\{([^{}]+)\}/g, "⌒$1")
        .replace(/\\text\{([^{}]+)\}/g, "$1")
        .replace(/\\triangle/g, "△")
        .replace(/\\angle/g, "∠")
        .replace(/\\perp/g, "⊥")
        .replace(/\\implies/g, "⇒")
        .replace(/\\cong/g, "≌")
        .replace(/\\leq/g, "≤")
        .replace(/\\geq/g, "≥")
        .replace(/\\cdot/g, "·")
        .replace(/\\left|\\right|\\;/g, "")
        .replace(/\^2/g, "²")
        .replace(/_1/g, "₁")
        .replace(/_2/g, "₂")
        .replace(/_3/g, "₃")
        .replace(/\\/g, "")
        .replace(/[{}]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      return text;
    }

    function render(source, target, options) {
      if (!target) return;
      target.textContent = formatLatex(source);
      target.classList?.add(options?.displayMode ? 'katex-display' : 'katex-lite');
    }
    return { render };
  }

  function renderMathInElementLite() {}

  function getTopicFlowSteps() {
    if (CARD_ID === "jm_topic_m13") return ["观察条件", "拖动验证", "定理推导", "归纳应用"];
    if (CARD_ID === "jm_topic_m14") return ["分割面积", "拖动比较", "等量代换", "结论归纳"];
    if (CARD_ID === "jm_topic_m16") return ["搭建方块", "观察投影", "反向还原", "任务判定"];
    return ["观察", "操作", "验证", "归纳"];
  }

  function installTopicPanelEnhancements(panelRoot, cleanup) {
    const panelNode = panelRoot.querySelector(".control-column, .control-panel, #control-panel");
    if (!panelNode || panelRoot.querySelector(".topic-teaching-flow")) return;

    const flow = document.createElement("div");
    flow.className = "topic-teaching-flow";
    const steps = getTopicFlowSteps();
    flow.innerHTML = `
      <div class="topic-flow-head">
        <div class="topic-flow-title">课堂探究步骤</div>
        <button class="topic-reset-current" type="button">重置当前专题</button>
      </div>
      <div class="topic-flow-steps">
        ${steps.map((step, index) => `<span class="topic-flow-step ${index === 0 ? "is-active" : ""}">${index + 1}. ${step}</span>`).join("")}
      </div>
    `;
    panelNode.prepend(flow);

    const resetButton = flow.querySelector(".topic-reset-current");
    cleanup.addListener(resetButton, "click", () => {
      const reset = window[`__MATH_TOPIC_RESET__${CARD_ID}`] || window.__MATH_TOPIC_RESET__;
      if (typeof reset === "function") {
        reset();
        return;
      }
      const activeTab = panelRoot.querySelector(".tab-btn.active");
      if (activeTab) activeTab.click();
    });
  }

  function runSourceScript(script, sceneRoot, panelRoot, sceneHost, cleanup) {
    const scopedDocument = makeScopedDocument(sceneRoot, panelRoot, cleanup);
    const scopedWindow = makeScopedWindow(sceneHost, cleanup);
    const source = String(script || "").replace(/requestAnimationFrame/g, "window.requestAnimationFrame");
    const runner = new Function(
      "document",
      "window",
      "requestAnimationFrame",
      "cancelAnimationFrame",
      "setTimeout",
      "clearTimeout",
      "setInterval",
      "clearInterval",
      "CSS",
      "katex",
      "renderMathInElement",
      `"use strict";\n${source}\n//# sourceURL=jm_topic_m13_source.js`
    );
    runner(
      scopedDocument,
      scopedWindow,
      scopedWindow.requestAnimationFrame,
      scopedWindow.cancelAnimationFrame,
      scopedWindow.setTimeout,
      scopedWindow.clearTimeout,
      scopedWindow.setInterval,
      scopedWindow.clearInterval,
      window.CSS,
      createKatexLite(),
      renderMathInElementLite
    );
  }

  function showError(container, context, message) {
    container.innerHTML = `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;background:#07111f;color:#fecaca;font:800 14px/1.8 Microsoft YaHei,sans-serif;text-align:center;">${message}</div>`;
    if (context?.externalPanel) context.externalPanel.innerHTML = "";
  }

  window.MATH_VISUAL_SCENES[CARD_ID] = {
    async mount(container, context) {
      const previous = mounts.get(container);
      if (previous) previous.dispose();

      const cleanup = createCleanup();
      mounts.set(container, cleanup);
      container.innerHTML = "";
      if (context?.externalPanel) context.externalPanel.innerHTML = "";
      container.style.position = container.style.position || "relative";
      container.style.overflow = "hidden";
      container.style.width = "100%";
      container.style.height = "100%";
      container.style.minHeight = "100%";

      try {
        const resolvedSourceUrl = resolveSourceUrl(context);
        const response = await fetch(resolvedSourceUrl, { cache: "no-store" });
        if (!response.ok) throw new Error("source.html " + response.status);
        const html = await response.text();
        if (cleanup.disposed) return;

        const doc = new DOMParser().parseFromString(html, "text/html");
        const source = await collectSource(doc, response.url || resolvedSourceUrl);
        const { sceneRoot, sceneHost, panelRoot, panelHost } = extractLayout(source.body, source.styleText, cleanup);

        container.appendChild(sceneHost);
        cleanup.roots.push(sceneHost);

        const externalPanel = context?.externalPanel && context.externalPanel.nodeType === 1 ? context.externalPanel : null;
        if (externalPanel) {
          externalPanel.appendChild(panelHost);
          cleanup.roots.push(panelHost);
        } else {
          panelHost.style.position = "absolute";
          panelHost.style.right = "12px";
          panelHost.style.top = "12px";
          panelHost.style.bottom = "12px";
          panelHost.style.width = "min(360px, calc(100% - 24px))";
          panelHost.style.zIndex = "20";
          container.appendChild(panelHost);
          cleanup.roots.push(panelHost);
        }

        blockNativeTouchMenus(sceneRoot, cleanup);
        blockNativeTouchMenus(panelRoot, cleanup);
        runSourceScript(source.script, sceneRoot, panelRoot, sceneHost, cleanup);
        bridgeAnalysisHudTouchToggle(sceneRoot, cleanup);
        installTopicPanelEnhancements(panelRoot, cleanup);
        installHudBoardFit(sceneRoot, sceneHost, cleanup);
        window.dispatchEvent(new Event("resize"));
      } catch (error) {
        console.error("Failed to mount circle-properties-topic card:", error);
        if (!cleanup.disposed) showError(container, context, FALLBACK_ERROR);
      }
    },
    unmount(container, context) {
      const cleanup = mounts.get(container);
      if (cleanup) cleanup.dispose();
      mounts.delete(container);
      container.innerHTML = "";
      if (context?.externalPanel) context.externalPanel.innerHTML = "";
    }
  };
})();

