/**
 * 因式分解面积拼图实验室 - 交互逻辑 (app.js)
 * 1. 关卡状态与瓷砖数据定义 (x=3单位, 1=1单位, 格点U=38px)
 * 2. 鼠标/触屏拖拽、多维度格点磁吸对齐系统
 * 3. 实时无重叠、连通矩形拼接验证算法
 * 4. 自动演示拼图排列动画
 * 5. Web Audio API 音效合成器 + Canvas 庆祝烟花
 */

// ==========================================================================
// 1. 全局配置与状态
// ==========================================================================
const U = 38; // 格子尺寸 (px)
const GRID_COLS = 12;
const GRID_ROWS = 12;

// 关卡数据定义
const PRESETS = {
    "1": {
        p: 1, q: 2, r: 1, s: 1,
        formulaHtml: "<span class='badge-x2'>x²</span> + <span class='badge-x'>3x</span> + <span class='badge-unit'>2</span>",
        formulaText: "x² + 3x + 2",
        factoredText: "(x + 2)(x + 1)",
        factoredHtml: "(x + 2)(x + 1)",
        targets: { x2: 1, x: 3, unit: 2 },
        // 自动演示绝对坐标排版 (gridX, gridY, rotated)
        autoLayout: [
            { type: "x2", gridX: 3, gridY: 3, rotated: false },
            { type: "x", gridX: 3, gridY: 6, rotated: false },     // 横向 x
            { type: "x", gridX: 6, gridY: 3, rotated: true },      // 纵向 x
            { type: "x", gridX: 7, gridY: 3, rotated: true },      // 纵向 x
            { type: "unit", gridX: 6, gridY: 6, rotated: false },
            { type: "unit", gridX: 7, gridY: 6, rotated: false }
        ]
    },
    "2": {
        p: 1, q: 3, r: 1, s: 2,
        formulaHtml: "<span class='badge-x2'>x²</span> + <span class='badge-x'>5x</span> + <span class='badge-unit'>6</span>",
        formulaText: "x² + 5x + 6",
        factoredText: "(x + 3)(x + 2)",
        factoredHtml: "(x + 3)(x + 2)",
        targets: { x2: 1, x: 5, unit: 6 },
        autoLayout: [
            { type: "x2", gridX: 3, gridY: 3, rotated: false },
            { type: "x", gridX: 3, gridY: 6, rotated: false },
            { type: "x", gridX: 3, gridY: 7, rotated: false },
            { type: "x", gridX: 6, gridY: 3, rotated: true },
            { type: "x", gridX: 7, gridY: 3, rotated: true },
            { type: "x", gridX: 8, gridY: 3, rotated: true },
            { type: "unit", gridX: 6, gridY: 6, rotated: false },
            { type: "unit", gridX: 7, gridY: 6, rotated: false },
            { type: "unit", gridX: 8, gridY: 6, rotated: false },
            { type: "unit", gridX: 6, gridY: 7, rotated: false },
            { type: "unit", gridX: 7, gridY: 7, rotated: false },
            { type: "unit", gridX: 8, gridY: 7, rotated: false }
        ]
    },
    "3": {
        p: 1, q: 2, r: 1, s: 2,
        formulaHtml: "<span class='badge-x2'>x²</span> + <span class='badge-x'>4x</span> + <span class='badge-unit'>4</span>",
        formulaText: "x² + 4x + 4",
        factoredText: "(x + 2)²",
        factoredHtml: "(x + 2)²",
        targets: { x2: 1, x: 4, unit: 4 },
        autoLayout: [
            { type: "x2", gridX: 3, gridY: 3, rotated: false },
            { type: "x", gridX: 3, gridY: 6, rotated: false },
            { type: "x", gridX: 3, gridY: 7, rotated: false },
            { type: "x", gridX: 6, gridY: 3, rotated: true },
            { type: "x", gridX: 7, gridY: 3, rotated: true },
            { type: "unit", gridX: 6, gridY: 6, rotated: false },
            { type: "unit", gridX: 7, gridY: 6, rotated: false },
            { type: "unit", gridX: 6, gridY: 7, rotated: false },
            { type: "unit", gridX: 7, gridY: 7, rotated: false }
        ]
    },
    "4": {
        p: 2, q: 1, r: 1, s: 2,
        formulaHtml: "<span class='badge-x2'>2x²</span> + <span class='badge-x'>5x</span> + <span class='badge-unit'>2</span>",
        formulaText: "2x² + 5x + 2",
        factoredText: "(2x + 1)(x + 2)",
        factoredHtml: "(2x + 1)(x + 2)",
        targets: { x2: 2, x: 5, unit: 2 },
        autoLayout: [
            { type: "x2", gridX: 2, gridY: 3, rotated: false },
            { type: "x2", gridX: 5, gridY: 3, rotated: false },
            { type: "x", gridX: 2, gridY: 6, rotated: false },
            { type: "x", gridX: 5, gridY: 6, rotated: false },
            { type: "x", gridX: 2, gridY: 7, rotated: false },
            { type: "x", gridX: 5, gridY: 7, rotated: false },
            { type: "x", gridX: 8, gridY: 3, rotated: true },
            { type: "unit", gridX: 8, gridY: 6, rotated: false },
            { type: "unit", gridX: 8, gridY: 7, rotated: false }
        ]
    }
};

let currentPresetId = "1";
let sandboxPreset = null; // 随机沙盒题目动态缓存

// 获取当前激活的关卡配置
function getActivePreset() {
    if (currentPresetId === "sandbox") {
        return sandboxPreset;
    }
    return PRESETS[currentPresetId];
}

