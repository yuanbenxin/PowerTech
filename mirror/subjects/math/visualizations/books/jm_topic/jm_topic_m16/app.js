/**
 * 空间想象与三视图实验室 - 交互引擎 (app.js)
 * 功能：处理 3D 积木投影、鼠标拖拽自由旋转、标数控制器、手动涂色答题系统与 Quest 判定
 */

// ==========================================================================
// 1. 全局状态初始化
// ==========================================================================
const canvas = document.getElementById("canvas-3d");
const ctx = canvas.getContext("2d");
const canvasContainer = document.getElementById("canvas-3d-container");

// 粒子特效
const particlesCanvas = document.getElementById("particles-canvas");
const pCtx = particlesCanvas.getContext("2d");
let particles = [];
let animId = null;

// DOM 元素引用
const btnHudToggle = document.getElementById("btn-hud-toggle");
const hudCard = document.getElementById("analysis-hud-card");
const heightControlGrid = document.getElementById("height-control-grid");
const cubeCountVal = document.getElementById("cube-count-val");
const btnClearCubes = document.getElementById("btn-clear-cubes");
const stepGuideIndicator = document.getElementById("step-guide-indicator");

// 视角控制快照按钮
const btnSnapIso = document.getElementById("btn-snap-iso");
const btnSnapFront = document.getElementById("btn-snap-front");
const btnSnapLeft = document.getElementById("btn-snap-left");
const btnSnapTop = document.getElementById("btn-snap-top");

// 教学优化配置项
const chkShowWalls = document.getElementById("chk-show-walls");
const chkShowLasers = document.getElementById("chk-show-lasers");

let showWalls = true;
let showLasers = true;
let hoveredRow = -1;
let hoveredCol = -1;

// 任务按钮
const btnStartQuest1 = document.getElementById("btn-start-quest-1");
const btnSubmitQuest1 = document.getElementById("btn-submit-quest-1");
const btnStartQuest2 = document.getElementById("btn-start-quest-2");
const btnStartQuest3 = document.getElementById("btn-start-quest-3");
const btnStartQuest4 = document.getElementById("btn-start-quest-4");

// 3D 网格状态：3x3 底座，高度 0~3
let grid = [
    [2, 1, 0],
    [0, 2, 1],
    [1, 0, 0]
];

// 3D 摄像机角度 (弧度)
let yaw = Math.PI / 4 + 0.1;           // 水平自转角 (Yaw)
let pitch = Math.atan(1 / Math.sqrt(2)); // 俯仰角 (Pitch)，等角约 35.26 度

// 拖拽旋转状态
let isDragging = false;
let prevMouseX = 0;
let prevMouseY = 0;
let targetYaw = yaw;
let targetPitch = pitch;
let isAnimatingCamera = false;

// 交互与挑战模式状态
let currentMode = "sandbox"; // "sandbox" | "quest1" (画图) | "quest2" (搭建) | "quest3" (最少) | "quest4" (最多)
let completedQuests = { 1: false, 2: false, 3: false, 4: false };

// 挑战模式下的目标/题目数据
let questTargetGrid = null;
let questTargetFront = null;
let questTargetLeft = null;
let questTargetTop = null;
let questTargetTotal = null;

// 手动涂画三视图答题格状态 (3x3 矩阵)
let userPaintedFront = [[0,0,0],[0,0,0],[0,0,0]];
let userPaintedLeft  = [[0,0,0],[0,0,0],[0,0,0]];
let userPaintedTop   = [[0,0,0],[0,0,0],[0,0,0]];

// 积木着色方案
const colorSchemes = {
    top: "#f59e0b",      // 顶部朝天：琥珀黄
    left: "#10b981",     // 左侧面：翡翠绿
    front: "#3b82f6",    // 右前侧面：宝蓝
    gridFloor: "rgba(148, 163, 184, 0.08)", // 灰色格线底座
    gridFloorActive: "rgba(37, 99, 235, 0.12)"
};

// ==========================================================================
// 2. 3D 投影与渲染引擎 (3D Isometric Orthographic Render)
// ==========================================================================
const cubeSize = 44; // 积木的边长（像素）

function project3D(x, y, z, W, H) {
    const centerX = W / 2;
    const centerY = H / 2 + 10;

    // 自转 Yaw
    const xr = x * Math.cos(yaw) - y * Math.sin(yaw);
    const yr = x * Math.sin(yaw) + y * Math.cos(yaw);
    const zr = z;

    // 仰角 Pitch (纠正后的正交投影公式，使 pitch 趋近于 0 时 Z 轴高度不扁平)
    const x2 = xr;
    const y2 = yr * Math.sin(pitch) - zr * Math.cos(pitch);
    const z2 = yr * Math.cos(pitch) + zr * Math.sin(pitch);

    const sx = centerX + x2 * cubeSize * 1.5;
    const sy = centerY + y2 * cubeSize * 1.5;
    
    return { x: sx, y: sy, depth: z2 };
}

function rotateNormal(nx, ny, nz) {
    const nxr = nx * Math.cos(yaw) - ny * Math.sin(yaw);
    const nyr = nx * Math.sin(yaw) + ny * Math.cos(yaw);
    const nzr = nz;
    
    const nx2 = nxr;
    const ny2 = nyr * Math.sin(pitch) - nzr * Math.cos(pitch);
    const nz2 = nyr * Math.cos(pitch) + nzr * Math.sin(pitch);

    return { x: nx2, y: ny2, z: nz2 };
}

