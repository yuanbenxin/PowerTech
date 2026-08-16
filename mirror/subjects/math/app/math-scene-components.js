/*
  Visual scene components.
*/

window.MathApp = window.MathApp || {};

(() => {
  const app = window.MathApp;
  const {
    useState,
    useEffect,
    useRef,
    toKebabCase,
    fetchJsonSafe,
    loadSceneScript,
    resolveMathMediaThumbnailPath,
    handleMathMediaError
  } = app;

  const Icon = ({ name, size = 18, className = '' }) => {
    const markup = React.useMemo(() => {
      const icon = window.lucide?.icons?.[toKebabCase(name)];
      return icon
        ? icon.toSvg({ stroke: 'currentColor', 'stroke-width': 2, width: size, height: size })
        : '';
    }, [name, size]);

    return (
      <i
        className={`inline-flex items-center justify-center ${className}`}
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: markup }}
      />
    );
  };

  const DNAEngine = () => (
    <div className="w-full h-full flex items-center justify-center bg-zinc-950/20 rounded-3xl overflow-hidden opacity-40">
      <svg viewBox="0 0 400 300" className="w-full h-full shrink-0">
        {Array.from({ length: 15 }).map((_, index) => (
          <g key={index}>
            <line
              x1="140"
              x2="260"
              y1={50 + index * 14}
              y2={50 + index * 14}
              stroke="white"
              strokeOpacity="0.05"
            />
            <circle r="3" fill="#10b981">
              <animate
                attributeName="cx"
                values="140;260;140"
                dur="4s"
                repeatCount="indefinite"
                begin={`${index * 0.1}s`}
              />
            </circle>
            <circle r="3" fill="#38bdf8">
              <animate
                attributeName="cx"
                values="260;140;260"
                dur="4s"
                repeatCount="indefinite"
                begin={`${index * 0.1}s`}
              />
            </circle>
          </g>
        ))}
      </svg>
    </div>
  );

  const JUNIOR_HUD_CARD_IDS = new Set([
    'j7a_m01', 'j7a_m02', 'j7a_m03', 'j7a_m04', 'j7a_m05', 'j7a_m10', 'j7a_m11', 'j7a_m12', 'j7a_m13',
    'j7b_m01', 'j7b_m02', 'j7b_m03', 'j7b_m05', 'j7b_m06', 'j7b_m07', 'j7b_m09', 'j7b_m10', 'j7b_m11', 'j7b_m12', 'j7b_m14',
    'j8a_m05', 'j8a_m06', 'j8a_m07', 'j8a_m10', 'j8a_m11', 'j8a_m12', 'j8a_m14',
    'j8b_m02', 'j8b_m05', 'j8b_m06', 'j8b_m07', 'j8b_m08', 'j8b_m09',
    'j9a_m05', 'j9b_m02', 'j9b_m04',
    'jm_model_m03', 'jm_model_m04', 'jm_model_m05', 'jm_model_m06', 'jm_model_m07', 'jm_model_m08', 'jm_model_m09', 'jm_model_m10', 'jm_model_m11', 'jm_model_m13', 'jm_model_m14', 'jm_model_m17', 'jm_model_m18', 'jm_model_m19', 'jm_model_m21', 'jm_model_m23', 'jm_model_m24',
    'jm_topic_m03', 'jm_topic_m04', 'jm_topic_m05', 'jm_topic_m06', 'jm_topic_m07', 'jm_topic_m08', 'jm_topic_m09', 'jm_topic_m10', 'jm_topic_m11', 'jm_topic_m12', 'jm_topic_m13', 'jm_topic_m14', 'jm_topic_m15', 'jm_topic_m16', 'jm_topic_m17'
  ]);

  // Display-only HUD standard derived from the half-angle model. It deliberately
  // does not inspect or rewrite lesson-provided HUD text, state, or handlers.
  const UNIFIED_JUNIOR_HUD_STYLE = `
    #analysis-hud-card,
    .analysis-hud-card,
    .analysis-hud,
    #hud-chalkboard-panel,
    #hud-panel,
    .hud-panel,
    .hud-board,
    .collapsible-hud,
    #area-proof-hud,
    .area-proof-hud,
    [data-hud] {
      position: absolute !important;
      left: max(var(--junior-hud-left, 18px), env(safe-area-inset-left)) !important;
      top: max(var(--junior-hud-top, 18px), env(safe-area-inset-top)) !important;
      right: auto !important;
      bottom: auto !important;
      z-index: var(--junior-hud-z-index, 120) !important;
      box-sizing: border-box !important;
      width: min(330px, calc(100% - 36px)) !important;
      max-width: min(330px, calc(100% - 36px)) !important;
      max-height: min(420px, calc(100% - 36px)) !important;
      min-height: 0 !important;
      display: flex !important;
      flex-direction: column !important;
      border: 1px solid rgba(148, 163, 184, 0.35) !important;
      border-radius: 12px !important;
      background: rgba(255, 255, 255, 0.96) !important;
      color: #0f172a !important;
      box-shadow: 0 14px 34px rgba(15, 23, 42, 0.12) !important;
      overflow: hidden !important;
      isolation: isolate !important;
    }
    #analysis-hud-card .hud-header,
    .analysis-hud-card .hud-header,
    .analysis-hud .hud-header,
    #hud-chalkboard-panel .hud-header,
    #hud-panel .hud-header,
    .hud-panel .hud-header,
    .hud-board .hud-header,
    .collapsible-hud .hud-header,
    #area-proof-hud .area-proof-hud-header,
    .area-proof-hud .area-proof-hud-header,
    [data-hud] .hud-header {
      box-sizing: border-box !important;
      min-height: 38px !important;
      padding: 7px 12px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      gap: 8px !important;
      border-bottom: 1px solid rgba(226, 232, 240, 0.72) !important;
      background: rgba(248, 250, 252, 0.72) !important;
      cursor: pointer !important;
      touch-action: manipulation !important;
    }
    #analysis-hud-card .hud-title,
    #analysis-hud-card .hud-header-title,
    .analysis-hud-card .hud-title,
    .analysis-hud-card .hud-header-title,
    .analysis-hud .hud-title,
    .analysis-hud .hud-header-title,
    #hud-chalkboard-panel .hud-title,
    #hud-chalkboard-panel .hud-header-title,
    #hud-panel .hud-title,
    #hud-panel .hud-header-title,
    .hud-panel .hud-title,
    .hud-panel .hud-header-title,
    .hud-board .hud-title,
    .collapsible-hud .hud-title,
    [data-hud] .hud-title,
    [data-hud] .hud-header-title,
    .hud-header h2,
    .hud-header h3 {
      order: 1 !important;
      min-width: 0 !important;
      flex: 1 1 auto !important;
      margin: 0 !important;
      overflow: hidden !important;
      color: #0f172a !important;
      font-size: 12.5px !important;
      font-weight: 800 !important;
      line-height: 1.2 !important;
      letter-spacing: 0 !important;
      white-space: nowrap !important;
      text-overflow: ellipsis !important;
    }
    #analysis-hud-card .btn-hud-toggle,
    #analysis-hud-card .hud-control-btn,
    .analysis-hud-card .btn-hud-toggle,
    .analysis-hud-card .hud-control-btn,
    .analysis-hud .btn-hud-toggle,
    .analysis-hud .hud-control-btn,
    #hud-chalkboard-panel .btn-hud-toggle,
    #hud-chalkboard-panel .hud-control-btn,
    #hud-panel .btn-hud-toggle,
    #hud-panel .hud-control-btn,
    .hud-panel .btn-hud-toggle,
    .hud-panel .hud-control-btn,
    .hud-board .btn-hud-toggle,
    .hud-board .hud-control-btn,
    .collapsible-hud .btn-hud-toggle,
    .collapsible-hud .hud-control-btn,
    [data-hud] .btn-hud-toggle,
    [data-hud] .hud-control-btn {
      order: 2 !important;
      box-sizing: border-box !important;
      width: 26px !important;
      height: 26px !important;
      min-width: 26px !important;
      min-height: 26px !important;
      flex: 0 0 26px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      border: 0 !important;
      border-radius: 999px !important;
      background: rgba(245, 158, 11, 0.16) !important;
      color: #92400e !important;
      line-height: 1 !important;
    }
    #analysis-hud-card .hud-content,
    #analysis-hud-card .hud-body,
    .analysis-hud-card .hud-content,
    .analysis-hud-card .hud-body,
    .analysis-hud .hud-content,
    .analysis-hud .hud-body,
    #hud-chalkboard-panel .hud-content,
    #hud-chalkboard-panel .hud-body,
    #hud-chalkboard-panel #steps-hud-chalkboard,
    #hud-panel .hud-content,
    #hud-panel .hud-body,
    #hud-panel #steps-chalkboard,
    .hud-panel .hud-content,
    .hud-panel .hud-body,
    .hud-board .hud-content,
    .hud-board .hud-body,
    .collapsible-hud .hud-content,
    .collapsible-hud .hud-body,
    [data-hud] .hud-content,
    [data-hud] .hud-body {
      box-sizing: border-box !important;
      min-width: 0 !important;
      max-height: min(350px, calc(100vh - 150px)) !important;
      padding: 0 12px 12px !important;
      overflow-x: hidden !important;
      overflow-y: auto !important;
      color: #334155 !important;
      font-size: 11.5px !important;
      line-height: 1.45 !important;
      letter-spacing: 0 !important;
      overscroll-behavior: contain !important;
    }
    #analysis-hud-card.collapsed,
    .analysis-hud-card.collapsed,
    .analysis-hud.collapsed,
    #hud-chalkboard-panel.collapsed,
    #hud-panel.collapsed,
    .hud-panel.collapsed,
    .hud-board.collapsed,
    .collapsible-hud.collapsed,
    #area-proof-hud.collapsed,
    .area-proof-hud.collapsed,
    [data-hud].collapsed,
    #analysis-hud-card[aria-expanded="false"],
    .analysis-hud-card[aria-expanded="false"],
    .analysis-hud[aria-expanded="false"],
    #hud-chalkboard-panel[aria-expanded="false"],
    #hud-panel[aria-expanded="false"],
    .hud-panel[aria-expanded="false"],
    .hud-board[aria-expanded="false"],
    .collapsible-hud[aria-expanded="false"],
    [data-hud][aria-expanded="false"] {
      width: auto !important;
      min-width: 158px !important;
      max-width: min(230px, calc(100% - 36px)) !important;
      height: 42px !important;
      min-height: 42px !important;
      max-height: 42px !important;
      border-radius: 999px !important;
      box-shadow: 0 12px 26px rgba(15, 23, 42, 0.13), inset 0 1px 0 rgba(255, 255, 255, 0.9) !important;
    }
    #analysis-hud-card.collapsed .hud-header,
    .analysis-hud-card.collapsed .hud-header,
    .analysis-hud.collapsed .hud-header,
    #hud-chalkboard-panel.collapsed .hud-header,
    #hud-panel.collapsed .hud-header,
    .hud-panel.collapsed .hud-header,
    .hud-board.collapsed .hud-header,
    .collapsible-hud.collapsed .hud-header,
    [data-hud].collapsed .hud-header {
      height: 42px !important;
      min-height: 42px !important;
      padding: 6px 8px 6px 14px !important;
      border-bottom: 0 !important;
      background: transparent !important;
    }
    #analysis-hud-card.collapsed .hud-content,
    #analysis-hud-card.collapsed .hud-body,
    .analysis-hud-card.collapsed .hud-content,
    .analysis-hud-card.collapsed .hud-body,
    .analysis-hud.collapsed .hud-content,
    .analysis-hud.collapsed .hud-body,
    #hud-chalkboard-panel.collapsed .hud-content,
    #hud-chalkboard-panel.collapsed .hud-body,
    #hud-chalkboard-panel.collapsed #steps-hud-chalkboard,
    #hud-panel.collapsed .hud-content,
    #hud-panel.collapsed .hud-body,
    #hud-panel.collapsed #steps-chalkboard,
    .hud-panel.collapsed .hud-content,
    .hud-panel.collapsed .hud-body,
    .hud-board.collapsed .hud-content,
    .hud-board.collapsed .hud-body,
    .collapsible-hud.collapsed .hud-content,
    .collapsible-hud.collapsed .hud-body,
    [data-hud].collapsed .hud-content,
    [data-hud].collapsed .hud-body {
      display: none !important;
    }
    #analysis-hud-card.collapsed .hud-title::before,
    #analysis-hud-card.collapsed .hud-header-title::before,
    .analysis-hud-card.collapsed .hud-title::before,
    .analysis-hud-card.collapsed .hud-header-title::before,
    .analysis-hud.collapsed .hud-title::before,
    .analysis-hud.collapsed .hud-header-title::before,
    #hud-chalkboard-panel.collapsed .hud-title::before,
    #hud-chalkboard-panel.collapsed .hud-header-title::before,
    #hud-panel.collapsed .hud-title::before,
    #hud-panel.collapsed .hud-header-title::before,
    .hud-panel.collapsed .hud-title::before,
    .hud-panel.collapsed .hud-header-title::before,
    .hud-board.collapsed .hud-title::before,
    .collapsible-hud.collapsed .hud-title::before,
    [data-hud].collapsed .hud-title::before,
    [data-hud].collapsed .hud-header-title::before {
      content: '' !important;
      display: inline-block !important;
      width: 14px !important;
      height: 14px !important;
      margin-right: 7px !important;
      vertical-align: -2px !important;
      border-radius: 999px !important;
      background: radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.96) 0 30%, transparent 32%), conic-gradient(from 0deg, #38bdf8, #f59e0b, #22c55e, #38bdf8) !important;
    }
    @media (max-width: 600px) {
      #analysis-hud-card,
      .analysis-hud-card,
      .analysis-hud,
      #hud-chalkboard-panel,
      #hud-panel,
      .hud-panel,
      .hud-board,
      .collapsible-hud,
      #area-proof-hud,
      .area-proof-hud,
      [data-hud] {
        left: max(var(--junior-hud-left-compact, 12px), env(safe-area-inset-left)) !important;
        top: max(var(--junior-hud-top-compact, 12px), env(safe-area-inset-top)) !important;
        width: min(284px, calc(100% - 24px)) !important;
        max-width: min(284px, calc(100% - 24px)) !important;
        max-height: min(360px, calc(100% - 24px)) !important;
      }
      #analysis-hud-card.collapsed,
      .analysis-hud-card.collapsed,
      .analysis-hud.collapsed,
      #hud-chalkboard-panel.collapsed,
      #hud-panel.collapsed,
      .hud-panel.collapsed,
      .hud-board.collapsed,
      .collapsible-hud.collapsed,
      [data-hud].collapsed {
        min-width: 136px !important;
        max-width: min(210px, calc(100% - 24px)) !important;
        height: 38px !important;
        min-height: 38px !important;
        max-height: 38px !important;
      }
      #analysis-hud-card .hud-header,
      .analysis-hud-card .hud-header,
      .analysis-hud .hud-header,
      #hud-chalkboard-panel .hud-header,
      #hud-panel .hud-header,
      .hud-panel .hud-header,
      .hud-board .hud-header,
      .collapsible-hud .hud-header,
      [data-hud] .hud-header {
        min-height: 36px !important;
        padding: 6px 10px !important;
      }
      #analysis-hud-card.collapsed .hud-header,
      .analysis-hud-card.collapsed .hud-header,
      .analysis-hud.collapsed .hud-header,
      #hud-chalkboard-panel.collapsed .hud-header,
      #hud-panel.collapsed .hud-header,
      .hud-panel.collapsed .hud-header,
      .hud-board.collapsed .hud-header,
      .collapsible-hud.collapsed .hud-header,
      [data-hud].collapsed .hud-header {
        height: 38px !important;
        min-height: 38px !important;
        padding: 5px 7px 5px 12px !important;
      }
      #analysis-hud-card .hud-title,
      #analysis-hud-card .hud-header-title,
      .analysis-hud-card .hud-title,
      .analysis-hud-card .hud-header-title,
      .analysis-hud .hud-title,
      .analysis-hud .hud-header-title,
      #hud-chalkboard-panel .hud-title,
      #hud-chalkboard-panel .hud-header-title,
      #hud-panel .hud-title,
      #hud-panel .hud-header-title,
      .hud-panel .hud-title,
      .hud-panel .hud-header-title,
      .hud-board .hud-title,
      .collapsible-hud .hud-title,
      [data-hud] .hud-title,
      [data-hud] .hud-header-title,
      .hud-header h2,
      .hud-header h3 { font-size: 11.5px !important; }
      #analysis-hud-card .btn-hud-toggle,
      #analysis-hud-card .hud-control-btn,
      .analysis-hud-card .btn-hud-toggle,
      .analysis-hud-card .hud-control-btn,
      .analysis-hud .btn-hud-toggle,
      .analysis-hud .hud-control-btn,
      #hud-chalkboard-panel .btn-hud-toggle,
      #hud-chalkboard-panel .hud-control-btn,
      #hud-panel .btn-hud-toggle,
      #hud-panel .hud-control-btn,
      .hud-panel .btn-hud-toggle,
      .hud-panel .hud-control-btn,
      .hud-board .btn-hud-toggle,
      .hud-board .hud-control-btn,
      .collapsible-hud .btn-hud-toggle,
      .collapsible-hud .hud-control-btn,
      [data-hud] .btn-hud-toggle,
      [data-hud] .hud-control-btn {
        width: 24px !important;
        height: 24px !important;
        min-width: 24px !important;
        min-height: 24px !important;
        flex-basis: 24px !important;
      }
      #analysis-hud-card .hud-content,
      #analysis-hud-card .hud-body,
      .analysis-hud-card .hud-content,
      .analysis-hud-card .hud-body,
      .analysis-hud .hud-content,
      .analysis-hud .hud-body,
      #hud-chalkboard-panel .hud-content,
      #hud-chalkboard-panel .hud-body,
      #hud-panel .hud-content,
      #hud-panel .hud-body,
      .hud-panel .hud-content,
      .hud-panel .hud-body,
      .hud-board .hud-content,
      .hud-board .hud-body,
      .collapsible-hud .hud-content,
      .collapsible-hud .hud-body,
      [data-hud] .hud-content,
      [data-hud] .hud-body {
        max-height: min(300px, calc(100vh - 104px)) !important;
        padding: 0 10px 10px !important;
        font-size: 10.5px !important;
        line-height: 1.38 !important;
      }
    }
    @media (max-width: 420px) {
      #analysis-hud-card,
      .analysis-hud-card,
      .analysis-hud,
      #hud-chalkboard-panel,
      #hud-panel,
      .hud-panel,
      .hud-board,
      .collapsible-hud,
      #area-proof-hud,
      .area-proof-hud,
      [data-hud] {
        left: max(var(--junior-hud-left-small, 10px), env(safe-area-inset-left)) !important;
        top: max(var(--junior-hud-top-small, 10px), env(safe-area-inset-top)) !important;
        width: min(254px, calc(100% - 20px)) !important;
        max-width: min(254px, calc(100% - 20px)) !important;
        max-height: min(300px, calc(100% - 20px), calc(100vh - 20px)) !important;
      }
      #analysis-hud-card.collapsed,
      .analysis-hud-card.collapsed,
      .analysis-hud.collapsed,
      #hud-chalkboard-panel.collapsed,
      #hud-panel.collapsed,
      .hud-panel.collapsed,
      .hud-board.collapsed,
      .collapsible-hud.collapsed,
      [data-hud].collapsed {
        min-width: 120px !important;
        max-width: min(190px, calc(100% - 20px)) !important;
        height: 36px !important;
        min-height: 36px !important;
        max-height: 36px !important;
      }
      #analysis-hud-card.collapsed .hud-header,
      .analysis-hud-card.collapsed .hud-header,
      .analysis-hud.collapsed .hud-header,
      #hud-chalkboard-panel.collapsed .hud-header,
      #hud-panel.collapsed .hud-header,
      .hud-panel.collapsed .hud-header,
      .hud-board.collapsed .hud-header,
      .collapsible-hud.collapsed .hud-header,
      [data-hud].collapsed .hud-header {
        height: 36px !important;
        min-height: 36px !important;
        padding: 4px 6px 4px 10px !important;
      }
      #analysis-hud-card .hud-title,
      #analysis-hud-card .hud-header-title,
      .analysis-hud-card .hud-title,
      .analysis-hud-card .hud-header-title,
      .analysis-hud .hud-title,
      .analysis-hud .hud-header-title,
      #hud-chalkboard-panel .hud-title,
      #hud-chalkboard-panel .hud-header-title,
      #hud-panel .hud-title,
      #hud-panel .hud-header-title,
      .hud-panel .hud-title,
      .hud-panel .hud-header-title,
      .hud-board .hud-title,
      .collapsible-hud .hud-title,
      [data-hud] .hud-title,
      [data-hud] .hud-header-title,
      .hud-header h2,
      .hud-header h3 { font-size: 11px !important; }
      #analysis-hud-card .btn-hud-toggle,
      #analysis-hud-card .hud-control-btn,
      .analysis-hud-card .btn-hud-toggle,
      .analysis-hud-card .hud-control-btn,
      .analysis-hud .btn-hud-toggle,
      .analysis-hud .hud-control-btn,
      #hud-chalkboard-panel .btn-hud-toggle,
      #hud-chalkboard-panel .hud-control-btn,
      #hud-panel .btn-hud-toggle,
      #hud-panel .hud-control-btn,
      .hud-panel .btn-hud-toggle,
      .hud-panel .hud-control-btn,
      .hud-board .btn-hud-toggle,
      .hud-board .hud-control-btn,
      .collapsible-hud .btn-hud-toggle,
      .collapsible-hud .hud-control-btn,
      [data-hud] .btn-hud-toggle,
      [data-hud] .hud-control-btn {
        width: 22px !important;
        height: 22px !important;
        min-width: 22px !important;
        min-height: 22px !important;
        flex-basis: 22px !important;
      }
      #analysis-hud-card .hud-content,
      #analysis-hud-card .hud-body,
      .analysis-hud-card .hud-content,
      .analysis-hud-card .hud-body,
      .analysis-hud .hud-content,
      .analysis-hud .hud-body,
      #hud-chalkboard-panel .hud-content,
      #hud-chalkboard-panel .hud-body,
      #hud-panel .hud-content,
      #hud-panel .hud-body,
      .hud-panel .hud-content,
      .hud-panel .hud-body,
      .hud-board .hud-content,
      .hud-board .hud-body,
      .collapsible-hud .hud-content,
      .collapsible-hud .hud-body,
      [data-hud] .hud-content,
      [data-hud] .hud-body {
        max-height: min(246px, calc(100vh - 86px)) !important;
        padding: 0 9px 9px !important;
        font-size: 10px !important;
        line-height: 1.32 !important;
      }
    }
    @media (max-height: 540px) {
      #analysis-hud-card,
      .analysis-hud-card,
      .analysis-hud,
      #hud-chalkboard-panel,
      #hud-panel,
      .hud-panel,
      .hud-board,
      .collapsible-hud,
      #area-proof-hud,
      .area-proof-hud,
      [data-hud] {
        max-height: min(300px, calc(100% - 16px), calc(100vh - 16px)) !important;
      }
    }
    /* Legacy text toggle controls still keep their lesson-owned + / - text.
       The presentation layer only replaces that visible glyph with the system chevron. */
    #analysis-hud-card .hud-toggle,
    #analysis-hud-card [data-hud-toggle],
    #analysis-hud-card #btn-hud-toggle,
    #analysis-hud-card #hud-toggle-btn,
    .analysis-hud-card .hud-toggle,
    .analysis-hud-card [data-hud-toggle],
    .analysis-hud-card #btn-hud-toggle,
    .analysis-hud .hud-toggle,
    .analysis-hud [data-hud-toggle],
    #hud-chalkboard-panel .hud-toggle,
    #hud-chalkboard-panel [data-hud-toggle],
    #hud-chalkboard-panel #btn-hud-toggle,
    #hud-chalkboard-panel #hud-toggle-btn,
    #hud-panel .hud-toggle,
    #hud-panel [data-hud-toggle],
    #hud-panel #btn-hud-toggle,
    #hud-panel #hud-toggle-btn,
    .hud-panel .hud-toggle,
    .hud-panel [data-hud-toggle],
    .hud-panel #btn-hud-toggle,
    .hud-board .hud-toggle,
    .hud-board [data-hud-toggle],
    .collapsible-hud .hud-toggle,
    .collapsible-hud [data-hud-toggle],
    [data-hud] .hud-toggle,
    [data-hud] [data-hud-toggle],
    [data-hud] #btn-hud-toggle,
    [data-hud] #hud-toggle-btn {
      order: 2 !important;
      box-sizing: border-box !important;
      width: 26px !important;
      height: 26px !important;
      min-width: 26px !important;
      min-height: 26px !important;
      flex: 0 0 26px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      border: 0 !important;
      border-radius: 999px !important;
      background: rgba(245, 158, 11, 0.16) !important;
      color: transparent !important;
      font-size: 0 !important;
      line-height: 1 !important;
      transition: background-color 160ms ease !important;
    }
    #analysis-hud-card .hud-toggle::before,
    #analysis-hud-card [data-hud-toggle]::before,
    .analysis-hud-card .hud-toggle::before,
    .analysis-hud-card [data-hud-toggle]::before,
    .analysis-hud .hud-toggle::before,
    .analysis-hud [data-hud-toggle]::before,
    #hud-chalkboard-panel .hud-toggle::before,
    #hud-chalkboard-panel [data-hud-toggle]::before,
    #hud-panel .hud-toggle::before,
    #hud-panel [data-hud-toggle]::before,
    .hud-panel .hud-toggle::before,
    .hud-panel [data-hud-toggle]::before,
    .hud-board .hud-toggle::before,
    .hud-board [data-hud-toggle]::before,
    .collapsible-hud .hud-toggle::before,
    .collapsible-hud [data-hud-toggle]::before,
    [data-hud] .hud-toggle::before,
    [data-hud] [data-hud-toggle]::before {
      content: '' !important;
      width: 6px !important;
      height: 6px !important;
      border-right: 2px solid #92400e !important;
      border-bottom: 2px solid #92400e !important;
      transform: rotate(225deg) !important;
      transition: transform 180ms ease !important;
    }
    #analysis-hud-card:not(.collapsed) .hud-toggle::before,
    #analysis-hud-card:not(.collapsed) [data-hud-toggle]::before,
    .analysis-hud-card:not(.collapsed) .hud-toggle::before,
    .analysis-hud-card:not(.collapsed) [data-hud-toggle]::before,
    .analysis-hud:not(.collapsed) .hud-toggle::before,
    .analysis-hud:not(.collapsed) [data-hud-toggle]::before,
    #hud-chalkboard-panel:not(.collapsed) .hud-toggle::before,
    #hud-chalkboard-panel:not(.collapsed) [data-hud-toggle]::before,
    #hud-panel:not(.collapsed) .hud-toggle::before,
    #hud-panel:not(.collapsed) [data-hud-toggle]::before,
    .hud-panel:not(.collapsed) .hud-toggle::before,
    .hud-panel:not(.collapsed) [data-hud-toggle]::before,
    .hud-board:not(.collapsed) .hud-toggle::before,
    .hud-board:not(.collapsed) [data-hud-toggle]::before,
    .collapsible-hud:not(.collapsed) .hud-toggle::before,
    .collapsible-hud:not(.collapsed) [data-hud-toggle]::before,
    [data-hud]:not(.collapsed) .hud-toggle::before,
    [data-hud]:not(.collapsed) [data-hud-toggle]::before {
      transform: rotate(45deg) !important;
    }
    /* Some legacy cards use #hud-toggle-btn on the header wrapper, rather than
       on the button itself. Keep that wrapper as a normal header so only its
       nested control receives the system circular-chevron treatment. */
    #analysis-hud-card .hud-header#hud-toggle-btn,
    #analysis-hud-card .hud-header#btn-hud-toggle,
    .analysis-hud-card .hud-header#hud-toggle-btn,
    .analysis-hud-card .hud-header#btn-hud-toggle,
    .analysis-hud .hud-header#hud-toggle-btn,
    .analysis-hud .hud-header#btn-hud-toggle,
    #hud-chalkboard-panel .hud-header#hud-toggle-btn,
    #hud-chalkboard-panel .hud-header#btn-hud-toggle,
    #hud-panel .hud-header#hud-toggle-btn,
    #hud-panel .hud-header#btn-hud-toggle,
    .hud-panel .hud-header#hud-toggle-btn,
    .hud-panel .hud-header#btn-hud-toggle,
    .hud-board .hud-header#hud-toggle-btn,
    .hud-board .hud-header#btn-hud-toggle,
    .collapsible-hud .hud-header#hud-toggle-btn,
    .collapsible-hud .hud-header#btn-hud-toggle,
    [data-hud] .hud-header#hud-toggle-btn {
      order: 0 !important;
      width: auto !important;
      height: auto !important;
      min-width: 0 !important;
      min-height: 38px !important;
      flex: 1 1 auto !important;
      background: rgba(248, 250, 252, 0.72) !important;
      color: #0f172a !important;
      font-size: inherit !important;
      line-height: inherit !important;
    }
    #analysis-hud-card .hud-header#hud-toggle-btn::before,
    #analysis-hud-card .hud-header#btn-hud-toggle::before,
    .analysis-hud-card .hud-header#hud-toggle-btn::before,
    .analysis-hud-card .hud-header#btn-hud-toggle::before,
    .analysis-hud .hud-header#hud-toggle-btn::before,
    .analysis-hud .hud-header#btn-hud-toggle::before,
    #hud-chalkboard-panel .hud-header#hud-toggle-btn::before,
    #hud-chalkboard-panel .hud-header#btn-hud-toggle::before,
    #hud-panel .hud-header#hud-toggle-btn::before,
    #hud-panel .hud-header#btn-hud-toggle::before,
    .hud-panel .hud-header#hud-toggle-btn::before,
    .hud-panel .hud-header#btn-hud-toggle::before,
    .hud-board .hud-header#hud-toggle-btn::before,
    .hud-board .hud-header#btn-hud-toggle::before,
    .collapsible-hud .hud-header#hud-toggle-btn::before,
    .collapsible-hud .hud-header#btn-hud-toggle::before,
    [data-hud] .hud-header#hud-toggle-btn::before {
      content: none !important;
      display: none !important;
    }
    #analysis-hud-card .hud-header#hud-toggle-btn .hud-title,
    #analysis-hud-card .hud-header#btn-hud-toggle .hud-title,
    .analysis-hud-card .hud-header#hud-toggle-btn .hud-title,
    .analysis-hud-card .hud-header#btn-hud-toggle .hud-title,
    .analysis-hud .hud-header#hud-toggle-btn .hud-title,
    .analysis-hud .hud-header#btn-hud-toggle .hud-title,
    #hud-chalkboard-panel .hud-header#hud-toggle-btn .hud-title,
    #hud-chalkboard-panel .hud-header#btn-hud-toggle .hud-title,
    #hud-panel .hud-header#hud-toggle-btn .hud-title,
    #hud-panel .hud-header#btn-hud-toggle .hud-title,
    .hud-panel .hud-header#hud-toggle-btn .hud-title,
    .hud-panel .hud-header#btn-hud-toggle .hud-title,
    .hud-board .hud-header#hud-toggle-btn .hud-title,
    .hud-board .hud-header#btn-hud-toggle .hud-title,
    .collapsible-hud .hud-header#hud-toggle-btn .hud-title,
    .collapsible-hud .hud-header#btn-hud-toggle .hud-title,
    [data-hud] .hud-header#hud-toggle-btn .hud-title {
      display: inline-flex !important;
      align-items: center !important;
      min-width: 0 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }
    /* A few source cards retain an unclassed title span. It remains the title,
       so normalize only the first direct span in the HUD header. */
    #analysis-hud-card .hud-header > span:first-child:not(.hud-title):not(.hud-header-title),
    .analysis-hud-card .hud-header > span:first-child:not(.hud-title):not(.hud-header-title),
    .analysis-hud .hud-header > span:first-child:not(.hud-title):not(.hud-header-title),
    #hud-chalkboard-panel .hud-header > span:first-child:not(.hud-title):not(.hud-header-title),
    #hud-panel .hud-header > span:first-child:not(.hud-title):not(.hud-header-title),
    .hud-panel .hud-header > span:first-child:not(.hud-title):not(.hud-header-title),
    .hud-board .hud-header > span:first-child:not(.hud-title):not(.hud-header-title),
    .collapsible-hud .hud-header > span:first-child:not(.hud-title):not(.hud-header-title),
    [data-hud] .hud-header > span:first-child:not(.hud-title):not(.hud-header-title) {
      order: 1 !important;
      display: inline-flex !important;
      align-items: center !important;
      min-width: 0 !important;
      flex: 1 1 auto !important;
      color: #0f172a !important;
      font-size: 12.5px !important;
      font-weight: 800 !important;
      line-height: 1.2 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }
    #analysis-hud-card.collapsed .hud-header > span:first-child:not(.hud-title):not(.hud-header-title)::before,
    .analysis-hud-card.collapsed .hud-header > span:first-child:not(.hud-title):not(.hud-header-title)::before,
    .analysis-hud.collapsed .hud-header > span:first-child:not(.hud-title):not(.hud-header-title)::before,
    #hud-chalkboard-panel.collapsed .hud-header > span:first-child:not(.hud-title):not(.hud-header-title)::before,
    #hud-panel.collapsed .hud-header > span:first-child:not(.hud-title):not(.hud-header-title)::before,
    .hud-panel.collapsed .hud-header > span:first-child:not(.hud-title):not(.hud-header-title)::before,
    .hud-board.collapsed .hud-header > span:first-child:not(.hud-title):not(.hud-header-title)::before,
    .collapsible-hud.collapsed .hud-header > span:first-child:not(.hud-title):not(.hud-header-title)::before,
    [data-hud].collapsed .hud-header > span:first-child:not(.hud-title):not(.hud-header-title)::before {
      content: '' !important;
      width: 14px !important;
      height: 14px !important;
      margin-right: 7px !important;
      flex: 0 0 auto !important;
      border-radius: 999px !important;
      background: radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.96) 0 30%, transparent 32%), conic-gradient(from 0deg, #38bdf8, #f59e0b, #22c55e, #38bdf8) !important;
    }
    /* Dedicated area-proof HUD: preserve its lesson-owned title and body while
       aligning the visible header with the same compact HUD treatment. */
    #area-proof-hud .area-proof-hud-header,
    .area-proof-hud .area-proof-hud-header {
      box-sizing: border-box !important;
      min-height: 38px !important;
      width: 100% !important;
      padding: 7px 12px !important;
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      border: 0 !important;
      background: rgba(248, 250, 252, 0.72) !important;
      color: #0f172a !important;
      text-align: left !important;
    }
    /* jm_model_m13 is the only lesson with two simultaneous HUDs. Keep both
       available by stacking the secondary area-proof HUD below the main board. */
    #area-proof-hud,
    .area-proof-hud {
      left: max(var(--junior-hud-left, 18px), env(safe-area-inset-left)) !important;
      top: calc(var(--junior-hud-top, 18px) + 54px) !important;
      right: auto !important;
    }
    #area-proof-hud .area-proof-hud-title,
    .area-proof-hud .area-proof-hud-title {
      order: 1 !important;
      display: inline-flex !important;
      align-items: center !important;
      min-width: 0 !important;
      flex: 1 1 auto !important;
      color: #0f172a !important;
      font-size: 12.5px !important;
      font-weight: 800 !important;
      line-height: 1.2 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }
    #area-proof-hud.collapsed .area-proof-hud-title::before,
    .area-proof-hud.collapsed .area-proof-hud-title::before {
      content: '' !important;
      width: 14px !important;
      height: 14px !important;
      margin-right: 7px !important;
      flex: 0 0 auto !important;
      border-radius: 999px !important;
      background: radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.96) 0 30%, transparent 32%), conic-gradient(from 0deg, #38bdf8, #f59e0b, #22c55e, #38bdf8) !important;
    }
    #area-proof-hud.collapsed .area-proof-hud-chip,
    .area-proof-hud.collapsed .area-proof-hud-chip {
      display: none !important;
    }
    #area-proof-hud .area-proof-hud-arrow,
    .area-proof-hud .area-proof-hud-arrow {
      order: 2 !important;
      box-sizing: border-box !important;
      width: 26px !important;
      height: 26px !important;
      min-width: 26px !important;
      min-height: 26px !important;
      padding: 6px !important;
      flex: 0 0 26px !important;
      border-radius: 999px !important;
      background: rgba(245, 158, 11, 0.16) !important;
      color: #92400e !important;
    }
    /* Legacy analysis HUDs sometimes make the entire header a button. This is
       a header trigger, not the compact button shown at the right edge. */
    #analysis-hud-card > button.btn-hud-toggle#btn-hud-toggle,
    .analysis-hud-card > button.btn-hud-toggle#btn-hud-toggle,
    .analysis-hud > button.btn-hud-toggle#btn-hud-toggle,
    #analysis-hud-card > button.btn-hud-toggle:has(.hud-title),
    .analysis-hud-card > button.btn-hud-toggle:has(.hud-title),
    .analysis-hud > button.btn-hud-toggle:has(.hud-title) {
      order: 0 !important;
      box-sizing: border-box !important;
      width: 100% !important;
      height: auto !important;
      min-width: 0 !important;
      min-height: 38px !important;
      padding: 7px 12px !important;
      flex: 1 1 auto !important;
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      border: 0 !important;
      border-radius: 0 !important;
      background: rgba(248, 250, 252, 0.72) !important;
      color: #0f172a !important;
      font-size: inherit !important;
      line-height: inherit !important;
      text-align: left !important;
    }
    #analysis-hud-card > button.btn-hud-toggle:has(.hud-title) .hud-title,
    .analysis-hud-card > button.btn-hud-toggle:has(.hud-title) .hud-title,
    .analysis-hud > button.btn-hud-toggle:has(.hud-title) .hud-title {
      order: 1 !important;
      display: inline-flex !important;
      align-items: center !important;
      min-width: 0 !important;
      flex: 1 1 auto !important;
      color: #0f172a !important;
      font-size: 12.5px !important;
      font-weight: 800 !important;
      line-height: 1.2 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }
    /* Direct text arrows are presentation-only legacy controls. Keep their
       host click handler while rendering the system circular chevron at right. */
    #analysis-hud-card .hud-header > .hud-arrow-icon,
    .analysis-hud-card .hud-header > .hud-arrow-icon,
    .analysis-hud .hud-header > .hud-arrow-icon,
    #hud-chalkboard-panel .hud-header > .hud-arrow-icon,
    #hud-panel .hud-header > .hud-arrow-icon,
    .hud-panel .hud-header > .hud-arrow-icon,
    .hud-board .hud-header > .hud-arrow-icon,
    .collapsible-hud .hud-header > .hud-arrow-icon,
    [data-hud] .hud-header > .hud-arrow-icon,
    #analysis-hud-card > button.btn-hud-toggle .hud-arrow,
    .analysis-hud-card > button.btn-hud-toggle .hud-arrow,
    .analysis-hud > button.btn-hud-toggle .hud-arrow {
      order: 2 !important;
      box-sizing: border-box !important;
      width: 26px !important;
      height: 26px !important;
      min-width: 26px !important;
      min-height: 26px !important;
      padding: 0 !important;
      flex: 0 0 26px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      border-radius: 999px !important;
      background: rgba(245, 158, 11, 0.16) !important;
      color: transparent !important;
      font-size: 0 !important;
      line-height: 1 !important;
    }
    #analysis-hud-card .hud-header > .hud-arrow-icon::before,
    .analysis-hud-card .hud-header > .hud-arrow-icon::before,
    .analysis-hud .hud-header > .hud-arrow-icon::before,
    #hud-chalkboard-panel .hud-header > .hud-arrow-icon::before,
    #hud-panel .hud-header > .hud-arrow-icon::before,
    .hud-panel .hud-header > .hud-arrow-icon::before,
    .hud-board .hud-header > .hud-arrow-icon::before,
    .collapsible-hud .hud-header > .hud-arrow-icon::before,
    [data-hud] .hud-header > .hud-arrow-icon::before,
    #analysis-hud-card > button.btn-hud-toggle .hud-arrow::before,
    .analysis-hud-card > button.btn-hud-toggle .hud-arrow::before,
    .analysis-hud > button.btn-hud-toggle .hud-arrow::before {
      content: '' !important;
      width: 6px !important;
      height: 6px !important;
      border-right: 2px solid #92400e !important;
      border-bottom: 2px solid #92400e !important;
      transform: rotate(225deg) !important;
    }
    #analysis-hud-card:not(.collapsed) > button.btn-hud-toggle .hud-arrow::before,
    .analysis-hud-card:not(.collapsed) > button.btn-hud-toggle .hud-arrow::before,
    .analysis-hud:not(.collapsed) > button.btn-hud-toggle .hud-arrow::before {
      transform: rotate(45deg) !important;
    }
    /* The platform supplies the single collapsed-state title dot. */
    #hud-chalkboard-panel#hud-chalkboard-panel.collapsed .hud-title-icon,
    #hud-panel.collapsed .hud-title-icon,
    .hud-panel.collapsed .hud-title-icon,
    .hud-board.collapsed .hud-title-icon,
    .collapsible-hud.collapsed .hud-title-icon,
    [data-hud].collapsed .hud-title-icon {
      display: none !important;
    }
    @media (max-width: 600px) {
      #analysis-hud-card .hud-toggle,
      #analysis-hud-card [data-hud-toggle],
      .analysis-hud-card .hud-toggle,
      .analysis-hud-card [data-hud-toggle],
      .analysis-hud .hud-toggle,
      .analysis-hud [data-hud-toggle],
      #hud-chalkboard-panel .hud-toggle,
      #hud-chalkboard-panel [data-hud-toggle],
      #hud-panel .hud-toggle,
      #hud-panel [data-hud-toggle],
      .hud-panel .hud-toggle,
      .hud-panel [data-hud-toggle],
      .hud-board .hud-toggle,
      .hud-board [data-hud-toggle],
      .collapsible-hud .hud-toggle,
      .collapsible-hud [data-hud-toggle],
      [data-hud] .hud-toggle,
      [data-hud] [data-hud-toggle] {
        width: 24px !important;
        height: 24px !important;
        min-width: 24px !important;
        min-height: 24px !important;
        flex-basis: 24px !important;
      }
    }
    @media (max-width: 420px) {
      #analysis-hud-card .hud-toggle,
      #analysis-hud-card [data-hud-toggle],
      .analysis-hud-card .hud-toggle,
      .analysis-hud-card [data-hud-toggle],
      .analysis-hud .hud-toggle,
      .analysis-hud [data-hud-toggle],
      #hud-chalkboard-panel .hud-toggle,
      #hud-chalkboard-panel [data-hud-toggle],
      #hud-panel .hud-toggle,
      #hud-panel [data-hud-toggle],
      .hud-panel .hud-toggle,
      .hud-panel [data-hud-toggle],
      .hud-board .hud-toggle,
      .hud-board [data-hud-toggle],
      .collapsible-hud .hud-toggle,
      .collapsible-hud [data-hud-toggle],
      [data-hud] .hud-toggle,
      [data-hud] [data-hud-toggle] {
        width: 22px !important;
        height: 22px !important;
        min-width: 22px !important;
        min-height: 22px !important;
        flex-basis: 22px !important;
      }
    }
  `;

  const HUD_SAFE_INSET_BY_CARD_ID = {
    j7a_m11: { top: 4, compactTop: 4, smallTop: 4 },
    j8a_m14: { top: 20, compactTop: 14, smallTop: 12 },
    jm_model_m17: { top: 20, compactTop: 14, smallTop: 12 },
    jm_model_m18: { top: 88, compactTop: 60, smallTop: 48 },
    jm_model_m23: { top: 14, compactTop: 12, smallTop: 10 }
  };

  const installUnifiedJuniorHudPresentation = (host, cardId) => {
    if (!host || !JUNIOR_HUD_CARD_IDS.has(cardId)) return () => {};

    const inset = HUD_SAFE_INSET_BY_CARD_ID[cardId] || {};
    host.dataset.unifiedJuniorHud = 'half-angle';
    host.style.setProperty('--junior-hud-left', '18px');
    host.style.setProperty('--junior-hud-top', `${inset.top ?? 18}px`);
    host.style.setProperty('--junior-hud-left-compact', '12px');
    host.style.setProperty('--junior-hud-top-compact', `${inset.compactTop ?? 12}px`);
    host.style.setProperty('--junior-hud-left-small', '10px');
    host.style.setProperty('--junior-hud-top-small', `${inset.smallTop ?? 10}px`);
    // Source SVG layers occasionally establish their own stacking contexts.
    // Keep lesson HUDs above every canvas/SVG hit surface so the visible toggle
    // is also the element that receives mouse and touch input.
    host.style.setProperty('--junior-hud-z-index', '2147480000');

    const observers = new Map();
    const timers = new Set();
    let disposed = false;

    const installStyle = root => {
      if (!root || typeof root.appendChild !== 'function') return;
      if (!root.querySelector?.('style[data-unified-junior-hud-presentation]')) {
        const style = document.createElement('style');
        style.dataset.unifiedJuniorHudPresentation = 'half-angle';
        style.textContent = UNIFIED_JUNIOR_HUD_STYLE;
        root.appendChild(style);
      }
      if (typeof MutationObserver === 'undefined' || observers.has(root)) return;
      const observer = new MutationObserver(() => installAllRoots());
      observer.observe(root, { childList: true, subtree: true });
      observers.set(root, observer);
    };

    const installAllRoots = () => {
      if (disposed) return;
      const visit = root => {
        if (!root) return;
        installStyle(root);
        root.querySelectorAll?.('*').forEach(node => {
          if (node.shadowRoot) visit(node.shadowRoot);
        });
      };
      visit(host);
    };

    installAllRoots();
    [0, 80, 180, 360, 720].forEach(delay => {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        installAllRoots();
      }, delay);
      timers.add(timer);
    });

    return () => {
      disposed = true;
      observers.forEach(observer => observer.disconnect());
      timers.forEach(timer => window.clearTimeout(timer));
    };
  };

  const installUnifiedHudTouchFallback = host => {
    if (!host) return () => {};

    const hudSelector = [
      '#analysis-hud-card',
      '.analysis-hud-card',
      '.analysis-hud',
      '#hud-chalkboard-panel',
      '#hud-panel',
      '.hud-panel',
      '.hud-board',
      '.collapsible-hud',
      '#area-proof-hud',
      '.area-proof-hud',
      '.hud-card',
      '[data-hud]'
    ].join(',');
    const triggerSelector = [
      '#btn-hud-toggle',
      '#hud-toggle-btn',
      '.btn-hud-toggle',
      '.hud-control-btn',
      '.hud-toggle',
      '[data-hud-toggle]',
      '.hud-header',
      '.area-proof-hud-header'
    ].join(',');
    let lastToggleAt = 0;
    let syntheticClick = false;

    const getPoint = event => {
      const touchLists = [event.changedTouches, event.touches, event.targetTouches];
      for (const list of touchLists) {
        if (!list || !list.length) continue;
        const touch = typeof list.item === 'function' ? list.item(0) : list[0];
        if (touch && typeof touch.clientX === 'number' && typeof touch.clientY === 'number') {
          return { x: touch.clientX, y: touch.clientY };
        }
      }
      if (typeof event.clientX === 'number' && typeof event.clientY === 'number') {
        return { x: event.clientX, y: event.clientY };
      }
      return null;
    };

    const rectContains = (rect, point) => (
      rect &&
      point &&
      point.x >= rect.left &&
      point.x <= rect.right &&
      point.y >= rect.top &&
      point.y <= rect.bottom
    );

    const queryDeep = (root, selector) => {
      const found = [];
      const visit = node => {
        if (!node || typeof node.querySelectorAll !== 'function') return;
        found.push(...Array.from(node.querySelectorAll(selector)));
        node.querySelectorAll('*').forEach(child => {
          if (child.shadowRoot) visit(child.shadowRoot);
        });
      };
      visit(root);
      return found;
    };

    const queryWithin = (root, selector) => {
      if (!root) return [];
      const found = typeof root.querySelectorAll === 'function'
        ? Array.from(root.querySelectorAll(selector))
        : [];
      if (root.shadowRoot) {
        found.push(...queryDeep(root.shadowRoot, selector));
      }
      return found;
    };

    const getVisibleHuds = () => queryDeep(host, hudSelector).filter(hud => {
      const rect = hud.getBoundingClientRect();
      return rect.width > 24 && rect.height > 24 && rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
    });

    const normalizeHudNode = hud => {
      if (!hud || !hud.style) return;
      hud.style.setProperty('pointer-events', 'auto', 'important');
      hud.style.setProperty('touch-action', 'manipulation', 'important');
      const zIndex = Number.parseInt(window.getComputedStyle(hud).zIndex, 10);
      if (!Number.isFinite(zIndex) || zIndex < 80) {
        hud.style.setProperty('z-index', '120', 'important');
      }
      queryWithin(hud, triggerSelector).forEach(node => {
        node.style?.setProperty('pointer-events', 'auto', 'important');
        node.style?.setProperty('touch-action', 'manipulation', 'important');
        node.style?.setProperty('-webkit-tap-highlight-color', 'transparent', 'important');
      });
      wireHudToggle(hud);
    };

    const wireHudToggle = hud => {
      if (!hud || hud.dataset.unifiedHudToggleBound === 'true') return;
      const triggers = queryWithin(hud, triggerSelector);
      const trigger = triggers.find(node => node.matches?.(
        'button, [role="button"], [data-hud-toggle], .hud-control-btn, .btn-hud-toggle, .hud-toggle'
      )) || triggers[0];
      const header = queryWithin(hud, '.hud-header, .area-proof-hud-header')[0] || trigger;
      if (!header || !trigger) return;
      hud.dataset.unifiedHudToggleBound = 'true';
      header.addEventListener('click', event => {
        if (syntheticClick) return;
        if (typeof event.button === 'number' && event.button !== 0) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        runToggle({ hud, trigger });
      }, true);
    };

    const findHudHit = event => {
      const point = getPoint(event);
      if (!point) return null;
      for (const hud of getVisibleHuds()) {
        normalizeHudNode(hud);
        const triggers = queryWithin(hud, triggerSelector);
        const preferredTrigger = triggers.find(trigger => trigger.matches?.(
          'button, [role="button"], [data-hud-toggle], .hud-control-btn, .btn-hud-toggle, .hud-toggle'
        )) || triggers[0] || hud;
        const matchedTriggers = triggers.filter(trigger => rectContains(trigger.getBoundingClientRect(), point));
        if (matchedTriggers.length) {
          const interactiveTrigger = matchedTriggers.find(trigger => trigger.matches?.(
            'button, [role="button"], [data-hud-toggle], .hud-control-btn, .btn-hud-toggle, .hud-toggle'
          ));
          return { hud, trigger: interactiveTrigger || matchedTriggers[0] };
        }
        const rect = hud.getBoundingClientRect();
        const topBar = {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: Math.min(rect.bottom, rect.top + 52)
        };
        if (rectContains(topBar, point)) {
          return { hud, trigger: preferredTrigger };
        }
      }
      return null;
    };

    const runToggle = hit => {
      const trigger = hit?.trigger || hit?.hud;
      if (!trigger || typeof trigger.click !== 'function') return;
      const hud = hit?.hud || trigger.closest?.(hudSelector);
      const readCollapsed = () => Boolean(
        hud &&
        (hud.classList.contains('collapsed') || hud.getAttribute('aria-expanded') === 'false')
      );
      const syncHudState = () => {
        if (!hud) return;
        const collapsed = hud.classList.contains('collapsed');
        hud.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        queryWithin(hud, triggerSelector).forEach(node => {
          node.setAttribute?.('aria-expanded', collapsed ? 'false' : 'true');
          node.setAttribute?.('title', collapsed ? '展开板书' : '收起板书');
        });
      };
      const beforeCollapsed = readCollapsed();
      const beforeTriggerState = trigger.getAttribute?.('aria-expanded');
      syntheticClick = true;
      try {
        trigger.click();
      } finally {
        window.setTimeout(() => {
          syntheticClick = false;
        }, 0);
      }
      window.requestAnimationFrame(() => {
        if (!hud) return;
        const nativeTriggerState = trigger.getAttribute?.('aria-expanded');
        // A few source lessons update only their button's aria state.  Keep the
        // presentational collapsed class in sync so the expanded lesson content
        // is not hidden by the shared HUD CSS.
        if (nativeTriggerState !== beforeTriggerState && nativeTriggerState !== null) {
          const collapsed = nativeTriggerState !== 'true';
          hud.classList.toggle('collapsed', collapsed);
          hud.classList.toggle('expanded', !collapsed);
          syncHudState();
          window.dispatchEvent(new Event('resize'));
          window.visualViewport?.dispatchEvent?.(new Event('resize'));
          return;
        }
        if (readCollapsed() !== beforeCollapsed) return;
        hud.classList.toggle('collapsed');
        syncHudState();
        window.dispatchEvent(new Event('resize'));
        window.visualViewport?.dispatchEvent?.(new Event('resize'));
      });
    };

    const handleHudGesture = event => {
      if (syntheticClick) return;
      const now = Date.now();
      if (now - lastToggleAt < 360) return;
      const hit = findHudHit(event);
      if (!hit) return;
      // Use one forwarded click for both the title bar and the lesson-owned
      // button. The native click that follows pointerdown is suppressed below,
      // preventing inconsistent double toggles in embedded Shadow DOM scenes.
      lastToggleAt = now;
      if (event.cancelable) event.preventDefault();
      event.stopPropagation();
      runToggle(hit);
    };

    const handleHudFollowupClick = event => {
      if (syntheticClick) return;
      const now = Date.now();
      if (now - lastToggleAt > 360) return;
      const hit = findHudHit(event);
      if (!hit) return;
      if (event.cancelable) event.preventDefault();
      event.stopPropagation();
    };

    const observer = typeof MutationObserver !== 'undefined'
      ? new MutationObserver(() => getVisibleHuds().forEach(normalizeHudNode))
      : null;
    getVisibleHuds().forEach(normalizeHudNode);
    observer?.observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    return () => {
      observer?.disconnect();
    };
  };

  const CardVisualStage = ({ card, sceneEntry, className = '', compact = false, shortHeight = false, tinyLandscape = false, layout = null, externalPanelRef = null }) => {
    const hostRef = useRef(null);
    const [sceneStatus, setSceneStatus] = useState('fallback');
    const isStacked = layout?.stacked === true;
    const radiusClass = isStacked ? 'rounded-[22px]' : tinyLandscape ? 'rounded-[24px]' : shortHeight ? 'rounded-[30px]' : compact ? 'rounded-[40px]' : 'rounded-[60px]';
    const minHeightClass = isStacked ? 'min-h-0' : tinyLandscape ? 'min-h-0' : shortHeight ? 'min-h-[300px]' : compact ? 'min-h-[360px]' : 'min-h-[420px]';

    useEffect(() => {
      let cancelled = false;
      let teardown = null;
      let removeUnifiedHudPresentation = () => {};
      const forceSceneResize = () => {
        const host = hostRef.current;
        if (!host) return;
        host.querySelectorAll('canvas, svg').forEach(node => {
          node.style.maxWidth = '100%';
          node.style.maxHeight = '100%';
        });
        window.dispatchEvent(new Event('resize'));
        window.visualViewport?.dispatchEvent?.(new Event('resize'));
      };
      const scheduleResizeSweep = () => {
        [0, 80, 180, 360, 720].forEach(delay => {
          window.setTimeout(() => {
            if (!cancelled) forceSceneResize();
          }, delay);
        });
      };

      const showSceneLoadIssue = message => {
        if (externalPanelRef?.current) {
          externalPanelRef.current.innerHTML = `
            <div style="height:100%;display:flex;align-items:center;justify-content:center;padding:18px;color:#94a3b8;font:600 13px/1.7 Inter,'Microsoft YaHei UI',sans-serif;text-align:left;">
              <div style="width:100%;border:1px solid rgba(148,163,184,.24);background:rgba(15,23,42,.35);border-radius:16px;padding:14px;">
                ${message}
              </div>
            </div>
          `;
        }
      };

      if (hostRef.current) hostRef.current.innerHTML = '';
      if (externalPanelRef?.current) externalPanelRef.current.innerHTML = '';
      setSceneStatus('fallback');

      if (!card || !sceneEntry) {
        return () => {};
      }

      (async () => {
        setSceneStatus('loading');

        const config = await fetchJsonSafe(`${sceneEntry.folder}/scene.config.json`);
        if (cancelled || !config) {
          if (!cancelled) setSceneStatus('fallback');
          return;
        }

        const scriptPath = `${sceneEntry.folder}/${config.entry || 'scene.js'}`;
        try {
          await loadSceneScript(scriptPath);
        } catch (error) {
          console.error('Failed to load math scene script:', card?.id, scriptPath, error);
          if (!cancelled) {
            showSceneLoadIssue('课件资源加载失败，请刷新页面后重试。');
            setSceneStatus('fallback');
          }
          return;
        }

        if (cancelled || !hostRef.current) return;

        let definition = window.MATH_VISUAL_SCENES?.[card.id];
        if (!definition || typeof definition.mount !== 'function') {
          try {
            const separator = scriptPath.includes('?') ? '&' : '?';
            await loadSceneScript(`${scriptPath}${separator}retry=${Date.now()}`);
            definition = window.MATH_VISUAL_SCENES?.[card.id];
          } catch (error) {
            console.error('Retry failed for math scene script:', card?.id, scriptPath, error);
          }
        }
        if (!definition || typeof definition.mount !== 'function') {
          console.error('Math scene definition missing after script load:', card?.id, scriptPath);
          showSceneLoadIssue('课件引擎已请求但没有注册当前卡片。服务器可能仍在返回旧版 source-html-adapter/scene.js，请重新上传 dist-math/visualizations/engines/source-html-adapter/scene.js 并刷新缓存。');
          setSceneStatus('fallback');
          return;
        }

        const container = hostRef.current;
        const context = {
          card,
          config,
          sceneEntry,
          layout,
          externalPanel: externalPanelRef?.current || null
        };

        try {
          container.innerHTML = '';
          definition.mount(container, context);
          removeUnifiedHudPresentation = installUnifiedJuniorHudPresentation(container, card.id);
          teardown = () => {
            removeUnifiedHudPresentation();
            if (typeof definition.unmount === 'function') {
              definition.unmount(container, context);
            } else {
              container.innerHTML = '';
            }
          };
          if (!cancelled) {
            setSceneStatus('ready');
            scheduleResizeSweep();
          }
        } catch (error) {
          container.innerHTML = '';
          if (externalPanelRef?.current) externalPanelRef.current.innerHTML = '';
          console.error('Failed to mount math scene:', card?.id, error);
          showSceneLoadIssue('课件加载出现问题，请刷新页面后重试。');
          if (!cancelled) setSceneStatus('fallback');
        }
      })();

      return () => {
        cancelled = true;
        if (teardown) {
          teardown();
        } else if (hostRef.current) {
          removeUnifiedHudPresentation();
          hostRef.current.innerHTML = '';
        }
        if (externalPanelRef?.current) {
          externalPanelRef.current.innerHTML = '';
        }
      };
    }, [card?.id, sceneEntry?.folder, externalPanelRef]);

    useEffect(() => {
      const host = hostRef.current;
      if (!host || typeof ResizeObserver === 'undefined') return () => {};
      let frame = null;
      const dispatchResize = () => {
        if (frame) cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          frame = null;
          window.dispatchEvent(new Event('resize'));
        });
      };
      const observer = new ResizeObserver(dispatchResize);
      observer.observe(host);
      if (host.parentElement) observer.observe(host.parentElement);
      window.visualViewport?.addEventListener('resize', dispatchResize);
      return () => {
        if (frame) cancelAnimationFrame(frame);
        observer.disconnect();
        window.visualViewport?.removeEventListener('resize', dispatchResize);
      };
    }, [card?.id, sceneEntry?.folder]);

    useEffect(() => {
      const host = hostRef.current;
      if (!host || sceneStatus !== 'ready') return () => {};
      // jm_model_m14 mounts its own scoped mouse/touch bridge. Adding the
      // generic fallback as well forwards one physical click twice, leaving
      // the board collapsed after an open-close toggle pair.
      if (card?.id === 'jm_model_m14') return () => {};
      return installUnifiedHudTouchFallback(host);
    }, [card?.id, sceneEntry?.folder, sceneStatus]);

    return (
      <div
        data-math-scene-stage="true"
        data-math-layout-profile={layout?.profile || 'standard'}
        data-math-layout-mode={layout?.mode || 'standalone'}
        data-math-layout-stack={isStacked ? 'stacked' : 'side'}
        className={`flex-1 ${radiusClass} bg-zinc-950/50 border border-white/5 relative overflow-hidden group ${minHeightClass} ${className}`}
        style={{
          '--bio-touch-target': `${layout?.touchTarget || 44}px`,
          '--bio-scene-panel-width': `${layout?.panelWidth || 320}px`,
          '--bio-scene-panel-gap': `${layout?.panelGap || 24}px`,
          touchAction: 'none',
          overscrollBehavior: 'none',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${
            sceneStatus === 'ready' ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          {card?.engine === 'dna' ? (
            <DNAEngine />
          ) : (
            <div className="w-full h-full">
              <img
                src={resolveMathMediaThumbnailPath(card?.image, card?.fallbackImage || 'assets/media/math_card_bg_platinum.webp', { width: 1280 })}
                onError={event => handleMathMediaError(event, card?.fallbackImage || 'assets/media/math_card_bg_platinum.webp')}
                className="w-full h-full object-cover"
                alt=""
              />
            </div>
          )}
        </div>
        <div
          ref={hostRef}
          className={`absolute inset-0 transition-opacity duration-500 ${
            sceneStatus === 'fallback' ? 'opacity-0' : 'opacity-100'
          }`}
        />
        {sceneStatus === 'loading' ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/45 px-6 pointer-events-none backdrop-blur-[2px]">
            <div className="w-full max-w-sm rounded-[18px] border border-slate-300/15 bg-zinc-950/80 p-4 text-center shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
              <div className="text-[11px] font-black tracking-[0.22em] text-slate-200 uppercase">课件资源加载中</div>
              <div className="mt-2 text-[13px] font-bold leading-6 text-white/78">首次打开需要加载交互引擎与本地资源，请稍候。</div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-2/5 rounded-full bg-slate-300 shadow-[0_0_18px_rgba(203,213,225,0.55)] animate-pulse" />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  Object.assign(window.MathApp, {
    Icon,
    DNAEngine,
    CardVisualStage
  });
})();
