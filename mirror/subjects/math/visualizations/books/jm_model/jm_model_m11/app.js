/**
 * 直角三角形斜边高相似模型演示仪 - 几何可视化交互控制脚本 (app.js)
 */

document.addEventListener("DOMContentLoaded", () => {
    // ==========================================================================
    // 1. 全局状态变量与参数
    // ==========================================================================
    let currentScene = "similarity-relation"; // similarity-relation | projection-theorem | area-identity
    let subMode = "dba-abc"; // similarity: dba-abc | dac-abc | dba-dac. theorem: ad-bd-cd | ab-bd-bc | ac-cd-bc
    let isAnimating = false;
    let isHudExpanded = false; // HUD 默认收起
    let isSnappingEnabled = false; // 是否开启整数厘米吸附

    // 几何圆周角 theta (弧度), 对应顶点 A 的位置
    let theta = 1.854; // 默认为约 106.26°，对应 3:4:5 三角形，使 B = 53.13°
    let targetTheta = 1.854;
    
    // 斜边 BC 长度 (像素)
    let lenBC = 380;
    let targetLenBC = 380;

    // LERP 平滑数值系统
    const renderValues = {
        theta: 1.854,
        lenBC: 380,
        animProgress: 0.0,
        // 各线段测量值 (单位: 厘米)
        ab: 0.0, ac: 0.0, bc: 0.0,
        ad: 0.0, bd: 0.0, cd: 0.0
    };

    // 画布平移与缩放
    let zoomScale = 1.0;
    let panX = 0;
    let panY = 0;
    let isPanning = false;
    let startPanX = 0, startPanY = 0;

    // 拖拽点状态
    let activeDragPoint = null;

    // 相似重合动画进度
    let animProgress = 0.0;
    let animDirection = 0; // 1: 播放重合, -1: 展开退回

    // 形状预设过渡标志
    let isPresetTransitioning = false;

    // ==========================================================================
    // 2. 几何点坐标定义
    // ==========================================================================
    const SCALE_CM_TO_PX = 38; // 38像素代表1厘米

    let centerX = 400;
    let centerY = 250; // 水平线 BC 所在 Y 坐标

    const points = {
        B: { x: 210, y: 250 },
        C: { x: 590, y: 250 },
        O: { x: 400, y: 250 }, // 中点 M
        A: { x: 457, y: 98  }, // 动态解算
        D: { x: 457, y: 250 }  // 动态解算
    };

    // ==========================================================================
    // 3. DOM 元素获取
    // ==========================================================================
    const sandboxWrapper = document.getElementById("sandbox-wrapper");
    const sandboxSvg = document.getElementById("sandbox-svg");
    const htmlOverlay = document.getElementById("html-overlay");
    const stepsChalkboard = document.getElementById("steps-hud-chalkboard");
    const hudPanel = document.getElementById("hud-chalkboard-panel");
    const hudToggleBtn = document.getElementById("hud-toggle-btn");

    const sliderAngleTheta = document.getElementById("slider-angle-theta");
    const valAngleTheta = document.getElementById("val-angle-theta");
    const sliderLenBc = document.getElementById("slider-len-bc");
    const valLenBc = document.getElementById("val-len-bc");

    const subModeTitle = document.getElementById("sub-mode-title");
    const subModeContainer = document.getElementById("sub-mode-container");

    const btnPlayFolding = document.getElementById("btn-play-folding");
    const btnResetState = document.getElementById("btn-reset-state");
    const btnShowHelp = document.getElementById("btn-show-help");
    const btnCloseHelp = document.getElementById("btn-close-help");
    const modalHelp = document.getElementById("modal-help");

    const theoryTitle = document.getElementById("theory-title");
    const theoryText = document.getElementById("theory-text");

    // ==========================================================================
    // 4. Canvas 物理粒子效果 (重力火花)
    // ==========================================================================
    const canvas = document.getElementById("particles-canvas");
    const ctx = canvas ? canvas.getContext("2d") : null;
    let particles = [];

    function resizeCanvas() {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    class SparkParticle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.vx = (Math.random() - 0.5) * 8;
            this.vy = (Math.random() - 0.7) * 10 - 3;
            this.radius = Math.random() * 3 + 2.0;
            this.color = color;
            this.alpha = 1.0;
            this.gravity = 0.25;
            this.life = 1.0;
            this.decay = Math.random() * 0.025 + 0.015;
        }

        update() {
            this.x += this.vx;
            this.vy += this.gravity;
            this.y += this.vy;
            this.alpha -= this.decay;
            this.life -= this.decay;
        }

        draw(c) {
            c.save();
            c.globalAlpha = Math.max(0, this.alpha);
            c.beginPath();
            c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            c.fillStyle = this.color;
            c.shadowBlur = 10;
            c.shadowColor = this.color;
            c.fill();
            c.restore();
        }
    }

    function spawnExplosion(x, y, color = "#3b82f6") {
        if (!ctx) return;
        for (let i = 0; i < 35; i++) {
            particles.push(new SparkParticle(x, y, color));
        }
    }

    function animateParticles() {
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles = particles.filter(p => p.life > 0);
        particles.forEach(p => {
            p.update();
            p.draw(ctx);
        });
        requestAnimationFrame(animateParticles);
    }
    if (ctx) requestAnimationFrame(animateParticles);

    // ==========================================================================
    // 5. 几何核心解算器 (Right Triangle Solver)
    // ==========================================================================
    function solveGeometry() {
        const B = points.B;
        const C = points.C;
        const O = points.O;
        const A = points.A;
        const D = points.D;

        // 根据平滑渲染值计算几何 (以支持 LERP 运动)
        const curLenBC = renderValues.lenBC;
        const curTheta = renderValues.theta;

        // 维持 B, C 水平对称分布在中心两侧
        B.x = centerX - curLenBC / 2;
        B.y = centerY;
        C.x = centerX + curLenBC / 2;
        C.y = centerY;

        O.x = centerX;
        O.y = centerY;

        const R = curLenBC / 2;

        // 圆周角解算 A 坐标 (y 向上为负数)
        A.x = O.x + R * Math.cos(curTheta);
        A.y = O.y - R * Math.sin(curTheta);

        // 投影计算垂足 D 坐标
        D.x = A.x;
        D.y = O.y;

        // 计算线段测量值 (厘米)
        const scale = SCALE_CM_TO_PX;
        renderValues.ab = Math.hypot(A.x - B.x, A.y - B.y) / scale;
        renderValues.ac = Math.hypot(C.x - A.x, C.y - A.y) / scale;
        renderValues.bc = curLenBC / scale;
        renderValues.bd = (D.x - B.x) / scale;
        renderValues.cd = (C.x - D.x) / scale;
        renderValues.ad = (D.y - A.y) / scale;
    }

    // 辅助：根据顶点及两边点，计算SVG弧形或扇区路径
    function getAngleArcPath(vertex, p1, p2, radius, isSector = false) {
        const alpha1 = Math.atan2(p1.y - vertex.y, p1.x - vertex.x);
        const alpha2 = Math.atan2(p2.y - vertex.y, p2.x - vertex.x);
        
        let diff = alpha2 - alpha1;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        
        const startAngle = alpha1;
        const endAngle = alpha1 + diff;
        
        const x1 = vertex.x + radius * Math.cos(startAngle);
        const y1 = vertex.y + radius * Math.sin(startAngle);
        const x2 = vertex.x + radius * Math.cos(endAngle);
        const y2 = vertex.y + radius * Math.sin(endAngle);
        
        const sweepFlag = diff > 0 ? 1 : 0;
        
        if (isSector) {
            return `M ${vertex.x} ${vertex.y} L ${x1} ${y1} A ${radius} ${radius} 0 0 ${sweepFlag} ${x2} ${y2} Z`;
        } else {
            return `M ${x1} ${y1} A ${radius} ${radius} 0 0 ${sweepFlag} ${x2} ${y2}`;
        }
    }

    // 辅助：计算 theta 的整数厘米吸附值
    function snapTheta(rawTheta, currentBC) {
        const scale = SCALE_CM_TO_PX;
        const bcCm = currentBC / scale;
        const candidates = [Math.PI / 3, Math.PI / 2, 2 * Math.PI / 3];
        
        // 添加直角边为整数厘米的候选角度
        const maxK = Math.floor(bcCm);
        for (let k = 1; k <= maxK; k++) {
            const ratio = k / bcCm;
            if (ratio >= 0 && ratio <= 1.0) {
                candidates.push(2 * Math.acos(ratio));
                candidates.push(2 * Math.asin(ratio));
            }
        }
        
        let closestCandidate = rawTheta;
        let minDiff = 0.0436; // 2.5度 (约 0.0436 弧度)
        
        for (let cand of candidates) {
            const safeCand = Math.max(0.32, Math.min(Math.PI - 0.32, cand));
            const diff = Math.abs(rawTheta - safeCand);
            if (diff < minDiff) {
                minDiff = diff;
                closestCandidate = safeCand;
            }
        }
        
        return closestCandidate;
    }

    // 辅助：计算 BC 长度的整数厘米吸附值
    function snapLenBC(rawLenBC) {
        const bcCm = Math.round(rawLenBC / SCALE_CM_TO_PX);
        const minBcCm = Math.ceil(220 / SCALE_CM_TO_PX); // 6
        const maxBcCm = Math.floor(700 / SCALE_CM_TO_PX); // 18
        const clampedBcCm = Math.max(minBcCm, Math.min(maxBcCm, bcCm));
        return clampedBcCm * SCALE_CM_TO_PX;
    }

    // 辅助：获取相似投影矩阵坐标插值
    function getSimilarOverlayVertices(S, T, t) {
        // S = [p1, p2, p3], T = [p1, p2, p3]
        const CS = { x: (S[0].x + S[1].x + S[2].x)/3, y: (S[0].y + S[1].y + S[2].y)/3 };
        const CT = { x: (T[0].x + T[1].x + T[2].x)/3, y: (T[0].y + T[1].y + T[2].y)/3 };
        
        const curC = { x: CS.x + t * (CT.x - CS.x), y: CS.y + t * (CT.y - CS.y) };
        
        const lenS = Math.hypot(S[1].x - S[0].x, S[1].y - S[0].y);
        const lenT = Math.hypot(T[1].x - T[0].x, T[1].y - T[0].y);
        const s = lenS > 1e-3 ? lenT / lenS : 1.0;
        const curScale = 1.0 + t * (s - 1.0);
        
        const angS = Math.atan2(S[1].y - S[0].y, S[1].x - S[0].x);
        const angT = Math.atan2(T[1].y - T[0].y, T[1].x - T[0].x);
        let diffAng = angT - angS;
        while (diffAng < -Math.PI) diffAng += 2 * Math.PI;
        while (diffAng > Math.PI) diffAng -= 2 * Math.PI;
        const curAng = t * diffAng;
        
        const P = [];
        for (let i = 0; i < 3; i++) {
            const dx = S[i].x - CS.x;
            const dy = S[i].y - CS.y;
            // 旋转
            const rx = dx * Math.cos(curAng) - dy * Math.sin(curAng);
            const ry = dx * Math.sin(curAng) + dy * Math.cos(curAng);
            // 缩放并平移
            P.push({
                x: curC.x + rx * curScale,
                y: curC.y + ry * curScale
            });
        }
        return P;
    }

    // ==========================================================================
    // 6. SVG 渲染逻辑
    // ==========================================================================
    function drawSVGPoint(id, pt, labelText, offset = { x: 12, y: 6 }, isDraggable = true) {
        let ptClass = "geo-point-wrapper";
        if (isDraggable) ptClass += " draggable-point draggable";
        const haloRadius = isDraggable ? 28 : 16;
        const pointRadius = isDraggable ? 7 : 6;

        let html = `
            <g class="${ptClass}" data-point-id="${id}">
                <circle class="geo-point-halo" cx="${pt.x}" cy="${pt.y}" r="${haloRadius}"></circle>
                <circle class="geo-point" cx="${pt.x}" cy="${pt.y}" r="${pointRadius}"></circle>
            </g>
        `;
        const textX = pt.x + offset.x;
        const textY = pt.y + offset.y;
        html += `<text class="geo-label" x="${textX}" y="${textY}">${labelText}</text>`;
        return html;
    }

    // 绘制直角标志 (直角边长d)
    function drawRightAngleSymbol(v, p1, p2, d = 14) {
        const v1 = { x: p1.x - v.x, y: p1.y - v.y };
        const v2 = { x: p2.x - v.x, y: p2.y - v.y };
        const l1 = Math.hypot(v1.x, v1.y);
        const l2 = Math.hypot(v2.x, v2.y);
        if (l1 < 1e-3 || l2 < 1e-3) return "";

        const u1 = { x: v1.x / l1, y: v1.y / l1 };
        const u2 = { x: v2.x / l2, y: v2.y / l2 };

        const pt1 = { x: v.x + u1.x * d, y: v.y + u1.y * d };
        const pt2 = { x: v.x + (u1.x + u2.x) * d, y: v.y + (u1.y + u2.y) * d };
        const pt3 = { x: v.x + u2.x * d, y: v.y + u2.y * d };

        return `<polyline class="geo-right-angle" points="${pt1.x},${pt1.y} ${pt2.x},${pt2.y} ${pt3.x},${pt3.y}"></polyline>`;
    }

    function trianglePoints(pts) {
        return pts.map(pt => `${pt.x},${pt.y}`).join(" ");
    }

    function getCentroid(pts) {
        return {
            x: pts.reduce((sum, pt) => sum + pt.x, 0) / pts.length,
            y: pts.reduce((sum, pt) => sum + pt.y, 0) / pts.length
        };
    }

    function getSimilarityPair() {
        const A = points.A;
        const B = points.B;
        const C = points.C;
        const D = points.D;

        if (subMode === "dac-abc") {
            return {
                sourceName: "△DAC",
                targetName: "△ABC",
                relation: "△DAC ∽ △ABC",
                sourcePts: [D, A, C],
                targetPts: [A, B, C],
                mapping: "D→A，A→B，C→C",
                criterion: "∠D = ∠A = 90°，∠C 为公共角",
                formula: "AD/AB = CD/AC = AC/BC",
                ratioValues: [
                    { label: "AD/AB", value: renderValues.ad / renderValues.ab },
                    { label: "CD/AC", value: renderValues.cd / renderValues.ac },
                    { label: "AC/BC", value: renderValues.ac / renderValues.bc }
                ],
                activeSegments: ["ad", "ab", "cd", "ac", "bc"],
                angleBadges: [
                    { x: C.x - 34, y: C.y - 20, text: "公共∠C", cls: "pair-blue" },
                    { x: D.x + 28, y: D.y - 16, text: "90°", cls: "pair-common" },
                    { x: A.x - 26, y: A.y + 24, text: "90°", cls: "pair-common" }
                ]
            };
        }

        if (subMode === "dba-dac") {
            return {
                sourceName: "△DBA",
                targetName: "△DAC",
                relation: "△DBA ∽ △DAC",
                sourcePts: [D, B, A],
                targetPts: [D, A, C],
                mapping: "D→D，B→A，A→C",
                criterion: "∠D = ∠D = 90°，锐角互余对应相等",
                formula: "BD/AD = AD/CD = AB/AC",
                ratioValues: [
                    { label: "BD/AD", value: renderValues.bd / renderValues.ad },
                    { label: "AD/CD", value: renderValues.ad / renderValues.cd },
                    { label: "AB/AC", value: renderValues.ab / renderValues.ac }
                ],
                activeSegments: ["bd", "ad", "cd", "ab", "ac"],
                angleBadges: [
                    { x: D.x, y: D.y - 20, text: "90°", cls: "pair-common" },
                    { x: B.x + 32, y: B.y - 20, text: "∠B", cls: "pair-blue" },
                    { x: A.x + 32, y: A.y + 20, text: "∠DAC", cls: "pair-orange" }
                ]
            };
        }

        return {
            sourceName: "△DBA",
            targetName: "△ABC",
            relation: "△DBA ∽ △ABC",
            sourcePts: [D, B, A],
            targetPts: [A, B, C],
            mapping: "D→A，B→B，A→C",
            criterion: "∠D = ∠A = 90°，∠B 为公共角",
            formula: "BD/AB = AD/AC = AB/BC",
            ratioValues: [
                { label: "BD/AB", value: renderValues.bd / renderValues.ab },
                { label: "AD/AC", value: renderValues.ad / renderValues.ac },
                { label: "AB/BC", value: renderValues.ab / renderValues.bc }
            ],
            activeSegments: ["bd", "ab", "ad", "ac", "bc"],
            angleBadges: [
                { x: B.x + 34, y: B.y - 20, text: "公共∠B", cls: "pair-blue" },
                { x: D.x - 28, y: D.y - 16, text: "90°", cls: "pair-common" },
                { x: A.x + 26, y: A.y + 24, text: "90°", cls: "pair-common" }
            ]
        };
    }

    function getDemoStageText() {
        const t = renderValues.animProgress;
        if (t < 0.08) return "选中小三角形，看对应顶点";
        if (t < 0.45) return "提取子三角形";
        if (t < 0.82) return "旋转、缩放并对齐";
        return "对应顶点重合，相似比成立";
    }

    function renderSVG() {
        const A = points.A;
        const B = points.B;
        const C = points.C;
        const D = points.D;
        const O = points.O;

        let drawHtml = "";

        // 1. 绘制底纸半圆弧背景（虚线半圆，代表直角顶点的几何轨迹）
        const R = (C.x - B.x) / 2;
        drawHtml += `
            <path class="geo-line-seg auxiliary-line" d="M ${B.x} ${B.y} A ${R} ${R} 0 0 1 ${C.x} ${C.y}" stroke="#cbd5e1" stroke-width="1.5"></path>
        `;

        // 2. 绘制三角形阴影底色
        drawHtml += `
            <polygon class="geo-polygon-fill" points="${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}"></polygon>
        `;

        if (currentScene === "similarity-relation") {
            const pair = getSimilarityPair();
            const sourceCenter = getCentroid(pair.sourcePts);
            const targetCenter = getCentroid(pair.targetPts);
            drawHtml += `
                <polygon class="geo-polygon-fill triangle-main" points="${trianglePoints(pair.targetPts)}"></polygon>
                <polygon class="geo-polygon-fill triangle-match" points="${trianglePoints(pair.sourcePts)}"></polygon>
                <text class="geo-triangle-name badge-main" x="${targetCenter.x}" y="${targetCenter.y - 18}" text-anchor="middle">${pair.targetName}</text>
                <text class="geo-triangle-name badge-match" x="${sourceCenter.x}" y="${sourceCenter.y + 18}" text-anchor="middle">${pair.sourceName}</text>
            `;
        }

        // 3. 场景 2：射影定理几何面积绘制
        if (currentScene === "projection-theorem") {
            const ab = Math.hypot(A.x - B.x, A.y - B.y);
            const ac = Math.hypot(C.x - A.x, C.y - A.y);
            const ad = D.y - A.y;
            const bd = D.x - B.x;
            const cd = C.x - D.x;
            const bc = C.x - B.x;

            if (subMode === "ad-bd-cd") {
                // 高度定理：AD^2 = BD * CD
                // 在 AD 左侧绘制正方形
                drawHtml += `
                    <rect class="theorem-square" x="${A.x - ad}" y="${A.y}" width="${ad}" height="${ad}"></rect>
                `;
                // 在 BD 下方绘制以 BD 和 CD 为邻边的矩形
                drawHtml += `
                    <rect class="theorem-rect cd-rect" x="${B.x}" y="${B.y}" width="${bd}" height="${cd}"></rect>
                `;
            } else if (subMode === "ab-bd-bc") {
                // 左边长定理：AB^2 = BD * BC
                // 绘制斜直角边 AB 的倾斜正方形
                // 倾斜向量
                const dx = B.x - A.x, dy = B.y - A.y;
                // 垂直分量
                const px = -dy, py = dx;
                drawHtml += `
                    <polygon class="theorem-square ab-sq" points="${A.x},${A.y} ${B.x},${B.y} ${B.x + px},${B.y + py} ${A.x + px},${A.y + py}"></polygon>
                `;
                // 在 BC 下方绘制以 BD 为高、BC 为宽的矩形
                drawHtml += `
                    <rect class="theorem-rect" x="${B.x}" y="${B.y}" width="${bc}" height="${bd}"></rect>
                `;
            } else if (subMode === "ac-cd-bc") {
                // 右边长定理：AC^2 = CD * BC
                // 绘制斜直角边 AC 的倾斜正方形
                const dx = C.x - A.x, dy = C.y - A.y;
                const px = dy, py = -dx; // 向右下方投射
                drawHtml += `
                    <polygon class="theorem-square ac-sq" points="${A.x},${A.y} ${C.x},${C.y} ${C.x + px},${C.y + py} ${A.x + px},${A.y + py}"></polygon>
                `;
                // 在 BC 下方绘制以 CD 为高、BC 为宽的矩形
                drawHtml += `
                    <rect class="theorem-rect bc-rect" x="${B.x}" y="${B.y}" width="${bc}" height="${cd}"></rect>
                `;
            }
        }

        // 4. 场景 3：面积恒等关系矩形绘制
        if (currentScene === "area-identity") {
            const ab = Math.hypot(A.x - B.x, A.y - B.y);
            const ac = Math.hypot(C.x - A.x, C.y - A.y);
            const ad = D.y - A.y;
            const bc = C.x - B.x;

            // 绘制两个矩形：AB * AC 和 BC * AD，放置在下方
            const rectY = centerY + 45;
            // 矩形 1: AB * AC
            drawHtml += `
                <rect class="theorem-square ab-sq" x="${centerX - ab - 20}" y="${rectY}" width="${ab}" height="${ac}"></rect>
                <text class="geo-label" style="font-size:11px;" x="${centerX - ab/2 - 20}" y="${rectY - 6}" text-anchor="middle">AB × AC 矩形</text>
            `;
            // 矩形 2: BC * AD
            drawHtml += `
                <rect class="theorem-rect bc-rect" x="${centerX + 20}" y="${rectY}" width="${bc}" height="${ad}"></rect>
                <text class="geo-label" style="font-size:11px;" x="${centerX + bc/2 + 20}" y="${rectY - 6}" text-anchor="middle">BC × AD 矩形</text>
            `;
        }

        // 5. 绘制骨架几何线段 (在场景1和场景3中高亮)
        if (currentScene === "similarity-relation") {
            // 相似展示下：母三角形骨架常规绘制
            drawHtml += `
                <line class="geo-line-seg seg-ab" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}"></line>
                <line class="geo-line-seg seg-ac" x1="${A.x}" y1="${A.y}" x2="${C.x}" y2="${C.y}"></line>
                <line class="geo-line-seg seg-bc-highlight" x1="${B.x}" y1="${B.y}" x2="${C.x}" y2="${C.y}" stroke="var(--segment-bc)" stroke-width="4.5"></line>
                <line class="geo-line-seg seg-ad" x1="${A.x}" y1="${A.y}" x2="${D.x}" y2="${D.y}"></line>
            `;

            const pair = getSimilarityPair();
            if (subMode === "dac-abc") {
                drawHtml += `
                    <path class="geo-angle-sector" style="fill: var(--segment-ab-light);" d="${getAngleArcPath(C, B, A, 22, true)}"></path>
                    <path class="geo-angle-arc" style="stroke: var(--segment-ab);" d="${getAngleArcPath(C, B, A, 22)}"></path>
                    <path class="geo-angle-sector" style="fill: var(--segment-ab-light);" d="${getAngleArcPath(C, D, A, 22, true)}"></path>
                    <path class="geo-angle-arc" style="stroke: var(--segment-ab);" d="${getAngleArcPath(C, D, A, 22)}"></path>
                `;
            } else if (subMode === "dba-dac") {
                drawHtml += `
                    <path class="geo-angle-sector" style="fill: var(--segment-bd-light);" d="${getAngleArcPath(B, A, D, 22, true)}"></path>
                    <path class="geo-angle-arc" style="stroke: var(--segment-bd);" d="${getAngleArcPath(B, A, D, 22)}"></path>
                    <path class="geo-angle-sector" style="fill: var(--segment-bd-light);" d="${getAngleArcPath(A, D, C, 22, true)}"></path>
                    <path class="geo-angle-arc" style="stroke: var(--segment-bd);" d="${getAngleArcPath(A, D, C, 22)}"></path>
                `;
            } else {
                drawHtml += `
                    <path class="geo-angle-sector" style="fill: var(--segment-ab-light);" d="${getAngleArcPath(B, A, D, 22, true)}"></path>
                    <path class="geo-angle-arc" style="stroke: var(--segment-ab);" d="${getAngleArcPath(B, A, D, 22)}"></path>
                    <path class="geo-angle-sector" style="fill: var(--segment-ab-light);" d="${getAngleArcPath(B, A, C, 22, true)}"></path>
                    <path class="geo-angle-arc" style="stroke: var(--segment-ab);" d="${getAngleArcPath(B, A, C, 22)}"></path>
                `;
            }
            const angleBadgeHtml = pair.angleBadges.map(badge => `
                <text class="geo-angle-badge ${badge.cls}" x="${badge.x}" y="${badge.y}">${badge.text}</text>
            `).join("");
            drawHtml += `
                ${angleBadgeHtml}
                <text class="geo-relation-badge" x="${centerX}" y="${Math.max(46, A.y - 28)}" text-anchor="middle">${pair.relation}</text>
            `;
        } else if (currentScene === "area-identity") {
            // 面积恒等下：重点高亮两组底高 AB, AC 与 BC, AD
            drawHtml += `
                <line class="geo-line-seg seg-ab" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" stroke-width="5.5"></line>
                <line class="geo-line-seg seg-ac" x1="${A.x}" y1="${A.y}" x2="${C.x}" y2="${C.y}" stroke-width="5.5"></line>
                <line class="geo-line-seg seg-bc-highlight" x1="${B.x}" y1="${B.y}" x2="${C.x}" y2="${C.y}" stroke="var(--segment-bc)" stroke-width="5.5"></line>
                <line class="geo-line-seg seg-ad" x1="${A.x}" y1="${A.y}" x2="${D.x}" y2="${D.y}" stroke-width="5.5"></line>
            `;
        } else if (currentScene === "projection-theorem") {
            // 射影定理下：高亮展示对应的分段 BD 和 CD 
            drawHtml += `
                <line class="geo-line-seg" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" stroke="var(--text-secondary)" stroke-width="3"></line>
                <line class="geo-line-seg" x1="${A.x}" y1="${A.y}" x2="${C.x}" y2="${C.y}" stroke="var(--text-secondary)" stroke-width="3"></line>
                <line class="geo-line-seg seg-bd" x1="${B.x}" y1="${B.y}" x2="${D.x}" y2="${D.y}"></line>
                <line class="geo-line-seg seg-cd" x1="${D.x}" y1="${D.y}" x2="${C.x}" y2="${C.y}"></line>
                <line class="geo-line-seg seg-ad" x1="${A.x}" y1="${A.y}" x2="${D.x}" y2="${D.y}"></line>
            `;
        }

        // 6. 绘制直角符号标志
        drawHtml += drawRightAngleSymbol(A, B, C); // 顶点 A 处的直角
        drawHtml += drawRightAngleSymbol(D, A, C); // 垂足 D 处的直角 (指向右侧)

        // 7. 相似重合动画叠加层绘制
        const t = renderValues.animProgress;
        if (t > 0.001 && currentScene === "similarity-relation") {
            let overlayPts = [];
            let fillColorClass = "sub-fill-1";
            let strokeColor = "var(--segment-ab)";
            let S = [], T = [];

            if (subMode === "dba-abc") {
                // DBA ∽ ABC. Source: [D, B, A], Target: [A, B, C]
                S = [D, B, A];
                T = [A, B, C];
                fillColorClass = "sub-fill-1";
                strokeColor = "var(--segment-ab)";
            } else if (subMode === "dac-abc") {
                // DAC ∽ ABC. Source: [D, A, C], Target: [A, B, C]
                S = [D, A, C];
                T = [A, B, C];
                fillColorClass = "sub-fill-2";
                strokeColor = "var(--segment-ac)";
            } else if (subMode === "dba-dac") {
                // DBA ∽ DAC. Source: [D, B, A], Target: [D, A, C]
                S = [D, B, A];
                T = [D, A, C];
                fillColorClass = "sub-fill-1";
                strokeColor = "var(--segment-ad)";
            }

            if (S.length === 3 && T.length === 3) {
                // 计算基准的 centroid LERP 坐标
                overlayPts = getSimilarOverlayVertices(S, T, t);
                
                // 3D 浮起立体感优化：应用基于正弦的高度 lift
                const lift = Math.sin(t * Math.PI);
                const scaleFactor = 1.0 + 0.05 * lift; // 在半空中微幅放大
                const centroid = {
                    x: (overlayPts[0].x + overlayPts[1].x + overlayPts[2].x) / 3,
                    y: (overlayPts[0].y + overlayPts[1].y + overlayPts[2].y) / 3
                };
                
                // 进行中心视差缩放，模拟浮起
                const liftPts = overlayPts.map(pt => ({
                    x: centroid.x + (pt.x - centroid.x) * scaleFactor,
                    y: centroid.y + (pt.y - centroid.y) * scaleFactor
                }));

                // 动态高度投影阴影滤镜
                const shadowDx = 5 * lift;
                const shadowDy = 8 * lift;
                const shadowBlur = 6 * lift;
                const shadowOpacity = 0.12 + 0.16 * lift;
                const filterStyle = lift > 0.01 ? `filter: drop-shadow(${shadowDx}px ${shadowDy}px ${shadowBlur}px rgba(15,23,42,${shadowOpacity}));` : "";

                drawHtml += `
                    <!-- 动态重叠相似三角形面 -->
                    <g style="${filterStyle}">
                        <polygon class="geo-polygon-fill ${fillColorClass}" style="fill-opacity: 0.28;" points="${liftPts[0].x},${liftPts[0].y} ${liftPts[1].x},${liftPts[1].y} ${liftPts[2].x},${liftPts[2].y}"></polygon>
                        <!-- 动态边线 -->
                        <line class="geo-line-seg" x1="${liftPts[0].x}" y1="${liftPts[0].y}" x2="${liftPts[1].x}" y2="${liftPts[1].y}" stroke="${strokeColor}" stroke-width="5.5"></line>
                        <line class="geo-line-seg" x1="${liftPts[1].x}" y1="${liftPts[1].y}" x2="${liftPts[2].x}" y2="${liftPts[2].y}" stroke="${strokeColor}" stroke-width="5.5"></line>
                        <line class="geo-line-seg" x1="${liftPts[2].x}" y1="${liftPts[2].y}" x2="${liftPts[0].x}" y2="${liftPts[0].y}" stroke="${strokeColor}" stroke-width="5.5"></line>
                        
                        <!-- 顶点标志 -->
                        <circle cx="${liftPts[0].x}" cy="${liftPts[0].y}" r="8" fill="var(--segment-ad)" opacity="0.85"></circle>
                        <circle cx="${liftPts[1].x}" cy="${liftPts[1].y}" r="8" fill="var(--segment-ab)" opacity="0.85"></circle>
                        <circle cx="${liftPts[2].x}" cy="${liftPts[2].y}" r="8" fill="var(--segment-ac)" opacity="0.85"></circle>
                    </g>
                `;
            }
        }

        // 8. 绘制几何交互焦点 (D 点不可直接修改，只能计算得到，绘制为灰色辅助点，或者允许拖拽改变 D.x 间接修改 A.x)
        drawHtml += drawSVGPoint("B", B, "B", { x: 10, y: 22 }, true);
        drawHtml += drawSVGPoint("C", C, "C", { x: 10, y: 22 }, true);
        drawHtml += drawSVGPoint("A", A, "A", { x: -16, y: -14 }, true);
        drawHtml += drawSVGPoint("D", D, "D", { x: -12, y: 22 }, true); // D 允许拖拽

        sandboxSvg.innerHTML = drawHtml;
    }

    // ==========================================================================
    // 7. HTML 浮动文字标注与板书算式渲染
    // ==========================================================================
    function updateHTMLOverlayAndHUD() {
        const A = points.A;
        const B = points.B;
        const C = points.C;
        const D = points.D;

        let overlayHtml = "";

        const getMidpoint = (p1, p2) => ({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 });

        // 当重合动画没有播放时，显示标准长度标签
        if (renderValues.animProgress < 0.01) {
            const midAB = getMidpoint(A, B);
            const midAC = getMidpoint(A, C);
            const midBD = getMidpoint(B, D);
            const midCD = getMidpoint(C, D);
            const midAD = getMidpoint(A, D);
            const midBC = getMidpoint(B, C);

            // 线段长度数据 (单位: 厘米)
            const ab = renderValues.ab.toFixed(1);
            const ac = renderValues.ac.toFixed(1);
            const bc = renderValues.bc.toFixed(1);
            const bd = renderValues.bd.toFixed(1);
            const cd = renderValues.cd.toFixed(1);
            const ad = renderValues.ad.toFixed(1);
            const labels = {
                ab: `<div class="brace-label lbl-ab main" style="left:${midAB.x - 12}px; top:${midAB.y - 16}px">AB ${ab}</div>`,
                ac: `<div class="brace-label lbl-ac main" style="left:${midAC.x + 12}px; top:${midAC.y - 16}px">AC ${ac}</div>`,
                bc: `<div class="brace-label lbl-bc sub" style="left:${midBC.x}px; top:${midBC.y + 30}px">BC ${bc}</div>`,
                bd: `<div class="brace-label lbl-bd sub" style="left:${midBD.x}px; top:${midBD.y + 18}px">BD ${bd}</div>`,
                cd: `<div class="brace-label lbl-cd sub" style="left:${midCD.x}px; top:${midCD.y + 18}px">CD ${cd}</div>`,
                ad: `<div class="brace-label lbl-ad relation" style="left:${midAD.x - 28}px; top:${midAD.y}px">AD ${ad}</div>`
            };
            let visibleKeys = [];

            if (currentScene === "similarity-relation") {
                visibleKeys = getSimilarityPair().activeSegments;
            } else if (currentScene === "projection-theorem") {
                if (subMode === "ad-bd-cd") visibleKeys = ["ad", "bd", "cd"];
                if (subMode === "ab-bd-bc") visibleKeys = ["ab", "bd", "bc"];
                if (subMode === "ac-cd-bc") visibleKeys = ["ac", "cd", "bc"];
            } else if (currentScene === "area-identity") {
                visibleKeys = ["ab", "ac", "bc", "ad"];
            }

            overlayHtml += [...new Set(visibleKeys)].map(key => labels[key]).filter(Boolean).join("");
        }

        if (activeDragPoint) {
            const dragHints = {
                A: "拖动 A：改变直角三角形形状",
                B: "拖动 B：调整斜边长度",
                C: "拖动 C：调整斜边长度",
                D: "拖动 D：沿斜边移动垂足"
            };
            overlayHtml += `
                <div class="canvas-info-card drag-tip fixed-corner">
                    <b>${activeDragPoint} 点</b>
                    <span>${dragHints[activeDragPoint] || "拖动调整图形"}</span>
                </div>
            `;
        }

        htmlOverlay.innerHTML = overlayHtml;
        positionOverlayLabels();
        updateChalkboardHUD();
    }

    function updateChalkboardHUDLegacy() {
        let html = "";

        const ab = renderValues.ab;
        const ac = renderValues.ac;
        const bc = renderValues.bc;
        const ad = renderValues.ad;
        const bd = renderValues.bd;
        const cd = renderValues.cd;

        if (currentScene === "similarity-relation") {
            if (subMode === "dba-abc") {
                const r1 = bd / ab;
                const r2 = ad / ac;
                const r3 = ab / bc;
                html = `
                    <div class="hud-row">
                        <div class="hud-row-label">已知条件与相似模型</div>
                        <div class="hud-row-val">
                            Rt△ABC 中，∠BAC = 90°，AD ⊥ BC。<br>
                            对应顶点：D &rArr; A, B &rArr; B, A &rArr; C
                        </div>
                    </div>
                    <div class="hud-row">
                        <div class="hud-row-label">证明推理步骤</div>
                        <div class="hud-row-val" style="font-size:12px;">
                            ∵ AD ⊥ BC &rArr; ∠ADB = 90°<br>
                            又 ∵ ∠BAC = 90° &rArr; ∠ADB = ∠BAC = 90°<br>
                            又 ∵ ∠B = ∠B (公共角)<br>
                            &rArr; <strong>△DBA ∽ △ABC (两角对应相等)</strong>
                        </div>
                    </div>
                    <div class="hud-row">
                        <div class="hud-row-label">线段测量值</div>
                        <div class="hud-row-val">
                            BD = <span class="math-seg seg-bd" data-highlight="bd">${bd.toFixed(2)}</span>, 
                            AB = <span class="math-seg seg-ab" data-highlight="ab">${ab.toFixed(2)}</span> cm<br>
                            AD = <span class="math-seg seg-ad" data-highlight="ad">${ad.toFixed(2)}</span>, 
                            AC = <span class="math-seg seg-ac" data-highlight="ac">${ac.toFixed(2)}</span> cm<br>
                            BC = <span class="math-seg seg-bc" data-highlight="bc">${bc.toFixed(2)}</span> cm
                        </div>
                    </div>
                    <div class="hud-equation-box success-box">
                        <div class="title">相似对应边比例验证 (BD/AB = AD/AC = AB/BC)</div>
                        <div class="formula" style="font-size:12px; flex-direction:column; align-items:flex-start; gap:4px;">
                            <div>BD / AB = ${bd.toFixed(2)} / ${ab.toFixed(2)} = <span class="highlight">${r1.toFixed(3)}</span></div>
                            <div>AD / AC = ${ad.toFixed(2)} / ${ac.toFixed(2)} = <span class="highlight">${r2.toFixed(3)}</span></div>
                            <div>AB / BC = ${ab.toFixed(2)} / ${bc.toFixed(2)} = <span class="highlight">${r3.toFixed(3)}</span></div>
                        </div>
                    </div>
                `;
            } else if (subMode === "dac-abc") {
                const r1 = ad / ab;
                const r2 = cd / ac;
                const r3 = ac / bc;
                html = `
                    <div class="hud-row">
                        <div class="hud-row-label">已知条件与相似模型</div>
                        <div class="hud-row-val">
                            Rt△ABC 中，∠BAC = 90°，AD ⊥ BC。<br>
                            对应顶点：D &rArr; A, A &rArr; B, C &rArr; C
                        </div>
                    </div>
                    <div class="hud-row">
                        <div class="hud-row-label">证明推理步骤</div>
                        <div class="hud-row-val" style="font-size:12px;">
                            ∵ AD ⊥ BC &rArr; ∠ADC = 90°<br>
                            又 ∵ ∠BAC = 90° &rArr; ∠ADC = ∠BAC = 90°<br>
                            又 ∵ ∠C = ∠C (公共角)<br>
                            &rArr; <strong>△DAC ∽ △ABC (两角对应相等)</strong>
                        </div>
                    </div>
                    <div class="hud-row">
                        <div class="hud-row-label">线段测量值</div>
                        <div class="hud-row-val">
                            AD = <span class="math-seg seg-ad" data-highlight="ad">${ad.toFixed(2)}</span>, 
                            AB = <span class="math-seg seg-ab" data-highlight="ab">${ab.toFixed(2)}</span> cm<br>
                            CD = <span class="math-seg seg-cd" data-highlight="cd">${cd.toFixed(2)}</span>, 
                            AC = <span class="math-seg seg-ac" data-highlight="ac">${ac.toFixed(2)}</span> cm<br>
                            BC = <span class="math-seg seg-bc" data-highlight="bc">${bc.toFixed(2)}</span> cm
                        </div>
                    </div>
                    <div class="hud-equation-box success-box">
                        <div class="title">相似比验证 (AD/AB = CD/AC = AC/BC)</div>
                        <div class="formula" style="font-size:12px; flex-direction:column; align-items:flex-start; gap:4px;">
                            <div>AD / AB = ${ad.toFixed(2)} / ${ab.toFixed(2)} = <span class="highlight">${r1.toFixed(3)}</span></div>
                            <div>CD / AC = ${cd.toFixed(2)} / ${ac.toFixed(2)} = <span class="highlight">${r2.toFixed(3)}</span></div>
                            <div>AC / BC = ${ac.toFixed(2)} / ${bc.toFixed(2)} = <span class="highlight">${r3.toFixed(3)}</span></div>
                        </div>
                    </div>
                `;
            } else if (subMode === "dba-dac") {
                const r1 = bd / ad;
                const r2 = ad / cd;
                const r3 = ab / ac;
                html = `
                    <div class="hud-row">
                        <div class="hud-row-label">已知条件与相似模型</div>
                        <div class="hud-row-val">
                            两个子直角三角形相似关系。<br>
                            对应顶点：D &rArr; D, B &rArr; A, A &rArr; C
                        </div>
                    </div>
                    <div class="hud-row">
                        <div class="hud-row-label">证明推理步骤</div>
                        <div class="hud-row-val" style="font-size:12px;">
                            ∵ ∠B + ∠BAD = 90°，∠BAD + ∠DAC = 90°<br>
                            &rArr; ∠B = ∠DAC（同角的余角相等）<br>
                            又 ∵ ∠ADB = ∠ADC = 90°<br>
                            &rArr; <strong>△DBA ∽ △DAC (两角对应相等)</strong>
                        </div>
                    </div>
                    <div class="hud-row">
                        <div class="hud-row-label">线段测量值</div>
                        <div class="hud-row-val">
                            BD = <span class="math-seg seg-bd" data-highlight="bd">${bd.toFixed(2)}</span>, 
                            AD = <span class="math-seg seg-ad" data-highlight="ad">${ad.toFixed(2)}</span> cm<br>
                            CD = <span class="math-seg seg-cd" data-highlight="cd">${cd.toFixed(2)}</span> cm<br>
                            AB = <span class="math-seg seg-ab" data-highlight="ab">${ab.toFixed(2)}</span>, 
                            AC = <span class="math-seg seg-ac" data-highlight="ac">${ac.toFixed(2)}</span> cm
                        </div>
                    </div>
                    <div class="hud-equation-box success-box">
                        <div class="title">相似比验证 (BD/AD = AD/CD = AB/AC)</div>
                        <div class="formula" style="font-size:12px; flex-direction:column; align-items:flex-start; gap:4px;">
                            <div>BD / AD = ${bd.toFixed(2)} / ${ad.toFixed(2)} = <span class="highlight">${r1.toFixed(3)}</span></div>
                            <div>AD / CD = ${ad.toFixed(2)} / ${cd.toFixed(2)} = <span class="highlight">${r2.toFixed(3)}</span></div>
                            <div>AB / AC = ${ab.toFixed(2)} / ${ac.toFixed(2)} = <span class="highlight">${r3.toFixed(3)}</span></div>
                        </div>
                    </div>
                `;
            }
        } else if (currentScene === "projection-theorem") {
            if (subMode === "ad-bd-cd") {
                const lhs = ad * ad;
                const rhs = bd * cd;
                html = `
                    <div class="hud-row">
                        <div class="hud-row-label">射影定理：高度定理公式</div>
                        <div class="hud-row-val" style="font-size: 14px; color: var(--segment-ad);">
                            <strong>AD² = BD · CD</strong>
                        </div>
                    </div>
                    <div class="hud-row">
                        <div class="hud-row-label">高度定理代数验证</div>
                        <div class="hud-row-val">
                            AD = <span class="math-seg seg-ad" data-highlight="ad">${ad.toFixed(2)}</span> cm<br>
                            BD = <span class="math-seg seg-bd" data-highlight="bd">${bd.toFixed(2)}</span> cm, 
                            CD = <span class="math-seg seg-cd" data-highlight="cd">${cd.toFixed(2)}</span> cm
                        </div>
                    </div>
                    <div class="hud-equation-box">
                        <div class="title">面积相等对比结果</div>
                        <div class="formula" style="flex-direction:column; align-items:flex-start; gap:4px; font-size:12px;">
                            <div>高线正方形 AD² = ${ad.toFixed(2)}² = <span class="highlight">${lhs.toFixed(2)}</span> cm²</div>
                            <div>底段乘积矩形 BD × CD = ${bd.toFixed(2)} × ${cd.toFixed(2)} = <span class="highlight">${rhs.toFixed(2)}</span> cm²</div>
                        </div>
                    </div>
                `;
            } else if (subMode === "ab-bd-bc") {
                const lhs = ab * ab;
                const rhs = bd * bc;
                html = `
                    <div class="hud-row">
                        <div class="hud-row-label">射影定理：左直角边公式</div>
                        <div class="hud-row-val" style="font-size: 14px; color: var(--segment-ab);">
                            <strong>AB² = BD · BC</strong>
                        </div>
                    </div>
                    <div class="hud-row">
                        <div class="hud-row-label">左直角边定理代数验证</div>
                        <div class="hud-row-val">
                            AB = <span class="math-seg seg-ab" data-highlight="ab">${ab.toFixed(2)}</span> cm<br>
                            BD = <span class="math-seg seg-bd" data-highlight="bd">${bd.toFixed(2)}</span> cm, 
                            BC = <span class="math-seg seg-bc" data-highlight="bc">${bc.toFixed(2)}</span> cm
                        </div>
                    </div>
                    <div class="hud-equation-box">
                        <div class="title">面积相等对比结果</div>
                        <div class="formula" style="flex-direction:column; align-items:flex-start; gap:4px; font-size:12px;">
                            <div>直角边正方形 AB² = ${ab.toFixed(2)}² = <span class="highlight">${lhs.toFixed(2)}</span> cm²</div>
                            <div>投影乘积矩形 BD × BC = ${bd.toFixed(2)} × ${bc.toFixed(2)} = <span class="highlight">${rhs.toFixed(2)}</span> cm²</div>
                        </div>
                    </div>
                `;
            } else if (subMode === "ac-cd-bc") {
                const lhs = ac * ac;
                const rhs = cd * bc;
                html = `
                    <div class="hud-row">
                        <div class="hud-row-label">射影定理：右直角边公式</div>
                        <div class="hud-row-val" style="font-size: 14px; color: var(--segment-ac);">
                            <strong>AC² = CD · BC</strong>
                        </div>
                    </div>
                    <div class="hud-row">
                        <div class="hud-row-label">右直角边定理代数验证</div>
                        <div class="hud-row-val">
                            AC = <span class="math-seg seg-ac" data-highlight="ac">${ac.toFixed(2)}</span> cm<br>
                            CD = <span class="math-seg seg-cd" data-highlight="cd">${cd.toFixed(2)}</span> cm, 
                            BC = <span class="math-seg seg-bc" data-highlight="bc">${bc.toFixed(2)}</span> cm
                        </div>
                    </div>
                    <div class="hud-equation-box">
                        <div class="title">面积相等对比结果</div>
                        <div class="formula" style="flex-direction:column; align-items:flex-start; gap:4px; font-size:12px;">
                            <div>直角边正方形 AC² = ${ac.toFixed(2)}² = <span class="highlight">${lhs.toFixed(2)}</span> cm²</div>
                            <div>投影乘积矩形 CD × BC = ${cd.toFixed(2)} × ${bc.toFixed(2)} = <span class="highlight">${rhs.toFixed(2)}</span> cm²</div>
                        </div>
                    </div>
                `;
            }
        } else if (currentScene === "area-identity") {
            const area1 = ab * ac;
            const area2 = bc * ad;
            html = `
                <div class="hud-row">
                    <div class="hud-row-label">直角三角形面积恒等式</div>
                    <div class="hud-row-val" style="font-size: 14px; color: var(--segment-ac);">
                        <strong>AB · AC = BC · AD</strong>
                    </div>
                </div>
                <div class="hud-row">
                    <div class="hud-row-label">代数计算过程</div>
                    <div class="hud-row-val" style="font-size: 12.5px;">
                        三角形面积可表示为底乘高之半：<br>
                        S = &frac12; × AB × AC（直角边底高）<br>
                        S = &frac12; × BC × AD（斜边底高）<br>
                        &rArr; AB × AC = BC × AD（均为三角形面积的2倍）
                    </div>
                </div>
                <div class="hud-row">
                    <div class="hud-row-label">当前线段测量值</div>
                    <div class="hud-row-val">
                        AB = <span class="math-seg seg-ab" data-highlight="ab">${ab.toFixed(2)}</span>, 
                        AC = <span class="math-seg seg-ac" data-highlight="ac">${ac.toFixed(2)}</span> cm<br>
                        BC = <span class="math-seg seg-bc" data-highlight="bc">${bc.toFixed(2)}</span>, 
                        AD = <span class="math-seg seg-ad" data-highlight="ad">${ad.toFixed(2)}</span> cm
                    </div>
                </div>
                <div class="hud-equation-box success-box">
                    <div class="title">双倍面积相等验证</div>
                    <div class="formula" style="flex-direction:column; align-items:flex-start; gap:4px; font-size:12px;">
                        <div>直角边矩形 AB × AC = ${ab.toFixed(2)} × ${ac.toFixed(2)} = <span class="highlight">${area1.toFixed(2)}</span> cm²</div>
                        <div>斜边高矩形 BC × AD = ${bc.toFixed(2)} × ${ad.toFixed(2)} = <span class="highlight">${area2.toFixed(2)}</span> cm²</div>
                    </div>
                </div>
            `;
        }

        stepsChalkboard.innerHTML = html;
    }

    function makeMetricChip(label, value, segmentClass, highlightId) {
        return `
            <div class="hud-metric-chip">
                <span>${label}</span>
                <strong class="math-seg ${segmentClass}" data-highlight="${highlightId}">${value.toFixed(2)}</strong>
            </div>
        `;
    }

    function updateChalkboardHUD() {
        const ab = renderValues.ab;
        const ac = renderValues.ac;
        const bc = renderValues.bc;
        const ad = renderValues.ad;
        const bd = renderValues.bd;
        const cd = renderValues.cd;
        let html = "";

        if (currentScene === "similarity-relation") {
            const pair = getSimilarityPair();
            const ratioHtml = pair.ratioValues.map(item => `
                <div class="ratio-pill">
                    <span>${item.label}</span>
                    <strong>${Number.isFinite(item.value) ? item.value.toFixed(3) : "--"}</strong>
                </div>
            `).join("");
            html = `
                <div class="hud-kpi">
                    <span>当前相似</span>
                    <strong>${pair.relation}</strong>
                </div>
                <div class="hud-mini-row">
                    <span>对应</span>
                    <b>${pair.mapping}</b>
                </div>
                <div class="hud-mini-row">
                    <span>判定</span>
                    <b>${pair.criterion}</b>
                </div>
                <div class="hud-equation-box success-box">
                    <div class="title">对应边比例</div>
                    <div class="formula formula-stack">
                        <strong>${pair.formula}</strong>
                        <div class="ratio-grid">${ratioHtml}</div>
                    </div>
                </div>
                <div class="hud-demo-note">${getDemoStageText()}</div>
            `;
        } else if (currentScene === "projection-theorem") {
            const formulas = {
                "ad-bd-cd": {
                    title: "高度定理",
                    formula: "AD² = BD · CD",
                    lhs: ad * ad,
                    rhs: bd * cd,
                    metrics: [
                        makeMetricChip("AD", ad, "seg-ad", "ad"),
                        makeMetricChip("BD", bd, "seg-bd", "bd"),
                        makeMetricChip("CD", cd, "seg-cd", "cd")
                    ]
                },
                "ab-bd-bc": {
                    title: "左直角边射影",
                    formula: "AB² = BD · BC",
                    lhs: ab * ab,
                    rhs: bd * bc,
                    metrics: [
                        makeMetricChip("AB", ab, "seg-ab", "ab"),
                        makeMetricChip("BD", bd, "seg-bd", "bd"),
                        makeMetricChip("BC", bc, "seg-bc", "bc")
                    ]
                },
                "ac-cd-bc": {
                    title: "右直角边射影",
                    formula: "AC² = CD · BC",
                    lhs: ac * ac,
                    rhs: cd * bc,
                    metrics: [
                        makeMetricChip("AC", ac, "seg-ac", "ac"),
                        makeMetricChip("CD", cd, "seg-cd", "cd"),
                        makeMetricChip("BC", bc, "seg-bc", "bc")
                    ]
                }
            };
            const item = formulas[subMode] || formulas["ad-bd-cd"];
            html = `
                <div class="hud-kpi">
                    <span>${item.title}</span>
                    <strong>${item.formula}</strong>
                </div>
                <div class="hud-metric-grid">${item.metrics.join("")}</div>
                <div class="hud-equation-box success-box">
                    <div class="title">面积值对照</div>
                    <div class="formula compact-equality">
                        <span>${item.lhs.toFixed(2)}</span>
                        <b>=</b>
                        <span>${item.rhs.toFixed(2)}</span>
                    </div>
                </div>
            `;
        } else if (currentScene === "area-identity") {
            const area1 = ab * ac;
            const area2 = bc * ad;
            html = `
                <div class="hud-kpi">
                    <span>同一个面积</span>
                    <strong>AB · AC = BC · AD</strong>
                </div>
                <div class="hud-mini-row">
                    <span>两种底高</span>
                    <b>S = 1/2 AB·AC = 1/2 BC·AD</b>
                </div>
                <div class="hud-metric-grid two-cols">
                    ${makeMetricChip("AB", ab, "seg-ab", "ab")}
                    ${makeMetricChip("AC", ac, "seg-ac", "ac")}
                    ${makeMetricChip("BC", bc, "seg-bc", "bc")}
                    ${makeMetricChip("AD", ad, "seg-ad", "ad")}
                </div>
                <div class="hud-equation-box success-box">
                    <div class="title">双倍面积</div>
                    <div class="formula compact-equality">
                        <span>${area1.toFixed(2)}</span>
                        <b>=</b>
                        <span>${area2.toFixed(2)}</span>
                    </div>
                </div>
            `;
        }

        stepsChalkboard.innerHTML = html;
    }

    // ==========================================================================
    // 8. 定理深度解析 (卡片更新)
    // ==========================================================================
    function updateTheoryContent() {
        if (currentScene === "similarity-relation") {
            const pair = getSimilarityPair();
            theoryTitle.innerHTML = "当前相似关系";
            theoryText.innerHTML = `
                <div class="theory-mini-card">
                    <span>条件</span>
                    <strong>∠A = 90°，AD ⊥ BC</strong>
                </div>
                <div class="theory-mini-card">
                    <span>判定</span>
                    <strong>${pair.criterion}</strong>
                </div>
                <div class="theory-result-card">
                    <span>结论</span>
                    <strong>${pair.relation}</strong>
                </div>
                <div class="proof-flow">
                    <div class="proof-chip"><span>对应</span><strong>${pair.mapping}</strong></div>
                    <div class="proof-result"><span>比例</span><strong>${pair.formula}</strong></div>
                </div>
            `;
        } else if (currentScene === "projection-theorem") {
            const theoremMap = {
                "ad-bd-cd": ["高度定理", "AD² = BD · CD", "高线 AD 是 BD 与 CD 的比例中项"],
                "ab-bd-bc": ["左直角边射影", "AB² = BD · BC", "直角边 AB 对应斜边上的射影 BD"],
                "ac-cd-bc": ["右直角边射影", "AC² = CD · BC", "直角边 AC 对应斜边上的射影 CD"]
            };
            const item = theoremMap[subMode] || theoremMap["ad-bd-cd"];
            theoryTitle.innerHTML = "射影定理";
            theoryText.innerHTML = `
                <div class="theory-mini-card">
                    <span>当前公式</span>
                    <strong>${item[1]}</strong>
                </div>
                <div class="theory-mini-card">
                    <span>几何意义</span>
                    <strong>正方形面积 = 对应矩形面积</strong>
                </div>
                <div class="theory-result-card">
                    <span>${item[0]}</span>
                    <strong>${item[2]}</strong>
                </div>
            `;
        } else if (currentScene === "area-identity") {
            theoryTitle.innerHTML = "面积恒等";
            theoryText.innerHTML = `
                <div class="theory-mini-card">
                    <span>直角边底高</span>
                    <strong>S = 1/2 AB · AC</strong>
                </div>
                <div class="theory-mini-card">
                    <span>斜边底高</span>
                    <strong>S = 1/2 BC · AD</strong>
                </div>
                <div class="theory-result-card">
                    <span>同一面积</span>
                    <strong>AB · AC = BC · AD</strong>
                </div>
            `;
        }
    }

    // ==========================================================================
    // 9. LERP 平滑渲染循环与动画处理
    // ==========================================================================
    function updateLerp() {
        const k = 0.15;

        // 特殊形状预设过渡
        if (isPresetTransitioning) {
            const k_p = 0.12; // 预设阻尼系数
            theta += (targetTheta - theta) * k_p;
            lenBC += (targetLenBC - lenBC) * k_p;

            // 同步反馈到 DOM sliders
            sliderAngleTheta.value = (theta * 180 / Math.PI).toFixed(1);
            valAngleTheta.textContent = (theta * 180 / Math.PI).toFixed(0) + "°";
            sliderLenBc.value = lenBC.toFixed(0);
            valLenBc.textContent = lenBC.toFixed(0) + " px";

            const dT = Math.abs(theta - targetTheta);
            const dL = Math.abs(lenBC - targetLenBC);
            if (dT < 1e-3 && dL < 0.2) {
                theta = targetTheta;
                lenBC = targetLenBC;
                isPresetTransitioning = false;
            }
        }

        // 渲染值 LERP
        renderValues.theta += (theta - renderValues.theta) * k;
        renderValues.lenBC += (lenBC - renderValues.lenBC) * k;

        // 相似重合动画处理
        if (animDirection !== 0) {
            animProgress += animDirection * 0.022;
            if (animProgress >= 1.0) {
                animProgress = 1.0;
                animDirection = 0;
                isAnimating = false;

                // 爆发粒子效果 (在重叠端点上爆发)
                const rect = sandboxSvg.getBoundingClientRect();
                const scale = zoomScale;
                const sA = { x: rect.left + points.A.x * scale, y: rect.top + points.A.y * scale };
                const sB = { x: rect.left + points.B.x * scale, y: rect.top + points.B.y * scale };
                const sC = { x: rect.left + points.C.x * scale, y: rect.top + points.C.y * scale };

                spawnExplosion(sA.x, sA.y, "var(--segment-ad)");
                spawnExplosion(sB.x, sB.y, "var(--segment-ab)");
                spawnExplosion(sC.x, sC.y, "var(--segment-ac)");

            } else if (animProgress <= 0.0) {
                animProgress = 0.0;
                animDirection = 0;
                isAnimating = false;
            }
        }
        renderValues.animProgress += (animProgress - renderValues.animProgress) * 0.28;

        solveGeometry();
        renderSVG();
        updateHTMLOverlayAndHUD();
    }

    let lerpId = null;
    function startLerpLoop() {
        function loop() {
            updateLerp();
            lerpId = requestAnimationFrame(loop);
        }
        if (!lerpId) loop();
    }
    startLerpLoop();

    function playFoldingAnimation() {
        if (isAnimating) return;
        isAnimating = true;

        if (animProgress < 0.5) {
            animDirection = 1;
            btnPlayFolding.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12,6V9L16,5L12,1L12,4A8,8 0 0,0 4,12C4,13.9 4.7,15.7 5.8,17.1L7.2,15.7C6.4,14.7 6,13.4 6,12A6,6 0 0,1 12,6M18.2,6.9L16.8,8.3C17.6,9.3 18,10.6 18,12A6,6 0 0,1 12,18V15L8,19L12,23V20A8,8 0 0,0 20,12C20,10.1 19.3,8.3 18.2,6.9Z"/></svg>
                收回拆分演示
            `;
        } else {
            animDirection = -1;
            btnPlayFolding.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12,6V9L16,5L12,1L12,4A8,8 0 0,0 4,12C4,13.9 4.7,15.7 5.8,17.1L7.2,15.7C6.4,14.7 6,13.4 6,12A6,6 0 0,1 12,6M18.2,6.9L16.8,8.3C17.6,9.3 18,10.6 18,12A6,6 0 0,1 12,18V15L8,19L12,23V20A8,8 0 0,0 20,12C20,10.1 19.3,8.3 18.2,6.9Z"/></svg>
                播放重合动画
            `;
        }
    }

    // ==========================================================================
    // 10. 场景切换与特定控件动态加载
    // ==========================================================================
    function loadScene(scene) {
        currentScene = scene;
        animProgress = 0.0;
        animDirection = 0;
        isAnimating = false;

        btnPlayFolding.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12,6V9L16,5L12,1L12,4A8,8 0 0,0 4,12C4,13.9 4.7,15.7 5.8,17.1L7.2,15.7C6.4,14.7 6,13.4 6,12A6,6 0 0,1 12,6M18.2,6.9L16.8,8.3C17.6,9.3 18,10.6 18,12A6,6 0 0,1 12,18V15L8,19L12,23V20A8,8 0 0,0 20,12C20,10.1 19.3,8.3 18.2,6.9Z"/></svg>
            播放重合动画
        `;

        // 1. 高亮主预设按钮
        document.querySelectorAll(".btn-preset").forEach(btn => {
            if (btn.getAttribute("data-scene") === scene) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });

        // 2. 动态构建子选择器项 (Sub-modes)
        const subSection = document.getElementById("section-sub-modes");
        if (scene === "similarity-relation") {
            subSection.style.display = "block";
            subModeTitle.innerHTML = "相似配对";
            subMode = "dba-abc";
            subModeContainer.innerHTML = `
                <button class="btn-secondary flex-btn btn-sub-mode active" data-sub="dba-abc">△DBA ∽ △ABC</button>
                <button class="btn-secondary flex-btn btn-sub-mode" data-sub="dac-abc">△DAC ∽ △ABC</button>
                <button class="btn-secondary flex-btn btn-sub-mode" data-sub="dba-dac">△DBA ∽ △DAC</button>
            `;
            document.getElementById("section-demo-controls").style.display = "block";
        } else if (scene === "projection-theorem") {
            subSection.style.display = "block";
            subModeTitle.innerHTML = "射影公式";
            subMode = "ad-bd-cd";
            subModeContainer.innerHTML = `
                <button class="btn-secondary flex-btn btn-sub-mode active" data-sub="ad-bd-cd">高度定理: AD²=BD·CD</button>
                <button class="btn-secondary flex-btn btn-sub-mode" data-sub="ab-bd-bc">左直角边: AB²=BD·BC</button>
                <button class="btn-secondary flex-btn btn-sub-mode" data-sub="ac-cd-bc">右直角边: AC²=CD·BC</button>
            `;
            document.getElementById("section-demo-controls").style.display = "none";
        } else if (scene === "area-identity") {
            subSection.style.display = "none"; // 面积恒等只有一个子模式，无需选择
            subMode = "default";
            document.getElementById("section-demo-controls").style.display = "none";
        }

        // 绑定子项按钮事件
        document.querySelectorAll(".btn-sub-mode").forEach(btn => {
            btn.addEventListener("click", () => {
                document.querySelectorAll(".btn-sub-mode").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                subMode = btn.getAttribute("data-sub");
                animProgress = 0.0;
                animDirection = 0;
                isAnimating = false;
                updateTheoryContent();
                solveGeometry();
            });
        });

        updateTheoryContent();
        if (!isPresetTransitioning) {
            centerModel();
        }
        solveGeometry();
    }

    function triggerShapePreset(shape) {
        isPresetTransitioning = true;
        const W = sandboxWrapper.clientWidth;
        centerX = W / 2;

        if (shape === "isoc-right") {
            targetTheta = Math.PI / 2; // 90度 (theta = 1.57)
            targetLenBC = 360;
        } else if (shape === "classic-30-60") {
            targetTheta = Math.PI / 3; // 60度 (theta = 1.047)
            targetLenBC = 380;
        } else if (shape === "pythagoras-345") {
            targetTheta = 1.8546; // 约 106.26度, B = 53.13度, cos B = 0.6, sin B = 0.8
            targetLenBC = 380;
        }
    }

    function resetState() {
        theta = 1.854;
        targetTheta = 1.854;
        lenBC = 380;
        targetLenBC = 380;

        sliderAngleTheta.value = 106.3;
        valAngleTheta.textContent = "106°";
        sliderLenBc.value = 380;
        valLenBc.textContent = "380 px";

        animProgress = 0.0;
        animDirection = 0;
        isAnimating = false;
        isPresetTransitioning = false;

        btnPlayFolding.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12,6V9L16,5L12,1L12,4A8,8 0 0,0 4,12C4,13.9 4.7,15.7 5.8,17.1L7.2,15.7C6.4,14.7 6,13.4 6,12A6,6 0 0,1 12,6M18.2,6.9L16.8,8.3C17.6,9.3 18,10.6 18,12A6,6 0 0,1 12,18V15L8,19L12,23V20A8,8 0 0,0 20,12C20,10.1 19.3,8.3 18.2,6.9Z"/></svg>
            播放重合动画
        `;

        centerModel();
        solveGeometry();
    }

    // 自适应居中
    function centerModel() {
        const W = sandboxWrapper.clientWidth;
        const H = sandboxWrapper.clientHeight;

        const shouldAvoidHud = isHudExpanded && W >= 640;
        const hudWidth = shouldAvoidHud ? Math.min(hudPanel.offsetWidth || 300, W * 0.44) : 0;
        const sidePadding = W < 760 ? 28 : 40;
        const modelWidth = lenBC + 70;

        zoomScale = shouldAvoidHud
            ? Math.min(1.0, Math.max(0.78, (W - hudWidth - sidePadding * 2) / modelWidth))
            : 1.0;

        if (shouldAvoidHud) {
            const scaledLeft = (W / 2 - lenBC / 2 - 35) * zoomScale;
            const scaledRight = (W / 2 + lenBC / 2 + 35) * zoomScale;
            const preferredLeft = hudWidth + sidePadding;
            const rightLimit = W - sidePadding;
            panX = Math.max(0, preferredLeft - scaledLeft);
            if (panX + scaledRight > rightLimit) {
                panX = Math.max(0, rightLimit - scaledRight);
            }
        } else {
            panX = 0;
        }
        panY = 0;

        centerX = W / 2;
        centerY = H / 2 - 30; // 留出下方矩形的绘制空间

        updateTransform();
    }

    window.addEventListener("resize", () => window.setTimeout(centerModel, 80));
    window.visualViewport?.addEventListener?.("resize", () => window.setTimeout(centerModel, 80));

    function getSandboxSize() {
        return {
            w: sandboxWrapper.clientWidth || 800,
            h: sandboxWrapper.clientHeight || 600
        };
    }

    function snapCssPixel(value) {
        const ratio = window.devicePixelRatio || 1;
        return Math.round(value * ratio) / ratio;
    }

    function localToScreen(x, y) {
        return {
            x: snapCssPixel(x * zoomScale + panX),
            y: snapCssPixel(y * zoomScale + panY)
        };
    }

    function clientToLocal(clientX, clientY) {
        const rect = sandboxWrapper.getBoundingClientRect();
        return {
            x: (clientX - rect.left - panX) / zoomScale,
            y: (clientY - rect.top - panY) / zoomScale
        };
    }

    function updateSvgViewport() {
        const { w, h } = getSandboxSize();
        const scale = Math.max(0.001, zoomScale);
        sandboxSvg.setAttribute("viewBox", `${-panX / scale} ${-panY / scale} ${w / scale} ${h / scale}`);
        sandboxSvg.style.transform = "";
        htmlOverlay.style.transform = "";
    }

    function positionOverlayLabels() {
        htmlOverlay.querySelectorAll(".brace-label").forEach((label) => {
            if (!label.dataset.localX || !label.dataset.localY) {
                const x = parseFloat(label.style.left);
                const y = parseFloat(label.style.top);
                if (Number.isFinite(x) && Number.isFinite(y)) {
                    label.dataset.localX = String(x);
                    label.dataset.localY = String(y);
                }
            }
            const x = Number(label.dataset.localX);
            const y = Number(label.dataset.localY);
            if (!Number.isFinite(x) || !Number.isFinite(y)) return;
            const screen = localToScreen(x, y);
            label.style.left = `${screen.x}px`;
            label.style.top = `${screen.y}px`;
        });
    }

    function updateTransform() {
        updateSvgViewport();
        positionOverlayLabels();
    }

    // ==========================================================================
    // 11. 手势与鼠标拖拽 (含顶点互斥机制)
    // ==========================================================================
    function zoomAt(factor, targetX, targetY) {
        const oldScale = zoomScale;
        zoomScale = Math.min(Math.max(zoomScale * factor, 0.55), 3.0);
        const localX = (targetX - panX) / oldScale;
        const localY = (targetY - panY) / oldScale;
        panX = targetX - localX * zoomScale;
        panY = targetY - localY * zoomScale;
        updateTransform();
    }

    function zoomAtCenter(factor) {
        const { w, h } = getSandboxSize();
        zoomAt(factor, w / 2, h / 2);
    }

    sandboxWrapper.addEventListener("wheel", (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
        const rect = sandboxWrapper.getBoundingClientRect();
        zoomAt(factor, e.clientX - rect.left, e.clientY - rect.top);
    }, { passive: false });

    sandboxWrapper.addEventListener("mousedown", (e) => {
        const pointWrapper = e.target.closest(".geo-point-wrapper");
        if (pointWrapper) {
            const pointId = pointWrapper.getAttribute("data-point-id");
            if (["A", "B", "C", "D"].includes(pointId)) {
                activeDragPoint = pointId;
                isPresetTransitioning = false;
                sandboxWrapper.classList.add("dragging-point");
                e.stopPropagation();
                e.preventDefault();
                return;
            }
        }

        if (e.button === 0) {
            isPanning = true;
            sandboxWrapper.classList.add("panning");
            startPanX = e.clientX - panX;
            startPanY = e.clientY - panY;
            e.preventDefault();
        }
    });

    window.addEventListener("mousemove", (e) => {
        if (activeDragPoint) {
            const { x: localX, y: localY } = clientToLocal(e.clientX, e.clientY);

            const O = points.O;
            const R = lenBC / 2;

            if (activeDragPoint === "A") {
                // 拖动圆周角 A: 重新解算 theta
                let angle = Math.atan2(O.y - localY, localX - O.x);
                if (angle < 0) angle += 2 * Math.PI;

                // 互斥安全角限制: theta ∈ [0.32, pi - 0.32], 保证与 B, C 间距 >= 35px
                const safeMargin = 0.32;
                let finalTheta = Math.min(Math.max(angle, safeMargin), Math.PI - safeMargin);
                if (isSnappingEnabled) {
                    finalTheta = snapTheta(finalTheta, lenBC);
                }
                theta = finalTheta;
                targetTheta = theta;

                sliderAngleTheta.value = (theta * 180 / Math.PI).toFixed(1);
                valAngleTheta.textContent = (theta * 180 / Math.PI).toFixed(0) + "°";

            } else if (activeDragPoint === "B") {
                // 拖动端点 B (只能沿水平方向)
                let tx = Math.min(Math.max(localX, 50), centerX - 110); // lenBC / 2 >= 110 => lenBC >= 220
                let rawLenBC = (centerX - tx) * 2;
                if (isSnappingEnabled) {
                    rawLenBC = snapLenBC(rawLenBC);
                }
                lenBC = rawLenBC;
                targetLenBC = lenBC;

                sliderLenBc.value = lenBC.toFixed(0);
                valLenBc.textContent = lenBC.toFixed(0) + " px";

            } else if (activeDragPoint === "C") {
                // 拖动端点 C (只能沿水平方向)
                let tx = Math.min(Math.max(localX, centerX + 110), 750);
                let rawLenBC = (tx - centerX) * 2;
                if (isSnappingEnabled) {
                    rawLenBC = snapLenBC(rawLenBC);
                }
                lenBC = rawLenBC;
                targetLenBC = lenBC;

                sliderLenBc.value = lenBC.toFixed(0);
                valLenBc.textContent = lenBC.toFixed(0) + " px";

            } else if (activeDragPoint === "D") {
                // 拖动垂足 D (等价于沿水平滑动 A 的 x 坐标，间接修改 theta)
                const dx = localX - O.x;
                const cosVal = dx / R;
                // 限制在安全角范围内
                const maxCos = Math.cos(0.32); // 约 0.95
                const clampedCos = Math.min(Math.max(cosVal, -maxCos), maxCos);
                
                let angle = Math.acos(clampedCos);
                if (isSnappingEnabled) {
                    angle = snapTheta(angle, lenBC);
                }
                theta = angle;
                targetTheta = theta;

                sliderAngleTheta.value = (theta * 180 / Math.PI).toFixed(1);
                valAngleTheta.textContent = (theta * 180 / Math.PI).toFixed(0) + "°";
            }
            return;
        }

        if (isPanning) {
            panX = e.clientX - startPanX;
            panY = e.clientY - startPanY;
            updateTransform();
        }
    });

    window.addEventListener("mouseup", () => {
        activeDragPoint = null;
        sandboxWrapper.classList.remove("dragging-point");
        if (isPanning) {
            isPanning = false;
            sandboxWrapper.classList.remove("panning");
        }
    });

    // 移动手势支持
    let initialTouchDist = 0;
    let initialTouchScale = 1.0;

    sandboxWrapper.addEventListener("touchstart", (e) => {
        if (e.touches.length === 2) {
            activeDragPoint = null;
            sandboxWrapper.classList.remove("dragging-point", "panning");
            initialTouchDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            initialTouchScale = zoomScale;
            e.preventDefault();
        } else if (e.touches.length === 1) {
            const touch = e.touches[0];
            const ptWrapper = e.target.closest(".geo-point-wrapper");
            if (ptWrapper) {
                const ptId = ptWrapper.getAttribute("data-point-id");
                if (["A", "B", "C", "D"].includes(ptId)) {
                    activeDragPoint = ptId;
                    isPresetTransitioning = false;
                    sandboxWrapper.classList.add("dragging-point");
                    e.stopPropagation();
                    e.preventDefault();
                    return;
                }
            }
            isPanning = true;
            sandboxWrapper.classList.add("panning");
            startPanX = touch.clientX - panX;
            startPanY = touch.clientY - panY;
            e.preventDefault();
        }
    }, { passive: false });

    sandboxWrapper.addEventListener("touchmove", (e) => {
        if (e.touches.length === 2 && initialTouchDist > 0) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const factor = dist / initialTouchDist;
            zoomScale = Math.min(Math.max(initialTouchScale * factor, 0.45), 3.0);
            updateTransform();
            e.preventDefault();
        } else if (e.touches.length === 1) {
            const touch = e.touches[0];
            const { x: localX, y: localY } = clientToLocal(touch.clientX, touch.clientY);
            const O = points.O;
            const R = lenBC / 2;

            if (activeDragPoint) {
                if (activeDragPoint === "A") {
                    let angle = Math.atan2(O.y - localY, localX - O.x);
                    if (angle < 0) angle += 2 * Math.PI;
                    const safeMargin = 0.32;
                    let finalTheta = Math.min(Math.max(angle, safeMargin), Math.PI - safeMargin);
                    if (isSnappingEnabled) {
                        finalTheta = snapTheta(finalTheta, lenBC);
                    }
                    theta = finalTheta;
                    targetTheta = theta;
                    sliderAngleTheta.value = (theta * 180 / Math.PI).toFixed(1);
                    valAngleTheta.textContent = (theta * 180 / Math.PI).toFixed(0) + "°";
                } else if (activeDragPoint === "B") {
                    let tx = Math.min(Math.max(localX, 50), centerX - 110);
                    let rawLenBC = (centerX - tx) * 2;
                    if (isSnappingEnabled) {
                        rawLenBC = snapLenBC(rawLenBC);
                    }
                    lenBC = rawLenBC;
                    targetLenBC = lenBC;
                    sliderLenBc.value = lenBC.toFixed(0);
                    valLenBc.textContent = lenBC.toFixed(0) + " px";
                } else if (activeDragPoint === "C") {
                    let tx = Math.min(Math.max(localX, centerX + 110), 750);
                    let rawLenBC = (tx - centerX) * 2;
                    if (isSnappingEnabled) {
                        rawLenBC = snapLenBC(rawLenBC);
                    }
                    lenBC = rawLenBC;
                    targetLenBC = lenBC;
                    sliderLenBc.value = lenBC.toFixed(0);
                    valLenBc.textContent = lenBC.toFixed(0) + " px";
                } else if (activeDragPoint === "D") {
                    const dx = localX - O.x;
                    const cosVal = dx / R;
                    const maxCos = Math.cos(0.32);
                    const clampedCos = Math.min(Math.max(cosVal, -maxCos), maxCos);
                    let angle = Math.acos(clampedCos);
                    if (isSnappingEnabled) {
                        angle = snapTheta(angle, lenBC);
                    }
                    theta = angle;
                    targetTheta = theta;
                    sliderAngleTheta.value = (theta * 180 / Math.PI).toFixed(1);
                    valAngleTheta.textContent = (theta * 180 / Math.PI).toFixed(0) + "°";
                }
                e.preventDefault();
            } else if (isPanning) {
                panX = touch.clientX - startPanX;
                panY = touch.clientY - startPanY;
                updateTransform();
                e.preventDefault();
            }
        }
    }, { passive: false });

    sandboxWrapper.addEventListener("touchend", () => {
        activeDragPoint = null;
        isPanning = false;
        initialTouchDist = 0;
        sandboxWrapper.classList.remove("dragging-point", "panning");
    });

    sandboxWrapper.addEventListener("touchcancel", () => {
        activeDragPoint = null;
        isPanning = false;
        initialTouchDist = 0;
        sandboxWrapper.classList.remove("dragging-point", "panning");
    });

    function highlightSegmentOnCanvas(segId, active) {
        let selector = "";
        if (segId === "ab") selector = ".geo-line-seg.seg-ab";
        else if (segId === "ac") selector = ".geo-line-seg.seg-ac";
        else if (segId === "ad") selector = ".geo-line-seg.seg-ad";
        else if (segId === "bd") selector = ".geo-line-seg.seg-bd";
        else if (segId === "cd") selector = ".geo-line-seg.seg-cd";
        else if (segId === "bc") selector = ".geo-line-seg.seg-bc-highlight";
        
        if (selector) {
            const el = document.querySelector(selector);
            if (el) {
                if (active) {
                    el.classList.add("active-glow");
                } else {
                    el.classList.remove("active-glow");
                }
            }
        }
    }

    // ==========================================================================
    // 12. 页面按钮绑定与初始化
    // ==========================================================================
    const btnToggleSnap = document.getElementById("btn-toggle-snap");
    btnToggleSnap.addEventListener("click", () => {
        isSnappingEnabled = !isSnappingEnabled;
        if (isSnappingEnabled) {
            btnToggleSnap.classList.add("active");
            btnToggleSnap.querySelector("span").textContent = "已开启整数厘米吸附";
        } else {
            btnToggleSnap.classList.remove("active");
            btnToggleSnap.querySelector("span").textContent = "开启整数厘米吸附";
        }
        solveGeometry();
    });

    // HUD 文字与画布几何元素悬浮高光联动
    stepsChalkboard.addEventListener("mouseover", (e) => {
        const mathSeg = e.target.closest(".math-seg");
        if (mathSeg) {
            const highlight = mathSeg.getAttribute("data-highlight");
            if (highlight) {
                highlightSegmentOnCanvas(highlight, true);
            }
        }
    });

    stepsChalkboard.addEventListener("mouseout", (e) => {
        const mathSeg = e.target.closest(".math-seg");
        if (mathSeg) {
            const highlight = mathSeg.getAttribute("data-highlight");
            if (highlight) {
                highlightSegmentOnCanvas(highlight, false);
            }
        }
    });

    sliderAngleTheta.addEventListener("input", (e) => {
        isPresetTransitioning = false;
        const deg = parseFloat(e.target.value);
        theta = deg * Math.PI / 180;
        targetTheta = theta;
        valAngleTheta.textContent = deg.toFixed(0) + "°";
    });

    sliderLenBc.addEventListener("input", (e) => {
        isPresetTransitioning = false;
        lenBC = parseFloat(e.target.value);
        targetLenBC = lenBC;
        valLenBc.textContent = lenBC.toFixed(0) + " px";
    });

    document.querySelectorAll(".btn-preset").forEach(btn => {
        btn.addEventListener("click", () => {
            const sc = btn.getAttribute("data-scene");
            loadScene(sc);
        });
    });

    document.querySelectorAll(".btn-shape-preset").forEach(btn => {
        btn.addEventListener("click", () => {
            const shape = btn.getAttribute("data-shape");
            triggerShapePreset(shape);
        });
    });

    btnPlayFolding.addEventListener("click", playFoldingAnimation);
    btnResetState.addEventListener("click", resetState);

    btnShowHelp.addEventListener("click", () => modalHelp.classList.add("active"));
    btnCloseHelp.addEventListener("click", () => modalHelp.classList.remove("active"));

    hudToggleBtn.addEventListener("click", () => {
        isHudExpanded = !isHudExpanded;
        if (isHudExpanded) {
            hudPanel.classList.remove("collapsed");
            hudPanel.classList.add("expanded");
        } else {
            hudPanel.classList.remove("expanded");
            hudPanel.classList.add("collapsed");
        }
        centerModel();
    });

    document.getElementById("btn-zoom-in").addEventListener("click", () => zoomAtCenter(1.15));
    document.getElementById("btn-zoom-out").addEventListener("click", () => zoomAtCenter(1 / 1.15));
    document.getElementById("btn-zoom-reset").addEventListener("click", () => centerModel());

    sandboxWrapper.parentNode.addEventListener("dblclick", (e) => {
        if (e.target.closest(".btn-zoom") || e.target.closest(".control-column") || e.target.closest(".btn-shape-preset")) return;
        centerModel();
    });

    // 暴露状态接口，利于自动化自测
    window.appState = {
        get currentScene() { return currentScene; },
        get subMode() { return subMode; },
        get theta() { return theta; },
        get lenBC() { return lenBC; },
        get points() { return points; },
        get isSnappingEnabled() { return isSnappingEnabled; },
        set isSnappingEnabled(val) {
            isSnappingEnabled = val;
            if (isSnappingEnabled) {
                btnToggleSnap.classList.add("active");
                btnToggleSnap.querySelector("span").textContent = "已开启整数厘米吸附";
            } else {
                btnToggleSnap.classList.remove("active");
                btnToggleSnap.querySelector("span").textContent = "开启整数厘米吸附";
            }
            solveGeometry();
        },
        get isAnimating() { return isAnimating; },
        get isHudExpanded() { return isHudExpanded; },
        get zoomScale() { return zoomScale; },
        get panX() { return panX; },
        get panY() { return panY; },
        get renderValues() {
            return {
                theta: renderValues.theta,
                lenBC: renderValues.lenBC,
                animProgress: renderValues.animProgress,
                ab: renderValues.ab,
                ac: renderValues.ac,
                bc: renderValues.bc,
                ad: renderValues.ad,
                bd: renderValues.bd,
                cd: renderValues.cd
            };
        },
        resetState,
        loadScene,
        triggerShapePreset
    };

    loadScene("similarity-relation");
});
