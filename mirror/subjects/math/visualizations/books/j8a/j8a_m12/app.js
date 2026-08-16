/**
 * 分式方程增根图形化探究实验室 - 交互逻辑 (app.js)
 * 1. 动态自变量计算与 Canvas 精细双曲线/直线绘制引擎
 * 2. 探针在 Canvas 坐标轴上的直接拖拽与双向映射
 * 3. 动态整式方程求解器与代数/几何交点判别系统
 * 4. Web Audio API 音效合成器 + Canvas 粒子系统
 */

// ==========================================================================
// 1. 全局状态与配置
// ==========================================================================
let paramA = 2; // 分母偏量 a
let paramB = 0.5; // 整式常数 b
let paramC = 2; // 分子常数 c
let probeX = 2.0; // 绿色探针的当前数学坐标值
let showLines = true; // 是否显示去分母后的整式直线

const PRESET_CASES = {
    extraneous: { label: "增根例题", a: 2, b: 0.5, c: 2, probeX: 2, showLines: true },
    valid: { label: "真根例题", a: 2, b: 0, c: 3, probeX: 3, showLines: true },
    none: { label: "无解例题", a: 2, b: 1, c: 4, probeX: 2, showLines: true }
};

let currentCaseId = "extraneous";

let isDraggingProbe = false;
let isPanningView = false;
let panViewStart = null;

// 坐标映射边界（默认视窗）
const minMathX = -4.5;
const maxMathX = 4.5;
const minMathY = -7;
const maxMathY = 7;
const padding = 40;
const baseViewSpanX = maxMathX - minMathX;
const baseViewSpanY = maxMathY - minMathY;
const MIN_VIEW_SCALE = 0.45;
const MAX_VIEW_SCALE = 3.5;
const SHOW_INTERNAL_GRID_BACKGROUND = false;

let viewScale = 1;
let viewCenterX = 0;
let viewCenterY = 0;

// DOM 元素引用
const alertAmbientLayer = document.getElementById("alert-ambient-layer");
const canvasContainer = document.querySelector(".canvas-container-wrapper");
const graphCanvas = document.getElementById("graph-canvas");
const ctx = graphCanvas.getContext("2d");

const probeHud = document.getElementById("probe-hud");
const probeEvalDen = document.getElementById("probe-eval-den");
const probeEvalLhs = document.getElementById("probe-eval-lhs");
const probeEvalRhs = document.getElementById("probe-eval-rhs");

const eqDisplayFormula = document.getElementById("eq-display-formula");
const sliderA = document.getElementById("slider-a");
const sliderB = document.getElementById("slider-b");
const sliderC = document.getElementById("slider-c");
const sliderX = document.getElementById("slider-x");
const valALabel = document.getElementById("val-a-label");
const valBLabel = document.getElementById("val-b-label");
const valCLabel = document.getElementById("val-c-label");
const valXLabel = document.getElementById("val-x-label");
const anchorButtonsRow = document.getElementById("anchor-buttons-row");
const presetCasesRow = document.getElementById("preset-cases-row");

const chkShowLines = document.getElementById("chk-show-lines");
const stepsChalkboard = document.getElementById("steps-hud-chalkboard");
const btnReset = document.getElementById("btn-reset");
const taskStatus = document.getElementById("task-status");
const taskHint = document.getElementById("task-hint");
const taskProgress = document.getElementById("task-progress");
const hudPanel = document.getElementById("hud-chalkboard-panel");
const hudToggleBtn = document.getElementById("hud-toggle-btn");
const hudArrowIcon = hudPanel?.querySelector(".hud-arrow-icon");

const btnShowHelp = document.getElementById("btn-show-help");
const btnCloseHelp = document.getElementById("btn-close-help");
const modalHelp = document.getElementById("modal-help");
const btnMorphToggle = document.getElementById("btn-morph-toggle");

let morphT = 0; // 去分母图像变形插值参数 (0: 分式双曲线, 1: 整式虚线)
let isMorphing = false;
let morphInterval = null;
let lastSnappedVal = null; // 用于防重放吸附咬合声

function syncSceneSliderFill(slider) {
    if (!slider) return;
    const min = Number(slider.min);
    const max = Number(slider.max);
    const val = Number(slider.value);
    const pct = max > min ? ((val - min) / (max - min)) * 100 : 0;
    slider.style.setProperty("--slider-pct", pct + "%");
}

const sceneSliders = () => [sliderA, sliderB, sliderC, sliderX];

function updateCaseButtons() {
    if (!presetCasesRow) return;
    presetCasesRow.querySelectorAll(".btn-case-preset").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.case === currentCaseId);
    });
}

function syncAllControls() {
    sliderA.value = paramA;
    sliderB.value = paramB;
    sliderC.value = paramC;
    sliderX.value = probeX;
    chkShowLines.checked = showLines;

    valALabel.textContent = paramA.toString();
    valBLabel.textContent = paramB.toFixed(1);
    valCLabel.textContent = paramC.toString();
    valXLabel.textContent = probeX.toFixed(2);

    sceneSliders().forEach(syncSceneSliderFill);
    updateFormulaDisplay();
    updateAnchorButtons();
    updateCaseButtons();
    drawAll();
    runDiagnostics();
}

function applyPresetCase(caseId) {
    const preset = PRESET_CASES[caseId];
    if (!preset) return;

    currentCaseId = caseId;
    clearInterval(morphInterval);
    isMorphing = false;
    morphT = 0;
    setMorphButtonState("idle");
    resetViewport();

    paramA = preset.a;
    paramB = preset.b;
    paramC = preset.c;
    probeX = preset.probeX;
    showLines = preset.showLines;

    playClickSound();
    syncAllControls();
}

