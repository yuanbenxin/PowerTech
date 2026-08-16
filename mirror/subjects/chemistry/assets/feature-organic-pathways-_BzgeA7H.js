import{R as y,j as e,r as S}from"./vendor-react-CAgePYhq.js?v=3ccd0bd03c60";import{m as C}from"./vendor-motion-CrDMTC9Y.js?v=0ba15ad0821e";import{r as he}from"./feature-element-model-mD655Rse.js?v=30b3cb954fc1";import"./vendor-postprocessing-C4Wc0gGt.js?v=d1d0c6978d92";import"./vendor-three-core-BuStaZkr.js?v=ca9126df65f1";import"./vendor-r3f-SOCY3ZtC.js?v=1f11eed4302c";import"./vendor-drei-B0rt3vom.js?v=64f9d69af20b";import"./vendor-three-stdlib-DC840Q71.js?v=adde6d431311";import"./feature-3d-shared-BE-c-NwZ.js?v=20229876bc60";const v={alkane:{label:"烷烃",formula:"R-CH3",family:"饱和烃",x:8,y:53,color:"#ff8f7c"},alkene:{label:"烯烃",formula:"C=C",family:"不饱和烃",x:24,y:38,color:"#f2d96b"},alkyne:{label:"炔烃",formula:"C≡C",family:"不饱和烃",x:8,y:36,color:"#f0b45c"},haloalkane:{label:"卤代烃",formula:"R-X",family:"取代烃",x:25,y:54,color:"#f6a35f"},alcohol:{label:"醇",formula:"R-OH",family:"含氧衍生物",x:43,y:46,color:"#63e6be"},ether:{label:"醚",formula:"R-O-R'",family:"含氧衍生物",x:43,y:29,color:"#91d6a6"},aldehyde:{label:"醛",formula:"R-CHO",family:"羰基化合物",x:61,y:38,color:"#6fd5ff"},ketone:{label:"酮",formula:"R-CO-R'",family:"羰基化合物",x:61,y:56,color:"#71aef5"},carboxylic:{label:"羧酸",formula:"R-COOH",family:"羧酸类",x:79,y:38,color:"#b28cff"},ester:{label:"酯",formula:"R-COO-R'",family:"酯类",x:79,y:56,color:"#f493c3"},polymer:{label:"聚合物",formula:"[-CH2-CH2-]n",family:"高分子",x:19,y:22,color:"#c8cdd2"},benzene:{label:"芳香烃",formula:"C6H6",family:"芳香族",x:10,y:73,color:"#ff8b8b"},halobenzene:{label:"卤代苯",formula:"C6H5X",family:"芳香族",x:27,y:68,color:"#ffb3a8"},phenol:{label:"苯酚",formula:"C6H5OH",family:"酚类",x:29,y:80,color:"#ffd0b8"},toluene:{label:"甲苯",formula:"C6H5CH3",family:"芳香族",x:45,y:73,color:"#ff9e9e"},benzoic_acid:{label:"苯甲酸",formula:"C6H5COOH",family:"芳香酸",x:48,y:80,color:"#e9aaa4"},nitrobenzene:{label:"硝基苯",formula:"C6H5NO2",family:"芳香族",x:63,y:68,color:"#ffcfbd"},aniline:{label:"苯胺",formula:"C6H5NH2",family:"芳香胺",x:65,y:80,color:"#ffe0cc"}},me={halogenate_alkane:{name:"烷烃卤代",condition:"X2 / 光照",note:"自由基取代"},eliminate_halide:{name:"卤代烃消去",condition:"NaOH 醇溶液 / 加热",note:"生成烯烃"},hydrolysis_halide:{name:"卤代烃水解",condition:"NaOH 水溶液 / 加热",note:"生成醇"},add_hx_alkene:{name:"烯烃加成 HX",condition:"HX",note:"加成到双键"},hydrate_alkene:{name:"烯烃水化",condition:"H2O / H+",note:"工业制醇常用"},eliminate_alcohol:{name:"醇消去",condition:"浓 H2SO4 / 170°C",note:"脱水成烯"},alcohol_to_halide:{name:"醇转卤代烃",condition:"HX 或 SOCl2",note:"羟基被卤素取代"},oxidize_alcohol_to_aldehyde:{name:"伯醇氧化为醛",condition:"Cu / O2 或 PCC",note:"控制氧化程度"},oxidize_alcohol_to_ketone:{name:"仲醇氧化为酮",condition:"Cu / O2 或 K2Cr2O7",note:"仲醇对应酮"},oxidize_alcohol_to_acid:{name:"伯醇强氧化",condition:"酸性 KMnO4",note:"可直接到羧酸"},hydrate_alkyne:{name:"炔烃水化",condition:"HgSO4 / H2SO4",note:"烯醇互变为羰基"},reduce_alkyne:{name:"炔烃部分加氢",condition:"H2 / Lindlar 催化剂",note:"得到烯烃"},oxidize_aldehyde_to_acid:{name:"醛氧化为羧酸",condition:"银氨溶液或新制 Cu(OH)2",note:"醛的鉴别与转化"},reduce_aldehyde_to_alcohol:{name:"醛还原为醇",condition:"H2 / Ni 或 NaBH4",note:"得到伯醇"},reduce_ketone_to_alcohol:{name:"酮还原为醇",condition:"H2 / Ni 或 NaBH4",note:"得到仲醇"},esterification:{name:"酯化反应",condition:"醇 + 羧酸 / 浓 H2SO4 / 加热",note:"可逆反应"},hydrolysis_ester_to_carboxylic:{name:"酯水解为酸",condition:"稀酸或碱性水解",note:"得到羧酸部分"},hydrolysis_ester_to_alcohol:{name:"酯水解为醇",condition:"水解后分离醇",note:"得到醇部分"},alcohol_to_ether:{name:"醇分子间脱水",condition:"浓 H2SO4 / 140°C",note:"生成醚"},reduce_alkene_to_alkane:{name:"烯烃加氢",condition:"H2 / Ni / 加热",note:"双键饱和"},reduce_alkyne_to_alkane:{name:"炔烃完全加氢",condition:"过量 H2 / Ni",note:"完全饱和"},polymerize_alkene:{name:"加聚反应",condition:"引发剂 / 加热加压",note:"形成高分子"},crack_alkane_to_alkene:{name:"烷烃裂化",condition:"高温 / 催化剂",note:"工业制烯烃"},nitrate_benzene:{name:"苯的硝化",condition:"浓 HNO3 / 浓 H2SO4 / 50-60°C",note:"亲电取代"},reduce_nitro_to_aniline:{name:"硝基还原",condition:"Fe / HCl 后碱化",note:"制苯胺"},alkylate_benzene:{name:"傅克烷基化",condition:"卤代烃 / AlCl3",note:"引入烷基"},oxidize_toluene_to_acid:{name:"侧链氧化",condition:"酸性 KMnO4",note:"苄位侧链到羧基"},halogenate_benzene:{name:"苯的卤代",condition:"X2 / FeX3",note:"芳环取代"},halobenzene_to_phenol:{name:"卤代苯水解",condition:"NaOH / 高温高压",note:"条件较剧烈"},phenol_esterification:{name:"酚酯化",condition:"酸酐或酰氯",note:"酚不直接与羧酸酯化"}},fe={oxidize_alcohol_to_acid:3.2,phenol_esterification:1.4},ue=[{label:"脂肪烃",x:7,y:17,width:28,height:47},{label:"含氧衍生物",x:38,y:18,width:48,height:48},{label:"芳香族",x:6,y:64,width:66,height:21}];function U(o){const t=me[o.id]||{};return{...o,name:t.name||o.name||`${I(o.from)} → ${I(o.to)}`,condition:t.condition||o.condition||"常见有机转化条件",note:t.note||o.limit||"注意反应条件与官能团兼容性"}}function I(o){var t;return((t=v[o])==null?void 0:t.label)||o}function be(o){var t;return((t=v[o])==null?void 0:t.formula)||""}function G(o,t){return`${o}->${t}`}function ie(o,t,r=5.7){const i=t.x-o.x,c=t.y-o.y,u=Math.hypot(i,c)||1,p=i/u,g=c/u;return{start:{x:o.x+p*r,y:o.y+g*r},end:{x:t.x-p*r,y:t.y-g*r},normal:{x:-g,y:p}}}function ye(o,t){const r=ie(o,t,6.2);return`M ${r.start.x} ${r.start.y} L ${r.end.x} ${r.end.y}`}function _e(o,t,r=1.2){const i=ie(o,t);return{x:(i.start.x+i.end.x)/2+i.normal.x*r,y:(i.start.y+i.end.y)/2+i.normal.y*r}}function ve(o,t,r,i){var g;if(!o||!t)return null;if(o===t)return{nodes:[o],steps:[]};const c=new Map;r.forEach(d=>{if(!v[d.from]||!v[d.to])return;const h=U(d),x=c.get(h.from)||[];x.push(h),c.set(h.from,x)});const u=new Map([[o,{cost:0,nodes:[o],steps:[]}]]),p=[{node:o,cost:0,nodes:[o],steps:[]}];for(;p.length>0;){p.sort((h,x)=>h.cost-x.cost);const d=p.shift();if(!(!d||d.cost>(((g=u.get(d.node))==null?void 0:g.cost)??1/0))){if(d.node===t)return{nodes:d.nodes,steps:d.steps};(c.get(d.node)||[]).forEach(h=>{const x=d.cost+(fe[h.id]||1),N=u.get(h.to);if(N&&N.cost<=x)return;const O={node:h.to,cost:x,nodes:[...d.nodes,h.to],steps:[...d.steps,h]};u.set(h.to,O),p.push(O)})}}return i?{nodes:i.nodes||[],steps:(i.steps||[]).map(U)}:null}function ke(o){const t=new Map;o.forEach(i=>{if(!v[i.from]||!v[i.to])return;const c=[i.from,i.to].sort().join("|");t.set(c,(t.get(c)||0)+1)});const r=new Set;return o.filter(i=>v[i.from]&&v[i.to]).map(U).filter(i=>{const c=G(i.from,i.to);return r.has(c)?!1:(r.add(c),!0)}).map(i=>{const c=[i.from,i.to].sort().join("|");return{...i,key:G(i.from,i.to),hasReverse:t.get(c)>1}})}function Se({routeFrom:o,routeTo:t,routeResult:r,onSetRouteFrom:i,onSetRouteTo:c,onSwapRouteDirection:u,functionalNodeKeys:p,transformRules:g}){var F,J,Q,Z,K;const d=y.useRef(null),[h,x]=y.useState(null),[N,O]=y.useState(null),[w,a]=y.useState("target"),[l,k]=y.useState(!1);y.useEffect(()=>{const n=d.current;if(!n)return;const f=()=>{k(n.getBoundingClientRect().width<860)};f();const H=new ResizeObserver(f);return H.observe(n),()=>H.disconnect()},[]);const m=y.useMemo(()=>(p||[]).filter(n=>v[n]),[p]),b=y.useMemo(()=>ke(g||[]),[g]),s=y.useMemo(()=>ve(o,t,g||[],r),[o,t,r,g]),T=y.useMemo(()=>new Set((s==null?void 0:s.nodes)||[]),[s]),_=y.useMemo(()=>new Set(((s==null?void 0:s.steps)||[]).map(n=>G(n.from,n.to))),[s]),z=y.useMemo(()=>{const n=new Map;if(!l)return m.forEach(j=>n.set(j,v[j])),n;const f=((s==null?void 0:s.nodes)||[]).filter(j=>v[j]),H=new Set(f),R=18,E=f.length>1?(82-R)/(f.length-1):0;f.forEach((j,D)=>{n.set(j,{...v[j],x:R+E*D,y:23})});const P=m.filter(j=>!H.has(j)),B=Math.min(4,Math.max(1,P.length)),ee=Math.ceil(P.length/B),oe=16,le=84,ne=43,ce=80;return P.forEach((j,D)=>{const de=D%B,pe=Math.floor(D/B),xe=B>1?(le-oe)/(B-1):0,ge=ee>1?(ce-ne)/(ee-1):0;n.set(j,{...v[j],x:oe+xe*de,y:ne+ge*pe})}),n},[s,l,m]),X=y.useCallback(n=>z.get(n)||v[n],[z]),M=N||h,W=M?v[M]:null,V=y.useMemo(()=>M?b.filter(n=>!_.has(n.key)&&(n.from===M||n.to===M)):[],[b,M,_]),re=y.useMemo(()=>V.slice(0,5).map(n=>`${n.from===M?"出":"入"}：${n.name}`).join(" / "),[M,V]),se=y.useCallback(n=>{if(O(f=>f===n?null:n),n===o){a("start");return}if(n===t){a("target");return}if(w==="start"){i(n),a("target");return}c(n),a("start")},[i,c,o,t,w]),q=(F=s==null?void 0:s.nodes)!=null&&F.length?s.nodes.map(I).join(" → "):"暂无可达路线";return e.jsxs(C.div,{className:"organic-conversion-shell",initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},children:[e.jsx("style",{children:`
                .organic-conversion-shell {
                    position: absolute;
                    inset: 0;
                    z-index: 10;
                    pointer-events: none;
                    font-family: "Microsoft YaHei", "PingFang SC", system-ui, sans-serif;
                }
                .organic-conversion-frame {
                    position: absolute;
                    inset: 22px;
                    overflow: hidden;
                    container-type: inline-size;
                    pointer-events: auto;
                    border-radius: 22px;
                    border: 1px solid rgba(117, 238, 196, 0.32);
                    background:
                        radial-gradient(circle at 52% 46%, rgba(41, 95, 84, 0.24), transparent 33%),
                        linear-gradient(145deg, rgba(3, 14, 13, 0.98), rgba(2, 5, 8, 0.98));
                    box-shadow:
                        inset 0 0 0 1px rgba(255, 255, 255, 0.035),
                        inset 0 0 90px rgba(83, 231, 183, 0.08),
                        0 20px 60px rgba(0, 0, 0, 0.45);
                }
                .organic-conversion-frame::before {
                    content: "";
                    position: absolute;
                    inset: 0;
                    background-image:
                        linear-gradient(rgba(119, 236, 198, 0.055) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(119, 236, 198, 0.055) 1px, transparent 1px);
                    background-size: 40px 40px;
                    mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.65), black 18%, black 88%, rgba(0, 0, 0, 0.72));
                    pointer-events: none;
                }
                .organic-conversion-frame::after {
                    content: "";
                    position: absolute;
                    inset: 18px;
                    border: 1px solid rgba(117, 238, 196, 0.16);
                    border-radius: 18px;
                    pointer-events: none;
                }
                .organic-conversion-header {
                    position: absolute;
                    left: clamp(22px, 3vw, 44px);
                    top: clamp(20px, 3vw, 36px);
                    z-index: 12;
                    max-width: min(560px, 54vw);
                }
                .organic-conversion-title {
                    margin: 0;
                    font-size: clamp(24px, 3vw, 42px);
                    line-height: 1;
                    font-weight: 900;
                    letter-spacing: 0;
                    color: #78f0c8;
                    text-shadow: 0 0 28px rgba(120, 240, 200, 0.38);
                }
                .organic-conversion-subtitle {
                    margin-top: 9px;
                    color: rgba(200, 255, 236, 0.72);
                    font-size: clamp(10px, 1.1vw, 13px);
                    font-weight: 800;
                    letter-spacing: 2.5px;
                }
                .organic-conversion-tools {
                    position: absolute;
                    top: clamp(18px, 2.4vw, 32px);
                    right: clamp(20px, 3vw, 42px);
                    z-index: 18;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.09);
                    border-radius: 16px;
                    background: rgba(2, 10, 11, 0.72);
                    backdrop-filter: blur(18px);
                    box-shadow: 0 16px 42px rgba(0, 0, 0, 0.34);
                }
                .organic-conversion-route-button,
                .organic-conversion-swap {
                    min-height: 34px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    background: rgba(255, 255, 255, 0.06);
                    color: rgba(255, 255, 255, 0.76);
                    font-size: 12px;
                    font-weight: 800;
                    letter-spacing: 0;
                    cursor: pointer;
                    touch-action: manipulation;
                }
                .organic-conversion-route-button {
                    display: flex;
                    align-items: center;
                    gap: 7px;
                    padding: 0 11px;
                }
                .organic-conversion-route-button[data-active="true"] {
                    color: #07100e;
                    background: #78f0c8;
                    border-color: rgba(120, 240, 200, 0.9);
                    box-shadow: 0 0 20px rgba(120, 240, 200, 0.24);
                }
                .organic-conversion-route-button b {
                    color: inherit;
                    font-size: 13px;
                }
                .organic-conversion-swap {
                    width: 36px;
                    padding: 0;
                    display: grid;
                    place-items: center;
                }
                .organic-conversion-map {
                    position: absolute;
                    inset: 0;
                    z-index: 4;
                }
                .organic-conversion-svg {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    overflow: visible;
                }
                .organic-conversion-zone {
                    fill: rgba(255, 255, 255, 0.025);
                    stroke: rgba(120, 240, 200, 0.12);
                    stroke-width: 0.25;
                }
                .organic-conversion-zone-label {
                    fill: rgba(208, 255, 238, 0.2);
                    font-size: 2.3px;
                    font-weight: 800;
                    letter-spacing: 0;
                }
                .organic-conversion-node {
                    position: absolute;
                    width: clamp(48px, 5.6vw, 72px);
                    height: clamp(48px, 5.6vw, 72px);
                    transform: translate(-50%, -50%);
                    border-radius: 50%;
                    border: 2px solid rgba(255, 255, 255, 0.18);
                    background:
                        radial-gradient(circle at 32% 24%, rgba(255, 255, 255, 0.19), transparent 32%),
                        linear-gradient(145deg, rgba(11, 20, 22, 0.98), rgba(4, 8, 11, 0.98));
                    color: var(--node-color);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 2px;
                    cursor: pointer;
                    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.45);
                    z-index: 8;
                    outline: none;
                    touch-action: manipulation;
                }
                .organic-conversion-node::before {
                    content: "";
                    position: absolute;
                    inset: 8px;
                    border-radius: 50%;
                    border: 1px solid color-mix(in srgb, var(--node-color), transparent 64%);
                    opacity: 0.86;
                    pointer-events: none;
                }
                .organic-conversion-node[data-route="true"] {
                    border-color: var(--node-color);
                    background:
                        radial-gradient(circle at 35% 24%, rgba(255, 255, 255, 0.24), transparent 31%),
                        linear-gradient(145deg, color-mix(in srgb, var(--node-color), transparent 62%), rgba(5, 10, 12, 0.98));
                    box-shadow:
                        0 0 30px color-mix(in srgb, var(--node-color), transparent 55%),
                        0 14px 26px rgba(0, 0, 0, 0.46);
                }
                .organic-conversion-node[data-selected="true"] {
                    z-index: 15;
                    box-shadow:
                        0 0 0 6px color-mix(in srgb, var(--node-color), transparent 82%),
                        0 0 44px color-mix(in srgb, var(--node-color), transparent 42%),
                        0 18px 36px rgba(0, 0, 0, 0.5);
                }
                .organic-conversion-node-name {
                    position: relative;
                    color: #fff;
                    font-size: clamp(12px, 1.18vw, 16px);
                    font-weight: 900;
                    line-height: 1.05;
                    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.86);
                }
                .organic-conversion-node-formula {
                    position: relative;
                    max-width: 88%;
                    overflow: hidden;
                    color: rgba(255, 255, 255, 0.58);
                    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
                    font-size: clamp(8px, 0.75vw, 10px);
                    font-weight: 800;
                    line-height: 1;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                }
                .organic-conversion-tag {
                    position: absolute;
                    top: -24px;
                    left: 50%;
                    transform: translateX(-50%);
                    min-width: 58px;
                    padding: 4px 7px;
                    border-radius: 8px;
                    color: #06110f;
                    font-size: 10px;
                    font-weight: 900;
                    line-height: 1;
                    text-align: center;
                    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.34);
                }
                .organic-conversion-tag[data-kind="start"] {
                    background: #48e58f;
                }
                .organic-conversion-tag[data-kind="target"] {
                    background: #ffd057;
                }
                .organic-conversion-info {
                    position: absolute;
                    left: clamp(22px, 3vw, 44px);
                    bottom: 14px;
                    right: clamp(22px, 3vw, 44px);
                    z-index: 18;
                    display: grid;
                    grid-template-columns: minmax(0, 1.3fr) minmax(280px, 0.7fr);
                    gap: 12px;
                    align-items: end;
                    pointer-events: none;
                }
                .organic-conversion-route-strip,
                .organic-conversion-focus-card {
                    min-height: 58px;
                    border: 1px solid rgba(255, 255, 255, 0.09);
                    border-radius: 14px;
                    background: rgba(2, 10, 11, 0.64);
                    backdrop-filter: blur(18px);
                    box-shadow: 0 18px 42px rgba(0, 0, 0, 0.36);
                    overflow: hidden;
                }
                .organic-conversion-route-strip {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 14px;
                }
                .organic-conversion-route-main {
                    min-width: 0;
                    flex: 1;
                }
                .organic-conversion-route-kicker,
                .organic-conversion-focus-kicker {
                    margin-bottom: 4px;
                    color: rgba(200, 255, 236, 0.48);
                    font-size: 11px;
                    font-weight: 900;
                    letter-spacing: 1.5px;
                }
                .organic-conversion-route-title {
                    overflow: hidden;
                    color: #fff;
                    font-size: clamp(14px, 1.35vw, 18px);
                    font-weight: 900;
                    line-height: 1.1;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                }
                .organic-conversion-step-count {
                    flex: 0 0 auto;
                    display: grid;
                    place-items: center;
                    width: 58px;
                    height: 48px;
                    border-radius: 12px;
                    background: rgba(255, 208, 87, 0.15);
                    border: 1px solid rgba(255, 208, 87, 0.35);
                    color: #ffd057;
                    font-size: 22px;
                    font-weight: 900;
                }
                .organic-conversion-step-count span {
                    display: block;
                    margin-top: 2px;
                    color: rgba(255, 255, 255, 0.54);
                    font-size: 10px;
                    font-weight: 800;
                }
                .organic-conversion-step-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 5px;
                    margin-top: 6px;
                    max-height: 24px;
                    overflow: hidden;
                }
                .organic-conversion-step-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    max-width: 210px;
                    min-height: 20px;
                    padding: 0 7px;
                    border-radius: 999px;
                    border: 1px solid rgba(255, 208, 87, 0.24);
                    background: rgba(255, 208, 87, 0.1);
                    color: rgba(255, 238, 184, 0.9);
                    font-size: 10px;
                    font-weight: 800;
                    white-space: nowrap;
                }
                .organic-conversion-step-chip span {
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .organic-conversion-focus-card {
                    padding: 10px 14px;
                }
                .organic-conversion-focus-name {
                    display: flex;
                    align-items: baseline;
                    gap: 10px;
                    color: #fff;
                    font-size: 16px;
                    font-weight: 900;
                }
                .organic-conversion-focus-name span {
                    color: rgba(255, 255, 255, 0.56);
                    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
                    font-size: 12px;
                    font-weight: 800;
                }
                .organic-conversion-focus-line {
                    margin-top: 5px;
                    color: rgba(236, 255, 248, 0.74);
                    font-size: 11px;
                    font-weight: 700;
                    line-height: 1.35;
                }
                .organic-conversion-hint {
                    position: absolute;
                    right: clamp(22px, 3vw, 42px);
                    top: clamp(78px, 7vw, 94px);
                    z-index: 15;
                    max-width: 360px;
                    color: rgba(220, 255, 242, 0.48);
                    font-size: 12px;
                    font-weight: 700;
                    line-height: 1.45;
                    text-align: right;
                }
                @media (max-width: 900px) {
                    .organic-conversion-frame {
                        inset: 12px;
                        border-radius: 18px;
                    }
                    .organic-conversion-header {
                        max-width: 48vw;
                    }
                    .organic-conversion-tools {
                        top: 14px;
                        right: 14px;
                        gap: 6px;
                        padding: 6px;
                    }
                    .organic-conversion-route-button {
                        min-height: 32px;
                        padding: 0 8px;
                        font-size: 11px;
                    }
                    .organic-conversion-swap {
                        width: 32px;
                        min-height: 32px;
                    }
                    .organic-conversion-hint {
                        display: none;
                    }
                    .organic-conversion-info {
                        grid-template-columns: 1fr;
                        gap: 8px;
                    }
                    .organic-conversion-focus-card {
                        display: none;
                    }
                    .organic-conversion-route-strip {
                        min-height: 62px;
                        padding: 11px 12px;
                    }
                }
                @media (max-width: 640px) {
                    .organic-conversion-title {
                        font-size: 20px;
                    }
                    .organic-conversion-subtitle {
                        display: none;
                    }
                    .organic-conversion-header {
                        max-width: 44vw;
                    }
                    .organic-conversion-node {
                        width: 42px;
                        height: 42px;
                    }
                    .organic-conversion-node::before,
                    .organic-conversion-node-formula {
                        display: none;
                    }
                    .organic-conversion-node-name {
                        font-size: 11px;
                    }
                    .organic-conversion-tag {
                        top: -18px;
                        min-width: 44px;
                        padding: 3px 5px;
                        font-size: 8px;
                    }
                    .organic-conversion-route-title {
                        font-size: 14px;
                    }
                    .organic-conversion-step-count {
                        width: 46px;
                        height: 40px;
                        font-size: 18px;
                    }
                }
                .organic-conversion-frame[data-compact="true"] {
                        inset: 10px;
                        border-radius: 18px;
                }
                .organic-conversion-frame[data-compact="true"]::after {
                        inset: 10px;
                        border-radius: 14px;
                }
                .organic-conversion-frame[data-compact="true"] .organic-conversion-header {
                        top: 16px;
                        left: 16px;
                        max-width: 52%;
                }
                .organic-conversion-frame[data-compact="true"] .organic-conversion-title {
                        font-size: 22px;
                }
                .organic-conversion-frame[data-compact="true"] .organic-conversion-subtitle {
                        margin-top: 5px;
                        font-size: 9px;
                        letter-spacing: 1.4px;
                }
                .organic-conversion-frame[data-compact="true"] .organic-conversion-tools {
                        top: 12px;
                        right: 12px;
                        gap: 4px;
                        padding: 5px;
                        border-radius: 12px;
                }
                .organic-conversion-frame[data-compact="true"] .organic-conversion-route-button,
                .organic-conversion-frame[data-compact="true"] .organic-conversion-swap {
                        min-height: 30px;
                        font-size: 10px;
                }
                .organic-conversion-frame[data-compact="true"] .organic-conversion-route-button {
                        gap: 4px;
                        padding: 0 7px;
                }
                .organic-conversion-frame[data-compact="true"] .organic-conversion-route-button b {
                        font-size: 11px;
                }
                .organic-conversion-frame[data-compact="true"] .organic-conversion-swap {
                        width: 30px;
                }
                .organic-conversion-frame[data-compact="true"] .organic-conversion-hint,
                .organic-conversion-frame[data-compact="true"] .organic-conversion-zone,
                .organic-conversion-frame[data-compact="true"] .organic-conversion-zone-label {
                        display: none;
                }
                .organic-conversion-frame[data-compact="true"] .organic-conversion-map {
                        inset: 66px 12px 82px;
                }
                .organic-conversion-frame[data-compact="true"] .organic-conversion-node {
                        width: 46px;
                        height: 46px;
                }
                .organic-conversion-frame[data-compact="true"] .organic-conversion-node[data-route="true"] {
                        width: 74px;
                        height: 74px;
                        z-index: 10;
                }
                .organic-conversion-frame[data-compact="true"] .organic-conversion-node::before {
                        inset: 7px;
                }
                .organic-conversion-frame[data-compact="true"] .organic-conversion-node-name {
                        font-size: 11px;
                }
                .organic-conversion-frame[data-compact="true"] .organic-conversion-node[data-route="true"] .organic-conversion-node-name {
                        font-size: 15px;
                }
                .organic-conversion-frame[data-compact="true"] .organic-conversion-node-formula {
                        font-size: 8px;
                }
                .organic-conversion-frame[data-compact="true"] .organic-conversion-node[data-route="true"] .organic-conversion-node-formula {
                        font-size: 9px;
                }
                .organic-conversion-frame[data-compact="true"] .organic-conversion-tag {
                        top: -21px;
                        min-width: 48px;
                        padding: 3px 5px;
                        font-size: 8px;
                }
                .organic-conversion-frame[data-compact="true"] .organic-conversion-info {
                        left: 12px;
                        right: 12px;
                        bottom: 10px;
                        grid-template-columns: 1fr;
                }
                .organic-conversion-frame[data-compact="true"] .organic-conversion-focus-card {
                        display: none;
                }
                .organic-conversion-frame[data-compact="true"] .organic-conversion-route-strip {
                        min-height: 62px;
                        padding: 9px 11px;
                }
                .organic-conversion-frame[data-compact="true"] .organic-conversion-route-kicker {
                        margin-bottom: 3px;
                        font-size: 9px;
                }
                .organic-conversion-frame[data-compact="true"] .organic-conversion-route-title {
                        font-size: 14px;
                }
                .organic-conversion-frame[data-compact="true"] .organic-conversion-step-list {
                        margin-top: 4px;
                }
                .organic-conversion-frame[data-compact="true"] .organic-conversion-step-chip {
                        min-height: 18px;
                        padding: 0 6px;
                        font-size: 9px;
                }
                .organic-conversion-frame[data-compact="true"] .organic-conversion-step-count {
                        width: 46px;
                        height: 42px;
                        font-size: 18px;
                }
                `}),e.jsxs("div",{className:"organic-conversion-frame",ref:d,"data-compact":l,children:[e.jsxs("header",{className:"organic-conversion-header",children:[e.jsx("h3",{className:"organic-conversion-title",children:"全域定向演化拓扑"}),e.jsx("div",{className:"organic-conversion-subtitle",children:"GLOBAL CONVERSION TOPOLOGY MATRIX"})]}),e.jsxs("div",{className:"organic-conversion-tools","aria-label":"路线控制",children:[e.jsxs("button",{type:"button",className:"organic-conversion-route-button","data-active":w==="start",onClick:()=>a("start"),children:["起点 ",e.jsx("b",{children:I(o)})]}),e.jsx("button",{type:"button",className:"organic-conversion-swap","aria-label":"交换起点和终点",onClick:u,children:"⇄"}),e.jsxs("button",{type:"button",className:"organic-conversion-route-button","data-active":w==="target",onClick:()=>a("target"),children:["终点 ",e.jsx("b",{children:I(t)})]})]}),e.jsx("div",{className:"organic-conversion-hint",children:"默认只显示当前路线；点选某个官能团后，再展开它的入边和出边，避免全图连线互相干扰。"}),e.jsxs("div",{className:"organic-conversion-map",children:[e.jsxs("svg",{className:"organic-conversion-svg",viewBox:"0 0 100 100",preserveAspectRatio:"none","aria-hidden":"true",children:[e.jsxs("defs",{children:[e.jsx("marker",{id:"organic-arrow-outgoing",markerWidth:"2.2",markerHeight:"2.2",refX:"2.05",refY:"1.1",orient:"auto",markerUnits:"userSpaceOnUse",children:e.jsx("path",{d:"M 0 0 L 2.2 1.1 L 0 2.2 z",fill:"#7cf0ca"})}),e.jsx("marker",{id:"organic-arrow-incoming",markerWidth:"2.2",markerHeight:"2.2",refX:"2.05",refY:"1.1",orient:"auto",markerUnits:"userSpaceOnUse",children:e.jsx("path",{d:"M 0 0 L 2.2 1.1 L 0 2.2 z",fill:"#98b4ff"})}),e.jsxs("filter",{id:"organic-route-glow",x:"-40%",y:"-40%",width:"180%",height:"180%",children:[e.jsx("feGaussianBlur",{stdDeviation:"1.6",result:"blur"}),e.jsxs("feMerge",{children:[e.jsx("feMergeNode",{in:"blur"}),e.jsx("feMergeNode",{in:"SourceGraphic"})]})]})]}),ue.map(n=>e.jsxs("g",{children:[e.jsx("rect",{className:"organic-conversion-zone",x:n.x,y:n.y,width:n.width,height:n.height,rx:"2"}),e.jsx("text",{className:"organic-conversion-zone-label",x:n.x+2,y:n.y+4,children:n.label})]},n.label)),((s==null?void 0:s.steps)||[]).map((n,f)=>{const H=X(n.from),R=X(n.to);if(!H||!R)return null;const $=ye(H,R),E=_e(H,R,2.35);return e.jsxs("g",{children:[e.jsx("path",{d:$,fill:"none",stroke:"rgba(255, 208, 87, 0.2)",strokeWidth:"0.76",strokeLinecap:"round",filter:"url(#organic-route-glow)"}),e.jsx("path",{d:$,fill:"none",stroke:"#ffd057",strokeWidth:"0.26",strokeLinecap:"round",strokeDasharray:"0.7 1.45",children:e.jsx("animate",{attributeName:"stroke-dashoffset",from:"2.15",to:"0",dur:"1.25s",repeatCount:"indefinite"})}),e.jsx("circle",{cx:E.x,cy:E.y,r:"0.88",fill:"#ffd057",opacity:"0.98"}),e.jsx("text",{x:E.x,y:E.y+.3,textAnchor:"middle",fill:"#06110f",fontSize:"0.86",fontWeight:"900",children:f+1})]},`${n.id||n.key}-${f}`)})]}),m.map(n=>{const f=X(n),H=T.has(n),R=N===n,$=o===n,E=t===n;return e.jsxs(C.button,{type:"button",className:"organic-conversion-node","data-route":H,"data-selected":R,style:{left:`${f.x}%`,top:`${f.y}%`,"--node-color":f.color},"aria-label":f.label,onMouseEnter:()=>x(n),onMouseLeave:()=>x(null),onFocus:()=>x(n),onBlur:()=>x(null),onClick:()=>se(n),whileHover:{scale:1.08},whileTap:{scale:.96},animate:{scale:R?1.12:1},transition:{type:"spring",stiffness:320,damping:24},children:[$&&e.jsx("span",{className:"organic-conversion-tag","data-kind":"start",children:"START"}),E&&e.jsx("span",{className:"organic-conversion-tag","data-kind":"target",children:"TARGET"}),e.jsx("span",{className:"organic-conversion-node-name",children:f.label}),e.jsx("span",{className:"organic-conversion-node-formula",children:f.formula})]},n)})]}),e.jsxs("section",{className:"organic-conversion-info","aria-label":"路线摘要",children:[e.jsxs("div",{className:"organic-conversion-route-strip",children:[e.jsxs("div",{className:"organic-conversion-route-main",children:[e.jsx("div",{className:"organic-conversion-route-kicker",children:"CURRENT SYNTHESIS ROUTE"}),e.jsx("div",{className:"organic-conversion-route-title",title:q,children:q}),!!((J=s==null?void 0:s.steps)!=null&&J.length)&&e.jsx("div",{className:"organic-conversion-step-list",children:s.steps.map((n,f)=>e.jsxs("span",{className:"organic-conversion-step-chip",children:[f+1,e.jsx("span",{children:n.name})]},`${n.id||n.name}-${f}`))})]}),e.jsxs("div",{className:"organic-conversion-step-count",children:[((Q=s==null?void 0:s.steps)==null?void 0:Q.length)??0,e.jsx("span",{children:"STEP"})]})]}),e.jsxs("div",{className:"organic-conversion-focus-card",children:[e.jsx("div",{className:"organic-conversion-focus-kicker",children:W?"SELECTED NODE":(Z=s==null?void 0:s.steps)!=null&&Z.length?"HIGHLIGHTED CONDITION":"NODE PROFILE"}),W?e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"organic-conversion-focus-name",children:[W.label,e.jsxs("span",{children:[W.formula," · ",W.family]})]}),e.jsx("div",{className:"organic-conversion-focus-line",children:re||`点选后可设为${w==="start"?"路线起点":"路线终点"}，并重新计算推荐路径。`})]}):(K=s==null?void 0:s.steps)!=null&&K.length?e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"organic-conversion-focus-name",children:[s.steps[0].name,e.jsxs("span",{children:[I(s.steps[0].from)," → ",I(s.steps[0].to)]})]}),e.jsxs("div",{className:"organic-conversion-focus-line",children:[s.steps[0].condition,"；",s.steps[0].note]})]}):e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"organic-conversion-focus-name",children:[I(o),e.jsx("span",{children:be(o)})]}),e.jsx("div",{className:"organic-conversion-focus-line",children:"当前起点和终点相同，可重新选择终点查看转化路线。"})]})]})]})]})]},"conversion")}const Y=(o,t=720)=>he(o,{width:t});function we({synthesisChallengeId:o,synthesisChallenge:t,synthesisPreview:r,currentNode:i,onSelectChallenge:c,onAddSynthesisStep:u,onRemoveLastSynthesisStep:p,onResetSynthesisSteps:g,synthesisChallenges:d,transformRules:h,getNodeLabel:x}){const[N,O]=S.useState(!1),w=a=>{if(typeof a=="string"&&a.startsWith("s")){const b=a.replace("s","");if(!isNaN(b)&&Number(b)>=1&&Number(b)<=40)return Y(`cbg_${b}.webp`)}const l={halogenate_alkane:1,eliminate_halide:2,hydrolysis_halide:3,add_hx_alkene:4,hydrate_alkene:5,eliminate_alcohol:6,alcohol_to_halide:7,oxidize_alcohol_to_aldehyde:8,oxidize_alcohol_to_ketone:9,oxidize_alcohol_to_acid:10,hydrate_alkyne:11,reduce_alkyne:12,oxidize_aldehyde_to_acid:13,reduce_aldehyde_to_alcohol:14,reduce_ketone_to_alcohol:15,esterification:16,hydrolysis_ester_to_carboxylic:17,hydrolysis_ester_to_alcohol:18,alcohol_to_ether:19,reduce_alkene_to_alkane:20,reduce_alkyne_to_alkane:21,polymerize_alkene:22,crack_alkane_to_alkene:23,nitrate_benzene:24,reduce_nitro_to_aniline:25,alkylate_benzene:26,oxidize_toluene_to_acid:27,halogenate_benzene:28,halobenzene_to_phenol:29,phenol_esterification:30};if(l[a])return Y(`rule_${l[a]}.webp`);let k=0;for(let b=0;b<a.length;b++)k=a.charCodeAt(b)+((k<<5)-k);const m=Math.abs(k)%40+1;return Y(`bg_${m}.webp`)};return e.jsxs(C.div,{initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},style:{position:"absolute",inset:0,pointerEvents:"none",zIndex:10},children:[e.jsxs("div",{style:{position:"absolute",top:"20px",left:"30px",right:"30px",height:"110px",display:"flex",gap:"16px",paddingBottom:"10px",pointerEvents:"auto"},children:[e.jsxs("div",{style:{display:"flex",flexDirection:"column",justifyContent:"center",minWidth:"160px",paddingRight:"16px",borderRight:"1px solid rgba(255,255,255,0.1)"},children:[e.jsx("h3",{style:{fontSize:"24px",fontWeight:"800",margin:0,color:"#ffd166"},children:"合成题库"}),e.jsx("div",{style:{fontSize:"11px",color:"rgba(255,255,255,0.6)",marginTop:"4px"},children:"精选核心路线挑战"})]}),d.slice(0,4).map(a=>{const l=o===a.id;return e.jsxs("div",{onClick:()=>c(a.id),style:{flex:1,minWidth:0,backgroundImage:l?`linear-gradient(135deg, rgba(255,209,102,0.25), rgba(30,26,18,0.95)), ${w(a.id)}`:`linear-gradient(to bottom, rgba(20,24,30,0.85), rgba(20,24,30,0.98)), ${w(a.id)}`,backgroundSize:"cover",backgroundPosition:"center",border:`1px solid ${l?"rgba(255,209,102,0.6)":"rgba(255,255,255,0.1)"}`,borderRadius:"12px",padding:"12px 14px",cursor:"pointer",transition:"all 0.2s",boxShadow:l?"0 4px 15px rgba(255,209,102,0.1)":"none",display:"flex",flexDirection:"column"},children:[e.jsx("div",{style:{fontSize:"13px",color:l?"#ffd166":"#fff",fontWeight:"bold",marginBottom:"4px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"},children:a.title}),e.jsx("div",{style:{fontSize:"11px",color:l?"#ffe2a0":"#aab8c5",marginBottom:"8px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"},children:a.scenario}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"6px",fontSize:"10px",color:l?"#d9bd82":"#7f8a96",marginTop:"auto",background:"rgba(0,0,0,0.2)",padding:"4px 8px",borderRadius:"6px",alignSelf:"flex-start"},children:[e.jsx("span",{children:x(a.start)}),e.jsx("svg",{width:"10",height:"10",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:e.jsx("path",{d:"M5 12h14M12 5l7 7-7 7"})}),e.jsx("span",{children:x(a.target)})]})]},a.id)}),d.length>4&&e.jsxs("div",{onClick:()=>O(!0),style:{minWidth:"120px",background:"rgba(255,255,255,0.03)",border:"1px dashed rgba(255,255,255,0.2)",borderRadius:"12px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all 0.2s",color:"#aab8c5",gap:"8px"},children:[e.jsxs("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("circle",{cx:"12",cy:"12",r:"1"}),e.jsx("circle",{cx:"19",cy:"12",r:"1"}),e.jsx("circle",{cx:"5",cy:"12",r:"1"})]}),e.jsx("span",{style:{fontSize:"12px",fontWeight:"bold"},children:"更多题库"})]})]}),e.jsxs("div",{style:{position:"absolute",left:"30px",right:"30px",top:"150px",bottom:"30px",pointerEvents:"auto",display:"flex",flexDirection:"column",background:"rgba(18,26,34,0.9)",border:"1px solid rgba(127,223,255,0.2)",borderRadius:"14px",padding:"20px",boxShadow:"0 8px 32px rgba(0,0,0,0.4)"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px"},children:[e.jsxs("div",{style:{fontSize:"14px",color:"#7fdfff",fontWeight:"bold",display:"flex",alignItems:"center",gap:"6px"},children:[e.jsx("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"M9 18l6-6-6-6"})}),"路线推演与判定"]}),e.jsxs("div",{style:{display:"flex",gap:"8px"},children:[e.jsx("button",{onClick:p,style:{padding:"6px 12px",borderRadius:"8px",border:"1px solid rgba(255,255,255,0.2)",background:"rgba(255,255,255,0.06)",color:"#d9e4ef",cursor:"pointer",fontSize:"11px"},children:"撤销一步"}),e.jsx("button",{onClick:g,style:{padding:"6px 12px",borderRadius:"8px",border:"1px solid rgba(255,59,48,0.45)",background:"rgba(255,59,48,0.15)",color:"#ff9f96",cursor:"pointer",fontSize:"11px"},children:"清空路线"})]})]}),e.jsx("div",{style:{flex:1,overflowY:"auto",paddingRight:"10px",margin:"8px 0",borderTop:"1px solid rgba(255,255,255,0.05)",borderBottom:"1px solid rgba(255,255,255,0.05)"},children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",paddingTop:"16px",paddingBottom:"30px"},children:[e.jsx(C.div,{initial:{scale:.8,opacity:0},animate:{scale:1,opacity:1},style:{padding:"10px 20px",background:"linear-gradient(135deg, rgba(30,36,44,0.9), rgba(18,26,34,0.9))",border:"1px solid rgba(127,223,255,0.4)",borderRadius:"12px",color:"#7fdfff",fontSize:"13px",fontWeight:"bold",boxShadow:"0 4px 12px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.1)",zIndex:2},children:x(t.start)}),r.trace.map(a=>{const l=a.ok?"#34c759":"#ff3b30",k=a.ok?"#72f4a8":"#ff9f96",m=a.ok?"rgba(52,199,89,0.2)":"rgba(255,59,48,0.2)";return e.jsxs(y.Fragment,{children:[e.jsxs(C.div,{initial:{height:0,opacity:0},animate:{height:"auto",opacity:1},style:{display:"flex",flexDirection:"column",alignItems:"center",margin:"2px 0"},children:[e.jsx("div",{style:{width:"2px",height:"20px",background:`linear-gradient(to bottom, rgba(127,223,255,0.4), ${l})`}}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"8px",background:"rgba(10,14,20,0.8)",padding:"8px 16px",borderRadius:"20px",border:`1px solid ${l}66`,boxShadow:`0 2px 8px ${m}`,backdropFilter:"blur(8px)",zIndex:2},children:[e.jsx("span",{style:{fontSize:"11px",color:"#9fb1c9"},children:a.condition}),e.jsx("div",{style:{width:"1px",height:"12px",background:"rgba(255,255,255,0.2)"}}),e.jsx("span",{style:{fontSize:"10px",background:`${l}22`,color:k,padding:"3px 8px",borderRadius:"6px",fontWeight:"bold"},children:a.name})]}),e.jsx("div",{style:{width:"2px",height:"20px",background:`linear-gradient(to bottom, ${l}, ${l}88)`,position:"relative"},children:e.jsx("div",{style:{position:"absolute",bottom:"-4px",left:"-3px",width:"0",height:"0",borderLeft:"4px solid transparent",borderRight:"4px solid transparent",borderTop:`6px solid ${l}88`}})})]}),e.jsxs(C.div,{initial:{scale:.8,opacity:0},animate:{scale:1,opacity:1},style:{padding:"10px 20px",background:"linear-gradient(135deg, rgba(30,36,44,0.9), rgba(18,26,34,0.9))",border:`1px solid ${l}88`,borderRadius:"12px",color:k,fontSize:"13px",fontWeight:"bold",boxShadow:`0 4px 12px rgba(0,0,0,0.3), 0 0 15px ${m}`,position:"relative",zIndex:2},children:[x(a.ok?a.to:a.from),!a.ok&&e.jsx("div",{style:{position:"absolute",top:"-6px",right:"-6px",background:"#ff3b30",color:"#fff",fontSize:"10px",width:"18px",height:"18px",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"50%",fontWeight:"bold",boxShadow:"0 2px 4px rgba(0,0,0,0.5)"},children:"!"})]})]},a.idx)}),(()=>{const a=r.current===t.target&&r.invalidCount===0,l=r.invalidCount>0;if(a||l)return null;let k=h.filter(_=>_.from===i),m=h.filter(_=>_.from!==i),b=m[i.length%m.length],s=m[(i.length*2+1)%m.length],T=[...k,b,s].filter(Boolean);return T=Array.from(new Set(T)),T.sort((_,z)=>_.id.localeCompare(z.id)),e.jsxs(C.div,{initial:{opacity:0,y:10},animate:{opacity:1,y:0},style:{display:"flex",flexDirection:"column",alignItems:"center",width:"100%",marginTop:"16px"},children:[e.jsx("div",{style:{fontSize:"11px",color:"#ffd166",marginBottom:"12px",fontWeight:"bold",background:"rgba(255,209,102,0.1)",padding:"4px 12px",borderRadius:"12px",border:"1px dashed rgba(255,209,102,0.3)"},children:"请选择下一步反应分支"}),e.jsx("div",{style:{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:"12px",maxWidth:"85%"},children:T.map(_=>e.jsxs("button",{onClick:()=>u(_.id),style:{background:"rgba(20,25,30,0.95)",border:"1px solid rgba(127,223,255,0.3)",borderRadius:"12px",padding:0,cursor:"pointer",display:"flex",flexDirection:"column",transition:"all 0.2s",boxShadow:"0 4px 12px rgba(0,0,0,0.4)",width:"160px",overflow:"hidden"},onMouseOver:z=>{z.currentTarget.style.borderColor="#7fdfff",z.currentTarget.style.boxShadow="0 8px 24px rgba(127,223,255,0.3)",z.currentTarget.style.transform="translateY(-3px)"},onMouseOut:z=>{z.currentTarget.style.borderColor="rgba(127,223,255,0.3)",z.currentTarget.style.boxShadow="0 4px 12px rgba(0,0,0,0.4)",z.currentTarget.style.transform="translateY(0)"},children:[e.jsx("div",{style:{height:"70px",width:"100%",backgroundImage:w(_.id),backgroundSize:"cover",backgroundPosition:"center",borderBottom:"1px solid rgba(255,255,255,0.1)"}}),e.jsxs("div",{style:{padding:"12px",display:"flex",flexDirection:"column",gap:"6px",width:"100%",boxSizing:"border-box"},children:[e.jsx("div",{style:{fontSize:"13px",color:"#fff",fontWeight:"bold",textAlign:"left"},children:_.name}),e.jsxs("div",{style:{fontSize:"11px",color:"#9fb1c9",textAlign:"left",lineHeight:"1.4",height:"30px"},children:["条件: ",_.condition]}),e.jsxs("div",{style:{fontSize:"11px",color:"#7fdfff",marginTop:"4px",background:"rgba(127,223,255,0.1)",padding:"4px 8px",borderRadius:"6px",textAlign:"center",fontWeight:"bold"},children:["生成：",x(_.to)]})]})]},_.id))})]})})()]})}),e.jsx("div",{style:{marginTop:"16px"},children:(()=>{const a=r.current===t.target&&r.invalidCount===0,l=r.invalidCount>0;return r.trace.length>0?a?e.jsxs(C.div,{initial:{scale:.95,opacity:0},animate:{scale:1,opacity:1},style:{padding:"16px",background:"rgba(52,199,89,0.15)",border:"1px solid rgba(52,199,89,0.5)",borderRadius:"12px",display:"flex",alignItems:"center",gap:"12px"},children:[e.jsx("div",{style:{background:"#34c759",color:"#fff",width:"32px",height:"32px",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"bold",fontSize:"18px"},children:"✓"}),e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"15px",fontWeight:"bold",color:"#72f4a8"},children:"合成成功！"}),e.jsxs("div",{style:{fontSize:"12px",color:"#a3d9b4",marginTop:"4px"},children:["您已成功打通合成路径，抵达目标产物 ",x(t.target),"。"]})]})]}):l?e.jsxs(C.div,{initial:{opacity:0},animate:{opacity:1},style:{padding:"16px",background:"rgba(255,59,48,0.15)",border:"1px solid rgba(255,59,48,0.5)",borderRadius:"12px",display:"flex",alignItems:"center",gap:"12px"},children:[e.jsx("div",{style:{background:"#ff3b30",color:"#fff",width:"32px",height:"32px",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"bold",fontSize:"18px"},children:"!"}),e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"15px",fontWeight:"bold",color:"#ff9f96"},children:"路径受阻"}),e.jsx("div",{style:{fontSize:"12px",color:"#d9a3a3",marginTop:"4px"},children:"存在不合理的反应条件（或不满足此物质转化），请撤销并重新选择。"})]})]}):e.jsxs(C.div,{initial:{opacity:0},animate:{opacity:1},style:{padding:"16px",background:"rgba(127,223,255,0.1)",border:"1px solid rgba(127,223,255,0.3)",borderRadius:"12px",display:"flex",alignItems:"center",gap:"12px"},children:[e.jsxs("svg",{width:"32",height:"32",viewBox:"0 0 24 24",fill:"none",stroke:"#7fdfff",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("circle",{cx:"12",cy:"12",r:"10"}),e.jsx("polyline",{points:"12 6 12 12 16 14"})]}),e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"15px",fontWeight:"bold",color:"#7fdfff"},children:"推演进行中..."}),e.jsxs("div",{style:{fontSize:"12px",color:"#a3c2d9",marginTop:"4px"},children:["当前驻留节点：",x(i),"。距离目标 ",e.jsx("b",{children:x(t.target)})," 还有一段距离。"]})]})]}):e.jsxs(C.div,{initial:{opacity:0},animate:{opacity:1},style:{fontSize:"13px",color:"#b69a6e",padding:"16px",background:"rgba(255,209,102,0.05)",borderRadius:"12px",textAlign:"center",border:"1px dashed rgba(255,209,102,0.3)"},children:["🎯 请在上方框内选择反应分支，将 ",e.jsx("b",{children:x(t.start)})," 转化为 ",e.jsx("b",{children:x(t.target)}),"。"]})})()})]}),N&&e.jsx("div",{style:{position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"auto"},children:e.jsxs("div",{style:{width:"800px",maxHeight:"80vh",background:"rgba(20,24,30,0.95)",border:"1px solid rgba(127,223,255,0.3)",borderRadius:"16px",display:"flex",flexDirection:"column",boxShadow:"0 20px 40px rgba(0,0,0,0.5)"},children:[e.jsxs("div",{style:{padding:"20px 24px",borderBottom:"1px solid rgba(255,255,255,0.1)",display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsxs("div",{style:{fontSize:"18px",fontWeight:"bold",color:"#ffd166",display:"flex",alignItems:"center",gap:"8px"},children:[e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("rect",{x:"3",y:"3",width:"18",height:"18",rx:"2",ry:"2"}),e.jsx("line",{x1:"3",y1:"9",x2:"21",y2:"9"}),e.jsx("line",{x1:"9",y1:"21",x2:"9",y2:"9"})]}),"完整合成题库"]}),e.jsx("button",{onClick:()=>O(!1),style:{background:"transparent",border:"none",color:"#aab8c5",cursor:"pointer",padding:"4px"},children:e.jsxs("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})})]}),e.jsx("div",{style:{flex:1,overflowY:"auto",padding:"24px",display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:"16px",gridAutoRows:"minmax(220px, auto)",alignContent:"start"},children:d.map(a=>{const l=o===a.id;return e.jsxs("div",{onClick:()=>{c(a.id),O(!1)},style:{background:l?"rgba(30,26,18,0.9)":"rgba(20,24,30,0.9)",border:`1px solid ${l?"rgba(255,209,102,0.5)":"rgba(255,255,255,0.1)"}`,borderRadius:"12px",cursor:"pointer",transition:"all 0.2s",boxShadow:l?"0 4px 15px rgba(255,209,102,0.1)":"none",display:"flex",flexDirection:"column",overflow:"hidden",minHeight:"220px"},children:[e.jsx("div",{style:{height:"80px",flexShrink:0,width:"100%",backgroundImage:w(a.id),backgroundSize:"cover",backgroundPosition:"center",borderBottom:`1px solid ${l?"rgba(255,209,102,0.3)":"rgba(255,255,255,0.05)"}`}}),e.jsxs("div",{style:{padding:"16px",display:"flex",flexDirection:"column",flex:1},children:[e.jsx("div",{style:{fontSize:"14px",color:l?"#ffd166":"#fff",fontWeight:"bold",marginBottom:"6px"},children:a.title}),e.jsx("div",{style:{fontSize:"12px",color:l?"#ffe2a0":"#aab8c5",marginBottom:"12px",flex:1},children:a.scenario}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"6px",fontSize:"11px",color:l?"#d9bd82":"#7f8a96",marginTop:"auto",background:"rgba(0,0,0,0.2)",padding:"6px 10px",borderRadius:"8px",alignSelf:"flex-start"},children:[e.jsx("span",{children:x(a.start)}),e.jsx("svg",{width:"12",height:"12",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:e.jsx("path",{d:"M5 12h14M12 5l7 7-7 7"})}),e.jsx("span",{children:x(a.target)})]})]})]},a.id)})})]})})]},"synthesis")}const ae={alkane:"烷烃",alkene:"烯烃",alkyne:"炔烃",haloalkane:"卤代烃",alcohol:"醇",aldehyde:"醛",ketone:"酮",carboxylic:"羧酸",ester:"酯",ether:"醚",polymer:"聚合物",benzene:"芳香烃(苯)",nitrobenzene:"硝基苯",aniline:"苯胺",phenol:"苯酚",toluene:"甲苯",benzoic_acid:"苯甲酸",halobenzene:"卤代苯"},L=[{id:"halogenate_alkane",from:"alkane",to:"haloalkane",name:"烷烃卤代",condition:"X2 / 光照",limit:"自由基取代，易产生多重取代物"},{id:"eliminate_halide",from:"haloalkane",to:"alkene",name:"卤代烃消去",condition:"NaOH / 醇，加热",limit:"遵循扎伊采夫规则"},{id:"hydrolysis_halide",from:"haloalkane",to:"alcohol",name:"卤代烃水解",condition:"NaOH(aq)，加热",limit:"伴随消去副反应"},{id:"add_hx_alkene",from:"alkene",to:"haloalkane",name:"烯烃加成(HX)",condition:"HX",limit:"遵循马氏规则"},{id:"hydrate_alkene",from:"alkene",to:"alcohol",name:"烯烃水化",condition:"H2O / H+ 催化",limit:"工业制乙醇等"},{id:"eliminate_alcohol",from:"alcohol",to:"alkene",name:"醇消去",condition:"浓H2SO4，170℃",limit:"副反应产生醚"},{id:"alcohol_to_halide",from:"alcohol",to:"haloalkane",name:"醇卤代",condition:"HX 或 SOCl2",limit:"注意取代/消除竞争"},{id:"oxidize_alcohol_to_aldehyde",from:"alcohol",to:"aldehyde",name:"醇氧化为醛",condition:"Cu / O2 或 PCC",limit:"仅伯醇可到醛"},{id:"oxidize_alcohol_to_ketone",from:"alcohol",to:"ketone",name:"仲醇氧化为酮",condition:"Cu / O2 或 K2Cr2O7",limit:"适用于仲醇"},{id:"oxidize_alcohol_to_acid",from:"alcohol",to:"carboxylic",name:"醇强氧化",condition:"酸性 KMnO4",limit:"一般针对伯醇"},{id:"hydrate_alkyne",from:"alkyne",to:"ketone",name:"炔烃水化",condition:"HgSO4 / H2SO4",limit:"乙炔水化生成乙醛，其他生成酮"},{id:"reduce_alkyne",from:"alkyne",to:"alkene",name:"炔烃不完全加成",condition:"H2 / Lindlar催化剂",limit:"生成顺式烯烃"},{id:"oxidize_aldehyde_to_acid",from:"aldehyde",to:"carboxylic",name:"醛氧化",condition:"新制 Cu(OH)2 / 银氨溶液",limit:"常作鉴别反应"},{id:"reduce_aldehyde_to_alcohol",from:"aldehyde",to:"alcohol",name:"醛还原",condition:"H2 / Ni 或 NaBH4",limit:"得到伯醇"},{id:"reduce_ketone_to_alcohol",from:"ketone",to:"alcohol",name:"酮还原",condition:"H2 / Ni 或 NaBH4",limit:"得到仲醇"},{id:"esterification",from:"carboxylic",to:"ester",name:"酯化",condition:"醇、浓H2SO4、加热",limit:"可逆反应，需要移除水推动平衡"},{id:"hydrolysis_ester_to_carboxylic",from:"ester",to:"carboxylic",name:"酯水解(酸)",condition:"稀H2SO4、加热",limit:"可逆反应"},{id:"hydrolysis_ester_to_alcohol",from:"ester",to:"alcohol",name:"酯水解得醇",condition:"水解后分离醇组分",limit:"碱性水解不可逆"},{id:"alcohol_to_ether",from:"alcohol",to:"ether",name:"醇分子间脱水",condition:"浓H2SO4，140℃",limit:"生成对称醚"},{id:"reduce_alkene_to_alkane",from:"alkene",to:"alkane",name:"烯烃加氢",condition:"H2 / Ni，加热",limit:"完全饱和化"},{id:"reduce_alkyne_to_alkane",from:"alkyne",to:"alkane",name:"炔烃完全加氢",condition:"H2 (过量) / Ni，加热",limit:"直接生成烷烃"},{id:"polymerize_alkene",from:"alkene",to:"polymer",name:"加聚反应",condition:"引发剂 / 加热加压",limit:"合成高分子材料"},{id:"crack_alkane_to_alkene",from:"alkane",to:"alkene",name:"烷烃高温裂解",condition:"高温 / 催化剂",limit:"工业制取烯烃"},{id:"nitrate_benzene",from:"benzene",to:"nitrobenzene",name:"苯的硝化",condition:"浓HNO3 / 浓H2SO4，50-60℃",limit:"亲电取代"},{id:"reduce_nitro_to_aniline",from:"nitrobenzene",to:"aniline",name:"硝基还原",condition:"Fe / HCl，然后 NaOH",limit:"制备苯胺"},{id:"alkylate_benzene",from:"benzene",to:"toluene",name:"傅克烷基化",condition:"卤代烃 / AlCl3",limit:"引入烷基侧链"},{id:"oxidize_toluene_to_acid",from:"toluene",to:"benzoic_acid",name:"侧链氧化",condition:"酸性 KMnO4",limit:"含α-H的烷基侧链全部被氧化为羧基"},{id:"halogenate_benzene",from:"benzene",to:"halobenzene",name:"苯的卤代",condition:"X2 / FeX3",limit:"芳环上的取代"},{id:"halobenzene_to_phenol",from:"halobenzene",to:"phenol",name:"卤代苯水解",condition:"NaOH(aq)，高温高压",limit:"芳环卤素很难水解，需剧烈条件"},{id:"phenol_esterification",from:"phenol",to:"ester",name:"酚酯化",condition:"酸酐或酰氯",limit:"酚不能直接与羧酸酯化"}],A=[{id:"s1",title:"基础篇：乙酸的制备",scenario:"由 溴乙烷 制备 乙酸",start:"haloalkane",target:"carboxylic",maxSteps:3,recommended:["hydrolysis_halide","oxidize_alcohol_to_aldehyde","oxidize_aldehyde_to_acid"]},{id:"s2",title:"基础篇：乙醛的制备",scenario:"由 乙烷 制备 乙醛",start:"alkane",target:"aldehyde",maxSteps:3,recommended:["halogenate_alkane","hydrolysis_halide","oxidize_alcohol_to_aldehyde"]},{id:"s3",title:"工业篇：乙酸乙酯的合成",scenario:"由 乙烯 制备 乙酸乙酯",start:"alkene",target:"ester",maxSteps:4,recommended:["hydrate_alkene","oxidize_alcohol_to_acid","esterification"]},{id:"s4",title:"逆推篇：乙烯的获取",scenario:"由 乙酸乙酯 还原提取 乙烯",start:"ester",target:"alkene",maxSteps:3,recommended:["hydrolysis_ester_to_alcohol","eliminate_alcohol"]},{id:"s5",title:"专项篇：乙醇的获取",scenario:"由 乙炔 制备 乙醇",start:"alkyne",target:"alcohol",maxSteps:2,recommended:["hydrate_alkyne","reduce_ketone_to_alcohol"]},{id:"s6",title:"转化篇：氯乙烷的制备",scenario:"由 乙醇 制备 氯乙烷",start:"alcohol",target:"haloalkane",maxSteps:2,recommended:["eliminate_alcohol","add_hx_alkene"]},{id:"s7",title:"进阶篇：丙酮的合成",scenario:"由 丙烯 制备 丙酮",start:"alkene",target:"ketone",maxSteps:2,recommended:["hydrate_alkene","oxidize_alcohol_to_ketone"]},{id:"s8",title:"进阶篇：丙烯的获取",scenario:"由 丙烷 获取 丙烯",start:"alkane",target:"alkene",maxSteps:2,recommended:["halogenate_alkane","eliminate_halide"]},{id:"s9",title:"综合篇：乙二酸二乙酯 (模拟)",scenario:"由 卤代烃 制备 酯类化合物",start:"haloalkane",target:"ester",maxSteps:4,recommended:["hydrolysis_halide","oxidize_alcohol_to_acid","esterification"]},{id:"s10",title:"综合篇：多步转化网络",scenario:"由 炔烃 经过多步转化制备 羧酸",start:"alkyne",target:"carboxylic",maxSteps:3,recommended:["reduce_alkyne","hydrate_alkene","oxidize_alcohol_to_acid"]},{id:"s11",title:"材料篇：聚乙烯合成",scenario:"由 乙烷 出发合成 塑料聚乙烯",start:"alkane",target:"polymer",maxSteps:2,recommended:["crack_alkane_to_alkene","polymerize_alkene"]},{id:"s12",title:"醚类篇：乙醚的制备",scenario:"由 卤代烃 制备 乙醚（麻醉剂）",start:"haloalkane",target:"ether",maxSteps:2,recommended:["hydrolysis_halide","alcohol_to_ether"]},{id:"s13",title:"还原篇：炔烃饱和化",scenario:"由 炔烃 彻底转化为 烷烃",start:"alkyne",target:"alkane",maxSteps:1,recommended:["reduce_alkyne_to_alkane"]},{id:"s14",title:"工业篇：由烷烃制备醇",scenario:"从 烷烃 出发，经过多步转化为 醇",start:"alkane",target:"alcohol",maxSteps:3,recommended:["halogenate_alkane","hydrolysis_halide"]},{id:"s15",title:"进阶篇：烯烃制备酯类",scenario:"由 烯烃 一步步制备 酯类化合物",start:"alkene",target:"ester",maxSteps:4,recommended:["hydrate_alkene","oxidize_alcohol_to_aldehyde","oxidize_aldehyde_to_acid","esterification"]},{id:"s16",title:"环保篇：降解回收烯烃",scenario:"由 废弃酯类 回收制备 烯烃 气体",start:"ester",target:"alkene",maxSteps:2,recommended:["hydrolysis_ester_to_alcohol","eliminate_alcohol"]},{id:"s17",title:"综合篇：碳链饱和与氧化",scenario:"将 炔烃 部分加氢后，再转化为 醛",start:"alkyne",target:"aldehyde",maxSteps:3,recommended:["reduce_alkyne","hydrate_alkene","oxidize_alcohol_to_aldehyde"]},{id:"s18",title:"终极挑战：全链路循环",scenario:"由 烷烃 出发，最终又闭环变回 烷烃",start:"alkane",target:"alkane",maxSteps:3,recommended:["halogenate_alkane","eliminate_halide","reduce_alkene_to_alkane"]},{id:"s19",title:"芳香篇：硝基苯的合成",scenario:"由 苯 发生亲电取代制备 硝基苯",start:"benzene",target:"nitrobenzene",maxSteps:1,recommended:["nitrate_benzene"]},{id:"s20",title:"芳香篇：染料原料苯胺",scenario:"由 苯 经过多步制备 苯胺",start:"benzene",target:"aniline",maxSteps:2,recommended:["nitrate_benzene","reduce_nitro_to_aniline"]},{id:"s21",title:"芳香篇：甲苯的制备",scenario:"对 苯 进行傅克烷基化制备 甲苯",start:"benzene",target:"toluene",maxSteps:1,recommended:["alkylate_benzene"]},{id:"s22",title:"芳香篇：防腐剂苯甲酸",scenario:"由 苯 出发制备 苯甲酸",start:"benzene",target:"benzoic_acid",maxSteps:2,recommended:["alkylate_benzene","oxidize_toluene_to_acid"]},{id:"s23",title:"芳香篇：工业苯酚的制备",scenario:"由 苯 经过卤代和剧烈水解制备 苯酚",start:"benzene",target:"phenol",maxSteps:2,recommended:["halogenate_benzene","halobenzene_to_phenol"]},{id:"s24",title:"芳香篇：酚类酯化",scenario:"由 卤代苯 制备 芳香酯类化合物",start:"halobenzene",target:"ester",maxSteps:2,recommended:["halobenzene_to_phenol","phenol_esterification"]},{id:"s25",title:"转化篇：烯烃重组",scenario:"将 卤代烃 转化为 烷烃",start:"haloalkane",target:"alkane",maxSteps:2,recommended:["eliminate_halide","reduce_alkene_to_alkane"]},{id:"s26",title:"聚合篇：导电聚乙炔模拟",scenario:"由 炔烃 经过不完全加成后 转化为 聚合物",start:"alkyne",target:"polymer",maxSteps:2,recommended:["reduce_alkyne","polymerize_alkene"]},{id:"s27",title:"异构篇：醇的转化网络",scenario:"将 醇 发生消去后再水化",start:"alcohol",target:"alcohol",maxSteps:2,recommended:["eliminate_alcohol","hydrate_alkene"]},{id:"s28",title:"进阶篇：酮的降解",scenario:"由 酮 还原为仲醇后再消去制取 烯烃",start:"ketone",target:"alkene",maxSteps:2,recommended:["reduce_ketone_to_alcohol","eliminate_alcohol"]},{id:"s29",title:"长线篇：卤代烃到酸",scenario:"由 卤代烃 经过连串反应制备 羧酸",start:"haloalkane",target:"carboxylic",maxSteps:3,recommended:["hydrolysis_halide","oxidize_alcohol_to_aldehyde","oxidize_aldehyde_to_acid"]},{id:"s30",title:"长线篇：极限酯化",scenario:"由 烷烃 开始的超长链路制备 酯类",start:"alkane",target:"ester",maxSteps:4,recommended:["crack_alkane_to_alkene","hydrate_alkene","oxidize_alcohol_to_acid","esterification"]},{id:"s31",title:"溶剂篇：醛类变醚",scenario:"由 醛 还原后脱水制取 醚类",start:"aldehyde",target:"ether",maxSteps:2,recommended:["reduce_aldehyde_to_alcohol","alcohol_to_ether"]},{id:"s32",title:"溶剂篇：烷烃制醚",scenario:"由 烷烃 制取对称 醚",start:"alkane",target:"ether",maxSteps:3,recommended:["halogenate_alkane","hydrolysis_halide","alcohol_to_ether"]},{id:"s33",title:"水化篇：直接制酮",scenario:"由 炔烃 直接水化制取 酮",start:"alkyne",target:"ketone",maxSteps:1,recommended:["hydrate_alkyne"]},{id:"s34",title:"高分子篇：单体获取",scenario:"由 卤代烃 制备 聚合物",start:"haloalkane",target:"polymer",maxSteps:2,recommended:["eliminate_halide","polymerize_alkene"]},{id:"s35",title:"芳香篇：氯苯的获取",scenario:"由 苯 直接制取 卤代苯",start:"benzene",target:"halobenzene",maxSteps:1,recommended:["halogenate_benzene"]},{id:"s36",title:"综合篇：芳香酸酯",scenario:"由 甲苯 制备 芳香族酯",start:"toluene",target:"ester",maxSteps:2,recommended:["oxidize_toluene_to_acid","esterification"]},{id:"s37",title:"医药篇：解热镇痛药前体",scenario:"由 苯酚 转化为 酯类前体",start:"phenol",target:"ester",maxSteps:1,recommended:["phenol_esterification"]},{id:"s38",title:"化工篇：烯烃变醛",scenario:"由 烯烃 经醇转化为 醛",start:"alkene",target:"aldehyde",maxSteps:2,recommended:["hydrate_alkene","oxidize_alcohol_to_aldehyde"]},{id:"s39",title:"化工篇：逆向脱氧",scenario:"将 醛 变回 卤代烃",start:"aldehyde",target:"haloalkane",maxSteps:2,recommended:["reduce_aldehyde_to_alcohol","alcohol_to_halide"]},{id:"s40",title:"终极篇：九宫格迷宫",scenario:"从 酮 还原后经历消去并聚合",start:"ketone",target:"polymer",maxSteps:3,recommended:["reduce_ketone_to_alcohol","eliminate_alcohol","polymerize_alkene"]}],ze=Object.keys(ae);function je(o,t){let r=o,i=0;const c=t.map((u,p)=>{const g=L.find(x=>x.id===u);if(!g)return i+=1,{idx:p+1,name:"未知步骤",ok:!1,from:r,to:r,condition:"未识别",limit:"步骤 ID 无效"};const d=g.from===r,h=r;return d?r=g.to:i+=1,{idx:p+1,name:g.name,ok:d,from:h,to:d?g.to:h,condition:g.condition,limit:g.limit}});return{current:r,invalidCount:i,trace:c}}function Ce(o,t){if(!o||!t)return null;if(o===t)return{steps:[],nodes:[o]};const r=[{node:o,stepIds:[],nodes:[o]}],i=new Set([o]);for(;r.length>0;){const c=r.shift(),u=L.filter(p=>p.from===c.node);for(const p of u){if(i.has(p.to))continue;const g=[...c.stepIds,p.id],d=[...c.nodes,p.to];if(p.to===t)return{steps:g.map(h=>L.find(x=>x.id===h)).filter(Boolean),nodes:d};i.add(p.to),r.push({node:p.to,stepIds:g,nodes:d})}}return null}function te(o){return ae[o]||o}function Oe(){const[o,t]=S.useState(A[0].id),[r,i]=S.useState([]),[c,u]=S.useState("alcohol"),[p,g]=S.useState("ester"),d=S.useMemo(()=>A.find(m=>m.id===o)||A[0],[o]),h=S.useMemo(()=>je(d.start,r),[d,r]),x=S.useMemo(()=>Ce(c,p),[c,p]),N=S.useCallback(m=>{i(b=>b.length>=8?b:[...b,m])},[]),O=S.useCallback(()=>{i(m=>m.slice(0,-1))},[]),w=S.useCallback(()=>{i([])},[]),a=S.useCallback(()=>{u(p),g(c)},[c,p]),l=S.useCallback(m=>{t(m),i([])},[]),k=h.current;return{conversionViewProps:{routeFrom:c,routeTo:p,routeResult:x,onSetRouteFrom:u,onSetRouteTo:g,onSwapRouteDirection:a,functionalNodeKeys:ze,transformRules:L,getNodeLabel:te},synthesisViewProps:{synthesisChallengeId:o,synthesisChallenge:d,synthesisPreview:h,currentNode:k,onSelectChallenge:l,onAddSynthesisStep:N,onRemoveLastSynthesisStep:O,onResetSynthesisSteps:w,synthesisChallenges:A,transformRules:L,getNodeLabel:te}}}function Be({mode:o="synthesis"}){const t=Oe();return o==="conversion"?e.jsx(Se,{...t.conversionViewProps}):e.jsx(we,{...t.synthesisViewProps})}export{Be as default};
