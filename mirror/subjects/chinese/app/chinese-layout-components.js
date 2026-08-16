window.ChineseApp = window.ChineseApp || {};

(() => {
    const app = window.ChineseApp;

    function CardTile({ card, onOpen, frame, recitationProgress }) {
        const [active, setActive] = React.useState(false);
        const compact = frame.dense || frame.tinyLandscape || frame.isPortrait;
        const cardHeight = frame.isPortrait ? 'min-h-[150px]' : frame.tinyLandscape ? 'min-h-[178px]' : frame.shortHeight ? 'min-h-[210px]' : frame.roomy ? 'min-h-[330px]' : 'min-h-[290px]';
        const padding = frame.isPortrait ? 'p-4 rounded-[20px]' : frame.tinyLandscape ? 'p-5 rounded-[24px]' : frame.shortHeight ? 'p-6 rounded-[26px]' : frame.roomy ? 'p-10 rounded-[40px]' : 'p-8 rounded-[34px]';
        const len = card.title.length;
        const titleClass = frame.isPortrait
            ? (len > 12 ? 'text-[11px]' : len > 8 ? 'text-[14px]' : 'text-[18px]')
            : compact
                ? (len > 12 ? 'text-[14px]' : len > 8 ? 'text-[18px]' : 'text-[22px]')
                : frame.roomy
                    ? (len > 12 ? 'text-[22px]' : len > 8 ? 'text-[28px]' : 'text-[36px]')
                    : (len > 12 ? 'text-[17px]' : len > 8 ? 'text-[22px]' : 'text-[28px]');
        const typeLabel = app.contentTypeLabel(card.contentType);
        const bgUrl = card.image;
        const isMasterpiece = Boolean(card.isMasterpiece);
        const isReady = card.status === 'ready' && (card.courseware?.entry || card.masterpieceTarget);
        const isTopic = Boolean(card.isTopic);
        const recitationPassage = app.getRecitationPassage?.(card.id);
        const recitationStatus = recitationPassage ? app.formatRecitationStatus(recitationProgress, recitationPassage.id) : '';

        return (
            <button
                type="button"
                aria-label={`查看${card.title}`}
                onClick={() => onOpen(card)}
                onMouseEnter={() => setActive(true)}
                onMouseLeave={() => setActive(false)}
                onFocus={() => setActive(true)}
                onBlur={() => setActive(false)}
                className={`cn-card group relative overflow-hidden appearance-none text-left transition-all duration-700 cursor-pointer border backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/80 ${active ? 'z-20 border-slate-400/60 bg-slate-500/15 -translate-y-2 scale-[1.02] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8),0_0_30px_rgba(148,163,184,0.25)]' : 'z-0 border-white/10 bg-zinc-900/40'} ${cardHeight} ${padding}`}
                style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
                <div 
                    className={`cn-card-art cn-card-art-${card.contentType} absolute inset-0 pointer-events-none transition-all duration-1000 ${active ? 'opacity-100 scale-105 rotate-1' : 'opacity-80'}`}
                    style={bgUrl ? { backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : isTopic || isMasterpiece ? { backgroundImage: 'radial-gradient(circle at 18% 12%, rgba(203, 151, 57, 0.32), transparent 34%), radial-gradient(circle at 78% 84%, rgba(125, 34, 34, 0.44), transparent 40%), linear-gradient(135deg, #22140e, #351510 52%, #0f1212)' } : undefined}
                >
                    <div className="cn-card-texture" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />
                </div>
                <div className="relative z-10 flex h-full flex-col w-full">
                    <div className="flex items-start justify-between gap-3">
                        <div className={`font-black uppercase ${frame.isPortrait ? 'text-[8px] tracking-[0.2em]' : 'text-[10px] tracking-[0.4em]'} ${active ? 'text-slate-300' : 'text-slate-500'}`}>
                            {typeLabel}
                        </div>
                        <div className={`rounded-full border px-2.5 py-1 text-[9px] font-black tracking-[0.16em] backdrop-blur-md ${isReady ? 'border-emerald-200/20 bg-emerald-300/10 text-emerald-100' : isTopic ? 'border-amber-200/25 bg-amber-300/10 text-amber-100' : isMasterpiece ? 'border-white/15 bg-black/35 text-zinc-300' : 'border-white/10 bg-black/35 text-zinc-400'}`}>{isMasterpiece ? (isReady ? `已整理 ${card.topicCount} 专题` : '规划中') : isReady ? '已接入' : isTopic ? '重点考查' : '待接入'}</div>
                    </div>
                    <h3 
                        className={`${titleClass} mt-4 font-bold leading-tight text-white transition-all duration-500 whitespace-nowrap overflow-visible ${active ? 'text-slate-100' : ''}`}
                        style={{ fontFamily: '"Kaiti", "STKaiti", "楷体", "华文楷体", "Georgia", serif' }}
                    >
                        {card.title}
                    </h3>
                    {recitationPassage ? <div className="cn-card-recitation-status">背诵 · {recitationStatus}</div> : null}
                    {!frame.isPortrait && (
                        <div className={`mt-5 flex flex-wrap gap-2 transition-all duration-500 ${active ? 'opacity-100' : 'opacity-90'}`}>
                            {card.tags.slice(0, 3).map(tag => <span key={tag} className="rounded-md border border-white/5 bg-white/5 px-2.5 py-1 text-[9px] font-bold text-zinc-300">#{tag}</span>)}
                        </div>
                    )}
                    <div className={`mt-auto flex items-center justify-between pt-5 transition-all duration-500 ${active ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                        <span className="text-[10px] font-black tracking-widest text-slate-300">{isMasterpiece && isReady ? '进入书目' : isReady ? '进入课件' : isTopic ? '查看考点' : isMasterpiece ? '查看简介' : '查看卡片'}</span>
                        <span className="text-sm font-black text-slate-300">→</span>
                    </div>
                </div>
                <div className={`absolute -inset-x-20 top-0 h-px bg-gradient-to-r from-transparent via-slate-400/70 to-transparent transition-transform duration-1000 ${active ? 'translate-x-full' : '-translate-x-full'}`} />
            </button>
        );
    }

    Object.assign(app, { CardTile });
})();
