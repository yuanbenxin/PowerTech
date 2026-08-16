window.BIO_VISUAL_SCENES=window.BIO_VISUAL_SCENES||{};
window.BIO_VISUAL_SCENES["s_b2_m03"]=(function(){
var ROMAN=["I","II","III","IV","V","VI","VII","VIII","IX","X"];
var NS=72,GG=160,SG=130,PX=120,PY=100;
var PRESETS={
color_blindness:{id:"color_blindness",name:"红绿色盲",gene:"OPN1LW",mode:"xlr",modeLabel:"X染色体隐性遗传",sym:"b",accent:"#38bdf8",glow:"rgba(56,189,248,0.3)",sick:"#f97316",desc:"典型伴X隐性遗传病，男性患者更多。",badge:"伴X隐性",clues:["男性患者多，女性少","无父子直传","患病父×正常母→女儿全为携带者"],scenario:function(){return{nodes:[mk("I-1","M",0,"NY","F","正常父亲"),mk("I-2","F",0,"Nm","F","携带者母亲"),mk("II-1","M",1,"","P","儿子"),mk("II-2","F",1,"","P","女儿")],marriages:[mar("m1","I-1","I-2",["II-1","II-2"])],sel:"II-1"};}},
hemophilia_a:{id:"hemophilia_a",name:"血友病A",gene:"F8",mode:"xlr",modeLabel:"X染色体隐性遗传",sym:"h",accent:"#8b5cf6",glow:"rgba(139,92,246,0.3)",sick:"#ef4444",desc:"典型伴X隐性遗传病，外祖母携带→外孙可能患病。",badge:"伴X隐性",clues:["女性表型正常但家系中多名男性患病","母亲携带者→儿子50%患病","女患者少见"],scenario:function(){return{nodes:[mk("I-1","M",0,"NY","F","正常父亲"),mk("I-2","F",0,"Nm","F","携带者母亲"),mk("II-1","M",1,"","P","儿子"),mk("II-2","F",1,"","P","女儿")],marriages:[mar("m1","I-1","I-2",["II-1","II-2"])],sel:"I-2"};}},
vd_rickets:{id:"vd_rickets",name:"抗维生素D佝偻病",gene:"PHEX",mode:"xld",modeLabel:"X染色体显性遗传",sym:"D",accent:"#f59e0b",glow:"rgba(245,158,11,0.28)",sick:"#f43f5e",desc:"伴X显性遗传病，患病父→女儿全患病。",badge:"伴X显性",clues:["患病父×正常母→女儿全患病，儿子全正常","无父子直传","杂合母亲→子女各50%患病"],scenario:function(){return{nodes:[mk("I-1","M",0,"mY","F","患病父亲"),mk("I-2","F",0,"NN","F","正常母亲"),mk("II-1","M",1,"","P","儿子"),mk("II-2","F",1,"","P","女儿")],marriages:[mar("m1","I-1","I-2",["II-1","II-2"])],sel:"I-1"};}},
albinism:{id:"albinism",name:"白化病",gene:"TYR",mode:"ar",modeLabel:"常染色体隐性遗传",sym:"a",accent:"#a78bfa",glow:"rgba(167,139,250,0.28)",sick:"#7c3aed",desc:"常隐经典病例，aa为患病，男女等概率。",badge:"常隐",clues:["父母正常后代患病→父母均为Aa","Aa×Aa→1/4患病","男女患病比例1:1"],scenario:function(){return{nodes:[mk("I-1","M",0,"Aa","F","携带者父亲"),mk("I-2","F",0,"Aa","F","携带者母亲"),mk("II-1","M",1,"","P","儿子"),mk("II-2","F",1,"","P","女儿")],marriages:[mar("m1","I-1","I-2",["II-1","II-2"])],sel:"II-1"};}},
sickle_cell:{id:"sickle_cell",name:"镰刀型细胞贫血症",gene:"HBB",mode:"ar",modeLabel:"常染色体隐性遗传",sym:"s",accent:"#f472b6",glow:"rgba(244,114,182,0.28)",sick:"#db2777",desc:"高中教材经典常隐遗传病。",badge:"常隐-分子病",clues:["aa患病","Aa为携带者","Aa×Aa→1/4患病"],scenario:function(){return{nodes:[mk("I-1","M",0,"Aa","F","携带者父亲"),mk("I-2","F",0,"Aa","F","携带者母亲"),mk("II-1","F",1,"","P","女儿"),mk("II-2","M",1,"","P","儿子")],marriages:[mar("m1","I-1","I-2",["II-1","II-2"])],sel:"I-1"};}},
polydactyly:{id:"polydactyly",name:"多指症",gene:"GLI3",mode:"ad",modeLabel:"常染色体显性遗传",sym:"D",accent:"#fb923c",glow:"rgba(251,146,60,0.28)",sick:"#ea580c",desc:"常显经典病例，Aa即患病。",badge:"常显",clues:["患者至少有一个患病亲本","Aa×aa→1/2患病","代代有患者"],scenario:function(){return{nodes:[mk("I-1","M",0,"Aa","F","杂合患病父亲"),mk("I-2","F",0,"aa","F","正常母亲"),mk("II-1","M",1,"","P","儿子"),mk("II-2","F",1,"","P","女儿")],marriages:[mar("m1","I-1","I-2",["II-1","II-2"])],sel:"II-1"};}},
syndactyly:{id:"syndactyly",name:"并指症",gene:"HOXD13",mode:"ad",modeLabel:"常染色体显性遗传",sym:"D",accent:"#e879f9",glow:"rgba(232,121,249,0.28)",sick:"#c026d3",desc:"常显遗传病，代代发病。",badge:"常显",clues:["正常×正常→后代不会出现显性病","患者×正常→50%患病","大多数患者为Aa"],scenario:function(){return{nodes:[mk("I-1","M",0,"aa","F","正常父亲"),mk("I-2","F",0,"Aa","F","杂合患病母亲"),mk("II-1","M",1,"","P","儿子"),mk("II-2","F",1,"","P","女儿")],marriages:[mar("m1","I-1","I-2",["II-1","II-2"])],sel:"II-2"};}},
custom_xlr:{id:"custom_xlr",name:"自定义伴X隐性",gene:"Custom",mode:"xlr",modeLabel:"X染色体隐性遗传",sym:"m",accent:"#14b8a6",glow:"rgba(20,184,166,0.28)",sick:"#ef4444",desc:"空白伴X隐性模板。",badge:"自定义",clues:["男性高发","女性可作携带者","无父子直传"],scenario:function(){return{nodes:[mk("I-1","M",0,"NY","F","初始父亲"),mk("I-2","F",0,"Nm","F","初始母亲")],marriages:[mar("m1","I-1","I-2",[])],sel:"I-2"};}},
custom_xld:{id:"custom_xld",name:"自定义伴X显性",gene:"Custom",mode:"xld",modeLabel:"X染色体显性遗传",sym:"M",accent:"#fb7185",glow:"rgba(251,113,133,0.25)",sick:"#f43f5e",desc:"空白伴X显性模板。",badge:"自定义",clues:["杂合女性即患病","患病父→女儿全患病","无父子直传"],scenario:function(){return{nodes:[mk("I-1","M",0,"mY","F","初始父亲"),mk("I-2","F",0,"NN","F","初始母亲")],marriages:[mar("m1","I-1","I-2",[])],sel:"I-1"};}},
custom_ar:{id:"custom_ar",name:"自定义常隐病",gene:"Custom",mode:"ar",modeLabel:"常染色体隐性遗传",sym:"a",accent:"#2dd4bf",glow:"rgba(45,212,191,0.28)",sick:"#0d9488",desc:"空白常隐模板。",badge:"自定义",clues:["aa患病 Aa携带 AA正常","与性别无关","父母正常后代患病→父母均Aa"],scenario:function(){return{nodes:[mk("I-1","M",0,"Aa","F","初始父亲"),mk("I-2","F",0,"Aa","F","初始母亲")],marriages:[mar("m1","I-1","I-2",[])],sel:"I-2"};}},
custom_ad:{id:"custom_ad",name:"自定义常显病",gene:"Custom",mode:"ad",modeLabel:"常染色体显性遗传",sym:"D",accent:"#fbbf24",glow:"rgba(251,191,36,0.28)",sick:"#d97706",desc:"空白常显模板。",badge:"自定义",clues:["Aa和AA均患病 aa正常","Aa×aa→1/2患病","aa×aa不可能生出患病后代"],scenario:function(){return{nodes:[mk("I-1","M",0,"Aa","F","初始父亲"),mk("I-2","F",0,"aa","F","初始母亲")],marriages:[mar("m1","I-1","I-2",[])],sel:"I-1"};}}
};
function mk(id,sex,gen,gt,role,note){return{id:id,sex:sex,gen:gen,gt:gt,role:role,note:note};}
function mar(id,f,m,ch){return{id:id,f:f,m:m,ch:ch.slice()};}
function isAuto(m){return m==="ar"||m==="ad";}
function dkeys(sex,mode){return isAuto(mode)?["AA","Aa","aa"]:(sex==="M"?["NY","mY"]:["NN","Nm","mm"]);}
function emptyD(sex,mode){var d={};dkeys(sex,mode).forEach(function(k){d[k]=0;});return d;}
function oneD(sex,gt,mode){var d=emptyD(sex,mode);if(d[gt]!==undefined)d[gt]=1;return d;}
function autoAlleles(d){return{n:(d.AA||0)+(d.Aa||0)*0.5,m:(d.aa||0)+(d.Aa||0)*0.5};}
function momAlleles(d){return{n:(d.NN||0)+(d.Nm||0)*0.5,m:(d.mm||0)+(d.Nm||0)*0.5};}
function dadAlleles(d){return{n:d.NY||0,m:d.mY||0};}
function combine(fd,md,sex,mode){
  if(isAuto(mode)){var r=emptyD(sex,mode),fa=autoAlleles(fd),ma=autoAlleles(md);r.AA=fa.n*ma.n;r.Aa=fa.n*ma.m+fa.m*ma.n;r.aa=fa.m*ma.m;return r;}
  var r=emptyD(sex,mode),mo=momAlleles(md),da=dadAlleles(fd);
  if(sex==="M"){r.NY=mo.n;r.mY=mo.m;return r;}
  r.NN=da.n*mo.n;r.Nm=da.n*mo.m+da.m*mo.n;r.mm=da.m*mo.m;return r;
}
function pAffected(d,sex,p){if(p.mode==="ar")return d.aa||0;if(p.mode==="ad")return(d.Aa||0)+(d.AA||0);if(sex==="M")return d.mY||0;if(p.mode==="xld")return(d.Nm||0)+(d.mm||0);return d.mm||0;}
function pCarrier(d,sex,p){if(p.mode==="ar")return d.Aa||0;if(p.mode==="ad")return 0;if(sex!=="F"||p.mode!=="xlr")return 0;return d.Nm||0;}
function fmtGT(gt,sex,p,noHtml){var s=p.sym;var s1=noHtml?"^":"<sup>",s2=noHtml?"":"</sup>";if(isAuto(p.mode)){if(gt==="AA")return"AA";if(gt==="Aa")return"A"+s;return s+s;}if(sex==="M")return gt==="mY"?"X"+s1+s+s2+"Y":"X"+s1+"N"+s2+"Y";if(gt==="NN")return"X"+s1+"N"+s2+"X"+s1+"N"+s2;if(gt==="Nm")return"X"+s1+"N"+s2+"X"+s1+s+s2;return"X"+s1+s+s2+"X"+s1+s+s2;}
function fmtOpt(gt,sex,p){var l=fmtGT(gt,sex,p,true),m=p.mode;if(m==="ar"){if(gt==="AA")return l+" 正常";if(gt==="Aa")return l+" 携带者";return l+" 患病";}if(m==="ad"){if(gt==="aa")return l+" 正常";if(gt==="Aa")return l+" 杂合患病";return l+" 纯合患病";}if(sex==="M")return gt==="mY"?l+" 患病":l+" 正常";if(m==="xlr"){if(gt==="NN")return l+" 正常";if(gt==="Nm")return l+" 携带者";return l+" 患病";}if(gt==="NN")return l+" 正常";if(gt==="Nm")return l+" 杂合患病";return l+" 纯合患病";}
function sample(d,sex,mode){var ks=dkeys(sex,mode),t=0;ks.forEach(function(k){t+=d[k]||0;});if(t<=0)return isAuto(mode)?"AA":(sex==="M"?"NY":"NN");var c=Math.random()*t;for(var i=0;i<ks.length;i++){c-=ks[i]in d?d[ks[i]]:0;if(c<=0)return ks[i];}return ks[ks.length-1];}
function pct(v){return(Math.max(0,Math.min(1,v))*100).toFixed(0)+"%";}
function esc(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function defGT(sex,mode){return isAuto(mode)?"AA":(sex==="M"?"NY":"NN");}

return{
mount:function(container){
if(!container)return;
var sid="ped-"+Math.random().toString(36).slice(2,7);
var listeners=[],st={pid:"color_blindness",nodes:[],marriages:[],sel:"",tx:0,ty:0,sc:1};
container.setAttribute("data-scope",sid);
var sty=document.createElement("style");
sty.textContent='[data-scope="'+sid+'"]{width:100%;height:100%;position:relative;overflow:hidden;color:#f8fafc;background:radial-gradient(circle at 15% 15%,rgba(56,189,248,0.15),transparent 32%),linear-gradient(180deg,#071017,#03070b);font-family:system-ui,sans-serif}'
+'[data-scope="'+sid+'"] canvas{position:absolute;inset:0;width:100%!important;height:100%!important;cursor:grab;touch-action:none}'
+'[data-scope="'+sid+'"] .hud{position:absolute;top:20px;left:24px;z-index:10;pointer-events:none}'
+'[data-scope="'+sid+'"] .hud-k{font-size:11px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;color:rgba(134,239,172,0.7)}'
+'[data-scope="'+sid+'"] .hud-t{font-size:22px;font-weight:900;color:#dcfce7;text-shadow:0 4px 12px rgba(0,0,0,0.3)}'
+'.pnl-'+sid+'{width:100%;height:100%;padding:18px;overflow-y:auto;scrollbar-width:none;display:flex;flex-direction:column;gap:14px;color:#e2e8f0}'
+'.pnl-'+sid+'::-webkit-scrollbar{display:none}'
+'.pnl-'+sid+' .pc{padding:16px;border-radius:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08)}'
+'.pnl-'+sid+' .pe{font-size:10px;letter-spacing:0.2em;text-transform:uppercase;font-weight:900;color:rgba(226,232,240,0.48);margin-bottom:10px}'
+'.pnl-'+sid+' .pt{font-size:18px;font-weight:900;color:#fff;margin-bottom:10px}'
+'.pnl-'+sid+' .pd{font-size:13px;line-height:1.75;color:rgba(226,232,240,0.72)}'
+'.pnl-'+sid+' select{width:100%;appearance:none;border:1px solid rgba(255,255,255,0.1);border-radius:12px;background:rgba(255,255,255,0.05) url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'rgba(255,255,255,0.5)\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E") no-repeat right 12px center/14px;color:#fff;padding:10px 32px 10px 12px;font-size:13px;font-weight:700;outline:none;margin-top:8px;cursor:pointer}'
+'.pnl-'+sid+' select:hover{border-color:rgba(255,255,255,0.2);background-color:rgba(255,255,255,0.08)}'
+'.pnl-'+sid+' select option{background:#0f172a;color:#f8fafc}'
+'.pnl-'+sid+' .sg{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}'
+'.pnl-'+sid+' .sb{appearance:none;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.04);color:#e2e8f0;border-radius:12px;padding:10px;font-size:12px;font-weight:800;text-align:center;cursor:pointer;transition:0.2s}'
+'.pnl-'+sid+' .sb:hover:not(:disabled){transform:translateY(-1px);border-color:rgba(52,211,153,0.3)}'
+'.pnl-'+sid+' .sb:disabled{opacity:0.35;cursor:not-allowed}'
+'.pnl-'+sid+' .sb.ac{background:linear-gradient(135deg,rgba(34,197,94,0.9),rgba(16,185,129,0.84));border-color:rgba(34,197,94,0.24);color:#052e16}'
+'.pnl-'+sid+' .br{display:flex;justify-content:space-between;font-size:13px;color:rgba(226,232,240,0.82);padding:6px 0}'
+'.pnl-'+sid+' .br strong{color:#fff;font-weight:800}'
+'.pnl-'+sid+' .chip{display:inline-flex;padding:4px 10px;border-radius:999px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);font-size:11px;font-weight:700;margin-right:6px;margin-bottom:6px}'
+'.pnl-'+sid+' .ri{padding:10px 12px;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);font-size:12px;line-height:1.7;color:rgba(226,232,240,0.82);margin-bottom:6px}'
+'[data-scope="'+sid+'"] .legend{position:absolute;bottom:0;left:0;right:0;display:flex;align-items:center;justify-content:center;gap:18px;padding:10px 20px;background:linear-gradient(transparent,rgba(3,7,11,0.88));pointer-events:none;flex-wrap:wrap}'
+'[data-scope="'+sid+'"] .legend-item{display:flex;align-items:center;gap:6px;font-size:11px;color:rgba(226,232,240,0.65);font-weight:600;white-space:nowrap}'
+'[data-scope="'+sid+'"] .li-sq{width:14px;height:14px;border-radius:3px;border:2px solid rgba(255,255,255,0.6);flex-shrink:0}'
+'[data-scope="'+sid+'"] .li-ci{width:14px;height:14px;border-radius:50%;border:2px solid rgba(255,255,255,0.6);flex-shrink:0}'
+'[data-scope="'+sid+'"] .li-sq-af{width:14px;height:14px;border-radius:3px;border:2px solid rgba(255,255,255,0.6);background:var(--la,#f97316);flex-shrink:0}'
+'[data-scope="'+sid+'"] .li-sq-ca{width:14px;height:14px;border-radius:3px;border:2px solid rgba(255,255,255,0.6);background:linear-gradient(to top,var(--la,#f97316) 50%,transparent 50%);flex-shrink:0}'
+'[data-scope="'+sid+'"] .li-ci-ca{width:14px;height:14px;border-radius:50%;border:2px solid rgba(255,255,255,0.6);background:linear-gradient(to top,var(--la,#f97316) 50%,transparent 50%);flex-shrink:0}'
+'[data-scope="'+sid+'"] .li-tag{font-size:9px;font-weight:900;padding:1px 4px;border-radius:3px;background:rgba(253,230,138,0.15);color:#fde68a;border:1px solid rgba(253,230,138,0.25)}';
document.head.appendChild(sty);
var panelHost=null,hiddenAside=null,asideRoot=null;
var mainEl=container.closest("main");
if(mainEl){var aside=mainEl.querySelector("[data-courseware-aside='true']");if(aside){hiddenAside=aside.firstElementChild;if(hiddenAside)hiddenAside.style.display="none";asideRoot=document.createElement("div");asideRoot.className="pnl-"+sid;aside.appendChild(asideRoot);panelHost=asideRoot;}}
function pr(){return PRESETS[st.pid]||PRESETS.color_blindness;}
function nmap(){var m={};st.nodes.forEach(function(n){m[n.id]=n;});return m;}
function marOf(id){return st.marriages.find(function(m){return m.f===id||m.m===id;})||null;}
function marByChild(id){return st.marriages.find(function(m){return m.ch.indexOf(id)>=0;})||null;}
function compAll(){var nm=nmap(),cache={},p=pr();function comp(id){if(cache[id])return cache[id];var n=nm[id];if(!n)return emptyD("F",p.mode);if(n.gt){cache[id]=oneD(n.sex,n.gt,p.mode);return cache[id];}var pm=marByChild(id);if(!pm){cache[id]=emptyD(n.sex,p.mode);return cache[id];}cache[id]=combine(comp(pm.f),comp(pm.m),n.sex,p.mode);return cache[id];}st.nodes.forEach(function(n){comp(n.id);});return cache;}
function nextId(gen){var pfx=ROMAN[gen]||(""+(gen+1));var mx=0;st.nodes.forEach(function(n){if(n.gen!==gen)return;var p=n.id.split("-"),v=Number(p[p.length-1]);if(v>mx)mx=v;});return pfx+"-"+(mx+1);}
function nextMarId(){var mx=0;st.marriages.forEach(function(m){var v=Number(m.id.replace(/\D/g,""));if(v>mx)mx=v;});return"m"+(mx+1);}
function addChild(mar,sex,sim){if(!mar)return;var nm=nmap(),fa=nm[mar.f],mo=nm[mar.m];if(!fa||!mo)return;var p=pr(),ds=compAll();var cd=combine(ds[fa.id]||emptyD("M",p.mode),ds[mo.id]||emptyD("F",p.mode),sex,p.mode);var g=Math.max(fa.gen,mo.gen)+1,id=nextId(g);var gt=sim?sample(cd,sex,p.mode):"";st.nodes.push(mk(id,sex,g,gt,sim?"S":"P",sim?"模拟子代":"概率子代"));mar.ch.push(id);st.sel=id;}
function addMate(){var sn=st.nodes.find(function(n){return n.id===st.sel;});if(!sn||marOf(sn.id))return;var sp=sn.sex==="M"?"F":"M",sid2=nextId(sn.gen),p=pr();var spouse=mk(sid2,sp,sn.gen,defGT(sp,p.mode),"F","新增配偶");var m=sn.sex==="M"?mar(nextMarId(),sn.id,sid2,[]):mar(nextMarId(),sid2,sn.id,[]);st.nodes.push(spouse);st.marriages.push(m);}
function loadPreset(pid){var p=PRESETS[pid]||PRESETS.color_blindness;var sc=p.scenario();st.pid=p.id;st.nodes=sc.nodes;st.marriages=sc.marriages;st.sel=sc.sel||"";st.tx=0;st.ty=0;st.sc=1;render(true);}
// Canvas rendering
var canvas=document.createElement("canvas"),ctx=canvas.getContext("2d");
var W=800,H=600,dpr=Math.min(window.devicePixelRatio||1,2);
container.innerHTML='<div class="hud"><div class="hud-k">遗传病模拟沙盒</div><div class="hud-t">家系分析推演</div></div>'
+'<div class="legend" id="'+sid+'-legend">'
+'<div class="legend-item"><div class="li-sq"></div>男性</div>'
+'<div class="legend-item"><div class="li-ci"></div>女性</div>'
+'<div class="legend-item"><div class="li-sq-af" id="'+sid+'-la1"></div>患病</div>'
+'<div class="legend-item"><div class="li-sq-ca" id="'+sid+'-la2"></div>携带者（男）</div>'
+'<div class="legend-item"><div class="li-ci-ca" id="'+sid+'-la3"></div>携带者（女）</div>'
+'<div class="legend-item"><div class="li-sq"></div>正常</div>'
+'<div class="legend-item"><span class="li-tag">P</span>概率推测</div>'
+'<div class="legend-item"><span class="li-tag">SIM</span>随机模拟</div>'
+'</div>';
container.appendChild(canvas);
function resize(){var r=container.getBoundingClientRect();W=r.width;H=r.height;canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}
resize();window.addEventListener("resize",resize);listeners.push(function(){window.removeEventListener("resize",resize);});
function layout(){
  var nm=nmap(),lm={},mxR=0,mxB=0;
  var CG=NS+16,SIB=NS+28,MIN_GAP=24;
  var gens={};
  st.nodes.forEach(function(n){if(!gens[n.gen])gens[n.gen]=[];gens[n.gen].push(n);});
  var maxGen=st.nodes.reduce(function(mx,n){return Math.max(mx,n.gen);},0);
  function spouseMarOf(id){return st.marriages.find(function(m){return m.f===id||m.m===id;})||null;}

  // Helper: get all nodes in a subtree below a marriage
  function subtreeNodes(marId){
    var result=[];
    var m=st.marriages.find(function(mm){return mm.id===marId;});
    if(!m)return result;
    m.ch.forEach(function(cid){
      result.push(cid);
      var cm=spouseMarOf(cid);
      if(cm){
        var sp=cm.f===cid?cm.m:cm.f;
        result.push(sp);
        result=result.concat(subtreeNodes(cm.id));
      }
    });
    return result;
  }

  // Helper: shift a marriage and all its descendants by dx
  function shiftSubtree(marId,dx){
    var nodes=subtreeNodes(marId);
    var m=st.marriages.find(function(mm){return mm.id===marId;});
    if(m){
      if(lm[m.f])lm[m.f].x+=dx;
      if(lm[m.m])lm[m.m].x+=dx;
    }
    nodes.forEach(function(nid){if(lm[nid])lm[nid].x+=dx;});
  }

  var placed={};

  for(var g=0;g<=maxGen;g++){
    var cy=PY+g*GG;

    if(g===0){
      var cx0=PX;
      st.marriages.forEach(function(m){
        var fa=nm[m.f],mo=nm[m.m];
        if(!fa||!mo||fa.gen!==0||mo.gen!==0||placed[m.f])return;
        lm[m.f]={x:cx0,y:cy};lm[m.m]={x:cx0+CG,y:cy};
        placed[m.f]=placed[m.m]=true;cx0+=CG+SIB*2;
      });
      (gens[0]||[]).forEach(function(n){
        if(placed[n.id])return;lm[n.id]={x:cx0,y:cy};placed[n.id]=true;cx0+=SIB;
      });
    } else {
      var parentMars=st.marriages.filter(function(m){
        return m.ch.some(function(cid){var cn=nm[cid];return cn&&cn.gen===g;});
      }).sort(function(a,b){
        var ax=lm[a.f]&&lm[a.m]?(lm[a.f].x+lm[a.m].x)/2:0;
        var bx=lm[b.f]&&lm[b.m]?(lm[b.f].x+lm[b.m].x)/2:0;
        return ax-bx;
      });

      var prevRightEdge=-Infinity;

      parentMars.forEach(function(pm){
        var kids=pm.ch.filter(function(cid){
          var cn=nm[cid];return cn&&cn.gen===g&&!placed[cid];
        }).sort(function(a,b){return a.localeCompare(b,undefined,{numeric:true});});
        if(!kids.length)return;

        var slots=[];
        kids.forEach(function(kid){
          if(placed[kid])return;
          var sm=spouseMarOf(kid),spId=null;
          if(sm){var s2=sm.f===kid?sm.m:sm.f;if(nm[s2]&&nm[s2].gen===g&&!placed[s2])spId=s2;}
          slots.push({child:kid,spouse:spId});
        });
        if(!slots.length)return;

        var totalW=0;
        slots.forEach(function(s,i){if(i>0)totalW+=SIB;totalW+=s.spouse?CG:0;});

        var fp=lm[pm.f],mp=lm[pm.m];
        var parentCX=fp&&mp?(fp.x+mp.x)/2:PX;
        var idealStart=parentCX-totalW/2;
        var startX=Math.max(idealStart,prevRightEdge+MIN_GAP);
        var ux=startX;

        slots.forEach(function(s,i){
          if(i>0)ux+=SIB;
          var kn=nm[s.child];
          if(s.spouse){
            if(kn.sex==='M'){lm[s.child]={x:ux,y:cy};lm[s.spouse]={x:ux+CG,y:cy};}
            else{lm[s.spouse]={x:ux,y:cy};lm[s.child]={x:ux+CG,y:cy};}
            placed[s.child]=placed[s.spouse]=true;ux+=CG;
          }else{lm[s.child]={x:ux,y:cy};placed[s.child]=true;}
        });

        prevRightEdge=ux+NS/2;

        // If children were pushed right, shift entire parent subtree to keep centered
        if(startX>idealStart+1){
          var childrenCX=startX+totalW/2;
          var shift=childrenCX-parentCX;
          if(shift>0){
            // Shift this couple and all its ancestors' subtree
            if(fp)fp.x+=shift;
            if(mp)mp.x+=shift;
          }
        }
      });

      // Remaining unplaced
      var cx1=PX;
      (gens[g]||[]).forEach(function(n){if(lm[n.id])cx1=Math.max(cx1,lm[n.id].x+SIB);});
      (gens[g]||[]).forEach(function(n){
        if(placed[n.id])return;
        lm[n.id]={x:cx1,y:cy};placed[n.id]=true;cx1+=SIB;
      });
    }
  }

  // === FIX OVERLAPS at each generation ===
  for(var iter=0;iter<3;iter++){
    for(var g2=0;g2<=maxGen;g2++){
      var nodesAtG=(gens[g2]||[]).filter(function(n){return lm[n.id];})
        .sort(function(a,b){return lm[a.id].x-lm[b.id].x;});
      for(var i=1;i<nodesAtG.length;i++){
        var prev=lm[nodesAtG[i-1].id], curr=lm[nodesAtG[i].id];
        var gap=curr.x-prev.x;
        var minDist=NS+MIN_GAP;
        // If they're a couple, allow smaller gap
        var areCpl=st.marriages.some(function(m){
          return(m.f===nodesAtG[i-1].id&&m.m===nodesAtG[i].id)||(m.m===nodesAtG[i-1].id&&m.f===nodesAtG[i].id);
        });
        if(areCpl)minDist=CG;
        if(gap<minDist){
          var pushR=minDist-gap;
          // Push this node and all nodes to its right
          for(var j=i;j<nodesAtG.length;j++){
            lm[nodesAtG[j].id].x+=pushR;
          }
        }
      }
    }

    // Re-center each couple above their children
    for(var g3=maxGen;g3>=0;g3--){
      st.marriages.forEach(function(m){
        var fp=lm[m.f],mp=lm[m.m];
        if(!fp||!mp)return;
        var kids=m.ch.filter(function(cid){return lm[cid];});
        if(!kids.length)return;
        var xs=kids.map(function(cid){return lm[cid].x;});
        var childMid=(Math.min.apply(null,xs)+Math.max.apply(null,xs))/2;
        var coupleMid=(fp.x+mp.x)/2;
        var dx=childMid-coupleMid;
        if(Math.abs(dx)>2){fp.x+=dx;mp.x+=dx;}
      });
    }
  }

  // Ensure no negative x
  var minX=Infinity;
  st.nodes.forEach(function(n){if(lm[n.id])minX=Math.min(minX,lm[n.id].x);});
  if(minX<PX){var ox=PX-minX;st.nodes.forEach(function(n){if(lm[n.id])lm[n.id].x+=ox;});}

  // Bounds
  mxR=0;mxB=0;
  st.nodes.forEach(function(n){
    if(lm[n.id]){mxR=Math.max(mxR,lm[n.id].x+NS+PX);mxB=Math.max(mxB,lm[n.id].y+NS+PY);}
  });
  return{lm:lm,w:Math.max(mxR,PX*2),h:Math.max(mxB,PY*2)};
}
function drawTree(ds){ctx.clearRect(0,0,W,H);ctx.save();ctx.translate(st.tx+W/2,st.ty+H/2);ctx.scale(st.sc,st.sc);
var lo=layout(),lm=lo.lm,p=pr();
var ox=lo.w/2,oy=lo.h/2;ctx.translate(-ox,-oy);
// Grid
ctx.strokeStyle="rgba(255,255,255,0.04)";ctx.lineWidth=1;
for(var gx=0;gx<lo.w;gx+=44){ctx.beginPath();ctx.moveTo(gx,0);ctx.lineTo(gx,lo.h);ctx.stroke();}
for(var gy=0;gy<lo.h;gy+=44){ctx.beginPath();ctx.moveTo(0,gy);ctx.lineTo(lo.w,gy);ctx.stroke();}
// Marriage & descent lines
ctx.strokeStyle="rgba(241,245,249,0.45)";ctx.lineWidth=2.5;ctx.lineCap="round";
st.marriages.forEach(function(m){
  var fp=lm[m.f],mp=lm[m.m];if(!fp||!mp)return;
  // 1. Marriage bar: horizontal line between the two spouses at their node bottom
  var barY=fp.y+NS/2+10;
  var leftX=Math.min(fp.x,mp.x), rightX=Math.max(fp.x,mp.x);
  var mcx=(fp.x+mp.x)/2;
  ctx.beginPath();ctx.moveTo(leftX,barY);ctx.lineTo(rightX,barY);ctx.stroke();
  // 2. Descent to children - use ONLY actual child node positions (not spouses)
  var childIds=m.ch;
  var childXs=childIds.map(function(cid){var pos=lm[cid];return pos?pos.x:null;}).filter(function(x){return x!==null;});
  if(!childXs.length)return;
  var dropY=barY+28;
  // Vertical from marriage midpoint down to sibling level
  ctx.beginPath();ctx.moveTo(mcx,barY);ctx.lineTo(mcx,dropY);ctx.stroke();
  // Horizontal sibling bar (only between actual siblings)
  var minCX=Math.min.apply(null,childXs), maxCX=Math.max.apply(null,childXs);
  if(minCX<maxCX){ctx.beginPath();ctx.moveTo(minCX,dropY);ctx.lineTo(maxCX,dropY);ctx.stroke();}
  // Vertical drop from sibling bar to each child node top
  childIds.forEach(function(cid){var pos=lm[cid];if(!pos)return;ctx.beginPath();ctx.moveTo(pos.x,dropY);ctx.lineTo(pos.x,pos.y-NS/2-5);ctx.stroke();});
});
// Nodes
st.nodes.forEach(function(n){var pos=lm[n.id];if(!pos)return;var d=ds[n.id]||emptyD(n.sex,p.mode);var aff=pAffected(d,n.sex,p),car=pCarrier(d,n.sex,p);var sel=n.id===st.sel,r=NS/2;
ctx.save();ctx.translate(pos.x,pos.y);
// Selection ring
if(sel){ctx.shadowColor=p.accent;ctx.shadowBlur=20;ctx.beginPath();if(n.sex==="M"){ctx.rect(-r-6,-r-6,NS+12,NS+12);}else{ctx.arc(0,0,r+6,0,Math.PI*2);}ctx.strokeStyle=p.accent;ctx.lineWidth=2;ctx.stroke();ctx.shadowBlur=0;}
// Shape
ctx.beginPath();
if(n.sex==="M"){ctx.rect(-r,-r,NS,NS);}else{ctx.arc(0,0,r,0,Math.PI*2);}
ctx.fillStyle="rgba(10,16,22,0.92)";ctx.fill();ctx.strokeStyle=sel?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.55)";ctx.lineWidth=2.5;ctx.stroke();
// Affected fill (full) or Carrier fill (bottom half) - standard pedigree convention
if(aff>0.001){
  ctx.save();ctx.beginPath();if(n.sex==="M"){ctx.rect(-r,-r,NS,NS);}else{ctx.arc(0,0,r,0,Math.PI*2);}ctx.clip();
  var ah=NS*aff;ctx.fillStyle=p.sick;ctx.globalAlpha=0.85;ctx.fillRect(-r,r-ah,NS,ah);ctx.globalAlpha=1;ctx.restore();
}else if(car>0.01){
  // Half-fill (bottom half) for carrier - international pedigree standard
  ctx.save();ctx.beginPath();if(n.sex==="M"){ctx.rect(-r,-r,NS,NS);}else{ctx.arc(0,0,r,0,Math.PI*2);}ctx.clip();
  ctx.fillStyle=p.accent;ctx.globalAlpha=0.55+car*0.3;ctx.fillRect(-r,0,NS,NS);ctx.globalAlpha=1;ctx.restore();
}
// ID label
ctx.fillStyle="#fff";ctx.font="bold 12px system-ui";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(n.id,0,-4);
// Status
var status=aff>=0.99?"患病":(car>=0.99?"携带者":(aff>0||car>0?"风险":"正常"));
ctx.font="bold 10px system-ui";ctx.fillStyle="rgba(255,255,255,0.7)";ctx.fillText(status,0,10);
// Role tag
if(n.role==="S"||n.role==="P"){ctx.font="bold 8px system-ui";ctx.fillStyle=n.role==="S"?"#fde68a":"#bae6fd";ctx.fillText(n.role==="S"?"SIM":"P",r-6,-r+6);}
// Note below
if(n.note){ctx.font="11px system-ui";ctx.fillStyle="rgba(226,232,240,0.5)";ctx.fillText(n.note,0,r+14);}
ctx.restore();});
ctx.restore();}
function renderPanel(ds){if(!panelHost)return;var p=pr(),sn=st.nodes.find(function(n){return n.id===st.sel;}),m=sn?marOf(sn.id):null;
var opts=Object.keys(PRESETS).map(function(k){var pp=PRESETS[k];return'<option value="'+pp.id+'"'+(st.pid===pp.id?' selected':'')+'>'+esc(pp.name)+" ("+esc(pp.modeLabel)+')</option>';}).join("");
var h='<div class="pc"><div class="pe">遗传病模拟沙盒</div><div class="pt">家系分析推演</div>'
+'<div class="chip">'+esc(p.badge)+'</div><div class="chip">'+esc(p.modeLabel)+'</div>'
+'<div class="pd">'+esc(p.desc)+'</div>'
+'<select data-role="preset">'+opts+'</select></div>';
// Selection info
if(sn){var d=ds[sn.id]||emptyD(sn.sex,p.mode);var aff=pAffected(d,sn.sex,p),car=pCarrier(d,sn.sex,p),healthy=Math.max(0,1-aff-car);
var entries=dkeys(sn.sex,p.mode).map(function(k){return[k,d[k]||0];}).filter(function(e){return e[1]>0.001;}).sort(function(a,b){return b[1]-a[1];});
var topGT=entries.length?fmtGT(entries[0][0],sn.sex,p):"--";
h+='<div class="pc"><div class="pe">个体分析</div><div class="pt">'+esc(sn.id)+" · "+(sn.sex==="M"?"男性":"女性")+'</div>'
+'<div class="chip">'+(sn.role==="F"?"已知个体":sn.role==="S"?"模拟子代":"概率子代")+'</div>'
+'<div class="chip">第'+(sn.gen+1)+'代</div>'
+'<div class="br"><span>患病概率</span><strong>'+pct(aff)+'</strong></div>'
+'<div class="br"><span>携带概率</span><strong>'+pct(car)+'</strong></div>'
+'<div class="br"><span>健康概率</span><strong>'+pct(healthy)+'</strong></div>'
+'<div class="br"><span>最可能基因型</span><strong>'+topGT+'</strong></div>';
if(sn.role==="F"){h+='<select data-role="genotype">';dkeys(sn.sex,p.mode).forEach(function(k){h+='<option value="'+k+'"'+(sn.gt===k?' selected':'')+'>'+esc(fmtOpt(k,sn.sex,p))+'</option>';});h+='</select>';}
entries.forEach(function(e){h+='<div class="br"><span>'+fmtGT(e[0],sn.sex,p)+'</span><strong>'+pct(e[1])+'</strong></div>';});
h+='</div>';}else{h+='<div class="pc"><div class="pe">个体分析</div><div class="pd">点击家系图中的个体查看遗传信息。</div></div>';}
// Actions
var canMate=sn&&!m;
h+='<div class="pc"><div class="pe">操作</div><div class="sg">'
+'<button class="sb" data-act="mate"'+(canMate?'':' disabled')+'>添加配偶</button>'
+'<button class="sb" data-act="son"'+(m?'':' disabled')+'>添加儿子</button>'
+'<button class="sb" data-act="daughter"'+(m?'':' disabled')+'>添加女儿</button>'
+'<button class="sb" data-act="sim1"'+(m?'':' disabled')+'>随机模拟1个</button>'
+'<button class="sb" data-act="sim4"'+(m?'':' disabled')+'>批量模拟4个</button>'
+'<button class="sb" data-act="reset">重置病例</button>'
+'</div></div>';
// Clues
h+='<div class="pc"><div class="pe">判读线索</div>';
p.clues.forEach(function(c){h+='<div class="ri">'+esc(c)+'</div>';});
h+='</div>';
panelHost.innerHTML=h;}
function render(fit){var ds=compAll();var p2=pr();container.style.setProperty('--la',p2.sick);drawTree(ds);renderPanel(ds);if(fit){st.tx=0;st.ty=0;st.sc=Math.min(1,Math.min(W/(layout().w+60),H/(layout().h+60)));}}
// Events
function onClick(e){var act=e.target.closest("[data-act]");if(act){var a=act.getAttribute("data-act");if(a==="mate"){addMate();render();}
else if(a==="son"){var m2=marOf(st.sel);addChild(m2,"M",false);render();}
else if(a==="daughter"){var m3=marOf(st.sel);addChild(m3,"F",false);render();}
else if(a==="sim1"){var m4=marOf(st.sel);addChild(m4,Math.random()>0.5?"M":"F",true);render();}
else if(a==="sim4"){var m5=marOf(st.sel);for(var i=0;i<4;i++)addChild(m5,Math.random()>0.5?"M":"F",true);render();}
else if(a==="reset"){loadPreset(st.pid);}
return;}
}
function onChange(e){var t=e.target;if(t.getAttribute&&t.getAttribute("data-role")==="preset"){loadPreset(t.value);return;}
if(t.getAttribute&&t.getAttribute("data-role")==="genotype"){var sn=st.nodes.find(function(n){return n.id===st.sel;});if(sn&&sn.role==="F"){sn.gt=t.value;render();}}}
if(panelHost){panelHost.addEventListener("click",onClick);panelHost.addEventListener("change",onChange);listeners.push(function(){panelHost.removeEventListener("click",onClick);panelHost.removeEventListener("change",onChange);});}
function selectAt(clientX,clientY){var rect=canvas.getBoundingClientRect();var mx=(clientX-rect.left-st.tx-W/2)/st.sc,my=(clientY-rect.top-st.ty-H/2)/st.sc;
var lo=layout(),ox=lo.w/2,oy=lo.h/2;mx+=ox;my+=oy;
var hit=null;st.nodes.forEach(function(n){var pos=lo.lm[n.id];if(!pos)return;var dx=mx-pos.x,dy=my-pos.y;if(Math.abs(dx)<NS/2+4&&Math.abs(dy)<NS/2+4)hit=n.id;});
if(hit){st.sel=hit;}else{st.sel="";}render();}
// Pan
var drag=null;
var skipClick=false;
function startDrag(e){if(e.button!=null&&e.button!==0)return;if(e.preventDefault)e.preventDefault();drag={sx:e.clientX,sy:e.clientY,ox:st.tx,oy:st.ty,moved:false,pid:e.pointerId};if(canvas.setPointerCapture&&e.pointerId!=null){try{canvas.setPointerCapture(e.pointerId);}catch(err){}}canvas.style.cursor="grabbing";}
function moveDrag(e){if(!drag)return;var dx=e.clientX-drag.sx,dy=e.clientY-drag.sy;if(Math.abs(dx)>6||Math.abs(dy)>6)drag.moved=true;st.tx=drag.ox+dx;st.ty=drag.oy+dy;var ds=compAll();drawTree(ds);}
function endDrag(e){if(!drag)return;var d=drag;drag=null;if(canvas.releasePointerCapture&&e&&e.pointerId!=null){try{canvas.releasePointerCapture(e.pointerId);}catch(err){}}canvas.style.cursor="grab";skipClick=true;setTimeout(function(){skipClick=false;},0);if(!d.moved&&e&&e.clientX!=null)selectAt(e.clientX,e.clientY);}
canvas.addEventListener("click",function(e){if(skipClick){skipClick=false;return;}selectAt(e.clientX,e.clientY);});
if(window.PointerEvent){canvas.addEventListener("pointerdown",startDrag);canvas.addEventListener("pointermove",moveDrag);canvas.addEventListener("pointerup",endDrag);canvas.addEventListener("pointercancel",endDrag);listeners.push(function(){canvas.removeEventListener("pointerdown",startDrag);canvas.removeEventListener("pointermove",moveDrag);canvas.removeEventListener("pointerup",endDrag);canvas.removeEventListener("pointercancel",endDrag);});}
else{var touchStart=function(e){var t=e.touches&&e.touches[0];if(t)startDrag({clientX:t.clientX,clientY:t.clientY,preventDefault:function(){e.preventDefault();}});};var touchMove=function(e){var t=e.touches&&e.touches[0];if(t)moveDrag({clientX:t.clientX,clientY:t.clientY});};var touchEnd=function(e){var t=e.changedTouches&&e.changedTouches[0];endDrag(t?{clientX:t.clientX,clientY:t.clientY}:null);};canvas.addEventListener("mousedown",startDrag);window.addEventListener("mousemove",moveDrag);window.addEventListener("mouseup",endDrag);canvas.addEventListener("touchstart",touchStart,{passive:false});canvas.addEventListener("touchmove",touchMove,{passive:false});canvas.addEventListener("touchend",touchEnd);listeners.push(function(){canvas.removeEventListener("mousedown",startDrag);window.removeEventListener("mousemove",moveDrag);window.removeEventListener("mouseup",endDrag);canvas.removeEventListener("touchstart",touchStart);canvas.removeEventListener("touchmove",touchMove);canvas.removeEventListener("touchend",touchEnd);});}
// Wheel zoom
canvas.addEventListener("wheel",function(e){e.preventDefault();var d=e.deltaY<0?0.08:-0.08;st.sc=Math.max(0.3,Math.min(2.5,st.sc+d));var ds=compAll();drawTree(ds);},{passive:false});
// ResizeObserver
var ro=typeof ResizeObserver==="function"?new ResizeObserver(function(){resize();render();}):null;
if(ro)ro.observe(container);
loadPreset("color_blindness");
container.__bioSceneCleanup=function(){if(ro)ro.disconnect();listeners.forEach(function(f){f();});if(sty.parentNode)sty.parentNode.removeChild(sty);if(asideRoot&&asideRoot.parentNode)asideRoot.parentNode.removeChild(asideRoot);if(hiddenAside)hiddenAside.style.display="";};
},
unmount:function(container){if(container&&container.__bioSceneCleanup){container.__bioSceneCleanup();delete container.__bioSceneCleanup;}if(container)container.innerHTML="";}
};})();
