// ==========================================================================
// 一元一次方程解法流程实验室 Core JavaScript Logic (app.js)
// ==========================================================================

// --- Web Audio 声音合成器 ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSynthSound(freq, duration = 0.08, type = "sine") {
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
        console.error(e);
    }
}

// 拖动时的音高动态反馈
let lastSoundTime = 0;
function playDragSound(yVal) {
    const now = performance.now();
    if (now - lastSoundTime > 80) {
        // 映射 y 坐标到 300Hz - 600Hz 之间
        const freq = Math.max(300, Math.min(600, 600 - yVal));
        playSynthSound(freq, 0.02, "triangle");
        lastSoundTime = now;
    }
}

// --- 全局状态管理 ---
let state = {
    activeTab: "eq-balance", // eq-balance, eq-steps, eq-errors
    balance: {
        activeEq: 1, // 1: 2x+3=x+5, 2: 3x-2=x+4
        leftXCount: 2,
        leftConst: 3,
        rightXCount: 1,
        rightConst: 5,
        // 各物块的具体物理状态与拖拽归属
        blocks: []
    },
    steps: {
        activeEq: 1, // 1: 分数复杂型, 2: 常规模拟型
        currentStep: 0,
        totalSteps: 6
    },
    errors: {
        activeCase: 1, // 1: 移项忘变号型, 2: 去括号漏乘型
        selectedStepIdx: null, // 用户选择的行索引
        showCorrected: false
    }
};

// --- 关卡二互动辅助追踪变量 ---
let level2Layouts = [];
let isDraggingCapsule = false;
let dragCapsuleObj = null;

let clickedDenominators = { "3": false, "2": false };
let clickedMultipliers = { "4": false, "3": false, "-2": false };


// --- DOM 元素绑定 ---
const tabBtns = document.querySelectorAll(".tab-btn");
const ctrlGroups = document.querySelectorAll(".ctrl-group");
const whiteboardTitleText = document.getElementById("whiteboard-title-text");
const controlCardTitle = document.getElementById("control-card-title");
const hudContent = document.getElementById("hud-content");
const hudPanel = document.getElementById("hud-panel");
const hudToggle = document.getElementById("hud-toggle");

// HUD 折叠控制
hudToggle.addEventListener("click", () => {
    playSynthSound(450, 0.05);
    hudPanel.classList.toggle("collapsed");
});

// SVG 画布与图层
const svgEl = document.getElementById("geometry-svg");
const gridLayer = document.getElementById("draw-layer-grid");
const bgLayer = document.getElementById("draw-layer-background");
const linesLayer = document.getElementById("draw-layer-lines");
const elementsLayer = document.getElementById("draw-layer-elements");
const pointsLayer = document.getElementById("draw-layer-points");
const learningCue = document.getElementById("learning-cue");
const learningCueKicker = document.getElementById("learning-cue-kicker");
const learningCueText = document.getElementById("learning-cue-text");

// --- 统一工具：创建 SVG 节点 ---
function createSVGNode(type, attrs) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", type);
    for (let k in attrs) {
        el.setAttribute(k, attrs[k]);
    }
    return el;
}

function setLearningCue(kicker, text, tone = "success") {
    if (!learningCue || !learningCueKicker || !learningCueText) return;
    learningCue.dataset.tone = tone;
    learningCueKicker.textContent = kicker;
    learningCueText.textContent = text;
}

function clientToSvgPoint(event) {
    const point = event.touches?.[0] || event.changedTouches?.[0] || event;
    const rect = svgEl.getBoundingClientRect();
    const scale = Math.min(rect.width / 600, rect.height / 340);
    const offsetX = (rect.width - 600 * scale) / 2;
    const offsetY = (rect.height - 340 * scale) / 2;
    return {
        x: Math.max(0, Math.min(600, (point.clientX - rect.left - offsetX) / scale)),
        y: Math.max(0, Math.min(340, (point.clientY - rect.top - offsetY) / scale))
    };
}

// 平台画布负责背景，SVG 内仅保留交互模型图元。
function drawGridBackground() {
    gridLayer.innerHTML = "";
}

// 辅助绘制代数变量电池舱砝码 (SVG)
function drawBatteryWeightShape(group, type) {
    const isPurple = type === "purple";
    const fillGrad = isPurple ? "url(#purpleGrad)" : "url(#cyanGrad)";
    const strokeCol = isPurple ? "#6b21a8" : "#1d4ed8";
    
    const batteryG = createSVGNode("g", { class: isPurple ? "block-battery-purple" : "block-battery-blue" });

    // 电池舱主体外框
    batteryG.appendChild(createSVGNode("rect", {
        x: "-15", y: "-8", width: "30", height: "16",
        rx: "4", ry: "4",
        fill: fillGrad, stroke: strokeCol, "stroke-width": "1.5",
        filter: "url(#softShadow)"
    }));

    // 电池极耳 (正极凸出)
    batteryG.appendChild(createSVGNode("rect", {
        x: "15", y: "-3", width: "2", height: "6",
        rx: "0.5", ry: "0.5",
        fill: strokeCol
    }));

    // 电池内半透明玻璃光面
    batteryG.appendChild(createSVGNode("rect", {
        x: "-15", y: "-8", width: "30", height: "8",
        rx: "4", ry: "4",
        fill: "url(#glassGloss)",
        "pointer-events": "none"
    }));

    group.appendChild(batteryG);
}

// 辅助绘制立方体金属砝码 (SVG)
function drawCubeWeightShape(group, type) {
    const isRust = type === "rust";
    const fillGrad = isRust ? "url(#rustGrad)" : "url(#goldGrad)";
    const strokeCol = isRust ? "#78350f" : "#b45309";

    const weightG = createSVGNode("g", { class: isRust ? "block-weight-rust" : "block-weight-gold" });

    // 3D 棱柱投影效果：后侧/侧面面
    weightG.appendChild(createSVGNode("polygon", {
        points: "-9,-9 -5,-13 13,-13 9,-9",
        fill: fillGrad, stroke: strokeCol, "stroke-width": "1",
        opacity: 0.8
    }));
    weightG.appendChild(createSVGNode("polygon", {
        points: "9,-9 13,-13 13,5 9,9",
        fill: fillGrad, stroke: strokeCol, "stroke-width": "1",
        opacity: 0.9
    }));

    // 前主立面
    weightG.appendChild(createSVGNode("rect", {
        x: "-9", y: "-9", width: "18", height: "18",
        rx: "2", ry: "2",
        fill: fillGrad, stroke: strokeCol, "stroke-width": "1.5",
        filter: "url(#softShadow)"
    }));

    group.appendChild(weightG);
}


// ==========================================================================
// 关卡 1：天平移项与守恒模拟
// ==========================================================================
let isDraggingBlock = false;
let dragTargetBlock = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

function initBalanceLevel() {
    // 根基方程设定
    if (state.balance.activeEq === 1) {
        state.balance.leftXCount = 2;
        state.balance.leftConst = 3;
        state.balance.rightXCount = 1;
        state.balance.rightConst = 5;
    } else {
        state.balance.leftXCount = 3;
        state.balance.leftConst = -2;
        state.balance.rightXCount = 1;
        state.balance.rightConst = 4;
    }
    resetBalanceBlocks();
}

function resetBalanceBlocks() {
    state.balance.blocks = [];
    
    // 生成左侧 x 物块 (蓝色)
    for (let i = 0; i < Math.abs(state.balance.leftXCount); i++) {
        state.balance.blocks.push({
            id: `L-x-${i}`,
            type: "x",
            val: state.balance.leftXCount > 0 ? 1 : -1,
            side: "left", // left or right
            x: 100 + i * 35,
            y: 200,
            width: 30,
            height: 25,
            colorClass: "block-x"
        });
    }
    // 生成左侧常数物块 (橙色)
    const leftConstVal = state.balance.leftConst;
    const absLeftConst = Math.abs(leftConstVal);
    for (let i = 0; i < absLeftConst; i++) {
        state.balance.blocks.push({
            id: `L-c-${i}`,
            type: "constant",
            val: leftConstVal > 0 ? 1 : -1,
            side: "left",
            x: 100 + i * 25,
            y: 230,
            width: 20,
            height: 20,
            colorClass: "block-constant"
        });
    }

    // 生成右侧 x 物块
    for (let i = 0; i < Math.abs(state.balance.rightXCount); i++) {
        state.balance.blocks.push({
            id: `R-x-${i}`,
            type: "x",
            val: state.balance.rightXCount > 0 ? 1 : -1,
            side: "right",
            x: 420 + i * 35,
            y: 200,
            width: 30,
            height: 25,
            colorClass: "block-x"
        });
    }
    // 生成右侧常数物块
    const rightConstVal = state.balance.rightConst;
    const absRightConst = Math.abs(rightConstVal);
    for (let i = 0; i < absRightConst; i++) {
        state.balance.blocks.push({
            id: `R-c-${i}`,
            type: "constant",
            val: rightConstVal > 0 ? 1 : -1,
            side: "right",
            x: 420 + i * 25,
            y: 230,
            width: 20,
            height: 20,
            colorClass: "block-constant"
        });
    }

    renderBalance();
}