// 随机沙盒题目生成算法 (px + q)(rx + s)
function generateRandomSandbox() {
    const validChoices = [];
    
    // 遍历整系数组合，限制大矩形包络尺寸 <= 10 单位以完美容纳在 12x12 网格中
    for (let p = 1; p <= 2; p++) {
        for (let r = 1; r <= 2; r++) {
            for (let q = 1; q <= 4; q++) {
                for (let s = 1; s <= 4; s++) {
                    const width = p * 3 + q;
                    const height = r * 3 + s;
                    
                    if (width <= 10 && height <= 10) {
                        const a = p * r;
                        const b = p * s + q * r;
                        const c = q * s;
                        
                        // 排除预设题目以保证新颖性
                        const isPreset = (a === 1 && b === 3 && c === 2) || 
                                         (a === 1 && b === 5 && c === 6) || 
                                         (a === 1 && b === 4 && c === 4) || 
                                         (a === 2 && b === 5 && c === 2);
                                         
                        if (!isPreset) {
                            validChoices.push({ p, q, r, s, a, b, c, width, height });
                        }
                    }
                }
            }
        }
    }
    
    const choice = validChoices[Math.floor(Math.random() * validChoices.length)];
    
    // 动态解算居中排版绝对坐标
    const startX = Math.floor((GRID_COLS - choice.width) / 2);
    const startY = Math.floor((GRID_ROWS - choice.height) / 2);
    const autoLayout = [];
    
    // 1. x² tiles
    for (let i = 0; i < choice.p; i++) {
        for (let j = 0; j < choice.r; j++) {
            autoLayout.push({ type: "x2", gridX: startX + i * 3, gridY: startY + j * 3, rotated: false });
        }
    }
    
    // 2. Horizontal x tiles
    for (let i = 0; i < choice.p; i++) {
        for (let k = 0; k < choice.s; k++) {
            autoLayout.push({ type: "x", gridX: startX + i * 3, gridY: startY + choice.r * 3 + k, rotated: false });
        }
    }
    
    // 3. Vertical x tiles
    for (let l = 0; l < choice.q; l++) {
        for (let j = 0; j < choice.r; j++) {
            autoLayout.push({ type: "x", gridX: startX + choice.p * 3 + l, gridY: startY + j * 3, rotated: true });
        }
    }
    
    // 4. Unit 1 tiles
    for (let l = 0; l < choice.q; l++) {
        for (let k = 0; k < choice.s; k++) {
            autoLayout.push({ type: "unit", gridX: startX + choice.p * 3 + l, gridY: startY + choice.r * 3 + k, rotated: false });
        }
    }
    
    const labelA = choice.a === 1 ? "" : choice.a;
    const labelP = choice.p === 1 ? "x" : `${choice.p}x`;
    const labelR = choice.r === 1 ? "x" : `${choice.r}x`;
    
    sandboxPreset = {
        p: choice.p,
        q: choice.q,
        r: choice.r,
        s: choice.s,
        formulaHtml: `<span class='badge-x2'>${labelA}x²</span> + <span class='badge-x'>${choice.b}x</span> + <span class='badge-unit'>${choice.c}</span>`,
        formulaText: `${labelA}x² + ${choice.b}x + ${choice.c}`,
        factoredText: `(${labelP} + ${choice.q})(${labelR} + ${choice.s})`,
        factoredHtml: `(${labelP} + ${choice.q})(${labelR} + ${choice.s})`,
        targets: {
            x2: choice.a,
            x: choice.b,
            unit: choice.c
        },
        autoLayout: autoLayout
    };
}

let placedTiles = []; // 已放置在画布上的瓷砖实例
let drawerCounts = { x2: 0, x: 0, unit: 0 };
let isHudExpanded = false;
let isSolved = false;

// DOM 元素引用
const gridBoard = document.getElementById("grid-board");
const placedTilesContainer = document.getElementById("placed-tiles-container");
const dimensionsOverlay = document.getElementById("dimensions-overlay");
const stepsChalkboard = document.getElementById("steps-hud-chalkboard");
const hudPanel = document.getElementById("hud-chalkboard-panel");
const hudToggleBtn = document.getElementById("hud-toggle-btn");
const hudArrowIcon = hudPanel?.querySelector(".hud-arrow-icon");
let isApplyingHudPlacement = false;
let hudPlacementObserver = null;

function applyHudPlacement() {
    if (!hudPanel) return;
    const width = hudPanel.classList.contains("collapsed")
        ? "176px"
        : "min(392px, calc(100% - 36px))";
    if (hudArrowIcon) {
        hudArrowIcon.textContent = hudPanel.classList.contains("collapsed") ? "⌄" : "⌃";
    }
    isApplyingHudPlacement = true;
    hudPanel.style.setProperty("position", "absolute", "important");
    hudPanel.style.setProperty("top", "18px", "important");
    hudPanel.style.setProperty("left", "18px", "important");
    hudPanel.style.setProperty("right", "auto", "important");
    hudPanel.style.setProperty("z-index", "180", "important");
    hudPanel.style.setProperty("width", width, "important");
    hudPanel.style.setProperty("max-width", "calc(100% - 36px)", "important");
    hudPanel.style.setProperty("max-height", "none", "important");
    window.setTimeout(() => {
        isApplyingHudPlacement = false;
    }, 0);
}

function scheduleHudPlacement() {
    applyHudPlacement();
    requestAnimationFrame(applyHudPlacement);
    window.setTimeout(applyHudPlacement, 0);
    window.setTimeout(applyHudPlacement, 120);
}

function installHudPlacementObserver() {
    if (!hudPanel || hudPlacementObserver || typeof MutationObserver === "undefined") return;
    hudPlacementObserver = new MutationObserver(() => {
        if (isApplyingHudPlacement) return;
        requestAnimationFrame(applyHudPlacement);
        window.setTimeout(applyHudPlacement, 80);
    });
    hudPlacementObserver.observe(hudPanel, {
        attributes: true,
        attributeFilter: ["class", "style"]
    });
}

