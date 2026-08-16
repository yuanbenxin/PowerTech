window.MATH_VISUAL_SCENES = window.MATH_VISUAL_SCENES || {};

(function () {
  const CARD_ID = "jm_model_m21";
  const STYLE_ID = "math-yw-bd-model-style";
  const mounts = new WeakMap();
  const FALLBACK_ERROR = "面积比例模型：燕尾与蝴蝶课件载入失败，请检查 source.html、style.css?v=082205431ff8 与 scene.js?v=2ef020880c5c";

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
        this.listeners.forEach(([target, type, handler, options]) => target.removeEventListener(type, handler, options));
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
    } catch {
      return "";
    }
  }

  async function collectSource(doc, sourceUrl) {
    const scriptParts = [];
    const styleParts = [];
    const inlineStyleText = Array.from(doc.querySelectorAll("style")).map(node => node.textContent || "").join("\n");
    if (inlineStyleText) styleParts.push(inlineStyleText);

    for (const node of Array.from(doc.querySelectorAll('link[rel="stylesheet"], link[as="style"]'))) {
      const href = resolveRelativeUrl(node.getAttribute("href"), sourceUrl);
      if (href) styleParts.push(await fetchTextAsset(href));
      node.remove();
    }

    doc.querySelectorAll("script").forEach(node => {
      if (node.src) return;
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
    return { styleText: styleParts.join("\n"), script: scriptParts.join("\n"), body: doc.body };
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
      .app-header { display: none !important; }
      .app-container {
        width: 100%;
        height: 100%;
        min-height: 0;
      }
      .main-layout {
        width: 100% !important;
        height: 100% !important;
        min-height: 0 !important;
        display: flex !important;
        overflow: hidden !important;
      }
      .main-content { display: none !important; }
      .simulation-column {
        position: relative !important;
        flex: 1 1 auto !important;
        min-width: 0 !important;
        height: 100% !important;
        padding: 12px !important;
        min-height: 0 !important;
      }
      .sandbox-container,
      #sandbox-wrapper {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 0;
        overflow: hidden;
        touch-action: none;
        overscroll-behavior: contain;
      }
      .sandbox-grid-overlay { position: absolute; inset: 0; pointer-events: none; }
      .sandbox-svg-layer,
      .html-overlay-layer {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
      }
      .sandbox-svg-layer { display: block; cursor: inherit; }
      .html-overlay-layer { pointer-events: none; cursor: inherit; }
      #control-panel {
        position: relative !important;
        width: 100% !important;
        max-width: none !important;
        height: auto !important;
        min-height: 100% !important;
        overflow: visible !important;
        padding: 0 !important;
        background: transparent !important;
      }
      .yw-butterfly-panel-scroll {
        width: 100% !important;
        height: 100% !important;
        min-height: 0 !important;
        overflow-x: hidden !important;
        overflow-y: auto !important;
        overscroll-behavior: contain !important;
        -webkit-overflow-scrolling: touch !important;
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
        background: transparent !important;
      }
      .yw-butterfly-panel-scroll::-webkit-scrollbar {
        width: 0 !important;
        height: 0 !important;
        display: none !important;
      }
      .control-column {
        width: 100% !important;
        min-height: 100% !important;
        height: auto !important;
        overflow: visible !important;
        padding: 10px !important;
        background: transparent !important;
        display: grid !important;
        grid-auto-rows: min-content !important;
        align-content: start !important;
        gap: 8px !important;
      }
      .panel-section {
        border: 1px solid rgba(148, 163, 184, 0.16) !important;
        border-radius: 8px !important;
        background: rgba(15, 23, 42, 0.64) !important;
        box-shadow: none !important;
        padding: 10px !important;
        color: #f8fafc !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }
      .panel-section h3,
      .theory-panel h3,
      .theory-card h3 {
        color: rgba(226, 232, 240, 0.74) !important;
        font-size: 12px !important;
        font-weight: 700 !important;
        line-height: 1.2 !important;
        margin-bottom: 8px !important;
        display: flex !important;
        align-items: center !important;
        gap: 6px !important;
      }
      .tab-buttons,
      .preset-buttons,
      .slider-group,
      .radio-group {
        display: grid !important;
        gap: 8px !important;
      }
      .tab-buttons { grid-template-columns: 1fr 1fr; }
      .btn-preset,
      .btn-preset-problem,
      .btn-step,
      .btn-secondary,
      .btn-primary,
      .btn-icon,
      .btn-zoom,
      .btn-close-icon {
        min-height: 34px !important;
        border: 1px solid rgba(148, 163, 184, 0.18) !important;
        border-radius: 8px !important;
        background: rgba(2, 6, 23, 0.36) !important;
        color: rgba(226, 232, 240, 0.82) !important;
        box-shadow: none !important;
        touch-action: manipulation;
        transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease !important;
      }
      .btn-preset {
        width: 100% !important;
        padding: 10px !important;
        font-size: 12px !important;
        font-weight: 700 !important;
        text-align: left !important;
      }
      .btn-preset-problem {
        width: 100% !important;
        min-height: 34px !important;
        padding: 9px 10px !important;
        font-size: 12px !important;
        font-weight: 700 !important;
        text-align: center !important;
        cursor: pointer !important;
      }
      .btn-preset.active {
        border-color: rgba(250, 204, 21, 0.42) !important;
        background: rgba(250, 204, 21, 0.12) !important;
        color: #fef3c7 !important;
        box-shadow: none !important;
      }
      .btn-preset.active .preset-num {
        background: rgba(250, 204, 21, 0.88) !important;
        color: #111827 !important;
      }
      .btn-preset:hover,
      .btn-preset-problem:hover,
      .btn-step:hover,
      .btn-secondary:hover,
      .btn-primary:hover,
      .btn-icon:hover,
      .btn-zoom:hover {
        border-color: rgba(250, 204, 21, 0.3) !important;
        background: rgba(15, 23, 42, 0.82) !important;
        color: #f8fafc !important;
        transform: none !important;
      }
      .proof-steps-nav .btn-preset {
        display: inline-flex !important;
        align-items: center !important;
        min-height: 36px !important;
        padding: 8px 10px !important;
        white-space: nowrap !important;
        justify-content: center !important;
        text-align: center !important;
      }
      .btn-auto-demo {
        width: 100% !important;
        min-height: 38px !important;
        justify-content: center !important;
        text-align: center !important;
      }
      .btn-auto-demo.active {
        border-color: rgba(250, 204, 21, 0.5) !important;
        background: rgba(250, 204, 21, 0.16) !important;
        color: #facc15 !important;
      }
      .hud-panel {
        position: absolute !important;
        left: 22px !important;
        top: 20px !important;
        width: min(340px, calc(100% - 44px)) !important;
        max-height: none !important;
        border-radius: 14px !important;
        overflow: hidden !important;
        border: 1px solid rgba(148, 163, 184, 0.24) !important;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.9)) !important;
        box-shadow: 0 18px 42px rgba(15, 23, 42, 0.14), 0 2px 8px rgba(15, 23, 42, 0.06) !important;
        pointer-events: auto !important;
        touch-action: pan-y !important;
        user-select: none !important;
        -webkit-user-select: none !important;
        z-index: 4 !important;
        backdrop-filter: blur(18px) saturate(1.08) !important;
        -webkit-backdrop-filter: blur(18px) saturate(1.08) !important;
      }
      .hud-panel.collapsed {
        width: max-content !important;
        max-width: calc(100% - 24px) !important;
        max-height: none !important;
        border-radius: 12px !important;
        background: rgba(255, 255, 255, 0.92) !important;
        border-color: rgba(148, 163, 184, 0.28) !important;
        box-shadow: 0 12px 26px rgba(15, 23, 42, 0.13), inset 0 1px 0 rgba(255, 255, 255, 0.9) !important;
      }
      .hud-panel.expanded {
        left: 14px !important;
        width: min(300px, calc(100% - 28px)) !important;
        max-height: none !important;
      }
      .hud-panel.expanded.collapsed {
        left: 22px !important;
        width: max-content !important;
        max-width: calc(100% - 24px) !important;
        max-height: none !important;
      }
      .hud-header {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 8px !important;
        min-height: 44px !important;
        padding: 10px 14px !important;
        border-bottom: 1px solid rgba(226, 232, 240, 0.76) !important;
        background: rgba(248, 250, 252, 0.72) !important;
      }
      .hud-panel.collapsed .hud-header {
        min-height: 38px !important;
        padding: 6px 8px 6px 12px !important;
        border-bottom: 0 !important;
        gap: 8px !important;
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
        overflow: visible !important;
        text-overflow: clip !important;
        white-space: nowrap !important;
        font-size: 12.5px !important;
      }
      .hud-control-btn {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 28px !important;
        height: 28px !important;
        border-radius: 8px !important;
        background: rgba(15, 23, 42, 0.05) !important;
        border: 1px solid rgba(148, 163, 184, 0.18) !important;
        color: #475569 !important;
        cursor: pointer !important;
      }
      .hud-panel.collapsed .hud-control-btn {
        width: 28px !important;
        height: 28px !important;
        flex: 0 0 28px !important;
        border-radius: 8px !important;
        background: rgba(15, 23, 42, 0.06) !important;
      }
      .hud-body {
        max-height: none !important;
        overflow: visible !important;
        overscroll-behavior: auto !important;
        touch-action: manipulation !important;
        -webkit-overflow-scrolling: auto !important;
        padding: 12px 14px !important;
        color: #334155 !important;
        font-size: 11.5px !important;
        line-height: 1.38 !important;
      }
      .hud-panel.collapsed .hud-body,
      .hud-panel.collapsed #steps-chalkboard {
        display: none !important;
      }
      .hud-row {
        margin-bottom: 6px !important;
        padding-bottom: 5px !important;
        border-bottom: 1px dashed rgba(148, 163, 184, 0.25) !important;
      }
      .hud-row:last-child { margin-bottom: 0 !important; padding-bottom: 0 !important; border-bottom: none !important; }
      .hud-row-label {
        font-size: 11px !important;
        font-weight: 700 !important;
        color: #64748b !important;
        margin-bottom: 2px !important;
      }
      .hud-row-val,
      .hud-formula-block,
      .success-chalk-box,
      .warning-chalk-box { color: #334155 !important; }
      .sub-label,
      .radio-label,
      .slider-label,
      .theory-content,
      .theory-content p,
      .theory-content li {
        color: #334155 !important;
      }
      .theory-content strong {
        color: #0f172a !important;
      }
      .slider-row input[type="range"] {
        height: 6px !important;
        border-radius: 999px !important;
        background: rgba(148, 163, 184, 0.34) !important;
      }
      .slider-val-indicator {
        color: #0f172a !important;
        font-size: 11px !important;
        font-weight: 700 !important;
      }
      .hud-formula-block,
      .success-chalk-box,
      .warning-chalk-box {
        margin-top: 6px !important;
        padding: 8px 10px !important;
        border-radius: 8px !important;
        border: 1px solid rgba(148, 163, 184, 0.18) !important;
        background: rgba(248, 250, 252, 0.74) !important;
        font-size: 11.5px !important;
        line-height: 1.35 !important;
      }
      .board-section {
        padding: 8px 10px !important;
        border: 1px solid rgba(148, 163, 184, 0.18) !important;
        border-radius: 9px !important;
        background: rgba(248, 250, 252, 0.72) !important;
        margin-bottom: 8px !important;
      }
      .board-section:last-child {
        margin-bottom: 0 !important;
      }
      .board-section-ok {
        border-color: rgba(16, 185, 129, 0.28) !important;
        background: rgba(240, 253, 244, 0.72) !important;
      }
      .board-section-title {
        font-size: 11px !important;
        font-weight: 800 !important;
        color: #475569 !important;
        margin-bottom: 4px !important;
      }
      .board-section-body {
        color: #334155 !important;
        font-size: 11.5px !important;
        line-height: 1.45 !important;
      }
      .board-formula {
        font-family: var(--font-mono) !important;
        font-size: 12px !important;
        font-weight: 800 !important;
        color: #0f172a !important;
        line-height: 1.45 !important;
      }
      .board-subformula {
        margin-top: 4px !important;
        color: #475569 !important;
        font-size: 10.8px !important;
        line-height: 1.4 !important;
      }
      .board-chip-row {
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 4px !important;
        margin-top: 6px !important;
      }
      .board-chip {
        display: inline-flex !important;
        align-items: center !important;
        min-height: 20px !important;
        padding: 2px 6px !important;
        border-radius: 999px !important;
        background: rgba(15, 23, 42, 0.06) !important;
        color: #334155 !important;
        font-size: 10.5px !important;
        font-weight: 800 !important;
      }
      .board-mini-grid {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) auto !important;
        gap: 4px 10px !important;
        align-items: center !important;
        font-size: 11px !important;
      }
      .board-mini-grid span {
        color: #64748b !important;
      }
      .board-mini-grid strong {
        color: #0f172a !important;
        font-family: var(--font-mono) !important;
      }
      .hud-panel .hud-title,
      .hud-panel .hud-row-label,
      .hud-panel .board-section-title {
        color: #0f172a !important;
      }
      .hud-panel .hud-body,
      .hud-panel .hud-row-val,
      .hud-panel .board-section-body,
      .hud-panel .board-subformula,
      .hud-panel .theory-content,
      .hud-panel .theory-content p,
      .hud-panel .theory-content li {
        color: #334155 !important;
      }
      .hud-panel .hud-body strong,
      .hud-panel .hud-body b,
      .hud-panel .board-section strong,
      .hud-panel .board-section b,
      .hud-panel .theory-content strong {
        color: #0f172a !important;
      }
      .hud-panel .board-chip {
        color: #334155 !important;
      }
      .hud-panel .slider-val-indicator {
        color: #0f172a !important;
      }
      .floating-area-value sub,
      .floating-area-value sup,
      .altitude-ruler-tag sub,
      .altitude-ruler-tag sup,
      .hud-panel sub,
      .hud-panel sup,
      .hud-formula-block sub,
      .hud-formula-block sup {
        font-size: 0.72em !important;
        line-height: 0 !important;
        position: relative !important;
        vertical-align: baseline !important;
      }
      .floating-area-value sub,
      .altitude-ruler-tag sub,
      .hud-panel sub,
      .hud-formula-block sub {
        bottom: -0.24em !important;
      }
      .floating-area-value sup,
      .altitude-ruler-tag sup,
      .hud-panel sup,
      .hud-formula-block sup {
        top: -0.42em !important;
      }
      .floating-label,
      .floating-label.vertex-label {
        z-index: 6 !important;
        color: #0f172a !important;
        background: rgba(255, 255, 255, 0.92) !important;
        border: 1px solid rgba(148, 163, 184, 0.22) !important;
        box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08) !important;
        text-shadow: none !important;
      }
      .floating-label.vertex-danger {
        color: #dc2626 !important;
        border-color: rgba(239, 68, 68, 0.28) !important;
      }
      .floating-label.vertex-gold {
        color: #b45309 !important;
        border-color: rgba(245, 158, 11, 0.32) !important;
      }
      .floating-area-value {
        z-index: 4 !important;
      }
      .canvas-controls {
        position: absolute !important;
        right: 18px !important;
        bottom: 18px !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 6px !important;
        z-index: 4 !important;
      }
      .btn-zoom {
        width: 38px !important;
        height: 38px !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        background: rgba(255, 255, 255, 0.94) !important;
        color: #334155 !important;
        border: 1px solid rgba(148, 163, 184, 0.24) !important;
        border-radius: 8px !important;
        cursor: pointer !important;
        box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08) !important;
      }
      .btn-zoom:hover { background: #ffffff !important; }
      .modal-overlay {
        position: fixed !important;
        inset: 0 !important;
        background: rgba(15, 23, 42, 0.4) !important;
        backdrop-filter: blur(8px) !important;
        -webkit-backdrop-filter: blur(8px) !important;
        z-index: 100 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        opacity: 0 !important;
        pointer-events: none !important;
        transition: opacity 0.3s ease !important;
      }
      .modal-overlay.active { opacity: 1 !important; pointer-events: auto !important; }
      .modal-card {
        width: min(500px, calc(100vw - 24px)) !important;
        background: #ffffff !important;
        border-radius: 16px !important;
        box-shadow: 0 20px 50px rgba(15, 23, 42, 0.12) !important;
        overflow: hidden !important;
        transform: translateY(20px) !important;
        transition: transform 0.3s ease !important;
      }
      .modal-overlay.active .modal-card { transform: translateY(0) !important; }
      .hidden { display: none !important; }
      @media (max-width: 520px) {
        .simulation-column { padding: 8px !important; }
        #control-panel, .control-column { width: 300px !important; flex-basis: 300px !important; }
        .hud-panel {
          left: 12px !important;
          top: 12px !important;
          width: min(320px, calc(100% - 24px)) !important;
          max-height: none !important;
        }
        .hud-panel.collapsed {
          width: max-content !important;
          max-width: calc(100% - 24px) !important;
        }
        .canvas-controls {
          right: 12px !important;
          bottom: 12px !important;
        }
      }
    `;
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

  function attachStyle(shadow, sourceStyle) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `${String(sourceStyle || "").replace(/:root/g, ":host")}\n${baseStyleText()}\n${unifiedJmModelHudStandardStyle()}
${unifiedJmModelHudFinalOverrides()}`;
    shadow.appendChild(style);
  }

  function extractLayout(body, sourceStyle, cleanup) {
    const canvasNode = body.querySelector(".simulation-column") || body.querySelector(".app-main") || body.querySelector(".main-layout") || body.querySelector(".main-content") || body.querySelector(".canvas-section") || body.querySelector("#sandbox-wrapper");
    const panelNode = body.querySelector(".control-column") || body.querySelector(".control-panel") || body.querySelector("#control-panel");
    if (!canvasNode) throw new Error("simulation container missing");
    if (!panelNode) throw new Error("control panel missing");
    const headerNode = body.querySelector(".app-header");
    const modalNode = body.querySelector("#modal-help");

    const scene = makeShadowHost("yw-butterfly-scene");
    const sceneShell = document.createElement("div");
    sceneShell.className = "source-shell";
    attachStyle(scene.shadow, sourceStyle);
    sceneShell.appendChild(canvasNode);
    scene.shadow.appendChild(sceneShell);
    scene.host.style.cssText = "position:absolute;inset:0;width:100%;height:100%;min-height:0;overflow:hidden;";

    const panel = makeShadowHost("yw-butterfly-panel");
    const panelShell = document.createElement("div");
    panelShell.className = "yw-butterfly-panel-scroll";
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
    try { return sceneRoot.querySelector(selector) || panelRoot.querySelector(selector); } catch { return null; }
  }

  function scopedQueryAll(sceneRoot, panelRoot, selector) {
    const results = [];
    if (!selector) return results;
    try { results.push(...sceneRoot.querySelectorAll(selector)); } catch {}
    try { results.push(...panelRoot.querySelectorAll(selector)); } catch {}
    return results;
  }

  function makeScopedDocument(sceneRoot, panelRoot, cleanup) {
    return new Proxy(document, {
      get(target, prop) {
        if (prop === "getElementById") return id => scopedQuery(sceneRoot, panelRoot, "#" + CSS.escape(String(id)));
        if (prop === "querySelector") return selector => scopedQuery(sceneRoot, panelRoot, selector);
        if (prop === "querySelectorAll") return selector => scopedQueryAll(sceneRoot, panelRoot, selector);
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
            cleanup.addListener(sceneRoot, type, handler, options);
            cleanup.addListener(panelRoot, type, handler, options);
            cleanup.addListener(window, type, handler, options);
          };
        }
        if (prop === "removeEventListener") return () => {};
        if (prop === "body") return sceneRoot;
        const value = target[prop];
        return typeof value === "function" ? value.bind(target) : value;
      }
    });
  }

  function makeScopedWindow(sceneHost, cleanup) {
    const visualViewportProxy = window.visualViewport ? new Proxy(window.visualViewport, {
      get(target, prop) {
        if (prop === "addEventListener") return (type, handler, options) => cleanup.addListener(target, type, handler, options);
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
        if (prop === "addEventListener") return (type, handler, options) => cleanup.addListener(target, type, handler, options);
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

  function runSourceScript(script, sceneRoot, panelRoot, sceneHost, cleanup) {
    const scopedDocument = makeScopedDocument(sceneRoot, panelRoot, cleanup);
    const scopedWindow = makeScopedWindow(sceneHost, cleanup);
    const source = String(script || "").replace(/requestAnimationFrame/g, "window.requestAnimationFrame");
    const runner = new Function(
      "document", "window", "requestAnimationFrame", "cancelAnimationFrame", "setTimeout", "clearTimeout", "setInterval", "clearInterval", "CSS",
      `"use strict";\n${source}\n//# sourceURL=jm_model_m21_source.js`
    );
    runner(scopedDocument, scopedWindow, scopedWindow.requestAnimationFrame, scopedWindow.cancelAnimationFrame, scopedWindow.setTimeout, scopedWindow.clearTimeout, scopedWindow.setInterval, scopedWindow.clearInterval, window.CSS);
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
        const response = await fetch(resolveSourceUrl(context), { cache: "no-store" });
        if (!response.ok) throw new Error("source.html " + response.status);
        const html = await response.text();
        if (cleanup.disposed) return;

        const doc = new DOMParser().parseFromString(html, "text/html");
        const source = await collectSource(doc, response.url || resolveSourceUrl(context));
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
        window.dispatchEvent(new Event("resize"));
      } catch (error) {
        console.error("Failed to mount面积比例模型：燕尾与蝴蝶 card:", error);
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
