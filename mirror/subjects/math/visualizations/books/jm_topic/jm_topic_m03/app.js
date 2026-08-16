/**
 * 根式化简与合并专题实验室 - 核心逻辑 (app.js)
 * 1. 根式代数分解引擎：完美平方数提取与素因数分解
 * 2. 几何网格重构动画：完美平方因子转化为几何正方形，滑动飞出根号
 * 3. 因子数图谱绘制：树状分支展现质因数拆分，指数配对合并
 * 4. SVG 反应腔物理沙盒：支持拖拽、碰撞检测、同类聚变、异类物理回弹与颤抖
 * 5. 挑战舱关卡判定：支持经典根式运算挑战
 * 6. Web Audio 合成音效
 */

// ==========================================================================
// 1. 全局状态与配置
// ==========================================================================
const state = {
    activeTab: "level-deconstruct", // "level-deconstruct", "level-sandbox", "level-challenge"
    hudExpandedByTab: {
        "level-deconstruct": false,
        "level-sandbox": false,
        "level-challenge": true
    },
    
    // 关卡一：解构仪状态
    deconstruct: {
        rad: 12,        // 当前被解构的被开方数
        coef: 1,        // 当前前导系数
        geomStage: 0,   // 几何分解动画阶段：0-初始, 1-高亮平方格, 2-滑动飞出并塌缩, 3-完成
        treeStage: 0    // 树形化简阶段: 0-初始, 1-展开因子树, 2-匹配平方项并飞出, 3-完成
    },

    // 关卡二：沙盒状态
    sandbox: {
        cards: [],          // 沙盒卡片数组
        activeDragCard: null,
        dragOffset: { x: 0, y: 0 },
        isSimplifying: false,
        busy: false,
        phase: "ready",
        message: "先化简根式，再合并同类项。",
        fusionPlan: null,
        pendingCombine: false
    },

    // 关卡三：挑战状态
    challenge: {
        activeLevelIdx: 0,
        currentChallenge: null,
        questionNumber: 0,
        recentSignatures: [],
        cards: [],
        activeDragCard: null,
        dragOffset: { x: 0, y: 0 },
        dragOrigin: { x: 0, y: 0 },
        completed: false,
        busy: false,
        pendingCombine: false,
        fusionPlan: null,
        transitionSequence: 0,
        pointerId: null,
        dragStartClient: { x: 0, y: 0 },
        dragMoved: false,
        dropTarget: null,
        dropTone: "idle",
        selectedCardId: null
    }
};

// 预设根式能量储备库定义
const PRESETS = [
    { coef: 1, rad: 8 },
    { coef: 1, rad: 12 },
    { coef: 1, rad: 18 },
    { coef: 1, rad: 20 },
    { coef: 1, rad: 27 },
    { coef: 1, rad: 32 },
    { coef: 1, rad: 45 },
    { coef: 1, rad: 50 },
    { coef: 1, rad: 72 },
    { coef: 1, rad: 75 },
    { coef: 1, rad: 98 },
    { coef: 1, rad: 108 }
];

// 随机挑战只固定难度结构，具体数字每次现场生成。
const CHALLENGE_LEVELS = [
    {
        id: "basic",
        title: "基础随机",
        summary: "2-3 项同类根式",
        tip: "每一项都会化成同一根式，提取平方因子后再合并系数。"
    },
    {
        id: "cancel",
        title: "抵消随机",
        summary: "3 项正负抵消",
        tip: "先完成每一项的化简，再检查正负系数能否完全抵消。"
    },
    {
        id: "mixed",
        title: "混合随机",
        summary: "4 项两类根式",
        tip: "化简后先按被开方数分类，只合并属于同一类的根式。"
    }
];

const CHALLENGE_SQUARE_FREE_BASES = [2, 3, 5, 6, 7, 10, 11, 13, 15];
const CHALLENGE_SQUARE_FACTORS = [2, 3, 4, 5, 6];

// ==========================================================================
// 2. 根式代数算法引擎
// ==========================================================================

// 寻找被开方数 N 中最大的完美平方数因子
function findMaxSquareFactor(n) {
    let maxFactor = 1;
    for (let i = 2; i * i <= n; i++) {
        if (n % (i * i) === 0) {
            maxFactor = i * i;
        }
    }
    return maxFactor;
}

// 完全化简二次根式：a * \sqrt{b} -> c * \sqrt{d} (d无平方因子)
function fullySimplify(coef, rad) {
    let curCoef = coef;
    let curRad = rad;
    let i = 2;
    while (i * i <= curRad) {
        if (curRad % (i * i) === 0) {
            curCoef *= i;
            curRad /= (i * i);
        } else {
            i++;
        }
    }
    return { coef: curCoef, rad: curRad };
}

function randomChoice(values) {
    return values[Math.floor(Math.random() * values.length)];
}

function shuffleRandom(values) {
    const shuffled = [...values];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function createChallengeRawTerm(base, factor, coef) {
    return { coef, rad: base * factor * factor };
}

function getChallengeCanonicalTerms(cards) {
    const coefficientByRad = new Map();
    cards.forEach(card => {
        const simplified = fullySimplify(card.coef, card.rad);
        coefficientByRad.set(
            simplified.rad,
            (coefficientByRad.get(simplified.rad) || 0) + simplified.coef
        );
    });
    return Array.from(coefficientByRad.entries())
        .filter(([, coef]) => coef !== 0)
        .map(([rad, coef]) => ({ coef, rad }))
        .sort((a, b) => a.rad - b.rad);
}

function formatChallengeExpression(cards) {
    if (!cards.length) return "0";
    return cards.map((card, index) => {
        const absCoef = Math.abs(card.coef);
        const radical = `${absCoef === 1 ? "" : absCoef}√${card.rad}`;
        if (index === 0) return card.coef < 0 ? `−${radical}` : radical;
        return card.coef < 0 ? ` − ${radical}` : ` + ${radical}`;
    }).join("");
}

function formatChallengeResult(cards) {
    return formatChallengeExpression(getChallengeCanonicalTerms(cards));
}

function challengeTermsMatch(left, right) {
    if (left.length !== right.length) return false;
    return left.every((term, index) => (
        term.coef === right[index].coef && term.rad === right[index].rad
    ));
}

function generateBasicChallengeCards() {
    const base = randomChoice(CHALLENGE_SQUARE_FREE_BASES);
    const count = Math.random() < 0.5 ? 2 : 3;
    const factors = shuffleRandom(CHALLENGE_SQUARE_FACTORS).slice(0, count);
    return shuffleRandom(factors.map(factor => (
        createChallengeRawTerm(base, factor, randomChoice([1, 1, 1, 2]))
    )));
}

function generateCancelChallengeCards() {
    const base = randomChoice(CHALLENGE_SQUARE_FREE_BASES);
    for (let attempt = 0; attempt < 80; attempt++) {
        const factors = shuffleRandom(CHALLENGE_SQUARE_FACTORS).slice(0, 3);
        const firstCoef = randomChoice([-3, -2, -1, 1, 2, 3]);
        const secondCoef = randomChoice([-3, -2, -1, 1, 2, 3]);
        const partial = firstCoef * factors[0] + secondCoef * factors[1];
        if (partial === 0 || partial % factors[2] !== 0) continue;
        const thirdCoef = -partial / factors[2];
        if (thirdCoef === 0 || Math.abs(thirdCoef) > 4) continue;
        const cards = [
            createChallengeRawTerm(base, factors[0], firstCoef),
            createChallengeRawTerm(base, factors[1], secondCoef),
            createChallengeRawTerm(base, factors[2], thirdCoef)
        ];
        if (cards.some(card => card.coef > 0) && cards.some(card => card.coef < 0)) {
            return shuffleRandom(cards);
        }
    }
    return shuffleRandom([
        createChallengeRawTerm(base, 2, 2),
        createChallengeRawTerm(base, 3, -3),
        createChallengeRawTerm(base, 5, 1)
    ]);
}

function generateMixedChallengeCards() {
    const [firstBase, secondBase] = shuffleRandom(CHALLENGE_SQUARE_FREE_BASES).slice(0, 2);
    const cards = [];
    [firstBase, secondBase].forEach(base => {
        let pair = [];
        for (let attempt = 0; attempt < 30; attempt++) {
            const factors = shuffleRandom(CHALLENGE_SQUARE_FACTORS).slice(0, 2);
            const firstCoef = randomChoice([-2, -1, 1, 1, 2]);
            const secondCoef = randomChoice([-2, -1, 1, 1, 2]);
            if (firstCoef * factors[0] + secondCoef * factors[1] === 0) continue;
            pair = [
                createChallengeRawTerm(base, factors[0], firstCoef),
                createChallengeRawTerm(base, factors[1], secondCoef)
            ];
            break;
        }
        cards.push(...(pair.length ? pair : [
            createChallengeRawTerm(base, 2, 1),
            createChallengeRawTerm(base, 3, 1)
        ]));
    });
    return shuffleRandom(cards);
}

function generateRandomChallenge(levelIdx = state.challenge.activeLevelIdx) {
    const level = CHALLENGE_LEVELS[levelIdx] || CHALLENGE_LEVELS[0];
    let cards = [];
    let signature = "";
    for (let attempt = 0; attempt < 24; attempt++) {
        cards = level.id === "cancel"
            ? generateCancelChallengeCards()
            : level.id === "mixed"
                ? generateMixedChallengeCards()
                : generateBasicChallengeCards();
        signature = `${level.id}:${cards.map(card => `${card.coef}:${card.rad}`).join("|")}`;
        if (!state.challenge.recentSignatures.includes(signature)) break;
    }
    state.challenge.recentSignatures = [
        signature,
        ...state.challenge.recentSignatures.filter(item => item !== signature)
    ].slice(0, 8);
    return {
        levelId: level.id,
        title: level.title,
        expr: formatChallengeExpression(cards),
        cards,
        targetTerms: getChallengeCanonicalTerms(cards),
        tip: level.tip,
        signature
    };
}

// 质因数分解：将一个整数分解为质数数组，如 12 -> [2, 2, 3]
function getPrimeFactors(n) {
    const factors = [];
    let d = 2;
    let temp = n;
    while (temp > 1) {
        while (temp % d === 0) {
            factors.push(d);
            temp /= d;
        }
        d++;
    }
    return factors;
}

// 递归构建因子树的数据结构
function buildFactorTree(n) {
    if (n < 2) return { value: n };
    
    // 寻找最小的质因数
    let p = 2;
    while (p * p <= n) {
        if (n % p === 0) break;
        p++;
    }
    
    if (p * p > n) {
        // n 已经是质数
        return { value: n, isPrime: true };
    } else {
        // 裂变为 p 和 n/p
        return {
            value: n,
            isPrime: false,
            left: { value: p, isPrime: true },
            right: buildFactorTree(n / p)
        };
    }
}

// 格式化 LaTeX 风格的根式字符串为更符合人类阅读的格式
function formatMathText(str) {
    if (!str) return "";
    return str
        .replace(/\$\$/g, "")
        .replace(/\$/g, "")
        .replace(/\\sqrt\{(\d+)\}/g, "√$1")
        .replace(/\\sqrt/g, "√")
        .replace(/\\cdot/g, "×")
        .replace(/\\times/g, "×");
}

// 根据当前系数、被开方数和裂变进度计算分步化简提示文字
function getFissionStepText(coef, rad, progress) {
    const maxSq = findMaxSquareFactor(rad);
    const side = Math.sqrt(maxSq);
    const rem = rad / maxSq;
    
    let prefix = "";
    if (coef === -1) {
        prefix = "-";
    } else if (coef !== 1) {
        prefix = coef;
    }
    
    if (progress < 0.25) {
        return `${prefix}√${rad}`;
    } else if (progress < 0.5) {
        return `${prefix}√(${maxSq}×${rem})`;
    } else if (progress < 0.75) {
        return `${prefix}√(${side}²×${rem})`;
    } else {
        if (coef === 1) return `${side}√${rem}`;
        if (coef === -1) return `-${side}√${rem}`;
        return `(${coef}×${side})√${rem}`;
    }
}

// ==========================================================================
// 3. Web Audio 物理声效引擎
// ==========================================================================
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(type) {
    if (!audioCtx) return;
    
    // 如果音频上下文被挂起，则尝试恢复
    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }

    try {
        const now = audioCtx.currentTime;
        if (type === "tap") {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.frequency.setValueAtTime(580, now);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } 
        else if (type === "fusion") {
            // 聚变成功双音符和弦
            const osc1 = audioCtx.createOscillator();
            const osc2 = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc1.frequency.setValueAtTime(523.25, now); // C5
            osc1.frequency.exponentialRampToValueAtTime(880, now + 0.35); // A5
            osc2.frequency.setValueAtTime(659.25, now); // E5
            osc2.frequency.exponentialRampToValueAtTime(1046.5, now + 0.35); // C6
            
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            
            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 0.4);
            osc2.stop(now + 0.4);
        } 
        else if (type === "repel") {
            // 异类排斥降调警报声
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.linearRampToValueAtTime(110, now + 0.25);
            
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.linearRampToValueAtTime(0.001, now + 0.25);
            
            osc.start(now);
            osc.stop(now + 0.25);
        }
        else if (type === "success") {
            // 通关大和弦
            const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            freqs.forEach((f, i) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                
                osc.frequency.setValueAtTime(f, now + i * 0.08);
                gain.gain.setValueAtTime(0.08, now + i * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.6);
                
                osc.start(now + i * 0.08);
                osc.stop(now + i * 0.08 + 0.6);
            });
        }
    } catch(e) {
        console.warn("Audio play blocked/failed", e);
    }
}

