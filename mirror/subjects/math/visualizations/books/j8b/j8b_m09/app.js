/**
 * 数据集中趋势与波动分析实验室 - 交互引擎 (app.js)
 * 功能：处理数据拟合、力矩平衡、方差正方形投影、粒子爆炸特效与启发式任务判定
 */

// ==========================================================================
// 1. 全局状态初始化
// ==========================================================================
const canvas = document.getElementById("stat-canvas");
const ctx = canvas.getContext("2d");
const canvasContainer = document.getElementById("canvas-container");

// 粒子特效
const particlesCanvas = document.getElementById("particles-canvas");
const pCtx = particlesCanvas.getContext("2d");
let particles = [];
let animId = null;

// DOM 元素引用
const valMean = document.getElementById("val-mean");
const valMedian = document.getElementById("val-median");
const valMode = document.getElementById("val-mode");
const valRange = document.getElementById("val-range");
const valVariance = document.getElementById("val-variance");
const valStdDev = document.getElementById("val-stddev");
const dataCount = document.getElementById("data-count");
const dataBadgesContainer = document.getElementById("data-badges-container");

const btnClearAll = document.getElementById("btn-clear-all");
const btnAddRandom = document.getElementById("btn-add-random");
const btnShowHelp = document.getElementById("btn-show-help");
const btnCloseHelp = document.getElementById("btn-close-help");
const modalHelp = document.getElementById("modal-help");

const sandboxStatusCard = document.getElementById("sandbox-status-card");
const sandboxStatusText = document.getElementById("sandbox-status-text");

// 教学配置项
const chkShowSquares = document.getElementById("chk-show-squares");
const chkShowTorque = document.getElementById("chk-show-torque");
const chkLockPivot = document.getElementById("chk-lock-pivot");

let showSquares = true;
let showTorque = false;
let lockPivot = false;
let lockedPivotVal = 10.0;

// 悬浮公式详解相关
let hoveredMetric = null;

// 任务卡 DOM
const qCard1 = document.getElementById("quest-card-1");
const qCard2 = document.getElementById("quest-card-2");
const qCard3 = document.getElementById("quest-card-3");

// 初始数据状态 (10个默认点)
let dataPoints = [4.0, 6.0, 7.5, 9.0, 10.0, 10.0, 11.5, 13.0, 14.5, 16.0];
let activeDragIndex = -1;

// 动画相关
let isAnimating = false;
let targetPoints = [];
const tweenEase = 0.15;

// 预设数据配置
const PRESETS = {
    gather: [9.0, 9.5, 10.0, 10.0, 10.5, 11.0], // 聚集
    scatter: [2.0, 5.0, 8.0, 11.0, 14.0, 17.0, 20.0], // 均匀
    bimodal: [3.0, 3.0, 3.0, 17.0, 17.0, 17.0], // 双峰对立
    outlier: [5.0, 5.2, 5.5, 5.8, 6.0, 20.0] // 极端异常值
};

// 任务完成标记
let completedQuests = { 1: false, 2: false, 3: false };
let activeQuestId = 1;

// 画布渲染配置
let axisMin = 0;
let axisMax = 20;
let paddingLeft = 60;
let paddingRight = 60;
let axisY = 160; // 数轴在 Canvas 的 Y 坐标
let scaleX = 1;  // 值到像素的比例因子

// ==========================================================================
// 2. 统计计算核心 (Stats Computation)
// ==========================================================================
function calculateStats() {
    const n = dataPoints.length;
    if (n === 0) {
        return {
            mean: 0,
            median: 0,
            modes: [],
            range: 0,
            variance: 0,
            stdDev: 0
        };
    }

    // 1. 均值
    const sum = dataPoints.reduce((s, x) => s + x, 0);
    const mean = sum / n;

    // 排序后的拷贝
    const sorted = [...dataPoints].sort((a, b) => a - b);

    // 2. 中位数
    let median = 0;
    const mid = Math.floor(n / 2);
    if (n % 2 !== 0) {
        median = sorted[mid];
    } else {
        median = (sorted[mid - 1] + sorted[mid]) / 2;
    }

    // 3. 众数
    const freqs = {};
    let maxFreq = 0;
    dataPoints.forEach(x => {
        const val = parseFloat(x.toFixed(1)); // 按 1 位小数归类
        freqs[val] = (freqs[val] || 0) + 1;
        if (freqs[val] > maxFreq) {
            maxFreq = freqs[val];
        }
    });

    let modes = [];
    if (maxFreq > 1) {
        Object.keys(freqs).forEach(val => {
            if (freqs[val] === maxFreq) {
                modes.push(parseFloat(val));
            }
        });
    }

    // 4. 极差
    const min = sorted[0];
    const max = sorted[n - 1];
    const range = max - min;

    // 5. 方差
    const sqDiffSum = dataPoints.reduce((s, x) => s + Math.pow(x - mean, 2), 0);
    const variance = sqDiffSum / n;

    // 6. 标准差
    const stdDev = Math.sqrt(variance);

    return { mean, median, modes, range, variance, stdDev, sorted };
}

// 同步 UI 文字与指标
function updateUI(stats) {
    const { mean, median, modes, range, variance, stdDev, sorted } = stats;
    const n = dataPoints.length;

    dataCount.innerText = n;

    if (n === 0) {
        valMean.innerText = "—";
        valMedian.innerText = "—";
        valMode.innerText = "—";
        valRange.innerText = "—";
        valVariance.innerText = "—";
        valStdDev.innerText = "—";
        sandboxStatusCard.className = "sandbox-header neutral";
        sandboxStatusText.innerText = "⚠️ 空白沙盒：请双击或点击数轴以添加数据点！";
        renderBadges([]);
        return;
    }

    valMean.innerText = mean.toFixed(2);
    valMedian.innerText = median.toFixed(2);
    valRange.innerText = range.toFixed(1);
    valVariance.innerText = variance.toFixed(2);
    valStdDev.innerText = stdDev.toFixed(2);

    // 众数展示
    if (modes.length === 0) {
        valMode.innerText = "无";
    } else {
        valMode.innerText = modes.map(m => m.toFixed(1)).join(", ");
    }

    // 渲染明细徽章
    renderBadges(sorted);

    // 判定任务完成情况
    checkQuests(stats);

    // 更新天平状态提示
    updateSandboxStatus(stats);
}

