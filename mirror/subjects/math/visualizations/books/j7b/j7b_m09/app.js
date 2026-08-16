/**
 * 消元法解二元一次方程组 - 三种消元方法对比教学模型
 */

(function () {
  function boot() {
    const sandboxWrapper = document.getElementById("sandbox-wrapper");
    const sandboxSvg = document.getElementById("sandbox-svg");
    const htmlOverlay = document.getElementById("html-overlay");
    const hudPanel = document.getElementById("hud-chalkboard-panel");
    const hudToggleBtn = document.getElementById("hud-toggle-btn");
    const hudTitle = hudPanel?.querySelector(".hud-title");
    const stepsChalkboard = document.getElementById("steps-hud-chalkboard");
    const slidersContainer = document.getElementById("sliders-container");
    const presetButtonsContainer = document.getElementById("preset-buttons-container");
    const btnResetState = document.getElementById("btn-reset-state");
    const btnShowHelp = document.getElementById("btn-show-help");
    const modalHelp = document.getElementById("modal-help");
    const btnCloseHelp = document.getElementById("btn-close-help");

    if (!sandboxWrapper || !sandboxSvg || !htmlOverlay || !hudPanel || !stepsChalkboard) return;

    const DEFAULT_SYSTEM = {
      equations: ["x + y = 5", "2x - y = 1"],
      x: 2,
      y: 3,
      substitution: {
        source: "y = 5 - x",
        target: "2x - y = 1",
        substituted: "2x - (5 - x) = 1",
        oneVariable: "3x - 5 = 1",
        solved: "3x = 6，所以 x = 2",
        back: "y = 5 - 2 = 3",
      },
      addSubtract: {
        line1: "x + y = 5",
        line2: "2x - y = 1",
        action: "① + ②",
        result: "3x = 6",
        solved: "x = 2",
        back: "代回 ①：2 + y = 5，所以 y = 3",
      },
      balance: {
        relation: "y = 5 - x",
        target: "2x - y = 1",
        substituted: "2x - (5 - x) = 1",
        normalized: "3x = 6",
      },
    };

    const SCENE_STEPS = {
      "substitution-method": [
        { short: "观察方程", title: "代入消元 · 第 1 步", target: "找到能表示一个未知数的方程", rule: "从 ① 得到 y = 5 - x，准备把 y 整体换掉。", transform: "①：x + y = 5  →  y = 5 - x", next: "把表达式整体代入 ②。" },
        { short: "整体代换", title: "代入消元 · 第 2 步", target: "把 y 看成一个整体表达式", rule: "等量代换：相等的量可以互相替换。", transform: "②：2x - y = 1", next: "用 5 - x 替换 y。" },
        { short: "得到一元", title: "代入消元 · 第 3 步", target: "二元方程降成一元方程", rule: "替换后只剩 x，一个未知数可以直接求解。", transform: "2x - (5 - x) = 1", next: "整理同类项。" },
        { short: "一元求解", title: "代入消元 · 第 4 步", target: "求出第一个未知数", rule: "移项、合并同类项，得到 x 的值。", transform: "3x - 5 = 1  →  3x = 6  →  x = 2", next: "把 x = 2 代回 ①。" },
        { short: "回代检验", title: "代入消元 · 第 5 步", target: "求出另一个未知数并检验", rule: "回代原方程可以得到 y，并验证两个方程都成立。", transform: "y = 5 - 2 = 3", next: "解为 x = 2，y = 3。" },
      ],
      "add-sub-method": [
        { short: "观察方程", title: "加减消元 · 第 1 步", target: "寻找最容易消去的未知数", rule: "两个方程的 y 项互为相反数：+y 与 -y。", transform: "① x + y = 5，② 2x - y = 1", next: "选择消去 y。" },
        { short: "竖式对齐", title: "加减消元 · 第 2 步", target: "同类项上下对齐", rule: "x 项、y 项、常数项分别成列，方便整行相加。", transform: "消元目标：y", next: "执行 ① + ②。" },
        { short: "竖式消元", title: "加减消元 · 第 3 步", target: "让目标项抵消为 0", rule: "等式两边分别相加，等式仍成立。", transform: "(x + y) + (2x - y) = 5 + 1", next: "+y 与 -y 抵消。" },
        { short: "一元求解", title: "加减消元 · 第 4 步", target: "求出 x", rule: "消去 y 后得到一元一次方程。", transform: "3x = 6  →  x = 2", next: "把 x = 2 代回原方程。" },
        { short: "回代检验", title: "加减消元 · 第 5 步", target: "求出 y 并验证", rule: "回代 ①：2 + y = 5，所以 y = 3。", transform: "x = 2，y = 3", next: "两个方程都成立。" },
      ],
      "balance-scale-method": [
        { short: "观察等式", title: "天平模型 · 第 1 步", target: "把方程看成平衡关系", rule: "天平平衡表示等式左右两边相等。", transform: "目标仍是把二元关系变成一元关系。", next: "准备把 y 替换成等量表达式。" },
        { short: "等量替换", title: "天平模型 · 第 2 步", target: "用等量表达式替换 y", rule: "把 y 看成 5 个单位减 1 个 x，这个替换不改变等式。", transform: "y = 5 - x", next: "把 y 放入 ② 的位置。" },
        { short: "保持平衡", title: "天平模型 · 第 3 步", target: "替换后天平仍然平衡", rule: "左右两边做等量替换，平衡关系不变。", transform: "2x - (5 - x) = 1", next: "整理成 3x = 6。" },
        { short: "单位分配", title: "天平模型 · 第 4 步", target: "把 6 个单位平均分给 3 个 x", rule: "3 份相同的 x 对应 6 个单位，每份是 2。", transform: "3x = 6  →  x = 2", next: "回代求 y。" },
        { short: "回代检验", title: "天平模型 · 第 5 步", target: "把结果放回原天平", rule: "x = 2，y = 3 时，两个方程对应的天平都平衡。", transform: "2 + 3 = 5，2×2 - 3 = 1", next: "解为 x = 2，y = 3。" },
      ],
    };

    const SCENE_NAMES = {
      "substitution-method": "代入消元",
      "add-sub-method": "加减消元",
      "balance-scale-method": "天平模型",
    };

    let currentScene = "substitution-method";
    let activeStep = 0;
    let eliminationTarget = "y";
    let advancedOpen = false;
    let isHudExpanded = false;
    let isAnimating = false;
    let replayToken = 0;

    function getModelCenter() {
      const width = sandboxWrapper.clientWidth || 860;
      const height = sandboxWrapper.clientHeight || 680;
      return {
        x: width * 0.5,
        y: Math.max(245, Math.min(height * 0.44, height - 240)),
        width,
        height,
      };
    }

    function cls(condition, value) {
      return condition ? value : "";
    }

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function math(text, extraClass = "") {
      return `<span class="formula-text ${extraClass}">${escapeHtml(text)}</span>`;
    }

    function render() {
      updateTimeline();
      renderSvgLayer();
      renderHtmlLayer();
      updateHudContent();
      renderPanel();
    }

    function updateTimeline() {
      const steps = SCENE_STEPS[currentScene];
      const bar = document.getElementById("timeline-bar-active");
      if (bar) bar.style.width = `${(activeStep / 4) * 100}%`;

      document.querySelectorAll(".timeline-step").forEach((stepEl) => {
        const stepNum = Number(stepEl.getAttribute("data-step"));
        stepEl.classList.toggle("active", stepNum <= activeStep);
        const label = stepEl.querySelector(".step-label");
        if (label && steps[stepNum]) label.textContent = steps[stepNum].short;
      });
    }

    function renderSvgLayer() {
      const center = getModelCenter();
      let svg = "";

      if (currentScene === "substitution-method") {
        svg += drawArrow(center.x, center.y - 58, center.x, center.y + 28, activeStep >= 2 ? "#10b981" : "#cbd5e1", "整体代换");
      }

      if (currentScene === "add-sub-method") {
        const left = center.x - 245;
        const right = center.x + 245;
        const y = center.y + 42;
        if (activeStep >= 1) {
          svg += `<line class="work-line" x1="${left}" y1="${y}" x2="${right}" y2="${y}"></line>`;
        }
        if (activeStep >= 2) {
          svg += `<path class="cancel-stroke" d="M ${center.x - 4} ${center.y - 66} L ${center.x + 64} ${center.y - 8}"></path>`;
          svg += `<path class="cancel-stroke" d="M ${center.x + 64} ${center.y - 66} L ${center.x - 4} ${center.y - 8}"></path>`;
        }
      }

      if (currentScene === "balance-scale-method") {
        svg += drawBalanceScale(center.x, center.y - 10);
        if (activeStep >= 2) {
          svg += drawArrow(center.x - 60, center.y - 132, center.x + 78, center.y - 132, "#3b82f6", "等量替换");
        }
      }

      sandboxSvg.innerHTML = svg;
    }

    function drawArrow(x1, y1, x2, y2, color, label) {
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      return `
        <defs>
          <marker id="arrow-${currentScene}" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="${color}"></path>
          </marker>
        </defs>
        <line class="teaching-arrow" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" marker-end="url(#arrow-${currentScene})"></line>
        <text class="arrow-label" x="${midX + 12}" y="${midY - 8}" fill="${color}">${label}</text>
      `;
    }

    function drawBalanceScale(cx, cy) {
      return `
        <line class="balance-base" x1="${cx - 68}" y1="${cy + 178}" x2="${cx + 68}" y2="${cy + 178}"></line>
        <line class="balance-stand" x1="${cx}" y1="${cy + 22}" x2="${cx}" y2="${cy + 178}"></line>
        <line class="balance-beam" x1="${cx - 250}" y1="${cy + 34}" x2="${cx + 250}" y2="${cy + 34}"></line>
        <circle class="balance-pivot" cx="${cx}" cy="${cy + 34}" r="9"></circle>
        <path class="balance-pan-hanger" d="M ${cx - 190} ${cy + 34} L ${cx - 240} ${cy + 108} L ${cx - 140} ${cy + 108} Z"></path>
        <path class="balance-pan-dish" d="M ${cx - 255} ${cy + 108} Q ${cx - 190} ${cy + 130} ${cx - 125} ${cy + 108}"></path>
        <path class="balance-pan-hanger" d="M ${cx + 190} ${cy + 34} L ${cx + 140} ${cy + 108} L ${cx + 240} ${cy + 108} Z"></path>
        <path class="balance-pan-dish" d="M ${cx + 125} ${cy + 108} Q ${cx + 190} ${cy + 130} ${cx + 255} ${cy + 108}"></path>
      `;
    }

    function renderHtmlLayer() {
      const center = getModelCenter();
      if (currentScene === "substitution-method") {
        htmlOverlay.innerHTML = renderSubstitutionModel(center);
      } else if (currentScene === "add-sub-method") {
        htmlOverlay.innerHTML = renderAddSubModel(center);
      } else {
        htmlOverlay.innerHTML = renderBalanceModel(center);
      }
    }

    function renderSubstitutionModel(center) {
      const sourceActive = activeStep >= 1;
      const substituted = activeStep >= 2;
      const solved = activeStep >= 3;
      const done = activeStep >= 4;
      return `
        <div class="model-stage substitution-stage" style="left:${center.x}px; top:${center.y}px;">
          <div class="model-title-chip">同一题：${math(DEFAULT_SYSTEM.equations[0])}，${math(DEFAULT_SYSTEM.equations[1])}</div>
          <div class="equation-card source-card ${cls(sourceActive, "is-active")}">
            <span class="eq-index">①</span>
            <div class="eq-content">
              <div class="eq-muted">由 x + y = 5 变形</div>
              <div>${math(DEFAULT_SYSTEM.substitution.source, "purple")}</div>
            </div>
          </div>
          <div class="substitution-token ${cls(substituted, "is-used")} ${cls(replayToken % 2 === 1 && activeStep === 2, "replay-pulse")}">
            5 - x
          </div>
          <div class="equation-card target-card ${cls(substituted, "is-active")}">
            <span class="eq-index">②</span>
            <div class="eq-content">
              <div class="eq-muted">${substituted ? "整体代入后" : "准备替换 y"}</div>
              <div>
                ${!substituted ? math(DEFAULT_SYSTEM.substitution.target, "blue") : math(DEFAULT_SYSTEM.substitution.substituted, "green")}
              </div>
            </div>
          </div>
          ${solved ? `
            <div class="result-card mid-result">
              <span>整理：</span>${math(DEFAULT_SYSTEM.substitution.oneVariable)}<span class="result-arrow">→</span>${math(DEFAULT_SYSTEM.substitution.solved, "green")}
            </div>
          ` : ""}
          ${done ? `
            <div class="result-card final-result">
              ${math(DEFAULT_SYSTEM.substitution.back, "purple")}<span class="answer-badge">x = 2，y = 3</span>
            </div>
          ` : ""}
        </div>
      `;
    }

    function renderAddSubModel(center) {
      const aligned = activeStep >= 1;
      const cancelled = activeStep >= 2;
      const solved = activeStep >= 3;
      const done = activeStep >= 4;
      return `
        <div class="model-stage addsub-stage" style="left:${center.x}px; top:${center.y}px;">
          <div class="model-title-chip">目标：消去 ${eliminationTarget}</div>
          <div class="column-board ${cls(aligned, "is-aligned")} ${cls(cancelled, "is-cancelling")}">
            <div class="column-row column-head">
              <span></span><span>x 项</span><span>y 项</span><span>常数项</span>
            </div>
            <div class="column-row">
              <span class="eq-index">①</span>
              <span class="term-x">x</span>
              <span class="term-y cancel-target">+ y</span>
              <span>5</span>
            </div>
            <div class="column-row">
              <span class="eq-index">②</span>
              <span class="term-x">2x</span>
              <span class="term-y cancel-target">- y</span>
              <span>1</span>
            </div>
            <div class="operator-badge">${cancelled ? "① + ②" : "上下对齐"}</div>
            ${cancelled ? `<div class="column-row result-row"><span></span><span>3x</span><span class="zero-term">0</span><span>6</span></div>` : ""}
          </div>
          ${solved ? `<div class="result-card add-result">${math(DEFAULT_SYSTEM.addSubtract.result)}<span class="result-arrow">→</span>${math(DEFAULT_SYSTEM.addSubtract.solved, "green")}</div>` : ""}
          ${done ? `<div class="result-card final-result">${math(DEFAULT_SYSTEM.addSubtract.back, "purple")}<span class="answer-badge">x = 2，y = 3</span></div>` : ""}
        </div>
      `;
    }

    function renderBalanceModel(center) {
      const substituted = activeStep >= 2;
      const distributed = activeStep >= 3;
      const done = activeStep >= 4;
      return `
        <div class="model-stage balance-stage" style="left:${center.x}px; top:${center.y}px;">
          <div class="model-title-chip">天平表示：${math(DEFAULT_SYSTEM.equations[0])} 与 ${math(DEFAULT_SYSTEM.equations[1])}</div>
          <div class="balance-left-pan">
            ${renderVariableBlocks("x", 2)}
            <span class="minus-mark">-</span>
            ${!substituted ? renderVariableBlocks("y", 1) : `<div class="replacement-cluster">${renderUnitBlocks(5)}<span class="minus-mini">-</span>${renderVariableBlocks("x", 1)}</div>`}
          </div>
          <div class="balance-right-pan">
            ${renderUnitBlocks(1)}
          </div>
          ${substituted ? `<div class="balance-equation-card">${math(DEFAULT_SYSTEM.balance.substituted, "blue")}</div>` : ""}
          ${distributed ? `
            <div class="unit-distribution">
              <div class="distribution-title">整理为 ${math(DEFAULT_SYSTEM.balance.normalized, "green")}：6 个单位平均分给 3 个 x</div>
              <div class="all-units-row">${renderSixUnitBlocks()}</div>
              <div class="share-row">${renderShareGroup()}${renderShareGroup()}${renderShareGroup()}</div>
            </div>
          ` : ""}
          ${done ? `<div class="result-card final-result balance-final"><span class="answer-badge">x = 2，y = 3</span>${math("代回后两个天平都保持平衡", "blue")}</div>` : ""}
        </div>
      `;
    }

    function renderVariableBlocks(kind, count) {
      return `<div class="var-stack ${kind}-stack">${Array.from({ length: count }, (_, index) => `<span class="var-block ${kind}-block">${kind}</span>`).join("")}</div>`;
    }

    function renderUnitBlocks(count) {
      return `<div class="unit-stack">${Array.from({ length: count }, () => `<span class="unit-block">1</span>`).join("")}</div>`;
    }

    function renderSixUnitBlocks() {
      return `<div class="unit-stack six-unit-stack">${Array.from({ length: 6 }, () => `<span class="unit-block">1</span>`).join("")}</div>`;
    }

    function renderShareGroup() {
      return `<div class="share-group"><span class="var-block x-block">x</span>${renderUnitBlocks(2)}</div>`;
    }

    function updateHudContent() {
      const step = SCENE_STEPS[currentScene][activeStep];
      if (hudTitle) hudTitle.textContent = step.title;
      const boxClass = currentScene === "add-sub-method" ? "orange-box" : currentScene === "balance-scale-method" ? "blue-box" : "";
      stepsChalkboard.innerHTML = `
        <div class="hud-row">
          <div class="hud-row-label">当前目标</div>
          <div class="hud-row-val">${escapeHtml(step.target)}</div>
        </div>
        <div class="hud-row">
          <div class="hud-row-label">数学依据</div>
          <div class="hud-row-val">${escapeHtml(step.rule)}</div>
        </div>
        <div class="hud-equation-box ${boxClass}">
          <div class="title">当前变形</div>
          <div class="formula">${escapeHtml(step.transform)}</div>
        </div>
        <div class="hud-row">
          <div class="hud-row-label">下一步</div>
          <div class="hud-row-val">${escapeHtml(step.next)}</div>
        </div>
      `;
    }

    function renderPanel() {
      if (!slidersContainer || !presetButtonsContainer) return;
      slidersContainer.innerHTML = `
        <div class="control-action-btn-group">
          <button class="btn-control-action" id="btn-step-prev" ${activeStep <= 0 ? "disabled" : ""}>上一步</button>
          <button class="btn-control-action active-run" id="btn-step-next" ${activeStep >= 4 ? "disabled" : ""}>下一步</button>
          <button class="btn-control-action" id="btn-step-replay">重播当前步</button>
        </div>
        ${currentScene === "add-sub-method" ? `
          <div class="target-toggle" role="group" aria-label="消元目标">
            <button class="btn-sub-toggle ${eliminationTarget === "x" ? "active" : ""}" data-target="x">消 x</button>
            <button class="btn-sub-toggle ${eliminationTarget === "y" ? "active" : ""}" data-target="y">消 y</button>
          </div>
        ` : ""}
        <details class="advanced-controls" ${advancedOpen ? "open" : ""}>
          <summary>高级参数</summary>
          <div class="advanced-note">当前教学题固定为 x + y = 5，2x - y = 1，解为 x = 2，y = 3。参数编辑已折叠，课堂默认聚焦消元过程。</div>
        </details>
      `;

      presetButtonsContainer.innerHTML = `
        <button class="btn-preset-problem" data-preset="default-direct">直接相加消 y：x + y = 5，2x - y = 1</button>
        <button class="btn-preset-problem" data-preset="replay-current">重播当前动画</button>
        <button class="btn-preset-problem" data-preset="reset-all">回到第 1 步</button>
      `;

      bindPanelEvents();
    }

    function bindPanelEvents() {
      const next = document.getElementById("btn-step-next");
      const prev = document.getElementById("btn-step-prev");
      const replay = document.getElementById("btn-step-replay");
      next?.addEventListener("click", () => {
        if (isAnimating || activeStep >= 4) return;
        activeStep += 1;
        replayToken += 1;
        render();
      });
      prev?.addEventListener("click", () => {
        if (isAnimating || activeStep <= 0) return;
        activeStep -= 1;
        render();
      });
      replay?.addEventListener("click", replayCurrentStep);

      document.querySelectorAll(".btn-sub-toggle").forEach((button) => {
        button.addEventListener("click", () => {
          eliminationTarget = button.getAttribute("data-target") || "y";
          render();
        });
      });

      document.querySelector(".advanced-controls")?.addEventListener("toggle", (event) => {
        advancedOpen = event.currentTarget.open;
      });

      document.querySelectorAll(".btn-preset-problem").forEach((button) => {
        button.addEventListener("click", () => {
          const preset = button.getAttribute("data-preset");
          if (preset === "replay-current") replayCurrentStep();
          else {
            activeStep = 0;
            replayToken += 1;
            render();
          }
        });
      });
    }

    function replayCurrentStep() {
      replayToken += 1;
      htmlOverlay.classList.remove("replay-flash");
      void htmlOverlay.offsetWidth;
      htmlOverlay.classList.add("replay-flash");
      renderHtmlLayer();
    }

    function loadScene(sceneId) {
      currentScene = sceneId;
      activeStep = 0;
      eliminationTarget = "y";
      replayToken += 1;
      document.querySelectorAll(".btn-preset").forEach((button) => {
        button.classList.toggle("active", button.getAttribute("data-scene") === sceneId);
      });
      render();
    }

    document.querySelectorAll(".timeline-step").forEach((stepEl) => {
      stepEl.addEventListener("click", () => {
        if (isAnimating) return;
        activeStep = Number(stepEl.getAttribute("data-step")) || 0;
        replayToken += 1;
        render();
      });
    });

    document.querySelectorAll(".btn-preset").forEach((button) => {
      button.addEventListener("click", () => loadScene(button.getAttribute("data-scene")));
    });

    if (hudToggleBtn) {
      hudToggleBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        isHudExpanded = hudPanel.classList.contains("collapsed");
        hudPanel.classList.toggle("collapsed", !isHudExpanded);
        renderHtmlLayer();
      });
    }

    btnResetState?.addEventListener("click", () => loadScene(currentScene));
    btnShowHelp?.addEventListener("click", () => modalHelp?.classList.add("active"));
    btnCloseHelp?.addEventListener("click", () => modalHelp?.classList.remove("active"));
    modalHelp?.addEventListener("click", (event) => {
      if (event.target === modalHelp) modalHelp.classList.remove("active");
    });

    window.appState = {
      get currentScene() { return currentScene; },
      get activeStep() { return activeStep; },
      set activeStep(value) {
        activeStep = Math.max(0, Math.min(4, Number(value) || 0));
        render();
      },
      get eliminationTarget() { return eliminationTarget; },
      loadScene,
      replayCurrentStep,
      render,
    };

    window.addEventListener("resize", render);
    loadScene("substitution-method");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
