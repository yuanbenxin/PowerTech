// ==========================================================================
// 《统计与概率金牌实验室》核心控制引擎 (app.js)
// ==========================================================================

// Web Audio API 上下文
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// --- DOM 元素绑定 ---
const hudCard = document.getElementById("analysis-hud-card");
const btnHudToggle = document.getElementById("btn-hud-toggle");
const hudContent = document.getElementById("hud-content-body");
const stepGuideIndicator = document.getElementById("step-guide-indicator");

// 选项卡按钮与切换区域
const tabBtns = document.querySelectorAll(".tab-btn");
const examModeBtns = document.querySelectorAll(".exam-mode-btn");
const tabPanels = document.querySelectorAll(".tab-panel-content");
const ctrlPanels = document.querySelectorAll(".control-group-panel");

// 关卡 1: 大数定律元素
const simItemView = document.getElementById("sim-item-view");
const coinEntity = document.getElementById("coin-entity");
const statsTotal = document.getElementById("stats-total");
const statsLabelA = document.getElementById("stats-label-A");
const statsCountA = document.getElementById("stats-count-A");
const statsLabelB = document.getElementById("stats-label-B");
const statsCountB = document.getElementById("stats-count-B");
const statsFrequency = document.getElementById("stats-frequency");

const convergencePath = document.getElementById("convergence-path");
const convergenceArea = document.getElementById("convergence-area");
const convergenceGrid = document.getElementById("convergence-grid");
const convergenceAxes = document.getElementById("convergence-axes");

const btnTypeCoin = document.getElementById("btn-type-coin");
const btnTypeBall = document.getElementById("btn-type-ball");
const ballRatioSettings = document.getElementById("ball-ratio-settings");
const sliderRedBalls = document.getElementById("slider-red-balls");
const sliderBlueBalls = document.getElementById("slider-blue-balls");
const valRedBalls = document.getElementById("val-red-balls");
const valBlueBalls = document.getElementById("val-blue-balls");

const btnSim1 = document.getElementById("btn-sim-1");
const btnSim10 = document.getElementById("btn-sim-10");
const btnSim100 = document.getElementById("btn-sim-100");
const btnSim1000 = document.getElementById("btn-sim-1000");
const btnSimAuto = document.getElementById("btn-sim-auto");
const btnSimClear = document.getElementById("btn-sim-clear");

// 关卡 2: 树状图与列表元素
const btnViewTree = document.getElementById("btn-view-tree");
const btnViewGrid = document.getElementById("btn-view-grid");
const treeSvg = document.getElementById("tree-svg");
const treeDrawingLayer = document.getElementById("tree-drawing-layer");
const gridTableContainer = document.getElementById("grid-table-container");
const gridMethodTable = document.getElementById("grid-method-table");
const probabilityFormula = document.getElementById("probability-formula");

const btnGameBall = document.getElementById("btn-game-ball");
const btnGameDice = document.getElementById("btn-game-dice");
const treeBallConfigGroup = document.getElementById("tree-ball-config-group");
const sliderBagRed = document.getElementById("slider-bag-red");
const sliderBagBlue = document.getElementById("slider-bag-blue");
const valBagRed = document.getElementById("val-bag-red");
const valBagBlue = document.getElementById("val-bag-blue");
const btnReplaceYes = document.getElementById("btn-replace-yes");
const btnReplaceNo = document.getElementById("btn-replace-no");
const eventSelectionList = document.getElementById("event-selection-list");

// 关卡 3: 集中趋势元素
const histogramGrid = document.getElementById("histogram-grid");
const histogramBars = document.getElementById("histogram-bars");
const histogramCursors = document.getElementById("histogram-cursors");
const pieSlices = document.getElementById("pie-slices");
const pieLegend = document.getElementById("pie-legend");

const valMean = document.getElementById("val-mean");
const valMedian = document.getElementById("val-median");
const valMode = document.getElementById("val-mode");

const sliderFreq0 = document.getElementById("slider-freq-0");
const sliderFreq1 = document.getElementById("slider-freq-1");
const sliderFreq2 = document.getElementById("slider-freq-2");
const sliderFreq3 = document.getElementById("slider-freq-3");
const valFreq0 = document.getElementById("val-freq-0");
const valFreq1 = document.getElementById("val-freq-1");
const valFreq2 = document.getElementById("val-freq-2");
const valFreq3 = document.getElementById("val-freq-3");

const btnStatPreset1 = document.getElementById("btn-stat-preset-1");
const btnStatPreset2 = document.getElementById("btn-stat-preset-2");

// --- 模块一：核心配置与解析秘籍 ---
const levelsData = {
    "large-numbers": {
        indicator: "💡 当前探索：关卡 1 - 大数定律与频率收敛模拟器",
        hint: `
            <h3>大数定律与频率估计概率</h3>
            <ul>
                <li><b>随机事件概率</b>：在相同条件下重复试验，随机事件 $A$ 发生的频率 $f/n$ 会围绕某个常数 $P(A)$ 上下波动。</li>
                <li><b>大数定律 (Law of Large Numbers)</b>：当试验次数 $n$ 极大时，试验频率 $f/n$ 的波动会趋于缓和，稳定在理论概率 $P(A)$ 附近。这允许我们用**试验频率来估计理论概率**。</li>
                <li><b>掷硬币</b>：理论概率 $P(\text{正面}) = 0.5$。</li>
                <li><b>袋中摸球</b>：理论概率 $P(\text{红球}) = \frac{\text{红球数}}{\text{红球}+\text{蓝球}}$。</li>
            </ul>
        `
    },
    "tree-grid": {
        indicator: "💡 当前探索：关卡 2 - 树状图与列表法发生器",
        hint: `
            <h3>求多步随机事件概率的方法</h3>
            <ul>
                <li>当随机事件包含两个或更多独立步骤时，采用<b>树状图法</b>或<b>列表法</b>可以不重不漏地列出所有可能的结果。</li>
                <li><b>列表法</b>：适合两个步骤（如：掷两枚硬币，投掷两个骰子，连续两次摸球）。</li>
                <li><b>树状图法</b>：可推广到三步及以上事件，通过分叉树枝展开所有排列路径。</li>
                <li><b>有放回 vs 无放回</b>：
                    <ul>
                        <li><b>有放回</b>：第二次摸球前将球放回，两阶段独立且球袋内容相同。</li>
                        <li><b>无放回</b>：第一次摸出的球不放回，第二次试验的总数减少1，且 conditional 概率发生变化。</li>
                    </ul>
                </li>
            </ul>
        `
    },
    "stat-charts": {
        indicator: "💡 当前探索：关卡 3 - 统计图与数据集中趋势",
        hint: `
            <h3>数据的集中趋势分析</h3>
            <ul>
                <li><b>平均数 (Mean)</b>：反映数据的平均水平。若为分组数据，用各组中点值乘频数进行求和平均。</li>
                <li><b>中位数 (Median)</b>：数据按顺序排列后处于最中间的数（或中间两个数的平均值）。</li>
                <li><b>众数 (Mode)</b>：数据中出现次数（频数）最多的数。在直方图中对应最高柱形区间的组中值。</li>
                <li><b>联动特征</b>：对称分布时，平均数、中位数与众数重合；偏态分布时它们相互分离。</li>
            </ul>
        `
    }
};

let activeExamMode = "observe";

