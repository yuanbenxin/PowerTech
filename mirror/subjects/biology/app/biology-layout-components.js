/*
  Shared layout and card presentation components.
*/

window.BiologyApp = window.BiologyApp || {};

(() => {
  const app = window.BiologyApp;
  const {
    useLandscapeViewport,
    buildCoursewareGuide,
    LANDING_PANELS,
    CardVisualStage,
    Icon,
    fetchJsonSafe,
    resolveBiologyMediaThumbnailPath,
    handleBiologyMediaError,
    useTouchCardActivation
  } = app;

  const PortraitNotice = ({ title, onBack }) => (
    <div className="absolute inset-0 flex items-center justify-center px-6 py-8">
      <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-black/65 backdrop-blur-3xl p-8 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
          <div className="relative h-10 w-14">
            <div className="absolute inset-0 rounded-[14px] border-2 border-emerald-400/90" />
            <div className="absolute left-1/2 top-1/2 h-12 w-8 -translate-x-1/2 -translate-y-1/2 rotate-90 rounded-[10px] border-2 border-emerald-400/35" />
          </div>
        </div>
        <div className="text-[12px] tracking-[0.32em] text-zinc-500 uppercase mb-4">仅限横屏模式</div>
        <h2 className="text-3xl font-black italic tracking-tight text-emerald-400 mb-3 break-words">{title}</h2>
        <p className="text-base leading-8 text-zinc-200 mb-3">当前系统仅支持横屏使用。</p>
        <p className="text-sm leading-7 text-zinc-400 mb-8">
          请将设备旋转为横屏后打开，这样才能完整显示卡片、信息面板和可视化内容。
        </p>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="w-full rounded-2xl bg-emerald-500 py-4 text-[11px] font-black tracking-[0.32em] text-black transition-all active:scale-[0.98] active:brightness-95 active:shadow-[0_0_24px_rgba(16,185,129,0.35)]"
          >
            返回上一层
          </button>
        ) : null}
      </div>
    </div>
  );

  const LandscapeOnlyViewport = ({ title, backgroundImage, onBack, children }) => {
    const viewport = useLandscapeViewport();
    const backgroundSrc = resolveBiologyMediaThumbnailPath(backgroundImage, 'assets/bg_j.png', { width: 1920 });

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
            onError={event => handleBiologyMediaError(event, backgroundImage || 'assets/bg_j.png')}
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
          className="absolute inset-0 overflow-hidden z-10"
        >
          <div className="w-full h-full overflow-hidden">
            {typeof children === 'function' ? children(viewport) : children}
          </div>
        </div>
      </div>
    );
  };

  const CoursewareWorkbench = ({ card, sceneEntry, backgroundImage, onBack, onExit }) => {
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
          const isPortraitCourseware = frame.narrowPortrait || viewport.isPortrait;
          const isStackedCourseware = isPortraitCourseware || frame.width <= 680;
          const headerHeight = isStackedCourseware ? 42 : isTinyLandscape ? 44 : frame.ultraWide ? 92 : frame.roomy ? 86 : frame.shortHeight ? 68 : frame.dense ? 74 : 80;
          const horizontalPadding = isStackedCourseware ? Math.max(8, Math.min(14, Math.round(frame.width * 0.035))) : isTinyLandscape ? 8 : frame.ultraWide ? 40 : frame.roomy ? 36 : frame.dense ? 22 : 32;
          const verticalPadding = isStackedCourseware ? 8 : isTinyLandscape ? 6 : frame.ultraWide ? 28 : frame.roomy ? 26 : frame.shortHeight ? 16 : frame.dense ? 20 : 24;
          const headerGap = isStackedCourseware ? 8 : isTinyLandscape ? 10 : frame.dense ? 16 : 20;
          const asideWidth = isStackedCourseware
            ? frame.width
            : usesScenePanel && isTinyLandscape
            ? Math.max(240, Math.min(276, Math.round(frame.width * 0.31)))
            : frame.coursewareAsideWidth;
          const shellMaxWidth = isStackedCourseware ? frame.width : isTinyLandscape ? frame.width : frame.ultraWide ? 1840 : frame.roomy ? 1720 : 1600;
          const panelGap = isStackedCourseware ? 8 : isTinyLandscape ? 8 : frame.panelGap;
          const panelRadius = isStackedCourseware ? 18 : isTinyLandscape ? 20 : frame.shortHeight ? 28 : 32;
          const touchTarget = isStackedCourseware ? 40 : isTinyLandscape ? 40 : 44;
          const headerActionClass = `text-[10px] font-black text-white/72 border border-white/10 bg-white/[0.04] transition-all hover:text-white active:scale-95 active:text-white shrink-0 ${isStackedCourseware ? 'px-2 py-1.5 rounded-md tracking-[0.06em]' : 'px-3 py-2 rounded-lg tracking-[0.14em]'}`;
          const bodyHeight = Math.max(0, frame.height - headerHeight - verticalPadding * 2);
          const stackedPanelHeight = isStackedCourseware
            ? Math.max(220, Math.min(360, Math.round(bodyHeight * (usesScenePanel ? 0.38 : 0.34))))
            : 0;
          const stackedSceneMinHeight = isStackedCourseware
            ? Math.max(240, Math.min(460, bodyHeight - stackedPanelHeight - panelGap))
            : 0;
          const coursewareLayout = {
            mode: usesScenePanel ? 'scene-controls' : 'guide',
            profile: frame.id,
            orientation: isStackedCourseware ? 'portrait' : 'landscape',
            width: frame.width,
            height: frame.height,
            dense: frame.dense,
            shortHeight: frame.shortHeight,
            tinyLandscape: isTinyLandscape,
            narrowPortrait: frame.narrowPortrait,
            stacked: isStackedCourseware,
            panelPlacement: isStackedCourseware ? 'bottom' : 'right',
            panelHeight: stackedPanelHeight,
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
              data-courseware-orientation={coursewareLayout.orientation}
              data-courseware-panel-placement={coursewareLayout.panelPlacement}
              data-courseware-compact={coursewareLayout.stacked ? 'stacked-portrait' : coursewareLayout.tinyLandscape ? 'tiny-landscape' : coursewareLayout.shortHeight ? 'short-height' : coursewareLayout.dense ? 'dense' : 'roomy'}
              style={{
                '--bio-scene-panel-width': `${asideWidth}px`,
                '--bio-scene-panel-height': `${stackedPanelHeight}px`,
                '--bio-scene-panel-gap': `${panelGap}px`,
                '--bio-scene-panel-radius': `${panelRadius}px`,
                '--bio-touch-target': `${touchTarget}px`
              }}
            >
              <header
                className="border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-3xl z-50 shrink-0"
                style={{ height: `${headerHeight}px`, padding: `0 ${horizontalPadding}px` }}
              >
                <div
                  className="flex items-center min-w-0"
                  style={{ gap: `${headerGap}px`, maxWidth: isStackedCourseware ? (typeof onExit === 'function' ? 'calc(100% - 76px)' : '100%') : 'calc(100% - 160px)' }}
                >
                  <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-3 text-[10px] font-black tracking-widest text-zinc-400 transition-all hover:text-white active:scale-95 active:bg-white/[0.08] active:text-white shrink-0"
                    style={{
                      minHeight: `${touchTarget}px`,
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    返回列表
                  </button>
                  {!isStackedCourseware ? (
                    <>
                      <div className="h-7 w-[1px] bg-white/10 shrink-0" />
                      <div className="min-w-0 max-w-[980px]">
                        <div
                          className={`font-black italic tracking-tight text-emerald-400 truncate ${
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
                  <div className={`${isStackedCourseware || isTinyLandscape ? 'hidden' : 'flex'} items-center gap-2.5 opacity-60`}>
                    <div className="w-5 h-5 rounded border border-emerald-500/40 bg-emerald-500/5 flex items-center justify-center">
                      <span className="text-emerald-400 font-black text-[10px]">生</span>
                    </div>
                    <span className="text-[10px] font-black tracking-widest text-white/40 uppercase">PowerTech在线教学演示</span>
                  </div>
                  {typeof onExit === 'function' ? (
                    <button
                      type="button"
                      onClick={onExit}
                      className={headerActionClass}
                      style={{ minHeight: `${touchTarget}px`, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                    >
                      退出系统
                    </button>
                  ) : null}
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
                    gridTemplateColumns: isStackedCourseware ? 'minmax(0,1fr)' : usesScenePanel ? `minmax(0,1fr) ${asideWidth}px` : `minmax(0,1fr) ${asideWidth}px`,
                    gridTemplateRows: isStackedCourseware ? `minmax(${stackedSceneMinHeight}px, 1fr) ${stackedPanelHeight}px` : undefined,
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
                        data-bio-scene-controls="true"
                        data-bio-panel-scroll-root="true"
                        data-layout-profile={coursewareLayout.profile}
                        className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto no-scrollbar"
                        style={{
                          borderRadius: 0,
                          padding: 0,
                          display: 'block',
                          background: 'transparent',
                          border: 0,
                          scrollbarWidth: 'none',
                          overflowX: 'hidden',
                          overflowY: 'auto',
                          scrollPaddingBottom: 'max(12px, env(safe-area-inset-bottom))',
                          touchAction: 'pan-y',
                          overscrollBehaviorX: 'none',
                          overscrollBehaviorY: 'contain',
                          WebkitOverflowScrolling: 'touch',
                          WebkitTapHighlightColor: 'transparent'
                        }}
                      />
                    ) : (
                      <div
                        className="flex-1 min-h-0 border border-white/5 bg-zinc-900/60 backdrop-blur-3xl flex flex-col overflow-y-auto no-scrollbar"
                        style={{
                          borderRadius: `${panelRadius}px`,
                          padding: isStackedCourseware ? '14px' : frame.shortHeight ? '16px' : frame.dense ? '18px' : '20px',
                          gap: isStackedCourseware ? '10px' : frame.shortHeight ? '12px' : '14px'
                        }}
                      >
                        <div className="flex-1 flex flex-col">
                          <div style={{ marginBottom: frame.shortHeight ? '18px' : '24px' }}>
                            <div className="text-[10px] tracking-[0.3em] text-zinc-500 uppercase mb-4">本节学习重点</div>
                            <div className={frame.shortHeight ? 'space-y-3' : 'space-y-4'}>
                              {guide.focusPoints.map((point, index) => (
                                <div key={point} className="flex gap-3 items-start">
                                  <div className="w-6 h-6 rounded-full border border-emerald-400/20 bg-emerald-500/10 text-emerald-300 text-[11px] font-black flex items-center justify-center shrink-0">
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
                            <div className="text-[10px] tracking-[0.3em] text-emerald-400 uppercase mb-3">课程学习定位</div>
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
                          className="rounded-[24px] border border-emerald-500/12 bg-emerald-500/[0.06] shrink-0"
                          style={{
                            marginTop: frame.shortHeight ? '4px' : '8px',
                            padding: frame.shortHeight ? '14px 16px' : '16px 18px'
                          }}
                        >
                          <div className="text-[10px] tracking-[0.3em] text-emerald-300 uppercase mb-4">交互操作提醒</div>
                          <div className={frame.shortHeight ? 'space-y-2.5' : 'space-y-3'}>
                            {guide.tips.map(tip => (
                              <div key={tip} className="flex gap-3 items-start">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 mt-2 shrink-0" />
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
        className={`group relative overflow-hidden appearance-none bg-transparent text-left transition-all duration-700 ${card.isLocked ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'} border backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/80 ${
          isActive
            ? 'z-20 border-emerald-400/60 bg-emerald-500/15 -translate-y-2 scale-[1.02] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8),0_0_30px_rgba(16,185,129,0.25)]'
            : 'z-0 border-white/10 bg-zinc-900/40'
        } ${cardHeightClass} ${tileShellClass}`}
        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
      >
        <div
          className={`absolute inset-0 transition-all duration-1000 ease-out pointer-events-none ${
            isActive ? 'opacity-50 scale-110 rotate-1' : card.isLocked ? 'opacity-15 grayscale brightness-[0.7]' : 'opacity-20 scale-100 rotate-0'
          }`}
        >
          <img
            src={resolveBiologyMediaThumbnailPath(card.image, card.fallbackImage || 'assets/c1.png', { width: 720 })}
            onError={event => handleBiologyMediaError(event, card.fallbackImage || 'assets/c1.png')}
            className={`w-full h-full object-cover mix-blend-screen transition-all duration-700 ${isActive ? 'brightness-125' : 'brightness-100'}`}
            alt=""
          />
        </div>

        <div className="relative z-20 flex flex-col h-full">
          <div className="flex justify-between items-start">
            <div
              className={`${levelClass} font-black uppercase transition-colors duration-500 ${
                isActive ? 'text-emerald-400' : card.isLocked ? 'text-zinc-500' : 'text-emerald-500'
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
              isActive ? 'text-emerald-300' : card.isLocked ? 'text-zinc-400' : ''
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
              <span className={`text-[10px] font-black tracking-widest ${card.isLocked ? 'text-zinc-500' : 'text-emerald-500'}`}>{actionLabel}</span>
              {!card.isLocked && <Icon name="ArrowRight" size={12} className="text-emerald-500 animate-pulse" />}
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
            className={`absolute -inset-x-20 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent transition-transform duration-1000 transform ${
              isActive ? 'translate-x-full' : '-translate-x-full'
            }`}
          />
        )}
      </button>
    );
  });

  Object.assign(window.BiologyApp, {
    PortraitNotice,
    LandscapeOnlyViewport,
    CoursewareWorkbench,
    CardTile
  });
})();