const countX2 = document.getElementById("count-x2");
const countX = document.getElementById("count-x");
const countUnit = document.getElementById("count-1");

const btnAutoAssemble = document.getElementById("btn-auto-assemble");
const btnResetBoard = document.getElementById("btn-reset-board");
const btnShowHelp = document.getElementById("btn-show-help");
const btnCloseHelp = document.getElementById("btn-close-help");
const modalHelp = document.getElementById("modal-help");

// ==========================================================================
// 2. Web Audio API 合成音效
// ==========================================================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'snap') {
        // 卡片吸附清脆音
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(1174.66, audioCtx.currentTime + 0.08); // D6
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'rotate') {
        // 旋转嗖声
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(329.63, audioCtx.currentTime); // E4
        osc.frequency.exponentialRampToValueAtTime(659.25, audioCtx.currentTime + 0.12); // E5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
    } else if (type === 'success') {
        // 成功和弦庆祝
        const now = audioCtx.currentTime;
        const freqs = [523.25, 659.25, 783.99, 1046.50]; // C 和弦 (C5, E5, G5, C6)
        freqs.forEach((f, index) => {
            const o = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(f, now + index * 0.06);
            g.gain.setValueAtTime(0.08, now + index * 0.06);
            g.gain.exponentialRampToValueAtTime(0.001, now + index * 0.06 + 0.8);
            o.connect(g);
            g.connect(audioCtx.destination);
            o.start(now + index * 0.06);
            o.stop(now + index * 0.06 + 0.8);
        });
    } else if (type === 'delete') {
        // 删除气泡声
        osc.type = 'sine';
        osc.frequency.setValueAtTime(392.00, audioCtx.currentTime); // G4
        osc.frequency.exponentialRampToValueAtTime(196.00, audioCtx.currentTime + 0.1); // G3
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
    }
}

// ==========================================================================
// 3. Canvas 粒子庆祝礼花烟花系统
// ==========================================================================
const canvas = document.getElementById("particles-canvas");
const ctx = canvas.getContext("2d");
let particles = [];
let animId = null;

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 3;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed - 2.5; // 带有初始向上冲力
        this.radius = Math.random() * 4 + 2;
        this.alpha = 1.0;
        this.decay = Math.random() * 0.02 + 0.015;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.18; // 重力
        this.alpha -= this.decay;
    }
    draw(c) {
        c.save();
        c.globalAlpha = Math.max(0, this.alpha);
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = this.color;
        c.shadowBlur = 8;
        c.shadowColor = this.color;
        c.fill();
        c.restore();
    }
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function triggerExplosion(x, y) {
    const colors = ["#3b82f6", "#a78bfa", "#f43f5e", "#10b981", "#fbbf24", "#ffffff"];
    for (let i = 0; i < 60; i++) {
        particles.push(new Particle(x, y, colors[Math.floor(Math.random() * colors.length)]));
    }
    if (!animId) {
        tickParticles();
    }
}

function tickParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        if (p.alpha <= 0) {
            particles.splice(i, 1);
        } else {
            p.draw(ctx);
        }
    }
    if (particles.length > 0) {
        animId = requestAnimationFrame(tickParticles);
    } else {
        animId = null;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

// ==========================================================================
// 4. 网格对齐、卡片创建与拖拽管理 (Tile Management & Dragger)
// ==========================================================================
let dragTile = null;
let dragStartX = 0;
let dragStartY = 0;
let dragOffsetLeft = 0;
let dragOffsetTop = 0;

// 创建吸附网格单元格指示器 (Ghost Preview)
const ghost = document.createElement("div");
ghost.className = "snap-preview-ghost";
gridBoard.appendChild(ghost);

function suppressTouchSystemGestures(e) {
    if (e.target.closest("#grid-board, .algebra-tile, .tile-drawer-container, #hud-chalkboard-panel")) {
        e.preventDefault();
    }
}

function getTileFootprint(tileLike) {
    const type = typeof tileLike === "string" ? tileLike : tileLike.type;
    const rotated = typeof tileLike === "string" ? false : tileLike.rotated;
    if (type === "x2") return { w: 3, h: 3, cells: 9 };
    if (type === "x") return { w: rotated ? 1 : 3, h: rotated ? 3 : 1, cells: 3 };
    return { w: 1, h: 1, cells: 1 };
}

function getUsedTileCounts() {
    return placedTiles.reduce((counts, tile) => {
        counts[tile.type] += 1;
        return counts;
    }, { x2: 0, x: 0, unit: 0 });
}

function getAreaTextFromCounts(counts) {
    const parts = [];
    if (counts.x2 > 0) parts.push(counts.x2 === 1 ? "x²" : `${counts.x2}x²`);
    if (counts.x > 0) parts.push(counts.x === 1 ? "x" : `${counts.x}x`);
    if (counts.unit > 0) parts.push(String(counts.unit));
    return parts.length ? parts.join(" + ") : "0";
}

function buildLiveTeachingSummary(success, title) {
    const preset = getActivePreset();
    const used = getUsedTileCounts();
    const missing = {
        x2: Math.max(0, preset.targets.x2 - used.x2),
        x: Math.max(0, preset.targets.x - used.x),
        unit: Math.max(0, preset.targets.unit - used.unit)
    };
    const missingParts = [
        missing.x2 > 0 ? `${missing.x2} 个 x²` : "",
        missing.x > 0 ? `${missing.x} 个 x` : "",
        missing.unit > 0 ? `${missing.unit} 个 1` : ""
    ].filter(Boolean);
    let nextStep = "把剩余面积块补齐，再尝试拼成没有空洞的大矩形。";
    if (success) {
        nextStep = "读出矩形长和宽，把面积和改写成两个一次因式的乘积。";
    } else if (title.includes("重叠")) {
        nextStep = "先把红色冲突位置移开，面积块必须平铺不能叠放。";
    } else if (title.includes("未拼成")) {
        nextStep = "观察包络矩形里的缺口，把凸出的块移到空洞位置。";
    } else if (missingParts.length === 0) {
        nextStep = "所有面积块已放入，调整它们直到外轮廓成为完整矩形。";
    }
    return {
        area: getAreaTextFromCounts(used),
        missingText: missingParts.length ? missingParts.join("、") : "已全部放入",
        nextStep
    };
}

function getPlacementState(tile, gridX, gridY) {
    const footprint = getTileFootprint(tile);
    if (gridX < 0 || gridY < 0 || gridX + footprint.w > GRID_COLS || gridY + footprint.h > GRID_ROWS) {
        return "bounds";
    }
    const occupied = new Set();
    placedTiles.forEach((other) => {
        if (other.id === tile.id) return;
        const otherFootprint = getTileFootprint(other);
        for (let y = other.gridY; y < other.gridY + otherFootprint.h; y++) {
            for (let x = other.gridX; x < other.gridX + otherFootprint.w; x++) {
                occupied.add(`${x},${y}`);
            }
        }
    });
    for (let y = gridY; y < gridY + footprint.h; y++) {
        for (let x = gridX; x < gridX + footprint.w; x++) {
            if (occupied.has(`${x},${y}`)) return "overlap";
        }
    }
    return "valid";
}

function createRotateHandle(tile) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tile-rotate-handle";
    btn.setAttribute("aria-label", "旋转 x 瓷砖");
    btn.textContent = "↻";
    btn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
    btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        rotateTile(tile);
    });
    return btn;
}