function drawFace(poly, normal, lightDir, baseColor) {
    const rotN = rotateNormal(normal.x, normal.y, normal.z);
    if (rotN.z > 0) return false;

    const dot = rotN.x * lightDir.x + rotN.y * lightDir.y + rotN.z * lightDir.z;
    const intensity = 0.42 + 0.58 * Math.max(0, dot);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i++) {
        ctx.lineTo(poly[i].x, poly[i].y);
    }
    ctx.closePath();

    ctx.fillStyle = hexToRgba(baseColor, intensity);
    ctx.fill();

    ctx.strokeStyle = "rgba(15, 23, 42, 0.58)";
    ctx.lineWidth = 1.7;
    ctx.stroke();

    // 教学优化：若为顶部朝天面 (normal.z === 1)，绘制一道白亮反光倒角，营造玻璃折射感
    if (normal.z === 1) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.92)";
        ctx.lineWidth = 2.1;
        ctx.beginPath();
        ctx.moveTo(poly[0].x, poly[0].y);
        ctx.lineTo(poly[1].x, poly[1].y);
        ctx.lineTo(poly[2].x, poly[2].y);
        ctx.lineTo(poly[3].x, poly[3].y);
        ctx.closePath();
        ctx.stroke();
    }
    ctx.restore();
    return true;
}

function hexToRgba(hex, alpha) {
    let c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x' + c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
    }
    return `rgba(59, 130, 246, ${alpha})`;
}

// 绘制双层体积霓虹激光线
function drawLaserRay(p1, p2, color) {
    ctx.save();
    // 1. 底层：宽霓虹发光层
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.5;
    ctx.setLineDash([4, 4]);
    ctx.shadowBlur = 8;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // 2. 顶层：极细纯白能量核心
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.2;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.restore();
}

// 绘制列高亮线框 (Wireframe Selection Box)
function drawColumnOutline(r, c, h, W, H) {
    const cx = r - 1;
    const cy = c - 1;
    const czMin = -0.5;
    const czMax = Math.max(0, h) - 0.5;

    // 8 个角顶点
    const v = [
        project3D(cx - 0.5, cy - 0.5, czMin, W, H),
        project3D(cx + 0.5, cy - 0.5, czMin, W, H),
        project3D(cx + 0.5, cy + 0.5, czMin, W, H),
        project3D(cx - 0.5, cy + 0.5, czMin, W, H),
        project3D(cx - 0.5, cy - 0.5, czMax, W, H),
        project3D(cx + 0.5, cy - 0.5, czMax, W, H),
        project3D(cx + 0.5, cy + 0.5, czMax, W, H),
        project3D(cx - 0.5, cy + 0.5, czMax, W, H)
    ];

    ctx.save();
    ctx.strokeStyle = "#eab308"; // 金黄高亮
    ctx.lineWidth = 2.0;
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#eab308";

    // 绘制底部和顶部框
    const strokeLoop = (pts) => {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
        ctx.lineTo(pts[2].x, pts[2].y);
        ctx.lineTo(pts[3].x, pts[3].y);
        ctx.closePath();
        ctx.stroke();
    };
    strokeLoop([v[0], v[1], v[2], v[3]]);
    strokeLoop([v[4], v[5], v[6], v[7]]);

    // 绘制垂直侧棱
    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(v[i].x, v[i].y);
        ctx.lineTo(v[i+4].x, v[i+4].y);
        ctx.stroke();
    }
    ctx.restore();
}

