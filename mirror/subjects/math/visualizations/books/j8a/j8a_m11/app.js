/**
 * 分式约分与通分可视化实验室 - 交互逻辑 (app.js)
 * 1. 约分与通分代数模型定义、多步动画机状态机
 * 2. 动态变量 x 联动渲染引擎
 * 3. 约分公因式飞出消隐特效 + 通分格点分裂动画
 * 4. Web Audio API 音效合成 + Canvas 庆祝粒子
 */

// ==========================================================================
// 1. 全局配置与预设定义
// ==========================================================================
const PRESETS = {
    "1": {
        type: "约分",
        title: "分式约分：单项式公因式",
        formulaText: "2x / (x² + x)",
        formulaHtml: "<div class='fraction'><span class='num'>2x</span><span class='den'>x² + x</span></div>",
        desc: "化简分式时，先将分子分母分解因式，再约去公因式。",
        calc: (x) => {
            if (animationStep === 3) {
                return {
                    topVal: 2,
                    bottomVal: x + 1,
                    topLabel: "2",
                    bottomLabel: "x + 1"
                };
            }
            return {
                topVal: 2 * x,
                bottomVal: x * x + x,
                topLabel: "2x",
                bottomLabel: "x² + x"
            };
        },
        segments: (x) => {
            const countTop = 2;
            const countBottom = Math.round(x + 1);
            if (animationStep === 3) {
                return {
                    topSegs: [{ width: 2, label: "2", type: "factor1" }],
                    bottomSegs: [{ width: x + 1, label: "x + 1", type: "factor2" }]
                };
            }
            return {
                topSegs: [
                    { width: 2, label: "2", type: "factor1" },
                    { width: x, label: "x", type: "common" }
                ],
                bottomSegs: [
                    { width: x, label: "x", type: "common" },
                    { width: x + 1, label: "x + 1", type: "factor2" }
                ]
            };
        },
        commonFactorText: "x",
        commonFactorHtml: "<span class='math-common'>x</span>",
        simplifiedHtml: "<div class='fraction'><span class='num'>2</span><span class='den'>x + 1</span></div>",
        unitPx: 38,
        maxSteps: 3
    },
    "2": {
        type: "约分",
        title: "分式约分：多项式公因式",
        formulaText: "(x² - x) / (x² - 1)",
        formulaHtml: "<div class='fraction'><span class='num'>x² - x</span><span class='den'>x² - 1</span></div>",
        desc: "分子分母均为多项式，先分解为因式乘积，再寻找公共的多项式因子进行约分。",
        calc: (x) => {
            if (animationStep === 3) {
                return {
                    topVal: x,
                    bottomVal: x + 1,
                    topLabel: "x",
                    bottomLabel: "x + 1"
                };
            }
            return {
                topVal: x * x - x,
                bottomVal: x * x - 1,
                topLabel: "x² - x",
                bottomLabel: "x² - 1"
            };
        },
        segments: (x) => {
            const countTop = Math.round(x);
            const countBottom = Math.round(x + 1);
            if (animationStep === 3) {
                return {
                    topSegs: [{ width: x, label: "x", type: "factor1" }],
                    bottomSegs: [{ width: x + 1, label: "x + 1", type: "factor2" }]
                };
            }
            return {
                topSegs: [
                    { width: x, label: "x", type: "factor1" },
                    { width: x - 1, label: "x - 1", type: "common" }
                ],
                bottomSegs: [
                    { width: x - 1, label: "x - 1", type: "common" },
                    { width: x + 1, label: "x + 1", type: "factor2" }
                ]
            };
        },
        commonFactorText: "x - 1",
        commonFactorHtml: "<span class='math-common'>x - 1</span>",
        simplifiedHtml: "<div class='fraction'><span class='num'>x</span><span class='den'>x + 1</span></div>",
        unitPx: 42,
        maxSteps: 3
    },
    "3": {
        type: "通分",
        title: "分式通分：单项式与多项式分母",
        formulaText: "1/x 与 1/(x+1)",
        formulaHtml: "<span>分式一：</span><div class='fraction'><span class='num'>1</span><span class='den'>x</span></div><span>，分式二：</span><div class='fraction'><span class='num'>1</span><span class='den'>x + 1</span></div>",
        desc: "通分的关键是确定最简公分母。分母 x 与 x+1 互质，最简公分母为它们的乘积 x(x + 1)。",
        calc: (x) => ({
            topVal: 5.0,
            bottomVal: 5.0,
            topLabel: "分式一 (1 / x)",
            bottomLabel: "分式二 (1 / (x + 1))"
        }),
        segments: (x) => {
            const numPartsTop = Math.round(x);
            const numPartsBottom = Math.round(x + 1);
            
            // topSegs: 1 highlighted part, rest empty
            const topSegs = Array.from({ length: numPartsTop }, (_, i) => ({
                width: 5.0 / numPartsTop,
                label: i === 0 ? "1 / x" : "",
                type: i === 0 ? "highlighted-blue" : "empty"
            }));
            
            // bottomSegs: 1 highlighted part, rest empty
            const bottomSegs = Array.from({ length: numPartsBottom }, (_, i) => ({
                width: 5.0 / numPartsBottom,
                label: i === 0 ? "1 / (x + 1)" : "",
                type: i === 0 ? "highlighted-purple" : "empty"
            }));
            
            return { topSegs, bottomSegs };
        },
        unitPx: 90,
        maxSteps: 3
    },
    "4": {
        type: "通分",
        title: "分式通分：多项式互质分母",
        formulaText: "1/(x-1) 与 2/(x+1)",
        formulaHtml: "<span>分式一：</span><div class='fraction'><span class='num'>1</span><span class='den'>x - 1</span></div><span>，分式二：</span><div class='fraction'><span class='num'>2</span><span class='den'>x + 1</span></div>",
        desc: "分母为 x-1 与 x+1，没有公因子，最简公分母为 (x - 1)(x + 1)。",
        calc: (x) => ({
            topVal: 5.0,
            bottomVal: 5.0,
            topLabel: "分式一 (1 / (x - 1))",
            bottomLabel: "分式二 (2 / (x + 1))"
        }),
        segments: (x) => {
            const numPartsTop = Math.max(1, Math.round(x - 1));
            const numPartsBottom = Math.round(x + 1);
            
            // topSegs: 1 highlighted part, rest empty
            const topSegs = Array.from({ length: numPartsTop }, (_, i) => ({
                width: 5.0 / numPartsTop,
                label: i === 0 ? "1 / (x-1)" : "",
                type: i === 0 ? "highlighted-blue" : "empty"
            }));
            
            // bottomSegs: 2 highlighted parts, rest empty
            const bottomSegs = Array.from({ length: numPartsBottom }, (_, i) => ({
                width: 5.0 / numPartsBottom,
                label: i < 2 ? "1 / (x+1)" : "",
                type: i < 2 ? "highlighted-purple" : "empty"
            }));
            
            return { topSegs, bottomSegs };
        },
        unitPx: 90,
        maxSteps: 3
    }
};