function renderBalance() {
    bgLayer.innerHTML = "";
    linesLayer.innerHTML = "";
    elementsLayer.innerHTML = "";
    pointsLayer.innerHTML = "";

    // 1. 计算两侧质量并获得天平倾斜度
    // 设定实际解：x = 2
    const xVal = 2;
    let leftWeight = 0;
    let rightWeight = 0;
    
    state.balance.blocks.forEach(b => {
        const itemVal = b.type === "x" ? b.val * xVal : b.val;
        if (b.side === "left") leftWeight += itemVal;
        else rightWeight += itemVal;
    });

    // 天平状态计算
    const diff = leftWeight - rightWeight;
    // 倾斜弧度限制在 -0.08 到 0.08 之间
    const tiltAngle = Math.max(-0.08, Math.min(0.08, diff * 0.025));

    // 天平中央立柱坐标 (X=330, Y=250 为支撑顶点)
    const standX = 330;
    const standY = 250;
    const beamLength = 320; // 左右总跨度

    // 绘制立柱
    bgLayer.appendChild(createSVGNode("polygon", {
        points: `${standX-15},310 ${standX+15},310 ${standX},${standY}`,
        class: "balance-stand"
    }));
    // 支撑小轴心圆
    bgLayer.appendChild(createSVGNode("circle", {
        cx: standX, cy: standY, r: 6, fill: "#1e293b"
    }));

    // 左右称盘悬挂端点计算
    const leftEndX = standX - (beamLength / 2) * Math.cos(tiltAngle);
    const leftEndY = standY - (beamLength / 2) * Math.sin(tiltAngle);
    const rightEndX = standX + (beamLength / 2) * Math.cos(tiltAngle);
    const rightEndY = standY + (beamLength / 2) * Math.sin(tiltAngle);

    // 2. 绘制天平横梁
    bgLayer.appendChild(createSVGNode("line", {
        x1: leftEndX, y1: leftEndY, x2: rightEndX, y2: rightEndY,
        class: "balance-beam"
    }));

    // 3. 绘制左右托盘及其支架 (保持垂直朝下挂)
    // 左托盘
    const trayWidth = 140;
    const trayDistY = 60; // 悬挂高度
    const leftTrayCenter = { x: leftEndX, y: leftEndY + trayDistY };
    
    // 左悬挂线
    bgLayer.appendChild(createSVGNode("path", {
        d: `M ${leftEndX},${leftEndY} L ${leftTrayCenter.x - trayWidth/2},${leftTrayCenter.y} L ${leftTrayCenter.x + trayWidth/2},${leftTrayCenter.y} Z`,
        class: "balance-pan-hangers"
    }));
    // 左托盘底板
    bgLayer.appendChild(createSVGNode("rect", {
        x: leftTrayCenter.x - trayWidth/2, y: leftTrayCenter.y,
        width: trayWidth, height: 6, rx: 3, ry: 3,
        class: "balance-pan"
    }));

    // 右托盘
    const rightTrayCenter = { x: rightEndX, y: rightEndY + trayDistY };
    
    // 右悬挂线
    bgLayer.appendChild(createSVGNode("path", {
        d: `M ${rightEndX},${rightEndY} L ${rightTrayCenter.x - trayWidth/2},${rightTrayCenter.y} L ${rightTrayCenter.x + trayWidth/2},${rightTrayCenter.y} Z`,
        class: "balance-pan-hangers"
    }));
    // 右托盘底板
    bgLayer.appendChild(createSVGNode("rect", {
        x: rightTrayCenter.x - trayWidth/2, y: rightTrayCenter.y,
        width: trayWidth, height: 6, rx: 3, ry: 3,
        class: "balance-pan"
    }));

    // 4. 更新物块的锚定坐标 (非拖拽状态下)
    // 左右两边天平分界中线 (X = 330)
    state.balance.blocks.forEach((b, idx) => {
        if (isDraggingBlock && dragTargetBlock === b) {
            // 拖拽中物块坐标由鼠标控制，跳过重排
            return;
        }

        // 计算其在托盘上的排列坐标
        const tray = b.side === "left" ? leftTrayCenter : rightTrayCenter;
        
        // 自动分层堆叠排列
        // 按照类型排在一行：x 靠左，常数靠右
        const bIdx = state.balance.blocks.filter(item => item.side === b.side && item.type === b.type).indexOf(b);
        
        if (b.type === "x") {
            b.x = tray.x - trayWidth/2 + 10 + bIdx * 35;
            b.y = tray.y - b.height - 1;
        } else {
            b.x = tray.x + trayWidth/2 - 25 - bIdx * 25;
            b.y = tray.y - b.height - 1;
        }
    });

    // 5. 绘制所有物块 (电池舱与立方砝码)
    state.balance.blocks.forEach(b => {
        const group = createSVGNode("g", {
            class: `eq-block`,
            id: b.id,
            transform: `translate(${b.x}, ${b.y})`
        });

        if (b.type === "x") {
            // 绘制电池舱砝码 (中心定位在 X=17, Y=10)
            const wrapper = createSVGNode("g", { transform: "translate(17, 10)" });
            drawBatteryWeightShape(wrapper, b.val > 0 ? "blue" : "purple");
            group.appendChild(wrapper);
            
            // 绘制代数标签
            const label = createSVGNode("text", {
                x: 17, y: 13,
                class: "eq-block-label",
                style: "font-size: 9px; fill: #ffffff; text-shadow: 0 1px 2px rgba(15, 23, 42, 0.6);"
            });
            label.textContent = b.val > 0 ? "x" : "-x";
            group.appendChild(label);
        } else {
            // 绘制立方砝码 (中心定位在 X=13, Y=13)
            const wrapper = createSVGNode("g", { transform: "translate(13, 13)" });
            drawCubeWeightShape(wrapper, b.val > 0 ? "gold" : "rust");
            group.appendChild(wrapper);
            
            // 绘制代数标签
            const label = createSVGNode("text", {
                x: 13, y: 16,
                class: "eq-block-label",
                style: "font-size: 8px; fill: #ffffff; text-shadow: 0 1px 2px rgba(15, 23, 42, 0.6);"
            });
            label.textContent = b.val > 0 ? "+1" : "-1";
            group.appendChild(label);
        }

        // 挂载拖拽事件监听器
        group.addEventListener("mousedown", (e) => onBlockDragStart(e, b));
        group.addEventListener("touchstart", (e) => onBlockDragStart(e, b), { passive: false });

        elementsLayer.appendChild(group);
    });

    // 6. 绘制天平分界虚线，高亮提示
    linesLayer.appendChild(createSVGNode("line", {
        x1: standX, y1: 20, x2: standX, y2: 320,
        stroke: "rgba(148, 163, 184, 0.4)",
        "stroke-width": 1.5,
        "stroke-dasharray": "5, 4"
    }));
    
    const dividerLabel = createSVGNode("text", {
        x: standX + 8, y: 40,
        fill: "var(--color-text-muted)",
        "font-size": 10,
        "font-weight": 700
    });
    dividerLabel.textContent = "等号边界 (=)";
    linesLayer.appendChild(dividerLabel);

    // 7. 更新右侧监测栏和左侧 HUD 说明
    updateBalanceHUD(diff);
}

// 物理拖拽实现
function onBlockDragStart(e, block) {
    e.preventDefault();
    isDraggingBlock = true;
    dragTargetBlock = block;
    playSynthSound(440, 0.05);

    const { x: svgX, y: svgY } = clientToSvgPoint(e);

    dragOffsetX = svgX - block.x;
    dragOffsetY = svgY - block.y;

    window.addEventListener("mousemove", onBlockDragMove);
    window.addEventListener("touchmove", onBlockDragMove, { passive: false });
    window.addEventListener("mouseup", onBlockDragEnd);
    window.addEventListener("touchend", onBlockDragEnd);
}

function onBlockDragMove(e) {
    if (!isDraggingBlock || !dragTargetBlock) return;
    e.preventDefault();

    const { x: svgX, y: svgY } = clientToSvgPoint(e);

    dragTargetBlock.x = Math.max(0, Math.min(600 - dragTargetBlock.width, svgX - dragOffsetX));
    dragTargetBlock.y = Math.max(0, Math.min(340 - dragTargetBlock.height, svgY - dragOffsetY));

    playDragSound(dragTargetBlock.y);

    // 获取当前物块 DOM 组并实时移动
    const gEl = document.getElementById(dragTargetBlock.id);
    if (gEl) {
        gEl.setAttribute("transform", `translate(${dragTargetBlock.x}, ${dragTargetBlock.y})`);
    }

    // 跨越等号分界线（X=330）的实时移项判断
    const oldSide = dragTargetBlock.side;
    const newSide = dragTargetBlock.x + dragTargetBlock.width / 2 < 330 ? "left" : "right";
    
    if (oldSide !== newSide) {
        // 跨越了等号边界，正负符号翻转！
        dragTargetBlock.side = newSide;
        dragTargetBlock.val = -dragTargetBlock.val;
        playSynthSound(780, 0.06, "square");
    }
}

function onBlockDragEnd() {
    if (isDraggingBlock) {
        isDraggingBlock = false;
        dragTargetBlock = null;
        playSynthSound(520, 0.05);
        renderBalance();
        // 拖拽松手后，进行托盘内正负零对相消判定
        setTimeout(checkAnnihilation, 100);
    }
    window.removeEventListener("mousemove", onBlockDragMove);
    window.removeEventListener("touchmove", onBlockDragMove);
    window.removeEventListener("mouseup", onBlockDragEnd);
    window.removeEventListener("touchend", onBlockDragEnd);
}

// --- 数码天平砝码与变量加装生成器 ---
let balanceBlockIdCounter = 100;
function spawnBlock(side, type, val) {
    const id = `spawned-${balanceBlockIdCounter++}`;
    state.balance.blocks.push({
        id,
        type,
        val,
        side,
        x: side === "left" ? 120 : 450,
        y: 130, // 初始空中悬浮掉落位置
        width: type === "x" ? 34 : 26,
        height: type === "x" ? 26 : 26
    });
    playSynthSound(580, 0.08, "sine");
    renderBalance();
    // 放入托盘后延迟触发同侧对消
    setTimeout(checkAnnihilation, 300);
}