// 主渲染逻辑 (基于统一 Painter's Algorithm 的 Z 轴深度排序)
function drawSandbox() {
    const W = canvas.width / window.devicePixelRatio;
    const H = canvas.height / window.devicePixelRatio;
    ctx.clearRect(0, 0, W, H);

    const lightDir = { x: 0.3, y: -0.7, z: -0.6 };

    // A. 摄像机平滑自转过渡
    if (isAnimatingCamera) {
        const ease = 0.12;
        yaw += (targetYaw - yaw) * ease;
        pitch += (targetPitch - pitch) * ease;
        if (Math.abs(targetYaw - yaw) < 0.005 && Math.abs(targetPitch - pitch) < 0.005) {
            yaw = targetYaw;
            pitch = targetPitch;
            isAnimatingCamera = false;
        }
    }

    const proj = getProjections();

    // 计算各面剔除状态
    const drawBackWall = showWalls && (rotateNormal(1, 0, 0).z >= 0);
    const drawLeftWall = showWalls && (rotateNormal(0, 1, 0).z >= 0);

    // B. 收集所有可绘制的 3D 图元
    const drawables = [];

    // 1. 地面格子 (Floor tiles)
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            const centerProj = project3D(r - 1, c - 1, -0.5, W, H);
            drawables.push({
                type: "floor_tile",
                r, c,
                depth: centerProj.depth
            });
        }
    }

    // 2. 后投影壁面格子 (Back Wall tiles - 主视图映射面，位于 x = -1.5 处)
    if (drawBackWall) {
        for (let c = 0; c < 3; c++) {
            for (let z = 0; z < 3; z++) {
                const centerProj = project3D(-1.5, c - 1, z - 0.5, W, H);
                drawables.push({
                    type: "back_wall_tile",
                    c, z_level: z,
                    depth: centerProj.depth
                });
            }
        }
    }

    // 3. 左投影壁面格子 (Left Wall tiles - 左视图映射面，位于 y = -1.5 处)
    if (drawLeftWall) {
        for (let r = 0; r < 3; r++) {
            for (let z = 0; z < 3; z++) {
                const centerProj = project3D(r - 1, -1.5, z - 0.5, W, H);
                drawables.push({
                    type: "left_wall_tile",
                    r, z_level: z,
                    depth: centerProj.depth
                });
            }
        }
    }

    // 4. 实体积木方块 (Cubes)
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            const h = grid[r][c];
            for (let z = 0; z < h; z++) {
                const centerProj = project3D(r - 1, c - 1, z, W, H);
                drawables.push({
                    type: "cube",
                    r, c, z,
                    depth: centerProj.depth
                });
            }
        }
    }

    // C. 统一 Painter's Algorithm 景深排序 (从远到近)
    drawables.sort((a, b) => b.depth - a.depth);

    // D. 顺序渲染图元
    drawables.forEach(obj => {
        const x = obj.r - 1;
        const y = obj.c - 1;

        if (obj.type === "floor_tile") {
            // 绘制底座方格
            const p00 = project3D(x - 0.5, y - 0.5, -0.5, W, H);
            const p10 = project3D(x + 0.5, y - 0.5, -0.5, W, H);
            const p11 = project3D(x + 0.5, y + 0.5, -0.5, W, H);
            const p01 = project3D(x - 0.5, y + 0.5, -0.5, W, H);

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(p00.x, p00.y);
            ctx.lineTo(p10.x, p10.y);
            ctx.lineTo(p11.x, p11.y);
            ctx.lineTo(p01.x, p01.y);
            ctx.closePath();

            // 若俯视图有影，着黄色投影
            const hasShadow = proj.top[obj.r][obj.c] === 1;
            ctx.fillStyle = hasShadow ? hexToRgba(colorSchemes.top, 0.35) : colorSchemes.gridFloor;
            ctx.fill();
            
            // 如果该底盘格是被悬浮指向的列，外框高亮
            const isHovered = (obj.r === hoveredRow && obj.c === hoveredCol);
            ctx.strokeStyle = isHovered ? "#eab308" : "rgba(148, 163, 184, 0.35)";
            ctx.lineWidth = isHovered ? 1.8 : 1.0;
            ctx.stroke();
            ctx.restore();
        }
        else if (obj.type === "back_wall_tile") {
            // 后壁格子 (主视图面，垂直网格面 x = -1.5)
            const wy = obj.c - 1;
            const wz = obj.z_level - 0.5;

            const p00 = project3D(-1.5, wy - 0.5, wz - 0.5, W, H);
            const p10 = project3D(-1.5, wy + 0.5, wz - 0.5, W, H);
            const p11 = project3D(-1.5, wy + 0.5, wz + 0.5, W, H);
            const p01 = project3D(-1.5, wy - 0.5, wz + 0.5, W, H);

            const poly = [p00, p10, p11, p01];

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(p00.x, p00.y);
            ctx.lineTo(p10.x, p10.y);
            ctx.lineTo(p11.x, p11.y);
            ctx.lineTo(p01.x, p01.y);
            ctx.closePath();

            // 主视图有影点亮宝蓝色
            const hasShadow = proj.front[2 - obj.z_level][obj.c] === 1;
            ctx.fillStyle = hasShadow ? hexToRgba(colorSchemes.front, 0.35) : "rgba(241, 245, 249, 0.15)";
            ctx.fill();

            // 绘制后投影壁面的全息同心格线和十字瞄准 (Hologram grid details)
            if (hasShadow) {
                const cx = (p00.x + p11.x) / 2;
                const cy = (p00.y + p11.y) / 2;
                ctx.strokeStyle = "rgba(59, 130, 246, 0.5)";
                ctx.lineWidth = 0.8;
                
                // 十字瞄准
                ctx.beginPath();
                ctx.moveTo(cx - 3, cy); ctx.lineTo(cx + 3, cy);
                ctx.moveTo(cx, cy - 3); ctx.lineTo(cx, cy + 3);
                ctx.stroke();

                // 同心比例框
                const k = 0.6;
                ctx.beginPath();
                ctx.moveTo(cx + (p00.x - cx)*k, cy + (p00.y - cy)*k);
                ctx.lineTo(cx + (p10.x - cx)*k, cy + (p10.y - cy)*k);
                ctx.lineTo(cx + (p11.x - cx)*k, cy + (p11.y - cy)*k);
                ctx.lineTo(cx + (p01.x - cx)*k, cy + (p01.y - cy)*k);
                ctx.closePath();
                ctx.stroke();
            }

            // 悬停列的投影格同步高亮
            const isHoveredCol = (obj.c === hoveredCol);
            ctx.strokeStyle = isHoveredCol ? "#3b82f6" : "rgba(148, 163, 184, 0.25)";
            ctx.lineWidth = isHoveredCol ? 1.5 : 0.8;
            ctx.stroke();
            ctx.restore();
        }
        else if (obj.type === "left_wall_tile") {
            // 左壁格子 (左视图面，垂直网格面 y = -1.5)
            const wx = obj.r - 1;
            const wz = obj.z_level - 0.5;

            const p00 = project3D(wx - 0.5, -1.5, wz - 0.5, W, H);
            const p10 = project3D(wx + 0.5, -1.5, wz - 0.5, W, H);
            const p11 = project3D(wx + 0.5, -1.5, wz + 0.5, W, H);
            const p01 = project3D(wx - 0.5, -1.5, wz + 0.5, W, H);

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(p00.x, p00.y);
            ctx.lineTo(p10.x, p10.y);
            ctx.lineTo(p11.x, p11.y);
            ctx.lineTo(p01.x, p01.y);
            ctx.closePath();

            // 左视图有影点亮翡翠绿色
            const hasShadow = proj.left[2 - obj.z_level][obj.r] === 1;
            ctx.fillStyle = hasShadow ? hexToRgba(colorSchemes.left, 0.35) : "rgba(241, 245, 249, 0.15)";
            ctx.fill();

            // 绘制左投影壁面的全息同心格线和十字瞄准
            if (hasShadow) {
                const cx = (p00.x + p11.x) / 2;
                const cy = (p00.y + p11.y) / 2;
                ctx.strokeStyle = "rgba(16, 185, 129, 0.5)";
                ctx.lineWidth = 0.8;
                
                // 十字瞄准
                ctx.beginPath();
                ctx.moveTo(cx - 3, cy); ctx.lineTo(cx + 3, cy);
                ctx.moveTo(cx, cy - 3); ctx.lineTo(cx, cy + 3);
                ctx.stroke();

                // 同心比例框
                const k = 0.6;
                ctx.beginPath();
                ctx.moveTo(cx + (p00.x - cx)*k, cy + (p00.y - cy)*k);
                ctx.lineTo(cx + (p10.x - cx)*k, cy + (p10.y - cy)*k);
                ctx.lineTo(cx + (p11.x - cx)*k, cy + (p11.y - cy)*k);
                ctx.lineTo(cx + (p01.x - cx)*k, cy + (p01.y - cy)*k);
                ctx.closePath();
                ctx.stroke();
            }

            const isHoveredRow = (obj.r === hoveredRow);
            ctx.strokeStyle = isHoveredRow ? "#10b981" : "rgba(148, 163, 184, 0.25)";
            ctx.lineWidth = isHoveredRow ? 1.5 : 0.8;
            ctx.stroke();
            ctx.restore();
        }
        else if (obj.type === "cube") {
            // 实体积木方块渲染
            const cx = obj.r - 1;
            const cy = obj.c - 1;
            const cz = obj.z;

            const v = [
                project3D(cx - 0.5, cy - 0.5, cz - 0.5, W, H),
                project3D(cx + 0.5, cy - 0.5, cz - 0.5, W, H),
                project3D(cx + 0.5, cy + 0.5, cz - 0.5, W, H),
                project3D(cx - 0.5, cy + 0.5, cz - 0.5, W, H),
                project3D(cx - 0.5, cy - 0.5, cz + 0.5, W, H),
                project3D(cx + 0.5, cy - 0.5, cz + 0.5, W, H),
                project3D(cx + 0.5, cy + 0.5, cz + 0.5, W, H),
                project3D(cx - 0.5, cy + 0.5, cz + 0.5, W, H)
            ];

            const faces = [
                { poly: [v[4], v[7], v[6], v[5]], norm: { x: 0, y: 0, z: 1 }, color: "#fbbf24" },
                { poly: [v[0], v[4], v[5], v[1]], norm: { x: 0, y: -1, z: 0 }, color: "#14b8a6" },
                { poly: [v[1], v[5], v[6], v[2]], norm: { x: 1, y: 0, z: 0 }, color: "#2563eb" },
                { poly: [v[3], v[2], v[6], v[7]], norm: { x: 0, y: 1, z: 0 }, color: "#d97706" },
                { poly: [v[0], v[3], v[7], v[4]], norm: { x: -1, y: 0, z: 0 }, color: "#0f766e" },
                { poly: [v[0], v[1], v[2], v[3]], norm: { x: 0, y: 0, z: -1 }, color: "#1d4ed8" }
            ];

            faces.forEach(f => {
                drawFace(f.poly, f.norm, lightDir, f.color);
            });
        }
    });

    // E. 教学优化：如果某列立柱被悬浮，绘制动态扫描激光线及选择线框
    if (hoveredRow !== -1 && hoveredCol !== -1) {
        const h = grid[hoveredRow][hoveredCol];
        
        // 1. 绘制列包围高亮框线
        drawColumnOutline(hoveredRow, hoveredCol, h, W, H);

        // 2. 绘制到三个投影平面的激光扫描线 (仅当高度 h > 0 且勾选显示时)
        if (h > 0 && showLasers) {
            for (let z = 0; z < h; z++) {
                const cx = hoveredRow - 1;
                const cy = hoveredCol - 1;
                const cz = z;

                const pCenter = project3D(cx, cy, cz, W, H);

                // A. 投影到后投影面 (x = -1.5)
                if (drawBackWall) {
                    const pBack = project3D(-1.5, cy, cz, W, H);
                    drawLaserRay(pCenter, pBack, "#3b82f6"); // 蓝色激光
                }

                // B. 投影到左投影面 (y = -1.5)
                if (drawLeftWall) {
                    const pLeft = project3D(cx, -1.5, cz, W, H);
                    drawLaserRay(pCenter, pLeft, "#10b981"); // 绿色激光
                }

                // C. 投影到地盘面 (z = -0.5)
                const pFloor = project3D(cx, cy, -0.5, W, H);
                drawLaserRay(pCenter, pFloor, "#f59e0b"); // 黄色激光
            }
        }
    }

    // F. 同步三视图数据；任务一绘制时由点击事件单独刷新，避免动画循环重建格子导致点击丢失。
    if (currentMode !== "quest1") {
        updateProjectionViews();
    }
}

