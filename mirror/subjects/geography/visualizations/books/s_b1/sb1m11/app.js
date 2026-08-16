/* ============================================================
   地球的内部结构 · 3D 交互课件（GLB 模型版）
   高中地理 · 必修第一册
   模型：地球结构.glb（Sketchfab 半球可拆式分层模型）
   ============================================================ */
(function () {
'use strict';

/* ==================== 一、教学数据 ==================== */
var LAYER_DATA = {
  crust: {
    name: '地壳', color: '#b08968', tag: 'CRUST',
    range: '地表 — 平均 17 km', thickness: '大陆约 33 km · 大洋约 6 km',
    temp: '0 ℃ — 约 1000 ℃', state: '固态',
    comp: '硅铝层（上层）+ 硅镁层（下层），以氧、硅、铝为主',
    feature: '地壳厚度不均：大陆部分厚、大洋部分薄。地壳与上地幔顶部（软流层以上）合称岩石圈。'
  },
  mantle: {
    name: '地幔', color: '#ff7b33', tag: 'MANTLE',
    range: '莫霍面 — 地下 2900 km', thickness: '约 2800 km',
    temp: '约 1000 ℃ — 3700 ℃', state: '固态（上地幔上部存在软流层）',
    comp: '铁、镁的硅酸盐类，自上而下铁镁含量增加',
    feature: '上地幔上部的软流层一般认为是岩浆的主要发源地；地幔物质的对流运动是板块运动的重要动力。'
  },
  outerCore: {
    name: '外核', color: '#ffc233', tag: 'OUTER CORE',
    range: '地下 2900 km — 5150 km', thickness: '约 2250 km',
    temp: '约 3700 ℃ — 5500 ℃', state: '液态（熔融状态）',
    comp: '以铁、镍为主，含少量轻元素',
    feature: '横波（S 波）传播到这里突然消失，据此推断外核为液态。液态金属的流动是地球磁场产生的重要原因。'
  },
  innerCore: {
    name: '内核', color: '#fff3b0', tag: 'INNER CORE',
    range: '地下 5150 km — 6371 km（地心）', thickness: '半径约 1221 km',
    temp: '约 5500 ℃ — 6000 ℃（接近太阳表面温度）', state: '固态（极高压力）',
    comp: '铁、镍',
    feature: '温度极高，但由于承受着巨大的压力，铁镍原子被紧紧压缩在一起，因此呈固态。'
  },
  surface: {
    name: '地球表面', color: '#2e9e5b', tag: 'SURFACE',
    range: '大气圈 · 水圈 · 生物圈', thickness: '——',
    temp: '平均约 15 ℃', state: '固 / 液 / 气共存',
    comp: '氮气、氧气、液态水、岩石土壤',
    feature: '点击右侧「内部剖面」模式，揭开地球的表面，看看它的内部结构吧！'
  }
};

var BOUNDARY_DATA = {
  moho: {
    name: '莫霍面', color: '#38e0ff',
    text: '1909 年由克罗地亚地震学家莫霍洛维奇发现。位于地下平均 33 km 处（大洋下较浅），是地壳与地幔的分界面。地震波通过此面时，纵波和横波速度都明显增加。'
  },
  gutenberg: {
    name: '古登堡面', color: '#ffc233',
    text: '1914 年由德国地震学家古登堡确认。位于地下 2900 km 处，是地幔与地核的分界面。此处横波完全消失、纵波速度骤降，据此推断外核为液态。'
  }
};

var QUIZ = [
  {
    q: '科学家划分地球内部圈层的主要依据是？',
    opts: ['A. 钻井取芯直接观察', 'B. 地震波在地下传播速度的变化', 'C. 火山喷发出的岩浆成分', 'D. 卫星遥感拍摄的照片'],
    answer: 1,
    explain: '目前最深的钻井仅约 12 km，无法直接观测地球内部。科学家主要利用地震波（纵波与横波）传播速度的变化来推断内部结构。'
  },
  {
    q: '地震波中的横波（S 波）不能通过下列哪个圈层？',
    opts: ['A. 地壳', 'B. 地幔', 'C. 外核', 'D. 内核'],
    answer: 2,
    explain: '横波只能在固体中传播。在地下 2900 km 的古登堡面处横波突然消失，说明外核为液态（熔融状态）。'
  },
  {
    q: '一般认为，岩浆主要发源于地球内部的哪个部位？',
    opts: ['A. 地壳底部', 'B. 上地幔上部的软流层', 'C. 外核', 'D. 内核'],
    answer: 1,
    explain: '上地幔上部存在一个软流层，温度很高，岩石处于部分熔融状态，一般认为是岩浆的主要发源地。'
  },
  {
    q: '关于地壳，下列说法正确的是？',
    opts: ['A. 地壳是厚度最均匀的圈层', 'B. 大洋地壳比大陆地壳厚', 'C. 地壳与上地幔顶部合称岩石圈', 'D. 地壳的平均厚度约 2900 km'],
    answer: 2,
    explain: '地壳厚度不均：大陆厚（约 33 km）、大洋薄（约 6 km），平均约 17 km。地壳与上地幔顶部（软流层以上）由坚硬岩石组成，合称岩石圈。'
  }
];

/* ==================== 二、工具函数 ==================== */
function $(id) { return document.getElementById(id); }

function makePerlin(seed) {
  var p = new Uint8Array(256), perm = new Uint8Array(512), i, j, t;
  var s = seed >>> 0 || 1;
  function rand() { s = (s * 16807) % 2147483647; return s / 2147483647; }
  for (i = 0; i < 256; i++) p[i] = i;
  for (i = 255; i > 0; i--) { j = (rand() * (i + 1)) | 0; t = p[i]; p[i] = p[j]; p[j] = t; }
  for (i = 0; i < 512; i++) perm[i] = p[i & 255];
  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function lerp(a, b, t) { return a + t * (b - a); }
  function grad(h, x, y) { switch (h & 3) { case 0: return x + y; case 1: return -x + y; case 2: return x - y; default: return -x - y; } }
  function noise(x, y) {
    var X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    x -= Math.floor(x); y -= Math.floor(y);
    var u = fade(x), v = fade(y);
    var aa = perm[perm[X] + Y], ab = perm[perm[X] + Y + 1];
    var ba = perm[perm[X + 1] + Y], bb = perm[perm[X + 1] + Y + 1];
    return lerp(lerp(grad(aa, x, y), grad(ba, x - 1, y), u),
                lerp(grad(ab, x, y - 1), grad(bb, x - 1, y - 1), u), v);
  }
  function fbm(x, y, oct) {
    var v = 0, a = 0.5, f = 1, tot = 0;
    for (var i = 0; i < oct; i++) { v += a * noise(x * f, y * f); tot += a; a *= 0.5; f *= 2; }
    return v / tot;
  }
  return { noise: noise, fbm: fbm };
}

function lerp(a, b, t) { return a + t * (b - a); }
function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

/* --- 迷你补间动画 --- */
var tweens = [];
function tween(opts) {
  opts.t = 0;
  opts.ease = opts.ease || function (k) { return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
  tweens.push(opts);
}
function updateTweens(dt) {
  for (var i = tweens.length - 1; i >= 0; i--) {
    var tw = tweens[i];
    tw.t += dt;
    var k = clamp(tw.t / tw.dur, 0, 1);
    tw.update(tw.ease(k));
    if (k >= 1) { tweens.splice(i, 1); if (tw.complete) tw.complete(); }
  }
}

/* --- 画布纹理 --- */
function canvasTexture(w, h, draw, srgb) {
  var cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  var tex = new THREE.CanvasTexture(cv);
  if (srgb !== false) tex.encoding = THREE.sRGBEncoding;
  tex.anisotropy = 8;
  return tex;
}

/* --- 文字标签精灵 --- */
function makeLabel(text, sub, accent) {
  var cv = document.createElement('canvas');
  cv.width = 512; cv.height = 168;
  var ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, 512, 168);
  var bw = sub ? 340 : 200;
  ctx.fillStyle = 'rgba(6, 12, 28, 0.88)';
  ctx.strokeStyle = accent || 'rgba(56,224,255,0.8)';
  ctx.lineWidth = 3;
  var x = 256 - bw / 2, y = 22, hgt = sub ? 124 : 96, r = 20;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + bw, y, x + bw, y + hgt, r);
  ctx.arcTo(x + bw, y + hgt, x, y + hgt, r);
  ctx.arcTo(x, y + hgt, x, y, r);
  ctx.arcTo(x, y, x + bw, y, r);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 54px "Microsoft YaHei", sans-serif';
  ctx.fillText(text, 256, sub ? 82 : 96);
  if (sub) {
    ctx.fillStyle = accent || '#9fd8ff';
    ctx.font = '30px "Microsoft YaHei", sans-serif';
    ctx.fillText(sub, 256, 128);
  }
  var tex = new THREE.CanvasTexture(cv);
  tex.encoding = THREE.sRGBEncoding;
  var sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex, transparent: true, depthWrite: false
  }));
  sp.scale.set(0.62, 0.20, 1);
  return sp;
}