const examBoardData = {
    "large-numbers": {
        observe: {
            title: "频率估计概率",
            lead: "频率会波动，次数越多越接近概率。",
            steps: ["做重复试验", "记录事件次数", "计算 m/n", "观察稳定值"],
            formula: "频率 = 事件发生次数 m / 试验总次数 n",
            note: "小样本波动大，大样本更稳定。"
        },
        exam: {
            title: "中考解题：频率稳定",
            lead: "用大量重复试验的频率估计概率。",
            steps: ["读清事件", "找 m 与 n", "算频率", "写概率估计"],
            formula: "P(A) ≈ m / n",
            note: "不能用很少次数的结果直接断定概率。"
        },
        task: {
            title: "综合任务：样本估总体",
            lead: "从实验数据判断总体概率。",
            steps: ["设置理论比例", "批量模拟", "比较误差", "解释结论"],
            formula: "误差 = |频率 - 理论概率|",
            note: "关注频率曲线是否逐渐贴近理论线。"
        }
    },
    "tree-grid": {
        observe: {
            title: "树状图与列表法",
            lead: "树的一条路径，对应列表中的一个结果。",
            steps: ["列全部结果", "圈有利结果", "数 m", "数 n"],
            formula: "P(A) = 有利结果数 / 所有等可能结果数",
            note: "先保证不重不漏，再计算概率。"
        },
        exam: {
            title: "中考解题：列举法",
            lead: "两步事件优先用列表或树状图。",
            steps: ["判断是否等可能", "列出样本空间", "高亮事件 A", "约分概率"],
            formula: "P(A)=m/n",
            note: "有放回和无放回的第二步总数不同。"
        },
        task: {
            title: "综合任务：概率建模",
            lead: "把题目情境翻译成树状图或列表。",
            steps: ["确定试验步骤", "确定放回规则", "选事件条件", "解释答案"],
            formula: "路径概率相乘，互斥路径相加",
            note: "树状图适合多步，列表法适合两步。"
        }
    },
    "stat-charts": {
        observe: {
            title: "统计图与集中趋势",
            lead: "同一组数据可以用不同图表表达。",
            steps: ["读频数", "看分布", "算统计量", "比较变化"],
            formula: "平均数 / 中位数 / 众数 / 极差",
            note: "平均数容易受极端值影响。"
        },
        exam: {
            title: "中考解题：读图判断",
            lead: "先读图，再选统计量解释问题。",
            steps: ["确定图表类型", "读数值", "算统计量", "下结论"],
            formula: "平均数 = 总量 / 总个数",
            note: "中位数更适合描述有极端值的数据。"
        },
        task: {
            title: "综合任务：数据分析报告",
            lead: "用统计图和统计量共同说明数据特征。",
            steps: ["调整频数", "观察图形", "比较三量", "选择结论"],
            formula: "结论 = 图表特征 + 统计量解释",
            note: "不要只报数字，要解释数字代表什么。"
        }
    }
};

function renderExamBoard(tabId = state.activeTab) {
    const board = examBoardData[tabId]?.[activeExamMode] || examBoardData[tabId]?.observe;
    if (!board) {
        hudContent.innerHTML = levelsData[tabId]?.hint || "";
        return;
    }
    hudContent.innerHTML = `
        <div class="topic-flow-card">
            <h3>${board.title}</h3>
            <p class="topic-lead">${board.lead}</p>
            <div class="topic-step-grid">
                ${board.steps.map((step, index) => `<span><b>${index + 1}</b>${step}</span>`).join("")}
            </div>
            <div class="topic-formula">${board.formula}</div>
            <div class="topic-note">${board.note}</div>
        </div>
    `;
}

// --- 全局状态状态机 ---
let state = {
    activeTab: "large-numbers",
    // 关卡 1 状态
    largeNumbers: {
        type: "coin", // "coin" | "ball"
        redBalls: 3,
        blueBalls: 3,
        total: 0,
        countA: 0,
        countB: 0,
        history: [],
        autoTimerId: null
    },
    // 关卡 2 状态
    treeGrid: {
        game: "ball", // "ball" | "dice"
        bagRed: 2,
        bagBlue: 2,
        replace: true, // 有放回
        viewType: "tree", // "tree" | "grid"
        selectedEventId: 0
    },
    // 关卡 3 状态
    statCharts: {
        freqs: [5, 12, 8, 5],
        medianAnimationActive: false,
        fadedIndices: [],
        highlightIndices: [],
        animationTimerIds: []
    }
};

// --- 声音反馈合成器 ---
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

// --- 通用辅助工具 ---
function createSVGNode(type, attrs) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", type);
    for (let k in attrs) {
        el.setAttribute(k, attrs[k]);
    }
    return el;
}

function getFractionGCD(a, b) {
    return b === 0 ? a : getFractionGCD(b, a % b);
}

function getReducedFractionText(m, n) {
    if (m === 0) return "0";
    if (m === n) return "1";
    const gcd = getFractionGCD(m, n);
    return `${m / gcd} / ${n / gcd}`;
}

// --- 模块二：关卡选项卡切换 ---
function switchTab(tabId) {
    state.activeTab = tabId;

    // 选项卡按钮样式
    tabBtns.forEach(btn => {
        btn.classList.toggle("active", btn.getAttribute("data-tab") === tabId);
    });

    // 面板切换
    tabPanels.forEach(panel => {
        panel.classList.toggle("active", panel.id === `canvas-${tabId}`);
    });
    ctrlPanels.forEach(ctrl => {
        ctrl.classList.toggle("active", ctrl.id === `ctrl-${tabId}`);
    });

    // 停止自动模拟
    stopAutoSim();

    // 更新 HUD 和引导词
    stepGuideIndicator.innerHTML = levelsData[tabId].indicator;
    renderExamBoard(tabId);

    // 各项重绘
    if (tabId === "large-numbers") {
        renderLargeNumbers();
    } else if (tabId === "tree-grid") {
        renderTreeGrid();
    } else if (tabId === "stat-charts") {
        renderStatCharts();
    }
}

// --- 模块三：关卡 1 - 大数定律算法与渲染 ---
function renderLargeNumbers() {
    const ln = state.largeNumbers;

    const frontText = document.getElementById("coin-front-text");
    const backText = document.getElementById("coin-back-text");
    const coinEdge = document.querySelector(".coin-edge");

    if (ln.type === "coin") {
        statsLabelA.textContent = "正面次数 m";
        statsLabelB.textContent = "反面次数";
        if (frontText) {
            frontText.textContent = "正";
            frontText.style.background = "linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)";
        }
        if (backText) {
            backText.textContent = "反";
            backText.style.background = "linear-gradient(135deg, #a855f7 0%, #7c3aed 50%, #5b21b6 100%)";
        }
        if (coinEdge) {
            coinEdge.style.background = "#d97706";
        }
    } else {
        statsLabelA.textContent = "红球次数 m";
        statsLabelB.textContent = "蓝球次数";
        if (frontText) {
            frontText.textContent = "红球";
            frontText.style.background = "linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #991b1b 100%)";
        }
        if (backText) {
            backText.textContent = "蓝球";
            backText.style.background = "linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1e3a8a 100%)";
        }
        if (coinEdge) {
            coinEdge.style.background = "#dc2626";
        }
    }

    // 更新文本看板
    statsTotal.textContent = ln.total;
    statsCountA.textContent = ln.countA;
    statsCountB.textContent = ln.countB;
    const freq = ln.total > 0 ? (ln.countA / ln.total) : 0.000;
    statsFrequency.textContent = freq.toFixed(3);

    // 绘制收敛曲线折线图
    drawConvergenceChart();
}