// ==========================================================================
// 3. 三视图计算与绘制渲染 (Three Views Auto projection)
// ==========================================================================
function getProjections() {
    let front = [[0,0,0],[0,0,0],[0,0,0]];
    let left  = [[0,0,0],[0,0,0],[0,0,0]];
    let top   = [[0,0,0],[0,0,0],[0,0,0]];

    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            if (grid[r][c] > 0) {
                top[r][c] = 1;
            }
        }
    }

    for (let c = 0; c < 3; c++) {
        const maxH = Math.max(grid[0][c], grid[1][c], grid[2][c]);
        for (let z = 0; z < maxH; z++) {
            front[2 - z][c] = 1;
        }
    }

    for (let r = 0; r < 3; r++) {
        const maxH = Math.max(grid[r][0], grid[r][1], grid[r][2]);
        for (let z = 0; z < maxH; z++) {
            left[2 - z][r] = 1;
        }
    }

    return { front, left, top };
}

function getViewHeightsFromFront(matrix) {
    return [0, 1, 2].map(col => matrix[0][col] + matrix[1][col] + matrix[2][col]);
}

function getViewHeightsFromLeft(matrix) {
    return [0, 1, 2].map(row => matrix[row][0] + matrix[row][1] + matrix[row][2]);
}

function getExtremeCubeCount(frontMatrix, leftMatrix, mode) {
    const frontHeights = getViewHeightsFromFront(frontMatrix);
    const leftHeights = getViewHeightsFromLeft(leftMatrix);
    const caps = leftHeights.map(rowHeight => frontHeights.map(colHeight => Math.min(rowHeight, colHeight)));

    let best = mode === "min" ? Infinity : -Infinity;
    const rowMax = [0, 0, 0];
    const colMax = [0, 0, 0];

    const dfs = (index, total) => {
        if (index === 9) {
            for (let i = 0; i < 3; i++) {
                if (rowMax[i] !== leftHeights[i] || colMax[i] !== frontHeights[i]) return;
            }
            best = mode === "min" ? Math.min(best, total) : Math.max(best, total);
            return;
        }

        const r = Math.floor(index / 3);
        const c = index % 3;
        const cap = caps[r][c];

        for (let h = 0; h <= cap; h++) {
            const prevRowMax = rowMax[r];
            const prevColMax = colMax[c];
            rowMax[r] = Math.max(rowMax[r], h);
            colMax[c] = Math.max(colMax[c], h);
            dfs(index + 1, total + h);
            rowMax[r] = prevRowMax;
            colMax[c] = prevColMax;
        }
    };

    dfs(0, 0);
    return Number.isFinite(best) ? best : null;
}