// 全局状态
let currentPresetId = "1";
let currentX = 3.0;
let animationStep = 0; // 0: 初始, 1: 分解/锁定, 2: 消除中/分裂中, 3: 完成

// DOM 元素引用
const sandboxModeIndicator = document.getElementById("sandbox-mode-indicator");
const barWrapperTop = document.getElementById("bar-wrapper-top");
const barWrapperBottom = document.getElementById("bar-wrapper-bottom");
const lblBarTop = document.getElementById("lbl-bar-top");
const lblBarBottom = document.getElementById("lbl-bar-bottom");
const evalBarTop = document.getElementById("eval-bar-top");
const evalBarBottom = document.getElementById("eval-bar-bottom");
const barBodyTop = document.getElementById("bar-body-top");
const barBodyBottom = document.getElementById("bar-body-bottom");
const segmentsTop = document.getElementById("segments-top");
const segmentsBottom = document.getElementById("segments-bottom");
const rulerLblTop = document.getElementById("ruler-lbl-top");
const rulerLblBottom = document.getElementById("ruler-lbl-bottom");

const sliderX = document.getElementById("slider-x");
const sliderXFill = document.getElementById("slider-x-fill");
const valXLabel = document.getElementById("val-x-label");
const stepsChalkboard = document.getElementById("steps-hud-chalkboard");
const btnNextStep = document.getElementById("btn-next-step");
const txtBtnStep = document.getElementById("txt-btn-step");
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
const floatingCancelLayer = document.getElementById("floating-cancel-layer");

let isHudExpanded = false;
let isApplyingHudPlacement = false;
let hudPlacementObserver = null;

function applyHudPlacement() {
    if (!hudPanel) return;
    const isCollapsed = hudPanel.classList.contains("collapsed");
    const width = isCollapsed ? "176px" : "min(392px, calc(100% - 36px))";
    if (hudArrowIcon) {
        hudArrowIcon.textContent = isCollapsed ? "⌄" : "⌃";
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
    window.setTimeout(applyHudPlacement, 80);
}

function installHudPlacementObserver() {
    if (!hudPanel || hudPlacementObserver) return;
    hudPlacementObserver = new MutationObserver(() => {
        if (!isApplyingHudPlacement) scheduleHudPlacement();
    });
    hudPlacementObserver.observe(hudPanel, {
        attributes: true,
        attributeFilter: ["class", "style"]
    });
}

// ==========================================================================
// 2. Web Audio API 音效合成器
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

    const now = audioCtx.currentTime;

    if (type === 'split') {
        // 网格细分分裂嗖嗖声
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
    } else if (type === 'cancel') {
        // 公因子飞走上升音
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(1320, now + 0.5);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    } else if (type === 'click') {
        // 按键清脆音
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
    } else if (type === 'success') {
        // 成功庆祝大调
        const freqs = [523.25, 659.25, 783.99, 1046.50]; // C 和弦
        freqs.forEach((f, idx) => {
            const o = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(f, now + idx * 0.05);
            g.gain.setValueAtTime(0.06, now + idx * 0.05);
            g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.6);
            o.connect(g);
            g.connect(audioCtx.destination);
            o.start(now + idx * 0.05);
            o.stop(now + idx * 0.05 + 0.6);
        });
    }
}

