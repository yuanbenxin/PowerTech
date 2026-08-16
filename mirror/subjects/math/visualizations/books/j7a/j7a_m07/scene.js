window.MATH_VISUAL_SCENES = window.MATH_VISUAL_SCENES || {};

(function () {
  const CARD_ID = "j7a_m07";
  const STYLE_ID = "parentheses-sign-machine-style";

  const EXAMPLES = {
    "pos-sign": {
      title: "正号去括号",
      expr: "+(x - 3)",
      badge: "符号不变"
    },
    "neg-sign": {
      title: "负号去括号",
      expr: "-(2x - 4)",
      badge: "逐项变号"
    },
    "pos-coeff": {
      title: "正系数分配",
      expr: "3(x - 2)",
      badge: "乘法分配"
    },
    "neg-coeff": {
      title: "负系数分配",
      expr: "-2(3x - 5)",
      badge: "乘积定号"
    },
    "square-neg": {
      title: "中括号变号",
      expr: "-[x - 4]",
      badge: "中括号"
    },
    "square-coeff": {
      title: "中括号分配",
      expr: "2[3x - 5]",
      badge: "中括号"
    },
    "nested-square-inner": {
      title: "中括号套小括号",
      expr: "3[2x-(x-5)]",
      badge: "先内后外",
      nested: true
    },
    "nested-cancel": {
      title: "嵌套后合并",
      expr: "2[x+(3-x)]",
      badge: "逐层合并",
      nested: true
    },
    "nested-brace-square": {
      title: "大括号套中括号",
      expr: "-{2x-[x-3]}",
      badge: "三层括号",
      nested: true
    }
  };

  const NESTED_FLOWS = {
    "nested-square-inner": {
      raw: "3[2x-(x-5)]",
      result: { x: 3, constant: 15, varChar: "x" },
      steps: [
        {
          title: "识别内层",
          process: "先处理小括号前的负号",
          rule: "当前层：(x - 5)",
          html: `
            <span class="psm-nested-op">3</span>
            <span class="psm-nested-bracket square active">[
              <span class="psm-nested-token pos-x">2x</span>
              <span class="psm-nested-join">-</span>
              <span class="psm-nested-bracket round focus" data-nested-step>(x - 5)</span>
            ]</span>
          `
        },
        {
          title: "小括号展开",
          process: "-(x - 5) = -x + 5",
          rule: "负 × 正 = 负，负 × 负 = 正",
          html: `
            <span class="psm-nested-op">3</span>
            <span class="psm-nested-bracket square active">[
              <span class="psm-nested-token pos-x">2x</span>
              <span class="psm-nested-token neg-x">-x</span>
              <span class="psm-nested-token pos-const">+5</span>
            ]</span>
          `
        },
        {
          title: "中括号内合并",
          process: "2x - x + 5 = x + 5",
          rule: "先合并中括号内同类项",
          html: `
            <span class="psm-nested-op">3</span>
            <span class="psm-nested-bracket square focus" data-nested-step>[
              <span class="psm-nested-token pos-x">x</span>
              <span class="psm-nested-token pos-const">+5</span>
            ]</span>
          `
        },
        {
          title: "外层分配",
          process: "3(x + 5) = 3x + 15",
          rule: "正系数分配到每一项",
          html: `
            <span class="psm-nested-token pos-x">3x</span>
            <span class="psm-nested-token pos-const">+15</span>
          `
        }
      ]
    },
    "nested-cancel": {
      raw: "2[x+(3-x)]",
      result: { x: 0, constant: 6, varChar: "x" },
      steps: [
        {
          title: "识别内层",
          process: "先处理小括号：(3 - x)",
          rule: "括号前是正号，符号不变",
          html: `
            <span class="psm-nested-op">2</span>
            <span class="psm-nested-bracket square active">[
              <span class="psm-nested-token pos-x">x</span>
              <span class="psm-nested-join">+</span>
              <span class="psm-nested-bracket round focus" data-nested-step>(3 - x)</span>
            ]</span>
          `
        },
        {
          title: "小括号展开",
          process: "x + (3 - x) = x + 3 - x",
          rule: "正 × 正 = 正，正 × 负 = 负",
          html: `
            <span class="psm-nested-op">2</span>
            <span class="psm-nested-bracket square active">[
              <span class="psm-nested-token pos-x">x</span>
              <span class="psm-nested-token pos-const">+3</span>
              <span class="psm-nested-token neg-x">-x</span>
            ]</span>
          `
        },
        {
          title: "中括号内合并",
          process: "x - x + 3 = 3",
          rule: "同类项抵消，留下常数 3",
          html: `
            <span class="psm-nested-op">2</span>
            <span class="psm-nested-bracket square focus" data-nested-step>[
              <span class="psm-nested-token pos-const">3</span>
            ]</span>
          `
        },
        {
          title: "外层分配",
          process: "2 × 3 = 6",
          rule: "外层系数乘中括号结果",
          html: `
            <span class="psm-nested-token pos-const">6</span>
          `
        }
      ]
    },
    "nested-brace-square": {
      raw: "-{2x-[x-3]}",
      result: { x: -1, constant: -3, varChar: "x" },
      steps: [
        {
          title: "识别最内层",
          process: "先处理中括号前的负号",
          rule: "当前层：[x - 3]",
          html: `
            <span class="psm-nested-op">-</span>
            <span class="psm-nested-bracket brace active">{
              <span class="psm-nested-token pos-x">2x</span>
              <span class="psm-nested-join">-</span>
              <span class="psm-nested-bracket square focus" data-nested-step>[x - 3]</span>
            }</span>
          `
        },
        {
          title: "中括号展开",
          process: "-[x - 3] = -x + 3",
          rule: "负号进入中括号，每一项变号",
          html: `
            <span class="psm-nested-op">-</span>
            <span class="psm-nested-bracket brace active">{
              <span class="psm-nested-token pos-x">2x</span>
              <span class="psm-nested-token neg-x">-x</span>
              <span class="psm-nested-token pos-const">+3</span>
            }</span>
          `
        },
        {
          title: "大括号内合并",
          process: "2x - x + 3 = x + 3",
          rule: "先把大括号内部化简成一组",
          html: `
            <span class="psm-nested-op">-</span>
            <span class="psm-nested-bracket brace focus" data-nested-step>{
              <span class="psm-nested-token pos-x">x</span>
              <span class="psm-nested-token pos-const">+3</span>
            }</span>
          `
        },
        {
          title: "外层变号",
          process: "-(x + 3) = -x - 3",
          rule: "最外层负号进入，每一项都变号",
          html: `
            <span class="psm-nested-token neg-x">-x</span>
            <span class="psm-nested-token neg-const">-3</span>
          `
        }
      ]
    }
  };

  const SIGN_RULES = [
    ["+", "+", "+"],
    ["+", "-", "-"],
    ["-", "+", "-"],
    ["-", "-", "+"]
  ];

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function wait(ms, state) {
    return new Promise(resolve => {
      const timer = window.setTimeout(resolve, ms);
      state.timers.push(timer);
    });
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
      .psm-scene,
      .psm-scene *,
      .psm-panel,
      .psm-panel * {
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -webkit-user-drag: none;
        user-select: none;
      }

      .psm-scene {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 0;
        overflow: hidden;
        container-type: inline-size;
        color: #f8fafc;
        background:
          radial-gradient(circle at 18% 14%, rgba(56,189,248,0.2), transparent 30%),
          radial-gradient(circle at 84% 24%, rgba(250,204,21,0.15), transparent 28%),
          radial-gradient(circle at 64% 82%, rgba(244,63,94,0.13), transparent 34%),
          linear-gradient(145deg, #020617 0%, #07111f 54%, #020617 100%);
        font-family: Inter, "Noto Sans SC", "Microsoft YaHei UI", "Microsoft YaHei", sans-serif;
        touch-action: none;
      }

      .psm-scene::before {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        background:
          linear-gradient(rgba(148,163,184,0.07) 1px, transparent 1px),
          linear-gradient(90deg, rgba(148,163,184,0.07) 1px, transparent 1px);
        background-size: 42px 42px;
        mask-image: radial-gradient(circle at 50% 48%, black 0 54%, transparent 86%);
      }

      .psm-board {
        position: absolute;
        inset: 14px;
        display: grid;
        grid-template-rows: minmax(0, 1fr) auto;
        gap: 10px;
      }

      .psm-sandbox {
        position: relative;
        min-height: 0;
        overflow: hidden;
        border: 1px solid rgba(148,163,184,0.18);
        border-radius: 8px;
        background:
          radial-gradient(circle at 28% 22%, rgba(14,165,233,0.12), transparent 36%),
          linear-gradient(180deg, rgba(15,23,42,0.76), rgba(2,6,23,0.66));
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 22px 60px rgba(2,6,23,0.32);
      }

      .psm-status {
        position: absolute;
        left: 12px;
        top: 12px;
        z-index: 5;
        display: flex;
        max-width: calc(100% - 24px);
        gap: 7px;
        flex-wrap: wrap;
        pointer-events: none;
      }

      .psm-status-chip {
        min-width: 0;
        max-width: 100%;
        border: 1px solid rgba(148,163,184,0.16);
        border-radius: 8px;
        background: rgba(2,6,23,0.52);
        color: rgba(226,232,240,0.76);
        backdrop-filter: blur(12px);
        padding: 6px 9px;
        font-size: 11px;
        line-height: 1.2;
        font-weight: 900;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .psm-status-chip strong {
        color: #ffffff;
      }

      .psm-stage {
        position: absolute;
        inset: 0;
        padding: 62px 24px 36px;
        touch-action: none;
        cursor: grab;
      }

      .psm-stage.is-panning {
        cursor: grabbing;
      }

      .psm-world {
        position: absolute;
        left: 50%;
        top: 50%;
        width: min(980px, calc(100% - 28px));
        max-width: min(980px, calc(100% - 28px));
        transform: translate(calc(-50% + var(--pan-x, 0px)), calc(-50% + var(--pan-y, 0px))) scale(var(--zoom, 1));
        transform-origin: center center;
        transition: transform 0.18s ease;
        will-change: transform;
      }

      .psm-world.is-manipulating {
        transition: none;
      }

      .psm-expression {
        position: relative;
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        gap: clamp(8px, 1.4vw, 14px);
        max-width: 100%;
        transition: opacity 0.22s ease, transform 0.22s ease, filter 0.22s ease;
      }

      .psm-expression.psm-fade {
        opacity: 0.08;
        transform: scale(0.94);
        filter: blur(2px);
      }

      .psm-token {
        position: relative;
        display: grid;
        place-items: center;
        min-width: clamp(58px, 9vw, 94px);
        height: clamp(54px, 7vw, 76px);
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.22);
        padding: 8px 12px;
        color: #ffffff;
        font-size: clamp(24px, 4vw, 42px);
        line-height: 1;
        font-weight: 950;
        box-shadow: 0 16px 36px rgba(2,6,23,0.28), inset 0 1px 0 rgba(255,255,255,0.2);
        transform-style: preserve-3d;
        transition: transform 0.5s cubic-bezier(.2,.8,.2,1), opacity 0.25s ease, box-shadow 0.25s ease;
        cursor: pointer;
        touch-action: none;
        -webkit-user-select: none;
        user-select: none;
      }

      .psm-token::after,
      .psm-operator::after {
        content: "";
        position: absolute;
        inset: -20px;
        border-radius: 18px;
      }

      .psm-token:active {
        transform: scale(0.98);
      }

      .psm-token.is-target {
        cursor: pointer;
      }

      .psm-token.is-pressed,
      .psm-token.is-drag-target {
        transform: translateY(-2px) scale(1.05);
        box-shadow: 0 18px 42px rgba(2,6,23,0.34), 0 0 0 6px rgba(250,204,21,0.15);
      }

      .psm-token.is-target:not(.is-done) {
        animation: psmTargetBreath 1.6s ease-in-out infinite;
      }

      .psm-token.is-done {
        cursor: default;
        transform: rotateY(180deg);
        box-shadow: 0 16px 36px rgba(2,6,23,0.22), 0 0 0 3px rgba(34,197,94,0.14);
      }

      .psm-token-face {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        border-radius: inherit;
        backface-visibility: hidden;
        padding: 6px;
      }

      .psm-token-back {
        transform: rotateY(180deg);
      }

      .psm-token.pos-x .psm-token-face,
      .psm-merge-card.pos-x {
        background: linear-gradient(145deg, #0284c7, #38bdf8);
      }

      .psm-token.pos-const .psm-token-face,
      .psm-merge-card.pos-const {
        background: linear-gradient(145deg, #059669, #34d399);
      }

      .psm-token.neg-x .psm-token-face,
      .psm-merge-card.neg-x {
        background: linear-gradient(145deg, #be123c, #fb7185);
      }

      .psm-token.neg-const .psm-token-face,
      .psm-merge-card.neg-const {
        background: linear-gradient(145deg, #c2410c, #fb923c);
      }

      .psm-token .psm-token-face.pos-x {
        background: linear-gradient(145deg, #0284c7, #38bdf8);
      }

      .psm-token .psm-token-face.pos-const {
        background: linear-gradient(145deg, #059669, #34d399);
      }

      .psm-token .psm-token-face.neg-x {
        background: linear-gradient(145deg, #be123c, #fb7185);
      }

      .psm-token .psm-token-face.neg-const {
        background: linear-gradient(145deg, #c2410c, #fb923c);
      }

      .psm-operator {
        position: relative;
        z-index: 3;
        display: grid;
        place-items: center;
        min-width: clamp(58px, 8vw, 92px);
        height: clamp(58px, 8vw, 86px);
        border-radius: 8px;
        border: 1px solid rgba(129,140,248,0.45);
        color: #ffffff;
        background: linear-gradient(145deg, #4f46e5, #7c3aed);
        box-shadow: 0 18px 40px rgba(79,70,229,0.28), inset 0 1px 0 rgba(255,255,255,0.22);
        font-size: clamp(24px, 4vw, 40px);
        line-height: 1;
        font-weight: 950;
        cursor: grab;
        touch-action: none;
        -webkit-user-select: none;
        user-select: none;
      }

      .psm-operator.is-dragging {
        cursor: grabbing;
        box-shadow: 0 18px 48px rgba(79,70,229,0.44), 0 0 0 7px rgba(250,204,21,0.14);
      }

      .psm-operator.is-active {
        animation: psmOperatorPulse 0.72s ease-in-out;
      }

      .psm-operator.is-done,
      .psm-bracket.is-done,
      .psm-join-op.is-done {
        opacity: 0.14;
        transform: scale(0.78);
        filter: blur(1px);
      }

      .psm-join-op,
      .psm-bracket-char {
        display: grid;
        place-items: center;
        color: rgba(248,250,252,0.82);
        font-size: clamp(28px, 5vw, 58px);
        line-height: 1;
        font-weight: 950;
        transition: opacity 0.35s ease, transform 0.35s ease, filter 0.35s ease;
      }

      .psm-bracket {
        position: relative;
        display: flex;
        align-items: center;
        gap: clamp(7px, 1vw, 12px);
        border: 1px solid rgba(129,140,248,0.28);
        border-radius: 8px;
        background: rgba(79,70,229,0.08);
        padding: clamp(8px, 1.4vw, 14px);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.1);
        transition: opacity 0.35s ease, transform 0.35s ease, filter 0.35s ease, border-color 0.35s ease, background 0.35s ease;
      }

      .psm-bracket.bracket-square {
        border-color: rgba(250,204,21,0.34);
        background: rgba(250,204,21,0.08);
      }

      .psm-bracket.bracket-brace {
        border-color: rgba(168,85,247,0.36);
        background: rgba(168,85,247,0.08);
      }

      .psm-bracket.is-done {
        border-color: transparent;
        background: transparent;
      }

      .psm-nested-expression {
        display: flex;
        align-items: center;
        justify-content: center;
        /* 外层系数与括号组是一个完整数学结构，不能被拆到不同的行。 */
        flex-wrap: nowrap;
        gap: clamp(8px, 1.2vw, 14px);
        max-width: min(920px, 100%);
        color: #f8fafc;
        font-size: clamp(24px, 4vw, 46px);
        line-height: 1;
        font-weight: 950;
      }

      .psm-nested-op,
      .psm-nested-token,
      .psm-nested-bracket {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        min-height: clamp(54px, 7vw, 78px);
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.18);
        box-shadow: 0 16px 36px rgba(2,6,23,0.24), inset 0 1px 0 rgba(255,255,255,0.16);
      }

      .psm-nested-op {
        min-width: clamp(56px, 7vw, 86px);
        padding: 8px 14px;
        background: linear-gradient(145deg, #4f46e5, #7c3aed);
      }

      .psm-nested-token {
        min-width: clamp(62px, 8vw, 92px);
        padding: 8px 14px;
        margin: 3px;
      }

      .psm-nested-token.pos-x {
        background: linear-gradient(145deg, #0284c7, #38bdf8);
      }

      .psm-nested-token.neg-x {
        background: linear-gradient(145deg, #be123c, #fb7185);
      }

      .psm-nested-token.pos-const {
        background: linear-gradient(145deg, #059669, #34d399);
      }

      .psm-nested-token.neg-const {
        background: linear-gradient(145deg, #c2410c, #fb923c);
      }

      .psm-nested-bracket {
        max-width: 100%;
        gap: 8px;
        padding: 12px 16px;
        background: rgba(79,70,229,0.08);
        border-color: rgba(129,140,248,0.28);
      }

      .psm-nested-bracket.square {
        background: rgba(250,204,21,0.08);
        border-color: rgba(250,204,21,0.34);
      }

      .psm-nested-bracket.brace {
        background: rgba(168,85,247,0.1);
        border-color: rgba(168,85,247,0.38);
      }

      .psm-nested-bracket.round {
        background: rgba(56,189,248,0.1);
        border-color: rgba(56,189,248,0.36);
      }

      .psm-nested-bracket.active {
        box-shadow: 0 16px 42px rgba(2,6,23,0.28), 0 0 0 6px rgba(250,204,21,0.1);
      }

      .psm-nested-bracket.focus,
      .psm-nested-bracket [data-nested-step] {
        animation: psmNestedFocus 1.2s ease-in-out infinite;
      }

      .psm-nested-join {
        color: rgba(248,250,252,0.84);
        padding: 0 2px;
      }

      .psm-svg {
        position: absolute;
        inset: 0;
        z-index: 4;
        width: 100%;
        height: 100%;
        overflow: visible;
        pointer-events: none;
      }

      .psm-arc {
        fill: none;
        stroke: #facc15;
        stroke-width: 5;
        stroke-linecap: round;
        stroke-linejoin: round;
        filter: drop-shadow(0 6px 12px rgba(250,204,21,0.32));
        stroke-dasharray: 720;
        stroke-dashoffset: 720;
        animation: psmArcDraw 0.72s ease forwards;
      }

      .psm-arc.is-ghost {
        stroke: rgba(125,211,252,0.28);
        stroke-width: 3;
        stroke-dasharray: 8 10;
        stroke-dashoffset: 0;
        filter: none;
        animation: none;
      }

      .psm-arc.is-negative {
        stroke: #fb7185;
        filter: drop-shadow(0 6px 12px rgba(251,113,133,0.34));
      }

      .psm-arc.is-drag {
        stroke: #facc15;
        stroke-width: 4;
        stroke-dasharray: 10 8;
        stroke-dashoffset: 0;
        filter: drop-shadow(0 6px 12px rgba(250,204,21,0.32));
        animation: none;
      }

      .psm-particles,
      .psm-float-layer {
        position: absolute;
        inset: 0;
        z-index: 6;
        pointer-events: none;
        overflow: hidden;
      }

      .psm-bubble {
        position: absolute;
        max-width: min(330px, calc(100% - 28px));
        transform: translate(-50%, -110%) scale(0.82);
        opacity: 0;
        border: 1px solid rgba(125,211,252,0.42);
        border-radius: 8px;
        background: rgba(2,6,23,0.86);
        color: #e0f2fe;
        box-shadow: 0 14px 36px rgba(2,6,23,0.3);
        backdrop-filter: blur(12px);
        padding: 8px 10px;
        font-size: clamp(13px, 1.9vw, 17px);
        line-height: 1.35;
        font-weight: 950;
        text-align: center;
        white-space: nowrap;
        transition: opacity 0.18s ease, transform 0.18s ease;
      }

      .psm-bubble.is-negative {
        border-color: rgba(251,113,133,0.46);
        color: #ffe4e6;
      }

      .psm-bubble.is-visible {
        opacity: 1;
        transform: translate(-50%, -110%) scale(1);
      }

      .psm-particle {
        position: absolute;
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: var(--particle-color, #facc15);
        transform: translate(-50%, -50%);
        animation: psmParticle 0.78s ease-out forwards;
      }

      .psm-merge-card {
        position: absolute;
        z-index: 7;
        display: grid;
        place-items: center;
        width: clamp(58px, 9vw, 90px);
        height: clamp(52px, 7vw, 70px);
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.2);
        color: #ffffff;
        font-size: clamp(22px, 3.4vw, 34px);
        line-height: 1;
        font-weight: 950;
        box-shadow: 0 16px 36px rgba(2,6,23,0.28);
        transition: left 0.72s cubic-bezier(.2,.8,.2,1), top 0.72s cubic-bezier(.2,.8,.2,1), opacity 0.45s ease, transform 0.45s ease, filter 0.45s ease;
      }

      .psm-final {
        position: absolute;
        left: 50%;
        top: 50%;
        z-index: 8;
        display: grid;
        justify-items: center;
        gap: 8px;
        min-width: min(420px, calc(100% - 32px));
        transform: translate(-50%, -50%) scale(0.86);
        opacity: 0;
        border: 1px solid rgba(250,204,21,0.4);
        border-radius: 8px;
        background: rgba(2,6,23,0.82);
        box-shadow: 0 20px 60px rgba(2,6,23,0.36), inset 0 1px 0 rgba(255,255,255,0.12);
        backdrop-filter: blur(14px);
        padding: clamp(18px, 3vw, 26px);
        transition: opacity 0.28s ease, transform 0.28s ease;
      }

      .psm-final.is-visible {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }

      .psm-final-label {
        color: rgba(226,232,240,0.7);
        font-size: 12px;
        font-weight: 950;
      }

      .psm-final-value {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 6px;
        color: #ffffff;
        font-size: clamp(34px, 7vw, 64px);
        line-height: 1;
        font-weight: 950;
      }

      .psm-steps {
        position: relative;
        z-index: 4;
        min-height: 122px;
        display: grid;
        grid-template-columns: minmax(0, 1.2fr) repeat(3, minmax(0, 0.85fr));
        gap: 8px;
      }

      .psm-step {
        min-width: 0;
        border: 1px solid rgba(148,163,184,0.16);
        border-radius: 8px;
        background: rgba(15,23,42,0.66);
        padding: 9px 10px;
        display: grid;
        gap: 5px;
      }

      .psm-step.is-main {
        border-color: rgba(250,204,21,0.32);
        background: linear-gradient(135deg, rgba(250,204,21,0.12), rgba(15,23,42,0.68));
      }

      .psm-step.is-main .psm-step-value {
        font-size: clamp(19px, 2.8vw, 30px);
        line-height: 1.18;
      }

      .psm-step[data-active="true"] {
        border-color: rgba(250,204,21,0.42);
        background: rgba(250,204,21,0.1);
      }

      .psm-step-label {
        color: rgba(203,213,225,0.62);
        font-size: 11px;
        line-height: 1.2;
        font-weight: 950;
      }

      .psm-step-value {
        min-width: 0;
        color: #f8fafc;
        font-size: clamp(15px, 2vw, 20px);
        line-height: 1.38;
        font-weight: 900;
        overflow-wrap: anywhere;
      }

      .psm-term {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 1.2em;
        margin: 0 2px;
        color: #f8fafc;
      }

      .psm-term.pos {
        color: #86efac;
      }

      .psm-term.neg {
        color: #fb7185;
      }

      .psm-panel {
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

      .psm-panel::-webkit-scrollbar {
        width: 0;
        height: 0;
      }

      .psm-panel-card {
        min-width: 0;
        border: 1px solid rgba(148,163,184,0.16);
        border-radius: 8px;
        background: rgba(15,23,42,0.64);
        padding: 8px;
      }

      .psm-panel-head {
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

      .psm-panel-head span:last-child {
        min-width: 0;
        color: rgba(125,211,252,0.88);
        font-family: "JetBrains Mono", Consolas, monospace;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .psm-presets {
        display: grid;
        grid-template-columns: 1fr;
        gap: 8px;
      }

      .psm-button {
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

      .psm-button:hover {
        border-color: rgba(125,211,252,0.5);
        color: #e0f2fe;
      }

      .psm-button:active {
        transform: scale(0.98);
      }

      .psm-button:disabled {
        cursor: default;
        opacity: 0.52;
      }

      .psm-button.active {
        border-color: rgba(56,189,248,0.72);
        background: rgba(56,189,248,0.14);
        color: #e0f2fe;
      }

      .psm-button.primary {
        border-color: rgba(250,204,21,0.42);
        background: rgba(250,204,21,0.12);
        color: #fef3c7;
      }

      .psm-preset {
        display: grid;
        grid-template-columns: 24px minmax(0, 1fr);
        align-items: center;
        gap: 7px;
        text-align: left;
      }

      .psm-preset-index {
        display: grid;
        place-items: center;
        width: 24px;
        height: 24px;
        border-radius: 7px;
        background: rgba(148,163,184,0.14);
        color: rgba(226,232,240,0.78);
        font-family: "JetBrains Mono", Consolas, monospace;
        font-size: 11px;
      }

      .psm-button.active .psm-preset-index {
        background: rgba(56,189,248,0.18);
        color: #7dd3fc;
      }

      .psm-preset-main {
        min-width: 0;
        display: grid;
        gap: 2px;
      }

      .psm-preset-main strong,
      .psm-mini-eq {
        min-width: 0;
        color: #ffffff;
        font-family: "JetBrains Mono", Consolas, monospace;
        font-size: 12px;
        line-height: 1.1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .psm-preset-main span {
        min-width: 0;
        color: rgba(203,213,225,0.62);
        font-size: 10px;
        line-height: 1.1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .psm-action-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }

      .psm-action-grid .psm-button[data-view-reset] {
        grid-column: 1 / -1;
      }

      .psm-current {
        display: grid;
        gap: 7px;
      }

      .psm-current-eq {
        border-radius: 8px;
        border: 1px solid rgba(148,163,184,0.12);
        background: rgba(2,6,23,0.3);
        color: #ffffff;
        text-align: center;
        padding: 9px 7px;
        font-size: 17px;
        line-height: 1.25;
        font-weight: 950;
        overflow-wrap: anywhere;
      }

      .psm-progress {
        display: grid;
        gap: 6px;
      }

      .psm-progress-row {
        display: grid;
        grid-template-columns: 44px minmax(0, 1fr) auto;
        gap: 8px;
        align-items: center;
        min-height: 27px;
        color: rgba(226,232,240,0.74);
        font-size: 11px;
        line-height: 1.2;
        font-weight: 900;
      }

      .psm-progress-track {
        height: 7px;
        overflow: hidden;
        border-radius: 999px;
        background: rgba(148,163,184,0.16);
      }

      .psm-progress-bar {
        width: 0%;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #38bdf8, #facc15);
        transition: width 0.24s ease;
      }

      .psm-rule-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 6px;
      }

      .psm-rule {
        min-height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        border: 1px solid rgba(148,163,184,0.14);
        border-radius: 8px;
        background: rgba(2,6,23,0.24);
        color: rgba(226,232,240,0.74);
        font-size: 11px;
        font-weight: 950;
      }

      .psm-rule.active {
        border-color: rgba(250,204,21,0.46);
        background: rgba(250,204,21,0.1);
        color: #fef3c7;
      }

      .psm-note {
        color: rgba(203,213,225,0.78);
        font-size: 12px;
        line-height: 1.45;
        font-weight: 760;
      }

      .psm-panel[data-size="compact"] {
        gap: 7px;
        padding: 8px;
      }

      .psm-panel[data-size="compact"] .psm-panel-card {
        padding: 7px;
      }

      .psm-panel[data-size="compact"] .psm-button {
        min-height: 31px;
        font-size: 10px;
        padding: 6px;
      }

      .psm-panel[data-size="compact"] .psm-current-eq {
        font-size: 15px;
        padding: 7px 6px;
      }

      .psm-panel[data-size="micro"] {
        gap: 6px;
        padding: 7px;
      }

      .psm-panel[data-size="micro"] .psm-panel-card {
        padding: 6px;
      }

      .psm-panel[data-size="micro"] .psm-button {
        min-height: 28px;
        font-size: 9px;
        padding: 5px;
      }

      .psm-panel[data-size="micro"] .psm-preset {
        grid-template-columns: 20px minmax(0, 1fr);
        gap: 5px;
      }

      .psm-panel[data-size="micro"] .psm-preset-index {
        width: 20px;
        height: 20px;
        font-size: 9px;
      }

      .psm-panel[data-size="micro"] .psm-current-eq {
        font-size: 13px;
        padding: 6px 5px;
      }

      .psm-panel[data-size="micro"] .psm-note,
      .psm-panel[data-size="micro"] .psm-progress-row,
      .psm-panel[data-size="micro"] .psm-rule {
        font-size: 10px;
      }

      @media (max-width: 720px), (max-height: 560px) {
        .psm-board {
          inset: 10px;
          gap: 8px;
        }

        .psm-stage {
          padding: 54px 12px 24px;
        }

        .psm-world {
          max-width: calc(100% - 20px);
        }

        .psm-nested-expression {
          font-size: clamp(21px, 7vw, 32px);
          gap: 7px;
        }

        .psm-nested-op,
        .psm-nested-token,
        .psm-nested-bracket {
          min-height: 46px;
          padding: 8px 10px;
        }

        .psm-steps {
          grid-template-columns: 1fr;
          min-height: 0;
        }

        .psm-step {
          padding: 7px 8px;
        }

        .psm-step:nth-child(2),
        .psm-step:nth-child(3) {
          display: none;
        }

        .psm-status-chip {
          font-size: 10px;
          padding: 5px 7px;
        }
      }

      /* 根据模拟框自身宽度收紧嵌套例题，避免 8、9 号例题在窄框内断行。 */
      @container (max-width: 420px) {
        .psm-world {
          width: calc(100% - 12px);
          max-width: calc(100% - 12px);
        }

        .psm-nested-expression {
          gap: 4px;
          font-size: clamp(18px, 7.8cqw, 30px);
        }

        .psm-nested-op {
          min-width: 48px;
          padding: 6px 8px;
        }

        .psm-nested-token {
          min-width: 50px;
          padding: 6px 7px;
          margin: 1px;
        }

        .psm-nested-bracket {
          flex-wrap: nowrap;
          gap: 4px;
          padding: 6px;
        }
      }

      @container (max-width: 330px) {
        .psm-world {
          width: calc(100% - 8px);
          max-width: calc(100% - 8px);
        }

        .psm-nested-expression {
          gap: 3px;
          font-size: clamp(16px, 8cqw, 26px);
        }

        .psm-nested-op {
          min-width: 42px;
          padding: 5px 6px;
        }

        .psm-nested-token {
          min-width: 44px;
          padding: 5px;
        }

        .psm-nested-bracket {
          gap: 3px;
          padding: 5px 4px;
        }
      }

      @keyframes psmTargetBreath {
        0%, 100% { box-shadow: 0 16px 36px rgba(2,6,23,0.28), 0 0 0 0 rgba(250,204,21,0); }
        50% { box-shadow: 0 16px 36px rgba(2,6,23,0.28), 0 0 0 6px rgba(250,204,21,0.12); }
      }

      @keyframes psmOperatorPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.12); }
      }

      @keyframes psmNestedFocus {
        0%, 100% { box-shadow: 0 16px 36px rgba(2,6,23,0.24), 0 0 0 0 rgba(250,204,21,0); }
        50% { box-shadow: 0 18px 42px rgba(2,6,23,0.3), 0 0 0 7px rgba(250,204,21,0.14); }
      }

      @keyframes psmArcDraw {
        to { stroke-dashoffset: 0; }
      }

      @keyframes psmParticle {
        0% {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
        100% {
          opacity: 0;
          transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0.28);
        }
      }
    `;
    document.head.appendChild(style);
  }

  function blockNativeMenus(target, cleanups) {
    if (!target) return;
    const events = ["contextmenu", "selectstart", "dragstart", "copy", "cut", "paste"];
    events.forEach(type => {
      const handler = event => event.preventDefault();
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

  function parseTerm(raw, index) {
    let text = String(raw || "").trim();
    let sign = 1;
    if (text.startsWith("-")) {
      sign = -1;
      text = text.slice(1);
    } else if (text.startsWith("+")) {
      text = text.slice(1);
    }
    const varMatch = text.match(/[a-zA-Z]/);
    const isX = Boolean(varMatch);
    const varChar = varMatch ? varMatch[0] : "";
    let abs = 1;
    if (isX) {
      const coeff = text.replace(/[a-zA-Z]/g, "");
      abs = coeff === "" ? 1 : Math.abs(Number.parseInt(coeff, 10) || 1);
    } else {
      abs = Math.abs(Number.parseInt(text, 10) || 0);
    }
    const value = sign * abs;
    return {
      id: index + 1,
      originalText: raw,
      value,
      isX,
      varChar,
      completed: false
    };
  }

  function parseOutside(raw) {
    if (!raw) return null;
    const parsed = parseTerm(raw, 0);
    return {
      text: raw,
      value: parsed.value,
      isX: parsed.isX,
      varChar: parsed.varChar || "x"
    };
  }

  function parseExpression(input) {
    const str = String(input || "").replace(/\s+/g, "");
    const match = str.match(/^([^\(\[\{]*)([\(\[\{])([^\)\]\}]*)[\)\]\}]$/);
    if (!match) return null;
    const leftPart = match[1] || "";
    const open = match[2] || "(";
    const insidePart = match[3] || "";
    const close = open === "[" ? "]" : open === "{" ? "}" : ")";
    const rawInside = insidePart.match(/[+-]?[^+-]+/g) || [];
    if (!rawInside.length) return null;

    let outside = "";
    let op = "+";
    let coeff = 1;

    if (leftPart === "" || leftPart === "+") {
      op = "+";
      coeff = 1;
    } else if (leftPart === "-") {
      op = "-";
      coeff = 1;
    } else {
      const lastPlus = leftPart.lastIndexOf("+");
      const lastMinus = leftPart.lastIndexOf("-");
      const lastOp = Math.max(lastPlus, lastMinus);
      if (lastOp > 0) {
        outside = leftPart.slice(0, lastOp);
        op = leftPart.charAt(lastOp);
        coeff = Number.parseInt(leftPart.slice(lastOp + 1), 10) || 1;
      } else if (lastOp === 0) {
        op = leftPart.charAt(0);
        coeff = Number.parseInt(leftPart.slice(1), 10) || 1;
      } else {
        op = "+";
        coeff = Number.parseInt(leftPart, 10) || 1;
      }
    }

    return {
      raw: input,
      outside: parseOutside(outside),
      op,
      coeff: Math.abs(coeff),
      multiplier: (op === "-" ? -1 : 1) * Math.abs(coeff),
      open,
      close,
      bracketType: open === "[" ? "square" : open === "{" ? "brace" : "round",
      inside: rawInside.map(parseTerm)
    };
  }

  function termText(value, isX, varChar = "x", showPositive = true) {
    if (value === 0) return "";
    const sign = value < 0 ? "-" : showPositive ? "+" : "";
    const abs = Math.abs(value);
    const body = isX ? (abs === 1 ? varChar : `${abs}${varChar}`) : String(abs);
    return `${sign}${body}`;
  }

  function termClass(value, isX) {
    return value >= 0 ? (isX ? "pos-x" : "pos-const") : (isX ? "neg-x" : "neg-const");
  }

  function formatTermHtml(value, isX, varChar, isFirst = false) {
    const text = termText(value, isX, varChar, !isFirst);
    if (!text) return "";
    return `<span class="psm-term ${value < 0 ? "neg" : "pos"}">${escapeHtml(text)}</span>`;
  }

  function formatRawExpr(expr) {
    const outside = expr.outside ? `${expr.outside.text} ` : "";
    let opText = "";
    if (!expr.outside && expr.op === "+" && expr.coeff > 1) {
      opText = String(expr.coeff);
    } else {
      opText = expr.op === "-" ? "-" : "+";
      if (expr.coeff !== 1) opText += expr.coeff;
    }
    const inside = expr.inside.map((term, index) => {
      const abs = Math.abs(term.value);
      const body = term.isX ? (abs === 1 ? term.varChar : `${abs}${term.varChar}`) : String(abs);
      if (index === 0) return term.value < 0 ? `-${body}` : body;
      return `${term.value < 0 ? "-" : "+"} ${body}`;
    }).join(" ");
    return `${outside}${opText}${expr.open || "("}${inside}${expr.close || ")"}`;
  }

  function calculateResult(expr) {
    let x = 0;
    let constant = 0;
    let varChar = "x";
    if (expr.outside) {
      if (expr.outside.isX) {
        x += expr.outside.value;
        varChar = expr.outside.varChar || varChar;
      } else {
        constant += expr.outside.value;
      }
    }
    expr.inside.forEach(term => {
      const product = expr.multiplier * term.value;
      if (term.isX) {
        x += product;
        varChar = term.varChar || varChar;
      } else {
        constant += product;
      }
    });
    return { x, constant, varChar };
  }

  function formatResultHtml(result) {
    if (result.x === 0 && result.constant === 0) return "0";
    return [
      formatTermHtml(result.x, true, result.varChar, true),
      formatTermHtml(result.constant, false, "", result.x === 0)
    ].join("");
  }

  function formatResultText(result) {
    if (result.x === 0 && result.constant === 0) return "0";
    const parts = [];
    if (result.x !== 0) parts.push(termText(result.x, true, result.varChar, false));
    if (result.constant !== 0) parts.push(termText(result.constant, false, "", parts.length > 0));
    return parts.join("");
  }

  function buildScene(container) {
    const scene = document.createElement("div");
    scene.className = "psm-scene";
    scene.innerHTML = `
      <div class="psm-board">
        <section class="psm-sandbox" aria-label="去括号与符号变化机器模拟区">
          <div class="psm-status">
            <div class="psm-status-chip">算子 <strong data-operator-status></strong></div>
            <div class="psm-status-chip">当前 <strong data-current-status></strong></div>
            <div class="psm-status-chip">完成 <strong data-done-status></strong></div>
          </div>
          <svg class="psm-svg" data-svg aria-hidden="true">
            <defs>
              <marker id="psm-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0,2 L8,5 L0,8 Z" fill="#facc15"></path>
              </marker>
              <marker id="psm-arrow-neg" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0,2 L8,5 L0,8 Z" fill="#fb7185"></path>
              </marker>
            </defs>
          </svg>
          <div class="psm-stage">
            <div class="psm-world" data-world>
              <div class="psm-expression" data-expression></div>
            </div>
          </div>
          <div class="psm-float-layer" data-floats></div>
          <div class="psm-particles" data-particles></div>
        </section>
        <section class="psm-steps" aria-label="推导步骤">
          <div class="psm-step is-main" data-step-process>
            <div class="psm-step-label">当前步骤</div>
            <div class="psm-step-value" data-val-process></div>
          </div>
          <div class="psm-step" data-step-rule>
            <div class="psm-step-label">符号规则</div>
            <div class="psm-step-value" data-val-rule></div>
          </div>
          <div class="psm-step" data-step-original>
            <div class="psm-step-label">原式</div>
            <div class="psm-step-value" data-val-original></div>
          </div>
          <div class="psm-step" data-step-result>
            <div class="psm-step-label">最简结果</div>
            <div class="psm-step-value" data-val-result></div>
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
    panel.className = "psm-panel";
    panel.innerHTML = `
      <div class="psm-panel-card">
        <div class="psm-panel-head"><span>典型例题</span><span data-panel-badge>符号分配</span></div>
        <div class="psm-presets">
          ${Object.entries(EXAMPLES).map(([key, item], index) => `
            <button class="psm-button psm-preset" type="button" data-preset="${key}">
              <span class="psm-preset-index">${index + 1}</span>
              <span class="psm-preset-main">
                <strong>${escapeHtml(item.expr)}</strong>
                <span>${escapeHtml(item.title)}</span>
              </span>
            </button>
          `).join("")}
        </div>
      </div>
      <div class="psm-panel-card psm-current">
        <div class="psm-panel-head"><span>当前算式</span><span data-current-type>去括号</span></div>
        <div class="psm-current-eq" data-current-eq></div>
        <div class="psm-action-grid">
          <button class="psm-button primary" type="button" data-auto>自动演示</button>
          <button class="psm-button" type="button" data-step>单步演示</button>
          <button class="psm-button" type="button" data-random>随机题目</button>
          <button class="psm-button" type="button" data-reset>重置演示</button>
          <button class="psm-button" type="button" data-view-reset>回正视图</button>
        </div>
      </div>
      <div class="psm-panel-card psm-progress">
        <div class="psm-panel-head"><span>演示进度</span><span data-progress-text>0/0</span></div>
        <div class="psm-progress-row">
          <span data-progress-label>项</span>
          <div class="psm-progress-track"><div class="psm-progress-bar" data-progress-bar></div></div>
          <span data-progress-ratio>0%</span>
        </div>
        <div class="psm-note" data-teach-note>点击括号内的卡片，观察算子如何逐项分配。</div>
      </div>
      <div class="psm-panel-card">
        <div class="psm-panel-head"><span>符号判定</span><span data-rule-badge>乘积定号</span></div>
        <div class="psm-rule-grid">
          ${SIGN_RULES.map(rule => `
            <div class="psm-rule" data-rule="${rule.join("")}">
              <span>${rule[0]}</span><span>×</span><span>${rule[1]}</span><span>=</span><strong>${rule[2]}</strong>
            </div>
          `).join("")}
        </div>
      </div>
    `;
    panelHost.appendChild(panel);
    return panel;
  }

  function mount(container, context = {}) {
    ensureStyle();
    const cleanups = [];
    const panelHost = context.externalPanel || null;
    container.innerHTML = "";
    if (panelHost) panelHost.innerHTML = "";
    container.style.overflow = "hidden";

    const scene = buildScene(container);
    const panel = buildPanel(panelHost);
    const state = {
      type: "pos-sign",
      expr: null,
      nestedFlow: null,
      nestedStep: 0,
      animating: false,
      disposed: false,
      isTouchDevice: Boolean(window.matchMedia?.("(pointer: coarse)")?.matches || navigator.maxTouchPoints > 0),
      timers: [],
      cleanups,
      activeStep: -1,
      view: {
        x: 0,
        y: 0,
        zoom: 1
      },
      pointer: {
        mode: null,
        id: null,
        startX: 0,
        startY: 0,
        lastX: 0,
        lastY: 0,
        moved: false,
        termId: null,
        targetId: null
      },
      pinch: {
        ids: [],
        startDistance: 0,
        startZoom: 1,
        startCenterX: 0,
        startCenterY: 0,
        startViewX: 0,
        startViewY: 0
      }
    };

    const refs = {
      scene,
      panel,
      sandbox: scene.querySelector(".psm-sandbox"),
      stage: scene.querySelector(".psm-stage"),
      world: scene.querySelector("[data-world]"),
      expression: scene.querySelector("[data-expression]"),
      svg: scene.querySelector("[data-svg]"),
      floats: scene.querySelector("[data-floats]"),
      particles: scene.querySelector("[data-particles]"),
      operatorStatus: scene.querySelector("[data-operator-status]"),
      currentStatus: scene.querySelector("[data-current-status]"),
      doneStatus: scene.querySelector("[data-done-status]"),
      valOriginal: scene.querySelector("[data-val-original]"),
      valProcess: scene.querySelector("[data-val-process]"),
      valRule: scene.querySelector("[data-val-rule]"),
      valResult: scene.querySelector("[data-val-result]"),
      stepProcess: scene.querySelector("[data-step-process]"),
      stepRule: scene.querySelector("[data-step-rule]"),
      stepResult: scene.querySelector("[data-step-result]"),
      currentEq: panel?.querySelector("[data-current-eq]"),
      currentType: panel?.querySelector("[data-current-type]"),
      panelBadge: panel?.querySelector("[data-panel-badge]"),
      progressLabel: panel?.querySelector("[data-progress-label]"),
      progressText: panel?.querySelector("[data-progress-text]"),
      progressBar: panel?.querySelector("[data-progress-bar]"),
      progressRatio: panel?.querySelector("[data-progress-ratio]"),
      teachNote: panel?.querySelector("[data-teach-note]"),
      ruleBadge: panel?.querySelector("[data-rule-badge]"),
      autoButton: panel?.querySelector("[data-auto]"),
      stepButton: panel?.querySelector("[data-step]")
    };

    [container, scene, refs.sandbox, panel, panelHost].forEach(target => blockNativeMenus(target, cleanups));
    panel?.querySelectorAll("button, div, span, strong").forEach(node => node.setAttribute("draggable", "false"));
    scene.querySelectorAll("div, span, svg").forEach(node => node.setAttribute("draggable", "false"));

    function clearTimers() {
      state.timers.splice(0).forEach(timer => window.clearTimeout(timer));
    }

    function clearAnimationLayers() {
      refs.svg.querySelectorAll(".psm-arc").forEach(node => node.remove());
      refs.floats.innerHTML = "";
      refs.particles.innerHTML = "";
      refs.expression.classList.remove("psm-fade");
      refs.sandbox.querySelectorAll(".psm-merge-card, .psm-final").forEach(node => node.remove());
    }

    function setControlsDisabled(disabled) {
      panel?.querySelectorAll("button").forEach(button => {
        button.disabled = disabled;
      });
    }

    function completedTerms() {
      if (state.nestedFlow) return state.nestedStep;
      return state.expr ? state.expr.inside.filter(term => term.completed).length : 0;
    }

    function totalSteps() {
      if (state.nestedFlow) return state.nestedFlow.steps.length - 1;
      return state.expr ? state.expr.inside.length : 0;
    }

    function currentResult() {
      if (state.nestedFlow) return state.nestedFlow.result;
      return state.expr ? calculateResult(state.expr) : { x: 0, constant: 0, varChar: "x" };
    }

    function applyView() {
      refs.world?.style.setProperty("--pan-x", `${state.view.x}px`);
      refs.world?.style.setProperty("--pan-y", `${state.view.y}px`);
      refs.world?.style.setProperty("--zoom", String(state.view.zoom));
    }

    function resetView() {
      state.view.x = 0;
      state.view.y = 0;
      state.view.zoom = 1;
      applyView();
    }

    function sandboxPoint(clientX, clientY) {
      const rect = refs.sandbox.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    }

    function getTermByElement(element) {
      if (!element || !state.expr) return null;
      return state.expr.inside.find(item => String(item.id) === element.dataset.termId) || null;
    }

    function currentRuleKey(term) {
      if (state.nestedFlow) return "";
      if (!state.expr || !term) return "";
      const left = state.expr.multiplier < 0 ? "-" : "+";
      const right = term.value < 0 ? "-" : "+";
      const result = state.expr.multiplier * term.value < 0 ? "-" : "+";
      return `${left}${right}${result}`;
    }

    function updateSteps() {
      if (state.nestedFlow) {
        const step = state.nestedFlow.steps[state.nestedStep] || state.nestedFlow.steps[0];
        refs.valOriginal.textContent = state.nestedFlow.raw;
        refs.valProcess.textContent = step.process;
        refs.valRule.textContent = step.rule;
        refs.valResult.innerHTML = formatResultHtml(state.nestedFlow.result);
        refs.stepProcess.dataset.active = "true";
        refs.stepRule.dataset.active = "true";
        refs.stepResult.dataset.active = state.nestedStep >= state.nestedFlow.steps.length - 1 ? "true" : "false";
        return;
      }
      if (!state.expr) return;
      const expr = state.expr;
      const done = completedTerms();
      const result = calculateResult(expr);
      refs.valOriginal.textContent = formatRawExpr(expr);

      const multText = expr.multiplier === 1 ? "+1" : String(expr.multiplier);
      const activeTerm = state.activeStep >= 0 ? expr.inside[state.activeStep] : expr.inside.find(term => !term.completed);
      if (activeTerm) {
        const termRaw = termText(activeTerm.value, activeTerm.isX, activeTerm.varChar, true);
        const productRaw = termText(expr.multiplier * activeTerm.value, activeTerm.isX, activeTerm.varChar, true);
        refs.valProcess.innerHTML = `(${escapeHtml(multText)}) × (${escapeHtml(termRaw)}) = ${escapeHtml(productRaw)}`;
      } else {
        refs.valProcess.innerHTML = done === expr.inside.length ? `完成：${formatResultHtml(result)}` : "点击卡片或拖动算子开始";
      }
      refs.valResult.innerHTML = formatResultHtml(result);

      if (activeTerm) {
        const finalSign = expr.multiplier * activeTerm.value < 0 ? "负" : "正";
        const opSign = expr.multiplier < 0 ? "负" : "正";
        const termSign = activeTerm.value < 0 ? "负" : "正";
        refs.valRule.textContent = `${opSign} × ${termSign} = ${finalSign}`;
      } else {
        refs.valRule.textContent = "所有项已完成分配";
      }

      refs.stepProcess.dataset.active = done > 0 && done < expr.inside.length ? "true" : "false";
      refs.stepRule.dataset.active = activeTerm && !activeTerm.completed ? "true" : "false";
      refs.stepResult.dataset.active = done === expr.inside.length ? "true" : "false";
    }

    function updatePanel() {
      if (!state.expr && !state.nestedFlow) return;
      const total = totalSteps();
      const done = completedTerms();
      const ratio = total ? Math.round((done / total) * 100) : 0;
      if (state.nestedFlow) {
        const step = state.nestedFlow.steps[state.nestedStep] || state.nestedFlow.steps[0];
        refs.operatorStatus.textContent = "逐层";
        refs.currentStatus.textContent = step.title;
      } else {
        refs.operatorStatus.textContent = state.expr.multiplier === 1 ? "+1" : String(state.expr.multiplier);
        refs.currentStatus.textContent = done === total ? "已完成" : `第 ${Math.min(done + 1, total)} 项`;
      }
      refs.doneStatus.textContent = `${done}/${total}`;
      if (refs.currentEq) refs.currentEq.textContent = state.nestedFlow ? state.nestedFlow.raw : formatRawExpr(state.expr);
      if (refs.currentType) refs.currentType.textContent = EXAMPLES[state.type]?.title || "随机题目";
      if (refs.panelBadge) refs.panelBadge.textContent = EXAMPLES[state.type]?.badge || (state.type === "random" ? "混合括号" : "符号分配");
      if (refs.progressLabel) refs.progressLabel.textContent = state.nestedFlow ? "层" : "项";
      if (refs.progressText) refs.progressText.textContent = `${done}/${total}`;
      if (refs.progressBar) refs.progressBar.style.width = `${ratio}%`;
      if (refs.progressRatio) refs.progressRatio.textContent = `${ratio}%`;
      if (refs.teachNote) {
        refs.teachNote.textContent = state.nestedFlow
          ? (done === total ? `逐层展开完成，结果为 ${formatResultText(state.nestedFlow.result)}。` : "先内后外，逐层展开括号；可单指移动、双指缩放。")
          : done === total
            ? `去括号完成，结果为 ${formatResultText(calculateResult(state.expr))}。`
            : state.isTouchDevice
              ? "点括号内卡片或拖动算子到卡片；双指缩放，空白处移动。"
              : "点击括号内卡片或拖动算子到卡片，观察逐项分配。";
      }
      if (refs.autoButton) refs.autoButton.textContent = done === total ? "演示完成" : "自动演示";
      if (refs.stepButton) refs.stepButton.textContent = done === total ? "已完成" : state.nestedFlow ? "下一层" : "单步演示";
      if (refs.ruleBadge) refs.ruleBadge.textContent = state.nestedFlow ? "当前层规则" : "乘积定号";
      panel?.querySelectorAll("[data-preset]").forEach(button => {
        button.classList.toggle("active", button.dataset.preset === state.type);
      });
      panel?.querySelectorAll("[data-rule]").forEach(rule => {
        if (state.nestedFlow) {
          rule.classList.toggle("active", false);
          return;
        }
        const activeTerm = state.activeStep >= 0 ? state.expr.inside[state.activeStep] : state.expr.inside.find(term => !term.completed);
        rule.classList.toggle("active", rule.dataset.rule === currentRuleKey(activeTerm));
      });
      fitPanel(panel);
    }

    function drawExpression() {
      if (state.nestedFlow) {
        clearAnimationLayers();
        const step = state.nestedFlow.steps[state.nestedStep] || state.nestedFlow.steps[0];
        refs.expression.innerHTML = `<div class="psm-nested-expression">${step.html}</div>`;
        applyView();
        updateSteps();
        updatePanel();
        return;
      }
      if (!state.expr) return;
      clearAnimationLayers();
      const expr = state.expr;
      const opText = expr.outside
        ? String(expr.coeff)
        : expr.multiplier === 1
          ? "+"
          : expr.multiplier === -1
            ? "-"
            : String(expr.multiplier);
      const parts = [];
      if (expr.outside) {
        parts.push(`
          <div class="psm-token ${termClass(expr.outside.value, expr.outside.isX)}" data-outside>
            <span class="psm-token-face">${escapeHtml(expr.outside.text)}</span>
          </div>
          <div class="psm-join-op" data-join-op>${escapeHtml(expr.op)}</div>
        `);
      }
      parts.push(`<div class="psm-operator" data-operator>${escapeHtml(opText)}</div>`);
      parts.push(`<div class="psm-bracket bracket-${expr.bracketType || "round"}" data-bracket><span class="psm-bracket-char">${escapeHtml(expr.open || "(")}</span>`);
      expr.inside.forEach(term => {
        const product = expr.multiplier * term.value;
        parts.push(`
          <div class="psm-token ${termClass(term.value, term.isX)} is-target" data-term-id="${term.id}">
            <span class="psm-token-face psm-token-front">${escapeHtml(termText(term.value, term.isX, term.varChar, true))}</span>
            <span class="psm-token-face psm-token-back ${termClass(product, term.isX)}">${escapeHtml(termText(product, term.isX, term.varChar, true))}</span>
          </div>
        `);
      });
      parts.push(`<span class="psm-bracket-char">${escapeHtml(expr.close || ")")}</span></div>`);
      refs.expression.innerHTML = parts.join("");
      applyView();
      updateSteps();
      updatePanel();
      requestAnimationFrame(drawGhostArcs);
    }

    function showBubble(termEl, html, isNegative) {
      const sandboxRect = refs.sandbox.getBoundingClientRect();
      const rect = termEl.getBoundingClientRect();
      const bubble = document.createElement("div");
      bubble.className = `psm-bubble${isNegative ? " is-negative" : ""}`;
      bubble.innerHTML = html;
      const x = clamp(rect.left + rect.width / 2 - sandboxRect.left, 80, sandboxRect.width - 80);
      const y = clamp(rect.top - sandboxRect.top, 76, sandboxRect.height - 18);
      bubble.style.left = `${x}px`;
      bubble.style.top = `${y}px`;
      refs.floats.appendChild(bubble);
      window.setTimeout(() => bubble.classList.add("is-visible"), 30);
      state.timers.push(window.setTimeout(() => bubble.classList.remove("is-visible"), 1180));
      state.timers.push(window.setTimeout(() => bubble.remove(), 1420));
      return { x, y };
    }

    function triggerParticles(x, y, isNegative, count = 18) {
      const colors = isNegative ? ["#fb7185", "#fecdd3", "#f97316"] : ["#38bdf8", "#facc15", "#86efac"];
      for (let i = 0; i < count; i += 1) {
        const node = document.createElement("span");
        node.className = "psm-particle";
        node.style.left = `${x}px`;
        node.style.top = `${y}px`;
        node.style.setProperty("--particle-color", colors[i % colors.length]);
        node.style.setProperty("--dx", `${(Math.random() - 0.5) * 140}px`);
        node.style.setProperty("--dy", `${(Math.random() - 0.5) * 110 - 16}px`);
        refs.particles.appendChild(node);
        state.timers.push(window.setTimeout(() => node.remove(), 820));
      }
    }

    function drawArc(operatorEl, termEl, isNegative) {
      const sandboxRect = refs.sandbox.getBoundingClientRect();
      const op = operatorEl.getBoundingClientRect();
      const target = termEl.getBoundingClientRect();
      const startX = op.left + op.width / 2 - sandboxRect.left;
      const startY = op.top + op.height / 2 - sandboxRect.top;
      const endX = target.left + target.width / 2 - sandboxRect.left;
      const endY = target.top + target.height / 2 - sandboxRect.top;
      const controlX = (startX + endX) / 2;
      const controlY = Math.min(startY, endY) - Math.max(56, Math.abs(endX - startX) * 0.18);
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("class", `psm-arc${isNegative ? " is-negative" : ""}`);
      path.setAttribute("d", `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`);
      path.setAttribute("marker-end", isNegative ? "url(#psm-arrow-neg)" : "url(#psm-arrow)");
      refs.svg.appendChild(path);
      state.timers.push(window.setTimeout(() => path.remove(), 1900));
    }

    function drawStaticArc(startX, startY, endX, endY, className, markerEnd) {
      const controlX = (startX + endX) / 2;
      const controlY = Math.min(startY, endY) - Math.max(48, Math.abs(endX - startX) * 0.18);
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("class", className);
      path.setAttribute("d", `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`);
      if (markerEnd) path.setAttribute("marker-end", markerEnd);
      refs.svg.appendChild(path);
      return path;
    }

    function drawGhostArcs() {
      refs.svg.querySelectorAll(".psm-arc.is-ghost").forEach(node => node.remove());
      if (!state.expr || state.animating) return;
      const operatorEl = refs.expression.querySelector("[data-operator]");
      if (!operatorEl) return;
      const sandboxRect = refs.sandbox.getBoundingClientRect();
      const op = operatorEl.getBoundingClientRect();
      const startX = op.left + op.width / 2 - sandboxRect.left;
      const startY = op.top + op.height / 2 - sandboxRect.top;
      state.expr.inside.forEach(term => {
        if (term.completed) return;
        const termEl = refs.expression.querySelector(`[data-term-id="${term.id}"]`);
        if (!termEl) return;
        const rect = termEl.getBoundingClientRect();
        drawStaticArc(
          startX,
          startY,
          rect.left + rect.width / 2 - sandboxRect.left,
          rect.top + rect.height / 2 - sandboxRect.top,
          "psm-arc is-ghost",
          null
        );
      });
    }

    function drawDragArc(clientX, clientY) {
      refs.svg.querySelectorAll(".psm-arc.is-drag").forEach(node => node.remove());
      const operatorEl = refs.expression.querySelector("[data-operator]");
      if (!operatorEl) return;
      const sandboxRect = refs.sandbox.getBoundingClientRect();
      const op = operatorEl.getBoundingClientRect();
      const startX = op.left + op.width / 2 - sandboxRect.left;
      const startY = op.top + op.height / 2 - sandboxRect.top;
      const point = sandboxPoint(clientX, clientY);
      drawStaticArc(startX, startY, point.x, point.y, "psm-arc is-drag", "url(#psm-arrow)");
    }

    async function animateTerm(term, options = {}) {
      if (!state.expr || !term || term.completed || state.animating || state.disposed) return false;
      state.animating = true;
      state.activeStep = state.expr.inside.indexOf(term);
      setControlsDisabled(true);
      refs.svg.querySelectorAll(".psm-arc.is-ghost, .psm-arc.is-drag").forEach(node => node.remove());
      refs.expression.querySelectorAll(".psm-token.is-pressed, .psm-token.is-drag-target").forEach(node => {
        node.classList.remove("is-pressed", "is-drag-target");
      });
      updatePanel();
      updateSteps();

      const operatorEl = refs.expression.querySelector("[data-operator]");
      const termEl = refs.expression.querySelector(`[data-term-id="${term.id}"]`);
      if (!operatorEl || !termEl) {
        state.animating = false;
        setControlsDisabled(false);
        return false;
      }

      const product = state.expr.multiplier * term.value;
      const isNegative = product < 0 || state.expr.multiplier < 0;
      operatorEl.classList.add("is-active");
      drawArc(operatorEl, termEl, isNegative);
      const termRaw = termText(term.value, term.isX, term.varChar, true);
      const productRaw = termText(product, term.isX, term.varChar, true);
      const mult = state.expr.multiplier === 1 ? "+1" : String(state.expr.multiplier);
      const point = showBubble(termEl, `(${escapeHtml(mult)}) × (${escapeHtml(termRaw)}) = ${escapeHtml(productRaw)}`, isNegative);
      triggerParticles(point.x, point.y, isNegative, 12);
      await wait(options.quick ? 740 : 1040, state);
      if (state.disposed) return false;
      term.completed = true;
      termEl.classList.add("is-done");
      termEl.classList.remove("is-target");
      triggerParticles(point.x, point.y + 18, isNegative, 20);
      updateSteps();
      updatePanel();
      await wait(options.quick ? 240 : 420, state);
      operatorEl.classList.remove("is-active");
      const allDone = state.expr.inside.every(item => item.completed);
      if (allDone) {
        refs.expression.querySelector("[data-bracket]")?.classList.add("is-done");
        refs.expression.querySelector("[data-operator]")?.classList.add("is-done");
        refs.expression.querySelector("[data-join-op]")?.classList.add("is-done");
        await completeExpression();
      }

      state.activeStep = -1;
      state.animating = false;
      setControlsDisabled(false);
      updatePanel();
      requestAnimationFrame(drawGhostArcs);
      return true;
    }

    async function completeExpression() {
      if (!state.expr || state.disposed) return;
      await wait(520, state);
      if (state.disposed) return;
      refs.expression.classList.add("psm-fade");
      const sandboxRect = refs.sandbox.getBoundingClientRect();
      const items = [];
      if (state.expr.outside) {
        const node = refs.expression.querySelector("[data-outside]");
        const rect = node?.getBoundingClientRect();
        if (rect) {
          items.push({
            text: state.expr.outside.text,
            value: state.expr.outside.value,
            isX: state.expr.outside.isX,
            varChar: state.expr.outside.varChar || "x",
            x: rect.left - sandboxRect.left,
            y: rect.top - sandboxRect.top
          });
        }
      }
      state.expr.inside.forEach(term => {
        const node = refs.expression.querySelector(`[data-term-id="${term.id}"]`);
        const rect = node?.getBoundingClientRect();
        const value = state.expr.multiplier * term.value;
        if (rect) {
          items.push({
            text: termText(value, term.isX, term.varChar, true),
            value,
            isX: term.isX,
            varChar: term.varChar || "x",
            x: rect.left - sandboxRect.left,
            y: rect.top - sandboxRect.top
          });
        }
      });

      const mergeCards = items.map(item => {
        const card = document.createElement("div");
        card.className = `psm-merge-card ${termClass(item.value, item.isX)}`;
        card.textContent = item.text;
        card.style.left = `${item.x}px`;
        card.style.top = `${item.y}px`;
        refs.sandbox.appendChild(card);
        return { item, card };
      });

      await wait(80, state);
      const cardWidth = Math.min(90, Math.max(58, sandboxRect.width * 0.12));
      const gap = 12;
      const totalWidth = mergeCards.length * cardWidth + Math.max(0, mergeCards.length - 1) * gap;
      const startX = clamp((sandboxRect.width - totalWidth) / 2, 18, Math.max(18, sandboxRect.width - totalWidth - 18));
      const centerY = clamp(sandboxRect.height * 0.5 - 30, 86, Math.max(90, sandboxRect.height - 92));
      mergeCards
        .sort((a, b) => Number(a.item.isX) === Number(b.item.isX) ? 0 : a.item.isX ? -1 : 1)
        .forEach((entry, index) => {
          entry.card.style.left = `${startX + index * (cardWidth + gap)}px`;
          entry.card.style.top = `${centerY}px`;
        });

      await wait(820, state);
      const result = calculateResult(state.expr);
      mergeCards.forEach(entry => {
        entry.card.style.opacity = "0";
        entry.card.style.transform = "scale(0.72)";
        entry.card.style.filter = "blur(3px)";
      });
      await wait(320, state);
      mergeCards.forEach(entry => entry.card.remove());
      const final = document.createElement("div");
      final.className = "psm-final";
      final.innerHTML = `
        <div class="psm-final-label">最终化简结果</div>
        <div class="psm-final-value">${formatResultHtml(result)}</div>
      `;
      refs.sandbox.appendChild(final);
      triggerParticles(sandboxRect.width / 2, sandboxRect.height / 2, false, 28);
      await wait(40, state);
      final.classList.add("is-visible");
      updateSteps();
      updatePanel();
    }

    function resetCurrent() {
      if (!state.expr && !state.nestedFlow) return;
      clearTimers();
      state.animating = false;
      state.activeStep = -1;
      refs.stage.__psmPointers?.clear?.();
      if (state.nestedFlow) {
        state.nestedStep = 0;
      }
      state.expr?.inside.forEach(term => {
        term.completed = false;
      });
      setControlsDisabled(false);
      resetView();
      drawExpression();
    }

    function loadExpression(type, raw) {
      clearTimers();
      state.type = type;
      state.activeStep = -1;
      state.animating = false;
      state.nestedFlow = EXAMPLES[type]?.nested ? NESTED_FLOWS[type] || null : null;
      state.nestedStep = 0;
      state.expr = null;
      if (state.nestedFlow) {
        setControlsDisabled(false);
        resetView();
        drawExpression();
        return;
      }
      const parsed = parseExpression(raw || EXAMPLES[type]?.expr);
      if (!parsed) return;
      state.expr = parsed;
      setControlsDisabled(false);
      resetView();
      drawExpression();
    }

    function nextTerm() {
      if (state.nestedFlow) {
        if (state.animating) return;
        state.nestedStep = Math.min(state.nestedFlow.steps.length - 1, state.nestedStep + 1);
        drawExpression();
        return;
      }
      if (!state.expr || state.animating) return;
      const term = state.expr.inside.find(item => !item.completed);
      if (term) animateTerm(term);
    }

    async function autoPlay() {
      if (state.nestedFlow) {
        if (state.animating) return;
        state.animating = true;
        setControlsDisabled(true);
        while (!state.disposed && state.nestedStep < state.nestedFlow.steps.length - 1) {
          await wait(780, state);
          state.nestedStep += 1;
          drawExpression();
        }
        state.animating = false;
        setControlsDisabled(false);
        updatePanel();
        return;
      }
      if (!state.expr || state.animating) return;
      const terms = state.expr.inside.filter(item => !item.completed);
      for (const term of terms) {
        if (state.disposed) break;
        await animateTerm(term, { quick: false });
        await wait(220, state);
      }
    }

    function generateRandomExpr() {
      const variables = ["x", "a", "b", "y"];
      const variable = variables[Math.floor(Math.random() * variables.length)];
      const brackets = [
        ["(", ")"],
        ["[", "]"],
        ["{", "}"]
      ];
      const [open, close] = brackets[Math.floor(Math.random() * brackets.length)];
      const c = (Math.random() < 0.5 ? -1 : 1) * (Math.floor(Math.random() * 3) + 1);
      const d = (Math.random() < 0.5 ? -1 : 1) * (Math.floor(Math.random() * 8) + 2);
      const coeff = Math.floor(Math.random() * 4) + 2;
      const op = Math.random() < 0.5 ? "+" : "-";
      const forms = ["simple", "coeff", "outside"];
      const form = forms[Math.floor(Math.random() * forms.length)];
      const cx = c === 1 ? variable : c === -1 ? `-${variable}` : `${c}${variable}`;
      const dText = d >= 0 ? `+${d}` : String(d);
      const inside = `${cx}${dText}`;
      if (form === "simple") return `${op}${open}${inside}${close}`;
      if (form === "coeff") return `${op === "-" ? "-" : ""}${coeff}${open}${inside}${close}`;
      const outside = (Math.random() < 0.5 ? -1 : 1) * (Math.floor(Math.random() * 8) + 2);
      return `${outside}${op}${coeff}${open}${inside}${close}`;
    }

    function distance(a, b) {
      const dx = a.clientX - b.clientX;
      const dy = a.clientY - b.clientY;
      return Math.hypot(dx, dy);
    }

    function centerOfTouches(touches) {
      const x = touches.reduce((sum, touch) => sum + touch.clientX, 0) / touches.length;
      const y = touches.reduce((sum, touch) => sum + touch.clientY, 0) / touches.length;
      return { x, y };
    }

    function activePointersFromEvent(event) {
      const all = [...(event.currentTarget.__psmPointers || new Map()).values()];
      return all;
    }

    refs.stage.__psmPointers = new Map();

    refs.stage.addEventListener("pointerdown", event => {
      if ((!state.expr && !state.nestedFlow) || state.animating || state.disposed) return;
      event.preventDefault();
      refs.stage.setPointerCapture?.(event.pointerId);
      refs.stage.__psmPointers.set(event.pointerId, event);
      refs.world.classList.add("is-manipulating");

      const touches = activePointersFromEvent(event);
      if (touches.length >= 2) {
        const pair = touches.slice(0, 2);
        const center = centerOfTouches(pair);
        state.pointer.mode = "pinch";
        state.pinch.ids = pair.map(pointer => pointer.pointerId);
        state.pinch.startDistance = Math.max(1, distance(pair[0], pair[1]));
        state.pinch.startZoom = state.view.zoom;
        state.pinch.startCenterX = center.x;
        state.pinch.startCenterY = center.y;
        state.pinch.startViewX = state.view.x;
        state.pinch.startViewY = state.view.y;
        return;
      }

      const operator = event.target.closest("[data-operator]");
      const termEl = event.target.closest("[data-term-id]");
      state.pointer.id = event.pointerId;
      state.pointer.startX = event.clientX;
      state.pointer.startY = event.clientY;
      state.pointer.lastX = event.clientX;
      state.pointer.lastY = event.clientY;
      state.pointer.moved = false;
      state.pointer.targetId = null;

      if (state.nestedFlow) {
        state.pointer.mode = "pan";
        refs.stage.classList.add("is-panning");
        return;
      }

      if (operator) {
        state.pointer.mode = "operator-drag";
        operator.classList.add("is-dragging");
        drawDragArc(event.clientX, event.clientY);
        return;
      }

      if (termEl) {
        const term = getTermByElement(termEl);
        if (term && !term.completed) {
          state.pointer.mode = "term-tap";
          state.pointer.termId = term.id;
          termEl.classList.add("is-pressed");
          state.activeStep = state.expr.inside.indexOf(term);
          updateSteps();
          updatePanel();
          return;
        }
      }

      state.pointer.mode = "pan";
      refs.stage.classList.add("is-panning");
    });

    refs.stage.addEventListener("pointermove", event => {
      const pointerMap = refs.stage.__psmPointers;
      if (pointerMap?.has(event.pointerId)) pointerMap.set(event.pointerId, event);
      if (!state.pointer.mode || state.disposed) return;
      event.preventDefault();

      const touches = activePointersFromEvent(event);
      if (state.pointer.mode === "pinch" && touches.length >= 2) {
        const pair = touches.slice(0, 2);
        const center = centerOfTouches(pair);
        const nextZoom = clamp(state.pinch.startZoom * (distance(pair[0], pair[1]) / state.pinch.startDistance), 0.72, 1.85);
        state.view.zoom = nextZoom;
        state.view.x = clamp(state.pinch.startViewX + (center.x - state.pinch.startCenterX), -420, 420);
        state.view.y = clamp(state.pinch.startViewY + (center.y - state.pinch.startCenterY), -320, 320);
        applyView();
        refs.svg.querySelectorAll(".psm-arc.is-ghost").forEach(node => node.remove());
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
        refs.svg.querySelectorAll(".psm-arc.is-ghost").forEach(node => node.remove());
        return;
      }

      if (state.pointer.mode === "operator-drag") {
        drawDragArc(event.clientX, event.clientY);
        const hit = document.elementFromPoint(event.clientX, event.clientY)?.closest?.("[data-term-id]");
        refs.expression.querySelectorAll(".psm-token.is-drag-target").forEach(node => node.classList.remove("is-drag-target"));
        state.pointer.targetId = null;
        if (hit) {
          const term = getTermByElement(hit);
          if (term && !term.completed) {
            state.pointer.targetId = term.id;
            hit.classList.add("is-drag-target");
            state.activeStep = state.expr.inside.indexOf(term);
            updateSteps();
            updatePanel();
          }
        }
        return;
      }

      if (state.pointer.mode === "term-tap" && state.pointer.moved) {
        const pressed = refs.expression.querySelector(`[data-term-id="${state.pointer.termId}"]`);
        pressed?.classList.remove("is-pressed");
      }
    });

    function endPointer(event) {
      const pointerMap = refs.stage.__psmPointers;
      pointerMap?.delete(event.pointerId);
      refs.stage.releasePointerCapture?.(event.pointerId);
      refs.world.classList.remove("is-manipulating");
      refs.stage.classList.remove("is-panning");
      refs.expression.querySelector("[data-operator]")?.classList.remove("is-dragging");
      refs.svg.querySelectorAll(".psm-arc.is-drag").forEach(node => node.remove());
      refs.expression.querySelectorAll(".psm-token.is-pressed, .psm-token.is-drag-target").forEach(node => {
        node.classList.remove("is-pressed", "is-drag-target");
      });

      if (state.pointer.mode === "pinch") {
        if ((pointerMap?.size || 0) > 0) return;
        state.pointer.mode = null;
        requestAnimationFrame(drawGhostArcs);
        return;
      }

      if (state.pointer.mode === "term-tap" && event.pointerId === state.pointer.id && !state.pointer.moved) {
        const term = state.expr?.inside.find(item => item.id === state.pointer.termId);
        state.pointer.mode = null;
        state.activeStep = -1;
        if (term) animateTerm(term);
        return;
      }

      if (state.pointer.mode === "operator-drag" && event.pointerId === state.pointer.id) {
        const term = state.expr?.inside.find(item => item.id === state.pointer.targetId);
        state.pointer.mode = null;
        state.activeStep = -1;
        updateSteps();
        updatePanel();
        requestAnimationFrame(drawGhostArcs);
        if (term) animateTerm(term);
        return;
      }

      state.pointer.mode = null;
      state.pointer.id = null;
      state.pointer.termId = null;
      state.pointer.targetId = null;
      state.activeStep = -1;
      updateSteps();
      updatePanel();
      requestAnimationFrame(drawGhostArcs);
    }

    refs.stage.addEventListener("pointerup", endPointer);
    refs.stage.addEventListener("pointercancel", endPointer);

    panel?.addEventListener("click", event => {
      const preset = event.target.closest("[data-preset]");
      if (preset) {
        loadExpression(preset.dataset.preset);
        return;
      }
      if (event.target.closest("[data-auto]")) {
        autoPlay();
        return;
      }
      if (event.target.closest("[data-step]")) {
        nextTerm();
        return;
      }
      if (event.target.closest("[data-random]")) {
        loadExpression("random", generateRandomExpr());
        return;
      }
      if (event.target.closest("[data-reset]")) {
        resetCurrent();
        return;
      }
      if (event.target.closest("[data-view-reset]")) {
        resetView();
        requestAnimationFrame(drawGhostArcs);
      }
    });

    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => {
      fitPanel(panel);
      requestAnimationFrame(drawGhostArcs);
    }) : null;
    if (panelHost && resizeObserver) resizeObserver.observe(panelHost);
    if (resizeObserver) cleanups.push(() => resizeObserver.disconnect());

    loadExpression("pos-sign");
    fitPanel(panel);

    container.__parenthesesSignMachineCleanup = () => {
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
      if (typeof container.__parenthesesSignMachineCleanup === "function") {
        container.__parenthesesSignMachineCleanup();
        delete container.__parenthesesSignMachineCleanup;
      } else {
        container.innerHTML = "";
        if (context.externalPanel) context.externalPanel.innerHTML = "";
      }
    }
  };
})();
