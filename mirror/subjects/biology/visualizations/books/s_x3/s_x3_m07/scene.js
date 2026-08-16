window.BIO_VISUAL_SCENES = window.BIO_VISUAL_SCENES || {};

window.BIO_VISUAL_SCENES["s_x3_m07"] = (function () {
  const TOP_SEQ = "GTAGAGCTCAAAATTCCCGGAGAGGTAGAGCA".split("");
  const BOTTOM_SEQ = TOP_SEQ.map(base => ({ A: "T", T: "A", C: "G", G: "C" }[base] || "N"));
  const BASE_WIDTH = 24;
  const TARGET_START = 6;
  const TARGET_END = 17;
  const PRIMER_LEFT_START = 6;
  const PRIMER_LEFT_LEN = 4;
  const PRIMER_RIGHT_START = 14;
  const PRIMER_RIGHT_LEN = 4;
  const ROW_SPACE = 138;
  const MAX_CYCLES = 4;

  const PHASES = [
    { id: "denaturing", label: "变性", temp: 95, color: "#38bdf8", note: "高温拆开全部双链" },
    { id: "annealing", label: "退火", temp: 55, color: "#f59e0b", note: "引物寻找互补位点" },
    { id: "extending", label: "延伸", temp: 72, color: "#10b981", note: "Taq 从引物 3' 端延伸" }
  ];

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

  function initialTemplates() {
    return [
      { id: "orig_t", type: "top", start: 0, end: TOP_SEQ.length - 1, y: 238 },
      { id: "orig_b", type: "bottom", start: 0, end: TOP_SEQ.length - 1, y: 262 }
    ];
  }

  function initialState() {
    return {
      templates: initialTemplates(),
      phase: "idle",
      cycle: 0,
      temp: 25,
      extCount: 0,
      running: false,
      autoTarget: 0,
      showBases: true,
      showTarget: true,
      selectedTemplateId: "orig_t"
    };
  }

  function phaseInfo(state) {
    return PHASES.find(item => item.id === state.phase) || {
      id: state.phase,
      label: state.phase === "complete" ? "完成" : "待启动",
      temp: state.temp,
      color: state.phase === "complete" ? "#10b981" : "#64748b",
      note: state.phase === "complete" ? "本轮产物已形成" : "点击开始进入第 1 轮"
    };
  }

  function getSubtitle(state) {
    if (state.phase === "idle") return "点击右侧开始。每一轮都会保留上一轮产生的链，不省略模板。";
    if (state.phase === "transition") return "新合成链被保留下来，准备进入下一轮升温。";
    if (state.phase === "denaturing") return `第 ${state.cycle} 轮 - 变性：${state.templates.length} 条单链模板全部分离。`;
    if (state.phase === "annealing") return `第 ${state.cycle} 轮 - 退火：引物只在互补位置结合，决定扩增边界。`;
    if (state.phase === "extending") return `第 ${state.cycle} 轮 - 延伸：Taq 酶沿模板合成新链，遇到模板末端即停止。`;
    if (state.phase === "complete") {
      if (state.cycle === 1) return "第 1 轮完成：只有一个端点被引物限定，目标长度双链还没有出现。";
      if (state.cycle === 2) return "第 2 轮完成：目标长度单链开始出现，是第 3 轮形成目标双链的模板。";
      if (state.cycle === 3) return "第 3 轮完成：两端都由引物限定的目标长度双链开始出现。";
      return "第 4 轮完成：目标片段继续指数级积累。";
    }
    return "";
  }

  function getPerfectTargetCount(state) {
    const left = PRIMER_LEFT_START;
    const right = PRIMER_RIGHT_START + PRIMER_RIGHT_LEN - 1;
    const topTargets = state.templates.filter(t => t.type === "top" && t.start === left && t.end === right).length;
    const bottomTargets = state.templates.filter(t => t.type === "bottom" && t.start === left && t.end === right).length;
    return Math.min(topTargets, bottomTargets);
  }

  function getTargetSingleCount(state) {
    const left = PRIMER_LEFT_START;
    const right = PRIMER_RIGHT_START + PRIMER_RIGHT_LEN - 1;
    return state.templates.filter(t => t.start === left && t.end === right).length;
  }

  function arrangeTemplates(templates) {
    const height = Math.max(600, (templates.length + 1) * ROW_SPACE);
    const spacing = height / (templates.length + 1);
    return [...templates]
      .sort((a, b) => a.y - b.y)
      .map((template, index) => ({ ...template, y: Math.round(spacing * (index + 1)) }));
  }

  function finalizeCycleTemplates(state) {
    const nextTemplates = [];
    state.templates.forEach(template => {
      nextTemplates.push({ ...template });

      const canBindLeft = template.type === "bottom"
        && template.start <= PRIMER_LEFT_START
        && template.end >= PRIMER_LEFT_START + PRIMER_LEFT_LEN - 1;
      const canBindRight = template.type === "top"
        && template.start <= PRIMER_RIGHT_START
        && template.end >= PRIMER_RIGHT_START + PRIMER_RIGHT_LEN - 1;

      if (canBindLeft) {
        nextTemplates.push({
          id: `T_${state.cycle}_${template.id}`,
          type: "top",
          start: PRIMER_LEFT_START,
          end: template.end,
          y: template.y - 24
        });
      }

      if (canBindRight) {
        nextTemplates.push({
          id: `B_${state.cycle}_${template.id}`,
          type: "bottom",
          start: template.start,
          end: PRIMER_RIGHT_START + PRIMER_RIGHT_LEN - 1,
          y: template.y + 24
        });
      }
    });
    return nextTemplates;
  }

  function baseTop(x, y, letter, classes) {
    return `
      <g class="${classes}" transform="translate(${x} ${y})">
        <path d="M0 0 L24 0 L24 24 L12 32 L0 24 Z" />
        <text x="12" y="16" text-anchor="middle">${escapeHtml(letter)}</text>
      </g>
    `;
  }

  function baseBottom(x, y, letter, classes) {
    return `
      <g class="${classes}" transform="translate(${x} ${y})">
        <path d="M0 0 L12 8 L24 0 L24 32 L0 32 Z" />
        <text x="12" y="24" text-anchor="middle">${escapeHtml(letter)}</text>
      </g>
    `;
  }

  function renderTemplateBases(template, state) {
    if (!state.showBases) return "";
    const isTop = template.type === "top";
    return TOP_SEQ.map((char, index) => {
      if (index < template.start || index > template.end) return "";
      const isTarget = state.showTarget && index >= TARGET_START && index <= TARGET_END;
      const classes = `pcr-base ${isTarget ? "is-target" : ""}`;
      return isTop
        ? baseTop(index * BASE_WIDTH, 0, char, classes)
        : baseBottom(index * BASE_WIDTH, 0, BOTTOM_SEQ[index], classes);
    }).join("");
  }

  function renderLeftPrimerExtension(template, state) {
    const showPrimer = !["idle", "denaturing", "transition"].includes(state.phase);
    const canBindLeft = template.type === "bottom"
      && template.start <= PRIMER_LEFT_START
      && template.end >= PRIMER_LEFT_START + PRIMER_LEFT_LEN - 1;
    if (!showPrimer || !canBindLeft) return "";

    const extLength = Math.max(0, Math.min(state.extCount, template.end - (PRIMER_LEFT_START + PRIMER_LEFT_LEN) + 1));
    const showExtension = state.phase !== "annealing";
    const taqX = (PRIMER_LEFT_START + PRIMER_LEFT_LEN + extLength) * BASE_WIDTH;

    return `
      <g class="pcr-newChain is-left" transform="translate(0 -28)">
        <text x="${PRIMER_LEFT_START * BASE_WIDTH - 15}" y="-6" class="pcr-endTag pcr-red" text-anchor="end">5'</text>
        <text x="${(PRIMER_LEFT_START + PRIMER_LEFT_LEN + extLength) * BASE_WIDTH + 10}" y="-6" class="pcr-endTag pcr-red" text-anchor="start">3'</text>
        <rect class="pcr-primerBack is-left" x="${PRIMER_LEFT_START * BASE_WIDTH}" y="-10" width="${PRIMER_LEFT_LEN * BASE_WIDTH}" height="10" rx="3" />
        ${TOP_SEQ.slice(PRIMER_LEFT_START, PRIMER_LEFT_START + PRIMER_LEFT_LEN).map((char, index) => (
          baseTop((PRIMER_LEFT_START + index) * BASE_WIDTH, 0, char, "pcr-base is-primer-left")
        )).join("")}
        ${showExtension ? `
          <rect class="pcr-extensionBack" x="${(PRIMER_LEFT_START + PRIMER_LEFT_LEN) * BASE_WIDTH}" y="-10" width="${extLength * BASE_WIDTH}" height="10" rx="3" />
          ${TOP_SEQ.map((char, index) => {
            const start = PRIMER_LEFT_START + PRIMER_LEFT_LEN;
            if (index >= start && index <= template.end && index - start < state.extCount) {
              return baseTop(index * BASE_WIDTH, 0, char, `pcr-base ${state.showTarget && index >= TARGET_START && index <= TARGET_END ? "is-target" : ""}`);
            }
            return "";
          }).join("")}
        ` : ""}
        ${["annealing", "extending"].includes(state.phase) ? `
          <g class="pcr-taq" transform="translate(${taqX} 0)">
            <ellipse cx="0" cy="16" rx="30" ry="23" />
            <text x="0" y="20" text-anchor="middle">Taq</text>
          </g>
        ` : ""}
      </g>
    `;
  }

  function renderRightPrimerExtension(template, state) {
    const showPrimer = !["idle", "denaturing", "transition"].includes(state.phase);
    const canBindRight = template.type === "top"
      && template.start <= PRIMER_RIGHT_START
      && template.end >= PRIMER_RIGHT_START + PRIMER_RIGHT_LEN - 1;
    if (!showPrimer || !canBindRight) return "";

    const extLength = Math.max(0, Math.min(state.extCount, PRIMER_RIGHT_START - template.start));
    const showExtension = state.phase !== "annealing";
    const taqX = (PRIMER_RIGHT_START - extLength) * BASE_WIDTH;

    return `
      <g class="pcr-newChain is-right" transform="translate(0 28)">
        <text x="${(PRIMER_RIGHT_START + PRIMER_RIGHT_LEN) * BASE_WIDTH + 15}" y="38" class="pcr-endTag pcr-indigo" text-anchor="start">5'</text>
        <text x="${(PRIMER_RIGHT_START - extLength) * BASE_WIDTH - 10}" y="38" class="pcr-endTag pcr-indigo" text-anchor="end">3'</text>
        <rect class="pcr-primerBack is-right" x="${PRIMER_RIGHT_START * BASE_WIDTH}" y="32" width="${PRIMER_RIGHT_LEN * BASE_WIDTH}" height="10" rx="3" />
        ${BOTTOM_SEQ.slice(PRIMER_RIGHT_START, PRIMER_RIGHT_START + PRIMER_RIGHT_LEN).map((char, index) => (
          baseBottom((PRIMER_RIGHT_START + index) * BASE_WIDTH, 0, char, "pcr-base is-primer-right")
        )).join("")}
        ${showExtension ? `
          <rect class="pcr-extensionBack" x="${(PRIMER_RIGHT_START - extLength) * BASE_WIDTH}" y="32" width="${extLength * BASE_WIDTH}" height="10" rx="3" />
          ${BOTTOM_SEQ.map((char, index) => {
            if (index >= template.start && index < PRIMER_RIGHT_START && PRIMER_RIGHT_START - 1 - index < state.extCount) {
              return baseBottom(index * BASE_WIDTH, 0, char, `pcr-base ${state.showTarget && index >= TARGET_START && index <= TARGET_END ? "is-target" : ""}`);
            }
            return "";
          }).join("")}
        ` : ""}
        ${["annealing", "extending"].includes(state.phase) ? `
          <g class="pcr-taq" transform="translate(${taqX} 0)">
            <ellipse cx="0" cy="16" rx="30" ry="23" />
            <text x="0" y="20" text-anchor="middle">Taq</text>
          </g>
        ` : ""}
      </g>
    `;
  }

  function renderTemplateRow(template, state) {
    const isTop = template.type === "top";
    const isPerfectTarget = template.start === PRIMER_LEFT_START
      && template.end === PRIMER_RIGHT_START + PRIMER_RIGHT_LEN - 1;
    const backboneY = isTop ? -10 : 32;
    const width = (template.end - template.start + 1) * BASE_WIDTH;
    const x = template.start * BASE_WIDTH;
    const selected = state.selectedTemplateId === template.id;

    return `
      <g class="pcr-templateRow ${selected ? "is-selected" : ""} ${isPerfectTarget ? "is-perfect" : ""}" data-template-id="${escapeHtml(template.id)}" transform="translate(116 ${template.y})">
        <rect class="pcr-templateHit" x="${x - 24}" y="${isTop ? -32 : -8}" width="${width + 48}" height="86" rx="18" />
        ${isPerfectTarget ? `<rect class="pcr-perfectGlow" x="${x - 8}" y="${isTop ? -18 : 26}" width="${width + 16}" height="24" rx="7" />` : ""}
        <text x="${x - 15}" y="${isTop ? -5 : 38}" class="pcr-endTag" text-anchor="end">${isTop ? "5'" : "3'"}</text>
        <text x="${x + width + 7}" y="${isTop ? -5 : 38}" class="pcr-endTag" text-anchor="start">${isTop ? "3'" : "5'"}</text>
        <rect class="pcr-backbone" x="${x}" y="${backboneY}" width="${width}" height="10" rx="3" />
        ${renderTemplateBases(template, state)}
        ${renderLeftPrimerExtension(template, state)}
        ${renderRightPrimerExtension(template, state)}
      </g>
    `;
  }

  function renderStage(state, hasExternalPanel) {
    const svgHeight = Math.max(600, (state.templates.length + 1) * ROW_SPACE);
    const phase = phaseInfo(state);
    const simulation = `
      <section class="pcr-simBox" style="--phase:${phase.color}">
        <div class="pcr-simHeader">
          <div>
            <span>PCR 扩增模拟沙盒</span>
            <strong>全链条动态追踪</strong>
          </div>
          <div class="pcr-liveBadge">
            <b>${state.cycle || 0}</b>
            <span>当前轮</span>
          </div>
        </div>

        <div class="pcr-simCanvas">
          <div class="pcr-grid"></div>
          <svg class="pcr-svg" viewBox="60 0 860 ${svgHeight}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="PCR 扩增动态模拟">
            ${state.templates.map(template => renderTemplateRow(template, state)).join("")}
          </svg>
        </div>

        <div class="pcr-statusLine">
          <strong>${escapeHtml(phase.label)} ${state.temp}°C</strong>
          <span>${escapeHtml(getSubtitle(state))}</span>
        </div>
      </section>
    `;

    if (hasExternalPanel) {
      return `<div class="pcr-stageOnly">${simulation}</div>`;
    }

    return `
      <div class="pcr-twoModule">
        ${simulation}
        <div class="pcr-inlinePanel">${renderControls(state, false)}</div>
      </div>
    `;
  }

  function renderTempMeter(state) {
    const pct = clamp(((state.temp - 20) / 80) * 100, 0, 100);
    return `
      <div class="pcr-tempMeter">
        <div class="pcr-tempBulb"><i></i></div>
        <div class="pcr-tempTrack"><i style="width:${pct}%"></i></div>
        <b>${state.temp}°C</b>
      </div>
      <div class="pcr-tempScale"><span>50°C</span><span>72°C</span><span>95°C</span></div>
    `;
  }

  function renderControls(state, external) {
    const phase = phaseInfo(state);
    const moleculeCount = Math.max(1, Math.round(state.templates.length / 2));
    const targetSingleCount = getTargetSingleCount(state);
    const perfectTargets = getPerfectTargetCount(state);
    const startLabel = state.phase === "idle" ? "开始第 1 轮" : state.phase === "complete" && state.cycle < MAX_CYCLES ? "进入下一轮" : "运行中";
    const startDisabled = !((state.phase === "idle" && state.cycle === 0) || (state.phase === "complete" && state.cycle < MAX_CYCLES));

    return `
      <aside class="pcr-opPanel ${external ? "is-external" : "is-inline"}" style="--phase:${phase.color}">
        <div class="pcr-opTop">
          <span>PCR 操作台</span>
          <h3>动态扩增追踪</h3>
          <p>左侧模拟框展示每条模板链、引物结合和 Taq 延伸。</p>
        </div>

        <section class="pcr-opSection pcr-phaseSection">
          <div class="pcr-sectionTitle">
            <span>反应阶段</span>
            <strong>${escapeHtml(phase.note)}</strong>
          </div>
          <div class="pcr-phaseTabs">
            ${PHASES.map(item => `
              <button type="button" class="${state.phase === item.id ? "is-active" : ""}" data-pcr-action="jump-phase" data-phase="${item.id}" style="--tone:${item.color}" aria-pressed="${state.phase === item.id ? "true" : "false"}">
                <b>${escapeHtml(item.label)}</b>
                <span>${item.temp}°C</span>
              </button>
            `).join("")}
          </div>
          ${renderTempMeter(state)}
        </section>

        <section class="pcr-opSection pcr-statSection">
          <div class="pcr-sectionTitle">
            <span>当前统计</span>
            <strong>第 ${state.cycle || 0} 轮</strong>
          </div>
          <div class="pcr-statGrid">
            <div><span>单链模板</span><b>${state.templates.length}</b></div>
            <div><span>双链分子</span><b>${moleculeCount}</b></div>
            <div><span>目标单链</span><b>${targetSingleCount}</b></div>
            <div class="${perfectTargets ? "is-hot" : ""}"><span>目标双链</span><b>${perfectTargets}</b></div>
          </div>
        </section>

        <section class="pcr-opSection pcr-actionSection">
          <div class="pcr-sectionTitle">
            <span>操作</span>
            <strong>${state.running ? "自动演示中" : "可手动推进"}</strong>
          </div>
          <div class="pcr-actionGrid">
            <button type="button" data-pcr-action="start-cycle" ${startDisabled ? "disabled" : ""}>${escapeHtml(startLabel)}</button>
            <button type="button" data-pcr-action="auto-three" ${state.running ? "disabled" : ""}>播放到第 3 轮</button>
            <button type="button" data-pcr-action="reset">重置模拟</button>
            <button type="button" data-pcr-action="finish-cycle" ${state.phase === "idle" || state.phase === "complete" ? "disabled" : ""}>快进本轮</button>
          </div>
        </section>

        <section class="pcr-opSection pcr-displaySection">
          <div class="pcr-sectionTitle">
            <span>显示</span>
            <strong>教学标记</strong>
          </div>
          <label class="pcr-check">
            <input type="checkbox" ${state.showBases ? "checked" : ""} data-pcr-action="toggle-bases" />
            <span>显示碱基字母</span>
          </label>
          <label class="pcr-check">
            <input type="checkbox" ${state.showTarget ? "checked" : ""} data-pcr-action="toggle-target" />
            <span>高亮目标片段和目标产物</span>
          </label>
        </section>

        <section class="pcr-opSection pcr-clue">
          <div class="pcr-sectionTitle">
            <span>判读线索</span>
            <strong>${perfectTargets ? "目标双链已出现" : "继续循环观察"}</strong>
          </div>
          <p>${escapeHtml(perfectTargets ? "第 3 轮后，两端都由引物限定的目标长度双链开始被稳定放大。" : "第 1 轮主要是一端固定，第 2 轮先出现目标长度单链。")}</p>
        </section>
      </aside>
    `;
  }

  function css() {
    return `
      .pcr-stageOnly,
      .pcr-stageOnly *,
      .pcr-twoModule,
      .pcr-twoModule *,
      .pcr-opPanel,
      .pcr-opPanel * {
        box-sizing: border-box;
      }
      .pcr-stageOnly, .pcr-twoModule {
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
      .pcr-stageOnly {
        padding: 0;
      }
      .pcr-twoModule {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 360px;
        gap: 22px;
        background: #030706;
      }
      .pcr-simBox {
        width: 100%;
        height: 100%;
        min-width: 0;
        min-height: 0;
        border-radius: 48px;
        border: 1px solid rgba(255,255,255,.08);
        background:
          radial-gradient(circle at 16% 12%, rgba(16,185,129,.16), transparent 28%),
          linear-gradient(140deg, #071b22 0%, #040b11 54%, #020507 100%);
        overflow: hidden;
        position: relative;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr) auto;
        padding: 26px;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 30px 90px rgba(0,0,0,.42);
      }
      .pcr-simHeader {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 18px;
        position: relative;
        z-index: 3;
      }
      .pcr-simHeader span, .pcr-opTop span, .pcr-sectionTitle span {
        display: block;
        color: #34d399;
        font-size: 13px;
        line-height: 1;
        font-weight: 950;
        letter-spacing: .12em;
      }
      .pcr-simHeader strong {
        display: block;
        margin-top: 8px;
        color: #fff;
        font-size: 30px;
        line-height: 1.05;
        font-weight: 950;
        letter-spacing: 0;
      }
      .pcr-liveBadge {
        width: 78px;
        height: 64px;
        border-radius: 18px;
        border: 1px solid rgba(52,211,153,.38);
        background: rgba(16,185,129,.11);
        display: grid;
        place-items: center;
        text-align: center;
      }
      .pcr-liveBadge b {
        color: #fff;
        font-size: 28px;
        line-height: .8;
        font-weight: 950;
      }
      .pcr-liveBadge span {
        color: rgba(226,232,240,.70);
        font-size: 10px;
        letter-spacing: 0;
      }
      .pcr-simCanvas {
        min-height: 0;
        margin-top: 18px;
        position: relative;
        overflow: hidden;
        border-radius: 34px;
        background: rgba(2,8,12,.32);
      }
      .pcr-grid {
        position: absolute;
        inset: 0;
        opacity: .52;
        background-image:
          linear-gradient(rgba(148,163,184,.10) 1px, transparent 1px),
          linear-gradient(90deg, rgba(148,163,184,.10) 1px, transparent 1px);
        background-size: 58px 58px;
        mask-image: radial-gradient(circle at 50% 52%, black 0 54%, transparent 78%);
      }
      .pcr-svg {
        position: relative;
        z-index: 2;
        width: 100%;
        height: 100%;
        display: block;
      }
      .pcr-statusLine {
        min-height: 58px;
        margin-top: 16px;
        border-radius: 18px;
        border: 1px solid rgba(255,255,255,.08);
        background: rgba(2,6,23,.70);
        padding: 12px 16px;
        display: grid;
        gap: 4px;
      }
      .pcr-statusLine strong {
        color: var(--phase);
        font-size: 14px;
        line-height: 1.1;
        font-weight: 950;
      }
      .pcr-statusLine span {
        color: rgba(226,232,240,.82);
        font-size: 13px;
        line-height: 1.35;
        font-weight: 700;
      }
      .pcr-templateRow {
        transition: transform 820ms cubic-bezier(.2,.8,.2,1), opacity 300ms ease;
        cursor: pointer;
      }
      .pcr-templateHit {
        fill: transparent;
        pointer-events: all;
      }
      .pcr-templateRow.is-selected .pcr-backbone {
        stroke: #67e8f9;
        filter: drop-shadow(0 0 10px rgba(103,232,249,.62));
      }
      .pcr-templateRow.is-perfect {
        filter: drop-shadow(0 0 12px rgba(16,185,129,.55));
      }
      .pcr-backbone, .pcr-extensionBack {
        fill: #1f2937;
        stroke: rgba(226,232,240,.72);
        stroke-width: 1.5;
      }
      .pcr-primerBack.is-left {
        fill: #ef4444;
        stroke: rgba(226,232,240,.72);
        stroke-width: 1.5;
      }
      .pcr-primerBack.is-right {
        fill: #6366f1;
        stroke: rgba(226,232,240,.72);
        stroke-width: 1.5;
      }
      .pcr-perfectGlow {
        fill: rgba(16,185,129,.28);
        stroke: rgba(52,211,153,.72);
        stroke-width: 2;
        animation: pcrTargetGlow 1200ms ease-in-out infinite alternate;
      }
      .pcr-base path {
        fill: #f8fafc;
        stroke: #111827;
        stroke-width: 1.4;
        stroke-linejoin: round;
      }
      .pcr-base text {
        fill: #111827;
        font-size: 12px;
        font-weight: 950;
      }
      .pcr-base.is-target path {
        fill: #fdba74;
      }
      .pcr-base.is-primer-left path {
        fill: #f87171;
      }
      .pcr-base.is-primer-right path {
        fill: #818cf8;
      }
      .pcr-endTag {
        fill: rgba(226,232,240,.76);
        font-size: 14px;
        font-weight: 950;
      }
      .pcr-red {
        fill: #fca5a5;
      }
      .pcr-indigo {
        fill: #c4b5fd;
      }
      .pcr-taq {
        transition: transform 120ms linear, opacity 300ms ease;
        opacity: .98;
      }
      .pcr-taq ellipse {
        fill: rgba(16,185,129,.24);
        stroke: #10b981;
        stroke-width: 2;
        stroke-dasharray: 5 3;
      }
      .pcr-taq text {
        fill: #bbf7d0;
        font-size: 12px;
        font-weight: 950;
      }
      .pcr-opPanel {
        --op-pad: clamp(8px, 1.25vh, 12px);
        --op-gap: clamp(5px, .9vh, 8px);
        --section-pad: clamp(6px, .95vh, 8px);
        --section-gap: clamp(4px, .72vh, 6px);
        width: 100%;
        height: 100%;
        min-height: 0;
        max-height: 100%;
        border-radius: var(--bio-scene-panel-radius, 28px);
        border: 1px solid rgba(255,255,255,.09);
        background:
          linear-gradient(180deg, rgba(18,18,18,.98), rgba(8,10,10,.98)),
          radial-gradient(circle at 30% 0%, rgba(16,185,129,.12), transparent 36%);
        color: #f8fafc;
        padding: var(--op-pad);
        overflow-x: hidden;
        overflow-y: auto;
        overscroll-behavior: contain;
        scrollbar-width: none;
        touch-action: pan-y;
        display: flex;
        flex-direction: column;
        gap: var(--op-gap);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.045);
      }
      .pcr-opPanel::-webkit-scrollbar {
        width: 0;
        height: 0;
      }
      .pcr-inlinePanel {
        min-height: 0;
      }
      .pcr-opTop {
        padding: 2px 2px 0;
        flex: 0 0 auto;
      }
      .pcr-opTop h3 {
        margin: 4px 0 0;
        color: #fff;
        font-size: clamp(18px, 2.55vh, 22px);
        line-height: 1.08;
        font-weight: 950;
        letter-spacing: 0;
      }
      .pcr-opTop p {
        display: none;
        margin: 0;
        color: rgba(226,232,240,.62);
        font-size: 11px;
        line-height: 1.25;
        font-weight: 700;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .pcr-opSection {
        border: 1px solid rgba(255,255,255,.08);
        background: rgba(255,255,255,.035);
        border-radius: 14px;
        padding: var(--section-pad);
        display: grid;
        gap: var(--section-gap);
        flex: 0 0 auto;
        min-height: 0;
      }
      .pcr-sectionTitle {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }
      .pcr-sectionTitle span {
        color: rgba(148,163,184,.82);
        font-size: 11px;
        letter-spacing: .12em;
      }
      .pcr-sectionTitle strong {
        max-width: 190px;
        color: rgba(255,255,255,.90);
        font-size: 11px;
        line-height: 1.25;
        font-weight: 900;
        text-align: right;
      }
      .pcr-phaseTabs {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 6px;
      }
      .pcr-phaseTabs button, .pcr-actionGrid button {
        min-height: var(--bio-touch-target, 40px);
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,.09);
        background: rgba(255,255,255,.05);
        color: rgba(226,232,240,.74);
        cursor: pointer;
        font-weight: 950;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
        appearance: none;
      }
      .pcr-phaseTabs button {
        padding: 5px 5px;
        display: grid;
        gap: 1px;
      }
      .pcr-phaseTabs button b {
        font-size: 12px;
        line-height: 1;
      }
      .pcr-phaseTabs button span {
        font-size: 11px;
        color: rgba(226,232,240,.60);
      }
      .pcr-phaseTabs button.is-active {
        border-color: color-mix(in srgb, var(--tone), transparent 40%);
        background: color-mix(in srgb, var(--tone), transparent 84%);
        color: #fff;
      }
      .pcr-tempMeter {
        display: grid;
        grid-template-columns: 30px minmax(0, 1fr) 46px;
        align-items: center;
        gap: 0;
        position: relative;
      }
      .pcr-tempBulb {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: linear-gradient(135deg, #fb923c, #ef4444);
        display: grid;
        place-items: center;
        position: relative;
        z-index: 2;
      }
      .pcr-tempBulb i {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: rgba(255,255,255,.30);
      }
      .pcr-tempTrack {
        height: 11px;
        margin-left: -6px;
        border-radius: 0 999px 999px 0;
        border: 1px solid rgba(255,255,255,.10);
        background: rgba(255,255,255,.10);
        overflow: hidden;
      }
      .pcr-tempTrack i {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #fb923c, #ef4444);
        transition: width 700ms ease;
      }
      .pcr-tempMeter b {
        color: #fb7185;
        text-align: right;
        font-size: 15px;
        line-height: 1;
        font-weight: 950;
      }
      .pcr-tempScale {
        display: flex;
        justify-content: space-between;
        padding-left: 28px;
        padding-right: 48px;
        color: rgba(226,232,240,.46);
        font-size: 10px;
        font-weight: 900;
      }
      .pcr-statGrid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 6px;
      }
      .pcr-statGrid div {
        min-height: clamp(36px, 5.7vh, 44px);
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,.08);
        background: rgba(0,0,0,.20);
        padding: clamp(6px, 1vh, 8px);
      }
      .pcr-statGrid div.is-hot {
        border-color: rgba(52,211,153,.48);
        background: rgba(16,185,129,.13);
        box-shadow: 0 0 24px rgba(16,185,129,.12);
      }
      .pcr-statGrid span {
        display: block;
        color: rgba(226,232,240,.58);
        font-size: 11px;
        line-height: 1;
        font-weight: 850;
      }
      .pcr-statGrid b {
        display: block;
        margin-top: 3px;
        color: #fff;
        font-size: clamp(16px, 2.35vh, 19px);
        line-height: 1;
        font-weight: 950;
      }
      .pcr-actionGrid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 6px;
      }
      .pcr-actionGrid button {
        color: #f8fafc;
        font-size: 12px;
      }
      .pcr-actionGrid button:hover:not(:disabled) {
        border-color: rgba(52,211,153,.38);
        background: rgba(16,185,129,.13);
      }
      .pcr-phaseTabs button:active:not(:disabled),
      .pcr-actionGrid button:active:not(:disabled) {
        transform: scale(.985);
        border-color: rgba(52,211,153,.54);
        background: rgba(16,185,129,.18);
      }
      .pcr-phaseTabs button:focus-visible,
      .pcr-actionGrid button:focus-visible,
      .pcr-check:focus-within {
        outline: 2px solid rgba(52,211,153,.75);
        outline-offset: 2px;
      }
      .pcr-actionGrid button:disabled {
        opacity: .42;
        cursor: not-allowed;
      }
      .pcr-check {
        display: flex;
        align-items: center;
        gap: 8px;
        color: rgba(226,232,240,.76);
        font-size: 12px;
        line-height: 1.3;
        font-weight: 800;
        cursor: pointer;
        min-height: 40px;
        border-radius: 12px;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }
      .pcr-check input {
        accent-color: #10b981;
        width: 22px;
        height: 22px;
        flex: 0 0 auto;
      }
      .pcr-clue p {
        margin: 0;
        color: rgba(226,232,240,.78);
        font-size: 11px;
        line-height: 1.3;
        font-weight: 750;
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      @keyframes pcrTargetGlow {
        from { opacity: .55; }
        to { opacity: 1; }
      }
      @media (max-width: 1080px) {
        .pcr-twoModule {
          grid-template-columns: 1fr;
        }
        .pcr-twoModule .pcr-simBox {
          min-height: 560px;
        }
      }
      @media (max-height: 720px) {
        .pcr-simBox {
          border-radius: 36px;
          padding: 18px;
        }
        .pcr-simHeader strong {
          font-size: 24px;
        }
        .pcr-statusLine {
          min-height: 48px;
          margin-top: 10px;
          padding: 9px 12px;
        }
        .pcr-statusLine span {
          font-size: 12px;
        }
        .pcr-opPanel {
          gap: 6px;
          padding: 10px;
          border-radius: 24px;
        }
        .pcr-opTop {
          padding: 0;
        }
        .pcr-opTop h3 {
          margin-top: 4px;
        }
        .pcr-opTop p {
          display: none;
        }
        .pcr-opSection {
          padding: 7px;
          gap: 5px;
          border-radius: 14px;
        }
        .pcr-sectionTitle {
          align-items: center;
        }
        .pcr-sectionTitle strong {
          font-size: 10px;
          line-height: 1.15;
        }
        .pcr-phaseTabs {
          gap: 5px;
        }
        .pcr-phaseTabs button, .pcr-actionGrid button {
          min-height: 40px;
          border-radius: 10px;
        }
        .pcr-phaseTabs button b,
        .pcr-actionGrid button {
          font-size: 11px;
        }
        .pcr-phaseTabs button span,
        .pcr-tempScale {
          font-size: 9px;
        }
        .pcr-tempBulb {
          width: 28px;
          height: 28px;
        }
        .pcr-tempMeter {
          grid-template-columns: 28px minmax(0, 1fr) 44px;
        }
        .pcr-statGrid div {
          min-height: 38px;
          padding: 6px;
        }
        .pcr-statGrid b {
          font-size: 17px;
        }
        .pcr-check {
          font-size: 11px;
          line-height: 1.1;
        }
        .pcr-clue p {
          font-size: 10px;
          line-height: 1.22;
        }
      }
      @media (hover: none) {
        .pcr-actionGrid button:hover:not(:disabled) {
          border-color: rgba(255,255,255,.09);
          background: rgba(255,255,255,.05);
        }
      }
      @media (pointer: coarse) {
        .pcr-simBox,
        .pcr-opPanel {
          border-radius: 32px;
        }
        .pcr-templateRow {
          cursor: default;
        }
        .pcr-phaseTabs button,
        .pcr-actionGrid button {
          min-height: var(--bio-touch-target, 44px);
          font-size: 13px;
        }
        .pcr-check {
          min-height: 44px;
          padding: 0 8px;
          background: rgba(255,255,255,.025);
        }
        .pcr-check input {
          width: 21px;
          height: 21px;
        }
      }
      @media (pointer: coarse) and (max-height: 620px) {
        .pcr-simBox {
          border-radius: 26px;
          padding: 14px;
        }
        .pcr-simHeader {
          gap: 10px;
        }
        .pcr-simHeader span {
          font-size: 10px;
        }
        .pcr-simHeader strong {
          margin-top: 4px;
          font-size: 20px;
        }
        .pcr-liveBadge {
          width: 56px;
          height: 46px;
          border-radius: 14px;
        }
        .pcr-liveBadge b {
          font-size: 21px;
        }
        .pcr-liveBadge span {
          font-size: 8px;
        }
        .pcr-simCanvas {
          margin-top: 8px;
          border-radius: 20px;
        }
        .pcr-statusLine {
          min-height: 40px;
          margin-top: 8px;
          padding: 7px 10px;
          border-radius: 14px;
          gap: 2px;
        }
        .pcr-statusLine strong {
          font-size: 12px;
        }
        .pcr-statusLine span {
          font-size: 10px;
          line-height: 1.18;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .pcr-opPanel {
          gap: 5px;
          padding: 8px;
          border-radius: 20px;
        }
        .pcr-opTop {
          padding: 0;
        }
        .pcr-opTop span {
          font-size: 10px;
        }
        .pcr-opTop h3 {
          margin-top: 3px;
          font-size: 17px;
        }
        .pcr-opTop p,
        .pcr-tempScale {
          display: none;
        }
        .pcr-opSection {
          padding: 6px;
          gap: 5px;
          border-radius: 13px;
        }
        .pcr-sectionTitle span {
          font-size: 9px;
        }
        .pcr-sectionTitle strong {
          max-width: 154px;
          font-size: 9px;
          line-height: 1.1;
        }
        .pcr-phaseTabs,
        .pcr-actionGrid {
          gap: 5px;
        }
        .pcr-phaseTabs button,
        .pcr-actionGrid button {
          min-height: 40px;
          border-radius: 10px;
          font-size: 11px;
        }
        .pcr-phaseTabs button b {
          font-size: 11px;
        }
        .pcr-phaseTabs button span {
          font-size: 9px;
        }
        .pcr-tempBulb {
          width: 26px;
          height: 26px;
        }
        .pcr-tempBulb i {
          width: 11px;
          height: 11px;
        }
        .pcr-tempMeter {
          grid-template-columns: 26px minmax(0, 1fr) 40px;
        }
        .pcr-tempMeter b {
          font-size: 13px;
        }
        .pcr-statGrid {
          gap: 5px;
        }
        .pcr-statGrid div {
          min-height: 34px;
          padding: 5px 6px;
          border-radius: 11px;
        }
        .pcr-statGrid span {
          font-size: 9px;
        }
        .pcr-statGrid b {
          margin-top: 2px;
          font-size: 16px;
        }
        .pcr-check {
          min-height: 40px;
          padding: 0 6px;
          font-size: 10px;
        }
        .pcr-check input {
          width: 22px;
          height: 22px;
        }
        .pcr-clue p {
          font-size: 9px;
          line-height: 1.15;
          -webkit-line-clamp: 1;
        }
      }
      @media (pointer: coarse) and (max-height: 460px) {
        .pcr-opPanel {
          gap: 4px;
          padding: 6px;
          border-radius: 18px;
        }
        .pcr-opTop h3 {
          display: none;
        }
        .pcr-opSection {
          padding: 5px;
          gap: 4px;
        }
        .pcr-phaseTabs button,
        .pcr-actionGrid button {
          min-height: 40px;
          padding: 4px;
        }
        .pcr-statGrid div {
          min-height: 40px;
          padding: 4px 6px;
        }
        .pcr-check {
          min-height: 40px;
        }
        .pcr-clue {
          display: none;
        }
      }
      @media (max-height: 460px) {
        .pcr-simBox {
          min-height: 0;
          height: 100%;
          padding: 12px;
          border-radius: 24px;
        }
        .pcr-simHeader span {
          font-size: 9px;
        }
        .pcr-simHeader strong {
          margin-top: 3px;
          font-size: 18px;
        }
        .pcr-liveBadge {
          width: 50px;
          height: 42px;
          border-radius: 13px;
        }
        .pcr-liveBadge b {
          font-size: 19px;
        }
        .pcr-liveBadge span {
          font-size: 8px;
        }
        .pcr-simCanvas {
          margin-top: 7px;
          border-radius: 18px;
        }
        .pcr-statusLine {
          min-height: 36px;
          margin-top: 7px;
          padding: 6px 9px;
          border-radius: 12px;
        }
        .pcr-statusLine strong {
          font-size: 11px;
        }
        .pcr-statusLine span {
          font-size: 9px;
          line-height: 1.12;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .pcr-opPanel {
          gap: 4px;
          padding: 6px;
          border-radius: 18px;
        }
        .pcr-opTop {
          display: none;
        }
        .pcr-opSection {
          padding: 5px;
          gap: 4px;
          border-radius: 11px;
        }
        .pcr-sectionTitle span {
          font-size: 9px;
          letter-spacing: .08em;
        }
        .pcr-sectionTitle strong {
          max-width: 140px;
          font-size: 9px;
          line-height: 1.08;
        }
        .pcr-phaseTabs,
        .pcr-actionGrid,
        .pcr-statGrid {
          gap: 4px;
        }
        .pcr-phaseTabs button,
        .pcr-actionGrid button {
          min-height: 40px;
          padding: 3px;
          border-radius: 9px;
          font-size: 10px;
        }
        .pcr-phaseTabs button b {
          font-size: 10px;
        }
        .pcr-phaseTabs button span {
          font-size: 8px;
        }
        .pcr-tempBulb {
          width: 22px;
          height: 22px;
        }
        .pcr-tempBulb i {
          width: 9px;
          height: 9px;
        }
        .pcr-tempMeter {
          grid-template-columns: 22px minmax(0, 1fr) 36px;
        }
        .pcr-tempTrack {
          height: 8px;
        }
        .pcr-tempMeter b {
          font-size: 11px;
        }
        .pcr-tempScale,
        .pcr-displaySection,
        .pcr-clue {
          display: none;
        }
        .pcr-statGrid div {
          min-height: 30px;
          padding: 4px 5px;
          border-radius: 9px;
        }
        .pcr-statGrid span {
          font-size: 8px;
        }
        .pcr-statGrid b {
          margin-top: 2px;
          font-size: 14px;
        }
      }
    `;
  }

  return {
    mount(container, context) {
      container.innerHTML = "";
      container.style.width = "100%";
      container.style.height = "100%";
      container.style.overflow = "hidden";

      const externalPanel = context && context.externalPanel && context.externalPanel.nodeType === 1
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
      let timers = [];
      let interval = null;

      function clearTimers() {
        timers.forEach(timer => clearTimeout(timer));
        timers = [];
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
        state.running = false;
      }

      function later(fn, ms) {
        const timer = setTimeout(() => {
          timers = timers.filter(item => item !== timer);
          fn();
        }, ms);
        timers.push(timer);
      }

      function render() {
        container.innerHTML = `<style>${css()}</style>${renderStage(state, Boolean(externalPanel))}`;
        if (externalPanel) {
          externalPanel.innerHTML = `<style>${css()}</style>${renderControls(state, true)}`;
        }
      }

      function startCycle() {
        if (state.phase === "idle") {
          state.cycle = 1;
          state.extCount = 0;
          runCycle();
          return;
        }

        if (state.phase === "complete" && state.cycle < MAX_CYCLES) {
          state.templates = finalizeCycleTemplates(state);
          state.extCount = 0;
          state.cycle += 1;
          state.phase = "transition";
          state.temp = 25;
          render();
          later(runCycle, 260);
        }
      }

      function runCycle() {
        clearTimers();
        state.running = true;
        state.phase = "denaturing";
        state.temp = 95;
        state.templates = arrangeTemplates(state.templates);
        render();

        later(() => {
          state.phase = "annealing";
          state.temp = 55;
          render();
        }, 1700);

        later(() => {
          state.phase = "extending";
          state.temp = 72;
          state.extCount = 0;
          render();
          interval = setInterval(() => {
            state.extCount += 1;
            if (state.extCount >= TOP_SEQ.length) {
              clearInterval(interval);
              interval = null;
              later(() => {
                state.phase = "complete";
                state.running = false;
                state.temp = 72;
                render();
                if (state.autoTarget && state.cycle < state.autoTarget) {
                  later(startCycle, 650);
                } else {
                  state.autoTarget = 0;
                }
              }, 600);
            }
            render();
          }, 76);
        }, 3050);
      }

      function finishCycle() {
        if (state.phase === "idle" || state.phase === "complete") return;
        clearTimers();
        state.extCount = TOP_SEQ.length;
        state.temp = 72;
        state.phase = "complete";
        render();
      }

      function jumpPhase(phase) {
        if (!PHASES.some(item => item.id === phase)) return;
        clearTimers();
        if (state.cycle === 0) state.cycle = 1;
        state.phase = phase;
        state.temp = PHASES.find(item => item.id === phase).temp;
        if (phase === "denaturing") {
          state.templates = arrangeTemplates(state.templates);
          state.extCount = 0;
        } else if (phase === "annealing") {
          state.extCount = 0;
        } else {
          state.extCount = Math.max(6, Math.floor(TOP_SEQ.length * 0.45));
        }
        render();
      }

      function actionFromEvent(event) {
        const templateNode = event.target.closest("[data-template-id]");
        if (templateNode) {
          state.selectedTemplateId = templateNode.dataset.templateId;
          render();
          return;
        }

        const target = event.target.closest("[data-pcr-action]");
        if (!target) return;
        const action = target.dataset.pcrAction;

        if (action === "start-cycle") {
          startCycle();
          return;
        }
        if (action === "auto-three") {
          clearTimers();
          state.autoTarget = 3;
          if (state.phase === "idle") {
            state.cycle = 1;
            runCycle();
          } else if (state.phase === "complete" && state.cycle < 3) {
            startCycle();
          } else {
            state.cycle = 1;
            state.templates = initialTemplates();
            state.extCount = 0;
            runCycle();
          }
          return;
        }
        if (action === "finish-cycle") {
          finishCycle();
          return;
        }
        if (action === "jump-phase") {
          jumpPhase(target.dataset.phase);
          return;
        }
        if (action === "toggle-bases") {
          state.showBases = Boolean(target.checked);
        } else if (action === "toggle-target") {
          state.showTarget = Boolean(target.checked);
        } else if (action === "reset") {
          clearTimers();
          Object.assign(state, initialState());
        }

        render();
      }

      container.addEventListener("click", actionFromEvent);
      container.addEventListener("change", actionFromEvent);
      if (externalPanel) {
        externalPanel.addEventListener("click", actionFromEvent);
        externalPanel.addEventListener("change", actionFromEvent);
      }
      render();

      container.__pcrSceneCleanup = () => {
        clearTimers();
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
      if (container.__pcrSceneCleanup) container.__pcrSceneCleanup();
      container.innerHTML = "";
    }
  };
})();