// ==========================================================================
// 4. HTML5 Canvas 粒子爆燃与爆炸特效
// ==========================================================================
const particlesCanvas = document.getElementById("particles-canvas");
const pCtx = particlesCanvas.getContext("2d");
let particlesList = [];
let ripplesList = [];
let particlesAnimId = null;
const reducedMotionQuery = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)");
const coarsePointerQuery = globalThis.matchMedia?.("(pointer: coarse)");

class ExplosionParticle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 3;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.radius = Math.random() * 2.5 + 1;
        this.alpha = 1.0;
        this.decay = Math.random() * 0.02 + 0.015;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.restore();
    }
}

class RingRipple {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = 15;
        this.alpha = 1.0;
        this.speed = 4;
    }
    update() {
        this.radius += this.speed;
        this.alpha -= 0.03;
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

function resizeParticlesCanvas() {
    const pixelRatio = Math.min(globalThis.devicePixelRatio || 1, 1.5);
    particlesCanvas.width = Math.round(window.innerWidth * pixelRatio);
    particlesCanvas.height = Math.round(window.innerHeight * pixelRatio);
    pCtx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}
window.addEventListener("resize", resizeParticlesCanvas);
resizeParticlesCanvas();

function triggerExplosion(x, y, color) {
    if (document.hidden || reducedMotionQuery?.matches) return;
    const particleCount = coarsePointerQuery?.matches ? 16 : 26;
    for (let i = 0; i < particleCount; i++) {
        particlesList.push(new ExplosionParticle(x, y, color));
    }
    ripplesList.push(new RingRipple(x, y, color));
    if (!particlesAnimId) {
        tickParticles();
    }
}

function tickParticles() {
    pCtx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);
    
    // 更新粒子
    for (let i = particlesList.length - 1; i >= 0; i--) {
        const p = particlesList[i];
        p.update();
        if (p.alpha <= 0) {
            particlesList.splice(i, 1);
        } else {
            p.draw(pCtx);
        }
    }

    // 更新波纹
    for (let i = ripplesList.length - 1; i >= 0; i--) {
        const r = ripplesList[i];
        r.update();
        if (r.alpha <= 0) {
            ripplesList.splice(i, 1);
        } else {
            r.draw(pCtx);
        }
    }

    if (particlesList.length > 0 || ripplesList.length > 0) {
        particlesAnimId = requestAnimationFrame(tickParticles);
    } else {
        particlesAnimId = null;
    }
}

// ==========================================================================
// 5. SVG 辅助节点构建函数
// ==========================================================================
function createSVGNode(tag, attrs) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const key in attrs) {
        el.setAttribute(key, attrs[key]);
    }
    return el;
}

// ==========================================================================
// 6. 模块一：数码代数解构仪 (Deconstructor Visualizer)
// ==========================================================================

// 6.1 几何拼图视图 (Geometric Grid Puzzle)
function renderGeomPuzzle() {
    const svg = document.getElementById("svg-geom-puzzle");
    svg.innerHTML = "";
    
    const rad = state.deconstruct.rad;
    const maxSq = findMaxSquareFactor(rad);
    const side = Math.sqrt(maxSq); // 提取出来的边长 k
    const rem = rad / maxSq;      // 留在根式内部的余数 m
    const stage = state.deconstruct.geomStage;

    const extracted = maxSq > 1;
    const isExtractedStage = extracted && stage >= 2;
    const squareCenterX = isExtractedStage ? 70 : 162;
    const squareCenterY = 126;
    const squareMaxSize = isExtractedStage ? 78 : 94;
    const cellSize = Math.min(22, squareMaxSize / Math.max(side, 1));
    const cellGap = Math.max(0.45, Math.min(2, cellSize * 0.12));
    const squareSize = side * cellSize;
    const squareStartX = squareCenterX - squareSize / 2;
    const squareStartY = squareCenterY - squareSize / 2;

    // 提取完成后根号右移，为飞出的平方因子留出独立区域。
    const radicalPath = createSVGNode("path", {
        d: isExtractedStage
            ? "M 122 122 L 142 122 L 157 166 L 180 68 L 325 68"
            : "M 24 122 L 44 122 L 59 166 L 82 68 L 325 68",
        fill: "none",
        stroke: "#0e7490",
        "stroke-width": 3,
        style: "transition: all 0.5s ease-in-out;"
    });
    svg.appendChild(radicalPath);

    // a. 绘制平方数正方形块 (k x k)
    const geomGroup = createSVGNode("g", {
        id: "geom-square-block",
        transform: `translate(${squareStartX}, ${squareStartY})`,
        style: "transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);"
    });

    if (extracted) {
        if (isExtractedStage) {
            // 蓝格表示开方后真正提取出的系数 k，而不是原平方因子 k²。
            const outputCols = Math.min(3, side);
            const outputRows = Math.ceil(side / outputCols);
            const outputCellSize = Math.min(24, 72 / outputCols, 72 / outputRows);
            const outputGap = Math.max(0.7, Math.min(2, outputCellSize * 0.12));
            const outputWidth = outputCols * outputCellSize;
            const outputHeight = outputRows * outputCellSize;
            geomGroup.setAttribute("transform", `translate(${squareCenterX - outputWidth / 2}, ${squareCenterY - outputHeight / 2})`);

            for (let i = 0; i < side; i++) {
                const r = Math.floor(i / outputCols);
                const c = i % outputCols;
                geomGroup.appendChild(createSVGNode("rect", {
                    x: c * outputCellSize,
                    y: r * outputCellSize,
                    width: Math.max(1, outputCellSize - outputGap),
                    height: Math.max(1, outputCellSize - outputGap),
                    rx: Math.min(3, outputCellSize * 0.18),
                    class: "geom-grid-cell geom-root-output-cell",
                    fill: "#67e8f9",
                    stroke: "#0e7490",
                    "stroke-width": Math.max(0.7, Math.min(1.5, outputCellSize * 0.08)),
                    style: "filter: drop-shadow(0 2px 2px rgba(15,23,42,0.14));"
                }));
            }
        } else if (side <= 12) {
            for (let r = 0; r < side; r++) {
                for (let c = 0; c < side; c++) {
                    geomGroup.appendChild(createSVGNode("rect", {
                        x: c * cellSize,
                        y: r * cellSize,
                        width: Math.max(1, cellSize - cellGap),
                        height: Math.max(1, cellSize - cellGap),
                        rx: Math.min(3, cellSize * 0.18),
                        class: "geom-grid-cell",
                        fill: stage >= 1 ? "#67e8f9" : "#c4b5fd",
                        stroke: stage >= 1 ? "#0e7490" : "#6d28d9",
                        "stroke-width": Math.max(0.7, Math.min(1.5, cellSize * 0.08)),
                        style: "filter: drop-shadow(0 2px 2px rgba(15,23,42,0.14));"
                    }));
                }
            }
        } else {
            geomGroup.appendChild(createSVGNode("rect", {
                x: 0,
                y: 0,
                width: squareSize,
                height: squareSize,
                rx: 5,
                fill: stage >= 1 ? "#a5f3fc" : "#ddd6fe",
                stroke: stage >= 1 ? "#0e7490" : "#6d28d9",
                "stroke-width": 2
            }));
            for (let i = 1; i < 4; i++) {
                const offset = (squareSize * i) / 4;
                geomGroup.appendChild(createSVGNode("path", {
                    d: `M ${offset} 0 V ${squareSize} M 0 ${offset} H ${squareSize}`,
                    fill: "none",
                    stroke: "rgba(14, 116, 144, 0.32)",
                    "stroke-width": 1
                }));
            }
        }

        if (!isExtractedStage) {
            const squareLabel = createSVGNode("text", {
                id: "coef-geom-text",
                x: squareSize / 2,
                y: squareSize / 2 + Math.min(6, cellSize * 0.3),
                "text-anchor": "middle",
                fill: "#0f172a",
                "font-size": side > 12 ? "12px" : "13px",
                "font-weight": "900",
                opacity: side > 12 ? 1 : 0,
                style: "pointer-events:none;"
            });
            squareLabel.textContent = side > 12 ? `${side} × ${side}` : side;
            geomGroup.appendChild(squareLabel);
        }
        svg.appendChild(geomGroup);
    }

    // b. 绘制剩余的未配对网格 (m 个)
    const remCenterX = extracted ? (isExtractedStage ? 250 : 275) : 185;
    const remGroup = createSVGNode("g", {
        id: "geom-rem-block"
    });

    if (rem <= 12) {
        const remCols = Math.min(3, rem);
        const remRows = Math.ceil(rem / remCols);
        const remCellSize = Math.min(22, 68 / remCols, 82 / remRows);
        const remGap = Math.max(0.7, Math.min(2, remCellSize * 0.1));
        const remWidth = remCols * remCellSize;
        const remHeight = remRows * remCellSize;
        remGroup.setAttribute("transform", `translate(${remCenterX - remWidth / 2}, ${squareCenterY - remHeight / 2})`);

        for (let i = 0; i < rem; i++) {
            const r = Math.floor(i / remCols);
            const c = i % remCols;
            remGroup.appendChild(createSVGNode("rect", {
                x: c * remCellSize,
                y: r * remCellSize,
                width: remCellSize - remGap,
                height: remCellSize - remGap,
                rx: Math.min(3, remCellSize * 0.18),
                fill: "#fde68a",
                stroke: "#b45309",
                "stroke-width": 1.4,
                style: "filter: drop-shadow(0 2px 2px rgba(15,23,42,0.12));"
            }));
        }
    } else {
        remGroup.setAttribute("transform", `translate(${remCenterX - 42}, 103)`);
        remGroup.appendChild(createSVGNode("rect", {
            x: 0,
            y: 0,
            width: 84,
            height: 46,
            rx: 8,
            fill: "#fef3c7",
            stroke: "#b45309",
            "stroke-width": 1.5
        }));
        const remLabel = createSVGNode("text", {
            x: 42,
            y: 28,
            "text-anchor": "middle",
            fill: "#92400e",
            "font-size": "12px",
            "font-weight": "800"
        });
        remLabel.textContent = extracted ? `余因子 ${rem}` : `无平方因子`;
        remGroup.appendChild(remLabel);
    }
    svg.appendChild(remGroup);

    // 2. 绘制化简步骤数学表达式
    const formulaG = createSVGNode("g", {
        transform: "translate(175, 220)"
    });
    
    const formulaText = createSVGNode("text", {
        "text-anchor": "middle",
        fill: "#0f172a",
        "font-size": "15px",
        "font-weight": "600"
    });
    
    if (stage === 0) {
        formulaText.textContent = `待化简式: √${rad}`;
    } else if (stage === 1) {
        formulaText.textContent = `提取平方因子: √(${maxSq} × ${rem})`;
    } else {
        formulaText.textContent = `开平方根飞出: ${side}√${rem}`;
    }
    formulaG.appendChild(formulaText);
    svg.appendChild(formulaG);

    // 更新按钮状态
    const btn = document.getElementById("btn-geom-step");
    if (maxSq === 1) {
        btn.textContent = "已是最简根式";
        btn.disabled = true;
    } else {
        btn.disabled = false;
        if (stage === 0) {
            btn.textContent = "锁定平方因子";
        } else if (stage === 1) {
            btn.textContent = "拉伸提取正方形";
        } else {
            btn.textContent = "重置化简";
        }
    }
}