function updateProjectionViews() {
    const proj = getProjections();
    const isDrawingMode = (currentMode === "quest1");

    const togglePaintCell = (matrix, r, c) => {
        matrix[r][c] = matrix[r][c] === 1 ? 0 : 1;
        playClickSound();
        updateProjectionViews();
    };

    const renderPlateGrid = (elementId, activeClass, calculatedMatrix, userPaintedMatrix, type) => {
        const container = document.getElementById(elementId);
        container.innerHTML = "";
        
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                const cell = document.createElement("div");
                cell.className = "proj-cell";

                if (isDrawingMode) {
                    cell.classList.add("drawable-cell");
                    cell.setAttribute("role", "button");
                    cell.tabIndex = 0;
                    if (userPaintedMatrix[r][c] === 1) {
                        cell.classList.add("painted");
                    }
                    cell.addEventListener("pointerup", (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        togglePaintCell(userPaintedMatrix, r, c);
                    });
                    cell.addEventListener("keydown", (event) => {
                        if (event.key !== "Enter" && event.key !== " ") return;
                        event.preventDefault();
                        togglePaintCell(userPaintedMatrix, r, c);
                    });
                } else {
                    if (calculatedMatrix[r][c] === 1) {
                        cell.classList.add(activeClass);
                    }
                    
                    // 教学优化：三视图投影网格同步悬浮高亮 (Sync highlights)
                    // 判断此投影格是否受当前 hovered 单元格的影响
                    let isAffected = false;
                    if (hoveredRow !== -1 && hoveredCol !== -1) {
                        if (type === "top" && r === hoveredRow && c === hoveredCol) {
                            isAffected = true;
                        } else if (type === "front" && c === hoveredCol) {
                            // 受该列高度影响
                            const maxH = Math.max(grid[0][hoveredCol], grid[1][hoveredCol], grid[2][hoveredCol]);
                            if (2 - r < maxH) {
                                isAffected = true;
                            }
                        } else if (type === "left" && r === hoveredRow) {
                            // 受该行高度影响
                            const maxH = Math.max(grid[hoveredRow][0], grid[hoveredRow][1], grid[hoveredRow][2]);
                            if (2 - c < maxH) {
                                isAffected = true;
                            }
                        }
                    }

                    if (isAffected) {
                        cell.classList.add("projection-linked");
                        cell.style.boxShadow = "inset 0 0 0 1.5px #eab308"; // 悬浮列投影带金黄色高亮边
                        cell.style.borderColor = "#eab308";
                    }
                }
                container.appendChild(cell);
            }
        }
    };

    renderPlateGrid("grid-front", "grid-front-active", proj.front, userPaintedFront, "front");
    renderPlateGrid("grid-left", "grid-left-active", proj.left, userPaintedLeft, "left");
    renderPlateGrid("grid-top", "grid-top-active", proj.top, userPaintedTop, "top");

    if (currentMode !== "quest1" && currentMode !== "sandbox") {
        checkReconstructionMatch(proj);
    }
}

