// GENERATED_PLACEHOLDER_CARD
window.MATH_VISUAL_SCENES = window.MATH_VISUAL_SCENES || {};

(function () {
  const CARD_ID = "j7b_m10";

  function appendRuntimeVersion(path) {
    const app = window.MathApp || {};
    if (typeof app.appendRuntimeVersion === 'function') return app.appendRuntimeVersion(path);
    return path;
  }

  function resolveSourceUrl(context) {
    const folder = String(context?.sceneEntry?.folder || '').replace(/\/+$/, '');
    return appendRuntimeVersion((folder ? folder + '/' : '') + 'source.html');
  }

  function blockNativeMenus(root, cleanups) {
    const events = ['contextmenu', 'selectstart', 'dragstart'];
    events.forEach(type => {
      const handler = event => event.preventDefault();
      root.addEventListener(type, handler);
      cleanups.push(() => root.removeEventListener(type, handler));
    });
  }

  function showError(container, message) {
    container.innerHTML = '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;background:#0b1220;color:#94a3b8;font:500 14px/1.8 Microsoft YaHei, sans-serif;text-align:center;">' + message + '</div>';
  }

  function getPanelRefinementStyle() {
    return `
.math-source-panel-j7b_m10 .slider-row,
.math-source-panel-j7b_m10 .math-source-panel-content .slider-row {
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) auto !important;
  grid-template-rows: auto 34px !important;
  gap: 6px !important;
  min-height: 0 !important;
  padding: 8px 0 10px !important;
  margin: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}
.math-source-panel-j7b_m10 .slider-row + .slider-row,
.math-source-panel-j7b_m10 .math-source-panel-content .slider-row + .slider-row {
  border-top: 1px solid rgba(148, 163, 184, 0.14) !important;
  padding-top: 12px !important;
}
.math-source-panel-j7b_m10 .slider-head,
.math-source-panel-j7b_m10 .math-source-panel-content .slider-head {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 10px !important;
  min-width: 0 !important;
}
.math-source-panel-j7b_m10 .slider-label,
.math-source-panel-j7b_m10 .math-source-panel-content .slider-label {
  grid-column: 1 !important;
  grid-row: 1 !important;
  min-width: 0 !important;
  color: rgba(226, 232, 240, 0.78) !important;
  font-size: 12px !important;
  font-weight: 700 !important;
  line-height: 1.35 !important;
}
.math-source-panel-j7b_m10 .slider-val-indicator,
.math-source-panel-j7b_m10 .math-source-panel-content .slider-val-indicator {
  grid-column: 2 !important;
  grid-row: 1 !important;
  flex: 0 0 auto !important;
  min-width: 48px !important;
  padding: 2px 7px !important;
  border: 1px solid rgba(96, 165, 250, 0.2) !important;
  border-radius: 7px !important;
  background: rgba(15, 23, 42, 0.42) !important;
  color: #dbeafe !important;
  font-size: 12px !important;
  font-weight: 800 !important;
  line-height: 1.35 !important;
  text-align: right !important;
}
.math-source-panel-j7b_m10 .slider-row input[type="range"],
.math-source-panel-j7b_m10 .math-source-panel-content .slider-row input[type="range"] {
  grid-column: 1 / 3 !important;
  grid-row: 2 !important;
  width: 100% !important;
  height: 34px !important;
  min-height: 34px !important;
  padding: 13px 0 !important;
  margin: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  accent-color: #60a5fa !important;
  cursor: pointer !important;
  touch-action: none !important;
}
.math-source-panel-j7b_m10 .slider-row input[type="range"]::-webkit-slider-runnable-track,
.math-source-panel-j7b_m10 .math-source-panel-content .slider-row input[type="range"]::-webkit-slider-runnable-track {
  height: 4px !important;
  border: 0 !important;
  border-radius: 999px !important;
  background: linear-gradient(90deg, rgba(96, 165, 250, 0.88), rgba(148, 163, 184, 0.32)) !important;
  box-shadow: none !important;
}
.math-source-panel-j7b_m10 .slider-row input[type="range"]::-webkit-slider-thumb,
.math-source-panel-j7b_m10 .math-source-panel-content .slider-row input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none !important;
  appearance: none !important;
  width: 16px !important;
  height: 16px !important;
  margin-top: -6px !important;
  border: 2px solid rgba(248, 250, 252, 0.96) !important;
  border-radius: 50% !important;
  background: #60a5fa !important;
  box-shadow: 0 3px 8px rgba(15, 23, 42, 0.24) !important;
}
.math-source-panel-j7b_m10 .slider-row input[type="range"]::-moz-range-track,
.math-source-panel-j7b_m10 .math-source-panel-content .slider-row input[type="range"]::-moz-range-track {
  height: 4px !important;
  border: 0 !important;
  border-radius: 999px !important;
  background: rgba(148, 163, 184, 0.32) !important;
}
.math-source-panel-j7b_m10 .slider-row input[type="range"]::-moz-range-progress,
.math-source-panel-j7b_m10 .math-source-panel-content .slider-row input[type="range"]::-moz-range-progress {
  height: 4px !important;
  border-radius: 999px !important;
  background: #60a5fa !important;
}
.math-source-panel-j7b_m10 .slider-row input[type="range"]::-moz-range-thumb,
.math-source-panel-j7b_m10 .math-source-panel-content .slider-row input[type="range"]::-moz-range-thumb {
  width: 16px !important;
  height: 16px !important;
  border: 2px solid rgba(248, 250, 252, 0.96) !important;
  border-radius: 50% !important;
  background: #60a5fa !important;
  box-shadow: 0 3px 8px rgba(15, 23, 42, 0.24) !important;
}
.math-source-panel-j7b_m10 .slider-row.slider-row-orange input[type="range"]::-webkit-slider-runnable-track,
.math-source-panel-j7b_m10 .math-source-panel-content .slider-row.slider-row-orange input[type="range"]::-webkit-slider-runnable-track {
  background: linear-gradient(90deg, rgba(251, 191, 36, 0.9), rgba(148, 163, 184, 0.32)) !important;
}
.math-source-panel-j7b_m10 .slider-row.slider-row-orange input[type="range"]::-webkit-slider-thumb,
.math-source-panel-j7b_m10 .math-source-panel-content .slider-row.slider-row-orange input[type="range"]::-webkit-slider-thumb {
  background: #fbbf24 !important;
}
.math-source-panel-j7b_m10 .slider-row.slider-row-blue input[type="range"]::-webkit-slider-thumb,
.math-source-panel-j7b_m10 .math-source-panel-content .slider-row.slider-row-blue input[type="range"]::-webkit-slider-thumb {
  background: #60a5fa !important;
}
`;
  }

  window.MATH_VISUAL_SCENES[CARD_ID] = {
    async mount(container, context) {
      const cleanups = [];
      container.innerHTML = '';
      if (context?.externalPanel) context.externalPanel.innerHTML = '';
      container.style.position = container.style.position || 'relative';
      container.style.overflow = 'hidden';

      try {
        const response = await fetch(resolveSourceUrl(context), { cache: 'no-store' });
        if (!response.ok) throw new Error('source.html ' + response.status);
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');

        const style = document.createElement('style');
        style.textContent = Array.from(doc.querySelectorAll('style')).map(node => node.textContent || '').join('\n') + getPanelRefinementStyle();
        document.head.appendChild(style);
        cleanups.push(() => style.remove());

        const sceneNode = doc.querySelector('[data-placeholder-scene]');
        const panelNode = doc.querySelector('[data-placeholder-panel]');
        if (!sceneNode) throw new Error('placeholder scene missing');

        const scene = sceneNode.cloneNode(true);
        scene.dataset.cardId = CARD_ID;
        scene.style.width = '100%';
        scene.style.height = '100%';
        container.appendChild(scene);

        if (panelNode) {
          const panel = panelNode.cloneNode(true);
          panel.dataset.cardId = CARD_ID;
          if (context?.externalPanel) {
            context.externalPanel.appendChild(panel);
          } else {
            panel.style.position = 'absolute';
            panel.style.right = '16px';
            panel.style.top = '16px';
            panel.style.maxWidth = '320px';
            panel.style.zIndex = '5';
            container.appendChild(panel);
          }
          blockNativeMenus(panel, cleanups);
        }

        blockNativeMenus(scene, cleanups);
        container.__mathPlaceholderCleanup = () => cleanups.splice(0).forEach(fn => fn());
      } catch (error) {
        console.error('Failed to mount placeholder card:', CARD_ID, error);
        showError(container, '本课件正在制作中，敬请期待。');
      }
    },
    unmount(container, context) {
      if (typeof container.__mathPlaceholderCleanup === 'function') {
        container.__mathPlaceholderCleanup();
        container.__mathPlaceholderCleanup = null;
      }
      container.innerHTML = '';
      if (context?.externalPanel) context.externalPanel.innerHTML = '';
    }
  };
})();