// 6.2 素因数分解树形图谱 (Factor Tree Visualizer)
function renderFactorTree() {
    const svg = document.getElementById("svg-factor-tree");
    svg.innerHTML = "";
    
    const rad = state.deconstruct.rad;
    const stage = state.deconstruct.treeStage;
    
    // 构建因子树
    const rootNode = buildFactorTree(rad);
    
    // 递归计算树节点的绝对渲染坐标
    // canvas 宽 350, 高 240
    const nodes = [];
    const links = [];
    
    function layout(node, x, y, dx) {
        if (!node) return;
        nodes.push({ node, x, y });
        
        if (node.left && node.right) {
            const ly = y + 36;
            const ry = y + 36;
            const lx = x - dx;
            const rx = x + dx;
            
            links.push({ x1: x, y1: y + 10, x2: lx, y2: ly - 10 });
            links.push({ x1: x, y1: y + 10, x2: rx, y2: ry - 10 });
            
            layout(node.left, lx, ly, dx * 0.55);
            layout(node.right, rx, ry, dx * 0.55);
        }
    }
    
    layout(rootNode, 175, 30, 75);

    // 初始态保留首层拆分预览，避免因数树工作台出现空白。
    if (stage === 0) {
        const preview = createSVGNode("g", { class: "factor-tree-preview" });
        const firstLevel = rootNode.left && rootNode.right
            ? [
                { node: rootNode.left, x: 112 },
                { node: rootNode.right, x: 238 }
            ]
            : [];

        firstLevel.forEach(item => {
            preview.appendChild(createSVGNode("line", {
                x1: 175,
                y1: 67,
                x2: item.x,
                y2: 105,
                stroke: "#0891b2",
                "stroke-width": 2,
                "stroke-dasharray": "5 5",
                opacity: 0.72
            }));
        });

        const previewNodes = [
            { node: rootNode, x: 175, y: 48, r: 24, primary: true },
            ...firstLevel.map(item => ({ ...item, y: 123, r: 18, primary: false }))
        ];

        previewNodes.forEach(item => {
            const group = createSVGNode("g", {
                transform: `translate(${item.x}, ${item.y})`
            });
            group.appendChild(createSVGNode("circle", {
                cx: 0,
                cy: 0,
                r: item.r,
                fill: item.primary ? "#ecfeff" : "#ffffff",
                stroke: item.primary ? "#0e7490" : "#64748b",
                "stroke-width": item.primary ? 2.5 : 1.75,
                style: "filter: drop-shadow(0 3px 4px rgba(15,23,42,0.14));"
            }));
            const label = createSVGNode("text", {
                x: 0,
                y: item.primary ? 5 : 4,
                "text-anchor": "middle",
                fill: "#0f172a",
                "font-size": item.primary ? "16px" : "12px",
                "font-weight": "800"
            });
            label.textContent = item.node.value;
            group.appendChild(label);
            preview.appendChild(group);
        });

        const previewEquation = createSVGNode("text", {
            x: 175,
            y: 168,
            "text-anchor": "middle",
            fill: "#475569",
            "font-size": "12px",
            "font-weight": "700"
        });
        previewEquation.textContent = firstLevel.length
            ? `${rad} = ${firstLevel[0].node.value} × ${firstLevel[1].node.value}`
            : `${rad} 是质数因子`;
        preview.appendChild(previewEquation);
        svg.appendChild(preview);
    }

    // 绘制连线
    if (stage >= 1) {
        links.forEach(l => {
            const line = createSVGNode("line", {
                x1: l.x1, y1: l.y1, x2: l.x2, y2: l.y2,
                stroke: "#64748b",
                "stroke-width": 1.75
            });
            svg.appendChild(line);
        });

        // 绘制节点
        nodes.forEach(n => {
            const g = createSVGNode("g", {
                transform: `translate(${n.x}, ${n.y})`
            });
            
            // 是否属于质数叶子节点
            const isLeaf = n.node.isPrime;
            
            // 节点圆圈
            const circle = createSVGNode("circle", {
                cx: 0, cy: 0, r: 12,
                fill: isLeaf ? "#bbf7d0" : "#e2e8f0",
                stroke: isLeaf ? "#15803d" : "#475569",
                "stroke-width": 1.5,
                style: "filter: drop-shadow(0 2px 2px rgba(15,23,42,0.14));"
            });
            g.appendChild(circle);
            
            // 节点文本
            const text = createSVGNode("text", {
                x: -0.5, y: 3.5,
                "text-anchor": "middle",
                fill: "#0f172a",
                "font-size": "10px",
                class: "tree-node-text"
            });
            text.textContent = n.node.value;
            g.appendChild(text);
            
            svg.appendChild(g);
        });
    }

    // 绘制质因数收集区与配对
    if (stage >= 2) {
        // 收集叶子节点（质因数）
        const primeLeaves = getPrimeFactors(rad);
        
        const summaryG = createSVGNode("g", {
            transform: "translate(175, 180)"
        });
        
        // 将质因数横向排开
        const startX = -((primeLeaves.length - 1) * 26) / 2;
        
        // 寻找相等的质因数配对（如 2 和 2）
        const usedIdx = new Set();
        const pairs = []; // 存储配对的质因子索引
        
        for (let i = 0; i < primeLeaves.length; i++) {
            if (usedIdx.has(i)) continue;
            for (let j = i + 1; j < primeLeaves.length; j++) {
                if (usedIdx.has(j)) continue;
                if (primeLeaves[i] === primeLeaves[j]) {
                    pairs.push([i, j]);
                    usedIdx.add(i);
                    usedIdx.add(j);
                    break;
                }
            }
        }

        primeLeaves.forEach((val, idx) => {
            const px = startX + idx * 26;
            
            // 检查该节点是否配对成功
            const isPaired = Array.from(usedIdx).includes(idx);
            
            const nodeG = createSVGNode("g", {
                transform: `translate(${px}, 0)`
            });
            
            nodeG.appendChild(createSVGNode("circle", {
                cx: 0, cy: 0, r: 10,
                fill: isPaired ? "#cffafe" : "#fef3c7",
                stroke: isPaired ? "#0e7490" : "#b45309",
                "stroke-width": 1.5
            }));
            
            const txt = createSVGNode("text", {
                x: -0.5, y: 3,
                "text-anchor": "middle",
                fill: "#0f172a",
                "font-size": "9px",
                class: "tree-node-text"
            });
            txt.textContent = val;
            nodeG.appendChild(txt);
            
            summaryG.appendChild(nodeG);
        });

        // 绘制配对弧线
        pairs.forEach(pair => {
            const idx1 = pair[0];
            const idx2 = pair[1];
            const px1 = startX + idx1 * 26;
            const px2 = startX + idx2 * 26;
            const midX = (px1 + px2) / 2;
            
            // 绘制向上跨越的虚弧线
            const arcPath = createSVGNode("path", {
                d: `M ${px1} -10 Q ${midX} -24 ${px2} -10`,
                fill: "none",
                stroke: "#0e7490",
                "stroke-width": 1.5,
                "stroke-dasharray": "2 2"
            });
            summaryG.appendChild(arcPath);
        });

        svg.appendChild(summaryG);
    }

    // 绘制底部步骤文本
    const mathTextG = createSVGNode("g", {
        transform: "translate(175, 220)"
    });
    const mathText = createSVGNode("text", {
        "text-anchor": "middle",
        fill: "#0f172a",
        "font-size": "13px",
        "font-weight": "600"
    });
    
    if (stage === 0) {
        mathText.textContent = `待分解式: √${rad}`;
        mathText.setAttribute("fill", "#0f172a");
    } else if (stage === 1) {
        mathText.textContent = `素因数树形展开: √(${getPrimeFactors(rad).join(" × ")})`;
    } else {
        const factors = getPrimeFactors(rad);
        const maxSq = findMaxSquareFactor(rad);
        const side = Math.sqrt(maxSq);
        const rem = rad / maxSq;
        mathText.textContent = `指数配对化简: √(${side}² × ${rem}) = ${side}√${rem}`;
    }
    mathTextG.appendChild(mathText);
    svg.appendChild(mathTextG);

    // 更新按钮状态
    const btn = document.getElementById("btn-tree-step");
    const maxSq = findMaxSquareFactor(rad);
    if (maxSq === 1) {
        btn.textContent = "已是最简根式";
        btn.disabled = true;
    } else {
        btn.disabled = false;
        if (stage === 0) {
            btn.textContent = "展开因子图谱";
        } else if (stage === 1) {
            btn.textContent = "配对指数提取";
        } else {
            btn.textContent = "重置图谱";
        }
    }
}

// 6.3 更新板书 HUD (Update Chalkboard Step explanations)
function updateChalkboard() {
    const container = document.getElementById("hud-chalkboard-content");
    container.innerHTML = "";
    
    const rad = state.deconstruct.rad;
    const factors = getPrimeFactors(rad);
    const maxSq = findMaxSquareFactor(rad);
    const side = Math.sqrt(maxSq);
    const rem = rad / maxSq;

    let html = `
        <div class="hud-step-card">
            <b>质因数分解</b>
            <div class="hud-math-block">${rad} = ${factors.join(" × ")}</div>
        </div>
    `;

    if (maxSq > 1) {
        html += `
            <div class="hud-step-card success">
                <b>提取最大平方因子</b>
                <div class="hud-math-block">√${rad} = √(${side}² × ${rem}) = ${side}√${rem}</div>
            </div>
        `;
    } else {
        html += `
            <div class="hud-step-card success">
                <b>最简二次根式</b>
                <div class="hud-math-block">√${rad} 不含可提取的平方因子</div>
            </div>
        `;
    }

    container.innerHTML = html;
}

// 初始化关卡一解构仪
function initDeconstructLevel() {
    state.deconstruct.geomStage = 0;
    state.deconstruct.treeStage = 0;
    renderGeomPuzzle();
    renderFactorTree();
    updateChalkboard();
}

// ==========================================================================
// 7. SVG 卡片渲染引擎 (Card Component Drawing)
// ==========================================================================

/**
 * 绘制高保真 SVG 根式卡片
 * card: { coef: 1, rad: 12, x: 200, y: 150, id: '...' }
 */
function drawSVGCardElement(card, layerGroup, clickHandler, dblclickHandler, isChallenge = false) {
    const isSimplest = findMaxSquareFactor(card.rad) === 1;
    const isSelected = isChallenge && state.challenge.selectedCardId === card.id;
    const isDropTarget = isChallenge && state.challenge.dropTarget === card;
    const cardG = createSVGNode("g", {
        class: `radical-svg-card ${isChallenge ? 'challenge-card math-source-native-pointer' : 'reactor-card'} ${isSimplest ? 'simplified' : 'unsimplified'} ${card.isDragging ? 'dragging' : ''} ${card.state === 'fission' ? 'fission' : ''} ${isSelected ? 'selected' : ''} ${isDropTarget ? `drop-target ${state.challenge.dropTone}` : ''}`,
        transform: `translate(${card.x}, ${card.y})`,
        id: `card-${card.id}`,
        "data-id": card.id,
        role: "button",
        tabindex: "0",
        "aria-label": `${card.coef === 1 ? "" : card.coef}根号${card.rad}`
    });

    if (isChallenge) {
        cardG.onpointerdown = (e) => clickHandler(e, card);
        cardG.onkeydown = (e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            dblclickHandler(card);
        };
    } else {
        cardG.classList.add("math-source-native-pointer");
        cardG.onpointerdown = (e) => clickHandler(e, card);
        cardG.onkeydown = (e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            dblclickHandler(card);
        };
    }

    const w = isChallenge ? 132 : 116;
    const h = isChallenge ? 84 : 68;
    const touchW = 132;
    const touchH = 88;
    const reactorVisualState = card.state === "fission"
        ? { label: "化简中", gradient: "url(#sandbox-card-fission)", accent: "#fb7185" }
        : isSimplest
            ? { label: "最简式", gradient: "url(#sandbox-card-stable)", accent: "#34d399" }
            : { label: "待化简", gradient: "url(#sandbox-card-raw)", accent: "#a78bfa" };
    const visualState = isChallenge
        ? {
            ...reactorVisualState,
            gradient: isSimplest ? "#ecfdf5" : "#f5f3ff",
            accent: isSimplest ? "#16a34a" : "#7c3aed"
        }
        : reactorVisualState;

    // 视觉卡可以紧凑，但透明热区始终保留触屏可操作面积。
    cardG.appendChild(createSVGNode("rect", {
        x: -touchW / 2,
        y: -touchH / 2,
        width: touchW,
        height: touchH,
        rx: 16,
        class: "card-hit-target"
    }));

    // 与“二次根式化简与合并”参考卡同源的玻璃根式卡。
    cardG.appendChild(createSVGNode("rect", {
        x: -w / 2 + 3,
        y: -h / 2 + 5,
        width: w,
        height: h,
        rx: 15,
        class: "card-shadow"
    }));
    cardG.appendChild(createSVGNode("rect", {
        x: -w / 2,
        y: -h / 2,
        width: w,
        height: h,
        rx: 15,
        class: "card-bg",
        fill: visualState.gradient,
        stroke: visualState.accent,
        "stroke-width": 2,
        style: "filter: url(#sandbox-card-shadow);"
    }));
    cardG.appendChild(createSVGNode("rect", {
        x: -w / 2 + 4,
        y: -h / 2 + 4,
        width: w - 8,
        height: h - 8,
        rx: 12,
        class: "card-inner"
    }));
    cardG.appendChild(createSVGNode("path", {
        d: `M ${-w / 2 + 13} ${-h / 2 + 5} H ${w / 2 - 15} Q ${w / 2 - 5} ${-h / 2 + 5} ${w / 2 - 5} ${-h / 2 + 15} V ${-h / 2 + 23} Q 8 ${-h / 2 + 13} ${-w / 2 + 5} 3 V ${-h / 2 + 15} Q ${-w / 2 + 5} ${-h / 2 + 5} ${-w / 2 + 13} ${-h / 2 + 5} Z`,
        class: "card-sheen"
    }));
    cardG.appendChild(createSVGNode("rect", {
        x: -w / 2 + 5,
        y: -5,
        width: 3,
        height: 25,
        rx: 1.5,
        fill: visualState.accent,
        class: "card-accent"
    }));
    cardG.appendChild(createSVGNode("circle", {
        cx: -w / 2 + 16,
        cy: -h / 2 + 15,
        r: 3,
        fill: visualState.accent,
        class: "card-state-dot"
    }));
    const stateLabel = createSVGNode("text", {
        x: -w / 2 + 24,
        y: -h / 2 + 18,
        class: "card-state-label"
    });
    stateLabel.textContent = visualState.label;
    cardG.appendChild(stateLabel);
    cardG.appendChild(createSVGNode("circle", {
        cx: w / 2 - 12,
        cy: -h / 2 + 12,
        r: 2,
        class: "card-stud"
    }));

    // 使用标准文本表达式，避免根号顶线重复或错位。
    const coef = card.coef;
    const rad = card.rad;
    const coefText = coef === 1 ? "" : coef === -1 ? "−" : String(coef);
    const formulaText = createSVGNode("text", {
        x: 0,
        y: 13,
        fill: isChallenge ? "#111827" : "#ffffff",
        "font-size": "22px",
        "font-weight": "800",
        "text-anchor": "middle",
        class: "card-formula",
        style: "pointer-events:none;"
    });
    formulaText.textContent = `${coefText}√${rad}`;
    if (card.state !== "fission") cardG.appendChild(formulaText);

    // 裂变化简过程中显示参考卡同样的逐步代数表达式。
    if (card.state === "fission" && card.fissionText) {
        const tipText = createSVGNode("text", {
            x: 0, y: 13,
            fill: "#fff7ed",
            "font-size": "13px",
            "font-weight": "bold",
            "text-anchor": "middle",
            class: "card-fission-formula"
        });
        tipText.textContent = card.fissionText;
        cardG.appendChild(tipText);
        cardG.appendChild(createSVGNode("rect", {
            x: -38,
            y: 27,
            width: 76 * Math.max(0.04, Math.min(1, card.animT)),
            height: 3,
            rx: 1.5,
            class: "card-fission-progress"
        }));
    }

    layerGroup.appendChild(cardG);
}

