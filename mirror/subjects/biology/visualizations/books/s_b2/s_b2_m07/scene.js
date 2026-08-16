window.BIO_VISUAL_SCENES = window.BIO_VISUAL_SCENES || {};
window.BIO_VISUAL_SCENES["s_b2_m07"] = (function () {
  "use strict";

  const BASE_COLORS = {
    A: { main: "#ef4444", dark: "#7f1d1d", glow: "#fca5a5", pair: "T" },
    T: { main: "#f59e0b", dark: "#78350f", glow: "#fde047", pair: "A" },
    C: { main: "#0ea5e9", dark: "#0c4a6e", glow: "#7dd3fc", pair: "G" },
    G: { main: "#10b981", dark: "#064e3b", glow: "#86efac", pair: "C" }
  };

  const MODES = {
    overview: {
      label: "遗传病总览",
      brief: "常见遗传病图谱",
      maxStep: 3,
      focus: "把高中常见遗传病按遗传方式、病因层级和题干证据建立成一张可判读的图谱。"
    },
    gene: {
      label: "基因突变",
      brief: "碱基序列层级",
      maxStep: 3,
      focus: "突变发生在 DNA 碱基序列上，可能改变密码子，从而改变氨基酸。"
    },
    recombine: {
      label: "基因重组",
      brief: "等位基因重新组合",
      maxStep: 3,
      focus: "重组不产生新基因，而是在减数分裂中重新组合原有等位基因。"
    },
    chromosome: {
      label: "染色体变异",
      brief: "染色体层级",
      maxStep: 3,
      focus: "染色体变异改变片段排列、片段剂量或染色体数目，影响范围通常更大。"
    }
  };

  const MUTATION_TYPES = {
    substitution: {
      label: "替换",
      short: "碱基替换",
      before: ["A", "T", "G", "C", "G", "A", "T", "T", "C"],
      after: ["A", "T", "G", "C", "A", "A", "T", "T", "C"],
      changed: [4],
      codonsBefore: ["ATG", "CGA", "TTC"],
      codonsAfter: ["ATG", "CAA", "TTC"],
      proteinBefore: "甲硫氨酸-精氨酸-苯丙氨酸",
      proteinAfter: "甲硫氨酸-谷氨酰胺-苯丙氨酸",
      result: "一个碱基被另一个碱基替换，可能造成错义突变，也可能沉默。"
    },
    insertion: {
      label: "插入",
      short: "碱基插入",
      before: ["A", "T", "G", "C", "G", "A", "T", "T", "C"],
      after: ["A", "T", "G", "C", "A", "G", "A", "T", "T", "C"],
      changed: [4],
      codonsBefore: ["ATG", "CGA", "TTC"],
      codonsAfter: ["ATG", "CAG", "ATT", "C"],
      proteinBefore: "甲硫氨酸-精氨酸-苯丙氨酸",
      proteinAfter: "甲硫氨酸-谷氨酰胺-异亮氨酸...",
      result: "插入 1 个碱基会改变后续三联体读取框，常造成移码突变。"
    },
    deletion: {
      label: "缺失",
      short: "碱基缺失",
      before: ["A", "T", "G", "C", "G", "A", "T", "T", "C"],
      after: ["A", "T", "G", "C", "A", "T", "T", "C"],
      changed: [4],
      codonsBefore: ["ATG", "CGA", "TTC"],
      codonsAfter: ["ATG", "CAT", "TC"],
      proteinBefore: "甲硫氨酸-精氨酸-苯丙氨酸",
      proteinAfter: "甲硫氨酸-组氨酸...",
      result: "缺失 1 个碱基也会改变读取框，后面一串密码子都可能被改写。"
    }
  };

  const RECOMB_TYPES = {
    independent: {
      label: "自由组合",
      short: "非同源染色体自由组合",
      result: "减数分裂时，非同源染色体随机组合进入配子，形成 AB、Ab、aB、ab 等组合。"
    },
    crossover: {
      label: "交叉互换",
      short: "同源染色体非姐妹染色单体互换",
      result: "同源染色体联会后发生片段交换，产生亲本型和重组型配子。"
    }
  };

  const CHROM_TYPES = {
    deletion: {
      label: "缺失",
      short: "片段丢失",
      segments: ["A", "B", "D", "E"],
      mark: "C 片段丢失",
      result: "基因剂量减少，缺失片段上的基因无法表达。"
    },
    duplication: {
      label: "重复",
      short: "片段加倍",
      segments: ["A", "B", "C", "C", "D", "E"],
      mark: "C 片段重复",
      result: "基因剂量增加，可能改变性状或发育过程。"
    },
    inversion: {
      label: "倒位",
      short: "片段倒转",
      segments: ["A", "D", "C", "B", "E"],
      mark: "B-C-D 片段倒转",
      result: "基因数量未必改变，但排列顺序改变，可能影响配子形成。"
    },
    translocation: {
      label: "易位",
      short: "非同源互换",
      segments: ["A", "B", "C", "X", "Y"],
      other: ["L", "M", "D", "E"],
      mark: "非同源染色体交换片段",
      result: "片段转移到非同源染色体上，可能造成基因位置效应。"
    },
    trisomy: {
      label: "三体",
      short: "数目增加",
      segments: ["A", "B", "C", "D", "E"],
      count: 3,
      mark: "某一对同源染色体多出 1 条",
      result: "染色体数目异常会改变许多基因剂量，属于数目变异。"
    },
    polyploid: {
      label: "多倍体",
      short: "染色体组成倍增加",
      segments: ["A", "B", "C", "D"],
      count: 3,
      mark: "整套染色体组增加",
      result: "染色体组整体加倍，常见于植物育种，属于染色体数目变异。"
    }
  };

  const CROSSOVER_STEPS = [
    "同源染色体联会",
    "非姐妹染色单体交叉",
    "交换片段",
    "形成重组型配子"
  ];

  const INDEPENDENT_STEPS = [
    "两对同源染色体配对",
    "非同源染色体随机排列",
    "独立分离进入细胞两极",
    "形成四类基因组合配子"
  ];

  const OVERVIEW_CASES = {
    polydactyly: {
      label: "多指",
      short: "常染色体显性",
      type: "单基因遗传病",
      level: "一对等位基因",
      clue: "致病显性基因位于常染色体，家系中可连续多代出现患者。",
      feature: "患者常有患病亲代；男女发病机会大致相同。",
      result: "由一对等位基因控制，属于常染色体显性单基因遗传病。",
      color: "#fb7185"
    },
    albino: {
      label: "白化病",
      short: "常染色体隐性",
      type: "单基因遗传病",
      level: "一个致病基因",
      clue: "黑色素合成相关基因异常，皮肤、毛发色素明显减少。",
      feature: "双亲可表现正常，子代可能患病；近亲婚配风险升高。",
      result: "由单个基因控制，常见为常染色体隐性遗传。",
      color: "#f87171"
    },
    pku: {
      label: "苯丙酮尿症",
      short: "代谢缺陷病",
      type: "单基因遗传病",
      level: "一个致病基因",
      clue: "苯丙氨酸代谢相关酶异常，需早筛早控饮食。",
      feature: "常染色体隐性遗传；早期干预可减轻危害。",
      result: "由单个基因异常导致代谢途径受阻。",
      color: "#f97316"
    },
    colorBlind: {
      label: "红绿色盲",
      short: "伴 X 隐性",
      type: "单基因遗传病",
      level: "X 染色体上的基因",
      clue: "色觉相关基因位于 X 染色体，男性患者比例较高。",
      feature: "男性只有一条 X 染色体，带有隐性致病基因时更易表现患病。",
      result: "属于伴 X 隐性单基因遗传病，家系题常考性别差异。",
      color: "#a78bfa"
    },
    hemophilia: {
      label: "血友病",
      short: "伴 X 隐性",
      type: "单基因遗传病",
      level: "X 染色体上的基因",
      clue: "凝血因子相关基因异常，男性患者较常见。",
      feature: "伴 X 隐性遗传；女性多为携带者，男性更易发病。",
      result: "由 X 染色体上的单个致病基因控制。",
      color: "#818cf8"
    },
    hypertension: {
      label: "原发性高血压",
      short: "多基因+环境",
      type: "多基因遗传病",
      level: "多对基因共同作用",
      clue: "有家族聚集现象，也受饮食、运动、生活习惯影响。",
      feature: "易受环境影响，群体发病率较高，性状呈连续变化。",
      result: "不是单个基因决定，而是多基因与环境共同作用。",
      color: "#fbbf24"
    },
    trisomy21: {
      label: "21 三体综合征",
      short: "染色体数目异常",
      type: "染色体异常遗传病",
      level: "染色体数目",
      clue: "第 21 号染色体多出一条。",
      feature: "属于三体，不是某个基因发生碱基替换。",
      result: "染色体数目异常导致基因剂量改变。",
      color: "#38bdf8"
    },
    criDuChat: {
      label: "猫叫综合征",
      short: "染色体片段缺失",
      type: "染色体异常遗传病",
      level: "染色体结构",
      clue: "第 5 号染色体短臂片段缺失。",
      feature: "属于染色体结构变异，不是单基因遗传病。",
      result: "染色体片段缺失改变多个基因的剂量和排列。",
      color: "#22d3ee"
    }
  };

  const OVERVIEW_GROUPS = [
    {
      title: "常染色体显性",
      tag: "单基因",
      color: "#fb7185",
      items: ["多指", "并指", "软骨发育不全"]
    },
    {
      title: "常染色体隐性",
      tag: "单基因",
      color: "#f87171",
      items: ["白化病", "苯丙酮尿症", "先天性聋哑"]
    },
    {
      title: "伴性遗传",
      tag: "单基因",
      color: "#a78bfa",
      items: ["红绿色盲", "血友病", "抗维生素D佝偻病"]
    },
    {
      title: "多基因遗传病",
      tag: "多基因+环境",
      color: "#fbbf24",
      items: ["原发性高血压", "冠心病", "哮喘"]
    },
    {
      title: "染色体异常病",
      tag: "结构/数目",
      color: "#38bdf8",
      items: ["21 三体综合征", "猫叫综合征", "特纳综合征"]
    }
  ];

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function createState() {
    return {
      mode: "overview",
      step: 0,
      mutation: "substitution",
      recomb: "independent",
      chrom: "deletion",
      caseKey: "albino",
      answer: ""
    };
  }

  function css() {
    return `
      .var-stage,.var-stage *,.var-panel,.var-panel *{box-sizing:border-box}
      .var-stage{width:100%;height:100%;min-width:0;min-height:0;overflow:hidden;position:relative;color:#f8fafc;background:#020617;font-family:"Microsoft YaHei","PingFang SC",Inter,system-ui,sans-serif;touch-action:manipulation;-webkit-tap-highlight-color:transparent;user-select:none}
      .var-stage::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 16% 14%,rgba(56,189,248,.14),transparent 30%),radial-gradient(circle at 74% 22%,rgba(251,191,36,.1),transparent 28%),linear-gradient(rgba(148,163,184,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,.035) 1px,transparent 1px);background-size:auto,auto,44px 44px,44px 44px;pointer-events:none}
      .var-shell{position:relative;z-index:1;width:100%;height:100%;padding:clamp(8px,1.4vmin,14px);overflow:hidden}
      .var-canvas{width:100%;height:100%;overflow:hidden;border-radius:clamp(18px,2.7vmin,32px);border:1px solid rgba(255,255,255,.07);background:rgba(2,6,23,.72);display:grid;place-items:center}
      .var-svg{width:100%;height:100%;display:block}
      .var-base{filter:drop-shadow(0 8px 10px rgba(0,0,0,.24))}
      .var-pulse{animation:varPulse 1.6s ease-in-out infinite}
      .var-pop{animation:varPop .42s ease-out both}
      .var-swap{animation:varSwap 1.2s ease-in-out infinite alternate}
      @keyframes varPulse{0%,100%{filter:drop-shadow(0 0 8px rgba(251,191,36,.4));opacity:1}50%{filter:drop-shadow(0 0 20px rgba(251,191,36,.9));opacity:.82}}
      @keyframes varPop{0%{opacity:0}100%{opacity:1}}
      @keyframes varSwap{0%{transform:translateY(0)}100%{transform:translateY(-14px)}}

      .var-panel{width:100%;height:100%;min-width:0;min-height:0;overflow-x:hidden!important;overflow-y:auto!important;scrollbar-width:none;background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;padding:18px;display:flex;flex-direction:column;gap:14px;color:#e2e8f0;font-family:"Microsoft YaHei","PingFang SC",Inter,system-ui,sans-serif;touch-action:pan-y;-webkit-tap-highlight-color:transparent}
      .var-panel::-webkit-scrollbar{display:none}
      .var-card{min-width:0;border-radius:18px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.085);padding:16px;box-shadow:inset 0 1px 0 rgba(255,255,255,.035);overflow:hidden;flex:0 0 auto}
      .var-card.readout{flex:1 1 auto;min-height:0}
      .var-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
      .var-eyebrow{font-size:10px;line-height:1;font-weight:950;letter-spacing:.16em;color:rgba(134,239,172,.78);margin-bottom:9px}
      .var-title{min-width:0}
      .var-title h3{margin:0;color:#fff;font-size:22px;line-height:1.08;font-weight:950;letter-spacing:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .var-title p{margin:8px 0 0;color:rgba(226,232,240,.72);font-size:12px;line-height:1.45;font-weight:760}
      .var-badge{flex:0 0 auto;min-width:76px;border-radius:16px;border:1px solid rgba(103,232,249,.28);background:rgba(8,145,178,.12);padding:8px 10px;text-align:center;color:#ecfeff}
      .var-badge strong{display:block;font-family:"JetBrains Mono",Consolas,monospace;font-size:15px;line-height:1;font-weight:950;color:#67e8f9}
      .var-badge span{display:block;margin-top:5px;font-size:10px;line-height:1;font-weight:900;color:rgba(236,254,255,.78);white-space:nowrap}
      .var-card-head{display:block;margin-bottom:10px;color:rgba(226,232,240,.52);font-size:10px;line-height:1;font-weight:950;letter-spacing:.14em}
      .var-card-head strong{display:none}
      .var-kicker{color:rgba(226,232,240,.5);font-size:10px;line-height:1;font-weight:950;letter-spacing:.14em}
      .var-mode-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
      .var-type-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
      .var-chrom-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
      .var-recomb-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
      .var-case-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
      .var-action-grid{display:grid;grid-template-columns:1fr 1.35fr;gap:10px}
      .var-panel button{min-height:var(--bio-touch-target,44px);border:1px solid rgba(255,255,255,.09);border-radius:12px;background:rgba(255,255,255,.045);color:#e2e8f0;font-family:inherit;font-size:13px;font-weight:900;cursor:pointer;transition:transform .18s ease,border-color .18s ease,background .18s ease;touch-action:manipulation}
      .var-panel button:hover:not(:disabled){transform:translateY(-1px);border-color:rgba(52,211,153,.34)}
      .var-panel button.is-active{border-color:rgba(52,211,153,.72);background:linear-gradient(135deg,rgba(16,185,129,.32),rgba(5,150,105,.18));color:#f0fdf4}
      .var-panel button.is-hot{border-color:rgba(103,232,249,.65);background:rgba(8,145,178,.18);color:#ecfeff}
      .var-panel button:disabled{cursor:not-allowed;opacity:.46}
      .var-step-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
      .var-step{min-height:var(--bio-touch-target,40px);border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.035);display:grid;place-items:center;gap:2px;padding:5px;color:rgba(226,232,240,.68);font-family:inherit;cursor:pointer}
      .var-step.is-done{border-color:rgba(52,211,153,.32);background:rgba(16,185,129,.1);color:#d1fae5}
      .var-step.is-active{border-color:rgba(103,232,249,.62);background:rgba(8,145,178,.18);color:#ecfeff}
      .var-step b{font-family:"JetBrains Mono",Consolas,monospace;font-size:12px;line-height:1}
      .var-step span{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px;line-height:1;font-weight:850}
      .var-task{display:grid;gap:10px}
      .var-task-prompt{color:#fff;font-size:13px;line-height:1.38;font-weight:950}
      .var-answer-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      .var-answer-grid button{min-height:40px;padding:6px 8px;line-height:1.2}
      .var-answer-grid button.is-correct{border-color:rgba(52,211,153,.74);background:rgba(16,185,129,.24);color:#dcfce7}
      .var-answer-grid button.is-wrong{border-color:rgba(248,113,113,.74);background:rgba(127,29,29,.28);color:#fee2e2}
      .var-feedback{min-height:24px;border-radius:10px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.03);padding:6px 8px;color:#cbd5e1;font-size:11px;line-height:1.35;font-weight:820}
      .var-feedback.is-correct{border-color:rgba(52,211,153,.28);color:#bbf7d0}
      .var-feedback.is-wrong{border-color:rgba(248,113,113,.34);color:#fecaca}
      .var-readout-grid{display:grid;gap:8px}
      .var-readout-line{border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.03);border-radius:12px;padding:9px 10px;display:grid;grid-template-columns:76px minmax(0,1fr);align-items:start;gap:8px;font-size:12px;font-weight:900;color:rgba(226,232,240,.86)}
      .var-readout-line span{color:rgba(226,232,240,.66)}
      .var-readout-line strong{min-width:0;color:#fff;text-align:left;line-height:1.35;overflow-wrap:anywhere}
      @media(max-height:900px){.var-panel{padding:10px;gap:7px}.var-card{padding:10px;border-radius:16px}.var-title h3{font-size:19px}.var-title p{display:none}.var-panel button{min-height:40px}.var-step{min-height:40px}.var-readout-grid{gap:6px}.var-readout-line{padding:6px 8px}.var-task-prompt{font-size:12px}.var-feedback{display:none}}
      @media(max-height:820px){.var-card.readout{display:none}}
      @media(max-height:740px){.var-panel{padding:8px;gap:6px}.var-card{padding:9px;border-radius:14px}.var-eyebrow{display:none}.var-title h3{font-size:17px}.var-badge{min-width:58px;padding:6px 8px}.var-badge span{display:none}.var-panel button{min-height:40px;font-size:11px}.var-type-grid,.var-mode-grid{gap:6px}.var-step-grid{gap:6px}.var-readout-line{grid-template-columns:58px minmax(0,1fr);padding:5px 7px;font-size:11px}.var-task-prompt{display:none}}
      @media(max-height:570px){.var-panel{padding:7px;gap:5px}.var-card{padding:7px;border-radius:13px}.var-panel>.var-card:first-child,.var-card.readout,.var-task-card{display:none}.var-title h3{font-size:15px}.var-card-head{display:none}.var-answer-grid{gap:5px}.var-panel button{min-height:40px;border-radius:10px}.var-step span{display:none}.var-step{min-height:40px}.var-shell{padding:6px}.var-canvas{border-radius:16px}}
      @media(max-width:900px){.var-panel{padding:8px;gap:7px}.var-title h3{font-size:17px}.var-title p{display:none}.var-badge{min-width:54px}.var-badge span{display:none}.var-chrom-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.var-answer-grid button{font-size:11px}}
      .var-panel[data-fit="medium"],.var-panel[data-fit="compact"],.var-panel[data-fit="short"],.var-panel[data-fit="micro"]{padding:10px;gap:7px}
      .var-panel[data-fit="medium"] .var-card,.var-panel[data-fit="compact"] .var-card,.var-panel[data-fit="short"] .var-card,.var-panel[data-fit="micro"] .var-card{padding:10px;border-radius:16px}
      .var-panel[data-fit="medium"] .var-title h3,.var-panel[data-fit="compact"] .var-title h3,.var-panel[data-fit="short"] .var-title h3,.var-panel[data-fit="micro"] .var-title h3{font-size:19px}
      .var-panel[data-fit="medium"] .var-title p,.var-panel[data-fit="compact"] .var-title p,.var-panel[data-fit="short"] .var-title p,.var-panel[data-fit="micro"] .var-title p{display:none}
      .var-panel[data-fit="medium"] button,.var-panel[data-fit="compact"] button,.var-panel[data-fit="short"] button,.var-panel[data-fit="micro"] button{min-height:40px}
      .var-panel[data-fit="medium"] .var-step,.var-panel[data-fit="compact"] .var-step,.var-panel[data-fit="short"] .var-step,.var-panel[data-fit="micro"] .var-step{min-height:40px}
      .var-panel[data-fit="medium"] .var-readout-grid,.var-panel[data-fit="compact"] .var-readout-grid,.var-panel[data-fit="short"] .var-readout-grid,.var-panel[data-fit="micro"] .var-readout-grid{gap:6px}
      .var-panel[data-fit="medium"] .var-readout-line,.var-panel[data-fit="compact"] .var-readout-line,.var-panel[data-fit="short"] .var-readout-line,.var-panel[data-fit="micro"] .var-readout-line{padding:6px 8px}
      .var-panel[data-fit="medium"] .var-task-prompt,.var-panel[data-fit="compact"] .var-task-prompt,.var-panel[data-fit="short"] .var-task-prompt,.var-panel[data-fit="micro"] .var-task-prompt{font-size:12px}
      .var-panel[data-fit="medium"] .var-feedback,.var-panel[data-fit="compact"] .var-feedback,.var-panel[data-fit="short"] .var-feedback,.var-panel[data-fit="micro"] .var-feedback{display:none}
      .var-panel[data-fit="compact"] .var-card.readout,.var-panel[data-fit="short"] .var-card.readout,.var-panel[data-fit="micro"] .var-card.readout{display:none}
      .var-panel[data-fit="short"],.var-panel[data-fit="micro"]{padding:8px;gap:6px}
      .var-panel[data-fit="short"] .var-card,.var-panel[data-fit="micro"] .var-card{padding:9px;border-radius:14px}
      .var-panel[data-fit="short"] .var-eyebrow,.var-panel[data-fit="micro"] .var-eyebrow{display:none}
      .var-panel[data-fit="short"] .var-title h3,.var-panel[data-fit="micro"] .var-title h3{font-size:17px}
      .var-panel[data-fit="short"] .var-badge,.var-panel[data-fit="micro"] .var-badge{min-width:58px;padding:6px 8px}
      .var-panel[data-fit="short"] .var-badge span,.var-panel[data-fit="micro"] .var-badge span{display:none}
      .var-panel[data-fit="short"] button,.var-panel[data-fit="micro"] button{min-height:40px;font-size:11px}
      .var-panel[data-fit="short"] .var-type-grid,.var-panel[data-fit="short"] .var-mode-grid,.var-panel[data-fit="micro"] .var-type-grid,.var-panel[data-fit="micro"] .var-mode-grid{gap:6px}
      .var-panel[data-fit="short"] .var-step-grid,.var-panel[data-fit="micro"] .var-step-grid{gap:6px}
      .var-panel[data-fit="short"] .var-readout-line,.var-panel[data-fit="micro"] .var-readout-line{grid-template-columns:58px minmax(0,1fr);padding:5px 7px;font-size:11px}
      .var-panel[data-fit="short"] .var-task-prompt,.var-panel[data-fit="micro"] .var-task-prompt{display:none}
      .var-panel[data-fit="micro"]{padding:7px;gap:5px}
      .var-panel[data-fit="micro"] .var-card{padding:7px;border-radius:13px}
      .var-panel[data-fit="micro"]>.var-card:first-child,.var-panel[data-fit="micro"] .var-card.readout,.var-panel[data-fit="micro"] .var-task-card{display:none}
      .var-panel[data-fit="micro"] .var-title h3{font-size:15px}
      .var-panel[data-fit="micro"] .var-card-head{display:none}
      .var-panel[data-fit="micro"] .var-answer-grid{gap:5px}
      .var-panel[data-fit="micro"] button{min-height:40px;border-radius:10px}
      .var-panel[data-fit="micro"] .var-step span{display:none}
      .var-panel[data-fit="micro"] .var-step{min-height:40px}
    `;
  }

  function gradients() {
    return Object.keys(BASE_COLORS).map((base) => {
      const c = BASE_COLORS[base];
      return `<linearGradient id="var-${base}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c.glow}"></stop><stop offset="100%" stop-color="${c.main}"></stop></linearGradient>`;
    }).join("");
  }

  function baseBox(base, x, y, options = {}) {
    const c = BASE_COLORS[base] || BASE_COLORS.A;
    const cls = options.hot ? "var-base var-pulse" : "var-base";
    const op = options.ghost ? 0.2 : 1;
    const scale = options.small ? 0.82 : 1;
    return `
      <g class="${cls}" transform="translate(${x} ${y}) scale(${scale})" opacity="${op}">
        <rect x="-18" y="-24" width="36" height="48" rx="10" fill="${c.dark}" transform="translate(0 4)"></rect>
        <rect x="-18" y="-24" width="36" height="48" rx="10" fill="url(#var-${base})" stroke="rgba(255,255,255,.68)" stroke-width="2"></rect>
        <path d="M -12 -14 H 12" stroke="#fff" stroke-width="3" opacity=".35" stroke-linecap="round"></path>
        <text x="0" y="7" text-anchor="middle" fill="#fff" font-size="18" font-weight="900" font-family="Consolas,monospace">${base}</text>
      </g>
    `;
  }

  function codonBoxes(codons, x, y, hotIndex, options = {}) {
    const width = options.width || 108;
    const gap = options.gap || 132;
    const fontSize = options.fontSize || 17;
    const rectY = options.rectY == null ? -20 : options.rectY;
    const rectHeight = options.rectHeight || 42;
    const labelY = options.labelY == null ? 34 : options.labelY;
    return codons.map((codon, i) => `
      <g transform="translate(${x + i * gap} ${y})">
        <rect x="${-width / 2}" y="${rectY}" width="${width}" height="${rectHeight}" rx="13" fill="${i === hotIndex ? "rgba(251,191,36,.18)" : "rgba(255,255,255,.045)"}" stroke="${i === hotIndex ? "rgba(251,191,36,.68)" : "rgba(255,255,255,.1)"}" stroke-width="2"></rect>
        <text x="0" y="4" text-anchor="middle" fill="#fff" font-size="${fontSize}" font-weight="900" font-family="Consolas,monospace">${esc(codon)}</text>
        <text x="0" y="${labelY}" text-anchor="middle" fill="#94a3b8" font-size="11" font-weight="850">${codon.length < 3 ? "不完整" : `密码子${i + 1}`}</text>
      </g>
    `).join("");
  }

  function proteinTextLines(text, x, y, color = "#fde68a") {
    const pieces = String(text || "").split("-");
    const lines = [];
    let line = "";
    pieces.forEach((piece) => {
      const next = line ? `${line}-${piece}` : piece;
      if (next.length > 12 && line) {
        lines.push(line);
        line = piece;
      } else {
        line = next;
      }
    });
    if (line) lines.push(line);
    return lines.slice(0, 2).map((item, index) => `
      <text x="${x}" y="${y + index * 20}" text-anchor="middle" fill="${color}" font-size="14" font-weight="950">${esc(item)}</text>
    `).join("");
  }

  function tripletGuide(sequence, startX, y, options = {}) {
    const gap = options.gap || 56;
    const groupSize = 3;
    const changedFrom = options.changedFrom == null ? 99 : options.changedFrom;
    const title = options.title || "三联体读取框";
    const parts = [];
    for (let i = 0; i < sequence.length; i += groupSize) {
      const group = sequence.slice(i, i + groupSize);
      const isIncomplete = group.length < groupSize;
      const isChanged = i >= changedFrom;
      const x1 = startX + i * gap - 24;
      const x2 = startX + (i + group.length - 1) * gap + 24;
      const mid = (x1 + x2) / 2;
      const stroke = isIncomplete ? "#f87171" : isChanged ? "#fde047" : "#38bdf8";
      const fill = isIncomplete ? "#fecaca" : isChanged ? "#fef08a" : "#bae6fd";
      parts.push(`
        <g class="var-pop" opacity="${options.muted ? .62 : 1}">
          <path d="M ${x1} ${y} V ${y + 10} H ${x2} V ${y}" fill="none" stroke="${stroke}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>
          <text x="${mid}" y="${y + 28}" text-anchor="middle" fill="${fill}" font-size="12" font-weight="900">${isIncomplete ? "不完整" : group.join("")}</text>
        </g>
      `);
    }
    return `
      <g>
        <text x="${startX - 42}" y="${y + 27}" text-anchor="end" fill="rgba(226,232,240,.72)" font-size="12" font-weight="900">${esc(title)}</text>
        ${parts.join("")}
      </g>
    `;
  }

  function chromosome(segments, x, y, opts = {}) {
    const colors = ["#22c55e", "#38bdf8", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"];
    const width = opts.compact ? 62 : 78;
    const gap = opts.compact ? 4 : 6;
    const total = segments.length * width + (segments.length - 1) * gap;
    const cells = segments.map((seg, i) => `
      <g transform="translate(${i * (width + gap)} 0)" class="${opts.hot && opts.hot.includes(i) ? "var-pulse" : ""}">
        <rect x="0" y="0" width="${width}" height="44" rx="18" fill="${colors[i % colors.length]}" opacity=".88" stroke="rgba(255,255,255,.42)" stroke-width="2"></rect>
        <text x="${width / 2}" y="28" text-anchor="middle" fill="#061117" font-size="18" font-weight="950">${esc(seg)}</text>
      </g>
    `).join("");
    return `
      <g transform="translate(${x - total / 2} ${y})">
        <path d="M 8 22 H ${total - 8}" stroke="rgba(255,255,255,.18)" stroke-width="58" stroke-linecap="round"></path>
        ${cells}
      </g>
    `;
  }

  function allelePill(text, x, y, color = "#38bdf8", hot = false) {
    return `
      <g transform="translate(${x} ${y})" class="${hot ? "var-pulse" : ""}">
        <rect x="-38" y="-22" width="76" height="44" rx="18" fill="${color}" opacity=".9" stroke="rgba(255,255,255,.45)" stroke-width="2"></rect>
        <text x="0" y="7" text-anchor="middle" fill="#061117" font-size="20" font-weight="950">${esc(text)}</text>
      </g>
    `;
  }

  function gameteChip(text, x, y, hot = false) {
    return `
      <g transform="translate(${x} ${y})" class="${hot ? "var-pop" : ""}">
        <rect x="-56" y="-24" width="112" height="48" rx="18" fill="${hot ? "rgba(250,204,21,.22)" : "rgba(255,255,255,.055)"}" stroke="${hot ? "rgba(250,204,21,.7)" : "rgba(255,255,255,.14)"}" stroke-width="2"></rect>
        <text x="0" y="7" text-anchor="middle" fill="${hot ? "#fef08a" : "#e2e8f0"}" font-size="20" font-weight="950" font-family="Consolas,monospace">${esc(text)}</text>
      </g>
    `;
  }

  function splitVisualText(text, limit = 12, maxLines = 2) {
    const source = String(text || "");
    const pieces = source.replace(/([，；。])/g, "$1|").split("|").filter(Boolean);
    const lines = [];
    let line = "";
    pieces.forEach((piece) => {
      const next = `${line}${piece}`;
      if (Array.from(next).length > limit && line) {
        lines.push(line);
        line = piece;
      } else {
        line = next;
      }
    });
    if (line) lines.push(line);
    const wrapped = [];
    lines.forEach((item) => {
      let chars = Array.from(item);
      while (chars.length > limit + 3) {
        wrapped.push(chars.slice(0, limit).join(""));
        chars = chars.slice(limit);
      }
      if (chars.length) wrapped.push(chars.join(""));
    });
    if (wrapped.length <= maxLines) return wrapped;
    const clipped = wrapped.slice(0, maxLines);
    const last = Array.from(clipped[maxLines - 1]).slice(0, Math.max(1, limit - 1)).join("");
    clipped[maxLines - 1] = `${last}…`;
    return clipped;
  }

  function svgTextBlock(text, x, y, options = {}) {
    const lines = splitVisualText(text, options.limit || 14, options.maxLines || 2);
    const gap = options.gap || 18;
    const color = options.color || "#cbd5e1";
    const size = options.size || 13;
    const weight = options.weight || 900;
    const anchor = options.anchor || "middle";
    return lines.map((line, index) => `
      <text x="${x}" y="${y + index * gap}" text-anchor="${anchor}" fill="${color}" font-size="${size}" font-weight="${weight}">${esc(line)}</text>
    `).join("");
  }

  function overviewCard(title, subtitle, x, y, w, h, color = "#38bdf8", hot = false) {
    const textLines = splitVisualText(subtitle, Math.max(8, Math.floor(w / 18)), 2);
    const textY = textLines.length > 1 ? 14 : 22;
    return `
      <g transform="translate(${x} ${y})" class="${hot ? "var-pulse" : ""}">
        <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="18" fill="rgba(15,23,42,.78)" stroke="${color}" stroke-width="2" opacity=".96"></rect>
        <text x="0" y="-6" text-anchor="middle" fill="#fff" font-size="18" font-weight="950">${esc(title)}</text>
        ${textLines.map((line, index) => `<text x="0" y="${textY + index * 17}" text-anchor="middle" fill="${color}" font-size="13" font-weight="900">${esc(line)}</text>`).join("")}
      </g>
    `;
  }

  function atlasGroupCard(group, x, y) {
    const itemRows = group.items.map((item, index) => `
      <g transform="translate(0 ${16 + index * 42})">
        <rect x="-66" y="-18" width="132" height="32" rx="12" fill="rgba(255,255,255,.055)" stroke="rgba(255,255,255,.1)" stroke-width="1.5"></rect>
        <circle cx="-48" cy="-2" r="5" fill="${group.color}"></circle>
        <text x="-36" y="3" fill="#e2e8f0" font-size="12" font-weight="900">${esc(item)}</text>
      </g>
    `).join("");
    return `
      <g transform="translate(${x} ${y})" class="var-pop">
        <rect x="-78" y="-110" width="156" height="236" rx="20" fill="rgba(15,23,42,.76)" stroke="${group.color}" stroke-width="2" opacity=".96"></rect>
        <text x="0" y="-76" text-anchor="middle" fill="#fff" font-size="16" font-weight="950">${esc(group.title)}</text>
        <rect x="-52" y="-56" width="104" height="28" rx="11" fill="${group.color}" opacity=".16" stroke="${group.color}" stroke-width="1.5"></rect>
        <text x="0" y="-37" text-anchor="middle" fill="${group.color}" font-size="12" font-weight="950">${esc(group.tag)}</text>
        ${itemRows}
      </g>
    `;
  }

  function diseaseCauseIcon(item, x, y) {
    const color = item.color || "#38bdf8";
    if (item.type === "多基因遗传病") {
      return `
        <g transform="translate(${x} ${y})" class="var-pop">
          <circle cx="-54" cy="-16" r="18" fill="${color}" opacity=".24" stroke="${color}" stroke-width="2"></circle>
          <circle cx="0" cy="-26" r="18" fill="${color}" opacity=".16" stroke="${color}" stroke-width="2"></circle>
          <circle cx="52" cy="-12" r="18" fill="${color}" opacity=".2" stroke="${color}" stroke-width="2"></circle>
          <path d="M -64 36 C -30 8 28 8 64 36" fill="none" stroke="#fef08a" stroke-width="6" stroke-linecap="round"></path>
          <text x="0" y="60" text-anchor="middle" fill="#fef08a" font-size="13" font-weight="950">多基因 + 环境</text>
        </g>
      `;
    }
    if (item.type === "染色体异常遗传病") {
      const extra = item.level === "染色体数目"
        ? `<rect x="42" y="-52" width="18" height="92" rx="9" fill="${color}" opacity=".85"></rect>`
        : `<path d="M 40 -48 L 66 -18 M 66 -48 L 40 -18" stroke="#fecaca" stroke-width="7" stroke-linecap="round"></path>`;
      return `
        <g transform="translate(${x} ${y})" class="var-pop">
          <rect x="-56" y="-54" width="18" height="96" rx="9" fill="${color}" opacity=".9"></rect>
          <rect x="-20" y="-54" width="18" height="96" rx="9" fill="${color}" opacity=".72"></rect>
          <rect x="16" y="-54" width="18" height="96" rx="9" fill="${color}" opacity=".54"></rect>
          ${extra}
          <text x="0" y="66" text-anchor="middle" fill="#bae6fd" font-size="13" font-weight="950">${esc(item.level)}</text>
        </g>
      `;
    }
    return `
      <g transform="translate(${x} ${y})" class="var-pop">
        <path d="M -72 -44 C -20 -10 20 -72 72 -38" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round"></path>
        <path d="M -72 22 C -20 -12 20 50 72 16" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" opacity=".55"></path>
        <circle cx="0" cy="-12" r="26" fill="rgba(250,204,21,.17)" stroke="#fde047" stroke-width="3"></circle>
        <text x="0" y="-5" text-anchor="middle" fill="#fef08a" font-size="15" font-weight="950">致病基因</text>
        <text x="0" y="62" text-anchor="middle" fill="#fecaca" font-size="13" font-weight="950">${esc(item.short)}</text>
      </g>
    `;
  }

  function caseCard(caseItem, x, y, hot = false) {
    const color = caseItem.color || "#67e8f9";
    return `
      <g transform="translate(${x} ${y})" class="${hot ? "var-pop" : ""}">
        <rect x="-108" y="-43" width="216" height="86" rx="18" fill="${hot ? "rgba(8,145,178,.24)" : "rgba(15,23,42,.72)"}" stroke="${hot ? color : "rgba(148,163,184,.16)"}" stroke-width="2"></rect>
        <circle cx="-82" cy="-18" r="7" fill="${color}"></circle>
        <text x="-68" y="-12" fill="#fff" font-size="16" font-weight="950">${esc(caseItem.label)}</text>
        <text x="-82" y="14" fill="${color}" font-size="12" font-weight="900">${esc(caseItem.short)}</text>
        <text x="-82" y="34" fill="#cbd5e1" font-size="11" font-weight="850">${esc(caseItem.type)}</text>
      </g>
    `;
  }

  function renderOverview(state) {
    const step = state.step;
    const item = OVERVIEW_CASES[state.caseKey] || OVERVIEW_CASES.albino;
    const cases = Object.keys(OVERVIEW_CASES);
    const caseCards = cases.map((key, index) => {
      const pos = [
        [170, 218],
        [390, 218],
        [610, 218],
        [830, 218],
        [170, 344],
        [390, 344],
        [610, 344],
        [830, 344]
      ][index];
      return caseCard(OVERVIEW_CASES[key], pos[0], pos[1], key === state.caseKey);
    }).join("");
    const atlasCards = OVERVIEW_GROUPS.map((group, index) => atlasGroupCard(group, 132 + index * 184, 318)).join("");
    return `
      <svg class="var-svg" viewBox="0 0 1000 560" preserveAspectRatio="xMidYMid meet" aria-label="遗传病总览模拟">
        <defs>${gradients()}<marker id="var-arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" fill="#67e8f9"></path></marker></defs>
        <text x="500" y="70" text-anchor="middle" fill="#1e293b" font-size="56" font-weight="950" letter-spacing="6">遗传病总览</text>
        ${label(step === 0 ? "高中常见遗传病图谱" : step === 1 ? "代表病例坐标" : step === 2 ? "病例证据链" : "遗传病判别路径", 500, 114, 22, "#67e8f9")}
        ${step === 0 ? `
          <g class="var-pop">
            <rect x="44" y="150" width="912" height="366" rx="30" fill="rgba(15,23,42,.58)" stroke="rgba(103,232,249,.18)" stroke-width="2"></rect>
            ${atlasCards}
            <g transform="translate(500 491)">
              <rect x="-352" y="-19" width="704" height="38" rx="16" fill="rgba(14,165,233,.12)" stroke="rgba(103,232,249,.26)" stroke-width="1.5"></rect>
              <text x="-226" y="6" text-anchor="middle" fill="#dbeafe" font-size="14" font-weight="950">遗传方式</text>
              <text x="0" y="6" text-anchor="middle" fill="#dbeafe" font-size="14" font-weight="950">病因层级</text>
              <text x="226" y="6" text-anchor="middle" fill="#dbeafe" font-size="14" font-weight="950">题干证据</text>
            </g>
          </g>
        ` : ""}
        ${step === 1 ? `
          <g class="var-pop">
            <rect x="52" y="156" width="896" height="268" rx="28" fill="rgba(15,23,42,.5)" stroke="rgba(148,163,184,.16)" stroke-width="2"></rect>
            ${caseCards}
            <text x="500" y="476" text-anchor="middle" fill="#fde68a" font-size="17" font-weight="950">代表病例：遗传方式、病因层级、题干线索一一对应</text>
          </g>
        ` : ""}
        ${step === 2 ? `
          <g class="var-pop">
            <rect x="54" y="150" width="892" height="330" rx="28" fill="rgba(15,23,42,.72)" stroke="${item.color}" stroke-width="2"></rect>
            ${diseaseCauseIcon(item, 216, 284)}
            <text x="600" y="198" text-anchor="middle" fill="#fff" font-size="30" font-weight="950">${esc(item.label)}</text>
            <rect x="392" y="222" width="416" height="74" rx="20" fill="rgba(8,145,178,.12)" stroke="rgba(103,232,249,.24)" stroke-width="2"></rect>
            <text x="600" y="246" text-anchor="middle" fill="#67e8f9" font-size="13" font-weight="950">题干线索</text>
            ${svgTextBlock(item.clue, 600, 271, { limit: 24, maxLines: 2, gap: 18, color: "#e0f2fe", size: 14 })}
            <g transform="translate(600 360)">
              ${overviewCard("病因层级", item.level, -212, 0, 176, 76, "#fbbf24", false)}
              ${overviewCard("遗传特点", item.short, 0, 0, 176, 76, "#22c55e", false)}
              ${overviewCard("疾病类型", item.type, 212, 0, 202, 76, "#38bdf8", false)}
            </g>
            ${svgTextBlock(item.feature, 600, 430, { limit: 30, maxLines: 2, gap: 18, color: "#fde68a", size: 14 })}
          </g>
        ` : ""}
        ${step === 3 ? `
          <g class="var-pop">
            <rect x="110" y="150" width="780" height="342" rx="30" fill="rgba(15,23,42,.62)" stroke="rgba(103,232,249,.22)" stroke-width="2"></rect>
            <rect x="362" y="174" width="276" height="48" rx="18" fill="rgba(103,232,249,.12)" stroke="rgba(103,232,249,.36)" stroke-width="2"></rect>
            <text x="500" y="205" text-anchor="middle" fill="#e0f2fe" font-size="17" font-weight="950">题干中的致病证据</text>
            ${overviewCard("一对等位基因", "显性、隐性或伴 X", 246, 316, 228, 82, "#f87171", true)}
            ${overviewCard("多对基因", "家族聚集且受环境影响", 500, 316, 246, 82, "#fbbf24", true)}
            ${overviewCard("染色体层级", "第几号多一条或片段缺失", 754, 316, 252, 82, "#38bdf8", true)}
            <path d="M 456 222 C 374 246 312 266 270 286" fill="none" stroke="#f87171" stroke-width="4" marker-end="url(#var-arrow)"></path>
            <path d="M 500 222 V 270" fill="none" stroke="#fbbf24" stroke-width="4" marker-end="url(#var-arrow)"></path>
            <path d="M 544 222 C 626 246 688 266 730 286" fill="none" stroke="#38bdf8" stroke-width="4" marker-end="url(#var-arrow)"></path>
            <text x="246" y="410" text-anchor="middle" fill="#fecaca" font-size="13" font-weight="950">多指 / 白化病 / 红绿色盲 / 血友病</text>
            <text x="500" y="410" text-anchor="middle" fill="#fef08a" font-size="13" font-weight="950">原发性高血压 / 冠心病 / 哮喘</text>
            <text x="754" y="410" text-anchor="middle" fill="#bae6fd" font-size="13" font-weight="950">21 三体综合征 / 猫叫综合征</text>
          </g>
        ` : ""}
      </svg>
    `;
  }

  function label(text, x, y, size = 18, color = "#e2e8f0") {
    return `<text x="${x}" y="${y}" text-anchor="middle" fill="${color}" font-size="${size}" font-weight="900">${esc(text)}</text>`;
  }

  function renderGene(state) {
    const data = MUTATION_TYPES[state.mutation];
    const step = state.step;
    const before = data.before.map((b, i) => baseBox(b, 230 + i * 56, 220, { hot: step === 1 && data.changed.includes(i) })).join("");
    const after = (step >= 2 ? data.after : data.before).map((b, i) => {
      const hot = step >= 2 && (data.changed.includes(i) || (state.mutation !== "substitution" && i >= data.changed[0]));
      const dy = step >= 2 && hot ? -18 : 0;
      return baseBox(b, 230 + i * 56, 372 + dy, { hot });
    }).join("");
    const changeX = 230 + data.changed[0] * 56;
    const missing = state.mutation === "deletion" && step >= 2
      ? `<g class="var-pop" transform="translate(${changeX - 28} 336)"><text x="0" y="-34" text-anchor="middle" fill="#fecaca" font-size="14" font-weight="950">缺失点</text><path d="M -20 -20 L 20 20 M 20 -20 L -20 20" stroke="#f87171" stroke-width="7" stroke-linecap="round"></path></g>`
      : "";
    const inserted = state.mutation === "insertion" && step >= 2
      ? `<g class="var-pop" transform="translate(${changeX} 328)"><text x="0" y="-48" text-anchor="middle" fill="#fde68a" font-size="14" font-weight="950">插入点</text><path d="M 0 -36 V 8" stroke="#fde047" stroke-width="5" stroke-linecap="round" stroke-dasharray="8 7"></path></g>`
      : "";
    const mutationCue = step === 1
      ? `<g class="var-pop"><path d="M 500 270 C 465 300 450 318 430 344" fill="none" stroke="#fbbf24" stroke-width="5" stroke-linecap="round" stroke-dasharray="8 8"></path><text x="500" y="304" text-anchor="middle" fill="#fde68a" font-size="15" font-weight="900">诱变因素作用</text></g>`
      : "";
    const ruleText = step >= 2
      ? state.mutation === "substitution"
        ? "长度不变：后续密码子不整体错位"
        : "长度改变：插入点/缺失点之后重新按三联体分组"
      : "按 3 个碱基一组读取遗传密码";
    const originalGuide = step === 0
      ? tripletGuide(data.before, 230, 274, { title: "原始分组", muted: true })
      : "";
    const afterGuide = step === 2
      ? tripletGuide(data.after, 230, 426, {
        title: state.mutation === "substitution" ? "变后分组" : "重新分组",
        changedFrom: state.mutation === "substitution" ? Math.floor(data.changed[0] / 3) * 3 : Math.floor(data.changed[0] / 3) * 3
      })
      : "";
    const activeCodons = step >= 3 ? data.codonsAfter : data.codonsBefore;
    const compactCodons = activeCodons.length > 3;
    const codonStart = compactCodons ? -302 : -278;
    const codonOptions = compactCodons
      ? { width: 76, gap: 92, fontSize: 14, rectHeight: 40, labelY: 33 }
      : { width: 98, gap: 118, fontSize: 16, rectHeight: 40, labelY: 33 };
    const proteinColor = step >= 3 ? "#fde68a" : "#94a3b8";
    return `
      <svg class="var-svg" viewBox="0 0 1000 560" preserveAspectRatio="xMidYMid meet" aria-label="基因突变动态模拟">
        <defs>${gradients()}<marker id="var-arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" fill="#fde047"></path></marker></defs>
        <text x="500" y="74" text-anchor="middle" fill="#1e293b" font-size="58" font-weight="950" letter-spacing="8">基因突变</text>
        <text x="500" y="112" text-anchor="middle" fill="#67e8f9" font-size="18" font-weight="950">${esc(ruleText)}</text>
        ${label("原始 DNA 序列", 190, 158, 16, "#cbd5e1")}
        <path d="M 200 246 H 710" stroke="#38bdf8" stroke-width="8" stroke-linecap="round" opacity=".62"></path>
        ${before}
        ${originalGuide}
        ${mutationCue}
        ${missing}
        ${inserted}
        ${label(step >= 2 ? "突变后 DNA 序列" : "复制后的目标序列", 205, 332, 16, step >= 2 ? "#fde68a" : "#64748b")}
        <path d="M 200 398 H 760" stroke="${step >= 2 ? "#fbbf24" : "#64748b"}" stroke-width="8" stroke-linecap="round" opacity=".68"></path>
        ${after}
        ${afterGuide}
        <g transform="translate(500 470)" opacity="${step >= 3 ? 1 : 0}">
          <rect x="-382" y="-48" width="764" height="98" rx="24" fill="rgba(15,23,42,.76)" stroke="rgba(148,163,184,.22)" stroke-width="1.5"></rect>
          <rect x="-356" y="-34" width="388" height="68" rx="18" fill="rgba(255,255,255,.025)" stroke="rgba(148,163,184,.11)"></rect>
          <line x1="58" y1="-30" x2="58" y2="30" stroke="rgba(148,163,184,.22)" stroke-width="2" stroke-linecap="round"></line>
          <text x="-332" y="-22" fill="#94a3b8" font-size="12" font-weight="900">密码子读取</text>
          ${codonBoxes(activeCodons, codonStart, 4, 1, codonOptions)}
          <text x="220" y="-22" text-anchor="middle" fill="#94a3b8" font-size="12" font-weight="900">翻译结果</text>
          ${proteinTextLines(step >= 3 ? data.proteinAfter : data.proteinBefore, 220, 4, proteinColor)}
        </g>
      </svg>
    `;
  }

  function renderRecombine(state) {
    const step = state.step;
    if (state.recomb === "independent") {
      const oriented = step >= 1;
      const separated = step >= 2;
      const gametes = step >= 3;
      return `
        <svg class="var-svg" viewBox="0 0 1000 560" preserveAspectRatio="xMidYMid meet" aria-label="基因重组动态模拟">
          <defs>${gradients()}<marker id="var-arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" fill="#fde047"></path></marker></defs>
          <text x="500" y="72" text-anchor="middle" fill="#1e293b" font-size="58" font-weight="950" letter-spacing="8">基因重组</text>
          ${label(INDEPENDENT_STEPS[step], 500, 116, 22, "#67e8f9")}
          <g>
            <text x="500" y="168" text-anchor="middle" fill="#cbd5e1" font-size="15" font-weight="900">两对非同源染色体：A/a 与 B/b</text>
            <line x1="500" y1="178" x2="500" y2="372" stroke="rgba(148,163,184,.18)" stroke-width="2" stroke-dasharray="8 8"></line>
            <text x="365" y="196" text-anchor="middle" fill="#94a3b8" font-size="13" font-weight="900">同源染色体对 1</text>
            <text x="635" y="196" text-anchor="middle" fill="#94a3b8" font-size="13" font-weight="900">同源染色体对 2</text>
            ${allelePill("A", oriented ? 342 : 330, 238, "#22c55e", oriented)}
            ${allelePill("a", oriented ? 342 : 405, 306, "#38bdf8", oriented)}
            ${allelePill("B", oriented ? 658 : 595, 238, "#f59e0b", oriented)}
            ${allelePill("b", oriented ? 658 : 670, 306, "#ef4444", oriented)}
            ${oriented ? `<g class="var-pop"><text x="500" y="276" text-anchor="middle" fill="#fde68a" font-size="16" font-weight="950">非同源染色体随机朝向两极</text><path d="M 456 244 H 394" stroke="#fde047" stroke-width="5" stroke-linecap="round" marker-end="url(#var-arrow)"></path><path d="M 544 310 H 606" stroke="#fde047" stroke-width="5" stroke-linecap="round" marker-end="url(#var-arrow)"></path></g>` : ""}
            ${separated ? `<g class="var-pop"><text x="500" y="376" text-anchor="middle" fill="#fef08a" font-size="17" font-weight="950">独立分离：A 可与 B 或 b 组合，a 也可与 B 或 b 组合</text></g>` : ""}
          </g>
          ${gametes ? `
            <g class="var-pop">
              <rect x="160" y="418" width="680" height="88" rx="24" fill="rgba(15,23,42,.72)" stroke="rgba(255,255,255,.1)"></rect>
              <text x="500" y="444" text-anchor="middle" fill="#c4b5fd" font-size="16" font-weight="950">配子组合结果：不是产生新基因，而是重新组合已有等位基因</text>
              ${gameteChip("AB", 270, 478, true)}
              ${gameteChip("Ab", 420, 478, true)}
              ${gameteChip("aB", 580, 478, true)}
              ${gameteChip("ab", 730, 478, true)}
            </g>
          ` : ""}
        </svg>
      `;
    }
    const cross = step >= 1;
    const swapped = step >= 2;
    const gametes = step >= 3;
    return `
      <svg class="var-svg" viewBox="0 0 1000 560" preserveAspectRatio="xMidYMid meet" aria-label="基因重组动态模拟">
        <defs>${gradients()}</defs>
        <text x="500" y="72" text-anchor="middle" fill="#1e293b" font-size="58" font-weight="950" letter-spacing="8">基因重组</text>
        ${label(CROSSOVER_STEPS[step], 500, 116, 22, "#67e8f9")}
        <g transform="translate(0 ${gametes ? -20 : 0})">
          ${chromosome(["A", "B", "C"], 360, 218, { hot: cross ? [1] : [] })}
          ${chromosome(["a", "b", "c"], 640, 218, { hot: cross ? [1] : [] })}
          <text x="360" y="195" text-anchor="middle" fill="#d1fae5" font-size="15" font-weight="900">来自父方</text>
          <text x="640" y="195" text-anchor="middle" fill="#bae6fd" font-size="15" font-weight="900">来自母方</text>
          ${cross ? `<path d="M 430 240 C 492 180 508 300 570 240" fill="none" stroke="#fbbf24" stroke-width="7" stroke-linecap="round" class="var-pulse"></path><text x="500" y="174" text-anchor="middle" fill="#fde68a" font-size="16" font-weight="900">交叉互换</text>` : ""}
          ${swapped ? `<g class="var-pop">${chromosome(["A", "b", "C"], 360, 332, { compact: true, hot: [1] })}${chromosome(["a", "B", "c"], 640, 332, { compact: true, hot: [1] })}<text x="500" y="410" text-anchor="middle" fill="#fef3c7" font-size="16" font-weight="900">重组型染色单体出现：AbC 与 aBc</text></g>` : ""}
        </g>
        ${gametes ? `
          <g class="var-pop">
            <text x="500" y="446" text-anchor="middle" fill="#c4b5fd" font-size="18" font-weight="950">进入配子后，亲本型和重组型同时产生</text>
            ${chromosome(["A","B","C"], 220, 486, { compact: true })}
            ${chromosome(["a","b","c"], 405, 486, { compact: true })}
            ${chromosome(["A","b","C"], 590, 486, { compact: true, hot: [1] })}
            ${chromosome(["a","B","c"], 775, 486, { compact: true, hot: [1] })}
            <text x="312" y="536" text-anchor="middle" fill="#94a3b8" font-size="13" font-weight="900">亲本型</text>
            <text x="682" y="536" text-anchor="middle" fill="#fde68a" font-size="13" font-weight="900">重组型</text>
          </g>
        ` : ""}
      </svg>
    `;
  }

  function renderChromosome(state) {
    const data = CHROM_TYPES[state.chrom];
    const step = state.step;
    const isTri = state.chrom === "trisomy";
    const isPoly = state.chrom === "polyploid";
    const isTrans = state.chrom === "translocation";
    return `
      <svg class="var-svg" viewBox="0 0 1000 560" preserveAspectRatio="xMidYMid meet" aria-label="染色体变异动态模拟">
        <defs>${gradients()}</defs>
        <text x="500" y="72" text-anchor="middle" fill="#1e293b" font-size="58" font-weight="950" letter-spacing="8">染色体变异</text>
        ${label(data.short, 500, 116, 22, "#67e8f9")}
        ${isTri ? `
          <g>
            ${chromosome(["A","B","C","D"], 350, 210, {})}
            ${chromosome(["A","B","C","D"], 650, 210, {})}
            ${step >= 1 ? `<path d="M 500 250 V 330" stroke="#fbbf24" stroke-width="6" stroke-linecap="round" stroke-dasharray="8 8" class="var-pulse"></path><text x="500" y="302" text-anchor="middle" fill="#fde68a" font-size="16" font-weight="900">减数分裂不分离</text>` : ""}
            ${step >= 2 ? `<g class="var-pop">${chromosome(["A","B","C","D"], 260, 382, { compact: true })}${chromosome(["A","B","C","D"], 500, 382, { compact: true })}${chromosome(["A","B","C","D"], 740, 382, { compact: true })}<text x="500" y="472" text-anchor="middle" fill="#fde68a" font-size="18" font-weight="950">某一号染色体出现三条：三体</text></g>` : ""}
          </g>
        ` : isPoly ? `
          <g>
            <text x="500" y="168" text-anchor="middle" fill="#cbd5e1" font-size="15" font-weight="900">正常二倍体：两套染色体组</text>
            ${chromosome(["A","B","C","D"], 340, 206, { compact: true })}
            ${chromosome(["A","B","C","D"], 660, 206, { compact: true })}
            ${step >= 1 ? `<g class="var-pop"><path d="M 500 270 V 326" stroke="#fde047" stroke-width="6" stroke-linecap="round" stroke-dasharray="8 8"></path><text x="500" y="304" text-anchor="middle" fill="#fef08a" font-size="16" font-weight="950">染色体组整体加倍或配子未减数</text></g>` : ""}
            ${step >= 2 ? `<g class="var-pop"><text x="500" y="364" text-anchor="middle" fill="#67e8f9" font-size="17" font-weight="950">整套增加：不是某一条多出，而是一整组同时增加</text>${chromosome(["A","B","C","D"], 250, 390, { compact: true, hot: [0,1,2,3] })}${chromosome(["A","B","C","D"], 500, 390, { compact: true, hot: [0,1,2,3] })}${chromosome(["A","B","C","D"], 750, 390, { compact: true, hot: [0,1,2,3] })}<text x="500" y="470" text-anchor="middle" fill="#fde68a" font-size="18" font-weight="950">三套染色体组：多倍体</text></g>` : ""}
          </g>
        ` : `
          <g>
            <text x="500" y="178" text-anchor="middle" fill="#cbd5e1" font-size="15" font-weight="900">正常片段顺序</text>
            ${chromosome(["A","B","C","D","E"], 500, 202, {})}
            ${step >= 1 ? `<g class="var-pop"><path d="M 416 270 L 416 322 M 582 270 L 582 322" stroke="#f87171" stroke-width="6" stroke-linecap="round"></path><text x="500" y="304" text-anchor="middle" fill="#fecaca" font-size="16" font-weight="900">染色体断裂</text></g>` : ""}
            ${step >= 2 ? `<g class="var-pop"><text x="500" y="362" text-anchor="middle" fill="#fde68a" font-size="16" font-weight="900">${esc(data.mark)}</text>${chromosome(data.segments, 500, 386, { hot: [2, 3] })}${isTrans ? chromosome(data.other, 500, 458, { compact: true, hot: [2, 3] }) : ""}</g>` : ""}
          </g>
        `}
        <g transform="translate(500 510)" opacity="${step >= 3 ? 1 : .18}">
          <rect x="-350" y="-28" width="700" height="56" rx="18" fill="rgba(15,23,42,.72)" stroke="rgba(255,255,255,.1)"></rect>
          <text x="0" y="6" text-anchor="middle" fill="${step >= 3 ? "#fde68a" : "#94a3b8"}" font-size="16" font-weight="950">${esc(data.result)}</text>
        </g>
      </svg>
    `;
  }

  function renderStage(container, state) {
    const visual = state.mode === "overview"
      ? renderOverview(state)
      : state.mode === "gene"
      ? renderGene(state)
      : state.mode === "recombine"
        ? renderRecombine(state)
        : renderChromosome(state);
    container.innerHTML = `
      <div class="var-stage">
        <div class="var-shell">
          <div class="var-canvas">${visual}</div>
        </div>
      </div>
    `;
  }

  function modeStepLabels(state) {
    if (state.mode === "overview") return ["疾病图谱", "代表病例", "证据链", "判别路径"];
    if (state.mode === "gene") return ["原序列", "诱变", "序列改变", "结果比较"];
    if (state.mode === "recombine") {
      return state.recomb === "independent"
        ? ["配对", "随机排列", "独立分离", "四类配子"]
        : ["联会", "交叉", "交换", "重组配子"];
    }
    if (state.mode === "chromosome" && state.chrom === "polyploid") return ["二倍体", "组加倍", "多倍体", "影响"];
    return ["正常", "断裂/异常", "重排/增减", "影响"];
  }

  function geneConclusion(type) {
    if (type === "substitution") return "不改变读取框，重点看被替换的密码子是否改变氨基酸。";
    if (type === "insertion") return "插入 1 个碱基会推动后续分组，容易造成移码。";
    return "缺失 1 个碱基会拉动后续分组，容易造成移码。";
  }

  function teachingTask(state) {
    if (state.mode === "overview") {
      const item = OVERVIEW_CASES[state.caseKey] || OVERVIEW_CASES.albino;
      if (state.step === 0) {
        return {
          prompt: "人类遗传病分类首先看什么？",
          choices: [
            {
              key: "cause",
              label: "致病因素层级",
              correct: true,
              explain: "对。单基因、多基因、染色体异常的分类依据是病因所在层级。"
            },
            {
              key: "symptom",
              label: "只看症状表现",
              correct: false,
              explain: "不够。症状能提示疾病，但归类必须回到基因或染色体层级证据。"
            }
          ]
        };
      }
      if (state.step === 1) {
        return {
          prompt: `${item.label} 归类时先抓哪类证据？`,
          choices: [
            {
              key: "level",
              label: item.level,
              correct: true,
              explain: `对。题干证据是“${item.clue}”。`
            },
            {
              key: "guess",
              label: "只看症状表现",
              correct: false,
              explain: "不够。症状表现能提示疾病，但分类要回到致病因素层级。"
            }
          ]
        };
      }
      if (state.step === 2) {
        return {
          prompt: `${item.label} 属于哪类遗传病？`,
          choices: [
            {
              key: "type",
              label: item.type,
              correct: true,
              explain: `对。${item.result}`
            },
            {
              key: "not",
              label: "环境引起的变异",
              correct: false,
              explain: "不对。该病例涉及基因或染色体层级异常，属于遗传病范畴。"
            }
          ]
        };
      }
      return {
        prompt: "区分单基因病和多基因病的关键是什么？",
        choices: [
          {
            key: "single",
            label: "是否主要由一对基因控制",
            correct: true,
            explain: "对。单基因病主要由一对等位基因控制，多基因病由多对基因与环境共同作用。"
          },
          {
            key: "common",
            label: "是否比较常见",
            correct: false,
            explain: "不稳。常见程度不是分类标准，病因层级才是关键。"
          }
        ]
      };
    }
    if (state.mode === "gene") {
      const isFrameShift = state.mutation !== "substitution";
      if (state.step === 0) {
        return {
          prompt: "正常 DNA 片段读取时，三联体应该怎样分组？",
          choices: [
            {
              key: "normal",
              label: "ATG / CGA / TTC",
              correct: true,
              explain: "对。读取框从第一个碱基开始，连续按 3 个碱基一组形成密码子。"
            },
            {
              key: "wrongframe",
              label: "AT / GCG / ATT",
              correct: false,
              explain: "不对。密码子不是 2 个一组，必须连续按 3 个碱基一组读取。"
            }
          ]
        };
      }
      if (state.step === 1) {
        return {
          prompt: "诱变因素首先改变的是哪个层级？",
          choices: [
            {
              key: "dna",
              label: "DNA 碱基序列",
              correct: true,
              explain: "对。基因突变的本质是 DNA 碱基序列发生改变。"
            },
            {
              key: "chromcount",
              label: "染色体条数",
              correct: false,
              explain: "不对。染色体条数改变属于染色体数目变异，不是基因突变的本质。"
            }
          ]
        };
      }
      if (state.step === 3) {
        return {
          prompt: "结果比较时，应该重点比较哪两层？",
          choices: [
            {
              key: "codonprotein",
              label: "密码子和氨基酸",
              correct: true,
              explain: "对。序列变化是否影响性状，要继续看密码子和翻译出的氨基酸是否改变。"
            },
            {
              key: "coloronly",
              label: "只看碱基颜色",
              correct: false,
              explain: "不够。颜色只是帮助定位，真正要比较的是密码子读法和氨基酸结果。"
            }
          ]
        };
      }
      return {
        prompt: isFrameShift ? "这一类突变最需要盯住什么规律？" : "碱基替换后，最关键的判断是什么？",
        choices: [
          {
            key: "frame",
            label: isFrameShift ? "读取框会错位" : "读取框不整体错位",
            correct: true,
            explain: isFrameShift
              ? "对。插入或缺失不是只动一个点，它会把后面的三联体分组整体推偏。"
              : "对。替换只改对应位置，后续三联体仍按原来的 3 个一组读取。"
          },
          {
            key: "single",
            label: isFrameShift ? "只影响一个密码子" : "后续全都移码",
            correct: false,
            explain: isFrameShift
              ? "再看左侧突变后序列：少一个或多一个碱基后，后面的分组起点变了。"
              : "再看左侧序列长度：替换没有增加或减少碱基，所以后续分组不会整体错位。"
          }
        ]
      };
    }
    if (state.mode === "recombine") {
      if (state.recomb === "independent") {
        if (state.step === 3) {
          return {
            prompt: "自由组合最后会形成什么结果？",
            choices: [
              {
                key: "four",
                label: "多种配子组合",
                correct: true,
                explain: "对。非同源染色体独立分离，已有等位基因形成 AB、Ab、aB、ab 等组合。"
              },
              {
                key: "mutation",
                label: "产生新基因",
                correct: false,
                explain: "不对。自由组合改变组合方式，不改变基因本身的碱基序列。"
              }
            ]
          };
        }
        return {
          prompt: "自由组合发生在哪类染色体之间？",
          choices: [
            {
              key: "nonhomologous",
              label: "非同源染色体",
              correct: true,
              explain: "对。A/a 这一对和 B/b 这一对互不属于同源染色体，所以能独立组合。"
            },
            {
              key: "samegene",
              label: "同一基因内部",
              correct: false,
              explain: "不对。基因内部碱基改变属于基因突变，不是自由组合。"
            }
          ]
        };
      }
      return {
        prompt: "交叉互换后，遗传信息发生了哪种变化？",
        choices: [
          {
            key: "mix",
            label: "原有等位基因重排",
            correct: true,
            explain: "对。基因重组不制造新基因，而是把已有等位基因重新组合进配子。"
          },
          {
            key: "newgene",
            label: "产生全新基因",
            correct: false,
            explain: "不对。左侧只是交换片段位置，A、B、C 这些基因本身没有变成新基因。"
          }
        ]
      };
    }
    const isNumber = state.chrom === "trisomy";
    const isPoly = state.chrom === "polyploid";
    if (isPoly) {
      return {
        prompt: "多倍体和三体最大的区别是什么？",
        choices: [
          {
            key: "set",
            label: "整套染色体组增加",
            correct: true,
            explain: "对。多倍体是染色体组整体增加，三体通常是某一号染色体多一条。"
          },
          {
            key: "one",
            label: "只多一条染色体",
            correct: false,
            explain: "不对。只多一条更接近三体；多倍体强调整套染色体组增加。"
          }
        ]
      };
    }
    return {
      prompt: "这一次染色体变异应该归到哪一类？",
      choices: [
        {
          key: "structure",
          label: "结构变异",
          correct: !isNumber,
          explain: isNumber
            ? "三体不是片段顺序改变，而是某一号染色体多出一条。"
            : "对。缺失、重复、倒位、易位都改变染色体片段的数量或排列。"
        },
        {
          key: "number",
          label: "数目变异",
          correct: isNumber,
          explain: isNumber
            ? "对。三体的核心是染色体条数增加，属于染色体数目变异。"
            : "不对。当前模拟改变的是片段层级，不是整条染色体数量。"
        }
      ]
    };
  }

  function codonLabel(codon) {
    return codon.length < 3 ? `${codon}（不完整）` : codon;
  }

  function readout(state) {
    if (state.mode === "overview") {
      const item = OVERVIEW_CASES[state.caseKey] || OVERVIEW_CASES.albino;
      return {
        title: item.label,
        lines: [
          ["病因层级", item.level],
          ["遗传特点", item.short],
          ["疾病类型", state.step >= 2 ? item.type : item.clue]
        ]
      };
    }
    if (state.mode === "gene") {
      const item = MUTATION_TYPES[state.mutation];
      return {
        title: item.short,
        lines: [
          ["原密码子", item.codonsBefore.join(" / ")],
          ["变后密码子", state.step >= 3 ? item.codonsAfter.map(codonLabel).join(" / ") : "--"],
          ["规律", geneConclusion(state.mutation)]
        ]
      };
    }
    if (state.mode === "recombine") {
      if (state.recomb === "independent") {
        return {
          title: RECOMB_TYPES.independent.short,
          lines: [
            ["亲代基因", "AaBb"],
            ["配子组合", state.step >= 3 ? "AB / Ab / aB / ab" : "--"],
            ["本质", "非同源染色体上的非等位基因自由组合"]
          ]
        };
      }
      return {
        title: "同源染色体交叉互换",
        lines: [
          ["亲本型", "ABC / abc"],
          ["重组型", state.step >= 3 ? "AbC / aBc" : "--"],
          ["本质", "原有基因重新组合，不产生新基因"]
        ]
      };
    }
    const item = CHROM_TYPES[state.chrom];
    return {
      title: item.short,
      lines: [
        ["类型", item.label],
        ["关键变化", state.step >= 2 ? item.mark : "--"],
        ["影响", state.step >= 3 ? item.result : "--"]
      ]
    };
  }

  function renderPanel(panel, state) {
    if (!panel) return;
    const panelHeight = panel.clientHeight || (panel.getBoundingClientRect ? panel.getBoundingClientRect().height : 0);
    const fit = panelHeight > 0 && panelHeight <= 570
      ? "micro"
      : panelHeight > 0 && panelHeight <= 740
        ? "short"
        : panelHeight > 0 && panelHeight <= 820
          ? "compact"
          : panelHeight > 0 && panelHeight <= 900
            ? "medium"
            : "normal";
    panel.setAttribute("data-fit", fit);
    const mode = MODES[state.mode];
    const max = mode.maxStep;
    const labels = modeStepLabels(state);
    const data = readout(state);
    const task = teachingTask(state);
    const picked = task.choices.find((choice) => choice.key === state.answer);
    panel.innerHTML = `
      <section class="var-card">
        <div class="var-head">
          <div class="var-title">
            <div class="var-eyebrow">变异动态沙盘</div>
            <h3>${esc(mode.label)}</h3>
            <p>${esc(mode.brief)}</p>
          </div>
          <div class="var-badge"><strong>${state.step + 1}/${max + 1}</strong><span>${esc(labels[state.step])}</span></div>
        </div>
      </section>

      <section class="var-card">
        <div class="var-card-head"><span>变异层级</span><strong>${esc(mode.brief)}</strong></div>
        <div class="var-mode-grid">
          ${Object.keys(MODES).map((key) => `<button type="button" data-action="mode" data-mode="${key}" class="${state.mode === key ? "is-active" : ""}">${esc(MODES[key].label)}</button>`).join("")}
        </div>
      </section>

      ${state.mode === "overview" ? `
        <section class="var-card">
          <div class="var-card-head"><span>遗传病案例</span><strong>${esc(OVERVIEW_CASES[state.caseKey].short)}</strong></div>
          <div class="var-type-grid var-case-grid">
            ${Object.keys(OVERVIEW_CASES).map((key) => `<button type="button" data-action="case" data-type="${key}" class="${state.caseKey === key ? "is-active" : ""}">${esc(OVERVIEW_CASES[key].label)}</button>`).join("")}
          </div>
        </section>
      ` : ""}

      ${state.mode === "gene" ? `
        <section class="var-card">
          <div class="var-card-head"><span>突变方式</span><strong>${esc(MUTATION_TYPES[state.mutation].short)}</strong></div>
          <div class="var-type-grid">
            ${Object.keys(MUTATION_TYPES).map((key) => `<button type="button" data-action="mutation" data-type="${key}" class="${state.mutation === key ? "is-active" : ""}">${esc(MUTATION_TYPES[key].label)}</button>`).join("")}
          </div>
        </section>
      ` : ""}

      ${state.mode === "recombine" ? `
        <section class="var-card">
          <div class="var-card-head"><span>重组机制</span><strong>${esc(RECOMB_TYPES[state.recomb].short)}</strong></div>
          <div class="var-type-grid var-recomb-grid">
            ${Object.keys(RECOMB_TYPES).map((key) => `<button type="button" data-action="recomb" data-type="${key}" class="${state.recomb === key ? "is-active" : ""}">${esc(RECOMB_TYPES[key].label)}</button>`).join("")}
          </div>
        </section>
      ` : ""}

      ${state.mode === "chromosome" ? `
        <section class="var-card">
          <div class="var-card-head"><span>变异方式</span><strong>${esc(CHROM_TYPES[state.chrom].short)}</strong></div>
          <div class="var-type-grid var-chrom-grid">
            ${Object.keys(CHROM_TYPES).map((key) => `<button type="button" data-action="chrom" data-type="${key}" class="${state.chrom === key ? "is-active" : ""}">${esc(CHROM_TYPES[key].label)}</button>`).join("")}
          </div>
        </section>
      ` : ""}

      <section class="var-card var-progress">
        <div class="var-card-head"><span>推演步骤</span><strong>${esc(labels[state.step])}</strong></div>
        <div class="var-step-grid">
          ${labels.map((item, index) => `<button type="button" data-action="step" data-step="${index}" class="var-step ${index === state.step ? "is-active" : ""} ${index < state.step ? "is-done" : ""}"><b>${index + 1}</b><span>${esc(item)}</span></button>`).join("")}
        </div>
      </section>

      <section class="var-card var-task-card">
        <div class="var-task">
          <div class="var-kicker">互动判断</div>
          <div class="var-task-prompt">${esc(task.prompt)}</div>
          <div class="var-answer-grid">
            ${task.choices.map((choice) => {
              const cls = state.answer
                ? choice.correct
                  ? "is-correct"
                  : choice.key === state.answer
                    ? "is-wrong"
                    : ""
                : "";
              return `<button type="button" data-action="answer" data-choice="${esc(choice.key)}" class="${cls}">${esc(choice.label)}</button>`;
            }).join("")}
          </div>
          <div class="var-feedback ${picked ? picked.correct ? "is-correct" : "is-wrong" : ""}">${esc(picked ? picked.explain : "等待判定")}</div>
        </div>
      </section>

      <section class="var-card">
        <div class="var-card-head"><span>操作</span><strong>手动推演</strong></div>
        <div class="var-action-grid">
          <button type="button" data-action="reset">重置</button>
          <button type="button" data-action="next" class="is-hot" ${state.step >= max ? "disabled" : ""}>${state.step >= max ? "本类完成" : "播放下一步"}</button>
        </div>
      </section>

      <section class="var-card readout">
        <div class="var-card-head"><span>判读</span><strong>${esc(data.title)}</strong></div>
        <div class="var-readout-grid">
          ${data.lines.map(([k, v]) => `<div class="var-readout-line"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join("")}
        </div>
      </section>
    `;
  }

  function preparePanel(panel) {
    if (!panel) return null;
    const previous = {
      className: panel.className,
      style: panel.getAttribute("style") || ""
    };
    panel.className = "var-panel";
    panel.setAttribute("data-panel-version", "variation-op1-20260428");
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
      const style = document.createElement("style");
      style.textContent = css();
      document.head.appendChild(style);
      const panelSnapshot = preparePanel(panel);

      const render = () => {
        renderStage(container, state);
        renderPanel(panel, state);
      };

      const onPanelClick = (event) => {
        const control = event.target.closest && event.target.closest("[data-action]");
        if (!control || !panel || !panel.contains(control)) return;
        const action = control.getAttribute("data-action");
        if (action === "mode") {
          const nextMode = control.getAttribute("data-mode");
          if (MODES[nextMode]) {
            state.mode = nextMode;
            state.step = 0;
            state.answer = "";
          }
        }
        if (action === "mutation") {
          const nextType = control.getAttribute("data-type");
          if (MUTATION_TYPES[nextType]) {
            state.mutation = nextType;
            state.step = 0;
            state.answer = "";
          }
        }
        if (action === "case") {
          const nextType = control.getAttribute("data-type");
          if (OVERVIEW_CASES[nextType]) {
            state.caseKey = nextType;
            state.step = Math.max(1, state.step);
            state.answer = "";
          }
        }
        if (action === "recomb") {
          const nextType = control.getAttribute("data-type");
          if (RECOMB_TYPES[nextType]) {
            state.recomb = nextType;
            state.step = 0;
            state.answer = "";
          }
        }
        if (action === "chrom") {
          const nextType = control.getAttribute("data-type");
          if (CHROM_TYPES[nextType]) {
            state.chrom = nextType;
            state.step = 0;
            state.answer = "";
          }
        }
        if (action === "step") {
          const nextStep = Number(control.getAttribute("data-step"));
          if (Number.isFinite(nextStep)) {
            state.step = Math.max(0, Math.min(MODES[state.mode].maxStep, nextStep));
            state.answer = "";
          }
        }
        if (action === "answer") {
          const nextAnswer = control.getAttribute("data-choice") || "";
          state.answer = nextAnswer;
        }
        if (action === "reset") {
          state.step = 0;
          state.answer = "";
        }
        if (action === "next") {
          state.step = Math.min(MODES[state.mode].maxStep, state.step + 1);
          state.answer = "";
        }
        render();
      };

      if (panel) panel.addEventListener("click", onPanelClick);
      const ro = typeof ResizeObserver === "function" ? new ResizeObserver(render) : null;
      if (ro) {
        ro.observe(container);
        if (panel) ro.observe(panel);
      }

      container.__variationCleanup = function () {
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

      render();
    },
    unmount(container) {
      if (container && container.__variationCleanup) {
        container.__variationCleanup();
        delete container.__variationCleanup;
      }
      if (container) container.innerHTML = "";
    }
  };
})();