// 创建一个代数瓷砖实例
function createTile(type, gridX = 0, gridY = 0, rotated = false) {
    const tile = {
        id: "tile-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
        type,
        gridX,
        gridY,
        rotated,
        element: null
    };

    const el = document.createElement("div");
    el.className = `algebra-tile ${type}`;
    el.dataset.id = tile.id;
    
    // 内容标注
    const label = document.createElement("span");
    label.className = "tile-symbol";
    if (type === "x2") {
        label.innerHTML = "x²";
    } else if (type === "x") {
        label.innerHTML = "x";
    } else {
        label.innerHTML = "1";
    }
    el.appendChild(label);

    tile.element = el;
    if (type === "x") {
        el.appendChild(createRotateHandle(tile));
    }
    placedTilesContainer.appendChild(el);
    placedTiles.push(tile);

    // 应用尺寸与初始位置
    updateTileTransform(tile);

    // 绑定事件
    el.addEventListener("pointerdown", (e) => onPointerDown(e, tile));
    el.addEventListener("dblclick", () => rotateTile(tile));

    return tile;
}

// 旋转瓷砖 (仅 x 瓷砖允许旋转)
function rotateTile(tile) {
    if (tile.type !== 'x') return;
    tile.rotated = !tile.rotated;
    playSound('rotate');
    
    // 如果旋转后出界，强制拉回
    const { w, h } = getTileFootprint(tile);
    if (tile.gridX + w > GRID_COLS) tile.gridX = GRID_COLS - w;
    if (tile.gridY + h > GRID_ROWS) tile.gridY = GRID_ROWS - h;

    updateTileTransform(tile);
    tile.element.classList.add("rotate-pulse");
    window.setTimeout(() => tile.element.classList.remove("rotate-pulse"), 260);
    validatePuzzle();
}

function getGridOrigin() {
    const rect = gridBoard.getBoundingClientRect();
    const layout = getActivePreset()?.autoLayout || [];
    let minLeft = 0;
    let minTop = 0;
    let modelWidth = GRID_COLS * U;
    let modelHeight = GRID_ROWS * U;

    if (layout.length > 0) {
        let maxRight = 0;
        let maxBottom = 0;
        minLeft = Infinity;
        minTop = Infinity;
        layout.forEach((item) => {
            let w = 1;
            let h = 1;
            if (item.type === "x2") {
                w = 3; h = 3;
            } else if (item.type === "x") {
                w = item.rotated ? 1 : 3;
                h = item.rotated ? 3 : 1;
            }
            const left = item.gridX * U + 2;
            const top = item.gridY * U + 2;
            const right = item.gridX * U + w * U - 2;
            const bottom = item.gridY * U + h * U - 2;
            minLeft = Math.min(minLeft, left);
            minTop = Math.min(minTop, top);
            maxRight = Math.max(maxRight, right);
            maxBottom = Math.max(maxBottom, bottom);
        });
        modelWidth = maxRight - minLeft;
        modelHeight = maxBottom - minTop;
    }

    const desiredX = (rect.width - modelWidth) / 2 - minLeft;
    const desiredY = (rect.height - modelHeight) / 2 - minTop;
    const constrainModelOrigin = (desired, viewportSize, modelSize, modelStart) => {
        const edgePadding = 8;
        if (modelSize + edgePadding * 2 >= viewportSize) {
            return desired;
        }
        const minOrigin = edgePadding - modelStart;
        const maxOrigin = viewportSize - modelSize - edgePadding - modelStart;
        return Math.min(Math.max(desired, minOrigin), maxOrigin);
    };
    return {
        x: constrainModelOrigin(desiredX, rect.width, modelWidth, minLeft),
        y: constrainModelOrigin(desiredY, rect.height, modelHeight, minTop)
    };
}