// ==========================================================================
// 8. 模块二：聚变合并沙盒 (Reactor Fusion Sandbox)
// ==========================================================================
let sandboxCardIdCounter = 200;
let sandboxTransitionSequence = 0;

const SANDBOX_VIEWBOX = { width: 720, height: 500 };
const SANDBOX_REACTOR = { x: 360, y: 278, radius: 188, cardLimit: 108 };

function formatSandboxTerm(card) {
    if (card.coef === 0) return "0";
    const prefix = card.coef === 1 ? "" : card.coef === -1 ? "−" : String(card.coef);
    return card.rad === 1 ? String(card.coef) : `${prefix}√${card.rad}`;
}

function formatSandboxExpression(cards = state.sandbox.cards) {
    if (!cards.length) return "反应舱为空";
    return cards.map(formatSandboxTerm).join(" + ").replace(/\+ −/g, "− ");
}

function getSandboxLayoutPositions(count, zone = "input") {
    if (count <= 0) return [];
    if (count === 1) return [{ x: 360, y: 274 }];
    if (count === 2) {
        return zone === "output"
            ? [{ x: 302, y: 255 }, { x: 430, y: 328 }]
            : [{ x: 306, y: 242 }, { x: 425, y: 326 }];
    }
    if (count === 3) {
        return zone === "output"
            ? [{ x: 292, y: 218 }, { x: 438, y: 230 }, { x: 390, y: 354 }]
            : [{ x: 310, y: 305 }, { x: 425, y: 205 }, { x: 446, y: 338 }];
    }

    const radius = count > 6 ? 104 : 112;
    return Array.from({ length: count }, (_, index) => {
        const angle = -Math.PI / 2 + (Math.PI * 2 * index) / count;
        return {
            x: SANDBOX_REACTOR.x + Math.cos(angle) * radius,
            y: SANDBOX_REACTOR.y + Math.sin(angle) * radius
        };
    });
}

function constrainSandboxCardToReactor(card) {
    const dx = card.x - SANDBOX_REACTOR.x;
    const dy = card.y - SANDBOX_REACTOR.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= SANDBOX_REACTOR.cardLimit || distance === 0) return;
    card.x = SANDBOX_REACTOR.x + (dx / distance) * SANDBOX_REACTOR.cardLimit;
    card.y = SANDBOX_REACTOR.y + (dy / distance) * SANDBOX_REACTOR.cardLimit;
}

function layoutSandboxCards(zone = "input") {
    const cards = state.sandbox.cards;
    const positions = getSandboxLayoutPositions(cards.length, zone);
    cards.forEach((card, index) => {
        card.x = positions[index].x;
        card.y = positions[index].y;
        card.vx = 0;
        card.vy = 0;
        card.isDragging = false;
    });
}

function updateSandboxResultDisplay() {
    const result = document.getElementById("sandbox-result-text");
    const count = document.getElementById("sandbox-card-count");
    if (result) {
        result.textContent = state.sandbox.phase === "completed"
            ? formatSandboxExpression()
            : state.sandbox.phase === "combinable"
                ? "等待合并"
                : "等待反应";
    }
    if (count) count.textContent = `${state.sandbox.cards.length} 项`;
}

function updateSandboxHud() {
    if (state.activeTab !== "level-sandbox") return;
    const container = document.getElementById("hud-chalkboard-content");
    if (!container) return;
    const phaseLabels = {
        ready: "准备化简",
        simplifying: "正在化简",
        combinable: "可以合并",
        combining: "正在合并",
        completed: "合并完成",
        empty: "反应舱为空"
    };
    container.innerHTML = `
        <div class="hud-step-card">
            <b>当前阶段：${phaseLabels[state.sandbox.phase] || "根式反应"}</b><br>
            ${state.sandbox.message}
            <div class="hud-math-block">${formatSandboxExpression()}</div>
        </div>
        <div class="hud-step-card success">
            <b>运算规则</b><br>
            先提取完全平方因子，再把被开方数相同的项合并系数。
        </div>
    `;
}

function updateSandboxControls() {
    const simplifyButton = document.getElementById("btn-simplify-all");
    const combineButton = document.getElementById("btn-combine-all");
    const resetButton = document.getElementById("btn-clear-reactor");
    if (!simplifyButton || !combineButton || !resetButton) return;

    const cards = state.sandbox.cards;
    const transitioning = cards.some(card => card.state !== "normal");
    const busy = state.sandbox.busy || transitioning;
    const canSimplify = cards.some(card => card.state === "normal" && findMaxSquareFactor(card.rad) > 1);
    const canCombine = cards.length > 1;

    simplifyButton.disabled = busy || !canSimplify;
    combineButton.disabled = busy || !canCombine;
    resetButton.disabled = busy;
    simplifyButton.textContent = busy && state.sandbox.phase === "simplifying" ? "化简中..." : "化简全部";
    combineButton.textContent = busy && state.sandbox.phase === "combining" ? "合并中..." : "合并同类项";
    resetButton.textContent = cards.length ? "清空反应舱" : "恢复示例";
}

function setSandboxStatus(message, phase = state.sandbox.phase, tone = "ready") {
    state.sandbox.message = message;
    state.sandbox.phase = phase;
    const statusHeader = document.querySelector("#view-sandbox .chamber-status-header");
    const statusText = document.getElementById("sandbox-status-text");
    const phaseText = document.getElementById("sandbox-phase-text");
    if (statusHeader) statusHeader.dataset.tone = tone;
    if (statusText) statusText.textContent = message;
    if (phaseText) phaseText.textContent = phase === "completed" ? "聚变结果已生成" : phase === "combining" ? "同类根式磁吸中" : phase === "simplifying" ? "平方因子裂变中" : "同类根式聚变反应堆";
    updateSandboxResultDisplay();
    updateSandboxControls();
    updateSandboxHud();
}

function sandboxPointToClient(x, y) {
    const svg = document.getElementById("sandbox-svg");
    const point = svg?.createSVGPoint();
    const matrix = svg?.getScreenCTM();
    if (!point || !matrix) return { x: 0, y: 0 };
    point.x = x;
    point.y = y;
    const transformed = point.matrixTransform(matrix);
    return { x: transformed.x, y: transformed.y };
}

function clientToSandboxPoint(clientX, clientY) {
    const svg = document.getElementById("sandbox-svg");
    const point = svg?.createSVGPoint();
    const matrix = svg?.getScreenCTM();
    if (!point || !matrix) return { x: 0, y: 0 };
    point.x = clientX;
    point.y = clientY;
    const transformed = point.matrixTransform(matrix.inverse());
    return { x: transformed.x, y: transformed.y };
}

function getSandboxEventClientPoint(event) {
    let x = event.clientX;
    let y = event.clientY;
    if (event.__mathSourceLocalPointerEvent) {
        const sceneRoot = document.getElementById("sandbox-svg")?.closest(".math-source-scene");
        const nativeRect = typeof sceneRoot?.__mathSourceNativeGetBoundingClientRect === "function"
            ? sceneRoot.__mathSourceNativeGetBoundingClientRect()
            : null;
        x += nativeRect?.left || 0;
        y += nativeRect?.top || 0;
    }
    return { x, y };
}

function emitSandboxExplosion(card, color) {
    const point = sandboxPointToClient(card.x, card.y);
    triggerExplosion(point.x, point.y, color);
}

function seedSandboxCards() {
    if (state.sandbox.cards.length > 0) return;
    [
        { coef: 1, rad: 12, x: 310, y: 305, vx: 0, vy: 0 },
        { coef: 1, rad: 27, x: 425, y: 205, vx: 0, vy: 0 },
        { coef: 1, rad: 18, x: 446, y: 338, vx: 0, vy: 0 }
    ].forEach(item => {
        state.sandbox.cards.push({
            id: `sb-${sandboxCardIdCounter++}`,
            ...item,
            isDragging: false,
            state: "normal",
            animT: 0
        });
    });
    state.sandbox.busy = false;
    state.sandbox.fusionPlan = null;
    state.sandbox.pendingCombine = false;
    state.sandbox.phase = "ready";
    state.sandbox.message = "先把三张根式卡化为最简形式。";
}

function spawnSandboxCard(coef, rad) {
    const id = `sb-${sandboxCardIdCounter++}`;
    const angle = -Math.PI / 2 + state.sandbox.cards.length * 2.12;
    const radius = 72 + (state.sandbox.cards.length % 2) * 34;
    state.sandbox.cards.push({
        id,
        coef,
        rad,
        x: SANDBOX_REACTOR.x + Math.cos(angle) * radius,
        y: SANDBOX_REACTOR.y + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        isDragging: false,
        state: "normal", // "normal", "fission", "fusion", "fading"
        animT: 0
    });
    playSound("tap");
    setSandboxStatus("已加入新的根式卡，请先完成化简。", "ready", "ready");
    renderSandboxView();
}

function completeSandboxSimplification() {
    if (state.sandbox.phase !== "simplifying") return;
    state.sandbox.busy = false;
    layoutSandboxCards("reaction");
    const canCombine = new Set(state.sandbox.cards.map(card => card.rad)).size < state.sandbox.cards.length;
    const shouldContinueCombine = state.sandbox.pendingCombine;
    state.sandbox.pendingCombine = false;
    if (shouldContinueCombine) {
        setSandboxStatus("裂变化简完成，正在识别同类根式并继续聚变。", "combinable", "success");
        combineAllSandbox();
    } else {
        setSandboxStatus(
            canCombine ? "化简完成，已识别出可以合并的同类根式。" : "化简完成，当前没有可合并的同类根式。",
            canCombine ? "combinable" : "completed",
            canCombine ? "success" : "ready"
        );
    }
}

function scheduleSandboxFissionCompletion() {
    const sequence = ++sandboxTransitionSequence;
    [0.28, 0.54, 0.79].forEach((progress, index) => {
        setTimeout(() => {
            if (sequence !== sandboxTransitionSequence || state.sandbox.phase !== "simplifying") return;
            state.sandbox.cards.forEach(card => {
                if (card.state !== "fission") return;
                card.animT = Math.max(card.animT, progress);
                card.fissionText = getFissionStepText(card.coef, card.rad, card.animT);
            });
            updateSandboxCardsDOM();
        }, 260 * (index + 1));
    });

    setTimeout(() => {
        if (sequence !== sandboxTransitionSequence || state.sandbox.phase !== "simplifying") return;
        state.sandbox.cards.forEach(card => {
            if (card.state !== "fission") return;
            const simplified = fullySimplify(card.coef, card.rad);
            card.coef = simplified.coef;
            card.rad = simplified.rad;
            card.state = "normal";
            card.fissionText = "";
            card.animT = 0;
            emitSandboxExplosion(card, "#10b981");
        });
        playSound("fusion");
        completeSandboxSimplification();
        updateSandboxCardsDOM();
    }, 1120);
}

