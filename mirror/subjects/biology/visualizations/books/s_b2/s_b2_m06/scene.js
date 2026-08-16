window.BIO_VISUAL_SCENES = window.BIO_VISUAL_SCENES || {};
window.BIO_VISUAL_SCENES["s_b2_m06"] = (function () {
  "use strict";

  const COLORS = {
    A: { main: "#ef4444", dark: "#7f1d1d", glow: "#fca5a5" },
    T: { main: "#f59e0b", dark: "#78350f", glow: "#fde047" },
    C: { main: "#0ea5e9", dark: "#0c4a6e", glow: "#7dd3fc" },
    G: { main: "#10b981", dark: "#064e3b", glow: "#86efac" },
    U: { main: "#f97316", dark: "#7c2d12", glow: "#fdba74" }
  };

  const AA_COLORS = { Met: "#ec4899", Arg: "#8b5cf6", Ser: "#14b8a6", Gly: "#eab308" };
  const AA_SHORT_LABELS = { Met: "甲硫", Arg: "精氨", Ser: "丝氨", Gly: "甘氨" };
  const AA_FULL_LABELS = { Met: "甲硫氨酸", Arg: "精氨酸", Ser: "丝氨酸", Gly: "甘氨酸" };
  const baseW = 36;
  const transX = 150;
  const midY = 280;
  const freeRnaY = 160;
  const poreX = 900;
  const translX = 1150;
  const rnaY = 320;
  const rnaSeq = "A U G C G A U A G C U C A U A A".replace(/ /g, "").split("");
  const seqTemplate = rnaSeq.map((b) => b === "U" ? "A" : (b === "A" ? "T" : (b === "C" ? "G" : "C")));
  const nonTemplate = seqTemplate.map((b) => b === "A" ? "T" : (b === "T" ? "A" : (b === "C" ? "G" : "C")));

  const STEPS_INFO = [
    { stage: "核内：准备阶段", text: "DNA 在细胞核内稳定存放。即将开启基因表达。", tag: "准备" },
    { stage: "核内：转录进行", text: "RNA聚合酶包裹DNA并解旋，按互补原则合成 pre-mRNA。", tag: "转录" },
    { stage: "核内：转录完成", text: "聚合酶脱落，DNA 恢复；生成的 RNA 还包含无用的内含子。", tag: "脱落" },
    { stage: "核内：剪切体降落", text: "剪切体识别并附着在内含子两端。", tag: "识别" },
    { stage: "核内：剪切加工", text: "形成套索结构，剪除内含子，拼接外显子，得到成熟 mRNA。", tag: "剪接" },
    { stage: "核内：内含子降解", text: "成熟 mRNA 就绪，废弃内含子被核酸酶降解。", tag: "成熟" },
    { stage: "转场：核孔穿梭", text: "镜头横摇，成熟 mRNA 穿过核膜核孔，前往细胞质。", tag: "出核" },
    { stage: "核外：翻译组装", text: "核糖体大小亚基在 mRNA 上组装，起始 tRNA 降落。", tag: "组装" },
    { stage: "核外：密码子识别", text: "A 位点空出，携带精氨酸的第二个转运RNA飞入并精确对码。", tag: "识别" },
    { stage: "核外：肽键形成与移位", text: "脱水缩合形成肽键，核糖体右移一格，空载 tRNA 离开。", tag: "肽键" },
    { stage: "核外：持续合成", text: "第三个氨基酸丝氨酸被转接，多肽链继续变长。", tag: "延长" },
    { stage: "核外：多肽释放", text: "遇到终止密码子 UAA，释放因子介入，多肽链断开连接。", tag: "释放" },
    { stage: "核外：蛋白质折叠成型", text: "多肽链自发折叠为活性蛋白质，核糖体解体。", tag: "折叠" }
  ];

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function n(value) {
    if (!Number.isFinite(value)) return "0";
    return Number(value.toFixed(2)).toString();
  }

  function aaShort(value) {
    return AA_SHORT_LABELS[value] || value;
  }

  function aaFull(value) {
    return AA_FULL_LABELS[value] || value;
  }

  function peptideFullLabel(items) {
    return items && items.length ? items.map(aaFull).join("-") : "--";
  }

  function makeInitialV() {
    return {
      cameraX: 0,
      bubbleX: -200,
      rnaLen: 0,
      spliceY: -300,
      spliceOp: 0,
      loop: 0,
      cut: 0,
      exonShift: 0,
      mrnaX: 0,
      mrnaYOffset: 0,
      riboX: translX,
      largeY: -300,
      largeOp: 0,
      smallY: 300,
      smallOp: 0,
      t1X: translX,
      t1Y: -300,
      t1Op: 0,
      t2X: translX + 3 * baseW,
      t2Y: -300,
      t2Op: 0,
      t3X: translX + 6 * baseW,
      t3Y: -300,
      t3Op: 0,
      rfY: -300,
      rfOp: 0,
      freePepY: 278,
      freePepFolded: 0
    };
  }

  function makeInitialPep() {
    return { t1: [], t2: [], t3: [], free: [] };
  }

  function createState() {
    return {
      step: 0,
      isAnimating: false,
      v: makeInitialV(),
      pep: makeInitialPep(),
      raf: 0,
      timers: [],
      mounted: true
    };
  }

  function css() {
    return `
      .gene-stage,.gene-stage *,.gene-op,.gene-op *{box-sizing:border-box}
      .gene-stage{width:100%;height:100%;min-width:0;min-height:0;overflow:hidden;position:relative;color:#f8fafc;background-color:#020617;background-image:radial-gradient(rgba(56,189,248,.05) 1px,transparent 1px);background-size:40px 40px;font-family:"Microsoft YaHei","PingFang SC",Inter,system-ui,sans-serif;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
      .gene-stage::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 18% 18%,rgba(56,189,248,.12),transparent 34%),radial-gradient(circle at 82% 18%,rgba(251,191,36,.08),transparent 32%),linear-gradient(180deg,rgba(2,6,23,.1),rgba(2,6,23,.62));pointer-events:none}
      .gene-stage-inner{position:relative;z-index:1;width:100%;height:100%;padding:clamp(6px,1.4vmin,14px);overflow:hidden}
      .gene-viewport{width:100%;height:100%;overflow:hidden;border-radius:clamp(18px,2.7vmin,32px);border:1px solid rgba(255,255,255,.07);background:#020617}
      .gene-svg{width:100%;height:100%;display:block}
      .anim-all{transition:all 1.2s cubic-bezier(.34,1.56,.64,1)}
      .anim-fast{transition:all .5s cubic-bezier(.4,0,.2,1)}
      .organic-pulse{animation:geneOrganicPulse 3s infinite alternate ease-in-out;transform-origin:center}
      .energy-flash{animation:geneEnergyFlash 1s ease-out forwards}
      .gene-text-flash{animation:geneTextFlash 1s ease-out forwards}
      .dna-base-text{font-family:"JetBrains Mono",Consolas,monospace;font-weight:900}
      @keyframes geneOrganicPulse{0%{filter:drop-shadow(0 5px 15px rgba(0,0,0,.4));transform:scale(.98)}100%{filter:drop-shadow(0 15px 25px rgba(0,0,0,.7));transform:scale(1.02)}}
      @keyframes geneEnergyFlash{0%{filter:drop-shadow(0 0 20px #fbbf24) brightness(2);stroke:#fff;stroke-width:6px}100%{filter:drop-shadow(0 0 5px currentColor) brightness(1);stroke-width:3px}}
      @keyframes geneTextFlash{0%{filter:drop-shadow(0 0 14px #fbbf24) brightness(1.7);opacity:.92}100%{filter:drop-shadow(0 0 5px rgba(251,191,36,.65));opacity:1}}

      .gene-op{width:100%;height:100%;min-width:0;min-height:0;flex:1 1 auto;overflow-x:hidden!important;overflow-y:auto!important;scrollbar-width:none;background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;padding:18px;display:flex;flex-direction:column;gap:14px;color:#e2e8f0;font-family:"Microsoft YaHei","PingFang SC",Inter,system-ui,sans-serif;touch-action:pan-y;-webkit-tap-highlight-color:transparent}
      .gene-op::-webkit-scrollbar{display:none}
      .gene-op-card{min-width:0;border-radius:18px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.085);padding:16px;box-shadow:inset 0 1px 0 rgba(255,255,255,.035);flex:0 0 auto;overflow:hidden}
      .gene-op-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
      .gene-op-eyebrow{font-size:10px;line-height:1;font-weight:950;letter-spacing:.16em;text-transform:uppercase;color:rgba(134,239,172,.78);margin-bottom:9px}
      .gene-op-title{min-width:0}
      .gene-op-title h3{margin:0;color:#fff;font-size:22px;line-height:1.08;font-weight:950;letter-spacing:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .gene-op-title p{margin:8px 0 0;color:rgba(226,232,240,.72);font-size:12px;line-height:1.45;font-weight:760}
      .gene-op-badge{flex:0 0 auto;min-width:74px;border-radius:16px;border:1px solid rgba(103,232,249,.28);background:rgba(8,145,178,.12);padding:8px 10px;text-align:center;color:#ecfeff}
      .gene-op-badge strong{display:block;font-family:"JetBrains Mono",Consolas,monospace;font-size:15px;line-height:1;font-weight:950;color:#67e8f9}
      .gene-op-badge span{display:block;margin-top:5px;font-size:10px;line-height:1;font-weight:900;color:rgba(236,254,255,.78);white-space:nowrap}
      .gene-chip-row{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}
      .gene-chip{display:inline-flex;align-items:center;height:24px;border-radius:999px;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.085);padding:0 10px;color:rgba(226,232,240,.84);font-size:11px;font-weight:850;white-space:nowrap}
      .gene-section-label{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;color:rgba(226,232,240,.48);font-size:10px;line-height:1;font-weight:950;letter-spacing:.14em;text-transform:uppercase}
      .gene-section-label strong{min-width:0;max-width:62%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#fff;text-align:right;letter-spacing:0;text-transform:none;font-size:12px}
      .gene-step-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
      .gene-step-dot{min-width:0;min-height:40px;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.035);display:grid;place-items:center;gap:2px;padding:5px;color:rgba(226,232,240,.68)}
      .gene-step-dot.is-done{border-color:rgba(52,211,153,.32);background:rgba(16,185,129,.1);color:#d1fae5}
      .gene-step-dot.is-active{border-color:rgba(103,232,249,.62);background:rgba(8,145,178,.18);color:#ecfeff;box-shadow:0 0 0 1px rgba(103,232,249,.12) inset}
      .gene-step-dot b{font-family:"JetBrains Mono",Consolas,monospace;font-size:13px;line-height:1}
      .gene-step-dot span{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px;line-height:1;font-weight:850}
      .gene-actions{display:grid;grid-template-columns:1fr 1.35fr;gap:10px}
      .gene-op button{min-height:var(--bio-touch-target,44px);border:1px solid rgba(255,255,255,.09);border-radius:12px;background:rgba(255,255,255,.045);color:#e2e8f0;font-family:inherit;font-size:14px;font-weight:900;cursor:pointer;transition:transform .18s ease,border-color .18s ease,background .18s ease;touch-action:manipulation}
      .gene-op button:hover:not(:disabled){transform:translateY(-1px);border-color:rgba(52,211,153,.34)}
      .gene-op button:disabled{cursor:not-allowed;opacity:.48}
      .gene-op button.is-hot{border-color:rgba(103,232,249,.65);background:rgba(8,145,178,.18);color:#ecfeff}
      .gene-readout{flex:0 0 auto;min-height:0;overflow:visible}
      .gene-readout-grid{display:grid;gap:8px}
      .gene-readout-line{border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.03);border-radius:12px;padding:9px 10px;display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:12px;font-weight:900;color:rgba(226,232,240,.86);min-height:40px}
      .gene-readout-line strong{min-width:0;color:#fff;font-family:"JetBrains Mono",Consolas,monospace;text-align:right;overflow-wrap:anywhere;word-break:break-word}
      .gene-note h4{margin:0;color:#67e8f9;font-size:18px;line-height:1.18;font-weight:950}
      .gene-note p{margin:8px 0 0;color:rgba(226,232,240,.78);font-size:12px;line-height:1.5;font-weight:760}
      @media(max-height:900px){.gene-op{padding:14px;gap:10px}.gene-op-card{padding:12px;border-radius:16px}.gene-op-eyebrow{margin-bottom:7px}.gene-op-title h3{font-size:20px}.gene-op-title p{display:none}.gene-op-badge{padding:7px 9px}.gene-chip-row{margin-top:9px}.gene-op button{min-height:40px}.gene-step-dot{min-height:40px}.gene-note{display:none}}
      @media(max-height:740px){.gene-op{padding:10px;gap:8px}.gene-op-card{padding:10px;border-radius:15px}.gene-chip-row,.gene-readout .gene-section-label{display:none}.gene-op-title h3{font-size:18px}.gene-op-eyebrow{font-size:9px}.gene-op-badge{min-width:58px}.gene-op-badge span{display:none}.gene-section-label{margin-bottom:7px}.gene-op button{min-height:40px}.gene-step-dot{min-height:40px}.gene-readout-line{padding:6px 8px}.gene-viewport{border-radius:20px}}
      @media(max-height:570px){.gene-op{padding:7px;gap:6px}.gene-op-card{padding:8px;border-radius:13px}.gene-op-eyebrow,.gene-chip-row,.gene-readout,.gene-progress .gene-section-label{display:none}.gene-op-title h3{font-size:15px}.gene-op-badge{min-width:46px;padding:5px 7px;border-radius:10px}.gene-op-badge strong{font-size:11px}.gene-section-label{display:none}.gene-step-grid{grid-template-columns:repeat(7,minmax(0,1fr));gap:5px}.gene-step-dot{min-height:40px;border-radius:9px}.gene-step-dot span{display:none}.gene-actions{gap:6px}.gene-op button{min-height:40px;border-radius:10px;font-size:11px}.gene-stage-inner{padding:6px}.gene-viewport{border-radius:16px}}
      @media(max-width:900px){.gene-op-title h3{font-size:18px}.gene-op-badge{min-width:58px;padding:6px 8px}.gene-op-badge span{display:none}.gene-stage-inner{padding:8px}.gene-viewport{border-radius:18px}}
    `;
  }

  function gradients(sid) {
    const bases = Object.keys(COLORS).map((base) => {
      const c = COLORS[base];
      return `<linearGradient id="${sid}-grad-${base}" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="${c.glow}"></stop><stop offset="100%" stop-color="${c.main}"></stop></linearGradient>`;
    }).join("");
    return `
      ${bases}
      <linearGradient id="${sid}-dna-bone" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#334155"></stop><stop offset="100%" stop-color="#0f172a"></stop></linearGradient>
      <linearGradient id="${sid}-rna-bone" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f472b6"></stop><stop offset="100%" stop-color="#be185d"></stop></linearGradient>
      <filter id="${sid}-glow-rna" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#ec4899" flood-opacity="0.5"></feDropShadow></filter>
    `;
  }

  function basePath(char, isTop) {
    const w = 28;
    const h = 26;
    const side = isTop ? 1 : -1;
    const x0 = n(-w / 2);
    const x1 = n(w / 2);
    const y0 = n(-side * h / 2);
    const y1 = n(side * h / 2);
    if (char === "A") return `M ${x0} ${y0} L ${x1} ${y0} L ${x1} ${n(side * (h / 2 - 5))} A 10 10 0 0 ${isTop ? 1 : 0} ${x0} ${n(side * (h / 2 - 5))} Z`;
    if (char === "T" || char === "U") return `M ${x0} ${y0} L ${x1} ${y0} L ${x1} ${y1} L 12 ${y1} A 10 10 0 0 ${isTop ? 0 : 1} -12 ${y1} L ${x0} ${y1} Z`;
    if (char === "C") return `M ${x0} ${y0} L ${x1} ${y0} L ${x1} ${n(side * (h / 2 - 8))} L 8 ${n(side * (h / 2 - 8))} L 8 ${n(side * (h / 2 + 2))} L -8 ${n(side * (h / 2 + 2))} L -8 ${n(side * (h / 2 - 8))} L ${x0} ${n(side * (h / 2 - 8))} Z`;
    return `M ${x0} ${y0} L ${x1} ${y0} L ${x1} ${y1} L 10 ${y1} L 10 ${n(side * (h / 2 - 10))} L -10 ${n(side * (h / 2 - 10))} L -10 ${y1} L ${x0} ${y1} Z`;
  }

  function realisticBase(sid, opts) {
    const x = opts.x;
    const y = opts.y;
    const char = opts.char;
    const isTop = opts.isTop;
    const isRNA = Boolean(opts.isRNA);
    const isIntron = Boolean(opts.isIntron);
    const angle = opts.angle || 0;
    const opacity = opts.opacity == null ? 1 : opts.opacity;
    const c = COLORS[char] || COLORS.A;
    const w = 28;
    const h = 26;
    const side = isTop ? 1 : -1;
    const path = basePath(char, isTop);
    const finalOpacity = isIntron ? opacity * 0.4 : opacity;
    const stroke = isRNA ? (isIntron ? "#64748b" : "#fbcfe8") : "#0f172a";
    return `
      <g class="anim-fast" transform="translate(${n(x)}, ${n(y)}) rotate(${n(angle)})" style="opacity:${n(finalOpacity)};filter:${isIntron ? "grayscale(0.8)" : "none"}">
        <path d="${path}" fill="${c.dark}" transform="translate(0, ${isTop ? 2 : -2})"></path>
        <path d="${path}" fill="url(#${sid}-grad-${char})" stroke="${stroke}" stroke-width="1.5"></path>
        <path d="M ${n(-(w / 2 - 4))} ${n(-side * (h / 2 - 3))} L ${n(w / 2 - 4)} ${n(-side * (h / 2 - 3))}" stroke="#ffffff" stroke-width="3" opacity="0.4" stroke-linecap="round"></path>
        <text x="0" y="${isTop ? -3 : 7}" class="dna-base-text" fill="#ffffff" font-size="13" text-anchor="middle">${esc(char)}</text>
        ${isRNA ? `<circle cx="${w / 2 - 6}" cy="${isTop ? -10 : 10}" r="2.5" fill="#fff" opacity="${isIntron ? 0.3 : 0.8}"></circle>` : ""}
      </g>
    `;
  }

  function getDNAY(state, x, isTop) {
    const dist = Math.abs(x - state.v.bubbleX);
    const bulge = dist > 110 ? 0 : Math.cos((dist / 110) * (Math.PI / 2)) * 60;
    return midY + (isTop ? -14 - bulge : 14 + bulge);
  }

  function getMRNACoords(state, i) {
    let x = transX + i * baseW;
    let y = freeRnaY;
    let rot = 0;
    let op = 1;
    const v = state.v;
    if (state.step <= 1) {
      if (x > v.bubbleX - 70) {
        y = getDNAY(state, x, false) - 28;
      } else {
        y = freeRnaY - Math.sin(i * 0.5) * 10;
        rot = Math.cos(i * 0.5) * 10;
      }
    } else {
      if (i >= 10) x -= v.exonShift;
      if (i >= 6 && i <= 9) {
        const cx = transX + 5.5 * baseW;
        x = x + ([cx - 15, cx - 20, cx + 20, cx + 15][i - 6] - x) * v.loop;
        y = y + ([midY - 110, midY - 150, midY - 150, midY - 110][i - 6] - y) * v.loop - v.cut * 250;
        rot = (i - 7.5) * 30 * v.loop;
        if (v.cut > 0) op = 1 - v.cut;
      }
      x += v.mrnaX;
      y += v.mrnaYOffset;
    }
    return { x, y, rot, op };
  }

  function renderPeptide(arr, isFlash) {
    if (!arr || arr.length === 0) return "";
    const items = arr.map((aa, idx) => {
      const dy = -(arr.length - 1 - idx) * 40;
      const flashClass = isFlash && idx === arr.length - 2 ? "energy-flash" : "";
      return `
        <g transform="translate(0, ${dy})">
          <line x1="0" y1="-110" x2="0" y2="-145" stroke="#fbbf24" stroke-width="4" class="${flashClass}"></line>
          <circle cx="0" cy="-145" r="18" fill="${AA_COLORS[aa]}" stroke="#fff" stroke-width="2" filter="drop-shadow(0 5px 5px rgba(0,0,0,0.5))"></circle>
          <text x="0" y="-141" fill="#fff" font-size="10" font-weight="bold" text-anchor="middle">${esc(aaShort(aa))}</text>
        </g>
      `;
    }).join("");
    return `<g>${items}${isFlash ? `<text x="40" y="-130" fill="#fbbf24" font-size="14" font-weight="900">肽键生成!</text>` : ""}</g>`;
  }

  function droneTRNA(sid, state, opts) {
    const x = opts.x + baseW;
    const y = opts.y;
    const bases = opts.anti.split("").map((c, i) => realisticBase(sid, {
      x: i * baseW,
      y: 0,
      char: c,
      isTop: true,
      isRNA: true
    })).join("");
    return `
      <g class="anim-all" transform="translate(${n(x)}, ${n(y)})" style="opacity:${n(opts.op)}">
        <path d="M 0 -110 C -40 -110 -60 -60 -20 -40 C -30 -10 -10 10 0 10 C 10 10 30 -10 20 -40 C 60 -60 40 -110 0 -110 Z" fill="rgba(147, 51, 234, 0.4)" stroke="#d8b4fe" stroke-width="2" filter="drop-shadow(0 0 10px rgba(168,85,247,0.5))"></path>
        <text x="0" y="-55" fill="#f3e8ff" font-size="13" font-weight="900" text-anchor="middle">转运RNA</text>
        <g transform="translate(-36, 20)">${bases}</g>
        ${renderPeptide(opts.pep || [], opts.flash)}
      </g>
    `;
  }

  function renderMRNAPath(state) {
    if (state.step <= 0) return "";
    let d = "";
    let lastX = null;
    let lastY = null;
    rnaSeq.forEach((_, i) => {
      if (state.step === 1 && i >= (state.v.bubbleX - transX) / baseW) return;
      const point = getMRNACoords(state, i);
      if (point.op > 0) {
        d += d === "" ? `M ${n(point.x)} ${n(point.y)}` : ` L ${n(point.x)} ${n(point.y)}`;
        lastX = point.x;
        lastY = point.y;
      }
    });
    if (state.step >= 6 && lastX != null) d += ` L ${n(lastX + 300)} ${n(lastY)}`;
    return `<path d="${d}" fill="none" stroke="url(#${state.sid}-rna-bone)" stroke-width="6" stroke-linecap="round"></path>`;
  }

  function renderFreePeptide(state) {
    if (!state.pep.free.length) return "";
    const v = state.v;
    const items = state.pep.free.map((aa, idx) => {
      const linearY = -(state.pep.free.length - 1 - idx) * 35 - 130;
      const foldedX = idx === 0 ? -16 : idx === 1 ? 16 : 0;
      const foldedY = idx === 0 ? -120 : idx === 1 ? -120 : -150;
      const x = v.freePepFolded ? foldedX : 0;
      const y = v.freePepFolded ? foldedY : linearY;
      return `
        <g class="anim-all" transform="translate(${x}, ${y})">
          ${!v.freePepFolded && idx < state.pep.free.length - 1 ? `<line x1="0" y1="30" x2="0" y2="0" stroke="#fbbf24" stroke-width="4"></line>` : ""}
          ${v.freePepFolded && idx > 0 ? `<line x1="0" y1="0" x2="${-foldedX}" y2="${-foldedY - 150}" stroke="#fbbf24" stroke-width="4" opacity="0.6"></line>` : ""}
          ${v.freePepFolded && idx === 0 ? `<line x1="0" y1="0" x2="32" y2="0" stroke="#fbbf24" stroke-width="4" opacity="0.6"></line>` : ""}
          <circle cx="0" cy="0" r="18" fill="${AA_COLORS[aa]}" stroke="#fff" stroke-width="2" filter="drop-shadow(0 5px 5px rgba(0,0,0,0.5))"></circle>
                                                    <text x="0" y="4" fill="#fff" font-size="10" font-weight="bold" text-anchor="middle">${esc(aaShort(aa))}</text>
        </g>
      `;
    }).join("");
    return `
      <g class="anim-all" transform="translate(${translX + 6 * baseW + baseW}, ${n(v.freePepY)})">
        ${v.freePepFolded > 0.5 ? `<path d="M 0 -170 Q 50 -170 30 -110 Q 0 -90 -30 -110 Q -50 -170 0 -170 Z" fill="rgba(251,191,36,0.2)" filter="blur(8px)"></path>` : ""}
        ${items}
        ${v.freePepFolded > 0 ? `<text x="0" y="-80" fill="#fbbf24" font-size="18" font-weight="900" text-anchor="middle" class="gene-text-flash" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.8))">活性蛋白质！</text>` : ""}
      </g>
    `;
  }

  function renderSvg(state) {
    const sid = state.sid;
    const v = state.v;
    const topPath = `M ${n(transX - 20)} ${n(getDNAY(state, transX - 20, true) - 15)} ${seqTemplate.map((_, i) => `L ${n(transX + i * baseW)} ${n(getDNAY(state, transX + i * baseW, true) - 15)}`).join(" ")}`;
    const bottomPath = `M ${n(transX - 20)} ${n(getDNAY(state, transX - 20, false) + 15)} ${seqTemplate.map((_, i) => `L ${n(transX + i * baseW)} ${n(getDNAY(state, transX + i * baseW, false) + 15)}`).join(" ")}`;
    const dnaTop = seqTemplate.map((_, i) => realisticBase(sid, {
      x: transX + i * baseW,
      y: getDNAY(state, transX + i * baseW, true),
      char: nonTemplate[i],
      isTop: true
    })).join("");
    const dnaBottom = seqTemplate.map((c, i) => realisticBase(sid, {
      x: transX + i * baseW,
      y: getDNAY(state, transX + i * baseW, false),
      char: c,
      isTop: false
    })).join("");
    const rnaBases = rnaSeq.map((c, i) => {
      if (state.step === 1 && i >= (v.bubbleX - transX) / baseW) return "";
      const point = getMRNACoords(state, i);
      const isIntron = i >= 6 && i <= 9;
      return `
        <g>
          ${realisticBase(sid, { x: point.x, y: point.y, char: c, isTop: true, isRNA: true, isIntron, angle: point.rot, opacity: point.op })}
          ${state.step >= 6 && i % 3 === 1 && !isIntron ? `<rect x="${n(point.x - 50)}" y="${n(point.y + 20)}" width="100" height="4" rx="2" fill="rgba(255,255,255,0.2)"></rect>` : ""}
          ${state.step >= 6 && i % 3 === 1 && !isIntron ? `<text x="${n(point.x)}" y="${n(point.y + 40)}" fill="#94a3b8" font-size="10" font-weight="bold" text-anchor="middle">密码子 ${i < 6 ? Math.floor(i / 3) + 1 : Math.floor(i / 3)}</text>` : ""}
        </g>
      `;
    }).join("");
    const rnaHead = getMRNACoords(state, 0);

    return `
      <svg class="gene-svg" viewBox="-180 40 1180 380" preserveAspectRatio="xMidYMid meet" role="img" aria-label="基因表达一镜到底全景推演">
        <defs>${gradients(sid)}</defs>
        <g transform="translate(${-n(v.cameraX)}, 0)">
          <g opacity="0.2">
            <circle cx="200" cy="100" r="4" fill="#38bdf8"></circle>
            <circle cx="500" cy="300" r="3" fill="#fca5a5"></circle>
            <circle cx="1200" cy="80" r="6" fill="#fbbf24"></circle>
            <circle cx="1500" cy="320" r="4" fill="#a78bfa"></circle>
          </g>

          <text x="400" y="80" fill="#1e293b" font-size="60" font-weight="900" text-anchor="middle" letter-spacing="10" opacity="0.5">细胞核</text>

          <g transform="translate(${n(v.bubbleX)}, ${midY})" style="opacity:${state.step > 0 && state.step < 2 ? 1 : 0}" class="anim-all organic-pulse">
            <path d="M-150,-100 C-50,-140 100,-120 130,0 C100,120 -50,140 -150,100 C-180,50 -180,-50 -150,-100 Z" fill="#083344" opacity="0.8"></path>
            <path d="M-150,-100 C-50,-140 100,-120 130,0 C100,120 -50,140 -150,100 C-180,50 -180,-50 -150,-100 Z" fill="rgba(8,145,178,0.4)" filter="drop-shadow(0 0 15px rgba(6,182,212,0.3))"></path>
          </g>

          <g transform="translate(${transX + 5.5 * baseW}, ${n(v.spliceY - 30)})" style="opacity:${n(v.spliceOp)}" class="anim-all organic-pulse">
            <ellipse cx="0" cy="0" rx="90" ry="70" fill="rgba(147,51,234,0.3)" stroke="#c084fc" stroke-width="2" filter="drop-shadow(0 0 15px rgba(168,85,247,0.5))"></ellipse>
          </g>

          <g class="anim-all">
            <path d="${topPath}" fill="none" stroke="url(#${sid}-dna-bone)" stroke-width="10" stroke-linecap="round"></path>
            <path d="${bottomPath}" fill="none" stroke="#0284c7" stroke-width="12" stroke-linecap="round"></path>
            ${dnaTop}
            ${dnaBottom}
            <text x="${transX - 50}" y="${midY - 50}" fill="#94a3b8" font-size="16" font-weight="900" filter="drop-shadow(0 2px 4px #000)">5'</text>
            <text x="${transX - 50}" y="${midY + 55}" fill="#38bdf8" font-size="16" font-weight="900" filter="drop-shadow(0 2px 4px #000)">3' 模板链</text>
          </g>

          <g transform="translate(${n(v.bubbleX)}, ${midY})" style="opacity:${state.step > 0 && state.step < 2 ? 1 : 0}" class="anim-all organic-pulse">
            <path d="M-150,-100 C-50,-140 100,-120 130,0 C100,120 -50,140 -150,100 C-180,50 -180,-50 -150,-100 Z" fill="rgba(6,182,212,0.2)" stroke="#22d3ee" stroke-width="2"></path>
            <path d="M-120,-70 C-50,-100 50,-80 80,-20" fill="none" stroke="#ffffff" stroke-width="6" opacity="0.15" stroke-linecap="round" filter="blur(2px)"></path>
            <text x="-50" y="-80" fill="#67e8f9" font-size="16" font-weight="900" filter="drop-shadow(0 2px 4px #000)">RNA 聚合酶</text>
          </g>

          <g transform="translate(${transX + 5.5 * baseW}, ${n(v.spliceY - 30)})" style="opacity:${n(v.spliceOp)}" class="anim-all organic-pulse">
            <ellipse cx="0" cy="0" rx="90" ry="70" fill="rgba(192,132,252,0.1)"></ellipse>
            <text x="0" y="5" fill="#e9d5ff" font-size="18" font-weight="900" text-anchor="middle" filter="drop-shadow(0 2px 4px #000)">剪切体</text>
            ${state.step === 4 ? `<text x="0" y="30" fill="#fbbf24" font-size="14" font-weight="bold" text-anchor="middle" class="gene-text-flash">拼接完成！</text>` : ""}
          </g>

          <g transform="translate(${poreX}, 0)">
            <path d="M-40 0 L 40 0 Q 60 220 40 400 L -40 400 Z" fill="#0f172a" stroke="#1e293b" stroke-width="6"></path>
            <ellipse cx="15" cy="230" rx="20" ry="80" fill="#020617" filter="drop-shadow(0 0 10px #000)"></ellipse>
            <text x="-10" y="100" fill="#334155" font-size="18" font-weight="900" transform="rotate(90 -10 100)" letter-spacing="5">核孔</text>
          </g>

          <text x="1400" y="80" fill="#38220f" font-size="60" font-weight="900" text-anchor="middle" letter-spacing="10" opacity="0.5">细胞质</text>

          <g transform="translate(${n(v.riboX)}, ${n(rnaY + v.largeY)})" class="anim-all" style="opacity:${n(v.largeOp)}">
            <g class="organic-pulse">
              <path d="M -80 -30 C -120 -220 230 -220 190 -30 Z" fill="#451a03" opacity="0.6"></path>
              <path d="M -80 -30 C -120 -220 230 -220 190 -30 Z" fill="rgba(180,83,9,0.3)" stroke="rgba(245,158,11,0.4)" stroke-width="2"></path>
              <rect x="-35" y="-130" width="30" height="100" rx="10" fill="none" stroke="#475569" stroke-dasharray="4 4" opacity="0.8"></rect>
              <rect x="35" y="-130" width="40" height="100" rx="10" fill="none" stroke="#f59e0b" stroke-dasharray="4 4" opacity="0.6"></rect>
              <rect x="105" y="-130" width="40" height="100" rx="10" fill="none" stroke="#38bdf8" stroke-dasharray="4 4" opacity="0.6"></rect>
              <text x="-28" y="-140" fill="#94a3b8" font-size="13" font-weight="bold">E位</text>
              <text x="47" y="-140" fill="#fde047" font-size="13" font-weight="bold">P位</text>
              <text x="117" y="-140" fill="#7dd3fc" font-size="13" font-weight="bold">A位</text>
            </g>
          </g>

          <g filter="url(#${sid}-glow-rna)" class="anim-all">
            ${renderMRNAPath(state)}
            ${rnaBases}
            ${state.step > 0 ? `<text x="${n(rnaHead.x - 40)}" y="${n(rnaHead.y + 5)}" fill="#f472b6" font-size="14" font-weight="900">5' 信使RNA</text>` : ""}
          </g>

          <g class="anim-all" transform="translate(${translX + 9 * baseW + baseW}, ${n(v.rfY)})" style="opacity:${n(v.rfOp)}">
            <path d="M 0 -20 C 30 -20 40 -80 0 -90 C -40 -80 -30 -20 0 -20 Z" fill="rgba(16,185,129,0.4)" stroke="#047857" stroke-width="2" filter="drop-shadow(0 0 10px rgba(16,185,129,0.5))"></path>
            <text x="0" y="-55" fill="#a7f3d0" font-size="12" font-weight="bold" text-anchor="middle">释放因子</text>
          </g>

          ${droneTRNA(sid, state, { x: v.t1X, y: v.t1Y, op: v.t1Op, anti: "UAC", pep: state.pep.t1, flash: state.step === 9 })}
          ${droneTRNA(sid, state, { x: v.t2X, y: v.t2Y, op: v.t2Op, anti: "GCU", pep: state.pep.t2, flash: state.step === 10 })}
          ${droneTRNA(sid, state, { x: v.t3X, y: v.t3Y, op: v.t3Op, anti: "AGU", pep: state.pep.t3, flash: false })}
          ${renderFreePeptide(state)}

          <g transform="translate(${n(v.riboX)}, ${n(rnaY + v.largeY)})" class="anim-all" style="opacity:${n(v.largeOp)}">
            <path d="M -80 -30 C -120 -220 230 -220 190 -30 Z" fill="rgba(245,158,11,0.05)" stroke="#fcd34d" stroke-width="1"></path>
            <text x="60" y="-180" fill="#fde68a" font-size="16" font-weight="900" filter="drop-shadow(0 2px 4px #000)">核糖体大亚基</text>
          </g>
          <g transform="translate(${n(v.riboX)}, ${n(rnaY + v.smallY)})" class="anim-all" style="opacity:${n(v.smallOp)}">
            <path d="M -60 20 C -90 90 200 90 170 20 Z" fill="rgba(217,119,6,0.8)" stroke="rgba(245,158,11,0.8)" stroke-width="2" filter="drop-shadow(0 -5px 15px rgba(245,158,11,0.3))"></path>
            <text x="55" y="60" fill="#fef3c7" font-size="16" font-weight="900" filter="drop-shadow(0 2px 4px #000)">核糖体小亚基</text>
          </g>
        </g>
      </svg>
    `;
  }

  function renderStage(container, state) {
    container.innerHTML = `
      <div class="gene-stage" data-gene-expression-scope="${state.sid}">
        <div class="gene-stage-inner">
          <div class="gene-viewport">${renderSvg(state)}</div>
        </div>
      </div>
    `;
  }

  function renderPanel(panel, state) {
    if (!panel) return;
    const info = STEPS_INFO[state.step] || STEPS_INFO[0];
    const ready = !state.isAnimating;
    panel.innerHTML = `
      <section class="gene-op-card">
        <div class="gene-op-head">
          <div class="gene-op-title">
            <div class="gene-op-eyebrow">基因表达</div>
            <h3>基因表达全景推演</h3>
            <p>${esc(info.stage)}</p>
          </div>
          <div class="gene-op-badge"><strong>${state.step + 1}/13</strong><span>${esc(info.tag)}</span></div>
        </div>
        <div class="gene-chip-row">
          <span class="gene-chip">转录</span>
          <span class="gene-chip">RNA剪切</span>
          <span class="gene-chip">翻译</span>
        </div>
      </section>

      <section class="gene-op-card gene-progress">
        <div class="gene-section-label"><span>步骤轨迹</span><strong>${esc(info.tag)}</strong></div>
        <div class="gene-step-grid">
          ${STEPS_INFO.map((item, index) => `<div class="gene-step-dot ${index === state.step ? "is-active" : ""} ${index < state.step ? "is-done" : ""}"><b>${index + 1}</b><span>${esc(item.tag)}</span></div>`).join("")}
        </div>
      </section>

      <section class="gene-op-card">
        <div class="gene-section-label"><span>操作</span><strong>${ready ? "可推进" : "动画播放中"}</strong></div>
        <div class="gene-actions">
          <button type="button" data-action="reset" ${state.isAnimating ? "disabled" : ""}>重置</button>
          <button type="button" data-action="next" class="is-hot" ${state.step >= STEPS_INFO.length - 1 || state.isAnimating ? "disabled" : ""}>${state.step >= STEPS_INFO.length - 1 ? "表达完成" : "播放下一步"}</button>
        </div>
      </section>

      <section class="gene-op-card gene-readout">
        <div class="gene-section-label"><span>当前信息</span><strong>${esc(info.stage)}</strong></div>
        <div class="gene-readout-grid">
          <div class="gene-readout-line"><span>信使RNA序列</span><strong>5' ${rnaSeq.join("")} 3'</strong></div>
          <div class="gene-readout-line"><span>当前场景</span><strong>${state.v.cameraX < 400 ? "细胞核" : "细胞质"}</strong></div>
          <div class="gene-readout-line"><span>多肽链</span><strong>${state.pep.free.length ? peptideFullLabel(state.pep.free) : peptideFullLabel(state.pep.t1.concat(state.pep.t2, state.pep.t3))}</strong></div>
        </div>
        <div class="gene-note">
          <h4>${esc(info.stage)}</h4>
          <p>${esc(info.text)}</p>
        </div>
      </section>
    `;
  }

  function run(state, targets, duration, render) {
    if (state.raf) window.cancelAnimationFrame(state.raf);
    const startVals = Object.assign({}, state.v);
    const startTime = performance.now();
    const tick = (time) => {
      if (!state.mounted) return;
      let p = (time - startTime) / duration;
      if (p >= 1) p = 1;
      const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      const nextVals = Object.assign({}, state.v);
      Object.keys(targets).forEach((key) => {
        nextVals[key] = startVals[key] + (targets[key] - startVals[key]) * ease;
      });
      state.v = nextVals;
      render("stage");
      if (p < 1) {
        state.raf = window.requestAnimationFrame(tick);
      } else {
        state.raf = 0;
      }
    };
    state.raf = window.requestAnimationFrame(tick);
  }

  function addTimer(state, fn, ms) {
    const id = window.setTimeout(() => {
      state.timers = state.timers.filter((item) => item !== id);
      if (state.mounted) fn();
    }, ms);
    state.timers.push(id);
    return id;
  }

  function setBusyFor(state, render, ms) {
    state.isAnimating = true;
    render("panel");
    addTimer(state, () => {
      state.isAnimating = false;
      render("panel");
    }, ms);
  }

  function nextStep(state, render) {
    if (state.isAnimating || state.step >= STEPS_INFO.length - 1) return;
    const s = state.step + 1;
    state.step = s;
    render("all");

    if (s === 1) run(state, { bubbleX: transX + 16 * baseW, rnaLen: 16 }, 4000, render);
    if (s === 2) run(state, { bubbleX: 2000 }, 1500, render);
    if (s === 3) run(state, { spliceY: midY, spliceOp: 1 }, 1500, render);
    if (s === 4) run(state, { loop: 1, exonShift: 4 * baseW, cut: 1 }, 3000, render);
    if (s === 5) run(state, { spliceY: -300, spliceOp: 0 }, 1500, render);
    if (s === 6) run(state, { mrnaX: translX - transX, mrnaYOffset: rnaY - freeRnaY, cameraX: 980 }, 4000, render);
    if (s === 7) {
      run(state, { smallY: 0, smallOp: 1, largeY: 0, largeOp: 1, t1Y: rnaY - 42, t1Op: 1 }, 2500, render);
      state.pep.t1 = ["Met"];
      render("all");
    }
    if (s === 8) {
      run(state, { t2Y: rnaY - 42, t2Op: 1 }, 1500, render);
      state.pep.t2 = ["Arg"];
      render("all");
    }
    if (s === 9) {
      state.pep.t2 = ["Met", "Arg"];
      state.pep.t1 = [];
      render("all");
      addTimer(state, () => run(state, { riboX: translX + 3 * baseW, t1X: translX - 3 * baseW, t1Y: -300, t1Op: 0, t2X: translX, t3Y: rnaY - 42, t3Op: 1 }, 2000, render), 1000);
      addTimer(state, () => {
        state.pep.t3 = ["Ser"];
        render("all");
      }, 3000);
    }
    if (s === 10) {
      state.pep.t3 = ["Met", "Arg", "Ser"];
      state.pep.t2 = [];
      render("all");
      addTimer(state, () => run(state, { riboX: translX + 6 * baseW, t2X: translX, t2Y: -300, t2Op: 0, t3X: translX, rfY: rnaY - 42, rfOp: 1 }, 2000, render), 1000);
    }
    if (s === 11) {
      state.pep.free = ["Met", "Arg", "Ser"];
      state.pep.t3 = [];
      run(state, { freePepY: 230 }, 2000, render);
      render("all");
    }
    if (s === 12) {
      run(state, { freePepFolded: 1, largeY: -300, largeOp: 0, smallY: 300, smallOp: 0, t3Y: -300, t3Op: 0, rfY: -300, rfOp: 0 }, 2500, render);
    }

    setBusyFor(state, render, s === 1 || s === 6 ? 4200 : s === 9 || s === 10 ? 3200 : 2000);
  }

  function resetScene(state, render) {
    if (state.isAnimating) return;
    state.step = 0;
    state.pep = makeInitialPep();
    run(state, makeInitialV(), 1000, render);
    render("all");
  }

  function preparePanel(panel) {
    if (!panel) return null;
    const previous = {
      className: panel.className,
      style: panel.getAttribute("style") || ""
    };
    panel.className = "gene-op";
    panel.setAttribute("data-panel-version", "gene-expression-reference-port-20260428");
    panel.style.overflow = "hidden auto";
    panel.style.overflowY = "auto";
    panel.style.overscrollBehavior = "contain";
    panel.style.scrollbarWidth = "none";
    panel.style.background = "transparent";
    panel.style.border = "0";
    panel.style.borderRadius = "0";
    panel.style.boxShadow = "none";
    panel.style.padding = "";
    panel.style.minHeight = "0";
    panel.style.height = "100%";
    panel.style.touchAction = "pan-y";
    return previous;
  }

  return {
    mount(container, context = {}) {
      if (!container) return;
      const panel = context.externalPanel && context.externalPanel.nodeType === 1 ? context.externalPanel : null;
      const state = createState();
      state.sid = "gene-" + Math.random().toString(36).slice(2, 8);
      const style = document.createElement("style");
      style.textContent = css();
      document.head.appendChild(style);
      const panelSnapshot = preparePanel(panel);

      const render = (part) => {
        if (!state.mounted) return;
        if (part === "panel") {
          renderPanel(panel, state);
          return;
        }
        if (part === "stage") {
          renderStage(container, state);
          return;
        }
        renderStage(container, state);
        renderPanel(panel, state);
      };

      const onPanelClick = (event) => {
        const control = event.target.closest && event.target.closest("[data-action]");
        if (!control || !panel || !panel.contains(control)) return;
        const action = control.getAttribute("data-action");
        if (action === "next") nextStep(state, render);
        if (action === "reset") resetScene(state, render);
      };

      if (panel) panel.addEventListener("click", onPanelClick);
      const ro = typeof ResizeObserver === "function" ? new ResizeObserver(() => render("stage")) : null;
      if (ro) ro.observe(container);
      container.__geneExpressionCleanup = function () {
        state.mounted = false;
        if (state.raf) window.cancelAnimationFrame(state.raf);
        state.timers.forEach((id) => window.clearTimeout(id));
        state.timers = [];
        if (panel) {
          panel.removeEventListener("click", onPanelClick);
          panel.innerHTML = "";
          if (panelSnapshot) {
            panel.className = panelSnapshot.className;
            panel.setAttribute("style", panelSnapshot.style);
          }
        }
        if (ro) ro.disconnect();
        if (style.parentNode) style.parentNode.removeChild(style);
      };
      render("all");
    },
    unmount(container) {
      if (container && container.__geneExpressionCleanup) {
        container.__geneExpressionCleanup();
        delete container.__geneExpressionCleanup;
      }
      if (container) container.innerHTML = "";
    }
  };
})();
