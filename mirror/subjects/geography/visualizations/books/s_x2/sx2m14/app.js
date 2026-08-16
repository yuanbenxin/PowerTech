/* ============================================================
   城市群的协同发展 · 3D 交互课件
   高中地理 · 选择性必修 2《区域发展》
   纯离线单文件：three.js 3D 倾斜地图 + 夜灯光效 + 辐射流线
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

/* ==================== 二、地理数据 ==================== */
/* 坐标：纬度 lat / 经度 lon；gdp 亿元（2023 约值）；pop 万人
   tier：0 核心层 / 1 紧密层 / 2 辐射层 */
var REGIONS = {
  yrd: {
    name: '长三角城市群', short: '长三角', center: [31.1, 120.4], cores: ['上海'],
    theme: '市场驱动 · 一体化程度最高 · 上海为绝对核心',
    cities: [
      { name: '上海', lat: 31.23, lon: 121.47, gdp: 47200, pop: 2487, tier: 0, industry: '金融 · 航运 · 科创', accept: '总部经济、金融贸易、科技创新策源地；向外输出资本、技术、订单与标准' },
      { name: '苏州', lat: 31.30, lon: 120.62, gdp: 24700, pop: 1296, tier: 1, industry: '电子信息 · 高端制造', accept: '承接上海制造业外溢第一站："上海研发 + 苏州制造"的同城化分工' },
      { name: '无锡', lat: 31.57, lon: 120.30, gdp: 15500, pop: 750, tier: 1, industry: '物联网 · 集成电路' },
      { name: '常州', lat: 31.78, lon: 119.95, gdp: 10100, pop: 537, tier: 1, industry: '新能源 · 智能制造' },
      { name: '南通', lat: 32.01, lon: 120.86, gdp: 11800, pop: 775, tier: 1, industry: '家纺 · 船舶海工', accept: '跨江接轨上海，承接家纺、建筑、船舶海工产业转移' },
      { name: '嘉兴', lat: 30.75, lon: 120.75, gdp: 7060, pop: 558, tier: 1, industry: '纺织 · 光伏', accept: '沪嘉同城化，承接上海制造外溢与居住、物流功能' },
      { name: '湖州', lat: 30.89, lon: 120.09, gdp: 4015, pop: 344, tier: 1, industry: '绿色家居 · 旅游' },
      { name: '南京', lat: 32.06, lon: 118.80, gdp: 17400, pop: 955, tier: 2, industry: '软件 · 汽车 · 石化', accept: '副核心城市，带动宁镇扬一体化' },
      { name: '杭州', lat: 30.27, lon: 120.16, gdp: 20100, pop: 1252, tier: 2, industry: '数字经济 · 电商', accept: '副核心城市，数字经济带动力强' },
      { name: '宁波', lat: 29.87, lon: 121.55, gdp: 16500, pop: 970, tier: 2, industry: '港口 · 石化 · 外贸' },
      { name: '绍兴', lat: 30.00, lon: 120.58, gdp: 7800, pop: 535, tier: 2, industry: '纺织 · 黄酒 · 集成电路' },
      { name: '合肥', lat: 31.82, lon: 117.23, gdp: 12700, pop: 985, tier: 2, industry: '新型显示 · 新能源 · 科创' },
      { name: '舟山', lat: 29.99, lon: 122.21, gdp: 2100, pop: 117, tier: 2, industry: '渔业 · 港航 · 石化' }
    ],
    coast: [[30.2, 121.2], [30.5, 121.3], [30.7, 121.8], [31.0, 121.9], [31.3, 121.9], [31.4, 121.6], [31.5, 121.9], [31.8, 121.9], [32.1, 121.6], [32.4, 121.3], [32.8, 121.0], [33.2, 120.8], [33.6, 120.5]],
    rivers: [
      [[32.2, 118.8], [32.2, 119.4], [32.1, 119.8], [32.0, 120.3], [31.9, 120.8], [31.7, 121.2], [31.5, 121.7], [31.4, 121.95]],
      [[30.4, 120.2], [30.45, 120.6], [30.5, 121.0], [30.6, 121.5]]
    ]
  },
  jjj: {
    name: '京津冀城市群', short: '京津冀', center: [38.9, 116.7], cores: ['北京'],
    theme: '政策驱动 · 疏解北京非首都功能 · 雄安新区为集中承载地',
    cities: [
      { name: '北京', lat: 39.90, lon: 116.40, gdp: 43700, pop: 2185, tier: 0, industry: '科创 · 金融 · 文化', accept: '疏解非首都功能：一般制造、区域批发市场、部分教育医疗机构有序外迁' },
      { name: '天津', lat: 39.13, lon: 117.20, gdp: 16700, pop: 1364, tier: 1, industry: '先进制造 · 港口', accept: '"京津双城记"：承接北京科技创新成果转化，共建滨海中关村' },
      { name: '唐山', lat: 39.63, lon: 118.17, gdp: 9130, pop: 772, tier: 1, industry: '钢铁 · 装备制造', accept: '承接北京钢铁、装备等产业转移，曹妃甸协同发展示范区' },
      { name: '廊坊', lat: 39.54, lon: 116.68, gdp: 3610, pop: 548, tier: 1, industry: '临空经济 · 电子信息', accept: '地处京津之间，北三县与北京通州一体化发展' },
      { name: '保定', lat: 38.87, lon: 115.46, gdp: 4850, pop: 920, tier: 1, industry: '汽车 · 新能源' },
      { name: '雄安', lat: 38.94, lon: 115.86, gdp: 400, pop: 130, tier: 1, industry: '未来之城 · 集中承载地', accept: '国家级新区：承接北京非首都功能疏解的集中承载地，千年大计' },
      { name: '石家庄', lat: 38.04, lon: 114.51, gdp: 7530, pop: 1123, tier: 2, industry: '医药 · 纺织 · 商贸' },
      { name: '沧州', lat: 38.31, lon: 116.84, gdp: 4440, pop: 730, tier: 2, industry: '石化 · 管道装备' }
    ],
    coast: [[38.2, 117.6], [38.5, 117.5], [38.8, 117.55], [39.1, 117.75], [39.25, 118.0], [39.0, 118.3], [38.9, 118.7], [39.2, 119.1], [39.6, 119.4], [39.9, 119.55], [40.2, 120.0]],
    rivers: [
      [[39.3, 115.6], [39.2, 116.0], [39.1, 116.4], [39.05, 116.8], [39.1, 117.2], [39.15, 117.6]]
    ]
  },
  gba: {
    name: '粤港澳大湾区', short: '粤港澳', center: [22.75, 113.6], cores: ['香港', '深圳', '广州'],
    theme: '制度多元 · 开放程度最高 · 多核心网络结构',
    cities: [
      { name: '香港', lat: 22.32, lon: 114.17, lx: 30, gdp: 26900, pop: 750, tier: 0, industry: '国际金融 · 贸易 · 航运', accept: '超级联系人：金融、法律、专业服务辐射全区' },
      { name: '深圳', lat: 22.54, lon: 114.06, lx: -30, ly: 14, gdp: 34600, pop: 1779, tier: 0, industry: '科技创新 · 电子信息', accept: '科创核心：高新技术产业向东莞、惠州外溢' },
      { name: '广州', lat: 23.13, lon: 113.26, gdp: 30400, pop: 1883, tier: 0, industry: '商贸 · 汽车 · 枢纽', accept: '商贸枢纽核心：带动佛山、清远等腹地制造升级' },
      { name: '佛山', lat: 23.02, lon: 113.12, gdp: 13300, pop: 955, tier: 1, industry: '家电 · 陶瓷 · 装备', accept: '广佛同城化：承接广州商贸外溢，制造业深度融合' },
      { name: '东莞', lat: 23.02, lon: 113.75, gdp: 11400, pop: 1044, tier: 1, industry: '智能终端 · 世界工厂', accept: '承接深圳电子信息产业转移，"深圳研发 + 东莞智造"' },
      { name: '珠海', lat: 22.27, lon: 113.58, lx: -10, ly: 30, gdp: 4230, pop: 249, tier: 1, industry: '家电 · 生物医药', accept: '港珠澳大桥联通港澳，承接澳门多元产业' },
      { name: '澳门', lat: 22.20, lon: 113.55, lx: 16, ly: -24, gdp: 3300, pop: 68, tier: 1, industry: '旅游休闲 · 会展' },
      { name: '惠州', lat: 23.11, lon: 114.42, gdp: 5640, pop: 607, tier: 1, industry: '石化 · 电子' },
      { name: '中山', lat: 22.52, lon: 113.39, lx: -24, gdp: 3850, pop: 445, tier: 2, industry: '灯饰 · 五金' },
      { name: '江门', lat: 22.58, lon: 113.08, gdp: 4020, pop: 482, tier: 2, industry: '摩托车 · 家电' },
      { name: '肇庆', lat: 23.05, lon: 112.47, gdp: 2790, pop: 413, tier: 2, industry: '金属加工 · 旅游' }
    ],
    coast: [[21.5, 111.8], [21.8, 112.4], [22.0, 112.9], [22.15, 113.4], [22.2, 113.55], [22.35, 113.7], [22.5, 113.85], [22.35, 114.0], [22.25, 114.2], [22.2, 114.4], [22.5, 114.8], [22.8, 115.3], [23.0, 115.8]],
    rivers: [
      [[23.4, 112.5], [23.3, 112.9], [23.13, 113.26], [22.95, 113.4], [22.7, 113.6], [22.45, 113.75]],
      [[23.2, 114.4], [23.0, 114.2], [22.8, 114.1], [22.6, 114.05]]
    ]
  }
};