function drawConvergenceChart() {
    convergenceGrid.innerHTML = "";
    convergenceAxes.innerHTML = "";

    const ln = state.largeNumbers;
    const width = 600;
    const height = 200;
    const paddingLeft = 40;
    const paddingRight = 35;
    const paddingTop = 20;
    const paddingBottom = 25;

    const chartW = width - paddingLeft - paddingRight;
    const chartH = height - paddingTop - paddingBottom;

    // 绘制网格背景线
    const gridYValues = [0, 0.25, 0.5, 0.75, 1.0];
    gridYValues.forEach(val => {
        const y = paddingTop + chartH * (1 - val);
        convergenceGrid.appendChild(createSVGNode("line", {
            x1: paddingLeft, y1: y, x2: width - paddingRight, y2: y,
            class: "chart-grid-line"
        }));
        
        // 刻度数值
        const text = createSVGNode("text", {
            x: paddingLeft - 8, y: y + 3,
            class: "chart-grid-label",
            "text-anchor": "end"
        });
        text.textContent = val.toFixed(2);
        convergenceGrid.appendChild(text);
    });

    if (ln.history.length === 0) {
        convergencePath.setAttribute("d", "");
        convergenceArea.setAttribute("d", "");
        return;
    }

    // 映射横轴: X 取决于历史点数量
    const maxPoints = 500;
    const pts = ln.history.slice(-maxPoints);
    const steps = pts.length;
    const xInterval = steps > 1 ? chartW / (steps - 1) : chartW;
    const totalCount = ln.total;

    // 绘制收敛包络线漏斗
    const upperPoints = [];
    const lowerPoints = [];
    for (let i = 0; i < steps; i++) {
        const actualStep = totalCount - (steps - 1) + i;
        const x = paddingLeft + i * xInterval;
        
        // 漏斗上下界：0.5 +/- 1/sqrt(n)
        const delta = 0.85 / Math.sqrt(actualStep || 1);
        const upperVal = Math.min(1.0, 0.5 + delta);
        const lowerVal = Math.max(0.0, 0.5 - delta);
        
        const yUpper = paddingTop + chartH * (1 - upperVal);
        const yLower = paddingTop + chartH * (1 - lowerVal);
        
        upperPoints.push(`${x.toFixed(1)},${yUpper.toFixed(1)}`);
        lowerPoints.unshift(`${x.toFixed(1)},${yLower.toFixed(1)}`);
    }
    if (upperPoints.length > 0) {
        const funnelPathD = `M ${upperPoints.join(" L ")} L ${lowerPoints.join(" L ")} Z`;
        convergenceGrid.appendChild(createSVGNode("path", {
            d: funnelPathD,
            class: "funnel-envelope"
        }));
    }

    let pathD = "";
    let areaD = `M ${paddingLeft} ${paddingTop + chartH}`; // 起点在左下角

    pts.forEach((pt, i) => {
        const x = paddingLeft + i * xInterval;
        // 映射 Y: 1.0 对应 0 轴高度，0.0 对应最大高度
        const clampedVal = Math.max(0.0, Math.min(1.0, pt.freq));
        const y = paddingTop + chartH * (1 - clampedVal);

        if (i === 0) {
            pathD += `M ${x} ${y}`;
        } else {
            pathD += ` L ${x} ${y}`;
        }
        areaD += ` L ${x} ${y}`;
    });

    areaD += ` L ${paddingLeft + (steps - 1) * xInterval} ${paddingTop + chartH} Z`;

    convergencePath.setAttribute("d", pathD);
    convergenceArea.setAttribute("d", areaD);

    // 绘制横轴坐标指示
    const xAxisLabelCount = 5;
    const stepCount = steps;

    for (let i = 0; i < xAxisLabelCount; i++) {
        const xRatio = i / (xAxisLabelCount - 1);
        const x = paddingLeft + chartW * xRatio;
        const indexInPts = Math.round((stepCount - 1) * xRatio);
        
        if (indexInPts >= 0 && indexInPts < stepCount) {
            const actualStep = totalCount - (stepCount - 1) + indexInPts;
            const text = createSVGNode("text", {
                x: x, y: height - 8,
                class: "chart-grid-label",
                "text-anchor": "middle"
            });
            text.textContent = actualStep;
            convergenceAxes.appendChild(text);
        }
    }
}

function simulateStep() {
    const ln = state.largeNumbers;
    let isHead = false;

    if (ln.type === "coin") {
        isHead = Math.random() < 0.5;
        if (isHead) {
            ln.countA++;
        } else {
            ln.countB++;
        }
    } else {
        const totalBalls = ln.redBalls + ln.blueBalls;
        isHead = Math.random() < (ln.redBalls / totalBalls);
        if (isHead) {
            ln.countA++;
        } else {
            ln.countB++;
        }
    }

    ln.total++;
    const currentFreq = ln.countA / ln.total;
    ln.history.push({ step: ln.total, freq: currentFreq });

    // 只保留最近 1000 条历史数据以防浏览器卡顿
    if (ln.history.length > 1200) {
        ln.history.shift();
    }
    return isHead;
}

let coinFlipRotationX = 0;

function simulateTimes(times) {
    playSynthSound(440, 0.05);

    let lastResult = false;
    if (times === 1) {
        lastResult = simulateStep();
        
        // 3D 翻转动画：增加旋转圈数并附带 wobble 晃动感
        coinEntity.style.transition = "transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.2)";
        coinFlipRotationX += 1080; // 增加3圈
        
        const currentModulo = coinFlipRotationX % 360;
        if (lastResult) {
            coinFlipRotationX += (360 - currentModulo) % 360;
        } else {
            coinFlipRotationX += ((180 - currentModulo) + 360) % 360;
        }
        coinEntity.style.transform = `rotateX(${coinFlipRotationX}deg) rotateY(15deg)`;
    } else {
        // 高速模拟循环：不触发长动画，直接显示最终面
        for (let i = 0; i < times; i++) {
            lastResult = simulateStep();
        }
        coinEntity.style.transition = "none";
        coinEntity.style.transform = lastResult 
            ? `rotateX(0deg) rotateY(15deg)` 
            : `rotateX(180deg) rotateY(15deg)`;
    }
    renderLargeNumbers();
}

function startAutoSim() {
    const ln = state.largeNumbers;
    if (ln.autoTimerId) return;

    btnSimAuto.innerHTML = `<i class="fa-solid fa-pause"></i> 暂停自动模拟`;
    btnSimAuto.style.borderColor = "var(--color-red)";
    btnSimAuto.style.color = "var(--color-red)";
    btnSimAuto.style.backgroundColor = "rgba(239, 68, 68, 0.05)";

    ln.autoTimerId = setInterval(() => {
        for (let i = 0; i < 5; i++) {
            simulateStep();
        }
        renderLargeNumbers();
        playSynthSound(580, 0.02);
    }, 40);
}

