window.MATH_VISUAL_SCENES = window.MATH_VISUAL_SCENES || {};

(function () {
  const CARD_ID = "j7a_m09";
  const STYLE_ID = "angle-bisector-lab-style";

  const SCENES = {
    measure: {
      label: "角的度量",
      badge: "量角器读数",
      detail: "拖动射线 OB，练习量角器的对中、对线、读数。",
      formula: "∠AOB = 读数"
    },
    bisector: {
      label: "角平分线",
      badge: "等角性质",
      detail: "拖动射线 OB，观察 OC 始终把 ∠AOB 分成两个相等角。",
      formula: "∠AOC = ∠COB = 1/2∠AOB"
    },
    dual: {
      label: "双平分线",
      badge: "恒定探究",
      detail: "拖动内部射线 OC，观察 OM、ON 两条平分线夹角始终不变。",
      formula: "∠MON = 1/2∠AOB"
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
      .abl-scene,
      .abl-scene *,
      .abl-panel,
      .abl-panel * {
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -webkit-user-drag: none;
        user-select: none;
      }

      .abl-scene {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 0;
        overflow: hidden;
        color: #f8fafc;
        font-family: Inter, "Noto Sans SC", "Microsoft YaHei UI", "Microsoft YaHei", sans-serif;
        background:
          radial-gradient(circle at 14% 18%, rgba(59,130,246,0.18), transparent 30%),
          radial-gradient(circle at 82% 22%, rgba(16,185,129,0.15), transparent 30%),
          radial-gradient(circle at 62% 86%, rgba(245,158,11,0.14), transparent 32%),
          linear-gradient(145deg, #020617 0%, #0b1220 54%, #020617 100%);
        touch-action: none;
      }

      .abl-board {
        position: absolute;
        inset: 14px;
        display: grid;
        grid-template-rows: minmax(0, 1fr) auto;
        gap: 10px;
      }

      .abl-sandbox {
        position: relative;
        min-height: 0;
        overflow: hidden;
        border: 1px solid rgba(148,163,184,0.2);
        border-radius: 8px;
        background:
          linear-gradient(rgba(148,163,184,0.12) 1px, transparent 1px),
          linear-gradient(90deg, rgba(148,163,184,0.12) 1px, transparent 1px),
          radial-gradient(circle at 20% 18%, rgba(59,130,246,0.1), transparent 30%),
          linear-gradient(180deg, #f8fafc, #eef4ff);
        background-size: 42px 42px, 42px 42px, 100% 100%, 100% 100%;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.86), 0 22px 60px rgba(2,6,23,0.28);
        touch-action: none;
      }

      .abl-status {
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

      .abl-chip {
        min-width: 0;
        border: 1px solid rgba(148,163,184,0.22);
        border-radius: 8px;
        background: rgba(255,255,255,0.82);
        color: rgba(15,23,42,0.72);
        backdrop-filter: blur(12px);
        padding: 6px 9px;
        font-size: 11px;
        line-height: 1.2;
        font-weight: 950;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .abl-chip strong {
        color: #0f172a;
      }

      .abl-stage {
        position: absolute;
        inset: 0;
        touch-action: none;
        cursor: grab;
      }

      .abl-stage.is-panning {
        cursor: grabbing;
      }

      .abl-world {
        position: absolute;
        inset: 0;
        transform: translate(var(--pan-x, 0px), var(--pan-y, 0px)) scale(var(--zoom, 1));
        transform-origin: center center;
        transition: transform 0.16s ease;
        will-change: transform;
      }

      .abl-world.is-manipulating {
        transition: none;
      }

      .abl-svg,
      .abl-overlay,
      .abl-particles {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
      }

      .abl-svg {
        overflow: visible;
      }

      .abl-overlay,
      .abl-particles {
        pointer-events: none;
      }

      .abl-axis {
        stroke: rgba(100,116,139,0.32);
        stroke-width: 3;
        stroke-linecap: round;
      }

      .abl-axis,
      .abl-ray,
      .abl-sector,
      .abl-guide-line,
      .abl-equal-mark,
      .abl-half-mark {
        pointer-events: none;
      }

      .abl-ray {
        stroke-width: 7;
        stroke-linecap: round;
        filter: drop-shadow(0 5px 10px rgba(15,23,42,0.12));
      }

      .abl-ray.oa { stroke: #2563eb; }
      .abl-ray.ob { stroke: #10b981; }
      .abl-ray.oc { stroke: #f59e0b; stroke-width: 6; }
      .abl-ray.om,
      .abl-ray.on,
      .abl-ray.bisector {
        stroke: #7c3aed;
        stroke-width: 5;
        stroke-dasharray: 10 7;
      }

      .abl-ray.fold {
        stroke: #10b981;
        stroke-width: 8;
        filter: drop-shadow(0 0 12px rgba(16,185,129,0.45));
      }

      .abl-sector {
        stroke-width: 2.4;
        stroke-linecap: round;
      }

      .abl-sector.aob {
        fill: rgba(79,70,229,0.13);
        stroke: rgba(79,70,229,0.42);
      }

      .abl-sector.left {
        fill: rgba(37,99,235,0.13);
        stroke: rgba(37,99,235,0.4);
      }

      .abl-sector.right {
        fill: rgba(16,185,129,0.13);
        stroke: rgba(16,185,129,0.4);
      }

      .abl-sector.mon {
        fill: rgba(245,158,11,0.22);
        stroke: rgba(245,158,11,0.72);
        stroke-width: 3.2;
        filter: drop-shadow(0 0 10px rgba(245,158,11,0.26));
      }

      .abl-guide-line {
        fill: none;
        stroke: rgba(239,68,68,0.72);
        stroke-width: 2.2;
        stroke-linecap: round;
        stroke-dasharray: 7 6;
        filter: drop-shadow(0 0 5px rgba(239,68,68,0.22));
      }

      .abl-equal-mark {
        fill: none;
        stroke: #7c3aed;
        stroke-width: 3.2;
        stroke-linecap: round;
        filter: drop-shadow(0 0 5px rgba(124,58,237,0.22));
      }

      .abl-half-mark {
        fill: none;
        stroke: rgba(245,158,11,0.82);
        stroke-width: 3.4;
        stroke-linecap: round;
        stroke-dasharray: 6 5;
      }

      .abl-protractor {
        cursor: grab;
        opacity: 0.96;
        filter: drop-shadow(0 16px 26px rgba(15,23,42,0.16));
        touch-action: none;
      }

      .abl-protractor.is-dragging {
        cursor: grabbing;
      }

      .abl-protractor-hit {
        fill: transparent;
        stroke: transparent;
        pointer-events: all;
        cursor: grab;
        touch-action: none;
      }

      .abl-protractor-glass {
        fill: rgba(248,250,252,0.82);
        stroke: rgba(100,116,139,0.5);
        stroke-width: 1.5;
        pointer-events: none;
      }

      .abl-protractor-ring,
      .abl-protractor-tick {
        fill: none;
        stroke: rgba(71,85,105,0.64);
        stroke-width: 1;
        pointer-events: none;
      }

      .abl-protractor-tick.minor {
        stroke: rgba(148,163,184,0.7);
        stroke-width: 0.7;
      }

      .abl-protractor-text {
        fill: #334155;
        font-family: "JetBrains Mono", Consolas, sans-serif;
        font-size: 8px;
        font-weight: 900;
        text-anchor: middle;
        dominant-baseline: middle;
        pointer-events: none;
      }

      .abl-protractor-target {
        fill: none;
        stroke: #ef4444;
        stroke-width: 3;
        stroke-dasharray: 5 4;
        filter: drop-shadow(0 0 6px rgba(239,68,68,0.42));
        pointer-events: none;
      }

      .abl-point-hit {
        fill: transparent;
        pointer-events: all;
        cursor: grab;
        touch-action: none;
      }

      .abl-point-wrap.is-draggable,
      .abl-point-wrap.is-draggable *,
      .abl-protractor,
      .abl-protractor * {
        touch-action: none;
        -webkit-user-select: none;
        user-select: none;
      }

      .abl-point-wrap.is-dragging .abl-point-hit {
        cursor: grabbing;
      }

      .abl-point-halo {
        fill: #dbeafe;
        opacity: 0.55;
      }

      .abl-point {
        fill: #ffffff;
        stroke: #0f172a;
        stroke-width: 3;
      }

      .abl-point-wrap.is-draggable .abl-point {
        fill: #4f46e5;
        stroke: #ffffff;
        stroke-width: 2.5;
        filter: drop-shadow(0 5px 12px rgba(79,70,229,0.32));
      }

      .abl-point-label {
        fill: #0f172a;
        font-family: "JetBrains Mono", Consolas, "Microsoft YaHei UI", sans-serif;
        font-size: 17px;
        font-weight: 950;
        text-anchor: middle;
        pointer-events: none;
      }

      .abl-float-label {
        position: absolute;
        transform: translate(-50%, -50%);
        max-width: 160px;
        border: 1px solid rgba(148,163,184,0.28);
        border-radius: 8px;
        background: rgba(255,255,255,0.9);
        color: #0f172a;
        box-shadow: 0 10px 22px rgba(15,23,42,0.1);
        padding: 4px 8px;
        font-family: "JetBrains Mono", Consolas, "Microsoft YaHei UI", sans-serif;
        font-size: 12px;
        line-height: 1.15;
        font-weight: 950;
        white-space: nowrap;
      }

      .abl-float-label.aob { color: #4338ca; }
      .abl-float-label.left { color: #2563eb; }
      .abl-float-label.right { color: #047857; }
      .abl-float-label.mon {
        color: #b45309;
        border-color: rgba(245,158,11,0.36);
        background: rgba(255,251,235,0.92);
      }

      .abl-float-label.read {
        color: #b91c1c;
        border-color: rgba(239,68,68,0.34);
        background: rgba(254,242,242,0.94);
      }

      .abl-float-label.equal {
        color: #6d28d9;
        border-color: rgba(124,58,237,0.3);
        background: rgba(245,243,255,0.94);
      }

      .abl-float-label.part {
        color: #92400e;
        border-color: rgba(245,158,11,0.3);
        background: rgba(255,251,235,0.9);
      }

      .abl-constant-lock {
        position: absolute;
        z-index: 12;
        transform: translate(-50%, -50%);
        border: 1px solid rgba(245,158,11,0.38);
        border-radius: 999px;
        background: rgba(255,251,235,0.92);
        color: #92400e;
        box-shadow: 0 10px 26px rgba(146,64,14,0.16);
        padding: 6px 9px;
        font-size: 11px;
        line-height: 1;
        font-weight: 950;
        white-space: nowrap;
      }

      .abl-demo-mark {
        position: absolute;
        z-index: 15;
        transform: translate(-50%, -50%);
        border: 1px solid rgba(15,23,42,0.1);
        border-radius: 999px;
        background: rgba(255,255,255,0.94);
        color: #0f172a;
        box-shadow: 0 18px 40px rgba(15,23,42,0.14);
        padding: 8px 12px;
        font-size: 13px;
        line-height: 1;
        font-weight: 950;
        animation: ablPop 0.9s ease forwards;
      }

      .abl-formulas {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 8px;
        min-height: 108px;
      }

      .abl-formula-card {
        min-width: 0;
        border: 1px solid rgba(148,163,184,0.16);
        border-radius: 8px;
        background: rgba(15,23,42,0.68);
        padding: 10px 12px;
        display: grid;
        gap: 6px;
      }

      .abl-formula-card.is-main {
        border-color: rgba(245,158,11,0.3);
        background: linear-gradient(135deg, rgba(245,158,11,0.12), rgba(15,23,42,0.7));
      }

      .abl-formula-label {
        color: rgba(203,213,225,0.68);
        font-size: 11px;
        line-height: 1.2;
        font-weight: 950;
      }

      .abl-formula-value {
        color: #f8fafc;
        font-family: "JetBrains Mono", Consolas, "Microsoft YaHei UI", monospace;
        font-size: clamp(17px, 2.25vw, 25px);
        line-height: 1.28;
        font-weight: 950;
        overflow-wrap: anywhere;
      }

      .abl-formula-note {
        color: rgba(226,232,240,0.76);
        font-size: 12px;
        line-height: 1.45;
        font-weight: 780;
      }

      .abl-panel {
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

      .abl-panel::-webkit-scrollbar {
        width: 0;
        height: 0;
      }

      .abl-panel-card {
        min-width: 0;
        border: 1px solid rgba(148,163,184,0.16);
        border-radius: 8px;
        background: rgba(15,23,42,0.64);
        padding: 8px;
      }

      .abl-panel-head {
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

      .abl-panel-head span:last-child {
        min-width: 0;
        color: rgba(125,211,252,0.88);
        font-family: "JetBrains Mono", Consolas, monospace;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .abl-scene-tabs {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 7px;
      }

      .abl-tab,
      .abl-button {
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

      .abl-tab.is-active {
        border-color: rgba(250,204,21,0.42);
        background: rgba(250,204,21,0.12);
        color: #fef3c7;
      }

      .abl-button:hover,
      .abl-tab:hover {
        border-color: rgba(125,211,252,0.5);
        color: #e0f2fe;
      }

      .abl-button:active,
      .abl-tab:active {
        transform: scale(0.98);
      }

      .abl-button:disabled,
      .abl-tab:disabled,
      .abl-range:disabled {
        cursor: default;
        opacity: 0.52;
      }

      .abl-button.primary {
        border-color: rgba(250,204,21,0.42);
        background: rgba(250,204,21,0.12);
        color: #fef3c7;
      }

      .abl-button.success {
        border-color: rgba(52,211,153,0.42);
        background: rgba(16,185,129,0.12);
        color: #d1fae5;
      }

      .abl-button.is-hidden,
      .abl-slider-row.is-hidden {
        display: none;
      }

      .abl-action-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }

      .abl-slider-row {
        display: grid;
        grid-template-columns: 82px minmax(0, 1fr) 46px;
        gap: 8px;
        align-items: center;
        min-height: 34px;
      }

      .abl-slider-label,
      .abl-slider-value {
        color: rgba(226,232,240,0.74);
        font-size: 11px;
        line-height: 1.2;
        font-weight: 900;
      }

      .abl-slider-value {
        color: #fef3c7;
        font-family: "JetBrains Mono", Consolas, monospace;
        text-align: right;
      }

      .abl-range {
        min-width: 0;
        width: 100%;
        accent-color: #facc15;
        touch-action: manipulation;
      }

      .abl-value-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 6px;
      }

      .abl-value-cell {
        min-width: 0;
        border: 1px solid rgba(148,163,184,0.12);
        border-radius: 8px;
        background: rgba(2,6,23,0.25);
        padding: 7px;
        display: grid;
        gap: 3px;
      }

      .abl-value-cell span:first-child {
        color: rgba(203,213,225,0.62);
        font-size: 10px;
        line-height: 1.1;
        font-weight: 950;
      }

      .abl-value-cell span:last-child {
        color: #ffffff;
        font-family: "JetBrains Mono", Consolas, monospace;
        font-size: 13px;
        line-height: 1.12;
        font-weight: 950;
      }

      .abl-progress {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 5px;
        margin-bottom: 8px;
      }

      .abl-progress-step {
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

      .abl-progress-step.is-active {
        border-color: rgba(250,204,21,0.44);
        background: rgba(250,204,21,0.1);
        color: #fef3c7;
      }

      .abl-progress-step.is-done {
        border-color: rgba(52,211,153,0.34);
        background: rgba(16,185,129,0.1);
        color: #d1fae5;
      }

      .abl-note {
        color: rgba(203,213,225,0.78);
        font-size: 12px;
        line-height: 1.45;
        font-weight: 760;
      }

      .abl-rule {
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

      .abl-panel[data-size="compact"] {
        gap: 7px;
        padding: 8px;
      }

      .abl-panel[data-size="compact"] .abl-panel-card {
        padding: 7px;
      }

      .abl-panel[data-size="compact"] .abl-button,
      .abl-panel[data-size="compact"] .abl-tab {
        min-height: 31px;
        font-size: 10px;
        padding: 6px;
      }

      .abl-panel[data-size="micro"] {
        gap: 6px;
        padding: 7px;
      }

      .abl-panel[data-size="micro"] .abl-panel-card {
        padding: 6px;
      }

      .abl-panel[data-size="micro"] .abl-button,
      .abl-panel[data-size="micro"] .abl-tab {
        min-height: 28px;
        font-size: 9px;
        padding: 5px;
      }

      .abl-panel[data-size="micro"] .abl-scene-tabs {
        grid-template-columns: 1fr;
      }

      .abl-panel[data-size="micro"] .abl-value-grid,
      .abl-panel[data-size="micro"] .abl-progress {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .abl-panel[data-size="micro"] .abl-note,
      .abl-panel[data-size="micro"] .abl-rule,
      .abl-panel[data-size="micro"] .abl-slider-label,
      .abl-panel[data-size="micro"] .abl-slider-value {
        font-size: 10px;
      }

      .abl-scene[data-show-parts="false"] .abl-float-label.part {
        display: none;
      }

      .abl-scene[data-compact-view="true"] .abl-float-label.part {
        display: none;
      }

      @media (max-width: 720px), (max-height: 560px) {
        .abl-board {
          inset: 10px;
          gap: 8px;
        }

        .abl-status {
          left: 10px;
          top: 10px;
        }

        .abl-chip {
          padding: 5px 7px;
          font-size: 10px;
        }

        .abl-formulas {
          grid-template-columns: 1fr;
          min-height: 0;
        }

        .abl-formula-card {
          padding: 8px;
        }

        .abl-formula-card:first-child {
          display: none;
        }

        .abl-float-label {
          font-size: 10px;
          padding: 3px 6px;
        }
      }

      @keyframes ablPop {
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
    scene.className = "abl-scene";
    scene.innerHTML = `
      <div class="abl-board">
        <section class="abl-sandbox" aria-label="角的度量与角平分线模拟区">
          <div class="abl-status">
            <div class="abl-chip">场景 <strong data-scene-status></strong></div>
            <div class="abl-chip">∠AOB <strong data-aob-status></strong></div>
            <div class="abl-chip"><span data-secondary-ray-label>OA</span> <strong data-oc-status></strong></div>
          </div>
          <div class="abl-stage" data-stage>
            <div class="abl-world" data-world>
              <svg class="abl-svg" data-svg aria-hidden="true"></svg>
              <div class="abl-overlay" data-overlay></div>
            </div>
          </div>
          <div class="abl-particles" data-particles></div>
        </section>
        <section class="abl-formulas" aria-label="几何算式">
          <div class="abl-formula-card">
            <div class="abl-formula-label">当前关系</div>
            <div class="abl-formula-value" data-relation>∠AOB = 120°</div>
            <div class="abl-formula-note" data-values-note>拖动射线观察角度变化。</div>
          </div>
          <div class="abl-formula-card is-main">
            <div class="abl-formula-label">结论板书</div>
            <div class="abl-formula-value" data-proof>对中 · 对线 · 读数</div>
            <div class="abl-formula-note" data-proof-note>角度测量来自量角器刻度。</div>
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
    panel.className = "abl-panel";
    const tabs = Object.entries(SCENES).map(([id, item]) => `
      <button class="abl-tab" type="button" data-scene="${id}">${escapeHtml(item.label)}</button>
    `).join("");
    panel.innerHTML = `
      <div class="abl-panel-card">
        <div class="abl-panel-head"><span>教学场景</span><span data-panel-badge>量角器读数</span></div>
        <div class="abl-scene-tabs">${tabs}</div>
      </div>
      <div class="abl-panel-card">
        <div class="abl-panel-head"><span>教学演示</span><span data-action-badge>第 1/4 步</span></div>
        <div class="abl-action-grid">
          <button class="abl-button primary" type="button" data-step>下一步讲解</button>
          <button class="abl-button primary" type="button" data-protractor>呼出量角器</button>
          <button class="abl-button primary" type="button" data-align>自动对齐</button>
          <button class="abl-button success" type="button" data-fold>折叠演示</button>
          <button class="abl-button" type="button" data-reset>重置</button>
          <button class="abl-button" type="button" data-view-reset>回正视图</button>
        </div>
      </div>
      <div class="abl-panel-card">
        <div class="abl-panel-head"><span>角度调节</span><span data-angle-badge>度</span></div>
        <div class="abl-slider-row">
          <span class="abl-slider-label">总角 AOB</span>
          <input class="abl-range" type="range" min="20" max="160" step="1" value="120" data-aob-range>
          <span class="abl-slider-value" data-aob-value>120°</span>
        </div>
        <div class="abl-slider-row" data-oc-row>
          <span class="abl-slider-label">动射线 OC</span>
          <input class="abl-range" type="range" min="8" max="112" step="1" value="42" data-oc-range>
          <span class="abl-slider-value" data-oc-value>42°</span>
        </div>
      </div>
      <div class="abl-panel-card">
        <div class="abl-panel-head"><span>实时读数</span><span data-values-badge>角度</span></div>
        <div class="abl-value-grid">
          <div class="abl-value-cell"><span>∠AOB</span><span data-val-aob>120°</span></div>
          <div class="abl-value-cell"><span>∠AOC</span><span data-val-aoc>42°</span></div>
          <div class="abl-value-cell"><span>∠COB</span><span data-val-cob>78°</span></div>
          <div class="abl-value-cell"><span>∠AOM</span><span data-val-aom>21°</span></div>
          <div class="abl-value-cell"><span>∠CON</span><span data-val-con>39°</span></div>
          <div class="abl-value-cell"><span>∠MON</span><span data-val-mon>60°</span></div>
        </div>
      </div>
      <div class="abl-panel-card">
        <div class="abl-panel-head"><span>讲解提示</span><span data-tip-badge>当前结论</span></div>
        <div class="abl-progress" data-progress>
          <span class="abl-progress-step" data-step-indicator="0">观察</span>
          <span class="abl-progress-step" data-step-indicator="1">标关系</span>
          <span class="abl-progress-step" data-step-indicator="2">代入</span>
          <span class="abl-progress-step" data-step-indicator="3">结论</span>
        </div>
        <div class="abl-note" data-note>拖动射线 OB，观察角度变化。</div>
        <div class="abl-rule" data-rule>∠AOB = 120°</div>
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
      sceneId: "measure",
      aob: 120,
      oc: 42,
      showProtractor: false,
      protractorAligned: false,
      protractor: {
        x: 0,
        y: 0,
        rotation: -18,
        initialized: false,
        startX: 0,
        startY: 0
      },
      animating: false,
      foldProgress: 0,
      message: "",
      teachStep: 0,
      focusKey: "",
      pointer: {
        mode: null,
        id: null,
        startX: 0,
        startY: 0,
        lastX: 0,
        lastY: 0
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
      animationFrame: 0
    };

    const refs = {
      scene,
      panel,
      sandbox: scene.querySelector(".abl-sandbox"),
      stage: scene.querySelector("[data-stage]"),
      world: scene.querySelector("[data-world]"),
      svg: scene.querySelector("[data-svg]"),
      overlay: scene.querySelector("[data-overlay]"),
      particles: scene.querySelector("[data-particles]"),
      sceneStatus: scene.querySelector("[data-scene-status]"),
      aobStatus: scene.querySelector("[data-aob-status]"),
      secondaryRayLabel: scene.querySelector("[data-secondary-ray-label]"),
      ocStatus: scene.querySelector("[data-oc-status]"),
      relation: scene.querySelector("[data-relation]"),
      proof: scene.querySelector("[data-proof]"),
      valuesNote: scene.querySelector("[data-values-note]"),
      proofNote: scene.querySelector("[data-proof-note]"),
      tabs: panel ? [...panel.querySelectorAll("[data-scene]")] : [],
      panelBadge: panel?.querySelector("[data-panel-badge]"),
      actionBadge: panel?.querySelector("[data-action-badge]"),
      aobRange: panel?.querySelector("[data-aob-range]"),
      ocRange: panel?.querySelector("[data-oc-range]"),
      ocRow: panel?.querySelector("[data-oc-row]"),
      aobValue: panel?.querySelector("[data-aob-value]"),
      ocValue: panel?.querySelector("[data-oc-value]"),
      note: panel?.querySelector("[data-note]"),
      rule: panel?.querySelector("[data-rule]"),
      stepButton: panel?.querySelector("[data-step]"),
      protractorButton: panel?.querySelector("[data-protractor]"),
      alignButton: panel?.querySelector("[data-align]"),
      foldButton: panel?.querySelector("[data-fold]"),
      actionButtons: panel ? [...panel.querySelectorAll(".abl-action-grid button")] : [],
      progressSteps: panel ? [...panel.querySelectorAll("[data-step-indicator]")] : [],
      valueCells: panel ? [...panel.querySelectorAll(".abl-value-cell")] : []
    };

    [container, scene, refs.sandbox, panel, panelHost].forEach(target => blockNativeMenus(target, cleanups));
    panel?.querySelectorAll("button, div, span").forEach(node => node.setAttribute("draggable", "false"));
    scene.querySelectorAll("div, span, svg").forEach(node => node.setAttribute("draggable", "false"));

    function addCleanup(target, type, handler, options) {
      if (!target) return;
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

    function fmt(value) {
      return `${Math.round(value)}°`;
    }

    function currentScene() {
      return SCENES[state.sceneId] || SCENES.measure;
    }

    function values() {
      const aob = state.aob;
      const oc = state.sceneId === "bisector" ? aob / 2 : clamp(state.oc, 8, aob - 8);
      const aoc = state.sceneId === "bisector" ? aob / 2 : oc;
      const cob = aob - aoc;
      const aom = aoc / 2;
      const moc = aoc / 2;
      const con = cob / 2;
      const nob = cob / 2;
      const mon = aob / 2;
      return { aob, oc, aoc, cob, aom, moc, con, nob, mon };
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

    function geometry() {
      const rect = refs.sandbox.getBoundingClientRect();
      const width = Math.max(320, rect.width || 720);
      const height = Math.max(260, rect.height || 460);
      const scale = clamp(Math.min(width * 0.34, height * 0.43), 108, 235);
      const cx = clamp(width * 0.43, scale + 34, width - scale * 0.72);
      const cy = clamp(height * 0.68, scale + 58, height - 50);
      return { width, height, cx, cy, r: scale };
    }

    function worldPoint(clientX, clientY) {
      const rect = refs.sandbox.getBoundingClientRect();
      return {
        x: (clientX - rect.left - rect.width / 2 - state.view.x) / state.view.zoom + rect.width / 2,
        y: (clientY - rect.top - rect.height / 2 - state.view.y) / state.view.zoom + rect.height / 2
      };
    }

    function angleFromPoint(point, g) {
      const deg = Math.atan2(-(point.y - g.cy), point.x - g.cx) * 180 / Math.PI;
      return deg < 0 ? deg + 360 : deg;
    }

    function pointAt(g, angle, r = g.r) {
      const rad = angle * Math.PI / 180;
      return {
        x: g.cx + r * Math.cos(rad),
        y: g.cy - r * Math.sin(rad)
      };
    }

    function resetProtractorPosition() {
      state.protractor.x = 0;
      state.protractor.y = 0;
      state.protractor.rotation = -18;
      state.protractor.initialized = false;
      state.protractor.startX = 0;
      state.protractor.startY = 0;
      state.protractorAligned = false;
    }

    function setDefaultProtractorPosition(g) {
      state.protractor.x = g.cx - Math.min(52, g.r * 0.28);
      state.protractor.y = g.cy - Math.min(82, g.r * 0.46);
      state.protractor.rotation = -18;
      state.protractor.initialized = true;
    }

    function setAlignedProtractorPosition(g) {
      state.protractor.x = g.cx;
      state.protractor.y = g.cy;
      state.protractor.rotation = 0;
      state.protractor.initialized = true;
      state.protractorAligned = true;
    }

    function ensureProtractorPosition(g) {
      if (state.protractorAligned) {
        setAlignedProtractorPosition(g);
        return;
      }
      if (!state.protractor.initialized) setDefaultProtractorPosition(g);
      const margin = Math.min(220, g.r * 1.1);
      state.protractor.x = clamp(state.protractor.x, -margin, g.width + margin);
      state.protractor.y = clamp(state.protractor.y, -margin, g.height + margin);
    }

    function svgEl(name) {
      return document.createElementNS("http://www.w3.org/2000/svg", name);
    }

    function clearGeometry() {
      refs.svg.innerHTML = "";
      refs.overlay.innerHTML = "";
      refs.svg.setAttribute("viewBox", `0 0 ${Math.max(320, refs.sandbox.clientWidth || 720)} ${Math.max(260, refs.sandbox.clientHeight || 460)}`);
    }

    function sectorPath(g, start, end, r) {
      const p1 = pointAt(g, start, r);
      const p2 = pointAt(g, end, r);
      const large = Math.abs(end - start) > 180 ? 1 : 0;
      return `M ${g.cx} ${g.cy} L ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} 0 ${p2.x} ${p2.y} Z`;
    }

    function drawSector(g, start, end, r, klass) {
      const path = svgEl("path");
      path.setAttribute("class", `abl-sector ${klass}`);
      path.setAttribute("d", sectorPath(g, start, end, r));
      refs.svg.appendChild(path);
    }

    function arcPath(g, start, end, r) {
      const p1 = pointAt(g, start, r);
      const p2 = pointAt(g, end, r);
      const large = Math.abs(end - start) > 180 ? 1 : 0;
      return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} 0 ${p2.x} ${p2.y}`;
    }

    function drawArcMark(g, start, end, r, klass) {
      const path = svgEl("path");
      path.setAttribute("class", klass);
      path.setAttribute("d", arcPath(g, start, end, r));
      refs.svg.appendChild(path);
    }

    function drawRay(g, angle, klass, options = {}) {
      const p = pointAt(g, angle, options.r || g.r);
      const line = svgEl("line");
      line.setAttribute("class", `abl-ray ${klass}`);
      line.setAttribute("x1", String(g.cx));
      line.setAttribute("y1", String(g.cy));
      line.setAttribute("x2", String(p.x));
      line.setAttribute("y2", String(p.y));
      refs.svg.appendChild(line);
      return p;
    }

    function drawGuideLine(x1, y1, x2, y2) {
      const line = svgEl("line");
      line.setAttribute("class", "abl-guide-line");
      line.setAttribute("x1", String(x1));
      line.setAttribute("y1", String(y1));
      line.setAttribute("x2", String(x2));
      line.setAttribute("y2", String(y2));
      refs.svg.appendChild(line);
    }

    function label(x, y, text, klass) {
      const node = document.createElement("div");
      node.className = `abl-float-label ${klass}`;
      node.textContent = text;
      node.style.left = `${clamp(x, 54, Math.max(320, refs.sandbox.clientWidth || 720) - 54)}px`;
      node.style.top = `${clamp(y, 34, Math.max(260, refs.sandbox.clientHeight || 460) - 34)}px`;
      refs.overlay.appendChild(node);
    }

    function badge(x, y, text) {
      const node = document.createElement("div");
      node.className = "abl-constant-lock";
      node.textContent = text;
      node.style.left = `${clamp(x, 80, Math.max(320, refs.sandbox.clientWidth || 720) - 80)}px`;
      node.style.top = `${clamp(y, 44, Math.max(260, refs.sandbox.clientHeight || 460) - 44)}px`;
      refs.overlay.appendChild(node);
    }

    function point(name, x, y, draggable, dragType, offsetY = -16) {
      const group = svgEl("g");
      group.setAttribute("class", `abl-point-wrap ${draggable ? "is-draggable" : ""}`);
      if (draggable) group.setAttribute("data-drag", dragType);

      if (draggable) {
        const hit = svgEl("circle");
        hit.setAttribute("class", "abl-point-hit");
        hit.setAttribute("cx", String(x));
        hit.setAttribute("cy", String(y));
        hit.setAttribute("r", "48");
        group.appendChild(hit);
      }

      const halo = svgEl("circle");
      halo.setAttribute("class", "abl-point-halo");
      halo.setAttribute("cx", String(x));
      halo.setAttribute("cy", String(y));
      halo.setAttribute("r", draggable ? "18" : "15");
      group.appendChild(halo);

      const dot = svgEl("circle");
      dot.setAttribute("class", "abl-point");
      dot.setAttribute("cx", String(x));
      dot.setAttribute("cy", String(y));
      dot.setAttribute("r", draggable ? "7" : "6");
      group.appendChild(dot);

      const text = svgEl("text");
      text.setAttribute("class", "abl-point-label");
      text.setAttribute("x", String(x));
      text.setAttribute("y", String(y + offsetY));
      text.textContent = name;
      group.appendChild(text);
      refs.svg.appendChild(group);
    }

    function mark(text, x, y) {
      const node = document.createElement("span");
      node.className = "abl-demo-mark";
      node.textContent = text;
      node.style.left = `${x}px`;
      node.style.top = `${y}px`;
      refs.particles.appendChild(node);
      setTimer(() => node.remove(), 900);
    }

    function createProtractor(g, v) {
      if (!state.showProtractor) return;
      ensureProtractorPosition(g);
      const group = svgEl("g");
      group.setAttribute("class", "abl-protractor");
      group.setAttribute("data-drag", "protractor");
      group.setAttribute("aria-label", "拖动量角器");
      const r = Math.min(g.r * 1.02, 190);
      const px = state.protractor.x;
      const py = state.protractor.y;
      const rot = state.protractor.rotation;
      group.setAttribute("transform", `translate(${px}, ${py}) rotate(${rot})`);

      const hit = svgEl("path");
      hit.setAttribute("class", "abl-protractor-hit");
      hit.setAttribute("d", `M ${-r - 30} ${r * 0.16} L ${r + 30} ${r * 0.16} L ${r + 30} ${-r - 30} L ${-r - 30} ${-r - 30} Z`);
      group.appendChild(hit);

      const body = svgEl("path");
      body.setAttribute("class", "abl-protractor-glass");
      body.setAttribute("d", `M ${-r} 0 L ${r} 0 A ${r} ${r} 0 0 0 ${-r} 0 Z`);
      group.appendChild(body);

      [0.9, 0.72, 0.28].forEach(k => {
        const ring = svgEl("path");
        const rr = r * k;
        ring.setAttribute("class", "abl-protractor-ring");
        ring.setAttribute("d", `M ${-rr} 0 A ${rr} ${rr} 0 0 0 ${rr} 0`);
        group.appendChild(ring);
      });

      for (let i = 0; i <= 180; i += 2) {
        const rad = i * Math.PI / 180;
        const major = i % 10 === 0;
        const inner = r * (major ? 0.79 : i % 5 === 0 ? 0.84 : 0.87);
        const outer = r * 0.91;
        const tick = svgEl("line");
        tick.setAttribute("class", `abl-protractor-tick ${major ? "" : "minor"}`);
        tick.setAttribute("x1", String(Math.cos(rad) * inner));
        tick.setAttribute("y1", String(-Math.sin(rad) * inner));
        tick.setAttribute("x2", String(Math.cos(rad) * outer));
        tick.setAttribute("y2", String(-Math.sin(rad) * outer));
        group.appendChild(tick);

        if (major) {
          const text = svgEl("text");
          const tr = r * 0.67;
          text.setAttribute("class", "abl-protractor-text");
          text.setAttribute("x", String(Math.cos(rad) * tr));
          text.setAttribute("y", String(-Math.sin(rad) * tr));
          text.textContent = String(i);
          group.appendChild(text);
        }
      }

      const center = svgEl("circle");
      center.setAttribute("class", "abl-protractor-ring");
      center.setAttribute("cx", "0");
      center.setAttribute("cy", "0");
      center.setAttribute("r", "12");
      group.appendChild(center);

      if (state.protractorAligned) {
        const target = svgEl("circle");
        const p = {
          x: Math.cos(v.aob * Math.PI / 180) * r * 0.86,
          y: -Math.sin(v.aob * Math.PI / 180) * r * 0.86
        };
        target.setAttribute("class", "abl-protractor-target");
        target.setAttribute("cx", String(p.x));
        target.setAttribute("cy", String(p.y));
        target.setAttribute("r", "15");
        group.appendChild(target);
      }

      refs.svg.appendChild(group);
    }

    function renderMeasure(g, v) {
      drawSector(g, 0, v.aob, g.r * 0.34, "aob");
      createProtractor(g, v);
      const pA = drawRay(g, 0, "oa");
      const pB = drawRay(g, v.aob, "ob");
      const labelPoint = pointAt(g, v.aob / 2, g.r * 0.46);
      label(labelPoint.x, labelPoint.y, `∠AOB=${fmt(v.aob)}`, "aob");
      if (state.protractorAligned) {
        const readInner = pointAt(g, v.aob, g.r * 0.45);
        const readOuter = pointAt(g, v.aob, Math.min(g.r * 0.88, 200));
        drawGuideLine(readInner.x, readInner.y, readOuter.x, readOuter.y);
        label(readOuter.x, readOuter.y - 18, `读数 ${fmt(v.aob)}`, "read");
        label(g.cx + Math.min(g.r * 0.44, 98), g.cy + 26, "0° 对齐 OA", "read");
      }
      point("O", g.cx, g.cy, false, "", 24);
      point("A", pA.x, pA.y, false, "", -14);
      point("B", pB.x, pB.y, true, "aob", -14);
    }

    function renderBisector(g, v) {
      const mid = v.aob / 2;
      const foldedB = state.animating ? v.aob - state.foldProgress * v.aob : v.aob;
      drawSector(g, 0, mid, g.r * 0.29, "left");
      drawSector(g, mid, state.animating ? foldedB : v.aob, g.r * 0.29, "right");
      const pA = drawRay(g, 0, "oa");
      const pB = drawRay(g, state.animating ? foldedB : v.aob, state.animating ? "fold" : "ob");
      const pC = drawRay(g, mid, "bisector", { r: g.r * 0.95 });
      drawArcMark(g, Math.max(3, mid * 0.18), Math.max(8, mid * 0.38), g.r * 0.38, "abl-equal-mark");
      drawArcMark(g, mid + Math.max(3, mid * 0.18), mid + Math.max(8, mid * 0.38), g.r * 0.38, "abl-equal-mark");
      label(pointAt(g, mid / 2, g.r * 0.5).x, pointAt(g, mid / 2, g.r * 0.5).y, `∠AOC=${fmt(v.aob / 2)}`, "left");
      label(pointAt(g, mid + mid / 2, g.r * 0.56).x, pointAt(g, mid + mid / 2, g.r * 0.56).y, `∠COB=${fmt(v.aob / 2)}`, "right");
      label(pointAt(g, mid, g.r * 0.24).x, pointAt(g, mid, g.r * 0.24).y, "等角标记", "equal");
      if (state.animating) {
        const foldLabel = pointAt(g, mid, g.r * 0.66);
        label(foldLabel.x, foldLabel.y, "沿 OC 对折", "mon");
      }
      point("O", g.cx, g.cy, false, "", 24);
      point("A", pA.x, pA.y, false, "", -14);
      point("B", pB.x, pB.y, !state.animating, "aob", -14);
      point("C", pC.x, pC.y, false, "", -14);
    }

    function renderDual(g, v) {
      const om = v.aoc / 2;
      const on = v.aoc + v.cob / 2;
      drawSector(g, 0, v.aoc, g.r * 0.33, "left");
      drawSector(g, v.aoc, v.aob, g.r * 0.33, "right");
      drawSector(g, om, on, g.r * 0.22, "mon");
      const pA = drawRay(g, 0, "oa");
      const pB = drawRay(g, v.aob, "ob");
      const pC = drawRay(g, v.aoc, "oc", { r: g.r * 0.94 });
      const pM = drawRay(g, om, "om", { r: g.r * 0.86 });
      const pN = drawRay(g, on, "on", { r: g.r * 0.86 });
      drawArcMark(g, om, v.aoc, g.r * 0.38, "abl-half-mark");
      drawArcMark(g, v.aoc, on, g.r * 0.44, "abl-half-mark");
      const aocLabel = pointAt(g, v.aoc / 2, g.r * 0.5);
      const cobLabel = pointAt(g, v.aoc + v.cob * 0.63, g.r * 0.6);
      const monLabel = pointAt(g, (om + on) / 2, g.r * 0.27);
      const mocLabel = pointAt(g, (om + v.aoc) / 2, g.r * 0.41);
      const conLabel = pointAt(g, (v.aoc + on) / 2, g.r * 0.49);
      label(aocLabel.x + 10, aocLabel.y + 10, `∠AOC=${fmt(v.aoc)}`, "left");
      label(cobLabel.x - 14, cobLabel.y - 8, `∠COB=${fmt(v.cob)}`, "right");
      label(monLabel.x, monLabel.y + 8, `∠MON=${fmt(v.mon)}`, "mon");
      label(mocLabel.x + 6, mocLabel.y + 16, `MOC=${fmt(v.moc)}`, "part");
      label(conLabel.x - 6, conLabel.y - 16, `CON=${fmt(v.con)}`, "part");
      badge(g.cx + g.r * 0.34, g.cy - g.r * 1.04, `恒定 ∠MON=${fmt(v.mon)}`);
      point("O", g.cx, g.cy, false, "", 24);
      point("A", pA.x, pA.y, false, "", -14);
      point("B", pB.x, pB.y, true, "aob", -14);
      point("C", pC.x, pC.y, true, "oc", -14);
      point("M", pM.x, pM.y, false, "", -14);
      point("N", pN.x, pN.y, false, "", -14);
    }

    function relationHtml(v) {
      if (state.sceneId === "measure") return `∠AOB = ${fmt(v.aob)}`;
      if (state.sceneId === "bisector") return `∠AOC = ∠COB = ${fmt(v.aob / 2)}`;
      return `∠MON = 1/2∠AOB = ${fmt(v.mon)}`;
    }

    function proofHtml(v) {
      if (state.sceneId === "measure") {
        return state.protractorAligned ? `对中 · 对线 · 读数 ${fmt(v.aob)}` : "量角器三步：对中 · 对线 · 读数";
      }
      if (state.sceneId === "bisector") {
        return `∠AOC = ∠COB = ${fmt(v.aob / 2)}`;
      }
      return `∠MON = 1/2 × ${fmt(v.aob)} = ${fmt(v.mon)}`;
    }

    function valueItems(v) {
      if (state.sceneId === "measure") {
        return [
          ["∠AOB", fmt(v.aob)],
          ["始边", "OA"],
          ["终边", "OB"],
          ["中心", "O"],
          ["零刻度", state.protractorAligned ? "已对齐" : "未对齐"],
          ["读数", fmt(v.aob)]
        ];
      }
      if (state.sceneId === "bisector") {
        return [
          ["∠AOB", fmt(v.aob)],
          ["∠AOC", fmt(v.aob / 2)],
          ["∠COB", fmt(v.aob / 2)],
          ["1/2∠AOB", fmt(v.aob / 2)],
          ["2∠AOC", fmt(v.aob)],
          ["2∠COB", fmt(v.aob)]
        ];
      }
      return [
        ["∠AOC", fmt(v.aoc)],
        ["∠COB", fmt(v.cob)],
        ["∠MOC", fmt(v.moc)],
        ["∠CON", fmt(v.con)],
        ["∠MON", fmt(v.mon)],
        ["1/2∠AOB", fmt(v.mon)]
      ];
    }

    function teachingSteps(v) {
      if (state.sceneId === "measure") {
        return [
          { focus: "", note: "先观察角的三要素：顶点 O、始边 OA、终边 OB。", rule: `∠AOB = ${fmt(v.aob)}` },
          { focus: "protractor", note: "呼出量角器：中心要对准顶点 O。", rule: "中心点重合" },
          { focus: "align", note: "自动对齐：零刻度线与始边 OA 重合。", rule: "零刻度线重合 OA" },
          { focus: "read", note: `读取终边 OB 指向的刻度，得到 ∠AOB=${fmt(v.aob)}。`, rule: `读数：∠AOB = ${fmt(v.aob)}` }
        ];
      }
      if (state.sceneId === "bisector") {
        return [
          { focus: "", note: "先观察 OC 从顶点 O 出发，落在角的内部。", rule: "OC 是 ∠AOB 的平分线" },
          { focus: "equal", note: "OC 把 ∠AOB 分成两个相等的角。", rule: "∠AOC = ∠COB" },
          { focus: "half", note: `代入当前总角：${fmt(v.aob)} 的一半是 ${fmt(v.aob / 2)}。`, rule: `1/2∠AOB = ${fmt(v.aob / 2)}` },
          { focus: "result", note: "结论：角平分线上的两侧角相等，每个半角等于总角的一半。", rule: `∠AOC = ∠COB = ${fmt(v.aob / 2)}` }
        ];
      }
      return [
        { focus: "", note: "先拖动内部射线 OC，观察 ∠AOC 与 ∠COB 一增一减。", rule: `∠AOC + ∠COB = ∠AOB` },
        { focus: "bisectors", note: "OM 平分 ∠AOC，ON 平分 ∠COB。", rule: "∠MOC=1/2∠AOC，∠CON=1/2∠COB" },
        { focus: "sum", note: "把中间两段半角相加：∠MON = ∠MOC + ∠CON。", rule: "∠MON = 1/2∠AOC + 1/2∠COB" },
        { focus: "constant", note: `所以 ∠MON 始终等于总角的一半：${fmt(v.mon)}。`, rule: `∠MON = 1/2∠AOB = ${fmt(v.mon)}` }
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
      if (state.focusKey === "protractor") {
        state.showProtractor = true;
        state.protractorAligned = false;
      }
      if (state.focusKey === "align") {
        state.showProtractor = true;
        setAlignedProtractorPosition(geometry());
      }
      if (options.clearMessage !== false) state.message = "";
    }

    function advanceTeachingStep() {
      if (state.animating) return;
      const steps = teachingSteps(values());
      const next = state.teachStep >= steps.length - 1 ? 0 : state.teachStep + 1;
      if (next === 0 && state.sceneId === "measure") resetProtractorPosition();
      setTeachingStep(next);
      render();
    }

    function render() {
      if (state.disposed) return;
      const g = geometry();
      const v = values();
      clearGeometry();
      refs.scene.dataset.compactView = String(g.width < 520 || g.height < 430);
      refs.scene.dataset.showParts = String(state.sceneId === "dual" && ["bisectors", "sum", "constant"].includes(state.focusKey));
      if (state.sceneId !== "measure") resetProtractorPosition();
      if (state.sceneId === "measure") renderMeasure(g, v);
      else if (state.sceneId === "bisector") renderBisector(g, v);
      else renderDual(g, v);
      updatePanel();
    }

    function updatePanel() {
      const v = values();
      const info = currentScene();
      const step = currentTeachingStep(v);
      refs.sceneStatus.textContent = info.label;
      refs.aobStatus.textContent = fmt(v.aob);
      if (refs.secondaryRayLabel) refs.secondaryRayLabel.textContent = state.sceneId === "measure" ? "OA" : "OC";
      refs.ocStatus.textContent = state.sceneId === "dual" ? fmt(v.aoc) : state.sceneId === "measure" ? "OB" : "平分";
      refs.relation.innerHTML = relationHtml(v);
      refs.proof.innerHTML = proofHtml(v);
      refs.valuesNote.textContent = info.detail;
      refs.proofNote.textContent = info.formula;
      refs.tabs.forEach(tab => tab.classList.toggle("is-active", tab.dataset.scene === state.sceneId));
      if (refs.panelBadge) refs.panelBadge.textContent = info.badge;
      if (refs.actionBadge) refs.actionBadge.textContent = state.animating ? "演示中" : `第 ${step.index + 1}/${step.total} 步`;
      if (refs.aobRange) refs.aobRange.value = String(state.aob);
      if (refs.ocRange) {
        refs.ocRange.max = String(Math.max(9, state.aob - 8));
        refs.ocRange.value = String(clamp(state.oc, 8, state.aob - 8));
      }
      if (refs.aobValue) refs.aobValue.textContent = fmt(state.aob);
      if (refs.ocValue) refs.ocValue.textContent = fmt(clamp(state.oc, 8, state.aob - 8));
      refs.ocRow?.classList.toggle("is-hidden", state.sceneId !== "dual");
      if (refs.note) refs.note.textContent = state.message || step.note;
      if (refs.rule) refs.rule.textContent = step.rule || info.formula;

      valueItems(v).forEach((item, index) => {
        const cell = refs.valueCells[index];
        if (!cell) return;
        const labelNode = cell.querySelector("span:first-child");
        const valueNode = cell.querySelector("span:last-child");
        if (labelNode) labelNode.textContent = item[0];
        if (valueNode) valueNode.textContent = item[1];
      });

      const isMeasure = state.sceneId === "measure";
      const isBisector = state.sceneId === "bisector";
      if (refs.protractorButton) {
        refs.protractorButton.classList.toggle("is-hidden", !isMeasure);
        refs.protractorButton.textContent = state.showProtractor ? "收回量角器" : "呼出量角器";
        refs.protractorButton.disabled = state.animating || !isMeasure;
      }
      if (refs.alignButton) {
        refs.alignButton.classList.toggle("is-hidden", !isMeasure || !state.showProtractor);
        refs.alignButton.disabled = state.animating || !isMeasure || !state.showProtractor || state.protractorAligned;
      }
      if (refs.foldButton) {
        refs.foldButton.classList.toggle("is-hidden", !isBisector);
        refs.foldButton.disabled = state.animating || !isBisector;
      }
      if (refs.stepButton) refs.stepButton.disabled = state.animating;
      refs.actionButtons.forEach(button => {
        if (button.dataset.protractor !== undefined || button.dataset.align !== undefined || button.dataset.fold !== undefined || button.dataset.step !== undefined) return;
        button.disabled = state.animating;
      });
      refs.progressSteps.forEach(node => {
        const index = Number.parseInt(node.dataset.stepIndicator || "0", 10);
        node.classList.toggle("is-active", index === step.index);
        node.classList.toggle("is-done", index < step.index);
      });
      if (refs.aobRange) refs.aobRange.disabled = state.animating;
      if (refs.ocRange) refs.ocRange.disabled = state.animating || state.sceneId !== "dual";
      refs.tabs.forEach(tab => { tab.disabled = state.animating; });
      fitPanel(panel);
    }

    function setScene(sceneId) {
      if (!SCENES[sceneId] || state.animating) return;
      state.sceneId = sceneId;
      state.message = "";
      state.foldProgress = 0;
      state.showProtractor = false;
      resetProtractorPosition();
      state.oc = clamp(state.oc, 8, state.aob - 8);
      setTeachingStep(0);
      render();
    }

    function resetDemo() {
      if (state.animating) return;
      state.aob = 120;
      state.oc = 42;
      state.showProtractor = false;
      resetProtractorPosition();
      state.foldProgress = 0;
      setTeachingStep(0);
      resetView();
      render();
    }

    function toggleProtractor() {
      if (state.animating || state.sceneId !== "measure") return;
      state.showProtractor = !state.showProtractor;
      resetProtractorPosition();
      state.message = state.showProtractor ? "量角器已呼出：先把中心对准顶点 O。" : "量角器已收回。";
      render();
    }

    function alignProtractor() {
      if (state.animating || state.sceneId !== "measure" || !state.showProtractor) return;
      state.animating = true;
      state.message = "自动对齐中：中心对准 O，零刻度线重合 OA。";
      render();
      setTimer(() => {
        if (state.disposed) return;
        setAlignedProtractorPosition(geometry());
        state.animating = false;
        state.message = `读终边 OB 指向的刻度：∠AOB=${fmt(state.aob)}。`;
        render();
      }, 850);
    }

    function playFold() {
      if (state.animating || state.sceneId !== "bisector") return;
      state.animating = true;
      state.foldProgress = 0;
      state.message = "沿角平分线 OC 对折，观察两边角重合。";
      const start = performance.now();
      const duration = 1250;
      const tick = now => {
        if (state.disposed) return;
        const raw = clamp((now - start) / duration, 0, 1);
        state.foldProgress = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;
        render();
        if (raw < 1) {
          state.animationFrame = requestAnimationFrame(tick);
        } else {
          setTimer(() => {
            if (state.disposed) return;
            state.animating = false;
            state.foldProgress = 0;
            state.message = "折叠后两侧完全重合，所以两个半角相等。";
            render();
          }, 520);
        }
      };
      state.animationFrame = requestAnimationFrame(tick);
    }

    function activePointers(event) {
      return [...(event.currentTarget.__ablPointers || new Map()).values()];
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

    refs.stage.__ablPointers = new Map();

    function onPointerDown(event) {
      if (state.disposed || state.animating) return;
      event.preventDefault();
      refs.stage.setPointerCapture?.(event.pointerId);
      refs.stage.__ablPointers.set(event.pointerId, event);
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

      const dragNode = event.target.closest?.("[data-drag]");
      state.pointer.id = event.pointerId;
      state.pointer.startX = event.clientX;
      state.pointer.startY = event.clientY;
      state.pointer.lastX = event.clientX;
      state.pointer.lastY = event.clientY;

      if (dragNode) {
        if (dragNode.dataset.drag === "protractor" && state.sceneId === "measure" && state.showProtractor) {
          ensureProtractorPosition(geometry());
          state.pointer.mode = "drag-protractor";
          state.protractorAligned = false;
          state.protractor.startX = state.protractor.x;
          state.protractor.startY = state.protractor.y;
          state.message = "拖动量角器：中心对准 O，底边贴合 OA 后再读数。";
        } else {
          state.pointer.mode = dragNode.dataset.drag === "oc" && state.sceneId === "dual" ? "drag-oc" : "drag-aob";
        }
        dragNode.classList.add("is-dragging");
        return;
      }

      state.pointer.mode = "pan";
      refs.stage.classList.add("is-panning");
    }

    function onPointerMove(event) {
      const pointerMap = refs.stage.__ablPointers;
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

      if (state.pointer.mode === "drag-protractor") {
        const g = geometry();
        const margin = Math.min(220, g.r * 1.1);
        const dx = (event.clientX - state.pointer.startX) / state.view.zoom;
        const dy = (event.clientY - state.pointer.startY) / state.view.zoom;
        state.protractor.x = clamp(state.protractor.startX + dx, -margin, g.width + margin);
        state.protractor.y = clamp(state.protractor.startY + dy, -margin, g.height + margin);
        state.protractor.rotation = -18;
        state.protractor.initialized = true;
        state.protractorAligned = false;
        state.teachStep = 1;
        state.focusKey = "protractor";
        state.message = "拖动量角器：中心对准 O，底边贴合 OA 后再读数。";
        render();
        return;
      }

      if (state.pointer.mode === "drag-aob" || state.pointer.mode === "drag-oc") {
        const g = geometry();
        const pointPos = worldPoint(event.clientX, event.clientY);
        const angle = Math.round(angleFromPoint(pointPos, g));
        if (state.pointer.mode === "drag-aob") {
          state.aob = clamp(angle, 20, 160);
          state.oc = clamp(state.oc, 8, state.aob - 8);
          state.message = "拖动终边 OB，∠AOB 的读数同步变化。";
        } else {
          state.oc = clamp(angle, 8, state.aob - 8);
          state.message = "拖动内部射线 OC，∠AOC 与 ∠COB 一增一减，∠MON 保持恒定。";
        }
        state.teachStep = 0;
        state.focusKey = "";
        render();
      }
    }

    function endPointer(event) {
      const pointerMap = refs.stage.__ablPointers;
      pointerMap?.delete(event.pointerId);
      refs.stage.releasePointerCapture?.(event.pointerId);
      refs.world.classList.remove("is-manipulating");
      refs.stage.classList.remove("is-panning");
      refs.svg.querySelectorAll(".abl-point-wrap.is-dragging").forEach(node => node.classList.remove("is-dragging"));
      refs.svg.querySelectorAll(".abl-protractor.is-dragging").forEach(node => node.classList.remove("is-dragging"));
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
        if (event.target.closest("[data-step]")) {
          advanceTeachingStep();
          return;
        }
        if (event.target.closest("[data-protractor]")) {
          toggleProtractor();
          return;
        }
        if (event.target.closest("[data-align]")) {
          alignProtractor();
          return;
        }
        if (event.target.closest("[data-fold]")) {
          playFold();
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

      addCleanup(refs.aobRange, "input", event => {
        if (state.animating) return;
        state.aob = clamp(Number.parseFloat(event.target.value) || 120, 20, 160);
        state.oc = clamp(state.oc, 8, state.aob - 8);
        state.teachStep = 0;
        state.focusKey = "";
        state.message = "总角 ∠AOB 改变后，相关角度同步更新。";
        render();
      });

      addCleanup(refs.ocRange, "input", event => {
        if (state.animating || state.sceneId !== "dual") return;
        state.oc = clamp(Number.parseFloat(event.target.value) || 42, 8, state.aob - 8);
        state.teachStep = 0;
        state.focusKey = "";
        state.message = "OC 的位置改变，∠MON 仍等于总角的一半。";
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

    container.__angleBisectorCleanup = () => {
      state.disposed = true;
      clearTimers();
      if (state.animationFrame) cancelAnimationFrame(state.animationFrame);
      cleanups.splice(0).forEach(fn => fn());
      container.innerHTML = "";
      if (panelHost) panelHost.innerHTML = "";
    };
  }

  window.MATH_VISUAL_SCENES[CARD_ID] = {
    mount,
    unmount(container, context = {}) {
      if (typeof container.__angleBisectorCleanup === "function") {
        container.__angleBisectorCleanup();
        delete container.__angleBisectorCleanup;
      } else {
        container.innerHTML = "";
        if (context.externalPanel) context.externalPanel.innerHTML = "";
      }
    }
  };
})();