/* 圈层定义（半径 km） */
var RING_DEFS = [
  { key: 0, name: '核心层', radius: 50, color: 0xffc233, desc: '核心大都市本身：总部经济、金融贸易、科技创新的策源地，辐射源。' },
  { key: 1, name: '紧密层', radius: 100, color: 0x38e0ff, desc: '1 小时通勤圈：与核心城市同城化发展，直接承接产业与人口外溢。' },
  { key: 2, name: '辐射层', radius: 200, color: 0xc58bff, desc: '辐射带动圈：接受核心城市的资本、技术、订单辐射，并为核心区提供腹地、劳动力与市场。' }
];

/* 三群对比数据 */
var COMPARE = {
  yrd: { area: 35.8, pop: 2.37, gdp: 30.5, point: '市场驱动：一体化程度高，产业链分工细，上海发挥核心辐射作用。', structure: '上海核心引领，南京、杭州、宁波等多节点协同。', challenge: '跨省公共服务与要素流动仍需进一步协同。' },
  jjj: { area: 21.6, pop: 1.10, gdp: 10.4, point: '政策驱动：以疏解北京非首都功能为重点，雄安新区承担集中承载任务。', structure: '北京、天津与河北腹地的功能重组。', challenge: '产业承接能力和公共服务均衡需要持续提升。' },
  gba: { area: 5.6, pop: 0.87, gdp: 14.0, point: '制度多元：多核心网络联系紧密，对外开放程度高。', structure: '广州、深圳、香港三核联动，多城专业化分工。', challenge: '跨境规则衔接和公共服务便利化仍是关键。' }
};

/* 辐射通道类型 */
var FLOW_TYPES = {
  industry: { name: '产业转移', color: 0xff9a5c, css: '#ff9a5c', desc: '核心城市把制造业、生产环节转移给周边，自身专注研发与总部经济。' },
  traffic: { name: '交通联通', color: 0x38e0ff, css: '#38e0ff', desc: '高铁、城际铁路、跨海大桥压缩时空距离，"1 小时通勤圈"成形。' },
  people: { name: '人口通勤', color: 0xc58bff, css: '#c58bff', desc: '跨城上班、跨城居住成为常态，人口沿交通轴双向流动。' }
};

/* 同一类通道在不同城市群中的典型“原因—过程—结果”案例。 */
var FLOW_CASES = {
  yrd: {
    industry: { route: '上海 → 苏州', driver: '研发、总部和订单向周边扩散', result: '形成“上海研发 + 苏州制造”的分工协作' },
    traffic: { route: '上海—苏州—无锡—南京', driver: '高铁与城际铁路压缩通勤时间', result: '沪宁走廊成为人员和要素高频流动的发展轴' },
    people: { route: '上海 ↔ 嘉兴', driver: '跨城通勤与居住成本差异', result: '居住、就业和公共服务跨城配置' }
  },
  jjj: {
    industry: { route: '北京 → 雄安', driver: '疏解非首都功能', result: '教育医疗、科研和总部配套有序布局到集中承载地' },
    traffic: { route: '北京—廊坊—天津', driver: '城际铁路与高速通道加密', result: '京津冀核心区的时空距离被压缩' },
    people: { route: '北京 ↔ 廊坊', driver: '跨城居住与就业联系', result: '北三县与北京通州的同城化联系增强' }
  },
  gba: {
    industry: { route: '深圳 → 东莞', driver: '科创成果和电子信息产业外溢', result: '形成“深圳研发 + 东莞智造”的协作链' },
    traffic: { route: '广州—东莞—深圳—香港', driver: '城际铁路、口岸和跨江通道衔接', result: '多核心城市之间形成网络化联系' },
    people: { route: '广州 ↔ 佛山', driver: '广佛同城化与轨道交通连接', result: '就业、居住和公共服务的跨城流动更频繁' }
  }
};

/* 课堂模型的关键观察节点，不替代真实遥感统计。 */
var LIGHT_STAGES = [
  { year: 1996, title: '孤立亮点', cue: '核心城市率先发亮，周边联系仍较弱。' },
  { year: 2005, title: '多点兴起', cue: '周边节点逐渐点亮，城市化和产业扩散加速。' },
  { year: 2012, title: '轴带连片', cue: '灯光沿交通走廊延伸，城市群轮廓出现。' },
  { year: 2022, title: '成熟网络', cue: '多中心协同增强，区域联系更紧密。' }
];

/* 发展轴带（城市名连成走廊） */
var AXES = {
  yrd: [
    { name: '沪宁发展轴', cities: ['上海', '苏州', '无锡', '常州', '南京'] },
    { name: '沪杭甬发展轴', cities: ['上海', '嘉兴', '杭州', '绍兴', '宁波'] }
  ],
  jjj: [
    { name: '京津发展轴', cities: ['北京', '廊坊', '天津', '唐山'] }
  ],
  gba: [
    { name: '广深港发展轴', cities: ['广州', '东莞', '深圳', '香港'] },
    { name: '广珠澳发展轴', cities: ['广州', '佛山', '中山', '珠海', '澳门'] }
  ]
};

var MODE_DESC = {
  lights: '夜间灯光是城市化最直观的证据。拖动年份滑块，看灯光如何从孤立亮点扩张为连绵光带——这就是城市群的形成过程。',
  rings: '都市圈呈"核心—紧密—辐射"三级圈层结构。点击圆环或按钮，认识每一层的范围与功能。',
  flows: '大都市的辐射不是抽象的：产业、交通、人口沿通道流动。切换通道、调节辐射强度，观察网络变化；点击城市看承接内容。',
  compare: '三大城市群同台对比：面积、人口、经济总量各不相同，协同模式也各有特色。点击按钮切换视角。'
};

/* 课堂小测 */
var QUIZ = [
  {
    q: '都市圈的圈层结构由内向外依次是？',
    opts: ['核心层 → 紧密层 → 辐射层', '辐射层 → 紧密层 → 核心层', '紧密层 → 核心层 → 辐射层', '核心层 → 辐射层 → 紧密层'],
    ans: 0,
    exp: '由内向外：核心大都市（核心层）→ 1 小时通勤的同城化区域（紧密层）→ 更大范围的辐射带动区域（辐射层）。'
  },
  {
    q: '大都市对周边地区的辐射带动作用，最主要通过什么实现？',
    opts: ['行政命令', '产业、交通、人口等要素流动', '扩大城市建成区面积', '限制周边城市发展'],
    ans: 1,
    exp: '辐射带动依靠要素流动：产业转移、交通联通、人口通勤、资本与技术扩散。'
  },
  {
    q: '京津冀协同发展的核心任务是？',
    opts: ['扩大北京城市规模', '疏解北京非首都功能', '把天津建成全国金融中心', '限制河北人口流入北京'],
    ans: 1,
    exp: '京津冀协同发展的"牛鼻子"是疏解北京非首都功能，雄安新区是集中承载地。'
  },
  {
    q: '关于长三角城市群，说法正确的是？',
    opts: ['北京是其核心城市', '一体化程度最高、市场驱动特征明显', '各城市发展水平完全相同', '协同主要依靠行政壁垒'],
    ans: 1,
    exp: '长三角以上海为核心，市场驱动、一体化程度最高；城市间有分工有梯度，并非"完全相同"。'
  },
  {
    q: '上海把部分制造环节转移到苏州、南通，同时保留研发与总部。这说明大都市辐射是？',
    opts: ['单向的输出，核心城市吃亏', '双向的共赢：核心升级、周边承接', '偶然现象，与协同无关', '导致周边环境污染，不可取'],
    ans: 1,
    exp: '辐射是双向共赢：核心城市腾出空间升级产业，周边城市获得产业与就业，同时周边也为核心提供腹地、劳动力与市场。'
  }
];

/* ==================== 三、3D 场景 ==================== */
var wrap = $('canvasWrap');
var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(wrap.clientWidth, wrap.clientHeight);
wrap.appendChild(renderer.domElement);

var scene = new THREE.Scene();
scene.background = new THREE.Color(0x04081a);
scene.fog = new THREE.Fog(0x04081a, 4.5, 11);

var camera = new THREE.PerspectiveCamera(46, wrap.clientWidth / wrap.clientHeight, 0.01, 100);
camera.position.set(0, 2.35, 2.1);

var controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 1.1;
controls.maxDistance = 7;
controls.maxPolarAngle = Math.PI * 0.46;
controls.target.set(0, 0, 0);

var composer = null, bloomPass = null;
if (THREE.EffectComposer && THREE.UnrealBloomPass) {
  composer = new THREE.EffectComposer(renderer);
  composer.addPass(new THREE.RenderPass(scene, camera));
  bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(wrap.clientWidth, wrap.clientHeight), 0.10, 0.24, 0.93
  );
  composer.addPass(bloomPass);
}

scene.add(new THREE.AmbientLight(0x8899cc, 0.85));
var dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
dirLight.position.set(3, 6, 2);
scene.add(dirLight);

