window.BIO_VISUAL_SCENES = window.BIO_VISUAL_SCENES || {};

window.BIO_VISUAL_SCENES["s_x3_m09"] = (function () {
  "use strict";

  const STEPS = [
    {
      label: "制胶",
      title: "先形成带加样孔的凝胶",
      focus: "琼脂糖凝胶",
      note: "点击左侧凝胶液，把琼脂糖凝胶倒入电泳槽；冷却后形成加样孔。"
    },
    {
      label: "点样",
      title: "样品必须进入加样孔",
      focus: "加样孔与载样缓冲液",
      note: "拖动移液器：取吸头、吸样本、放到对应加样孔；每个泳道都要独立取新吸头。"
    },
    {
      label: "跑胶",
      title: "DNA 带负电，向正极迁移",
      focus: "分子筛效应",
      note: "点击电源开始跑胶；片段越短，穿过凝胶网孔越容易，迁移距离越远。"
    },
    {
      label: "成像",
      title: "把凝胶移入紫外箱观察",
      focus: "染色与紫外成像",
      note: "跑胶完成后，先把凝胶托盘拖进紫外观察箱，再打开 UV 开关观察条带。"
    },
    {
      label: "判读",
      title: "先看对照，再看样品",
      focus: "高考判读顺序",
      note: "先看 Marker 估算大小，再看阴性和阳性对照是否成立，最后判断待检样品。"
    }
  ];

  const LANES = [
    {
      id: "marker",
      label: "Marker",
      short: "分子量标准",
      compact: "M",
      fragments: [
        { size: 1200, ratio: 0.28 },
        { size: 700, ratio: 0.42 },
        { size: 500, ratio: 0.54 },
        { size: 300, ratio: 0.69 },
        { size: 150, ratio: 0.84 }
      ],
      clue: "多条已知大小条带",
      result: "用于估算 DNA 片段大小，本身不是待检样品。"
    },
    {
      id: "sample",
      label: "待检样品",
      short: "PCR 产物",
      compact: "样",
      fragments: [{ size: 500, ratio: 0.54 }],
      clue: "约 500 bp 条带",
      result: "与阳性对照条带位置一致，说明样品含目标 DNA 片段。"
    },
    {
      id: "negative",
      label: "阴性对照",
      short: "无模板",
      compact: "阴",
      fragments: [],
      clue: "不应出现条带",
      result: "无条带，说明本次实验没有明显模板污染。"
    },
    {
      id: "positive",
      label: "阳性对照",
      short: "已知模板",
      compact: "阳",
      fragments: [{ size: 500, ratio: 0.54 }],
      clue: "约 500 bp 条带",
      result: "有目标条带，说明扩增和检测体系有效。"
    }
  ];

  const EXAM_CASES = [
    {
      id: "normal",
      label: "标准结果",
      short: "对照成立",
      examPoint: "先判定阴性无带、阳性有带，再看样品是否与阳性同高。",
      focusLane: "sample",
      note: "阴性对照无带、阳性对照有带时，待检样品的 500 bp 条带才有判读意义。",
      question: "标准结果中，待检样品 500 bp 条带与阳性对照同高，阴性对照无条带，应如何判断？",
      choices: [
        { key: "valid", label: "样品含目标片段", correct: true, explain: "对。阳性对照证明体系有效，阴性对照排除明显污染，样品条带可信。" },
        { key: "ignore", label: "不能参考对照", correct: false, explain: "不对。高考判读题常要求先判断对照是否成立，再判断样品。" }
      ],
      laneNotes: {
        marker: "Marker 提供片段大小参照，可估算样品约为 500 bp。",
        sample: "待检样品与阳性对照同高，说明含目标 DNA 片段。",
        negative: "阴性对照无条带，说明明显污染风险较低。",
        positive: "阳性对照有目标条带，说明检测体系有效。"
      }
    },
    {
      id: "reversed",
      label: "电极接反",
      short: "方向错误",
      examPoint: "考查 DNA 带负电：加样孔应在负极端，DNA 才向正极迁移。",
      focusLane: "sample",
      note: "DNA 带负电。若加样孔端接正极，DNA 会向孔外反向迁移，不能形成有效分离结果。",
      question: "若把加样孔端接到正极，最可能出现的结果是什么？",
      choices: [
        { key: "backward", label: "DNA 反向跑出孔端", correct: true, explain: "对。DNA 会向正极移动，接反后迁移方向错误，结果不能判读。" },
        { key: "faster", label: "小片段更远且结果可信", correct: false, explain: "不对。极性接反属于实验设置错误，分离方向已经错了。" }
      ],
      laneNotes: {
        marker: "极性错误时 Marker 也不能作为有效大小参照。",
        sample: "条带方向错误，待检样品结果不能判读。",
        negative: "接线错误会使整块凝胶无效，不能只看某一泳道。",
        positive: "即使阳性模板存在，电场方向错误也不能得到可信条带。"
      }
    },
    {
      id: "contam",
      label: "阴性污染",
      short: "阴性有带",
      examPoint: "阴性对照有目标带时，优先判断污染，样品阳性不可直接采信。",
      focusLane: "negative",
      note: "阴性对照不含模板，若出现目标条带，提示体系或操作污染，待检样品阳性不能直接采信。",
      question: "阴性对照出现与目标片段相同位置的条带，首先说明什么？",
      choices: [
        { key: "pollution", label: "存在污染风险", correct: true, explain: "对。阴性对照有带是污染警号，本次样品结果应谨慎或重做。" },
        { key: "sample", label: "待检样品一定阳性", correct: false, explain: "不对。阴性对照失守时，样品条带可能来自污染。" }
      ],
      laneNotes: {
        marker: "Marker 仍能定位片段大小，但不能弥补阴性污染。",
        sample: "样品有 500 bp 条带，但阴性对照也有同位条带，结果不可信。",
        negative: "阴性对照出现目标条带，提示污染。",
        positive: "阳性对照有带只能说明体系能检出，不能排除污染。"
      }
    },
    {
      id: "positiveFail",
      label: "阳性失效",
      short: "阳性无带",
      examPoint: "阳性对照无目标带时，说明体系未被验证，阴性结果不能直接下结论。",
      focusLane: "positive",
      note: "阳性对照应出现目标条带；若无条带，说明扩增或检测体系可能失效，阴性结果不能直接下结论。",
      question: "阳性对照没有目标条带时，下列哪项判断更符合实验规范？",
      choices: [
        { key: "invalid", label: "体系失效，需重做", correct: true, explain: "对。阳性对照失败说明检测体系没有被验证，本次结果不能直接判定。" },
        { key: "negative", label: "所有样品都是阴性", correct: false, explain: "不对。阳性对照失败时，阴性样品可能是假阴性。" }
      ],
      laneNotes: {
        marker: "Marker 可见不等于检测体系一定有效。",
        sample: "样品条带需要结合阳性对照判断；阳性失效时结果可信度下降。",
        negative: "阴性无带不能单独证明实验成功。",
        positive: "阳性对照无目标条带，提示体系失效或操作问题。"
      }
    },
    {
      id: "size300",
      label: "片段估算",
      short: "约 300 bp",
      examPoint: "用 Marker 定位：条带越靠近下方，片段通常越短。",
      focusLane: "sample",
      note: "待检样品条带低于 500 bp 标记、接近 300 bp 标记，说明片段更短，不能只看有没有条带。",
      question: "待检样品条带位于 Marker 的 500 bp 下方、接近 300 bp 位置，最合理的判断是？",
      choices: [
        { key: "small", label: "约 300 bp 片段", correct: true, explain: "对。小片段迁移更远，条带位置接近 300 bp 标记，应估为约 300 bp。" },
        { key: "target", label: "一定是 500 bp", correct: false, explain: "不对。判读片段大小要看与 Marker 的相对位置，不能只看出现条带。" }
      ],
      laneNotes: {
        marker: "Marker 是片段大小参照；500 bp 与 300 bp 的位置可帮助估算样品大小。",
        sample: "样品条带接近 300 bp，说明片段小于目标 500 bp。",
        negative: "阴性对照无带，说明没有明显污染。",
        positive: "阳性对照仍在 500 bp，可作为目标条带位置参照。"
      }
    },
    {
      id: "nonspecific",
      label: "非特异扩增",
      short: "样品杂带",
      examPoint: "样品有目标带外又有额外条带，常考非特异性扩增或引物设计问题。",
      focusLane: "sample",
      note: "待检样品同时出现 500 bp 和额外短片段条带，说明不能只写阳性，还要指出结果不够单一。",
      question: "待检样品有 500 bp 目标带，同时还有一条更短的额外条带，最可能提示什么？",
      choices: [
        { key: "nonspecific", label: "存在非特异扩增", correct: true, explain: "对。目标带之外的额外条带提示体系特异性不足，常需优化退火温度或引物。" },
        { key: "perfect", label: "结果完全理想", correct: false, explain: "不对。理想结果应主要出现目标条带；额外条带需要解释。" }
      ],
      laneNotes: {
        marker: "Marker 用来判断额外条带比目标片段更短。",
        sample: "样品既有 500 bp 目标带，又有较短杂带，提示非特异扩增。",
        negative: "阴性对照无带，额外条带更可能来自样品扩增特异性问题。",
        positive: "阳性对照单一目标带，说明对照体系可作为比较。"
      }
    }
  ];

  const QUESTIONS = [
    {
      prompt: "DNA 在凝胶中发生定向迁移的直接原因是什么？",
      choices: [
        { key: "charge", label: "DNA 带负电，受电场作用", correct: true, explain: "对。DNA 的磷酸骨架带负电，所以从负极端向正极移动。" },
        { key: "sequence", label: "碱基序列主动推动", correct: false, explain: "不对。迁移动力来自电场，不是碱基序列主动推动。" }
      ]
    },
    {
      prompt: "载样缓冲液中的甘油或蔗糖主要起什么作用？",
      choices: [
        { key: "sink", label: "增大密度，使样品沉入孔底", correct: true, explain: "对。密度增大后样品不易扩散，能稳定进入加样孔。" },
        { key: "charge", label: "把 DNA 改成正电荷", correct: false, explain: "不对。DNA 的负电性来自磷酸骨架，不靠载样缓冲液改成正电。" }
      ]
    },
    {
      prompt: "同一块凝胶中，哪类 DNA 片段通常迁移更远？",
      choices: [
        { key: "small", label: "较短片段", correct: true, explain: "对。较短片段更容易穿过凝胶网孔，所以迁移更远。" },
        { key: "large", label: "较大片段", correct: false, explain: "不对。较大片段受网孔阻碍更明显，迁移距离较短。" }
      ]
    },
    {
      prompt: "电泳判读时，为什么不能只看待检样品有没有条带？",
      choices: [
        { key: "controls", label: "必须结合阴性和阳性对照", correct: true, explain: "对。阴性对照排查污染，阳性对照验证检测体系是否有效。" },
        { key: "alone", label: "样品条带一定足够判定", correct: false, explain: "不对。对照不成立时，样品条带可能是假阳性或假阴性。" }
      ]
    },
    {
      prompt: "待检样品有目标条带、阴性对照无带、阳性对照有带，说明什么？",
      choices: [
        { key: "valid", label: "结果可信，样品含目标片段", correct: true, explain: "对。两个对照都成立时，样品条带具有判读意义。" },
        { key: "invalid", label: "所有结果都不能判断", correct: false, explain: "不对。对照成立时，待检样品条带可以用于判断。" }
      ]
    }
  ];

  const LAB_TASKS = [
    {
      target: "凝胶液",
      prompt: "在模拟框中点击左侧凝胶液，完成制胶并观察加样孔出现。",
      done: "凝胶已制备完成。下一步拖动移液器，依次取吸头、吸样本、加入对应泳道。"
    },
    {
      target: "移液器 / 加样孔",
      prompt: "按顺序操作：拖动移液器到取吸头架，再拖到样本管吸样，最后拖到对应加样孔。",
      done: "四个泳道已完成点样。下一步点击电源，启动电场进行跑胶。"
    },
    {
      target: "电源 / 电极",
      prompt: "点击右侧电源开始跑胶，观察条带随片段大小产生不同迁移距离。",
      done: "正在跑胶：小片段跑得更远，Marker 用来估算片段大小。"
    },
    {
      target: "凝胶托盘 / UV",
      prompt: "跑胶完成后，拖动凝胶托盘到紫外观察箱，再点击 UV 开关让条带显影。",
      done: "进入判读：先看 Marker，再看阴性对照和阳性对照，最后判断样品。"
    },
    {
      target: "泳道判读",
      prompt: "点击泳道、切换考点场景，并完成右侧判读题。",
      done: "判读完成。"
    }
  ];

  const CASE_COLORS = {
    normal: "#0f766e",
    reversed: "#b45309",
    contam: "#be123c",
    positiveFail: "#7c3aed",
    size300: "#2563eb",
    nonspecific: "#c2410c"
  };

  const SAMPLE_TUBES = [
    { id: "marker", label: "Marker", compact: "M", color: "#a855f7" },
    { id: "sample", label: "待检", compact: "样", color: "#38bdf8" },
    { id: "negative", label: "阴性", compact: "阴", color: "#94a3b8" },
    { id: "positive", label: "阳性", compact: "阳", color: "#14b8a6" }
  ];

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function laneById(id) {
    return LANES.find((lane) => lane.id === id) || LANES[1];
  }

  function caseById(id) {
    return EXAM_CASES.find((item) => item.id === id) || EXAM_CASES[0];
  }

  function activeQuestion(state) {
    const scenario = caseById(state.caseId);
    if (state.step >= 4 || scenario.id !== "normal") {
      return { prompt: scenario.question, choices: scenario.choices };
    }
    return QUESTIONS[state.step] || QUESTIONS[0];
  }

  function laneFragmentsForState(lane, state) {
    if (state.caseId === "contam" && lane.id === "negative") {
      return [{ size: 500, ratio: 0.54 }];
    }
    if (state.caseId === "positiveFail" && lane.id === "positive") {
      return [];
    }
    if (state.caseId === "size300" && lane.id === "sample") {
      return [{ size: 300, ratio: 0.69 }];
    }
    if (state.caseId === "nonspecific" && lane.id === "sample") {
      return [
        { size: 500, ratio: 0.54 },
        { size: 300, ratio: 0.69 }
      ];
    }
    return lane.fragments;
  }

  function laneResultForState(lane, state) {
    const scenario = caseById(state.caseId);
    return scenario.laneNotes && scenario.laneNotes[lane.id] ? scenario.laneNotes[lane.id] : lane.result;
  }

  function labTaskForState(state) {
    return LAB_TASKS[clamp(state.step, 0, LAB_TASKS.length - 1)];
  }

  function loadedLaneIds(state) {
    return Array.isArray(state.loadedLanes) ? state.loadedLanes : [];
  }

  function hasLoadedLane(state, laneId) {
    return loadedLaneIds(state).includes(laneId);
  }

  function allLanesLoaded(state) {
    return LANES.every((lane) => hasLoadedLane(state, lane.id));
  }

  function initialState() {
    return {
      step: 0,
      selectedLane: "sample",
      caseId: "normal",
      answer: "",
      modelHint: LAB_TASKS[0].prompt,
      progress: 0,
      running: false,
      stained: false,
      gelReady: false,
      samplesLoaded: false,
      loadedLanes: [],
      pipetteTip: false,
      pipetteSample: "",
      uvPlateLoaded: false,
      uvLightOn: false
    };
  }

  function renderStageShell(state) {
    const step = STEPS[state.step];
    const lane = laneById(state.selectedLane);
    const scenario = caseById(state.caseId);
    const task = labTaskForState(state);
    return `
      <style>${css()}</style>
      <div class="gel-stageOnly">
        <section class="gel-simBox">
          <canvas class="gel-canvas" aria-label="DNA 凝胶电泳交互模拟"></canvas>
          <div class="gel-hud">
            <div>
              <span>DNA 凝胶电泳</span>
              <strong data-gel-title>${escapeHtml(step.title)}</strong>
            </div>
            <b data-gel-count>${state.step + 1}/5</b>
          </div>
          <div class="gel-statusLine">
            <strong data-gel-focus>${escapeHtml(step.focus)}</strong>
            <span data-gel-note>${escapeHtml(state.modelHint || task.prompt)}</span>
            <em data-gel-lane>${escapeHtml(`${scenario.short} · ${lane.label}：${laneResultForState(lane, state)}`)}</em>
          </div>
        </section>
      </div>
    `;
  }

  function updateStageText(container, state) {
    const step = STEPS[state.step];
    const lane = laneById(state.selectedLane);
    const scenario = caseById(state.caseId);
    const task = labTaskForState(state);
    const title = container.querySelector("[data-gel-title]");
    const count = container.querySelector("[data-gel-count]");
    const focus = container.querySelector("[data-gel-focus]");
    const note = container.querySelector("[data-gel-note]");
    const laneText = container.querySelector("[data-gel-lane]");
    if (title) title.textContent = step.title;
    if (count) count.textContent = `${state.step + 1}/5`;
    if (focus) focus.textContent = step.focus;
    if (note) note.textContent = state.modelHint || task.prompt;
    if (laneText) laneText.textContent = `${scenario.short} · ${lane.label}：${laneResultForState(lane, state)}`;
  }

  function renderTraceChip(label, stateName) {
    return `<span class="${stateName || ""}">${escapeHtml(label)}</span>`;
  }

  function renderOperationTrace(state) {
    if (state.step === 1) {
      const phase = state.pipetteSample ? 2 : state.pipetteTip ? 1 : 0;
      return `
        <div class="gel-miniFlow">
          ${renderTraceChip("取新吸头", phase > 0 ? "is-done" : "is-active")}
          ${renderTraceChip("吸取样本", phase > 1 ? "is-done" : phase === 1 ? "is-active" : "")}
          ${renderTraceChip("加入同名泳道", phase === 2 ? "is-active" : "")}
        </div>
        <div class="gel-loadDots">
          ${LANES.map((lane) => `<i class="${hasLoadedLane(state, lane.id) ? "is-done" : lane.id === state.pipetteSample ? "is-active" : ""}">${escapeHtml(lane.compact)}</i>`).join("")}
          <b>${loadedLaneIds(state).length}/4</b>
        </div>
      `;
    }
    if (state.step === 3) {
      const phase = state.uvLightOn ? 2 : state.uvPlateLoaded ? 1 : 0;
      return `
        <div class="gel-miniFlow">
          ${renderTraceChip("拖凝胶入箱", phase > 0 ? "is-done" : "is-active")}
          ${renderTraceChip("打开 UV", phase > 1 ? "is-done" : phase === 1 ? "is-active" : "")}
          ${renderTraceChip("判读条带", phase === 2 ? "is-active" : "")}
        </div>
      `;
    }
    if (state.step >= 4) {
      return `
        <div class="gel-miniFlow gel-examFlow">
          ${renderTraceChip("Marker 估大小", "is-done")}
          ${renderTraceChip("阴性排污染", "is-done")}
          ${renderTraceChip("阳性验体系", "is-done")}
          ${renderTraceChip("样品下结论", "is-active")}
        </div>
      `;
    }
    return "";
  }

  function renderControls(state, fit) {
    const step = STEPS[state.step];
    const lane = laneById(state.selectedLane);
    const scenario = caseById(state.caseId);
    const task = activeQuestion(state);
    const labTask = labTaskForState(state);
    const picked = task.choices.find((choice) => choice.key === state.answer);
    const fragments = laneFragmentsForState(lane, state);
    const progressLabel = state.running ? `${Math.round(state.progress * 100)}%` : `${state.step + 1}/5`;
    return `
      <style>${css()}</style>
      <aside class="gel-opPanel" data-fit="${fit}">
        <section class="gel-card gel-headCard">
          <div>
            <span>DNA 检测实验</span>
            <h3>凝胶电泳</h3>
          </div>
          <b>${escapeHtml(progressLabel)}</b>
        </section>

        <section class="gel-card gel-actionCard">
          <div class="gel-cardTitle"><span>模拟操作</span><strong>${escapeHtml(labTask.target)}</strong></div>
          <p class="gel-livePrompt">${escapeHtml(state.running ? LAB_TASKS[2].done : state.modelHint || labTask.prompt)}</p>
          ${renderOperationTrace(state)}
          <div class="gel-actionGrid">
            <button type="button" data-gel-action="reset">重置实验</button>
          </div>
        </section>

        <section class="gel-card">
          <div class="gel-cardTitle"><span>流程定位</span><strong>${escapeHtml(step.label)}</strong></div>
          <div class="gel-stepGrid">
            ${STEPS.map((item, index) => `<button type="button" class="${index === state.step ? "is-active" : ""} ${index < state.step ? "is-done" : ""}" aria-current="${index === state.step ? "step" : "false"}"><b>${index + 1}</b><span>${escapeHtml(item.label)}</span></button>`).join("")}
          </div>
        </section>

        <section class="gel-card">
          <div class="gel-cardTitle"><span>泳道判读</span><strong>${escapeHtml(lane.short)}</strong></div>
          <div class="gel-laneGrid">
            ${LANES.map((item) => `<button type="button" data-gel-action="lane" data-lane="${item.id}" class="${item.id === state.selectedLane ? "is-active" : ""}">${escapeHtml(item.label)}</button>`).join("")}
          </div>
        </section>

        <section class="gel-card gel-caseCard">
          <div class="gel-cardTitle"><span>高考考点</span><strong>${escapeHtml(scenario.short)}</strong></div>
          <div class="gel-caseGrid">
            ${EXAM_CASES.map((item) => `<button type="button" data-gel-action="case" data-case="${item.id}" class="${item.id === state.caseId ? "is-active" : ""}">${escapeHtml(item.label)}</button>`).join("")}
          </div>
          <div class="gel-examPoint"><b>考法</b><span>${escapeHtml(scenario.examPoint || "先读 Marker 和对照，再判断样品条带。")}</span></div>
          <p class="gel-caseNote">${escapeHtml(scenario.note)}</p>
        </section>

        <section class="gel-card gel-taskCard">
          <div class="gel-cardTitle"><span>判读题</span><strong>${escapeHtml(scenario.short)}</strong></div>
          <p class="gel-taskPrompt">${escapeHtml(task.prompt)}</p>
          <div class="gel-answerGrid">
            ${task.choices.map((choice) => {
              const cls = state.answer
                ? choice.correct
                  ? "is-correct"
                  : choice.key === state.answer
                    ? "is-wrong"
                    : ""
                : "";
              return `<button type="button" data-gel-action="answer" data-answer="${choice.key}" class="${cls}">${escapeHtml(choice.label)}</button>`;
            }).join("")}
          </div>
          <div class="gel-feedback ${picked ? picked.correct ? "is-correct" : "is-wrong" : ""}">${escapeHtml(picked ? picked.explain : laneResultForState(lane, state))}</div>
        </section>

        <section class="gel-card gel-readout">
          <div class="gel-cardTitle"><span>当前泳道</span><strong>${escapeHtml(lane.label)}</strong></div>
          <div class="gel-readoutLine"><span>条带</span><b>${fragments.length ? fragments.map((fragment) => `${fragment.size} bp`).join(" / ") : "无条带"}</b></div>
          <div class="gel-readoutLine"><span>结论</span><b>${escapeHtml(laneResultForState(lane, state))}</b></div>
        </section>
      </aside>
    `;
  }

  function css() {
    return `
      .gel-stageOnly,.gel-stageOnly *,.gel-opPanel,.gel-opPanel *{box-sizing:border-box}
      .gel-stageOnly{width:100%;height:100%;min-width:0;min-height:0;color:#f8fafc;font-family:"Microsoft YaHei","PingFang SC",Inter,system-ui,sans-serif;touch-action:manipulation;-webkit-tap-highlight-color:transparent;user-select:none}
      .gel-simBox{width:100%;height:100%;min-width:0;min-height:0;overflow:hidden;border-radius:clamp(22px,4vw,46px);border:1px solid rgba(255,255,255,.08);background:#071018;position:relative;box-shadow:inset 0 1px 0 rgba(255,255,255,.05)}
      .gel-canvas{position:absolute;inset:0;width:100%;height:100%;display:block;outline:none;touch-action:none}
      .gel-hud{position:absolute;z-index:2;left:18px;right:18px;top:16px;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;pointer-events:none}
      .gel-hud span,.gel-headCard span,.gel-cardTitle span{display:block;color:#5eead4;font-size:11px;line-height:1;font-weight:950;letter-spacing:.08em}
      .gel-hud strong{display:block;margin-top:8px;color:#fff;font-size:clamp(20px,3.4vh,32px);line-height:1.06;font-weight:950;letter-spacing:0;text-shadow:0 3px 18px rgba(2,6,23,.82)}
      .gel-hud b{min-width:66px;height:54px;border-radius:17px;border:1px solid rgba(94,234,212,.32);background:rgba(15,118,110,.18);display:grid;place-items:center;color:#ccfbf1;font-size:18px;font-weight:950}
      .gel-statusLine{position:absolute;z-index:2;left:18px;right:18px;bottom:16px;min-height:66px;border-radius:18px;border:1px solid rgba(255,255,255,.08);background:rgba(2,6,23,.78);backdrop-filter:blur(10px);padding:10px 14px;display:grid;gap:3px;overflow:hidden;pointer-events:none}
      .gel-statusLine strong{color:#5eead4;font-size:13px;line-height:1.1;font-weight:950}.gel-statusLine span,.gel-statusLine em{color:rgba(226,232,240,.82);font-size:12px;line-height:1.25;font-weight:760;font-style:normal;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .gel-opPanel{width:100%;height:100%;min-width:0;min-height:0;overflow-x:hidden!important;overflow-y:auto!important;scrollbar-width:none;background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;padding:10px;display:flex;flex-direction:column;gap:8px;color:#e2e8f0;font-family:"Microsoft YaHei","PingFang SC",Inter,system-ui,sans-serif;touch-action:pan-y;-webkit-tap-highlight-color:transparent}
      .gel-opPanel::-webkit-scrollbar{display:none}
      .gel-card{min-width:0;border-radius:15px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.085);padding:10px;box-shadow:inset 0 1px 0 rgba(255,255,255,.035);overflow:hidden;flex:0 0 auto}
      .gel-headCard{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.gel-headCard h3{margin:5px 0 0;color:#fff;font-size:20px;line-height:1.08;font-weight:950}.gel-headCard b{color:#5eead4;font-size:18px;font-weight:950}
      .gel-cardTitle{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:9px}.gel-cardTitle span{color:rgba(226,232,240,.54);font-size:10px}.gel-cardTitle strong{color:rgba(255,255,255,.88);font-size:11px;line-height:1.25;font-weight:900;text-align:right}
      .gel-stepGrid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}.gel-stepGrid button{min-width:0;min-height:40px;padding:4px 3px;display:grid;place-items:center;gap:2px;cursor:default}
      .gel-stepGrid button b{font-family:Consolas,monospace;font-size:12px}.gel-stepGrid button span{max-width:100%;font-size:9px;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .gel-laneGrid,.gel-actionGrid,.gel-answerGrid,.gel-caseGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
      .gel-caseGrid{grid-template-columns:repeat(3,minmax(0,1fr))}
      .gel-actionGrid{grid-template-columns:1fr}
      .gel-opPanel button{border:1px solid rgba(255,255,255,.09);border-radius:11px;background:rgba(255,255,255,.045);color:#e2e8f0;font-family:inherit;font-size:12px;font-weight:900;cursor:pointer;min-height:var(--bio-touch-target,44px);touch-action:manipulation}
      .gel-opPanel .gel-stepGrid button{cursor:default;pointer-events:none}
      .gel-opPanel button:hover:not(:disabled){border-color:rgba(45,212,191,.42);background:rgba(15,118,110,.17)}
      .gel-opPanel button:disabled{opacity:.42;cursor:not-allowed}.gel-opPanel button.is-active{border-color:rgba(45,212,191,.72);background:rgba(15,118,110,.28);color:#ccfbf1}.gel-opPanel button.is-done{border-color:rgba(52,211,153,.34);color:#bbf7d0}
      .gel-opPanel button.is-correct{border-color:rgba(52,211,153,.72);background:rgba(16,185,129,.2);color:#dcfce7}.gel-opPanel button.is-wrong{border-color:rgba(248,113,113,.72);background:rgba(127,29,29,.25);color:#fee2e2}
      .gel-miniFlow{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:0 0 8px}.gel-miniFlow span{min-height:28px;border-radius:9px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.035);display:grid;place-items:center;text-align:center;color:#cbd5e1;font-size:10px;line-height:1.1;font-weight:950;padding:3px}.gel-miniFlow span.is-active{border-color:rgba(45,212,191,.62);background:rgba(15,118,110,.22);color:#ccfbf1}.gel-miniFlow span.is-done{border-color:rgba(52,211,153,.36);background:rgba(22,163,74,.12);color:#bbf7d0}.gel-examFlow{grid-template-columns:repeat(4,minmax(0,1fr))}
      .gel-loadDots{display:flex;align-items:center;gap:6px;margin:-2px 0 8px}.gel-loadDots i{width:24px;height:24px;border-radius:8px;border:1px solid rgba(255,255,255,.1);display:grid;place-items:center;color:#cbd5e1;font-size:11px;font-style:normal;font-weight:950}.gel-loadDots i.is-active{border-color:rgba(45,212,191,.72);color:#ccfbf1}.gel-loadDots i.is-done{background:rgba(22,163,74,.22);border-color:rgba(52,211,153,.5);color:#dcfce7}.gel-loadDots b{margin-left:auto;color:#5eead4;font-size:12px;font-weight:950}
      .gel-examPoint{display:grid;grid-template-columns:34px minmax(0,1fr);gap:7px;align-items:start;margin:8px 0 0;border-radius:10px;border:1px solid rgba(45,212,191,.16);background:rgba(15,118,110,.09);padding:6px 8px}.gel-examPoint b{color:#5eead4;font-size:11px;font-weight:950}.gel-examPoint span{color:#dbeafe;font-size:11px;line-height:1.32;font-weight:860}
      .gel-caseNote{margin:7px 0 0;color:#cbd5e1;font-size:11px;line-height:1.32;font-weight:820}
      .gel-livePrompt{margin:0 0 9px;color:#f8fafc;font-size:12px;line-height:1.35;font-weight:900}
      .gel-taskPrompt{margin:0 0 8px;color:#fff;font-size:12px;line-height:1.35;font-weight:900}.gel-feedback{min-height:28px;margin-top:8px;border-radius:10px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.03);padding:6px 8px;color:#cbd5e1;font-size:11px;line-height:1.35;font-weight:820}
      .gel-feedback.is-correct{border-color:rgba(52,211,153,.28);color:#bbf7d0}.gel-feedback.is-wrong{border-color:rgba(248,113,113,.34);color:#fecaca}
      .gel-readout{flex:1 1 auto;min-height:0}.gel-readoutLine{display:grid;grid-template-columns:46px minmax(0,1fr);gap:8px;align-items:start;border-radius:11px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);padding:7px 8px;margin-top:7px;font-size:11px;line-height:1.35}.gel-readoutLine span{color:rgba(226,232,240,.6);font-weight:900}.gel-readoutLine b{color:#fff;font-weight:900;overflow-wrap:anywhere}
      .gel-opPanel[data-fit="compact"]{padding:7px;gap:5px}.gel-opPanel[data-fit="compact"] .gel-card{padding:7px;border-radius:12px}.gel-opPanel[data-fit="compact"] .gel-headCard h3{font-size:16px}.gel-opPanel[data-fit="compact"] .gel-headCard b{font-size:16px}.gel-opPanel[data-fit="compact"] .gel-cardTitle{margin-bottom:5px}.gel-opPanel[data-fit="compact"] button{min-height:40px;font-size:10px;border-radius:10px}.gel-opPanel[data-fit="compact"] .gel-caseGrid,.gel-opPanel[data-fit="compact"] .gel-laneGrid,.gel-opPanel[data-fit="compact"] .gel-answerGrid{gap:5px}.gel-opPanel[data-fit="compact"] .gel-caseNote{display:none}.gel-opPanel[data-fit="compact"] .gel-examPoint{margin-top:5px;padding:5px 7px}.gel-opPanel[data-fit="compact"] .gel-examPoint span{font-size:10px;line-height:1.22}.gel-opPanel[data-fit="compact"] .gel-miniFlow{gap:5px;margin-bottom:5px}.gel-opPanel[data-fit="compact"] .gel-miniFlow span{min-height:23px;font-size:9px}.gel-opPanel[data-fit="compact"] .gel-loadDots{margin-bottom:5px}.gel-opPanel[data-fit="compact"] .gel-taskPrompt{font-size:10px;line-height:1.22;margin-bottom:5px}.gel-opPanel[data-fit="compact"] .gel-feedback{display:none}.gel-opPanel[data-fit="compact"] .gel-readout{display:none}
      .gel-opPanel[data-fit="micro"]{padding:6px;gap:5px}.gel-opPanel[data-fit="micro"] .gel-card{padding:5px 6px;border-radius:11px}.gel-opPanel[data-fit="micro"] .gel-headCard{padding:6px 8px}.gel-opPanel[data-fit="micro"] .gel-headCard span{display:none}.gel-opPanel[data-fit="micro"] .gel-headCard h3{margin:0;font-size:14px;line-height:1}.gel-opPanel[data-fit="micro"] .gel-headCard b{font-size:13px}.gel-opPanel[data-fit="micro"] .gel-cardTitle{margin-bottom:4px}.gel-opPanel[data-fit="micro"] .gel-cardTitle span{font-size:9px}.gel-opPanel[data-fit="micro"] .gel-cardTitle strong{font-size:10px;line-height:1.1}.gel-opPanel[data-fit="micro"] button{min-height:40px;font-size:10px;border-radius:9px}.gel-opPanel[data-fit="micro"] .gel-stepGrid{gap:4px}.gel-opPanel[data-fit="micro"] .gel-stepGrid button{min-height:40px}.gel-opPanel[data-fit="micro"] .gel-stepGrid button span,.gel-opPanel[data-fit="micro"] .gel-caseNote,.gel-opPanel[data-fit="micro"] .gel-miniFlow,.gel-opPanel[data-fit="micro"] .gel-loadDots,.gel-opPanel[data-fit="micro"] .gel-readout{display:none}.gel-opPanel[data-fit="micro"] .gel-livePrompt{margin:0 0 5px;font-size:10px;line-height:1.2;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.gel-opPanel[data-fit="micro"] .gel-examPoint{grid-template-columns:28px minmax(0,1fr);margin-top:5px;padding:5px 6px}.gel-opPanel[data-fit="micro"] .gel-examPoint b{font-size:10px}.gel-opPanel[data-fit="micro"] .gel-examPoint span{font-size:10px;line-height:1.2;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.gel-opPanel[data-fit="micro"] .gel-taskPrompt{font-size:10px;line-height:1.2;margin-bottom:5px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.gel-opPanel[data-fit="micro"] .gel-answerGrid,.gel-opPanel[data-fit="micro"] .gel-laneGrid,.gel-opPanel[data-fit="micro"] .gel-caseGrid{gap:5px}.gel-opPanel[data-fit="micro"] .gel-feedback{display:none}
      @media(max-height:620px){.gel-simBox{border-radius:24px}.gel-hud{left:12px;right:12px;top:10px}.gel-hud span{font-size:9px}.gel-hud strong{margin-top:5px;font-size:18px}.gel-hud b{min-width:52px;height:42px;border-radius:14px;font-size:15px}.gel-statusLine{left:12px;right:12px;bottom:10px;min-height:44px;padding:7px 10px}.gel-statusLine em{display:none}.gel-statusLine span{font-size:10px}}
      @media(max-width:900px){.gel-opPanel{padding:8px;gap:7px}.gel-headCard h3{font-size:17px}.gel-opPanel button{font-size:11px}.gel-answerGrid{grid-template-columns:1fr}.gel-hud strong{font-size:18px}}
      @media(hover:none){.gel-opPanel button:hover:not(:disabled){border-color:rgba(255,255,255,.09);background:rgba(255,255,255,.045)}}
    `;
  }

  function fitFor(panel) {
    const h = panel ? panel.clientHeight || 0 : 999;
    if (h && h <= 520) return "micro";
    if (h && h <= 1120) return "compact";
    return "normal";
  }

  function createCanvasModel(canvas, state, hooks) {
    const ctx = canvas.getContext("2d");
    let width = 1;
    let height = 1;
    let dpr = 1;
    let raf = 0;
    let alive = true;
    let hits = [];
    let hoverId = "";
    let lastLayout = null;
    let resizeObserver = null;
    let pointer = { x: 0, y: 0 };
    let dragPipette = false;
    let dragGelPlate = false;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width || canvas.clientWidth || 1);
      height = Math.max(1, rect.height || canvas.clientHeight || 1);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint(performance.now());
    }

    function rectHit(id, x, y, w, h, laneId) {
      hits.push({ id, type: "rect", x, y, w, h, laneId });
    }

    function ellipseHit(id, cx, cy, rx, ry, laneId) {
      hits.push({ id, type: "ellipse", cx, cy, rx, ry, laneId });
    }

    function pointInHit(hit, x, y) {
      if (hit.type === "rect") return x >= hit.x && x <= hit.x + hit.w && y >= hit.y && y <= hit.y + hit.h;
      if (hit.type === "ellipse") {
        const dx = (x - hit.cx) / hit.rx;
        const dy = (y - hit.cy) / hit.ry;
        return dx * dx + dy * dy <= 1;
      }
      return false;
    }

    function hitTest(x, y, options) {
      const opts = options || {};
      for (let index = hits.length - 1; index >= 0; index -= 1) {
        if (opts.skipPipette && hits[index].id === "pipette") continue;
        if (opts.skipGelPlate && hits[index].id === "gelPlate") continue;
        if (pointInHit(hits[index], x, y)) return hits[index];
      }
      return null;
    }

    function pointerPoint(event) {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    function onPointerMove(event) {
      const point = pointerPoint(event);
      pointer = point;
      if (dragPipette || dragGelPlate) {
        canvas.style.cursor = "grabbing";
        paint(performance.now());
        return;
      }
      const hit = hitTest(point.x, point.y);
      const nextHover = hit ? `${hit.id}:${hit.laneId || ""}` : "";
      if (nextHover !== hoverId) {
        hoverId = nextHover;
        canvas.style.cursor = hit && hit.id === "pipette" && state.step === 1 ? "grab" : hit ? "pointer" : "default";
      }
    }

    function onPointerLeave() {
      hoverId = "";
      dragPipette = false;
      dragGelPlate = false;
      canvas.style.cursor = "default";
    }

    function onPointerDown(event) {
      const point = pointerPoint(event);
      pointer = point;
      const hit = hitTest(point.x, point.y);
      if (!hit) {
        hooks.tryModelAction("empty");
        return;
      }
      if (hit.id === "pipette" && state.step === 1) {
        dragPipette = true;
        if (canvas.setPointerCapture) canvas.setPointerCapture(event.pointerId);
        hooks.tryModelAction("pipette");
        return;
      }
      if (state.step === 3 && !state.uvPlateLoaded && (hit.id === "gelPlate" || hit.id.startsWith("band-") || hit.id.startsWith("lane-") || hit.id.startsWith("well-"))) {
        dragGelPlate = true;
        if (canvas.setPointerCapture) canvas.setPointerCapture(event.pointerId);
        hooks.tryModelAction("gelPlate");
        return;
      }
      if (state.step === 1) {
        hooks.tryModelAction("direct-" + hit.id);
        return;
      }
      if (hit.laneId) hooks.selectLane(hit.laneId);
      hooks.tryModelAction(hit.id);
    }

    function onPointerUp(event) {
      if (!dragPipette && !dragGelPlate) return;
      const point = pointerPoint(event);
      pointer = point;
      const wasPipette = dragPipette;
      const wasGelPlate = dragGelPlate;
      dragPipette = false;
      dragGelPlate = false;
      if (canvas.releasePointerCapture) {
        try {
          canvas.releasePointerCapture(event.pointerId);
        } catch (error) {}
      }
      const hit = hitTest(point.x, point.y, { skipPipette: wasPipette, skipGelPlate: wasGelPlate });
      if (hit) {
        if (hit.laneId) hooks.selectLane(hit.laneId);
        hooks.tryModelAction((wasPipette || wasGelPlate ? "drag-" : "") + hit.id);
      } else {
        hooks.tryModelAction("drag-empty");
      }
      paint(performance.now());
    }

    function fitLayout() {
      const compact = width < 760 || height < 540;
      const tiny = width < 620 || height < 430;
      const top = tiny ? 54 : compact ? 68 : 78;
      const bottom = tiny ? 42 : compact ? 56 : 70;
      const pad = clamp(Math.min(width, height) * 0.035, 12, 28);
      const area = {
        x: pad,
        y: top,
        w: Math.max(160, width - pad * 2),
        h: Math.max(160, height - top - bottom)
      };
      const sideRoom = area.w > 660 && area.h > 300;
      const powerW = sideRoom ? clamp(area.w * 0.078, 92, 118) : Math.min(92, area.w * 0.18);
      const powerH = sideRoom ? clamp(area.h * 0.16, 68, 90) : Math.min(66, area.h * 0.2);
      const leftColumnW = sideRoom ? clamp(area.w * 0.26, 260, 380) : 0;
      const mainGap = sideRoom ? clamp(area.w * 0.025, 18, 34) : 0;
      const powerGap = sideRoom ? clamp(area.w * 0.014, 12, 22) : 8;
      const mainX = sideRoom ? area.x + leftColumnW + mainGap : area.x;
      const mainW = sideRoom ? area.w - leftColumnW - mainGap - powerW - powerGap : area.w;
      const tankW = sideRoom ? Math.min(mainW, area.h * 1.52) : Math.min(area.w * 0.9, area.h * 1.45);
      const tankH = Math.min(area.h * (sideRoom ? 0.7 : 0.66), tankW * 0.58);
      const tankX = sideRoom ? mainX + Math.max(0, mainW - tankW) * 0.5 : area.x + (area.w - tankW) / 2;
      const tankY = area.y + (area.h - tankH) / 2;
      const tank = { x: tankX, y: tankY, w: tankW, h: tankH };
      const gel = {
        x: tank.x + tank.w * 0.18,
        y: tank.y + tank.h * 0.18,
        w: tank.w * 0.64,
        h: tank.h * 0.66
      };
      const leftX = sideRoom ? area.x + clamp(area.w * 0.035, 22, 44) : area.x + area.w * 0.05;
      const leftCenterX = sideRoom ? area.x + leftColumnW * 0.5 : area.x + area.w * 0.24;
      const beaker = sideRoom
        ? { x: leftX + leftColumnW * 0.16, y: area.y + area.h * 0.5, w: clamp(area.w * 0.055, 56, 74), h: clamp(area.h * 0.095, 58, 78) }
        : { x: area.x + area.w * 0.05, y: area.y + area.h * 0.56, w: Math.min(54, area.w * 0.13), h: Math.min(60, area.h * 0.22) };
      const power = sideRoom
        ? {
          x: Math.min(area.x + area.w - powerW - 2, tank.x + tank.w + powerGap),
          y: tank.y + (tank.h - powerH) / 2,
          w: powerW,
          h: powerH
        }
        : {
          x: Math.min(area.x + area.w - powerW - 4, tank.x + tank.w + 8),
          y: tank.y + tank.h * 0.08,
          w: powerW,
          h: powerH
        };
      const uv = sideRoom
        ? { x: leftX + leftColumnW * 0.12, y: area.y + area.h * 0.18, w: clamp(leftColumnW * 0.55, 128, 170), h: clamp(area.h * 0.12, 78, 102) }
        : { x: area.x + area.w * 0.05, y: area.y + area.h * 0.12, w: Math.min(112, area.w * 0.25), h: Math.min(72, area.h * 0.2) };
      const tubeRack = sideRoom
        ? { x: leftX, y: area.y + area.h * 0.8, w: clamp(leftColumnW * 0.72, 170, 220), h: Math.min(66, area.h * 0.16) }
        : { x: area.x + area.w * 0.04, y: area.y + area.h * 0.81, w: Math.min(160, area.w * 0.38), h: Math.min(54, area.h * 0.15) };
      const tipRackW = sideRoom ? clamp(leftColumnW * 0.27, 78, 96) : Math.min(74, area.w * 0.16);
      const tipRackH = sideRoom ? Math.min(52, area.h * 0.13) : Math.min(46, area.h * 0.14);
      const tipGap = sideRoom ? clamp(leftColumnW * 0.055, 14, 22) : clamp(area.w * 0.04, 12, 20);
      const tipRack = sideRoom
        ? {
          x: Math.min(leftX + leftColumnW - tipRackW - 8, beaker.x + beaker.w + tipGap),
          y: beaker.y + Math.max(0, (beaker.h - tipRackH) / 2),
          w: tipRackW,
          h: tipRackH
        }
        : {
          x: Math.min(area.x + area.w - tipRackW - 8, beaker.x + beaker.w + tipGap),
          y: beaker.y + Math.max(0, (beaker.h - tipRackH) / 2),
          w: tipRackW,
          h: tipRackH
        };
      const pipette = {
        x: sideRoom ? leftCenterX : area.x + area.w * 0.33,
        y: sideRoom ? area.y + area.h * 0.35 : area.y + area.h * 0.36,
        w: tiny ? 28 : 34,
        h: tiny ? 118 : 150
      };
      lastLayout = { compact, tiny, sideRoom, area, tank, gel, beaker, power, pipette, uv, tubeRack, tipRack };
      return lastLayout;
    }

    function laneCenters(gel) {
      return LANES.map((lane, index) => ({
        lane,
        cx: gel.x + gel.w * (0.14 + index * 0.24),
        wellY: gel.y + gel.h * 0.12
      }));
    }

    function drawRoundRect(x, y, w, h, r, fill, stroke, lineWidth) {
      const radius = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.arcTo(x + w, y, x + w, y + h, radius);
      ctx.arcTo(x + w, y + h, x, y + h, radius);
      ctx.arcTo(x, y + h, x, y, radius);
      ctx.arcTo(x, y, x + w, y, radius);
      ctx.closePath();
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lineWidth || 1;
        ctx.stroke();
      }
    }

    function drawLabel(text, x, y, options) {
      const opts = options || {};
      ctx.save();
      ctx.font = `${opts.weight || 850} ${opts.size || 13}px "Microsoft YaHei","PingFang SC",Arial`;
      ctx.fillStyle = opts.color || "#e2e8f0";
      ctx.textAlign = opts.align || "center";
      ctx.textBaseline = opts.baseline || "middle";
      if (opts.maxWidth) ctx.fillText(text, x, y, opts.maxWidth);
      else ctx.fillText(text, x, y);
      ctx.restore();
    }

    function drawVerticalLabel(text, x, y, options) {
      const opts = options || {};
      const chars = Array.from(text);
      const size = opts.size || 12;
      const gap = opts.gap || size * 0.9;
      const startY = y - ((chars.length - 1) * gap) / 2;
      ctx.save();
      ctx.font = `${opts.weight || 850} ${size}px "Microsoft YaHei","PingFang SC",Arial`;
      ctx.fillStyle = opts.color || "#e2e8f0";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      chars.forEach((char, index) => {
        ctx.fillText(char, x, startY + index * gap);
      });
      ctx.restore();
    }

    function drawArrow(x1, y1, x2, y2, color, widthValue) {
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const size = 8;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = widthValue || 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - Math.cos(angle - Math.PI / 6) * size, y2 - Math.sin(angle - Math.PI / 6) * size);
      ctx.lineTo(x2 - Math.cos(angle + Math.PI / 6) * size, y2 - Math.sin(angle + Math.PI / 6) * size);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function drawTarget(x, y, w, h, active) {
      if (!active) return;
      ctx.save();
      ctx.setLineDash([7, 5]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(226,232,240,.82)";
      ctx.fillStyle = "rgba(226,232,240,.045)";
      drawRoundRect(x, y, w, h, 14, "rgba(226,232,240,.045)", "rgba(226,232,240,.82)", 2);
      ctx.restore();
    }

    function drawBackground() {
      ctx.clearRect(0, 0, width, height);
      const bg = ctx.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, "#25384b");
      bg.addColorStop(0.55, "#1d3143");
      bg.addColorStop(1, "#142233");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
      ctx.save();
      ctx.globalAlpha = 0.28;
      const bench = ctx.createLinearGradient(0, height * 0.72, 0, height);
      bench.addColorStop(0, "rgba(15,23,42,0)");
      bench.addColorStop(1, "rgba(2,6,23,.6)");
      ctx.fillStyle = bench;
      ctx.fillRect(0, height * 0.62, width, height * 0.38);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.strokeStyle = "rgba(226,232,240,.34)";
      ctx.lineWidth = 1;
      const gap = 34;
      for (let x = -gap; x < width + gap; x += gap) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + height * 0.45, height);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawTank(layout) {
      const { tank, gel, tiny, compact } = layout;
      drawRoundRect(tank.x, tank.y, tank.w, tank.h, 22, "rgba(125,211,252,.09)", "rgba(191,219,254,.28)", 2);
      drawRoundRect(tank.x + tank.w * 0.04, tank.y + tank.h * 0.08, tank.w * 0.92, tank.h * 0.78, 18, "rgba(14,165,233,.13)", "rgba(125,211,252,.2)", 1);
      ctx.save();
      ctx.globalAlpha = 0.88;
      drawRoundRect(gel.x, gel.y, gel.w, gel.h, 14, "rgba(207,250,254,.72)", "rgba(15,118,110,.48)", 2);
      ctx.restore();
      if (state.gelReady || state.step > 0) {
        ctx.save();
        ctx.fillStyle = "rgba(15,118,110,.08)";
        for (let i = 0; i < 10; i += 1) {
          const y = gel.y + gel.h * (0.18 + i * 0.07);
          ctx.beginPath();
          ctx.moveTo(gel.x + gel.w * 0.08, y);
          ctx.quadraticCurveTo(gel.x + gel.w * 0.48, y + 5, gel.x + gel.w * 0.92, y);
          ctx.strokeStyle = "rgba(15,118,110,.13)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.restore();
      }
      const normal = state.caseId !== "reversed";
      const topLabel = normal ? "负极 - 加样孔端" : "正极 + 接反";
      const bottomLabel = normal ? "正极 + 目标方向" : "负极 -";
      const electrodeX = gel.x - tank.w * 0.02;
      const electrodeW = gel.w + tank.w * 0.04;
      const electrodeH = clamp(tank.h * 0.038, 8, 16);
      const topElectrodeY = tank.y + tank.h * 0.082;
      const bottomElectrodeY = tank.y + tank.h * 0.865;
      drawRoundRect(electrodeX, topElectrodeY, electrodeW, electrodeH, electrodeH / 2, normal ? "#111827" : "#b91c1c", null, 0);
      drawRoundRect(electrodeX, bottomElectrodeY, electrodeW, electrodeH, electrodeH / 2, normal ? "#b91c1c" : "#111827", null, 0);
      if (!tiny) {
        const outsideTopY = tank.y - (compact ? 13 : 16);
        const outsideBottomY = Math.min(height - 92, tank.y + tank.h + (compact ? 16 : 20));
        drawLabel(topLabel, tank.x + 18, outsideTopY, { size: compact ? 11 : 12, color: normal ? "#cbd5e1" : "#fecaca", align: "left", maxWidth: tank.w * 0.26 });
        drawLabel("电泳槽 / 缓冲液", tank.x + tank.w * 0.5, outsideTopY, { size: compact ? 12 : 14, color: "#dbeafe" });
        drawLabel(bottomLabel, tank.x + tank.w - 18, outsideBottomY, { size: compact ? 11 : 12, color: normal ? "#fecaca" : "#cbd5e1", align: "right", maxWidth: tank.w * 0.28 });
      }
      const arrowX = gel.x + gel.w + tank.w * 0.06;
      const arrowTop = gel.y + gel.h * 0.16;
      const arrowBottom = gel.y + gel.h * 0.82;
      if (normal) {
        drawArrow(arrowX, arrowTop, arrowX, arrowBottom, "rgba(15,23,42,.7)", 2);
      } else {
        drawArrow(arrowX, arrowBottom, arrowX, arrowTop, "rgba(153,27,27,.78)", 2);
      }
      if (!tiny) drawVerticalLabel(normal ? "DNA向正极移动" : "方向错误", arrowX + 16, (arrowTop + arrowBottom) / 2, { size: compact ? 10 : 12, gap: compact ? 10 : 12, color: normal ? "#0f172a" : "#7f1d1d" });
    }

    function drawWellsAndLanes(layout) {
      const { gel, compact, tiny } = layout;
      const centers = laneCenters(gel);
      const selected = state.selectedLane;
      const laneW = gel.w * 0.17;
      const wellW = clamp(gel.w * 0.11, 24, 46);
      const wellH = clamp(gel.h * 0.045, 10, 17);
      centers.forEach(({ lane, cx, wellY }) => {
        if (lane.id === selected) {
          drawRoundRect(cx - laneW / 2, gel.y + gel.h * 0.08, laneW, gel.h * 0.82, 12, "rgba(37,99,235,.1)", "rgba(37,99,235,.32)", 1.5);
        }
        const label = compact ? lane.compact : lane.label;
        drawLabel(label, cx, gel.y - 12, { size: tiny ? 11 : 13, color: "#e2e8f0", maxWidth: laneW + 26 });
        drawRoundRect(cx - wellW / 2, wellY - wellH / 2, wellW, wellH, 4, state.gelReady || state.step > 0 ? "#0f172a" : "rgba(15,23,42,.25)", "rgba(15,23,42,.38)", 1);
        if (state.step === 1 && state.pipetteSample === lane.id) {
          drawTarget(cx - laneW * 0.56, wellY - 25, laneW * 1.12, 50, true);
        }
        rectHit(`well-${lane.id}`, cx - Math.max(wellW, laneW) * 0.65, wellY - 34, Math.max(wellW, laneW) * 1.3, 72, lane.id);
        rectHit(`lane-${lane.id}`, cx - laneW * 0.66, gel.y - 8, laneW * 1.32, gel.h + 16, lane.id);
        if (state.samplesLoaded || state.step >= 2 || hasLoadedLane(state, lane.id)) {
          drawRoundRect(cx - wellW * 0.36, wellY - wellH * 0.2, wellW * 0.72, wellH * 0.5, 4, lane.id === "negative" && state.caseId !== "contam" ? "rgba(148,163,184,.36)" : "rgba(37,99,235,.72)", null, 0);
          drawLabel("✓", cx + wellW * 0.6, wellY, { size: tiny ? 9 : 11, color: "#16a34a" });
        }
      });
      if (state.step === 1) {
        const first = centers[0];
        const last = centers[centers.length - 1];
        drawTarget(first.cx - laneW * 0.82, first.wellY - 25, last.cx - first.cx + laneW * 1.64, 50, !!state.pipetteSample);
      }
    }

    function bandYFor(fragment, wellY, gel, progress, reversed) {
      if (reversed) {
        return wellY - progress * (gel.h * (0.18 + (1 - fragment.ratio) * 0.12));
      }
      return wellY + progress * (gel.h * fragment.ratio);
    }

    function drawBands(layout) {
      const { gel, tiny } = layout;
      if (state.step < 2 && !state.samplesLoaded) return;
      const centers = laneCenters(gel);
      const progress = state.step < 2 ? 0 : state.running ? state.progress : state.step >= 3 ? 1 : state.progress;
      const reversed = state.caseId === "reversed";
      const stained = state.step >= 4 || state.stained;
      centers.forEach(({ lane, cx, wellY }) => {
        const fragments = laneFragmentsForState(lane, state);
        fragments.forEach((fragment) => {
          const y = bandYFor(fragment, wellY, gel, progress, reversed);
          const bandW = lane.id === "marker" ? gel.w * 0.13 : gel.w * 0.16;
          const bandH = clamp(7 + (600 / fragment.size), 8, 14);
          const alpha = state.step >= 3 ? 0.92 : state.running ? 0.76 : 0.54;
          ctx.save();
          ctx.globalAlpha = alpha;
          const color = stained ? "#16a34a" : "#2563eb";
          drawRoundRect(cx - bandW / 2, y - bandH / 2, bandW, bandH, bandH / 2, color, stained ? "rgba(187,247,208,.65)" : "rgba(191,219,254,.65)", 1);
          ctx.restore();
          rectHit(`band-${lane.id}`, cx - bandW / 2 - 8, y - bandH / 2 - 10, bandW + 16, bandH + 20, lane.id);
          if (state.step >= 4 && lane.id === "marker" && !tiny) {
            drawLabel(`${fragment.size}`, cx - bandW * 1.35, y, { size: 10, color: "#0f172a", align: "right" });
          }
        });
      });
      if (state.step >= 4 && !tiny) {
        drawLabel("bp", gel.x + gel.w * 0.03, gel.y + gel.h * 0.18, { size: 10, color: "#0f172a", align: "left" });
      }
    }

    function drawGelPlate(layout) {
      const { gel, tiny } = layout;
      if (state.step !== 3 || state.uvPlateLoaded) return;
      const plateW = gel.w * 0.98;
      const plateH = gel.h * 0.92;
      const x = dragGelPlate ? pointer.x - plateW / 2 : gel.x + gel.w * 0.01;
      const y = dragGelPlate ? pointer.y - plateH / 2 : gel.y + gel.h * 0.04;
      ctx.save();
      ctx.globalAlpha = dragGelPlate ? 0.9 : 0.72;
      drawRoundRect(x, y, plateW, plateH, 12, "rgba(226,232,240,.05)", "rgba(226,232,240,.72)", 1.5);
      drawRoundRect(x + plateW * 0.36, y - 7, plateW * 0.28, 10, 5, "rgba(226,232,240,.8)", null, 0);
      if (!tiny && !dragGelPlate) {
        drawLabel("拖动凝胶托盘", x + plateW * 0.5, y + plateH + 16, { size: 12, color: "#e2e8f0" });
      }
      ctx.restore();
      drawTarget(x - 8, y - 8, plateW + 16, plateH + 16, !dragGelPlate);
      if (!dragGelPlate) rectHit("gelPlate", x - 16, y - 16, plateW + 32, plateH + 32);
    }

    function drawMiniGelImage(uv, lit) {
      const gx = uv.x + uv.w * 0.16;
      const gy = uv.y + uv.h * 0.18;
      const gw = uv.w * 0.68;
      const gh = uv.h * 0.34;
      drawRoundRect(gx, gy, gw, gh, 6, lit ? "rgba(187,247,208,.16)" : "rgba(226,232,240,.08)", "rgba(226,232,240,.22)", 1);
      if (!lit) {
        drawLabel("凝胶", gx + gw * 0.5, gy + gh * 0.5, { size: 10, color: "#94a3b8" });
        return;
      }
      LANES.forEach((lane, index) => {
        const cx = gx + gw * (0.16 + index * 0.23);
        laneFragmentsForState(lane, state).forEach((fragment) => {
          const y = gy + gh * (0.16 + fragment.ratio * 0.72);
          const bandW = lane.id === "marker" ? gw * 0.12 : gw * 0.16;
          drawRoundRect(cx - bandW / 2, y - 2.5, bandW, 5, 3, "#22c55e", "rgba(187,247,208,.6)", 1);
        });
      });
    }

    function drawUVBox(layout) {
      const { uv, tiny } = layout;
      const loaded = state.uvPlateLoaded || state.step >= 4;
      const lit = state.uvLightOn || state.step >= 4 || state.stained;
      drawRoundRect(uv.x, uv.y, uv.w, uv.h, 12, "rgba(15,23,42,.56)", "rgba(203,213,225,.2)", 1.5);
      drawRoundRect(uv.x + uv.w * 0.1, uv.y + uv.h * 0.13, uv.w * 0.8, uv.h * 0.5, 6, "#0a0a0f", "rgba(255,255,255,.16)", 1);
      if (loaded) drawMiniGelImage(uv, lit);
      const switchX = uv.x + uv.w * 0.29;
      const switchY = uv.y + uv.h * 0.72;
      const switchW = uv.w * 0.42;
      const switchH = uv.h * 0.18;
      drawRoundRect(switchX, switchY, switchW, switchH, 7, lit ? "rgba(20,184,166,.72)" : "rgba(148,163,184,.28)", null, 0);
      if (!tiny) {
        drawLabel("紫外观察箱", uv.x + uv.w * 0.5, uv.y - 10, { size: 12, color: "#dbeafe" });
        drawLabel(lit ? "UV 已开" : loaded ? "开 UV" : "放入凝胶", uv.x + uv.w * 0.5, uv.y + uv.h * 0.81, { size: 11, color: "#f8fafc" });
      }
      if (state.step === 3 && !state.uvPlateLoaded) drawTarget(uv.x - 9, uv.y - 9, uv.w + 18, uv.h + 18, true);
      if (state.step === 3 && state.uvPlateLoaded && !state.uvLightOn) drawTarget(switchX - 7, switchY - 7, switchW + 14, switchH + 14, true);
      rectHit("uvSwitch", switchX - 10, switchY - 10, switchW + 20, switchH + 20);
      rectHit("uvBox", uv.x - 12, uv.y - 12, uv.w + 24, uv.h + 26);
    }

    function drawTipRack(layout) {
      if (state.step > 1) return;
      const { tipRack, tiny } = layout;
      const active = state.step === 1 && !state.pipetteTip;
      drawRoundRect(tipRack.x, tipRack.y, tipRack.w, tipRack.h, 10, "rgba(226,232,240,.18)", "rgba(226,232,240,.24)", 1);
      for (let i = 0; i < 5; i += 1) {
        const x = tipRack.x + tipRack.w * (0.17 + i * 0.16);
        ctx.fillStyle = i === 0 && state.pipetteTip ? "rgba(148,163,184,.22)" : "#f8fafc";
        ctx.beginPath();
        ctx.moveTo(x - 5, tipRack.y + tipRack.h * 0.2);
        ctx.lineTo(x + 5, tipRack.y + tipRack.h * 0.2);
        ctx.lineTo(x + 2, tipRack.y + tipRack.h * 0.78);
        ctx.lineTo(x - 2, tipRack.y + tipRack.h * 0.78);
        ctx.closePath();
        ctx.fill();
      }
      if (!tiny) drawLabel(state.pipetteTip ? "已取吸头" : "取吸头", tipRack.x + tipRack.w * 0.5, tipRack.y + tipRack.h + 13, { size: 12, color: "#e2e8f0" });
      drawTarget(tipRack.x - 10, tipRack.y - 10, tipRack.w + 20, tipRack.h + 22, active);
      rectHit("tipRack", tipRack.x - 18, tipRack.y - 18, tipRack.w + 36, tipRack.h + 44);
    }

    function drawTubeRack(layout) {
      const { tubeRack, tiny } = layout;
      drawRoundRect(tubeRack.x, tubeRack.y + tubeRack.h * 0.43, tubeRack.w, tubeRack.h * 0.5, 10, "rgba(15,23,42,.22)", "rgba(226,232,240,.18)", 1);
      const gap = tubeRack.w / SAMPLE_TUBES.length;
      SAMPLE_TUBES.forEach((tube, index) => {
        const cx = tubeRack.x + gap * (index + 0.5);
        const tubeW = Math.min(30, gap * 0.48);
        const tubeH = tubeRack.h * 0.82;
        const topY = tubeRack.y + tubeRack.h * 0.08;
        const loaded = hasLoadedLane(state, tube.id);
        drawRoundRect(cx - tubeW / 2, topY, tubeW, tubeH, 9, "rgba(226,232,240,.14)", "rgba(226,232,240,.34)", 1);
        drawRoundRect(cx - tubeW * 0.45, topY - 6, tubeW * 0.9, 8, 4, loaded ? "rgba(148,163,184,.42)" : tube.color, null, 0);
        const fillH = loaded ? tubeH * 0.22 : tubeH * 0.48;
        drawRoundRect(cx - tubeW * 0.35, topY + tubeH - fillH - 5, tubeW * 0.7, fillH, 7, loaded ? "rgba(148,163,184,.24)" : `${tube.color}cc`, null, 0);
        drawLabel(tiny ? tube.compact : tube.label, cx, topY + tubeH + 12, { size: tiny ? 10 : 11, color: "#f8fafc", maxWidth: gap });
        const readyToSample = state.step === 1 && state.pipetteTip && !state.pipetteSample && !loaded;
        if (readyToSample || state.pipetteSample === tube.id) {
          drawTarget(cx - gap * 0.42, topY - 14, gap * 0.84, tubeH + 30, true);
        }
        rectHit(`tube-${tube.id}`, cx - gap * 0.48, topY - 18, gap * 0.96, tubeH + 42, tube.id);
      });
      if (!tiny) drawLabel("样本管架", tubeRack.x + tubeRack.w * 0.5, tubeRack.y - 10, { size: 12, color: "#dbeafe" });
    }

    function drawBeaker(layout) {
      const { beaker, tiny } = layout;
      const active = state.step === 0 && !state.gelReady;
      ctx.save();
      ctx.globalAlpha = state.step > 0 ? 0.5 : 1;
      drawRoundRect(beaker.x, beaker.y, beaker.w, beaker.h, 12, "rgba(226,232,240,.08)", "rgba(226,232,240,.38)", 1.5);
      const liquidH = beaker.h * 0.46;
      drawRoundRect(beaker.x + beaker.w * 0.14, beaker.y + beaker.h - liquidH - beaker.h * 0.08, beaker.w * 0.72, liquidH, 8, "rgba(45,212,191,.34)", "rgba(45,212,191,.34)", 1);
      ctx.restore();
      if (!tiny) drawLabel("凝胶液", beaker.x + beaker.w * 0.5, beaker.y - 10, { size: 12, color: "#ccfbf1" });
      drawTarget(beaker.x - 8, beaker.y - 8, beaker.w + 16, beaker.h + 16, active);
      rectHit("flask", beaker.x - 14, beaker.y - 14, beaker.w + 28, beaker.h + 34);
    }

    function drawPipette(layout) {
      const { pipette, tiny } = layout;
      const visible = state.step === 1;
      if (!visible) return;
      const active = state.step === 1;
      const cx = dragPipette ? pointer.x : pipette.x;
      const y = dragPipette ? pointer.y - pipette.h * 0.55 : pipette.y;
      const w = pipette.w;
      const h = pipette.h;
      ctx.save();
      ctx.globalAlpha = 1;
      drawRoundRect(cx - w * 0.28, y, w * 0.56, h * 0.12, 5, "#38bdf8", null, 0);
      drawRoundRect(cx - w * 0.38, y + h * 0.1, w * 0.76, h * 0.36, 7, "#f8fafc", "rgba(15,23,42,.28)", 1);
      drawRoundRect(cx - w * 0.14, y + h * 0.43, w * 0.28, h * 0.24, 5, "#e5e7eb", "rgba(15,23,42,.18)", 1);
      if (state.pipetteSample) {
        const tube = SAMPLE_TUBES.find((item) => item.id === state.pipetteSample);
        drawRoundRect(cx - w * 0.09, y + h * 0.49, w * 0.18, h * 0.16, 4, tube ? tube.color : "#38bdf8", null, 0);
      }
      ctx.fillStyle = state.pipetteTip ? "#f8fafc" : "rgba(248,250,252,.38)";
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.13, y + h * 0.66);
      ctx.lineTo(cx + w * 0.13, y + h * 0.66);
      ctx.lineTo(cx + w * 0.04, y + h);
      ctx.lineTo(cx - w * 0.04, y + h);
      ctx.closePath();
      ctx.fill();
      if (state.pipetteSample) {
        const tube = SAMPLE_TUBES.find((item) => item.id === state.pipetteSample);
        ctx.fillStyle = tube ? tube.color : "#38bdf8";
        ctx.beginPath();
        ctx.arc(cx, y + h + 4, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      if (!tiny) {
        const text = state.pipetteSample ? `已吸取${laneById(state.pipetteSample).label}` : state.pipetteTip ? "拖到样本管吸样" : "移液器";
        drawLabel(text, cx, y - 12, { size: 12, color: "#dbeafe", maxWidth: 120 });
      }
      drawTarget(cx - w * 0.75, y - 10, w * 1.5, h + 22, active && !state.pipetteSample);
      rectHit("pipette", cx - w * 0.85, y - 12, w * 1.7, h + 28);
    }

    function drawPower(layout) {
      const { power, tank, tiny } = layout;
      const active = state.step === 2 && !state.running;
      const accent = CASE_COLORS[state.caseId] || "#0f766e";
      drawRoundRect(power.x, power.y, power.w, power.h, 14, "rgba(15,23,42,.92)", "rgba(226,232,240,.24)", 1.5);
      drawRoundRect(power.x + power.w * 0.14, power.y + power.h * 0.16, power.w * 0.72, power.h * 0.28, 8, "rgba(15,118,110,.22)", "rgba(94,234,212,.3)", 1);
      drawLabel(state.running ? `${Math.round(state.progress * 100)}%` : "电源", power.x + power.w * 0.5, power.y + power.h * 0.3, { size: tiny ? 11 : 13, color: "#ccfbf1" });
      ctx.fillStyle = "#dc2626";
      ctx.beginPath();
      ctx.arc(power.x + power.w * 0.3, power.y + power.h * 0.68, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#111827";
      ctx.beginPath();
      ctx.arc(power.x + power.w * 0.7, power.y + power.h * 0.68, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const redStart = { x: power.x + power.w * 0.3, y: power.y + power.h * 0.68 };
      const blackStart = { x: power.x + power.w * 0.7, y: power.y + power.h * 0.68 };
      const normal = state.caseId !== "reversed";
      const topContact = { x: tank.x + tank.w + 4, y: tank.y + tank.h * 0.115 };
      const bottomContact = { x: tank.x + tank.w + 4, y: tank.y + tank.h * 0.875 };
      const redEnd = normal ? bottomContact : topContact;
      const blackEnd = normal ? topContact : bottomContact;
      const wireX = Math.max(tank.x + tank.w + 12, power.x - 12);
      function drawWire(points, color) {
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
        ctx.stroke();
      }
      drawWire([redStart, { x: wireX, y: redStart.y }, { x: wireX, y: redEnd.y }, redEnd], "rgba(220,38,38,.78)");
      drawWire([blackStart, { x: wireX + 8, y: blackStart.y }, { x: wireX + 8, y: blackEnd.y }, blackEnd], "rgba(15,23,42,.84)");
      ctx.restore();
      ctx.fillStyle = "#dc2626";
      ctx.beginPath();
      ctx.arc(redEnd.x, redEnd.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#111827";
      ctx.beginPath();
      ctx.arc(blackEnd.x, blackEnd.y, 4, 0, Math.PI * 2);
      ctx.fill();
      drawTarget(power.x - 8, power.y - 8, power.w + 16, power.h + 16, active);
      rectHit("powerBox", power.x - 12, power.y - 12, power.w + 24, power.h + 24);
      if (state.caseId !== "normal") {
        drawRoundRect(power.x, power.y - 28, power.w, 22, 9, `${accent}22`, `${accent}66`, 1);
        drawLabel(caseById(state.caseId).short, power.x + power.w * 0.5, power.y - 17, { size: 11, color: "#f8fafc" });
      }
    }

    function drawCaseBadges(layout) {
      const { gel, tank, tiny, compact } = layout;
      if (state.step < 4 && state.caseId === "normal") return;
      const scenario = caseById(state.caseId);
      if (tiny) return;
      const x = tank.x + tank.w * 0.5;
      const y = Math.min(height - 88, tank.y + tank.h + (compact ? 16 : 22));
      drawRoundRect(x - 118, y - 13, 236, 26, 12, "rgba(15,23,42,.72)", "rgba(255,255,255,.12)", 1);
      drawLabel(`判读顺序：Marker → 对照 → 样品`, x, y, { size: compact ? 11 : 12, color: "#e2e8f0" });
      if (scenario.id !== "normal") {
        drawRoundRect(x - 68, y + 20, 136, 24, 11, "rgba(127,29,29,.5)", "rgba(248,113,113,.24)", 1);
        drawLabel(scenario.short, x, y + 32, { size: 12, color: "#fecaca" });
      }
    }

    function paint(now) {
      if (!alive) return;
      hits = [];
      const layout = fitLayout();
      drawBackground();
      drawUVBox(layout);
      drawTubeRack(layout);
      drawTipRack(layout);
      drawBeaker(layout);
      drawTank(layout);
      drawPower(layout);
      drawWellsAndLanes(layout);
      drawBands(layout);
      drawGelPlate(layout);
      drawPipette(layout);
      drawCaseBadges(layout);
      if (state.running) {
        const { gel } = layout;
        const pulse = 0.5 + Math.sin(now / 220) * 0.5;
        ctx.save();
        ctx.globalAlpha = 0.12 + pulse * 0.06;
        drawRoundRect(gel.x, gel.y, gel.w, gel.h, 14, "rgba(15,118,110,.32)", null, 0);
        ctx.restore();
      }
    }

    function loop(now) {
      paint(now);
      raf = window.requestAnimationFrame(loop);
    }

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    if (typeof ResizeObserver === "function") {
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(canvas);
    }
    window.addEventListener("resize", resize);
    resize();
    raf = window.requestAnimationFrame(loop);

    return {
      sync() {
        paint(performance.now());
      },
      destroy() {
        alive = false;
        if (raf) window.cancelAnimationFrame(raf);
        if (resizeObserver) resizeObserver.disconnect();
        window.removeEventListener("resize", resize);
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerleave", onPointerLeave);
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointerup", onPointerUp);
      },
      get layout() {
        return lastLayout;
      }
    };
  }

  return {
    mount(container, context) {
      if (!container) return;
      const externalPanel = context && context.externalPanel && context.externalPanel.nodeType === 1 ? context.externalPanel : null;
      const externalPanelStyle = externalPanel ? {
        overflow: externalPanel.style.overflow,
        overflowY: externalPanel.style.overflowY,
        overscrollBehavior: externalPanel.style.overscrollBehavior,
        scrollbarWidth: externalPanel.style.scrollbarWidth,
        touchAction: externalPanel.style.touchAction,
        background: externalPanel.style.background,
        border: externalPanel.style.border,
        borderRadius: externalPanel.style.borderRadius,
        boxShadow: externalPanel.style.boxShadow,
        padding: externalPanel.style.padding,
        height: externalPanel.style.height,
        minHeight: externalPanel.style.minHeight
      } : null;

      if (externalPanel) {
        externalPanel.style.overflow = "hidden auto";
        externalPanel.style.overflowY = "auto";
        externalPanel.style.overscrollBehavior = "contain";
        externalPanel.style.scrollbarWidth = "none";
        externalPanel.style.touchAction = "pan-y";
        externalPanel.style.background = "transparent";
        externalPanel.style.border = "0";
        externalPanel.style.borderRadius = "0";
        externalPanel.style.boxShadow = "none";
        externalPanel.style.padding = "0";
        externalPanel.style.height = "100%";
        externalPanel.style.minHeight = "0";
      }

      container.style.width = "100%";
      container.style.height = "100%";
      container.style.overflow = "hidden";

      const state = initialState();
      let model = null;
      let interval = null;
      let resizeObserver = null;

      function clearRun() {
        if (interval) clearInterval(interval);
        interval = null;
        state.running = false;
      }

      function renderPanel() {
        if (externalPanel) {
          externalPanel.innerHTML = renderControls(state, fitFor(externalPanel));
        }
      }

      function renderAll() {
        updateStageText(container, state);
        renderPanel();
        if (model) model.sync();
      }

      function setStep(step, hint) {
        clearRun();
        state.step = clamp(step, 0, STEPS.length - 1);
        state.answer = "";
        state.gelReady = state.step >= 1;
        state.samplesLoaded = state.step >= 2;
        if (state.step >= 2) state.loadedLanes = LANES.map((lane) => lane.id);
        state.progress = state.step < 2 ? 0 : state.step >= 3 ? 1 : state.progress;
        state.stained = state.step >= 4;
        state.uvPlateLoaded = state.step >= 4;
        state.uvLightOn = state.step >= 4;
        if (state.step !== 1) {
          state.pipetteTip = false;
          state.pipetteSample = "";
        }
        state.modelHint = hint || labTaskForState(state).prompt;
        renderAll();
      }

      function runGel() {
        clearRun();
        state.step = 2;
        state.answer = "";
        state.gelReady = true;
        state.samplesLoaded = true;
        state.loadedLanes = LANES.map((lane) => lane.id);
        state.pipetteTip = false;
        state.pipetteSample = "";
        state.progress = 0;
        state.stained = false;
        state.uvPlateLoaded = false;
        state.uvLightOn = false;
        state.running = true;
        state.modelHint = LAB_TASKS[2].done;
        renderAll();
        const startedAt = Date.now();
        const runDuration = 4200;
        interval = setInterval(() => {
          state.progress = clamp((Date.now() - startedAt) / runDuration, 0, 1);
          if (state.progress >= 1) {
            clearRun();
            state.step = 3;
            state.stained = false;
            state.uvPlateLoaded = false;
            state.uvLightOn = false;
            state.modelHint = LAB_TASKS[3].prompt;
          }
          renderAll();
        }, 60);
      }

      function selectLane(laneId) {
        if (!laneId) return;
        state.selectedLane = laneId;
        state.answer = "";
        renderAll();
      }

      function tryModelAction(targetId) {
        if (state.running) return;
        const rawId = String(targetId || "");
        const isDrag = rawId.startsWith("drag-");
        const isDirect = rawId.startsWith("direct-");
        const id = isDrag ? rawId.slice(5) : isDirect ? rawId.slice(7) : rawId;
        const laneIdFromTarget = id.startsWith("tube-")
          ? id.replace("tube-", "")
          : id.startsWith("well-")
            ? id.replace("well-", "")
            : id.startsWith("lane-")
              ? id.replace("lane-", "")
              : "";
        const targetLane = laneIdFromTarget ? laneById(laneIdFromTarget) : null;
        if (state.step === 0) {
          if (id === "flask") {
            setStep(1, LAB_TASKS[0].done);
            return;
          }
          state.modelHint = "当前要先制胶：请点击左侧凝胶液。";
        } else if (state.step === 1) {
          if (isDirect) {
            state.modelHint = "点样要用移液器完成：请按住移液器，把它拖到取吸头架、样本管和加样孔。";
          } else if (isDrag && id === "tipRack") {
            state.pipetteTip = true;
            state.pipetteSample = "";
            state.modelHint = "吸头已装好。继续拖动移液器到样本管吸取对应样本。";
          } else if (isDrag && id.startsWith("tube-") && targetLane) {
            if (hasLoadedLane(state, targetLane.id)) {
              state.modelHint = `${targetLane.label}已经加样，换下一个还没加的样本管。`;
            } else if (!state.pipetteTip) {
              state.modelHint = "先把移液器拖到取吸头架装吸头，再去吸取样本，避免污染。";
            } else {
              state.pipetteSample = targetLane.id;
              state.selectedLane = targetLane.id;
              state.modelHint = `已吸取${targetLane.label}。继续拖动移液器到对应的${targetLane.label}加样孔。`;
            }
          } else if (isDrag && (id.startsWith("well-") || id.startsWith("lane-")) && targetLane) {
            if (!state.pipetteSample) {
              state.modelHint = "还没有吸取样本：先拖到取吸头架，再拖到样本管。";
            } else if (state.pipetteSample !== targetLane.id) {
              state.modelHint = `当前吸取的是${laneById(state.pipetteSample).label}，要加到对应泳道，不能串孔。`;
            } else {
              state.loadedLanes = Array.from(new Set(loadedLaneIds(state).concat(targetLane.id)));
              state.pipetteSample = "";
              state.pipetteTip = false;
              state.selectedLane = targetLane.id;
              if (allLanesLoaded(state)) {
                setStep(2, LAB_TASKS[1].done);
                return;
              }
              state.modelHint = `${targetLane.label}已加样（${loadedLaneIds(state).length}/4）。继续拖动移液器取新吸头，再吸取下一个样本。`;
            }
          } else if (id === "pipette") {
            state.modelHint = state.pipetteTip
              ? state.pipetteSample
                ? "保持拖动，把移液器放到对应加样孔。"
                : "保持拖动，把移液器放到样本管上吸样。"
              : "保持拖动，把移液器放到取吸头架上。";
          } else {
            state.modelHint = "当前要完成点样：拖移液器取吸头 → 吸样本 → 加到对应泳道。";
          }
        } else if (state.step === 2) {
          if (id === "powerBox") {
            runGel();
            return;
          }
          state.modelHint = "当前要通电跑胶：请点击右侧电源。";
        } else if (state.step === 3) {
          if (!state.uvPlateLoaded) {
            if (isDrag && id === "uvBox") {
              state.uvPlateLoaded = true;
              state.uvLightOn = false;
              state.stained = false;
              state.modelHint = "凝胶已放入紫外观察箱。现在点击 UV 开关，观察哪些泳道出现条带。";
            } else if (id === "gelPlate" || id.startsWith("band-") || id.startsWith("lane-") || id.startsWith("well-")) {
              state.modelHint = "按住凝胶托盘，把整块跑完的凝胶拖到左上角紫外观察箱内。";
            } else if (id === "uvSwitch" || id === "uvBox") {
              state.modelHint = "还没把凝胶放进观察箱。先拖动凝胶托盘，再开 UV。";
            } else {
              state.modelHint = "跑胶完成：先拖动凝胶托盘到紫外观察箱，不是直接点击完成。";
            }
          } else if (!state.uvLightOn) {
            if (id === "uvSwitch" || id === "uvBox") {
              state.uvLightOn = true;
              state.stained = true;
              setStep(4, LAB_TASKS[3].done);
              return;
            }
            state.modelHint = "凝胶已经进箱。请点击紫外观察箱下方的 UV 开关，让条带显影后再判读。";
          } else {
            setStep(4, LAB_TASKS[3].done);
            return;
          }
        } else {
          state.modelHint = LAB_TASKS[4].prompt;
        }
        renderAll();
      }

      function actionFromEvent(event) {
        const target = event.target.closest && event.target.closest("[data-gel-action]");
        if (!target) return;
        const action = target.dataset.gelAction;
        if (action === "lane") {
          state.selectedLane = target.dataset.lane || "sample";
          state.answer = "";
        } else if (action === "reset") {
          clearRun();
          Object.assign(state, initialState());
        } else if (action === "case") {
          clearRun();
          state.caseId = target.dataset.case || "normal";
          const scenario = caseById(state.caseId);
          state.selectedLane = scenario.focusLane || state.selectedLane;
          state.answer = "";
          state.step = 4;
          state.progress = 1;
          state.gelReady = true;
          state.samplesLoaded = true;
          state.loadedLanes = LANES.map((lane) => lane.id);
          state.pipetteTip = false;
          state.pipetteSample = "";
          state.stained = true;
          state.uvPlateLoaded = true;
          state.uvLightOn = true;
          state.modelHint = scenario.note;
        } else if (action === "answer") {
          state.answer = target.dataset.answer || "";
        }
        renderAll();
      }

      container.innerHTML = renderStageShell(state);
      renderPanel();

      const canvas = container.querySelector(".gel-canvas");
      if (canvas) {
        model = createCanvasModel(canvas, state, { tryModelAction, selectLane });
      }

      if (externalPanel) {
        externalPanel.addEventListener("click", actionFromEvent);
        resizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(renderPanel) : null;
        if (resizeObserver) resizeObserver.observe(externalPanel);
      }

      container.__gelSceneCleanup = () => {
        clearRun();
        if (externalPanel) {
          externalPanel.removeEventListener("click", actionFromEvent);
          externalPanel.innerHTML = "";
          Object.assign(externalPanel.style, externalPanelStyle);
        }
        if (resizeObserver) resizeObserver.disconnect();
        if (model) {
          model.destroy();
          model = null;
        }
      };
    },

    unmount(container) {
      if (container && container.__gelSceneCleanup) container.__gelSceneCleanup();
      if (container) container.innerHTML = "";
    }
  };
})();
