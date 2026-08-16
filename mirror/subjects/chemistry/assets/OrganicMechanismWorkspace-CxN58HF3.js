import{r as d,j as e,R as S}from"./vendor-react-CAgePYhq.js?v=3ccd0bd03c60";import{g as c,z as g,aJ as M,aq as j}from"./vendor-three-core-BuStaZkr.js?v=ca9126df65f1";import{C as k}from"./feature-3d-shared-BE-c-NwZ.js?v=20229876bc60";import{a as z}from"./feature-element-model-mD655Rse.js?v=30b3cb954fc1";import{u as E}from"./useResponsiveHudCollapse-BLUAhQgs.js?v=dd4386d1de09";import{m as A,K as D,N as I,R,j as P,r as T}from"./vendor-icons-uWO-EytA.js?v=91c9fb55b13a";import{E as L,C as V,O as q,H as F,L as U}from"./vendor-drei-B0rt3vom.js?v=64f9d69af20b";import{a as C}from"./vendor-r3f-SOCY3ZtC.js?v=1f11eed4302c";import"./vendor-postprocessing-C4Wc0gGt.js?v=d1d0c6978d92";import"./vendor-three-stdlib-DC840Q71.js?v=adde6d431311";const _=z("vendor/drei-assets/hdri/potsdamer_platz_1k.hdr"),B={C:{color:"#15171d",emissive:"#05070a",radius:.34,text:"#ffffff"},H:{color:"#f3f4f6",emissive:"#d1d5db",radius:.22,text:"#1f2937"},O:{color:"#ef3030",emissive:"#5a0505",radius:.34,text:"#ffffff"},N:{color:"#4f7cff",emissive:"#10245f",radius:.32,text:"#ffffff"},Br:{color:"#a74b25",emissive:"#4b1608",radius:.42,text:"#ffffff"},Cl:{color:"#6fe36b",emissive:"#134a18",radius:.38,text:"#07120a"},B:{color:"#ff6b6b",emissive:"#551010",radius:.34,text:"#ffffff"}},v={SN1:{tab:"SN1",title:"SN1 单分子亲核取代",subtitle:"先离去成碳正离子，再被亲核试剂进攻",action:["断裂 C-Cl 键","亲核进攻","重置反应"],stages:[{title:"初始态：三级卤代烃",note:"C-Cl 键极化，离去基团能够带走成键电子；反应速率主要由底物离解决定。",atoms:[{id:"C",element:"C",pos:[0,0,0],label:"C"},{id:"R1",element:"C",pos:[-.9,.65,.45],label:"CH3",radius:.3},{id:"R2",element:"C",pos:[-.95,-.58,-.45],label:"CH3",radius:.3},{id:"R3",element:"C",pos:[.2,-.9,.72],label:"CH3",radius:.3},{id:"Cl",element:"Cl",pos:[1.55,.05,0],label:"Cl"},{id:"Nu",element:"O",pos:[-2.75,1,0],label:"H2O",radius:.32,faded:!0}],bonds:[["C","R1"],["C","R2"],["C","R3"],["C","Cl"]],arrows:[{start:[.55,.12,0],control:[.95,.55,.1],end:[1.35,.17,0],color:"#7df2c7"}]},{title:"中间体：平面碳正离子",note:"离去基团已经脱离，中心碳近似 sp2 平面结构，亲核试剂可以从平面两侧进攻。",atoms:[{id:"C",element:"C",pos:[0,0,0],label:"C+",charge:"+",color:"#ff6b6b"},{id:"R1",element:"C",pos:[-.9,.68,0],label:"CH3",radius:.3},{id:"R2",element:"C",pos:[-.9,-.68,0],label:"CH3",radius:.3},{id:"R3",element:"C",pos:[.72,-.02,0],label:"CH3",radius:.3},{id:"Cl",element:"Cl",pos:[2.5,.3,0],label:"Cl-",charge:"-",faded:!0},{id:"Nu",element:"O",pos:[-2.15,1.05,.4],label:"H2O",radius:.32}],bonds:[["C","R1"],["C","R2"],["C","R3"],["C","Nu",{dashed:!0,opacity:.45,color:"#ff6b6b"}]],arrows:[{start:[-1.85,.88,.35],control:[-1.15,.4,.28],end:[-.34,.12,.1],color:"#ffd166"}]},{title:"产物：取代完成",note:"亲核试剂与中心碳成键。由于碳正离子为平面结构，若生成手性中心，常出现消旋倾向。",atoms:[{id:"C",element:"C",pos:[0,0,0],label:"C"},{id:"R1",element:"C",pos:[-.9,.65,.45],label:"CH3",radius:.3},{id:"R2",element:"C",pos:[-.95,-.58,-.45],label:"CH3",radius:.3},{id:"R3",element:"C",pos:[.2,-.9,.72],label:"CH3",radius:.3},{id:"Nu",element:"O",pos:[1.35,.42,0],label:"OH",radius:.32},{id:"Cl",element:"Cl",pos:[2.8,-.5,0],label:"Cl-",charge:"-",faded:!0}],bonds:[["C","R1"],["C","R2"],["C","R3"],["C","Nu",{color:"#ff6b6b"}]],arrows:[]}],energy:"sn1"},SN2:{tab:"SN2",title:"SN2 双分子亲核取代",subtitle:"背面进攻，同步成键断键，并发生瓦尔登翻转",action:["触发亲核进攻","完成构型翻转","重置反应"],stages:[{title:"初始态：SN2 反应物",note:"按住鼠标左键可拖拽旋转三维视角，滚轮缩放，以便观察背面进攻和反式共平面特征。",atoms:[{id:"O",element:"O",pos:[-3.3,-.15,0],label:"HO-",charge:"-"},{id:"OH",element:"H",pos:[-3.95,.35,0]},{id:"C",element:"C",pos:[.85,0,0],label:"C"},{id:"Br",element:"Br",pos:[2.22,0,0],label:"Br"},{id:"H1",element:"H",pos:[.48,.78,.67]},{id:"H2",element:"H",pos:[.46,-.78,.67]},{id:"H3",element:"H",pos:[.52,0,-.95]}],bonds:[["O","OH"],["C","Br"],["C","H1"],["C","H2"],["C","H3"]],arrows:[]},{title:"过渡态：背面进攻",note:"亲核试剂从 Br 的反方向接近中心碳，新键形成和 C-Br 键断裂同时发生。",atoms:[{id:"O",element:"O",pos:[-1.32,-.05,0],label:"HO-",charge:"-"},{id:"OH",element:"H",pos:[-2.02,.38,0]},{id:"C",element:"C",pos:[0,0,0],label:"C"},{id:"Br",element:"Br",pos:[1.75,.12,0],label:"Br"},{id:"H1",element:"H",pos:[-.06,.92,.5]},{id:"H2",element:"H",pos:[-.04,-.92,.5]},{id:"H3",element:"H",pos:[-.02,0,-1]}],bonds:[["O","OH"],["O","C",{dashed:!0,color:"#ff6b6b",opacity:.65}],["C","Br",{dashed:!0,color:"#ffb86b",opacity:.55}],["C","H1"],["C","H2"],["C","H3"]],arrows:[{start:[-1,.18,0],control:[-.55,.55,.1],end:[-.18,.16,0],color:"#ffd166"},{start:[.38,.1,0],control:[.9,.55,.1],end:[1.48,.22,0],color:"#7df2c7"}]},{title:"产物：构型翻转",note:"C-O 键形成，Br- 离去，中心碳周围三个氢的空间取向翻转，这是 SN2 的立体化学标志。",atoms:[{id:"O",element:"O",pos:[-1.3,0,0],label:"HO"},{id:"OH",element:"H",pos:[-2,.45,0]},{id:"C",element:"C",pos:[0,0,0],label:"C"},{id:"Br",element:"Br",pos:[2.95,.65,0],label:"Br-",charge:"-",faded:!0},{id:"H1",element:"H",pos:[.48,.78,-.67]},{id:"H2",element:"H",pos:[.46,-.78,-.67]},{id:"H3",element:"H",pos:[.52,0,.95]}],bonds:[["O","OH"],["O","C",{color:"#ff6b6b"}],["C","H1"],["C","H2"],["C","H3"]],arrows:[]}],energy:"sn2"},E2:{tab:"E2",title:"E2 双分子消去",subtitle:"强碱夺取 β-H，离去基团同步离去形成双键",action:["夺取 β-H","形成碳碳双键","重置反应"],stages:[{title:"初始态：反式共平面构象",note:"E2 要求 β-H 与离去基团处在合适构象中，常用“反式共平面”解释电子连续转移。",atoms:[{id:"B",element:"B",pos:[-2.9,-1.1,0],label:"B:"},{id:"C1",element:"C",pos:[-.5,0,0],label:"Cβ"},{id:"C2",element:"C",pos:[.85,0,0],label:"Cα"},{id:"H",element:"H",pos:[-1.05,-1,0],label:"H"},{id:"Br",element:"Br",pos:[2.15,.95,0],label:"Br"},{id:"R1",element:"C",pos:[-.95,.92,.55],label:"R",radius:.27},{id:"R2",element:"C",pos:[.35,-.92,-.45],label:"R",radius:.27}],bonds:[["C1","C2"],["C1","H"],["C2","Br"],["C1","R1"],["C2","R2"]],arrows:[]},{title:"同步电子转移",note:"碱夺取 β-H，C-H 键电子形成 π 键，C-Br 键电子转移给 Br，三个变化同步进行。",atoms:[{id:"B",element:"B",pos:[-1.75,-.9,0],label:"B:"},{id:"C1",element:"C",pos:[-.5,0,0],label:"Cβ"},{id:"C2",element:"C",pos:[.85,0,0],label:"Cα"},{id:"H",element:"H",pos:[-1.18,-.72,0],label:"H"},{id:"Br",element:"Br",pos:[2.35,1.25,0],label:"Br"},{id:"R1",element:"C",pos:[-.95,.92,.55],label:"R",radius:.27},{id:"R2",element:"C",pos:[.35,-.92,-.45],label:"R",radius:.27}],bonds:[["B","H",{dashed:!0,color:"#ff6b6b",opacity:.65}],["C1","C2",{double:!0,color:"#7df2c7",opacity:.72}],["C1","H",{dashed:!0,opacity:.45}],["C2","Br",{dashed:!0,color:"#ffb86b",opacity:.48}],["C1","R1"],["C2","R2"]],arrows:[{start:[-1.53,-.82,0],control:[-1.42,-1.24,0],end:[-1.12,-.96,0],color:"#ffd166"},{start:[-.92,-.72,0],control:[-.48,-.2,.1],end:[.25,-.06,0],color:"#7df2c7"},{start:[1.22,.24,0],control:[1.85,.55,.1],end:[2.22,1.02,0],color:"#ff6b6b"}]},{title:"产物：烯烃生成",note:"生成碳碳双键、共轭酸和卤离子。高中常结合扎伊采夫规则判断主要烯烃。",atoms:[{id:"B",element:"B",pos:[-2.35,-.95,0],label:"HB"},{id:"C1",element:"C",pos:[-.5,0,0],label:"C"},{id:"C2",element:"C",pos:[.85,0,0],label:"C"},{id:"Br",element:"Br",pos:[2.55,.8,0],label:"Br-",charge:"-",faded:!0},{id:"R1",element:"C",pos:[-.95,.92,.55],label:"R",radius:.27},{id:"R2",element:"C",pos:[.35,-.92,-.45],label:"R",radius:.27}],bonds:[["C1","C2",{double:!0,color:"#7df2c7"}],["C1","R1"],["C2","R2"]],arrows:[]}],energy:"e2"},electrophilic:{tab:"亲电加成",title:"烯烃亲电加成",subtitle:"π 键进攻亲电试剂，随后亲核体进攻碳正离子",action:["π 键进攻 H+","Br- 进攻","重置反应"],stages:[{title:"初始态：乙烯与 HBr",note:"双键中的 π 电子云较活泼，容易进攻亲电试剂 H+。",atoms:[{id:"C1",element:"C",pos:[-.62,0,0],label:"C"},{id:"C2",element:"C",pos:[.62,0,0],label:"C"},{id:"H1",element:"H",pos:[-1.18,.78,0]},{id:"H2",element:"H",pos:[-1.18,-.78,0]},{id:"H3",element:"H",pos:[1.18,.78,0]},{id:"H4",element:"H",pos:[1.18,-.78,0]},{id:"Hp",element:"H",pos:[-2.7,-.2,0],label:"H+"},{id:"Br",element:"Br",pos:[2.7,.2,0],label:"Br-"}],bonds:[["C1","C2",{double:!0,color:"#7df2c7"}],["C1","H1"],["C1","H2"],["C2","H3"],["C2","H4"]],arrows:[]},{title:"中间体：碳正离子形成",note:"π 键电子与 H+ 成键，另一端碳带正电，随后 Br- 进攻正碳。",atoms:[{id:"C1",element:"C",pos:[-.62,0,0],label:"C"},{id:"C2",element:"C",pos:[.62,0,0],label:"C+",charge:"+",color:"#ff6b6b"},{id:"H1",element:"H",pos:[-1.18,.78,0]},{id:"H2",element:"H",pos:[-1.18,-.78,0]},{id:"H3",element:"H",pos:[1.18,.78,0]},{id:"H4",element:"H",pos:[1.18,-.78,0]},{id:"Hp",element:"H",pos:[-1.62,-.1,0],label:"H"},{id:"Br",element:"Br",pos:[2.25,.18,0],label:"Br-"}],bonds:[["C1","C2"],["C1","Hp",{color:"#9ad0ff"}],["C1","H1"],["C1","H2"],["C2","H3"],["C2","H4"],["C2","Br",{dashed:!0,color:"#ffb86b",opacity:.52}]],arrows:[{start:[-.25,.18,0],control:[-1,.55,0],end:[-1.52,.05,0],color:"#ffd166"},{start:[2.02,.18,0],control:[1.65,.62,0],end:[.92,.18,0],color:"#ff6b6b"}]},{title:"产物：溴乙烷",note:"Br- 与碳正离子结合，双键变单键，完成亲电加成。",atoms:[{id:"C1",element:"C",pos:[-.62,0,0],label:"C"},{id:"C2",element:"C",pos:[.62,0,0],label:"C"},{id:"H1",element:"H",pos:[-1.18,.78,0]},{id:"H2",element:"H",pos:[-1.18,-.78,0]},{id:"H3",element:"H",pos:[1.18,.78,0]},{id:"H4",element:"H",pos:[1.18,-.78,0]},{id:"Hp",element:"H",pos:[-1.62,-.1,0],label:"H"},{id:"Br",element:"Br",pos:[1.68,.18,0],label:"Br"}],bonds:[["C1","C2"],["C1","Hp",{color:"#9ad0ff"}],["C2","Br",{color:"#ffb86b"}],["C1","H1"],["C1","H2"],["C2","H3"],["C2","H4"]],arrows:[]}],energy:"addition"},nucleophilic:{tab:"亲核加成",title:"羰基亲核加成",subtitle:"亲核体进攻羰基碳，π 电子转移到氧上",action:["亲核体进攻","质子化生成醇","重置反应"],stages:[{title:"初始态：醛基与亲核体",note:"羰基 C=O 极化，碳带部分正电，氧带部分负电，因此亲核体优先进攻羰基碳。",atoms:[{id:"C",element:"C",pos:[0,0,0],label:"Cδ+"},{id:"O",element:"O",pos:[0,1.25,0],label:"Oδ-"},{id:"R",element:"C",pos:[-1.15,-.55,0],label:"R",radius:.28},{id:"H",element:"H",pos:[1.12,-.55,0],label:"H"},{id:"Nu",element:"N",pos:[-2.85,.1,0],label:"CN-"}],bonds:[["C","O",{double:!0,color:"#ff6b6b"}],["C","R"],["C","H"]],arrows:[]},{title:"中间体：四面体醇盐",note:"亲核体与羰基碳成键，C=O 的 π 电子转移到氧上，形成烷氧负离子中间体。",atoms:[{id:"C",element:"C",pos:[0,0,0],label:"C"},{id:"O",element:"O",pos:[.35,1.18,.55],label:"O-",charge:"-"},{id:"R",element:"C",pos:[-1.15,-.55,0],label:"R",radius:.28},{id:"H",element:"H",pos:[1.12,-.55,0],label:"H"},{id:"Nu",element:"N",pos:[-1.22,.55,-.45],label:"CN"}],bonds:[["C","O",{color:"#ff6b6b"}],["C","R"],["C","H"],["C","Nu",{color:"#9ad0ff"}]],arrows:[{start:[-1.95,.15,0],control:[-1.12,.8,0],end:[-.22,.18,0],color:"#ffd166"},{start:[.1,.45,0],control:[.62,.95,.18],end:[.22,1.15,.42],color:"#7df2c7"}]},{title:"产物：羟基加成物",note:"烷氧负离子被质子化，得到含羟基的亲核加成产物。",atoms:[{id:"C",element:"C",pos:[0,0,0],label:"C"},{id:"O",element:"O",pos:[.35,1.18,.55],label:"OH"},{id:"HO",element:"H",pos:[.92,1.58,.52]},{id:"R",element:"C",pos:[-1.15,-.55,0],label:"R",radius:.28},{id:"H",element:"H",pos:[1.12,-.55,0],label:"H"},{id:"Nu",element:"N",pos:[-1.22,.55,-.45],label:"CN"}],bonds:[["C","O",{color:"#ff6b6b"}],["O","HO"],["C","R"],["C","H"],["C","Nu",{color:"#9ad0ff"}]],arrows:[]}],energy:"addition"}},W=["SN1","SN2","E2","electrophilic","nucleophilic"];function G(t){return{...B[t.element]||B.C,...t.color?{color:t.color,emissive:t.color}:null,...t.radius?{radius:t.radius}:null}}function $({atom:t}){const o=d.useRef(null),r=d.useRef(null),s=d.useRef(t.pos),i=G(t),n=d.useMemo(()=>new c(...t.pos),[t.pos]),l=t.faded?.42:1,m=t.label||t.element;return C((b,u)=>{if(!o.current)return;const a=4.2*u,x=t.faded?.86:1;o.current.position.lerp(n,a),o.current.scale.lerp(new c(x,x,x),a),r.current&&(r.current.opacity=g.lerp(r.current.opacity,l,a),r.current.emissiveIntensity=g.lerp(r.current.emissiveIntensity,t.faded?.08:.18,a))}),e.jsxs("group",{ref:o,position:s.current,children:[e.jsxs("mesh",{castShadow:!0,receiveShadow:!0,children:[e.jsx("sphereGeometry",{args:[i.radius,36,36]}),e.jsx("meshStandardMaterial",{ref:r,color:i.color,emissive:i.emissive,emissiveIntensity:t.faded?.08:.18,roughness:.36,metalness:.18,transparent:!0,opacity:l})]}),m?e.jsx(F,{position:[0,i.radius+.32,0],center:!0,style:{pointerEvents:"none"},children:e.jsx("div",{className:"atom-label",children:m})}):null]})}function y({start:t,end:o,options:r={}}){const s=d.useRef(null),i=d.useRef(null),n=d.useRef(null),l=r.color||"#d1d5db",m=r.opacity??.82,b=r.dashed?.035:.055;if(!n.current){const u=new c(...t),a=new c(...o),x=u.clone().lerp(a,.5),p=a.clone().sub(u),H=Math.max(.001,p.length()),h=new j().setFromUnitVectors(new c(0,1,0),p.length()>.01?p.normalize():new c(0,1,0));n.current={mid:x,length:H,quaternion:h}}return C((u,a)=>{if(!s.current)return;const x=new c(...t),p=new c(...o),H=x.clone().lerp(p,.5),h=p.clone().sub(x),w=Math.max(.001,h.length()),f=4.2*a;if(s.current.position.lerp(H,f),s.current.scale.y=g.lerp(s.current.scale.y,w,f),w>.01){const O=new j().setFromUnitVectors(new c(0,1,0),h.normalize());s.current.quaternion.slerp(O,f)}i.current&&(i.current.opacity=g.lerp(i.current.opacity,m,f))}),e.jsxs("mesh",{ref:s,position:n.current.mid,quaternion:n.current.quaternion,scale:[1,n.current.length,1],castShadow:!0,receiveShadow:!0,children:[e.jsx("cylinderGeometry",{args:[b,b,1,18]}),e.jsx("meshStandardMaterial",{ref:i,color:l,emissive:l,emissiveIntensity:r.dashed?.12:.05,roughness:.42,metalness:.2,transparent:!0,opacity:m})]})}function Q({atomsById:t,bond:o}){const[r,s,i={}]=o,n=t[r],l=t[s];if(!n||!l)return null;if(!i.double)return e.jsx(y,{start:n.pos,end:l.pos,options:i});const m=new c(...n.pos),b=new c(...l.pos),u=b.clone().sub(m).normalize(),a=new c(0,0,1).cross(u);return a.lengthSq()<.001&&a.set(0,1,0),a.normalize().multiplyScalar(.085),e.jsxs(e.Fragment,{children:[e.jsx(y,{start:m.clone().add(a).toArray(),end:b.clone().add(a).toArray(),options:i}),e.jsx(y,{start:m.clone().sub(a).toArray(),end:b.clone().sub(a).toArray(),options:i})]})}function Y({arrow:t}){const o=d.useMemo(()=>new M(new c(...t.start),new c(...t.control),new c(...t.end)),[t]),r=d.useMemo(()=>o.getPoints(40),[o]),s=d.useMemo(()=>o.getTangent(1).normalize(),[o]),i=d.useMemo(()=>new c(...t.end),[t]),n=d.useMemo(()=>i.clone().sub(s.clone().multiplyScalar(.08)),[i,s]),l=d.useMemo(()=>new j().setFromUnitVectors(new c(0,1,0),s),[s]);return e.jsxs("group",{children:[e.jsx(U,{points:r,color:t.color,lineWidth:3.5,transparent:!0,opacity:.95}),e.jsxs("mesh",{position:n,quaternion:l,children:[e.jsx("coneGeometry",{args:[.09,.26,24]}),e.jsx("meshStandardMaterial",{color:t.color,emissive:t.color,emissiveIntensity:.35})]}),e.jsx(J,{curve:o,color:t.color})]})}function J({curve:t,color:o}){const r=d.useRef(null);return C(({clock:s})=>{if(!r.current)return;const i=s.elapsedTime*.55%1;r.current.position.copy(t.getPoint(i))}),e.jsxs("mesh",{ref:r,children:[e.jsx("sphereGeometry",{args:[.055,18,18]}),e.jsx("meshStandardMaterial",{color:o,emissive:o,emissiveIntensity:.9})]})}function K({mechanismId:t,stage:o}){const r=d.useMemo(()=>Object.fromEntries(o.atoms.map(n=>[n.id,n])),[o]),s=d.useRef(null);C(({clock:n})=>{s.current&&(s.current.rotation.y=Math.sin(n.elapsedTime*.22)*.12,s.current.rotation.x=Math.sin(n.elapsedTime*.18)*.035,s.current.position.y=-.08+Math.sin(n.elapsedTime*.55)*.04)});const i=t==="SN2"?1.26:1.18;return e.jsxs("group",{ref:s,scale:i,position:[0,-.08,0],children:[o.bonds.map((n,l)=>e.jsx(Q,{atomsById:r,bond:n},`${n[0]}-${n[1]}-${l}`)),o.atoms.map(n=>e.jsx($,{atom:n},n.id)),o.arrows.map((n,l)=>e.jsx(Y,{arrow:n},`${n.color}-${l}`))]})}function Z({mechanismId:t,stage:o,step:r}){return e.jsxs(e.Fragment,{children:[e.jsx("ambientLight",{intensity:.6}),e.jsx("directionalLight",{position:[10,10,5],intensity:1.45,castShadow:!0}),e.jsx("pointLight",{position:[-10,-10,-5],intensity:.55,color:"#00d2ff"}),e.jsx("pointLight",{position:[5,3,4],intensity:1.25,color:"#7df2c7"}),e.jsx(L,{files:_}),e.jsx("group",{position:[0,0,0],children:e.jsx(K,{mechanismId:t,stage:o})}),e.jsx(V,{position:[0,-2.35,0],opacity:.48,scale:24,blur:2.4,far:9}),e.jsx(q,{makeDefault:!0,enablePan:!1,enableDamping:!0,dampingFactor:.05,minDistance:5.2,maxDistance:11.5,target:[0,-.05,0],autoRotate:r>=2,autoRotateSpeed:.45})]})}const N={sn2:{d:"M 24 140 C 75 134, 98 92, 123 48 C 146 8, 188 118, 246 136",dots:[[24,140],[123,48],[246,136]]},sn1:{d:"M 24 136 C 64 132, 74 72, 104 58 C 130 48, 145 118, 166 112 C 190 105, 200 70, 226 82 C 244 92, 254 122, 266 134",dots:[[24,136],[118,60],[266,134]]},e2:{d:"M 24 136 C 78 136, 99 80, 132 58 C 163 38, 189 100, 246 118",dots:[[24,136],[132,58],[246,118]]},addition:{d:"M 24 138 C 72 130, 88 75, 116 64 C 144 52, 151 120, 178 112 C 207 103, 216 70, 246 82 C 260 88, 270 110, 278 126",dots:[[24,138],[124,66],[278,126]]}};function X({type:t,step:o}){const r=N[t]||N.sn2,s=r.dots[Math.min(o,r.dots.length-1)];return e.jsxs("aside",{className:"energy-card","aria-label":"反应势能面",children:[e.jsxs("div",{className:"energy-title",children:[e.jsx(T,{size:17}),e.jsx("span",{children:"反应势能面 (PES)"})]}),e.jsxs("svg",{viewBox:"0 0 310 190",className:"energy-svg",children:[e.jsx("line",{x1:"36",y1:"156",x2:"288",y2:"156",stroke:"rgba(255,255,255,0.2)",strokeWidth:"1.4"}),e.jsx("line",{x1:"36",y1:"36",x2:"36",y2:"156",stroke:"rgba(255,255,255,0.2)",strokeWidth:"1.4"}),e.jsx("path",{d:r.d,fill:"none",stroke:"#4dd6b3",strokeWidth:"4",strokeLinecap:"round",opacity:"0.42"}),e.jsx("circle",{cx:s[0]+12,cy:s[1],r:"6.5",fill:"#12d6ff"}),e.jsx("text",{x:"160",y:"180",fill:"rgba(255,255,255,0.42)",fontSize:"11",textAnchor:"middle",children:"反应坐标 (Reaction Coordinate)"}),e.jsx("text",{x:"20",y:"96",fill:"rgba(255,255,255,0.42)",fontSize:"11",textAnchor:"middle",transform:"rotate(-90 20 96)",children:"势能变化"})]})]})}function ce({isActive:t=!0}){const[o,r]=d.useState("SN2"),[s,i]=d.useState(0),[n,l]=E(),m=v[o],b=m.stages[s],u=m.stages.length-1,a=p=>{r(p),i(0)},x=()=>{i(p=>p>=u?0:p+1)};return e.jsxs("div",{className:"organic-mechanism-3d",children:[e.jsx("div",{className:"mechanism-grid"}),e.jsxs("header",{className:"mechanism-header",children:[e.jsxs("div",{className:"mechanism-heading",children:[e.jsx("div",{className:"mechanism-cube",children:e.jsx(A,{size:24})}),e.jsxs("div",{children:[e.jsx("h1",{children:"微观反应机理剖析（3D全息版）"}),e.jsx("p",{children:"Reaction Mechanisms in 3D Space"})]})]}),e.jsx("nav",{className:"mechanism-tabs","aria-label":"反应机理类型",children:W.map(p=>e.jsx("button",{type:"button",className:o===p?"active":"",onClick:()=>a(p),children:v[p].tab},p))})]}),e.jsxs("main",{className:"mechanism-stage",children:[e.jsx(k,{camera:{position:[0,2,10],fov:45},background:null,frameloop:t?"always":"never",maxDpr:1.85,gl:{alpha:!0},children:e.jsx(S.Suspense,{fallback:null,children:e.jsx(Z,{mechanismId:o,stage:b,step:s})})}),e.jsx(X,{type:m.energy,step:s}),n?e.jsx("button",{type:"button",className:"mechanism-hud-toggle","aria-label":"展开步骤说明",title:"展开步骤说明",onClick:()=>l(!1),children:e.jsx(D,{size:21})}):e.jsxs("section",{className:"step-card",children:[e.jsxs("div",{className:"step-card-header",children:[e.jsx("h2",{children:b.title}),e.jsx("button",{type:"button",className:"step-card-collapse","aria-label":"收起步骤说明",title:"收起步骤说明",onClick:()=>l(!0),children:e.jsx(I,{size:18})})]}),e.jsxs("p",{children:[e.jsx("strong",{children:"【空间观察】"}),b.note]})]}),e.jsxs("div",{className:"mechanism-controls",children:[e.jsxs("button",{type:"button",className:"ghost",onClick:()=>i(0),disabled:s===0,children:[e.jsx(R,{size:18}),e.jsx("span",{children:"重置反应"})]}),e.jsxs("button",{type:"button",className:"primary",onClick:x,children:[s>=u?e.jsx(R,{size:19}):e.jsx(P,{size:19}),e.jsx("span",{children:m.action[s]})]})]})]}),e.jsx("style",{children:`
                .organic-mechanism-3d {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                    min-height: 0;
                    overflow: hidden;
                    color: #ffffff;
                    background: #05090a;
                    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                }

                .mechanism-grid {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    background:
                        radial-gradient(circle at 52% 50%, rgba(28, 148, 121, 0.16), transparent 34%),
                        linear-gradient(rgba(125, 242, 199, 0.045) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(125, 242, 199, 0.045) 1px, transparent 1px);
                    background-size: auto, 44px 44px, 44px 44px;
                }

                .mechanism-header {
                    position: relative;
                    z-index: 4;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 18px;
                    padding: 30px 48px 16px;
                    pointer-events: none;
                }

                .mechanism-heading {
                    display: flex;
                    gap: 16px;
                    align-items: center;
                    min-width: 0;
                }

                .mechanism-cube {
                    width: 56px;
                    height: 56px;
                    display: grid;
                    place-items: center;
                    flex: 0 0 auto;
                    border-radius: 16px;
                    color: #7df2c7;
                    background: rgba(125, 242, 199, 0.12);
                    border: 1px solid rgba(125, 242, 199, 0.25);
                    box-shadow: 0 0 26px rgba(125, 242, 199, 0.12);
                }

                .mechanism-heading h1 {
                    margin: 0;
                    color: #7df2c7;
                    font-size: clamp(22px, 2.3vw, 36px);
                    line-height: 1.12;
                    letter-spacing: 0;
                    text-shadow: 0 0 18px rgba(125, 242, 199, 0.35);
                }

                .mechanism-heading p {
                    margin: 12px 0 0;
                    color: rgba(255,255,255,0.58);
                    font-size: 16px;
                    font-weight: 800;
                    letter-spacing: 0;
                }

                .mechanism-tabs {
                    display: grid;
                    grid-template-columns: repeat(5, minmax(88px, 1fr));
                    min-width: min(620px, 52vw);
                    padding: 6px;
                    border-radius: 20px;
                    background: rgba(0, 0, 0, 0.48);
                    border: 1px solid rgba(255, 255, 255, 0.07);
                    pointer-events: auto;
                    box-shadow: 0 14px 40px rgba(0, 0, 0, 0.32);
                }

                .mechanism-tabs button {
                    height: 48px;
                    border: 1px solid transparent;
                    border-radius: 16px;
                    background: transparent;
                    color: rgba(255, 255, 255, 0.42);
                    font-size: 16px;
                    font-weight: 900;
                    cursor: pointer;
                }

                .mechanism-tabs button.active {
                    color: #7df2c7;
                    border-color: rgba(125, 242, 199, 0.55);
                    background: rgba(125, 242, 199, 0.12);
                    box-shadow: inset 0 0 24px rgba(125, 242, 199, 0.08);
                }

                .mechanism-stage {
                    position: relative;
                    z-index: 1;
                    flex: 1;
                    min-height: 0;
                }

                .atom-label {
                    min-width: max-content;
                    padding: 2px 5px;
                    color: #ffffff;
                    font-size: 15px;
                    font-weight: 900;
                    line-height: 1;
                    text-shadow: 0 1px 3px #000, 0 0 10px rgba(0,0,0,0.9);
                    white-space: nowrap;
                    user-select: none;
                }

                .energy-card {
                    position: absolute;
                    right: 42px;
                    top: 26%;
                    width: 390px;
                    max-width: calc(100vw - 92px);
                    padding: 22px 24px 16px;
                    border-radius: 22px;
                    border: 1px solid rgba(255, 255, 255, 0.07);
                    background: rgba(0, 0, 0, 0.48);
                    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.34);
                    pointer-events: none;
                }

                .energy-title {
                    display: flex;
                    align-items: center;
                    gap: 9px;
                    color: #ffffff;
                    font-size: 16px;
                    font-weight: 900;
                    margin-bottom: 10px;
                }

                .energy-title svg {
                    color: #7df2c7;
                }

                .energy-svg {
                    display: block;
                    width: 100%;
                    height: 205px;
                }

                .step-card {
                    position: absolute;
                    left: 48px;
                    right: 498px;
                    bottom: 52px;
                    min-height: 128px;
                    padding: 26px 30px;
                    border-radius: 24px;
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    background: rgba(0, 0, 0, 0.66);
                    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.38);
                    pointer-events: none;
                }

                .step-card-header {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 16px;
                    margin-bottom: 14px;
                }

                .step-card h2 {
                    margin: 0;
                    color: #ffffff;
                    font-size: clamp(22px, 2vw, 34px);
                    line-height: 1.12;
                    letter-spacing: 0;
                }

                .step-card p {
                    margin: 0;
                    color: #aef7dc;
                    font-size: 16px;
                    line-height: 1.75;
                    font-weight: 700;
                }

                .step-card strong {
                    color: #7df2c7;
                    margin-right: 8px;
                }

                .step-card-collapse,
                .mechanism-hud-toggle {
                    display: grid;
                    place-items: center;
                    width: 40px;
                    height: 40px;
                    flex: 0 0 auto;
                    border: 1px solid rgba(125, 242, 199, 0.36);
                    border-radius: 12px;
                    color: #7df2c7;
                    background: rgba(125, 242, 199, 0.1);
                    cursor: pointer;
                }

                .step-card-collapse {
                    pointer-events: auto;
                }

                .mechanism-hud-toggle {
                    position: absolute;
                    left: 48px;
                    bottom: 52px;
                    z-index: 2;
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    background: rgba(5, 9, 10, 0.82);
                    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.36);
                    backdrop-filter: blur(10px);
                }

                .mechanism-controls {
                    position: absolute;
                    right: 42px;
                    bottom: 52px;
                    display: flex;
                    gap: 14px;
                    padding: 16px;
                    border-radius: 24px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    background: rgba(0, 0, 0, 0.62);
                    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.35);
                }

                .mechanism-controls button {
                    height: 54px;
                    border: 0;
                    border-radius: 14px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    padding: 0 22px;
                    font-size: 16px;
                    font-weight: 900;
                    cursor: pointer;
                    white-space: nowrap;
                }

                .mechanism-controls .ghost {
                    color: rgba(255,255,255,0.64);
                    background: rgba(255,255,255,0.07);
                }

                .mechanism-controls .primary {
                    color: #04110d;
                    background: #34c759;
                    box-shadow: 0 12px 26px rgba(52, 199, 89, 0.18);
                }

                .mechanism-controls button:disabled {
                    opacity: 0.36;
                    cursor: not-allowed;
                }

                @media (max-width: 1180px) {
                    .mechanism-header {
                        padding: 22px 26px 12px;
                        flex-direction: column;
                    }

                    .mechanism-tabs {
                        min-width: 0;
                        width: 100%;
                        grid-template-columns: repeat(5, minmax(0, 1fr));
                    }

                    .energy-card {
                        right: 24px;
                        top: 24%;
                        width: 320px;
                    }

                    .step-card {
                        left: 24px;
                        right: 380px;
                        bottom: 34px;
                    }

                    .mechanism-controls {
                        right: 24px;
                        bottom: 34px;
                    }

                    .mechanism-hud-toggle {
                        left: 24px;
                        bottom: 34px;
                    }
                }

                @media (max-width: 820px) {
                    .mechanism-heading p,
                    .energy-card {
                        display: none;
                    }

                    .mechanism-header {
                        padding: 14px;
                        gap: 10px;
                    }

                    .mechanism-cube {
                        width: 44px;
                        height: 44px;
                        border-radius: 14px;
                    }

                    .mechanism-tabs {
                        grid-template-columns: repeat(3, minmax(0, 1fr));
                    }

                    .mechanism-tabs button {
                        height: 40px;
                        font-size: 13px;
                    }

                    .step-card {
                        left: 14px;
                        right: 14px;
                        bottom: 112px;
                        min-height: 0;
                        padding: 16px 18px;
                    }

                    .step-card-header {
                        gap: 12px;
                        margin-bottom: 10px;
                    }

                    .step-card-collapse {
                        width: 36px;
                        height: 36px;
                        border-radius: 10px;
                    }

                    .step-card p {
                        font-size: 13px;
                        line-height: 1.55;
                    }

                    .mechanism-controls {
                        left: 14px;
                        right: 14px;
                        bottom: 18px;
                        justify-content: space-between;
                    }

                    .mechanism-controls button {
                        flex: 1;
                        height: 48px;
                        padding: 0 10px;
                        font-size: 13px;
                    }

                    .mechanism-hud-toggle {
                        left: 14px;
                        bottom: 96px;
                    }
                }
            `})]})}export{ce as default};
