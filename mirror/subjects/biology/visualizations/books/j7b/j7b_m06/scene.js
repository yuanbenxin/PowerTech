window.BIO_VISUAL_SCENES = window.BIO_VISUAL_SCENES || {};

window.BIO_VISUAL_SCENES["j7b_m06"] = (function () {
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

  const TOPIC_BUTTONS = [
    {
      id: "system",
      label: "泌尿系统",
      tag: "整体定位",
      accent: "#38bdf8",
      cameraOrbit: "18deg 70deg 118%",
      summary: "泌尿系统由肾脏、输尿管、膀胱和尿道组成。肾脏是尿液形成的核心器官，可联系输尿管、膀胱和尿道梳理排尿路线。",
      prompt: "肾脏形成尿液，输尿管输送尿液，膀胱暂时贮存尿液，尿道排出尿液。",
      checks: ["肾脏是形成尿液的核心器官", "膀胱只负责暂时贮存尿液", "尿液沿输尿管进入膀胱"],
      imageRelativeUrl: "assets/images/urinary-system-overview.png?v=bcc1cf1e09e8"
    },
    {
      id: "kidney",
      label: "肾脏结构",
      tag: "模型观察",
      accent: "#f43f5e",
      cameraOrbit: "42deg 68deg 105%",
      summary: "肾脏内部可分为皮质、髓质和肾盂等区域，血液中的代谢废物最终在这里参与尿液形成。",
      prompt: "观察模型时重点看肾脏外形、肾门位置和内部凹陷区域。",
      checks: ["肾门连接血管和输尿管", "皮质和髓质参与尿液形成", "肾盂负责汇集尿液"],
      imageRelativeUrl: "assets/images/kidney-cross-section.png?v=9d5e4c5cc102"
    },
    {
      id: "nephron",
      label: "肾单位",
      tag: "基本单位",
      accent: "#a78bfa",
      cameraOrbit: "-34deg 72deg 112%",
      summary: "肾单位是形成尿液的基本结构和功能单位，主要包括肾小球、肾小囊和肾小管。",
      prompt: "可以把肾单位理解成一套微型处理流程：先滤过，再重吸收。",
      checks: ["肾小球负责滤过", "肾小囊承接原尿", "肾小管负责重吸收"],
      imageRelativeUrl: "assets/images/nephron-structure.png?v=a9b7aefc2728"
    },
    {
      id: "urine",
      label: "尿液形成",
      tag: "过程梳理",
      accent: "#facc15",
      cameraOrbit: "0deg 76deg 116%",
      summary: "尿液形成通常按两个核心过程讲：肾小球和肾小囊内壁的滤过作用，以及肾小管的重吸收作用。",
      prompt: "血液进入肾小球，滤过形成原尿；原尿流经肾小管，有用物质被重吸收。",
      checks: ["滤过形成原尿", "重吸收保留有用物质", "剩余物形成尿液"],
      imageRelativeUrl: "assets/images/urine-formation-flow.png?v=a7339ba00543"
    },
    {
      id: "clinical",
      label: "异常提示",
      tag: "教学拓展",
      accent: "#fb7185",
      cameraOrbit: "72deg 72deg 120%",
      summary: "如果肾小球滤过屏障受损，尿液中可能出现血细胞或蛋白质；如果重吸收异常，也可能出现糖尿等现象。",
      prompt: "追问学生：为什么正常尿液中一般没有血细胞、大分子蛋白质和葡萄糖？",
      checks: ["血尿提示滤过屏障受损", "蛋白尿与大分子漏出有关", "糖尿常与重吸收异常有关"],
      imageRelativeUrl: "assets/images/urinary-clinical-signals.png?v=8c3a30a10dcf"
    }
  ];

  const FLOW_STEPS = [
    {
      label: "血液进入",
      text: "血液流经肾小球，代谢废物和小分子物质准备被滤过"
    },
    {
      label: "形成原尿",
      text: "肾小球和肾小囊内壁发生滤过作用，形成原尿"
    },
    {
      label: "重吸收",
      text: "原尿流经肾小管，全部葡萄糖、大部分水和部分无机盐被重吸收"
    },
    {
      label: "形成尿液",
      text: "剩余尿素、多余水和无机盐汇集，最终形成尿液"
    }
  ];

  const QUICK_QUESTION = "正常情况下，尿液里通常不应该出现哪一类物质？";

  const QUICK_CHECKS = [
    { id: "protein-cell", text: "血细胞和大分子蛋白质", correct: true },
    { id: "water-salt", text: "水和无机盐", correct: false },
    { id: "urea", text: "尿素等代谢废物", correct: false }
  ];

  return {
    mount: function mount(container, context) {
      const sceneId = "urinary-kidney-" + Math.random().toString(36).slice(2, 9);
      const panelHost = context && context.externalPanel ? context.externalPanel : null;
      const assetBase = context && context.sceneEntry && context.sceneEntry.folder ? `${context.sceneEntry.folder}/` : "";
      const runtimeVersioner = window.BiologyApp && window.BiologyApp.appendRuntimeVersion;
      const isMobileModelTarget = (
        window.matchMedia?.("(hover: none), (pointer: coarse), (max-width: 900px)")?.matches ||
        (navigator.deviceMemory && navigator.deviceMemory <= 4)
      );
      const modelSource = {
        desktop: `${assetBase}assets/models/kidney.glb?v=16aac1db2c7b`,
        tablet: `${assetBase}assets/models/kidney.tablet.glb?v=5a8f32f2b7f3`,
        mobile: `${assetBase}assets/models/kidney.mobile.glb?v=6dd02485725f`
      };
      const resolveModelSource = source => {
        if (window.BiologyApp && typeof window.BiologyApp.resolveBiologyModelVariantSource === "function") {
          return window.BiologyApp.resolveBiologyModelVariantSource(source);
        }
        const fallback = isMobileModelTarget ? (source.mobile || source.tablet || source.desktop) : source.desktop;
        return typeof runtimeVersioner === "function" ? runtimeVersioner(fallback) : fallback;
      };
      const modelSrc = resolveModelSource(modelSource);

      let disposed = false;
      const state = {
        activeTopic: "system",
        autoRotate: !isMobileModelTarget,
        quizAnswer: "",
        quizFeedback: "",
        showModal: false
      };

      function getActiveTopic() {
        return TOPIC_BUTTONS.find(topic => topic.id === state.activeTopic) || TOPIC_BUTTONS[0];
      }

      function findViewer() {
        return container.querySelector("model-viewer");
      }

      function resolveAssetUrl(relativeUrl) {
        const rawUrl = `${assetBase}${relativeUrl}`;
        return typeof runtimeVersioner === "function" ? runtimeVersioner(rawUrl) : rawUrl;
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

          [data-scope="${sceneId}"] .kidney-stage {
            position: relative;
            width: 100%;
            height: 100%;
            min-height: 0;
            padding: 12px;
            overflow: hidden;
          }

          [data-scope="${sceneId}"] .kidney-stage__frame {
            position: relative;
            width: 100%;
            height: 100%;
            min-height: 0;
            overflow: hidden;
            border-radius: 28px;
            border: 1px solid rgba(248, 113, 113, 0.2);
            background:
              radial-gradient(circle at 28% 24%, rgba(244, 63, 94, 0.22), transparent 34%),
              radial-gradient(circle at 78% 78%, rgba(56, 189, 248, 0.14), transparent 34%),
              linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.98));
            box-shadow: inset 0 0 80px rgba(244, 63, 94, 0.08), 0 24px 70px rgba(0, 0, 0, 0.46);
          }

          [data-scope="${sceneId}"] .kidney-stage__grid {
            position: absolute;
            inset: 0;
            z-index: 1;
            pointer-events: none;
            opacity: 0.22;
            background-image:
              linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
            background-size: 44px 44px;
            mask-image: radial-gradient(circle at center, #000 28%, transparent 76%);
          }

          [data-scope="${sceneId}"] .kidney-stage__viewerWrap {
            position: absolute;
            inset: 0;
            z-index: 2;
          }

          [data-scope="${sceneId}"] .kidney-stage__viewer {
            width: 100%;
            height: 100%;
            background: transparent;
            outline: none;
          }

          [data-scope="${sceneId}"] .kidney-stage__hud {
            position: absolute;
            top: 16px;
            right: 16px;
            z-index: 6;
            display: flex;
            align-items: flex-end;
            pointer-events: none;
          }

          [data-scope="${sceneId}"] .kidney-stage__topicBadge {
            width: min(230px, calc(100vw - 48px));
            min-height: 78px;
            display: grid;
            gap: 7px;
            padding: 13px 14px;
            border-radius: 18px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(2, 6, 23, 0.62);
            box-shadow: 0 16px 38px rgba(0, 0, 0, 0.34);
            backdrop-filter: blur(16px);
          }

          [data-scope="${sceneId}"] .kidney-stage__topicLabel {
            color: rgba(248, 250, 252, 0.52);
            font-size: 10px;
            line-height: 1.2;
            font-weight: 900;
            letter-spacing: 0.18em;
          }

          [data-scope="${sceneId}"] .kidney-stage__topicValue {
            min-width: 0;
            color: var(--topic-accent, #f43f5e);
            font-size: 16px;
            line-height: 1.25;
            font-weight: 950;
            overflow-wrap: anywhere;
          }

          [data-scope="${sceneId}"] .kidney-stage__bottom {
            position: absolute;
            left: 16px;
            right: 16px;
            bottom: 16px;
            z-index: 6;
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 12px;
            pointer-events: none;
          }

          [data-scope="${sceneId}"] .kidney-stage__legend {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            min-width: 0;
          }

          [data-scope="${sceneId}"] .kidney-stage__legendItem {
            min-height: 30px;
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 7px 10px;
            border-radius: 999px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(2, 6, 23, 0.56);
            color: rgba(226, 232, 240, 0.9);
            font-size: 11px;
            line-height: 1.2;
            font-weight: 850;
            backdrop-filter: blur(12px);
          }

          [data-scope="${sceneId}"] .kidney-stage__dot {
            width: 8px;
            height: 8px;
            flex: none;
            border-radius: 999px;
            background: var(--dot-color);
            box-shadow: 0 0 14px var(--dot-color);
          }

          [data-scope="${sceneId}"] .kidney-stage__controls {
            display: flex;
            flex: none;
            gap: 8px;
            pointer-events: auto;
          }

          [data-scope="${sceneId}"] .kidney-stage__controlBtn {
            min-height: 38px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
            padding: 0 12px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.12);
            background: rgba(15, 23, 42, 0.68);
            color: rgba(248, 250, 252, 0.84);
            font-size: 12px;
            line-height: 1;
            font-weight: 900;
            cursor: pointer;
            backdrop-filter: blur(10px);
            transition: transform 160ms ease, color 160ms ease, border-color 160ms ease, background 160ms ease;
          }

          [data-scope="${sceneId}"] .kidney-stage__controlBtn:hover {
            transform: translateY(-1px);
            border-color: rgba(244, 63, 94, 0.36);
            background: rgba(244, 63, 94, 0.12);
            color: #fff;
          }

          [data-scope="${sceneId}"] .kidney-stage__controlBtn.is-active {
            border-color: rgba(244, 63, 94, 0.42);
            color: #fecdd3;
            background: rgba(244, 63, 94, 0.14);
          }

          [data-scope="${sceneId}"] .kidney-stage__viewerTip {
            position: absolute;
            left: 18px;
            top: 18px;
            z-index: 6;
            color: rgba(226, 232, 240, 0.48);
            font-size: 11px;
            line-height: 1.3;
            font-weight: 800;
            letter-spacing: 0.08em;
            pointer-events: none;
          }

          [data-scope="${sceneId}"] .kidney-stage__poster {
            width: 100%;
            height: 100%;
            display: grid;
            place-items: center;
            color: rgba(248, 250, 252, 0.62);
            font-size: 13px;
            font-weight: 900;
            letter-spacing: 0.12em;
            background: rgba(2, 6, 23, 0.78);
          }

          [data-scope="${sceneId}"] .kidney-stage__modalOverlay {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px;
            background: rgba(3, 7, 18, 0.68);
            backdrop-filter: blur(20px) saturate(150%);
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            overscroll-behavior: contain;
            touch-action: pan-y;
            transition: opacity 0.26s ease, visibility 0.26s ease;
          }

          [data-scope="${sceneId}"] .kidney-stage__modalOverlay.is-open {
            opacity: 1;
            visibility: visible;
            pointer-events: auto;
          }

          [data-scope="${sceneId}"] .kidney-stage__modalContent {
            position: relative;
            isolation: isolate;
            width: 90%;
            max-width: 1080px;
            height: 84vh;
            max-height: 800px;
            display: flex;
            flex-direction: column;
            padding: 40px;
            overflow: hidden;
            border-radius: 32px;
            border: 1.5px solid var(--topic-accent-soft, rgba(244, 63, 94, 0.24));
            background: rgba(8, 17, 22, 0.96);
            box-shadow: 0 30px 70px rgba(0, 0, 0, 0.75), inset 0 0 45px var(--topic-accent-soft, rgba(244, 63, 94, 0.14));
            transform: scale(0.94) translateY(16px);
            transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          [data-scope="${sceneId}"] .kidney-stage__modalOverlay.is-open .kidney-stage__modalContent {
            transform: scale(1) translateY(0);
          }

          [data-scope="${sceneId}"] .kidney-stage__modalClose {
            position: absolute;
            top: 24px;
            right: 24px;
            z-index: 80;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            border-radius: 14px;
            border: 1px solid rgba(255, 255, 255, 0.12);
            background: rgba(255, 255, 255, 0.055);
            color: rgba(255, 255, 255, 0.8);
            cursor: pointer;
            pointer-events: auto;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
            transition: transform 0.2s ease, color 0.2s ease, background 0.2s ease, border-color 0.2s ease;
          }

          [data-scope="${sceneId}"] .kidney-stage__modalClose svg {
            pointer-events: none;
          }

          [data-scope="${sceneId}"] .kidney-stage__modalClose:hover {
            transform: rotate(90deg) scale(1.05);
            border-color: rgba(251, 113, 133, 0.38);
            background: rgba(251, 113, 133, 0.14);
            color: #fb7185;
          }

          [data-scope="${sceneId}"] .kidney-stage__modalGrid {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            gap: 40px;
            align-items: center;
            height: 100%;
            min-height: 0;
            overflow: hidden;
          }

          [data-scope="${sceneId}"] .kidney-stage__modalImageShell {
            position: relative;
            width: 100%;
            height: 100%;
            min-height: 0;
            max-height: 520px;
            aspect-ratio: 16 / 10;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            margin: 0 auto;
            border-radius: 24px;
            border: 1.5px solid rgba(255, 255, 255, 0.12);
            background: rgba(0, 0, 0, 0.36);
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.5);
          }

          [data-scope="${sceneId}"] .kidney-stage__modalImage {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 22px;
          }

          [data-scope="${sceneId}"] .kidney-stage__modalImageShell::after {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: 22px;
            box-shadow: inset 0 0 45px var(--topic-accent-soft, rgba(244, 63, 94, 0.18));
            pointer-events: none;
          }

          [data-scope="${sceneId}"] .kidney-stage__modalDetails {
            height: 100%;
            min-height: 0;
            display: flex;
            flex-direction: column;
            gap: 18px;
            overflow-y: auto;
            padding-right: 14px;
            text-align: left;
            scrollbar-width: thin;
            scrollbar-color: rgba(148, 163, 184, 0.35) transparent;
          }

          [data-scope="${sceneId}"] .kidney-stage__modalEyebrow {
            display: inline-block;
            margin-bottom: 8px;
            padding: 5px 12px;
            border-radius: 999px;
            color: var(--topic-accent, #f43f5e);
            background: var(--topic-accent-soft, rgba(244, 63, 94, 0.16));
            font-size: 11px;
            line-height: 1.1;
            font-weight: 950;
            letter-spacing: 0.08em;
          }

          [data-scope="${sceneId}"] .kidney-stage__modalTitle {
            margin: 0;
            color: #fff;
            font-size: 28px;
            line-height: 1.16;
            font-weight: 950;
            letter-spacing: 0;
          }

          [data-scope="${sceneId}"] .kidney-stage__modalSummary {
            margin: 0;
            color: rgba(226, 232, 240, 0.86);
            font-size: 14px;
            line-height: 1.65;
          }

          [data-scope="${sceneId}"] .kidney-stage__modalSectionTitle {
            margin: 0 0 7px;
            color: var(--topic-accent, #f43f5e);
            font-size: 13px;
            line-height: 1.2;
            font-weight: 950;
            letter-spacing: 0.04em;
          }

          [data-scope="${sceneId}"] .kidney-stage__modalPrompt {
            margin: 0;
            padding: 10px 13px;
            border-left: 3px solid var(--topic-accent, #f43f5e);
            border-radius: 0 10px 10px 0;
            background: rgba(255, 255, 255, 0.03);
            color: rgba(226, 232, 240, 0.76);
            font-size: 13px;
            line-height: 1.58;
          }

          [data-scope="${sceneId}"] .kidney-stage__modalChecks {
            display: grid;
            gap: 7px;
            margin: 0;
            padding: 0;
            list-style: none;
          }

          [data-scope="${sceneId}"] .kidney-stage__modalChecks li {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            color: rgba(226, 232, 240, 0.82);
            font-size: 13px;
            line-height: 1.45;
          }

          [data-scope="${sceneId}"] .kidney-stage__modalChecks li::before {
            content: "✓";
            flex: none;
            color: var(--topic-accent, #f43f5e);
            font-weight: 950;
          }

          .panel-${sceneId} {
            width: 100%;
            height: 100%;
            min-height: 0;
            display: flex;
            flex-direction: column;
            gap: 14px;
            padding: 14px;
            overflow-y: auto;
            overscroll-behavior: contain;
            scrollbar-width: none;
            -ms-overflow-style: none;
            color: #f8fafc;
            font-family: Inter, "Microsoft YaHei", "PingFang SC", Arial, sans-serif;
          }

          .panel-${sceneId}::-webkit-scrollbar {
            width: 0;
            height: 0;
            display: none;
          }

          .panel-${sceneId} .p-card {
            width: 100%;
            min-width: 0;
            flex: 0 0 auto;
            display: grid;
            gap: 12px;
            padding: 15px;
            border-radius: 18px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(255, 255, 255, 0.035);
            overflow: hidden;
          }

          .panel-${sceneId} .p-eyebrow {
            color: var(--topic-accent, #f43f5e);
            font-size: 11px;
            line-height: 1.1;
            font-weight: 950;
            letter-spacing: 0.08em;
          }

          .panel-${sceneId} .p-title {
            margin: 0;
            color: #fff;
            font-size: 22px;
            line-height: 1.18;
            font-weight: 950;
            letter-spacing: 0;
          }

          .panel-${sceneId} .p-desc {
            margin: 0;
            color: rgba(226, 232, 240, 0.76);
            font-size: 13px;
            line-height: 1.65;
          }

          .panel-${sceneId} button {
            font-family: inherit;
          }

          .panel-${sceneId} .p-action,
          .panel-${sceneId} .p-task,
          .panel-${sceneId} .p-quizOption {
            appearance: none;
            width: 100%;
            min-width: 0;
            cursor: pointer;
          }

          .panel-${sceneId} .p-actionRow {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(92px, 1fr));
            gap: 8px;
          }

          .panel-${sceneId} .p-action {
            min-height: 40px;
            border-radius: 13px;
            border: 1px solid rgba(255, 255, 255, 0.09);
            background: rgba(2, 6, 23, 0.38);
            color: rgba(248, 250, 252, 0.78);
            font-size: 13px;
            line-height: 1.2;
            font-weight: 900;
          }

          .panel-${sceneId} .p-action.is-active {
            border-color: var(--topic-accent, #f43f5e);
            background: var(--topic-accent-soft, rgba(244, 63, 94, 0.16));
            color: #fff;
          }

          .panel-${sceneId} .p-action:hover,
          .panel-${sceneId} .p-quizOption:hover {
            border-color: var(--topic-accent, #f43f5e);
            background: var(--topic-accent-soft, rgba(244, 63, 94, 0.16));
            color: #fff;
          }

          .panel-${sceneId} .p-taskGrid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 9px;
          }

          .panel-${sceneId} .p-task {
            min-height: 76px;
            display: grid;
            align-content: center;
            gap: 6px;
            padding: 12px;
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(255, 255, 255, 0.025);
            color: #f8fafc;
            text-align: left;
            transition: transform 180ms ease, background 180ms ease, border-color 180ms ease;
          }

          .panel-${sceneId} .p-task:hover {
            transform: translateY(-1px);
            background: rgba(255, 255, 255, 0.052);
          }

          .panel-${sceneId} .p-task.is-active {
            border-color: var(--item-accent);
            background: rgba(255, 255, 255, 0.06);
          }

          .panel-${sceneId} .p-task.is-active strong {
            color: var(--item-accent);
          }

          .panel-${sceneId} .p-task strong {
            color: #fff;
            font-size: 14px;
            line-height: 1.16;
            font-weight: 950;
          }

          .panel-${sceneId} .p-task span {
            color: rgba(226, 232, 240, 0.54);
            font-size: 11px;
            line-height: 1.25;
            font-weight: 800;
          }

          .panel-${sceneId} .p-checkList {
            display: grid;
            gap: 8px;
            margin: 0;
            padding: 0;
            list-style: none;
          }

          .panel-${sceneId} .p-checkList li {
            min-width: 0;
            display: flex;
            gap: 8px;
            align-items: flex-start;
            color: rgba(226, 232, 240, 0.76);
            font-size: 12px;
            line-height: 1.48;
          }

          .panel-${sceneId} .p-checkList li::before {
            content: "";
            width: 7px;
            height: 7px;
            flex: none;
            margin-top: 6px;
            border-radius: 50%;
            background: var(--topic-accent, #f43f5e);
            box-shadow: 0 0 12px var(--topic-accent, #f43f5e);
          }

          .panel-${sceneId} .p-flow {
            display: grid;
            gap: 8px;
          }

          .panel-${sceneId} .p-flowLine {
            display: grid;
            grid-template-columns: 76px minmax(0, 1fr);
            gap: 10px;
            align-items: center;
            min-height: 42px;
            border-radius: 14px;
            background: rgba(2, 6, 23, 0.32);
            padding: 8px 10px;
          }

          .panel-${sceneId} .p-flowLine span {
            color: rgba(226, 232, 240, 0.62);
            font-size: 11px;
            font-weight: 900;
          }

          .panel-${sceneId} .p-flowLine strong {
            min-width: 0;
            color: #fff;
            font-size: 13px;
            line-height: 1.35;
            font-weight: 900;
          }

          .panel-${sceneId} .p-quiz {
            display: grid;
            gap: 8px;
          }

          .panel-${sceneId} .p-quizQuestion {
            color: #f8fafc;
            font-size: 13px;
            line-height: 1.45;
            font-weight: 900;
          }

          .panel-${sceneId} .p-quizOption {
            min-height: 42px;
            padding: 10px 12px;
            border-radius: 13px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(2, 6, 23, 0.35);
            color: rgba(226, 232, 240, 0.82);
            text-align: left;
            font-size: 12px;
            line-height: 1.38;
            font-weight: 800;
          }

          .panel-${sceneId} .p-quizOption.is-selected {
            border-color: var(--topic-accent, #f43f5e);
            color: #fff;
            background: var(--topic-accent-soft, rgba(244, 63, 94, 0.16));
          }

          .panel-${sceneId} .p-feedback {
            min-height: 38px;
            border-radius: 13px;
            padding: 10px 12px;
            background: rgba(2, 6, 23, 0.32);
            color: rgba(226, 232, 240, 0.78);
            font-size: 12px;
            line-height: 1.5;
          }

          .panel-${sceneId} .p-feedback.is-correct {
            color: #bbf7d0;
            background: rgba(34, 197, 94, 0.13);
          }

          .panel-${sceneId} .p-feedback.is-wrong {
            color: #fecaca;
            background: rgba(239, 68, 68, 0.13);
          }

          @media (max-width: 760px) {
            [data-scope="${sceneId}"] .kidney-stage__modalOverlay {
              align-items: flex-start;
              padding: max(10px, env(safe-area-inset-top)) 10px max(10px, env(safe-area-inset-bottom));
              overflow: hidden;
            }

            [data-scope="${sceneId}"] .kidney-stage__modalContent {
              width: min(100%, 390px);
              max-width: calc(100vw - 20px);
              height: calc(100vh - 20px);
              height: calc(100dvh - 20px);
              max-height: none;
              padding: 58px 16px 18px;
              overflow-y: auto;
              border-radius: 26px;
              -webkit-overflow-scrolling: touch;
              overscroll-behavior: contain;
              scrollbar-width: none;
              -ms-overflow-style: none;
            }

            [data-scope="${sceneId}"] .kidney-stage__modalContent::-webkit-scrollbar {
              width: 0;
              height: 0;
              display: none;
            }

            [data-scope="${sceneId}"] .kidney-stage__modalClose {
              position: fixed;
              top: max(14px, env(safe-area-inset-top));
              right: max(14px, env(safe-area-inset-right));
              width: 44px;
              height: 44px;
              border-radius: 14px;
              background: rgba(15, 23, 42, 0.72);
              border-color: rgba(255, 255, 255, 0.16);
              color: rgba(255, 255, 255, 0.9);
              box-shadow: 0 10px 28px rgba(0, 0, 0, 0.38);
              backdrop-filter: blur(12px);
            }

            [data-scope="${sceneId}"] .kidney-stage__modalGrid {
              grid-template-columns: 1fr;
              gap: 18px;
              height: auto;
              min-height: min-content;
              overflow: visible;
            }

            [data-scope="${sceneId}"] .kidney-stage__modalImageShell {
              width: 100%;
              max-width: min(100%, 320px);
              height: auto;
              max-height: none;
              border-radius: 22px;
            }

            [data-scope="${sceneId}"] .kidney-stage__modalImage {
              border-radius: 20px;
            }

            [data-scope="${sceneId}"] .kidney-stage__modalDetails {
              height: auto;
              overflow-y: visible;
              gap: 14px;
              padding-right: 0;
            }

            [data-scope="${sceneId}"] .kidney-stage__modalTitle {
              font-size: 24px;
              line-height: 1.15;
            }

            [data-scope="${sceneId}"] .kidney-stage__modalSummary,
            [data-scope="${sceneId}"] .kidney-stage__modalPrompt,
            [data-scope="${sceneId}"] .kidney-stage__modalChecks li {
              font-size: 12.5px;
            }

            [data-scope="${sceneId}"] .kidney-stage {
              padding: 8px;
            }

            [data-scope="${sceneId}"] .kidney-stage__frame {
              border-radius: 22px;
            }

            [data-scope="${sceneId}"] .kidney-stage__topicBadge {
              display: none;
            }

            [data-scope="${sceneId}"] .kidney-stage__viewerTip {
              display: none;
            }

            [data-scope="${sceneId}"] .kidney-stage__bottom {
              left: 10px;
              right: 10px;
              bottom: 10px;
              align-items: flex-end;
            }

            [data-scope="${sceneId}"] .kidney-stage__legend {
              max-width: 62%;
            }

            [data-scope="${sceneId}"] .kidney-stage__legendItem {
              min-height: 28px;
              padding: 6px 8px;
              font-size: 10px;
            }

            [data-scope="${sceneId}"] .kidney-stage__controlBtn {
              min-height: 34px;
              padding: 0 9px;
              font-size: 11px;
            }

            .panel-${sceneId} .p-card {
              padding: 10px;
              gap: 7px;
            }

            .panel-${sceneId} {
              padding: 10px;
              gap: 10px;
            }

            .panel-${sceneId} .p-taskGrid {
              grid-template-columns: 1fr;
            }

            .panel-${sceneId} .p-flowLine {
              grid-template-columns: 68px minmax(0, 1fr);
            }

            .panel-${sceneId} .p-title {
              font-size: 18px;
            }
          }

          /* Unified mobile/tablet layout for observation-task image popups. */
          @media (max-width: 900px) {
            [data-scope="${sceneId}"] .kidney-stage__modalOverlay {
              align-items: center;
              justify-content: center;
              padding: max(24px, env(safe-area-inset-top)) max(24px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(24px, env(safe-area-inset-left));
              overflow: hidden;
            }

            [data-scope="${sceneId}"] .kidney-stage__modalContent {
              width: min(calc(100vw - 48px), 560px);
              max-width: 560px;
              height: auto;
              min-height: 0;
              max-height: min(90vh, 760px);
              max-height: min(90dvh, 760px);
              padding: 54px 22px 22px;
              border-radius: 26px;
              overflow-y: auto;
              -webkit-overflow-scrolling: touch;
              overscroll-behavior: contain;
              scrollbar-width: none;
              -ms-overflow-style: none;
            }

            [data-scope="${sceneId}"] .kidney-stage__modalContent::-webkit-scrollbar {
              width: 0;
              height: 0;
              display: none;
            }

            [data-scope="${sceneId}"] .kidney-stage__modalClose {
              position: absolute;
              top: 14px;
              right: 14px;
              width: 44px;
              height: 44px;
              min-width: 44px;
              min-height: 44px;
              border-radius: 14px;
              background: rgba(15, 23, 42, 0.78);
              border-color: rgba(255, 255, 255, 0.16);
              color: rgba(255, 255, 255, 0.92);
              backdrop-filter: blur(12px);
              box-shadow: 0 10px 28px rgba(0, 0, 0, 0.38);
            }

            [data-scope="${sceneId}"] .kidney-stage__modalGrid {
              grid-template-columns: 1fr;
              gap: 18px;
              align-items: start;
              height: auto;
              min-height: 0;
              overflow: visible;
            }

            [data-scope="${sceneId}"] .kidney-stage__modalImageShell {
              width: min(100%, 320px);
              max-width: 320px;
              height: auto;
              max-height: none;
              aspect-ratio: 1 / 1;
              border-radius: 22px;
              margin: 0 auto;
            }

            [data-scope="${sceneId}"] .kidney-stage__modalImage {
              width: 100%;
              height: 100%;
              aspect-ratio: 1 / 1;
              object-fit: cover;
              border-radius: 20px;
            }

            [data-scope="${sceneId}"] .kidney-stage__modalDetails {
              height: auto;
              min-height: 0;
              max-height: none;
              overflow: visible;
              padding-right: 0;
              gap: 14px;
            }

            [data-scope="${sceneId}"] .kidney-stage__modalTitle {
              font-size: 24px;
              line-height: 1.16;
              overflow-wrap: anywhere;
            }

            [data-scope="${sceneId}"] .kidney-stage__modalSummary,
            [data-scope="${sceneId}"] .kidney-stage__modalPrompt,
            [data-scope="${sceneId}"] .kidney-stage__modalChecks li {
              font-size: 12.5px;
              line-height: 1.5;
            }
          }

          @media (max-width: 480px) {
            [data-scope="${sceneId}"] .kidney-stage__modalOverlay {
              padding: max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left));
            }

            [data-scope="${sceneId}"] .kidney-stage__modalContent {
              width: calc(100vw - 20px);
              max-width: calc(100vw - 20px);
              max-height: calc(100vh - 20px);
              max-height: calc(100dvh - 20px);
              padding: 54px 16px 18px;
              border-radius: 24px;
            }

            [data-scope="${sceneId}"] .kidney-stage__modalImageShell {
              width: min(100%, 280px);
              max-width: 280px;
            }

            [data-scope="${sceneId}"] .kidney-stage__modalTitle {
              font-size: 22px;
              line-height: 1.18;
            }
          }

          @media (max-width: 900px) and (max-height: 480px) {
            [data-scope="${sceneId}"] .kidney-stage__modalOverlay {
              padding: max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left));
            }

            [data-scope="${sceneId}"] .kidney-stage__modalContent {
              width: calc(100vw - 20px);
              max-width: 780px;
              max-height: calc(100vh - 20px);
              max-height: calc(100dvh - 20px);
              padding: 14px 58px 14px 14px;
              border-radius: 22px;
            }

            [data-scope="${sceneId}"] .kidney-stage__modalClose {
              top: 12px;
              right: 12px;
              width: 40px;
              height: 40px;
              min-width: 40px;
              min-height: 40px;
            }

            [data-scope="${sceneId}"] .kidney-stage__modalGrid {
              grid-template-columns: minmax(160px, 0.85fr) minmax(0, 1fr);
              gap: 16px;
              align-items: center;
            }

            [data-scope="${sceneId}"] .kidney-stage__modalImageShell {
              width: min(34vw, 220px);
              max-width: 220px;
            }

            [data-scope="${sceneId}"] .kidney-stage__modalDetails {
              max-height: calc(100dvh - 48px);
              overflow-y: auto;
              padding-right: 2px;
              scrollbar-width: none;
              -ms-overflow-style: none;
            }

            [data-scope="${sceneId}"] .kidney-stage__modalDetails::-webkit-scrollbar {
              width: 0;
              height: 0;
              display: none;
            }

            [data-scope="${sceneId}"] .kidney-stage__modalTitle {
              font-size: 20px;
              line-height: 1.16;
            }

            [data-scope="${sceneId}"] .kidney-stage__modalSummary,
            [data-scope="${sceneId}"] .kidney-stage__modalPrompt,
            [data-scope="${sceneId}"] .kidney-stage__modalChecks li {
              font-size: 12px;
              line-height: 1.45;
            }
          }
        `;
        document.head.appendChild(style);
      }

      function renderStage() {
        const topic = getActiveTopic();
        container.style.setProperty("--topic-accent", topic.accent);
        container.innerHTML = `
          <div class="kidney-stage">
            <div class="kidney-stage__frame">
              <div class="kidney-stage__grid"></div>
              <div class="kidney-stage__viewerWrap">
                <model-viewer
                  class="kidney-stage__viewer"
                  src="${escapeHtml(modelSrc)}"
                  camera-controls
                  interaction-prompt="none"
                  shadow-intensity="0.82"
                  exposure="0.96"
                  environment-image="neutral"
                  loading="eager"
                  field-of-view="42deg"
                  min-field-of-view="12deg"
                  max-field-of-view="82deg"
                  camera-orbit="${escapeHtml(topic.cameraOrbit)}"
                  alt="肾脏 3D 模型">
                  <div class="kidney-stage__poster" slot="poster">模型加载中...</div>
                </model-viewer>
              </div>
              <div class="kidney-stage__viewerTip">拖拽旋转 · 双指缩放 · 鼠标滚轮</div>
              <div class="kidney-stage__hud">
                <div class="kidney-stage__topicBadge">
                  <div class="kidney-stage__topicLabel">当前观察任务</div>
                  <div class="kidney-stage__topicValue" data-role="topic-label">${escapeHtml(topic.label)}</div>
                </div>
              </div>
              <div class="kidney-stage__bottom">
                <div class="kidney-stage__legend" aria-label="泌尿系统图例">
                  <div class="kidney-stage__legendItem"><span class="kidney-stage__dot" style="--dot-color:#f43f5e"></span>肾脏</div>
                  <div class="kidney-stage__legendItem"><span class="kidney-stage__dot" style="--dot-color:#38bdf8"></span>血液</div>
                  <div class="kidney-stage__legendItem"><span class="kidney-stage__dot" style="--dot-color:#facc15"></span>尿液形成</div>
                </div>
                <div class="kidney-stage__controls">
                  <button class="kidney-stage__controlBtn${state.autoRotate ? " is-active" : ""}" type="button" data-action="toggle-rotate">
                    <span>旋转</span>
                  </button>
                  <button class="kidney-stage__controlBtn" type="button" data-action="reset-camera">
                    <span>复位</span>
                  </button>
                </div>
              </div>
              <div class="kidney-stage__modalOverlay${state.showModal ? " is-open" : ""}" data-role="topic-modal">
                <div class="kidney-stage__modalContent">
                  <button class="kidney-stage__modalClose" type="button" data-action="close-modal" aria-label="关闭弹窗">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                  <div class="kidney-stage__modalGrid">
                    <div class="kidney-stage__modalImageShell">
                      <img class="kidney-stage__modalImage" data-role="modal-image" src="${escapeHtml(resolveAssetUrl(topic.imageRelativeUrl))}" alt="${escapeHtml(topic.label)}教学配图">
                    </div>
                    <div class="kidney-stage__modalDetails">
                      <div>
                        <span class="kidney-stage__modalEyebrow">泌尿系统与尿液形成 · 配图讲解</span>
                        <h2 class="kidney-stage__modalTitle" data-role="modal-title">${escapeHtml(topic.label)}</h2>
                      </div>
                      <p class="kidney-stage__modalSummary" data-role="modal-summary">${escapeHtml(topic.summary)}</p>
                      <div>
                        <h3 class="kidney-stage__modalSectionTitle">学习提示</h3>
                        <p class="kidney-stage__modalPrompt" data-role="modal-prompt">${escapeHtml(topic.prompt)}</p>
                      </div>
                      <div>
                        <h3 class="kidney-stage__modalSectionTitle">知识要点</h3>
                        <ul class="kidney-stage__modalChecks" data-role="modal-checks">${renderChecks(topic)}</ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;

        const viewer = findViewer();
        if (viewer && state.autoRotate) {
          viewer.setAttribute("auto-rotate", "");
        }
      }

      function renderTaskButtons() {
        return TOPIC_BUTTONS.map(topic => `
          <button
            class="p-task${topic.id === state.activeTopic ? " is-active" : ""}"
            type="button"
            data-action="select-topic"
            data-topic="${escapeHtml(topic.id)}"
            style="--item-accent:${escapeHtml(topic.accent)}">
            <strong>${escapeHtml(topic.label)}</strong>
            <span>${escapeHtml(topic.tag)}</span>
          </button>
        `).join("");
      }

      function renderFlow() {
        return FLOW_STEPS.map(step => `
          <div class="p-flowLine">
            <span>${escapeHtml(step.label)}</span>
            <strong>${escapeHtml(step.text)}</strong>
          </div>
        `).join("");
      }

      function renderQuizOptions() {
        return QUICK_CHECKS.map(check => {
          const isSelected = state.quizAnswer === check.id;
          return `
            <button class="p-quizOption${isSelected ? " is-selected" : ""}" type="button" data-action="answer-check" data-check="${escapeHtml(check.id)}">
              ${escapeHtml(check.text)}
            </button>
          `;
        }).join("");
      }

      function renderChecks(topic) {
        return (topic.checks || []).map(item => `<li>${escapeHtml(item)}</li>`).join("");
      }

      function renderPanel() {
        if (!panelHost) return;
        const previousPanel = panelHost.querySelector(`.panel-${sceneId}`);
        const previousScrollTop = previousPanel ? previousPanel.scrollTop : 0;
        const topic = getActiveTopic();
        const picked = QUICK_CHECKS.find(check => check.id === state.quizAnswer);
        const feedbackClass = picked ? picked.correct ? " is-correct" : " is-wrong" : "";
        panelHost.innerHTML = `
          <div class="panel-${sceneId}" style="--topic-accent:${escapeHtml(topic.accent)}; --topic-accent-soft:${escapeHtml(topic.accent)}26">
            <div class="p-card">
              <span class="p-eyebrow">3D 模型观察</span>
              <h2 class="p-title">泌尿系统与尿液形成</h2>
              <p class="p-desc">以肾脏 3D 模型为主观察对象，结合右侧任务讲解泌尿系统组成、肾单位结构和尿液形成过程。</p>
              <div class="p-actionRow">
                <button class="p-action${state.autoRotate ? " is-active" : ""}" type="button" data-action="toggle-rotate">自动旋转</button>
                <button class="p-action" type="button" data-action="reset-camera">复位视角</button>
              </div>
            </div>

            <div class="p-card">
              <span class="p-eyebrow">观察任务</span>
              <div class="p-taskGrid">
                ${renderTaskButtons()}
              </div>
            </div>

            <div class="p-card">
              <span class="p-eyebrow">教学卡片</span>
              <h2 class="p-title">${escapeHtml(topic.label)}</h2>
              <p class="p-desc">${escapeHtml(topic.prompt)}</p>
              <ul class="p-checkList">${renderChecks(topic)}</ul>
            </div>

            <div class="p-card">
              <span class="p-eyebrow">尿液形成流程</span>
              <div class="p-flow">
                ${renderFlow()}
              </div>
            </div>

            <div class="p-card">
              <span class="p-eyebrow">快速判断</span>
              <div class="p-quiz">
                <div class="p-quizQuestion">${escapeHtml(QUICK_QUESTION)}</div>
                ${renderQuizOptions()}
                <div class="p-feedback${feedbackClass}">${escapeHtml(state.quizFeedback || "选择一个答案后，这里会给出即时反馈。")}</div>
              </div>
            </div>
          </div>
        `;
        const nextPanel = panelHost.querySelector(`.panel-${sceneId}`);
        if (nextPanel && previousScrollTop > 0) {
          nextPanel.scrollTop = previousScrollTop;
        }
      }

      function applyCameraForTopic() {
        const viewer = findViewer();
        const topic = getActiveTopic();
        if (!viewer) return;
        viewer.setAttribute("camera-orbit", topic.cameraOrbit);
        viewer.setAttribute("field-of-view", "42deg");
        if (typeof viewer.jumpCameraToGoal === "function") {
          try {
            viewer.jumpCameraToGoal();
          } catch (error) {
            // model-viewer may not be ready yet; attribute updates are still applied.
          }
        }
      }

      function updateStage() {
        const topic = getActiveTopic();
        container.style.setProperty("--topic-accent", topic.accent);
        container.style.setProperty("--topic-accent-soft", `${topic.accent}26`);

        const label = container.querySelector('[data-role="topic-label"]');
        if (label) label.textContent = topic.label;

        const modalOverlay = container.querySelector('[data-role="topic-modal"]');
        if (modalOverlay) {
          const modalImage = modalOverlay.querySelector('[data-role="modal-image"]');
          const modalTitle = modalOverlay.querySelector('[data-role="modal-title"]');
          const modalSummary = modalOverlay.querySelector('[data-role="modal-summary"]');
          const modalPrompt = modalOverlay.querySelector('[data-role="modal-prompt"]');
          const modalChecks = modalOverlay.querySelector('[data-role="modal-checks"]');
          const modalContent = modalOverlay.querySelector('.kidney-stage__modalContent');

          if (modalImage) {
            modalImage.src = resolveAssetUrl(topic.imageRelativeUrl);
            modalImage.alt = `${topic.label}教学配图`;
          }
          if (modalTitle) modalTitle.textContent = topic.label;
          if (modalSummary) modalSummary.textContent = topic.summary;
          if (modalPrompt) modalPrompt.textContent = topic.prompt;
          if (modalChecks) modalChecks.innerHTML = renderChecks(topic);
          if (modalContent) {
            modalContent.style.borderColor = `${topic.accent}3d`;
            modalContent.style.boxShadow = `0 30px 70px rgba(0, 0, 0, 0.75), inset 0 0 45px ${topic.accent}14`;
          }

          modalOverlay.classList.toggle("is-open", state.showModal);
        }
      }

      function closeModal() {
        state.showModal = false;
        updateStage();
        renderPanel();
      }

      function handleClick(event) {
        const target = event.target.closest("[data-action]");
        if (!target) return;
        const action = target.getAttribute("data-action");

        if (action === "select-topic") {
          const topicId = target.getAttribute("data-topic");
          if (!TOPIC_BUTTONS.some(topic => topic.id === topicId)) return;
          state.activeTopic = topicId;
          state.quizFeedback = "";
          state.showModal = true;
          renderPanel();
          applyCameraForTopic();
          updateStage();
          return;
        }

        if (action === "toggle-rotate") {
          state.autoRotate = !state.autoRotate;
          const viewer = findViewer();
          if (viewer) {
            if (state.autoRotate) {
              viewer.setAttribute("auto-rotate", "");
            } else {
              viewer.removeAttribute("auto-rotate");
            }
          }
          const button = container.querySelector('[data-action="toggle-rotate"]');
          if (button) button.classList.toggle("is-active", state.autoRotate);
          return;
        }

        if (action === "reset-camera") {
          state.showModal = false;
          applyCameraForTopic();
          updateStage();
          renderPanel();
          return;
        }

        if (action === "close-modal") {
          event.preventDefault();
          event.stopPropagation();
          closeModal();
          return;
        }

        if (action === "answer-check") {
          const checkId = target.getAttribute("data-check");
          const check = QUICK_CHECKS.find(item => item.id === checkId);
          if (!check) return;
          state.quizAnswer = check.id;
          state.quizFeedback = check.correct
            ? "判断正确。血细胞和大分子蛋白质通常不能通过肾小球滤过屏障。"
            : "再想想：水、无机盐和尿素都可能参与尿液形成，异常出现血细胞或大分子蛋白质才更需要警惕滤过屏障问题。";
          renderPanel();
        }
      }

      function start() {
        if (disposed) return;
        container.innerHTML = "";
        container.setAttribute("data-scope", sceneId);
        container.style.position = "relative";
        container.style.width = "100%";
        container.style.height = "100%";
        container.style.overflow = "hidden";
        setScopedStyle();
        renderStage();
        renderPanel();
        updateStage();
        container.addEventListener("click", handleClick);
        if (panelHost) panelHost.addEventListener("click", handleClick);
        if (window.BiologyApp && typeof window.BiologyApp.enhanceBiologyModelViewerProgress === "function") {
          window.BiologyApp.enhanceBiologyModelViewerProgress(container);
        }
      }

      loadModelViewer().then(start);

      container.__bioSceneCleanup = function cleanup() {
        disposed = true;
        window.BiologyApp?.releaseBiologyModelViewers?.(container);
        container.removeEventListener("click", handleClick);
        if (panelHost) {
          panelHost.removeEventListener("click", handleClick);
          panelHost.innerHTML = "";
        }
        const style = document.getElementById(`${sceneId}-style`);
        if (style) style.remove();
      };
    },

    unmount: function unmount(container) {
      if (container && typeof container.__bioSceneCleanup === "function") {
        container.__bioSceneCleanup();
        delete container.__bioSceneCleanup;
      }
      if (container) {
        container.innerHTML = "";
      }
    }
  };
})();