// --- 托盘内正负零对相消算法 ---
function checkAnnihilation() {
    let changed = false;
    const leftBlocks = state.balance.blocks.filter(b => b.side === "left");
    const rightBlocks = state.balance.blocks.filter(b => b.side === "right");

    const findAndRemovePair = (blocks) => {
        // 寻找 +x 和 -x 变量电池舱对
        const plusX = blocks.find(b => b.type === "x" && b.val === 1);
        const minusX = blocks.find(b => b.type === "x" && b.val === -1);
        if (plusX && minusX) {
            triggerPuffAnimation(plusX, minusX);
            state.balance.blocks = state.balance.blocks.filter(b => b !== plusX && b !== minusX);
            return true;
        }
        // 寻找 +1 和 -1 立方砝码对
        const plusC = blocks.find(b => b.type === "constant" && b.val === 1);
        const minusC = blocks.find(b => b.type === "constant" && b.val === -1);
        if (plusC && minusC) {
            triggerPuffAnimation(plusC, minusC);
            state.balance.blocks = state.balance.blocks.filter(b => b !== plusC && b !== minusC);
            return true;
        }
        return false;
    };

    if (findAndRemovePair(leftBlocks)) changed = true;
    if (findAndRemovePair(rightBlocks)) changed = true;

    if (changed) {
        playSynthSound(350, 0.15, "triangle");
        renderBalance();
        // 递归检查直到再无配对可消
        setTimeout(checkAnnihilation, 350);
    }
}

// --- 绘制物种湮灭气泡膨胀爆裂特效 ---
function triggerPuffAnimation(b1, b2) {
    const midX = (b1.x + b2.x) / 2 + b1.width / 2;
    const midY = (b1.y + b2.y) / 2 + b1.height / 2;

    const ring = createSVGNode("circle", {
        cx: midX, cy: midY, r: 2,
        fill: "none",
        stroke: "var(--color-purple)",
        "stroke-width": 3,
        style: "transition: all 0.35s ease-out; opacity: 1;"
    });
    pointsLayer.appendChild(ring);

    // 触发圆环向外膨胀并渐渐透明
    requestAnimationFrame(() => {
        ring.setAttribute("r", "28");
        ring.setAttribute("stroke-width", "0.5");
        ring.style.opacity = "0";
    });

    setTimeout(() => ring.remove(), 400);
}

// --- 等式双消 (左右同项碰撞聚变湮灭) 动画 ---
function purifyEquality() {
    const leftBlocks = state.balance.blocks.filter(b => b.side === "left");
    const rightBlocks = state.balance.blocks.filter(b => b.side === "right");
    
    let matchPair = null;
    for (let l of leftBlocks) {
        const r = rightBlocks.find(item => item.type === l.type && item.val === l.val);
        if (r) {
            matchPair = { left: l, right: r };
            break;
        }
    }
    
    if (!matchPair) {
        // 无相同项可双消，播放低频蜂鸣声反馈
        playSynthSound(220, 0.15, "sawtooth");
        return;
    }
    
    // 动画锁：阻止用户在动画飞入过程中进行交互
    isDraggingBlock = true;
    
    const leftEl = document.getElementById(matchPair.left.id);
    const rightEl = document.getElementById(matchPair.right.id);
    
    if (!leftEl || !rightEl) {
        isDraggingBlock = false;
        return;
    }
    
    // 从状态集中移出，防止重绘
    state.balance.blocks = state.balance.blocks.filter(b => b !== matchPair.left && b !== matchPair.right);
    
    // 飞往中央等号漩涡位置碰撞
    const targetX = 330 - matchPair.left.width / 2;
    const targetY = 120;
    
    leftEl.style.transition = "transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)";
    rightEl.style.transition = "transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)";
    
    playSynthSound(600, 0.3, "sine"); // 聚能飞翔声效
    
    leftEl.setAttribute("transform", `translate(${targetX}, ${targetY})`);
    rightEl.setAttribute("transform", `translate(${targetX}, ${targetY})`);
    
    setTimeout(() => {
        // 发生能量大爆炸
        playSynthSound(880, 0.25, "triangle");
        
        const spark = createSVGNode("circle", {
            cx: 330, cy: targetY + matchPair.left.height / 2, r: 5,
            fill: "none",
            stroke: "var(--color-green)",
            "stroke-width": 4,
            style: "transition: all 0.4s ease-out; opacity: 1;"
        });
        pointsLayer.appendChild(spark);
        
        requestAnimationFrame(() => {
            spark.setAttribute("r", "55");
            spark.setAttribute("stroke-width", "0.5");
            spark.style.opacity = "0";
        });
        
        setTimeout(() => spark.remove(), 400);
        
        leftEl.remove();
        rightEl.remove();
        
        isDraggingBlock = false; // 解锁
        renderBalance();
        
        // 递归检查，确保连续多次净化
        setTimeout(purifyEquality, 650);
    }, 600);
}


// --- 关卡二代数胶囊舱手势交互控制 ---
function isCapsuleDraggable(token) {
    const step = state.steps.currentStep;
    if (state.steps.activeEq === 1) {
        if (step === 2) return token === "-6"; // 拖拽左侧 -6 合并
        if (step === 3) return token === "3x"; // 拖拽 3x 移项
        if (step === 4) return token === "-18"; // 拖拽 -18 移项
        if (step === 5) return token === "-3x"; // 拖拽 -3x 合并
        if (step === 6) return token === "18"; // 拖拽 18 合并
    } else {
        if (step === 1) return token === "-2x"; // 拖拽 -2x 合并
        if (step === 2) return token === "2"; // 拖拽 2 合并
        if (step === 3) return token === "+8"; // 拖拽 +8 移项
        if (step === 4) return token === "-8"; // 拖拽 -8 合并
    }
    return false;
}

function onCapsuleDragStart(e, item) {
    if (state.activeTab !== "eq-steps") return;
    if (!isCapsuleDraggable(item.token)) return; // 只能拖拽当前步要求的项，防止无关项误操作
    
    e.preventDefault();
    isDraggingCapsule = true;
    dragCapsuleObj = item;
    
    playSynthSound(440, 0.05);

    const { x: svgX, y: svgY } = clientToSvgPoint(e);

    dragOffsetX = svgX;
    dragOffsetY = svgY;

    window.addEventListener("mousemove", onCapsuleDragMove);
    window.addEventListener("touchmove", onCapsuleDragMove, { passive: false });
    window.addEventListener("mouseup", onCapsuleDragEnd);
    window.addEventListener("touchend", onCapsuleDragEnd);
}

function onCapsuleDragMove(e) {
    if (!isDraggingCapsule || !dragCapsuleObj) return;
    e.preventDefault();

    const { x: svgX, y: svgY } = clientToSvgPoint(e);

    const dx = svgX - dragOffsetX;
    const dy = svgY - dragOffsetY;

    // 播放拖拽声音反馈
    playDragSound(svgY);

    const gEl = document.getElementById(dragCapsuleObj.id);
    if (gEl) {
        gEl.setAttribute("transform", `translate(${dx}, ${dy})`);
    }
}

function onCapsuleDragEnd(e) {
    if (!isDraggingCapsule || !dragCapsuleObj) return;
    
    isDraggingCapsule = false;
    const item = dragCapsuleObj;
    dragCapsuleObj = null;

    window.removeEventListener("mousemove", onCapsuleDragMove);
    window.removeEventListener("touchmove", onCapsuleDragMove);
    window.removeEventListener("mouseup", onCapsuleDragEnd);
    window.removeEventListener("touchend", onCapsuleDragEnd);

    const { x: svgX, y: svgY } = clientToSvgPoint(e);

    const dx = svgX - dragOffsetX;
    const dy = svgY - dragOffsetY;
    const dropX = item.x + dx;
    const dropY = item.y + dy;

    // 1. 判断是否属于融合合并型 (拖拽到特定项上)
    let targetToken = "";
    if (state.steps.activeEq === 1) {
        if (state.steps.currentStep === 2) targetToken = "-12";
        if (state.steps.currentStep === 5) targetToken = "4x";
        if (state.steps.currentStep === 6) targetToken = "3";
    } else {
        if (state.steps.currentStep === 1) targetToken = "3x";
        if (state.steps.currentStep === 2) targetToken = "6";
        if (state.steps.currentStep === 4) targetToken = "12";
    }

    if (targetToken !== "") {
        const targetLayout = level2Layouts.find(l => l.token === targetToken);
        if (targetLayout) {
            const cx = dropX + item.w / 2;
            const cy = dropY + item.h / 2;
            const tx = targetLayout.x + targetLayout.w / 2;
            const ty = targetLayout.y + targetLayout.h / 2;
            const dist = Math.hypot(cx - tx, cy - ty);
            
            if (dist < 45) {
                // 融合合并成功！
                playSynthSound(880, 0.2, "triangle");
                // 释放粒子光环特效
                triggerPuffAnimation(item, targetLayout);
                // 升级步骤并重新渲染
                state.steps.currentStep++;
                renderStepsLevel();
                return;
            }
        }
    }

    // 2. 判断是否属于移项扫描型 (拖拽跨越等号分界线)
    let isTransposeSuccess = false;
    const dropCenterX = dropX + item.w / 2;
    if (state.steps.activeEq === 1) {
        // 步骤 3: 3x 从右侧拖到左侧
        if (state.steps.currentStep === 3 && item.token === "3x" && dropCenterX < 330) {
            isTransposeSuccess = true;
        }
        // 步骤 4: -18 从左侧拖到右侧
        if (state.steps.currentStep === 4 && item.token === "-18" && dropCenterX > 330) {
            isTransposeSuccess = true;
        }
    } else {
        // 步骤 3: +8 从左侧拖到右侧
        if (state.steps.currentStep === 3 && item.token === "+8" && dropCenterX > 330) {
            isTransposeSuccess = true;
        }
    }

    if (isTransposeSuccess) {
        // 跨越扫描成功！
        playSynthSound(780, 0.25, "sine");
        // 等号激光扫描闸脉冲波
        const spark = createSVGNode("circle", {
            cx: 330, cy: 166, r: 5,
            fill: "none",
            stroke: "var(--color-blue)",
            "stroke-width": 3,
            style: "transition: all 0.35s ease-out; opacity: 1;"
        });
        pointsLayer.appendChild(spark);
        requestAnimationFrame(() => {
            spark.setAttribute("r", "50");
            spark.setAttribute("stroke-width", "0.5");
            spark.style.opacity = "0";
        });
        setTimeout(() => spark.remove(), 400);

        state.steps.currentStep++;
        renderStepsLevel();
        return;
    }

    // 3. 失败，播放回弹滑行特效
    const gEl = document.getElementById(item.id);
    if (gEl) {
        playSynthSound(220, 0.08, "sawtooth");
        slideBack(gEl, dx, dy, 0, 0);
    }
}

