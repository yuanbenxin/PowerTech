window.BIO_VISUAL_SCENES = window.BIO_VISUAL_SCENES || {};

window.BIO_VISUAL_SCENES["s_b1_m05"] = (function () {
  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function toNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  const PHASES = [
    {
      id: "binding",
      title: "底物与 ATP 结合",
      index: "1",
      accent: "#06b6d4",
      summary: "葡萄糖与 ATP-Mg2+ 复合物扩散到己糖激酶活性中心，开始形成氢键和金属配位作用。",
      points: [
        "活性中心的空间结构与底物互补，决定酶的专一性。",
        "ATP 结合在特定口袋中，末端磷酸基处于待转移状态。",
        "Mg2+ 稳定 ATP 磷酸基团的负电荷，帮助反应定向。"
      ]
    },
    {
      id: "induced-fit",
      title: "诱导契合与磷酸化",
      index: "2",
      accent: "#a855f7",
      summary: "底物进入后诱导酶构象闭合，活性中心排除水分子并把葡萄糖羟基与 ATP 末端磷酸对齐。",
      points: [
        "诱导契合使酶与底物结合更紧密，不是简单静态锁钥模型。",
        "ATP 末端高能磷酸键被拉伸并变得更容易断裂。",
        "Asp、Lys 等残基参与局部电荷稳定和亲核进攻方向控制。"
      ]
    },
    {
      id: "catalysis",
      title: "催化与产物生成",
      index: "3",
      accent: "#f59e0b",
      summary: "ATP 的 Gamma 磷酸基团转移到葡萄糖 C6-OH，生成葡萄糖-6-磷酸，同时 ATP 转变为 ADP。",
      points: [
        "酶降低反应活化能，使磷酸基转移在短时间内完成。",
        "葡萄糖被磷酸化后带电，难以自由穿过细胞膜离开细胞。",
        "ATP 水解的能量与底物磷酸化过程耦联。"
      ]
    },
    {
      id: "release",
      title: "产物释放与复位",
      index: "4",
      accent: "#10b981",
      summary: "葡萄糖-6-磷酸和 ADP 离开活性中心，酶分子重新张开并恢复到下一轮催化前的状态。",
      points: [
        "产物结构与电荷改变后，对酶活性中心的亲和力下降。",
        "酶在反应前后没有被消耗，可继续参与下一轮催化。",
        "循环催化让少量酶分子支撑大量底物转化。"
      ]
    }
  ];

  const VIEW_CONTROLS = [
    { id: "view-3d", label: "3D 自由", sourceId: "view-3d" },
    { id: "view-2d", label: "2D 剖面", sourceId: "view-2d" },
    { id: "cam-front", label: "前视", sourceId: "cam-front" },
    { id: "cam-side", label: "侧视", sourceId: "cam-side" },
    { id: "cam-top", label: "顶视", sourceId: "cam-top" }
  ];

  const OBSERVATION_TASKS = [
    "切换四个反应阶段，观察葡萄糖和 ATP 如何进入活性中心。",
    "放慢反应速率，重点看诱导契合阶段酶构象闭合的时机。",
    "在 HUD 中追踪 Gamma 磷酸从 ATP 转移到葡萄糖 C6-OH 的路径。"
  ];

  const QUIZ = {
    question: "ATP 在己糖激酶催化中最直接提供的是哪一种作用？",
    options: [
      { id: "phosphate", text: "转移末端磷酸基并供能", correct: true },
      { id: "template", text: "作为酶的空间模板", correct: false },
      { id: "membrane", text: "直接形成细胞膜通道", correct: false }
    ]
  };

  const DIAGRAMS = [
    {
      id: "enzyme",
      label: "酶分子结构",
      title: "酶分子（己糖激酶）",
      img: "enzyme_diagram.png",
      desc: `
        <h3>结构特征</h3>
        <p>己糖激酶具有双叶状活性中心，葡萄糖结合位点和 ATP 结合口袋位于深沟槽内。</p>
        <h3>诱导契合</h3>
        <p>底物进入后，酶构象闭合，把反应物固定在适合磷酸基转移的位置，同时排除多余水分子。</p>
      `,
      labelText: "双叶状活性中心，负责识别葡萄糖并稳定 ATP。"
    },
    {
      id: "atp",
      label: "ATP 能量分子",
      title: "ATP 与高能磷酸键",
      img: "atp_diagram.png",
      desc: `
        <h3>分子构成</h3>
        <p>ATP 由腺苷和三个磷酸基团组成，末端 Gamma 磷酸基处于可转移状态。</p>
        <h3>能量耦联</h3>
        <p>末端磷酸基转移到葡萄糖时，ATP 转变为 ADP，能量变化与底物磷酸化同步发生。</p>
      `,
      labelText: "末端磷酸基可转移，为葡萄糖磷酸化提供能量。"
    },
    {
      id: "reaction",
      label: "磷酸化机制",
      title: "磷酸化催化机制",
      img: "catalysis_diagram.png",
      desc: `
        <h3>反应路径</h3>
        <p>葡萄糖的 C6-OH 对 ATP 末端磷酸基发起亲核进攻，生成葡萄糖-6-磷酸和 ADP。</p>
        <h3>教学要点</h3>
        <p>酶降低活化能，Mg2+ 稳定磷酸基团负电荷，使磷酸基转移按特定方向发生。</p>
      `,
      labelText: "葡萄糖获得磷酸基，生成葡萄糖-6-磷酸。"
    }
  ];

  function getPhase(id) {
    return PHASES.find(function (item) { return item.id === id; }) || PHASES[0];
  }

  function getDiagram(id) {
    return DIAGRAMS.find(function (item) { return item.id === id; }) || DIAGRAMS[0];
  }

  return {
    mount: function mount(container, context) {
      const sceneId = "enzyme-atp-source-" + Math.random().toString(36).slice(2, 9);
      const panelHost = context && context.externalPanel ? context.externalPanel : null;
      const assetBase = context && context.sceneEntry && context.sceneEntry.folder ? `${context.sceneEntry.folder}/` : "";
      const runtimeVersioner = window.BiologyApp && window.BiologyApp.appendRuntimeVersion;
      const externalPanelStyle = panelHost ? {
        overflow: panelHost.style.overflow,
        overflowY: panelHost.style.overflowY,
        overscrollBehavior: panelHost.style.overscrollBehavior,
        scrollbarWidth: panelHost.style.scrollbarWidth,
        touchAction: panelHost.style.touchAction,
        webkitOverflowScrolling: panelHost.style.webkitOverflowScrolling,
        minHeight: panelHost.style.minHeight,
        height: panelHost.style.height
      } : null;

      let disposed = false;
      let iframe = null;
      let frameReady = false;
      let framePoll = 0;
      let frameStatePoll = 0;

      const state = {
        phase: "binding",
        substrateDensity: 40,
        atpDensity: 25,
        speed: 1,
        playing: true,
        autoCycle: false,
        view: "view-3d",
        quizAnswer: "",
        quizFeedback: ""
      };

      function resolveAssetUrl(relativeUrl) {
        const rawUrl = `${assetBase}${relativeUrl}`;
        return typeof runtimeVersioner === "function" ? runtimeVersioner(rawUrl) : rawUrl;
      }

      function getFrameWindow() {
        return iframe && iframe.contentWindow ? iframe.contentWindow : null;
      }

      function getFrameDocument() {
        try {
          const frameWindow = getFrameWindow();
          return frameWindow ? frameWindow.document : null;
        } catch (error) {
          return null;
        }
      }

      function setScopedStyle() {
        const style = document.createElement("style");
        style.id = `${sceneId}-style`;
        style.textContent = `
          [data-scope="${sceneId}"] {
            width: 100%;
            height: 100%;
            min-width: 0;
            min-height: 0;
            position: relative;
            overflow: hidden;
            color: #f8fafc;
            background: #050816;
            font-family: Inter, "Microsoft YaHei", "PingFang SC", Arial, sans-serif;
          }

          [data-scope="${sceneId}"] * { box-sizing: border-box; }

          [data-scope="${sceneId}"] .enzyme-sourceStage {
            position: relative;
            width: 100%;
            height: 100%;
            overflow: hidden;
            border-radius: inherit;
            background:
              radial-gradient(circle at 46% 42%, rgba(6, 182, 212, 0.13), transparent 34%),
              linear-gradient(135deg, #040712 0%, #07111f 54%, #050816 100%);
          }

          [data-scope="${sceneId}"] .enzyme-sourceFrameWrap {
            position: absolute;
            inset: 0;
            overflow: hidden;
            border-radius: inherit;
          }

          [data-scope="${sceneId}"] .enzyme-sourceFrame {
            display: block;
            width: 100%;
            height: 100%;
            border: 0;
            background: #030308;
          }

          [data-scope="${sceneId}"] .enzyme-sourceVignette {
            pointer-events: none;
            position: absolute;
            inset: 0;
            border-radius: inherit;
            box-shadow:
              inset 0 0 88px rgba(0, 0, 0, 0.52),
              inset 0 0 0 1px rgba(255, 255, 255, 0.06);
          }

          .panel-${sceneId} {
            --phase-accent: #06b6d4;
            --phase-accent-soft: rgba(6, 182, 212, 0.14);
            color: #e5e7eb;
            display: grid;
            gap: 12px;
            font-family: Inter, "Microsoft YaHei", "PingFang SC", Arial, sans-serif;
          }

          .panel-${sceneId} * { box-sizing: border-box; }

          .panel-${sceneId} .e-card {
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 8px;
            background:
              radial-gradient(circle at 12% 8%, var(--phase-accent-soft), transparent 28%),
              rgba(15, 23, 42, 0.72);
            padding: 14px;
            box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
          }

          .panel-${sceneId} .e-eyebrow {
            display: block;
            margin-bottom: 10px;
            color: rgba(148, 163, 184, 0.9);
            font-size: 12px;
            font-weight: 900;
          }

          .panel-${sceneId} .e-title {
            margin: 0 0 8px;
            color: #ffffff;
            font-size: 17px;
            font-weight: 900;
            line-height: 1.25;
          }

          .panel-${sceneId} .e-desc {
            margin: 0;
            color: rgba(226, 232, 240, 0.78);
            font-size: 13px;
            line-height: 1.6;
          }

          .panel-${sceneId} .e-phaseGrid {
            display: grid;
            gap: 8px;
          }

          .panel-${sceneId} .e-phase {
            appearance: none;
            width: 100%;
            min-height: 48px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.035);
            color: #e5e7eb;
            cursor: pointer;
            display: grid;
            grid-template-columns: 28px minmax(0, 1fr);
            gap: 9px;
            align-items: center;
            padding: 9px 10px;
            text-align: left;
          }

          .panel-${sceneId} .e-phase:hover,
          .panel-${sceneId} .e-phase.is-active {
            border-color: color-mix(in srgb, var(--item-accent) 58%, rgba(255, 255, 255, 0.12));
            background: color-mix(in srgb, var(--item-accent) 16%, rgba(255, 255, 255, 0.035));
          }

          .panel-${sceneId} .e-phaseIndex {
            width: 28px;
            height: 28px;
            border-radius: 999px;
            display: grid;
            place-items: center;
            background: color-mix(in srgb, var(--item-accent) 18%, rgba(255, 255, 255, 0.06));
            color: var(--item-accent);
            font-size: 12px;
            font-weight: 900;
          }

          .panel-${sceneId} .e-phase strong {
            display: block;
            overflow-wrap: anywhere;
            font-size: 13px;
            line-height: 1.35;
          }

          .panel-${sceneId} .e-sliderBlock {
            display: grid;
            gap: 8px;
            margin-top: 12px;
          }

          .panel-${sceneId} .e-sliderBlock:first-of-type { margin-top: 0; }

          .panel-${sceneId} .e-sliderLabel {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            color: rgba(226, 232, 240, 0.78);
            font-size: 13px;
            font-weight: 800;
          }

          .panel-${sceneId} .e-sliderValue {
            color: #ffffff;
            font-variant-numeric: tabular-nums;
          }

          .panel-${sceneId} input[type="range"] {
            width: 100%;
            accent-color: var(--phase-accent);
          }

          .panel-${sceneId} .e-actionRow,
          .panel-${sceneId} .e-viewGrid,
          .panel-${sceneId} .e-quizGrid {
            display: grid;
            gap: 8px;
          }

          .panel-${sceneId} .e-actionRow {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            margin-top: 12px;
          }

          .panel-${sceneId} .e-viewGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            margin-top: 12px;
          }

          .panel-${sceneId} .e-action,
          .panel-${sceneId} .e-view,
          .panel-${sceneId} .e-quiz {
            appearance: none;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.04);
            color: rgba(248, 250, 252, 0.9);
            cursor: pointer;
            min-height: 36px;
            padding: 9px 10px;
            font-size: 12px;
            font-weight: 900;
          }

          .panel-${sceneId} .e-action:hover,
          .panel-${sceneId} .e-view:hover,
          .panel-${sceneId} .e-quiz:hover,
          .panel-${sceneId} .e-action.is-active,
          .panel-${sceneId} .e-view.is-active,
          .panel-${sceneId} .e-quiz.is-selected {
            border-color: color-mix(in srgb, var(--phase-accent) 62%, rgba(255, 255, 255, 0.12));
            background: color-mix(in srgb, var(--phase-accent) 18%, rgba(255, 255, 255, 0.04));
          }

          .panel-${sceneId} .e-action.is-primary {
            border-color: rgba(6, 182, 212, 0.36);
          }

          .panel-${sceneId} .e-diagramGrid {
            display: grid;
            gap: 8px;
          }

          .panel-${sceneId} .e-diagram {
            appearance: none;
            width: 100%;
            min-height: 40px;
            border: 1px solid rgba(6, 182, 212, 0.2);
            border-radius: 8px;
            background: rgba(6, 182, 212, 0.075);
            color: rgba(248, 250, 252, 0.95);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 10px 11px;
            text-align: left;
            font-size: 12px;
            font-weight: 900;
          }

          .panel-${sceneId} .e-diagram::after {
            content: "查看";
            flex: 0 0 auto;
            color: var(--phase-accent);
            font-size: 11px;
            font-weight: 900;
          }

          .panel-${sceneId} .e-diagram:hover {
            border-color: color-mix(in srgb, var(--phase-accent) 60%, rgba(255, 255, 255, 0.12));
            background: color-mix(in srgb, var(--phase-accent) 18%, rgba(255, 255, 255, 0.04));
          }

          .panel-${sceneId} .e-toggle {
            margin-top: 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            color: rgba(226, 232, 240, 0.8);
            font-size: 13px;
            font-weight: 800;
          }

          .panel-${sceneId} .e-toggle input {
            width: 18px;
            height: 18px;
            accent-color: var(--phase-accent);
          }

          .panel-${sceneId} .e-meta {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
            margin-top: 12px;
          }

          .panel-${sceneId} .e-metaPill {
            min-width: 0;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.035);
            padding: 9px;
          }

          .panel-${sceneId} .e-metaPill span {
            display: block;
            margin-bottom: 3px;
            color: rgba(148, 163, 184, 0.9);
            font-size: 11px;
            font-weight: 900;
          }

          .panel-${sceneId} .e-metaPill strong {
            display: block;
            color: #ffffff;
            font-size: 12px;
            line-height: 1.35;
          }

          .panel-${sceneId} .e-checkList {
            display: grid;
            gap: 8px;
            margin: 12px 0 0;
            padding: 0;
            list-style: none;
          }

          .panel-${sceneId} .e-checkList li {
            position: relative;
            padding-left: 16px;
            color: rgba(226, 232, 240, 0.76);
            font-size: 13px;
            line-height: 1.55;
          }

          .panel-${sceneId} .e-checkList li::before {
            content: "";
            position: absolute;
            left: 0;
            top: 0.68em;
            width: 6px;
            height: 6px;
            border-radius: 999px;
            background: var(--phase-accent);
            box-shadow: 0 0 12px var(--phase-accent);
          }

          .panel-${sceneId} .e-quizQuestion {
            margin-bottom: 10px;
            color: rgba(226, 232, 240, 0.84);
            font-size: 13px;
            font-weight: 900;
            line-height: 1.45;
          }

          .panel-${sceneId} .e-feedback {
            margin-top: 10px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(255, 255, 255, 0.035);
            padding: 10px;
            color: rgba(226, 232, 240, 0.75);
            font-size: 12px;
            line-height: 1.55;
          }

          .panel-${sceneId} .e-feedback.is-correct {
            border-color: rgba(34, 197, 94, 0.28);
            color: #bbf7d0;
            background: rgba(34, 197, 94, 0.08);
          }

          .panel-${sceneId} .e-feedback.is-wrong {
            border-color: rgba(251, 146, 60, 0.3);
            color: #fed7aa;
            background: rgba(251, 146, 60, 0.08);
          }

          @media (max-width: 680px) {
            .panel-${sceneId} .e-meta,
            .panel-${sceneId} .e-actionRow,
            .panel-${sceneId} .e-viewGrid {
              grid-template-columns: 1fr;
            }
          }
        `;
        document.head.appendChild(style);
      }

      function renderStage() {
        const sourceUrl = resolveAssetUrl("assets/source/index.html?v=e677b1a84e21");
        container.innerHTML = `
          <div class="enzyme-sourceStage">
            <div class="enzyme-sourceFrameWrap">
              <iframe class="enzyme-sourceFrame" title="酶与 ATP 源课件模拟画面" src="${escapeHtml(sourceUrl)}"></iframe>
            </div>
            <div class="enzyme-sourceVignette"></div>
          </div>
        `;
        iframe = container.querySelector("iframe");
        if (iframe) {
          iframe.addEventListener("load", handleFrameLoad);
          startFramePolling();
        }
      }

      function renderList(items) {
        return (items || []).map(function (item) {
          return `<li>${escapeHtml(item)}</li>`;
        }).join("");
      }

      function renderPanel() {
        if (!panelHost) return;
        const phase = getPhase(state.phase);
        const phaseButtons = PHASES.map(function (item) {
          return `
            <button class="e-phase${item.id === state.phase ? " is-active" : ""}" type="button" data-action="select-phase" data-value="${escapeHtml(item.id)}" style="--item-accent:${escapeHtml(item.accent)}">
              <span class="e-phaseIndex">${escapeHtml(item.index)}</span>
              <strong>${escapeHtml(item.title)}</strong>
            </button>
          `;
        }).join("");

        const viewButtons = VIEW_CONTROLS.map(function (item) {
          return `<button class="e-view${item.id === state.view ? " is-active" : ""}" type="button" data-action="select-view" data-value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</button>`;
        }).join("");

        const quizOptions = QUIZ.options.map(function (option) {
          return `<button class="e-quiz${option.id === state.quizAnswer ? " is-selected" : ""}" type="button" data-action="answer-quiz" data-value="${escapeHtml(option.id)}">${escapeHtml(option.text)}</button>`;
        }).join("");

        panelHost.innerHTML = `
          <div class="panel-${sceneId}">
            <div class="e-card">
              <span class="e-eyebrow">催化反应阶段</span>
              <div class="e-phaseGrid">${phaseButtons}</div>
            </div>

            <div class="e-card">
              <span class="e-eyebrow">浓度与控制</span>
              <label class="e-sliderBlock">
                <span class="e-sliderLabel">
                  <span>底物（葡萄糖）浓度</span>
                  <span class="e-sliderValue" data-role="substrate-density-val">${state.substrateDensity}</span>
                </span>
                <input type="range" min="10" max="100" step="1" value="${state.substrateDensity}" data-range="substrate-density">
              </label>
              <label class="e-sliderBlock">
                <span class="e-sliderLabel">
                  <span>ATP 能量分子浓度</span>
                  <span class="e-sliderValue" data-role="atp-density-val">${state.atpDensity}</span>
                </span>
                <input type="range" min="5" max="80" step="1" value="${state.atpDensity}" data-range="atp-density">
              </label>
            </div>

            <div class="e-card">
              <span class="e-eyebrow">模拟控制</span>
              <label class="e-sliderBlock">
                <span class="e-sliderLabel">
                  <span>反应速率</span>
                  <span class="e-sliderValue" data-role="speed-val">${state.speed.toFixed(1)}x</span>
                </span>
                <input type="range" min="0" max="3" step="0.1" value="${state.speed}" data-range="speed">
              </label>
              <label class="e-toggle">
                <span>自动连续循环</span>
                <input type="checkbox" data-role="auto-cycle" ${state.autoCycle ? "checked" : ""}>
              </label>
              <div class="e-actionRow">
                <button class="e-action${state.playing ? " is-active" : ""}" type="button" data-action="toggle-play">${state.playing ? "暂停" : "继续"}</button>
                <button class="e-action is-primary" type="button" data-action="next-step">下一步</button>
              </div>
              <div class="e-actionRow">
                <button class="e-action" type="button" data-action="reset-source">重置模拟</button>
              </div>
              <div class="e-viewGrid">${viewButtons}</div>
            </div>

            <div class="e-card">
              <span class="e-eyebrow">科学原理说明</span>
              <h2 class="e-title" data-role="phase-title">${escapeHtml(phase.index)}. ${escapeHtml(phase.title)}</h2>
              <p class="e-desc" data-role="phase-summary">${escapeHtml(phase.summary)}</p>
              <div class="e-meta">
                <div class="e-metaPill"><span>反应对象</span><strong>葡萄糖 + ATP</strong></div>
                <div class="e-metaPill"><span>催化酶</span><strong>己糖激酶</strong></div>
                <div class="e-metaPill"><span>能量转化</span><strong>ATP → ADP</strong></div>
                <div class="e-metaPill"><span>产物</span><strong>葡萄糖-6-磷酸</strong></div>
              </div>
              <ul class="e-checkList" data-role="phase-points">${renderList(phase.points)}</ul>
            </div>

            <div class="e-card">
              <span class="e-eyebrow">过程观察</span>
              <ul class="e-checkList">${renderList(OBSERVATION_TASKS)}</ul>
            </div>

            <div class="e-card">
              <span class="e-eyebrow">图文解释</span>
              <div class="e-diagramGrid">
                ${DIAGRAMS.map(function (item) {
                  return `<button class="e-diagram" type="button" data-action="open-diagram" data-value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</button>`;
                }).join("")}
              </div>
            </div>

            <div class="e-card">
              <span class="e-eyebrow">快速判断</span>
              <div class="e-quizQuestion">${escapeHtml(QUIZ.question)}</div>
              <div class="e-quizGrid">${quizOptions}</div>
              <div class="e-feedback" data-role="quiz-feedback">${escapeHtml(state.quizFeedback || "选择一个答案后，这里会给出即时反馈。")}</div>
            </div>
          </div>
        `;
      }

      function injectFrameStyle(frameDocument) {
        if (!frameDocument || frameDocument.getElementById(`${sceneId}-frame-style`)) return;
        const style = frameDocument.createElement("style");
        style.id = `${sceneId}-frame-style`;
        style.textContent = `
          html,
          body,
          #app {
            width: 100% !important;
            height: 100% !important;
            overflow: hidden !important;
            background: #030308 !important;
          }

          #canvas-container {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
          }

          #ui-layer {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            display: block !important;
            padding: 0 !important;
            gap: 0 !important;
            pointer-events: none !important;
            z-index: 10 !important;
          }

          .control-panel,
          .info-panel,
          .footer-panel {
            display: none !important;
          }

          #hud-panel {
            position: absolute !important;
            top: 16px !important;
            right: 16px !important;
            left: auto !important;
            bottom: auto !important;
            width: min(400px, calc(100% - 32px)) !important;
            height: 320px !important;
            z-index: 30 !important;
            padding: 12px !important;
            border-radius: 8px !important;
            pointer-events: auto !important;
            transform: none !important;
          }

          #hud-panel .hud-header {
            gap: 8px !important;
          }

          #hud-panel.bio-hud-collapsed {
            width: min(260px, calc(100% - 32px)) !important;
            height: 46px !important;
            min-height: 46px !important;
            overflow: hidden !important;
            padding: 10px 12px !important;
          }

          #hud-panel.bio-hud-collapsed .hud-header {
            border-bottom: 0 !important;
            padding-bottom: 0 !important;
          }

          #hud-panel.bio-hud-collapsed .hud-body {
            display: none !important;
          }

          #hud-panel.enlarged {
            top: 50% !important;
            right: auto !important;
            left: 50% !important;
            bottom: auto !important;
            width: min(760px, calc(100% - 40px)) !important;
            height: min(560px, calc(100% - 40px)) !important;
            transform: translate(-50%, -50%) !important;
            z-index: 80 !important;
          }

          #hud-panel .hud-title {
            font-size: 0.74rem !important;
            line-height: 1.25 !important;
          }

          #hud-panel .hud-badge {
            white-space: nowrap !important;
          }

          #hud-panel .hud-equation {
            font-size: 0.58rem !important;
            padding: 6px 8px !important;
          }

          #hud-panel .hud-subtitles {
            min-height: 44px !important;
            font-size: 0.68rem !important;
          }

          .tooltip-3d {
            z-index: 70 !important;
            display: none !important;
          }

          .bio-hud-collapse-btn {
            width: auto !important;
            min-width: 38px !important;
            height: 24px !important;
            padding: 2px 8px !important;
            color: #cbd5e1 !important;
            font-size: 11px !important;
            font-weight: 800 !important;
            line-height: 1 !important;
            white-space: nowrap !important;
          }

          .bio-click-label {
            position: absolute !important;
            z-index: 78 !important;
            width: min(260px, calc(100% - 24px)) !important;
            max-width: calc(100% - 24px) !important;
            border: 1px solid rgba(6, 182, 212, 0.28) !important;
            border-radius: 8px !important;
            background: rgba(3, 7, 18, 0.88) !important;
            box-shadow: 0 14px 34px rgba(0, 0, 0, 0.42), 0 0 24px rgba(6, 182, 212, 0.12) !important;
            backdrop-filter: blur(12px) !important;
            -webkit-backdrop-filter: blur(12px) !important;
            color: #f8fafc !important;
            pointer-events: auto !important;
            overflow: hidden !important;
          }

          .bio-click-label[hidden] {
            display: none !important;
          }

          .bio-click-label__head {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            gap: 10px !important;
            padding: 9px 10px 7px !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
          }

          .bio-click-label__title {
            min-width: 0 !important;
            overflow-wrap: anywhere !important;
            color: #ffffff !important;
            font-size: 13px !important;
            font-weight: 900 !important;
            line-height: 1.25 !important;
          }

          .bio-click-label__close {
            appearance: none !important;
            border: 1px solid rgba(255, 255, 255, 0.12) !important;
            border-radius: 999px !important;
            background: rgba(255, 255, 255, 0.06) !important;
            color: #cbd5e1 !important;
            cursor: pointer !important;
            flex: 0 0 auto !important;
            min-width: 42px !important;
            height: 24px !important;
            padding: 0 9px !important;
            font-size: 11px !important;
            font-weight: 900 !important;
          }

          .bio-click-label__close:hover {
            border-color: rgba(6, 182, 212, 0.45) !important;
            color: #67e8f9 !important;
          }

          .bio-click-label__body {
            padding: 9px 10px 10px !important;
            color: rgba(226, 232, 240, 0.82) !important;
            font-size: 12px !important;
            line-height: 1.5 !important;
          }

          body:not([data-bio-panel-diagram-open="1"]) #info-modal {
            opacity: 0 !important;
            pointer-events: none !important;
          }

          .modal-overlay {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 90 !important;
          }

          .modal-content {
            width: min(920px, calc(100% - 40px)) !important;
            max-height: min(80vh, calc(100% - 40px)) !important;
            border-radius: 8px !important;
          }

          @media (max-width: 760px) {
            #hud-panel {
              top: 10px !important;
              right: 10px !important;
              width: min(320px, calc(100% - 20px)) !important;
              height: 240px !important;
              padding: 10px !important;
            }

            #hud-panel.bio-hud-collapsed {
              width: min(232px, calc(100% - 20px)) !important;
              height: 42px !important;
              min-height: 42px !important;
            }

            #hud-panel .hud-equation {
              font-size: 0.48rem !important;
              gap: 3px !important;
            }

            #hud-panel .hud-subtitles {
              display: none !important;
            }
          }

          @media (max-width: 520px) {
            #hud-panel {
              display: none !important;
            }
          }
        `;
        frameDocument.head.appendChild(style);

        const title = frameDocument.querySelector("#hud-panel .hud-title");
        if (title) title.textContent = "活性中心结合透视";
      }

      function tuneFrameScene(frameWindow) {
        if (!frameWindow || frameWindow.__bioEnzymeAtpVisualTuned) return;
        const THREE = frameWindow.THREE;
        const scene = frameWindow.scene;
        if (!THREE || !scene || typeof scene.traverse !== "function") return;
        frameWindow.__bioEnzymeAtpVisualTuned = true;

        function hasAncestorNamed(object, name) {
          let current = object;
          while (current) {
            if (current.name === name) return true;
            current = current.parent;
          }
          return false;
        }

        scene.fog = new THREE.FogExp2(0x05080d, 0.018);
        scene.traverse(function (object) {
          if (object.isAmbientLight) {
            object.intensity = Math.min(object.intensity || 0, 0.26);
          } else if (object.isDirectionalLight) {
            object.intensity = Math.min(object.intensity || 0, 0.78);
          } else if (object.isPointLight) {
            object.intensity *= 0.55;
          }

          const material = object.material;
          if (!material) return;
          const materials = Array.isArray(material) ? material : [material];
          materials.forEach(function (mat) {
            if (!mat) return;
            const belongsToEnzyme = hasAncestorNamed(object, "enzyme");
            if (typeof mat.metalness === "number") mat.metalness = Math.min(mat.metalness, 0.18);
            if (typeof mat.roughness === "number") mat.roughness = Math.max(mat.roughness, 0.58);
            if (typeof mat.emissiveIntensity === "number") mat.emissiveIntensity *= 0.34;
            if (mat.blending === THREE.AdditiveBlending && typeof mat.opacity === "number") mat.opacity *= 0.42;
            if (!object.isPoints && belongsToEnzyme && typeof mat.opacity === "number" && mat.opacity > 0.42) {
              mat.transparent = true;
              mat.opacity = Math.min(mat.opacity, 0.42);
              mat.depthWrite = false;
            }
            if (!object.isPoints && !belongsToEnzyme && typeof mat.opacity === "number" && mat.opacity < 0.7) {
              mat.opacity *= 0.72;
            }
            mat.needsUpdate = true;
          });
        });

        const renderer = frameWindow.renderer;
        if (renderer) {
          renderer.toneMappingExposure = 0.86;
          renderer.setClearColor(0x05080d, 0);
        }

        function getActivePhase() {
          const activeButton = frameWindow.document && frameWindow.document.querySelector(".mode-btn.active");
          return activeButton && activeButton.dataset ? activeButton.dataset.phase || "binding" : "binding";
        }

        function getBaseVector(object, key, current) {
          const data = object.userData[key];
          if (data && data.corrected && current.distanceToSquared(data.corrected) < 0.000001) {
            return data.base.clone();
          }
          return current.clone();
        }

        function applyPositionOffset(object, offset) {
          const base = getBaseVector(object, "__bioPositionLayout", object.position);
          const corrected = base.clone().add(offset);
          object.position.copy(corrected);
          object.userData.__bioPositionLayout = { base: base, corrected: corrected.clone() };
        }

        function applyVisualScale(object, factor, flattenZ) {
          const base = getBaseVector(object, "__bioScaleLayout", object.scale);
          const corrected = base.clone();
          corrected.x *= factor;
          corrected.y *= factor;
          corrected.z *= factor * flattenZ;
          object.scale.copy(corrected);
          object.userData.__bioScaleLayout = { base: base, corrected: corrected.clone() };
        }

        function tuneMoleculeMaterials(root, kind) {
          if (!root || root.userData.__bioMoleculeMaterialsTuned) return;
          root.userData.__bioMoleculeMaterialsTuned = true;
          root.traverse(function (object) {
            const material = object.material;
            if (!material) return;
            const materials = Array.isArray(material) ? material : [material];
            materials.forEach(function (mat) {
              if (!mat) return;
              if (kind === "glucose" && mat.color && typeof mat.color.setHex === "function") {
                mat.color.setHex(0xfacc15);
                if (mat.emissive && typeof mat.emissive.setHex === "function") mat.emissive.setHex(0x3a2600);
                if (typeof mat.emissiveIntensity === "number") mat.emissiveIntensity = Math.max(mat.emissiveIntensity, 0.16);
              }
              if (kind === "atp" && mat.color && typeof mat.color.offsetHSL === "function") {
                mat.color.offsetHSL(0, -0.08, -0.04);
              }
              if (typeof mat.roughness === "number") mat.roughness = Math.max(mat.roughness, 0.64);
              if (typeof mat.metalness === "number") mat.metalness = Math.min(mat.metalness, 0.12);
              mat.needsUpdate = true;
            });
          });
        }

        function ensureGlucoseMarker(glucose) {
          if (!glucose || glucose.getObjectByName("glucose-clarity-marker")) return;
          const marker = new THREE.Group();
          marker.name = "glucose-clarity-marker";
          marker.position.set(0, 0, 0.42);
          const atomMaterial = new THREE.MeshStandardMaterial({
            color: 0xfacc15,
            emissive: 0x3f2600,
            emissiveIntensity: 0.18,
            metalness: 0.03,
            roughness: 0.72
          });
          const bondMaterial = new THREE.MeshStandardMaterial({
            color: 0xf59e0b,
            emissive: 0x2d1800,
            emissiveIntensity: 0.1,
            metalness: 0.02,
            roughness: 0.78
          });
          const atomGeometry = new THREE.SphereGeometry(0.105, 16, 12);
          const bondGeometry = new THREE.CylinderGeometry(0.032, 0.032, 0.42, 10);
          const radius = 0.38;
          const atoms = [];
          for (let index = 0; index < 6; index += 1) {
            const angle = Math.PI / 6 + index * Math.PI / 3;
            const atom = new THREE.Mesh(atomGeometry, atomMaterial);
            atom.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
            atom.renderOrder = 12;
            marker.add(atom);
            atoms.push(atom);
          }
          for (let index = 0; index < atoms.length; index += 1) {
            const current = atoms[index].position;
            const next = atoms[(index + 1) % atoms.length].position;
            const middle = current.clone().add(next).multiplyScalar(0.5);
            const bond = new THREE.Mesh(bondGeometry, bondMaterial);
            bond.position.copy(middle);
            bond.rotation.z = Math.atan2(next.y - current.y, next.x - current.x) - Math.PI / 2;
            bond.renderOrder = 11;
            marker.add(bond);
          }
          marker.scale.set(1.35, 1.02, 0.58);
          glucose.add(marker);
        }

        function tuneMoleculeLayout() {
          const glucose = scene.getObjectByName("glucose");
          const atp = scene.getObjectByName("atp");
          if (!glucose || !atp) return;

          tuneMoleculeMaterials(glucose, "glucose");
          tuneMoleculeMaterials(atp, "atp");
          ensureGlucoseMarker(glucose);

          glucose.renderOrder = 10;
          atp.renderOrder = 8;

          const phase = getActivePhase();
          const phaseSettings = {
            "binding": {
              glucoseOffset: new THREE.Vector3(-0.82, 0.42, 0.38),
              atpOffset: new THREE.Vector3(0.82, -0.42, -0.3),
              glucoseScale: 0.82,
              atpScale: 0.68,
              minDistance: 2.15
            },
            "induced-fit": {
              glucoseOffset: new THREE.Vector3(-0.58, 0.32, 0.42),
              atpOffset: new THREE.Vector3(0.68, -0.34, -0.32),
              glucoseScale: 0.82,
              atpScale: 0.66,
              minDistance: 1.75
            },
            "catalysis": {
              glucoseOffset: new THREE.Vector3(-0.34, 0.22, 0.46),
              atpOffset: new THREE.Vector3(0.5, -0.24, -0.34),
              glucoseScale: 0.8,
              atpScale: 0.64,
              minDistance: 1.32
            },
            "release": {
              glucoseOffset: new THREE.Vector3(-0.62, 0.36, 0.4),
              atpOffset: new THREE.Vector3(0.62, -0.34, -0.32),
              glucoseScale: 0.78,
              atpScale: 0.62,
              minDistance: 1.72
            }
          };
          const settings = phaseSettings[phase] || phaseSettings.binding;

          const glucoseBase = getBaseVector(glucose, "__bioPositionLayout", glucose.position).add(settings.glucoseOffset);
          const atpBase = getBaseVector(atp, "__bioPositionLayout", atp.position).add(settings.atpOffset);
          const separation = atpBase.clone().sub(glucoseBase);
          separation.z = 0;
          const distance = separation.length();
          if (distance < settings.minDistance) {
            if (distance < 0.001) separation.set(1, -0.35, 0);
            separation.normalize();
            const push = (settings.minDistance - Math.max(distance, 0.001)) * 0.5;
            settings.glucoseOffset.addScaledVector(separation, -push);
            settings.atpOffset.addScaledVector(separation, push);
          }

          applyPositionOffset(glucose, settings.glucoseOffset);
          applyPositionOffset(atp, settings.atpOffset);
          applyVisualScale(glucose, settings.glucoseScale, 0.72);
          applyVisualScale(atp, settings.atpScale, 0.86);
        }

        tuneMoleculeLayout();
        if (renderer && !renderer.__bioEnzymeAtpRenderPatched) {
          const originalRender = renderer.render.bind(renderer);
          renderer.render = function () {
            tuneMoleculeLayout();
            return originalRender.apply(renderer, arguments);
          };
          renderer.__bioEnzymeAtpRenderPatched = true;
        }
      }

      function injectFrameInteractions(frameWindow, frameDocument) {
        if (!frameWindow || !frameDocument || frameWindow.__bioEnzymeAtpBridgeReady) return;
        frameWindow.__bioEnzymeAtpBridgeReady = true;

        const label = frameDocument.createElement("div");
        label.className = "bio-click-label";
        label.hidden = true;
        label.innerHTML = `
          <div class="bio-click-label__head">
            <strong class="bio-click-label__title"></strong>
            <button class="bio-click-label__close" type="button">收起</button>
          </div>
          <div class="bio-click-label__body"></div>
        `;
        frameDocument.body.appendChild(label);

        const labelTitle = label.querySelector(".bio-click-label__title");
        const labelBody = label.querySelector(".bio-click-label__body");
        const labelClose = label.querySelector(".bio-click-label__close");

        function placeLabel(clientX, clientY) {
          const padding = 12;
          const rootWidth = frameWindow.innerWidth || frameDocument.documentElement.clientWidth || 800;
          const rootHeight = frameWindow.innerHeight || frameDocument.documentElement.clientHeight || 500;
          const box = label.getBoundingClientRect();
          let left = clientX + 16;
          let top = clientY - Math.max(52, box.height * 0.5);
          if (left + box.width + padding > rootWidth) left = clientX - box.width - 16;
          left = clamp(left, padding, Math.max(padding, rootWidth - box.width - padding));
          top = clamp(top, padding, Math.max(padding, rootHeight - box.height - padding));
          label.style.left = `${left}px`;
          label.style.top = `${top}px`;
        }

        function closeSourceModal() {
          const modal = frameDocument.getElementById("info-modal");
          if (modal) modal.style.display = "none";
          frameDocument.body.removeAttribute("data-bio-panel-diagram-open");
          const controls = frameWindow.controls;
          if (controls && typeof controls === "object") controls.enabled = true;
        }

        function showLabel(kind, event) {
          const diagram = getDiagram(kind);
          labelTitle.textContent = diagram.title;
          labelBody.textContent = diagram.labelText;
          label.hidden = false;
          placeLabel(event.clientX, event.clientY);
          closeSourceModal();
        }

        frameWindow.__bioShowClickLabel = showLabel;
        frameWindow.__bioHideClickLabel = function () {
          label.hidden = true;
        };
        frameWindow.__bioOpenDiagram = function (kind) {
          const diagram = getDiagram(kind);
          const modal = frameDocument.getElementById("info-modal");
          const image = frameDocument.getElementById("modal-image");
          const title = frameDocument.getElementById("modal-title");
          const desc = frameDocument.getElementById("modal-desc");
          if (!modal || !image || !title || !desc) return false;
          frameDocument.body.setAttribute("data-bio-panel-diagram-open", "1");
          image.src = diagram.img;
          title.textContent = diagram.title;
          desc.innerHTML = diagram.desc;
          modal.style.display = "flex";
          const controls = frameWindow.controls;
          if (controls && typeof controls === "object") controls.enabled = false;
          return true;
        };

        if (typeof frameWindow.openModal === "function" && !frameWindow.__bioSourceOpenModal) {
          frameWindow.__bioSourceOpenModal = frameWindow.openModal;
          frameWindow.__bioAllowPanelDiagram = false;
          frameWindow.openModal = function (kind) {
            if (frameWindow.__bioAllowPanelDiagram) {
              return frameWindow.__bioSourceOpenModal(kind);
            }
            const pointer = frameWindow.__bioLastScenePointer || {
              clientX: Math.round((frameWindow.innerWidth || 800) * 0.5),
              clientY: Math.round((frameWindow.innerHeight || 500) * 0.5)
            };
            showLabel(kind, pointer);
            return undefined;
          };
        }

        labelClose.addEventListener("click", function (event) {
          event.stopPropagation();
          label.hidden = true;
        });

        const modal = frameDocument.getElementById("info-modal");
        const modalClose = frameDocument.getElementById("modal-close");
        if (modal) {
          modal.addEventListener("click", function (event) {
            if (event.target === modal) {
              frameDocument.body.removeAttribute("data-bio-panel-diagram-open");
            }
          }, true);

          const modalObserver = new MutationObserver(function () {
            if (frameDocument.body.getAttribute("data-bio-panel-diagram-open") === "1") return;
            if (modal.style.display !== "flex") return;
            const title = frameDocument.getElementById("modal-title");
            const titleText = title ? title.textContent : "";
            let kind = "reaction";
            if (titleText.includes("ATP")) kind = "atp";
            if (titleText.includes("己糖激酶") || titleText.includes("酶分子")) kind = "enzyme";
            showLabel(kind, frameWindow.__bioLastScenePointer || {
              clientX: Math.round((frameWindow.innerWidth || 800) * 0.5),
              clientY: Math.round((frameWindow.innerHeight || 500) * 0.5)
            });
          });
          modalObserver.observe(modal, { attributes: true, attributeFilter: ["style"] });
        }
        if (modalClose) {
          modalClose.addEventListener("click", function () {
            frameDocument.body.removeAttribute("data-bio-panel-diagram-open");
          }, true);
        }

        const hudPanel = frameDocument.getElementById("hud-panel");
        const hudHeader = hudPanel ? hudPanel.querySelector(".hud-header") : null;
        if (hudPanel && hudHeader && !frameDocument.getElementById("bio-hud-collapse-btn")) {
          const button = frameDocument.createElement("button");
          button.id = "bio-hud-collapse-btn";
          button.className = "hud-action-btn bio-hud-collapse-btn interactive";
          button.type = "button";
          button.textContent = "收起";
          button.title = "收起/展开 HUD";
          hudHeader.appendChild(button);
          button.addEventListener("click", function (event) {
            event.stopPropagation();
            const collapsed = hudPanel.classList.toggle("bio-hud-collapsed");
            button.textContent = collapsed ? "展开" : "收起";
            if (collapsed) hudPanel.classList.remove("enlarged");
          });
        }

        frameWindow.addEventListener("click", function (event) {
          const target = event.target;
          if (target && target.closest && target.closest(".interactive")) return;
          frameWindow.__bioLastScenePointer = {
            clientX: event.clientX,
            clientY: event.clientY
          };

          frameWindow.setTimeout(function () {
            const modalNow = frameDocument.getElementById("info-modal");
            if (!modalNow || modalNow.style.display !== "flex") return;
            const title = frameDocument.getElementById("modal-title");
            const titleText = title ? title.textContent : "";
            let kind = "reaction";
            if (titleText.includes("ATP")) kind = "atp";
            if (titleText.includes("己糖激酶") || titleText.includes("酶分子")) kind = "enzyme";
            showLabel(kind, event);
          }, 0);
        }, true);
      }

      function clickFrame(selector) {
        const frameDocument = getFrameDocument();
        const element = frameDocument ? frameDocument.querySelector(selector) : null;
        if (!element || typeof element.click !== "function") return false;
        element.click();
        return true;
      }

      function setFrameInput(selector, value) {
        const frameWindow = getFrameWindow();
        const frameDocument = getFrameDocument();
        const element = frameDocument ? frameDocument.querySelector(selector) : null;
        if (!element) return false;
        element.value = String(value);
        const EventCtor = frameWindow && frameWindow.Event ? frameWindow.Event : Event;
        element.dispatchEvent(new EventCtor("input", { bubbles: true }));
        return true;
      }

      function setFrameCheckbox(selector, checked) {
        const frameWindow = getFrameWindow();
        const frameDocument = getFrameDocument();
        const element = frameDocument ? frameDocument.querySelector(selector) : null;
        if (!element) return false;
        if (Boolean(element.checked) !== Boolean(checked)) {
          element.checked = Boolean(checked);
          const EventCtor = frameWindow && frameWindow.Event ? frameWindow.Event : Event;
          element.dispatchEvent(new EventCtor("change", { bubbles: true }));
        }
        return true;
      }

      function openFrameDiagram(kind) {
        const frameWindow = getFrameWindow();
        const frameDocument = getFrameDocument();
        if (!frameWindow || !frameDocument) return false;
        injectFrameInteractions(frameWindow, frameDocument);
        if (typeof frameWindow.__bioOpenDiagram !== "function") return false;
        frameWindow.__bioAllowPanelDiagram = true;
        try {
          return Boolean(frameWindow.__bioOpenDiagram(kind));
        } finally {
          frameWindow.__bioAllowPanelDiagram = false;
        }
      }

      function syncFrame() {
        if (!frameReady) return;
        clickFrame(`.mode-btn[data-phase="${state.phase}"]`);
        setFrameInput("#substrate-density", state.substrateDensity);
        setFrameInput("#atp-density", state.atpDensity);
        setFrameInput("#speed-slider", state.speed);
        setFrameCheckbox("#auto-cycle-toggle", state.autoCycle);
        const view = VIEW_CONTROLS.find(function (item) { return item.id === state.view; }) || VIEW_CONTROLS[0];
        clickFrame(`#${view.sourceId}`);
        syncFramePlaying();
      }

      function syncFramePlaying() {
        const frameDocument = getFrameDocument();
        const button = frameDocument ? frameDocument.querySelector("#play-pause-btn") : null;
        const label = button ? button.querySelector("span") : null;
        if (!button || !label) return;
        const sourcePlaying = label.textContent.trim() === "暂停";
        if (sourcePlaying !== state.playing) button.click();
      }

      function readFrameState() {
        if (!frameReady) return false;
        const frameDocument = getFrameDocument();
        if (!frameDocument) return false;

        let changed = false;
        const activePhase = frameDocument.querySelector(".mode-btn.active[data-phase]");
        const nextPhase = activePhase ? activePhase.getAttribute("data-phase") : "";
        if (nextPhase && nextPhase !== state.phase) {
          state.phase = nextPhase;
          changed = true;
        }

        const subInput = frameDocument.querySelector("#substrate-density");
        const atpInput = frameDocument.querySelector("#atp-density");
        const speedInput = frameDocument.querySelector("#speed-slider");
        const autoInput = frameDocument.querySelector("#auto-cycle-toggle");
        const playLabel = frameDocument.querySelector("#play-pause-btn span");

        const nextSubstrate = Math.round(clamp(toNumber(subInput ? subInput.value : state.substrateDensity, state.substrateDensity), 10, 100));
        const nextAtp = Math.round(clamp(toNumber(atpInput ? atpInput.value : state.atpDensity, state.atpDensity), 5, 80));
        const nextSpeed = Math.round(clamp(toNumber(speedInput ? speedInput.value : state.speed, state.speed), 0, 3) * 10) / 10;
        const nextAuto = Boolean(autoInput && autoInput.checked);
        const nextPlaying = playLabel ? playLabel.textContent.trim() === "暂停" : state.playing;

        if (nextSubstrate !== state.substrateDensity) {
          state.substrateDensity = nextSubstrate;
          changed = true;
        }
        if (nextAtp !== state.atpDensity) {
          state.atpDensity = nextAtp;
          changed = true;
        }
        if (nextSpeed !== state.speed) {
          state.speed = nextSpeed;
          changed = true;
        }
        if (nextAuto !== state.autoCycle) {
          state.autoCycle = nextAuto;
          changed = true;
        }
        if (nextPlaying !== state.playing) {
          state.playing = nextPlaying;
          changed = true;
        }

        return changed;
      }

      function updatePanel() {
        if (!panelHost) return;
        const panel = panelHost.querySelector(`.panel-${sceneId}`);
        if (!panel) return;
        const phase = getPhase(state.phase);

        panel.style.setProperty("--phase-accent", phase.accent);
        panel.style.setProperty("--phase-accent-soft", `${phase.accent}24`);

        panel.querySelectorAll("[data-action='select-phase']").forEach(function (button) {
          button.classList.toggle("is-active", button.getAttribute("data-value") === state.phase);
        });
        panel.querySelectorAll("[data-action='select-view']").forEach(function (button) {
          button.classList.toggle("is-active", button.getAttribute("data-value") === state.view);
        });
        panel.querySelectorAll("[data-action='answer-quiz']").forEach(function (button) {
          button.classList.toggle("is-selected", button.getAttribute("data-value") === state.quizAnswer);
        });

        const playButton = panel.querySelector("[data-action='toggle-play']");
        if (playButton) {
          playButton.textContent = state.playing ? "暂停" : "继续";
          playButton.classList.toggle("is-active", state.playing);
        }

        setText(panel, '[data-role="substrate-density-val"]', state.substrateDensity);
        setText(panel, '[data-role="atp-density-val"]', state.atpDensity);
        setText(panel, '[data-role="speed-val"]', `${state.speed.toFixed(1)}x`);
        setInputValue(panel, '[data-range="substrate-density"]', state.substrateDensity);
        setInputValue(panel, '[data-range="atp-density"]', state.atpDensity);
        setInputValue(panel, '[data-range="speed"]', state.speed);
        setChecked(panel, '[data-role="auto-cycle"]', state.autoCycle);
        setText(panel, '[data-role="phase-title"]', `${phase.index}. ${phase.title}`);
        setText(panel, '[data-role="phase-summary"]', phase.summary);
        setHtml(panel, '[data-role="phase-points"]', renderList(phase.points));

        const feedback = panel.querySelector('[data-role="quiz-feedback"]');
        if (feedback) {
          feedback.textContent = state.quizFeedback || "选择一个答案后，这里会给出即时反馈。";
          feedback.classList.toggle("is-correct", state.quizAnswer === "phosphate");
          feedback.classList.toggle("is-wrong", Boolean(state.quizAnswer && state.quizAnswer !== "phosphate"));
        }
      }

      function setText(root, selector, value) {
        const element = root.querySelector(selector);
        if (element) element.textContent = value;
      }

      function setHtml(root, selector, value) {
        const element = root.querySelector(selector);
        if (element) element.innerHTML = value;
      }

      function setInputValue(root, selector, value) {
        const element = root.querySelector(selector);
        if (element && String(element.value) !== String(value)) element.value = String(value);
      }

      function setChecked(root, selector, checked) {
        const element = root.querySelector(selector);
        if (element) element.checked = Boolean(checked);
      }

      function configureFrame() {
        const frameWindow = getFrameWindow();
        const frameDocument = getFrameDocument();
        if (!frameWindow || !frameDocument) return false;
        if (!frameDocument.querySelector("#canvas-container canvas") || !frameDocument.querySelector("#hud-panel") || !frameDocument.querySelector("#play-pause-btn")) {
          return false;
        }

        injectFrameStyle(frameDocument);
        tuneFrameScene(frameWindow);
        injectFrameInteractions(frameWindow, frameDocument);
        frameReady = true;

        clickFrame("#reset-btn");
        state.phase = "binding";
        state.substrateDensity = 40;
        state.atpDensity = 25;
        state.speed = 1;
        state.playing = true;
        state.autoCycle = false;
        state.view = "view-3d";
        syncFrame();
        updatePanel();

        if (!frameStatePoll) {
          frameStatePoll = window.setInterval(function () {
            if (disposed) return;
            if (readFrameState()) updatePanel();
          }, 350);
        }

        return true;
      }

      function startFramePolling() {
        frameReady = false;
        if (framePoll) window.clearInterval(framePoll);
        let attempts = 0;
        framePoll = window.setInterval(function () {
          attempts += 1;
          if (disposed || configureFrame() || attempts > 180) {
            window.clearInterval(framePoll);
            framePoll = 0;
          }
        }, 100);
      }

      function handleFrameLoad() {
        startFramePolling();
      }

      function handlePanelClick(event) {
        const target = event.target.closest("[data-action]");
        if (!target) return;
        const action = target.getAttribute("data-action");
        const value = target.getAttribute("data-value") || "";

        if (action === "select-phase") {
          if (!PHASES.some(function (item) { return item.id === value; })) return;
          state.phase = value;
          state.playing = true;
          if (frameReady) clickFrame(`.mode-btn[data-phase="${state.phase}"]`);
          updatePanel();
          return;
        }

        if (action === "select-view") {
          if (!VIEW_CONTROLS.some(function (item) { return item.id === value; })) return;
          state.view = value;
          const view = VIEW_CONTROLS.find(function (item) { return item.id === state.view; });
          if (frameReady && view) clickFrame(`#${view.sourceId}`);
          updatePanel();
          return;
        }

        if (action === "toggle-play") {
          if (frameReady) clickFrame("#play-pause-btn");
          state.playing = !state.playing;
          if (frameReady) readFrameState();
          updatePanel();
          return;
        }

        if (action === "next-step") {
          state.playing = true;
          if (frameReady) {
            clickFrame("#next-step-btn");
            readFrameState();
          }
          updatePanel();
          return;
        }

        if (action === "reset-source") {
          state.phase = "binding";
          state.substrateDensity = 40;
          state.atpDensity = 25;
          state.speed = 1;
          state.playing = true;
          state.autoCycle = false;
          state.view = "view-3d";
          if (frameReady) {
            clickFrame("#reset-btn");
            syncFrame();
          }
          updatePanel();
          return;
        }

        if (action === "open-diagram") {
          if (!DIAGRAMS.some(function (item) { return item.id === value; })) return;
          openFrameDiagram(value);
          return;
        }

        if (action === "answer-quiz") {
          const answer = QUIZ.options.find(function (option) { return option.id === value; });
          if (!answer) return;
          state.quizAnswer = answer.id;
          state.quizFeedback = answer.correct
            ? "判断正确。ATP 的末端磷酸基转移到葡萄糖上，同时完成能量耦联。"
            : "再看 HUD 中的 Pγ 路径：ATP 不是模板或膜通道，而是提供可转移的末端磷酸基和能量。";
          updatePanel();
        }
      }

      function handlePanelInput(event) {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) return;

        const range = target.getAttribute("data-range");
        if (range === "substrate-density") {
          state.substrateDensity = Math.round(clamp(toNumber(target.value, 40), 10, 100));
          if (frameReady) setFrameInput("#substrate-density", state.substrateDensity);
          updatePanel();
          return;
        }

        if (range === "atp-density") {
          state.atpDensity = Math.round(clamp(toNumber(target.value, 25), 5, 80));
          if (frameReady) setFrameInput("#atp-density", state.atpDensity);
          updatePanel();
          return;
        }

        if (range === "speed") {
          state.speed = Math.round(clamp(toNumber(target.value, 1), 0, 3) * 10) / 10;
          if (frameReady) setFrameInput("#speed-slider", state.speed);
          updatePanel();
          return;
        }

        if (target.getAttribute("data-role") === "auto-cycle") {
          state.autoCycle = Boolean(target.checked);
          if (frameReady) setFrameCheckbox("#auto-cycle-toggle", state.autoCycle);
          updatePanel();
        }
      }

      function start() {
        if (disposed) return;
        container.innerHTML = "";
        container.setAttribute("data-scope", sceneId);
        container.style.position = "relative";
        container.style.width = "100%";
        container.style.height = "100%";
        container.style.minWidth = "0";
        container.style.minHeight = "0";
        container.style.overflow = "hidden";

        setScopedStyle();
        renderStage();
        renderPanel();
        updatePanel();

        if (panelHost) {
          panelHost.style.overflow = "hidden auto";
          panelHost.style.overflowY = "auto";
          panelHost.style.overscrollBehavior = "contain";
          panelHost.style.scrollbarWidth = "none";
          panelHost.style.touchAction = "pan-y";
          panelHost.style.webkitOverflowScrolling = "touch";
          panelHost.addEventListener("click", handlePanelClick);
          panelHost.addEventListener("input", handlePanelInput);
        } else {
          container.addEventListener("click", handlePanelClick);
          container.addEventListener("input", handlePanelInput);
        }
      }

      container.__bioSceneCleanup = function () {
        disposed = true;
        if (framePoll) window.clearInterval(framePoll);
        if (frameStatePoll) window.clearInterval(frameStatePoll);
        if (iframe) iframe.removeEventListener("load", handleFrameLoad);
        if (panelHost) {
          panelHost.removeEventListener("click", handlePanelClick);
          panelHost.removeEventListener("input", handlePanelInput);
          panelHost.innerHTML = "";
          if (externalPanelStyle) {
            panelHost.style.overflow = externalPanelStyle.overflow;
            panelHost.style.overflowY = externalPanelStyle.overflowY;
            panelHost.style.overscrollBehavior = externalPanelStyle.overscrollBehavior;
            panelHost.style.scrollbarWidth = externalPanelStyle.scrollbarWidth;
            panelHost.style.touchAction = externalPanelStyle.touchAction;
            panelHost.style.webkitOverflowScrolling = externalPanelStyle.webkitOverflowScrolling;
            panelHost.style.minHeight = externalPanelStyle.minHeight;
            panelHost.style.height = externalPanelStyle.height;
          }
        } else {
          container.removeEventListener("click", handlePanelClick);
          container.removeEventListener("input", handlePanelInput);
        }
        const style = document.getElementById(`${sceneId}-style`);
        if (style && style.parentNode) style.parentNode.removeChild(style);
      };

      start();
    },

    unmount: function unmount(container) {
      if (container && container.__bioSceneCleanup) {
        container.__bioSceneCleanup();
        delete container.__bioSceneCleanup;
      }
      if (container) {
        container.innerHTML = "";
      }
    }
  };
})();