// ==========================================================================
// 3. Canvas Particle Explosion (喷射粒子流)
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
        const speed = Math.random() * 6 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed - 1.5;
        this.radius = Math.random() * 3 + 1.5;
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

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function triggerExplosion(x, y) {
    const colors = ["#fbbf24", "#3b82f6", "#a78bfa", "#10b981", "#ffffff"];
    for (let i = 0; i < 40; i++) {
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
    }
}

// ==========================================================================
// 4. 几何长条分块渲染引擎 (Fraction Bars Render Core)
// ==========================================================================
function renderFractionBars() {
    const preset = PRESETS[currentPresetId];
    
    // 清空浮空消除层
    floatingCancelLayer.innerHTML = "";

    // 1. 设置沙盒指示器和面板标签
    if (preset.type === "约分") {
        sandboxModeIndicator.textContent = "分式约分模型：找寻公因子化简";
        lblBarTop.textContent = "分式分子";
        lblBarBottom.textContent = "分式分母";
    } else {
        sandboxModeIndicator.textContent = "分式通分模型：划分同分母格点";
        lblBarTop.textContent = "分式一分母";
        lblBarBottom.textContent = "分式二分母";
    }

    // 2. 获取各项代数度量长
    const values = preset.calc(currentX);
    const visibleSceneWidth = document.querySelector(".math-source-scene-j8a_m11")?.clientWidth || barWrapperTop?.parentElement?.clientWidth || 720;
    const modelFrameWidth = Math.max(360, Math.min(visibleSceneWidth, barWrapperTop?.parentElement?.clientWidth || visibleSceneWidth));
    const maxUnits = Math.max(1, values.topVal, values.bottomVal);
    const targetModelWidth = modelFrameWidth * 0.62;
    const adaptiveUnitPx = Math.min(92, Math.max(28, targetModelWidth / maxUnits));
    const unitPx = adaptiveUnitPx;
    const segs = preset.segments(currentX);

    // 动态更新分式条右侧的解析式标签
    let topFormulaText = "";
    let bottomFormulaText = "";
    if (currentPresetId === "1") {
        topFormulaText = "P(x) = 2x";
        bottomFormulaText = animationStep === 0 ? "Q(x) = x² + x" : "Q(x) = x(x + 1)";
    } else if (currentPresetId === "2") {
        topFormulaText = animationStep === 0 ? "P(x) = x² - x" : "P(x) = x(x - 1)";
        bottomFormulaText = animationStep === 0 ? "Q(x) = x² - 1" : "Q(x) = (x + 1)(x - 1)";
    } else if (currentPresetId === "3") {
        topFormulaText = "D₁(x) = x";
        bottomFormulaText = "D₂(x) = x + 1";
    } else if (currentPresetId === "4") {
        topFormulaText = "D₁(x) = x - 1";
        bottomFormulaText = "D₂(x) = x + 1";
    }
    evalBarTop.textContent = topFormulaText;
    evalBarBottom.textContent = bottomFormulaText;

    // 约分情况下的分块处理
    let topWidthUnits = values.topVal;
    let bottomWidthUnits = values.bottomVal;

    // 通分模式下隐藏绝对标尺线，因为通分是比例对齐模型而非长度消除模型
    const rulers = document.querySelectorAll(".bar-ruler-line");
    rulers.forEach(r => r.style.display = preset.type === "通分" ? "none" : "block");

    // 3. 计算最终像素宽度并赋给长条的外层容器
    const topPxWidth = topWidthUnits * unitPx;
    const bottomPxWidth = bottomWidthUnits * unitPx;

    barBodyTop.style.width = `${topPxWidth}px`;
    barBodyBottom.style.width = `${bottomPxWidth}px`;

    // 同步度量刻度线宽度
    if (preset.type === "约分") {
        document.querySelector("#bar-wrapper-top .bar-ruler-line").style.width = `${topPxWidth}px`;
        document.querySelector("#bar-wrapper-bottom .bar-ruler-line").style.width = `${bottomPxWidth}px`;
        rulerLblTop.textContent = `${topWidthUnits.toFixed(1)} cm`;
        rulerLblBottom.textContent = `${bottomWidthUnits.toFixed(1)} cm`;
    }

    // 4. 渲染内部因子分块格子
    renderSegments(segmentsTop, segs.topSegs, unitPx, "top");
    renderSegments(segmentsBottom, segs.bottomSegs, unitPx, "bottom");
    renderLcdGridOverlay();

    // 5. 联动更新板书和步骤按钮文字
    updateChalkboard();
    updateStepButton();
    updateTaskPanel();
}