function stopAutoSim() {
    const ln = state.largeNumbers;
    if (!ln.autoTimerId) return;
    clearInterval(ln.autoTimerId);
    ln.autoTimerId = null;

    btnSimAuto.innerHTML = `<i class="fa-solid fa-play"></i> 连续自动模拟`;
    btnSimAuto.style.borderColor = "var(--color-orange)";
    btnSimAuto.style.color = "var(--color-orange)";
    btnSimAuto.style.backgroundColor = "rgba(245, 158, 11, 0.04)";
}

function clearLargeNumbersData() {
    stopAutoSim();
    const ln = state.largeNumbers;
    ln.total = 0;
    ln.countA = 0;
    ln.countB = 0;
    ln.history = [];
    renderLargeNumbers();
    playSynthSound(330, 0.12);
}

// --- 关卡 2: 树状图与列表算法与渲染 ---
const treeBallEvents = [
    { id: 0, text: "两球同色 (如红红、蓝蓝)", filter: (p) => p[0] === p[1] },
    { id: 1, text: "两球异色 (一红一蓝)", filter: (p) => p[0] !== p[1] },
    { id: 2, text: "至少摸出一个红球", filter: (p) => p.includes("红") },
    { id: 3, text: "摸出两个蓝球", filter: (p) => p.filter(c => c === "蓝").length === 2 }
];

const treeDiceEvents = [
    { id: 0, text: "两枚骰子点数相同", filter: (p) => p[0] === p[1] },
    { id: 1, text: "点数之和大于等于 8", filter: (p) => (p[0] + p[1]) >= 8 },
    { id: 2, text: "至少有一枚骰子掷出 6 点", filter: (p) => p.includes(6) },
    { id: 3, text: "点数之积为偶数", filter: (p) => (p[0] * p[1]) % 2 === 0 }
];

function loadEventList() {
    eventSelectionList.innerHTML = "";
    const tg = state.treeGrid;
    const events = tg.game === "ball" ? treeBallEvents : treeDiceEvents;

    events.forEach(evt => {
        const card = document.createElement("div");
        card.className = `event-option-card ${tg.selectedEventId === evt.id ? 'active' : ''}`;
        card.innerHTML = `
            <span>${evt.text}</span>
            <i class="fa-solid fa-circle-check"></i>
        `;
        card.addEventListener("click", () => {
            playSynthSound(600, 0.05);
            tg.selectedEventId = evt.id;
            loadEventList();
            renderTreeGrid();
        });
        eventSelectionList.appendChild(card);
    });
}

function renderTreeGrid() {
    const tg = state.treeGrid;

    // 显示隐藏摸球/骰子特有设置面板
    treeBallConfigGroup.style.display = tg.game === "ball" ? "block" : "none";

    if (tg.viewType === "tree") {
        treeSvg.style.display = "block";
        gridTableContainer.style.display = "none";
        drawTreeDiagram();
    } else {
        treeSvg.style.display = "none";
        gridTableContainer.style.display = "block";
        drawGridTable();
    }
}