// ==========================================================================
// 4. 右侧操作按钮同步 (Controller Bindings)
// ==========================================================================
function initHeightController() {
    heightControlGrid.innerHTML = "";
    let totalCubes = 0;

    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            const h = grid[r][c];
            totalCubes += h;

            const cell = document.createElement("div");
            cell.className = "height-control-cell";

            // 教学优化：标数控制器悬浮监听 (Sync hover columns)
            cell.addEventListener("mouseenter", () => {
                hoveredRow = r;
                hoveredCol = c;
                cell.classList.add("is-linked");
                drawSandbox();
            });
            cell.addEventListener("mouseleave", () => {
                hoveredRow = -1;
                hoveredCol = -1;
                cell.classList.remove("is-linked");
                drawSandbox();
            });

            const btnUp = document.createElement("button");
            btnUp.className = `btn-height-adj ${h >= 3 ? 'disabled' : ''}`;
            btnUp.innerText = "▲";
            btnUp.addEventListener("click", () => {
                if (grid[r][c] < 3) {
                    grid[r][c]++;
                    playClickSound();
                    syncControllerAndDraw();
                }
            });

            const valText = document.createElement("span");
            valText.className = `height-val ${h > 0 ? 'non-zero' : ''}`;
            valText.innerText = h;

            const btnDown = document.createElement("button");
            btnDown.className = `btn-height-adj ${h <= 0 ? 'disabled' : ''}`;
            btnDown.innerText = "▼";
            btnDown.addEventListener("click", () => {
                if (grid[r][c] > 0) {
                    grid[r][c]--;
                    playClickSound();
                    syncControllerAndDraw();
                }
            });

            cell.appendChild(btnUp);
            cell.appendChild(valText);
            cell.appendChild(btnDown);
            heightControlGrid.appendChild(cell);
        }
    }

    cubeCountVal.innerText = totalCubes;
}

function syncControllerAndDraw() {
    initHeightController();
    drawSandbox();
}

// ==========================================================================
// 5. 手动拖拽旋转逻辑 (Drag View Rotation)
// ==========================================================================
function initCanvasDragEvents() {
    const handlePointerDown = (e) => {
        isDragging = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
        canvas.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (!isDragging) return;
        
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;

        yaw += deltaX * 0.0075;
        pitch -= deltaY * 0.0075;

        // 允许 -90 到 +90 度观察，防止垂直过界反转
        pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, pitch));

        document.querySelectorAll(".btn-snap").forEach(b => b.classList.remove("active"));
        drawSandbox();
    };

    const handlePointerUp = (e) => {
        if (isDragging) {
            canvas.releasePointerCapture(e.pointerId);
            isDragging = false;
        }
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
}

function animateCameraTo(targetY, targetP, buttonId) {
    targetYaw = targetY;
    targetPitch = targetP;
    isAnimatingCamera = true;

    document.querySelectorAll(".btn-snap").forEach(b => b.classList.remove("active"));
    const btn = document.getElementById(buttonId);
    if (btn) btn.classList.add("active");

    playClickSound();
}

// ==========================================================================
// 6. 经典预设几何图形 (Presets)
// ==========================================================================
function loadPreset(type) {
    if (currentMode !== "sandbox") {
        if (!confirm("加载预设会退出当前挑战，确认重置吗？")) return;
        exitQuestsToSandbox();
    }

    document.querySelectorAll(".btn-preset").forEach(b => b.classList.remove("active"));
    const btn = document.getElementById(`preset-${type}`);
    if (btn) btn.classList.add("active");

    if (type === "l") {
        grid = [
            [2, 0, 0],
            [1, 0, 0],
            [1, 1, 1]
        ];
    } else if (type === "t") {
        grid = [
            [1, 1, 1],
            [0, 2, 0],
            [0, 1, 0]
        ];
    } else if (type === "stair") {
        grid = [
            [3, 2, 1],
            [2, 1, 0],
            [1, 0, 0]
        ];
    } else if (type === "cross") {
        grid = [
            [0, 1, 0],
            [1, 3, 1],
            [0, 1, 0]
        ];
    }

    playClickSound();
    syncControllerAndDraw();
}

// ==========================================================================
// 7. 教学挑战任务逻辑 (Quest Engine)
// ==========================================================================
function exitQuestsToSandbox() {
    currentMode = "sandbox";
    stepGuideIndicator.innerHTML = "💡 当前模式：自由搭建沙盒";
    
    btnSubmitQuest1.classList.add("hidden");
    document.getElementById("grid-front").classList.remove("interactive");
    document.getElementById("grid-left").classList.remove("interactive");
    document.getElementById("grid-top").classList.remove("interactive");

    setActiveQuestVisual();
}

function startQuest1() {
    exitQuestsToSandbox();
    currentMode = "quest1";
    stepGuideIndicator.innerHTML = "🖍️ 挑战中：请在下方三视图网格上涂色进行答题！";

    setActiveQuestVisual(1);
    generateRandomQuestGrid();
    syncControllerAndDraw();

    userPaintedFront = [[0,0,0],[0,0,0],[0,0,0]];
    userPaintedLeft  = [[0,0,0],[0,0,0],[0,0,0]];
    userPaintedTop   = [[0,0,0],[0,0,0],[0,0,0]];

    updateProjectionViews();

    btnSubmitQuest1.classList.remove("hidden");
    document.getElementById("grid-front").classList.add("interactive");
    document.getElementById("grid-left").classList.add("interactive");
    document.getElementById("grid-top").classList.add("interactive");
}

function generateRandomQuestGrid() {
    grid = [
        [0,0,0],
        [0,0,0],
        [0,0,0]
    ];
    for (let k = 0; k < 6; k++) {
        const r = Math.floor(Math.random() * 3);
        const c = Math.floor(Math.random() * 3);
        if (grid[r][c] < 3) {
            grid[r][c]++;
        }
    }
}