// 辅助函数：渲染格子
function renderSegments(container, segmentsList, unitPx, position) {
    container.innerHTML = "";
    
    // 如果是 Step 0 (初始态)，只展示一个大实心块，不展示因式分解分块！
    if (animationStep === 0) {
        const totalWidth = segmentsList.reduce((acc, curr) => acc + curr.width, 0);
        const cell = document.createElement("div");
        cell.className = "factor-segment " + (position === "top" ? "factor1" : "factor2");
        cell.classList.add("interactive-factor");
        cell.dataset.factorType = position === "top" ? "factor1" : "factor2";
        cell.dataset.position = position;
        cell.setAttribute("role", "button");
        cell.setAttribute("tabindex", "0");
        cell.style.width = "100%";
        
        // 初始标签显示整式
        const preset = PRESETS[currentPresetId];
        const values = preset.calc(currentX);
        cell.textContent = position === "top" ? values.topLabel : values.bottomLabel;
        cell.addEventListener("pointerdown", handleSegmentPress);
        
        container.appendChild(cell);
        return;
    }

    // Step 1 / 2 / 3：展示精细的分块
    segmentsList.forEach((seg, index) => {
        const cell = document.createElement("div");
        
        // 设置类别颜色
        let typeClass = seg.type;
        cell.className = `factor-segment ${typeClass}`;
        cell.classList.add("interactive-factor");
        cell.dataset.factorType = typeClass;
        cell.dataset.position = position;
        cell.dataset.index = String(index);
        cell.setAttribute("role", "button");
        cell.setAttribute("tabindex", "0");
        cell.style.width = `${(seg.width / segmentsList.reduce((acc, c) => acc + c.width, 0)) * 100}%`;
        
        // 如果是约分完成状态 (Step 3)，将约去的公因式块消隐或宽度归零
        if (animationStep === 3 && PRESETS[currentPresetId].type === "约分") {
            if (typeClass === "common") {
                cell.style.width = "0px";
                cell.style.border = "none";
                cell.style.opacity = "0";
                cell.textContent = "";
                return;
            }
        }

        cell.textContent = seg.label;
        cell.addEventListener("pointerdown", handleSegmentPress);

        // 通分模式下的子分裂虚线绘制 (Step 2 & 3)
        if (PRESETS[currentPresetId].type === "通分" && animationStep >= 2) {
            const subDivCount = currentPresetId === "3" 
                ? (position === "top" ? Math.round(currentX + 1) : Math.round(currentX))
                : (position === "top" ? Math.round(currentX + 1) : Math.round(currentX - 1));
            
            // 绘制 subDivCount - 1 条虚线
            const stepPercent = 100 / subDivCount;
            for (let k = 1; k < subDivCount; k++) {
                const line = document.createElement("div");
                line.className = "subgrid-line visible";
                line.style.left = `${k * stepPercent}%`;
                cell.appendChild(line);
            }
        }

        container.appendChild(cell);
    });
}

function renderLcdGridOverlay() {
    document.querySelectorAll(".lcd-grid-overlay").forEach(node => node.remove());
    const preset = PRESETS[currentPresetId];
    if (preset.type !== "通分" || animationStep < 2) return;

    const cols = Math.min(
        24,
        Math.max(6, Math.round(currentX) * Math.max(2, Math.round(currentX + 1)))
    );
    [barBodyTop, barBodyBottom].forEach((bar) => {
        const overlay = document.createElement("div");
        overlay.className = "lcd-grid-overlay";
        overlay.style.setProperty("--lcd-cols", cols);
        bar.appendChild(overlay);
    });
}

function flashInvalidFactor(cell, message) {
    cell.classList.remove("is-invalid");
    void cell.offsetWidth;
    cell.classList.add("is-invalid");
    if (taskHint) taskHint.textContent = message;
    setTimeout(() => cell.classList.remove("is-invalid"), 360);
}

function drawPairConnectors() {
    floatingCancelLayer.innerHTML = "";
    const layerRect = floatingCancelLayer.getBoundingClientRect();
    const topBlocks = Array.from(segmentsTop.querySelectorAll(".factor-segment.common"));
    const bottomBlocks = Array.from(segmentsBottom.querySelectorAll(".factor-segment.common"));
    const pairCount = Math.min(topBlocks.length, bottomBlocks.length);

    for (let i = 0; i < pairCount; i++) {
        const topRect = topBlocks[i].getBoundingClientRect();
        const bottomRect = bottomBlocks[i].getBoundingClientRect();
        const x1 = topRect.left + topRect.width / 2 - layerRect.left;
        const y1 = topRect.bottom - layerRect.top;
        const x2 = bottomRect.left + bottomRect.width / 2 - layerRect.left;
        const y2 = bottomRect.top - layerRect.top;
        const length = Math.hypot(x2 - x1, y2 - y1);
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
        const connector = document.createElement("div");
        connector.className = "pair-connector";
        connector.style.left = `${x1}px`;
        connector.style.top = `${y1}px`;
        connector.style.width = `${length}px`;
        connector.style.transform = `rotate(${angle}deg)`;
        floatingCancelLayer.appendChild(connector);
    }
}

