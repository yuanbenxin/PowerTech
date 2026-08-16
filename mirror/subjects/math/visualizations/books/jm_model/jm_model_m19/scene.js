window.MATH_VISUAL_SCENES = window.MATH_VISUAL_SCENES || {};

(function () {
  const CARD_ID = "jm_model_m19";
  const STYLE_ID = "math-hu-bugui-model-style";
  const mounts = new WeakMap();
  const FALLBACK_ERROR = "胡不归模型课件载入失败，请检查 source.html、style.css?v=2cc61ef8458e 与 scene.js?v=766187295dfb";

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
      .app-container {
        width: 100%;
        height: 100%;
        min-height: 0;
      }
      .main-layout {
        width: 100%;
        height: 100%;
        min-height: 0;
        gap: 0 !important;
      }
      .simulation-column {
        position: relative !important;
        width: 100% !important;
        height: 100% !important;
        min-height: 0 !important;
        flex: none !important;
        border-radius: 8px !important;
        overflow: hidden !important;
      }
      .canvas-section,
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
      #sandbox-svg,
      .sandbox-svg-layer,
      .html-overlay,
      .html-overlay-layer {
        cursor: inherit;
      }
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
      .control-column,
      .placeholder-panel {
        width: 100% !important;
        min-height: 100% !important;
        display: grid !important;
        grid-auto-rows: min-content !important;
        align-content: start !important;
        gap: 10px !important;
        overflow: visible !important;
        padding: 12px !important;
      }
      .panel-section,
      .placeholder-row {
        border: 1px solid rgba(148, 163, 184, 0.16) !important;
        border-radius: 8px !important;
        background: rgba(15, 23, 42, 0.62) !important;
        box-shadow: none !important;
        padding: 10px !important;
        color: #f8fafc !important;
        backdrop-filter: none !important;
      }
      .panel-section h3,
      .theory-card h3,
      .placeholder-panel h2 {
        color: rgba(226, 232, 240, 0.78) !important;
        font-size: 12px !important;
        line-height: 1.2 !important;
        margin-bottom: 8px !important;
      }
      .control-action-btn-group,
      .presets-grid,
      .slider-wrapper,
      .slider-group,
      .proof-step-control,
      .radar-control-panel {
        display: grid !important;
        gap: 8px !important;
      }
      .btn-preset,
      .btn-step,
      .btn-secondary,
      .btn-primary,
      .btn-icon,
      .btn-control-action,
      .btn-preset-problem {
        min-height: 34px !important;
        border: 1px solid rgba(148, 163, 184, 0.18) !important;
        border-radius: 8px !important;
        background: rgba(2, 6, 23, 0.36) !important;
        color: rgba(226, 232, 240, 0.84) !important;
        box-shadow: none !important;
        touch-action: manipulation;
      }
      .control-panel {
        width: 100% !important;
        min-height: 100% !important;
        display: grid !important;
        grid-auto-rows: min-content !important;
        align-content: start !important;
        gap: 9px !important;
        overflow: visible !important;
        padding: 12px !important;
        border: 1px solid rgba(148, 163, 184, 0.12) !important;
        border-radius: 0 !important;
        background:
          linear-gradient(180deg, rgba(15, 23, 42, 0.82), rgba(2, 6, 23, 0.76)),
          rgba(15, 23, 42, 0.72) !important;
        box-shadow: inset 1px 0 0 rgba(255, 255, 255, 0.04) !important;
      }
      .control-group {
        display: grid !important;
        gap: 8px !important;
        padding: 10px !important;
        border: 1px solid rgba(148, 163, 184, 0.12) !important;
        border-radius: 14px !important;
        background:
          linear-gradient(180deg, rgba(30, 41, 59, 0.42), rgba(15, 23, 42, 0.28)),
          rgba(15, 23, 42, 0.34) !important;
        box-shadow: 0 10px 24px rgba(2, 6, 23, 0.12) !important;
      }
      .group-title {
        display: flex !important;
        align-items: center !important;
        gap: 6px !important;
        margin: 0 !important;
        padding-left: 0 !important;
        border-left: 0 !important;
        color: rgba(226, 232, 240, 0.9) !important;
        font-size: 13px !important;
        font-weight: 800 !important;
        letter-spacing: 0 !important;
      }
      .group-title::after {
        content: "" !important;
        flex: 1 !important;
        height: 1px !important;
        margin-left: 8px !important;
        background: linear-gradient(90deg, rgba(96, 165, 250, 0.28), transparent) !important;
      }
      .tab-buttons {
        padding: 3px !important;
        border-radius: 12px !important;
        background: rgba(2, 6, 23, 0.26) !important;
        border: 1px solid rgba(148, 163, 184, 0.12) !important;
      }
      .btn-preset,
      .btn-step,
      .btn-preset-problem {
        min-height: 32px !important;
        border-radius: 10px !important;
        border: 1px solid rgba(148, 163, 184, 0.14) !important;
        background: rgba(15, 23, 42, 0.44) !important;
        color: rgba(226, 232, 240, 0.88) !important;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03) !important;
      }
      .btn-preset.active,
      .btn-step:hover,
      .btn-preset-problem:hover {
        background: rgba(59, 130, 246, 0.14) !important;
        border-color: rgba(96, 165, 250, 0.34) !important;
        color: #eaf4ff !important;
        box-shadow: 0 8px 20px rgba(37, 99, 235, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.05) !important;
      }
      .slider-wrapper {
        gap: 7px !important;
      }
      .slider-label-group {
        align-items: center !important;
        gap: 8px !important;
        font-size: 12px !important;
      }
      .slider-value {
        padding: 2px 7px !important;
        border-radius: 999px !important;
        background: rgba(59, 130, 246, 0.12) !important;
        color: #93c5fd !important;
      }
      .custom-slider {
        height: 7px !important;
        border-radius: 999px !important;
        background: linear-gradient(90deg, rgba(59, 130, 246, 0.55), rgba(59, 130, 246, 0.18)) !important;
      }
      .custom-slider::-webkit-slider-thumb {
        width: 20px !important;
        height: 20px !important;
        background: #dbeafe !important;
        border: 4px solid #3b82f6 !important;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35) !important;
      }
      .slider-subtext {
        font-size: 11px !important;
        line-height: 1.45 !important;
        color: rgba(148, 163, 184, 0.84) !important;
      }
      .proof-step-control,
      .theory-body {
        padding: 8px 10px !important;
        border-radius: 12px !important;
        background: rgba(2, 6, 23, 0.24) !important;
        border: 1px solid rgba(148, 163, 184, 0.1) !important;
      }
      .step-badge {
        border-radius: 999px !important;
        padding: 4px 10px !important;
        background: rgba(168, 85, 247, 0.13) !important;
        border-color: rgba(192, 132, 252, 0.28) !important;
        color: #ddd6fe !important;
      }
      .preset-grid,
      .step-nav-buttons {
        gap: 7px !important;
      }
      .preset-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }
      .btn-preset-problem {
        position: relative !important;
        padding: 7px 10px 7px 14px !important;
        font-weight: 700 !important;
        text-align: left !important;
      }
      .btn-preset-problem::before {
        content: "" !important;
        position: absolute !important;
        left: 7px !important;
        top: 50% !important;
        width: 3px !important;
        height: 16px !important;
        border-radius: 99px !important;
        background: rgba(96, 165, 250, 0.45) !important;
        transform: translateY(-50%) !important;
      }
      .theory-short-row {
        align-items: center !important;
        gap: 7px !important;
        margin-bottom: 5px !important;
      }
      .theory-short-row strong:first-child {
        width: 18px !important;
        height: 18px !important;
        flex: 0 0 auto !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        border-radius: 6px !important;
        background: rgba(59, 130, 246, 0.12) !important;
        color: #93c5fd !important;
        font-size: 11px !important;
      }
      .result-card {
        display: grid !important;
        gap: 8px !important;
        padding: 10px !important;
        border: 1px solid rgba(96, 165, 250, 0.18) !important;
        border-radius: 13px !important;
        background:
          radial-gradient(circle at 16% 12%, rgba(96, 165, 250, 0.18), transparent 32%),
          rgba(2, 6, 23, 0.24) !important;
      }
      .result-main {
        display: grid !important;
        grid-template-columns: auto minmax(0, 1fr) auto !important;
        align-items: baseline !important;
        gap: 8px !important;
      }
      .result-label,
      .result-unit,
      .result-grid span {
        color: rgba(148, 163, 184, 0.86) !important;
        font-size: 11px !important;
        font-weight: 700 !important;
      }
      .result-main strong {
        color: #eaf4ff !important;
        font: 800 24px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace !important;
        letter-spacing: 0 !important;
      }
      .result-grid {
        display: grid !important;
        grid-template-columns: 1fr 1fr !important;
        gap: 8px !important;
      }
      .result-grid > div {
        display: grid !important;
        gap: 3px !important;
        padding: 7px 8px !important;
        border: 1px solid rgba(148, 163, 184, 0.1) !important;
        border-radius: 10px !important;
        background: rgba(15, 23, 42, 0.35) !important;
      }
      .result-grid strong {
        color: #cbd5e1 !important;
        font: 800 14px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace !important;
      }
      .route-status {
        min-height: 24px !important;
        display: flex !important;
        align-items: center !important;
        padding: 6px 8px !important;
        border-radius: 9px !important;
        background: rgba(15, 23, 42, 0.42) !important;
        color: rgba(203, 213, 225, 0.9) !important;
        font-size: 11px !important;
        line-height: 1.35 !important;
      }
      .route-status.is-optimal {
        background: rgba(16, 185, 129, 0.12) !important;
        color: #a7f3d0 !important;
      }
      .btn-demo-main {
        background: linear-gradient(135deg, rgba(37, 99, 235, 0.36), rgba(14, 165, 233, 0.2)) !important;
        border-color: rgba(96, 165, 250, 0.38) !important;
        color: #eff6ff !important;
      }
      .btn-step:disabled {
        opacity: 0.62 !important;
        cursor: wait !important;
      }
      .drag-hit-area {
        fill: transparent !important;
        stroke: transparent !important;
        pointer-events: all !important;
        cursor: grab !important;
        touch-action: none !important;
      }
      .drag-hit-area:active,
      .drag-hit-area.active {
        cursor: grabbing !important;
      }
      .p0-guide-line {
        stroke: rgba(16, 185, 129, 0.46) !important;
        stroke-width: 2 !important;
        stroke-dasharray: 3, 5 !important;
        pointer-events: none !important;
      }
      .p0-guide-marker {
        fill: rgba(16, 185, 129, 0.9) !important;
        stroke: rgba(255, 255, 255, 0.92) !important;
        stroke-width: 2 !important;
        filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.35)) !important;
        pointer-events: none !important;
      }
      .optimal-current-line {
        stroke-width: 4 !important;
        filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.52)) !important;
      }
      .optimal-current-point {
        fill: #10b981 !important;
        filter: drop-shadow(0 0 12px rgba(16, 185, 129, 0.35)) !important;
      }
      .hud-panel {
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.9)) !important;
        border: 1px solid rgba(148, 163, 184, 0.24) !important;
        color: #0f172a !important;
        box-shadow: 0 18px 42px rgba(15, 23, 42, 0.14), 0 2px 8px rgba(15, 23, 42, 0.06) !important;
        left: 18px !important;
        top: 18px !important;
        width: min(276px, calc(100% - 36px)) !important;
        max-height: none !important;
        border-radius: 14px !important;
        overflow: hidden !important;
        pointer-events: auto !important;
        touch-action: pan-y !important;
        user-select: none !important;
        -webkit-user-select: none !important;
      }
      .hud-panel.collapsed {
        background: rgba(255, 255, 255, 0.92) !important;
        border-color: rgba(148, 163, 184, 0.28) !important;
        box-shadow: 0 12px 26px rgba(15, 23, 42, 0.13), inset 0 1px 0 rgba(255, 255, 255, 0.9) !important;
        width: 126px !important;
        max-height: 46px !important;
      }
      .hud-header {
        background: rgba(248, 250, 252, 0.72) !important;
        border-bottom-color: rgba(226, 232, 240, 0.76) !important;
        min-height: 42px !important;
        padding: 9px 11px !important;
      }
      .hud-title {
        color: #0f172a !important;
        font-size: 13px !important;
        font-weight: 800 !important;
        white-space: nowrap !important;
      }
      .hud-control-btn {
        color: #475569 !important;
        background: rgba(15, 23, 42, 0.05) !important;
        border: 1px solid rgba(148, 163, 184, 0.18) !important;
        width: 28px !important;
        height: 28px !important;
        border-radius: 8px !important;
      }
      .hud-body {
        max-height: none !important;
        overflow: visible !important;
        padding: 10px 12px 12px !important;
        font-size: 11.5px !important;
        line-height: 1.38 !important;
        color: #334155 !important;
      }
      .hud-row {
        margin-bottom: 6px !important;
        padding-bottom: 5px !important;
      }
      .hud-row-label {
        color: #64748b !important;
        font-size: 11px !important;
        margin-bottom: 1px !important;
      }
      .hud-row-val,
      .hud-formula-block,
      .success-chalk-box,
      .warning-chalk-box {
        color: #334155 !important;
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
      .floating-label,
      .floating-text-badge,
      .speed-entity-label,
      .perfect-ratio-badge {
        pointer-events: none !important;
      }
      .floating-label {
        font-size: 14px !important;
        color: #f8fafc !important;
        text-shadow: 0 2px 4px rgba(0,0,0,0.8), 0 0 4px rgba(255,255,255,0.15) !important;
      }
      .floating-text-badge {
        font-size: 11px !important;
        white-space: nowrap !important;
      }
      .modal-overlay {
        position: fixed !important;
        inset: 0 !important;
        background: rgba(5, 8, 16, 0.75) !important;
        backdrop-filter: blur(8px) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        z-index: 1000 !important;
      }
      .modal-content,
      .modal-card {
        background: #0f172a !important;
        border: 1px solid rgba(148, 163, 184, 0.18) !important;
        border-radius: 16px !important;
        padding: 24px !important;
        width: min(560px, calc(100vw - 24px)) !important;
        color: #e2e8f0 !important;
      }
      .hidden {
        display: none !important;
      }
      @media (max-width: 520px) {
        .hud-panel.collapsed {
          width: 118px !important;
        }
      }
    `;
  }

  function attachStyle(shadow, sourceStyle) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `${String(sourceStyle || "").replace(/:root/g, ":host")}\n${baseStyleText()}`;
    shadow.appendChild(style);
  }

  function extractLayout(body, sourceStyle, cleanup) {
    const canvasNode = body.querySelector(".simulation-column") || body.querySelector(".canvas-section") || body.querySelector("#canvas-container") || body.querySelector("#sandbox-wrapper");
    const hudNode = body.querySelector(".hud-panel") || body.querySelector("#hud-panel");
    const panelNode = body.querySelector(".control-column") || body.querySelector(".control-panel") || body.querySelector("#control-panel");
    if (!canvasNode) throw new Error("simulation container missing");
    if (!panelNode) throw new Error("control panel missing");
    const headerNode = body.querySelector(".app-header");
    const modalNode = body.querySelector("#modal-help");

    if (canvasNode.id === "canvas-container") canvasNode.className = "";
    if (panelNode.id === "control-panel") panelNode.className = "";

    const scene = makeShadowHost("hu-bugui-scene");
    const sceneShell = document.createElement("div");
    sceneShell.className = "source-shell";
    attachStyle(scene.shadow, sourceStyle);
    if (hudNode) sceneShell.appendChild(hudNode);
    sceneShell.appendChild(canvasNode);
    scene.shadow.appendChild(sceneShell);
    scene.host.style.cssText = "position:absolute;inset:0;width:100%;height:100%;min-height:0;overflow:hidden;";

    const panel = makeShadowHost("hu-bugui-panel");
    const panelShell = document.createElement("div");
    panelShell.className = "source-shell";
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
      "document",
      "window",
      "requestAnimationFrame",
      "cancelAnimationFrame",
      "setTimeout",
      "clearTimeout",
      "setInterval",
      "clearInterval",
      "CSS",
      `"use strict";\n${source}\n//# sourceURL=jm_model_m19_source.js`
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
        console.error("Failed to mount Hu Bugui model card:", error);
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
