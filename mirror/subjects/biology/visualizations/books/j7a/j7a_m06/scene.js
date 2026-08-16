window.BIO_VISUAL_SCENES = window.BIO_VISUAL_SCENES || {};

window.BIO_VISUAL_SCENES["j7a_m06"] = (function () {

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function loadModelViewer() {
    if (window.BiologyApp && typeof window.BiologyApp.loadBiologyModelViewer === "function") {
      return window.BiologyApp.loadBiologyModelViewer();
    }
    if (window.customElements && window.customElements.get("model-viewer")) {
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }

  const FEATURES = [
    {
      id: "overview",
      title: "整体形态",
      label: "鞋底形单细胞",
      image: "paramecium_overview.png",
      accent: "#38bdf8",
      orbit: "-35deg 68deg 105%",
      summary: "草履虫只有一个细胞，却能完成运动、取食、消化、排泄和应激反应。",
      teaching: "先从实体剖面看整体轮廓：它不是普通球体，而是前端略宽、后端略尖的鞋底形身体。外层、剖面和内部结构用不同材质分区，适合课堂讲结构与功能统一。"
    },
    {
      id: "cilia",
      title: "纤毛",
      label: "运动与取食",
      image: "paramecium_cilia.png",
      accent: "#a78bfa",
      orbit: "-75deg 66deg 88%",
      summary: "身体表面分布大量纤毛，协调摆动推动草履虫游动，也把食物颗粒扫入口沟。",
      teaching: "模型外缘的细密紫色短丝就是纤毛。讲课时可以把它理解为许多小桨：平时推动运动，遇到食物时还能形成水流，把颗粒送到口沟。"
    },
    {
      id: "oral",
      title: "口沟",
      label: "食物进入通道",
      image: "paramecium_oral_groove.png",
      accent: "#f472b6",
      orbit: "25deg 70deg 82%",
      summary: "口沟是草履虫取食的通道，食物被纤毛扫入口沟后形成食物泡。",
      teaching: "粉紫色凹槽表现口沟。它不是人的口，而是细胞表面的取食沟道；食物颗粒进入后会在细胞质内形成食物泡并开始消化。"
    },
    {
      id: "nucleus",
      title: "大核与小核",
      label: "营养与遗传",
      image: "paramecium_nucleus.png",
      accent: "#fb7185",
      orbit: "5deg 63deg 82%",
      summary: "大核主要调控营养代谢，小核与遗传和生殖有关。",
      teaching: "模型中央较大的玫红色弯豆形结构是大核，旁边较小的紫色球形结构是小核。两者分工不同，是草履虫内部结构教学的重点。"
    },
    {
      id: "contractile",
      title: "伸缩泡",
      label: "调节水分",
      image: "paramecium_contractile_vacuole.png",
      accent: "#67e8f9",
      orbit: "70deg 68deg 86%",
      summary: "伸缩泡收集并排出多余水分和代谢废物，帮助细胞维持内部环境稳定。",
      teaching: "前后两个蓝色放射状结构是伸缩泡。中央囊泡和周围放射管共同工作，适合讲单细胞生物也需要维持水盐平衡。"
    },
    {
      id: "food",
      title: "食物泡",
      label: "消化路径",
      image: "paramecium_food_vacuole.png",
      accent: "#a3e635",
      orbit: "-22deg 62deg 84%",
      summary: "食物泡在细胞质中流动并逐步消化，不能消化的残渣从胞肛排出。",
      teaching: "绿色小泡和金色颗粒组成了食物泡流动路径。它把“取食、形成食物泡、细胞质流动、消化吸收、排出残渣”串成一条可观察路线。"
    },
    {
      id: "cytopyge",
      title: "胞肛",
      label: "排出残渣",
      image: "paramecium_cytopyge.png",
      accent: "#fb923c",
      orbit: "-145deg 70deg 86%",
      summary: "胞肛是未消化食物残渣排出的部位，说明单细胞也有明确的功能分区。",
      teaching: "模型后侧橙红色短管表现胞肛。它帮助学生理解：草履虫虽然只有一个细胞，但不同部位依然承担不同生命活动。"
    }
  ];

  const SCENARIOS = [
    {
      id: "feed",
      title: "加入食物颗粒",
      label: "取食与消化",
      image: "paramecium_feed.png",
      accent: "#a3e635",
      summary: "观察口沟和食物泡：食物颗粒被纤毛带入口沟，在细胞质中形成食物泡并逐步消化。",
      teaching: "教学要点：草履虫主要靠纤毛的摆动在水中游动，同时将水中的细菌和微小的浮游生物扫入口沟。食物由口沟进入体内，形成食物泡。食物泡随着细胞质的流动，其中的食物逐渐被消化和吸收。"
    },
    {
      id: "salt",
      title: "盐粒刺激",
      label: "避害应激性",
      image: "paramecium_salt.png",
      accent: "#fb7185",
      summary: "观察应激性：遇到不利刺激时，草履虫会改变运动方向，体现生物能对外界刺激作出反应。",
      teaching: "教学要点：草履虫能对外界的各种刺激做出反应。当在培养液一侧放上盐粒等有害刺激时，草履虫会游向没有盐粒的一侧以逃避不利环境，这说明草履虫具有应激性。"
    }
  ];

  const QUIZ = {
    question: "草履虫遇到盐粒等有害刺激时，最能体现哪种生命现象？",
    options: [
      { id: "right-response", text: "应激性：能对外界刺激作出反应", correct: true },
      { id: "wrong-photosynthesis", text: "光合作用：制造有机物", correct: false },
      { id: "wrong-division", text: "细胞分裂：产生两个新细胞", correct: false }
    ]
  };

  return {
    mount: function mount(container, context) {
      const sceneId = "paramecium-3d-" + Math.random().toString(36).slice(2, 9);
      const panelHost = context && context.externalPanel ? context.externalPanel : null;
      const assetBase = context && context.sceneEntry && context.sceneEntry.folder ? `${context.sceneEntry.folder}/` : "";
      const runtimeVersioner = window.BiologyApp && window.BiologyApp.appendRuntimeVersion;
      const isMobileModelTarget = (
        window.matchMedia?.("(hover: none), (pointer: coarse), (max-width: 900px)")?.matches ||
        (navigator.deviceMemory && navigator.deviceMemory <= 4)
      );
      const modelSource = {
        desktop: `${assetBase}assets/models/paramecium-teaching.glb?v=b1d886ee2de4`,
        tablet: `${assetBase}assets/models/paramecium-teaching.tablet.glb?v=eaa23cac1550`,
        mobile: `${assetBase}assets/models/paramecium-teaching.mobile.glb?v=3050eea3629d`
      };
      const modelSrc = window.BiologyApp && typeof window.BiologyApp.resolveBiologyModelVariantSource === "function"
        ? window.BiologyApp.resolveBiologyModelVariantSource(modelSource)
        : (typeof runtimeVersioner === "function" ? runtimeVersioner(isMobileModelTarget ? modelSource.mobile : modelSource.desktop) : (isMobileModelTarget ? modelSource.mobile : modelSource.desktop));

      const state = {
        activeFeature: "overview",
        autoRotate: !isMobileModelTarget,
        quizAnswer: "",
        quizFeedback: "",
        scenario: "normal"
      };

      const listeners = [];
      let disposed = false;

      function addListener(target, eventName, handler) {
        if (!target || typeof target.addEventListener !== "function") return;
        target.addEventListener(eventName, handler);
        listeners.push(() => target.removeEventListener(eventName, handler));
      }

      function getActiveFeature() {
        return FEATURES.find(feature => feature.id === state.activeFeature) || FEATURES[0];
      }

      function findViewer() {
        return container.querySelector("model-viewer");
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
            background: #020617;
            font-family: Inter, "Microsoft YaHei", "PingFang SC", Arial, sans-serif;
          }

          [data-scope="${sceneId}"] * {
            box-sizing: border-box;
          }

          [data-scope="${sceneId}"] .para-stage {
            width: 100%;
            height: 100%;
            min-width: 0;
            min-height: 0;
            padding: 16px;
            background:
              radial-gradient(circle at 54% 42%, rgba(45, 212, 191, 0.16), transparent 34%),
              radial-gradient(circle at 18% 18%, rgba(167, 139, 250, 0.16), transparent 30%),
              radial-gradient(circle at 82% 78%, rgba(244, 114, 182, 0.12), transparent 28%),
              linear-gradient(145deg, #020617 0%, #07111f 58%, #100b18 100%);
          }

          [data-scope="${sceneId}"] .para-frame {
            position: relative;
            width: 100%;
            height: 100%;
            min-width: 0;
            min-height: 0;
            overflow: hidden;
            border: 1px solid rgba(45, 212, 191, 0.24);
            border-radius: 16px;
            background:
              linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px),
              radial-gradient(circle at 50% 50%, rgba(8, 47, 73, 0.45), rgba(2, 6, 23, 0.88));
            background-size: 34px 34px, 34px 34px, auto;
            box-shadow: inset 0 0 70px rgba(2, 6, 23, 0.82), 0 24px 60px rgba(0, 0, 0, 0.34);
          }

          [data-scope="${sceneId}"] .para-viewer {
            width: 100%;
            height: 100%;
            background: transparent;
            outline: none;
            --poster-color: transparent;
          }

          [data-scope="${sceneId}"] .para-poster {
            width: 100%;
            height: 100%;
            display: grid;
            place-items: center;
            color: rgba(204, 251, 241, 0.86);
            font-size: 13px;
            font-weight: 800;
            background: rgba(2, 6, 23, 0.62);
          }

          [data-scope="${sceneId}"] .para-hud {
            position: absolute;
            left: 16px;
            top: 16px;
            right: 16px;
            z-index: 3;
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
            pointer-events: none;
          }

          [data-scope="${sceneId}"] .para-kicker {
            width: max-content;
            max-width: 100%;
            border: 1px solid rgba(94, 234, 212, 0.24);
            border-radius: 8px;
            background: rgba(15, 23, 42, 0.68);
            padding: 5px 8px;
            color: rgba(153, 246, 228, 0.92);
            font-size: 10px;
            font-weight: 900;
            letter-spacing: 0.16em;
            text-transform: uppercase;
          }

          [data-scope="${sceneId}"] .para-title {
            margin: 8px 0 0;
            max-width: min(420px, 72vw);
            color: #f8fafc;
            font-size: 26px;
            line-height: 1.08;
            font-weight: 900;
            letter-spacing: 0;
            text-shadow: 0 12px 28px rgba(0,0,0,0.48);
          }

          [data-scope="${sceneId}"] .para-subtitle {
            margin-top: 6px;
            max-width: 420px;
            color: rgba(226, 232, 240, 0.7);
            font-size: 12px;
            line-height: 1.55;
          }

          [data-scope="${sceneId}"] .para-badge {
            min-width: 142px;
            max-width: 220px;
            border: 1px solid color-mix(in srgb, var(--feature-accent) 45%, transparent);
            border-radius: 8px;
            background: rgba(2, 6, 23, 0.66);
            padding: 10px 12px;
            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.24);
          }

          [data-scope="${sceneId}"] .para-badge span {
            display: block;
            color: rgba(226, 232, 240, 0.52);
            font-size: 10px;
            font-weight: 900;
            letter-spacing: 0.14em;
          }

          [data-scope="${sceneId}"] .para-badge strong {
            display: block;
            margin-top: 5px;
            color: var(--feature-accent);
            font-size: 14px;
            line-height: 1.3;
            font-weight: 900;
          }

          [data-scope="${sceneId}"] .para-bottom {
            position: absolute;
            left: 16px;
            right: 16px;
            bottom: 14px;
            z-index: 5;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            gap: 12px;
            pointer-events: none;
          }

          [data-scope="${sceneId}"] .para-status {
            max-width: 480px;
            border: 1px solid rgba(255,255,255,0.08);
            border-left: 3px solid var(--feature-accent);
            border-radius: 8px;
            background: rgba(2, 6, 23, 0.62);
            padding: 10px 12px;
            color: rgba(226, 232, 240, 0.78);
            font-size: 12px;
            line-height: 1.55;
          }

          [data-scope="${sceneId}"] .para-miniControls {
            display: flex;
            gap: 8px;
            pointer-events: auto;
          }

          [data-scope="${sceneId}"] .para-iconBtn {
            min-height: 40px;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 8px;
            background: rgba(15, 23, 42, 0.74);
            color: rgba(248, 250, 252, 0.86);
            padding: 0 10px;
            font-size: 12px;
            font-weight: 900;
            cursor: pointer;
            transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
          }

          [data-scope="${sceneId}"] .para-iconBtn:hover,
          [data-scope="${sceneId}"] .para-iconBtn.is-active {
            border-color: var(--feature-accent);
            background: color-mix(in srgb, var(--feature-accent) 18%, rgba(15, 23, 42, 0.78));
          }

          [data-scope="${sceneId}"] .para-iconBtn:active {
            transform: scale(0.98);
          }

          .panel-${sceneId} {
            width: 100%;
            height: 100%;
            min-width: 0;
            min-height: 0;
            overflow-y: auto;
            padding: 14px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            color: #f8fafc;
            scrollbar-width: none;
            background: #050816;
          }

          .panel-${sceneId}::-webkit-scrollbar {
            display: none;
          }

          .panel-${sceneId} * {
            box-sizing: border-box;
          }

          .panel-${sceneId} .p-card {
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 8px;
            background: rgba(255,255,255,0.04);
            padding: 14px;
          }

          .panel-${sceneId} .p-eyebrow {
            display: block;
            color: rgba(153, 246, 228, 0.72);
            font-size: 10px;
            line-height: 1.2;
            font-weight: 900;
            letter-spacing: 0.14em;
            text-transform: uppercase;
          }

          .panel-${sceneId} .p-title {
            margin: 6px 0 0;
            color: #f8fafc;
            font-size: 18px;
            line-height: 1.2;
            font-weight: 900;
            letter-spacing: 0;
          }

          .panel-${sceneId} .p-desc {
            margin: 10px 0 0;
            color: rgba(226, 232, 240, 0.74);
            font-size: 13px;
            line-height: 1.72;
          }

          .panel-${sceneId} .p-actions,
          .panel-${sceneId} .p-scenarios {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
            margin-top: 12px;
          }

          .panel-${sceneId} button {
            font: inherit;
          }

          .panel-${sceneId} .p-action,
          .panel-${sceneId} .p-feature,
          .panel-${sceneId} .p-quizOption {
            width: 100%;
            min-width: 0;
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 8px;
            background: rgba(15, 23, 42, 0.68);
            color: rgba(248, 250, 252, 0.82);
            cursor: pointer;
            transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
          }

          .panel-${sceneId} .p-action {
            min-height: 40px;
            padding: 9px 10px;
            font-size: 12px;
            font-weight: 900;
          }

          .panel-${sceneId} .p-action:hover,
          .panel-${sceneId} .p-action.is-active {
            border-color: var(--feature-accent);
            background: color-mix(in srgb, var(--feature-accent) 16%, rgba(15, 23, 42, 0.72));
          }

          .panel-${sceneId} .p-scenario {
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 8px;
            background: rgba(255,255,255,0.035);
            color: rgba(248, 250, 252, 0.84);
            min-height: 44px;
            padding: 9px 10px;
            font-size: 12px;
            line-height: 1.35;
            font-weight: 900;
            cursor: pointer;
          }

          .panel-${sceneId} .p-scenario.is-active {
            border-color: var(--feature-accent);
            background: color-mix(in srgb, var(--feature-accent) 16%, rgba(255,255,255,0.04));
          }

          .panel-${sceneId} .p-featureList {
            display: grid;
            gap: 8px;
            margin-top: 12px;
          }

          .panel-${sceneId} .p-feature {
            display: grid;
            grid-template-columns: 1fr;
            gap: 4px;
            padding: 10px 12px;
            text-align: left;
          }

          .panel-${sceneId} .p-feature:hover,
          .panel-${sceneId} .p-feature.is-active {
            transform: translateY(-1px);
            border-color: var(--item-accent);
            background: color-mix(in srgb, var(--item-accent) 14%, rgba(15, 23, 42, 0.72));
          }

          .panel-${sceneId} .p-feature strong {
            color: #f8fafc;
            font-size: 13px;
            line-height: 1.25;
            font-weight: 900;
          }

          .panel-${sceneId} .p-feature span {
            color: rgba(226, 232, 240, 0.58);
            font-size: 11px;
            line-height: 1.35;
            font-weight: 700;
          }

          .panel-${sceneId} .p-flow {
            display: grid;
            gap: 8px;
            margin-top: 12px;
          }

          .panel-${sceneId} .p-flowLine {
            display: grid;
            grid-template-columns: 72px 1fr;
            gap: 10px;
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 8px;
            background: rgba(2, 6, 23, 0.38);
            padding: 9px 10px;
          }

          .panel-${sceneId} .p-flowLine span {
            color: var(--feature-accent);
            font-size: 11px;
            line-height: 1.35;
            font-weight: 900;
          }

          .panel-${sceneId} .p-flowLine strong {
            color: rgba(248, 250, 252, 0.82);
            font-size: 12px;
            line-height: 1.45;
            font-weight: 800;
          }

          .panel-${sceneId} .p-quiz {
            display: grid;
            gap: 8px;
            margin-top: 12px;
          }

          .panel-${sceneId} .p-quizQuestion {
            color: rgba(248, 250, 252, 0.88);
            font-size: 13px;
            line-height: 1.55;
            font-weight: 900;
          }

          .panel-${sceneId} .p-quizOption {
            min-height: 40px;
            padding: 9px 10px;
            text-align: left;
            color: rgba(226, 232, 240, 0.78);
            font-size: 12px;
            line-height: 1.45;
            font-weight: 800;
          }

          .panel-${sceneId} .p-quizOption.is-selected {
            border-color: var(--feature-accent);
            background: color-mix(in srgb, var(--feature-accent) 16%, rgba(15, 23, 42, 0.72));
            color: #f8fafc;
          }

          .panel-${sceneId} .p-feedback {
            min-height: 42px;
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 8px;
            background: rgba(2, 6, 23, 0.42);
            padding: 9px 10px;
            color: rgba(226, 232, 240, 0.66);
            font-size: 12px;
            line-height: 1.55;
            font-weight: 750;
          }

          .panel-${sceneId} .p-feedback.is-correct {
            border-color: rgba(52, 211, 153, 0.45);
            color: #bbf7d0;
          }

          .panel-${sceneId} .p-feedback.is-wrong {
            border-color: rgba(251, 113, 133, 0.45);
            color: #fecdd3;
          }

          @media (max-width: 820px) {
            [data-scope="${sceneId}"] .para-stage {
              padding: 8px;
            }

            [data-scope="${sceneId}"] .para-hud {
              left: 10px;
              top: 10px;
              right: 10px;
            }

            [data-scope="${sceneId}"] .para-title {
              max-width: 66vw;
              font-size: 20px;
            }

            [data-scope="${sceneId}"] .para-subtitle,
            [data-scope="${sceneId}"] .para-badge {
              display: none;
            }

            [data-scope="${sceneId}"] .para-bottom {
              left: 10px;
              right: 10px;
              bottom: 10px;
              align-items: flex-end;
            }

            [data-scope="${sceneId}"] .para-status {
              max-width: calc(100% - 112px);
              padding: 8px 10px;
              font-size: 11px;
              line-height: 1.45;
            }

            .panel-${sceneId} {
              padding: 10px;
              gap: 10px;
            }

            .panel-${sceneId} .p-card {
              padding: 12px;
            }

            .panel-${sceneId} .p-actions,
            .panel-${sceneId} .p-scenarios {
              grid-template-columns: 1fr;
            }
          }
        `;
        document.head.appendChild(style);
      }

      function renderStage() {
        const feature = getActiveFeature();
        container.setAttribute("data-scope", sceneId);
        container.style.setProperty("--feature-accent", feature.accent);
        container.innerHTML = `
          <div class="para-stage">
            <div class="para-frame" data-role="frame">
              <model-viewer
                class="para-viewer"
                data-role="model-viewer"
                src="${escapeHtml(modelSrc)}"
                camera-controls
                interaction-prompt="none"
                shadow-intensity="${isMobileModelTarget ? "0.28" : "0.7"}"
                exposure="${isMobileModelTarget ? "0.92" : "1"}"
                environment-image="neutral"
                loading="eager"
                auto-rotate-delay="0"
                rotation-per-second="${isMobileModelTarget ? "8deg" : "14deg"}"
                field-of-view="35deg"
                min-field-of-view="12deg"
                max-field-of-view="72deg"
                camera-orbit="${escapeHtml(feature.orbit)}"
                camera-target="0m 0m 0m"
                alt="草履虫 3D 教学模型">
                <div class="para-poster" slot="poster">模型加载中...</div>
              </model-viewer>

              <div class="para-hud">
                <div>
                  <div class="para-kicker">Paramecium 3D teaching model</div>
                  <h1 class="para-title">草履虫内部结构观察</h1>
                  <div class="para-subtitle">实体外层、剖面、纤毛、口沟、伸缩泡、食物泡、大核和小核全部在同一模型内可观察。</div>
                </div>
                <div class="para-badge">
                  <span>当前观察结构</span>
                  <strong data-role="feature-title">${escapeHtml(feature.title)}</strong>
                </div>
              </div>

              <div class="para-bottom">
                <div class="para-status" data-role="feature-summary">${escapeHtml(feature.summary)}</div>
                <div class="para-miniControls">
                  <button class="para-iconBtn${state.autoRotate ? " is-active" : ""}" type="button" data-action="toggle-auto-rotate">旋转</button>
                </div>
              </div>
            </div>
          </div>
        `;
      }

      function renderPanel() {
        if (!panelHost) return;
        const feature = getActiveFeature();
        const featureButtons = FEATURES.map(item => `
          <button class="p-feature" type="button" data-feature="${item.id}" style="--item-accent:${item.accent}">
            <strong>${escapeHtml(item.title)}</strong>
            <span>${escapeHtml(item.label)}</span>
          </button>
        `).join("");

        const quizOptions = QUIZ.options.map(option => `
          <button class="p-quizOption${state.quizAnswer === option.id ? " is-selected" : ""}" type="button" data-quiz="${option.id}">
            ${escapeHtml(option.text)}
          </button>
        `).join("");

        const feedbackClass = state.quizFeedback
          ? (QUIZ.options.find(option => option.id === state.quizAnswer)?.correct ? " is-correct" : " is-wrong")
          : "";

        panelHost.innerHTML = `
          <div class="panel-${sceneId}" style="--feature-accent:${feature.accent}">
            <div class="p-card">
              <span class="p-eyebrow">3D 模型观察</span>
              <h2 class="p-title">草履虫结构与生命活动</h2>
              <p class="p-desc">${escapeHtml(feature.teaching)}</p>
              <div class="p-actions">
                <button class="p-action${state.autoRotate ? " is-active" : ""}" type="button" data-action="toggle-auto-rotate">自动旋转</button>
                <button class="p-action" type="button" data-action="reset-camera">复位视角</button>
                <button class="p-action" type="button" data-action="focus-overview">整体观察</button>
              </div>
            </div>

            <div class="p-card">
              <span class="p-eyebrow">课堂演示情境</span>
              <div class="p-scenarios">
                <button class="p-scenario${state.scenario === "feed" ? " is-active" : ""}" type="button" data-scenario="feed">加入食物颗粒</button>
                <button class="p-scenario${state.scenario === "salt" ? " is-active" : ""}" type="button" data-scenario="salt">盐粒刺激</button>
              </div>
              <p class="p-desc" data-role="scenario-text">${
                state.scenario === "feed"
                  ? "观察口沟和食物泡：食物颗粒被纤毛带入口沟，在细胞质中形成食物泡并逐步消化。"
                  : state.scenario === "salt"
                  ? "观察应激性：遇到不利刺激时，草履虫会改变运动方向，体现生物能对外界刺激作出反应。"
                  : "选择一个情境，可以把模型讲解切换到取食、消化或应激反应。"
              }</p>
            </div>

            <div class="p-card">
              <span class="p-eyebrow">结构定位</span>
              <div class="p-featureList">${featureButtons}</div>
            </div>

            <div class="p-card">
              <span class="p-eyebrow">过程梳理</span>
              <div class="p-flow">
                <div class="p-flowLine"><span>取食</span><strong>纤毛摆动形成水流，食物颗粒进入口沟</strong></div>
                <div class="p-flowLine"><span>消化</span><strong>形成食物泡，在细胞质中流动并消化吸收</strong></div>
                <div class="p-flowLine"><span>排泄</span><strong>伸缩泡排出多余水分，残渣从胞肛排出</strong></div>
                <div class="p-flowLine"><span>应激</span><strong>遇到盐粒等刺激时改变运动方向，逃避不利环境</strong></div>
              </div>
            </div>

            <div class="p-card">
              <span class="p-eyebrow">快速判断</span>
              <div class="p-quiz">
                <div class="p-quizQuestion">${escapeHtml(QUIZ.question)}</div>
                ${quizOptions}
                <div class="p-feedback${feedbackClass}">${state.quizFeedback || "选择一个答案后，这里会给出即时反馈。"}</div>
              </div>
            </div>
          </div>
        `;
      }

      function updateStage() {
        const feature = getActiveFeature();
        const viewer = findViewer();
        container.style.setProperty("--feature-accent", feature.accent);

        const titleNode = container.querySelector('[data-role="feature-title"]');
        const summaryNode = container.querySelector('[data-role="feature-summary"]');
        if (titleNode) titleNode.textContent = feature.title;
        if (summaryNode) summaryNode.textContent = feature.summary;

        container.querySelectorAll('[data-action="toggle-auto-rotate"]').forEach(node => node.classList.toggle("is-active", state.autoRotate));

        if (viewer) {
          if (viewer.getAttribute("src") !== modelSrc) viewer.setAttribute("src", modelSrc);
          viewer.setAttribute("camera-orbit", feature.orbit);
          viewer.setAttribute("camera-target", "0m 0m 0m");
          if (state.autoRotate) viewer.setAttribute("auto-rotate", "");
          else viewer.removeAttribute("auto-rotate");
        }
      }

      function handleAction(action) {
        if (action === "toggle-auto-rotate") {
          state.autoRotate = !state.autoRotate;
          updateStage();
          renderPanel();
        }
        if (action === "reset-camera" || action === "focus-overview") {
          state.activeFeature = "overview";
          state.scenario = "normal";
          updateStage();
          renderPanel();
        }
      }

      function showModal(featureId) {
        const feature = FEATURES.find(f => f.id === featureId) || SCENARIOS.find(s => s.id === featureId);
        if (!feature) return;
        
        const modalId = `${sceneId}-modal`;
        let modal = document.getElementById(modalId);
        if (!modal) {
          modal = document.createElement("div");
          modal.id = modalId;
          modal.className = "p-modal-overlay";
          modal.setAttribute("data-modal-overlay", "true");
          
          const style = document.createElement("style");
          style.textContent = `
            .p-modal-overlay {
              position: fixed;
              inset: 0;
              background: rgba(0,0,0,0.75);
              backdrop-filter: blur(8px);
              z-index: 999999;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
              font-family: Inter, "Microsoft YaHei", "PingFang SC", Arial, sans-serif;
            }
            .p-modal-content {
              background: #0f172a;
              border: 1px solid rgba(45, 212, 191, 0.3);
              border-radius: 16px;
              max-width: 500px;
              width: 100%;
              overflow: hidden;
              box-shadow: 0 24px 80px rgba(0,0,0,0.6);
              position: relative;
              animation: p-modal-fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }
            @keyframes p-modal-fade-in {
              from { opacity: 0; transform: scale(0.95) translateY(10px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
            .p-modal-close {
              position: absolute;
              top: 12px;
              right: 12px;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: rgba(0,0,0,0.4);
              color: #fff;
              border: 1px solid rgba(255,255,255,0.2);
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              z-index: 10;
              transition: all 0.2s;
            }
            .p-modal-close:hover {
              background: rgba(0,0,0,0.7);
              transform: scale(1.05);
            }
            .p-modal-image {
              width: 100%;
              height: 260px;
              object-fit: cover;
              border-bottom: 1px solid rgba(255,255,255,0.1);
              display: block;
            }
            .p-modal-body {
              padding: 24px;
            }
            .p-modal-title {
              margin: 0 0 8px;
              font-size: 22px;
              color: #f8fafc;
              font-weight: 900;
              letter-spacing: 0.5px;
            }
            .p-modal-label {
              font-size: 13px;
              color: var(--feature-accent, #34d399);
              margin-bottom: 16px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .p-modal-desc {
              font-size: 14px;
              color: rgba(226, 232, 240, 0.85);
              line-height: 1.6;
              margin: 0 0 12px;
            }
            .p-modal-teaching {
              font-size: 13px;
              color: rgba(148, 163, 184, 0.9);
              line-height: 1.5;
              margin: 0;
              padding-top: 12px;
              border-top: 1px dashed rgba(255,255,255,0.1);
            }
          `;
          document.head.appendChild(style);
          modal.__style = style;
          
          modal.addEventListener("click", e => {
            if (e.target.hasAttribute("data-modal-overlay") || e.target.closest("[data-action='close-modal']")) {
              closeModal();
            }
          });
          document.body.appendChild(modal);
        }
        
        const imgSrc = `${assetBase}assets/images/${feature.image}`;
        
        modal.innerHTML = `
          <div class="p-modal-content" style="--feature-accent: ${feature.accent}">
            <button class="p-modal-close" data-action="close-modal">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <img class="p-modal-image" src="${escapeHtml(imgSrc)}" alt="${escapeHtml(feature.title)}">
            <div class="p-modal-body">
              <h3 class="p-modal-title">${escapeHtml(feature.title)}</h3>
              <div class="p-modal-label">${escapeHtml(feature.label)}</div>
              <p class="p-modal-desc">${escapeHtml(feature.summary)}</p>
              <p class="p-modal-teaching">${escapeHtml(feature.teaching)}</p>
            </div>
          </div>
        `;
      }
      
      function closeModal() {
        const modal = document.getElementById(`${sceneId}-modal`);
        if (modal) {
          if (modal.__style) modal.__style.remove();
          modal.remove();
        }
      }

      function bindEvents() {
        addListener(container, "click", event => {
          const actionButton = event.target.closest("[data-action]");
          if (actionButton) {
            handleAction(actionButton.dataset.action);
          }
        });

        if (panelHost) {
          addListener(panelHost, "click", event => {
            const actionButton = event.target.closest("[data-action]");
            if (actionButton) {
              handleAction(actionButton.dataset.action);
              return;
            }

            const featureButton = event.target.closest("[data-feature]");
            if (featureButton) {
              showModal(featureButton.dataset.feature);
              return;
            }

            const scenarioButton = event.target.closest("[data-scenario]");
            if (scenarioButton) {
              state.scenario = scenarioButton.dataset.scenario;
              showModal(scenarioButton.dataset.scenario);
              renderPanel();
              return;
            }

            const quizButton = event.target.closest("[data-quiz]");
            if (quizButton) {
              const option = QUIZ.options.find(item => item.id === quizButton.dataset.quiz);
              if (!option) return;
              state.quizAnswer = option.id;
              state.quizFeedback = option.correct
                ? "判断正确。草履虫遇到盐粒后改变运动方向，体现了应激性。"
                : "再想想：题目强调的是对外界刺激作出反应，不是制造有机物或细胞分裂。";
              renderPanel();
            }
          });
        }
      }

      function cleanup() {
        closeModal();
        disposed = true;
        window.BiologyApp?.releaseBiologyModelViewers?.(container);
        listeners.splice(0).forEach(remove => remove());
        const style = document.getElementById(`${sceneId}-style`);
        if (style) style.remove();
        if (panelHost) panelHost.innerHTML = "";
        container.innerHTML = "";
      }

      container.__paramecium3dCleanup = cleanup;

      setScopedStyle();
      renderStage();
      renderPanel();
      updateStage();
      bindEvents();
      loadModelViewer().then(() => {
        if (disposed) return;
        updateStage();
      });
    },

    unmount: function unmount(container) {
      if (container && typeof container.__paramecium3dCleanup === "function") {
        container.__paramecium3dCleanup();
        delete container.__paramecium3dCleanup;
      }
    }
  };
})();
