window.BIO_VISUAL_SCENES = window.BIO_VISUAL_SCENES || {};

window.BIO_VISUAL_SCENES["j7a_m04"] = (function () {
  const PHASES = [
    {
      id: "interphase",
      name: "间期",
      shortName: "间期",
      tag: "1 / 6",
      focus: "细胞生长并完成 DNA 复制，为分裂准备遗传物质。",
      explain: "染色质呈细丝状分布在完整的细胞核中。以 2n = 4 为例，DNA 已复制，但染色体数仍为 4 条。",
      key: "DNA 复制与物质准备",
      count: "染色体：4 条",
      review: [
        "间期完成 DNA 复制和有关蛋白质合成，是分裂前的物质准备阶段。",
        "复制后每条染色体含两条姐妹染色单体，但按着丝粒计数，染色体数仍是 4 条。",
        "易错点：DNA 已复制不等于细胞已分裂，此时仍只有一个母细胞。"
      ]
    },
    {
      id: "prophase",
      name: "前期",
      shortName: "前期",
      tag: "2 / 6",
      focus: "染色质凝聚为染色体，核膜和核仁逐渐消失。",
      explain: "每条染色体由两条姐妹染色单体构成。纺锤体形成，动物细胞两极出现中心体和星射线。",
      key: "染色体出现，纺锤体形成",
      count: "染色体：4 条；DNA：8 个",
      review: [
        "染色质螺旋化、缩短变粗，才成为显微镜下容易观察的染色体。",
        "核膜和核仁逐渐消失，纺锤丝开始形成；动物细胞可观察到中心体和星射线。",
        "口诀：膜仁消失现两体，两体指染色体和纺锤体。"
      ]
    },
    {
      id: "metaphase",
      name: "中期",
      shortName: "中期",
      tag: "3 / 6",
      focus: "着丝粒排列在赤道板上，纺锤丝分别连接细胞两极。",
      explain: "赤道板是一个虚拟平面。此时染色体形态最稳定、数目最清晰，是观察染色体的最佳时期。",
      key: "形定数晰，赤道齐",
      count: "染色体：4 条；染色单体：8 条",
      review: [
        "纺锤丝牵引染色体，使所有着丝粒排列在赤道板这一虚拟平面上。",
        "中期染色体形态最稳定、数目最清晰，是观察染色体形态和计数的最佳时期。",
        "易错点：赤道板不是真实存在的细胞结构。"
      ]
    },
    {
      id: "anaphase",
      name: "后期",
      shortName: "后期",
      tag: "4 / 6",
      focus: "着丝粒分裂，姐妹染色单体被纺锤丝牵引到细胞两极。",
      explain: "姐妹染色单体分开后成为独立染色体，细胞内染色体数暂时加倍；两极各得到相同的一套遗传物质。",
      key: "粒裂数增，均向两极",
      count: "染色体：8 条",
      review: [
        "着丝粒一分为二，原来相连的姐妹染色单体分开，各自成为一条染色体。",
        "细胞内染色体数暂时由 4 条变为 8 条，但两极最终各分到相同的 4 条。",
        "易错点：后期的数目加倍发生在同一个细胞中，不是每个子细胞都有 8 条。"
      ]
    },
    {
      id: "telophase",
      name: "末期",
      shortName: "末期",
      tag: "5 / 6",
      focus: "两极的染色体解螺旋，两个新细胞核逐渐形成。",
      explain: "纺锤体消失，核膜和核仁重现。动物细胞中部开始缢裂，植物细胞中央开始形成细胞板。",
      key: "两核重建，分裂收尾",
      count: "两极各有 4 条染色体",
      review: [
        "到达两极的染色体逐渐解螺旋，重新恢复为染色质状态。",
        "核膜和核仁重新出现，纺锤体消失，两个新细胞核逐步建立。",
        "动物细胞中部开始缢裂；植物细胞中央形成细胞板，分裂方式不同。"
      ]
    },
    {
      id: "cytokinesis",
      name: "胞质分裂",
      shortName: "胞质",
      tag: "6 / 6",
      focus: "细胞质完全分开，形成两个遗传物质相同的子细胞。",
      explain: "动物细胞通过细胞膜向内凹陷完成缢裂；植物细胞通过细胞板扩展形成新的细胞壁。",
      key: "一分为二，遗传稳定",
      count: "子细胞：2 个",
      review: [
        "细胞质彻底分开后，一个母细胞形成两个子细胞，细胞数目由 1 变为 2。",
        "两个子细胞各获得一套相同的遗传物质，这是生物生长、发育和组织修复的基础。",
        "区分：动物细胞靠细胞膜向内凹陷，植物细胞靠细胞板扩展为新的细胞壁。"
      ]
    }
  ];

  const EXAMS = [
    {
      q: "细胞分裂前，染色体通常要先复制。",
      answer: true,
      ok: "对。先复制，后平均分配，是两个子细胞遗传物质稳定的原因。",
      bad: "再想一步：如果不先复制，两个子细胞很难各得到完整的一套遗传物质。"
    },
    {
      q: "细胞分裂的主要结果是细胞体积不断变大。",
      answer: false,
      ok: "对。细胞分裂的直接结果是细胞数目增加，体积变大主要属于细胞生长。",
      bad: "这里容易混：分裂让数量增加，生长让体积增大。"
    },
    {
      q: "细胞核分裂时，染色体要平均分配到两个新细胞核中。",
      answer: true,
      ok: "对。平均分配保证两个子细胞获得相同的遗传物质。",
      bad: "关键考点正是平均分配，不是随机丢到两边。"
    },
    {
      q: "植物细胞分裂末期通常通过细胞膜向内凹陷完成分裂。",
      answer: false,
      ok: "对。向内凹陷常见于动物细胞；植物细胞通常形成细胞板。",
      bad: "注意区分动物细胞和植物细胞的分裂方式。"
    }
  ];

  const CHROMOSOME_TYPES = {
    red: { label: "红", color: "#fb7185", dark: "#be123c" },
    blue: { label: "蓝", color: "#38bdf8", dark: "#0369a1" }
  };

  const ORGANELLES = [
    { x: -118, y: -86, r: 9, type: "vacuole", rot: -10 },
    { x: -92, y: 88, r: 7, type: "mito", rot: 22 },
    { x: -42, y: -112, r: 8, type: "dot", rot: 0 },
    { x: 86, y: -88, r: 8, type: "mito", rot: -28 },
    { x: 116, y: 44, r: 9, type: "vacuole", rot: 0 },
    { x: 42, y: 104, r: 7, type: "dot", rot: 0 },
    { x: 124, y: -12, r: 6, type: "dot", rot: 0 },
    { x: -126, y: 4, r: 6, type: "dot", rot: 0 }
  ];

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function ease(t) {
    return t * t * (3 - 2 * t);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function roundedRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }

  function resolvePanel(context, externalPanel) {
    if (externalPanel) return externalPanel;
    if (context && context.externalPanel) return context.externalPanel;
    return null;
  }

  return {
    mount: function mount(container, context, externalPanelArg) {
      if (!container) return;

      const externalPanel = resolvePanel(context, externalPanelArg);
      const sceneId = "cell-division-" + Math.random().toString(36).slice(2, 9);
      const abortCtrl = typeof AbortController !== "undefined" ? new AbortController() : null;
      const cleanupFns = [];
      const signal = abortCtrl ? abortCtrl.signal : undefined;

      let phaseIndex = 0;
      let visualPhase = 0;
      let isPlaying = false;
      let playTimer = null;
      let playSpeed = 1;
      let cellKind = "animal";
      let mode = "learn";
      let feedback = "先观察一个亲代细胞，再完成染色体复制和平均分配。";
      let examIndex = 0;
      let examFeedback = "";
      let challengeStep = "start";
      let dragItem = null;
      let pointerOffset = { x: 0, y: 0 };
      let rafId = 0;
      let destroyed = false;
      let lastTime = performance.now();

      const dragItems = [
        { id: "r1", type: "red", x: -78, y: -30, homeX: -78, homeY: -30, zone: null },
        { id: "r2", type: "red", x: 78, y: -30, homeX: 78, homeY: -30, zone: null },
        { id: "b1", type: "blue", x: -78, y: 42, homeX: -78, homeY: 42, zone: null },
        { id: "b2", type: "blue", x: 78, y: 42, homeX: 78, homeY: 42, zone: null }
      ];

      const style = document.createElement("style");
      style.textContent = `
        [data-scope="${sceneId}"] {
          width: 100%;
          height: 100%;
          min-height: 0;
          position: relative;
          overflow: hidden;
          color: #ecfeff;
          background: radial-gradient(circle at 48% 42%, #0f766e 0%, #123145 38%, #06131f 100%);
          font-family: "Microsoft YaHei UI", "PingFang SC", "Inter", sans-serif;
          touch-action: none;
        }
        [data-scope="${sceneId}"] * { box-sizing: border-box; }
        [data-scope="${sceneId}"] .division-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: block;
          touch-action: none;
          z-index: 2;
        }
        [data-scope="${sceneId}"] .division-canvas-fallback {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: block;
          opacity: 0;
          pointer-events: none;
          z-index: 1;
        }
        [data-scope="${sceneId}"] .division-svg text {
          paint-order: stroke;
          stroke: rgba(2, 6, 23, 0.72);
          stroke-width: 3px;
          stroke-linejoin: round;
        }
        [data-scope="${sceneId}"] .division-svg .soft-pulse {
          transform-origin: center;
          animation: ${sceneId}-pulse 2.8s ease-in-out infinite;
        }
        [data-scope="${sceneId}"] .division-svg .stream-line,
        [data-scope="${sceneId}"] .division-svg .spindle-line {
          stroke-dasharray: 9 12;
          animation: ${sceneId}-dash 2.4s linear infinite;
        }
        [data-scope="${sceneId}"] .division-svg .drag-chromosome {
          cursor: grab;
        }
        [data-scope="${sceneId}"] .division-svg .drag-chromosome:active {
          cursor: grabbing;
        }
        @keyframes ${sceneId}-pulse {
          0%, 100% { opacity: 0.78; }
          50% { opacity: 1; }
        }
        @keyframes ${sceneId}-dash {
          to { stroke-dashoffset: -42; }
        }
        .cell-panel-${sceneId} {
          width: 100%;
          height: auto;
          min-height: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
          color: #e5f7ff;
          overflow: visible;
          scrollbar-width: none;
          font-family: "Microsoft YaHei UI", "PingFang SC", "Inter", sans-serif;
        }
        .cell-panel-${sceneId}::-webkit-scrollbar { display: none; }
        .cell-panel-${sceneId} * { box-sizing: border-box; }
        .cell-panel-${sceneId} .op-card {
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 16px;
          background: rgba(8, 20, 33, 0.74);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.055), 0 10px 24px rgba(0,0,0,0.14);
          padding: 14px;
          display: grid;
          gap: 12px;
          min-height: 0;
          flex-shrink: 0;
        }
        .cell-panel-${sceneId} .op-card.compact-card {
          gap: 10px;
        }
        .cell-panel-${sceneId} .cell-head-card {
          padding: 16px;
        }
        .cell-panel-${sceneId} .panel-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .cell-panel-${sceneId} .panel-chip {
          min-width: 0;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 999px;
          background: rgba(255,255,255,0.045);
          color: rgba(226,232,240,0.78);
          padding: 5px 9px;
          font-size: 10px;
          line-height: 1;
          font-weight: 900;
          white-space: nowrap;
        }
        .cell-panel-${sceneId} .section-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          min-width: 0;
        }
        .cell-panel-${sceneId} .section-label span {
          color: rgba(148,163,184,0.9);
          font-size: 11px;
          line-height: 1;
          font-weight: 900;
        }
        .cell-panel-${sceneId} .section-label strong {
          min-width: 0;
          max-width: 58%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #fff;
          font-size: 11px;
          line-height: 1;
          font-weight: 950;
          text-align: right;
        }
        .cell-panel-${sceneId} .panel-kicker {
          color: rgba(125, 211, 252, 0.88);
          font-size: 11px;
          line-height: 1.2;
          font-weight: 900;
          letter-spacing: 0.12em;
        }
        .cell-panel-${sceneId} .panel-headline {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .cell-panel-${sceneId} .panel-title {
          color: #f8fafc;
          font-size: 22px;
          line-height: 1.08;
          font-weight: 900;
        }
        .cell-panel-${sceneId} .mini-pill {
          color: #a7f3d0;
          background: rgba(20, 184, 166, 0.14);
          border: 1px solid rgba(45, 212, 191, 0.2);
          border-radius: 12px;
          padding: 8px 10px;
          font-size: 12px;
          line-height: 1.1;
          font-weight: 900;
          white-space: nowrap;
        }
        .cell-panel-${sceneId} .seg {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }
        .cell-panel-${sceneId} .speed-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }
        .cell-panel-${sceneId} button {
          appearance: none;
          -webkit-tap-highlight-color: transparent;
          border: 1px solid rgba(148, 163, 184, 0.17);
          border-radius: 10px;
          color: #dff7ff;
          background: rgba(15, 23, 42, 0.72);
          min-height: var(--bio-touch-target, 44px);
          padding: 7px 9px;
          font-size: 12px;
          line-height: 1.2;
          font-weight: 900;
          cursor: pointer;
          transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease, color 0.16s ease;
        }
        .cell-panel-${sceneId} button:hover { transform: translateY(-1px); border-color: rgba(103, 232, 249, 0.42); }
        .cell-panel-${sceneId} button:active { transform: translateY(0); }
        .cell-panel-${sceneId} button.active {
          color: #042f2e;
          background: linear-gradient(135deg, #67e8f9, #34d399);
          border-color: rgba(103, 232, 249, 0.62);
        }
        .cell-panel-${sceneId} button.primary {
          color: #031b22;
          background: linear-gradient(135deg, #22d3ee, #2dd4bf);
          border-color: rgba(103, 232, 249, 0.66);
        }
        .cell-panel-${sceneId} button.warn {
          color: #241205;
          background: linear-gradient(135deg, #fcd34d, #fb923c);
          border-color: rgba(251, 191, 36, 0.66);
        }
        .cell-panel-${sceneId} button:disabled {
          cursor: default;
          opacity: 0.38;
          transform: none;
        }
        .cell-panel-${sceneId} .phase-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }
        .cell-panel-${sceneId} .phase-btn {
          min-height: var(--bio-touch-target, 44px);
          padding: 7px 5px;
          font-size: 12px;
          white-space: nowrap;
        }
        .cell-panel-${sceneId} .info-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
        }
        .cell-panel-${sceneId} .stage-name {
          color: #f8fafc;
          font-size: 17px;
          line-height: 1.22;
          font-weight: 900;
        }
        .cell-panel-${sceneId} .focus-text {
          color: #bae6fd;
          font-size: 12px;
          line-height: 1.55;
          font-weight: 900;
        }
        .cell-panel-${sceneId} .explain-text {
          color: rgba(226, 232, 240, 0.92);
          font-size: 12px;
          line-height: 1.58;
          font-weight: 700;
        }
        .cell-panel-${sceneId} .action-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }
        .cell-panel-${sceneId} .feedback {
          min-height: 32px;
          border-radius: 12px;
          border: 1px solid rgba(103, 232, 249, 0.16);
          background: rgba(8, 47, 73, 0.38);
          color: rgba(224, 242, 254, 0.94);
          padding: 10px 12px;
          font-size: 12px;
          line-height: 1.5;
          font-weight: 800;
        }
        .cell-panel-${sceneId} .review-list {
          display: grid;
          gap: 7px;
          margin: 0;
          padding: 0;
          list-style: none;
        }
        .cell-panel-${sceneId} .review-list li {
          display: grid;
          grid-template-columns: 6px minmax(0, 1fr);
          gap: 8px;
          align-items: start;
          color: rgba(226,232,240,0.88);
          font-size: 12px;
          line-height: 1.5;
          font-weight: 760;
        }
        .cell-panel-${sceneId} .review-list li::before {
          content: "";
          width: 6px;
          height: 6px;
          margin-top: 6px;
          border-radius: 50%;
          background: #5eead4;
          box-shadow: 0 0 10px rgba(45,212,191,0.35);
        }
        .cell-panel-${sceneId} .zone-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 6px;
        }
        .cell-panel-${sceneId} .zone-pill {
          border-radius: 8px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: rgba(15, 23, 42, 0.46);
          padding: 7px 8px;
          min-height: 38px;
          display: grid;
          gap: 3px;
        }
        .cell-panel-${sceneId} .zone-label {
          color: rgba(203, 213, 225, 0.88);
          font-size: 11px;
          font-weight: 900;
        }
        .cell-panel-${sceneId} .zone-value {
          color: #f8fafc;
          font-size: 12px;
          font-weight: 900;
        }
        .cell-panel-${sceneId} .challenge-box {
          display: grid;
          gap: 7px;
        }
        .cell-panel-${sceneId} .exam-q {
          color: rgba(241, 245, 249, 0.96);
          font-size: 12px;
          line-height: 1.48;
          font-weight: 900;
        }
        .cell-panel-${sceneId} .exam-actions {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 6px;
        }
        .cell-panel-${sceneId} .exam-feedback {
          color: #fde68a;
          min-height: 18px;
          font-size: 12px;
          line-height: 1.45;
          font-weight: 800;
        }
        .cell-panel-${sceneId}[data-panel-size="compact"] {
          gap: 10px;
        }
        .cell-panel-${sceneId}[data-panel-size="compact"] .op-card {
          padding: 10px;
          gap: 8px;
        }
        .cell-panel-${sceneId}[data-panel-size="compact"] .panel-title {
          font-size: 18px;
        }
        .cell-panel-${sceneId}[data-panel-size="compact"] .phase-btn {
          min-height: 40px;
          font-size: 11px;
        }
        .cell-panel-${sceneId}[data-panel-size="compact"] .explain-text { display: none; }
        .cell-panel-${sceneId}[data-panel-size="compact"] .exam-feedback { display: none; }
        .cell-panel-${sceneId}[data-panel-size="micro"] {
          gap: 6px;
        }
        .cell-panel-${sceneId}[data-panel-size="micro"] .op-card {
          padding: 8px;
          gap: 6px;
        }
        .cell-panel-${sceneId}[data-panel-size="micro"] .explain-text,
        .cell-panel-${sceneId}[data-panel-size="micro"] .exam-feedback,
        .cell-panel-${sceneId}[data-panel-size="micro"] .zone-row {
          display: none;
        }
        .cell-panel-${sceneId}[data-panel-size="micro"] .exam-card {
          display: none;
        }
        .cell-panel-${sceneId}[data-panel-size="micro"] .feedback {
          max-height: 48px;
          overflow: hidden;
        }
        .cell-panel-${sceneId}[data-panel-size="micro"] .panel-title,
        .cell-panel-${sceneId}[data-panel-size="micro"] .stage-name {
          font-size: 15px;
        }
        .cell-panel-${sceneId}[data-panel-size="micro"] button {
          min-height: 40px;
          padding: 6px;
          font-size: 11px;
        }
        .cell-panel-${sceneId}[data-panel-size="micro"] .phase-grid {
          gap: 4px;
        }
        @media (max-width: 640px) {
          .cell-panel-${sceneId} .phase-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .cell-panel-${sceneId} .phase-btn { font-size: 11px; }
          .cell-panel-${sceneId} .action-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .cell-panel-${sceneId} .exam-actions { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
      `;
      document.head.appendChild(style);

      container.setAttribute("data-scope", sceneId);
      container.setAttribute("data-size", "normal");
      container.innerHTML = `
        <svg class="division-svg" aria-label="细胞分裂 SVG 动态模拟框" viewBox="-420 -285 840 570" preserveAspectRatio="xMidYMid meet"></svg>
        <canvas class="division-canvas-fallback" aria-label="细胞分裂交互模拟框"></canvas>
      `;

      const svg = container.querySelector(".division-svg");
      const canvas = container.querySelector("canvas");
      const ctx = canvas.getContext("2d");
      const simFocus = null;
      let W = 0;
      let H = 0;
      let dpr = 1;
      let view = { ox: 0, oy: 0, scale: 1 };
      let svgViewBox = { x: -420, y: -285, width: 840, height: 570 };

      function resetDragItems() {
        dragItems.forEach((item) => {
          item.x = item.homeX;
          item.y = item.homeY;
          item.zone = null;
        });
      }

      function zoneCounts() {
        const empty = () => ({ red: 0, blue: 0, label: "还未放入" });
        const left = empty();
        const right = empty();
        dragItems.forEach((item) => {
          if (item.zone === "left") left[item.type] += 1;
          if (item.zone === "right") right[item.type] += 1;
        });
        left.label = `红 ${left.red} / 蓝 ${left.blue}`;
        right.label = `红 ${right.red} / 蓝 ${right.blue}`;
        return { left, right };
      }

      function distributionCorrect() {
        const counts = zoneCounts();
        return counts.left.red === 1 && counts.left.blue === 1 && counts.right.red === 1 && counts.right.blue === 1;
      }

      function setPhase(nextIndex) {
        phaseIndex = clamp(nextIndex, 0, PHASES.length - 1);
        feedback = PHASES[phaseIndex].focus;
        if (simFocus) simFocus.textContent = PHASES[phaseIndex].focus;
        renderPanel();
      }

      function stopPlay() {
        isPlaying = false;
        if (playTimer) window.clearInterval(playTimer);
        playTimer = null;
        renderPanel();
      }

      function startPlay() {
        if (isPlaying) return;
        isPlaying = true;
        renderPanel();
        playTimer = window.setInterval(() => {
          if (phaseIndex >= PHASES.length - 1) {
            stopPlay();
            return;
          }
          setPhase(phaseIndex + 1);
        }, 1800 / playSpeed);
      }

      function setMode(nextMode) {
        mode = nextMode;
        stopPlay();
        if (mode === "challenge") {
          phaseIndex = 0;
          challengeStep = "start";
          resetDragItems();
          feedback = "挑战开始：先点击“复制染色体”，再把红、蓝染色体各一份拖到左右两个新细胞核。";
        } else {
          phaseIndex = 0;
          challengeStep = "start";
          resetDragItems();
          feedback = "学习模式：按阶段观察细胞分裂的顺序和规律。";
        }
        if (simFocus) simFocus.textContent = PHASES[phaseIndex].focus;
        renderPanel();
      }

      function runChallengeAction(action) {
        stopPlay();
        if (action === "copy") {
          challengeStep = "distribute";
          phaseIndex = 2;
          resetDragItems();
          feedback = "染色体已经复制。现在把红、蓝染色体各一份拖进左核和右核。";
        } else if (action === "check") {
          if (distributionCorrect()) {
            challengeStep = "cytoplasm";
            phaseIndex = 3;
            feedback = "分配正确：左右两边都获得红、蓝各一份。现在可以完成细胞质分裂。";
          } else {
            feedback = "还不对。每个新细胞核都需要红、蓝各一份，不能一边多、一边少。";
          }
        } else if (action === "finish") {
          if (challengeStep !== "cytoplasm" && !distributionCorrect()) {
            feedback = "先完成平均分配，再进入最终分裂。";
          } else {
            challengeStep = "done";
            phaseIndex = 4;
            feedback = "完成：一个细胞分成两个子细胞，两个子细胞遗传物质基本相同。";
          }
        } else if (action === "reset") {
          challengeStep = "start";
          phaseIndex = 0;
          resetDragItems();
          feedback = "已重置。先复制染色体，再平均分配。";
        }
        if (simFocus) simFocus.textContent = PHASES[phaseIndex].focus;
        renderPanel();
      }

      function answerExam(value) {
        const exam = EXAMS[examIndex];
        examFeedback = value === exam.answer ? exam.ok : exam.bad;
        renderPanel();
      }

      function nextExam() {
        examIndex = (examIndex + 1) % EXAMS.length;
        examFeedback = "";
        renderPanel();
      }

      function renderPanel() {
        if (!externalPanel) return;
        const phase = PHASES[phaseIndex];
        externalPanel.innerHTML = `
          <div class="cell-panel-${sceneId}" data-role="cell-panel">
            <section class="op-card cell-head-card">
              <div class="panel-headline">
                <div>
                  <div class="panel-kicker">有丝分裂模拟沙盒</div>
                  <div class="panel-title">细胞分裂模拟</div>
                </div>
                <div class="mini-pill">${escapeHtml(phase.tag)}</div>
              </div>
              <div class="panel-chips">
                <span class="panel-chip">2n = 4</span>
                <span class="panel-chip">两对同源染色体</span>
              </div>
              <div class="seg">
                <button type="button" data-action="kind" data-value="animal" class="${cellKind === "animal" ? "active" : ""}">动物细胞</button>
                <button type="button" data-action="kind" data-value="plant" class="${cellKind === "plant" ? "active" : ""}">植物细胞</button>
              </div>
            </section>

            <section class="op-card">
              <div class="section-label"><span>阶段选择</span><strong>${escapeHtml(phase.name)}</strong></div>
              <div class="phase-grid">
                ${PHASES.map((item, index) => `
                  <button type="button" class="phase-btn ${index === phaseIndex ? "active" : ""}" data-action="phase" data-value="${index}">${escapeHtml(item.shortName)}</button>
                `).join("")}
              </div>
            </section>

            <section class="op-card">
              <div class="section-label"><span>演示控制</span><strong>${isPlaying ? "演示进行中" : "准备播放"}</strong></div>
              <div class="action-grid">
                <button type="button" data-action="prev" ${phaseIndex === 0 ? "disabled" : ""}>上一步</button>
                <button type="button" data-action="next" ${phaseIndex === PHASES.length - 1 ? "disabled" : ""}>下一步</button>
                <button type="button" data-action="play" class="primary">${isPlaying ? "暂停演示" : "播放演示"}</button>
                <button type="button" data-action="reset-demo">复位</button>
              </div>
              <div class="section-label"><span>演示速度</span><strong>${playSpeed} 倍速</strong></div>
              <div class="speed-grid">
                ${[0.5, 1, 2].map(speed => `<button type="button" data-action="speed" data-value="${speed}" class="${playSpeed === speed ? "active" : ""}">${speed} 倍速</button>`).join("")}
              </div>
            </section>

            <section class="op-card">
              <div class="info-top">
                <div>
                  <div class="panel-kicker">当前阶段</div>
                  <div class="stage-name">${escapeHtml(phase.name)}</div>
                </div>
                <div class="mini-pill">${escapeHtml(cellKind === "animal" ? "动物细胞" : "植物细胞")}</div>
              </div>
              <div class="focus-text">${escapeHtml(phase.focus)}</div>
              <div class="section-label"><span>知识点回顾</span><strong>${escapeHtml(phase.key)}</strong></div>
              <ul class="review-list">
                ${phase.review.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
              </ul>
              <div class="feedback"><strong>观察重点：</strong>${escapeHtml(phase.key)}<br>${escapeHtml(phase.count)}</div>
            </section>
          </div>
        `;

        bindPanelEvents();
        fitPanel();
      }

      function bindPanelEvents() {
        if (!externalPanel) return;
        if (externalPanel.__cellDivisionPanelBound === sceneId) return;
        externalPanel.__cellDivisionPanelBound = sceneId;
        externalPanel.addEventListener("click", (event) => {
          const button = event.target.closest("button[data-action]");
          if (!button || !externalPanel.contains(button) || button.disabled) return;
          const action = button.getAttribute("data-action");
          const value = button.getAttribute("data-value");
            if (action === "kind") {
              cellKind = value;
              feedback = cellKind === "animal" ? "已切换为动物细胞：注意中部向内凹陷。" : "已切换为植物细胞：注意中央形成细胞板。";
              renderPanel();
            }
            if (action === "phase") {
              stopPlay();
              setPhase(Number(value));
            }
            if (action === "prev") {
              stopPlay();
              setPhase(phaseIndex - 1);
            }
            if (action === "next") {
              stopPlay();
              setPhase(phaseIndex + 1);
            }
            if (action === "play") {
              if (isPlaying) stopPlay();
              else startPlay();
            }
            if (action === "speed") {
              playSpeed = Number(value) || 1;
              if (isPlaying) {
                stopPlay();
                startPlay();
              } else {
                renderPanel();
              }
            }
            if (action === "reset-demo") {
              stopPlay();
              phaseIndex = 0;
              challengeStep = "start";
              resetDragItems();
              feedback = "已复位。重新从一个亲代细胞开始观察。";
              if (simFocus) simFocus.textContent = PHASES[phaseIndex].focus;
              renderPanel();
            }
        }, signal ? { signal } : undefined);
      }

      function fitPanel() {
        if (!externalPanel) return;
        const panel = externalPanel.querySelector('[data-role="cell-panel"]');
        if (!panel) return;
        const rect = externalPanel.getBoundingClientRect();
        let size = "normal";
        if (rect.height < 850 || rect.width < 320) size = "compact";
        if (rect.height < 380 || rect.width < 240) size = "micro";
        panel.setAttribute("data-panel-size", size);
      }

      function fmt(value) {
        return Number.isFinite(value) ? value.toFixed(2).replace(/\.?0+$/, "") : "0";
      }

      function svgLabel(x, y, text, tone = "normal") {
        const width = Math.max(82, String(text).length * 15 + 24);
        const fill = tone === "warn" ? "rgba(120, 53, 15, 0.74)" : "rgba(8, 47, 73, 0.76)";
        const stroke = tone === "warn" ? "rgba(251, 191, 36, 0.52)" : "rgba(103, 232, 249, 0.34)";
        const color = tone === "warn" ? "#fde68a" : "#cffafe";
        return `
          <g>
            <rect x="${fmt(x - width / 2)}" y="${fmt(y - 17)}" width="${fmt(width)}" height="34" rx="9" fill="${fill}" stroke="${stroke}"></rect>
            <text x="${fmt(x)}" y="${fmt(y + 5)}" text-anchor="middle" fill="${color}" font-size="15" font-weight="950">${escapeHtml(text)}</text>
          </g>
        `;
      }

      function statCard(x, title, value) {
        return `
          <g>
            <rect x="${fmt(x - 82)}" y="-262" width="164" height="54" rx="10" fill="rgba(2,6,23,0.56)" stroke="rgba(103,232,249,0.22)"></rect>
            <text x="${fmt(x)}" y="-241" text-anchor="middle" fill="#7dd3fc" font-size="12" font-weight="950">${escapeHtml(title)}</text>
            <text x="${fmt(x)}" y="-220" text-anchor="middle" fill="#f8fafc" font-size="13" font-weight="950">${escapeHtml(value)}</text>
          </g>
        `;
      }

      function nucleusSvg(x, y, r, alpha, label) {
        if (alpha <= 0.01) return "";
        return `
          <g opacity="${fmt(alpha)}" class="soft-pulse">
            <ellipse cx="${fmt(x)}" cy="${fmt(y)}" rx="${fmt(r * 1.05)}" ry="${fmt(r * 0.92)}" fill="url(#${sceneId}-nucleus)" stroke="rgba(125,211,252,0.9)" stroke-width="3"></ellipse>
            <ellipse cx="${fmt(x - r * 0.18)}" cy="${fmt(y - r * 0.14)}" rx="${fmt(r * 0.55)}" ry="${fmt(r * 0.36)}" fill="none" stroke="rgba(224,242,254,0.16)" stroke-width="5"></ellipse>
            <path d="M ${fmt(x - r * 0.38)} ${fmt(y + r * 0.08)} C ${fmt(x - r * 0.18)} ${fmt(y - r * 0.06)}, ${fmt(x + r * 0.12)} ${fmt(y + r * 0.2)}, ${fmt(x + r * 0.38)} ${fmt(y - r * 0.02)}" fill="none" stroke="rgba(186,230,253,0.5)" stroke-width="3" stroke-linecap="round"></path>
            ${label ? `<text x="${fmt(x)}" y="${fmt(y - r - 14)}" text-anchor="middle" fill="#e0f2fe" font-size="14" font-weight="950">${escapeHtml(label)}</text>` : ""}
          </g>
        `;
      }

      function chromosomeSvg(x, y, type, duplicated, scale = 1, alpha = 1, label = "", id = "") {
        const spec = CHROMOSOME_TYPES[type];
        const data = id ? ` data-id="${escapeHtml(id)}"` : "";
        const cls = id ? " drag-chromosome" : "";
        const single = `
          <path d="M -6 -26 C 10 -12 -8 8 8 26" fill="none" stroke="${spec.color}" stroke-width="9" stroke-linecap="round"></path>
          <path d="M -6 -26 C 10 -12 -8 8 8 26" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="2.2" stroke-linecap="round"></path>
        `;
        const copied = `
          <path d="M -15 -27 C -1 -11 -9 7 -21 27" fill="none" stroke="${spec.color}" stroke-width="8.5" stroke-linecap="round"></path>
          <path d="M 15 -27 C 1 -11 9 7 21 27" fill="none" stroke="${spec.color}" stroke-width="8.5" stroke-linecap="round"></path>
          <path d="M -15 -27 C -1 -11 -9 7 -21 27 M 15 -27 C 1 -11 9 7 21 27" fill="none" stroke="rgba(255,255,255,0.26)" stroke-width="2" stroke-linecap="round"></path>
          <circle cx="0" cy="0" r="6.5" fill="#fde68a" stroke="rgba(120,53,15,0.82)" stroke-width="2"></circle>
        `;
        return `
          <g${data} class="chromosome${cls}" transform="translate(${fmt(x)} ${fmt(y)}) scale(${fmt(scale)})" opacity="${fmt(alpha)}" filter="url(#${sceneId}-softGlow)">
            ${duplicated ? copied : single}
            ${label ? `<text x="0" y="43" text-anchor="middle" fill="#f8fafc" font-size="12" font-weight="950">${escapeHtml(label)}</text>` : ""}
          </g>
        `;
      }

      function organellesSvg(progress) {
        if (progress > 3.65) return "";
        return ORGANELLES.map((item, index) => {
          const sideShift = progress > 2.4 ? (item.x < 0 ? -22 : 22) * clamp((progress - 2.4) / 1.2, 0, 1) : 0;
          let x = item.x + sideShift;
          let y = item.y;
          const limit = cellKind === "plant" ? { rx: 220, ry: 122 } : { rx: 138, ry: 116 };
          const normalized = Math.hypot(x / limit.rx, y / limit.ry);
          if (normalized > 1) {
            x = (x / normalized) * 0.96;
            y = (y / normalized) * 0.96;
          }
          if (item.type === "mito") {
            return `
              <g transform="translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(item.rot)})" opacity="0.86">
                <rect x="-20" y="-9" width="40" height="18" rx="9" fill="rgba(251,146,60,0.26)" stroke="rgba(254,215,170,0.56)" stroke-width="2"></rect>
                <path d="M -12 5 C -6 -6 0 6 6 -5 C 11 -1 14 2 16 5" fill="none" stroke="rgba(254,215,170,0.66)" stroke-width="2" stroke-linecap="round"></path>
              </g>
            `;
          }
          if (item.type === "vacuole") {
            return `<circle cx="${fmt(x)}" cy="${fmt(y)}" r="${fmt(item.r + 8)}" fill="rgba(125,211,252,0.13)" stroke="rgba(125,211,252,0.38)" stroke-width="2"></circle>`;
          }
          return `<circle cx="${fmt(x)}" cy="${fmt(y)}" r="${fmt(item.r)}" fill="rgba(167,243,208,0.46)"><animate attributeName="opacity" values="0.45;0.88;0.45" dur="${2.2 + index * 0.13}s" repeatCount="indefinite"/></circle>`;
        }).join("");
      }

      function animalCellSvg(progress) {
        const split = clamp((progress - 2.2) / 1.7, 0, 1);
        const result = clamp((progress - 3.55) / 0.45, 0, 1);
        if (result > 0.92) {
          return [-155, 155].map((x) => `
            <g filter="url(#${sceneId}-cellGlow)">
              <ellipse cx="${x}" cy="8" rx="138" ry="154" fill="url(#${sceneId}-cytoplasm)" stroke="rgba(94,234,212,0.86)" stroke-width="4"></ellipse>
              <ellipse cx="${x - 34}" cy="-34" rx="76" ry="58" fill="rgba(255,255,255,0.08)"></ellipse>
            </g>
          `).join("");
        }
        const pinch = ease(split) * 74;
        const stretch = 1 + split * 0.12;
        return `
          <g transform="scale(${fmt(stretch)} ${fmt(1 - split * 0.05)})" filter="url(#${sceneId}-cellGlow)">
            <path d="M 0 -160 C 132 -160 210 -88 210 0 C 210 88 132 160 0 160 C -132 160 -210 88 -210 0 C -210 -88 -132 -160 0 -160 Z" fill="url(#${sceneId}-cytoplasm)" stroke="rgba(94,234,212,0.9)" stroke-width="4"></path>
            <path d="M -140 -88 C -40 -132 90 -108 150 -26" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="12" stroke-linecap="round"></path>
            ${split > 0.04 ? `
              <path d="M 0 -151 C ${fmt(-pinch)} -64 ${fmt(-pinch)} 64 0 151" fill="none" stroke="rgba(251,191,36,0.9)" stroke-width="4" stroke-linecap="round"></path>
              <path d="M 0 -151 C ${fmt(pinch)} -64 ${fmt(pinch)} 64 0 151" fill="none" stroke="rgba(251,191,36,0.9)" stroke-width="4" stroke-linecap="round"></path>
            ` : ""}
          </g>
        `;
      }

      function plantCellSvg(progress) {
        const plate = clamp((progress - 2.6) / 1.25, 0, 1);
        const result = clamp((progress - 3.55) / 0.45, 0, 1);
        const plateHeight = 250 * ease(plate);
        return `
          <g filter="url(#${sceneId}-cellGlow)">
            <rect x="-266" y="-158" width="532" height="316" rx="30" fill="rgba(21,128,61,0.13)" stroke="rgba(134,239,172,0.9)" stroke-width="8"></rect>
            <rect x="-246" y="-138" width="492" height="276" rx="22" fill="url(#${sceneId}-cytoplasm)" stroke="rgba(94,234,212,0.36)" stroke-width="2"></rect>
            ${plate > 0.02 ? `
              <rect x="${fmt(-5 - result * 2)}" y="${fmt(-plateHeight / 2)}" width="${fmt(10 + result * 4)}" height="${fmt(plateHeight)}" rx="5" fill="rgba(251,191,36,0.9)"></rect>
              <path d="M -34 ${fmt(-plateHeight / 2)} H 34 M -34 ${fmt(plateHeight / 2)} H 34" stroke="rgba(254,240,138,0.56)" stroke-width="3" stroke-linecap="round"></path>
            ` : ""}
          </g>
        `;
      }

      function spindlesSvg(progress) {
        const alpha = clamp((progress - 1.55) / 0.75, 0, 1) * clamp((3.65 - progress) / 0.8, 0, 1);
        if (alpha <= 0.01) return "";
        const targets = [
          { x: -35, y: -60 },
          { x: 35, y: -60 },
          { x: -35, y: 60 },
          { x: 35, y: 60 }
        ];
        const lines = targets.map((target) => `
          <path class="spindle-line" d="M -245 0 Q -120 ${fmt(target.y * 0.5)} ${target.x} ${target.y}" fill="none" stroke="rgba(250,204,21,0.58)" stroke-width="2"></path>
          <path class="spindle-line" d="M 245 0 Q 120 ${fmt(target.y * 0.5)} ${target.x} ${target.y}" fill="none" stroke="rgba(250,204,21,0.58)" stroke-width="2"></path>
        `).join("");
        const poles = [-245, 245].map((x) => `
          <g transform="translate(${x} 0)">
            <circle r="8" fill="#fbbf24"></circle>
            ${Array.from({ length: 10 }, (_, i) => {
              const a = (Math.PI * 2 * i) / 10;
              return `<path d="M 0 0 L ${fmt(Math.cos(a) * 32)} ${fmt(Math.sin(a) * 32)}" stroke="rgba(250,204,21,0.5)" stroke-width="2" stroke-linecap="round"></path>`;
            }).join("")}
          </g>
        `).join("");
        return `<g opacity="${fmt(alpha)}">${lines}${poles}</g>`;
      }

      function autoChromosomesSvg(progress) {
        if (mode === "challenge" && challengeStep === "distribute") return "";
        const copyAlpha = clamp((progress - 0.65) / 0.55, 0, 1);
        const duplicated = progress >= 0.8;
        const move = clamp((progress - 2.0) / 1.15, 0, 1);
        const fade = clamp((3.85 - progress) / 0.5, 0, 1);
        if (progress < 0.7) {
          return chromosomeSvg(-34, -8, "red", false, 1.05, 1) + chromosomeSvg(36, 18, "blue", false, 1.05, 1);
        }
        return [
          { type: "red", x: lerp(-42, -168, ease(move)), y: lerp(-32, -24, move), alpha: 1 },
          { type: "blue", x: lerp(42, -168, ease(move)), y: lerp(35, 38, move), alpha: 1 },
          { type: "red", x: lerp(42, 168, ease(move)), y: lerp(-32, -24, move), alpha: copyAlpha },
          { type: "blue", x: lerp(-42, 168, ease(move)), y: lerp(35, 38, move), alpha: copyAlpha }
        ].map((item) => chromosomeSvg(item.x, item.y, item.type, duplicated, 0.92, item.alpha * fade)).join("");
      }

      function challengeZonesSvg() {
        if (mode !== "challenge" || challengeStep === "start") return "";
        const correct = distributionCorrect();
        return ["left", "right"].map((zone) => {
          const x = zone === "left" ? -170 : 170;
          return `
            <g>
              <circle cx="${x}" cy="42" r="94" fill="${correct ? "rgba(16,185,129,0.14)" : "rgba(14,165,233,0.09)"}" stroke="${correct ? "rgba(52,211,153,0.78)" : "rgba(125,211,252,0.55)"}" stroke-width="2.5" stroke-dasharray="9 8"></circle>
              <text x="${x}" y="-74" text-anchor="middle" fill="#e0f2fe" font-size="14" font-weight="950">${zone === "left" ? "左侧新细胞核" : "右侧新细胞核"}</text>
            </g>
          `;
        }).join("");
      }

      function dragItemsSvg() {
        if (mode !== "challenge" || challengeStep === "start") return "";
        return dragItems.map((item) => chromosomeSvg(item.x, item.y, item.type, true, dragItem && dragItem.id === item.id ? 1.08 : 0.96, 1, "", item.id)).join("");
      }

      function nucleiSvg(progress) {
        const singleAlpha = clamp(1 - (progress - 0.9) / 0.75, 0, 1);
        const pairAlpha = clamp((progress - 2.05) / 0.8, 0, 1);
        const finalAlpha = clamp((progress - 3.25) / 0.45, 0, 1);
        return `
          ${nucleusSvg(0, 0, 86, singleAlpha, "细胞核")}
          ${nucleusSvg(-170, 42, lerp(60, 76, finalAlpha), pairAlpha, "新细胞核")}
          ${nucleusSvg(170, 42, lerp(60, 76, finalAlpha), pairAlpha, "新细胞核")}
        `;
      }

      function processArrowsSvg(progress) {
        const move = clamp((progress - 1.8) / 1.1, 0, 1);
        if (move <= 0.02) return "";
        return `
          <g opacity="${fmt(move)}">
            <path d="M 0 -118 Q 120 -72 170 20" fill="none" stroke="rgba(251,191,36,0.9)" stroke-width="4" stroke-linecap="round" marker-end="url(#${sceneId}-arrow)"></path>
            <path d="M 0 118 Q -120 72 -170 20" fill="none" stroke="rgba(251,191,36,0.9)" stroke-width="4" stroke-linecap="round" marker-end="url(#${sceneId}-arrow)"></path>
          </g>
        `;
      }

      function renderDivisionSvg(time) {
        if (!svg) return;
        const progress = visualPhase;
        const phase = PHASES[phaseIndex];
        const gridOffset = fmt((time * 14) % 54);
        svg.innerHTML = `
          <defs>
            <radialGradient id="${sceneId}-bg" cx="50%" cy="42%" r="72%">
              <stop offset="0%" stop-color="#155e75"></stop>
              <stop offset="48%" stop-color="#0f2638"></stop>
              <stop offset="100%" stop-color="#020617"></stop>
            </radialGradient>
            <radialGradient id="${sceneId}-cytoplasm" cx="36%" cy="30%" r="72%">
              <stop offset="0%" stop-color="rgba(45,212,191,0.44)"></stop>
              <stop offset="60%" stop-color="rgba(15,118,110,0.22)"></stop>
              <stop offset="100%" stop-color="rgba(8,47,73,0.12)"></stop>
            </radialGradient>
            <radialGradient id="${sceneId}-nucleus" cx="35%" cy="28%" r="70%">
              <stop offset="0%" stop-color="rgba(186,230,253,0.44)"></stop>
              <stop offset="100%" stop-color="rgba(14,116,144,0.12)"></stop>
            </radialGradient>
            <filter id="${sceneId}-cellGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="9" result="blur"></feGaussianBlur>
              <feMerge><feMergeNode in="blur"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>
            </filter>
            <filter id="${sceneId}-softGlow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="4" result="blur"></feGaussianBlur>
              <feMerge><feMergeNode in="blur"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>
            </filter>
            <marker id="${sceneId}-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#fbbf24"></path>
            </marker>
          </defs>
          <rect x="-420" y="-285" width="840" height="570" rx="28" fill="url(#${sceneId}-bg)"></rect>
          <g opacity="0.14" transform="translate(${gridOffset} 0)">
            ${Array.from({ length: 18 }, (_, i) => `<path d="M ${fmt(-490 + i * 54)} -285 L ${fmt(-610 + i * 54)} 285" stroke="#67e8f9" stroke-width="1"></path>`).join("")}
          </g>
          <rect x="-402" y="-267" width="804" height="534" rx="18" fill="none" stroke="rgba(103,232,249,0.16)"></rect>
          ${statCard(-178, "阶段", phase.shortName)}
          ${statCard(0, "规律", phase.key)}
          ${statCard(178, "结果", phase.count)}
          <g>
            ${cellKind === "plant" ? plantCellSvg(progress) : animalCellSvg(progress)}
            ${organellesSvg(progress)}
            ${nucleiSvg(progress)}
            ${spindlesSvg(progress)}
            ${processArrowsSvg(progress)}
            ${challengeZonesSvg()}
            ${autoChromosomesSvg(progress)}
            ${dragItemsSvg()}
          </g>
          ${svgLabel(-160, 232, "红、蓝代表染色体")}
          ${svgLabel(164, 232, cellKind === "animal" ? "动物：细胞膜向内凹陷" : "植物：中央形成细胞板")}
        `;
      }

      function resize() {
        const rect = container.getBoundingClientRect();
        W = Math.max(1, rect.width);
        H = Math.max(1, rect.height);
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(W * dpr);
        canvas.height = Math.floor(H * dpr);
        canvas.style.width = W + "px";
        canvas.style.height = H + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const size = W < 620 || H < 430 ? "compact" : "normal";
        container.setAttribute("data-size", W < 460 || H < 330 ? "micro" : size);
        // Keep the actual cell model full-height in the host simulation frame.
        // On a near-square stage we crop only the peripheral grid horizontally,
        // rather than shrinking the model and leaving large top/bottom gutters.
        const fittedViewWidth = clamp(570 * (W / H), 600, 840);
        svgViewBox = { x: -fittedViewWidth / 2, y: -285, width: fittedViewWidth, height: 570 };
        if (svg) svg.setAttribute("viewBox", `${svgViewBox.x} ${svgViewBox.y} ${svgViewBox.width} ${svgViewBox.height}`);
        fitPanel();
      }

      function logicalPoint(event) {
        const rect = svg.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const viewScale = Math.min(rect.width / svgViewBox.width, rect.height / svgViewBox.height);
        const renderedW = svgViewBox.width * viewScale;
        const renderedH = svgViewBox.height * viewScale;
        const padX = (rect.width - renderedW) / 2;
        const padY = (rect.height - renderedH) / 2;
        return {
          x: svgViewBox.x + (x - padX) / viewScale,
          y: svgViewBox.y + (y - padY) / viewScale
        };
      }

      function getZoneAt(point) {
        const left = { x: -170, y: 42 };
        const right = { x: 170, y: 42 };
        const radius = 94;
        const dl = Math.hypot(point.x - left.x, point.y - left.y);
        const dr = Math.hypot(point.x - right.x, point.y - right.y);
        if (dl < radius) return "left";
        if (dr < radius) return "right";
        return null;
      }

      function snapItem(item) {
        const slots = {
          left: {
            red: [{ x: -194, y: 14 }, { x: -146, y: 14 }],
            blue: [{ x: -194, y: 72 }, { x: -146, y: 72 }]
          },
          right: {
            red: [{ x: 146, y: 14 }, { x: 194, y: 14 }],
            blue: [{ x: 146, y: 72 }, { x: 194, y: 72 }]
          }
        };
        if (!item.zone) {
          item.x = item.homeX;
          item.y = item.homeY;
          return;
        }
        const same = dragItems.filter((other) => other.zone === item.zone && other.type === item.type);
        const idx = Math.max(0, same.findIndex((other) => other.id === item.id));
        const slot = slots[item.zone][item.type][Math.min(idx, 1)];
        item.x = slot.x;
        item.y = slot.y;
      }

      function handlePointerDown(event) {
        if (mode !== "challenge" || challengeStep !== "distribute") return;
        const point = logicalPoint(event);
        for (let i = dragItems.length - 1; i >= 0; i -= 1) {
          const item = dragItems[i];
          if (Math.hypot(point.x - item.x, point.y - item.y) < 28) {
            dragItem = item;
            pointerOffset = { x: point.x - item.x, y: point.y - item.y };
            item.zone = null;
            feedback = "拖动染色体：每个新细胞核都要红、蓝各一份。";
            renderPanel();
            svg.setPointerCapture && svg.setPointerCapture(event.pointerId);
            event.preventDefault();
            return;
          }
        }
      }

      function handlePointerMove(event) {
        if (!dragItem) return;
        const point = logicalPoint(event);
        dragItem.x = clamp(point.x - pointerOffset.x, -260, 260);
        dragItem.y = clamp(point.y - pointerOffset.y, -110, 145);
        event.preventDefault();
      }

      function handlePointerUp(event) {
        if (!dragItem) return;
        const point = logicalPoint(event);
        dragItem.zone = getZoneAt(point);
        snapItem(dragItem);
        const correct = distributionCorrect();
        feedback = correct
          ? "放得很好：左右两边都拿到一套相同染色体。点击“检查分配”。"
          : "继续调整：目标是左、右新细胞核都得到红、蓝各一份。";
        dragItem = null;
        renderPanel();
        event.preventDefault();
      }

      function drawBackground(time) {
        const grad = ctx.createRadialGradient(W * 0.5, H * 0.44, 20, W * 0.5, H * 0.5, Math.max(W, H) * 0.75);
        grad.addColorStop(0, "#155e75");
        grad.addColorStop(0.46, "#0f2638");
        grad.addColorStop(1, "#020617");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        ctx.save();
        ctx.globalAlpha = 0.15;
        ctx.strokeStyle = "#67e8f9";
        ctx.lineWidth = 1;
        const step = 54;
        for (let x = (time * 8) % step; x < W; x += step) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x - H * 0.18, H);
          ctx.stroke();
        }
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = "rgba(103,232,249,0.12)";
        ctx.lineWidth = 1;
        roundedRect(ctx, 18, 18, W - 36, H - 36, 18);
        ctx.stroke();
        ctx.restore();
      }

      function applySceneTransform() {
        const usableW = Math.max(320, W - 54);
        const usableH = Math.max(260, H - 50);
        const scale = Math.min(usableW / 720, usableH / 500);
        view.scale = clamp(scale, 0.48, 1.18);
        view.ox = W / 2;
        view.oy = H / 2 + (H < 420 ? 10 : 18);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.translate(view.ox, view.oy);
        ctx.scale(view.scale, view.scale);
      }

      function drawLabel(x, y, text, tone) {
        ctx.save();
        ctx.font = "900 15px Microsoft YaHei UI, sans-serif";
        const w = ctx.measureText(text).width + 22;
        roundedRect(ctx, x - w / 2, y - 16, w, 32, 8);
        ctx.fillStyle = tone === "warn" ? "rgba(120, 53, 15, 0.58)" : "rgba(8, 47, 73, 0.68)";
        ctx.strokeStyle = tone === "warn" ? "rgba(251, 191, 36, 0.34)" : "rgba(103, 232, 249, 0.24)";
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = tone === "warn" ? "#fde68a" : "#cffafe";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, x, y + 1);
        ctx.restore();
      }

      function drawNucleus(x, y, r, alpha, label) {
        if (alpha <= 0) return;
        ctx.save();
        ctx.globalAlpha = alpha;
        const grad = ctx.createRadialGradient(x - r * 0.25, y - r * 0.25, r * 0.1, x, y, r);
        grad.addColorStop(0, "rgba(125,211,252,0.28)");
        grad.addColorStop(1, "rgba(14,116,144,0.12)");
        ctx.fillStyle = grad;
        ctx.strokeStyle = "rgba(125, 211, 252, 0.8)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha = Math.min(1, alpha + 0.1);
        ctx.fillStyle = "rgba(224, 242, 254, 0.92)";
        ctx.font = "900 13px Microsoft YaHei UI, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (label) ctx.fillText(label, x, y - r - 14);
        ctx.restore();
      }

      function drawAnimalCell(progress) {
        const split = clamp((progress - 2.2) / 1.7, 0, 1);
        const result = clamp((progress - 3.55) / 0.45, 0, 1);
        const r = 158;
        const dist = lerp(0, 300, ease(result));
        ctx.save();
        ctx.shadowColor = "rgba(45, 212, 191, 0.4)";
        ctx.shadowBlur = 28;
        ctx.lineWidth = 4;
        ctx.strokeStyle = "rgba(94, 234, 212, 0.78)";

        if (result > 0.92) {
          [-dist / 2, dist / 2].forEach((x) => {
            const grad = ctx.createRadialGradient(x - 48, -38, 20, x, 0, r);
            grad.addColorStop(0, "rgba(45, 212, 191, 0.24)");
            grad.addColorStop(1, "rgba(15, 118, 110, 0.08)");
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(x, 0, r * 0.86, r * 0.98, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          });
        } else {
          const pinch = ease(split) * 82;
          const stretch = 1 + split * 0.17;
          ctx.save();
          ctx.scale(stretch, 1 - split * 0.08);
          const grad = ctx.createRadialGradient(-55, -60, 20, 0, 0, r);
          grad.addColorStop(0, "rgba(45, 212, 191, 0.25)");
          grad.addColorStop(1, "rgba(15, 118, 110, 0.08)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(0, -r);
          ctx.bezierCurveTo(118, -r, 178, -72, 178, 0);
          ctx.bezierCurveTo(178, 72, 118, r, 0, r);
          ctx.bezierCurveTo(-118, r, -178, 72, -178, 0);
          ctx.bezierCurveTo(-178, -72, -118, -r, 0, -r);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          if (split > 0.04) {
            ctx.shadowBlur = 0;
            ctx.strokeStyle = "rgba(251, 191, 36, 0.75)";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, -r + 6);
            ctx.quadraticCurveTo(-pinch, 0, 0, r - 6);
            ctx.moveTo(0, -r + 6);
            ctx.quadraticCurveTo(pinch, 0, 0, r - 6);
            ctx.stroke();
          }
          ctx.restore();
        }
        ctx.restore();
      }

      function drawPlantCell(progress) {
        const plate = clamp((progress - 2.6) / 1.25, 0, 1);
        const result = clamp((progress - 3.55) / 0.45, 0, 1);
        ctx.save();
        ctx.shadowColor = "rgba(34, 197, 94, 0.36)";
        ctx.shadowBlur = 22;
        const x = -255;
        const y = -150;
        const w = 510;
        const h = 300;
        roundedRect(ctx, x, y, w, h, 28);
        ctx.fillStyle = "rgba(21, 128, 61, 0.1)";
        ctx.strokeStyle = "rgba(134, 239, 172, 0.8)";
        ctx.lineWidth = 8;
        ctx.fill();
        ctx.stroke();
        roundedRect(ctx, x + 13, y + 13, w - 26, h - 26, 22);
        ctx.strokeStyle = "rgba(94, 234, 212, 0.34)";
        ctx.lineWidth = 2;
        ctx.stroke();
        if (plate > 0.02) {
          ctx.shadowBlur = 0;
          ctx.strokeStyle = "rgba(251, 191, 36, 0.86)";
          ctx.lineWidth = lerp(4, 10, result);
          ctx.beginPath();
          ctx.moveTo(0, -h * 0.42 * ease(plate));
          ctx.lineTo(0, h * 0.42 * ease(plate));
          ctx.stroke();
          drawLabel(0, 178, "细胞板逐渐形成新的细胞壁", "warn");
        }
        ctx.restore();
      }

      function drawOrganelles(progress) {
        if (progress > 3.6) return;
        ctx.save();
        ORGANELLES.forEach((item) => {
          const sideShift = progress > 2.4 ? (item.x < 0 ? -22 : 22) * clamp((progress - 2.4) / 1.2, 0, 1) : 0;
          let x = item.x + sideShift;
          let y = item.y;
          const limit = cellKind === "plant"
            ? { rx: 218, ry: 118 }
            : { rx: 132, ry: 112 };
          const normalized = Math.hypot(x / limit.rx, y / limit.ry);
          if (normalized > 1) {
            x = (x / normalized) * 0.96;
            y = (y / normalized) * 0.96;
          }
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate((item.rot * Math.PI) / 180);
          if (item.type === "mito") {
            roundedRect(ctx, -18, -8, 36, 16, 8);
            ctx.fillStyle = "rgba(251, 146, 60, 0.28)";
            ctx.strokeStyle = "rgba(254, 215, 170, 0.5)";
            ctx.lineWidth = 2;
            ctx.fill();
            ctx.stroke();
            ctx.strokeStyle = "rgba(254, 215, 170, 0.55)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-10, 6);
            ctx.quadraticCurveTo(-4, -4, 2, 6);
            ctx.quadraticCurveTo(8, -4, 14, 5);
            ctx.stroke();
          } else if (item.type === "vacuole") {
            ctx.beginPath();
            ctx.arc(0, 0, item.r + 6, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(125, 211, 252, 0.16)";
            ctx.strokeStyle = "rgba(125, 211, 252, 0.35)";
            ctx.lineWidth = 2;
            ctx.fill();
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, item.r, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(167, 243, 208, 0.42)";
            ctx.fill();
          }
          ctx.restore();
        });
        ctx.restore();
      }

      function drawChromosome(x, y, type, duplicated, scale, alpha, label) {
        const spec = CHROMOSOME_TYPES[type];
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.globalAlpha = alpha;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowColor = spec.color;
        ctx.shadowBlur = 10;
        ctx.strokeStyle = spec.color;
        ctx.lineWidth = 8;
        if (duplicated) {
          ctx.beginPath();
          ctx.moveTo(-12, -24);
          ctx.quadraticCurveTo(0, -8, -3, 0);
          ctx.quadraticCurveTo(-8, 12, -18, 24);
          ctx.moveTo(12, -24);
          ctx.quadraticCurveTo(0, -8, 3, 0);
          ctx.quadraticCurveTo(8, 12, 18, 24);
          ctx.stroke();
          ctx.shadowBlur = 0;
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, Math.PI * 2);
          ctx.fillStyle = "#fde68a";
          ctx.strokeStyle = "rgba(120, 53, 15, 0.7)";
          ctx.lineWidth = 2;
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(-5, -25);
          ctx.quadraticCurveTo(8, -12, 0, 0);
          ctx.quadraticCurveTo(-8, 12, 5, 25);
          ctx.stroke();
        }
        if (label) {
          ctx.shadowBlur = 0;
          ctx.fillStyle = "#f8fafc";
          ctx.font = "900 12px Microsoft YaHei UI, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(label, 0, 40);
        }
        ctx.restore();
      }

      function drawSpindles(progress) {
        const alpha = clamp((progress - 1.55) / 0.75, 0, 1) * clamp((3.6 - progress) / 0.8, 0, 1);
        if (alpha <= 0.01) return;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = "rgba(250, 204, 21, 0.58)";
        ctx.lineWidth = 2;
        const leftPole = { x: -245, y: 0 };
        const rightPole = { x: 245, y: 0 };
        const targets = [
          { x: -35, y: -60 },
          { x: 35, y: -60 },
          { x: -35, y: 60 },
          { x: 35, y: 60 }
        ];
        targets.forEach((target) => {
          ctx.beginPath();
          ctx.moveTo(leftPole.x, leftPole.y);
          ctx.quadraticCurveTo(-120, target.y * 0.5, target.x, target.y);
          ctx.moveTo(rightPole.x, rightPole.y);
          ctx.quadraticCurveTo(120, target.y * 0.5, target.x, target.y);
          ctx.stroke();
        });
        [leftPole, rightPole].forEach((pole) => {
          ctx.fillStyle = "rgba(251, 191, 36, 0.88)";
          ctx.beginPath();
          ctx.arc(pole.x, pole.y, 8, 0, Math.PI * 2);
          ctx.fill();
          for (let i = 0; i < 10; i += 1) {
            const a = (Math.PI * 2 * i) / 10;
            ctx.beginPath();
            ctx.moveTo(pole.x, pole.y);
            ctx.lineTo(pole.x + Math.cos(a) * 32, pole.y + Math.sin(a) * 32);
            ctx.stroke();
          }
        });
        ctx.restore();
      }

      function drawAutoChromosomes(progress) {
        if (mode === "challenge" && challengeStep === "distribute") return;
        const copyAlpha = clamp((progress - 0.65) / 0.55, 0, 1);
        const duplicated = progress >= 0.8;
        const move = clamp((progress - 2.0) / 1.15, 0, 1);
        const fade = clamp((3.85 - progress) / 0.5, 0, 1);
        const positions = [
          { type: "red", x: lerp(-42, -168, ease(move)), y: lerp(-32, -24, move), label: "" },
          { type: "blue", x: lerp(42, -168, ease(move)), y: lerp(35, 38, move), label: "" },
          { type: "red", x: lerp(42, 168, ease(move)), y: lerp(-32, -24, move), label: "" },
          { type: "blue", x: lerp(-42, 168, ease(move)), y: lerp(35, 38, move), label: "" }
        ];
        if (progress < 0.7) {
          drawChromosome(-34, -8, "red", false, 1.05, 1, "");
          drawChromosome(36, 18, "blue", false, 1.05, 1, "");
          return;
        }
        positions.forEach((item, index) => {
          const alpha = (index < 2 ? 1 : copyAlpha) * fade;
          drawChromosome(item.x, item.y, item.type, duplicated, 0.92, alpha, "");
        });
      }

      function drawChallengeZones() {
        if (mode !== "challenge" || challengeStep === "start") return;
        const correct = distributionCorrect();
        ctx.save();
        ["left", "right"].forEach((zone) => {
          const x = zone === "left" ? -170 : 170;
          const y = 42;
          ctx.beginPath();
          ctx.arc(x, y, 92, 0, Math.PI * 2);
          ctx.fillStyle = correct ? "rgba(16, 185, 129, 0.14)" : "rgba(14, 165, 233, 0.09)";
          ctx.strokeStyle = correct ? "rgba(52, 211, 153, 0.75)" : "rgba(125, 211, 252, 0.48)";
          ctx.setLineDash([8, 8]);
          ctx.lineWidth = 2;
          ctx.fill();
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = "rgba(224, 242, 254, 0.9)";
          ctx.font = "900 14px Microsoft YaHei UI, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(zone === "left" ? "左侧新细胞核" : "右侧新细胞核", x, y - 110);
        });
        ctx.restore();
      }

      function drawDragItems() {
        if (mode !== "challenge" || challengeStep === "start") return;
        ctx.save();
        dragItems.forEach((item) => {
          const isDragging = dragItem && dragItem.id === item.id;
          drawChromosome(item.x, item.y, item.type, true, isDragging ? 1.08 : 0.96, 1, "");
        });
        ctx.restore();
      }

      function drawNuclei(progress) {
        const singleAlpha = clamp(1 - (progress - 0.9) / 0.75, 0, 1);
        const pairAlpha = clamp((progress - 2.05) / 0.8, 0, 1);
        const finalAlpha = clamp((progress - 3.25) / 0.45, 0, 1);
        if (singleAlpha > 0.02) drawNucleus(0, 0, 86, singleAlpha, "细胞核");
        if (pairAlpha > 0.02) {
          const r = lerp(60, 76, finalAlpha);
          drawNucleus(-170, 42, r, pairAlpha, "新细胞核");
          drawNucleus(170, 42, r, pairAlpha, "新细胞核");
        }
      }

      function drawStats(progress) {
        const phase = PHASES[phaseIndex];
        ctx.save();
        const y = -222;
        const w = 150;
        const cards = [
          { x: -180, title: "阶段", value: phase.shortName },
          { x: 0, title: "规律", value: phase.key },
          { x: 180, title: "结果", value: phase.count }
        ];
        cards.forEach((card) => {
          roundedRect(ctx, card.x - w / 2, y - 24, w, 50, 8);
          ctx.fillStyle = "rgba(2, 6, 23, 0.48)";
          ctx.strokeStyle = "rgba(103, 232, 249, 0.18)";
          ctx.lineWidth = 1;
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "rgba(125, 211, 252, 0.82)";
          ctx.font = "900 11px Microsoft YaHei UI, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(card.title, card.x, y - 6);
          ctx.fillStyle = "#f8fafc";
          ctx.font = "900 12px Microsoft YaHei UI, sans-serif";
          ctx.fillText(card.value, card.x, y + 13);
        });
        ctx.restore();
      }

      function drawProcessArrow(progress) {
        const move = clamp((progress - 1.8) / 1.1, 0, 1);
        if (move <= 0.02) return;
        ctx.save();
        ctx.globalAlpha = move;
        ctx.strokeStyle = "rgba(251, 191, 36, 0.82)";
        ctx.fillStyle = "rgba(251, 191, 36, 0.82)";
        ctx.lineWidth = 4;
        [-1, 1].forEach((side) => {
          ctx.beginPath();
          ctx.moveTo(0, -118 * side);
          ctx.quadraticCurveTo(120 * side, -72 * side, 170 * side, 20);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(170 * side, 20);
          ctx.lineTo(150 * side, 8);
          ctx.lineTo(155 * side, 32);
          ctx.closePath();
          ctx.fill();
        });
        ctx.restore();
      }

      function drawLegend() {
        ctx.save();
        const y = 218;
        drawLabel(-155, y, "红、蓝代表染色体", "normal");
        drawLabel(155, y, cellKind === "animal" ? "动物：向内凹陷" : "植物：形成细胞板", "normal");
        ctx.restore();
      }

      function drawScene(time) {
        drawBackground(time);
        applySceneTransform();
        const progress = visualPhase;
        drawStats(progress);
        if (cellKind === "plant") drawPlantCell(progress);
        else drawAnimalCell(progress);
        drawOrganelles(progress);
        drawNuclei(progress);
        drawSpindles(progress);
        drawProcessArrow(progress);
        drawChallengeZones();
        drawAutoChromosomes(progress);
        drawDragItems();
        drawLegend();
      }

      function tick(now) {
        if (destroyed) return;
        const dt = Math.min(0.05, (now - lastTime) / 1000);
        lastTime = now;
        const target = mode === "challenge" ? phaseIndex : phaseIndex;
        visualPhase += (target - visualPhase) * clamp(dt * 7.5, 0, 1);
        renderDivisionSvg(now / 1000);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        rafId = window.requestAnimationFrame(tick);
      }

      function destroy() {
        if (destroyed) return;
        destroyed = true;
        stopPlay();
        if (rafId) window.cancelAnimationFrame(rafId);
        if (abortCtrl) abortCtrl.abort();
        cleanupFns.forEach((fn) => fn());
        style.remove();
      }

      window.addEventListener("resize", resize, signal ? { signal } : undefined);
      cleanupFns.push(() => window.removeEventListener("resize", resize));

      svg.addEventListener("pointerdown", handlePointerDown, signal ? { signal } : undefined);
      svg.addEventListener("pointermove", handlePointerMove, signal ? { signal } : undefined);
      svg.addEventListener("pointerup", handlePointerUp, signal ? { signal } : undefined);
      svg.addEventListener("pointercancel", handlePointerUp, signal ? { signal } : undefined);

      if (typeof ResizeObserver !== "undefined") {
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(container);
        if (externalPanel) resizeObserver.observe(externalPanel);
        cleanupFns.push(() => resizeObserver.disconnect());
      }

      const mutationObserver = new MutationObserver(() => {
        if (!document.body.contains(container)) {
          mutationObserver.disconnect();
          destroy();
        }
      });
      mutationObserver.observe(document.body, { childList: true, subtree: true });
      cleanupFns.push(() => mutationObserver.disconnect());

      resize();
      renderPanel();
      rafId = window.requestAnimationFrame(tick);
    }
  };
})();