function scheduleSandboxFusionCompletion() {
    const sequence = ++sandboxTransitionSequence;
    [0.34, 0.68].forEach((progress, index) => {
        setTimeout(() => {
            if (sequence !== sandboxTransitionSequence || !state.sandbox.fusionPlan) return;
            state.sandbox.fusionPlan.forEach(plan => {
                plan.cards.slice(1).forEach(card => {
                    card.animT = Math.max(card.animT, progress);
                    card.x += (plan.target.x - card.x) * 0.48;
                    card.y += (plan.target.y - card.y) * 0.48;
                });
            });
            updateSandboxCardsDOM();
        }, 190 * (index + 1));
    });

    setTimeout(() => {
        if (sequence !== sandboxTransitionSequence || !state.sandbox.fusionPlan) return;
        finalizeSandboxFusion();
    }, 620);
}

let sandboxPhysicsFrameId = null;
let challengePhysicsFrameId = null;

function scheduleActivePhysics() {
    if (document.hidden) return;
    if (state.activeTab !== "level-sandbox" && sandboxPhysicsFrameId !== null) {
        cancelAnimationFrame(sandboxPhysicsFrameId);
        sandboxPhysicsFrameId = null;
    }
    if (state.activeTab !== "level-challenge" && challengePhysicsFrameId !== null) {
        cancelAnimationFrame(challengePhysicsFrameId);
        challengePhysicsFrameId = null;
    }
    if (state.activeTab === "level-sandbox" && sandboxPhysicsFrameId === null) {
        sandboxPhysicsFrameId = requestAnimationFrame(runSandboxPhysics);
    }
    if (state.activeTab === "level-challenge" && challengePhysicsFrameId === null) {
        challengePhysicsFrameId = requestAnimationFrame(runChallengePhysics);
    }
}

// 沙盒重力/浮动流体模拟环 (Animation Loop)
function runSandboxPhysics() {
    sandboxPhysicsFrameId = null;
    if (document.hidden || state.activeTab !== "level-sandbox") return;

    let changed = false;

    state.sandbox.cards.forEach(card => {
        if (card.isDragging) return;

        if (card.state === "normal") {
            // 保留轻微拖拽惯性，同时限制卡片始终位于圆形反应容器内。
            card.x += card.vx;
            card.y += card.vy;
            card.vx *= 0.88;
            card.vy *= 0.88;
            constrainSandboxCardToReactor(card);
            changed = Math.abs(card.vx) > 0.02 || Math.abs(card.vy) > 0.02 || changed;
        } 
        else if (card.state === "fission") {
            // 裂变分步动画推进 (提升到 0.015 帧速率，约 1.1s 完成)
            card.animT += 0.015;
            
            const maxSq = findMaxSquareFactor(card.rad);
            const side = Math.sqrt(maxSq);
            const rem = card.rad / maxSq;

            if (card.animT < 1.0) {
                card.fissionText = getFissionStepText(card.coef, card.rad, card.animT);
            } else {
                // 化简完成，裂变成新式
                card.coef = card.coef * side;
                card.rad = rem;
                card.state = "normal";
                card.fissionText = "";
                card.animT = 0;
                
                // 绽放绿色粒子爆燃
                emitSandboxExplosion(card, "#10b981");
                playSound("fusion");
            }
            changed = true;
        }
        else if (card.state === "fusion" && card.targetCard) {
            // 聚变中：滑动吸引合并
            card.animT += 0.08;
            card.x += (card.targetCard.x - card.x) * 0.25;
            card.y += (card.targetCard.y - card.y) * 0.25;
            
            const dist = Math.hypot(card.x - card.targetCard.x, card.y - card.targetCard.y);
            if (dist < 10) {
                card.state = "fading";
            }
            changed = true;
        }
    } );

    // 剔除消亡合并项
    const hasFading = state.sandbox.cards.some(c => c.state === "fading");
    if (hasFading) {
        state.sandbox.cards = state.sandbox.cards.filter(c => c.state !== "fading");
        changed = true;
    }

    const transitionActive = state.sandbox.cards.some(card => card.state === "fission" || card.state === "fusion" || card.state === "fading");
    if (state.sandbox.busy && state.sandbox.phase === "simplifying" && !transitionActive) {
        completeSandboxSimplification();
        changed = true;
    }

    if (state.sandbox.fusionPlan && !transitionActive) {
        finalizeSandboxFusion();
        changed = true;
    }

    if (changed) {
        // 重绘卡片层
        updateSandboxCardsDOM();
    }
    sandboxPhysicsFrameId = requestAnimationFrame(runSandboxPhysics);
}

// 刷新 DOM 层卡片绘制
function updateSandboxCardsDOM() {
    const layer = document.getElementById("sandbox-cards-layer");
    const linesLayer = document.getElementById("sandbox-lines-layer");
    if (linesLayer) {
        linesLayer.innerHTML = "";
        state.sandbox.cards.forEach(card => {
            if (card.state !== "fusion" || !card.targetCard) return;
            linesLayer.appendChild(createSVGNode("line", {
                x1: card.x,
                y1: card.y,
                x2: card.targetCard.x,
                y2: card.targetCard.y,
                class: "sandbox-fusion-link"
            }));
            const travel = Math.max(0, Math.min(1, card.animT));
            linesLayer.appendChild(createSVGNode("circle", {
                cx: card.x + (card.targetCard.x - card.x) * travel,
                cy: card.y + (card.targetCard.y - card.y) * travel,
                r: 4,
                class: "sandbox-fusion-charge"
            }));
        });
        if (activeDragCard && sandboxDropTarget) {
            const tone = sandboxDropTone;
            linesLayer.appendChild(createSVGNode("line", {
                x1: activeDragCard.x,
                y1: activeDragCard.y,
                x2: sandboxDropTarget.x,
                y2: sandboxDropTarget.y,
                class: `sandbox-magnet-link ${tone}`
            }));
            linesLayer.appendChild(createSVGNode("circle", {
                cx: sandboxDropTarget.x,
                cy: sandboxDropTarget.y,
                r: 70,
                class: `sandbox-magnet-ring ${tone}`
            }));
        }
    }
    layer.innerHTML = "";
    state.sandbox.cards.forEach(card => {
        drawSVGCardElement(card, layer, onSandboxCardDragStart, triggerSandboxFission);
    });
}

function renderSandboxView() {
    updateSandboxCardsDOM();
    updateSandboxResultDisplay();
    updateSandboxControls();
    updateSandboxHud();
}

// --- 拖拽交互算法 ---
let originalDragPos = { x: 0, y: 0 };
let dragOffset = { x: 0, y: 0 };
let activeDragCard = null;
let activeSandboxPointerId = null;
let dragStartClient = { x: 0, y: 0 };
let sandboxDragMoved = false;
let sandboxDropTarget = null;
let sandboxDropTone = "idle";

function onSandboxCardDragStart(e, card) {
    if (card.state !== "normal" || state.sandbox.busy) return;
    e.preventDefault();
    e.stopPropagation();
    initAudio();
    
    activeDragCard = card;
    card.isDragging = true;
    
    activeSandboxPointerId = e.pointerId;
    const clientPoint = getSandboxEventClientPoint(e);
    dragStartClient = clientPoint;
    sandboxDragMoved = false;
    sandboxDropTarget = null;
    sandboxDropTone = "idle";
    const point = clientToSandboxPoint(clientPoint.x, clientPoint.y);
    dragOffset.x = point.x - card.x;
    dragOffset.y = point.y - card.y;
    
    originalDragPos.x = card.x;
    originalDragPos.y = card.y;

    const svg = document.getElementById("sandbox-svg");
    svg?.setPointerCapture?.(e.pointerId);
    svg?.addEventListener("pointermove", onSandboxCardDragMove, { passive: false });
    svg?.addEventListener("pointerup", onSandboxCardDragEnd);
    svg?.addEventListener("pointercancel", onSandboxCardDragEnd);
}

function onSandboxCardDragMove(e) {
    if (!activeDragCard || e.pointerId !== activeSandboxPointerId) return;
    e.preventDefault();
    const clientPoint = getSandboxEventClientPoint(e);
    const point = clientToSandboxPoint(clientPoint.x, clientPoint.y);
    activeDragCard.x = point.x - dragOffset.x;
    activeDragCard.y = point.y - dragOffset.y;
    constrainSandboxCardToReactor(activeDragCard);
    activeDragCard.vx = 0;
    activeDragCard.vy = 0;
    sandboxDragMoved = sandboxDragMoved || Math.hypot(clientPoint.x - dragStartClient.x, clientPoint.y - dragStartClient.y) > 7;
    const previousTarget = sandboxDropTarget;
    const nearest = state.sandbox.cards
        .filter(other => other !== activeDragCard && other.state === "normal")
        .map(other => ({ other, distance: Math.hypot(activeDragCard.x - other.x, activeDragCard.y - other.y) }))
        .sort((left, right) => left.distance - right.distance)[0];
    sandboxDropTarget = nearest && nearest.distance <= 86 ? nearest.other : null;
    sandboxDropTone = !sandboxDropTarget
        ? "idle"
        : findMaxSquareFactor(activeDragCard.rad) > 1 || findMaxSquareFactor(sandboxDropTarget.rad) > 1
            ? "pending"
            : activeDragCard.rad === sandboxDropTarget.rad ? "match" : "reject";
    if (sandboxDropTarget && sandboxDropTarget !== previousTarget) {
        const message = sandboxDropTone === "match"
            ? `${formatSandboxTerm(activeDragCard)} 与 ${formatSandboxTerm(sandboxDropTarget)} 可合并`
            : sandboxDropTone === "pending"
                ? "先提取完全平方因子，再判断同类项"
                : `√${activeDragCard.rad} 与 √${sandboxDropTarget.rad} 不是同类项`;
        setSandboxStatus(message, state.sandbox.phase, sandboxDropTone === "match" ? "success" : "warning");
        pulseTouchFeedback(sandboxDropTone === "match" ? 10 : [8, 20, 8]);
    }
    
    // 重画
    updateSandboxCardsDOM();
}

function onSandboxCardDragEnd(e) {
    if (!activeDragCard || e.pointerId !== activeSandboxPointerId) return;
    
    const card = activeDragCard;
    const wasCancelled = e.type === "pointercancel";
    card.isDragging = false;
    activeDragCard = null;
    activeSandboxPointerId = null;

    const svg = document.getElementById("sandbox-svg");
    if (svg?.hasPointerCapture?.(e.pointerId)) svg.releasePointerCapture(e.pointerId);
    svg?.removeEventListener("pointermove", onSandboxCardDragMove);
    svg?.removeEventListener("pointerup", onSandboxCardDragEnd);
    svg?.removeEventListener("pointercancel", onSandboxCardDragEnd);

    if (wasCancelled) {
        card.x = originalDragPos.x;
        card.y = originalDragPos.y;
        sandboxDropTarget = null;
        sandboxDropTone = "idle";
        setSandboxStatus("手势已取消，卡片已复位。", state.sandbox.phase, "ready");
        updateSandboxCardsDOM();
        return;
    }

    if (!sandboxDragMoved) {
        sandboxDropTarget = null;
        sandboxDropTone = "idle";
        triggerSandboxFission(card);
        updateSandboxCardsDOM();
        return;
    }

    // 释放时，进行重叠碰撞判定
    let merged = false;
    for (let i = 0; i < state.sandbox.cards.length; i++) {
        const other = state.sandbox.cards[i];
        if (other === card || other.state !== "normal") continue;
        
        const dist = Math.hypot(card.x - other.x, card.y - other.y);
        if (dist < 86) {
            if (findMaxSquareFactor(card.rad) > 1 || findMaxSquareFactor(other.rad) > 1) {
                card.x = originalDragPos.x;
                card.y = originalDragPos.y;
                playSound("repel");
                setSandboxStatus("请先化简卡片，再判断是否属于同类二次根式。", "ready", "warning");
                break;
            }

            if (card.rad === other.rad) {
                merged = true;
                card.state = "fusion";
                card.targetCard = other;
                card.animT = 0;
                state.sandbox.busy = true;
                state.sandbox.fusionPlan = [{
                    target: other,
                    cards: [other, card],
                    totalCoef: other.coef + card.coef,
                    rad: other.rad
                }];
                setSandboxStatus("检测到同类项，正在合并系数。", "combining", "active");
                break;
            } else {
                // 非同类二次根式！产生排斥回弹与震颤
                playSound("repel");
                
                // 回弹到拖动前位置
                card.x = originalDragPos.x;
                card.y = originalDragPos.y;
                card.vx = (Math.random() - 0.5) * 4;
                card.vy = (Math.random() - 0.5) * 4;
                
                // 添加颤抖震动效果
                const domEl = document.getElementById(`card-${card.id}`);
                if (domEl) {
                    domEl.classList.add("shake-anim");
                    setTimeout(() => domEl.classList.remove("shake-anim"), 400);
                }
                
                // 弹出 HUD 报警
                setSandboxStatus(`√${card.rad} 与 √${other.rad} 不是同类项，不能合并。`, "combinable", "warning");
                break;
            }
        }
    }
    
    if (!merged) {
        // 自然释放，赋予滑动惯性
        card.vx = (card.x - originalDragPos.x) * 0.15;
        card.vy = (card.y - originalDragPos.y) * 0.15;
    }
    sandboxDropTarget = null;
    sandboxDropTone = "idle";
    updateSandboxCardsDOM();
}

