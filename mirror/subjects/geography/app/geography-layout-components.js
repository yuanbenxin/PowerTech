/*
  Shared layout and card presentation components.
*/

window.GeographyApp = window.GeographyApp || {};

(() => {
  const app = window.GeographyApp;
  const {
    useLandscapeViewport,
    buildCoursewareGuide,
    LANDING_PANELS,
    CardVisualStage,
    Icon,
    fetchJsonSafe,
    resolveGeographyMediaThumbnailPath,
    handleGeographyMediaError,
    useTouchCardActivation
  } = app;

  const SCENE_PANEL_READOUT_CSS = `
    [data-bio-scene-controls="true"] {
      --geo-panel-readout-size: clamp(10px, calc(var(--bio-scene-panel-width, 320px) / 28), 12px);
      --geo-panel-readout-small-size: clamp(9px, calc(var(--bio-scene-panel-width, 320px) / 34), 10.5px);
      --geo-panel-touch-target: max(38px, min(var(--bio-touch-target, 44px), 44px));
      --geo-panel-card-radius: clamp(10px, calc(var(--bio-scene-panel-width, 320px) / 24), 14px);
      --geo-panel-card-bg: linear-gradient(180deg, rgba(15, 23, 42, 0.86), rgba(2, 6, 23, 0.72));
      --geo-panel-card-border: rgba(148, 163, 184, 0.18);
      --geo-panel-card-inner: rgba(8, 20, 33, 0.68);
      --geo-panel-card-inner-border: rgba(148, 163, 184, 0.15);
      --geo-panel-accent: #facc15;
      --geo-panel-accent-2: #38bdf8;
      display: flex !important;
      flex-direction: column !important;
      gap: clamp(8px, 1.25vh, 12px) !important;
      padding: clamp(8px, 1.5vh, 12px) !important;
      border-color: rgba(148, 163, 184, 0.12) !important;
      background:
        linear-gradient(180deg, rgba(15, 23, 42, 0.9), rgba(2, 6, 23, 0.92)) !important;
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.05),
        0 24px 70px rgba(0, 0, 0, 0.24) !important;
      color: #e5e7eb !important;
      overflow-x: hidden !important;
      overflow-y: auto !important;
      overscroll-behavior: contain !important;
      -webkit-overflow-scrolling: touch !important;
      scrollbar-width: none !important;
    }
    [data-bio-scene-controls="true"]::-webkit-scrollbar {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
    }
    [data-bio-scene-controls="true"] > * {
      width: 100% !important;
      min-width: 0 !important;
    }
    [data-bio-scene-controls="true"] .geo-source-workbench {
      width: 100% !important;
      min-width: 0 !important;
      display: flex !important;
      flex-direction: column !important;
      gap: clamp(9px, 1.35vh, 12px) !important;
    }
    [data-bio-scene-controls="true"] .geo-source-panel-card,
    [data-bio-scene-controls="true"] :is(
      .geo-op-panel,
      .geo-contour-panel,
      .geo-world-panel,
      .geo-climate-panel,
      .geo-pop-panel,
      .geo-coordinate-panel
    ) {
      width: 100% !important;
      min-width: 0 !important;
      position: relative !important;
      border: 1px solid var(--geo-panel-card-border) !important;
      border-radius: var(--geo-panel-card-radius) !important;
      background: var(--geo-panel-card-bg) !important;
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.045),
        0 14px 30px rgba(0, 0, 0, 0.12) !important;
    }
    [data-bio-scene-controls="true"] .geo-source-panel-card {
      padding: clamp(10px, 1.55vh, 14px) !important;
      overflow: hidden !important;
    }
    [data-bio-scene-controls="true"] .geo-source-panel-card::before,
    [data-bio-scene-controls="true"] :is(
      .geo-op-panel,
      .geo-contour-panel,
      .geo-world-panel,
      .geo-climate-panel,
      .geo-pop-panel,
      .geo-coordinate-panel
    )::before {
      content: "";
      position: absolute;
      left: 12px;
      right: 12px;
      top: 0;
      height: 1px;
      pointer-events: none;
      background: linear-gradient(90deg, transparent, rgba(250, 204, 21, 0.5), rgba(56, 189, 248, 0.42), transparent);
      opacity: 0.75;
    }
    [data-bio-scene-controls="true"] .geo-source-panel-node {
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
    }
    [data-bio-scene-controls="true"] :is(
      .geo-op-card,
      .geo-world-op-card,
      .geo-climate-op-card,
      .geo-pop-op-card,
      .geo-coordinate-op-card,
      .geo-contour-op-card,
      .control-group,
      .panel-card,
      .edu-card,
      .factor-card,
      .timeline-node,
      .metric-card,
      .stat-card,
      .legend-box,
      .info-card,
      .feedback,
      .readout,
      .slider-group
    ) {
      min-width: 0 !important;
      border-radius: 8px !important;
      border: 1px solid var(--geo-panel-card-inner-border) !important;
      background: var(--geo-panel-card-inner) !important;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.035) !important;
    }
    [data-bio-scene-controls="true"] :is(
      .tabs,
      .segmented,
      .segmented-controls,
      .btn-group,
      .btn-row,
      .mode-grid,
      .tool-grid,
      .model-grid,
      .decision-grid,
      .view-grid,
      .layer-grid,
      .region-list,
      .boundary-list,
      .river-list
    ) {
      min-width: 0 !important;
      display: grid !important;
      grid-template-columns: repeat(auto-fit, minmax(min(116px, 100%), 1fr)) !important;
      gap: 7px !important;
    }
    [data-bio-scene-controls="true"] :is(
      .panel-kicker,
      .panel-title,
      .section-title,
      .chart-title,
      .geo-world-title,
      .geo-climate-title,
      .geo-pop-title,
      .geo-coordinate-title,
      .geo-contour-title
    ) {
      max-width: 100% !important;
      min-width: 0 !important;
      color: #f8fafc !important;
      line-height: 1.22 !important;
      overflow-wrap: anywhere !important;
      word-break: keep-all !important;
    }
    [data-bio-scene-controls="true"] :is(
      button,
      select,
      .btn,
      .tab-btn,
      .mode-btn,
      .tool-btn,
      .model-btn,
      .toggle-btn,
      .view-btn,
      .region-btn,
      .line-btn,
      .river-btn,
      .layer-btn,
      .level-btn,
      .seg-btn,
      .quiz-opt-btn
    ) {
      appearance: none !important;
      border: 1px solid rgba(148, 163, 184, 0.18) !important;
      border-radius: 8px !important;
      background: rgba(15, 23, 42, 0.74) !important;
      color: #e0f2fe !important;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.035) !important;
      transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease, color 0.16s ease !important;
    }
    [data-bio-scene-controls="true"] :is(
      button:hover,
      .btn:hover,
      .tab-btn:hover,
      .mode-btn:hover,
      .tool-btn:hover,
      .model-btn:hover,
      .toggle-btn:hover,
      .view-btn:hover,
      .region-btn:hover,
      .line-btn:hover,
      .river-btn:hover,
      .layer-btn:hover,
      .level-btn:hover,
      .seg-btn:hover,
      .quiz-opt-btn:hover
    ) {
      border-color: rgba(56, 189, 248, 0.46) !important;
      background: rgba(14, 42, 62, 0.82) !important;
      transform: translateY(-1px);
    }
    [data-bio-scene-controls="true"] :is(
      button:active,
      .btn:active,
      .tab-btn:active,
      .mode-btn:active,
      .tool-btn:active,
      .model-btn:active,
      .toggle-btn:active,
      .view-btn:active,
      .region-btn:active,
      .line-btn:active,
      .river-btn:active,
      .layer-btn:active,
      .level-btn:active,
      .seg-btn:active,
      .quiz-opt-btn:active
    ) {
      transform: translateY(0);
    }
    [data-bio-scene-controls="true"] :is(
      button.active,
      .btn.active,
      .tab-btn.active,
      .mode-btn.active,
      .tool-btn.active,
      .model-btn.active,
      .toggle-btn.active,
      .view-btn.active,
      .region-btn.active,
      .line-btn.active,
      .river-btn.active,
      .layer-btn.active,
      .level-btn.active,
      .seg-btn.active,
      .quiz-opt-btn.active,
      [aria-pressed="true"]
    ) {
      border-color: rgba(250, 204, 21, 0.55) !important;
      background: linear-gradient(135deg, #facc15, #38bdf8) !important;
      color: #07111d !important;
      box-shadow: 0 0 18px rgba(56, 189, 248, 0.12) !important;
    }
    [data-bio-scene-controls="true"] input[type="range"] {
      width: 100% !important;
      accent-color: var(--geo-panel-accent) !important;
    }
    [data-bio-scene-controls="true"] :is(
      .geo-op-panel,
      .geo-contour-panel,
      .geo-world-panel,
      .geo-climate-panel,
      .geo-pop-panel,
      .geo-coordinate-panel
    ) {
      overflow-x: hidden !important;
      overflow-y: auto !important;
      overscroll-behavior: contain !important;
      -webkit-overflow-scrolling: touch !important;
      scrollbar-width: none !important;
    }
    [data-bio-scene-controls="true"] :is(
      .geo-op-panel,
      .geo-contour-panel,
      .geo-world-panel,
      .geo-climate-panel,
      .geo-pop-panel,
      .geo-coordinate-panel
    )::-webkit-scrollbar {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
    }
    [data-bio-scene-controls="true"] :is(
      button,
      select,
      [role="button"],
      .geo-op-button,
      .geo-op-select,
      .geo-contour-button,
      .geo-world-button,
      .geo-world-select,
      .geo-climate-button,
      .geo-climate-select,
      .geo-pop-button,
      .geo-pop-select,
      .geo-coordinate-button,
      .geo-coordinate-select
    ) {
      min-height: var(--geo-panel-touch-target) !important;
      touch-action: manipulation !important;
      -webkit-tap-highlight-color: transparent !important;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
      word-break: keep-all !important;
    }
    [data-bio-scene-controls="true"] :is(
      .geo-slider-head,
      .geo-contour-slider-head,
      .geo-world-slider-head,
      .geo-climate-slider-head,
      .geo-pop-slider-head,
      .geo-coordinate-slider-head,
      .slider-group label
    ) {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) minmax(6em, 48%) !important;
      align-items: center !important;
      gap: 8px !important;
      min-width: 0 !important;
    }
    [data-bio-scene-controls="true"] :is(
      .geo-slider-head,
      .geo-contour-slider-head,
      .geo-world-slider-head,
      .geo-climate-slider-head,
      .geo-pop-slider-head,
      .geo-coordinate-slider-head
    ) > :first-child {
      min-width: 0 !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
    }
    [data-bio-scene-controls="true"] .slider-group label > :first-child {
      min-width: 0 !important;
      overflow: visible !important;
      text-overflow: clip !important;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
      word-break: keep-all !important;
    }
    [data-bio-scene-controls="true"] :is(
      .geo-slider-value,
      .geo-contour-value,
      .geo-world-value,
      .geo-climate-value,
      .geo-pop-value,
      .geo-coordinate-value,
      .geo-orbit-stat-value,
      .geo-contour-stat-value,
      .geo-world-stat-value,
      .geo-climate-stat-value,
      .geo-pop-stat strong,
      .geo-coordinate-stat strong,
      .geo-contour-pill strong,
      .geo-world-pill strong,
      .geo-climate-pill strong,
      .geo-pop-pill strong,
      .geo-coordinate-pill strong,
      .val-badge,
      .hud-value,
      .time-year,
      .event-badge,
      .vector-speed,
      [data-stat-date],
      [data-stat-season],
      [data-stat-lat],
      [data-rot-value],
      [data-orbit-value],
      [data-interval-value],
      [data-clip-value],
      [data-topo-value],
      [data-month-value],
      [data-offset-value],
      [data-year-value],
      [data-height-value],
      [data-threshold-value],
      [data-lat-value],
      [data-lon-value],
      [data-panel-temp],
      [data-panel-month],
      [data-panel-year],
      [data-panel-threshold],
      [data-hud-year],
      [data-hud-mode]
    ) {
      max-width: 100% !important;
      min-width: 0 !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
      word-break: keep-all !important;
      overflow-wrap: normal !important;
      line-height: 1.15 !important;
      font-size: var(--geo-panel-readout-size) !important;
      font-variant-numeric: tabular-nums !important;
      font-feature-settings: "tnum" 1, "lnum" 1 !important;
    }
    [data-bio-scene-controls="true"] :is(
      .geo-slider-value,
      .geo-contour-value,
      .geo-world-value,
      .geo-climate-value,
      .geo-pop-value,
      .geo-coordinate-value,
      .val-badge
    ) {
      justify-self: end !important;
      text-align: right !important;
    }
    [data-bio-scene-controls="true"] :is(
      .geo-contour-pill strong,
      .geo-world-pill strong,
      .geo-climate-pill strong,
      .geo-pop-pill strong,
      .geo-coordinate-pill strong,
      .geo-pop-stat strong,
      .geo-coordinate-stat strong
    ) {
      font-size: var(--geo-panel-readout-small-size) !important;
    }
    :is([data-geo-scene-controls="true"], [data-bio-scene-controls="true"]) {
      --geo-panel-readout-size: clamp(10.5px, calc(var(--bio-scene-panel-width, 320px) / 29), 12px);
      --geo-panel-readout-small-size: clamp(9.5px, calc(var(--bio-scene-panel-width, 320px) / 36), 10.5px);
      --geo-panel-button-font-size: clamp(10px, calc(var(--bio-scene-panel-width, 320px) / 31), 12px);
      --geo-panel-touch-target: max(36px, min(var(--bio-touch-target, 42px), 42px));
      gap: clamp(12px, 1.8vh, 16px) !important;
      padding: clamp(8px, 1.35vh, 10px) !important;
      border-color: transparent !important;
      background: transparent !important;
      box-shadow: none !important;
    }
    :is([data-geo-scene-controls="true"], [data-bio-scene-controls="true"]) .geo-source-workbench {
      gap: clamp(12px, 1.7vh, 16px) !important;
      padding-bottom: 8px !important;
    }
    :is([data-geo-scene-controls="true"], [data-bio-scene-controls="true"]) .geo-source-panel-card {
      padding: clamp(13px, 1.9vh, 16px) !important;
      margin: 0 !important;
      border-radius: 8px !important;
      background:
        linear-gradient(180deg, rgba(15, 23, 42, 0.82), rgba(8, 13, 28, 0.74)) !important;
    }
    :is([data-geo-scene-controls="true"], [data-bio-scene-controls="true"]) .geo-source-panel-shell {
      padding: 0 !important;
      border-color: transparent !important;
      background: transparent !important;
      box-shadow: none !important;
    }
    :is([data-geo-scene-controls="true"], [data-bio-scene-controls="true"]) .geo-source-panel-shell::before {
      display: none !important;
    }
    :is([data-geo-scene-controls="true"], [data-bio-scene-controls="true"]) :is(
      .control-group,
      .panel-card,
      .edu-card,
      .factor-card,
      .metric-card,
      .stat-card,
      .legend-box,
      .info-card,
      .feedback,
      .readout,
      .slider-group
    ) {
      padding: clamp(10px, 1.45vh, 13px) !important;
      border-radius: 8px !important;
    }
    :is([data-geo-scene-controls="true"], [data-bio-scene-controls="true"]) :is(
      h1,
      h2,
      h3,
      .panel-title,
      .section-title,
      .chart-title,
      .deck-title,
      .info-title,
      .geo-world-title,
      .geo-climate-title,
      .geo-pop-title,
      .geo-coordinate-title,
      .geo-contour-title
    ) {
      min-width: 0 !important;
      max-width: 100% !important;
      letter-spacing: 0 !important;
      word-break: keep-all !important;
      overflow-wrap: normal !important;
    }
    :is([data-geo-scene-controls="true"], [data-bio-scene-controls="true"]) :is(
      h1,
      h2,
      .panel-title,
      .deck-title
    ) {
      display: block !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
      line-height: 1.16 !important;
      font-size: clamp(14px, calc(var(--bio-scene-panel-width, 320px) / 21), 17px) !important;
    }
    :is([data-geo-scene-controls="true"], [data-bio-scene-controls="true"]) :is(
      .tabs,
      .segmented,
      .segmented-controls,
      .btn-group,
      .btn-row,
      .mode-grid,
      .tool-grid,
      .model-grid,
      .decision-grid,
      .view-grid,
      .layer-grid,
      .region-list,
      .boundary-list,
      .river-list,
      .chip-grid,
      .chip-row
    ) {
      grid-template-columns: repeat(auto-fit, minmax(min(76px, 100%), 1fr)) !important;
      gap: 8px !important;
      align-items: stretch !important;
    }
    :is([data-geo-scene-controls="true"], [data-bio-scene-controls="true"]).geo-source-panel-j7a_m07 .layer-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 8px !important;
    }
    :is([data-geo-scene-controls="true"], [data-bio-scene-controls="true"]).geo-source-panel-j7a_m07 .layer-toggle {
      min-height: 38px !important;
      grid-template-columns: 10px max-content !important;
      justify-content: center !important;
      gap: 6px !important;
      padding: 0 8px !important;
      overflow: visible !important;
      text-overflow: clip !important;
    }
    :is([data-geo-scene-controls="true"], [data-bio-scene-controls="true"]).geo-source-panel-j7a_m07 .layer-toggle > * {
      min-width: max-content !important;
      max-width: none !important;
      overflow: visible !important;
      text-overflow: clip !important;
      white-space: nowrap !important;
    }
    :is([data-geo-scene-controls="true"], [data-bio-scene-controls="true"]) :is(
      button,
      select,
      [role="button"],
      .btn,
      .tab-btn,
      .mode-btn,
      .tool-btn,
      .model-btn,
      .toggle-btn,
      .view-btn,
      .region-btn,
      .line-btn,
      .river-btn,
      .layer-btn,
      .level-btn,
      .seg-btn,
      .quiz-opt-btn,
      .geo-op-button,
      .geo-op-select,
      .geo-contour-button,
      .geo-world-button,
      .geo-world-select,
      .geo-climate-button,
      .geo-climate-select,
      .geo-pop-button,
      .geo-pop-select,
      .geo-coordinate-button,
      .geo-coordinate-select
    ) {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 6px !important;
      min-width: 0 !important;
      width: 100% !important;
      min-height: var(--geo-panel-touch-target) !important;
      padding: 0 10px !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
      word-break: keep-all !important;
      overflow-wrap: normal !important;
      line-height: 1 !important;
      font-size: var(--geo-panel-button-font-size) !important;
      letter-spacing: 0 !important;
    }
    :is([data-geo-scene-controls="true"], [data-bio-scene-controls="true"]) :is(
      button,
      [role="button"],
      .btn,
      .tab-btn,
      .mode-btn,
      .tool-btn,
      .model-btn,
      .toggle-btn,
      .view-btn,
      .region-btn,
      .line-btn,
      .river-btn,
      .layer-btn,
      .level-btn,
      .seg-btn,
      .quiz-opt-btn
    ) > * {
      min-width: 0 !important;
      max-width: 100% !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
      word-break: keep-all !important;
      overflow-wrap: normal !important;
    }
    :is([data-geo-scene-controls="true"], [data-bio-scene-controls="true"]) .geo-source-long-control {
      grid-column: 1 / -1 !important;
    }
    :is([data-geo-scene-controls="true"], [data-bio-scene-controls="true"]) .geo-source-extra-long-control {
      grid-column: 1 / -1 !important;
      font-size: clamp(9px, calc(var(--bio-scene-panel-width, 320px) / 36), 10.5px) !important;
      padding-inline: 8px !important;
    }
    :is([data-geo-scene-controls="true"], [data-bio-scene-controls="true"]) .geo-runtime-fallback-panel {
      width: 100% !important;
      min-width: 0 !important;
      display: flex !important;
      flex-direction: column !important;
      gap: clamp(12px, 1.7vh, 16px) !important;
    }
    :is([data-geo-scene-controls="true"], [data-bio-scene-controls="true"]) .geo-runtime-fallback-kicker {
      margin-bottom: 8px !important;
      color: #67e8f9 !important;
      font-size: 11px !important;
      font-weight: 900 !important;
      letter-spacing: 0 !important;
      white-space: nowrap !important;
    }
    :is([data-geo-scene-controls="true"], [data-bio-scene-controls="true"]) .geo-runtime-fallback-title {
      margin: 0 0 8px !important;
      color: #facc15 !important;
    }
    :is([data-geo-scene-controls="true"], [data-bio-scene-controls="true"]) .geo-runtime-fallback-summary {
      margin: 0 !important;
      color: rgba(226, 232, 240, 0.84) !important;
      font-size: 12px !important;
      line-height: 1.55 !important;
      letter-spacing: 0 !important;
      word-break: keep-all !important;
      overflow-wrap: anywhere !important;
    }
    :is([data-geo-scene-controls="true"], [data-bio-scene-controls="true"]) .geo-runtime-fallback-list {
      display: flex !important;
      flex-direction: column !important;
      gap: 8px !important;
      min-width: 0 !important;
    }
    :is([data-geo-scene-controls="true"], [data-bio-scene-controls="true"]) .geo-runtime-fallback-item {
      display: grid !important;
      grid-template-columns: 24px minmax(0, 1fr) !important;
      align-items: start !important;
      gap: 8px !important;
      min-width: 0 !important;
      padding: 9px 10px !important;
      border-radius: 8px !important;
      border: 1px solid rgba(148, 163, 184, 0.14) !important;
      background: rgba(8, 13, 28, 0.58) !important;
    }
    :is([data-geo-scene-controls="true"], [data-bio-scene-controls="true"]) .geo-runtime-fallback-item span {
      width: 22px !important;
      height: 22px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      border-radius: 999px !important;
      background: linear-gradient(135deg, #facc15, #38bdf8) !important;
      color: #07111d !important;
      font-size: 11px !important;
      font-weight: 900 !important;
      line-height: 1 !important;
    }
    :is([data-geo-scene-controls="true"], [data-bio-scene-controls="true"]) .geo-runtime-fallback-item p {
      margin: 0 !important;
      min-width: 0 !important;
      color: rgba(226, 232, 240, 0.86) !important;
      font-size: 12px !important;
      line-height: 1.48 !important;
      letter-spacing: 0 !important;
      word-break: keep-all !important;
      overflow-wrap: anywhere !important;
    }
    :is([data-geo-scene-controls="true"], [data-bio-scene-controls="true"]) .geo-source-hidden-exit {
      display: none !important;
    }
    :is([data-geo-scene-controls="true"], [data-bio-scene-controls="true"]) .geo-source-exit-hidden-parent {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) !important;
    }
    :is([data-geo-scene-controls="true"], [data-bio-scene-controls="true"]) :is(
      .panel-kicker,
      .kicker,
      .focus-question,
      .lesson-panel,
      .conclusion,
      .data-source,
      .info-text,
      .info-section,
      .mode-note,
      .region-note,
      .step-note,
      .detail-main,
      .selected-card
    ) {
      letter-spacing: 0 !important;
      word-break: keep-all !important;
      overflow-wrap: anywhere !important;
    }
    :is([data-geo-scene-controls="true"], [data-bio-scene-controls="true"]).geo-source-panel-j8b_m01 .region-list {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 7px !important;
    }
    :is([data-geo-scene-controls="true"], [data-bio-scene-controls="true"]).geo-source-panel-j8b_m01 .region-list .region-btn {
      grid-column: auto !important;
      display: grid !important;
      grid-template-columns: 24px minmax(0, 1fr) !important;
      min-height: 38px !important;
      width: 100% !important;
      padding-inline: 7px !important;
      justify-content: stretch !important;
      text-align: left !important;
    }
    :is([data-geo-scene-controls="true"], [data-bio-scene-controls="true"]).geo-source-panel-j8b_m01 .region-list .region-btn:first-child {
      grid-column: 1 / -1 !important;
    }
    :is([data-geo-scene-controls="true"], [data-bio-scene-controls="true"]).geo-source-panel-j8b_m01 .region-list .region-btn .region-name {
      font-size: 10.5px !important;
    }
    :is([data-geo-scene-controls="true"], [data-bio-scene-controls="true"]).geo-source-panel-j8b_m01 .geo-source-workbench {
      gap: 8px !important;
    }
    :is([data-geo-scene-controls="true"], [data-bio-scene-controls="true"]).geo-source-panel-j8b_m01 .section-title {
      margin-bottom: 4px !important;
    }
    :is([data-geo-scene-controls="true"], [data-bio-scene-controls="true"]).geo-source-panel-j8b_m01 .teaching-question {
      padding: 8px !important;
      font-size: 10.5px !important;
      line-height: 1.35 !important;
    }
    :is([data-geo-scene-controls="true"], [data-bio-scene-controls="true"]).geo-source-panel-j8b_m01 .quick-control {
      gap: 6px !important;
    }
    :is([data-geo-scene-controls="true"], [data-bio-scene-controls="true"]).geo-source-panel-j8b_m01 .toolbar {
      gap: 6px !important;
    }
    :is([data-geo-scene-controls="true"], [data-bio-scene-controls="true"]).geo-source-panel-j8b_m01 .selected-card {
      max-height: 54px !important;
      padding: 8px !important;
      overflow: hidden !important;
      font-size: 10.5px !important;
      line-height: 1.32 !important;
    }
    :is([data-geo-scene-controls="true"], [data-bio-scene-controls="true"]).geo-source-panel-j8b_m01 .selected-card strong {
      margin-bottom: 2px !important;
      font-size: 12px !important;
      line-height: 1.1 !important;
    }
  `;

  const PortraitNotice = ({ title, onBack }) => (
    <div className="absolute inset-0 flex items-center justify-center px-6 py-8">
      <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-black/65 backdrop-blur-3xl p-8 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-yellow-500/20 bg-yellow-500/10">
          <div className="relative h-10 w-14">
            <div className="absolute inset-0 rounded-[14px] border-2 border-yellow-400/90" />
            <div className="absolute left-1/2 top-1/2 h-12 w-8 -translate-x-1/2 -translate-y-1/2 rotate-90 rounded-[10px] border-2 border-yellow-400/35" />
          </div>
        </div>
        <div className="text-[12px] tracking-[0.32em] text-zinc-500 uppercase mb-4">仅限横屏模式</div>
        <h2 className="text-3xl font-black italic tracking-tight text-yellow-400 mb-3 break-words">{title}</h2>
        <p className="text-base leading-8 text-zinc-200 mb-3">当前系统仅支持横屏使用。</p>
        <p className="text-sm leading-7 text-zinc-400 mb-8">
          请将设备旋转为横屏后打开，这样才能完整显示卡片、信息面板和可视化内容。
        </p>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="w-full rounded-2xl bg-yellow-500 py-4 text-[11px] font-black tracking-[0.32em] text-black transition-all active:scale-[0.98] active:brightness-95 active:shadow-[0_0_24px_rgba(234,179,8,0.35)]"
          >
            返回上一层
          </button>
        ) : null}
      </div>
    </div>
  );

  const LandscapeOnlyViewport = ({ title, backgroundImage, onBack, children }) => {
    const viewport = useLandscapeViewport();
    const backgroundSrc = resolveGeographyMediaThumbnailPath(backgroundImage, 'assets/bg_j.webp', { width: 1920 });

    return (
      <div
        className="fixed inset-0 overflow-hidden"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)'
        }}
      >
        <div className="absolute inset-0">
          <img
            src={backgroundSrc}
            onError={event => handleGeographyMediaError(event, backgroundImage || 'assets/bg_j.webp')}
            className="absolute inset-0 w-full h-full object-cover"
            alt=""
          />
          <div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(circle at center, rgba(10,15,12,0.75) 0%, rgba(4,4,4,0.98) 100%)' }}
          />
        </div>
        <div
          data-landscape-shell="true"
          data-landscape-profile={viewport.frame.id}
          data-viewport-orientation={viewport.isLandscape ? 'landscape' : 'portrait'}
          data-viewport-stack={viewport.frame.narrowStack ? 'narrow' : 'side'}
          className="absolute inset-0 overflow-hidden z-10"
        >
          <div className="w-full h-full overflow-hidden">
            {typeof children === 'function' ? children(viewport) : children}
          </div>
        </div>
      </div>
    );
  };

  const CoursewareWorkbench = ({ card, sceneEntry, backgroundImage, onBack }) => {
    const guide = buildCoursewareGuide(card, sceneEntry);
    const scenePanelRef = React.useRef(null);
    const [sceneConfig, setSceneConfig] = React.useState(null);

    React.useEffect(() => {
      let cancelled = false;

      setSceneConfig(null);

      if (!sceneEntry?.folder) {
        return () => {};
      }

      (async () => {
        const config = await fetchJsonSafe(`${sceneEntry.folder}/scene.config.json`);
        if (!cancelled) {
          setSceneConfig(config);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [sceneEntry?.folder]);

    const usesScenePanel = sceneConfig?.coursewarePanelMode === 'scene-controls';

    return (
      <LandscapeOnlyViewport title={card.title} backgroundImage={backgroundImage} onBack={onBack}>
        {viewport => {
          const { frame } = viewport;
          const isTinyLandscape = frame.tinyLandscape;
          const isStacked = frame.narrowStack || !viewport.isLandscape;
          const headerHeight = isStacked ? 42 : isTinyLandscape ? 44 : frame.ultraWide ? 92 : frame.roomy ? 86 : frame.shortHeight ? 68 : frame.dense ? 74 : 80;
          const horizontalPadding = isStacked ? 10 : isTinyLandscape ? 8 : frame.ultraWide ? 40 : frame.roomy ? 36 : frame.dense ? 22 : 32;
          const verticalPadding = isStacked ? 8 : isTinyLandscape ? 6 : frame.ultraWide ? 28 : frame.roomy ? 26 : frame.shortHeight ? 16 : frame.dense ? 20 : 24;
          const headerGap = isStacked ? 8 : isTinyLandscape ? 10 : frame.dense ? 16 : 20;
          const asideWidth = isStacked
            ? frame.width
            : usesScenePanel && isTinyLandscape
            ? Math.max(240, Math.min(276, Math.round(frame.width * 0.31)))
            : frame.coursewareAsideWidth;
          const shellMaxWidth = isStacked ? frame.width : isTinyLandscape ? frame.width : frame.ultraWide ? 1840 : frame.roomy ? 1720 : 1600;
          const panelGap = isStacked ? 8 : isTinyLandscape ? 8 : frame.panelGap;
          const panelRadius = isStacked ? 18 : isTinyLandscape ? 20 : frame.shortHeight ? 28 : 32;
          const touchTarget = isStacked ? 44 : isTinyLandscape ? 38 : 44;
          const coursewareLayout = {
            mode: usesScenePanel ? 'scene-controls' : 'guide',
            profile: frame.id,
            width: frame.width,
            height: frame.height,
            dense: frame.dense,
            shortHeight: frame.shortHeight,
            tinyLandscape: isTinyLandscape,
            stacked: isStacked,
            portrait: !viewport.isLandscape,
            narrowStack: frame.narrowStack,
            roomy: frame.roomy,
            ultraWide: frame.ultraWide,
            panelWidth: asideWidth,
            panelGap,
            panelRadius,
            touchTarget
          };

          return (
            <div
              className="w-full h-full relative text-zinc-100 overflow-hidden flex flex-col"
              data-courseware-mode={coursewareLayout.mode}
              data-shg-card-id={card.id}
              data-shg-card-title={card.title}
              data-courseware-profile={coursewareLayout.profile}
              data-courseware-orientation={coursewareLayout.portrait ? 'portrait' : 'landscape'}
              data-courseware-layout={isStacked ? 'stacked' : 'side'}
              data-courseware-compact={coursewareLayout.tinyLandscape ? 'tiny-landscape' : coursewareLayout.shortHeight ? 'short-height' : coursewareLayout.dense ? 'dense' : 'roomy'}
              style={{
                '--bio-scene-panel-width': `${asideWidth}px`,
                '--bio-scene-panel-gap': `${panelGap}px`,
                '--bio-scene-panel-radius': `${panelRadius}px`,
                '--bio-touch-target': `${touchTarget}px`
              }}
            >
              <style>{SCENE_PANEL_READOUT_CSS}</style>
              <header
                className="border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-3xl z-50 shrink-0"
                style={{ height: `${headerHeight}px`, padding: `0 ${horizontalPadding}px` }}
              >
                <div
                  className="flex items-center min-w-0"
                  style={{ gap: `${headerGap}px`, maxWidth: isStacked ? '100%' : 'calc(100% - 160px)' }}
                >
                  <button
                    type="button"
                    onClick={onBack}
                    className="min-h-[38px] px-2 text-[10px] font-black tracking-widest text-zinc-500 hover:text-white transition-all active:scale-95 active:text-white shrink-0"
                    style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                  >
                    返回列表
                  </button>
                  {!isStacked ? (
                    <>
                      <div className="h-7 w-[1px] bg-white/10 shrink-0" />
                      <div className="min-w-0 max-w-[980px]">
                        <div
                          className={`font-black italic tracking-tight text-yellow-400 truncate ${
                            isTinyLandscape ? 'text-[18px]' : frame.ultraWide ? 'text-[36px]' : frame.roomy ? 'text-[32px]' : frame.dense ? 'text-[24px]' : 'text-[30px]'
                          }`}
                        >
                          {card.title}
                        </div>
                        <div className={`${isTinyLandscape ? 'hidden' : 'block'} text-[10px] tracking-[0.22em] uppercase text-white/35 font-black mt-1 truncate`}>
                          {card.detail}
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className={`${isStacked || isTinyLandscape ? 'hidden' : 'flex'} items-center gap-2.5 opacity-60`}>
                    <div className="w-5 h-5 rounded border border-yellow-500/40 bg-yellow-500/5 flex items-center justify-center">
                      <span className="text-yellow-400 font-black text-[10px]">地</span>
                    </div>
                    <span className="text-[10px] font-black tracking-widest text-white/40 uppercase">PowerTech在线教学演示</span>
                  </div>
                </div>
              </header>

              <main
                className="flex-1 overflow-hidden"
                style={{ padding: `${verticalPadding}px ${horizontalPadding}px` }}
              >
                <div
                  className="h-full mx-auto grid min-h-0"
                  style={{
                    maxWidth: `${shellMaxWidth}px`,
                    gridTemplateColumns: isStacked ? 'minmax(0, 1fr)' : usesScenePanel ? `minmax(0,1fr) ${asideWidth}px` : `minmax(0,1fr) ${asideWidth}px`,
                    gridTemplateRows: isStacked ? 'minmax(220px, 54fr) minmax(260px, 46fr)' : undefined,
                    gap: `${panelGap}px`
                  }}
                >
                  <section data-courseware-main="true" data-courseware-module="simulation" className="min-w-0 min-h-0 flex flex-col">
                    <CardVisualStage
                      card={card}
                      sceneEntry={sceneEntry}
                      compact={frame.dense}
                      shortHeight={frame.shortHeight}
                      tinyLandscape={isTinyLandscape}
                      layout={coursewareLayout}
                      externalPanelRef={usesScenePanel ? scenePanelRef : null}
                      className="h-full min-h-0"
                    />
                  </section>

                  <aside data-courseware-aside="true" data-courseware-module={usesScenePanel ? 'controls' : 'guide'} className="min-h-0 flex flex-col overflow-hidden">
                    {usesScenePanel ? (
                      <div
                        ref={scenePanelRef}
                        data-geo-scene-controls="true"
                        data-bio-scene-controls="true"
                        data-layout-profile={coursewareLayout.profile}
                        className="flex-1 min-h-0 border border-white/5 bg-zinc-900/60 backdrop-blur-3xl overflow-x-hidden overflow-y-auto no-scrollbar"
                        style={{
                          borderRadius: `${panelRadius}px`,
                          padding: 0,
                          scrollbarWidth: 'none',
                          overflowX: 'hidden',
                          overflowY: 'auto',
                          touchAction: 'pan-y',
                          overscrollBehavior: 'contain',
                          WebkitOverflowScrolling: 'touch',
                          WebkitTapHighlightColor: 'transparent'
                        }}
                      />
                    ) : (
                      <div
                        className="flex-1 min-h-0 border border-white/5 bg-zinc-900/60 backdrop-blur-3xl flex flex-col overflow-y-auto no-scrollbar"
                        style={{
                          borderRadius: frame.shortHeight ? '28px' : '32px',
                          padding: frame.shortHeight ? '16px' : frame.dense ? '18px' : '20px',
                          gap: frame.shortHeight ? '12px' : '14px'
                        }}
                      >
                        <div className="flex-1 flex flex-col">
                          <div style={{ marginBottom: frame.shortHeight ? '18px' : '24px' }}>
                            <div className="text-[10px] tracking-[0.3em] text-zinc-500 uppercase mb-4">本节学习重点</div>
                            <div className={frame.shortHeight ? 'space-y-3' : 'space-y-4'}>
                              {guide.focusPoints.map((point, index) => (
                                <div key={point} className="flex gap-3 items-start">
                                  <div className="w-6 h-6 rounded-full border border-yellow-400/20 bg-yellow-500/10 text-yellow-300 text-[11px] font-black flex items-center justify-center shrink-0">
                                    {index + 1}
                                  </div>
                                  <div
                                    className={`flex-1 text-zinc-200 break-words font-medium ${
                                      frame.shortHeight ? 'text-[12px] leading-[22px]' : 'text-[13px] leading-6'
                                    }`}
                                  >
                                    {point}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-5 border-t border-white/10 mt-auto">
                            <div className="text-[10px] tracking-[0.3em] text-yellow-400 uppercase mb-3">课程学习定位</div>
                            <div
                              className={`font-light italic text-zinc-400 break-words ${
                                frame.shortHeight ? 'text-[13px] leading-6' : 'text-[14px] leading-7'
                              }`}
                            >
                              {guide.summary}
                            </div>
                          </div>
                        </div>

                        <section
                          className="rounded-[24px] border border-yellow-500/12 bg-yellow-500/[0.06] shrink-0"
                          style={{
                            marginTop: frame.shortHeight ? '4px' : '8px',
                            padding: frame.shortHeight ? '14px 16px' : '16px 18px'
                          }}
                        >
                          <div className="text-[10px] tracking-[0.3em] text-yellow-300 uppercase mb-4">交互操作提醒</div>
                          <div className={frame.shortHeight ? 'space-y-2.5' : 'space-y-3'}>
                            {guide.tips.map(tip => (
                              <div key={tip} className="flex gap-3 items-start">
                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-300 mt-2 shrink-0" />
                                <div
                                  className={`text-zinc-100 break-words ${
                                    frame.shortHeight ? 'text-[11px] leading-5' : 'text-[12px] leading-6'
                                  }`}
                                >
                                  {tip}
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                      </div>
                    )}
                  </aside>
                </div>
              </main>
            </div>
          );
        }}
      </LandscapeOnlyViewport>
    );
  };



  const CardTile = React.memo(({ card, onOpen, compact, dense, roomy, tinyLandscape, shortHeight, narrowPortrait }) => {
    const [isHovered, setIsHovered] = React.useState(false);
    const {
      buttonRef,
      isPressed,
      isTouchPrimed,
      handleClick,
      handlePointerDown,
      handlePointerUp,
      handlePointerLeave,
      handlePointerCancel,
      handleBlur,
      handleTouchStart,
      handleTouchEnd,
      handleTouchCancel
    } = useTouchCardActivation(() => {
      if (!card.isLocked) onOpen(card.id);
    });
    const isActive = !card.isLocked && (isHovered || isPressed || isTouchPrimed);

    const isTinyCard = tinyLandscape || narrowPortrait;
    const isShortCard = shortHeight || isTinyCard;
    const isDense = dense || compact || isShortCard;
    const cardHeightClass = narrowPortrait
      ? 'min-h-[126px]'
      : isTinyCard
      ? 'min-h-[136px]'
      : isShortCard
        ? 'min-h-[184px]'
        : isDense
          ? 'min-h-[230px]'
          : roomy
            ? 'min-h-[330px]'
            : 'min-h-[290px]';
    const tileShellClass = narrowPortrait
      ? 'p-3 rounded-[18px]'
      : isTinyCard
      ? 'p-4 rounded-[20px]'
      : isShortCard
        ? 'p-5 rounded-[24px]'
        : isDense
          ? 'p-6 rounded-[26px]'
          : roomy
            ? 'p-10 rounded-[40px]'
            : 'p-8 rounded-[34px]';
    const levelClass = narrowPortrait ? 'text-[7px] tracking-[0.18em]' : isShortCard ? 'text-[8px] tracking-[0.28em]' : 'text-[10px] tracking-[0.4em]';
    const titleSize = isTinyCard
      ? (narrowPortrait ? (card.title.length > 12 ? 'text-[14px]' : 'text-[15px]') : (card.title.length > 12 ? 'text-[16px]' : card.title.length > 8 ? 'text-[18px]' : 'text-[20px]'))
      : isShortCard
        ? (card.title.length > 12 ? 'text-[18px]' : card.title.length > 8 ? 'text-[21px]' : 'text-[24px]')
        : isDense
          ? (card.title.length > 12 ? 'text-lg' : card.title.length > 8 ? 'text-xl' : 'text-2xl')
          : roomy
            ? (card.title.length > 12 ? 'text-[28px]' : card.title.length > 8 ? 'text-[34px]' : 'text-[38px]')
            : (card.title.length > 12 ? 'text-lg' : card.title.length > 8 ? 'text-2xl' : 'text-3xl');
    const titleMarginClass = narrowPortrait ? 'mt-1.5' : isTinyCard ? 'mt-2' : isShortCard ? 'mt-3' : 'mt-4';
    const tagWrapClass = isTinyCard
      ? 'hidden'
      : isShortCard
        ? 'mt-4 gap-1.5'
        : isDense
          ? 'mt-5 gap-2'
          : roomy
            ? 'mt-7 gap-2'
            : 'mt-6 gap-2';
    const tagClass = isShortCard
      ? 'text-[8px] font-bold bg-white/5 border border-white/5 px-2 py-0.5 rounded text-zinc-400 whitespace-nowrap'
      : 'text-[9px] font-bold bg-white/5 border border-white/5 px-2.5 py-1 rounded-md text-zinc-400 whitespace-nowrap';
    const footerClass = isTinyCard
      ? 'hidden'
      : isShortCard
        ? 'pt-4'
        : isDense
          ? 'pt-5'
          : roomy
            ? 'pt-7'
            : 'pt-6';
    
    const actionLabel = card.isLocked ? '暂未开放' : isTouchPrimed ? '再次点击打开' : '打开单元';

    return (
      <button
        ref={buttonRef}
        type="button"
        data-card-id={card.id}
        aria-label={card.isLocked ? `${card.title} (暂未开放)` : `打开${card.title}`}
        onMouseEnter={() => !card.isLocked && setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          handlePointerLeave();
        }}
        onFocus={() => !card.isLocked && setIsHovered(true)}
        onBlur={() => {
          setIsHovered(false);
          handleBlur();
        }}
        onPointerDown={card.isLocked ? undefined : handlePointerDown}
        onPointerUp={card.isLocked ? undefined : handlePointerUp}
        onPointerLeave={card.isLocked ? undefined : handlePointerLeave}
        onPointerCancel={card.isLocked ? undefined : handlePointerCancel}
        onTouchStart={card.isLocked ? undefined : handleTouchStart}
        onTouchEnd={card.isLocked ? undefined : handleTouchEnd}
        onTouchCancel={card.isLocked ? undefined : handleTouchCancel}
        onClick={card.isLocked ? (e) => e.preventDefault() : handleClick}
        className={`group relative overflow-hidden appearance-none bg-transparent text-left transition-all duration-700 ${card.isLocked ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'} border backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300/80 ${
          isActive
            ? 'z-20 border-yellow-400/60 bg-yellow-500/15 -translate-y-2 scale-[1.02] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8),0_0_30px_rgba(234,179,8,0.25)]'
            : 'z-0 border-white/10 bg-zinc-900/40'
        } ${cardHeightClass} ${tileShellClass}`}
        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
      >
        <div
          className={`absolute inset-0 transition-all duration-1000 ease-out pointer-events-none ${
            isActive ? 'opacity-100 scale-105 rotate-1' : card.isLocked ? 'opacity-30 grayscale brightness-[0.7]' : 'opacity-80 scale-100 rotate-0'
          }`}
        >
          <img
            src={resolveGeographyMediaThumbnailPath(card.image, card.fallbackImage || 'assets/geography_card_bg_golden.webp', { width: 720 })}
            onError={event => handleGeographyMediaError(event, card.fallbackImage || 'assets/geography_card_bg_golden.webp')}
            className={`w-full h-full object-cover transition-all duration-700 ${isActive ? 'brightness-110' : 'brightness-75'}`}
            alt=""
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10"></div>
        </div>

        <div className="relative z-20 flex flex-col h-full">
          <div className="flex justify-between items-start">
            <div
              className={`${levelClass} font-black uppercase transition-colors duration-500 ${
                isActive ? 'text-yellow-400' : card.isLocked ? 'text-zinc-500' : 'text-yellow-500'
              }`}
            >
              视觉表现等级 {card.visualLevel || 'A'}
            </div>
            {card.isLocked && (
              <div className={`${narrowPortrait ? 'w-6 h-6' : 'w-8 h-8'} rounded-full border border-white/10 bg-black/40 flex items-center justify-center backdrop-blur-md`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
            )}
          </div>

          <h3
            className={`${titleSize} font-black italic text-white transition-all duration-500 leading-tight break-words line-clamp-2 ${titleMarginClass} ${
              isActive ? 'text-yellow-300' : card.isLocked ? 'text-zinc-400' : ''
            }`}
          >
            {card.title}
          </h3>

          <div
            className={`flex flex-wrap ${tagWrapClass} transition-all duration-700 ${
              isActive ? 'opacity-100 translate-y-0' : card.isLocked ? 'opacity-40 translate-y-0' : 'opacity-60 translate-y-0'
            }`}
          >
            {card.tags.map(tag => (
              <span
                key={tag}
                className={tagClass}
              >
                #{tag}
              </span>
            ))}
          </div>

          <div
            className={`mt-auto ${footerClass} flex items-center justify-between transition-all duration-500 ${
              isActive || card.isLocked ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black tracking-widest ${card.isLocked ? 'text-zinc-500' : 'text-yellow-500'}`}>{actionLabel}</span>
              {!card.isLocked && <Icon name="ArrowRight" size={12} className="text-yellow-500 animate-pulse" />}
            </div>
            <div className={`flex -space-x-2 ${card.isLocked ? 'opacity-30' : ''}`}>
              {[1, 2, 3].map(index => (
                <div
                  key={index}
                  className="w-5 h-5 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center text-[8px] font-bold text-zinc-500"
                >
                  M{index}
                </div>
              ))}
            </div>
          </div>
        </div>

        {!card.isLocked && (
          <div
            className={`absolute -inset-x-20 top-0 h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent transition-transform duration-1000 transform ${
              isActive ? 'translate-x-full' : '-translate-x-full'
            }`}
          />
        )}
      </button>
    );
  });

  Object.assign(window.GeographyApp, {
    PortraitNotice,
    LandscapeOnlyViewport,
    CoursewareWorkbench,
    CardTile
  });
})();