function resolveCanvasColor(color) {
    if (typeof color !== "string" || !color.startsWith("var(")) return color;
    const varName = color.slice(4, -1).trim();
    const fallbackPalette = {
        "--color-curve-lhs": "#2563eb",
        "--color-curve-rhs": "#9333ea",
        "--color-line-lhs": "rgba(37, 99, 235, 0.62)",
        "--color-line-rhs": "rgba(147, 51, 234, 0.62)",
        "--color-danger": "#dc2626",
        "--color-probe": "#059669"
    };
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || fallbackPalette[varName] || color;
}

function setHudArrow() {
    if (!hudPanel || !hudArrowIcon) return;
    hudArrowIcon.textContent = hudPanel.classList.contains("collapsed") ? "⌄" : "⌃";
}

function applyHudPlacement() {
    if (!hudPanel) return;
    const isCollapsed = hudPanel.classList.contains("collapsed");
    hudPanel.style.setProperty("position", "absolute", "important");
    hudPanel.style.setProperty("top", "18px", "important");
    hudPanel.style.setProperty("left", "18px", "important");
    hudPanel.style.setProperty("right", "auto", "important");
    hudPanel.style.setProperty("width", isCollapsed ? "max-content" : "min(392px, calc(100% - 36px))", "important");
    hudPanel.style.setProperty("min-width", isCollapsed ? "max-content" : "0", "important");
    hudPanel.style.setProperty("max-width", "calc(100% - 36px)", "important");
    hudPanel.style.setProperty("max-height", "none", "important");
    setHudArrow();
}

function setMorphButtonState(mode) {
    const labels = {
        idle: "去分母图像变形演变",
        pause: "继续图像变形演变",
        running: "暂停图像变形演变",
        restore: "还原为分式图像",
    };
    btnMorphToggle.textContent = labels[mode] || labels.idle;
    btnMorphToggle.classList.toggle("active-run", mode === "running");
}

// ==========================================================================
// 2. Web Audio API 警报与音效合成器
// ==========================================================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let sirenInterval = null;
let isSirenActive = false;

function startSiren() {
    if (isSirenActive) return;
    isSirenActive = true;

    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);

    let high = true;
    osc.start();

    sirenInterval = setInterval(() => {
        const targetFreq = high ? 850 : 450;
        osc.frequency.exponentialRampToValueAtTime(targetFreq, audioCtx.currentTime + 0.35);
        high = !high;
    }, 400);

    window.stopActiveSiren = () => {
        clearInterval(sirenInterval);
        try {
            osc.stop();
        } catch(e) {}
        isSirenActive = false;
    };
}

function stopSiren() {
    if (window.stopActiveSiren) {
        window.stopActiveSiren();
    }
}

function playSafeSound() {
    stopSiren();
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const now = audioCtx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C Major chord
    freqs.forEach((f, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.05);
        gain.gain.setValueAtTime(0.08, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.6);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.6);
    });
}

function playClickSound() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
}

// ==========================================================================
// 3. Canvas Particle Explosion Layer
// ==========================================================================
const particlesCanvas = document.getElementById("particles-canvas");
const pCtx = particlesCanvas.getContext("2d");
let particles = [];
let animId = null;

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 1.5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed - 1.0;
        this.radius = Math.random() * 3 + 1.2;
        this.alpha = 1.0;
        this.decay = Math.random() * 0.02 + 0.02;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
    }
    draw(c) {
        c.save();
        c.globalAlpha = Math.max(0, this.alpha);
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = this.color;
        c.shadowBlur = 6;
        c.shadowColor = this.color;
        c.fill();
        c.restore();
    }
}

function resizeParticlesCanvas() {
    particlesCanvas.width = window.innerWidth;
    particlesCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeParticlesCanvas);
resizeParticlesCanvas();

function triggerExplosion(x, y, colors) {
    for (let i = 0; i < 35; i++) {
        particles.push(new Particle(x, y, colors[Math.floor(Math.random() * colors.length)]));
    }
    if (!animId) {
        tickParticles();
    }
}

function tickParticles() {
    pCtx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        if (p.alpha <= 0) {
            particles.splice(i, 1);
        } else {
            p.draw(pCtx);
        }
    }
    if (particles.length > 0) {
        animId = requestAnimationFrame(tickParticles);
    } else {
        animId = null;
    }
}

// ==========================================================================
// 4. 坐标轴缩放与数学运算 (Axis & Math Solver)
// ==========================================================================
function clampViewScale(scale) {
    return Math.max(MIN_VIEW_SCALE, Math.min(MAX_VIEW_SCALE, scale));
}

function getViewSpanX() {
    return baseViewSpanX / viewScale;
}

function getViewSpanY() {
    return baseViewSpanY / viewScale;
}

function getViewMinX() {
    return viewCenterX - getViewSpanX() / 2;
}

function getViewMaxX() {
    return viewCenterX + getViewSpanX() / 2;
}

function getViewMinY() {
    return viewCenterY - getViewSpanY() / 2;
}

function getViewMaxY() {
    return viewCenterY + getViewSpanY() / 2;
}

function resetViewport() {
    viewScale = 1;
    viewCenterX = 0;
    viewCenterY = 0;
}

function zoomViewportAt(clientX, clientY, factor) {
    const rect = graphCanvas.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const W = rect.width;
    const H = rect.height;
    if (!W || !H) return;

    const mathX = getMathX(px);
    const mathY = getMathY(py);
    const ratioX = (px - padding) / Math.max(1, W - 2 * padding);
    const ratioY = (H - padding - py) / Math.max(1, H - 2 * padding);

    viewScale = clampViewScale(viewScale * factor);
    viewCenterX = mathX - getViewSpanX() * (ratioX - 0.5);
    viewCenterY = mathY - getViewSpanY() * (ratioY - 0.5);
}