// 触发卡片的分步裂变化简
function triggerSandboxFission(card) {
    if (card.state !== "normal" || state.sandbox.busy) return;
    
    const maxSq = findMaxSquareFactor(card.rad);
    if (maxSq === 1) {
        // 已经是稳定最简项，不需要化简
        playSound("tap");
        const domEl = document.getElementById(`card-${card.id}`);
        if (domEl) {
            domEl.classList.add("shake-anim");
            setTimeout(() => domEl.classList.remove("shake-anim"), 400);
        }
        
        setSandboxStatus(`${formatSandboxTerm(card)} 已经是最简二次根式。`, state.sandbox.phase, "warning");
        return;
    }

    state.sandbox.busy = true;
    card.state = "fission";
    card.animT = 0;
    card.fissionText = getFissionStepText(card.coef, card.rad, 0);
    playSound("tap");
    setSandboxStatus(`正在提取 ${formatSandboxTerm(card)} 中的完全平方因子。`, "simplifying", "active");
    scheduleSandboxFissionCompletion();
}

// --- 底部一键化简/合并 ---
function simplifyAllSandbox() {
    if (state.sandbox.busy || !state.sandbox.cards.length) return;
    let simplifiedAny = false;
    state.sandbox.cards.forEach(card => {
        const maxSq = findMaxSquareFactor(card.rad);
        if (maxSq > 1 && card.state === "normal") {
            card.state = "fission";
            card.animT = 0;
            card.fissionText = getFissionStepText(card.coef, card.rad, 0);
            simplifiedAny = true;
        }
    });
    if (simplifiedAny) {
        state.sandbox.busy = true;
        playSound("tap");
        setSandboxStatus("正在逐项提取完全平方因子。", "simplifying", "active");
        updateSandboxCardsDOM();
        scheduleSandboxFissionCompletion();
        return;
    }
    if (!simplifiedAny) {
        playSound("tap");
        setSandboxStatus("当前所有卡片都已经是最简二次根式。", state.sandbox.phase, "warning");
    }
}

function combineAllSandbox() {
    if (state.sandbox.busy || !state.sandbox.cards.length) return;
    if (state.sandbox.cards.some(card => findMaxSquareFactor(card.rad) > 1)) {
        state.sandbox.pendingCombine = true;
        simplifyAllSandbox();
        setSandboxStatus("检测到未化简根式，已先进行裂变化简；完成后将自动继续聚变。", "simplifying", "active");
        return;
    }

    const classes = {};
    state.sandbox.cards.forEach(card => {
        if (card.state !== "normal") return;
        if (!classes[card.rad]) classes[card.rad] = [];
        classes[card.rad].push(card);
    });

    const plans = Object.entries(classes)
        .filter(([, cards]) => cards.length > 1)
        .map(([rad, cards]) => ({
            target: cards[0],
            cards,
            totalCoef: cards.reduce((sum, card) => sum + card.coef, 0),
            rad: Number(rad)
        }));

    if (!plans.length) {
        playSound("tap");
        setSandboxStatus("当前没有化简后被开方数相同的根式项，不能继续聚变。", "completed", "warning");
        return;
    }

    plans.forEach(plan => {
        plan.cards.slice(1).forEach(card => {
            card.state = "fusion";
            card.targetCard = plan.target;
            card.animT = 0;
        });
    });
    state.sandbox.busy = true;
    state.sandbox.fusionPlan = plans;
    setSandboxStatus("同类根式产生磁力吸引，正在聚变并合并系数。", "combining", "active");
    updateSandboxCardsDOM();
    scheduleSandboxFusionCompletion();
}

function finalizeSandboxFusion() {
    const plans = state.sandbox.fusionPlan || [];
    const mergedCards = new Set(plans.flatMap(plan => plan.cards.slice(1)));
    state.sandbox.cards = state.sandbox.cards.filter(card => !mergedCards.has(card));
    plans.forEach(plan => {
        if (plan.totalCoef === 0) {
            state.sandbox.cards = state.sandbox.cards.filter(card => card !== plan.target);
            emitSandboxExplosion(plan.target, "#ef4444");
        } else {
            plan.target.coef = plan.totalCoef;
            plan.target.rad = plan.rad;
            plan.target.state = "normal";
            plan.target.targetCard = null;
            emitSandboxExplosion(plan.target, "#10b981");
        }
    });
    state.sandbox.cards.forEach(card => {
        card.state = "normal";
        card.targetCard = null;
    });
    state.sandbox.fusionPlan = null;
    state.sandbox.busy = false;
    layoutSandboxCards("output");
    playSound("fusion");
    setSandboxStatus(`合并完成：${formatSandboxExpression()}`, "completed", "success");
    updateSandboxCardsDOM();
}

function toggleSandboxExample() {
    if (state.sandbox.busy) return;
    initAudio();
    playSound("tap");
    if (state.sandbox.cards.length) {
        state.sandbox.cards = [];
        state.sandbox.fusionPlan = null;
        state.sandbox.pendingCombine = false;
        setSandboxStatus("反应舱已清空，可以恢复示例或从根式库重新注入。", "empty", "ready");
    } else {
        seedSandboxCards();
        setSandboxStatus("示例已恢复，请先化简三张根式卡。", "ready", "ready");
    }
    renderSandboxView();
}

// ==========================================================================
// 9. 模块三：化简挑战舱 (Challenge Level System)
// ==========================================================================
let challengeCardIdCounter = 500;

function getChallengeLayoutPositions(count) {
    const layouts = {
        1: [{ x: 300, y: 126 }],
        2: [{ x: 190, y: 126 }, { x: 410, y: 126 }],
        3: [{ x: 105, y: 126 }, { x: 300, y: 126 }, { x: 495, y: 126 }],
        4: [{ x: 92, y: 126 }, { x: 230, y: 126 }, { x: 370, y: 126 }, { x: 508, y: 126 }]
    };
    return layouts[count] || Array.from({ length: count }, (_, index) => ({
        x: 70 + (460 * index) / Math.max(1, count - 1),
        y: 126
    }));
}

function clientToChallengePoint(clientX, clientY) {
    const svg = document.getElementById("challenge-svg");
    const point = svg?.createSVGPoint();
    const matrix = svg?.getScreenCTM();
    if (!point || !matrix) return { x: 0, y: 0 };
    point.x = clientX;
    point.y = clientY;
    const transformed = point.matrixTransform(matrix.inverse());
    return { x: transformed.x, y: transformed.y };
}

function getChallengeEventClientPoint(event) {
    let x = event.clientX;
    let y = event.clientY;
    if (event.__mathSourceLocalPointerEvent) {
        const sceneRoot = document.getElementById("challenge-svg")?.closest(".math-source-scene");
        const nativeRect = typeof sceneRoot?.__mathSourceNativeGetBoundingClientRect === "function"
            ? sceneRoot.__mathSourceNativeGetBoundingClientRect()
            : null;
        x += nativeRect?.left || 0;
        y += nativeRect?.top || 0;
    }
    return { x, y };
}

function getChallengeDropTone(card, target) {
    if (!card || !target) return "idle";
    if (findMaxSquareFactor(card.rad) > 1 || findMaxSquareFactor(target.rad) > 1) return "pending";
    return card.rad === target.rad ? "match" : "reject";
}

function getChallengeDropPreview(card, target, tone) {
    if (tone === "pending") return "先化简，再判断同类项";
    if (tone === "reject") return `√${card.rad} 与 √${target.rad} 不是同类项`;
    const nextCoef = card.coef + target.coef;
    return `${formatChallengeExpression([card])} + ${formatChallengeExpression([target])} → ${nextCoef === 0 ? "0" : formatChallengeExpression([{ coef: nextCoef, rad: card.rad }])}`;
}

function renderChallengeGuidance() {
    const layer = document.getElementById("challenge-lines-layer");
    if (!layer) return;
    layer.innerHTML = "";
    const card = state.challenge.activeDragCard;
    const target = state.challenge.dropTarget;
    if (!card || !target) return;
    const tone = state.challenge.dropTone;
    layer.appendChild(createSVGNode("line", {
        x1: card.x,
        y1: card.y,
        x2: target.x,
        y2: target.y,
        class: `challenge-magnet-link ${tone}`
    }));
    layer.appendChild(createSVGNode("circle", {
        cx: target.x,
        cy: target.y,
        r: 76,
        class: `challenge-magnet-ring ${tone}`
    }));
    const previewWidth = 284;
    const previewX = 300 - previewWidth / 2;
    const previewY = card.y < 110 ? 194 : 10;
    layer.appendChild(createSVGNode("rect", {
        x: previewX,
        y: previewY,
        width: previewWidth,
        height: 34,
        rx: 17,
        class: `challenge-drop-preview ${tone}`
    }));
    const text = createSVGNode("text", {
        x: 300,
        y: previewY + 22,
        "text-anchor": "middle",
        class: `challenge-drop-preview-text ${tone}`
    });
    text.textContent = getChallengeDropPreview(card, target, tone);
    layer.appendChild(text);
}

function pulseTouchFeedback(pattern = 12) {
    if (reducedMotionQuery?.matches) return;
    if (typeof navigator.vibrate === "function") navigator.vibrate(pattern);
}

function setChallengeStatus(message, tone = "ready") {
    const statusLabel = document.getElementById("challenge-goal-status");
    if (!statusLabel) return;
    statusLabel.textContent = message;
    statusLabel.className = `challenge-hud-status ${tone === "success" ? "completed" : ""}`.trim();
    statusLabel.dataset.tone = tone;
}

function setHudExpanded(expanded, remember = true) {
    const hudPanel = document.querySelector(".hud-panel");
    const hudHeader = hudPanel?.querySelector(".hud-header");
    const hudControlButton = hudPanel?.querySelector(".hud-control-btn");
    if (!hudPanel) return;
    hudPanel.classList.toggle("collapsed", !expanded);
    hudPanel.classList.toggle("expanded", expanded);
    // 平台适配层也以宿主元素的 aria-expanded 控制折叠态样式；
    // 仅切换 class 会让展开内容继续被 42px 的折叠规则裁掉。
    hudPanel.setAttribute("aria-expanded", expanded ? "true" : "false");
    hudPanel.closest(".sandbox-column")?.classList.toggle("hud-expanded", expanded);
    hudHeader?.setAttribute("title", expanded ? "收起板书" : "展开板书");
    hudControlButton?.setAttribute("aria-expanded", expanded ? "true" : "false");
    hudControlButton?.setAttribute("title", expanded ? "收起板书" : "展开板书");
    if (remember) state.hudExpandedByTab[state.activeTab] = expanded;
}

function expandChallengeHud() {
    state.hudExpandedByTab["level-challenge"] = true;
    setHudExpanded(true);
}

function updateChallengeControls() {
    const busy = state.challenge.busy;
    const completed = state.challenge.completed;
    const cards = state.challenge.cards;
    const simplifyButton = document.getElementById("btn-challenge-simplify");
    const combineButton = document.getElementById("btn-challenge-combine");
    const nextButton = document.getElementById("btn-next-challenge");
    if (simplifyButton) {
        simplifyButton.disabled = busy || completed || !cards.some(card => findMaxSquareFactor(card.rad) > 1);
    }
    if (combineButton) {
        combineButton.disabled = busy || completed || cards.length < 2;
    }
    if (nextButton) nextButton.disabled = busy;
}

function loadChallengeCase(levelIdx = state.challenge.activeLevelIdx) {
    state.challenge.transitionSequence++;
    state.challenge.activeLevelIdx = levelIdx;
    state.challenge.completed = false;
    state.challenge.busy = false;
    state.challenge.pendingCombine = false;
    state.challenge.fusionPlan = null;
    state.challenge.activeDragCard = null;
    state.challenge.pointerId = null;
    state.challenge.dropTarget = null;
    state.challenge.dropTone = "idle";
    state.challenge.selectedCardId = null;
    state.challenge.questionNumber++;

    const challenge = generateRandomChallenge(levelIdx);
    const level = CHALLENGE_LEVELS[levelIdx] || CHALLENGE_LEVELS[0];
    state.challenge.currentChallenge = challenge;

    // 清空重装卡片
    const positions = getChallengeLayoutPositions(challenge.cards.length);
    state.challenge.cards = challenge.cards.map((card, index) => {
        return {
            id: `chal-${challengeCardIdCounter++}`,
            coef: card.coef,
            rad: card.rad,
            x: positions[index].x,
            y: positions[index].y,
            vx: 0, vy: 0,
            isDragging: false,
            state: "normal",
            animT: 0
        };
    });

    // 目标、状态和提示统一放进系统 HUD。
    const chalkboard = document.getElementById("hud-chalkboard-content");
    chalkboard.innerHTML = `
        <div class="challenge-hud-summary">
            <div class="challenge-hud-meta">
                <span class="challenge-hud-kicker">随机化简目标</span>
                <span class="challenge-hud-status" id="challenge-goal-status" role="status" aria-live="polite">准备中</span>
            </div>
            <div class="challenge-hud-expression" id="challenge-goal-expr">${challenge.expr}</div>
            <div class="challenge-hud-tip">${challenge.tip}</div>
        </div>
    `;
    setHudExpanded(state.hudExpandedByTab["level-challenge"] !== false, false);
    setChallengeStatus(`第 ${state.challenge.questionNumber} 题 · ${level.title}`, "ready");

    renderChallengeView();
    updateChallengeControls();
}

