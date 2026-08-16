/**
 * 《天净沙·秋思》逻辑优化版课程数据。
 * 页面结构与视觉样式保持不变，所有教学反馈均从这份数据派生。
 */
const QUIZ_LEARNING_ORDER = [5, 6, 1, 7, 3, 8, 2, 4];

const POETRY_DATA = {
  version: 3,
  title: "天净沙·秋思",
  dynasty: "元",
  author: "马致远",
  genre: "元曲",
  textbook: {
    edition: "统编版（人民教育出版社）",
    grade: "七年级上册",
    unit: "第一单元",
    lesson: "古代诗歌四首"
  },
  media: {
    measuredDuration: 18.065011,
    contentStart: 2.2,
    teachingEnd: 17.6
  },
  intro: "本课围绕一条证据链学习：前三句以列锦方式组合九个意象，并以温暖的‘人家’反衬仍在古道上的游子，形成凄清苍凉的意境，最终落到羁旅思乡之情。",
  lessonContract: {
    relationship: "意象组合与归宿对照 → 凄清苍凉的意境 → 羁旅思乡",
    outcomes: [
      "能把视频时间点与五句原文准确对应。",
      "能引用完整词语说明意象如何共同构成画面。",
      "能按手法、画面、意境、情感四层完成鉴赏表达。",
      "能把证据链迁移到陌生诗句，并完成错题订正。"
    ]
  },

  learningCheckpoints: [
    {
      id: "cp-tone",
      time: 6.0,
      title: "第一段·凄清定调",
      content: "<p><b>枯藤老树昏鸦</b></p><p>先抓“枯、老、昏”三个修饰词：生命衰败、树木迟暮、暮色暗淡叠加在一起，从开篇就定下凄清萧瑟的基调。</p><p class=\"learning-question\">想一想：如果只写“藤、树、鸦”，画面的情感色彩会发生什么变化？</p>",
      narrationSrc: "media/narration/cp-verse1.mp3?v=756bc52efd17",
      quizId: 1
    },
    {
      id: "cp-contrast",
      time: 12.6,
      title: "第二段·归宿对照",
      content: "<p><b>小桥流水人家 / 古道西风瘦马</b></p><p>“人家”代表温暖、可归的生活；“古道、瘦马”说明游子仍在荒凉旅途。两幅画面并置，以温暖之景反衬无归处境，羁旅之苦因此更强。</p><p class=\"learning-question\">关键证据不是“景美”，而是“别人可归，游子无归”。</p>",
      testPointId: "imagery-chain"
    },
    {
      id: "cp-climax",
      time: 17.2,
      title: "第三段·题眼收束",
      content: "<p><b>夕阳西下，断肠人在天涯</b></p><p>“夕阳”把前三句收束到日暮时空；“断肠”写情感强度，“天涯”点出远离故乡的处境。全曲由写景转入直抒胸臆，最终落到羁旅思乡。</p><p class=\"learning-question\">答题闭环：手法 → 画面证据 → 意境 → 情感。</p>",
      quizId: 3
    }
  ],


  verses: [
    {
      id: 0,
      text: "枯藤老树昏鸦，",
      literal: "枯萎的藤蔓、衰老的树木、黄昏归巢的乌鸦。",
      interpretation: "‘枯、老、昏’共同奠定衰败、迟暮、萧瑟的基调。",
      start: 2.2,
      end: 6.0,
      words: [
        {
          id: "withered-vine",
          word: "枯藤",
          pinyin: "kū téng",
          category: "衰败",
          explanation: "枯萎的藤蔓。‘枯’直接写出生命衰败。",
          zhongkao: "【文本证据】‘枯’与‘老、昏’呼应，使画面从开篇就带有萧瑟、衰落的色调。"
        },
        {
          id: "old-tree",
          word: "老树",
          pinyin: "lǎo shù",
          category: "衰败",
          explanation: "衰老的树木，突出岁月感与荒凉感。",
          zhongkao: "【文本证据】‘老’不是年龄说明而已，它与‘枯藤’共同强化迟暮、衰败的画面特征。"
        },
        {
          id: "dusk-crow",
          word: "昏鸦",
          pinyin: "hūn yā",
          category: "时间与归宿",
          explanation: "黄昏时归巢的乌鸦。‘昏’点明暮色。",
          zhongkao: "【对照证据】乌鸦在黄昏尚能归巢，游子却仍在天涯，暗含有归宿与无归宿的对照。"
        }
      ]
    },
    {
      id: 1,
      text: "小桥流水人家，",
      literal: "小桥下流水潺潺，近旁坐落着人家。",
      interpretation: "安宁温暖的生活图景与漂泊者形成以乐景衬哀情的对照。",
      start: 6.0,
      end: 9.2,
      words: [
        {
          id: "small-bridge",
          word: "小桥",
          pinyin: "xiǎo qiáo",
          category: "归宿",
          explanation: "连接流水与人家的小桥，属于可停驻的生活空间。",
          zhongkao: "【画面证据】‘小桥’与‘流水、人家’组合成宁静、有人烟的村落图景。"
        },
        {
          id: "flowing-water",
          word: "流水",
          pinyin: "liú shuǐ",
          category: "归宿",
          explanation: "流动的水，使静态村落具有绵延、安宁的生活气息。",
          zhongkao: "【画面证据】‘流水’本身并不必然悲凉，必须结合‘人家’与全曲羁旅处境解释。"
        },
        {
          id: "homes",
          word: "人家",
          pinyin: "rén jiā",
          category: "归宿",
          explanation: "住户、农家，代表温暖、可归的生活空间。",
          zhongkao: "【手法证据】温暖的‘人家’反衬游子仍在古道、远在天涯，以乐景衬哀情。"
        }
      ]
    },
    {
      id: 2,
      text: "古道西风瘦马。",
      literal: "古老荒凉的道路、秋风和疲瘦的马。",
      interpretation: "道路、秋风、瘦马共同把漂泊的空间、季节和劳顿状态具体化。",
      start: 9.2,
      end: 12.6,
      words: [
        {
          id: "ancient-road",
          word: "古道",
          pinyin: "gǔ dào",
          category: "羁旅",
          explanation: "古老荒凉的驿道，交代游子仍在路上。",
          zhongkao: "【空间证据】‘古道’与‘人家’形成在路上与可归家的空间对照。"
        },
        {
          id: "west-wind",
          word: "西风",
          pinyin: "xī fēng",
          category: "季节",
          explanation: "秋风，在古典诗歌中常与悲秋、离别相连。",
          zhongkao: "【语境证据】这里的‘西风’是秋风，与枯、老、夕阳共同强化深秋萧瑟感。"
        },
        {
          id: "thin-horse",
          word: "瘦马",
          pinyin: "shòu mǎ",
          category: "羁旅",
          explanation: "疲瘦的马，使长途奔波和劳顿状态可见。",
          zhongkao: "【形象证据】马已疲瘦，侧面写出旅程漫长，也映衬游子的困顿。"
        }
      ]
    },
    {
      id: 3,
      text: "夕阳西下，",
      literal: "夕阳正在向西落下。",
      interpretation: "一天将尽，归宿需求变得更迫切，迟暮感进一步加深。",
      start: 12.6,
      end: 14.6,
      words: [
        {
          id: "sunset",
          word: "夕阳",
          pinyin: "xī yáng",
          category: "时间",
          explanation: "傍晚的太阳，点明一天将尽。",
          zhongkao: "【时空证据】‘夕阳西下’把前三句景物统一到暮色中，也为末句直抒胸臆蓄势。"
        }
      ]
    },
    {
      id: 4,
      text: "断肠人在天涯。",
      literal: "极度悲伤的游子漂泊在远离故乡的地方。",
      interpretation: "由写景转入直抒胸臆，点明漂泊者的孤独与思乡之痛。",
      start: 14.6,
      end: 17.6,
      words: [
        {
          id: "heartbroken-traveler",
          word: "断肠人",
          pinyin: "duàn cháng rén",
          category: "情感",
          explanation: "极度悲伤的人，这里指漂泊在外的游子。",
          zhongkao: "【题眼】‘断肠人’把此前的客观景物收束为人物的主观悲痛，是情感核心。"
        },
        {
          id: "horizon",
          word: "天涯",
          pinyin: "tiān yá",
          category: "空间",
          explanation: "天边，借指远离故乡的异地。",
          zhongkao: "【空间证据】‘天涯’与‘人家’构成音近、意远的对照：一边可归，一边漂泊。"
        }
      ]
    }
  ],

  testPoints: [
    {
      id: "form-and-title",
      triggerTime: 2.2,
      jumpTime: 0,
      shortTitle: "曲牌题目",
      title: "【中考基础考点】曲牌名与题目怎样区分",
      verse: "天净沙·秋思",
      question: "先作判断：“天净沙”与“秋思”分别属于什么？",
      prediction: {
        options: ["都是题目", "都是曲牌名", "曲牌名与题目", "作者与朝代"],
        correctIndex: 2,
        response: "元曲常采用“曲牌名·题目”的格式。“天净沙”规定曲调格律，“秋思”点明写作内容，二者不能混淆。"
      },
      steps: [
        { label: "第一步：识别格式", text: "看到“曲牌名·题目”的结构，前半部分先判断为曲牌名。" },
        { label: "第二步：区分作用", text: "曲牌名规定曲调、句式和平仄等格律；题目概括本曲内容或抒情对象。" },
        { label: "第三步：规范表述", text: "答题时应写：“天净沙”是曲牌名，“秋思”是题目，而不能笼统说二者都是篇名。" }
      ],
      standardAnswer: "“天净沙”是曲牌名，规定散曲的曲调格律；“秋思”是题目，点明作品写秋日里游子的羁旅思乡之情。",
      scoreTip: "术语要准确：曲牌名、题目各写清作用。",
      followupQuizId: 5
    },
    {
      id: "opening-tone",
      triggerTime: 6.0,
      jumpTime: 2.2,
      shortTitle: "首句定调",
      title: "【中考高频考点】三个修饰词怎样定下基调",
      verse: "枯藤老树昏鸦。",
      question: "先不看答案：“枯、老、昏”在句中共同营造了怎样的氛围？",
      prediction: {
        options: ["明丽欢快", "凄清萧瑟", "雄奇壮阔", "闲适恬淡"],
        correctIndex: 1,
        response: "“枯”写衰败，“老”写迟暮，“昏”写黄昏暗淡。三个修饰词叠加，视觉上由生命衰飒走向暮色，先声夺人地定下凄清萧瑟的基调。"
      },
      steps: [
        { label: "第一步：抓修饰语", text: "不要只罗列藤、树、鸦，要先抓“枯、老、昏”三个带情感色彩的修饰词。" },
        { label: "第二步：说明画面", text: "它们写出草木衰败、树木迟暮、天色昏暗的深秋黄昏画面。" },
        { label: "第三步：落到作用", text: "三词连用渲染凄清萧瑟，为全曲的羁旅思乡之愁奠定情感基调。" }
      ],
      standardAnswer: "“枯、老、昏”分别写藤的衰败、树的迟暮和天色的昏暗，连用渲染了深秋黄昏凄清萧瑟的氛围，为全曲抒写游子羁旅思乡之愁定下基调。",
      scoreTip: "答出修饰词、画面氛围、情感基调三层。",
      followupQuizId: 1
    },
    {
      id: "warm-scene-contrast",
      triggerTime: 9.2,
      jumpTime: 6.0,
      shortTitle: "乐景反衬",
      title: "【中考手法考点】温暖人家为何反而更显悲凉",
      verse: "小桥流水人家。",
      question: "先作判断：这句写温馨景象，主要是为了表达什么？",
      prediction: {
        options: ["赞美江南风光", "表现归家的喜悦", "反衬游子漂泊", "交代热闹民俗"],
        correctIndex: 2,
        response: "小桥、流水、人家本身温馨安宁，却是“别人可归”的生活图景；游子仍在古道上，因此温暖之景反而衬出他的无归与孤苦。"
      },
      steps: [
        { label: "第一步：先还原景", text: "小桥、流水、人家构成安宁温暖、富有人烟气息的生活图景。" },
        { label: "第二步：找人物处境", text: "联系后文“古道西风瘦马”“断肠人在天涯”，可知游子并不在这个可归的人家中。" },
        { label: "第三步：点明手法", text: "温馨之景与游子无归的处境形成对照，属于以乐景衬哀情，突出孤寂与思乡。" }
      ],
      standardAnswer: "“小桥流水人家”描绘温馨安宁、可停驻归依的生活图景；它与游子古道羁旅、远在天涯的无归处境形成对照，以乐景衬哀情，更突出游子的孤寂和思乡之愁。",
      scoreTip: "不能只写“景美”，要写出温馨之景怎样反衬人物无归。",
      followupQuizId: 6
    },
    {
      id: "imagery-chain",
      triggerTime: 12.4,
      jumpTime: 2.2,
      shortTitle: "列锦意象",
      title: "【中考核心考点】九个意象如何形成一幅画",
      verse: "枯藤老树昏鸦，小桥流水人家，古道西风瘦马。",
      question: "先不看答案：前三句最主要的画面基调是什么？",
      prediction: {
        options: ["温暖安宁", "清冷孤寂", "轻快明朗", "雄浑激昂"],
        correctIndex: 1,
        response: "‘小桥流水人家’虽温暖，但它与枯、老、昏、古道、西风、瘦马及仍在路上的游子共同构成反衬，整体基调仍是清冷孤寂。"
      },
      steps: [
        {
          label: "第一步：指出手法",
          text: "前三句使用列锦（名词意象并列），九个意象连续铺陈，省去叙述性动词。"
        },
        {
          label: "第二步：还原画面",
          text: "枯藤、老树、昏鸦写衰败迟暮；小桥、流水、人家写可归的生活；古道、西风、瘦马写游子仍在羁旅。"
        },
        {
          label: "第三步：归结意境与情感",
          text: "有归宿的景物与无归宿的游子形成对照，营造凄清苍凉的意境，表达漂泊孤寂与思乡之愁。"
        }
      ],
      standardAnswer: "前三句运用“列锦”手法，将“枯藤”等九个名词意象连续铺陈，省去动词。画面上“枯藤老树昏鸦”等写出衰败迟暮之景，与“小桥流水人家”的温馨形成反衬。景物对照营造了凄清苍凉的意境，深刻表达了游子漂泊无依的孤寂与浓烈的思乡之愁。",
      scoreTip: "完整答案必须同时具备：手法、画面证据、意境、情感。",
      followupQuizId: 2
    },
    {
      id: "sunset-structure",
      triggerTime: 14.6,
      jumpTime: 12.6,
      shortTitle: "夕阳结构",
      title: "【中考结构考点】“夕阳西下”怎样承上启下",
      verse: "夕阳西下，",
      question: "先作判断：这句在结构和情感上最主要的作用是什么？",
      prediction: {
        options: ["单纯交代时间", "赞美落日美景", "统一暮色并蓄势抒情", "说明游子已经归家"],
        correctIndex: 2,
        response: "“夕阳西下”不只是时间词。它把前三句意象收束到黄昏时空中，日暮而人未归，使末句“断肠人在天涯”的直接抒情更迫切。"
      },
      steps: [
        { label: "第一步：交代时空", text: "“夕阳西下”点明黄昏，使前面枯藤、老树、昏鸦等景物统一到暮色中。" },
        { label: "第二步：联系归宿", text: "日暮本易触发归家感，而游子仍在路上，因而强化无归的处境。" },
        { label: "第三步：分析结构", text: "它承接前文写景，蓄势引出末句直抒胸臆，使思乡之情达到高潮。" }
      ],
      standardAnswer: "“夕阳西下”点明黄昏，把前面景物统一到暮色时空中；日暮而游子未归，强化了他的无归与思乡；结构上承接写景，并为末句直抒胸臆蓄势。",
      scoreTip: "结构题至少写“承接前文景物、引出末句抒情”两点。",
      followupQuizId: 7
    },
    {
      id: "central-emotion",
      triggerTime: 17.2,
      jumpTime: 14.6,
      shortTitle: "题眼主旨",
      title: "【中考主旨考点】“断肠人在天涯”为什么是题眼",
      verse: "断肠人在天涯。",
      question: "先不看答案：这句在全曲中最准确的作用是什么？",
      prediction: {
        options: ["继续客观写景", "直抒胸臆点明主旨", "转写欢乐归家", "只交代地理位置"],
        correctIndex: 1,
        response: "“断肠”直接写出极度悲伤，“天涯”写出远离故乡的漂泊处境。末句由前文写景转为直抒胸臆，收束全曲，点明羁旅思乡。"
      },
      steps: [
        { label: "第一步：抓题眼词", text: "“断肠”是情感强度词，“天涯”是空间处境词，二者共同指向漂泊游子。" },
        { label: "第二步：看表达方式", text: "前文主要借景抒情，到此直接说出“断肠人”，完成由写景到抒情的转换。" },
        { label: "第三步：概括主旨", text: "这句收束全曲，集中表现游子远离故乡、漂泊无依的孤寂与浓重乡愁。" }
      ],
      standardAnswer: "“断肠人”直接写出游子极度悲伤，“天涯”点明其远离故乡、漂泊无依的处境。末句由写景转入直抒胸臆，收束全曲，点明羁旅思乡的主旨。",
      scoreTip: "题眼题要答出关键词含义、表达方式转换和全曲主旨。",
      followupQuizId: 3
    }
  ],

  quizzes: [
    {
      id: 1,
      type: "objective",
      maxScore: 1,
      question: "下列对《天净沙·秋思》的赏析，不正确的一项是：",
      options: [
        "A. ‘枯藤老树昏鸦’中的‘昏’既点明黄昏，也渲染暗淡氛围。",
        "B. ‘小桥流水人家’与漂泊游子形成归宿对照，有以乐景衬哀情的作用。",
        "C. ‘古道西风瘦马’中的‘西风’指温暖春风，预示游子充满希望。",
        "D. 全曲以简练语言勾勒秋郊羁旅图，抒发强烈思乡之情。"
      ],
      correctIndex: 2,
      jumpTime: 9.2,
      hint: "回看第三句，判断‘西风’在古典诗歌中通常指哪个季节。",
      explanation: [
        "正确答案是 C。",
        "‘西风’在这里指秋风，与‘枯、老、夕阳’共同强化萧瑟悲凉，而不是带来春日希望。"
      ]
    },
    {
      id: 2,
      type: "subjective",
      rubricType: "imagery-analysis",
      maxScore: 5,
      question: "前三句共列出九种事物，无一动词，在写法上有什么妙处？请引用原词简要作答。",
      hint: "按‘手法—画面—意境—情感’组织答案，并至少引用三个完整意象。",
      jumpTime: 2.2,
      scorePoints: [
        { id: "technique", text: "指出列锦、名词并列或意象并列的手法", score: 1 },
        { id: "picture", text: "引用至少三个完整意象，并还原深秋羁旅画面", score: 1 },
        { id: "mood", text: "点明凄清、萧瑟、苍凉或孤寂的意境", score: 1 },
        { id: "emotion", text: "同时写出漂泊处境与思乡之情", score: 2 }
      ],
      explanation: [
        "参考表达：前三句运用列锦手法，把枯藤、老树、昏鸦、小桥、流水、人家、古道、西风、瘦马九个意象并列组合，勾勒出深秋暮色中的羁旅图。",
        "其中温暖的‘人家’与古道上的游子形成对照，营造凄清苍凉的意境，表达游子漂泊孤寂和深切的思乡之愁。"
      ]
    },
    {
      id: 3,
      type: "objective",
      maxScore: 1,
      question: "本曲的‘题眼’，也就是直接抒发核心情感的句子是哪一句？",
      options: [
        "A. 枯藤老树昏鸦",
        "B. 小桥流水人家",
        "C. 夕阳西下",
        "D. 断肠人在天涯"
      ],
      correctIndex: 3,
      jumpTime: 14.6,
      hint: "前三句主要写景，寻找由写景转为直接抒情的句子。",
      explanation: [
        "正确答案是 D。",
        "‘断肠人在天涯’由写景转入直抒胸臆，‘断肠人’点明人物和悲痛，‘天涯’点明远离故乡的处境。"
      ]
    },
    {
      id: 4,
      type: "subjective",
      rubricType: "transfer",
      maxScore: 3,
      question: "比较本曲与秦观‘斜阳外，寒鸦万点，流水绕孤村’，说明相近意象如何产生相近或不同的表达效果。",
      hint: "必须分别引用两篇文本中的词语，再说明它们与人物处境或环境氛围的关系。",
      jumpTime: 2.2,
      scorePoints: [
        { id: "source", text: "引用本曲中的昏鸦、流水或夕阳等证据", score: 1 },
        { id: "transfer", text: "引用秦观诗句中的斜阳、寒鸦、流水或孤村", score: 1 },
        { id: "effect", text: "比较两处意象与孤寂、离愁、羁旅或归宿感的关系", score: 1 }
      ],
      explanation: [
        "两篇作品都把暮色、鸦与流水组合成可感的黄昏空间。",
        "马致远以‘昏鸦’有巢、‘人家’可归反衬游子在天涯；秦观以‘寒鸦万点’和‘流水绕孤村’写出暮色中的疏寒与离愁。相近意象因人物处境和组合关系不同而呈现不同层次的伤感。"
      ]
    },
    {
      id: 5,
      type: "objective",
      maxScore: 1,
      question: "《天净沙·秋思》中“天净沙”和“秋思”分别是什么？",
      options: [
        "A. 都是曲牌名",
        "B. 都是题目",
        "C. ‘天净沙’是曲牌名，‘秋思’是题目",
        "D. ‘天净沙’是题目，‘秋思’是曲牌名"
      ],
      correctIndex: 2,
      jumpTime: 0,
      hint: "元曲通常由曲牌名和题目组成，前面的是曲牌名，后面的是题目。",
      explanation: [
        "正确答案是 C。",
        "元曲的格式通常为“曲牌名·题目”。‘天净沙’是曲牌名，规定了曲调的字数、平仄和韵脚；‘秋思’是这首散曲的题目，点明了主要内容是写秋天的思乡之情。"
      ]
    },
    {
      id: 6,
      type: "objective",
      maxScore: 1,
      question: "“小桥流水人家”在全曲中起到了什么作用？",
      options: [
        "A. 描绘了美丽的江南水乡风景，表达了作者对江南的向往。",
        "B. 营造了温馨、安宁的氛围，与游子的漂泊无依形成鲜明对比（反衬）。",
        "C. 展现了当地人民安居乐业的生活场景，体现了作者的赞美之情。",
        "D. 仅仅是为了凑足字数，与其他景物没有内在联系。"
      ],
      correctIndex: 1,
      jumpTime: 6.0,
      hint: "联系全曲抒发的“断肠人”思乡之情，思考温馨的景物是如何衬托出这种情感的。",
      explanation: [
        "正确答案是 B。",
        "‘小桥流水人家’呈现出一派温馨恬静的景象，这正是游子所向往的归宿。这种温馨的景象与游子孤身一人在秋风古道上跋涉的凄凉处境形成强烈的反衬，更加突出了游子的孤寂与思乡之愁。"
      ]
    },
    {
      id: 7,
      type: "objective",
      maxScore: 1,
      question: "“夕阳西下”在全曲的结构和情感表达上有什么作用？",
      options: [
        "A. 只交代故事发生在傍晚，与全曲情感无关。",
        "B. 点明暮色，把前三句景物统一到黄昏时空中，为末句直抒胸臆蓄势，并强化游子的思乡之情。",
        "C. 主要表现作者对落日景象的赞美，冲淡了漂泊之苦。",
        "D. 表明游子已经在夕阳下回到温暖的人家。"
      ],
      correctIndex: 1,
      jumpTime: 12.6,
      hint: "既要看到“夕阳”点明的时间，也要联系下一句“断肠人在天涯”。",
      explanation: [
        "正确答案是 B。",
        "“夕阳西下”不仅点明日暮，更把前面的景物统一到暮色之中。日暮而游子未归，使归宿的渴望更迫切，并自然引出末句的直接抒情。"
      ]
    },
    {
      id: 8,
      type: "objective",
      maxScore: 1,
      question: "对“人家”与“天涯”在全曲中的关系，理解最恰当的一项是？",
      options: [
        "A. 都是游子已经到达的地点，表现旅途安稳。",
        "B. “人家”代表温暖可归的生活空间，“天涯”写游子远离故乡的漂泊处境，二者形成归宿对照。",
        "C. 两者都只为描写景物，和人物情感没有关系。",
        "D. 两者都表现作者对江南水乡的直接赞美。"
      ],
      correctIndex: 1,
      jumpTime: 14.6,
      hint: "把“有人可归”的生活图景，与“远离故乡”的人物处境放在一起思考。",
      explanation: [
        "正确答案是 B。",
        "“小桥流水人家”呈现可停驻、可归依的温暖生活，“断肠人在天涯”却写游子远离故乡、无处安身。两种空间的对照，深化了羁旅思乡之愁。"
      ]
    }
  ].sort((left, right) => QUIZ_LEARNING_ORDER.indexOf(left.id) - QUIZ_LEARNING_ORDER.indexOf(right.id)),

  dictations: [
    {
      id: 1,
      question: "表达游子思家心切、孤独无依，直接点明全曲主旨的句子是：",
      answer: "断肠人在天涯",
      hint: "回看最后一句，注意‘断肠’与‘天涯’。",
      jumpTime: 14.6
    },
    {
      id: 2,
      question: "描写温暖宁静的生活图景，并反衬游子无归的句子是：",
      answer: "小桥流水人家",
      hint: "回看第二句，答案由三个意象组成。",
      jumpTime: 6.0
    },
    {
      id: 3,
      question: "纯用名词意象并列，写出旅途荒凉和人马劳顿的句子是：",
      answer: "古道西风瘦马",
      hint: "回看第三句，注意‘古道’‘西风’‘瘦马’。",
      jumpTime: 9.2
    }
  ],

  evidenceModel: {
    relationship: "意象组合与归宿对照 → 凄清苍凉的意境 → 羁旅思乡",
    groups: [
      {
        id: "dusk",
        label: "衰败暮色",
        cue: "生命衰飒、秋风与日暮",
        image: "images/verse_1.jpg?v=90539e018a86"
      },
      {
        id: "home",
        label: "温暖归宿",
        cue: "有人烟、可停驻、可归",
        image: "images/verse_2.jpg?v=298fa7c5dbab"
      },
      {
        id: "journey",
        label: "羁旅无归",
        cue: "仍在路上、劳顿、远离故乡",
        image: "images/verse_3.jpg?v=a3078e6ccfbd"
      }
    ],
    items: [
      { id: "withered-vine", label: "枯藤", group: "dusk", verseStart: 2.2 },
      { id: "old-tree", label: "老树", group: "dusk", verseStart: 2.2 },
      { id: "dusk-crow", label: "昏鸦", group: "dusk", verseStart: 2.2 },
      { id: "small-bridge", label: "小桥", group: "home", verseStart: 6.0 },
      { id: "flowing-water", label: "流水", group: "home", verseStart: 6.0 },
      { id: "homes", label: "人家", group: "home", verseStart: 6.0 },
      { id: "ancient-road", label: "古道", group: "journey", verseStart: 9.2 },
      { id: "west-wind", label: "西风", group: "dusk", verseStart: 9.2 },
      { id: "thin-horse", label: "瘦马", group: "journey", verseStart: 9.2 },
      { id: "sunset", label: "夕阳", group: "dusk", verseStart: 12.6 },
      { id: "heartbroken-traveler", label: "断肠人", group: "journey", verseStart: 14.6 },
      { id: "horizon", label: "天涯", group: "journey", verseStart: 14.6 }
    ],
    sceneHotspots: [
      { id: "scene-dusk", label: "枯藤·老树·昏鸦", start: 2.2, end: 6.0, x: 25, y: 28 },
      { id: "scene-home", label: "小桥·流水·人家", start: 6.0, end: 9.2, x: 32, y: 68 },
      { id: "scene-journey", label: "古道·西风·瘦马", start: 9.2, end: 12.6, x: 68, y: 68 },
      { id: "scene-sunset", label: "夕阳西下", start: 12.6, end: 14.6, x: 62, y: 28 },
      { id: "scene-horizon", label: "断肠人·天涯", start: 14.6, end: 17.6, x: 68, y: 68 }
    ]
  },

  imageryMindmap: [
    {
      id: "west-wind",
      name: "西风",
      verseStart: 9.2,
      symbolism: "秋风。与衰败、离别、羁旅语境组合时，常强化萧瑟和思乡。",
      comparison: [
        {
          title: "马致远《天净沙·秋思》",
          quote: "古道西风瘦马",
          note: "西风与古道、瘦马组合，突出旅途荒凉和人马劳顿。"
        },
        {
          title: "李清照《醉花阴》",
          quote: "帘卷西风，人比黄花瘦",
          note: "西风与黄花、人的消瘦组合，表达重阳独处的相思与憔悴。"
        }
      ]
    },
    {
      id: "dusk-crow",
      name: "昏鸦",
      verseStart: 2.2,
      symbolism: "黄昏归巢的乌鸦。与漂泊者并置时，可形成有归宿与无归宿的对照。",
      comparison: [
        {
          title: "马致远《天净沙·秋思》",
          quote: "枯藤老树昏鸦",
          note: "昏鸦能归巢，游子却仍在天涯，反衬无处安身。"
        },
        {
          title: "秦观《满庭芳·山抹微云》",
          quote: "斜阳外，寒鸦万点，流水绕孤村",
          note: "斜阳、寒鸦、流水、孤村组合成疏寒暮景，寄托离愁。"
        }
      ]
    },
    {
      id: "sunset",
      name: "夕阳",
      verseStart: 12.6,
      symbolism: "落日点明一天将尽，常使归乡、迟暮和时间流逝的感受变得迫切。",
      comparison: [
        {
          title: "马致远《天净沙·秋思》",
          quote: "夕阳西下，断肠人在天涯",
          note: "日暮而游子未归，使思乡之痛达到高潮。"
        },
        {
          title: "崔颢《黄鹤楼》",
          quote: "日暮乡关何处是？烟波江上使人愁",
          note: "日暮触发对乡关的追问，时间变化直接引出乡愁。"
        }
      ]
    }
  ]
};
