/*
  Visual scene components.
*/

window.BiologyApp = window.BiologyApp || {};
(() => {
  const app = window.BiologyApp;
  const {
    useState,
    useEffect,
    useRef,
    toKebabCase,
    fetchJsonSafe,
    loadSceneScript,
    installBiologyPanelScrollPreserver,
    renderBiologyPanelHtml,
    resolveBiologyMediaThumbnailPath,
    handleBiologyMediaError
  } = app;
  const Icon = ({
    name,
    size = 18,
    className = ''
  }) => {
    const markup = React.useMemo(() => {
      const icon = window.lucide?.icons?.[toKebabCase(name)];
      return icon ? icon.toSvg({
        stroke: 'currentColor',
        'stroke-width': 2,
        width: size,
        height: size
      }) : '';
    }, [name, size]);
    return /*#__PURE__*/React.createElement("i", {
      className: `inline-flex items-center justify-center ${className}`,
      "aria-hidden": "true",
      dangerouslySetInnerHTML: {
        __html: markup
      }
    });
  };
  const DNAEngine = () => /*#__PURE__*/React.createElement("div", {
    className: "w-full h-full flex items-center justify-center bg-zinc-950/20 rounded-3xl overflow-hidden opacity-40"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 400 300",
    className: "w-full h-full shrink-0"
  }, Array.from({
    length: 15
  }).map((_, index) => /*#__PURE__*/React.createElement("g", {
    key: index
  }, /*#__PURE__*/React.createElement("line", {
    x1: "140",
    x2: "260",
    y1: 50 + index * 14,
    y2: 50 + index * 14,
    stroke: "white",
    strokeOpacity: "0.05"
  }), /*#__PURE__*/React.createElement("circle", {
    r: "3",
    fill: "#10b981"
  }, /*#__PURE__*/React.createElement("animate", {
    attributeName: "cx",
    values: "140;260;140",
    dur: "4s",
    repeatCount: "indefinite",
    begin: `${index * 0.1}s`
  })), /*#__PURE__*/React.createElement("circle", {
    r: "3",
    fill: "#38bdf8"
  }, /*#__PURE__*/React.createElement("animate", {
    attributeName: "cx",
    values: "260;140;260",
    dur: "4s",
    repeatCount: "indefinite",
    begin: `${index * 0.1}s`
  }))))));
  const CardVisualStage = ({
    card,
    sceneEntry,
    className = '',
    compact = false,
    shortHeight = false,
    tinyLandscape = false,
    layout = null,
    externalPanelRef = null
  }) => {
    const hostRef = useRef(null);
    const [sceneStatus, setSceneStatus] = useState('fallback');
    const isStacked = layout?.stacked === true || layout?.narrowPortrait === true;
    const radiusClass = isStacked ? 'rounded-[22px]' : tinyLandscape ? 'rounded-[24px]' : shortHeight ? 'rounded-[30px]' : compact ? 'rounded-[40px]' : 'rounded-[60px]';
    const minHeightClass = isStacked ? 'min-h-0' : tinyLandscape ? 'min-h-0' : shortHeight ? 'min-h-[300px]' : compact ? 'min-h-[360px]' : 'min-h-[420px]';
    useEffect(() => {
      let cancelled = false;
      let teardown = null;
      if (hostRef.current) hostRef.current.innerHTML = '';
      if (externalPanelRef?.current) {
        installBiologyPanelScrollPreserver?.(externalPanelRef.current);
        renderBiologyPanelHtml?.(externalPanelRef.current, '', {
          preserveScroll: false
        });
      }
      setSceneStatus('fallback');
      if (!card || !sceneEntry) {
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
          if (!cancelled) setSceneStatus('fallback');
          return;
        }
        try {
          await loadSceneScript(`${sceneEntry.folder}/${config.entry || 'scene.js'}`);
        } catch (error) {
          if (!cancelled) setSceneStatus('fallback');
          return;
        }
        if (cancelled || !hostRef.current) return;
        const definition = window.BIO_VISUAL_SCENES?.[card.id];
        if (!definition || typeof definition.mount !== 'function') {
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
          installBiologyPanelScrollPreserver?.(context.externalPanel);
        }
        try {
          container.innerHTML = '';
          const mountResult = definition.mount(container, context);
          teardown = () => {
            if (typeof mountResult === 'function') {
              mountResult();
            } else if (typeof mountResult?.unmount === 'function') {
              mountResult.unmount();
            } else if (typeof definition.unmount === 'function') {
              definition.unmount(container, context);
            } else {
              container.innerHTML = '';
            }
          };
          await keepLoadingNoticeVisible();
          if (!cancelled) setSceneStatus('ready');
        } catch (error) {
          container.innerHTML = '';
          if (externalPanelRef?.current) {
            renderBiologyPanelHtml?.(externalPanelRef.current, '', {
              preserveScroll: false
            });
          }
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
          renderBiologyPanelHtml?.(externalPanelRef.current, '', {
            preserveScroll: false
          });
        }
      };
    }, [card?.id, sceneEntry?.folder, externalPanelRef]);
    return /*#__PURE__*/React.createElement("div", {
      "data-bio-scene-stage": "true",
      "data-bio-layout-profile": layout?.profile || 'standard',
      "data-bio-layout-mode": layout?.mode || 'standalone',
      "data-bio-layout-stack": isStacked ? 'stacked' : 'side',
      className: `flex-1 ${radiusClass} bg-zinc-950/50 border border-white/5 relative overflow-hidden group ${minHeightClass} ${className}`,
      style: {
        '--bio-touch-target': `${layout?.touchTarget || 44}px`,
        '--bio-scene-panel-width': `${layout?.panelWidth || 320}px`,
        '--bio-scene-panel-gap': `${layout?.panelGap || 24}px`,
        touchAction: 'none',
        overscrollBehavior: 'none',
        WebkitTapHighlightColor: 'transparent'
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: `absolute inset-0 transition-opacity duration-500 ${sceneStatus === 'ready' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`
    }, card?.engine === 'dna' ? /*#__PURE__*/React.createElement(DNAEngine, null) : /*#__PURE__*/React.createElement("div", {
      className: "w-full h-full"
    }, /*#__PURE__*/React.createElement("img", {
      src: resolveBiologyMediaThumbnailPath(card?.image, card?.fallbackImage || 'assets/c1.png', {
        width: 1280
      }),
      onError: event => handleBiologyMediaError(event, card?.fallbackImage || 'assets/c1.png'),
      className: "w-full h-full object-cover",
      alt: ""
    }))), /*#__PURE__*/React.createElement("div", {
      ref: hostRef,
      className: `absolute inset-0 transition-opacity duration-500 ${sceneStatus === 'ready' ? 'opacity-100' : 'opacity-0'}`
    }), sceneStatus === 'loading' ? /*#__PURE__*/React.createElement("div", {
      className: "absolute inset-0 z-20 flex items-center justify-center bg-black/45 px-6 pointer-events-none backdrop-blur-[2px]"
    }, /*#__PURE__*/React.createElement("div", {
      className: "w-full max-w-sm rounded-[18px] border border-emerald-300/15 bg-zinc-950/80 p-4 text-center shadow-[0_24px_70px_rgba(0,0,0,0.45)]"
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-[11px] font-black tracking-[0.22em] text-emerald-200 uppercase"
    }, "\u8BFE\u4EF6\u8D44\u6E90\u52A0\u8F7D\u4E2D"), /*#__PURE__*/React.createElement("div", {
      className: "mt-2 text-[13px] font-bold leading-6 text-white/78"
    }, "\u9996\u6B21\u6253\u5F00\u9700\u8981\u52A0\u8F7D\u4EA4\u4E92\u5F15\u64CE\u4E0E\u672C\u5730\u8D44\u6E90\uFF0C\u8BF7\u7A0D\u5019\u3002"), /*#__PURE__*/React.createElement("div", {
      className: "mt-4 h-1.5 overflow-hidden rounded-full bg-white/10"
    }, /*#__PURE__*/React.createElement("div", {
      className: "h-full w-2/5 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.50)] animate-pulse"
    })))) : null);
  };
  Object.assign(window.BiologyApp, {
    Icon,
    DNAEngine,
    CardVisualStage
  });
})();