function renderChallengeView() {
    const layer = document.getElementById("challenge-cards-layer");
    layer.innerHTML = "";
    renderChallengeGuidance();
    state.challenge.cards.forEach(card => {
        drawSVGCardElement(card, layer, onChallengeCardDragStart, triggerChallengeFission, true);
    });
    updateChallengeControls();
}

function applyChallengeSimplification(card) {
    const simplified = fullySimplify(card.coef, card.rad);
    card.coef = simplified.coef;
    card.rad = simplified.rad;
    card.state = "normal";
    card.fissionText = "";
    card.animT = 0;
}

function simplifyAllChallenge() {
    if (state.challenge.busy || state.challenge.completed) return;
    const pendingCards = state.challenge.cards.filter(card => findMaxSquareFactor(card.rad) > 1);
    if (!pendingCards.length) {
        setChallengeStatus("全部已化为最简根式", "warning");
        updateChallengeControls();
        return;
    }

    state.challenge.busy = true;
    const sequence = ++state.challenge.transitionSequence;
    pendingCards.forEach(card => {
        card.state = "fission";
        card.animT = 0;
        card.fissionText = getFissionStepText(card.coef, card.rad, 0);
    });
    setChallengeStatus("正在提取完全平方因子", "active");
    playSound("tap");
    renderChallengeView();

    setTimeout(() => {
        if (sequence !== state.challenge.transitionSequence) return;
        pendingCards.forEach(card => {
            if (state.challenge.cards.includes(card)) applyChallengeSimplification(card);
        });
        state.challenge.busy = false;
        renderChallengeView();
        if (state.challenge.pendingCombine) {
            state.challenge.pendingCombine = false;
            combineAllChallenge();
            return;
        }
        setChallengeStatus("化简完成，继续合并同类项", "ready");
        checkChallengeCompletion();
    }, 720);
}

function combineAllChallenge() {
    if (state.challenge.busy || state.challenge.completed) return;
    if (state.challenge.cards.some(card => findMaxSquareFactor(card.rad) > 1)) {
        state.challenge.pendingCombine = true;
        simplifyAllChallenge();
        setChallengeStatus("检测到未化简项，将自动化简后继续合并", "active");
        return;
    }

    const groups = new Map();
    state.challenge.cards.forEach(card => {
        if (!groups.has(card.rad)) groups.set(card.rad, []);
        groups.get(card.rad).push(card);
    });
    const plans = Array.from(groups.entries())
        .filter(([, cards]) => cards.length > 1)
        .map(([rad, cards]) => ({
            rad,
            cards,
            target: cards[0],
            totalCoef: cards.reduce((sum, card) => sum + card.coef, 0)
        }));

    if (!plans.length) {
        checkChallengeCompletion();
        if (!state.challenge.completed) {
            setChallengeStatus("没有可合并的同类根式", "warning");
        }
        return;
    }

    state.challenge.busy = true;
    const sequence = ++state.challenge.transitionSequence;
    state.challenge.fusionPlan = plans;
    plans.forEach(plan => {
        plan.cards.slice(1).forEach(card => {
            card.state = "fusion";
            card.targetCard = plan.target;
            card.animT = 0;
        });
    });
    setChallengeStatus("正在按被开方数归类并合并系数", "active");
    playSound("tap");
    renderChallengeView();
    setTimeout(() => finalizeChallengeFusion(sequence), 620);
}

function finalizeChallengeFusion(sequence = state.challenge.transitionSequence) {
    if (sequence !== state.challenge.transitionSequence || !state.challenge.fusionPlan) return;
    const plans = state.challenge.fusionPlan;
    const groupedCards = new Set(plans.flatMap(plan => plan.cards));
    const nextCards = state.challenge.cards.filter(card => !groupedCards.has(card));
    plans.forEach(plan => {
        if (plan.totalCoef === 0) {
            const rect = document.getElementById("challenge-svg").getBoundingClientRect();
            triggerExplosion(rect.left + plan.target.x, rect.top + plan.target.y, "#ef4444");
            return;
        }
        plan.target.coef = plan.totalCoef;
        plan.target.rad = Number(plan.rad);
        plan.target.state = "normal";
        plan.target.targetCard = null;
        plan.target.animT = 0;
        nextCards.push(plan.target);
    });
    const positions = getChallengeLayoutPositions(nextCards.length);
    nextCards.forEach((card, index) => {
        card.x = positions[index].x;
        card.y = positions[index].y;
        card.state = "normal";
        card.targetCard = null;
    });
    state.challenge.cards = nextCards;
    state.challenge.fusionPlan = null;
    state.challenge.busy = false;
    playSound("fusion");
    renderChallengeView();
    checkChallengeCompletion();
}

function loadNextRandomChallenge() {
    if (state.challenge.busy) return;
    initAudio();
    playSound("tap");
    loadChallengeCase(state.challenge.activeLevelIdx);
}

// 挑战物理与聚变逻辑动画
function runChallengePhysics() {
    challengePhysicsFrameId = null;
    if (document.hidden || state.activeTab !== "level-challenge") return;

    let changed = false;

    state.challenge.cards.forEach(card => {
        if (card.isDragging) return;

        if (card.state === "fission") {
            // 裂变分步动画推进 (提升到 0.015 帧速率，约 1.1s 完成)
            card.animT += 0.015;
            const maxSq = findMaxSquareFactor(card.rad);
            const side = Math.sqrt(maxSq);
            const rem = card.rad / maxSq;

            if (card.animT < 1.0) {
                card.fissionText = getFissionStepText(card.coef, card.rad, card.animT);
            } else {
                card.coef = card.coef * side;
                card.rad = rem;
                card.state = "normal";
                card.fissionText = "";
                card.animT = 0;
                
                const containerRect = document.getElementById("challenge-svg").getBoundingClientRect();
                triggerExplosion(containerRect.left + card.x, containerRect.top + card.y, "#10b981");
                playSound("fusion");
                checkChallengeCompletion();
            }
            changed = true;
        }
        else if (card.state === "fusion" && card.targetCard) {
            card.animT += 0.08;
            card.x += (card.targetCard.x - card.x) * 0.25;
            card.y += (card.targetCard.y - card.y) * 0.25;

            if (!state.challenge.fusionPlan) {
                const dist = Math.hypot(card.x - card.targetCard.x, card.y - card.targetCard.y);
                if (dist < 10) card.state = "fading";
            }
            changed = true;
        }
    });

    const hasFading = state.challenge.cards.some(c => c.state === "fading");
    if (hasFading) {
        state.challenge.cards = state.challenge.cards.filter(c => c.state !== "fading");
        changed = true;
        checkChallengeCompletion();
    }

    if (changed) {
        renderChallengeView();
    }
    challengePhysicsFrameId = requestAnimationFrame(runChallengePhysics);
}

function onChallengeCardDragStart(e, card) {
    if (card.state !== "normal" || state.challenge.completed || state.challenge.busy) return;
    e.preventDefault();
    e.stopPropagation();
    initAudio();

    state.challenge.activeDragCard = card;
    card.isDragging = true;
    state.challenge.pointerId = e.pointerId;
    state.challenge.dragMoved = false;
    state.challenge.dropTarget = null;
    state.challenge.dropTone = "idle";
    const clientPoint = getChallengeEventClientPoint(e);
    state.challenge.dragStartClient = clientPoint;
    const svgEl = document.getElementById("challenge-svg");
    const point = clientToChallengePoint(clientPoint.x, clientPoint.y);
    state.challenge.dragOffset.x = point.x - card.x;
    state.challenge.dragOffset.y = point.y - card.y;

    state.challenge.dragOrigin.x = card.x;
    state.challenge.dragOrigin.y = card.y;
    svgEl?.setPointerCapture?.(e.pointerId);
    svgEl?.addEventListener("pointermove", onChallengeCardDragMove, { passive: false });
    svgEl?.addEventListener("pointerup", onChallengeCardDragEnd);
    svgEl?.addEventListener("pointercancel", onChallengeCardDragCancel);
}

function onChallengeCardDragMove(e) {
    if (!state.challenge.activeDragCard || e.pointerId !== state.challenge.pointerId) return;
    e.preventDefault();
    const clientPoint = getChallengeEventClientPoint(e);
    const point = clientToChallengePoint(clientPoint.x, clientPoint.y);
    const card = state.challenge.activeDragCard;
    card.x = Math.max(66, Math.min(534, point.x - state.challenge.dragOffset.x));
    card.y = Math.max(42, Math.min(198, point.y - state.challenge.dragOffset.y));
    state.challenge.dragMoved = state.challenge.dragMoved || Math.hypot(
        clientPoint.x - state.challenge.dragStartClient.x,
        clientPoint.y - state.challenge.dragStartClient.y
    ) >= 8;

    const previousTarget = state.challenge.dropTarget;
    const nearest = state.challenge.cards
        .filter(other => other !== card && other.state === "normal")
        .map(other => ({ other, distance: Math.hypot(card.x - other.x, card.y - other.y) }))
        .sort((left, right) => left.distance - right.distance)[0];
    state.challenge.dropTarget = nearest && nearest.distance <= 105 ? nearest.other : null;
    state.challenge.dropTone = getChallengeDropTone(card, state.challenge.dropTarget);
    if (state.challenge.dropTarget && state.challenge.dropTarget !== previousTarget) {
        const tone = state.challenge.dropTone;
        setChallengeStatus(getChallengeDropPreview(card, state.challenge.dropTarget, tone), tone === "match" ? "active" : "warning");
        pulseTouchFeedback(tone === "match" ? 10 : [8, 20, 8]);
    }
    renderChallengeView();
}

function onChallengeCardDragCancel(e) {
    finishChallengeCardDrag(e, true);
}

function onChallengeCardDragEnd(e) {
    finishChallengeCardDrag(e, false);
}

function finishChallengeCardDrag(e, cancelled) {
    const card = state.challenge.activeDragCard;
    if (!card || e.pointerId !== state.challenge.pointerId) return;
    const svgEl = document.getElementById("challenge-svg");
    if (svgEl?.hasPointerCapture?.(e.pointerId)) svgEl.releasePointerCapture(e.pointerId);
    svgEl?.removeEventListener("pointermove", onChallengeCardDragMove);
    svgEl?.removeEventListener("pointerup", onChallengeCardDragEnd);
    svgEl?.removeEventListener("pointercancel", onChallengeCardDragCancel);

    const moved = state.challenge.dragMoved;
    const target = state.challenge.dropTarget;
    const tone = state.challenge.dropTone;
    card.isDragging = false;
    state.challenge.activeDragCard = null;
    state.challenge.pointerId = null;
    state.challenge.dropTarget = null;
    state.challenge.dropTone = "idle";

    if (cancelled) {
        card.x = state.challenge.dragOrigin.x;
        card.y = state.challenge.dragOrigin.y;
        setChallengeStatus("手势已取消，卡片已复位", "ready");
        renderChallengeView();
        return;
    }

    if (!moved) {
        state.challenge.selectedCardId = card.id;
        if (findMaxSquareFactor(card.rad) > 1) triggerChallengeFission(card);
        else setChallengeStatus(`${formatChallengeExpression([card])} 已选中，可拖向同类项`, "ready");
        renderChallengeView();
        return;
    }

    if (!target) {
        setChallengeStatus("已移动卡片，靠近同类项会出现绿色磁吸提示", "ready");
        renderChallengeView();
        return;
    }

    if (tone !== "match") {
        card.x = state.challenge.dragOrigin.x;
        card.y = state.challenge.dragOrigin.y;
        setChallengeStatus(tone === "pending" ? "请先逐项化简，再进行归类" : "被开方数不同，不能合并", "warning");
        playSound("repel");
        pulseTouchFeedback([18, 28, 18]);
        renderChallengeView();
        return;
    }

    const nextCoef = card.coef + target.coef;
    card.state = "fusion";
    card.targetCard = target;
    card.animT = 0;
    state.challenge.busy = true;
    setChallengeStatus(getChallengeDropPreview(card, target, "match"), "active");
    pulseTouchFeedback(18);
    setTimeout(() => {
        state.challenge.cards = state.challenge.cards.filter(c => c !== card && (nextCoef !== 0 || c !== target));
        if (nextCoef !== 0) {
            target.coef = nextCoef;
            target.state = "normal";
            target.targetCard = null;
        }
        state.challenge.busy = false;
        state.challenge.selectedCardId = null;
        const containerRect = document.getElementById("challenge-svg").getBoundingClientRect();
        triggerExplosion(containerRect.left + target.x, containerRect.top + target.y, nextCoef === 0 ? "#ef4444" : "#10b981");
        playSound("fusion");
        renderChallengeView();
        checkChallengeCompletion();
    }, 240);
    renderChallengeView();
}