// 绘制树状图 (Tree Diagram Draw Engine)
function drawTreeDiagram() {
    treeDrawingLayer.innerHTML = "";
    const tg = state.treeGrid;

    if (tg.game === "ball") {
        // --- 摸球两步实验树状图 ---
        // 生成第 1 步的分支
        const totalStage1 = tg.bagRed + tg.bagBlue;
        const probRed1 = tg.bagRed / totalStage1;
        const probBlue1 = tg.bagBlue / totalStage1;

        // 起点 Node
        const root = { x: 50, y: 135 };
        
        // 树状图参数结构
        const paths = [];

        // 两个第一步分支
        // 红球分支 (y 向上偏)
        const nodeRed1 = { x: 210, y: 65, type: "红", probText: getReducedFractionText(tg.bagRed, totalStage1) };
        // 蓝球分支 (y 向下偏)
        const nodeBlue1 = { x: 210, y: 205, type: "蓝", probText: getReducedFractionText(tg.bagBlue, totalStage1) };

        // 第二步分支
        // 若第一步摸红
        let bagRedAfterRed = tg.replace ? tg.bagRed : tg.bagRed - 1;
        let bagBlueAfterRed = tg.bagBlue;
        let totalStage2_Red = bagRedAfterRed + bagBlueAfterRed;

        const nodeRedRed = { x: 410, y: 35, type: "红", parent: nodeRed1, probText: totalStage2_Red > 0 ? getReducedFractionText(bagRedAfterRed, totalStage2_Red) : "0" };
        const nodeRedBlue = { x: 410, y: 95, type: "蓝", parent: nodeRed1, probText: totalStage2_Red > 0 ? getReducedFractionText(bagBlueAfterRed, totalStage2_Red) : "0" };

        if (totalStage2_Red > 0) {
            paths.push({ steps: ["红", "红"], points: [root, nodeRed1, nodeRedRed] });
            paths.push({ steps: ["红", "蓝"], points: [root, nodeRed1, nodeRedBlue] });
        }

        // 若第一步摸蓝
        let bagRedAfterBlue = tg.bagRed;
        let bagBlueAfterBlue = tg.replace ? tg.bagBlue : tg.bagBlue - 1;
        let totalStage2_Blue = bagRedAfterBlue + bagBlueAfterBlue;

        const nodeBlueRed = { x: 410, y: 175, type: "红", parent: nodeBlue1, probText: totalStage2_Blue > 0 ? getReducedFractionText(bagRedAfterBlue, totalStage2_Blue) : "0" };
        const nodeBlueBlue = { x: 410, y: 235, type: "蓝", parent: nodeBlue1, probText: totalStage2_Blue > 0 ? getReducedFractionText(bagBlueAfterBlue, totalStage2_Blue) : "0" };

        if (totalStage2_Blue > 0) {
            paths.push({ steps: ["蓝", "红"], points: [root, nodeBlue1, nodeBlueRed] });
            paths.push({ steps: ["蓝", "蓝"], points: [root, nodeBlue1, nodeBlueBlue] });
        }

        // 检查筛选高亮
        const currentEventFilter = treeBallEvents[tg.selectedEventId].filter;
        let successCount = 0;

        paths.forEach(p => {
            p.isActive = currentEventFilter(p.steps);
            if (p.isActive) successCount++;
        });

        // 绘制连线
        paths.forEach(p => {
            const strokeColor = p.isActive ? "var(--color-green)" : "#cbd5e1";
            const strokeW = p.isActive ? 2.5 : 1.2;
            const filterAttr = p.isActive ? "url(#neon-glow)" : "";

            // 绘制两段折线
            treeDrawingLayer.appendChild(createSVGNode("line", {
                x1: p.points[0].x, y1: p.points[0].y, x2: p.points[1].x, y2: p.points[1].y,
                stroke: strokeColor, "stroke-width": strokeW, filter: filterAttr
            }));
            treeDrawingLayer.appendChild(createSVGNode("line", {
                x1: p.points[1].x, y1: p.points[1].y, x2: p.points[2].x, y2: p.points[2].y,
                stroke: strokeColor, "stroke-width": strokeW, filter: filterAttr
            }));

            // 绘制边上的概率标记
            const drawLabel = (n1, n2, label) => {
                if (label === "0") return;
                const midX = (n1.x + n2.x) / 2;
                const midY = (n1.y + n2.y) / 2 - 4;
                const text = createSVGNode("text", {
                    x: midX, y: midY, class: "tree-edge-label",
                    fill: p.isActive ? "var(--color-green)" : "var(--color-text-muted)"
                });
                text.textContent = label;
                treeDrawingLayer.appendChild(text);
            };
            drawLabel(p.points[0], p.points[1], p.points[1].probText);
            drawLabel(p.points[1], p.points[2], p.points[2].probText);

            // 增强动效：添加流动光斑粒子
            if (p.isActive) {
                const particle = createSVGNode("circle", {
                    r: 3.5,
                    fill: "var(--color-green)",
                    filter: "url(#neon-glow)"
                });
                const animMotion = createSVGNode("animateMotion", {
                    dur: "2.4s",
                    repeatCount: "indefinite",
                    path: `M ${p.points[0].x} ${p.points[0].y} L ${p.points[1].x} ${p.points[1].y} L ${p.points[2].x} ${p.points[2].y}`
                });
                particle.appendChild(animMotion);
                treeDrawingLayer.appendChild(particle);
            }
        });

        // 绘制根节点
        treeDrawingLayer.appendChild(createSVGNode("circle", {
            cx: root.x, cy: root.y, r: 8, fill: "var(--color-accent)"
        }));

        // 绘制阶段 1 节点
        const drawNode = (n) => {
            const fillCol = n.type === "红" ? "var(--color-red)" : "var(--color-blue)";
            treeDrawingLayer.appendChild(createSVGNode("circle", {
                cx: n.x, cy: n.y, r: 12, class: "tree-node-circle", stroke: fillCol
            }));
            const text = createSVGNode("text", {
                x: n.x, y: n.y, class: "tree-node-text", fill: fillCol
            });
            text.textContent = n.type;
            treeDrawingLayer.appendChild(text);
        };

        drawNode(nodeRed1);
        drawNode(nodeBlue1);
        
        if (totalStage2_Red > 0) {
            drawNode(nodeRedRed);
            drawNode(nodeRedBlue);
        }
        if (totalStage2_Blue > 0) {
            drawNode(nodeBlueRed);
            drawNode(nodeBlueBlue);
        }

        // 计算理论概率
        // 总可能路径概率求和
        let totalProbSum = 0;
        let successProbSum = 0;

        paths.forEach(p => {
            const fraction1 = p.points[1].probText.split("/");
            const fraction2 = p.points[2].probText.split("/");
            const val1 = parseInt(fraction1[0]) / parseInt(fraction1[1]);
            const val2 = parseInt(fraction2[0]) / (fraction2[1] ? parseInt(fraction2[1]) : 1);
            const pathProb = val1 * val2;

            totalProbSum += pathProb;
            if (p.isActive) successProbSum += pathProb;
        });

        const mNum = Math.round(successProbSum * 100);
        const nNum = Math.round(totalProbSum * 100);
        probabilityFormula.innerHTML = `P(事件A) = 概率值约为 ${getReducedFractionText(mNum, nNum)} ≈ ${(successProbSum).toFixed(3)}`;

    } else {
        // --- 骰子事件分支太繁杂，直接绘制缩略树以作演示，或直接建议使用列表法 ---
        // 绘制精简的骰子树状分叉（36个结果）
        // 根节点 -> 6个一阶段分支 -> 各自6个二阶段叶子
        const root = { x: 40, y: 135 };
        treeDrawingLayer.appendChild(createSVGNode("circle", { cx: root.x, cy: root.y, r: 6, fill: "#94a3b8" }));

        const filter = treeDiceEvents[tg.selectedEventId].filter;
        let successCount = 0;

        for (let i = 1; i <= 6; i++) {
            const y1 = 25 + (i - 1) * 44;
            const node1 = { x: 180, y: y1 };

            // 绘制一阶段连线
            treeDrawingLayer.appendChild(createSVGNode("line", {
                x1: root.x, y1: root.y, x2: node1.x, y2: node1.y,
                stroke: "#cbd5e1", "stroke-width": 1.0
            }));
            
            // 绘制一阶段圆圈
            treeDrawingLayer.appendChild(createSVGNode("circle", { cx: node1.x, cy: node1.y, r: 8, fill: "#ffffff", stroke: "var(--color-purple)", "stroke-width": 1.2 }));
            const text = createSVGNode("text", { x: node1.x, y: node1.y, class: "tree-node-text", fill: "var(--color-purple)", "font-size": "7px" });
            text.textContent = `${i}点`;
            treeDrawingLayer.appendChild(text);

            for (let j = 1; j <= 6; j++) {
                const y2 = y1 - 18 + (j - 1) * 7.2;
                const node2 = { x: 380, y: y2 };

                const isActive = filter([i, j]);
                if (isActive) successCount++;

                const strokeCol = isActive ? "var(--color-green)" : "#cbd5e1";
                const strokeW = isActive ? 1.5 : 0.6;

                // 绘制二阶段连线
                treeDrawingLayer.appendChild(createSVGNode("line", {
                    x1: node1.x, y1: node1.y, x2: node2.x, y2: node2.y,
                    stroke: strokeCol, "stroke-width": strokeW
                }));

                // 终点标记
                treeDrawingLayer.appendChild(createSVGNode("circle", {
                    cx: node2.x, cy: node2.y, r: isActive ? 2.5 : 1.2,
                    fill: isActive ? "var(--color-green)" : "var(--color-text-muted)"
                }));

                if (isActive) {
                    const outText = createSVGNode("text", {
                        x: node2.x + 8, y: node2.y + 2.5,
                        fill: "var(--color-green)", "font-size": "6px", "font-weight": "800"
                    });
                    outText.textContent = `(${i},${j})`;
                    treeDrawingLayer.appendChild(outText);

                    // 骰子路径上的小光斑粒子
                    const particle = createSVGNode("circle", {
                        r: 1.5,
                        fill: "var(--color-green)",
                        filter: "url(#neon-glow)"
                    });
                    const animMotion = createSVGNode("animateMotion", {
                        dur: "2.0s",
                        repeatCount: "indefinite",
                        path: `M ${root.x} ${root.y} L ${node1.x} ${node1.y} L ${node2.x} ${node2.y}`
                    });
                    particle.appendChild(animMotion);
                    treeDrawingLayer.appendChild(particle);
                }
            }
        }

        probabilityFormula.innerHTML = `P(事件A) = m / n = ${successCount} / 36 = ${getReducedFractionText(successCount, 36)}`;
    }
}