function getPixelX(x) {
    const W = graphCanvas.width / window.devicePixelRatio;
    const span = getViewMaxX() - getViewMinX();
    return padding + (x - getViewMinX()) / span * (W - 2 * padding);
}

function getPixelY(y) {
    const H = graphCanvas.height / window.devicePixelRatio;
    const span = getViewMaxY() - getViewMinY();
    return H - (padding + (y - getViewMinY()) / span * (H - 2 * padding));
}

function getMathX(pixelX) {
    const W = graphCanvas.width / window.devicePixelRatio;
    const span = getViewMaxX() - getViewMinX();
    return getViewMinX() + (pixelX - padding) / (W - 2 * padding) * span;
}

function getMathY(pixelY) {
    const H = graphCanvas.height / window.devicePixelRatio;
    const span = getViewMaxY() - getViewMinY();
    return getViewMinY() + (H - padding - pixelY) / (H - 2 * padding) * span;
}

function drawCanvasLabel(text, x, y, color, align = "center") {
    ctx.save();
    ctx.font = "bold 12px var(--font-sans)";
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    const metrics = ctx.measureText(text);
    const width = metrics.width + 16;
    const height = 22;
    const left = align === "center" ? x - width / 2 : (align === "right" ? x - width : x);
    ctx.fillStyle = "rgba(248, 250, 252, 0.92)";
    ctx.strokeStyle = "rgba(148, 163, 184, 0.42)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(left, y - height / 2, width, height, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
}

// 求解去分母后整式方程的解：x - b(x - a) = c
// 变形得: x - bx + ab = c => (1 - b)x = c - ab => x = (c - ab) / (1 - b)
function solveEquation() {
    const divisor = 1 - paramB;
    if (Math.abs(divisor) < 0.0001) {
        // 如果 b = 1, x - x + a = c => a = c.
        // 如果 a = c，则所有非 a 的值都是解，如果 a != c 则无解。
        return null;
    }
    return (paramC - paramA * paramB) / divisor;
}

// 磁性吸附计算逻辑
function snapValue(x) {
    const root = solveEquation();
    const threshold = 0.12; // 磁性触发距离

    let target = x;
    if (Math.abs(x - paramA) < threshold) {
        target = paramA;
    } else if (root !== null && Math.abs(x - root) < threshold) {
        target = root;
    }

    if (target !== x && lastSnappedVal !== target) {
        playClickSound(); // 吸附咬合声
        lastSnappedVal = target;
    } else if (target === x) {
        lastSnappedVal = null;
    }
    return target;
}

// ==========================================================================
// 5. Canvas 函数绘图与网格渲染 (Graph Plotter Loop)
// ==========================================================================
function drawGraphGrid() {
    const W = graphCanvas.width / window.devicePixelRatio;
    const H = graphCanvas.height / window.devicePixelRatio;
    
    ctx.clearRect(0, 0, W, H);
    
    // 1. 平台模拟框已经提供背景网格；canvas 只保留坐标轴、刻度和函数模型。
    const gridMinX = Math.ceil(getViewMinX()) - 1;
    const gridMaxX = Math.floor(getViewMaxX()) + 1;
    const gridMinY = Math.ceil(getViewMinY()) - 1;
    const gridMaxY = Math.floor(getViewMaxY()) + 1;

    if (SHOW_INTERNAL_GRID_BACKGROUND) {
        ctx.strokeStyle = "rgba(148, 163, 184, 0.42)";
        ctx.lineWidth = 1;
    }

    for (let x = gridMinX; x <= gridMaxX; x++) {
        if (x === 0) continue;
        const px = getPixelX(x);
        if (px < padding - 8 || px > W - padding + 8) continue;
        if (SHOW_INTERNAL_GRID_BACKGROUND) {
            ctx.beginPath();
            ctx.moveTo(px, padding);
            ctx.lineTo(px, H - padding);
            ctx.stroke();
        }

        // 绘制X刻度数字
        ctx.fillStyle = "#475569";
        ctx.font = "11px var(--font-sans)";
        ctx.textAlign = "center";
        ctx.fillText(x.toString(), px, getPixelY(0) + 16);
    }
    
    // 绘制水平网格线 (每一单位)
    for (let y = gridMinY; y <= gridMaxY; y++) {
        if (y === 0) continue;
        const py = getPixelY(y);
        if (py < padding - 8 || py > H - padding + 8) continue;
        if (SHOW_INTERNAL_GRID_BACKGROUND) {
            ctx.beginPath();
            ctx.moveTo(padding, py);
            ctx.lineTo(W - padding, py);
            ctx.stroke();
        }

        // 绘制Y刻度数字
        ctx.fillStyle = "#475569";
        ctx.font = "11px var(--font-sans)";
        ctx.textAlign = "right";
        ctx.fillText(y.toString(), getPixelX(0) - 8, py + 4);
    }

    // 2. 绘制X与Y轴主干线
    ctx.strokeStyle = "rgba(51, 65, 85, 0.72)";
    ctx.lineWidth = 2;
    
    // X轴
    ctx.beginPath();
    ctx.moveTo(padding, getPixelY(0));
    ctx.lineTo(W - padding, getPixelY(0));
    ctx.stroke();

    // Y轴
    ctx.beginPath();
    ctx.moveTo(getPixelX(0), padding);
    ctx.lineTo(getPixelX(0), H - padding);
    ctx.stroke();
    
    // 绘制轴名称
    ctx.fillStyle = "#334155";
    ctx.font = "bold 12px var(--font-sans)";
    ctx.fillText("x", W - padding + 10, getPixelY(0) + 4);
    ctx.fillText("y", getPixelX(0) - 4, padding - 10);
}

