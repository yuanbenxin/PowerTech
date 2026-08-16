window.MATH_VISUAL_SCENES = window.MATH_VISUAL_SCENES || {};

(function () {
  const CARD_ID = "jm_model_m01";
  const STYLE_ID = "math-water-horse-path-style";
  const FALLBACK_ERROR = "将军饮马课件载入失败，请检查本卡片目录内 source.html 与 scene.js?v=32208a860235";
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
        .water-horse-scene,
        .water-horse-scene *,
        .water-horse-panel,
        .water-horse-panel * {
          box-sizing: border-box;
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -webkit-user-drag: none;
          user-select: none;
        }
        .water-horse-scene {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          min-height: 0;
          overflow: hidden;
          color: #f8fafc;
          background:
            radial-gradient(circle at 58% 24%, #264f46 0%, #162f2b 46%, #081412 100%);
          font-family: Inter, "Microsoft YaHei UI", "Microsoft YaHei", system-ui, sans-serif;
          touch-action: none;
          cursor: pointer;
          overscroll-behavior: contain;
        }
        .water-horse-scene #canvas-container {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          min-height: 0;
          overflow: hidden;
          background:
            radial-gradient(circle at 58% 24%, #264f46 0%, #162f2b 46%, #081412 100%);
          box-shadow: inset 10px 0 30px rgba(0,0,0,0.3);
          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
          overscroll-behavior: contain;
          cursor: pointer;
        }
        .water-horse-scene canvas {
          position: absolute;
          inset: 0;
          display: block;
          width: 100%;
          height: 100%;
          touch-action: none;
          cursor: pointer;
          user-select: none;
          -webkit-touch-callout: none;
        }
        .water-horse-scene #fx-canvas {
          pointer-events: none;
          z-index: 10;
        }
        .water-horse-scene #canvas-hints {
          position: absolute;
          left: 14px;
          top: 14px;
          z-index: 12;
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-width: min(390px, calc(100% - 28px));
          padding: 9px 11px;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          background: rgba(0,0,0,0.50);
          color: #fff;
          font-size: 12px;
          line-height: 1.45;
          pointer-events: none;
          backdrop-filter: blur(10px);
        }
        @media (pointer: coarse), (hover: none), (max-width: 768px) {
          .water-horse-scene #hint-keyboard {
            display: none;
          }
        }
        .water-horse-panel {
          width: 100%;
          height: 100%;
          min-height: 0;
          overflow: hidden;
          color: #f8fafc;
          font-family: Inter, "Microsoft YaHei UI", "Microsoft YaHei", system-ui, sans-serif;
          background: transparent;
          touch-action: pan-y;
        }
        .water-horse-panel .water-horse-panel-scroll {
          width: 100%;
          height: 100%;
          min-height: 0;
          display: flex;
          flex-direction: column;
          overflow-x: hidden;
          overflow-y: auto;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          background: transparent;
        }
        .water-horse-panel .water-horse-panel-scroll::-webkit-scrollbar {
          width: 0;
          height: 0;
        }
        .water-horse-panel #water-horse-controls {
          position: relative;
          width: 100%;
          min-height: 100%;
          display: flex;
          flex-direction: column;
          flex: 1 1 auto;
          gap: 10px;
          overflow: visible;
          padding: 14px;
          background: transparent;
        }
        .water-horse-panel .wh-block {
          padding: 10px;
          border: 1px solid rgba(148,163,184,0.16);
          border-radius: 8px;
          background: rgba(15,23,42,0.64);
        }
        .water-horse-panel .wh-block-title {
          margin: 0 0 8px;
          color: rgba(226,232,240,0.62);
          font-size: 10px;
          line-height: 1.2;
          font-weight: 900;
          letter-spacing: 0;
        }
        .water-horse-panel .wh-tabs {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 7px;
        }
        .water-horse-panel .tab-btn {
          min-width: 0;
          min-height: 42px;
          padding: 8px 6px;
          border: 1px solid rgba(148,163,184,0.18);
          border-radius: 8px;
          background: rgba(2,6,23,0.36);
          color: rgba(226,232,240,0.76);
          font: 900 12px/1.25 Inter, "Microsoft YaHei UI", sans-serif;
          cursor: pointer;
          transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
          touch-action: manipulation;
          white-space: normal;
        }
        .water-horse-panel .tab-btn.active {
          border-color: rgba(250,204,21,0.62);
          background: rgba(250,204,21,0.16);
          color: #fde68a;
          box-shadow: 0 0 0 1px rgba(250,204,21,0.08) inset;
        }
        .water-horse-panel #mode-hint {
          margin: 8px 1px 0;
          color: rgba(203,213,225,0.78);
          font-size: 11px;
          line-height: 1.55;
          font-weight: 750;
        }
        .water-horse-panel .wh-step-card {
          display: grid;
          gap: 8px;
          padding: 10px;
          border: 1px solid rgba(148,163,184,0.16);
          border-radius: 8px;
          background: rgba(15,23,42,0.64);
        }
        .water-horse-panel .wh-step-tabs {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 6px;
        }
        .water-horse-panel .step-btn {
          min-width: 0;
          min-height: 34px;
          padding: 6px 5px;
          border: 1px solid rgba(148,163,184,0.18);
          border-radius: 8px;
          background: rgba(2,6,23,0.36);
          color: rgba(226,232,240,0.72);
          font: 900 10px/1.2 Inter, "Microsoft YaHei UI", sans-serif;
          cursor: pointer;
          white-space: normal;
          touch-action: manipulation;
        }
        .water-horse-panel .step-btn.active {
          border-color: rgba(56,189,248,0.56);
          background: rgba(14,165,233,0.16);
          color: #e0f2fe;
        }
        .water-horse-panel #ui-step-hint {
          margin: 0;
          color: rgba(203,213,225,0.78);
          font-size: 11px;
          line-height: 1.5;
          font-weight: 750;
        }
        .water-horse-panel .wh-dashboard {
          padding: 10px;
          border: 1px solid rgba(148,163,184,0.16);
          border-radius: 8px;
          background: rgba(15,23,42,0.64);
        }
        .water-horse-panel .wh-distance-row,
        .water-horse-panel .wh-delta-row,
        .water-horse-panel .wh-theory-row,
        .water-horse-panel .wh-graph-head,
        .water-horse-panel .wh-toggle-row,
        .water-horse-panel .wh-slider-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          min-width: 0;
        }
        .water-horse-panel .wh-small-label {
          color: rgba(226,232,240,0.72);
          font-size: 12px;
          line-height: 1.2;
          font-weight: 900;
        }
        .water-horse-panel .wh-delta-row {
          margin-top: 8px;
          padding: 7px 8px;
          border: 1px solid rgba(148,163,184,0.14);
          border-radius: 8px;
          background: rgba(2,6,23,0.28);
        }
        .water-horse-panel #ui-delta-dist {
          color: #7dd3fc;
          font: 950 16px/1 Consolas, "SFMono-Regular", monospace;
          white-space: nowrap;
        }
        .water-horse-panel #ui-delta-dist.is-tight {
          color: #86efac;
        }
        .water-horse-panel #ui-current-dist {
          color: #fde047;
          font: 950 28px/1 Consolas, "SFMono-Regular", monospace;
          text-shadow: 0 0 12px rgba(250,204,21,0.2);
          white-space: nowrap;
        }
        .water-horse-panel #ui-current-dist.text-green-500 {
          color: #86efac;
          text-shadow: 0 0 12px rgba(34,197,94,0.28);
        }
        .water-horse-panel .wh-progress {
          position: relative;
          width: 100%;
          height: 7px;
          margin: 9px 0 10px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(148,163,184,0.18);
        }
        .water-horse-panel #dist-progress {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #0ea5e9, #facc15);
          transition: width 0.1s ease;
        }
        .water-horse-panel #dist-progress.bg-green-500 {
          background: linear-gradient(90deg, #22c55e, #86efac);
          box-shadow: 0 0 10px rgba(34,197,94,0.58);
        }
        .water-horse-panel .wh-theory-row {
          padding: 8px;
          border: 1px solid rgba(148,163,184,0.14);
          border-radius: 8px;
          background: rgba(2,6,23,0.28);
          color: rgba(203,213,225,0.78);
          font-size: 12px;
          line-height: 1.3;
        }
        .water-horse-panel #ui-min-dist {
          color: #86efac;
          font: 900 14px/1 Consolas, monospace;
        }
        .water-horse-panel #ui-status-badge {
          flex: 0 0 auto;
          padding: 5px 8px;
          border-radius: 7px;
          border: 1px solid rgba(148,163,184,0.18);
          background: rgba(2,6,23,0.34);
          color: rgba(226,232,240,0.72);
          font-size: 10px;
          line-height: 1;
          font-weight: 900;
          white-space: nowrap;
        }
        .water-horse-panel #ui-status-badge.bg-green-100 {
          border-color: rgba(34,197,94,0.48);
          background: rgba(34,197,94,0.16);
          color: #bbf7d0;
        }
        .water-horse-panel .wh-graph-card {
          margin-top: 11px;
          padding: 8px;
          border: 1px solid rgba(148,163,184,0.16);
          border-radius: 8px;
          background: rgba(2,6,23,0.3);
        }
        .water-horse-panel .wh-graph-head {
          margin-bottom: 7px;
          padding: 0 2px;
          color: rgba(203,213,225,0.7);
          font-size: 11px;
          line-height: 1.25;
          font-weight: 900;
        }
        .water-horse-panel .wh-graph-head span:last-child {
          color: #7dd3fc;
        }
        .water-horse-panel #graph-canvas {
          position: relative;
          width: 100%;
          height: 100px;
          display: block;
          border: 1px solid rgba(148,163,184,0.14);
          border-radius: 8px;
          background:
            linear-gradient(180deg, rgba(15,23,42,0.78), rgba(2,6,23,0.84));
          touch-action: none;
        }
        .water-horse-panel #segment-breakdown {
          display: flex;
          justify-content: space-between;
          gap: 0;
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px dashed rgba(148,163,184,0.2);
          color: rgba(203,213,225,0.74);
          font: 800 11px/1.3 Consolas, "Microsoft YaHei UI", sans-serif;
        }
        .water-horse-panel #segment-breakdown > div {
          flex: 1 1 0;
          min-width: 0;
          text-align: center;
        }
        .water-horse-panel #segment-breakdown > div + div {
          border-left: 1px solid rgba(148,163,184,0.18);
        }
        .water-horse-panel #segment-breakdown span {
          color: #f8fafc;
          font-weight: 950;
        }
        .water-horse-panel .wh-controls {
          display: flex;
          flex: 1 1 auto;
          flex-direction: column;
          gap: 10px;
          padding: 0;
        }
        .water-horse-panel .wh-toggle-row {
          min-height: 44px;
          padding: 10px;
          border: 1px solid rgba(148,163,184,0.16);
          border-radius: 8px;
          background: rgba(15,23,42,0.64);
          color: rgba(226,232,240,0.82);
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
          touch-action: manipulation;
        }
        .water-horse-panel .wh-slider-card,
        .water-horse-panel .wh-aux-card {
          display: grid;
          gap: 8px;
          padding: 10px;
          border: 1px solid rgba(148,163,184,0.16);
          border-radius: 8px;
          background: rgba(15,23,42,0.64);
        }
        .water-horse-panel .wh-aux-card {
          border-color: rgba(250,204,21,0.22);
          background: rgba(250,204,21,0.08);
        }
        .water-horse-panel .wh-slider-title {
          color: rgba(226,232,240,0.66);
          font-size: 10px;
          line-height: 1.2;
          font-weight: 900;
        }
        .water-horse-panel .wh-slider-row span {
          flex: 0 0 14px;
          color: rgba(203,213,225,0.82);
          font: 900 10px/1 Consolas, monospace;
        }
        .water-horse-panel input[type="range"] {
          width: 100%;
          min-width: 0;
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
        .water-horse-panel input[type="range"]::-webkit-slider-runnable-track {
          height: 5px;
          border-radius: 999px;
          background: rgba(148,163,184,0.24);
        }
        .water-horse-panel input[type="range"]::-webkit-slider-thumb {
          width: 20px;
          height: 20px;
          margin-top: -8px;
          border: 3px solid #0f172a;
          border-radius: 50%;
          background: #facc15;
          box-shadow: 0 0 0 1px rgba(250,204,21,0.4), 0 4px 12px rgba(0,0,0,0.28);
          appearance: none;
          -webkit-appearance: none;
        }
        .water-horse-panel input[type="checkbox"].toggle-checkbox {
          position: absolute;
          width: 1px;
          height: 1px;
          margin: -1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
        }
        .water-horse-panel .toggle-label {
          position: relative;
          display: block;
          flex: 0 0 auto;
          width: 36px;
          height: 22px;
          border-radius: 999px;
          background: rgba(148,163,184,0.34);
          transition: background 0.18s ease;
        }
        .water-horse-panel .toggle-label .dot {
          position: absolute;
          left: 4px;
          top: 4px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #f8fafc;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
          transition: transform 0.18s ease;
        }
        .water-horse-panel .toggle-checkbox:checked + .toggle-label {
          background: rgba(250,204,21,0.82);
        }
        .water-horse-panel .toggle-checkbox:checked + .toggle-label .dot {
          transform: translateX(14px);
        }
        .water-horse-panel .wh-actions {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin-top: auto;
          padding-top: 0;
        }
        .water-horse-panel .wh-btn {
          min-width: 0;
          min-height: 44px;
          padding: 9px 10px;
          border-radius: 8px;
          border: 1px solid rgba(148,163,184,0.18);
          background: rgba(2,6,23,0.36);
          color: rgba(248,250,252,0.9);
          font: 900 12px/1.25 Inter, "Microsoft YaHei UI", sans-serif;
          cursor: pointer;
          white-space: normal;
          touch-action: manipulation;
          transition: transform 0.14s ease, box-shadow 0.14s ease;
        }
        .water-horse-panel .wh-btn:active {
          transform: scale(0.97);
        }
        .water-horse-panel .wh-btn.primary {
          border-color: rgba(56,189,248,0.48);
          color: #f8fafc;
          background: linear-gradient(135deg, rgba(14,165,233,0.92), rgba(37,99,235,0.9));
          box-shadow: 0 6px 16px rgba(14,165,233,0.18);
        }
        @media (max-width: 720px) {
          .water-horse-scene #canvas-hints {
            font-size: 11px;
            padding: 8px 9px;
          }
          .water-horse-panel .wh-tabs {
            grid-template-columns: 1fr;
          }
          .water-horse-panel .wh-step-tabs {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .water-horse-panel #ui-current-dist {
            font-size: 26px;
          }
        }
      `;
      document.head.appendChild(style);
    }
    cleanup.style = null;
  }

  function createPanelShell(panelNode) {
    panelNode.id = "water-horse-controls";
    panelNode.className = "";
    return `
      <div class="wh-block">
        <div class="wh-block-title">选择探索模式</div>
        <div class="wh-tabs">
          <button class="tab-btn active" data-mode="classic">单河岸</button>
          <button class="tab-btn" data-mode="two_rivers">两河夹击</button>
          <button class="tab-btn" data-mode="bridge">造桥平移</button>
        </div>
        <p id="mode-hint">对称点 A′，在直河边找最短路径 AP + PB。</p>
      </div>
      <div class="wh-step-card">
        <div class="wh-block-title">构造步骤</div>
        <div class="wh-step-tabs">
          <button class="step-btn" data-step="0">原路径</button>
          <button class="step-btn" data-step="1">镜像点</button>
          <button class="step-btn" data-step="2">拉直</button>
          <button class="step-btn active" data-step="3">最优点</button>
        </div>
        <p id="ui-step-hint">标出最优点 P₀，观察当前 P 与理论最短点的偏差。</p>
      </div>
      <div class="wh-dashboard">
        <div class="wh-distance-row">
          <span class="wh-small-label">当前总路程 D</span>
          <span id="ui-current-dist">0.0</span>
        </div>
        <div class="wh-progress"><div id="dist-progress" style="width:100%"></div></div>
        <div class="wh-theory-row">
          <span>理论最短值: <strong id="ui-min-dist">0.0</strong></span>
          <span id="ui-status-badge">探索中</span>
        </div>
        <div class="wh-delta-row">
          <span class="wh-small-label">距离差 Δ</span>
          <span id="ui-delta-dist">0.0</span>
        </div>
        <div class="wh-graph-card">
          <div class="wh-graph-head">
            <span>马匹位置 (X轴)</span>
            <span>路程曲线 (Y轴)</span>
          </div>
          <canvas id="graph-canvas"></canvas>
        </div>
        <div id="segment-breakdown">
          <div>段1: <span id="ui-seg1">0</span></div>
          <div>段2: <span id="ui-seg2">0</span></div>
        </div>
      </div>
      <div class="wh-controls">
        <label class="wh-toggle-row">
          <span>网格吸附</span>
          <span>
            <input type="checkbox" id="toggle-grid" class="toggle-checkbox">
            <span class="toggle-label"><span class="dot"></span></span>
          </span>
        </label>
        <div class="wh-slider-card">
          <div class="wh-slider-title">驻地 (A) 坐标微调</div>
          <label class="wh-slider-row">
            <span>X</span>
            <input type="range" id="slider-ax" min="0" max="100" value="20">
          </label>
          <label class="wh-slider-row">
            <span>Y</span>
            <input type="range" id="slider-ay" min="0" max="100" value="25">
          </label>
        </div>
        <div id="geometry-toggles" class="wh-aux-card">
          <label class="wh-toggle-row">
            <span>显示辅助线与几何原理</span>
            <span>
              <input type="checkbox" id="toggle-aux" class="toggle-checkbox">
              <span class="toggle-label"><span class="dot"></span></span>
            </span>
          </label>
        </div>
        <div class="wh-actions">
          <button id="btn-fit-view" class="wh-btn">适配视图</button>
          <button id="btn-reset" class="wh-btn">重置模型</button>
          <button id="btn-auto-solve" class="wh-btn primary">自动演示</button>
        </div>
      </div>
    `;
  }

  function extractLayout(body) {
    const canvasNode = body.querySelector("#canvas-container");
    if (!canvasNode) throw new Error("canvas-container missing");
    canvasNode.className = "";
    canvasNode.innerHTML = `
      <canvas id="main-canvas"></canvas>
      <canvas id="fx-canvas"></canvas>
      <div id="canvas-hints">
        <span id="hint-drag">拖拽马匹探索路径</span>
        <span id="hint-keyboard">键盘 ← → 键微调马匹</span>
      </div>
    `;

    const panelNode = document.createElement("div");
    panelNode.innerHTML = createPanelShell(panelNode);

    const sceneRoot = document.createElement("div");
    sceneRoot.className = "water-horse-scene";
    sceneRoot.dataset.cardId = CARD_ID;
    sceneRoot.appendChild(canvasNode);

    const panelRoot = document.createElement("div");
    panelRoot.className = "water-horse-panel";
    panelRoot.dataset.cardId = CARD_ID;
    panelRoot.innerHTML = `<div class="water-horse-panel-scroll"></div>`;
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

  function makeScopedDocument(sceneRoot, panelRoot) {
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
      if (event.touches && event.touches.length > 1 && !event.target.closest(".water-horse-panel")) {
        event.preventDefault();
      }
    }, { passive: false });
  }

  function runSourceScript(script, sceneRoot, panelRoot, cleanup) {
    const scopedDocument = makeScopedDocument(sceneRoot, panelRoot);
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
      `"use strict";\n${source}\n//# sourceURL=jm_model_m01_source.js`
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
        console.error("Failed to mount water horse path card:", error);
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