// 更新瓷砖尺寸与位置 CSS Transform
function updateTileTransform(tile, pxX = null, pxY = null) {
    const el = tile.element;
    const { w, h } = getTileFootprint(tile);

    el.style.width = `${w * U - 4}px`; // 减 4px 留出边框微距
    el.style.height = `${h * U - 4}px`;

    const origin = getGridOrigin();
    const left = pxX !== null ? pxX : tile.gridX * U + origin.x + 2;
    const top = pxY !== null ? pxY : tile.gridY * U + origin.y + 2;
    
    let transformStr = `translate3d(${left}px, ${top}px, 0)`;
    if (el.classList.contains("dragging")) {
        transformStr += ` scale(1.06) rotate(1.8deg)`;
    }
    el.style.transform = transformStr;
}

// 拖拽事件监听
function onPointerDown(e, tile) {
    if (isSolved) return; // 拼图完成后锁定画布

    dragTile = tile;
    dragTile.element.classList.add("dragging");
    
    // 捕获指针事件，防止指正移出浏览器窗口或 iframe 时丢失
    try {
        tile.element.setPointerCapture(e.pointerId);
    } catch(err) {}

    const rect = gridBoard.getBoundingClientRect();
    const tileRect = tile.element.getBoundingClientRect();
    
    // 记录指针在瓷砖内部的偏移量
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragOffsetLeft = tileRect.left - rect.left;
    dragOffsetTop = tileRect.top - rect.top;

    // 显示对齐预览 Ghost
    ghost.style.display = "block";
    updateGhostPreview(tile);

    tile.element.addEventListener("pointermove", onPointerMove);
    tile.element.addEventListener("pointerup", onPointerUp);
    tile.element.addEventListener("pointercancel", onPointerUp);
}

function onPointerMove(e) {
    if (!dragTile) return;
    
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    
    let currentX = dragOffsetLeft + dx;
    let currentY = dragOffsetTop + dy;

    // 允许拖动
    updateTileTransform(dragTile, currentX, currentY);

    // 动态更新格点 Ghost 投影
    updateGhostPreview(dragTile);
}

function onPointerUp(e) {
    if (!dragTile) return;
    
    const tileEl = dragTile.element;
    
    try {
        tileEl.releasePointerCapture(e.pointerId);
    } catch(err) {}

    tileEl.removeEventListener("pointermove", onPointerMove);
    tileEl.removeEventListener("pointerup", onPointerUp);
    tileEl.removeEventListener("pointercancel", onPointerUp);
    
    tileEl.classList.remove("dragging");
    ghost.style.display = "none";

    const rect = gridBoard.getBoundingClientRect();
    const tileRect = dragTile.element.getBoundingClientRect();
    const pointerX = e.clientX - rect.left;
    const pointerY = e.clientY - rect.top;

    // 校验是否将卡片拽到了网格画布的有效范围之外 (有 50px 缓冲容差)
    const padding = 50;
    if (pointerX < -padding || pointerX > rect.width + padding || 
        pointerY < -padding || pointerY > rect.height + padding) {
        // 从画布移除该卡片，退还给抽屉
        removePlacedTile(dragTile);
        playSound('delete');
    } else {
        // 吸附网格坐标解算
        const origin = getGridOrigin();
        const relativeX = tileRect.left - rect.left - origin.x;
        const relativeY = tileRect.top - rect.top - origin.y;
        
        let gridX = Math.round(relativeX / U);
        let gridY = Math.round(relativeY / U);

        const { w, h } = getTileFootprint(dragTile);

        // 磁吸位置边界修正
        if (gridX < 0) gridX = 0;
        if (gridX + w > GRID_COLS) gridX = GRID_COLS - w;
        if (gridY < 0) gridY = 0;
        if (gridY + h > GRID_ROWS) gridY = GRID_ROWS - h;

        dragTile.gridX = gridX;
        dragTile.gridY = gridY;

        playSound('snap');
        updateTileTransform(dragTile);
        const state = getPlacementState(dragTile, gridX, gridY);
        dragTile.element.classList.toggle("placement-warning", state !== "valid");
    }

    dragTile = null;
    validatePuzzle();
}

// 更新磁吸预测框 (Ghost) 位置大小
function updateGhostPreview(tile) {
    const rect = gridBoard.getBoundingClientRect();
    const tileRect = tile.element.getBoundingClientRect();
    const origin = getGridOrigin();
    const relativeX = tileRect.left - rect.left - origin.x;
    const relativeY = tileRect.top - rect.top - origin.y;
    
    let gridX = Math.round(relativeX / U);
    let gridY = Math.round(relativeY / U);

    const { w, h } = getTileFootprint(tile);

    if (gridX < 0) gridX = 0;
    if (gridX + w > GRID_COLS) gridX = GRID_COLS - w;
    if (gridY < 0) gridY = 0;
    if (gridY + h > GRID_ROWS) gridY = GRID_ROWS - h;

    const state = getPlacementState(tile, gridX, gridY);
    ghost.style.width = `${w * U}px`;
    ghost.style.height = `${h * U}px`;
    ghost.style.transform = `translate3d(${gridX * U + origin.x}px, ${gridY * U + origin.y}px, 0)`;
    ghost.classList.toggle("valid", state === "valid");
    ghost.classList.toggle("invalid", state !== "valid");
}

// 从拼图盘移除卡片
function removePlacedTile(tile) {
    if (tile.element && tile.element.parentNode) {
        tile.element.parentNode.removeChild(tile.element);
    }
    placedTiles = placedTiles.filter(t => t.id !== tile.id);
    
    // 退还备用抽屉配额
    drawerCounts[tile.type]++;
    updateDrawerUI();
}