function makeLeaderLine(a, b, color) {
  var geo = new THREE.BufferGeometry().setFromPoints([a, b]);
  return new THREE.Line(geo, new THREE.LineBasicMaterial({
    color: color || 0x7fdcff, transparent: true, opacity: 0.85
  }));
}

/* ==================== 三、渲染器 · 场景 · 相机 ==================== */
var wrap = $('canvasWrap');
var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(wrap.clientWidth, wrap.clientHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
wrap.appendChild(renderer.domElement);

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(45, wrap.clientWidth / wrap.clientHeight, 0.1, 200);
camera.position.set(0, 0.55, 3.5);

var controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 1.2;
controls.maxDistance = 9;
controls.enablePan = false;

/* --- 灯光 --- */
scene.add(new THREE.AmbientLight(0x8899bb, 0.55));
var sunLight = new THREE.DirectionalLight(0xfff5e0, 1.3);
sunLight.position.set(5, 3, 4);
scene.add(sunLight);
var coreLight = new THREE.PointLight(0xff8a3c, 0.9, 3.5);
coreLight.position.set(0, 0, 0);
scene.add(coreLight);

/* ==================== 四、星空 · 太阳辉光 ==================== */
(function buildStars() {
  var N = 1800, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  for (var i = 0; i < N; i++) {
    var r = 30 + Math.random() * 60;
    var th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.cos(ph);
    pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    var c = 0.55 + Math.random() * 0.45;
    col[i * 3] = c * (0.8 + Math.random() * 0.2);
    col[i * 3 + 1] = c * (0.85 + Math.random() * 0.15);
    col[i * 3 + 2] = c;
  }
  var geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  var stars = new THREE.Points(geo, new THREE.PointsMaterial({
    size: 0.16, vertexColors: true, sizeAttenuation: true,
    transparent: true, opacity: 0.9, depthWrite: false
  }));
  scene.add(stars);
})();

function glowTexture(inner, outer) {
  return canvasTexture(256, 256, function (ctx) {
    var g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, inner);
    g.addColorStop(0.35, outer);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  });
}

(function buildSunFlare() {
  var flare = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture('rgba(255,250,220,1)', 'rgba(255,200,120,0.35)'),
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
  }));
  flare.position.copy(sunLight.position).normalize().multiplyScalar(14);
  flare.scale.set(7, 7, 1);
  scene.add(flare);
})();

/* ==================== 五、云层与大气（程序化） ==================== */
var cloudMesh = null, atmosMesh = null, haloSprite = null;

function buildCloudsAndAtmosphere(parent) {
  var perlin2 = makePerlin(778899);
  var cloudTex = canvasTexture(512, 256, function (ctx) {
    var img = ctx.createImageData(512, 256), d = img.data;
    for (var y = 0; y < 256; y++) for (var x = 0; x < 512; x++) {
      var u = x / 512, v = y / 256;
      var n1 = perlin2.fbm(u * 8 + 7, v * 4.2 + 21, 5);
      var n2 = perlin2.fbm(u * 8 - 8 + 7, v * 4.2 + 21, 5);
      var n = lerp(n1, n2, Math.max(0, (u - 0.9) / 0.1));
      var a = clamp((n - 0.02) * 3.4, 0, 1);
      var i4 = (y * 512 + x) * 4;
      d[i4] = d[i4 + 1] = d[i4 + 2] = 255;
      d[i4 + 3] = Math.pow(a, 1.35) * 200;
    }
    ctx.putImageData(img, 0, 0);
  });
  cloudMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.015, 64, 48),
    new THREE.MeshLambertMaterial({ map: cloudTex, transparent: true, opacity: 0.8, depthWrite: false })
  );
  parent.add(cloudMesh);

  atmosMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.05, 64, 48),
    new THREE.ShaderMaterial({
      vertexShader: [
        'varying vec3 vNormal;',
        'void main(){',
        '  vNormal = normalize(normalMatrix * normal);',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying vec3 vNormal;',
        'void main(){',
        '  float intensity = pow(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);',
        '  gl_FragColor = vec4(0.35, 0.65, 1.0, 1.0) * intensity;',
        '}'
      ].join('\n'),
      blending: THREE.AdditiveBlending, side: THREE.BackSide, transparent: true, depthWrite: false
    })
  );
  parent.add(atmosMesh);

  haloSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture('rgba(70,140,255,0.55)', 'rgba(40,90,220,0.18)'),
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.8
  }));
  haloSprite.scale.set(3.6, 3.6, 1);
  parent.add(haloSprite);
}

/* ==================== 六、GLB 模型加载与分组 ==================== */
var earthGroup = new THREE.Group();   // 模型 + 云层 + 大气（统一旋转）
var labelsGroup = new THREE.Group();
scene.add(earthGroup);

