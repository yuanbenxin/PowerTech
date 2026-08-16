window.BIO_VISUAL_SCENES = window.BIO_VISUAL_SCENES || {};
window.BIO_VISUAL_SCENES["s_b2_m05"] = function () {
  const {
    useState,
    useEffect,
    useRef,
    useMemo
  } = React;
  const COLORS = {
    A: {
      main: '#ef4444',
      dark: '#b91c1c',
      pair: 'T'
    },
    T: {
      main: '#f59e0b',
      dark: '#b45309',
      pair: 'A'
    },
    C: {
      main: '#0ea5e9',
      dark: '#0369a1',
      pair: 'G'
    },
    G: {
      main: '#10b981',
      dark: '#047857',
      pair: 'C'
    }
  };

  // ==========================================
  // 教具组件: 极度拟真的核苷酸
  // ==========================================
  const Nucleotide = ({
    x,
    y,
    type,
    isFlipped,
    showLabels,
    opacity = 1,
    delay = 0
  }) => {
    const color = COLORS[type].main;
    const darkColor = COLORS[type].dark;
    const getBasePath = () => {
      switch (type) {
        case 'A':
          return "M 16,-15 L 45,-15 L 60,0 L 45,15 L 16,15 Z";
        case 'T':
          return "M 16,-15 L 60,-15 L 45,0 L 60,15 L 16,15 Z";
        case 'C':
          return "M 16,-15 L 45,-15 A 15 15 0 0 1 45 15 L 16,15 Z";
        case 'G':
          return "M 16,-15 L 60,-15 A 15 15 0 0 0 60 15 L 16,15 Z";
        default:
          return "";
      }
    };
    return /*#__PURE__*/React.createElement("g", {
      transform: `translate(${x}, ${y}) ${isFlipped ? 'rotate(180)' : ''}`,
      style: {
        opacity,
        transition: `opacity 0.6s ease-out ${delay}s, transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)`
      }
    }, /*#__PURE__*/React.createElement("line", {
      x1: "-16",
      y1: "0",
      x2: "-42",
      y2: "-20",
      stroke: "#94a3b8",
      strokeWidth: "3",
      strokeLinecap: "round"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "-42",
      cy: "-20",
      r: "14",
      fill: "url(#phos-grad)",
      stroke: "#64748b",
      strokeWidth: "2",
      filter: "url(#drop-shadow-sm)"
    }), /*#__PURE__*/React.createElement("text", {
      x: "-42",
      y: "-16",
      fill: "#1e293b",
      fontSize: "13",
      fontWeight: "900",
      textAnchor: "middle"
    }, "P"), /*#__PURE__*/React.createElement("line", {
      x1: "10",
      y1: "0",
      x2: "20",
      y2: "0",
      stroke: "#94a3b8",
      strokeWidth: "3"
    }), /*#__PURE__*/React.createElement("polygon", {
      points: "0,-12 16,0 10,20 -10,20 -16,0",
      fill: "url(#sugar-grad)",
      stroke: "#64748b",
      strokeWidth: "2",
      filter: "url(#drop-shadow-sm)"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "0",
      cy: "-12",
      r: "4",
      fill: "#ef4444",
      stroke: "#b91c1c",
      strokeWidth: "1"
    }), /*#__PURE__*/React.createElement("text", {
      x: "11",
      y: "2",
      fill: "#94a3b8",
      fontSize: "6",
      fontWeight: "bold"
    }, "1'"), /*#__PURE__*/React.createElement("text", {
      x: "3",
      y: "16",
      fill: "#94a3b8",
      fontSize: "6",
      fontWeight: "bold"
    }, "2'"), /*#__PURE__*/React.createElement("text", {
      x: "-7",
      y: "16",
      fill: "#94a3b8",
      fontSize: "6",
      fontWeight: "bold"
    }, "3'"), /*#__PURE__*/React.createElement("text", {
      x: "-10",
      y: "2",
      fill: "#94a3b8",
      fontSize: "6",
      fontWeight: "bold"
    }, "4'"), /*#__PURE__*/React.createElement("text", {
      x: "-25",
      y: "-6",
      fill: "#94a3b8",
      fontSize: "6",
      fontWeight: "bold"
    }, "5'"), /*#__PURE__*/React.createElement("circle", {
      cx: "-10",
      cy: "20",
      r: "3",
      fill: "#3b82f6"
    }), /*#__PURE__*/React.createElement("path", {
      d: getBasePath(),
      fill: `url(#grad-${type})`,
      stroke: darkColor,
      strokeWidth: "2",
      filter: "url(#drop-shadow-sm)"
    }), /*#__PURE__*/React.createElement("text", {
      x: "35",
      y: "5",
      fill: "#ffffff",
      fontSize: "16",
      className: "dna-base-text",
      textAnchor: "middle",
      transform: isFlipped ? 'rotate(180 35 0)' : ''
    }, type), showLabels && !isFlipped && /*#__PURE__*/React.createElement("g", {
      className: "anim-smooth",
      stroke: "#64748b",
      fill: "#475569",
      fontSize: "14",
      fontWeight: "bold"
    }, /*#__PURE__*/React.createElement("line", {
      x1: "-42",
      y1: "-34",
      x2: "-42",
      y2: "-60",
      strokeWidth: "2",
      strokeDasharray: "4"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "-42",
      cy: "-60",
      r: "2",
      fill: "#64748b",
      stroke: "none"
    }), /*#__PURE__*/React.createElement("text", {
      x: "-42",
      y: "-68",
      textAnchor: "middle"
    }, "\u78F7\u9178\u57FA\u56E2"), /*#__PURE__*/React.createElement("line", {
      x1: "0",
      y1: "20",
      x2: "0",
      y2: "55",
      strokeWidth: "2",
      strokeDasharray: "4"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "0",
      cy: "55",
      r: "2",
      fill: "#64748b",
      stroke: "none"
    }), /*#__PURE__*/React.createElement("text", {
      x: "0",
      y: "72",
      textAnchor: "middle"
    }, "\u8131\u6C27\u6838\u7CD6 (\u4E94\u78B3\u7CD6)"), /*#__PURE__*/React.createElement("line", {
      x1: "45",
      y1: "-15",
      x2: "65",
      y2: "-40",
      strokeWidth: "2",
      strokeDasharray: "4"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "65",
      cy: "-40",
      r: "2",
      fill: "#64748b",
      stroke: "none"
    }), /*#__PURE__*/React.createElement("text", {
      x: "70",
      y: "-45",
      textAnchor: "start"
    }, "\u542B\u6C2E\u78B1\u57FA")));
  };

  // ==========================================
  // 模块 1: 组装式 DNA 结构教学
  // ==========================================
  const StructureTeaching = () => {
    const [step, setStep] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const seqLeft = ['A', 'C', 'T', 'G'];
    const seqRight = ['T', 'G', 'A', 'C'];
    const stepsData = [{
      title: "1. 认识基本单位",
      desc: "观察【脱氧核苷酸】的真实结构：中心带有氧原子（红点）的五碳糖，1'位连着含氮碱基，5'位连着磷酸基团。"
    }, {
      title: "2. 形成单链 (多聚体)",
      desc: "核苷酸通过【磷酸二酯键】（绿色线条）纵向连接。注意看：它是上一个核苷酸的 3' 位与下一个核苷酸的 5'位磷酸相连而成的！"
    }, {
      title: "3. 碱基互补配对 (双链)",
      desc: "另一条链以【反向平行】滑入。A与T形成2个氢键，C与G形成3个氢键，如同锁与钥匙般严丝合缝配对。"
    }, {
      title: "4. 经典 2D 展开图解析",
      desc: "用最硬核的 2D 剖析图展现空间全貌：左侧是参数严谨的螺旋带；右侧直接放大骨架与氢键的微观细节结构！"
    }];
    const handleNext = () => {
      if (step >= 3 || isAnimating) return;
      setIsAnimating(true);
      setStep(s => s + 1);
      setTimeout(() => setIsAnimating(false), 1500);
    };
    const handleReset = () => {
      setStep(0);
    };
    const renderStaticHelix = () => {
      const numBases = 22;
      const radius = 45;
      const heightStep = 18;
      const freq = Math.PI / 5;
      const centerX = 160;
      const startY = 40;
      const back = [];
      const middle = [];
      const front = [];
      for (let i = 0; i < numBases; i++) {
        const angle = i * freq;
        const y = startY + i * heightStep;
        const x1 = centerX + Math.sin(angle) * radius;
        const x2 = centerX + Math.sin(angle + Math.PI) * radius;
        const z1 = Math.cos(angle);
        const z2 = Math.cos(angle + Math.PI);
        const char1 = ['A', 'C', 'T', 'G'][i % 4];
        const char2 = COLORS[char1].pair;
        middle.push( /*#__PURE__*/React.createElement("g", {
          key: `bp-${i}`
        }, /*#__PURE__*/React.createElement("line", {
          x1: x1,
          y1: y,
          x2: centerX,
          y2: y,
          stroke: COLORS[char1].main,
          strokeWidth: "6",
          strokeLinecap: "round"
        }), /*#__PURE__*/React.createElement("line", {
          x1: x2,
          y1: y,
          x2: centerX,
          y2: y,
          stroke: COLORS[char2].main,
          strokeWidth: "6",
          strokeLinecap: "round"
        })));
        if (i < numBases - 1) {
          const nextAngle = (i + 1) * freq;
          const nextY = startY + (i + 1) * heightStep;
          const nx1 = centerX + Math.sin(nextAngle) * radius;
          const nx2 = centerX + Math.sin(nextAngle + Math.PI) * radius;
          const nz1 = Math.cos(nextAngle);
          const nz2 = Math.cos(nextAngle + Math.PI);
          const renderSeg = (sx1, sy1, sx2, sy2, isBlue) => /*#__PURE__*/React.createElement("line", {
            x1: sx1,
            y1: sy1,
            x2: sx2,
            y2: sy2,
            stroke: isBlue ? "#3b82f6" : "#ef4444",
            strokeWidth: "10",
            strokeLinecap: "round"
          });
          if (z1 < 0 && nz1 < 0) back.push( /*#__PURE__*/React.createElement("g", {
            key: `b1-${i}`
          }, renderSeg(x1, y, nx1, nextY, true)));else if (z1 >= 0 && nz1 >= 0) front.push( /*#__PURE__*/React.createElement("g", {
            key: `f1-${i}`
          }, renderSeg(x1, y, nx1, nextY, true)));else {
            if (z1 + nz1 < 0) back.push( /*#__PURE__*/React.createElement("g", {
              key: `b1-${i}`
            }, renderSeg(x1, y, nx1, nextY, true)));else front.push( /*#__PURE__*/React.createElement("g", {
              key: `f1-${i}`
            }, renderSeg(x1, y, nx1, nextY, true)));
          }
          if (z2 < 0 && nz2 < 0) back.push( /*#__PURE__*/React.createElement("g", {
            key: `b2-${i}`
          }, renderSeg(x2, y, nx2, nextY, false)));else if (z2 >= 0 && nz2 >= 0) front.push( /*#__PURE__*/React.createElement("g", {
            key: `f2-${i}`
          }, renderSeg(x2, y, nx2, nextY, false)));else {
            if (z2 + nz2 < 0) back.push( /*#__PURE__*/React.createElement("g", {
              key: `b2-${i}`
            }, renderSeg(x2, y, nx2, nextY, false)));else front.push( /*#__PURE__*/React.createElement("g", {
              key: `f2-${i}`
            }, renderSeg(x2, y, nx2, nextY, false)));
          }
        }
      }
      return /*#__PURE__*/React.createElement(React.Fragment, null, back, middle, front);
    };
    return /*#__PURE__*/React.createElement("div", {
      className: "w-full h-full flex flex-col bg-grid-light"
    }, /*#__PURE__*/React.createElement("div", {
      className: "dna-source-toolbar h-32 bg-white/95 border-b border-slate-200 p-6 flex justify-between items-center z-20 shrink-0 shadow-sm backdrop-blur"
    }, /*#__PURE__*/React.createElement("div", {
      className: "max-w-3xl"
    }, /*#__PURE__*/React.createElement("div", {
      className: "inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold mb-2 border border-indigo-200"
    }, "\u7ED3\u6784\u7EC4\u88C5\u52A8\u6001\u6F14\u793A"), /*#__PURE__*/React.createElement("h2", {
      className: "text-2xl font-black text-slate-800 mb-2"
    }, stepsData[step].title), /*#__PURE__*/React.createElement("p", {
      className: "text-slate-600 text-[15px] font-medium leading-relaxed"
    }, stepsData[step].desc)), /*#__PURE__*/React.createElement("div", {
      className: "flex gap-3"
    }, /*#__PURE__*/React.createElement("button", {
      "data-dna-origin-reset": "structure",
      onClick: handleReset,
      className: "px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition"
    }, "\u91CD\u7F6E"), /*#__PURE__*/React.createElement("button", {
      "data-dna-origin-next": "structure",
      onClick: handleNext,
      disabled: step >= 3 || isAnimating,
      className: `px-8 py-2.5 rounded-xl font-bold text-white transition-all shadow-md ${step >= 3 ? 'bg-slate-300' : isAnimating ? 'bg-indigo-400 opacity-80' : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95'}`
    }, step >= 3 ? '完成' : isAnimating ? '演示中...' : '播放下一步 ▶'))), /*#__PURE__*/React.createElement("div", {
      className: "flex-grow relative overflow-hidden flex items-center justify-center"
    }, /*#__PURE__*/React.createElement("svg", {
      className: "w-full h-full max-w-4xl",
      viewBox: "0 0 800 500",
      preserveAspectRatio: "xMidYMid meet"
    }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("filter", {
      id: "drop-shadow-sm",
      x: "-20%",
      y: "-20%",
      width: "140%",
      height: "140%"
    }, /*#__PURE__*/React.createElement("feDropShadow", {
      dx: "1",
      dy: "2",
      stdDeviation: "1.5",
      floodOpacity: "0.2"
    })), /*#__PURE__*/React.createElement("linearGradient", {
      id: "phos-grad",
      x1: "0%",
      y1: "0%",
      x2: "100%",
      y2: "100%"
    }, /*#__PURE__*/React.createElement("stop", {
      offset: "0%",
      stopColor: "#f1f5f9"
    }), /*#__PURE__*/React.createElement("stop", {
      offset: "100%",
      stopColor: "#cbd5e1"
    })), /*#__PURE__*/React.createElement("linearGradient", {
      id: "sugar-grad",
      x1: "0%",
      y1: "0%",
      x2: "100%",
      y2: "100%"
    }, /*#__PURE__*/React.createElement("stop", {
      offset: "0%",
      stopColor: "#ffffff"
    }), /*#__PURE__*/React.createElement("stop", {
      offset: "100%",
      stopColor: "#f1f5f9"
    })), Object.entries(COLORS).slice(0, 4).map(([base, c]) => /*#__PURE__*/React.createElement("linearGradient", {
      key: `g-${base}`,
      id: `grad-${base}`,
      x1: "0%",
      y1: "0%",
      x2: "0%",
      y2: "100%"
    }, /*#__PURE__*/React.createElement("stop", {
      offset: "0%",
      stopColor: c.main
    }), /*#__PURE__*/React.createElement("stop", {
      offset: "100%",
      stopColor: c.dark
    })))), /*#__PURE__*/React.createElement("g", {
      className: "anim-smooth",
      style: {
        opacity: step === 3 ? 1 : 0,
        transform: step === 3 ? 'scale(1)' : 'scale(0.9)',
        pointerEvents: step === 3 ? 'auto' : 'none'
      }
    }, /*#__PURE__*/React.createElement("g", {
      filter: "url(#drop-shadow-sm)"
    }, renderStaticHelix()), /*#__PURE__*/React.createElement("g", {
      transform: "translate(160, 20)"
    }, /*#__PURE__*/React.createElement("line", {
      x1: "-50",
      y1: "0",
      x2: "50",
      y2: "0",
      stroke: "#64748b",
      strokeWidth: "2",
      strokeDasharray: "4"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "-50",
      y1: "-5",
      x2: "-50",
      y2: "5",
      stroke: "#64748b",
      strokeWidth: "2"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "50",
      y1: "-5",
      x2: "50",
      y2: "5",
      stroke: "#64748b",
      strokeWidth: "2"
    }), /*#__PURE__*/React.createElement("text", {
      x: "0",
      y: "-8",
      fill: "#475569",
      fontSize: "12",
      fontWeight: "bold",
      textAnchor: "middle"
    }, "\u76F4\u5F84 2 nm")), /*#__PURE__*/React.createElement("g", {
      transform: "translate(70, 40)"
    }, /*#__PURE__*/React.createElement("line", {
      x1: "0",
      y1: "0",
      x2: "0",
      y2: "180",
      stroke: "#64748b",
      strokeWidth: "2",
      strokeDasharray: "4"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "-5",
      y1: "0",
      x2: "5",
      y2: "0",
      stroke: "#64748b",
      strokeWidth: "2"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "-5",
      y1: "180",
      x2: "5",
      y2: "180",
      stroke: "#64748b",
      strokeWidth: "2"
    }), /*#__PURE__*/React.createElement("text", {
      x: "-10",
      y: "85",
      fill: "#334155",
      fontSize: "13",
      fontWeight: "bold",
      textAnchor: "end",
      alignmentBaseline: "middle"
    }, "\u87BA\u8DDD 3.4 nm"), /*#__PURE__*/React.createElement("text", {
      x: "-10",
      y: "105",
      fill: "#64748b",
      fontSize: "11",
      textAnchor: "end",
      alignmentBaseline: "middle"
    }, "(\u5305\u542B10\u5BF9\u78B1\u57FA)")), /*#__PURE__*/React.createElement("path", {
      d: "M 215 94 L 300 94",
      stroke: "#cbd5e1",
      strokeWidth: "2",
      strokeDasharray: "6",
      strokeLinecap: "round"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M 200 220 L 300 220",
      stroke: "#cbd5e1",
      strokeWidth: "2",
      strokeDasharray: "6",
      strokeLinecap: "round"
    }), /*#__PURE__*/React.createElement("g", {
      transform: "translate(320, 20)"
    }, /*#__PURE__*/React.createElement("rect", {
      width: "450",
      height: "130",
      rx: "12",
      fill: "#ffffff",
      stroke: "#e2e8f0",
      strokeWidth: "2",
      filter: "url(#drop-shadow-sm)"
    }), /*#__PURE__*/React.createElement("text", {
      x: "20",
      y: "30",
      fill: "#334155",
      fontSize: "15",
      fontWeight: "900"
    }, "\u2460 \u5916\u4FA7\u9AA8\u67B6\uFF1A\u78F7\u9178\u4E0E\u8131\u6C27\u6838\u7CD6\u4EA4\u66FF\u6392\u5217"), /*#__PURE__*/React.createElement("g", {
      transform: "translate(160, 60) scale(0.55)"
    }, /*#__PURE__*/React.createElement(Nucleotide, {
      x: 0,
      y: 0,
      type: "A",
      isFlipped: false,
      showLabels: false
    }), /*#__PURE__*/React.createElement("line", {
      x1: "-10",
      y1: "20",
      x2: "-42",
      y2: "60",
      stroke: "#10b981",
      strokeWidth: "5",
      strokeLinecap: "round"
    }), /*#__PURE__*/React.createElement(Nucleotide, {
      x: 0,
      y: 80,
      type: "C",
      isFlipped: false,
      showLabels: false
    }), /*#__PURE__*/React.createElement("text", {
      x: "30",
      y: "55",
      fill: "#10b981",
      fontSize: "18",
      fontWeight: "bold"
    }, "\u78F7\u9178\u4E8C\u916F\u952E (3' \u78B3 \u8FDE 5' \u78F7\u9178)"))), /*#__PURE__*/React.createElement("g", {
      transform: "translate(320, 165)"
    }, /*#__PURE__*/React.createElement("rect", {
      width: "450",
      height: "150",
      rx: "12",
      fill: "#ffffff",
      stroke: "#e2e8f0",
      strokeWidth: "2",
      filter: "url(#drop-shadow-sm)"
    }), /*#__PURE__*/React.createElement("text", {
      x: "20",
      y: "30",
      fill: "#334155",
      fontSize: "15",
      fontWeight: "900"
    }, "\u2461 \u5185\u4FA7\u78B1\u57FA\uFF1A\u4E25\u683C\u4E92\u8865\u914D\u5BF9\u4E0E\u6C22\u952E\u7EC6\u8282"), /*#__PURE__*/React.createElement("g", {
      transform: "translate(60, 65) scale(0.5)"
    }, /*#__PURE__*/React.createElement(Nucleotide, {
      x: 0,
      y: 0,
      type: "A",
      isFlipped: false,
      showLabels: false
    }), /*#__PURE__*/React.createElement("line", {
      x1: "60",
      y1: "-5",
      x2: "100",
      y2: "-5",
      stroke: "#94a3b8",
      strokeWidth: "4",
      strokeDasharray: "6 4"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "60",
      y1: "5",
      x2: "100",
      y2: "5",
      stroke: "#94a3b8",
      strokeWidth: "4",
      strokeDasharray: "6 4"
    }), /*#__PURE__*/React.createElement("text", {
      x: "80",
      y: "-15",
      fill: "#64748b",
      fontSize: "16",
      fontWeight: "bold",
      textAnchor: "middle"
    }, "2\u4E2A\u6C22\u952E"), /*#__PURE__*/React.createElement(Nucleotide, {
      x: 160,
      y: 0,
      type: "T",
      isFlipped: true,
      showLabels: false
    })), /*#__PURE__*/React.createElement("g", {
      transform: "translate(60, 120) scale(0.5)"
    }, /*#__PURE__*/React.createElement(Nucleotide, {
      x: 0,
      y: 0,
      type: "G",
      isFlipped: false,
      showLabels: false
    }), /*#__PURE__*/React.createElement("line", {
      x1: "60",
      y1: "-8",
      x2: "100",
      y2: "-8",
      stroke: "#94a3b8",
      strokeWidth: "4",
      strokeDasharray: "6 4"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "60",
      y1: "0",
      x2: "100",
      y2: "0",
      stroke: "#94a3b8",
      strokeWidth: "4",
      strokeDasharray: "6 4"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "60",
      y1: "8",
      x2: "100",
      y2: "8",
      stroke: "#94a3b8",
      strokeWidth: "4",
      strokeDasharray: "6 4"
    }), /*#__PURE__*/React.createElement("text", {
      x: "80",
      y: "-18",
      fill: "#64748b",
      fontSize: "16",
      fontWeight: "bold",
      textAnchor: "middle"
    }, "3\u4E2A\u6C22\u952E"), /*#__PURE__*/React.createElement(Nucleotide, {
      x: 160,
      y: 0,
      type: "C",
      isFlipped: true,
      showLabels: false
    }))), /*#__PURE__*/React.createElement("g", {
      transform: "translate(320, 330)"
    }, /*#__PURE__*/React.createElement("rect", {
      width: "450",
      height: "120",
      rx: "12",
      fill: "#f8fafc",
      stroke: "#e2e8f0",
      strokeWidth: "2",
      filter: "url(#drop-shadow-sm)"
    }), /*#__PURE__*/React.createElement("text", {
      x: "20",
      y: "30",
      fill: "#334155",
      fontSize: "15",
      fontWeight: "900"
    }, "\u2462 \u7ED3\u6784\u7279\u6027\u603B\u7ED3\uFF1A"), /*#__PURE__*/React.createElement("text", {
      x: "20",
      y: "55",
      fill: "#475569",
      fontSize: "13"
    }, "\u25CF ", /*#__PURE__*/React.createElement("tspan", {
      fontWeight: "bold",
      fill: "#2563eb"
    }, "\u53CD\u5411\u5E73\u884C\uFF1A"), "\u6784\u6210\u53CC\u87BA\u65CB\u7684\u4E24\u6761\u591A\u8131\u6C27\u6838\u82F7\u9178\u94FE\u8D70\u5411\u76F8\u53CD\u3002"), /*#__PURE__*/React.createElement("text", {
      x: "20",
      y: "78",
      fill: "#475569",
      fontSize: "13"
    }, "\u25CF ", /*#__PURE__*/React.createElement("tspan", {
      fontWeight: "bold",
      fill: "#ef4444"
    }, "\u53F3\u624B\u87BA\u65CB\uFF1A"), "\u81EA\u7136\u754C\u6807\u51C6 B\u578B DNA \u5448\u73B0\u89C4\u5219\u7684\u53F3\u624B\u87BA\u65CB\u7A7A\u95F4\u5F62\u6001\u3002"), /*#__PURE__*/React.createElement("text", {
      x: "20",
      y: "101",
      fill: "#475569",
      fontSize: "13"
    }, "\u25CF ", /*#__PURE__*/React.createElement("tspan", {
      fontWeight: "bold",
      fill: "#10b981"
    }, "\u591A\u6837\u4E0E\u7279\u5F02\uFF1A"), "\u65E0\u7A77\u5C3D\u7684\u78B1\u57FA\u6392\u5217\u987A\u5E8F\u8574\u542B\u7740\u751F\u7269\u6D77\u91CF\u7684\u9057\u4F20\u4FE1\u606F\u3002"))), /*#__PURE__*/React.createElement("g", {
      className: "anim-smooth",
      style: {
        opacity: step < 3 ? 1 : 0,
        pointerEvents: step < 3 ? 'auto' : 'none'
      }
    }, /*#__PURE__*/React.createElement("g", {
      className: "anim-smooth",
      transform: step === 0 ? "translate(350, 220) scale(1.5)" : "translate(250, 100) scale(1)"
    }, /*#__PURE__*/React.createElement("g", null, seqLeft.slice(0, 3).map((_, i) => /*#__PURE__*/React.createElement("g", {
      key: `bond-${i}`
    }, /*#__PURE__*/React.createElement("line", {
      x1: "-10",
      y1: i * 80 + 20,
      x2: "-42",
      y2: (i + 1) * 80 - 20,
      stroke: "#10b981",
      strokeWidth: "4",
      strokeLinecap: "round",
      style: {
        strokeDasharray: 100,
        strokeDashoffset: step >= 1 ? 0 : 100,
        transition: `stroke-dashoffset 0.6s ease-out ${(i + 1) * 0.3}s`
      }
    }), /*#__PURE__*/React.createElement("text", {
      x: "-55",
      y: i * 80 + 50,
      fill: "#10b981",
      fontSize: "14",
      fontWeight: "bold",
      textAnchor: "end",
      style: {
        opacity: step >= 1 ? 1 : 0,
        transition: `opacity 0.4s ease-out ${(i + 1) * 0.3 + 0.3}s`
      }
    }, i === 1 ? '磷酸二酯键' : '')))), seqLeft.map((char, i) => /*#__PURE__*/React.createElement(Nucleotide, {
      key: `L-${i}`,
      x: 0,
      y: i * 80,
      type: char,
      isFlipped: false,
      showLabels: step === 0 && i === 0,
      opacity: step >= 1 || i === 0 ? 1 : 0,
      delay: step === 1 ? i * 0.3 : 0
    })), /*#__PURE__*/React.createElement("g", {
      style: {
        opacity: step >= 1 ? 1 : 0,
        transition: 'opacity 0.6s ease 1.5s'
      }
    }, /*#__PURE__*/React.createElement("text", {
      x: "-65",
      y: "-20",
      fill: "#dc2626",
      fontSize: "16",
      fontWeight: "bold",
      textAnchor: "end"
    }, "5' \u7AEF"), /*#__PURE__*/React.createElement("text", {
      x: "-25",
      y: "270",
      fill: "#dc2626",
      fontSize: "16",
      fontWeight: "bold",
      textAnchor: "end"
    }, "3' \u7AEF"))), /*#__PURE__*/React.createElement("g", null, seqLeft.map((char, i) => {
      const y = 100 + i * 80;
      const isThree = char === 'C' || char === 'G';
      const leftExt = char === 'A' || char === 'G' ? 60 : 45;
      const x1 = 250 + leftExt;
      const x2 = x1 + 45;
      const centerX = (x1 + x2) / 2;
      return /*#__PURE__*/React.createElement("g", {
        key: `hb-${i}`,
        stroke: "#94a3b8",
        strokeWidth: "2",
        strokeDasharray: "4 3",
        style: {
          opacity: step >= 2 ? 1 : 0,
          transition: `opacity 0.4s ease ${1 + i * 0.2}s`
        }
      }, isThree ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("line", {
        x1: x1,
        y1: y - 8,
        x2: x2,
        y2: y - 8
      }), /*#__PURE__*/React.createElement("line", {
        x1: x1,
        y1: y,
        x2: x2,
        y2: y
      }), /*#__PURE__*/React.createElement("line", {
        x1: x1,
        y1: y + 8,
        x2: x2,
        y2: y + 8
      })) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("line", {
        x1: x1,
        y1: y - 5,
        x2: x2,
        y2: y - 5
      }), /*#__PURE__*/React.createElement("line", {
        x1: x1,
        y1: y + 5,
        x2: x2,
        y2: y + 5
      })), /*#__PURE__*/React.createElement("text", {
        x: centerX,
        y: y - 15,
        fill: "#94a3b8",
        fontSize: "12",
        fontWeight: "bold",
        stroke: "none",
        textAnchor: "middle"
      }, isThree ? '3个氢键' : '2个氢键'));
    })), /*#__PURE__*/React.createElement("g", {
      className: "anim-smooth",
      transform: `translate(${step >= 2 ? 400 : 550}, 100) scale(1)`,
      style: {
        opacity: step >= 2 ? 1 : 0
      }
    }, seqRight.slice(0, 3).map((_, i) => /*#__PURE__*/React.createElement("line", {
      key: `bond-R-${i}`,
      x1: "-10",
      y1: i * 80 + 20,
      x2: "-42",
      y2: (i + 1) * 80 - 20,
      stroke: "#cbd5e1",
      strokeWidth: "4",
      strokeLinecap: "round",
      transform: "rotate(180 0 120)"
    })), seqRight.map((char, i) => /*#__PURE__*/React.createElement(Nucleotide, {
      key: `R-${i}`,
      x: 0,
      y: i * 80,
      type: char,
      isFlipped: true,
      showLabels: false
    })), /*#__PURE__*/React.createElement("text", {
      x: "65",
      y: "-20",
      fill: "#3b82f6",
      fontSize: "16",
      fontWeight: "bold",
      textAnchor: "start"
    }, "3' \u7AEF"), /*#__PURE__*/React.createElement("text", {
      x: "25",
      y: "270",
      fill: "#3b82f6",
      fontSize: "16",
      fontWeight: "bold",
      textAnchor: "start"
    }, "5' \u7AEF"), /*#__PURE__*/React.createElement("text", {
      x: "130",
      y: "120",
      fill: "#3b82f6",
      fontSize: "18",
      fontWeight: "bold",
      textAnchor: "start",
      className: "pulse-enzyme",
      style: {
        opacity: step >= 2 ? 1 : 0,
        transition: 'opacity 0.6s ease 1.5s'
      }
    }, "\u2190 \u53CD\u5411\u5E73\u884C"))))));
  };

  // ==========================================
  // 模块 2: 60帧全息拟真复制推演 (已补回丢失的渐变滤镜并优化文字防遮挡)
  // ==========================================
  const ReplicationTeaching = () => {
    const [step, setStep] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const totalBases = 24;
    const baseW = 36;
    const fullW = totalBases * baseW;
    const forkClosedX = 0;
    const forkOpenX = fullW / 2 + 60;
    const maxLeadExt = forkOpenX - 90;
    const maxLagExt = 180;
    const animRef = useRef({
      forkX: forkClosedX,
      leadExt: 0,
      lagExt: 0,
      primerOp: 0,
      ligasePos: 0
    });
    const [animVals, setAnimVals] = useState(animRef.current);
    const floatingPool = useMemo(() => {
      const pool = [];
      const types = ['A', 'T', 'C', 'G'];
      for (let i = 0; i < 30; i++) {
        pool.push({
          id: i,
          type: types[i % 4],
          x: Math.random() * 800 - 100,
          y: Math.random() * 400 - 50,
          speedClass: Math.random() > 0.5 ? 'float-fast' : 'float-slow',
          delay: `${Math.random() * -10}s`,
          scale: 0.6 + Math.random() * 0.4
        });
      }
      return pool;
    }, []);
    const runAnim = (targets, duration) => {
      setIsAnimating(true);
      const startVals = {
        ...animRef.current
      };
      const startTime = performance.now();
      const stepFn = time => {
        let p = (time - startTime) / duration;
        if (p >= 1) p = 1;
        const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        const nextVals = {
          ...animRef.current
        };
        for (let key in targets) nextVals[key] = startVals[key] + (targets[key] - startVals[key]) * ease;
        setAnimVals(nextVals);
        animRef.current = nextVals;
        if (p < 1) requestAnimationFrame(stepFn);else setIsAnimating(false);
      };
      requestAnimationFrame(stepFn);
    };
    const nextStep = () => {
      if (isAnimating || step >= 4) return;
      const next = step + 1;
      setStep(next);
      if (next === 1) runAnim({
        forkX: forkOpenX
      }, 2500);
      if (next === 2) runAnim({
        primerOp: 1,
        leadExt: 4 * baseW,
        lagExt: 4 * baseW
      }, 1500);
      if (next === 3) runAnim({
        leadExt: maxLeadExt,
        lagExt: maxLagExt
      }, 3500);
      if (next === 4) runAnim({
        ligasePos: 1
      }, 2000);
    };
    const resetStep = () => {
      if (isAnimating) return;
      setStep(0);
      runAnim({
        forkX: forkClosedX,
        leadExt: 0,
        lagExt: 0,
        primerOp: 0,
        ligasePos: 0
      }, 1500);
    };
    const getStrandY = (x, isTop) => {
      const closedY = 240;
      const openY = isTop ? 80 : 400;
      const transitionWidth = 260;
      if (x >= animVals.forkX) return closedY + (isTop ? -15 : 15);
      if (x < animVals.forkX - transitionWidth) return openY;
      const t = (animVals.forkX - x) / transitionWidth;
      const smoothT = (1 - Math.cos(t * Math.PI)) / 2;
      return closedY + (isTop ? -15 : 15) + (openY - (closedY + (isTop ? -15 : 15))) * smoothT;
    };
    const getAngle = (x, isTop) => {
      const dx = 2;
      const y1 = getStrandY(x - dx, isTop);
      const y2 = getStrandY(x + dx, isTop);
      return Math.atan2(y2 - y1, dx * 2) * (180 / Math.PI);
    };
    const SEQUENCE2 = "ATGCGTACCGTAATCGGCTAGCATGC".split("");
    const generateBackbone = (isTop, isNew = false, startX = 0, endX = fullW) => {
      if (startX > endX || endX <= 0 || startX < 0) return "";
      let d = "";
      const stepAmt = 10;
      for (let x = startX; x <= endX; x += stepAmt) {
        let y = getStrandY(x, isTop);
        let finalX = x;
        let finalY = y;
        const angle = getAngle(x, isTop);
        if (isNew) {
          const rad = (angle + (isTop ? 90 : -90)) * Math.PI / 180;
          finalX = x + 30 * Math.cos(rad);
          finalY = y + 30 * Math.sin(rad);
        } else {
          const rad = (angle + (isTop ? -90 : 90)) * Math.PI / 180;
          finalX = x + 2 * Math.cos(rad);
          finalY = y + 2 * Math.sin(rad);
        }
        d += x === startX ? `M ${finalX} ${finalY}` : ` L ${finalX} ${finalY}`;
      }
      if (endX % stepAmt !== 0) {
        let y = getStrandY(endX, isTop);
        const angle = getAngle(endX, isTop);
        let fX = endX + (isNew ? 30 : 2) * Math.cos((angle + (isTop ? 90 : -90)) * Math.PI / 180);
        let fY = y + (isNew ? 30 : 2) * Math.sin((angle + (isTop ? 90 : -90)) * Math.PI / 180);
        d += ` L ${fX} ${fY}`;
      }
      return d;
    };
    const renderBase = (x, y, angle, char, color, isTop, isPrimer = false) => {
      const height = 20;
      const showAsPrimer = isPrimer && animVals.ligasePos < 0.5;
      return /*#__PURE__*/React.createElement("g", {
        transform: `translate(${x}, ${y}) rotate(${angle})`
      }, /*#__PURE__*/React.createElement("path", {
        d: isTop ? `M -8 0 L 8 0 L 8 ${height - 4} Q 8 ${height} 4 ${height} L -4 ${height} Q -8 ${height} -8 ${height - 4} Z` : `M -8 0 L 8 0 L 8 ${-(height - 4)} Q 8 ${-height} 4 ${-height} L -4 ${-height} Q -8 ${-height} -8 ${-(height - 4)} Z`,
        fill: showAsPrimer ? 'url(#grad-primer)' : `url(#grad-${char})`,
        stroke: "#0f172a",
        strokeWidth: "1.5",
        style: {
          transition: 'fill 0.5s ease'
        }
      }), /*#__PURE__*/React.createElement("text", {
        x: "0",
        y: isTop ? height / 2 + 4 : -height / 2 + 4,
        className: "dna-base-text",
        fill: "#ffffff",
        fontSize: "11",
        textAnchor: "middle",
        transform: isTop && Math.abs(angle) > 90 ? `rotate(180 0 ${height / 2})` : !isTop && Math.abs(angle) > 90 ? `rotate(180 0 ${-height / 2})` : ""
      }, showAsPrimer ? 'U' : char));
    };
    const stepsData = [{
      title: "0. 微观核液环境",
      desc: "不再是一张白纸！注意背景中那些游离漂浮的【脱氧核苷酸原料】。右侧是紧密结合的双链母链模板，准备迎接复制。"
    }, {
      title: "1. 仿生解旋 (Unwinding)",
      desc: "注意看紫色的【有机解旋酶】！它带着旋转的催化核心，像钻头一样挤入DNA双链内部，平滑地撑开复制叉。"
    }, {
      title: "2. 引物结合 (Priming)",
      desc: "橙色的 RNA 【引物】在母链上生成。引物酶（未画出）为后续的复制铺垫好了游离的 3'-OH 起点。"
    }, {
      title: "3. 聚合酶抓取 (Elongation)",
      desc: "震撼时刻！仿生大分子【DNA聚合酶】包裹住骨架，其中心的闪烁高光代表“活性催化位点”，正在不断抓取游离核苷酸，严格按 5'→3' 方向滑动合成！"
    }, {
      title: "4. 酶促缝合 (Ligation)",
      desc: "绿色的【DNA连接酶】滑过冈崎片段！它用生物能量封锁了磷酸二酯键的缺口，完美收尾。"
    }];
    return /*#__PURE__*/React.createElement("div", {
      className: "w-full h-full flex flex-col bg-grid-light relative overflow-hidden"
    }, /*#__PURE__*/React.createElement("div", {
      className: "dna-source-toolbar h-32 bg-white/90 border-b border-slate-200 p-6 flex justify-between items-center z-20 shrink-0 shadow-sm backdrop-blur-md"
    }, /*#__PURE__*/React.createElement("div", {
      className: "max-w-3xl"
    }, /*#__PURE__*/React.createElement("div", {
      className: "inline-block px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-bold mb-2 border border-teal-200"
    }, "\u5168\u606F\u62DF\u771F\u751F\u7269\u73AF\u5883\u5F15\u64CE"), /*#__PURE__*/React.createElement("h2", {
      className: "text-2xl font-black text-slate-800 mb-2"
    }, stepsData[step].title), /*#__PURE__*/React.createElement("p", {
      className: "text-slate-600 text-[15px] font-medium leading-relaxed"
    }, stepsData[step].desc)), /*#__PURE__*/React.createElement("div", {
      className: "flex gap-3"
    }, /*#__PURE__*/React.createElement("button", {
      "data-dna-origin-reset": "replication",
      onClick: resetStep,
      disabled: isAnimating,
      className: `px-5 py-2.5 rounded-xl font-bold transition ${isAnimating ? 'bg-slate-100 text-slate-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`
    }, "\u91CD\u7F6E\u5B9E\u9A8C"), /*#__PURE__*/React.createElement("button", {
      "data-dna-origin-next": "replication",
      onClick: nextStep,
      disabled: step >= 4 || isAnimating,
      className: `px-8 py-2.5 rounded-xl font-bold text-white transition-all shadow-md ${step >= 4 ? 'bg-slate-300' : isAnimating ? 'bg-teal-400 opacity-80' : 'bg-teal-500 hover:bg-teal-600 active:scale-95'}`
    }, step >= 4 ? '反应结束' : isAnimating ? '酶促反应中...' : '播放下一步 ▶'))), /*#__PURE__*/React.createElement("div", {
      className: "flex-grow relative"
    }, /*#__PURE__*/React.createElement("svg", {
      className: "w-full h-full",
      viewBox: "-40 50 940 380",
      preserveAspectRatio: "xMidYMid meet"
    }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
      id: "grad-primer",
      x1: "0%",
      y1: "0%",
      x2: "0%",
      y2: "100%"
    }, /*#__PURE__*/React.createElement("stop", {
      offset: "0%",
      stopColor: "#fb923c"
    }), /*#__PURE__*/React.createElement("stop", {
      offset: "100%",
      stopColor: "#ea580c"
    })), Object.entries(COLORS).slice(0, 4).map(([base, c]) => /*#__PURE__*/React.createElement("linearGradient", {
      key: `g-${base}`,
      id: `grad-${base}`,
      x1: "0%",
      y1: "0%",
      x2: "0%",
      y2: "100%"
    }, /*#__PURE__*/React.createElement("stop", {
      offset: "0%",
      stopColor: c.main
    }), /*#__PURE__*/React.createElement("stop", {
      offset: "100%",
      stopColor: c.dark
    }))), /*#__PURE__*/React.createElement("filter", {
      id: "drop-shadow-enzyme",
      x: "-50%",
      y: "-50%",
      width: "200%",
      height: "200%"
    }, /*#__PURE__*/React.createElement("feDropShadow", {
      dx: "2",
      dy: "6",
      stdDeviation: "4",
      floodColor: "#020617",
      floodOpacity: "0.4"
    })), /*#__PURE__*/React.createElement("linearGradient", {
      id: "poly-grad",
      x1: "0%",
      y1: "0%",
      x2: "100%",
      y2: "100%"
    }, /*#__PURE__*/React.createElement("stop", {
      offset: "0%",
      stopColor: "#38bdf8"
    }), /*#__PURE__*/React.createElement("stop", {
      offset: "100%",
      stopColor: "#0284c7"
    })), /*#__PURE__*/React.createElement("linearGradient", {
      id: "heli-grad",
      x1: "0%",
      y1: "0%",
      x2: "100%",
      y2: "100%"
    }, /*#__PURE__*/React.createElement("stop", {
      offset: "0%",
      stopColor: "#a78bfa"
    }), /*#__PURE__*/React.createElement("stop", {
      offset: "100%",
      stopColor: "#6d28d9"
    })), /*#__PURE__*/React.createElement("linearGradient", {
      id: "lig-grad",
      x1: "0%",
      y1: "0%",
      x2: "100%",
      y2: "100%"
    }, /*#__PURE__*/React.createElement("stop", {
      offset: "0%",
      stopColor: "#34d399"
    }), /*#__PURE__*/React.createElement("stop", {
      offset: "100%",
      stopColor: "#047857"
    }))), /*#__PURE__*/React.createElement("g", {
      style: {
        opacity: 0.15
      }
    }, floatingPool.map(fb => /*#__PURE__*/React.createElement("g", {
      key: fb.id,
      transform: `translate(${fb.x}, ${fb.y}) scale(${fb.scale})`,
      className: fb.speedClass,
      style: {
        animationDelay: fb.delay
      }
    }, /*#__PURE__*/React.createElement("path", {
      d: "M -8 0 L 8 0 L 8 16 Q 8 20 4 20 L -4 20 Q -8 20 -8 16 Z",
      fill: COLORS[fb.type].main,
      stroke: "#0f172a",
      strokeWidth: "2"
    }), /*#__PURE__*/React.createElement("text", {
      x: "0",
      y: "14",
      className: "dna-base-text",
      fill: "#ffffff",
      fontSize: "14",
      textAnchor: "middle"
    }, fb.type)))), /*#__PURE__*/React.createElement("path", {
      d: generateBackbone(true),
      fill: "none",
      stroke: "#e2e8f0",
      strokeWidth: "12",
      strokeLinecap: "round"
    }), /*#__PURE__*/React.createElement("path", {
      d: generateBackbone(true),
      fill: "none",
      stroke: "#94a3b8",
      strokeWidth: "12",
      strokeDasharray: "2 6",
      strokeLinecap: "round"
    }), /*#__PURE__*/React.createElement("path", {
      d: generateBackbone(false),
      fill: "none",
      stroke: "#e2e8f0",
      strokeWidth: "12",
      strokeLinecap: "round"
    }), /*#__PURE__*/React.createElement("path", {
      d: generateBackbone(false),
      fill: "none",
      stroke: "#94a3b8",
      strokeWidth: "12",
      strokeDasharray: "2 6",
      strokeLinecap: "round"
    }), animVals.leadExt > 0 && /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
      d: generateBackbone(true, true, 0, animVals.leadExt),
      fill: "none",
      stroke: "#bae6fd",
      strokeWidth: "12",
      strokeLinecap: "round"
    }), /*#__PURE__*/React.createElement("path", {
      d: generateBackbone(true, true, 0, animVals.leadExt),
      fill: "none",
      stroke: "#0284c7",
      strokeWidth: "12",
      strokeDasharray: "2 6",
      strokeLinecap: "round"
    })), animVals.lagExt > 0 && /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
      d: generateBackbone(false, true, animVals.forkX - 108 - animVals.lagExt, animVals.forkX - 108),
      fill: "none",
      stroke: "#bae6fd",
      strokeWidth: "12",
      strokeLinecap: "round"
    }), /*#__PURE__*/React.createElement("path", {
      d: generateBackbone(false, true, animVals.forkX - 108 - animVals.lagExt, animVals.forkX - 108),
      fill: "none",
      stroke: "#0284c7",
      strokeWidth: "12",
      strokeDasharray: "2 6",
      strokeLinecap: "round"
    })), /*#__PURE__*/React.createElement("g", {
      transform: `translate(${animVals.forkX - 30}, 240)`,
      style: {
        opacity: step >= 1 ? 0.9 : 0,
        transition: 'opacity 0.5s'
      },
      filter: "url(#drop-shadow-enzyme)"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M-15,-35 C20,-25 40,-15 40,0 C40,15 20,25 -15,35 C-25,15 -25,-15 -15,-35 Z",
      fill: "url(#heli-grad)",
      stroke: "#4c1d95",
      strokeWidth: "2"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M-5,-20 C15,-15 25,-5 25,0 C25,5 15,15 -5,20 C-10,5 -10,-5 -5,-20 Z",
      fill: "#ffffff",
      opacity: "0.2"
    }), /*#__PURE__*/React.createElement("g", {
      className: isAnimating && step === 1 ? "spin-core" : "",
      transform: "translate(10, 0)"
    }, /*#__PURE__*/React.createElement("circle", {
      cx: "0",
      cy: "0",
      r: "10",
      fill: "#8b5cf6",
      stroke: "#ddd6fe",
      strokeWidth: "2",
      strokeDasharray: "4 2"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "0",
      cy: "0",
      r: "4",
      fill: "#ffffff",
      opacity: "0.8"
    })), /*#__PURE__*/React.createElement("text", {
      x: "-25",
      y: "-45",
      fill: "#6d28d9",
      fontSize: "14",
      fontWeight: "900",
      textAnchor: "middle"
    }, "\u89E3\u65CB\u9176")), Array.from({
      length: totalBases
    }).map((_, i) => renderBase(i * baseW, getStrandY(i * baseW, true), getAngle(i * baseW, true), SEQUENCE2[i], COLORS[SEQUENCE2[i]].main, true)), Array.from({
      length: totalBases
    }).map((_, i) => renderBase(i * baseW, getStrandY(i * baseW, false), getAngle(i * baseW, false), COLORS[SEQUENCE2[i]].pair, COLORS[COLORS[SEQUENCE2[i]].pair].main, false)), step >= 2 && Array.from({
      length: totalBases
    }).map((_, i) => {
      const x = i * baseW;
      if (x < animVals.leadExt) {
        const angle = getAngle(x, true);
        const rad = (angle + 90) * Math.PI / 180;
        return renderBase(x + 30 * Math.cos(rad), getStrandY(x, true) + 30 * Math.sin(rad), angle, COLORS[SEQUENCE2[i]].pair, COLORS[COLORS[SEQUENCE2[i]].pair].main, false, i < 4);
      }
      return null;
    }), step >= 2 && Array.from({
      length: totalBases
    }).map((_, i) => {
      const x = i * baseW;
      const startX = animVals.forkX - 108;
      if (x <= startX && x > startX - animVals.lagExt) {
        const angle = getAngle(x, false);
        const rad = (angle - 90) * Math.PI / 180;
        return renderBase(x + 30 * Math.cos(rad), getStrandY(x, false) + 30 * Math.sin(rad), angle, SEQUENCE2[i], COLORS[SEQUENCE2[i]].main, true, x > startX - 4 * baseW);
      }
      return null;
    }), animVals.leadExt > 0 && (() => {
      const angle = getAngle(animVals.leadExt, true);
      const rad = (angle + 90) * Math.PI / 180;
      return /*#__PURE__*/React.createElement("g", {
        className: isAnimating && step === 3 ? "pulse-enzyme" : "",
        transform: `translate(${animVals.leadExt + 30 * Math.cos(rad)}, ${getStrandY(animVals.leadExt, true) + 30 * Math.sin(rad)}) rotate(${angle})`,
        filter: "url(#drop-shadow-enzyme)"
      }, /*#__PURE__*/React.createElement("path", {
        d: "M-30,-28 C-5,-45 40,-35 45,-10 C50,15 30,35 -10,35 C-40,30 -50,5 -30,-28 Z",
        fill: "url(#poly-grad)",
        stroke: "#0369a1",
        strokeWidth: "2"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M-20,-15 C-5,-25 25,-20 30,-5 C35,10 20,20 -5,20 C-20,15 -30,0 -20,-15 Z",
        fill: "#ffffff",
        opacity: "0.2"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "15",
        cy: "0",
        r: "8",
        fill: "#e0f2fe",
        className: isAnimating && step === 3 ? "catalyst-glow" : ""
      }), /*#__PURE__*/React.createElement("text", {
        x: "-5",
        y: "-45",
        fill: "#0284c7",
        fontSize: "14",
        fontWeight: "900",
        textAnchor: "middle"
      }, "DNA\u805A\u5408\u9176"));
    })(), animVals.lagExt > 0 && animVals.lagExt < 180 && (() => {
      const lx = animVals.forkX - 108 - animVals.lagExt;
      const angle = getAngle(lx, false);
      const rad = (angle - 90) * Math.PI / 180;
      return /*#__PURE__*/React.createElement("g", {
        className: isAnimating && step === 3 ? "pulse-enzyme" : "",
        transform: `translate(${lx + 30 * Math.cos(rad)}, ${getStrandY(lx, false) + 30 * Math.sin(rad)}) rotate(${angle})`,
        filter: "url(#drop-shadow-enzyme)"
      }, /*#__PURE__*/React.createElement("path", {
        d: "M-30,-28 C-5,-45 40,-35 45,-10 C50,15 30,35 -10,35 C-40,30 -50,5 -30,-28 Z",
        fill: "url(#poly-grad)",
        stroke: "#0369a1",
        strokeWidth: "2",
        transform: "scale(-1, 1)"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M-20,-15 C-5,-25 25,-20 30,-5 C35,10 20,20 -5,20 C-20,15 -30,0 -20,-15 Z",
        fill: "#ffffff",
        opacity: "0.2",
        transform: "scale(-1, 1)"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "-15",
        cy: "0",
        r: "8",
        fill: "#e0f2fe",
        className: isAnimating && step === 3 ? "catalyst-glow" : ""
      }), /*#__PURE__*/React.createElement("text", {
        x: "-5",
        y: "55",
        fill: "#0284c7",
        fontSize: "14",
        fontWeight: "900",
        textAnchor: "middle"
      }, "DNA\u805A\u5408\u9176"));
    })(), step >= 4 && (() => {
      const lx = animVals.forkX - 108 - animVals.ligasePos * 180;
      const angle = getAngle(lx, false);
      const rad = (angle - 90) * Math.PI / 180;
      return /*#__PURE__*/React.createElement("g", {
        transform: `translate(${lx + 30 * Math.cos(rad)}, ${getStrandY(lx, false) + 30 * Math.sin(rad)})`,
        style: {
          opacity: animVals.ligasePos >= 1 ? 0 : 1,
          transition: 'opacity 0.3s'
        },
        filter: "url(#drop-shadow-enzyme)"
      }, /*#__PURE__*/React.createElement("path", {
        d: "M0,-25 C15,-25 25,-10 25,5 C25,20 15,30 0,30 C-15,30 -25,20 -25,5 C-25,-10 -15,-25 0,-25 Z",
        fill: "url(#lig-grad)",
        stroke: "#065f46",
        strokeWidth: "2"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "-5",
        cy: "-8",
        r: "6",
        fill: "#ffffff",
        opacity: "0.4"
      }), /*#__PURE__*/React.createElement("text", {
        x: "0",
        y: "4",
        fill: "#ffffff",
        fontSize: "11",
        fontWeight: "bold",
        textAnchor: "middle"
      }, "\u8FDE\u63A5\u9176"));
    })(), /*#__PURE__*/React.createElement("g", {
      className: "font-bold",
      fontSize: "14",
      textAnchor: "middle",
      alignmentBaseline: "middle"
    }, /*#__PURE__*/React.createElement("text", {
      x: "-25",
      y: getStrandY(0, true) - 20,
      fill: "#64748b"
    }, "3'"), /*#__PURE__*/React.createElement("text", {
      x: "-25",
      y: getStrandY(0, false) + 20,
      fill: "#64748b"
    }, "5'"), step >= 2 && (() => {
      // 核心修复点 4：将新合成链的 3' 5' 文字标签，安心地保留在两根蓝色骨架内部 (+75px偏移)
      const radT5 = (getAngle(0, true) + 90) * Math.PI / 180;
      const radT3 = (getAngle(animVals.leadExt, true) + 90) * Math.PI / 180;
      const radB5 = (getAngle(animVals.forkX - 108, false) - 90) * Math.PI / 180;
      const lxEnd = animVals.forkX - 108 - animVals.lagExt;
      const radB3 = (getAngle(lxEnd, false) - 90) * Math.PI / 180;
      return /*#__PURE__*/React.createElement("g", {
        style: {
          opacity: animVals.primerOp
        }
      }, /*#__PURE__*/React.createElement("text", {
        x: 0 + 75 * Math.cos(radT5),
        y: getStrandY(0, true) + 75 * Math.sin(radT5),
        dy: "0.35em",
        fill: "#0284c7"
      }, "5'"), animVals.leadExt > 0 && /*#__PURE__*/React.createElement("text", {
        x: animVals.leadExt + 75 * Math.cos(radT3),
        y: getStrandY(animVals.leadExt, true) + 75 * Math.sin(radT3),
        dy: "0.35em",
        fill: "#0284c7"
      }, "3' (\u8FDE\u7EED)"), /*#__PURE__*/React.createElement("text", {
        x: animVals.forkX - 108 + 75 * Math.cos(radB5),
        y: getStrandY(animVals.forkX - 108, false) + 75 * Math.sin(radB5),
        dy: "0.35em",
        fill: "#0284c7"
      }, "5'"), animVals.lagExt > 0 && /*#__PURE__*/React.createElement("text", {
        x: lxEnd + 75 * Math.cos(radB3),
        y: getStrandY(lxEnd, false) + 75 * Math.sin(radB3),
        dy: "0.35em",
        fill: "#0284c7"
      }, "3' (\u5188\u5D0E\u7247\u6BB5)"));
    })()))));
  };
  const STRUCTURE_META = [{
    short: "单位",
    title: "1. 认识基本单位",
    desc: "观察【脱氧核苷酸】的真实结构：中心带有氧原子的五碳糖，1'位连着含氮碱基，5'位连着磷酸基团。"
  }, {
    short: "单链",
    title: "2. 形成单链",
    desc: "核苷酸通过【磷酸二酯键】纵向连接：上一个核苷酸的 3' 位与下一个核苷酸的 5' 位磷酸相连。"
  }, {
    short: "配对",
    title: "3. 碱基互补配对",
    desc: "另一条链以【反向平行】滑入。A 与 T 形成 2 个氢键，C 与 G 形成 3 个氢键。"
  }, {
    short: "解析",
    title: "4. 经典 2D 展开图解析",
    desc: "左侧展示螺旋参数，右侧放大骨架、氢键和互补配对细节。"
  }];
  const REPLICATION_META = [{
    short: "环境",
    title: "0. 微观核液环境",
    desc: "背景中游离漂浮的是脱氧核苷酸原料，右侧双链母链模板准备进入复制。"
  }, {
    short: "解旋",
    title: "1. 仿生解旋",
    desc: "紫色解旋酶带着旋转催化核心，挤入 DNA 双链内部并撑开复制叉。"
  }, {
    short: "引物",
    title: "2. 引物结合",
    desc: "橙色 RNA 引物生成，为后续复制提供游离的 3'-OH 起点。"
  }, {
    short: "延伸",
    title: "3. 聚合酶抓取",
    desc: "DNA 聚合酶包裹骨架，抓取游离核苷酸并按 5'→3' 方向合成。"
  }, {
    short: "缝合",
    title: "4. 酶促缝合",
    desc: "DNA 连接酶滑过冈崎片段，封闭磷酸二酯键缺口。"
  }];
  function sceneCss() {
    return `
    .dna-source-stage,.dna-source-stage *,.dna-source-panel,.dna-source-panel *{box-sizing:border-box}.dna-source-stage,.dna-source-panel{width:100%;height:100%;min-width:0;min-height:0;font-family:"Microsoft YaHei","PingFang SC",Inter,system-ui,sans-serif;touch-action:manipulation;-webkit-tap-highlight-color:transparent}.dna-source-stage{overflow:hidden;border-radius:clamp(24px,4vw,48px);border:1px solid rgba(255,255,255,.08);background:#f8fafc;box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 30px 90px rgba(0,0,0,.42)}.dna-source-stage>div{width:100%;height:100%;min-width:0;min-height:0}.dna-source-toolbar{display:none!important}.dna-source-stage .bg-grid-light{background-color:#f8fafc;background-image:radial-gradient(circle at center,#cbd5e1 1px,transparent 1px);background-size:24px 24px}.dna-source-stage .dna-base-text{font-family:"JetBrains Mono",Consolas,"Courier New",monospace;font-weight:700}.dna-source-stage .anim-smooth{transition:all .8s cubic-bezier(.4,0,.2,1)}.dna-source-stage .pulse-enzyme{animation:dnaSourcePulseEnzyme 2s infinite alternate ease-in-out}.dna-source-stage .spin-core{animation:dnaSourceSpin 3s linear infinite;transform-origin:center}.dna-source-stage .float-slow{animation:dnaSourceFloat 15s ease-in-out infinite alternate}.dna-source-stage .float-fast{animation:dnaSourceFloat 8s ease-in-out infinite alternate-reverse}.dna-source-stage .catalyst-glow{animation:dnaSourceCatalyst 1s infinite alternate}@keyframes dnaSourcePulseEnzyme{0%{filter:drop-shadow(0 4px 8px rgba(14,165,233,.4));transform:scale(1) rotate(0deg)}100%{filter:drop-shadow(0 12px 20px rgba(14,165,233,.7));transform:scale(1.03) rotate(1deg)}}@keyframes dnaSourceSpin{100%{transform:rotate(360deg)}}@keyframes dnaSourceFloat{0%{transform:translate(0,0) rotate(0deg)}50%{transform:translate(15px,-20px) rotate(15deg)}100%{transform:translate(-10px,15px) rotate(-10deg)}}@keyframes dnaSourceCatalyst{0%{opacity:.5;r:6}100%{opacity:1;r:10;fill:#fff}}
    .dna-source-stage{--dna-stage-pad-x:clamp(18px,3vw,34px);--dna-stage-pad-y:clamp(12px,2.4vh,24px)}.dna-source-stage>div>.flex-grow{padding:var(--dna-stage-pad-y) var(--dna-stage-pad-x)}.dna-source-stage>div>.flex-grow>svg{width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;overflow:visible}@media(max-width:900px){.dna-source-stage{--dna-stage-pad-x:clamp(24px,4.6vw,38px);--dna-stage-pad-y:clamp(14px,3.2vh,22px)}}@media(max-height:500px){.dna-source-stage{--dna-stage-pad-x:clamp(26px,5vw,40px);--dna-stage-pad-y:clamp(12px,3vh,18px)}}
    .dna-source-panel{--op-pad:clamp(8px,1.2vh,12px);--op-gap:clamp(5px,.9vh,8px);overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;touch-action:pan-y;scrollbar-width:none;border-radius:var(--bio-scene-panel-radius,28px);border:1px solid rgba(255,255,255,.09);background:linear-gradient(180deg,rgba(17,20,22,.98),rgba(6,9,10,.98));padding:var(--op-pad);display:flex;flex-direction:column;gap:var(--op-gap);color:#f8fafc;box-shadow:inset 0 1px 0 rgba(255,255,255,.045)}.dna-source-panel::-webkit-scrollbar{width:0;height:0}.dna-panel-top{flex:0 0 auto;padding:0 2px}.dna-panel-kicker,.dna-panel-sectionTitle span{display:block;color:#34d399;font-size:10px;line-height:1;font-weight:950;letter-spacing:.12em}.dna-panel-top h3{margin:4px 0 0;color:#fff;font-size:clamp(18px,2.55vh,22px);line-height:1.08;font-weight:950}.dna-panel-section{flex:0 0 auto;min-height:0;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.035);border-radius:14px;padding:clamp(6px,.92vh,8px);display:grid;gap:clamp(4px,.72vh,6px)}.dna-panel-sectionTitle{display:flex;align-items:center;justify-content:space-between;gap:10px}.dna-panel-sectionTitle span{color:rgba(148,163,184,.84)}.dna-panel-sectionTitle strong{max-width:176px;color:rgba(255,255,255,.9);font-size:10px;line-height:1.2;font-weight:900;text-align:right}.dna-mode-grid,.dna-action-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.dna-step-grid{display:grid;grid-template-columns:repeat(var(--steps),minmax(0,1fr));gap:5px}.dna-source-panel button{min-height:var(--bio-touch-target,44px);border:1px solid rgba(255,255,255,.09);border-radius:12px;background:rgba(255,255,255,.05);color:rgba(226,232,240,.74);cursor:pointer;font-family:inherit;font-weight:950;touch-action:manipulation;-webkit-tap-highlight-color:transparent}.dna-source-panel button:disabled{cursor:not-allowed;opacity:.38}.dna-source-panel button.is-active{border-color:rgba(52,211,153,.62);background:rgba(16,185,129,.16);color:#fff;box-shadow:0 0 16px rgba(16,185,129,.13)}.dna-mode-grid button,.dna-step-grid button{display:grid;place-items:center;gap:2px;padding:5px 4px}.dna-mode-grid button b{font-size:13px;line-height:1}.dna-mode-grid button span,.dna-step-grid button span{font-size:9px;line-height:1}.dna-step-grid button b{font-size:12px;line-height:1}.dna-action-grid button{padding:0 7px;font-size:11px;letter-spacing:.04em}.dna-action-grid button.is-hot{border-color:rgba(103,232,249,.58);background:rgba(8,145,178,.18);color:#ecfeff}.dna-panel-note{flex:1 1 auto;min-height:0}.dna-panel-note h4{margin:0;color:#67e8f9;font-size:clamp(12px,1.8vh,14px);line-height:1.25;font-weight:950}.dna-panel-note p{margin:5px 0 0;color:rgba(226,232,240,.76);font-size:clamp(10px,1.55vh,12px);line-height:1.42;font-weight:720;overflow:hidden}@media(max-height:620px){.dna-source-panel{--op-pad:7px;--op-gap:5px}.dna-panel-top h3{font-size:17px}.dna-panel-note p{display:none}.dna-source-panel button{min-height:40px}}@media(max-height:500px){.dna-panel-note{display:none}}@media(max-width:860px){.dna-mode-grid button span{display:none}.dna-panel-kicker{font-size:9px}}
  `;
  }
  function ControlPanel({
    mode,
    setMode,
    activeStep,
    busy,
    onNext,
    onReset,
    layout
  }) {
    const metas = mode === "structure" ? STRUCTURE_META : REPLICATION_META;
    const meta = metas[activeStep] || metas[0];
    return /*#__PURE__*/React.createElement("aside", {
      className: "dna-source-panel " + (layout?.tinyLandscape ? "is-tiny" : "")
    }, /*#__PURE__*/React.createElement("div", {
      className: "dna-panel-top"
    }, /*#__PURE__*/React.createElement("span", {
      className: "dna-panel-kicker"
    }, "DNA 操作面板"), /*#__PURE__*/React.createElement("h3", null, mode === "structure" ? "结构组装动态演示" : "复制引擎实时推演")), /*#__PURE__*/React.createElement("section", {
      className: "dna-panel-section"
    }, /*#__PURE__*/React.createElement("div", {
      className: "dna-panel-sectionTitle"
    }, /*#__PURE__*/React.createElement("span", null, "模式"), /*#__PURE__*/React.createElement("strong", null, meta.short)), /*#__PURE__*/React.createElement("div", {
      className: "dna-mode-grid"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: mode === "structure" ? "is-active" : "",
      onClick: () => setMode("structure")
    }, /*#__PURE__*/React.createElement("b", null, "结构"), /*#__PURE__*/React.createElement("span", null, "结构组装动态演示")), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: mode === "replication" ? "is-active" : "",
      onClick: () => setMode("replication")
    }, /*#__PURE__*/React.createElement("b", null, "复制"), /*#__PURE__*/React.createElement("span", null, "复制引擎实时推演")))), /*#__PURE__*/React.createElement("section", {
      className: "dna-panel-section"
    }, /*#__PURE__*/React.createElement("div", {
      className: "dna-panel-sectionTitle"
    }, /*#__PURE__*/React.createElement("span", null, "步骤"), /*#__PURE__*/React.createElement("strong", null, activeStep + 1, " / ", metas.length)), /*#__PURE__*/React.createElement("div", {
      className: "dna-step-grid",
      style: {
        "--steps": metas.length
      }
    }, metas.map((item, index) => /*#__PURE__*/React.createElement("button", {
      key: item.short,
      type: "button",
      className: index === activeStep ? "is-active" : "",
      disabled: true
    }, /*#__PURE__*/React.createElement("b", null, index), /*#__PURE__*/React.createElement("span", null, item.short))))), /*#__PURE__*/React.createElement("section", {
      className: "dna-panel-section"
    }, /*#__PURE__*/React.createElement("div", {
      className: "dna-panel-sectionTitle"
    }, /*#__PURE__*/React.createElement("span", null, "操作"), /*#__PURE__*/React.createElement("strong", null, busy ? "动画播放中" : "可手动推进")), /*#__PURE__*/React.createElement("div", {
      className: "dna-action-grid"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: onReset,
      disabled: busy
    }, "重置"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "is-hot",
      onClick: onNext,
      disabled: busy || activeStep >= metas.length - 1
    }, activeStep >= metas.length - 1 ? "已完成" : "播放下一步"))), /*#__PURE__*/React.createElement("section", {
      className: "dna-panel-section dna-panel-note"
    }, /*#__PURE__*/React.createElement("div", {
      className: "dna-panel-sectionTitle"
    }, /*#__PURE__*/React.createElement("span", null, "本步说明"), /*#__PURE__*/React.createElement("strong", null, meta.short)), /*#__PURE__*/React.createElement("h4", null, meta.title), /*#__PURE__*/React.createElement("p", null, meta.desc)));
  }
  function SceneApp({
    externalPanel,
    layout
  }) {
    const hostRef = useRef(null);
    const [modeState, setModeState] = useState("structure");
    const [steps, setSteps] = useState({
      structure: 0,
      replication: 0
    });
    const [busy, setBusy] = useState(false);
    const busyTimer = useRef(0);
    const metas = modeState === "structure" ? STRUCTURE_META : REPLICATION_META;
    const activeStep = steps[modeState] || 0;
    useEffect(() => () => {
      if (busyTimer.current) window.clearTimeout(busyTimer.current);
    }, []);
    const setBusyFor = duration => {
      setBusy(true);
      if (busyTimer.current) window.clearTimeout(busyTimer.current);
      busyTimer.current = window.setTimeout(() => setBusy(false), duration);
    };
    const setMode = nextMode => {
      if (nextMode === modeState) return;
      if (busyTimer.current) window.clearTimeout(busyTimer.current);
      setBusy(false);
      setModeState(nextMode);
      setSteps(prev => ({
        ...prev,
        [nextMode]: 0
      }));
    };
    const clickOriginal = action => {
      const selector = '[data-dna-origin-' + action + '="' + modeState + '"]';
      const button = hostRef.current?.querySelector(selector);
      if (button && !button.disabled) button.click();
    };
    const onReset = () => {
      clickOriginal("reset");
      setSteps(prev => ({
        ...prev,
        [modeState]: 0
      }));
      setBusyFor(modeState === "structure" ? 250 : 1550);
    };
    const onNext = () => {
      if (activeStep >= metas.length - 1) return;
      clickOriginal("next");
      setSteps(prev => ({
        ...prev,
        [modeState]: Math.min(metas.length - 1, (prev[modeState] || 0) + 1)
      }));
      const replicationDurations = [0, 2550, 1550, 3550, 2050];
      setBusyFor(modeState === "structure" ? 1550 : replicationDurations[activeStep + 1] || 1700);
    };
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, sceneCss()), /*#__PURE__*/React.createElement("div", {
      ref: hostRef,
      className: "dna-source-stage"
    }, modeState === "structure" ? /*#__PURE__*/React.createElement(StructureTeaching, {
      key: "structure"
    }) : /*#__PURE__*/React.createElement(ReplicationTeaching, {
      key: "replication"
    })), externalPanel ? ReactDOM.createPortal( /*#__PURE__*/React.createElement(ControlPanel, {
      mode: modeState,
      setMode: setMode,
      activeStep: activeStep,
      busy: busy,
      onNext: onNext,
      onReset: onReset,
      layout: layout || {}
    }), externalPanel) : null);
  }
  return {
    mount(container, context = {}) {
      const root = ReactDOM.createRoot(container);
      container.__dnaSourceRoot = root;
      root.render( /*#__PURE__*/React.createElement(SceneApp, {
        externalPanel: context.externalPanel || null,
        layout: context.layout || {}
      }));
    },
    unmount(container) {
      if (container.__dnaSourceRoot) {
        container.__dnaSourceRoot.unmount();
        container.__dnaSourceRoot = null;
      }
      container.innerHTML = "";
    }
  };
}();