/* 星空背景 */
(function stars() {
  var g = new THREE.BufferGeometry();
  var n = 900, pos = new Float32Array(n * 3);
  for (var i = 0; i < n; i++) {
    var r = 20 + Math.random() * 30;
    var th = Math.random() * Math.PI * 2, ph = Math.random() * Math.PI * 0.5;
    pos[i * 3] = r * Math.cos(th) * Math.cos(ph);
    pos[i * 3 + 1] = r * Math.sin(ph) + 2;
    pos[i * 3 + 2] = r * Math.sin(th) * Math.cos(ph);
  }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  var starPts = new THREE.Points(g, new THREE.PointsMaterial({ color: 0x99bbee, size: 0.06, transparent: true, opacity: 0.7 }));
  starPts.userData.isStars = true;
  scene.add(starPts);
})();

/* ==================== 四、贴图工具 ==================== */
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
  glowGold: glowTexture('rgba(255,240,200,1)', 'rgba(255,194,51,0.45)')
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
    /* 文字采用描边保证与夜间灯光分离，避免被 Bloom 扩散成白色光团。 */
    ctx.shadowColor = 'rgba(2, 6, 23, 0.75)'; ctx.shadowBlur = 0;
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, (l.size || fs) * 0.075);
    ctx.strokeStyle = 'rgba(2, 6, 23, 0.92)';
    ctx.strokeText(l.text, c.width / 2, pad * 0.6 + fs * 0.68 + i * fs * 1.35);
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

/* ==================== 五、地图构建 ==================== */
/* 经纬度 → 场景坐标（单位：km，x 向东，z 向南） */
var LAT0 = 31.1, LON0 = 120.4;
function toXY(lat, lon) {
  return {
    x: (lon - LON0) * Math.cos(LAT0 * Math.PI / 180) * 111.32,
    z: -(lat - LAT0) * 110.94
  };
}

var mapGroup = null;       // 当前区域的全部内容
var cityObjs = [];         // {data, glow, pillar, label, ring, pos}
var ringObjs = [];         // 圈层圆环
var flowGroup = null;
var stageSprites = [];
var regionKey = 'yrd';
var mapScale = 1;

function clearMap() {
  if (mapGroup) {
    scene.remove(mapGroup);
    mapGroup.traverse(function (o) {
      if (o.geometry) o.geometry.dispose();
      /* 兼容材质数组（地形网格是双材质） */
      var mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
      mats.forEach(function (mt) {
        if (mt.map && Object.values(TEX).indexOf(mt.map) < 0) mt.map.dispose();
        mt.dispose();
      });
    });
  }
  mapGroup = new THREE.Group();
  scene.add(mapGroup);
  cityObjs = []; ringObjs = [];
}

/* 折线（海岸 / 河流） */
function addLine(pts, color, opacity, y) {
  var g = new THREE.BufferGeometry();
  var arr = new Float32Array(pts.length * 3);
  pts.forEach(function (p, i) {
    var xy = toXY(p[0], p[1]);
    arr[i * 3] = xy.x; arr[i * 3 + 1] = y; arr[i * 3 + 2] = xy.z;
  });
  g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  var line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: opacity }));
  mapGroup.add(line);
}

/* 真实行政边界：按省晕染填充 + 描边 */
var PROV_COLORS = {
  '江苏': 0x12234a, '浙江': 0x0e2a4a, '安徽': 0x251f4e, '上海市': 0x1c2c58,
  '河北': 0x12234a, '北京市': 0x1c2c58, '天津市': 0x16264e,
  '广东': 0x0e2a4a, '香港': 0x1c2c58, '澳门': 0x251f4e
};
var PROV_LABELS = {
  yrd: [['江 苏', 33.1, 119.6], ['浙 江', 29.4, 120.9], ['安 徽', 32.1, 117.1]],
  jjj: [['河 北', 37.7, 115.2]],
  gba: [['广 东', 23.8, 113.6]]
};

function buildGeography(key) {
  var geo = (typeof GEO_BOUNDARY !== 'undefined') ? GEO_BOUNDARY[key] : null;
  if (!geo) return;
  geo.cities.forEach(function (city) {
    var fillColor = PROV_COLORS[city.prov] || 0x0e1c3e;
    city.rings.forEach(function (flat) {
      var shape = new THREE.Shape();
      var linePts = [];
      for (var i = 0; i < flat.length; i += 2) {
        var xy = toXY(flat[i], flat[i + 1]);
        if (i === 0) shape.moveTo(xy.x, -xy.z); else shape.lineTo(xy.x, -xy.z);
        linePts.push(new THREE.Vector3(xy.x, 0, xy.z));
      }
      try {
        var fg = new THREE.ShapeGeometry(shape);
        var fpa = fg.attributes.position.array, fbad = false;
        for (var fi2 = 0; fi2 < fpa.length; fi2++) { if (!isFinite(fpa[fi2])) { fbad = true; break; } }
        if (fbad) { fg.dispose(); return; }
        var fill = new THREE.Mesh(
          fg,
          new THREE.MeshBasicMaterial({ color: fillColor, transparent: true, opacity: 0.92, side: THREE.DoubleSide, depthWrite: false })
        );
        fill.userData.provFill = true;
        fill.userData.fillColor = fillColor;
        fill.rotation.x = -Math.PI / 2;
        fill.position.y = -0.3;
        mapGroup.add(fill);
      } catch (e) {}
      var lg = new THREE.BufferGeometry().setFromPoints(linePts);
      mapGroup.add(new THREE.Line(lg, new THREE.LineBasicMaterial({ color: 0x4d8fd6, transparent: true, opacity: 0.85 })));
    });
  });
  /* 省名水印标签 */
  (PROV_LABELS[key] || []).forEach(function (pl) {
    var xy = toXY(pl[1], pl[2]);
    var lab = textSprite([{ text: pl[0], color: '#4d6f9e', size: 46, bold: true }], { scale: 0.9 });
    lab.material.opacity = 0.55;
    lab.position.set(xy.x, 4, xy.z);
    mapGroup.add(lab);
  });
}

/* ==================== 五之二、卫星夜灯光场 ==================== */
/* 把城市光点晕染成连绵光毯，画在一张地面贴图上（类 NASA 夜景卫星图） */
var lightCanvas = document.createElement('canvas');
lightCanvas.width = lightCanvas.height = 1024;
var lightTex = new THREE.CanvasTexture(lightCanvas);
/* 1996 年静态光场（双屏对比左屏用） */
var lightCanvas96 = document.createElement('canvas');
lightCanvas96.width = lightCanvas96.height = 1024;
var lightTex96 = new THREE.CanvasTexture(lightCanvas96);
var lightPlane = null;
var lightBBox = null; /* km 空间范围 */

function buildLightPlane() {
  var bb = (typeof NIGHT_BOX !== 'undefined') ? NIGHT_BOX[regionKey] : null;
  if (!bb) return;
  lightBBox = bb;
  /* NASA 真实夜灯影像层 */
  if (typeof NIGHT_IMG !== 'undefined' && NIGHT_IMG[regionKey]) {
    var tex = new THREE.TextureLoader().load(NIGHT_IMG[regionKey], function (loadedTexture) {
      /* 即使首帧在贴图完成前渲染，也要立即把夜间底图带回当前场景。 */
      loadedTexture.needsUpdate = true;
      if (nightPlane) {
        nightPlane.visible = !dayOn;
        nightPlane.material.needsUpdate = true;
      }
    });
    tex.minFilter = THREE.LinearFilter;
    nightPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(bb.w, bb.h),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.66, depthWrite: false, side: THREE.DoubleSide })
    );
    nightPlane.rotation.x = -Math.PI / 2;
    /* 保持在行政区填充之上，首屏不用转动视角也能看到卫星夜景。 */
    nightPlane.position.set(bb.cx, -0.06, bb.cz);
    mapGroup.add(nightPlane);
  }
  /* 程序化光场层（叠加于影像之上，联动年份） */
  lightPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(bb.w, bb.h),
    new THREE.MeshBasicMaterial({ map: lightTex, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide })
  );
  lightPlane.rotation.x = -Math.PI / 2;
  lightPlane.position.set(bb.cx, -0.1, bb.cz);
  mapGroup.add(lightPlane);
}

/* GDP 经济地形：行政多边形按经济体量拉伸 */
var terrainGroup = null, terrainOn = false, nightPlane = null;
function buildTerrain() {
  var geo = (typeof GEO_BOUNDARY !== 'undefined') ? GEO_BOUNDARY[regionKey] : null;
  if (!geo) return;
  var R = REGIONS[regionKey];
  terrainGroup = new THREE.Group();
  geo.cities.forEach(function (city) {
    var nm = city.name.replace(/市$/, '');
    var cd = null;
    R.cities.forEach(function (c) { if (c.name === nm) cd = c; });
    var h = cd ? (6 + Math.sqrt(cd.gdp) * 0.5) : 4;
    var base = new THREE.Color(PROV_COLORS[city.prov] || 0x0e1c3e);
    var topMat = new THREE.MeshLambertMaterial({ color: base.clone().multiplyScalar(1.9), transparent: true, opacity: 0.97 });
    var wallMat = new THREE.MeshLambertMaterial({ color: base.clone().multiplyScalar(0.85), transparent: true, opacity: 0.97 });
    city.rings.forEach(function (flat) {
      var shape = new THREE.Shape();
      for (var i = 0; i < flat.length; i += 2) {
        var xy = toXY(flat[i], flat[i + 1]);
        if (i === 0) shape.moveTo(xy.x, -xy.z); else shape.lineTo(xy.x, -xy.z);
      }
      try {
        var g = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false });
        var pa = g.attributes.position.array, bad = false;
        for (var vi = 0; vi < pa.length; vi++) { if (!isFinite(pa[vi])) { bad = true; break; } }
        if (bad) { g.dispose(); return; }
        var m = new THREE.Mesh(g, [topMat, wallMat]);
        m.rotation.x = -Math.PI / 2;
        terrainGroup.add(m);
      } catch (e) {}
    });
  });
  terrainGroup.visible = terrainOn;
  mapGroup.add(terrainGroup);
}