// 绘制列表法二维网格
function drawGridTable() {
    gridMethodTable.innerHTML = "";
    const tg = state.treeGrid;

    if (tg.game === "ball") {
        const totalItems = tg.bagRed + tg.bagBlue;
        const rowCount = totalItems;
        const colCount = totalItems;

        // 生成球的编号列表，如 ["红1", "红2", "蓝1", "蓝2"]
        const getBallsList = () => {
            const list = [];
            for (let i = 1; i <= tg.bagRed; i++) list.push(`红${i}`);
            for (let i = 1; i <= tg.bagBlue; i++) list.push(`蓝${i}`);
            return list;
        };
        const items = getBallsList();

        // 绘制表头行
        const trHeader = document.createElement("tr");
        trHeader.innerHTML = `<th>第2次 \\ 第1次</th>` + items.map(ball => `<th>${ball}</th>`).join("");
        gridMethodTable.appendChild(trHeader);

        // 列表筛选过滤器
        const currentEventFilter = treeBallEvents[tg.selectedEventId].filter;
        let successCount = 0;
        let totalCells = 0;

        for (let i = 0; i < rowCount; i++) {
            const tr = document.createElement("tr");
            // 首列
            tr.innerHTML = `<td class="header-cell">${items[i]}</td>`;

            for (let j = 0; j < colCount; j++) {
                const td = document.createElement("td");
                
                // 判断如果是无放回，且对角线 (i === j)
                if (!tg.replace && i === j) {
                    td.textContent = "× (不可摸出相同球)";
                    td.style.color = "#cbd5e1";
                    td.style.fontSize = "9px";
                } else {
                    totalCells++;
                    const val1 = items[j].slice(0, 1);
                    const val2 = items[i].slice(0, 1);
                    td.textContent = `(${items[j]}, ${items[i]})`;

                    const isActive = currentEventFilter([val1, val2]);
                    if (isActive) {
                        successCount++;
                        td.className = "active-highlight";
                    }
                }
                tr.appendChild(td);
            }
            gridMethodTable.appendChild(tr);
        }

        probabilityFormula.innerHTML = `P(事件A) = m / n = ${successCount} / ${totalCells} = ${getReducedFractionText(successCount, totalCells)}`;

    } else {
        // --- 掷骰子列表法（经典 6x6 网格） ---
        const trHeader = document.createElement("tr");
        trHeader.innerHTML = `<th>第2枚 \\ 第1枚</th>` + [1,2,3,4,5,6].map(v => `<th>${v} 点</th>`).join("");
        gridMethodTable.appendChild(trHeader);

        const currentEventFilter = treeDiceEvents[tg.selectedEventId].filter;
        let successCount = 0;

        for (let i = 1; i <= 6; i++) {
            const tr = document.createElement("tr");
            tr.innerHTML = `<td class="header-cell">${i} 点</td>`;

            for (let j = 1; j <= 6; j++) {
                const td = document.createElement("td");
                td.textContent = `(${j}, ${i})`;

                const isActive = currentEventFilter([j, i]);
                if (isActive) {
                    successCount++;
                    td.className = "active-highlight";
                }
                tr.appendChild(td);
            }
            gridMethodTable.appendChild(tr);
        }

        probabilityFormula.innerHTML = `P(事件A) = m / n = ${successCount} / 36 = ${getReducedFractionText(successCount, 36)}`;
    }
}

// --- 关卡 3: 统计图与集中趋势计算与联动 ---
function renderStatCharts() {
    const freqs = state.statCharts.freqs;

    // 更新滑块数值
    valFreq0.textContent = `${freqs[0]} 人`;
    valFreq1.textContent = `${freqs[1]} 人`;
    valFreq2.textContent = `${freqs[2]} 人`;
    valFreq3.textContent = `${freqs[3]} 人`;

    // 统计计算平均数、中位数、众数
    const midpoints = [65, 75, 85, 95];
    const totalN = freqs.reduce((a, b) => a + b, 0);

    if (totalN === 0) {
        valMean.textContent = "0.0";
        valMedian.textContent = "0.0";
        valMode.textContent = "0.0";
        drawHistogram([]);
        drawPieChart([]);
        return;
    }

    // 1. 平均数
    let sum = 0;
    for (let i = 0; i < 4; i++) {
        sum += freqs[i] * midpoints[i];
    }
    const mean = sum / totalN;
    valMean.textContent = mean.toFixed(1) + " 分";

    // 2. 中位数 (展开样本点后求取最中间元素)
    const samples = [];
    for (let i = 0; i < 4; i++) {
        for (let f = 0; f < freqs[i]; f++) {
            samples.push(midpoints[i]);
        }
    }
    samples.sort((a, b) => a - b);
    let median = 0;
    const midIdx = Math.floor(samples.length / 2);
    if (samples.length % 2 === 0) {
        median = (samples[midIdx - 1] + samples[midIdx]) / 2;
    } else {
        median = samples[midIdx];
    }
    valMedian.textContent = median.toFixed(1) + " 分";

    // 3. 众数 (频数最多的区间的组中值)
    let maxF = -1;
    let mode = 0;
    for (let i = 0; i < 4; i++) {
        if (freqs[i] > maxF) {
            maxF = freqs[i];
            mode = midpoints[i];
        }
    }
    valMode.textContent = mode.toFixed(1) + " 分";

    // 重新绘制频数分布直方图与饼图
    drawHistogram({ mean, median, mode });
    drawPieChart({ freqs, totalN });
}

