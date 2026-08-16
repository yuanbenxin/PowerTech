window.BIO_VISUAL_SCENES = window.BIO_VISUAL_SCENES || {};
window.BIO_VISUAL_SCENES["s_b2_m02"] = (function () {
  "use strict";

  const SINGLE_OPTIONS = [
    { value: "YY", label: "YY 纯合黄" },
    { value: "Yy", label: "Yy 杂合黄" },
    { value: "yy", label: "yy 纯合绿" }
  ];
  const DOUBLE_OPTIONS = [
    { value: "YYRR", label: "YYRR 纯合黄圆" },
    { value: "YyRr", label: "YyRr 双杂合黄圆" },
    { value: "yyrr", label: "yyrr 纯合绿皱" }
  ];
  const MODE_META = {
    mono: {
      title: "分离定律",
      subtitle: "一对相对性状",
      law: "孟德尔第一定律",
      accent: "#10b981",
      steps: ["亲本", "配子", "子代"],
      concept: "等位基因在形成配子时彼此分离，杂合自交常出现 3:1 的表现型比例。"
    },
    di: {
      title: "自由组合",
      subtitle: "两对相对性状",
      law: "孟德尔第二定律",
      accent: "#6366f1",
      steps: ["亲本", "配子", "子代"],
      concept: "不同性状的非等位基因在形成配子时自由组合，双杂合自交常出现 9:3:3:1。"
    }
  };

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function uniqueAlleles(gene) {
    return Array.from(new Set(gene.split("")));
  }

  function generateGametes(genotype) {
    if (genotype.length === 2) return uniqueAlleles(genotype);
    const g1 = uniqueAlleles(genotype.slice(0, 2));
    const g2 = uniqueAlleles(genotype.slice(2, 4));
    const gametes = [];
    g1.forEach((a) => g2.forEach((b) => gametes.push(a + b)));
    return gametes;
  }

  function orderPair(a, b) {
    const aUpper = a === a.toUpperCase();
    const bUpper = b === b.toUpperCase();
    if (!aUpper && bUpper) return b + a;
    return a + b;
  }

  function combineGametes(g1, g2) {
    if (g1.length === 1) return orderPair(g1, g2);
    return orderPair(g1[0], g2[0]) + orderPair(g1[1], g2[1]);
  }

  function singlePhenotype(genotype) {
    return genotype.includes("Y") ? "yellow" : "green";
  }

  function doublePhenotype(genotype) {
    const isYellow = genotype.includes("Y");
    const isRound = !genotype.includes("rr");
    if (isYellow && isRound) return "yellowRound";
    if (isYellow && !isRound) return "yellowWrinkled";
    if (!isYellow && isRound) return "greenRound";
    return "greenWrinkled";
  }

  function phenotypeInfo(key) {
    const map = {
      yellow: { name: "黄色", genotype: "Y_", color: "#eab308", pea: "Yy" },
      green: { name: "绿色", genotype: "yy", color: "#22c55e", pea: "yy" },
      yellowRound: { name: "黄圆", genotype: "Y_R_", color: "#eab308", pea: "YyRr" },
      yellowWrinkled: { name: "黄皱", genotype: "Y_rr", color: "#f59e0b", pea: "Yyrr" },
      greenRound: { name: "绿圆", genotype: "yyR_", color: "#22c55e", pea: "yyRr" },
      greenWrinkled: { name: "绿皱", genotype: "yyrr", color: "#059669", pea: "yyrr" }
    };
    return map[key] || { name: key, genotype: key, color: "#64748b", pea: key };
  }

  function calcResult(state) {
    const isMono = state.mode === "mono";
    const p1 = isMono ? state.mono.p1 : state.di.p1;
    const p2 = isMono ? state.mono.p2 : state.di.p2;
    const gametes1 = generateGametes(p1);
    const gametes2 = generateGametes(p2);
    const cells = [];
    const gen = {};
    const phen = isMono
      ? { yellow: 0, green: 0 }
      : { yellowRound: 0, yellowWrinkled: 0, greenRound: 0, greenWrinkled: 0 };

    gametes2.forEach((rowG, r) => {
      gametes1.forEach((colG, c) => {
        const child = combineGametes(colG, rowG);
        const pheno = isMono ? singlePhenotype(child) : doublePhenotype(child);
        gen[child] = (gen[child] || 0) + 1;
        phen[pheno] = (phen[pheno] || 0) + 1;
        cells.push({ row: r, col: c, rowG, colG, genotype: child, phenotype: pheno });
      });
    });

    return {
      p1,
      p2,
      gametes1,
      gametes2,
      cells,
      gen,
      phen,
      total: cells.length,
      cols: gametes1.length,
      rows: gametes2.length
    };
  }

  function ratioLabel(state, result) {
    if (state.mode === "mono") {
      if (state.mono.p1 === "Yy" && state.mono.p2 === "Yy") return "3 : 1";
      if (
        (state.mono.p1 === "Yy" && state.mono.p2 === "yy") ||
        (state.mono.p1 === "yy" && state.mono.p2 === "Yy")
      ) return "1 : 1";
    }
    if (state.mode === "di") {
      if (state.di.p1 === "YyRr" && state.di.p2 === "YyRr") return "9 : 3 : 3 : 1";
      if (
        (state.di.p1 === "YyRr" && state.di.p2 === "yyrr") ||
        (state.di.p1 === "yyrr" && state.di.p2 === "YyRr")
      ) return "1 : 1 : 1 : 1";
    }
    return `${result.total} 种组合`;
  }

  function ratioNote(state) {
    if (state.mode === "mono") {
      if (state.mono.p1 === "Yy" && state.mono.p2 === "Yy") return "经典杂合自交比例，显性性状与隐性性状约为 3:1。";
      if (
        (state.mono.p1 === "Yy" && state.mono.p2 === "yy") ||
        (state.mono.p1 === "yy" && state.mono.p2 === "Yy")
      ) return "测交比例，说明杂合体产生两种等量配子。";
    }
    if (state.mode === "di") {
      if (state.di.p1 === "YyRr" && state.di.p2 === "YyRr") return "双杂合自交的经典表现型比例。";
      if (
        (state.di.p1 === "YyRr" && state.di.p2 === "yyrr") ||
        (state.di.p1 === "yyrr" && state.di.p2 === "YyRr")
      ) return "双杂合测交，证明四种配子大致等量产生。";
    }
    return "改变亲本基因型后，棋盘格会重新计算子代组合。";
  }

  function sceneCss() {
    return `
    .mendel-stage,.mendel-stage *,.mendel-panel,.mendel-panel *{box-sizing:border-box}
    .mendel-stage,.mendel-panel{width:100%;height:100%;min-width:0;min-height:0;font-family:"Microsoft YaHei","PingFang SC",Inter,system-ui,sans-serif;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
    .mendel-stage{--accent:#10b981;position:relative;overflow:hidden;border-radius:clamp(24px,4vw,48px);border:1px solid rgba(255,255,255,.1);background:#f0fdf4;background-image:radial-gradient(circle at center,rgba(34,197,94,.22) 1px,transparent 1px);background-size:24px 24px;box-shadow:inset 0 1px 0 rgba(255,255,255,.6),0 30px 90px rgba(0,0,0,.42);padding:clamp(12px,2.2vh,22px) clamp(18px,2.6vw,30px);color:#0f172a;display:flex;align-items:center;justify-content:center}
    .mendel-stage.is-di{--accent:#6366f1;background-color:#eef2ff;background-image:radial-gradient(circle at center,rgba(99,102,241,.18) 1px,transparent 1px)}
    .mendel-visual{width:min(100%,940px);height:min(100%,680px);margin:auto;display:grid;grid-template-rows:minmax(64px,auto) minmax(0,1fr);gap:clamp(8px,1.6vh,14px);min-width:0;min-height:0;overflow:hidden}
    .mendel-parents{width:100%;display:grid;grid-template-columns:minmax(190px,330px) clamp(42px,6vw,58px) minmax(190px,330px);align-items:center;justify-content:center;gap:clamp(8px,1.6vw,18px)}
    .mendel-parent{width:100%;min-width:0;min-height:0;border:1px solid rgba(15,23,42,.08);background:rgba(255,255,255,.86);border-radius:18px;padding:clamp(7px,1.1vh,11px);display:flex;align-items:center;justify-content:center;gap:clamp(8px,1.4vw,14px);box-shadow:0 14px 30px rgba(15,23,42,.08);overflow:hidden}
    .mendel-parent strong{display:block;font-size:clamp(11px,1.55vh,13px);color:#475569;line-height:1.1}
    .mendel-parent b{display:block;margin-top:4px;font-family:"JetBrains Mono",Consolas,monospace;font-size:clamp(18px,2.9vh,26px);line-height:1;color:#0f172a}
    .mendel-cross{width:clamp(40px,5vw,58px);height:clamp(40px,5vw,58px);border-radius:18px;display:grid;place-items:center;background:rgba(15,23,42,.06);color:var(--accent);font-size:clamp(26px,4vh,38px);font-weight:950;box-shadow:inset 0 0 0 1px rgba(15,23,42,.06)}
    .mendel-lab{min-height:0;display:grid;grid-template-columns:minmax(0,1fr);align-items:stretch}
    .mendel-board-wrap{min-width:0;min-height:0;border:1px solid rgba(15,23,42,.08);background:rgba(255,255,255,.88);border-radius:22px;box-shadow:0 18px 38px rgba(15,23,42,.08);padding:clamp(12px,2vh,20px) clamp(14px,2.2vw,24px);display:flex;align-items:center;justify-content:center;overflow:hidden}
    .mendel-empty{width:min(620px,100%);text-align:center;display:grid;place-items:center;gap:12px;color:#64748b;font-weight:850;line-height:1.55}
    .mendel-empty .law{color:var(--accent);font-size:clamp(20px,4vh,34px);font-weight:950}
    .mendel-empty .hint{max-width:520px;font-size:clamp(13px,2vh,17px)}
    .mendel-meiosis{display:flex;align-items:center;justify-content:center;gap:clamp(10px,2.4vw,24px);margin-top:4px;flex-wrap:wrap}
    .mendel-chromosome{height:54px;min-width:54px;border-radius:999px;background:linear-gradient(135deg,rgba(99,102,241,.13),rgba(16,185,129,.14));border:1px solid rgba(99,102,241,.18);display:grid;place-items:center;font-family:"JetBrains Mono",Consolas,monospace;font-size:18px;color:#334155;animation:mendelPop .45s cubic-bezier(.34,1.56,.64,1) both}
    .mendel-board{--cols:2;--rows:2;width:min(100%,var(--board-w,680px));max-height:100%;aspect-ratio:var(--ratio,1/1);display:grid;grid-template-columns:clamp(34px,8%,58px) repeat(var(--cols),minmax(0,1fr));grid-template-rows:clamp(30px,9%,50px) repeat(var(--rows),minmax(0,1fr));gap:clamp(6px,1.15vh,10px);overflow:visible}
    .mendel-board.is-single{--board-w:500px}
    .mendel-board.is-double{--board-w:650px}
    .mendel-corner{border-radius:12px;background:rgba(15,23,42,.04);display:grid;place-items:center;color:#94a3b8;font-size:12px;font-weight:900}
    .mendel-gamete{border:1px solid rgba(99,102,241,.16);border-radius:999px;background:#fff;display:grid;place-items:center;font-family:"JetBrains Mono",Consolas,monospace;font-size:clamp(11px,2vh,18px);font-weight:950;color:#4f46e5;box-shadow:0 8px 16px rgba(79,70,229,.1);transition:all .22s ease;animation:mendelPop .45s cubic-bezier(.34,1.56,.64,1) both}
    .mendel-gamete.is-row{color:#0f766e;border-color:rgba(15,118,110,.2)}
    .mendel-gamete.is-active{background:#4f46e5;color:white;transform:scale(1.08);box-shadow:0 0 18px rgba(79,70,229,.38)}
    .mendel-cell{min-width:0;min-height:0;border:1px solid rgba(15,23,42,.08);background:#f8fafc;border-radius:16px;display:grid;place-items:center;position:relative;overflow:hidden;transition:all .24s ease;cursor:pointer}
    .mendel-cell::before{content:"";position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.8),transparent);pointer-events:none}
    .mendel-cell.is-active{z-index:5;transform:scale(1.04);border-color:var(--accent);box-shadow:0 16px 34px rgba(15,23,42,.18)}
    .mendel-cell.is-dim{opacity:.56;filter:grayscale(.35);transform:scale(.98)}
    .mendel-cell-pending{color:#cbd5e1;font-size:clamp(18px,4vh,34px);font-weight:950}
    .mendel-child{position:relative;z-index:1;display:grid;place-items:center;gap:3px;animation:mendelFade .38s ease both}
    .mendel-gt{font-family:"JetBrains Mono",Consolas,monospace;font-size:clamp(9px,1.6vh,13px);font-weight:950;color:#334155;background:#fff;border:1px solid rgba(15,23,42,.07);border-radius:8px;padding:2px 6px;line-height:1}
    .mendel-pea{display:block;filter:drop-shadow(0 5px 8px rgba(15,23,42,.16))}
    @keyframes mendelPop{0%{opacity:0;transform:scale(.55)}100%{opacity:1;transform:scale(1)}}
    @keyframes mendelFade{0%{opacity:0;transform:translateY(6px) scale(.9)}100%{opacity:1;transform:none}}

    .mendel-panel{--op-pad-x:clamp(14px,1.55vw,20px);--op-pad-top:clamp(30px,3.2vh,40px);--op-pad-bottom:clamp(14px,1.6vh,18px);--op-gap:clamp(8px,1vh,11px);overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:none;border-radius:var(--bio-scene-panel-radius,28px);border:1px solid rgba(255,255,255,.1);background:linear-gradient(180deg,rgba(20,24,25,.98),rgba(7,10,11,.985));padding:var(--op-pad-top) var(--op-pad-x) var(--op-pad-bottom);display:flex;flex-direction:column;gap:var(--op-gap);color:#f8fafc;box-shadow:inset 0 1px 0 rgba(255,255,255,.055),0 18px 48px rgba(0,0,0,.28)}
    .mendel-panel::-webkit-scrollbar{width:0;height:0}
    .mendel-panel-top{flex:0 0 auto;min-width:0;padding:0 6px 4px}
    .mendel-panel-kicker,.mendel-section-title span{display:block;color:#34d399;font-size:10px;line-height:1.2;font-weight:950;letter-spacing:.08em}
    .mendel-panel-top h3{margin:5px 0 0;color:#fff;font-size:clamp(20px,2.6vh,24px);line-height:1.04;font-weight:950;letter-spacing:0}
    .mendel-panel-top p{margin:6px 0 0;color:rgba(226,232,240,.62);font-size:11px;line-height:1.25;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .mendel-section{flex:0 0 auto;min-height:0;border:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.025));border-radius:16px;padding:clamp(8px,.95vh,10px);display:grid;gap:clamp(6px,.78vh,8px)}
    .mendel-section-title{display:flex;align-items:center;justify-content:space-between;gap:8px;min-width:0;padding:0 1px}
    .mendel-section-title span{color:rgba(148,163,184,.9)}
    .mendel-section-title strong{min-width:0;max-width:58%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#fff;font-size:10px;line-height:1.2;font-weight:950;text-align:right}
    .mendel-mode-grid,.mendel-action-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    .mendel-panel button{min-height:var(--bio-touch-target,44px);border:1px solid rgba(255,255,255,.1);border-radius:13px;background:rgba(255,255,255,.055);color:rgba(226,232,240,.78);cursor:pointer;font-family:inherit;font-weight:950;touch-action:manipulation}
    .mendel-panel button:disabled{cursor:not-allowed;opacity:.4}
    .mendel-panel button.is-active{border-color:rgba(52,211,153,.72);background:linear-gradient(180deg,rgba(16,185,129,.2),rgba(16,185,129,.13));color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 0 16px rgba(16,185,129,.14)}
    .mendel-panel button.is-hot{border-color:rgba(103,232,249,.58);background:rgba(8,145,178,.18);color:#ecfeff}
    .mendel-mode-grid button{display:grid;place-items:center;gap:3px;padding:5px 4px}
    .mendel-mode-grid button b{font-size:14px;line-height:1}
    .mendel-mode-grid button span{font-size:10px;line-height:1;color:inherit}
    .mendel-step-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
    .mendel-step{min-height:40px!important;padding:4px;border-radius:12px!important;display:grid;place-items:center;gap:1px}
    .mendel-step b{font-size:11px;line-height:1}
    .mendel-step span{font-size:9px;line-height:1;color:inherit}
    .mendel-select-grid{display:grid;gap:8px}
    .mendel-field{display:grid;grid-template-columns:44px minmax(0,1fr);align-items:center;gap:8px;min-width:0}
    .mendel-field label{font-size:11px;font-weight:950;color:rgba(226,232,240,.66);white-space:nowrap}
    .mendel-field select{width:100%;min-width:0;height:40px;border:1px solid rgba(255,255,255,.11);border-radius:12px;background:rgba(255,255,255,.07);color:#fff;padding:0 34px 0 12px;font-family:"Microsoft YaHei","PingFang SC",Inter,system-ui,sans-serif;font-size:12px;font-weight:950;outline:none;text-overflow:ellipsis;appearance:none;background-image:linear-gradient(45deg,transparent 50%,rgba(255,255,255,.78) 50%),linear-gradient(135deg,rgba(255,255,255,.78) 50%,transparent 50%);background-position:calc(100% - 17px) 17px,calc(100% - 11px) 17px;background-size:6px 6px,6px 6px;background-repeat:no-repeat}
    .mendel-field select:disabled{opacity:.48}
    .mendel-field option{background:#0f172a;color:#f8fafc}
    .mendel-action-grid button{padding:0 8px;font-size:12px;letter-spacing:.02em}
    .mendel-stats{flex:1 1 auto;min-height:0}
    .mendel-stats.is-waiting{flex:0 0 auto}
    .mendel-stat-row{border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.035);border-radius:12px;padding:7px 9px;display:grid;gap:5px;cursor:pointer;transition:all .22s ease}
    .mendel-stat-row.is-active{border-color:rgba(103,232,249,.45);background:rgba(8,145,178,.14)}
    .mendel-stat-line{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:11px;font-weight:900;color:rgba(226,232,240,.82)}
    .mendel-stat-line strong{color:#fff;font-family:"JetBrains Mono",Consolas,monospace}
    .mendel-bar{height:5px;border-radius:999px;background:rgba(255,255,255,.07);overflow:hidden}
    .mendel-fill{height:100%;border-radius:999px;transition:width .35s ease;background:var(--bar)}
    .mendel-note{flex:1 1 auto;align-content:start}
    .mendel-note h4{margin:0;color:#67e8f9;font-size:clamp(13px,1.9vh,16px);line-height:1.18;font-weight:950}
    .mendel-note p{margin:5px 0 0;color:rgba(226,232,240,.72);font-size:clamp(10px,1.48vh,12px);line-height:1.42;font-weight:720}
    .mendel-op2,.mendel-op2 *{box-sizing:border-box}
    .mendel-op2{--op-gap:clamp(8px,1.1vh,12px);width:100%;height:100%;min-width:0;min-height:0;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:none;border-radius:var(--bio-scene-panel-radius,28px);border:1px solid rgba(255,255,255,.13);background:linear-gradient(180deg,#18201d 0%,#101816 48%,#080d0c 100%);padding:clamp(28px,4.4vh,42px) clamp(14px,1.7vw,18px) clamp(12px,1.7vh,18px);color:#f8fafc;font-family:"Microsoft YaHei","PingFang SC",Inter,system-ui,sans-serif;display:flex;flex-direction:column;gap:var(--op-gap);box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 24px 60px rgba(0,0,0,.35);touch-action:pan-y;-webkit-tap-highlight-color:transparent}
    .mendel-op2::-webkit-scrollbar{width:0;height:0}
    .mendel-op2 .mendel-panel-top{flex:0 0 auto;min-width:0;padding:0 4px clamp(5px,.75vh,8px);border-bottom:1px solid rgba(255,255,255,.08)}
    .mendel-op2 .mendel-panel-kicker{display:block;color:#34d399;font-size:10px;line-height:1;font-weight:950;letter-spacing:0}
    .mendel-op2 .mendel-panel-top h3{margin:0;color:#fff;font-size:clamp(18px,2.1vh,21px);line-height:1.05;font-weight:950;letter-spacing:0}
    .mendel-op2 .mendel-panel-top p{margin:4px 0 0;color:rgba(226,232,240,.68);font-size:11px;line-height:1.18;font-weight:850;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .mendel-op2 .mendel-section{flex:0 0 auto;min-width:0;min-height:0;border:1px solid rgba(255,255,255,.09);background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.03));border-radius:14px;padding:clamp(8px,1vh,10px);display:grid;gap:clamp(7px,.9vh,9px);box-shadow:inset 0 1px 0 rgba(255,255,255,.04)}
    .mendel-op2 .mendel-section-title{display:flex;align-items:center;justify-content:space-between;gap:10px;min-width:0;height:16px;padding:0}
    .mendel-op2 .mendel-section-title span{display:block;color:#a7b5c0;font-size:11px;line-height:1;font-weight:900;letter-spacing:0}
    .mendel-op2 .mendel-section-title strong{min-width:0;max-width:56%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#fff;font-size:11px;line-height:1;font-weight:950;text-align:right}
    .mendel-op2 .mendel-mode-grid,.mendel-op2 .mendel-action-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
    .mendel-op2 button{min-height:var(--bio-touch-target,44px);border-radius:13px;border:1px solid rgba(255,255,255,.12);background:linear-gradient(180deg,rgba(255,255,255,.085),rgba(255,255,255,.045));color:rgba(241,245,249,.84);font-family:inherit;font-weight:950;cursor:pointer;touch-action:manipulation}
    .mendel-op2 button:disabled{opacity:.48;cursor:not-allowed}
    .mendel-op2 button.is-active{border-color:rgba(52,211,153,.82);background:linear-gradient(180deg,rgba(16,185,129,.28),rgba(16,185,129,.15));color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 0 18px rgba(16,185,129,.14)}
    .mendel-op2 button.is-hot{border-color:rgba(103,232,249,.74);background:linear-gradient(180deg,rgba(8,145,178,.34),rgba(8,145,178,.18));color:#effcff}
    .mendel-op2 .mendel-mode-grid button{display:grid;place-items:center;gap:4px;padding:6px 4px}
    .mendel-op2 .mendel-mode-grid button b{font-size:15px;line-height:1}
    .mendel-op2 .mendel-mode-grid button span{font-size:10px;line-height:1;color:inherit}
    .mendel-op2 .mendel-select-grid{display:grid;gap:9px}
    .mendel-op2 .mendel-field{display:grid;grid-template-columns:46px minmax(0,1fr);align-items:center;gap:10px;min-width:0}
    .mendel-op2 .mendel-field label{font-size:12px;font-weight:900;color:#b7c5d0;white-space:nowrap}
    .mendel-op2 .mendel-field select{width:100%;height:42px;min-width:0;border:1px solid rgba(255,255,255,.13);border-radius:12px;background-color:rgba(255,255,255,.08);color:#fff;padding:0 36px 0 13px;font-family:"Microsoft YaHei","PingFang SC",Inter,system-ui,sans-serif;font-size:13px;font-weight:950;outline:none;appearance:none;text-overflow:ellipsis;background-image:linear-gradient(45deg,transparent 50%,rgba(255,255,255,.86) 50%),linear-gradient(135deg,rgba(255,255,255,.86) 50%,transparent 50%);background-position:calc(100% - 18px) 18px,calc(100% - 11px) 18px;background-size:7px 7px,7px 7px;background-repeat:no-repeat}
    .mendel-op2 .mendel-field select:disabled{opacity:.58}
    .mendel-op2 .mendel-field option{background:#111827;color:#fff}
    .mendel-op2 .mendel-step-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
    .mendel-op2 .mendel-step{min-height:42px!important;border-radius:12px!important;display:grid;place-items:center;gap:2px;padding:4px}
    .mendel-op2 .mendel-step:disabled{opacity:1;cursor:default}
    .mendel-op2 .mendel-step.is-complete{border-color:rgba(52,211,153,.38);background:rgba(16,185,129,.11);color:rgba(209,250,229,.95)}
    .mendel-op2 .mendel-step b{font-size:12px;line-height:1}
    .mendel-op2 .mendel-step span{font-size:10px;line-height:1;color:inherit}
    .mendel-op2 .mendel-action-grid button{font-size:13px;letter-spacing:0}
    .mendel-op2 .mendel-stats{flex:1 1 auto;min-height:0;overflow:hidden;align-content:start}
    .mendel-op2 .mendel-stats.is-waiting{flex:0 0 auto}
    .mendel-op2 .mendel-stat-row{border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.035);border-radius:12px;padding:8px 10px;display:grid;gap:6px;cursor:pointer;transition:all .2s ease}
    .mendel-op2 .mendel-stat-row.is-active{border-color:rgba(103,232,249,.5);background:rgba(8,145,178,.15)}
    .mendel-op2 .mendel-stat-line{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;font-weight:950;color:rgba(226,232,240,.88)}
    .mendel-op2 .mendel-stat-line small{font-size:10px;color:rgba(203,213,225,.72)}
    .mendel-op2 .mendel-stat-line strong{color:#fff;font-family:"JetBrains Mono",Consolas,monospace}
    .mendel-op2 .mendel-bar{height:5px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden}
    .mendel-op2 .mendel-fill{height:100%;border-radius:999px;background:var(--bar)}
    .mendel-op2 .mendel-note{flex:0 1 auto;min-height:0;overflow:hidden;align-content:start}
    .mendel-op2 .mendel-note h4{margin:0;color:#67e8f9;font-size:clamp(14px,1.9vh,17px);line-height:1.2;font-weight:950}
    .mendel-op2 .mendel-note p{margin:7px 0 0;color:rgba(226,232,240,.78);font-size:12px;line-height:1.45;font-weight:820}
    @media(max-height:900px){.mendel-op2{padding:24px 15px 14px;gap:8px}.mendel-op2 .mendel-panel-top h3{font-size:19px}.mendel-op2 .mendel-section{padding:8px;gap:6px}.mendel-op2 button{min-height:40px}.mendel-op2 .mendel-field select{height:40px;background-position:calc(100% - 17px) 17px,calc(100% - 10px) 17px}.mendel-op2 .mendel-step{min-height:40px!important}.mendel-op2 .mendel-note p{display:none}}
    @media(max-height:760px){.mendel-op2{padding:22px 12px 12px;gap:6px}.mendel-op2 .mendel-panel-top h3{font-size:20px}.mendel-op2 .mendel-panel-top p{display:none}.mendel-op2 .mendel-section-title{height:14px}.mendel-op2 .mendel-section{padding:7px;gap:5px}.mendel-op2 button{min-height:40px}.mendel-op2 .mendel-field select{height:40px;font-size:12px;background-position:calc(100% - 16px) 17px,calc(100% - 9px) 17px}.mendel-op2 .mendel-step{min-height:40px!important}.mendel-op2 .mendel-stats{display:none}}
    @media(max-height:560px){.mendel-op2{padding:12px 8px 8px;gap:4px}.mendel-op2 .mendel-panel-top{padding-bottom:4px}.mendel-op2 .mendel-panel-top h3{font-size:16px}.mendel-op2 .mendel-panel-kicker{font-size:8px}.mendel-op2 .mendel-section{padding:5px;border-radius:12px}.mendel-op2 .mendel-section-title span,.mendel-op2 .mendel-section-title strong{font-size:9px}.mendel-op2 .mendel-progress-section,.mendel-op2 .mendel-note{display:none}.mendel-op2 .mendel-mode-grid button span{display:none}.mendel-op2 .mendel-field{grid-template-columns:36px minmax(0,1fr);gap:5px}.mendel-op2 .mendel-field label{font-size:9px}.mendel-op2 button{min-height:40px}.mendel-op2 .mendel-field select{height:40px;font-size:10px;padding-left:8px;background-position:calc(100% - 14px) 17px,calc(100% - 8px) 17px}}
    @media(max-height:430px){.mendel-op2{padding:7px;gap:3px;border-radius:20px}.mendel-op2 .mendel-panel-top{padding:0 4px 3px}.mendel-op2 .mendel-panel-kicker,.mendel-op2 .mendel-panel-top p{display:none}.mendel-op2 .mendel-panel-top h3{margin:0;font-size:14px;line-height:1}.mendel-op2 .mendel-section{padding:4px;gap:3px;border-radius:10px}.mendel-op2 .mendel-section-title{height:10px}.mendel-op2 .mendel-section-title span,.mendel-op2 .mendel-section-title strong{font-size:8px}.mendel-op2 .mendel-mode-grid,.mendel-op2 .mendel-action-grid{gap:6px}.mendel-op2 button{min-height:40px;border-radius:10px}.mendel-op2 .mendel-mode-grid button b{font-size:13px}.mendel-op2 .mendel-select-grid{gap:4px}.mendel-op2 .mendel-field{grid-template-columns:32px minmax(0,1fr);gap:4px}.mendel-op2 .mendel-field label{font-size:8px}.mendel-op2 .mendel-field select{height:40px;font-size:10px;padding-left:7px;padding-right:24px;background-position:calc(100% - 12px) 17px,calc(100% - 7px) 17px;background-size:5px 5px,5px 5px}.mendel-op2 .mendel-action-grid button{font-size:11px}}
    @media(max-height:900px){.mendel-panel{--op-pad-top:24px;--op-gap:7px}.mendel-panel-top h3{font-size:22px}.mendel-section{padding:8px;gap:6px}.mendel-panel button{min-height:40px}.mendel-field select{height:40px;background-position:calc(100% - 15px) 17px,calc(100% - 9px) 17px}.mendel-step{min-height:40px!important}.mendel-stat-row{padding:5px 7px}.mendel-note p{display:none}}
    @media(max-height:780px){.mendel-panel{--op-pad-x:10px;--op-pad-top:20px;--op-pad-bottom:10px;--op-gap:6px}.mendel-panel-top h3{font-size:20px}.mendel-panel-top p{display:none}.mendel-section{padding:7px;gap:5px}.mendel-note h4{font-size:13px}}
    @media(max-height:620px){.mendel-panel{--op-pad-x:8px;--op-pad-top:10px;--op-pad-bottom:8px;--op-gap:5px}.mendel-panel-top h3{font-size:17px}.mendel-panel-top p,.mendel-note p{display:none}.mendel-panel button{min-height:40px}.mendel-field select{height:40px;background-position:calc(100% - 15px) 17px,calc(100% - 9px) 17px}.mendel-section{padding:6px}.mendel-bar{display:none}}
    @media(max-height:500px){.mendel-panel{--op-pad-x:7px;--op-pad-top:8px;--op-pad-bottom:7px;--op-gap:4px}.mendel-note,.mendel-stats{display:none}.mendel-panel-kicker{font-size:8px}.mendel-panel-top h3{font-size:16px}.mendel-section{padding:5px;gap:4px;border-radius:12px}.mendel-section-title span{font-size:9px}.mendel-section-title strong{max-width:50%;font-size:9px}.mendel-step-grid{display:none}.mendel-panel button{min-height:40px}.mendel-mode-grid button{min-height:40px}.mendel-field{grid-template-columns:36px minmax(0,1fr);gap:5px}.mendel-field label{font-size:9px}.mendel-field select{height:40px;font-size:10px;padding-left:8px;background-position:calc(100% - 14px) 17px,calc(100% - 8px) 17px}.mendel-stat-row{padding:4px 6px}.mendel-stat-line{font-size:10px}.mendel-board-wrap{padding:8px 10px}.mendel-board.is-double{width:min(94%,620px);max-height:94%}.mendel-board.is-double .mendel-gt{display:none}.mendel-board.is-double .mendel-child{gap:0}.mendel-board.is-double .mendel-pea{max-width:31px;max-height:31px}}
    .mendel-op3,.mendel-op3 *{box-sizing:border-box}
    .mendel-op3{--op3-line:rgba(255,255,255,.11);--op3-soft:rgba(255,255,255,.055);--op3-strong:rgba(16,185,129,.22);width:100%;height:100%;min-width:0;min-height:0;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;border-radius:var(--bio-scene-panel-radius,26px);border:1px solid var(--op3-line);background:linear-gradient(180deg,rgba(16,24,22,.98),rgba(6,12,11,.99));color:#f8fafc;font-family:"Microsoft YaHei","PingFang SC",Inter,system-ui,sans-serif;padding:clamp(14px,2.1vh,22px);display:grid;grid-template-rows:auto auto auto auto auto minmax(0,1fr);gap:clamp(8px,1.15vh,12px);box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 22px 58px rgba(0,0,0,.32);touch-action:pan-y;-webkit-tap-highlight-color:transparent}
    .mendel-op3::-webkit-scrollbar{width:0;height:0}
    .mendel-op3-head{min-width:0;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px;padding:0 2px 2px}
    .mendel-op3-title{min-width:0}
    .mendel-op3-title h3{margin:0;color:#fff;font-size:clamp(20px,2.45vh,25px);line-height:1.04;font-weight:950;letter-spacing:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .mendel-op3-title span{display:block;margin-top:4px;color:rgba(226,232,240,.7);font-size:11px;line-height:1;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .mendel-op3-badge{height:42px;min-width:76px;border:1px solid rgba(103,232,249,.24);border-radius:14px;background:rgba(8,145,178,.11);display:grid;place-items:center;padding:4px 10px;text-align:center}
    .mendel-op3-badge strong{font-family:"JetBrains Mono",Consolas,monospace;color:#67e8f9;font-size:14px;line-height:1;font-weight:950}
    .mendel-op3-badge span{margin-top:3px;color:rgba(236,254,255,.78);font-size:10px;line-height:1;font-weight:900}
    .mendel-op3-group{min-width:0;min-height:0;border-top:1px solid var(--op3-line);padding-top:clamp(7px,.9vh,10px);display:grid;gap:clamp(6px,.8vh,9px)}
    .mendel-op3-row-title{height:16px;min-width:0;display:flex;align-items:center;justify-content:space-between;gap:10px;color:#bfdbfe;font-size:11px;line-height:1;font-weight:950}
    .mendel-op3-row-title strong{min-width:0;max-width:58%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#fff;text-align:right}
    .mendel-op3-mode-grid,.mendel-op3-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
    .mendel-op3 button{min-height:var(--bio-touch-target,44px);border:1px solid rgba(255,255,255,.12);border-radius:14px;background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.045));color:rgba(241,245,249,.84);font-family:inherit;font-weight:950;cursor:pointer;touch-action:manipulation}
    .mendel-op3 button:disabled{cursor:not-allowed;opacity:.6}
    .mendel-op3 button.is-active{border-color:rgba(52,211,153,.88);background:linear-gradient(180deg,rgba(16,185,129,.3),rgba(16,185,129,.15));color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 0 18px rgba(16,185,129,.14)}
    .mendel-op3 button.is-hot{border-color:rgba(103,232,249,.76);background:linear-gradient(180deg,rgba(8,145,178,.34),rgba(8,145,178,.17));color:#effcff}
    .mendel-op3-mode-grid button{display:grid;place-items:center;gap:3px;padding:6px}
    .mendel-op3-mode-grid button b{font-size:16px;line-height:1}
    .mendel-op3-mode-grid button span{font-size:10px;line-height:1;color:inherit}
    .mendel-op3-parent-grid{display:grid;gap:8px}
    .mendel-op3-field{min-width:0;display:grid;grid-template-columns:48px minmax(0,1fr);align-items:center;gap:9px}
    .mendel-op3-field label{color:#bfdbfe;font-size:12px;line-height:1;font-weight:950;white-space:nowrap}
    .mendel-op3-field select{width:100%;height:42px;min-width:0;border:1px solid rgba(255,255,255,.13);border-radius:14px;background-color:rgba(255,255,255,.08);color:#fff;padding:0 36px 0 13px;font-family:"Microsoft YaHei","PingFang SC",Inter,system-ui,sans-serif;font-size:13px;font-weight:950;outline:none;appearance:none;text-overflow:ellipsis;background-image:linear-gradient(45deg,transparent 50%,rgba(255,255,255,.86) 50%),linear-gradient(135deg,rgba(255,255,255,.86) 50%,transparent 50%);background-position:calc(100% - 18px) 18px,calc(100% - 11px) 18px;background-size:7px 7px,7px 7px;background-repeat:no-repeat}
    .mendel-op3-field option{background:#111827;color:#fff}
    .mendel-op3-field select:disabled{opacity:.55}
    .mendel-op3-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
    .mendel-op3 .mendel-step{min-height:39px!important;border-radius:13px!important;padding:4px;display:grid;place-items:center;gap:2px}
    .mendel-op3 .mendel-step:disabled{opacity:1;cursor:default}
    .mendel-op3 .mendel-step.is-complete{border-color:rgba(52,211,153,.36);background:rgba(16,185,129,.1);color:rgba(209,250,229,.96)}
    .mendel-op3 .mendel-step b{font-family:"JetBrains Mono",Consolas,monospace;font-size:13px;line-height:1}
    .mendel-op3 .mendel-step span{font-size:10px;line-height:1;color:inherit}
    .mendel-op3-actions button{font-size:14px}
    .mendel-op3-bottom{min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr);gap:clamp(8px,1vh,11px);overflow:hidden}
    .mendel-op3 .mendel-stats{min-height:0;overflow:hidden}
    .mendel-op3 .mendel-stats.is-waiting{min-height:auto}
    .mendel-op3 .mendel-stat-row{border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);border-radius:13px;padding:8px 10px;display:grid;gap:6px;cursor:pointer;transition:all .2s ease}
    .mendel-op3 .mendel-stat-row.is-active{border-color:rgba(103,232,249,.5);background:rgba(8,145,178,.15)}
    .mendel-op3 .mendel-stat-line{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;font-weight:950;color:rgba(226,232,240,.9)}
    .mendel-op3 .mendel-stat-line small{font-size:10px;color:rgba(203,213,225,.72)}
    .mendel-op3 .mendel-stat-line strong{color:#fff;font-family:"JetBrains Mono",Consolas,monospace}
    .mendel-op3 .mendel-bar{height:5px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden}
    .mendel-op3 .mendel-fill{height:100%;border-radius:999px;background:var(--bar)}
    .mendel-op3-law{min-height:0;overflow:hidden;border-top:1px solid var(--op3-line);padding-top:clamp(7px,.9vh,10px)}
    .mendel-op3-law h4{margin:0;color:#67e8f9;font-size:clamp(15px,1.8vh,18px);line-height:1.2;font-weight:950}
    .mendel-op3-law p{margin:7px 0 0;color:rgba(226,232,240,.78);font-size:12px;line-height:1.45;font-weight:820}
    @media(max-height:900px){.mendel-op3{padding:14px;gap:8px}.mendel-op3-title h3{font-size:21px}.mendel-op3-title span{display:none}.mendel-op3-badge{height:36px}.mendel-op3-group{padding-top:7px;gap:6px}.mendel-op3 button{min-height:40px}.mendel-op3-field select{height:40px;background-position:calc(100% - 17px) 17px,calc(100% - 10px) 17px}.mendel-op3 .mendel-step{min-height:40px!important}.mendel-op3-law p{display:none}}
    @media(max-height:760px){.mendel-op3{padding:10px;gap:6px;border-radius:22px}.mendel-op3-title h3{font-size:18px}.mendel-op3-badge{height:32px;min-width:64px}.mendel-op3-badge span{display:none}.mendel-op3-row-title{height:12px;font-size:9px}.mendel-op3-group{padding-top:5px;gap:5px}.mendel-op3 button{min-height:40px}.mendel-op3-mode-grid button span{display:none}.mendel-op3-field{grid-template-columns:38px minmax(0,1fr);gap:6px}.mendel-op3-field label{font-size:10px}.mendel-op3-field select{height:40px;font-size:11px;background-position:calc(100% - 15px) 17px,calc(100% - 9px) 17px}.mendel-op3 .mendel-step{min-height:40px!important}.mendel-op3-law p{display:none}.mendel-op3 .mendel-stat-row{padding:6px 8px}}
    @media(max-height:520px){.mendel-op3{grid-template-rows:auto auto auto auto;gap:4px;padding:7px}.mendel-op3-head{gap:6px}.mendel-op3-title h3{font-size:15px}.mendel-op3-badge{height:26px;min-width:48px;border-radius:10px}.mendel-op3-badge strong{font-size:11px}.mendel-op3-progress,.mendel-op3-bottom{display:none}.mendel-op3-group{padding-top:4px}.mendel-op3-row-title{display:none}.mendel-op3-mode-grid,.mendel-op3-actions{gap:6px}.mendel-op3 button{min-height:40px;border-radius:10px;font-size:11px}.mendel-op3-mode-grid button b{font-size:13px}.mendel-op3-parent-grid{gap:4px}.mendel-op3-field{grid-template-columns:30px minmax(0,1fr);gap:4px}.mendel-op3-field label{font-size:8px}.mendel-op3-field select{height:40px;font-size:10px;padding-left:7px;padding-right:24px;background-position:calc(100% - 12px) 17px,calc(100% - 7px) 17px;background-size:5px 5px,5px 5px}}
    .mendel-op4,.mendel-op4 *{box-sizing:border-box}
    .mendel-op4{width:100%;height:100%;min-width:0;min-height:0;overflow-x:hidden;overflow-y:auto;scrollbar-width:none;background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;padding:18px;display:flex;flex-direction:column;gap:14px;color:#e2e8f0;font-family:"Microsoft YaHei","PingFang SC",Inter,system-ui,sans-serif;touch-action:pan-y;-webkit-tap-highlight-color:transparent}
    .mendel-op4::-webkit-scrollbar{display:none}
    .mendel-op4-card{min-width:0;border-radius:18px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.085);padding:16px;box-shadow:inset 0 1px 0 rgba(255,255,255,.035);flex:0 0 auto}
    .mendel-op4-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}
    .mendel-op4-eyebrow{font-size:10px;line-height:1;font-weight:950;letter-spacing:.16em;text-transform:uppercase;color:rgba(134,239,172,.78);margin-bottom:9px}
    .mendel-op4-title h3{margin:0;color:#fff;font-size:22px;line-height:1.08;font-weight:950;letter-spacing:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .mendel-op4-title p{margin:8px 0 0;color:rgba(226,232,240,.72);font-size:12px;line-height:1.45;font-weight:760}
    .mendel-op4-badge{flex:0 0 auto;min-width:72px;border-radius:16px;border:1px solid rgba(103,232,249,.28);background:rgba(8,145,178,.12);padding:8px 10px;text-align:center;color:#ecfeff}
    .mendel-op4-badge strong{display:block;font-family:"JetBrains Mono",Consolas,monospace;font-size:15px;line-height:1;font-weight:950;color:#67e8f9}
    .mendel-op4-badge span{display:block;margin-top:5px;font-size:10px;line-height:1;font-weight:900;color:rgba(236,254,255,.78)}
    .mendel-op4-chip-row{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}
    .mendel-op4-chip{display:inline-flex;align-items:center;height:24px;border-radius:999px;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.085);padding:0 10px;color:rgba(226,232,240,.84);font-size:11px;font-weight:850;white-space:nowrap}
    .mendel-op4-label{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;color:rgba(226,232,240,.48);font-size:10px;line-height:1;font-weight:950;letter-spacing:.14em;text-transform:uppercase}
    .mendel-op4-label strong{min-width:0;max-width:58%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#fff;text-align:right;letter-spacing:0;text-transform:none;font-size:12px}
    .mendel-op4-mode-grid,.mendel-op4-action-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
    .mendel-op4 button{min-height:var(--bio-touch-target,44px);border:1px solid rgba(255,255,255,.09);border-radius:12px;background:rgba(255,255,255,.045);color:#e2e8f0;font-family:inherit;font-weight:900;cursor:pointer;transition:transform .18s ease,border-color .18s ease,background .18s ease;touch-action:manipulation}
    .mendel-op4 button:hover:not(:disabled){transform:translateY(-1px);border-color:rgba(52,211,153,.34)}
    .mendel-op4 button:disabled{cursor:not-allowed;opacity:.48}
    .mendel-op4 button.is-active{border-color:rgba(52,211,153,.78);background:linear-gradient(135deg,rgba(16,185,129,.34),rgba(5,150,105,.22));color:#f0fdf4}
    .mendel-op4 button.is-hot{border-color:rgba(103,232,249,.65);background:rgba(8,145,178,.18);color:#ecfeff}
    .mendel-op4-mode-grid button{display:grid;place-items:center;gap:3px;padding:7px 8px}
    .mendel-op4-mode-grid button b{font-size:16px;line-height:1}
    .mendel-op4-mode-grid button span{font-size:10px;line-height:1;color:inherit}
    .mendel-op4-parent-grid{display:grid;gap:10px}
    .mendel-op4-field{display:grid;grid-template-columns:52px minmax(0,1fr);align-items:center;gap:10px;min-width:0}
    .mendel-op4-field label{font-size:12px;line-height:1;font-weight:900;color:#bfdbfe;white-space:nowrap}
    .mendel-op4-field select{width:100%;height:42px;min-width:0;appearance:none;border:1px solid rgba(255,255,255,.1);border-radius:12px;background:rgba(255,255,255,.05);color:#fff;padding:0 36px 0 13px;font-family:"Microsoft YaHei","PingFang SC",Inter,system-ui,sans-serif;font-size:13px;font-weight:900;outline:none;text-overflow:ellipsis;background-image:linear-gradient(45deg,transparent 50%,rgba(255,255,255,.7) 50%),linear-gradient(135deg,rgba(255,255,255,.7) 50%,transparent 50%);background-position:calc(100% - 18px) 18px,calc(100% - 11px) 18px;background-size:7px 7px,7px 7px;background-repeat:no-repeat}
    .mendel-op4-field select:hover{border-color:rgba(255,255,255,.2);background-color:rgba(255,255,255,.075)}
    .mendel-op4-field select:disabled{opacity:.55}
    .mendel-op4-field option{background:#0f172a;color:#fff}
    .mendel-op4-step-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:10px}
    .mendel-op4 .mendel-step{min-height:40px!important;border-radius:12px!important;padding:5px;display:grid;place-items:center;gap:2px}
    .mendel-op4 .mendel-step:disabled{opacity:1;cursor:default}
    .mendel-op4 .mendel-step.is-complete{border-color:rgba(52,211,153,.32);background:rgba(16,185,129,.1)}
    .mendel-op4 .mendel-step b{font-family:"JetBrains Mono",Consolas,monospace;font-size:13px;line-height:1}
    .mendel-op4 .mendel-step span{font-size:10px;line-height:1;color:inherit}
    .mendel-op4-action-grid button{font-size:14px}
    .mendel-op4-readout{flex:1 1 auto;min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr);gap:12px;overflow:hidden}
    .mendel-op4 .mendel-stats{min-height:0;overflow:hidden}
    .mendel-op4 .mendel-stat-row{border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.03);border-radius:12px;padding:8px 10px;display:grid;gap:6px;cursor:pointer;transition:all .2s ease}
    .mendel-op4 .mendel-stat-row.is-active{border-color:rgba(103,232,249,.48);background:rgba(8,145,178,.14)}
    .mendel-op4 .mendel-stat-line{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;font-weight:900;color:rgba(226,232,240,.86)}
    .mendel-op4 .mendel-stat-line small{font-size:10px;color:rgba(203,213,225,.68)}
    .mendel-op4 .mendel-stat-line strong{color:#fff;font-family:"JetBrains Mono",Consolas,monospace}
    .mendel-op4 .mendel-bar{height:5px;border-radius:999px;background:rgba(255,255,255,.075);overflow:hidden}
    .mendel-op4 .mendel-fill{height:100%;border-radius:999px;background:var(--bar)}
    .mendel-op4-law{min-height:0;overflow:hidden}
    .mendel-op4-law h4{margin:0;color:#67e8f9;font-size:18px;line-height:1.18;font-weight:950}
    .mendel-op4-law p{margin:7px 0 0;color:rgba(226,232,240,.78);font-size:12px;line-height:1.5;font-weight:760}
    @media(max-height:900px){.mendel-op4{padding:14px;gap:10px}.mendel-op4-card{padding:12px;border-radius:16px}.mendel-op4-eyebrow{margin-bottom:7px}.mendel-op4-title h3{font-size:20px}.mendel-op4-title p{display:none}.mendel-op4-badge{padding:7px 9px}.mendel-op4-chip-row{margin-top:9px}.mendel-op4 button{min-height:40px}.mendel-op4-field select{height:40px;background-position:calc(100% - 17px) 17px,calc(100% - 10px) 17px}.mendel-op4 .mendel-step{min-height:40px!important}.mendel-op4-law p{display:none}}
    @media(max-height:740px){.mendel-op4{padding:10px;gap:8px}.mendel-op4-card{padding:10px;border-radius:15px}.mendel-op4-chip-row,.mendel-op4-readout .mendel-op4-label{display:none}.mendel-op4-title h3{font-size:18px}.mendel-op4-eyebrow{font-size:9px}.mendel-op4-badge{min-width:58px}.mendel-op4-badge span{display:none}.mendel-op4-label{margin-bottom:7px}.mendel-op4 button{min-height:40px}.mendel-op4-mode-grid button span{display:none}.mendel-op4-field{grid-template-columns:38px minmax(0,1fr);gap:6px}.mendel-op4-field label{font-size:10px}.mendel-op4-field select{height:40px;font-size:11px;background-position:calc(100% - 15px) 17px,calc(100% - 9px) 17px}.mendel-op4 .mendel-step{min-height:40px!important}.mendel-op4-readout{display:block}.mendel-op4-law{margin-top:8px}.mendel-op4 .mendel-stat-row{padding:6px 8px}}
    @media(max-height:520px){.mendel-op4{padding:7px;gap:6px}.mendel-op4-card{padding:8px;border-radius:13px}.mendel-op4-eyebrow,.mendel-op4-chip-row,.mendel-op4-readout,.mendel-op4-progress .mendel-op4-label,.mendel-op4-step-grid{display:none}.mendel-op4-title h3{font-size:15px}.mendel-op4-badge{min-width:46px;padding:5px 7px;border-radius:10px}.mendel-op4-badge strong{font-size:11px}.mendel-op4-label{display:none}.mendel-op4-mode-grid,.mendel-op4-action-grid{gap:6px}.mendel-op4 button{min-height:40px;border-radius:10px;font-size:11px}.mendel-op4-mode-grid button b{font-size:13px}.mendel-op4-parent-grid{gap:4px}.mendel-op4-field{grid-template-columns:30px minmax(0,1fr);gap:4px}.mendel-op4-field label{font-size:8px}.mendel-op4-field select{height:40px;font-size:10px;padding-left:7px;padding-right:24px;background-position:calc(100% - 12px) 17px,calc(100% - 7px) 17px;background-size:5px 5px,5px 5px}}
    @media(max-width:900px){.mendel-stage{padding:clamp(10px,2.4vh,14px) clamp(16px,3.6vw,24px)}.mendel-visual{gap:8px}.mendel-mode-grid button span{display:none}.mendel-parents{gap:8px}.mendel-parent{height:52px;border-radius:15px;padding:5px 8px}.mendel-cross{width:42px;height:42px;border-radius:14px;font-size:28px}.mendel-pea{max-width:32px;max-height:32px}.mendel-empty .hint{font-size:12px}.mendel-board-wrap{padding:10px 12px;border-radius:18px}.mendel-board{gap:4px;grid-template-columns:34px repeat(var(--cols),minmax(0,1fr));grid-template-rows:28px repeat(var(--rows),minmax(0,1fr))}.mendel-board.is-double{width:min(96%,640px);max-height:96%}.mendel-cell{border-radius:10px}.mendel-gt{font-size:8px;padding:1px 4px}.mendel-gamete{font-size:10px}.mendel-parent strong{font-size:10px}.mendel-parent b{font-size:16px}}
  `;
  }

  let peaSeq = 0;
  function peaSvg(genotype, size, className) {
    const isYellow = genotype.includes("Y");
    const isRound = !genotype.includes("rr");
    const fill = isYellow ? "#fde047" : "#86efac";
    const stroke = isYellow ? "#eab308" : "#22c55e";
    const gradId = `mendel-pea-grad-${peaSeq++}`;
    const wrinkledPath = "M 50 15 C 70 5, 85 25, 80 45 C 95 60, 85 85, 65 85 C 45 95, 20 85, 10 65 C -5 45, 10 20, 30 15 C 40 5, 50 15, 50 15 Z";
    const shape = isRound
      ? `<circle cx="50" cy="50" r="45" fill="url(#${gradId})" stroke="${stroke}" stroke-width="4"></circle>`
      : `<path d="${wrinkledPath}" fill="url(#${gradId})" stroke="${stroke}" stroke-width="4" stroke-linejoin="round"></path>`;
    return `
      <svg class="mendel-pea ${className || ""}" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <radialGradient id="${gradId}" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity=".9"></stop>
            <stop offset="40%" stop-color="${fill}"></stop>
            <stop offset="100%" stop-color="${stroke}"></stop>
          </radialGradient>
        </defs>
        ${shape}
        <ellipse cx="35" cy="30" rx="15" ry="8" fill="#ffffff" opacity=".7" transform="rotate(-30 35 30)"></ellipse>
      </svg>
    `;
  }

  function renderParents(state, result) {
    return `
      <div class="mendel-parents">
        <div class="mendel-parent">
          ${peaSvg(result.p1, 58)}
          <div><strong>♀ 母本 P</strong><b>${esc(result.p1)}</b></div>
        </div>
        <div class="mendel-cross">×</div>
        <div class="mendel-parent">
          <div><strong>♂ 父本 P</strong><b>${esc(result.p2)}</b></div>
          ${peaSvg(result.p2, 58)}
        </div>
      </div>
    `;
  }

  function renderEmpty(state, result) {
    const meta = MODE_META[state.mode];
    const gametes = Array.from(new Set(result.gametes1.concat(result.gametes2)));
    return `
      <div class="mendel-empty">
        <div class="law">${esc(meta.law)}</div>
        <div class="hint">${esc(meta.concept)}</div>
        <div class="mendel-meiosis">
          ${gametes.map((g, index) => `<div class="mendel-chromosome" style="animation-delay:${index * 80}ms">${esc(g)}</div>`).join("")}
        </div>
      </div>
    `;
  }

  function renderBoard(state, result) {
    const isMono = state.mode === "mono";
    const stage = isMono ? state.mono.step : state.di.step;
    const activeCell = state.activeCell;
    const activePheno = state.activePheno;
    const ratio = `${result.cols + 1}/${result.rows + 1}`;
    const boardClass = isMono ? "is-single" : "is-double";
    let html = `
      <div class="mendel-board ${boardClass}" style="--cols:${result.cols};--rows:${result.rows};--ratio:${ratio}">
        <div class="mendel-corner">配子</div>
        ${result.gametes1.map((g, c) => {
          const active = activeCell && activeCell.col === c;
          return `<div class="mendel-gamete ${active ? "is-active" : ""}" data-gamete-col="${c}">${esc(g)}</div>`;
        }).join("")}
        ${result.gametes2.map((g, r) => {
          const active = activeCell && activeCell.row === r;
          const rowCells = result.gametes1.map((_, c) => {
            const cell = result.cells.find((item) => item.row === r && item.col === c);
            const byCell = activeCell && activeCell.row === r && activeCell.col === c;
            const byPheno = activePheno && activePheno === cell.phenotype;
            const activeCls = byCell || byPheno ? "is-active" : "";
            const dimCls = activePheno && !byPheno ? "is-dim" : "";
            const content = stage < 2
              ? `<div class="mendel-cell-pending">?</div>`
              : `<div class="mendel-child" style="animation-delay:${(r * result.cols + c) * 45}ms">${peaSvg(cell.genotype, isMono ? 48 : 34)}<div class="mendel-gt">${esc(cell.genotype)}</div></div>`;
            return `<div class="mendel-cell ${activeCls} ${dimCls}" data-row="${r}" data-col="${c}" data-pheno="${esc(cell.phenotype)}">${content}</div>`;
          }).join("");
          return `<div class="mendel-gamete is-row ${active ? "is-active" : ""}" data-gamete-row="${r}">${esc(g)}</div>${rowCells}`;
        }).join("")}
      </div>
    `;
    return html;
  }

  function renderStage(container, state) {
    peaSeq = 0;
    const result = calcResult(state);
    const meta = MODE_META[state.mode];
    const step = state.mode === "mono" ? state.mono.step : state.di.step;
    container.className = `mendel-stage ${state.mode === "di" ? "is-di" : "is-mono"}`;
    container.style.setProperty("--accent", meta.accent);
    container.innerHTML = `
      <div class="mendel-visual">
        ${renderParents(state, result)}
        <div class="mendel-lab">
          <div class="mendel-board-wrap">
            ${step === 0 ? renderEmpty(state, result) : renderBoard(state, result)}
          </div>
        </div>
      </div>
    `;
    return result;
  }

  function optionHtml(options, value) {
    return options.map((item) => `<option value="${esc(item.value)}" ${item.value === value ? "selected" : ""}>${esc(item.label)}</option>`).join("");
  }

  function statRows(state, result) {
    const entries = Object.keys(result.phen).map((key) => [key, result.phen[key]]).filter((entry) => entry[1] > 0 || state.mode === "di");
    return entries.map(([key, count]) => {
      const info = phenotypeInfo(key);
      const percent = result.total ? Math.round((count / result.total) * 100) : 0;
      const active = state.activePheno === key;
      return `
        <div class="mendel-stat-row ${active ? "is-active" : ""}" data-pheno-filter="${esc(key)}">
          <div class="mendel-stat-line">
            <span>${esc(info.name)} <small>${esc(info.genotype)}</small></span>
            <strong>${count}/${result.total}</strong>
          </div>
          <div class="mendel-bar"><div class="mendel-fill" style="--bar:${info.color};width:${percent}%"></div></div>
        </div>
      `;
    }).join("");
  }

  function renderPanel(panel, state, result) {
    if (!panel) return;
    const isMono = state.mode === "mono";
    const meta = MODE_META[state.mode];
    const step = isMono ? state.mono.step : state.di.step;
    const parentState = isMono ? state.mono : state.di;
    const options = isMono ? SINGLE_OPTIONS : DOUBLE_OPTIONS;
    const lockParents = step > 0;
    const stepStatus = step === 0 ? "准备亲本" : step === 1 ? "已产生配子" : "子代统计";
    panel.className = "mendel-op4";
    panel.setAttribute("data-panel-version", "mendel-op4-20260428");
    panel.innerHTML = `
      <section class="mendel-op4-card">
        <div class="mendel-op4-head">
          <div class="mendel-op4-title">
            <div class="mendel-op4-eyebrow">遗传规律模拟沙盒</div>
            <h3>${esc(meta.title)}</h3>
            <p>${esc(meta.subtitle)} · ${esc(meta.law.replace("孟德尔", ""))}</p>
          </div>
          <div class="mendel-op4-badge"><strong>${step + 1}/3</strong><span>${esc(stepStatus)}</span></div>
        </div>
        <div class="mendel-op4-chip-row">
          <span class="mendel-op4-chip">${esc(meta.subtitle)}</span>
          <span class="mendel-op4-chip">${esc(meta.law)}</span>
        </div>
        <div class="mendel-op4-label"><span>模式</span><strong>${esc(meta.subtitle)}</strong></div>
        <div class="mendel-op4-mode-grid">
          <button type="button" data-action="mode" data-mode="mono" class="${isMono ? "is-active" : ""}"><b>分离</b><span>一对性状</span></button>
          <button type="button" data-action="mode" data-mode="di" class="${!isMono ? "is-active" : ""}"><b>组合</b><span>两对性状</span></button>
        </div>
      </section>

      <section class="mendel-op4-card">
        <div class="mendel-op4-label"><span>亲本设置</span><strong>${lockParents ? "已锁定" : "可修改"}</strong></div>
        <div class="mendel-op4-parent-grid">
          <div class="mendel-op4-field"><label>♀ 母本</label><select data-action="parent" data-parent="p1" ${lockParents ? "disabled" : ""}>${optionHtml(options, parentState.p1)}</select></div>
          <div class="mendel-op4-field"><label>♂ 父本</label><select data-action="parent" data-parent="p2" ${lockParents ? "disabled" : ""}>${optionHtml(options, parentState.p2)}</select></div>
        </div>
      </section>

      <section class="mendel-op4-card mendel-op4-progress">
        <div class="mendel-op4-label"><span>步骤</span><strong>${esc(stepStatus)}</strong></div>
        <div class="mendel-op4-step-grid">
          ${meta.steps.map((item, index) => `<button type="button" class="mendel-step ${index === step ? "is-active" : ""} ${index < step ? "is-complete" : ""}" disabled><b>${index + 1}</b><span>${esc(item)}</span></button>`).join("")}
        </div>
        <div class="mendel-op4-action-grid">
          <button type="button" data-action="reset">重置</button>
          <button type="button" data-action="next" class="is-hot" ${step >= 2 ? "disabled" : ""}>${step >= 2 ? "已完成" : step === 0 ? "产生配子" : "棋盘组合"}</button>
        </div>
      </section>

      <section class="mendel-op4-card mendel-op4-readout">
        <div class="mendel-stats ${step >= 2 ? "" : "is-waiting"}">
          <div class="mendel-op4-label"><span>表现型统计</span><strong>${step >= 2 ? esc(ratioLabel(state, result)) : "等待组合"}</strong></div>
          ${step >= 2 ? statRows(state, result) : `<div class="mendel-stat-row"><div class="mendel-stat-line"><span>完成棋盘组合后显示比例</span><strong>${result.total} 格</strong></div></div>`}
        </div>

        <div class="mendel-op4-law">
          <div class="mendel-op4-label"><span>判读线索</span><strong>${esc(meta.title)}</strong></div>
          <h4>${step >= 2 ? esc(ratioLabel(state, result)) : esc(meta.law)}</h4>
          <p>${step >= 2 ? esc(ratioNote(state)) : esc(meta.concept)}</p>
        </div>
      </section>
    `;
  }

  function createState() {
    return {
      mode: "mono",
      mono: { p1: "Yy", p2: "Yy", step: 0 },
      di: { p1: "YyRr", p2: "YyRr", step: 0 },
      activeCell: null,
      activePheno: null
    };
  }

  return {
    mount(container, context = {}) {
      if (!container) return;
      const style = document.createElement("style");
      style.textContent = sceneCss();
      document.head.appendChild(style);

      const state = createState();
      const panel = context.externalPanel || null;
      let result = null;

      function render() {
        result = renderStage(container, state);
        renderPanel(panel, state, result);
      }

      function resetHighlight() {
        state.activeCell = null;
        state.activePheno = null;
      }

      function currentModeState() {
        return state.mode === "mono" ? state.mono : state.di;
      }

      function updateStageHighlight() {
        container.querySelectorAll(".mendel-cell,.mendel-gamete").forEach((item) => {
          item.classList.remove("is-active", "is-dim");
        });
        if (state.activeCell) {
          const row = String(state.activeCell.row);
          const col = String(state.activeCell.col);
          container.querySelector(`.mendel-cell[data-row="${row}"][data-col="${col}"]`)?.classList.add("is-active");
          container.querySelector(`.mendel-gamete[data-gamete-row="${row}"]`)?.classList.add("is-active");
          container.querySelector(`.mendel-gamete[data-gamete-col="${col}"]`)?.classList.add("is-active");
          return;
        }
        if (state.activePheno) {
          container.querySelectorAll(".mendel-cell").forEach((cell) => {
            if (cell.getAttribute("data-pheno") === state.activePheno) {
              cell.classList.add("is-active");
            } else {
              cell.classList.add("is-dim");
            }
          });
        }
      }

      function updatePanelHighlight() {
        if (!panel) return;
        panel.querySelectorAll(".mendel-stat-row").forEach((item) => {
          item.classList.toggle("is-active", item.getAttribute("data-pheno-filter") === state.activePheno);
        });
      }

      function onStageMove(event) {
        const cell = event.target.closest && event.target.closest(".mendel-cell");
        if (!cell || !container.contains(cell)) {
          if (state.activeCell) {
            state.activeCell = null;
            updateStageHighlight();
          }
          return;
        }
        const next = {
          row: Number(cell.getAttribute("data-row")),
          col: Number(cell.getAttribute("data-col"))
        };
        if (state.activeCell && state.activeCell.row === next.row && state.activeCell.col === next.col && !state.activePheno) return;
        state.activeCell = next;
        state.activePheno = null;
        updateStageHighlight();
        updatePanelHighlight();
      }

      function onStageLeave() {
        if (state.activeCell) {
          state.activeCell = null;
          updateStageHighlight();
        }
      }

      function onStageClick(event) {
        const cell = event.target.closest && event.target.closest(".mendel-cell");
        if (!cell || !container.contains(cell)) return;
        const next = {
          row: Number(cell.getAttribute("data-row")),
          col: Number(cell.getAttribute("data-col"))
        };
        state.activeCell = state.activeCell && state.activeCell.row === next.row && state.activeCell.col === next.col ? null : next;
        state.activePheno = null;
        updateStageHighlight();
        updatePanelHighlight();
      }

      function onPanelInput(event) {
        const target = event.target;
        if (!target || !target.getAttribute) return;
        const action = target.getAttribute("data-action");
        if (action !== "parent") return;
        const parent = target.getAttribute("data-parent");
        const modeState = currentModeState();
        if (modeState.step > 0 || !parent) return;
        modeState[parent] = target.value;
        resetHighlight();
        render();
      }

      function onPanelClick(event) {
        const control = event.target.closest && event.target.closest("[data-action],[data-pheno-filter]");
        if (!control || !panel || !panel.contains(control)) return;

        const pheno = control.getAttribute("data-pheno-filter");
        if (pheno) {
          state.activePheno = state.activePheno === pheno ? null : pheno;
          state.activeCell = null;
          render();
          return;
        }

        const action = control.getAttribute("data-action");
        const modeState = currentModeState();
        if (action === "mode") {
          const nextMode = control.getAttribute("data-mode");
          if (nextMode && nextMode !== state.mode) {
            state.mode = nextMode;
            resetHighlight();
            render();
          }
          return;
        }
        if (action === "reset") {
          modeState.step = 0;
          resetHighlight();
          render();
          return;
        }
        if (action === "next" && modeState.step < 2) {
          modeState.step += 1;
          resetHighlight();
          render();
        }
      }

      container.addEventListener("mouseover", onStageMove);
      container.addEventListener("mouseleave", onStageLeave);
      container.addEventListener("click", onStageClick);
      if (panel) {
        panel.addEventListener("click", onPanelClick);
        panel.addEventListener("change", onPanelInput);
      }

      const ro = typeof ResizeObserver === "function" ? new ResizeObserver(render) : null;
      if (ro) ro.observe(container);

      container.__mendelCleanup = function () {
        container.removeEventListener("mouseover", onStageMove);
        container.removeEventListener("mouseleave", onStageLeave);
        container.removeEventListener("click", onStageClick);
        if (panel) {
          panel.removeEventListener("click", onPanelClick);
          panel.removeEventListener("change", onPanelInput);
          panel.innerHTML = "";
          panel.className = "";
        }
        if (ro) ro.disconnect();
        if (style.parentNode) style.parentNode.removeChild(style);
      };

      render();
    },
    unmount(container) {
      if (container && container.__mendelCleanup) {
        container.__mendelCleanup();
        delete container.__mendelCleanup;
      }
      if (container) container.innerHTML = "";
    }
  };
})();
