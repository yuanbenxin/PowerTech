/**
 * 轴对称与折叠作图实验室 - 交互逻辑 (app.js)
 * 1. 3D 纸张斜角三维透视投影 (Cabinet Projection) 折叠算法
 * 2. 多边形实时裁剪 (Polygon Clipper) 渲染折页和底纹
 * 3. 探究模式控制系统 (模式1: 对称点轨迹, 模式2: 垂直平分线对准, 模式3: 角平分线重合)
 * 4. 画布鼠标手势、锁定匹配器与 Canvas 粒子庆祝系统
 */

// ==========================================================================
// 1. 全局配置与状态定义
// ==========================================================================
let currentMode = "symmetric"; // "symmetric", "bisector", "angle"
let foldAngle = 0;             // 折叠角度 (0° ~ 180°)
let isAutoFolding = false;
let autoFoldInterval = null;

// 虚拟卡纸的定义 (居中平铺在桌面)
let paperWidth = 460;
let paperHeight = 340;
let paperRect = []; // 纸张四个顶点的数组 [{x, y}, ...]

const PAPER_FACE_COLOR = "#ffffff";
const PAPER_BACK_COLOR = "#fff4df";
const PAPER_BORDER_COLOR = "rgba(71, 85, 105, 0.62)";
const PAPER_GRID_COLOR = "rgba(100, 116, 139, 0.34)";

// 折痕线端点坐标 (可以在 Canvas 上被鼠标直接拖动调整)
let creaseStart = { x: 300, y: 120 };
let creaseEnd = { x: 300, y: 460 };
let activeCreaseHandle = null; // 当前拖拽的折痕端点

// 几何探测点/元素定义
let pointA = { x: 180, y: 220 }; // 对称点 A
let isDraggingPointA = false;
const DRAG_HIT_RADIUS = 44;

// 模式 2：垂直平分线固定对准靶点
let targetB = { x: 420, y: 220 }; // 目标点 B (与 A 配合对折)

// 模式 3：角平分线固定顶点与边
let angleVertexO = { x: 180, y: 380 }; // 角顶点 O
let rayAEnd = { x: 120, y: 180 };     // 射线 OA 端点
let rayBEnd = { x: 420, y: 380 };     // 射线 OB 端点

// Canvas 尺寸与交互
const canvasContainer = document.querySelector(".canvas-container-wrapper");
const canvas = document.getElementById("folding-canvas");
const ctx = canvas.getContext("2d");

const sliderFoldAngle = document.getElementById("slider-fold-angle");
const angleValLbl = document.getElementById("angle-val-lbl");
const btnFoldAuto = document.getElementById("btn-fold-auto");
const btnReset = document.getElementById("btn-reset");
const sandboxStatusDot = document.getElementById("sandbox-status-dot");
const sandboxStatusText = document.getElementById("sandbox-status-text");

const btnShowHelp = document.getElementById("btn-show-help");
const btnCloseHelp = document.getElementById("btn-close-help");
const modalHelp = document.getElementById("modal-help");

const stepsChalkboard = document.getElementById("steps-hud-chalkboard");
const modeInteractiveActions = document.getElementById("mode-interactive-actions");
const hudPanel = document.getElementById("hud-chalkboard-panel");
const hudToggleBtn = document.getElementById("hud-toggle-btn");

let isHudExpanded = false;

function applyHudStandard() {
    if (!hudPanel || !hudToggleBtn) return;
    const collapsed = hudPanel.classList.contains("collapsed");
    isHudExpanded = !collapsed;
    const setHudStyle = (name, value) => hudPanel.style.setProperty(name, value, "important");
    const setChildStyle = (node, name, value) => {
        if (node) node.style.setProperty(name, value, "important");
    };
    const header = hudPanel.querySelector(".hud-header");
    const title = hudPanel.querySelector(".hud-title");
    const arrow = hudPanel.querySelector(".hud-arrow-icon");
    const body = hudPanel.querySelector(".hud-body");

    if (window.innerWidth <= 640) {
        setHudStyle("display", "none");
        return;
    }

    hudPanel.setAttribute("aria-expanded", collapsed ? "false" : "true");
    hudToggleBtn.setAttribute("aria-expanded", collapsed ? "false" : "true");
    hudToggleBtn.setAttribute("title", collapsed ? "展开板书" : "收起板书");

    setHudStyle("display", "flex");
    setHudStyle("position", "absolute");
    setHudStyle("top", "20px");
    setHudStyle("left", "20px");
    setHudStyle("right", "auto");
    setHudStyle("width", collapsed ? "auto" : "360px");
    setHudStyle("min-width", collapsed ? "max-content" : "0");
    setHudStyle("max-width", "calc(100% - 40px)");
    setHudStyle("height", collapsed ? "46px" : "auto");
    setHudStyle("min-height", collapsed ? "46px" : "0");
    setHudStyle("max-height", "none");
    setHudStyle("background", collapsed ? "rgba(255, 255, 255, 0.92)" : "linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.9))");
    setHudStyle("border", collapsed ? "1px solid rgba(148, 163, 184, 0.28)" : "1px solid rgba(148, 163, 184, 0.24)");
    setHudStyle("border-radius", collapsed ? "999px" : "14px");
    setHudStyle("box-shadow", collapsed ? "0 12px 26px rgba(15, 23, 42, 0.13), inset 0 1px 0 rgba(255, 255, 255, 0.9)" : "0 18px 42px rgba(15, 23, 42, 0.14), 0 2px 8px rgba(15, 23, 42, 0.06)");
    setHudStyle("color", "#0f172a");
    setHudStyle("z-index", "180");
    setHudStyle("overflow", "hidden");
    setHudStyle("backdrop-filter", "blur(16px)");
    setHudStyle("-webkit-backdrop-filter", "blur(16px)");

    setChildStyle(header, "min-height", "46px");
    setChildStyle(header, "height", "46px");
    setChildStyle(header, "padding", "10px 12px");
    setChildStyle(header, "background", "rgba(248, 250, 252, 0.72)");
    setChildStyle(header, "border-bottom", collapsed ? "0" : "1px solid rgba(226, 232, 240, 0.76)");
    setChildStyle(header, "border-radius", collapsed ? "999px" : "14px 14px 0 0");
    setChildStyle(title, "color", "#0f172a");
    setChildStyle(title, "font-size", "13px");
    setChildStyle(title, "font-weight", "800");
    setChildStyle(title, "white-space", "nowrap");
    setChildStyle(arrow, "width", "28px");
    setChildStyle(arrow, "height", "28px");
    setChildStyle(arrow, "border-radius", "999px");
    setChildStyle(arrow, "background", "rgba(245, 158, 11, 0.12)");
    setChildStyle(arrow, "border", "1px solid rgba(245, 158, 11, 0.18)");
    setChildStyle(arrow, "color", "#92400e");
    setChildStyle(arrow, "display", "inline-flex");
    setChildStyle(arrow, "align-items", "center");
    setChildStyle(arrow, "justify-content", "center");

    if (body) {
        body.style.setProperty("display", collapsed ? "none" : "block", "important");
        body.style.setProperty("padding", "8px 10px", "important");
        body.style.setProperty("max-height", "none", "important");
        body.style.setProperty("overflow", "visible", "important");
        body.style.setProperty("color", "#334155", "important");
    }
}

function scheduleHudStandard() {
    requestAnimationFrame(applyHudStandard);
    window.setTimeout(applyHudStandard, 80);
    window.setTimeout(applyHudStandard, 320);
}

function syncSceneSliderFill(slider) {
    if (!slider) return;
    const min = Number(slider.min);
    const max = Number(slider.max);
    const val = Number(slider.value);
    const pct = max > min ? ((val - min) / (max - min)) * 100 : 0;
    slider.style.setProperty("--slider-pct", pct + "%");
}

// ==========================================================================
// 2. Canvas 粒子庆祝发生器 (Particles Explosion)
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
        const speed = Math.random() * 4 + 1.5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed - 1.0;
        this.radius = Math.random() * 3 + 1.2;
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