/* 圈层分组：crustA=完整半球盖 surface1 / crustB=可拆半球盖 surface2 */
var groups = { crustA: [], crustB: [], mantle: [], outerCore: [], innerCore: [] };
var LAYER_R = { crust: 1.0, mantle: 0.96, outer: 0.475, inner: 0.21 }; // 归一化后半径
var modelReady = false;

function classifyMesh(mesh) {
  var names = [], p = mesh;
  while (p) { if (p.name) names.push(p.name); p = p.parent; }
  var chain = names.join('|');
  if (chain.indexOf('inner_core') >= 0) return 'innerCore';
  if (chain.indexOf('upper_core') >= 0) return 'outerCore';
  if (chain.indexOf('upper_mental') >= 0) return 'mantle';
  if (chain.indexOf('surface1') >= 0) return 'crustA';
  if (chain.indexOf('surface2') >= 0) return 'crustB';
  return null;
}

/* base64 → ArrayBuffer */
function b64ToArrayBuffer(b64) {
  var bin = atob(b64);
  var len = bin.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

/* 原模型拆分动画 */
var mixer = null, splitAction = null, splitOn = false;
function setSplitAnim(on) {
  if (!splitAction) return;
  splitOn = on;
  if (on) {
    splitAction.reset();
    splitAction.play();
  } else {
    // 回到第 0 帧（合拢状态）再停止，避免图层停在半空
    splitAction.paused = false;
    splitAction.time = 0;
    mixer.update(0);
    splitAction.stop();
  }
  updateLabelsVisibility(); // 拆分时图层离位，暂时隐藏标注避免引线指空
  // 图层沿剖面法线方向分离，正对剖面时看不见拆分 → 自动转到 3/4 侧视角
  var from = cutAngle, to = on ? 55 : 0;
  tween({
    tag: 'splitView', dur: 1.0,
    update: function (k) {
      cutAngle = from + (to - from) * k;
      $('cutAngle').value = Math.round(cutAngle);
      $('cutVal').textContent = Math.round(cutAngle) + '°';
      updateRangeFill($('cutAngle'));
    }
  });
}

function loadModel(onDone) {
  var loader = new THREE.GLTFLoader();
  var width = window.innerWidth || 0;
  var modelPath = width <= 700
    ? 'assets/models/earth-interior-mobile.glb'
    : width <= 1180
      ? 'assets/models/earth-interior-tablet.glb'
      : 'assets/models/earth-interior-desktop.glb';
  var resolvedPath = typeof window.resolveGeographySourceAsset === 'function'
    ? window.resolveGeographySourceAsset(modelPath)
    : modelPath;
  loader.load(resolvedPath, function (g) {
    setupModel(g.scene, g.animations);
    onDone();
  }, undefined, function (err) {
    setLoader('模型加载失败：' + err);
    console.error(err);
  });
}

var loaderText = $('loaderText');
function setLoader(t) { if (loaderText) loaderText.textContent = t; }

function setupModel(model, animations) {
  // 归一化：地表半径 = 1，中心在原点
  var box = new THREE.Box3().setFromObject(model);
  var size = box.getSize(new THREE.Vector3());
  var center = box.getCenter(new THREE.Vector3());
  var scale = 2 / Math.max(size.x, size.y, size.z);
  model.scale.setScalar(scale);
  model.position.copy(center).multiplyScalar(-scale);

  model.traverse(function (o) {
    if (!o.isMesh) return;
    var gkey = classifyMesh(o);
    if (!gkey) { o.visible = false; return; }
    // 克隆材质：便于独立透明度/发光动画（保留模型原有单面渲染，剖面才通透）
    o.material = o.material.clone();
    o.material.transparent = true;
    o.userData.layerKey = (gkey === 'crustA' || gkey === 'crustB') ? 'crust' : gkey;
    groups[gkey].push(o);
  });

  earthGroup.add(model);

  // 原模型自带的拆分动画（9.17s，地壳盖 / 地幔 / 外核 / 内核沿轴分离）
  if (animations && animations.length) {
    mixer = new THREE.AnimationMixer(model);
    splitAction = mixer.clipAction(animations[0]);
    splitAction.setLoop(THREE.LoopPingPong, Infinity); // 循环拆分-合拢，适合课堂演示
  }

  buildCloudsAndAtmosphere(earthGroup);
  buildLabels();
  earthGroup.add(labelsGroup);
  buildSeismic(earthGroup);
  modelReady = true;
}

/* --- 圈层标注（模型局部坐标：剖切面在 x=0 平面，朝 -x 方向） --- */
function buildLabels() {
  /* Keep callouts inside the unified left simulation frame. The imported
     model's original offsets were designed for a much wider standalone page. */
  var L = [
    { text: '地壳', sub: '0 – 33 km', color: '#e8c39a', lp: [-0.68, 0.55, -0.44], tp: [0, 0.88, 0.44] },
    { text: '地幔', sub: '— 2900 km', color: '#ff9a5c', lp: [-0.68, 0.12, -0.44], tp: [0, 0.70, 0.12] },
    { text: '外核', sub: '— 5150 km', color: '#ffd76a', lp: [-0.68, -0.30, -0.44], tp: [0, 0.30, -0.10] },
    { text: '内核', sub: '地心 6371 km', color: '#fff3b0', lp: [-0.68, -0.62, -0.44], tp: [0, 0.09, -0.05] },
    { text: '莫霍面', sub: '地壳 / 地幔', color: '#38e0ff', lp: [-0.68, 0.70, 0.38], tp: [0, 0.55, 0.79] },
    { text: '古登堡面', sub: '地幔 / 地核', color: '#ffc233', lp: [-0.68, -0.70, 0.38], tp: [0, 0.26, -0.40] }
  ];
  L.forEach(function (cfg) {
    var sp = makeLabel(cfg.text, cfg.sub, cfg.color);
    sp.position.set(cfg.lp[0], cfg.lp[1], cfg.lp[2]);
    sp.scale.set(0.44, 0.145, 1);
    sp.userData.layerKey = cfg.text;
    labelsGroup.add(sp);
    var line = makeLeaderLine(
      new THREE.Vector3(cfg.lp[0] * 0.9, cfg.lp[1], cfg.lp[2]),
      new THREE.Vector3(cfg.tp[0], cfg.tp[1], cfg.tp[2]),
      0x7fdcff
    );
    line.userData.layerKey = cfg.text;
    labelsGroup.add(line);
  });
}

/* 圈层 → 网格组（含两个半球盖） */
function meshesOfLayer(key) {
  if (key === 'crust') return groups.crustA.concat(groups.crustB);
  return groups[key] || [];
}

/* ==================== 七、地震波演示（剖切面 YZ 平面内） ==================== */
var seismicGroup = new THREE.Group();
var seismicRays = [];
var seismicGuides = [];
var surfaceRing, ringT = 0, waveT = 0;
var wavePlaying = true, waveSpeed = 1;
var seismicEvidenceStep = -1;

var OUTER_R = 0.475; // 归一化外核半径

/* 剖切面（x=0）内的方向：β 从 +y 轴向 +z 量取 */
function dirDisk(betaDeg) {
  var b = betaDeg * Math.PI / 180;
  return new THREE.Vector3(0, Math.cos(b), Math.sin(b));
}
var EPICENTER = dirDisk(52); // 震源（剖面盘边缘地表）

function slerpDir(a, b, t) {
  return new THREE.Vector3().copy(a).lerp(b, t).normalize();
}

function makePCurve(endDir, minR) {
  var pts = [], N = 26;
  for (var i = 0; i <= N; i++) {
    var t = i / N;
    var dir = slerpDir(EPICENTER, endDir, t);
    var env = Math.pow(Math.sin(Math.PI * t), 0.8);
    var r = Math.max(minR, 1 - (1 - minR) * env);
    if (minR < 0.45 && t > 0.32 && t < 0.5) r = Math.max(minR, r - 0.05);
    if (minR < 0.45 && t >= 0.5 && t < 0.68) r = Math.max(minR, r - 0.05);
    pts.push(dir.clone().multiplyScalar(r));
  }
  return new THREE.CatmullRomCurve3(pts);
}

function makeSCurve(endDir, hitT) {
  var pts = [], N = 14;
  for (var i = 0; i <= N; i++) {
    var t = i / N;
    var dir = slerpDir(EPICENTER, endDir, t * hitT);
    var r = lerp(1, OUTER_R, Math.pow(t, 1.15));
    pts.push(dir.clone().multiplyScalar(r));
  }
  return new THREE.CatmullRomCurve3(pts);
}

function dashedLine(curve, color, dash, gap) {
  var geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(80));
  var line = new THREE.Line(geo, new THREE.LineDashedMaterial({
    color: color, dashSize: dash || 0.05, gapSize: gap || 0.03,
    transparent: true, opacity: 0.9, depthTest: false, depthWrite: false
  }));
  line.computeLineDistances();
  line.renderOrder = 20;
  return line;
}

