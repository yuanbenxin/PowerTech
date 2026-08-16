window.BIO_VISUAL_SCENES = window.BIO_VISUAL_SCENES || {};

window.BIO_VISUAL_SCENES["s_b1_m04"] = (function () {
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

  const MODES = [
    {
      id: "simple",
      title: "自由扩散",
      subtitle: "Simple Diffusion",
      accent: "#22c55e",
      detailId: "lipid",
      direction: "顺浓度梯度",
      carrier: "不需要转运蛋白",
      energy: "不消耗 ATP",
      driver: "膜两侧浓度差",
      summary: "小分子和脂溶性强的物质可直接穿过磷脂双分子层，运输方向由浓度差决定。",
      facts: [
        "适合观察氧气、二氧化碳、甘油、乙醇等物质穿膜过程。",
        "运输速率随浓度差增大而升高，不表现出载体饱和。",
        "核心结构是磷脂双分子层形成的选择性半透屏障。"
      ]
    },
    {
      id: "facilitated",
      title: "协助扩散",
      subtitle: "Facilitated Diffusion",
      accent: "#38bdf8",
      detailId: "channel",
      direction: "顺浓度梯度",
      carrier: "通道蛋白 / 载体蛋白",
      energy: "不消耗 ATP",
      driver: "浓度差 + 蛋白选择性",
      summary: "较大分子或带电离子不能直接穿过膜，需要借助通道蛋白或载体蛋白完成被动转运。",
      facts: [
        "通道蛋白形成亲水通道，适合水分子或无机离子快速通过。",
        "载体蛋白需要与底物结合并发生构象变化，因此具有饱和现象。",
        "协助扩散仍然不消耗细胞代谢能量，动力来自浓度梯度。"
      ]
    },
    {
      id: "active",
      title: "主动运输",
      subtitle: "Active Transport",
      accent: "#a855f7",
      detailId: "pump",
      direction: "逆浓度梯度",
      carrier: "载体蛋白 / 离子泵",
      energy: "消耗 ATP",
      driver: "ATP 水解释放能量",
      summary: "细胞利用载体蛋白或离子泵逆浓度梯度运输物质，用于维持细胞内外离子浓度差。",
      facts: [
        "主动运输能把物质从低浓度一侧运向高浓度一侧。",
        "钠钾泵每次循环消耗 ATP，并维持神经和肌肉细胞的膜电位基础。",
        "小肠上皮细胞吸收葡萄糖等过程常与主动运输或次级主动运输相关。"
      ]
    }
  ];

  const DETAILS = [
    {
      id: "lipid",
      title: "磷脂双分子层",
      image: "phospholipid_diagram.png",
      accent: "#22c55e",
      tags: ["膜骨架", "疏水屏障", "流动性"],
      summary: "磷脂分子亲水头朝向膜内外水环境，疏水尾相对排列，形成细胞膜选择性通过的基本屏障。",
      points: [
        "允许极小分子和脂溶性小分子直接穿过。",
        "强烈阻挡大多数水溶性强或带电荷的粒子。",
        "膜的流动性支持物质运输、信息传递和膜泡活动。"
      ]
    },
    {
      id: "channel",
      title: "通道蛋白",
      image: "channel_diagram.png",
      accent: "#38bdf8",
      tags: ["亲水通道", "高速转运", "选择性"],
      summary: "通道蛋白贯穿磷脂双分子层，在膜内形成亲水通道，允许特定粒子顺浓度梯度快速通过。",
      points: [
        "常见对象包括水分子和各种无机离子。",
        "转运速度快，不需要与底物发生强结合。",
        "不消耗 ATP，属于协助扩散。"
      ]
    },
    {
      id: "carrier",
      title: "载体蛋白",
      image: "carrier_diagram.png",
      accent: "#06b6d4",
      tags: ["底物结合", "构象翻转", "饱和现象"],
      summary: "载体蛋白先与特定底物结合，再通过可逆构象变化把底物释放到膜另一侧。",
      points: [
        "典型例子包括葡萄糖转运蛋白 GLUT。",
        "每次转运需要结合、翻转和释放，速度慢于开放通道。",
        "当载体数量被占满时，转运速率达到最大值。"
      ]
    },
    {
      id: "pump",
      title: "主动运输泵",
      image: "pump_diagram.png",
      accent: "#a855f7",
      tags: ["ATPase", "逆浓度", "离子梯度"],
      summary: "主动运输泵利用 ATP 水解释放的能量发生构象变化，将物质逆浓度梯度泵送到膜另一侧。",
      points: [
        "钠钾泵每次循环把 3 个 Na+ 泵出细胞，同时把 2 个 K+ 泵入细胞。",
        "离子梯度是神经兴奋、肌肉收缩和渗透压调节的重要基础。",
        "泵建立的梯度还可驱动次级主动运输。"
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

  const TASKS = [
    {
      id: "gradient",
      title: "判断流向",
      label: "浓度梯度",
      prompt: "调高膜外浓度，观察粒子是否整体从膜外向膜内移动，再把膜内浓度调高做反向比较。",
      checks: ["自由扩散与协助扩散都顺浓度梯度", "主动运输可以逆浓度梯度", "浓度差越明显，粒子运动趋势越清楚"]
    },
    {
      id: "protein",
      title: "辨认载体",
      label: "蛋白参与",
      prompt: "在协助扩散下观察通道蛋白与载体蛋白的参与方式，比较它们与磷脂双分子层直接穿过的差异。",
      checks: ["通道蛋白形成亲水通道", "载体蛋白发生构象变化", "自由扩散不需要转运蛋白"]
    },
    {
      id: "energy",
      title: "追踪 ATP",
      label: "能量消耗",
      prompt: "切换到主动运输，观察离子泵把粒子逆浓度梯度泵送时，机制说明中能量项的变化。",
      checks: ["主动运输需要 ATP", "钠钾泵维持离子梯度", "逆浓度转运不能只靠简单扩散完成"]
    }
  ];

  const QUIZ = {
    question: "哪一种运输方式需要 ATP，并且可以逆浓度梯度运输物质？",
    options: [
      { id: "simple", text: "自由扩散", correct: false },
      { id: "facilitated", text: "协助扩散", correct: false },
      { id: "active", text: "主动运输", correct: true }
    ]
  };

  const LABEL_ANCHORS = [
    { id: "lipid", label: "磷脂双分子层", accent: "#22c55e", position: [0, 0.08, 0.7], labelOffset: [-84, -42] },
    { id: "small", label: "O2 / CO2 / 甘油", accent: "#60a5fa", position: [-10.5, 2.35, 0.7], labelOffset: [-44, -28] },
    { id: "water", label: "H2O 水分子", accent: "#67e8f9", position: [-6, 2.05, 0.9], labelOffset: [-54, -24] },
    { id: "channel", label: "通道蛋白", accent: "#38bdf8", position: [-6, 0.12, 1.25], labelOffset: [-70, 36] },
    { id: "carrier", label: "载体蛋白", accent: "#06b6d4", position: [0, 0.08, 1.25], labelOffset: [78, 46] },
    { id: "pump", label: "主动运输泵", accent: "#a855f7", position: [6, 0.08, 1.25], labelOffset: [74, 38] },
    { id: "atp", label: "ATP 能量分子", accent: "#f59e0b", position: [8.5, -3.05, 0.9], labelOffset: [58, -26] },
    { id: "adp", label: "ADP + Pi", accent: "#fbbf24", position: [6.45, -1, 1], labelOffset: [58, -28] },
    { id: "sodium", label: "Na+ 钠离子", accent: "#f472b6", position: [5.65, -0.85, 1.1], labelOffset: [-66, 34] },
    { id: "potassium", label: "K+ 钾离子", accent: "#22d3ee", position: [6.35, 1.25, 1.1], labelOffset: [62, -30] }
  ];
  const LABEL_ANCHOR_MAP = LABEL_ANCHORS.reduce((map, item) => {
    map[item.id] = item;
    return map;
  }, {});

  return {
    mount: function mount(container, context) {
      const sceneId = "membrane-transport-" + Math.random().toString(36).slice(2, 9);
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
      let labelFrame = 0;

      const state = {
        mode: "simple",
        detail: "lipid",
        detailModalOpen: false,
        activeLabelId: "",
        extDensity: 70,
        intDensity: 15,
        speed: 1,
        playing: true,
        view: "view-3d",
        selectedTask: "gradient",
        quizAnswer: "",
        quizFeedback: ""
      };

      function resolveAssetUrl(relativeUrl) {
        const rawUrl = `${assetBase}${relativeUrl}`;
        return typeof runtimeVersioner === "function" ? runtimeVersioner(rawUrl) : rawUrl;
      }

      function getMode(id) {
        return MODES.find(item => item.id === id) || MODES[0];
      }

      function getDetail(id) {
        return DETAILS.find(item => item.id === id) || DETAILS[0];
      }

      function getTask(id) {
        return TASKS.find(item => item.id === id) || TASKS[0];
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
          [data-scope="${sceneId}"] .transport-stage {
            position: relative;
            width: 100%;
            height: 100%;
            overflow: hidden;
            border-radius: inherit;
            background:
              radial-gradient(circle at 48% 42%, rgba(56, 189, 248, 0.12), transparent 34%),
              linear-gradient(135deg, #04111d 0%, #07111f 45%, #050816 100%);
          }
          [data-scope="${sceneId}"] .transport-frameWrap {
            position: absolute;
            inset: 0;
            overflow: hidden;
            border-radius: inherit;
          }
          [data-scope="${sceneId}"] .transport-frame {
            display: block;
            width: 100%;
            height: 100%;
            border: 0;
            background: #05050a;
          }
          [data-scope="${sceneId}"] .transport-vignette {
            pointer-events: none;
            position: absolute;
            inset: 0;
            box-shadow: inset 0 0 90px rgba(0, 0, 0, 0.48), inset 0 0 0 1px rgba(255, 255, 255, 0.06);
            border-radius: inherit;
          }
          [data-scope="${sceneId}"] .transport-labelToggle {
            appearance: none;
            position: absolute;
            top: 18px;
            right: 18px;
            z-index: 9;
            display: none;
            min-width: 86px;
            min-height: 34px;
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 8px;
            background: rgba(5, 8, 22, 0.72);
            color: rgba(248, 250, 252, 0.9);
            cursor: pointer;
            font-size: 12px;
            font-weight: 900;
            line-height: 1;
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            box-shadow: 0 10px 24px rgba(0, 0, 0, 0.24);
          }
          [data-scope="${sceneId}"].has-active-label .transport-labelToggle {
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          [data-scope="${sceneId}"] .transport-labelToggle:hover {
            border-color: rgba(52, 211, 153, 0.42);
            background: rgba(15, 23, 42, 0.86);
          }
          [data-scope="${sceneId}"] .transport-emptyPanel {
            position: absolute;
            inset: 0;
            display: grid;
            place-items: center;
            padding: 24px;
            text-align: center;
            color: rgba(226, 232, 240, 0.72);
            background: rgba(2, 6, 23, 0.8);
          }
          [data-scope="${sceneId}"] .transport-labelLayer {
            pointer-events: none;
            position: absolute;
            inset: 0;
            z-index: 7;
            font-family: Inter, "Microsoft YaHei", "PingFang SC", Arial, sans-serif;
          }
          [data-scope="${sceneId}"] .transport-label {
            position: absolute;
            left: 0;
            top: 0;
            max-width: 150px;
            display: inline-grid;
            grid-template-columns: 8px minmax(0, 1fr);
            align-items: center;
            gap: 7px;
            transform: translate(-50%, -50%);
            filter: drop-shadow(0 10px 18px rgba(0, 0, 0, 0.46));
            opacity: 0;
            transition: opacity 0.12s ease;
          }
          [data-scope="${sceneId}"] .transport-label.is-visible { opacity: 1; }
          [data-scope="${sceneId}"] .transport-label::before {
            content: "";
            width: 8px;
            height: 8px;
            border-radius: 999px;
            background: var(--label-accent, #22c55e);
            box-shadow: 0 0 0 4px color-mix(in srgb, var(--label-accent, #22c55e) 18%, transparent), 0 0 18px var(--label-accent, #22c55e);
          }
          [data-scope="${sceneId}"] .transport-label span {
            min-width: 0;
            border: 1px solid color-mix(in srgb, var(--label-accent, #22c55e) 42%, rgba(255, 255, 255, 0.08));
            border-radius: 8px;
            background: rgba(5, 8, 22, 0.7);
            padding: 5px 7px;
            color: rgba(248, 250, 252, 0.92);
            font-size: 11px;
            font-weight: 900;
            line-height: 1.25;
            overflow-wrap: anywhere;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
          }
          [data-scope="${sceneId}"] .transport-detailModal {
            position: absolute;
            inset: 22px;
            z-index: 22;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 18px;
            background: rgba(2, 6, 23, 0.5);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
          }
          [data-scope="${sceneId}"] .transport-detailModal.is-open {
            display: flex;
          }
          [data-scope="${sceneId}"] .transport-detailDialog {
            position: relative;
            width: min(880px, 100%);
            max-height: min(620px, 100%);
            display: grid;
            grid-template-columns: minmax(250px, 0.92fr) minmax(260px, 1fr);
            gap: 20px;
            overflow: hidden;
            border: 1px solid color-mix(in srgb, var(--mode-accent, #22c55e) 38%, rgba(255, 255, 255, 0.12));
            border-radius: 14px;
            background:
              radial-gradient(circle at 12% 14%, color-mix(in srgb, var(--mode-accent, #22c55e) 16%, transparent), transparent 36%),
              rgba(5, 8, 22, 0.94);
            box-shadow: 0 28px 90px rgba(0, 0, 0, 0.58), inset 0 1px 0 rgba(255, 255, 255, 0.06);
            padding: 22px;
          }
          [data-scope="${sceneId}"] .transport-detailClose {
            appearance: none;
            position: absolute;
            top: 12px;
            right: 12px;
            z-index: 2;
            width: 34px;
            height: 34px;
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 8px;
            background: rgba(15, 23, 42, 0.8);
            color: rgba(248, 250, 252, 0.84);
            cursor: pointer;
            font-size: 24px;
            line-height: 1;
          }
          [data-scope="${sceneId}"] .transport-detailClose:hover {
            border-color: rgba(255, 255, 255, 0.22);
            background: rgba(30, 41, 59, 0.92);
            color: #ffffff;
          }
          [data-scope="${sceneId}"] .transport-detailFigure {
            min-width: 0;
            min-height: 0;
            border: 1px solid rgba(255, 255, 255, 0.09);
            border-radius: 10px;
            overflow: hidden;
            background: rgba(0, 0, 0, 0.26);
          }
          [data-scope="${sceneId}"] .transport-detailFigure img {
            display: block;
            width: 100%;
            height: 100%;
            min-height: 300px;
            object-fit: cover;
          }
          [data-scope="${sceneId}"] .transport-detailBody {
            min-width: 0;
            min-height: 0;
            display: flex;
            flex-direction: column;
            gap: 12px;
            overflow: hidden auto;
            padding-right: 4px;
            scrollbar-width: none;
          }
          [data-scope="${sceneId}"] .transport-detailBody::-webkit-scrollbar {
            display: none;
          }
          [data-scope="${sceneId}"] .transport-detailBody h2 {
            margin: 0;
            padding-right: 34px;
            color: #f8fafc;
            font-size: 22px;
            line-height: 1.3;
            font-weight: 950;
          }
          [data-scope="${sceneId}"] .transport-detailBody p {
            margin: 0;
            color: rgba(226, 232, 240, 0.82);
            font-size: 14px;
            line-height: 1.75;
          }
          [data-scope="${sceneId}"] .transport-detailTags {
            display: flex;
            flex-wrap: wrap;
            gap: 7px;
          }
          [data-scope="${sceneId}"] .transport-detailTags span {
            display: inline-flex;
            align-items: center;
            min-height: 24px;
            border-radius: 999px;
            background: color-mix(in srgb, var(--mode-accent, #22c55e) 17%, transparent);
            color: rgba(248, 250, 252, 0.92);
            padding: 4px 8px;
            font-size: 11px;
            font-weight: 900;
          }
          [data-scope="${sceneId}"] .transport-detailPoints {
            display: grid;
            gap: 10px;
            list-style: none;
            margin: 0;
            padding: 0;
          }
          [data-scope="${sceneId}"] .transport-detailPoints li {
            position: relative;
            padding-left: 16px;
            color: rgba(226, 232, 240, 0.82);
            font-size: 14px;
            line-height: 1.68;
          }
          [data-scope="${sceneId}"] .transport-detailPoints li::before {
            content: "";
            position: absolute;
            left: 0;
            top: 0.78em;
            width: 7px;
            height: 7px;
            border-radius: 999px;
            background: var(--mode-accent, #22c55e);
            box-shadow: 0 0 12px var(--mode-accent, #22c55e);
          }
          .panel-${sceneId} {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            gap: 14px;
            overflow: hidden auto;
            padding: 2px 2px 18px;
            color: #e2e8f0;
            scrollbar-width: none;
            touch-action: pan-y;
            --mode-accent: #22c55e;
            --mode-accent-soft: rgba(34, 197, 94, 0.14);
          }
          .panel-${sceneId}::-webkit-scrollbar { width: 0; height: 0; display: none; }
          .panel-${sceneId} * { box-sizing: border-box; }
          .panel-${sceneId} .p-card {
            display: grid;
            gap: 12px;
            width: 100%;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.035);
            padding: 15px;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.035);
          }
          .panel-${sceneId} .p-eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            color: rgba(226, 232, 240, 0.56);
            font-size: 11px;
            font-weight: 900;
            letter-spacing: 0.12em;
          }
          .panel-${sceneId} .p-eyebrow::before {
            content: "";
            width: 7px;
            height: 7px;
            border-radius: 999px;
            background: var(--mode-accent);
            box-shadow: 0 0 12px var(--mode-accent);
          }
          .panel-${sceneId} .p-title {
            margin: 0;
            color: #f8fafc;
            font-size: 18px;
            font-weight: 900;
            line-height: 1.35;
          }
          .panel-${sceneId} .p-desc,
          .panel-${sceneId} .p-checkList li,
          .panel-${sceneId} .p-taskPrompt,
          .panel-${sceneId} .p-quizQuestion,
          .panel-${sceneId} .p-feedback {
            margin: 0;
            color: rgba(226, 232, 240, 0.78);
            font-size: 13px;
            line-height: 1.72;
          }
          .panel-${sceneId} .p-modeGrid,
          .panel-${sceneId} .p-viewGrid,
          .panel-${sceneId} .p-detailGrid,
          .panel-${sceneId} .p-taskGrid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 8px;
          }
          .panel-${sceneId} .p-detailGrid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .panel-${sceneId} .p-taskGrid { grid-template-columns: 1fr; }
          .panel-${sceneId} .p-mode,
          .panel-${sceneId} .p-view,
          .panel-${sceneId} .p-detail,
          .panel-${sceneId} .p-task,
          .panel-${sceneId} .p-action,
          .panel-${sceneId} .p-quizOption {
            appearance: none;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.045);
            color: rgba(226, 232, 240, 0.88);
            cursor: pointer;
            transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease, color 0.18s ease;
          }
          .panel-${sceneId} .p-mode:hover,
          .panel-${sceneId} .p-view:hover,
          .panel-${sceneId} .p-detail:hover,
          .panel-${sceneId} .p-task:hover,
          .panel-${sceneId} .p-action:hover,
          .panel-${sceneId} .p-quizOption:hover {
            transform: translateY(-1px);
            border-color: rgba(255, 255, 255, 0.16);
            background: rgba(255, 255, 255, 0.07);
          }
          .panel-${sceneId} .p-mode {
            min-height: 62px;
            padding: 10px 9px;
            text-align: left;
            display: grid;
            gap: 4px;
          }
          .panel-${sceneId} .p-mode strong,
          .panel-${sceneId} .p-task strong,
          .panel-${sceneId} .p-detail strong {
            color: #f8fafc;
            font-size: 13px;
            line-height: 1.25;
            font-weight: 900;
          }
          .panel-${sceneId} .p-mode span,
          .panel-${sceneId} .p-task span,
          .panel-${sceneId} .p-detail span {
            color: rgba(226, 232, 240, 0.58);
            font-size: 11px;
            line-height: 1.3;
            overflow-wrap: anywhere;
          }
          .panel-${sceneId} .p-mode.is-active,
          .panel-${sceneId} .p-view.is-active,
          .panel-${sceneId} .p-detail.is-active,
          .panel-${sceneId} .p-task.is-active,
          .panel-${sceneId} .p-action.is-active,
          .panel-${sceneId} .p-quizOption.is-selected {
            border-color: color-mix(in srgb, var(--mode-accent) 58%, transparent);
            background: var(--mode-accent-soft);
            box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.035), 0 0 22px color-mix(in srgb, var(--mode-accent) 18%, transparent);
            color: #f8fafc;
          }
          .panel-${sceneId} .p-paramGrid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }
          .panel-${sceneId} .p-sliderBlock {
            display: grid;
            gap: 8px;
            min-width: 0;
          }
          .panel-${sceneId} .p-sliderLabel {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            color: rgba(226, 232, 240, 0.7);
            font-size: 12px;
            font-weight: 800;
            line-height: 1.35;
          }
          .panel-${sceneId} .p-sliderLabel span:first-child {
            min-width: 0;
            overflow-wrap: anywhere;
          }
          .panel-${sceneId} .p-sliderValue {
            flex: 0 0 auto;
            min-width: 42px;
            border-radius: 8px;
            padding: 3px 7px;
            background: rgba(15, 23, 42, 0.8);
            color: #f8fafc;
            text-align: center;
            font-size: 12px;
          }
          .panel-${sceneId} input[type="range"] {
            width: 100%;
            min-width: 0;
            height: 16px;
            accent-color: var(--mode-accent);
          }
          .panel-${sceneId} .p-actionRow {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }
          .panel-${sceneId} .p-action,
          .panel-${sceneId} .p-view,
          .panel-${sceneId} .p-quizOption {
            min-height: 38px;
            padding: 9px 10px;
            font-size: 12px;
            font-weight: 900;
            line-height: 1.25;
          }
          .panel-${sceneId} .p-viewGrid { grid-template-columns: repeat(5, minmax(0, 1fr)); }
          .panel-${sceneId} .p-meta {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }
          .panel-${sceneId} .p-metaPill {
            min-width: 0;
            border: 1px solid rgba(255, 255, 255, 0.07);
            border-radius: 8px;
            background: rgba(15, 23, 42, 0.56);
            padding: 8px 9px;
          }
          .panel-${sceneId} .p-metaPill span {
            display: block;
            color: rgba(226, 232, 240, 0.48);
            font-size: 10px;
            font-weight: 900;
            letter-spacing: 0.08em;
            margin-bottom: 4px;
          }
          .panel-${sceneId} .p-metaPill strong {
            display: block;
            color: #f8fafc;
            font-size: 12px;
            line-height: 1.45;
            font-weight: 900;
            overflow-wrap: anywhere;
          }
          .panel-${sceneId} .p-checkList {
            display: grid;
            gap: 8px;
            list-style: none;
            margin: 0;
            padding: 0;
          }
          .panel-${sceneId} .p-checkList li {
            position: relative;
            padding-left: 15px;
          }
          .panel-${sceneId} .p-checkList li::before {
            content: "";
            position: absolute;
            left: 0;
            top: 0.75em;
            width: 6px;
            height: 6px;
            border-radius: 999px;
            background: var(--mode-accent);
            box-shadow: 0 0 10px var(--mode-accent);
          }
          .panel-${sceneId} .p-detail {
            min-height: 46px;
            padding: 9px 10px;
            text-align: left;
            display: grid;
            gap: 4px;
          }
          .panel-${sceneId} .p-task {
            min-height: 52px;
            padding: 10px 11px;
            text-align: left;
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 6px 8px;
            align-items: center;
          }
          .panel-${sceneId} .p-task span {
            justify-self: end;
            border-radius: 999px;
            padding: 3px 7px;
            background: rgba(255, 255, 255, 0.06);
            white-space: nowrap;
          }
          .panel-${sceneId} .p-taskPrompt {
            border-left: 2px solid var(--mode-accent);
            padding-left: 10px;
          }
          .panel-${sceneId} .p-flow {
            display: grid;
            gap: 8px;
          }
          .panel-${sceneId} .p-flowLine {
            display: grid;
            grid-template-columns: 68px minmax(0, 1fr);
            gap: 8px;
            align-items: start;
          }
          .panel-${sceneId} .p-flowLine span {
            color: var(--mode-accent);
            font-size: 11px;
            font-weight: 900;
            line-height: 1.5;
          }
          .panel-${sceneId} .p-flowLine strong {
            color: rgba(226, 232, 240, 0.82);
            font-size: 12px;
            line-height: 1.55;
            font-weight: 700;
          }
          .panel-${sceneId} .p-quiz {
            display: grid;
            gap: 8px;
          }
          .panel-${sceneId} .p-feedback {
            min-height: 34px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(15, 23, 42, 0.58);
            padding: 8px 10px;
          }
          .panel-${sceneId} .p-feedback.is-correct {
            border-color: rgba(34, 197, 94, 0.34);
            color: #bbf7d0;
            background: rgba(34, 197, 94, 0.1);
          }
          .panel-${sceneId} .p-feedback.is-wrong {
            border-color: rgba(251, 191, 36, 0.32);
            color: #fde68a;
            background: rgba(251, 191, 36, 0.1);
          }
          @media (max-width: 900px) {
            .panel-${sceneId} .p-modeGrid,
            .panel-${sceneId} .p-viewGrid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            .panel-${sceneId} .p-paramGrid,
            .panel-${sceneId} .p-meta {
              grid-template-columns: 1fr;
            }
          }
          @media (max-width: 720px), (max-height: 520px) {
            [data-scope="${sceneId}"] .transport-labelToggle,
            [data-scope="${sceneId}"] .transport-labelLayer {
              display: none;
            }
          }
          @media (max-width: 720px) {
            [data-scope="${sceneId}"] .transport-detailModal {
              inset: 10px;
              padding: 10px;
            }
            [data-scope="${sceneId}"] .transport-detailDialog {
              grid-template-columns: 1fr;
              gap: 12px;
              padding: 16px;
              max-height: 100%;
            }
            [data-scope="${sceneId}"] .transport-detailFigure img {
              min-height: 160px;
              max-height: 220px;
            }
            [data-scope="${sceneId}"] .transport-detailBody h2 {
              font-size: 18px;
            }
            [data-scope="${sceneId}"] .transport-detailBody p,
            [data-scope="${sceneId}"] .transport-detailPoints li {
              font-size: 13px;
            }
          }
        `;
        document.head.appendChild(style);
      }

      function renderStage() {
        const sourceUrl = resolveAssetUrl("assets/source/index.html");
        container.innerHTML = `
          <div class="transport-stage">
            <div class="transport-frameWrap">
              <iframe class="transport-frame" title="物质跨膜运输源课件模拟画面" src="${escapeHtml(sourceUrl)}"></iframe>
            </div>
            <button class="transport-labelToggle" type="button" data-action="clear-label" aria-label="关闭当前标签">关闭标签</button>
            <div class="transport-labelLayer" aria-hidden="true">
              ${LABEL_ANCHORS.map(anchor => `
                <div class="transport-label" data-anchor="${escapeHtml(anchor.id)}" style="--label-accent:${escapeHtml(anchor.accent)}"><span>${escapeHtml(anchor.label)}</span></div>
              `).join("")}
            </div>
            <div class="transport-vignette"></div>
            <div class="transport-detailModal" data-role="detail-modal" aria-hidden="true">
              <div class="transport-detailDialog" role="dialog" aria-modal="true" aria-labelledby="${sceneId}-detail-title">
                <button class="transport-detailClose" type="button" data-action="close-detail-modal" aria-label="关闭结构说明">×</button>
                <div class="transport-detailFigure">
                  <img data-role="stage-detail-image" src="" alt="">
                </div>
                <div class="transport-detailBody">
                  <h2 id="${sceneId}-detail-title" data-role="stage-detail-title"></h2>
                  <div class="transport-detailTags" data-role="stage-detail-tags"></div>
                  <p data-role="stage-detail-summary"></p>
                  <ul class="transport-detailPoints" data-role="stage-detail-points"></ul>
                </div>
              </div>
            </div>
          </div>
        `;
        iframe = container.querySelector("iframe");
        if (iframe) {
          iframe.addEventListener("load", handleFrameLoad);
          startFramePolling();
        }
      }

      function renderPanel() {
        if (!panelHost) return;
        const mode = getMode(state.mode);
        const task = getTask(state.selectedTask);
        const modeButtons = MODES.map(item => `
          <button class="p-mode${item.id === state.mode ? " is-active" : ""}" type="button" data-action="select-mode" data-value="${escapeHtml(item.id)}" style="--item-accent:${escapeHtml(item.accent)}">
            <strong>${escapeHtml(item.title)}</strong>
            <span>${escapeHtml(item.subtitle)}</span>
          </button>
        `).join("");
        const viewButtons = VIEW_CONTROLS.map(item => `
          <button class="p-view${item.id === state.view ? " is-active" : ""}" type="button" data-action="select-view" data-value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</button>
        `).join("");
        const detailButtons = DETAILS.map(item => `
          <button class="p-detail${item.id === state.detail ? " is-active" : ""}" type="button" data-action="select-detail" data-value="${escapeHtml(item.id)}">
            <strong>${escapeHtml(item.title)}</strong>
            <span>${escapeHtml(item.tags.slice(0, 2).join(" / "))}</span>
          </button>
        `).join("");
        const taskButtons = TASKS.map(item => `
          <button class="p-task${item.id === state.selectedTask ? " is-active" : ""}" type="button" data-action="select-task" data-value="${escapeHtml(item.id)}">
            <strong>${escapeHtml(item.title)}</strong>
            <span>${escapeHtml(item.label)}</span>
          </button>
        `).join("");
        const quizOptions = QUIZ.options.map(option => `
          <button class="p-quizOption${state.quizAnswer === option.id ? " is-selected" : ""}" type="button" data-action="answer-quiz" data-value="${escapeHtml(option.id)}">${escapeHtml(option.text)}</button>
        `).join("");

        panelHost.innerHTML = `
          <div class="panel-${sceneId}" style="--mode-accent:${escapeHtml(mode.accent)}; --mode-accent-soft:${escapeHtml(mode.accent)}24">
            <div class="p-card">
              <span class="p-eyebrow">运输类型</span>
              <div class="p-modeGrid">${modeButtons}</div>
            </div>

            <div class="p-card">
              <span class="p-eyebrow">浓度控制</span>
              <div class="p-paramGrid">
                <label class="p-sliderBlock">
                  <span class="p-sliderLabel">
                    <span>细胞外（膜外）浓度</span>
                    <span class="p-sliderValue" data-role="ext-density-val">${state.extDensity}</span>
                  </span>
                  <input type="range" min="10" max="120" step="1" value="${state.extDensity}" data-range="ext-density">
                </label>
                <label class="p-sliderBlock">
                  <span class="p-sliderLabel">
                    <span>细胞内（膜内）浓度</span>
                    <span class="p-sliderValue" data-role="int-density-val">${state.intDensity}</span>
                  </span>
                  <input type="range" min="5" max="100" step="1" value="${state.intDensity}" data-range="int-density">
                </label>
              </div>
            </div>

            <div class="p-card">
              <span class="p-eyebrow">模拟控制</span>
              <label class="p-sliderBlock">
                <span class="p-sliderLabel">
                  <span>流动速率（流动性）</span>
                  <span class="p-sliderValue" data-role="speed-val">${state.speed.toFixed(1)}x</span>
                </span>
                <input type="range" min="0" max="3" step="0.1" value="${state.speed}" data-range="speed">
              </label>
              <div class="p-actionRow">
                <button class="p-action${state.playing ? " is-active" : ""}" type="button" data-action="toggle-play">${state.playing ? "暂停" : "播放"}</button>
                <button class="p-action" type="button" data-action="reset-source">重置</button>
              </div>
              <div class="p-viewGrid">${viewButtons}</div>
            </div>

            <div class="p-card">
              <span class="p-eyebrow">科学原理说明</span>
              <h2 class="p-title" data-role="mode-title">${escapeHtml(mode.title)} <span style="color:rgba(226,232,240,0.42);font-size:12px;font-weight:800;">${escapeHtml(mode.subtitle)}</span></h2>
              <p class="p-desc" data-role="mode-summary">${escapeHtml(mode.summary)}</p>
              <div class="p-meta">
                <div class="p-metaPill"><span>方向</span><strong data-role="mode-direction">${escapeHtml(mode.direction)}</strong></div>
                <div class="p-metaPill"><span>载体</span><strong data-role="mode-carrier">${escapeHtml(mode.carrier)}</strong></div>
                <div class="p-metaPill"><span>能量</span><strong data-role="mode-energy">${escapeHtml(mode.energy)}</strong></div>
                <div class="p-metaPill"><span>动力</span><strong data-role="mode-driver">${escapeHtml(mode.driver)}</strong></div>
              </div>
              <ul class="p-checkList" data-role="mode-facts">${renderList(mode.facts)}</ul>
            </div>

            <div class="p-card">
              <span class="p-eyebrow">3D 结构档案</span>
              <div class="p-detailGrid">${detailButtons}</div>
            </div>

            <div class="p-card">
              <span class="p-eyebrow">观察任务</span>
              <div class="p-taskGrid">${taskButtons}</div>
              <p class="p-taskPrompt" data-role="task-prompt">${escapeHtml(task.prompt)}</p>
              <ul class="p-checkList" data-role="task-checks">${renderList(task.checks)}</ul>
            </div>

            <div class="p-card">
              <span class="p-eyebrow">过程链路</span>
              <div class="p-flow">
                <div class="p-flowLine"><span>选择模式</span><strong>先确定自由扩散、协助扩散或主动运输，再观察源课件中粒子与膜结构的互动。</strong></div>
                <div class="p-flowLine"><span>调浓度</span><strong>改变膜内外浓度，比较顺浓度梯度和逆浓度梯度时粒子流向的差异。</strong></div>
                <div class="p-flowLine"><span>看载体</span><strong>结合通道蛋白、载体蛋白和主动运输泵，判断是否需要蛋白和 ATP。</strong></div>
              </div>
            </div>

            <div class="p-card">
              <span class="p-eyebrow">快速判断</span>
              <div class="p-quiz">
                <div class="p-quizQuestion">${escapeHtml(QUIZ.question)}</div>
                ${quizOptions}
                <div class="p-feedback" data-role="quiz-feedback">${escapeHtml(state.quizFeedback || "选择一个答案后，这里会给出即时反馈。")}</div>
              </div>
            </div>
          </div>
        `;
      }

      function renderList(items) {
        return (items || []).map(item => `<li>${escapeHtml(item)}</li>`).join("");
      }

      function renderTags(items) {
        return (items || []).map(item => `<span class="p-tag">${escapeHtml(item)}</span>`).join("");
      }

      function setActiveLabel(id) {
        const nextId = LABEL_ANCHOR_MAP[id] ? id : "";
        state.activeLabelId = nextId;
        container.classList.toggle("has-active-label", Boolean(nextId));
        container.querySelectorAll(".transport-label").forEach(label => {
          label.classList.toggle("is-selected", label.getAttribute("data-anchor") === nextId);
          if (!nextId || label.getAttribute("data-anchor") !== nextId) {
            label.classList.remove("is-visible");
          }
        });
      }

      function updateStageDetailModal() {
        const modal = container.querySelector('[data-role="detail-modal"]');
        if (!modal) return;
        const mode = getMode(state.mode);
        const detail = getDetail(state.detail);
        const image = modal.querySelector('[data-role="stage-detail-image"]');
        const title = modal.querySelector('[data-role="stage-detail-title"]');
        const tags = modal.querySelector('[data-role="stage-detail-tags"]');
        const summary = modal.querySelector('[data-role="stage-detail-summary"]');
        const points = modal.querySelector('[data-role="stage-detail-points"]');

        modal.classList.toggle("is-open", state.detailModalOpen);
        modal.setAttribute("aria-hidden", state.detailModalOpen ? "false" : "true");
        modal.style.setProperty("--mode-accent", detail.accent || mode.accent);

        if (image) {
          image.src = resolveAssetUrl(`assets/source/${detail.image}`);
          image.alt = `${detail.title}结构示意图`;
        }
        if (title) title.textContent = detail.title;
        if (tags) tags.innerHTML = renderTags(detail.tags);
        if (summary) summary.textContent = detail.summary;
        if (points) points.innerHTML = renderList(detail.points);
      }

      function updateTrackedLabels() {
        if (disposed) return;
        labelFrame = window.requestAnimationFrame(updateTrackedLabels);
        if (!state.activeLabelId || !frameReady) return;

        const frameWindow = getFrameWindow();
        const frameDocument = getFrameDocument();
        const layer = container.querySelector(".transport-labelLayer");
        const frame = container.querySelector(".transport-frame");
        if (!frameWindow || !frameDocument || !layer || !frame) return;

        const three = frameWindow.THREE;
        const camera = frameWindow.camera;
        const frameCanvas = frameDocument.querySelector("#canvas-container canvas");
        if (!three || !camera || !frameCanvas || !camera.matrixWorldInverse || !camera.projectionMatrix) return;

        const frameRect = frame.getBoundingClientRect();
        const canvasRect = frameCanvas.getBoundingClientRect();
        const hostRect = container.getBoundingClientRect();
        const canvasOffsetX = frameRect.left - hostRect.left + canvasRect.left;
        const canvasOffsetY = frameRect.top - hostRect.top + canvasRect.top;
        const vector = new three.Vector3();

        LABEL_ANCHORS.forEach(anchor => {
          const element = layer.querySelector(`[data-anchor="${anchor.id}"]`);
          if (!element) return;
          if (anchor.id !== state.activeLabelId) {
            element.classList.remove("is-visible");
            return;
          }
          vector.set(anchor.position[0], anchor.position[1], anchor.position[2]);
          vector.project(camera);

          const isBehindCamera = vector.z < -1 || vector.z > 1;
          const x = canvasOffsetX + (vector.x * 0.5 + 0.5) * canvasRect.width;
          const y = canvasOffsetY + (-vector.y * 0.5 + 0.5) * canvasRect.height;
          const offset = Array.isArray(anchor.labelOffset) ? anchor.labelOffset : [0, 0];
          const labelX = x + offset[0];
          const labelY = y + offset[1];
          const inside = !isBehindCamera && x >= -24 && x <= frameRect.width + 24 && y >= -24 && y <= frameRect.height + 24;

          element.style.transform = `translate(${Math.round(labelX)}px, ${Math.round(labelY)}px) translate(-50%, -50%)`;
          element.classList.toggle("is-visible", inside);
          element.style.pointerEvents = "none";
        });
      }

      function projectAnchorToViewport(anchor, frameWindow, frame, frameCanvas) {
        if (!anchor || !frameWindow?.THREE || !frameWindow?.camera || !frameCanvas || !frame) return null;
        const vector = new frameWindow.THREE.Vector3(anchor.position[0], anchor.position[1], anchor.position[2]);
        vector.project(frameWindow.camera);
        if (vector.z < -1 || vector.z > 1) return null;
        const frameRect = frame.getBoundingClientRect();
        const canvasRect = frameCanvas.getBoundingClientRect();
        const x = frameRect.left + canvasRect.left + (vector.x * 0.5 + 0.5) * canvasRect.width;
        const y = frameRect.top + canvasRect.top + (-vector.y * 0.5 + 0.5) * canvasRect.height;
        return { x, y };
      }

      function findNearestAnchorFromClick(clientX, clientY) {
        const frameWindow = getFrameWindow();
        const frameDocument = getFrameDocument();
        const frame = container.querySelector(".transport-frame");
        const frameCanvas = frameDocument ? frameDocument.querySelector("#canvas-container canvas") : null;
        if (!frameWindow || !frameDocument || !frame || !frameCanvas) return "";

        const mode = getMode(state.mode).id;
        const candidatesByMode = {
          simple: ["small", "lipid"],
          facilitated: ["water", "channel", "carrier", "lipid"],
          active: ["sodium", "potassium", "atp", "adp", "pump", "lipid"]
        };
        const candidates = candidatesByMode[mode] || ["lipid"];
        let nearest = { id: "", distance: Infinity };
        candidates.forEach(id => {
          const projected = projectAnchorToViewport(LABEL_ANCHOR_MAP[id], frameWindow, frame, frameCanvas);
          if (!projected) return;
          const distance = Math.hypot(projected.x - clientX, projected.y - clientY);
          if (distance < nearest.distance) nearest = { id, distance };
        });
        return nearest.distance <= 100 ? nearest.id : "";
      }

      function getClickedSceneLabelId(event) {
        const frameWindow = getFrameWindow();
        const frameDocument = getFrameDocument();
        if (!frameWindow || !frameDocument || !frameWindow.THREE || !frameWindow.camera) return "";
        const frame = container.querySelector(".transport-frame");
        const frameCanvas = frameDocument.querySelector("#canvas-container canvas");
        if (!frame || !frameCanvas) return "";
        const frameRect = frame.getBoundingClientRect();
        const canvasRect = frameCanvas.getBoundingClientRect();
        const x = event.clientX - frameRect.left - canvasRect.left;
        const y = event.clientY - frameRect.top - canvasRect.top;
        if (x < 0 || y < 0 || x > canvasRect.width || y > canvasRect.height) return "";

        const pointer = new frameWindow.THREE.Vector2((x / canvasRect.width) * 2 - 1, -(y / canvasRect.height) * 2 + 1);
        const raycaster = new frameWindow.THREE.Raycaster();
        raycaster.setFromCamera(pointer, frameWindow.camera);

        const structureTargets = [];
        const scene = frameWindow.scene;
        if (scene?.traverse) {
          scene.traverse(object => {
            if (
              object?.name === "channel_protein"
              || object?.name === "carrier_protein"
              || object?.name === "pump_protein"
            ) {
              structureTargets.push(object);
            }
          });
        }

        const hits = structureTargets.length ? raycaster.intersectObjects(structureTargets, true) : [];
        for (const hit of hits) {
          let object = hit.object;
          while (object && !object.name && object.parent) object = object.parent;
          if (object?.name === "channel_protein") return "channel";
          if (object?.name === "carrier_protein") return "carrier";
          if (object?.name === "pump_protein") return "pump";
        }

        return findNearestAnchorFromClick(event.clientX, event.clientY) || "";
      }

      function injectFrameStyle(frameDocument) {
        if (!frameDocument || frameDocument.getElementById(`${sceneId}-frame-style`)) return;
        const style = frameDocument.createElement("style");
        style.id = `${sceneId}-frame-style`;
        style.textContent = `
          #ui-layer .control-panel,
          #ui-layer .info-panel,
          #ui-layer .footer-panel,
          #ui-layer .header-panel {
            display: none !important;
          }
          #ui-layer {
            pointer-events: none !important;
            padding: 0 !important;
            gap: 0 !important;
          }
          #info-modal,
          .modal-overlay,
          #tooltip-element {
            display: none !important;
            pointer-events: none !important;
          }
          body {
            overflow: hidden !important;
            background: #05050a !important;
          }
          #canvas-container {
            background: radial-gradient(circle at 50% 45%, #0e1335, #050616 60%, #010105) !important;
          }
        `;
        frameDocument.head.appendChild(style);
      }

      function installFrameClickGuard(frameWindow) {
        if (!frameWindow || frameWindow.__bioTransportClickGuardInstalled) return;
        frameWindow.__bioTransportClickGuardInstalled = true;
        frameWindow.addEventListener("click", function guardSourceModal(event) {
          const target = event.target;
          if (target && target.closest && target.closest(".interactive")) return;
          event.stopImmediatePropagation();
          const modal = frameWindow.document && frameWindow.document.getElementById("info-modal");
          if (modal) modal.style.display = "none";
          if (frameWindow.controls) frameWindow.controls.enabled = true;
        }, true);
      }

      function installFrameLabelPicker(frameWindow, frameDocument) {
        if (!frameWindow || !frameDocument || frameWindow.__bioTransportLabelPickerInstalled) return;
        if (!frameDocument.getElementById("canvas-container")) return;
        frameWindow.__bioTransportLabelPickerInstalled = true;
        frameWindow.addEventListener("click", event => {
          const target = event.target;
          if (target && target.closest && target.closest(".interactive")) return;
          const labelId = getClickedSceneLabelId({
            clientX: event.clientX + iframe.getBoundingClientRect().left,
            clientY: event.clientY + iframe.getBoundingClientRect().top
          });
          if (labelId) setActiveLabel(labelId);
        }, true);
      }

      function configureFrame() {
        const frameWindow = getFrameWindow();
        const frameDocument = getFrameDocument();
        if (!frameWindow || !frameDocument) return false;
        if (!frameDocument.querySelector("#canvas-container canvas") || !frameDocument.querySelector(".mode-btn[data-mode]")) {
          return false;
        }
        injectFrameStyle(frameDocument);
        installFrameLabelPicker(frameWindow, frameDocument);
        installFrameClickGuard(frameWindow);
        const modal = frameDocument.getElementById("info-modal");
        if (modal) modal.style.display = "none";
        if (frameWindow.controls) frameWindow.controls.enabled = true;
        frameReady = true;
        setActiveLabel(state.activeLabelId);
        syncFrame();
        updatePanel();
        return true;
      }

      function startFramePolling() {
        frameReady = false;
        if (framePoll) window.clearInterval(framePoll);
        let attempts = 0;
        framePoll = window.setInterval(function () {
          attempts += 1;
          if (disposed || configureFrame() || attempts > 160) {
            window.clearInterval(framePoll);
            framePoll = 0;
          }
        }, 100);
      }

      function handleFrameLoad() {
        startFramePolling();
      }

      function handleStageClick(event) {
        const target = event.target.closest("[data-action]");
        if (target) {
          if (target.getAttribute("data-action") === "close-detail-modal") {
            state.detailModalOpen = false;
            updateStageDetailModal();
          }
          if (target.getAttribute("data-action") === "clear-label") {
            setActiveLabel("");
          }
          return;
        }

        const modal = container.querySelector('[data-role="detail-modal"]');
        if (modal && event.target === modal) {
          state.detailModalOpen = false;
          updateStageDetailModal();
          return;
        }

        const scene = container.querySelector(".transport-stage");
        if (scene && scene.contains(event.target)) {
          const labelId = getClickedSceneLabelId(event);
          if (labelId) {
            setActiveLabel(labelId);
          }
        }
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
        const InputEventCtor = frameWindow && frameWindow.Event ? frameWindow.Event : Event;
        element.dispatchEvent(new InputEventCtor("input", { bubbles: true }));
        return true;
      }

      function syncFrame() {
        if (!frameReady) return;
        clickFrame(`.mode-btn[data-mode="${state.mode}"]`);
        setFrameInput("#ext-density", state.extDensity);
        setFrameInput("#int-density", state.intDensity);
        setFrameInput("#speed-slider", state.speed);
        syncFramePlaying();
        const view = VIEW_CONTROLS.find(item => item.id === state.view) || VIEW_CONTROLS[0];
        clickFrame(`#${view.sourceId}`);
      }

      function syncFramePlaying() {
        const frameDocument = getFrameDocument();
        const button = frameDocument ? frameDocument.querySelector("#play-pause-btn") : null;
        const label = button ? button.querySelector("span") : null;
        if (!button || !label) return;
        const sourcePlaying = label.textContent.trim() === "暂停";
        if (sourcePlaying !== state.playing) button.click();
      }

      function syncFrameSlider(kind) {
        if (!frameReady) return;
        if (kind === "ext-density") setFrameInput("#ext-density", state.extDensity);
        if (kind === "int-density") setFrameInput("#int-density", state.intDensity);
        if (kind === "speed") setFrameInput("#speed-slider", state.speed);
      }

      function updatePanel() {
        if (!panelHost) return;
        const panel = panelHost.querySelector(`.panel-${sceneId}`);
        if (!panel) return;
        const mode = getMode(state.mode);
        const task = getTask(state.selectedTask);
        panel.style.setProperty("--mode-accent", mode.accent);
        panel.style.setProperty("--mode-accent-soft", `${mode.accent}24`);

        panel.querySelectorAll("[data-action='select-mode']").forEach(button => {
          button.classList.toggle("is-active", button.getAttribute("data-value") === state.mode);
        });
        panel.querySelectorAll("[data-action='select-view']").forEach(button => {
          button.classList.toggle("is-active", button.getAttribute("data-value") === state.view);
        });
        panel.querySelectorAll("[data-action='select-detail']").forEach(button => {
          button.classList.toggle("is-active", button.getAttribute("data-value") === state.detail);
        });
        panel.querySelectorAll("[data-action='select-task']").forEach(button => {
          button.classList.toggle("is-active", button.getAttribute("data-value") === state.selectedTask);
        });
        panel.querySelectorAll("[data-action='answer-quiz']").forEach(button => {
          button.classList.toggle("is-selected", button.getAttribute("data-value") === state.quizAnswer);
        });

        const playButton = panel.querySelector("[data-action='toggle-play']");
        if (playButton) {
          playButton.textContent = state.playing ? "暂停" : "播放";
          playButton.classList.toggle("is-active", state.playing);
        }
        setText(panel, '[data-role="ext-density-val"]', state.extDensity);
        setText(panel, '[data-role="int-density-val"]', state.intDensity);
        setText(panel, '[data-role="speed-val"]', `${state.speed.toFixed(1)}x`);
        setInputValue(panel, '[data-range="ext-density"]', state.extDensity);
        setInputValue(panel, '[data-range="int-density"]', state.intDensity);
        setInputValue(panel, '[data-range="speed"]', state.speed);

        const title = panel.querySelector('[data-role="mode-title"]');
        if (title) {
          title.innerHTML = `${escapeHtml(mode.title)} <span style="color:rgba(226,232,240,0.42);font-size:12px;font-weight:800;">${escapeHtml(mode.subtitle)}</span>`;
        }
        setText(panel, '[data-role="mode-summary"]', mode.summary);
        setText(panel, '[data-role="mode-direction"]', mode.direction);
        setText(panel, '[data-role="mode-carrier"]', mode.carrier);
        setText(panel, '[data-role="mode-energy"]', mode.energy);
        setText(panel, '[data-role="mode-driver"]', mode.driver);
        setHtml(panel, '[data-role="mode-facts"]', renderList(mode.facts));

        updateStageDetailModal();

        setText(panel, '[data-role="task-prompt"]', task.prompt);
        setHtml(panel, '[data-role="task-checks"]', renderList(task.checks));
        const feedback = panel.querySelector('[data-role="quiz-feedback"]');
        if (feedback) {
          feedback.textContent = state.quizFeedback || "选择一个答案后，这里会给出即时反馈。";
          feedback.classList.toggle("is-correct", state.quizAnswer === "active");
          feedback.classList.toggle("is-wrong", Boolean(state.quizAnswer && state.quizAnswer !== "active"));
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

      function handlePanelClick(event) {
        const target = event.target.closest("[data-action]");
        if (!target) return;
        const action = target.getAttribute("data-action");
        const value = target.getAttribute("data-value") || "";

        if (action === "select-mode") {
          const nextMode = getMode(value);
          state.mode = nextMode.id;
          state.detail = nextMode.detailId;
          if (frameReady) clickFrame(`.mode-btn[data-mode="${state.mode}"]`);
          updatePanel();
          return;
        }
        if (action === "select-view") {
          if (!VIEW_CONTROLS.some(item => item.id === value)) return;
          state.view = value;
          const view = VIEW_CONTROLS.find(item => item.id === state.view);
          if (frameReady && view) clickFrame(`#${view.sourceId}`);
          updatePanel();
          return;
        }
        if (action === "toggle-play") {
          state.playing = !state.playing;
          if (frameReady) syncFramePlaying();
          updatePanel();
          return;
        }
        if (action === "reset-source") {
          state.extDensity = 70;
          state.intDensity = 15;
          state.speed = 1;
          if (frameReady) {
            clickFrame("#reset-btn");
            setFrameInput("#ext-density", state.extDensity);
            setFrameInput("#int-density", state.intDensity);
            setFrameInput("#speed-slider", state.speed);
            clickFrame(`.mode-btn[data-mode="${state.mode}"]`);
            syncFramePlaying();
          }
          updatePanel();
          return;
        }
        if (action === "select-detail") {
          if (!DETAILS.some(item => item.id === value)) return;
          state.detail = value;
          state.detailModalOpen = true;
          updateStageDetailModal();
          updatePanel();
          return;
        }
        if (action === "select-task") {
          if (!TASKS.some(item => item.id === value)) return;
          state.selectedTask = value;
          updatePanel();
          return;
        }
        if (action === "answer-quiz") {
          const answer = QUIZ.options.find(option => option.id === value);
          if (!answer) return;
          state.quizAnswer = answer.id;
          state.quizFeedback = answer.correct
            ? "判断正确。主动运输需要载体蛋白或离子泵，并通过 ATP 供能完成逆浓度梯度运输。"
            : "再比较能量项和方向：自由扩散、协助扩散都不消耗 ATP，且只能顺浓度梯度完成净运输。";
          updatePanel();
        }
      }

      function handlePanelInput(event) {
        const target = event.target.closest("[data-range]");
        if (!target) return;
        const range = target.getAttribute("data-range");
        if (range === "ext-density") {
          state.extDensity = Math.round(clamp(toNumber(target.value, 70), 10, 120));
        } else if (range === "int-density") {
          state.intDensity = Math.round(clamp(toNumber(target.value, 15), 5, 100));
        } else if (range === "speed") {
          state.speed = Math.round(clamp(toNumber(target.value, 1), 0, 3) * 10) / 10;
        } else {
          return;
        }
        syncFrameSlider(range);
        updatePanel();
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
        if (panelHost) {
          panelHost.style.overflow = "hidden auto";
          panelHost.style.overflowY = "auto";
          panelHost.style.overscrollBehavior = "contain";
          panelHost.style.scrollbarWidth = "none";
          panelHost.style.touchAction = "pan-y";
          panelHost.style.webkitOverflowScrolling = "touch";
          panelHost.style.height = "100%";
          panelHost.style.minHeight = "0";
        }
        renderStage();
        renderPanel();
        updatePanel();
        setActiveLabel(state.activeLabelId);
        updateTrackedLabels();
        container.addEventListener("click", handleStageClick);
        if (panelHost) {
          panelHost.addEventListener("click", handlePanelClick);
          panelHost.addEventListener("input", handlePanelInput);
        }
      }

      start();

      container.__bioSceneCleanup = function cleanup() {
        disposed = true;
        if (framePoll) {
          window.clearInterval(framePoll);
          framePoll = 0;
        }
        if (labelFrame) {
          window.cancelAnimationFrame(labelFrame);
          labelFrame = 0;
        }
        if (iframe) {
          iframe.removeEventListener("load", handleFrameLoad);
          try {
            iframe.src = "about:blank";
          } catch (error) {}
        }
        container.removeEventListener("click", handleStageClick);
        if (panelHost) {
          panelHost.removeEventListener("click", handlePanelClick);
          panelHost.removeEventListener("input", handlePanelInput);
          panelHost.innerHTML = "";
          if (externalPanelStyle) Object.assign(panelHost.style, externalPanelStyle);
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
      if (container) container.innerHTML = "";
    }
  };
})();
