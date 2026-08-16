window.MATH_VISUAL_SCENES = window.MATH_VISUAL_SCENES || {};

(function () {
  const CARD_IDS = [
    "sx1_m01",
    "sx1_m02",
    "sx1_m03",
    "sx2_m01",
    "sx2_m02",
    "sx3_m01",
    "sx3_m02"
  ];
  const STYLE_ID = "math-senior-lab-style";
  const mounts = new WeakMap();

  const LAB_FALLBACKS = {
    sx1_m01: { type: "conic-section", accent: "#38bdf8", title: "圆锥曲线截面实验", formula: "平面切割双圆锥" },
    sx1_m02: { type: "space-vector", accent: "#22c55e", title: "空间向量法向量实验", formula: "n · (x - p) = 0" },
    sx1_m03: { type: "parabola-focus", accent: "#f59e0b", title: "焦点准线抛物线实验", formula: "x² = 4py" },
    sx2_m01: { type: "derivative-tangent", accent: "#a78bfa", title: "导数切线与极值实验", formula: "f'(x0) = k" },
    sx2_m02: { type: "riemann-sum", accent: "#14b8a6", title: "黎曼和面积逼近实验", formula: "Σ f(xi)Δx → ∫ f(x)dx" },
    sx3_m01: { type: "galton-board", accent: "#f97316", title: "高尔顿板正态分布实验", formula: "Bin(n,p) ≈ N(μ,σ²)" },
    sx3_m02: { type: "mandelbrot", accent: "#ec4899", title: "复平面分形实验", formula: "zₙ₊₁ = zₙ² + c" }
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function format(value, digits = 2) {
    if (!Number.isFinite(value)) return "--";
    return Number(value).toFixed(digits).replace(/\.?0+$/, "");
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .math-senior-lab,
      .math-senior-lab *,
      .math-senior-lab-panel,
      .math-senior-lab-panel * {
        box-sizing: border-box;
        min-width: 0;
        letter-spacing: 0;
        -webkit-tap-highlight-color: transparent;
      }
      .math-senior-lab {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        color: #f8fafc;
        background:
          radial-gradient(circle at 22% 18%, color-mix(in srgb, var(--lab-accent) 18%, transparent), transparent 34%),
          radial-gradient(circle at 82% 76%, rgba(148, 163, 184, 0.13), transparent 38%),
          linear-gradient(145deg, #020617 0%, #08111f 54%, #020617 100%);
        font-family: Inter, "Noto Sans SC", "Microsoft YaHei UI", sans-serif;
        touch-action: none;
      }
      .math-senior-lab.dragging {
        cursor: grabbing;
      }
      .math-senior-lab canvas {
        cursor: crosshair;
      }
      .math-senior-lab canvas {
        position: absolute;
        inset: 0;
        display: block;
        width: 100%;
        height: 100%;
      }
      .math-senior-lab-overlay {
        position: absolute;
        left: 16px;
        top: 16px;
        max-width: min(520px, calc(100% - 32px));
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: none;
      }
      .math-senior-lab-kicker {
        width: max-content;
        max-width: 100%;
        border: 1px solid color-mix(in srgb, var(--lab-accent) 46%, transparent);
        background: rgba(2, 6, 23, 0.58);
        color: color-mix(in srgb, var(--lab-accent) 72%, #ffffff);
        border-radius: 999px;
        padding: 6px 10px;
        font-size: 10px;
        font-weight: 900;
        line-height: 1;
        overflow-wrap: anywhere;
      }
      .math-senior-lab-title {
        max-width: 100%;
        border: 1px solid rgba(148, 163, 184, 0.16);
        background: rgba(2, 6, 23, 0.56);
        border-radius: 16px;
        padding: 12px 14px;
        box-shadow: 0 18px 45px rgba(0, 0, 0, 0.28);
        backdrop-filter: blur(16px);
      }
      .math-senior-lab-title h2 {
        margin: 0;
        color: #f8fafc;
        font-size: clamp(16px, 2.2vw, 24px);
        line-height: 1.16;
        font-weight: 950;
        overflow-wrap: anywhere;
      }
      .math-senior-lab-title p {
        margin: 6px 0 0;
        color: #cbd5e1;
        font-size: 12px;
        line-height: 1.45;
        overflow-wrap: anywhere;
      }
      .math-senior-lab[data-card-id="sx1_m03"] .math-senior-lab-title {
        max-width: 330px;
        padding: 10px 12px;
        border-radius: 14px;
      }
      .math-senior-lab[data-card-id="sx1_m03"] .math-senior-lab-title p {
        display: none;
      }
      .math-senior-lab-metrics {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
      }
      .math-senior-lab-metric {
        border: 1px solid rgba(148, 163, 184, 0.14);
        background: rgba(15, 23, 42, 0.54);
        border-radius: 12px;
        padding: 8px 9px;
        min-height: 56px;
      }
      .math-senior-lab-metric b {
        display: block;
        color: #94a3b8;
        font-size: 9px;
        font-weight: 900;
        line-height: 1.2;
        overflow-wrap: anywhere;
      }
      .math-senior-lab-metric span {
        display: block;
        margin-top: 4px;
        color: #f8fafc;
        font-size: 14px;
        font-weight: 950;
        line-height: 1.15;
        overflow-wrap: anywhere;
      }
      .math-senior-lab-panel {
        --math-lab-panel-accent: #38bdf8;
        --math-lab-panel-accent-strong: #67e8f9;
        --math-lab-panel-gold: #facc15;
        --math-lab-panel-line: rgba(255,255,255,0.086);
        --math-lab-panel-card: rgba(8,13,24,0.46);
        --math-lab-panel-control: rgba(255,255,255,0.052);
        width: 100%;
        height: 100%;
        color: #f8fafc;
        background: transparent;
        border: 0;
        border-radius: 0;
        box-shadow: none;
        font-family: Inter, "Noto Sans SC", "Microsoft YaHei UI", sans-serif;
        overflow: hidden;
        min-height: 0;
        touch-action: pan-y;
      }
      .math-senior-lab-panel-inner {
        height: 100%;
        min-height: 0;
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 10px;
        overflow-y: auto;
        overflow-x: hidden;
        scrollbar-width: none;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        touch-action: pan-y;
      }
      .math-senior-lab-panel-inner::-webkit-scrollbar {
        width: 0;
        height: 0;
      }
      .math-senior-lab-panel-card {
        border: 1px solid var(--math-lab-panel-line);
        background:
          linear-gradient(180deg, rgba(255,255,255,0.046), rgba(255,255,255,0.026)),
          var(--math-lab-panel-card);
        border-radius: 12px;
        padding: 12px;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.045);
        backdrop-filter: blur(12px);
      }
      .math-senior-lab-panel h3 {
        margin: 0;
        color: var(--math-lab-panel-accent-strong);
        font-size: 15px;
        line-height: 1.28;
        font-weight: 950;
        overflow-wrap: anywhere;
      }
      .math-senior-lab-panel .sub {
        margin-top: 6px;
        color: #cbd5e1;
        font-size: 11px;
        line-height: 1.6;
        overflow-wrap: anywhere;
      }
      .math-lab-control {
        display: flex;
        flex-direction: column;
        gap: 7px;
        padding: 10px 0;
        border-top: 1px solid rgba(255,255,255,0.08);
      }
      .math-lab-control:first-child {
        border-top: 0;
        padding-top: 0;
      }
      .math-lab-control-label {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 10px;
        color: #e2e8f0;
        font-size: 11px;
        line-height: 1.35;
        font-weight: 900;
      }
      .math-lab-control-label span:first-child {
        overflow-wrap: anywhere;
      }
      .math-lab-control-value {
        flex: 0 0 auto;
        color: var(--math-lab-panel-gold);
        font-variant-numeric: tabular-nums;
      }
      .math-lab-control input[type="range"] {
        width: 100%;
        height: 34px;
        min-height: 34px;
        margin: 0;
        appearance: none;
        -webkit-appearance: none;
        background: transparent;
        cursor: pointer;
        touch-action: pan-y;
      }
      .math-lab-control input[type="range"]::-webkit-slider-runnable-track {
        height: 7px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.10);
        background:
          linear-gradient(90deg, var(--math-lab-panel-accent) 0 var(--pct, 50%), rgba(51,65,85,0.64) var(--pct, 50%) 100%);
        box-shadow: inset 0 1px 2px rgba(0,0,0,0.32);
      }
      .math-lab-control input[type="range"]::-webkit-slider-thumb {
        width: 19px;
        height: 19px;
        margin-top: -7px;
        border-radius: 999px;
        border: 3px solid #07111f;
        background: var(--math-lab-panel-accent-strong);
        box-shadow: 0 0 0 1px rgba(255,255,255,0.18), 0 0 16px color-mix(in srgb, var(--math-lab-panel-accent) 42%, transparent);
        -webkit-appearance: none;
        appearance: none;
      }
      .math-lab-control input[type="range"]::-moz-range-track {
        height: 7px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.10);
        background: rgba(51,65,85,0.64);
      }
      .math-lab-control input[type="range"]::-moz-range-progress {
        height: 7px;
        border-radius: 999px;
        background: var(--math-lab-panel-accent);
      }
      .math-lab-control input[type="range"]::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 999px;
        border: 3px solid #07111f;
        background: var(--math-lab-panel-accent-strong);
        box-shadow: 0 0 0 1px rgba(255,255,255,0.18), 0 0 16px color-mix(in srgb, var(--math-lab-panel-accent) 42%, transparent);
      }
      .math-lab-buttons {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 7px;
      }
      .math-lab-buttons.compact {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .math-lab-buttons button {
        min-height: max(var(--bio-touch-target, 40px), 40px);
        border: 1px solid rgba(255,255,255,0.10);
        border-radius: 10px;
        background: var(--math-lab-panel-control);
        color: rgba(241,245,249,0.88);
        font-size: 11px;
        line-height: 1.2;
        font-weight: 900;
        cursor: pointer;
        overflow-wrap: anywhere;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
        touch-action: manipulation;
      }
      .math-lab-buttons button.active {
        border-color: color-mix(in srgb, var(--math-lab-panel-accent-strong) 72%, rgba(255,255,255,0.2));
        background:
          linear-gradient(180deg, color-mix(in srgb, var(--math-lab-panel-accent) 22%, transparent), rgba(255,255,255,0.035)),
          rgba(8,13,24,0.42);
        color: #ecfeff;
        box-shadow: inset 3px 0 0 var(--math-lab-panel-accent), 0 0 18px color-mix(in srgb, var(--math-lab-panel-accent) 18%, transparent);
      }
      .math-lab-buttons button[data-action] {
        border-color: color-mix(in srgb, var(--math-lab-panel-accent) 28%, rgba(255,255,255,0.10));
      }
      .math-lab-note {
        color: #cbd5e1;
        font-size: 11px;
        line-height: 1.65;
        overflow-wrap: anywhere;
      }
      .math-lab-readout {
        display: grid;
        gap: 8px;
      }
      .math-lab-readout-row {
        display: grid;
        grid-template-columns: 62px minmax(0, 1fr);
        align-items: center;
        gap: 8px;
        min-height: 30px;
        border: 1px solid rgba(255,255,255,0.075);
        border-radius: 10px;
        background: rgba(255,255,255,0.034);
        padding: 7px 8px;
      }
      .math-lab-readout-row b {
        color: #94a3b8;
        font-size: 10px;
        line-height: 1.2;
        font-weight: 950;
      }
      .math-lab-readout-row span {
        color: #f8fafc;
        font-size: 12px;
        line-height: 1.2;
        font-weight: 950;
        font-variant-numeric: tabular-nums;
        overflow-wrap: anywhere;
      }
      @media (max-width: 720px), (max-height: 520px) {
        .math-senior-lab-overlay {
          left: 10px;
          top: 10px;
          max-width: calc(100% - 20px);
          gap: 6px;
        }
        .math-senior-lab-title {
          padding: 9px 10px;
          border-radius: 12px;
        }
        .math-senior-lab-title h2 {
          font-size: 15px;
        }
        .math-senior-lab-title p {
          display: none;
        }
        .math-senior-lab-metrics {
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 5px;
        }
        .math-senior-lab-metric {
          min-height: 42px;
          padding: 6px;
        }
        .math-senior-lab-metric span {
          font-size: 12px;
        }
        .math-senior-lab-panel-inner {
          padding: 8px;
          gap: 8px;
        }
        .math-senior-lab-panel-card {
          padding: 10px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function createElement(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function listen(state, target, type, handler, options) {
    target.addEventListener(type, handler, options);
    state.listeners.push([target, type, handler, options]);
  }

  function cleanup(state) {
    if (!state || state.disposed) return;
    state.disposed = true;
    state.listeners.forEach(([target, type, handler, options]) => target.removeEventListener(type, handler, options));
    state.listeners = [];
    if (state.raf) cancelAnimationFrame(state.raf);
    if (state.resizeObserver) state.resizeObserver.disconnect();
    if (state.sceneRoot) state.sceneRoot.remove();
    if (state.panelRoot) state.panelRoot.remove();
  }

  function getLabMeta(cardId, context) {
    return Object.assign({}, LAB_FALLBACKS[cardId] || {}, context?.config?.mathLab || {});
  }

  function setMetric(state, items) {
    state.metricRoot.innerHTML = "";
    items.slice(0, 3).forEach(item => {
      const box = createElement("div", "math-senior-lab-metric");
      box.appendChild(createElement("b", "", item.label));
      box.appendChild(createElement("span", "", item.value));
      state.metricRoot.appendChild(box);
    });
  }

  function setReadout(state, items) {
    if (!state.readoutRoot) return;
    state.readoutRoot.innerHTML = "";
    items.forEach(item => {
      const row = createElement("div", "math-lab-readout-row");
      row.appendChild(createElement("b", "", item.label));
      row.appendChild(createElement("span", "", item.value));
      state.readoutRoot.appendChild(row);
    });
  }

  function syncSliderProgress(input) {
    const min = Number(input.min);
    const max = Number(input.max);
    const value = Number(input.value);
    const pct = max > min ? clamp((value - min) / (max - min) * 100, 0, 100) : 0;
    input.style.setProperty("--pct", `${pct}%`);
  }

  function syncControl(state, key) {
    const control = state.controls?.[key];
    if (!control) return;
    const value = state.values[key];
    control.input.value = String(value);
    control.valueNode.textContent = control.formatter ? control.formatter(value) : format(value);
    syncSliderProgress(control.input);
  }

  function setControlValue(state, key, value, shouldDraw = true) {
    state.values[key] = value;
    syncControl(state, key);
    if (shouldDraw) draw(state);
  }

  function animateParabolaTrace(state) {
    if (state.raf) cancelAnimationFrame(state.raf);
    const duration = 980;
    const start = performance.now();
    setControlValue(state, "progress", 8, false);
    const tick = now => {
      const t = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setControlValue(state, "progress", Math.round(8 + eased * 92), true);
      if (t < 1 && !state.disposed) {
        state.raf = requestAnimationFrame(tick);
      } else {
        state.raf = 0;
      }
    };
    draw(state);
    state.raf = requestAnimationFrame(tick);
  }

  function makeSlider(state, key, label, min, max, step, value, formatter) {
    state.controls = state.controls || {};
    state.values[key] = value;
    const wrap = createElement("div", "math-lab-control");
    const head = createElement("div", "math-lab-control-label");
    const valueNode = createElement("span", "math-lab-control-value", formatter ? formatter(value) : format(value));
    head.appendChild(createElement("span", "", label));
    head.appendChild(valueNode);
    const input = createElement("input");
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(value);
    state.controls[key] = { input, valueNode, formatter };
    syncSliderProgress(input);
    listen(state, input, "input", () => {
      const nextValue = Number(input.value);
      state.values[key] = nextValue;
      valueNode.textContent = formatter ? formatter(nextValue) : format(nextValue);
      syncSliderProgress(input);
      draw(state);
    });
    wrap.appendChild(head);
    wrap.appendChild(input);
    return wrap;
  }

  function makeButtons(state, key, items, options = {}) {
    const wrap = createElement("div", "math-lab-control");
    const buttons = createElement("div", options.compact ? "math-lab-buttons compact" : "math-lab-buttons");
    const update = () => {
      Array.from(buttons.children).forEach(button => {
        button.classList.toggle("active", button.dataset.value === String(state.values[key]));
      });
    };
    items.forEach(item => {
      const button = createElement("button", "", item.label);
      button.type = "button";
      button.dataset.value = item.value;
      listen(state, button, "click", () => {
        state.values[key] = item.value;
        update();
        draw(state);
      });
      buttons.appendChild(button);
    });
    wrap.appendChild(buttons);
    update();
    return wrap;
  }

  function makeActionButtons(state, items, options = {}) {
    const wrap = createElement("div", "math-lab-control");
    const buttons = createElement("div", options.compact ? "math-lab-buttons compact" : "math-lab-buttons");
    items.forEach(item => {
      const button = createElement("button", "", item.label);
      button.type = "button";
      button.dataset.action = item.action || item.label;
      listen(state, button, "click", () => item.run(state, button));
      buttons.appendChild(button);
    });
    wrap.appendChild(buttons);
    return wrap;
  }

  function buildPanel(state, card) {
    const inner = createElement("div", "math-senior-lab-panel-inner");

    const controls = createElement("section", "math-senior-lab-panel-card");
    const type = state.meta.type;

    if (type === "conic-section") {
      controls.appendChild(makeSlider(state, "angle", "切割平面倾角", 18, 78, 1, 42, value => `${value}°`));
      controls.appendChild(makeSlider(state, "height", "截面高度偏移", -0.8, 0.8, 0.02, 0.08, value => format(value, 2)));
      controls.appendChild(makeSlider(state, "spin", "空间观察角", -65, 65, 1, -24, value => `${value}°`));
    } else if (type === "space-vector") {
      controls.appendChild(makeSlider(state, "theta", "法向量水平角", -70, 70, 1, 28, value => `${value}°`));
      controls.appendChild(makeSlider(state, "tilt", "平面俯仰角", -42, 42, 1, -18, value => `${value}°`));
      controls.appendChild(makeSlider(state, "distance", "点到平面偏移", -1.2, 1.2, 0.02, 0.64, value => format(value, 2)));
    } else if (type === "parabola-focus") {
      state.values.mode = "definition";
      state.values.orientation = "vertical";
      controls.appendChild(makeButtons(state, "mode", [
        { label: "定义", value: "definition" },
        { label: "方程", value: "equation" }
      ]));
      controls.appendChild(makeButtons(state, "orientation", [
        { label: "竖向", value: "vertical" },
        { label: "横向", value: "horizontal" }
      ]));
      controls.appendChild(makeActionButtons(state, [
        { label: "生成", action: "trace", run: current => animateParabolaTrace(current) },
        { label: "窄", action: "narrow", run: current => setControlValue(current, "p", 0.55) },
        { label: "宽", action: "wide", run: current => setControlValue(current, "p", 1.85) }
      ], { compact: true }));
      controls.appendChild(makeSlider(state, "p", "焦点/准线距离 p", 0.45, 2.2, 0.01, 1.05, value => format(value, 2)));
      controls.appendChild(makeSlider(state, "sampleX", "轨迹点参数 s", -3.2, 3.2, 0.02, 1.45, value => format(value, 2)));
      controls.appendChild(makeSlider(state, "progress", "轨迹生成进度", 8, 100, 1, 100, value => `${Math.round(value)}%`));
      controls.appendChild(makeSlider(state, "zoom", "视图缩放", 42, 76, 1, 58, value => `${value}px`));
    } else if (type === "derivative-tangent") {
      state.values.func = "cubic";
      controls.appendChild(makeButtons(state, "func", [
        { label: "三次函数", value: "cubic" },
        { label: "正弦叠加", value: "wave" }
      ]));
      controls.appendChild(makeSlider(state, "x0", "切点 x0", -3.2, 3.2, 0.02, 0.9, value => format(value, 2)));
      controls.appendChild(makeSlider(state, "zoom", "图像缩放", 42, 72, 1, 56, value => `${value}px`));
    } else if (type === "riemann-sum") {
      state.values.method = "mid";
      controls.appendChild(makeButtons(state, "method", [
        { label: "左端点", value: "left" },
        { label: "中点", value: "mid" },
        { label: "右端点", value: "right" },
        { label: "上和", value: "upper" }
      ]));
      controls.appendChild(makeSlider(state, "n", "矩形数量 N", 4, 64, 1, 16, value => `${value}`));
      controls.appendChild(makeSlider(state, "b", "积分右端点", 2.2, 5.2, 0.05, 4.4, value => format(value, 2)));
    } else if (type === "galton-board") {
      controls.appendChild(makeSlider(state, "rows", "钉板层数", 6, 16, 1, 11, value => `${value}`));
      controls.appendChild(makeSlider(state, "balls", "模拟小球数量", 120, 2400, 20, 900, value => `${value}`));
      controls.appendChild(makeSlider(state, "bias", "向右概率 p", 0.35, 0.65, 0.01, 0.5, value => format(value, 2)));
    } else {
      controls.appendChild(makeSlider(state, "zoom", "复平面放大", 1, 80, 0.5, 9, value => `${format(value, 1)}x`));
      controls.appendChild(makeSlider(state, "iterations", "迭代次数", 32, 160, 1, 92, value => `${value}`));
      controls.appendChild(makeSlider(state, "centerY", "纵向中心", -0.7, 0.7, 0.01, 0, value => format(value, 2)));
    }

    inner.appendChild(controls);

    if (type === "parabola-focus") {
      const readoutCard = createElement("section", "math-senior-lab-panel-card");
      const readout = createElement("div", "math-lab-readout");
      readoutCard.appendChild(readout);
      state.readoutRoot = readout;
      inner.appendChild(readoutCard);
    }

    const note = createElement("section", "math-senior-lab-panel-card");
    note.appendChild(createElement("div", "math-lab-note", type === "parabola-focus" ? "拖动 F、准线或 P，右侧参数同步变化。" : state.meta.note || "参数变化会同步影响画面与左上角指标。内容已按课件面板拆分，避免控制区遮挡主体画面。"));
    inner.appendChild(note);
    state.panelRoot.appendChild(inner);
  }

  function resizeCanvas(state) {
    const rect = state.sceneRoot.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    state.width = Math.max(1, Math.round(rect.width));
    state.height = Math.max(1, Math.round(rect.height));
    state.canvas.width = Math.max(1, Math.round(state.width * dpr));
    state.canvas.height = Math.max(1, Math.round(state.height * dpr));
    state.canvas.style.width = `${state.width}px`;
    state.canvas.style.height = `${state.height}px`;
    state.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(state);
  }

  function background(ctx, state) {
    const { width: w, height: h } = state;
    ctx.clearRect(0, 0, w, h);
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, "#020617");
    gradient.addColorStop(0.55, "#0f172a");
    gradient.addColorStop(1, "#020617");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    const gap = Math.max(28, Math.min(54, w / 18));
    for (let x = (state.phase * 8) % gap; x < w; x += gap) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = (state.phase * 5) % gap; y < h; y += gap) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function worldProject(state, x, y, z) {
    const spin = (state.values.spin || state.values.theta || 0) * Math.PI / 180;
    const tilt = (state.values.tilt ?? -18) * Math.PI / 180;
    const cs = Math.cos(spin);
    const ss = Math.sin(spin);
    const ct = Math.cos(tilt);
    const st = Math.sin(tilt);
    const rx = x * cs - z * ss;
    const rz = x * ss + z * cs;
    const ry = y * ct - rz * st;
    const scale = Math.min(state.width, state.height) * 0.18;
    return {
      x: state.width * 0.52 + rx * scale,
      y: state.height * 0.57 - ry * scale,
      depth: rz
    };
  }

  function drawPolyline(ctx, points, color, width = 2, close = false, fill = "") {
    if (!points.length) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach(point => ctx.lineTo(point.x, point.y));
    if (close) ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
  }

  function drawArrow(ctx, from, to, color) {
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - 12 * Math.cos(angle - 0.45), to.y - 12 * Math.sin(angle - 0.45));
    ctx.lineTo(to.x - 12 * Math.cos(angle + 0.45), to.y - 12 * Math.sin(angle + 0.45));
    ctx.closePath();
    ctx.fill();
  }

  function drawConic(state) {
    const ctx = state.ctx;
    background(ctx, state);
    const angle = state.values.angle;
    const height = state.values.height;
    const kind = angle < 34 ? "椭圆" : angle < 58 ? "抛物线" : "双曲线";
    const accent = state.meta.accent;

    for (let z = -2.4; z <= 2.4; z += 0.42) {
      const r = Math.abs(z) * 0.56 + 0.05;
      const ring = [];
      for (let i = 0; i <= 64; i++) {
        const t = i / 64 * Math.PI * 2;
        ring.push(worldProject(state, Math.cos(t) * r, Math.sin(t) * r, z));
      }
      drawPolyline(ctx, ring, z < 0 ? "rgba(148,163,184,.22)" : "rgba(148,163,184,.34)", 1);
    }
    for (let i = 0; i < 16; i++) {
      const t = i / 16 * Math.PI * 2;
      const a = worldProject(state, Math.cos(t) * 1.45, Math.sin(t) * 1.45, 2.4);
      const b = worldProject(state, 0, 0, 0);
      const c = worldProject(state, Math.cos(t) * 1.45, Math.sin(t) * 1.45, -2.4);
      drawPolyline(ctx, [a, b, c], "rgba(148,163,184,.2)", 1);
    }

    const planeSlope = Math.tan(angle * Math.PI / 180) * 0.22;
    const plane = [
      worldProject(state, -2.2, -1.2, height - planeSlope * -2.2),
      worldProject(state, 2.2, -1.2, height - planeSlope * 2.2),
      worldProject(state, 2.2, 1.2, height - planeSlope * 2.2),
      worldProject(state, -2.2, 1.2, height - planeSlope * -2.2)
    ];
    drawPolyline(ctx, plane, accent, 2, true, "rgba(56,189,248,.08)");

    const curve = [];
    if (kind === "椭圆") {
      for (let i = 0; i <= 160; i++) {
        const t = i / 160 * Math.PI * 2;
        curve.push(worldProject(state, Math.cos(t) * 0.95, Math.sin(t) * 0.56, height + Math.sin(t) * 0.1));
      }
    } else if (kind === "抛物线") {
      for (let i = -80; i <= 80; i++) {
        const x = i / 28;
        curve.push(worldProject(state, x, x * x * 0.18 - 0.52, height - planeSlope * x));
      }
    } else {
      for (let branch of [-1, 1]) {
        const pts = [];
        for (let i = 0; i <= 90; i++) {
          const u = i / 90 * 2.1 + 0.32;
          pts.push(worldProject(state, branch * (0.55 + u), Math.sinh(u * 0.72) * 0.36, height - planeSlope * branch * u));
        }
        drawPolyline(ctx, pts, "#f8fafc", 4);
      }
    }
    if (kind !== "双曲线") drawPolyline(ctx, curve, "#f8fafc", 4);
    setMetric(state, [
      { label: "截线类型", value: kind },
      { label: "倾角", value: `${angle}°` },
      { label: "离心率趋势", value: kind === "椭圆" ? "e < 1" : kind === "抛物线" ? "e = 1" : "e > 1" }
    ]);
  }

  function drawSpaceVector(state) {
    const ctx = state.ctx;
    background(ctx, state);
    const accent = state.meta.accent;
    const d = state.values.distance;
    const plane = [
      worldProject(state, -1.8, -1.15, 0),
      worldProject(state, 1.8, -1.15, 0),
      worldProject(state, 1.8, 1.15, 0),
      worldProject(state, -1.8, 1.15, 0)
    ];
    drawPolyline(ctx, plane, accent, 2, true, "rgba(34,197,94,.1)");
    for (let i = -2; i <= 2; i++) {
      drawPolyline(ctx, [worldProject(state, -1.8, i * 0.46, 0.01), worldProject(state, 1.8, i * 0.46, 0.01)], "rgba(226,232,240,.2)", 1);
      drawPolyline(ctx, [worldProject(state, i * 0.72, -1.15, 0.01), worldProject(state, i * 0.72, 1.15, 0.01)], "rgba(226,232,240,.2)", 1);
    }
    const o = worldProject(state, 0, 0, 0);
    const p = worldProject(state, 0.6, 0.46, d);
    const foot = worldProject(state, 0.6, 0.46, 0);
    drawArrow(ctx, o, worldProject(state, 0.2, 0.15, 1.35), accent);
    drawArrow(ctx, foot, p, "#fbbf24");
    drawPolyline(ctx, [foot, p], "#fbbf24", 3);
    ctx.fillStyle = "#f8fafc";
    [p, foot, o].forEach((point, index) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, index === 0 ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();
    });
    setMetric(state, [
      { label: "法向量", value: "n" },
      { label: "点面距离", value: format(Math.abs(d), 2) },
      { label: "判定", value: Math.abs(d) < 0.08 ? "点在平面上" : "点在平面外" }
    ]);
  }

  function makeGraph(state, xMin, xMax, yMin, yMax, equalScale = false) {
    const pad = Math.max(38, Math.min(64, state.width * 0.07));
    let left = pad;
    let right = state.width - pad;
    let top = pad;
    let bottom = state.height - pad;
    let xScale = (right - left) / (xMax - xMin);
    let yScale = (bottom - top) / (yMax - yMin);
    if (equalScale) {
      const scale = Math.max(1, Math.min(xScale, yScale));
      const graphW = (xMax - xMin) * scale;
      const graphH = (yMax - yMin) * scale;
      left = (state.width - graphW) / 2;
      right = left + graphW;
      top = (state.height - graphH) / 2;
      bottom = top + graphH;
      xScale = scale;
      yScale = scale;
    }
    const toScreen = (x, y) => ({
      x: left + (x - xMin) * xScale,
      y: bottom - (y - yMin) * yScale
    });
    const fromScreen = (x, y) => ({
      x: xMin + (x - left) / Math.max(1, xScale),
      y: yMin + (bottom - y) / Math.max(1, yScale)
    });
    return { pad, left, right, top, bottom, toScreen, fromScreen, xMin, xMax, yMin, yMax };
  }

  function drawAxes(ctx, graph) {
    ctx.save();
    ctx.strokeStyle = "rgba(148,163,184,.28)";
    ctx.lineWidth = 1;
    for (let x = Math.ceil(graph.xMin); x <= graph.xMax; x++) {
      const a = graph.toScreen(x, graph.yMin);
      const b = graph.toScreen(x, graph.yMax);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    for (let y = Math.ceil(graph.yMin); y <= graph.yMax; y++) {
      const a = graph.toScreen(graph.xMin, y);
      const b = graph.toScreen(graph.xMax, y);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(248,250,252,.75)";
    const xAxisA = graph.toScreen(graph.xMin, 0);
    const xAxisB = graph.toScreen(graph.xMax, 0);
    const yAxisA = graph.toScreen(0, graph.yMin);
    const yAxisB = graph.toScreen(0, graph.yMax);
    ctx.beginPath();
    ctx.moveTo(xAxisA.x, xAxisA.y);
    ctx.lineTo(xAxisB.x, xAxisB.y);
    ctx.moveTo(yAxisA.x, yAxisA.y);
    ctx.lineTo(yAxisB.x, yAxisB.y);
    ctx.stroke();
    ctx.restore();
  }

  function drawParabola(state) {
    const ctx = state.ctx;
    background(ctx, state);
    const p = clamp(state.values.p, 0.45, 2.2);
    const s = clamp(state.values.sampleX, -3.2, 3.2);
    const progress = clamp(state.values.progress ?? 100, 8, 100) / 100;
    const zoom = clamp(state.values.zoom || 58, 42, 76);
    const mode = state.values.mode || "definition";
    const horizontal = state.values.orientation === "horizontal";
    const sampleRange = clamp(260 / zoom, 3.4, 5.6);
    const curveMax = Math.max(4.8, Math.min(7.4, sampleRange * sampleRange / (4 * p) + 0.72));
    const axisMin = -Math.max(1.8, p + 0.82);
    const graph = horizontal
      ? makeGraph(state, axisMin, curveMax, -sampleRange, sampleRange, true)
      : makeGraph(state, -sampleRange, sampleRange, axisMin, curveMax, true);
    drawAxes(ctx, graph);

    ctx.save();
    ctx.font = "900 12px Inter, 'Microsoft YaHei UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const vertex = graph.toScreen(0, 0);
    const mapCurvePoint = value => {
      const curve = value * value / (4 * p);
      return horizontal ? { x: curve, y: value } : { x: value, y: curve };
    };
    const toCurveScreen = value => {
      const world = mapCurvePoint(value);
      return graph.toScreen(world.x, world.y);
    };
    const fullCurve = [];
    for (let i = -260; i <= 260; i++) {
      fullCurve.push(toCurveScreen(i / 260 * sampleRange));
    }
    drawPolyline(ctx, fullCurve, "rgba(251,191,36,.20)", 2);

    const curve = [];
    const visibleSample = sampleRange * progress;
    for (let i = -260; i <= 260; i++) {
      curve.push(toCurveScreen(i / 260 * visibleSample));
    }
    drawPolyline(ctx, curve, state.meta.accent, 4);
    const focusWorld = horizontal ? { x: p, y: 0 } : { x: 0, y: p };
    const focus = graph.toScreen(focusWorld.x, focusWorld.y);
    const directrixA = horizontal ? graph.toScreen(-p, -sampleRange) : graph.toScreen(-sampleRange, -p);
    const directrixB = horizontal ? graph.toScreen(-p, sampleRange) : graph.toScreen(sampleRange, -p);
    drawPolyline(ctx, [directrixA, directrixB], "#fbbf24", 3);
    const pointWorld = mapCurvePoint(s);
    const footWorld = horizontal ? { x: -p, y: pointWorld.y } : { x: pointWorld.x, y: -p };
    const point = graph.toScreen(pointWorld.x, pointWorld.y);
    const foot = graph.toScreen(footWorld.x, footWorld.y);

    if (mode === "definition") {
      const radius = distance2d(point, focus);
      ctx.save();
      ctx.strokeStyle = "rgba(248,250,252,.18)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(focus.x, focus.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.setLineDash([6, 7]);
    drawPolyline(ctx, [point, focus], mode === "definition" ? "rgba(248,250,252,.90)" : "rgba(248,250,252,.45)", 2);
    drawPolyline(ctx, [point, foot], mode === "definition" ? "rgba(251,191,36,.94)" : "rgba(251,191,36,.42)", 2);
    ctx.restore();

    if (horizontal) {
      drawPolyline(ctx, [graph.toScreen(graph.xMin, 0), graph.toScreen(graph.xMax, 0)], "rgba(148,163,184,.36)", 1);
      drawPolyline(ctx, [graph.toScreen(graph.xMin, pointWorld.y), graph.toScreen(graph.xMax, pointWorld.y)], "rgba(248,250,252,.14)", 1);
    } else {
      drawPolyline(ctx, [graph.toScreen(0, graph.yMin), graph.toScreen(0, graph.yMax)], "rgba(148,163,184,.36)", 1);
      drawPolyline(ctx, [graph.toScreen(pointWorld.x, graph.yMin), graph.toScreen(pointWorld.x, graph.yMax)], "rgba(248,250,252,.14)", 1);
    }

    const scanWorld = mapCurvePoint(visibleSample);
    const scanPoint = graph.toScreen(scanWorld.x, scanWorld.y);
    ctx.save();
    ctx.fillStyle = "#fef3c7";
    ctx.strokeStyle = state.meta.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(scanPoint.x, scanPoint.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    const points = [
      { point: focus, label: "F", fill: "#f8fafc", radius: 7 },
      { point, label: "P", fill: state.meta.accent, radius: 8 },
      { point: foot, label: "H", fill: "#fbbf24", radius: 6 },
      { point: vertex, label: "O", fill: "#94a3b8", radius: 5 }
    ];
    points.forEach(item => {
      ctx.fillStyle = item.fill;
      ctx.beginPath();
      ctx.arc(item.point.x, item.point.y, item.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f8fafc";
      ctx.fillText(item.label, item.point.x + 16, item.point.y - 14);
    });

    ctx.fillStyle = "#fbbf24";
    ctx.fillText("准线 l", horizontal ? directrixA.x + 36 : directrixA.x + 54, horizontal ? directrixA.y + 18 : directrixA.y - 14);

    const dist = horizontal ? Math.hypot(pointWorld.x - p, pointWorld.y) : Math.hypot(pointWorld.x, pointWorld.y - p);
    const lineDist = horizontal ? Math.abs(pointWorld.x + p) : Math.abs(pointWorld.y + p);
    const diff = Math.abs(dist - lineDist);
    state.parabolaGeometry = {
      graph,
      focus,
      point,
      foot,
      orientation: horizontal ? "horizontal" : "vertical",
      directrixX: directrixA.x,
      directrixY: directrixA.y,
      sxMin: -3.2,
      sxMax: 3.2,
      pMin: 0.45,
      pMax: 2.2
    };

    setMetric(state, [
      { label: "焦点 F", value: horizontal ? `(${format(p, 2)}, 0)` : `(0, ${format(p, 2)})` },
      { label: "准线", value: horizontal ? `x = -${format(p, 2)}` : `y = -${format(p, 2)}` },
      { label: "差值", value: diff < 0.005 ? "0" : format(diff, 3) }
    ]);
    setReadout(state, [
      { label: "方程", value: horizontal ? `y² = ${format(4 * p, 2)}x` : `x² = ${format(4 * p, 2)}y` },
      { label: "FP", value: format(dist, 3) },
      { label: "PH", value: format(lineDist, 3) },
      { label: "判定", value: mode === "definition" ? "FP = PH" : horizontal ? "y² = 4px" : "x² = 4py" }
    ]);
    ctx.restore();
  }

  function evaluateFunction(state, x) {
    if (state.values.func === "wave") return Math.sin(x * 1.45) + 0.22 * x * x - 0.4;
    return 0.16 * x * x * x - 0.78 * x + 0.34;
  }

  function evaluateDerivative(state, x) {
    if (state.values.func === "wave") return 1.45 * Math.cos(x * 1.45) + 0.44 * x;
    return 0.48 * x * x - 0.78;
  }

  function drawDerivative(state) {
    const ctx = state.ctx;
    background(ctx, state);
    const graph = makeGraph(state, -4, 4, -3.2, 3.2);
    drawAxes(ctx, graph);
    const curve = [];
    for (let i = -280; i <= 280; i++) {
      const x = i / 70;
      curve.push(graph.toScreen(x, evaluateFunction(state, x)));
    }
    drawPolyline(ctx, curve, state.meta.accent, 4);
    const x0 = state.values.x0;
    const y0 = evaluateFunction(state, x0);
    const k = evaluateDerivative(state, x0);
    const xA = -4;
    const xB = 4;
    drawPolyline(ctx, [
      graph.toScreen(xA, y0 + k * (xA - x0)),
      graph.toScreen(xB, y0 + k * (xB - x0))
    ], "#fbbf24", 3);
    const point = graph.toScreen(x0, y0);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
    ctx.fill();
    setMetric(state, [
      { label: "切点", value: `(${format(x0, 2)}, ${format(y0, 2)})` },
      { label: "导数斜率", value: format(k, 2) },
      { label: "局部趋势", value: Math.abs(k) < 0.08 ? "近似极值点" : k > 0 ? "递增" : "递减" }
    ]);
  }

  function riemannFunction(x) {
    return 0.17 * x * x + 0.38 * Math.sin(2.1 * x) + 1.05;
  }

  function drawRiemann(state) {
    const ctx = state.ctx;
    background(ctx, state);
    const a = 0;
    const b = state.values.b;
    const n = Math.round(state.values.n);
    const graph = makeGraph(state, -0.4, 5.6, -0.4, 6.1);
    drawAxes(ctx, graph);
    const dx = (b - a) / n;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const left = a + i * dx;
      const right = left + dx;
      let sample = left + dx / 2;
      if (state.values.method === "left") sample = left;
      if (state.values.method === "right") sample = right;
      if (state.values.method === "upper") sample = Math.max(riemannFunction(left), riemannFunction(right)) === riemannFunction(left) ? left : right;
      const y = riemannFunction(sample);
      sum += y * dx;
      const p0 = graph.toScreen(left, 0);
      const p1 = graph.toScreen(right, y);
      ctx.fillStyle = "rgba(20,184,166,.22)";
      ctx.strokeStyle = "rgba(45,212,191,.68)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(p0.x, p1.y, p1.x - p0.x, p0.y - p1.y);
      ctx.fill();
      ctx.stroke();
    }
    const curve = [];
    for (let i = 0; i <= 260; i++) {
      const x = i / 260 * 5.5;
      curve.push(graph.toScreen(x, riemannFunction(x)));
    }
    drawPolyline(ctx, curve, "#f8fafc", 4);
    setMetric(state, [
      { label: "矩形数 N", value: `${n}` },
      { label: "近似面积", value: format(sum, 3) },
      { label: "Δx", value: format(dx, 3) }
    ]);
  }

  function binomial(n, k, p) {
    let coeff = 1;
    for (let i = 1; i <= k; i++) coeff *= (n - i + 1) / i;
    return coeff * Math.pow(p, k) * Math.pow(1 - p, n - k);
  }

  function drawGalton(state) {
    const ctx = state.ctx;
    background(ctx, state);
    const rows = Math.round(state.values.rows);
    const balls = Math.round(state.values.balls);
    const p = state.values.bias;
    const w = state.width;
    const h = state.height;
    const top = h * 0.18;
    const boardW = Math.min(w * 0.78, h * 0.78);
    const cx = w * 0.52;
    const rowGap = Math.min(32, (h * 0.48) / rows);
    const colGap = Math.min(34, boardW / rows);
    ctx.fillStyle = "rgba(226,232,240,.72)";
    for (let r = 0; r < rows; r++) {
      for (let k = 0; k <= r; k++) {
        const x = cx + (k - r / 2) * colGap;
        const y = top + r * rowGap;
        ctx.beginPath();
        ctx.arc(x, y, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const baseY = top + rows * rowGap + 28;
    const binW = Math.max(10, Math.min(34, boardW / (rows + 1)));
    let maxCount = 1;
    const counts = [];
    for (let k = 0; k <= rows; k++) {
      const count = binomial(rows, k, p) * balls;
      counts.push(count);
      maxCount = Math.max(maxCount, count);
    }
    counts.forEach((count, k) => {
      const barH = count / maxCount * h * 0.25;
      const x = cx + (k - rows / 2) * binW - binW * 0.42;
      ctx.fillStyle = "rgba(249,115,22,.28)";
      ctx.fillRect(x, baseY + h * 0.26 - barH, binW * 0.84, barH);
      ctx.strokeStyle = "rgba(251,146,60,.8)";
      ctx.strokeRect(x, baseY + h * 0.26 - barH, binW * 0.84, barH);
    });
    const mean = rows * p;
    const sigma = Math.sqrt(rows * p * (1 - p));
    const curve = [];
    for (let k = 0; k <= rows * 24; k++) {
      const xVal = k / 24;
      const density = Math.exp(-0.5 * Math.pow((xVal - mean) / sigma, 2));
      const x = cx + (xVal - rows / 2) * binW;
      const y = baseY + h * 0.26 - density * h * 0.25;
      curve.push({ x, y });
    }
    drawPolyline(ctx, curve, "#f8fafc", 3);
    setMetric(state, [
      { label: "期望 μ", value: format(mean, 2) },
      { label: "标准差 σ", value: format(sigma, 2) },
      { label: "样本量", value: `${balls}` }
    ]);
  }

  function renderMandelbrot(state) {
    const ctx = state.ctx;
    background(ctx, state);
    const w = Math.max(120, Math.min(430, Math.round(state.width * 0.58)));
    const h = Math.max(100, Math.min(280, Math.round(state.height * 0.52)));
    const key = `${w}:${h}:${state.values.zoom}:${state.values.iterations}:${state.values.centerY}`;
    if (state.fractalKey !== key) {
      const offscreen = document.createElement("canvas");
      offscreen.width = w;
      offscreen.height = h;
      const off = offscreen.getContext("2d");
      const image = off.createImageData(w, h);
      const zoom = state.values.zoom;
      const maxIter = Math.round(state.values.iterations);
      const centerX = -0.74;
      const centerY = state.values.centerY;
      const scale = 3.2 / zoom;
      for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
          const x0 = centerX + (px / w - 0.5) * scale * (w / h);
          const y0 = centerY + (py / h - 0.5) * scale;
          let x = 0;
          let y = 0;
          let iter = 0;
          while (x * x + y * y <= 4 && iter < maxIter) {
            const xt = x * x - y * y + x0;
            y = 2 * x * y + y0;
            x = xt;
            iter++;
          }
          const index = (py * w + px) * 4;
          const t = iter / maxIter;
          image.data[index] = iter === maxIter ? 4 : Math.round(236 * t + 30);
          image.data[index + 1] = iter === maxIter ? 10 : Math.round(72 + 110 * Math.sin(t * Math.PI));
          image.data[index + 2] = iter === maxIter ? 24 : Math.round(160 + 80 * t);
          image.data[index + 3] = 255;
        }
      }
      off.putImageData(image, 0, 0);
      state.fractalCanvas = offscreen;
      state.fractalKey = key;
    }
    const drawW = Math.min(state.width * 0.82, state.height * 1.32);
    const drawH = drawW * (h / w);
    const x = (state.width - drawW) / 2;
    const y = (state.height - drawH) / 2 + state.height * 0.04;
    ctx.save();
    ctx.shadowColor = state.meta.accent;
    ctx.shadowBlur = 30;
    ctx.drawImage(state.fractalCanvas, x, y, drawW, drawH);
    ctx.restore();
    ctx.strokeStyle = "rgba(248,250,252,.72)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, drawW, drawH);
    setMetric(state, [
      { label: "放大倍率", value: `${format(state.values.zoom, 1)}x` },
      { label: "迭代次数", value: `${Math.round(state.values.iterations)}` },
      { label: "中心点", value: `-0.74 ${state.values.centerY >= 0 ? "+" : "-"} ${format(Math.abs(state.values.centerY), 2)}i` }
    ]);
  }

  function draw(state) {
    if (state.disposed || !state.ctx) return;
    const type = state.meta.type;
    if (type === "conic-section") drawConic(state);
    else if (type === "space-vector") drawSpaceVector(state);
    else if (type === "parabola-focus") drawParabola(state);
    else if (type === "derivative-tangent") drawDerivative(state);
    else if (type === "riemann-sum") drawRiemann(state);
    else if (type === "galton-board") drawGalton(state);
    else renderMandelbrot(state);
  }

  function pointerPoint(state, event) {
    const rect = state.canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  function distance2d(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function hitParabolaHandle(state, screenPoint) {
    const geometry = state.parabolaGeometry;
    if (!geometry) return "";
    const threshold = Math.max(28, Math.min(46, Math.min(state.width, state.height) * 0.075));
    if (distance2d(screenPoint, geometry.point) <= threshold) return "point";
    if (distance2d(screenPoint, geometry.focus) <= threshold) return "focus";
    if (geometry.orientation === "horizontal") {
      if (Math.abs(screenPoint.x - geometry.directrixX) <= threshold && screenPoint.y >= geometry.graph.top && screenPoint.y <= geometry.graph.bottom) return "directrix";
    } else if (Math.abs(screenPoint.y - geometry.directrixY) <= threshold && screenPoint.x >= geometry.graph.left && screenPoint.x <= geometry.graph.right) {
      return "directrix";
    }
    return "";
  }

  function applyParabolaDrag(state, handle, screenPoint) {
    const geometry = state.parabolaGeometry;
    if (!geometry) return;
    const world = geometry.graph.fromScreen(screenPoint.x, screenPoint.y);
    if (handle === "point") {
      const nextSample = clamp(geometry.orientation === "horizontal" ? world.y : world.x, geometry.sxMin, geometry.sxMax);
      setControlValue(state, "sampleX", Number(nextSample.toFixed(2)));
    } else if (handle === "focus") {
      const nextP = clamp(geometry.orientation === "horizontal" ? world.x : world.y, geometry.pMin, geometry.pMax);
      setControlValue(state, "p", Number(nextP.toFixed(2)));
    } else if (handle === "directrix") {
      const nextP = clamp(geometry.orientation === "horizontal" ? -world.x : -world.y, geometry.pMin, geometry.pMax);
      setControlValue(state, "p", Number(nextP.toFixed(2)));
    }
  }

  function installSceneInteractions(state) {
    if (state.meta.type !== "parabola-focus") return;
    const target = state.canvas;
    listen(state, target, "pointerdown", event => {
      const screenPoint = pointerPoint(state, event);
      const handle = hitParabolaHandle(state, screenPoint);
      if (!handle) return;
      state.dragHandle = handle;
      state.sceneRoot.classList.add("dragging");
      target.setPointerCapture?.(event.pointerId);
      event.preventDefault();
      applyParabolaDrag(state, handle, screenPoint);
    });
    listen(state, target, "pointermove", event => {
      if (!state.dragHandle) return;
      event.preventDefault();
      applyParabolaDrag(state, state.dragHandle, pointerPoint(state, event));
    });
    const endDrag = event => {
      if (!state.dragHandle) return;
      state.dragHandle = "";
      state.sceneRoot.classList.remove("dragging");
      target.releasePointerCapture?.(event.pointerId);
      event.preventDefault();
    };
    listen(state, target, "pointerup", endDrag);
    listen(state, target, "pointercancel", endDrag);
    listen(state, target, "lostpointercapture", () => {
      state.dragHandle = "";
      state.sceneRoot.classList.remove("dragging");
    });
  }

  function mount(container, context, cardId) {
    cleanup(mounts.get(container));
    ensureStyle();
    container.innerHTML = "";
    const panelHost = context?.externalPanel && context.externalPanel.nodeType === 1 ? context.externalPanel : null;
    if (panelHost) panelHost.innerHTML = "";

    const card = context?.card || {};
    const meta = getLabMeta(cardId, context);
    const state = {
      disposed: false,
      listeners: [],
      values: {},
      width: 1,
      height: 1,
      phase: 0,
      cardId,
      meta
    };

    const sceneRoot = createElement("div", "math-senior-lab");
    sceneRoot.style.setProperty("--lab-accent", meta.accent || "#38bdf8");
    sceneRoot.dataset.cardId = cardId;
    const canvas = createElement("canvas");
    sceneRoot.appendChild(canvas);

    const overlay = createElement("div", "math-senior-lab-overlay");
    overlay.appendChild(createElement("div", "math-senior-lab-kicker", meta.formula || "数学可视化实验"));
    const title = createElement("div", "math-senior-lab-title");
    title.appendChild(createElement("h2", "", card.title || meta.title || "数学可视化实验"));
    title.appendChild(createElement("p", "", card.detail || meta.summary || "拖动右侧参数，观察图像和指标同步变化。"));
    overlay.appendChild(title);
    const metricRoot = createElement("div", "math-senior-lab-metrics");
    overlay.appendChild(metricRoot);
    sceneRoot.appendChild(overlay);

    container.appendChild(sceneRoot);
    state.sceneRoot = sceneRoot;
    state.canvas = canvas;
    state.ctx = canvas.getContext("2d");
    state.metricRoot = metricRoot;

    const panelRoot = createElement("div", "math-senior-lab-panel");
    panelRoot.style.setProperty("--lab-accent", meta.accent || "#38bdf8");
    if (panelHost) {
      panelHost.appendChild(panelRoot);
    } else {
      panelRoot.style.cssText += ";position:absolute;right:12px;top:12px;width:min(320px,calc(100% - 24px));height:calc(100% - 24px);background:rgba(2,6,23,.72);border-radius:18px;border:1px solid rgba(148,163,184,.18);";
      sceneRoot.appendChild(panelRoot);
    }
    state.panelRoot = panelRoot;
    buildPanel(state, card);
    installSceneInteractions(state);

    listen(state, window, "resize", () => resizeCanvas(state));
    if (typeof ResizeObserver !== "undefined") {
      state.resizeObserver = new ResizeObserver(() => resizeCanvas(state));
      state.resizeObserver.observe(sceneRoot);
    }
    resizeCanvas(state);
    mounts.set(container, state);
  }

  CARD_IDS.forEach(cardId => {
    window.MATH_VISUAL_SCENES[cardId] = {
      mount(container, context) {
        mount(container, context, cardId);
      },
      unmount(container) {
        cleanup(mounts.get(container));
        mounts.delete(container);
        container.innerHTML = "";
      }
    };
  });
})();
