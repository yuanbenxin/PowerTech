window.MATH_VISUAL_SCENES = window.MATH_VISUAL_SCENES || {};

(function () {
  const CARD_ID = "j7a_m01";
  const STYLE_ID = "math-numberline-scene-style";
  const SVG_NS = "http://www.w3.org/2000/svg";

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .math-numberline-scene,
      .math-numberline-scene * {
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -webkit-user-drag: none;
        user-select: none;
      }
      .math-numberline-scene {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        color: #f8fafc;
        background-color: #030712;
        background-image:
          linear-gradient(rgba(56,189,248,0.07) 1px, transparent 1px),
          linear-gradient(90deg, rgba(56,189,248,0.07) 1px, transparent 1px),
          radial-gradient(circle at 22% 18%, rgba(56,189,248,0.16), transparent 34%),
          radial-gradient(circle at 82% 76%, rgba(167,139,250,0.14), transparent 36%);
        background-size: 70px 70px, 70px 70px, 100% 100%, 100% 100%;
        font-family: Inter, "Noto Sans SC", "Microsoft YaHei UI", sans-serif;
        touch-action: none;
      }
      .math-numberline-scene[data-mode="fun"] {
        background-color: #020617;
        background-image:
          radial-gradient(circle, rgba(255,255,255,0.82) 1px, transparent 2px),
          radial-gradient(circle, rgba(125,211,252,0.56) 1px, transparent 2px),
          radial-gradient(circle at 28% 22%, rgba(16,185,129,0.18), transparent 30%),
          radial-gradient(circle at 78% 70%, rgba(250,204,21,0.12), transparent 36%);
        background-size: 260px 260px, 420px 420px, 100% 100%, 100% 100%;
      }
      .math-numberline-svg,
      .math-numberline-fx {
        position: absolute;
        inset: 0;
        display: block;
        width: 100%;
        height: 100%;
      }
      .math-numberline-fx {
        pointer-events: none;
        z-index: 3;
      }
      .math-numberline-svg {
        z-index: 2;
        cursor: grab;
        user-select: none;
        touch-action: none;
      }
      .math-numberline-svg:active {
        cursor: grabbing;
      }
      .math-axis-line {
        stroke: rgba(203,213,225,0.42);
        stroke-width: 4;
        stroke-linecap: round;
      }
      .math-tick-main {
        stroke: rgba(148,163,184,0.78);
        stroke-width: 2;
      }
      .math-tick-sub {
        stroke: rgba(100,116,139,0.45);
        stroke-width: 1;
      }
      .math-tick-zero {
        stroke: #ffffff;
        stroke-width: 3;
      }
      .math-tick-text {
        fill: rgba(226,232,240,0.78);
        font-size: 13px;
        font-weight: 800;
        text-anchor: middle;
        dominant-baseline: hanging;
      }
      .math-tick-text.zero {
        fill: #ffffff;
        font-size: 17px;
      }
      .math-hop-path {
        fill: none;
        stroke-width: 5;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .math-result-path {
        fill: none;
        stroke-width: 4;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .math-arrow-text {
        font-size: 17px;
        font-weight: 900;
        text-anchor: middle;
        paint-order: stroke;
        stroke: rgba(2,6,23,0.78);
        stroke-width: 4;
        stroke-linejoin: round;
      }
      .math-numberline-rocket {
        opacity: 0;
        transition: opacity 0.18s ease;
      }
      .math-numberline-scene[data-mode="fun"] .math-numberline-rocket {
        opacity: 1;
      }
      .math-numberline-hud {
        position: absolute;
        left: 14px;
        top: 14px;
        z-index: 4;
        width: min(520px, calc(100% - 28px));
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        pointer-events: none;
      }
      .math-numberline-stat {
        min-width: 0;
        border: 1px solid rgba(148,163,184,0.18);
        border-radius: 8px;
        background: rgba(2,6,23,0.62);
        backdrop-filter: blur(12px);
        padding: 8px 10px;
      }
      .math-numberline-stat-label {
        color: rgba(226,232,240,0.56);
        font-size: 10px;
        font-weight: 900;
        white-space: nowrap;
      }
      .math-numberline-stat-value {
        margin-top: 3px;
        color: #f8fafc;
        font-size: 16px;
        font-weight: 950;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .math-numberline-target {
        position: absolute;
        z-index: 5;
        pointer-events: none;
        transform: translate(-50%, -50%);
        color: #34d399;
        font-size: 18px;
        font-weight: 950;
        text-shadow: 0 0 18px rgba(52,211,153,0.85);
        opacity: 0;
        transition: opacity 0.25s ease;
      }
      .math-numberline-target.show {
        opacity: 1;
      }
      .math-numberline-toast {
        position: absolute;
        z-index: 8;
        pointer-events: none;
        font-size: 26px;
        font-weight: 950;
        transform: translate(-50%, -50%);
        text-shadow: 0 2px 12px rgba(0,0,0,0.72);
        transition: transform 0.9s ease, opacity 0.9s ease;
      }
      .math-op-panel,
      .math-op-panel * {
        box-sizing: border-box;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -webkit-user-drag: none;
        user-select: none;
      }
      .math-op-panel {
        width: 100%;
        height: 100%;
        min-height: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
        overflow-x: hidden;
        overflow-y: auto;
        touch-action: pan-y;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        padding: 10px;
        color: #f8fafc;
        font-family: Inter, "Noto Sans SC", "Microsoft YaHei UI", sans-serif;
        scrollbar-width: none;
      }
      .math-op-panel::-webkit-scrollbar {
        width: 0;
        height: 0;
      }
      .math-op-panel[data-size="compact"] {
        gap: 7px;
        padding: 8px;
      }
      .math-op-panel[data-size="micro"] {
        gap: 6px;
        padding: 7px;
      }
      .math-op-card {
        flex: 0 0 auto;
        border: 1px solid rgba(148,163,184,0.16);
        border-radius: 8px;
        background: rgba(2,6,23,0.42);
        padding: 10px;
        min-width: 0;
        overflow: hidden;
      }
      .math-op-panel[data-size="compact"] .math-op-card {
        padding: 8px;
      }
      .math-op-panel[data-size="micro"] .math-op-card {
        padding: 7px;
      }
      .math-op-segment {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 7px;
      }
      .math-op-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 6px;
        align-items: center;
      }
      .math-op-field {
        display: grid;
        grid-template-columns: 48px minmax(0, 1fr);
        gap: 8px;
        align-items: center;
        min-width: 0;
      }
      .math-op-field span {
        color: rgba(226,232,240,0.62);
        font-size: 11px;
        font-weight: 950;
        letter-spacing: 0;
        white-space: nowrap;
      }
      .math-op-input,
      .math-op-select {
        width: 100%;
        min-width: 0;
        height: 34px;
        border: 1px solid rgba(148,163,184,0.24);
        border-radius: 8px;
        background: rgba(15,23,42,0.76);
        color: #f8fafc;
        font-size: 16px;
        font-weight: 900;
        text-align: center;
        outline: none;
      }
      .math-op-select {
        cursor: pointer;
        color: #020617;
        background: #7dd3fc;
      }
      .math-op-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 7px;
      }
      .math-op-button {
        width: 100%;
        min-width: 0;
        min-height: 34px;
        border: 1px solid rgba(148,163,184,0.22);
        border-radius: 8px;
        background: rgba(15,23,42,0.74);
        color: rgba(248,250,252,0.9);
        font-size: 12px;
        font-weight: 950;
        line-height: 1.2;
        cursor: pointer;
        transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease, color 0.16s ease;
        white-space: normal;
        overflow-wrap: anywhere;
      }
      .math-op-button:hover {
        border-color: rgba(125,211,252,0.55);
        background: rgba(30,41,59,0.9);
      }
      .math-op-button:active {
        transform: scale(0.98);
      }
      .math-op-button.primary {
        border-color: rgba(56,189,248,0.48);
        background: linear-gradient(135deg, rgba(14,165,233,0.92), rgba(37,99,235,0.9));
        color: #f8fafc;
      }
      .math-op-button.success {
        border-color: rgba(52,211,153,0.46);
        background: rgba(5,150,105,0.24);
        color: #bbf7d0;
      }
      .math-op-button.active {
        border-color: rgba(250,204,21,0.6);
        background: rgba(250,204,21,0.18);
        color: #fde68a;
      }
      .math-op-button:disabled {
        cursor: not-allowed;
        opacity: 0.48;
        transform: none;
      }
      .math-result-box {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        align-items: center;
        min-height: 44px;
        border: 1px solid rgba(250,204,21,0.24);
        border-radius: 8px;
        background: rgba(15,23,42,0.58);
        padding: 8px 10px;
        text-align: center;
      }
      .math-result-value {
        color: #fde047;
        font-family: "JetBrains Mono", Consolas, monospace;
        font-size: 22px;
        font-weight: 950;
        line-height: 1.1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .math-explain {
        flex: 0 0 auto;
        min-height: 0;
        display: flex;
        align-items: center;
        border-left: 4px solid #38bdf8;
        color: rgba(226,232,240,0.88);
        font-size: 12px;
        font-weight: 650;
        line-height: 1.55;
      }
      .math-explain strong {
        color: #fde047;
      }
      .math-step-card {
        padding: 8px;
      }
      .math-step-strip {
        display: grid;
        gap: 6px;
      }
      .math-step-chip {
        min-width: 0;
        display: grid;
        grid-template-columns: 22px minmax(0, 1fr);
        gap: 6px;
        align-items: center;
        border: 1px solid rgba(148,163,184,0.18);
        border-radius: 8px;
        background: rgba(15,23,42,0.5);
        padding: 6px 7px;
        color: rgba(226,232,240,0.72);
        font-size: 11px;
        font-weight: 850;
        line-height: 1.25;
      }
      .math-step-chip i {
        display: grid;
        place-items: center;
        width: 22px;
        height: 22px;
        border-radius: 7px;
        background: rgba(56,189,248,0.16);
        color: #7dd3fc;
        font-style: normal;
        font-family: "JetBrains Mono", Consolas, monospace;
        font-weight: 950;
      }
      .math-step-chip.active {
        border-color: rgba(250,204,21,0.5);
        background: rgba(250,204,21,0.12);
        color: #fef3c7;
      }
      .math-step-chip.active i {
        background: rgba(250,204,21,0.22);
        color: #fde047;
      }
      .math-axis-point {
        stroke: rgba(2,6,23,0.9);
        stroke-width: 3;
        filter: drop-shadow(0 0 9px rgba(255,255,255,0.26));
      }
      .math-axis-point-label {
        font-size: 16px;
        font-weight: 950;
        text-anchor: middle;
        paint-order: stroke;
        stroke: rgba(2,6,23,0.78);
        stroke-width: 4;
      }
      .math-distance-band {
        fill: none;
        stroke-width: 8;
        stroke-linecap: round;
        opacity: 0.35;
      }
      .math-hit-ruler {
        stroke: rgba(52,211,153,0.42);
        stroke-width: 2;
        stroke-dasharray: 6 7;
      }
      .math-op-panel[data-size="compact"] .math-op-button,
      .math-op-panel[data-size="micro"] .math-op-button {
        min-height: 31px;
        font-size: 11px;
      }
      .math-op-panel[data-size="compact"] .math-op-input,
      .math-op-panel[data-size="compact"] .math-op-select,
      .math-op-panel[data-size="micro"] .math-op-input,
      .math-op-panel[data-size="micro"] .math-op-select {
        height: 34px;
        font-size: 16px;
      }
      .math-op-panel[data-size="micro"] .math-result-box {
        min-height: 40px;
        padding: 6px 8px;
      }
      .math-op-panel[data-size="micro"] .math-result-value {
        font-size: 18px;
      }
      .math-op-panel[data-size="micro"] .math-explain {
        font-size: 11px;
        line-height: 1.45;
      }
      .math-op-panel[data-size="micro"] .hide-micro {
        display: none;
      }
      @media (max-width: 980px), (max-height: 620px) {
        .math-numberline-hud {
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 6px;
          left: 10px;
          top: 10px;
        }
        .math-numberline-stat {
          padding: 7px 8px;
        }
        .math-numberline-stat-value {
          font-size: 13px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function createSvgElement(name, attrs = {}) {
    const el = document.createElementNS(SVG_NS, name);
    Object.entries(attrs).forEach(([key, value]) => {
      if (value !== null && value !== undefined) el.setAttribute(key, String(value));
    });
    return el;
  }

  function formatNumber(value) {
    if (!Number.isFinite(value)) return "0";
    if (Math.abs(value) < 0.000001) return "0";
    return String(Math.round(value * 1000) / 1000).replace(/\.0+$/, "");
  }

  function createScene(container, context) {
    ensureStyle();

    const panel = context.externalPanel && context.externalPanel.nodeType === 1 ? context.externalPanel : null;
    const sceneEl = document.createElement("div");
    sceneEl.className = "math-numberline-scene";
    sceneEl.dataset.mode = "classic";
    sceneEl.innerHTML = `
      <canvas class="math-numberline-fx" data-fx></canvas>
      <svg class="math-numberline-svg" data-svg>
        <defs>
          <marker id="math-arrow-blue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8"></path>
          </marker>
          <marker id="math-arrow-red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#fb7185"></path>
          </marker>
          <marker id="math-arrow-yellow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#facc15"></path>
          </marker>
          <marker id="math-arrow-violet" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#a78bfa"></path>
          </marker>
        </defs>
        <g data-camera>
          <line class="math-axis-line" x1="-100000" y1="0" x2="100000" y2="0"></line>
          <g data-ticks></g>
          <g data-animations></g>
          <g data-labels></g>
          <g class="math-numberline-rocket" data-rocket transform="translate(0,0) scale(1.3)">
            <path d="M 22 0 L -12 13 L -6 0 L -12 -13 Z" fill="#f8fafc"></path>
            <circle cx="6" cy="0" r="4" fill="#38bdf8"></circle>
            <path data-flame d="M -12 5 L -30 0 L -12 -5 Z" fill="#facc15"></path>
          </g>
        </g>
      </svg>
      <div class="math-numberline-hud">
        <div class="math-numberline-stat">
          <div class="math-numberline-stat-label">表达式</div>
          <div class="math-numberline-stat-value" data-hud-expression>-3 + 5</div>
        </div>
        <div class="math-numberline-stat">
          <div class="math-numberline-stat-label">当前结果</div>
          <div class="math-numberline-stat-value" data-hud-result">待推演</div>
        </div>
        <div class="math-numberline-stat">
          <div class="math-numberline-stat-label">缩放</div>
          <div class="math-numberline-stat-value" data-hud-zoom>1.00x</div>
        </div>
      </div>
      <div class="math-numberline-target" data-target>目标点</div>
    `;

    container.innerHTML = "";
    container.appendChild(sceneEl);

    if (panel) {
      panel.innerHTML = `
        <div class="math-op-panel" data-op-panel>
          <section class="math-op-card">
            <div class="math-op-segment">
              <button class="math-op-button active" type="button" data-mode="classic">经典推演</button>
              <button class="math-op-button" type="button" data-mode="fun">挑战模式</button>
            </div>
          </section>
          <section class="math-op-card">
            <div class="math-op-row">
              <label class="math-op-field">
                <span>数 A</span>
                <input class="math-op-input" type="number" step="any" value="-3" data-input="a" aria-label="数 A">
              </label>
              <label class="math-op-field">
                <span>运算</span>
                <select class="math-op-select" data-input="op" aria-label="运算符">
                  <option value="+">+</option>
                  <option value="-">-</option>
                  <option value="*">×</option>
                  <option value="/">÷</option>
                </select>
              </label>
              <label class="math-op-field">
                <span>数 B</span>
                <input class="math-op-input" type="number" step="any" value="5" data-input="b" aria-label="数 B">
              </label>
            </div>
          </section>
          <section class="math-op-card math-result-box">
            <div class="math-result-value" data-result>= ?</div>
          </section>
          <section class="math-op-card math-step-card">
            <div class="math-step-strip" data-steps></div>
          </section>
          <section class="math-op-card">
            <button class="math-op-button primary" type="button" data-action="calculate">四则运算推演</button>
          </section>
          <section class="math-op-card">
            <div class="math-op-grid">
              <button class="math-op-button" type="button" data-action="abs">|A| 绝对值</button>
              <button class="math-op-button" type="button" data-action="opposite">-A 相反数</button>
              <button class="math-op-button success" type="button" data-action="challenge">随机挑战</button>
              <button class="math-op-button" type="button" data-action="reset">视图复位</button>
            </div>
          </section>
          <section class="math-op-card math-explain" data-explain>
            改 A、B 或运算符，点击推演。
          </section>
        </div>
      `;
    }

    const state = {
      destroyed: false,
      token: 0,
      width: 1,
      height: 1,
      unit: 76,
      scale: 1,
      panX: 0,
      panY: 0,
      mode: "classic",
      challengeActive: false,
      challengeAnswer: 0,
      lastChallengeTap: 0,
      isDragging: false,
      wasDragged: false,
      activePointers: new Map(),
      gestureMode: "idle",
      gestureMoved: false,
      gestureStartPanX: 0,
      gestureStartPanY: 0,
      gestureStartScale: 1,
      gestureStartClientX: 0,
      gestureStartClientY: 0,
      gestureStartCenterX: 0,
      gestureStartCenterY: 0,
      gestureStartDistance: 1,
      pointerId: null,
      particles: [],
      raf: 0,
      flameTimer: 0,
      timeouts: new Set(),
      resizeObserver: null,
      abort: typeof AbortController !== "undefined" ? new AbortController() : null
    };

    const els = {
      scene: sceneEl,
      canvas: sceneEl.querySelector("[data-fx]"),
      svg: sceneEl.querySelector("[data-svg]"),
      camera: sceneEl.querySelector("[data-camera]"),
      ticks: sceneEl.querySelector("[data-ticks]"),
      animations: sceneEl.querySelector("[data-animations]"),
      labels: sceneEl.querySelector("[data-labels]"),
      rocket: sceneEl.querySelector("[data-rocket]"),
      flame: sceneEl.querySelector("[data-flame]"),
      target: sceneEl.querySelector("[data-target]"),
      hudExpression: sceneEl.querySelector("[data-hud-expression]"),
      hudResult: sceneEl.querySelector("[data-hud-result]"),
      hudZoom: sceneEl.querySelector("[data-hud-zoom]"),
      panel: panel?.querySelector("[data-op-panel]") || null,
      inputA: panel?.querySelector('[data-input="a"]') || null,
      inputB: panel?.querySelector('[data-input="b"]') || null,
      inputOp: panel?.querySelector('[data-input="op"]') || null,
      result: panel?.querySelector("[data-result]") || null,
      steps: panel?.querySelector("[data-steps]") || null,
      explain: panel?.querySelector("[data-explain]") || null
    };
    const ctx = els.canvas.getContext("2d");
    const MIN_SCALE = 0.02;
    const MAX_SCALE = 10;
    const DRAG_THRESHOLD = 8;

    function addEvent(target, eventName, handler, options) {
      if (!target) return;
      target.addEventListener(eventName, handler, state.abort ? { ...options, signal: state.abort.signal } : options);
    }

    function setExplain(html) {
      if (els.explain) els.explain.innerHTML = html;
    }

    function setResult(text) {
      if (els.result) els.result.textContent = text;
      if (els.hudResult) els.hudResult.textContent = text.replace(/^=\s*/, "") || "待推演";
    }

    function setSteps(items = [], activeIndex = -1) {
      if (!els.steps) return;
      els.steps.innerHTML = items.map((item, index) => `
        <div class="math-step-chip${index === activeIndex ? " active" : ""}">
          <i>${index + 1}</i><span>${item}</span>
        </div>
      `).join("");
    }

    function readA() {
      const value = Number.parseFloat(els.inputA?.value);
      return Number.isFinite(value) ? value : 0;
    }

    function readB() {
      const value = Number.parseFloat(els.inputB?.value);
      return Number.isFinite(value) ? value : 0;
    }

    function readOp() {
      return els.inputOp?.value || "+";
    }

    function currentExpression() {
      const a = readA();
      const b = readB();
      const op = readOp();
      const signB = b < 0 ? `(${formatNumber(b)})` : formatNumber(b);
      const symbol = op === "*" ? "×" : op === "/" ? "÷" : op;
      return `${formatNumber(a)} ${symbol} ${signB}`;
    }

    function updateHud() {
      if (els.hudExpression) els.hudExpression.textContent = currentExpression();
      if (els.hudZoom) els.hudZoom.textContent = `${state.scale.toFixed(2)}x`;
    }

    function worldToScreen(value, y = 0) {
      return {
        x: state.panX + value * state.unit * state.scale,
        y: state.panY + y * state.scale
      };
    }

    function screenToValue(x) {
      return (x - state.panX) / (state.unit * state.scale);
    }

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function clampScale(value) {
      return clamp(value, MIN_SCALE, MAX_SCALE);
    }

    function clampViewport() {
      if (state.height <= 1) return;
      state.panY = clamp(state.panY, Math.round(state.height * 0.22), Math.round(state.height * 0.82));
    }

    function localPoint(event) {
      const rect = els.svg.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    }

    function pointerPair() {
      const points = Array.from(state.activePointers.values());
      if (points.length < 2) return null;
      const a = points[0];
      const b = points[1];
      const centerX = (a.x + b.x) / 2;
      const centerY = (a.y + b.y) / 2;
      const distance = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
      return { centerX, centerY, distance };
    }

    function zoomAt(x, y, nextScale) {
      const oldScale = state.scale;
      const scale = clampScale(nextScale);
      if (Math.abs(scale - oldScale) < 0.0001) return false;
      const ratio = scale / oldScale;
      state.scale = scale;
      state.panX = x - (x - state.panX) * ratio;
      state.panY = y - (y - state.panY) * ratio;
      clampViewport();
      updateCamera();
      return true;
    }

    function startPanGesture(pointerId) {
      const point = state.activePointers.get(pointerId);
      if (!point) return;
      state.gestureMode = "pan";
      state.isDragging = true;
      state.pointerId = pointerId;
      state.gestureStartPanX = state.panX;
      state.gestureStartPanY = state.panY;
      state.gestureStartClientX = point.x;
      state.gestureStartClientY = point.y;
      state.gestureMoved = false;
      state.wasDragged = false;
    }

    function startPinchGesture() {
      const pair = pointerPair();
      if (!pair) return;
      state.gestureMode = "pinch";
      state.isDragging = false;
      state.pointerId = null;
      state.gestureMoved = true;
      state.wasDragged = true;
      state.gestureStartPanX = state.panX;
      state.gestureStartPanY = state.panY;
      state.gestureStartScale = state.scale;
      state.gestureStartCenterX = pair.centerX;
      state.gestureStartCenterY = pair.centerY;
      state.gestureStartDistance = pair.distance;
    }

    function applyPinchGesture() {
      const pair = pointerPair();
      if (!pair || state.gestureMode !== "pinch") return;
      const nextScale = clampScale(state.gestureStartScale * (pair.distance / state.gestureStartDistance));
      const ratio = nextScale / state.gestureStartScale;
      state.scale = nextScale;
      state.panX = pair.centerX - (state.gestureStartCenterX - state.gestureStartPanX) * ratio;
      state.panY = pair.centerY - (state.gestureStartCenterY - state.gestureStartPanY) * ratio;
      clampViewport();
      updateCamera();
    }

    function finishPointer(event) {
      if (event && state.activePointers.has(event.pointerId)) {
        state.activePointers.delete(event.pointerId);
        try {
          els.svg.releasePointerCapture?.(event.pointerId);
        } catch (error) {
        }
      }
      if (state.activePointers.size >= 2) {
        startPinchGesture();
        return;
      }
      if (state.activePointers.size === 1) {
        const remainingId = Array.from(state.activePointers.keys())[0];
        startPanGesture(remainingId);
        state.gestureMoved = true;
        state.wasDragged = true;
        return;
      }
      state.gestureMode = "idle";
      state.isDragging = false;
      state.pointerId = null;
    }

    function updateCamera() {
      els.camera.setAttribute("transform", `translate(${state.panX}, ${state.panY}) scale(${state.scale})`);
      if (state.mode === "fun") {
        els.scene.style.backgroundPosition = `${state.panX * 0.1}px ${state.panY * 0.1}px, ${state.panX * 0.25}px ${state.panY * 0.25}px, center, center`;
      } else {
        const gridSize = Math.max(24, Math.min(140, 70 * state.scale));
        els.scene.style.backgroundSize = `${gridSize}px ${gridSize}px, ${gridSize}px ${gridSize}px, 100% 100%, 100% 100%`;
        els.scene.style.backgroundPosition = `${state.panX}px ${state.panY}px, ${state.panX}px ${state.panY}px, center, center`;
      }
      drawAxis();
      updateHud();
      updateChallengeTarget();
    }

    function chooseSteps() {
      const s = state.scale;
      if (s < 0.03) return { main: 500, sub: 100 };
      if (s < 0.06) return { main: 100, sub: 50 };
      if (s < 0.12) return { main: 50, sub: 10 };
      if (s < 0.26) return { main: 10, sub: 5 };
      if (s < 0.55) return { main: 5, sub: 1 };
      if (s < 1) return { main: 2, sub: 1 };
      if (s < 1.8) return { main: 1, sub: 0.5 };
      if (s < 3.2) return { main: 1, sub: 0.25 };
      return { main: 0.5, sub: 0.1 };
    }

    function drawAxis() {
      const minUnit = (-state.panX - 180) / (state.unit * state.scale);
      const maxUnit = (state.width - state.panX + 180) / (state.unit * state.scale);
      const steps = chooseSteps();
      const start = Math.floor(minUnit / steps.sub) * steps.sub;
      const end = Math.ceil(maxUnit / steps.sub) * steps.sub;
      const fragment = document.createDocumentFragment();

      for (let i = start; i <= end + steps.sub * 0.5; i += steps.sub) {
        const value = Math.round(i * 1000) / 1000;
        const x = value * state.unit;
        const isZero = Math.abs(value) < 0.00001;
        const isMain = Math.abs(Math.round(value / steps.main) * steps.main - value) < 0.0001;
        const line = createSvgElement("line", {
          x1: x,
          x2: x,
          y1: isZero ? -14 : isMain ? -9 : -5,
          y2: isZero ? 14 : isMain ? 9 : 5,
          class: isZero ? "math-tick-zero" : isMain ? "math-tick-main" : "math-tick-sub"
        });
        fragment.appendChild(line);

        if (isMain) {
          const text = createSvgElement("text", {
            x,
            y: 28,
            class: `math-tick-text${isZero ? " zero" : ""}`
          });
          text.textContent = formatNumber(value);
          fragment.appendChild(text);
        }
      }

      els.ticks.innerHTML = "";
      els.ticks.appendChild(fragment);
    }

    function fitPanel() {
      if (!els.panel || !panel) return;
      const rect = panel.getBoundingClientRect();
      let size = "normal";
      if (rect.height < 710 || rect.width < 308 || context.layout?.shortHeight) size = "compact";
      if (rect.height < 610 || rect.width < 276 || context.layout?.tinyLandscape) size = "micro";
      els.panel.dataset.size = size;
      if (els.panel.scrollHeight > els.panel.clientHeight + 1 && size === "normal") {
        size = "compact";
        els.panel.dataset.size = size;
      }
      if (els.panel.scrollHeight > els.panel.clientHeight + 1 && size !== "micro") {
        size = "micro";
        els.panel.dataset.size = size;
      }
    }

    function resize() {
      const rect = sceneEl.getBoundingClientRect();
      state.width = Math.max(1, Math.round(rect.width));
      state.height = Math.max(1, Math.round(rect.height));
      els.svg.setAttribute("viewBox", `0 0 ${state.width} ${state.height}`);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      els.canvas.width = Math.round(state.width * dpr);
      els.canvas.height = Math.round(state.height * dpr);
      els.canvas.style.width = `${state.width}px`;
      els.canvas.style.height = `${state.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!state.panX || !state.panY) {
        state.panX = state.width / 2;
        state.panY = Math.round(state.height * 0.58);
      }
      updateCamera();
      fitPanel();
    }

    function resetView(values = [0, readA(), readB()]) {
      const nums = values.filter(Number.isFinite);
      const min = Math.min(...nums, 0);
      const max = Math.max(...nums, 0);
      const span = Math.max(4, max - min);
      state.scale = Math.max(0.08, Math.min(1.35, (state.width * 0.62) / (span * state.unit + 160)));
      state.panX = state.width / 2 - ((min + max) / 2) * state.unit * state.scale;
      state.panY = Math.round(state.height * 0.58);
      updateCamera();
    }

    function clearMarks() {
      state.token += 1;
      els.animations.innerHTML = "";
      els.labels.innerHTML = "";
      els.rocket.setAttribute("opacity", "0");
      els.rocket.setAttribute("transform", "translate(0,0) scale(1.3)");
      state.challengeActive = false;
      updateChallengeTarget();
      setResult("= ?");
      setSteps(["定位 A", "执行运算", "落到结果"], -1);
    }

    function markPoint(value, label, color = "#f8fafc", y = 0) {
      const x = value * state.unit;
      const circle = createSvgElement("circle", {
        cx: x,
        cy: y,
        r: 9,
        class: "math-axis-point",
        fill: color
      });
      els.labels.appendChild(circle);
      const text = createSvgElement("text", {
        x,
        y: y - 20,
        class: "math-axis-point-label",
        fill: color
      });
      text.textContent = label;
      els.labels.appendChild(text);
    }

    function drawDistanceBand(startValue, endValue, y, color, label) {
      const sx = startValue * state.unit;
      const ex = endValue * state.unit;
      const band = createSvgElement("path", {
        d: `M ${sx} ${y} L ${ex} ${y}`,
        class: "math-distance-band",
        stroke: color
      });
      els.animations.appendChild(band);
      const l1 = createSvgElement("line", { x1: sx, x2: sx, y1: y - 12, y2: y + 12, stroke: color, "stroke-width": 4, "stroke-linecap": "round" });
      const l2 = createSvgElement("line", { x1: ex, x2: ex, y1: y - 12, y2: y + 12, stroke: color, "stroke-width": 4, "stroke-linecap": "round" });
      els.animations.append(l1, l2);
      const text = createSvgElement("text", {
        x: (sx + ex) / 2,
        y: y + 28,
        class: "math-arrow-text",
        fill: color
      });
      text.textContent = label;
      els.labels.appendChild(text);
    }

    function setButtonsDisabled(disabled) {
      if (!els.panel) return;
      els.panel.querySelectorAll("[data-action], [data-mode], input, select").forEach(item => {
        item.disabled = disabled;
      });
      if (!disabled) syncModeButtons();
    }

    function sleep(ms, token) {
      return new Promise((resolve, reject) => {
        if (state.destroyed || token !== state.token) {
          reject(new Error("cancelled"));
          return;
        }
        const timeout = window.setTimeout(() => {
          state.timeouts.delete(timeout);
          if (state.destroyed || token !== state.token) reject(new Error("cancelled"));
          else resolve();
        }, ms);
        state.timeouts.add(timeout);
      });
    }

    async function rollNumber(finalValue, prefix, token) {
      const steps = 20;
      for (let i = 1; i <= steps; i += 1) {
        const t = 1 - Math.pow(1 - i / steps, 2);
        setResult(`${prefix}${formatNumber(finalValue * t)}`);
        await sleep(22, token);
      }
      setResult(`${prefix}${formatNumber(finalValue)}`);
    }

    function colorFor(value) {
      return value >= 0 ? "#38bdf8" : "#fb7185";
    }

    function markerFor(value) {
      return value >= 0 ? "math-arrow-blue" : "math-arrow-red";
    }

    function triggerExplosion(x, y, color = "random", count = 36) {
      if (state.mode !== "fun") return;
      const palette = ["#facc15", "#38bdf8", "#fb7185", "#a78bfa", "#34d399", "#f8fafc"];
      for (let i = 0; i < count; i += 1) {
        state.particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 12,
          vy: (Math.random() - 0.5) * 12 - 2,
          life: 1,
          decay: 0.018 + Math.random() * 0.025,
          size: 2 + Math.random() * 4,
          color: color === "random" ? palette[Math.floor(Math.random() * palette.length)] : color
        });
      }
    }

    function showToast(x, y, text, color) {
      const toast = document.createElement("div");
      toast.className = "math-numberline-toast";
      toast.textContent = text;
      toast.style.left = `${x}px`;
      toast.style.top = `${y}px`;
      toast.style.color = color;
      sceneEl.appendChild(toast);
      window.requestAnimationFrame(() => {
        toast.style.transform = "translate(-50%, -170%) scale(1.12)";
        toast.style.opacity = "0";
      });
      const timeout = window.setTimeout(() => toast.remove(), 1000);
      state.timeouts.add(timeout);
    }

    function renderParticles() {
      if (state.destroyed) return;
      ctx.clearRect(0, 0, state.width, state.height);
      for (let i = state.particles.length - 1; i >= 0; i -= 1) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.18;
        p.life -= p.decay;
        if (p.life <= 0) {
          state.particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      state.raf = window.requestAnimationFrame(renderParticles);
    }

    async function animateHop(startValue, endValue, label, color, markerId, token, index = 0, duration = 820) {
      const sx = startValue * state.unit;
      const ex = endValue * state.unit;
      const mid = (sx + ex) / 2;
      const dist = Math.abs(ex - sx);
      const height = dist < 1 ? -36 : -Math.max(48 + index * 36, Math.min(260, dist * 0.22));
      const path = createSvgElement("path", {
        d: `M ${sx} 0 Q ${mid} ${height * 2} ${ex} 0`,
        class: "math-hop-path",
        stroke: color,
        "marker-end": markerId ? `url(#${markerId})` : null
      });
      path.style.filter = `drop-shadow(0 0 8px ${color})`;
      els.animations.appendChild(path);
      const len = path.getTotalLength();
      path.style.strokeDasharray = `${len}`;
      path.style.strokeDashoffset = `${len}`;

      const text = createSvgElement("text", {
        x: mid,
        y: height - 18,
        class: "math-arrow-text",
        fill: color
      });
      text.style.opacity = "0";
      text.textContent = label;
      els.labels.appendChild(text);

      await new Promise((resolve, reject) => {
        const start = performance.now();
        function step(now) {
          if (state.destroyed || token !== state.token) {
            reject(new Error("cancelled"));
            return;
          }
          const progress = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - progress, 3);
          path.style.strokeDashoffset = `${len * (1 - eased)}`;
          if (state.mode === "fun") {
            const pt = path.getPointAtLength(len * eased);
            const next = path.getPointAtLength(Math.min(len, len * eased + 0.25));
            const angle = Math.atan2(next.y - pt.y, next.x - pt.x) * 180 / Math.PI;
            els.rocket.setAttribute("opacity", "1");
            els.rocket.setAttribute("transform", `translate(${pt.x}, ${pt.y}) rotate(${angle}) scale(1.3)`);
          }
          if (progress >= 1) {
            text.style.transition = "opacity 0.18s ease";
            text.style.opacity = "1";
            const hit = worldToScreen(endValue, 0);
            triggerExplosion(hit.x, hit.y, color, 32);
            resolve();
          } else {
            window.requestAnimationFrame(step);
          }
        }
        window.requestAnimationFrame(step);
      });
    }

    async function animateResultArrow(startValue, endValue, label, token) {
      const sx = startValue * state.unit;
      const ex = endValue * state.unit;
      const y = 64;
      const path = createSvgElement("path", {
        d: `M ${sx} ${y} L ${ex} ${y}`,
        class: "math-result-path",
        stroke: "#facc15",
        "marker-end": "url(#math-arrow-yellow)"
      });
      path.setAttribute("stroke-dasharray", "9,8");
      path.style.filter = "drop-shadow(0 0 8px rgba(250,204,21,0.75))";
      els.animations.appendChild(path);

      const text = createSvgElement("text", {
        x: (sx + ex) / 2,
        y: y + 26,
        class: "math-arrow-text",
        fill: "#facc15"
      });
      text.textContent = label;
      els.labels.appendChild(text);
      await sleep(180, token);
    }

    async function runCalculate() {
      clearMarks();
      const token = state.token;
      setButtonsDisabled(true);
      const a = readA();
      const b = readB();
      const op = readOp();
      const result = op === "+" ? a + b : op === "-" ? a - b : op === "*" ? a * b : b === 0 ? NaN : a / b;

      if (op === "/" && b === 0) {
        setResult("除数不能为 0");
        setExplain('<strong>除法暂停：</strong>除数不能为 0。请调整 B 的值后重新推演。');
        setButtonsDisabled(false);
        return;
      }

      resetView([0, a, b, result, a + b, a - b, a * b]);
      const operationSteps = op === "+"
        ? [`0 → ${formatNumber(a)}`, `${formatNumber(a)} → ${formatNumber(result)}`, `结果 ${formatNumber(result)}`]
        : op === "-"
          ? [`0 → ${formatNumber(a)}`, `减 B = 加 ${formatNumber(-b)}`, `结果 ${formatNumber(result)}`]
          : op === "*"
            ? [`单位位移 ${formatNumber(a)}`, `重复 ${formatNumber(b)} 次`, `积 ${formatNumber(result)}`]
            : [`总量 ${formatNumber(a)}`, `按 ${formatNumber(b)} 等分`, `商 ${formatNumber(result)}`];
      setSteps(operationSteps, 0);
      markPoint(0, "0", "#ffffff");
      markPoint(a, "A", colorFor(a));

      try {
        if (op === "+") {
          setExplain(`<strong>加法：</strong>0 到 A，再走 B。`);
          await animateHop(0, a, a >= 0 ? `+${formatNumber(a)}` : formatNumber(a), colorFor(a), markerFor(a), token, 0);
          markPoint(a, "A", colorFor(a));
          setSteps(operationSteps, 1);
          await sleep(250, token);
          await animateHop(a, a + b, b >= 0 ? `+${formatNumber(b)}` : formatNumber(b), colorFor(b), markerFor(b), token, 1);
          markPoint(result, "A+B", "#fde047");
          setSteps(operationSteps, 2);
          await animateResultArrow(0, result, `结果 = ${formatNumber(result)}`, token);
        } else if (op === "-") {
          const minusB = -b;
          setExplain(`<strong>减法：</strong>减 B，就是加 B 的相反数。`);
          await animateHop(0, a, a >= 0 ? `+${formatNumber(a)}` : formatNumber(a), colorFor(a), markerFor(a), token, 0);
          markPoint(a, "A", colorFor(a));
          setSteps(operationSteps, 1);
          await sleep(250, token);
          await animateHop(a, result, minusB >= 0 ? `+${formatNumber(minusB)}` : formatNumber(minusB), colorFor(minusB), markerFor(minusB), token, 1);
          markPoint(result, "A-B", "#fde047");
          setSteps(operationSteps, 2);
          await animateResultArrow(0, result, `结果 = ${formatNumber(result)}`, token);
        } else if (op === "*") {
          setExplain(`<strong>乘法：</strong>把 A 当作一次位移，按 B 累积。`);
          if (Number.isInteger(b) && Math.abs(b) > 0 && Math.abs(b) <= 10) {
            let current = 0;
            const step = b > 0 ? a : -a;
            for (let i = 0; i < Math.abs(b); i += 1) {
              setSteps(operationSteps, i === 0 ? 0 : 1);
              await animateHop(current, current + step, formatNumber(step), colorFor(step), markerFor(step), token, i % 4, 520);
              current += step;
              markPoint(current, `${i + 1}`, i === Math.abs(b) - 1 ? "#fde047" : "#94a3b8", 0);
              await sleep(90, token);
            }
          } else {
            setSteps(operationSteps, 1);
            await animateHop(0, result, `总位移 ${formatNumber(result)}`, "#a78bfa", "math-arrow-violet", token, 0, 900);
          }
          markPoint(result, "积", "#fde047");
          setSteps(operationSteps, 2);
          await animateResultArrow(0, result, `结果 = ${formatNumber(result)}`, token);
        } else {
          setExplain(`<strong>除法：</strong>总量 A 还原成每 1 份的位移。`);
          await animateHop(0, a, `总量 ${formatNumber(a)}`, "#94a3b8", "math-arrow-blue", token, 1, 700);
          markPoint(a, "A", "#94a3b8");
          setSteps(operationSteps, 1);
          await sleep(280, token);
          await animateHop(0, result, `单位量 ${formatNumber(result)}`, "#fb7185", result >= 0 ? "math-arrow-blue" : "math-arrow-red", token, 0, 860);
          markPoint(result, "商", "#fde047");
          setSteps(operationSteps, 2);
          await animateResultArrow(0, result, `结果 = ${formatNumber(result)}`, token);
        }
        await rollNumber(result, "= ", token);
        setExplain(`<strong>完成：</strong>${currentExpression()} = ${formatNumber(result)}。`);
      } catch (error) {
      } finally {
        setButtonsDisabled(false);
      }
    }

    async function runOpposite() {
      clearMarks();
      const token = state.token;
      setButtonsDisabled(true);
      const a = readA();
      resetView([0, a, -a]);
      try {
        setSteps([`定位 ${formatNumber(a)}`, "关于 0 镜像", `相反数 ${formatNumber(-a)}`], 0);
        setExplain(`<strong>相反数：</strong>关于 0 对称。`);
        markPoint(0, "0", "#ffffff");
        await animateHop(0, a, `定位 ${formatNumber(a)}`, colorFor(a), markerFor(a), token, 0);
        markPoint(a, "A", colorFor(a));
        drawDistanceBand(-Math.abs(a), Math.abs(a), 52, "#a78bfa", "等距");
        setSteps([`定位 ${formatNumber(a)}`, "关于 0 镜像", `相反数 ${formatNumber(-a)}`], 1);
        await sleep(240, token);
        await animateHop(a, -a, `关于 0 翻转`, colorFor(-a), markerFor(-a), token, 1);
        markPoint(-a, "-A", "#fde047");
        setSteps([`定位 ${formatNumber(a)}`, "关于 0 镜像", `相反数 ${formatNumber(-a)}`], 2);
        await animateResultArrow(0, -a, `相反数 = ${formatNumber(-a)}`, token);
        await rollNumber(-a, `-(${formatNumber(a)}) = `, token);
      } catch (error) {
      } finally {
        setButtonsDisabled(false);
      }
    }

    async function runAbs() {
      clearMarks();
      const token = state.token;
      setButtonsDisabled(true);
      const a = readA();
      resetView([0, a]);
      try {
        setSteps([`定位 ${formatNumber(a)}`, "量到 0 的距离", `|A|=${formatNumber(Math.abs(a))}`], 0);
        setExplain(`<strong>绝对值：</strong>点到 0 的距离。`);
        markPoint(0, "0", "#ffffff");
        await animateHop(0, a, `定位 ${formatNumber(a)}`, colorFor(a), markerFor(a), token, 0);
        markPoint(a, "A", colorFor(a));
        setSteps([`定位 ${formatNumber(a)}`, "量到 0 的距离", `|A|=${formatNumber(Math.abs(a))}`], 1);
        drawDistanceBand(0, a, 52, "#a78bfa", `距离 = ${formatNumber(Math.abs(a))}`);
        setSteps([`定位 ${formatNumber(a)}`, "量到 0 的距离", `|A|=${formatNumber(Math.abs(a))}`], 2);
        await rollNumber(Math.abs(a), `|${formatNumber(a)}| = `, token);
      } catch (error) {
      } finally {
        setButtonsDisabled(false);
      }
    }

    function setMode(mode) {
      state.mode = mode === "fun" ? "fun" : "classic";
      els.scene.dataset.mode = state.mode;
      state.challengeActive = false;
      syncModeButtons();
      updateCamera();
      setExplain(state.mode === "fun"
        ? "挑战模式：随机出题，点数轴作答。"
        : "经典推演：看位移过程。");
      setSteps(state.mode === "fun" ? ["随机出题", "点数轴", "看推演"] : ["定位 A", "执行运算", "落到结果"], -1);
    }

    function syncModeButtons() {
      if (!els.panel) return;
      els.panel.querySelectorAll("[data-mode]").forEach(button => {
        button.classList.toggle("active", button.dataset.mode === state.mode);
      });
      const challenge = els.panel.querySelector('[data-action="challenge"]');
      if (challenge) challenge.disabled = state.mode !== "fun";
    }

    function startChallenge() {
      if (state.mode !== "fun") {
        setMode("fun");
      }
      clearMarks();
      const a = (Math.floor(Math.random() * 21) - 10) / 2;
      const b = (Math.floor(Math.random() * 21) - 10) / 2;
      const op = Math.random() > 0.5 ? "+" : "-";
      els.inputA.value = formatNumber(a);
      els.inputB.value = formatNumber(b);
      els.inputOp.value = op;
      state.challengeAnswer = op === "+" ? a + b : a - b;
      state.challengeActive = true;
      setExplain(`<strong>挑战：</strong>在数轴上点答案。`);
      setSteps([currentExpression(), "点选结果", `吸附到 0.5`], 1);
      setResult("点击数轴作答");
      resetView([0, a, b, state.challengeAnswer]);
      updateChallengeTarget();
    }

    function updateChallengeTarget() {
      if (!state.challengeActive || state.mode !== "fun") {
        els.target.classList.remove("show");
        return;
      }
      const pos = worldToScreen(state.challengeAnswer, -72);
      els.target.style.left = `${pos.x}px`;
      els.target.style.top = `${pos.y}px`;
      els.target.textContent = "?";
      els.target.classList.add("show");
    }

    function handleChallengeClick(event) {
      if (!state.challengeActive || state.mode !== "fun" || state.wasDragged) return;
      const now = performance.now();
      if (now - state.lastChallengeTap < 240) return;
      state.lastChallengeTap = now;
      const rect = els.svg.getBoundingClientRect();
      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;
      const clicked = screenToValue(localX);
      const snapped = Math.round(clicked * 2) / 2;
      const ruler = createSvgElement("line", {
        x1: snapped * state.unit,
        x2: snapped * state.unit,
        y1: -76,
        y2: 42,
        class: "math-hit-ruler"
      });
      els.labels.appendChild(ruler);
      markPoint(snapped, formatNumber(snapped), Math.abs(snapped - state.challengeAnswer) < 0.1 ? "#34d399" : "#fb7185", 0);
      if (Math.abs(snapped - state.challengeAnswer) < 0.1) {
        state.challengeActive = false;
        updateChallengeTarget();
        triggerExplosion(localX, localY, "#34d399", 78);
        showToast(localX, localY, "正确", "#34d399");
        setExplain(`<strong>正确：</strong>答案 ${formatNumber(state.challengeAnswer)}。`);
        setSteps([currentExpression(), "点选结果", `答案 ${formatNumber(state.challengeAnswer)}`], 2);
        const timeout = window.setTimeout(() => {
          state.timeouts.delete(timeout);
          runCalculate();
        }, 620);
        state.timeouts.add(timeout);
      } else {
        triggerExplosion(localX, localY, "#fb7185", 24);
        showToast(localX, localY, `偏到 ${formatNumber(snapped)}`, "#fb7185");
        setExplain(`<strong>再试：</strong>点到 ${formatNumber(snapped)}。`);
      }
    }

    addEvent(els.svg, "wheel", event => {
      event.preventDefault();
      const point = localPoint(event);
      zoomAt(point.x, point.y, state.scale * (event.deltaY < 0 ? 1.15 : 1 / 1.15));
    }, { passive: false });

    addEvent(els.svg, "pointerdown", event => {
      event.preventDefault();
      const point = localPoint(event);
      state.activePointers.set(event.pointerId, {
        x: point.x,
        y: point.y
      });
      els.svg.setPointerCapture?.(event.pointerId);
      if (state.activePointers.size >= 2) {
        startPinchGesture();
      } else {
        startPanGesture(event.pointerId);
      }
    });

    addEvent(els.svg, "pointermove", event => {
      if (!state.activePointers.has(event.pointerId)) return;
      event.preventDefault();
      const point = localPoint(event);
      state.activePointers.set(event.pointerId, {
        x: point.x,
        y: point.y
      });
      if (state.gestureMode === "pinch") {
        applyPinchGesture();
        return;
      }
      if (state.gestureMode !== "pan" || event.pointerId !== state.pointerId) return;
      const activePoint = state.activePointers.get(event.pointerId);
      const dx = activePoint.x - state.gestureStartClientX;
      const dy = activePoint.y - state.gestureStartClientY;
      if (Math.hypot(dx, dy) > DRAG_THRESHOLD) {
        state.gestureMoved = true;
        state.wasDragged = true;
      }
      state.panX = state.gestureStartPanX + dx;
      state.panY = state.gestureStartPanY + dy;
      clampViewport();
      updateCamera();
    });

    addEvent(els.svg, "pointerup", event => {
      const shouldClick = state.gestureMode === "pan" && event.pointerId === state.pointerId && !state.gestureMoved;
      finishPointer(event);
      if (shouldClick) {
        state.wasDragged = false;
        handleChallengeClick(event);
      }
    });

    addEvent(els.svg, "pointercancel", event => {
      finishPointer(event);
    });

    addEvent(els.svg, "pointerleave", event => {
      if (state.activePointers.has(event.pointerId)) finishPointer(event);
    });

    addEvent(els.svg, "click", event => {
      event.preventDefault();
    });

    [sceneEl, els.svg, panel].forEach(target => {
      addEvent(target, "contextmenu", event => event.preventDefault());
      addEvent(target, "selectstart", event => event.preventDefault());
      addEvent(target, "dragstart", event => event.preventDefault());
    });

    if (els.panel) {
      addEvent(els.panel, "input", event => {
        const target = event.target;
        if (target.matches("[data-input]")) {
          updateHud();
          clearMarks();
          setExplain("参数已更新。");
        }
      });

      addEvent(els.panel, "click", event => {
        const modeButton = event.target.closest("[data-mode]");
        if (modeButton) {
          clearMarks();
          setMode(modeButton.dataset.mode);
          return;
        }
        const actionButton = event.target.closest("[data-action]");
        if (!actionButton || actionButton.disabled) return;
        const action = actionButton.dataset.action;
        if (action === "calculate") runCalculate();
        if (action === "abs") runAbs();
        if (action === "opposite") runOpposite();
        if (action === "challenge") startChallenge();
        if (action === "reset") {
          clearMarks();
          resetView([0, readA(), readB()]);
          setExplain("视图已复位。");
        }
      });
    }

    state.flameTimer = window.setInterval(() => {
      if (state.mode !== "fun" || !els.flame) return;
      const tail = Math.random() > 0.5 ? -26 : -38;
      els.flame.setAttribute("d", `M -12 5 L ${tail} 0 L -12 -5 Z`);
    }, 70);

    state.resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    if (state.resizeObserver) state.resizeObserver.observe(sceneEl);
    addEvent(window, "resize", resize);
    resize();
    resetView([0, -3, 5]);
    setSteps(["定位 A", "执行运算", "落到结果"], -1);
    syncModeButtons();
    renderParticles();

    return {
      destroy() {
        state.destroyed = true;
        state.token += 1;
        if (state.abort) state.abort.abort();
        if (state.resizeObserver) state.resizeObserver.disconnect();
        if (state.raf) window.cancelAnimationFrame(state.raf);
        if (state.flameTimer) window.clearInterval(state.flameTimer);
        state.timeouts.forEach(timeout => window.clearTimeout(timeout));
        state.timeouts.clear();
        container.innerHTML = "";
        if (panel) panel.innerHTML = "";
      }
    };
  }

  window.MATH_VISUAL_SCENES[CARD_ID] = {
    mount(container, context) {
      const instance = createScene(container, context || {});
      container.__mathNumberlineScene = instance;
    },
    unmount(container) {
      if (container.__mathNumberlineScene && typeof container.__mathNumberlineScene.destroy === "function") {
        container.__mathNumberlineScene.destroy();
      } else {
        container.innerHTML = "";
      }
      delete container.__mathNumberlineScene;
    }
  };
})();
