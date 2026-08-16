window.ChineseApp = window.ChineseApp || {};
(() => {
  const app = window.ChineseApp;
  const {
    useState,
    useMemo,
    useEffect,
    loadChineseCurriculum,
    useDashboardViewport,
    useUnifiedSubjectBootstrap,
    CardTile,
    CardDetail,
    AccountOverlay,
    RecitationEntry,
    RecitationWorkspace,
    MasterpiecePracticeEntry,
    XiyoujiPracticeWorkspace
  } = app;
  function openChineseSubscription() {
    const protocol = String(window.location.protocol || '').trim().toLowerCase();
    const hostname = String(window.location.hostname || '').trim().toLowerCase();
    const isLocalHost = protocol === 'file:' || hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
    const subscriptionPath = isLocalHost ? '/dist-subscription/index.html' : '/subscription/';
    const returnPath = protocol === 'file:' ? '/subjects/chinese/' : `${window.location.pathname || '/subjects/chinese/'}${window.location.search || ''}`;
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
    const [recitationProgress, setRecitationProgress] = useState(() => app.loadRecitationProgress?.() || {
      version: 1,
      passages: {}
    });
    const [masterpiecePracticeOpen, setMasterpiecePracticeOpen] = useState(false);
    const {
      frame
    } = useDashboardViewport();
    const unifiedPayload = useUnifiedSubjectBootstrap('chinese');
    useEffect(() => {
      let cancelled = false;
      loadChineseCurriculum().then(payload => {
        if (!cancelled) setCurriculum(payload);
      }).catch(loadError => {
        if (!cancelled) setError(loadError.message || '课程目录加载失败。');
      });
      return () => {
        cancelled = true;
      };
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
    if (error) return /*#__PURE__*/React.createElement("main", {
      className: "cn-system-shell grid min-h-screen place-items-center p-6 text-sm font-bold text-rose-200"
    }, error);
    if (!curriculum) return /*#__PURE__*/React.createElement("main", {
      className: "cn-system-shell grid min-h-screen place-items-center p-6 text-sm font-bold tracking-[0.2em] text-white/60"
    }, "\u6B63\u5728\u8BFB\u53D6\u521D\u4E2D\u8BED\u6587\u5361\u7247\u76EE\u5F55...");
    const headerHeight = frame.isPortrait ? 48 : frame.tinyLandscape ? 52 : frame.roomy ? 66 : 60;
    const contentPadding = activeCard ? `${frame.shellPaddingY}px ${frame.shellPaddingX}px` : `${Math.max(8, frame.shellPaddingY - 8)}px ${frame.shellPaddingX}px ${frame.shellPaddingY}px`;
    const filterClass = `cn-seal shrink-0 border-2 font-bold whitespace-nowrap ${frame.isPortrait ? 'px-3 py-1 text-[11px]' : 'px-4 py-1.5 text-[13px] tracking-[0.18em]'}`;
    const headerBtnClass = `cn-header-btn shrink-0 font-bold whitespace-nowrap transition-all active:scale-95 ${frame.width < 480 ? 'px-2.5 py-1 text-[9px] tracking-wider' : 'px-4 py-2 text-[10px] tracking-[0.16em]'}`;
    const headerBtnVisible = frame.width < 360 ? 'hidden' : 'inline-block';
    const getSystemBgUrl = bookId => {
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
    const currentBookLabel = bookId === 'all' ? '全部单元' : bookId === 'masterpieces' ? '名著导读' : bookId === 'journey' ? '西游记专题' : app.MASTERPIECE_LIBRARY?.find(book => book.id === bookId)?.title || curriculum.books.find(book => book.id === bookId)?.label || '初中语文';
    const shellStyle = sysBg ? {
      backgroundImage: `linear-gradient(to bottom, rgba(14, 16, 16, 0.35), rgba(14, 16, 16, 0.6)), url(${sysBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      transition: 'background-image 0.5s ease-in-out'
    } : undefined;
    return /*#__PURE__*/React.createElement("div", {
      className: "cn-system-shell fixed inset-0 flex flex-col overflow-hidden text-zinc-100",
      style: shellStyle
    }, /*#__PURE__*/React.createElement("header", {
      className: "z-20 flex shrink-0 items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-3xl",
      style: {
        height: `${headerHeight}px`,
        padding: `0 ${frame.shellPaddingX}px`
      }
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => {
        setRecitationOpen(false);
        setMasterpiecePracticeOpen(false);
        setActiveCardId('');
        setBookId('all');
      },
      className: "group flex items-center gap-3 bg-transparent text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/80"
    }, /*#__PURE__*/React.createElement("span", {
      className: "grid h-8 w-8 place-items-center rounded-md border border-slate-500/60 bg-slate-500/10 text-[14px] font-bold text-slate-300 transition-all group-hover:bg-slate-500/20"
    }, "\u6587"), /*#__PURE__*/React.createElement("span", {
      className: `${frame.width < 640 ? 'hidden' : 'inline'} text-[12px] font-bold tracking-widest text-white`
    }, "PowerTech在线教学演示")), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-3"
    }, activeCard && /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => setActiveCardId(''),
      className: "text-[11px] font-bold tracking-widest text-zinc-400 transition-all hover:text-white"
    }, "\u8FD4\u56DE\u5217\u8868"), activeRecitationPassage && /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => openRecitation(activeRecitationPassage.id),
      className: `${headerBtnVisible} ${headerBtnClass}`
    }, "\u80CC\u8BF5\u672C\u7BC7"), /*#__PURE__*/React.createElement("span", {
      className: `${frame.width < 800 ? 'hidden' : 'inline'} h-4 w-px bg-white/10`
    }), /*#__PURE__*/React.createElement("div", {
      className: `${frame.width < 800 ? 'hidden' : 'flex'} items-center gap-2.5 text-[10px] font-bold text-slate-500`
    }, /*#__PURE__*/React.createElement("span", null, "\u521D\u4E2D"), /*#__PURE__*/React.createElement("span", {
      className: "opacity-30"
    }, "/"), /*#__PURE__*/React.createElement("span", {
      className: "text-white"
    }, currentBookLabel)))), /*#__PURE__*/React.createElement("main", {
      className: "flex-1 overflow-hidden",
      style: {
        padding: contentPadding
      },
      onClick: activeCard ? event => {
        if (event.target === event.currentTarget) setActiveCardId('');
      } : undefined
    }, /*#__PURE__*/React.createElement("div", {
      className: "mx-auto h-full",
      style: {
        maxWidth: `${frame.isPortrait ? frame.width : frame.ultraWide ? 1840 : frame.roomy ? 1660 : 1280}px`
      }
    }, !activeCard ? /*#__PURE__*/React.createElement("div", {
      className: "flex h-full flex-col animate-in fade-in duration-700"
    }, /*#__PURE__*/React.createElement("div", {
      className: `flex shrink-0 border-b border-white/5 pb-2 ${frame.width < 960 ? 'flex-col items-start gap-2' : 'items-center justify-between'}`
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex max-w-full gap-3 overflow-x-auto pb-1.5 no-scrollbar",
      style: {
        touchAction: 'pan-x'
      }
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => setBookId('all'),
      className: `${filterClass} ${bookId === 'all' ? 'cn-seal-active' : 'cn-seal-inactive'}`,
      style: {
        fontFamily: '"Kaiti", "STKaiti", "楷体", "华文楷体", "Georgia", serif'
      }
    }, "\u5168\u90E8\u5355\u5143"), curriculum.books.map(book => /*#__PURE__*/React.createElement("button", {
      type: "button",
      key: book.id,
      onClick: () => setBookId(book.id),
      className: `${filterClass} ${bookId === book.id ? 'cn-seal-active' : 'cn-seal-inactive'}`,
      style: {
        fontFamily: '"Kaiti", "STKaiti", "楷体", "华文楷体", "Georgia", serif'
      }
    }, book.label)), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => setBookId('masterpieces'),
      className: `${filterClass} ${bookId === 'masterpieces' || bookId === 'journey' || Boolean(app.MASTERPIECE_TOPIC_MAP?.[bookId]) ? 'cn-seal-active' : 'cn-seal-inactive'}`,
      style: {
        fontFamily: '"Kaiti", "STKaiti", "楷体", "华文楷体", "Georgia", serif'
      }
    }, "\u540D\u8457\u5BFC\u8BFB")), /*#__PURE__*/React.createElement("div", {
      className: `${frame.width < 960 ? '' : 'ml-4'} flex shrink-0 items-center gap-3 whitespace-nowrap`
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-[10px] font-bold tracking-[0.3em] text-zinc-500"
    }, "\u6A21\u5757\u5355\u5143\u6570\u91CF\uFF1A", visibleCards.length))), /*#__PURE__*/React.createElement("div", {
      className: "flex-1 overflow-y-auto custom-scrollbar",
      style: {
        padding: `${frame.isPortrait ? 8 : 16}px ${frame.isPortrait ? 2 : 16}px ${frame.isPortrait ? 94 : 112}px`
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "grid",
      style: {
        gridTemplateColumns: `repeat(${frame.cardColumns}, minmax(0, 1fr))`,
        gap: `${frame.isPortrait ? 8 : frame.roomy ? 24 : 18}px`
      }
    }, visibleCards.map(card => /*#__PURE__*/React.createElement(CardTile, {
      key: card.id,
      card: card,
      frame: frame,
      onOpen: openCard,
      recitationProgress: recitationProgress
    }))))) : /*#__PURE__*/React.createElement(CardDetail, {
      card: activeCard,
      frame: frame
    }))), null, !activeCard && !overlayMode && !recitationOpen && !masterpiecePracticeOpen && !isMasterpieceContext ? /*#__PURE__*/React.createElement(RecitationEntry, {
      frame: frame,
      dueCount: dueRecitationCount,
      onOpen: () => openRecitation()
    }) : null, !activeCard && !overlayMode && !recitationOpen && !masterpiecePracticeOpen && bookId === 'journey' ? /*#__PURE__*/React.createElement(MasterpiecePracticeEntry, {
      frame: frame,
      onOpen: () => setMasterpiecePracticeOpen(true)
    }) : null, recitationOpen ? /*#__PURE__*/React.createElement(RecitationWorkspace, {
      cards: curriculum.cards,
      frame: frame,
      initialPassageId: recitationPassageId,
      progress: recitationProgress,
      onProgressChange: setRecitationProgress,
      onClose: () => setRecitationOpen(false),
      onOpenCard: openCardFromRecitation
    }) : null, masterpiecePracticeOpen ? /*#__PURE__*/React.createElement(XiyoujiPracticeWorkspace, {
      onClose: () => setMasterpiecePracticeOpen(false)
    }) : null);
  }
  ReactDOM.createRoot(document.getElementById('root')).render( /*#__PURE__*/React.createElement(ChineseCatalogApp, null));
})();
