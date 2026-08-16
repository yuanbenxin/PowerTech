window.ChineseApp = window.ChineseApp || {};
(() => {
  const app = window.ChineseApp;
  const {
    useState
  } = app;
  const BAIGUJING_STORY = [{
    id: 'watch',
    label: '妖怪设局',
    title: '白骨精窥见取经人',
    summary: '白骨精得知唐僧肉能长生，躲在山林中观察师徒，决定用伪装逐步接近。',
    observe: ['看白骨精藏身的位置：她先观察，再设局。', '看取经队伍的行进状态：危险尚未显露。', '这一幕是整场误会的起点。'],
    memory: '白骨精因觊觎唐僧肉而设计伪装接近师徒。'
  }, {
    id: 'maiden',
    label: '村姑送斋',
    title: '悟空第一次识破伪装',
    summary: '白骨精变作村姑送斋。悟空看出妖气，唐僧却只看见一名无辜女子。',
    observe: ['悟空依据火眼金睛判断妖怪。', '唐僧只根据眼前所见作判断。', '两人的判断差异由此出现。'],
    memory: '悟空能识妖，唐僧却被表象迷惑。'
  }, {
    id: 'old-woman',
    label: '老妇寻女',
    title: '师徒误会逐步加深',
    summary: '白骨精又变作老妇寻找女儿，借唐僧的善良扩大他对悟空的误会。',
    observe: ['老妇身份是第二层伪装。', '妖怪利用的是唐僧的同情心。', '悟空坚持除妖，冲突并未解除。'],
    memory: '第二次伪装让唐僧更相信悟空伤害无辜。'
  }, {
    id: 'old-man',
    label: '老翁寻亲',
    title: '第三次伪装被当场揭破',
    summary: '白骨精第三次变成老翁寻亲。悟空再次出手，终于使妖怪现出原形。',
    observe: ['三次变化是这一回最重要的情节线。', '悟空的行动始终围绕“识妖、除妖”。', '唐僧的误解也在此达到顶点。'],
    memory: '白骨精三变：村姑、老妇、老翁。'
  }, {
    id: 'banished',
    label: '悟空被逐',
    title: '除妖的悟空反而受冤',
    summary: '唐僧仍把悟空当作滥杀无辜的人，念紧箍咒并赶走悟空，师徒矛盾爆发。',
    observe: ['悟空护在师父前方，说明他始终在守护取经队伍。', '唐僧的愤怒来自他对事实的误判。', '结局不是降妖成功，而是悟空受冤被逐。'],
    memory: '人物评价要写出悟空“识妖、打妖、受冤”三层。'
  }];
  function JourneyStoryLesson({
    card,
    frame
  }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const scene = BAIGUJING_STORY[activeIndex];
    const narrow = frame.isPortrait;
    const detailImage = card.storyboardImage || card.image;
    const goToScene = nextIndex => {
      setActiveIndex(Math.max(0, Math.min(BAIGUJING_STORY.length - 1, nextIndex)));
      setShowAnswer(false);
    };
    return /*#__PURE__*/React.createElement("article", {
      className: "xyj-lesson custom-scrollbar",
      "aria-label": "\u4E09\u6253\u767D\u9AA8\u7CBE\u56FE\u89E3\u8BFE\u4EF6"
    }, /*#__PURE__*/React.createElement("section", {
      className: "xyj-lesson-hero"
    }, /*#__PURE__*/React.createElement("div", {
      className: "xyj-lesson-hero-art",
      style: {
        backgroundImage: `linear-gradient(90deg, rgba(9, 22, 25, 0.92) 0%, rgba(9, 22, 25, 0.56) 47%, rgba(9, 22, 25, 0.16) 100%), url(${card.image})`
      }
    }), /*#__PURE__*/React.createElement("div", {
      className: "xyj-lesson-hero-content"
    }, /*#__PURE__*/React.createElement("p", {
      className: "xyj-lesson-kicker"
    }, "\u897F\u6E38\u8BB0\u56FE\u89E3\u7CBE\u5B66"), /*#__PURE__*/React.createElement("p", {
      className: "xyj-lesson-chapter"
    }, "\u7B2C 27 \u56DE"), /*#__PURE__*/React.createElement("h1", null, "\u4E09\u6253\u767D\u9AA8\u7CBE"), /*#__PURE__*/React.createElement("p", {
      className: "xyj-lesson-question"
    }, "\u5B59\u609F\u7A7A\u660E\u660E\u8BC6\u7834\u4E86\u5996\u602A\uFF0C\u4E3A\u4EC0\u4E48\u6700\u540E\u5374\u88AB\u5510\u50E7\u8D76\u8D70\uFF1F"), /*#__PURE__*/React.createElement("div", {
      className: "xyj-lesson-hero-meta"
    }, /*#__PURE__*/React.createElement("span", null, "5 \u5E55\u56FE\u89E3"), /*#__PURE__*/React.createElement("span", null, "\u4EBA\u7269\u51B2\u7A81"), /*#__PURE__*/React.createElement("span", null, "\u540D\u8457\u7B54\u9898")))), /*#__PURE__*/React.createElement("section", {
      className: "xyj-lesson-intro",
      "aria-label": "\u672C\u8BFE\u5B66\u4E60\u8DEF\u5F84"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
      className: "xyj-lesson-section-kicker"
    }, "\u5148\u770B\u6574\u5377"), /*#__PURE__*/React.createElement("h2", null, "\u4E94\u5E55\u770B\u61C2\u5E08\u5F92\u8BEF\u4F1A")), /*#__PURE__*/React.createElement("p", null, "\u540C\u4E00\u5F20\u8FDE\u73AF\u753B\u56FA\u5B9A\u4EBA\u7269\u5F62\u8C61\uFF0C\u7528\u4E94\u6B21\u5173\u952E\u8F6C\u6298\u4E32\u8D77\u201C\u8BC6\u5996\u3001\u9664\u5996\u3001\u53D7\u51A4\u201D\u7684\u5B8C\u6574\u8FC7\u7A0B\u3002")), /*#__PURE__*/React.createElement("section", {
      className: "xyj-storyboard-overview",
      "aria-label": "\u4E09\u6253\u767D\u9AA8\u7CBE\u4E94\u5E55\u8FDE\u73AF\u753B\u603B\u89C8"
    }, /*#__PURE__*/React.createElement("img", {
      src: detailImage,
      alt: "\u4E09\u6253\u767D\u9AA8\u7CBE\u56FE\u89E3\u4E3B\u89C6\u89C9"
    })), /*#__PURE__*/React.createElement("nav", {
      className: "xyj-scene-nav",
      "aria-label": "\u4E94\u5E55\u6545\u4E8B\u5BFC\u822A"
    }, BAIGUJING_STORY.map((item, index) => /*#__PURE__*/React.createElement("button", {
      key: item.id,
      type: "button",
      onClick: () => goToScene(index),
      className: index === activeIndex ? 'is-active' : '',
      "aria-current": index === activeIndex ? 'step' : undefined
    }, /*#__PURE__*/React.createElement("span", null, String(index + 1).padStart(2, '0')), /*#__PURE__*/React.createElement("b", null, item.label)))), /*#__PURE__*/React.createElement("section", {
      className: `xyj-scene-stage ${narrow ? 'is-narrow' : ''}`,
      "aria-live": "polite"
    }, /*#__PURE__*/React.createElement("div", {
      className: "xyj-scene-art",
      style: {
        backgroundImage: `url(${detailImage})`,
        backgroundPosition: `${activeIndex * 25}% center`
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "xyj-scene-count"
    }, String(activeIndex + 1).padStart(2, '0'), " / 05")), /*#__PURE__*/React.createElement("div", {
      className: "xyj-scene-copy"
    }, /*#__PURE__*/React.createElement("p", {
      className: "xyj-lesson-section-kicker"
    }, scene.label), /*#__PURE__*/React.createElement("h2", null, scene.title), /*#__PURE__*/React.createElement("p", {
      className: "xyj-scene-summary"
    }, scene.summary), /*#__PURE__*/React.createElement("div", {
      className: "xyj-observe-list"
    }, /*#__PURE__*/React.createElement("p", null, "\u56FE\u4E2D\u8981\u770B"), /*#__PURE__*/React.createElement("ul", null, scene.observe.map(item => /*#__PURE__*/React.createElement("li", {
      key: item
    }, item)))), /*#__PURE__*/React.createElement("p", {
      className: "xyj-memory-line"
    }, /*#__PURE__*/React.createElement("span", null, "\u8BB0\u5FC6\u53E5"), scene.memory))), /*#__PURE__*/React.createElement("div", {
      className: "xyj-scene-actions",
      "aria-label": "\u5207\u6362\u6545\u4E8B\u573A\u666F"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => goToScene(activeIndex - 1),
      disabled: activeIndex === 0
    }, "\u4E0A\u4E00\u5E55"), /*#__PURE__*/React.createElement("span", null, scene.label), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => goToScene(activeIndex + 1),
      disabled: activeIndex === BAIGUJING_STORY.length - 1
    }, "\u4E0B\u4E00\u5E55")), /*#__PURE__*/React.createElement("section", {
      className: "xyj-insight-grid"
    }, /*#__PURE__*/React.createElement("div", {
      className: "xyj-relationship"
    }, /*#__PURE__*/React.createElement("p", {
      className: "xyj-lesson-section-kicker"
    }, "\u8BFB\u61C2\u4EBA\u7269"), /*#__PURE__*/React.createElement("h2", null, "\u4E3A\u4EC0\u4E48\u4F1A\u53D1\u751F\u51B2\u7A81\uFF1F"), /*#__PURE__*/React.createElement("div", {
      className: "xyj-relationship-line"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "\u5B59\u609F\u7A7A"), /*#__PURE__*/React.createElement("span", null, "\u706B\u773C\u91D1\u775B\uFF0C\u575A\u6301\u9664\u5996")), /*#__PURE__*/React.createElement("i", null, "\u5224\u65AD\u76F8\u53CD"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "\u5510\u50E7"), /*#__PURE__*/React.createElement("span", null, "\u5FC3\u5730\u5584\u826F\uFF0C\u76F8\u4FE1\u8868\u8C61"))), /*#__PURE__*/React.createElement("p", null, "\u767D\u9AA8\u7CBE\u5229\u7528\u4F2A\u88C5\u548C\u5510\u50E7\u7684\u5584\u826F\uFF0C\u5236\u9020\u5E08\u5F92\u4E4B\u95F4\u7684\u4FE1\u4EFB\u5371\u673A\u3002")), /*#__PURE__*/React.createElement("div", {
      className: "xyj-evidence"
    }, /*#__PURE__*/React.createElement("p", {
      className: "xyj-lesson-section-kicker"
    }, "\u539F\u8457\u8BC1\u636E"), /*#__PURE__*/React.createElement("blockquote", null, "\u201C\u90A3\u5510\u50E7\u4E00\u89C1\uFF0C\u5FC3\u4E2D\u5927\u6012\uFF0C\u4FBF\u5FF5\u8D77\u7D27\u7B8D\u513F\u5492\u6765\u3002\u201D"), /*#__PURE__*/React.createElement("p", null, "\u5510\u50E7\u53EA\u770B\u89C1\u609F\u7A7A\u6253\u4EBA\uFF0C\u6CA1\u6709\u770B\u89C1\u5996\u602A\u73B0\u5F62\uFF0C\u56E0\u6B64\u8BEF\u5224\u5E76\u60E9\u7F5A\u609F\u7A7A\u3002"))), /*#__PURE__*/React.createElement("section", {
      className: "xyj-answer-board"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
      className: "xyj-lesson-section-kicker"
    }, "\u4F1A\u7B54\u540D\u8457\u9898"), /*#__PURE__*/React.createElement("h2", null, "\u8FD9\u4E00\u56DE\u8981\u4F1A\u4EC0\u4E48\uFF1F")), /*#__PURE__*/React.createElement("div", {
      className: "xyj-answer-columns"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "\u60C5\u8282\u6982\u62EC"), /*#__PURE__*/React.createElement("p", null, "\u767D\u9AA8\u7CBE\u4E09\u6B21\u4F2A\u88C5\uFF0C\u609F\u7A7A\u4E09\u6B21\u8BC6\u7834\uFF0C\u5510\u50E7\u8BEF\u4F1A\u609F\u7A7A\u5E76\u5C06\u4ED6\u8D76\u8D70\u3002")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "\u4EBA\u7269\u5F62\u8C61"), /*#__PURE__*/React.createElement("p", null, "\u609F\u7A7A\u706B\u773C\u91D1\u775B\u3001\u5AC9\u6076\u5982\u4EC7\u3001\u5B88\u62A4\u5E08\u7236\uFF0C\u4E5F\u627F\u53D7\u4E86\u4E0D\u88AB\u7406\u89E3\u7684\u51A4\u5C48\u3002")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "\u4E3B\u9898\u7406\u89E3"), /*#__PURE__*/React.createElement("p", null, "\u6545\u4E8B\u8868\u73B0\u771F\u76F8\u4E0E\u8868\u8C61\u7684\u51B2\u7A81\uFF0C\u4E5F\u63ED\u793A\u5E08\u5F92\u4E4B\u95F4\u7684\u4FE1\u4EFB\u8003\u9A8C\u3002")))), /*#__PURE__*/React.createElement("section", {
      className: "xyj-self-check"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
      className: "xyj-lesson-section-kicker"
    }, "\u4E00\u9898\u81EA\u6D4B"), /*#__PURE__*/React.createElement("h2", null, "\u8BF7\u6982\u62EC\u5B59\u609F\u7A7A\u4E09\u6253\u767D\u9AA8\u7CBE\u7684\u7ECF\u8FC7\uFF0C\u5E76\u5206\u6790\u5176\u4EBA\u7269\u5F62\u8C61\u3002")), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => setShowAnswer(value => !value),
      "aria-expanded": showAnswer
    }, showAnswer ? '收起答题线索' : '查看答题线索'), showAnswer ? /*#__PURE__*/React.createElement("p", {
      className: "xyj-self-check-answer"
    }, "\u6309\u201C\u5996\u602A\u4E09\u53D8 - \u609F\u7A7A\u4E09\u6253 - \u5510\u50E7\u8BEF\u4F1A - \u609F\u7A7A\u88AB\u9010\u201D\u6982\u62EC\u60C5\u8282\uFF1B\u4EBA\u7269\u5F62\u8C61\u4ECE\u201C\u706B\u773C\u91D1\u775B\u3001\u5AC9\u6076\u5982\u4EC7\u3001\u5FCD\u53D7\u51A4\u5C48\u201D\u4E09\u4E2A\u65B9\u9762\u4F5C\u7B54\u3002") : null));
  }
  Object.assign(app, {
    JourneyStoryLesson
  });
})();