/* 波线路径：由同一事件进度逐段显现，不能预先显示完整路径。 */
function waveRay(curve, color) {
  var group = new THREE.Group();
  var points = curve.getPoints(160);
  function makeLine(material) {
    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    geometry.setDrawRange(0, 2);
    return new THREE.Line(geometry, material);
  }
  var glow = makeLine(new THREE.LineBasicMaterial({
    color: color, transparent: true, opacity: 0.28,
    blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false
  }));
  var body = makeLine(new THREE.LineBasicMaterial({
    color: color, transparent: true, opacity: 0.96, depthTest: false, depthWrite: false
  }));
  var core = makeLine(new THREE.LineBasicMaterial({
    color: color, transparent: true, opacity: 1, depthTest: false, depthWrite: false
  }));
  core.renderOrder = 21; body.renderOrder = 20; glow.renderOrder = 19;
  group.add(glow); group.add(body); group.add(core);
  group.userData.pointCount = points.length;
  return group;
}

function glowDot(color, size) {
  var m = new THREE.Mesh(
    new THREE.SphereGeometry(size, 16, 12),
    new THREE.MeshBasicMaterial({ color: color, depthTest: false, depthWrite: false })
  );
  m.renderOrder = 21;
  var halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture('rgba(255,255,255,0.9)', color === 0x38e0ff ? 'rgba(56,224,255,0.4)' : 'rgba(255,77,210,0.4)'),
    blending: THREE.AdditiveBlending, transparent: true, depthTest: false, depthWrite: false
  }));
  halo.renderOrder = 22;
  halo.scale.set(size * 9, size * 9, 1);
  m.add(halo);
  return m;
}

