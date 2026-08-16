window.BIO_VISUAL_SCENES = window.BIO_VISUAL_SCENES || {};

window.BIO_VISUAL_SCENES["j7a_m05"] = (function () {
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

  const TASKS = [
    {
      id: "hierarchy",
      title: "结构层次总览",
      label: "层级顺序",
      accent: "#38bdf8",
      summary: "多细胞动物体的结构层次通常可以概括为：细胞、组织、器官、系统、个体。",
      prompt: "讲解时先把层次顺序说清楚，再说明每一层都是上一层按一定方式组合后形成的更高层次结构。",
      checks: ["细胞是生命活动的基本单位", "形态相似、功能相同的细胞群形成组织", "不同层次之间不能随意跳级"],
      imageRelativeUrl: "assets/images/organization-hierarchy-square.png?v=f307aadd7305"
    },
    {
      id: "tissue-organ",
      title: "组织形成器官",
      label: "组合关系",
      accent: "#f97316",
      summary: "不同组织按照一定次序结合在一起，形成具有特定功能的器官。",
      prompt: "以胃为例，它不是单一组织，而是由上皮组织、肌肉组织、结缔组织、神经组织等共同构成。",
      checks: ["组织由细胞群构成", "器官由多种组织构成", "器官具有相对完整的特定功能"],
      imageRelativeUrl: "assets/images/tissue-organ-square.png?v=d92507560fde"
    },
    {
      id: "skeleton",
      title: "骨骼系统观察",
      label: "支撑保护",
      accent: "#facc15",
      summary: "骨骼由许多骨连接而成，能支撑身体、保护内部器官，并与肌肉协同完成运动。",
      prompt: "观察骨骼模型时，重点看头骨、脊柱、肋骨、骨盆和四肢骨如何共同构成支架。",
      checks: ["骨属于器官层次", "骨与骨连接构成骨骼系统", "骨骼系统参与支撑、保护和运动"],
      imageRelativeUrl: "assets/images/skeletal-system-square.png?v=6686e58c3220"
    },
    {
      id: "muscle",
      title: "肌肉系统观察",
      label: "收缩运动",
      accent: "#ef4444",
      summary: "肌肉附着在骨上，通过收缩和舒张牵拉骨绕关节运动，是动物体运动的重要基础。",
      prompt: "观察肌肉模型时，联系肌肉组织的收缩功能，说明组织、器官和系统如何共同完成运动。",
      checks: ["肌肉组织具有收缩和舒张能力", "肌肉通常需要附着在骨上产生运动", "运动系统需要骨、关节和肌肉协调"],
      imageRelativeUrl: "assets/images/muscular-system-square.png?v=c7092b186ff4"
    }
  ];

  const MODELS = {
    muscles: {
      title: "人体肌肉",
      label: "肌肉系统模型",
      src: {
        desktop: "assets/models/human-muscles.glb?v=a727df8d755d",
        tablet: "assets/models/human-muscles.tablet.glb?v=6a7fc18cc0d2",
        mobile: "assets/models/human-muscles.mobile.glb?v=792d49112d46"
      },
      alt: "人体肌肉 3D 模型",
      accent: "#ef4444",
      cameraOrbit: "20deg 72deg 125%",
      fieldOfView: "40deg",
      exposure: "0.96",
      shadowIntensity: "0.72"
    },
    skeleton: {
      title: "人体骨骼",
      label: "骨骼系统模型",
      src: "assets/models/human-skeleton.glb?v=a52763ee8b2c",
      alt: "人体骨骼 3D 模型",
      accent: "#facc15",
      cameraOrbit: "-18deg 70deg 118%",
      fieldOfView: "40deg",
      exposure: "1",
      shadowIntensity: "0.62"
    }
  };

  const FLOW_STEPS = [
    { label: "细胞", text: "细胞是生物体结构和功能的基本单位。" },
    { label: "组织", text: "形态相似、结构和功能相同的细胞群形成组织。" },
    { label: "器官", text: "多种组织按一定次序结合，形成具有特定功能的器官。" },
    { label: "系统", text: "多个器官按功能联系组成系统，共同完成一类生命活动。" },
    { label: "个体", text: "多个系统协调配合，构成完整的动物体。" }
  ];

  const QUIZ = {
    question: "胃由多种组织构成，并能完成初步消化等功能，它属于哪一结构层次？",
    options: [
      { id: "tissue", text: "组织", correct: false },
      { id: "organ", text: "器官", correct: true },
      { id: "system", text: "系统", correct: false }
    ]
  };

  return {
    mount: function mount(container, context) {
      const sceneId = "body-hierarchy-" + Math.random().toString(36).slice(2, 9);
      const panelHost = context && context.externalPanel ? context.externalPanel : null;
      const assetBase = context && context.sceneEntry && context.sceneEntry.folder ? `${context.sceneEntry.folder}/` : "";
      const runtimeVersioner = window.BiologyApp && window.BiologyApp.appendRuntimeVersion;
      const isMobileModelTarget = (
        window.matchMedia?.("(hover: none), (pointer: coarse), (max-width: 900px)")?.matches ||
        (navigator.deviceMemory && navigator.deviceMemory <= 4)
      );

      let disposed = false;
      const state = {
        activeTask: "hierarchy",
        activeModel: isMobileModelTarget ? "skeleton" : "muscles",
        autoRotate: !isMobileModelTarget,
        quizAnswer: "",
        quizFeedback: "",
        showModal: false,
        preservePanelScroll: true
      };

      function resolveAssetUrl(relativeUrl) {
        const rawUrl = `${assetBase}${relativeUrl}`;
        return typeof runtimeVersioner === "function" ? runtimeVersioner(rawUrl) : rawUrl;
      }

      function resolveModelSource(source) {
        if (source && typeof source === "object") {
          const withBase = {};
          Object.keys(source).forEach(key => {
            withBase[key] = `${assetBase}${source[key]}`;
          });
          if (window.BiologyApp && typeof window.BiologyApp.resolveBiologyModelVariantSource === "function") {
            return window.BiologyApp.resolveBiologyModelVariantSource(withBase);
          }
          return resolveAssetUrl(isMobileModelTarget ? (source.mobile || source.tablet || source.desktop) : source.desktop);
        }
        return resolveAssetUrl(source);
      }

      function setViewerModelSource(viewer, source) {
        if (!viewer) return "";
        if (source && typeof source === "object" && window.BiologyApp && typeof window.BiologyApp.setBiologyModelViewerSource === "function") {
          const withBase = {};
          Object.keys(source).forEach(key => {
            withBase[key] = `${assetBase}${source[key]}`;
          });
          return window.BiologyApp.setBiologyModelViewerSource(viewer, withBase);
        }
        const modelSrc = resolveModelSource(source);
        if (viewer.getAttribute("src") !== modelSrc) {
          window.BiologyApp?.releaseBiologyModelViewer?.(viewer);
          viewer.setAttribute("src", modelSrc);
        }
        return modelSrc;
      }

      function getActiveTask() {
        return TASKS.find(task => task.id === state.activeTask) || TASKS[0];
      }

      function getActiveModel() {
        return MODELS[state.activeModel] || MODELS.muscles;
      }

      function findViewer() {
        return container.querySelector("model-viewer");
      }

      function renderChecks(task) {
        return (task.checks || []).map(item => `<li>${escapeHtml(item)}</li>`).join("");
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
          [data-scope="${sceneId}"] * { box-sizing: border-box; }
          [data-scope="${sceneId}"] .hierarchy-stage {
            width: 100%;
            height: 100%;
            min-height: 0;
            position: relative;
            padding: 12px;
            overflow: hidden;
          }
          [data-scope="${sceneId}"] .hierarchy-stage__frame {
            width: 100%;
            height: 100%;
            min-height: 0;
            position: relative;
            overflow: hidden;
            border-radius: 28px;
            border: 1px solid rgba(56, 189, 248, 0.22);
            background:
              radial-gradient(circle at 30% 25%, rgba(239, 68, 68, 0.2), transparent 32%),
              radial-gradient(circle at 76% 70%, rgba(250, 204, 21, 0.16), transparent 34%),
              linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.98));
            box-shadow: inset 0 0 90px rgba(56, 189, 248, 0.08), 0 24px 70px rgba(0, 0, 0, 0.46);
          }
          [data-scope="${sceneId}"] .hierarchy-stage__grid {
            position: absolute;
            inset: 0;
            z-index: 1;
            pointer-events: none;
            opacity: 0.2;
            background-image:
              linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
            background-size: 42px 42px;
            mask-image: radial-gradient(circle at center, #000 32%, transparent 78%);
          }
          [data-scope="${sceneId}"] .hierarchy-stage__viewerWrap {
            position: absolute;
            inset: 0;
            z-index: 2;
          }
          [data-scope="${sceneId}"] .hierarchy-stage__viewer {
            display: block;
            width: 100%;
            height: 100%;
            background: transparent;
            outline: none;
            --poster-color: transparent;
          }
          [data-scope="${sceneId}"] .hierarchy-stage__poster {
            width: 100%;
            height: 100%;
            display: grid;
            place-items: center;
            background: rgba(2, 6, 23, 0.78);
            color: rgba(248, 250, 252, 0.66);
            font-size: 13px;
            line-height: 1.4;
            font-weight: 900;
            letter-spacing: 0.08em;
          }
          [data-scope="${sceneId}"] .hierarchy-stage__hud {
            position: absolute;
            top: 16px;
            right: 16px;
            z-index: 6;
            pointer-events: none;
          }
          [data-scope="${sceneId}"] .hierarchy-stage__taskBadge {
            width: min(250px, calc(100vw - 48px));
            display: grid;
            gap: 7px;
            padding: 13px 14px;
            border-radius: 18px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(2, 6, 23, 0.62);
            box-shadow: 0 16px 38px rgba(0, 0, 0, 0.34);
            backdrop-filter: blur(16px);
          }
          [data-scope="${sceneId}"] .hierarchy-stage__taskLabel {
            color: rgba(248, 250, 252, 0.52);
            font-size: 10px;
            line-height: 1.2;
            font-weight: 900;
            letter-spacing: 0.16em;
          }
          [data-scope="${sceneId}"] .hierarchy-stage__taskValue {
            min-width: 0;
            color: var(--task-accent, #38bdf8);
            font-size: 16px;
            line-height: 1.25;
            font-weight: 950;
            overflow-wrap: anywhere;
          }
          [data-scope="${sceneId}"] .hierarchy-stage__bottom {
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
          [data-scope="${sceneId}"] .hierarchy-stage__legend {
            min-width: 0;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }
          [data-scope="${sceneId}"] .hierarchy-stage__legendItem {
            min-height: 30px;
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 7px 10px;
            border-radius: 999px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(2, 6, 23, 0.58);
            color: rgba(226, 232, 240, 0.9);
            font-size: 11px;
            line-height: 1.2;
            font-weight: 850;
            backdrop-filter: blur(12px);
          }
          [data-scope="${sceneId}"] .hierarchy-stage__dot {
            width: 8px;
            height: 8px;
            flex: none;
            border-radius: 999px;
            background: var(--dot-color);
            box-shadow: 0 0 14px var(--dot-color);
          }
          [data-scope="${sceneId}"] .hierarchy-stage__controls {
            display: flex;
            flex: none;
            gap: 8px;
            pointer-events: auto;
          }
          [data-scope="${sceneId}"] .hierarchy-stage__controlBtn {
            min-height: 38px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
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
          [data-scope="${sceneId}"] .hierarchy-stage__controlBtn:hover,
          [data-scope="${sceneId}"] .hierarchy-stage__controlBtn.is-active {
            transform: translateY(-1px);
            border-color: var(--task-accent, #38bdf8);
            background: var(--task-accent-soft, rgba(56, 189, 248, 0.16));
            color: #fff;
          }
          [data-scope="${sceneId}"] .hierarchy-stage__modalOverlay {
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
          [data-scope="${sceneId}"] .hierarchy-stage__modalOverlay.is-open {
            opacity: 1;
            visibility: visible;
            pointer-events: auto;
          }
          [data-scope="${sceneId}"] .hierarchy-stage__modalContent {
            position: relative;
            isolation: isolate;
            width: 90%;
            max-width: 1100px;
            height: 85vh;
            max-height: 800px;
            display: flex;
            flex-direction: column;
            padding: 40px;
            overflow: hidden;
            border-radius: 32px;
            border: 1.5px solid var(--task-accent-soft, rgba(56, 189, 248, 0.24));
            background: rgba(9, 14, 22, 0.96);
            box-shadow: 0 30px 70px rgba(0, 0, 0, 0.75), inset 0 0 45px var(--task-accent-soft, rgba(56, 189, 248, 0.14));
            transform: scale(0.94) translateY(16px);
            transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          [data-scope="${sceneId}"] .hierarchy-stage__modalOverlay.is-open .hierarchy-stage__modalContent {
            transform: scale(1) translateY(0);
          }
          [data-scope="${sceneId}"] .hierarchy-stage__modalClose {
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
            color: rgba(255, 255, 255, 0.82);
            cursor: pointer;
            pointer-events: auto;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
          }
          [data-scope="${sceneId}"] .hierarchy-stage__modalClose svg { pointer-events: none; }
          [data-scope="${sceneId}"] .hierarchy-stage__modalGrid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            align-items: center;
            height: 100%;
            min-height: 0;
            overflow: hidden;
          }
          [data-scope="${sceneId}"] .hierarchy-stage__modalImageShell {
            position: relative;
            border-radius: 24px;
            overflow: visible;
            border: 1.5px solid rgba(255, 255, 255, 0.12);
            background: rgba(0, 0, 0, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            min-height: 0;
            max-height: 520px;
            aspect-ratio: 1;
            margin: 0 auto;
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.5);
          }
          [data-scope="${sceneId}"] .hierarchy-stage__modalImage {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 22px;
            transition: transform 0.5s ease;
          }
          [data-scope="${sceneId}"] .hierarchy-stage__modalImageShell:hover .hierarchy-stage__modalImage {
            transform: scale(1.02);
          }
          [data-scope="${sceneId}"] .hierarchy-stage__modalImageShell::after {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: 22px;
            box-shadow: inset 0 0 45px var(--task-accent-soft, rgba(56, 189, 248, 0.24));
            pointer-events: none;
          }
          [data-scope="${sceneId}"] .hierarchy-stage__modalDetails {
            display: flex;
            flex-direction: column;
            gap: 20px;
            text-align: left;
            height: 100%;
            overflow-y: auto;
            padding-right: 16px;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          [data-scope="${sceneId}"] .hierarchy-stage__modalDetails::-webkit-scrollbar {
            width: 0;
            height: 0;
            display: none;
          }
          [data-scope="${sceneId}"] .hierarchy-stage__modalEyebrow {
            display: inline-flex;
            max-width: 100%;
            padding: 7px 11px;
            border-radius: 999px;
            background: var(--task-accent-soft, rgba(56, 189, 248, 0.16));
            color: var(--task-accent, #38bdf8);
            font-size: 11px;
            line-height: 1.2;
            font-weight: 950;
            letter-spacing: 0.12em;
            overflow-wrap: anywhere;
          }
          [data-scope="${sceneId}"] .hierarchy-stage__modalTitle {
            margin: 14px 0 0;
            color: #fff;
            font-size: 34px;
            line-height: 1.1;
            font-weight: 950;
            letter-spacing: 0;
            overflow-wrap: anywhere;
          }
          [data-scope="${sceneId}"] .hierarchy-stage__modalSummary,
          [data-scope="${sceneId}"] .hierarchy-stage__modalPrompt {
            margin: 0;
            color: rgba(226, 232, 240, 0.86);
            font-size: 15px;
            line-height: 1.75;
            font-weight: 760;
          }
          [data-scope="${sceneId}"] .hierarchy-stage__modalPrompt {
            padding: 14px 16px;
            border-left: 3px solid var(--task-accent, #38bdf8);
            border-radius: 14px;
            background: rgba(2, 6, 23, 0.34);
          }
          [data-scope="${sceneId}"] .hierarchy-stage__modalSectionTitle {
            margin: 0 0 10px;
            color: var(--task-accent, #38bdf8);
            font-size: 14px;
            line-height: 1.3;
            font-weight: 950;
          }
          [data-scope="${sceneId}"] .hierarchy-stage__modalChecks {
            display: grid;
            gap: 10px;
            margin: 0;
            padding: 0;
            list-style: none;
          }
          [data-scope="${sceneId}"] .hierarchy-stage__modalChecks li {
            position: relative;
            min-height: 34px;
            padding: 9px 12px 9px 30px;
            border-radius: 13px;
            background: rgba(2, 6, 23, 0.34);
            color: rgba(248, 250, 252, 0.9);
            font-size: 13px;
            line-height: 1.45;
            font-weight: 850;
          }
          [data-scope="${sceneId}"] .hierarchy-stage__modalChecks li::before {
            content: "";
            position: absolute;
            left: 12px;
            top: 16px;
            width: 7px;
            height: 7px;
            border-radius: 999px;
            background: var(--task-accent, #38bdf8);
            box-shadow: 0 0 12px var(--task-accent, #38bdf8);
          }
          .panel-${sceneId} {
            width: 100%;
            height: 100%;
            min-width: 0;
            min-height: 0;
            display: flex;
            flex-direction: column;
            gap: 16px;
            overflow-y: auto;
            padding: 16px;
            color: #f8fafc;
            scrollbar-width: none;
            -ms-overflow-style: none;
            font-family: Inter, "Microsoft YaHei", "PingFang SC", Arial, sans-serif;
          }
          .panel-${sceneId}::-webkit-scrollbar {
            width: 0;
            height: 0;
            display: none;
          }
          .panel-${sceneId} * { box-sizing: border-box; }
          .panel-${sceneId} .p-card {
            display: flex;
            flex-direction: column;
            gap: 14px;
            min-width: 0;
            padding: 16px;
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.06);
            background: rgba(255, 255, 255, 0.03);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
          }
          .panel-${sceneId} .p-card--compact {
            gap: 12px;
          }
          .panel-${sceneId} .p-eyebrow {
            color: rgba(241, 245, 249, 0.35);
            font-size: 10px;
            line-height: 1.2;
            font-weight: 900;
            letter-spacing: 0.15em;
          }
          .panel-${sceneId} .p-title {
            margin: 0;
            min-width: 0;
            color: #fff;
            font-size: 18px;
            line-height: 1.25;
            font-weight: 900;
            letter-spacing: -0.01em;
            border-left: 3px solid var(--task-accent, #38bdf8);
            padding-left: 8px;
            overflow-wrap: anywhere;
          }
          .panel-${sceneId} .p-desc {
            margin: 0;
            color: rgba(241, 245, 249, 0.7);
            font-size: 13px;
            line-height: 1.65;
            font-weight: 650;
          }
          .panel-${sceneId} .p-subdesc {
            margin: -6px 0 0;
            color: rgba(241, 245, 249, 0.5);
            font-size: 12px;
            line-height: 1.5;
            font-weight: 650;
          }
          .panel-${sceneId} .p-modelGrid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }
          .panel-${sceneId} .p-taskList {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .panel-${sceneId} .p-model,
          .panel-${sceneId} .p-task {
            appearance: none;
            min-width: 0;
            min-height: 44px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 10px 12px;
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.06);
            background: rgba(255, 255, 255, 0.02);
            color: rgba(226, 232, 240, 0.82);
            text-align: left;
            cursor: pointer;
            transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
          }
          .panel-${sceneId} .p-task {
            min-height: 52px;
          }
          .panel-${sceneId} .p-optionMain {
            min-width: 0;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .panel-${sceneId} .p-optionDot {
            width: 8px;
            height: 8px;
            flex: none;
            border-radius: 999px;
            background: var(--item-accent, var(--task-accent, #38bdf8));
            box-shadow: 0 0 8px var(--item-accent, var(--task-accent, #38bdf8));
          }
          .panel-${sceneId} .p-optionText {
            min-width: 0;
            display: grid;
            gap: 3px;
          }
          .panel-${sceneId} .p-model strong,
          .panel-${sceneId} .p-task strong {
            min-width: 0;
            color: #fff;
            font-size: 13px;
            line-height: 1.25;
            font-weight: 950;
            overflow-wrap: anywhere;
          }
          .panel-${sceneId} .p-model span,
          .panel-${sceneId} .p-task span {
            min-width: 0;
            color: rgba(226, 232, 240, 0.62);
            font-size: 11px;
            line-height: 1.25;
            font-weight: 850;
            overflow-wrap: anywhere;
          }
          .panel-${sceneId} .p-taskAction {
            flex: none;
            color: var(--item-accent, var(--task-accent, #38bdf8));
            font-size: 11px;
            line-height: 1.2;
            font-weight: 900;
            white-space: nowrap;
            opacity: 0.85;
          }
          .panel-${sceneId} .p-model:hover,
          .panel-${sceneId} .p-task:hover {
            border-color: var(--item-accent, var(--task-accent, #38bdf8));
            background: color-mix(in srgb, var(--item-accent, var(--task-accent, #38bdf8)) 14%, rgba(2, 6, 23, 0.5));
            transform: translateY(-1px);
          }
          .panel-${sceneId} .p-model.is-active,
          .panel-${sceneId} .p-task.is-active {
            border-color: var(--item-accent, var(--task-accent, #38bdf8));
            background: color-mix(in srgb, var(--item-accent, var(--task-accent, #38bdf8)) 18%, rgba(2, 6, 23, 0.44));
            box-shadow: 0 4px 20px color-mix(in srgb, var(--item-accent, var(--task-accent, #38bdf8)) 18%, transparent);
          }
          .panel-${sceneId} .p-actionRow {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }
          .panel-${sceneId} .p-action {
            min-height: 40px;
            border-radius: 13px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(2, 6, 23, 0.38);
            color: rgba(248, 250, 252, 0.86);
            font-size: 13px;
            line-height: 1.2;
            font-weight: 900;
            cursor: pointer;
          }
          .panel-${sceneId} .p-action.is-active {
            color: #fff;
            border-color: var(--task-accent, #38bdf8);
            background: var(--task-accent-soft, rgba(56, 189, 248, 0.16));
          }
          .panel-${sceneId} .p-metadata {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 4px;
          }
          .panel-${sceneId} .p-metaPill {
            display: inline-flex;
            flex: 1;
            min-width: 82px;
            flex-direction: column;
            gap: 4px;
            padding: 8px 10px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.05);
            background: rgba(255, 255, 255, 0.02);
          }
          .panel-${sceneId} .p-metaLabel {
            color: rgba(241, 245, 249, 0.35);
            font-size: 9px;
            line-height: 1.2;
            font-weight: 800;
            letter-spacing: 0.08em;
          }
          .panel-${sceneId} .p-metaValue {
            color: #f1f5f9;
            font-size: 11px;
            line-height: 1.3;
            font-weight: 900;
            overflow-wrap: anywhere;
          }
          .panel-${sceneId} .p-factBox {
            display: flex;
            gap: 10px;
            padding: 12px 14px;
            border-radius: 16px;
            border: 1px solid color-mix(in srgb, var(--task-accent, #38bdf8) 22%, transparent);
            background: linear-gradient(135deg, color-mix(in srgb, var(--task-accent, #38bdf8) 12%, transparent), rgba(2, 6, 23, 0.16));
          }
          .panel-${sceneId} .p-factIcon {
            flex: none;
            color: var(--task-accent, #38bdf8);
            font-size: 15px;
            line-height: 1.25;
            font-weight: 900;
          }
          .panel-${sceneId} .p-factText {
            color: rgba(248, 250, 252, 0.86);
            font-size: 12px;
            line-height: 1.6;
            font-weight: 650;
          }
          .panel-${sceneId} .p-checkList {
            display: grid;
            gap: 8px;
            margin: 0;
            padding: 0;
            list-style: none;
          }
          .panel-${sceneId} .p-checkList li {
            min-height: 34px;
            padding: 9px 10px;
            border-radius: 12px;
            background: rgba(2, 6, 23, 0.32);
            color: rgba(226, 232, 240, 0.82);
            font-size: 12px;
            line-height: 1.45;
            font-weight: 800;
          }
          .panel-${sceneId} .p-flow {
            display: grid;
            gap: 7px;
          }
          .panel-${sceneId} .p-flowLine {
            display: grid;
            grid-template-columns: 46px minmax(0, 1fr);
            gap: 10px;
            align-items: center;
            min-height: 36px;
            border-radius: 12px;
            background: rgba(2, 6, 23, 0.32);
            padding: 7px 10px;
          }
          .panel-${sceneId} .p-flowLine span {
            color: rgba(226, 232, 240, 0.62);
            font-size: 11px;
            line-height: 1.2;
            font-weight: 900;
          }
          .panel-${sceneId} .p-flowLine strong {
            min-width: 0;
            color: #fff;
            font-size: 12px;
            line-height: 1.38;
            font-weight: 850;
            overflow-wrap: anywhere;
          }
          .panel-${sceneId} .p-sectionDivider {
            height: 1px;
            background: rgba(255, 255, 255, 0.06);
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
            cursor: pointer;
          }
          .panel-${sceneId} .p-quizOptions {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 8px;
          }
          .panel-${sceneId} .p-quizOptions .p-quizOption {
            min-height: 38px;
            text-align: center;
          }
          .panel-${sceneId} .p-quizOption.is-selected {
            border-color: var(--task-accent, #38bdf8);
            color: #fff;
            background: var(--task-accent-soft, rgba(56, 189, 248, 0.16));
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
          @media (max-width: 900px) {
            [data-scope="${sceneId}"] .hierarchy-stage__modalOverlay {
              align-items: flex-start;
              padding: max(10px, env(safe-area-inset-top)) 10px max(10px, env(safe-area-inset-bottom));
              overflow: hidden;
            }
            [data-scope="${sceneId}"] .hierarchy-stage__modalContent {
              width: min(100%, 390px);
              max-width: calc(100vw - 20px);
              height: calc(100vh - 20px);
              height: calc(100dvh - 20px);
              max-height: none;
              padding: 52px 16px 18px;
              border-radius: 26px;
              overflow-y: auto;
              -webkit-overflow-scrolling: touch;
              overscroll-behavior: contain;
              scrollbar-width: none;
              -ms-overflow-style: none;
            }
            [data-scope="${sceneId}"] .hierarchy-stage__modalContent::-webkit-scrollbar {
              width: 0;
              height: 0;
              display: none;
            }
            [data-scope="${sceneId}"] .hierarchy-stage__modalClose {
              position: fixed;
              top: max(14px, env(safe-area-inset-top));
              right: max(14px, env(safe-area-inset-right));
              width: 44px;
              height: 44px;
              border-radius: 14px;
              background: rgba(15, 23, 42, 0.72);
              border-color: rgba(255, 255, 255, 0.16);
              color: rgba(255, 255, 255, 0.9);
              backdrop-filter: blur(12px);
              box-shadow: 0 10px 28px rgba(0, 0, 0, 0.38);
            }
            [data-scope="${sceneId}"] .hierarchy-stage__modalGrid {
              grid-template-columns: 1fr;
              gap: 18px;
              height: auto;
              min-height: min-content;
              overflow: visible;
            }
            [data-scope="${sceneId}"] .hierarchy-stage__modalImageShell {
              width: 100%;
              max-width: min(100%, 300px);
              height: auto;
              max-height: none;
              border-radius: 22px;
              margin: 0 auto;
            }
            [data-scope="${sceneId}"] .hierarchy-stage__modalImage {
              aspect-ratio: 1;
              border-radius: 20px;
            }
            [data-scope="${sceneId}"] .hierarchy-stage__modalDetails {
              height: auto;
              overflow: visible;
              padding-right: 0;
              gap: 14px;
            }
            [data-scope="${sceneId}"] .hierarchy-stage__modalTitle {
              font-size: 24px;
              line-height: 1.15;
            }
            [data-scope="${sceneId}"] .hierarchy-stage__modalSummary,
            [data-scope="${sceneId}"] .hierarchy-stage__modalPrompt,
            [data-scope="${sceneId}"] .hierarchy-stage__modalChecks li {
              font-size: 12.5px;
            }
            [data-scope="${sceneId}"] .hierarchy-stage { padding: 8px; }
            [data-scope="${sceneId}"] .hierarchy-stage__frame { border-radius: 22px; }
            [data-scope="${sceneId}"] .hierarchy-stage__hud { display: none; }
            [data-scope="${sceneId}"] .hierarchy-stage__bottom {
              left: 10px;
              right: 10px;
              bottom: 10px;
            }
            [data-scope="${sceneId}"] .hierarchy-stage__legend { max-width: 64%; }
            [data-scope="${sceneId}"] .hierarchy-stage__legendItem {
              min-height: 28px;
              padding: 6px 8px;
              font-size: 10px;
            }
            [data-scope="${sceneId}"] .hierarchy-stage__controlBtn {
              min-height: 34px;
              padding: 0 9px;
              font-size: 11px;
            }
            .panel-${sceneId} {
              padding: 10px;
              gap: 10px;
            }
            .panel-${sceneId} .p-card {
              padding: 10px;
              gap: 7px;
            }
            .panel-${sceneId} .p-modelGrid,
            .panel-${sceneId} .p-taskGrid {
              grid-template-columns: 1fr;
            }
            .panel-${sceneId} .p-title { font-size: 18px; }
          }

          /* Unified mobile/tablet layout for observation-task image popups. */
          @media (max-width: 900px) {
            [data-scope="${sceneId}"] .hierarchy-stage__modalOverlay {
              align-items: center;
              justify-content: center;
              padding: max(24px, env(safe-area-inset-top)) max(24px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(24px, env(safe-area-inset-left));
              overflow: hidden;
            }

            [data-scope="${sceneId}"] .hierarchy-stage__modalContent {
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

            [data-scope="${sceneId}"] .hierarchy-stage__modalContent::-webkit-scrollbar {
              width: 0;
              height: 0;
              display: none;
            }

            [data-scope="${sceneId}"] .hierarchy-stage__modalClose {
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

            [data-scope="${sceneId}"] .hierarchy-stage__modalGrid {
              grid-template-columns: 1fr;
              gap: 18px;
              align-items: start;
              height: auto;
              min-height: 0;
              overflow: visible;
            }

            [data-scope="${sceneId}"] .hierarchy-stage__modalImageShell {
              width: min(100%, 320px);
              max-width: 320px;
              height: auto;
              max-height: none;
              aspect-ratio: 1 / 1;
              border-radius: 22px;
              margin: 0 auto;
            }

            [data-scope="${sceneId}"] .hierarchy-stage__modalImage {
              width: 100%;
              height: 100%;
              aspect-ratio: 1 / 1;
              object-fit: cover;
              border-radius: 20px;
            }

            [data-scope="${sceneId}"] .hierarchy-stage__modalDetails {
              height: auto;
              min-height: 0;
              max-height: none;
              overflow: visible;
              padding-right: 0;
              gap: 14px;
            }

            [data-scope="${sceneId}"] .hierarchy-stage__modalTitle {
              font-size: 24px;
              line-height: 1.16;
              overflow-wrap: anywhere;
            }

            [data-scope="${sceneId}"] .hierarchy-stage__modalSummary,
            [data-scope="${sceneId}"] .hierarchy-stage__modalPrompt,
            [data-scope="${sceneId}"] .hierarchy-stage__modalChecks li {
              font-size: 12.5px;
              line-height: 1.5;
            }
          }

          @media (max-width: 480px) {
            [data-scope="${sceneId}"] .hierarchy-stage__modalOverlay {
              padding: max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left));
            }

            [data-scope="${sceneId}"] .hierarchy-stage__modalContent {
              width: calc(100vw - 20px);
              max-width: calc(100vw - 20px);
              max-height: calc(100vh - 20px);
              max-height: calc(100dvh - 20px);
              padding: 54px 16px 18px;
              border-radius: 24px;
            }

            [data-scope="${sceneId}"] .hierarchy-stage__modalImageShell {
              width: min(100%, 280px);
              max-width: 280px;
            }

            [data-scope="${sceneId}"] .hierarchy-stage__modalTitle {
              font-size: 22px;
              line-height: 1.18;
            }
          }

          @media (max-width: 900px) and (max-height: 480px) {
            [data-scope="${sceneId}"] .hierarchy-stage__modalOverlay {
              padding: max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left));
            }

            [data-scope="${sceneId}"] .hierarchy-stage__modalContent {
              width: calc(100vw - 20px);
              max-width: 780px;
              max-height: calc(100vh - 20px);
              max-height: calc(100dvh - 20px);
              padding: 14px 58px 14px 14px;
              border-radius: 22px;
            }

            [data-scope="${sceneId}"] .hierarchy-stage__modalClose {
              top: 12px;
              right: 12px;
              width: 40px;
              height: 40px;
              min-width: 40px;
              min-height: 40px;
            }

            [data-scope="${sceneId}"] .hierarchy-stage__modalGrid {
              grid-template-columns: minmax(160px, 0.85fr) minmax(0, 1fr);
              gap: 16px;
              align-items: center;
            }

            [data-scope="${sceneId}"] .hierarchy-stage__modalImageShell {
              width: min(34vw, 220px);
              max-width: 220px;
            }

            [data-scope="${sceneId}"] .hierarchy-stage__modalDetails {
              max-height: calc(100dvh - 48px);
              overflow-y: auto;
              padding-right: 2px;
              scrollbar-width: none;
              -ms-overflow-style: none;
            }

            [data-scope="${sceneId}"] .hierarchy-stage__modalDetails::-webkit-scrollbar {
              width: 0;
              height: 0;
              display: none;
            }

            [data-scope="${sceneId}"] .hierarchy-stage__modalTitle {
              font-size: 20px;
              line-height: 1.16;
            }

            [data-scope="${sceneId}"] .hierarchy-stage__modalSummary,
            [data-scope="${sceneId}"] .hierarchy-stage__modalPrompt,
            [data-scope="${sceneId}"] .hierarchy-stage__modalChecks li {
              font-size: 12px;
              line-height: 1.45;
            }
          }
        `;
        document.head.appendChild(style);
      }

      function renderStage() {
        const task = getActiveTask();
        const model = getActiveModel();
        container.setAttribute("data-scope", sceneId);
        container.style.setProperty("--task-accent", task.accent);
        container.style.setProperty("--task-accent-soft", `${task.accent}26`);
        container.innerHTML = `
          <div class="hierarchy-stage">
            <div class="hierarchy-stage__frame">
              <div class="hierarchy-stage__grid"></div>
              <div class="hierarchy-stage__viewerWrap">
                <model-viewer
                  class="hierarchy-stage__viewer"
                  data-role="model-viewer"
                  src="${escapeHtml(resolveModelSource(model.src))}"
                  camera-controls
                  interaction-prompt="none"
                  shadow-intensity="${escapeHtml(model.shadowIntensity)}"
                  exposure="${escapeHtml(model.exposure)}"
                  environment-image="neutral"
                  loading="eager"
                  field-of-view="${escapeHtml(model.fieldOfView)}"
                  min-field-of-view="12deg"
                  max-field-of-view="82deg"
                  camera-orbit="${escapeHtml(model.cameraOrbit)}"
                  alt="${escapeHtml(model.alt)}">
                  <div class="hierarchy-stage__poster" slot="poster">模型加载中...</div>
                </model-viewer>
              </div>
              <div class="hierarchy-stage__hud">
                <div class="hierarchy-stage__taskBadge">
                  <div class="hierarchy-stage__taskLabel">当前观察任务</div>
                  <div class="hierarchy-stage__taskValue" data-role="task-label">${escapeHtml(task.title)}</div>
                </div>
              </div>
              <div class="hierarchy-stage__bottom">
                <div class="hierarchy-stage__legend" aria-label="结构层次图例">
                  <div class="hierarchy-stage__legendItem"><span class="hierarchy-stage__dot" style="--dot-color:#38bdf8"></span>结构层次</div>
                  <div class="hierarchy-stage__legendItem"><span class="hierarchy-stage__dot" style="--dot-color:#ef4444"></span>肌肉系统</div>
                  <div class="hierarchy-stage__legendItem"><span class="hierarchy-stage__dot" style="--dot-color:#facc15"></span>骨骼系统</div>
                </div>
                <div class="hierarchy-stage__controls">
                  <button class="hierarchy-stage__controlBtn${state.autoRotate ? " is-active" : ""}" type="button" data-action="toggle-auto-rotate">旋转</button>
                  <button class="hierarchy-stage__controlBtn" type="button" data-action="reset-camera">复位</button>
                </div>
              </div>
              <div class="hierarchy-stage__modalOverlay${state.showModal ? " is-open" : ""}" data-role="task-modal">
                <div class="hierarchy-stage__modalContent">
                  <button class="hierarchy-stage__modalClose" type="button" data-action="close-modal" aria-label="关闭弹窗">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                  <div class="hierarchy-stage__modalGrid">
                    <div class="hierarchy-stage__modalImageShell">
                      <img class="hierarchy-stage__modalImage" data-role="modal-image" src="${escapeHtml(resolveAssetUrl(task.imageRelativeUrl))}" alt="${escapeHtml(task.title)}教学配图">
                    </div>
                    <div class="hierarchy-stage__modalDetails">
                      <div>
                        <span class="hierarchy-stage__modalEyebrow">生物体结构层次 · 教学观察</span>
                        <h2 class="hierarchy-stage__modalTitle" data-role="modal-title">${escapeHtml(task.title)}</h2>
                      </div>
                      <p class="hierarchy-stage__modalSummary" data-role="modal-summary">${escapeHtml(task.summary)}</p>
                      <div>
                        <h3 class="hierarchy-stage__modalSectionTitle">学习提示</h3>
                        <p class="hierarchy-stage__modalPrompt" data-role="modal-prompt">${escapeHtml(task.prompt)}</p>
                      </div>
                      <div>
                        <h3 class="hierarchy-stage__modalSectionTitle">知识要点</h3>
                        <ul class="hierarchy-stage__modalChecks" data-role="modal-checks">${renderChecks(task)}</ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
        applyModelAndCamera();
      }

      function renderModelButtons() {
        return Object.keys(MODELS).map(key => {
          const model = MODELS[key];
          return `
            <button
              class="p-model${key === state.activeModel ? " is-active" : ""}"
              type="button"
              data-action="select-model"
              data-value="${escapeHtml(key)}"
              style="--item-accent:${escapeHtml(model.accent)}">
              <span class="p-optionMain">
                <span class="p-optionDot"></span>
                <span class="p-optionText">
                  <strong>${escapeHtml(model.title)}</strong>
                  <span>${escapeHtml(model.label)}</span>
                </span>
              </span>
            </button>
          `;
        }).join("");
      }

      function renderTaskButtons() {
        return TASKS.map(task => `
          <button
            class="p-task${task.id === state.activeTask ? " is-active" : ""}"
              type="button"
              data-action="select-task"
              data-value="${escapeHtml(task.id)}"
              style="--item-accent:${escapeHtml(task.accent)}">
            <span class="p-optionMain">
              <span class="p-optionDot"></span>
              <span class="p-optionText">
                <strong>${escapeHtml(task.title)}</strong>
                <span>${escapeHtml(task.label)}</span>
              </span>
            </span>
            <span class="p-taskAction">教学观察</span>
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
        return QUIZ.options.map(option => `
          <button class="p-quizOption${state.quizAnswer === option.id ? " is-selected" : ""}" type="button" data-action="answer-quiz" data-value="${escapeHtml(option.id)}">
            ${escapeHtml(option.text)}
          </button>
        `).join("");
      }

      function renderPanel() {
        if (!panelHost) return;
        const previousPanel = panelHost.querySelector(`.panel-${sceneId}`);
        const previousScrollTop = previousPanel ? previousPanel.scrollTop : 0;
        const task = getActiveTask();
        const model = getActiveModel();
        const picked = QUIZ.options.find(option => option.id === state.quizAnswer);
        const feedbackClass = picked ? picked.correct ? " is-correct" : " is-wrong" : "";
        panelHost.innerHTML = `
          <div class="panel-${sceneId}" style="--task-accent:${escapeHtml(task.accent)}; --task-accent-soft:${escapeHtml(task.accent)}26">
            <div class="p-card">
              <span class="p-eyebrow">3D 模型观察</span>
              <div class="p-modelGrid">${renderModelButtons()}</div>
              <div class="p-actionRow">
                <button class="p-action${state.autoRotate ? " is-active" : ""}" type="button" data-action="toggle-auto-rotate">自动旋转</button>
                <button class="p-action" type="button" data-action="reset-camera">复位视角</button>
              </div>
            </div>

            <div class="p-card">
              <span class="p-eyebrow">教学卡片</span>
              <h2 class="p-title">${escapeHtml(task.title)}</h2>
              <div class="p-metadata">
                <div class="p-metaPill">
                  <span class="p-metaLabel">当前模型</span>
                  <span class="p-metaValue">${escapeHtml(model.title)}</span>
                </div>
                <div class="p-metaPill">
                  <span class="p-metaLabel">观察重点</span>
                  <span class="p-metaValue">${escapeHtml(task.label)}</span>
                </div>
                <div class="p-metaPill">
                  <span class="p-metaLabel">层次主题</span>
                  <span class="p-metaValue">细胞到个体</span>
                </div>
              </div>
              <p class="p-desc">${escapeHtml(task.prompt)}</p>
              <div class="p-factBox">
                <span class="p-factIcon">●</span>
                <span class="p-factText">${escapeHtml(task.summary)}</span>
              </div>
            </div>

            <div class="p-card">
              <span class="p-eyebrow">观察任务</span>
              <p class="p-subdesc">点击任务会打开教学图片弹窗，并同步切换当前观察重点。</p>
              <div class="p-taskList">${renderTaskButtons()}</div>
            </div>

            <div class="p-card p-card--compact">
              <span class="p-eyebrow">层次流程</span>
              <div class="p-flow">${renderFlow()}</div>
              <div class="p-sectionDivider"></div>
              <div class="p-quiz">
                <span class="p-eyebrow">快速判断</span>
                <div class="p-quizQuestion">${escapeHtml(QUIZ.question)}</div>
                <div class="p-quizOptions">${renderQuizOptions()}</div>
                <div class="p-feedback${feedbackClass}">${escapeHtml(state.quizFeedback || "选择一个答案后，这里会给出即时反馈。")}</div>
              </div>
            </div>
          </div>
        `;
        const nextPanel = panelHost.querySelector(`.panel-${sceneId}`);
        if (nextPanel && state.preservePanelScroll && previousScrollTop > 0) {
          nextPanel.scrollTop = previousScrollTop;
        }
        state.preservePanelScroll = true;
      }

      function updateModal() {
        const task = getActiveTask();
        container.style.setProperty("--task-accent", task.accent);
        container.style.setProperty("--task-accent-soft", `${task.accent}26`);
        const label = container.querySelector('[data-role="task-label"]');
        if (label) label.textContent = task.title;

        const modalOverlay = container.querySelector('[data-role="task-modal"]');
        if (!modalOverlay) return;
        const modalImage = modalOverlay.querySelector('[data-role="modal-image"]');
        const modalTitle = modalOverlay.querySelector('[data-role="modal-title"]');
        const modalSummary = modalOverlay.querySelector('[data-role="modal-summary"]');
        const modalPrompt = modalOverlay.querySelector('[data-role="modal-prompt"]');
        const modalChecks = modalOverlay.querySelector('[data-role="modal-checks"]');
        const modalContent = modalOverlay.querySelector('.hierarchy-stage__modalContent');
        if (modalImage) {
          modalImage.src = resolveAssetUrl(task.imageRelativeUrl);
          modalImage.alt = `${task.title}教学配图`;
        }
        if (modalTitle) modalTitle.textContent = task.title;
        if (modalSummary) modalSummary.textContent = task.summary;
        if (modalPrompt) modalPrompt.textContent = task.prompt;
        if (modalChecks) modalChecks.innerHTML = renderChecks(task);
        if (modalContent) {
          modalContent.style.borderColor = `${task.accent}3d`;
          modalContent.style.boxShadow = `0 30px 70px rgba(0, 0, 0, 0.75), inset 0 0 45px ${task.accent}14`;
        }
        modalOverlay.classList.toggle("is-open", state.showModal);
      }

      function applyModelAndCamera() {
        const viewer = findViewer();
        if (!viewer) return;
        const model = getActiveModel();
        setViewerModelSource(viewer, model.src);
        viewer.setAttribute("camera-orbit", model.cameraOrbit);
        viewer.setAttribute("field-of-view", model.fieldOfView);
        viewer.setAttribute("shadow-intensity", model.shadowIntensity);
        viewer.setAttribute("exposure", model.exposure);
        viewer.setAttribute("alt", model.alt);
        if (state.autoRotate) {
          viewer.setAttribute("auto-rotate", "");
          viewer.setAttribute("auto-rotate-delay", "0");
          viewer.setAttribute("rotation-per-second", isMobileModelTarget ? "10deg" : "20deg");
        } else {
          viewer.removeAttribute("auto-rotate");
        }
        viewer.removeAttribute("animation-name");
        viewer.removeAttribute("autoplay");
        if (typeof viewer.jumpCameraToGoal === "function") {
          try {
            viewer.jumpCameraToGoal();
          } catch (error) {
            // The model may still be loading; attributes above remain applied.
          }
        }
      }

      function closeModal() {
        state.showModal = false;
        updateModal();
        renderPanel();
      }

      function handleClick(event) {
        const target = event.target.closest("[data-action]");
        if (!target) return;
        const action = target.getAttribute("data-action");
        const value = target.getAttribute("data-value") || "";

        if (action === "select-model") {
          if (!MODELS[value]) return;
          state.activeModel = value;
          state.preservePanelScroll = false;
          applyModelAndCamera();
          renderPanel();
          return;
        }

        if (action === "select-task") {
          if (!TASKS.some(task => task.id === value)) return;
          state.activeTask = value;
          state.quizFeedback = "";
          state.showModal = true;
          updateModal();
          renderPanel();
          return;
        }

        if (action === "toggle-auto-rotate") {
          state.autoRotate = !state.autoRotate;
          applyModelAndCamera();
          renderPanel();
          return;
        }

        if (action === "reset-camera") {
          state.showModal = false;
          applyModelAndCamera();
          updateModal();
          renderPanel();
          return;
        }

        if (action === "close-modal") {
          event.preventDefault();
          event.stopPropagation();
          closeModal();
          return;
        }

        if (action === "answer-quiz") {
          const picked = QUIZ.options.find(option => option.id === value);
          if (!picked) return;
          state.quizAnswer = value;
          state.quizFeedback = picked.correct
            ? "判断正确。胃由多种组织构成，并能完成特定功能，所以属于器官层次。"
            : "再想一层：组织是细胞群，系统由多个器官组成；胃本身是由多种组织构成的器官。";
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
        updateModal();
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