function applyTerrain() {
  if (!terrainGroup) return;
  terrainGroup.visible = terrainOn;
  /* 地形开启时隐藏地面光斑（否则叠加泛光会曝成白团） */
  cityObjs.forEach(function (co) {
    co.glow.visible = !terrainOn;
    co.pillar.visible = !terrainOn; /* 地形本身已是 GDP，避免重复编码 */
    co.tip.visible = !terrainOn;
  });
  if (lightPlane) lightPlane.visible = !terrainOn && !dayOn;
}

function drawLightField(year, cvs, tex) {
  if (!lightBBox) return;
  cvs = cvs || lightCanvas;
  tex = tex || lightTex;
  var ctx = cvs.getContext('2d');
  ctx.clearRect(0, 0, 1024, 1024);
  cityObjs.forEach(function (co) {
    var cd = co.data;
    var k = year == null ? 1 : growthOf(cd, year);
    if (k <= 0.02) return;
    var px = (co.pos.x - lightBBox.minX) / lightBBox.w * 1024;
    var py = (co.pos.z - lightBBox.minZ) / lightBBox.h * 1024;
    var isCore = cd.tier === 0;
    var r = (isCore ? 110 : 26 + Math.sqrt(cd.gdp) * 0.32) * (0.25 + 0.75 * k);
    var g = ctx.createRadialGradient(px, py, 1, px, py, r);
    if (isCore) {
      g.addColorStop(0, 'rgba(255,240,200,' + (0.95 * k + 0.05) + ')');
      g.addColorStop(0.4, 'rgba(255,190,90,0.5)');
      g.addColorStop(1, 'rgba(255,150,50,0)');
    } else {
      g.addColorStop(0, 'rgba(255,225,170,' + (0.85 * k + 0.05) + ')');
      g.addColorStop(0.4, 'rgba(255,165,80,0.38)');
      g.addColorStop(1, 'rgba(255,140,60,0)');
    }
    ctx.fillStyle = g;
    ctx.fillRect(px - r, py - r, r * 2, r * 2);
  });
  tex.needsUpdate = true;
}

