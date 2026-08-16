/* ============================================================
   国家战略资源安全图谱 · 3D 交互课件
   高中地理 · 选择性必修 3《资源、环境与国家安全》
   纯离线单文件：three.js 3D 地球 + 资源航线动画 + 风险推演
   ============================================================ */
(function () {
'use strict';

var $ = function (id) { return document.getElementById(id); };
function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

/* ==================== 一、补间动画系统 ==================== */
var tweens = [];
function tween(cfg) { cfg.t = 0; tweens.push(cfg); }
function updateTweens(dt) {
  for (var i = tweens.length - 1; i >= 0; i--) {
    var tw = tweens[i];
    tw.t += dt;
    var k = clamp(tw.t / (tw.dur || 1), 0, 1);
    var e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    tw.update(e);
    if (k >= 1) { tweens.splice(i, 1); if (tw.complete) tw.complete(); }
  }
}

/* ==================== 二、教学数据 ==================== */
var CHINA = { lat: 34.5, lon: 104 };

/* 资源入境口岸：海运抵港、管道入关，按来源国分流（地理真实性） */
var ENTRY_PORTS = {
  oil: { def: [29.9, 122.2, '宁波舟山港'], byCountry: { 'Russia': [46.6, 125, '大庆 · 中俄管道'] } },
  gas: {
    def: [22.6, 114.3, '大鹏 LNG 接收站'],
    byCountry: {
      'Turkmenistan': [45.6, 82.6, '阿拉山口'], 'Kazakhstan': [45.6, 82.6, '阿拉山口'],
      'Russia': [53.5, 122, '漠河 · 中俄东线'], 'Myanmar': [24, 97.8, '瑞丽']
    }
  },
  iron: { def: [36, 120.3, '青岛港'], byCountry: {} },
  copper: { def: [31.2, 121.5, '上海港'], byCountry: { 'Kazakhstan': [45.6, 82.6, '阿拉山口'], 'Mongolia': [43.6, 112, '二连浩特'] } },
  soybean: { def: [38.9, 121.6, '大连港'], byCountry: {} }
};

/* 六大战略资源：dep = 对外依存度（约值，2023 教学口径）
   sources: [国家名(与 WORLD_GEO 一致), 代表点 lat, lon, 份额%, 说明] */
var RESOURCES = {
  oil: {
    name: '石油', icon: '🛢️', color: 0xffc233, css: '#ffc233',
    dep: 72, depText: '72%', unit: '对外依存度',
    kpi: [['5.6 亿吨', '年进口量'], ['第 1 位', '全球进口排名']],
    sources: [
      ['Saudi Arabia', 21.8, 44.2, 17, '中东最大供应国'],
      ['Russia', 57, 65, 16, '管道 + 海运双通道'],
      ['Iraq', 33, 44, 10, '波斯湾油轮'],
      ['Angola', -8.8, 13.2, 7, '非洲主力油源'],
      ['Oman', 21, 57, 7, '霍尔木兹海峡外'],
      ['United Arab Emirates', 24, 54, 6, '阿布扎比原油'],
      ['Brazil', -10, -52, 5, '深海盐下油田'],
      ['Kuwait', 29.3, 47.9, 4, '老牌海湾油国'],
      ['Colombia', 4, -73, 3, '拉美新兴油源']
    ],
    teach: '石油是工业的血液。我国是最大进口国，超七成依赖海外，且 80% 走马六甲——供给与通道"双重集中"。',
    risk: '中东地缘冲突、马六甲困局、油价剧烈波动'
  },
  gas: {
    name: '天然气', icon: '🔥', color: 0x38e0ff, css: '#38e0ff',
    dep: 42, depText: '42%', unit: '对外依存度',
    kpi: [['1600 亿 m³', '年进口量'], ['管道+LNG', '两条腿走路']],
    sources: [
      ['Turkmenistan', 39, 59, 25, '中亚管道气主力'],
      ['Australia', -25, 133, 20, 'LNG 第一大来源'],
      ['Russia', 57, 65, 14, '中俄东线 + LNG'],
      ['Qatar', 25.3, 51.2, 11, '北方气田 LNG'],
      ['Malaysia', 3, 102, 8, '东南亚 LNG'],
      ['Indonesia', -2, 118, 6, '东南亚 LNG'],
      ['Kazakhstan', 48, 66, 6, '中亚管道'],
      ['Myanmar', 19.5, 96, 4, '中缅管道']
    ],
    teach: '天然气是能源转型的"过渡燃料"。管道气（中亚、中俄、中缅）与海上 LNG 并举，进口渠道比石油更分散。',
    risk: '冬季保供压力、LNG 现货价格波动、长输管道安全'
  },
  iron: {
    name: '铁矿石', icon: '⛏️', color: 0xff9a5c, css: '#ff9a5c',
    dep: 80, depText: '约 80%', unit: '对外依存度',
    kpi: [['11 亿吨', '年进口量'], ['62%', '来自澳大利亚']],
    sources: [
      ['Australia', -25, 133, 62, '皮尔巴拉矿区，海运便利'],
      ['Brazil', -10, -52, 21, '淡水河谷高品位矿'],
      ['India', 21, 78, 4, '低品位补充'],
      ['South Africa', -29, 24, 4, '非洲优质矿'],
      ['Ukraine', 49, 31, 2, '球团矿'],
      ['Mauritania', 20, -12, 2, '西非新兴矿区']
    ],
    teach: '钢铁工业的粮食。对外依存约八成，且六成来自澳大利亚一国——"来源高度集中"是最大的软肋。',
    risk: '澳巴双寡头格局、海运价格波动、权益矿不足'
  },
  copper: {
    name: '铜矿', icon: '🔶', color: 0xc58bff, css: '#c58bff',
    dep: 78, depText: '约 78%', unit: '对外依存度',
    kpi: [['1400 万吨', '年进口量'], ['新能源', '需求最快增长']],
    sources: [
      ['Chile', -31, -70, 26, '安第斯铜矿带'],
      ['Peru', -10, -75, 21, '拉美第二铜国'],
      ['Dem. Rep. Congo', -3, 23, 10, '中非铜钴带'],
      ['Zambia', -14, 27, 6, '非洲铜带'],
      ['Kazakhstan', 48, 66, 5, '中亚近邻'],
      ['Mongolia', 46, 105, 4, '陆路直达']
    ],
    teach: '电网、新能源车、光伏都要铜。新能源革命让铜需求暴增，而我国铜矿品位低、储量少，缺口长期存在。',
    risk: '拉美政局变动、非洲物流链长、矿山民族主义'
  },
  soybean: {
    name: '大豆', icon: '🌾', color: 0x9dff6d, css: '#9dff6d',
    dep: 85, depText: '约 85%', unit: '对外依存度',
    kpi: [['1 亿吨', '年进口量'], ['100%', '口粮自给率']],
    sources: [
      ['Brazil', -10, -52, 60, '第一大来源，季节互补'],
      ['United States of America', 39, -95, 28, '密西西比河粮道'],
      ['Argentina', -35, -64, 7, '南美补充'],
      ['Canada', 52, -100, 3, '高蛋白豆']
    ],
    teach: '粮食安全要分清两层：稻谷、小麦"口粮绝对安全"（自给率 100%），大豆才是短板——榨油与饲料需求主要依赖美洲。',
    risk: '美洲两国主导、贸易摩擦、海运与汇率波动'
  },
  rareearth: {
    name: '稀土', icon: '💎', color: 0x6dffb8, css: '#6dffb8',
    dep: 35, depText: '储量占世界约 35%', unit: '优势资源',
    kpi: [['约 70%', '世界产量占比'], ['17 种', '稀土元素族']],
    sources: [
      ['China', 35, 104, 70, '白云鄂博等，产量世界第一'],
      ['Vietnam', 16, 106, 6, '储量世界第二'],
      ['Brazil', -10, -52, 5, '离子型与独居石'],
      ['Russia', 57, 65, 5, '储量丰富'],
      ['India', 21, 78, 2, '海滨砂矿'],
      ['Australia', -25, 133, 2, '莱纳斯矿'],
      ['United States of America', 39, -100, 2, '芒廷帕斯复产']
    ],
    teach: '稀土是"工业维生素"，是我国少有的优势战略资源——安全命题不是"缺"，而是防止贱卖、掌控深加工与定价权。',
    risk: '低端出口惯性、高端应用受制、无序开采'
  }
};

/* 四大油气进口通道 */
var ROUTES = {
  sea: {
    name: '海上通道', sub: '中东 · 非洲 · 拉美 → 马六甲 → 沿海',
    color: 0x38e0ff, css: '#38e0ff',
    pts: [[26.5, 51], [26.5, 56.5], [12, 63], [4, 76], [2.5, 101.3], [9, 110], [16, 114], [25, 119]],
    desc: '承担我国约 4/5 的进口油气：波斯湾 → 霍尔木兹海峡 → 印度洋 → 马六甲海峡 → 南海 → 沿海炼化基地。'
  },
  west: {
    name: '西北通道 · 中亚', sub: '土库曼斯坦 → 哈萨克斯坦 → 阿拉山口',
    color: 0x6dffb8, css: '#6dffb8',
    pts: [[39, 59], [41.5, 62], [45, 67], [47, 74], [45.6, 82.6], [44, 86], [41, 96]],
    desc: '中国—中亚天然气管道 A/B/C 三线，年输气能力数百亿方，是管道气第一大来源；中亚原油管道同向而行。'
  },
  north: {
    name: '东北通道 · 中俄', sub: '东西伯利亚 → 漠河 → 大庆',
    color: 0x6dffb8, css: '#6dffb8',
    pts: [[58, 108], [56, 115], [53.5, 121], [50, 124], [46.6, 125]],
    desc: '中俄原油管道与东线天然气管道，从俄罗斯腹地直供东北，不受海上通道制约，战略意义突出。'
  },
  south: {
    name: '西南通道 · 中缅', sub: '皎漂港 → 瑞丽 → 昆明',
    color: 0x6dffb8, css: '#6dffb8',
    pts: [[19.4, 93.5], [21.5, 95], [24, 97.8], [25, 102.7]],
    desc: '中缅油气管道从中东油轮直抵缅甸皎漂港上岸，绕开马六甲海峡，是破解"马六甲困局"的关键一招。'
  }
};

/* 海上咽喉要道（可点击） */
var CHOKEPOINTS = [
  { key: 'malacca', name: '马六甲海峡', lat: 2.5, lon: 101.3,
    desc: '全球最繁忙水道之一：我国约 80% 进口石油、50% 外贸货物经此而过。一旦受阻，能源与贸易将同时承压——这就是著名的"马六甲困局"。',
    note: '破解之道：中缅管道绕开 + 中亚中俄陆管 + 海军护航 + 储备缓冲。' },
  { key: 'hormuz', name: '霍尔木兹海峡', lat: 26.5, lon: 56.3,
    desc: '波斯湾唯一出海口，全球约 1/5 石油贸易的"阀门"。沙特、伊拉克、科威特、卡塔尔的油轮与 LNG 船全部经此出海。',
    note: '地缘冲突一旦封锁海峡，国际油价将剧烈震荡。' },
  { key: 'suez', name: '苏伊士运河', lat: 30.4, lon: 32.3,
    desc: '联通地中海与红海，欧亚最短航线。2021 年"长赐号"搁浅 6 天，全球贸易每天损失约百亿美元——咽喉之脆弱可见一斑。',
    note: '阻塞时只能绕道好望角，航程增加约 10 天。' },
  { key: 'mandeb', name: '曼德海峡', lat: 12.6, lon: 43.3,
    desc: '红海南大门，苏伊士航线的必经前哨。2023 年底红海危机爆发后，大量商船被迫绕行好望角，运费应声翻倍。',
    note: '与苏伊士构成"串联双咽喉"，一处受阻全链改道。' },
  { key: 'panama', name: '巴拿马运河', lat: 9.1, lon: -79.7,
    desc: '联通太平洋与大西洋，美国大豆、液化天然气运往亚洲的近道。干旱限航时，美湾粮船只能绕道南美或苏伊士。',
    note: '大豆"美西航线"的时效咽喉。' },
  { key: 'cape', name: '好望角', lat: -34.8, lon: 19.9,
    desc: '非洲南端的传统绕航点。苏伊士—红海受阻时的"救生通道"，巴西铁矿石、美湾大豆也常走此线。',
    note: '航程长、风浪大，但胜在不受运河与海峡约束。' }
];

/* 国家石油储备基地（战略对策 · 绿色标记；lo = 标签经纬偏移防重叠） */
var BASES = [
  { name: '舟山基地', lat: 30, lon: 122.2, lo: [-1, 8], desc: '沿海枢纽型储备基地，毗邻宁波—舟山港，接卸大型油轮最便利。' },
  { name: '大连基地', lat: 38.9, lon: 121.6, lo: [9, 6], desc: '东北门户储备基地，衔接中俄原油管道与海运两条来路。' },
  { name: '镇海基地', lat: 29.9, lon: 121.7, lo: [-8, 2], desc: '首批国家石油储备基地之一，紧邻长三角炼化集群。' },
  { name: '黄岛基地', lat: 36, lon: 120.2, lo: [4, 7], desc: '青岛港腹地，服务环渤海与山东地炼产业带。' },
  { name: '独山子基地', lat: 44.3, lon: 84.9, lo: [3, -7], desc: '西北内陆储备基地，直接承接中哈原油管道来油。' },
  { name: '兰州基地', lat: 36, lon: 103.8, lo: [-5, -6], desc: '西部管网枢纽，辐射陕甘宁青新的内陆调蓄中心。' },
  { name: '天津基地', lat: 39, lon: 117.2, lo: [7, 11], desc: '环渤海储备节点，保障首都圈能源安全。' }
];

/* 安全对策四支柱 */
var PILLARS = {
  diversify: {
    name: '① 进口多元化', sub: '不把鸡蛋放进一个篮子',
    desc: '同一资源布局多个来源国与多条通道：石油横跨中东、俄罗斯、非洲、拉美四大板块；天然气管道气与 LNG 并举。来源越分散，抗冲击能力越强。'
  },
  reserve: {
    name: '② 战略储备', sub: '手中有粮，心中不慌',
    desc: '国家石油储备基地分三期建设，目标达到国际通行的 90 天净进口量安全线；粮食、稀有金属同步建立政府储备与企业商业储备双体系。'
  },
  save: {
    name: '③ 节约与替代', sub: '需求侧的革命',
    desc: '新能源汽车替代汽油消费、光伏风电替代油气发电、废钢与再生铜循环利用——既降碳，又从根本上降低对外依存。'
  },
  cooperate: {
    name: '④ 国际合作', sub: '把通道变成共赢之路',
    desc: '共建"一带一路"能源伙伴关系：中亚管道、中缅管道、中俄东线都是"建在别人国土上的安全资产"——利益绑定越深，通道越稳固。'
  }
};

/* 风险推演情景 */
var SCENARIOS = {
  malacca: {
    name: '⚠️ 情景一：马六甲海峡受阻', sub: '80% 进口石油的海上咽喉',
    redRoutes: ['sea'], redPoints: [{ lat: 2.5, lon: 101.3, label: '马六甲受阻' }],
    redCountries: [], greenRoutes: ['west', 'north', 'south'], greenCountries: ['Russia', 'Turkmenistan', 'Myanmar', 'Kazakhstan'],
    caption: '海上生命线被卡 → 三大陆路管道顶上来：<b>中亚、中俄、中缅</b>管道构成"陆上突围"的备份系统。',
    desc: '冲击：约 4/5 进口油气通道中断。破局：中缅管道绕开马六甲直抵昆明；中亚、中俄管道全在陆上；配合战略储备可赢得 90 天缓冲。'
  },
  hormuz: {
    name: '⚠️ 情景二：霍尔木兹危机', sub: '波斯湾油气出海的唯一阀门',
    redRoutes: ['sea'], redPoints: [{ lat: 26.5, lon: 56.3, label: '海峡危机' }],
    redCountries: ['Saudi Arabia', 'Iraq', 'Kuwait', 'United Arab Emirates', 'Qatar', 'Iran'],
    greenRoutes: ['west', 'north'], greenCountries: ['Russia', 'Angola', 'Brazil', 'Kazakhstan', 'Turkmenistan'],
    caption: '波斯湾六国供给受阻（约占进口 4 成）→ <b>俄罗斯、中亚、非洲、拉美</b>成为稳定器。',
    desc: '冲击：海湾产油国集体断供，国际油价飙升。破局：俄油管道+非洲拉美海运（不经霍尔木兹）+ 释放储备平抑油价。'
  },
  ironcut: {
    name: '⚠️ 情景三：铁矿石极端断供', sub: '一国独占六成来源的假设推演',
    redRoutes: [], redPoints: [{ lat: -25, lon: 133, label: '澳矿断供' }],
    redCountries: ['Australia'],
    greenRoutes: [], greenCountries: ['Brazil', 'India', 'South Africa', 'Mauritania', 'Ukraine'],
    caption: '来源高度集中 = 把命门交给别人 → 破局靠<b>多元来源 + 权益矿 + 废钢循环</b>。',
    desc: '冲击：62% 进口矿骤停，钢铁链承压。破局：巴西、印度、南非、西非增产补位；海外权益矿"自己的矿保自己"；废钢短流程炼钢降低原生矿需求。'
  }
};

var MODE_DESC = {
  resources: '战略资源"家底"盘点：我国哪些资源高度依赖进口？来自哪些国家？点击资源卡片，看来源国在地球上亮起、要素流向中国。',
  routes: '资源要从产地运回来。四大油气进口通道 + 海上咽喉要道：点击红色标记，认识每一处可能"卡脖子"的海峡与运河。',
  strategy: '资源安全的四根支柱：进口多元化、战略储备、节约替代、国际合作。点击绿色标记，看国家石油储备基地布局。',
  scenario: '如果最坏的情况发生？选择情景进行沙盘推演：红色为受冲击环节，绿色为备用方案——理解对策如何对冲风险。'
};

/* 课堂小测 */
var QUIZ = [
  {
    q: '我国石油安全面临的最突出问题是？',
    opts: ['国内完全没有石油资源', '对外依存度高且进口通道集中', '石油消费量太小', '石油价格过于便宜'],
    ans: 1,
    exp: '我国石油对外依存度约 72%，且约 80% 进口石油经马六甲海峡——供给集中 + 通道集中，是"双重风险"。'
  },
  {
    q: '破解"马六甲困局"的关键工程是？',
    opts: ['京杭大运河', '中缅油气管道', '南水北调工程', '西电东送工程'],
    ans: 1,
    exp: '中缅油气管道从中东油轮直抵缅甸皎漂港上岸，经瑞丽入境昆明，绕开马六甲海峡。'
  },
  {
    q: '关于我国粮食安全，说法正确的是？',
    opts: ['所有粮食品种都高度依赖进口', '口粮绝对安全，大豆是主要短板', '粮食安全与资源安全无关', '大豆自给率达到 100%'],
    ans: 1,
    exp: '稻谷、小麦等口粮自给率 100%，绝对安全；大豆对外依存约 85%，是粮食安全的主要短板。'
  },
  {
    q: '稀土对我国的资源安全意义在于？',
    opts: ['我国稀土稀缺，必须大量进口', '稀土是优势资源，重点是防贱卖、强加工、掌定价', '稀土与高科技产业无关', '稀土储量占世界不足 1%'],
    ans: 1,
    exp: '稀土是我国优势战略资源（储量约 35%、产量约 70%），安全命题是"保护性开发 + 高端应用 + 定价权"，而非"缺资源"。'
  },
  {
    q: '保障国家资源安全的根本之策组合是？',
    opts: ['完全禁止资源进口', '进口多元化 + 战略储备 + 节约替代 + 国际合作', '只依靠提高国内产量', '把资源全部囤积不用'],
    ans: 1,
    exp: '资源安全四支柱：来源与通道多元（分散风险）、战略储备（缓冲冲击）、节约替代（降低需求）、国际合作（稳固通道）。'
  }
];

window.__RES_DATA__ = { RESOURCES: RESOURCES }; /* 调试出口 */

/* ==================== 三、3D 场景 ==================== */
var wrap = $('canvasWrap');
var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(wrap.clientWidth, wrap.clientHeight);
wrap.appendChild(renderer.domElement);

var scene = new THREE.Scene();
scene.background = new THREE.Color(0x04081a);

var camera = new THREE.PerspectiveCamera(45, wrap.clientWidth / wrap.clientHeight, 0.01, 100);
camera.position.set(0, 0.55, 3.35);

var controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 1.7;
controls.maxDistance = 7;
controls.enablePan = false;
controls.target.set(0, 0, 0);

var composer = null, bloomPass = null;
if (THREE.EffectComposer && THREE.UnrealBloomPass) {
  composer = new THREE.EffectComposer(renderer);
  composer.addPass(new THREE.RenderPass(scene, camera));
  bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(wrap.clientWidth, wrap.clientHeight), 0.32, 0.28, 0.72
  );
  composer.addPass(bloomPass);
}

scene.add(new THREE.AmbientLight(0x8899cc, 0.9));
var dirLight = new THREE.DirectionalLight(0xffffff, 0.55);
dirLight.position.set(3, 4, 3);
scene.add(dirLight);

/* 星空背景 */
(function stars() {
  var g = new THREE.BufferGeometry();
  var n = 1400, pos = new Float32Array(n * 3);
  for (var i = 0; i < n; i++) {
    var r = 24 + Math.random() * 40;
    var th = Math.random() * Math.PI * 2, ph = Math.random() * Math.PI;
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.cos(ph);
    pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
  }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  var starPts = new THREE.Points(g, new THREE.PointsMaterial({ color: 0x99bbee, size: 0.07, transparent: true, opacity: 0.7 }));
  scene.add(starPts);
})();

/* ==================== 四、贴图与坐标工具 ==================== */
function glowTexture(inner, outer) {
  var c = document.createElement('canvas'); c.width = c.height = 128;
  var ctx = c.getContext('2d');
  var g = ctx.createRadialGradient(64, 64, 2, 64, 64, 64);
  g.addColorStop(0, inner);
  g.addColorStop(0.35, outer);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
var TEX = {
  glowWarm: glowTexture('rgba(255,235,180,1)', 'rgba(255,160,60,0.45)'),
  glowCyan: glowTexture('rgba(190,245,255,1)', 'rgba(56,200,255,0.4)'),
  glowPurple: glowTexture('rgba(235,215,255,1)', 'rgba(170,110,255,0.4)'),
  glowGold: glowTexture('rgba(255,240,200,1)', 'rgba(255,194,51,0.45)'),
  glowGreen: glowTexture('rgba(210,255,225,1)', 'rgba(80,255,170,0.45)'),
  glowRed: glowTexture('rgba(255,215,215,1)', 'rgba(255,90,90,0.5)')
};

function textSprite(lines, opts) {
  opts = opts || {};
  var fs = opts.fontSize || 44;
  var c = document.createElement('canvas');
  var ctx = c.getContext('2d');
  ctx.font = 'bold ' + fs + 'px "Microsoft YaHei", sans-serif';
  var w = 10;
  lines.forEach(function (l) { w = Math.max(w, ctx.measureText(l.text).width); });
  var pad = fs * 0.5;
  c.width = Math.ceil(w + pad * 2);
  c.height = Math.ceil(lines.length * fs * 1.35 + pad * 1.2);
  ctx = c.getContext('2d');
  if (opts.bg) {
    ctx.fillStyle = opts.bg;
    var r = 18, x = 0, y = 0, ww = c.width, hh = c.height;
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + ww, y, x + ww, y + hh, r); ctx.arcTo(x + ww, y + hh, x, y + hh, r);
    ctx.arcTo(x, y + hh, x, y, r); ctx.arcTo(x, y, x + ww, y, r); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = opts.border || 'rgba(56,224,255,0.5)'; ctx.lineWidth = 3; ctx.stroke();
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  lines.forEach(function (l, i) {
    ctx.font = (l.bold !== false ? 'bold ' : '') + (l.size || fs) + 'px "Microsoft YaHei", sans-serif';
    ctx.shadowColor = l.color || '#fff'; ctx.shadowBlur = 14;
    ctx.fillStyle = l.color || '#fff';
    ctx.fillText(l.text, c.width / 2, pad * 0.6 + fs * 0.68 + i * fs * 1.35);
  });
  var tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  var scale = opts.scale || 0.0035;
  sp.scale.set(c.width * scale, c.height * scale, 1);
  return sp;
}

/* 经纬度 → 球面三维坐标（three 球体 UV 标准映射） */
function llToV3(lat, lon, r) {
  var phi = (90 - lat) * Math.PI / 180;
  var theta = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

/* ==================== 五、地球本体 ==================== */
var GLOBE_R = 1;
var globeGroup = new THREE.Group();
scene.add(globeGroup);

var mapCanvas = document.createElement('canvas');
mapCanvas.width = 2048; mapCanvas.height = 1024;
var mapTex = new THREE.CanvasTexture(mapCanvas);
mapTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

/* 重绘世界贴图：hi = { 国家名: {fill, stroke} } */
function drawWorld(hi) {
  hi = hi || {};
  var ctx = mapCanvas.getContext('2d');
  var W = mapCanvas.width, H = mapCanvas.height;
  /* 海洋 */
  var og = ctx.createLinearGradient(0, 0, 0, H);
  og.addColorStop(0, '#0a1c40');
  og.addColorStop(0.5, '#071230');
  og.addColorStop(1, '#0a1c40');
  ctx.fillStyle = og;
  ctx.fillRect(0, 0, W, H);
  /* 经纬网 */
  ctx.strokeStyle = 'rgba(90,150,230,0.13)';
  ctx.lineWidth = 1;
  for (var lon = -180; lon <= 180; lon += 20) {
    var gx = (lon + 180) / 360 * W;
    ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
  }
  for (var lat = -80; lat <= 80; lat += 20) {
    var gy = (90 - lat) / 180 * H;
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
  }
  function project(la, ln) { return [(ln + 180) / 360 * W, (90 - la) / 180 * H]; }
  function drawFeature(f, style, stroke, lw) {
    var geom = f.geometry;
    var polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
    ctx.beginPath();
    polys.forEach(function (poly) {
      poly.forEach(function (ring) {
        for (var i = 0; i < ring.length; i++) {
          var p = project(ring[i][1], ring[i][0]);
          if (i === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
        }
        ctx.closePath();
      });
    });
    ctx.fillStyle = style; ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1.2; ctx.stroke(); }
  }
  if (typeof WORLD_GEO !== 'undefined') {
    WORLD_GEO.features.forEach(function (f) {
      var nm = f.properties.name;
      /* 台湾岛随中国整体使用同一领土底色与边界样式。 */
      var featureStyle = hi[nm] || (nm === 'Taiwan' ? hi.China : null);
      if (featureStyle) drawFeature(f, featureStyle.fill, featureStyle.stroke, 1.6);
      else drawFeature(f, '#122a56', 'rgba(96,158,228,0.85)', 1.1);
    });
    /* 中国领土（含台湾岛）始终金色高亮，避免被外部底图拆分显示。 */
    WORLD_GEO.features.forEach(function (f) {
      if (f.properties.name === 'China' || f.properties.name === 'Taiwan') {
        drawFeature(f, 'rgba(255,194,51,0.34)', '#ffe9a8', 2.2);
      }
    });
  }
  mapTex.needsUpdate = true;
}

var globe = new THREE.Mesh(
  new THREE.SphereGeometry(GLOBE_R, 96, 96),
  new THREE.MeshPhongMaterial({ map: mapTex, shininess: 8, specular: new THREE.Color(0x223355) })
);
globeGroup.add(globe);

/* 大气辉光 */
var atmo = new THREE.Mesh(
  new THREE.SphereGeometry(GLOBE_R * 1.045, 64, 64),
  new THREE.MeshBasicMaterial({ color: 0x3a7bd5, transparent: true, opacity: 0.09, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false })
);
globeGroup.add(atmo);

/* 背面光晕托底 */
var halo = new THREE.Sprite(new THREE.SpriteMaterial({
  map: TEX.glowCyan, transparent: true, opacity: 0.28, depthWrite: false, blending: THREE.AdditiveBlending
}));
halo.scale.set(3.6, 3.6, 1);
halo.position.z = -0.6;
scene.add(halo);

/* 让中国在初始视角居中偏上 */
var chinaV = llToV3(CHINA.lat, CHINA.lon, 1);
globeGroup.rotation.y = -Math.atan2(chinaV.x, chinaV.z);
globeGroup.rotation.x = 0.18;

/* ==================== 六、动态图层：航线 / 标记 ==================== */
var dynGroup = new THREE.Group();      /* 航线与粒子 */
globeGroup.add(dynGroup);
var markerGroup = new THREE.Group();   /* 可点击标记 */
globeGroup.add(markerGroup);
var labelGroup = new THREE.Group();    /* 文字标注 */
globeGroup.add(labelGroup);
/* 默认保留发光标记和航线，地名与份额按需展开，避免遮挡地球主体。 */
labelGroup.visible = false;

var flowArcs = [];   /* {line, curve, parts:[{sp,t,speed}]} */
var hitMeshes = [];  /* 可点击热区 {userData:{kind, obj}} */

function clearDyn() {
  flowArcs = [];
  hitMeshes = [];
  pulseMarkers = [];
  [dynGroup, markerGroup, labelGroup].forEach(function (grp) {
    for (var i = grp.children.length - 1; i >= 0; i--) {
      var o = grp.children[i];
      grp.remove(o);
      o.traverse(function (c) {
        if (c.geometry) c.geometry.dispose();
        var mats = Array.isArray(c.material) ? c.material : (c.material ? [c.material] : []);
        mats.forEach(function (mt) {
          if (mt.map && Object.values(TEX).indexOf(mt.map) < 0) mt.map.dispose();
          mt.dispose();
        });
      });
    }
  });
}

/* 球面大圆弧（产地 → 中国），带流动粒子 */
function addFlowArc(a, b, colorHex, opts) {
  opts = opts || {};
  var va = llToV3(a.lat, a.lon, GLOBE_R), vb = llToV3(b.lat, b.lon, GLOBE_R);
  var ang = va.angleTo(vb);
  var lift = clamp(ang * 0.35, 0.12, 0.5);
  var pts = [];
  for (var i = 0; i <= 40; i++) {
    var t = i / 40;
    var p = va.clone().lerp(vb, t).normalize().multiplyScalar(GLOBE_R * (1 + Math.sin(Math.PI * t) * lift));
    pts.push(p);
  }
  var curve = new THREE.CatmullRomCurve3(pts);
  var g = new THREE.BufferGeometry().setFromPoints(curve.getPoints(64));
  var line = new THREE.Line(g, new THREE.LineBasicMaterial({
    color: colorHex, transparent: true, opacity: opts.opacity || 0.55,
    blending: THREE.AdditiveBlending, depthWrite: false
  }));
  dynGroup.add(line);
  var parts = [];
  var n = opts.parts || 3;
  for (var j = 0; j < n; j++) {
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: opts.tex || TEX.glowGold, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    var sz = opts.size || 0.09;
    sp.scale.set(sz, sz, 1);
    dynGroup.add(sp);
    /* 彗星拖尾 */
    var tail = new THREE.Sprite(new THREE.SpriteMaterial({
      map: opts.tex || TEX.glowGold, transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    tail.scale.set(sz * 0.55, sz * 0.55, 1);
    dynGroup.add(tail);
    parts.push({ sp: sp, tail: tail, t: j / n, speed: (opts.speed || 0.14) * (0.85 + Math.random() * 0.3) });
  }
  flowArcs.push({ line: line, curve: curve, parts: parts });
}

/* 通道折线（贴球面低弧） */
function addRouteLine(pts, colorHex, opts) {
  opts = opts || {};
  var vs = pts.map(function (p) { return llToV3(p[0], p[1], GLOBE_R * 1.012); });
  var lifted = [];
  for (var i = 0; i < vs.length - 1; i++) {
    var seg = 8;
    for (var j = (i === 0 ? 0 : 1); j <= seg; j++) {
      var t = j / seg;
      var p = vs[i].clone().lerp(vs[i + 1], t).normalize().multiplyScalar(GLOBE_R * (1.012 + Math.sin(Math.PI * t) * 0.03));
      lifted.push(p);
    }
  }
  var curve = new THREE.CatmullRomCurve3(lifted);
  var g = new THREE.BufferGeometry().setFromPoints(curve.getPoints(160));
  var line = new THREE.Line(g, new THREE.LineBasicMaterial({
    color: colorHex, transparent: true, opacity: opts.opacity || 0.9,
    blending: THREE.AdditiveBlending, depthWrite: false
  }));
  dynGroup.add(line);
  var parts = [];
  var n = opts.parts || 6;
  for (var k = 0; k < n; k++) {
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: opts.tex || TEX.glowCyan, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    var sz = opts.size || 0.07;
    sp.scale.set(sz, sz, 1);
    dynGroup.add(sp);
    var tail = new THREE.Sprite(new THREE.SpriteMaterial({
      map: opts.tex || TEX.glowCyan, transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    tail.scale.set(sz * 0.55, sz * 0.55, 1);
    dynGroup.add(tail);
    parts.push({ sp: sp, tail: tail, t: k / n, speed: (opts.speed || 0.06) * (0.85 + Math.random() * 0.3) });
  }
  flowArcs.push({ line: line, curve: curve, parts: parts });
}

/* 可点击脉冲标记（咽喉要道 / 储备基地 / 风险点） */
function addMarker(lat, lon, opt) {
  var pos = llToV3(lat, lon, GLOBE_R * 1.02);
  var sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: opt.tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  }));
  sp.scale.set(opt.size, opt.size, 1);
  sp.position.copy(pos);
  markerGroup.add(sp);
  var hit = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 8, 8),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hit.position.copy(pos);
  hit.userData.click = opt.click || null;
  markerGroup.add(hit);
  hitMeshes.push(hit);
  var lab = null;
  if (opt.label) {
    lab = textSprite([{ text: opt.label, color: opt.labelColor || '#fff', size: 34 }], {
      scale: 0.0016, bg: 'rgba(8,14,32,0.75)', border: opt.border || 'rgba(255,255,255,0.25)'
    });
    var lla = lat + (opt.lo ? opt.lo[0] : 0), llo = lon + (opt.lo ? opt.lo[1] : 0);
    lab.position.copy(llToV3(lla, llo, GLOBE_R * 1.16));
    labelGroup.add(lab);
  }
  return { sp: sp, hit: hit, label: lab, baseSize: opt.size };
}
var pulseMarkers = [];  /* {mk, phase} */
function registerPulse(mk) { pulseMarkers.push({ mk: mk, phase: Math.random() * Math.PI * 2 }); }

/* 中国金色脉冲信标（常驻） */
var chinaBeacon;
(function buildChinaBeacon() {
  var pos = llToV3(CHINA.lat, CHINA.lon, GLOBE_R * 1.02);
  chinaBeacon = new THREE.Sprite(new THREE.SpriteMaterial({
    map: TEX.glowGold, transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending
  }));
  chinaBeacon.scale.set(0.16, 0.16, 1);
  chinaBeacon.position.copy(pos);
  globeGroup.add(chinaBeacon);
})();

/* 粒子推进 */
function updateFlows(dt) {
  for (var i = 0; i < flowArcs.length; i++) {
    var fa = flowArcs[i];
    for (var j = 0; j < fa.parts.length; j++) {
      var p = fa.parts[j];
      p.t = (p.t + dt * p.speed) % 1;
      if (p.t < 0) p.t += 1;
      p.sp.position.copy(fa.curve.getPoint(p.t));
      if (p.tail) p.tail.position.copy(fa.curve.getPoint((p.t - 0.03 + 1) % 1));
    }
  }
}

/* ==================== 七、模式逻辑 ==================== */
var currentMode = 'resources';
var currentRes = 'oil';
var currentRoute = 'sea';
var currentPillar = 'diversify';
var currentScen = 'malacca';
/* 默认静止，避免关键来源与通道在学生观察时自行转离视野。 */
var spinOn = false;
var scenarioMitigationOn = false;

function cssColor(hex) { return '#' + ('000000' + hex.toString(16)).slice(-6); }

/* ---------- 家底与依存 ---------- */
function buildResources() {
  clearDyn();
  var R = RESOURCES[currentRes];
  var hi = {};
  R.sources.forEach(function (s) {
    if (s[0] === 'China') return;
    hi[s[0]] = { fill: 'rgba(255,140,60,0.55)', stroke: '#ffd76a' };
  });
  drawWorld(hi);

  if (currentRes === 'rareearth') {
    /* 优势资源：画全球分布标记，而非"流向中国" */
    R.sources.forEach(function (s) {
      var isCn = s[0] === 'China';
      var mk = addMarker(s[1], s[2], {
        tex: isCn ? TEX.glowGold : TEX.glowGreen,
        size: 0.06 + s[3] / 500,
        label: (isCn ? '中国 ' : '') + s[3] + '%', labelColor: isCn ? '#ffe9a8' : '#baffdd',
        border: isCn ? 'rgba(255,194,51,0.6)' : 'rgba(109,255,184,0.5)',
        lo: [3, 2],
        click: function () { showSourceInfo(s, null, R); pulseOnce(mk); }
      });
      registerPulse(mk);
    });
  } else {
    var ep = ENTRY_PORTS[currentRes];
    var ports = {};
    var tex = currentRes === 'gas' ? TEX.glowCyan : (currentRes === 'soybean' ? TEX.glowGreen : TEX.glowGold);
    R.sources.forEach(function (s, idx) {
      var dst = ep.byCountry[s[0]] || ep.def;
      ports[dst[2]] = dst;
      addFlowArc({ lat: s[1], lon: s[2] }, { lat: dst[0], lon: dst[1] }, R.color, {
        tex: tex, parts: 1 + Math.round(s[3] / 15), size: 0.085, speed: 0.15, opacity: 0.5
      });
      /* 来源点 + 份额标签（份额前 6 名可点击） */
      if (idx < 6) {
        var mk = addMarker(s[1], s[2], {
          tex: TEX.glowWarm, size: 0.05 + s[3] / 600,
          label: s[3] + '%', labelColor: '#ffe3a3', border: 'rgba(255,194,51,0.5)', lo: [2.5, 2],
          click: function () { showSourceInfo(s, dst, R); pulseOnce(mk); }
        });
      }
    });
    /* 入境口岸青色标记 */
    Object.keys(ports).forEach(function (nm) {
      var d = ports[nm];
      addMarker(d[0], d[1], {
        tex: TEX.glowCyan, size: 0.1, label: '⚓ ' + nm, labelColor: '#bfefff',
        border: 'rgba(56,224,255,0.55)', lo: [-2, 3]
      });
    });
  }
  /* 依存度 HUD */
  $('depHud').style.display = 'flex';
  $('depNum').textContent = R.depText;
  $('depLabel').textContent = R.name + R.unit;
}

/* 来源国/分布国详情卡 */
function showSourceInfo(s, dst, R) {
  $('infoCard').innerHTML =
    '<h3>' + R.icon + ' ' + s[0] + ' → 中国</h3>' +
    '<span class="tag">份额约 ' + s[3] + '%</span>' + (dst ? '<span class="tag safe">经 ' + dst[2] + ' 入境</span>' : '') +
    '<p>' + s[4] + '</p>' +
    '<h4>换位思考</h4>' +
    '<p>假如' + s[0] + '这条供给线突然中断，约 ' + s[3] + '% 的缺口由谁来补？这说明了"进口多元化"的什么道理？</p>';
}

function getResourceConclusion(R) {
  if (currentRes === 'rareearth') return '优势资源的安全重点，不是扩大原料出口，而是保护性开发、深加工与提升定价能力。';
  var lead = R.sources[0];
  return '对外依存度高不等于必然不安全；真正要同时看来源集中度、运输通道和替代能力。当前最大来源是' + lead[0] + '（约 ' + lead[3] + '%）。';
}

function showResourceInfo() {
  var R = RESOURCES[currentRes];
  var bars = '';
  var max = 0;
  R.sources.forEach(function (s) { max = Math.max(max, s[3]); });
  R.sources.slice(0, 6).forEach(function (s) {
    bars += '<div class="bar-row"><div class="bar-label"><span>' + s[0] + '</span><span>约 ' + s[3] + '%</span></div>'
      + '<div class="bar-track"><div class="bar-fill" data-w="' + Math.round(s[3] / max * 100) + '" style="background:' + R.css + ';color:' + R.css + '"></div></div></div>';
  });
  $('infoCard').innerHTML =
    '<h3>' + R.icon + ' ' + R.name + ' · ' + R.depText + '</h3>' +
    '<span class="tag warn">对外依存 ' + (currentRes === 'rareearth' ? '—（优势资源）' : R.depText) + '</span><span class="tag">' + R.risk + '</span>' +
    '<div class="kpi"><div class="k"><b>' + R.kpi[0][0] + '</b><span>' + R.kpi[0][1] + '</span></div>' +
    '<div class="k"><b>' + R.kpi[1][0] + '</b><span>' + R.kpi[1][1] + '</span></div></div>' +
    '<h4>主要来源（份额约值）</h4>' + bars +
    '<h4>讲解</h4><p>' + R.teach + '</p>' +
    '<div class="learning-callout"><b>读图结论：</b>' + getResourceConclusion(R) + '</div>' +
    '<p class="data-note">数据口径：2023 年前后教学约值；进口来源份额仅展示主要来源国，用于比较集中度，不作实时贸易统计。</p>';
  setTimeout(function () {
    var fills = $('infoCard').querySelectorAll('.bar-fill');
    for (var i = 0; i < fills.length; i++) fills[i].style.width = fills[i].dataset.w + '%';
  }, 60);
}

/* ---------- 运输通道 ---------- */
function buildRoutes() {
  clearDyn();
  drawWorld({});
  /* 全部通道：选中者亮色加粒子，其余暗色 */
  Object.keys(ROUTES).forEach(function (k) {
    var rt = ROUTES[k];
    var sel = k === currentRoute;
    addRouteLine(rt.pts, rt.color, {
      opacity: sel ? 0.95 : 0.22,
      parts: sel ? 7 : 0,
      size: 0.075,
      speed: 0.05,
      tex: rt.color === 0x38e0ff ? TEX.glowCyan : TEX.glowGreen
    });
  });
  /* 咽喉要道红色脉冲标记 */
  CHOKEPOINTS.forEach(function (cp) {
    var mk = addMarker(cp.lat, cp.lon, {
      tex: TEX.glowRed, size: 0.13, label: cp.name, labelColor: '#ffb3b3', border: 'rgba(255,107,107,0.6)',
      click: function () { showChokeInfo(cp); pulseOnce(mk); }
    });
    registerPulse(mk);
  });
  $('depHud').style.display = 'none';
}

function showRouteInfo() {
  var rt = ROUTES[currentRoute];
  $('infoCard').innerHTML =
    '<h3>🚢 ' + rt.name + '</h3>' +
    '<p>' + rt.desc + '</p>' +
    '<h4>通道观察</h4>' +
    '<p>看地球上' + (currentRoute === 'sea' ? '青色' : '绿色') + '航线的走向：它经过了哪些咽喉海峡？哪一段最容易被"卡脖子"？</p>' +
    '<p style="margin-top:6px"><span class="tag">点击红色标记 = 咽喉要道详情</span></p>';
}

function showChokeInfo(cp) {
  $('infoCard').innerHTML =
    '<h3>🚧 ' + cp.name + '</h3>' +
    '<p>' + cp.desc + '</p>' +
    '<h4>安全启示</h4><p>' + cp.note + '</p>' +
    '<p style="margin-top:6px"><span class="tag warn">咽喉要道 = 供应链最脆弱一环</span></p>';
}

function pulseOnce(mk) {
  tween({
    dur: 0.7,
    update: function (k) {
      var s = 1 + Math.sin(k * Math.PI) * 0.8;
      mk.sp.scale.set(mk.baseSize * s, mk.baseSize * s, 1);
    }
  });
}

/* ---------- 安全对策 ---------- */
function buildStrategy() {
  clearDyn();
  var hi = {};
  if (currentPillar === 'cooperate') {
    ['Russia', 'Kazakhstan', 'Turkmenistan', 'Myanmar', 'Angola', 'Brazil', 'Saudi Arabia'].forEach(function (n) {
      hi[n] = { fill: 'rgba(109,255,184,0.55)', stroke: '#baffdd' };
    });
  }
  drawWorld(hi);
  /* 储备基地绿色标记（标签按 lo 偏移错开） */
  BASES.forEach(function (b) {
    var mk = addMarker(b.lat, b.lon, {
      tex: TEX.glowGreen, size: 0.11, label: b.name, labelColor: '#baffdd', border: 'rgba(109,255,184,0.6)', lo: b.lo,
      click: function () { showBaseInfo(b); pulseOnce(mk); }
    });
    registerPulse(mk);
  });
  /* 合作支柱：伙伴国到中国的绿色细弧 */
  if (currentPillar === 'cooperate') {
    [['Russia', 57, 65], ['Kazakhstan', 48, 66], ['Turkmenistan', 39, 59], ['Myanmar', 19.5, 96], ['Angola', -8.8, 13.2], ['Brazil', -10, -52], ['Saudi Arabia', 21.8, 44.2]].forEach(function (p) {
      addFlowArc({ lat: p[1], lon: p[2] }, CHINA, 0x6dffb8, { tex: TEX.glowGreen, parts: 2, size: 0.06, speed: 0.12, opacity: 0.35 });
    });
  }
  $('depHud').style.display = 'none';
}

function showPillarInfo() {
  var p = PILLARS[currentPillar];
  $('infoCard').innerHTML =
    '<h3>🛡️ ' + p.name + '</h3>' +
    '<span class="tag safe">' + p.sub + '</span>' +
    '<p>' + p.desc + '</p>' +
    '<h4>课堂讨论</h4>' +
    '<p>这一支柱主要解决资源安全的哪个环节？（供给 / 运输 / 价格）它与其它三支柱如何配合？</p>';
}

function showBaseInfo(b) {
  $('infoCard').innerHTML =
    '<h3>🟢 ' + b.name + '</h3>' +
    '<p>' + b.desc + '</p>' +
    '<h4>为什么是这里？</h4>' +
    '<p>储备基地选址的逻辑：近港口（接卸海运）或近管道（承接陆路来油）、近炼厂（快速转化为成品油）、腹地纵深（战略安全）。</p>' +
    '<p style="margin-top:6px"><span class="tag safe">目标：90 天净进口量储备</span></p>';
}

/* ---------- 风险推演 ---------- */
function buildScenario() {
  clearDyn();
  var sc = SCENARIOS[currentScen];
  var hi = {};
  sc.redCountries.forEach(function (n) { hi[n] = { fill: 'rgba(255,90,90,0.6)', stroke: '#ffb3b3' }; });
  if (scenarioMitigationOn) {
    sc.greenCountries.forEach(function (n) { hi[n] = { fill: 'rgba(109,255,184,0.55)', stroke: '#baffdd' }; });
  }
  drawWorld(hi);
  /* 第一步仅呈现冲击；学生启用组合应对后才出现绿色备用通道与来源。 */
  var activeGreenRoutes = scenarioMitigationOn ? sc.greenRoutes : [];
  var activeGreenCountries = scenarioMitigationOn ? sc.greenCountries : [];
  activeGreenRoutes.forEach(function (k) {
    var rt = ROUTES[k];
    addRouteLine(rt.pts, 0x6dffb8, { opacity: 0.95, parts: 6, size: 0.07, speed: 0.07, tex: TEX.glowGreen });
  });
  sc.redRoutes.forEach(function (k) {
    var rt = ROUTES[k];
    addRouteLine(rt.pts, 0xff5c5c, { opacity: 0.3, parts: 0, tex: TEX.glowRed });
  });
  /* 风险点红标记 + 备用来源绿弧 */
  sc.redPoints.forEach(function (rp) {
    var mk = addMarker(rp.lat, rp.lon, {
      tex: TEX.glowRed, size: 0.16, label: '✖ ' + rp.label, labelColor: '#ffb3b3', border: 'rgba(255,107,107,0.7)'
    });
    registerPulse(mk);
  });
  activeGreenCountries.forEach(function (n) {
    var R = null;
    Object.keys(RESOURCES).forEach(function (rk) {
      RESOURCES[rk].sources.forEach(function (s) { if (s[0] === n) R = s; });
    });
    if (R) addFlowArc({ lat: R[1], lon: R[2] }, CHINA, 0x6dffb8, { tex: TEX.glowGreen, parts: 2, size: 0.065, speed: 0.13, opacity: 0.4 });
  });
  $('depHud').style.display = 'none';
  /* 场景字幕 */
  $('sceneCap').innerHTML = scenarioMitigationOn
    ? sc.caption
    : '第一步：先识别<b>受冲击环节</b>。红色显示风险集中在哪里；随后再启用组合应对，比较地图如何变化。';
  $('sceneCap').classList.add('show');
  renderScenarioReadout();
}

function renderScenarioReadout() {
  var sc = SCENARIOS[currentScen];
  var board = $('scenarioReadout');
  var button = $('mitigationBtn');
  if (!board || !button) return;
  var affected = sc.redCountries.length ? '来源国 / 产区' : '关键海峡 / 通道';
  var buffer = scenarioMitigationOn ? '陆路通道 + 储备 + 多元来源' : '尚未调用';
  board.classList.toggle('is-mitigated', scenarioMitigationOn);
  board.innerHTML =
    '<div class="risk-metric"><span>受冲击环节</span><b>' + affected + '</b></div>' +
    '<div class="risk-metric"><span>当前缓冲能力</span><b>' + buffer + '</b></div>';
  button.classList.toggle('is-active', scenarioMitigationOn);
  button.textContent = scenarioMitigationOn ? '↺ 回看冲击状态' : '🛡️ 启用安全组合拳';
  button.setAttribute('aria-pressed', scenarioMitigationOn ? 'true' : 'false');
}

function showScenarioInfo() {
  var sc = SCENARIOS[currentScen];
  $('infoCard').innerHTML =
    '<h3>' + sc.name + '</h3>' +
    '<span class="tag warn">红色 = 受冲击</span><span class="tag safe">绿色 = 备用方案</span>' +
    '<p>' + sc.desc + '</p>' +
    '<h4>推演结论</h4>' +
    '<p>' + (scenarioMitigationOn
      ? '组合应对已启用：绿色通道与来源不是“消灭风险”，而是把单点中断变成可调度、可缓冲的系统风险。'
      : '先不要急着找答案：观察红色区域，判断这次风险主要冲击“来源”还是“通道”，以及为什么会传导到国内。') + '</p>' +
    '<div class="learning-callout"><b>课堂任务：</b>用“冲击环节 → 直接后果 → 应对措施”说完整一句资源安全解释。</div>';
}

/* ---------- 图例 ---------- */
function updateLegend() {
  var html = '<div class="lg-title">图 例</div>';
  if (currentMode === 'resources') {
    var R = RESOURCES[currentRes];
    html += '<div class="lg-row"><span class="chip" style="background:#ffc233;color:#ffc233"></span>中国（目的地）</div>'
      + '<div class="lg-row"><span class="chip" style="background:#ff8c3c;color:#ff8c3c"></span>' + R.name + '来源国</div>'
      + '<div class="lg-row"><span class="chip" style="background:' + R.css + ';color:' + R.css + '"></span>要素流向（弧线）</div>';
  } else if (currentMode === 'routes') {
    html += '<div class="lg-row"><span class="chip" style="background:#38e0ff;color:#38e0ff"></span>海上通道</div>'
      + '<div class="lg-row"><span class="chip" style="background:#6dffb8;color:#6dffb8"></span>陆路管道</div>'
      + '<div class="lg-row"><span class="chip" style="background:#ff6b6b;color:#ff6b6b"></span>咽喉要道（可点击）</div>';
  } else if (currentMode === 'strategy') {
    html += '<div class="lg-row"><span class="chip" style="background:#6dffb8;color:#6dffb8"></span>国家石油储备基地</div>'
      + '<div class="lg-row"><span class="chip" style="background:#baffdd;color:#baffdd"></span>能源合作伙伴</div>'
      + '<div class="lg-row"><span class="chip" style="background:#ffc233;color:#ffc233"></span>中国</div>';
  } else {
    html += '<div class="lg-row"><span class="chip" style="background:#ff6b6b;color:#ff6b6b"></span>受冲击环节</div>'
      + '<div class="lg-row"><span class="chip" style="background:#6dffb8;color:#6dffb8"></span>备用通道 / 替代来源</div>'
      + '<div class="lg-row"><span class="chip" style="background:#ffc233;color:#ffc233"></span>中国</div>';
  }
  $('legend').innerHTML = html;
}

/* ---------- 模式切换 ---------- */
function setMode(m) {
  currentMode = m;
  var btns = document.querySelectorAll('.mode-btn');
  for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('active', btns[i].dataset.mode === m);
  $('modeDesc').textContent = MODE_DESC[m];
  var blocks = document.querySelectorAll('.ctl-block');
  for (var j = 0; j < blocks.length; j++) {
    blocks[j].style.display = blocks[j].dataset.for.split(' ').indexOf(m) >= 0 ? '' : 'none';
  }
  $('sceneCap').classList.remove('show');
  if (m === 'resources') { buildResources(); showResourceInfo(); }
  else if (m === 'routes') { buildRoutes(); showRouteInfo(); }
  else if (m === 'strategy') { buildStrategy(); showPillarInfo(); }
  else { scenarioMitigationOn = false; buildScenario(); showScenarioInfo(); }
  updateLegend();
}

/* ==================== 八、点击拾取 ==================== */
var raycaster = new THREE.Raycaster();
var downPos = null;
renderer.domElement.addEventListener('pointerdown', function (e) { downPos = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', function (e) {
  if (!downPos) return;
  var dx = e.clientX - downPos[0], dy = e.clientY - downPos[1];
  downPos = null;
  if (dx * dx + dy * dy > 25) return;
  var r = renderer.domElement.getBoundingClientRect();
  var mouse = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(mouse, camera);
  var found = raycaster.intersectObjects(hitMeshes);
  if (found.length && found[0].object.userData.click) found[0].object.userData.click();
});

/* ==================== 九、UI 绑定 ==================== */
function bindUI() {
  var modeBtns = document.querySelectorAll('.mode-btn');
  for (var i = 0; i < modeBtns.length; i++) {
    modeBtns[i].onclick = function () { setMode(this.dataset.mode); };
  }

  /* 资源按钮 */
  var rg = $('resGrid');
  Object.keys(RESOURCES).forEach(function (k) {
    var R = RESOURCES[k];
    var b = document.createElement('button');
    b.className = 'res-btn' + (k === currentRes ? ' active' : '');
    b.dataset.res = k;
    b.innerHTML = R.icon + ' ' + R.name + '<span class="dep">' + R.depText + '</span>';
    b.onclick = function () {
      currentRes = k;
      var bs = rg.querySelectorAll('.res-btn');
      for (var j = 0; j < bs.length; j++) bs[j].classList.toggle('active', bs[j].dataset.res === k);
      buildResources(); showResourceInfo(); updateLegend();
    };
    rg.appendChild(b);
  });

  /* 通道按钮 */
  var rb = $('routeBtns');
  Object.keys(ROUTES).forEach(function (k) {
    var rt = ROUTES[k];
    var b = document.createElement('button');
    b.className = 'route-btn' + (k === currentRoute ? ' active' : '');
    b.dataset.route = k;
    b.innerHTML = rt.name + '<span>' + rt.sub + '</span>';
    b.onclick = function () {
      currentRoute = k;
      var bs = rb.querySelectorAll('.route-btn');
      for (var j = 0; j < bs.length; j++) bs[j].classList.toggle('active', bs[j].dataset.route === k);
      buildRoutes(); showRouteInfo();
    };
    rb.appendChild(b);
  });

  /* 支柱按钮 */
  var pb = $('pillarBtns');
  Object.keys(PILLARS).forEach(function (k) {
    var p = PILLARS[k];
    var b = document.createElement('button');
    b.className = 'pillar-btn' + (k === currentPillar ? ' active' : '');
    b.dataset.pillar = k;
    b.innerHTML = p.name + '<span>' + p.sub + '</span>';
    b.onclick = function () {
      currentPillar = k;
      var bs = pb.querySelectorAll('.pillar-btn');
      for (var j = 0; j < bs.length; j++) bs[j].classList.toggle('active', bs[j].dataset.pillar === k);
      buildStrategy(); showPillarInfo();
    };
    pb.appendChild(b);
  });

  /* 情景按钮 */
  var sb = $('scenBtns');
  Object.keys(SCENARIOS).forEach(function (k) {
    var sc = SCENARIOS[k];
    var b = document.createElement('button');
    b.className = 'scen-btn' + (k === currentScen ? ' active' : '');
    b.dataset.scen = k;
    b.innerHTML = sc.name + '<span>' + sc.sub + '</span>';
    b.onclick = function () {
      currentScen = k;
      scenarioMitigationOn = false;
      var bs = sb.querySelectorAll('.scen-btn');
      for (var j = 0; j < bs.length; j++) bs[j].classList.toggle('active', bs[j].dataset.scen === k);
      buildScenario(); showScenarioInfo();
    };
    sb.appendChild(b);
  });

  $('optSpin').onchange = function () { spinOn = this.checked; };
  $('optLabels').onchange = function () {
    labelGroup.visible = this.checked;
  };
  $('mitigationBtn').onclick = function () {
    scenarioMitigationOn = !scenarioMitigationOn;
    buildScenario(); showScenarioInfo(); updateLegend();
  };
  $('resetViewBtn').onclick = resetSceneView;

  $('quizBtn').onclick = openQuiz;
  $('quizClose').onclick = function () { $('quizModal').classList.remove('open'); };
  $('quizModal').addEventListener('click', function (e) {
    if (e.target === this) this.classList.remove('open');
  });

  /* 快捷键 */
  document.addEventListener('keydown', function (e) {
    if ($('quizModal').classList.contains('open')) return;
    var tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    var modes = { '1': 'resources', '2': 'routes', '3': 'strategy', '4': 'scenario' };
    if (modes[e.key]) { setMode(modes[e.key]); return; }
    if (e.key === ' ') { e.preventDefault(); spinOn = !spinOn; $('optSpin').checked = spinOn; return; }
    if (e.key === 'f' || e.key === 'F') {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
      return;
    }
    if (e.key === 'Escape') {
      flyTo(new THREE.Vector3(0, 0.55, 3.35), new THREE.Vector3(0, 0, 0), 1.1);
    }
  });
}

/* 相机飞行（复位视角用） */
function flyTo(pos, tgt, dur) {
  for (var i = tweens.length - 1; i >= 0; i--) { if (tweens[i].tag === 'cam') tweens.splice(i, 1); }
  var fp = camera.position.clone(), ft = pos.clone();
  var tp = controls.target.clone(), tt = tgt.clone();
  tween({
    tag: 'cam', dur: dur || 1.2,
    update: function (k) {
      camera.position.lerpVectors(fp, ft, k);
      controls.target.lerpVectors(tp, tt, k);
    }
  });
}

function resetSceneView() {
  var startY = globeGroup.rotation.y;
  var startX = globeGroup.rotation.x;
  var targetY = -Math.atan2(chinaV.x, chinaV.z);
  tween({
    tag: 'globe-reset', dur: 0.8,
    update: function (k) {
      globeGroup.rotation.y = startY + (targetY - startY) * k;
      globeGroup.rotation.x = startX + (0.18 - startX) * k;
    }
  });
  flyTo(new THREE.Vector3(0, 0.55, 3.35), new THREE.Vector3(0, 0, 0), 0.8);
}

/* ==================== 十、课堂小测 ==================== */
var qIndex = 0, qScore = 0, qAnswered = false;

function openQuiz() {
  qIndex = 0; qScore = 0;
  $('quizModal').classList.add('open');
  renderQuestion();
}

function renderQuestion() {
  qAnswered = false;
  var q = QUIZ[qIndex];
  $('quizProgress').textContent = '第 ' + (qIndex + 1) + ' / ' + QUIZ.length + ' 题';
  var html = '<div class="q-question">' + q.q + '</div>';
  q.opts.forEach(function (op, i) {
    html += '<button class="q-opt" data-i="' + i + '">' + String.fromCharCode(65 + i) + '. ' + op + '</button>';
  });
  html += '<div id="qFoot"></div>';
  $('quizBody').innerHTML = html;
  var opts = $('quizBody').querySelectorAll('.q-opt');
  for (var i = 0; i < opts.length; i++) {
    opts[i].onclick = function () { answer(parseInt(this.dataset.i, 10), this); };
  }
}

function answer(i, btn) {
  if (qAnswered) return;
  qAnswered = true;
  var q = QUIZ[qIndex];
  var opts = $('quizBody').querySelectorAll('.q-opt');
  opts[q.ans].classList.add('right');
  if (i === q.ans) qScore++;
  else btn.classList.add('wrong');
  var last = qIndex === QUIZ.length - 1;
  $('qFoot').innerHTML =
    '<div class="q-explain">💡 ' + q.exp + '</div>' +
    '<button class="q-next" id="qNext">' + (last ? '查看成绩 🎉' : '下一题 →') + '</button>';
  $('qNext').onclick = function () {
    if (last) showQuizScore();
    else { qIndex++; renderQuestion(); }
  };
}

function showQuizScore() {
  $('quizProgress').textContent = '测验完成';
  var pct = qScore / QUIZ.length;
  var comment = pct === 1 ? '满分！你已经建立起完整的国家资源安全观，老师为你点赞！🌟'
    : pct >= 0.6 ? '不错！核心概念已掌握，回到地球再推演一遍风险情景，理解会更深。'
    : '别灰心！建议按「家底 → 通道 → 推演 → 对策」再走一遍，边玩边总结。';
  $('quizBody').innerHTML =
    '<div class="q-score"><div class="big">' + qScore + ' / ' + QUIZ.length + '</div>' +
    '<div class="comment">' + comment + '</div></div>' +
    '<button class="q-next" id="qRetry">🔄 再测一次</button>';
  $('qRetry').onclick = function () { qIndex = 0; qScore = 0; renderQuestion(); };
}

/* ==================== 十一、主循环与初始化 ==================== */
var clock = new THREE.Clock();
var elapsed = 0;

function animate() {
  requestAnimationFrame(animate);
  var dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;
  updateTweens(dt);

  if (spinOn) globeGroup.rotation.y += dt * 0.05;

  /* 中国信标呼吸 */
  var bs = 0.16 * (1 + 0.12 * Math.sin(elapsed * 2.2));
  chinaBeacon.scale.set(bs, bs, 1);

  /* 标记脉冲 */
  for (var i = 0; i < pulseMarkers.length; i++) {
    var pm = pulseMarkers[i];
    var s = pm.mk.baseSize * (1 + 0.25 * Math.sin(elapsed * 3 + pm.phase));
    pm.mk.sp.scale.set(s, s, 1);
  }

  updateFlows(dt);
  controls.update();
  if (composer) composer.render();
  else renderer.render(scene, camera);
}

window.addEventListener('resize', function () {
  camera.aspect = wrap.clientWidth / wrap.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(wrap.clientWidth, wrap.clientHeight);
  if (composer) composer.setSize(wrap.clientWidth, wrap.clientHeight);
});

function init() {
  camera.position.set(0, 2.8, 6.2);
  tween({
    tag: 'cam', dur: 2.0,
    update: function (k) {
      camera.position.lerpVectors(new THREE.Vector3(0, 2.8, 6.2), new THREE.Vector3(0, 0.55, 3.35), k);
    }
  });
  drawWorld({});
  bindUI();
  setMode('resources');
  try {
    var params = new URLSearchParams(window.location.search);
    var q = params.get('mode');
    if (q && MODE_DESC[q]) setMode(q);
  } catch (err) {}
  window.ResApp = {
    setMode: setMode, setRes: function (k) { currentRes = k; buildResources(); showResourceInfo(); updateLegend(); },
    setRoute: function (k) { currentRoute = k; buildRoutes(); showRouteInfo(); },
    setPillar: function (k) { currentPillar = k; buildStrategy(); showPillarInfo(); },
    setScen: function (k) { currentScen = k; buildScenario(); showScenarioInfo(); },
    setSpin: function (v) { spinOn = v; }, openQuiz: openQuiz,
    camera: camera, controls: controls
  };
  $('loading').classList.add('done');
  animate();
}

setTimeout(init, 80);

})();