// 绘制函数曲线
function drawCurves() {
    const W = graphCanvas.width / window.devicePixelRatio;
    const H = graphCanvas.height / window.devicePixelRatio;

    if (morphT > 0) {
        // 绘制正在拉直合拢的蜕变曲线
        drawMorphingCurve((x) => x / (x - paramA) - paramB, (x) => x - paramB * (x - paramA), "var(--color-curve-lhs)");
        drawMorphingCurve((x) => paramC / (x - paramA), (x) => paramC, "var(--color-curve-rhs)");
    } else {
        // 1. 绘制原分式方程左侧双曲线 LHS: y = x / (x - a) - b
        drawSingleDoubleCurve((x) => x / (x - paramA) - paramB, "var(--color-curve-lhs)");

        // 2. 绘制原分式方程右侧双曲线 RHS: y = c / (x - a)
        drawSingleDoubleCurve((x) => paramC / (x - paramA), "var(--color-curve-rhs)");
    }

    // 3. 绘制去分母后的整式方程两条直线 (如果勾选了显示且当前不是完全蜕变态)
    if (showLines && morphT < 1) {
        // LHS_line: y = x - b(x - a)
        drawLine((x) => x - paramB * (x - paramA), "var(--color-line-lhs)");
        // RHS_line: y = c (水平线)
        drawLine((x) => paramC, "var(--color-line-rhs)");
    }

    // 4. 绘制分母为 0 红色崩溃渐近线 x = a (随变形渐隐)
    if (morphT < 1) {
        const pxAsymptote = getPixelX(paramA);
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.7 * (1 - morphT)})`;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(pxAsymptote, padding);
        ctx.lineTo(pxAsymptote, H - padding);
        ctx.stroke();
        ctx.setLineDash([]); // 恢复实线

        // 渐近线警报文字
        if (1 - morphT > 0.2) {
            drawCanvasLabel(`分母禁区 x = ${paramA}`, pxAsymptote, padding + 18, "#dc2626");
        }
    }

    // 5. 标出整式方程的交点 (整式解候选)
    const root = solveEquation();
    if (root !== null && root >= minMathX && root <= maxMathX) {
        const py = paramC; // 交点的 Y 坐标即是 c (由于 RHS 直线是 y = c)
        const px = getPixelX(root);
        const pyPixel = getPixelY(py);

        // 如果该解刚好等于渐近线 a，说明是增根！画红色空心圆圈表示“空心孔/无意义交点”
        if (Math.abs(root - paramA) < 0.001) {
            ctx.strokeStyle = "#ef4444";
            ctx.lineWidth = 3;
            ctx.fillStyle = "#f8fafc";
            ctx.beginPath();
            ctx.arc(px, pyPixel, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // 增根危险指示框
            drawCanvasLabel(morphT === 1 ? "整式根" : "虚假交点", px, pyPixel - 18, "#dc2626");
        } else {
            // 如果不是增根，是实数解，画绿色实心圆点
            ctx.fillStyle = "#10b981";
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(px, pyPixel, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            drawCanvasLabel("真根交点", px, pyPixel - 18, "#059669");
        }
    }
}

// 变形插值绘制辅助函数
function drawMorphingCurve(funcCurve, funcLine, color) {
    ctx.strokeStyle = resolveCanvasColor(color);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    if (morphT === 1) {
        ctx.beginPath();
        let first = true;
        for (let x = minMathX; x <= maxMathX; x += 0.02) {
            const y = funcLine(x);
            if (y >= minMathY && y <= maxMathY) {
                const px = getPixelX(x);
                const py = getPixelY(y);
                if (first) {
                    ctx.moveTo(px, py);
                    first = false;
                } else {
                    ctx.lineTo(px, py);
                }
            }
        }
        ctx.stroke();
        return;
    }

    const gap = 0.05 * (1 - morphT);
    
    // LHS支
    ctx.beginPath();
    let first = true;
    for (let x = minMathX; x <= paramA - gap; x += 0.02) {
        const yCurve = funcCurve(x);
        const yLine = funcLine(x);
        const y = (1 - morphT) * yCurve + morphT * yLine;
        
        if (y >= minMathY && y <= maxMathY) {
            const px = getPixelX(x);
            const py = getPixelY(y);
            if (first) {
                ctx.moveTo(px, py);
                first = false;
            } else {
                ctx.lineTo(px, py);
            }
        }
    }
    ctx.stroke();

    // RHS支
    if (gap > 0) {
        ctx.beginPath();
        first = true;
        for (let x = paramA + gap; x <= maxMathX; x += 0.02) {
            const yCurve = funcCurve(x);
            const yLine = funcLine(x);
            const y = (1 - morphT) * yCurve + morphT * yLine;
            
            if (y >= minMathY && y <= maxMathY) {
                const px = getPixelX(x);
                const py = getPixelY(y);
                if (first) {
                    ctx.moveTo(px, py);
                    first = false;
                } else {
                    ctx.lineTo(px, py);
                }
            }
        }
        ctx.stroke();
    }
}

// 绘制双曲线 (分段绘制避免连线)
function drawSingleDoubleCurve(func, color) {
    ctx.strokeStyle = resolveCanvasColor(color);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    // LHS 支：x从 -4.5 到 a - 0.05
    ctx.beginPath();
    let first = true;
    for (let x = minMathX; x <= paramA - 0.05; x += 0.02) {
        const y = func(x);
        if (y >= minMathY && y <= maxMathY) {
            const px = getPixelX(x);
            const py = getPixelY(y);
            if (first) {
                ctx.moveTo(px, py);
                first = false;
            } else {
                ctx.lineTo(px, py);
            }
        }
    }
    ctx.stroke();

    // RHS 支：x从 a + 0.05 到 4.5
    ctx.beginPath();
    first = true;
    for (let x = paramA + 0.05; x <= maxMathX; x += 0.02) {
        const y = func(x);
        if (y >= minMathY && y <= maxMathY) {
            const px = getPixelX(x);
            const py = getPixelY(y);
            if (first) {
                ctx.moveTo(px, py);
                first = false;
            } else {
                ctx.lineTo(px, py);
            }
        }
    }
    ctx.stroke();
}

// 绘制直线
function drawLine(func, color) {
    ctx.strokeStyle = resolveCanvasColor(color);
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);

    ctx.beginPath();
    let first = true;
    for (let x = minMathX; x <= maxMathX; x += 0.05) {
        const y = func(x);
        const px = getPixelX(x);
        const py = getPixelY(y);
        
        // 限制在坐标框内部
        if (py >= padding && py <= (graphCanvas.height / window.devicePixelRatio) - padding) {
            if (first) {
                ctx.moveTo(px, py);
                first = false;
            } else {
                ctx.lineTo(px, py);
            }
        }
    }
    ctx.stroke();
    ctx.setLineDash([]);
}

// 绘制可移动诊断探针
function drawProbeLine() {
    const H = graphCanvas.height / window.devicePixelRatio;
    const px = getPixelX(probeX);

    // 绘制探针虚线
    ctx.strokeStyle = "rgba(16, 185, 129, 0.8)";
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(px, padding);
    ctx.lineTo(px, H - padding);
    ctx.stroke();
    ctx.setLineDash([]);

    // 绘制探针在 X 轴上的磁头滑轮
    const pyCenter = getPixelY(0);
    ctx.fillStyle = "var(--color-probe)";
    ctx.beginPath();
    ctx.arc(px, pyCenter, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(px, pyCenter, 4, 0, Math.PI * 2);
    ctx.stroke();

    // 如果探针极其贴近渐近线，发出红色外晕
    if (Math.abs(probeX - paramA) < 0.08) {
        ctx.fillStyle = "rgba(239, 68, 68, 0.25)";
        ctx.beginPath();
        ctx.arc(px, pyCenter, 18, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 汇总绘图
function drawAll() {
    drawGraphGrid();
    drawCurves();
    drawProbeLine();
    updateProbeFloatingHUD();
}

// ==========================================================================
// 6. 浮动诊断 HUD 与板书更新 (HUD & Diagnostics Evaluator)
// ==========================================================================
function updateProbeFloatingHUD() {
    const px = getPixelX(probeX);
    const canvasRect = graphCanvas.getBoundingClientRect();
    
    // 动态定位悬浮 HUD 在探针旁边
    probeHud.style.left = `${px + 16}px`;
    probeHud.style.top = `60px`;

    // 实时计算代数值
    const denVal = probeX - paramA;
    probeEvalDen.textContent = denVal.toFixed(2);

    if (Math.abs(denVal) < 0.001) {
        // 分母为 0 状态
        probeEvalDen.textContent = "0";
        probeEvalLhs.innerHTML = "<span class='math-glow-red'>无意义 (NaN)</span>";
        probeEvalRhs.innerHTML = "<span class='math-glow-red'>无意义 (NaN)</span>";
        
        probeHud.classList.add("alert");
        probeHud.classList.remove("safe");
    } else {
        const lhsVal = probeX / denVal - paramB;
        const rhsVal = paramC / denVal;
        probeEvalLhs.textContent = lhsVal.toFixed(2);
        probeEvalRhs.textContent = rhsVal.toFixed(2);
        
        probeHud.classList.remove("alert");
        probeHud.classList.remove("safe");

        // 如果探针刚好指在相交的根上
        const root = solveEquation();
        if (root !== null && Math.abs(probeX - root) < 0.08) {
            probeHud.classList.add("safe");
        }
    }
}

// 诊断警报核心判定
function runDiagnostics() {
    const root = solveEquation();
    
    const isAtAsymptote = Math.abs(probeX - paramA) < 0.08;
    const isAtRoot = root !== null && Math.abs(probeX - root) < 0.08;

    // 清空警报样式
    alertAmbientLayer.className = "alert-overlay";

    if (isAtRoot) {
        // 如果指针锁定在根的位置
        if (Math.abs(root - paramA) < 0.001) {
            // 此根等于渐近线 a —— 触发增根红色大警报！
            startSiren();
            alertAmbientLayer.className = "alert-overlay alert-red";
            
            // 喷射警告粒子
            const px = getPixelX(probeX);
            triggerExplosion(px + canvasContainer.getBoundingClientRect().left, getPixelY(paramC) + canvasContainer.getBoundingClientRect().top, ["#ef4444", "#f87171", "#f59e0b", "#ffffff"]);
        } else {
            // 实数真根通过！绿色常亮！
            playSafeSound();
            alertAmbientLayer.className = "alert-overlay alert-green";
            
            const px = getPixelX(probeX);
            triggerExplosion(px + canvasContainer.getBoundingClientRect().left, getPixelY(paramC) + canvasContainer.getBoundingClientRect().top, ["#10b981", "#34d399", "#60a5fa", "#ffffff"]);
        }
    } else if (isAtAsymptote) {
        // 临界崩溃区但未指向整式解
        stopSiren();
    } else {
        // 常规滑动扫描
        stopSiren();
    }

    renderChalkboard();
    updateTaskPanel();
}

// 渲染板书板
function renderChalkboard() {
    const root = solveEquation();
    const isExtraneous = root !== null && Math.abs(root - paramA) < 0.001;
    const denVal = probeX - paramA;
    const isProbeAtAsymptote = Math.abs(denVal) < 0.001;
    const lhsText = isProbeAtAsymptote ? "无意义" : (probeX / denVal - paramB).toFixed(2);
    const rhsText = isProbeAtAsymptote ? "无意义" : (paramC / denVal).toFixed(2);

    let equationHtml = `
        <div class="fraction"><span class="num">x</span><span class="den">x - ${paramA >= 0 ? paramA : `(${paramA})`}</span></div> 
        ${paramB >= 0 ? `- ${paramB}` : `+ ${Math.abs(paramB)}`} = 
        <div class="fraction"><span class="num">${paramC}</span><span class="den">x - ${paramA >= 0 ? paramA : `(${paramA})`}</span></div>
    `;
    
    let polyEqHtml = `x - ${paramB === 1 ? "" : (paramB === -1 ? "-" : paramB)}(x - ${paramA >= 0 ? paramA : `(${paramA})`}) = ${paramC}`;

    const rootText = root !== null ? `x = ${root.toFixed(2)}` : "无唯一候选";
    const rootDenText = root !== null ? (Math.abs(root - paramA) < 0.001 ? "0" : (root - paramA).toFixed(2)) : "未形成";
    const verdictText = root === null ? "无唯一候选" : (isExtraneous ? "增根舍去" : "真根保留");
    const verdictClass = root === null ? "neutral" : (isExtraneous ? "danger" : "success");

    let html = `
        <div class="hud-row">
            <div class="hud-row-label">当前分式方程</div>
            <div class="hud-row-val math-bold" style="font-size: 15px; color: var(--primary); display: flex; align-items: center;">
                ${equationHtml}
            </div>
        </div>
        <div class="hud-row">
            <div class="hud-row-label">去分母整式方程</div>
            <div class="hud-row-val math-bold">
                ${polyEqHtml}
            </div>
        </div>
        <div class="hud-check-table">
            <div class="hud-check-cell">
                <span>候选根</span>
                <strong>${root !== null ? `<span class="math-glow-blue">${rootText}</span>` : rootText}</strong>
            </div>
            <div class="hud-check-cell">
                <span>回代分母</span>
                <strong>${root !== null && Math.abs(root - paramA) < 0.001 ? `<span class="math-glow-red">${rootDenText}</span>` : rootDenText}</strong>
            </div>
            <div class="hud-check-cell">
                <span>判定</span>
                <strong><span class="hud-verdict-tag ${verdictClass}">${verdictText}</span></strong>
            </div>
        </div>
        <div class="hud-row probe-readout-row">
            <div class="hud-row-label">探针回代检验</div>
            <div class="hud-row-val">
                x = <strong>${probeX.toFixed(2)}</strong>；分母 x - a = <strong class="${isProbeAtAsymptote ? "math-glow-red" : ""}">${isProbeAtAsymptote ? "0" : denVal.toFixed(2)}</strong><br>
                左边 = <strong>${lhsText}</strong>；右边 = <strong>${rhsText}</strong>
            </div>
        </div>
        <div class="hud-legend-row">
            <span><i class="legend-chip curve-lhs"></i>原分式左边</span>
            <span><i class="legend-chip curve-rhs"></i>原分式右边</span>
            <span><i class="legend-chip danger-line"></i>分母为 0</span>
        </div>
    `;

    stepsChalkboard.innerHTML = html;
}

function getTaskState() {
    const root = solveEquation();
    if (root === null) {
        return {
            title: "检查方程结构",
            hint: "当前整式化后没有唯一交点，先调节 a、b、c 形成可检验候选根。",
            active: 0
        };
    }
    if (Math.abs(probeX - root) >= 0.08) {
        if (Math.abs(probeX - paramA) < 0.08) {
            return {
                title: "检查分母",
                hint: `探针在 x = ${paramA}，此处让分母为 0，原分式方程无意义。`,
                active: 1
            };
        }
        return {
            title: "定位整式根",
            hint: `点“定位整式根”，把探针移到 x = ${root.toFixed(2)}。`,
            active: 0
        };
    }
    if (Math.abs(root - paramA) < 0.001) {
        return {
            title: "判定增根",
            hint: `候选根 x = ${root.toFixed(2)} 使分母 x - ${paramA} = 0，必须舍去。`,
            active: 2
        };
    }
    return {
        title: "真根通过",
        hint: `候选根 x = ${root.toFixed(2)} 回代后分母不为 0，是原分式方程的真根。`,
        active: 2
    };
}

function updateTaskPanel() {
    const task = getTaskState();
    if (taskStatus) taskStatus.textContent = task.title;
    if (taskHint) taskHint.textContent = task.hint;
    if (taskProgress) {
        taskProgress.querySelectorAll(".task-dot").forEach((dot, index) => {
            dot.classList.toggle("active", index <= task.active);
        });
    }
}

// ==========================================================================
// 7. 参数快捷锚定与滑块响应 (Sliders & Anchors Sync)
// ==========================================================================
function updateFormulaDisplay() {
    let html = `
        <div class="fraction"><span class="num">x</span><span class="den">x - ${paramA >= 0 ? paramA : `(${paramA})`}</span></div> 
        ${paramB >= 0 ? `- ${paramB}` : `+ ${Math.abs(paramB)}`} = 
        <div class="fraction"><span class="num">${paramC}</span><span class="den">x - ${paramA >= 0 ? paramA : `(${paramA})`}</span></div>
    `;
    eqDisplayFormula.innerHTML = html;
}

function updateAnchorButtons() {
    anchorButtonsRow.innerHTML = "";
    
    // 渐近线位置 a 锚定
    const btnAsymptote = document.createElement("button");
    btnAsymptote.className = "btn-anchor";
    btnAsymptote.classList.toggle("active", Math.abs(probeX - paramA) < 0.08);
    btnAsymptote.innerHTML = `
        <span class="anchor-label">定位渐近线</span>
        <span class="anchor-val">x = ${paramA}</span>
    `;
    btnAsymptote.addEventListener("click", () => {
        playClickSound();
        probeX = paramA;
        sliderX.value = probeX.toFixed(2);
        valXLabel.textContent = probeX.toFixed(2);
        syncSceneSliderFill(sliderX);
        drawAll();
        runDiagnostics();
    });
    anchorButtonsRow.appendChild(btnAsymptote);

    // 整式方程解 x_root 锚定
    const root = solveEquation();
    if (root !== null && root >= minMathX && root <= maxMathX) {
        const btnRoot = document.createElement("button");
        btnRoot.className = "btn-anchor";
        btnRoot.classList.toggle("active", Math.abs(probeX - root) < 0.08);
        btnRoot.innerHTML = `
            <span class="anchor-label">定位整式根</span>
            <span class="anchor-val">x = ${root.toFixed(2)}</span>
        `;
        btnRoot.addEventListener("click", () => {
            playClickSound();
            probeX = root;
            sliderX.value = probeX.toFixed(2);
            valXLabel.textContent = probeX.toFixed(2);
            syncSceneSliderFill(sliderX);
            drawAll();
            runDiagnostics();
        });
        anchorButtonsRow.appendChild(btnRoot);
    }
}

// ==========================================================================
// 8. 交互事件监听与系统初始化 (Events & Loop)
// ==========================================================================
function initCanvasEvents() {
    const rect = canvasContainer.getBoundingClientRect();
    graphCanvas.width = rect.width * window.devicePixelRatio;
    graphCanvas.height = rect.height * window.devicePixelRatio;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    graphCanvas.style.width = `${rect.width}px`;
    graphCanvas.style.height = `${rect.height}px`;

    const activePointers = new Map();
    let pinchStart = null;

    const getLocalPoint = (e) => {
        const bounds = graphCanvas.getBoundingClientRect();
        const clientX = e.clientX ?? e.touches?.[0]?.clientX;
        const clientY = e.clientY ?? e.touches?.[0]?.clientY;
        return {
            x: clientX - bounds.left,
            y: clientY - bounds.top,
            clientX,
            clientY,
        };
    };

    const isNearProbe = (localX) => Math.abs(localX - getPixelX(probeX)) < 18;

    const beginPan = (point) => {
        isPanningView = true;
        panViewStart = {
            x: point.clientX,
            y: point.clientY,
            centerX: viewCenterX,
            centerY: viewCenterY,
        };
        graphCanvas.classList.add("is-panning");
    };

    const movePan = (point) => {
        if (!isPanningView || !panViewStart) return;
        const bounds = graphCanvas.getBoundingClientRect();
        const dx = (point.clientX - panViewStart.x) / Math.max(1, bounds.width) * getViewSpanX();
        const dy = (point.clientY - panViewStart.y) / Math.max(1, bounds.height) * getViewSpanY();
        viewCenterX = panViewStart.centerX - dx;
        viewCenterY = panViewStart.centerY + dy;
        drawAll();
    };

    const endPan = () => {
        isPanningView = false;
        panViewStart = null;
        graphCanvas.classList.remove("is-panning");
    };

    const beginPinch = () => {
        const points = [...activePointers.values()];
        if (points.length < 2) return;
        const [p1, p2] = points;
        const bounds = graphCanvas.getBoundingClientRect();
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        pinchStart = {
            distance: Math.hypot(p2.x - p1.x, p2.y - p1.y),
            startScale: viewScale,
            anchorMathX: getMathX(midX),
            anchorMathY: getMathY(midY),
            ratioX: (midX - padding) / Math.max(1, bounds.width - 2 * padding),
            ratioY: (bounds.height - padding - midY) / Math.max(1, bounds.height - 2 * padding),
        };
        endPan();
        isDraggingProbe = false;
    };

    const movePinch = () => {
        if (!pinchStart) return;
        const points = [...activePointers.values()];
        if (points.length < 2) return;
        const [p1, p2] = points;
        const distance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        if (!pinchStart.distance) return;
        viewScale = clampViewScale(pinchStart.startScale * (distance / pinchStart.distance));
        viewCenterX = pinchStart.anchorMathX - getViewSpanX() * (pinchStart.ratioX - 0.5);
        viewCenterY = pinchStart.anchorMathY - getViewSpanY() * (pinchStart.ratioY - 0.5);
        drawAll();
    };

    const handlePointerDown = (e) => {
        const point = getLocalPoint(e);
        activePointers.set(e.pointerId, point);

        if (activePointers.size >= 2) {
            beginPinch();
            graphCanvas.setPointerCapture(e.pointerId);
            e.preventDefault();
            return;
        }

        if (isNearProbe(point.x)) {
            isDraggingProbe = true;
            graphCanvas.setPointerCapture(e.pointerId);
            e.preventDefault();
            return;
        }

        beginPan(point);
        graphCanvas.setPointerCapture(e.pointerId);
        e.preventDefault();
    };

    const handlePointerMove = (e) => {
        if (!activePointers.has(e.pointerId)) return;
        const point = getLocalPoint(e);
        activePointers.set(e.pointerId, point);

        if (pinchStart && activePointers.size >= 2) {
            movePinch();
            e.preventDefault();
            return;
        }

        if (isDraggingProbe) {
            let mathX = getMathX(point.x);
            mathX = Math.max(getViewMinX(), Math.min(getViewMaxX(), mathX));
            probeX = snapValue(mathX);
            sliderX.value = probeX.toFixed(2);
            valXLabel.textContent = probeX.toFixed(2);
            drawAll();
            runDiagnostics();
            e.preventDefault();
            return;
        }

        if (isPanningView) {
            movePan(point);
            e.preventDefault();
        }
    };

    const handlePointerUp = (e) => {
        activePointers.delete(e.pointerId);
        if (activePointers.size < 2) {
            pinchStart = null;
        }
        if (activePointers.size === 0) {
            isDraggingProbe = false;
            endPan();
        }
        graphCanvas.releasePointerCapture?.(e.pointerId);
    };

    graphCanvas.addEventListener("pointerdown", handlePointerDown);
    graphCanvas.addEventListener("pointermove", handlePointerMove);
    graphCanvas.addEventListener("pointerup", handlePointerUp);
    graphCanvas.addEventListener("pointercancel", handlePointerUp);

    graphCanvas.addEventListener("wheel", (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.08 : 0.92;
        zoomViewportAt(e.clientX, e.clientY, factor);
        drawAll();
    }, { passive: false });

    graphCanvas.addEventListener("dblclick", (e) => {
        resetViewport();
        drawAll();
        e.preventDefault();
    });
}

function handleResize() {
    const rect = canvasContainer.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    
    graphCanvas.width = rect.width * window.devicePixelRatio;
    graphCanvas.height = rect.height * window.devicePixelRatio;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    graphCanvas.style.width = `${rect.width}px`;
    graphCanvas.style.height = `${rect.height}px`;
    drawAll();
}
window.addEventListener("resize", handleResize);

function init() {
    // 1. 初始化 Canvas
    initCanvasEvents();

    // 2. 绑定参数滑块滑动
    sliderA.addEventListener("input", (e) => {
        currentCaseId = null;
        paramA = parseInt(e.target.value);
        valALabel.textContent = paramA.toString();
        syncSceneSliderFill(e.target);
        updateCaseButtons();
        updateFormulaDisplay();
        updateAnchorButtons();
        drawAll();
        runDiagnostics();
    });

    sliderB.addEventListener("input", (e) => {
        currentCaseId = null;
        paramB = parseFloat(e.target.value);
        valBLabel.textContent = paramB.toFixed(1);
        syncSceneSliderFill(e.target);
        updateCaseButtons();
        updateFormulaDisplay();
        updateAnchorButtons();
        drawAll();
        runDiagnostics();
    });

    sliderC.addEventListener("input", (e) => {
        currentCaseId = null;
        paramC = parseInt(e.target.value);
        valCLabel.textContent = paramC.toString();
        syncSceneSliderFill(e.target);
        updateCaseButtons();
        updateFormulaDisplay();
        updateAnchorButtons();
        drawAll();
        runDiagnostics();
    });

    // 探针滑块
    sliderX.addEventListener("input", (e) => {
        currentCaseId = null;
        probeX = snapValue(parseFloat(e.target.value));
        valXLabel.textContent = probeX.toFixed(2);
        syncSceneSliderFill(e.target);
        updateCaseButtons();
        drawAll();
        runDiagnostics();
    });

    // 3. 开关整式直线
    chkShowLines.addEventListener("change", (e) => {
        showLines = e.target.checked;
        drawAll();
    });

    if (presetCasesRow) {
        presetCasesRow.querySelectorAll(".btn-case-preset").forEach((btn) => {
            btn.addEventListener("click", () => applyPresetCase(btn.dataset.case));
            btn.addEventListener("touchstart", (e) => {
                e.preventDefault();
                applyPresetCase(btn.dataset.case);
            }, { passive: false });
        });
    }

    // 4. 重置沙盒
    btnReset.addEventListener("click", () => {
        playClickSound();
        
        // 重置演变状态
        clearInterval(morphInterval);
        isMorphing = false;
        morphT = 0;
        setMorphButtonState("idle");
        resetViewport();

        const preset = PRESET_CASES.extraneous;
        currentCaseId = "extraneous";
        paramA = preset.a;
        paramB = preset.b;
        paramC = preset.c;
        probeX = preset.probeX;
        showLines = preset.showLines;

        syncAllControls();
    });

    // 5. 帮助弹窗
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

    // 6. Collapsible HUD
    document.getElementById("hud-toggle-btn").addEventListener("click", () => {
        const hud = document.getElementById("hud-chalkboard-panel");
        hud.classList.toggle("collapsed");
        applyHudPlacement();
    });

    // 7. 绑定去分母变形按钮
    btnMorphToggle.addEventListener("click", toggleMorph);

    // 初始化方程显示与计算
    syncAllControls();
    applyHudPlacement();
}

// 图像拉直变形演变动画引擎
function toggleMorph() {
    if (isMorphing) {
        clearInterval(morphInterval);
        isMorphing = false;
        setMorphButtonState("pause");
        return;
    }

    playClickSound();
    isMorphing = true;
    
    const targetT = morphT >= 0.5 ? 0 : 1;
    const direction = targetT === 1 ? 1 : -1;

    setMorphButtonState("running");

    const step = 0.02 * direction;
    
    morphInterval = setInterval(() => {
        morphT += step;
        
        if (direction === 1 && morphT >= 1) {
            morphT = 1;
            clearInterval(morphInterval);
            isMorphing = false;
            setMorphButtonState("restore");
            playSafeSound();
        } else if (direction === -1 && morphT <= 0) {
            morphT = 0;
            clearInterval(morphInterval);
            isMorphing = false;
            setMorphButtonState("idle");
            playClickSound();
        }
        
        drawAll();
        runDiagnostics();
    }, 30);
}

document.addEventListener("DOMContentLoaded", init);