// 渲染明细徽章
function renderBadges(sorted) {
    dataBadgesContainer.innerHTML = "";
    sorted.forEach((val, idx) => {
        const badge = document.createElement("div");
        badge.className = "data-badge";
        badge.innerHTML = `
            <span>${val.toFixed(1)}</span>
            <span class="btn-remove-badge" data-index="${idx}">×</span>
        `;
        badge.querySelector(".btn-remove-badge").addEventListener("click", (e) => {
            e.stopPropagation();
            const originalIndex = dataPoints.indexOf(val);
            if (originalIndex > -1) {
                dataPoints.splice(originalIndex, 1);
                playClickSound();
                drawSandbox();
            }
        });
        dataBadgesContainer.appendChild(badge);
    });
}

// 判定沙盒天平力矩平衡状态提示
function updateSandboxStatus(stats) {
    const { mean, variance } = stats;
    const pivotVal = lockPivot ? lockedPivotVal : mean;
    const netTorque = dataPoints.reduce((sum, x) => sum + (x - pivotVal), 0);

    if (lockPivot && Math.abs(netTorque) > 0.15) {
        sandboxStatusCard.className = "sandbox-header error";
        sandboxStatusText.innerText = `❌ 天平支点被锁定在 ${pivotVal.toFixed(1)} 处，合力矩 = ${netTorque.toFixed(2)} (杠杆倾斜失衡！)`;
    } else if (variance < 1.0) {
        sandboxStatusCard.className = "sandbox-header success";
        sandboxStatusText.innerText = `🟢 数据物理天平：极小离散度聚集平衡 (方差 S² = ${variance.toFixed(2)})`;
    } else if (variance > 35.0) {
        sandboxStatusCard.className = "sandbox-header success";
        sandboxStatusText.innerText = `🔴 数据物理天平：对立两端拉扯平衡 (方差 S² = ${variance.toFixed(2)})`;
    } else {
        sandboxStatusCard.className = "sandbox-header neutral";
        sandboxStatusText.innerText = `⚖️ 数据物理天平：数据重力完美平衡在均值 ${mean.toFixed(1)} 处`;
    }
}

// ==========================================================================
// 3. Canvas 物理作图引擎 (Canvas Graphics & Aesthetics)
// ==========================================================================
function getAxisX(val) {
    return paddingLeft + (val - axisMin) * scaleX;
}

function getValFromX(x) {
    const val = axisMin + (x - paddingLeft) / scaleX;
    return Math.min(axisMax, Math.max(axisMin, val));
}

// 计算垂直堆叠坐标，防止小球重叠
function computeBallLayout(sortedPoints) {
    const layout = [];
    const grouped = {};
    const interval = 0.25;

    sortedPoints.forEach((val) => {
        const key = Math.round(val / interval) * interval;
        grouped[key] = (grouped[key] || 0) + 1;
        const stackIndex = grouped[key] - 1;
        
        const px = getAxisX(val);
        const py = axisY - 14 - stackIndex * 19;

        layout.push({
            value: val,
            x: px,
            y: py,
            stackIndex: stackIndex,
            key: key
        });
    });
    return layout;
}