// 键盘事件监听 (空格旋转选中卡片)
window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && dragTile && dragTile.type === 'x') {
        e.preventDefault();
        rotateTile(dragTile);
        updateGhostPreview(dragTile);
    }
});

// ==========================================================================
// 5. 拼图成功判定与因式分解解算器 (Congruence & Connection Validator)
// ==========================================================================
function validatePuzzle() {
    dimensionsOverlay.innerHTML = "";
    placedTiles.forEach((tile) => tile.element.classList.remove("placement-warning"));
    isSolved = false;

    const preset = getActivePreset();
    
    // 1. 检查瓷砖是否全部摆上去了 (抽屉全为 0)
    const allPlaced = drawerCounts.x2 === 0 && drawerCounts.x === 0 && drawerCounts.unit === 0;
    if (!allPlaced) {
        updateHUDContent(false, "等候摆放中...", "请先将左侧抽屉中的代数卡片全部放入网格拼图盘中。");
        return;
    }

    // 2. 二维格点占用阵列 (12x12) 初始化
    const gridOccupancy = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(null));
    let hasOverlap = false;
    const overlapTileIds = new Set();

    // 映射已放卡片到占用阵列
    for (let tile of placedTiles) {
        const { w, h } = getTileFootprint(tile);

        for (let y = tile.gridY; y < tile.gridY + h; y++) {
            for (let x = tile.gridX; x < tile.gridX + w; x++) {
                if (x < 0 || x >= GRID_COLS || y < 0 || y >= GRID_ROWS) {
                    // 超出了 12x12 界外
                    updateHUDContent(false, "边界溢出！", "有卡片落在了网格盘外面，请拖拽回有效区域内。");
                    return;
                }
                if (gridOccupancy[y][x] !== null) {
                    hasOverlap = true; // 发生了单元格重合
                    overlapTileIds.add(tile.id);
                    overlapTileIds.add(gridOccupancy[y][x]);
                } else {
                    gridOccupancy[y][x] = tile.id;
                }
            }
        }
    }

    if (hasOverlap) {
        placedTiles.forEach((tile) => {
            tile.element.classList.toggle("placement-warning", overlapTileIds.has(tile.id));
        });
        updateHUDContent(false, "重叠冲突！", "有卡片之间发生了重叠，这代表面积溢出，请挪开重叠卡片使其平铺。");
        return;
    }

    // 3. 计算已占有单元格的 Bounding Box (最小包络矩形)
    let minX = GRID_COLS, maxX = -1, minY = GRID_ROWS, maxY = -1;
    let totalGridCells = 0;

    for (let y = 0; y < GRID_ROWS; y++) {
        for (let x = 0; x < GRID_COLS; x++) {
            if (gridOccupancy[y][x] !== null) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
                totalGridCells++;
            }
        }
    }

    if (totalGridCells === 0) {
        updateHUDContent(false, "等待拼图...", "将备选卡片全部拖放并整齐拼接在网格中。");
        return;
    }

    const boxW = maxX - minX + 1;
    const boxH = maxY - minY + 1;
    const boxArea = boxW * boxH;

    // 4. 连通实体矩形核对
    // 如果包络矩形的单元格总数等于实际占用的单元格总数，表示无气孔、无凹凸凸起、为完美实心矩形！
    if (boxArea === totalGridCells) {
        // 成功！拼出完美大矩形！
        isSolved = true;
        
        // 精确匹配拼出长宽的代数表达式，避免格点多义性 (例如 10 既是 3x+1 也是 2x+4)
        const side1Text = `${preset.p === 1 ? 'x' : preset.p + 'x'} + ${preset.q}`;
        const side2Text = `${preset.r === 1 ? 'x' : preset.r + 'x'} + ${preset.s}`;
        
        let widthText = "";
        let heightText = "";
        const expectedW = preset.p * 3 + preset.q;
        
        if (boxW === expectedW) {
            widthText = side1Text;
            heightText = side2Text;
        } else {
            widthText = side2Text;
            heightText = side1Text;
        }

        // 渲染金色高亮边框和尺寸标注线
        renderSuccessAnnotations(minX, minY, boxW, boxH, widthText, heightText);
        
        // 引爆粒子烟花庆祝
        const rect = gridBoard.getBoundingClientRect();
        const centerX = rect.left + (minX + boxW/2) * U;
        const centerY = rect.top + (minY + boxH/2) * U;
        triggerExplosion(centerX, centerY);
        playSound('success');

        // 更新看板
        const expandedAreaText = preset.formulaHtml;
        const factoredText = `(${widthText})(${heightText})`;
        updateHUDContent(true, "🎉 拼图验证成功！", 
            `恭喜！成功拼出完美矩形：<br>
            <strong>大矩形的长 = ${widthText}</strong>，<strong>宽 = ${heightText}</strong>。<br>
            根据“大矩形总面积 = 四周卡片面积和”：<br>
            <span class="math-bold">${expandedAreaText} = ${factoredText}</span>`
        );
    } else {
        // 摆放完成但未形成矩形
        updateHUDContent(false, "未拼成矩形", "所有卡片已平铺，但未拼接为单个封闭的长方形，请重新调整各模块布局。");
    }
}