function slideBack(el, fromX, fromY, toX, toY) {
    el.style.transition = "transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)";
    el.setAttribute("transform", `translate(${toX}, ${toY})`);
    setTimeout(() => {
        el.style.transition = "";
    }, 260);
}

// --- 分母与分配率系数点击互动逻辑 ---
function handleDenominatorClick(den) {
    if (state.activeTab !== "eq-steps") return;
    if (state.steps.activeEq === 1 && state.steps.currentStep === 0) {
        if (den === "3") clickedDenominators["3"] = true;
        if (den === "2") clickedDenominators["2"] = true;
        
        playSynthSound(600, 0.08, "sine");
        renderStepsLevel();
        
        if (clickedDenominators["3"] && clickedDenominators["2"]) {
            playSynthSound(980, 0.2, "sine");
            // 延时进入下一步去分母展开
            setTimeout(() => {
                state.steps.currentStep = 1;
                renderStepsLevel();
            }, 600);
        }
    }
}

function handleCapsuleClick(token) {
    if (state.activeTab !== "eq-steps") return;
    const step = state.steps.currentStep;
    let changed = false;
    
    if (state.steps.activeEq === 1 && step === 1) {
        if (token.includes("4(x")) {
            clickedMultipliers["4"] = true;
            changed = true;
        }
        if (token.includes("3(x")) {
            clickedMultipliers["3"] = true;
            changed = true;
        }
        
        if (changed) {
            playSynthSound(600, 0.08, "sine");
            renderStepsLevel();
            
            if (clickedMultipliers["4"] && clickedMultipliers["3"]) {
                playSynthSound(980, 0.2, "sine");
                setTimeout(() => {
                    state.steps.currentStep = 2;
                    renderStepsLevel();
                }, 600);
            }
        }
    } else if (state.steps.activeEq === 2 && step === 0) {
        if (token.includes("3(x")) {
            clickedMultipliers["3"] = true;
            changed = true;
        }
        if (token.includes("2(x")) {
            clickedMultipliers["-2"] = true;
            changed = true;
        }
        
        if (changed) {
            playSynthSound(600, 0.08, "sine");
            renderStepsLevel();
            
            if (clickedMultipliers["3"] && clickedMultipliers["-2"]) {
                playSynthSound(980, 0.2, "sine");
                setTimeout(() => {
                    state.steps.currentStep = 1;
                    renderStepsLevel();
                }, 600);
            }
        }
    }
}




function updateBalanceHUD(weightDiff) {
    const isBalanced = weightDiff === 0;

    // 更新监测卡数据
    const balanceStatusEl = document.getElementById("monitor-balance-status");
    if (isBalanced) {
        balanceStatusEl.textContent = "完美平衡";
        balanceStatusEl.style.color = "var(--color-green)";
    } else {
        balanceStatusEl.textContent = weightDiff > 0 ? "左重右轻" : "左轻右重";
        balanceStatusEl.style.color = "var(--color-red)";
    }

    // 计算实际两侧质量
    const xVal = 2;
    let leftW = 0;
    let rightW = 0;
    state.balance.blocks.forEach(b => {
        const itemVal = b.type === "x" ? b.val * xVal : b.val;
        if (b.side === "left") leftW += itemVal;
        else rightW += itemVal;
    });
    document.getElementById("monitor-weight-left").textContent = leftW;
    document.getElementById("monitor-weight-right").textContent = rightW;

    // 构造方程表达式展示
    let leftExprParts = [];
    let rightExprParts = [];

    // 分类提取
    const lx = state.balance.blocks.filter(b => b.side === "left" && b.type === "x").reduce((acc, b) => acc + b.val, 0);
    const lc = state.balance.blocks.filter(b => b.side === "left" && b.type === "constant").reduce((acc, b) => acc + b.val, 0);
    const rx = state.balance.blocks.filter(b => b.side === "right" && b.type === "x").reduce((acc, b) => acc + b.val, 0);
    const rc = state.balance.blocks.filter(b => b.side === "right" && b.type === "constant").reduce((acc, b) => acc + b.val, 0);

    const formatPart = (xCount, cValue) => {
        let parts = [];
        if (xCount !== 0) {
            parts.push(xCount === 1 ? "x" : (xCount === -1 ? "-x" : `${xCount}x`));
        }
        if (cValue !== 0) {
            parts.push(cValue > 0 ? `+ ${cValue}` : `- ${Math.abs(cValue)}`);
        }
        if (parts.length === 0) return "0";
        return parts.join(" ");
    };

    const finalLeft = formatPart(lx, lc);
    const finalRight = formatPart(rx, rc);

    // 左侧悬浮 HUD 代数原理解析
    let hudHtml = `
        <div class="hud-step-card warning">
            <b>1. 等式基本性质演示</b><br>
            当拖动物块越过天平正中央（等号边界）时，物块将发生<b>“移项变号”</b>变化。<br>
            * 加变减，减变加。
        </div>
        <div class="hud-step-card" style="border-left-color:var(--color-blue);">
            <b>2. 当前对应的方程表达式</b><br>
            <div class="hud-math-block">${finalLeft} = ${finalRight}</div>
        </div>
    `;

    if (isBalanced) {
        hudHtml += `
            <div class="hud-step-card success">
                <b>3. 🌟 天平守恒原理</b><br>
                当前两侧代数和等值，物理天平保持平衡。这说明移项后的方程与原方程<b>同解</b>。
            </div>
        `;
    } else {
        hudHtml += `
            <div class="hud-step-card error">
                <b>3. ⚠️ 状态失衡提示</b><br>
                天平发生倾斜！请检查移项变号规则，当方程式处于不平衡状态时，当前的未知数解将与方程冲突。
            </div>
        `;
    }

    hudContent.innerHTML = hudHtml;
    setLearningCue(
        isBalanced ? "等式保持平衡" : "发现失衡",
        isBalanced ? "两边进行了等价操作，方程仍然同解。" : "请在另一边补上同一种操作，使天平重新平衡。",
        isBalanced ? "success" : "error"
    );
}


// ==========================================================================
// 关卡 2：完整五步解方程演示
// ==========================================================================
// 关卡 2 精确方程演进步骤数据
const equationsData = {
    // 案例 1: 复杂分数型  [2(x - 3) / 3] - 1 = (x + 1) / 2
    eq1: [
        {
            name: "第一步：去分母",
            expr: "2(x - 3) / 3 - 1 = (x + 1) / 2",
            desc: "观察方程式，分母含有 3 和 2。点击屏幕中的两个分母，确定其最小公倍数！",
            hud: "<b>🧪 变换步骤：去分母</b><br>在方程中，请<b>依次点击分母 3 和 2</b>。<br>方程两边将同乘以分母的最小公倍数 6，消去分母分数。"
        },
        {
            name: "第二步：去括号 (分配律)",
            expr: "4(x-3) - 6 = 3(x+1)",
            desc: "点击左侧的系数 4 和右侧的系数 3，展开乘法分配律！",
            hud: "<b>🧪 变换步骤：去括号</b><br>请在方程中<b>依次点击分配系数 4 和 3</b>。<br>注意根据乘法分配律将系数分别乘以括号内的每一项！"
        },
        {
            name: "第三步：合并同类项 (左侧常数)",
            expr: "4x - 12 - 6 = 3x + 3",
            desc: "左侧常数项可以合成。拖拽数据卡片 -6 覆盖到 -12 上！",
            hud: "<b>📊 代数合成：合并常数项</b><br>请按住并<b>拖拽 -6 卡片</b>，将其重叠释放到 <b>-12</b> 上进行数值合成！"
        },
        {
            name: "第四步：移项 (未知数居左)",
            expr: "4x - 18 = 3x + 3",
            desc: "未知数应当放在左边。拖拽 3x 穿过等号扫描闸！",
            hud: "<b>⚡ 移项法则：未知数项移项</b><br>请按住并<b>拖拽右侧的 3x</b>，将其向左拉过中央的<b>等号扫描闸</b>（跨界自动移项变号为 -3x）！"
        },
        {
            name: "第五步：移项 (常数项居右)",
            expr: "4x - 3x - 18 = 3",
            desc: "常数项应当放在右边。拖拽 -18 穿过等号扫描闸！",
            hud: "<b>⚡ 移项法则：常数项移项</b><br>请按住并<b>拖拽左侧的 -18</b>，将其向右拉过中央的<b>等号扫描闸</b>（跨界自动移项变号为 +18）！"
        },
        {
            name: "第六步：合并同类项 (未知数项)",
            expr: "4x - 3x = 3 + 18",
            desc: "左侧未知数项可进行代数合成。拖拽 -3x 覆盖到 4x 上！",
            hud: "<b>📊 代数合成：合并未知数项</b><br>请按住并<b>拖拽 -3x 卡片</b>，将其重叠释放到 <b>4x</b> 上进行代数合成！"
        },
        {
            name: "第七步：合并同类项 (右侧常数)",
            expr: "x = 3 + 18",
            desc: "右侧常数项可以合成。拖拽 18 覆盖 to 3 上！",
            hud: "<b>📊 代数合成：计算常数和</b><br>请按住并<b>拖拽 18 卡片</b>，将其重叠释放到 <b>3</b> 上进行最终合并！"
        },
        {
            name: "最终解",
            expr: "x = 21",
            desc: "恭喜！您成功完成了此一元一次方程的步骤化简！",
            hud: "<b>🎉 运算完成！</b><br>方程最终解已得出：<div class=\"hud-math-block\">x = 21</div>"
        }
    ],
    // 案例 2: 常规括号型  3(x + 2) - 2(x - 1) = 12
    eq2: [
        {
            name: "第一步：去括号 (分配律)",
            expr: "3(x+2) - 2(x-1) = 12",
            desc: "观察方程，无分母。点击括号分配系数 3 和 -2，展开括号！",
            hud: "<b>🧪 变换步骤：去括号</b><br>请在方程中<b>依次点击系数 3 和 -2</b>。<br>特别注意：分配负数系数时要变号 (-2 × -1 = +2)！"
        },
        {
            name: "第二步：合并同类项 (未知数项)",
            expr: "3x + 6 - 2x + 2 = 12",
            desc: "左侧同类项可合成。拖拽 -2x 到 3x 上进行合并！",
            hud: "<b>📊 代数合成：合并未知数项</b><br>请按住并<b>拖拽 -2x 卡片</b>，将其释放到 <b>3x</b> 上进行代数合成！"
        },
        {
            name: "第三步：合并同类项 (常数项)",
            expr: "x + 6 + 2 = 12",
            desc: "左侧常数项可以合成。拖拽 2 到 6 上进行合并！",
            hud: "<b>📊 代数合成：合并常数项</b><br>请按住并<b>拖拽 2 卡片</b>，将其释放到 <b>6</b> 上进行数值合并！"
        },
        {
            name: "第四步：移项 (常数项居右)",
            expr: "x + 8 = 12",
            desc: "常数项左侧移至右侧。拖拽 +8 跨越等号扫描闸！",
            hud: "<b>⚡ 移项法则：常数项移项</b><br>请按住并<b>拖拽左侧的 +8</b>，拉过中央的<b>等号扫描闸</b>（跨界自动移项变号为 -8）！"
        },
        {
            name: "第五步：合并得出解",
            expr: "x = 12 - 8",
            desc: "计算最终常数差值。拖拽 -8 到 12 上合并！",
            hud: "<b>📊 代数合成：得出最终解</b><br>请按住并<b>拖拽 -8 卡片</b>，释放到 <b>12</b> 上进行最终合并！"
        },
        {
            name: "最终解",
            expr: "x = 4",
            desc: "恭喜！您成功完成了此方程的化简！",
            hud: "<b>🎉 运算完成！</b><br>方程最终解已得出：<div class=\"hud-math-block\">x = 4</div>"
        }
    ]
};