function triggerChallengeFission(card) {
    if (card.state !== "normal" || state.challenge.completed || state.challenge.busy) return;
    const maxSq = findMaxSquareFactor(card.rad);
    if (maxSq === 1) {
        playSound("tap");
        const domEl = document.getElementById(`card-${card.id}`);
        if (domEl) {
            domEl.classList.add("shake-anim");
            setTimeout(() => domEl.classList.remove("shake-anim"), 400);
        }
        
        setChallengeStatus(`${formatChallengeExpression([card])} 已是最简根式`, "warning");
        return;
    }

    card.state = "fission";
    card.animT = 0;
    card.fissionText = getFissionStepText(card.coef, card.rad, 0);
    playSound("tap");
    setChallengeStatus(`正在化简 ${formatChallengeExpression([card])}`, "active");
    renderChallengeView();
    setTimeout(() => {
        if (!state.challenge.cards.includes(card) || card.state !== "fission") return;
        applyChallengeSimplification(card);
        renderChallengeView();
        setChallengeStatus("单项化简完成", "ready");
        checkChallengeCompletion();
    }, 900);
}

// 检查挑战是否完成
function checkChallengeCompletion() {
    if (state.challenge.completed || state.challenge.busy) return;
    const activeChallenge = state.challenge.currentChallenge;
    if (!activeChallenge) return;

    // 1. 判断是否所有剩余卡片都已是最简项
    const allSimplest = state.challenge.cards.every(c => findMaxSquareFactor(c.rad) === 1);
    if (!allSimplest) return;

    // 2. 检查是否有同类项未合并 (即没有两个卡片 rad 完全一样)
    const rads = state.challenge.cards.map(c => c.rad);
    const hasUnmerged = new Set(rads).size !== rads.length;
    if (hasUnmerged) return;

    // 3. 使用精确的“系数 + 被开方数”项比较，避免浮点近似误判。
    const currentTerms = getChallengeCanonicalTerms(state.challenge.cards);
    if (challengeTermsMatch(currentTerms, activeChallenge.targetTerms)) {
        // 通关！
        state.challenge.completed = true;
        setChallengeStatus("挑战成功", "success");
        playSound("success");
        
        // 在屏幕中心喷射粒子大烟花
        const containerRect = document.getElementById("challenge-svg").getBoundingClientRect();
        const centerX = containerRect.left + containerRect.width / 2;
        const centerY = containerRect.top + containerRect.height / 2;
        
        for (let j = 0; j < 3; j++) {
            setTimeout(() => {
                triggerExplosion(centerX + (Math.random() - 0.5) * 80, centerY + (Math.random() - 0.5) * 40, "#10b981");
            }, j * 150);
        }

        // 更新板书为贺卡
        const chalkboard = document.getElementById("hud-chalkboard-content");
        chalkboard.innerHTML = `
            <div class="challenge-hud-summary is-success">
                <div class="challenge-hud-meta">
                    <span class="challenge-hud-kicker">随机挑战完成</span>
                    <span class="challenge-hud-status completed" data-tone="success" role="status" aria-live="polite">挑战成功</span>
                </div>
                <div class="challenge-hud-label">原式</div>
                <div class="challenge-hud-expression is-source">${activeChallenge.expr}</div>
                <div class="challenge-hud-label">最简结果</div>
                <div class="challenge-hud-expression is-result">${formatChallengeResult(state.challenge.cards)}</div>
            </div>
        `;
        updateChallengeControls();
    } else {
        setChallengeStatus("结果不匹配，请检查系数", "warning");
    }
}

// ==========================================================================
// 10. 页签与控制初始化 (Tab Routing & App Bindings)
// ==========================================================================

function advanceGeomStage() {
    const maxSq = findMaxSquareFactor(state.deconstruct.rad);
    if (maxSq === 1) return;
    state.deconstruct.geomStage = (state.deconstruct.geomStage + 1) % 4;
    renderGeomPuzzle();
    const labels = ["面积拼图已重置", "已圈出最大平方区域", "平方块已移出根号", "几何化简完成"];
    const status = document.getElementById("deconstruct-status-text");
    if (status) status.textContent = labels[state.deconstruct.geomStage];
}

function advanceTreeStage() {
    const maxSq = findMaxSquareFactor(state.deconstruct.rad);
    if (maxSq === 1) return;
    state.deconstruct.treeStage = (state.deconstruct.treeStage + 1) % 3;
    renderFactorTree();
    const labels = ["质因数图谱已重置", "质因数已展开，寻找成对因子", "成对因子已提取到根号外"];
    const status = document.getElementById("deconstruct-status-text");
    if (status) status.textContent = labels[state.deconstruct.treeStage];
}

function switchTab(tabId) {
    state.activeTab = tabId;
    const panelScroll = document.querySelector(".math-source-panel-scroll");
    if (panelScroll) panelScroll.scrollTop = 0;
    const hudTitle = document.querySelector(".hud-title");
    if (hudTitle) {
        hudTitle.textContent = tabId === "level-challenge"
            ? "随机化简挑战"
            : tabId === "level-sandbox"
                ? "同类根式聚变"
                : "根式化简步骤";
    }
    
    // 更新导航样式
    document.querySelectorAll(".tab-btn").forEach(btn => {
        if (btn.getAttribute("data-tab") === tabId) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    // 切换面板显示
    document.querySelectorAll(".view-panel").forEach(p => {
        p.classList.remove("active");
    });
    
    const panelId = tabId === "level-deconstruct" ? "view-deconstruct" : 
                    tabId === "level-sandbox" ? "view-sandbox" : "view-challenge";
    document.getElementById(panelId).classList.add("active");

    // 切换控制侧栏选项卡
    const controlColumn = document.querySelector(".control-column");
    if (controlColumn) controlColumn.dataset.activeMode = tabId;
    const challengePanel = document.getElementById("challenge-list-panel");
    const sharedPanels = document.querySelectorAll('[data-mode-section="shared"]');
    if (tabId === "level-challenge") {
        challengePanel.hidden = false;
        sharedPanels.forEach(panel => { panel.hidden = true; });
        loadChallengeCase(state.challenge.activeLevelIdx);
    } else {
        challengePanel.hidden = true;
        sharedPanels.forEach(panel => { panel.hidden = false; });
        setHudExpanded(state.hudExpandedByTab[tabId] === true, false);
    }

    if (tabId === "level-deconstruct") {
        initDeconstructLevel();
    } else if (tabId === "level-sandbox") {
        seedSandboxCards();
        renderSandboxView();
        setSandboxStatus(state.sandbox.message, state.sandbox.phase, state.sandbox.phase === "completed" ? "success" : "ready");
    }
    scheduleActivePhysics();
}

// 绑定所有的事件处理器
function bindEvents() {
    const hudPanel = document.querySelector(".hud-panel");
    const hudHeader = hudPanel?.querySelector(".hud-header");
    if (hudPanel && hudHeader) {
        const hudControlButton = hudHeader.querySelector(".hud-control-btn");
        hudControlButton?.setAttribute("aria-expanded", hudPanel.classList.contains("collapsed") ? "false" : "true");
        hudControlButton?.setAttribute("title", hudPanel.classList.contains("collapsed") ? "展开板书" : "收起板书");
        const toggleHud = () => setHudExpanded(hudPanel.classList.contains("collapsed"));
        let lastHudPointerToggleAt = 0;
        const isHudHeaderEvent = event => {
            const target = event.target && typeof event.target.closest === "function" ? event.target : null;
            return Boolean(target?.closest(".hud-header"));
        };
        window.addEventListener("pointerdown", event => {
            if (!isHudHeaderEvent(event)) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            lastHudPointerToggleAt = Date.now();
            toggleHud();
        }, true);
        window.addEventListener("click", event => {
            if (!isHudHeaderEvent(event)) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            if (Date.now() - lastHudPointerToggleAt < 500) return;
            toggleHud();
        }, true);
    }

    // 1. 顶部页签切换
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            initAudio();
            switchTab(btn.getAttribute("data-tab"));
        });
    });

    // 2. 预设能量储备卡渲染
    const library = document.getElementById("library-cards-container");
    library.innerHTML = "";
    PRESETS.forEach(preset => {
        const div = document.createElement("div");
        const maxSq = findMaxSquareFactor(preset.rad);
        div.className = `library-card ${maxSq === 1 ? 'simplified' : ''}`;
        div.innerHTML = `&radic;${preset.rad}`;
        div.addEventListener("click", () => {
            initAudio();
            if (state.activeTab === "level-deconstruct") {
                state.deconstruct.rad = preset.rad;
                initDeconstructLevel();
            } else if (state.activeTab === "level-sandbox") {
                spawnSandboxCard(preset.coef, preset.rad);
            }
        });
        library.appendChild(div);
    });

    // 3. 自定义表单提交
    document.getElementById("form-custom-radical").addEventListener("submit", (e) => {
        e.preventDefault();
        initAudio();
        const val = parseInt(document.getElementById("input-n-val").value);
        if (isNaN(val) || val < 2 || val > 999) return;
        
        if (state.activeTab === "level-deconstruct") {
            state.deconstruct.rad = val;
            initDeconstructLevel();
        } else if (state.activeTab === "level-sandbox") {
            spawnSandboxCard(1, val);
        }
    });

    // 4. 关卡一解构仪步骤控制器
    document.getElementById("btn-geom-step").addEventListener("click", () => {
        initAudio();
        playSound("tap");
        advanceGeomStage();
    });

    document.getElementById("btn-tree-step").addEventListener("click", () => {
        initAudio();
        playSound("tap");
        advanceTreeStage();
    });

    [
        ["svg-geom-puzzle", advanceGeomStage, "点击面积拼图，逐步提取平方因子"],
        ["svg-factor-tree", advanceTreeStage, "点击因子图谱，逐步配对质因数"]
    ].forEach(([id, action, label]) => {
        const svg = document.getElementById(id);
        if (!svg) return;
        svg.setAttribute("role", "button");
        svg.setAttribute("tabindex", "0");
        svg.setAttribute("aria-label", label);
        svg.addEventListener("pointerup", event => {
            if (event.pointerType === "mouse" && event.button !== 0) return;
            initAudio();
            playSound("tap");
            action();
        });
        svg.addEventListener("keydown", event => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            action();
        });
    });

    // 5. 沙盒反应器操作
    document.getElementById("btn-simplify-all").onclick = simplifyAllSandbox;
    document.getElementById("btn-combine-all").onclick = combineAllSandbox;
    document.getElementById("btn-clear-reactor").onclick = toggleSandboxExample;

    // 6. 随机挑战操作
    document.getElementById("btn-challenge-simplify").onclick = simplifyAllChallenge;
    document.getElementById("btn-challenge-combine").onclick = combineAllChallenge;
    document.getElementById("btn-next-challenge").onclick = loadNextRandomChallenge;

    // 7. 挑战难度按钮动态生成；每次点击都会生成新题。
    const selectors = document.getElementById("challenge-selectors");
    selectors.innerHTML = "";
    CHALLENGE_LEVELS.forEach((level, idx) => {
        const btn = document.createElement("button");
        btn.className = `btn-challenge-select ${idx === 0 ? 'active' : ''}`;
        btn.dataset.challengeLevel = level.id;
        btn.innerHTML = `
            <span>${level.title}</span>
            <span class="challenge-math-expr">${level.summary}</span>
        `;
        btn.addEventListener("click", () => {
            initAudio();
            document.querySelectorAll(".btn-challenge-select").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            loadChallengeCase(idx);
        });
        selectors.appendChild(btn);
    });

    // 8. 说明弹窗绑定
    document.getElementById("btn-show-help").addEventListener("click", () => {
        initAudio();
        playSound("tap");
        document.getElementById("modal-help").classList.add("active");
    });
    
    document.getElementById("btn-close-help").addEventListener("click", () => {
        playSound("tap");
        document.getElementById("modal-help").classList.remove("active");
    });
    
    document.getElementById("modal-help").addEventListener("click", (e) => {
        if (e.target === document.getElementById("modal-help")) {
            document.getElementById("modal-help").classList.remove("active");
        }
    });
}

// ==========================================================================
// 11. 初始化加载
// ==========================================================================
function init() {
    bindEvents();
    switchTab("level-deconstruct");
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            if (sandboxPhysicsFrameId !== null) cancelAnimationFrame(sandboxPhysicsFrameId);
            if (challengePhysicsFrameId !== null) cancelAnimationFrame(challengePhysicsFrameId);
            sandboxPhysicsFrameId = null;
            challengePhysicsFrameId = null;
            return;
        }
        scheduleActivePhysics();
        if ((particlesList.length || ripplesList.length) && !particlesAnimId) tickParticles();
    });
}

// 当页面DOM加载完毕后执行初始化
window.addEventListener("DOMContentLoaded", init);
