/**
 * 实际问题中的不等式建模 - 课件交互控制脚本 (app.js)
 */

document.addEventListener("DOMContentLoaded", () => {
    // ==========================================================================
    // 1. 全局状态与参数
    // ==========================================================================
    let currentScene = "elevator-limit"; // elevator-limit | tariff-balance | water-tank
    let isHudExpanded = true;
    let zoomScale = 1.0;

    // --- 场景 1 变量 (电梯) ---
    let boxCount = 3;          // 货箱个数 (0 - 8)
    let hasCourier = true;     // 快递员是否乘梯

    // --- 场景 2 变量 (资费套餐) ---
    let callMinutes = 120;     // 每月通话时长 (0 - 350 分)

    // --- 场景 3 变量 (蓄水池) ---
    let timeHours = 4.0;       // 排水时间 (0 - 20 小时)

    // 水流粒子系统状态 (用于水流粒子流动)
    let flowOffset = 0;

    // ==========================================================================
    // 2. DOM 元素获取
    // ==========================================================================
    const sandboxWrapper = document.getElementById("sandbox-wrapper");
    const sandboxSvg = document.getElementById("sandbox-svg");
    const htmlOverlay = document.getElementById("html-overlay");
    const stepsChalkboard = document.getElementById("steps-hud-chalkboard");
    const hudPanel = document.getElementById("hud-chalkboard-panel");
    const hudToggleBtn = document.getElementById("hud-toggle-btn");

    const slidersContainer = document.getElementById("sliders-container");
    const presetButtonsContainer = document.getElementById("preset-buttons-container");
    const btnResetState = document.getElementById("btn-reset-state");
    const btnShowHelp = document.getElementById("btn-show-help");
    const modalHelp = document.getElementById("modal-help");
    const btnCloseHelp = document.getElementById("btn-close-help");

    const theoryTitle = document.getElementById("theory-title");
    const theoryText = document.getElementById("theory-text");

    // ==========================================================================
    // 3. 对齐定位与转换辅助函数
    // ==========================================================================
    function getCenterPosition() {
        const W = sandboxWrapper.clientWidth;
        const H = sandboxWrapper.clientHeight;
        const isDesktop = W > 800;

        // 原点偏右置，避开左侧的悬浮板书 HUD
        const safeCenterX = isDesktop ? (isHudExpanded ? W * 0.58 : W * 0.50) : W * 0.50;
        const safeCenterY = H * 0.50;

        return { x: safeCenterX, y: safeCenterY };
    }

    // ==========================================================================
    // 4. 全局 Ticker 粒子流动循环
    // ==========================================================================
    function updateFrame() {
        flowOffset = (flowOffset + 1.0) % 60;
        if (currentScene === "water-tank") {
            renderSVG(); // 持续渲染波浪动效
        } else {
            renderSVGOnlyFlow(); 
        }
        requestAnimationFrame(updateFrame);
    }

    // ==========================================================================
    // 5. 局部重绘流动粒子与抖动 (高性能)
    // ==========================================================================
    function renderSVGOnlyFlow() {
        const center = getCenterPosition();
        
        if (currentScene === "water-tank") {
            const particles = document.querySelectorAll(".flow-particle-node");
            particles.forEach((p, idx) => {
                const type = p.getAttribute("data-flow"); // inlet | outlet
                const baseVal = parseFloat(p.getAttribute("data-base-idx"));
                
                let curPos = (baseVal * 15 + flowOffset) % 60;
                
                if (type === "inlet") {
                    // 进水管：水平段 y = center.y - 126, x: center.x - 170 -> center.x - 130; 垂直段 x = center.x - 130
                    if (curPos < 40) {
                        p.setAttribute("cx", center.x - 170 + curPos);
                        p.setAttribute("cy", center.y - 126);
                    } else {
                        p.setAttribute("cx", center.x - 130);
                        p.setAttribute("cy", center.y - 126 + (curPos - 40));
                    }
                } else if (type === "outlet") {
                    // 出水管：垂直段 x = center.x + 95, y: center.y + 76 -> center.y + 109; 水平段 y = center.y + 109
                    if (curPos < 22) {
                        p.setAttribute("cx", center.x + 95);
                        p.setAttribute("cy", center.y + 76 + curPos * 1.5);
                    } else {
                        p.setAttribute("cx", center.x + 95 + (curPos - 22) * 1.75);
                        p.setAttribute("cy", center.y + 109);
                    }
                }
            });
        }
    }

    // ==========================================================================
    // 6. SVG 渲染逻辑
    // ==========================================================================
    // ==========================================================================
    // 5. 天平吊链与3D金币辅助绘制函数
    // ==========================================================================
    function drawChain(x1, y1, x2, y2) {
        let chainHtml = "";
        const steps = 6;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const cx = x1 + (x2 - x1) * t;
            const cy = y1 + (y2 - y1) * t;
            const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
            // 绘制天平吊环链扣
            chainHtml += `
                <ellipse cx="${cx}" cy="${cy}" rx="4.5" ry="2.2" class="chain-link-item" transform="rotate(${angle + 90}, ${cx}, ${cy})"></ellipse>
            `;
        }
        return chainHtml;
    }

    function draw3DCoin(cx, cy) {
        const rx = 24;
        const ry = 4.5;
        const thickness = 3.5;
        return `
            <g class="shiny-coin-class">
                <!-- 3D 硬币厚度侧边 -->
                <path d="M ${cx - rx} ${cy} L ${cx - rx} ${cy + thickness} A ${rx} ${ry} 0 0 0 ${cx + rx} ${cy + thickness} L ${cx + rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx - rx} ${cy} Z" fill="#b45309" stroke="#78350f" stroke-width="0.5"></path>
                <!-- 3D 硬币顶部面 -->
                <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#brass-gold)" stroke="#fef08a" stroke-width="0.7"></ellipse>
                <!-- 3D 硬币内圈浮雕 -->
                <ellipse cx="${cx}" cy="${cy}" rx="${rx - 5}" ry="${ry - 1}" fill="none" stroke="#fcd34d" stroke-opacity="0.4" stroke-width="0.7"></ellipse>
            </g>
        `;
    }

    // ==========================================================================
    // 6. SVG 渲染主逻辑 (高保真版)
    // ==========================================================================
    function renderSVG() {
        let drawHtml = "";
        const center = getCenterPosition();
        const W = sandboxWrapper.clientWidth;
        const H = sandboxWrapper.clientHeight;

        // 注入高保真着色梯度组
        drawHtml += `
            <defs>
                <!-- 金属拉丝灰渐变 (轿厢、滑轮、天平柱) -->
                <linearGradient id="metal-gray" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#94a3b8" />
                    <stop offset="25%" stop-color="#cbd5e1" />
                    <stop offset="50%" stop-color="#f8fafc" />
                    <stop offset="75%" stop-color="#cbd5e1" />
                    <stop offset="100%" stop-color="#64748b" />
                </linearGradient>
                
                <!-- 黄金黄铜立体渐变 (天平、指针、金币) -->
                <linearGradient id="brass-gold" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#fef08a" />
                    <stop offset="40%" stop-color="#eab308" />
                    <stop offset="80%" stop-color="#ca8a04" />
                    <stop offset="100%" stop-color="#854d0e" />
                </linearGradient>

                <!-- 货箱纸皮渐变 -->
                <linearGradient id="box-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#fde047" />
                    <stop offset="60%" stop-color="#fbbf24" />
                    <stop offset="100%" stop-color="#d97706" />
                </linearGradient>

                <!-- 水面渐变 (安全蓝色) -->
                <linearGradient id="water-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#60a5fa" stop-opacity="0.8" />
                    <stop offset="40%" stop-color="#2563eb" stop-opacity="0.65" />
                    <stop offset="100%" stop-color="#1d4ed8" stop-opacity="0.85" />
                </linearGradient>

                <!-- 水面渐变 (超限危险红色) -->
                <linearGradient id="water-danger-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#f87171" stop-opacity="0.85" />
                    <stop offset="50%" stop-color="#dc2626" stop-opacity="0.7" />
                    <stop offset="100%" stop-color="#991b1b" stop-opacity="0.9" />
                </linearGradient>
            </defs>
        `;

        // ==========================================================================
        // 场景 1: 电梯载重安全上限建模
        // ==========================================================================
        if (currentScene === "elevator-limit") {
            const courierW = hasCourier ? 80 : 0;
            const totalW = courierW + boxCount * 120;
            const isOverloaded = totalW > 800;

            if (isOverloaded) {
                drawHtml += `<rect class="alarm-red-overlay" x="0" y="0" width="${W}" height="${H}"></rect>`;
            }

            // A. 电梯井外框与滑轮组
            drawHtml += `
                <!-- 电梯井 -->
                <rect x="${center.x - 120}" y="20" width="240" height="${H - 40}" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2.5" rx="8" filter="drop-shadow(0 4px 10px rgba(0,0,0,0.03))"></rect>
                
                <!-- 顶部机械滑轮架 -->
                <rect x="${center.x - 26}" y="15" width="52" height="8" fill="#475569" rx="2"></rect>
                <circle cx="${center.x}" cy="32" r="16" fill="url(#metal-gray)" stroke="#475569" stroke-width="1.8"></circle>
                <!-- 滑轮轮辐线 (随重量变重，滑轮产生轻微偏转视觉) -->
                <g transform="rotate(${totalW * 0.45}, ${center.x}, 32)">
                    <line x1="${center.x - 14}" y1="32" x2="${center.x + 14}" y2="32" stroke="#334155" stroke-width="1.5"></line>
                    <line x1="${center.x}" y1="18" x2="${center.x}" y2="46" stroke="#334155" stroke-width="1.5"></line>
                </g>
                <circle cx="${center.x}" cy="32" r="4" fill="#1e293b"></circle>
            `;

            // B. 绘制悬挂弹簧（拉力大变长）
            const springTopY = 48;
            const springRestLength = 55;
            const springExtension = totalW * 0.11;
            const springBottomY = springTopY + springRestLength + springExtension;

            let springPath = `M ${center.x} ${springTopY} L ${center.x} ${springTopY + 10}`;
            const coilCount = 10;
            const coilSpan = (springRestLength + springExtension - 20) / coilCount;
            for (let i = 0; i < coilCount; i++) {
                const cy = springTopY + 10 + i * coilSpan + coilSpan/2;
                const sign = i % 2 === 0 ? 1 : -1;
                springPath += ` Q ${center.x + 12 * sign} ${cy} ${center.x} ${cy + coilSpan/2}`;
            }
            springPath += ` L ${center.x} ${springBottomY}`;

            drawHtml += `
                <path d="${springPath}" fill="none" stroke="${isOverloaded ? 'var(--color-danger)' : '#64748b'}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"></path>
                <circle cx="${center.x}" cy="${springBottomY}" r="4" fill="#334155"></circle>
            `;

            // C. 绘制电梯轿厢
            const cabinW = 194;
            const cabinH = 175;
            const ropeLength = 26; 
            const cabinTopY = springBottomY + ropeLength;
            const shakeClass = isOverloaded ? "overloaded-shake-class" : "";

            drawHtml += `
                <g class="${shakeClass}" style="transform-origin: ${center.x}px ${cabinTopY}px;">
                    <!-- 悬吊钢索线 -->
                    <line x1="${center.x}" y1="${springBottomY}" x2="${center.x}" y2="${cabinTopY}" stroke="${isOverloaded ? 'var(--color-danger)' : '#475569'}" stroke-width="2.5"></line>
                    <line x1="${center.x - 3}" y1="${springBottomY + 5}" x2="${center.x - 3}" y2="${cabinTopY}" stroke="#94a3b8" stroke-width="0.8" stroke-opacity="0.6"></line>
                    
                    <!-- 轿厢金属外壳面 -->
                    <rect x="${center.x - cabinW/2}" y="${cabinTopY}" width="${cabinW}" height="${cabinH}" fill="url(#metal-gray)" stroke="${isOverloaded ? 'var(--color-danger)' : '#475569'}" stroke-width="3" rx="8"></rect>
                    <!-- 轿厢内部透视内框 -->
                    <rect x="${center.x - cabinW/2 + 8}" y="${cabinTopY + 8}" width="${cabinW - 16}" height="${cabinH - 16}" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" rx="4"></rect>
                    
                    <!-- 限重板书标志 -->
                    <rect x="${center.x - 70}" y="${cabinTopY + 14}" width="140" height="22" fill="${isOverloaded ? 'var(--color-danger)' : '#fef3c7'}" stroke="${isOverloaded ? '#ffffff' : '#f59e0b'}" stroke-width="1.5" rx="4"></rect>
                    <text x="${center.x}" y="${cabinTopY + 29}" fill="${isOverloaded ? '#ffffff' : '#b45309'}" font-size="10px" font-weight="800" text-anchor="middle" letter-spacing="0.5px">限重 LIMIT: 800 kg</text>
            `;

            // D. 绘制精细快递员 (帽子 + 衣服 + 包裹)
            if (hasCourier) {
                const py = cabinTopY + cabinH - 10;
                drawHtml += `
                    <!-- 裤腿鞋脚 -->
                    <rect x="${center.x - 59}" y="${py - 16}" width="6" height="16" fill="#334155" rx="1"></rect>
                    <rect x="${center.x - 47}" y="${py - 16}" width="6" height="16" fill="#334155" rx="1"></rect>
                    
                    <!-- 外套外套与身体 -->
                    <path d="M ${center.x - 64} ${py - 42} L ${center.x - 36} ${py - 42} L ${center.x - 38} ${py - 15} L ${center.x - 62} ${py - 15} Z" fill="#2563eb" stroke="#1d4ed8" stroke-width="1" rx="2"></path>
                    
                    <!-- 鸭舌帽 & 头部 -->
                    <circle cx="${center.x - 50}" cy="${py - 52}" r="9" fill="#fed7aa"></circle>
                    <path d="M ${center.x - 60} ${py - 57} A 9 9 0 0 1 ${center.x - 41} ${py - 57} L ${center.x - 34} ${py - 54} L ${center.x - 50} ${py - 50} Z" fill="#1e3a8a"></path>
                    
                    <!-- 快递员手中抱着的快递包 -->
                    <rect x="${center.x - 52}" y="${py - 36}" width="22" height="16" fill="#d97706" rx="2"></rect>
                    <line x1="${center.x - 41}" y1="${py - 36}" x2="${center.x - 41}" y2="${py - 20}" stroke="#b45309" stroke-width="1"></line>
                    
                    <!-- 手臂抱住包裹 -->
                    <path d="M ${center.x - 62} ${py - 36} Q ${center.x - 45} ${py - 30} ${center.x - 36} ${py - 30}" fill="none" stroke="#2563eb" stroke-width="4.5" stroke-linecap="round"></path>
                    <text x="${center.x - 50}" y="${py - 66}" font-size="9.5px" font-weight="800" fill="#475569" text-anchor="middle">快递员 80kg</text>
                `;
            }

            // E. 绘制高级货箱 (带条形码和重量标志)
            const boxW = 56;
            const boxH = 26;
            const startBoxX = center.x + 8;
            const baseBoxY = cabinTopY + cabinH - 10;

            for (let k = 0; k < boxCount; k++) {
                const col = k % 2; 
                const row = Math.floor(k / 2); 
                const bx = startBoxX + col * (boxW + 6);
                const by = baseBoxY - row * (boxH + 3) - boxH;

                drawHtml += `
                    <g>
                        <!-- 纸箱渐变本体 -->
                        <rect x="${bx}" y="${by}" width="${boxW}" height="${boxH}" fill="url(#box-grad)" stroke="#92400e" stroke-width="1.8" rx="4" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"></rect>
                        <!-- 包装胶带 -->
                        <rect x="${bx + boxW/2 - 4}" y="${by}" width="8" height="${boxH}" fill="#b45309" fill-opacity="0.3"></rect>
                        <line x1="${bx}" y1="${by + boxH/2}" x2="${bx + boxW}" y2="${by + boxH/2}" stroke="#78350f" stroke-width="1.2"></line>
                        
                        <!-- 快递贴纸白标签 -->
                        <rect x="${bx + 4}" y="${by + 4}" width="14" height="10" fill="#ffffff" rx="1"></rect>
                        <!-- 模拟标签上的条形码微线条 -->
                        <line x1="${bx + 6}" y1="${by + 7}" x2="${bx + 16}" y2="${by + 7}" stroke="#000000" stroke-width="0.8" stroke-dasharray="1,1"></line>
                        <line x1="${bx + 6}" y1="${by + 10}" x2="${bx + 14}" y2="${by + 10}" stroke="#000000" stroke-width="0.8" stroke-dasharray="1.5,0.8"></line>
                        
                        <!-- 货物重量文本 -->
                        <text x="${bx + boxW - 14}" y="${by + boxH/2 + 4}" fill="#78350f" font-family:var(--font-math) font-size="9.5px" font-weight="800" text-anchor="middle">120kg</text>
                    </g>
                `;
            }

            drawHtml += `</g>`; // 结束抖动 g 组

            // F. 高保真玻璃表盘刻度表
            const dialX = center.x - 170;
            const dialY = 86;
            const pointerAngle = 135 + (Math.min(totalW, 1100) / 1000) * 270;

            drawHtml += `
                <!-- 仪表盘后部阴影 -->
                <circle cx="${dialX}" cy="${dialY}" r="40" fill="#0f172a" fill-opacity="0.08" filter="blur(2px)"></circle>
                <!-- 仪表盘外框 (黄铜圈) -->
                <circle cx="${dialX}" cy="${dialY}" r="38" fill="#ffffff" stroke="url(#brass-gold)" stroke-width="3.5"></circle>
                <!-- 表盘分度环刻度线 -->
                <circle cx="${dialX}" cy="${dialY}" r="32" fill="none" stroke="#e2e8f0" stroke-width="3" stroke-dasharray="2,3.5"></circle>
                <path d="M ${dialX + 8} ${dialY - 31} A 32 32 0 0 1 ${dialX + 28} ${dialY + 12}" fill="none" stroke="var(--color-danger)" stroke-width="3"></path>
                
                <!-- 刻度分划数值 -->
                <text x="${dialX - 22}" y="${dialY + 22}" fill="var(--text-muted)" font-size="7.5px" font-weight="700">0</text>
                <text x="${dialX - 22}" y="${dialY - 14}" fill="var(--text-muted)" font-size="7.5px" font-weight="700">200</text>
                <text x="${dialX}" y="${dialY - 25}" fill="var(--text-muted)" font-size="7.5px" font-weight="700" text-anchor="middle">500</text>
                <text x="${dialX + 22}" y="${dialY - 14}" fill="var(--text-muted)" font-size="7.5px" font-weight="700" text-anchor="end">800</text>

                <!-- 红色指针 -->
                <g transform="rotate(${pointerAngle}, ${dialX}, ${dialY})">
                    <line x1="${dialX}" y1="${dialY}" x2="${dialX}" y2="${dialY - 30}" stroke="var(--color-danger)" stroke-width="2" stroke-linecap="round"></line>
                    <polygon points="${dialX},${dialY - 34} ${dialX - 3.5},${dialY - 25} ${dialX + 3.5},${dialY - 25}" fill="var(--color-danger)"></polygon>
                </g>
                <circle cx="${dialX}" cy="${dialY}" r="4.5" fill="#334155" stroke="#ffffff" stroke-width="1"></circle>
                
                <!-- 玻璃反光层 (Glass Shine) -->
                <path d="M ${dialX - 26} ${dialY - 26} A 36 36 0 0 1 ${dialX + 26} ${dialY - 26} Z" class="glass-reflection-path"></path>
                
                <!-- 底部重量显示框 -->
                <rect x="${dialX - 25}" y="${dialY + 12}" width="50" height="15" fill="#1e293b" rx="3"></rect>
                <text x="${dialX}" y="${dialY + 24}" fill="#34d399" font-family:var(--font-math) font-size="10px" font-weight="800" text-anchor="middle">${totalW}kg</text>
            `;
        }

        // ==========================================================================
        // 场景 2: 资费套餐天平对比建模 (双挂链与3D金币)
        // ==========================================================================
        else if (currentScene === "tariff-balance") {
            const costA = 40 + callMinutes * 0.2;
            const costB = callMinutes * 0.4;

            const diff = costA - costB;
            const angleDeg = Math.max(-18, Math.min(18, diff * 0.45));
            const angleRad = (angleDeg * Math.PI) / 180;

            const fulcrumX = center.x;
            const fulcrumY = center.y + 40;
            const armL = 150;

            // 左右悬吊原点坐标
            const leftPivotX = fulcrumX - armL * Math.cos(angleRad);
            const leftPivotY = fulcrumY - armL * Math.sin(angleRad);
            const rightPivotX = fulcrumX + armL * Math.cos(angleRad);
            const rightPivotY = fulcrumY + armL * Math.sin(angleRad);

            const panW = 100;
            const panH = 90; // 挂链垂长

            // A. 复古支架与大黄铜底座
            drawHtml += `
                <!-- 复合三脚架底盘 -->
                <rect x="${fulcrumX - 70}" y="${H - 24}" width="140" height="10" fill="url(#brass-gold)" stroke="#78350f" stroke-width="1" rx="3"></rect>
                <path d="M ${fulcrumX - 50} ${H - 24} L ${fulcrumX + 50} ${H - 24} L ${fulcrumX + 30} ${H - 56} L ${fulcrumX - 30} ${H - 56} Z" fill="url(#brass-gold)" stroke="#78350f" stroke-width="1.2"></path>
                
                <!-- 金属立柱 -->
                <rect x="${fulcrumX - 8}" y="${fulcrumY}" width="16" height="${H - 56 - fulcrumY}" fill="url(#metal-gray)" stroke="#475569" stroke-width="1.2"></rect>
                <!-- 立柱边缘黄金镶边 -->
                <line x1="${fulcrumX - 8}" y1="${fulcrumY}" x2="${fulcrumX - 8}" y2="${H - 56}" stroke="#eab308" stroke-width="1.2"></line>
                <line x1="${fulcrumX + 8}" y1="${fulcrumY}" x2="${fulcrumX + 8}" y2="${H - 56}" stroke="#eab308" stroke-width="1.2"></line>
                
                <!-- 支座圆心轴承 -->
                <circle cx="${fulcrumX}" cy="${fulcrumY}" r="11" fill="url(#brass-gold)" stroke="#78350f" stroke-width="1.5"></circle>
            `;

            // B. 天平金属悬臂 (带镂空花纹细节)
            drawHtml += `
                <line x1="${leftPivotX}" y1="${leftPivotY}" x2="${rightPivotX}" y2="${rightPivotY}" stroke="url(#brass-gold)" stroke-width="6.5" stroke-linecap="round"></line>
                <line x1="${leftPivotX}" y1="${leftPivotY}" x2="${rightPivotX}" y2="${rightPivotY}" stroke="#78350f" stroke-width="1" stroke-dasharray="5,6"></line>
                
                <circle cx="${leftPivotX}" cy="${leftPivotY}" r="6" fill="url(#brass-gold)" stroke="#78350f" stroke-width="1"></circle>
                <circle cx="${rightPivotX}" cy="${rightPivotY}" r="6" fill="url(#brass-gold)" stroke="#78350f" stroke-width="1"></circle>
                <circle cx="${fulcrumX}" cy="${fulcrumY}" r="5" fill="#1e293b"></circle>
            `;

            // C. 绘制左托盘 (方案 A) 的精细挂链与 3D 黄铜盘
            drawHtml += `
                <!-- 左右双侧金属吊链 (由多个环环相扣扣成) -->
                ${drawChain(leftPivotX, leftPivotY, leftPivotX - panW/2 + 4, leftPivotY + panH)}
                ${drawChain(leftPivotX, leftPivotY, leftPivotX + panW/2 - 4, leftPivotY + panH)}
                
                <!-- 3D 深度托盘底座 (带厚度和反射) -->
                <ellipse cx="${leftPivotX}" cy="${leftPivotY + panH + 3}" rx="${panW/2 + 4}" ry="6" fill="#78350f"></ellipse>
                <ellipse cx="${leftPivotX}" cy="${leftPivotY + panH}" rx="${panW/2 + 4}" ry="6" fill="${costA < costB ? 'url(#water-grad)' : 'url(#brass-gold)'}" stroke="#78350f" stroke-width="1.5"></ellipse>
                
                <!-- 方案 A 包月制卡片 -->
                <rect x="${leftPivotX - 45}" y="${leftPivotY + panH + 16}" width="90" height="22" fill="#ffffff" stroke="${costA < costB ? 'var(--color-safe)' : '#cbd5e1'}" stroke-width="2" rx="4" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))"></rect>
                <text x="${leftPivotX}" y="${leftPivotY + panH + 30}" fill="var(--text-primary)" font-size="10px" font-weight="800" text-anchor="middle">方案 A 包月制</text>
                <text x="${leftPivotX}" y="${leftPivotY + panH - 8}" fill="#1e293b" font-family:var(--font-math) font-size="13px" font-weight="800" text-anchor="middle">${costA.toFixed(1)}元</text>
            `;

            // 绘制立体硬币堆 (左侧 A)
            const stackCountA = Math.ceil(costA / 9);
            for (let a = 0; a < stackCountA; a++) {
                drawHtml += draw3DCoin(leftPivotX, leftPivotY + panH - 2 - a * 4.5);
            }

            // D. 绘制右托盘 (方案 B) 的精细挂链与 3D 黄铜盘
            drawHtml += `
                <!-- 左右双侧金属吊链 -->
                ${drawChain(rightPivotX, rightPivotY, rightPivotX - panW/2 + 4, rightPivotY + panH)}
                ${drawChain(rightPivotX, rightPivotY, rightPivotX + panW/2 - 4, rightPivotY + panH)}
                
                <!-- 3D 深度托盘底座 -->
                <ellipse cx="${rightPivotX}" cy="${rightPivotY + panH + 3}" rx="${panW/2 + 4}" ry="6" fill="#78350f"></ellipse>
                <ellipse cx="${rightPivotX}" cy="${rightPivotY + panH}" rx="${panW/2 + 4}" ry="6" fill="${costB < costA ? 'url(#water-grad)' : 'url(#brass-gold)'}" stroke="#78350f" stroke-width="1.5"></ellipse>
                
                <!-- 方案 B 无月租卡片 -->
                <rect x="${rightPivotX - 45}" y="${rightPivotY + panH + 16}" width="90" height="22" fill="#ffffff" stroke="${costB < costA ? 'var(--color-safe)' : '#cbd5e1'}" stroke-width="2" rx="4" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))"></rect>
                <text x="${rightPivotX}" y="${rightPivotY + panH + 30}" fill="var(--text-primary)" font-size="10px" font-weight="800" text-anchor="middle">方案 B 无月租</text>
                <text x="${rightPivotX}" y="${rightPivotY + panH - 8}" fill="#1e293b" font-family:var(--font-math) font-size="13px" font-weight="800" text-anchor="middle">${costB.toFixed(1)}元</text>
            `;

            // 绘制立体硬币堆 (右侧 B)
            const stackCountB = Math.ceil(costB / 9);
            for (let b = 0; b < stackCountB; b++) {
                drawHtml += draw3DCoin(rightPivotX, rightPivotY + panH - 2 - b * 4.5);
            }

            // E. 指针刻度板 (古董级顶置半圆仪)
            const needleL = 36;
            const nx = fulcrumX + needleL * Math.sin(angleRad);
            const ny = fulcrumY - needleL * Math.cos(angleRad);
            drawHtml += `
                <!-- 刻度板背景 -->
                <path d="M ${fulcrumX - 24} ${fulcrumY - 26} A 36 36 0 0 1 ${fulcrumX + 24} ${fulcrumY - 26}" fill="none" stroke="#e2e8f0" stroke-width="4.5" stroke-linecap="round"></path>
                <!-- 警戒扇面 (偏角大时红色显现) -->
                <path d="M ${fulcrumX - 12} ${fulcrumY - 33} A 36 36 0 0 1 ${fulcrumX + 12} ${fulcrumY - 33}" fill="none" stroke="var(--color-danger)" stroke-width="1.8"></path>
                <!-- 金属指示针 -->
                <line x1="${fulcrumX}" y1="${fulcrumY}" x2="${nx}" y2="${ny}" stroke="var(--color-danger)" stroke-width="2.2" stroke-linecap="round"></line>
                <!-- 指针中心铆钉 -->
                <circle cx="${fulcrumX}" cy="${fulcrumY}" r="3" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"></circle>
            `;
        }

        // ==========================================================================
        // 场景 3: 蓄水池流量警戒液位建模 (动态波浪与精细尺规)
        // ==========================================================================
        else if (currentScene === "water-tank") {
            const volume = Math.max(0, 1000 - 80 * timeHours + 30 * timeHours);
            const isDanger = volume < 200;

            const tankW = 208;
            const tankH = 224;
            const tankTopY = center.y - 100;
            const tankBottomY = tankTopY + tankH;
            const tankLeftX = center.x - tankW/2;

            const waterHeight = (volume / 1000) * tankH;
            const waterTopY = tankBottomY - waterHeight;

            // A. 绘制蓄水池玻璃缸壁与法兰水管
            drawHtml += `
                <!-- 水箱后壁透视投影阴影 -->
                <rect x="${tankLeftX + 4}" y="${tankTopY + 4}" width="${tankW - 8}" height="${tankH - 8}" fill="#f8fafc" fill-opacity="0.9" rx="2"></rect>
                
                <!-- 进水弯头法兰接口 -->
                <rect x="${center.x - 134}" y="${center.y - 104}" width="8" height="4" fill="#334155" rx="1"></rect>
                <!-- 出水接头法兰 -->
                <rect x="${center.x + 91}" y="${center.y + 76}" width="8" height="4" fill="#334155" rx="1"></rect>
            `;

            // B. 绘制动态正弦波澜水面 (根据 flowOffset 产生微微的水面流动波纹)
            if (waterHeight > 0) {
                const waveOffset = (flowOffset / 60) * 2 * Math.PI;
                let waveD = `M ${tankLeftX + 3} ${tankBottomY - 2}`;
                waveD += ` L ${tankLeftX + 3} ${waterTopY}`;
                
                // 分割 5 段，绘制正弦贝塞尔连续曲线
                const segments = 6;
                const segW = (tankW - 6) / segments;
                for (let s = 0; s <= segments; s++) {
                    const sx = tankLeftX + 3 + s * segW;
                    const waveAmp = timeHours > 0 ? 3.5 : 0.8; // 有水流流动时波纹更明显
                    const sy = waterTopY + Math.sin((s / segments) * 2.5 * Math.PI + waveOffset) * waveAmp;
                    waveD += ` L ${sx} ${sy}`;
                }
                waveD += ` L ${tankLeftX + tankW - 3} ${tankBottomY - 2} Z`;

                drawHtml += `
                    <!-- 渐变水体面 -->
                    <path class="water-wave-path" d="${waveD}" fill="${isDanger ? 'url(#water-danger-grad)' : 'url(#water-grad)'}" stroke="none"></path>
                    <!-- 水表面亮色浪花高光线 -->
                    <path class="water-wave-path" d="${waveD.split(" L ").slice(1, -1).reduce((acc, val, idx) => acc + (idx===0 ? 'M ' : ' L ') + val, '')}" 
                          fill="none" stroke="${isDanger ? '#fca5a5' : '#93c5fd'}" stroke-width="1.8" stroke-linecap="round"></path>
                `;
            }

            // C. 进出水管道与法兰手轮阀门
            drawHtml += `
                <!-- 进水管弯头 -->
                <path d="M ${center.x - 170} ${center.y - 126} L ${center.x - 130} ${center.y - 126} L ${center.x - 130} ${center.y - 102}" fill="none" stroke="url(#metal-gray)" stroke-width="8.5" stroke-linecap="round"></path>
                <!-- 进水红色手阀轮 -->
                <circle cx="${center.x - 150}" cy="${center.y - 126}" r="7" fill="none" stroke="#ef4444" stroke-width="2.5"></circle>
                <line x1="${center.x - 150}" y1="${center.y - 133}" x2="${center.x - 150}" y2="${center.y - 119}" stroke="#ef4444" stroke-width="1"></line>
                
                <!-- 出水管弯头 -->
                <path d="M ${center.x + 95} ${center.y + 76} L ${center.x + 95} ${center.y + 109} L ${center.x + 160} ${center.y + 109}" fill="none" stroke="url(#metal-gray)" stroke-width="8.5" stroke-linecap="round"></path>
                <!-- 出水红色手阀轮 -->
                <circle cx="${center.x + 130}" cy="${center.y + 109}" r="7" fill="none" stroke="#ef4444" stroke-width="2.5"></circle>
                <line x1="${center.x + 123}" y1="${center.y + 109}" x2="${center.x + 137}" y2="${center.y + 109}" stroke="#ef4444" stroke-width="1"></line>
            `;

            // D. 进出水管中流动的高发光水滴粒子
            for (let i = 0; i < 4; i++) {
                drawHtml += `
                    <circle class="flow-particle-node" data-flow="inlet" data-base-idx="${i}" cx="0" cy="0" r="3.2" fill="#e0f2fe" filter="drop-shadow(0 0 3px #60a5fa)"></circle>
                    <circle class="flow-particle-node" data-flow="outlet" data-base-idx="${i}" cx="0" cy="0" r="3.2" fill="#e0f2fe" filter="drop-shadow(0 0 3px #60a5fa)"></circle>
                `;
            }

            // E. 安全液位警戒红线
            const safeLevelVolume = 200;
            const safeLevelY = tankBottomY - (safeLevelVolume / 1000) * tankH;
            drawHtml += `
                <!-- 水箱前面的发光警告警戒线 -->
                <line class="warning-level-line" x1="${tankLeftX - 12}" y1="${safeLevelY}" x2="${tankLeftX + tankW + 12}" y2="${safeLevelY}"></line>
                <!-- 警戒线标签 -->
                <rect x="${tankLeftX + tankW + 16}" y="${safeLevelY - 10}" width="134" height="20" fill="rgba(254, 226, 226, 0.9)" stroke="var(--color-danger)" stroke-width="1" rx="3"></rect>
                <text x="${tankLeftX + tankW + 24}" y="${safeLevelY + 4}" fill="var(--color-danger)" font-size="9.5px" font-weight="800">安全警戒水位线 (200 m³)</text>
            `;

            // F. 玻璃水箱前面的高级玻璃光影反光条与刻度尺规
            drawHtml += `
                <!-- 玻璃缸前侧壁 (厚壁外边框) -->
                <path d="M ${tankLeftX} ${tankTopY} L ${tankLeftX} ${tankBottomY} L ${tankLeftX + tankW} ${tankBottomY} L ${tankLeftX + tankW} ${tankTopY}" fill="none" stroke="url(#metal-gray)" stroke-width="5" stroke-linejoin="round"></path>
                
                <!-- 玻璃透光反射条 -->
                <rect x="${tankLeftX + 6}" y="${tankTopY}" width="12" height="${tankH}" fill="rgba(255,255,255,0.25)"></rect>
                <rect x="${tankLeftX + tankW - 18}" y="${tankTopY}" width="12" height="${tankH}" fill="rgba(255,255,255,0.18)"></rect>

                <!-- 水箱左侧玻璃喷砂刻度线 -->
                `;
                for (let v = 0; v <= 1000; v += 200) {
                    const vy = tankBottomY - (v / 1000) * tankH;
                    drawHtml += `
                        <line x1="${tankLeftX + 5}" y1="${vy}" x2="${tankLeftX + (v%500===0 ? 16 : 10)}" y2="${vy}" stroke="#475569" stroke-width="1.5"></line>
                        <text x="${tankLeftX + 22}" y="${vy + 3.5}" fill="var(--text-muted)" font-family:var(--font-math) font-size="8.5px" font-weight="700">${v}</text>
                    `;
                }
                drawHtml += `
            `;

            // G. 液面浮动指示数值标签
            if (waterHeight > 0) {
                drawHtml += `
                    <!-- 浮动浮标线 -->
                    <line x1="${tankLeftX}" y1="${waterTopY}" x2="${tankLeftX + tankW}" y2="${waterTopY}" stroke="#0f172a" stroke-dasharray="2,3" stroke-width="1"></line>
                    <!-- 浮标圆块 -->
                    <circle cx="${center.x}" cy="${waterTopY}" r="4" fill="var(--color-warning)" stroke="#ffffff" stroke-width="1"></circle>
                    
                    <!-- 水量动态大指示框 -->
                    <rect x="${center.x - 52}" y="${waterTopY - 27}" width="104" height="19" fill="#1e293b" rx="4" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"></rect>
                    <text x="${center.x}" y="${waterTopY - 14}" fill="${isDanger ? 'var(--color-danger)' : '#34d399'}" font-family:var(--font-math) font-size="10px" font-weight="800" text-anchor="middle">水量: ${volume.toFixed(1)} m³</text>
                `;
            }
        }

        sandboxSvg.innerHTML = drawHtml;
        renderSVGOnlyFlow(); // 立刻触发粒子初始坐标放置
    }

    // ==========================================================================
    // 7. HTML Overlay 文本提示渲染
    // ==========================================================================
    function renderHTMLOverlay() {
        let html = "";
        const center = getCenterPosition();

        if (currentScene === "elevator-limit") {
            const courierW = hasCourier ? 80 : 0;
            const totalW = courierW + boxCount * 120;
            const isOverloaded = totalW > 800;

            if (isOverloaded) {
                html += `
                    <div style="position: absolute; left: ${center.x}px; top: 180px; transform: translateX(-50%); 
                                background: var(--color-danger); color: white; padding: 6px 16px; border-radius: 100px;
                                font-weight: 800; font-size: 13.5px; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4); animation: flash-warning-border 0.8s infinite;">
                        🚨 严重超载！请减少货物或出梯！
                    </div>
                `;
            }
        } 
        
        else if (currentScene === "tariff-balance") {
            const costA = 40 + callMinutes * 0.2;
            const costB = callMinutes * 0.4;
            const isABetter = costA < costB;
            const isBBetter = costB < costA;

            if (isABetter) {
                html += `
                    <div style="position: absolute; left: ${center.x - 140}px; top: 380px; transform: translateX(-50%); 
                                background: var(--color-safe); color: white; padding: 5px 12px; border-radius: 6px;
                                font-weight: 700; font-size: 11.5px; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.25);">
                        ✨ 包月方案更省钱！
                    </div>
                `;
            } else if (isBBetter) {
                html += `
                    <div style="position: absolute; left: ${center.x + 140}px; top: 380px; transform: translateX(-50%); 
                                background: var(--color-safe); color: white; padding: 5px 12px; border-radius: 6px;
                                font-weight: 700; font-size: 11.5px; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.25);">
                        ✨ 无月租方案更省钱！
                    </div>
                `;
            } else {
                html += `
                    <div style="position: absolute; left: ${center.x}px; top: 220px; transform: translateX(-50%); 
                                background: var(--color-warning); color: white; padding: 5px 12px; border-radius: 6px;
                                font-weight: 700; font-size: 11.5px;">
                        ⚖️ 两套餐资费相同（交界临界点）
                    </div>
                `;
            }
        } 
        
        else if (currentScene === "water-tank") {
            const volume = Math.max(0, 1000 - 50 * timeHours);
            const isDanger = volume < 200;

            if (isDanger) {
                html += `
                    <div style="position: absolute; left: ${center.x}px; top: 240px; transform: translateX(-50%); 
                                background: var(--color-danger); color: white; padding: 6px 14px; border-radius: 100px;
                                font-weight: 800; font-size: 12.5px; animation: flash-warning-border 0.8s infinite;">
                        ⚠️ 警告：水量已跌破最低水位警戒线！
                    </div>
                `;
            }
        }

        htmlOverlay.innerHTML = html;
        updateHUDContent();
    }

    // ==========================================================================
    // 8. HUD 步骤式代数板书文本渲染
    // ==========================================================================
    function updateHUDContent() {
        let html = "";

        if (currentScene === "elevator-limit") {
            const courierW = hasCourier ? 80 : 0;
            const totalW = courierW + boxCount * 120;
            const isOverloaded = totalW > 800;

            let resultBox = "";
            if (isOverloaded) {
                resultBox = `
                    <div class="warning-chalk-box">
                        ❌ 当前状态：${totalW} kg &gt; 800 kg （超载不成立）<br>
                        箱数 x = ${boxCount} 超出了安全承载限值！
                    </div>
                `;
            } else {
                resultBox = `
                    <div class="success-chalk-box">
                        ✅ 当前状态：${totalW} kg &le; 800 kg （安全通过）<br>
                        在箱子数 x = ${boxCount} 时，承重条件满足。
                    </div>
                `;
            }

            html = `
                <div class="hud-row">
                    <div class="hud-row-label">实际问题情境：电梯载重安全</div>
                    <div class="hud-row-val" style="font-size:12.5px; color:var(--text-secondary);">
                        快递员乘电梯带若干货箱，为确保电梯运行安全，总重必须<strong>不超过</strong>限重上限 800 kg。
                    </div>
                </div>
                <div class="hud-row">
                    <div class="hud-row-label">不等式代数建模过程</div>
                    <div class="hud-formula-block">
                        <div style="font-weight:700; color:var(--color-blue); margin-bottom:4px;">1. 设未知数并翻译关系：</div>
                        设装载货箱的数量为 x 个。<br>
                        “总重不超过限重上限 800 kg” &rarr; &le; 800<br>
                        <div style="font-weight:700; color:var(--color-blue); margin-top:8px; margin-bottom:4px;">2. 建立一元一次不等式模型：</div>
                        <div style="font-size: 15px; font-weight: 800; text-align: center; margin: 8px 0; color: var(--color-danger);">
                            80 + 120x &le; 800
                        </div>
                    </div>
                </div>
                <div class="hud-row">
                    <div class="hud-row-label">不等式求解与实际取值</div>
                    <div style="font-size:13px; line-height:1.7;">
                        移项整理得：120x &le; 720<br>
                        两边同除以 120 得：x &le; 6<br>
                        结合箱数只能为整数，实际最大装载量为 <strong>6 个箱子</strong>。
                    </div>
                </div>
                ${resultBox}
            `;
        } 
        
        else if (currentScene === "tariff-balance") {
            const costA = 40 + callMinutes * 0.2;
            const costB = callMinutes * 0.4;
            const isABetter = costA < costB;

            let resultBox = "";
            if (isABetter) {
                resultBox = `
                    <div class="success-chalk-box">
                        🥇 决策建议：选择 <strong>方案 A 包月制</strong><br>
                        在 ${callMinutes} 分钟下，方案 A 比 B 节省了 ${(costB - costA).toFixed(1)} 元！
                    </div>
                `;
            } else if (costA === costB) {
                resultBox = `
                    <div class="warning-chalk-box" style="background:rgba(245,158,11,0.08); border-color:var(--color-warning); color:#b45309;">
                        ⚖️ 临界相交点：两方案资费相等<br>
                        通话正好 $200$ 分钟，费用均为 $80.0$ 元。
                    </div>
                `;
            } else {
                resultBox = `
                    <div class="success-chalk-box" style="border-color:var(--color-blue); color:var(--color-blue); background:rgba(37,99,235,0.05);">
                        🥇 决策建议：选择 <strong>方案 B 无月租</strong><br>
                        在 ${callMinutes} 分钟下，方案 B 比 A 节省了 ${(costA - costB).toFixed(1)} 元！
                    </div>
                `;
            }

            html = `
                <div class="hud-row">
                    <div class="hud-row-label">实际问题情境：资费方案对比</div>
                    <div class="hud-row-val" style="font-size:12.5px;">
                        比较两种计费套餐：A月租较贵但每分钟超额便宜，B无月租但单价贵。决策何时 A 比 B <strong>更划算</strong>？
                    </div>
                </div>
                <div class="hud-row">
                    <div class="hud-row-label">不等式代数建模过程</div>
                    <div class="hud-formula-block">
                        设每月通话时长为 x 分钟。<br>
                        方案 A 费用: 40 + 0.2x 元<br>
                        方案 B 费用: 0.4x 元<br>
                        “方案 A 费用比 方案 B 省钱（更便宜）” &rarr; &lt;<br>
                        <div style="font-weight:700; margin-top:8px; color:var(--color-blue);">代数模型建模式：</div>
                        <div style="font-size: 15px; font-weight: 800; text-align: center; margin: 8px 0; color: var(--color-danger);">
                            40 + 0.2x &lt; 0.4x
                        </div>
                    </div>
                </div>
                <div class="hud-row">
                    <div class="hud-row-label">临界点移项求解</div>
                    <div style="font-size:13px; line-height:1.7;">
                        移项移未知数得：40 &lt; 0.2x<br>
                        不等式两边同除以 0.2 得：<strong>x &gt; 200 分钟</strong>。<br>
                        即：通话超过 200 分钟，A 托盘上升，B 下沉（A 方案更划算）。
                    </div>
                </div>
                ${resultBox}
            `;
        } 
        
        else if (currentScene === "water-tank") {
            const volume = Math.max(0, 1000 - 50 * timeHours);
            const isDanger = volume < 200;

            let resultBox = "";
            if (isDanger) {
                resultBox = `
                    <div class="warning-chalk-box">
                        ❌ 液位枯竭警告：当前水量为 ${volume.toFixed(1)} m³ &lt; 200 m³<br>
                        排水时间 t = ${timeHours.toFixed(1)} 小时超出了安全限度！
                    </div>
                `;
            } else {
                resultBox = `
                    <div class="success-chalk-box">
                        ✅ 安全存量状态：当前水量 ${volume.toFixed(1)} m³ &ge; 200 m³<br>
                        排水时长满足安全水量警戒条件。
                    </div>
                `;
            }

            html = `
                <div class="hud-row">
                    <div class="hud-row-label">实际问题情境：蓄水池枯竭安全线</div>
                    <div class="hud-row-val" style="font-size:12.5px;">
                        水池初水量 1000 m³，排速 80 m³/h，进速 30 m³/h。求需要保证剩余水量<strong>不少于</strong>安全警戒线 200 m³ 的最大运行时间。
                    </div>
                </div>
                <div class="hud-row">
                    <div class="hud-row-label">不等式代数建模过程</div>
                    <div class="hud-formula-block">
                        设供排水时间为 t 小时。<br>
                        水池动态余量公式: 1000 - 80t + 30t<br>
                        “剩余存水不少于 200 m³” &rarr; &ge; 200<br>
                        <div style="font-weight:700; margin-top:8px; color:var(--color-blue);">代数模型建模式：</div>
                        <div style="font-size: 15px; font-weight: 800; text-align: center; margin: 8px 0; color: var(--color-danger);">
                            1000 - 50t &ge; 200
                        </div>
                    </div>
                </div>
                <div class="hud-row">
                    <div class="hud-row-label">不等式求解</div>
                    <div style="font-size:13px; line-height:1.7;">
                        移项移常数项得：-50t &ge; -800<br>
                        <span style="color:var(--color-danger); font-weight:700;">⚠️ 核心注意避坑</span>：两边同除以<strong>负数 -50</strong>，不等号必须<strong>改变方向</strong>！<br>
                        得到：<strong>t &le; 16 小时</strong>。
                    </div>
                </div>
                ${resultBox}
            `;
        }

        // 渲染板书 HUD 内容 (配合 MathJax 渲染更好，这里由于没有 MathJax 库我们用漂亮的 HTML 代数排版)
        stepsChalkboard.innerHTML = html;
    }

    // ==========================================================================
    // 9. 右侧滑块面板动态注入
    // ==========================================================================
    function loadSlidersForScene() {
        let html = "";

        if (currentScene === "elevator-limit") {
            html = `
                <div class="slider-row">
                    <span class="slider-label">装载货箱数量 x (个)：</span>
                    <input type="range" id="slider-box-count" min="0" max="8" step="1" value="${boxCount}">
                    <span class="slider-val-indicator" id="val-box-count">${boxCount} 个</span>
                </div>
                <div style="height:10px;"></div>
                <div class="slider-row">
                    <span class="slider-label">👥 快递员乘梯状态：</span>
                    <label style="display:flex; align-items:center; gap:8px; font-size:13px; font-weight:600; cursor:pointer; margin-top:5px;">
                        <input type="checkbox" id="chk-courier" ${hasCourier ? 'checked' : ''} style="width:16px; height:16px;">
                        快递员进入电梯 (重量: 80 kg)
                    </label>
                </div>
            `;
        } 
        
        else if (currentScene === "tariff-balance") {
            html = `
                <div class="slider-row">
                    <span class="slider-label">每月通话时长 x (分钟)：</span>
                    <input type="range" id="slider-minutes" min="0" max="350" step="5" value="${callMinutes}">
                    <span class="slider-val-indicator" id="val-minutes">${callMinutes} 分钟</span>
                </div>
            `;
        } 
        
        else if (currentScene === "water-tank") {
            html = `
                <div class="slider-row">
                    <span class="slider-label">排水运行时间 t (小时)：</span>
                    <input type="range" id="slider-time" min="0" max="20" step="0.5" value="${timeHours}">
                    <span class="slider-val-indicator" id="val-time">${timeHours.toFixed(1)} 小时</span>
                </div>
            `;
        }

        slidersContainer.innerHTML = html;
        bindSliderEvents();
    }

    // ==========================================================================
    // 10. 绑定滑块及开关事件
    // ==========================================================================
    function bindSliderEvents() {
        // 场景 1 事件
        const sliderBox = document.getElementById("slider-box-count");
        if (sliderBox) {
            sliderBox.addEventListener("input", (e) => {
                boxCount = parseInt(e.target.value);
                document.getElementById("val-box-count").textContent = `${boxCount} 个`;
                render();
            });
        }
        const chkCourier = document.getElementById("chk-courier");
        if (chkCourier) {
            chkCourier.addEventListener("change", (e) => {
                hasCourier = e.target.checked;
                render();
            });
        }

        // 场景 2 事件
        const sliderMins = document.getElementById("slider-minutes");
        if (sliderMins) {
            sliderMins.addEventListener("input", (e) => {
                callMinutes = parseInt(e.target.value);
                document.getElementById("val-minutes").textContent = `${callMinutes} 分钟`;
                render();
            });
        }

        // 场景 3 事件
        const sliderTime = document.getElementById("slider-time");
        if (sliderTime) {
            sliderTime.addEventListener("input", (e) => {
                timeHours = parseFloat(e.target.value);
                document.getElementById("val-time").textContent = `${timeHours.toFixed(1)} 小时`;
                render();
            });
        }
    }

    // ==========================================================================
    // 11. 问题预设与原理看板
    // ==========================================================================
    function updateScenePresetsAndTheory() {
        let presetHtml = "";
        let theoryTitleText = "💡 概念原理解析";
        let theoryBody = "";

        if (currentScene === "elevator-limit") {
            presetHtml = `
                <button class="btn-preset-problem" data-preset="ev-standard">预设：极限临界值 (6 箱)</button>
                <button class="btn-preset-problem" data-preset="ev-overload">预设：超载报警 (7 箱)</button>
            `;
            theoryTitleText = "💡 实际建模中的限重安全";
            theoryBody = `
                <p>在工程限重和乘梯安全中，<strong>“不超过”</strong>对应的代数关系是<strong>小于或等于 (≤)</strong>。</p>
                <p>天平或弹簧秤在超载瞬间会发出警报，表明代数建模中，变量必须始终被限制在最大解集边界内。</p>
            `;
        } else if (currentScene === "tariff-balance") {
            presetHtml = `
                <button class="btn-preset-problem" data-preset="tf-equal">寻找临界平衡点 (200 分钟)</button>
                <button class="btn-preset-problem" data-preset="tf-mins-100">通话较少 100 分钟 (B省钱)</button>
                <button class="btn-preset-problem" data-preset="tf-mins-300">通话较多 300 分钟 (A省钱)</button>
            `;
            theoryTitleText = "💡 套餐资费决策临界";
            theoryBody = `
                <p>两方案在 200 分钟处资费完全相等，此时天平刚好配平，即对应<strong>代数方程</strong> 40 + 0.2x = 0.4x。</p>
                <p>在 200 分钟两侧，价格大小关系改变，代表了两个不等式解集区间的决策。</p>
            `;
        } else if (currentScene === "water-tank") {
            presetHtml = `
                <button class="btn-preset-problem" data-preset="wt-limit">极限安全排水时间 (16 小时)</button>
                <button class="btn-preset-problem" data-preset="wt-danger">严重缺水超限 (18 小时)</button>
            `;
            theoryTitleText = "💡 蓄水防枯安全阀";
            theoryBody = `
                <p>水池蓄水量不少于 200 m³ 对应的代数关系是 <strong>大于或等于 (≥)</strong>。</p>
                <p>求解 -50t ≥ -800 时，两边同除以负数，<strong>不等号必须改变方向</strong>，这是初中阶段最经典也是最容易错的代数陷阱！</p>
            `;
        }

        presetButtonsContainer.innerHTML = presetHtml;
        theoryTitle.innerHTML = theoryTitleText;
        theoryText.innerHTML = theoryBody;

        document.querySelectorAll(".btn-preset-problem").forEach(btn => {
            btn.addEventListener("click", () => {
                applyPreset(btn.getAttribute("data-preset"));
            });
        });
    }

    function applyPreset(presetId) {
        if (presetId === "ev-standard") {
            boxCount = 6;
            hasCourier = true;
        } else if (presetId === "ev-overload") {
            boxCount = 7;
            hasCourier = true;
        } 
        
        else if (presetId === "tf-equal") {
            callMinutes = 200;
        } else if (presetId === "tf-mins-100") {
            callMinutes = 100;
        } else if (presetId === "tf-mins-300") {
            callMinutes = 300;
        } 
        
        else if (presetId === "wt-limit") {
            timeHours = 16.0;
        } else if (presetId === "wt-danger") {
            timeHours = 18.0;
        }

        loadSlidersForScene();
        render();
    }

    // ==========================================================================
    // 12. 页面加载与场景切换
    // ==========================================================================
    function loadScene(sceneId) {
        currentScene = sceneId;

        document.querySelectorAll(".btn-preset").forEach(btn => {
            if (btn.getAttribute("data-scene") === sceneId) btn.classList.add("active");
            else btn.classList.remove("active");
        });

        // 默认数值重置
        if (currentScene === "elevator-limit") {
            boxCount = 3;
            hasCourier = true;
        } else if (currentScene === "tariff-balance") {
            callMinutes = 120;
        } else if (currentScene === "water-tank") {
            timeHours = 4.0;
        }

        loadSlidersForScene();
        updateScenePresetsAndTheory();
        render();
    }

    document.querySelectorAll(".btn-preset").forEach(btn => {
        btn.addEventListener("click", () => {
            loadScene(btn.getAttribute("data-scene"));
        });
    });

    hudToggleBtn.addEventListener("click", () => {
        isHudExpanded = !isHudExpanded;
        if (isHudExpanded) {
            hudPanel.classList.remove("collapsed");
        } else {
            hudPanel.classList.add("collapsed");
        }
        render();
    });

    btnResetState.addEventListener("click", () => {
        loadScene(currentScene);
    });

    // 缩放控制
    document.getElementById("btn-zoom-in").addEventListener("click", () => {
        zoomScale = Math.min(zoomScale * 1.15, 3.0);
        updateTransform();
    });
    document.getElementById("btn-zoom-out").addEventListener("click", () => {
        zoomScale = Math.max(zoomScale / 1.15, 0.45);
        updateTransform();
    });
    document.getElementById("btn-zoom-reset").addEventListener("click", () => {
        zoomScale = 1.0;
        updateTransform();
        render();
    });

    function updateTransform() {
        sandboxSvg.style.transform = `scale(${zoomScale})`;
        htmlOverlay.style.transform = `scale(${zoomScale})`;
    }

    btnShowHelp.addEventListener("click", () => modalHelp.classList.add("active"));
    btnCloseHelp.addEventListener("click", () => modalHelp.classList.remove("active"));
    modalHelp.addEventListener("click", (e) => {
        if (e.target === modalHelp) modalHelp.classList.remove("active");
    });

    // 全局暴露接口
    window.appState = {
        get currentScene() { return currentScene; },
        loadScene,
        applyPreset,
        render
    };

    function render() {
        renderSVG();
        renderHTMLOverlay();
    }

    // 初始化运行
    loadScene("elevator-limit");
    requestAnimationFrame(updateFrame);

    window.addEventListener("resize", () => {
        render();
    });
});
