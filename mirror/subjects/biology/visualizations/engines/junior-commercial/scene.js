window.BIO_VISUAL_SCENES = window.BIO_VISUAL_SCENES || {};

(function () {
  const CARD_DATA = {
    j7a_m01: {
      title: "生命特征与生物圈",
      theme: "ecosystem",
      accent: "#34d399",
      goal: "用证据判断生物特征，并把个体放回生物圈关系中。",
      nodes: [
        { id: "life", label: "生物个体", x: 0, y: -35, type: "organism", hint: "能呼吸、生长、繁殖，并对刺激作出反应。" },
        { id: "water", label: "水分", x: -170, y: -98, type: "factor", hint: "非生物因素会影响生物生活。" },
        { id: "light", label: "光照", x: 170, y: -98, type: "factor", hint: "绿色植物制造有机物需要光。" },
        { id: "food", label: "食物", x: -160, y: 115, type: "factor", hint: "营养来源影响生物生存。" },
        { id: "habitat", label: "栖息环境", x: 165, y: 118, type: "habitat", hint: "生物与环境相互影响。" }
      ],
      flows: [["water", "life"], ["light", "life"], ["food", "life"], ["life", "habitat"]],
      steps: [
        { name: "观察对象", focus: "先判断研究对象是否具有生命现象。", active: ["life"] },
        { name: "找环境因素", focus: "区分水分、光照、温度等非生物因素。", active: ["water", "light"] },
        { name: "看相互作用", focus: "生物既受环境影响，也能影响环境。", active: ["life", "habitat"] }
      ],
      task: "点击所有会影响生物生活的环境因素。",
      correct: ["water", "light", "food", "habitat"],
      exam: [
        { q: "能生长、繁殖并对刺激作出反应，是判断生物的重要依据。", a: true, ok: "对。生命特征要结合多个证据判断。", bad: "再想想：这些正是常见生命特征。" },
        { q: "生物圈只包括所有生物，不包括它们生活的环境。", a: false, ok: "对。生物圈包括生物及其生存环境。", bad: "生物圈不是单纯生物名单，还包括环境。" }
      ]
    },
    j7b_m08: {
      title: "激素调节",
      theme: "body",
      accent: "#22d3ee",
      goal: "把内分泌腺、激素和靶器官的作用关系连起来。",
      nodes: [
        { id: "pituitary", label: "垂体", x: 0, y: -138, type: "gland", hint: "分泌多种激素，调节其他内分泌腺。" },
        { id: "thyroid", label: "甲状腺", x: -120, y: -42, type: "gland", hint: "甲状腺激素影响生长发育和代谢。" },
        { id: "pancreas", label: "胰岛", x: 122, y: -42, type: "gland", hint: "胰岛素参与血糖调节。" },
        { id: "blood", label: "血液运输", x: 0, y: 45, type: "flow", hint: "激素经血液运输到相应部位。" },
        { id: "target", label: "靶器官", x: 0, y: 142, type: "target", hint: "激素含量少，但调节作用明显。" }
      ],
      flows: [["pituitary", "thyroid"], ["pituitary", "pancreas"], ["thyroid", "blood"], ["pancreas", "blood"], ["blood", "target"]],
      steps: [
        { name: "内分泌腺", focus: "先找产生激素的结构。", active: ["pituitary", "thyroid", "pancreas"] },
        { name: "血液运输", focus: "激素没有专门导管，通常进入血液。", active: ["blood"] },
        { name: "调节靶器官", focus: "激素作用于相应器官，调节生命活动。", active: ["target"] }
      ],
      task: "点击能分泌激素的内分泌腺。",
      correct: ["pituitary", "thyroid", "pancreas"],
      exam: [
        { q: "激素由内分泌腺产生，通常经血液运输。", a: true, ok: "对。内分泌腺无导管，激素进入血液。", bad: "注意内分泌腺与外分泌腺的区别。" },
        { q: "胰岛素分泌不足可能影响血糖稳定。", a: true, ok: "对。胰岛素是血糖调节的重要激素。", bad: "胰岛素与血糖调节直接相关。" }
      ]
    },
    j7b_m09: {
      title: "免疫与健康急救",
      theme: "immune",
      accent: "#38bdf8",
      goal: "区分传染病环节、免疫防线和常见急救处理。",
      nodes: [
        { id: "source", label: "传染源", x: -180, y: -65, type: "danger", hint: "能散播病原体的人或动物。" },
        { id: "route", label: "传播途径", x: 0, y: -65, type: "flow", hint: "空气、水、接触等都可能传播病原体。" },
        { id: "host", label: "易感人群", x: 180, y: -65, type: "target", hint: "缺乏免疫力的人更容易患病。" },
        { id: "barrier", label: "第一道防线", x: -95, y: 105, type: "shield", hint: "皮肤和黏膜能阻挡病原体。" },
        { id: "vaccine", label: "接种疫苗", x: 105, y: 105, type: "shield", hint: "疫苗可使机体产生特异性免疫。" }
      ],
      flows: [["source", "route"], ["route", "host"], ["barrier", "host"], ["vaccine", "host"]],
      steps: [
        { name: "识别环节", focus: "传染病流行要有三个基本环节。", active: ["source", "route", "host"] },
        { name: "切断传播", focus: "控制传染源、切断传播途径、保护易感人群。", active: ["route", "vaccine"] },
        { name: "免疫防线", focus: "皮肤黏膜属于非特异性免疫，疫苗属于特异性免疫。", active: ["barrier", "vaccine"] }
      ],
      task: "点击可以保护易感人群的措施或结构。",
      correct: ["barrier", "vaccine"],
      exam: [
        { q: "接种疫苗通常属于保护易感人群的措施。", a: true, ok: "对。疫苗能提高机体特异性免疫能力。", bad: "疫苗重点是让易感者获得免疫保护。" },
        { q: "皮肤和黏膜属于人体第一道防线。", a: true, ok: "对。它们属于非特异性免疫。", bad: "第一道防线正是皮肤和黏膜。" }
      ]
    },
    j8a_m01: {
      title: "植物类群演化",
      theme: "plant",
      accent: "#34d399",
      goal: "比较藻类、苔藓、蕨类、种子植物的结构进步。",
      nodes: [
        { id: "algae", label: "藻类", x: -210, y: 65, type: "plant", hint: "多数生活在水中，无根茎叶分化。" },
        { id: "moss", label: "苔藓", x: -70, y: 5, type: "plant", hint: "有茎叶分化，无真正输导组织。" },
        { id: "fern", label: "蕨类", x: 75, y: -45, type: "plant", hint: "有根茎叶和输导组织，用孢子繁殖。" },
        { id: "seed", label: "种子植物", x: 215, y: -95, type: "plant", hint: "形成种子，适应陆地生活能力更强。" }
      ],
      flows: [["algae", "moss"], ["moss", "fern"], ["fern", "seed"]],
      steps: [
        { name: "水生到陆生", focus: "植物类群演化与适应陆地有关。", active: ["algae", "moss"] },
        { name: "输导组织", focus: "蕨类开始有明显输导组织。", active: ["fern"] },
        { name: "种子出现", focus: "种子提高后代保护和传播能力。", active: ["seed"] }
      ],
      task: "点击适应陆地能力最强的类群。",
      correct: ["seed"],
      exam: [
        { q: "苔藓植物可作为监测空气污染程度的指示植物。", a: true, ok: "对。苔藓叶薄，对有害气体敏感。", bad: "苔藓常用于空气污染指示。" },
        { q: "蕨类植物和种子植物都用种子繁殖。", a: false, ok: "对。蕨类主要用孢子繁殖。", bad: "蕨类不是种子植物。" }
      ]
    },
    j8a_m02: {
      title: "动物类群",
      theme: "animal",
      accent: "#f59e0b",
      goal: "用体表、呼吸、运动和生殖特征比较动物类群。",
      nodes: [
        { id: "arthropod", label: "节肢动物", x: -205, y: -55, type: "animal", hint: "体表有外骨骼，身体和附肢分节。" },
        { id: "fish", label: "鱼类", x: -70, y: 65, type: "animal", hint: "终生生活在水中，用鳃呼吸。" },
        { id: "amphibian", label: "两栖类", x: 75, y: 65, type: "animal", hint: "幼体水生用鳃，成体多用肺和皮肤呼吸。" },
        { id: "bird", label: "鸟类", x: 205, y: -55, type: "animal", hint: "体表覆羽，前肢变翼，体温恒定。" },
        { id: "mammal", label: "哺乳类", x: 0, y: -125, type: "animal", hint: "胎生哺乳，体温恒定。" }
      ],
      flows: [["arthropod", "fish"], ["fish", "amphibian"], ["amphibian", "bird"], ["amphibian", "mammal"]],
      steps: [
        { name: "无脊椎", focus: "节肢动物是种类最多的动物类群。", active: ["arthropod"] },
        { name: "水陆过渡", focus: "鱼类到两栖类体现生活环境变化。", active: ["fish", "amphibian"] },
        { name: "恒温动物", focus: "鸟类和哺乳类通常体温恒定。", active: ["bird", "mammal"] }
      ],
      task: "点击体温通常恒定的动物类群。",
      correct: ["bird", "mammal"],
      exam: [
        { q: "鱼类用鳃呼吸，身体多呈流线型。", a: true, ok: "对。这些特征有利于水中生活。", bad: "鱼类适应水生生活，鳃呼吸是核心特征。" },
        { q: "节肢动物体表有外骨骼，可以防止体内水分散失。", a: true, ok: "对。外骨骼兼具保护和防水作用。", bad: "外骨骼是节肢动物重要特征。" }
      ]
    },
    j8a_m03: {
      title: "动物运动与行为",
      theme: "motion",
      accent: "#60a5fa",
      goal: "把骨、关节、肌肉和行为类型放到一个运动模型里。",
      nodes: [
        { id: "bone", label: "骨", x: -190, y: 15, type: "structure", hint: "骨相当于杠杆。" },
        { id: "joint", label: "关节", x: 0, y: 15, type: "structure", hint: "关节是运动的支点，结构包括关节头、关节窝等。" },
        { id: "muscle", label: "骨骼肌", x: 190, y: 15, type: "structure", hint: "骨骼肌收缩牵拉骨绕关节运动。" },
        { id: "innate", label: "先天性行为", x: -95, y: 130, type: "behavior", hint: "由遗传物质决定，生来就有。" },
        { id: "learned", label: "学习行为", x: 105, y: 130, type: "behavior", hint: "由生活经验和学习获得。" }
      ],
      flows: [["muscle", "bone"], ["bone", "joint"], ["joint", "muscle"]],
      steps: [
        { name: "运动结构", focus: "运动系统由骨、关节和肌肉协调完成。", active: ["bone", "joint", "muscle"] },
        { name: "肌肉牵拉", focus: "骨骼肌只能收缩牵拉骨，不能推开骨。", active: ["muscle", "bone"] },
        { name: "行为区分", focus: "先天性行为和学习行为的来源不同。", active: ["innate", "learned"] }
      ],
      task: "点击完成运动直接需要协调配合的结构。",
      correct: ["bone", "joint", "muscle"],
      exam: [
        { q: "关节在运动中相当于支点。", a: true, ok: "对。骨、关节、肌肉共同完成运动。", bad: "运动模型中关节就是支点。" },
        { q: "学习行为一出生就完全具备，不受经验影响。", a: false, ok: "对。学习行为需要经验和学习。", bad: "这描述的是先天性行为。" }
      ]
    },
    j8a_m04: {
      title: "细菌",
      theme: "microbe",
      accent: "#a78bfa",
      goal: "看懂细菌结构、营养方式和分裂生殖。",
      nodes: [
        { id: "wall", label: "细胞壁", x: -165, y: -70, type: "micro", hint: "保护和维持细胞形态。" },
        { id: "membrane", label: "细胞膜", x: 0, y: -110, type: "micro", hint: "控制物质进出。" },
        { id: "dna", label: "DNA集中区", x: 165, y: -70, type: "dna", hint: "细菌没有成形细胞核。" },
        { id: "flagellum", label: "鞭毛", x: -110, y: 95, type: "micro", hint: "部分细菌靠鞭毛运动。" },
        { id: "split", label: "分裂生殖", x: 110, y: 95, type: "process", hint: "细菌主要通过分裂生殖增殖。" }
      ],
      flows: [["wall", "membrane"], ["membrane", "dna"], ["dna", "split"]],
      steps: [
        { name: "结构识别", focus: "细菌没有成形细胞核。", active: ["wall", "membrane", "dna"] },
        { name: "营养方式", focus: "多数细菌不能自己制造有机物。", active: ["membrane"] },
        { name: "快速繁殖", focus: "适宜条件下分裂生殖速度快。", active: ["split"] }
      ],
      task: "点击说明细菌区别于动植物细胞的关键结构。",
      correct: ["dna"],
      exam: [
        { q: "细菌细胞内没有成形的细胞核。", a: true, ok: "对。DNA位于未成形的细胞核区域。", bad: "细菌属于原核生物，没有成形细胞核。" },
        { q: "细菌主要通过分裂生殖繁殖。", a: true, ok: "对。条件适宜时繁殖很快。", bad: "细菌常见繁殖方式是分裂生殖。" }
      ]
    },
    j8a_m05: {
      title: "真菌",
      theme: "fungi",
      accent: "#f472b6",
      goal: "比较酵母菌、霉菌、蘑菇和孢子繁殖。",
      nodes: [
        { id: "yeast", label: "酵母菌", x: -185, y: -72, type: "fungi", hint: "单细胞真菌，可用于发酵。" },
        { id: "mold", label: "霉菌", x: 0, y: -112, type: "fungi", hint: "由菌丝构成，常形成孢子。" },
        { id: "mushroom", label: "蘑菇", x: 185, y: -72, type: "fungi", hint: "大型真菌的子实体。" },
        { id: "hypha", label: "菌丝", x: -88, y: 105, type: "structure", hint: "吸收营养，构成真菌体。" },
        { id: "spore", label: "孢子", x: 105, y: 105, type: "process", hint: "许多真菌通过孢子繁殖。" }
      ],
      flows: [["mold", "hypha"], ["hypha", "spore"], ["mushroom", "spore"], ["yeast", "spore"]],
      steps: [
        { name: "类群比较", focus: "真菌可单细胞，也可多细胞。", active: ["yeast", "mold", "mushroom"] },
        { name: "菌丝吸收", focus: "霉菌等由菌丝吸收现成有机物。", active: ["hypha"] },
        { name: "孢子繁殖", focus: "孢子小而轻，利于扩散。", active: ["spore"] }
      ],
      task: "点击与真菌繁殖直接相关的结构。",
      correct: ["spore"],
      exam: [
        { q: "酵母菌属于真菌，可参与发酵。", a: true, ok: "对。酵母菌常用于制作馒头、面包等。", bad: "酵母菌是典型单细胞真菌。" },
        { q: "蘑菇靠叶绿体自己制造有机物。", a: false, ok: "对。真菌没有叶绿体，营养方式多为异养。", bad: "真菌通常没有叶绿体。" }
      ]
    },
    j8a_m06: {
      title: "病毒",
      theme: "virus",
      accent: "#fb7185",
      goal: "看懂病毒结构简单、不能独立生活、必须寄生。",
      nodes: [
        { id: "coat", label: "蛋白质外壳", x: -155, y: -45, type: "virus", hint: "保护内部遗传物质。" },
        { id: "genome", label: "遗传物质", x: 0, y: -112, type: "dna", hint: "病毒只含一种遗传物质。" },
        { id: "host", label: "活细胞", x: 155, y: -45, type: "target", hint: "病毒必须寄生在活细胞内。" },
        { id: "copy", label: "复制增殖", x: -75, y: 112, type: "process", hint: "利用宿主细胞物质复制自身。" },
        { id: "release", label: "释放", x: 105, y: 112, type: "process", hint: "新病毒释放后继续感染。" }
      ],
      flows: [["coat", "host"], ["genome", "host"], ["host", "copy"], ["copy", "release"]],
      steps: [
        { name: "结构简单", focus: "病毒没有细胞结构。", active: ["coat", "genome"] },
        { name: "专性寄生", focus: "必须进入活细胞才能增殖。", active: ["host"] },
        { name: "复制释放", focus: "借宿主细胞完成复制和释放。", active: ["copy", "release"] }
      ],
      task: "点击病毒生活必须依赖的对象。",
      correct: ["host"],
      exam: [
        { q: "病毒没有细胞结构。", a: true, ok: "对。病毒结构比细胞简单得多。", bad: "病毒不是细胞型生物。" },
        { q: "病毒可以在普通培养基上独立生长繁殖。", a: false, ok: "对。病毒必须寄生在活细胞内。", bad: "病毒不能离开活细胞独立增殖。" }
      ]
    },
    j8a_m07: {
      title: "生物分类",
      theme: "classification",
      accent: "#2dd4bf",
      goal: "理解分类等级、分类依据和检索表判断。",
      nodes: [
        { id: "kingdom", label: "界", x: -220, y: -95, type: "rank", hint: "最高层级之一，范围最大。" },
        { id: "phylum", label: "门", x: -105, y: -35, type: "rank", hint: "分类范围逐步缩小。" },
        { id: "class", label: "纲", x: 0, y: 18, type: "rank", hint: "同一级越往下，共同特征越多。" },
        { id: "genus", label: "属", x: 105, y: 72, type: "rank", hint: "比科更小，比种更大。" },
        { id: "species", label: "种", x: 220, y: 126, type: "rank", hint: "最基本的分类单位。" }
      ],
      flows: [["kingdom", "phylum"], ["phylum", "class"], ["class", "genus"], ["genus", "species"]],
      steps: [
        { name: "等级顺序", focus: "分类单位从大到小，包含范围逐渐缩小。", active: ["kingdom", "phylum", "class", "genus", "species"] },
        { name: "共同特征", focus: "分类单位越小，生物共同特征越多。", active: ["genus", "species"] },
        { name: "检索判断", focus: "检索表根据特征逐步排除。", active: ["species"] }
      ],
      task: "点击最基本的分类单位。",
      correct: ["species"],
      exam: [
        { q: "种是最基本的分类单位。", a: true, ok: "对。分类等级中种最基本。", bad: "教材强调种是最基本单位。" },
        { q: "分类单位越大，生物之间共同特征越多。", a: false, ok: "对。单位越小，共同特征越多。", bad: "这句话方向反了。" }
      ]
    },
    j8a_m08: {
      title: "生物多样性",
      theme: "biodiversity",
      accent: "#84cc16",
      goal: "区分遗传多样性、物种多样性和生态系统多样性。",
      nodes: [
        { id: "gene", label: "遗传多样性", x: -190, y: -75, type: "dna", hint: "同种生物不同个体也有遗传差异。" },
        { id: "species", label: "物种多样性", x: 0, y: -120, type: "organism", hint: "一定区域内物种种类丰富。" },
        { id: "eco", label: "生态系统多样性", x: 190, y: -75, type: "habitat", hint: "森林、草原、湿地等生态系统类型多样。" },
        { id: "value", label: "直接/间接价值", x: -90, y: 112, type: "value", hint: "包括食物、药用、生态调节等价值。" },
        { id: "protect", label: "保护措施", x: 105, y: 112, type: "shield", hint: "保护栖息地是保护多样性的关键。" }
      ],
      flows: [["gene", "species"], ["species", "eco"], ["eco", "value"], ["value", "protect"]],
      steps: [
        { name: "三个层次", focus: "多样性包括遗传、物种和生态系统三个层次。", active: ["gene", "species", "eco"] },
        { name: "价值判断", focus: "多样性有直接价值、间接价值和潜在价值。", active: ["value"] },
        { name: "保护策略", focus: "保护生物多样性常从栖息地入手。", active: ["protect", "eco"] }
      ],
      task: "点击生物多样性的三个层次。",
      correct: ["gene", "species", "eco"],
      exam: [
        { q: "生物多样性包括遗传多样性、物种多样性和生态系统多样性。", a: true, ok: "对。这是初中阶段最核心的三层次。", bad: "三个层次都要记清。" },
        { q: "保护生物多样性只需要保护少数珍稀动物个体。", a: false, ok: "对。还要保护栖息地和生态系统。", bad: "保护个体远远不够。" }
      ]
    },
    j8b_m01: {
      title: "无性生殖",
      theme: "plant",
      accent: "#22c55e",
      goal: "比较分裂、出芽、扦插、嫁接等无性生殖方式。",
      nodes: [
        { id: "split", label: "分裂生殖", x: -190, y: -75, type: "process", hint: "一个个体分裂形成新个体。" },
        { id: "bud", label: "出芽生殖", x: 0, y: -118, type: "process", hint: "母体长出芽体，芽体发育成新个体。" },
        { id: "cutting", label: "扦插", x: 190, y: -75, type: "plant", hint: "利用植物营养器官培育新植株。" },
        { id: "graft", label: "嫁接", x: -95, y: 112, type: "plant", hint: "接穗与砧木形成层紧密结合。" },
        { id: "clone", label: "遗传稳定", x: 105, y: 112, type: "value", hint: "无性生殖后代与母体性状通常相似。" }
      ],
      flows: [["cutting", "clone"], ["graft", "clone"], ["split", "clone"], ["bud", "clone"]],
      steps: [
        { name: "无需两性细胞", focus: "无性生殖不经过两性生殖细胞结合。", active: ["split", "bud", "cutting", "graft"] },
        { name: "营养繁殖", focus: "扦插和嫁接利用植物营养器官。", active: ["cutting", "graft"] },
        { name: "保持性状", focus: "能较好保持母体优良性状。", active: ["clone"] }
      ],
      task: "点击属于植物营养繁殖的方式。",
      correct: ["cutting", "graft"],
      exam: [
        { q: "嫁接时接穗和砧木的形成层要紧密结合。", a: true, ok: "对。这是嫁接成活关键。", bad: "形成层结合是嫁接核心。" },
        { q: "无性生殖必须经过精子和卵细胞结合。", a: false, ok: "对。那是有性生殖特点。", bad: "无性生殖不经过两性生殖细胞结合。" }
      ]
    },
    j8b_m02: {
      title: "有性生殖与动物发育",
      theme: "reproduction",
      accent: "#f59e0b",
      goal: "串联传粉受精、种子形成和动物发育类型。",
      nodes: [
        { id: "pollination", label: "传粉", x: -205, y: -70, type: "flower", hint: "花粉从花药落到柱头上。" },
        { id: "fertilization", label: "受精", x: -35, y: -115, type: "process", hint: "精子与卵细胞结合形成受精卵。" },
        { id: "seed", label: "种子形成", x: 145, y: -70, type: "plant", hint: "胚珠发育成种子。" },
        { id: "insect", label: "昆虫发育", x: -95, y: 115, type: "animal", hint: "可分完全变态和不完全变态。" },
        { id: "frog", label: "两栖发育", x: 105, y: 115, type: "animal", hint: "幼体生活在水中，形态和成体差异大。" }
      ],
      flows: [["pollination", "fertilization"], ["fertilization", "seed"], ["fertilization", "insect"], ["fertilization", "frog"]],
      steps: [
        { name: "植物有性生殖", focus: "被子植物经历传粉和受精。", active: ["pollination", "fertilization", "seed"] },
        { name: "动物发育", focus: "动物发育可经历不同阶段。", active: ["insect", "frog"] },
        { name: "共同本质", focus: "有性生殖产生受精卵，后代兼有双亲遗传信息。", active: ["fertilization"] }
      ],
      task: "点击有性生殖的关键事件。",
      correct: ["fertilization"],
      exam: [
        { q: "被子植物受精后，胚珠通常发育成种子。", a: true, ok: "对。子房发育成果实，胚珠发育成种子。", bad: "胚珠和种子的对应要记清。" },
        { q: "有性生殖后代只继承母本遗传信息。", a: false, ok: "对。后代兼有双亲遗传信息。", bad: "有性生殖来自两性生殖细胞结合。" }
      ]
    },
    j8b_m03: {
      title: "遗传物质与性状遗传",
      theme: "dna",
      accent: "#38bdf8",
      goal: "把染色体、DNA、基因和性状的层级关系讲清楚。",
      nodes: [
        { id: "chromosome", label: "染色体", x: -185, y: -82, type: "dna", hint: "细胞核中容易被碱性染料染成深色的结构。" },
        { id: "dna", label: "DNA", x: 0, y: -122, type: "dna", hint: "主要遗传物质，位于染色体上。" },
        { id: "gene", label: "基因", x: 185, y: -82, type: "dna", hint: "具有遗传效应的DNA片段。" },
        { id: "trait", label: "性状", x: -85, y: 116, type: "target", hint: "生物体形态结构、生理和行为等特征。" },
        { id: "parent", label: "亲代到子代", x: 110, y: 116, type: "process", hint: "遗传信息通过生殖过程传递。" }
      ],
      flows: [["chromosome", "dna"], ["dna", "gene"], ["gene", "trait"], ["gene", "parent"]],
      steps: [
        { name: "层级关系", focus: "染色体由DNA和蛋白质组成，基因是DNA片段。", active: ["chromosome", "dna", "gene"] },
        { name: "控制性状", focus: "基因控制生物的性状表现。", active: ["gene", "trait"] },
        { name: "亲子传递", focus: "遗传信息从亲代传给子代。", active: ["parent"] }
      ],
      task: "点击具有遗传效应的DNA片段。",
      correct: ["gene"],
      exam: [
        { q: "基因是具有遗传效应的DNA片段。", a: true, ok: "对。这是基因概念核心。", bad: "基因不是整条染色体，而是DNA上的有效片段。" },
        { q: "染色体、DNA、基因三者没有层级关系。", a: false, ok: "对。三者有明确包含关系。", bad: "染色体、DNA、基因要按层级理解。" }
      ]
    },
    j8b_m04: {
      title: "变异现象",
      theme: "variation",
      accent: "#c084fc",
      goal: "区分可遗传变异和不可遗传变异。",
      nodes: [
        { id: "geneChange", label: "遗传物质改变", x: -175, y: -85, type: "dna", hint: "遗传物质改变引起的变异可遗传。" },
        { id: "environment", label: "环境影响", x: 175, y: -85, type: "factor", hint: "只由环境引起、遗传物质未改变的变异通常不可遗传。" },
        { id: "heritable", label: "可遗传变异", x: -95, y: 95, type: "value", hint: "能传给后代，是育种和进化的基础。" },
        { id: "nonheritable", label: "不可遗传变异", x: 105, y: 95, type: "value", hint: "如锻炼造成肌肉发达，一般不遗传。" },
        { id: "selection", label: "选择利用", x: 0, y: -5, type: "process", hint: "人工选择可利用可遗传变异。" }
      ],
      flows: [["geneChange", "heritable"], ["environment", "nonheritable"], ["heritable", "selection"]],
      steps: [
        { name: "找原因", focus: "先看遗传物质是否改变。", active: ["geneChange", "environment"] },
        { name: "判遗传", focus: "遗传物质改变的变异才可能传给后代。", active: ["heritable", "nonheritable"] },
        { name: "联系育种", focus: "育种利用的是可遗传变异。", active: ["selection"] }
      ],
      task: "点击能作为育种材料基础的变异类型。",
      correct: ["heritable"],
      exam: [
        { q: "仅由环境引起且遗传物质未改变的变异一般不可遗传。", a: true, ok: "对。判断关键是遗传物质是否改变。", bad: "环境变异通常不能遗传给后代。" },
        { q: "所有变异都一定能遗传给后代。", a: false, ok: "对。变异分可遗传和不可遗传。", bad: "不是所有变异都可遗传。" }
      ]
    },
    j8b_m06: {
      title: "生物进化与自然选择",
      theme: "evolution",
      accent: "#facc15",
      goal: "用变异、选择、适者生存解释自然选择。",
      nodes: [
        { id: "variation", label: "个体差异", x: -190, y: -72, type: "variation", hint: "群体中普遍存在差异。" },
        { id: "pressure", label: "环境选择", x: 0, y: -118, type: "factor", hint: "环境条件会影响个体生存和繁殖。" },
        { id: "survive", label: "适者生存", x: 190, y: -72, type: "target", hint: "有利变异个体更容易生存并繁殖。" },
        { id: "inherit", label: "有利变异积累", x: -82, y: 115, type: "process", hint: "可遗传有利变异逐代积累。" },
        { id: "fossil", label: "化石证据", x: 110, y: 115, type: "evidence", hint: "化石是研究生物进化的重要证据。" }
      ],
      flows: [["variation", "pressure"], ["pressure", "survive"], ["survive", "inherit"], ["fossil", "pressure"]],
      steps: [
        { name: "存在变异", focus: "自然选择以个体差异为基础。", active: ["variation"] },
        { name: "环境选择", focus: "环境不是主动让生物变好，而是筛选已有差异。", active: ["pressure", "survive"] },
        { name: "证据支持", focus: "化石记录帮助推断进化历程。", active: ["fossil"] }
      ],
      task: "点击自然选择直接筛选的因素。",
      correct: ["pressure"],
      exam: [
        { q: "自然选择通常保留适应环境的有利变异。", a: true, ok: "对。有利变异个体更可能生存繁殖。", bad: "自然选择的结果就是适者生存。" },
        { q: "环境会按需要定向产生有利变异。", a: false, ok: "对。变异先存在，环境进行选择。", bad: "自然选择不是按需要产生变异。" }
      ]
    },
    j8b_m07: {
      title: "生态系统与生态平衡",
      theme: "ecosystem",
      accent: "#22c55e",
      goal: "搭建生产者、消费者、分解者和食物链能量方向。",
      nodes: [
        { id: "producer", label: "生产者", x: -190, y: 0, type: "plant", hint: "主要是绿色植物，能制造有机物。" },
        { id: "primary", label: "初级消费者", x: -45, y: -100, type: "animal", hint: "直接以植物为食。" },
        { id: "secondary", label: "次级消费者", x: 115, y: -40, type: "animal", hint: "捕食初级消费者。" },
        { id: "decomposer", label: "分解者", x: 95, y: 120, type: "micro", hint: "分解动植物遗体和排泄物。" },
        { id: "environment", label: "非生物环境", x: -95, y: 120, type: "factor", hint: "阳光、水、空气、土壤等。" }
      ],
      flows: [["producer", "primary"], ["primary", "secondary"], ["producer", "decomposer"], ["secondary", "decomposer"], ["decomposer", "environment"], ["environment", "producer"]],
      steps: [
        { name: "组成成分", focus: "生态系统包括生物部分和非生物部分。", active: ["producer", "primary", "secondary", "decomposer", "environment"] },
        { name: "食物链方向", focus: "食物链从生产者开始，箭头表示物质和能量流动方向。", active: ["producer", "primary", "secondary"] },
        { name: "生态平衡", focus: "各成分相互联系，任何一环变化都会影响整体。", active: ["decomposer", "environment"] }
      ],
      task: "点击食物链通常开始的成分。",
      correct: ["producer"],
      exam: [
        { q: "食物链通常从生产者开始。", a: true, ok: "对。绿色植物是常见生产者。", bad: "食物链起点通常是生产者。" },
        { q: "分解者在生态系统中没有作用。", a: false, ok: "对。分解者能促进物质循环。", bad: "分解者非常关键。" }
      ]
    },
    j8b_m08: {
      title: "生物多样性保护",
      theme: "conservation",
      accent: "#10b981",
      goal: "比较就地保护、迁地保护和法制管理。",
      nodes: [
        { id: "habitat", label: "栖息地", x: -185, y: -80, type: "habitat", hint: "保护栖息地是保护多样性的核心。" },
        { id: "inSitu", label: "就地保护", x: 0, y: -120, type: "shield", hint: "建立自然保护区是主要形式。" },
        { id: "exSitu", label: "迁地保护", x: 185, y: -80, type: "shield", hint: "如动物园、植物园、种质库。" },
        { id: "law", label: "法律保护", x: -90, y: 115, type: "value", hint: "依法保护野生动植物和生态环境。" },
        { id: "public", label: "公众参与", x: 105, y: 115, type: "organism", hint: "减少破坏和非法交易。" }
      ],
      flows: [["habitat", "inSitu"], ["inSitu", "law"], ["exSitu", "law"], ["law", "public"]],
      steps: [
        { name: "就地保护", focus: "保护对象和栖息地一起保护，效果最根本。", active: ["habitat", "inSitu"] },
        { name: "迁地保护", focus: "当原地难以保护时，可迁到人工环境。", active: ["exSitu"] },
        { name: "综合措施", focus: "法律和公众参与共同支撑保护。", active: ["law", "public"] }
      ],
      task: "点击保护生物多样性最有效的基本措施。",
      correct: ["inSitu", "habitat"],
      exam: [
        { q: "建立自然保护区属于就地保护。", a: true, ok: "对。就地保护是重要而有效的措施。", bad: "自然保护区对应就地保护。" },
        { q: "保护多样性只需要把动物迁入动物园。", a: false, ok: "对。迁地保护只是补充措施。", bad: "就地保护更根本。" }
      ]
    },
    j8b_m09: {
      title: "生态安全与可持续发展",
      theme: "sustainability",
      accent: "#14b8a6",
      goal: "把污染、人类活动、生态安全和可持续发展联系起来。",
      nodes: [
        { id: "pollution", label: "环境污染", x: -185, y: -78, type: "danger", hint: "水污染、大气污染、土壤污染会影响生态安全。" },
        { id: "resource", label: "资源消耗", x: 0, y: -120, type: "factor", hint: "过度消耗会降低生态系统承载能力。" },
        { id: "security", label: "生态安全", x: 185, y: -78, type: "shield", hint: "关系到人类生存与发展基础。" },
        { id: "action", label: "绿色行动", x: -92, y: 115, type: "value", hint: "节能减排、垃圾分类、保护栖息地。" },
        { id: "future", label: "可持续发展", x: 105, y: 115, type: "target", hint: "既满足当代需要，又不损害后代发展。" }
      ],
      flows: [["pollution", "security"], ["resource", "security"], ["action", "future"], ["security", "future"]],
      steps: [
        { name: "识别风险", focus: "污染和过度开发会威胁生态安全。", active: ["pollution", "resource"] },
        { name: "守住安全", focus: "生态安全是持续发展的基础。", active: ["security"] },
        { name: "可持续行动", focus: "用绿色行动减少对生态系统的压力。", active: ["action", "future"] }
      ],
      task: "点击有助于实现可持续发展的行动或目标。",
      correct: ["action", "future"],
      exam: [
        { q: "可持续发展要兼顾当代人与后代人的发展需要。", a: true, ok: "对。这是可持续发展的核心思想。", bad: "可持续发展不是只看眼前利益。" },
        { q: "生态安全与人类生活没有关系。", a: false, ok: "对。生态安全直接关系到人类生存发展。", bad: "生态安全与人类密切相关。" }
      ]
    }
  };

  const NODE_COLORS = {
    organism: "#34d399",
    factor: "#60a5fa",
    habitat: "#22c55e",
    gland: "#22d3ee",
    flow: "#67e8f9",
    target: "#fbbf24",
    danger: "#fb7185",
    shield: "#38bdf8",
    plant: "#34d399",
    animal: "#f59e0b",
    behavior: "#a78bfa",
    structure: "#60a5fa",
    micro: "#a78bfa",
    dna: "#38bdf8",
    process: "#fbbf24",
    fungi: "#f472b6",
    virus: "#fb7185",
    rank: "#2dd4bf",
    value: "#facc15",
    variation: "#c084fc",
    evidence: "#fcd34d",
    flower: "#fb7185"
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }

  function makeScene(cardId) {
    return {
      mount(container, context) {
        const data = CARD_DATA[cardId];
        if (!data || !container) return;

        const panel = context && context.externalPanel ? context.externalPanel : null;
        const sceneId = "junior-commercial-" + cardId + "-" + Math.random().toString(36).slice(2, 8);
        const abort = typeof AbortController !== "undefined" ? new AbortController() : null;
        const signal = abort ? abort.signal : undefined;
        let W = 0;
        let H = 0;
        let dpr = 1;
        let raf = 0;
        let destroyed = false;
        let stepIndex = 0;
        let selected = new Set();
        let feedback = "先观察模拟框，再点击结构完成任务。";
        let examIndex = 0;
        let examFeedback = "";
        let pointer = null;
        let view = { x: 0, y: 0, scale: 1 };

        container.innerHTML = '<canvas aria-label="' + escapeHtml(data.title) + '交互模拟"></canvas>';
        container.setAttribute("data-scope", sceneId);

        const canvas = container.querySelector("canvas");
        const ctx = canvas.getContext("2d");

        const style = document.createElement("style");
        style.textContent = `
          [data-scope="${sceneId}"] {
            width: 100%;
            height: 100%;
            position: relative;
            overflow: hidden;
            background: radial-gradient(circle at 50% 48%, rgba(13,148,136,0.22), rgba(2,6,23,0.96) 68%);
            touch-action: none;
            color: #ecfeff;
            font-family: "Microsoft YaHei UI", "PingFang SC", "Inter", sans-serif;
          }
          [data-scope="${sceneId}"] canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; touch-action: none; }
          .panel-${sceneId} {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 10px;
            overflow-y: auto;
            overflow-x: hidden;
            scrollbar-width: none;
            color: #e5f7ff;
            font-family: "Microsoft YaHei UI", "PingFang SC", "Inter", sans-serif;
          }
          .panel-${sceneId}::-webkit-scrollbar { display: none; }
          .panel-${sceneId} * { box-sizing: border-box; }
          .panel-${sceneId} .op-card {
            border: 1px solid rgba(148,163,184,0.16);
            border-radius: 8px;
            background: rgba(8,20,33,0.72);
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
            padding: 10px;
            display: grid;
            gap: 8px;
          }
          .panel-${sceneId} .head-line { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
          .panel-${sceneId} .kicker { color: ${data.accent}; font-size: 11px; font-weight: 900; line-height: 1.2; letter-spacing: 0.12em; }
          .panel-${sceneId} .title { color: #f8fafc; font-size: 18px; font-weight: 900; line-height: 1.22; }
          .panel-${sceneId} .goal { color: rgba(226,232,240,0.88); font-size: 12px; line-height: 1.55; font-weight: 750; }
          .panel-${sceneId} .pill { flex: 0 0 auto; border: 1px solid rgba(45,212,191,0.22); border-radius: 999px; padding: 5px 8px; color: #a7f3d0; background: rgba(20,184,166,0.13); font-size: 11px; font-weight: 900; white-space: nowrap; }
          .panel-${sceneId} .step-grid { display: grid; grid-template-columns: repeat(${Math.min(3, data.steps.length)}, minmax(0, 1fr)); gap: 6px; }
          .panel-${sceneId} button {
            appearance: none;
            -webkit-tap-highlight-color: transparent;
            min-height: var(--bio-touch-target, 44px);
            border: 1px solid rgba(148,163,184,0.17);
            border-radius: 8px;
            background: rgba(15,23,42,0.76);
            color: #dff7ff;
            padding: 7px 8px;
            font-size: 12px;
            line-height: 1.2;
            font-weight: 900;
            cursor: pointer;
            transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease;
          }
          .panel-${sceneId} button:hover { transform: translateY(-1px); border-color: rgba(103,232,249,0.4); }
          .panel-${sceneId} button:active { transform: translateY(0); }
          .panel-${sceneId} button.active { color: #042f2e; background: linear-gradient(135deg, ${data.accent}, #67e8f9); border-color: rgba(103,232,249,0.58); }
          .panel-${sceneId} button.primary { color: #031b22; background: linear-gradient(135deg, ${data.accent}, #2dd4bf); border-color: rgba(103,232,249,0.6); }
          .panel-${sceneId} button.warn { color: #221305; background: linear-gradient(135deg, #fcd34d, #fb923c); border-color: rgba(251,191,36,0.64); }
          .panel-${sceneId} .focus { border-radius: 8px; border: 1px solid rgba(103,232,249,0.15); background: rgba(8,47,73,0.34); color: #bae6fd; padding: 8px 9px; font-size: 12px; line-height: 1.52; font-weight: 900; }
          .panel-${sceneId} .feedback { min-height: 36px; border-radius: 8px; border: 1px solid rgba(103,232,249,0.16); background: rgba(2,6,23,0.34); color: rgba(224,242,254,0.94); padding: 8px 9px; font-size: 12px; line-height: 1.5; font-weight: 800; }
          .panel-${sceneId} .action-row { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 6px; }
          .panel-${sceneId} .selected-list { display: flex; flex-wrap: wrap; gap: 5px; min-height: 25px; }
          .panel-${sceneId} .chip { border-radius: 999px; border: 1px solid rgba(148,163,184,0.18); background: rgba(15,23,42,0.62); color: #e0f2fe; padding: 5px 8px; font-size: 11px; font-weight: 900; }
          .panel-${sceneId} .exam-q { color: rgba(241,245,249,0.96); font-size: 12px; line-height: 1.5; font-weight: 900; }
          .panel-${sceneId} .exam-actions { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 6px; }
          .panel-${sceneId} .exam-feedback { min-height: 18px; color: #fde68a; font-size: 12px; line-height: 1.45; font-weight: 800; }
          .panel-${sceneId}[data-size="compact"] { gap: 6px; padding: 8px; }
          .panel-${sceneId}[data-size="compact"] .op-card { padding: 8px; gap: 6px; }
          .panel-${sceneId}[data-size="compact"] .title { font-size: 15px; }
          .panel-${sceneId}[data-size="compact"] .goal, .panel-${sceneId}[data-size="compact"] .exam-feedback { display: none; }
          .panel-${sceneId}[data-size="micro"] .goal,
          .panel-${sceneId}[data-size="micro"] .exam-feedback,
          .panel-${sceneId}[data-size="micro"] .selected-list { display: none; }
          .panel-${sceneId}[data-size="micro"] button { min-height: 40px; font-size: 11px; padding: 6px; }
        `;
        document.head.appendChild(style);

        function activeSet() {
          const step = data.steps[stepIndex] || data.steps[0];
          return new Set(step.active || []);
        }

        function labels(ids) {
          return ids.map(id => (data.nodes.find(node => node.id === id) || {}).label || id);
        }

        function renderPanel() {
          if (!panel) return;
          const step = data.steps[stepIndex] || data.steps[0];
          const exam = data.exam[examIndex] || data.exam[0];
          const selectedLabels = labels(Array.from(selected));
          panel.innerHTML = `
            <div class="panel-${sceneId}" data-role="panel">
              <div class="op-card">
                <div class="head-line">
                  <div>
                    <div class="kicker">初中生物交互课件</div>
                    <div class="title">${escapeHtml(data.title)}</div>
                  </div>
                  <div class="pill">${stepIndex + 1} / ${data.steps.length}</div>
                </div>
                <div class="goal">${escapeHtml(data.goal)}</div>
                <div class="step-grid">
                  ${data.steps.map((item, index) => `<button type="button" data-action="step" data-value="${index}" class="${index === stepIndex ? "active" : ""}">${escapeHtml(item.name)}</button>`).join("")}
                </div>
              </div>
              <div class="op-card">
                <div class="kicker">观察任务</div>
                <div class="focus">${escapeHtml(step.focus)}</div>
                <div class="feedback">${escapeHtml(feedback)}</div>
                <div class="selected-list">
                  ${selectedLabels.length ? selectedLabels.map(label => `<span class="chip">${escapeHtml(label)}</span>`).join("") : '<span class="chip">尚未选择</span>'}
                </div>
                <div class="action-row">
                  <button type="button" class="primary" data-action="check">检查选择</button>
                  <button type="button" data-action="clear">清空重选</button>
                </div>
              </div>
              <div class="op-card">
                <div class="kicker">考点判定</div>
                <div class="exam-q">${escapeHtml(exam.q)}</div>
                <div class="exam-actions">
                  <button type="button" data-action="exam" data-value="true">正确</button>
                  <button type="button" data-action="exam" data-value="false">错误</button>
                  <button type="button" data-action="next-exam">换题</button>
                </div>
                <div class="exam-feedback">${escapeHtml(examFeedback)}</div>
              </div>
            </div>
          `;
          bindPanel();
          fitPanel();
        }

        function bindPanel() {
          if (!panel) return;
          panel.querySelectorAll("button[data-action]").forEach(button => {
            button.addEventListener("click", event => {
              const action = event.currentTarget.getAttribute("data-action");
              const value = event.currentTarget.getAttribute("data-value");
              if (action === "step") {
                stepIndex = Number(value);
                feedback = (data.steps[stepIndex] || data.steps[0]).focus;
                selected.clear();
                renderPanel();
              } else if (action === "check") {
                const correct = new Set(data.correct || []);
                const ok = selected.size === correct.size && Array.from(correct).every(id => selected.has(id));
                feedback = ok
                  ? "选择正确：你已经抓住本课核心考点。"
                  : "还需要调整：对照任务，只选择真正符合条件的结构或过程。";
                renderPanel();
              } else if (action === "clear") {
                selected.clear();
                feedback = "已清空。请重新点击模拟框中的目标。";
                renderPanel();
              } else if (action === "exam") {
                const currentExam = data.exam[examIndex] || data.exam[0];
                const ok = (value === "true") === currentExam.a;
                examFeedback = ok ? currentExam.ok : currentExam.bad;
                renderPanel();
              } else if (action === "next-exam") {
                examIndex = (examIndex + 1) % data.exam.length;
                examFeedback = "";
                renderPanel();
              }
            }, signal ? { signal } : undefined);
          });
        }

        function fitPanel() {
          if (!panel) return;
          const root = panel.querySelector('[data-role="panel"]');
          if (!root) return;
          const rect = panel.getBoundingClientRect();
          let size = "normal";
          if (rect.height < 600 || rect.width < 320) size = "compact";
          if (rect.height < 470 || rect.width < 270) size = "micro";
          root.setAttribute("data-size", size);
        }

        function resize() {
          const rect = container.getBoundingClientRect();
          W = Math.max(1, rect.width);
          H = Math.max(1, rect.height);
          dpr = Math.min(window.devicePixelRatio || 1, 2);
          canvas.width = Math.round(W * dpr);
          canvas.height = Math.round(H * dpr);
          canvas.style.width = W + "px";
          canvas.style.height = H + "px";
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          view.scale = clamp(Math.min((W - 42) / 720, (H - 38) / 460), 0.46, 1.18);
          view.x = W / 2;
          view.y = H / 2 + (H < 420 ? 8 : 14);
          fitPanel();
        }

        function toWorld(event) {
          const rect = canvas.getBoundingClientRect();
          return {
            x: (event.clientX - rect.left - view.x) / view.scale,
            y: (event.clientY - rect.top - view.y) / view.scale
          };
        }

        function hitNode(point) {
          for (let i = data.nodes.length - 1; i >= 0; i -= 1) {
            const node = data.nodes[i];
            const radius = 48;
            if (Math.hypot(point.x - node.x, point.y - node.y) <= radius) return node;
          }
          return null;
        }

        function pointerDown(event) {
          const point = toWorld(event);
          const node = hitNode(point);
          if (!node) {
            pointer = null;
            return;
          }
          pointer = node.id;
          if (selected.has(node.id)) selected.delete(node.id);
          else selected.add(node.id);
          feedback = node.hint || "已选择：" + node.label;
          renderPanel();
          event.preventDefault();
        }

        function drawBackground(time) {
          const grad = ctx.createRadialGradient(W * 0.5, H * 0.45, 20, W * 0.5, H * 0.5, Math.max(W, H) * 0.72);
          grad.addColorStop(0, "rgba(15,118,110,0.46)");
          grad.addColorStop(0.48, "rgba(15,35,54,0.95)");
          grad.addColorStop(1, "#020617");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, W, H);

          ctx.save();
          ctx.globalAlpha = 0.16;
          ctx.strokeStyle = data.accent;
          ctx.lineWidth = 1;
          const gap = 58;
          for (let x = -W; x < W * 1.4; x += gap) {
            ctx.beginPath();
            ctx.moveTo(x + (time * 7) % gap, 0);
            ctx.lineTo(x + 140 + (time * 7) % gap, H);
            ctx.stroke();
          }
          ctx.restore();

          ctx.save();
          ctx.strokeStyle = "rgba(103,232,249,0.14)";
          ctx.lineWidth = 1;
          roundRect(ctx, 18, 18, W - 36, H - 36, 18);
          ctx.stroke();
          ctx.restore();
        }

        function drawArrow(from, to, active, time) {
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const len = Math.max(1, Math.hypot(dx, dy));
          const ux = dx / len;
          const uy = dy / len;
          const sx = from.x + ux * 52;
          const sy = from.y + uy * 52;
          const ex = to.x - ux * 52;
          const ey = to.y - uy * 52;
          ctx.save();
          ctx.strokeStyle = active ? data.accent : "rgba(148,163,184,0.2)";
          ctx.fillStyle = active ? data.accent : "rgba(148,163,184,0.25)";
          ctx.globalAlpha = active ? 0.9 : 0.62;
          ctx.lineWidth = active ? 4 : 2;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(ex, ey);
          ctx.stroke();
          const pulse = active ? ((time * 0.8) % 1) : 0;
          if (active) {
            const px = sx + (ex - sx) * pulse;
            const py = sy + (ey - sy) * pulse;
            ctx.beginPath();
            ctx.arc(px, py, 5, 0, Math.PI * 2);
            ctx.fill();
          }
          const angle = Math.atan2(ey - sy, ex - sx);
          ctx.translate(ex, ey);
          ctx.rotate(angle);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-12, -7);
          ctx.lineTo(-12, 7);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        function drawIcon(node, active, chosen, time) {
          const color = NODE_COLORS[node.type] || data.accent;
          ctx.save();
          ctx.translate(node.x, node.y);
          ctx.shadowColor = active || chosen ? color : "transparent";
          ctx.shadowBlur = active || chosen ? 22 : 0;
          ctx.fillStyle = chosen ? color : active ? "rgba(15,23,42,0.96)" : "rgba(15,23,42,0.72)";
          ctx.strokeStyle = chosen ? "rgba(255,255,255,0.78)" : active ? color : "rgba(148,163,184,0.34)";
          ctx.lineWidth = active || chosen ? 4 : 2;
          ctx.beginPath();
          ctx.arc(0, 0, 43, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.shadowBlur = 0;
          ctx.strokeStyle = chosen ? "#06201d" : color;
          ctx.fillStyle = chosen ? "#06201d" : color;
          ctx.lineWidth = 4;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          const wobble = Math.sin(time * 1.8 + node.x * 0.01) * 2;
          if (["dna", "variation"].includes(node.type)) {
            ctx.beginPath();
            ctx.moveTo(-13, -22);
            ctx.bezierCurveTo(18, -8, -18, 8, 13, 22);
            ctx.moveTo(13, -22);
            ctx.bezierCurveTo(-18, -8, 18, 8, -13, 22);
            ctx.stroke();
            for (let y = -14; y <= 14; y += 14) {
              ctx.beginPath();
              ctx.moveTo(-10, y);
              ctx.lineTo(10, y);
              ctx.stroke();
            }
          } else if (["plant", "flower"].includes(node.type)) {
            ctx.beginPath();
            ctx.moveTo(0, 22);
            ctx.quadraticCurveTo(3 + wobble, 2, 0, -20);
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(-10, -8, 14, 8, -0.7, 0, Math.PI * 2);
            ctx.ellipse(12, -2, 14, 8, 0.7, 0, Math.PI * 2);
            ctx.fill();
          } else if (["animal", "organism", "target"].includes(node.type)) {
            ctx.beginPath();
            ctx.arc(0, -10, 12, 0, Math.PI * 2);
            ctx.moveTo(-18, 20);
            ctx.quadraticCurveTo(0, 1, 18, 20);
            ctx.stroke();
          } else if (["shield"].includes(node.type)) {
            ctx.beginPath();
            ctx.moveTo(0, -24);
            ctx.lineTo(21, -13);
            ctx.quadraticCurveTo(18, 14, 0, 24);
            ctx.quadraticCurveTo(-18, 14, -21, -13);
            ctx.closePath();
            ctx.stroke();
          } else if (["danger", "virus"].includes(node.type)) {
            ctx.beginPath();
            ctx.arc(0, 0, 17, 0, Math.PI * 2);
            ctx.stroke();
            for (let i = 0; i < 8; i += 1) {
              const a = (i / 8) * Math.PI * 2;
              ctx.beginPath();
              ctx.moveTo(Math.cos(a) * 19, Math.sin(a) * 19);
              ctx.lineTo(Math.cos(a) * 28, Math.sin(a) * 28);
              ctx.stroke();
            }
          } else if (["rank", "value", "factor", "flow", "process", "evidence"].includes(node.type)) {
            roundRect(ctx, -21, -18, 42, 36, 8);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-11, 0);
            ctx.lineTo(10, 0);
            ctx.moveTo(4, -7);
            ctx.lineTo(12, 0);
            ctx.lineTo(4, 7);
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(-7, -5, 4, 0, Math.PI * 2);
            ctx.arc(8, 6, 5, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.fillStyle = "#f8fafc";
          ctx.font = "900 15px Microsoft YaHei UI, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          const textY = 52;
          const labelWidth = Math.min(112, Math.max(58, ctx.measureText(node.label).width + 22));
          roundRect(ctx, -labelWidth / 2, textY - 5, labelWidth, 28, 8);
          ctx.fillStyle = "rgba(2,6,23,0.6)";
          ctx.strokeStyle = active || chosen ? color : "rgba(103,232,249,0.16)";
          ctx.lineWidth = 1;
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#f8fafc";
          ctx.fillText(node.label, 0, textY);
          ctx.restore();
        }

        function drawScene(time) {
          drawBackground(time);
          ctx.save();
          ctx.translate(view.x, view.y);
          ctx.scale(view.scale, view.scale);

          const active = activeSet();
          data.flows.forEach(pair => {
            const from = data.nodes.find(node => node.id === pair[0]);
            const to = data.nodes.find(node => node.id === pair[1]);
            if (from && to) drawArrow(from, to, active.has(from.id) || active.has(to.id), time);
          });

          data.nodes.forEach(node => {
            drawIcon(node, active.has(node.id), selected.has(node.id), time);
          });

          ctx.restore();
        }

        function animate(now) {
          if (destroyed) return;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, W, H);
          drawScene(now / 1000);
          raf = requestAnimationFrame(animate);
        }

        function destroy() {
          if (destroyed) return;
          destroyed = true;
          if (raf) cancelAnimationFrame(raf);
          if (abort) abort.abort();
          style.remove();
          if (panel) panel.innerHTML = "";
          container.innerHTML = "";
        }

        window.addEventListener("resize", resize, signal ? { signal } : undefined);
        canvas.addEventListener("pointerdown", pointerDown, signal ? { signal } : undefined);

        if (typeof ResizeObserver !== "undefined") {
          const ro = new ResizeObserver(resize);
          ro.observe(container);
          if (panel) ro.observe(panel);
          signal && signal.addEventListener("abort", () => ro.disconnect(), { once: true });
        }

        const mo = new MutationObserver(() => {
          if (!document.body.contains(container)) {
            mo.disconnect();
            destroy();
          }
        });
        mo.observe(document.body, { childList: true, subtree: true });
        signal && signal.addEventListener("abort", () => mo.disconnect(), { once: true });

        resize();
        renderPanel();
        raf = requestAnimationFrame(animate);
      }
    };
  }

  Object.keys(CARD_DATA).forEach(cardId => {
    window.BIO_VISUAL_SCENES[cardId] = makeScene(cardId);
  });
})();
