import{r as $,j as o,R as k}from"./vendor-react-CAgePYhq.js?v=3ccd0bd03c60";import{g as H,aq as j,z as w}from"./vendor-three-core-BuStaZkr.js?v=ca9126df65f1";import{C as z}from"./feature-3d-shared-BE-c-NwZ.js?v=20229876bc60";import{a as P}from"./feature-element-model-mD655Rse.js?v=30b3cb954fc1";import{u as S}from"./useResponsiveHudCollapse-BLUAhQgs.js?v=dd4386d1de09";import{m as R,K as F,N as M,R as E,j as A}from"./vendor-icons-uWO-EytA.js?v=91c9fb55b13a";import{E as _,O as D,C as G,H as V}from"./vendor-drei-B0rt3vom.js?v=64f9d69af20b";import{a as L}from"./vendor-r3f-SOCY3ZtC.js?v=1f11eed4302c";import"./vendor-postprocessing-C4Wc0gGt.js?v=d1d0c6978d92";import"./vendor-three-stdlib-DC840Q71.js?v=adde6d431311";const T=P("vendor/drei-assets/hdri/potsdamer_platz_1k.hdr"),B={C:{color:"#2a2a2a",radius:.4},H:{color:"#ffffff",radius:.25},O:{color:"#ff2222",radius:.35},N:{color:"#3050ff",radius:.38},CH3:{color:"#444444",radius:.5},Cl:{color:"#10b981",radius:.42},F:{color:"#fbbf24",radius:.32},Ph:{color:"#8b5cf6",radius:.55},CN:{color:"#0ea5e9",radius:.45},COOCH3:{color:"#ff4444",radius:.55},Ghost:{color:"transparent",radius:.01}},v={pe:{label:"聚乙烯 (PE)",titles:["小分子单体：乙烯 (C2H4)","链式反应：π 键断裂，自由基扩展","高分子：聚乙烯无限长链 [-CH2-CH2-]n"],actions:["引发双键断裂","链接形成高分子","聚合完成"],desc:"加聚反应：含有不饱和键（如 C=C）的单体分子通过 π 键的断裂，相互加成形成高分子化合物。该过程无副产物脱出。您可拖拽旋转以观察主链碳原子的锯齿状空间构象。"},pvc:{label:"聚氯乙烯 (PVC)",titles:["小分子单体：氯乙烯 (C2H3Cl)","链式反应：π 键断裂，自由基扩展","高分子：聚氯乙烯无限长链 [-CH2-CHCl-]n"],actions:["引发双键断裂","链接形成高分子","聚合完成"],desc:"聚氯乙烯（PVC）是最常用的塑料之一，单体为一个氢原子被氯原子取代的氯乙烯。由于引入了较大的氯原子，PVC分子链的柔性降低，材料较硬。"},pp:{label:"聚丙烯 (PP)",titles:["小分子单体：丙烯 (C3H6)","链式反应：π 键断裂，自由基扩展","高分子：聚丙烯无限长链 [-CH2-CH(CH3)-]n"],actions:["引发双键断裂","链接形成高分子","聚合完成"],desc:"聚丙烯（PP）的单体是丙烯，每个单体上带有一个甲基(-CH3)侧基。侧基的空间排布直接决定了它的物理性质和结晶度。"},ptfe:{label:"特氟龙 (PTFE)",titles:["小分子单体：四氟乙烯 (C2F4)","链式反应：π 键断裂，自由基扩展","高分子：聚四氟乙烯 [-CF2-CF2-]n"],actions:["引发双键断裂","链接形成高分子","聚合完成"],desc:"聚四氟乙烯，俗称“塑料王”或特氟龙。由于氟原子体积比氢原子大，紧密排列的氟原子如同盔甲般保护碳链，赋予其极强的耐腐蚀性和极低的摩擦系数。"},ps:{label:"聚苯乙烯 (PS)",titles:["小分子单体：苯乙烯","链式反应：π 键断裂，自由基扩展","高分子：聚苯乙烯 [-CH2-CH(Ph)-]n"],actions:["引发双键断裂","链接形成高分子","聚合完成"],desc:"单体为带有庞大苯环侧基的苯乙烯。苯环的空间位阻使得PS具有较高的刚性和脆性。"},pan:{label:"聚丙烯腈 (PAN)",titles:["小分子单体：丙烯腈","链式反应：π 键断裂，自由基扩展","高分子：聚丙烯腈 [-CH2-CH(CN)-]n"],actions:["引发双键断裂","链接形成高分子","聚合完成"],desc:"腈基(-CN)具有强极性，使高分子链间产生强烈的偶极作用力，因此PAN是优良的合成纤维材料。"},pva:{label:"聚乙烯醇 (PVA)",titles:["小分子单体：乙烯醇","链式反应：π 键断裂，自由基扩展","高分子：聚乙烯醇 [-CH2-CH(OH)-]n"],actions:["引发双键断裂","链接形成高分子","聚合完成"],desc:"含有大量亲水性羟基(-OH)，是极少数可溶于水的高分子聚合物之一。"},peptide:{label:"多肽链 (缩聚)",titles:["小分子单体：氨基酸 (Amino Acids)","官能团反应：脱去小分子 H2O","高分子：多肽链与肽键 (Peptide Bond)"],actions:["官能团对接","链接形成高分子","聚合完成"],desc:"缩聚反应：含有两个或多个反应性官能团的单体，通过相互缩合生成高分子，同时伴随小分子（如水、氨）的析出。您可拖拽旋转以观察脱水过程和酰胺键的三维平面性。"},pla:{label:"聚乳酸 (PLA)",titles:["小分子单体：乳酸 (Lactic Acid)","酯化缩聚反应：脱去小分子 H2O","高分子：聚乳酸 (可降解塑料)"],actions:["官能团对接","酯键形成脱水","聚合完成"],desc:"由乳酸分子中的羟基(-OH)和羧基(-COOH)相互缩合脱水形成的聚酯，是目前最受关注的生物可降解环保材料。"},pmma:{label:"有机玻璃 (PMMA)",titles:["小分子单体：甲基丙烯酸甲酯","链式反应：π 键断裂，自由基扩展","高分子：聚甲基丙烯酸甲酯 (亚克力)"],actions:["引发双键断裂","链接形成高分子","聚合完成"],desc:"俗称亚克力或有机玻璃。单体上同时连有甲基和酯基，由于侧基体积庞大且空间排布不规则，通常为无定形结构，使其具有极高的透明度。"},pvdf:{label:"聚偏氟乙烯 (PVDF)",titles:["小分子单体：偏氟乙烯","链式反应：π 键断裂，自由基扩展","高分子：聚偏氟乙烯 [-CH2-CF2-]n"],actions:["引发双键断裂","链接形成高分子","聚合完成"],desc:"单体为偏氟乙烯，同一个碳原子上连有两个氟原子。PVDF具有优异的耐腐蚀性、压电性和热电性，被广泛用于锂电池正极粘结剂。"},pib:{label:"聚异丁烯 (PIB)",titles:["小分子单体：异丁烯","链式反应：π 键断裂，自由基扩展","高分子：聚异丁烯 [-CH2-C(CH3)2-]n"],actions:["引发双键断裂","链接形成高分子","聚合完成"],desc:"异丁烯单体在同一个碳上连有两个甲基。密集的双甲基阻碍了高分子链的自由旋转和气体分子的通过，因此聚异丁烯具有极好的气密性，常用于轮胎内胎。"}},U=(r,f)=>["peptide","pla"].includes(r)?f===0?{condition:"单体混合 / 常温或加热",reaction:"nR-OH + nR-COOH",mechanism:"微观机理：空间中充满了独立的单体分子。这些单体分子两端携带着不同的活性官能团。此时单体通过热运动不断碰撞，等待官能团之间的脱水缩合反应发生。"}:f===1?{condition:"缩聚反应 / 脱水剂或酶催化",reaction:"-OH + -COOH → -COO- + H₂O",mechanism:"微观机理：两个单体的官能团发生剧烈碰撞，其中一个基团脱去羟基(-OH)，另一个脱去氢原子(-H)，结合生成小分子水(H₂O)并脱离系统。残余的分子片段形成坚固的酰胺键或酯键。"}:{condition:"缩聚完成 / 冷却定型",reaction:"[-R-COO-]n + nH₂O",mechanism:"聚合终态：官能团的大规模缩合结束，形成了包含数百至数千个重复单元的长链主骨架。由于主链中含有极性较强的肽键或酯键，这些高分子容易在自然环境下被微生物或水解酶降解。"}:f===0?{condition:"引发剂 / 加热或光照",reaction:"R· + C=C → R-C-C·",mechanism:"微观引发阶段：系统中漂浮着大量的游离单体。在加热或光照条件下，引发剂发生均裂，产生带有未成对电子的高活性“自由基”。这些游离基就像是饥饿的捕食者，正准备攻击单体中较弱的碳碳 π 键。"}:f===1?{condition:"链式增长 / 极低活化能",reaction:"R-C-C· + n(C=C) → R-(C-C)n·",mechanism:"微观增长阶段：自由基成功打开了双键的 π 键，强迫其电子重新分配，形成稳定的单键（σ键）。但这使得相邻的碳原子变成了新的自由基！这个过程像多米诺骨牌一样瞬间传递，碳骨架以极高的速度呈“之”字形疯狂延伸。"}:{condition:"自由基终止 / 形成高分子",reaction:"2 R-M_n· → R-M₂n-R",mechanism:"聚合终态：当两条正在生长的“疯狂”长链的自由基末端偶然相遇时，它们的未成对电子终于结合，链式反应瞬间停止。数以万计的碳原子构成了庞大而柔韧的三维拓扑长链，也就是我们宏观上看到的塑料或橡胶材料。"};function q({targetPos:r,element:f,label:a}){const t=$.useRef(null),n=B[f]||{color:"#aaaaaa",radius:.3},l=$.useMemo(()=>new H(...r),[r]);if(L((p,m)=>{t.current&&t.current.position.lerp(l,4*m)}),f==="Ghost")return o.jsx("group",{ref:t,position:r});const d=r[2],c=d>.1?n.radius+.2:d<-.1?-n.radius-.2:0,i=n.radius+.3;return o.jsxs("group",{ref:t,position:r,children:[o.jsxs("mesh",{castShadow:!0,receiveShadow:!0,children:[o.jsx("sphereGeometry",{args:[n.radius,32,32]}),o.jsx("meshStandardMaterial",{color:n.color,roughness:.3,metalness:.4})]}),a?o.jsx(V,{position:[c,i,0],center:!0,style:{pointerEvents:"none",zIndex:d>0?10:0},children:o.jsx("div",{className:"polymer-atom-label",children:a})}):null]})}function I({p1:r,p2:f,opacity:a=1}){const t=$.useRef(null),n=$.useRef(null),l=$.useRef(null);if(!l.current){const d=new H(...r),c=new H(...f),i=d.distanceTo(c),p=d.clone().lerp(c,.5),m=c.clone().sub(d).normalize(),e=new j().setFromUnitVectors(new H(0,1,0),m);l.current={center:p,distance:i,quaternion:e}}return L((d,c)=>{if(!t.current)return;const i=new H(...r),p=new H(...f),m=i.distanceTo(p),e=i.clone().lerp(p,.5);if(t.current.position.lerp(e,4*c),t.current.scale.y=w.lerp(t.current.scale.y,m,4*c),m>.01){const u=p.clone().sub(i).normalize(),s=new j().setFromUnitVectors(new H(0,1,0),u);t.current.quaternion.slerp(s,4*c)}n.current&&(n.current.opacity=w.lerp(n.current.opacity,a,4*c))}),o.jsxs("mesh",{ref:t,position:l.current.center,quaternion:l.current.quaternion,scale:[1,l.current.distance,1],castShadow:!0,receiveShadow:!0,children:[o.jsx("cylinderGeometry",{args:[.06,.06,1,16]}),o.jsx("meshStandardMaterial",{ref:n,color:a<1?"#ff5555":"#888888",transparent:!0,opacity:a,roughness:.4})]})}function g(r="pe"){const a={atoms:[],bonds:[]},t={atoms:[],bonds:[]},n={atoms:[],bonds:[]};let l="H",d="H",c="H",i="H",p="",m="",e="",u="";r==="pvc"&&(l="Cl",p="Cl"),r==="pp"&&(l="CH3",p="CH₃"),r==="ptfe"&&(l="F",d="F",c="F",i="F",p="F",m="F",e="F",u="F"),r==="ps"&&(l="Ph",p="C₆H₅"),r==="pan"&&(l="CN",p="CN"),r==="pva"&&(l="O",p="OH"),r==="pmma"&&(l="CH3",p="CH₃",d="COOCH3",m="COOCH₃"),r==="pvdf"&&(l="F",p="F",d="F",m="F"),r==="pib"&&(l="CH3",p="CH₃",d="CH3",m="CH₃");for(let s=0;s<5;s+=1){const x=(s-2)*3,h=s%2===0?1.5:-1.5,b=s%2===0?-1:1,y=[x-.6,h,b],O=[x+.6,h,b];a.atoms.push({id:`C${2*s}`,element:"C",pos:y}),a.atoms.push({id:`C${2*s+1}`,element:"C",pos:O}),a.bonds.push({id:`C${2*s}-C${2*s+1}`,p1:`C${2*s}`,p2:`C${2*s+1}`,offset:[0,.12,0]}),a.bonds.push({id:`C${2*s}-C${2*s+1}-pi`,p1:`C${2*s}`,p2:`C${2*s+1}`,offset:[0,-.12,0]}),a.atoms.push({id:`H${4*s}`,element:l,pos:[x-1.1,h+.866,b],label:s===0?p:""}),a.atoms.push({id:`H${4*s+1}`,element:d,pos:[x-1.1,h-.866,b],label:s===0?m:""}),a.atoms.push({id:`H${4*s+2}`,element:c,pos:[x+1.1,h+.866,b],label:s===0?e:""}),a.atoms.push({id:`H${4*s+3}`,element:i,pos:[x+1.1,h-.866,b],label:s===0?u:""}),a.bonds.push({id:`C${2*s}-H${4*s}`,p1:`C${2*s}`,p2:`H${4*s}`}),a.bonds.push({id:`C${2*s}-H${4*s+1}`,p1:`C${2*s}`,p2:`H${4*s+1}`}),a.bonds.push({id:`C${2*s+1}-H${4*s+2}`,p1:`C${2*s+1}`,p2:`H${4*s+2}`}),a.bonds.push({id:`C${2*s+1}-H${4*s+3}`,p1:`C${2*s+1}`,p2:`H${4*s+3}`});const C=(s-2)*2.2;t.atoms.push({id:`C${2*s}`,element:"C",pos:[C-.6,0,0]}),t.atoms.push({id:`C${2*s+1}`,element:"C",pos:[C+.6,0,0]}),t.bonds.push({id:`C${2*s}-C${2*s+1}`,p1:`C${2*s}`,p2:`C${2*s+1}`,offset:[0,.12,0]}),t.bonds.push({id:`C${2*s}-C${2*s+1}-pi`,p1:`C${2*s}`,p2:`C${2*s+1}`,opacity:.2,offset:[0,-.12,0]}),t.atoms.push({id:`H${4*s}`,element:l,pos:[C-.93,.85,.5],label:s===0?p:""}),t.atoms.push({id:`H${4*s+1}`,element:d,pos:[C-.93,-.85,-.5],label:s===0?m:""}),t.atoms.push({id:`H${4*s+2}`,element:c,pos:[C+.93,.85,.5],label:s===0?e:""}),t.atoms.push({id:`H${4*s+3}`,element:i,pos:[C+.93,-.85,-.5],label:s===0?u:""}),t.bonds.push({id:`C${2*s}-H${4*s}`,p1:`C${2*s}`,p2:`H${4*s}`}),t.bonds.push({id:`C${2*s}-H${4*s+1}`,p1:`C${2*s}`,p2:`H${4*s+1}`}),t.bonds.push({id:`C${2*s+1}-H${4*s+2}`,p1:`C${2*s+1}`,p2:`H${4*s+2}`}),t.bonds.push({id:`C${2*s+1}-H${4*s+3}`,p1:`C${2*s+1}`,p2:`H${4*s+3}`})}for(let s=0;s<4;s+=1)t.bonds.push({id:`Link-${s}`,p1:`C${2*s+1}`,p2:`C${2*(s+1)}`,opacity:.3});for(let s=0;s<5*2;s+=1){const x=(s-4.5)*1.2,h=s%2===0?.4:-.4;let b=l,y="";s%2===0?(b=l,s===0&&(y=p)):(b=c,s===1&&(y=e));let O=d,C="";s%2===0?(O=d,s===0&&(C=m)):(O=i,s===1&&(C=u)),n.atoms.push({id:`C${s}`,element:"C",pos:[x,h,0]}),n.atoms.push({id:`H${2*s}`,element:b,pos:[x,h+(s%2===0?.85:-.85),.5],label:y}),n.atoms.push({id:`H${2*s+1}`,element:O,pos:[x,h+(s%2===0?.85:-.85),-.5],label:C}),n.bonds.push({id:`C${s}-H${2*s}`,p1:`C${s}`,p2:`H${2*s}`}),n.bonds.push({id:`C${s}-H${2*s+1}`,p1:`C${s}`,p2:`H${2*s+1}`}),s<5*2-1&&n.bonds.push({id:`C${s}-C${s+1}`,p1:`C${s}`,p2:`C${s+1}`})}return[a,t,n]}function N(r="peptide"){const a={atoms:[],bonds:[]},t={atoms:[],bonds:[]},n={atoms:[],bonds:[]};let l="N",d="H2N",c="H",i="H",p="H",m="";r==="pla"&&(l="O",d="HO",c="",i="Ghost",p="CH3",m="CH₃");for(let e=0;e<3;e+=1){const u=(e-1)*4,s=e%2===0?1.5:-1.5;a.atoms.push({id:`L${e}`,element:l,pos:[u-.63,s+.5,0],label:e===0?d:""}),a.atoms.push({id:`Ca${e}`,element:"C",pos:[u,s,0]}),a.atoms.push({id:`Cc${e}`,element:"C",pos:[u+.63,s+.5,0]}),a.atoms.push({id:`O${e}`,element:"O",pos:[u+.63,s+1.4,0],label:e===0?"O":""}),a.atoms.push({id:`OH${e}`,element:"O",pos:[u+1.4,s-.1,0],label:e===0?"OH":""}),i!=="Ghost"&&a.atoms.push({id:`LH${e}`,element:i,pos:[u-1.2,s+1,0],label:e===0?c:""}),(p!=="H"||e===0)&&a.atoms.push({id:`Side${e}`,element:p,pos:[u,s-.8,.5],label:e===0?m:""}),a.bonds.push({id:`L-Ca${e}`,p1:`L${e}`,p2:`Ca${e}`}),a.bonds.push({id:`Ca-Cc${e}`,p1:`Ca${e}`,p2:`Cc${e}`}),a.bonds.push({id:`Cc-O${e}_1`,p1:`Cc${e}`,p2:`O${e}`,offset:[.12,0,0]}),a.bonds.push({id:`Cc-O${e}_2`,p1:`Cc${e}`,p2:`O${e}`,offset:[-.12,0,0]}),a.bonds.push({id:`Cc-OH${e}`,p1:`Cc${e}`,p2:`OH${e}`}),i!=="Ghost"&&a.bonds.push({id:`L-LH${e}`,p1:`L${e}`,p2:`LH${e}`}),(p!=="H"||e===0)&&a.bonds.push({id:`Ca-Side${e}`,p1:`Ca${e}`,p2:`Side${e}`});const x=(e-1)*2.2;t.atoms.push({id:`L${e}`,element:l,pos:[x-.63,.5,0]}),t.atoms.push({id:`Ca${e}`,element:"C",pos:[x,0,0]}),t.atoms.push({id:`Cc${e}`,element:"C",pos:[x+.63,.5,0]}),t.atoms.push({id:`O${e}`,element:"O",pos:[x+.63,1.4,0]}),t.atoms.push({id:`OH${e}`,element:"O",pos:[x+1.4,-.1,0]}),i!=="Ghost"&&t.atoms.push({id:`LH${e}`,element:i,pos:[x-1.2,1,0]}),(p!=="H"||e===0)&&t.atoms.push({id:`Side${e}`,element:p,pos:[x,-.8,.5]}),t.bonds.push({id:`L-Ca${e}`,p1:`L${e}`,p2:`Ca${e}`}),t.bonds.push({id:`Ca-Cc${e}`,p1:`Ca${e}`,p2:`Cc${e}`}),t.bonds.push({id:`Cc-O${e}_1`,p1:`Cc${e}`,p2:`O${e}`,offset:[.12,0,0]}),t.bonds.push({id:`Cc-O${e}_2`,p1:`Cc${e}`,p2:`O${e}`,offset:[-.12,0,0]}),t.bonds.push({id:`Cc-OH${e}`,p1:`Cc${e}`,p2:`OH${e}`,opacity:e<2?.2:1}),i!=="Ghost"&&t.bonds.push({id:`L-LH${e}`,p1:`L${e}`,p2:`LH${e}`,opacity:e>0?.2:1}),(p!=="H"||e===0)&&t.bonds.push({id:`Ca-Side${e}`,p1:`Ca${e}`,p2:`Side${e}`});const h=(e-1)*2.2,b=e%2===0?-.4:.4,y=e%2===0?.3:-.3;n.atoms.push({id:`L${e}`,element:l,pos:[h-.7,y,0]}),n.atoms.push({id:`Ca${e}`,element:"C",pos:[h,b,0]}),n.atoms.push({id:`Cc${e}`,element:"C",pos:[h+.7,y,0]}),n.atoms.push({id:`O${e}`,element:"O",pos:[h+.7,y+(e%2===0?.9:-.9),0]}),n.atoms.push({id:`OH${e}`,element:"O",pos:[h+.5,2.5,0],label:e<2?"H2O":"OH"}),i!=="Ghost"&&n.atoms.push({id:`LH${e}`,element:i,pos:[h-.5,2.5,0]}),(p!=="H"||e===0)&&n.atoms.push({id:`Side${e}`,element:p,pos:[h,b+(e%2===0?-.8:.8),.6]}),n.bonds.push({id:`L-Ca${e}`,p1:`L${e}`,p2:`Ca${e}`}),n.bonds.push({id:`Ca-Cc${e}`,p1:`Ca${e}`,p2:`Cc${e}`}),n.bonds.push({id:`Cc-O${e}_1`,p1:`Cc${e}`,p2:`O${e}`,offset:[.12,0,0]}),n.bonds.push({id:`Cc-O${e}_2`,p1:`Cc${e}`,p2:`O${e}`,offset:[-.12,0,0]}),e===2&&n.bonds.push({id:`Cc-OH${e}`,p1:`Cc${e}`,p2:`OH${e}`}),i!=="Ghost"&&e===0&&n.bonds.push({id:`L-LH${e}`,p1:`L${e}`,p2:`LH${e}`}),(p!=="H"||e===0)&&n.bonds.push({id:`Ca-Side${e}`,p1:`Ca${e}`,p2:`Side${e}`}),e<2&&n.bonds.push({id:`PolymerLink-${e}`,p1:`Cc${e}`,p2:`L${e+1}`})}return[a,t,n]}const Y={pe:g("pe"),pvc:g("pvc"),pp:g("pp"),ptfe:g("ptfe"),ps:g("ps"),pan:g("pan"),pva:g("pva"),pmma:g("pmma"),pvdf:g("pvdf"),pib:g("pib"),peptide:N("peptide"),pla:N("pla")};function W({type:r,step:f}){const a=$.useMemo(()=>Y[r],[r]),t=a[f]||a[0],{atoms:n,bonds:l}=t,d=$.useMemo(()=>new Map(n.map(i=>[i.id,i])),[n]),c=$.useMemo(()=>l.map(i=>{const p=d.get(i.p1),m=d.get(i.p2);let e=p?p.pos:[0,0,0],u=m?m.pos:[0,0,0];return i.offset&&(e=[e[0]+i.offset[0],e[1]+i.offset[1],e[2]+i.offset[2]],u=[u[0]+i.offset[0],u[1]+i.offset[1],u[2]+i.offset[2]]),{...i,p1Pos:e,p2Pos:u}}),[d,l]);return o.jsxs(o.Fragment,{children:[o.jsx("ambientLight",{intensity:.6}),o.jsx("directionalLight",{position:[10,10,5],intensity:1.5,castShadow:!0}),o.jsx("pointLight",{position:[-10,-10,-5],intensity:.5,color:"#00d2ff"}),o.jsx(_,{files:T}),o.jsxs("group",{position:[0,0,0],rotation:[.5,0,0],children:[n.map(i=>o.jsx(q,{targetPos:i.pos,element:i.element,label:i.label},i.id)),c.map(i=>o.jsx(I,{p1:i.p1Pos,p2:i.p2Pos,opacity:i.opacity},i.id))]}),o.jsx(D,{makeDefault:!0,enableDamping:!0,dampingFactor:.05,autoRotate:f===2,autoRotateSpeed:.5}),o.jsx(G,{position:[0,-2.5,0],opacity:.5,scale:30,blur:2.5,far:10})]})}function ne({isActive:r=!0}){const[f,a]=$.useState("pe"),[t,n]=$.useState(0),[l,d]=S(),c=v[f],i=2;return o.jsxs("div",{className:"polymer-workspace",children:[o.jsx("div",{className:"polymer-grid"}),o.jsxs("header",{className:"polymer-header",children:[o.jsxs("div",{children:[o.jsxs("div",{className:"polymer-title-row",children:[o.jsx("div",{className:"polymer-icon",children:o.jsx(R,{size:24,color:"#7df2c7"})}),o.jsxs("h1",{className:"polymer-main-title",children:["高分子与聚合链沙盒",o.jsx("span",{className:"polymer-version-badge",children:"3D全息版"})]})]}),o.jsx("div",{className:"polymer-subtitle",children:"POLYMERS & MACROMOLECULES"})]}),o.jsx("nav",{className:"polymer-tabs","aria-label":"高分子反应类型",children:Object.entries(v).map(([p,m])=>o.jsx("button",{type:"button",className:f===p?"active":"",onClick:()=>{a(p),n(0)},children:m.label},p))})]}),o.jsxs("main",{className:"polymer-stage",children:[o.jsx("div",{className:"polymer-canvas",children:o.jsx(z,{camera:{position:[0,2,10],fov:45},background:null,frameloop:r?"always":"never",children:o.jsx(k.Suspense,{fallback:null,children:o.jsx(W,{type:f,step:t})})})}),l?o.jsx("button",{type:"button",className:"polymer-hud-toggle","aria-label":"展开反应解析",title:"展开反应解析",onClick:()=>d(!1),children:o.jsx(F,{size:21})}):o.jsxs("section",{className:"polymer-info",children:[o.jsxs("div",{className:"polymer-info-header",children:[o.jsx("h3",{children:c.titles[t]}),o.jsxs("div",{className:"polymer-info-actions",children:[o.jsx("span",{className:"polymer-info-badge",children:"微观反应解析"}),o.jsx("button",{type:"button",className:"polymer-info-collapse","aria-label":"收起反应解析",title:"收起反应解析",onClick:()=>d(!0),children:o.jsx(M,{size:18})})]})]}),(()=>{const p=U(f,t);return o.jsxs("div",{className:"polymer-info-details",children:[o.jsxs("div",{className:"detail-row",children:[o.jsx("span",{className:"detail-label",children:"反应条件"}),o.jsx("span",{className:"detail-value highlight",children:p.condition})]}),o.jsxs("div",{className:"detail-row",children:[o.jsx("span",{className:"detail-label",children:"化学概型"}),o.jsx("span",{className:"detail-value mono",children:p.reaction})]}),o.jsx("div",{className:"detail-content",children:o.jsx("p",{children:p.mechanism})})]})})(),o.jsxs("div",{className:"polymer-info-desc",children:[o.jsxs("div",{className:"desc-title",children:["材料宏观特性 - ",c.label]}),o.jsx("p",{children:c.desc})]})]}),o.jsxs("div",{className:"polymer-controls",children:[o.jsxs("button",{type:"button",className:"ghost",onClick:()=>n(0),disabled:t===0,children:[o.jsx(E,{size:18}),o.jsx("span",{children:"打断分子链"})]}),o.jsxs("button",{type:"button",className:"primary",onClick:()=>n(p=>Math.min(p+1,i)),disabled:t===i,children:[o.jsx(A,{size:18}),o.jsx("span",{children:c.actions[t]})]})]})]}),o.jsx("style",{children:`
                .polymer-workspace {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    background: #05070a;
                    color: #fff;
                    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                }

                .polymer-grid {
                    position: absolute;
                    inset: 0;
                    z-index: 0;
                    pointer-events: none;
                    background-image:
                        linear-gradient(rgba(125, 242, 199, 0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(125, 242, 199, 0.03) 1px, transparent 1px);
                    background-size: 40px 40px;
                }

                .polymer-header {
                    position: relative;
                    z-index: 10;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 24px;
                    padding: 32px 40px;
                    border-bottom: 1px solid rgba(125, 242, 199, 0.1);
                }

                .polymer-title-row {
                    display: flex;
                    align-items: flex-start;
                    gap: 14px;
                }

                .polymer-icon {
                    display: grid;
                    place-items: center;
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    background: rgba(125, 242, 199, 0.1);
                    border: 1px solid rgba(125, 242, 199, 0.2);
                    margin-top: 2px;
                }

                .polymer-main-title {
                    margin: 0;
                    color: #7df2c7;
                    font-size: 22px;
                    font-weight: 800;
                    letter-spacing: 1px;
                    white-space: nowrap;
                    text-shadow: 0 0 15px rgba(125, 242, 199, 0.5);
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 6px;
                }

                .polymer-version-badge {
                    font-size: 11px;
                    padding: 3px 8px;
                    border-radius: 4px;
                    background: rgba(125, 242, 199, 0.15);
                    border: 1px solid rgba(125, 242, 199, 0.3);
                    color: #7df2c7;
                    font-weight: 700;
                    letter-spacing: 2px;
                    text-shadow: none;
                    line-height: 1;
                }

                .polymer-subtitle {
                    margin-top: 6px;
                    color: rgba(255, 255, 255, 0.4);
                    font-size: 12px;
                    font-weight: 700;
                    letter-spacing: 4px;
                }

                .polymer-tabs {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    padding: 6px;
                    border-radius: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    background: rgba(0, 0, 0, 0.4);
                }

                .polymer-tabs button {
                    min-width: 118px;
                    height: 46px;
                    padding: 0 16px;
                    border: 1px solid transparent;
                    border-radius: 12px;
                    background: transparent;
                    color: rgba(255, 255, 255, 0.4);
                    font-size: 15px;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .polymer-tabs button.active {
                    color: #7df2c7;
                    border-color: #7df2c7;
                    background: rgba(125, 242, 199, 0.15);
                    text-shadow: 0 0 10px rgba(125, 242, 199, 0.4);
                }

                .polymer-stage {
                    position: relative;
                    z-index: 1;
                    flex: 1;
                    min-height: 0;
                    background: radial-gradient(circle at center, rgba(125, 242, 199, 0.05) 0%, transparent 70%);
                }

                .polymer-canvas {
                    position: absolute;
                    inset: 0;
                    overflow: hidden;
                }

                .polymer-atom-label {
                    color: #fff;
                    font-size: 15px;
                    font-weight: 900;
                    text-shadow: 0 0 4px #000, 0 0 8px #000, 0 0 12px rgba(0, 0, 0, 0.8);
                    white-space: nowrap;
                    user-select: none;
                    letter-spacing: 0;
                }

                .polymer-info {
                    position: absolute;
                    bottom: 40px;
                    left: 40px;
                    max-width: calc(100% - 450px);
                    padding: 24px;
                    border-radius: 24px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(10px);
                    pointer-events: none;
                }

                .polymer-info-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 20px;
                    border-bottom: 1px solid rgba(125, 242, 199, 0.15);
                    padding-bottom: 16px;
                }

                .polymer-info-actions {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex: 0 0 auto;
                }

                .polymer-info h3 {
                    margin: 0;
                    color: #fff;
                    font-size: 20px;
                    line-height: 1.3;
                    font-weight: 900;
                    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
                }

                .polymer-info-badge {
                    font-size: 12px;
                    padding: 4px 10px;
                    border-radius: 6px;
                    background: rgba(125, 242, 199, 0.1);
                    color: #7df2c7;
                    border: 1px solid rgba(125, 242, 199, 0.2);
                    white-space: nowrap;
                }

                .polymer-info-collapse,
                .polymer-hud-toggle {
                    display: grid;
                    place-items: center;
                    width: 40px;
                    height: 40px;
                    border: 1px solid rgba(125, 242, 199, 0.36);
                    border-radius: 12px;
                    color: #7df2c7;
                    background: rgba(125, 242, 199, 0.1);
                    cursor: pointer;
                }

                .polymer-info-collapse {
                    pointer-events: auto;
                }

                .polymer-hud-toggle {
                    position: absolute;
                    left: 40px;
                    bottom: 40px;
                    z-index: 2;
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    background: rgba(5, 7, 10, 0.82);
                    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.36);
                    backdrop-filter: blur(10px);
                }

                .polymer-info-details {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 20px;
                }

                .detail-row {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    background: rgba(255, 255, 255, 0.03);
                    padding: 10px 16px;
                    border-radius: 8px;
                }

                .detail-label {
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 13px;
                    font-weight: 700;
                    width: 60px;
                    flex-shrink: 0;
                }

                .detail-value {
                    color: #fff;
                    font-size: 14px;
                    font-weight: 600;
                }

                .detail-value.highlight {
                    color: #ffb86c;
                }

                .detail-value.mono {
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                    color: #8be9fd;
                    letter-spacing: 0.5px;
                }

                .detail-content {
                    background: rgba(125, 242, 199, 0.04);
                    border-left: 3px solid #7df2c7;
                    padding: 14px 18px;
                    border-radius: 4px 8px 8px 4px;
                }

                .detail-content p {
                    margin: 0;
                    color: rgba(255, 255, 255, 0.85);
                    font-size: 14px;
                    line-height: 1.6;
                }

                .polymer-info-desc {
                    padding-top: 16px;
                    border-top: 1px dashed rgba(255, 255, 255, 0.1);
                }

                .desc-title {
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.4);
                    margin-bottom: 8px;
                    font-weight: 700;
                }

                .polymer-info-desc p {
                    margin: 0;
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 13px;
                    line-height: 1.5;
                }

                .polymer-info p {
                    margin: 0;
                    color: #aef7dc;
                    font-size: 14px;
                    line-height: 1.6;
                    opacity: 0.86;
                    font-weight: 650;
                }

                .polymer-controls {
                    position: absolute;
                    right: 40px;
                    bottom: 40px;
                    display: flex;
                    gap: 16px;
                    padding: 16px;
                    border-radius: 24px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(20px);
                }

                .polymer-controls button {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    height: 54px;
                    min-width: 126px;
                    padding: 0 22px;
                    border: none;
                    border-radius: 12px;
                    font-size: 15px;
                    font-weight: 900;
                    cursor: pointer;
                    white-space: nowrap;
                }

                .polymer-controls .ghost {
                    color: #fff;
                    background: rgba(255, 255, 255, 0.05);
                }

                .polymer-controls .primary {
                    color: #000;
                    background: #34c759;
                    box-shadow: 0 0 20px rgba(52, 199, 89, 0.4);
                }

                .polymer-controls button:disabled {
                    color: rgba(255, 255, 255, 0.22);
                    background: rgba(255, 255, 255, 0.04);
                    box-shadow: none;
                    cursor: not-allowed;
                }

                @media (max-width: 920px) {
                    .polymer-header {
                        align-items: flex-start;
                        flex-direction: column;
                        padding: 20px 24px;
                    }

                    .polymer-info {
                        left: 24px;
                        max-width: calc(100% - 390px);
                    }

                    .polymer-controls {
                        right: 24px;
                    }

                    .polymer-hud-toggle {
                        left: 24px;
                        bottom: 24px;
                    }
                }

                @media (max-width: 720px) {
                    .polymer-header {
                        padding: 14px;
                    }

                    .polymer-title-row h1 {
                        font-size: 21px;
                    }

                    .polymer-tabs button {
                        min-width: 96px;
                        height: 38px;
                        padding: 0 14px;
                        font-size: 13px;
                    }

                    .polymer-info {
                        left: 14px;
                        right: 14px;
                        bottom: 104px;
                        max-width: none;
                        padding: 16px;
                    }

                    .polymer-info-header {
                        gap: 10px;
                    }

                    .polymer-info-badge {
                        display: none;
                    }

                    .polymer-info h3 {
                        font-size: 18px;
                    }

                    .polymer-info p {
                        font-size: 12px;
                    }

                    .polymer-controls {
                        left: 14px;
                        right: 14px;
                        bottom: 14px;
                        padding: 12px;
                    }

                    .polymer-controls button {
                        flex: 1;
                        min-width: 0;
                        height: 46px;
                        padding: 0 10px;
                        font-size: 13px;
                    }

                    .polymer-hud-toggle {
                        left: 14px;
                        bottom: 94px;
                    }
                }
            `})]})}export{ne as default};
