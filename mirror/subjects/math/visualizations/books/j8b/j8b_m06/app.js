/**
 * 二次根式化简与合并实验室 - 核心逻辑 (app.js)
 * 1. 根式代数分解引擎：支持对任意 N 进行完美平方数提取与最简化简
 * 2. 2D 反应堆物理与碰撞引擎：模拟卡片拖拽、圆形边界碰撞限制、异类根式磁力排斥
 * 3. 裂变与聚变动画渲染环：双击卡片执行分步裂变，一键合并平滑聚变
 * 4. HUD 黑板步骤动态解算排版
 */

// ==========================================================================
// 1. 全局配置与状态定义
// ==========================================================================
let cards = []; // 反应堆内卡片数组
let activeDragCard = null;
let dragOffset = { x: 0, y: 0 };

const paperWidth = 124; // SVG 卡片标准宽度
const paperHeight = 78; // SVG 卡片标准高度

// DOM 元素引用
const canvasContainer = document.querySelector(".canvas-container-wrapper");
const canvas = document.getElementById("reactor-canvas");
const ctx = canvas.getContext("2d");

const libraryContainer = document.getElementById("library-cards-container");
const formCustom = document.getElementById("form-custom-radical");
const inputNVal = document.getElementById("input-n-val");
const stepsChalkboard = document.getElementById("steps-hud-chalkboard");

const btnSimplifyAll = document.getElementById("btn-simplify-all");
const btnCombineAll = document.getElementById("btn-combine-all");
const btnClearReactor = document.getElementById("btn-clear-reactor");

const sandboxStatusDot = document.getElementById("sandbox-status-dot");
const sandboxStatusText = document.getElementById("sandbox-status-text");

const btnShowHelp = document.getElementById("btn-show-help");
const btnCloseHelp = document.getElementById("btn-close-help");
const modalHelp = document.getElementById("modal-help");

// ==========================================================================
// 2. 根式代数算法引擎 (Algebra radical simplifier)
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

// 完全化简二次根式：a * \sqrt{b} -> c * \sqrt{d}
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

// ==========================================================================
// 3. Canvas 粒子与波纹爆炸系统
// ==========================================================================
const particlesCanvas = document.getElementById("particles-canvas");
const pCtx = particlesCanvas.getContext("2d");
let particles = [];
let ripples = [];
let animId = null;

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.radius = Math.random() * 2 + 1;
        this.alpha = 1.0;
        this.decay = Math.random() * 0.02 + 0.015;
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

class FusionRipple {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = 20;
        this.alpha = 1.0;
        this.speed = 3.5;
    }
    update() {
        this.radius += this.speed;
        this.alpha -= 0.025;
    }
    draw(c) {
        c.save();
        c.globalAlpha = Math.max(0, this.alpha);
        c.strokeStyle = this.color;
        c.lineWidth = 3;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.stroke();
        c.restore();
    }
}

function resizeParticlesCanvas() {
    particlesCanvas.width = window.innerWidth;
    particlesCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeParticlesCanvas);
resizeParticlesCanvas();

function triggerExplosion(x, y, color) {
    for (let i = 0; i < 25; i++) {
        particles.push(new Particle(x, y, color));
    }
    ripples.push(new FusionRipple(x, y, color));
    if (!animId) {
        tickParticles();
    }
}

function tickParticles() {
    pCtx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);
    
    // 更新粒子
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        if (p.alpha <= 0) {
            particles.splice(i, 1);
        } else {
            p.draw(pCtx);
        }
    }

    // 更新波纹
    for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.update();
        if (r.alpha <= 0) {
            ripples.splice(i, 1);
        } else {
            r.draw(pCtx);
        }
    }

    if (particles.length > 0 || ripples.length > 0) {
        animId = requestAnimationFrame(tickParticles);
    } else {
        animId = null;
    }
}

function getRadicalCardPalette(card) {
    if (card.state === "fission") {
        return {
            core: "#7f1d1d",
            core2: "#be123c",
            glow: "rgba(244, 63, 94, 0.42)",
            edge: "rgba(251, 113, 133, 0.92)",
            accent: "#fb7185",
            text: "#fff7ed"
        };
    }
    const simplified = card.coef > 1 || fullySimplify(1, card.rad).coef > 1 === false;
    if (simplified) {
        return {
            core: "#064e3b",
            core2: "#047857",
            glow: "rgba(16, 185, 129, 0.42)",
            edge: "rgba(52, 211, 153, 0.92)",
            accent: "#34d399",
            text: "#f0fdf4"
        };
    }
    return {
        core: "#3b0764",
        core2: "#6d28d9",
        glow: "rgba(139, 92, 246, 0.42)",
        edge: "rgba(167, 139, 250, 0.92)",
        accent: "#a78bfa",
        text: "#faf5ff"
    };
}

const radicalCardSvgCache = new Map();

function getRadicalCardVisualState(card) {
    if (card.state === "fission") {
        return { key: "fission", label: "化简中", marker: "#fb7185" };
    }

    const simplified = fullySimplify(card.coef, card.rad);
    if (simplified.coef === card.coef && simplified.rad === card.rad) {
        return { key: "stable", label: "最简式", marker: "#34d399" };
    }

    return { key: "raw", label: "待化简", marker: "#a78bfa" };
}