function buildSeismic(parent) {
  var P_COL = 0x38e0ff, S_COL = 0xff4dd2;

  /* 只保留一条关键 P 波和一条关键 S 波，突出“通过”与“终止”的因果差异。 */
  var pCurve = makePCurve(dirDisk(168), 0.30);
  var pRay = waveRay(pCurve, P_COL);
  var pDot = glowDot(P_COL, 0.021);
  seismicGroup.add(pRay); seismicGroup.add(pDot);
  seismicRays.push({ type: 'P', curve: pCurve, ray: pRay, dot: pDot, start: 0.04, end: 0.88 });

  var sCurve = makeSCurve(dirDisk(140), 0.48);
  var sRay = waveRay(sCurve, S_COL);
  var sDot = glowDot(S_COL, 0.021);
  var sStop = glowDot(S_COL, 0.025);
  sStop.position.copy(sCurve.getPoint(1));
  seismicGroup.add(sRay); seismicGroup.add(sDot); seismicGroup.add(sStop);
  seismicRays.push({ type: 'S', curve: sCurve, ray: sRay, dot: sDot, stop: sStop, start: 0.04, end: 0.52 });

  /* 震源 */
  var src = glowDot(0xffc233, 0.03);
  src.position.copy(EPICENTER);
  seismicGroup.add(src);

  /* 表面波扩散环 */
  surfaceRing = new THREE.Mesh(
    new THREE.RingGeometry(0.028, 0.042, 64),
    new THREE.MeshBasicMaterial({
      color: 0xffc233, transparent: true, opacity: 0.9,
      side: THREE.DoubleSide, depthWrite: false
    })
  );
  surfaceRing.position.copy(EPICENTER).multiplyScalar(1.004);
  surfaceRing.lookAt(EPICENTER.clone().multiplyScalar(2));
  seismicGroup.add(surfaceRing);

  /* 在剖面外缘直接给出两个不同的阴影区范围，避免混淆 P、S 波。 */
  function shadowArc(startDeg, endDeg, radius, color, opacity) {
    var pts = [];
    for (var i = 0; i <= 36; i++) {
      pts.push(dirDisk(startDeg + (endDeg - startDeg) * i / 36).multiplyScalar(radius));
    }
    var geo = new THREE.BufferGeometry().setFromPoints(pts);
    var arc = new THREE.Line(geo, new THREE.LineDashedMaterial({
      color: color, dashSize: 0.035, gapSize: 0.022, transparent: true, opacity: opacity,
      depthTest: false, depthWrite: false
    }));
    arc.computeLineDistances();
    arc.renderOrder = 22;
    seismicGroup.add(arc);
    seismicGuides.push(arc);
  }
  var shadowStart = 52 + 103;
  shadowArc(shadowStart, 52 + 142, 1.022, 0xffc233, 0.95); // P 波阴影区：103°—142°
  shadowArc(shadowStart, 52 + 180, 1.008, 0xffa03c, 0.78); // S 波阴影区：103°—180°

  seismicGroup.visible = false;
  parent.add(seismicGroup);
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function setWaveRayProgress(ray, progress) {
  var count = Math.max(2, Math.floor(ray.userData.pointCount * clamp01(progress)));
  ray.children.forEach(function (line) { line.geometry.setDrawRange(0, count); });
}

function updateSeismicScene() {
  for (var i = 0; i < seismicRays.length; i++) {
    var event = seismicRays[i];
    var progress = clamp01((waveT - event.start) / (event.end - event.start));
    setWaveRayProgress(event.ray, progress);
    event.dot.visible = progress > 0 && progress < 1;
    event.dot.position.copy(event.curve.getPoint(progress));
    if (event.stop) event.stop.visible = progress >= 1;
  }
  ringT = clamp01(waveT / 0.2);
  surfaceRing.scale.setScalar(1 + ringT * 5.5);
  surfaceRing.material.opacity = 0.9 * (1 - ringT);
  seismicGuides.forEach(function (guide) { guide.visible = waveT >= 0.7; });
}

function updateWaveToggle() {
  var button = $('waveToggle');
  if (!button) return;
  button.textContent = waveT >= 1 ? '↻ 重新播放' : (wavePlaying ? '⏸ 暂停波动画' : '▶ 继续波动画');
}

function resetSeismicSequence(shouldPlay) {
  waveT = 0;
  wavePlaying = shouldPlay !== false;
  seismicEvidenceStep = -1;
  updateSeismicScene();
  updateSeismicEvidence();
  updateWaveToggle();
}

function updateSeismic(dt) {
  if (wavePlaying) {
    waveT = Math.min(1, waveT + dt * waveSpeed * 0.12);
    if (waveT >= 1) wavePlaying = false;
  }
  updateSeismicScene();
  updateSeismicEvidence();
  updateWaveToggle();
}

function updateSeismicEvidence() {
  var step = waveT < 0.52 ? 0 : waveT < 0.7 ? 1 : 2;
  var pMarker = $('pWaveMarker'), sMarker = $('sWaveMarker');
  var pProgress = clamp01((waveT - 0.04) / 0.84);
  var sProgress = clamp01((waveT - 0.04) / 0.48);
  if (pMarker) {
    pMarker.style.left = (5 + pProgress * 89) + '%';
    pMarker.style.opacity = pProgress <= 0 || pProgress >= 1 ? '0.3' : '1';
  }
  if (sMarker) {
    sMarker.style.left = (5 + sProgress * 51) + '%';
    sMarker.style.opacity = sProgress >= 1 ? '0.72' : (sProgress <= 0 ? '0.3' : '1');
  }
  if (step === seismicEvidenceStep) return;
  seismicEvidenceStep = step;
  var titles = [
    '固态地幔：P 波与 S 波均可传播',
    '古登堡面：S 波在此终止',
    '外核折射：P、S 阴影区不同'
  ];
  var copies = [
    'P 波更快；两类波在固态地幔内都能向外传播。',
    '横波不能在液体中传播。S 波在约 2900 km 处消失，是外核为液态的关键证据。',
    'P 波可进入液态外核并折射，P 波阴影区约为 103°—142°；S 波阴影区从约 103°延续至 180°。'
  ];
  if ($('seismicEvidenceTitle')) $('seismicEvidenceTitle').textContent = titles[step];
  if ($('seismicEvidenceCopy')) $('seismicEvidenceCopy').textContent = copies[step];
  var steps = $('seismicSteps');
  if (steps) Array.prototype.forEach.call(steps.children, function (node, index) { node.classList.toggle('is-current', index === step); });
}

/* ==================== 八、模式与界面控制 ==================== */
var MODE_DESC = {
  appearance: '从太空俯瞰真实地球：昼夜交替、云层与大气辉光。',
  structure: '揭开半球外壳，直视平整剖面：地壳、地幔、外核、内核一目了然。',
  peel: '拖动滑块，逐层剥开地球，直到看见炽热的地心。',
  seismic: 'P 波可穿过固体和液体，但进入外核后会折射；S 波不能进入液态外核。这些差异是推断内部圈层的关键证据。'
};
var CAM_POS = {
  appearance: new THREE.Vector3(0, 0.55, 3.8),
  structure: new THREE.Vector3(0.35, 0.35, 3.15),
  peel: new THREE.Vector3(0.3, 0.5, 3.35),
  seismic: new THREE.Vector3(0.4, 0.45, 3.5)
};
// The unified shell gives the simulation a narrower left frame than the
// standalone source page. Pull the cutaway modes back so their annotations
// remain wholly inside the simulation frame rather than under the right panel.
if ((window.innerWidth || 0) < 760) {
  CAM_POS.structure.set(0.35, 0.35, 3.55);
  CAM_POS.peel.set(0.3, 0.5, 3.7);
  CAM_POS.seismic.set(0.4, 0.45, 3.65);
}
var PEEL_NAMES = ['完整地球', '剥离地壳 → 地幔', '剥离地幔 → 外核', '剥离外核 → 内核（地心）'];
var PEEL_CAM = [3.2, 2.6, 1.9, 1.2];

var currentMode = 'appearance';
var cutAngle = 0, spinSpeed = 1, spinOn = true, spinAccum = 0;
var peelLevel = 0;
var INSTANT = false;

function tweenCameraTo(target, dur) {
  var start = camera.position.clone();
  tween({
    tag: 'cam',
    dur: dur || 1.1,
    update: function (k) { camera.position.lerpVectors(start, target, k); }
  });
}
function cancelCameraTweens() {
  for (var i = tweens.length - 1; i >= 0; i--) {
    if (tweens[i].tag === 'cam') tweens.splice(i, 1);
  }
}
function zoomCameraTo(dist, dur) {
  cancelCameraTweens();
  tweenCameraTo(camera.position.clone().normalize().multiplyScalar(dist), dur);
}

function setGroupVisible(list, v) {
  for (var i = 0; i < list.length; i++) list[i].visible = v;
}

/* 剥离：0 完整 / 1 去地壳 / 2 去地幔 / 3 去外核 */
function applyPeel(level, peelLabels) {
  peelLevel = level;
  var vis = {
    crustA: level <= 0, crustB: level <= 0,
    mantle: level <= 1, outerCore: level <= 2, innerCore: true
  };
  // 结构/剥离模式下 crustB（半球盖）始终隐藏，露出剖面
  if (currentMode !== 'appearance') vis.crustB = false;

  ['crustA', 'crustB', 'mantle', 'outerCore', 'innerCore'].forEach(function (gk) {
    var list = groups[gk];
    for (var i = 0; i < list.length; i++) {
      var mesh = list[i], mat = mesh.material;
      var shouldShow = vis[gk];
      if (INSTANT) {
        mat.opacity = shouldShow ? 1 : 0;
        mesh.visible = shouldShow;
        continue;
      }
      if (!shouldShow && mesh.visible && !mesh.userData.hiding) {
        mesh.userData.hiding = true;
        (function (m, mt) {
          tween({
            dur: 0.5,
            update: function (k) { mt.opacity = 1 - k; m.scale.setScalar(1 + k * 0.06); },
            complete: function () { m.visible = false; m.userData.hiding = false; m.scale.setScalar(1); }
          });
        })(mesh, mat);
      } else if (shouldShow && !mesh.visible && !mesh.userData.showing) {
        mesh.userData.showing = true;
        (function (m, mt) {
          m.visible = true;
          tween({
            dur: 0.5,
            update: function (k) { mt.opacity = k; },
            complete: function () { mt.opacity = 1; m.userData.showing = false; }
          });
        })(mesh, mat);
      }
    }
  });

  // 标注显隐
  var visibleKeys;
  if (peelLabels) {
    var cur = ['地壳', '地幔', '外核', '内核'][Math.min(level, 3)];
    visibleKeys = { '地壳': false, '地幔': false, '外核': false, '内核': false, '莫霍面': false, '古登堡面': false };
    visibleKeys[cur] = true;
  } else {
    visibleKeys = {
      '地壳': level <= 0, '地幔': level <= 1, '外核': level <= 2, '内核': true,
      '莫霍面': level <= 0, '古登堡面': level <= 2
    };
  }
  labelsGroup.children.forEach(function (c) {
    var key = c.userData.layerKey;
    if (key && visibleKeys[key] === false) c.visible = false;
    else if (key) c.visible = true;
  });
}

function setMode(m) {
  currentMode = m;
  var btns = document.querySelectorAll('.mode-btn');
  for (var i = 0; i < btns.length; i++) {
    btns[i].classList.toggle('active', btns[i].dataset.mode === m);
  }
  $('modeDesc').textContent = MODE_DESC[m];
  var blocks = document.querySelectorAll('.ctl-block');
  for (var j = 0; j < blocks.length; j++) {
    blocks[j].style.display = blocks[j].dataset.for.split(' ').indexOf(m) >= 0 ? '' : 'none';
  }
  // 云层 / 大气 / 光晕仅外观模式
  if (cloudMesh) { cloudMesh.visible = m === 'appearance' && $('optClouds').checked; }
  if (atmosMesh) { atmosMesh.visible = m === 'appearance' && $('optAtmos').checked; }
  if (haloSprite) { haloSprite.visible = m === 'appearance'; }

  seismicGroup.visible = (m === 'seismic');
  if (m === 'seismic') {
    cutAngle = 0;
    $('cutAngle').value = 0;
    $('cutVal').textContent = '0°';
    updateRangeFill($('cutAngle'));
    spinOn = false;
    $('optSpin').checked = false;
    resetSeismicSequence(true);
  }

  if (m === 'appearance') {
    setGroupVisible(groups.crustA, true);
    setGroupVisible(groups.crustB, true);
    setGroupVisible(groups.mantle, false);
    setGroupVisible(groups.outerCore, false);
    setGroupVisible(groups.innerCore, false);
    groups.crustA.concat(groups.crustB).forEach(function (mm) { mm.material.opacity = 1; });
  } else {
    setGroupVisible(groups.crustB, false); // 揭开半球盖
    if (m !== 'peel') {
      // 剖面 / 地震波：显示全部圈层
      setGroupVisible(groups.crustA, true);
      setGroupVisible(groups.mantle, true);
      setGroupVisible(groups.outerCore, true);
      setGroupVisible(groups.innerCore, true);
      ['crustA', 'mantle', 'outerCore', 'innerCore'].forEach(function (gk) {
        groups[gk].forEach(function (mm) { mm.material.opacity = 1; });
      });
      applyPeel(0, false);
    }
  }
  if (m === 'peel') {
    applyPeel(peelLevel, true);
  } else {
    // 非剥离模式复位滑块
    if ($('peel').value !== '0') {
      $('peel').value = 0;
      $('peelVal').textContent = PEEL_NAMES[0];
      updateRangeFill($('peel'));
    }
  }
  updateLabelsVisibility();
  updateLegend();
  // 离开剖面模式时自动停止拆分动画并复位开关
  if (m !== 'structure' && $('optSplit') && $('optSplit').checked) {
    $('optSplit').checked = false;
    setSplitAnim(false);
  }
  tweenCameraTo(CAM_POS[m]);
}

function updateLabelsVisibility() {
  // Seismic mode already has source, P/S-wave, discontinuity and shadow-zone
  // annotations. Hide the large static layer callouts in the narrower platform
  // viewport so they cannot obscure the model, title, or legend.
  var show = $('optLabels').checked && currentMode !== 'appearance' && currentMode !== 'seismic' && !splitOn;
  labelsGroup.visible = show;
  if (currentMode === 'peel') applyPeel(peelLevel, true);
}

/* ==================== 九、图例 ==================== */
function updateLegend() {
  var html = '<div class="lg-title">图 例</div>';
  if (currentMode === 'appearance') {
    html += '<div class="lg-row"><span class="chip" style="background:#1b6aa8;color:#1b6aa8"></span>海洋</div>'
          + '<div class="lg-row"><span class="chip" style="background:#4a8a4a;color:#4a8a4a"></span>陆地</div>'
          + '<div class="lg-row"><span class="chip" style="background:#e8f0f8;color:#e8f0f8"></span>云层 / 冰盖 / 城市灯光</div>';
  } else {
    html += '<div class="lg-row"><span class="chip" style="background:#b08968;color:#b08968"></span>地壳（平均 17 km）</div>'
          + '<div class="lg-row"><span class="chip" style="background:#e8542f;color:#e8542f"></span>地幔（— 2900 km）</div>'
          + '<div class="lg-row"><span class="chip" style="background:#ffc233;color:#ffc233"></span>外核（液态）</div>'
          + '<div class="lg-row"><span class="chip" style="background:#fff3b0;color:#fff3b0"></span>内核（固态）</div>';
    if (currentMode === 'seismic') {
      html += '<div class="lg-row"><span class="line-chip" style="border-color:#38e0ff"></span>P 波（纵波，可通过固体和液体）</div>'
            + '<div class="lg-row"><span class="line-chip" style="border-color:#ff4dd2"></span>S 波（横波，只能通过固体）</div>'
            + '<div class="lg-row"><span class="line-chip dashed" style="border-color:#ffc233"></span>P 波阴影区（103°—142°）</div>'
            + '<div class="lg-row"><span class="line-chip dashed" style="border-color:#ffa03c"></span>S 波阴影区（103°—180°）</div>';
    }
  }
  $('legend').innerHTML = html;
}

/* ==================== 十、信息卡 ==================== */
function showDefaultInfo() {
  $('infoCard').innerHTML =
    '<div class="card-title">课程导读</div>'
    + '<div style="color:#bfe2ff;font-weight:700;margin-bottom:6px">课标要求</div>'
    + '运用示意图，说出地球的圈层结构，概括各圈层的主要特点。'
    + '<ul class="info-list">'
    + '<li>地球内部由外向内分为 <b style="color:#e8c39a">地壳</b>、<b style="color:#ff9a5c">地幔</b>、<b style="color:#ffd76a">地核</b> 三大圈层</li>'
    + '<li>两个不连续面：<b style="color:#38e0ff">莫霍面</b> 与 <b style="color:#ffc233">古登堡面</b></li>'
    + '<li>研究手段：地震波在地下传播速度的变化</li>'
    + '</ul>'
    + '<div class="boundary-chips">'
    + '<button class="boundary-chip" data-b="moho">莫霍面</button>'
    + '<button class="boundary-chip" data-b="gutenberg">古登堡面</button>'
    + '</div>'
    + '<div style="margin-top:10px;color:#8ba3c7;font-size:11.5px">💡 点击左侧 3D 视图中的圈层，可查看详细信息</div>';
}

function showLayerInfo(key) {
  var d = LAYER_DATA[key];
  if (!d) return;
  $('infoCard').innerHTML =
    '<div class="info-head">'
    + '<span class="info-dot" style="background:' + d.color + ';color:' + d.color + '"></span>'
    + '<span class="info-name">' + d.name + '</span>'
    + '<span class="info-tag">' + d.tag + '</span></div>'
    + '<div class="info-rows">'
    + '<div class="info-row"><b>深度范围</b><span>' + d.range + '</span></div>'
    + '<div class="info-row"><b>厚度</b><span>' + d.thickness + '</span></div>'
    + '<div class="info-row"><b>温度</b><span>' + d.temp + '</span></div>'
    + '<div class="info-row"><b>物质状态</b><span>' + d.state + '</span></div>'
    + '<div class="info-row"><b>主要成分</b><span>' + d.comp + '</span></div>'
    + '</div>'
    + '<div class="info-feature">⭐ ' + d.feature + '</div>'
    + '<button class="info-back" id="infoBack">← 返回课程导读</button>';
  $('infoBack').onclick = showDefaultInfo;
}

function showBoundaryInfo(key) {
  var d = BOUNDARY_DATA[key];
  $('infoCard').innerHTML =
    '<div class="info-head">'
    + '<span class="info-dot" style="background:' + d.color + ';color:' + d.color + '"></span>'
    + '<span class="info-name">' + d.name + '</span>'
    + '<span class="info-tag">不连续面</span></div>'
    + '<div style="line-height:1.8">' + d.text + '</div>'
    + '<button class="info-back" id="infoBack">← 返回课程导读</button>';
  $('infoBack').onclick = showDefaultInfo;
}

/* ==================== 十一、课堂小测 ==================== */
var quizIdx = 0, quizScore = 0, quizAnswered = false;

function openQuiz() {
  quizIdx = 0; quizScore = 0;
  $('quizModal').classList.add('open');
  renderQuiz();
}
function renderQuiz() {
  quizAnswered = false;
  if (quizIdx >= QUIZ.length) { renderQuizScore(); return; }
  var q = QUIZ[quizIdx];
  $('quizProgress').textContent = '第 ' + (quizIdx + 1) + ' / ' + QUIZ.length + ' 题';
  var html = '<div class="quiz-q">' + q.q + '</div><div class="quiz-opts">';
  q.opts.forEach(function (opt, i) {
    html += '<button class="quiz-opt" data-i="' + i + '">' + opt + '</button>';
  });
  html += '</div><div id="quizFoot"></div>';
  $('quizBody').innerHTML = html;
  var opts = document.querySelectorAll('.quiz-opt');
  for (var i = 0; i < opts.length; i++) {
    opts[i].onclick = function () { answerQuiz(parseInt(this.dataset.i, 10)); };
  }
}
function answerQuiz(i) {
  if (quizAnswered) return;
  quizAnswered = true;
  var q = QUIZ[quizIdx];
  var opts = document.querySelectorAll('.quiz-opt');
  for (var k = 0; k < opts.length; k++) {
    opts[k].disabled = true;
    if (k === q.answer) opts[k].classList.add('correct');
    else if (k === i) opts[k].classList.add('wrong');
  }
  if (i === q.answer) quizScore++;
  var correct = i === q.answer;
  $('quizFoot').innerHTML =
    '<div class="quiz-explain">' + (correct ? '✅ 回答正确！' : '❌ 回答错误。') + q.explain + '</div>'
    + '<button class="quiz-next" id="quizNext">' + (quizIdx + 1 >= QUIZ.length ? '查看成绩 →' : '下一题 →') + '</button>';
  $('quizNext').onclick = function () { quizIdx++; renderQuiz(); };
}
function renderQuizScore() {
  $('quizProgress').textContent = '已完成';
  var msg, sub;
  if (quizScore === QUIZ.length) { msg = '🏆 满分！地球物理学家就是你！'; sub = '对本节知识掌握得非常扎实'; }
  else if (quizScore >= 3) { msg = '🎉 很棒！基本掌握了本节内容'; sub = '再回顾一下错题涉及的知识点'; }
  else if (quizScore >= 2) { msg = '💪 还不错，继续加油'; sub = '建议重新观看"地震波演示"模式'; }
  else { msg = '📖 需要再复习一下哦'; sub = '回到 3D 视图重新探索地球内部结构吧'; }
  $('quizBody').innerHTML =
    '<div class="quiz-score">'
    + '<div class="big">' + quizScore + ' / ' + QUIZ.length + '</div>'
    + '<div class="msg">' + msg + '</div>'
    + '<div class="sub">' + sub + '</div>'
    + '<button class="quiz-next" id="quizRetry" style="margin-top:18px">🔄 重新挑战</button>'
    + '</div>';
  $('quizRetry').onclick = function () { quizIdx = 0; quizScore = 0; renderQuiz(); };
}

/* ==================== 十二、射线拾取（点击圈层） ==================== */
var raycaster = new THREE.Raycaster();
var mouseNDC = new THREE.Vector2();
var downPos = null;

renderer.domElement.addEventListener('pointerdown', function (e) {
  downPos = { x: e.clientX, y: e.clientY };
});
renderer.domElement.addEventListener('pointerup', function (e) {
  if (!downPos) return;
  var dx = e.clientX - downPos.x, dy = e.clientY - downPos.y;
  downPos = null;
  if (dx * dx + dy * dy > 25) return;
  pickAt(e);
});

function currentTargets() {
  var t = [];
  if (!modelReady) return t;
  if (currentMode === 'appearance') {
    t = groups.crustA.concat(groups.crustB);
  } else {
    ['crustA', 'crustB', 'mantle', 'outerCore', 'innerCore'].forEach(function (gk) {
      groups[gk].forEach(function (m) { if (m.visible) t.push(m); });
    });
  }
  return t;
}

function pickAt(e) {
  var rect = renderer.domElement.getBoundingClientRect();
  mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouseNDC, camera);
  var targets = currentTargets();
  if (!targets.length) return;
  var hits = raycaster.intersectObjects(targets, false);
  if (!hits.length) return;
  var mesh = hits[0].object;
  var key = currentMode === 'appearance' ? 'surface' : mesh.userData.layerKey;
  showLayerInfo(key);
  pulseMesh(mesh);
}