function resizeParticlesCanvas() {
    particlesCanvas.width = window.innerWidth;
    particlesCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeParticlesCanvas);
resizeParticlesCanvas();

function triggerCelebrate(x, y) {
    const colors = ["#10b981", "#34d399", "#60a5fa", "#fbbf24", "#ffffff"];
    for (let i = 0; i < 40; i++) {
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
// 3. 几何运算与 Cabinet 3D 斜投影变换 (3D oblique projection solver)
// ==========================================================================
// 二维向量旋转投影计算
// 给定折痕端点 S(start) 和 E(end)，翻转面上的点 P 在折叠角度 theta 下投影回 2D 坐标
function projectFoldingPoint(P, S, E, thetaRad) {
    // 1. 折痕的方向向量
    const dx = E.x - S.x;
    const dy = E.y - S.y;
    const len = Math.hypot(dx, dy);
    const ux = dx / len;
    const uy = dy / len;

    // 2. 点 P 在折痕线上的正交投影点 Proj
    const t = ((P.x - S.x) * dx + (P.y - S.y) * dy) / (len * len);
    const projX = S.x + t * dx;
    const projY = S.y + t * dy;

    // 3. 自投影点到点 P 的平面法向量 V (在原平面 XY 上)
    const vx = P.x - projX;
    const vy = P.y - projY;

    // 4. 计算折叠时的三维翻折坐标。
    // 在三维空间里，折痕作为旋转轴，V 绕其旋转 theta。
    // P_3d 相对 proj 的局部坐标为: (V_x * cos(theta), V_y * cos(theta), |V| * sin(theta))
    const cosT = Math.cos(thetaRad);
    const sinT = Math.sin(thetaRad);
    const vLen = Math.hypot(vx, vy);

    const x3d = projX + vx * cosT;
    const y3d = projY + vy * cosT;
    const z3d = vLen * sinT; // 升空高度 (Z坐标轴向出屏幕方向)

    // 5. 将三维坐标 (x3d, y3d, z3d) 使用 Cabinet 斜投影绘制到 2D 屏幕上
    // 斜角三维投影公式:
    // x_screen = x3d - 0.25 * z3d (产生少许侧向视差)
    // y_screen = y3d - 0.3 * z3d (向斜上方收缩倾斜，模拟立体悬空)
    const px = x3d - 0.22 * z3d;
    const py = y3d - 0.26 * z3d;

    return { x: px, y: py, z: z3d };
}

// 多边形切割裁剪算法 (Slice Paper Polygon)
// 将平铺矩形纸按折痕线 A*x + B*y + C = 0 切分为固定面和翻转面
function slicePaper() {
    const p1 = creaseStart;
    const p2 = creaseEnd;

    // 折线方程系数
    const A = p2.y - p1.y;
    const B = p1.x - p2.x;
    const C = p2.x * p1.y - p2.y * p1.x;

    function side(p) {
        return A * p.x + B * p.y + C;
    }

    const staticPoly = [];
    const foldingPoly = [];

    // 我们规定：折痕线法向量侧（即 side >= 0 的区域）为固定面（Static），另一侧为翻折面（Folding）
    for (let i = 0; i < paperRect.length; i++) {
        const curr = paperRect[i];
        const next = paperRect[(i + 1) % paperRect.length];

        const currSide = side(curr);
        const nextSide = side(next);

        if (currSide >= 0) {
            staticPoly.push({ x: curr.x, y: curr.y });
        } else {
            foldingPoly.push({ x: curr.x, y: curr.y });
        }

        // 检测边缘与折痕线的交点
        if (currSide * nextSide < 0) {
            const denom = (curr.x - next.x) * (p1.y - p2.y) - (curr.y - next.y) * (p1.x - p2.x);
            const t = ((curr.x - p1.x) * (p1.y - p2.y) - (curr.y - p1.y) * (p1.x - p2.x)) / denom;
            const ix = curr.x + t * (next.x - curr.x);
            const iy = curr.y + t * (next.y - curr.y);

            staticPoly.push({ x: ix, y: iy });
            foldingPoly.push({ x: ix, y: iy });
        }
    }

    // 依中心点极角排序，确保多边形顶点呈顺时针闭合
    const sortPoly = (poly) => {
        if (poly.length === 0) return poly;
        const cx = poly.reduce((sum, p) => sum + p.x, 0) / poly.length;
        const cy = poly.reduce((sum, p) => sum + p.y, 0) / poly.length;
        return poly.sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
    };

    return {
        staticPoly: sortPoly(staticPoly),
        foldingPoly: sortPoly(foldingPoly)
    };
}

// 判定一个点属于固定侧还是翻折侧
function isPointOnFoldingSide(P) {
    const p1 = creaseStart;
    const p2 = creaseEnd;
    const A = p2.y - p1.y;
    const B = p1.x - p2.x;
    const C = p2.x * p1.y - p2.y * p1.x;
    return A * P.x + B * P.y + C < 0;
}

// 求解对称点 (点 A 关于折痕线的轴对称投影点)
function getSymmetricPoint(P) {
    const p1 = creaseStart;
    const p2 = creaseEnd;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len2 = dx * dx + dy * dy;
    
    const t = ((P.x - p1.x) * dx + (P.y - p1.y) * dy) / len2;
    const projX = p1.x + t * dx;
    const projY = p1.y + t * dy;

    return {
        x: 2 * projX - P.x,
        y: 2 * projY - P.y
    };
}

// ==========================================================================
// 4. Canvas 高拟真渲染环 (Graph Rendering Loop)
// ==========================================================================
function renderSandbox() {
    const W = canvas.width / window.devicePixelRatio;
    const H = canvas.height / window.devicePixelRatio;
    
    ctx.clearRect(0, 0, W, H);

    // 1. 划分纸张
    const sliced = slicePaper();
    const thetaRad = (foldAngle / 180) * Math.PI;

    // 2. 绘制纸面底层在桌面上的投影阴影 (Shadow of Static Half & Shadow of Folding Half)
    drawPaperDropShadow(sliced.staticPoly, sliced.foldingPoly, thetaRad);

    // 3. 绘制平铺的固定面卡纸 (Static Half)
    drawStaticPaperHalf(sliced.staticPoly);

    // 4. 绘制悬空三维折叠面纸页 (Folding Half)
    drawFoldingPaperHalf(sliced.foldingPoly, thetaRad);

    // 5. 绘制卡纸上的几何元素 (根据不同探究模式)
    drawGeometryElements(thetaRad);

    // 6. 绘制折痕线及端点操纵手柄 (对称轴)
    drawCreaseLine();
}

// 绘制卡纸在木纹桌面上的投影阴影 (含悬空高度差产生的散焦阴影)
function drawPaperDropShadow(staticPoly, foldingPoly, thetaRad) {
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = 15;
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";

    // 固定面阴影
    if (staticPoly.length > 2) {
        ctx.beginPath();
        staticPoly.forEach((p, idx) => {
            if (idx === 0) ctx.moveTo(p.x, p.y + 4);
            else ctx.lineTo(p.x, p.y + 4);
        });
        ctx.closePath();
        ctx.fill();
    }

    // 翻折折页阴影 (随折起高度 z 移动并变得越发模糊淡化)
    if (foldingPoly.length > 2) {
        ctx.beginPath();
        foldingPoly.forEach((p, idx) => {
            // 计算每个顶点悬起时的投影阴影坐标
            const rotated = projectFoldingPoint(p, creaseStart, creaseEnd, thetaRad);
            // 投影向下偏移 (代表光源自斜上方照射)
            const shadowX = rotated.x + 0.12 * rotated.z;
            const shadowY = rotated.y + 0.18 * rotated.z + 4;
            
            if (idx === 0) ctx.moveTo(shadowX, shadowY);
            else ctx.lineTo(shadowX, shadowY);
        });
        ctx.closePath();
        
        // 随纸张折角增高，投影透明度降低以模拟漫反射阴影淡化
        const maxZ = foldingPoly.reduce((max, p) => {
            const rot = projectFoldingPoint(p, creaseStart, creaseEnd, thetaRad);
            return Math.max(max, rot.z);
        }, 0);
        
        ctx.globalAlpha = Math.max(0.1, 1 - (maxZ / 250));
        ctx.shadowBlur = 15 + maxZ * 0.15;
        ctx.fill();
    }
    ctx.restore();
}

// 绘制平铺在桌面上的固定面
function drawStaticPaperHalf(poly) {
    if (poly.length < 3) return;
    ctx.save();
    
    ctx.shadowColor = "rgba(15, 23, 42, 0.18)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;

    ctx.fillStyle = PAPER_FACE_COLOR;
    ctx.strokeStyle = PAPER_BORDER_COLOR;
    ctx.lineWidth = 2;
    ctx.beginPath();
    poly.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.stroke();

    ctx.clip();
    drawPaperGridPattern();
    ctx.restore();
}

// 绘制悬空旋转的折叠面
function drawFoldingPaperHalf(poly, thetaRad) {
    if (poly.length < 3) return;
    ctx.save();

    // 计算折页三维翻转后的二维外廓多边形
    const projectedPoly = poly.map(p => projectFoldingPoint(p, creaseStart, creaseEnd, thetaRad));

    ctx.beginPath();
    projectedPoly.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();

    ctx.shadowColor = "rgba(15, 23, 42, 0.16)";
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = PAPER_BACK_COLOR;
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = PAPER_BORDER_COLOR;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.clip();
    drawPaperGridPatternRotated(poly, thetaRad);

    // 纸张折角立体渐变阴影 (Specular Shader overlay)
    // 折起 90 度时迎光面较亮，180 度反向平铺时呈背面微弱阴影
    const gradient = ctx.createLinearGradient(creaseStart.x, creaseStart.y, creaseEnd.x, creaseEnd.y);
    const cosT = Math.cos(thetaRad);
    
    if (cosT > 0) {
        // 折起小于90度
        gradient.addColorStop(0, `rgba(255, 255, 255, ${0.15 * (1 - cosT)})`);
        gradient.addColorStop(1, "rgba(0, 0, 0, 0.1)");
    } else {
        // 折起大于90度 (背面迎光)
        gradient.addColorStop(0, "rgba(0, 0, 0, 0.2)");
        gradient.addColorStop(1, `rgba(255, 255, 255, ${0.1 * Math.abs(cosT)})`);
    }
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    projectedPoly.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

// 为平铺纸页画网格
function drawPaperGridPattern() {
    ctx.strokeStyle = PAPER_GRID_COLOR;
    ctx.lineWidth = 1;
    // 简单绘制网格
    for (let x = 0; x < canvas.width; x += 25) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 25) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// 为旋转折纸页投影绘制网格 (保证底纹随翻转而同步翻转)
function drawPaperGridPatternRotated(poly, thetaRad) {
    ctx.strokeStyle = PAPER_GRID_COLOR;
    ctx.lineWidth = 1;

    // 绘制随旋转起伏的局部网格
    // 做法：采样平直卡纸上的平行线点对，然后整体做 3D 旋转投影
    for (let gx = -600; gx < 1200; gx += 25) {
        ctx.beginPath();
        let first = true;
        for (let gy = 0; gy < canvas.height; gy += 15) {
            const P = { x: gx, y: gy };
            if (isPointOnFoldingSide(P)) {
                const rot = projectFoldingPoint(P, creaseStart, creaseEnd, thetaRad);
                if (first) {
                    ctx.moveTo(rot.x, rot.y);
                    first = false;
                } else {
                    ctx.lineTo(rot.x, rot.y);
                }
            }
        }
        ctx.stroke();
    }

    for (let gy = -600; gy < 1200; gy += 25) {
        ctx.beginPath();
        let first = true;
        for (let gx = 0; gx < canvas.width; gx += 15) {
            const P = { x: gx, y: gy };
            if (isPointOnFoldingSide(P)) {
                const rot = projectFoldingPoint(P, creaseStart, creaseEnd, thetaRad);
                if (first) {
                    ctx.moveTo(rot.x, rot.y);
                    first = false;
                } else {
                    ctx.lineTo(rot.x, rot.y);
                }
            }
        }
        ctx.stroke();
    }
}

// 绘制折痕对称轴
function drawCreaseLine() {
    ctx.save();
    
    // 1. 折纸中间的主轴虚线
    ctx.strokeStyle = "#4f46e5";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(creaseStart.x, creaseStart.y);
    ctx.lineTo(creaseEnd.x, creaseEnd.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. 绘制拉条手柄 handle
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#4f46e5";
    ctx.lineWidth = 2.5;
    
    // 端点 1
    ctx.beginPath();
    ctx.arc(creaseStart.x, creaseStart.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 端点 2
    ctx.beginPath();
    ctx.arc(creaseEnd.x, creaseEnd.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();
}

// ==========================================================================
// 5. 绘制交互几何元素与轨迹 (Geometry Layers)
// ==========================================================================
function drawGeometryElements(thetaRad) {
    if (currentMode === "symmetric") {
        // 对称点探究模式
        const isAOnFolding = isPointOnFoldingSide(pointA);
        const staticA = isAOnFolding ? getSymmetricPoint(pointA) : pointA; // 静止点
        const foldingA = isAOnFolding ? pointA : getSymmetricPoint(pointA); // 运动点

        const rotA = projectFoldingPoint(foldingA, creaseStart, creaseEnd, thetaRad); // 运动点的 3D 旋转点
        const targetA = getSymmetricPoint(foldingA); // 180度重合对称目标点

        // A. 绘制对称点轨迹虚弧
        drawFoldingTrajectoryArc(foldingA);
        drawSymmetrySegmentGuides(pointA, getSymmetricPoint(pointA));

        // B. 绘制原静止点 A
        ctx.fillStyle = "#ef4444";
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(staticA.x, staticA.y, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 13px var(--font-math)";
        ctx.fillText("A", staticA.x - 14, staticA.y - 8);

        // C. 绘制翻折运动过程点 A' (悬空投影点)
        ctx.fillStyle = "var(--color-accent)";
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(rotA.x, rotA.y, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "var(--color-accent)";
        ctx.fillText(foldAngle === 180 ? "A'" : "A'", rotA.x + 10, rotA.y - 8);

        // D. 绘制垂直平分特征辅线 (仅在折平 0° 或 180° 时高亮)
        if (foldAngle === 0 || foldAngle === 180) {
            ctx.save();
            ctx.strokeStyle = "rgba(99,102,241,0.5)";
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.moveTo(staticA.x, staticA.y);
            ctx.lineTo(targetA.x, targetA.y);
            ctx.stroke();
            ctx.restore();

            // 绘制垂直角标与平分刻度
            drawBisectorDecorations(staticA, targetA);
        }
    } 
    else if (currentMode === "bisector") {
        // 垂直平分线对折模式
        // 绘制固定的点 A 和 点 B
        ctx.fillStyle = "#ef4444";
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        
        // 点 A
        ctx.beginPath();
        ctx.arc(pointA.x, pointA.y, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 13px var(--font-math)";
        ctx.fillText("A", pointA.x - 14, pointA.y - 8);

        // 点 B
        ctx.fillStyle = "#3b82f6";
        ctx.beginPath();
        ctx.arc(targetB.x, targetB.y, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#3b82f6";
        ctx.fillText("B", targetB.x + 10, targetB.y - 8);

        // 连线段 AB
        ctx.strokeStyle = "rgba(100, 116, 139, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pointA.x, pointA.y);
        ctx.lineTo(targetB.x, targetB.y);
        ctx.stroke();
        drawPerpendicularBisectorGuides();

        // 绘制折叠后 A 的落点 A'
        const isAOnFold = isPointOnFoldingSide(pointA);
        const foldP = isAOnFold ? pointA : targetB;
        const rotA = projectFoldingPoint(foldP, creaseStart, creaseEnd, thetaRad);

        ctx.fillStyle = "var(--color-accent)";
        ctx.beginPath();
        ctx.arc(rotA.x, rotA.y, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "var(--color-accent)";
        ctx.fillText(isAOnFold ? "A'" : "B'", rotA.x + 10, rotA.y - 8);
    } 
    else if (currentMode === "angle") {
        // 角平分线对折模式
        // 绘制角顶点 O, 射线 OA 与 射线 OB
        ctx.strokeStyle = "#f59e0b"; // 橙黄色代表角边
        ctx.lineWidth = 3;
        
        // 射线 OA
        ctx.beginPath();
        ctx.moveTo(angleVertexO.x, angleVertexO.y);
        ctx.lineTo(rayAEnd.x, rayAEnd.y);
        ctx.stroke();

        // 射线 OB
        ctx.beginPath();
        ctx.moveTo(angleVertexO.x, angleVertexO.y);
        ctx.lineTo(rayBEnd.x, rayBEnd.y);
        ctx.stroke();

        // 顶点 O
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(angleVertexO.x, angleVertexO.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#1e293b";
        ctx.font = "bold 13px var(--font-math)";
        ctx.fillText("O (顶点)", angleVertexO.x - 20, angleVertexO.y + 20);
        ctx.fillText("A", rayAEnd.x - 14, rayAEnd.y - 6);
        ctx.fillText("B", rayBEnd.x + 10, rayBEnd.y + 16);
        drawAngleBisectorGuides();

        // 绘制对折射线 OA 的翻转轨迹。
        // 我们计算射线端点 A 的翻折投影点 rotA
        const isRayAOnFold = isPointOnFoldingSide(rayAEnd);
        const foldP = isRayAOnFold ? rayAEnd : rayBEnd;
        const rotA = projectFoldingPoint(foldP, creaseStart, creaseEnd, thetaRad);

        ctx.strokeStyle = "var(--color-accent)";
        ctx.lineWidth = 3;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(angleVertexO.x, angleVertexO.y);
        ctx.lineTo(rotA.x, rotA.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // 绘制翻折后的射线端点 A' 标签
        ctx.fillStyle = "var(--color-accent)";
        ctx.fillText("A'", rotA.x + 10, rotA.y - 8);
    }
}

// 绘制运动点围绕折痕做 3D 旋转的三维抛物虚弧线
function drawFoldingTrajectoryArc(foldingPoint) {
    ctx.save();
    ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();

    let first = true;
    for (let a = 0; a <= 180; a += 4) {
        const rad = (a / 180) * Math.PI;
        const rot = projectFoldingPoint(foldingPoint, creaseStart, creaseEnd, rad);
        if (first) {
            ctx.moveTo(rot.x, rot.y);
            first = false;
        } else {
            ctx.lineTo(rot.x, rot.y);
        }
    }
    ctx.stroke();
    ctx.restore();
}

// 绘制垂直直角角标和平分线段等长短划线
function drawBisectorDecorations(A, APrime) {
    const dx = APrime.x - A.x;
    const dy = APrime.y - A.y;
    const len = Math.hypot(dx, dy);
    if (len < 5) return;

    // 中点 Mid
    const midX = (A.x + APrime.x) / 2;
    const midY = (A.y + APrime.y) / 2;

    // 对称轴方向向量
    const cDx = creaseEnd.x - creaseStart.x;
    const cDy = creaseEnd.y - creaseStart.y;
    const cLen = Math.hypot(cDx, cDy);
    const ux = cDx / cLen;
    const uy = cDy / cLen;

    // 垂直线方向向量 (从 Mid 指向 APrime)
    const vx = dx / len;
    const vy = dy / len;

    // 1. 绘制垂直直角符号
    const sz = 8;
    const px = midX + vx * sz;
    const py = midY + vy * sz;
    const qx = px + ux * sz;
    const qy = py + uy * sz;
    const rx = midX + ux * sz;
    const ry = midY + uy * sz;

    ctx.save();
    ctx.strokeStyle = "rgba(99, 102, 241, 0.8)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(qx, qy);
    ctx.lineTo(rx, ry);
    ctx.stroke();
    ctx.restore();

    // 2. 绘制等长双短划线标记 (线段 AM 与 M A')
    const drawTick = (centerX, centerY) => {
        const tSz = 4;
        ctx.beginPath();
        // 第一道线
        ctx.moveTo(centerX - ux * tSz + vx * 2, centerY - uy * tSz + vy * 2);
        ctx.lineTo(centerX + ux * tSz + vx * 2, centerY + uy * tSz + vy * 2);
        // 第二道线
        ctx.moveTo(centerX - ux * tSz - vx * 2, centerY - uy * tSz - vy * 2);
        ctx.lineTo(centerX + ux * tSz - vx * 2, centerY + uy * tSz - vy * 2);
        ctx.stroke();
    };

    ctx.save();
    ctx.strokeStyle = "#4f46e5";
    ctx.lineWidth = 1.2;
    
    // AM 中点
    const midAMX = (A.x + midX) / 2;
    const midAMY = (A.y + midY) / 2;
    drawTick(midAMX, midAMY);

    // M A' 中点
    const midMAX = (APrime.x + midX) / 2;
    const midMAY = (APrime.y + midY) / 2;
    drawTick(midMAX, midMAY);

    ctx.restore();
}

function projectPointOnLine(point, lineStart, lineEnd) {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq < 1) return { x: lineStart.x, y: lineStart.y, t: 0 };
    const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lenSq;
    return {
        x: lineStart.x + dx * t,
        y: lineStart.y + dy * t,
        t
    };
}

function distancePointToLine(point, lineStart, lineEnd) {
    const projection = projectPointOnLine(point, lineStart, lineEnd);
    return Math.hypot(point.x - projection.x, point.y - projection.y);
}

function drawReadableLabel(text, x, y, color = "#0f172a", align = "center") {
    ctx.save();
    ctx.font = "700 13px var(--font-math)";
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.92)";
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
}

function pointAlongSegment(start, end, t) {
    return {
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t
    };
}

function unitVector(vector) {
    const len = Math.max(1, Math.hypot(vector.x, vector.y));
    return { x: vector.x / len, y: vector.y / len };
}

function perpendicularVector(vector) {
    const u = unitVector(vector);
    return { x: -u.y, y: u.x };
}

function isCreaseNearPerpendicularBisector(M, abAxis, creaseAxis) {
    const distanceToMidpoint = distancePointToLine(M, creaseStart, creaseEnd);
    const abUnit = unitVector(abAxis);
    const creaseUnit = unitVector(creaseAxis);
    const perpendicularError = Math.abs(abUnit.x * creaseUnit.x + abUnit.y * creaseUnit.y);
    return distanceToMidpoint <= 12 && perpendicularError <= 0.12;
}

function isCreaseNearAngleBisector() {
    const distanceToVertex = distancePointToLine(angleVertexO, creaseStart, creaseEnd);
    const creaseUnit = unitVector({ x: creaseEnd.x - creaseStart.x, y: creaseEnd.y - creaseStart.y });
    const bisectorUnit = getAngleBisectorUnit();
    const directionMatch = Math.abs(creaseUnit.x * bisectorUnit.x + creaseUnit.y * bisectorUnit.y);
    return distanceToVertex <= 12 && directionMatch >= 0.992;
}

function drawRightAngleMarker(origin, axisA, axisB, size = 14, color = "#2563eb") {
    const lenA = Math.hypot(axisA.x, axisA.y);
    const lenB = Math.hypot(axisB.x, axisB.y);
    if (lenA < 1 || lenB < 1) return;
    const ax = axisA.x / lenA;
    const ay = axisA.y / lenA;
    const bx = axisB.x / lenB;
    const by = axisB.y / lenB;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(origin.x + ax * size, origin.y + ay * size);
    ctx.lineTo(origin.x + ax * size + bx * size, origin.y + ay * size + by * size);
    ctx.lineTo(origin.x + bx * size, origin.y + by * size);
    ctx.stroke();
    ctx.restore();
}

function drawEqualTick(point, normal, color = "#2563eb") {
    const len = Math.hypot(normal.x, normal.y);
    if (len < 1) return;
    const nx = normal.x / len;
    const ny = normal.y / len;
    const half = 7;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(point.x - nx * half, point.y - ny * half);
    ctx.lineTo(point.x + nx * half, point.y + ny * half);
    ctx.stroke();
    ctx.restore();
}

function drawSymmetrySegmentGuides(A, APrime) {
    const dx = APrime.x - A.x;
    const dy = APrime.y - A.y;
    const len = Math.hypot(dx, dy);
    if (len < 8) return;

    const M = { x: (A.x + APrime.x) / 2, y: (A.y + APrime.y) / 2 };
    const creaseAxis = { x: creaseEnd.x - creaseStart.x, y: creaseEnd.y - creaseStart.y };
    const segmentAxis = { x: dx, y: dy };

    ctx.save();
    ctx.strokeStyle = "rgba(37, 99, 235, 0.72)";
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(APrime.x, APrime.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    drawRightAngleMarker(M, creaseAxis, segmentAxis, 13, "#2563eb");
    drawEqualTick({ x: (A.x + M.x) / 2, y: (A.y + M.y) / 2 }, creaseAxis, "#2563eb");
    drawEqualTick({ x: (APrime.x + M.x) / 2, y: (APrime.y + M.y) / 2 }, creaseAxis, "#2563eb");

    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(M.x, M.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    drawReadableLabel("AA'", M.x, M.y - 26, "#1d4ed8");
    drawReadableLabel("M", M.x + 18, M.y + 16, "#1d4ed8", "left");
    drawReadableLabel("AM = MA'", M.x, M.y + 34, "#047857");
    drawReadableLabel("l ⟂ AA'", M.x, M.y - 44, "#7c2d12");
}

function drawPerpendicularBisectorGuides() {
    const M = { x: (pointA.x + targetB.x) / 2, y: (pointA.y + targetB.y) / 2 };
    const abAxis = { x: targetB.x - pointA.x, y: targetB.y - pointA.y };
    const creaseAxis = { x: creaseEnd.x - creaseStart.x, y: creaseEnd.y - creaseStart.y };
    const foot = projectPointOnLine(M, creaseStart, creaseEnd);
    if (!isCreaseNearPerpendicularBisector(M, abAxis, creaseAxis)) {
        drawBisectorAlignmentHint(M, foot, abAxis);
        return;
    }
    const P = {
        x: foot.x + (creaseAxis.x / Math.max(1, Math.hypot(creaseAxis.x, creaseAxis.y))) * 82,
        y: foot.y + (creaseAxis.y / Math.max(1, Math.hypot(creaseAxis.x, creaseAxis.y))) * 82
    };

    drawRightAngleMarker(M, abAxis, creaseAxis, 14, "#2563eb");
    drawEqualTick({ x: (pointA.x + M.x) / 2, y: (pointA.y + M.y) / 2 }, creaseAxis, "#2563eb");
    drawEqualTick({ x: (targetB.x + M.x) / 2, y: (targetB.y + M.y) / 2 }, creaseAxis, "#2563eb");

    ctx.save();
    ctx.strokeStyle = "rgba(5, 150, 105, 0.68)";
    ctx.lineWidth = 1.8;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(P.x, P.y);
    ctx.lineTo(pointA.x, pointA.y);
    ctx.moveTo(P.x, P.y);
    ctx.lineTo(targetB.x, targetB.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#059669";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(P.x, P.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    drawPerpendicularBisectorGuideLabels(M, P, abAxis, creaseAxis);
}

function drawBisectorAlignmentHint(M, foot, abAxis) {
    const abNormal = perpendicularVector(abAxis);
    const abUnit = unitVector(abAxis);
    const hintNormal = abNormal.y > 0 ? { x: -abNormal.x, y: -abNormal.y } : abNormal;
    const mNormal = { x: -hintNormal.x, y: -hintNormal.y };
    ctx.save();
    ctx.strokeStyle = "rgba(220, 38, 38, 0.62)";
    ctx.lineWidth = 1.8;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(M.x, M.y);
    ctx.lineTo(foot.x, foot.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(M.x, M.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    drawReadableLabel("M", M.x + mNormal.x * 20, M.y + mNormal.y * 20, "#1d4ed8");
    const hintAnchor = pointAlongSegment(M, foot, 0.5);
    drawReadableLabel("折痕需过 M", hintAnchor.x + hintNormal.x * 28 + abUnit.x * 18, hintAnchor.y + hintNormal.y * 28 + abUnit.y * 18, "#b91c1c");
}

function drawPerpendicularBisectorGuideLabels(M, P, abAxis, creaseAxis) {
    const abNormal = perpendicularVector(abAxis);
    const creaseNormal = perpendicularVector(creaseAxis);
    const mLabel = {
        x: M.x + abNormal.x * 23 + unitVector(abAxis).x * 10,
        y: M.y + abNormal.y * 23 + unitVector(abAxis).y * 10
    };
    const pLabel = {
        x: P.x + creaseNormal.x * 19,
        y: P.y + creaseNormal.y * 19
    };
    const equalityAnchor = pointAlongSegment(P, targetB, 0.42);
    const equalityLabel = {
        x: equalityAnchor.x + creaseNormal.x * 15,
        y: equalityAnchor.y + creaseNormal.y * 15
    };

    drawReadableLabel("M", mLabel.x, mLabel.y, "#1d4ed8");
    drawReadableLabel("P", pLabel.x, pLabel.y, "#047857");
    drawReadableLabel("PA = PB", equalityLabel.x, equalityLabel.y, "#047857");
}

function angleBetween(start, end) {
    return Math.atan2(end.y - start.y, end.x - start.x);
}

function normalizeAngle(angle) {
    while (angle < 0) angle += Math.PI * 2;
    while (angle >= Math.PI * 2) angle -= Math.PI * 2;
    return angle;
}

function drawAngleArc(center, radius, startAngle, endAngle, color, label) {
    let start = normalizeAngle(startAngle);
    let end = normalizeAngle(endAngle);
    if (end < start) end += Math.PI * 2;
    if (end - start > Math.PI) {
        const tmp = start;
        start = end;
        end = tmp + Math.PI * 2;
    }

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, start, end);
    ctx.stroke();
    ctx.restore();

    drawAngleArcLabel(center, radius, start, end, color, label);
}

function drawAngleArcLabel(center, radius, startAngle, endAngle, color, label) {
    const mid = (startAngle + endAngle) / 2;
    const labelRadius = Math.max(24, radius - 14);
    drawReadableLabel(
        label,
        center.x + Math.cos(mid) * labelRadius,
        center.y + Math.sin(mid) * labelRadius,
        color
    );
}

function drawEqualAngleArcs() {
    const angleA = angleBetween(angleVertexO, rayAEnd);
    const angleB = angleBetween(angleVertexO, rayBEnd);
    let creaseAngle = Math.atan2(creaseEnd.y - creaseStart.y, creaseEnd.x - creaseStart.x);
    const opposite = normalizeAngle(creaseAngle + Math.PI);
    const midAngle = normalizeAngle((angleA + angleB) / 2);
    if (Math.abs(normalizeAngle(opposite - midAngle)) < Math.abs(normalizeAngle(creaseAngle - midAngle))) {
        creaseAngle = opposite;
    }

    drawAngleArc(angleVertexO, 48, angleA, creaseAngle, "#2563eb", "∠1");
    drawAngleArc(angleVertexO, 68, creaseAngle, angleB, "#2563eb", "∠2");
}

function drawAngleBisectorGuides() {
    const creaseAxis = { x: creaseEnd.x - creaseStart.x, y: creaseEnd.y - creaseStart.y };
    const axisLen = Math.hypot(creaseAxis.x, creaseAxis.y);
    if (axisLen < 1) return;
    if (!isCreaseNearAngleBisector()) {
        drawAngleAlignmentHint();
        return;
    }
    let ux = creaseAxis.x / axisLen;
    let uy = creaseAxis.y / axisLen;
    if (ux < 0) {
        ux *= -1;
        uy *= -1;
    }
    const P = { x: angleVertexO.x + ux * 230, y: angleVertexO.y + uy * 230 };

    ctx.save();
    ctx.strokeStyle = "rgba(37, 99, 235, 0.72)";
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.moveTo(angleVertexO.x, angleVertexO.y);
    ctx.lineTo(P.x, P.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    drawEqualAngleArcs();
    const opLabelAnchor = pointAlongSegment(angleVertexO, P, 0.46);
    const opNormal = perpendicularVector({ x: ux, y: uy });
    drawReadableLabel("OP", opLabelAnchor.x + opNormal.x * 15, opLabelAnchor.y + opNormal.y * 15, "#1d4ed8");

    const equationAnchor = pointAlongSegment(angleVertexO, rayBEnd, 0.46);
    drawReadableLabel("∠AOP = ∠POB", equationAnchor.x, equationAnchor.y - 26, "#047857");
}

function drawAngleAlignmentHint() {
    const bisectorUnit = getAngleBisectorUnit();
    const guideEnd = {
        x: angleVertexO.x + bisectorUnit.x * 190,
        y: angleVertexO.y + bisectorUnit.y * 190
    };
    const guideStart = {
        x: angleVertexO.x - bisectorUnit.x * 34,
        y: angleVertexO.y - bisectorUnit.y * 34
    };
    ctx.save();
    ctx.strokeStyle = "rgba(220, 38, 38, 0.62)";
    ctx.lineWidth = 1.8;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(guideStart.x, guideStart.y);
    ctx.lineTo(guideEnd.x, guideEnd.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    const normal = perpendicularVector(bisectorUnit);
    const labelAnchor = pointAlongSegment(angleVertexO, guideEnd, 0.46);
    drawReadableLabel("折痕需过 O", labelAnchor.x + normal.x * 18, labelAnchor.y + normal.y * 18, "#b91c1c");
}

function getAngleBisectorUnit() {
    const v1x = rayAEnd.x - angleVertexO.x;
    const v1y = rayAEnd.y - angleVertexO.y;
    const v2x = rayBEnd.x - angleVertexO.x;
    const v2y = rayBEnd.y - angleVertexO.y;
    const len1 = Math.max(1, Math.hypot(v1x, v1y));
    const len2 = Math.max(1, Math.hypot(v2x, v2y));
    let ux = v1x / len1 + v2x / len2;
    let uy = v1y / len1 + v2y / len2;
    const len = Math.max(1, Math.hypot(ux, uy));
    ux /= len;
    uy /= len;
    return { x: ux, y: uy };
}

function setAngleBisectorCrease() {
    const bisectorUnit = getAngleBisectorUnit();
    creaseStart = { x: angleVertexO.x - bisectorUnit.x * 175, y: angleVertexO.y - bisectorUnit.y * 175 };
    creaseEnd = { x: angleVertexO.x + bisectorUnit.x * 280, y: angleVertexO.y + bisectorUnit.y * 280 };
}

// ==========================================================================
// 6. 锁定匹配器与模式验证状态机 (Verifier & Modes Sync)
// ==========================================================================
function checkCompletion() {
    if (foldAngle !== 180) {
        updateChalkboardStatus("scanning", "纸张未折平，调节角度到 180° 以便核验。");
        return;
    }

    if (currentMode === "symmetric") {
        // 对称点模式是自由沙盒，始终是安全态
        updateChalkboardStatus("safe", "对称点对折完成！折痕是 A 与 A' 连线的垂直平分线。");
    } 
    else if (currentMode === "bisector") {
        // 垂直平分线模式：核验点 A 的对称点 A' 是否能精准重合在点 B 处
        const APrime = getSymmetricPoint(pointA);
        const dist = Math.hypot(APrime.x - targetB.x, APrime.y - targetB.y);

        if (dist < 10) {
            // 重合对齐成功！
            updateChalkboardStatus("safe", "🎉 完美重合！当前的折痕线正是线段 AB 的垂直平分线！");
            triggerCelebrate(targetB.x, targetB.y); // 在 B 处开花
        } else {
            updateChalkboardStatus("alert", "❌ 对折失败：折叠后点 A 没有落在点 B 上。请拖拽折痕改变对称轴位置！");
        }
    } 
    else if (currentMode === "angle") {
        // 角平分线模式：核验射线 OA 的对称线 OA' 是否落在射线 OB 上
        const symRayEnd = getSymmetricPoint(rayAEnd);
        
        // 计算两个向量的夹角: OA' 向量 与 OB 向量
        const v1x = symRayEnd.x - angleVertexO.x;
        const v1y = symRayEnd.y - angleVertexO.y;
        const v2x = rayBEnd.x - angleVertexO.x;
        const v2y = rayBEnd.y - angleVertexO.y;

        const angle1 = Math.atan2(v1y, v1x);
        const angle2 = Math.atan2(v2y, v2x);
        
        let diff = Math.abs(angle1 - angle2);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;

        if (diff < 0.05) { // 夹角差小于 3 度
            updateChalkboardStatus("safe", "🎉 完美重合！当前的折痕正是角 AOB 的角平分线！");
            triggerCelebrate(rayBEnd.x, rayBEnd.y);
        } else {
            updateChalkboardStatus("alert", "❌ 对折失败：射线 OA 没有重合在 OB 上。请拖拽折痕端点调整对称轴！");
        }
    }
}

function updateChalkboardStatus(status, text) {
    sandboxStatusDot.className = "status-indicator-dot";
    if (status === "alert") {
        sandboxStatusDot.classList.add("alert");
    } else if (status === "scanning") {
        sandboxStatusDot.classList.add("scanning");
    } else if (status === "safe") {
        sandboxStatusDot.classList.add("safe");
    }
    sandboxStatusText.innerHTML = text;

    renderChalkboard();
}

// 渲染板书 HUD 卡片
function renderProofLadder() {
    if (currentMode === "symmetric") {
        return `
            <div class="fold-proof-ladder">
                <div class="hud-row">
                    <div class="hud-row-label">操作</div>
                    <div class="hud-row-val">拖动点 A 或折痕 l，观察 A ↔ A' 的对应关系。</div>
                </div>
                <div class="hud-row">
                    <div class="hud-row-label">观察</div>
                    <div class="hud-row-val"><span class="math-highlight-blue">AA'</span> 与折痕相交于中点 M，且 <span class="math-highlight-green">AM = MA'</span>。</div>
                </div>
                <div class="hud-row">
                    <div class="hud-row-label">结论</div>
                    <div class="hud-row-val">折痕 l 是 AA' 的垂直平分线：<span class="math-highlight-orange">l ⟂ AA'</span>。</div>
                </div>
            </div>
        `;
    }

    if (currentMode === "bisector") {
        const APrime = getSymmetricPoint(pointA);
        const dist = Math.hypot(APrime.x - targetB.x, APrime.y - targetB.y);
        const isMatched = dist < 10;
        return `
            <div class="fold-proof-ladder">
                <div class="hud-row">
                    <div class="hud-row-label">任务</div>
                    <div class="hud-row-val">调节折痕并折到 180°，让点 A 与点 B 完全重合。</div>
                </div>
                <div class="hud-row">
                    <div class="hud-row-label">判定</div>
                    <div class="hud-row-val">当前偏差 ${(dist / 10).toFixed(1)} cm，${isMatched ? "<span class='math-highlight-green'>已重合</span>" : "<span class='math-glow-red'>未重合</span>"}。</div>
                </div>
                <div class="hud-row">
                    <div class="hud-row-label">结论</div>
                    <div class="hud-row-val">折痕是 AB 的垂直平分线；折痕上任意点 P 满足 <span class="math-highlight-green">PA = PB</span>。</div>
                </div>
            </div>
        `;
    }

    const symRayEnd = getSymmetricPoint(rayAEnd);
    const v1x = symRayEnd.x - angleVertexO.x;
    const v1y = symRayEnd.y - angleVertexO.y;
    const v2x = rayBEnd.x - angleVertexO.x;
    const v2y = rayBEnd.y - angleVertexO.y;
    const angle1 = Math.atan2(v1y, v1x);
    const angle2 = Math.atan2(v2y, v2x);
    let diff = Math.abs(angle1 - angle2);
    if (diff > Math.PI) diff = Math.PI * 2 - diff;

    return `
        <div class="fold-proof-ladder">
            <div class="hud-row">
                <div class="hud-row-label">任务</div>
                <div class="hud-row-val">拖动折痕，使射线 OA 折叠后与 OB 重合。</div>
            </div>
            <div class="hud-row">
                <div class="hud-row-label">判定</div>
                <div class="hud-row-val">两边夹角偏差 ${((diff * 180) / Math.PI).toFixed(1)}°。</div>
            </div>
            <div class="hud-row">
                <div class="hud-row-label">结论</div>
                <div class="hud-row-val">折痕 OP 是角平分线：<span class="math-highlight-green">∠AOP = ∠POB</span>。</div>
            </div>
        </div>
    `;
}

function renderChalkboard() {
    stepsChalkboard.innerHTML = renderProofLadder();
    return;

    let html = "";

    if (currentMode === "symmetric") {
        html += `
            <div class="hud-row">
                <div class="hud-row-label">折叠几何公理</div>
                <div class="hud-row-val">折纸对折本质是<strong>轴对称变换</strong>，折痕即是对称轴。</div>
            </div>
            <div class="hud-row">
                <div class="hud-row-label">垂直平分特征</div>
                <div class="hud-row-val">
                    对称点连线被折痕垂直平分：<br>
                    1. 连线 <span class="math-highlight-blue">AA' &perp; 折痕 L</span><br>
                    2. 距离 <span class="math-highlight-green">d(A, L) = d(A', L)</span>
                </div>
            </div>
        `;
    } 
    else if (currentMode === "bisector") {
        const APrime = getSymmetricPoint(pointA);
        const dist = Math.hypot(APrime.x - targetB.x, APrime.y - targetB.y);
        const isMatched = dist < 10;

        html += `
            <div class="hud-row">
                <div class="hud-row-label">探究任务</div>
                <div class="hud-row-val">拖动折痕并折起纸页，使 <span class="math-highlight-orange">点 A 落在点 B 上</span>。</div>
            </div>
            <div class="hud-row">
                <div class="hud-row-label">当前对折状态</div>
                <div class="hud-row-val">
                    折叠后两点距离：${(dist / 10).toFixed(1)} cm <br>
                    ${isMatched ? "<span class='math-highlight-green'>已重合</span>" : "<span class='math-glow-red'>未重合</span>"}
                </div>
            </div>
        `;

        if (isMatched && foldAngle === 180) {
            html += `
                <div class="hud-verdict-box">
                    <div class="verdict-title">✔ 垂直平分线生成：</div>
                    <div class="verdict-desc">把点对折重合是作垂直平分线最直观的物理方法。此时折痕线 <span class="math-highlight-green">L</span> 就是线段 <span class="math-highlight-blue">AB</span> 的垂直平分线。</div>
                </div>
            `;
        }
    } 
    else if (currentMode === "angle") {
        const symRayEnd = getSymmetricPoint(rayAEnd);
        const v1x = symRayEnd.x - angleVertexO.x;
        const v1y = symRayEnd.y - angleVertexO.y;
        const v2x = rayBEnd.x - angleVertexO.x;
        const v2y = rayBEnd.y - angleVertexO.y;
        const angle1 = Math.atan2(v1y, v1x);
        const angle2 = Math.atan2(v2y, v2x);
        let diff = Math.abs(angle1 - angle2);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;
        
        const isMatched = diff < 0.05;

        html += `
            <div class="hud-row">
                <div class="hud-row-label">探究任务</div>
                <div class="hud-row-val">拖动折痕进行折叠，使射线 <span class="math-highlight-orange">OA 与 OB 重合</span>。</div>
            </div>
            <div class="hud-row">
                <div class="hud-row-label">当前对角状态</div>
                <div class="hud-row-val">
                    两边偏差夹角：${((diff * 180) / Math.PI).toFixed(1)}° <br>
                    ${isMatched ? "<span class='math-highlight-green'>两边已完全对折重合</span>" : "<span class='math-glow-red'>未重合</span>"}
                </div>
            </div>
        `;

        if (isMatched && foldAngle === 180) {
            html += `
                <div class="hud-verdict-box">
                    <div class="verdict-title">✔ 角平分线已生成：</div>
                    <div class="verdict-desc">将角的两边折叠重合所得的折痕线，就是该角的<strong>角平分线</strong>。角平分线上的任意点到角两边的距离相等。</div>
                </div>
            `;
        }
    }

    stepsChalkboard.innerHTML = html;
}

// ==========================================================================
// 7. 模式切换与辅助渲染面板 (Mode Controllers Panel)
// ==========================================================================
function switchMode(mode) {
    currentMode = mode;
    foldAngle = 0;
    sliderFoldAngle.value = 0;
    angleValLbl.textContent = "0°";
    syncSceneSliderFill(sliderFoldAngle);
    isAutoFolding = false;
    clearInterval(autoFoldInterval);
    btnFoldAuto.textContent = "自动折叠";
    btnFoldAuto.classList.remove("active-run");

    // 激活模式样式
    document.querySelectorAll(".btn-mode").forEach(btn => {
        if (btn.getAttribute("data-mode") === mode) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    // 重置几何参数以防坐标越界
    resetParameters();
    renderInteractiveControls();
    renderSandbox();
    checkCompletion();
}

function resetParameters() {
    const W = canvas.width / window.devicePixelRatio;
    const H = canvas.height / window.devicePixelRatio;
    const cx = W / 2;
    const cy = H / 2;

    if (currentMode === "symmetric") {
        // Fold line: vertical in center
        creaseStart = { x: cx, y: cy - 170 };
        creaseEnd = { x: cx, y: cy + 170 };
        // Point A on the left
        pointA = { x: cx - 110, y: cy - 20 };
    } 
    else if (currentMode === "bisector") {
        // Point A and B symmetrical
        pointA = { x: cx - 110, y: cy };
        targetB = { x: cx + 110, y: cy };
        // Crease initially off-center and slightly tilted
        creaseStart = { x: cx - 30, y: cy - 170 };
        creaseEnd = { x: cx + 30, y: cy + 170 };
    } 
    else if (currentMode === "angle") {
        // Vertex O on bottom-left, ray OB horizontal to the right, ray OA going up-left
        angleVertexO = { x: cx - 120, y: cy + 80 };
        rayAEnd = { x: cx - 160, y: cy - 80 };
        rayBEnd = { x: cx + 120, y: cy + 80 };
        
        setAngleBisectorCrease();
    }
}

// 动态渲染右侧的辅助操作项
function renderInteractiveControls() {
    modeInteractiveActions.innerHTML = "";

    if (currentMode === "symmetric") {
        const card = document.createElement("div");
        card.className = "interactive-action-card compact-action-card";
        card.innerHTML = `
            <div class="action-buttons-row">
                <button class="btn-mini-control" id="btn-snap-vertical">垂直折线 (快速归正)</button>
            </div>
        `;
        modeInteractiveActions.appendChild(card);

        document.getElementById("btn-snap-vertical").addEventListener("click", () => {
            playClickSound();
            creaseStart = { x: 300, y: 120 };
            creaseEnd = { x: 300, y: 460 };
            renderSandbox();
            checkCompletion();
        });
    } 
    else if (currentMode === "bisector") {
        const card = document.createElement("div");
        card.className = "interactive-action-card compact-action-card";
        card.innerHTML = `
            <div class="action-buttons-row">
                <button class="btn-mini-control" id="btn-helper-bisect">一键生成正确折痕</button>
            </div>
        `;
        modeInteractiveActions.appendChild(card);

        document.getElementById("btn-helper-bisect").addEventListener("click", () => {
            playClickSound();
            // 直接计算线段 AB 的垂直平分线并赋予折线
            const midX = (pointA.x + targetB.x) / 2;
            const midY = (pointA.y + targetB.y) / 2;
            
            // 垂直方向向量
            const dx = targetB.x - pointA.x;
            const dy = targetB.y - pointA.y;
            
            // 垂直斜率
            const ux = -dy;
            const uy = dx;

            creaseStart = { x: midX - ux * 0.8, y: midY - uy * 0.8 };
            creaseEnd = { x: midX + ux * 0.8, y: midY + uy * 0.8 };

            renderSandbox();
            checkCompletion();
        });
    } 
    else if (currentMode === "angle") {
        const card = document.createElement("div");
        card.className = "interactive-action-card compact-action-card";
        card.innerHTML = `
            <div class="action-buttons-row">
                <button class="btn-mini-control" id="btn-helper-angle">一键生成角平分线折痕</button>
            </div>
        `;
        modeInteractiveActions.appendChild(card);

        document.getElementById("btn-helper-angle").addEventListener("click", () => {
            playClickSound();
            setAngleBisectorCrease();

            renderSandbox();
            checkCompletion();
        });
    }
}

// ==========================================================================
// 8. 交互事件响应与画布初始化 (Events & Canvas Loop)
// ==========================================================================
let prevCx = null;
let prevCy = null;

function updateCentering(cx, cy) {
    if (prevCx !== null && prevCy !== null) {
        const dx = cx - prevCx;
        const dy = cy - prevCy;
        
        creaseStart.x += dx;
        creaseStart.y += dy;
        creaseEnd.x += dx;
        creaseEnd.y += dy;
        
        pointA.x += dx;
        pointA.y += dy;
        targetB.x += dx;
        targetB.y += dy;
        
        angleVertexO.x += dx;
        angleVertexO.y += dy;
        rayAEnd.x += dx;
        rayAEnd.y += dy;
        rayBEnd.x += dx;
        rayBEnd.y += dy;
    }
    prevCx = cx;
    prevCy = cy;
}

function initCanvasEvents() {
    // 适配高清屏分辨率
    const rect = canvasContainer.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    // 锁定卡纸在画布中心
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    paperRect = [
        { x: cx - paperWidth / 2, y: cy - paperHeight / 2 },
        { x: cx + paperWidth / 2, y: cy - paperHeight / 2 },
        { x: cx + paperWidth / 2, y: cy + paperHeight / 2 },
        { x: cx - paperWidth / 2, y: cy + paperHeight / 2 }
    ];

    updateCentering(cx, cy);

    // 检测点击距离
    const clickRadius = DRAG_HIT_RADIUS;

    const handlePointerDown = (e) => {
        const cRect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - cRect.left;
        const mouseY = e.clientY - cRect.top;

        // 1. 检查是否点在折痕端点 Handle 上
        if (Math.hypot(mouseX - creaseStart.x, mouseY - creaseStart.y) < clickRadius) {
            activeCreaseHandle = "start";
            canvas.setPointerCapture(e.pointerId || 1);
            return;
        }
        if (Math.hypot(mouseX - creaseEnd.x, mouseY - creaseEnd.y) < clickRadius) {
            activeCreaseHandle = "end";
            canvas.setPointerCapture(e.pointerId || 1);
            return;
        }

        // 2. 在对称模式下，检查是否点在点 A 上
        if (currentMode === "symmetric") {
            const isAOnFolding = isPointOnFoldingSide(pointA);
            const staticA = isAOnFolding ? getSymmetricPoint(pointA) : pointA;

            if (Math.hypot(mouseX - staticA.x, mouseY - staticA.y) < clickRadius) {
                isDraggingPointA = true;
                canvas.setPointerCapture(e.pointerId || 1);
            }
        }
    };

    const handlePointerMove = (e) => {
        const cRect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - cRect.left;
        const mouseY = e.clientY - cRect.top;

        // 执行折线拖动
        if (activeCreaseHandle) {
            if (activeCreaseHandle === "start") {
                creaseStart = { x: mouseX, y: mouseY };
            } else {
                creaseEnd = { x: mouseX, y: mouseY };
            }
            renderSandbox();
            checkCompletion();
        }

        // 执行点 A 拖动 (对称模式且不能超出纸面边界太多)
        if (isDraggingPointA) {
            const isAOnFolding = isPointOnFoldingSide(pointA);
            if (isAOnFolding) {
                // 如果 A 在翻转侧，我们实际拖拽其平面位置
                const sym = getSymmetricPoint({ x: mouseX, y: mouseY });
                pointA = sym;
            } else {
                pointA = { x: mouseX, y: mouseY };
            }
            renderSandbox();
            checkCompletion();
        }
    };

    const handlePointerUp = (e) => {
        if (activeCreaseHandle) {
            canvas.releasePointerCapture(e.pointerId || 1);
            activeCreaseHandle = null;
        }
        if (isDraggingPointA) {
            canvas.releasePointerCapture(e.pointerId || 1);
            isDraggingPointA = false;
        }
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
}

function handleResize() {
    const rect = canvasContainer.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const cx = rect.width / 2;
    const cy = rect.height / 2;
    paperRect = [
        { x: cx - paperWidth / 2, y: cy - paperHeight / 2 },
        { x: cx + paperWidth / 2, y: cy - paperHeight / 2 },
        { x: cx + paperWidth / 2, y: cy + paperHeight / 2 },
        { x: cx - paperWidth / 2, y: cy + paperHeight / 2 }
    ];

    updateCentering(cx, cy);
    renderSandbox();
}
window.addEventListener("resize", handleResize);

// 自动折叠动画
function toggleAutoFold() {
    if (isAutoFolding) {
        clearInterval(autoFoldInterval);
        isAutoFolding = false;
        btnFoldAuto.textContent = "自动折叠";
        btnFoldAuto.classList.remove("active-run");
        return;
    }

    isAutoFolding = true;
    btnFoldAuto.textContent = "暂停折叠";
    btnFoldAuto.classList.add("active-run");

    // 决定往哪个方向折叠
    const targetAngle = foldAngle >= 90 ? 0 : 180;
    const step = targetAngle === 180 ? 2 : -2;

    autoFoldInterval = setInterval(() => {
        foldAngle += step;
        
        if ((step === 2 && foldAngle >= 180) || (step === -2 && foldAngle <= 0)) {
            foldAngle = targetAngle;
            clearInterval(autoFoldInterval);
            isAutoFolding = false;
            btnFoldAuto.textContent = "自动折叠";
            btnFoldAuto.classList.remove("active-run");
        }

        sliderFoldAngle.value = foldAngle;
        angleValLbl.textContent = `${foldAngle}°`;
        syncSceneSliderFill(sliderFoldAngle);
        
        renderSandbox();
        checkCompletion();
    }, 16);
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

// 模拟用空 AudioContext 防止报错
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function init() {
    // 1. 初始化 Canvas
    initCanvasEvents();

    // 2. 绑定模式按钮
    document.querySelectorAll(".btn-mode").forEach(btn => {
        btn.addEventListener("click", () => {
            switchMode(btn.getAttribute("data-mode"));
        });
    });

    // 3. 折起角度拉条
    sliderFoldAngle.addEventListener("input", (e) => {
        foldAngle = parseInt(e.target.value);
        angleValLbl.textContent = `${foldAngle}°`;
        syncSceneSliderFill(e.target);
        renderSandbox();
        checkCompletion();
    });
    syncSceneSliderFill(sliderFoldAngle);

    // 自动折叠
    btnFoldAuto.addEventListener("click", toggleAutoFold);

    // 重置
    btnReset.addEventListener("click", () => {
        playClickSound();
        resetParameters();
        foldAngle = 0;
        sliderFoldAngle.value = 0;
        angleValLbl.textContent = "0°";
        isAutoFolding = false;
        clearInterval(autoFoldInterval);
        btnFoldAuto.textContent = "自动折叠";
        btnFoldAuto.classList.remove("active-run");
        syncSceneSliderFill(sliderFoldAngle);
        renderSandbox();
        checkCompletion();
    });

    // 帮助弹窗
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

    // Collapsible HUD
    hudToggleBtn.addEventListener("click", () => {
        hudPanel.classList.toggle("collapsed");
        scheduleHudStandard();
    });
    new MutationObserver(scheduleHudStandard).observe(hudPanel, {
        attributes: true,
        attributeFilter: ["class"]
    });
    window.addEventListener("resize", scheduleHudStandard);

    // 载入模式 1
    switchMode("symmetric");
    scheduleHudStandard();
}

document.addEventListener("DOMContentLoaded", init);
