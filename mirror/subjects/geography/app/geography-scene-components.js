/*
  Visual scene components.
*/

window.GeographyApp = window.GeographyApp || {};

(() => {
  const app = window.GeographyApp;
  const {
    useState,
    useEffect,
    useRef,
    toKebabCase,
    fetchJsonSafe,
    loadSceneScript,
    buildCoursewareGuide,
    installGeographyPanelScrollPreserver,
    renderGeographyPanelHtml,
    resolveGeographyMediaThumbnailPath,
    handleGeographyMediaError
  } = app;

  const escapePanelHtml = value => String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

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

  const CardVisualStage = ({ card, sceneEntry, className = '', compact = false, shortHeight = false, tinyLandscape = false, layout = null, externalPanelRef = null }) => {
    const hostRef = useRef(null);
    const [sceneStatus, setSceneStatus] = useState('fallback');
    const [sceneFailure, setSceneFailure] = useState('');
    const isStacked = layout?.stacked === true || layout?.narrowStack === true;
    const radiusClass = isStacked ? 'rounded-[22px]' : tinyLandscape ? 'rounded-[24px]' : shortHeight ? 'rounded-[30px]' : compact ? 'rounded-[40px]' : 'rounded-[60px]';
    const minHeightClass = isStacked ? 'min-h-0' : tinyLandscape ? 'min-h-0' : shortHeight ? 'min-h-[300px]' : compact ? 'min-h-[360px]' : 'min-h-[420px]';
    const fallbackTitle = !sceneEntry?.folder ? '课件待接入' : '课件资源待完善';
    const fallbackText = !sceneEntry?.folder
      ? '课程目录已进入前端，交互课件会在完成后显示在这里。'
      : '当前可视化目录已建立，请补齐场景配置或入口脚本。';

    useEffect(() => {
      let cancelled = false;
      let teardown = null;
      const forceSceneResize = () => {
        const host = hostRef.current;
        if (!host) return;
        host.style.width = '100%';
        host.style.height = '100%';
        host.querySelectorAll('[data-canvas-host], .geo-contour-host, .geo-world-canvas-host, .geo-climate-canvas-host, .geo-orbit-canvas-host').forEach(node => {
          node.style.setProperty('width', '100%', 'important');
          node.style.setProperty('height', '100%', 'important');
          node.style.setProperty('min-width', '0', 'important');
          node.style.setProperty('min-height', '0', 'important');
          node.style.setProperty('overflow', 'hidden', 'important');
        });
        host.querySelectorAll('canvas').forEach(canvas => {
          const isPrimaryCanvas = Boolean(canvas.closest('[data-canvas-host], .geo-contour-host, .geo-world-canvas-host, .geo-climate-canvas-host, .geo-orbit-canvas-host'));
          canvas.style.setProperty('width', '100%', 'important');
          canvas.style.setProperty('height', '100%', 'important');
          canvas.style.setProperty('max-width', 'none', 'important');
          canvas.style.setProperty('max-height', 'none', 'important');
          canvas.style.setProperty('display', 'block', 'important');
          canvas.style.setProperty('touch-action', 'none', 'important');
          if (isPrimaryCanvas) {
            canvas.style.setProperty('min-width', '100%', 'important');
            canvas.style.setProperty('min-height', '100%', 'important');
          }
        });
        window.dispatchEvent(new Event('resize'));
        window.visualViewport?.dispatchEvent?.(new Event('resize'));
      };
      const scheduleResizeSweep = () => {
        [0, 60, 140, 280, 520, 900, 1400].forEach(delay => {
          window.setTimeout(() => {
            if (!cancelled) forceSceneResize();
          }, delay);
        });
      };
      const markSceneFailure = (stage, error = null) => {
        const host = hostRef.current;
        const message = error?.stack || error?.message || String(error || '');
        setSceneFailure(stage || 'fallback');
        if (host) {
          host.setAttribute('data-geography-scene-failure', stage);
          if (message) host.setAttribute('data-geography-scene-error', message.slice(0, 600));
        }
      };
      const clearSceneFailure = () => {
        const host = hostRef.current;
        setSceneFailure('');
        if (!host) return;
        host.removeAttribute('data-geography-scene-failure');
        host.removeAttribute('data-geography-scene-error');
      };
      const renderExternalPanelFallback = (reason = '') => {
        const panel = externalPanelRef?.current;
        if (!panel) return;
        installGeographyPanelScrollPreserver?.(panel);
        const guide = buildCoursewareGuide?.(card, sceneEntry) || {};
        const focusPoints = Array.isArray(guide.focusPoints) && guide.focusPoints.length
          ? guide.focusPoints
          : ['围绕当前可视化画面，先观察空间位置、分布差异与动态过程，再用地理概念解释原因。'];
        const tips = Array.isArray(guide.tips) && guide.tips.length
          ? guide.tips
          : ['拖拽或缩放左侧画面，比较不同区域、季节或过程的变化。', '把观察到的现象与课本关键词对应起来，形成一句地理解释。'];
        const summary = guide.summary || card?.detail || card?.title || '地理可视化学习';
        const html = `
          <div class="geo-source-workbench geo-runtime-fallback-panel" data-geo-runtime-fallback="${escapePanelHtml(reason)}">
            <section class="geo-source-panel-card">
              <div class="geo-runtime-fallback-kicker">学习指引</div>
              <h2 class="geo-runtime-fallback-title">${escapePanelHtml(card?.title || '地理可视化')}</h2>
              <p class="geo-runtime-fallback-summary">${escapePanelHtml(summary)}</p>
            </section>
            <section class="geo-source-panel-card">
              <div class="geo-runtime-fallback-kicker">观察任务</div>
              <div class="geo-runtime-fallback-list">
                ${focusPoints.slice(0, 3).map((point, index) => `
                  <div class="geo-runtime-fallback-item">
                    <span>${index + 1}</span>
                    <p>${escapePanelHtml(point)}</p>
                  </div>
                `).join('')}
              </div>
            </section>
            <section class="geo-source-panel-card">
              <div class="geo-runtime-fallback-kicker">操作提示</div>
              <div class="geo-runtime-fallback-list">
                ${tips.slice(0, 2).map((tip, index) => `
                  <div class="geo-runtime-fallback-item">
                    <span>${index + 1}</span>
                    <p>${escapePanelHtml(tip)}</p>
                  </div>
                `).join('')}
              </div>
            </section>
          </div>
        `;
        renderGeographyPanelHtml?.(panel, html, { preserveScroll: false });
      };
      const ensureExternalPanelContent = (reason = '') => {
        const panel = externalPanelRef?.current;
        if (!panel) return;
        const hasContent = panel.children.length > 0 || String(panel.textContent || '').trim().length > 0;
        if (!hasContent) renderExternalPanelFallback(reason);
      };

      if (hostRef.current) hostRef.current.innerHTML = '';
      if (externalPanelRef?.current) {
        installGeographyPanelScrollPreserver?.(externalPanelRef.current);
        renderGeographyPanelHtml?.(externalPanelRef.current, '', { preserveScroll: false });
      }
      setSceneStatus('fallback');
      setSceneFailure('');
      clearSceneFailure();

      if (!card || !sceneEntry) {
        markSceneFailure('missing-card-or-scene-entry');
        return () => {};
      }

      (async () => {
        const loadingStartedAt = performance.now();
        const keepLoadingNoticeVisible = async () => {
          const elapsed = performance.now() - loadingStartedAt;
          if (elapsed < 1000) {
            await new Promise(resolve => window.setTimeout(resolve, 1000 - elapsed));
          }
        };
        setSceneStatus('loading');

        const config = await fetchJsonSafe(`${sceneEntry.folder}/scene.config.json`);
        if (cancelled || !config) {
          markSceneFailure('missing-scene-config');
          if (!cancelled) renderExternalPanelFallback('missing-scene-config');
          if (!cancelled) setSceneStatus('fallback');
          return;
        }

        try {
          await loadSceneScript(`${sceneEntry.folder}/${config.entry || 'scene.js'}`);
        } catch (error) {
          console.error('[GeographyScene] failed to load scene script', { cardId: card?.id, folder: sceneEntry?.folder, error });
          markSceneFailure('load-scene-script', error);
          if (!cancelled) renderExternalPanelFallback('load-scene-script');
          if (!cancelled) setSceneStatus('fallback');
          return;
        }

        if (cancelled || !hostRef.current) return;

        const definition = window.GEOGRAPHY_VISUAL_SCENES?.[card.id];
        if (!definition || typeof definition.mount !== 'function') {
          console.error('[GeographyScene] missing scene definition', { cardId: card?.id, folder: sceneEntry?.folder });
          markSceneFailure('missing-scene-definition');
          renderExternalPanelFallback('missing-scene-definition');
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

        if (context.externalPanel) {
          installGeographyPanelScrollPreserver?.(context.externalPanel);
        }

        try {
          container.innerHTML = '';
          const mountResult = definition.mount(container, context);
          if (mountResult && typeof mountResult.then === 'function') {
            await mountResult;
          }
          teardown = () => {
            if (typeof definition.unmount === 'function') {
              definition.unmount(container, context);
            } else {
              container.innerHTML = '';
            }
          };
          await keepLoadingNoticeVisible();
          if (!cancelled) {
            clearSceneFailure();
            setSceneStatus('ready');
            scheduleResizeSweep();
            window.setTimeout(() => {
              if (!cancelled) ensureExternalPanelContent('empty-scene-panel');
            }, 600);
          }
        } catch (error) {
          console.error('[GeographyScene] failed to mount scene', { cardId: card?.id, folder: sceneEntry?.folder, error });
          markSceneFailure('mount-scene', error);
          container.innerHTML = '';
          renderExternalPanelFallback('mount-scene');
          if (!cancelled) setSceneStatus('fallback');
        }
      })();

      return () => {
        cancelled = true;
        if (teardown) {
          teardown();
        } else if (hostRef.current) {
          hostRef.current.innerHTML = '';
        }
        if (externalPanelRef?.current) {
          renderGeographyPanelHtml?.(externalPanelRef.current, '', { preserveScroll: false });
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

    return (
      <div
        data-geography-scene-stage="true"
        data-geography-layout-profile={layout?.profile || 'standard'}
        data-geography-layout-mode={layout?.mode || 'standalone'}
        data-geography-layout-stack={isStacked ? 'stacked' : 'side'}
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
                src={resolveGeographyMediaThumbnailPath(card?.image, card?.fallbackImage || 'assets/geography_card_bg_golden.webp', { width: 1280 })}
                onError={event => handleGeographyMediaError(event, card?.fallbackImage || 'assets/geography_card_bg_golden.webp')}
                className="w-full h-full object-cover"
                alt=""
              />
            </div>
          )}
        </div>
        <div
          ref={hostRef}
          className={`absolute inset-0 transition-opacity duration-500 ${
            sceneStatus === 'ready' ? 'opacity-100' : 'opacity-0'
          }`}
        />
        {sceneStatus === 'loading' ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/45 px-6 pointer-events-none backdrop-blur-[2px]">
            <div className="w-full max-w-sm rounded-[18px] border border-yellow-300/15 bg-zinc-950/80 p-4 text-center shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
              <div className="text-[11px] font-black tracking-[0.22em] text-yellow-200 uppercase">课件资源加载中</div>
              <div className="mt-2 text-[13px] font-bold leading-6 text-white/78">首次打开需要加载交互引擎与本地资源，请稍候。</div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-2/5 rounded-full bg-yellow-300 shadow-[0_0_18px_rgba(253,224,71,0.50)] animate-pulse" />
              </div>
            </div>
          </div>
        ) : null}
        {sceneStatus === 'fallback' && sceneFailure ? (
          <div className="absolute inset-0 z-10 flex items-end justify-center p-4 pointer-events-none">
            <div className="w-full max-w-xl rounded-[18px] border border-yellow-300/15 bg-zinc-950/70 p-4 shadow-[0_22px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl">
              <div className="text-[11px] font-black tracking-[0.22em] text-yellow-200 uppercase">{fallbackTitle}</div>
              <div className="mt-2 text-[13px] font-bold leading-6 text-white/78">{fallbackText}</div>
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  Object.assign(window.GeographyApp, {
    Icon,
    DNAEngine,
    CardVisualStage
  });
})();
