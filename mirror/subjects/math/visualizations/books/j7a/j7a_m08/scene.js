window.MATH_VISUAL_SCENES = window.MATH_VISUAL_SCENES || {};

(function () {
  const CARD_ID = "j7a_m08";
  const STYLE_ID = "segment-midpoint-lab-style";

  const SCENES = {
    "sum-diff": {
      label: "线段和差",
      badge: "和差关系",
      detail: "拖动点 C，观察 AB = AC + CB，以及 AC = AB - CB。",
      formula: "AB = AC + CB",
      focus: "C 在线段 AB 上时，总长等于两部分之和。"
    },
    midpoint: {
      label: "中点等分",
      badge: "中点性质",
      detail: "点 M 是 AB 的中点，AM 与 MB 始终相等。",
      formula: "AM = MB = 1/2 AB",
      focus: "中点把一条线段分成两条相等线段。"
    },
    "dual-midpoint": {
      label: "双中点探究",
      badge: "恒定模型",
      detail: "拖动点 C，观察 AC、CB 变化时，MN 始终等于 1/2 AB。",
      formula: "MN = 1/2 AB",
      focus: "M、N 分别是 AC、CB 的中点，则 MN = 1/2 AB。"
    }
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .sml-scene,
      .sml-scene *,
      .sml-panel,
      .sml-panel * {
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -webkit-user-drag: none;
        user-select: none;
      }

      .sml-scene {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 0;
        overflow: hidden;
        color: #f8fafc;
        font-family: Inter, "Noto Sans SC", "Microsoft YaHei UI", "Microsoft YaHei", sans-serif;
        background:
          radial-gradient(circle at 14% 18%, rgba(59,130,246,0.18), transparent 30%),
          radial-gradient(circle at 82% 20%, rgba(16,185,129,0.16), transparent 32%),
          radial-gradient(circle at 62% 86%, rgba(245,158,11,0.14), transparent 34%),
          linear-gradient(145deg, #020617 0%, #0b1220 54%, #020617 100%);
        touch-action: none;
      }

      .sml-board {
        position: absolute;
        inset: 14px;
        display: grid;
        grid-template-rows: minmax(0, 1fr) auto;
        gap: 10px;
      }

      .sml-sandbox {
        position: relative;
        min-height: 0;
        overflow: hidden;
        border: 1px solid rgba(148,163,184,0.2);
        border-radius: 8px;
        background:
          linear-gradient(rgba(148,163,184,0.12) 1px, transparent 1px),
          linear-gradient(90deg, rgba(148,163,184,0.12) 1px, transparent 1px),
          radial-gradient(circle at 26% 20%, rgba(59,130,246,0.1), transparent 32%),
          linear-gradient(180deg, #f8fafc, #eef4ff);
        background-size: 42px 42px, 42px 42px, 100% 100%, 100% 100%;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.86), 0 22px 60px rgba(2,6,23,0.28);
        touch-action: none;
      }

      .sml-status {
        position: absolute;
        left: 12px;
        top: 12px;
        z-index: 10;
        display: flex;
        flex-wrap: wrap;
        max-width: calc(100% - 24px);
        gap: 7px;
        pointer-events: none;
      }

      .sml-chip {
        min-width: 0;
        max-width: 100%;
        border: 1px solid rgba(148,163,184,0.22);
        border-radius: 8px;
        background: rgba(255,255,255,0.78);
        color: rgba(15,23,42,0.74);
        backdrop-filter: blur(12px);
        padding: 6px 9px;
        font-size: 11px;
        line-height: 1.2;
        font-weight: 950;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .sml-chip strong {
        color: #0f172a;
      }

      .sml-stage {
        position: absolute;
        inset: 0;
        touch-action: none;
        cursor: grab;
      }

      .sml-stage.is-panning {
        cursor: grabbing;
      }

      .sml-world {
        position: absolute;
        inset: 0;
        transform: translate(var(--pan-x, 0px), var(--pan-y, 0px)) scale(var(--zoom, 1));
        transform-origin: center center;
        transition: transform 0.16s ease;
        will-change: transform;
      }

      .sml-world.is-manipulating {
        transition: none;
      }

      .sml-svg,
      .sml-overlay,
      .sml-particles {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
      }

      .sml-svg {
        overflow: visible;
      }

      .sml-overlay,
      .sml-particles {
        pointer-events: none;
      }

      .sml-axis {
        stroke: rgba(100,116,139,0.42);
        stroke-width: 3;
        stroke-linecap: round;
      }

      .sml-segment {
        stroke-width: 7;
        stroke-linecap: round;
        filter: drop-shadow(0 4px 8px rgba(15,23,42,0.12));
        transition: opacity 0.22s ease, stroke-width 0.22s ease, transform 0.28s ease;
      }

      .sml-segment.ab { stroke: #4f46e5; }
      .sml-segment.ac { stroke: #2563eb; }
      .sml-segment.bc { stroke: #10b981; }
      .sml-segment.mn { stroke: #f59e0b; stroke-width: 9; filter: drop-shadow(0 0 9px rgba(245,158,11,0.42)); }
      .sml-segment.base { stroke: rgba(100,116,139,0.32); stroke-width: 4; }
      .sml-segment.ghost { opacity: 0.34; stroke-dasharray: 10 8; }
      .sml-segment.result { stroke-width: 12; filter: drop-shadow(0 0 12px rgba(79,70,229,0.45)); }
      .sml-segment.result-ac { stroke-width: 12; filter: drop-shadow(0 0 12px rgba(37,99,235,0.45)); }

      .sml-brace {
        fill: none;
        stroke-width: 2.6;
        stroke-linecap: round;
        filter: drop-shadow(0 2px 3px rgba(15,23,42,0.08));
      }

      .sml-brace.ab { stroke: #4f46e5; }
      .sml-brace.ac { stroke: #2563eb; }
      .sml-brace.bc { stroke: #10b981; }
      .sml-brace.part { stroke: rgba(71,85,105,0.7); }
      .sml-brace.mn { stroke: #f59e0b; stroke-width: 3.8; }

      .sml-point-hit {
        fill: transparent;
        pointer-events: all;
        cursor: grab;
        touch-action: none;
      }

      .sml-point-wrap.is-draggable,
      .sml-point-wrap.is-draggable * {
        touch-action: none;
        -webkit-user-select: none;
        user-select: none;
      }

      .sml-point-wrap.is-dragging .sml-point-hit {
        cursor: grabbing;
      }

      .sml-point-halo {
        fill: #dbeafe;
        opacity: 0.55;
      }

      .sml-point {
        fill: #ffffff;
        stroke: #0f172a;
        stroke-width: 3;
      }

      .sml-point-wrap.is-draggable .sml-point {
        fill: #4f46e5;
        stroke: #ffffff;
        stroke-width: 2.5;
        filter: drop-shadow(0 5px 12px rgba(79,70,229,0.32));
      }

      .sml-point-label {
        fill: #0f172a;
        font-family: "JetBrains Mono", Consolas, "Microsoft YaHei UI", sans-serif;
        font-size: 17px;
        font-weight: 950;
        text-anchor: middle;
        pointer-events: none;
      }

      .sml-point-wrap.is-draggable .sml-point-label {
        fill: #3730a3;
      }

      .sml-float-label {
        position: absolute;
        transform: translate(-50%, -50%);
        max-width: 140px;
        border: 1px solid rgba(148,163,184,0.28);
        border-radius: 8px;
        background: rgba(255,255,255,0.88);
        color: #0f172a;
        box-shadow: 0 10px 22px rgba(15,23,42,0.1);
        padding: 4px 8px;
        font-family: "JetBrains Mono", Consolas, "Microsoft YaHei UI", sans-serif;
        font-size: 12px;
        line-height: 1.15;
        font-weight: 950;
        white-space: nowrap;
      }

      .sml-float-label.ab { color: #4f46e5; }
      .sml-float-label.ac { color: #2563eb; }
      .sml-float-label.bc { color: #047857; }
      .sml-float-label.mn { color: #b45309; border-color: rgba(245,158,11,0.36); }
      .sml-float-label.part { color: #475569; }

      .sml-demo-mark {
        position: absolute;
        z-index: 15;
        transform: translate(-50%, -50%);
        border: 1px solid rgba(15,23,42,0.1);
        border-radius: 999px;
        background: rgba(255,255,255,0.92);
        color: #0f172a;
        box-shadow: 0 18px 40px rgba(15,23,42,0.14);
        padding: 8px 12px;
        font-size: 13px;
        line-height: 1;
        font-weight: 950;
        animation: smlPop 0.86s ease forwards;
      }

      .sml-formulas {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 8px;
        min-height: 108px;
      }

      .sml-formula-card {
        min-width: 0;
        border: 1px solid rgba(148,163,184,0.16);
        border-radius: 8px;
        background: rgba(15,23,42,0.68);
        padding: 10px 12px;
        display: grid;
        gap: 6px;
      }

      .sml-formula-card.is-main {
        border-color: rgba(245,158,11,0.3);
        background: linear-gradient(135deg, rgba(245,158,11,0.12), rgba(15,23,42,0.7));
      }

      .sml-formula-label {
        color: rgba(203,213,225,0.68);
        font-size: 11px;
        line-height: 1.2;
        font-weight: 950;
      }

      .sml-formula-value {
        color: #f8fafc;
        font-family: "JetBrains Mono", Consolas, "Microsoft YaHei UI", monospace;
        font-size: clamp(17px, 2.35vw, 25px);
        line-height: 1.28;
        font-weight: 950;
        overflow-wrap: anywhere;
      }

      .sml-formula-note {
        color: rgba(226,232,240,0.76);
        font-size: 12px;
        line-height: 1.45;
        font-weight: 780;
      }

      .sml-panel {
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
        font-family: Inter, "Noto Sans SC", "Microsoft YaHei UI", "Microsoft YaHei", sans-serif;
        touch-action: pan-y;
      }

      .sml-panel::-webkit-scrollbar {
        width: 0;
        height: 0;
      }

      .sml-panel-card {
        min-width: 0;
        border: 1px solid rgba(148,163,184,0.16);
        border-radius: 8px;
        background: rgba(15,23,42,0.64);
        padding: 8px;
      }

      .sml-panel-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 7px;
        color: rgba(226,232,240,0.7);
        font-size: 11px;
        line-height: 1.2;
        font-weight: 950;
      }

      .sml-panel-head span:last-child {
        min-width: 0;
        color: rgba(125,211,252,0.88);
        font-family: "JetBrains Mono", Consolas, monospace;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .sml-scene-tabs {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 7px;
      }

      .sml-tab,
      .sml-button {
        min-width: 0;
        min-height: 34px;
        border: 1px solid rgba(148,163,184,0.18);
        border-radius: 8px;
        background: rgba(2,6,23,0.36);
        color: rgba(226,232,240,0.78);
        font-size: 11px;
        line-height: 1.18;
        font-weight: 950;
        text-align: center;
        padding: 7px 8px;
        cursor: pointer;
        touch-action: manipulation;
      }

      .sml-tab.is-active {
        border-color: rgba(250,204,21,0.42);
        background: rgba(250,204,21,0.12);
        color: #fef3c7;
      }

      .sml-button:hover,
      .sml-tab:hover {
        border-color: rgba(125,211,252,0.5);
        color: #e0f2fe;
      }

      .sml-button:active,
      .sml-tab:active {
        transform: scale(0.98);
      }

      .sml-button:disabled,
      .sml-tab:disabled,
      .sml-range:disabled {
        cursor: default;
        opacity: 0.52;
      }

      .sml-button.primary {
        border-color: rgba(250,204,21,0.42);
        background: rgba(250,204,21,0.12);
        color: #fef3c7;
      }

      .sml-button.success {
        border-color: rgba(52,211,153,0.42);
        background: rgba(16,185,129,0.12);
        color: #d1fae5;
      }

      .sml-button.is-hidden {
        display: none;
      }

      .sml-action-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }

      .sml-slider-row {
        display: grid;
        grid-template-columns: 74px minmax(0, 1fr) 42px;
        gap: 8px;
        align-items: center;
        min-height: 34px;
      }

      .sml-slider-row.is-hidden {
        display: none;
      }

      .sml-slider-label,
      .sml-slider-value {
        color: rgba(226,232,240,0.74);
        font-size: 11px;
        line-height: 1.2;
        font-weight: 900;
      }

      .sml-slider-value {
        color: #fef3c7;
        font-family: "JetBrains Mono", Consolas, monospace;
        text-align: right;
      }

      .sml-range {
        min-width: 0;
        width: 100%;
        accent-color: #facc15;
        touch-action: manipulation;
      }

      .sml-value-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 6px;
      }

      .sml-value-cell {
        min-width: 0;
        border: 1px solid rgba(148,163,184,0.12);
        border-radius: 8px;
        background: rgba(2,6,23,0.25);
        padding: 7px;
        display: grid;
        gap: 3px;
      }

      .sml-value-cell span:first-child {
        color: rgba(203,213,225,0.62);
        font-size: 10px;
        line-height: 1.1;
        font-weight: 950;
      }

      .sml-value-cell span:last-child {
        color: #ffffff;
        font-family: "JetBrains Mono", Consolas, monospace;
        font-size: 13px;
        line-height: 1.12;
        font-weight: 950;
      }

      .sml-note {
        color: rgba(203,213,225,0.78);
        font-size: 12px;
        line-height: 1.45;
        font-weight: 760;
      }

      .sml-progress {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 5px;
        margin-bottom: 8px;
      }

      .sml-progress-step {
        min-width: 0;
        border: 1px solid rgba(148,163,184,0.14);
        border-radius: 8px;
        background: rgba(2,6,23,0.24);
        color: rgba(203,213,225,0.62);
        padding: 5px 4px;
        text-align: center;
        font-size: 10px;
        line-height: 1.12;
        font-weight: 950;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .sml-progress-step.is-active {
        border-color: rgba(250,204,21,0.44);
        background: rgba(250,204,21,0.1);
        color: #fef3c7;
      }

      .sml-progress-step.is-done {
        border-color: rgba(52,211,153,0.34);
        background: rgba(16,185,129,0.1);
        color: #d1fae5;
      }

      .sml-rule {
        margin-top: 7px;
        border-radius: 8px;
        border: 1px solid rgba(148,163,184,0.12);
        background: rgba(2,6,23,0.22);
        color: rgba(226,232,240,0.76);
        padding: 7px;
        font-size: 11px;
        line-height: 1.36;
        font-weight: 850;
      }

      .sml-constant-lock {
        position: absolute;
        z-index: 12;
        transform: translate(-50%, -50%);
        display: inline-flex;
        align-items: center;
        gap: 5px;
        border: 1px solid rgba(245,158,11,0.38);
        border-radius: 999px;
        background: rgba(255,251,235,0.9);
        color: #92400e;
        box-shadow: 0 10px 26px rgba(146,64,14,0.16);
        padding: 6px 9px;
        font-size: 11px;
        line-height: 1;
        font-weight: 950;
        white-space: nowrap;
      }

      .sml-panel[data-size="compact"] {
        gap: 7px;
        padding: 8px;
      }

      .sml-panel[data-size="compact"] .sml-panel-card {
        padding: 7px;
      }

      .sml-panel[data-size="compact"] .sml-button,
      .sml-panel[data-size="compact"] .sml-tab {
        min-height: 31px;
        font-size: 10px;
        padding: 6px;
      }

      .sml-panel[data-size="micro"] {
        gap: 6px;
        padding: 7px;
      }

      .sml-panel[data-size="micro"] .sml-panel-card {
        padding: 6px;
      }

      .sml-panel[data-size="micro"] .sml-button,
      .sml-panel[data-size="micro"] .sml-tab {
        min-height: 28px;
        font-size: 9px;
        padding: 5px;
      }

      .sml-panel[data-size="micro"] .sml-scene-tabs {
        grid-template-columns: 1fr;
      }

      .sml-panel[data-size="micro"] .sml-value-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .sml-panel[data-size="micro"] .sml-progress {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .sml-panel[data-size="micro"] .sml-note,
      .sml-panel[data-size="micro"] .sml-rule,
      .sml-panel[data-size="micro"] .sml-slider-label,
      .sml-panel[data-size="micro"] .sml-slider-value {
        font-size: 10px;
      }

      @media (max-width: 720px), (max-height: 560px) {
        .sml-board {
          inset: 10px;
          gap: 8px;
        }

        .sml-status {
          left: 10px;
          top: 10px;
        }

        .sml-chip {
          padding: 5px 7px;
          font-size: 10px;
        }

        .sml-formulas {
          grid-template-columns: 1fr;
          min-height: 0;
        }

        .sml-formula-card {
          padding: 8px;
        }

        .sml-formula-card:first-child {
          display: none;
        }

        .sml-float-label {
          font-size: 10px;
          padding: 3px 6px;
        }
      }

      @keyframes smlPop {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.72); }
        22% { opacity: 1; transform: translate(-50%, -50%) scale(1.06); }
        100% { opacity: 0; transform: translate(-50%, -78%) scale(0.94); }
      }
    `;
    document.head.appendChild(style);
  }

  function blockNativeMenus(target, cleanups) {
    if (!target) return;
    const events = ["contextmenu", "selectstart", "dragstart", "copy", "cut", "paste"];
    events.forEach(type => {
      const handler = event => {
        if (event.target?.matches?.("input, button")) return;
        event.preventDefault();
      };
      target.addEventListener(type, handler);
      cleanups.push(() => target.removeEventListener(type, handler));
    });
  }

  function fitPanel(panel) {
    if (!panel) return;
    const height = panel.getBoundingClientRect().height || 0;
    let size = height < 500 ? "micro" : height < 650 ? "compact" : "normal";
    panel.dataset.size = size;
    if (panel.scrollHeight > panel.clientHeight + 1 && size === "normal") {
      panel.dataset.size = "compact";
      size = "compact";
    }
    if (panel.scrollHeight > panel.clientHeight + 1 && size !== "micro") {
      panel.dataset.size = "micro";
    }
  }

  function buildScene(container) {
    const scene = document.createElement("div");
    scene.className = "sml-scene";
    scene.innerHTML = `
      <div class="sml-board">
        <section class="sml-sandbox" aria-label="线段中点与线段和差模拟区">
          <div class="sml-status">
            <div class="sml-chip">场景 <strong data-scene-status></strong></div>
            <div class="sml-chip">AB <strong data-ab-status></strong></div>
            <div class="sml-chip">C <strong data-c-status></strong></div>
          </div>
          <div class="sml-stage" data-stage>
            <div class="sml-world" data-world>
              <svg class="sml-svg" data-svg aria-hidden="true"></svg>
              <div class="sml-overlay" data-overlay></div>
            </div>
          </div>
          <div class="sml-particles" data-particles></div>
        </section>
        <section class="sml-formulas" aria-label="几何算式">
          <div class="sml-formula-card">
            <div class="sml-formula-label">当前关系</div>
            <div class="sml-formula-value" data-relation>AB = AC + CB</div>
            <div class="sml-formula-note" data-values-note>拖动点 C 改变两段长度。</div>
          </div>
          <div class="sml-formula-card is-main">
            <div class="sml-formula-label">结论板书</div>
            <div class="sml-formula-value" data-proof>12.0 = 4.0 + 8.0</div>
            <div class="sml-formula-note" data-proof-note>线段和差来自同一直线上的拼接与裁切。</div>
          </div>
        </section>
      </div>
    `;
    container.appendChild(scene);
    return scene;
  }

  function buildPanel(panelHost) {
    if (!panelHost) return null;
    panelHost.innerHTML = "";
    const panel = document.createElement("div");
    panel.className = "sml-panel";
    const tabs = Object.entries(SCENES).map(([id, item]) => `
      <button class="sml-tab" type="button" data-scene="${id}">${escapeHtml(item.label)}</button>
    `).join("");
    panel.innerHTML = `
      <div class="sml-panel-card">
        <div class="sml-panel-head"><span>教学场景</span><span data-panel-badge>和差关系</span></div>
        <div class="sml-scene-tabs">${tabs}</div>
      </div>
      <div class="sml-panel-card">
        <div class="sml-panel-head"><span>教学演示</span><span data-action-badge>可播放</span></div>
        <div class="sml-action-grid">
          <button class="sml-button primary" type="button" data-step>下一步讲解</button>
          <button class="sml-button primary" type="button" data-demo="sum">求和演示</button>
          <button class="sml-button primary" type="button" data-demo="diff">求差演示</button>
          <button class="sml-button success" type="button" data-demo="mid">对折演示</button>
          <button class="sml-button" type="button" data-reset>重置</button>
          <button class="sml-button" type="button" data-view-reset>回正视图</button>
        </div>
      </div>
      <div class="sml-panel-card">
        <div class="sml-panel-head"><span>长度调节</span><span data-length-badge>单位长度</span></div>
        <div class="sml-slider-row">
          <span class="sml-slider-label">AB 长度</span>
          <input class="sml-range" type="range" min="6" max="18" step="0.5" value="12" data-ab-range>
          <span class="sml-slider-value" data-ab-value>12.0</span>
        </div>
        <div class="sml-slider-row" data-c-row>
          <span class="sml-slider-label">点 C 位置</span>
          <input class="sml-range" type="range" min="0.5" max="11.5" step="0.5" value="4" data-c-range>
          <span class="sml-slider-value" data-c-value>4.0</span>
        </div>
      </div>
      <div class="sml-panel-card">
        <div class="sml-panel-head"><span>实时读数</span><span data-values-badge>单位</span></div>
        <div class="sml-value-grid">
          <div class="sml-value-cell"><span>AC</span><span data-val-ac>4.0</span></div>
          <div class="sml-value-cell"><span>CB</span><span data-val-cb>8.0</span></div>
          <div class="sml-value-cell"><span>AM</span><span data-val-am>2.0</span></div>
          <div class="sml-value-cell"><span>MB</span><span data-val-mb>6.0</span></div>
          <div class="sml-value-cell"><span>MN</span><span data-val-mn>6.0</span></div>
          <div class="sml-value-cell"><span>1/2 AB</span><span data-val-half>6.0</span></div>
        </div>
      </div>
      <div class="sml-panel-card">
        <div class="sml-panel-head"><span>讲解提示</span><span data-tip-badge>当前结论</span></div>
        <div class="sml-progress" data-progress>
          <span class="sml-progress-step" data-step-indicator="0">观察</span>
          <span class="sml-progress-step" data-step-indicator="1">标关系</span>
          <span class="sml-progress-step" data-step-indicator="2">代入</span>
          <span class="sml-progress-step" data-step-indicator="3">结论</span>
        </div>
        <div class="sml-note" data-note>拖动点 C，观察线段和差关系。</div>
        <div class="sml-rule" data-rule>AB = AC + CB</div>
      </div>
    `;
    panelHost.appendChild(panel);
    return panel;
  }

  function mount(container, context = {}) {
    ensureStyle();
    const cleanups = [];
    const timers = [];
    const panelHost = context.externalPanel || null;
    container.innerHTML = "";
    if (panelHost) panelHost.innerHTML = "";
    container.style.overflow = "hidden";

    const scene = buildScene(container);
    const panel = buildPanel(panelHost);

    const state = {
      disposed: false,
      sceneId: "sum-diff",
      ab: 12,
      c: 4,
      animating: false,
      demo: "",
      message: "",
      teachStep: 0,
      focusKey: "",
      pointer: {
        mode: null,
        id: null,
        startX: 0,
        startY: 0,
        lastX: 0,
        lastY: 0,
        dragC: false
      },
      view: { x: 0, y: 0, zoom: 1 },
      pinch: {
        startDistance: 1,
        startZoom: 1,
        startCenterX: 0,
        startCenterY: 0,
        startViewX: 0,
        startViewY: 0
      },
      isTouchDevice: Boolean(window.matchMedia?.("(pointer: coarse)")?.matches || navigator.maxTouchPoints > 0)
    };

    const refs = {
      scene,
      panel,
      sandbox: scene.querySelector(".sml-sandbox"),
      stage: scene.querySelector("[data-stage]"),
      world: scene.querySelector("[data-world]"),
      svg: scene.querySelector("[data-svg]"),
      overlay: scene.querySelector("[data-overlay]"),
      particles: scene.querySelector("[data-particles]"),
      sceneStatus: scene.querySelector("[data-scene-status]"),
      abStatus: scene.querySelector("[data-ab-status]"),
      cStatus: scene.querySelector("[data-c-status]"),
      relation: scene.querySelector("[data-relation]"),
      proof: scene.querySelector("[data-proof]"),
      valuesNote: scene.querySelector("[data-values-note]"),
      proofNote: scene.querySelector("[data-proof-note]"),
      tabs: panel ? [...panel.querySelectorAll("[data-scene]")] : [],
      panelBadge: panel?.querySelector("[data-panel-badge]"),
      actionBadge: panel?.querySelector("[data-action-badge]"),
      abRange: panel?.querySelector("[data-ab-range]"),
      cRange: panel?.querySelector("[data-c-range]"),
      cRow: panel?.querySelector("[data-c-row]"),
      abValue: panel?.querySelector("[data-ab-value]"),
      cValue: panel?.querySelector("[data-c-value]"),
      note: panel?.querySelector("[data-note]"),
      rule: panel?.querySelector("[data-rule]"),
      demoButtons: panel ? [...panel.querySelectorAll("[data-demo]")] : [],
      actionButtons: panel ? [...panel.querySelectorAll(".sml-action-grid button")] : [],
      stepButton: panel?.querySelector("[data-step]"),
      progressSteps: panel ? [...panel.querySelectorAll("[data-step-indicator]")] : [],
      valAc: panel?.querySelector("[data-val-ac]"),
      valCb: panel?.querySelector("[data-val-cb]"),
      valAm: panel?.querySelector("[data-val-am]"),
      valMb: panel?.querySelector("[data-val-mb]"),
      valMn: panel?.querySelector("[data-val-mn]"),
      valHalf: panel?.querySelector("[data-val-half]"),
      valueCells: panel ? [...panel.querySelectorAll(".sml-value-cell")] : []
    };

    [container, scene, refs.sandbox, panel, panelHost].forEach(target => blockNativeMenus(target, cleanups));
    panel?.querySelectorAll("button, div, span").forEach(node => node.setAttribute("draggable", "false"));
    scene.querySelectorAll("div, span, svg").forEach(node => node.setAttribute("draggable", "false"));

    function addCleanup(target, type, handler, options) {
      target.addEventListener(type, handler, options);
      cleanups.push(() => target.removeEventListener(type, handler, options));
    }

    function setTimer(fn, delay) {
      const timer = window.setTimeout(fn, delay);
      timers.push(timer);
      return timer;
    }

    function clearTimers() {
      timers.splice(0).forEach(timer => window.clearTimeout(timer));
    }

    function values() {
      const ac = state.c;
      const cb = state.ab - state.c;
      const half = state.ab / 2;
      const midpointM = state.sceneId === "midpoint" ? half : ac / 2;
      const mb = state.sceneId === "midpoint" ? half : cb / 2;
      const mn = state.sceneId === "dual-midpoint" ? half : Math.abs(half - midpointM);
      return {
        ac,
        cb,
        half,
        am: state.sceneId === "midpoint" ? half : ac / 2,
        mb,
        mc: ac / 2,
        cn: cb / 2,
        nb: cb / 2,
        mn
      };
    }

    function fmt(value) {
      return Number(value).toFixed(1);
    }

    function currentScene() {
      return SCENES[state.sceneId] || SCENES["sum-diff"];
    }

    function applyView() {
      refs.world.style.setProperty("--pan-x", `${state.view.x}px`);
      refs.world.style.setProperty("--pan-y", `${state.view.y}px`);
      refs.world.style.setProperty("--zoom", String(state.view.zoom));
    }

    function resetView() {
      state.view.x = 0;
      state.view.y = 0;
      state.view.zoom = 1;
      applyView();
    }

    function worldPoint(clientX, clientY) {
      const rect = refs.sandbox.getBoundingClientRect();
      return {
        x: (clientX - rect.left - rect.width / 2 - state.view.x) / state.view.zoom + rect.width / 2,
        y: (clientY - rect.top - rect.height / 2 - state.view.y) / state.view.zoom + rect.height / 2
      };
    }

    function geometry() {
      const rect = refs.sandbox.getBoundingClientRect();
      const width = Math.max(320, rect.width || 720);
      const height = Math.max(260, rect.height || 460);
      const margin = clamp(width * 0.12, 48, 86);
      const scale = (width - margin * 2) / 18;
      const ax = margin + (18 - state.ab) * scale / 2;
      const bx = ax + state.ab * scale;
      const cx = ax + state.c * scale;
      const y = clamp(height * 0.48, 145, height - 110);
      const mx = state.sceneId === "midpoint" ? ax + (state.ab / 2) * scale : ax + (state.c / 2) * scale;
      const nx = ax + (state.c + (state.ab - state.c) / 2) * scale;
      return { width, height, margin, scale, ax, bx, cx, y, mx, nx };
    }

    function svgEl(name) {
      return document.createElementNS("http://www.w3.org/2000/svg", name);
    }

    function line(id, x1, y1, x2, y2, klass) {
      const item = svgEl("line");
      item.setAttribute("id", id);
      item.setAttribute("x1", String(x1));
      item.setAttribute("y1", String(y1));
      item.setAttribute("x2", String(x2));
      item.setAttribute("y2", String(y2));
      item.setAttribute("class", `sml-segment ${klass}`);
      refs.svg.appendChild(item);
      return item;
    }

    function hasFocus(...keys) {
      return keys.includes(state.focusKey);
    }

    function bracePath(x1, y, x2, h = 18, r = 8) {
      if (x1 > x2) [x1, x2] = [x2, x1];
      const w = x2 - x1;
      const xm = x1 + w / 2;
      const dir = h > 0 ? 1 : -1;
      const absH = Math.abs(h);
      const rr = Math.min(r, Math.max(3, w / 8), absH / 2);
      return `M ${x1} ${y}
        C ${x1 + rr} ${y}, ${x1 + rr} ${y - dir * absH}, ${x1 + 2 * rr} ${y - dir * absH}
        L ${xm - 2 * rr} ${y - dir * absH}
        C ${xm - rr} ${y - dir * absH}, ${xm - rr} ${y - dir * (absH + 4)}, ${xm} ${y - dir * (absH + 4)}
        C ${xm + rr} ${y - dir * (absH + 4)}, ${xm + rr} ${y - dir * absH}, ${xm + 2 * rr} ${y - dir * absH}
        L ${x2 - 2 * rr} ${y - dir * absH}
        C ${x2 - rr} ${y - dir * absH}, ${x2 - rr} ${y}, ${x2} ${y}`;
    }

    function drawBrace(id, x1, y, x2, h, klass) {
      if (Math.abs(x2 - x1) < 14) return;
      const path = svgEl("path");
      path.setAttribute("id", id);
      path.setAttribute("d", bracePath(x1, y, x2, h));
      path.setAttribute("class", `sml-brace ${klass}`);
      refs.svg.appendChild(path);
    }

    function label(id, x, y, text, klass) {
      const node = document.createElement("div");
      node.className = `sml-float-label ${klass}`;
      node.id = id;
      node.textContent = text;
      const width = Math.max(320, refs.sandbox.clientWidth || 720);
      const height = Math.max(260, refs.sandbox.clientHeight || 460);
      node.style.left = `${clamp(x, 54, width - 54)}px`;
      node.style.top = `${clamp(y, 30, height - 30)}px`;
      refs.overlay.appendChild(node);
    }

    function lockBadge(x, y, text) {
      const node = document.createElement("div");
      node.className = "sml-constant-lock";
      node.textContent = text;
      const width = Math.max(320, refs.sandbox.clientWidth || 720);
      const height = Math.max(260, refs.sandbox.clientHeight || 460);
      node.style.left = `${clamp(x, 74, width - 74)}px`;
      node.style.top = `${clamp(y, 44, height - 44)}px`;
      refs.overlay.appendChild(node);
    }

    function labelOffset(name, index = 0) {
      const base = name === "C" ? -18 : -16;
      if (state.sceneId === "dual-midpoint") {
        if (name === "M") return -24;
        if (name === "C") return 26;
        if (name === "N") return -24;
      }
      if (state.sceneId === "midpoint" && name === "M") return -24;
      return base - index * 4;
    }

    function point(name, x, y, draggable, options = {}) {
      const group = svgEl("g");
      group.setAttribute("class", `sml-point-wrap ${draggable ? "is-draggable" : ""}`);
      if (draggable) group.setAttribute("data-drag-c", "true");

      if (draggable) {
        const hit = svgEl("circle");
        hit.setAttribute("class", "sml-point-hit");
        hit.setAttribute("cx", String(x));
        hit.setAttribute("cy", String(y - 6));
        hit.setAttribute("r", "48");
        group.appendChild(hit);
      }

      const halo = svgEl("circle");
      halo.setAttribute("class", "sml-point-halo");
      halo.setAttribute("cx", String(x));
      halo.setAttribute("cy", String(y));
      halo.setAttribute("r", draggable ? "18" : "15");
      group.appendChild(halo);

      const dot = svgEl("circle");
      dot.setAttribute("class", "sml-point");
      dot.setAttribute("cx", String(x));
      dot.setAttribute("cy", String(y));
      dot.setAttribute("r", draggable ? "7" : "6");
      group.appendChild(dot);

      const text = svgEl("text");
      text.setAttribute("class", "sml-point-label");
      text.setAttribute("x", String(x));
      text.setAttribute("y", String(y + labelOffset(name, options.index || 0)));
      text.textContent = name;
      group.appendChild(text);
      refs.svg.appendChild(group);
    }

    function mark(text, x, y) {
      const node = document.createElement("span");
      node.className = "sml-demo-mark";
      node.textContent = text;
      node.style.left = `${x}px`;
      node.style.top = `${y}px`;
      refs.particles.appendChild(node);
      setTimer(() => node.remove(), 900);
    }

    function clearGeometry() {
      refs.svg.innerHTML = "";
      refs.overlay.innerHTML = "";
      refs.svg.setAttribute("viewBox", `0 0 ${Math.max(320, refs.sandbox.clientWidth || 720)} ${Math.max(260, refs.sandbox.clientHeight || 460)}`);
    }

    function renderNormal(g, v) {
      line("axis", g.ax - 36, g.y, g.bx + 36, g.y, "base");

      if (state.sceneId === "sum-diff") {
        line("ac", g.ax, g.y, g.cx, g.y, `ac ${hasFocus("ac", "parts", "sum") ? "result-ac" : ""}`);
        line("bc", g.cx, g.y, g.bx, g.y, `bc ${hasFocus("bc", "parts", "sum") ? "result" : ""}`);
        drawBrace("brace-ac", g.ax, g.y, g.cx, 19, "ac");
        drawBrace("brace-bc", g.cx, g.y, g.bx, 19, "bc");
        drawBrace("brace-ab", g.ax, g.y, g.bx, -25, "ab");
        label("label-ac", (g.ax + g.cx) / 2, g.y - 48, `AC=${fmt(v.ac)}`, "ac");
        label("label-bc", (g.cx + g.bx) / 2, g.y - 48, `CB=${fmt(v.cb)}`, "bc");
        label("label-ab", (g.ax + g.bx) / 2, g.y + 58, `AB=${fmt(state.ab)}`, "ab");
        point("A", g.ax, g.y, false);
        point("C", g.cx, g.y, true);
        point("B", g.bx, g.y, false);
      }

      if (state.sceneId === "midpoint") {
        line("ab-base", g.ax, g.y, g.bx, g.y, "base ghost");
        line("am", g.ax, g.y, g.mx, g.y, `ac ${hasFocus("parts", "midpoint") ? "result-ac" : ""}`);
        line("mb", g.mx, g.y, g.bx, g.y, `bc ${hasFocus("parts", "midpoint") ? "result" : ""}`);
        if (hasFocus("ab")) line("ab", g.ax, g.y, g.bx, g.y, "ab result");
        const midGuide = svgEl("line");
        midGuide.setAttribute("x1", String(g.mx));
        midGuide.setAttribute("y1", String(g.y - 58));
        midGuide.setAttribute("x2", String(g.mx));
        midGuide.setAttribute("y2", String(g.y + 58));
        midGuide.setAttribute("class", "sml-axis");
        midGuide.setAttribute("stroke-dasharray", "7 7");
        refs.svg.appendChild(midGuide);
        drawBrace("brace-ab", g.ax, g.y, g.bx, 24, "ab");
        drawBrace("brace-am", g.ax, g.y, g.mx, -20, "part");
        drawBrace("brace-mb", g.mx, g.y, g.bx, -20, "part");
        label("label-ab", (g.ax + g.bx) / 2, g.y - 58, `AB=${fmt(state.ab)}`, "ab");
        label("label-am", (g.ax + g.mx) / 2, g.y + 50, `AM=${fmt(v.half)}`, "part");
        label("label-mb", (g.mx + g.bx) / 2, g.y + 50, `MB=${fmt(v.half)}`, "part");
        point("A", g.ax, g.y, false);
        point("M", g.mx, g.y, false);
        point("B", g.bx, g.y, false);
      }

      if (state.sceneId === "dual-midpoint") {
        line("ac", g.ax, g.y, g.cx, g.y, "ac");
        line("bc", g.cx, g.y, g.bx, g.y, "bc");
        if (hasFocus("mc-cn")) {
          line("mc-focus", g.mx, g.y, g.cx, g.y, "ac result-ac");
          line("cn-focus", g.cx, g.y, g.nx, g.y, "bc result");
        }
        line("mn", g.mx, g.y, g.nx, g.y, `mn ${hasFocus("mn") ? "result" : ""}`);
        lockBadge((g.mx + g.nx) / 2, g.y - 108, `恒定 MN=${fmt(v.half)}`);
        drawBrace("brace-ac", g.ax, g.y, g.cx, 20, "ac");
        drawBrace("brace-bc", g.cx, g.y, g.bx, 20, "bc");
        drawBrace("brace-am", g.ax, g.y, g.mx, -18, "part");
        drawBrace("brace-mc", g.mx, g.y, g.cx, -18, "part");
        drawBrace("brace-cn", g.cx, g.y, g.nx, -18, "part");
        drawBrace("brace-nb", g.nx, g.y, g.bx, -18, "part");
        drawBrace("brace-mn", g.mx, g.y, g.nx, 38, "mn");
        label("label-ac", (g.ax + g.cx) / 2, g.y - 48, `AC=${fmt(v.ac)}`, "ac");
        label("label-bc", (g.cx + g.bx) / 2, g.y - 48, `CB=${fmt(v.cb)}`, "bc");
        label("label-mn", (g.mx + g.nx) / 2, g.y - 76, `MN=${fmt(v.half)}`, "mn");
        label("label-am", (g.ax + g.mx) / 2, g.y + 48, `AM=${fmt(v.am)}`, "part");
        label("label-mc", (g.mx + g.cx) / 2, g.y + 48, `MC=${fmt(v.mc)}`, "part");
        label("label-cn", (g.cx + g.nx) / 2, g.y + 48, `CN=${fmt(v.cn)}`, "part");
        label("label-nb", (g.nx + g.bx) / 2, g.y + 48, `NB=${fmt(v.nb)}`, "part");
        point("A", g.ax, g.y, false);
        point("M", g.mx, g.y, false);
        point("C", g.cx, g.y, true);
        point("N", g.nx, g.y, false);
        point("B", g.bx, g.y, false);
      }
    }

    function renderDemo(g, v) {
      line("axis", g.ax - 36, g.y, g.bx + 36, g.y, "base");
      if (state.demo === "sum") {
        line("ac-demo", g.ax, g.y - 46, g.cx, g.y - 46, "ac");
        line("bc-demo", g.cx + 18, g.y - 46, g.bx + 18, g.y - 46, "bc");
        line("ab-result", g.ax, g.y, g.bx, g.y, "ab result");
        drawBrace("brace-ab", g.ax, g.y, g.bx, -25, "ab");
        label("label-sum", (g.ax + g.bx) / 2, g.y + 58, `AB=${fmt(v.ac)}+${fmt(v.cb)}`, "ab");
        mark("AC + CB", (g.ax + g.bx) / 2, g.y - 72);
        point("A", g.ax, g.y, false);
        point("C", g.cx, g.y, false);
        point("B", g.bx, g.y, false);
      } else if (state.demo === "diff") {
        line("ab-demo", g.ax, g.y, g.bx, g.y, "ab ghost");
        line("bc-cut", g.cx, g.y, g.bx, g.y, "bc ghost");
        line("ac-result", g.ax, g.y, g.cx, g.y, "ac result-ac");
        drawBrace("brace-ac", g.ax, g.y, g.cx, 22, "ac");
        label("label-diff", (g.ax + g.cx) / 2, g.y - 52, `AC=AB-CB=${fmt(v.ac)}`, "ac");
        mark("扣去 CB", (g.cx + g.bx) / 2, g.y - 44);
        point("A", g.ax, g.y, false);
        point("C", g.cx, g.y, false);
        point("B", g.bx, g.y, false);
      } else if (state.demo === "mid") {
        line("am-demo", g.ax - 16, g.y, g.mx - 16, g.y, "ac result-ac");
        line("mb-demo", g.mx + 16, g.y, g.bx + 16, g.y, "bc result");
        drawBrace("brace-am", g.ax - 16, g.y, g.mx - 16, -22, "ac");
        drawBrace("brace-mb", g.mx + 16, g.y, g.bx + 16, -22, "bc");
        label("label-am", (g.ax + g.mx) / 2 - 16, g.y + 54, `AM=${fmt(v.half)}`, "ac");
        label("label-mb", (g.mx + g.bx) / 2 + 16, g.y + 54, `MB=${fmt(v.half)}`, "bc");
        mark("AM = MB", g.mx, g.y - 58);
        point("A", g.ax - 16, g.y, false);
        point("M", g.mx - 16, g.y, false);
        point("M", g.mx + 16, g.y, false);
        point("B", g.bx + 16, g.y, false);
      }
    }

    function proofHtml(v) {
      if (state.sceneId === "sum-diff") {
        return `${fmt(state.ab)} = ${fmt(v.ac)} + ${fmt(v.cb)}<br>${fmt(v.ac)} = ${fmt(state.ab)} - ${fmt(v.cb)}`;
      }
      if (state.sceneId === "midpoint") {
        return `AM = MB = ${fmt(v.half)}<br>AB = 2AM = ${fmt(state.ab)}`;
      }
      return `MN = MC + CN = ${fmt(v.mc)} + ${fmt(v.cn)} = ${fmt(v.half)}`;
    }

    function valueItems(v) {
      if (state.sceneId === "sum-diff") {
        return [
          ["AB", fmt(state.ab)],
          ["AC", fmt(v.ac)],
          ["CB", fmt(v.cb)],
          ["AC+CB", fmt(v.ac + v.cb)],
          ["AB-CB", fmt(state.ab - v.cb)],
          ["C 位置", fmt(state.c)]
        ];
      }
      if (state.sceneId === "midpoint") {
        return [
          ["AB", fmt(state.ab)],
          ["AM", fmt(v.half)],
          ["MB", fmt(v.half)],
          ["1/2 AB", fmt(v.half)],
          ["2AM", fmt(v.half * 2)],
          ["2MB", fmt(v.half * 2)]
        ];
      }
      return [
        ["AC", fmt(v.ac)],
        ["CB", fmt(v.cb)],
        ["MC", fmt(v.mc)],
        ["CN", fmt(v.cn)],
        ["MN", fmt(v.half)],
        ["1/2 AB", fmt(v.half)]
      ];
    }

    function relationHtml(v) {
      if (state.sceneId === "sum-diff") return `AB = AC + CB`;
      if (state.sceneId === "midpoint") return `AM = MB = 1/2 AB`;
      return `MN = 1/2 AB`;
    }

    function teachingSteps(v) {
      if (state.sceneId === "sum-diff") {
        return [
          {
            focus: "",
            note: "先看 A、C、B 三点共线，C 把 AB 分成 AC 和 CB 两段。",
            rule: `AB=${fmt(state.ab)}，AC=${fmt(v.ac)}，CB=${fmt(v.cb)}`
          },
          {
            focus: "parts",
            note: "高亮两段：AC 与 CB 首尾相接，正好铺满整条 AB。",
            rule: "AB = AC + CB"
          },
          {
            focus: "sum",
            note: `代入当前长度：${fmt(state.ab)} = ${fmt(v.ac)} + ${fmt(v.cb)}。`,
            rule: `${fmt(state.ab)} = ${fmt(v.ac)} + ${fmt(v.cb)}`
          },
          {
            focus: "ac",
            note: "反过来求其中一段：从总长 AB 中扣去 CB，剩下 AC。",
            rule: `AC = AB - CB = ${fmt(state.ab)} - ${fmt(v.cb)} = ${fmt(v.ac)}`
          }
        ];
      }
      if (state.sceneId === "midpoint") {
        return [
          {
            focus: "",
            note: "先找到中点 M：它落在 AB 的正中间。",
            rule: "M 是 AB 的中点"
          },
          {
            focus: "parts",
            note: "观察两边 AM 与 MB：中点把线段切成两段相等的长度。",
            rule: "AM = MB"
          },
          {
            focus: "ab",
            note: `代入当前长度：AB=${fmt(state.ab)}，所以一半是 ${fmt(v.half)}。`,
            rule: `1/2 AB = ${fmt(v.half)}`
          },
          {
            focus: "midpoint",
            note: "最终结论：AM、MB 都等于 AB 的一半，也可以反推 AB=2AM=2MB。",
            rule: `AM = MB = 1/2 AB = ${fmt(v.half)}`
          }
        ];
      }
      return [
        {
          focus: "",
          note: "先看双中点：M 是 AC 的中点，N 是 CB 的中点。",
          rule: "M 平分 AC，N 平分 CB"
        },
        {
          focus: "mc-cn",
          note: "高亮 MC 与 CN：MN 正好由 MC 和 CN 两段拼成。",
          rule: "MN = MC + CN"
        },
        {
          focus: "mc-cn",
          note: `代入一半关系：MC=${fmt(v.mc)}，CN=${fmt(v.cn)}。`,
          rule: `MN = ${fmt(v.mc)} + ${fmt(v.cn)} = ${fmt(v.half)}`
        },
        {
          focus: "mn",
          note: "拖动 C 后 AC、CB 会变，但 MN 始终等于 AB 的一半。",
          rule: `MN = 1/2 AB = ${fmt(v.half)}`
        }
      ];
    }

    function currentTeachingStep(v) {
      const steps = teachingSteps(v);
      const index = clamp(state.teachStep, 0, steps.length - 1);
      return { ...steps[index], index, total: steps.length };
    }

    function setTeachingStep(index, options = {}) {
      const steps = teachingSteps(values());
      state.teachStep = clamp(index, 0, steps.length - 1);
      state.focusKey = steps[state.teachStep]?.focus || "";
      if (options.clearMessage !== false) state.message = "";
    }

    function advanceTeachingStep() {
      if (state.animating) return;
      const steps = teachingSteps(values());
      const next = state.teachStep >= steps.length - 1 ? 0 : state.teachStep + 1;
      setTeachingStep(next);
      render();
    }

    function render() {
      if (state.disposed) return;
      const g = geometry();
      const v = values();
      clearGeometry();
      if (state.demo) renderDemo(g, v);
      else renderNormal(g, v);
      updatePanel();
    }

    function updatePanel() {
      const v = values();
      const info = currentScene();
      const step = currentTeachingStep(v);
      refs.sceneStatus.textContent = info.label;
      refs.abStatus.textContent = fmt(state.ab);
      refs.cStatus.textContent = state.sceneId === "midpoint" ? "中点" : fmt(state.c);
      refs.relation.innerHTML = relationHtml(v);
      refs.proof.innerHTML = proofHtml(v);
      refs.valuesNote.textContent = info.detail;
      refs.proofNote.textContent = info.focus;
      refs.tabs.forEach(tab => tab.classList.toggle("is-active", tab.dataset.scene === state.sceneId));
      if (refs.panelBadge) refs.panelBadge.textContent = info.badge;
      if (refs.actionBadge) refs.actionBadge.textContent = state.animating ? "演示中" : `第 ${step.index + 1}/${step.total} 步`;
      if (refs.abRange) refs.abRange.value = String(state.ab);
      if (refs.cRange) {
        refs.cRange.max = String(Math.max(1, state.ab - 0.5));
        refs.cRange.value = String(state.c);
      }
      if (refs.abValue) refs.abValue.textContent = fmt(state.ab);
      if (refs.cValue) refs.cValue.textContent = fmt(state.c);
      refs.cRow?.classList.toggle("is-hidden", state.sceneId === "midpoint");
      if (refs.note) refs.note.textContent = state.message || step.note;
      if (refs.rule) refs.rule.textContent = step.rule || info.formula;
      if (refs.valAc) refs.valAc.textContent = fmt(v.ac);
      if (refs.valCb) refs.valCb.textContent = fmt(v.cb);
      if (refs.valAm) refs.valAm.textContent = fmt(v.am);
      if (refs.valMb) refs.valMb.textContent = fmt(v.mb);
      if (refs.valMn) refs.valMn.textContent = fmt(v.mn);
      if (refs.valHalf) refs.valHalf.textContent = fmt(v.half);
      valueItems(v).forEach((item, index) => {
        const cell = refs.valueCells[index];
        if (!cell) return;
        const labelNode = cell.querySelector("span:first-child");
        const valueNode = cell.querySelector("span:last-child");
        if (labelNode) labelNode.textContent = item[0];
        if (valueNode) valueNode.textContent = item[1];
      });
      refs.demoButtons.forEach(button => {
        const demo = button.dataset.demo;
        const visible = (state.sceneId === "sum-diff" && (demo === "sum" || demo === "diff"))
          || (state.sceneId === "midpoint" && demo === "mid");
        button.classList.toggle("is-hidden", !visible);
        button.disabled = state.animating || !visible;
      });
      if (refs.stepButton) refs.stepButton.disabled = state.animating;
      refs.actionButtons.forEach(button => {
        if (button.dataset.demo || button.dataset.step !== undefined) return;
        button.disabled = state.animating;
      });
      refs.progressSteps.forEach(node => {
        const index = Number.parseInt(node.dataset.stepIndicator || "0", 10);
        node.classList.toggle("is-active", index === step.index);
        node.classList.toggle("is-done", index < step.index);
      });
      if (refs.abRange) refs.abRange.disabled = state.animating;
      if (refs.cRange) refs.cRange.disabled = state.animating || state.sceneId === "midpoint";
      refs.tabs.forEach(tab => { tab.disabled = state.animating; });
      fitPanel(panel);
    }

    function setScene(sceneId) {
      if (!SCENES[sceneId] || state.animating) return;
      state.sceneId = sceneId;
      setTeachingStep(0);
      if (state.sceneId === "midpoint") {
        state.c = state.ab / 2;
      } else {
        state.c = clamp(state.c, 0.5, state.ab - 0.5);
      }
      render();
    }

    function startDemo(type) {
      if (state.animating) return;
      if ((type === "sum" || type === "diff") && state.sceneId !== "sum-diff") return;
      if (type === "mid" && state.sceneId !== "midpoint") return;
      state.animating = true;
      state.demo = type;
      state.focusKey = type === "sum" ? "sum" : type === "diff" ? "ac" : "midpoint";
      state.message = type === "sum"
        ? "把 AC 与 CB 首尾拼接，得到整条 AB。"
        : type === "diff"
          ? "从 AB 中扣去 CB，剩下 AC。"
          : "从中点 M 切开，两半长度相等。";
      render();
      setTimer(() => {
        if (state.disposed) return;
        state.animating = false;
        state.demo = "";
        state.message = "";
        setTeachingStep(state.teachStep);
        render();
      }, 1500);
    }

    function resetDemo() {
      if (state.animating) return;
      state.ab = 12;
      state.c = state.sceneId === "midpoint" ? 6 : 4;
      setTeachingStep(0);
      resetView();
      render();
    }

    function activePointers(event) {
      return [...(event.currentTarget.__smlPointers || new Map()).values()];
    }

    function distance(a, b) {
      return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    }

    function centerOf(points) {
      return {
        x: points.reduce((sum, point) => sum + point.clientX, 0) / points.length,
        y: points.reduce((sum, point) => sum + point.clientY, 0) / points.length
      };
    }

    refs.stage.__smlPointers = new Map();

    function onPointerDown(event) {
      if (state.disposed || state.animating) return;
      event.preventDefault();
      refs.stage.setPointerCapture?.(event.pointerId);
      refs.stage.__smlPointers.set(event.pointerId, event);
      refs.world.classList.add("is-manipulating");

      const pointers = activePointers(event);
      if (pointers.length >= 2) {
        const pair = pointers.slice(0, 2);
        const center = centerOf(pair);
        state.pointer.mode = "pinch";
        state.pinch.startDistance = Math.max(1, distance(pair[0], pair[1]));
        state.pinch.startZoom = state.view.zoom;
        state.pinch.startCenterX = center.x;
        state.pinch.startCenterY = center.y;
        state.pinch.startViewX = state.view.x;
        state.pinch.startViewY = state.view.y;
        return;
      }

      const dragNode = event.target.closest?.("[data-drag-c]");
      state.pointer.id = event.pointerId;
      state.pointer.startX = event.clientX;
      state.pointer.startY = event.clientY;
      state.pointer.lastX = event.clientX;
      state.pointer.lastY = event.clientY;
      state.pointer.pointerType = event.pointerType || "mouse";

      if (dragNode && state.sceneId !== "midpoint") {
        state.pointer.mode = "drag-c";
        dragNode.classList.add("is-dragging");
        return;
      }

      state.pointer.mode = "pan";
      refs.stage.classList.add("is-panning");
    }

    function onPointerMove(event) {
      const pointerMap = refs.stage.__smlPointers;
      if (pointerMap?.has(event.pointerId)) pointerMap.set(event.pointerId, event);
      if (!state.pointer.mode || state.disposed || state.animating) return;
      event.preventDefault();

      const pointers = activePointers(event);
      if (state.pointer.mode === "pinch" && pointers.length >= 2) {
        const pair = pointers.slice(0, 2);
        const center = centerOf(pair);
        state.view.zoom = clamp(state.pinch.startZoom * (distance(pair[0], pair[1]) / state.pinch.startDistance), 0.72, 1.85);
        state.view.x = clamp(state.pinch.startViewX + (center.x - state.pinch.startCenterX), -420, 420);
        state.view.y = clamp(state.pinch.startViewY + (center.y - state.pinch.startCenterY), -320, 320);
        applyView();
        return;
      }

      if (event.pointerId !== state.pointer.id) return;

      if (state.pointer.mode === "pan") {
        state.view.x = clamp(state.view.x + event.clientX - state.pointer.lastX, -420, 420);
        state.view.y = clamp(state.view.y + event.clientY - state.pointer.lastY, -320, 320);
        state.pointer.lastX = event.clientX;
        state.pointer.lastY = event.clientY;
        applyView();
        return;
      }

      if (state.pointer.mode === "drag-c") {
        const g = geometry();
        const point = worldPoint(event.clientX, event.clientY);
        const raw = (point.x - g.ax) / g.scale;
        const precision = state.pointer.pointerType === "mouse" ? 2 : 10;
        let next = Math.round(raw * precision) / precision;
        state.c = clamp(next, 0.5, state.ab - 0.5);
        state.teachStep = 0;
        state.focusKey = "";
        state.message = state.sceneId === "dual-midpoint"
          ? "拖动 C 时，AC 与 CB 改变，但 MN 保持为 1/2 AB。"
          : "拖动 C 改变 AC 与 CB，AB 总长不变。";
        render();
      }
    }

    function endPointer(event) {
      const pointerMap = refs.stage.__smlPointers;
      pointerMap?.delete(event.pointerId);
      refs.stage.releasePointerCapture?.(event.pointerId);
      refs.world.classList.remove("is-manipulating");
      refs.stage.classList.remove("is-panning");
      refs.svg.querySelectorAll(".sml-point-wrap.is-dragging").forEach(node => node.classList.remove("is-dragging"));
      if (state.pointer.mode === "pinch" && (pointerMap?.size || 0) > 0) return;
      state.pointer.mode = null;
    }

    addCleanup(refs.stage, "pointerdown", onPointerDown);
    addCleanup(refs.stage, "pointermove", onPointerMove);
    addCleanup(refs.stage, "pointerup", endPointer);
    addCleanup(refs.stage, "pointercancel", endPointer);

    if (panel) {
      addCleanup(panel, "click", event => {
        const sceneButton = event.target.closest("[data-scene]");
        if (sceneButton) {
          setScene(sceneButton.dataset.scene);
          return;
        }
        const demoButton = event.target.closest("[data-demo]");
        if (demoButton) {
          startDemo(demoButton.dataset.demo);
          return;
        }
        if (event.target.closest("[data-step]")) {
          advanceTeachingStep();
          return;
        }
        if (event.target.closest("[data-reset]")) {
          resetDemo();
          return;
        }
        if (event.target.closest("[data-view-reset]")) {
          resetView();
        }
      });

      addCleanup(refs.abRange, "input", event => {
        if (state.animating) return;
        state.ab = Number.parseFloat(event.target.value) || 12;
        if (state.sceneId === "midpoint") state.c = state.ab / 2;
        else state.c = clamp(state.c, 0.5, state.ab - 0.5);
        state.teachStep = 0;
        state.focusKey = "";
        state.message = "AB 长度改变后，相关线段读数同步变化。";
        render();
      });

      addCleanup(refs.cRange, "input", event => {
        if (state.animating || state.sceneId === "midpoint") return;
        state.c = clamp(Number.parseFloat(event.target.value) || 4, 0.5, state.ab - 0.5);
        state.teachStep = 0;
        state.focusKey = "";
        state.message = state.sceneId === "dual-midpoint"
          ? "C 的位置改变，MN 仍等于 AB 的一半。"
          : "C 的位置改变，AC 与 CB 一增一减。";
        render();
      });
    }

    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => {
      render();
      fitPanel(panel);
    }) : null;
    if (resizeObserver) {
      resizeObserver.observe(refs.sandbox);
      if (panelHost) resizeObserver.observe(panelHost);
      cleanups.push(() => resizeObserver.disconnect());
    }

    resetView();
    requestAnimationFrame(render);
    fitPanel(panel);

    container.__segmentMidpointCleanup = () => {
      state.disposed = true;
      clearTimers();
      cleanups.splice(0).forEach(fn => fn());
      container.innerHTML = "";
      if (panelHost) panelHost.innerHTML = "";
    };
  }

  window.MATH_VISUAL_SCENES[CARD_ID] = {
    mount,
    unmount(container, context = {}) {
      if (typeof container.__segmentMidpointCleanup === "function") {
        container.__segmentMidpointCleanup();
        delete container.__segmentMidpointCleanup;
      } else {
        container.innerHTML = "";
        if (context.externalPanel) context.externalPanel.innerHTML = "";
      }
    }
  };
})();