function submitQuest1Drawing() {
    const calculated = getProjections();
    
    const match = (matrixA, matrixB) => {
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (matrixA[r][c] !== matrixB[r][c]) return false;
            }
        }
        return true;
    };

    const isFrontOk = match(calculated.front, userPaintedFront);
    const isLeftOk  = match(calculated.left, userPaintedLeft);
    const isTopOk   = match(calculated.top, userPaintedTop);

    const animateError = (id, checkVal) => {
        const el = document.getElementById(id);
        if (!checkVal) {
            el.classList.add("error-border");
            setTimeout(() => el.classList.remove("error-border"), 400);
        }
    };

    if (isFrontOk && isLeftOk && isTopOk) {
        completedQuests[1] = true;
        markQuestCompleted(1);
        exitQuestsToSandbox();
        triggerConfettiFireworks();
    } else {
        animateError("grid-front", isFrontOk);
        animateError("grid-left", isLeftOk);
        animateError("grid-top", isTopOk);
        playDeleteSound();
    }
}

function startQuest2() {
    exitQuestsToSandbox();
    currentMode = "quest2";
    stepGuideIndicator.innerHTML = "🧱 挑战中：请根据下方给出的投影还原 3D 搭建！";
    setActiveQuestVisual(2);

    generateRandomQuestGrid();
    const targetProj = getProjections();
    questTargetFront = targetProj.front;
    questTargetLeft  = targetProj.left;
    questTargetTop   = targetProj.top;

    grid = [[0,0,0],[0,0,0],[0,0,0]];
    syncControllerAndDraw();
    renderStaticTargetProjections();
}

function renderStaticTargetProjections() {
    const renderStaticPlate = (elementId, activeClass, targetMatrix) => {
        const container = document.getElementById(elementId);
        container.innerHTML = "";
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                const cell = document.createElement("div");
                cell.className = "proj-cell";
                if (targetMatrix[r][c] === 1) {
                    cell.classList.add(activeClass);
                }
                container.appendChild(cell);
            }
        }
    };
    renderStaticPlate("grid-front", "grid-front-active", questTargetFront);
    renderStaticPlate("grid-left", "grid-left-active", questTargetLeft);
    renderStaticPlate("grid-top", "grid-top-active", questTargetTop);
}

function startQuest3() {
    exitQuestsToSandbox();
    currentMode = "quest3";
    stepGuideIndicator.innerHTML = "⬇️ 极值应考：使积木总数最少，且符合下方正视图和左视图投影！";
    setActiveQuestVisual(3);

    questTargetFront = [
        [0, 1, 0],
        [1, 1, 0],
        [1, 1, 1]
    ];
    questTargetLeft = [
        [1, 0, 0],
        [1, 1, 0],
        [1, 1, 1]
    ];
    questTargetTop = [[0,0,0],[0,0,0],[0,0,0]];
    questTargetTotal = getExtremeCubeCount(questTargetFront, questTargetLeft, "min");

    grid = [[0,0,0],[0,0,0],[0,0,0]];
    syncControllerAndDraw();
    renderStaticTargetProjections();
}

function startQuest4() {
    exitQuestsToSandbox();
    currentMode = "quest4";
    stepGuideIndicator.innerHTML = "⬆️ 极值应考：使积木总数最多，且符合下方正视图和左视图投影！";
    setActiveQuestVisual(4);

    questTargetFront = [
        [0, 1, 0],
        [1, 1, 0],
        [1, 1, 1]
    ];
    questTargetLeft = [
        [1, 0, 0],
        [1, 1, 0],
        [1, 1, 1]
    ];
    questTargetTop = [[0,0,0],[0,0,0],[0,0,0]];
    questTargetTotal = getExtremeCubeCount(questTargetFront, questTargetLeft, "max");

    grid = [[0,0,0],[0,0,0],[0,0,0]];
    syncControllerAndDraw();
    renderStaticTargetProjections();
}

function checkReconstructionMatch(currentProj) {
    const match = (matrixA, matrixB) => {
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (matrixA[r][c] !== matrixB[r][c]) return false;
            }
        }
        return true;
    };

    let total = 0;
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            total += grid[r][c];
        }
    }

    if (currentMode === "quest2") {
        const matchFront = match(currentProj.front, questTargetFront);
        const matchLeft  = match(currentProj.left, questTargetLeft);
        const matchTop   = match(currentProj.top, questTargetTop);

        if (matchFront && matchLeft && matchTop) {
            completedQuests[2] = true;
            markQuestCompleted(2);
            exitQuestsToSandbox();
            triggerConfettiFireworks();
        }
    }
    else if (currentMode === "quest3") {
        const matchFront = match(currentProj.front, questTargetFront);
        const matchLeft  = match(currentProj.left, questTargetLeft);

        if (matchFront && matchLeft && total === questTargetTotal) {
            completedQuests[3] = true;
            markQuestCompleted(3);
            exitQuestsToSandbox();
            triggerConfettiFireworks();
        }
    }
    else if (currentMode === "quest4") {
        const matchFront = match(currentProj.front, questTargetFront);
        const matchLeft  = match(currentProj.left, questTargetLeft);

        if (matchFront && matchLeft && total === questTargetTotal) {
            completedQuests[4] = true;
            markQuestCompleted(4);
            exitQuestsToSandbox();
            triggerConfettiFireworks();
        }
    }
}

function markQuestCompleted(id) {
    setActiveQuestVisual(id);
}

