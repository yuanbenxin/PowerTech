window.MATH_VISUAL_SCENES = window.MATH_VISUAL_SCENES || {};

(function () {
  const CARD_ID = "j7a_m13";
  const STYLE_ID = "math-rational-numberline-interval-style";
  const FALLBACK_ERROR = "数轴区间与有理数大小比较课件加载失败，请检查本卡片目录内 source.html、style.css?v=86bcff45e242 与 scene.js?v=b67330878410";
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
      #canvas-container,
      #sandbox-wrapper {
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
      .rational-numberline-interval-panel-scroll {
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
      .rational-numberline-interval-panel-scroll::-webkit-scrollbar {
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
        color: #f8fafc !important;
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
        width: 240px !important;
        max-width: calc(100% - 300px) !important;
        min-width: 0 !important;
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
        color: #f8fafc !important;
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

      .control-column .btn-preset-problem,
      .control-column .btn-control-action,
      .control-column select,
      .control-column option {
        background: rgba(2, 6, 23, 0.46) !important;
        color: rgba(248, 250, 252, 0.92) !important;
        border-color: rgba(148, 163, 184, 0.2) !important;
      }
      .control-column .btn-control-action:disabled {
        opacity: 0.56 !important;
        color: rgba(203, 213, 225, 0.7) !important;
        background: rgba(15, 23, 42, 0.32) !important;
      }
      .control-column .btn-control-action.active-run,
      .control-column .btn-control-action.active-orange,
      .control-column .btn-control-action.active-blue,
      .control-column .btn-toggle.active,
      .control-column .btn-preset.active {
        background: #92400e !important;
        color: #fff7ed !important;
        border-color: #f59e0b !important;
      }
      .control-column .btn-preset .preset-name,
      .control-column .btn-preset.active .preset-name,
      .control-column .btn-preset .preset-num,
      .control-column .btn-preset-problem *,
      .control-column .btn-control-action * {
        color: inherit !important;
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
          width: 240px !important;
          max-width: calc(100% - 280px) !important;
          min-width: 0 !important;
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
      @media (max-width: 640px) {
        .teaching-status-card {
          display: none !important;
        }
      }
    `;
  }


  function topicCoursewareStyle() {
    return `
      .app-container,
      .main-layout,
      .app-main {
        width: 100% !important;
        height: 100% !important;
        min-height: 0 !important;
        overflow: hidden !important;
        background: transparent !important;
      }
      .simulation-column,
      .sandbox-column,
      .sandbox-area {
        position: relative !important;
        display: flex !important;
        flex-direction: column !important;
        width: 100% !important;
        height: 100% !important;
        min-height: 0 !important;
        padding: 10px !important;
        background-color: #ffffff !important;
        background-image:
          linear-gradient(rgba(203, 213, 225, 0.72) 1px, transparent 1px),
          linear-gradient(90deg, rgba(203, 213, 225, 0.72) 1px, transparent 1px) !important;
        background-size: 40px 40px !important;
        background-position: 0 0 !important;
        border: 1px solid rgba(203, 213, 225, 0.9) !important;
        box-shadow: none !important;
        --bg-primary: #ffffff;
        --bg-card: rgba(255, 255, 255, 0.9);
        --bg-chalkboard: rgba(250, 251, 253, 0.88);
        --border-color: rgba(203, 213, 225, 0.9);
        --text-primary: #0f172a;
        --text-secondary: #475569;
        --text-muted: #64748b;
        --grid-color: rgba(203, 213, 225, 0.72);
      }
      .sandbox-container,
      #sandbox-wrapper,
      #canvas-container,
      .geometry-canvas-container,
      .canvas-3d-container {
        position: relative !important;
        flex: 1 1 auto !important;
        width: 100% !important;
        height: 100% !important;
        min-height: 0 !important;
        border-radius: 8px !important;
        overflow: hidden !important;
        touch-action: none !important;
        background-color: #ffffff !important;
        background-image:
          linear-gradient(rgba(203, 213, 225, 0.72) 1px, transparent 1px),
          linear-gradient(90deg, rgba(203, 213, 225, 0.72) 1px, transparent 1px) !important;
        background-size: 40px 40px !important;
        background-position: 0 0 !important;
      }
      #sandbox-svg,
      .sandbox-svg-layer,
      #geometry-svg,
      canvas {
        width: 100% !important;
        height: 100% !important;
        display: block !important;
        background: transparent !important;
      }
      .sandbox-grid-overlay {
        background-image: none !important;
        opacity: 1 !important;
        pointer-events: none !important;
      }
      .html-overlay-layer,
      #html-overlay {
        pointer-events: none !important;
      }
      .canvas-controls {
        right: 14px !important;
        bottom: 14px !important;
        z-index: 14 !important;
      }
      .timeline-container {
        left: 18px !important;
        right: 76px !important;
        bottom: 18px !important;
        width: auto !important;
        max-width: calc(100% - 94px) !important;
        transform: none !important;
        z-index: 12 !important;
        background: rgba(255, 255, 255, 0.94) !important;
      }
      .timeline-container .step-label {
        color: #475569 !important;
      }
      .timeline-container .timeline-step.active .step-label {
        color: #6d28d9 !important;
      }
      #hud-chalkboard-panel.hud-panel,
      .hud-panel,
      .analysis-hud,
      .analysis-hud-card {
        position: absolute !important;
        z-index: 16 !important;
        left: 22px !important;
        top: 22px !important;
        width: min(340px, calc(100% - 44px)) !important;
        max-height: min(230px, calc(100% - 120px)) !important;
        overflow: hidden !important;
        border-radius: 14px !important;
        border: 1px solid rgba(148, 163, 184, 0.24) !important;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.9)) !important;
        color: #0f172a !important;
        box-shadow: 0 18px 42px rgba(15, 23, 42, 0.14), 0 2px 8px rgba(15, 23, 42, 0.06) !important;
      }
      #hud-chalkboard-panel.hud-panel.collapsed,
      .hud-panel.collapsed {
        background: rgba(255, 255, 255, 0.96) !important;
        border-color: rgba(148, 163, 184, 0.35) !important;
        box-shadow: 0 12px 26px rgba(15, 23, 42, 0.13), inset 0 1px 0 rgba(255, 255, 255, 0.9) !important;
        width: auto !important;
        min-width: 0 !important;
        max-width: calc(100% - 44px) !important;
        min-height: 42px !important;
        max-height: 42px !important;
        border-radius: 999px !important;
      }
      .hud-panel.collapsed .hud-body,
      .hud-panel.collapsed #steps-hud-chalkboard {
        display: none !important;
      }
      .hud-header,
      #hud-toggle-btn {
        min-height: 42px !important;
        width: 100% !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 8px !important;
        padding: 6px 8px 6px 14px !important;
        border: 0 !important;
        background: transparent !important;
        color: #0f172a !important;
        font-size: 12.5px !important;
        font-weight: 800 !important;
        cursor: pointer !important;
      }
      .hud-title {
        max-width: 100% !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }
      .hud-body,
      #steps-hud-chalkboard {
        max-height: 350px !important;
        overflow: auto !important;
        padding: 0 12px 12px !important;
        color: #334155 !important;
        line-height: 1.46 !important;
      }
      .source-panel-scroll,
      .rational-numberline-interval-panel-scroll {
        padding: 0 !important;
      }
      .control-column,
      .control-panel {
        width: 100% !important;
        min-width: 0 !important;
        max-width: 100% !important;
        padding: 10px !important;
        display: grid !important;
        grid-auto-rows: min-content !important;
        align-content: start !important;
        gap: 8px !important;
        overflow: visible !important;
        background: transparent !important;
        border: 0 !important;
        box-shadow: none !important;
      }
      .panel-section,
      .theory-panel,
      .reset-section {
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
      .panel-section h3,
      .theory-panel h3,
      .section-title,
      .panel-title {
        color: rgba(226, 232, 240, 0.86) !important;
        font-size: 12px !important;
        line-height: 1.25 !important;
        font-weight: 800 !important;
        margin: 0 0 8px !important;
      }
      .presets-grid {
        width: 100% !important;
        min-width: 0 !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 10px !important;
      }
      .presets-btn-list,
      .sliders-container,
      .btn-toggle-wrap {
        width: 100% !important;
        min-width: 0 !important;
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 8px !important;
      }
      .sliders-container {
        grid-template-columns: 1fr !important;
      }
      .slider-group,
      .theory-content,
      .btn-preset-problem,
      .btn-control-action,
      .btn-toggle,
      .modal-card {
        min-width: 0 !important;
        max-width: 100% !important;
        border-radius: 8px !important;
        border: 1px solid rgba(148, 163, 184, 0.14) !important;
        background: rgba(2, 6, 23, 0.24) !important;
        color: rgba(226, 232, 240, 0.82) !important;
        box-shadow: none !important;
      }
      .slider-group,
      .slider-row {
        display: flex !important;
        flex-direction: column !important;
        gap: 6px !important;
        border: 0 !important;
        background: transparent !important;
        padding: 0 !important;
      }
      .theory-panel {
        display: none !important;
      }
      .control-value-row {
        display: grid !important;
        gap: 10px !important;
        padding: 10px 10px 12px !important;
        border: 1px solid rgba(148, 163, 184, 0.16) !important;
        border-radius: 8px !important;
        background: rgba(2, 6, 23, 0.24) !important;
      }
      .control-row-head {
        display: grid !important;
        grid-template-columns: auto minmax(0, 1fr) auto !important;
        align-items: center !important;
        gap: 8px !important;
        min-width: 0 !important;
      }
      .control-token {
        display: inline-grid !important;
        place-items: center !important;
        width: 24px !important;
        height: 24px !important;
        border-radius: 7px !important;
        background: rgba(139, 92, 246, 0.18) !important;
        color: #ddd6fe !important;
        font-size: 12px !important;
        font-weight: 900 !important;
        line-height: 1 !important;
      }
      .slider-row-b .control-token {
        background: rgba(59, 130, 246, 0.18) !important;
        color: #bfdbfe !important;
      }
      .control-meta {
        min-width: 0 !important;
        color: rgba(203, 213, 225, 0.72) !important;
        font-size: 12px !important;
        font-weight: 700 !important;
        line-height: 1.2 !important;
      }
      .control-row-head .slider-val-indicator {
        align-self: center !important;
        justify-self: end !important;
        min-width: 42px !important;
        color: #f8fafc !important;
        font-size: 13px !important;
        font-weight: 900 !important;
        line-height: 1 !important;
        text-align: right !important;
      }
      .theory-content {
        border: 0 !important;
        background: transparent !important;
        color: rgba(203, 213, 225, 0.78) !important;
        font-size: 12.5px !important;
        line-height: 1.6 !important;
        padding: 0 4px 0 0 !important;
        overflow: auto !important;
      }
      .theory-content p,
      .theory-content li,
      .slider-label,
      .preset-desc {
        color: rgba(203, 213, 225, 0.78) !important;
      }
      .theory-content strong,
      .theory-content b {
        color: rgba(248, 250, 252, 0.92) !important;
      }
      .theory-content,
      .theory-content * {
        overflow-wrap: anywhere !important;
      }
      button,
      .btn-preset,
      .btn-secondary,
      .btn-toggle,
      .btn-zoom,
      .btn-preset-problem,
      .btn-control-action,
      select,
      .hud-control-btn {
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
      .btn-preset {
        width: 100% !important;
        display: grid !important;
        grid-template-columns: 28px minmax(0, 1fr) !important;
        align-items: center !important;
        justify-items: start !important;
        column-gap: 10px !important;
        min-height: 34px !important;
        padding: 10px !important;
        text-align: left !important;
        background: rgba(2, 6, 23, 0.36) !important;
      }
      .preset-num {
        grid-row: 1 / span 2 !important;
        width: 26px !important;
        height: 26px !important;
        display: inline-grid !important;
        place-items: center !important;
        border-radius: 8px !important;
        background: rgba(148, 163, 184, 0.14) !important;
        color: rgba(226, 232, 240, 0.78) !important;
        font-size: 14px !important;
        line-height: normal !important;
        font-weight: 800 !important;
      }
      .preset-name {
        min-width: 0 !important;
        max-width: 100% !important;
        white-space: normal !important;
        overflow-wrap: anywhere !important;
        line-height: normal !important;
        text-align: left !important;
        color: #f8fafc !important;
        font-size: 13.5px !important;
        font-weight: 700 !important;
      }
      .preset-desc {
        min-width: 0 !important;
        max-width: 100% !important;
        display: block !important;
        margin: 1px 0 0 !important;
        color: rgba(203, 213, 225, 0.78) !important;
        font-size: 11px !important;
        line-height: normal !important;
        overflow-wrap: anywhere !important;
        text-align: left !important;
      }
      button:hover,
      .btn-preset:hover,
      .btn-secondary:hover,
      .btn-toggle:hover,
      .btn-zoom:hover,
      .btn-preset-problem:hover,
      .btn-control-action:hover:not(:disabled) {
        border-color: rgba(250, 204, 21, 0.3) !important;
        background: rgba(15, 23, 42, 0.82) !important;
        color: #f8fafc !important;
      }
      button.active,
      .btn-preset.active,
      .btn-toggle.active,
      .btn-control-action.active-run,
      .btn-control-action.active-orange,
      .btn-control-action.active-blue,
      .timeline-step.active .step-dot {
        border-color: #f59e0b !important;
        background: #92400e !important;
        color: #fff7ed !important;
      }
      .control-column .btn-preset.active,
      .control-panel .btn-preset.active,
      .btn-preset.active {
        border-color: rgba(250, 204, 21, 0.42) !important;
        background: rgba(250, 204, 21, 0.12) !important;
        color: #fef3c7 !important;
        box-shadow: none !important;
      }
      .control-column .btn-preset.active .preset-num,
      .control-panel .btn-preset.active .preset-num,
      .btn-preset.active .preset-num {
        background: rgba(250, 204, 21, 0.88) !important;
        color: #111827 !important;
      }
      input[type="range"] {
        width: 100% !important;
        min-height: 34px !important;
        cursor: pointer !important;
        touch-action: pan-x !important;
      }
      .control-value-row input[type="range"] {
        -webkit-appearance: none !important;
        appearance: none !important;
        height: 4px !important;
        min-height: 18px !important;
        padding: 7px 0 !important;
        border: 0 !important;
        border-radius: 999px !important;
        background:
          linear-gradient(90deg, rgba(148, 163, 184, 0.34), rgba(148, 163, 184, 0.18))
          center / 100% 4px no-repeat !important;
      }
      input[type="range"]::-webkit-slider-thumb {
        width: 18px !important;
        height: 18px !important;
      }
      input[type="range"]::-moz-range-thumb {
        width: 18px !important;
        height: 18px !important;
      }
      .btn-toggle-wrap {
        display: flex !important;
        justify-content: flex-start !important;
        margin-top: 4px !important;
      }
      .btn-toggle {
        width: auto !important;
        min-height: 32px !important;
        justify-content: flex-start !important;
        gap: 6px !important;
        padding: 7px 10px !important;
        border-style: solid !important;
        border-color: rgba(148, 163, 184, 0.18) !important;
        background: rgba(2, 6, 23, 0.2) !important;
        color: rgba(203, 213, 225, 0.82) !important;
        font-size: 12px !important;
        font-weight: 800 !important;
      }
      .btn-toggle.active {
        border-color: rgba(250, 204, 21, 0.32) !important;
        background: rgba(250, 204, 21, 0.1) !important;
        color: #fde68a !important;
      }
      .btn-group-endpoints {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 8px !important;
      }
      .btn-sub-toggle {
        min-height: 32px !important;
        padding: 7px 8px !important;
        font-size: 12px !important;
        font-weight: 800 !important;
      }
      .timeline-container {
        min-height: 44px !important;
        padding: 7px 10px !important;
        border-radius: 12px !important;
        overflow-x: auto !important;
        overflow-y: hidden !important;
        -webkit-overflow-scrolling: touch !important;
        scrollbar-width: none !important;
      }
      .timeline-container::-webkit-scrollbar {
        width: 0 !important;
        height: 0 !important;
      }
      .timeline-step {
        min-width: 36px !important;
        min-height: 38px !important;
        padding: 4px 5px !important;
        touch-action: manipulation !important;
      }
      .step-dot {
        width: 18px !important;
        height: 18px !important;
      }
      .geo-point-wrapper,
      .geo-point-wrapper * {
        touch-action: none !important;
      }
      .geo-label,
      .abs-value-label,
      .tick-label {
        paint-order: stroke !important;
        stroke: rgba(255, 255, 255, 0.92) !important;
        stroke-width: 3px !important;
        stroke-linejoin: round !important;
      }
      .geo-point-halo {
        r: 18px !important;
        pointer-events: all !important;
      }
      .coord-label-box {
        max-width: 112px !important;
        text-align: center !important;
        line-height: 1.15 !important;
        transform: translate(-50%, -100%) !important;
        filter: drop-shadow(0 8px 14px rgba(15, 23, 42, 0.16)) !important;
      }
      .coord-label-box[data-label-anchor="left-edge"] {
        transform: translate(-12%, -100%) !important;
      }
      .coord-label-box[data-label-anchor="right-edge"] {
        transform: translate(-88%, -100%) !important;
      }
      .coord-label-box[data-label-anchor="bottom"] {
        transform: translate(-50%, 0) !important;
      }
      .coord-label-box[data-label-anchor="left-edge"]::after {
        left: 16px !important;
      }
      .coord-label-box[data-label-anchor="right-edge"]::after {
        left: auto !important;
        right: 16px !important;
      }
      .coord-label-box[data-label-anchor="bottom"]::after {
        top: auto !important;
        bottom: 100% !important;
        border-color: transparent transparent var(--text-primary) transparent !important;
      }
      .coord-label-box.lbl-a[data-label-anchor="bottom"]::after {
        border-color: transparent transparent var(--color-point-a) transparent !important;
      }
      .coord-label-box.lbl-b[data-label-anchor="bottom"]::after {
        border-color: transparent transparent var(--color-point-b) transparent !important;
      }
      .coord-label-box.lbl-interval[data-label-anchor="bottom"]::after {
        border-color: transparent transparent var(--color-interval) transparent !important;
      }
      button.is-touch-pressed,
      .btn-preset.is-touch-pressed,
      .btn-secondary.is-touch-pressed,
      .btn-toggle.is-touch-pressed,
      .btn-zoom.is-touch-pressed,
      .btn-preset-problem.is-touch-pressed,
      .btn-control-action.is-touch-pressed,
      .btn-sub-toggle.is-touch-pressed,
      .timeline-step.is-touch-pressed,
      .geo-point-wrapper.is-touch-pressed {
        filter: brightness(1.1) !important;
        transform: translateY(1px) !important;
      }
      @media (pointer: coarse), (hover: none), (max-width: 768px) {
        :host(.is-touch-courseware) button,
        :host(.is-touch-courseware) .btn-preset,
        :host(.is-touch-courseware) .btn-secondary,
        :host(.is-touch-courseware) .btn-toggle,
        :host(.is-touch-courseware) .btn-zoom,
        :host(.is-touch-courseware) .btn-preset-problem,
        :host(.is-touch-courseware) .btn-control-action,
        :host(.is-touch-courseware) .btn-sub-toggle,
        :host(.is-touch-courseware) select,
        :host(.is-touch-courseware) .hud-control-btn {
          min-height: 44px !important;
          padding: 10px 12px !important;
          font-size: 13px !important;
        }
        :host(.is-touch-courseware) .btn-zoom,
        :host(.is-touch-courseware) .hud-control-btn {
          width: 44px !important;
          height: 44px !important;
          padding: 0 !important;
          flex: 0 0 44px !important;
        }
        :host(.is-touch-courseware) .canvas-controls {
          right: 10px !important;
          bottom: 10px !important;
          display: grid !important;
          gap: 8px !important;
        }
        :host(.is-touch-courseware) input[type="range"] {
          min-height: 44px !important;
          padding: 12px 0 !important;
        }
        :host(.is-touch-courseware) input[type="range"]::-webkit-slider-thumb {
          width: 24px !important;
          height: 24px !important;
        }
        :host(.is-touch-courseware) input[type="range"]::-moz-range-thumb {
          width: 24px !important;
          height: 24px !important;
        }
        :host(.is-touch-courseware) .presets-grid,
        :host(.is-touch-courseware) .presets-btn-list,
        :host(.is-touch-courseware) .btn-toggle-wrap,
        :host(.is-touch-courseware) .mark-mode-grid {
          grid-template-columns: 1fr !important;
        }
        :host(.is-touch-courseware) .control-column,
        :host(.is-touch-courseware) .control-panel {
          gap: 10px !important;
          padding: 10px !important;
          overflow-y: auto !important;
          -webkit-overflow-scrolling: touch !important;
        }
        :host(.is-touch-courseware) .panel-section,
        :host(.is-touch-courseware) .theory-panel,
        :host(.is-touch-courseware) .reset-section {
          padding: 12px !important;
        }
        :host(.is-touch-courseware) .timeline-container {
          left: 10px !important;
          right: 66px !important;
          bottom: 10px !important;
          max-width: calc(100% - 76px) !important;
          min-height: 56px !important;
          padding: 8px !important;
        }
        :host(.is-touch-courseware) .timeline-step {
          min-width: 48px !important;
          min-height: 46px !important;
          padding: 5px 7px !important;
        }
        :host(.is-touch-courseware) .step-dot {
          width: 22px !important;
          height: 22px !important;
        }
        :host(.is-touch-courseware) .step-label {
          max-width: 72px !important;
          font-size: 10.5px !important;
          line-height: 1.15 !important;
          white-space: normal !important;
        }
        :host(.is-touch-courseware) .geo-point-halo {
          r: 24px !important;
        }
        :host(.is-touch-courseware) .geo-point {
          r: 8px !important;
        }
        :host(.is-touch-courseware) .coord-label-box {
          max-width: 98px !important;
          padding: 4px 7px !important;
          font-size: 11px !important;
          line-height: 1.12 !important;
        }
      }
      .modal-overlay {
        position: fixed !important;
        inset: 0 !important;
        z-index: 60 !important;
      }
      @media (max-width: 720px), (max-height: 560px) {
        .simulation-column,
        .sandbox-column,
        .sandbox-area {
          padding: 8px !important;
        }
        #hud-chalkboard-panel.hud-panel,
        .hud-panel {
          left: 10px !important;
          top: 10px !important;
          width: min(310px, calc(100% - 20px)) !important;
          max-height: 56% !important;
        }
        #hud-chalkboard-panel.hud-panel.collapsed,
        .hud-panel.collapsed {
          width: auto !important;
          max-width: calc(100% - 20px) !important;
        }
        #hud-chalkboard-panel.hud-panel,
        .hud-panel {
          width: 44px !important;
          height: 44px !important;
          max-width: 44px !important;
          max-height: 44px !important;
          border-radius: 999px !important;
        }
        .hud-header,
        #hud-toggle-btn {
          width: 44px !important;
          height: 44px !important;
          min-height: 44px !important;
          justify-content: center !important;
          padding: 0 !important;
        }
        .hud-header::before,
        #hud-toggle-btn::before {
          content: "📋";
          font-size: 18px;
          line-height: 1;
        }
        .hud-title,
        .hud-control-btn,
        .hud-body,
        #steps-hud-chalkboard {
          display: none !important;
        }
        .timeline-container {
          left: 10px !important;
          right: 10px !important;
          bottom: 10px !important;
          max-width: calc(100% - 20px) !important;
        }
      }
    `;
  }

  function unifiedHudBoardStyle() {
    return `
      /* 平台嵌入态 HUD：对齐半角模型的胶囊收起态与紧凑白色板书 */
      #hud-chalkboard-panel.hud-panel,
      #hud-chalkboard-panel.hud-panel.expanded,
      #hud-chalkboard-panel.hud-panel:not(.collapsed) {
        left: 18px !important;
        top: 18px !important;
        width: min(340px, calc(100% - 44px)) !important;
        height: auto !important;
        max-height: calc(100% - 36px) !important;
        overflow: hidden !important;
        display: flex !important;
        flex-direction: column !important;
        transform-origin: top left !important;
        border-radius: 14px !important;
      }
      #hud-chalkboard-panel.hud-panel.collapsed {
        background: rgba(255, 255, 255, 0.96) !important;
        border-color: rgba(148, 163, 184, 0.35) !important;
        box-shadow: 0 12px 26px rgba(15, 23, 42, 0.13), inset 0 1px 0 rgba(255, 255, 255, 0.9) !important;
        width: auto !important;
        min-width: 0 !important;
        max-width: calc(100% - 44px) !important;
        min-height: 42px !important;
        max-height: 42px !important;
        overflow: hidden !important;
        border-radius: 999px !important;
      }
      #hud-chalkboard-panel.hud-panel.collapsed .hud-body,
      #hud-chalkboard-panel.hud-panel.collapsed #steps-hud-chalkboard {
        display: none !important;
      }
      #hud-chalkboard-panel .hud-header {
        min-height: 42px !important;
        flex: 0 0 auto !important;
        padding: 6px 8px 6px 14px !important;
        gap: 8px !important;
        background: transparent !important;
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
        min-height: 26px !important;
        flex: 0 0 26px !important;
        border-radius: 999px !important;
        background: rgba(245, 158, 11, 0.16) !important;
        border-color: #92400e !important;
        color: #92400e !important;
        padding: 0 !important;
      }
      #hud-chalkboard-panel .hud-body,
      #hud-chalkboard-panel #steps-hud-chalkboard {
        min-height: 0 !important;
        max-height: none !important;
        overflow: hidden auto !important;
        overflow-x: hidden !important;
        overflow-y: auto !important;
        flex: 1 1 auto !important;
        padding: 0 12px 12px !important;
        font-size: 11.5px !important;
        line-height: 1.35 !important;
        scrollbar-gutter: auto !important;
        overscroll-behavior: contain !important;
        touch-action: pan-y !important;
        -webkit-overflow-scrolling: touch !important;
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

  function attachStyle(shadow, sourceStyle) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    const normalizedSourceStyle = String(sourceStyle || "").replace(/:root/g, ":host");
    style.textContent = `${normalizedSourceStyle}\n${baseStyleText()}\n${topicCoursewareStyle()}\n${unifiedHudBoardStyle()}`;
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

    const scene = makeShadowHost("rational-numberline-interval-scene");
    const sceneShell = document.createElement("div");
    sceneShell.className = "source-shell";
    attachStyle(scene.shadow, sourceStyle);
    sceneShell.appendChild(canvasNode);
    if (particlesNode) sceneShell.appendChild(particlesNode);
    scene.shadow.appendChild(sceneShell);
    scene.host.style.cssText = "position:absolute;inset:0;width:100%;height:100%;min-height:0;overflow:hidden;";

    const panel = makeShadowHost("rational-numberline-interval-panel");
    const panelShell = document.createElement("div");
    panelShell.className = "rational-numberline-interval-panel-scroll";
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

  function installTouchEnhancements(sceneRoot, panelRoot, cleanup) {
    const touchLike = window.matchMedia?.("(pointer: coarse), (hover: none), (max-width: 768px)")?.matches || false;
    if (touchLike) {
      sceneRoot.host?.classList?.add("is-touch-courseware");
      panelRoot.host?.classList?.add("is-touch-courseware");
    }

    const setRadiusIfChanged = (node, radius) => {
      if (node.getAttribute("r") !== radius) node.setAttribute("r", radius);
    };
    const syncPointTargets = () => {
      sceneRoot.querySelectorAll(".geo-point-halo").forEach(node => setRadiusIfChanged(node, touchLike ? "24" : "18"));
      sceneRoot.querySelectorAll(".geo-point").forEach(node => setRadiusIfChanged(node, touchLike ? "8" : "6.5"));
    };
    syncPointTargets();
    const pointObserver = new MutationObserver(syncPointTargets);
    pointObserver.observe(sceneRoot, { childList: true, subtree: true });
    cleanup.roots.push({ remove: () => pointObserver.disconnect() });

    const pressableSelector = "button, .timeline-step, .geo-point-wrapper, input[type='range'], select, .hud-control-btn, .btn-preset, .btn-secondary, .btn-toggle, .btn-zoom, .btn-preset-problem, .btn-control-action, .btn-sub-toggle";
    let pressedEl = null;
    const clearPressed = () => {
      if (pressedEl) pressedEl.classList.remove("is-touch-pressed");
      pressedEl = null;
    };
    [sceneRoot, panelRoot].forEach(root => {
      cleanup.addListener(root, "pointerdown", event => {
        const target = event.target?.closest?.(pressableSelector);
        if (!target) return;
        clearPressed();
        pressedEl = target;
        pressedEl.classList.add("is-touch-pressed");
      }, { passive: true });
      cleanup.addListener(root, "pointerup", clearPressed, { passive: true });
      cleanup.addListener(root, "pointercancel", clearPressed, { passive: true });
      cleanup.addListener(root, "pointerleave", clearPressed, { passive: true });
      cleanup.addListener(root, "touchend", clearPressed, { passive: true });
    });

    const panel = panelRoot.querySelector("#control-panel, .control-column");
    if (panel) {
      cleanup.addListener(panel, "pointerdown", event => {
        if (event.pointerType === "touch") {
          panel.classList.add("is-touch-active");
          if (panel._touchActiveTimer) window.clearTimeout(panel._touchActiveTimer);
          panel._touchActiveTimer = window.setTimeout(() => panel.classList.remove("is-touch-active"), 240);
          cleanup.timeouts.add(panel._touchActiveTimer);
        }
      });
    }
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
      `"use strict";\n${source}\n//# sourceURL=j7a_m13_source.js`
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
      window.CSS
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
        installTouchEnhancements(sceneRoot, panelRoot, cleanup);
        installHudBoardFit(sceneRoot, sceneHost, cleanup);
        window.dispatchEvent(new Event("resize"));
      } catch (error) {
        console.error("Failed to mount rational-numberline-interval card:", error);
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

