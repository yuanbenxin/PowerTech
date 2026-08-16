/* global window, document */
(function () {
  'use strict';

  if (window.__shgLearningAssistantLoader) return;
  window.__shgLearningAssistantLoader = true;

  const config = window.SHG_LEARNING_ASSISTANT_CONFIG || {};
  const assetBaseUrl = String(config.assetBaseUrl || '/dist-learning-assistant/').replace(/\/?$/, '/');
  const fallbackVersion = String(config.version || '');
  const assetUrl = (fileName, version) => {
    const cacheVersion = encodeURIComponent(String(version || fallbackVersion || ''));
    return `${assetBaseUrl}${fileName}${cacheVersion ? `?v=${cacheVersion}` : ''}`;
  };

  function loadStyle(fileName, version) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`link[data-shg-learning-assistant-asset="${fileName}"]`)) {
        resolve();
        return;
      }
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = assetUrl(fileName, version);
      link.dataset.shgLearningAssistantAsset = fileName;
      link.onload = resolve;
      link.onerror = () => reject(new Error(`Unable to load ${fileName}`));
      document.head.appendChild(link);
    });
  }

  function loadScript(fileName, version) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[data-shg-learning-assistant-asset="${fileName}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = assetUrl(fileName, version);
      script.async = false;
      script.dataset.shgLearningAssistantAsset = fileName;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Unable to load ${fileName}`));
      document.body.appendChild(script);
    });
  }

  async function resolveAssistantVersion() {
    try {
      const response = await window.fetch(`${assetBaseUrl}manifest.json`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`manifest request failed: ${response.status}`);
      const manifest = await response.json();
      return String(manifest?.version || fallbackVersion || '');
    } catch (error) {
      console.warn('小拾光版本清单读取失败，将使用页面内置版本。', error);
      return fallbackVersion;
    }
  }

  resolveAssistantVersion()
    .then((version) => {
      window.SHG_LEARNING_ASSISTANT_CONFIG = {
        ...config,
        assetBaseUrl,
        guideUrl: config.guideUrl || assetUrl('usage-guides.json', version),
        avatarModelUrl: config.avatarModelUrl || assetUrl('assistant.glb', version),
        answerUrl: config.answerUrl || '/api/unified/learning-assistant/answer',
        streamUrl: config.streamUrl || '/api/unified/learning-assistant/answer/stream'
      };
      return loadStyle('shg-learning-assistant.css', version)
        .then(() => loadScript('shg-learning-assistant-three.min.js', version))
        .then(() => loadScript('shg-learning-assistant-gltf-loader.js', version))
        .then(() => loadScript('shg-learning-assistant.js', version));
    })
    .catch(error => console.warn('小拾光资源加载失败。', error));
}());