// 自动排版一元一次方程的各个项与操作符 (避免任何重叠，实现浮动胶囊舱效果)
function drawEquationAutoLayout(group, y, expr, highlights = [], warnings = []) {
    const tokens = expr.split(" ");
    let currentX = 120; // 偏右对齐，避开左侧 HUD
    const gap = 16;
    const layoutInfo = [];

    tokens.forEach((token, idx) => {
        const trimmed = token.trim();
        if (trimmed.length === 0) return;

        const isOperator = trimmed === "=" || trimmed === "+" || trimmed === "-";

        if (isOperator) {
            if (trimmed === "=") {
                // 绘制移项激光扫描闸等号
                const portalG = createSVGNode("g", {
                    class: "transposition-gate",
                    transform: `translate(${currentX + 16}, ${y - 4})`,
                    id: "eq-portal"
                });
                
                // 激光渐变圆罩
                portalG.appendChild(createSVGNode("circle", {
                    cx: 0, cy: 0, r: 24,
                    fill: "url(#portalGrad)",
                    stroke: "var(--color-blue)",
                    "stroke-width": 1,
                    style: "opacity: 0.9;"
                }));

                // 激光垂直扫描线
                portalG.appendChild(createSVGNode("line", {
                    x1: 0, y1: -22, x2: 0, y2: 22,
                    stroke: "#0ea5e9",
                    "stroke-width": 2,
                    style: "filter: drop-shadow(0 0 3px var(--color-blue)); opacity: 0.8;"
                }));

                const eqText = createSVGNode("text", {
                    x: 0, y: 5,
                    "text-anchor": "middle",
                    class: "eq-text-element",
                    style: "fill: #ffffff; font-size: 15px; font-weight: 900;"
                });
                eqText.textContent = "=";
                portalG.appendChild(eqText);

                group.appendChild(portalG);

                layoutInfo.push({ token: trimmed, type: "portal", x: currentX, y: y - 20, w: 32, h: 30 });
                currentX += 32 + gap;
            } else {
                // 绘制普通操作符文本
                const textEl = createSVGNode("text", {
                    x: currentX, y: y + 6,
                    class: "eq-text-element",
                    style: "fill: var(--color-text-muted);"
                });
                textEl.textContent = trimmed;
                group.appendChild(textEl);
                
                layoutInfo.push({ token: trimmed, type: "operator", x: currentX, y: y, w: 16 });
                currentX += 16 + gap;
            }
        } else {
            // 确定是否属于高亮项或警示项
            let modeClass = "";
            if (highlights.some(h => trimmed.includes(h))) {
                modeClass = "highlighted";
            } else if (warnings.some(w => trimmed.includes(w))) {
                modeClass = "warning-glow";
            }

            // 去括号步骤中已点击过的乘数显示高亮绿色
            if (state.steps.currentStep === 1 && state.steps.activeEq === 1) {
                if (trimmed.includes("4(x") && clickedMultipliers["4"]) modeClass = "highlighted";
                if (trimmed.includes("3(x") && clickedMultipliers["3"]) modeClass = "highlighted";
            }
            if (state.steps.currentStep === 0 && state.steps.activeEq === 2) {
                if (trimmed.includes("3(x") && clickedMultipliers["3"]) modeClass = "highlighted";
                if (trimmed.includes("2(x") && clickedMultipliers["-2"]) modeClass = "highlighted";
            }

            // 动态计算字符宽度
            const textWidth = Math.max(45, trimmed.length * 11 + 18);
            const rectX = currentX;
            const rectY = y - 20;
            const rectW = textWidth;
            const rectH = 30;

            const termId = `term-g-${idx}`;
            const termG = createSVGNode("g", {
                id: termId,
                class: "eq-capsule-group",
                style: "cursor: grab;"
            });

            let capClass = "eq-capsule-bg";
            if (modeClass === "highlighted") capClass += " highlighted";
            if (modeClass === "warning-glow") capClass += " warning-glow";

            // 绘制高阶 3D 胶囊背景
            termG.appendChild(createSVGNode("rect", {
                x: rectX, y: rectY, width: rectW, height: rectH,
                class: capClass
            }));

            // 玻璃反光层
            termG.appendChild(createSVGNode("rect", {
                x: rectX, y: rectY, width: rectW, height: rectH,
                class: "glass-gloss-overlay",
                rx: 8, ry: 8
            }));

            // 渲染正文字符
            const textEl = createSVGNode("text", {
                x: rectX + rectW / 2, y: y + 7,
                class: `eq-text-element ${modeClass}`,
                "text-anchor": "middle"
            });
            textEl.textContent = trimmed;
            termG.appendChild(textEl);

            // 如果是警示闪烁项，包围一层闪烁虚线
            if (modeClass === "warning-glow") {
                termG.appendChild(createSVGNode("rect", {
                    x: rectX - 2, y: rectY - 2, width: rectW + 4, height: rectH + 4,
                    class: "glow-rect"
                }));
            }

            group.appendChild(termG);

            const item = { token: trimmed, type: "term", x: rectX, y: rectY, w: rectW, h: rectH, id: termId };
            
            // 绑定胶囊拖动与点击事件
            termG.addEventListener("mousedown", (e) => onCapsuleDragStart(e, item));
            termG.addEventListener("touchstart", (e) => onCapsuleDragStart(e, item), { passive: false });
            termG.addEventListener("click", () => handleCapsuleClick(trimmed));

            layoutInfo.push(item);
            currentX += rectW + gap;
        }
    });

    return layoutInfo;
}

// 辅助绘制分配律圆弧动画
function drawDistributionArc(group, xStart, yStart, xEnd, yEnd, height = -18) {
    const midX = (xStart + xEnd) / 2;
    const midY = yStart + height;
    
    // 绘制二次贝塞尔圆弧
    const path = createSVGNode("path", {
        d: `M ${xStart},${yStart} Q ${midX},${midY} ${xEnd},${yEnd}`,
        class: "distribution-arc"
    });
    group.appendChild(path);

    // 绘制箭头
    const arrow = createSVGNode("polygon", {
        points: `${xEnd},${yEnd} ${xEnd - 5},${yEnd - 6} ${xEnd - 1},${yEnd - 2} ${xEnd - 6},${yEnd + 1}`,
        fill: "var(--color-orange)"
    });
    group.appendChild(arrow);
}