function handleSegmentPress(event) {
    event.preventDefault();
    const cell = event.currentTarget;
    const preset = PRESETS[currentPresetId];

    if (preset.type === "约分") {
        if (animationStep === 0) {
            triggerStepAnimation();
            return;
        }
        if (animationStep === 1) {
            if (cell.dataset.factorType !== "common") {
                flashInvalidFactor(cell, "这不是上下共有因式；请点按同色的公因式块。");
                return;
            }
            document.querySelectorAll(".factor-segment.common").forEach(block => {
                block.classList.add("is-paired");
            });
            drawPairConnectors();
            if (taskStatus) taskStatus.textContent = "公因式配对";
            if (taskHint) taskHint.textContent = `上下 ${preset.commonFactorText} 已配对，准备约去。`;
            setTimeout(() => {
                if (animationStep === 1) {
                    animationStep = 2;
                    playCancellationAnimation();
                }
            }, 520);
            return;
        }
        return;
    }

    if (animationStep === 0) {
        triggerStepAnimation();
    } else if (animationStep === 1) {
        if (taskStatus) taskStatus.textContent = "分母网格对齐";
        if (taskHint) taskHint.textContent = "两个分母同步扩倍，观察竖向网格对齐。";
        playFissionAnimation();
    }
}

// ==========================================================================
// 5. 步骤动画状态机逻辑 (Reduction & Common Denom Animations)
// ==========================================================================
function triggerStepAnimation() {
    const preset = PRESETS[currentPresetId];

    if (preset.type === "约分") {
        if (animationStep === 0) {
            // Step 0 -> 1: 执行因式分解分割
            animationStep = 1;
            playSound('split');
            renderFractionBars();
        } else if (animationStep === 1) {
            // Step 1 -> 2: 执行约去公因式飞出动画
            animationStep = 2;
            playCancellationAnimation();
        } else if (animationStep === 2) {
            // Step 2 -> 3: 约分完成，收敛缩短
            animationStep = 3;
            playSound('success');
            renderFractionBars();
            
            // 引爆庆祝礼花
            const topRect = barBodyTop.getBoundingClientRect();
            triggerExplosion(topRect.left + topRect.width / 2, topRect.top + topRect.height / 2);
        }
    } else {
        // 通分模式
        if (animationStep === 0) {
            // Step 0 -> 1: 锁定制式，寻找 LCD
            animationStep = 1;
            playSound('click');
            renderFractionBars();
        } else if (animationStep === 1) {
            // Step 1 -> 2: 通分网格裂变分裂
            animationStep = 2;
            playFissionAnimation();
        } else if (animationStep === 2) {
            // Step 2 -> 3: 通分对齐完毕
            animationStep = 3;
            playSound('success');
            renderFractionBars();

            const bottomRect = barBodyBottom.getBoundingClientRect();
            triggerExplosion(bottomRect.left + bottomRect.width / 2, bottomRect.top + bottomRect.height / 2);
        }
    }
}

// 约分模式：公因式分块飞出动画
function playCancellationAnimation() {
    playSound('cancel');
    document.querySelectorAll(".factor-segment.common").forEach(block => {
        block.classList.add("is-paired");
    });
    drawPairConnectors();

    // 寻找所有的 common 分块元素
    const commonBlocks = document.querySelectorAll(".factor-segment.common");
    const rectLayer = floatingCancelLayer.getBoundingClientRect();

    commonBlocks.forEach((block) => {
        const blockRect = block.getBoundingClientRect();
        
        // 创建飘逸幻影
        const phantom = document.createElement("div");
        phantom.className = "cancellation-phantom";
        phantom.textContent = block.textContent;
        phantom.style.left = `${blockRect.left - rectLayer.left}px`;
        phantom.style.top = `${blockRect.top - rectLayer.top}px`;
        phantom.style.width = `${blockRect.width}px`;
        phantom.style.height = `${blockRect.height}px`;

        floatingCancelLayer.appendChild(phantom);
    });

    // 1.2秒后动画飘散结束，自动进入 Step 3 彻底约简
    setTimeout(() => {
        animationStep = 3;
        playSound('success');
        renderFractionBars();
        
        const topRect = barBodyTop.getBoundingClientRect();
        triggerExplosion(topRect.left + topRect.width / 2, topRect.top + topRect.height / 2);
    }, 1100);
}

