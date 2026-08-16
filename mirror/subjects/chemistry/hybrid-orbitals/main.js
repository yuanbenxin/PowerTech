import * as THREE from './assets/vendor/three/three.module.min.js';
import { OrbitControls } from './assets/vendor/three/OrbitControls.js';

(function initializeHybridOrbitalsModule() {
    const App = window.ChemistryLab = window.ChemistryLab || {};
    const CANVAS_FONT_STACK = '"Noto Sans SC Local", "Microsoft YaHei", "PingFang SC", "Segoe UI", sans-serif';

    function getHybridRoot(container) {
        if (container && container.nodeType === 1) {
            if (container.classList && container.classList.contains('hybrid-orbitals-shell')) {
                return container;
            }

            if (typeof container.querySelector === 'function') {
                return container.querySelector('.hybrid-orbitals-shell') || container;
            }
        }

        return document.querySelector('.hybrid-orbitals-shell[data-hybrid-root="true"]')
            || document.querySelector('.hybrid-orbitals-shell[data-hybrid-auto-mount="true"]')
            || document.querySelector('.hybrid-orbitals-shell');
    }

    function disposeMaterial(material) {
        if (!material) return;

        const materials = Array.isArray(material) ? material : [material];
        materials.forEach((entry) => {
            if (!entry) return;
            if (entry.map) entry.map.dispose?.();
            if (entry.alphaMap) entry.alphaMap.dispose?.();
            if (entry.emissiveMap) entry.emissiveMap.dispose?.();
            if (entry.normalMap) entry.normalMap.dispose?.();
            if (entry.roughnessMap) entry.roughnessMap.dispose?.();
            if (entry.metalnessMap) entry.metalnessMap.dispose?.();
            entry.dispose?.();
        });
    }

    function disposeObject(node) {
        if (!node) return;

        node.traverse?.((child) => {
            if (child.geometry) {
                child.geometry.dispose?.();
            }

            if (child.material) {
                disposeMaterial(child.material);
            }
        });
    }

    function createHybridOrbitalsApp(rootElement, options = {}) {
        const root = rootElement;
        const qs = (selector) => root.querySelector(selector);
        const qsa = (selector) => Array.from(root.querySelectorAll(selector));
        const listeners = [];
        const pointDensityScale = options.performanceTier === 'low'
            ? 0.42
            : options.performanceTier === 'medium'
                ? 0.68
                : 1;

        const ui = {
            canvasContainer: qs('#canvas-container'),
            sidebar: qs('.sidebar'),
            mainArea: qs('.main-area'),
            mainActionToolbarWrapper: qs('.main-action-toolbar-wrapper'),
            modeButtons: qsa('.menu-btn'),
            infoPanel: qs('#infoPanel'),
            stepTitle: qs('#step-title'),
            stepDesc: qs('#step-desc'),
            stepOverlay: qs('#step-overlay'),
            energyPanel: qs('#energyPanel'),
            energyView: qs('#energyView'),
            quickFactsView: qs('#quickFactsView'),
            auxiliaryPanelTitle: qs('#auxiliaryPanelTitle'),
            panelSwitchButtons: qsa('.panel-switch-btn'),
            hudCollapseBtn: qs('#hudCollapseBtn'),
            hudCollapseLabel: qs('#hudCollapseLabel'),
            hybridLabel: qs('#hybrid-label'),
            quantumToggle: qs('#quantumToggle'),
            autoRotate: qs('#autoRotate'),
            nextStepBtn: qs('#nextStepBtn'),
            playBtn: qs('#playBtn'),
            answerToggleBtn: qs('#answerToggleBtn'),
            exampleChips: qs('#exampleChips'),
            advancedControls: qs('#advancedControls'),
            lpControlWrapper: qs('#lpControlWrapper'),
            piControlWrapper: qs('#piControlWrapper'),
            lonePairRange: qs('#lonePairRange'),
            lpValueText: qs('#lpValueText'),
            showPiBtn: qs('#showPiBtn'),
            advancedHint: qs('#advancedHint'),
        };

        const addListener = (target, type, handler, optionsForListener) => {
            if (!target) return;
            target.addEventListener(type, handler, optionsForListener);
            listeners.push(() => target.removeEventListener(type, handler, optionsForListener));
        };

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a24);
        scene.fog = new THREE.FogExp2(0x1a1a24, 0.012);

        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        camera.position.set(8, 5, 20);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true,
        });
        renderer.setPixelRatio(window.devicePixelRatio || 1);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        ui.canvasContainer.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enablePan = false;
        controls.autoRotate = false;
        controls.autoRotateSpeed = 1.0;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
        dirLight.position.set(5, 10, 7);
        dirLight2.position.set(-5, 0, -5);
        scene.add(ambientLight, dirLight, dirLight2);

        const atomicGroup = new THREE.Group();
        const hybridGroup = new THREE.Group();
        const unhybridizedGroup = new THREE.Group();
        const bondingGroup = new THREE.Group();
        const stickGroup = new THREE.Group();
        const angleGroup = new THREE.Group();
        const piGroup = new THREE.Group();
        const lonePairGroup = new THREE.Group();
        scene.add(atomicGroup, hybridGroup, unhybridizedGroup, bondingGroup, stickGroup, angleGroup, piGroup, lonePairGroup);

        let rafId = 0;
        let layoutSyncFrame = 0;
        let destroyed = false;
        let paused = false;
        let isAnimating = false;
        let currentType = 'sp3';
        let currentStep = 0;
        let currentIngredients = [];
        let currentHybrids = [];
        let currentUnhybridized = [];
        let currentBonds = [];
        let currentSticks = [];
        let masterCoreRef = null;
        let piFocusActive = false;
        let currentPanelView = 'quick';
        let answersVisible = true;
        let currentSp3LonePairValue = 0;
        let hudCollapsed = false;
        const selectedCaseByType = {
            s: 'h_1s',
            p: 'cl_3p',
            sp: 'co2',
            sp2: 'c2h4',
            sp3: 'ch4',
            sp3d: 'pcl5',
            sp3d2: 'sf6',
        };

        const teachingCatalog = {
            s: {
                title: 's 轨道基础',
                overview: '先认识球形 s 轨道，再理解它怎样与 p 轨道一起参与杂化。',
                tags: ['基础概念', '球形', '中心对称'],
                examples: [
                    {
                        key: 'h_1s',
                        chipLabel: 'H 1s',
                        molecule: 'H 原子',
                        summary: '氢原子的 1s 轨道呈球形，是最基础的原子轨道模型。',
                        centerAtom: '1s',
                        centerColor: 0xe74c3c,
                        hybrid: '未杂化',
                        electronGeometry: '球形电子云',
                        molecularGeometry: '原子轨道观察',
                        angle: '—',
                        lonePairs: '—',
                        sigmaPi: '尚未成键',
                        quickRule: 's 轨道呈球对称，是许多杂化轨道的组成部分。',
                        pitfall: 's 轨道本身不是 sp、sp²、sp³ 这类“杂化类型”。',
                        prompt: '先说出 s 轨道最明显的形状特征。'
                    },
                    {
                        key: 'he_1s',
                        chipLabel: 'He 1s',
                        molecule: 'He 原子',
                        summary: '氦原子的价层也由 1s 轨道主导，适合观察球对称电子云。',
                        centerAtom: '1s',
                        centerColor: 0xf39c12,
                        hybrid: '未杂化',
                        electronGeometry: '球形电子云',
                        molecularGeometry: '原子轨道观察',
                        angle: '—',
                        lonePairs: '—',
                        sigmaPi: '稳定满壳层',
                        quickRule: '看见球形电子云时，先想到 s 轨道的中心对称性。',
                        pitfall: '原子轨道形状展示不等于分子空间构型判断。',
                        prompt: '先比较 H 1s 和 He 1s 的共同点。'
                    },
                ],
            },
            p: {
                title: 'p 轨道基础',
                overview: 'p 轨道呈哑铃形，后续的 π 键就来自未杂化 p 轨道的侧向重叠。',
                tags: ['基础概念', '哑铃形', '侧向重叠'],
                examples: [
                    {
                        key: 'cl_3p',
                        chipLabel: 'Cl 3p',
                        molecule: 'Cl 原子价层',
                        summary: '氯原子的价层 p 轨道有明确方向性，是形成共价键的重要基础。',
                        centerAtom: '3p',
                        centerColor: 0x3498db,
                        hybrid: '未杂化',
                        electronGeometry: '哑铃形电子云',
                        molecularGeometry: '原子轨道观察',
                        angle: '—',
                        lonePairs: '—',
                        sigmaPi: '可参与成键',
                        quickRule: 'p 轨道有方向性，侧向重叠可形成 π 键。',
                        pitfall: '“有 p 轨道”不等于“就是 p 轨道分子构型”，要看是否发生杂化。',
                        prompt: '先判断 p 轨道与 s 轨道在形状上有何不同。'
                    },
                    {
                        key: 'o_2p',
                        chipLabel: 'O 2p',
                        molecule: 'O 原子价层',
                        summary: '氧原子的 2p 轨道常参与形成 π 键，适合和双键体系联系起来。',
                        centerAtom: '2p',
                        centerColor: 0x1abc9c,
                        hybrid: '未杂化',
                        electronGeometry: '哑铃形电子云',
                        molecularGeometry: '原子轨道观察',
                        angle: '—',
                        lonePairs: '—',
                        sigmaPi: '可参与 π 键',
                        quickRule: '双键和三键中的 π 键，本质上都离不开未杂化 p 轨道。',
                        pitfall: '先看中心原子电子域数，再判断是否保留未杂化 p 轨道。',
                        prompt: '先思考：为什么 p 轨道更容易形成 π 键？'
                    },
                ],
            },
            sp: {
                title: 'sp 杂化',
                overview: '中心原子周围有 2 个电子域时，常判为 sp 杂化，空间构型是直线形。',
                tags: ['直线形', '180°', '常见于双/三键中心原子'],
                examples: [
                    {
                        key: 'co2',
                        chipLabel: 'CO₂',
                        molecule: 'CO₂',
                        summary: '二氧化碳中中心 C 采用 sp 杂化，整体为直线形。',
                        centerAtom: 'C',
                        centerColor: 0x333333,
                        bondLabels: ['O', 'O'],
                        hybrid: 'sp',
                        electronGeometry: '直线形',
                        molecularGeometry: '直线形',
                        angle: '180°',
                        lonePairs: '0 对',
                        sigmaPi: '2 个 σ 键 + 2 个 π 键',
                        quickRule: '中心原子电子域数为 2，优先判断为 sp。',
                        pitfall: 'CO₂ 虽然有两个双键，但中心 C 仍是 sp，不是 sp²。',
                        prompt: '先判断 CO₂ 的中心原子周围有几个电子域。',
                        piAllowed: true,
                        piButtonLabel: '🌉 显示 π 键形成（C=O 侧向重叠）',
                        piLoadingLabel: '💫 正在显示 C=O 的 π 键形成...',
                        piDoneLabel: '✅ 已显示 CO₂ 中的 π 键电子云',
                        advancedHint: '本例中两个 C=O 双键都由 1 个 σ 键和 1 个 π 键组成。'
                    },
                    {
                        key: 'c2h2',
                        chipLabel: 'C₂H₂',
                        molecule: 'C₂H₂',
                        summary: '乙炔中每个碳原子都是 sp 杂化，呈直线形，并保留两组未杂化 p 轨道。',
                        centerAtom: 'C',
                        centerColor: 0x333333,
                        bondLabels: ['C', 'H'],
                        hybrid: 'sp',
                        electronGeometry: '直线形',
                        molecularGeometry: '直线形',
                        angle: '180°',
                        lonePairs: '0 对',
                        sigmaPi: '3 个 σ 键 + 2 个 π 键（整分子）',
                        quickRule: '含碳碳三键的碳原子，通常判为 sp 杂化。',
                        pitfall: '三键不是“3 个 σ 键”，而是 1 个 σ 键 + 2 个 π 键。',
                        prompt: '先说出乙炔中三键由哪几类共价键组成。',
                        piAllowed: true,
                        piButtonLabel: '🌉 显示 π 键形成（C≡C 双重侧向重叠）',
                        piLoadingLabel: '💫 正在显示 C≡C 的 π 键形成...',
                        piDoneLabel: '✅ 已显示 C₂H₂ 中的两个 π 键电子云',
                        advancedHint: '乙炔中的三键由 1 个 σ 键和 2 个彼此垂直的 π 键组成。'
                    },
                ],
            },
            sp2: {
                title: 'sp² 杂化',
                overview: '中心原子周围有 3 个电子域时，常判为 sp² 杂化，空间构型多为平面三角形。',
                tags: ['平面三角形', '120°', '常见于双键体系'],
                examples: [
                    {
                        key: 'c2h4',
                        chipLabel: 'C₂H₄',
                        molecule: 'C₂H₄',
                        summary: '乙烯中每个碳原子采用 sp² 杂化，并保留 1 根未杂化 p 轨道形成 π 键。',
                        centerAtom: 'C',
                        centerColor: 0x333333,
                        bondLabels: ['C', 'H', 'H'],
                        hybrid: 'sp²',
                        electronGeometry: '平面三角形',
                        molecularGeometry: '平面三角形',
                        angle: '120°',
                        lonePairs: '0 对',
                        sigmaPi: '5 个 σ 键 + 1 个 π 键（整分子）',
                        quickRule: '含双键的碳原子，常见为 sp² 杂化。',
                        pitfall: '双键不是 2 个 σ 键，而是 1 个 σ 键 + 1 个 π 键。',
                        prompt: '先判断乙烯中每个碳原子周围有几个电子域。',
                        piAllowed: true,
                        piButtonLabel: '🌉 显示 π 键形成（C=C 侧向重叠）',
                        piLoadingLabel: '💫 正在显示 C=C 的 π 键形成...',
                        piDoneLabel: '✅ 已显示 C₂H₄ 中的 π 键电子云',
                        advancedHint: '乙烯的 C=C 双键由 1 个 σ 键和 1 个 π 键组成。'
                    },
                    {
                        key: 'bf3',
                        chipLabel: 'BF₃',
                        molecule: 'BF₃',
                        summary: '三氟化硼中中心 B 采用 sp² 杂化，分子是标准平面三角形。',
                        centerAtom: 'B',
                        centerColor: 0xf39c12,
                        bondLabels: ['F', 'F', 'F'],
                        hybrid: 'sp²',
                        electronGeometry: '平面三角形',
                        molecularGeometry: '平面三角形',
                        angle: '120°',
                        lonePairs: '0 对',
                        sigmaPi: '3 个 σ 键，0 个 π 键',
                        quickRule: '中心原子 3 个电子域且无孤对电子时，常见平面三角形。',
                        pitfall: 'sp² 不一定都带 π 键，关键要看是否保留未杂化 p 轨道参与成键。',
                        prompt: '先判断 BF₃ 中心原子的电子域数和空间构型。',
                        piAllowed: false,
                        advancedHint: 'BF₃ 只有 3 个 σ 键，没有 π 键，是判断平面三角形的经典例子。'
                    },
                ],
            },
            sp3: {
                title: 'sp³ 杂化',
                overview: '中心原子周围有 4 个电子域时，常判为 sp³ 杂化；再根据孤对电子数判断分子构型。',
                tags: ['四面体骨架', '109.5°', '孤对电子会压缩键角'],
                examples: [
                    {
                        key: 'ch4',
                        chipLabel: 'CH₄',
                        molecule: 'CH₄',
                        summary: '甲烷中 C 采用 sp³ 杂化，4 个杂化轨道都形成 σ 键，呈正四面体。',
                        centerAtom: 'C',
                        centerColor: 0x333333,
                        bondLabels: ['H', 'H', 'H', 'H'],
                        hybrid: 'sp³',
                        electronGeometry: '正四面体',
                        molecularGeometry: '正四面体',
                        angle: '109.5°',
                        lonePairs: '0 对',
                        sigmaPi: '4 个 σ 键，0 个 π 键',
                        quickRule: '4 个电子域、0 对孤对电子时，分子构型通常是正四面体。',
                        pitfall: 'sp³ 只说明杂化类型，不一定就一定是正四面体分子构型。',
                        prompt: '先判断 CH₄ 的电子域数和分子构型。',
                        lonePairValue: 0,
                        advancedHint: '拖动滑杆比较 CH₄、NH₃、H₂O：孤对电子越多，键角越小。'
                    },
                    {
                        key: 'nh3',
                        chipLabel: 'NH₃',
                        molecule: 'NH₃',
                        summary: '氨气中 N 采用 sp³ 杂化，但因有 1 对孤对电子，分子构型变为三角锥形。',
                        centerAtom: 'N',
                        centerColor: 0x3498db,
                        bondLabels: ['H', 'H', 'H'],
                        hybrid: 'sp³',
                        electronGeometry: '正四面体',
                        molecularGeometry: '三角锥形',
                        angle: '107°',
                        lonePairs: '1 对',
                        sigmaPi: '3 个 σ 键，0 个 π 键',
                        quickRule: '4 个电子域、1 对孤对电子时，常见三角锥形。',
                        pitfall: 'NH₃ 是 sp³，但分子构型不是正四面体，而是三角锥形。',
                        prompt: '先思考：NH₃ 为什么和 CH₄ 杂化相同、构型却不同？',
                        lonePairValue: 1,
                        advancedHint: '完成第 5 步后可观察到：1 对孤对电子会把键角从 109.5° 压缩到约 107°。'
                    },
                    {
                        key: 'h2o',
                        chipLabel: 'H₂O',
                        molecule: 'H₂O',
                        summary: '水分子中 O 采用 sp³ 杂化，但有 2 对孤对电子，分子构型为 V 形。',
                        centerAtom: 'O',
                        centerColor: 0xe74c3c,
                        bondLabels: ['H', 'H'],
                        hybrid: 'sp³',
                        electronGeometry: '正四面体',
                        molecularGeometry: 'V 形',
                        angle: '104.5°',
                        lonePairs: '2 对',
                        sigmaPi: '2 个 σ 键，0 个 π 键',
                        quickRule: '4 个电子域、2 对孤对电子时，常见 V 形，键角继续减小。',
                        pitfall: 'H₂O 与 NH₃ 都是 sp³，但水分子不是三角锥形，而是 V 形。',
                        prompt: '先判断：孤对电子继续增加时，键角会如何变化？',
                        lonePairValue: 2,
                        advancedHint: '完成第 5 步后可观察到：2 对孤对电子会使键角进一步减小到约 104.5°。'
                    },
                ],
            },
            sp3d: {
                title: 'sp³d 杂化',
                overview: '这是高中拓展内容，可用来认识三角双锥与超价分子。',
                tags: ['拓展内容', '三角双锥', '五配位'],
                examples: [
                    {
                        key: 'pcl5',
                        chipLabel: 'PCl₅',
                        molecule: 'PCl₅',
                        summary: '五氯化磷常作为 sp³d 杂化的典型示例，空间构型为三角双锥。',
                        centerAtom: 'P',
                        centerColor: 0xffb347,
                        bondLabels: ['Cl', 'Cl', 'Cl', 'Cl', 'Cl'],
                        hybrid: 'sp³d',
                        electronGeometry: '三角双锥',
                        molecularGeometry: '三角双锥',
                        angle: '90° / 120°',
                        lonePairs: '0 对',
                        sigmaPi: '5 个 σ 键，0 个 π 键',
                        quickRule: '5 个电子域、0 对孤对电子时，可拓展了解三角双锥。',
                        pitfall: '这一部分属于高中拓展，课堂上优先掌握 sp、sp²、sp³。',
                        prompt: '先记住三角双锥同时存在 90° 和 120° 两种典型夹角。',
                        advancedHint: '拓展观察：赤道位置夹角 120°，轴向与赤道位置夹角 90°。'
                    },
                ],
            },
            sp3d2: {
                title: 'sp³d² 杂化',
                overview: '这是高中拓展内容，可用来认识正八面体配位结构。',
                tags: ['拓展内容', '正八面体', '六配位'],
                examples: [
                    {
                        key: 'sf6',
                        chipLabel: 'SF₆',
                        molecule: 'SF₆',
                        summary: '六氟化硫常作为 sp³d² 杂化的典型示例，空间构型为正八面体。',
                        centerAtom: 'S',
                        centerColor: 0xf1c40f,
                        bondLabels: ['F', 'F', 'F', 'F', 'F', 'F'],
                        hybrid: 'sp³d²',
                        electronGeometry: '正八面体',
                        molecularGeometry: '正八面体',
                        angle: '90°',
                        lonePairs: '0 对',
                        sigmaPi: '6 个 σ 键，0 个 π 键',
                        quickRule: '6 个电子域、0 对孤对电子时，可拓展了解正八面体。',
                        pitfall: '正八面体和正四面体不要混淆，典型键角分别是 90° 与 109.5°。',
                        prompt: '先记住正八面体最常考的角度特征是 90°。',
                        advancedHint: '拓展观察：正八面体六个键位完全等价，最常见夹角是 90°。'
                    },
                ],
            },
        };

        const COLORS = {
            s: 0xe74c3c,
            p: 0x3498db,
            hybrid: 0x2ecc71,
            tail: 0x95a5a6,
            bond: 0xffffff,
        };
        const fitScratchBox = new THREE.Box3();
        const fitScratchSize = new THREE.Vector3();

        function getCanvasSize() {
            const containerRect = ui.canvasContainer.getBoundingClientRect();
            const mainRect = ui.mainArea.getBoundingClientRect();
            const sidebarRect = ui.sidebar.getBoundingClientRect();
            const rootRect = root.getBoundingClientRect();

            const resolvedWidth = containerRect.width
                || mainRect.width
                || ((rootRect.width || 0) - (sidebarRect.width || 0));
            const resolvedHeight = containerRect.height
                || mainRect.height
                || rootRect.height;
            const width = Math.max(1, Math.round(resolvedWidth || 1));
            const height = Math.max(1, Math.round(resolvedHeight || 1));
            return { width, height };
        }

        function getViewportMetrics() {
            const { width, height } = getCanvasSize();
            return {
                width,
                height,
                aspect: width / height,
            };
        }

        function updateResponsiveLayout() {
            const { width, height, aspect } = getViewportMetrics();
            let viewportMode = 'wide';
            const isLandscape = width >= height;

            if (isLandscape && (width < 1080 || height < 620 || aspect < 1.55)) {
                viewportMode = 'ultra';
            } else if (width < 1180 || height < 700) {
                viewportMode = 'dense';
            } else if (width < 1420 || height < 820 || aspect < 1.45) {
                viewportMode = 'narrow';
            } else if (width < 1660 || height < 920 || aspect < 1.68) {
                viewportMode = 'compact';
            }

            root.dataset.viewportMode = viewportMode;
        }

        function syncFloatingToolbarLayout() {
            const toolbarWrapper = ui.mainActionToolbarWrapper;
            if (!toolbarWrapper) {
                return;
            }

            const rootRect = root.getBoundingClientRect();
            const wrapperRect = toolbarWrapper.getBoundingClientRect();
            const toolbarBottom = Math.max(0, rootRect.bottom - wrapperRect.bottom);
            const toolbarHeight = Math.max(0, wrapperRect.height);

            root.style.setProperty('--action-toolbar-bottom', `${Math.round(toolbarBottom)}px`);
            root.style.setProperty('--action-toolbar-height', `${Math.round(toolbarHeight)}px`);
        }

        function scheduleFloatingToolbarLayoutSync() {
            if (destroyed) {
                return;
            }

            if (layoutSyncFrame) {
                window.cancelAnimationFrame(layoutSyncFrame);
            }

            layoutSyncFrame = window.requestAnimationFrame(() => {
                layoutSyncFrame = 0;
                syncFloatingToolbarLayout();
            });
        }

        function isHybridType(type = currentType) {
            return typeof type === 'string' && type.includes('sp');
        }

        function getTypeCatalog(type = currentType) {
            return teachingCatalog[type] || null;
        }

        function getExampleList(type = currentType) {
            return getTypeCatalog(type)?.examples || [];
        }

        function getTeachingCaseByKey(type = currentType, key = '') {
            return getExampleList(type).find((item) => item.key === key) || null;
        }

        function getSelectedCaseKey(type = currentType) {
            const examples = getExampleList(type);
            if (!examples.length) {
                return '';
            }

            const selected = selectedCaseByType[type];
            return examples.some((item) => item.key === selected) ? selected : examples[0].key;
        }

        function getCurrentCase(type = currentType) {
            return getTeachingCaseByKey(type, getSelectedCaseKey(type)) || getExampleList(type)[0] || null;
        }

        function getSceneCase() {
            if (currentType === 'sp3' && currentStep < 5) {
                return getTeachingCaseByKey('sp3', 'ch4') || getCurrentCase('sp3');
            }

            return getCurrentCase();
        }

        function getSp3CaseByLonePairValue(value) {
            return getExampleList('sp3').find((item) => item.lonePairValue === value) || null;
        }

        function renderHudState() {
            const energyAvailable = isHybridType();
            const resolvedView = currentPanelView === 'energy' && energyAvailable ? 'energy' : 'quick';

            ui.energyPanel.dataset.collapsed = hudCollapsed ? 'true' : 'false';
            ui.auxiliaryPanelTitle.textContent = hudCollapsed
                ? '\u6559\u5b66\u8f85\u52a9'
                : resolvedView === 'quick'
                    ? '\u6559\u5b66\u8f85\u52a9 \u00b7 \u9ad8\u8003\u901f\u8bb0'
                    : '\u6559\u5b66\u8f85\u52a9 \u00b7 \u80fd\u7ea7\u56fe';

            if (!ui.hudCollapseBtn) {
                return;
            }

            const buttonLabel = hudCollapsed ? '\u5c55\u5f00' : '\u6536\u8d77';
            const buttonAction = hudCollapsed
                ? '\u5c55\u5f00\u6559\u5b66\u8f85\u52a9\u9762\u677f'
                : '\u6536\u8d77\u6559\u5b66\u8f85\u52a9\u9762\u677f';

            if (ui.hudCollapseLabel) {
                ui.hudCollapseLabel.textContent = buttonLabel;
            }

            ui.hudCollapseBtn.setAttribute('aria-expanded', String(!hudCollapsed));
            ui.hudCollapseBtn.setAttribute('aria-label', buttonAction);
            ui.hudCollapseBtn.title = buttonAction;
        }

        function setPanelView(nextView) {
            const energyAvailable = isHybridType();
            if (nextView === 'energy' && !energyAvailable) {
                currentPanelView = 'quick';
            } else {
                currentPanelView = nextView === 'energy' ? 'energy' : 'quick';
            }

            ui.panelSwitchButtons.forEach((button) => {
                const panelView = button.getAttribute('data-panel-view');
                const isEnergyButton = panelView === 'energy';
                button.disabled = isEnergyButton && !energyAvailable;
                button.classList.toggle('active', panelView === currentPanelView);
            });

            const quickVisible = currentPanelView === 'quick' || !energyAvailable;
            ui.energyView.classList.toggle('panel-view-active', currentPanelView === 'energy' && energyAvailable);
            ui.quickFactsView.classList.toggle('panel-view-active', quickVisible);
            renderHudState();
        }

        function getAnswerValue(value) {
            return answersVisible ? value : '请先判断';
        }

        function renderAnswerToggle() {
            if (!ui.answerToggleBtn) {
                return;
            }

            ui.answerToggleBtn.textContent = answersVisible ? '答案：已显示' : '答案：点击显示';
            ui.answerToggleBtn.classList.toggle('active', answersVisible);
        }

        function renderExampleChips() {
            const examples = getExampleList();
            const selectedKey = getSelectedCaseKey();
            ui.exampleChips.innerHTML = examples.map((item) => `
                <button
                    type="button"
                    class="example-chip${item.key === selectedKey ? ' active' : ''}"
                    data-example-key="${item.key}"
                >
                    ${item.chipLabel || item.molecule}
                </button>
            `).join('');
        }

        function renderInfoPanel() {
            const catalog = getTypeCatalog();
            const caseData = getCurrentCase();
            if (!catalog || !caseData) {
                ui.infoPanel.innerHTML = '';
                return;
            }

            const infoRows = [
                { label: '观察案例', value: caseData.molecule },
                { label: currentType === 's' || currentType === 'p' ? '轨道类型' : '杂化类型', value: caseData.hybrid },
                { label: '电子对构型', value: caseData.electronGeometry },
                { label: currentType === 's' || currentType === 'p' ? '观察结论' : '分子构型', value: caseData.molecularGeometry },
                { label: '典型键角', value: caseData.angle },
                { label: '孤对电子', value: caseData.lonePairs },
                { label: '成键特点', value: caseData.sigmaPi },
            ];

            ui.infoPanel.innerHTML = `
                <div class="info-title">${catalog.title} · ${caseData.molecule}</div>
                <div class="info-content">${answersVisible ? caseData.summary : caseData.prompt}</div>
                <div class="info-tags">${catalog.tags.map((tag) => `<span class="tag">${tag}</span>`).join('')}</div>
                <div class="info-grid">
                    ${infoRows.map((item) => `
                        <div class="info-row">
                            <span class="info-label">${item.label}</span>
                            <span class="info-value">${getAnswerValue(item.value)}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="exam-tips">
                    <div class="exam-title">课堂速记</div>
                    <div class="exam-desc">${answersVisible ? caseData.quickRule : caseData.prompt}</div>
                </div>
                <div class="exam-tips exam-tips-danger">
                    <div class="exam-title">易错提醒</div>
                    <div class="exam-desc">${answersVisible ? caseData.pitfall : '先自己判断后，再点击“答案：点击显示”对照纠错。'}</div>
                </div>
            `;
            ui.infoPanel.style.opacity = '1';
        }

        function renderQuickFacts() {
            const caseData = getCurrentCase();
            const catalog = getTypeCatalog();
            if (!caseData || !catalog) {
                ui.quickFactsView.innerHTML = '';
                return;
            }

            if (!answersVisible) {
                ui.quickFactsView.innerHTML = `
                    <div class="quick-card">
                        <div class="quick-title">先思考：${caseData.molecule}</div>
                        <div class="quick-line">1. 中心原子周围有几个电子域？</div>
                        <div class="quick-line">2. 有没有孤对电子？</div>
                        <div class="quick-line">3. 你会判成哪种杂化与空间构型？</div>
                        <div class="quick-line">4. 这一题里有没有 π 键？</div>
                    </div>
                `;
                return;
            }

            ui.quickFactsView.innerHTML = `
                <div class="quick-card">
                    <div class="quick-title">当前案例：${caseData.molecule}</div>
                    <div class="quick-line"><strong>判定口诀：</strong>${caseData.quickRule}</div>
                    <div class="quick-line"><strong>课本结论：</strong>${caseData.summary}</div>
                    <div class="quick-line"><strong>高频易错：</strong>${caseData.pitfall}</div>
                    <div class="quick-line"><strong>适用范围：</strong>${catalog.overview}</div>
                </div>
            `;
        }

        function updateAdvancedHint() {
            const catalog = getTypeCatalog();
            const caseData = getCurrentCase();
            if (!ui.advancedHint || !caseData) {
                return;
            }

            const fallback = currentType === 'sp3'
                ? '拖动滑杆比较不同孤对电子数对键角的影响。'
                : currentType === 'sp' || currentType === 'sp2'
                    ? '观察 σ 键与 π 键的形成方式差异。'
                    : catalog?.overview || '';

            ui.advancedHint.textContent = caseData.advancedHint || fallback;
        }

        function updatePiButtonCopy() {
            const caseData = getCurrentCase();
            if (!ui.showPiBtn || !caseData) {
                return;
            }

            ui.showPiBtn.textContent = caseData.piDoneLabel && piFocusActive
                ? caseData.piDoneLabel
                : caseData.piButtonLabel || '🌉 显示 π 键形成（侧向重叠）';
        }

        function clearPiFocusState() {
            piFocusActive = false;
            clearGroup(piGroup);
            const baseOpacity = currentStep >= 5 ? 0.05 : 0.25;
            currentUnhybridized.forEach((item) => {
                item.mesh.children.forEach((lobe) => {
                    if (lobe.userData?.solid) {
                        lobe.userData.solid.material.opacity = baseOpacity;
                    }
                });
            });
        }

        function syncAdvancedControlVisibility() {
            const caseData = getCurrentCase();
            const shouldShowAdvanced = currentStep >= 5 && currentType !== 's' && currentType !== 'p';

            ui.advancedControls.style.display = shouldShowAdvanced ? 'block' : 'none';
            if (!shouldShowAdvanced) {
                return;
            }

            if (currentType === 'sp3') {
                ui.lpControlWrapper.style.display = 'block';
                ui.piControlWrapper.style.display = 'none';
                return;
            }

            if (currentType === 'sp' || currentType === 'sp2') {
                ui.lpControlWrapper.style.display = 'none';
                ui.piControlWrapper.style.display = caseData?.piAllowed === false ? 'none' : 'block';
                return;
            }

            ui.lpControlWrapper.style.display = 'none';
            ui.piControlWrapper.style.display = 'none';
        }

        function getVisibleBondIndicesForCurrentCase() {
            if (currentType !== 'sp3' || currentStep < 5) {
                return currentBonds.map((_, index) => index);
            }

            if (currentSp3LonePairValue === 1) {
                return [1, 2, 3];
            }

            if (currentSp3LonePairValue === 2) {
                return [2, 3];
            }

            return [0, 1, 2, 3];
        }

        function applyCurrentCaseLabels() {
            const caseData = getSceneCase();
            if (!caseData || !masterCoreRef || !masterCoreRef.children?.length) {
                return;
            }

            const rootAtom = masterCoreRef.children[0];
            if (rootAtom?.material?.color && typeof caseData.centerColor === 'number') {
                rootAtom.material.color.setHex(caseData.centerColor);
            }
            attachText(rootAtom, caseData.centerAtom || '', '#ffffff');

            if (!currentBonds.length) {
                return;
            }

            currentBonds.forEach((bond) => attachText(bond, '', '#000000'));
            const visibleBondIndices = getVisibleBondIndicesForCurrentCase();
            const labels = caseData.bondLabels || [];
            visibleBondIndices.forEach((bondIndex, labelIndex) => {
                const bond = currentBonds[bondIndex];
                if (!bond) {
                    return;
                }

                attachText(bond, labels[labelIndex] || '', '#000000');
            });
        }

        function refreshTeachingUi() {
            const caseData = getCurrentCase();
            renderAnswerToggle();
            renderExampleChips();
            renderInfoPanel();
            renderQuickFacts();
            setPanelView(currentPanelView);
            if (currentType === 'sp3' && caseData && typeof caseData.lonePairValue === 'number') {
                ui.lonePairRange.value = String(caseData.lonePairValue);
                ui.lpValueText.textContent = `${caseData.molecule}：${caseData.lonePairs}孤对电子，${caseData.angle}`;
            }
            syncAdvancedControlVisibility();
            updateAdvancedHint();
            updatePiButtonCopy();
            applyCurrentCaseLabels();
            scheduleFloatingToolbarLayoutSync();
        }

        async function selectTeachingCase(caseKey) {
            const caseData = getTeachingCaseByKey(currentType, caseKey);
            if (!caseData) {
                return;
            }

            selectedCaseByType[currentType] = caseData.key;
            clearPiFocusState();

            if (currentType === 'sp3' && typeof caseData.lonePairValue === 'number') {
                currentSp3LonePairValue = caseData.lonePairValue;
                ui.lonePairRange.value = String(caseData.lonePairValue);
                ui.lpValueText.textContent = `${caseData.molecule}：${caseData.lonePairs}孤对电子，${caseData.angle}`;

                if (currentStep === 5) {
                    await setSp3LonePairState(caseData.lonePairValue, { syncCaseSelection: false });
                    return;
                }
            }

            refreshTeachingUi();
        }

        function getBaseCameraPreset(type = currentType, step = currentStep, piFocused = piFocusActive) {
            if (type === 's' || type === 'p') {
                return new THREE.Vector3(0, 2.8, 10.8);
            }

            if (piFocused) {
                return new THREE.Vector3(0, 1.6, 17.5);
            }

            if (step >= 3) {
                return new THREE.Vector3(0, 3.2, 13.8);
            }

            if (step >= 1) {
                return new THREE.Vector3(0, 3.0, 16.8);
            }

            return type.includes('d')
                ? new THREE.Vector3(0, 3.4, 33)
                : new THREE.Vector3(0, 3.0, 24);
        }

        function getAdaptedCameraPosition(basePosition) {
            const { aspect, height } = getViewportMetrics();
            let distanceFactor = 1;
            let heightFactor = 1;

            if (aspect < 1.35) {
                distanceFactor = 1.28;
            } else if (aspect < 1.55) {
                distanceFactor = 1.14;
            } else if (aspect > 2.15) {
                distanceFactor = 0.92;
            }

            if (height < 760) {
                heightFactor = 1.08;
            } else if (height > 980) {
                heightFactor = 0.96;
            }

            return new THREE.Vector3(
                basePosition.x * distanceFactor,
                basePosition.y * heightFactor,
                basePosition.z * distanceFactor,
            );
        }

        function getCameraFitMargin(type = currentType, step = currentStep, piFocused = piFocusActive) {
            const { aspect, height } = getViewportMetrics();
            let margin;

            if (type === 's' || type === 'p') {
                margin = 1.32;
            } else if (piFocused) {
                margin = 1.24;
            } else if (step === 0) {
                margin = type.includes('d') ? 1.4 : 1.3;
            } else if (step <= 2) {
                margin = 1.22;
            } else if (step >= 4) {
                margin = 1.14;
            } else {
                margin = 1.18;
            }

            if (aspect >= 2.2) {
                margin *= 0.84;
            } else if (aspect >= 1.95) {
                margin *= 0.89;
            } else if (aspect >= 1.7) {
                margin *= 0.94;
            }

            if (height < 620) {
                margin *= 1.02;
            }

            return margin;
        }

        function getCameraFitBounds() {
            const bounds = new THREE.Box3();
            const groups = [
                atomicGroup,
                hybridGroup,
                unhybridizedGroup,
                bondingGroup,
                stickGroup,
                lonePairGroup,
                piGroup,
            ];

            groups.forEach((group) => {
                if (!group?.visible) {
                    return;
                }

                group.updateWorldMatrix(true, true);
                group.traverse((child) => {
                    if (!child?.visible || child.userData?.excludeFromCameraFit) {
                        return;
                    }

                    if (child.isSprite || child.isLine || child.isLineSegments || child.isAxesHelper) {
                        return;
                    }

                    if (!child.geometry) {
                        return;
                    }

                    if (!child.geometry.boundingBox) {
                        child.geometry.computeBoundingBox();
                    }

                    if (!child.geometry.boundingBox) {
                        return;
                    }

                    fitScratchBox.copy(child.geometry.boundingBox).applyMatrix4(child.matrixWorld);
                    fitScratchBox.getSize(fitScratchSize);
                    if (fitScratchSize.lengthSq() < 0.01) {
                        return;
                    }

                    bounds.union(fitScratchBox);
                });
            });

            return bounds.isEmpty() ? null : bounds;
        }

        function getCurrentCameraPose(type = currentType, step = currentStep, piFocused = piFocusActive) {
            const fallbackPosition = getAdaptedCameraPosition(getBaseCameraPreset(type, step, piFocused));
            const fallbackTarget = new THREE.Vector3(0, 0, 0);
            const bounds = getCameraFitBounds();
            if (!bounds) {
                return {
                    position: fallbackPosition,
                    target: fallbackTarget,
                    radius: 8,
                };
            }

            const center = bounds.getCenter(new THREE.Vector3());
            const sphere = bounds.getBoundingSphere(new THREE.Sphere());
            const direction = fallbackPosition.lengthSq() > 0
                ? fallbackPosition.clone().normalize()
                : new THREE.Vector3(0, 0.12, 1);
            const verticalFov = THREE.MathUtils.degToRad(camera.fov);
            const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
            const limitingHalfFov = Math.max(
                THREE.MathUtils.degToRad(12),
                Math.min(verticalFov, horizontalFov) / 2,
            );

            let distance = sphere.radius / Math.sin(limitingHalfFov);
            distance *= getCameraFitMargin(type, step, piFocused);
            distance += Math.max(0.9, sphere.radius * 0.12);

            return {
                position: center.clone().add(direction.multiplyScalar(distance)),
                target: center,
                radius: Math.max(sphere.radius, 1.5),
            };
        }

        function applyCurrentCameraPose() {
            const pose = getCurrentCameraPose();
            camera.position.copy(pose.position);
            controls.target.copy(pose.target);
            camera.near = 0.1;
            camera.far = Math.max(120, pose.radius * 18);
            camera.updateProjectionMatrix();
            camera.lookAt(controls.target);
            controls.update();
        }

        function resize() {
            if (destroyed) return;
            updateResponsiveLayout();
            syncFloatingToolbarLayout();
            const { width, height, aspect } = getViewportMetrics();
            camera.aspect = width / height;
            camera.fov = height < 760 ? 50 : aspect < 1.45 ? 48 : 45;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height, false);

            if (!isAnimating) {
                applyCurrentCameraPose();
            }
        }

        function renderOnce() {
            controls.update();
            renderer.render(scene, camera);
        }

        function animationLoop() {
            if (destroyed || paused) {
                rafId = 0;
                return;
            }

            renderOnce();
            rafId = window.requestAnimationFrame(animationLoop);
        }

        function startLoop() {
            if (rafId || destroyed || paused) return;
            rafId = window.requestAnimationFrame(animationLoop);
        }

        function stopLoop() {
            if (!rafId) return;
            window.cancelAnimationFrame(rafId);
            rafId = 0;
        }

        function isQuantumMode() {
            return Boolean(ui.quantumToggle?.checked);
        }

        function clearGroup(group) {
            while (group.children.length > 0) {
                const child = group.children[0];
                disposeObject(child);
                group.remove(child);
            }
        }

        function createLobeMesh(colorHex, targetDir, isLarge, isP) {
            const group = new THREE.Group();
            let scaleZ;
            let scaleXY;
            let translateZ;

            const geometry = new THREE.SphereGeometry(1, 64, 64);
            const positions = geometry.attributes.position;
            for (let index = 0; index < positions.count; index += 1) {
                const z = positions.getZ(index);
                if (z < 0) {
                    const shrink = Math.pow(z + 1, 0.6);
                    positions.setX(index, positions.getX(index) * shrink);
                    positions.setY(index, positions.getY(index) * shrink);
                }
            }

            if (isP) {
                scaleZ = 2.0;
                scaleXY = 1.3;
                translateZ = 1.8;
            } else if (isLarge) {
                scaleZ = 3.0;
                scaleXY = 1.8;
                translateZ = 2.4;
            } else {
                scaleZ = 0.5;
                scaleXY = 0.5;
                translateZ = 0.3;
            }

            geometry.scale(scaleXY, scaleXY, scaleZ);
            geometry.translate(0, 0, translateZ);
            geometry.computeVertexNormals();

            const solid = new THREE.Mesh(
                geometry,
                new THREE.MeshPhongMaterial({
                    color: colorHex,
                    shininess: 90,
                    specular: 0x444444,
                    opacity: 0.95,
                    transparent: true,
                    side: THREE.FrontSide,
                    depthWrite: true,
                }),
            );

            const pointCount = Math.max(6000, Math.round((isLarge ? 80000 : 35000) * pointDensityScale));
            const pointCloud = [];
            for (let index = 0; index < pointCount; index += 1) {
                const radius = Math.pow(Math.random(), 2.0);
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos((2 * Math.random()) - 1);
                let x = radius * Math.sin(phi) * Math.cos(theta);
                let y = radius * Math.sin(phi) * Math.sin(theta);
                let z = radius * Math.cos(phi);

                if (z < 0) {
                    const shrink = Math.pow(z + 1, 0.6);
                    x *= shrink;
                    y *= shrink;
                }

                x *= scaleXY;
                y *= scaleXY;
                z *= scaleZ;
                z += translateZ;
                pointCloud.push(new THREE.Vector3(x, y, z));
            }

            const points = new THREE.Points(
                new THREE.BufferGeometry().setFromPoints(pointCloud),
                new THREE.PointsMaterial({
                    color: colorHex,
                    size: 0.035,
                    transparent: true,
                    opacity: 0.65,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                }),
            );
            points.visible = isQuantumMode();

            group.add(solid);
            group.add(points);
            group.quaternion.setFromUnitVectors(
                new THREE.Vector3(0, 0, 1),
                new THREE.Vector3().copy(targetDir).normalize(),
            );
            group.userData = {
                isOrbital: true,
                solid,
                quantum: points,
            };

            return group;
        }

        function createTextSprite(message, size = 55, color = '#ffffff', glow = '#00e6ff', yOffset = 64) {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 512;
            canvas.height = 128;
            context.fillStyle = 'rgba(0,0,0,0)';
            context.fillRect(0, 0, 512, 128);
            context.font = `900 ${size}px ${CANVAS_FONT_STACK}`;
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.shadowColor = glow;
            context.shadowBlur = Math.round(size / 4);
            context.fillStyle = color;
            context.fillText(message, 256, yOffset);
            context.fillText(message, 256, yOffset);
            context.fillText(message, 256, yOffset);

            const texture = new THREE.CanvasTexture(canvas);
            texture.minFilter = THREE.LinearFilter;
            texture.colorSpace = THREE.SRGBColorSpace;
            const material = new THREE.SpriteMaterial({
                map: texture,
                depthTest: false,
                depthWrite: false,
            });
            const sprite = new THREE.Sprite(material);
            sprite.scale.set(6, 1.5, 1);
            return sprite;
        }
        function attachText(mesh, text, color = '#ffffff') {
            if (mesh.userData.labelMesh) {
                disposeObject(mesh.userData.labelMesh);
                mesh.remove(mesh.userData.labelMesh);
            }

            if (!text) return;

            const glow = color === '#000000' || color === '#333333'
                ? 'rgba(255,255,255,0.5)'
                : 'rgba(0,0,0,0.8)';
            const label = createTextSprite(text, 100, color, glow, 64);
            label.scale.set(2.6, 0.65, 1);
            mesh.add(label);
            mesh.userData.labelMesh = label;
        }

        function createAngleArc(dirA, dirB, text, radius = 3.2) {
            const group = new THREE.Group();
            const axis = new THREE.Vector3().crossVectors(dirA, dirB).normalize();
            if (axis.lengthSq() < 0.001) {
                axis.set(0, 1, 0);
            }

            const angle = dirA.angleTo(dirB);
            const points = [];
            const segments = 30;
            for (let index = 0; index <= segments; index += 1) {
                points.push(
                    dirA.clone()
                        .applyAxisAngle(axis, angle * (index / segments))
                        .multiplyScalar(radius),
                );
            }

            const line = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints(points),
                new THREE.LineBasicMaterial({
                    color: 0x00e6ff,
                    transparent: true,
                    opacity: 0.9,
                }),
            );
            group.add(line);

            const label = createTextSprite(text);
            label.position.copy(
                dirA.clone()
                    .applyAxisAngle(axis, angle / 2)
                    .multiplyScalar(radius + 0.8),
            );
            group.add(label);
            return group;
        }

        function createLonePairCloud(dir) {
            const group = new THREE.Group();
            const geometry = new THREE.SphereGeometry(1, 32, 32);
            const positions = geometry.attributes.position;
            for (let index = 0; index < positions.count; index += 1) {
                const z = positions.getZ(index);
                if (z < 0) {
                    const shrink = Math.pow(z + 1, 0.6);
                    positions.setX(index, positions.getX(index) * shrink);
                    positions.setY(index, positions.getY(index) * shrink);
                }
            }

            geometry.scale(1.8, 1.8, 2.0);
            geometry.translate(0, 0, 1.8);
            const lobe = new THREE.Mesh(
                geometry,
                new THREE.MeshPhongMaterial({
                    color: 0xffcc00,
                    shininess: 100,
                    opacity: 0.5,
                    transparent: true,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                }),
            );
            lobe.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
            group.add(lobe);

            const electronGeometry = new THREE.SphereGeometry(0.3, 16, 16);
            const electronMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const electronA = new THREE.Mesh(electronGeometry, electronMaterial);
            const electronB = new THREE.Mesh(electronGeometry, electronMaterial);
            let right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
            if (right.lengthSq() < 0.01) {
                right.set(1, 0, 0);
            }

            electronA.position.copy(dir.clone().multiplyScalar(2.6).add(right.clone().multiplyScalar(0.6)));
            electronB.position.copy(dir.clone().multiplyScalar(2.6).add(right.clone().multiplyScalar(-0.6)));
            group.add(electronA);
            group.add(electronB);
            return group;
        }

        function createSOrbital(colorHex) {
            const solid = new THREE.Mesh(
                new THREE.SphereGeometry(2.0, 64, 64),
                new THREE.MeshPhongMaterial({
                    color: colorHex,
                    shininess: 90,
                    opacity: 0.95,
                    transparent: true,
                }),
            );

            const pointCount = Math.max(8000, Math.round(60000 * pointDensityScale));
            const pointCloud = [];
            for (let index = 0; index < pointCount; index += 1) {
                const radius = Math.pow(Math.random(), 2.0) * 2.0;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos((2 * Math.random()) - 1);
                pointCloud.push(new THREE.Vector3(
                    radius * Math.sin(phi) * Math.cos(theta),
                    radius * Math.sin(phi) * Math.sin(theta),
                    radius * Math.cos(phi),
                ));
            }

            const points = new THREE.Points(
                new THREE.BufferGeometry().setFromPoints(pointCloud),
                new THREE.PointsMaterial({
                    color: colorHex,
                    size: 0.035,
                    transparent: true,
                    opacity: 0.65,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                }),
            );
            points.visible = isQuantumMode();

            const group = new THREE.Group();
            group.add(solid);
            group.add(points);
            group.userData = {
                isOrbital: true,
                solid,
                quantum: points,
            };
            return group;
        }

        function createPLobePair(colorA, colorB, direction) {
            const group = new THREE.Group();
            group.add(createLobeMesh(colorA, direction, false, true));
            group.add(createLobeMesh(colorB, direction.clone().negate(), false, true));
            return group;
        }

        function createDz2Orbital() {
            const group = new THREE.Group();
            group.add(createLobeMesh(COLORS.p, new THREE.Vector3(0, 0, 1), false, true));
            group.add(createLobeMesh(COLORS.p, new THREE.Vector3(0, 0, -1), false, true));
            const torus = new THREE.Mesh(
                new THREE.TorusGeometry(1.2, 0.45, 32, 64),
                new THREE.MeshPhongMaterial({
                    color: COLORS.p,
                    shininess: 90,
                    opacity: 0.95,
                    transparent: true,
                }),
            );
            torus.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
            group.add(torus);
            return group;
        }

        function createDx2y2Orbital() {
            const group = new THREE.Group();
            group.add(createLobeMesh(COLORS.p, new THREE.Vector3(1, 0, 0), false, true));
            group.add(createLobeMesh(COLORS.p, new THREE.Vector3(-1, 0, 0), false, true));
            group.add(createLobeMesh(COLORS.p, new THREE.Vector3(0, 1, 0), false, true));
            group.add(createLobeMesh(COLORS.p, new THREE.Vector3(0, -1, 0), false, true));
            return group;
        }

        function createHybridOrbital(direction) {
            const group = new THREE.Group();
            group.add(createLobeMesh(COLORS.hybrid, direction, true, false));
            group.add(createLobeMesh(COLORS.tail, direction.clone().negate(), false, false));
            return group;
        }

        function createBondingAtom(position) {
            const mesh = new THREE.Mesh(
                new THREE.SphereGeometry(1.0, 32, 32),
                new THREE.MeshPhongMaterial({ color: COLORS.bond, shininess: 60 }),
            );
            mesh.position.copy(position);
            return mesh;
        }

        function createStick(direction, length) {
            const mesh = new THREE.Mesh(
                new THREE.CylinderGeometry(0.15, 0.15, length, 16).translate(0, length / 2, 0),
                new THREE.MeshPhongMaterial({ color: 0x888888, shininess: 80 }),
            );
            mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
            return mesh;
        }

        function attachCore(groupMesh) {
            const nucleus = new THREE.Mesh(
                new THREE.SphereGeometry(0.8, 32, 32),
                new THREE.MeshPhongMaterial({ color: 0x444444, shininess: 100 }),
            );
            const axes = new THREE.AxesHelper(4);
            groupMesh.add(nucleus);
            groupMesh.add(axes);
            return groupMesh;
        }

        function showStatus(title, description) {
            ui.stepTitle.textContent = title;
            ui.stepDesc.textContent = description;
            ui.stepOverlay.classList.add('active');
        }

        function hideStatus() {
            ui.stepOverlay.classList.remove('active');
        }

        function tweenPromise(durationSeconds, onUpdate) {
            return new Promise((resolve) => {
                const startedAt = performance.now();

                function step(currentTime) {
                    if (destroyed) {
                        resolve();
                        return;
                    }

                    let progress = (currentTime - startedAt) / (durationSeconds * 1000);
                    if (progress >= 1) {
                        onUpdate(1);
                        resolve();
                        return;
                    }

                    progress = progress < 0.5
                        ? 4 * progress * progress * progress
                        : 1 - (Math.pow((-2 * progress) + 2, 3) / 2);
                    onUpdate(progress);
                    window.requestAnimationFrame(step);
                }

                window.requestAnimationFrame(step);
            });
        }

        function updateEnergyDiagram() {
            ui.energyPanel.style.display = 'flex';
            ui.energyPanel.style.opacity = '1';

            if (!isHybridType()) {
                ui.hybridLabel.style.opacity = '0';
                return;
            }

            const sBox = qs('#e-s-box');
            const pBoxes = qs('#e-p-boxes');
            const pBox0 = qs('#e-p-box0');
            const pBox1 = qs('#e-p-box1');
            const pBox2 = qs('#e-p-box2');
            const sCol = qs('#e-s-col');
            const arrDown = qs('#e-arr-1');
            const arrJump = qs('#e-arr-jump');
            const sArrow = qs('#e-arr-0');
            const sLabel = qs('#e-s-label');
            const pLabel = qs('#e-p-label');

            if (currentStep === 0) {
                sBox.style.marginBottom = '0px';
                pBoxes.style.marginBottom = '50px';
                sBox.style.borderColor = 'rgba(231, 76, 60, 0.5)';
                sBox.style.boxShadow = '0 0 12px rgba(231, 76, 60, 0.2), inset 0 0 10px rgba(0,0,0,0.8)';
                sBox.style.borderRight = '1px solid rgba(231, 76, 60, 0.5)';
                sBox.style.borderTopRightRadius = '4px';
                sBox.style.borderBottomRightRadius = '4px';
                sArrow.style.left = '4px';
                sArrow.style.transform = 'none';
                pBoxes.style.transform = 'translateX(0)';
                [pBox0, pBox1, pBox2].forEach((box) => {
                    box.style.borderColor = 'rgba(88, 166, 255, 0.5)';
                    box.style.boxShadow = '0 0 12px rgba(88, 166, 255, 0.15), inset 0 0 10px rgba(0,0,0,0.8)';
                    box.style.opacity = '1';
                    box.style.transform = 'none';
                });
                pBox0.style.borderRight = '1px solid rgba(88,166,255,0.2)';
                pBox1.style.borderRight = '1px solid rgba(88,166,255,0.2)';
                pBox0.style.borderLeft = '1px solid rgba(88, 166, 255, 0.5)';
                sCol.style.transform = 'none';
                arrDown.style.opacity = '1';
                arrDown.style.transform = 'translate(0,0)';
                arrJump.style.opacity = '0';
                ui.hybridLabel.style.opacity = '0';
                sLabel.style.opacity = '1';
                pLabel.style.opacity = '1';
                return;
            }

            if (currentStep === 1) {
                arrDown.style.transform = 'translate(72px, -50px)';
                arrDown.style.opacity = '0';
                sArrow.style.left = '50%';
                sArrow.style.transform = 'translateX(-50%)';
                window.setTimeout(() => {
                    if (!destroyed && currentStep === 1) {
                        arrJump.style.opacity = '1';
                    }
                }, 350);
                ui.hybridLabel.style.opacity = '0';
                return;
            }

            if (currentStep === 2) {
                sBox.style.marginBottom = '25px';
                pBoxes.style.marginBottom = '25px';
                sBox.style.borderColor = 'rgba(46, 204, 113, 0.8)';
                pBox0.style.borderColor = 'rgba(46, 204, 113, 0.8)';
                sBox.style.boxShadow = '0 0 12px rgba(46, 204, 113, 0.3), inset 0 0 10px rgba(0,0,0,0.8)';
                pBox0.style.boxShadow = '0 0 12px rgba(46, 204, 113, 0.3), inset 0 0 10px rgba(0,0,0,0.8)';
                sBox.style.borderTopRightRadius = '0';
                sBox.style.borderBottomRightRadius = '0';
                sBox.style.borderRight = '1px solid rgba(46, 204, 113, 0.3)';
                pBox0.style.borderLeft = 'none';
                sLabel.style.opacity = '0';
                pLabel.style.opacity = '0';
                sCol.style.transform = 'none';
                pBoxes.style.transform = 'none';

                if (currentType === 'sp3') {
                    pBox1.style.borderColor = 'rgba(46, 204, 113, 0.8)';
                    pBox2.style.borderColor = 'rgba(46, 204, 113, 0.8)';
                    pBox1.style.boxShadow = '0 0 12px rgba(46, 204, 113, 0.3), inset 0 0 10px rgba(0,0,0,0.8)';
                    pBox2.style.boxShadow = '0 0 12px rgba(46, 204, 113, 0.3), inset 0 0 10px rgba(0,0,0,0.8)';
                    pBox0.style.borderRight = '1px solid rgba(46, 204, 113, 0.3)';
                    pBox1.style.borderRight = '1px solid rgba(46, 204, 113, 0.3)';
                    ui.hybridLabel.textContent = '四个均等的 sp³ 杂化轨道';
                } else if (currentType === 'sp2') {
                    pBox1.style.borderColor = 'rgba(46, 204, 113, 0.8)';
                    pBox1.style.boxShadow = '0 0 12px rgba(46, 204, 113, 0.3), inset 0 0 10px rgba(0,0,0,0.8)';
                    pBox0.style.borderRight = '1px solid rgba(46, 204, 113, 0.3)';
                    pBox1.style.borderRight = '1px solid rgba(46, 204, 113, 0.8)';
                    pBox2.style.borderColor = 'rgba(88, 166, 255, 0.3)';
                    pBox2.style.boxShadow = 'inset 0 0 10px rgba(0,0,0,0.8)';
                    pBox2.style.transform = 'translate(12px, -25px)';
                    ui.hybridLabel.textContent = '三个 sp² 杂化 + 一个游离 p 轨道';
                } else if (currentType === 'sp') {
                    pBox0.style.borderRight = '1px solid rgba(46, 204, 113, 0.8)';
                    pBox1.style.borderColor = 'rgba(88, 166, 255, 0.3)';
                    pBox2.style.borderColor = 'rgba(88, 166, 255, 0.3)';
                    pBox1.style.boxShadow = 'inset 0 0 10px rgba(0,0,0,0.8)';
                    pBox2.style.boxShadow = 'inset 0 0 10px rgba(0,0,0,0.8)';
                    pBox1.style.borderRight = '1px solid rgba(88, 166, 255, 0.2)';
                    pBox1.style.transform = 'translate(16px, -25px)';
                    pBox2.style.transform = 'translate(16px, -25px)';
                    ui.hybridLabel.textContent = '两个 sp 杂化 + 两个游离 p 轨道';
                }

                window.setTimeout(() => {
                    if (!destroyed && currentStep >= 2) {
                        ui.hybridLabel.style.opacity = '1';
                    }
                }, 400);
            }
        }
        function generateAngleArcs() {
            clearGroup(angleGroup);
            if (currentType === 'sp') {
                angleGroup.add(createAngleArc(currentHybrids[0].finalDir, currentHybrids[1].finalDir, '180°'));
            }
            if (currentType === 'sp2') {
                angleGroup.add(createAngleArc(currentHybrids[0].finalDir, currentHybrids[1].finalDir, '120°'));
            }
            if (currentType === 'sp3') {
                angleGroup.add(createAngleArc(currentHybrids[0].baseDir, currentHybrids[1].baseDir, '109°28′'));
            }
            if (currentType === 'sp3d') {
                angleGroup.add(createAngleArc(currentHybrids[2].finalDir, currentHybrids[3].finalDir, '120°'));
                angleGroup.add(createAngleArc(currentHybrids[0].finalDir, currentHybrids[2].finalDir, '90°'));
            }
            if (currentType === 'sp3d2') {
                angleGroup.add(createAngleArc(currentHybrids[0].finalDir, currentHybrids[2].finalDir, '90°'));
            }
            angleGroup.scale.set(0.01, 0.01, 0.01);
        }

        function prepareAssets(type) {
            clearGroup(atomicGroup);
            clearGroup(hybridGroup);
            clearGroup(unhybridizedGroup);
            clearGroup(bondingGroup);
            clearGroup(stickGroup);
            clearGroup(angleGroup);
            clearGroup(piGroup);
            clearGroup(lonePairGroup);

            currentIngredients = [];
            currentHybrids = [];
            currentUnhybridized = [];
            currentBonds = [];
            currentSticks = [];
            masterCoreRef = null;
            piFocusActive = false;

            ui.advancedControls.style.display = 'none';
            ui.lonePairRange.value = '0';
            ui.lpValueText.textContent = 'CH₄ 甲烷：0 对孤对，109.5°';

            let atomicCount = 1;
            if (type === 'sp') atomicCount = 2;
            else if (type === 'sp2') atomicCount = 3;
            else if (type === 'sp3') atomicCount = 4;
            else if (type === 'sp3d') atomicCount = 5;
            else if (type === 'sp3d2') atomicCount = 6;

            const spacing = 9.0;
            const startX = -(((atomicCount - 1) * spacing) / 2);

            const sOrbital = attachCore(new THREE.Group());
            sOrbital.add(createSOrbital(COLORS.s));
            currentIngredients.push({ mesh: sOrbital, startPos: new THREE.Vector3(startX, 0, 0) });
            atomicGroup.add(sOrbital);

            if (atomicCount >= 2) {
                const pX = attachCore(createPLobePair(COLORS.p, COLORS.p, new THREE.Vector3(1, 0, 0)));
                currentIngredients.push({ mesh: pX, startPos: new THREE.Vector3(startX + spacing, 0, 0) });
                atomicGroup.add(pX);
            }

            if (atomicCount >= 3) {
                const pY = attachCore(createPLobePair(COLORS.p, COLORS.p, new THREE.Vector3(0, 1, 0)));
                currentIngredients.push({ mesh: pY, startPos: new THREE.Vector3(startX + (spacing * 2), 0, 0) });
                atomicGroup.add(pY);
            }

            if (atomicCount >= 4) {
                const pZ = attachCore(createPLobePair(COLORS.p, COLORS.p, new THREE.Vector3(0, 0, 1)));
                currentIngredients.push({ mesh: pZ, startPos: new THREE.Vector3(startX + (spacing * 3), 0, 0) });
                atomicGroup.add(pZ);
            }

            if (atomicCount >= 5) {
                const dz2 = attachCore(createDz2Orbital());
                currentIngredients.push({ mesh: dz2, startPos: new THREE.Vector3(startX + (spacing * 4), 0, 0) });
                atomicGroup.add(dz2);
            }

            if (atomicCount >= 6) {
                const dx2y2 = attachCore(createDx2y2Orbital());
                currentIngredients.push({ mesh: dx2y2, startPos: new THREE.Vector3(startX + (spacing * 5), 0, 0) });
                atomicGroup.add(dx2y2);
            }

            if (type === 'sp') {
                const pY = createPLobePair(0xaaaaaa, 0xaaaaaa, new THREE.Vector3(0, 1, 0));
                const pZ = createPLobePair(0xaaaaaa, 0xaaaaaa, new THREE.Vector3(0, 0, 1));
                pY.children.forEach((child) => {
                    child.userData.solid.material.opacity = 0.25;
                    child.userData.solid.material.depthWrite = false;
                });
                pZ.children.forEach((child) => {
                    child.userData.solid.material.opacity = 0.25;
                    child.userData.solid.material.depthWrite = false;
                });
                currentUnhybridized.push({ mesh: pY }, { mesh: pZ });
                unhybridizedGroup.add(pY, pZ);
            }

            if (type === 'sp2') {
                const pZ = createPLobePair(0xaaaaaa, 0xaaaaaa, new THREE.Vector3(0, 0, 1));
                pZ.children.forEach((child) => {
                    child.userData.solid.material.opacity = 0.25;
                    child.userData.solid.material.depthWrite = false;
                });
                currentUnhybridized.push({ mesh: pZ });
                unhybridizedGroup.add(pZ);
            }

            const addHybrids = (finalDirections) => {
                masterCoreRef = attachCore(new THREE.Group());
                hybridGroup.add(masterCoreRef);
                finalDirections.forEach((direction) => {
                    const initialOffset = direction.clone().add(new THREE.Vector3(0, 0, 1)).normalize();
                    const hybrid = createHybridOrbital(initialOffset);
                    currentHybrids.push({
                        mesh: hybrid,
                        initialDir: initialOffset,
                        finalDir: direction,
                        baseDir: direction.clone(),
                    });
                    hybridGroup.add(hybrid);

                    const bond = createBondingAtom(direction.clone().multiplyScalar(5.5));
                    currentBonds.push(bond);
                    bondingGroup.add(bond);

                    const stick = createStick(direction, 5.5);
                    currentSticks.push({ mesh: stick, currentDir: direction.clone() });
                    stickGroup.add(stick);
                });
            };

            if (type === 'sp') {
                addHybrids([new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0)]);
            } else if (type === 'sp2') {
                addHybrids([
                    new THREE.Vector3(1, 0, 0),
                    new THREE.Vector3(-0.5, Math.sqrt(3) / 2, 0),
                    new THREE.Vector3(-0.5, -Math.sqrt(3) / 2, 0),
                ]);
            } else if (type === 'sp3') {
                addHybrids([
                    new THREE.Vector3(1, 1, 1).normalize(),
                    new THREE.Vector3(-1, -1, 1).normalize(),
                    new THREE.Vector3(-1, 1, -1).normalize(),
                    new THREE.Vector3(1, -1, -1).normalize(),
                ]);
            } else if (type === 'sp3d') {
                addHybrids([
                    new THREE.Vector3(0, 1, 0),
                    new THREE.Vector3(0, -1, 0),
                    new THREE.Vector3(1, 0, 0),
                    new THREE.Vector3(-0.5, 0, Math.sqrt(3) / 2),
                    new THREE.Vector3(-0.5, 0, -Math.sqrt(3) / 2),
                ]);
            } else if (type === 'sp3d2') {
                addHybrids([
                    new THREE.Vector3(1, 0, 0),
                    new THREE.Vector3(-1, 0, 0),
                    new THREE.Vector3(0, 1, 0),
                    new THREE.Vector3(0, -1, 0),
                    new THREE.Vector3(0, 0, 1),
                    new THREE.Vector3(0, 0, -1),
                ]);
            }

            hybridGroup.scale.set(0.01, 0.01, 0.01);
            unhybridizedGroup.scale.set(0.01, 0.01, 0.01);
            bondingGroup.scale.set(0.01, 0.01, 0.01);
            stickGroup.scale.set(0.01, 0.01, 0.01);
            currentIngredients.forEach((item) => {
                item.mesh.position.copy(item.startPos);
                item.mesh.scale.set(0.01, 0.01, 0.01);
            });

            ui.quantumToggle.dispatchEvent(new Event('change'));
        }

        async function runNextStep() {
            if (isAnimating || currentType === 's' || currentType === 'p') return;

            isAnimating = true;
            controls.autoRotate = false;
            ui.nextStepBtn.disabled = true;

            if (currentStep === 0) {
                updateEnergyDiagram();
                const cameraStart = camera.position.clone();
                const cameraTarget = getAdaptedCameraPosition(getBaseCameraPreset(currentType, 1, false));
                await tweenPromise(1.5, (progress) => {
                    currentIngredients.forEach((item) => {
                        item.mesh.position.copy(item.startPos.clone().lerp(new THREE.Vector3(0, 0, 0), progress));
                    });
                    camera.position.lerpVectors(cameraStart, cameraTarget, progress);
                    if (currentUnhybridized.length) {
                        unhybridizedGroup.scale.set(progress, progress, progress);
                    }
                });
                currentStep = 1;
            } else if (currentStep === 1) {
                updateEnergyDiagram();
                currentHybrids.forEach((item) => {
                    item.mesh.children[0].quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), item.initialDir);
                    item.mesh.children[1].quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), item.initialDir.clone().negate());
                });
                await tweenPromise(1.2, (progress) => {
                    currentIngredients.forEach((item) => item.mesh.scale.set(1 - progress, 1 - progress, 1 - progress));
                    hybridGroup.scale.set(progress, progress, progress);
                });
                currentStep = 2;
            } else if (currentStep === 2) {
                updateEnergyDiagram();
                const cameraStart = camera.position.clone();
                const cameraTarget = getAdaptedCameraPosition(getBaseCameraPreset(currentType, 3, false));
                await tweenPromise(2.0, (progress) => {
                    currentHybrids.forEach((item) => {
                        const direction = item.initialDir.clone().lerp(item.finalDir, progress).normalize();
                        item.mesh.children[0].quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
                        item.mesh.children[1].quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction.clone().negate());
                    });
                    camera.position.lerpVectors(cameraStart, cameraTarget, progress);
                    camera.lookAt(0, 0, 0);
                });
                currentStep = 3;
            } else if (currentStep === 3) {
                await tweenPromise(1.2, (progress) => {
                    bondingGroup.scale.set(progress, progress, progress);
                });
                currentStep = 4;
            } else if (currentStep === 4) {
                stickGroup.scale.set(0.01, 0.01, 0.01);
                generateAngleArcs();
                const caseData = getCurrentCase();
                ui.advancedControls.style.display = 'block';

                applyCurrentCaseLabels();

                if (currentType === 'sp3') {
                    ui.lpControlWrapper.style.display = 'block';
                    ui.piControlWrapper.style.display = 'none';
                } else if (currentType === 'sp' || currentType === 'sp2') {
                    ui.lpControlWrapper.style.display = 'none';
                    ui.piControlWrapper.style.display = caseData?.piAllowed === false ? 'none' : 'block';
                    ui.showPiBtn.disabled = false;
                    piFocusActive = false;
                    updatePiButtonCopy();
                } else {
                    ui.lpControlWrapper.style.display = 'none';
                    ui.piControlWrapper.style.display = 'none';
                }

                await tweenPromise(1.2, (progress) => {
                    stickGroup.scale.set(progress, progress, progress);
                    angleGroup.scale.set(progress, progress, progress);
                    currentHybrids.forEach((item) => {
                        item.mesh.children.forEach((lobe) => {
                            if (lobe.userData.solid) {
                                lobe.userData.solid.material.opacity = 0.95 - ((0.95 - 0.15) * progress);
                            }
                        });
                    });
                    currentUnhybridized.forEach((item) => {
                        item.mesh.children.forEach((lobe) => {
                            if (lobe.userData.solid) {
                                lobe.userData.solid.material.opacity = 0.25 - ((0.25 - 0.05) * progress);
                            }
                        });
                    });
                });
                currentStep = 5;

                if (currentType === 'sp3' && typeof currentSp3LonePairValue === 'number' && currentSp3LonePairValue > 0) {
                    await setSp3LonePairState(currentSp3LonePairValue, {
                        syncCaseSelection: false,
                        bypassAnimatingGuard: true,
                    });
                }
            }

            applyCurrentCameraPose();

            if (currentStep >= 4) {
                controls.autoRotate = ui.autoRotate.checked;
            }

            ui.nextStepBtn.disabled = false;
            isAnimating = false;
            updateStepUI();
        }
        function updateStepUI() {
            if (currentType === 's' || currentType === 'p') {
                ui.nextStepBtn.textContent = '完成观察';
                ui.nextStepBtn.disabled = true;
                showStatus(
                    currentType === 's' ? '基础轨道观察：s 轨道' : '基础轨道观察：p 轨道',
                    currentType === 's'
                        ? '先抓住“球形、中心对称”这两个关键词，再进入杂化轨道的学习。'
                        : '先抓住“哑铃形、有方向性”这两个关键词，再理解 π 键的来源。',
                );
                refreshTeachingUi();
                return;
            }

            if (currentStep === 0) {
                showStatus('观察起点：中心原子准备成键', '先识别中心原子的价电子，并观察将参与杂化的 s、p 轨道。');
                ui.nextStepBtn.textContent = '▶ 步 1：价电子重排';
            } else if (currentStep === 1) {
                showStatus('步 1：价电子重排', '中心原子的 s、p 轨道靠近并重新分配能量，为形成等价杂化轨道做准备。');
                ui.nextStepBtn.textContent = '▶ 步 2：形成杂化轨道';
            } else if (currentStep === 2) {
                showStatus('步 2：形成杂化轨道', '不同类型的原子轨道线性组合，生成等价的 sp、sp² 或 sp³ 杂化轨道。');
                ui.nextStepBtn.textContent = '▶ 步 3：确定空间构型';
            } else if (currentStep === 3) {
                showStatus('步 3：电子对排斥决定构型', '电子对彼此尽量远离，形成直线形、平面三角形、正四面体等稳定空间构型。');
                ui.nextStepBtn.textContent = '▶ 步 4：形成 σ 键';
            } else if (currentStep === 4) {
                showStatus('步 4：形成 σ 键', '杂化轨道沿轨道轴方向重叠形成 σ 键；若仍保留未杂化 p 轨道，还能进一步形成 π 键。');
                ui.nextStepBtn.textContent = '▶ 步 5：观察成键总结';
            } else if (currentStep === 5) {
                showStatus('步 5：观察成键总结', '现在把杂化类型、空间构型、键角与 σ 键/π 键一起对应到当前案例。');
                ui.nextStepBtn.textContent = '✅ 当前案例已讲解完成';
                ui.nextStepBtn.disabled = true;
            }

            if (currentStep < 5) {
                ui.nextStepBtn.disabled = false;
            }

            refreshTeachingUi();
            scheduleFloatingToolbarLayoutSync();
        }

        async function initType(type) {
            if (isAnimating) return;
            isAnimating = true;
            currentType = type;
            currentStep = 0;
            piFocusActive = false;
            currentSp3LonePairValue = getCurrentCase(type)?.lonePairValue ?? 0;
            applyCurrentCameraPose();
            controls.autoRotate = false;
            updateEnergyDiagram();
            setPanelView(currentType === 's' || currentType === 'p' ? 'quick' : currentPanelView);
            refreshTeachingUi();

            if (type === 's' || type === 'p') {
                clearGroup(atomicGroup);
                clearGroup(hybridGroup);
                clearGroup(unhybridizedGroup);
                clearGroup(bondingGroup);
                clearGroup(angleGroup);
                clearGroup(piGroup);
                clearGroup(stickGroup);
                clearGroup(lonePairGroup);
                currentIngredients = [];
                currentHybrids = [];
                currentUnhybridized = [];
                currentBonds = [];
                currentSticks = [];
                ui.advancedControls.style.display = 'none';
                const group = attachCore(new THREE.Group());
                masterCoreRef = group;
                if (type === 's') group.add(createSOrbital(COLORS.s));
                if (type === 'p') group.add(createPLobePair(COLORS.p, COLORS.p, new THREE.Vector3(1, 0, 0)));
                atomicGroup.add(group);
                group.scale.set(0, 0, 0);
                applyCurrentCameraPose();
                await tweenPromise(1.0, (progress) => {
                    group.scale.set(progress, progress, progress);
                });
                applyCurrentCameraPose();
                refreshTeachingUi();
                isAnimating = false;
                updateStepUI();
                ui.quantumToggle.dispatchEvent(new Event('change'));
                return;
            }

            prepareAssets(type);
            await tweenPromise(0.8, (progress) => {
                currentIngredients.forEach((item) => item.mesh.scale.set(progress, progress, progress));
            });
            applyCurrentCameraPose();
            refreshTeachingUi();
            isAnimating = false;
            updateStepUI();
        }

        addListener(ui.quantumToggle, 'change', (event) => {
            const mode = event.target.checked;
            scene.traverse((child) => {
                if (child.userData && child.userData.isOrbital) {
                    child.userData.solid.visible = !mode;
                    child.userData.quantum.visible = mode;
                }
            });
        });

        async function setSp3LonePairState(value, options = {}) {
            const { syncCaseSelection = true, bypassAnimatingGuard = false } = options;
            if ((!bypassAnimatingGuard && isAnimating) || currentType !== 'sp3' || currentStep !== 5) return;

            currentSp3LonePairValue = value;
            const linkedCase = getSp3CaseByLonePairValue(value) || getCurrentCase('sp3');
            if (syncCaseSelection && linkedCase) {
                selectedCaseByType.sp3 = linkedCase.key;
            }

            ui.lpValueText.textContent = linkedCase
                ? `${linkedCase.molecule}：${linkedCase.lonePairs}孤对电子，${linkedCase.angle}`
                : '孤对电子对比';
            isAnimating = true;

            const baseDirections = currentHybrids.map((item) => item.baseDir);
            let targetDirections = [];
            if (value === 0) {
                targetDirections = baseDirections;
            } else if (value === 1) {
                targetDirections.push(baseDirections[0]);
                for (let index = 1; index < 4; index += 1) {
                    targetDirections.push(
                        baseDirections[index].clone().applyAxisAngle(
                            new THREE.Vector3().crossVectors(baseDirections[0], baseDirections[index]).normalize(),
                            THREE.MathUtils.degToRad(-2.5),
                        ).normalize(),
                    );
                }
            } else if (value === 2) {
                const referenceCenter = baseDirections[0].clone().add(baseDirections[1]).normalize();
                targetDirections.push(baseDirections[0], baseDirections[1]);
                for (let index = 2; index < 4; index += 1) {
                    targetDirections.push(
                        baseDirections[index].clone().applyAxisAngle(
                            new THREE.Vector3().crossVectors(referenceCenter, baseDirections[index]).normalize(),
                            THREE.MathUtils.degToRad(-5.0),
                        ).normalize(),
                    );
                }
            }

            clearGroup(angleGroup);
            if (value === 0) angleGroup.add(createAngleArc(targetDirections[1], targetDirections[2], '109°28′'));
            if (value === 1) angleGroup.add(createAngleArc(targetDirections[1], targetDirections[2], '107°0′'));
            if (value === 2) angleGroup.add(createAngleArc(targetDirections[2], targetDirections[3], '104.5°'));

            const rootAtom = masterCoreRef.children[0];
            if (rootAtom && linkedCase) {
                rootAtom.material.color.setHex(linkedCase.centerColor);
                attachText(rootAtom, linkedCase.centerAtom, '#ffffff');
            }

            clearGroup(lonePairGroup);
            const lonePairMeshes = [];
            if (value >= 1) {
                const pairOne = createLonePairCloud(targetDirections[0]);
                lonePairGroup.add(pairOne);
                lonePairMeshes.push(pairOne);
            }
            if (value === 2) {
                const pairTwo = createLonePairCloud(targetDirections[1]);
                lonePairGroup.add(pairTwo);
                lonePairMeshes.push(pairTwo);
            }
            lonePairMeshes.forEach((mesh) => mesh.scale.set(0.01, 0.01, 0.01));

            await tweenPromise(0.7, (progress) => {
                for (let index = 0; index < 4; index += 1) {
                    const currentDirection = currentSticks[index].currentDir || baseDirections[index];
                    const nextDirection = currentDirection.clone().lerp(targetDirections[index], progress).normalize();
                    currentSticks[index].mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), nextDirection);
                    currentBonds[index].position.copy(nextDirection.clone().multiplyScalar(5.5));
                    if (progress >= 0.95) {
                        currentSticks[index].currentDir = nextDirection;
                    }
                }

                const lonePairIndices = value === 1 ? [0] : value === 2 ? [0, 1] : [];
                for (let index = 0; index < 4; index += 1) {
                    const alpha = lonePairIndices.includes(index)
                        ? 1 - progress
                        : (currentBonds[index].scale.x < 1 ? progress : 1);
                    currentSticks[index].mesh.scale.set(alpha, alpha, alpha);
                    currentBonds[index].scale.set(alpha, alpha, alpha);
                }

                lonePairMeshes.forEach((mesh) => mesh.scale.set(progress, progress, progress));
            });

            applyCurrentCameraPose();
            refreshTeachingUi();
            isAnimating = false;
        }

        addListener(ui.lonePairRange, 'input', (event) => {
            if (isAnimating || currentType !== 'sp3' || currentStep !== 5) return;
            void setSp3LonePairState(Number.parseInt(event.target.value, 10));
        });
        addListener(ui.showPiBtn, 'click', async () => {
            const caseData = getCurrentCase();
            if (isAnimating || caseData?.piAllowed === false) return;

            isAnimating = true;
            ui.showPiBtn.disabled = true;
            ui.showPiBtn.textContent = caseData?.piLoadingLabel || '💫 正在显示 π 键形成...';
            controls.autoRotate = false;
            clearGroup(piGroup);

            const baseDirection = currentHybrids[0].baseDir.clone().normalize();
            const bananaClouds = [];

            const createCloud = (offset, maxScale, opacity) => {
                const group = new THREE.Group();
                const solid = new THREE.Mesh(
                    new THREE.SphereGeometry(1, 48, 48),
                    new THREE.MeshPhongMaterial({
                        color: 0xdd00ff,
                        transparent: true,
                        opacity,
                        shininess: 150,
                        specular: 0xffaaff,
                        blending: THREE.AdditiveBlending,
                        depthWrite: false,
                    }),
                );

                const points = [];
                const pointCount = Math.max(5000, Math.round(15000 * pointDensityScale));
                for (let index = 0; index < pointCount; index += 1) {
                    const radius = Math.pow(Math.random(), 0.9);
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.acos((2 * Math.random()) - 1);
                    points.push(new THREE.Vector3(
                        radius * Math.sin(phi) * Math.cos(theta),
                        radius * Math.sin(phi) * Math.sin(theta),
                        radius * Math.cos(phi),
                    ));
                }

                const pointMesh = new THREE.Points(
                    new THREE.BufferGeometry().setFromPoints(points),
                    new THREE.PointsMaterial({
                        color: 0xff66ff,
                        size: 0.04,
                        transparent: true,
                        opacity: opacity * 1.2,
                        blending: THREE.AdditiveBlending,
                        depthWrite: false,
                    }),
                );
                pointMesh.visible = isQuantumMode();

                group.add(solid);
                group.add(pointMesh);
                group.userData = {
                    isOrbital: true,
                    solid,
                    quantum: pointMesh,
                    maxScale: maxScale.clone(),
                };
                group.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), baseDirection);
                group.position.copy(offset);
                group.scale.set(0.01, 0.01, 0.01);
                piGroup.add(group);
                bananaClouds.push(group);
            };

            if (currentType === 'sp2') {
                createCloud(new THREE.Vector3(0, 0, 0.95), new THREE.Vector3(3.6, 0.6, 0.6), 0.45);
                createCloud(new THREE.Vector3(0, 0, -0.95), new THREE.Vector3(3.6, 0.6, 0.6), 0.45);
            } else if (currentType === 'sp') {
                createCloud(new THREE.Vector3(0, 0, 0), new THREE.Vector3(4.0, 1.45, 1.45), 0.28);
            }

            const cameraStart = camera.position.clone();
            const cameraTarget = getAdaptedCameraPosition(getBaseCameraPreset(currentType, currentStep, true));
            await tweenPromise(1.8, (progress) => {
                bananaClouds.forEach((cloud) => {
                    cloud.scale.x = cloud.userData.maxScale.x * progress;
                    cloud.scale.y = cloud.userData.maxScale.y * progress;
                    cloud.scale.z = cloud.userData.maxScale.z * progress;
                });
                camera.position.lerpVectors(cameraStart, cameraTarget, progress);
                camera.lookAt(0, 0, 0);
                currentUnhybridized.forEach((item) => {
                    item.mesh.children.forEach((lobe) => {
                        if (lobe.userData.solid) {
                            lobe.userData.solid.material.opacity = Math.max(0, 0.05 - (progress * 0.05));
                        }
                    });
                });
            });

            piFocusActive = true;
            applyCurrentCameraPose();
            ui.showPiBtn.textContent = caseData?.piDoneLabel || '✅ 已显示 π 键电子云';
            refreshTeachingUi();
            isAnimating = false;
            controls.autoRotate = ui.autoRotate.checked;
        });

        addListener(ui.nextStepBtn, 'click', () => {
            void runNextStep();
        });

        addListener(ui.playBtn, 'click', () => {
            void initType(currentType);
        });

        addListener(ui.answerToggleBtn, 'click', () => {
            answersVisible = !answersVisible;
            refreshTeachingUi();
        });

        addListener(ui.exampleChips, 'click', (event) => {
            const trigger = event.target.closest('[data-example-key]');
            if (!trigger || isAnimating) {
                return;
            }

            void selectTeachingCase(trigger.getAttribute('data-example-key'));
        });

        ui.panelSwitchButtons.forEach((button) => {
            addListener(button, 'click', () => {
                setPanelView(button.getAttribute('data-panel-view'));
                scheduleFloatingToolbarLayoutSync();
            });
        });

        addListener(ui.hudCollapseBtn, 'click', () => {
            hudCollapsed = !hudCollapsed;
            renderHudState();
            scheduleFloatingToolbarLayoutSync();
        });

        ui.modeButtons.forEach((button) => {
            addListener(button, 'click', (event) => {
                if (isAnimating) return;
                ui.modeButtons.forEach((entry) => entry.classList.remove('active'));
                event.currentTarget.classList.add('active');
                void initType(event.currentTarget.getAttribute('data-type'));
            });
        });

        addListener(ui.autoRotate, 'change', (event) => {
            if (!isAnimating && currentStep >= 4) {
                controls.autoRotate = event.target.checked;
            }
        });

        addListener(window, 'resize', resize);
        window.requestAnimationFrame(() => {
            resize();
            window.requestAnimationFrame(() => {
                resize();
            });
        });

        void initType('sp3');
        resize();
        startLoop();

        return {
            resize() {
                resize();
                if (!paused) {
                    renderOnce();
                }
            },
            setPaused(nextPaused) {
                paused = Boolean(nextPaused);
                controls.enabled = !paused;
                if (paused) {
                    stopLoop();
                    return;
                }

                resize();
                controls.autoRotate = currentStep >= 4 && ui.autoRotate.checked;
                renderOnce();
                scheduleFloatingToolbarLayoutSync();
                startLoop();
            },
            destroy() {
                if (destroyed) return;
                destroyed = true;
                stopLoop();
                if (layoutSyncFrame) {
                    window.cancelAnimationFrame(layoutSyncFrame);
                    layoutSyncFrame = 0;
                }
                listeners.splice(0).forEach((cleanup) => cleanup());
                controls.dispose();
                clearGroup(atomicGroup);
                clearGroup(hybridGroup);
                clearGroup(unhybridizedGroup);
                clearGroup(bondingGroup);
                clearGroup(stickGroup);
                clearGroup(angleGroup);
                clearGroup(piGroup);
                clearGroup(lonePairGroup);
                renderer.dispose();
                renderer.domElement.remove();
            },
        };
    }

    function unmountHybridOrbitals() {
        if (window.hybridOrbitalsApp && typeof window.hybridOrbitalsApp.destroy === 'function') {
            window.hybridOrbitalsApp.destroy();
        }

        window.hybridOrbitalsApp = null;
    }

    function mountHybridOrbitals(container, options) {
        const rootElement = getHybridRoot(container);
        if (!rootElement) {
            throw new Error('Hybrid orbitals root element was not found.');
        }

        unmountHybridOrbitals();
        const instance = createHybridOrbitalsApp(rootElement, options || {});
        window.hybridOrbitalsApp = instance;
        return instance;
    }

    function autoMountStandaloneHybridOrbitals() {
        const standaloneRoot = document.querySelector('.hybrid-orbitals-shell[data-hybrid-auto-mount="true"]');
        if (!standaloneRoot || window.hybridOrbitalsApp) {
            return;
        }

        mountHybridOrbitals(standaloneRoot);
    }

    App.mountHybridOrbitals = mountHybridOrbitals;
    App.unmountHybridOrbitals = unmountHybridOrbitals;

    if (document.readyState === 'complete') {
        autoMountStandaloneHybridOrbitals();
    } else {
        window.addEventListener('load', autoMountStandaloneHybridOrbitals, { once: true });
    }
}());