function renderStepsLevel() {
    bgLayer.innerHTML = "";
    linesLayer.innerHTML = "";
    elementsLayer.innerHTML = "";
    pointsLayer.innerHTML = "";

    const activeList = state.steps.activeEq === 1 ? equationsData.eq1 : equationsData.eq2;
    state.steps.totalSteps = activeList.length;
    const currentStepData = activeList[state.steps.currentStep];

    // 更新监测卡及按钮控制
    document.getElementById("step-badge-num").textContent = `步 ${state.steps.currentStep}/${state.steps.totalSteps - 1}`;
    document.getElementById("monitor-step-name").textContent = currentStepData.name;
    document.getElementById("monitor-step-equation").textContent = currentStepData.expr;
    
    document.getElementById("btn-step-prev").disabled = state.steps.currentStep === 0;
    document.getElementById("btn-step-next").disabled = state.steps.currentStep === state.steps.totalSteps - 1;

    const renderY = 170;
    const eqGroup = createSVGNode("g", { transform: `translate(0, 0)` });
    const rawExpr = currentStepData.expr;
    
    if (state.steps.activeEq === 1 && state.steps.currentStep === 0) {
        // 分数展示特别版 (X = 180, 390)
        drawFraction(eqGroup, 185, renderY, "2(x - 3)", "3");
        // 绘制 "- 1 =" 这一段胶囊舱排布
        drawTextCapsule(eqGroup, 260, renderY, "-");
        drawTextCapsule(eqGroup, 290, renderY, "1", "warning-glow");
        drawTextCapsule(eqGroup, 325, renderY, "=");
        
        drawFraction(eqGroup, 420, renderY, "x + 1", "2");

        // 绘制去分母的动画指示线
        // 两边同乘最小公倍数 6 的视觉全息指示
        const lcdLabel = createSVGNode("text", {
            x: 300, y: 70,
            fill: "var(--color-purple)",
            "font-size": 12,
            "font-weight": 800,
            "text-anchor": "middle"
        });
        lcdLabel.textContent = "两边同乘以最小公倍数 6";
        eqGroup.appendChild(lcdLabel);

        // 虚线连接分母与说明
        drawDashedLine(eqGroup, 185, renderY + 45, 300, 80);
        drawDashedLine(eqGroup, 420, renderY + 45, 300, 80);
    } else {
        // 使用高度自适应排版的 Equation auto-layout 机制
        let highlights = [];
        let warnings = [];

        if (state.steps.activeEq === 1) {
            if (state.steps.currentStep === 1) {
                highlights = ["4(x", "3(x"];
                warnings = ["-6"];
            } else if (state.steps.currentStep === 2) {
                highlights = ["-12", "+3", "-6"];
            } else if (state.steps.currentStep === 3) {
                highlights = ["-18"];
            } else if (state.steps.currentStep === 4) {
                highlights = ["-3x"];
            } else if (state.steps.currentStep === 5) {
                highlights = ["+18", "-3x"];
            } else if (state.steps.currentStep === 6) {
                highlights = ["18"];
            } else if (state.steps.currentStep === 7) {
                highlights = ["21"];
            }
        } else {
            if (state.steps.currentStep === 0) {
                highlights = ["3(x", "-2(x"];
            } else if (state.steps.currentStep === 1) {
                highlights = ["+6", "+2"];
            } else if (state.steps.currentStep === 2) {
                highlights = ["+2", "+6"];
            } else if (state.steps.currentStep === 3) {
                highlights = ["+8"];
            } else if (state.steps.currentStep === 4) {
                highlights = ["-8"];
            } else if (state.steps.currentStep === 5) {
                highlights = ["4"];
            }
        }

        level2Layouts = drawEquationAutoLayout(eqGroup, renderY, rawExpr, highlights, warnings);

        // 如果是去括号关卡步骤，绘制带有动态跑马灯的分配圆弧指示线
        if (state.steps.activeEq === 2 && state.steps.currentStep === 0) {
            // "3(x + 2) - 2(x - 1) = 12" 的分配律指引导向线
            // 第 1 个 Term 是 3(x + 2)，其 X 坐标范围
            const t1 = level2Layouts.find(l => l.token.includes("3(x"));
            if (t1) {
                drawDistributionArc(eqGroup, t1.x + 12, t1.y, t1.x + 35, t1.y, -15);
                drawDistributionArc(eqGroup, t1.x + 12, t1.y, t1.x + 65, t1.y, -25);
            }
            // 第 3 个 Term 是 2(x - 1)，注意括号前乘数 -2 的分配
            const t3 = level2Layouts.find(l => l.token.includes("2(x"));
            if (t3) {
                drawDistributionArc(eqGroup, t3.x + 10, t3.y, t3.x + 32, t3.y, -15);
                drawDistributionArc(eqGroup, t3.x + 10, t3.y, t3.x + 62, t3.y, -25);
            }
        }
    }

    elementsLayer.appendChild(eqGroup);

    // 更新 HUD 说明
    updateStepsHUD(currentStepData);
}

// 辅助绘制带背景的分数结构
function drawFraction(group, x, y, numeratorText, denominatorText) {
    // 分子胶囊
    const numWidth = Math.max(65, numeratorText.length * 11 + 18);
    const numX = x - numWidth / 2;
    const numY = y - 36;
    group.appendChild(createSVGNode("rect", {
        x: numX, y: numY, width: numWidth, height: 26,
        class: "eq-capsule-bg highlighted"
    }));
    group.appendChild(createSVGNode("rect", {
        x: numX, y: numY, width: numWidth, height: 26,
        class: "glass-gloss-overlay",
        rx: 8, ry: 8
    }));
    const numText = createSVGNode("text", {
        x: x, y: y - 18,
        class: "eq-text-element highlighted",
        "text-anchor": "middle"
    });
    numText.textContent = numeratorText;
    group.appendChild(numText);

    // 分母胶囊
    const denWidth = Math.max(45, denominatorText.length * 11 + 18);
    const denX = x - denWidth / 2;
    const denY = y + 6;

    const denGroup = createSVGNode("g", {
        style: "cursor: pointer;"
    });

    const isClicked = (denominatorText === "3" && clickedDenominators["3"]) || (denominatorText === "2" && clickedDenominators["2"]);
    const bgFill = isClicked ? "#d1fae5" : "#f3e8ff";
    const bgStroke = isClicked ? "var(--color-green)" : "var(--color-purple)";
    const txtFill = isClicked ? "var(--color-green)" : "var(--color-purple)";

    denGroup.appendChild(createSVGNode("rect", {
        x: denX, y: denY, width: denWidth, height: 26,
        class: "eq-capsule-bg",
        style: `stroke: ${bgStroke}; fill: ${bgFill}; stroke-width: 2px;`
    }));
    denGroup.appendChild(createSVGNode("rect", {
        x: denX, y: denY, width: denWidth, height: 26,
        class: "glass-gloss-overlay",
        rx: 8, ry: 8
    }));
    const denText = createSVGNode("text", {
        x: x, y: y + 24,
        class: "eq-text-element",
        "text-anchor": "middle",
        style: `fill: ${txtFill};`
    });
    denText.textContent = denominatorText;
    denGroup.appendChild(denText);

    // 绑定分母点击事件
    denGroup.addEventListener("mousedown", () => handleDenominatorClick(denominatorText));
    denGroup.addEventListener("touchstart", () => handleDenominatorClick(denominatorText));

    group.appendChild(denGroup);

    // 分数线
    group.appendChild(createSVGNode("line", {
        x1: x - numWidth / 2 - 4, y1: y - 3, x2: x + numWidth / 2 + 4, y2: y - 3,
        class: "eq-fraction-line"
    }));
}

// 辅助绘制带胶囊舱背景的单文字项
function drawTextCapsule(group, x, y, content, modeClass = "") {
    const isOperator = content === "=" || content === "+" || content === "-";
    if (isOperator) {
        const textEl = createSVGNode("text", {
            x: x, y: y + 7,
            class: "eq-text-element",
            style: "fill: var(--color-text-muted);"
        });
        textEl.textContent = content;
        group.appendChild(textEl);
    } else {
        const rectW = Math.max(35, content.length * 11 + 18);
        const rectX = x - rectW / 2;
        const rectY = y - 20;

        let capClass = "eq-capsule-bg";
        if (modeClass === "highlighted") capClass += " highlighted";
        if (modeClass === "warning-glow") capClass += " warning-glow";

        group.appendChild(createSVGNode("rect", {
            x: rectX, y: rectY, width: rectW, height: 30,
            class: capClass
        }));
        group.appendChild(createSVGNode("rect", {
            x: rectX, y: rectY, width: rectW, height: 30,
            class: "glass-gloss-overlay",
            rx: 8, ry: 8
        }));

        const textEl = createSVGNode("text", {
            x: x, y: y + 7,
            class: `eq-text-element ${modeClass}`,
            "text-anchor": "middle"
        });
        textEl.textContent = content;
        group.appendChild(textEl);
    }
}

// 辅助连接线
function drawDashedLine(group, x1, y1, x2, y2) {
    group.appendChild(createSVGNode("line", {
        x1, y1, x2, y2,
        stroke: "var(--color-purple)",
        "stroke-width": 1.5,
        "stroke-dasharray": "4, 3",
        opacity: 0.5
    }));
}


function updateStepsHUD(stepData) {
    hudContent.innerHTML = `
        <div class="hud-step-card warning">
            <b>一元一次方程化简法则</b><br>
            ${stepData.desc}
        </div>
        <div class="hud-step-card success">
            ${stepData.hud}
        </div>
    `;
    setLearningCue(`步骤 ${state.steps.currentStep}/${state.steps.totalSteps - 1}`, stepData.desc, "warning");
}


// ==========================================================================
// 关卡 3：纠错避坑挑战
// ==========================================================================
const errorCases = {
    // 案例 1: 移项忘变号
    case1: {
        eq: "3x - 5 = x + 7",
        steps: [
            { text: "步骤①： 3x - x = 7 - 5", isWrong: true, correctText: "3x - x = 7 + 5", reason: "⚠️ 移项忘变号！左侧的 <b>-5</b> 移到右侧应当变为 <b>+5</b>，而不应该保持 <b>-5</b>。这是初学者最容易遗忘的细节！" },
            { text: "步骤②： 2x = 2", isWrong: false },
            { text: "步骤③： x = 1", isWrong: false }
        ]
    },
    // 案例 2: 去括号漏乘
    case2: {
        eq: "4(x - 2) = 2x - 3",
        steps: [
            { text: "步骤①： 4x - 2 = 2x - 3", isWrong: true, correctText: "4x - 8 = 2x - 3", reason: "⚠️ 去括号漏乘常数！分配率 4 必须同时乘以 <b>x</b> 和 <b>-2</b>。这里忘记乘以 2 了，导致括号未完全展开！" },
            { text: "步骤②： 4x - 2x = -3 + 2", isWrong: false },
            { text: "步骤③： 2x = -1", isWrong: false },
            { text: "步骤④： x = -0.5", isWrong: false }
        ]
    }
};

