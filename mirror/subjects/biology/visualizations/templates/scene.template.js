window.BIO_VISUAL_SCENES = window.BIO_VISUAL_SCENES || {};

window.BIO_VISUAL_SCENES["card_id_here"] = {
  mount(container, context = {}) {
    const externalPanel = context.externalPanel && context.externalPanel.nodeType === 1
      ? context.externalPanel
      : null;
    const layout = context.layout || {};

    const css = `
      .bio-scene-sim,
      .bio-scene-panel,
      .bio-scene-sim *,
      .bio-scene-panel * {
        box-sizing: border-box;
      }
      .bio-scene-sim,
      .bio-scene-panel {
        width: 100%;
        height: 100%;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
        color: #f8fafc;
        font-family: "Microsoft YaHei", "PingFang SC", Inter, system-ui, sans-serif;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
        user-select: none;
      }
      .bio-scene-sim {
        border-radius: clamp(22px, 4vw, 48px);
        border: 1px solid rgba(255,255,255,.08);
        background: linear-gradient(140deg, #071b22 0%, #040b11 58%, #020507 100%);
        padding: clamp(14px, 2.4vw, 26px);
        display: grid;
        grid-template-rows: auto minmax(0, 1fr) auto;
      }
      .bio-scene-canvas {
        min-height: 0;
        border-radius: clamp(18px, 3vw, 32px);
        background:
          linear-gradient(rgba(148,163,184,.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(148,163,184,.08) 1px, transparent 1px),
          rgba(2,8,12,.32);
        background-size: 56px 56px;
        display: grid;
        place-items: center;
      }
      .bio-scene-panel {
        border-radius: var(--bio-scene-panel-radius, 28px);
        border: 1px solid rgba(255,255,255,.09);
        background: linear-gradient(180deg, rgba(18,18,18,.98), rgba(8,10,10,.98));
        padding: clamp(8px, 1.6vh, 14px);
        display: flex;
        flex-direction: column;
        gap: clamp(6px, 1.1vh, 10px);
      }
      .bio-panel-section {
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 16px;
        background: rgba(255,255,255,.035);
        padding: clamp(7px, 1.2vh, 10px);
      }
      .bio-touch-button {
        width: 100%;
        min-height: var(--bio-touch-target, 44px);
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,.10);
        background: rgba(255,255,255,.06);
        color: #f8fafc;
        font-weight: 900;
        touch-action: manipulation;
        appearance: none;
      }
      @media (max-height: 620px) {
        .bio-scene-sim {
          padding: 14px;
          border-radius: 26px;
        }
        .bio-scene-panel {
          padding: 8px;
          gap: 6px;
          border-radius: 20px;
        }
        .bio-touch-button {
          min-height: 40px;
        }
      }
    `;

    container.innerHTML = `
      <style>${css}</style>
      <section class="bio-scene-sim">
        <main class="bio-scene-canvas">
          <div style="opacity:.72;font-weight:900;">Build the visual teaching model here.</div>
        </main>
      </section>
    `;

    if (externalPanel) {
      externalPanel.innerHTML = `
        <style>${css}</style>
        <aside class="bio-scene-panel" data-profile="${layout.profile || "standard"}">
          <section class="bio-panel-section">
            <div style="color:#34d399;font-size:12px;font-weight:950;letter-spacing:.12em;">OPERATION PANEL</div>
          </section>
          <section class="bio-panel-section">
            <button class="bio-touch-button" type="button">Primary action</button>
          </section>
          <section class="bio-panel-section" style="font-size:12px;line-height:1.35;color:rgba(226,232,240,.72);">
            Use context.layout and the shared CSS variables for tablet and phone landscape adaptation.
          </section>
        </aside>
      `;
    }
  },

  unmount(container, context = {}) {
    container.innerHTML = "";
    if (context.externalPanel) context.externalPanel.innerHTML = "";
  }
};