function buildRegion(key) {
  regionKey = key;
  var R = REGIONS[key];
  LAT0 = R.center[0]; LON0 = R.center[1];
  clearMap();

  /* 底版：微光圆盘 */
  var disk = new THREE.Mesh(
    new THREE.CircleGeometry(400, 64),
    new THREE.MeshBasicMaterial({ color: 0x0a1430, transparent: true, opacity: 0.85 })
  );
  disk.userData.isDisk = true;
  disk.rotation.x = -Math.PI / 2; disk.position.y = -0.5;
  mapGroup.add(disk);
  /* 网格地面 */
  var grid = new THREE.GridHelper(800, 40, 0x1c3a66, 0x122548);
  grid.position.y = -0.4;
  grid.material.transparent = true; grid.material.opacity = 0.25;
  mapGroup.add(grid);

  buildGeography(key);
  R.rivers.forEach(function (rv) { addLine(rv, 0x1f4d80, 0.55, 0); });

  /* 城市节点 */
  R.cities.forEach(function (cd) {
    var xy = toXY(cd.lat, cd.lon);
    var co = { data: cd, pos: new THREE.Vector3(xy.x, 0, xy.z) };

    /* 地面光斑（夜灯） */
    var isCore = cd.tier === 0;
    var glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: isCore ? TEX.glowGold : TEX.glowWarm,
      transparent: true, opacity: 0.34, depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    var gsz = (isCore ? 76 : 30 + Math.sqrt(cd.gdp) * 0.24);
    glow.scale.set(gsz, gsz, 1);
    glow.position.set(xy.x, 2, xy.z);
    mapGroup.add(glow);
    co.glow = glow; co.glowSize = gsz;

    /* GDP 光柱 */
    var h = Math.sqrt(cd.gdp) * 0.8 + 8;
    var pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(isCore ? 5 : 3, isCore ? 7 : 4.5, h, 12, 1, true),
      new THREE.MeshBasicMaterial({
        color: isCore ? 0xffc233 : (cd.tier === 1 ? 0x38e0ff : 0x7a9fd0),
        transparent: true, opacity: 0.25, side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending, depthWrite: false
      })
    );
    pillar.position.set(xy.x, h / 2, xy.z);
    mapGroup.add(pillar);
    co.pillar = pillar; co.pillarH = h;

    /* 柱顶光点 */
    var tip = new THREE.Sprite(new THREE.SpriteMaterial({
      map: TEX.glowCyan, transparent: true, opacity: 0.50, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    tip.scale.set(11, 11, 1);
    tip.position.set(xy.x, h + 8, xy.z);
    mapGroup.add(tip);
    co.tip = tip;

    /* 标注（错落高度防重叠） */
    var stagger = (cd.name.charCodeAt(0) + cd.name.length) % 3;
    var label = textSprite([{ text: cd.name, color: isCore ? '#ffd76a' : '#dce8ff', size: isCore ? 52 : 40 }], { scale: 0.45 });
    label.position.set(xy.x + (cd.lx || 0), h + 36 + stagger * 22 + (cd.ly || 0), xy.z);
    mapGroup.add(label);
    co.label = label;

    /* 点击热区 */
    var hit = new THREE.Mesh(
      new THREE.CylinderGeometry(16, 16, h + 60, 8),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hit.position.set(xy.x, (h + 60) / 2, xy.z);
    hit.userData.city = co;
    mapGroup.add(hit);
    co.hit = hit;

    cityObjs.push(co);
  });

  /* 圈层圆环（默认隐藏，rings 模式显示） */
  var coreCity = null;
  cityObjs.forEach(function (co) { if (co.data.name === R.cores[0]) coreCity = co; });
  RING_DEFS.forEach(function (rd, idx) {
    var geo = new THREE.RingGeometry(rd.radius - 3, rd.radius + 3, 96);
    var mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color: rd.color, transparent: true, opacity: 0.16,
      side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(coreCity.pos.x, 1 + idx * 0.4, coreCity.pos.z);
    mesh.visible = false;
    mapGroup.add(mesh);
    var edge = new THREE.Mesh(
      new THREE.RingGeometry(rd.radius + 3, rd.radius + 8, 96),
      new THREE.MeshBasicMaterial({ color: rd.color, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    edge.rotation.x = -Math.PI / 2;
    edge.position.copy(mesh.position);
    edge.visible = false;
    mapGroup.add(edge);

    var lab = textSprite([{ text: rd.name + ' · ' + rd.radius + 'km', color: '#fff', size: 40 }], {
      scale: 0.28, bg: 'rgba(8,14,32,0.75)', border: 'rgba(255,255,255,0.25)'
    });
    lab.position.set(coreCity.pos.x, 14, coreCity.pos.z + rd.radius); /* 放在近景侧，避开城市名 */
    lab.visible = false;
    mapGroup.add(lab);
    ringObjs.push({ def: rd, disk: mesh, edge: edge, label: lab });
  });

  /* 夜灯光场地面 + 经济地形 + 统一缩放（按数据坐标计算，免疫退化几何） */
  buildLightPlane();
  drawLightField(null);
  drawLightField(1996, lightCanvas96, lightTex96); /* 预渲 1996 光场，双屏对比左屏用 */
  buildTerrain();
  var mm = { minX: 1e9, maxX: -1e9, minZ: 1e9, maxZ: -1e9 };
  function feedXY(x, z) {
    if (!isFinite(x) || !isFinite(z)) return;
    mm.minX = Math.min(mm.minX, x); mm.maxX = Math.max(mm.maxX, x);
    mm.minZ = Math.min(mm.minZ, z); mm.maxZ = Math.max(mm.maxZ, z);
  }
  cityObjs.forEach(function (co) { feedXY(co.pos.x, co.pos.z); });
  if (typeof GEO_BOUNDARY !== 'undefined') {
    GEO_BOUNDARY[key].cities.forEach(function (city) {
      city.rings.forEach(function (flat) {
        for (var i = 0; i < flat.length; i += 2) {
          var xy = toXY(flat[i], flat[i + 1]);
          feedXY(xy.x, xy.z);
        }
      });
    });
  }
  mapScale = 3.6 / Math.max(mm.maxX - mm.minX, mm.maxZ - mm.minZ);
  mapGroup.scale.setScalar(mapScale);
  mapGroup.position.y = 0.01;

  flowGroup = new THREE.Group();
  mapGroup.add(flowGroup);

  /* 灯光阶段标注（仅 lights 模式显示其一） */
  stageSprites = [];
  var STAGES = [
    { text: '阶段① 核心集聚：核心城市一市独大', color: '#ffd76a' },
    { text: '阶段② 多点兴起：周边城市陆续点亮', color: '#7fe9ff' },
    { text: '阶段③ 轴带连片：沿交通轴连成网络', color: '#ff9a5c' },
    { text: '阶段④ 成熟群落：世界级城市群形成', color: '#6dffb8' }
  ];
  STAGES.forEach(function (st, i) {
    var sp = textSprite([{ text: st.text, color: st.color, size: 40 }], { scale: 0.62, bg: 'rgba(8,14,32,0.8)', border: st.color });
    var bb = lightBBox || { minX: -200, w: 400, minZ: -200, h: 400 };
    sp.position.set(bb.minX + bb.w * 0.5, 120, bb.minZ + bb.h * 0.06);
    sp.visible = false;
    mapGroup.add(sp);
    stageSprites.push(sp);
  });
}

/* ==================== 六、模式逻辑 ==================== */
var currentMode = 'lights';
var yearValue = 2022;
var activeRing = -1;
var flowType = 'industry';
var bidirOn = false;
var radiation = 1.0;
var yearPlaying = false;

/* ---------- 灯光变迁 ---------- */
function growthOf(cd, year) {
  var start = 1990 + cd.tier * 5;
  var full = 2012 + cd.tier * 3;
  var k = clamp((year - start) / (full - start), 0, 1);
  /* 1990 年核心城市本就已亮（符合史实），紧密层微亮 */
  var floorV = cd.tier === 0 ? 0.38 : (cd.tier === 1 ? 0.10 : 0.03);
  return Math.max(k, year >= start ? floorV : 0.02);
}

/* 只更新对象状态（双屏对比逐帧调用：不画 canvas、不碰 UI） */
function applyYearObjects(year) {
  cityObjs.forEach(function (co) {
    var k = growthOf(co.data, year);
    var e = 0.28 + 0.56 * k;
    co.glow.scale.set(co.glowSize * e, co.glowSize * e, 1);
    co.glow.material.opacity = 0.08 + 0.26 * k;
    var sy = Math.max(0.03, k);
    co.pillar.scale.y = sy;
    co.pillar.position.y = co.pillarH * sy / 2;
    co.pillar.material.opacity = 0.06 + 0.19 * k;
    co.tip.material.opacity = k > 0.55 ? 0.50 : 0;
    co.label.material.opacity = k > 0.55 ? 1 : 0;
  });
  if (nightPlane) nightPlane.material.opacity = 0.38 + 0.28 * clamp((year - 1990) / 32, 0, 1);
}

function applyLightsYear(year) {
  yearValue = year;
  $('year').value = year;
  $('yearVal').textContent = year + ' 年';
  $('yearNum').textContent = year;
  updateRangeFill($('year'));
  applyYearObjects(year);
  drawLightField(year);
  /* 阶段解释已在右侧信息卡呈现，场景内浮标会与平台 HUD 争夺空间。 */
  stageSprites.forEach(function (sp) { sp.visible = false; });
  renderLightEvidence(year);
  var syr = $('splitYearR');
  if (syr) syr.textContent = year + ' 年';
}

function lightsCaption(year) {
  if (year < 2000) return '<b>' + year + '</b>：核心城市一市独大，灯光孤立分散，周边尚在沉睡。';
  if (year < 2010) return '<b>' + year + '</b>：周边城市陆续被点亮，光点增多——工业化、城市化加速。';
  if (year < 2018) return '<b>' + year + '</b>：灯光沿交通轴连片，城市群轮廓成形。';
  return '<b>' + year + '</b>：光带绵延、几乎无暗区——世界级城市群基本形成。';
}

function lightStageFor(year) {
  var current = LIGHT_STAGES[0];
  LIGHT_STAGES.forEach(function (stage) { if (year >= stage.year) current = stage; });
  return current;
}

/* 由同一套年份增长系数推导课堂观察量，避免读数与画面脱节。 */
function lightEvidenceFor(year) {
  var cities = REGIONS[regionKey].cities;
  var active = 0, sum = 0, near = 0, nearCount = 0;
  cities.forEach(function (city) {
    var growth = growthOf(city, year);
    if (growth >= 0.20) active++;
    sum += growth;
    if (city.tier <= 1) { near += growth; nearCount++; }
  });
  return {
    active: active,
    link: Math.round(sum / cities.length * 100),
    commute: Math.round(near / Math.max(nearCount, 1) * 100)
  };
}

function renderLightEvidence(year) {
  var host = $('lightEvidence');
  if (!host) return;
  var evidence = lightEvidenceFor(year);
  var stage = lightStageFor(year);
  var presets = document.querySelectorAll('.year-preset');
  for (var i = 0; i < presets.length; i++) {
    presets[i].classList.toggle('active', parseInt(presets[i].dataset.year, 10) === stage.year);
  }
  host.innerHTML =
    '<div class="evidence-head"><span>模型证据</span><b>' + stage.title + '</b></div>' +
    '<div class="evidence-metrics">' +
      '<span><b>' + evidence.active + '</b>亮点节点</span>' +
      '<span><b>' + evidence.link + '</b>连片指数</span>' +
      '<span><b>' + evidence.commute + '</b>紧密联系</span>' +
    '</div>' +
    '<p>' + stage.cue + '</p>';
}

/* ---------- 圈层结构 ---------- */
var RING_COLORS_CSS = ['#ffc233', '#38e0ff', '#c58bff'];
function selectRing(idx) {
  activeRing = idx;
  var btns = document.querySelectorAll('.ring-btn');
  for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('active', i === idx);
  ringObjs.forEach(function (ro, i) {
    var on = i === idx;
    ro.disk.material.opacity = on ? 0.42 : 0.10;
    ro.edge.material.opacity = on ? 1 : 0.25;
    ro.label.visible = on && $('optDist').checked;
  });
  /* 突出当前圈层城市，其余调暗隐身 */
  cityObjs.forEach(function (co) {
    var inTier = co.data.tier === idx;
    co.glow.material.opacity = inTier ? 0.58 : 0.12;
    co.pillar.material.opacity = inTier ? 0.38 : 0.06;
    co.tip.material.opacity = inTier ? 0.72 : 0.12;
    co.label.material.opacity = inTier ? 1 : 0.12;
  });
  if (idx >= 0) showRingInfo(idx);
}

function setRingsVisible(v) {
  ringObjs.forEach(function (ro) {
    ro.disk.visible = v; ro.edge.visible = v;
    ro.label.visible = false;
  });
  if (v) selectRing(activeRing < 0 ? 0 : activeRing);
}

/* ---------- 辐射网络 ---------- */
var flowArcs = [];   // {line, curve, parts:[{sp,t,speed}], baseOpacity}
function clearFlows() {
  flowArcs = [];
  if (flowGroup) {
    for (var i = flowGroup.children.length - 1; i >= 0; i--) flowGroup.remove(flowGroup.children[i]);
  }
}

function buildFlows() {
  clearFlows();
  var R = REGIONS[regionKey];
  var ft = FLOW_TYPES[flowType];
  var tex = flowType === 'industry' ? TEX.glowWarm : (flowType === 'traffic' ? TEX.glowCyan : TEX.glowPurple);

  var cores = [];
  cityObjs.forEach(function (co) { if (R.cores.indexOf(co.data.name) >= 0) cores.push(co); });

  var maxG = 1;
  cityObjs.forEach(function (co) { maxG = Math.max(maxG, co.data.gdp); });

  function addArc(a, b, weight, isCoreLink) {
    var dist = a.pos.distanceTo(b.pos);
    var mid = a.pos.clone().add(b.pos).multiplyScalar(0.5);
    mid.y = dist * (isCoreLink ? 0.28 : 0.20) + 10;
    var curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(a.pos.x, 4, a.pos.z), mid, new THREE.Vector3(b.pos.x, 4, b.pos.z)
    );
    var g = new THREE.BufferGeometry().setFromPoints(curve.getPoints(48));
    var line = new THREE.Line(g, new THREE.LineBasicMaterial({
      color: ft.color, transparent: true,
      opacity: (isCoreLink ? 0.75 : 0.3 + weight * 0.5) * clamp(radiation, 0.3, 1.2),
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    flowGroup.add(line);

    var parts = [];
    var n = Math.round((isCoreLink ? 6 : 1 + weight * 5) * radiation);
    for (var i = 0; i < n; i++) {
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
      }));
      var sz = isCoreLink ? 22 : 12 + weight * 8;
      sp.scale.set(sz, sz, 1);
      flowGroup.add(sp);
      parts.push({ sp: sp, t: i / n, speed: (flowType === 'traffic' ? 0.28 : 0.16) * (0.8 + Math.random() * 0.4) });
    }
    flowArcs.push({ line: line, curve: curve, parts: parts });
  }

  cores.forEach(function (core) {
    cityObjs.forEach(function (co) {
      if (co === core) return;
      var isCoreLink = co.data.tier === 0;
      var weight = 0.3 + 0.7 * (co.data.gdp / maxG);
      if (co.data.tier === 1) weight += 0.25;
      addArc(core, co, clamp(weight, 0, 1), isCoreLink);
    });
  });

  /* 双向辐射：周边反哺核心的回流粒子（青绿色，反向） */
  if (bidirOn) {
    cores.forEach(function (core) {
      cityObjs.forEach(function (co) {
        if (co === core || co.data.tier === 0) return;
        var dist = core.pos.distanceTo(co.pos);
        var mid = core.pos.clone().add(co.pos).multiplyScalar(0.5);
        mid.y = dist * 0.14 + 8;
        var curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(core.pos.x, 4, core.pos.z), mid, new THREE.Vector3(co.pos.x, 4, co.pos.z)
        );
        var parts = [];
        var n = 1 + Math.round(2 * radiation);
        for (var i = 0; i < n; i++) {
          var sp = new THREE.Sprite(new THREE.SpriteMaterial({
            map: TEX.glowCyan, color: 0x6dffb8, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
          }));
          sp.scale.set(10, 10, 1);
          flowGroup.add(sp);
          parts.push({ sp: sp, t: i / n, speed: -0.13 * (0.8 + Math.random() * 0.4) });
        }
        flowArcs.push({ line: null, curve: curve, parts: parts });
      });
    });
  }

  /* 发展轴带：高亮走廊 + 快速粒子 */
  (AXES[regionKey] || []).forEach(function (axis) {
    var pts = [];
    axis.cities.forEach(function (cn) {
      cityObjs.forEach(function (co) { if (co.data.name === cn) pts.push(new THREE.Vector3(co.pos.x, 3, co.pos.z)); });
    });
    if (pts.length < 2) return;
    var curve = new THREE.CatmullRomCurve3(pts);
    var g = new THREE.BufferGeometry().setFromPoints(curve.getPoints(80));
    var line = new THREE.Line(g, new THREE.LineBasicMaterial({
      color: ft.color, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    flowGroup.add(line);
    var parts = [];
    for (var i = 0; i < 8; i++) {
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
      }));
      sp.scale.set(16, 16, 1);
      flowGroup.add(sp);
      parts.push({ sp: sp, t: i / 8, speed: 0.22 });
    }
    flowArcs.push({ line: line, curve: curve, parts: parts });
    /* 轴带名称标签 */
    var midPt = curve.getPoint(0.5);
    var lab = textSprite([{ text: axis.name, color: ft.css, size: 36 }], { scale: 0.42, bg: 'rgba(8,14,32,0.7)', border: ft.css });
    lab.position.set(midPt.x, 26, midPt.z);
    flowGroup.add(lab);
  });
}

function updateFlows(dt) {
  for (var i = 0; i < flowArcs.length; i++) {
    var fa = flowArcs[i];
    for (var j = 0; j < fa.parts.length; j++) {
      var p = fa.parts[j];
      p.t = (p.t + dt * p.speed * radiation) % 1;
      if (p.t < 0) p.t += 1;
      p.sp.position.copy(fa.curve.getPoint(p.t));
    }
  }
}

/* ---------- 模式切换 ---------- */
function setMode(m) {
  currentMode = m;
  visitedModes[m] = true;
  updateLearningPath();
  var btns = document.querySelectorAll('.mode-btn');
  for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('active', btns[i].dataset.mode === m);
  $('modeDesc').textContent = MODE_DESC[m];
  var blocks = document.querySelectorAll('.ctl-block');
  for (var j = 0; j < blocks.length; j++) {
    blocks[j].hidden = blocks[j].dataset.for.split(' ').indexOf(m) < 0;
  }
  $('yearHud').style.display = m === 'lights' ? 'block' : 'none';

  /* 离开模块时的状态清理 */
  if (splitOn && m !== 'lights') toggleSplit(false);

  if (m === 'flows') buildFlows(); else clearFlows();

  if (m === 'lights') applyLightsYear(yearValue);
  else {
    cityObjs.forEach(function (co) {
      co.glow.scale.set(co.glowSize, co.glowSize, 1);
      co.glow.material.opacity = 0.34;
      co.pillar.scale.y = 1;
      co.pillar.position.y = co.pillarH / 2;
      co.pillar.material.opacity = 0.25;
      co.tip.material.opacity = 0.50;
      co.label.material.opacity = 1;
    });
    drawLightField(null);
    if (nightPlane) nightPlane.material.opacity = 0.66;
  }
  setRingsVisible(m === 'rings');
  applyLabelDensity();
  if (m !== 'lights') stageSprites.forEach(function (sp) { sp.visible = false; });
  if (m === 'compare') showCompareInfo(regionKey);
  else if (m === 'flows') showFlowInfo();
  else if (m === 'lights') showLightsInfo();
  updateLegend();
}

/* ---------- 图例 ---------- */
function updateLegend() {
  var html = '<div class="lg-title">图 例</div>';
  if (currentMode === 'lights') {
    html += '<div class="lg-row"><span class="chip" style="background:#ffc233;color:#ffc233"></span>核心城市灯光</div>'
          + '<div class="lg-row"><span class="chip" style="background:#ff9a5c;color:#ff9a5c"></span>周边城市灯光</div>'
          + '<div class="lg-row"><span class="chip" style="background:#2f6db3;color:#2f6db3"></span>海岸线 / 河流</div>';
  } else if (currentMode === 'rings') {
    RING_DEFS.forEach(function (rd, i) {
      html += '<div class="lg-row"><span class="chip" style="background:' + RING_COLORS_CSS[i] + ';color:' + RING_COLORS_CSS[i] + '"></span>' + rd.name + '（' + rd.radius + ' km）</div>';
    });
  } else if (currentMode === 'flows') {
    Object.keys(FLOW_TYPES).forEach(function (k) {
      var ft = FLOW_TYPES[k];
      html += '<div class="lg-row"><span class="chip" style="background:' + ft.css + ';color:' + ft.css + '"></span>' + ft.name + '</div>';
    });
    if (bidirOn) html += '<div class="lg-row"><span class="chip" style="background:#6dffb8;color:#6dffb8"></span>反哺回流（劳动力 · 市场）</div>';
    html += '<div class="lg-row"><span class="chip" style="background:#ffffff;color:#ffffff"></span>高亮线 = 发展轴带</div>';
  } else {
    html += '<div class="lg-row"><span class="chip" style="background:#ffc233;color:#ffc233"></span>长三角</div>'
          + '<div class="lg-row"><span class="chip" style="background:#38e0ff;color:#38e0ff"></span>京津冀</div>'
          + '<div class="lg-row"><span class="chip" style="background:#c58bff;color:#c58bff"></span>粤港澳</div>';
  }
  $('legend').innerHTML = html;
}

/* ---------- 信息卡 ---------- */
function showLightsInfo() {
  var evidence = lightEvidenceFor(yearValue);
  var stage = lightStageFor(yearValue);
  $('infoCard').innerHTML =
    '<h3>🌃 灯光里的城市群 · ' + stage.title + '</h3>' +
    '<p>' + lightsCaption(yearValue) + '</p>' +
    '<div class="kpi"><div class="k"><b>' + evidence.active + '</b><span>亮点节点</span></div><div class="k"><b>' + evidence.link + '</b><span>连片指数</span></div><div class="k"><b>' + evidence.commute + '</b><span>紧密联系</span></div></div>' +
    '<h4>判读</h4><p>亮点增多并沿走廊连片，说明交通改善、产业扩散和人口流动正在加强城市之间的联系。</p>' +
    '<p><span class="tag">模型指数，用于比较趋势</span><span class="tag">夜间灯光是经济活跃度的代理证据</span></p>';
}

function showRingInfo(idx) {
  var rd = RING_DEFS[idx < 0 ? 0 : idx];
  var R = REGIONS[regionKey];
  var cities = R.cities.filter(function (c) { return c.tier === rd.key; }).map(function (c) { return c.name; }).join('、');
  $('infoCard').innerHTML =
    '<h3>🎯 ' + rd.name + '</h3>' +
    '<p>' + rd.desc + '</p>' +
    '<h4>代表城市</h4><p>' + cities + '</p>' +
    '<h4>判读依据</h4><p>该圈层以联系强度和通勤可达性为教学示意，不是规则行政边界。距核心越近，同城化程度通常越高；向外则更依赖产业协作和交通走廊。</p>' +
    '<p><span class="tag">核心：功能集聚</span><span class="tag">紧密：约 1 小时通勤</span><span class="tag">辐射：要素协作</span></p>';
}

function showFlowInfo() {
  var ft = FLOW_TYPES[flowType];
  var flowCase = FLOW_CASES[regionKey][flowType];
  $('infoCard').innerHTML =
    '<h3>🌊 辐射通道 · ' + ft.name + '</h3>' +
    '<p>' + ft.desc + '</p>' +
    '<div class="cause-card"><b>' + flowCase.route + '</b><span>驱动：' + flowCase.driver + '</span><span>结果：' + flowCase.result + '</span></div>' +
    '<p><span class="tag">高亮走廊 = 发展轴带</span>' + (bidirOn ? '<span class="tag">青绿粒子 = 周边反哺核心</span>' : '') + '</p>' +
    '<h4>探究任务</h4><p>改变辐射强度后，观察网络覆盖如何变化；再打开双向辐射，判断周边城市向核心提供的劳动力、市场与专业化服务。</p>';
}

function showCompareInfo(sel) {
  var keys = ['yrd', 'jjj', 'gba'];
  var names = { yrd: '长三角', jjj: '京津冀', gba: '粤港澳' };
  var colors = { yrd: '#ffc233', jjj: '#38e0ff', gba: '#c58bff' };
  function bars(label, unit, get) {
    var max = 0;
    keys.forEach(function (k) { max = Math.max(max, get(COMPARE[k])); });
    var h = '<div class="bar-row"><div class="bar-label"><span>' + label + '</span><span>' + unit + '</span></div>';
    keys.forEach(function (k) {
      var pct = Math.round(get(COMPARE[k]) / max * 100);
      h += '<div class="compare-bar"><span style="color:' + colors[k] + '">' + names[k] + '</span><div class="bar-track"><div class="bar-fill" data-w="' + pct + '" style="background:' + colors[k] + ';color:' + colors[k] + '"></div></div></div>';
    });
    return h + '</div>';
  }
  $('infoCard').innerHTML =
    '<h3>⚖️ 三大城市群对比</h3>' +
    bars('区域面积', '万 km²', function (c) { return c.area; }) +
    bars('常住人口', '亿人', function (c) { return c.pop; }) +
    bars('经济总量', '万亿元', function (c) { return c.gdp; }) +
    '<h4>' + names[sel] + ' · 协同模式</h4><p>' + COMPARE[sel].point + '</p>' +
    '<p><b>空间结构：</b>' + COMPARE[sel].structure + '</p>' +
    '<p><b>需要解决：</b>' + COMPARE[sel].challenge + '</p>';
  setTimeout(function () {
    var fills = $('infoCard').querySelectorAll('.bar-fill');
    for (var i = 0; i < fills.length; i++) fills[i].style.width = fills[i].dataset.w + '%';
  }, 60);
}

var visitedModes = { lights: true };
function updateLearningPath() {
  var host = $('learningPath');
  if (!host) return;
  var steps = [
    { mode: 'lights', name: '看灯光变化' },
    { mode: 'rings', name: '辨都市圈层' },
    { mode: 'flows', name: '析辐射机制' },
    { mode: 'compare', name: '比协同模式' }
  ];
  host.innerHTML = steps.map(function (step, index) {
    var state = visitedModes[step.mode] ? ' is-done' : '';
    return '<span class="learning-step' + state + '"><b>' + (index + 1) + '</b>' + step.name + '</span>';
  }).join('');
}

function showConclusion() {
  var evidence = lightEvidenceFor(yearValue);
  var complete = Object.keys(visitedModes).length === 4;
  $('infoCard').innerHTML =
    '<h3>🧭 学习结论</h3>' +
    '<p><b>观察：</b>' + yearValue + ' 年，模型中出现 ' + evidence.active + ' 个亮点节点，连片指数为 ' + evidence.link + '。</p>' +
    '<p><b>解释：</b>交通改善压缩时空距离，产业、人口与资本沿通道流动，核心城市的辐射由点状扩展为网络化联系。</p>' +
    '<p><b>结论：</b>城市群不是城市简单聚集，而是核心城市与周边城市通过分工协作、通勤联系和公共服务共享形成的区域网络。</p>' +
    '<p><span class="tag">' + (complete ? '四个探究模块已完成' : '继续完成四个探究模块，比较不同协同路径') + '</span></p>';
}

function showCityInfo(co) {
  var cd = co.data;
  var tierName = RING_DEFS[cd.tier].name;
  $('infoCard').innerHTML =
    '<h3>🏙️ ' + cd.name + '</h3>' +
    '<span class="tag">' + tierName + '</span><span class="tag">' + cd.industry + '</span>' +
    '<div class="kpi">' +
    '<div class="k"><b>' + (cd.gdp >= 10000 ? (cd.gdp / 10000).toFixed(1) + ' 万亿' : cd.gdp + ' 亿') + '</b><span>地区生产总值</span></div>' +
    '<div class="k"><b>' + cd.pop + ' 万</b><span>常住人口</span></div>' +
    '</div>' +
    (cd.accept ? '<h4>协同角色</h4><p>' + cd.accept + '</p>'
               : '<p>在' + tierName + '上承接核心城市的辐射带动，发展特色产业，融入城市群分工体系。</p>');
}

/* ==================== 七、点击拾取与镜头飞行 ==================== */
var camHome = { pos: new THREE.Vector3(0, 2.35, 2.1), tgt: new THREE.Vector3(0, 0, 0) };
var focusedCity = null;

function flyTo(pos, tgt, dur, onDone) {
  /* 杀掉进行中的相机补间（含开场飞行），避免互相覆盖 */
  for (var i = tweens.length - 1; i >= 0; i--) { if (tweens[i].tag === 'cam') tweens.splice(i, 1); }
  var fp = camera.position.clone(), ft = pos.clone();
  var tp = controls.target.clone(), tt = tgt.clone();
  tween({
    tag: 'cam',
    dur: dur || 1.2,
    update: function (k) {
      camera.position.lerpVectors(fp, ft, k);
      controls.target.lerpVectors(tp, tt, k);
    },
    complete: function () { if (onDone) onDone(); }
  });
}

function focusCity(co) {
  focusedCity = co;
  mapGroup.updateMatrixWorld(true);
  var wp = co.pos.clone();
  mapGroup.localToWorld(wp);
  /* 光斑世界半径决定取景距离：中景框住城市与邻城，防止冲入光斑过曝 */
  var gr = co.glowSize * mapScale;
  var dist = clamp(gr * 1.05 + 0.45, 1.0, 2.0);
  var dir = wp.clone(); dir.y = 0;
  if (dir.length() < 0.01) dir.set(0.7, 0, 0.7);
  dir.normalize();
  var camPos = wp.clone().add(dir.multiplyScalar(dist));
  camPos.y = wp.y + dist * 0.58;
  controls.minDistance = 0.3; /* 允许近距离特写 */
  flyTo(camPos, wp, 1.3);
  /* 聚焦聚光灯：其它城市调暗，主角突出（flyHome 时 setMode 恢复） */
  cityObjs.forEach(function (c) {
    if (c === co) return;
    c.glow.material.opacity *= 0.3;
    c.pillar.material.opacity *= 0.4;
    c.label.material.opacity *= 0.35;
  });
}

function flyHome(restoreInfo) {
  if (!focusedCity) return;
  focusedCity = null;
  controls.minDistance = 1.1;
  flyTo(camHome.pos, camHome.tgt, 1.1);
  if (restoreInfo === false) return;
  setMode(currentMode); /* 恢复各城市光效与信息卡 */
}

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
  var hits = [];
  cityObjs.forEach(function (co) { hits.push(co.hit); });
  var found = raycaster.intersectObjects(hits);
  if (found.length) {
    var co = found[0].object.userData.city;
    showCityInfo(co);
    focusCity(co); /* 镜头飞行聚焦 */
    tween({
      dur: 0.7,
      update: function (k) {
        var s = 1 + Math.sin(k * Math.PI) * 0.45;
        co.tip.scale.set(26 * s, 26 * s, 1);
      }
    });
    return;
  }
  /* rings 模式：点击圆环切换圈层 */
  if (currentMode === 'rings') {
    var rMeshes = [];
    ringObjs.forEach(function (ro, i) {
      ro.disk.userData.ringIdx = i; ro.edge.userData.ringIdx = i;
      rMeshes.push(ro.disk, ro.edge);
    });
    var rFound = raycaster.intersectObjects(rMeshes);
    if (rFound.length) { selectRing(rFound[0].object.userData.ringIdx); return; }
  }
  flyHome(); /* 点击空白处：返回全景 */
});

/* ==================== 七之二、双屏对比（1996 vs 当前年份） ==================== */
var splitOn = false;
function toggleSplit(on) {
  splitOn = (on === undefined) ? !splitOn : on;
  $('splitHud').classList.toggle('show', splitOn);
  $('splitBtn').textContent = splitOn ? '✕ 退出双屏对比' : '⇄ 双屏对比 · 1996 vs 现在';
  $('yearHud').style.visibility = splitOn ? 'hidden' : 'visible'; /* 年份角标由双屏标签接管 */
  if (splitOn) {
    var syr = $('splitYearR'); if (syr) syr.textContent = yearValue + ' 年';
    drawLightField(1996, lightCanvas96, lightTex96);
  } else {
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, wrap.clientWidth, wrap.clientHeight);
    if (lightPlane) lightPlane.map = lightTex;
    applyLightsYear(yearValue);
  }
}

function renderSplit() {
  var w = wrap.clientWidth, h = wrap.clientHeight;
  renderer.setScissorTest(true);
  /* 左半屏：1996 */
  applyYearObjects(1996);
  if (lightPlane) lightPlane.map = lightTex96;
  renderer.setViewport(0, 0, Math.floor(w / 2), h);
  renderer.setScissor(0, 0, Math.floor(w / 2), h);
  renderer.render(scene, camera);
  /* 右半屏：当前年份 */
  applyYearObjects(yearValue);
  if (lightPlane) lightPlane.map = lightTex;
  renderer.setViewport(Math.floor(w / 2), 0, w - Math.floor(w / 2), h);
  renderer.setScissor(Math.floor(w / 2), 0, w - Math.floor(w / 2), h);
  renderer.render(scene, camera);
  renderer.setScissorTest(false);
  renderer.setViewport(0, 0, w, h);
}

/* ==================== 七之四、日间底图 ==================== */
var dayOn = false;
function applyDay() {
  scene.background.set(dayOn ? 0x2b5a94 : 0x04081a);
  scene.fog.color.set(dayOn ? 0x2b5a94 : 0x04081a);
  if (nightPlane) nightPlane.visible = !dayOn;
  if (lightPlane) lightPlane.visible = !dayOn && !terrainOn;
  mapGroup.traverse(function (o) {
    if (o.userData && o.userData.provFill) {
      o.material.color.set(o.userData.fillColor).multiplyScalar(dayOn ? 2.6 : 1);
    } else if (o.userData && o.userData.isDisk) {
      o.material.color.set(dayOn ? 0x1c3f70 : 0x0a1430);
    }
  });
  scene.traverse(function (o) { if (o.userData && o.userData.isStars) o.visible = !dayOn; });
}

/* ==================== 七之五、演示快捷键 ==================== */
document.addEventListener('keydown', function (e) {
  if ($('quizModal').classList.contains('open')) return;
  var tag = (e.target && e.target.tagName) || '';
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  var modes = { '1': 'lights', '2': 'rings', '3': 'flows', '4': 'compare' };
  if (modes[e.key]) { setMode(modes[e.key]); return; }
  if (e.key === ' ') { e.preventDefault(); if (currentMode === 'lights') $('yearPlay').click(); return; }
  if (e.key === 'f' || e.key === 'F') {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
    return;
  }
  if (e.key === 'Escape') flyHome();
});

/* ==================== 八、UI 绑定 ==================== */
function updateRangeFill(input) {
  var min = parseFloat(input.min || 0), max = parseFloat(input.max || 100);
  var pct = (parseFloat(input.value) - min) / (max - min) * 100;
  input.style.setProperty('--fill', pct + '%');
}

var spinOn = false, spinAccum = 0, yearPlayT = 0, labelsOn = true;

function applyLabelDensity() {
  var compact = window.innerWidth <= 640;
  cityObjs.forEach(function (co) {
    /* 窄屏优先保留核心与紧密层，避免地名互相遮挡。 */
    co.label.visible = labelsOn && (!compact || co.data.tier <= 1);
  });
}

function bindUI() {
  var modeBtns = document.querySelectorAll('.mode-btn');
  for (var i = 0; i < modeBtns.length; i++) {
    modeBtns[i].onclick = function () { setMode(this.dataset.mode); };
  }

  $('year').oninput = function () {
    yearPlaying = false;
    $('yearPlay').textContent = '▶ 播放灯光扩张';
    applyLightsYear(parseInt(this.value, 10));
    if (currentMode === 'lights') showLightsInfo();
  };
  var yearPresets = document.querySelectorAll('.year-preset');
  for (var yp = 0; yp < yearPresets.length; yp++) {
    yearPresets[yp].onclick = function () {
      yearPlaying = false;
      $('yearPlay').textContent = '▶ 播放灯光扩张';
      applyLightsYear(parseInt(this.dataset.year, 10));
      if (currentMode === 'lights') showLightsInfo();
    };
  }
  $('yearPlay').onclick = function () {
    if (yearPlaying) { yearPlaying = false; this.textContent = '▶ 播放灯光扩张'; return; }
    yearPlaying = true;
    yearPlayT = 0;
    this.textContent = '⏸ 暂停播放';
  };

  var ringBtns = document.querySelectorAll('.ring-btn');
  for (var ri = 0; ri < ringBtns.length; ri++) {
    ringBtns[ri].onclick = function () { selectRing(parseInt(this.dataset.ring, 10)); };
  }
  $('optDist').onchange = function () { selectRing(activeRing < 0 ? 0 : activeRing); };

  var flowBtns = document.querySelectorAll('.flow-btn');
  for (var fi = 0; fi < flowBtns.length; fi++) {
    flowBtns[fi].onclick = function () {
      for (var j = 0; j < flowBtns.length; j++) flowBtns[j].classList.remove('active');
      this.classList.add('active');
      flowType = this.dataset.flow;
      buildFlows();
      showFlowInfo();
      updateLegend();
    };
  }
  $('radiation').oninput = function () {
    radiation = parseFloat(this.value);
    $('radVal').textContent = radiation.toFixed(1) + '×';
    updateRangeFill(this);
    buildFlows();
  };
  $('optBidir').onchange = function () {
    bidirOn = this.checked;
    buildFlows();
    showFlowInfo();
    updateLegend();
  };

  var regionBtns = document.querySelectorAll('.region-btn');
  for (var gi = 0; gi < regionBtns.length; gi++) {
    regionBtns[gi].onclick = function () {
      for (var j = 0; j < regionBtns.length; j++) regionBtns[j].classList.remove('active');
      this.classList.add('active');
      buildRegion(this.dataset.region);
      setMode(currentMode);
      showCompareInfo(this.dataset.region);
    };
  }

  $('optTerrain').onchange = function () {
    terrainOn = this.checked;
    applyTerrain();
  };
  $('optLabels').onchange = function () {
    labelsOn = this.checked;
    applyLabelDensity();
  };
  $('optSpin').onchange = function () { spinOn = this.checked; };
  $('optDay').onchange = function () { dayOn = this.checked; applyDay(); };
  $('splitBtn').onclick = function () { toggleSplit(); };
  $('conclusionBtn').onclick = showConclusion;

  $('quizBtn').onclick = openQuiz;
  $('quizClose').onclick = function () { $('quizModal').classList.remove('open'); };
  $('quizModal').addEventListener('click', function (e) {
    if (e.target === this) this.classList.remove('open');
  });

  var ranges = document.querySelectorAll('input[type="range"]');
  for (var j = 0; j < ranges.length; j++) updateRangeFill(ranges[j]);
  updateLearningPath();
  applyLabelDensity();
}

/* ==================== 九、课堂小测 ==================== */
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
  var comment = pct === 1 ? '满分！你已经完全掌握城市群协同发展的核心逻辑，老师为你点赞！🌟'
    : pct >= 0.6 ? '不错！核心概念已掌握，回到地图再玩玩辐射网络，理解会更深。'
    : '别灰心！建议重走一遍「灯光变迁 → 圈层结构 → 辐射网络」，边玩边总结。';
  $('quizBody').innerHTML =
    '<div class="q-score"><div class="big">' + qScore + ' / ' + QUIZ.length + '</div>' +
    '<div class="comment">' + comment + '</div></div>' +
    '<button class="q-next" id="qRetry">🔄 再测一次</button>';
  $('qRetry').onclick = function () { qIndex = 0; qScore = 0; renderQuestion(); };
}

