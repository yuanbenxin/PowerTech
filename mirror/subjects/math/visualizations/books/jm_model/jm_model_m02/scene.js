window.MATH_VISUAL_SCENES = window.MATH_VISUAL_SCENES || {};

(function () {
  const CARD_ID = "jm_model_m02";
  const STYLE_ID = "math-hand-rotation-model-style";
  const FALLBACK_ERROR = "手拉手全等旋转模型课件载入失败，请检查本卡片目录内 source.html 与 scene.js?v=27afa873d583";
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
      style: null,
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
        this.style?.remove();
      }
    };
  }

  function collectSource(doc) {
    const scriptParts = [];
    doc.querySelectorAll("script").forEach(node => {
      if (node.src) {
        node.remove();
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
    doc.querySelectorAll('script[src], link[rel="stylesheet"], link[as="style"]').forEach(node => node.remove());
    return {
      script: scriptParts.join("\n"),
      body: doc.body
    };
  }

  function ensureStyle(cleanup) {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = `
        .hand-rotation-scene,
        .hand-rotation-scene *,
        .hand-rotation-panel,
        .hand-rotation-panel * {
          box-sizing: border-box;
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -webkit-user-drag: none;
          user-select: none;
        }
        .hand-rotation-scene {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          min-height: 0;
          overflow: hidden;
          color: #f8fafc;
          background:
            radial-gradient(circle at 22% 16%, rgba(56, 189, 248, 0.22), transparent 34%),
            radial-gradient(circle at 78% 24%, rgba(250, 204, 21, 0.18), transparent 32%),
            linear-gradient(135deg, #0f2634 0%, #111827 48%, #08111d 100%);
          font-family: Inter, "Microsoft YaHei UI", "Microsoft YaHei", system-ui, sans-serif;
          touch-action: none;
          cursor: grab;
          overscroll-behavior: contain;
        }
        .hand-rotation-scene:active {
          cursor: grabbing;
        }
        .hand-rotation-scene #canvas-container {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          min-height: 0;
          overflow: hidden;
          background:
            radial-gradient(circle at 22% 16%, rgba(56, 189, 248, 0.22), transparent 34%),
            radial-gradient(circle at 78% 24%, rgba(250, 204, 21, 0.18), transparent 32%),
            linear-gradient(135deg, #0f2634 0%, #111827 48%, #08111d 100%);
          touch-action: none;
          overscroll-behavior: contain;
        }
        .hand-rotation-scene canvas {
          position: absolute;
          inset: 0;
          display: block;
          width: 100%;
          height: 100%;
          touch-action: none;
          -webkit-touch-callout: none;
          user-select: none;
          cursor: inherit;
        }
        .hand-rotation-scene #fx-canvas {
          pointer-events: none;
          z-index: 8;
        }
        .hand-rotation-scene #canvas-hints {
          position: absolute;
          left: 14px;
          top: 14px;
          z-index: 12;
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-width: min(420px, calc(100% - 28px));
          padding: 9px 11px;
          border: 1px solid rgba(255, 255, 255, 0.13);
          border-radius: 8px;
          background: rgba(2, 6, 23, 0.58);
          color: #fff;
          font-size: 12px;
          line-height: 1.45;
          pointer-events: none;
          backdrop-filter: blur(10px);
        }
        @media (pointer: coarse), (hover: none), (max-width: 768px) {
          .hand-rotation-scene #hint-keyboard {
            display: none;
          }
        }
        .hand-rotation-panel {
          width: 100%;
          height: 100%;
          min-height: 0;
          overflow: hidden;
          color: #f8fafc;
          font-family: Inter, "Microsoft YaHei UI", "Microsoft YaHei", system-ui, sans-serif;
          background: transparent;
          touch-action: pan-y;
        }
        .hand-rotation-panel .hand-rotation-panel-scroll {
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
        .hand-rotation-panel .hand-rotation-panel-scroll::-webkit-scrollbar {
          width: 0;
          height: 0;
        }
        .hand-rotation-panel #control-panel {
          position: relative;
          width: 100%;
          max-width: none;
          height: auto;
          min-height: 100%;
          display: block;
          overflow: visible;
          padding: 14px;
          background: transparent;
          color: #f8fafc;
          touch-action: pan-y;
        }
        .hand-rotation-panel .hr-card,
        .hand-rotation-panel .hr-slider-card,
        .hand-rotation-panel .hr-toggle-card {
          padding: 10px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 8px;
          background: rgba(15, 23, 42, 0.72);
          margin-bottom: 10px;
        }
        .hand-rotation-panel .hr-title {
          margin: 0 0 8px;
          color: rgba(226, 232, 240, 0.64);
          font-size: 10px;
          font-weight: 900;
          line-height: 1.2;
          letter-spacing: 0;
        }
        .hand-rotation-panel .hr-tabs,
        .hand-rotation-panel .hr-steps,
        .hand-rotation-panel .hr-actions,
        .hand-rotation-panel .hr-presets {
          display: grid;
          gap: 7px;
        }
        .hand-rotation-panel .hr-tabs,
        .hand-rotation-panel .hr-actions {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .hand-rotation-panel .hr-steps {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }
        .hand-rotation-panel .hr-presets {
          grid-template-columns: repeat(4, minmax(0, 1fr));
          margin-top: 8px;
        }
        .hand-rotation-panel .tab-btn,
        .hand-rotation-panel .step-btn,
        .hand-rotation-panel .hr-btn,
        .hand-rotation-panel .preset-btn {
          min-width: 0;
          min-height: 38px;
          padding: 8px 7px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 8px;
          background: rgba(2, 6, 23, 0.36);
          color: rgba(226, 232, 240, 0.78);
          font: 900 11px/1.25 Inter, "Microsoft YaHei UI", sans-serif;
          cursor: pointer;
          touch-action: manipulation;
          white-space: normal;
        }
        .hand-rotation-panel .tab-btn.active {
          border-color: rgba(250, 204, 21, 0.64);
          background: rgba(250, 204, 21, 0.16);
          color: #fde68a;
        }
        .hand-rotation-panel .step-btn.active {
          border-color: rgba(56, 189, 248, 0.58);
          background: rgba(14, 165, 233, 0.17);
          color: #e0f2fe;
        }
        .hand-rotation-panel .preset-btn.active {
          border-color: rgba(250, 204, 21, 0.68);
          background: rgba(250, 204, 21, 0.16);
          color: #fef3c7;
        }
        .hand-rotation-panel .hr-btn.primary {
          border-color: rgba(56, 189, 248, 0.48);
          background: linear-gradient(135deg, rgba(14, 165, 233, 0.92), rgba(37, 99, 235, 0.9));
          color: #fff;
          box-shadow: 0 6px 16px rgba(14, 165, 233, 0.18);
        }
        .hand-rotation-panel .hr-hint {
          margin: 8px 1px 0;
          color: rgba(203, 213, 225, 0.78);
          font-size: 11px;
          line-height: 1.55;
          font-weight: 750;
        }
        .hand-rotation-panel .hr-big-row,
        .hand-rotation-panel .hr-row,
        .hand-rotation-panel .hr-toggle-row,
        .hand-rotation-panel .hr-slider-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          min-width: 0;
        }
        .hand-rotation-panel .hr-label {
          color: rgba(226, 232, 240, 0.74);
          font-size: 12px;
          font-weight: 900;
        }
        .hand-rotation-panel .hr-value {
          color: #fde047;
          font: 950 27px/1 Consolas, "SFMono-Regular", monospace;
          white-space: nowrap;
        }
        .hand-rotation-panel .hr-small-value {
          color: #e0f2fe;
          font: 900 13px/1 Consolas, monospace;
          white-space: nowrap;
        }
        .hand-rotation-panel .hr-badge {
          padding: 5px 8px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 7px;
          background: rgba(2, 6, 23, 0.34);
          color: rgba(226, 232, 240, 0.74);
          font-size: 10px;
          font-weight: 900;
          white-space: nowrap;
        }
        .hand-rotation-panel .hr-badge.ok {
          border-color: rgba(34, 197, 94, 0.48);
          background: rgba(34, 197, 94, 0.16);
          color: #bbf7d0;
        }
        .hand-rotation-panel .hr-progress {
          position: relative;
          width: 100%;
          height: 7px;
          margin: 9px 0 10px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.18);
        }
        .hand-rotation-panel #match-progress {
          height: 100%;
          width: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #0ea5e9, #facc15);
        }
        .hand-rotation-panel #match-progress.ok {
          background: linear-gradient(90deg, #22c55e, #86efac);
          box-shadow: 0 0 10px rgba(34, 197, 94, 0.56);
        }
        .hand-rotation-panel .hr-metrics {
          display: grid;
          gap: 7px;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px dashed rgba(148, 163, 184, 0.2);
        }
        .hand-rotation-panel .hr-row {
          padding: 7px 8px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 8px;
          background: rgba(2, 6, 23, 0.28);
          color: rgba(203, 213, 225, 0.78);
          font-size: 12px;
          line-height: 1.3;
        }
        .hand-rotation-panel .reason-card {
          padding: 10px;
          border-color: rgba(148, 163, 184, 0.16);
          background:
            linear-gradient(180deg, rgba(15, 23, 42, 0.82), rgba(15, 23, 42, 0.68)),
            rgba(15, 23, 42, 0.72);
        }
        .hand-rotation-panel .reason-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          min-height: 32px;
          margin-bottom: 9px;
          padding-bottom: 8px;
          border-bottom: 1px dashed rgba(148, 163, 184, 0.18);
        }
        .hand-rotation-panel .reason-name {
          color: rgba(226, 232, 240, 0.82);
          font-size: 10px;
          font-weight: 950;
          line-height: 1.2;
          letter-spacing: 0;
        }
        .hand-rotation-panel .reason-result {
          min-width: 0;
          padding: 5px 8px;
          border: 1px solid rgba(34, 197, 94, 0.3);
          border-radius: 8px;
          background: rgba(22, 101, 52, 0.16);
          color: #bbf7d0;
          font: 950 11px/1.1 Consolas, "Microsoft YaHei UI", monospace;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .hand-rotation-panel .hr-proof {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 5px;
          padding: 5px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 8px;
          background: rgba(2, 6, 23, 0.24);
        }
        .hand-rotation-panel .hr-proof-line {
          position: relative;
          min-width: 0;
          min-height: 50px;
          padding: 7px 6px 6px;
          border-radius: 6px;
          border: 1px solid rgba(148, 163, 184, 0.12);
          background: rgba(15, 23, 42, 0.44);
        }
        .hand-rotation-panel .hr-proof-line + .hr-proof-line::before {
          content: "";
          position: absolute;
          left: -6px;
          top: 50%;
          width: 7px;
          height: 7px;
          border-top: 1px solid rgba(148, 163, 184, 0.38);
          border-right: 1px solid rgba(148, 163, 184, 0.38);
          transform: translateY(-50%) rotate(45deg);
          background: transparent;
        }
        .hand-rotation-panel .hr-proof-tag {
          display: inline-flex;
          align-items: center;
          height: 15px;
          max-width: 100%;
          margin-bottom: 3px;
          padding: 0 5px;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.12);
          color: rgba(203, 213, 225, 0.66);
          font-size: 8px;
          font-weight: 950;
          white-space: nowrap;
        }
        .hand-rotation-panel .hr-proof-text {
          display: -webkit-box;
          min-width: 0;
          color: rgba(224, 242, 254, 0.92);
          font: 950 10px/1.22 Consolas, "Microsoft YaHei UI", monospace;
          overflow: hidden;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          word-break: break-all;
        }
        .hand-rotation-panel .hr-checks {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 6px;
          margin-top: 8px;
        }
        .hand-rotation-panel .hr-check {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          min-width: 0;
          min-height: 34px;
          padding: 6px 7px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 8px;
          background: rgba(2, 6, 23, 0.24);
          color: rgba(203, 213, 225, 0.78);
          font-size: 10px;
          font-weight: 900;
          line-height: 1.15;
        }
        .hand-rotation-panel .hr-check-title {
          min-width: 0;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        .hand-rotation-panel .hr-check .mark {
          min-width: 28px;
          padding: 3px 5px;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.12);
          color: rgba(203, 213, 225, 0.64);
          text-align: center;
          font-size: 9px;
          flex: 0 0 auto;
        }
        .hand-rotation-panel .hr-check.ok {
          border-color: rgba(34, 197, 94, 0.24);
          background: rgba(22, 101, 52, 0.12);
          color: rgba(220, 252, 231, 0.92);
        }
        .hand-rotation-panel .hr-check.ok .mark {
          background: rgba(34, 197, 94, 0.22);
          color: #bbf7d0;
          box-shadow: inset 0 0 0 1px rgba(134, 239, 172, 0.16);
        }
        .hand-rotation-panel .hr-check.bad {
          border-color: rgba(250, 204, 21, 0.24);
          background: rgba(113, 63, 18, 0.12);
          color: rgba(254, 240, 138, 0.9);
        }
        .hand-rotation-panel .hr-check.bad .mark {
          background: rgba(250, 204, 21, 0.16);
          color: #fde68a;
          box-shadow: inset 0 0 0 1px rgba(250, 204, 21, 0.14);
        }
        .hand-rotation-panel .hr-check-detail {
          display: none;
        }
        .hand-rotation-panel .hr-mini-actions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 7px;
          margin-top: 8px;
        }
        .hand-rotation-panel .rect-switch {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 4px;
          padding: 3px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 8px;
          background: rgba(2, 6, 23, 0.26);
        }
        .hand-rotation-panel .rect-tool {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px dashed rgba(148, 163, 184, 0.16);
        }
        .hand-rotation-panel .rect-switch + .rect-switch {
          margin-top: 6px;
        }
        .hand-rotation-panel .rect-switch .hr-btn {
          min-height: 32px;
          padding: 6px 5px;
          border-radius: 6px;
          background: transparent;
          font-size: 10px;
        }
        .hand-rotation-panel .rect-switch .hr-btn small {
          display: block;
          margin-top: 2px;
          color: rgba(203, 213, 225, 0.58);
          font: 850 9px/1 Consolas, "Microsoft YaHei UI", monospace;
        }
        .hand-rotation-panel .rect-switch .hr-btn.active {
          border-color: rgba(56, 189, 248, 0.5);
          background: rgba(14, 165, 233, 0.18);
          color: #e0f2fe;
        }
        .hand-rotation-panel .rect-switch .hr-btn.active small {
          color: rgba(224, 242, 254, 0.82);
        }
        .hand-rotation-panel .rect-reveal .hr-btn.active {
          border-color: rgba(250, 204, 21, 0.64);
          background: rgba(250, 204, 21, 0.16);
          color: #fef3c7;
        }
        .hand-rotation-panel .rect-switch .hr-btn.primary {
          box-shadow: none;
        }
        .hand-rotation-panel .hr-btn.active {
          border-color: rgba(250, 204, 21, 0.7);
          background: rgba(250, 204, 21, 0.18);
          color: #fef3c7;
        }
        .hand-rotation-panel .hr-card.is-hidden {
          display: none;
        }
        .hand-rotation-panel .rect-tool.is-hidden {
          display: none;
        }
        .hand-rotation-panel .hr-slider-card,
        .hand-rotation-panel .hr-toggle-card {
          display: grid;
          gap: 8px;
        }
        .hand-rotation-panel .hr-toggle-card {
          border-color: rgba(250, 204, 21, 0.22);
          background: rgba(250, 204, 21, 0.08);
        }
        .hand-rotation-panel .hr-slider-row span {
          flex: 0 0 18px;
          color: rgba(203, 213, 225, 0.82);
          font: 900 10px/1 Consolas, monospace;
        }
        .hand-rotation-panel input[type="range"] {
          width: 100%;
          height: 32px;
          margin: 0;
          padding: 12px 0;
          border: 0;
          background: transparent;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          touch-action: none;
        }
        .hand-rotation-panel input[type="range"]::-webkit-slider-runnable-track {
          height: 5px;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.24);
        }
        .hand-rotation-panel input[type="range"]::-webkit-slider-thumb {
          width: 20px;
          height: 20px;
          margin-top: -8px;
          border: 3px solid #0f172a;
          border-radius: 50%;
          background: #facc15;
          box-shadow: 0 0 0 1px rgba(250, 204, 21, 0.4), 0 4px 12px rgba(0, 0, 0, 0.28);
          appearance: none;
          -webkit-appearance: none;
        }
        .hand-rotation-panel input[type="checkbox"].toggle-checkbox {
          position: absolute;
          width: 1px;
          height: 1px;
          margin: -1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
        }
        .hand-rotation-panel .toggle-label {
          position: relative;
          display: block;
          flex: 0 0 auto;
          width: 36px;
          height: 22px;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.34);
          transition: background 0.18s ease;
        }
        .hand-rotation-panel .toggle-label .dot {
          position: absolute;
          left: 4px;
          top: 4px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #f8fafc;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
          transition: transform 0.18s ease;
        }
        .hand-rotation-panel .toggle-checkbox:checked + .toggle-label {
          background: rgba(250, 204, 21, 0.82);
        }
        .hand-rotation-panel .toggle-checkbox:checked + .toggle-label .dot {
          transform: translateX(14px);
        }
        .hand-rotation-panel .hr-toggle-row {
          min-height: 42px;
          color: rgba(226, 232, 240, 0.82);
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
          touch-action: manipulation;
        }
        @media (max-width: 720px) {
          .hand-rotation-scene #canvas-hints {
            font-size: 11px;
            padding: 8px 9px;
          }
          .hand-rotation-panel .hr-tabs,
          .hand-rotation-panel .hr-actions {
            grid-template-columns: 1fr;
          }
          .hand-rotation-panel .hr-steps {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .hand-rotation-panel .hr-presets {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .hand-rotation-panel .hr-value {
            font-size: 25px;
          }
        }
      `;
      document.head.appendChild(style);
    }
    cleanup.style = null;
  }

  function extractLayout(body) {
    const canvasNode = body.querySelector("#canvas-container");
    const panelNode = body.querySelector("#control-panel");
    if (!canvasNode) throw new Error("canvas-container missing");
    if (!panelNode) throw new Error("control-panel missing");
    canvasNode.className = "";
    panelNode.className = "";

    const sceneRoot = document.createElement("div");
    sceneRoot.className = "hand-rotation-scene";
    sceneRoot.dataset.cardId = CARD_ID;
    sceneRoot.appendChild(canvasNode);

    const panelRoot = document.createElement("div");
    panelRoot.className = "hand-rotation-panel";
    panelRoot.dataset.cardId = CARD_ID;
    panelRoot.innerHTML = `<div class="hand-rotation-panel-scroll"></div>`;
    panelRoot.firstElementChild.appendChild(panelNode);

    return { sceneRoot, panelRoot };
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
            cleanup.addListener(sceneRoot, type, handler, options);
            cleanup.addListener(panelRoot, type, handler, options);
          };
        }
        if (prop === "removeEventListener") {
          return () => {};
        }
        if (prop === "body") return sceneRoot;
        const value = target[prop];
        return typeof value === "function" ? value.bind(target) : value;
      }
    });
  }

  function makeScopedWindow(sceneRoot, cleanup) {
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
        if (prop === "innerWidth") return Math.max(1, Math.round(sceneRoot.clientWidth || target.innerWidth || 1));
        if (prop === "innerHeight") return Math.max(1, Math.round(sceneRoot.clientHeight || target.innerHeight || 1));
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
    ["contextmenu", "selectstart", "dragstart"].forEach(type => {
      cleanup.addListener(root, type, event => event.preventDefault());
    });
    cleanup.addListener(root, "touchstart", event => {
      if (event.touches && event.touches.length > 1 && !event.target.closest(".hand-rotation-panel")) {
        event.preventDefault();
      }
    }, { passive: false });
  }

  function runSourceScript(script, sceneRoot, panelRoot, cleanup) {
    const scopedDocument = makeScopedDocument(sceneRoot, panelRoot, cleanup);
    const scopedWindow = makeScopedWindow(sceneRoot, cleanup);
    const source = String(script || "")
      .replace(/window\.addEventListener/g, "window.addEventListener")
      .replace(/requestAnimationFrame/g, "window.requestAnimationFrame");
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
      `"use strict";\n${source}\n//# sourceURL=jm_model_m02_source.js`
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
        ensureStyle(cleanup);
        const response = await fetch(resolveSourceUrl(context), { cache: "no-store" });
        if (!response.ok) throw new Error("source.html " + response.status);
        const html = await response.text();
        if (cleanup.disposed) return;

        const doc = new DOMParser().parseFromString(html, "text/html");
        const source = collectSource(doc);
        const { sceneRoot, panelRoot } = extractLayout(source.body);

        container.appendChild(sceneRoot);
        cleanup.roots.push(sceneRoot);

        const panelHost = context?.externalPanel && context.externalPanel.nodeType === 1 ? context.externalPanel : null;
        if (panelHost) {
          panelHost.appendChild(panelRoot);
          cleanup.roots.push(panelRoot);
        } else {
          panelRoot.style.position = "absolute";
          panelRoot.style.right = "12px";
          panelRoot.style.top = "12px";
          panelRoot.style.bottom = "12px";
          panelRoot.style.width = "min(360px, calc(100% - 24px))";
          panelRoot.style.zIndex = "20";
          container.appendChild(panelRoot);
          cleanup.roots.push(panelRoot);
        }

        blockNativeTouchMenus(sceneRoot, cleanup);
        blockNativeTouchMenus(panelRoot, cleanup);
        runSourceScript(source.script, sceneRoot, panelRoot, cleanup);
        window.dispatchEvent(new Event("resize"));
      } catch (error) {
        console.error("Failed to mount hand rotation model card:", error);
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
