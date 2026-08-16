window.BIO_VISUAL_SCENES = window.BIO_VISUAL_SCENES || {};

window.BIO_VISUAL_SCENES["j7a_m03"] = (function () {
  // Inline models dataset derived directly from models.ts of demo app
  const MODELS = [
    {
      id: "plant-cell",
      name: "植物细胞",
      subtitle: "真核细胞 · 自养生物",
      category: "eukaryote", // eukaryote (真核与免疫)
      accent: "#10b981", // emerald
      accentGlow: "rgba(16, 185, 129, 0.25)",
      description: "植物细胞是构成植物体的基本单位。与动物细胞不同，它拥有坚硬的细胞壁、能进行光合作用的叶绿体，以及储存营养与水分的大型液泡，使其既能保持形态又能为整个生态系统提供能量。",
      size: "10 – 100 微米",
      location: "植物的根、茎、叶、花、果实",
      visibleInLM: "是",
      features: [
        { 
          name: "细胞壁", 
          detail: "由纤维素构成，提供细胞坚硬的形态支撑与机械保护。", 
          orbit: "45deg 75deg 140%", 
          target: "0m 0m 0m", 
          fov: "45deg",
          microPhoto: "assets/images/micro_cell_wall.png?v=7a7853fba8f8",
          microAnnotation: "【洋葱表皮细胞壁显微照片】\n在普通光学显微镜下，植物细胞的细胞壁呈清晰的折光性双线轮廓。它由纤维素和果胶组成，具有极高强度，构成了植物体坚硬的支撑骨架，并在维持细胞正常形态、防止细胞吸水胀破中发挥决定性作用。"
        },
        { 
          name: "叶绿体", 
          detail: "光合作用的精密场所，内含类囊体，能将光能转化为有机化学能并释放氧气。", 
          orbit: "-15deg 65deg 100%", 
          target: "0.3m 0.1m 0.2m", 
          fov: "32deg",
          microPhoto: "assets/images/micro_chloroplast.png?v=538add51f9c6",
          microAnnotation: "【叶绿体超微透射电镜照片 (TEM)】\n在透射电子显微镜下，可见清晰的双层被膜结构。内部充满折叠堆叠如硬币般的基粒类囊体薄膜（Grana）。类囊体薄膜上布满叶绿素分子，用于捕获光子、进行水分裂并合成有机物。"
        },
        { 
          name: "大液泡", 
          detail: "储存大量水分、无机盐、糖与色素，调节渗透压并维持细胞的膨压状态。", 
          orbit: "75deg 80deg 110%", 
          target: "-0.2m -0.1m -0.1m", 
          fov: "32deg",
          microPhoto: "assets/images/micro_vacuole.png?v=e826e4293b02",
          microAnnotation: "【洋葱表皮细胞液泡显微照片】\n在光学显微镜下观察紫色洋葱表皮时，巨大的中央大液泡极其醒目。其内部充满细胞液，富含花青素、糖类和无机盐。大液泡的高浓度细胞液产生强大的渗透压，吸水胀大后使植物细胞紧绷，维持植物的挺拔姿态。"
        },
        { 
          name: "细胞核", 
          detail: "真核细胞的遗传物质控制中心，储存 DNA 蓝图并调控一切代谢活动。", 
          orbit: "30deg 70deg 90%", 
          target: "0m 0.2m -0.1m", 
          fov: "28deg",
          microPhoto: "assets/images/micro_nucleus.png?v=8a454abec6b3",
          microAnnotation: "【细胞核 DAPI 荧光染色显微照片】\n利用 DAPI 荧光染料特异性结合 DNA 后，在荧光显微镜下可见细胞核呈现亮蓝色的明亮球体。细胞核拥有双层核膜 and 核孔，内部包含密集的染色质。它是控制细胞代谢、生长与分裂的控制中心。"
        },
        { 
          name: "线粒体", 
          detail: "细胞的能量工厂，通过有氧呼吸将有机物分解转化为通用的能量货币 ATP。", 
          orbit: "-110deg 75deg 100%", 
          target: "-0.4m -0.2m 0.3m", 
          fov: "28deg",
          microPhoto: "assets/images/micro_mitochondrion.png?v=34fc52782d80",
          microAnnotation: "【线粒体超微结构透射电镜图 (TEM)】\n电子显微镜下，线粒体呈现经典的椭球状。外膜光滑，内膜向内腔发生多次深度折叠，形成指状或叶片状的「线粒体嵴（Cristae）」。嵴表面密布着 ATP 合成酶，是有氧呼吸释放能量和生成 ATP 的核心场所。"
        },
        { 
          name: "内质网与高尔基体", 
          detail: "高度折叠的膜性结构，负责蛋白质和脂质的合成、加工、运输与包装分发。", 
          orbit: "120deg 60deg 100%", 
          target: "0.1m 0.3m -0.3m", 
          fov: "32deg",
          microPhoto: "assets/images/micro_er_golgi.png?v=aa9b38a7622c",
          microAnnotation: "【内质网与高尔基体透射电镜图 (TEM)】\n电镜下可见高度发达的膜性囊泡网络。粗面内质网表面附着有密密麻麻的核糖体颗粒（负责合成蛋白质），高尔基体则表现为平行的扁平囊叠，周围环绕着许多出芽的运输囊泡，负责加工、打包和分发分泌蛋白。"
        }
      ],
      funFact: "一片成熟的绿色树叶中包含数百万个叶绿体细胞器，它们让地球的每一次呼吸都变得甘甜可人。",
      whereItOccurs: "从地面的地衣苔藓到参天的松柏大树，植物细胞无处不在地构筑着陆地生态系统的基石。",
      file: "assets/models/plant-cell.glb?v=2e840d901a7e",
      cover: "assets/images/plant-cell.jpg?v=967c4505480e",
      displayScale: 1.4,
      defaultRotationY: -Math.PI / 4,
      cameraOrbit: "45deg 75deg 130%"
    },
    {
      id: "animal-cell",
      name: "动物细胞",
      subtitle: "真核细胞 · 异养生物",
      category: "eukaryote",
      accent: "#f43f5e", // rose
      accentGlow: "rgba(244, 63, 94, 0.25)",
      description: "动物细胞缺少刚性的细胞壁和叶绿体，但它们拥有更灵活多变的细胞膜与极其丰富的细胞器系统。这使它们可以相互协作，构成高度特化、能主动运动并感知外界的复杂生命有机体。",
      size: "10 – 30 微米",
      location: "所有多细胞动物的各类组织与器官中",
      visibleInLM: "是",
      features: [
        { 
          name: "细胞膜", 
          detail: "流动性的磷脂双分子层，选择性控制外界与内部物质交换，维持胞内微环境稳态。", 
          orbit: "45deg 75deg 140%", 
          target: "0m 0m 0m", 
          fov: "45deg",
          microPhoto: "assets/images/micro_cell_membrane.png?v=7ec396eea462",
          microAnnotation: "【细胞膜超微结构透射电镜图 (TEM)】\n在超高倍透射电镜下，动物细胞膜呈现出经典的「双层暗带夹明带」的三轨结构。暗带为磷脂亲水基团，明带为脂肪酸链。它作为半透性屏障，在跨膜转运、受体传导和维持胞内微环境稳态中具有决定意义。"
        },
        { 
          name: "细胞核", 
          detail: "由双层核膜包裹的遗传信息库，包含染色质与核仁，是细胞生命的中枢。", 
          orbit: "20deg 70deg 90%", 
          target: "0m 0.1m 0m", 
          fov: "28deg",
          microPhoto: "assets/images/micro_animal_nucleus.png?v=09564eaf695f",
          microAnnotation: "【动物细胞核荧光染色显微照片】\n荧光显微镜下，动物细胞核在荧光染料特异染色后呈现经典的橙红色球体，核仁清晰可见。球状的核膜内富含呈网状散布的染色质，储存着控制动物机体全部遗传、发育与代谢的核心 DNA。"
        },
        { 
          name: "线粒体", 
          detail: "双层膜细胞器，内膜向内折叠为嵴以扩大反应面积，是合成 ATP 的核心电厂。", 
          orbit: "-60deg 80deg 90%", 
          target: "-0.3m -0.2m 0.2m", 
          fov: "25deg",
          microPhoto: "assets/images/micro_animal_animal_mitochondrion.png?v=8346c9b3f62f",
          microAnnotation: "【动物线粒体超微结构透射电镜图 (TEM)】\n高倍电镜下，动物细胞内的线粒体呈现棒状或哑铃状。内膜向内深度凹陷形成密集的平行“线粒体嵴”，上面附着着无数高效进行有氧呼吸和能量合成的酶系，是有氧代谢的核心发电机房。"
        },
        { 
          name: "内质网", 
          detail: "分为附着核糖体的粗面内质网（合成蛋白质）与光滑的光面内质网（合成脂质）。", 
          orbit: "100deg 65deg 100%", 
          target: "0.2m 0.2m -0.2m", 
          fov: "30deg",
          microPhoto: "assets/images/micro_animal_er.png?v=22b353e61b58",
          microAnnotation: "【动物内质网超微透射电镜图 (TEM)】\n电镜下清晰可见密布于动物核周的粗面内质网扁平囊网络。外侧膜面上镶嵌着密集整齐的核糖体小黑点，主要负责接受 mRNA 指令并高速进行肽链合成、初步加工与蛋白质折叠。"
        },
        { 
          name: "高尔基体", 
          detail: "扁平囊状结构，主要对来自内质网的蛋白质进行最后的修饰、加工与分拣运输。", 
          orbit: "-140deg 70deg 100%", 
          target: "-0.2m 0.3m -0.1m", 
          fov: "30deg",
          microPhoto: "assets/images/micro_animal_golgi.png?v=0bdf53ebd1a1",
          microAnnotation: "【动物高尔基体超微透射电镜图 (TEM)】\n电镜下清晰呈现数个平行堆叠的弯曲扁平盘状囊泡。其凸面面向内质网接收转运囊泡，凹面边缘膨大出芽释放出许多分泌小泡，负责把蛋白质进行最后的糖基化修饰、打包并分发。"
        },
        { 
          name: "溶酶体", 
          detail: "酸性水解酶的囊泡，相当于细胞内的“回收站”，负责消化分解代谢废物与衰老细胞器。", 
          orbit: "10deg 85deg 80%", 
          target: "0.4m -0.1m 0.1m", 
          fov: "25deg",
          microPhoto: "assets/images/micro_lysosome.png?v=f8359ac5042b",
          microAnnotation: "【溶酶体超微结构透射电镜图 (TEM)】\n溶酶体是单层膜包裹的球形或椭球形微体，内部充满了致密的强酸性水解酶群（最适 pH 约 5.0）。它能与衰老的细胞器或吞噬小泡融合，充当细胞内的“垃圾清运回收站”。"
        }
      ],
      funFact: "一个成年人的体内大约生活着 37 万亿个动物细胞，每一秒钟它们都在悄无声息地进行着上百万次化学协作。",
      whereItOccurs: "从小型的单细胞变形虫到翱翔天空的飞鸟，所有动物的组织和器官均由不同类型的动物细胞特化构成。",
      file: "assets/models/animal-cell.glb?v=42ca8478bddc",
      cover: "assets/images/animal-cell.jpg?v=2806b7572ccb",
      displayScale: 1.4,
      defaultRotationY: -Math.PI / 4,
      cameraOrbit: "45deg 75deg 130%"
    },
    {
      id: "white-blood-cell",
      name: "白细胞",
      subtitle: "特化免疫细胞 · 身体防线卫士",
      category: "eukaryote",
      accent: "#a855f7", // purple
      accentGlow: "rgba(168, 85, 247, 0.25)",
      description: "白细胞是血液与免疫系统中的关键战斗员。它们在血管和淋巴网中时刻巡逻，拥有阿米巴样变形运动能力，可穿透血管壁奔赴受损或受感染的组织，强力消灭一切外来病原体。",
      size: "6 – 20 微米",
      location: "血液系统、淋巴系统、骨髓及各类受损组织中",
      visibleInLM: "是",
      features: [
        { 
          name: "变形与伪足", 
          detail: "细胞骨架的动态重排使白细胞能伸出伪足进行主动变形移动，便于穿越微血管壁。", 
          orbit: "-30deg 80deg 120%", 
          target: "0.4m 0.2m 0.3m", 
          fov: "35deg",
          microPhoto: "assets/images/micro_wbc_pseudopod.png?v=145754692e05",
          microAnnotation: "【白细胞迁移扫描电镜照片 (SEM)】\n扫描电镜下，可见白细胞（如巨噬细胞）表面布满波浪状的膜褶皱，并向前方伸出宽大的网状伪足。通过细胞骨架肌动蛋白纤维的极速组装，它们能在组织间隙中作阿米巴样游走吞噬病原。"
        },
        { 
          name: "分叶细胞核", 
          detail: "其细胞核常常呈现独特的多叶状或不规则马蹄形，便于细胞在狭窄间隙内挤压通过。", 
          orbit: "40deg 75deg 90%", 
          target: "0m 0m 0m", 
          fov: "28deg",
          microPhoto: "assets/images/micro_wbc_nucleus.png?v=bece3629ddb9",
          microAnnotation: "【中性粒细胞分叶核染色照片】\n在瑞氏染色的外周血涂片下，典型的中性粒细胞呈现出极富特色的分叶状细胞核（通常分为 2-5 叶，由细丝相连）。这种高度可弯折的分叶结构，极大地便利了其穿过狭窄的毛细血管壁间隙。"
        },
        { 
          name: "吞噬小泡", 
          detail: "包围并内吞外来的细菌、病毒或坏死碎片，将其锁入小泡后启动酶学水解消化。", 
          orbit: "-90deg 70deg 90%", 
          target: "-0.3m -0.1m 0.2m", 
          fov: "28deg",
          microPhoto: "assets/images/micro_wbc_phagosome.png?v=a38e41a95f85",
          microAnnotation: "【白细胞吞噬小泡超微透射电镜照 (TEM)】\n高分辨率透射电镜下，巨噬细胞伸出的伪足已完全合拢，将外来入侵的细菌包裹封闭在双层脂质膜构成的囊泡——吞噬小泡（Phagosome）中，阻止细菌在胞质内逃逸与增殖。"
        },
        { 
          name: "溶酶体颗粒", 
          detail: "含有极其丰富的强效水解酶与抗菌肽，能够以脱颗粒的方式快速杀灭入侵病原。", 
          orbit: "120deg 80deg 95%", 
          target: "0.2m -0.3m -0.2m", 
          fov: "25deg",
          microPhoto: "assets/images/micro_wbc_granules.png?v=3ed0b577584b",
          microAnnotation: "【白细胞特异性免疫分泌颗粒电镜图 (TEM)】\n白细胞胞质中密布着两类特异性杀伤颗粒。内部富含髓过氧化物酶、溶菌酶、酸性水解酶和防卫素等强效化学武器，在接触病原体时会爆发出杀伤性脱颗粒反应将其消灭。"
        },
        { 
          name: "线粒体", 
          detail: "密集分布在活动伪足后侧，持续提供变形运动和免疫吞噬反应所需的庞大 ATP 能量。", 
          orbit: "160deg 60deg 90%", 
          target: "-0.2m 0.3m -0.3m", 
          fov: "25deg",
          microPhoto: "assets/images/micro_wbc_mitochondrion.png?v=c3d732b8c5b1",
          microAnnotation: "【白细胞动力线粒体超微透射电镜图 (TEM)】\n由于白细胞需要消耗极高的能量进行高速变形爬行、伸出伪足和剧烈的吞噬爆发，其胞质中分布着特化的长柱状动力线粒体，时刻为其提供高效充足的 ATP 动力支撑。"
        }
      ],
      funFact: "人体骨髓每天能生成超过 1000 亿个新的白细胞，在发生剧烈感染时，其生成速率还会瞬间翻倍。",
      whereItOccurs: "在人体的每一滴鲜红血液和透明淋巴液中，都游弋巡逻着以千万计的白细胞，筑起人体的防线。",
      file: "assets/models/white-blood-cell.glb?v=10854c910fcb",
      cover: "assets/images/white-blood-cell.jpg?v=e41ffdd46a6f",
      displayScale: 1.4,
      defaultRotationY: -Math.PI / 4,
      cameraOrbit: "50deg 70deg 130%"
    },
    {
      id: "neuron",
      name: "神经元",
      subtitle: "可兴奋细胞 · 神经网络核心",
      category: "eukaryote",
      accent: "#f97316", // orange
      accentGlow: "rgba(249, 115, 22, 0.25)",
      description: "神经元是神经系统的基本结构与功能单位。它们拥有极长的形态突起，像导线一样交织成高度复杂的全息网络，利用膜电位变化和化学神经递质极速传递、整合 biological 信号。",
      size: "胞体 4 – 100 微米，轴突可长达 1 米",
      location: "中枢神经系统（脑、脊髓）及周围神经节中",
      visibleInLM: "是",
      features: [
        { 
          name: "细胞体 (Soma)", 
          detail: "包含细胞核与大部分代谢性细胞器，是神经元进行蛋白质合成与信号整合的总部。", 
          orbit: "-35deg 80deg 100%", 
          target: "0m 0m 0m", 
          fov: "35deg",
          microPhoto: "assets/images/micro_neuron_soma.png?v=4ee477bc568e",
          microAnnotation: "【银染神经元胞体光学显微照片】\n利用经典的戈尔吉银盐浸润染色法，在普通光镜下可见星芒状或多角形的庞大神经元胞体。胞体中央有明亮的圆形核，周围胞质内布满呈深色斑块状的尼氏体（密集的粗面内质网与游离核糖体群）。"
        },
        { 
          name: "树突 (Dendrites)", 
          detail: "呈繁茂的树状分支，专门用于接收来自其他成千上万个神经元释放的突触信号。", 
          orbit: "-10deg 70deg 130%", 
          target: "-0.3m 0.4m 0.2m", 
          fov: "40deg",
          microPhoto: "assets/images/micro_neuron_dendrites.png?v=7bc78d037077",
          microAnnotation: "【大脑皮层神经元树突分支荧光显微图】\n利用绿色荧光蛋白（GFP）特异性标记后，在荧光显微镜下清晰可见树突呈极其繁茂的树枝状分支。树突的膜表面布满成千上万个微小的树突棘突起，是有用信息输入的主要“信号接收天线”。"
        },
        { 
          name: "轴突 (Axon)", 
          detail: "单条细长的轴状突起，负责将整合后的动作电位极速传导至远端的靶器官或下一个神经元。", 
          orbit: "-135deg 75deg 120%", 
          target: "0.8m -0.4m -0.4m", 
          fov: "45deg",
          microPhoto: "assets/images/micro_neuron_axon.png?v=e5b2e56746c5",
          microAnnotation: "【神经轴突纵切面超微电镜图 (TEM)】\n高倍透射电镜下可见轴突内部富含高度平行的微管和神经丝。这些平行的骨架纤维构成了神经元内部的“高速铁路”，利用分子马达蛋白将胞体合成的化学递质囊泡快速向远端运送。"
        },
        { 
          name: "髓鞘 (Myelin Sheath)", 
          detail: "由施旺细胞缠绕构成的绝缘层，使动作电位可在跳跃传导下实现极速前行。", 
          orbit: "-135deg 80deg 80%", 
          target: "0.6m -0.3m -0.3m", 
          fov: "30deg",
          microPhoto: "assets/images/micro_myelin_sheath.png?v=6166477ec373",
          microAnnotation: "【神经髓鞘横断面超微电镜图 (TEM)】\n施旺细胞质膜紧密包绕着神经轴突，在横断面上呈现如年轮般的同心圆多层绝缘脂质膜屏障。这层高阻抗髓鞘能彻底阻止离子泄漏，使电信号得以在轴突上进行跳跃式快速传导。"
        },
        { 
          name: "突触 (Synapse)", 
          detail: "轴突末端的特殊接头，通过释放微小的化学递质将电脉冲信号跨缝隙传递至下游。", 
          orbit: "-160deg 85deg 80%", 
          target: "1.2m -0.6m -0.6m", 
          fov: "30deg",
          microPhoto: "assets/images/micro_synapse.png?v=26b3ebd61407",
          microAnnotation: "【神经突触超微透射电镜图 (TEM)】\n在十几万倍电镜下，可见膨大的轴突末梢（突触前膜）中聚集着大量充满神经递质的球形突触小泡。前膜与后膜之间有一道约 20nm 宽的突触间隙，是实现电信号向化学信号转换的精密阀门。"
        }
      ],
      funFact: "人脑拥有约 860 亿个神经元，彼此之间产生的突触连接超过 100 万亿个，比银河系恒星总数还要庞大得多。",
      whereItOccurs: "从中枢的大脑皮层、脊髓通路到分布于四肢内脏的周围神经丛，神经元时刻编织着智能与感觉。",
      file: "assets/models/neuron.glb?v=b6a5c174b0fd",
      cover: "assets/images/neuron.jpg?v=d5ee4e873789",
      displayScale: 1.8,
      defaultRotationY: -Math.PI / 4,
      cameraOrbit: "-35deg 80deg 140%"
    },
    {
      id: "dna",
      name: "DNA 双螺旋",
      subtitle: "生命遗传大分子 · 信息蓝图",
      category: "organelle", // organelle (细胞器与蓝图)
      accent: "#3b82f6", // blue
      accentGlow: "rgba(59, 130, 246, 0.25)",
      description: "DNA（脱氧核糖核酸）是生命体中承载核心遗传密码的生物大分子。两条反向平行的多核苷酸链以优雅的双螺旋形态缠绕在一起，将亿万年演化而来的生存指令写成四个神奇的化学碱基字母。",
      size: "双螺旋结构直径约 2 纳米",
      location: "细胞核、线粒体基质与叶绿体基质中",
      visibleInLM: "仅电镜可见",
      features: [
        { 
          name: "磷酸-糖骨架", 
          detail: "由脱氧核糖和磷酸交替以共价键连结形成的外侧支架，坚固地保护内侧的碱基序列。", 
          orbit: "0deg 90deg 110%", 
          target: "0m 0m 0m", 
          fov: "40deg",
          microPhoto: "assets/images/micro_dna_backbone.png?v=33ddc5701413",
          microAnnotation: "【DNA 磷酸-糖骨架高分辨率分子模型图】\n在分子建模下，外侧由交替排列的脱氧核糖和磷酸基团组成的骨架清晰呈螺旋上升通道。骨架带有强负电荷，极具极性与水溶性，为内侧脆弱的碱基序列构筑了铜墙铁壁般的物理与化学护盾。"
        },
        { 
          name: "碱基互补配对", 
          detail: "内侧的四种碱基通过氢键精准配对，腺嘌呤(A)恒配胸腺嘧啶(T)，鸟嘌呤(G)恒配胞嘧啶(C)。", 
          orbit: "45deg 80deg 70%", 
          target: "0m 0.1m 0m", 
          fov: "25deg",
          microPhoto: "assets/images/micro_dna_base_pairing.png?v=863eda561919",
          microAnnotation: "【A-T 与 G-C 碱基配对氢键交联图】\n双螺旋内侧平行的化学碱基对原子模型。可见腺嘌呤(A)与胸腺嘧啶(T)之间通过2个氢键几何契合，而鸟嘌呤(G)与胞嘧啶(C)之间则通过3个更强的氢键结合，是有机遗传稳定的基石。"
        },
        { 
          name: "大沟与小沟", 
          detail: "双螺旋外侧形成的深浅不一的螺旋凹槽，是特定转录因子和蛋白质识别与结合的物理通道。", 
          orbit: "90deg 90deg 90%", 
          target: "0m -0.2m 0m", 
          fov: "30deg",
          microPhoto: "assets/images/micro_dna_grooves.png?v=6a154dd72c4f",
          microAnnotation: "【DNA 大沟与小沟表面三维电性分布图】\n由于糖苷键结合的不对称夹角，双螺旋外表面形成了深浅宽窄截然不同的两条螺旋槽。宽而深的称为大沟（Major groove），是有机转录因子和调控蛋白主要特异识别结合的物理通道。"
        },
        { 
          name: "半保留复制", 
          detail: "解旋酶将螺旋解开后，每一条旧单链都作为模板精准合成一条互补新链，完美实现遗传信息的代际传递。", 
          orbit: "-45deg 70deg 100%", 
          target: "0m 0.3m 0m", 
          fov: "35deg",
          microPhoto: "assets/images/micro_dna_replication.png?v=ea61105e1740",
          microAnnotation: "【DNA 复制叉活动分子微观图】\n模型展示了正在高速复制中的 DNA 呈现 Y 字形的“复制叉 (Replication fork)”。DNA聚合酶以解开的两条亲代链为模板，遵循碱基配对原则合成两条互补的新链，保留一半旧链作为传代根基。"
        }
      ],
      funFact: "若将一个微小细胞里的所有 DNA 拉直，其总长度约为 2 米；而你全身上下所有细胞内的 DNA 拼接起来，足以在地球与太阳之间往返数百次。",
      whereItOccurs: "从数十亿年前的远古单细胞细菌，到如今构成大千世界的所有高等动植物，DNA 静静守护着最初的繁衍密码。",
      file: "assets/models/dna.glb?v=50bd24059cfb",
      cover: "assets/images/dna.jpg?v=b274721b3b18",
      displayScale: 1.2,
      defaultRotationY: 0,
      cameraOrbit: "0deg 90deg 110%"
    },
    {
      id: "mitochondrion",
      name: "线粒体",
      subtitle: "双膜能量细胞器 · 动力车间",
      category: "organelle",
      accent: "#f97316", // orange
      accentGlow: "rgba(249, 115, 22, 0.25)",
      description: "线粒体是真核细胞中有氧呼吸和产生能量的主力细胞器。它能够分解释放有机物中的化学能，并将其高效打包成细胞所需的“硬通货” ATP 分子，被科学家形象地称为真核细胞的“发电机房”。",
      size: "长 1 – 10 微米，宽 0.5 – 1 微米",
      location: "分布在几乎所有真核细胞的细胞质基质中",
      visibleInLM: "是",
      features: [
        { 
          name: "光滑外膜", 
          detail: "光滑、高度通透的双脂层外膜，含有大量孔道蛋白，允许小分子物质自由扩散进入。", 
          orbit: "-60deg 75deg 130%", 
          target: "0m 0m 0m", 
          fov: "45deg",
          microPhoto: "assets/images/micro_mito_outer_membrane.png?v=8ce8487c7df8",
          microAnnotation: "【线粒体光滑外膜超微透射电镜照 (TEM)】\n高倍透射电镜下可清晰观测到线粒体外围极其平滑、均匀的外脂膜。它含有很多被称为孔道蛋白（Porin）的特殊整合蛋白通道，允许丙酮酸、ADP等小分子自由渗透进入膜间腔。"
        },
        { 
          name: "内膜与线粒体嵴", 
          detail: "内膜高度特化，向内多次凹陷折叠形成“嵴”，极大地增加了有氧呼吸酶和 ATP 合成酶的附着面积。", 
          orbit: "-30deg 70deg 90%", 
          target: "-0.1m 0.1m 0.1m", 
          fov: "30deg",
          microPhoto: "assets/images/micro_mito_cristae.png?v=f6709d74d37c",
          microAnnotation: "【线粒体嵴超微结构透射电镜图 (TEM)】\n电镜下，线粒体内膜向内深度凹陷折叠成密集的平板状“嵴 (Cristae)”。由于嵴极大地拓宽了膜表面积，其上密布着电子传递链复合体与有氧呼吸酶，是有氧呼吸第三阶段制造巨量 ATP 的主轴核心。"
        },
        { 
          name: "线粒体基质", 
          detail: "内膜包围的胶状流体，含有三羧酸循环所需的各种酶，是分解释放 CO₂ 和提取高能电子的温床。", 
          orbit: "45deg 75deg 90%", 
          target: "0.1m -0.1m -0.1m", 
          fov: "30deg",
          microPhoto: "assets/images/micro_mito_matrix.png?v=57b71727be00",
          microAnnotation: "【线粒体胶状基质高倍透析电镜图 (TEM)】\n内膜包裹的致密半流动态液态空间。基质内富含参与三羧酸循环（TCA cycle）的全部可溶性多肽酶、二价金属离子、转录调节因子等，在此将丙酮酸脱羧分解并释放出 CO₂ 的温床。"
        },
        { 
          name: "线粒体 DNA", 
          detail: "含有独立的环状双链 DNA 与核糖体，能自主进行部分蛋白质翻译，符合内共生演化假说。", 
          orbit: "10deg 80deg 80%", 
          target: "0m 0.2m 0.1m", 
          fov: "25deg",
          microPhoto: "assets/images/micro_mitochondrion_dna.png?v=ee4c52dfb422",
          microAnnotation: "【纯化线粒体 DNA 双螺旋环状电镜图】\n透射电镜下可见裸露呈环状分布的 mtDNA 细线双环。其结构与真核细胞核的线性染色体截然不同，反而与大肠杆菌等需氧原核生物极为相似，是支持“内共生学说”演化的终极分子铁证。"
        }
      ],
      funFact: "线粒体在演化史中曾是独立的需氧细菌，在数十亿年前被厌氧古真核细胞吞入后没有被消化，反而形成了完美的终身互利共生关系。",
      whereItOccurs: "活跃在几乎所有真核动植物细胞中，特别是在心肌、骨骼肌、飞翔鸟类的胸肌等耗能极端旺盛的组织中最为密集。",
      file: "assets/models/mitochondrion.glb?v=a99693b04cdf",
      cover: "assets/images/mitochondrion.jpg?v=6e0a4271f88e",
      displayScale: 1.4,
      defaultRotationY: -Math.PI / 4,
      cameraOrbit: "-60deg 75deg 130%"
    },
    {
      id: "chloroplast",
      name: "叶绿体",
      subtitle: "双膜自养细胞器 · 绿色工厂",
      category: "organelle",
      accent: "#10b981", // emerald
      accentGlow: "rgba(16, 185, 129, 0.25)",
      description: "叶绿体是绿色植物与藻类所特有的产能细胞器，也是地球生命赖以生存的“绿色引擎”。它能精准捕获来自太阳的光子，将空气中的二氧化碳与根部吸收的水分，魔术般地转化为高能糖类分子并慷慨地释放出氧气。",
      size: "长 5 – 10 微米，宽 2 – 4 微米",
      location: "绿色植物的叶肉细胞、幼嫩茎秆以及某些藻类细胞中",
      visibleInLM: "是",
      features: [
        { 
          name: "双层被膜", 
          detail: "由外膜和内膜组成，起物理阻隔和物质选择通透作用，维持叶绿体内环境相对独立。", 
          orbit: "-60deg 75deg 130%", 
          target: "0m 0m 0m", 
          fov: "45deg",
          microPhoto: "assets/images/micro_chloro_envelope.png?v=50aed8aba6b2",
          microAnnotation: "【叶绿体双层被膜高解析透射电镜照 (TEM)】\n高倍透射电镜下可以清晰观察到两条平整、间距均匀的平行脂质双膜被膜。它们在物理阻隔和选择性通透上起到严密管控，确保卡尔文循环所需的各种光合酶维持在极高浓度。"
        },
        { 
          name: "类囊体薄膜", 
          detail: "囊状的膜系统，密布着吸收光能的叶绿素和胡萝卜素，是光反应（水分裂释放 O₂）的精密舞台。", 
          orbit: "-20deg 65deg 100%", 
          target: "0.1m 0.1m 0.2m", 
          fov: "32deg",
          microPhoto: "assets/images/micro_chloro_thylakoid.png?v=a426e11b128a",
          microAnnotation: "【叶绿体类囊体薄膜超微结构透射电镜图 (TEM)】\n电镜下可见平行穿梭于叶绿体基质中的扁平管囊状类囊体膜。类囊体薄膜上密集镶嵌着光系统复合体与叶绿素分子，用于捕获光子、进行光反应水的光解并生成氧气。"
        },
        { 
          name: "类囊体基粒 (Grana)", 
          detail: "扁平囊状的类囊体像一叠硬币一样整齐堆叠在一起，极大地扩展了进行光电转换的膜受光面积。", 
          orbit: "30deg 80deg 80%", 
          target: "-0.2m -0.1m -0.1m", 
          fov: "25deg",
          microPhoto: "assets/images/micro_chloro_grana.png?v=ab5fe6a8ca7c",
          microAnnotation: "【叶绿体类囊体基粒叠层高倍电镜图 (TEM)】\n多个扁平盘状类囊体囊袋像硬币般极其致密地堆叠成圆柱形基粒。这种神奇的物理堆叠，呈指数级放大了光合色素的膜捕光表面积，使照进叶片里的光子能被极限捕获吸收。"
        },
        { 
          name: "叶绿体基质", 
          detail: "富含大量催化碳固定酶的液态空间，是 CO₂ 在光反应产生的能量推动下还原为糖类分子的暗反应场所。", 
          orbit: "120deg 70deg 90%", 
          target: "0m 0m 0m", 
          fov: "30deg",
          microPhoto: "assets/images/micro_chloro_stroma.png?v=1c51601cd462",
          microAnnotation: "【叶绿体基质高解析透射电镜图 (TEM)】\n在基粒叠层之间充斥的流动性无色液态基质空间。基质是暗反应（卡尔文碳循环）的专属场所，溶解有极高浓度的 1,5-二磷酸核酮糖羧化酶（Rubisco）酶群，在此将二氧化碳固定还原为糖类。"
        },
        { 
          name: "叶绿体 DNA", 
          detail: "拥有独立的核酸指令系统，能半自主表达内部代谢所需的关键催化酶，起源于远古的自养蓝细菌。", 
          orbit: "-45deg 80deg 80%", 
          target: "0.2m 0.1m -0.2m", 
          fov: "25deg",
          microPhoto: "assets/images/micro_chloroplast_dna.png?v=1c9abaa96bdc",
          microAnnotation: "【分离自植物叶绿体的环状 cpDNA 电镜图】\n透射电镜下可见独立裸露环绕的叶绿体双链环状 cpDNA 质粒环。它证明了叶绿体和线粒体一样起源于数十亿年前的被真核细胞吞入的原始光合蓝细菌（内共生学说），是自养遗传学史的终极明证。"
        }
      ],
      funFact: "地球大气中几乎 100% 的氧气，都是由无数叶绿体中的类囊体薄膜在亿万年间通过光合作用制造出来的，维持着整个生物圈的呼吸。",
      whereItOccurs: "凡是能借光能自养的真核植物与藻类体内都藏有叶绿体，它是构筑全球碳-氧循环的关键枢纽。",
      file: "assets/models/chloroplast.glb?v=66e9f7ba98dc",
      cover: "assets/images/chloroplast.jpg?v=daf373732740",
      displayScale: 1.4,
      defaultRotationY: -Math.PI / 4,
      cameraOrbit: "-60deg 75deg 130%"
    }
  ];

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function loadModelViewer() {
    if (window.BiologyApp && typeof window.BiologyApp.loadBiologyModelViewer === "function") {
      return window.BiologyApp.loadBiologyModelViewer();
    }
    if (window.customElements && window.customElements.get("model-viewer")) {
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }

  return {
    mount: function mount(container, context) {
      const sceneEntry = context && context.sceneEntry ? context.sceneEntry : null;
      const externalPanel = context && context.externalPanel && context.externalPanel.nodeType === 1
        ? context.externalPanel
        : null;

      const sceneId = "cell-workshop-" + Math.random().toString(36).slice(2, 9);
      const controller = typeof AbortController === "function" ? new AbortController() : null;
      const listeners = [];

      container.innerHTML = "";
      container.style.position = "relative";
      container.style.width = "100%";
      container.style.height = "100%";
      container.style.overflow = "hidden";
      container.setAttribute("data-scope", sceneId);

      // Shared Interactive State
      const state = {
        activeModelId: MODELS[0].id,
        activeCategory: "eukaryote", // "eukaryote" or "organelle"
        selectedFeatureIndex: -1, // -1 means none
        autoRotate: false
      };

      // 1. Sleek Glassmorphism CSS System
      const style = document.createElement("style");
      style.textContent = `
        [data-scope="${sceneId}"] {
          position: relative;
          color: #f1f5f9;
          font-family: 'Inter', 'Noto Sans SC', sans-serif;
          background: radial-gradient(circle at 15% 15%, #0e1e17 0%, #060c09 100%);
        }

        [data-scope="${sceneId}"] * {
          box-sizing: border-box;
        }

        [data-scope="${sceneId}"] .sim-container {
          width: 100%;
          height: 100%;
          padding: 16px;
        }

        [data-scope="${sceneId}"] .sim-frame {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 28px;
          overflow: hidden;
          border: 1px solid rgba(16, 185, 129, 0.25);
          background: radial-gradient(circle at 50% 50%, rgba(10, 25, 20, 0.7) 0%, rgba(3, 8, 6, 0.95) 100%);
          box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.6), 0 20px 50px rgba(0, 0, 0, 0.4);
        }

        [data-scope="${sceneId}"] .sim-grid-overlay {
          position: absolute;
          inset: 0;
          background: 
            linear-gradient(transparent 98%, rgba(16, 185, 129, 0.03) 100%),
            linear-gradient(90deg, transparent 98%, rgba(16, 185, 129, 0.03) 100%);
          background-size: 50px 50px;
          pointer-events: none;
          opacity: 0.8;
          z-index: 1;
        }

        [data-scope="${sceneId}"] .sim-ambient-glow {
          position: absolute;
          width: 60%;
          height: 60%;
          left: 20%;
          top: 20%;
          border-radius: 50%;
          background: radial-gradient(circle, var(--accent-glow) 0%, transparent 70%);
          filter: blur(80px);
          pointer-events: none;
          z-index: 1;
          transition: background 0.8s ease-in-out;
        }

        [data-scope="${sceneId}"] .sim-viewer-wrap {
          position: absolute;
          inset: 0;
          z-index: 2;
        }

        [data-scope="${sceneId}"] .sim-viewer {
          width: 100%;
          height: 100%;
          outline: none;
          background: transparent;
        }

        [data-scope="${sceneId}"] .sim-viewer-tip {
          position: absolute;
          left: 24px;
          bottom: 24px;
          z-index: 5;
          font-size: 11px;
          color: rgba(241, 245, 249, 0.45);
          letter-spacing: 0.06em;
          pointer-events: none;
        }

        [data-scope="${sceneId}"] .sim-controls {
          position: absolute;
          right: 24px;
          bottom: 24px;
          z-index: 5;
          display: flex;
          gap: 12px;
        }

        [data-scope="${sceneId}"] .sim-btn {
          appearance: none;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(10, 10, 12, 0.6);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          color: #e2e8f0;
          border-radius: 16px;
          padding: 10px 16px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.25s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        [data-scope="${sceneId}"] .sim-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: var(--accent-color);
          transform: translateY(-2px);
        }

        [data-scope="${sceneId}"] .sim-btn.active {
          background: var(--accent-color);
          color: #042f1a;
          border-color: var(--accent-color);
          box-shadow: 0 0 15px var(--accent-color);
        }

        /* Scientific Microscope Modal System */
        [data-scope="${sceneId}"] .micro-photo-modal {
          position: absolute;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        [data-scope="${sceneId}"] .micro-photo-modal.active {
          opacity: 1;
          pointer-events: auto;
        }

        [data-scope="${sceneId}"] .micro-modal-bg {
          position: absolute;
          inset: 0;
          background: rgba(4, 10, 8, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        [data-scope="${sceneId}"] .micro-modal-content {
          position: relative;
          z-index: 101;
          width: 100%;
          max-width: 520px;
          background: rgba(14, 26, 20, 0.95);
          border: 1px solid rgba(16, 185, 129, 0.35);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 25px 60px rgba(0,0,0,0.6), 0 0 40px rgba(16, 185, 129, 0.2);
          transform: translateY(20px) scale(0.95);
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          display: flex;
          flex-direction: column;
        }

        [data-scope="${sceneId}"] .micro-photo-modal.active .micro-modal-content {
          transform: translateY(0) scale(1);
        }

        [data-scope="${sceneId}"] .micro-modal-header {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(16, 185, 129, 0.2);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(0, 0, 0, 0.25);
        }

        [data-scope="${sceneId}"] .micro-modal-title {
          font-size: 14px;
          font-weight: 900;
          color: #f8fafc;
          letter-spacing: -0.01em;
          border-left: 3px solid #10b981;
          padding-left: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        [data-scope="${sceneId}"] .micro-modal-close {
          appearance: none;
          background: transparent;
          border: none;
          color: rgba(241, 245, 249, 0.5);
          font-size: 24px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
        }

        [data-scope="${sceneId}"] .micro-modal-close:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }

        [data-scope="${sceneId}"] .micro-modal-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: 480px;
          overflow-y: auto;
        }

        [data-scope="${sceneId}"] .micro-modal-img-wrap {
          width: 100%;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          aspect-ratio: 1.5;
        }

        [data-scope="${sceneId}"] .micro-modal-img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        [data-scope="${sceneId}"] .micro-modal-annotation {
          font-size: 13px;
          line-height: 1.65;
          color: #cbd5e1;
          background: rgba(0, 0, 0, 0.25);
          border-radius: 14px;
          padding: 12px 14px;
          border-left: 3px solid #10b981;
        }

        /* Right Side Panel Scopes */
        .panel-mount-${sceneId} {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow-y: auto;
          padding: 16px;
          scrollbar-width: none; /* Firefox */
        }
        .panel-mount-${sceneId}::-webkit-scrollbar {
          display: none; /* Safari and Chrome */
        }

        .panel-mount-${sceneId} .p-card {
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .panel-mount-${sceneId} .p-category-tabs {
          display: flex;
          width: 100%;
          background: rgba(0, 0, 0, 0.35);
          border-radius: 14px;
          padding: 4px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .panel-mount-${sceneId} .p-tab-btn {
          flex: 1;
          appearance: none;
          background: transparent;
          border: none;
          color: rgba(241, 245, 249, 0.5);
          font-size: 12px;
          font-weight: 900;
          padding: 10px 0;
          cursor: pointer;
          border-radius: 10px;
          transition: all 0.2s ease;
          text-align: center;
        }

        .panel-mount-${sceneId} .p-tab-btn.active {
          background: rgba(255, 255, 255, 0.06);
          color: #f8fafc;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .panel-mount-${sceneId} .p-models-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .panel-mount-${sceneId} .p-model-btn {
          appearance: none;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 10px 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.25s ease;
          text-align: left;
          width: 100%;
          min-width: 0;
        }

        .panel-mount-${sceneId} .p-model-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.15);
          transform: scale(1.02);
        }

        .panel-mount-${sceneId} .p-model-btn.active {
          border-color: var(--theme-accent);
          background: var(--theme-accent-glow);
          box-shadow: 0 4px 20px var(--theme-accent-glow);
        }

        .panel-mount-${sceneId} .p-model-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--theme-accent);
          flex-shrink: 0;
          box-shadow: 0 0 8px var(--theme-accent);
        }

        .panel-mount-${sceneId} .p-model-btn-text {
          font-size: 13px;
          font-weight: 800;
          color: rgba(241, 245, 249, 0.7);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .panel-mount-${sceneId} .p-model-btn.active .p-model-btn-text {
          color: #f8fafc;
        }

        .panel-mount-${sceneId} .p-metadata {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 4px;
        }

        .panel-mount-${sceneId} .p-meta-pill {
          display: inline-flex;
          flex-direction: column;
          flex: 1;
          min-width: 80px;
          border-radius: 12px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          padding: 8px 10px;
          gap: 4px;
        }

        .panel-mount-${sceneId} .p-meta-label {
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(241, 245, 249, 0.35);
        }

        .panel-mount-${sceneId} .p-meta-val {
          font-size: 11px;
          font-weight: 900;
          color: #f1f5f9;
        }

        .panel-mount-${sceneId} .p-info-title {
          font-size: 18px;
          font-weight: 900;
          color: #f8fafc;
          letter-spacing: -0.01em;
          border-left: 3px solid var(--theme-accent);
          padding-left: 8px;
        }

        .panel-mount-${sceneId} .p-info-desc {
          font-size: 13px;
          line-height: 1.65;
          color: rgba(241, 245, 249, 0.7);
        }

        .panel-mount-${sceneId} .p-fact-box {
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(245, 158, 11, 0.03) 100%);
          border: 1px solid rgba(251, 191, 36, 0.15);
          padding: 12px 14px;
          display: flex;
          gap: 10px;
        }

        .panel-mount-${sceneId} .p-fact-icon {
          color: #fbbf24;
          font-size: 16px;
          font-weight: 900;
          margin-top: 1px;
          flex-shrink: 0;
        }

        .panel-mount-${sceneId} .p-fact-text {
          font-size: 12px;
          line-height: 1.6;
          color: #fde68a;
          font-weight: 500;
        }

        .panel-mount-${sceneId} .p-features-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .panel-mount-${sceneId} .p-feature-item {
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(255, 255, 255, 0.01);
          padding: 12px 16px;
          cursor: pointer;
          transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .panel-mount-${sceneId} .p-feature-item:hover {
          background: var(--theme-accent-glow);
          border-color: var(--theme-accent);
          transform: translateX(4px);
        }

        .panel-mount-${sceneId} .p-feature-name {
          font-size: 14px;
          font-weight: 800;
          color: rgba(241, 245, 249, 0.95);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .panel-mount-${sceneId} .p-feature-name::before {
          content: '';
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--theme-accent);
          display: inline-block;
          box-shadow: 0 0 6px var(--theme-accent);
        }

        .panel-mount-${sceneId} .p-feature-action-label {
          font-size: 11px;
          font-weight: 800;
          color: var(--theme-accent);
          display: flex;
          align-items: center;
          gap: 4px;
          opacity: 0.85;
          transition: opacity 0.2s;
        }

        .panel-mount-${sceneId} .p-feature-item:hover .p-feature-action-label {
          opacity: 1;
        }

        .panel-mount-${sceneId} .p-eyebrow {
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(241, 245, 249, 0.35);
        }

        @media (max-width: 768px) {
          .panel-mount-${sceneId} .p-models-grid {
            grid-template-columns: 1fr;
          }
        }
      `;
      document.head.appendChild(style);

      let legacyPanelRoot = null;
      let hiddenAsideContent = null;
      let panelHost = externalPanel;

      // Locate side panel hook
      if (!panelHost) {
        const mainElement = container.closest("main");
        if (mainElement) {
          const asideElement = mainElement.querySelector("[data-courseware-aside='true']");
          if (asideElement) {
            hiddenAsideContent = asideElement.firstElementChild || null;
            if (hiddenAsideContent) {
              hiddenAsideContent.style.display = "none";
            }
            legacyPanelRoot = document.createElement("div");
            legacyPanelRoot.className = "panel-mount-" + sceneId;
            asideElement.appendChild(legacyPanelRoot);
            panelHost = legacyPanelRoot;
          }
        }
      }

      function addListener(target, eventName, handler, options) {
        if (!target || typeof target.addEventListener !== "function") return;
        if (controller) {
          const nextOptions = Object.assign({}, options || {}, { signal: controller.signal });
          target.addEventListener(eventName, handler, nextOptions);
        } else {
          target.addEventListener(eventName, handler, options || false);
          listeners.push(function () {
            target.removeEventListener(eventName, handler, options || false);
          });
        }
      }

      function getBasePath() {
        return sceneEntry ? sceneEntry.folder + "/" : "";
      }

      function resolvePath(path) {
        if (!path) return "";
        if (window.BiologyApp && typeof window.BiologyApp.resolveBiologyMediaPath === 'function') {
          return window.BiologyApp.resolveBiologyMediaPath(path);
        }
        return getBasePath() + path;
      }

      function resolveModelPath(path) {
        if (!path) return "";
        const basePath = getBasePath();
        const source = basePath + path;
        if (window.BiologyApp && typeof window.BiologyApp.resolveBiologyModelVariantSource === "function") {
          return window.BiologyApp.resolveBiologyModelVariantSource(source);
        }
        return source;
      }

      function getActiveModel() {
        return MODELS.find(function(m) { return m.id === state.activeModelId; }) || MODELS[0];
      }

      function findViewer() {
        return container.querySelector("model-viewer");
      }

      // 2. High-Fidelity Simulator Render on the Left
      function renderStage() {
        const model = getActiveModel();
        const basePath = getBasePath();
        const modelSrc = resolveModelPath(model.file);

        window.BiologyApp?.releaseBiologyModelViewers?.(container);
        container.style.setProperty("--accent-color", model.accent);
        container.style.setProperty("--accent-glow", model.accentGlow);

        container.innerHTML = `
          <div class="sim-container">
            <div class="sim-frame">
              <div class="sim-grid-overlay"></div>
              <div class="sim-ambient-glow"></div>

              <div class="sim-viewer-wrap">
                <model-viewer
                  class="sim-viewer"
                  src="${modelSrc}"
                  draco-decoder-url="${basePath}assets/draco/"
                  camera-controls
                  interaction-prompt="none"
                  shadow-intensity="0.8"
                  exposure="0.9"
                  environment-image="neutral"
                  loading="eager"
                  field-of-view="45deg"
                  min-field-of-view="10deg"
                  max-field-of-view="80deg"
                  camera-orbit="${model.cameraOrbit}"
                  alt="${escapeHtml(model.name)} 3D模型">
                </model-viewer>
              </div>

              <div class="sim-viewer-tip">拖拽旋转 · 双指缩放 · 鼠标滚轮</div>

              <div class="sim-controls">
                <button class="sim-btn${state.autoRotate ? ' active' : ''}" type="button" data-action="toggle-rotate">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12a9 9 0 1 1-3-6.7" />
                    <polyline points="21 4 21 10 15 10" />
                  </svg>
                  <span>自动旋转</span>
                </button>
                <button class="sim-btn" type="button" data-action="reset-camera">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                  <span>复位视角</span>
                </button>
              </div>
            </div>
          </div>
        `;

        const viewer = findViewer();
        if (viewer) {
          if (window.BiologyApp && typeof window.BiologyApp.enhanceBiologyModelViewerProgress === "function") {
            window.BiologyApp.enhanceBiologyModelViewerProgress(viewer);
          }
          addListener(viewer, "load", function () {
            if (state.autoRotate) {
              viewer.setAttribute("auto-rotate", "");
            } else {
              viewer.removeAttribute("auto-rotate");
            }
          });
        }
      }

      // Dynamic Scientific Microscope Pop-up Modal Creator
      function showMicroModal(feat) {
        let modal = container.querySelector(".micro-photo-modal");
        if (!modal) {
          modal = document.createElement("div");
          modal.className = "micro-photo-modal";
          container.appendChild(modal);
        }
        const photoSrc = feat.microPhoto ? resolvePath(feat.microPhoto) : resolvePath(getActiveModel().cover);
        const annotation = feat.microAnnotation ? feat.microAnnotation : `【结构功能释义】\n${feat.detail}`;

        modal.innerHTML = `
          <div class="micro-modal-bg" data-action="close-micro-modal"></div>
          <div class="micro-modal-content">
            <div class="micro-modal-header">
              <span class="micro-modal-title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                ${escapeHtml(feat.name)} - 科学解剖与显微/电镜详注
              </span>
              <button class="micro-modal-close" data-action="close-micro-modal">&times;</button>
            </div>
            <div class="micro-modal-body">
              <div class="micro-modal-img-wrap">
                <img class="micro-modal-img" src="${photoSrc}" alt="${escapeHtml(feat.name)}真实照片" />
              </div>
              <div class="micro-modal-annotation">
                ${annotation.replace(/\n/g, '<br>')}
              </div>
            </div>
          </div>
        `;
        
        // Force reflow
        modal.offsetHeight;
        modal.classList.add("active");
      }

      // 3. Premium Interactive Control Panel on the Right
      function renderPanel() {
        if (!panelHost) return;

        const activeModel = getActiveModel();
        const filteredModels = MODELS.filter(function(m) { return m.category === state.activeCategory; });

        // Build HTML for the models tab grid
        const modelsGridHtml = filteredModels.map(function(m) {
          const isActive = m.id === state.activeModelId;
          return `
            <button class="p-model-btn${isActive ? ' active' : ''}" 
                    type="button" 
                    data-action="select-model" 
                    data-value="${m.id}"
                    style="--theme-accent: ${m.accent}; --theme-accent-glow: ${m.accentGlow};">
              <span class="p-model-dot"></span>
              <span class="p-model-btn-text">${escapeHtml(m.name)}</span>
            </button>
          `;
        }).join("");

        // Build HTML for the dynamic direct features list
        const featuresHtml = activeModel.features.map(function(feat, idx) {
          return `
            <div class="p-feature-item" 
                 data-action="select-feature" 
                 data-value="${idx}"
                 style="--theme-accent: ${activeModel.accent}; --theme-accent-glow: ${activeModel.accentGlow};">
              <span class="p-feature-name">${escapeHtml(feat.name)}</span>
              <span class="p-feature-action-label">
                📷 显微照片 ➔
              </span>
            </div>
          `;
        }).join("");

        panelHost.innerHTML = `
          <div class="panel-mount-${sceneId}" style="--theme-accent: ${activeModel.accent}; --theme-accent-glow: ${activeModel.accentGlow};">
            
            <!-- Category Tabs & Model Grid Selector -->
            <div class="p-card">
              <span class="p-eyebrow">生物工坊分类</span>
              <div class="p-category-tabs">
                <button class="p-tab-btn${state.activeCategory === 'eukaryote' ? ' active' : ''}" type="button" data-action="tab-category" data-value="eukaryote">真核细胞 & 免疫</button>
                <button class="p-tab-btn${state.activeCategory === 'organelle' ? ' active' : ''}" type="button" data-action="tab-category" data-value="organelle">细胞器 & 生命大分子</button>
              </div>
              <div class="p-models-grid">
                ${modelsGridHtml}
              </div>
            </div>

            <!-- Biological Properties / Specs Profile -->
            <div class="p-card">
              <span class="p-eyebrow">科学档案</span>
              <h2 class="p-info-title">${escapeHtml(activeModel.name)}</h2>
              
              <div class="p-metadata">
                <div class="p-meta-pill">
                  <span class="p-meta-label">微观尺寸</span>
                  <span class="p-meta-val">${escapeHtml(activeModel.size)}</span>
                </div>
                <div class="p-meta-pill">
                  <span class="p-meta-label">显微可见</span>
                  <span class="p-meta-val">${escapeHtml(activeModel.visibleInLM)}</span>
                </div>
                <div class="p-meta-pill">
                  <span class="p-meta-label">富集区域</span>
                  <span class="p-meta-val">${escapeHtml(activeModel.location.split('，')[0] || activeModel.location.split('、')[0])}</span>
                </div>
              </div>

              <p class="p-info-desc">${escapeHtml(activeModel.description)}</p>

              <div class="p-fact-box">
                <span class="p-fact-icon">💡</span>
                <span class="p-fact-text">${escapeHtml(activeModel.funFact)}</span>
              </div>
            </div>

            <!-- Organelle / Feature Interactive Explorer -->
            <div class="p-card">
              <span class="p-eyebrow">超微精细结构与功能</span>
              <p class="p-info-desc" style="font-size:12px; margin-top:-6px; opacity:0.6;">点击下方子结构名，可直接弹窗查看真实显微照片与注释：</p>
              <div class="p-features-list">
                ${featuresHtml}
              </div>
            </div>

            <div class="p-card" style="align-items: center; justify-content: center; padding: 12px 14px; text-align: center; border: 1px dashed rgba(255,255,255,0.08); background: transparent;">
              <span style="font-size: 11px; color: rgba(241,245,249,0.35); font-weight: 500;">
                数据来源：细胞结构工坊公开教程体系
              </span>
            </div>

          </div>
        `;
      }

      // Action routing dispatcher
      function handleActionClick(event) {
        const actionTarget = event.target.closest("[data-action]");
        if (!actionTarget) return;

        const action = actionTarget.getAttribute("data-action");
        const value = actionTarget.getAttribute("data-value") || "";

        if (action === "tab-category") {
          state.activeCategory = value;
          // When switching category, automatically set first model as active
          const matching = MODELS.find(function(m) { return m.category === value; });
          if (matching) {
            state.activeModelId = matching.id;
          }
          state.selectedFeatureIndex = -1;
          renderStage();
          renderPanel();
          return;
        }

        if (action === "select-model") {
          state.activeModelId = value;
          state.selectedFeatureIndex = -1;
          renderStage();
          renderPanel();
          return;
        }

        if (action === "select-feature") {
          const idx = parseInt(value, 10);
          const activeModel = getActiveModel();
          const feat = activeModel.features[idx];
          
          if (feat) {
            // Immediately show microscope photo modal! Static 3D scene!
            showMicroModal(feat);
          }
          return;
        }

        if (action === "close-micro-modal") {
          const modal = container.querySelector(".micro-photo-modal");
          if (modal) {
            modal.classList.remove("active");
          }
          return;
        }

        if (action === "toggle-rotate") {
          state.autoRotate = !state.autoRotate;
          const viewer = findViewer();
          const btn = container.querySelector('[data-action="toggle-rotate"]');
          if (viewer) {
            if (state.autoRotate) {
              viewer.setAttribute("auto-rotate", "");
              btn.classList.add("active");
            } else {
              viewer.removeAttribute("auto-rotate");
              btn.classList.remove("active");
            }
          }
          return;
        }

        if (action === "reset-camera") {
          state.selectedFeatureIndex = -1;
          const viewer = findViewer();
          const activeModel = getActiveModel();
          if (viewer) {
            viewer.cameraOrbit = activeModel.cameraOrbit;
            viewer.cameraTarget = "0m 0m 0m";
            viewer.fieldOfView = "45deg";
          }
          renderPanel();
          return;
        }
      }

      function start() {
        renderStage();
        renderPanel();

        addListener(container, "click", handleActionClick);
        if (panelHost && panelHost !== container) {
          addListener(panelHost, "click", handleActionClick);
        }
      }

      loadModelViewer().then(start);

      // Clean up scope variables and nodes on unmount
      container.__bioSceneCleanup = function cleanup() {
        window.BiologyApp?.releaseBiologyModelViewers?.(container);
        if (controller) controller.abort();
        listeners.forEach(function (teardown) { teardown(); });

        if (style.parentNode) {
          style.parentNode.removeChild(style);
        }

        if (hiddenAsideContent) {
          hiddenAsideContent.style.display = "";
        }

        if (legacyPanelRoot && legacyPanelRoot.parentNode) {
          legacyPanelRoot.parentNode.removeChild(legacyPanelRoot);
        }

        if (externalPanel) {
          externalPanel.innerHTML = "";
        }
      };
    },

    unmount: function unmount(container) {
      if (container && container.__bioSceneCleanup) {
        container.__bioSceneCleanup();
        delete container.__bioSceneCleanup;
      }
      if (container) {
        container.innerHTML = "";
      }
    }
  };
})();