// 绘制拼图成功的辅助线与标注文字
function renderSuccessAnnotations(gridX, gridY, gridW, gridH, widthText, heightText) {
    const origin = getGridOrigin();
    const left = gridX * U + origin.x;
    const top = gridY * U + origin.y;
    const w = gridW * U;
    const h = gridH * U;

    // 1. 金色外围高亮边框
    const bounding = document.createElement("div");
    bounding.className = "success-bounding-rect";
    bounding.style.left = `${left + 2}px`;
    bounding.style.top = `${top + 2}px`;
    bounding.style.width = `${w - 4}px`;
    bounding.style.height = `${h - 4}px`;
    dimensionsOverlay.appendChild(bounding);

    // 2. 顶部水平标注线
    const topDimLine = document.createElement("div");
    topDimLine.className = "dimension-line horizontal";
    topDimLine.style.left = `${left + 6}px`;
    topDimLine.style.top = `${top - 14}px`;
    topDimLine.style.width = `${w - 12}px`;
    dimensionsOverlay.appendChild(topDimLine);

    // 顶部标注左右箭头
    const arrowL = document.createElement("div");
    arrowL.className = "dimension-arrow";
    arrowL.style.left = `${left}px`;
    arrowL.style.top = `${top - 16}px`;
    arrowL.style.borderWidth = "3px 5px 3px 0";
    arrowL.style.borderColor = "transparent var(--success) transparent transparent";
    dimensionsOverlay.appendChild(arrowL);

    const arrowR = document.createElement("div");
    arrowR.className = "dimension-arrow";
    arrowR.style.left = `${left + w - 5}px`;
    arrowR.style.top = `${top - 16}px`;
    arrowR.style.borderWidth = "3px 0 3px 5px";
    arrowR.style.borderColor = "transparent transparent transparent var(--success)";
    dimensionsOverlay.appendChild(arrowR);

    // 顶部文本
    const topTextEl = document.createElement("div");
    topTextEl.className = "dimension-text";
    topTextEl.style.left = `${left + w / 2}px`;
    topTextEl.style.top = `${top - 36}px`;
    topTextEl.style.transform = "translateX(-50%)";
    topTextEl.textContent = widthText;
    dimensionsOverlay.appendChild(topTextEl);

    // 3. 左侧垂直标注线
    const leftDimLine = document.createElement("div");
    leftDimLine.className = "dimension-line vertical";
    leftDimLine.style.left = `${left - 14}px`;
    leftDimLine.style.top = `${top + 6}px`;
    leftDimLine.style.height = `${h - 12}px`;
    dimensionsOverlay.appendChild(leftDimLine);

    // 左侧标注上下箭头
    const arrowT = document.createElement("div");
    arrowT.className = "dimension-arrow";
    arrowT.style.left = `${left - 16}px`;
    arrowT.style.top = `${top}px`;
    arrowT.style.borderWidth = "0 3px 5px 3px";
    arrowT.style.borderColor = "transparent transparent var(--success) transparent";
    dimensionsOverlay.appendChild(arrowT);

    const arrowB = document.createElement("div");
    arrowB.className = "dimension-arrow";
    arrowB.style.left = `${left - 16}px`;
    arrowB.style.top = `${top + h - 5}px`;
    arrowB.style.borderWidth = "5px 3px 0 3px";
    arrowB.style.borderColor = "var(--success) transparent transparent transparent";
    dimensionsOverlay.appendChild(arrowB);

    // 左侧文本
    const leftTextEl = document.createElement("div");
    leftTextEl.className = "dimension-text";
    leftTextEl.style.left = `${left - 48}px`;
    leftTextEl.style.top = `${top + h / 2}px`;
    leftTextEl.style.transform = "translate(-50%, -50%)";
    leftTextEl.textContent = heightText;
    dimensionsOverlay.appendChild(leftTextEl);
}

// ==========================================================================
// 6. HUD 看板与抽屉备选量刷新
// ==========================================================================
function updateHUDContent(success, title, desc) {
    const preset = getActivePreset();
    const teaching = buildLiveTeachingSummary(success, title);
    
    let html = `
        <div class="hud-row">
            <div class="hud-row-label">目标二次多项式</div>
            <div class="hud-row-val math-bold" style="font-size:16px; color:var(--primary);">
                ${preset.formulaHtml}
            </div>
        </div>
        <div class="hud-row">
            <div class="hud-row-label">卡片需求总量</div>
            <div class="hud-row-val">
                x²瓷砖：<strong>${preset.targets.x2}</strong> 个 &nbsp;|&nbsp; 
                x瓷砖：<strong>${preset.targets.x}</strong> 个 &nbsp;|&nbsp; 
                常数1：<strong>${preset.targets.unit}</strong> 个
            </div>
        </div>
        <div class="hud-row">
            <div class="hud-row-label">拼图盘内状态</div>
            <div class="hud-row-val">
                已用格子：<strong>${placedTiles.length}</strong> 个瓷砖（当前限额：x²用 <strong>${preset.targets.x2 - drawerCounts.x2}</strong>，x用 <strong>${preset.targets.x - drawerCounts.x}</strong>，1用 <strong>${preset.targets.unit - drawerCounts.unit}</strong>）。
            </div>
        </div>
        <div class="hud-live-summary">
            <div><span>当前面积</span><strong>${teaching.area}</strong></div>
            <div><span>还缺</span><strong>${teaching.missingText}</strong></div>
            <div><span>下一步建议</span><strong>${teaching.nextStep}</strong></div>
        </div>
        
        <div class="hud-verdict-box ${success ? 'success' : ''}">
            <div class="verdict-title">${title}</div>
            <div class="verdict-desc">${desc}</div>
        </div>
    `;
    
    stepsChalkboard.innerHTML = html;
}

function updateDrawerUI() {
    countX2.textContent = `剩余 ${drawerCounts.x2} 个`;
    countX.textContent = `剩余 ${drawerCounts.x} 个`;
    countUnit.textContent = `剩余 ${drawerCounts.unit} 个`;

    // 禁用数量已耗尽的抽屉格子
    toggleDrawerState("drawer-tile-x2", drawerCounts.x2 > 0);
    toggleDrawerState("drawer-tile-x", drawerCounts.x > 0);
    toggleDrawerState("drawer-tile-1", drawerCounts.unit > 0);
}