/* 点击高亮脉冲（发光起伏） */
function pulseMesh(mesh) {
  var mat = mesh.material;
  if (!mat.emissive) return;
  var oldE = mat.emissive.getHex(), oldI = mat.emissiveIntensity;
  mat.emissive.setHex(0x66ccff);
  tween({
    dur: 0.9,
    update: function (k) { mat.emissiveIntensity = oldI + Math.sin(k * Math.PI) * 0.9; },
    complete: function () { mat.emissive.setHex(oldE); mat.emissiveIntensity = oldI; }
  });
}

renderer.domElement.addEventListener('pointermove', function (e) {
  var rect = renderer.domElement.getBoundingClientRect();
  mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouseNDC, camera);
  var targets = currentTargets();
  var hits = targets.length ? raycaster.intersectObjects(targets, false) : [];
  renderer.domElement.style.cursor = hits.length ? 'pointer' : 'grab';
});

/* ==================== 十三、控件绑定 ==================== */
function updateRangeFill(el) {
  var pct = (el.value - el.min) / (el.max - el.min) * 100;
  el.style.setProperty('--fill', pct + '%');
}

function bindUI() {
  var btns = document.querySelectorAll('.mode-btn');
  for (var i = 0; i < btns.length; i++) {
    btns[i].onclick = function () { setMode(this.dataset.mode); };
  }
  $('speed').oninput = function () {
    spinSpeed = parseFloat(this.value);
    $('speedVal').textContent = spinSpeed.toFixed(1) + '×';
    updateRangeFill(this);
  };
  $('cutAngle').oninput = function () {
    cutAngle = parseFloat(this.value);
    $('cutVal').textContent = Math.round(cutAngle) + '°';
    updateRangeFill(this);
  };
  $('peel').oninput = function () {
    var v = parseInt(this.value, 10);
    applyPeel(v, true);
    $('peelVal').textContent = PEEL_NAMES[v];
    zoomCameraTo(PEEL_CAM[v], 0.8);
    updateRangeFill(this);
  };
  $('waveSpeed').oninput = function () {
    waveSpeed = parseFloat(this.value);
    $('waveSpeedVal').textContent = waveSpeed.toFixed(1) + '×';
    updateRangeFill(this);
  };
  $('waveToggle').onclick = function () {
    if (waveT >= 1) resetSeismicSequence(true);
    else {
      wavePlaying = !wavePlaying;
      updateWaveToggle();
    }
  };
  $('seismicResetView').onclick = function () {
    cutAngle = 0;
    $('cutAngle').value = 0;
    $('cutVal').textContent = '0°';
    updateRangeFill($('cutAngle'));
    spinOn = false;
    $('optSpin').checked = false;
    tweenCameraTo(CAM_POS.seismic, 0.45);
    resetSeismicSequence(true);
  };
  $('optClouds').onchange = function () { if (cloudMesh) cloudMesh.visible = this.checked; };
  $('optAtmos').onchange = function () { if (atmosMesh) atmosMesh.visible = this.checked; };
  $('optLabels').onchange = updateLabelsVisibility;
  $('optSpin').onchange = function () { spinOn = this.checked; };
  $('optSplit').onchange = function () { setSplitAnim(this.checked); };
  $('quizBtn').onclick = openQuiz;
  $('quizClose').onclick = function () { $('quizModal').classList.remove('open'); };
  $('quizModal').addEventListener('click', function (e) {
    if (e.target === this) this.classList.remove('open');
  });
  $('infoCard').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.boundary-chip') : null;
    if (b) showBoundaryInfo(b.dataset.b);
  });
  var ranges = document.querySelectorAll('input[type="range"]');
  for (var j = 0; j < ranges.length; j++) updateRangeFill(ranges[j]);
}