// 绘制频数直方图
function drawHistogram({ mean, median, mode }) {
    histogramBars.innerHTML = "";
    histogramGrid.innerHTML = "";
    histogramCursors.innerHTML = "";

    const freqs = state.statCharts.freqs;
    const width = 320;
    const height = 190;
    const paddingLeft = 30;
    const paddingRight = 10;
    const paddingTop = 15;
    const paddingBottom = 25;

    const chartW = width - paddingLeft - paddingRight;
    const chartH = height - paddingTop - paddingBottom;

    // 找到频数上限以缩放高度
    const maxFreq = Math.max(10, ...freqs);

    // 绘制直方图网格线
    const gridCount = 4;
    for (let i = 0; i <= gridCount; i++) {
        const ratio = i / gridCount;
        const val = Math.round(maxFreq * ratio);
        const y = paddingTop + chartH * (1 - ratio);

        // 虚线网格
        histogramGrid.appendChild(createSVGNode("line", {
            x1: paddingLeft, y1: y, x2: width - paddingRight, y2: y,
            stroke: "rgba(203,213,225,0.4)", "stroke-width": 0.8, "stroke-dasharray": "2, 2"
        }));

        // 标签文字
        const label = createSVGNode("text", {
            x: paddingLeft - 6, y: y + 2.5,
            fill: "var(--color-text-muted)", "font-size": "8px", "text-anchor": "end"
        });
        label.textContent = val;
        histogramGrid.appendChild(label);
    }

    // 绘制四根矩形柱形 (对应区间 [60,70), [70,80), [80,90), [90,100])
    const barColors = ["#3b82f6", "#a855f7", "#10b981", "#f59e0b"];
    const barLabels = ["60-70", "70-80", "80-90", "90-100"];
    const barW = chartW / 4;

    const midpoints = [65, 75, 85, 95];
    const samplesList = [];
    let totalSamplesCount = 0;
    for (let i = 0; i < 4; i++) {
        for (let k = 0; k < freqs[i]; k++) {
            samplesList.push({
                id: totalSamplesCount++,
                intervalIdx: i,
                midpoint: midpoints[i],
                color: barColors[i]
            });
        }
    }

    const sc = state.statCharts;

    // 1. 绘制背景柱状低透明条
    for (let i = 0; i < 4; i++) {
        const barH = chartH * (freqs[i] / maxFreq);
        const x = paddingLeft + i * barW;
        const y = paddingTop + chartH - barH;

        histogramBars.appendChild(createSVGNode("rect", {
            x: x + 4, y: y, width: barW - 8, height: barH,
            class: "histo-bar",
            fill: barColors[i],
            stroke: "none",
            "fill-opacity": sc.medianAnimationActive ? 0.04 : 0.14
        }));

        // 柱头人数
        if (!sc.medianAnimationActive && freqs[i] > 0) {
            const text = createSVGNode("text", {
                x: x + barW / 2, y: y - 4, class: "histo-text",
                fill: "var(--color-text-muted)"
            });
            text.textContent = `${freqs[i]}人`;
            histogramBars.appendChild(text);
        }

        // 横轴标签
        const xLabel = createSVGNode("text", {
            x: x + barW / 2, y: height - 8, class: "histo-text",
            fill: "var(--color-text-muted)"
        });
        xLabel.textContent = barLabels[i];
        histogramBars.appendChild(xLabel);
    }

    // 2. 绘制小球 (样本散点堆叠 / 中位数一字排开)
    if (!sc.medianAnimationActive) {
        const colCounts = [0, 0, 0, 0];
        samplesList.forEach(sample => {
            const i = sample.intervalIdx;
            const count = colCounts[i]++;
            const cx = paddingLeft + i * barW + barW / 2;
            const cy = paddingTop + chartH - 6 - count * 10;

            histogramBars.appendChild(createSVGNode("circle", {
                cx: cx, cy: cy, r: 4,
                fill: sample.color,
                class: "sample-dot"
            }));
        });
    } else {
        const N = samplesList.length;
        const spacing = N > 1 ? (chartW * 0.8) / (N - 1) : 0;
        const startX = paddingLeft + chartW * 0.1;

        samplesList.forEach((sample, idx) => {
            const cx = startX + idx * spacing;
            const cy = paddingTop + chartH - 8;

            const isFaded = sc.fadedIndices.includes(idx);
            const isHighlight = sc.highlightIndices.includes(idx);

            let circleClass = "sample-dot";
            if (isFaded) circleClass += " faded";
            if (isHighlight) circleClass += " median-highlight";

            histogramBars.appendChild(createSVGNode("circle", {
                cx: cx, cy: cy, r: 4,
                fill: sample.color,
                class: circleClass
            }));

            // 显示对应的数值标签
            if (!isFaded) {
                const label = createSVGNode("text", {
                    x: cx, y: cy - 8, class: "histo-text",
                    fill: isHighlight ? "var(--color-purple)" : "var(--color-text-muted)",
                    "font-weight": isHighlight ? "800" : "600"
                });
                label.textContent = sample.midpoint;
                histogramBars.appendChild(label);
            }
        });
    }

    // 绘制横轴底实线
    histogramBars.appendChild(createSVGNode("line", {
        x1: paddingLeft, y1: paddingTop + chartH, x2: width - paddingRight, y2: paddingTop + chartH,
        stroke: "#94a3b8", "stroke-width": 1.2
    }));

    // 绘制平均数、中位数、众数的垂直指示游标
    const drawCursor = (val, color, offsetTextY, label) => {
        // val 处于 [60, 100] 区间内，比例映射
        const ratio = (val - 60) / 40;
        const x = paddingLeft + chartW * ratio;

        histogramCursors.appendChild(createSVGNode("line", {
            x1: x, y1: paddingTop - 5, x2: x, y2: paddingTop + chartH,
            class: "trend-cursor", stroke: color
        }));

        const text = createSVGNode("text", {
            x: x, y: paddingTop + offsetTextY, class: "trend-cursor-text",
            fill: color, "text-anchor": ratio > 0.85 ? "end" : "start",
            style: "text-shadow: 0 1px 3px rgba(255,255,255,0.8);"
        });
        text.textContent = `${label} ${val.toFixed(1)}`;
        histogramCursors.appendChild(text);
    };

    if (mean) drawCursor(mean, "var(--color-blue)", 8, "均");
    if (median) drawCursor(median, "var(--color-purple)", 24, "中");
    if (mode) drawCursor(mode, "var(--color-green)", 40, "众");
}

// 绘制饼图
function drawPieChart({ freqs, totalN }) {
    pieSlices.innerHTML = "";
    pieLegend.innerHTML = "";

    const barColors = ["#3b82f6", "#a855f7", "#10b981", "#f59e0b"];
    const labels = ["60-70分", "70-80分", "80-90分", "90-100分"];

    // 绘制饼图扇区 (SVG Arc)
    const cx = 100;
    const cy = 90;
    const r = 70;

    let accumulatedAngle = 0;

    for (let i = 0; i < 4; i++) {
        const ratio = totalN > 0 ? (freqs[i] / totalN) : 0;
        const angle = ratio * 360;

        if (ratio > 0) {
            // 计算弧线起点终点
            const startAngleRad = (accumulatedAngle - 90) * Math.PI / 180;
            const endAngleRad = (accumulatedAngle + angle - 90) * Math.PI / 180;

            const x1 = cx + r * Math.cos(startAngleRad);
            const y1 = cy + r * Math.sin(startAngleRad);
            const x2 = cx + r * Math.cos(endAngleRad);
            const y2 = cy + r * Math.sin(endAngleRad);

            const largeArcFlag = angle > 180 ? 1 : 0;

            // 特殊情况 100% 占比
            let dAttr = "";
            if (ratio === 1) {
                dAttr = `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`;
            } else {
                dAttr = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
            }

            const path = createSVGNode("path", {
                d: dAttr,
                fill: barColors[i],
                class: "pie-slice",
                opacity: 0.8
            });

            // 添加悬浮放大特效
            path.addEventListener("mouseenter", () => {
                path.setAttribute("opacity", 1.0);
                playSynthSound(700 + i*60, 0.04);
            });
            path.addEventListener("mouseleave", () => {
                path.setAttribute("opacity", 0.8);
            });

            pieSlices.appendChild(path);
        }

        accumulatedAngle += angle;

        // 加载图例 (Pie Legend)
        const percentText = (ratio * 100).toFixed(0) + "%";
        const legendItem = document.createElement("div");
        legendItem.className = "legend-item";
        legendItem.innerHTML = `
            <span class="legend-color" style="background: ${barColors[i]}"></span>
            <span>${labels[i]}: ${percentText}</span>
        `;
        pieLegend.appendChild(legendItem);
    }
}