// 通分模式：格子裂变动画
function playFissionAnimation() {
    playSound('split');
    animationStep = 2;

    // 给格子添加分裂抖动脉冲样式
    document.querySelectorAll(".factor-segment").forEach(cell => {
        cell.classList.add("splitting");
    });

    // 0.6秒后添加分割虚线，进入通分对齐状态
    setTimeout(() => {
        animationStep = 2;
        renderFractionBars();
        
        // 检查线是否完美对齐 (即格点连线对齐)
        setTimeout(() => {
            animationStep = 3;
            playSound('success');
            renderFractionBars();
            
            const bottomRect = barBodyBottom.getBoundingClientRect();
            triggerExplosion(bottomRect.left + bottomRect.width / 2, bottomRect.top + bottomRect.height / 2);
        }, 800);

    }, 600);
}

// 重置
function resetState() {
    animationStep = 0;
    floatingCancelLayer.innerHTML = "";
    renderFractionBars();
}

function updateSliderProgress() {
    if (!sliderX || !sliderXFill) return;
    const min = parseFloat(sliderX.min);
    const max = parseFloat(sliderX.max);
    const value = parseFloat(sliderX.value);
    const progress = Number.isFinite(min) && Number.isFinite(max) && max > min
        ? ((value - min) / (max - min)) * 100
        : 0;
    const clampedProgress = Math.max(0, Math.min(100, progress));
    const progressText = `${clampedProgress}%`;
    sliderXFill.style.width = progressText;
    sliderXFill.style.setProperty("--slider-progress", progressText);
    sliderX.style.setProperty("--slider-progress", progressText);
}

function getProofState() {
    const preset = PRESETS[currentPresetId];
    if (preset.type === "约分") {
        if (currentPresetId === "1") {
            return {
                origin: "2x / (x² + x)",
                factor: "2·x / x(x+1)",
                result: "2 / (x+1)",
                common: "x"
            };
        }
        return {
            origin: "(x² - x) / (x² - 1)",
            factor: "x(x-1) / (x-1)(x+1)",
            result: "x / (x+1)",
            common: "x - 1"
        };
    }
    if (currentPresetId === "3") {
        return {
            origin: "1/x 与 1/(x+1)",
            factor: "LCD = x(x+1)",
            result: "(x+1)/x(x+1) 与 x/x(x+1)"
        };
    }
    return {
        origin: "1/(x-1) 与 2/(x+1)",
        factor: "LCD = (x-1)(x+1)",
        result: "(x+1)/(x-1)(x+1) 与 2(x-1)/(x-1)(x+1)"
    };
}