/* ==================== 十、主循环与初始化 ==================== */
var clock = new THREE.Clock();
var elapsed = 0;

function animate() {
  requestAnimationFrame(animate);
  var dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;
  updateTweens(dt);

  /* 灯光扩张自动播放（主循环驱动，避免闭包问题） */
  if (yearPlaying) {
    yearPlayT += dt;
    var py = 1990 + Math.round(clamp(yearPlayT / 9, 0, 1) * 32);
    if (py !== yearValue) {
      applyLightsYear(py);
      if (currentMode === 'lights') showLightsInfo();
    }
    if (yearPlayT >= 9) { yearPlaying = false; $('yearPlay').textContent = '▶ 播放灯光扩张'; }
  }

  if (spinOn && mapGroup) mapGroup.rotation.y += dt * 0.06;

  /* 光斑呼吸 */
  cityObjs.forEach(function (co, i) {
    var base = currentMode === 'lights' ? co.glow.scale.x : co.glowSize;
    if (currentMode !== 'lights') {
      var s = co.glowSize * (1 + 0.06 * Math.sin(elapsed * 1.6 + i));
      co.glow.scale.set(s, s, 1);
    }
  });

  /* 选中圆环脉动 */
  if (currentMode === 'rings' && activeRing >= 0 && ringObjs[activeRing]) {
    ringObjs[activeRing].disk.material.opacity = 0.42 + 0.12 * Math.sin(elapsed * 3);
  }

  if (currentMode === 'flows') updateFlows(dt);
  controls.update();
  if (splitOn && currentMode === 'lights') renderSplit();
  else if (composer) composer.render();
  else renderer.render(scene, camera);
}