// --- 模块五：绑定事件监听与触发配置 ---
function initEventBindings() {
    // 顶部 tab 切换
    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            playSynthSound(520, 0.05);
            switchTab(btn.getAttribute("data-tab"));
        });
    });

    examModeBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            activeExamMode = btn.getAttribute("data-mode") || "observe";
            examModeBtns.forEach(item => item.classList.toggle("active", item === btn));
            playSynthSound(560, 0.05);
            renderExamBoard();
        });
    });

    // 解析 HUD 提示卡展开折叠
    btnHudToggle.addEventListener("click", () => {
        playSynthSound(600, 0.06);
        hudCard.classList.toggle("collapsed");
    });

    // 关卡 1 事件绑定
    btnTypeCoin.addEventListener("click", () => {
        playSynthSound(440, 0.06);
        btnTypeCoin.classList.add("active");
        btnTypeBall.classList.remove("active");
        ballRatioSettings.style.display = "none";
        state.largeNumbers.type = "coin";
        clearLargeNumbersData();
    });

    btnTypeBall.addEventListener("click", () => {
        playSynthSound(440, 0.06);
        btnTypeCoin.classList.remove("active");
        btnTypeBall.classList.add("active");
        ballRatioSettings.style.display = "block";
        state.largeNumbers.type = "ball";
        clearLargeNumbersData();
    });

    sliderRedBalls.addEventListener("input", () => {
        state.largeNumbers.redBalls = parseInt(sliderRedBalls.value);
        valRedBalls.textContent = `${sliderRedBalls.value} 个`;
        clearLargeNumbersData();
    });

    sliderBlueBalls.addEventListener("input", () => {
        state.largeNumbers.blueBalls = parseInt(sliderBlueBalls.value);
        valBlueBalls.textContent = `${sliderBlueBalls.value} 个`;
        clearLargeNumbersData();
    });

    // 关卡 1 仿真操作按钮
    btnSim1.addEventListener("click", () => simulateTimes(1));
    btnSim10.addEventListener("click", () => simulateTimes(10));
    btnSim100.addEventListener("click", () => simulateTimes(100));
    btnSim1000.addEventListener("click", () => simulateTimes(1000));
    
    btnSimAuto.addEventListener("click", () => {
        const ln = state.largeNumbers;
        if (ln.autoTimerId) {
            stopAutoSim();
        } else {
            startAutoSim();
        }
    });

    btnSimClear.addEventListener("click", clearLargeNumbersData);

    // 关卡 2 视图切换 (树/表)
    btnViewTree.addEventListener("click", () => {
        playSynthSound(440, 0.05);
        btnViewTree.classList.add("active");
        btnViewGrid.classList.remove("active");
        state.treeGrid.viewType = "tree";
        renderTreeGrid();
    });

    btnViewGrid.addEventListener("click", () => {
        playSynthSound(440, 0.05);
        btnViewTree.classList.remove("active");
        btnViewGrid.classList.add("active");
        state.treeGrid.viewType = "grid";
        renderTreeGrid();
    });

    // 关卡 2 摸球/骰子切换
    btnGameBall.addEventListener("click", () => {
        playSynthSound(480, 0.06);
        btnGameBall.classList.add("active");
        btnGameDice.classList.remove("active");
        state.treeGrid.game = "ball";
        state.treeGrid.selectedEventId = 0;
        loadEventList();
        renderTreeGrid();
    });

    btnGameDice.addEventListener("click", () => {
        playSynthSound(480, 0.06);
        btnGameBall.classList.remove("active");
        btnGameDice.classList.add("active");
        state.treeGrid.game = "dice";
        state.treeGrid.selectedEventId = 0;
        loadEventList();
        renderTreeGrid();
    });

    sliderBagRed.addEventListener("input", () => {
        state.treeGrid.bagRed = parseInt(sliderBagRed.value);
        valBagRed.textContent = `${sliderBagRed.value} 个`;
        renderTreeGrid();
    });

    sliderBagBlue.addEventListener("input", () => {
        state.treeGrid.bagBlue = parseInt(sliderBagBlue.value);
        valBagBlue.textContent = `${sliderBagBlue.value} 个`;
        renderTreeGrid();
    });

    btnReplaceYes.addEventListener("click", () => {
        playSynthSound(440, 0.05);
        btnReplaceYes.classList.add("active");
        btnReplaceNo.classList.remove("active");
        state.treeGrid.replace = true;
        renderTreeGrid();
    });

    btnReplaceNo.addEventListener("click", () => {
        playSynthSound(440, 0.05);
        btnReplaceYes.classList.remove("active");
        btnReplaceNo.classList.add("active");
        state.treeGrid.replace = false;
        renderTreeGrid();
    });

    // 关卡 3 滑块绑定
    const bindStatSlider = (slider, idx, valDisplay) => {
        slider.addEventListener("input", () => {
            resetMedianAnimation();
            const freqs = state.statCharts.freqs;
            freqs[idx] = parseInt(slider.value);
            renderStatCharts();
        });
    };

    bindStatSlider(sliderFreq0, 0, valFreq0);
    bindStatSlider(sliderFreq1, 1, valFreq1);
    bindStatSlider(sliderFreq2, 2, valFreq2);
    bindStatSlider(sliderFreq3, 3, valFreq3);

    // 关卡 3 预设分布按钮
    btnStatPreset1.addEventListener("click", () => {
        resetMedianAnimation();
        playSynthSound(500, 0.06);
        state.statCharts.freqs = [5, 12, 8, 5];
        sliderFreq0.value = 5;
        sliderFreq1.value = 12;
        sliderFreq2.value = 8;
        sliderFreq3.value = 5;
        renderStatCharts();
    });

    btnStatPreset2.addEventListener("click", () => {
        resetMedianAnimation();
        playSynthSound(500, 0.06);
        state.statCharts.freqs = [2, 6, 12, 10];
        sliderFreq0.value = 2;
        sliderFreq1.value = 6;
        sliderFreq2.value = 12;
        sliderFreq3.value = 10;
        renderStatCharts();
    });

    // 绑定中位数卡片点击触发排序分割动画
    const medianCard = document.querySelector(".tendency-indicator.median-col");
    if (medianCard) {
        medianCard.style.cursor = "pointer";
        medianCard.addEventListener("click", () => {
            if (state.statCharts.medianAnimationActive) {
                resetMedianAnimation();
                renderStatCharts();
            } else {
                triggerMedianAnimation();
            }
        });
    }

    // 平均数和众数点击时重置动画
    const meanCard = document.querySelector(".tendency-indicator.mean-col");
    if (meanCard) {
        meanCard.addEventListener("click", () => {
            resetMedianAnimation();
            renderStatCharts();
        });
    }
    const modeCard = document.querySelector(".tendency-indicator.mode-col");
    if (modeCard) {
        modeCard.addEventListener("click", () => {
            resetMedianAnimation();
            renderStatCharts();
        });
    }
}

// --- 中位数动画逻辑辅助函数 ---
function triggerMedianAnimation() {
    const sc = state.statCharts;
    
    // 清除运行中的定时器
    sc.animationTimerIds.forEach(id => clearTimeout(id));
    sc.animationTimerIds = [];
    sc.fadedIndices = [];
    sc.highlightIndices = [];

    sc.medianAnimationActive = true;
    renderStatCharts();

    const N = sc.freqs.reduce((a, b) => a + b, 0);
    if (N === 0) return;

    // 样本一字排开定位后，开始从左右两端往中间剪切消隐
    let L = 0;
    let R = N - 1;

    const stepFade = () => {
        if (L < R) {
            sc.fadedIndices.push(L, R);
            L++;
            R--;
            renderStatCharts();
            playSynthSound(400 + L * 30, 0.04);
            
            const timerId = setTimeout(stepFade, 280);
            sc.animationTimerIds.push(timerId);
        } else {
            // 到达中位数节点
            if (L === R) {
                sc.highlightIndices.push(L);
            } else {
                sc.highlightIndices.push(R, L);
            }
            renderStatCharts();
            playSynthSound(880, 0.25, "triangle");
        }
    };

    const startTimerId = setTimeout(stepFade, 800);
    sc.animationTimerIds.push(startTimerId);
}

function resetMedianAnimation() {
    const sc = state.statCharts;
    sc.animationTimerIds.forEach(id => clearTimeout(id));
    sc.animationTimerIds = [];
    sc.medianAnimationActive = false;
    sc.fadedIndices = [];
    sc.highlightIndices = [];
}

// --- 初始化函数 ---
function init() {
    switchTab("large-numbers");
    loadEventList();
    initEventBindings();
}

// 页面加载触发
document.addEventListener("DOMContentLoaded", init);
