window.BIO_VISUAL_SCENES = window.BIO_VISUAL_SCENES || {};

window.BIO_VISUAL_SCENES["s_x3_m06"] = (function () {
  const MAX_STEP = 4;
  const BASE_W = 24;
  const SITE = ["G", "A", "A", "T", "T", "C"];
  const VECTOR_LEFT = ["A", "C", "T", "C", "G"];
  const VECTOR_RIGHT = ["A", "T", "T", "C", "G", "A", "T"];
  const GENE_SEQ = ["T", "A", "C", "G", "A", "C", "G", "T", "C", "G"];
  const WASTE_LEFT = ["G", "T", "C", "A"];
  const WASTE_RIGHT = ["C", "A", "G", "C"];

  const STEPS = [
    {
      short: "识别",
      tag: "准备材料",
      title: "同一种限制酶识别同一序列",
      temp: "EcoRI: GAATTC",
      note: "载体 DNA 和目的基因片段都带有 EcoRI 识别序列。用同一种酶处理，才会产生可配对的末端。",
      stat: ["2 个识别位点", "0 个重组质粒", "未转化"]
    },
    {
      short: "酶切",
      tag: "形成黏性末端",
      title: "限制酶错位切割，暴露 AATT 黏性末端",
      temp: "5'-AATT",
      note: "EcoRI 在 G/AATTC 处错位切开磷酸二酯键，载体和目的基因两端暴露相同黏性末端。",
      stat: ["4 个黏性末端", "0 个重组质粒", "片段可配对"]
    },
    {
      short: "连接",
      tag: "构建表达载体",
      title: "目的基因插入载体，连接酶封闭骨架",
      temp: "DNA ligase",
      note: "黏性末端先按碱基互补配对，DNA 连接酶再把缺口处的磷酸二酯键连接起来。",
      stat: ["末端已配对", "1 个重组质粒", "抗性标记保留"]
    },
    {
      short: "导入",
      tag: "转化受体细胞",
      title: "重组质粒进入感受态大肠杆菌",
      temp: "Ca2+ / 热激",
      note: "处理后的受体细胞膜通透性提高，重组质粒进入细胞，为表达和筛选做准备。",
      stat: ["质粒入胞", "1 个转化细胞", "等待筛选"]
    },
    {
      short: "筛选",
      tag: "检测与鉴定",
      title: "抗性培养基筛出重组细胞",
      temp: "抗生素选择",
      note: "带抗性标记的细胞存活并形成菌落；未导入质粒的细胞在抗生素环境下死亡。",
      stat: ["3 个阳性菌落", "2 个阴性细胞死亡", "可继续鉴定"]
    }
  ];

  const COURSE_STEPS = [
    {
      short: "准备",
      tag: "准备材料",
      phase: "微观",
      title: "1. 目的基因的获取与运载体准备",
      temp: "EcoRI: GAATTC",
      note: "上方蓝色为质粒 DNA，下方红色为外源目的基因。两者都含有 EcoRI 的识别位点 GAATTC。",
      stat: ["2 个识别位点", "0 个重组质粒", "准备同酶切割"]
    },
    {
      short: "酶切",
      tag: "形成黏性末端",
      phase: "微观",
      title: "2. 限制酶切割，形成黏性末端",
      temp: "5'-AATT",
      note: "加入同一种限制酶 EcoRI。它错位切断磷酸二酯键，暴露出相同的 5'-AATT 黏性末端，外源无用片段脱落。",
      stat: ["4 个黏性末端", "0 个重组质粒", "片段可配对"]
    },
    {
      short: "连接",
      tag: "构建表达载体",
      phase: "微观",
      title: "3. 基因表达载体的构建",
      temp: "DNA ligase",
      note: "目的基因上移嵌入载体缺口，黏性末端先互补配对；DNA 连接酶再封闭 DNA 骨架上的磷酸二酯键。",
      stat: ["末端已配对", "1 个重组质粒", "抗性标记保留"]
    },
    {
      short: "导入",
      tag: "转化受体细胞",
      phase: "宏观",
      title: "4. 将目的基因导入受体细胞",
      temp: "Ca2+ / 热激",
      note: "镜头拉远：刚才拼接好的线段变成环状重组质粒。感受态大肠杆菌经热激处理后摄入质粒。",
      stat: ["质粒进入细胞", "1 个转化细胞", "等待筛选"]
    },
    {
      short: "筛选",
      tag: "检测与鉴定",
      phase: "宏观",
      title: "5. 目的基因的检测与鉴定",
      temp: "抗生素选择",
      note: "将细菌涂布在含抗生素的培养基上。无质粒细胞死亡，带抗性标记的重组细胞存活并增殖形成菌落。",
      stat: ["阳性菌落扩增", "无抗性细胞死亡", "可继续鉴定"]
    }
  ];

  const REF_BASE_W = 32;
  const REF_P_LEFT = {
    top: [{ c: "A", i: 0 }, { c: "C", i: 1 }, { c: "T", i: 2 }, { c: "C", i: 3 }, { c: "G", i: 4 }],
    bot: [{ c: "T", i: 0 }, { c: "G", i: 1 }, { c: "A", i: 2 }, { c: "G", i: 3 }, { c: "C", i: 4 }, { c: "T", i: 5 }, { c: "T", i: 6 }, { c: "A", i: 7 }, { c: "A", i: 8 }]
  };
  const REF_P_RIGHT = {
    top: [{ c: "A", i: 0 }, { c: "A", i: 1 }, { c: "T", i: 2 }, { c: "T", i: 3 }, { c: "C", i: 4 }, { c: "G", i: 5 }, { c: "A", i: 6 }, { c: "T", i: 7 }],
    bot: [{ c: "G", i: 4 }, { c: "C", i: 5 }, { c: "T", i: 6 }, { c: "A", i: 7 }]
  };
  const REF_E_LEFT = {
    top: [{ c: "G", i: 0 }, { c: "T", i: 1 }, { c: "C", i: 2 }, { c: "A", i: 3 }, { c: "G", i: 4 }],
    bot: [{ c: "C", i: 0 }, { c: "A", i: 1 }, { c: "G", i: 2 }, { c: "T", i: 3 }, { c: "C", i: 4 }, { c: "T", i: 5 }, { c: "T", i: 6 }, { c: "A", i: 7 }, { c: "A", i: 8 }]
  };
  const REF_E_GENE = {
    top: [
      { c: "A", i: 0 }, { c: "A", i: 1 }, { c: "T", i: 2 }, { c: "T", i: 3 }, { c: "C", i: 4 },
      { c: "T", i: 5 }, { c: "A", i: 6 }, { c: "C", i: 7 }, { c: "G", i: 8 }, { c: "A", i: 9 }, { c: "C", i: 10 }, { c: "G", i: 11 }
    ],
    bot: [
      { c: "G", i: 4 }, { c: "A", i: 5 }, { c: "T", i: 6 }, { c: "G", i: 7 }, { c: "C", i: 8 }, { c: "T", i: 9 }, { c: "G", i: 10 }, { c: "C", i: 11 },
      { c: "T", i: 12 }, { c: "T", i: 13 }, { c: "A", i: 14 }, { c: "A", i: 15 }
    ]
  };
  const REF_E_RIGHT = {
    top: [{ c: "A", i: 0 }, { c: "A", i: 1 }, { c: "T", i: 2 }, { c: "T", i: 3 }, { c: "C", i: 4 }, { c: "A", i: 5 }, { c: "G", i: 6 }, { c: "C", i: 7 }],
    bot: [{ c: "G", i: 4 }, { c: "T", i: 5 }, { c: "C", i: 6 }, { c: "G", i: 7 }]
  };

  const REF_THEME_PLASMID = { top: "#3b82f6", bottom: "#2563eb", base: "#eff6ff", text: "#1e3a8a", label: "#93c5fd" };
  const REF_THEME_GENE = { top: "#ef4444", bottom: "#dc2626", base: "#fef2f2", text: "#7f1d1d", label: "#fecaca" };
  const REF_THEME_FLANK = { top: "#64748b", bottom: "#475569", base: "#f1f5f9", text: "#334155", label: "#cbd5e1" };

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function css() {
    return `
      .ge-stage,
      .ge-stage *,
      .ge-panel,
      .ge-panel * {
        box-sizing: border-box;
      }
      .ge-stage,
      .ge-shell,
      .ge-panel {
        width: 100%;
        height: 100%;
        min-width: 0;
        min-height: 0;
        color: #f8fafc;
        font-family: "Microsoft YaHei", "PingFang SC", Inter, system-ui, sans-serif;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
        user-select: none;
      }
      .ge-shell {
        display: grid;
        grid-template-columns: minmax(0, 1fr) var(--bio-scene-panel-width, 320px);
        gap: var(--bio-scene-panel-gap, 24px);
      }
      .ge-stage {
        position: relative;
        overflow: hidden;
        border-radius: clamp(24px, 4vw, 48px);
        border: 1px solid rgba(255,255,255,.08);
        background:
          radial-gradient(circle at 16% 10%, rgba(16,185,129,.14), transparent 28%),
          radial-gradient(circle at 78% 70%, rgba(59,130,246,.11), transparent 34%),
          linear-gradient(140deg, #071b22 0%, #040b11 54%, #020507 100%);
        padding: clamp(14px, 2.2vw, 26px);
        display: grid;
        grid-template-rows: auto minmax(0, 1fr) auto;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 30px 90px rgba(0,0,0,.42);
      }
      .ge-header {
        position: relative;
        z-index: 3;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
      }
      .ge-kicker,
      .ge-panelKicker,
      .ge-sectionTitle span {
        display: block;
        color: #34d399;
        font-size: 12px;
        line-height: 1;
        font-weight: 950;
        letter-spacing: .12em;
      }
      .ge-title {
        margin-top: 7px;
        color: #fff;
        font-size: clamp(22px, 3.5vw, 32px);
        line-height: 1.03;
        font-weight: 950;
        letter-spacing: 0;
      }
      .ge-badge {
        min-width: 88px;
        height: 64px;
        border-radius: 18px;
        border: 1px solid rgba(52,211,153,.38);
        background: rgba(16,185,129,.11);
        display: grid;
        place-items: center;
        text-align: center;
        padding: 0 10px;
      }
      .ge-badge b {
        color: #fff;
        font-size: 24px;
        line-height: .9;
        font-weight: 950;
      }
      .ge-badge span {
        color: rgba(226,232,240,.70);
        font-size: 10px;
        letter-spacing: 0;
        white-space: nowrap;
      }
      .ge-canvas {
        position: relative;
        min-height: 0;
        margin-top: 16px;
        overflow: hidden;
        border-radius: clamp(18px, 3vw, 34px);
        background:
          linear-gradient(rgba(148,163,184,.09) 1px, transparent 1px),
          linear-gradient(90deg, rgba(148,163,184,.09) 1px, transparent 1px),
          rgba(2,8,12,.34);
        background-size: 58px 58px;
      }
      .ge-canvas::before {
        content: "";
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at 50% 48%, transparent 0 45%, rgba(0,0,0,.36) 82%);
        pointer-events: none;
        z-index: 1;
      }
      .ge-svg {
        position: relative;
        z-index: 2;
        width: 100%;
        height: 100%;
        display: block;
      }
      .ge-layer {
        position: absolute;
        inset: 0;
        z-index: 2;
        pointer-events: none;
        transform-origin: 50% 50%;
        transition: opacity 1.5s cubic-bezier(.4,0,.2,1), transform 1.5s cubic-bezier(.4,0,.2,1), filter 1.5s cubic-bezier(.4,0,.2,1);
        will-change: opacity, transform, filter;
      }
      .ge-microLayer {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
      .ge-macroLayer {
        opacity: 0;
        transform: scale(3);
      }
      .ref-dna-block,
      .ref-ecori,
      .ref-hbond,
      .ref-ligase,
      .ref-bonds,
      .ref-transformGroup,
      .ref-plateGroup,
      .ref-colonyBloom,
      .ref-deadCell {
        transition: opacity 1.5s cubic-bezier(.4,0,.2,1), filter 1.5s cubic-bezier(.4,0,.2,1);
      }
      .ref-dna-block .ref-backbone-top {
        fill: var(--dna-top);
        stroke: #0f172a;
        stroke-width: 2;
      }
      .ref-dna-block .ref-backbone-bottom {
        fill: var(--dna-bottom);
        stroke: #0f172a;
        stroke-width: 2;
      }
      .ref-dna-block .dna-base path {
        fill: var(--dna-base);
        stroke: #0f172a;
        stroke-width: 1.5;
        stroke-linejoin: round;
      }
      .ref-dna-block .dna-base text {
        fill: var(--dna-text);
        font-family: "JetBrains Mono", Consolas, "Courier New", monospace;
        font-size: 16px;
        font-weight: 900;
        transition: opacity .35s ease;
      }
      .ref-dna-block [data-ge-label],
      .ge-end-label,
      .ref-sceneLabel {
        transition: opacity .35s ease;
      }
      .ge-stage.is-hide-bases .ref-dna-block .dna-base text {
        opacity: 0;
      }
      .ge-stage.is-hide-labels [data-ge-label],
      .ge-stage.is-hide-labels .ge-end-label,
      .ge-stage.is-hide-labels .ref-sceneLabel {
        opacity: 0;
      }
      .ref-phasePill {
        display: inline-grid;
        place-items: center;
        height: 22px;
        min-width: 72px;
        padding: 0 10px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,.10);
        background: rgba(15,23,42,.70);
        color: rgba(226,232,240,.82);
        font-size: 10px;
        font-weight: 950;
        letter-spacing: .06em;
        margin-top: 7px;
      }
      .ge-status {
        min-height: 56px;
        margin-top: 14px;
        border-radius: 18px;
        border: 1px solid rgba(255,255,255,.08);
        background: rgba(2,6,23,.70);
        padding: 10px 14px;
        display: grid;
        gap: 3px;
      }
      .ge-status strong {
        color: var(--tone);
        font-size: 14px;
        line-height: 1.1;
        font-weight: 950;
      }
      .ge-status span {
        color: rgba(226,232,240,.82);
        font-size: 12px;
        line-height: 1.32;
        font-weight: 750;
      }
      .ge-panel {
        --op-pad: clamp(8px, 1.25vh, 12px);
        --op-gap: clamp(5px, .9vh, 8px);
        --section-pad: clamp(6px, .95vh, 8px);
        --section-gap: clamp(4px, .72vh, 6px);
        max-height: 100%;
        overflow-x: hidden;
        overflow-y: auto;
        overscroll-behavior: contain;
        touch-action: pan-y;
        scrollbar-width: none;
        border-radius: var(--bio-scene-panel-radius, 28px);
        border: 1px solid rgba(255,255,255,.09);
        background:
          linear-gradient(180deg, rgba(18,18,18,.98), rgba(8,10,10,.98)),
          radial-gradient(circle at 30% 0%, rgba(16,185,129,.12), transparent 36%);
        padding: var(--op-pad);
        display: flex;
        flex-direction: column;
        gap: var(--op-gap);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.045);
      }
      .ge-panel::-webkit-scrollbar {
        width: 0;
        height: 0;
      }
      .ge-panelTop {
        padding: 0 2px;
        flex: 0 0 auto;
      }
      .ge-panelTop h3 {
        margin: 4px 0 0;
        color: #fff;
        font-size: clamp(18px, 2.55vh, 22px);
        line-height: 1.08;
        font-weight: 950;
      }
      .ge-panelTop p {
        display: none;
      }
      .ge-section {
        flex: 0 0 auto;
        min-height: 0;
        border: 1px solid rgba(255,255,255,.08);
        background: rgba(255,255,255,.035);
        border-radius: 14px;
        padding: var(--section-pad);
        display: grid;
        gap: var(--section-gap);
      }
      .ge-sectionTitle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .ge-sectionTitle span {
        color: rgba(148,163,184,.82);
        font-size: 10px;
        letter-spacing: .12em;
      }
      .ge-sectionTitle strong {
        max-width: 180px;
        color: rgba(255,255,255,.90);
        font-size: 10px;
        line-height: 1.2;
        font-weight: 900;
        text-align: right;
      }
      .ge-stepGrid {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 5px;
      }
      .ge-stepButton,
      .ge-actionGrid button,
      .ge-toggle {
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }
      .ge-stepButton {
        min-height: var(--bio-touch-target, 44px);
        border: 1px solid rgba(255,255,255,.09);
        border-radius: 11px;
        background: rgba(255,255,255,.05);
        color: rgba(226,232,240,.68);
        padding: 4px 2px;
        display: grid;
        gap: 1px;
        place-items: center;
        font-weight: 950;
        cursor: pointer;
      }
      .ge-stepButton b {
        font-size: 12px;
        line-height: 1;
      }
      .ge-stepButton span {
        font-size: 9px;
        line-height: 1;
      }
      .ge-stepButton.is-active {
        border-color: rgba(52,211,153,.62);
        background: rgba(16,185,129,.16);
        color: #fff;
        box-shadow: 0 0 16px rgba(16,185,129,.13);
      }
      .ge-statGrid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 5px;
      }
      .ge-statGrid div {
        min-height: clamp(36px, 5.7vh, 44px);
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,.08);
        background: rgba(0,0,0,.20);
        padding: 6px;
      }
      .ge-statGrid span {
        display: block;
        color: rgba(226,232,240,.58);
        font-size: 9px;
        line-height: 1;
        font-weight: 850;
      }
      .ge-statGrid b {
        display: block;
        margin-top: 4px;
        color: #fff;
        font-size: 13px;
        line-height: 1.05;
        font-weight: 950;
      }
      .ge-actionGrid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 6px;
      }
      .ge-actionGrid button {
        min-height: var(--bio-touch-target, 44px);
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,.09);
        background: rgba(255,255,255,.05);
        color: #f8fafc;
        font-size: 12px;
        font-weight: 950;
        cursor: pointer;
        appearance: none;
      }
      .ge-actionGrid button:hover:not(:disabled) {
        border-color: rgba(52,211,153,.38);
        background: rgba(16,185,129,.13);
      }
      .ge-actionGrid button:active:not(:disabled),
      .ge-stepButton:active:not(:disabled) {
        transform: scale(.985);
        border-color: rgba(52,211,153,.54);
        background: rgba(16,185,129,.18);
      }
      .ge-actionGrid button:disabled {
        opacity: .42;
        cursor: not-allowed;
      }
      .ge-toggle {
        min-height: var(--bio-touch-target, 44px);
        display: flex;
        align-items: center;
        gap: 8px;
        color: rgba(226,232,240,.76);
        font-size: 11px;
        line-height: 1.2;
        font-weight: 800;
        border-radius: 12px;
        cursor: pointer;
      }
      .ge-toggle input {
        width: 22px;
        height: 22px;
        flex: 0 0 auto;
        accent-color: #10b981;
      }
      .ge-clue p {
        margin: 0;
        color: rgba(226,232,240,.78);
        font-size: 10px;
        line-height: 1.25;
        font-weight: 750;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .dna-base path {
        fill: #f8fafc;
        stroke: #111827;
        stroke-width: 1.3;
        stroke-linejoin: round;
      }
      .dna-base text {
        fill: #111827;
        font-size: 11px;
        font-weight: 950;
      }
      .dna-base.is-site path {
        fill: #fdba74;
      }
      .dna-base.is-gene path {
        fill: #fecaca;
      }
      .dna-base.is-sticky path {
        fill: #fde68a;
      }
      .dna-backbone {
        fill: #1f2937;
        stroke: rgba(226,232,240,.72);
        stroke-width: 1.5;
      }
      .dna-vector {
        fill: #2563eb;
      }
      .dna-gene {
        fill: #dc2626;
      }
      .dna-waste {
        fill: #64748b;
      }
      .dna-end {
        fill: rgba(226,232,240,.76);
        font-size: 13px;
        font-weight: 950;
      }
      .ge-enzyme rect {
        fill: rgba(16,185,129,.20);
        stroke: #34d399;
        stroke-width: 2;
        stroke-dasharray: 5 4;
      }
      .ge-enzyme text {
        fill: #bbf7d0;
        font-size: 12px;
        font-weight: 950;
      }
      .ge-cutLine {
        stroke: #f59e0b;
        stroke-width: 3;
        stroke-linecap: round;
        stroke-dasharray: 7 5;
        animation: cutPulse 900ms ease-in-out infinite alternate;
      }
      .ge-ligase circle {
        fill: #facc15;
        filter: drop-shadow(0 0 12px rgba(250,204,21,.82));
        animation: ligasePulse 900ms ease-in-out infinite alternate;
      }
      .ge-ligase text {
        fill: #fef3c7;
        font-size: 11px;
        font-weight: 950;
      }
      .ge-bond {
        stroke: #22c55e;
        stroke-width: 4;
        stroke-linecap: round;
        filter: drop-shadow(0 0 8px rgba(34,197,94,.55));
      }
      .ge-plasmidRing {
        fill: none;
        stroke: #3b82f6;
        stroke-width: 16;
        filter: drop-shadow(0 0 14px rgba(59,130,246,.22));
      }
      .ge-plasmidGene {
        fill: none;
        stroke: #ef4444;
        stroke-width: 17;
        stroke-linecap: round;
      }
      .ge-plasmidMark {
        fill: none;
        stroke: #eab308;
        stroke-width: 17;
        stroke-linecap: round;
      }
      .ge-bacterium {
        fill: rgba(15,23,42,.92);
        stroke: #38bdf8;
        stroke-width: 4;
        filter: drop-shadow(0 0 22px rgba(56,189,248,.16));
      }
      .ge-cellDna {
        fill: none;
        stroke: #a78bfa;
        stroke-width: 6;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .ge-plate {
        fill: rgba(30,41,59,.95);
        stroke: #fcd34d;
        stroke-width: 8;
      }
      .ge-colony {
        fill: #38bdf8;
        filter: drop-shadow(0 0 10px rgba(56,189,248,.45));
      }
      .ge-dead {
        fill: #64748b;
        opacity: .32;
      }
      .pulse-slow {
        animation: pulseSlow 2s cubic-bezier(.4,0,.6,1) infinite;
      }
      @keyframes ligasePulse {
        from { transform: scale(.96); opacity: .76; }
        to { transform: scale(1.08); opacity: 1; }
      }
      @keyframes pulseSlow {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: .62; transform: scale(1.05); }
      }
      @keyframes cutPulse {
        from { opacity: .5; }
        to { opacity: 1; }
      }
      @media (hover: none) {
        .ge-actionGrid button:hover:not(:disabled) {
          border-color: rgba(255,255,255,.09);
          background: rgba(255,255,255,.05);
        }
      }
      @media (max-height: 620px) {
        .ge-stage {
          padding: 14px;
          border-radius: 26px;
        }
        .ge-header {
          gap: 10px;
        }
        .ge-kicker {
          font-size: 10px;
        }
        .ge-title {
          margin-top: 4px;
          font-size: 20px;
        }
        .ge-badge {
          min-width: 62px;
          height: 46px;
          border-radius: 14px;
        }
        .ge-badge b {
          font-size: 18px;
        }
        .ge-badge span {
          font-size: 8px;
        }
        .ge-canvas {
          margin-top: 8px;
          border-radius: 20px;
        }
        .ge-status {
          min-height: 40px;
          margin-top: 8px;
          padding: 7px 10px;
          border-radius: 14px;
          gap: 2px;
        }
        .ge-status strong {
          font-size: 12px;
        }
        .ge-status span {
          font-size: 10px;
          line-height: 1.18;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .ge-panel {
          gap: 5px;
          padding: 8px;
          border-radius: 20px;
        }
        .ge-panelTop {
          padding: 0;
        }
        .ge-panelKicker {
          font-size: 10px;
        }
        .ge-panelTop h3 {
          margin-top: 3px;
          font-size: 17px;
        }
        .ge-section {
          padding: 6px;
          gap: 5px;
          border-radius: 13px;
        }
        .ge-sectionTitle span {
          font-size: 9px;
        }
        .ge-sectionTitle strong {
          max-width: 154px;
          font-size: 9px;
          line-height: 1.1;
        }
        .ge-stepButton,
        .ge-actionGrid button {
          min-height: 40px;
          border-radius: 10px;
          font-size: 11px;
        }
        .ge-statGrid div {
          min-height: 34px;
          padding: 5px 6px;
          border-radius: 11px;
        }
        .ge-statGrid span {
          font-size: 8px;
        }
        .ge-statGrid b {
          font-size: 12px;
        }
        .ge-toggle {
          min-height: 40px;
          font-size: 10px;
        }
        .ge-clue p {
          font-size: 9px;
          line-height: 1.15;
          -webkit-line-clamp: 1;
        }
      }
      @media (max-height: 460px) {
        .ge-stage {
          min-height: 0;
          height: 100%;
          padding: 12px;
          border-radius: 24px;
        }
        .ge-kicker {
          font-size: 9px;
        }
        .ge-title {
          margin-top: 3px;
          font-size: 18px;
        }
        .ge-badge {
          min-width: 50px;
          height: 42px;
          border-radius: 13px;
        }
        .ge-badge b {
          font-size: 17px;
        }
        .ge-canvas {
          margin-top: 7px;
          border-radius: 18px;
        }
        .ge-status {
          min-height: 36px;
          margin-top: 7px;
          padding: 6px 9px;
          border-radius: 12px;
        }
        .ge-status strong {
          font-size: 11px;
        }
        .ge-status span {
          font-size: 9px;
          line-height: 1.12;
        }
        .ge-panel {
          gap: 4px;
          padding: 6px;
          border-radius: 18px;
        }
        .ge-panelTop {
          display: none;
        }
        .ge-section {
          padding: 5px;
          gap: 4px;
          border-radius: 11px;
        }
        .ge-sectionTitle span {
          font-size: 9px;
          letter-spacing: .08em;
        }
        .ge-sectionTitle strong {
          max-width: 140px;
          font-size: 9px;
          line-height: 1.08;
        }
        .ge-stepGrid,
        .ge-actionGrid,
        .ge-statGrid {
          gap: 4px;
        }
        .ge-stepButton,
        .ge-actionGrid button {
          min-height: 40px;
          padding: 3px;
          border-radius: 9px;
          font-size: 10px;
        }
        .ge-stepButton b {
          font-size: 10px;
        }
        .ge-stepButton span {
          display: none;
        }
        .ge-statGrid div {
          min-height: 29px;
          padding: 4px 5px;
          border-radius: 9px;
        }
        .ge-statGrid b {
          margin-top: 2px;
          font-size: 11px;
        }
        .ge-detailSection,
        .ge-clue {
          display: none;
        }
      }
      @media (max-width: 1080px) {
        .ge-shell {
          grid-template-columns: 1fr;
        }
      }
    `;
  }

  function baseTop(x, y, letter, cls = "") {
    return `
      <g class="dna-base ${cls}" transform="translate(${x} ${y})">
        <path d="M0 0 L${BASE_W} 0 L${BASE_W} 30 L${BASE_W / 2} 39 L0 30 Z" />
        <text x="${BASE_W / 2}" y="21" text-anchor="middle">${escapeHtml(letter)}</text>
      </g>
    `;
  }

  function baseBottom(x, y, letter, cls = "") {
    return `
      <g class="dna-base ${cls}" transform="translate(${x} ${y + 30})">
        <path d="M0 0 L${BASE_W / 2} 9 L${BASE_W} 0 L${BASE_W} 39 L0 39 Z" />
        <text x="${BASE_W / 2}" y="29" text-anchor="middle">${escapeHtml(letter)}</text>
      </g>
    `;
  }

  function comp(base) {
    return { A: "T", T: "A", C: "G", G: "C" }[base] || "N";
  }

  function renderLinearBlock({ x, y, seq, kind, showBases, isSite = false, isSticky = false, label = "" }) {
    const top = seq;
    const bottom = seq.map(comp);
    const width = seq.length * BASE_W;
    const cls = isSite ? "is-site" : isSticky ? "is-sticky" : kind === "gene" ? "is-gene" : "";
    const backClass = kind === "gene" ? "dna-gene" : kind === "waste" ? "dna-waste" : "dna-vector";
    return `
      <g transform="translate(${x} ${y})">
        ${label ? `<text x="${width / 2}" y="-26" fill="${kind === "gene" ? "#fca5a5" : "#93c5fd"}" font-size="13" font-weight="950" text-anchor="middle">${escapeHtml(label)}</text>` : ""}
        <rect class="dna-backbone ${backClass}" x="0" y="-10" width="${width}" height="10" rx="3" />
        ${top.map((letter, index) => showBases ? baseTop(index * BASE_W, 0, letter, cls) : "").join("")}
        <rect class="dna-backbone ${backClass}" x="0" y="68" width="${width}" height="10" rx="3" />
        ${bottom.map((letter, index) => showBases ? baseBottom(index * BASE_W, 0, letter, cls) : "").join("")}
        <text class="dna-end" x="-10" y="-3" text-anchor="end">5'</text>
        <text class="dna-end" x="${width + 10}" y="-3" text-anchor="start">3'</text>
        <text class="dna-end" x="-10" y="76" text-anchor="end">3'</text>
        <text class="dna-end" x="${width + 10}" y="76" text-anchor="start">5'</text>
      </g>
    `;
  }

  function renderCutSite(x, y, label) {
    const width = SITE.length * BASE_W;
    return `
      <g class="ge-enzyme" transform="translate(${x} ${y})">
        <rect x="-8" y="-20" width="${width + 16}" height="112" rx="15" />
        <text x="${width / 2}" y="-31" text-anchor="middle">${escapeHtml(label)}</text>
      </g>
    `;
  }

  function renderMolecular(state) {
    const step = state.step;
    const showBases = state.showBases;
    const showLabels = state.showLabels;
    const cut = step >= 1;
    const joined = step >= 2;
    const fadeWaste = cut ? 0 : 1;
    const geneX = joined ? 384 : 258;
    const geneY = joined ? 210 : 406;
    const wasteY = cut ? 540 : 406;
    const vectorRightX = cut ? 384 + GENE_SEQ.length * BASE_W : 258 + SITE.length * BASE_W;

    return `
      <g class="ge-molecular" style="opacity:${step <= 2 ? 1 : 0}; transform-origin: 50% 50%; transform:${step <= 2 ? "scale(1)" : "scale(.25) translateY(-180px)"}; transition: all 760ms cubic-bezier(.2,.8,.2,1)">
        ${showLabels ? `<text x="150" y="118" fill="#93c5fd" font-size="17" font-weight="950">载体 DNA：含抗性标记，等待插入目的基因</text>` : ""}
        ${showLabels ? `<text x="150" y="356" fill="#fca5a5" font-size="17" font-weight="950">外源 DNA：中间红色片段是目的基因</text>` : ""}
        ${step === 0 ? renderCutSite(258, 162, "EcoRI 识别 GAATTC") : ""}
        ${step === 0 ? renderCutSite(258, 406, "EcoRI") : ""}
        ${step === 0 ? renderCutSite(498, 406, "EcoRI") : ""}
        ${renderLinearBlock({ x: 150, y: 162, seq: VECTOR_LEFT.concat(SITE), kind: "vector", showBases, isSite: step === 0, label: showLabels ? "质粒载体左臂" : "" })}
        ${renderLinearBlock({ x: vectorRightX, y: 162, seq: SITE.concat(VECTOR_RIGHT), kind: "vector", showBases, isSite: step === 0, label: showLabels ? "质粒载体右臂" : "" })}
        ${renderLinearBlock({ x: geneX, y: geneY, seq: GENE_SEQ, kind: "gene", showBases, label: showLabels ? "目的基因" : "" })}
        <g style="opacity:${fadeWaste}; transition: opacity 520ms ease, transform 760ms ease; transform:translateY(${cut ? "80px" : "0"})">
          ${renderLinearBlock({ x: 150, y: wasteY, seq: WASTE_LEFT.concat(SITE), kind: "waste", showBases, isSite: step === 0, label: showLabels ? "无用侧翼" : "" })}
          ${renderLinearBlock({ x: 624, y: wasteY, seq: SITE.concat(WASTE_RIGHT), kind: "waste", showBases, isSite: step === 0, label: showLabels ? "无用侧翼" : "" })}
        </g>
        ${cut ? `
          <g>
            <line class="ge-cutLine" x1="295" y1="146" x2="295" y2="254" />
            <line class="ge-cutLine" x1="775" y1="146" x2="775" y2="254" />
            <text x="535" y="130" fill="#fbbf24" font-size="16" font-weight="950" text-anchor="middle">错位切割后，载体和目的基因露出相同 AATT 黏性末端</text>
          </g>
        ` : ""}
        ${joined ? `
          <g>
            <line class="ge-bond" x1="378" y1="156" x2="388" y2="156" />
            <line class="ge-bond" x1="378" y1="240" x2="388" y2="240" />
            <line class="ge-bond" x1="624" y1="156" x2="634" y2="156" />
            <line class="ge-bond" x1="624" y1="240" x2="634" y2="240" />
            <g class="ge-ligase" transform="translate(382 150)">
              <circle cx="0" cy="0" r="15" />
              <text x="0" y="-23" text-anchor="middle">连接酶</text>
            </g>
            <g class="ge-ligase" transform="translate(628 240)">
              <circle cx="0" cy="0" r="15" />
              <text x="0" y="34" text-anchor="middle">连接酶</text>
            </g>
          </g>
        ` : ""}
      </g>
    `;
  }

  function plasmidSymbol(x, y, scale = 1, label = true) {
    return `
      <g transform="translate(${x} ${y}) scale(${scale})">
        <circle class="ge-plasmidRing" cx="0" cy="0" r="84" />
        <path class="ge-plasmidGene" d="M -43 -72 A 84 84 0 0 1 43 -72" />
        <path class="ge-plasmidMark" d="M -74 40 A 84 84 0 0 0 74 40" />
        ${label ? `
          <text x="0" y="-111" fill="#fca5a5" font-size="14" font-weight="950" text-anchor="middle">目的基因</text>
          <text x="0" y="121" fill="#fde68a" font-size="14" font-weight="950" text-anchor="middle">抗性标记</text>
        ` : ""}
      </g>
    `;
  }

  function renderMacro(state) {
    const step = state.step;
    const visible = step >= 3;
    return `
      <g class="ge-macro" style="opacity:${visible ? 1 : 0}; transform-origin: 50% 50%; transform:${visible ? "scale(1)" : "scale(1.8)"}; transition: all 760ms cubic-bezier(.2,.8,.2,1)">
        <g style="opacity:${step === 3 ? 1 : 0}; transform:translateY(${step === 3 ? "0" : "-120px"}); transition: all 720ms ease">
          <text x="600" y="112" fill="#7dd3fc" font-size="20" font-weight="950" text-anchor="middle">转化：重组质粒进入感受态受体细胞</text>
          <g transform="translate(620 326)">
            <rect class="ge-bacterium" x="-255" y="-128" width="510" height="256" rx="128" />
            <path class="ge-cellDna" d="M -80 -25 C -25 -95 35 -88 80 -28 S 154 32 75 74 S -26 33 -92 85" />
            ${plasmidSymbol(step >= 3 ? -64 : -360, 0, .54, false)}
            <text x="0" y="164" fill="#7dd3fc" font-size="17" font-weight="950" text-anchor="middle">大肠杆菌感受态细胞</text>
          </g>
          <path d="M 240 326 C 322 306 374 306 484 326" fill="none" stroke="#34d399" stroke-width="5" stroke-linecap="round" stroke-dasharray="12 10" />
          <text x="335" y="290" fill="#bbf7d0" font-size="14" font-weight="950" text-anchor="middle">热激 / Ca2+</text>
        </g>
        <g style="opacity:${step === 4 ? 1 : 0}; transform:translateY(${step === 4 ? "0" : "150px"}); transition: all 720ms ease">
          <text x="600" y="92" fill="#fde68a" font-size="20" font-weight="950" text-anchor="middle">抗性筛选：只有带抗性标记的重组细胞形成菌落</text>
          <g transform="translate(600 350)">
            <circle class="ge-plate" cx="0" cy="0" r="225" />
            <circle cx="0" cy="0" r="211" fill="rgba(250,204,21,.07)" stroke="rgba(251,191,36,.38)" stroke-width="2" />
            <text x="0" y="-162" fill="#fbbf24" font-size="16" font-weight="950" text-anchor="middle">含抗生素的选择培养基</text>
            <g transform="translate(-95 18)">
              <rect class="ge-colony" x="-28" y="-14" width="56" height="28" rx="14" />
              <rect class="ge-colony" x="-55" y="-42" width="54" height="27" rx="14" transform="rotate(18)" />
              <rect class="ge-colony" x="24" y="28" width="58" height="29" rx="15" transform="rotate(-34)" />
              <circle cx="0" cy="0" r="82" fill="#38bdf8" opacity=".13" />
              <text x="0" y="-76" fill="#bae6fd" font-size="15" font-weight="950" text-anchor="middle">阳性菌落</text>
            </g>
            <g transform="translate(96 76)">
              <rect class="ge-dead" x="-30" y="-13" width="60" height="26" rx="13" />
              <line x1="-36" y1="-28" x2="36" y2="28" stroke="#ef4444" stroke-width="5" stroke-linecap="round" />
              <line x1="36" y1="-28" x2="-36" y2="28" stroke="#ef4444" stroke-width="5" stroke-linecap="round" />
              <text x="0" y="56" fill="#fca5a5" font-size="13" font-weight="950" text-anchor="middle">无抗性，死亡</text>
            </g>
            <g transform="translate(62 -72)">
              <rect class="ge-dead" x="-30" y="-13" width="60" height="26" rx="13" transform="rotate(35)" />
              <line x1="-34" y1="-26" x2="34" y2="26" stroke="#ef4444" stroke-width="5" stroke-linecap="round" />
              <line x1="34" y1="-26" x2="-34" y2="26" stroke="#ef4444" stroke-width="5" stroke-linecap="round" />
            </g>
          </g>
        </g>
      </g>
    `;
  }

  function refBaseTop(base) {
    return `
      <g class="dna-base" transform="translate(${base.i * REF_BASE_W} 0)">
        <path d="M0 0 L${REF_BASE_W} 0 L${REF_BASE_W} 32 L${REF_BASE_W / 2} 42 L0 32 Z" />
        <text x="${REF_BASE_W / 2}" y="22" text-anchor="middle">${escapeHtml(base.c)}</text>
      </g>
    `;
  }

  function refBaseBottom(base) {
    return `
      <g class="dna-base" transform="translate(${base.i * REF_BASE_W} 32)">
        <path d="M0 0 L${REF_BASE_W / 2} 10 L${REF_BASE_W} 0 L${REF_BASE_W} 42 L0 42 Z" />
        <text x="${REF_BASE_W / 2}" y="32" text-anchor="middle">${escapeHtml(base.c)}</text>
      </g>
    `;
  }

  function renderRefDnaBlock({ id, data, theme, label = "", label53 = {} }) {
    const topStartX = data.top[0].i * REF_BASE_W;
    const topW = data.top.length * REF_BASE_W;
    const botStartX = data.bot[0].i * REF_BASE_W;
    const botW = data.bot.length * REF_BASE_W;
    const labelX = Math.max(topStartX + topW / 2, botStartX + botW / 2);

    return `
      <g class="ref-dna-block" data-ref-block="${id}" style="--dna-top:${theme.top};--dna-bottom:${theme.bottom};--dna-base:${theme.base};--dna-text:${theme.text};">
        ${label ? `<text data-ge-label x="${labelX}" y="-30" fill="${theme.label}" font-size="15" font-weight="950" text-anchor="middle">${escapeHtml(label)}</text>` : ""}
        <rect class="ref-backbone-top" x="${topStartX}" y="-12" width="${topW}" height="12" rx="4" />
        ${data.top.map(refBaseTop).join("")}
        <rect class="ref-backbone-bottom" x="${botStartX}" y="74" width="${botW}" height="12" rx="4" />
        ${data.bot.map(refBaseBottom).join("")}
        ${label53.topLeft ? `<text class="ge-end-label" x="${topStartX - 10}" y="-4" fill="#94a3b8" font-size="14" font-weight="950" text-anchor="end">5'</text>` : ""}
        ${label53.topRight ? `<text class="ge-end-label" x="${topStartX + topW + 10}" y="-4" fill="#94a3b8" font-size="14" font-weight="950" text-anchor="start">3'</text>` : ""}
        ${label53.botLeft ? `<text class="ge-end-label" x="${botStartX - 10}" y="82" fill="#94a3b8" font-size="14" font-weight="950" text-anchor="end">3'</text>` : ""}
        ${label53.botRight ? `<text class="ge-end-label" x="${botStartX + botW + 10}" y="82" fill="#94a3b8" font-size="14" font-weight="950" text-anchor="start">5'</text>` : ""}
      </g>
    `;
  }

  function renderRefEcoRI(id, x, y, label) {
    return `
      <g class="ge-enzyme ref-ecori" data-ref-ecori="${id}" transform="translate(${x} ${y})">
        <rect x="0" y="-20" width="${REF_BASE_W * 6}" height="114" rx="16" />
        <text x="${REF_BASE_W * 3}" y="-30" text-anchor="middle">${escapeHtml(label)}</text>
      </g>
    `;
  }

  function renderRefHBonds(id, x, y, count) {
    return `
      <g class="ref-hbond" data-ref-hbond="${id}" transform="translate(${x} ${y})">
        ${Array.from({ length: count }).map((_, index) => `
          <line x1="${index * REF_BASE_W + REF_BASE_W / 2}" y1="34" x2="${index * REF_BASE_W + REF_BASE_W / 2}" y2="40" stroke="#94a3b8" stroke-width="3" stroke-dasharray="2 2" />
        `).join("")}
      </g>
    `;
  }

  function renderRefLigase(id, x, y, textY = -24) {
    return `
      <g class="ge-ligase ref-ligase" data-ref-ligase="${id}" transform="translate(${x} ${y})">
        <circle cx="0" cy="0" r="16" />
        <text x="0" y="${textY}" text-anchor="middle">连接酶</text>
      </g>
    `;
  }

  function renderRefPlasmid(label = true) {
    return `
      <g>
        <circle class="ge-plasmidRing" cx="0" cy="0" r="100" />
        <path class="ge-plasmidMark" d="M -86 50 A 100 100 0 0 0 86 50" />
        <path class="ge-plasmidGene" d="M -50 -86 A 100 100 0 0 1 50 -86" />
        ${label ? `
          <text data-ge-label x="0" y="-130" fill="#fca5a5" font-size="18" font-weight="950" text-anchor="middle">目的基因</text>
          <text data-ge-label x="0" y="130" fill="#fde68a" font-size="18" font-weight="950" text-anchor="middle">抗性标记基因</text>
        ` : ""}
      </g>
    `;
  }

  function renderStableSimulation(hasExternalPanel) {
    const simulation = `
      <section class="ge-stage" data-ref-stage style="--tone:#34d399">
        <div class="ge-header">
          <div>
            <span class="ge-kicker">基因工程动态实验室</span>
            <div class="ge-title">从酶切到筛选</div>
            <span class="ref-phasePill" data-ref-phase>微观视图</span>
          </div>
          <div class="ge-badge">
            <div>
              <b data-ref-step-number>1</b>
              <span>/ 5 步</span>
            </div>
          </div>
        </div>
        <div class="ge-canvas">
          <div class="ge-layer ge-microLayer" data-ref-micro-layer>
            <svg class="ge-svg" viewBox="0 0 1200 650" preserveAspectRatio="xMidYMid meet" role="img" aria-label="基因工程微观 DNA 动画">
              <text class="ref-sceneLabel" data-ge-label x="130" y="142" fill="#93c5fd" font-size="18" font-weight="950">质粒 DNA：含抗性标记，等待插入目的基因</text>
              <text class="ref-sceneLabel" data-ge-label x="130" y="362" fill="#fca5a5" font-size="18" font-weight="950">外源 DNA：中间红色片段是目的基因</text>
              ${renderRefEcoRI("p", 130 + 4 * REF_BASE_W, 200, "EcoRI (GAATTC)")}
              ${renderRefEcoRI("e1", 130 + 4 * REF_BASE_W, 420, "EcoRI")}
              ${renderRefEcoRI("e2", 130 + 16 * REF_BASE_W, 420, "EcoRI")}
              ${renderRefHBonds("left", 130 + 5 * REF_BASE_W, 200, 4)}
              ${renderRefHBonds("right", 130 + 17 * REF_BASE_W, 200, 4)}
              ${renderRefDnaBlock({ id: "p-left", data: REF_P_LEFT, theme: REF_THEME_PLASMID, label: "质粒载体左臂", label53: { topLeft: true, botLeft: true } })}
              ${renderRefDnaBlock({ id: "p-right", data: REF_P_RIGHT, theme: REF_THEME_PLASMID, label: "质粒载体右臂", label53: { topRight: true, botRight: true } })}
              ${renderRefDnaBlock({ id: "e-gene", data: REF_E_GENE, theme: REF_THEME_GENE, label: "目的基因" })}
              ${renderRefDnaBlock({ id: "e-left", data: REF_E_LEFT, theme: REF_THEME_FLANK, label: "无用侧翼", label53: { topLeft: true, botLeft: true } })}
              ${renderRefDnaBlock({ id: "e-right", data: REF_E_RIGHT, theme: REF_THEME_FLANK, label: "无用侧翼", label53: { topRight: true, botRight: true } })}
              <g class="ref-bonds" data-ref-bonds stroke="#22c55e" stroke-width="4" stroke-linecap="round">
                <line x1="${130 + 5 * REF_BASE_W - 2}" y1="${200 - 6}" x2="${130 + 5 * REF_BASE_W + 2}" y2="${200 - 6}" />
                <line x1="${130 + 9 * REF_BASE_W - 2}" y1="${200 + 80}" x2="${130 + 9 * REF_BASE_W + 2}" y2="${200 + 80}" />
                <line x1="${130 + 17 * REF_BASE_W - 2}" y1="${200 - 6}" x2="${130 + 17 * REF_BASE_W + 2}" y2="${200 - 6}" />
                <line x1="${130 + 21 * REF_BASE_W - 2}" y1="${200 + 80}" x2="${130 + 21 * REF_BASE_W + 2}" y2="${200 + 80}" />
              </g>
              ${renderRefLigase("l1", 130 + 5 * REF_BASE_W, 200 - 6, -24)}
              ${renderRefLigase("l2", 130 + 9 * REF_BASE_W, 200 + 80, 34)}
              ${renderRefLigase("l3", 130 + 17 * REF_BASE_W, 200 - 6, -24)}
              ${renderRefLigase("l4", 130 + 21 * REF_BASE_W, 200 + 80, 34)}
              <g class="ref-bonds" data-ref-cut-note>
                <text x="600" y="118" fill="#fbbf24" font-size="20" font-weight="950" text-anchor="middle">错位切割后，载体和目的基因露出相同 AATT 黏性末端</text>
              </g>
            </svg>
          </div>

          <div class="ge-layer ge-macroLayer" data-ref-macro-layer>
            <svg class="ge-svg" viewBox="0 0 1200 650" preserveAspectRatio="xMidYMid meet" role="img" aria-label="基因工程宏观细胞动画">
              <g class="ref-transformGroup" data-ref-transform-group>
                <g transform="translate(600 325)">
                  <rect class="ge-bacterium" x="-250" y="-150" width="500" height="300" rx="150" />
                  <path class="ge-cellDna" d="M 0 -80 Q 40 -120 80 -60 T 150 -50 T 160 30 T 90 90 T 30 60 T -40 100 T -80 40 Z" />
                  <text data-ge-label x="0" y="180" fill="#38bdf8" font-size="24" font-weight="950" text-anchor="middle">大肠杆菌（感受态受体细胞）</text>
                  <text data-ge-label x="60" y="-10" fill="#c084fc" font-size="16" font-weight="950">拟核 DNA</text>
                </g>
                <g class="ref-plasmidInCell" data-ref-plasmid>
                  ${renderRefPlasmid(true)}
                  <text class="pulse-slow" data-ref-success x="0" y="0" fill="#f8fafc" font-size="20" font-weight="950" text-anchor="middle">成功转化入细胞内</text>
                </g>
              </g>

              <g class="ref-plateGroup" data-ref-plate-group>
                <g transform="translate(600 360)">
                  <circle class="ge-plate" cx="0" cy="0" r="240" />
                  <circle cx="0" cy="0" r="230" fill="none" stroke="#b45309" stroke-width="2" opacity=".5" />
                  <circle cx="0" cy="0" r="230" fill="#fde68a" opacity=".10" />
                  <text data-ge-label x="0" y="275" fill="#fcd34d" font-size="24" font-weight="950" text-anchor="middle">添加了抗生素的琼脂固体培养基</text>
                  <text data-ge-label x="0" y="-100" fill="#fbbf24" font-size="30" font-weight="950" text-anchor="middle">抗生素筛选环境</text>

                  <g transform="translate(-100 20)">
                    <rect class="ge-colony" x="-30" y="-15" width="60" height="30" rx="15" />
                    <text data-ge-label x="0" y="40" fill="#38bdf8" font-size="16" font-weight="950" text-anchor="middle">拥有抗性基因</text>
                    <g class="ref-colonyBloom pulse-slow" data-ref-colony-bloom>
                      <rect class="ge-colony" x="-40" y="-40" width="60" height="30" rx="15" transform="rotate(30)" />
                      <rect class="ge-colony" x="10" y="20" width="60" height="30" rx="15" transform="rotate(-45)" />
                      <rect class="ge-colony" x="-20" y="30" width="60" height="30" rx="15" transform="rotate(15)" />
                      <rect class="ge-colony" x="40" y="-20" width="60" height="30" rx="15" transform="rotate(75)" />
                      <circle cx="0" cy="0" r="80" fill="#38bdf8" opacity=".2" />
                      <text data-ge-label x="0" y="-70" fill="#bae6fd" font-size="20" font-weight="950" text-anchor="middle">阳性重组菌落（大量扩增）</text>
                    </g>
                  </g>

                  <g class="ref-deadCell" data-ref-dead-cell="one" transform="translate(100 80)">
                    <rect class="ge-colony" x="-30" y="-15" width="60" height="30" rx="15" />
                    <line x1="-36" y1="-28" x2="36" y2="28" stroke="#ef4444" stroke-width="5" stroke-linecap="round" />
                    <line x1="36" y1="-28" x2="-36" y2="28" stroke="#ef4444" stroke-width="5" stroke-linecap="round" />
                    <text data-ge-label x="0" y="-25" fill="#ef4444" font-size="20" font-weight="950" text-anchor="middle">无抗性，被杀死</text>
                  </g>
                  <g class="ref-deadCell" data-ref-dead-cell="two" transform="translate(40 -80)">
                    <rect class="ge-colony" x="-30" y="-15" width="60" height="30" rx="15" transform="rotate(45)" />
                    <line x1="-34" y1="-26" x2="34" y2="26" stroke="#ef4444" stroke-width="5" stroke-linecap="round" />
                    <line x1="34" y1="-26" x2="-34" y2="26" stroke="#ef4444" stroke-width="5" stroke-linecap="round" />
                    <text data-ge-label x="0" y="-25" fill="#ef4444" font-size="20" font-weight="950" text-anchor="middle">无抗性，被杀死</text>
                  </g>
                </g>
              </g>
            </svg>
          </div>
        </div>
        <div class="ge-status">
          <strong data-ref-status-title></strong>
          <span data-ref-status-note></span>
        </div>
      </section>
    `;

    if (hasExternalPanel) return simulation;
    return `<div class="ge-shell">${simulation}<div data-ge-inline-panel></div></div>`;
  }

  function createSvgMotionController() {
    const current = new Map();
    const frames = new Map();
    const duration = 1500;

    function ease(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function write(el, value) {
      const scale = value.scale == null ? 1 : value.scale;
      el.setAttribute("transform", `translate(${value.x} ${value.y}) scale(${scale})`);
    }

    function move(el, target, instant = false) {
      if (!el) return;
      const normalized = { x: target.x || 0, y: target.y || 0, scale: target.scale == null ? 1 : target.scale };
      const previous = current.get(el) || normalized;
      if (frames.has(el)) cancelAnimationFrame(frames.get(el));

      if (instant) {
        write(el, normalized);
        current.set(el, normalized);
        frames.delete(el);
        return;
      }

      const start = performance.now();
      const tick = now => {
        const t = Math.min(1, (now - start) / duration);
        const k = ease(t);
        const value = {
          x: previous.x + (normalized.x - previous.x) * k,
          y: previous.y + (normalized.y - previous.y) * k,
          scale: previous.scale + (normalized.scale - previous.scale) * k
        };
        write(el, value);
        current.set(el, value);
        if (t < 1) {
          frames.set(el, requestAnimationFrame(tick));
        } else {
          current.set(el, normalized);
          frames.delete(el);
        }
      };

      frames.set(el, requestAnimationFrame(tick));
    }

    function cancelAll() {
      frames.forEach(frame => cancelAnimationFrame(frame));
      frames.clear();
    }

    return { move, cancelAll };
  }

  function setText(root, selector, value) {
    const node = root.querySelector(selector);
    if (node) node.textContent = value;
  }

  function setOpacity(root, selector, value) {
    root.querySelectorAll(selector).forEach(node => {
      node.style.opacity = String(value);
    });
  }

  function syncStableSimulation(root, state, motion, instant = false) {
    const stage = root.querySelector("[data-ref-stage]");
    if (!stage) return;

    const step = state.step;
    const info = COURSE_STEPS[step];
    const isMacro = step >= 3;
    const mStartX = 130;
    const mYPlasmid = 200;
    const mYExo = 420;
    const pRightX = step >= 1 ? mStartX + 5 * REF_BASE_W + 12 * REF_BASE_W : mStartX + 5 * REF_BASE_W;
    const eGeneY = step >= 2 ? mYPlasmid : mYExo;
    const eFlankY = step >= 1 ? mYExo + 150 : mYExo;

    stage.dataset.step = String(step);
    stage.style.setProperty("--tone", isMacro ? "#38bdf8" : "#34d399");
    stage.classList.toggle("is-hide-bases", !state.showBases);
    stage.classList.toggle("is-hide-labels", !state.showLabels);

    setText(stage, "[data-ref-step-number]", String(step + 1));
    setText(stage, "[data-ref-phase]", `${info.phase}视图`);
    setText(stage, "[data-ref-status-title]", info.title);
    setText(stage, "[data-ref-status-note]", info.note);

    const microLayer = stage.querySelector("[data-ref-micro-layer]");
    if (microLayer) {
      microLayer.style.opacity = isMacro ? "0" : "1";
      microLayer.style.transform = isMacro ? "scale(0.1) translateY(-200%)" : "scale(1) translateY(0)";
      microLayer.style.filter = isMacro ? "blur(10px)" : "none";
    }

    const macroLayer = stage.querySelector("[data-ref-macro-layer]");
    if (macroLayer) {
      macroLayer.style.opacity = isMacro ? "1" : "0";
      macroLayer.style.transform = isMacro ? "scale(1)" : "scale(3)";
    }

    const block = id => stage.querySelector(`[data-ref-block="${id}"]`);
    motion.move(block("p-left"), { x: mStartX, y: mYPlasmid }, instant);
    motion.move(block("p-right"), { x: pRightX, y: mYPlasmid }, instant);
    motion.move(block("e-gene"), { x: mStartX + 5 * REF_BASE_W, y: eGeneY }, instant);
    motion.move(block("e-left"), { x: mStartX, y: eFlankY }, instant);
    motion.move(block("e-right"), { x: mStartX + 5 * REF_BASE_W + 12 * REF_BASE_W, y: eFlankY }, instant);

    setOpacity(stage, "[data-ref-ecori]", step === 0 ? 1 : 0);
    setOpacity(stage, "[data-ref-hbond]", step >= 2 ? 1 : 0);
    setOpacity(stage, "[data-ref-ligase]", step === 2 ? 1 : 0);
    setOpacity(stage, "[data-ref-bonds]", step >= 2 ? 1 : 0);
    setOpacity(stage, "[data-ref-cut-note]", step >= 1 && step <= 2 ? 1 : 0);
    setOpacity(stage, "[data-ref-block=\"e-left\"], [data-ref-block=\"e-right\"]", step >= 1 ? 0 : 1);

    const transformGroup = stage.querySelector("[data-ref-transform-group]");
    motion.move(transformGroup, { x: 0, y: step === 3 ? 0 : -800 }, instant);
    if (transformGroup) transformGroup.style.opacity = step === 3 ? "1" : "0";

    const plasmid = stage.querySelector("[data-ref-plasmid]");
    motion.move(plasmid, { x: step === 3 ? 450 : 200, y: 325, scale: step === 3 ? 0.6 : 1 }, instant);
    setOpacity(stage, "[data-ref-success]", step === 3 ? 1 : 0);

    const plateGroup = stage.querySelector("[data-ref-plate-group]");
    motion.move(plateGroup, { x: 0, y: step === 4 ? 0 : 800 }, instant);
    if (plateGroup) plateGroup.style.opacity = step === 4 ? "1" : "0";
    setOpacity(stage, "[data-ref-colony-bloom]", step === 4 ? 1 : 0);
    stage.querySelectorAll("[data-ref-dead-cell]").forEach(node => {
      node.style.filter = step === 4 ? "grayscale(100%) opacity(.3)" : "none";
    });
  }

  function renderStage(state, hasExternalPanel) {
    const info = STEPS[state.step];
    const simulation = `
      <section class="ge-stage" style="--tone:${state.step >= 3 ? "#38bdf8" : "#34d399"}">
        <div class="ge-header">
          <div>
            <span class="ge-kicker">基因工程动态实验室</span>
            <div class="ge-title">从酶切到筛选</div>
          </div>
          <div class="ge-badge">
            <div>
              <b>${state.step + 1}</b>
              <span>/ 5 步</span>
            </div>
          </div>
        </div>
        <div class="ge-canvas">
          <svg class="ge-svg" viewBox="0 0 1200 650" preserveAspectRatio="xMidYMid meet" role="img" aria-label="基因工程动态流程模拟">
            ${renderMolecular(state)}
            ${renderMacro(state)}
          </svg>
        </div>
        <div class="ge-status">
          <strong>${escapeHtml(info.title)}</strong>
          <span>${escapeHtml(info.note)}</span>
        </div>
      </section>
    `;

    if (hasExternalPanel) return simulation;
    return `<div class="ge-shell">${simulation}${renderControls(state, false)}</div>`;
  }

  function renderControls(state, external) {
    const info = COURSE_STEPS[state.step];
    const canPrev = state.step > 0;
    const canNext = state.step < MAX_STEP;
    return `
      <aside class="ge-panel ${external ? "is-external" : "is-inline"}">
        <div class="ge-panelTop">
          <span class="ge-panelKicker">基因工程操作台</span>
          <h3>流程推演控制</h3>
          <p>右侧控制步骤，左侧观察 DNA 与细胞层级变化。</p>
        </div>

        <section class="ge-section ge-stepSection">
          <div class="ge-sectionTitle">
            <span>流程阶段</span>
            <strong>${escapeHtml(info.tag)}</strong>
          </div>
          <div class="ge-stepGrid">
            ${COURSE_STEPS.map((item, index) => `
              <button type="button" class="ge-stepButton ${state.step === index ? "is-active" : ""}" data-ge-action="set-step" data-step="${index}" aria-pressed="${state.step === index ? "true" : "false"}">
                <b>${index + 1}</b>
                <span>${escapeHtml(item.short)}</span>
              </button>
            `).join("")}
          </div>
        </section>

        <section class="ge-section ge-statSection">
          <div class="ge-sectionTitle">
            <span>当前判读</span>
            <strong>${escapeHtml(info.temp)}</strong>
          </div>
          <div class="ge-statGrid">
            <div><span>核心变化</span><b>${escapeHtml(info.stat[0])}</b></div>
            <div><span>产物状态</span><b>${escapeHtml(info.stat[1])}</b></div>
            <div><span>后续方向</span><b>${escapeHtml(info.stat[2])}</b></div>
          </div>
        </section>

        <section class="ge-section ge-actionSection">
          <div class="ge-sectionTitle">
            <span>操作</span>
            <strong>${state.playing ? "自动演示中" : "可手动推进"}</strong>
          </div>
          <div class="ge-actionGrid">
            <button type="button" data-ge-action="prev" ${canPrev ? "" : "disabled"}>上一步</button>
            <button type="button" data-ge-action="next" ${canNext ? "" : "disabled"}>下一步</button>
            <button type="button" data-ge-action="play" ${state.playing ? "disabled" : ""}>自动播放</button>
            <button type="button" data-ge-action="reset">重置流程</button>
          </div>
        </section>

        <section class="ge-section ge-detailSection">
          <div class="ge-sectionTitle">
            <span>显示</span>
            <strong>教学标记</strong>
          </div>
          <label class="ge-toggle">
            <input type="checkbox" ${state.showBases ? "checked" : ""} data-ge-action="toggle-bases" />
            <span>显示碱基字母</span>
          </label>
          <label class="ge-toggle">
            <input type="checkbox" ${state.showLabels ? "checked" : ""} data-ge-action="toggle-labels" />
            <span>显示结构标签</span>
          </label>
        </section>

        <section class="ge-section ge-clue">
          <div class="ge-sectionTitle">
            <span>关键规律</span>
            <strong>${state.step >= 2 ? "末端相容才可连接" : "同酶切割最关键"}</strong>
          </div>
          <p>${escapeHtml(state.step >= 2 ? "限制酶提供相容末端，连接酶只负责封闭骨架；筛选依赖载体上的抗性标记基因。" : "载体和目的基因必须用同一种或能产生相同黏性末端的限制酶处理。")}</p>
        </section>
      </aside>
    `;
  }

  function initialState() {
    return {
      step: 0,
      playing: false,
      showBases: true,
      showLabels: true
    };
  }

  return {
    mount(container, context = {}) {
      container.innerHTML = "";
      container.style.width = "100%";
      container.style.height = "100%";
      container.style.overflow = "hidden";

      const externalPanel = context.externalPanel && context.externalPanel.nodeType === 1
        ? context.externalPanel
        : null;
      const externalPanelStyle = externalPanel ? {
        overflow: externalPanel.style.overflow,
        overflowY: externalPanel.style.overflowY,
        overscrollBehavior: externalPanel.style.overscrollBehavior,
        scrollbarWidth: externalPanel.style.scrollbarWidth,
        touchAction: externalPanel.style.touchAction,
        userSelect: externalPanel.style.userSelect,
        webkitTapHighlightColor: externalPanel.style.webkitTapHighlightColor,
        height: externalPanel.style.height,
        minHeight: externalPanel.style.minHeight
      } : null;

      if (externalPanel) {
        externalPanel.style.overflow = "hidden auto";
        externalPanel.style.overflowY = "auto";
        externalPanel.style.overscrollBehavior = "contain";
        externalPanel.style.scrollbarWidth = "none";
        externalPanel.style.touchAction = "pan-y";
        externalPanel.style.userSelect = "none";
        externalPanel.style.webkitTapHighlightColor = "transparent";
        externalPanel.style.height = "100%";
        externalPanel.style.minHeight = "0";
      }

      const state = initialState();
      const motion = createSvgMotionController();
      let timers = [];

      function clearTimers() {
        timers.forEach(timer => clearTimeout(timer));
        timers = [];
        state.playing = false;
      }

      function later(fn, ms) {
        const timer = setTimeout(() => {
          timers = timers.filter(item => item !== timer);
          fn();
        }, ms);
        timers.push(timer);
      }

      function syncControls() {
        if (externalPanel) {
          externalPanel.innerHTML = `<style>${css()}</style>${renderControls(state, true)}`;
          return;
        }

        const inlinePanel = container.querySelector("[data-ge-inline-panel]");
        if (inlinePanel) {
          inlinePanel.innerHTML = renderControls(state, false);
        }
      }

      function applyState(instant = false) {
        syncStableSimulation(container, state, motion, instant);
        syncControls();
      }

      function renderInitial() {
        container.innerHTML = `<style>${css()}</style>${renderStableSimulation(Boolean(externalPanel))}`;
        applyState(true);
      }

      function setStep(step) {
        clearTimers();
        state.step = clamp(Number(step) || 0, 0, MAX_STEP);
        applyState(false);
      }

      function play() {
        clearTimers();
        state.playing = true;
        state.step = 0;
        applyState(false);
        for (let index = 1; index <= MAX_STEP; index += 1) {
          later(() => {
            state.step = index;
            if (index === MAX_STEP) state.playing = false;
            applyState(false);
          }, index * 1800);
        }
      }

      function actionFromEvent(event) {
        const target = event.target.closest("[data-ge-action]");
        if (!target) return;
        const action = target.dataset.geAction;

        if (action === "set-step") {
          setStep(target.dataset.step);
          return;
        }
        if (action === "prev") {
          setStep(state.step - 1);
          return;
        }
        if (action === "next") {
          setStep(state.step + 1);
          return;
        }
        if (action === "play") {
          play();
          return;
        }
        if (action === "reset") {
          clearTimers();
          Object.assign(state, initialState());
          applyState(false);
          return;
        }
        if (action === "toggle-bases") {
          state.showBases = Boolean(target.checked);
          applyState(true);
          return;
        }
        if (action === "toggle-labels") {
          state.showLabels = Boolean(target.checked);
          applyState(true);
        }
      }

      container.addEventListener("click", actionFromEvent);
      container.addEventListener("change", actionFromEvent);
      if (externalPanel) {
        externalPanel.addEventListener("click", actionFromEvent);
        externalPanel.addEventListener("change", actionFromEvent);
      }

      renderInitial();

      container.__geneSceneCleanup = () => {
        clearTimers();
        motion.cancelAll();
        container.removeEventListener("click", actionFromEvent);
        container.removeEventListener("change", actionFromEvent);
        if (externalPanel) {
          externalPanel.removeEventListener("click", actionFromEvent);
          externalPanel.removeEventListener("change", actionFromEvent);
          externalPanel.innerHTML = "";
          Object.assign(externalPanel.style, externalPanelStyle);
        }
      };
    },

    unmount(container) {
      if (container.__geneSceneCleanup) container.__geneSceneCleanup();
      container.innerHTML = "";
      delete container.__geneSceneCleanup;
    }
  };
})();
