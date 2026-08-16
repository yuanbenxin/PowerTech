window.ChineseApp = window.ChineseApp || {};

(() => {
    const app = window.ChineseApp;
    const { useState, useMemo, useEffect, loadChineseCurriculum, useDashboardViewport, useUnifiedSubjectBootstrap, CardTile, CardDetail, AccountOverlay, RecitationEntry, RecitationWorkspace, MasterpiecePracticeEntry, XiyoujiPracticeWorkspace } = app;

    function openChineseSubscription() {
        const protocol = String(window.location.protocol || '').trim().toLowerCase();
        const hostname = String(window.location.hostname || '').trim().toLowerCase();
        const isLocalHost = protocol === 'file:' || hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
        const subscriptionPath = isLocalHost ? '/dist-subscription/index.html' : '/subscription/';
        const returnPath = protocol === 'file:'
            ? '/subjects/chinese/'
            : `${window.location.pathname || '/subjects/chinese/'}${window.location.search || ''}`;
        const url = new URL(subscriptionPath, window.location.href);
        url.searchParams.set('subject', 'chinese');
        url.searchParams.set('return', returnPath);
        window.location.assign(url.toString());
    }

    function ChineseCatalogApp() {
        const [curriculum, setCurriculum] = useState(null);
        const [error, setError] = useState('');
        const [bookId, setBookId] = useState('all');
        const [activeCardId, setActiveCardId] = useState('');
        const [overlayMode, setOverlayMode] = useState('');
        const [recitationOpen, setRecitationOpen] = useState(false);
        const [recitationPassageId, setRecitationPassageId] = useState('');
        const [recitationProgress, setRecitationProgress] = useState(() => app.loadRecitationProgress?.() || { version: 1, passages: {} });
        const [masterpiecePracticeOpen, setMasterpiecePracticeOpen] = useState(false);
        const { frame } = useDashboardViewport();
        const unifiedPayload = useUnifiedSubjectBootstrap('chinese');

        useEffect(() => {
            let cancelled = false;
            loadChineseCurriculum().then(payload => {
                if (!cancelled) setCurriculum(payload);
            }).catch(loadError => {
                if (!cancelled) setError(loadError.message || '课程目录加载失败。');
            });
            return () => { cancelled = true; };
        }, []);

        const visibleCards = useMemo(() => {
            if (!curriculum) return [];
            if (bookId === 'masterpieces') return app.MASTERPIECE_LIBRARY || [];
            if (bookId === 'journey') return app.JOURNEY_TO_THE_WEST_CARDS || [];
            if (app.MASTERPIECE_TOPIC_MAP?.[bookId]) return app.MASTERPIECE_TOPIC_MAP[bookId];
            return curriculum.cards.filter(card => bookId === 'all' || card.bookId === bookId);
        }, [curriculum, bookId]);
        const activeCard = useMemo(() => visibleCards.find(card => card.id === activeCardId) || null, [visibleCards, activeCardId]);
        const activeRecitationPassage = activeCard ? app.getRecitationPassage(activeCard.id) : null;
        const dueRecitationCount = useMemo(() => Object.values(recitationProgress?.passages || {}).filter(item => item.nextReviewAt && new Date(item.nextReviewAt).getTime() <= Date.now()).length, [recitationProgress]);
        const isInsideMasterpiece = bookId === 'journey' || Boolean(app.MASTERPIECE_TOPIC_MAP?.[bookId]);
        const isMasterpieceContext = bookId === 'masterpieces' || isInsideMasterpiece;

        const exitSubjectSystem = () => {
            window.location.href = '/';
        };

        const openRecitation = (passageId = '') => {
            setOverlayMode('');
            setRecitationPassageId(passageId || app.RECITATION_LIBRARY[0]?.id || '');
            setRecitationOpen(true);
        };

        const openCardFromRecitation = cardId => {
            const card = curriculum.cards.find(item => item.id === cardId);
            if (!card) return;
            setRecitationOpen(false);
            setBookId(card.bookId);
            setActiveCardId(card.id);
        };

        const openCard = card => {
            if (!card) return;
            if (card.masterpieceTarget) {
                setRecitationOpen(false);
                setMasterpiecePracticeOpen(false);
                setActiveCardId('');
                setBookId(card.masterpieceTarget);
                return;
            }
            setActiveCardId(card.id);
        };

        useEffect(() => {
            if (activeCardId && !visibleCards.some(card => card.id === activeCardId)) setActiveCardId('');
        }, [visibleCards, activeCardId]);

        if (error) return <main className="cn-system-shell grid min-h-screen place-items-center p-6 text-sm font-bold text-rose-200">{error}</main>;
        if (!curriculum) return <main className="cn-system-shell grid min-h-screen place-items-center p-6 text-sm font-bold tracking-[0.2em] text-white/60">正在读取初中语文卡片目录...</main>;

        const headerHeight = frame.isPortrait ? 48 : frame.tinyLandscape ? 52 : frame.roomy ? 66 : 60;
        const contentPadding = activeCard ? `${frame.shellPaddingY}px ${frame.shellPaddingX}px` : `${Math.max(8, frame.shellPaddingY - 8)}px ${frame.shellPaddingX}px ${frame.shellPaddingY}px`;
        const filterClass = `cn-seal shrink-0 border-2 font-bold whitespace-nowrap ${frame.isPortrait ? 'px-3 py-1 text-[11px]' : 'px-4 py-1.5 text-[13px] tracking-[0.18em]'}`;
        const headerBtnClass = `cn-header-btn shrink-0 font-bold whitespace-nowrap transition-all active:scale-95 ${frame.width < 480 ? 'px-2.5 py-1 text-[9px] tracking-wider' : 'px-4 py-2 text-[10px] tracking-[0.16em]'}`;
        const headerBtnVisible = frame.width < 360 ? 'hidden' : 'inline-block';

        const getSystemBgUrl = (bookId) => {
            if (!bookId) return '';
            if (bookId === 'all') return 'assets/media/grades/grade_all.jpg';
            if (bookId === 'masterpieces') return 'assets/media/grades/grade_7.jpg';
            if (bookId.startsWith('c7')) return 'assets/media/grades/grade_7.jpg';
            if (bookId.startsWith('c8')) return 'assets/media/grades/grade_8.jpg';
            if (bookId.startsWith('c9')) return 'assets/media/grades/grade_9.jpg';
            if (bookId === 'journey') return 'assets/media/masterpieces/xiyouji.jpg';
            if (app.MASTERPIECE_TOPIC_MAP?.[bookId]) {
                const book = app.MASTERPIECE_LIBRARY?.find(b => b.masterpieceTarget === bookId || b.id === bookId);
                return book?.image || 'assets/media/grades/grade_7.jpg';
            }
            return '';
        };
        const sysBg = getSystemBgUrl(bookId);
        const currentBookLabel = bookId === 'all'
            ? '全部单元'
            : bookId === 'masterpieces'
                ? '名著导读'
            : bookId === 'journey'
                ? '西游记专题'
                : app.MASTERPIECE_LIBRARY?.find(book => book.id === bookId)?.title || curriculum.books.find(book => book.id === bookId)?.label || '初中语文';
        const shellStyle = sysBg 
            ? { 
                backgroundImage: `linear-gradient(to bottom, rgba(14, 16, 16, 0.35), rgba(14, 16, 16, 0.6)), url(${sysBg})`, 
                backgroundSize: 'cover', 
                backgroundPosition: 'center', 
                transition: 'background-image 0.5s ease-in-out' 
              } 
            : undefined;

        return (
            <div className="cn-system-shell fixed inset-0 flex flex-col overflow-hidden text-zinc-100" style={shellStyle}>
                <header className="z-20 flex shrink-0 items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-3xl" style={{ height: `${headerHeight}px`, padding: `0 ${frame.shellPaddingX}px` }}>
                    <button type="button" onClick={() => { setRecitationOpen(false); setMasterpiecePracticeOpen(false); setActiveCardId(''); setBookId('all'); }} className="group flex items-center gap-3 bg-transparent text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/80">
                        <span className="grid h-8 w-8 place-items-center rounded-md border border-slate-500/60 bg-slate-500/10 text-[14px] font-bold text-slate-300 transition-all group-hover:bg-slate-500/20">文</span>
                        <span className={`${frame.width < 640 ? 'hidden' : 'inline'} text-[12px] font-bold tracking-widest text-white`}>PowerTech在线教学演示</span>
                    </button>
                    <div className="flex items-center gap-3">
                        {activeCard && <button type="button" onClick={() => setActiveCardId('')} className="text-[11px] font-bold tracking-widest text-zinc-400 transition-all hover:text-white">返回列表</button>}
                        {activeRecitationPassage && <button type="button" onClick={() => openRecitation(activeRecitationPassage.id)} className={`${headerBtnVisible} ${headerBtnClass}`}>背诵本篇</button>}
                        <button type="button" onClick={() => setOverlayMode('account')} className={`${headerBtnVisible} ${headerBtnClass}`}>个人中心</button>
                        <button type="button" onClick={openChineseSubscription} className={`${headerBtnVisible} ${headerBtnClass}`}>订阅中心</button>
                        <button type="button" onClick={exitSubjectSystem} className={`${headerBtnVisible} ${headerBtnClass}`}>退出系统</button>
                        <span className={`${frame.width < 800 ? 'hidden' : 'inline'} h-4 w-px bg-white/10`} />
                        <div className={`${frame.width < 800 ? 'hidden' : 'flex'} items-center gap-2.5 text-[10px] font-bold text-slate-500`}><span>初中</span><span className="opacity-30">/</span><span className="text-white">{currentBookLabel}</span></div>
                    </div>
                </header>
                <main className="flex-1 overflow-hidden" style={{ padding: contentPadding }} onClick={activeCard ? event => { if (event.target === event.currentTarget) setActiveCardId(''); } : undefined}>
                    <div className="mx-auto h-full" style={{ maxWidth: `${frame.isPortrait ? frame.width : frame.ultraWide ? 1840 : frame.roomy ? 1660 : 1280}px` }}>
                        {!activeCard ? (
                            <div className="flex h-full flex-col animate-in fade-in duration-700">
                                <div className={`flex shrink-0 border-b border-white/5 pb-2 ${frame.width < 960 ? 'flex-col items-start gap-2' : 'items-center justify-between'}`}>
                                    <div className="flex max-w-full gap-3 overflow-x-auto pb-1.5 no-scrollbar" style={{ touchAction: 'pan-x' }}>
                                        <button 
                                            type="button" 
                                            onClick={() => setBookId('all')} 
                                            className={`${filterClass} ${bookId === 'all' ? 'cn-seal-active' : 'cn-seal-inactive'}`}
                                            style={{ fontFamily: '"Kaiti", "STKaiti", "楷体", "华文楷体", "Georgia", serif' }}
                                        >
                                            全部单元
                                        </button>
                                        {curriculum.books.map(book => (
                                            <button 
                                                type="button" 
                                                key={book.id} 
                                                onClick={() => setBookId(book.id)} 
                                                className={`${filterClass} ${bookId === book.id ? 'cn-seal-active' : 'cn-seal-inactive'}`}
                                                style={{ fontFamily: '"Kaiti", "STKaiti", "楷体", "华文楷体", "Georgia", serif' }}
                                            >
                                                {book.label}
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => setBookId('masterpieces')}
                                            className={`${filterClass} ${bookId === 'masterpieces' || bookId === 'journey' || Boolean(app.MASTERPIECE_TOPIC_MAP?.[bookId]) ? 'cn-seal-active' : 'cn-seal-inactive'}`}
                                            style={{ fontFamily: '"Kaiti", "STKaiti", "楷体", "华文楷体", "Georgia", serif' }}
                                        >
                                            名著导读
                                        </button>
                                    </div>
                                    <div className={`${frame.width < 960 ? '' : 'ml-4'} flex shrink-0 items-center gap-3 whitespace-nowrap`}>
                                        <div className="text-[10px] font-bold tracking-[0.3em] text-zinc-500">模块单元数量：{visibleCards.length}</div>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ padding: `${frame.isPortrait ? 8 : 16}px ${frame.isPortrait ? 2 : 16}px ${frame.isPortrait ? 94 : 112}px` }}>
                                    <div className="grid" style={{ gridTemplateColumns: `repeat(${frame.cardColumns}, minmax(0, 1fr))`, gap: `${frame.isPortrait ? 8 : frame.roomy ? 24 : 18}px` }}>
                                        {visibleCards.map(card => <CardTile key={card.id} card={card} frame={frame} onOpen={openCard} recitationProgress={recitationProgress} />)}
                                    </div>
                                </div>
                            </div>
                        ) : <CardDetail card={activeCard} frame={frame} />}
                    </div>
                </main>
                {overlayMode === 'account' ? <AccountOverlay payload={unifiedPayload} onClose={() => setOverlayMode('')} /> : null}
                {!activeCard && !overlayMode && !recitationOpen && !masterpiecePracticeOpen && !isMasterpieceContext ? <RecitationEntry frame={frame} dueCount={dueRecitationCount} onOpen={() => openRecitation()} /> : null}
                {!activeCard && !overlayMode && !recitationOpen && !masterpiecePracticeOpen && bookId === 'journey' ? <MasterpiecePracticeEntry frame={frame} onOpen={() => setMasterpiecePracticeOpen(true)} /> : null}
                {recitationOpen ? (
                    <RecitationWorkspace
                        cards={curriculum.cards}
                        frame={frame}
                        initialPassageId={recitationPassageId}
                        progress={recitationProgress}
                        onProgressChange={setRecitationProgress}
                        onClose={() => setRecitationOpen(false)}
                        onOpenCard={openCardFromRecitation}
                    />
                ) : null}
                {masterpiecePracticeOpen ? <XiyoujiPracticeWorkspace onClose={() => setMasterpiecePracticeOpen(false)} /> : null}
            </div>
        );
    }

    ReactDOM.createRoot(document.getElementById('root')).render(<ChineseCatalogApp />);
})();
