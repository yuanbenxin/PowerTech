window.ChineseApp = window.ChineseApp || {};
(() => {
  const app = window.ChineseApp;
  const {
    useEffect,
    useMemo,
    useState
  } = app;
  function MasterpiecePracticeEntry({
    frame,
    onOpen
  }) {
    return /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: `cn-masterpiece-practice-entry ${frame.isPortrait ? 'is-portrait' : ''}`,
      onClick: onOpen,
      "aria-label": "\u6253\u5F00\u897F\u6E38\u8BB0\u8BFB\u56FE\u7CBE\u7EC3"
    }, /*#__PURE__*/React.createElement("span", {
      className: "cn-masterpiece-practice-seal"
    }, "\u7EC3"), /*#__PURE__*/React.createElement("span", {
      className: "cn-masterpiece-practice-label"
    }, "\u897F\u6E38\u7CBE\u7EC3"));
  }
  function XiyoujiPracticeWorkspace({
    onClose
  }) {
    const [payload, setPayload] = useState(null);
    const [loadError, setLoadError] = useState('');
    const [progress, setProgress] = useState(() => app.loadMasterpiecePracticeProgress());
    const [view, setView] = useState('home');
    const [sessionMode, setSessionMode] = useState('smart');
    const [queue, setQueue] = useState([]);
    const [index, setIndex] = useState(0);
    const [selectedChoiceId, setSelectedChoiceId] = useState('');
    const [result, setResult] = useState(null);
    const [sessionResults, setSessionResults] = useState([]);
    useEffect(() => {
      let cancelled = false;
      app.loadMasterpiecePractice('journey').then(data => {
        if (!cancelled) setPayload(data);
      }).catch(error => {
        if (!cancelled) setLoadError(error.message || '读图题库加载失败。');
      });
      return () => {
        cancelled = true;
      };
    }, []);
    const allQuestions = useMemo(() => payload ? payload.cards.filter(card => card.visualReviewStatus === 'verified').flatMap(card => card.questions.map(question => ({
      ...question,
      card
    }))) : [], [payload]);
    const stats = useMemo(() => {
      const records = progress.questions || {};
      const practiced = Object.keys(records).length;
      const weak = Object.values(records).filter(item => item.status !== 'correct' || item.mastery < 80).length;
      const mastered = Object.values(records).filter(item => item.mastery >= 80).length;
      return {
        practiced,
        weak,
        mastered
      };
    }, [progress]);
    const current = queue[index] || null;
    const choices = useMemo(() => current ? app.buildMasterpieceChoices(current, allQuestions) : [], [current, allQuestions]);
    const startSession = mode => {
      const nextQueue = app.pickPracticeQuestions(payload, progress, 5, mode);
      setSessionMode(mode);
      setQueue(nextQueue);
      setIndex(0);
      setSelectedChoiceId('');
      setResult(null);
      setSessionResults([]);
      setView('session');
    };
    const submitChoice = () => {
      if (!current || !selectedChoiceId) return;
      const nextResult = app.gradeMasterpieceChoice(choices, selectedChoiceId);
      setResult(nextResult);
      setProgress(previous => app.updateMasterpieceProgress(previous, current, nextResult));
      setSessionResults(previous => [...previous, nextResult]);
    };
    const advance = () => {
      if (index + 1 >= queue.length) {
        setView('result');
        return;
      }
      setIndex(value => value + 1);
      setSelectedChoiceId('');
      setResult(null);
    };
    if (loadError) return /*#__PURE__*/React.createElement("section", {
      className: "cn-masterpiece-practice fixed inset-0 z-40 grid place-items-center p-6"
    }, /*#__PURE__*/React.createElement("div", {
      className: "cn-practice-load-state"
    }, /*#__PURE__*/React.createElement("strong", null, "\u65E0\u6CD5\u6253\u5F00\u8BFB\u56FE\u7CBE\u7EC3"), /*#__PURE__*/React.createElement("p", null, loadError), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: onClose
    }, "\u8FD4\u56DE\u897F\u6E38\u8BB0")));
    if (!payload) return /*#__PURE__*/React.createElement("section", {
      className: "cn-masterpiece-practice fixed inset-0 z-40 grid place-items-center p-6"
    }, /*#__PURE__*/React.createElement("div", {
      className: "cn-practice-load-state"
    }, /*#__PURE__*/React.createElement("strong", null, "\u6B63\u5728\u6574\u7406\u300A\u897F\u6E38\u8BB0\u300B\u9898\u56FE...")));
    if (view === 'home') {
      const hero = payload.cards.find(card => card.theme === '三打白骨精') || payload.cards[0];
      return /*#__PURE__*/React.createElement("section", {
        className: "cn-masterpiece-practice fixed inset-0 z-40 overflow-y-auto",
        "aria-label": "\u897F\u6E38\u8BB0\u8BFB\u56FE\u7CBE\u7EC3"
      }, /*#__PURE__*/React.createElement("header", {
        className: "cn-practice-header"
      }, /*#__PURE__*/React.createElement("button", {
        type: "button",
        onClick: onClose,
        "aria-label": "\u8FD4\u56DE\u897F\u6E38\u8BB0\u4E13\u9898"
      }, "\u2190"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, "\u540D\u8457\u5BFC\u8BFB \xB7 \u672C\u4E66\u7CBE\u7EC3"), /*#__PURE__*/React.createElement("strong", null, "\u897F\u6E38\u8BB0\u8BFB\u56FE\u7CBE\u7EC3")), /*#__PURE__*/React.createElement("b", null, payload.cards.length, " \u56FE")), /*#__PURE__*/React.createElement("main", {
        className: "cn-practice-home"
      }, /*#__PURE__*/React.createElement("section", {
        className: "cn-practice-hero",
        style: {
          backgroundImage: `linear-gradient(90deg, rgba(18, 20, 18, .94) 0%, rgba(18, 20, 18, .62) 47%, rgba(18, 20, 18, .08) 100%), url(${hero.image})`
        }
      }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, "\u4EE5\u56FE\u4E3A\u8BC1\u636E \xB7 \u8FFD\u95EE\u539F\u8457\u7EC6\u8282"), /*#__PURE__*/React.createElement("h1", null, "\u4E0D\u53EA\u8BA4\u753B\u9762\uFF0C", /*#__PURE__*/React.createElement("br", null), "\u8FD8\u8981\u8BFB\u61C2\u6545\u4E8B\u3002"), /*#__PURE__*/React.createElement("p", null, "\u4ECE\u753B\u9762\u7EBF\u7D22\u8FFD\u95EE\u4EBA\u7269\u6765\u5386\u3001\u60C5\u8282\u56E0\u679C\u3001\u6CD5\u5B9D\u4F5C\u7528\u548C\u7ED3\u5C40\uFF1B\u9009\u62E9\u540E\u7ACB\u5373\u56DE\u770B\u5BF9\u5E94\u7684\u539F\u8457\u8981\u70B9\u3002"), /*#__PURE__*/React.createElement("button", {
        type: "button",
        onClick: () => startSession('smart')
      }, "\u5F00\u59CB\u4ECA\u65E5\u7CBE\u7EC3"))), /*#__PURE__*/React.createElement("section", {
        className: "cn-practice-stat-grid",
        "aria-label": "\u7EC3\u4E60\u8FDB\u5EA6"
      }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, allQuestions.length), /*#__PURE__*/React.createElement("span", null, "\u9053\u9898")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, stats.practiced), /*#__PURE__*/React.createElement("span", null, "\u5DF2\u4F5C\u7B54")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, stats.weak), /*#__PURE__*/React.createElement("span", null, "\u5F85\u8865\u5F3A")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, stats.mastered), /*#__PURE__*/React.createElement("span", null, "\u5DF2\u638C\u63E1"))), /*#__PURE__*/React.createElement("section", {
        className: "cn-practice-home-grid"
      }, /*#__PURE__*/React.createElement("article", null, /*#__PURE__*/React.createElement("span", null, "01"), /*#__PURE__*/React.createElement("h2", null, "\u5168\u4E66\u65B0\u9898"), /*#__PURE__*/React.createElement("p", null, "\u4EE5\u56FE\u7247\u4E3A\u7EBF\u7D22\uFF0C\u7EC3\u4EBA\u7269\u5173\u7CFB\u3001\u4E8B\u4EF6\u56E0\u679C\u3001\u6CD5\u5B9D\u4F5C\u7528\u548C\u60C5\u8282\u7ED3\u679C\u3002"), /*#__PURE__*/React.createElement("button", {
        type: "button",
        onClick: () => startSession('smart')
      }, "\u7EC3 5 \u9898")), /*#__PURE__*/React.createElement("article", null, /*#__PURE__*/React.createElement("span", null, "02"), /*#__PURE__*/React.createElement("h2", null, "\u9519\u9898\u590D\u7EC3"), /*#__PURE__*/React.createElement("p", null, "\u4F18\u5148\u56DE\u5230\u4EBA\u7269\u6765\u5386\u3001\u60C5\u8282\u8F6C\u6298\u548C\u6CD5\u5B9D\u7528\u6CD5\u5BB9\u6613\u6DF7\u6DC6\u7684\u9898\u76EE\u3002"), /*#__PURE__*/React.createElement("button", {
        type: "button",
        onClick: () => startSession('review'),
        disabled: !stats.weak
      }, "\u590D\u7EC3\u8584\u5F31\u9898")), /*#__PURE__*/React.createElement("article", null, /*#__PURE__*/React.createElement("span", null, "03"), /*#__PURE__*/React.createElement("h2", null, "\u7AE0\u8282\u5730\u56FE"), /*#__PURE__*/React.createElement("p", null, "\u5DF2\u5BFC\u5165 ", payload.cards.length, " \u5F20\u6A2A\u7248\u60C5\u8282\u56FE\uFF0C\u5F53\u524D\u5DF2\u9010\u56FE\u6838\u9A8C ", allQuestions.length, " \u9053\u9898\u76EE\u3002"), /*#__PURE__*/React.createElement("button", {
        type: "button",
        onClick: () => startSession('smart')
      }, "\u4ECE\u5DF2\u6838\u9A8C\u9898\u5F00\u59CB")))));
    }
    if (view === 'result') {
      const correct = sessionResults.filter(item => item.status === 'correct').length;
      return /*#__PURE__*/React.createElement("section", {
        className: "cn-masterpiece-practice fixed inset-0 z-40 overflow-y-auto",
        "aria-label": "\u897F\u6E38\u8BB0\u8BFB\u56FE\u7CBE\u7EC3\u7ED3\u679C"
      }, /*#__PURE__*/React.createElement("header", {
        className: "cn-practice-header"
      }, /*#__PURE__*/React.createElement("button", {
        type: "button",
        onClick: () => setView('home'),
        "aria-label": "\u8FD4\u56DE\u8BFB\u56FE\u7CBE\u7EC3"
      }, "\u2190"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, "\u672C\u8F6E\u5B8C\u6210"), /*#__PURE__*/React.createElement("strong", null, "\u897F\u6E38\u8BB0\u8BFB\u56FE\u7CBE\u7EC3")), /*#__PURE__*/React.createElement("b", null, queue.length, " \u9898")), /*#__PURE__*/React.createElement("main", {
        className: "cn-practice-result"
      }, /*#__PURE__*/React.createElement("span", null, "\u672C\u8F6E\u6210\u7EE9"), /*#__PURE__*/React.createElement("strong", null, correct, " / ", queue.length), /*#__PURE__*/React.createElement("p", null, correct === queue.length ? '本轮全部答对，下一轮将推进到新题。' : '错题已进入复练队列，下一轮会优先出现。'), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
        type: "button",
        onClick: () => startSession(sessionMode)
      }, "\u518D\u7EC3 5 \u9898"), /*#__PURE__*/React.createElement("button", {
        type: "button",
        onClick: () => startSession('review')
      }, "\u590D\u7EC3\u8584\u5F31\u9898"), /*#__PURE__*/React.createElement("button", {
        type: "button",
        onClick: () => setView('home')
      }, "\u8FD4\u56DE\u76EE\u5F55"))));
    }
    return /*#__PURE__*/React.createElement("section", {
      className: "cn-masterpiece-practice fixed inset-0 z-40 flex flex-col",
      "aria-label": "\u897F\u6E38\u8BB0\u8BFB\u56FE\u7CBE\u7EC3\u7B54\u9898"
    }, /*#__PURE__*/React.createElement("header", {
      className: "cn-practice-header"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => setView('home'),
      "aria-label": "\u9000\u51FA\u672C\u8F6E\u7EC3\u4E60"
    }, "\u2190"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, "\u8BFB\u56FE\u7EC3\u4E60 \xB7 ", current.type), /*#__PURE__*/React.createElement("strong", null, "\u897F\u6E38\u8BB0\u8BFB\u56FE\u7CBE\u7EC3")), /*#__PURE__*/React.createElement("b", null, index + 1, " / ", queue.length)), /*#__PURE__*/React.createElement("main", {
      className: "cn-practice-session"
    }, /*#__PURE__*/React.createElement("section", {
      className: "cn-practice-art"
    }, /*#__PURE__*/React.createElement("img", {
      src: current.card.image,
      alt: current.card.theme
    }), /*#__PURE__*/React.createElement("span", null, `画面 · ${current.card.theme}`)), /*#__PURE__*/React.createElement("section", {
      className: "cn-practice-question",
      "aria-live": "polite"
    }, /*#__PURE__*/React.createElement("div", {
      className: "cn-practice-question-meta"
    }, /*#__PURE__*/React.createElement("span", null, current.type), /*#__PURE__*/React.createElement("b", null, "\u770B\u56FE\u9009\u62E9")), /*#__PURE__*/React.createElement("h1", null, current.prompt), result ? /*#__PURE__*/React.createElement("p", {
      className: `cn-practice-choice-result is-${result.status}`
    }, result.status === 'correct' ? '回答正确，继续下一题。' : '正确答案已用绿色标出。') : null, /*#__PURE__*/React.createElement("div", {
      className: "cn-practice-options",
      role: "radiogroup",
      "aria-label": "\u9009\u62E9\u7B54\u6848"
    }, choices.map((choice, choiceIndex) => /*#__PURE__*/React.createElement("button", {
      key: choice.id,
      type: "button",
      role: "radio",
      "aria-checked": selectedChoiceId === choice.id,
      disabled: Boolean(result),
      onClick: () => setSelectedChoiceId(choice.id),
      className: `${selectedChoiceId === choice.id ? 'is-selected' : ''} ${result && choice.correct ? 'is-correct' : ''} ${result && selectedChoiceId === choice.id && !choice.correct ? 'is-wrong' : ''}`
    }, /*#__PURE__*/React.createElement("b", null, String.fromCharCode(65 + choiceIndex)), /*#__PURE__*/React.createElement("span", null, choice.text)))))), /*#__PURE__*/React.createElement("footer", {
      className: "cn-practice-footer"
    }, /*#__PURE__*/React.createElement("span", null, result ? `读图要点：${current.explanation}` : '请选择一个最符合题意的答案'), result ? /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: advance
    }, index + 1 >= queue.length ? '查看本轮结果' : '下一题') : /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: submitChoice,
      disabled: !selectedChoiceId
    }, "\u786E\u8BA4\u9009\u62E9")));
  }
  Object.assign(app, {
    MasterpiecePracticeEntry,
    XiyoujiPracticeWorkspace
  });
})();