function createRadicalCardSvgImage(card) {
    const palette = getRadicalCardPalette(card);
    const visualState = getRadicalCardVisualState(card);
    if (radicalCardSvgCache.has(visualState.key)) {
        return radicalCardSvgCache.get(visualState.key);
    }

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="496" height="312" viewBox="0 0 124 78">
            <defs>
                <linearGradient id="body" x1="10" y1="5" x2="112" y2="70" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="${palette.core2}"/>
                    <stop offset="0.52" stop-color="${palette.core}"/>
                    <stop offset="1" stop-color="#111827"/>
                </linearGradient>
                <linearGradient id="edge" x1="8" y1="4" x2="116" y2="71" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#ffffff" stop-opacity="0.72"/>
                    <stop offset="0.24" stop-color="${palette.accent}" stop-opacity="0.92"/>
                    <stop offset="0.78" stop-color="${palette.accent}" stop-opacity="0.42"/>
                    <stop offset="1" stop-color="#0f172a" stop-opacity="0.9"/>
                </linearGradient>
                <linearGradient id="sheen" x1="22" y1="7" x2="83" y2="51" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#ffffff" stop-opacity="0.34"/>
                    <stop offset="0.46" stop-color="#ffffff" stop-opacity="0.08"/>
                    <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
                </linearGradient>
                <pattern id="micro" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
                    <path d="M0 0V12" stroke="#ffffff" stroke-opacity="0.07" stroke-width="1"/>
                </pattern>
                <filter id="shadow" x="-20%" y="-20%" width="150%" height="160%">
                    <feDropShadow dx="0" dy="4" stdDeviation="3.5" flood-color="#0f172a" flood-opacity="0.34"/>
                </filter>
            </defs>
            <g filter="url(#shadow)">
                <rect x="8" y="9" width="108" height="63" rx="14" fill="#0f172a" fill-opacity="0.42"/>
                <rect x="5" y="4" width="114" height="66" rx="14" fill="url(#body)" stroke="url(#edge)" stroke-width="2"/>
                <rect x="8" y="7" width="108" height="60" rx="11" fill="none" stroke="#ffffff" stroke-opacity="0.18"/>
                <path d="M19 8H105C111 8 115 12 115 18V25C89 20 52 25 10 39V18C10 12 13 8 19 8Z" fill="url(#sheen)"/>
                <rect x="8" y="7" width="108" height="60" rx="11" fill="url(#micro)"/>
                <g transform="translate(15 12)">
                    <circle cx="3" cy="3" r="2.4" fill="${visualState.marker}"/>
                    <circle cx="3" cy="3" r="4.2" fill="none" stroke="${visualState.marker}" stroke-opacity="0.34"/>
                    <text x="10" y="5.2" fill="#ffffff" fill-opacity="0.8" font-family="Noto Sans SC, Microsoft YaHei, sans-serif" font-size="6.5" font-weight="700">${visualState.label}</text>
                </g>
                <rect x="9" y="30" width="2.4" height="22" rx="1.2" fill="${palette.accent}" fill-opacity="0.78"/>
                <circle cx="109" cy="15" r="2" fill="#ffffff" fill-opacity="0.28"/>
            </g>
        </svg>`;

    const image = new Image();
    image.decoding = "async";
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    radicalCardSvgCache.set(visualState.key, image);
    return image;
}

function drawSvgRadicalCard(card) {
    const x = card.x - card.w / 2;
    const y = card.y - card.h / 2;
    const palette = getRadicalCardPalette(card);
    const image = createRadicalCardSvgImage(card);

    ctx.save();
    if (image.complete && image.naturalWidth > 0) {
        ctx.drawImage(image, x, y, card.w, card.h);
    } else {
        const fallback = ctx.createLinearGradient(x, y, x + card.w, y + card.h);
        fallback.addColorStop(0, palette.core2);
        fallback.addColorStop(1, palette.core);
        ctx.fillStyle = fallback;
        ctx.strokeStyle = palette.edge;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x + 5, y + 4, card.w - 10, card.h - 12, 14);
        ctx.fill();
        ctx.stroke();
    }

    if (card.isDragging) {
        ctx.strokeStyle = "rgba(14, 165, 233, 0.9)";
        ctx.lineWidth = 2.2;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 1, card.w - 4, card.h - 5, 15);
        ctx.stroke();
    }
    ctx.restore();
}

function drawFormulaText(text, x, y, size = 16, palette = null) {
    const color = palette?.text || "#ffffff";
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `800 ${size}px "Noto Sans SC", "Microsoft YaHei", sans-serif`;
    ctx.lineWidth = Math.max(2.4, size * 0.16);
    ctx.strokeStyle = "rgba(15, 23, 42, 0.82)";
    ctx.fillStyle = color;
    ctx.shadowColor = "rgba(255, 255, 255, 0.22)";
    ctx.shadowBlur = 4;
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
    ctx.restore();
}

function drawRadicalFormula(coef, rad, x, y, size = 21, palette = null) {
    drawFormulaText(renderRadicalString(coef, rad), x, y, size, palette);
}

// ==========================================================================
// 4. 卡片实体类 (Card Entity Class)
// ==========================================================================
class RadicalCard {
    constructor(coef, rad, x, y) {
        this.coef = coef;
        this.rad = rad;
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
        this.w = paperWidth;
        this.h = paperHeight;
        this.isDragging = false;
        
        // 动画控制字段
        this.state = "normal"; // "normal", "fission", "fusion", "fading"
        this.animT = 0;
        this.targetCoef = coef;
        this.targetRad = rad;
        this.targetX = null;
        this.targetY = null;
        
        // 裂变过程分步文本暂存
        this.fissionStage = 0; // 0: 原根式, 1: 提平方因子, 2: 拆分, 3: 提取系数, 4: 完成
        this.fissionText = "";
        
        this.color = "rgba(139, 92, 246, 0.85)"; // 初始紫色
    }

    // 更新物理状态
    update(rx, ry, rRad) {
        if (this.isDragging) return;

        if (this.state === "normal") {
            // 普通悬浮流动物理
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= 0.99;
            this.vy *= 0.99;

            // 反应器圆形边界碰撞
            const dx = this.x - rx;
            const dy = this.y - ry;
            const dist = Math.hypot(dx, dy);
            const limit = rRad - Math.hypot(this.w / 2, this.h / 2) - 8;

            if (dist > limit) {
                const nx = dx / dist;
                const ny = dy / dist;
                this.x = rx + nx * limit;
                // 反射向量
                const dot = this.vx * nx + this.vy * ny;
                if (dot > 0) {
                    this.vx = (this.vx - 2 * dot * nx) * 0.7;
                    this.vy = (this.vy - 2 * dot * ny) * 0.7;
                }
            }
        } 
        else if (this.state === "fission") {
            // 裂变状态，静止于当前位置做动画
            this.animT += 0.015; // 提速裂变动感 (约 1.1s 完成)
            if (this.animT >= 1.0) {
                this.coef = this.targetCoef;
                this.rad = this.targetRad;
                this.state = "normal";
                this.animT = 0;
                this.color = "rgba(16, 185, 129, 0.85)"; // 化简完变为稳定绿
                triggerExplosion(canvas.getBoundingClientRect().left + this.x, canvas.getBoundingClientRect().top + this.y, "#10b981");
                updateChalkboard();
            }
        } 
        else if (this.state === "fusion" && this.targetCard) {
            // 聚变中：被吸引滑向合并中心卡片
            this.animT += 0.05;
            this.x += (this.targetCard.x - this.x) * 0.12;
            this.y += (this.targetCard.y - this.y) * 0.12;
            
            // 当高度重合时，标记为 fading 待清除
            const dist = Math.hypot(this.x - this.targetCard.x, this.y - this.targetCard.y);
            if (dist < 8) {
                this.state = "fading";
            }
        }
    }

    // 绘制卡片
    draw() {
        const palette = getRadicalCardPalette(this);
        drawSvgRadicalCard(this);

        // 2. 绘制卡片内部文字
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        if (this.state === "fission") {
            const maxS = findMaxSquareFactor(this.rad);
            const base = Math.sqrt(maxS);
            const remain = this.rad / maxS;

            // 绘制卡片上的主要根式部分（渐渐变为化简后的根式部分）
            if (this.animT < 0.25) {
                drawRadicalFormula(this.coef, this.rad, this.x, this.y + 6, 21, palette);
            } else {
                drawRadicalFormula(1, remain, this.x + (this.animT >= 0.65 ? 13 : 0), this.y + 6, 21, palette);
            }

            // 绘制完美平方因子的弹出气泡
            if (this.animT >= 0.25) {
                let bx = this.x;
                let by = this.y;
                let bubbleText = "";

                if (this.animT < 0.65) {
                    // 阶段一：气泡缓缓垂直浮上卡片上方
                    const t = (this.animT - 0.25) / 0.40;
                    bx = this.x;
                    by = this.y - t * 45;
                    bubbleText = t < 0.5 ? `√${maxS}` : base.toString(); // 浮空一半时褪去根号
                } else {
                    // 阶段二：气泡斜下移动，装配在卡片左侧系数位置
                    const t = (this.animT - 0.65) / 0.35;
                    const tx = this.x - 22;
                    const ty = this.y;
                    bx = this.x + (tx - this.x) * t;
                    by = (this.y - 45) + (ty - (this.y - 45)) * t;
                    bubbleText = (this.coef * base).toString(); // 与原系数相乘后的最终系数
                }

                // 绘制绿光气泡
                ctx.save();
                ctx.beginPath();
                ctx.arc(bx, by, 18, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(16, 185, 129, 0.25)";
                ctx.strokeStyle = "rgba(16, 185, 129, 0.85)";
                ctx.lineWidth = 1.8;
                ctx.shadowColor = "#10b981";
                ctx.shadowBlur = 10;
                ctx.fill();
                ctx.stroke();

                drawFormulaText(bubbleText, bx, by, 12, { text: "#ffffff" });
                ctx.restore();
            }

            // 下方小进度条
            ctx.fillStyle = "rgba(244, 63, 94, 0.15)";
            ctx.fillRect(this.x - 36, this.y + 27, 72, 3);
            ctx.fillStyle = "#f43f5e";
            ctx.fillRect(this.x - 36, this.y + 27, 72 * this.animT, 3);

        } else {
            // 普通根式文本绘制
            drawRadicalFormula(this.coef, this.rad, this.x, this.y + 6, 21, palette);
        }
        ctx.restore();
    }
}

// 拼接根式文本公式
function renderRadicalString(coef, rad) {
    if (rad === 1) return coef.toString();
    const coefStr = coef === 1 ? "" : coef.toString();
    return `${coefStr}√${rad}`;
}

// ==========================================================================
// 5. 反应堆 Canvas 物理循环与绘制 (Physics Loop)
// ==========================================================================
function updateReactor() {
    const rect = canvas.getBoundingClientRect();
    const W = canvas.width / window.devicePixelRatio;
    const H = canvas.height / window.devicePixelRatio;
    
    // 反应中心及半径
    const rx = W / 2;
    const ry = H / 2;
    const rRad = Math.min(W, H) * 0.43;

    ctx.clearRect(0, 0, W, H);

    // 1. 擦除与绘制反应堆发光大背景
    drawReactorContainer(rx, ry, rRad);

    // 2. 二次根式磁性引力与斥力场模拟 (Magnetic Forces)
    simulateMagneticFields();

    // 3. 更新与绘制所有卡片
    for (let i = cards.length - 1; i >= 0; i--) {
        const card = cards[i];
        card.update(rx, ry, rRad);
        
        // 绘制吸引聚变的磁电同类连接线
        if (card.state === "fusion" && card.targetCard) {
            ctx.save();
            ctx.strokeStyle = "rgba(16, 185, 129, 0.45)";
            ctx.lineWidth = 2.5;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(card.x, card.y);
            ctx.lineTo(card.targetCard.x, card.targetCard.y);
            ctx.stroke();

            // 沿着连线运动的绿色高能电荷粒子
            const travel = (Date.now() % 800) / 800;
            const cx = card.x + (card.targetCard.x - card.x) * travel;
            const cy = card.y + (card.targetCard.y - card.y) * travel;
            ctx.fillStyle = "#10b981";
            ctx.shadowColor = "#10b981";
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // 移除融合消失的卡片
        if (card.state === "fading") {
            cards.splice(i, 1);
            updateChalkboard();
        } else {
            card.draw();
        }
    }
}

// 绘制分层反应容器，所有结构都保持在卡片内容之后。
function drawReactorContainer(rx, ry, rRad) {
    ctx.save();

    // 1. 反应区内场，让容器与全局工程网格形成清晰层级。
    const fieldGradient = ctx.createRadialGradient(rx, ry, rRad * 0.06, rx, ry, rRad);
    fieldGradient.addColorStop(0, "rgba(255, 255, 255, 0.82)");
    fieldGradient.addColorStop(0.52, "rgba(240, 249, 255, 0.46)");
    fieldGradient.addColorStop(0.84, "rgba(224, 242, 254, 0.28)");
    fieldGradient.addColorStop(1, "rgba(186, 230, 253, 0.15)");
    ctx.fillStyle = fieldGradient;
    ctx.beginPath();
    ctx.arc(rx, ry, rRad, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(rx, ry, rRad - 2, 0, Math.PI * 2);
    ctx.clip();

    // 2. 径向导轨与同心测量环。
    for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12;
        const inner = rRad * 0.19;
        const outer = rRad - 34;
        ctx.strokeStyle = i % 3 === 0
            ? "rgba(51, 65, 85, 0.095)"
            : "rgba(14, 165, 233, 0.065)";
        ctx.lineWidth = i % 3 === 0 ? 1.1 : 0.8;
        ctx.beginPath();
        ctx.moveTo(rx + Math.cos(angle) * inner, ry + Math.sin(angle) * inner);
        ctx.lineTo(rx + Math.cos(angle) * outer, ry + Math.sin(angle) * outer);
        ctx.stroke();
    }

    [0.34, 0.56, 0.76].forEach((ratio, index) => {
        ctx.strokeStyle = index === 1
            ? "rgba(37, 99, 235, 0.10)"
            : "rgba(14, 165, 233, 0.075)";
        ctx.lineWidth = index === 1 ? 1.1 : 0.8;
        ctx.setLineDash(index === 1 ? [2, 8] : []);
        ctx.beginPath();
        ctx.arc(rx, ry, rRad * ratio, 0, Math.PI * 2);
        ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.restore();

    // 3. 外壳厚度、主轮廓与内侧精密环。
    ctx.shadowColor = "rgba(15, 23, 42, 0.12)";
    ctx.shadowBlur = 14;
    ctx.strokeStyle = "rgba(15, 23, 42, 0.10)";
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(rx, ry, rRad + 1, 0, Math.PI * 2);
    ctx.stroke();

    ctx.shadowColor = "rgba(14, 165, 233, 0.20)";
    ctx.shadowBlur = 10;
    ctx.strokeStyle = "rgba(14, 165, 233, 0.62)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(rx, ry, rRad, 0, Math.PI * 2);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.90)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(rx, ry, rRad - 4, 0, Math.PI * 2);
    ctx.stroke();

    // 4. 分段能量环。
    const segmentRadius = rRad - 15;
    for (let i = 0; i < 36; i++) {
        const start = -Math.PI / 2 + (Math.PI * 2 * i) / 36 + 0.018;
        const end = start + Math.PI * 2 / 36 - 0.052;
        ctx.strokeStyle = i % 3 === 0
            ? "rgba(37, 99, 235, 0.34)"
            : "rgba(14, 165, 233, 0.19)";
        ctx.lineWidth = i % 3 === 0 ? 2 : 1.4;
        ctx.beginPath();
        ctx.arc(rx, ry, segmentRadius, start, end);
        ctx.stroke();
    }

    // 5. 内向刻度，六个主刻度用于快速判断方位。
    const tickOuter = rRad - 24;
    for (let i = 0; i < 72; i++) {
        const angle = -Math.PI / 2 + (Math.PI * 2 * i) / 72;
        const isMajor = i % 12 === 0;
        const isMedium = i % 6 === 0;
        const tickLength = isMajor ? 11 : isMedium ? 7 : 3.5;
        ctx.strokeStyle = isMajor
            ? "rgba(15, 23, 42, 0.32)"
            : "rgba(14, 165, 233, 0.24)";
        ctx.lineWidth = isMajor ? 1.7 : 1;
        ctx.beginPath();
        ctx.moveTo(rx + Math.cos(angle) * tickOuter, ry + Math.sin(angle) * tickOuter);
        ctx.lineTo(rx + Math.cos(angle) * (tickOuter - tickLength), ry + Math.sin(angle) * (tickOuter - tickLength));
        ctx.stroke();
    }

    // 6. 四向校准节点。
    for (let i = 0; i < 4; i++) {
        const angle = -Math.PI / 2 + i * Math.PI / 2;
        const nodeRadius = rRad - 8;
        const nx = rx + Math.cos(angle) * nodeRadius;
        const ny = ry + Math.sin(angle) * nodeRadius;
        ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
        ctx.strokeStyle = "rgba(8, 145, 178, 0.72)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(nx, ny, 4.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "rgba(8, 145, 178, 0.88)";
        ctx.beginPath();
        ctx.arc(nx, ny, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // 7. 中心反应核心：玻璃底、双轨道、六边形核心和呼吸点。
    const coreRadius = Math.max(46, Math.min(60, rRad * 0.15));
    const pulse = (Math.sin(Date.now() / 850) + 1) / 2;
    const coreGradient = ctx.createRadialGradient(rx, ry, 2, rx, ry, coreRadius);
    coreGradient.addColorStop(0, "rgba(255, 255, 255, 0.96)");
    coreGradient.addColorStop(0.56, "rgba(236, 254, 255, 0.76)");
    coreGradient.addColorStop(1, "rgba(186, 230, 253, 0.34)");
    ctx.fillStyle = coreGradient;
    ctx.strokeStyle = "rgba(14, 165, 233, 0.30)";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(rx, ry, coreRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "rgba(37, 99, 235, 0.18)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.arc(rx, ry, coreRadius - 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = -Math.PI / 2 + i * Math.PI / 3;
        const px = rx + Math.cos(angle) * 18;
        const py = ry + Math.sin(angle) * 18;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = `rgba(14, 165, 233, ${0.07 + pulse * 0.04})`;
    ctx.strokeStyle = "rgba(8, 145, 178, 0.40)";
    ctx.lineWidth = 1.2;
    ctx.fill();
    ctx.stroke();

    ctx.shadowColor = "rgba(14, 165, 233, 0.58)";
    ctx.shadowBlur = 7 + pulse * 4;
    ctx.fillStyle = "rgba(8, 145, 178, 0.76)";
    ctx.beginPath();
    ctx.arc(rx, ry, 3.2 + pulse * 0.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// 二次根式磁场模拟：同类根式合并状态下靠拢，非同类根式物理反弹排斥
function simulateMagneticFields() {
    for (let i = 0; i < cards.length; i++) {
        for (let j = i + 1; j < cards.length; j++) {
            const cardA = cards[i];
            const cardB = cards[j];

            // 忽略拖拽或非正常态卡片
            if (cardA.isDragging || cardB.isDragging) continue;
            if (cardA.state === "fading" || cardB.state === "fading") continue;

            const dx = cardB.x - cardA.x;
            const dy = cardB.y - cardA.y;
            const dist = Math.hypot(dx, dy);

            // 磁力场作用范围
            const range = Math.max(cardA.w, cardB.w) + 18;

            if (dist < range) {
                // 判断两者是否是同类二次根式 (化简后被开方数是否相同)
                const simpA = fullySimplify(cardA.coef, cardA.rad);
                const simpB = fullySimplify(cardB.coef, cardB.rad);

                if (simpA.rad === simpB.rad) {
                    // 同类根式：如果是合并模式中，会产生吸引；普通悬游时保持轻微弹性碰撞
                    if (cardA.state === "fusion" || cardB.state === "fusion") {
                        // 吸引力已在 update 阶段通过指定 targetX/Y 运动，这里不做排斥
                    } else {
                        // 普通弹性小碰撞，防止重叠
                        const nx = dx / dist;
                        const ny = dy / dist;
                        const overlap = range - dist;
                        cardA.vx -= nx * overlap * 0.02;
                        cardA.vy -= ny * overlap * 0.02;
                        cardB.vx += nx * overlap * 0.02;
                        cardB.vy += ny * overlap * 0.02;
                    }
                } else {
                    // 非同类二次根式：在聚变阶段产生强烈的“磁极互斥”
                    const nx = dx / dist;
                    const ny = dy / dist;
                    const repulsion = (range - dist) * 0.12; // 强斥力系数
                    
                    cardA.vx -= nx * repulsion;
                    cardA.vy -= ny * repulsion;
                    cardB.vx += nx * repulsion;
                    cardB.vy += ny * repulsion;
                    
                    // 绘制红色弹性磁力屏障波纹
                    const midX = (cardA.x + cardB.x) / 2;
                    const midY = (cardA.y + cardB.y) / 2;
                    ctx.save();
                    ctx.strokeStyle = `rgba(244, 63, 94, ${(range - dist) / range * 0.85})`;
                    ctx.lineWidth = 2.5;
                    ctx.setLineDash([4, 3]);
                    ctx.beginPath();
                    ctx.arc(midX, midY, (range - dist) * 0.5, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    // 绘制磁力放电弧花线
                    ctx.strokeStyle = `rgba(244, 63, 94, ${(range - dist) / range * 0.5})`;
                    ctx.lineWidth = 1.2;
                    ctx.setLineDash([]);
                    ctx.beginPath();
                    ctx.moveTo(cardA.x, cardA.y);
                    ctx.lineTo(cardB.x, cardB.y);
                    ctx.stroke();
                    ctx.restore();

                    // 非同类合并时发出警报提示
                    if (btnCombineAll.getAttribute("data-merging") === "true") {
                        sandboxStatusDot.className = "status-indicator-dot alert";
                        sandboxStatusText.innerHTML = "💥 非同类二次根式产生磁性排斥！只有被开方数相同的根式才能合并！";
                    }
                }
            }
        }
    }
}

// 物理渲染主环
function tickReactor() {
    const rx = canvas.width / (2 * window.devicePixelRatio);
    const ry = canvas.height / (2 * window.devicePixelRatio);
    const rRad = Math.min(canvas.width, canvas.height) / (2 * window.devicePixelRatio) * 0.43;
    
    updateReactor();
    requestAnimationFrame(tickReactor);
}

// ==========================================================================
// 6. 二次根式裂变化简与聚变合并的核心交互动作 (Fission & Fusion)
// ==========================================================================
// 启动所有根式的分步裂变化简
function triggerSimplifyAll() {
    let triggered = false;
    
    cards.forEach(card => {
        const simp = fullySimplify(card.coef, card.rad);
        // 若当前未最简，双击或一键化简触发 fission 裂变
        if (simp.rad !== card.rad) {
            card.state = "fission";
            card.animT = 0;
            card.targetCoef = simp.coef;
            card.targetRad = simp.rad;
            triggered = true;
        }
    });

    if (triggered) {
        playClickSound();
        sandboxStatusDot.className = "status-indicator-dot fission";
        sandboxStatusText.innerHTML = "💥 裂变引擎启动！被开方数包含完美平方因子的卡片开始化简分步展开...";
    } else {
        sandboxStatusText.innerHTML = "稳定状态。熔炉内所有二次根式皆已是最简二次根式。";
    }
}

// 启动同类根式合并聚变
function triggerCombineAll() {
    playClickSound();
    
    // 1. 确保所有卡片已经是最简
    let hasUnsimplified = false;
    cards.forEach(card => {
        const simp = fullySimplify(card.coef, card.rad);
        if (simp.rad !== card.rad) {
            hasUnsimplified = true;
        }
    });

    if (hasUnsimplified) {
        sandboxStatusText.innerHTML = "💡 检测到未化简卡片。系统先自动开启一键裂变化简...";
        triggerSimplifyAll();
        // 延时 1200ms 等化简完了再自动执行合并 (fission 已提速，1.2s 足够)
        setTimeout(executeCombineMath, 1200);
    } else {
        executeCombineMath();
    }
}

function executeCombineMath() {
    // 确保把所有处于 fission 化简动画状态中的卡片强行瞬移完成，规避 Race Condition 分组错乱
    cards.forEach(card => {
        if (card.state === "fission") {
            card.coef = card.targetCoef;
            card.rad = card.targetRad;
            card.state = "normal";
            card.animT = 0;
            card.color = "rgba(16, 185, 129, 0.85)";
        }
    });

    if (cards.length < 2) {
        sandboxStatusText.innerHTML = "反应堆中卡片不足，无法执行合并聚变。";
        return;
    }

    btnCombineAll.setAttribute("data-merging", "true");
    sandboxStatusDot.className = "status-indicator-dot fusion";
    sandboxStatusText.innerHTML = "🧲 同类根式产生磁力吸引！异类根式排斥弹开中...";

    // 2. 按被开方数分组
    const groups = {};
    cards.forEach(card => {
        if (!groups[card.rad]) {
            groups[card.rad] = [];
        }
        groups[card.rad].push(card);
    });

    // 3. 执行物理靠拢动画
    let mergedAny = false;
    
    Object.keys(groups).forEach(radKey => {
        const groupList = groups[radKey];
        if (groupList.length > 1) {
            mergedAny = true;
            const centerCard = groupList[0]; // 第一个作为合并中心
            
            for (let i = 1; i < groupList.length; i++) {
                const mergeCard = groupList[i];
                mergeCard.state = "fusion";
                mergeCard.targetCard = centerCard; // 保存物理引用，动态寻路追踪
                
                // 延时物理移除并合并系数
                setTimeout(() => {
                    centerCard.coef += mergeCard.coef;
                    const canvasLeft = canvas.getBoundingClientRect().left;
                    const canvasTop = canvas.getBoundingClientRect().top;
                    triggerExplosion(canvasLeft + centerCard.x, canvasTop + centerCard.y, "#10b981");
                    playSafeSound(); // 融合成功清脆和弦
                    updateChalkboard();
                }, 400);
            }
        }
    });

    // 恢复状态
    setTimeout(() => {
        btnCombineAll.setAttribute("data-merging", "false");
        if (mergedAny) {
            sandboxStatusDot.className = "status-indicator-dot";
            sandboxStatusText.innerHTML = "🎉 同类二次根式合并聚变成功！系数已合并。";
        } else {
            sandboxStatusDot.className = "status-indicator-dot";
            sandboxStatusText.innerHTML = "合并完成。反应堆中无同类二次根式，无法进一步融合。";
        }
        updateChalkboard();
    }, 600);
}

// ==========================================================================
// 7. HUD 对比板书与能量库渲染 (HUD & Preset Library)
// ==========================================================================
// 一键重绘/更新板书步骤
function updateChalkboard() {
    if (cards.length === 0) {
        stepsChalkboard.innerHTML = "<div class='hud-row-val'>反应堆为空。请从上方能量储备库中注入根式卡片进行探究。</div>";
        return;
    }

    // 1. 原多项式
    const rawTerms = cards.map(c => renderRadicalString(c.coef, c.rad));
    const rawExpr = rawTerms.join(" + ");

    // 2. 化简步骤
    const simplifiedTerms = cards.map(c => {
        const simp = fullySimplify(c.coef, c.rad);
        return renderRadicalString(simp.coef, simp.rad);
    });
    const simplifiedExpr = simplifiedTerms.join(" + ");

    // 3. 合并同类项后
    // 按被开方数归类系数
    const radCoeffs = {};
    cards.forEach(c => {
        const simp = fullySimplify(c.coef, c.rad);
        if (!radCoeffs[simp.rad]) radCoeffs[simp.rad] = 0;
        radCoeffs[simp.rad] += simp.coef;
    });

    const finalTerms = [];
    Object.keys(radCoeffs).forEach(radKey => {
        const r = parseInt(radKey);
        const c = radCoeffs[radKey];
        finalTerms.push(renderRadicalString(c, r));
    });
    const finalExpr = finalTerms.join(" + ");

    let html = `
        <div class="hud-row">
            <div class="hud-row-label">1. 当前熔炉根式多项式</div>
            <div class="hud-row-val math-glow-purple">${rawExpr}</div>
        </div>
        <div class="hud-row">
            <div class="hud-row-label">2. 裂化最简根式分步</div>
            <div class="hud-row-val math-glow-orange">${simplifiedExpr}</div>
        </div>
        <div class="hud-row">
            <div class="hud-row-label">3. 聚变合并同类项结果</div>
            <div class="hud-row-val math-glow-green">${finalExpr}</div>
        </div>
    `;

    // 如果正好能完全合并成单项
    if (finalTerms.length === 1 && cards.length > 1) {
        html += `
            <div class="hud-verdict-box">
                <div class="verdict-title">✅ 聚变大成功：</div>
                <div class="verdict-desc">反应堆内所有卡片均为<strong>同类二次根式</strong>，全部聚变融合为一项根式卡片！</div>
            </div>
        `;
    }

    stepsChalkboard.innerHTML = html;
}

// 预设卡片能量库渲染
const presetRadicals = [8, 12, 18, 20, 24, 27, 32, 45, 48, 50];
function renderPresetLibrary() {
    libraryContainer.innerHTML = "";
    presetRadicals.forEach(n => {
        const btn = document.createElement("button");
        btn.className = "library-card-btn";
        btn.setAttribute("aria-label", `注入根号 ${n}`);
        btn.innerHTML = `
            <span class="typeset-radical" aria-hidden="true">
                <span class="typeset-radical-hook">√</span>
                <span class="typeset-radicand">${n}</span>
            </span>`;
        btn.addEventListener("click", () => {
            playClickSound();
            spawnCard(1, n);
        });
        libraryContainer.appendChild(btn);
    });
}

// 在反应堆内随机位置生成卡片
function spawnCard(coef, rad) {
    const W = canvas.width / window.devicePixelRatio;
    const H = canvas.height / window.devicePixelRatio;
    
    // 在圆形熔炉的安全中心区生成
    const cx = W / 2 + (Math.random() - 0.5) * 60;
    const cy = H / 2 + (Math.random() - 0.5) * 60;

    cards.push(new RadicalCard(coef, rad, cx, cy));
    updateChalkboard();
}

// ==========================================================================
// 8. 拖拽操纵与系统初始化 (Events & Loop)
// ==========================================================================
function initCanvasEvents() {
    const rect = canvasContainer.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const handlePointerDown = (e) => {
        const cRect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - cRect.left;
        const mouseY = e.clientY - cRect.top;

        // 优先检查点在卡片上进行拖拽
        for (let i = cards.length - 1; i >= 0; i--) {
            const card = cards[i];
            // 卡片圆角边界
            if (mouseX >= card.x - card.w/2 && mouseX <= card.x + card.w/2 &&
                mouseY >= card.y - card.h/2 && mouseY <= card.y + card.h/2) {
                
                // 记录偏移
                activeDragCard = card;
                card.isDragging = true;
                dragOffset.x = mouseX - card.x;
                dragOffset.y = mouseY - card.y;
                
                // 双向指针锁定
                canvas.setPointerCapture(e.pointerId || 1);
                return;
            }
        }
    };

    const handlePointerMove = (e) => {
        if (!activeDragCard) return;
        const cRect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - cRect.left;
        const mouseY = e.clientY - cRect.top;

        activeDragCard.x = mouseX - dragOffset.x;
        activeDragCard.y = mouseY - dragOffset.y;
        
        activeDragCard.vx = 0;
        activeDragCard.vy = 0;
    };

    const handlePointerUp = (e) => {
        if (activeDragCard) {
            canvas.releasePointerCapture(e.pointerId || 1);
            activeDragCard.isDragging = false;
            // 赋予抛掷初速度
            activeDragCard = null;
        }
    };

    // 绑定指针事件
    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);

    // 辅助双击裂变化简
    canvas.addEventListener("dblclick", (e) => {
        const cRect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - cRect.left;
        const mouseY = e.clientY - cRect.top;

        for (let i = cards.length - 1; i >= 0; i--) {
            const card = cards[i];
            if (mouseX >= card.x - card.w/2 && mouseX <= card.x + card.w/2 &&
                mouseY >= card.y - card.h/2 && mouseY <= card.y + card.h/2) {
                
                // 双击卡片独立裂变
                const simp = fullySimplify(card.coef, card.rad);
                if (simp.rad !== card.rad) {
                    playClickSound();
                    card.state = "fission";
                    card.animT = 0;
                    card.targetCoef = simp.coef;
                    card.targetRad = simp.rad;
                    
                    sandboxStatusDot.className = "status-indicator-dot fission";
                    sandboxStatusText.innerHTML = `💥 裂变！根式卡片 √${card.rad} 正在分解化简为 ${renderRadicalString(simp.coef, simp.rad)}`;
                } else {
                    sandboxStatusText.innerHTML = `根式 ${renderRadicalString(card.coef, card.rad)} 已经是最简二次根式，无法再次裂变。`;
                }
                return;
            }
        }
    });
}

function handleResize() {
    const rect = canvasContainer.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
}
window.addEventListener("resize", handleResize);

// Web Audio API 拟真点击与融合成功清脆音效
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playClickSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
}

function playSafeSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    const freqs = [523.25, 659.25, 783.99]; // Major chord C-E-G
    freqs.forEach((f, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.04);
        gain.gain.setValueAtTime(0.08, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(now + idx * 0.04 + 0.15);
    });
}

function init() {
    // 1. 初始化 Canvas 及其事件
    initCanvasEvents();

    // 2. 渲染能量库
    renderPresetLibrary();

    // 3. 自定义根式生成监听
    formCustom.addEventListener("submit", (e) => {
        e.preventDefault();
        const n = parseInt(inputNVal.value);
        if (n >= 2) {
            playClickSound();
            spawnCard(1, n);
            inputNVal.value = "";
        }
    });

    // 4. 重置/排空熔炉
    btnClearReactor.addEventListener("click", () => {
        playClickSound();
        cards = [];
        sandboxStatusDot.className = "status-indicator-dot";
        sandboxStatusText.innerHTML = "熔炉已排空。请从左侧注入根式卡片。";
        updateChalkboard();
    });

    // 5. 化简与合并控制
    btnSimplifyAll.addEventListener("click", triggerSimplifyAll);
    btnCombineAll.addEventListener("click", triggerCombineAll);

    // 6. 帮助弹窗
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

    // 7. Collapsible HUD
    document.getElementById("hud-toggle-btn").addEventListener("click", () => {
        const hud = document.getElementById("hud-chalkboard-panel");
        hud.classList.toggle("collapsed");
    });

    // 8. 默认注入几张初始卡片
    spawnCard(1, 12);
    spawnCard(1, 18);
    spawnCard(1, 27);

    // 启动物理主循环
    tickReactor();
}

document.addEventListener("DOMContentLoaded", init);