function setActiveQuestVisual(id) {
    document.querySelectorAll(".quest-card").forEach(card => {
        const cardId = Number(card.id.replace("quest-card-", ""));
        const status = card.querySelector(".quest-status");
        const isCompleted = !!completedQuests[cardId];
        const isActive = !!id && cardId === id && !isCompleted;

        card.classList.toggle("completed", isCompleted);
        card.classList.toggle("active-quest", isActive);

        if (status) {
            status.innerHTML = isCompleted ? "🏆 已完成" : (isActive ? "进行中" : "未完成");
        }

        const btnStart = card.querySelector(".btn-quest-start");
        if (btnStart) btnStart.classList.toggle("hidden", isCompleted);
    });
}

// ==========================================================================
// 8. 音频合成系统 (Web Audio)
// ==========================================================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playClickSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.04);
}

function playDeleteSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

function playSuccessChord() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25];
    notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.04, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(now + idx * 0.05 + 0.25);
    });
}

// ==========================================================================
// 9. 礼花散射动画 (Confetti sparks particle system)
// ==========================================================================
class SparkParticle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4.0 + 2.0;
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

function triggerConfettiFireworks() {
    const rect = canvas.getBoundingClientRect();
    const px = rect.left + rect.width / 2;
    const py = rect.top + rect.height / 2;

    const colors = ["#2563eb", "#10b981", "#f59e0b", "#a855f7", "#ec4899"];
    for (let k = 0; k < 50; k++) {
        const randColor = colors[Math.floor(Math.random() * colors.length)];
        particles.push(new SparkParticle(px + (Math.random() - 0.5) * 60, py + (Math.random() - 0.5) * 60, randColor));
    }
    
    playSuccessChord();
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
// 10. 初始化与尺寸绑定 (Init & Resize)
// ==========================================================================
function handleResize() {
    const rect = canvasContainer.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    
    drawSandbox();
}
window.addEventListener("resize", handleResize);

function init() {
    btnHudToggle.addEventListener("click", () => {
        hudCard.classList.toggle("collapsed");
        playClickSound();
    });

    btnSnapIso.addEventListener("click", () => animateCameraTo(Math.PI / 4 + 0.1, Math.atan(1 / Math.sqrt(2)), "btn-snap-iso"));
    btnSnapFront.addEventListener("click", () => animateCameraTo(0, 0.01, "btn-snap-front"));
    btnSnapLeft.addEventListener("click", () => animateCameraTo(Math.PI / 2, 0.01, "btn-snap-left"));
    btnSnapTop.addEventListener("click", () => animateCameraTo(0, Math.PI / 2 - 0.01, "btn-snap-top"));

    // 教学配置勾选框绑定
    chkShowWalls.addEventListener("change", () => {
        showWalls = chkShowWalls.checked;
        drawSandbox();
    });
    chkShowLasers.addEventListener("change", () => {
        showLasers = chkShowLasers.checked;
        drawSandbox();
    });

    document.getElementById("preset-l").addEventListener("click", () => loadPreset("l"));
    document.getElementById("preset-t").addEventListener("click", () => loadPreset("t"));
    document.getElementById("preset-stair").addEventListener("click", () => loadPreset("stair"));
    document.getElementById("preset-cross").addEventListener("click", () => loadPreset("cross"));

    btnClearCubes.addEventListener("click", () => {
        if (currentMode !== "sandbox") {
            if (!confirm("清空积木会退出当前挑战，确认重置吗？")) return;
            exitQuestsToSandbox();
        }
        grid = [[0,0,0],[0,0,0],[0,0,0]];
        playDeleteSound();
        syncControllerAndDraw();
    });

    btnStartQuest1.addEventListener("click", () => startQuest1());
    btnSubmitQuest1.addEventListener("click", () => submitQuest1Drawing());
    btnStartQuest2.addEventListener("click", () => startQuest2());
    btnStartQuest3.addEventListener("click", () => startQuest3());
    btnStartQuest4.addEventListener("click", () => startQuest4());

    initCanvasDragEvents();
    syncControllerAndDraw();
    handleResize();

    function runLoop() {
        drawSandbox();
        requestAnimationFrame(runLoop);
    }
    runLoop();
}

function resetCurrentTopic() {
    grid = [
        [2, 1, 0],
        [0, 2, 1],
        [1, 0, 0]
    ];
    yaw = Math.PI / 4 + 0.1;
    pitch = Math.atan(1 / Math.sqrt(2));
    targetYaw = yaw;
    targetPitch = pitch;
    isAnimatingCamera = false;
    isDragging = false;
    hoveredRow = -1;
    hoveredCol = -1;
    currentMode = "sandbox";
    questTargetGrid = null;
    questTargetFront = null;
    questTargetLeft = null;
    questTargetTop = null;
    questTargetTotal = null;
    questTargetTotal = null;
    userPaintedFront = [[0,0,0],[0,0,0],[0,0,0]];
    userPaintedLeft  = [[0,0,0],[0,0,0],[0,0,0]];
    userPaintedTop   = [[0,0,0],[0,0,0],[0,0,0]];
    document.querySelectorAll(".quest-card").forEach(card => card.classList.remove("active-quest"));
    document.querySelectorAll(".quest-status").forEach(status => {
        if (status.innerText !== "已完成") status.innerText = "未完成";
    });
    document.querySelectorAll(".btn-snap").forEach(button => button.classList.remove("active"));
    btnSnapIso.classList.add("active");
    syncControllerAndDraw();
}

window.__MATH_TOPIC_RESET__jm_topic_m16 = resetCurrentTopic;

document.addEventListener("DOMContentLoaded", init);
