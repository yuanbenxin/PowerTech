// GENERATED_SENIOR_PLACEHOLDER_CARD
window.MATH_VISUAL_SCENES = window.MATH_VISUAL_SCENES || {};

(function () {
  const CARD_ID = "sx3_m11";

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
    container.innerHTML = '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;background:#06111e;color:#fecaca;font:700 14px/1.8 Microsoft YaHei, sans-serif;text-align:center;">' + message + '</div>';
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
        style.textContent = Array.from(doc.querySelectorAll('style')).map(node => node.textContent || '').join('\n');
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
        container.__mathSeniorPlaceholderCleanup = () => cleanups.splice(0).forEach(fn => fn());
      } catch (error) {
        console.error('Failed to mount senior placeholder card:', CARD_ID, error);
        showError(container, '本课件正在制作中，敬请期待。');
      }
    },
    unmount(container, context) {
      if (typeof container.__mathSeniorPlaceholderCleanup === 'function') {
        container.__mathSeniorPlaceholderCleanup();
        container.__mathSeniorPlaceholderCleanup = null;
      }
      container.innerHTML = '';
      if (context?.externalPanel) context.externalPanel.innerHTML = '';
    }
  };
})();
