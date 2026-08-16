window.MATH_VISUAL_SCENES = window.MATH_VISUAL_SCENES || {};

(function () {
  const CARD_ID = "j7a_m04";
  const STYLE_ID = "math-balance-scene-style";
  const VENDOR_PATH = "assets/vendor/three/";
  const SCRIPT_CACHE = window.__MATH_SCENE_SCRIPT_CACHE__ || (window.__MATH_SCENE_SCRIPT_CACHE__ = new Map());

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function loadScriptOnce(src) {
    if (!src) return Promise.resolve(false);
    if (SCRIPT_CACHE.has(src)) return SCRIPT_CACHE.get(src);
    const promise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-math-scene-src="${src}"]`);
      if (existing) {
        if (existing.dataset.loaded === "true") {
          resolve(true);
        } else {
          existing.addEventListener("load", () => resolve(true), { once: true });
          existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
        }
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.dataset.mathSceneSrc = src;
      script.onload = () => {
        script.dataset.loaded = "true";
        resolve(true);
      };
      script.onerror = () => {
        SCRIPT_CACHE.delete(src);
        script.remove();
        reject(new Error(`Failed to load ${src}`));
      };
      document.head.appendChild(script);
    });
    SCRIPT_CACHE.set(src, promise);
    return promise;
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .math-balance-scene,
      .math-balance-scene *,
      .math-balance-panel,
      .math-balance-panel * {
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -webkit-user-drag: none;
        user-select: none;
      }
      .math-balance-scene {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        color: #f8fafc;
        background:
          radial-gradient(circle at 26% 18%, rgba(56,189,248,0.16), transparent 32%),
          radial-gradient(circle at 76% 72%, rgba(167,139,250,0.12), transparent 34%),
          linear-gradient(145deg, #020617 0%, #08111f 55%, #020617 100%);
        font-family: Inter, "Noto Sans SC", "Microsoft YaHei UI", sans-serif;
        touch-action: none;
      }
      .math-balance-host {
        position: absolute;
        inset: 0;
        overflow: hidden;
      }
      .math-balance-host canvas {
        display: block;
        width: 100%;
        height: 100%;
        touch-action: none;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -webkit-user-drag: none;
        user-select: none;
      }
      .math-balance-loading,
      .math-balance-error {
        position: absolute;
        inset: 0;
        z-index: 5;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        text-align: center;
        color: rgba(248,250,252,0.9);
        font-size: 14px;
        font-weight: 900;
        line-height: 1.6;
        background: radial-gradient(circle at center, rgba(56,189,248,0.14), rgba(2,6,23,0.96));
      }
      .math-balance-error {
        color: #fecaca;
      }
      .math-balance-hud {
        position: absolute;
        left: 14px;
        top: 14px;
        z-index: 4;
        display: grid;
        grid-template-columns: repeat(3, minmax(80px, 1fr));
        gap: 8px;
        width: min(500px, calc(100% - 28px));
        pointer-events: none;
      }
      .math-balance-stat {
        min-width: 0;
        border: 1px solid rgba(148,163,184,0.18);
        border-radius: 8px;
        background: rgba(2,6,23,0.62);
        backdrop-filter: blur(12px);
        padding: 8px 10px;
      }
      .math-balance-stat-label {
        color: rgba(226,232,240,0.56);
        font-size: 10px;
        font-weight: 900;
        letter-spacing: 0.12em;
      }
      .math-balance-stat-value {
        margin-top: 2px;
        color: #ffffff;
        font-size: 17px;
        line-height: 1;
        font-weight: 950;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .math-balance-panel {
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
        align-content: start;
        gap: 8px;
        padding: 10px;
        color: #f8fafc;
        font-family: Inter, "Noto Sans SC", "Microsoft YaHei UI", sans-serif;
        touch-action: pan-y;
      }
      .math-balance-panel::-webkit-scrollbar {
        width: 0;
        height: 0;
      }
      .math-balance-card {
        flex: 0 0 auto;
        min-height: 0;
        border: 1px solid rgba(148,163,184,0.16);
        border-radius: 8px;
        background: rgba(15,23,42,0.64);
        padding: 8px;
      }
      .math-balance-card-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 6px;
        color: rgba(226,232,240,0.68);
        font-size: 11px;
        font-weight: 950;
      }
      .math-balance-card-head span:last-child {
        color: rgba(125,211,252,0.86);
        font-family: "JetBrains Mono", Consolas, monospace;
      }
      .math-balance-section-title {
        color: rgba(226,232,240,0.64);
        font-size: 10px;
        font-weight: 950;
        letter-spacing: 0.06em;
        margin: 2px 0 6px;
      }
      .math-balance-stepper {
        display: grid;
        gap: 5px;
        margin-bottom: 8px;
      }
      .math-balance-step-chip {
        display: grid;
        grid-template-columns: 22px minmax(0, 1fr);
        gap: 6px;
        align-items: center;
        min-height: 30px;
        border: 1px solid rgba(148,163,184,0.16);
        border-radius: 8px;
        background: rgba(2,6,23,0.28);
        color: rgba(226,232,240,0.72);
        font-size: 11px;
        font-weight: 900;
        padding: 5px 7px;
        cursor: pointer;
      }
      .math-balance-step-chip i {
        display: grid;
        place-items: center;
        width: 22px;
        height: 22px;
        border-radius: 7px;
        background: rgba(56,189,248,0.14);
        color: #7dd3fc;
        font-style: normal;
        font-family: "JetBrains Mono", Consolas, monospace;
      }
      .math-balance-step-chip.active {
        border-color: rgba(250,204,21,0.54);
        background: rgba(250,204,21,0.12);
        color: #fef3c7;
      }
      .math-balance-step-chip.active i {
        background: rgba(250,204,21,0.2);
        color: #fde047;
      }
      .math-balance-step-chip.done {
        border-color: rgba(34,197,94,0.32);
        background: rgba(34,197,94,0.08);
      }
      .math-balance-step-chip.done i {
        background: rgba(34,197,94,0.15);
        color: #86efac;
      }
      .math-balance-presets {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }
      .math-balance-button {
        min-width: 0;
        min-height: 34px;
        border: 1px solid rgba(148,163,184,0.18);
        border-radius: 8px;
        background: rgba(2,6,23,0.36);
        color: rgba(226,232,240,0.76);
        font-size: 11px;
        font-weight: 950;
        line-height: 1.18;
        padding: 6px 7px;
        cursor: pointer;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -webkit-user-drag: none;
        user-select: none;
      }
      .math-balance-button.active {
        border-color: rgba(56,189,248,0.72);
        background: rgba(56,189,248,0.14);
        color: #e0f2fe;
      }
      .math-balance-button:active {
        transform: scale(0.98);
      }
      .math-balance-equation {
        color: #ffffff;
        font-size: 17px;
        line-height: 1.2;
        font-weight: 950;
        text-align: center;
        padding: 8px 6px;
        border-radius: 8px;
        background: rgba(2,6,23,0.28);
        border: 1px solid rgba(148,163,184,0.12);
      }
      .math-balance-actions {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
        margin-top: 7px;
      }
      .math-balance-sandbox {
        display: none;
        gap: 8px;
      }
      .math-balance-sandbox.active {
        display: grid;
      }
      .math-balance-sandbox-group {
        display: grid;
        gap: 6px;
      }
      .math-balance-step.active {
        display: block;
      }
      .math-balance-step.hidden {
        display: none;
      }
      .math-balance-add-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 7px;
      }
      .math-balance-field {
        display: grid;
        gap: 6px;
      }
      .math-balance-field label {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        color: rgba(226,232,240,0.72);
        font-size: 11px;
        font-weight: 900;
      }
      .math-balance-chip {
        color: #ffffff;
        font-size: 16px;
        line-height: 1;
        font-weight: 950;
      }
      .math-balance-range {
        width: 100%;
        height: 28px;
        margin: 0;
        accent-color: #38bdf8;
        touch-action: none;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -webkit-user-drag: none;
        user-select: none;
      }
      .math-balance-result {
        min-height: 0;
        overflow: hidden;
        display: grid;
        grid-template-rows: auto auto;
        gap: 8px;
      }
      .math-balance-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        min-height: 28px;
        color: rgba(226,232,240,0.76);
        font-size: 12px;
        font-weight: 850;
      }
      .math-balance-row strong {
        color: #ffffff;
        white-space: nowrap;
      }
      .math-balance-explain {
        min-height: 0;
        overflow: hidden;
        color: rgba(203,213,225,0.78);
        font-size: 12px;
        line-height: 1.42;
        font-weight: 750;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
      }
      .math-balance-panel[data-size="compact"] {
        gap: 8px;
        padding: 10px;
      }
      .math-balance-panel[data-size="compact"] .math-balance-card {
        padding: 8px;
      }
      .math-balance-panel[data-size="compact"] .math-balance-button {
        min-height: 34px;
        font-size: 10px;
        padding: 5px 6px;
      }
      .math-balance-panel[data-size="compact"] .math-balance-equation {
        font-size: 16px;
        padding: 6px;
      }
      .math-balance-panel[data-size="compact"] .math-balance-explain {
        -webkit-line-clamp: 2;
      }
      .math-balance-panel[data-size="micro"] {
        gap: 6px;
        padding: 8px;
      }
      .math-balance-panel[data-size="micro"] .math-balance-card {
        padding: 7px;
      }
      .math-balance-panel[data-size="micro"] .math-balance-button {
        min-height: 28px;
        font-size: 9px;
        padding: 4px 5px;
      }
      .math-balance-panel[data-size="micro"] .math-balance-equation {
        font-size: 14px;
        padding: 5px;
      }
      .math-balance-panel[data-size="micro"] .math-balance-step-chip {
        min-height: 27px;
        font-size: 10px;
        padding: 4px 6px;
      }
      .math-balance-panel[data-size="micro"] .math-balance-row,
      .math-balance-panel[data-size="micro"] .math-balance-explain {
        font-size: 10px;
      }
      .math-balance-panel[data-size="micro"] .math-balance-explain {
        -webkit-line-clamp: 2;
      }
      .math-balance-panel[data-size="micro"] .math-balance-result {
        gap: 4px;
      }
      .math-balance-panel[data-size="micro"] .math-balance-row {
        min-height: 22px;
      }
    `;
    document.head.appendChild(style);
  }

  function fitPanel(panel) {
    const height = panel.getBoundingClientRect().height || 0;
    let size = height < 500 ? "micro" : height < 650 ? "compact" : "normal";
    panel.dataset.size = size;
    if (panel.scrollHeight > panel.clientHeight + 1 && size === "normal") {
      size = "compact";
      panel.dataset.size = size;
    }
    if (panel.scrollHeight > panel.clientHeight + 1 && size !== "micro") {
      panel.dataset.size = "micro";
    }
  }

  function blockNativeTouchMenus(target, options) {
    if (!target) return;
    target.addEventListener("contextmenu", event => event.preventDefault(), options);
    target.addEventListener("selectstart", event => event.preventDefault(), options);
    target.addEventListener("dragstart", event => event.preventDefault(), options);
  }

  function mount(container, context = {}) {
    ensureStyle();
    const panelHost = context.externalPanel || null;
    const equations = {
      eq1: {
        label: "2x+1=x+5",
        xVal: 4,
        steps: [
          { eq: "2x + 1 = x + 5", left: ["x", "x", "1"], right: ["x", "1", "1", "1", "1", "1"], note: "原式平衡。", op: "两边 -x" },
          { eq: "x + 1 = 5", left: ["x", "1"], right: ["1", "1", "1", "1", "1"], note: "两边同时减去 x，平衡不变。", op: "两边 -1" },
          { eq: "x = 4", left: ["x"], right: ["1", "1", "1", "1"], note: "x 单独留下，得到 x=4。", op: "完成" }
        ]
      },
      eq2: {
        label: "3x=x+4",
        xVal: 2,
        steps: [
          { eq: "3x = x + 4", left: ["x", "x", "x"], right: ["x", "1", "1", "1", "1"], note: "原式平衡。", op: "两边 -x" },
          { eq: "2x = 4", left: ["x", "x"], right: ["1", "1", "1", "1"], note: "两边同时减去 x，平衡不变。", op: "两边 ÷2" },
          { eq: "x = 2", left: ["x"], right: ["1", "1"], note: "平均分成 2 份，得到 x=2。", op: "完成" }
        ]
      },
      eq3: {
        label: "2x+2=6",
        xVal: 2,
        steps: [
          { eq: "2x + 2 = 6", left: ["x", "x", "1", "1"], right: ["1", "1", "1", "1", "1", "1"], note: "原式平衡。", op: "两边 -2" },
          { eq: "2x = 4", left: ["x", "x"], right: ["1", "1", "1", "1"], note: "两边同时减去 2，平衡不变。", op: "两边 ÷2" },
          { eq: "x = 2", left: ["x"], right: ["1", "1"], note: "平均分成 2 份，得到 x=2。", op: "完成" }
        ]
      }
    };
    const state = {
      eqId: "eq1",
      step: 0,
      xray: false,
      xVal: equations.eq1.xVal,
      sandboxLeft: [],
      sandboxRight: [],
      leftData: [],
      rightData: [],
      rendererReady: false,
      disposed: false,
      raf: 0
    };
    const refs = {};

    container.innerHTML = "";
    const sceneEl = document.createElement("div");
    sceneEl.className = "math-balance-scene";
    sceneEl.innerHTML = `
      <div class="math-balance-hud">
        <div class="math-balance-stat"><div class="math-balance-stat-label">左盘重量</div><div class="math-balance-stat-value" data-left-weight></div></div>
        <div class="math-balance-stat"><div class="math-balance-stat-label">右盘重量</div><div class="math-balance-stat-value" data-right-weight></div></div>
        <div class="math-balance-stat"><div class="math-balance-stat-label">状态</div><div class="math-balance-stat-value" data-balance-state></div></div>
      </div>
      <div class="math-balance-host" data-three-host></div>
      <div class="math-balance-loading" data-loading>正在载入本地 3D 天平模型...</div>
      <div class="math-balance-error" data-error style="display:none;"></div>
    `;
    container.appendChild(sceneEl);

    let panel = null;
    if (panelHost) {
      panelHost.innerHTML = "";
      panel = document.createElement("div");
      panel.className = "math-balance-panel";
      panel.innerHTML = `
        <div class="math-balance-card math-balance-presets">
          <div class="math-balance-card-head" style="grid-column:1/-1;"><span>方程</span><span data-equation-tag>等式变形</span></div>
          <button class="math-balance-button active" type="button" data-eq="eq1">2x+1=x+5</button>
          <button class="math-balance-button" type="button" data-eq="eq2">3x=x+4</button>
          <button class="math-balance-button" type="button" data-eq="eq3">2x+2=6</button>
          <button class="math-balance-button" type="button" data-eq="sandbox">自由沙盒</button>
        </div>
        <div class="math-balance-card">
          <div class="math-balance-step active" data-step-panel>
            <div class="math-balance-card-head"><span>变形路径</span><span data-step-count></span></div>
            <div class="math-balance-stepper" data-stepper></div>
            <div class="math-balance-equation" data-equation></div>
            <div class="math-balance-actions">
              <button class="math-balance-button active" type="button" data-next>下一步变形</button>
              <button class="math-balance-button" type="button" data-reset>重新演示</button>
            </div>
          </div>
          <div class="math-balance-sandbox" data-sandbox-panel>
            <div class="math-balance-card-head"><span>沙盒</span><span>验证等式</span></div>
            <div class="math-balance-equation" data-sandbox-equation></div>
            <div class="math-balance-sandbox-group">
              <div class="math-balance-section-title">单边放块</div>
              <div class="math-balance-add-grid">
                <button class="math-balance-button" type="button" data-add="left:x">左 +x</button>
                <button class="math-balance-button" type="button" data-add="left:1">左 +1</button>
                <button class="math-balance-button" type="button" data-add="right:x">右 +x</button>
                <button class="math-balance-button" type="button" data-add="right:1">右 +1</button>
              </div>
            </div>
            <div class="math-balance-sandbox-group">
              <div class="math-balance-section-title">两边同操作</div>
              <div class="math-balance-add-grid">
                <button class="math-balance-button" type="button" data-both="x:add">+x</button>
                <button class="math-balance-button" type="button" data-both="x:remove">-x</button>
                <button class="math-balance-button" type="button" data-both="1:add">+1</button>
                <button class="math-balance-button" type="button" data-both="1:remove">-1</button>
              </div>
            </div>
            <div class="math-balance-field">
              <label>x 的真实重量 <span class="math-balance-chip" data-x-chip>3</span></label>
              <input class="math-balance-range" data-x-slider type="range" min="1" max="10" step="1" value="3">
            </div>
          </div>
        </div>
        <div class="math-balance-card math-balance-actions">
          <button class="math-balance-button" type="button" data-xray>透视 x 块</button>
          <button class="math-balance-button" type="button" data-camera>重置视角</button>
        </div>
        <div class="math-balance-card math-balance-result">
          <div>
            <div class="math-balance-row"><span>当前等式</span><strong data-current-eq></strong></div>
            <div class="math-balance-row"><span>平衡判断</span><strong data-current-state></strong></div>
          </div>
          <div class="math-balance-explain" data-explain></div>
        </div>
      `;
      panelHost.appendChild(panel);
      fitPanel(panel);
    }

    const els = {
      host: sceneEl.querySelector("[data-three-host]"),
      loading: sceneEl.querySelector("[data-loading]"),
      error: sceneEl.querySelector("[data-error]"),
      leftWeight: sceneEl.querySelector("[data-left-weight]"),
      rightWeight: sceneEl.querySelector("[data-right-weight]"),
      balanceState: sceneEl.querySelector("[data-balance-state]"),
      panel,
      equation: panel?.querySelector("[data-equation]"),
      equationTag: panel?.querySelector("[data-equation-tag]"),
      sandboxEquation: panel?.querySelector("[data-sandbox-equation]"),
      stepPanel: panel?.querySelector("[data-step-panel]"),
      stepper: panel?.querySelector("[data-stepper]"),
      stepCount: panel?.querySelector("[data-step-count]"),
      sandboxPanel: panel?.querySelector("[data-sandbox-panel]"),
      nextButton: panel?.querySelector("[data-next]"),
      currentEq: panel?.querySelector("[data-current-eq]"),
      currentState: panel?.querySelector("[data-current-state]"),
      explain: panel?.querySelector("[data-explain]"),
      xChip: panel?.querySelector("[data-x-chip]"),
      xSlider: panel?.querySelector("[data-x-slider]"),
      xray: panel?.querySelector("[data-xray]")
    };

    const nativeTouchAbort = typeof AbortController !== "undefined" ? new AbortController() : null;
    const nativeTouchOptions = nativeTouchAbort ? { signal: nativeTouchAbort.signal } : undefined;
    [sceneEl, els.host, panel, panelHost].forEach(target => {
      if (!target) return;
      target.setAttribute?.("draggable", "false");
      blockNativeTouchMenus(target, nativeTouchOptions);
    });
    panel?.querySelectorAll("button, input, label, span, strong, div").forEach(node => node.setAttribute("draggable", "false"));

    function currentEquation() {
      if (state.eqId === "sandbox") {
        const lx = state.sandboxLeft.filter(v => v === "x").length;
        const l1 = state.sandboxLeft.filter(v => v === "1").length;
        const rx = state.sandboxRight.filter(v => v === "x").length;
        const r1 = state.sandboxRight.filter(v => v === "1").length;
        const side = (x, one) => {
          const parts = [];
          if (x) parts.push(x === 1 ? "x" : `${x}x`);
          if (one) parts.push(String(one));
          return parts.join(" + ") || "0";
        };
        return `${side(lx, l1)} = ${side(rx, r1)}`;
      }
      return equations[state.eqId].steps[state.step].eq;
    }

    function currentData() {
      if (state.eqId === "sandbox") {
        return { left: [...state.sandboxLeft], right: [...state.sandboxRight], note: "同加同减保持平衡，单边放块会破坏平衡。" };
      }
      const step = equations[state.eqId].steps[state.step];
      return { left: [...step.left], right: [...step.right], note: step.note };
    }

    function weight(items) {
      return items.reduce((sum, item) => sum + (item === "x" ? state.xVal : 1), 0);
    }

    function createTextTexture(THREE, text, bg, fg) {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");
      const grad = ctx.createLinearGradient(0, 0, 256, 256);
      grad.addColorStop(0, bg);
      grad.addColorStop(1, "#020617");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = "rgba(255,255,255,0.36)";
      ctx.lineWidth = 10;
      ctx.strokeRect(14, 14, 228, 228);
      ctx.fillStyle = fg;
      ctx.font = "900 132px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 128, 136);
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    }

    function initThree() {
      const THREE = window.THREE;
      refs.THREE = THREE;
      refs.scene = new THREE.Scene();
      refs.scene.fog = new THREE.FogExp2(0x020617, 0.018);
      refs.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 160);
      refs.camera.position.set(15, 13, 18);
      refs.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      refs.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      refs.renderer.shadowMap.enabled = true;
      refs.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      els.host.appendChild(refs.renderer.domElement);
      refs.renderer.domElement.setAttribute("draggable", "false");
      refs.renderer.domElement.style.touchAction = "none";
      refs.renderer.domElement.style.userSelect = "none";
      refs.renderer.domElement.style.webkitUserSelect = "none";
      refs.renderer.domElement.style.webkitTouchCallout = "none";
      refs.renderer.domElement.style.webkitUserDrag = "none";
      blockNativeTouchMenus(refs.renderer.domElement, nativeTouchOptions);
      refs.controls = new THREE.OrbitControls(refs.camera, refs.renderer.domElement);
      refs.controls.enableDamping = true;
      refs.controls.dampingFactor = 0.08;
      refs.controls.target.set(0, 4.5, 0);
      refs.controls.minDistance = 10;
      refs.controls.maxDistance = 42;
      if (THREE.TOUCH) {
        refs.controls.touches.ONE = THREE.TOUCH.ROTATE;
        refs.controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
      }

      refs.scene.add(new THREE.AmbientLight(0xffffff, 0.68));
      const dir = new THREE.DirectionalLight(0xffffff, 0.9);
      dir.position.set(12, 20, 10);
      dir.castShadow = true;
      refs.scene.add(dir);
      const spot = new THREE.SpotLight(0x38bdf8, 1.5, 70, Math.PI / 5, 0.45, 1.2);
      spot.position.set(-10, 18, 14);
      refs.scene.add(spot);

      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(90, 90),
        new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.85, metalness: 0.15 })
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -0.12;
      floor.receiveShadow = true;
      refs.scene.add(floor);

      refs.matMetal = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.24 });
      refs.matCable = new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.72 });
      refs.matX = new THREE.MeshStandardMaterial({ map: createTextTexture(THREE, "x", "#0284c7", "#e0f2fe"), roughness: 0.18, metalness: 0.28 });
      refs.matOne = new THREE.MeshStandardMaterial({ map: createTextTexture(THREE, "1", "#be123c", "#ffe4e6"), roughness: 0.18, metalness: 0.22 });
      refs.matXray = new THREE.MeshStandardMaterial({ map: refs.matX.map, roughness: 0.18, metalness: 0.12, transparent: true, opacity: 0.32, depthWrite: false });

      buildBalance();
      state.rendererReady = true;
      els.loading.style.display = "none";
      resizeThree();
      loadCurrentEquation();
      animate();
    }

    function buildBalance() {
      const THREE = refs.THREE;
      const base = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 4.8, 0.65, 36), refs.matMetal);
      base.castShadow = true;
      refs.scene.add(base);
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.56, 8.6, 24), refs.matMetal);
      pillar.position.y = 4.6;
      pillar.castShadow = true;
      refs.scene.add(pillar);
      const pivot = new THREE.Mesh(new THREE.SphereGeometry(0.75, 32, 16), new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.7, roughness: 0.18, emissive: 0x0284c7, emissiveIntensity: 0.22 }));
      pivot.position.y = 9.1;
      pivot.castShadow = true;
      refs.scene.add(pivot);
      refs.beamGroup = new THREE.Group();
      refs.beamGroup.position.y = 9.1;
      refs.scene.add(refs.beamGroup);
      const beam = new THREE.Mesh(new THREE.BoxGeometry(17, 0.45, 0.55), refs.matMetal);
      beam.castShadow = true;
      refs.beamGroup.add(beam);
      refs.leftEnd = new THREE.Group();
      refs.leftEnd.position.set(-7.6, 0, 0);
      refs.rightEnd = new THREE.Group();
      refs.rightEnd.position.set(7.6, 0, 0);
      refs.beamGroup.add(refs.leftEnd, refs.rightEnd);
      refs.leftPan = createPan();
      refs.rightPan = createPan();
      refs.scene.add(refs.leftPan, refs.rightPan);
    }

    function createPan() {
      const THREE = refs.THREE;
      const group = new THREE.Group();
      const pan = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 0.28, 36), new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.58, roughness: 0.34 }));
      pan.position.y = -3.2;
      pan.castShadow = true;
      pan.receiveShadow = true;
      group.add(pan);
      for (let i = 0; i < 3; i += 1) {
        const angle = Math.PI / 6 + (i / 3) * Math.PI * 2;
        const pts = [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(3.35 * Math.cos(angle), -3.06, 3.35 * Math.sin(angle))
        ];
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), refs.matCable));
      }
      return group;
    }

    function createBlock(type) {
      const THREE = refs.THREE;
      const group = new THREE.Group();
      group.userData.isBlock = true;
      group.userData.type = type;
      const mesh = new THREE.Mesh(
        type === "x" ? new THREE.BoxGeometry(1.18, 1.18, 1.18) : new THREE.BoxGeometry(0.86, 0.86, 0.86),
        type === "x" ? (state.xray ? refs.matXray : refs.matX) : refs.matOne
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      if (type === "x") {
        const tinyMat = new THREE.MeshStandardMaterial({ color: 0x7dd3fc, transparent: true, opacity: state.xray ? 0.76 : 0.12, emissive: 0x0284c7, emissiveIntensity: state.xray ? 0.18 : 0.02 });
        const count = clamp(state.xVal, 1, 10);
        for (let i = 0; i < count; i += 1) {
          const tiny = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), tinyMat);
          tiny.position.set(-0.45 + (i % 4) * 0.3, -0.45 + Math.floor(i / 4) * 0.32, 0.48);
          group.add(tiny);
        }
      }
      return group;
    }

    function clearBlocks(group) {
      group.children.filter(child => child.userData?.isBlock).forEach(child => {
        child.traverse(obj => {
          obj.geometry?.dispose?.();
        });
        group.remove(child);
      });
    }

    function arrangeBlocks(group, items) {
      const THREE = refs.THREE;
      clearBlocks(group);
      const counts = { x: 0, "1": 0 };
      items.forEach(type => {
        const block = createBlock(type);
        block.userData.isBlock = true;
        block.userData.type = type;
        if (type === "x") {
          const index = counts.x++;
          block.position.set(-0.78 + (index % 2) * 1.56, -2.46 + Math.floor(index / 2) * 1.23, -0.42);
        } else {
          const index = counts["1"]++;
          block.position.set(-1.18 + (index % 4) * 0.8, -2.63 + Math.floor(index / 4) * 0.78, 0.78);
        }
        group.add(block);
      });
      if (items.length === 0) {
        const empty = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.04, 8, 40), new THREE.MeshBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.35 }));
        empty.userData.isBlock = true;
        empty.position.y = -2.78;
        group.add(empty);
      }
    }

    function loadCurrentEquation() {
      const data = currentData();
      state.leftData = data.left;
      state.rightData = data.right;
      if (state.eqId !== "sandbox") state.xVal = equations[state.eqId].xVal;
      if (state.rendererReady) {
        arrangeBlocks(refs.leftPan, data.left);
        arrangeBlocks(refs.rightPan, data.right);
      }
      updatePanel();
    }

    function renderStepper() {
      if (!els.stepper) return;
      if (state.eqId === "sandbox") {
        els.stepper.innerHTML = "";
        if (els.stepCount) els.stepCount.textContent = "";
        return;
      }
      const steps = equations[state.eqId].steps;
      if (els.stepCount) els.stepCount.textContent = `${state.step + 1}/${steps.length}`;
      els.stepper.innerHTML = steps.map((step, index) => {
        const cls = index === state.step ? "active" : index < state.step ? "done" : "";
        return `<button class="math-balance-step-chip ${cls}" type="button" data-step-index="${index}"><i>${index + 1}</i><span>${step.eq}</span></button>`;
      }).join("");
    }

    function updatePanel() {
      const data = currentData();
      const left = weight(data.left);
      const right = weight(data.right);
      const balanced = left === right;
      els.leftWeight.textContent = String(left);
      els.rightWeight.textContent = String(right);
      els.balanceState.textContent = balanced ? "平衡" : left > right ? "左重" : "右重";
      if (!panel) return;
      panel.querySelectorAll("[data-eq]").forEach(btn => btn.classList.toggle("active", btn.dataset.eq === state.eqId));
      els.stepPanel.classList.toggle("hidden", state.eqId === "sandbox");
      els.stepPanel.classList.toggle("active", state.eqId !== "sandbox");
      els.sandboxPanel.classList.toggle("active", state.eqId === "sandbox");
      renderStepper();
      els.equation.textContent = currentEquation();
      els.sandboxEquation.textContent = currentEquation();
      if (els.equationTag) els.equationTag.textContent = state.eqId === "sandbox" ? "自由验证" : `x=${equations[state.eqId].xVal}`;
      if (els.nextButton && state.eqId !== "sandbox") {
        const steps = equations[state.eqId].steps;
        const atEnd = state.step >= steps.length - 1;
        els.nextButton.textContent = atEnd ? "已完成" : steps[state.step].op;
        els.nextButton.disabled = atEnd;
        els.nextButton.classList.toggle("active", !atEnd);
      }
      els.currentEq.textContent = currentEquation();
      els.currentState.textContent = balanced ? "两边相等" : left > right ? "左边更重" : "右边更重";
      els.explain.textContent = data.note;
      els.xChip.textContent = String(state.xVal);
      els.xSlider.value = String(state.xVal);
      els.xray.classList.toggle("active", state.xray);
      fitPanel(panel);
    }

    function resizeThree() {
      if (!refs.renderer) return;
      const width = Math.max(320, els.host.clientWidth || container.clientWidth || 320);
      const height = Math.max(240, els.host.clientHeight || container.clientHeight || 240);
      refs.camera.aspect = width / height;
      refs.camera.updateProjectionMatrix();
      refs.renderer.setSize(width, height, false);
    }

    function resetCamera() {
      if (!refs.camera || !refs.controls) return;
      refs.camera.position.set(15, 13, 18);
      refs.controls.target.set(0, 4.5, 0);
      refs.controls.update();
    }

    function animate() {
      if (state.disposed || !refs.renderer) return;
      const data = currentData();
      const diff = weight(data.left) - weight(data.right);
      const target = clamp(diff * 0.035, -0.28, 0.28);
      refs.beamGroup.rotation.z += (target - refs.beamGroup.rotation.z) * 0.08;
      const leftPos = new refs.THREE.Vector3();
      const rightPos = new refs.THREE.Vector3();
      refs.leftEnd.getWorldPosition(leftPos);
      refs.rightEnd.getWorldPosition(rightPos);
      refs.leftPan.position.copy(leftPos);
      refs.rightPan.position.copy(rightPos);
      refs.leftPan.rotation.z = refs.beamGroup.rotation.z * 0.15;
      refs.rightPan.rotation.z = refs.beamGroup.rotation.z * 0.15;
      refs.controls.update();
      refs.renderer.render(refs.scene, refs.camera);
      const raf = window.requestAnimationFrame || (fn => window.setTimeout(fn, 16));
      state.raf = raf(animate);
    }

    function setEquation(id) {
      state.eqId = id;
      state.step = 0;
      if (id === "sandbox") {
        state.xVal = Number(els.xSlider?.value || 3);
        state.sandboxLeft = [];
        state.sandboxRight = [];
      }
      loadCurrentEquation();
    }

    function addBlock(side, type) {
      if (side === "left") state.sandboxLeft.push(type);
      if (side === "right") state.sandboxRight.push(type);
      loadCurrentEquation();
    }

    function removeBlock(side, type) {
      const list = side === "left" ? state.sandboxLeft : state.sandboxRight;
      const index = list.lastIndexOf(type);
      if (index >= 0) list.splice(index, 1);
      loadCurrentEquation();
    }

    const handleResize = () => {
      resizeThree();
      if (panel) fitPanel(panel);
    };
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(handleResize) : null;
    resizeObserver?.observe(container);
    if (panelHost) resizeObserver?.observe(panelHost);
    if (!resizeObserver) {
      window.addEventListener("resize", handleResize);
    }

    panel?.addEventListener("click", event => {
      const stepBtn = event.target.closest("[data-step-index]");
      if (stepBtn && state.eqId !== "sandbox") {
        state.step = clamp(Number(stepBtn.dataset.stepIndex), 0, equations[state.eqId].steps.length - 1);
        loadCurrentEquation();
        return;
      }
      const eqBtn = event.target.closest("[data-eq]");
      if (eqBtn) {
        setEquation(eqBtn.dataset.eq);
        return;
      }
      if (event.target.closest("[data-next]")) {
        if (state.eqId !== "sandbox") {
          const max = equations[state.eqId].steps.length - 1;
          state.step = Math.min(max, state.step + 1);
          loadCurrentEquation();
        }
        return;
      }
      if (event.target.closest("[data-reset]")) {
        state.step = 0;
        loadCurrentEquation();
        return;
      }
      if (event.target.closest("[data-xray]")) {
        state.xray = !state.xray;
        loadCurrentEquation();
        return;
      }
      if (event.target.closest("[data-camera]")) {
        resetCamera();
        return;
      }
      const add = event.target.closest("[data-add]");
      if (add) {
        const [side, type] = add.dataset.add.split(":");
        addBlock(side, type);
        return;
      }
      const both = event.target.closest("[data-both]");
      if (both) {
        const [type, action] = both.dataset.both.split(":");
        if (action === "add") {
          addBlock("left", type);
          addBlock("right", type);
        } else {
          removeBlock("left", type);
          removeBlock("right", type);
        }
      }
    });
    els.xSlider?.addEventListener("input", event => {
      state.xVal = Number(event.target.value);
      if (state.eqId !== "sandbox") state.eqId = "sandbox";
      loadCurrentEquation();
    });

    Promise.resolve()
      .then(() => (window.THREE ? true : loadScriptOnce(`${VENDOR_PATH}three.min.js`)))
      .then(() => (window.THREE?.OrbitControls ? true : loadScriptOnce(`${VENDOR_PATH}OrbitControls.js`)))
      .then(() => {
        if (state.disposed) return;
        if (!window.THREE || !window.THREE.OrbitControls) throw new Error("本地 Three.js 或 OrbitControls 未载入");
        initThree();
      })
      .catch(error => {
        els.loading.style.display = "none";
        els.error.style.display = "flex";
        els.error.textContent = `3D 天平模型载入失败：${error.message}`;
      });

    container.__mathBalanceCleanup = () => {
      state.disposed = true;
      resizeObserver?.disconnect();
      nativeTouchAbort?.abort();
      if (!resizeObserver) window.removeEventListener("resize", handleResize);
      const caf = window.cancelAnimationFrame || window.clearTimeout;
      caf(state.raf);
      refs.controls?.dispose?.();
      refs.renderer?.dispose?.();
      refs.scene?.traverse?.(obj => {
        obj.geometry?.dispose?.();
        if (Array.isArray(obj.material)) obj.material.forEach(mat => mat.dispose?.());
        else obj.material?.dispose?.();
      });
      container.innerHTML = "";
      if (panelHost) panelHost.innerHTML = "";
    };
  }

  window.MATH_VISUAL_SCENES[CARD_ID] = {
    mount,
    unmount(container) {
      if (container.__mathBalanceCleanup) {
        container.__mathBalanceCleanup();
        delete container.__mathBalanceCleanup;
      } else {
        container.innerHTML = "";
      }
    }
  };
})();
