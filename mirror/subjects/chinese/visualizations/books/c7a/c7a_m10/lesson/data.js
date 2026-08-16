/**
 * 《夜雨寄北》逻辑优化版课程数据。
 * 页面结构与视觉样式保持不变，所有教学反馈均从这份数据派生。
 */
const QUIZ_LEARNING_ORDER = [5, 1, 2, 3, 4];

const POETRY_DATA = {
  version: 4,
  title: "夜雨寄北",
  dynasty: "唐",
  author: "李商隐",
  genre: "唐诗",
  textbook: {
    edition: "统编版（人民教育出版社）",
    grade: "七年级上册",
    unit: "第四单元",
    lesson: "古代诗歌四首"
  },
  media: {
    measuredDuration: 18.066,
    contentStart: 2.2,
    teachingEnd: 17.6
  },
  intro: "本课围绕一条证据链学习：前两句写眼前实景，以‘巴山夜雨’渲染凄凉孤独之境；后两句写想象中重逢的虚景，以未来的欢聚反衬当下的孤寂，通过虚实结合、时空交错表达深挚的思乡怀人之情。",
  lessonContract: {
    relationship: "眼前实景（凄凉孤独） ↔ 未来虚景（剪烛叙旧） → 虚实相生、以乐衬哀的羁旅思乡之情",
    outcomes: [
      "能把视频时间点与四句原文准确对应。",
      "能指出‘巴山夜雨’两次出现并区分其虚实作用。",
      "能按手法、画面、意境、情感四层完成虚实结合的鉴赏表达。",
      "能把虚实结合的手法迁移到陌生诗句，并完成错题订正。"
    ]
  },

  learningCheckpoints: [
    {
      id: "cp-start",
      time: 0.1,
      title: "【课前知人论世】走近李商隐",
      content: "<p><b>李商隐</b>，字义山，号玉溪生，晚唐著名诗人。与杜牧合称“小李杜”。其诗构思新奇，风格秾丽，尤其长于写抒情诗。</p><p>这首诗写于诗人羁旅巴蜀之时。‘寄北’指寄给北方的人（可能是他的妻子或挚友）。这首诗以“夜雨”为线索，交织眼前实景与未来虚景，成为思乡怀人的千古逆调。</p>",
      quizId: 5
    },
    {
      id: "cp-verse1",
      time: 6.0,
      title: "【画面拆解】首句奠定情感",
      content: "<p><b>君问归期未有期</b></p><p>解读：一问一答，寄托了无限深情与无奈。亲人的体贴询问（‘问归期’）与自己归期难测的无奈处境（‘未有期’）形成鲜明对照，直接写出了客居异乡、归期无望的惆怅和孤独，奠定了全诗忧郁惆怅的情感基调。</p>",
      quizId: 1
    },
    {
      id: "cp-verse2",
      time: 10.0,
      title: "【意境剖析】巴山夜雨秋池",
      content: "<p><b>巴山夜雨涨秋池</b></p><p>解读：此句写眼前实景。‘巴山’点明诗人羁旅的巴蜀之地；‘夜雨’烘托出凄凉冷清的氛围；‘涨秋池’运用以动写静的手法，写出连绵秋雨使得池水不断上涨的画面，暗喻诗人如秋池般不断积蓄、满溢的离愁别绪，将抽象的愁思具象化。</p>",
      quizId: 2
    },
    {
      id: "cp-verse3",
      time: 14.0,
      title: "【虚实相生】共剪西窗之烛",
      content: "<p><b>何当共剪西窗烛</b></p><p>解读：‘何当’意为‘什么时候才能够’，表明这是对未来重逢的想象与向往（虚景）。‘共剪西窗烛’是极具温情和亲密感的细节描写，表达了诗人热切盼望归家与亲友聚首、共享温馨相守时刻的深情。</p>",
      testPointId: "imagery-chain"
    },
    {
      id: "cp-verse4",
      time: 17.6,
      title: "【主旨归纳】却话当时夜雨",
      content: "<p><b>却话巴山夜雨时</b></p><p>解读：‘却话’意为回头叙说。此句再次出现‘巴山夜雨’，但此处为虚写，是想象未来团聚时回首叙说今夜在此听雨时的凄冷和思念。通过未来的欢聚反衬当下的孤寂，虚实相生，使离愁别恨显得更加深挚曲折。</p>",
      quizId: 3
    }
  ],

  verses: [
    {
      id: 0,
      text: "君问归期未有期，",
      literal: "您问我回家的日期，我却还没有确定的归期。",
      interpretation: "‘未有期’表现了诗人归期难测的无奈与客居异乡的惆怅。",
      start: 2.2,
      end: 6.0,
      words: [
        {
          id: "guiqi",
          word: "归期",
          pinyin: "guī qī",
          category: "时间",
          explanation: "回家的日期。",
          zhongkao: "【中考设问点】一问一答，以‘有期’之问对‘无期’之答，写尽羁旅巴蜀的无奈与孤独。"
        },
        {
          id: "weiyouqi",
          word: "未有期",
          pinyin: "wèi yǒu qī",
          category: "处境",
          explanation: "没有确定的日期。",
          zhongkao: "【情感证据】‘未有期’直接写出归期难测的惆怅与漂泊无依的悲伤。"
        }
      ]
    },
    {
      id: 1,
      text: "巴山夜雨涨秋池。",
      literal: "在这深秋的夜里，巴山的夜雨涨满了秋池。",
      interpretation: "秋池水涨实写眼前凄凉冷清的画面，暗喻愁绪如池水般不断积蓄上涨。",
      start: 6.0,
      end: 10.0,
      words: [
        {
          id: "bashan",
          word: "巴山",
          pinyin: "bā shān",
          category: "地理空间",
          explanation: "大巴山，借指巴蜀地区（今四川、重庆一带）。",
          zhongkao: "【空间证据】点明诗人客居的巴蜀之地，道路艰险，倍显与亲人距离遥远。"
        },
        {
          id: "yeyu",
          word: "夜雨",
          pinyin: "yè yǔ",
          category: "环境氛围",
          explanation: "夜里的雨。",
          zhongkao: "【意境证据】‘夜雨’烘托出凄凉、暗淡、冷清的氛围，是诗人离愁别绪的象征。"
        },
        {
          id: "qiuchi",
          word: "秋池",
          pinyin: "qiū chí",
          category: "季节",
          explanation: "秋天的池塘。",
          zhongkao: "【时间证据】‘秋’点明深秋季节，‘涨秋池’以动写静，暗喻愁思如涨满的池水般无边无际。"
        }
      ]
    },
    {
      id: 2,
      text: "何当共剪西窗烛，",
      literal: "什么时候我们才能在西窗下共聚，共同修剪烛芯长谈，",
      interpretation: "想象未来重逢剪烛夜谈的温馨情景（虚写），反衬当下听雨的孤独。",
      start: 10.0,
      end: 14.0,
      words: [
        {
          id: "hedang",
          word: "何当",
          pinyin: "hé dāng",
          category: "期望",
          explanation: "什么时候。表示企盼。",
          zhongkao: "【时间证据】‘何当’点明这是诗人未来的设想与企盼，属于虚写，与眼前‘未有期’形成强烈的虚实对照。"
        },
        {
          id: "gongjian",
          word: "共剪",
          pinyin: "gòng jiǎn",
          category: "动作细节",
          explanation: "共同修剪烛芯。",
          zhongkao: "【细节证据】‘共剪’是极具亲密感的细节描写，表达了诗人对重逢之后温馨相守的热切渴望。"
        },
        {
          id: "xichuangzhu",
          word: "西窗烛",
          pinyin: "xī chuāng zhú",
          category: "意象",
          explanation: "西窗下的蜡烛。",
          zhongkao: "【细节证据】‘西窗烛’是思念与渴望重逢的经典细节象征，寓指夫妻或知己间的温馨陪伴。"
        }
      ]
    },
    {
      id: 3,
      text: "却话巴山夜雨时。",
      literal: "再聚首叙谈今天在巴山夜雨时的情景。",
      interpretation: "再次出现巴山夜雨，转化为想象中对当下离愁的回忆，倍增今夜的凄冷。",
      start: 14.0,
      end: 17.6,
      words: [
        {
          id: "quehua",
          word: "却话",
          pinyin: "què huà",
          category: "叙旧",
          explanation: "回头叙说，谈起。",
          zhongkao: "【结构证据】‘却话’以未来的重聚来回溯当下的孤寂，体现出时空的交错之美。"
        }
      ]
    }
  ],

  testPoints: [
    {
      id: "form-and-title",
      triggerTime: 2.2,
      jumpTime: 0,
      shortTitle: "题目作用",
      title: "【中考基础考点】七言绝句与题目作用",
      verse: "夜雨寄北",
      question: "这首诗的题目是《夜雨寄北》，请问‘寄北’是什么意思？",
      prediction: {
        options: ["寄给北方的亲友", "寄给北方的皇帝", "从北方寄来的信", "诗人的笔名"],
        correctIndex: 0,
        response: "‘夜雨寄北’意为在秋雨连绵的夜晚写信或诗寄给北方的亲友，点明了诗歌创作的背景和投寄对象。"
      },
      steps: [
        { label: "第一步：抓关键字", text: "“寄”指寄信、寄诗；“北”指北方。" },
        { label: "第二步：理解背景", text: "李商隐当时滞留巴蜀（南方），而他的亲友身在北方（长安）。" },
        { label: "第三步：归纳题意", text: "因此题目意为“在秋雨绵绵的夜晚写诗寄给北方的亲友”。" }
      ],
      standardAnswer: "‘夜雨寄北’意为在秋雨连绵的夜晚写信或诗寄给北方的妻子或亲友，点明了诗歌创作的背景和投寄对象。",
      scoreTip: "答出写诗背景（夜雨）和投寄对象（北方的亲友）。",
      followupQuizId: 5
    },
    {
      id: "opening-tone",
      triggerTime: 6.0,
      jumpTime: 2.2,
      shortTitle: "首句情感",
      title: "【中考高频考点】第一句‘未有期’奠定了怎样的情感基调",
      verse: "君问归期未有期，",
      question: "“未有期”三个字表现了诗人怎样的心情？",
      prediction: {
        options: ["喜悦期盼", "急躁愤怒", "惆怅无奈", "闲适淡泊"],
        correctIndex: 2,
        response: "“未有期”写出了想回却无法回家的无奈与怅惘，表现了羁旅异乡的孤独，奠定了全诗忧郁惆怅的情感基调。"
      },
      steps: [
        { label: "第一步：抓关键词", text: "“君问归期”是亲友的关切询问；“未有期”是无法确定的无奈回答。" },
        { label: "第二步：分析情感", text: "一问一答，归期无望，表现了诗人羁旅在外的愁苦与惆怅。" },
        { label: "第三步：总结基调", text: "奠定了全诗凄清、怅惘、思乡的基调。" }
      ],
      standardAnswer: "“未有期”写出了诗人想回却无法回家的无奈与怅惘，表现了羁旅异乡的孤独，奠定了全诗忧郁惆怅的情感基调。",
      scoreTip: "答出想归而不得的无奈、孤独处境与惆怅基调。",
      followupQuizId: 1
    },
    {
      id: "scenic-contrast",
      triggerTime: 10.0,
      jumpTime: 6.0,
      shortTitle: "秋池水涨",
      title: "【中考手法考点】巴山夜雨‘涨秋池’的以动写静与衬托",
      verse: "巴山夜雨涨秋池。",
      question: "“涨秋池”一词在写景和抒情上有什么妙处？",
      prediction: {
        options: ["单纯描写池水上涨", "以动写静，暗喻愁思无限", "暗示雨大可以捕鱼", "表现春雨的滋润生机"],
        correctIndex: 1,
        response: "“涨”字以动写静，把无形的愁思比作不断上涨的池水，具象化地写出愁思的绵延无尽。"
      },
      steps: [
        { label: "第一步：分析景物", text: "夜雨连绵，池水上涨，是眼前实景。" },
        { label: "第二步：理解艺术手法", text: "“涨”字以动写静，把无形的愁思比作不断上涨的池水，具象化地写出愁思的绵延无尽。" },
        { label: "第三步：结合环境", text: "秋池秋水连绵，衬托出诗人在巴蜀之夜的无限凄冷与落寞。" }
      ],
      standardAnswer: "“涨秋池”运用了以动写静的手样，写出秋雨连绵、池水不断上涨的景象。同时，它暗喻了诗人如秋池般不断积蓄、满溢的离愁别绪，将抽象的愁思具象化，深化了凄凉孤寂的意境。",
      scoreTip: "答出以动写静的手法、池水上涨的画面、以及暗喻愁思无限的抒情作用。",
      followupQuizId: 2
    },
    {
      id: "imagery-chain",
      triggerTime: 14.0,
      jumpTime: 2.2,
      shortTitle: "虚实结合",
      title: "【中考核心考点】后两句的虚实结合与以乐衬哀",
      verse: "何当共剪西窗烛，却话巴山夜雨时。",
      question: "后两句描绘的温馨重聚场面，在全诗中起到什么艺术作用？",
      prediction: {
        options: ["表明诗人已经回到家中", "虚实结合，以乐衬哀，倍增今日孤寂", "单纯记录夫妻日常生活", "表达对巴蜀山水的热爱"],
        correctIndex: 1,
        response: "温馨的想象重逢（虚景）反衬了此时此刻独自在巴山听雨的孤独和落寞（实景），属于以乐衬哀，使得离愁别绪显得更加深沉。"
      },
      steps: [
        { label: "第一步：判断虚实", text: "“共剪西窗烛”是想象未来的虚景，而巴山夜雨是当下的实景。" },
        { label: "第二步：分析对比作用", text: "想象未来重逢时的温馨欢聚（乐景），反衬了此时此刻独自在巴山听雨的孤独和落寞（哀情）。" },
        { label: "第三步：点明情感", text: "这属于虚实结合、以乐衬哀的手法，使眼前的离愁别绪显得更加深沉。" }
      ],
      standardAnswer: "后两句运用了虚实结合（或以乐衬哀）的手法。诗人通过想象未来重逢剪烛叙旧的温馨场景（虚景），反衬眼前独自羁旅巴山听雨的凄冷孤寂（实景）。未来的温馨越令人向往，越显得今日的孤独愁苦深沉，使得离愁别绪倍增。",
      scoreTip: "指出虚实结合（以乐衬哀）手法，写出未来温馨与今日凄冷的对照，并说明对愁情的深化作用。",
      followupQuizId: 3
    }
  ],

  quizzes: [
    {
      id: 1,
      type: "objective",
      maxScore: 1,
      question: "下列对《夜雨寄北》的赏析，不正确的一项是：",
      options: [
        "A. 首句‘君问归期未有期’中，‘君’的关切与诗人的‘未有期’构成一问一答，流露出客居异乡的无奈。",
        "B. 第二句‘巴山夜雨涨秋池’实写眼前之景，秋风秋雨不仅涨满池水，也涨满了诗人的满腔愁绪。",
        "C. 第三句‘何当共剪西窗烛’写诗人已经回到家中，和亲人正在剪烛夜谈，充满了重逢的喜悦。",
        "D. 全诗融写景、抒情、想象于一体，时空交错，情感真挚，构思精巧。"
      ],
      correctIndex: 2,
      jumpTime: 10.0,
      hint: "判断第三句‘何当’在诗中的含义，它是写眼前的现实还是对未来的想象。",
      explanation: [
        "正确答案是 C。",
        "‘何当’是‘什么时候才能够’的意思，表明‘共剪西窗烛’是诗人的设想与期盼（虚景），而非诗人已经回家的现实。"
      ]
    },
    {
      id: 2,
      type: "subjective",
      rubricType: "imagery-analysis",
      maxScore: 5,
      question: "诗中两次提到“巴山夜雨”，在写法和情感表达上有什么妙处？请简要作答。",
      hint: "结合虚实结合和时空交错进行分析，分别指出两处‘巴山夜雨’的不同虚实性质。",
      jumpTime: 6.0,
      scorePoints: [
        { id: "technique", text: "指出两次叠用构成了时空交错（或虚实结合）的手法", score: 1 },
        { id: "picture", text: "指出第一处‘巴山夜雨’是实写，写当下凄冷环境和离愁", score: 1 },
        { id: "mood", text: "指出第二处‘巴山夜雨’是虚写，是未来重聚时对今夜的回忆", score: 1 },
        { id: "emotion", text: "阐明这种写法使得离愁别绪显得更加深婉深沉", score: 2 }
      ],
      explanation: [
        "两次使用‘巴山夜雨’，构成了虚实相生、时空交错的艺术效果。",
        "第一处‘巴山夜雨涨秋池’是实写，写当下客居之地的凄凉环境与深沉孤寂；第二处‘却话巴山夜雨时’是虚写，写想象中未来重逢时，共同回忆今夜听雨时的离愁。以未来的乐景反衬当下的哀情，情感更加深婉深沉。"
      ]
    },
    {
      id: 3,
      type: "objective",
      maxScore: 1,
      question: "本诗在情感表达上最突出的写作手法是：",
      options: [
        "A. 托物言志",
        "B. 虚实结合（以乐衬哀）",
        "C. 直抒胸臆",
        "D. 动静结合"
      ],
      correctIndex: 1,
      jumpTime: 14.0,
      hint: "寻找实写眼前听雨与虚写未来重聚剪烛之间的关系。",
      explanation: [
        "正确答案是 B。",
        "全诗前半部分实写眼前巴山夜雨的孤寂（实），后半部分虚写想象中未来重聚剪烛夜话的温馨（虚），通过未来的欢聚反衬今日的思念与落寞，这属于虚实结合、以乐衬哀的手法。"
      ]
    },
    {
      id: 4,
      type: "subjective",
      rubricType: "transfer",
      maxScore: 3,
      question: "比较本诗与陆游‘夜阑卧听风吹雨，铁马冰河入梦来’，说明相近的‘雨’意象如何产生不同的表达效果。",
      hint: "必须分别引用两篇文本中的词语，说明它们与人物情感或理想的关系。",
      jumpTime: 6.0,
      scorePoints: [
        { id: "source", text: "引用本诗中的巴山夜雨等词语证据", score: 1 },
        { id: "transfer", text: "引用陆游诗句中的风吹雨或铁马冰河", score: 1 },
        { id: "effect", text: "比较两处意象与个人离愁与爱国壮志的不同情感关系", score: 1 }
      ],
      explanation: [
        "李商隐的‘巴山夜雨’多是缠绵细雨，烘托寂寞与相思之情，属于儿女情长、客旅哀愁；",
        "而陆游的‘风吹雨’则是狂风暴雨，激发了诗人‘铁马冰河’的爱国梦境，将风雨与国家命运、报国志向相联系，格调豪壮。两首诗通过相近的‘雨’意象，抒发了完全不同的情怀。"
      ]
    },
    {
      id: 5,
      type: "objective",
      maxScore: 1,
      question: "《夜雨寄北》中“寄北”的意思是什么？",
      options: [
        "A. 寄信给北方的亲友",
        "B. 寄信给北方的朝廷",
        "C. 诗人在北方写信",
        "D. 从北方寄回来的信"
      ],
      correctIndex: 0,
      jumpTime: 0,
      hint: "李商隐当时滞留在巴蜀（南方），而他的亲友身在北方（长安）。",
      explanation: [
        "正确答案是 A。",
        "‘寄北’指寄信给北方的亲人或朋友。李商隐当时身处巴蜀地区，属于南方，而家乡或关切的亲友在北方（长安一带），因此称‘寄北’。"
      ]
    }
  ].sort((left, right) => QUIZ_LEARNING_ORDER.indexOf(left.id) - QUIZ_LEARNING_ORDER.indexOf(right.id)),

  dictations: [
    {
      id: 1,
      question: "写出诗人客居巴蜀，面对秋雨绵绵，归期难测的无奈与惆怅的诗句是：",
      answer: "君问归期未有期",
      hint: "回看第一句，注意‘归期’与‘未有期’。",
      jumpTime: 2.2
    },
    {
      id: 2,
      question: "实写巴蜀之地秋雨连绵，池水上涨，渲染了凄凉孤独氛围的诗句是：",
      answer: "巴山夜雨涨秋池",
      hint: "回看第二句，注意‘夜雨’与‘秋池’。",
      jumpTime: 6.0
    },
    {
      id: 3,
      question: "写出诗人想象与亲友重逢，在西窗下共剪烛芯、彻夜长谈的温馨细节的句子是：",
      answer: "何当共剪西窗烛",
      hint: "回看第三句，注意‘西窗’与‘烛’。",
      jumpTime: 10.0
    },
    {
      id: 4,
      question: "写出诗人想象重逢之后，向对方倾诉在巴山听雨时的离愁别绪的句子是：",
      answer: "却话巴山夜雨时",
      hint: "回看第四句，注意‘却话’与‘夜雨时’。",
      jumpTime: 14.0
    }
  ],

  evidenceModel: {
    relationship: "眼前夜雨实景 → 未来重逢想象 → 未来回望此刻 → 虚实相生、时空回环 → 思念更深",
    groups: [
      {
        id: "present-solitude",
        label: "眼前实景",
        cue: "归期无定，巴山夜雨涨满秋池，现实凄清孤寂",
        image: "images/verse_2.jpg?v=f1b5b0d26218"
      },
      {
        id: "future-reunion",
        label: "未来团聚",
        cue: "何当共剪西窗烛，是对重逢长谈的温暖想象",
        image: "images/verse_3.jpg?v=bd518aa38521"
      },
      {
        id: "time-loop",
        label: "时空回环",
        cue: "未来相聚时，再回说今夜巴山夜雨，虚实交错",
        image: "images/verse_4.jpg?v=fe91026945b6"
      }
    ],
    items: [
      { id: "guiqi", label: "归期", group: "present-solitude", verseStart: 2.2 },
      { id: "weiyouqi", label: "未有期", group: "present-solitude", verseStart: 2.2 },
      { id: "bashan", label: "巴山", group: "present-solitude", verseStart: 6.0 },
      { id: "yeyu", label: "夜雨", group: "present-solitude", verseStart: 6.0 },
      { id: "qiuchi", label: "秋池", group: "present-solitude", verseStart: 6.0 },
      { id: "hedang", label: "何当", group: "future-reunion", verseStart: 10.0 },
      { id: "gongjian", label: "共剪", group: "future-reunion", verseStart: 10.0 },
      { id: "xichuangzhu", label: "西窗烛", group: "future-reunion", verseStart: 10.0 },
      { id: "quehua", label: "却话", group: "time-loop", verseStart: 14.0 }
    ],
    sceneHotspots: []
  },

  imageryMindmap: [
    {
      id: "yeyu",
      name: "夜雨",
      verseStart: 6.0,
      symbolism: "烘托凄清、暗淡的氛围，常用于表现离愁别恨与客旅孤寂。",
      comparison: [
        {
          title: "李商隐《夜雨寄北》",
          quote: "巴山夜雨涨秋池",
          note: "连绵夜雨既是眼前景，又是离人泪，渲染极度愁苦。"
        },
        {
          title: "陆游《十一月四日风雨大作》",
          quote: "夜阑卧听风吹雨，铁马冰河入梦来",
          note: "夜雨与狂风组合，触发诗人铁马冰河的爱国报国梦境，变离愁为豪壮。"
        }
      ]
    },
    {
      id: "xichuangzhu",
      name: "烛 / 西窗烛",
      verseStart: 10.0,
      symbolism: "烛光照亮黑夜，剪烛是深夜长谈的温情细节，常象征思念、陪伴与期盼。",
      comparison: [
        {
          title: "李商隐《夜雨寄北》",
          quote: "何当共剪西窗烛",
          note: "剪烛象征对重聚的企盼与夫妻/知己相守的温馨。"
        },
        {
          title: "李商隐《无题·相见时难别亦难》",
          quote: "蜡炬成灰泪始干",
          note: "蜡烛燃烧自己并垂泪，象征对爱情至死不渝的奉献与思念。"
        }
      ]
    },
    {
      id: "qiuchi",
      name: "秋池 / 秋水",
      verseStart: 6.0,
      symbolism: "秋天的池水多有寒意，池水上涨常暗喻愁绪的积累与情思的绵延。",
      comparison: [
        {
          title: "李商隐《夜雨寄北》",
          quote: "巴山夜雨涨秋池",
          note: "秋池水涨，具象化地展现了诗人内心离愁别绪的积聚与满溢。"
        },
        {
          title: "李煜《虞美人》",
          quote: "问君能有几多愁？恰似一江春水向东流",
          note: "同样是将满腔愁绪比作滔滔流淌的江水，有异曲同工之妙。"
        }
      ]
    }
  ]
};