function drawSandbox() {
    const W = canvas.width / window.devicePixelRatio;
    const H = canvas.height / window.devicePixelRatio;

    ctx.clearRect(0, 0, W, H);
    scaleX = (W - paddingLeft - paddingRight) / (axisMax - axisMin);

    const stats = calculateStats();
    const { mean, median, modes, variance, stdDev, sorted } = stats;

    const pivotVal = lockPivot ? lockedPivotVal : mean;
    const pivotX = getAxisX(pivotVal);
    const netTorque = dataPoints.reduce((sum, x) => sum + (x - pivotVal), 0);

    // 绘制失衡应变警示红晕 (Stress Warning Aura)
    if (lockPivot && Math.abs(netTorque) > 0.15) {
        ctx.save();
        const severity = Math.min(0.25, Math.abs(netTorque) * 0.015);
        const grad = ctx.createLinearGradient(0, H, 0, H - 110);
        grad.addColorStop(0, `rgba(244, 63, 94, ${severity})`);
        grad.addColorStop(1, "rgba(244, 63, 94, 0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
    }

    // 物理倾斜角计算 (阻尼公式，限制最大旋转在 ±12度)
    const tiltAngle = lockPivot ? Math.max(-0.2, Math.min(0.2, netTorque * 0.015)) : 0;

    // 1. 绘制网格背景 (Grid Lines)
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.restore();

    // 2. 绘制静态 X 数轴刻度与数值 (底板刻度，保持水平不旋转)
    ctx.save();
    ctx.shadowBlur = 4;
    ctx.shadowColor = "#3b82f6";
    ctx.strokeStyle = "rgba(59, 130, 246, 0.45)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(paddingLeft - 10, axisY);
    ctx.lineTo(W - paddingRight + 10, axisY);
    ctx.stroke();
    ctx.shadowBlur = 0; // 重置以避免刻度发光重叠

    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "600 11px var(--font-sans)";
    ctx.textAlign = "center";
    for (let v = axisMin; v <= axisMax; v++) {
        const px = getAxisX(v);
        ctx.strokeStyle = v % 5 === 0 ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)";
        ctx.lineWidth = v % 5 === 0 ? 1.8 : 1.0;
        
        ctx.beginPath();
        ctx.moveTo(px, axisY);
        ctx.lineTo(px, axisY + (v % 5 === 0 ? 7 : 4));
        ctx.stroke();

        if (v % 2 === 0) {
            ctx.fillText(v, px, axisY + 20);
        }
    }
    ctx.restore();

    if (dataPoints.length === 0) {
        ctx.save();
        ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
        ctx.font = "italic 13px var(--font-sans)";
        ctx.textAlign = "center";
        ctx.fillText("双击数轴上方空白处可以快捷创建发光数据球 ⚪", W / 2, H / 2 - 10);
        ctx.restore();
        updateUI(stats);
        return;
    }

    // 3. 计算小球的理想堆叠布局
    const layout = computeBallLayout(sorted);

    // ==========================================================================
    // 旋转渲染块 (See-saw board, Data Beads, Stack Column)
    // 旋转中心在 (pivotX, axisY)
    // ==========================================================================
    ctx.save();
    ctx.translate(pivotX, axisY);
    ctx.rotate(tiltAngle);
    ctx.translate(-pivotX, -axisY);

    // 4. 绘制跷跷板平衡板 (See-saw Plank)
    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#eab308";
    ctx.strokeStyle = "rgba(234, 179, 8, 0.85)";
    ctx.lineWidth = 4.0;
    ctx.beginPath();
    ctx.moveTo(paddingLeft - 8, axisY - 2);
    ctx.lineTo(W - paddingRight + 8, axisY - 2);
    ctx.stroke();
    ctx.restore();

    // 5. 绘制中位数垂直切分虚线 (Median Line)
    const medX = getAxisX(median);
    ctx.strokeStyle = "rgba(168, 85, 247, 0.55)";
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(medX, 30);
    ctx.lineTo(medX, axisY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 6. 绘制众数底座高亮光晕 (Mode Column Halo)
    if (modes.length > 0) {
        modes.forEach(mv => {
            const mX = getAxisX(mv);
            const maxStack = layout.filter(b => b.key === mv).reduce((max, b) => Math.max(max, b.stackIndex), 0);
            const columnHeight = 20 + maxStack * 19;

            ctx.save();
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#06b6d4";
            ctx.strokeStyle = "rgba(6, 182, 212, 0.25)";
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(mX, axisY - 4);
            ctx.lineTo(mX, axisY - columnHeight);
            ctx.stroke();
            ctx.restore();
        });
    }

    // 7. 绘制数据小球 (Data Beads)
    layout.forEach((b) => {
        const origIndex = dataPoints.indexOf(b.value);
        const isDragging = (origIndex === activeDragIndex);

        const isMedianValue = (b.value === median || (sorted.length % 2 === 0 && Math.abs(b.value - median) < 0.05));
        const isModeValue = modes.includes(parseFloat(b.value.toFixed(1)));

        let color = "#3b82f6";
        if (isModeValue) color = "#06b6d4";
        if (isMedianValue) color = "#a855f7";

        const ballRad = isDragging ? 8.5 : 6.8;

        ctx.save();
        // 外发光圈
        ctx.shadowBlur = isDragging ? 15 : 6;
        ctx.shadowColor = color;
        ctx.fillStyle = color + "40";
        ctx.beginPath();
        ctx.arc(b.x, b.y, ballRad + 3.5, 0, Math.PI * 2);
        ctx.fill();

        // 内芯高亮
        ctx.shadowBlur = isDragging ? 10 : 3;
        ctx.shadowColor = "#ffffff";
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#080c14";
        ctx.lineWidth = isDragging ? 2.5 : 1.8;
        ctx.beginPath();
        ctx.arc(b.x, b.y, ballRad, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 标签数值
        const isTop = (b.stackIndex === layout.filter(other => other.key === b.key).reduce((max, other) => Math.max(max, other.stackIndex), 0));
        if (isDragging || isTop) {
            ctx.fillStyle = isDragging ? "#ffffff" : "rgba(255,255,255,0.7)";
            ctx.font = isDragging ? "bold 11px var(--font-sans)" : "600 9.5px var(--font-sans)";
            ctx.fillText(b.value.toFixed(1), b.x, b.y - 12);
        }
        ctx.restore();
    });

    // 8. 教学优化：杠杆力矩拉力向量绘制 (Torque Force Arrows)
    if (showTorque) {
        layout.forEach(b => {
            const arm = b.value - pivotVal; // 力臂长度
            if (Math.abs(arm) < 0.15) return;

            ctx.save();
            ctx.strokeStyle = arm > 0 ? "rgba(6, 182, 212, 0.6)" : "rgba(234, 179, 8, 0.6)";
            ctx.fillStyle = arm > 0 ? "rgba(6, 182, 212, 0.8)" : "rgba(234, 179, 8, 0.8)";
            ctx.lineWidth = 1.5;

            // 力矩箭头绘制 (垂直向下，长度与力臂绝对值成正比)
            const forceLen = Math.min(45, 12 + Math.abs(arm) * 3);
            const startY = b.y + 8;
            const endY = startY + forceLen;

            // 绘制虚线臂与下垂直箭头
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.moveTo(b.x, startY);
            ctx.lineTo(b.x, endY);
            ctx.stroke();
            ctx.setLineDash([]);

            // 箭头帽
            ctx.beginPath();
            ctx.moveTo(b.x, endY);
            ctx.lineTo(b.x - 3.5, endY - 6);
            ctx.lineTo(b.x + 3.5, endY - 6);
            ctx.closePath();
            ctx.fill();

            // 标注离差力臂
            ctx.font = "bold 9px var(--font-sans)";
            ctx.fillText(`${arm > 0 ? "+" : ""}${arm.toFixed(1)}`, b.x, endY + 10);
            ctx.restore();
        });
    }

    ctx.restore(); // 跷跷板系统旋转绘制结束

    // 9. 绘制方差正方形投影 (方差区域保持水平，便于正方形排列)
    if (showSquares) {
        const squareBaseY = axisY + 38;
        ctx.save();
        layout.forEach(b => {
            const diff = b.value - mean;
            const diffPx = diff * scaleX;
            const sideLen = Math.abs(diffPx);
            if (sideLen < 0.5) return;

            const startX = diffPx > 0 ? getAxisX(mean) : getAxisX(b.value);

            ctx.strokeStyle = "rgba(244, 63, 94, 0.15)";
            ctx.lineWidth = 1.0;
            ctx.setLineDash([2, 3]);
            ctx.beginPath();
            ctx.moveTo(b.x, b.y + 12);
            ctx.lineTo(b.x, squareBaseY);
            ctx.stroke();

            ctx.setLineDash([]);
            ctx.fillStyle = `rgba(244, 63, 94, ${Math.min(0.15, 0.02 + (sideLen / W) * 0.2)})`;
            ctx.strokeStyle = "rgba(244, 63, 94, 0.35)";
            ctx.lineWidth = 1.2;
            
            ctx.beginPath();
            ctx.rect(startX, squareBaseY, sideLen, sideLen);
            ctx.fill();
            ctx.stroke();

            // 绘制方差正方形全息拐角对准直角 (Corner Ticks)
            ctx.strokeStyle = "rgba(244, 63, 94, 0.6)";
            ctx.lineWidth = 1.2;
            const tick = Math.min(8, sideLen / 3);
            if (tick > 1.5) {
                // Top-left
                ctx.beginPath(); ctx.moveTo(startX + tick, squareBaseY); ctx.lineTo(startX, squareBaseY); ctx.lineTo(startX, squareBaseY + tick); ctx.stroke();
                // Top-right
                ctx.beginPath(); ctx.moveTo(startX + sideLen - tick, squareBaseY); ctx.lineTo(startX + sideLen, squareBaseY); ctx.lineTo(startX + sideLen, squareBaseY + tick); ctx.stroke();
                // Bottom-left
                ctx.beginPath(); ctx.moveTo(startX, squareBaseY + sideLen - tick); ctx.lineTo(startX, squareBaseY + sideLen); ctx.lineTo(startX + tick, squareBaseY + sideLen); ctx.stroke();
                // Bottom-right
                ctx.beginPath(); ctx.moveTo(startX + sideLen - tick, squareBaseY + sideLen); ctx.lineTo(startX + sideLen, squareBaseY + sideLen); ctx.lineTo(startX + sideLen, squareBaseY + sideLen - tick); ctx.stroke();
            }

            // 绘制方差正方形内全息斜细纹 (Hologram Hatch Lines)
            if (sideLen > 10) {
                ctx.strokeStyle = "rgba(244, 63, 94, 0.05)";
                ctx.lineWidth = 1.0;
                ctx.beginPath();
                for (let offset = 8; offset < sideLen; offset += 10) {
                    ctx.moveTo(startX + offset, squareBaseY);
                    ctx.lineTo(startX, squareBaseY + offset);
                    ctx.moveTo(startX + sideLen, squareBaseY + offset);
                    ctx.lineTo(startX + offset, squareBaseY + sideLen);
                }
                ctx.stroke();
            }

            ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
            ctx.beginPath();
            ctx.moveTo(getAxisX(mean), squareBaseY);
            ctx.lineTo(getAxisX(b.value), squareBaseY);
            ctx.stroke();
        });
        ctx.restore();
    }

    // 10. 绘制静态天平底座支点 (Mean Balance Pivot)
    ctx.save();
    // 支点位置
    ctx.strokeStyle = lockPivot ? "rgba(244, 63, 94, 0.85)" : "rgba(234, 179, 8, 0.8)";
    ctx.fillStyle = lockPivot ? "rgba(244, 63, 94, 0.9)" : "rgba(234, 179, 8, 0.9)";
    ctx.shadowBlur = 10;
    ctx.shadowColor = lockPivot ? "#f43f5e" : "#eab308";
    ctx.lineWidth = 2.0;

    ctx.beginPath();
    ctx.moveTo(pivotX, axisY);
    ctx.lineTo(pivotX - 10, axisY + 12);
    ctx.lineTo(pivotX + 10, axisY + 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 支架小天平轴
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(pivotX - 16, axisY);
    ctx.lineTo(pivotX + 16, axisY);
    ctx.stroke();

    // 下方标签文字
    ctx.fillStyle = lockPivot ? "#f43f5e" : "#eab308";
    ctx.font = "bold 11px var(--font-sans)";
    ctx.shadowBlur = 0;
    ctx.textAlign = "center";
    if (lockPivot) {
        ctx.fillText(`🔒 锁定支点: ${pivotVal.toFixed(1)}`, pivotX, axisY + 26);
    } else {
        ctx.fillText("均值支点重心 x̄", pivotX, axisY + 26);
    }
    ctx.restore();

    // 11. 绘制中位数顶部水晶定位针 (Crystal Diamond Pin)
    ctx.save();
    ctx.fillStyle = "#a855f7";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#a855f7";
    ctx.beginPath();
    ctx.moveTo(medX, 22);
    ctx.lineTo(medX - 5, 28);
    ctx.lineTo(medX, 34);
    ctx.lineTo(medX + 5, 28);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 绘制小标牌
    ctx.fillStyle = "#a855f7";
    ctx.font = "bold 9.5px var(--font-sans)";
    ctx.textAlign = "center";
    ctx.shadowBlur = 4;
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.fillText(`Me = ${median.toFixed(1)}`, medX, 14);
    ctx.restore();

    // 12. 右上角绘制“标准差发光正方形”
    ctx.save();
    const cornerSquareArea = variance; 
    const cornerSide = stdDev;
    const pixelSide = cornerSide * 8;
    const cornerX = W - 140;
    const cornerY = 25;

    ctx.strokeStyle = "rgba(244, 63, 94, 0.45)";
    ctx.fillStyle = "rgba(244, 63, 94, 0.05)";
    ctx.shadowBlur = 8;
    ctx.shadowColor = "rgba(244, 63, 94, 0.5)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.rect(cornerX, cornerY, pixelSide, pixelSide);
    ctx.fill();
    ctx.stroke();

    // 绘制角落小全息投影圆点 (Corner beads)
    ctx.fillStyle = "#ffffff";
    ctx.shadowBlur = 4;
    ctx.shadowColor = "#ffffff";
    const drawCornerBead = (cx, cy) => {
        ctx.beginPath(); ctx.arc(cx, cy, 1.8, 0, Math.PI * 2); ctx.fill();
    };
    drawCornerBead(cornerX, cornerY);
    drawCornerBead(cornerX + pixelSide, cornerY);
    drawCornerBead(cornerX, cornerY + pixelSide);
    drawCornerBead(cornerX + pixelSide, cornerY + pixelSide);
    ctx.shadowBlur = 0;

    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.font = "700 9px var(--font-sans)";
    ctx.fillText("边长=标准差 S", cornerX + pixelSide / 2, cornerY - 6);
    
    ctx.save();
    ctx.translate(cornerX - 6, cornerY + pixelSide / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`S = ${stdDev.toFixed(2)}`, 0, 0);
    ctx.restore();

    ctx.fillStyle = "rgba(244, 63, 94, 0.85)";
    ctx.font = "bold 9.5px var(--font-sans)";
    ctx.fillText(`方差面积 S² = ${variance.toFixed(2)}`, cornerX + pixelSide / 2, cornerY + pixelSide / 2 + 3);
    ctx.restore();

    // 13. 绘制力矩合力提示文本 (力矩模式)
    if (showTorque) {
        ctx.save();
        const leftTorque = dataPoints.filter(x => x < pivotVal).reduce((sum, x) => sum + (x - pivotVal), 0);
        const rightTorque = dataPoints.filter(x => x >= pivotVal).reduce((sum, x) => sum + (x - pivotVal), 0);
        const balErr = leftTorque + rightTorque;
        
        ctx.textAlign = "center";
        ctx.fillStyle = Math.abs(balErr) < 0.15 ? "#10b981" : "#f43f5e";
        ctx.font = "bold 11px var(--font-sans)";
        ctx.fillText(`左侧负力矩和: ${leftTorque.toFixed(1)} | 右侧正力矩和: +${rightTorque.toFixed(1)}`, W / 2, H - 26);
        ctx.fillText(`合力矩之和: ${balErr.toFixed(2)} ${Math.abs(balErr) < 0.15 ? "(完美平衡)" : "(不平衡)"}`, W / 2, H - 12);
        ctx.restore();
    }

    // 14. 教学优化：绘制计算步骤详解悬浮窗 (Formula Step-by-Step Overlay)
    if (hoveredMetric) {
        drawFormulaOverlay(W, H, stats);
    }

    // 同步刷新 UI 指标
    updateUI(stats);
}

// 绘制公式折射详解卡
function drawFormulaOverlay(W, H, stats) {
    const { mean, median, modes, range, variance, stdDev, sorted } = stats;
    const n = dataPoints.length;
    if (n === 0) return;

    ctx.save();
    ctx.fillStyle = "rgba(11, 15, 25, 0.92)";
    ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    
    const ox = 25;
    const oy = 25;
    const boxW = 340;
    const boxH = 145;
    
    ctx.beginPath();
    ctx.roundRect(ox, oy, boxW, boxH, 12);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.textAlign = "left";
    
    if (hoveredMetric === "mean") {
        ctx.fillStyle = "#eab308";
        ctx.font = "bold 13px var(--font-sans)";
        ctx.fillText("均值计算步骤 (Mean Breakdown)", ox + 15, oy + 24);
        
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "11px var(--font-math)";
        ctx.fillText("公式: x̄ = (x₁ + x₂ + ... + xₙ) / n", ox + 15, oy + 44);

        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.font = "11.5px var(--font-math)";
        const sumStr = sorted.map(x => x.toFixed(1)).join(" + ");
        const sumVal = sorted.reduce((a,b)=>a+b, 0);
        
        const dispSumStr = sumStr.length > 36 ? sumStr.substring(0, 33) + "..." : sumStr;
        ctx.fillText(`求和: ${dispSumStr} = ${sumVal.toFixed(1)}`, ox + 15, oy + 70);
        ctx.fillText(`点数: n = ${n}`, ox + 15, oy + 92);
        ctx.fillStyle = "#eab308";
        ctx.font = "bold 13.5px var(--font-math)";
        ctx.fillText(`结果: x̄ = ${sumVal.toFixed(1)} / ${n} = ${mean.toFixed(2)}`, ox + 15, oy + 120);
    }
    else if (hoveredMetric === "median") {
        ctx.fillStyle = "#a855f7";
        ctx.font = "bold 13px var(--font-sans)";
        ctx.fillText("中位数计算步骤 (Median Breakdown)", ox + 15, oy + 24);

        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "11px var(--font-sans)";
        ctx.fillText("步骤: 先将数据从小到大排序，找最中间的值", ox + 15, oy + 44);

        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.font = "11px var(--font-math)";
        let sortedStr = "";
        const midIdx = Math.floor(n / 2);
        if (n % 2 !== 0) {
            sortedStr = sorted.map((x, i) => i === midIdx ? `[${x.toFixed(1)}]` : x.toFixed(1)).join(", ");
        } else {
            sortedStr = sorted.map((x, i) => (i === midIdx || i === midIdx - 1) ? `[${x.toFixed(1)}]` : x.toFixed(1)).join(", ");
        }
        const dispSortedStr = sortedStr.length > 36 ? sortedStr.substring(0, 33) + "..." : sortedStr;
        ctx.fillText(`排序: ${dispSortedStr}`, ox + 15, oy + 70);
        ctx.fillText(`项数: n = ${n} (${n % 2 === 0 ? "偶数" : "奇数"})`, ox + 15, oy + 92);
        
        ctx.fillStyle = "#a855f7";
        ctx.font = "bold 13px var(--font-math)";
        if (n % 2 !== 0) {
            ctx.fillText(`结果: 中位数 Mₑ = ${median.toFixed(2)} (取中间第 ${midIdx + 1} 项)`, ox + 15, oy + 120);
        } else {
            const val1 = sorted[midIdx - 1];
            const val2 = sorted[midIdx];
            ctx.fillText(`结果: Mₑ = (${val1.toFixed(1)} + ${val2.toFixed(1)}) / 2 = ${median.toFixed(2)}`, ox + 15, oy + 120);
        }
    }
    else if (hoveredMetric === "mode") {
        ctx.fillStyle = "#06b6d4";
        ctx.font = "bold 13px var(--font-sans)";
        ctx.fillText("众数计算步骤 (Mode Breakdown)", ox + 15, oy + 24);

        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "11px var(--font-sans)";
        ctx.fillText("步骤: 统计各数值出现频数，找出最高频数值", ox + 15, oy + 44);

        const freqs = {};
        dataPoints.forEach(x => {
            const val = parseFloat(x.toFixed(1));
            freqs[val] = (freqs[val] || 0) + 1;
        });
        const maxFreq = Math.max(...Object.values(freqs));

        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.font = "11.5px var(--font-sans)";
        if (maxFreq <= 1) {
            ctx.fillText("统计: 所有数值出现频数均为 1", ox + 15, oy + 72);
            ctx.fillStyle = "#06b6d4";
            ctx.font = "bold 13.5px var(--font-sans)";
            ctx.fillText("结果: 无众数", ox + 15, oy + 115);
        } else {
            ctx.fillText(`最高频数: ${maxFreq} 次`, ox + 15, oy + 72);
            const modesStr = modes.map(m => m.toFixed(1)).join(", ");
            ctx.fillText(`对应数值: ${modesStr}`, ox + 15, oy + 94);
            ctx.fillStyle = "#06b6d4";
            ctx.font = "bold 13.5px var(--font-sans)";
            ctx.fillText(`结果: 众数 Mₒ = ${modesStr}`, ox + 15, oy + 120);
        }
    }
    else if (hoveredMetric === "variance") {
        ctx.fillStyle = "#f43f5e";
        ctx.font = "bold 13px var(--font-sans)";
        ctx.fillText("方差计算步骤 (Variance Breakdown)", ox + 15, oy + 24);

        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "11px var(--font-math)";
        ctx.fillText("公式: S² = [Σ(xᵢ - x̄)²] / n", ox + 15, oy + 44);

        const sqDiffSum = dataPoints.reduce((s, x) => s + Math.pow(x - mean, 2), 0);
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.font = "11px var(--font-math)";
        ctx.fillText(`离差平方和 ∑(xᵢ-x̄)² = ${sqDiffSum.toFixed(2)}`, ox + 15, oy + 72);
        ctx.fillText(`样本点数 n = ${n}`, ox + 15, oy + 94);
        
        ctx.fillStyle = "#f43f5e";
        ctx.font = "bold 13.5px var(--font-math)";
        ctx.fillText(`结果: S² = ${sqDiffSum.toFixed(2)} / ${n} = ${variance.toFixed(2)}`, ox + 15, oy + 120);
    }
    else if (hoveredMetric === "stddev") {
        ctx.fillStyle = "#f43f5e";
        ctx.font = "bold 13px var(--font-sans)";
        ctx.fillText("标准差计算步骤 (Std Dev Breakdown)", ox + 15, oy + 24);

        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "11px var(--font-math)";
        ctx.fillText("公式: S = √S² (方差开平方根)", ox + 15, oy + 44);

        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.font = "12px var(--font-math)";
        ctx.fillText(`已计算方差 S² = ${variance.toFixed(2)}`, ox + 15, oy + 75);
        ctx.fillStyle = "#f43f5e";
        ctx.font = "bold 14px var(--font-math)";
        ctx.fillText(`结果: S = √${variance.toFixed(2)} ≈ ${stdDev.toFixed(2)}`, ox + 15, oy + 115);
    }
    else if (hoveredMetric === "range") {
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.font = "bold 13px var(--font-sans)";
        ctx.fillText("极差计算步骤 (Range Breakdown)", ox + 15, oy + 24);

        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "11px var(--font-math)";
        ctx.fillText("公式: R = 最大值 - 最小值", ox + 15, oy + 44);

        const minVal = Math.min(...dataPoints);
        const maxVal = Math.max(...dataPoints);

        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.font = "12px var(--font-math)";
        ctx.fillText(`最大值 Max = ${maxVal.toFixed(1)}`, ox + 15, oy + 72);
        ctx.fillText(`最小值 Min = ${minVal.toFixed(1)}`, ox + 15, oy + 94);
        ctx.fillStyle = "#3b82f6";
        ctx.font = "bold 13.5px var(--font-math)";
        ctx.fillText(`结果: R = ${maxVal.toFixed(1)} - ${minVal.toFixed(1)} = ${range.toFixed(1)}`, ox + 15, oy + 120);
    }

    ctx.restore();
}

// ==========================================================================
// 4. 三维插值变动动画 (Tween Morphing)
// ==========================================================================
function updateTweenAnimation() {
    if (!isAnimating) return;

    let allDone = true;
    
    if (dataPoints.length < targetPoints.length) {
        while (dataPoints.length < targetPoints.length) {
            dataPoints.push(10.0);
        }
    } else if (dataPoints.length > targetPoints.length) {
        dataPoints.splice(targetPoints.length);
    }

    const sortedCurrent = [...dataPoints].sort((a, b) => a - b);
    const sortedTarget = [...targetPoints].sort((a, b) => a - b);

    for (let i = 0; i < sortedTarget.length; i++) {
        const diff = sortedTarget[i] - sortedCurrent[i];
        if (Math.abs(diff) > 0.05) {
            sortedCurrent[i] += diff * tweenEase;
            allDone = false;
        } else {
            sortedCurrent[i] = sortedTarget[i];
        }
    }

    dataPoints = [...sortedCurrent];

    drawSandbox();

    if (allDone) {
        isAnimating = false;
    } else {
        requestAnimationFrame(updateTweenAnimation);
    }
}

function startMorphToPreset(presetArray) {
    targetPoints = [...presetArray];
    if (!isAnimating) {
        isAnimating = true;
        updateTweenAnimation();
    }
}

// ==========================================================================
// 5. 手动拖拽交互与双击加点系统 (Interaction Events)
// ==========================================================================
function initCanvasEvents() {
    // 旋转坐标反算 hit-test 算法
    const getRotatedClickCoord = (mx, my) => {
        const stats = calculateStats();
        const pivotVal = lockPivot ? lockedPivotVal : stats.mean;
        const pivotX = getAxisX(pivotVal);
        const netTorque = dataPoints.reduce((sum, x) => sum + (x - pivotVal), 0);
        const tiltAngle = lockPivot ? Math.max(-0.2, Math.min(0.2, netTorque * 0.015)) : 0;

        const rx = mx - pivotX;
        const ry = my - axisY;
        
        // 旋转 -tiltAngle
        const rotX = rx * Math.cos(-tiltAngle) - ry * Math.sin(-tiltAngle) + pivotX;
        const rotY = rx * Math.sin(-tiltAngle) + ry * Math.cos(-tiltAngle) + axisY;

        return { rotX, rotY, pivotX };
    };

    const findHitBallIndex = (rotX, rotY) => {
        const stats = calculateStats();
        const layout = computeBallLayout(stats.sorted);

        for (let i = layout.length - 1; i >= 0; i--) {
            const b = layout[i];
            const dist = Math.hypot(rotX - b.x, rotY - b.y);
            if (dist < 12) {
                return dataPoints.indexOf(b.value);
            }
        }
        return -1;
    };

    const handlePointerDown = (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // 1. 先检测是否点中锁定支点 (Pivot Base Trigger)
        const stats = calculateStats();
        const pivotVal = lockPivot ? lockedPivotVal : stats.mean;
        const pivotX = getAxisX(pivotVal);
        const hitPivot = Math.abs(mx - pivotX) < 18 && my >= axisY && my <= axisY + 28;

        if (hitPivot && lockPivot) {
            activeDragIndex = -99; // 锁定支点拖拽代号
            canvas.setPointerCapture(e.pointerId);
            playClickSound();
            return;
        }

        // 2. 检测小球
        const { rotX, rotY } = getRotatedClickCoord(mx, my);
        const hitIndex = findHitBallIndex(rotX, rotY);
        if (hitIndex > -1) {
            activeDragIndex = hitIndex;
            canvas.setPointerCapture(e.pointerId);
            playClickSound();
        }
    };

    const handlePointerMove = (e) => {
        if (activeDragIndex === -1) return;

        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // A. 处理支点拖拽
        if (activeDragIndex === -99) {
            const val = getValFromX(mx);
            lockedPivotVal = Math.round(val * 10) / 10;
            drawSandbox();
            return;
        }

        // B. 处理数据小球拖拽
        const dy = Math.abs(my - axisY);
        if (dy > 120) {
            sandboxStatusCard.className = "sandbox-header error";
            sandboxStatusText.innerText = "❌ 释放鼠标即可删除此数据球！";
        } else {
            const stats = calculateStats();
            updateSandboxStatus(stats);
        }

        // 使用旋转校正坐标进行拖拽
        const stats = calculateStats();
        const pivotVal = lockPivot ? lockedPivotVal : stats.mean;
        const pivotX = getAxisX(pivotVal);
        const netTorque = dataPoints.reduce((sum, x) => sum + (x - pivotVal), 0);
        const tiltAngle = lockPivot ? Math.max(-0.2, Math.min(0.2, netTorque * 0.015)) : 0;

        const rx = mx - pivotX;
        const ry = my - axisY;
        const rotX = rx * Math.cos(-tiltAngle) - ry * Math.sin(-tiltAngle) + pivotX;

        const val = getValFromX(rotX);
        dataPoints[activeDragIndex] = Math.round(val * 10) / 10;
        drawSandbox();
    };

    const handlePointerUp = (e) => {
        if (activeDragIndex > -1) {
            const rect = canvas.getBoundingClientRect();
            const my = e.clientY - rect.top;
            const dy = Math.abs(my - axisY);

            if (activeDragIndex !== -99 && dy > 120) {
                // 从数据集中删除
                dataPoints.splice(activeDragIndex, 1);
                playDeleteSound();
                triggerSuccessSparks(e.clientX - rect.left, my, "#f43f5e");
            }
            canvas.releasePointerCapture(e.pointerId);
            activeDragIndex = -1;
            drawSandbox();
        }
    };

    // 双击加点
    const handleDblClick = (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        if (Math.abs(my - axisY) < 60) {
            const { rotX } = getRotatedClickCoord(mx, my);
            const val = getValFromX(rotX);
            const roundedVal = Math.round(val * 10) / 10;
            
            if (dataPoints.length < 20) {
                dataPoints.push(roundedVal);
                playClickSound();
                triggerSuccessSparks(mx, my, "#3b82f6");
                drawSandbox();
            } else {
                alert("已达到数据沙盒上限 (最多 20 个数据球)！");
            }
        }
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("dblclick", handleDblClick);
}

// ==========================================================================
// 6. 启发式任务卡核对逻辑 (Quest Verification)
// ==========================================================================
function checkQuests(stats) {
    const { mean, variance } = stats;
    const n = dataPoints.length;

    if (n >= 6 && variance <= 0.8) {
        if (!completedQuests[1]) {
            completedQuests[1] = true;
            markQuestCompleted(1);
        }
    }

    if (n >= 6 && Math.abs(mean - 10.0) <= 0.35 && variance >= 35.0) {
        if (!completedQuests[2]) {
            completedQuests[2] = true;
            markQuestCompleted(2);
        }
    }

    const inRange = dataPoints.filter(x => x >= 4.0 && x <= 6.5).length;
    const isOutlier = dataPoints.filter(x => x >= 19.0).length;
    if (n === 6 && inRange === 5 && isOutlier === 1) {
        if (!completedQuests[3]) {
            completedQuests[3] = true;
            markQuestCompleted(3);
        }
    }
}

function markQuestCompleted(id) {
    const card = document.getElementById(`quest-card-${id}`);
    if (card) {
        card.classList.add("completed");
        card.classList.remove("active-quest");
        const badge = card.querySelector(".quest-status-badge");
        if (badge) badge.innerHTML = "🏆 已完成";

        const rect = canvas.getBoundingClientRect();
        const px = rect.left + rect.width / 2;
        const py = rect.top + rect.height / 2;
        triggerSuccessSparks(px, py, "#10b981");
        playSuccessChord();
    }
}

function setActiveQuestVisual(id) {
    document.querySelectorAll(".quest-card").forEach(c => c.classList.remove("active-quest"));
    const card = document.getElementById(`quest-card-${id}`);
    if (card) {
        card.classList.add("active-quest");
        const badge = card.querySelector(".quest-status-badge");
        if (badge && !completedQuests[id]) {
            badge.innerHTML = "进行中";
        }
    }
}

// ==========================================================================
// 7. 音频合成系统 (Web Audio Oscillator Chords)
// ==========================================================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playClickSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
}

function playDeleteSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.12);
}

function playSuccessChord() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    const notes = [293.66, 369.99, 440.00, 587.33]; // D4, F#4, A4, D5 (D Major Chord)
    notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.05, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.28);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(now + idx * 0.06 + 0.28);
    });
}