/* The source adapter inserts HTML fragments, so browser-default control values
   are not dependable. Write the state model back to every control once. */
function syncInitialControls() {
  $('speed').value = spinSpeed;
  $('speedVal').textContent = spinSpeed.toFixed(1) + '×';
  $('cutAngle').value = cutAngle;
  $('cutVal').textContent = Math.round(cutAngle) + '°';
  $('peel').value = peelLevel;
  $('peelVal').textContent = PEEL_NAMES[peelLevel];
  $('waveSpeed').value = waveSpeed;
  $('waveSpeedVal').textContent = waveSpeed.toFixed(1) + '×';
  $('optClouds').checked = true;
  $('optAtmos').checked = true;
  $('optLabels').checked = true;
  $('optSpin').checked = spinOn;
  $('optSplit').checked = false;
  $('waveToggle').textContent = '⏸ 暂停波动画';
  var ranges = document.querySelectorAll('input[type="range"]');
  for (var i = 0; i < ranges.length; i++) updateRangeFill(ranges[i]);
}

/* ==================== 十四、动画主循环 ==================== */
var clock = new THREE.Clock();
var elapsed = 0;

function animate() {
  requestAnimationFrame(animate);
  var dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;
  updateTweens(dt);
  if (mixer) mixer.update(dt);

  if (spinOn) spinAccum += dt * spinSpeed * 0.22;

  if (currentMode === 'appearance') {
    earthGroup.rotation.y = spinAccum;
    if (cloudMesh) cloudMesh.rotation.y = spinAccum * 0.3 + elapsed * 0.01;
  } else {
    // 剖面朝 -x，旋转 +π/2 使其面向相机
    earthGroup.rotation.y = Math.PI / 2 + cutAngle * Math.PI / 180 + spinAccum * 0.15;
  }

  // 地核发光脉动
  var pulse = 1 + 0.22 * Math.sin(elapsed * 2.4);
  groups.innerCore.forEach(function (m) { m.material.emissiveIntensity = 1.1 * pulse; });
  groups.outerCore.forEach(function (m) { m.material.emissiveIntensity = 0.9 * pulse; });
  coreLight.intensity = currentMode === 'appearance' ? 0 : 0.9 + 0.25 * Math.sin(elapsed * 2.4);

  if (seismicGroup.visible) updateSeismic(dt);

  controls.update();
  renderer.render(scene, camera);
}