function toggleDrawerState(id, enabled) {
    const el = document.getElementById(id);
    if (enabled) {
        el.classList.remove("disabled");
    } else {
        el.classList.add("disabled");
    }
}

// ==========================================================================
// 7. 自动演示与重置清空 (Auto-Assembly & Clear Logic)
// ==========================================================================
function clearBoard() {
    placedTilesContainer.innerHTML = "";
    dimensionsOverlay.innerHTML = "";
    placedTiles = [];
    isSolved = false;

    // 重置抽屉瓷砖额度
    const targets = getActivePreset().targets;
    drawerCounts = {
        x2: targets.x2,
        x: targets.x,
        unit: targets.unit
    };

    updateDrawerUI();
    validatePuzzle();
}

// 一键完美拼接演示动画
function autoAssemble() {
    clearBoard();
    
    // 清空抽屉数量
    drawerCounts = { x2: 0, x: 0, unit: 0 };
    updateDrawerUI();

    const layout = getActivePreset().autoLayout;
    
    // 给每一项卡片创建一个入场动画 (从左侧抽屉飞入)
    layout.forEach((item, index) => {
        const tile = createTile(item.type, 0, 0, item.rotated);
        
        // 初始放置在画面偏左作为飞入起点
        updateTileTransform(tile, -150, 200 + index * 20);

        // 利用 setTimeout 分批滑动，产生节奏感和拼图拼合实感
        setTimeout(() => {
            tile.gridX = item.gridX;
            tile.gridY = item.gridY;
            
            // 改变属性触发 CSS 动画平滑过渡
            tile.element.style.transition = "transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)";
            updateTileTransform(tile);

            // 移动完毕瞬间播放吸附声，并进行最终结算
            setTimeout(() => {
                playSound('snap');
                if (index === layout.length - 1) {
                    // 全体到位后重置 transition 为常规抓取状态
                    placedTiles.forEach(t => t.element.style.transition = "");
                    validatePuzzle();
                }
            }, 600);

        }, index * 100);
    });
}

// 切换关卡场景
function loadPreset(id) {
    currentPresetId = id;
    
    // 切换按钮 active 样式
    document.querySelectorAll(".btn-preset").forEach(btn => {
        if (btn.getAttribute("data-preset") === id) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    const sandboxBtn = document.getElementById("btn-random-sandbox");
    if (id === "sandbox") {
        sandboxBtn.classList.add("active");
    } else {
        sandboxBtn.classList.remove("active");
    }

    clearBoard();
}

// 点击抽屉卡片放置在画布空闲处
function spawnFromDrawer(type) {
    if (drawerCounts[type] <= 0) return;

    // 减配额
    drawerCounts[type]--;
    updateDrawerUI();

    // 寻找前几个空闲格点做出生点，避免完全叠在一起
    let gridX = 1;
    let gridY = 1;
    
    // 简单避让算法：避开当前已放卡片的左上角
    while (placedTiles.some(t => t.gridX === gridX && t.gridY === gridY)) {
        gridX += 2;
        if (gridX > 8) {
            gridX = 1;
            gridY += 2;
        }
    }

    createTile(type, gridX, gridY, false);
    playSound('snap');
    validatePuzzle();
}

// ==========================================================================
// 8. 事件绑定与启动初始化 (Init Setup)
// ==========================================================================
function init() {
    installHudPlacementObserver();
    scheduleHudPlacement();
    document.addEventListener("contextmenu", suppressTouchSystemGestures, { passive: false });
    document.addEventListener("selectstart", suppressTouchSystemGestures, { passive: false });
    document.addEventListener("dragstart", suppressTouchSystemGestures, { passive: false });
    window.addEventListener("resize", () => {
        placedTiles.forEach((tile) => updateTileTransform(tile));
        validatePuzzle();
    });

    // 1. 绑定关卡切换
    document.querySelectorAll(".btn-preset").forEach(btn => {
        btn.addEventListener("click", () => {
            loadPreset(btn.getAttribute("data-preset"));
            scheduleHudPlacement();
        });
    });

    // 2. 绑定抽屉点击
    document.getElementById("drawer-tile-x2").addEventListener("click", () => spawnFromDrawer("x2"));
    document.getElementById("drawer-tile-x").addEventListener("click", () => spawnFromDrawer("x"));
    document.getElementById("drawer-tile-1").addEventListener("click", () => spawnFromDrawer("unit"));

    // 3. 绑定演示与重置按钮
    btnAutoAssemble.addEventListener("click", autoAssemble);
    btnResetBoard.addEventListener("click", clearBoard);

    // 🎲 绑定随机沙盒按钮
    document.getElementById("btn-random-sandbox").addEventListener("click", () => {
        generateRandomSandbox();
        loadPreset("sandbox");
        scheduleHudPlacement();
    });

    // 4. 帮助弹窗
    btnShowHelp.addEventListener("click", () => {
        modalHelp.classList.add("active");
    });
    btnShowHelp.addEventListener("touchstart", (e) => {
        e.preventDefault();
        modalHelp.classList.add("active");
    });

    btnCloseHelp.addEventListener("click", () => {
        modalHelp.classList.remove("active");
    });

    // 5. Collapsible HUD 折叠
    hudToggleBtn.addEventListener("click", () => {
        isHudExpanded = !isHudExpanded;
        if (isHudExpanded) {
            hudPanel.classList.remove("collapsed");
        } else {
            hudPanel.classList.add("collapsed");
        }
        scheduleHudPlacement();
    });

    // 载入第一关
    loadPreset("1");
    scheduleHudPlacement();
}

document.addEventListener("DOMContentLoaded", init);