function renderErrorsLevel() {
    bgLayer.innerHTML = "";
    linesLayer.innerHTML = "";
    elementsLayer.innerHTML = "";
    pointsLayer.innerHTML = "";

    const activeCase = state.errors.activeCase === 1 ? errorCases.case1 : errorCases.case2;

    // 显示原始方程在最顶层 (X = 300 居中)
    const eqLabel = createSVGNode("text", {
        x: 300, y: 55,
        "text-anchor": "middle",
        style: "font-family: var(--font-display); font-size: 22px; font-weight: 800; fill: var(--color-blue);"
    });
    eqLabel.textContent = `求解方程:  ${activeCase.eq}`;
    elementsLayer.appendChild(eqLabel);

    // 绘制手写解题流程卡片 (X = 250 - 550)
    activeCase.steps.forEach((step, idx) => {
        const cardY = 85 + idx * 55;
        const g = createSVGNode("g", {
            class: "error-step-group",
            transform: `translate(160, ${cardY})`
        });

        // 卡片底板
        const rectClass = (state.errors.selectedStepIdx === idx) 
            ? (step.isWrong ? (state.errors.showCorrected ? "error-card-bg selected-correct" : "error-card-bg selected-partial") : "error-card-bg selected-wrong")
            : "error-card-bg";

        const rect = createSVGNode("rect", {
            x: 0, y: 0, width: 320, height: 42,
            class: rectClass
        });
        g.appendChild(rect);

        // 步骤文本
        const text = createSVGNode("text", {
            x: 15, y: 25,
            style: "font-family: var(--font-sans); font-size: 14px; font-weight: 700; fill: var(--color-text-main);"
        });
        text.textContent = step.text;
        g.appendChild(text);

        // 纠错反馈判定绘制 (绿勾或红叉 badge)
        if (state.errors.selectedStepIdx === idx) {
            const badgeIcon = createSVGNode("text", {
                x: 290, y: 27, 
                class: "error-badge-icon", 
                fill: step.isWrong ? (state.errors.showCorrected ? "var(--color-green)" : "var(--color-orange)") : "var(--color-red)"
            });
            // fontawesome icons: check (\uf00c), exclamation (\uf06a), times (\uf00d)
            if (step.isWrong) {
                badgeIcon.textContent = state.errors.showCorrected ? "\uf00c" : "\uf06a";
            } else {
                badgeIcon.textContent = "\uf00d";
            }
            g.appendChild(badgeIcon);
        }

        // 绑定卡片整体点击事件 (视为点击了非核心字符区域)
        g.addEventListener("mousedown", (e) => {
            selectErrorStep(idx, step, false);
        });
        g.addEventListener("touchstart", (e) => {
            selectErrorStep(idx, step, false);
        });

        elementsLayer.appendChild(g);

        // 如果是错误步骤，且被选中，且已成功用红笔圈错：绘制手绘红圈
        if (step.isWrong && state.errors.selectedStepIdx === idx && state.errors.showCorrected) {
            const circleX = state.errors.activeCase === 1 ? 160 + 215 : 160 + 104; // 对应错字符 X 位置
            const circleY = cardY + 20;
            elementsLayer.appendChild(createSVGNode("circle", {
                cx: circleX, cy: circleY, r: 12,
                class: "red-pen-circle"
            }));
        }

        // 如果是错误步骤：在具体错字符上覆盖一个隐式的高精度点击检测框
        if (step.isWrong) {
            const targetX = state.errors.activeCase === 1 ? 160 + 203 : 160 + 92; // 错号的精确坐标
            const targetBox = createSVGNode("rect", {
                x: targetX, y: cardY + 8,
                width: 24, height: 26,
                fill: "transparent",
                style: "cursor: pointer; pointer-events: all;"
            });
            // 阻止冒泡，避免触发卡片背景点击
            const handleExactClick = (e) => {
                e.stopPropagation();
                selectErrorStep(idx, step, true);
            };
            targetBox.addEventListener("mousedown", handleExactClick);
            targetBox.addEventListener("touchstart", handleExactClick);
            elementsLayer.appendChild(targetBox);
        }
    });

    // 绘制诊断镜全息投影与霓虹错误指示 (剪裁层)
    drawDiagnosticLensAnnotations();

    updateErrorsHUD(activeCase);
}

// 全息数学诊断仪外框与手柄绘制
function drawDiagnosticLensFrame(x, y) {
    const container = document.getElementById("draw-layer-magnifying-glass");
    container.innerHTML = "";

    // 1. 诊断仪半透明晶面
    container.appendChild(createSVGNode("circle", {
        cx: x, cy: y, r: 50,
        class: "magnifying-glass-lens"
    }));

    // 2. 诊断仪金属刻度外圈
    container.appendChild(createSVGNode("circle", {
        cx: x, cy: y, r: 50,
        class: "magnifying-glass-rim"
    }));

    // 3. 诊断仪手柄 (45度斜下延伸)
    const angle = Math.PI / 4;
    const hx1 = x + 50 * Math.cos(angle);
    const hy1 = y + 50 * Math.sin(angle);
    const hx2 = x + 85 * Math.cos(angle);
    const hy2 = y + 85 * Math.sin(angle);

    container.appendChild(createSVGNode("line", {
        x1: hx1, y1: hy1, x2: hx2, y2: hy2,
        class: "magnifying-glass-handle"
    }));
}

// 诊断透镜独有：仅在X射线扫描镜下才能显现的全息几何/演算推理指示轨迹
function drawDiagnosticLensAnnotations() {
    const magicLayer = document.getElementById("draw-layer-magic-lens-visible");
    magicLayer.innerHTML = "";

    const cardY = 85; // 错误步骤 Y 坐标 (idx 0)
    
    if (state.errors.activeCase === 1) {
        // 移项忘变号：在 -5 处画霓虹警示圈，并写出正确的转化轨迹
        magicLayer.appendChild(createSVGNode("circle", {
            cx: 160 + 215, cy: cardY + 20, r: 16,
            fill: "none",
            stroke: "var(--color-red)",
            "stroke-width": 2,
            "stroke-dasharray": "3, 2",
            style: "filter: drop-shadow(0 0 5px var(--color-red));"
        }));

        const tipText = createSVGNode("text", {
            x: 160 + 215, y: cardY + 48,
            "text-anchor": "middle",
            style: "fill: var(--color-red); font-size: 10px; font-weight: 800; font-family: var(--font-sans); filter: drop-shadow(0 0 3px rgba(239, 68, 68, 0.6));"
        });
        tipText.textContent = "未变号！应为 +5";
        magicLayer.appendChild(tipText);

        // 绘制从左侧 -5 飞向右侧的虚线流光轨迹
        magicLayer.appendChild(createSVGNode("path", {
            d: `M 110,70 Q 230,20 375,100`,
            fill: "none",
            stroke: "var(--color-blue)",
            "stroke-dasharray": "4, 3",
            "stroke-width": 1.5,
            style: "filter: drop-shadow(0 0 3px var(--color-blue));"
        }));
    } else {
        // 去括号漏乘：从 4 指向 -2 绘制乘法运算线，警示漏乘
        magicLayer.appendChild(createSVGNode("circle", {
            cx: 160 + 104, cy: cardY + 20, r: 16,
            fill: "none",
            stroke: "var(--color-red)",
            "stroke-width": 2,
            "stroke-dasharray": "3, 2",
            style: "filter: drop-shadow(0 0 5px var(--color-red));"
        }));

        const tipText = createSVGNode("text", {
            x: 160 + 104, y: cardY + 48,
            "text-anchor": "middle",
            style: "fill: var(--color-red); font-size: 10px; font-weight: 800; font-family: var(--font-sans); filter: drop-shadow(0 0 3px rgba(239, 68, 68, 0.6));"
        });
        tipText.textContent = "漏乘！4 × -2 应为 -8";
        magicLayer.appendChild(tipText);

        // 绘制分配律弧线
        magicLayer.appendChild(createSVGNode("path", {
            d: `M 170,110 Q 210,80 260,110`,
            fill: "none",
            stroke: "var(--color-purple)",
            "stroke-width": 1.5,
            "stroke-dasharray": "3, 2",
            style: "filter: drop-shadow(0 0 3px var(--color-purple));"
        }));
    }
}

function selectErrorStep(idx, step, isExactWrongCharacter) {
    state.errors.selectedStepIdx = idx;
    const judgeEl = document.getElementById("monitor-error-judge");

    if (step.isWrong) {
        if (isExactWrongCharacter) {
            // 精准红笔批改成功
            state.errors.showCorrected = true;
            playSynthSound(880, 0.25, "sine");
            judgeEl.textContent = "🎯 精准纠错：批改正确！";
            judgeEl.style.color = "var(--color-green)";
        } else {
            // 锁定了行，但没精准指出错字
            state.errors.showCorrected = false;
            playSynthSound(440, 0.15, "triangle");
            judgeEl.textContent = "🔍 卡片正确，请圈出具体错字符";
            judgeEl.style.color = "var(--color-orange)";
        }
    } else {
        // 点了其它对的卡片
        state.errors.showCorrected = false;
        playSynthSound(220, 0.2, "sawtooth");
        judgeEl.textContent = "❌ 这个步骤本身是正确的";
        judgeEl.style.color = "var(--color-red)";
    }
    renderErrorsLevel();
}