/* ==================== 十五、自适应与初始化 ==================== */
window.addEventListener('resize', function () {
  var w = wrap.clientWidth, h = wrap.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});

function init() {
  setLoader('正在解析 3D 模型…');
  setTimeout(function () {
    loadModel(function () {
      setLoader('正在布置教学场景…');
      setTimeout(function () {
        bindUI();
        syncInitialControls();
        showDefaultInfo();
        updateLegend();
        setMode('appearance');
        try {
          var params = new URLSearchParams(window.location.search);
          INSTANT = params.get('instant') === '1';
          var q = params.get('mode');
          if (q && MODE_DESC[q]) setMode(q);
          var pq = parseInt(params.get('peel'), 10);
          if (!isNaN(pq)) {
            setMode('peel');
            var pv = clamp(pq, 0, 3);
            $('peel').value = pv;
            applyPeel(pv, true);
            $('peelVal').textContent = PEEL_NAMES[pv];
            updateRangeFill($('peel'));
            cancelCameraTweens();
            camera.position.copy(CAM_POS.peel.clone().normalize().multiplyScalar(PEEL_CAM[pv]));
          }
        } catch (err) {}
        window.EarthApp = { setMode: setMode, applyPeel: applyPeel, groups: groups, earthGroup: earthGroup, camera: camera, setSplitAnim: setSplitAnim, getSplitAction: function () { return splitAction; } };
        $('loading').classList.add('done');
        animate();
      }, 60);
    });
  }, 60);
}

init();

})();
