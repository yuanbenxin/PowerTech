window.MATH_VISUAL_SCENES = window.MATH_VISUAL_SCENES || {};

(function () {
  const CARD_ID = "j7a_m06";
  const STYLE_ID = "algebra-tiles-combiner-style";

  const TILE_TYPES = {
    x2: { label: "x²", order: 3, size: { w: 78, h: 78 }, row: 0 },
    x: { label: "x", order: 2, size: { w: 94, h: 40 }, row: 1 },
    one: { label: "1", order: 1, size: { w: 40, h: 40 }, row: 2 }
  };

  const TYPE_LABELS = {
    x2: "x²项",
    x: "x项",
    one: "常数项"
  };

  const PRESET_EXAMPLES = [
    {
      id: "three-x",
      title: "同号合并",
      expression: "x + x + x",
      terms: [{ type: "x", sign: 1 }, { type: "x", sign: 1 }, { type: "x", sign: 1 }]
    },
    {
      id: "zero-pair",
      title: "零对抵消",
      expression: "x - x + 2",
      terms: [{ type: "x", sign: 1 }, { type: "x", sign: -1 }, { type: "one", sign: 1 }, { type: "one", sign: 1 }]
    },
    {
      id: "basic-mix",
      title: "一次项",
      expression: "2x - x + 3 - 1",
      terms: [
        { type: "x", sign: 1 },
        { type: "x", sign: 1 },
        { type: "x", sign: -1 },
        { type: "one", sign: 1 },
        { type: "one", sign: 1 },
        { type: "one", sign: 1 },
        { type: "one", sign: -1 }
      ]
    },
    {
      id: "x2-cancel",
      title: "平方项",
      expression: "x² + 2x - x² + 3 - 1",
      terms: [
        { type: "x2", sign: 1 },
        { type: "x", sign: 1 },
        { type: "x", sign: 1 },
        { type: "x2", sign: -1 },
        { type: "one", sign: 1 },
        { type: "one", sign: 1 },
        { type: "one", sign: 1 },
        { type: "one", sign: -1 }
      ]
    },
    {
      id: "all-zero",
      title: "化成0",
      expression: "x - x + 1 - 1",
      terms: [{ type: "x", sign: 1 }, { type: "x", sign: -1 }, { type: "one", sign: 1 }, { type: "one", sign: -1 }]
    },
    {
      id: "full-mix",
      title: "综合",
      expression: "x² + x + x² - 2x + 1",
      terms: [
        { type: "x2", sign: 1 },
        { type: "x", sign: 1 },
        { type: "x2", sign: 1 },
        { type: "x", sign: -1 },
        { type: "x", sign: -1 },
        { type: "one", sign: 1 }
      ]
    }
  ];

  const TYPE_TIPS = {
    x2: "看正方形积木：只合并 x² 项。",
    x: "看长条积木：只合并 x 项。",
    one: "看小方块：只合并常数项。"
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
      .atl-scene,
      .atl-scene *,
      .atl-panel,
      .atl-panel * {
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -webkit-user-drag: none;
        user-select: none;
      }

      .atl-scene {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 0;
        overflow: hidden;
        color: #f8fafc;
        font-family: Inter, "Noto Sans SC", "Microsoft YaHei UI", "Microsoft YaHei", sans-serif;
        background:
          radial-gradient(circle at 18% 16%, rgba(34,197,94,0.2), transparent 30%),
          radial-gradient(circle at 82% 22%, rgba(56,189,248,0.18), transparent 30%),
          radial-gradient(circle at 58% 86%, rgba(250,204,21,0.14), transparent 32%),
          linear-gradient(145deg, #020617 0%, #07111f 56%, #020617 100%);
        touch-action: none;
      }

      .atl-scene::before {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        background:
          linear-gradient(rgba(148,163,184,0.07) 1px, transparent 1px),
          linear-gradient(90deg, rgba(148,163,184,0.07) 1px, transparent 1px);
        background-size: 42px 42px;
        mask-image: radial-gradient(circle at 50% 48%, black 0 56%, transparent 86%);
      }

      .atl-board {
        position: absolute;
        inset: 14px;
        display: grid;
        grid-template-rows: minmax(0, 1fr) auto;
        gap: 10px;
      }

      .atl-sandbox {
        position: relative;
        min-height: 0;
        overflow: hidden;
        border: 1px solid rgba(148,163,184,0.18);
        border-radius: 8px;
        background:
          linear-gradient(rgba(125,211,252,0.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(125,211,252,0.08) 1px, transparent 1px),
          radial-gradient(circle at 30% 20%, rgba(14,165,233,0.16), transparent 36%),
          linear-gradient(180deg, rgba(15,23,42,0.78), rgba(2,6,23,0.68));
        background-size: 44px 44px, 44px 44px, 100% 100%, 100% 100%;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 22px 60px rgba(2,6,23,0.34);
      }

      .atl-status {
        position: absolute;
        left: 12px;
        top: 12px;
        z-index: 8;
        display: flex;
        max-width: calc(100% - 24px);
        gap: 7px;
        flex-wrap: wrap;
        pointer-events: none;
      }

      .atl-status-chip {
        min-width: 0;
        max-width: 100%;
        border: 1px solid rgba(148,163,184,0.16);
        border-radius: 8px;
        background: rgba(2,6,23,0.58);
        color: rgba(226,232,240,0.78);
        backdrop-filter: blur(12px);
        padding: 6px 9px;
        font-size: 11px;
        line-height: 1.2;
        font-weight: 950;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .atl-status-chip strong {
        color: #ffffff;
      }

      .atl-stage {
        position: absolute;
        inset: 0;
        touch-action: none;
        cursor: grab;
      }

      .atl-stage.is-panning {
        cursor: grabbing;
      }

      .atl-world {
        position: absolute;
        inset: 0;
        transform: translate(var(--pan-x, 0px), var(--pan-y, 0px)) scale(var(--zoom, 1));
        transform-origin: center center;
        transition: transform 0.18s ease;
        will-change: transform;
      }

      .atl-world.is-manipulating {
        transition: none;
      }

      .atl-lane {
        position: absolute;
        left: 24px;
        right: 24px;
        min-height: 82px;
        border: 1px dashed rgba(148,163,184,0.16);
        border-radius: 8px;
        background: rgba(15,23,42,0.28);
      }

      .atl-lane[data-type="x2"] { top: 60px; }
      .atl-lane[data-type="x"] { top: 182px; }
      .atl-lane[data-type="one"] { top: 294px; }

      .atl-lane-label {
        position: absolute;
        left: 10px;
        top: 8px;
        border-radius: 999px;
        background: rgba(2,6,23,0.58);
        color: rgba(226,232,240,0.72);
        padding: 4px 8px;
        font-size: 10px;
        font-weight: 950;
      }

      .atl-tile-layer,
      .atl-particles {
        position: absolute;
        inset: 0;
      }

      .atl-particles {
        z-index: 12;
        pointer-events: none;
        overflow: hidden;
      }

      .atl-tile {
        position: absolute;
        z-index: 6;
        display: grid;
        place-items: center;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.24);
        color: #ffffff;
        font-family: "JetBrains Mono", Consolas, "Microsoft YaHei UI", monospace;
        font-weight: 950;
        line-height: 1;
        cursor: grab;
        touch-action: none;
        -webkit-user-select: none;
        user-select: none;
        box-shadow: 0 16px 34px rgba(2,6,23,0.28), inset 0 1px 0 rgba(255,255,255,0.22);
        transition: transform 0.18s ease, opacity 0.22s ease, filter 0.22s ease, box-shadow 0.18s ease;
      }

      .atl-tile::after {
        content: "";
        position: absolute;
        inset: -20px;
        border-radius: 18px;
      }

      .atl-tile.is-dragging {
        z-index: 20;
        cursor: grabbing;
        transform: scale(1.05);
        box-shadow: 0 22px 48px rgba(2,6,23,0.4), 0 0 0 7px rgba(250,204,21,0.13);
      }

      .atl-tile.is-inactive {
        filter: grayscale(0.9);
        opacity: 0.62;
      }

      .atl-tile.is-inactive::before {
        content: "点亮";
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        border-radius: inherit;
        background: rgba(15,23,42,0.72);
        color: rgba(226,232,240,0.88);
        font-size: 12px;
        font-family: "Microsoft YaHei UI", "Microsoft YaHei", sans-serif;
        font-weight: 950;
        letter-spacing: 0;
      }

      .atl-tile.is-target {
        box-shadow: 0 22px 48px rgba(2,6,23,0.4), 0 0 0 7px rgba(56,189,248,0.16);
      }

      .atl-tile.is-highlight {
        filter: saturate(1.18);
        box-shadow: 0 20px 46px rgba(2,6,23,0.38), 0 0 0 7px rgba(250,204,21,0.18);
      }

      .atl-tile.is-removing {
        opacity: 0;
        transform: scale(0.24) rotate(10deg);
        filter: blur(2px);
      }

      .atl-type-x2 {
        width: 78px;
        height: 78px;
        font-size: 25px;
      }

      .atl-type-x {
        width: 94px;
        height: 40px;
        font-size: 23px;
      }

      .atl-type-one {
        width: 40px;
        height: 40px;
        font-size: 20px;
      }

      .atl-pos.atl-type-x2 { background: linear-gradient(145deg, #059669, #34d399); }
      .atl-neg.atl-type-x2 { background: linear-gradient(145deg, #be123c, #fb7185); }
      .atl-pos.atl-type-x { background: linear-gradient(145deg, #0284c7, #38bdf8); }
      .atl-neg.atl-type-x { background: linear-gradient(145deg, #c2410c, #fb923c); }
      .atl-pos.atl-type-one { background: linear-gradient(145deg, #ca8a04, #fde047); color: #1f2937; }
      .atl-neg.atl-type-one { background: linear-gradient(145deg, #7e22ce, #c084fc); }

      .atl-badge {
        position: absolute;
        right: -7px;
        top: -7px;
        display: grid;
        place-items: center;
        min-width: 22px;
        height: 22px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.38);
        background: rgba(2,6,23,0.84);
        color: #ffffff;
        font-size: 11px;
        font-weight: 950;
      }

      .atl-zero-mark,
      .atl-merge-mark {
        position: absolute;
        z-index: 18;
        transform: translate(-50%, -50%);
        pointer-events: none;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.42);
        background: rgba(2,6,23,0.76);
        color: #ffffff;
        box-shadow: 0 18px 42px rgba(2,6,23,0.38);
        font-family: "JetBrains Mono", Consolas, "Microsoft YaHei UI", monospace;
        font-weight: 950;
        line-height: 1;
      }

      .atl-zero-mark {
        padding: 9px 12px;
        color: #e0f2fe;
        animation: atlPopFade 0.72s ease forwards;
      }

      .atl-merge-mark {
        padding: 8px 10px;
        color: #fef3c7;
        animation: atlPopFade 0.84s ease forwards;
      }

      .atl-formulas {
        position: relative;
        z-index: 4;
        min-height: 112px;
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 8px;
      }

      .atl-formula-card {
        min-width: 0;
        border: 1px solid rgba(148,163,184,0.16);
        border-radius: 8px;
        background: rgba(15,23,42,0.66);
        padding: 10px 12px;
        display: grid;
        gap: 6px;
      }

      .atl-formula-card.is-main {
        border-color: rgba(250,204,21,0.32);
        background: linear-gradient(135deg, rgba(250,204,21,0.12), rgba(15,23,42,0.68));
      }

      .atl-formula-label {
        color: rgba(203,213,225,0.64);
        font-size: 11px;
        line-height: 1.2;
        font-weight: 950;
      }

      .atl-formula-value {
        min-width: 0;
        color: #f8fafc;
        font-family: "JetBrains Mono", Consolas, "Microsoft YaHei UI", monospace;
        font-size: clamp(18px, 2.7vw, 30px);
        line-height: 1.28;
        font-weight: 950;
        overflow-wrap: anywhere;
      }

      .atl-term-x2 { color: #86efac; }
      .atl-term-x { color: #7dd3fc; }
      .atl-term-one { color: #fde68a; }
      .atl-term-neg { color: #fb7185; }
      .atl-op { color: rgba(226,232,240,0.72); }

      .atl-particle {
        position: absolute;
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: var(--particle-color, #facc15);
        transform: translate(-50%, -50%);
        animation: atlParticle 0.78s ease-out forwards;
      }

      .atl-panel {
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

      .atl-panel::-webkit-scrollbar {
        width: 0;
        height: 0;
      }

      .atl-panel-card {
        min-width: 0;
        border: 1px solid rgba(148,163,184,0.16);
        border-radius: 8px;
        background: rgba(15,23,42,0.64);
        padding: 8px;
      }

      .atl-panel-head {
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

      .atl-panel-head span:last-child {
        min-width: 0;
        color: rgba(125,211,252,0.88);
        font-family: "JetBrains Mono", Consolas, monospace;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .atl-question {
        border-radius: 8px;
        border: 1px solid rgba(148,163,184,0.12);
        background: rgba(2,6,23,0.3);
        color: #ffffff;
        text-align: center;
        padding: 10px 8px;
        font-family: "JetBrains Mono", Consolas, monospace;
        font-size: 18px;
        line-height: 1.28;
        font-weight: 950;
        overflow-wrap: anywhere;
      }

      .atl-action-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }

      .atl-preset-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 7px;
      }

      .atl-preset {
        min-width: 0;
        display: grid;
        gap: 3px;
        border: 1px solid rgba(148,163,184,0.14);
        border-radius: 8px;
        background: rgba(2,6,23,0.28);
        color: rgba(226,232,240,0.82);
        padding: 7px;
        cursor: pointer;
        text-align: left;
        touch-action: manipulation;
      }

      .atl-preset:hover {
        border-color: rgba(125,211,252,0.42);
      }

      .atl-preset.is-active {
        border-color: rgba(250,204,21,0.45);
        background: rgba(250,204,21,0.1);
      }

      .atl-preset-title {
        min-width: 0;
        color: rgba(226,232,240,0.78);
        font-size: 10px;
        line-height: 1.15;
        font-weight: 950;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .atl-preset-expression {
        min-width: 0;
        color: #ffffff;
        font-family: "JetBrains Mono", Consolas, "Microsoft YaHei UI", monospace;
        font-size: 12px;
        line-height: 1.2;
        font-weight: 950;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .atl-step-strip {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 5px;
        margin-bottom: 8px;
      }

      .atl-step-dot {
        min-width: 0;
        border: 1px solid rgba(148,163,184,0.14);
        border-radius: 8px;
        background: rgba(2,6,23,0.28);
        color: rgba(203,213,225,0.62);
        padding: 5px 4px;
        text-align: center;
        font-size: 10px;
        line-height: 1.1;
        font-weight: 950;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .atl-step-dot.is-active {
        border-color: rgba(250,204,21,0.44);
        background: rgba(250,204,21,0.1);
        color: #fef3c7;
      }

      .atl-step-dot.is-done {
        border-color: rgba(52,211,153,0.34);
        background: rgba(16,185,129,0.1);
        color: #d1fae5;
      }

      .atl-button {
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

      .atl-button:hover {
        border-color: rgba(125,211,252,0.5);
        color: #e0f2fe;
      }

      .atl-button:active {
        transform: scale(0.98);
      }

      .atl-button:disabled {
        cursor: default;
        opacity: 0.52;
      }

      .atl-button.primary {
        border-color: rgba(250,204,21,0.42);
        background: rgba(250,204,21,0.12);
        color: #fef3c7;
      }

      .atl-button.success {
        border-color: rgba(52,211,153,0.42);
        background: rgba(16,185,129,0.12);
        color: #d1fae5;
      }

      .atl-note {
        color: rgba(203,213,225,0.78);
        font-size: 12px;
        line-height: 1.45;
        font-weight: 760;
      }

      .atl-note strong {
        color: #ffffff;
        font-weight: 950;
      }

      .atl-mini-rule {
        margin-top: 7px;
        border-radius: 8px;
        border: 1px solid rgba(148,163,184,0.12);
        background: rgba(2,6,23,0.22);
        color: rgba(226,232,240,0.72);
        padding: 7px;
        font-size: 11px;
        line-height: 1.35;
        font-weight: 850;
      }

      .atl-progress-row {
        display: grid;
        grid-template-columns: 46px minmax(0, 1fr) auto;
        gap: 8px;
        align-items: center;
        min-height: 27px;
        color: rgba(226,232,240,0.74);
        font-size: 11px;
        line-height: 1.2;
        font-weight: 900;
      }

      .atl-progress-track {
        height: 7px;
        overflow: hidden;
        border-radius: 999px;
        background: rgba(148,163,184,0.16);
      }

      .atl-progress-bar {
        width: 0%;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #38bdf8, #facc15);
        transition: width 0.24s ease;
      }

      .atl-fill-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
      }

      .atl-fill {
        display: grid;
        gap: 5px;
      }

      .atl-fill label {
        color: rgba(203,213,225,0.68);
        font-size: 10px;
        line-height: 1.1;
        font-weight: 950;
        text-align: center;
      }

      .atl-fill input {
        width: 100%;
        min-width: 0;
        height: 36px;
        border: 1px solid rgba(148,163,184,0.18);
        border-radius: 8px;
        background: rgba(2,6,23,0.34);
        color: #ffffff;
        text-align: center;
        font-family: "JetBrains Mono", Consolas, monospace;
        font-size: 16px;
        font-weight: 950;
        outline: none;
        user-select: text;
        -webkit-user-select: text;
        touch-action: manipulation;
      }

      .atl-fill input:disabled {
        opacity: 0.52;
      }

      .atl-fill input.is-good {
        border-color: rgba(52,211,153,0.72);
        background: rgba(16,185,129,0.14);
      }

      .atl-fill input.is-bad {
        border-color: rgba(251,113,133,0.72);
        background: rgba(251,113,133,0.12);
      }

      .atl-fill.is-focus label {
        color: #fef3c7;
      }

      .atl-fill.is-focus input {
        border-color: rgba(250,204,21,0.72);
        background: rgba(250,204,21,0.12);
      }

      .atl-legend {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 6px;
      }

      .atl-legend-item {
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 7px;
        border: 1px solid rgba(148,163,184,0.12);
        border-radius: 8px;
        background: rgba(2,6,23,0.24);
        padding: 7px;
        color: rgba(226,232,240,0.78);
        font-size: 10px;
        line-height: 1.1;
        font-weight: 900;
      }

      .atl-swatch {
        width: 18px;
        height: 18px;
        border-radius: 5px;
        flex: 0 0 auto;
      }

      .atl-swatch.pos-x2 { background: linear-gradient(145deg, #059669, #34d399); }
      .atl-swatch.neg-x2 { background: linear-gradient(145deg, #be123c, #fb7185); }
      .atl-swatch.pos-x { background: linear-gradient(145deg, #0284c7, #38bdf8); }
      .atl-swatch.neg-x { background: linear-gradient(145deg, #c2410c, #fb923c); }
      .atl-swatch.pos-one { background: linear-gradient(145deg, #ca8a04, #fde047); }
      .atl-swatch.neg-one { background: linear-gradient(145deg, #7e22ce, #c084fc); }

      .atl-panel[data-size="compact"] {
        gap: 7px;
        padding: 8px;
      }

      .atl-panel[data-size="compact"] .atl-panel-card {
        padding: 7px;
      }

      .atl-panel[data-size="compact"] .atl-button {
        min-height: 31px;
        font-size: 10px;
        padding: 6px;
      }

      .atl-panel[data-size="compact"] .atl-question {
        font-size: 15px;
        padding: 8px 6px;
      }

      .atl-panel[data-size="compact"] .atl-preset {
        padding: 6px;
      }

      .atl-panel[data-size="compact"] .atl-preset-expression {
        font-size: 11px;
      }

      .atl-panel[data-size="micro"] {
        gap: 6px;
        padding: 7px;
      }

      .atl-panel[data-size="micro"] .atl-panel-card {
        padding: 6px;
      }

      .atl-panel[data-size="micro"] .atl-button {
        min-height: 28px;
        font-size: 9px;
        padding: 5px;
      }

      .atl-panel[data-size="micro"] .atl-question {
        font-size: 13px;
        padding: 6px 5px;
      }

      .atl-panel[data-size="micro"] .atl-preset-grid {
        grid-template-columns: 1fr;
      }

      .atl-panel[data-size="micro"] .atl-preset:nth-child(n+5) {
        display: none;
      }

      .atl-panel[data-size="micro"] .atl-step-strip {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .atl-panel[data-size="micro"] .atl-legend {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .atl-panel[data-size="micro"] .atl-note,
      .atl-panel[data-size="micro"] .atl-progress-row,
      .atl-panel[data-size="micro"] .atl-legend-item,
      .atl-panel[data-size="micro"] .atl-mini-rule {
        font-size: 10px;
      }

      @media (max-width: 720px), (max-height: 560px) {
        .atl-board {
          inset: 10px;
          gap: 8px;
        }

        .atl-lane {
          left: 14px;
          right: 14px;
          min-height: 72px;
        }

        .atl-lane[data-type="x2"] { top: 52px; }
        .atl-lane[data-type="x"] { top: 160px; }
        .atl-lane[data-type="one"] { top: 258px; }

        .atl-type-x2 {
          width: 64px;
          height: 64px;
          font-size: 21px;
        }

        .atl-type-x {
          width: 76px;
          height: 34px;
          font-size: 19px;
        }

        .atl-type-one {
          width: 34px;
          height: 34px;
          font-size: 17px;
        }

        .atl-formulas {
          grid-template-columns: 1fr;
          min-height: 0;
        }

        .atl-formula-card {
          padding: 8px;
        }

        .atl-formula-card:first-child {
          display: none;
        }
      }

      @keyframes atlParticle {
        0% {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
        100% {
          opacity: 0;
          transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0.28);
        }
      }

      @keyframes atlPopFade {
        0% {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.62);
        }
        24% {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1.08);
        }
        100% {
          opacity: 0;
          transform: translate(-50%, -72%) scale(0.92);
        }
      }
    `;
    document.head.appendChild(style);
  }

  function blockNativeMenus(target, cleanups) {
    if (!target) return;
    const events = ["contextmenu", "selectstart", "dragstart", "copy", "cut", "paste"];
    events.forEach(type => {
      const handler = event => {
        if (event.target?.matches?.("input")) return;
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
    scene.className = "atl-scene";
    scene.innerHTML = `
      <div class="atl-board">
        <section class="atl-sandbox" aria-label="整式合并同类项积木模拟区">
          <div class="atl-status">
            <div class="atl-status-chip">阶段 <strong data-phase-status></strong></div>
            <div class="atl-status-chip">目标 <strong data-target-status></strong></div>
            <div class="atl-status-chip">积木 <strong data-count-status></strong></div>
          </div>
          <div class="atl-stage" data-stage>
            <div class="atl-world" data-world>
              <div class="atl-lane" data-type="x2"><span class="atl-lane-label">x² 项</span></div>
              <div class="atl-lane" data-type="x"><span class="atl-lane-label">x 项</span></div>
              <div class="atl-lane" data-type="one"><span class="atl-lane-label">常数项</span></div>
              <div class="atl-tile-layer" data-tile-layer></div>
            </div>
          </div>
          <div class="atl-particles" data-particles></div>
        </section>
        <section class="atl-formulas" aria-label="当前代数式">
          <div class="atl-formula-card">
            <div class="atl-formula-label">当前积木</div>
            <div class="atl-formula-value" data-expanded>0</div>
          </div>
          <div class="atl-formula-card is-main">
            <div class="atl-formula-label">合并结果</div>
            <div class="atl-formula-value" data-simplified>0</div>
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
    panel.className = "atl-panel";
    const presetButtons = PRESET_EXAMPLES.map(example => `
      <button class="atl-preset" type="button" data-preset="${escapeHtml(example.id)}" title="${escapeHtml(example.expression)}">
        <span class="atl-preset-title">${escapeHtml(example.title)}</span>
        <span class="atl-preset-expression">${escapeHtml(example.expression)}</span>
      </button>
    `).join("");
    panel.innerHTML = `
      <div class="atl-panel-card">
        <div class="atl-panel-head"><span>当前题目</span><span data-panel-badge>随机挑战</span></div>
        <div class="atl-question" data-question>准备出题</div>
      </div>
      <div class="atl-panel-card">
        <div class="atl-panel-head"><span>操作</span><span data-action-badge>积木模型</span></div>
        <div class="atl-action-grid">
          <button class="atl-button primary" type="button" data-random>随机出题</button>
          <button class="atl-button" type="button" data-reset>重置本题</button>
          <button class="atl-button" type="button" data-step>下一步演示</button>
          <button class="atl-button" type="button" data-auto>直接化简</button>
          <button class="atl-button" type="button" data-align>整理积木</button>
          <button class="atl-button" type="button" data-view-reset>回正视图</button>
          <button class="atl-button success" type="button" data-check>检查答案</button>
        </div>
      </div>
      <div class="atl-panel-card">
        <div class="atl-panel-head"><span>演示进度</span><span data-progress-text>0/0</span></div>
        <div class="atl-step-strip">
          <span class="atl-step-dot" data-step-dot="activate">点亮</span>
          <span class="atl-step-dot" data-step-dot="group">分类</span>
          <span class="atl-step-dot" data-step-dot="cancel">抵消/合并</span>
          <span class="atl-step-dot" data-step-dot="answer">填写</span>
        </div>
        <div class="atl-progress-row">
          <span data-progress-label>点亮</span>
          <div class="atl-progress-track"><div class="atl-progress-bar" data-progress-bar></div></div>
          <span data-progress-ratio>0%</span>
        </div>
        <div class="atl-note" data-note>点击灰色积木，找齐所有同类项。</div>
        <div class="atl-mini-rule" data-mini-rule>同类项：字母相同，并且相同字母的指数也相同。</div>
      </div>
      <div class="atl-panel-card">
        <div class="atl-panel-head"><span>填写结果系数</span><span data-answer-badge>等待化简</span></div>
        <div class="atl-fill-grid">
          <div class="atl-fill" data-fill="x2">
            <input type="number" inputmode="numeric" data-input="x2" aria-label="x平方项系数">
            <label>x²</label>
          </div>
          <div class="atl-fill" data-fill="x">
            <input type="number" inputmode="numeric" data-input="x" aria-label="x项系数">
            <label>x</label>
          </div>
          <div class="atl-fill" data-fill="one">
            <input type="number" inputmode="numeric" data-input="one" aria-label="常数项系数">
            <label>常数</label>
          </div>
        </div>
      </div>
      <div class="atl-panel-card">
        <div class="atl-panel-head"><span>典型例题</span><span data-example-badge>可直接切换</span></div>
        <div class="atl-preset-grid">
          ${presetButtons}
        </div>
      </div>
      <div class="atl-panel-card">
        <div class="atl-panel-head"><span>颜色图例</span><span>正负同类项</span></div>
        <div class="atl-legend">
          <div class="atl-legend-item"><span class="atl-swatch pos-x2"></span><span>+x²</span></div>
          <div class="atl-legend-item"><span class="atl-swatch neg-x2"></span><span>-x²</span></div>
          <div class="atl-legend-item"><span class="atl-swatch pos-x"></span><span>+x</span></div>
          <div class="atl-legend-item"><span class="atl-swatch neg-x"></span><span>-x</span></div>
          <div class="atl-legend-item"><span class="atl-swatch pos-one"></span><span>+1</span></div>
          <div class="atl-legend-item"><span class="atl-swatch neg-one"></span><span>-1</span></div>
        </div>
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
      tiles: [],
      initialTerms: [],
      target: { x2: 0, x: 0, one: 0 },
      question: "",
      activePresetId: "",
      stepIndex: 0,
      message: "",
      focusType: "",
      busy: false,
      lastId: 0,
      phase: "activate",
      pointer: {
        mode: null,
        id: null,
        tileId: null,
        startX: 0,
        startY: 0,
        lastX: 0,
        lastY: 0,
        offsetX: 0,
        offsetY: 0,
        moved: false
      },
      view: {
        x: 0,
        y: 0,
        zoom: 1
      },
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
      sandbox: scene.querySelector(".atl-sandbox"),
      stage: scene.querySelector("[data-stage]"),
      world: scene.querySelector("[data-world]"),
      tileLayer: scene.querySelector("[data-tile-layer]"),
      particles: scene.querySelector("[data-particles]"),
      expanded: scene.querySelector("[data-expanded]"),
      simplified: scene.querySelector("[data-simplified]"),
      phaseStatus: scene.querySelector("[data-phase-status]"),
      targetStatus: scene.querySelector("[data-target-status]"),
      countStatus: scene.querySelector("[data-count-status]"),
      question: panel?.querySelector("[data-question]"),
      panelBadge: panel?.querySelector("[data-panel-badge]"),
      exampleBadge: panel?.querySelector("[data-example-badge]"),
      actionBadge: panel?.querySelector("[data-action-badge]"),
      progressText: panel?.querySelector("[data-progress-text]"),
      progressLabel: panel?.querySelector("[data-progress-label]"),
      progressBar: panel?.querySelector("[data-progress-bar]"),
      progressRatio: panel?.querySelector("[data-progress-ratio]"),
      note: panel?.querySelector("[data-note]"),
      miniRule: panel?.querySelector("[data-mini-rule]"),
      answerBadge: panel?.querySelector("[data-answer-badge]"),
      checkButton: panel?.querySelector("[data-check]"),
      stepButton: panel?.querySelector("[data-step]"),
      autoButton: panel?.querySelector("[data-auto]"),
      presetButtons: panel ? [...panel.querySelectorAll("[data-preset]")] : [],
      stepDots: panel ? [...panel.querySelectorAll("[data-step-dot]")] : [],
      inputs: {
        x2: panel?.querySelector('[data-input="x2"]'),
        x: panel?.querySelector('[data-input="x"]'),
        one: panel?.querySelector('[data-input="one"]')
      },
      fillGroups: {
        x2: panel?.querySelector('[data-fill="x2"]'),
        x: panel?.querySelector('[data-fill="x"]'),
        one: panel?.querySelector('[data-fill="one"]')
      }
    };

    [container, scene, refs.sandbox, panel, panelHost].forEach(target => blockNativeMenus(target, cleanups));
    panel?.querySelectorAll("button, div, span, strong").forEach(node => node.setAttribute("draggable", "false"));
    scene.querySelectorAll("div, span").forEach(node => node.setAttribute("draggable", "false"));

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

    function phaseText() {
      if (state.phase === "activate") return "找同类项";
      if (state.phase === "cancel") return "对消合并";
      if (state.phase === "validate") return "填写结果";
      return "已完成";
    }

    function setMessage(message, focusType = "") {
      state.message = message || "";
      state.focusType = focusType || "";
      updatePanel();
    }

    function clearHighlights() {
      refs.tileLayer.querySelectorAll(".atl-tile.is-highlight, .atl-tile.is-target").forEach(node => {
        node.classList.remove("is-highlight", "is-target");
      });
      Object.values(refs.fillGroups).forEach(group => group?.classList.remove("is-focus"));
    }

    function highlightType(type, duration = 1200) {
      clearHighlights();
      state.tiles.forEach(tile => {
        if (tile.type === type) tile.element?.classList.add("is-highlight");
      });
      refs.fillGroups[type]?.classList.add("is-focus");
      setTimer(clearHighlights, duration);
    }

    function stepKey() {
      if (state.phase === "activate") return "activate";
      if (state.phase === "cancel") {
        if (state.stepIndex <= 1) return "group";
        return "cancel";
      }
      return "answer";
    }

    function tileSize(type) {
      const compact = refs.sandbox.getBoundingClientRect().width < 520;
      if (!compact) return TILE_TYPES[type].size;
      if (type === "x2") return { w: 64, h: 64 };
      if (type === "x") return { w: 76, h: 34 };
      return { w: 34, h: 34 };
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

    function getWorldPoint(clientX, clientY) {
      const rect = refs.sandbox.getBoundingClientRect();
      return {
        x: (clientX - rect.left - rect.width / 2 - state.view.x) / state.view.zoom + rect.width / 2,
        y: (clientY - rect.top - rect.height / 2 - state.view.y) / state.view.zoom + rect.height / 2
      };
    }

    function activePointers(event) {
      return [...(event.currentTarget.__atlPointers || new Map()).values()];
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

    function coeffsFromTiles(tiles = state.tiles) {
      const result = { x2: 0, x: 0, one: 0 };
      tiles.forEach(tile => {
        result[tile.type] += tile.sign * tile.count;
      });
      return result;
    }

    function coeffSummary(coeffs) {
      return `${coeffs.x2}, ${coeffs.x}, ${coeffs.one}`;
    }

    function termHtml(type, coeff, isFirst) {
      if (coeff === 0) return "";
      const sign = coeff < 0 ? "-" : isFirst ? "" : "+";
      const abs = Math.abs(coeff);
      const variable = type === "x2" ? "x²" : type === "x" ? "x" : "";
      const body = type === "one"
        ? String(abs)
        : `${abs === 1 ? "" : abs}${variable}`;
      const klass = `atl-term-${type === "one" ? "one" : type}${coeff < 0 ? " atl-term-neg" : ""}`;
      return `${isFirst && coeff < 0 ? "" : sign ? `<span class="atl-op">${sign}</span> ` : ""}<span class="${klass}">${isFirst && coeff < 0 ? "-" : ""}${escapeHtml(body)}</span>`;
    }

    function expressionFromCoeffs(coeffs) {
      const parts = [];
      ["x2", "x", "one"].forEach(type => {
        if (coeffs[type] !== 0) parts.push(termHtml(type, coeffs[type], parts.length === 0));
      });
      return parts.length ? parts.join(" ") : "0";
    }

    function expressionFromTerms(terms) {
      if (!terms.length) return "0";
      const parts = [];
      terms.forEach(term => {
        const coeff = term.sign;
        const type = term.type;
        parts.push(termHtml(type, coeff, parts.length === 0));
      });
      return parts.join(" ");
    }

    function tileLabel(tile) {
      const sign = tile.sign < 0 ? "-" : "";
      if (tile.type === "one") return String(tile.sign * tile.count);
      const coeff = tile.count === 1 ? "" : tile.count;
      return `${sign}${coeff}${TILE_TYPES[tile.type].label}`;
    }

    function renderTile(tile) {
      if (!tile.element) {
        const el = document.createElement("div");
        el.className = "atl-tile";
        el.dataset.tileId = String(tile.id);
        refs.tileLayer.appendChild(el);
        tile.element = el;
      }
      const size = tileSize(tile.type);
      tile.element.className = [
        "atl-tile",
        `atl-type-${tile.type === "one" ? "one" : tile.type}`,
        tile.sign > 0 ? "atl-pos" : "atl-neg",
        tile.active ? "" : "is-inactive",
        tile.count > 1 ? "atl-composite" : ""
      ].filter(Boolean).join(" ");
      tile.element.style.width = `${size.w}px`;
      tile.element.style.height = `${size.h}px`;
      tile.element.style.left = `${tile.x}px`;
      tile.element.style.top = `${tile.y}px`;
      tile.element.innerHTML = `
        <span>${escapeHtml(tileLabel(tile))}</span>
        ${tile.count > 1 ? `<span class="atl-badge">${tile.count}</span>` : ""}
      `;
    }

    function renderTiles() {
      state.tiles.forEach(renderTile);
    }

    function removeTile(tile) {
      tile.element?.remove();
      state.tiles = state.tiles.filter(item => item.id !== tile.id);
    }

    function updateFormula() {
      refs.expanded.innerHTML = expressionFromTerms(
        [...state.tiles].sort((a, b) => TILE_TYPES[b.type].order - TILE_TYPES[a.type].order)
      );
      refs.simplified.innerHTML = expressionFromCoeffs(coeffsFromTiles());
    }

    function resetInputs() {
      Object.values(refs.inputs).forEach(input => {
        if (!input) return;
        input.value = "";
        input.classList.remove("is-good", "is-bad");
      });
      Object.values(refs.fillGroups).forEach(group => group?.classList.remove("is-focus"));
    }

    function setInputsDisabled(disabled) {
      Object.values(refs.inputs).forEach(input => {
        if (input) input.disabled = disabled;
      });
    }

    function oppositePairsCount() {
      return ["x2", "x", "one"].reduce((count, type) => {
        const pos = state.tiles.filter(tile => tile.type === type && tile.sign > 0).reduce((sum, tile) => sum + tile.count, 0);
        const neg = state.tiles.filter(tile => tile.type === type && tile.sign < 0).reduce((sum, tile) => sum + tile.count, 0);
        return count + Math.min(pos, neg);
      }, 0);
    }

    function findOppositePair() {
      for (const type of ["x2", "x", "one"]) {
        const positive = state.tiles.find(tile => tile.active && !tile.removing && tile.type === type && tile.sign > 0);
        const negative = state.tiles.find(tile => tile.active && !tile.removing && tile.type === type && tile.sign < 0);
        if (positive && negative) return [positive, negative];
      }
      return null;
    }

    function findSameSignPair() {
      for (const type of ["x2", "x", "one"]) {
        for (const sign of [1, -1]) {
          const group = state.tiles.filter(tile => tile.active && !tile.removing && tile.type === type && tile.sign === sign);
          if (group.length >= 2) return [group[0], group[1]];
        }
      }
      return null;
    }

    function firstPresentType() {
      return ["x2", "x", "one"].find(type => state.tiles.some(tile => tile.type === type)) || "";
    }

    function addFloatingMark(text, x, y, className) {
      const mark = document.createElement("span");
      mark.className = className;
      mark.textContent = text;
      mark.style.left = `${x}px`;
      mark.style.top = `${y}px`;
      refs.particles.appendChild(mark);
      setTimer(() => mark.remove(), 900);
    }

    function mergedTargetTiles() {
      const next = [];
      ["x2", "x", "one"].forEach(type => {
        const value = state.target[type];
        const count = Math.abs(value);
        const sign = value >= 0 ? 1 : -1;
        for (let i = 0; i < count; i += 1) {
          state.lastId += 1;
          next.push({
            id: state.lastId,
            type,
            sign,
            count: 1,
            active: true,
            x: 0,
            y: 0,
            element: null
          });
        }
      });
      return next;
    }

    function updatePanel() {
      const active = state.tiles.filter(tile => tile.active).length;
      const total = state.tiles.length;
      let ratio = total ? Math.round((active / total) * 100) : 100;
      let progressLabel = "点亮";
      let progressText = `${active}/${total}`;
      let note = state.isTouchDevice
        ? "点亮灰色积木；双指缩放，空白处移动。"
        : "点击灰色积木，找齐所有同类项。";
      let rule = "同类项：字母相同，并且相同字母的指数也相同。";

      if (state.phase === "cancel") {
        const pairs = oppositePairsCount();
        progressLabel = "零对";
        progressText = String(pairs);
        ratio = pairs ? 60 : 100;
        note = state.isTouchDevice
          ? "拖动同类反号积木相撞抵消；也可拖同号积木合并。"
          : "拖动同类反号积木相撞抵消，拖同号积木可合并。";
        rule = pairs
          ? "同类反号合成 0：例如 x + (-x) = 0。"
          : "没有零对后，把同号同类项合成一个系数。";
      } else if (state.phase === "validate") {
        progressLabel = "填写";
        progressText = "3项";
        ratio = 100;
        note = "数清剩余积木，填写 x²、x、常数三类系数。";
        rule = "只写系数：没有某一类就填 0。";
      } else if (state.phase === "complete") {
        progressLabel = "完成";
        progressText = "正确";
        ratio = 100;
        note = `化简正确，结果为 ${refs.simplified.textContent || "0"}。`;
        rule = `${state.question.replace(/<[^>]+>/g, "")} = ${refs.simplified.textContent || "0"}`;
      }

      if (state.message) note = state.message;

      refs.phaseStatus.textContent = phaseText();
      refs.targetStatus.textContent = coeffSummary(state.target);
      refs.countStatus.textContent = String(total);
      if (refs.question) refs.question.innerHTML = state.question || "准备出题";
      if (refs.panelBadge) refs.panelBadge.textContent = state.phase === "complete" ? "已完成" : state.activePresetId ? "典型例题" : "随机挑战";
      if (refs.exampleBadge) refs.exampleBadge.textContent = state.activePresetId ? "当前已选" : "可直接切换";
      if (refs.actionBadge) refs.actionBadge.textContent = phaseText();
      if (refs.progressLabel) refs.progressLabel.textContent = progressLabel;
      if (refs.progressText) refs.progressText.textContent = progressText;
      if (refs.progressBar) refs.progressBar.style.width = `${ratio}%`;
      if (refs.progressRatio) refs.progressRatio.textContent = `${ratio}%`;
      if (refs.note) refs.note.textContent = note;
      if (refs.miniRule) refs.miniRule.textContent = rule;
      if (refs.answerBadge) refs.answerBadge.textContent = state.phase === "validate" ? "可以填写" : state.phase === "complete" ? "已通过" : "等待化简";
      if (refs.checkButton) refs.checkButton.textContent = state.phase === "complete" ? "下一题" : "检查答案";
      if (refs.stepButton) refs.stepButton.textContent = state.phase === "complete" ? "重新演示" : state.phase === "validate" ? "填入答案" : "下一步演示";
      if (refs.stepButton) refs.stepButton.disabled = state.busy;
      if (refs.autoButton) refs.autoButton.disabled = state.busy;
      refs.presetButtons.forEach(button => {
        button.classList.toggle("is-active", button.dataset.preset === state.activePresetId);
        button.disabled = state.busy;
      });
      const currentStep = stepKey();
      refs.stepDots.forEach(dot => {
        const key = dot.dataset.stepDot;
        const order = ["activate", "group", "cancel", "answer"].indexOf(key);
        const currentOrder = ["activate", "group", "cancel", "answer"].indexOf(currentStep);
        dot.classList.toggle("is-active", key === currentStep);
        dot.classList.toggle("is-done", order >= 0 && currentOrder >= 0 && order < currentOrder);
      });
      Object.entries(refs.fillGroups).forEach(([type, group]) => {
        group?.classList.toggle("is-focus", state.focusType === type);
      });
      setInputsDisabled(state.phase !== "validate" && state.phase !== "complete");
      fitPanel(panel);
    }

    function emitBurst(x, y, colors, count = 18) {
      for (let i = 0; i < count; i += 1) {
        const particle = document.createElement("span");
        particle.className = "atl-particle";
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.setProperty("--particle-color", colors[i % colors.length]);
        particle.style.setProperty("--dx", `${(Math.random() - 0.5) * 140}px`);
        particle.style.setProperty("--dy", `${(Math.random() - 0.5) * 110 - 16}px`);
        refs.particles.appendChild(particle);
        setTimer(() => particle.remove(), 820);
      }
    }

    function tileColors(tile) {
      if (tile.type === "x2") return tile.sign > 0 ? ["#34d399", "#86efac", "#10b981"] : ["#fb7185", "#fecdd3", "#e11d48"];
      if (tile.type === "x") return tile.sign > 0 ? ["#38bdf8", "#7dd3fc", "#0284c7"] : ["#fb923c", "#fed7aa", "#f97316"];
      return tile.sign > 0 ? ["#fde047", "#facc15", "#fef3c7"] : ["#c084fc", "#ddd6fe", "#a855f7"];
    }

    function activateTile(tile) {
      if (!tile || tile.active) return;
      tile.active = true;
      renderTile(tile);
      const rect = tile.element.getBoundingClientRect();
      const sandboxRect = refs.sandbox.getBoundingClientRect();
      emitBurst(rect.left + rect.width / 2 - sandboxRect.left, rect.top + rect.height / 2 - sandboxRect.top, tileColors(tile), 10);
      if (state.tiles.every(item => item.active)) {
        state.phase = "cancel";
        autoAlign();
        setTimer(() => {
          if (!state.disposed) checkCancelComplete();
        }, 520);
      }
      updateFormula();
      updatePanel();
    }

    function clampTilePosition(tile) {
      const rect = refs.sandbox.getBoundingClientRect();
      const size = tileSize(tile.type);
      tile.x = clamp(tile.x, 6, Math.max(6, rect.width - size.w - 6));
      tile.y = clamp(tile.y, 48, Math.max(48, rect.height - size.h - 8));
    }

    function autoAlign() {
      const rect = refs.sandbox.getBoundingClientRect();
      if (rect.width < 80 || rect.height < 80) return;
      const compact = rect.width < 520 || rect.height < 430;
      const rows = compact
        ? { x2: 66, x: 170, one: 266 }
        : { x2: 74, x: 196, one: 306 };
      const startX = compact ? 24 : 36;
      const rowGap = compact ? 12 : 16;
      ["x2", "x", "one"].forEach(type => {
        const rowTiles = state.tiles
          .filter(tile => tile.type === type)
          .sort((a, b) => b.sign - a.sign || b.count - a.count);
        let x = startX;
        let y = rows[type];
        rowTiles.forEach(tile => {
          const size = tileSize(type);
          if (x + size.w > rect.width - 22) {
            x = startX;
            y += size.h + rowGap;
          }
          tile.x = x;
          tile.y = y;
          clampTilePosition(tile);
          renderTile(tile);
          x += size.w + rowGap;
        });
      });
      updateFormula();
      updatePanel();
    }

    function findTile(id) {
      return state.tiles.find(tile => String(tile.id) === String(id)) || null;
    }

    function tileBox(tile) {
      const size = tileSize(tile.type);
      return {
        left: tile.x,
        top: tile.y,
        right: tile.x + size.w,
        bottom: tile.y + size.h,
        area: size.w * size.h
      };
    }

    function overlapRatio(a, b) {
      const ra = tileBox(a);
      const rb = tileBox(b);
      const x = Math.max(0, Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left));
      const y = Math.max(0, Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top));
      return (x * y) / Math.min(ra.area, rb.area);
    }

    function mergeTiles(source, target) {
      if (!source || !target || source.id === target.id || source.removing || target.removing) return;
      state.busy = true;
      source.removing = true;
      target.count += source.count;
      const box = tileBox(target);
      const centerX = box.left + (box.right - box.left) / 2;
      const centerY = box.top + (box.bottom - box.top) / 2;
      source.element?.classList.add("is-removing");
      target.element?.classList.add("is-highlight");
      addFloatingMark(`${target.sign > 0 ? "+" : "-"}${target.count}${target.type === "one" ? "" : TILE_TYPES[target.type].label}`, centerX, centerY, "atl-merge-mark");
      setTimer(() => {
        if (state.disposed) return;
        removeTile(source);
        renderTile(target);
        emitBurst(centerX, centerY, tileColors(target), 12);
        state.message = `${TYPE_LABELS[target.type]}同号合并，系数相加。`;
        state.focusType = target.type;
        state.busy = false;
        updateFormula();
        checkCancelComplete();
        updatePanel();
      }, 180);
    }

    function cancelTiles(a, b) {
      if (!a || !b || a.id === b.id || a.removing || b.removing) return;
      state.busy = true;
      a.removing = true;
      b.removing = true;
      const count = Math.min(a.count, b.count);
      const boxA = tileBox(a);
      const boxB = tileBox(b);
      const burstX = (boxA.left + boxA.right + boxB.left + boxB.right) / 4;
      const burstY = (boxA.top + boxA.bottom + boxB.top + boxB.bottom) / 4;
      addFloatingMark("0", burstX, burstY, "atl-zero-mark");
      a.element?.classList.add("is-highlight");
      b.element?.classList.add("is-highlight");

      if (a.count === b.count) {
        a.element?.classList.add("is-removing");
        b.element?.classList.add("is-removing");
        setTimer(() => {
          if (state.disposed) return;
          removeTile(a);
          removeTile(b);
          emitBurst(burstX, burstY, [...tileColors(a), ...tileColors(b), "#ffffff"], 24);
          state.message = `${TYPE_LABELS[a.type]}一正一负，抵消成 0。`;
          state.focusType = a.type;
          state.busy = false;
          updateFormula();
          checkCancelComplete();
          updatePanel();
        }, 200);
        return;
      }

      const larger = a.count > b.count ? a : b;
      const smaller = a.count > b.count ? b : a;
      larger.count -= count;
      smaller.element?.classList.add("is-removing");
      setTimer(() => {
        if (state.disposed) return;
        removeTile(smaller);
        renderTile(larger);
        emitBurst(burstX, burstY, [...tileColors(a), ...tileColors(b), "#ffffff"], 22);
        state.message = `${TYPE_LABELS[a.type]}抵消 ${count} 对，保留多出来的部分。`;
        state.focusType = a.type;
        larger.removing = false;
        state.busy = false;
        updateFormula();
        checkCancelComplete();
        updatePanel();
      }, 200);
    }

    function checkCollision(tile) {
      if (!tile || state.phase !== "cancel") return;
      let best = null;
      let bestRatio = 0;
      state.tiles.forEach(other => {
        if (other.id === tile.id || other.type !== tile.type || !other.active) return;
        const ratio = overlapRatio(tile, other);
        if (ratio > 0.28 && ratio > bestRatio) {
          best = other;
          bestRatio = ratio;
        }
      });
      refs.tileLayer.querySelectorAll(".atl-tile.is-target").forEach(node => node.classList.remove("is-target"));
      if (!best) return;
      if (best.sign === tile.sign) mergeTiles(tile, best);
      else cancelTiles(tile, best);
    }

    function checkCancelComplete() {
      if (state.phase !== "cancel") return;
      if (oppositePairsCount() === 0 && !findSameSignPair()) {
        state.phase = "validate";
        state.stepIndex = Math.max(state.stepIndex, 3);
        autoAlign();
        resetInputs();
        state.message = "零对已经清完，现在把同类项系数写出来。";
        state.focusType = "";
      }
      updatePanel();
    }

    function stepDemo() {
      if (!state.tiles.length || state.busy) return;
      clearHighlights();

      if (state.phase === "complete") {
        resetCurrent();
        return;
      }

      if (state.phase === "validate") {
        refs.inputs.x2.value = String(state.target.x2);
        refs.inputs.x.value = String(state.target.x);
        refs.inputs.one.value = String(state.target.one);
        state.message = "答案已填入，点击“检查答案”完成验证。";
        state.focusType = "";
        updatePanel();
        return;
      }

      if (state.phase === "activate") {
        state.stepIndex = 1;
        state.tiles.forEach(tile => {
          tile.active = true;
          renderTile(tile);
        });
        state.phase = "cancel";
        autoAlign();
        const type = firstPresentType();
        state.message = type ? TYPE_TIPS[type] : "先按形状分类：x²、x、常数不能混在一起合并。";
        state.focusType = type;
        if (type) highlightType(type, 1400);
        updateFormula();
        checkCancelComplete();
        updatePanel();
        return;
      }

      const pair = findOppositePair();
      if (pair) {
        state.stepIndex = 2;
        cancelTiles(pair[0], pair[1]);
        return;
      }

      const samePair = findSameSignPair();
      if (samePair) {
        state.stepIndex = 3;
        mergeTiles(samePair[1], samePair[0]);
        return;
      }

      state.phase = "validate";
      state.stepIndex = 4;
      state.message = "已经没有能继续合并的积木，填写结果系数。";
      state.focusType = "";
      autoAlign();
      resetInputs();
      updateFormula();
      updatePanel();
    }

    function randomTerms() {
      const count = Math.floor(Math.random() * 4) + 5;
      const types = ["x2", "x", "one"];
      let terms = [];
      let coeffs = { x2: 0, x: 0, one: 0 };
      let attempts = 0;
      while (attempts < 80) {
        attempts += 1;
        terms = [];
        coeffs = { x2: 0, x: 0, one: 0 };
        for (let i = 0; i < count; i += 1) {
          const type = types[Math.floor(Math.random() * types.length)];
          const sign = Math.random() < 0.5 ? 1 : -1;
          terms.push({ type, sign });
          coeffs[type] += sign;
        }
        if (coeffs.x2 !== 0 || coeffs.x !== 0 || coeffs.one !== 0) break;
      }
      return { terms, coeffs };
    }

    function loadTerms(terms, options = {}) {
      clearTimers();
      clearHighlights();
      refs.tileLayer.innerHTML = "";
      refs.particles.innerHTML = "";
      state.tiles = [];
      state.initialTerms = terms.map(term => ({ ...term }));
      state.target = coeffsFromTiles(terms.map((term, index) => ({
        id: index + 1,
        type: term.type,
        sign: term.sign,
        count: 1
      })));
      state.question = expressionFromTerms(terms);
      state.activePresetId = options.presetId || "";
      state.stepIndex = 0;
      state.message = "";
      state.focusType = "";
      state.busy = false;
      state.phase = "activate";
      state.lastId = 0;
      resetView();
      resetInputs();
      const rect = refs.sandbox.getBoundingClientRect();
      terms.forEach(term => {
        state.lastId += 1;
        const tile = {
          id: state.lastId,
          type: term.type,
          sign: term.sign,
          count: 1,
          active: false,
          x: 40 + Math.random() * Math.max(80, rect.width - 150),
          y: 70 + Math.random() * Math.max(80, rect.height - 170),
          element: null
        };
        clampTilePosition(tile);
        state.tiles.push(tile);
        renderTile(tile);
      });
      updateFormula();
      requestAnimationFrame(autoAlign);
      updatePanel();
    }

    function loadRandom() {
      const next = randomTerms();
      loadTerms(next.terms);
    }

    function loadPreset(id) {
      const example = PRESET_EXAMPLES.find(item => item.id === id);
      if (!example) return;
      loadTerms(example.terms, { presetId: example.id });
      setMessage(`${example.title}：先看积木形状，形状相同才是同类项。`, firstPresentType());
      const type = firstPresentType();
      if (type) highlightType(type);
    }

    function resetCurrent() {
      if (!state.initialTerms.length) {
        loadRandom();
        return;
      }
      const presetId = state.activePresetId;
      loadTerms(state.initialTerms, { presetId });
    }

    function validateAnswer() {
      if (state.busy) return;
      if (state.phase === "complete") {
        loadRandom();
        return;
      }
      if (state.phase !== "validate") {
        setMessage("先点亮并完成可抵消的零对，再填写结果。");
        return;
      }
      const values = {
        x2: Number.parseInt(refs.inputs.x2?.value || "0", 10) || 0,
        x: Number.parseInt(refs.inputs.x?.value || "0", 10) || 0,
        one: Number.parseInt(refs.inputs.one?.value || "0", 10) || 0
      };
      let ok = true;
      const wrongTypes = [];
      ["x2", "x", "one"].forEach(type => {
        const input = refs.inputs[type];
        const good = values[type] === state.target[type];
        ok = ok && good;
        if (!good) wrongTypes.push(type);
        input?.classList.toggle("is-good", good);
        input?.classList.toggle("is-bad", !good);
      });
      if (ok) {
        state.phase = "complete";
        state.stepIndex = 4;
        state.message = `正确：${refs.simplified.textContent || "0"}`;
        state.focusType = "";
        const rect = refs.sandbox.getBoundingClientRect();
        emitBurst(rect.width / 2, rect.height / 2, ["#facc15", "#38bdf8", "#86efac", "#ffffff"], 56);
      } else {
        const firstWrong = wrongTypes[0];
        state.message = `${wrongTypes.map(type => TYPE_LABELS[type]).join("、")}系数不对，重数这一类积木。`;
        state.focusType = firstWrong;
        highlightType(firstWrong, 1600);
      }
      updatePanel();
    }

    function autoSimplify() {
      if (!state.tiles.length || state.busy) return;
      clearHighlights();
      state.tiles.forEach(tile => {
        tile.active = true;
      });
      state.phase = "cancel";
      state.stepIndex = 2;
      state.message = "自动把所有同类项整理到对应轨道，再消去零对。";
      state.focusType = "";
      renderTiles();
      autoAlign();
      updatePanel();
      const rect = refs.sandbox.getBoundingClientRect();
      emitBurst(rect.width / 2, rect.height / 2, ["#38bdf8", "#facc15", "#86efac"], 24);
      setTimer(() => {
        if (state.disposed) return;
        refs.particles.innerHTML = "";
        refs.tileLayer.innerHTML = "";
        state.tiles = mergedTargetTiles();
        state.phase = "validate";
        state.stepIndex = 4;
        state.message = "已经化成最简积木，填写三个系数。";
        renderTiles();
        autoAlign();
        resetInputs();
        updateFormula();
        updatePanel();
      }, 520);
    }

    refs.stage.__atlPointers = new Map();

    function onPointerDown(event) {
      if (state.disposed) return;
      event.preventDefault();
      refs.stage.setPointerCapture?.(event.pointerId);
      refs.stage.__atlPointers.set(event.pointerId, event);
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

      const tileEl = event.target.closest("[data-tile-id]");
      const tile = tileEl ? findTile(tileEl.dataset.tileId) : null;
      state.pointer.id = event.pointerId;
      state.pointer.startX = event.clientX;
      state.pointer.startY = event.clientY;
      state.pointer.lastX = event.clientX;
      state.pointer.lastY = event.clientY;
      state.pointer.moved = false;
      state.pointer.tileId = tile ? tile.id : null;

      if (tile) {
        if (!tile.active) {
          activateTile(tile);
          state.pointer.mode = null;
          return;
        }
        if (state.phase === "activate") return;
        const point = getWorldPoint(event.clientX, event.clientY);
        state.pointer.mode = "tile";
        state.pointer.offsetX = point.x - tile.x;
        state.pointer.offsetY = point.y - tile.y;
        tile.element.classList.add("is-dragging");
        return;
      }

      state.pointer.mode = "pan";
      refs.stage.classList.add("is-panning");
    }

    function onPointerMove(event) {
      const pointerMap = refs.stage.__atlPointers;
      if (pointerMap?.has(event.pointerId)) pointerMap.set(event.pointerId, event);
      if (!state.pointer.mode || state.disposed) return;
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
      const dx = event.clientX - state.pointer.startX;
      const dy = event.clientY - state.pointer.startY;
      if (Math.hypot(dx, dy) > 7) state.pointer.moved = true;

      if (state.pointer.mode === "pan") {
        state.view.x = clamp(state.view.x + event.clientX - state.pointer.lastX, -420, 420);
        state.view.y = clamp(state.view.y + event.clientY - state.pointer.lastY, -320, 320);
        state.pointer.lastX = event.clientX;
        state.pointer.lastY = event.clientY;
        applyView();
        return;
      }

      if (state.pointer.mode === "tile") {
        const tile = findTile(state.pointer.tileId);
        if (!tile) return;
        const point = getWorldPoint(event.clientX, event.clientY);
        tile.x = point.x - state.pointer.offsetX;
        tile.y = point.y - state.pointer.offsetY;
        clampTilePosition(tile);
        renderTile(tile);
        refs.tileLayer.querySelectorAll(".atl-tile.is-target").forEach(node => node.classList.remove("is-target"));
        let best = null;
        let bestRatio = 0;
        state.tiles.forEach(other => {
          if (other.id === tile.id || other.type !== tile.type || !other.active) return;
          const ratio = overlapRatio(tile, other);
          if (ratio > 0.22 && ratio > bestRatio) {
            best = other;
            bestRatio = ratio;
          }
        });
        best?.element?.classList.add("is-target");
      }
    }

    function endPointer(event) {
      const pointerMap = refs.stage.__atlPointers;
      pointerMap?.delete(event.pointerId);
      refs.stage.releasePointerCapture?.(event.pointerId);
      refs.world.classList.remove("is-manipulating");
      refs.stage.classList.remove("is-panning");
      refs.tileLayer.querySelectorAll(".atl-tile.is-dragging, .atl-tile.is-target").forEach(node => {
        node.classList.remove("is-dragging", "is-target");
      });

      if (state.pointer.mode === "pinch") {
        if ((pointerMap?.size || 0) > 0) return;
        state.pointer.mode = null;
        return;
      }

      if (state.pointer.mode === "tile" && event.pointerId === state.pointer.id) {
        const tile = findTile(state.pointer.tileId);
        state.pointer.mode = null;
        state.pointer.tileId = null;
        if (tile) checkCollision(tile);
        updateFormula();
        updatePanel();
        return;
      }

      state.pointer.mode = null;
      state.pointer.tileId = null;
      updatePanel();
    }

    addCleanup(refs.stage, "pointerdown", onPointerDown);
    addCleanup(refs.stage, "pointermove", onPointerMove);
    addCleanup(refs.stage, "pointerup", endPointer);
    addCleanup(refs.stage, "pointercancel", endPointer);

    if (panel) {
      addCleanup(panel, "click", event => {
        const presetButton = event.target.closest("[data-preset]");
        if (presetButton) {
          loadPreset(presetButton.dataset.preset);
          return;
        }
        if (event.target.closest("[data-random]")) {
          loadRandom();
          return;
        }
        if (event.target.closest("[data-reset]")) {
          resetCurrent();
          return;
        }
        if (event.target.closest("[data-auto]")) {
          autoSimplify();
          return;
        }
        if (event.target.closest("[data-step]")) {
          stepDemo();
          return;
        }
        if (event.target.closest("[data-align]")) {
          autoAlign();
          return;
        }
        if (event.target.closest("[data-view-reset]")) {
          resetView();
          return;
        }
        if (event.target.closest("[data-check]")) {
          validateAnswer();
        }
      });
    }

    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => {
      autoAlign();
      fitPanel(panel);
    }) : null;
    if (resizeObserver) {
      resizeObserver.observe(refs.sandbox);
      if (panelHost) resizeObserver.observe(panelHost);
      cleanups.push(() => resizeObserver.disconnect());
    }

    requestAnimationFrame(() => {
      if (!state.disposed) loadRandom();
    });
    fitPanel(panel);

    container.__algebraTilesCombinerCleanup = () => {
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
      if (typeof container.__algebraTilesCombinerCleanup === "function") {
        container.__algebraTilesCombinerCleanup();
        delete container.__algebraTilesCombinerCleanup;
      } else {
        container.innerHTML = "";
        if (context.externalPanel) context.externalPanel.innerHTML = "";
      }
    }
  };
})();