// ==========================================================================
// 8. 成功粒子散射系统 (Success Sparks Particle System)
// ==========================================================================
class SparkParticle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4.5 + 2.0;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.radius = Math.random() * 2.5 + 1.2;
        this.alpha = 1.0;
        this.decay = Math.random() * 0.02 + 0.015;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98;
        this.vy *= 0.98;
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

function triggerSuccessSparks(x, y, color) {
    for (let i = 0; i < 25; i++) {
        particles.push(new SparkParticle(x, y, color));
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
// 9. 窗口尺寸调整与事件初始化 (Resize & Init)
// ==========================================================================
function handleResize() {
    const rect = canvasContainer.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    
    scaleX = (rect.width - paddingLeft - paddingRight) / (axisMax - axisMin);
    drawSandbox();
}
window.addEventListener("resize", handleResize);

function init() {
    // 概念模态弹窗
    btnShowHelp.addEventListener("click", () => modalHelp.classList.add("active"));
    btnCloseHelp.addEventListener("click", () => modalHelp.classList.remove("active"));
    modalHelp.addEventListener("click", (e) => {
        if (e.target === modalHelp) modalHelp.classList.remove("active");
    });

    // 侧边栏折叠
    document.getElementById("data-toggle-btn").addEventListener("click", () => {
        document.getElementById("panel-data-list-section").classList.toggle("collapsed");
    });

    document.getElementById("quest-toggle-btn").addEventListener("click", () => {
        document.getElementById("panel-quests-section").classList.toggle("collapsed");
    });

    // 教学配置勾选框状态同步
    chkShowSquares.addEventListener("change", () => {
        showSquares = chkShowSquares.checked;
        drawSandbox();
    });

    chkShowTorque.addEventListener("change", () => {
        showTorque = chkShowTorque.checked;
        drawSandbox();
    });

    chkLockPivot.addEventListener("change", () => {
        lockPivot = chkLockPivot.checked;
        if (lockPivot) {
            const stats = calculateStats();
            lockedPivotVal = stats.mean;
        }
        drawSandbox();
    });

    // 左侧列表悬浮详解监听 (Hover Listeners for Formula breakdown)
    document.getElementById("row-mean").addEventListener("mouseenter", () => { hoveredMetric = "mean"; drawSandbox(); });
    document.getElementById("row-mean").addEventListener("mouseleave", () => { hoveredMetric = null; drawSandbox(); });
    
    document.getElementById("row-median").addEventListener("mouseenter", () => { hoveredMetric = "median"; drawSandbox(); });
    document.getElementById("row-median").addEventListener("mouseleave", () => { hoveredMetric = null; drawSandbox(); });
    
    document.getElementById("row-mode").addEventListener("mouseenter", () => { hoveredMetric = "mode"; drawSandbox(); });
    document.getElementById("row-mode").addEventListener("mouseleave", () => { hoveredMetric = null; drawSandbox(); });

    document.getElementById("row-range").addEventListener("mouseenter", () => { hoveredMetric = "range"; drawSandbox(); });
    document.getElementById("row-range").addEventListener("mouseleave", () => { hoveredMetric = null; drawSandbox(); });

    document.getElementById("row-variance").addEventListener("mouseenter", () => { hoveredMetric = "variance"; drawSandbox(); });
    document.getElementById("row-variance").addEventListener("mouseleave", () => { hoveredMetric = null; drawSandbox(); });

    document.getElementById("row-stddev").addEventListener("mouseenter", () => { hoveredMetric = "stddev"; drawSandbox(); });
    document.getElementById("row-stddev").addEventListener("mouseleave", () => { hoveredMetric = null; drawSandbox(); });

    // 预设数据集加载绑定
    document.getElementById("preset-gather").addEventListener("click", () => {
        playClickSound();
        startMorphToPreset(PRESETS.gather);
        document.querySelectorAll(".btn-preset").forEach(b => b.classList.remove("active"));
        document.getElementById("preset-gather").classList.add("active");
    });

    document.getElementById("preset-scatter").addEventListener("click", () => {
        playClickSound();
        startMorphToPreset(PRESETS.scatter);
        document.querySelectorAll(".btn-preset").forEach(b => b.classList.remove("active"));
        document.getElementById("preset-scatter").classList.add("active");
    });

    document.getElementById("preset-bimodal").addEventListener("click", () => {
        playClickSound();
        startMorphToPreset(PRESETS.bimodal);
        document.querySelectorAll(".btn-preset").forEach(b => b.classList.remove("active"));
        document.getElementById("preset-bimodal").classList.add("active");
    });

    document.getElementById("preset-outlier").addEventListener("click", () => {
        playClickSound();
        startMorphToPreset(PRESETS.outlier);
        document.querySelectorAll(".btn-preset").forEach(b => b.classList.remove("active"));
        document.getElementById("preset-outlier").classList.add("active");
    });

    // 清空与随机添加
    btnClearAll.addEventListener("click", () => {
        dataPoints = [];
        playDeleteSound();
        drawSandbox();
    });

    btnAddRandom.addEventListener("click", () => {
        if (dataPoints.length >= 20) {
            alert("已达到数据沙盒上限 (最多 20 个数据球)！");
            return;
        }
        const val = Math.round((Math.random() * (axisMax - axisMin) + axisMin) * 10) / 10;
        dataPoints.push(val);
        playClickSound();
        drawSandbox();
    });

    // 任务重置按键
    document.getElementById("btn-quest-1").addEventListener("click", (e) => {
        e.stopPropagation();
        playClickSound();
        startMorphToPreset([5.0, 7.0, 9.0, 11.0, 13.0, 15.0]);
        setActiveQuestVisual(1);
    });

    document.getElementById("btn-quest-2").addEventListener("click", (e) => {
        e.stopPropagation();
        playClickSound();
        startMorphToPreset([9.5, 9.8, 10.0, 10.0, 10.2, 10.5]);
        setActiveQuestVisual(2);
    });

    document.getElementById("btn-quest-3").addEventListener("click", (e) => {
        e.stopPropagation();
        playClickSound();
        startMorphToPreset([5.0, 5.0, 5.0, 5.0, 5.0, 5.0]);
        setActiveQuestVisual(3);
    });

    setActiveQuestVisual(1);

    initCanvasEvents();
    handleResize();

    // 持续渲染循环，以支持方差投影呼吸灯和锁定支点状态下的天平力矩倾斜动画
    function mainRenderLoop() {
        drawSandbox();
        requestAnimationFrame(mainRenderLoop);
    }
    mainRenderLoop();
}

document.addEventListener("DOMContentLoaded", init);
