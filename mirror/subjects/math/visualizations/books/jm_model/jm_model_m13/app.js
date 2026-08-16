/**
 * 圆幂模型演示仪 - 几何可视化交互控制脚本 (app.js)
 */

document.addEventListener("DOMContentLoaded", () => {
    // ==========================================================================
    // 1. 全局状态变量与参数
    // ==========================================================================
    let currentScene = "intersecting-chords"; // intersecting-chords | secants-theorem | secant-tangent
    let isAnimating = false;
    let isHudExpanded = false;
    let isAreaProofHudExpanded = false;
    let proofLayerLevel = 0; // 0 none | 1 auxiliary lines | 2 equal angles | 3 similar triangles
    let isSnappingEnabled = false;

    // 圆的圆心与几何参数
    const O = { x: 400, y: 220 };
    let circleR = 130;       // 半径 (像素)
    let targetCircleR = 130;

    let distD = 65;         // P 到 O 的距离 (像素)
    let targetDistD = 65;

    let thetaP = 0;         // P 在以 O 为原点的极坐标系下的角度 (弧度)
    let targetThetaP = 0;

    // 弦/割线的旋转角度 (以 P 为起点)
    let phi1 = 45 * Math.PI / 180;
    let targetPhi1 = 45 * Math.PI / 180;

    let phi2 = 135 * Math.PI / 180;
    let targetPhi2 = 135 * Math.PI / 180;

    // 相似重合与等积 morph 动画进度
    let animProgress = 0.0;
    let animDirection = 0; // 1: 播放动画, -1: 收回动画

    // 预设平滑过渡标志
    let isPresetTransitioning = false;

    // LERP 平滑渲染值系统
    const renderValues = {
        circleR: 130,
        distD: 65,
        thetaP: 0,
        phi1: 45 * Math.PI / 180,
        phi2: 135 * Math.PI / 180,
        animProgress: 0.0,
        // 线段测量值 (厘米)
        pa: 0.0, pb: 0.0, pc: 0.0, pd: 0.0, pt: 0.0,
        power: 0.0
    };

    // 画布平移与缩放
    let zoomScale = 1.0;
    let panX = 0;
    let panY = 0;
    let isPanning = false;
    let startPanX = 0, startPanY = 0;

    // 拖拽点状态
    let activeDragPoint = null;

    const SCALE_CM_TO_PX = 38; // 38像素代表1厘米

    // 关键点坐标容器 (解算器更新)
    const points = {
        O: { x: 400, y: 220 },
        P: { x: 465, y: 220 },
        A: { x: 0, y: 0 },
        B: { x: 0, y: 0 },
        C: { x: 0, y: 0 },
        D: { x: 0, y: 0 },
        T: { x: 0, y: 0 }
    };

    // ==========================================================================
    // 2. DOM 元素获取
    // ==========================================================================
    const sandboxWrapper = document.getElementById("sandbox-wrapper");
    const sandboxSvg = document.getElementById("sandbox-svg");
    const htmlOverlay = document.getElementById("html-overlay");
    const stepsChalkboard = document.getElementById("steps-hud-chalkboard");
    const hudPanel = document.getElementById("hud-chalkboard-panel");
    const hudToggleBtn = document.getElementById("hud-toggle-btn");
    const areaProofHud = document.getElementById("area-proof-hud");
    const areaProofToggleBtn = document.getElementById("area-proof-toggle-btn");
    const areaProofBody = document.getElementById("area-proof-body");

    const sliderCircleR = document.getElementById("slider-circle-r");
    const valCircleR = document.getElementById("val-circle-r");
    const sliderDistD = document.getElementById("slider-dist-d");
    const valDistD = document.getElementById("val-dist-d");
    const sliderPhi1 = document.getElementById("slider-phi-1");
    const valPhi1 = document.getElementById("val-phi-1");
    const sliderPhi2 = document.getElementById("slider-phi-2");
    const valPhi2 = document.getElementById("val-phi-2");

    const proofLayerControls = document.getElementById("proof-layer-controls");
    const btnToggleSnap = document.getElementById("btn-toggle-snap");
    const btnPlayMorph = document.getElementById("btn-play-morph");
    const btnResetState = document.getElementById("btn-reset-state");
    const btnShowHelp = document.getElementById("btn-show-help");
    const btnCloseHelp = document.getElementById("btn-close-help");
    const modalHelp = document.getElementById("modal-help");

    const theoryTitle = document.getElementById("theory-title");
    const theoryText = document.getElementById("theory-text");

    // ==========================================================================
    // 3. Canvas 物理粒子效果 (重力火花)
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
            this.vy = (Math.random() - 0.7) * 9 - 3;
            this.radius = Math.random() * 3 + 2.0;
            this.color = color;
            this.alpha = 1.0;
            this.gravity = 0.22;
            this.life = 1.0;
            this.decay = Math.random() * 0.02 + 0.015;
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

    function spawnExplosion(x, y, color = "#8b5cf6") {
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
    // 4. 几何核心解算器 (Geometry Solver)
    // ==========================================================================
    
    // 求解射线和圆的交点
    function getCircleRayIntersection(px, py, angle, cx, cy, r) {
        const ux = Math.cos(angle);
        const uy = Math.sin(angle);
        const vx = px - cx;
        const vy = py - cy;
        
        const b = vx * ux + vy * uy;
        const c = vx * vx + vy * vy - r * r;
        const disc = b * b - c;
        
        if (disc < 0) {
            return null; // 无交点
        }
        
        const sqrtD = Math.sqrt(disc);
        const t1 = -b + sqrtD;
        const t2 = -b - sqrtD;
        return [t1, t2];
    }

    function solveGeometry() {
        // 使用 LERP 渲染值进行解算
        const curR = renderValues.circleR;
        const curD = renderValues.distD;
        const curThetaP = renderValues.thetaP;
        const curPhi1 = renderValues.phi1;
        const curPhi2 = renderValues.phi2;

        points.O.x = O.x;
        points.O.y = O.y;

        // 解算点 P 位置
        points.P.x = O.x + curD * Math.cos(curThetaP);
        points.P.y = O.y + curD * Math.sin(curThetaP);

        // 计算圆幂
        if (currentScene === "intersecting-chords") {
            renderValues.power = Math.max(0, curR * curR - curD * curD) / (SCALE_CM_TO_PX * SCALE_CM_TO_PX);
        } else {
            renderValues.power = Math.max(0, curD * curD - curR * curR) / (SCALE_CM_TO_PX * SCALE_CM_TO_PX);
        }

        // 解算第一条线相交点 A, B
        const tAB = getCircleRayIntersection(points.P.x, points.P.y, curPhi1, O.x, O.y, curR);
        if (tAB) {
            if (currentScene === "intersecting-chords") {
                // 点在圆内，一正一负
                const t1 = Math.max(tAB[0], tAB[1]);
                const t2 = Math.min(tAB[0], tAB[1]);
                points.A.x = points.P.x + t1 * Math.cos(curPhi1);
                points.A.y = points.P.y + t1 * Math.sin(curPhi1);
                points.B.x = points.P.x + t2 * Math.cos(curPhi1);
                points.B.y = points.P.y + t2 * Math.sin(curPhi1);
                renderValues.pa = t1 / SCALE_CM_TO_PX;
                renderValues.pb = -t2 / SCALE_CM_TO_PX;
            } else {
                // 点在圆外，同号 (正数)
                const t1 = Math.min(tAB[0], tAB[1]);
                const t2 = Math.max(tAB[0], tAB[1]);
                points.A.x = points.P.x + t1 * Math.cos(curPhi1);
                points.A.y = points.P.y + t1 * Math.sin(curPhi1);
                points.B.x = points.P.x + t2 * Math.cos(curPhi1);
                points.B.y = points.P.y + t2 * Math.sin(curPhi1);
                renderValues.pa = t1 / SCALE_CM_TO_PX;
                renderValues.pb = t2 / SCALE_CM_TO_PX;
            }
        }

        // 解算第二条线相交点 C, D (仅在场景 1 和 2 中)
        if (currentScene !== "secant-tangent") {
            const tCD = getCircleRayIntersection(points.P.x, points.P.y, curPhi2, O.x, O.y, curR);
            if (tCD) {
                if (currentScene === "intersecting-chords") {
                    const t1 = Math.max(tCD[0], tCD[1]);
                    const t2 = Math.min(tCD[0], tCD[1]);
                    points.C.x = points.P.x + t1 * Math.cos(curPhi2);
                    points.C.y = points.P.y + t1 * Math.sin(curPhi2);
                    points.D.x = points.P.x + t2 * Math.cos(curPhi2);
                    points.D.y = points.P.y + t2 * Math.sin(curPhi2);
                    renderValues.pc = t1 / SCALE_CM_TO_PX;
                    renderValues.pd = -t2 / SCALE_CM_TO_PX;
                } else {
                    const t1 = Math.min(tCD[0], tCD[1]);
                    const t2 = Math.max(tCD[0], tCD[1]);
                    points.C.x = points.P.x + t1 * Math.cos(curPhi2);
                    points.C.y = points.P.y + t1 * Math.sin(curPhi2);
                    points.D.x = points.P.x + t2 * Math.cos(curPhi2);
                    points.D.y = points.P.y + t2 * Math.sin(curPhi2);
                    renderValues.pc = t1 / SCALE_CM_TO_PX;
                    renderValues.pd = t2 / SCALE_CM_TO_PX;
                }
            }
        } else {
            // 场景 3：切割线定理，解算切点 T
            // 只在点 P 在圆外时存在切线
            if (curD > curR) {
                const alphaOp = curThetaP;
                const thetaTangent = Math.acos(curR / curD);
                // 选择上方的切点
                const tAngle = alphaOp + thetaTangent;
                points.T.x = O.x + curR * Math.cos(tAngle);
                points.T.y = O.y + curR * Math.sin(tAngle);
                renderValues.pt = Math.sqrt(curD * curD - curR * curR) / SCALE_CM_TO_PX;
            } else {
                points.T.x = points.P.x;
                points.T.y = points.P.y;
                renderValues.pt = 0;
            }
        }
    }

    // ==========================================================================
    // 5. 整数厘米吸附数学计算器 (Snapping Utility)
    // ==========================================================================
    
    // 吸附距离 d 使圆幂值为整数
    function snapDistanceD(rawD, R) {
        const scale = SCALE_CM_TO_PX;
        const rCm = R / scale;
        const rawDCm = rawD / scale;
        
        let targetN = 0;
        let snappedDCm = rawDCm;

        if (currentScene === "intersecting-chords") {
            // N = R^2 - d^2
            const maxN = rCm * rCm;
            const currentN = maxN - rawDCm * rawDCm;
            targetN = Math.round(currentN);
            // 限制在合理范围内，防止 d 太靠近圆心或圆周
            targetN = Math.max(1, Math.min(Math.floor(maxN - 0.25), targetN));
            snappedDCm = Math.sqrt(maxN - targetN);
        } else {
            // N = d^2 - R^2
            const currentN = rawDCm * rawDCm - rCm * rCm;
            
            if (currentScene === "secant-tangent") {
                // 切割线定理下，吸附圆幂 N 为完美平方数，使 PT = sqrt(N) 为整数
                const currentPT = Math.sqrt(Math.max(0, currentN));
                const targetPT = Math.round(currentPT);
                // 限制在合理范围内 (PT 范围 2cm 至 7cm)
                const clampedPT = Math.max(2, Math.min(7, targetPT));
                targetN = clampedPT * clampedPT;
            } else {
                // 割线定理下，吸附 N 为任意整数
                targetN = Math.round(currentN);
                targetN = Math.max(4, Math.min(45, targetN));
            }
            snappedDCm = Math.sqrt(rCm * rCm + targetN);
        }
        
        return snappedDCm * scale;
    }

    // 吸附线段倾角 phi 使分割线段为整数或半厘米
    function snapPhi(rawPhi, lineIndex) {
        const scale = SCALE_CM_TO_PX;
        const curD = distD;
        const curR = circleR;
        
        const dCm = curD / scale;
        const rCm = curR / scale;
        const powerCm = renderValues.power; // 厘米下的圆幂乘积值

        // 线段长度候选值
        const lenCandidates = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1.5, 2.5, 3.5, 4.5, 5.5];
        const angleCandidates = [];

        // 方向向量：从 P 到 O
        const alphaPo = thetaP + Math.PI;

        for (let k of lenCandidates) {
            let cosOffset = 0;
            if (currentScene === "intersecting-chords") {
                // cos(offset) = (N - k^2) / (2 * d * k)
                cosOffset = (powerCm - k * k) / (2 * dCm * k);
            } else {
                // cos(offset) = -(k^2 + N) / (2 * d * k)
                cosOffset = -(k * k + powerCm) / (2 * dCm * k);
            }

            if (Math.abs(cosOffset) <= 1.0) {
                const offsetAngle = Math.acos(cosOffset);
                angleCandidates.push(alphaPo + offsetAngle);
                angleCandidates.push(alphaPo - offsetAngle);
            }
        }

        // 寻找最靠近的候选角度 (阈值 3.5 度 = 0.06 弧度)
        let closestAngle = rawPhi;
        let minDiff = 0.06;

        for (let cand of angleCandidates) {
            // 标准化到 [-PI, PI] 或者与 rawPhi 的最小角距
            let diff = Math.abs(normalizeAngle(rawPhi - cand));
            if (diff < minDiff) {
                minDiff = diff;
                closestAngle = cand;
            }
        }

        return normalizeAngle(closestAngle);
    }

    function normalizeAngle(angle) {
        while (angle < -Math.PI) angle += 2 * Math.PI;
        while (angle > Math.PI) angle -= 2 * Math.PI;
        return angle;
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function getProofBoxDimensions(firstLen, secondLen, unit, targetSide, progress, scaleFactor) {
        const longSide = Math.max(firstLen, secondLen);
        const shortSide = Math.min(firstLen, secondLen);
        return {
            w: ((1 - progress) * longSide * unit + progress * targetSide) * scaleFactor,
            h: ((1 - progress) * shortSide * unit + progress * targetSide) * scaleFactor
        };
    }

    function getAreaProofMetrics() {
        const t = renderValues.animProgress;
        const rightLabel = currentScene === "secant-tangent" ? "PT²" : "PC × PD";
        const rightSubLabel = currentScene === "secant-tangent" ? "切线平方" : "第二组乘积";
        const leftSubLabel = "第一组乘积";
        const focusText = currentScene === "intersecting-chords"
            ? "圆内两弦分段乘积相等"
            : currentScene === "secants-theorem"
                ? "圆外两割线外段乘全长相等"
                : "切线段平方等于割线乘积";
        const rightA = currentScene === "secant-tangent" ? renderValues.pt : renderValues.pc;
        const rightB = currentScene === "secant-tangent" ? renderValues.pt : renderValues.pd;
        const maxLong = Math.max(renderValues.pa, renderValues.pb, rightA, rightB, 1);
        const maxShort = Math.max(
            Math.min(renderValues.pa, renderValues.pb),
            Math.min(rightA, rightB),
            0.2
        );
        const proofUnit = Math.min(108 / maxLong, 34 / maxShort);
        const targetSquareSize = Math.sqrt(Math.max(renderValues.pa * renderValues.pb, 0.01)) * proofUnit;
        const lift = Math.sin(t * Math.PI);
        const scaleFactor = 1.0 + 0.05 * lift;

        return {
            t,
            rightLabel,
            rightSubLabel,
            leftSubLabel,
            leftDims: getProofBoxDimensions(renderValues.pa, renderValues.pb, proofUnit, targetSquareSize, t, scaleFactor),
            rightDims: getProofBoxDimensions(rightA, rightB, proofUnit, targetSquareSize, t, scaleFactor),
            targetSquareSize: targetSquareSize * scaleFactor,
            valueText: renderValues.power.toFixed(2),
            focusText,
            isFinal: t >= 0.9
        };
    }

    function setAreaProofHudExpanded(expanded) {
        isAreaProofHudExpanded = expanded;
        areaProofHud?.classList.toggle("collapsed", !expanded);
        areaProofToggleBtn?.setAttribute("aria-expanded", String(expanded));
    }

    function setProofLayerLevel(level) {
        proofLayerLevel = clamp(level, 0, 3);
        proofLayerControls?.querySelectorAll(".layer-step-btn").forEach(btn => {
            const layer = btn.getAttribute("data-layer");
            const value = layer === "lines" ? 1 : layer === "angles" ? 2 : layer === "triangles" ? 3 : 0;
            btn.classList.toggle("active", value > 0 && value <= proofLayerLevel);
        });
    }

    function getPointLabelOffset(id) {
        const map = {
            O: { x: -18, y: -16 },
            P: currentScene === "intersecting-chords" ? { x: 12, y: 22 } : { x: 14, y: 18 },
            A: currentScene === "secant-tangent" ? { x: 10, y: -12 } : { x: 10, y: -10 },
            B: currentScene === "secant-tangent" ? { x: -22, y: 16 } : { x: 10, y: 16 },
            C: { x: -24, y: -10 },
            D: { x: -24, y: 16 },
            T: { x: -36, y: 20 }
        };
        return map[id] || { x: 12, y: 8 };
    }

    function getNearestDraggablePoint(clientX, clientY, radius = 36) {
        const { x: localX, y: localY } = clientToLocal(clientX, clientY);
        const available = currentScene === "secant-tangent" ? ["P", "A", "B"] : ["P", "A", "B", "C", "D"];
        let best = null;
        let bestDist = radius;
        available.forEach(id => {
            const pt = points[id];
            if (!pt) return;
            const dist = Math.hypot(localX - pt.x, localY - pt.y) * zoomScale;
            if (dist < bestDist) {
                bestDist = dist;
                best = id;
            }
        });
        return best;
    }

    function getLocalPointFromEvent(event) {
        return clientToLocal(event.clientX, event.clientY);
    }

    function getLocalPointFromTouch(touch) {
        return clientToLocal(touch.clientX, touch.clientY);
    }

    function applyPointDrag(pointId, localX, localY) {
        if (!pointId) return;

        if (pointId === "P") {
            let d = Math.hypot(localX - O.x, localY - O.y);
            let angle = Math.atan2(localY - O.y, localX - O.x);

            if (currentScene === "intersecting-chords") {
                d = Math.min(circleR - 20, d);
            } else {
                d = Math.min(300, Math.max(circleR + 35, d));
            }

            if (isSnappingEnabled) {
                d = snapDistanceD(d, circleR);
            }

            distD = d;
            targetDistD = d;
            thetaP = angle;
            targetThetaP = angle;
            sliderDistD.value = d;
            valDistD.textContent = d.toFixed(0) + " px";
            return;
        }

        if (pointId === "A" || pointId === "B" || pointId === "C" || pointId === "D") {
            const lineIndex = pointId === "A" || pointId === "B" ? 1 : 2;
            let angle = Math.atan2(localY - points.P.y, localX - points.P.x);
            angle = normalizeAngle(angle);

            if (currentScene !== "intersecting-chords") {
                const alphaPo = normalizeAngle(thetaP + Math.PI);
                const thetaTangent = Math.acos(circleR / distD);
                let diff = normalizeAngle(angle - alphaPo);
                const maxDiff = thetaTangent - 0.05;
                diff = Math.min(maxDiff, Math.max(-maxDiff, diff));
                angle = normalizeAngle(alphaPo + diff);
            }

            if (isSnappingEnabled) {
                angle = snapPhi(angle, lineIndex);
            }

            if (lineIndex === 1) {
                phi1 = angle;
                targetPhi1 = angle;
                sliderPhi1.value = (phi1 * 180 / Math.PI).toFixed(1);
                valPhi1.textContent = (phi1 * 180 / Math.PI).toFixed(0) + "°";
            } else {
                phi2 = angle;
                targetPhi2 = angle;
                sliderPhi2.value = (phi2 * 180 / Math.PI).toFixed(1);
                valPhi2.textContent = (phi2 * 180 / Math.PI).toFixed(0) + "°";
            }
        }
    }

    // ==========================================================================
    // 6. SVG 渲染逻辑
    // ==========================================================================
    function drawSVGPoint(id, pt, labelText, offset = { x: 12, y: 6 }, isDraggable = true) {
        let ptClass = "geo-point-wrapper";
        if (isDraggable) ptClass += " draggable-point";

        let html = `
            <g class="${ptClass}" data-point-id="${id}">
                <circle class="geo-point-halo" cx="${pt.x}" cy="${pt.y}" r="${isDraggable ? 30 : 18}"></circle>
                <circle class="geo-point-ring" cx="${pt.x}" cy="${pt.y}" r="${isDraggable ? 10 : 8}"></circle>
                <circle class="geo-point" cx="${pt.x}" cy="${pt.y}" r="${isDraggable ? 7 : 6}"></circle>
            </g>
        `;
        const textX = pt.x + offset.x;
        const textY = pt.y + offset.y;
        html += `<text class="geo-label" x="${textX}" y="${textY}">${labelText}</text>`;
        return html;
    }

    // 绘制等角标记弧形 (展示锐角对应相等关系)
    // 根据顶点及两射线方向，绘制扇区
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

    function renderSVG() {
        const curR = renderValues.circleR;
        const curD = renderValues.distD;
        const curThetaP = renderValues.thetaP;
        const curPhi1 = renderValues.phi1;
        const curPhi2 = renderValues.phi2;

        let drawHtml = "";

        // 1. 绘制圆 O
        drawHtml += `
            <circle class="geo-circle" cx="${O.x}" cy="${O.y}" r="${curR}"></circle>
            <polygon class="geo-polygon-fill" points="`;
        for (let i = 0; i < 360; i += 5) {
            const rad = i * Math.PI / 180;
            drawHtml += `${O.x + curR * Math.cos(rad)},${O.y + curR * Math.sin(rad)} `;
        }
        drawHtml += `"></polygon>`;

        // 2. 绘制弦/割线射线或段
        // 计算延长线端点以展现整条直线穿过圆的效果
        const extendLine = (p, angle, offsetPositive, offsetNegative) => {
            return {
                x1: p.x + offsetPositive * Math.cos(angle),
                y1: p.y + offsetPositive * Math.sin(angle),
                x2: p.x - offsetNegative * Math.cos(angle),
                y2: p.y - offsetNegative * Math.sin(angle)
            };
        };

        const ext1 = extendLine(points.P, curPhi1, 280, 280);
        drawHtml += `<line class="geo-line-seg auxiliary-line" x1="${ext1.x1}" y1="${ext1.y1}" x2="${ext1.x2}" y2="${ext1.y2}"></line>`;
        
        if (currentScene !== "secant-tangent") {
            const ext2 = extendLine(points.P, curPhi2, 280, 280);
            drawHtml += `<line class="geo-line-seg auxiliary-line" x1="${ext2.x1}" y1="${ext2.y1}" x2="${ext2.x2}" y2="${ext2.y2}"></line>`;
        } else {
            // 切割线定理绘制切线
            const extT = extendLine(points.P, Math.atan2(points.T.y - points.P.y, points.T.x - points.P.x), 280, 50);
            drawHtml += `<line class="geo-line-seg auxiliary-line" x1="${extT.x1}" y1="${extT.y1}" x2="${extT.x2}" y2="${extT.y2}"></line>`;
        }

        // 3. 高亮绘制 PA, PB, PC, PD, PT 几何实体段
        if (currentScene === "intersecting-chords") {
            drawHtml += `
                <line class="geo-line-seg seg-pa" x1="${points.P.x}" y1="${points.P.y}" x2="${points.A.x}" y2="${points.A.y}"></line>
                <line class="geo-line-seg seg-pb" x1="${points.P.x}" y1="${points.P.y}" x2="${points.B.x}" y2="${points.B.y}"></line>
                <line class="geo-line-seg seg-pc" x1="${points.P.x}" y1="${points.P.y}" x2="${points.C.x}" y2="${points.C.y}"></line>
                <line class="geo-line-seg seg-pd" x1="${points.P.x}" y1="${points.P.y}" x2="${points.D.x}" y2="${points.D.y}"></line>
            `;
        } else if (currentScene === "secants-theorem") {
            drawHtml += `
                <line class="geo-line-seg seg-pa" x1="${points.P.x}" y1="${points.P.y}" x2="${points.A.x}" y2="${points.A.y}"></line>
                <line class="geo-line-seg seg-pb" x1="${points.A.x}" y1="${points.A.y}" x2="${points.B.x}" y2="${points.B.y}"></line>
                <line class="geo-line-seg seg-pc" x1="${points.P.x}" y1="${points.P.y}" x2="${points.C.x}" y2="${points.C.y}"></line>
                <line class="geo-line-seg seg-pd" x1="${points.C.x}" y1="${points.C.y}" x2="${points.D.x}" y2="${points.D.y}"></line>
            `;
        } else if (currentScene === "secant-tangent") {
            drawHtml += `
                <line class="geo-line-seg seg-pa" x1="${points.P.x}" y1="${points.P.y}" x2="${points.A.x}" y2="${points.A.y}"></line>
                <line class="geo-line-seg seg-pb" x1="${points.A.x}" y1="${points.A.y}" x2="${points.B.x}" y2="${points.B.y}"></line>
                <line class="geo-line-seg seg-pt" x1="${points.P.x}" y1="${points.P.y}" x2="${points.T.x}" y2="${points.T.y}"></line>
            `;
        }

        // 4. 分层显示证明辅助元素：辅助线 -> 等角 -> 相似三角形
        if (proofLayerLevel > 0) {
            if (currentScene === "intersecting-chords") {
                if (proofLayerLevel >= 3) {
                    drawHtml += `
                        <polygon class="geo-polygon-fill sub-fill-1" points="${points.P.x},${points.P.y} ${points.A.x},${points.A.y} ${points.C.x},${points.C.y}"></polygon>
                        <polygon class="geo-polygon-fill sub-fill-2" points="${points.P.x},${points.P.y} ${points.B.x},${points.B.y} ${points.D.x},${points.D.y}"></polygon>
                    `;
                }
                drawHtml += `
                    <line class="geo-line-seg proof-auxiliary-line" x1="${points.A.x}" y1="${points.A.y}" x2="${points.C.x}" y2="${points.C.y}"></line>
                    <line class="geo-line-seg proof-auxiliary-line" x1="${points.B.x}" y1="${points.B.y}" x2="${points.D.x}" y2="${points.D.y}"></line>
                `;
                if (proofLayerLevel >= 2) {
                    drawHtml += `
                        <path class="geo-angle-sector" style="fill: var(--segment-pc-light);" d="${getAngleArcPath(points.C, points.A, points.P, 18, true)}"></path>
                        <path class="geo-angle-arc" style="stroke: var(--segment-pc);" d="${getAngleArcPath(points.C, points.A, points.P, 18)}"></path>
                        <path class="geo-angle-sector" style="fill: var(--segment-pc-light);" d="${getAngleArcPath(points.B, points.D, points.P, 18, true)}"></path>
                        <path class="geo-angle-arc" style="stroke: var(--segment-pc);" d="${getAngleArcPath(points.B, points.D, points.P, 18)}"></path>
                        <path class="geo-angle-sector" style="fill: rgba(245, 158, 11, 0.15);" d="${getAngleArcPath(points.A, points.P, points.C, 18, true)}"></path>
                        <path class="geo-angle-arc" style="stroke: #f59e0b;" d="${getAngleArcPath(points.A, points.P, points.C, 18)}"></path>
                        <path class="geo-angle-sector" style="fill: rgba(245, 158, 11, 0.15);" d="${getAngleArcPath(points.D, points.P, points.B, 18, true)}"></path>
                        <path class="geo-angle-arc" style="stroke: #f59e0b;" d="${getAngleArcPath(points.D, points.P, points.B, 18)}"></path>
                    `;
                }
            } else if (currentScene === "secants-theorem") {
                if (proofLayerLevel >= 3) {
                    drawHtml += `
                        <polygon class="geo-polygon-fill sub-fill-1" points="${points.P.x},${points.P.y} ${points.A.x},${points.A.y} ${points.D.x},${points.D.y}"></polygon>
                        <polygon class="geo-polygon-fill sub-fill-2" points="${points.P.x},${points.P.y} ${points.C.x},${points.C.y} ${points.B.x},${points.B.y}"></polygon>
                    `;
                }
                drawHtml += `
                    <line class="geo-line-seg proof-auxiliary-line" x1="${points.A.x}" y1="${points.A.y}" x2="${points.D.x}" y2="${points.D.y}"></line>
                    <line class="geo-line-seg proof-auxiliary-line" x1="${points.B.x}" y1="${points.B.y}" x2="${points.C.x}" y2="${points.C.y}"></line>
                `;
                if (proofLayerLevel >= 2) {
                    drawHtml += `
                        <path class="geo-angle-sector" style="fill: var(--segment-pc-light);" d="${getAngleArcPath(points.D, points.A, points.P, 18, true)}"></path>
                        <path class="geo-angle-arc" style="stroke: var(--segment-pc);" d="${getAngleArcPath(points.D, points.A, points.P, 18)}"></path>
                        <path class="geo-angle-sector" style="fill: var(--segment-pc-light);" d="${getAngleArcPath(points.B, points.C, points.P, 18, true)}"></path>
                        <path class="geo-angle-arc" style="stroke: var(--segment-pc);" d="${getAngleArcPath(points.B, points.C, points.P, 18)}"></path>
                        <path class="geo-angle-sector" style="fill: rgba(245, 158, 11, 0.15);" d="${getAngleArcPath(points.A, points.P, points.D, 18, true)}"></path>
                        <path class="geo-angle-arc" style="stroke: #f59e0b;" d="${getAngleArcPath(points.A, points.P, points.D, 18)}"></path>
                        <path class="geo-angle-sector" style="fill: rgba(245, 158, 11, 0.15);" d="${getAngleArcPath(points.C, points.P, points.B, 18, true)}"></path>
                        <path class="geo-angle-arc" style="stroke: #f59e0b;" d="${getAngleArcPath(points.C, points.P, points.B, 18)}"></path>
                    `;
                }
            } else if (currentScene === "secant-tangent") {
                if (proofLayerLevel >= 3) {
                    drawHtml += `
                        <polygon class="geo-polygon-fill sub-fill-1" points="${points.P.x},${points.P.y} ${points.A.x},${points.A.y} ${points.T.x},${points.T.y}"></polygon>
                        <polygon class="geo-polygon-fill sub-fill-2" points="${points.P.x},${points.P.y} ${points.T.x},${points.T.y} ${points.B.x},${points.B.y}"></polygon>
                    `;
                }
                drawHtml += `
                    <line class="geo-line-seg proof-auxiliary-line" x1="${points.T.x}" y1="${points.T.y}" x2="${points.A.x}" y2="${points.A.y}"></line>
                    <line class="geo-line-seg proof-auxiliary-line" x1="${points.T.x}" y1="${points.T.y}" x2="${points.B.x}" y2="${points.B.y}"></line>
                `;
                if (proofLayerLevel >= 2) {
                    drawHtml += `
                        <path class="geo-angle-sector" style="fill: var(--segment-pc-light);" d="${getAngleArcPath(points.T, points.A, points.P, 18, true)}"></path>
                        <path class="geo-angle-arc" style="stroke: var(--segment-pc);" d="${getAngleArcPath(points.T, points.A, points.P, 18)}"></path>
                        <path class="geo-angle-sector" style="fill: var(--segment-pc-light);" d="${getAngleArcPath(points.B, points.T, points.P, 18, true)}"></path>
                        <path class="geo-angle-arc" style="stroke: var(--segment-pc);" d="${getAngleArcPath(points.B, points.T, points.P, 18)}"></path>
                        <path class="geo-angle-sector" style="fill: rgba(245, 158, 11, 0.15);" d="${getAngleArcPath(points.A, points.T, points.P, 18, true)}"></path>
                        <path class="geo-angle-arc" style="stroke: #f59e0b;" d="${getAngleArcPath(points.A, points.T, points.P, 18)}"></path>
                        <path class="geo-angle-sector" style="fill: rgba(245, 158, 11, 0.15);" d="${getAngleArcPath(points.T, points.B, points.P, 18, true)}"></path>
                        <path class="geo-angle-arc" style="stroke: #f59e0b;" d="${getAngleArcPath(points.T, points.B, points.P, 18)}"></path>
                    `;
                }
            }
        }

        // 5. 绘制关键交互热点与标签
        drawHtml += drawSVGPoint("O", O, "O (圆心)", getPointLabelOffset("O"), false);
        drawHtml += drawSVGPoint("P", points.P, "P (交点)", getPointLabelOffset("P"), true);
        
        drawHtml += drawSVGPoint("A", points.A, "A", getPointLabelOffset("A"), true);
        drawHtml += drawSVGPoint("B", points.B, "B", getPointLabelOffset("B"), true);
        
        if (currentScene !== "secant-tangent") {
            drawHtml += drawSVGPoint("C", points.C, "C", getPointLabelOffset("C"), true);
            drawHtml += drawSVGPoint("D", points.D, "D", getPointLabelOffset("D"), true);
        } else {
            drawHtml += drawSVGPoint("T", points.T, "T (切点)", getPointLabelOffset("T"), false);
        }

        sandboxSvg.innerHTML = drawHtml;
    }

    // ==========================================================================
    // 7. HTML 浮动文字标注与板书算式渲染
    // ==========================================================================
    function updateHTMLOverlayAndHUD() {
        let overlayHtml = "";

        const getMidpoint = (p1, p2) => ({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 });
        const labelItems = [];
        const pushLabel = (cls, point, text, offset = { x: 0, y: 0 }) => {
            labelItems.push({
                cls,
                x: point.x + offset.x,
                y: point.y + offset.y,
                text
            });
        };

        // 当重合/等积动画没有播放时，显示标准长度标签
        if (renderValues.animProgress < 0.01) {
            const pa = renderValues.pa.toFixed(2);
            const pb = renderValues.pb.toFixed(2);

            const midPA = getMidpoint(points.P, points.A);
            pushLabel("lbl-pa", midPA, `PA = ${pa} cm`, { x: 0, y: currentScene === "secant-tangent" ? -20 : -12 });

            if (currentScene === "intersecting-chords") {
                const midPB = getMidpoint(points.P, points.B);
                pushLabel("lbl-pb", midPB, `PB = ${pb} cm`, { x: 0, y: 14 });
            } else {
                const midAB = getMidpoint(points.A, points.B);
                pushLabel("lbl-pb", midAB, `PB = ${pb} cm`, { x: -10, y: 22 });
            }

            if (currentScene !== "secant-tangent") {
                const pc = renderValues.pc.toFixed(2);
                const pd = renderValues.pd.toFixed(2);

                const midPC = getMidpoint(points.P, points.C);
                pushLabel("lbl-pc", midPC, `PC = ${pc} cm`, { x: 0, y: currentScene === "secants-theorem" ? -22 : -12 });

                if (currentScene === "intersecting-chords") {
                    const midPD = getMidpoint(points.P, points.D);
                    pushLabel("lbl-pd", midPD, `PD = ${pd} cm`, { x: 0, y: 16 });
                } else {
                    const midCD = getMidpoint(points.C, points.D);
                    pushLabel("lbl-pd", midCD, `PD = ${pd} cm`, { x: 8, y: -20 });
                }
            } else {
                const pt = renderValues.pt.toFixed(2);
                const midPT = getMidpoint(points.P, points.T);
                pushLabel("lbl-pt", midPT, `PT = ${pt} cm`, { x: -18, y: -24 });
            }
        }

        labelItems.forEach((item, index) => {
            for (let previousIndex = 0; previousIndex < index; previousIndex += 1) {
                const previous = labelItems[previousIndex];
                const dx = Math.abs(item.x - previous.x);
                const dy = Math.abs(item.y - previous.y);
                if (dx < 96 && dy < 28) {
                    item.y += item.y >= previous.y ? 24 : -24;
                }
            }
            item.x = clamp(item.x, 72, Math.max(72, sandboxWrapper.clientWidth - 72));
            item.y = clamp(item.y, 34, Math.max(34, sandboxWrapper.clientHeight - 34));
            overlayHtml += `<div class="brace-label ${item.cls}" style="left:${item.x}px; top:${item.y}px">${escapeHtml(item.text)}</div>`;
        });

        htmlOverlay.innerHTML = overlayHtml;
        positionOverlayLabels();
        updateAreaProofHUD();
        updateChalkboardHUD();
    }

    function renderProofShape(variantClass, dims, label, subLabel) {
        const width = clamp(dims.w, 28, 120);
        const height = clamp(dims.h, 12, 46);
        return `
            <div class="area-proof-shape-wrap">
                <div class="area-proof-card-label">${escapeHtml(label)}</div>
                <div class="area-proof-html-shape ${variantClass}" style="width:${width.toFixed(1)}px;height:${height.toFixed(1)}px;"></div>
                <div class="area-proof-card-sub">${escapeHtml(subLabel)}</div>
            </div>
        `;
    }

    function updateAreaProofHUD() {
        if (!areaProofBody) return;
        const metrics = getAreaProofMetrics();

        if (metrics.isFinal) {
            const size = clamp(metrics.targetSquareSize, 24, 48);
            areaProofBody.innerHTML = `
                <div class="area-proof-focus">${escapeHtml(metrics.focusText)}</div>
                <div class="area-proof-final-label">等面积：圆幂 = ${metrics.valueText} cm²</div>
                <div class="area-proof-row final">
                    <div class="area-proof-final-shape" style="width:${size.toFixed(1)}px;height:${size.toFixed(1)}px;">
                        <span>=</span>
                    </div>
                </div>
            `;
            return;
        }

        areaProofBody.innerHTML = `
            <div class="area-proof-focus">${escapeHtml(metrics.focusText)}</div>
            <div class="area-proof-note-line">只表示乘积面积</div>
            <div class="area-proof-row">
                ${renderProofShape("pa-pb-rect", metrics.leftDims, "PA × PB", metrics.leftSubLabel)}
                <div class="area-proof-equals-html">=</div>
                ${renderProofShape(currentScene === "secant-tangent" ? "pt-square" : "pc-pd-rect", metrics.rightDims, metrics.rightLabel, metrics.rightSubLabel)}
            </div>
        `;
    }

    function updateChalkboardHUD() {
        let html = "";

        const r = renderValues.circleR / SCALE_CM_TO_PX;
        const d = renderValues.distD / SCALE_CM_TO_PX;
        const pa = renderValues.pa;
        const pb = renderValues.pb;
        const pc = renderValues.pc;
        const pd = renderValues.pd;
        const pt = renderValues.pt;
        const power = renderValues.power;

        const highlightHTML = (val, cls) => `<span class="math-seg ${cls}" data-highlight="${cls.split('-')[1]}">${val.toFixed(2)}</span>`;

        if (currentScene === "intersecting-chords") {
            const lhs = pa * pb;
            const rhs = pc * pd;
            html = `
                <div class="hud-row">
                    <div class="hud-row-label">定理表述: 相交弦定理</div>
                    <div class="hud-row-val" style="color: var(--segment-pb);">
                        <strong>PA · PB = PC · PD = R² - d²</strong>
                    </div>
                </div>
                <div class="hud-row">
                    <div class="hud-row-label">已知参数</div>
                    <div class="hud-row-val" style="font-size:12px;">
                        圆半径 R = <span class="math-num">${r.toFixed(2)}</span> cm, 
                        交距 d = <span class="math-num">${d.toFixed(2)}</span> cm<br>
                        圆幂恒量 (R² - d²) = <span class="highlight" style="color:var(--segment-pa); font-weight:700;">${power.toFixed(3)}</span> cm²
                    </div>
                </div>
                <div class="hud-row">
                    <div class="hud-row-label">线段测量值</div>
                    <div class="hud-row-val" style="font-size:12.5px;">
                        PA = ${highlightHTML(pa, 'math-seg seg-pa')} cm, 
                        PB = ${highlightHTML(pb, 'math-seg seg-pb')} cm<br>
                        PC = ${highlightHTML(pc, 'math-seg seg-pc')} cm, 
                        PD = ${highlightHTML(pd, 'math-seg seg-pd')} cm
                    </div>
                </div>
                <div class="hud-equation-box success-box">
                    <div class="title">等积乘积关系验证</div>
                    <div class="formula" style="font-size:12px; flex-direction:column; align-items:flex-start; gap:4px;">
                        <div>PA × PB = ${pa.toFixed(2)} × ${pb.toFixed(2)} = <span class="highlight" style="color:var(--segment-pb);">${lhs.toFixed(3)}</span> cm²</div>
                        <div>PC × PD = ${pc.toFixed(2)} × ${pd.toFixed(2)} = <span class="highlight" style="color:var(--segment-pd);">${rhs.toFixed(3)}</span> cm²</div>
                    </div>
                </div>
            `;
        } else if (currentScene === "secants-theorem") {
            const lhs = pa * pb;
            const rhs = pc * pd;
            html = `
                <div class="hud-row">
                    <div class="hud-row-label">定理表述: 割线定理</div>
                    <div class="hud-row-val" style="color: var(--segment-pb);">
                        <strong>PA · PB = PC · PD = d² - R²</strong>
                    </div>
                </div>
                <div class="hud-row">
                    <div class="hud-row-label">已知参数</div>
                    <div class="hud-row-val" style="font-size:12px;">
                        圆半径 R = <span class="math-num">${r.toFixed(2)}</span> cm, 
                        交距 d = <span class="math-num">${d.toFixed(2)}</span> cm<br>
                        圆幂恒量 (d² - R²) = <span class="highlight" style="color:var(--segment-pa); font-weight:700;">${power.toFixed(3)}</span> cm²
                    </div>
                </div>
                <div class="hud-row">
                    <div class="hud-row-label">线段测量值</div>
                    <div class="hud-row-val" style="font-size:12.5px;">
                        PA = ${highlightHTML(pa, 'math-seg seg-pa')} cm, 
                        PB = ${highlightHTML(pb, 'math-seg seg-pb')} cm<br>
                        PC = ${highlightHTML(pc, 'math-seg seg-pc')} cm, 
                        PD = ${highlightHTML(pd, 'math-seg seg-pd')} cm
                    </div>
                </div>
                <div class="hud-equation-box success-box">
                    <div class="title">等积乘积关系验证</div>
                    <div class="formula" style="font-size:12px; flex-direction:column; align-items:flex-start; gap:4px;">
                        <div>PA × PB = ${pa.toFixed(2)} × ${pb.toFixed(2)} = <span class="highlight" style="color:var(--segment-pb);">${lhs.toFixed(3)}</span> cm²</div>
                        <div>PC × PD = ${pc.toFixed(2)} × ${pd.toFixed(2)} = <span class="highlight" style="color:var(--segment-pd);">${rhs.toFixed(3)}</span> cm²</div>
                    </div>
                </div>
            `;
        } else if (currentScene === "secant-tangent") {
            const lhs = pt * pt;
            const rhs = pa * pb;
            html = `
                <div class="hud-row">
                    <div class="hud-row-label">定理表述: 切割线定理</div>
                    <div class="hud-row-val" style="color: var(--segment-pt);">
                        <strong>PT² = PA · PB = d² - R²</strong>
                    </div>
                </div>
                <div class="hud-row">
                    <div class="hud-row-label">已知参数</div>
                    <div class="hud-row-val" style="font-size:12px;">
                        圆半径 R = <span class="math-num">${r.toFixed(2)}</span> cm, 
                        交距 d = <span class="math-num">${d.toFixed(2)}</span> cm<br>
                        圆幂恒量 (d² - R²) = <span class="highlight" style="color:var(--segment-pa); font-weight:700;">${power.toFixed(3)}</span> cm²
                    </div>
                </div>
                <div class="hud-row">
                    <div class="hud-row-label">线段测量值</div>
                    <div class="hud-row-val" style="font-size:12.5px;">
                        PT = ${highlightHTML(pt, 'math-seg seg-pt')} cm (切线段)<br>
                        PA = ${highlightHTML(pa, 'math-seg seg-pa')} cm (割线外段)<br>
                        PB = ${highlightHTML(pb, 'math-seg seg-pb')} cm (割线全长)
                    </div>
                </div>
                <div class="hud-equation-box success-box">
                    <div class="title">等积关系验证</div>
                    <div class="formula" style="font-size:12px; flex-direction:column; align-items:flex-start; gap:4px;">
                        <div>切线平方 PT² = ${pt.toFixed(2)}² = <span class="highlight" style="color:var(--segment-pt);">${lhs.toFixed(3)}</span> cm²</div>
                        <div>割线乘积 PA × PB = ${pa.toFixed(2)} × ${pb.toFixed(2)} = <span class="highlight" style="color:var(--segment-pb);">${rhs.toFixed(3)}</span> cm²</div>
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
        if (currentScene === "intersecting-chords") {
            theoryTitle.textContent = "相交弦定理";
            theoryText.innerHTML = `
                <div class="theory-formula">PA × PB = PC × PD = R² - OP²</div>
                <div class="proof-steps">
                    <div><b>1</b><span>连接 AC、BD，得到 △PAC 与 △PDB。</span></div>
                    <div><b>2</b><span>同弧所对圆周角相等，推出两组三角形对应角相等。</span></div>
                    <div><b>3</b><span>△PAC ∽ △PDB，所以对应边交叉相乘得到乘积恒等。</span></div>
                </div>
                <p class="theory-note">拖动 P 或两条弦的端点，观察两个乘积始终同步变化。</p>
            `;
        } else if (currentScene === "secants-theorem") {
            theoryTitle.textContent = "割线定理";
            theoryText.innerHTML = `
                <div class="theory-formula">PA × PB = PC × PD = OP² - R²</div>
                <div class="proof-steps">
                    <div><b>1</b><span>从圆外点 P 作两条割线 PAB、PCD。</span></div>
                    <div><b>2</b><span>连接 AD、BC，公共角与圆周角关系给出 △PAD ∽ △PCB。</span></div>
                    <div><b>3</b><span>对应边成比例，化简为两条割线的“外段 × 全长”相等。</span></div>
                </div>
                <p class="theory-note">这里 PB、PD 表示从 P 到远端交点的全长，不是圆内短弦长。</p>
            `;
        } else if (currentScene === "secant-tangent") {
            theoryTitle.textContent = "切割线定理";
            theoryText.innerHTML = `
                <div class="theory-formula">PT² = PA × PB = OP² - R²</div>
                <div class="proof-steps">
                    <div><b>1</b><span>从 P 作切线 PT 与割线 PAB。</span></div>
                    <div><b>2</b><span>连接 TA、TB，利用弦切角定理得到 △PAT ∽ △PTB。</span></div>
                    <div><b>3</b><span>PT 是 PA 与 PB 的比例中项，因此 PT² = PA × PB。</span></div>
                </div>
                <p class="theory-note">切线可看作割线的极限位置，所以它仍然对应同一个圆幂值。</p>
            `;
        }
    }

    function setDemoButtonText(text) {
        btnPlayMorph.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z"/></svg>
            ${text}
        `;
    }

    function updatePresetLabels() {
        const labels = {
            "preset-standard": currentScene === "intersecting-chords" ? "经典相交" : "经典割线",
            "preset-equal": currentScene === "intersecting-chords" ? "等长弦" : "对称割线",
            "preset-orthogonal": currentScene === "intersecting-chords" ? "垂直相交" : "小角割线"
        };
        document.querySelectorAll(".btn-shape-preset").forEach(btn => {
            const preset = btn.getAttribute("data-preset");
            if (labels[preset]) btn.textContent = labels[preset];
        });
    }

    function renderCurrentStateImmediately() {
        renderValues.circleR = circleR;
        renderValues.distD = distD;
        renderValues.thetaP = thetaP;
        renderValues.phi1 = phi1;
        renderValues.phi2 = phi2;
        renderValues.animProgress = animProgress;
        solveGeometry();
        renderSVG();
        updateHTMLOverlayAndHUD();
    }

    // ==========================================================================
    // 9. LERP 平滑渲染循环与动画处理
    // ==========================================================================
    function updateLerp() {
        const k = 0.15;

        if (isPresetTransitioning) {
            const k_p = 0.12;
            circleR += (targetCircleR - circleR) * k_p;
            distD += (targetDistD - distD) * k_p;
            thetaP += (targetThetaP - thetaP) * k_p;
            phi1 += (targetPhi1 - phi1) * k_p;
            phi2 += (targetPhi2 - phi2) * k_p;

            // 反馈到 DOM controls
            sliderCircleR.value = circleR;
            valCircleR.textContent = circleR + " px";
            sliderDistD.value = distD;
            valDistD.textContent = distD + " px";
            sliderPhi1.value = (phi1 * 180 / Math.PI).toFixed(1);
            valPhi1.textContent = (phi1 * 180 / Math.PI).toFixed(0) + "°";
            sliderPhi2.value = (phi2 * 180 / Math.PI).toFixed(1);
            valPhi2.textContent = (phi2 * 180 / Math.PI).toFixed(0) + "°";

            const dR = Math.abs(circleR - targetCircleR);
            const dD = Math.abs(distD - targetDistD);
            const dPhi1 = Math.abs(phi1 - targetPhi1);
            const dPhi2 = Math.abs(phi2 - targetPhi2);

            if (dR < 0.2 && dD < 0.2 && dPhi1 < 1e-3 && dPhi2 < 1e-3) {
                circleR = targetCircleR;
                distD = targetDistD;
                thetaP = targetThetaP;
                phi1 = targetPhi1;
                phi2 = targetPhi2;
                isPresetTransitioning = false;
            }
        }

        renderValues.circleR += (circleR - renderValues.circleR) * k;
        renderValues.distD += (distD - renderValues.distD) * k;
        renderValues.thetaP += (thetaP - renderValues.thetaP) * k;
        renderValues.phi1 += (phi1 - renderValues.phi1) * k;
        renderValues.phi2 += (phi2 - renderValues.phi2) * k;

        // 等积 morph 动画
        if (animDirection !== 0) {
            animProgress += animDirection * 0.02;
            if (animProgress >= 1.0) {
                animProgress = 1.0;
                animDirection = 0;
                isAnimating = false;
                setDemoButtonText("再次演示");

                // 爆发彩色烟花
                const rect = areaProofHud?.getBoundingClientRect() || sandboxSvg.getBoundingClientRect();
                const sparkX = rect.left + rect.width / 2;
                const sparkY = rect.top + rect.height / 2;
                spawnExplosion(sparkX, sparkY, "var(--segment-pb)");
                spawnExplosion(sparkX - 20, sparkY, "var(--segment-pt)");
                spawnExplosion(sparkX + 20, sparkY, "var(--segment-pd)");
            } else if (animProgress <= 0.0) {
                animProgress = 0.0;
                animDirection = 0;
                isAnimating = false;
            }
        }
        renderValues.animProgress += (animProgress - renderValues.animProgress) * 0.25;

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

    function playMorphAnimation() {
        if (isAnimating) return;
        isAnimating = true;
        if (animProgress >= 0.98) animProgress = 0;
        animDirection = 1;
        setAreaProofHudExpanded(true);
        setProofLayerLevel(3);
        setDemoButtonText("演示中...");
    }

    // ==========================================================================
    // 10. 场景切换与参数自适应调节
    // ==========================================================================
    function loadScene(scene) {
        currentScene = scene;
        animProgress = 0.0;
        animDirection = 0;
        isAnimating = false;
        setDemoButtonText("演示圆幂等积");

        // 切换 Tab 高亮
        document.querySelectorAll(".btn-preset").forEach(btn => {
            if (btn.getAttribute("data-scene") === scene) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });

        // 重新分配几何参数
        if (scene === "intersecting-chords") {
            // 点在圆内
            sliderDistD.min = 0;
            sliderDistD.max = circleR - 20;
            distD = 65;
            targetDistD = 65;
            thetaP = 0;
            targetThetaP = 0;

            phi1 = 45 * Math.PI / 180;
            targetPhi1 = 45 * Math.PI / 180;
            phi2 = 135 * Math.PI / 180;
            targetPhi2 = 135 * Math.PI / 180;

            document.getElementById("row-phi2").style.display = "flex";
        } else {
            // 点在圆外
            sliderDistD.min = circleR + 35;
            sliderDistD.max = 300;
            distD = 230;
            targetDistD = 230;
            thetaP = 0;
            targetThetaP = 0;

            phi1 = 158 * Math.PI / 180;
            targetPhi1 = 158 * Math.PI / 180;
            phi2 = 202 * Math.PI / 180;
            targetPhi2 = 202 * Math.PI / 180;

            if (scene === "secant-tangent") {
                document.getElementById("row-phi2").style.display = "none";
            } else {
                document.getElementById("row-phi2").style.display = "flex";
            }
        }

        // 同步反馈滑块
        sliderDistD.value = distD;
        valDistD.textContent = distD + " px";
        sliderPhi1.value = (phi1 * 180 / Math.PI).toFixed(1);
        valPhi1.textContent = (phi1 * 180 / Math.PI).toFixed(0) + "°";
        sliderPhi2.value = (phi2 * 180 / Math.PI).toFixed(1);
        valPhi2.textContent = (phi2 * 180 / Math.PI).toFixed(0) + "°";

        updateTheoryContent();
        updatePresetLabels();
        if (!isPresetTransitioning) {
            centerModel();
        }
        renderCurrentStateImmediately();
    }

    function triggerPreset(presetName) {
        isPresetTransitioning = true;
        
        if (currentScene === "intersecting-chords") {
            if (presetName === "preset-standard") {
                targetCircleR = 130;
                targetDistD = 65;
                targetThetaP = 0;
                targetPhi1 = 45 * Math.PI / 180;
                targetPhi2 = 135 * Math.PI / 180;
            } else if (presetName === "preset-equal") {
                // 等长弦：两弦关于 OP 对称
                targetCircleR = 130;
                targetDistD = 75;
                targetThetaP = 0;
                targetPhi1 = 60 * Math.PI / 180;
                targetPhi2 = 300 * Math.PI / 180;
            } else if (presetName === "preset-orthogonal") {
                // 垂直相交弦
                targetCircleR = 130;
                targetDistD = 50;
                targetThetaP = 0;
                targetPhi1 = 0 * Math.PI / 180;
                targetPhi2 = 90 * Math.PI / 180;
            }
        } else {
            if (presetName === "preset-standard") {
                targetCircleR = 120;
                targetDistD = 230;
                targetThetaP = 0;
                targetPhi1 = 158 * Math.PI / 180;
                targetPhi2 = 202 * Math.PI / 180;
            } else if (presetName === "preset-equal") {
                // 两条关于 PO 对称的割线
                targetCircleR = 120;
                targetDistD = 240;
                targetThetaP = 0;
                targetPhi1 = 162 * Math.PI / 180;
                targetPhi2 = 198 * Math.PI / 180;
            } else if (presetName === "preset-orthogonal") {
                // 割线方向夹角为30度
                targetCircleR = 120;
                targetDistD = 220;
                targetThetaP = 0;
                targetPhi1 = 153 * Math.PI / 180;
                targetPhi2 = 207 * Math.PI / 180;
            }
        }
    }

    function resetState() {
        isPresetTransitioning = false;
        animProgress = 0.0;
        animDirection = 0;
        isAnimating = false;
        setDemoButtonText("演示圆幂等积");

        circleR = 130;
        targetCircleR = 130;
        sliderCircleR.value = 130;
        valCircleR.textContent = "130 px";

        loadScene(currentScene);
        centerModel();
    }

    // 自适应居中
    function centerModel() {
        const W = sandboxWrapper.clientWidth;
        const H = sandboxWrapper.clientHeight;

        const isDesktop = window.innerWidth > 900;
        const hudW = isHudExpanded ? 370 : 200;
        const visibleW = isDesktop ? (W - hudW) : W;

        zoomScale = 1.0;
        panX = isDesktop ? (hudW + (visibleW - W) / 2) : 0;
        panY = 0;

        O.x = W / 2;
        O.y = H / 2 - 16;

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
    // 11. 手势与鼠标拖拽
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
        const pointId = pointWrapper?.getAttribute("data-point-id") || getNearestDraggablePoint(e.clientX, e.clientY, 34);
        if (pointId && ["P", "A", "B", "C", "D"].includes(pointId)) {
            activeDragPoint = pointId;
            isPresetTransitioning = false;
            sandboxWrapper.classList.add("dragging-point");
            e.stopPropagation();
            e.preventDefault();
            return;
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
            const local = getLocalPointFromEvent(e);
            applyPointDrag(activeDragPoint, local.x, local.y);
            e.preventDefault();
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

    function getTouchCenter(touches) {
        return {
            x: (touches[0].clientX + touches[1].clientX) / 2,
            y: (touches[0].clientY + touches[1].clientY) / 2
        };
    }

    function endTouchInteraction() {
        activeDragPoint = null;
        isPanning = false;
        initialTouchDist = 0;
        sandboxWrapper.classList.remove("dragging-point", "panning");
    }

    sandboxWrapper.addEventListener("touchstart", (e) => {
        if (e.touches.length === 2) {
            initialTouchDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            initialTouchScale = zoomScale;
            e.preventDefault();
        } else if (e.touches.length === 1) {
            const touch = e.touches[0];
            const ptWrapper = e.target.closest(".geo-point-wrapper");
            const ptId = ptWrapper?.getAttribute("data-point-id") || getNearestDraggablePoint(touch.clientX, touch.clientY, 44);
            if (ptId && ["P", "A", "B", "C", "D"].includes(ptId)) {
                activeDragPoint = ptId;
                isPresetTransitioning = false;
                sandboxWrapper.classList.add("dragging-point");
                e.stopPropagation();
                e.preventDefault();
                return;
            }
            isPanning = true;
            startPanX = touch.clientX - panX;
            startPanY = touch.clientY - panY;
        }
    }, { passive: false });

    sandboxWrapper.addEventListener("touchmove", (e) => {
        if (e.touches.length === 2 && initialTouchDist > 0) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const factor = dist / initialTouchDist;
            const center = getTouchCenter(e.touches);
            const rect = sandboxWrapper.getBoundingClientRect();
            const targetScale = Math.min(Math.max(initialTouchScale * factor, 0.45), 3.0);
            zoomAt(targetScale / zoomScale, center.x - rect.left, center.y - rect.top);
            e.preventDefault();
        } else if (e.touches.length === 1) {
            const touch = e.touches[0];
            const local = getLocalPointFromTouch(touch);

            if (activeDragPoint) {
                applyPointDrag(activeDragPoint, local.x, local.y);
                e.preventDefault();
            } else if (isPanning) {
                panX = touch.clientX - startPanX;
                panY = touch.clientY - startPanY;
                updateTransform();
                e.preventDefault();
            }
        }
    }, { passive: false });

    sandboxWrapper.addEventListener("touchend", (e) => {
        if (e.touches.length >= 2) return;
        endTouchInteraction();
    });

    sandboxWrapper.addEventListener("touchcancel", () => {
        endTouchInteraction();
    });

    // HUD 文字 Hover 发光联动
    function highlightSegmentOnCanvas(segId, active) {
        const selector = `.geo-line-seg.seg-${segId}`;
        const el = document.querySelector(selector);
        if (el) {
            if (active) {
                el.classList.add("active-glow");
            } else {
                el.classList.remove("active-glow");
            }
        }
    }

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

    // ==========================================================================
    // 12. 页面按钮绑定与初始化
    // ==========================================================================
    proofLayerControls?.querySelectorAll(".layer-step-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const layer = btn.getAttribute("data-layer");
            const targetLevel = layer === "lines" ? 1 : layer === "angles" ? 2 : layer === "triangles" ? 3 : 0;
            setProofLayerLevel(proofLayerLevel === targetLevel ? targetLevel - 1 : targetLevel);
            solveGeometry();
            renderSVG();
        });
    });

    btnToggleSnap.addEventListener("click", () => {
        isSnappingEnabled = !isSnappingEnabled;
        if (isSnappingEnabled) {
            btnToggleSnap.classList.add("active");
            btnToggleSnap.querySelector("span").textContent = "已开启整数厘米吸附";
            // 立即进行一次吸附校准
            distD = snapDistanceD(distD, circleR);
            targetDistD = distD;
            phi1 = snapPhi(phi1, 1);
            targetPhi1 = phi1;
            phi2 = snapPhi(phi2, 2);
            targetPhi2 = phi2;
        } else {
            btnToggleSnap.classList.remove("active");
            btnToggleSnap.querySelector("span").textContent = "开启整数厘米吸附";
        }
        solveGeometry();
    });

    sliderCircleR.addEventListener("input", (e) => {
        isPresetTransitioning = false;
        circleR = parseFloat(e.target.value);
        targetCircleR = circleR;
        valCircleR.textContent = circleR.toFixed(0) + " px";

        // 更新距离滑块的最小/最大限制范围
        if (currentScene === "intersecting-chords") {
            sliderDistD.max = circleR - 20;
            if (distD > circleR - 20) {
                distD = circleR - 20;
                targetDistD = distD;
                sliderDistD.value = distD;
                valDistD.textContent = distD.toFixed(0) + " px";
            }
        } else {
            sliderDistD.min = circleR + 35;
            if (distD < circleR + 35) {
                distD = circleR + 35;
                targetDistD = distD;
                sliderDistD.value = distD;
                valDistD.textContent = distD.toFixed(0) + " px";
            }
        }
    });

    sliderDistD.addEventListener("input", (e) => {
        isPresetTransitioning = false;
        let d = parseFloat(e.target.value);
        if (isSnappingEnabled) {
            d = snapDistanceD(d, circleR);
        }
        distD = d;
        targetDistD = d;
        valDistD.textContent = d.toFixed(0) + " px";
    });

    sliderPhi1.addEventListener("input", (e) => {
        isPresetTransitioning = false;
        let deg = parseFloat(e.target.value);
        let angle = deg * Math.PI / 180;
        if (isSnappingEnabled) {
            angle = snapPhi(angle, 1);
        }
        phi1 = angle;
        targetPhi1 = phi1;
        valPhi1.textContent = (phi1 * 180 / Math.PI).toFixed(0) + "°";
    });

    sliderPhi2.addEventListener("input", (e) => {
        isPresetTransitioning = false;
        let deg = parseFloat(e.target.value);
        let angle = deg * Math.PI / 180;
        if (isSnappingEnabled) {
            angle = snapPhi(angle, 2);
        }
        phi2 = angle;
        targetPhi2 = phi2;
        valPhi2.textContent = (phi2 * 180 / Math.PI).toFixed(0) + "°";
    });

    document.querySelectorAll(".btn-preset").forEach(btn => {
        btn.addEventListener("click", () => {
            const sc = btn.getAttribute("data-scene");
            loadScene(sc);
        });
    });

    document.querySelectorAll(".btn-shape-preset").forEach(btn => {
        btn.addEventListener("click", () => {
            const pr = btn.getAttribute("data-preset");
            triggerPreset(pr);
        });
    });

    btnPlayMorph.addEventListener("click", playMorphAnimation);
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

    areaProofToggleBtn?.addEventListener("click", () => {
        isAreaProofHudExpanded = !isAreaProofHudExpanded;
        areaProofHud.classList.toggle("collapsed", !isAreaProofHudExpanded);
        areaProofToggleBtn.setAttribute("aria-expanded", String(isAreaProofHudExpanded));
    });

    document.getElementById("btn-zoom-in").addEventListener("click", () => zoomAtCenter(1.15));
    document.getElementById("btn-zoom-out").addEventListener("click", () => zoomAtCenter(1 / 1.15));
    document.getElementById("btn-zoom-reset").addEventListener("click", () => centerModel());

    sandboxWrapper.parentNode.addEventListener("dblclick", (e) => {
        if (e.target.closest(".btn-zoom") || e.target.closest(".control-column") || e.target.closest(".btn-shape-preset")) return;
        centerModel();
    });

    // 暴露状态接口，用于测试和外部联动
    window.appState = {
        get currentScene() { return currentScene; },
        get circleR() { return circleR; },
        get distD() { return distD; },
        get thetaP() { return thetaP; },
        get phi1() { return phi1; },
        get phi2() { return phi2; },
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
        resetState,
        loadScene,
        triggerPreset,
        get renderValues() {
            return {
                circleR: renderValues.circleR,
                distD: renderValues.distD,
                phi1: renderValues.phi1,
                phi2: renderValues.phi2,
                animProgress: renderValues.animProgress,
                pa: renderValues.pa,
                pb: renderValues.pb,
                pc: renderValues.pc,
                pd: renderValues.pd,
                pt: renderValues.pt,
                power: renderValues.power
            };
        }
    };

    // 第一次初始化自适应
    resetState();
});