window.addEventListener('resize', function () {
  camera.aspect = wrap.clientWidth / wrap.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(wrap.clientWidth, wrap.clientHeight);
  if (composer) composer.setSize(wrap.clientWidth, wrap.clientHeight);
  applyLabelDensity();
});

function init() {
  camera.position.set(0, 6.5, 7);
  tween({ tag: 'cam', dur: 1.8, update: function (k) {
    camera.position.lerpVectors(new THREE.Vector3(0, 6.5, 7), new THREE.Vector3(0, 2.35, 2.1), k);
  } });
  buildRegion('yrd');
  bindUI();
  setMode('lights');
  applyLightsYear(2022);
  try {
    var params = new URLSearchParams(window.location.search);
    var q = params.get('mode');
    if (q && MODE_DESC[q]) setMode(q);
  } catch (err) {}
  window.CityApp = {
    setMode: setMode, applyLightsYear: applyLightsYear, selectRing: selectRing,
    buildRegion: buildRegion, cityObjs: function () { return cityObjs; },
    setFlow: function (t) { flowType = t; buildFlows(); },
    focusCity: focusCity, flyHome: flyHome,
    toggleSplit: toggleSplit, setDay: function (v) { dayOn = v; applyDay(); },
    camera: camera, controls: controls
  };
  $('loading').classList.add('done');
  animate();
}

setTimeout(init, 80);

})();