function getTaskState() {
    const preset = PRESETS[currentPresetId];
    if (preset.type === "约分") {
        if (animationStep === 0) {
            return {
                title: "因式分解",
                hint: "点按分式条或按钮，把整式拆成因式块。",
                active: 0
            };
        }
        if (animationStep === 1) {
            return {
                title: "公因式配对",
                hint: "点按上下同色公因式块，观察它们一一配对。",
                active: 1
            };
        }
        return {
            title: "完成约分",
            hint: "公因式已约去，剩余因式给出最简分式。",
            active: 2
        };
    }

    if (animationStep === 0) {
        return {
            title: "寻找公分母",
            hint: "先确定两个分母需要共同扩成哪个网格。",
            active: 0
        };
    }
    if (animationStep === 1) {
        return {
            title: "分母网格对齐",
            hint: "点按任意分母条或按钮，让两个分母同步扩倍。",
            active: 1
        };
    }
    return {
        title: "完成通分",
        hint: "竖向网格已经对齐，两个分式拥有同一个分母。",
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

function installTouchGuards() {
    const root = document.querySelector(".app-container");
    if (!root) return;
    ["contextmenu", "selectstart", "dragstart"].forEach(type => {
        root.addEventListener(type, (event) => event.preventDefault());
    });
}

function renderProofLine(label, value, active) {
    return `
        <div class="hud-proof-row ${active ? "active" : ""}">
            <span class="proof-label">${label}</span>
            <span class="proof-value">${value}</span>
        </div>
    `;
}

function updateChalkboard() {
    const preset = PRESETS[currentPresetId];
    const proof = getProofState();
    const task = getTaskState();

    if (preset.type === "约分") {
        stepsChalkboard.innerHTML = `
            ${renderProofLine("原式", proof.origin, animationStep === 0)}
            ${renderProofLine("分解", proof.factor, animationStep === 1)}
            ${renderProofLine("约分", proof.result, animationStep >= 2)}
            <div class="hud-verdict-box">
                <div class="verdict-title">${task.title}</div>
                <div class="verdict-desc">公因式：<span class="math-common">${proof.common}</span>。${task.hint}</div>
            </div>
        `;
        return;
    }

    stepsChalkboard.innerHTML = `
        ${renderProofLine("原式", proof.origin, animationStep === 0)}
        ${renderProofLine("公分母", proof.factor, animationStep === 1)}
        ${renderProofLine("通分", proof.result, animationStep >= 2)}
        <div class="hud-verdict-box">
            <div class="verdict-title">${task.title}</div>
            <div class="verdict-desc">${task.hint}</div>
        </div>
    `;
}

// ==========================================================================
// 6. HUD 代数步骤与板书板渲染核心 (Chalkboard Painter)
// ==========================================================================
function updateChalkboardLegacy() {
    const preset = PRESETS[currentPresetId];
    let html = "";

    const xVal = currentX.toFixed(1);

    if (preset.type === "约分") {
        const values = preset.calc(currentX);
        const factorTop = currentPresetId === "1" ? "2 · <span class='math-common'>x</span>" : "<span class='math-factor1'>x</span> · (<span class='math-common'>x - 1</span>)";
        const factorBottom = currentPresetId === "1" ? "(<span class='math-factor2'>x + 1</span>) · <span class='math-common'>x</span>" : "(<span class='math-factor2'>x + 1</span>) · (<span class='math-common'>x - 1</span>)";

        html += `
            <div class="hud-row">
                <div class="hud-row-label">目标代数分式</div>
                <div class="hud-row-val math-bold" style="font-size: 16px; color: var(--primary);">
                    ${preset.formulaHtml}
                </div>
            </div>
            <div class="hud-row">
                <div class="hud-row-label">当前变量代入计算 (x = ${xVal})</div>
                <div class="hud-row-val">
                    分子实际度量：<strong>${values.topLabel}</strong> = ${(values.topVal).toFixed(2)} cm <br>
                    分母实际度量：<strong>${values.bottomLabel}</strong> = ${(values.bottomVal).toFixed(2)} cm
                </div>
            </div>
        `;

        if (animationStep === 0) {
            html += `
                <div class="hud-verdict-box">
                    <div class="verdict-title">第一步：因式分解 (Factorize)</div>
                    <div class="verdict-desc">分子分母均处于多项式状态，需先寻找分子与分母各自的因子分块。请点击下方的“开始化简”。</div>
                </div>
            `;
        } else if (animationStep === 1) {
            html += `
                <div class="hud-row">
                    <div class="hud-row-label">因式分解表达式</div>
                    <div class="hud-row-val math-bold" style="font-size: 15px;">
                        <div class="fraction">
                            <span class="num">${factorTop}</span>
                            <span class="den">${factorBottom}</span>
                        </div>
                    </div>
                </div>
                <div class="hud-verdict-box" style="background: var(--warning-light);">
                    <div class="verdict-title">第二步：寻找公因式</div>
                    <div class="verdict-desc">我们发现分子和分母均含有公共的因子块：<span class="math-common">${preset.commonFactorText}</span>。它们拥有相同的几何长度！</div>
                </div>
            `;
        } else if (animationStep === 2 || animationStep === 3) {
            html += `
                <div class="hud-row">
                    <div class="hud-row-label">约分消除步骤</div>
                    <div class="hud-row-val math-bold" style="font-size: 15px; text-decoration: line-through; opacity: 0.6;">
                        <div class="fraction">
                            <span class="num">${factorTop}</span>
                            <span class="den">${factorBottom}</span>
                        </div>
                    </div>
                </div>
                <div class="hud-row">
                    <div class="hud-row-label">最简分式结果</div>
                    <div class="hud-row-val math-bold" style="font-size: 16px; color: var(--success);">
                        ${preset.simplifiedHtml}
                    </div>
                </div>
                <div class="hud-verdict-box success">
                    <div class="verdict-title">🎉 约分完毕！</div>
                    <div class="verdict-desc">约去分子分母中的公因式 <span class="math-common">${preset.commonFactorText}</span> 后，分式的比例维持恒定。代入计算结果为：<strong>${(preset.calc(currentX).topVal / preset.calc(currentX).commonFactorText === 'x' ? 2 : currentX).toFixed(1)} / ${(currentX + 1).toFixed(1)}</strong>。</div>
                </div>
            `;
        }
    } else {
        // 通分模式 HUD
        const values = preset.calc(currentX);
        const lcdText = currentPresetId === "3" ? "x(x + 1)" : "(x - 1)(x + 1)";
        const factor1Text = currentPresetId === "3" ? "x" : "x - 1";
        const factor2Text = currentPresetId === "3" ? "x + 1" : "x + 1";

        html += `
            <div class="hud-row">
                <div class="hud-row-label">目标待通分分式</div>
                <div class="hud-row-val math-bold" style="font-size: 15px; color: var(--primary); display:flex; align-items:center; gap:8px;">
                    ${preset.formulaHtml}
                </div>
            </div>
            <div class="hud-row">
                <div class="hud-row-label">当前分母度量 (x = ${xVal})</div>
                <div class="hud-row-val">
                    分母一宽度：<strong>${factor1Text}</strong> = ${(currentPresetId === "3" ? currentX : currentX - 1).toFixed(2)} cm <br>
                    分母二宽度：<strong>${factor2Text}</strong> = ${(currentX + 1).toFixed(2)} cm
                </div>
            </div>
        `;

        if (animationStep === 0) {
            html += `
                <div class="hud-verdict-box">
                    <div class="verdict-title">第一步：寻找最简公分母</div>
                    <div class="verdict-desc">分母宽度不同，因而格点处于错开状态。必须寻找两者的公倍数分母。点击“确定公分母”开始。</div>
                </div>
            `;
        } else if (animationStep === 1) {
            html += `
                <div class="hud-row">
                    <div class="hud-row-label">最简公分母 (LCD)</div>
                    <div class="hud-row-val math-bold" style="color: var(--warning); font-size: 16px;">
                        ${lcdText}
                    </div>
                </div>
                <div class="hud-verdict-box">
                    <div class="verdict-title">第二步：网格裂变相乘</div>
                    <div class="verdict-desc">分母一长条需要分裂乘上分母二，分母二长条分裂乘上分母一。点击“执行网格通分”观察分裂。</div>
                </div>
            `;
        } else if (animationStep >= 2) {
            const mult1 = currentPresetId === "3" ? "x + 1" : "x + 1";
            const mult2 = currentPresetId === "3" ? "x" : "x - 1";
            const res1 = currentPresetId === "3" 
                ? `<div class='fraction'><span class='num'>x + 1</span><span class='den'>x(x + 1)</span></div>`
                : `<div class='fraction'><span class='num'>x(x + 1)</span><span class='den'>(x - 1)(x + 1)</span></div>`;
            const res2 = currentPresetId === "3"
                ? `<div class='fraction'><span class='num'>x</span><span class='den'>x(x + 1)</span></div>`
                : `<div class='fraction'><span class='num'>2(x - 1)</span><span class='den'>(x - 1)(x + 1)</span></div>`;

            html += `
                <div class="hud-row">
                    <div class="hud-row-label">通分对齐结果</div>
                    <div class="hud-row-val math-bold" style="font-size: 14px; display:flex; align-items:center; gap:12px; color: var(--success);">
                        <span>式一：${res1}</span> 
                        <span>式二：${res2}</span>
                    </div>
                </div>
                <div class="hud-verdict-box success">
                    <div class="verdict-title">🎉 通分网格垂直对齐！</div>
                    <div class="verdict-desc">通过格点分裂，两个分式的分母格子彻底重合对齐（分母相同）。现在它们可以进行分子的直接加减运算了！</div>
                </div>
            `;
        }
    }

    stepsChalkboard.innerHTML = html;
}

// 动态更新步骤控制按钮的文本
function updateStepButton() {
    const preset = PRESETS[currentPresetId];
    
    if (preset.type === "约分") {
        if (animationStep === 0) {
            txtBtnStep.textContent = "第一步：因式分解";
        } else if (animationStep === 1) {
            txtBtnStep.textContent = "第二步：公因式配对";
        } else if (animationStep === 2) {
            txtBtnStep.textContent = "约分收尾中...";
        } else {
            txtBtnStep.textContent = "已完成约分";
        }
    } else {
        if (animationStep === 0) {
            txtBtnStep.textContent = "第一步：寻找公分母";
        } else if (animationStep === 1) {
            txtBtnStep.textContent = "第二步：分母网格对齐";
        } else if (animationStep === 2) {
            txtBtnStep.textContent = "对齐合并中...";
        } else {
            txtBtnStep.textContent = "已完成通分";
        }
    }

    // 已完成后禁用按钮
    btnNextStep.disabled = (animationStep === 3 || animationStep === 2);
}

// ==========================================================================
// 7. 事件绑定与初始化 (Init Setup)
// ==========================================================================
function loadPreset(id) {
    currentPresetId = id;
    animationStep = 0;

    document.querySelectorAll(".btn-preset").forEach(btn => {
        if (btn.getAttribute("data-preset") === id) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    renderFractionBars();
    updateSliderProgress();
}

function init() {
    installTouchGuards();
    installHudPlacementObserver();
    scheduleHudPlacement();

    // 1. 关卡点击绑定
    document.querySelectorAll(".btn-preset").forEach(btn => {
        btn.addEventListener("click", () => {
            loadPreset(btn.getAttribute("data-preset"));
            scheduleHudPlacement();
        });
    });

    // 2. 变量 x 滑块绑定
    sliderX.addEventListener("input", (e) => {
        currentX = parseFloat(e.target.value);
        valXLabel.textContent = currentX.toFixed(1);
        updateSliderProgress();
        renderFractionBars();
    });

    // 3. 步骤按钮与重置按钮
    btnNextStep.addEventListener("click", () => {
        triggerStepAnimation();
    });
    btnReset.addEventListener("click", () => {
        resetState();
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

    // 5. HUD 板书可折叠
    hudToggleBtn.addEventListener("click", () => {
        isHudExpanded = !isHudExpanded;
        if (isHudExpanded) {
            hudPanel.classList.remove("collapsed");
        } else {
            hudPanel.classList.add("collapsed");
        }
        scheduleHudPlacement();
    });

    // 启动载入关卡 1
    loadPreset("1");
    updateSliderProgress();
    scheduleHudPlacement();
}

document.addEventListener("DOMContentLoaded", init);