function updateErrorsHUD(activeCase) {
    let hudHtml = "";
    
    if (state.errors.selectedStepIdx === null) {
        hudHtml = `
            <div class="hud-step-card warning">
                <b>🔍 方程运算缺陷诊断</b><br>
                在给出的方程演算手稿中，隐藏了一个极具代表性的代数运算错误。<br>
                请移动鼠标，用<b>X射线诊断镜</b>覆盖手稿，观察底层的代数逻辑轨迹，点击锁定存在演算错误的步骤行。
            </div>
        `;
    } else {
        const step = activeCase.steps[state.errors.selectedStepIdx];
        if (step.isWrong) {
            if (state.errors.showCorrected) {
                hudHtml = `
                    <div class="hud-step-card success">
                        <b>🎯 圈画标记错误点成功！</b><br>
                        ${step.reason}
                    </div>
                    <div class="hud-step-card" style="border-left-color:var(--color-green)">
                        <b>正确的等式变换应为：</b><br>
                        <div class="hud-math-block">${step.correctText}</div>
                    </div>
                `;
            } else {
                hudHtml = `
                    <div class="hud-step-card warning">
                        <b>🔍 锁定错误步骤成功，开始标记！</b><br>
                        该步骤存在逻辑缺陷！请移动<b>诊断标记红笔</b>，直接点击手稿中<b>具体计算或变号错误的运算符或数值</b>，进行红圈圈画批改！
                    </div>
                `;
            }
        } else {
            hudHtml = `
                <div class="hud-step-card error">
                    <b>⚠️ 诊断无异常</b><br>
                    该步骤的代数变换与计算均符合运算法则（移项、去分母或分配律应用正确）。<br>
                    请重新仔细核查，看看其他哪一步的常数项或正负号出现了偏差！
                </div>
            `;
        }
    }

    hudContent.innerHTML = hudHtml;
    const cueText = state.errors.selectedStepIdx === null
        ? "先锁定错误步骤，再点击具体的错误符号或数值。"
        : (activeCase.steps[state.errors.selectedStepIdx].isWrong
            ? "已锁定错误步骤，继续点出造成错误的符号或数值。"
            : "该步骤没有错误，请检查其余步骤的等式变形。");
    setLearningCue("诊断任务", cueText, state.errors.selectedStepIdx === null ? "warning" : "error");
}


// ==========================================================================
// 关卡及参数切换调度机制
// ==========================================================================
function switchTab(tabId) {
    state.activeTab = tabId;

    tabBtns.forEach(btn => {
        btn.classList.toggle("active", btn.getAttribute("data-tab") === tabId);
    });

    ctrlGroups.forEach(group => {
        group.classList.toggle("active", group.id === `ctrl-${tabId}`);
    });

    drawGridBackground();

    // 重置关卡二交互计数器
    clickedDenominators = { "3": false, "2": false };
    clickedMultipliers = { "4": false, "3": false, "-2": false };

    if (tabId === "eq-balance") {
        whiteboardTitleText.textContent = "方程等式性质数码天平";
        controlCardTitle.textContent = "实验室参数控制";
        initBalanceLevel();
    } else if (tabId === "eq-steps") {
        whiteboardTitleText.textContent = "方程分步代数化简过程";
        controlCardTitle.textContent = "实验室参数控制";
        state.steps.currentStep = 0;
        renderStepsLevel();
    } else if (tabId === "eq-errors") {
        whiteboardTitleText.textContent = "演算步骤缺陷诊断分析";
        controlCardTitle.textContent = "实验室参数控制";
        state.errors.selectedStepIdx = null;
        renderErrorsLevel();
    }
}

// 事件监听与初始化绑定
function initEventBindings() {
    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            playSynthSound(500, 0.05);
            switchTab(btn.getAttribute("data-tab"));
        });
    });

    // 关卡 1 切换方程
    document.getElementById("btn-balance-eq1").addEventListener("click", () => {
        playSynthSound(450, 0.05);
        document.getElementById("btn-balance-eq1").classList.add("active");
        document.getElementById("btn-balance-eq2").classList.remove("active");
        state.balance.activeEq = 1;
        initBalanceLevel();
    });
    document.getElementById("btn-balance-eq2").addEventListener("click", () => {
        playSynthSound(450, 0.05);
        document.getElementById("btn-balance-eq2").classList.add("active");
        document.getElementById("btn-balance-eq1").classList.remove("active");
        state.balance.activeEq = 2;
        initBalanceLevel();
    });
    document.getElementById("btn-balance-reset").addEventListener("click", () => {
        playSynthSound(600, 0.05);
        resetBalanceBlocks();
    });

    // 绑定天平加装砝码/变量事件
    document.getElementById("btn-add-left-x").addEventListener("click", () => spawnBlock("left", "x", 1));
    document.getElementById("btn-add-left-cx").addEventListener("click", () => spawnBlock("left", "x", -1));
    document.getElementById("btn-add-left-1").addEventListener("click", () => spawnBlock("left", "constant", 1));
    document.getElementById("btn-add-left-c1").addEventListener("click", () => spawnBlock("left", "constant", -1));

    document.getElementById("btn-add-right-x").addEventListener("click", () => spawnBlock("right", "x", 1));
    document.getElementById("btn-add-right-cx").addEventListener("click", () => spawnBlock("right", "x", -1));
    document.getElementById("btn-add-right-1").addEventListener("click", () => spawnBlock("right", "constant", 1));
    document.getElementById("btn-add-right-c1").addEventListener("click", () => spawnBlock("right", "constant", -1));

    // 等式双消按钮绑定
    document.getElementById("btn-balance-purify").addEventListener("click", () => purifyEquality());

    // 关卡 2 控制
    document.getElementById("btn-step-eq1").addEventListener("click", () => {
        playSynthSound(450, 0.05);
        document.getElementById("btn-step-eq1").classList.add("active");
        document.getElementById("btn-step-eq2").classList.remove("active");
        state.steps.activeEq = 1;
        state.steps.currentStep = 0;
        clickedDenominators = { "3": false, "2": false };
        clickedMultipliers = { "4": false, "3": false, "-2": false };
        renderStepsLevel();
    });
    document.getElementById("btn-step-eq2").addEventListener("click", () => {
        playSynthSound(450, 0.05);
        document.getElementById("btn-step-eq2").classList.add("active");
        document.getElementById("btn-step-eq1").classList.remove("active");
        state.steps.activeEq = 2;
        state.steps.currentStep = 0;
        clickedDenominators = { "3": false, "2": false };
        clickedMultipliers = { "4": false, "3": false, "-2": false };
        renderStepsLevel();
    });
    document.getElementById("btn-step-prev").addEventListener("click", () => {
        if (state.steps.currentStep > 0) {
            playSynthSound(480, 0.05);
            state.steps.currentStep--;
            renderStepsLevel();
        }
    });
    document.getElementById("btn-step-next").addEventListener("click", () => {
        const activeList = state.steps.activeEq === 1 ? equationsData.eq1 : equationsData.eq2;
        if (state.steps.currentStep < activeList.length - 1) {
            playSynthSound(620, 0.05);
            state.steps.currentStep++;
            renderStepsLevel();
        }
    });
    document.getElementById("btn-step-reset").addEventListener("click", () => {
        playSynthSound(600, 0.05);
        state.steps.currentStep = 0;
        clickedDenominators = { "3": false, "2": false };
        clickedMultipliers = { "4": false, "3": false, "-2": false };
        renderStepsLevel();
    });

    // 关卡 3 控制
    document.getElementById("btn-error-case1").addEventListener("click", () => {
        playSynthSound(450, 0.05);
        document.getElementById("btn-error-case1").classList.add("active");
        document.getElementById("btn-error-case2").classList.remove("active");
        state.errors.activeCase = 1;
        state.errors.selectedStepIdx = null;
        state.errors.showCorrected = false;
        document.getElementById("monitor-error-judge").textContent = "等待寻找";
        document.getElementById("monitor-error-judge").style.color = "var(--color-text-muted)";
        renderErrorsLevel();
    });
    document.getElementById("btn-error-case2").addEventListener("click", () => {
        playSynthSound(450, 0.05);
        document.getElementById("btn-error-case2").classList.add("active");
        document.getElementById("btn-error-case1").classList.remove("active");
        state.errors.activeCase = 2;
        state.errors.selectedStepIdx = null;
        state.errors.showCorrected = false;
        document.getElementById("monitor-error-judge").textContent = "等待寻找";
        document.getElementById("monitor-error-judge").style.color = "var(--color-text-muted)";
        renderErrorsLevel();
    });
    document.getElementById("btn-error-reset").addEventListener("click", () => {
        playSynthSound(600, 0.05);
        state.errors.selectedStepIdx = null;
        state.errors.showCorrected = false;
        document.getElementById("monitor-error-judge").textContent = "等待寻找";
        document.getElementById("monitor-error-judge").style.color = "var(--color-text-muted)";
        renderErrorsLevel();
    });

    // 鼠标移动时诊断扫描仪跟手判定
    svgEl.addEventListener("mousemove", (e) => {
        if (state.activeTab !== "eq-errors") {
            document.getElementById("lens-clip-circle").setAttribute("cx", -1000);
            document.getElementById("draw-layer-magnifying-glass").innerHTML = "";
            return;
        }
        const { x: svgX, y: svgY } = clientToSvgPoint(e);
        
        // 更新剪裁圆形坐标
        document.getElementById("lens-clip-circle").setAttribute("cx", svgX);
        document.getElementById("lens-clip-circle").setAttribute("cy", svgY);
        
        // 绘制诊断镜外框
        drawDiagnosticLensFrame(svgX, svgY);
    });

    svgEl.addEventListener("mouseleave", () => {
        document.getElementById("lens-clip-circle").setAttribute("cx", -1000);
        document.getElementById("draw-layer-magnifying-glass").innerHTML = "";
    });
}

function init() {
    switchTab("eq-balance");
    initEventBindings();
}

document.addEventListener("DOMContentLoaded", init);
