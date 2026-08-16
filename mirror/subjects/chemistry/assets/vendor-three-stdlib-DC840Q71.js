import{y as Fn,n as _n,ao as kn,Q as bn,D as Hn,g as le,ap as un,aq as vn,O as qt,P as $t,ar as ct,as as ut,h as Re,at as Zn,au as Gn,av as An,H as Ve,F as ft,aw as vt,u as kt,f as jn,ax as Wn,I as Yn,an as hn,ay as rn,az as ht,aA as Xn,r as sn,q as Un,l as fn,aB as dn,w as _t,aC as Vn,p as Kn,z as qn}from"./vendor-three-core-BuStaZkr.js?v=ca9126df65f1";const Ht=parseInt(Fn.replace(/\D+/g,"")),xn=Ht>=125?"uv1":"uv2";var Le=Uint8Array,Ke=Uint16Array,an=Uint32Array,In=new Le([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0,0]),Tn=new Le([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,0,0]),$n=new Le([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]),Mn=function(v,i){for(var o=new Ke(31),n=0;n<31;++n)o[n]=i+=1<<v[n-1];for(var u=new an(o[30]),n=1;n<30;++n)for(var p=o[n];p<o[n+1];++p)u[p]=p-o[n]<<5|n;return[o,u]},Dn=Mn(In,2),On=Dn[0],Qn=Dn[1];On[28]=258,Qn[258]=28;var Jn=Mn(Tn,0),er=Jn[0],on=new Ke(32768);for(var te=0;te<32768;++te){var Xe=(te&43690)>>>1|(te&21845)<<1;Xe=(Xe&52428)>>>2|(Xe&13107)<<2,Xe=(Xe&61680)>>>4|(Xe&3855)<<4,on[te]=((Xe&65280)>>>8|(Xe&255)<<8)>>>1}var yt=function(v,i,o){for(var n=v.length,u=0,p=new Ke(i);u<n;++u)++p[v[u]-1];var x=new Ke(i);for(u=0;u<i;++u)x[u]=x[u-1]+p[u-1]<<1;var _;if(o){_=new Ke(1<<i);var y=15-i;for(u=0;u<n;++u)if(v[u])for(var C=u<<4|v[u],D=i-v[u],L=x[v[u]-1]++<<D,Z=L|(1<<D)-1;L<=Z;++L)_[on[L]>>>y]=C}else for(_=new Ke(n),u=0;u<n;++u)v[u]&&(_[u]=on[x[v[u]-1]++]>>>15-v[u]);return _},bt=new Le(288);for(var te=0;te<144;++te)bt[te]=8;for(var te=144;te<256;++te)bt[te]=9;for(var te=256;te<280;++te)bt[te]=7;for(var te=280;te<288;++te)bt[te]=8;var Cn=new Le(32);for(var te=0;te<32;++te)Cn[te]=5;var tr=yt(bt,9,1),nr=yt(Cn,5,1),Qt=function(v){for(var i=v[0],o=1;o<v.length;++o)v[o]>i&&(i=v[o]);return i},Fe=function(v,i,o){var n=i/8|0;return(v[n]|v[n+1]<<8)>>(i&7)&o},Jt=function(v,i){var o=i/8|0;return(v[o]|v[o+1]<<8|v[o+2]<<16)>>(i&7)},rr=function(v){return(v/8|0)+(v&7&&1)},ir=function(v,i,o){(o==null||o>v.length)&&(o=v.length);var n=new(v instanceof Ke?Ke:v instanceof an?an:Le)(o-i);return n.set(v.subarray(i,o)),n},ar=function(v,i,o){var n=v.length;if(!n||o&&!o.l&&n<5)return i||new Le(0);var u=!i||o,p=!o||o.i;o||(o={}),i||(i=new Le(n*3));var x=function(W){var Ne=i.length;if(W>Ne){var Pe=new Le(Math.max(Ne*2,W));Pe.set(i),i=Pe}},_=o.f||0,y=o.p||0,C=o.b||0,D=o.l,L=o.d,Z=o.m,ce=o.n,fe=n*8;do{if(!D){o.f=_=Fe(v,y,1);var ue=Fe(v,y+1,3);if(y+=3,ue)if(ue==1)D=tr,L=nr,Z=9,ce=5;else if(ue==2){var oe=Fe(v,y,31)+257,re=Fe(v,y+10,15)+4,Ae=oe+Fe(v,y+5,31)+1;y+=14;for(var we=new Le(Ae),Ue=new Le(19),b=0;b<re;++b)Ue[$n[b]]=Fe(v,y+b*3,7);y+=re*3;for(var z=Qt(Ue),U=(1<<z)-1,G=yt(Ue,z,1),b=0;b<Ae;){var k=G[Fe(v,y,U)];y+=k&15;var X=k>>>4;if(X<16)we[b++]=X;else{var P=0,O=0;for(X==16?(O=3+Fe(v,y,3),y+=2,P=we[b-1]):X==17?(O=3+Fe(v,y,7),y+=3):X==18&&(O=11+Fe(v,y,127),y+=7);O--;)we[b++]=P}}var V=we.subarray(0,oe),N=we.subarray(oe);Z=Qt(V),ce=Qt(N),D=yt(V,Z,1),L=yt(N,ce,1)}else throw"invalid block type";else{var X=rr(y)+4,ae=v[X-4]|v[X-3]<<8,de=X+ae;if(de>n){if(p)throw"unexpected EOF";break}u&&x(C+ae),i.set(v.subarray(X,de),C),o.b=C+=ae,o.p=y=de*8;continue}if(y>fe){if(p)throw"unexpected EOF";break}}u&&x(C+131072);for(var xe=(1<<Z)-1,Ie=(1<<ce)-1,ye=y;;ye=y){var P=D[Jt(v,y)&xe],j=P>>>4;if(y+=P&15,y>fe){if(p)throw"unexpected EOF";break}if(!P)throw"invalid length/literal";if(j<256)i[C++]=j;else if(j==256){ye=y,D=null;break}else{var De=j-254;if(j>264){var b=j-257,K=In[b];De=Fe(v,y,(1<<K)-1)+On[b],y+=K}var se=L[Jt(v,y)&Ie],Te=se>>>4;if(!se)throw"invalid distance";y+=se&15;var N=er[Te];if(Te>3){var K=Tn[Te];N+=Jt(v,y)&(1<<K)-1,y+=K}if(y>fe){if(p)throw"unexpected EOF";break}u&&x(C+131072);for(var qe=C+De;C<qe;C+=4)i[C]=i[C-N],i[C+1]=i[C+1-N],i[C+2]=i[C+2-N],i[C+3]=i[C+3-N];C=qe}}o.l=D,o.p=ye,o.b=C,D&&(_=1,o.m=Z,o.d=L,o.n=ce)}while(!_);return C==i.length?i:ir(i,0,C)},or=new Le(0),sr=function(v){if((v[0]&15)!=8||v[0]>>>4>7||(v[0]<<8|v[1])%31)throw"invalid zlib data";if(v[1]&32)throw"invalid zlib data: preset dictionaries not supported"};function Nt(v,i){return ar((sr(v),v.subarray(2,-4)),i)}var lr=typeof TextDecoder<"u"&&new TextDecoder,cr=0;try{lr.decode(or,{stream:!0}),cr=1}catch{}const ur=v=>v&&v.isCubeTexture;class br extends _n{constructor(i,o){var n,u;const p=ur(i),_=((u=p?(n=i.image[0])==null?void 0:n.width:i.image.width)!=null?u:1024)/4,y=Math.floor(Math.log2(_)),C=Math.pow(2,y),D=3*Math.max(C,16*7),L=4*C,Z=[p?"#define ENVMAP_TYPE_CUBE":"",`#define CUBEUV_TEXEL_WIDTH ${1/D}`,`#define CUBEUV_TEXEL_HEIGHT ${1/L}`,`#define CUBEUV_MAX_MIP ${y}.0`],ce=`
        varying vec3 vWorldPosition;
        void main() 
        {
            vec4 worldPosition = ( modelMatrix * vec4( position, 1.0 ) );
            vWorldPosition = worldPosition.xyz;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
        `,fe=Z.join(`
`)+`
        #define ENVMAP_TYPE_CUBE_UV
        varying vec3 vWorldPosition;
        uniform float radius;
        uniform float height;
        uniform float angle;
        #ifdef ENVMAP_TYPE_CUBE
            uniform samplerCube map;
        #else
            uniform sampler2D map;
        #endif
        // From: https://www.shadertoy.com/view/4tsBD7
        float diskIntersectWithBackFaceCulling( vec3 ro, vec3 rd, vec3 c, vec3 n, float r ) 
        {
            float d = dot ( rd, n );
            
            if( d > 0.0 ) { return 1e6; }
            
            vec3  o = ro - c;
            float t = - dot( n, o ) / d;
            vec3  q = o + rd * t;
            
            return ( dot( q, q ) < r * r ) ? t : 1e6;
        }
        // From: https://www.iquilezles.org/www/articles/intersectors/intersectors.htm
        float sphereIntersect( vec3 ro, vec3 rd, vec3 ce, float ra ) 
        {
            vec3 oc = ro - ce;
            float b = dot( oc, rd );
            float c = dot( oc, oc ) - ra * ra;
            float h = b * b - c;
            
            if( h < 0.0 ) { return -1.0; }
            
            h = sqrt( h );
            
            return - b + h;
        }
        vec3 project() 
        {
            vec3 p = normalize( vWorldPosition );
            vec3 camPos = cameraPosition;
            camPos.y -= height;
            float intersection = sphereIntersect( camPos, p, vec3( 0.0 ), radius );
            if( intersection > 0.0 ) {
                
                vec3 h = vec3( 0.0, - height, 0.0 );
                float intersection2 = diskIntersectWithBackFaceCulling( camPos, p, h, vec3( 0.0, 1.0, 0.0 ), radius );
                p = ( camPos + min( intersection, intersection2 ) * p ) / radius;
            } else {
                p = vec3( 0.0, 1.0, 0.0 );
            }
            return p;
        }
        #include <common>
        #include <cube_uv_reflection_fragment>
        void main() 
        {
            vec3 projectedWorldPosition = project();
            
            #ifdef ENVMAP_TYPE_CUBE
                vec3 outcolor = textureCube( map, projectedWorldPosition ).rgb;
            #else
                vec3 direction = normalize( projectedWorldPosition );
                vec2 uv = equirectUv( direction );
                vec3 outcolor = texture2D( map, uv ).rgb;
            #endif
            gl_FragColor = vec4( outcolor, 1.0 );
            #include <tonemapping_fragment>
            #include <${Ht>=154?"colorspace_fragment":"encodings_fragment"}>
        }
        `,ue={map:{value:i},height:{value:(o==null?void 0:o.height)||15},radius:{value:(o==null?void 0:o.radius)||100}},X=new kn(1,16),ae=new bn({uniforms:ue,fragmentShader:fe,vertexShader:ce,side:Hn});super(X,ae)}set radius(i){this.material.uniforms.radius.value=i}get radius(){return this.material.uniforms.radius.value}set height(i){this.material.uniforms.height.value=i}get height(){return this.material.uniforms.height.value}}var vr=Object.defineProperty,hr=(v,i,o)=>i in v?vr(v,i,{enumerable:!0,configurable:!0,writable:!0,value:o}):v[i]=o,fr=(v,i,o)=>(hr(v,i+"",o),o);class dr{constructor(){fr(this,"_listeners")}addEventListener(i,o){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[i]===void 0&&(n[i]=[]),n[i].indexOf(o)===-1&&n[i].push(o)}hasEventListener(i,o){if(this._listeners===void 0)return!1;const n=this._listeners;return n[i]!==void 0&&n[i].indexOf(o)!==-1}removeEventListener(i,o){if(this._listeners===void 0)return;const u=this._listeners[i];if(u!==void 0){const p=u.indexOf(o);p!==-1&&u.splice(p,1)}}dispatchEvent(i){if(this._listeners===void 0)return;const n=this._listeners[i.type];if(n!==void 0){i.target=this;const u=n.slice(0);for(let p=0,x=u.length;p<x;p++)u[p].call(this,i);i.target=null}}}var pr=Object.defineProperty,mr=(v,i,o)=>i in v?pr(v,i,{enumerable:!0,configurable:!0,writable:!0,value:o}):v[i]=o,M=(v,i,o)=>(mr(v,typeof i!="symbol"?i+"":i,o),o);const Pt=new Zn,pn=new Gn,gr=Math.cos(70*(Math.PI/180)),mn=(v,i)=>(v%i+i)%i;class Ar extends dr{constructor(i,o){super(),M(this,"object"),M(this,"domElement"),M(this,"enabled",!0),M(this,"target",new le),M(this,"minDistance",0),M(this,"maxDistance",1/0),M(this,"minZoom",0),M(this,"maxZoom",1/0),M(this,"minPolarAngle",0),M(this,"maxPolarAngle",Math.PI),M(this,"minAzimuthAngle",-1/0),M(this,"maxAzimuthAngle",1/0),M(this,"enableDamping",!1),M(this,"dampingFactor",.05),M(this,"enableZoom",!0),M(this,"zoomSpeed",1),M(this,"enableRotate",!0),M(this,"rotateSpeed",1),M(this,"enablePan",!0),M(this,"panSpeed",1),M(this,"screenSpacePanning",!0),M(this,"keyPanSpeed",7),M(this,"zoomToCursor",!1),M(this,"autoRotate",!1),M(this,"autoRotateSpeed",2),M(this,"reverseOrbit",!1),M(this,"reverseHorizontalOrbit",!1),M(this,"reverseVerticalOrbit",!1),M(this,"keys",{LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"}),M(this,"mouseButtons",{LEFT:ct.ROTATE,MIDDLE:ct.DOLLY,RIGHT:ct.PAN}),M(this,"touches",{ONE:ut.ROTATE,TWO:ut.DOLLY_PAN}),M(this,"target0"),M(this,"position0"),M(this,"zoom0"),M(this,"_domElementKeyEvents",null),M(this,"getPolarAngle"),M(this,"getAzimuthalAngle"),M(this,"setPolarAngle"),M(this,"setAzimuthalAngle"),M(this,"getDistance"),M(this,"getZoomScale"),M(this,"listenToKeyEvents"),M(this,"stopListenToKeyEvents"),M(this,"saveState"),M(this,"reset"),M(this,"update"),M(this,"connect"),M(this,"dispose"),M(this,"dollyIn"),M(this,"dollyOut"),M(this,"getScale"),M(this,"setScale"),this.object=i,this.domElement=o,this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this.getPolarAngle=()=>D.phi,this.getAzimuthalAngle=()=>D.theta,this.setPolarAngle=a=>{let f=mn(a,2*Math.PI),A=D.phi;A<0&&(A+=2*Math.PI),f<0&&(f+=2*Math.PI);let H=Math.abs(f-A);2*Math.PI-H<H&&(f<A?f+=2*Math.PI:A+=2*Math.PI),L.phi=f-A,n.update()},this.setAzimuthalAngle=a=>{let f=mn(a,2*Math.PI),A=D.theta;A<0&&(A+=2*Math.PI),f<0&&(f+=2*Math.PI);let H=Math.abs(f-A);2*Math.PI-H<H&&(f<A?f+=2*Math.PI:A+=2*Math.PI),L.theta=f-A,n.update()},this.getDistance=()=>n.object.position.distanceTo(n.target),this.listenToKeyEvents=a=>{a.addEventListener("keydown",at),this._domElementKeyEvents=a},this.stopListenToKeyEvents=()=>{this._domElementKeyEvents.removeEventListener("keydown",at),this._domElementKeyEvents=null},this.saveState=()=>{n.target0.copy(n.target),n.position0.copy(n.object.position),n.zoom0=n.object.zoom},this.reset=()=>{n.target.copy(n.target0),n.object.position.copy(n.position0),n.object.zoom=n.zoom0,n.object.updateProjectionMatrix(),n.dispatchEvent(u),n.update(),y=_.NONE},this.update=(()=>{const a=new le,f=new le(0,1,0),A=new vn().setFromUnitVectors(i.up,f),H=A.clone().invert(),m=new le,_e=new vn,ke=2*Math.PI;return function(){const Rt=n.object.position;A.setFromUnitVectors(i.up,f),H.copy(A).invert(),a.copy(Rt).sub(n.target),a.applyQuaternion(A),D.setFromVector3(a),n.autoRotate&&y===_.NONE&&O(k()),n.enableDamping?(D.theta+=L.theta*n.dampingFactor,D.phi+=L.phi*n.dampingFactor):(D.theta+=L.theta,D.phi+=L.phi);let Be=n.minAzimuthAngle,ze=n.maxAzimuthAngle;isFinite(Be)&&isFinite(ze)&&(Be<-Math.PI?Be+=ke:Be>Math.PI&&(Be-=ke),ze<-Math.PI?ze+=ke:ze>Math.PI&&(ze-=ke),Be<=ze?D.theta=Math.max(Be,Math.min(ze,D.theta)):D.theta=D.theta>(Be+ze)/2?Math.max(Be,D.theta):Math.min(ze,D.theta)),D.phi=Math.max(n.minPolarAngle,Math.min(n.maxPolarAngle,D.phi)),D.makeSafe(),n.enableDamping===!0?n.target.addScaledVector(ce,n.dampingFactor):n.target.add(ce),n.zoomToCursor&&z||n.object.isOrthographicCamera?D.radius=se(D.radius):D.radius=se(D.radius*Z),a.setFromSpherical(D),a.applyQuaternion(H),Rt.copy(n.target).add(a),n.object.matrixAutoUpdate||n.object.updateMatrix(),n.object.lookAt(n.target),n.enableDamping===!0?(L.theta*=1-n.dampingFactor,L.phi*=1-n.dampingFactor,ce.multiplyScalar(1-n.dampingFactor)):(L.set(0,0,0),ce.set(0,0,0));let Je=!1;if(n.zoomToCursor&&z){let et=null;if(n.object instanceof $t&&n.object.isPerspectiveCamera){const tt=a.length();et=se(tt*Z);const lt=tt-et;n.object.position.addScaledVector(Ue,lt),n.object.updateMatrixWorld()}else if(n.object.isOrthographicCamera){const tt=new le(b.x,b.y,0);tt.unproject(n.object),n.object.zoom=Math.max(n.minZoom,Math.min(n.maxZoom,n.object.zoom/Z)),n.object.updateProjectionMatrix(),Je=!0;const lt=new le(b.x,b.y,0);lt.unproject(n.object),n.object.position.sub(lt).add(tt),n.object.updateMatrixWorld(),et=a.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),n.zoomToCursor=!1;et!==null&&(n.screenSpacePanning?n.target.set(0,0,-1).transformDirection(n.object.matrix).multiplyScalar(et).add(n.object.position):(Pt.origin.copy(n.object.position),Pt.direction.set(0,0,-1).transformDirection(n.object.matrix),Math.abs(n.object.up.dot(Pt.direction))<gr?i.lookAt(n.target):(pn.setFromNormalAndCoplanarPoint(n.object.up,n.target),Pt.intersectPlane(pn,n.target))))}else n.object instanceof qt&&n.object.isOrthographicCamera&&(Je=Z!==1,Je&&(n.object.zoom=Math.max(n.minZoom,Math.min(n.maxZoom,n.object.zoom/Z)),n.object.updateProjectionMatrix()));return Z=1,z=!1,Je||m.distanceToSquared(n.object.position)>C||8*(1-_e.dot(n.object.quaternion))>C?(n.dispatchEvent(u),m.copy(n.object.position),_e.copy(n.object.quaternion),Je=!1,!0):!1}})(),this.connect=a=>{n.domElement=a,n.domElement.style.touchAction="none",n.domElement.addEventListener("contextmenu",Ct),n.domElement.addEventListener("pointerdown",Dt),n.domElement.addEventListener("pointercancel",$e),n.domElement.addEventListener("wheel",Ot)},this.dispose=()=>{var a,f,A,H,m,_e;n.domElement&&(n.domElement.style.touchAction="auto"),(a=n.domElement)==null||a.removeEventListener("contextmenu",Ct),(f=n.domElement)==null||f.removeEventListener("pointerdown",Dt),(A=n.domElement)==null||A.removeEventListener("pointercancel",$e),(H=n.domElement)==null||H.removeEventListener("wheel",Ot),(m=n.domElement)==null||m.ownerDocument.removeEventListener("pointermove",it),(_e=n.domElement)==null||_e.ownerDocument.removeEventListener("pointerup",$e),n._domElementKeyEvents!==null&&n._domElementKeyEvents.removeEventListener("keydown",at)};const n=this,u={type:"change"},p={type:"start"},x={type:"end"},_={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6};let y=_.NONE;const C=1e-6,D=new un,L=new un;let Z=1;const ce=new le,fe=new Re,ue=new Re,X=new Re,ae=new Re,de=new Re,oe=new Re,re=new Re,Ae=new Re,we=new Re,Ue=new le,b=new Re;let z=!1;const U=[],G={};function k(){return 2*Math.PI/60/60*n.autoRotateSpeed}function P(){return Math.pow(.95,n.zoomSpeed)}function O(a){n.reverseOrbit||n.reverseHorizontalOrbit?L.theta+=a:L.theta-=a}function V(a){n.reverseOrbit||n.reverseVerticalOrbit?L.phi+=a:L.phi-=a}const N=(()=>{const a=new le;return function(A,H){a.setFromMatrixColumn(H,0),a.multiplyScalar(-A),ce.add(a)}})(),xe=(()=>{const a=new le;return function(A,H){n.screenSpacePanning===!0?a.setFromMatrixColumn(H,1):(a.setFromMatrixColumn(H,0),a.crossVectors(n.object.up,a)),a.multiplyScalar(A),ce.add(a)}})(),Ie=(()=>{const a=new le;return function(A,H){const m=n.domElement;if(m&&n.object instanceof $t&&n.object.isPerspectiveCamera){const _e=n.object.position;a.copy(_e).sub(n.target);let ke=a.length();ke*=Math.tan(n.object.fov/2*Math.PI/180),N(2*A*ke/m.clientHeight,n.object.matrix),xe(2*H*ke/m.clientHeight,n.object.matrix)}else m&&n.object instanceof qt&&n.object.isOrthographicCamera?(N(A*(n.object.right-n.object.left)/n.object.zoom/m.clientWidth,n.object.matrix),xe(H*(n.object.top-n.object.bottom)/n.object.zoom/m.clientHeight,n.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),n.enablePan=!1)}})();function ye(a){n.object instanceof $t&&n.object.isPerspectiveCamera||n.object instanceof qt&&n.object.isOrthographicCamera?Z=a:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),n.enableZoom=!1)}function j(a){ye(Z/a)}function De(a){ye(Z*a)}function K(a){if(!n.zoomToCursor||!n.domElement)return;z=!0;const f=n.domElement.getBoundingClientRect(),A=a.clientX-f.left,H=a.clientY-f.top,m=f.width,_e=f.height;b.x=A/m*2-1,b.y=-(H/_e)*2+1,Ue.set(b.x,b.y,1).unproject(n.object).sub(n.object.position).normalize()}function se(a){return Math.max(n.minDistance,Math.min(n.maxDistance,a))}function Te(a){fe.set(a.clientX,a.clientY)}function qe(a){K(a),re.set(a.clientX,a.clientY)}function W(a){ae.set(a.clientX,a.clientY)}function Ne(a){ue.set(a.clientX,a.clientY),X.subVectors(ue,fe).multiplyScalar(n.rotateSpeed);const f=n.domElement;f&&(O(2*Math.PI*X.x/f.clientHeight),V(2*Math.PI*X.y/f.clientHeight)),fe.copy(ue),n.update()}function Pe(a){Ae.set(a.clientX,a.clientY),we.subVectors(Ae,re),we.y>0?j(P()):we.y<0&&De(P()),re.copy(Ae),n.update()}function Zt(a){de.set(a.clientX,a.clientY),oe.subVectors(de,ae).multiplyScalar(n.panSpeed),Ie(oe.x,oe.y),ae.copy(de),n.update()}function Gt(a){K(a),a.deltaY<0?De(P()):a.deltaY>0&&j(P()),n.update()}function At(a){let f=!1;switch(a.code){case n.keys.UP:Ie(0,n.keyPanSpeed),f=!0;break;case n.keys.BOTTOM:Ie(0,-n.keyPanSpeed),f=!0;break;case n.keys.LEFT:Ie(n.keyPanSpeed,0),f=!0;break;case n.keys.RIGHT:Ie(-n.keyPanSpeed,0),f=!0;break}f&&(a.preventDefault(),n.update())}function Ut(){if(U.length==1)fe.set(U[0].pageX,U[0].pageY);else{const a=.5*(U[0].pageX+U[1].pageX),f=.5*(U[0].pageY+U[1].pageY);fe.set(a,f)}}function dt(){if(U.length==1)ae.set(U[0].pageX,U[0].pageY);else{const a=.5*(U[0].pageX+U[1].pageX),f=.5*(U[0].pageY+U[1].pageY);ae.set(a,f)}}function pt(){const a=U[0].pageX-U[1].pageX,f=U[0].pageY-U[1].pageY,A=Math.sqrt(a*a+f*f);re.set(0,A)}function xt(){n.enableZoom&&pt(),n.enablePan&&dt()}function jt(){n.enableZoom&&pt(),n.enableRotate&&Ut()}function It(a){if(U.length==1)ue.set(a.pageX,a.pageY);else{const A=st(a),H=.5*(a.pageX+A.x),m=.5*(a.pageY+A.y);ue.set(H,m)}X.subVectors(ue,fe).multiplyScalar(n.rotateSpeed);const f=n.domElement;f&&(O(2*Math.PI*X.x/f.clientHeight),V(2*Math.PI*X.y/f.clientHeight)),fe.copy(ue)}function Tt(a){if(U.length==1)de.set(a.pageX,a.pageY);else{const f=st(a),A=.5*(a.pageX+f.x),H=.5*(a.pageY+f.y);de.set(A,H)}oe.subVectors(de,ae).multiplyScalar(n.panSpeed),Ie(oe.x,oe.y),ae.copy(de)}function Mt(a){const f=st(a),A=a.pageX-f.x,H=a.pageY-f.y,m=Math.sqrt(A*A+H*H);Ae.set(0,m),we.set(0,Math.pow(Ae.y/re.y,n.zoomSpeed)),j(we.y),re.copy(Ae)}function Wt(a){n.enableZoom&&Mt(a),n.enablePan&&Tt(a)}function Yt(a){n.enableZoom&&Mt(a),n.enableRotate&&It(a)}function Dt(a){var f,A;n.enabled!==!1&&(U.length===0&&((f=n.domElement)==null||f.ownerDocument.addEventListener("pointermove",it),(A=n.domElement)==null||A.ownerDocument.addEventListener("pointerup",$e)),Kt(a),a.pointerType==="touch"?ot(a):mt(a))}function it(a){n.enabled!==!1&&(a.pointerType==="touch"?Vt(a):Xt(a))}function $e(a){var f,A,H;Qe(a),U.length===0&&((f=n.domElement)==null||f.releasePointerCapture(a.pointerId),(A=n.domElement)==null||A.ownerDocument.removeEventListener("pointermove",it),(H=n.domElement)==null||H.ownerDocument.removeEventListener("pointerup",$e)),n.dispatchEvent(x),y=_.NONE}function mt(a){let f;switch(a.button){case 0:f=n.mouseButtons.LEFT;break;case 1:f=n.mouseButtons.MIDDLE;break;case 2:f=n.mouseButtons.RIGHT;break;default:f=-1}switch(f){case ct.DOLLY:if(n.enableZoom===!1)return;qe(a),y=_.DOLLY;break;case ct.ROTATE:if(a.ctrlKey||a.metaKey||a.shiftKey){if(n.enablePan===!1)return;W(a),y=_.PAN}else{if(n.enableRotate===!1)return;Te(a),y=_.ROTATE}break;case ct.PAN:if(a.ctrlKey||a.metaKey||a.shiftKey){if(n.enableRotate===!1)return;Te(a),y=_.ROTATE}else{if(n.enablePan===!1)return;W(a),y=_.PAN}break;default:y=_.NONE}y!==_.NONE&&n.dispatchEvent(p)}function Xt(a){if(n.enabled!==!1)switch(y){case _.ROTATE:if(n.enableRotate===!1)return;Ne(a);break;case _.DOLLY:if(n.enableZoom===!1)return;Pe(a);break;case _.PAN:if(n.enablePan===!1)return;Zt(a);break}}function Ot(a){n.enabled===!1||n.enableZoom===!1||y!==_.NONE&&y!==_.ROTATE||(a.preventDefault(),n.dispatchEvent(p),Gt(a),n.dispatchEvent(x))}function at(a){n.enabled===!1||n.enablePan===!1||At(a)}function ot(a){switch(pe(a),U.length){case 1:switch(n.touches.ONE){case ut.ROTATE:if(n.enableRotate===!1)return;Ut(),y=_.TOUCH_ROTATE;break;case ut.PAN:if(n.enablePan===!1)return;dt(),y=_.TOUCH_PAN;break;default:y=_.NONE}break;case 2:switch(n.touches.TWO){case ut.DOLLY_PAN:if(n.enableZoom===!1&&n.enablePan===!1)return;xt(),y=_.TOUCH_DOLLY_PAN;break;case ut.DOLLY_ROTATE:if(n.enableZoom===!1&&n.enableRotate===!1)return;jt(),y=_.TOUCH_DOLLY_ROTATE;break;default:y=_.NONE}break;default:y=_.NONE}y!==_.NONE&&n.dispatchEvent(p)}function Vt(a){switch(pe(a),y){case _.TOUCH_ROTATE:if(n.enableRotate===!1)return;It(a),n.update();break;case _.TOUCH_PAN:if(n.enablePan===!1)return;Tt(a),n.update();break;case _.TOUCH_DOLLY_PAN:if(n.enableZoom===!1&&n.enablePan===!1)return;Wt(a),n.update();break;case _.TOUCH_DOLLY_ROTATE:if(n.enableZoom===!1&&n.enableRotate===!1)return;Yt(a),n.update();break;default:y=_.NONE}}function Ct(a){n.enabled!==!1&&a.preventDefault()}function Kt(a){U.push(a)}function Qe(a){delete G[a.pointerId];for(let f=0;f<U.length;f++)if(U[f].pointerId==a.pointerId){U.splice(f,1);return}}function pe(a){let f=G[a.pointerId];f===void 0&&(f=new Re,G[a.pointerId]=f),f.set(a.pageX,a.pageY)}function st(a){const f=a.pointerId===U[0].pointerId?U[1]:U[0];return G[f.pointerId]}this.dollyIn=(a=P())=>{De(a),n.update()},this.dollyOut=(a=P())=>{j(a),n.update()},this.getScale=()=>Z,this.setScale=a=>{ye(a),n.update()},this.getZoomScale=()=>P(),o!==void 0&&this.connect(o),this.update()}}const Ur={uniforms:{tDiffuse:{value:null},h:{value:1/512}},vertexShader:`
      varying vec2 vUv;

      void main() {

        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

      }
  `,fragmentShader:`
    uniform sampler2D tDiffuse;
    uniform float h;

    varying vec2 vUv;

    void main() {

    	vec4 sum = vec4( 0.0 );

    	sum += texture2D( tDiffuse, vec2( vUv.x - 4.0 * h, vUv.y ) ) * 0.051;
    	sum += texture2D( tDiffuse, vec2( vUv.x - 3.0 * h, vUv.y ) ) * 0.0918;
    	sum += texture2D( tDiffuse, vec2( vUv.x - 2.0 * h, vUv.y ) ) * 0.12245;
    	sum += texture2D( tDiffuse, vec2( vUv.x - 1.0 * h, vUv.y ) ) * 0.1531;
    	sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y ) ) * 0.1633;
    	sum += texture2D( tDiffuse, vec2( vUv.x + 1.0 * h, vUv.y ) ) * 0.1531;
    	sum += texture2D( tDiffuse, vec2( vUv.x + 2.0 * h, vUv.y ) ) * 0.12245;
    	sum += texture2D( tDiffuse, vec2( vUv.x + 3.0 * h, vUv.y ) ) * 0.0918;
    	sum += texture2D( tDiffuse, vec2( vUv.x + 4.0 * h, vUv.y ) ) * 0.051;

    	gl_FragColor = sum;

    }
  `},xr={uniforms:{tDiffuse:{value:null},v:{value:1/512}},vertexShader:`
    varying vec2 vUv;

    void main() {

      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    }
  `,fragmentShader:`

  uniform sampler2D tDiffuse;
  uniform float v;

  varying vec2 vUv;

  void main() {

    vec4 sum = vec4( 0.0 );

    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 4.0 * v ) ) * 0.051;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 3.0 * v ) ) * 0.0918;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 2.0 * v ) ) * 0.12245;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 1.0 * v ) ) * 0.1531;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y ) ) * 0.1633;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 1.0 * v ) ) * 0.1531;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 2.0 * v ) ) * 0.12245;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 3.0 * v ) ) * 0.0918;
    sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 4.0 * v ) ) * 0.051;

    gl_FragColor = sum;

  }
  `};class Ir extends An{constructor(i){super(i),this.type=Ve}parse(i){const x=function(b,z){switch(b){case 1:throw new Error("THREE.RGBELoader: Read Error: "+(z||""));case 2:throw new Error("THREE.RGBELoader: Write Error: "+(z||""));case 3:throw new Error("THREE.RGBELoader: Bad File Format: "+(z||""));default:case 4:throw new Error("THREE.RGBELoader: Memory Error: "+(z||""))}},D=`
`,L=function(b,z,U){z=z||1024;let k=b.pos,P=-1,O=0,V="",N=String.fromCharCode.apply(null,new Uint16Array(b.subarray(k,k+128)));for(;0>(P=N.indexOf(D))&&O<z&&k<b.byteLength;)V+=N,O+=N.length,k+=128,N+=String.fromCharCode.apply(null,new Uint16Array(b.subarray(k,k+128)));return-1<P?(b.pos+=O+P+1,V+N.slice(0,P)):!1},Z=function(b){const z=/^#\?(\S+)/,U=/^\s*GAMMA\s*=\s*(\d+(\.\d+)?)\s*$/,G=/^\s*EXPOSURE\s*=\s*(\d+(\.\d+)?)\s*$/,k=/^\s*FORMAT=(\S+)\s*$/,P=/^\s*\-Y\s+(\d+)\s+\+X\s+(\d+)\s*$/,O={valid:0,string:"",comments:"",programtype:"RGBE",format:"",gamma:1,exposure:1,width:0,height:0};let V,N;for((b.pos>=b.byteLength||!(V=L(b)))&&x(1,"no header found"),(N=V.match(z))||x(3,"bad initial token"),O.valid|=1,O.programtype=N[1],O.string+=V+`
`;V=L(b),V!==!1;){if(O.string+=V+`
`,V.charAt(0)==="#"){O.comments+=V+`
`;continue}if((N=V.match(U))&&(O.gamma=parseFloat(N[1])),(N=V.match(G))&&(O.exposure=parseFloat(N[1])),(N=V.match(k))&&(O.valid|=2,O.format=N[1]),(N=V.match(P))&&(O.valid|=4,O.height=parseInt(N[1],10),O.width=parseInt(N[2],10)),O.valid&2&&O.valid&4)break}return O.valid&2||x(3,"missing format specifier"),O.valid&4||x(3,"missing image size specifier"),O},ce=function(b,z,U){const G=z;if(G<8||G>32767||b[0]!==2||b[1]!==2||b[2]&128)return new Uint8Array(b);G!==(b[2]<<8|b[3])&&x(3,"wrong scanline width");const k=new Uint8Array(4*z*U);k.length||x(4,"unable to allocate buffer space");let P=0,O=0;const V=4*G,N=new Uint8Array(4),xe=new Uint8Array(V);let Ie=U;for(;Ie>0&&O<b.byteLength;){O+4>b.byteLength&&x(1),N[0]=b[O++],N[1]=b[O++],N[2]=b[O++],N[3]=b[O++],(N[0]!=2||N[1]!=2||(N[2]<<8|N[3])!=G)&&x(3,"bad rgbe scanline format");let ye=0,j;for(;ye<V&&O<b.byteLength;){j=b[O++];const K=j>128;if(K&&(j-=128),(j===0||ye+j>V)&&x(3,"bad scanline data"),K){const se=b[O++];for(let Te=0;Te<j;Te++)xe[ye++]=se}else xe.set(b.subarray(O,O+j),ye),ye+=j,O+=j}const De=G;for(let K=0;K<De;K++){let se=0;k[P]=xe[K+se],se+=G,k[P+1]=xe[K+se],se+=G,k[P+2]=xe[K+se],se+=G,k[P+3]=xe[K+se],P+=4}Ie--}return k},fe=function(b,z,U,G){const k=b[z+3],P=Math.pow(2,k-128)/255;U[G+0]=b[z+0]*P,U[G+1]=b[z+1]*P,U[G+2]=b[z+2]*P,U[G+3]=1},ue=function(b,z,U,G){const k=b[z+3],P=Math.pow(2,k-128)/255;U[G+0]=vt.toHalfFloat(Math.min(b[z+0]*P,65504)),U[G+1]=vt.toHalfFloat(Math.min(b[z+1]*P,65504)),U[G+2]=vt.toHalfFloat(Math.min(b[z+2]*P,65504)),U[G+3]=vt.toHalfFloat(1)},X=new Uint8Array(i);X.pos=0;const ae=Z(X),de=ae.width,oe=ae.height,re=ce(X.subarray(X.pos),de,oe);let Ae,we,Ue;switch(this.type){case ft:Ue=re.length/4;const b=new Float32Array(Ue*4);for(let U=0;U<Ue;U++)fe(re,U*4,b,U*4);Ae=b,we=ft;break;case Ve:Ue=re.length/4;const z=new Uint16Array(Ue*4);for(let U=0;U<Ue;U++)ue(re,U*4,z,U*4);Ae=z,we=Ve;break;default:throw new Error("THREE.RGBELoader: Unsupported type: "+this.type)}return{width:de,height:oe,data:Ae,header:ae.string,gamma:ae.gamma,exposure:ae.exposure,type:we}}setDataType(i){return this.type=i,this}load(i,o,n,u){function p(x,_){switch(x.type){case ft:case Ve:"colorSpace"in x?x.colorSpace="srgb-linear":x.encoding=3e3,x.minFilter=kt,x.magFilter=kt,x.generateMipmaps=!1,x.flipY=!0;break}o&&o(x,_)}return super.load(i,p,n,u)}}const St=Ht>=152;class Tr extends An{constructor(i){super(i),this.type=Ve}parse(i){const z=Math.pow(2.7182818,2.2);function U(e,t){for(var r=0,s=0;s<65536;++s)(s==0||e[s>>3]&1<<(s&7))&&(t[r++]=s);for(var l=r-1;r<65536;)t[r++]=0;return l}function G(e){for(var t=0;t<16384;t++)e[t]={},e[t].len=0,e[t].lit=0,e[t].p=null}const k={l:0,c:0,lc:0};function P(e,t,r,s,l){for(;r<e;)t=t<<8|st(s,l),r+=8;r-=e,k.l=t>>r&(1<<e)-1,k.c=t,k.lc=r}const O=new Array(59);function V(e){for(var t=0;t<=58;++t)O[t]=0;for(var t=0;t<65537;++t)O[e[t]]+=1;for(var r=0,t=58;t>0;--t){var s=r+O[t]>>1;O[t]=r,r=s}for(var t=0;t<65537;++t){var l=e[t];l>0&&(e[t]=l|O[l]++<<6)}}function N(e,t,r,s,l,c,d){for(var h=r,w=0,E=0;l<=c;l++){if(h.value-r.value>s)return!1;P(6,w,E,e,h);var S=k.l;if(w=k.c,E=k.lc,d[l]=S,S==63){if(h.value-r.value>s)throw"Something wrong with hufUnpackEncTable";P(8,w,E,e,h);var g=k.l+6;if(w=k.c,E=k.lc,l+g>c+1)throw"Something wrong with hufUnpackEncTable";for(;g--;)d[l++]=0;l--}else if(S>=59){var g=S-59+2;if(l+g>c+1)throw"Something wrong with hufUnpackEncTable";for(;g--;)d[l++]=0;l--}}V(d)}function xe(e){return e&63}function Ie(e){return e>>6}function ye(e,t,r,s){for(;t<=r;t++){var l=Ie(e[t]),c=xe(e[t]);if(l>>c)throw"Invalid table entry";if(c>14){var d=s[l>>c-14];if(d.len)throw"Invalid table entry";if(d.lit++,d.p){var h=d.p;d.p=new Array(d.lit);for(var w=0;w<d.lit-1;++w)d.p[w]=h[w]}else d.p=new Array(1);d.p[d.lit-1]=t}else if(c)for(var E=0,w=1<<14-c;w>0;w--){var d=s[(l<<14-c)+E];if(d.len||d.p)throw"Invalid table entry";d.len=c,d.lit=t,E++}}return!0}const j={c:0,lc:0};function De(e,t,r,s){e=e<<8|st(r,s),t+=8,j.c=e,j.lc=t}const K={c:0,lc:0};function se(e,t,r,s,l,c,d,h,w,E){if(e==t){s<8&&(De(r,s,l,d),r=j.c,s=j.lc),s-=8;var S=r>>s,S=new Uint8Array([S])[0];if(w.value+S>E)return!1;for(var g=h[w.value-1];S-- >0;)h[w.value++]=g}else if(w.value<E)h[w.value++]=e;else return!1;K.c=r,K.lc=s}function Te(e){return e&65535}function qe(e){var t=Te(e);return t>32767?t-65536:t}const W={a:0,b:0};function Ne(e,t){var r=qe(e),s=qe(t),l=s,c=r+(l&1)+(l>>1),d=c,h=c-l;W.a=d,W.b=h}function Pe(e,t){var r=Te(e),s=Te(t),l=r-(s>>1)&65535,c=s+l-32768&65535;W.a=c,W.b=l}function Zt(e,t,r,s,l,c,d){for(var h=d<16384,w=r>l?l:r,E=1,S;E<=w;)E<<=1;for(E>>=1,S=E,E>>=1;E>=1;){for(var g=0,ie=g+c*(l-S),I=c*E,T=c*S,R=s*E,B=s*S,q,Q,ve,be;g<=ie;g+=T){for(var J=g,He=g+s*(r-S);J<=He;J+=B){var ee=J+R,he=J+I,We=he+R;h?(Ne(e[J+t],e[he+t]),q=W.a,ve=W.b,Ne(e[ee+t],e[We+t]),Q=W.a,be=W.b,Ne(q,Q),e[J+t]=W.a,e[ee+t]=W.b,Ne(ve,be),e[he+t]=W.a,e[We+t]=W.b):(Pe(e[J+t],e[he+t]),q=W.a,ve=W.b,Pe(e[ee+t],e[We+t]),Q=W.a,be=W.b,Pe(q,Q),e[J+t]=W.a,e[ee+t]=W.b,Pe(ve,be),e[he+t]=W.a,e[We+t]=W.b)}if(r&E){var he=J+I;h?Ne(e[J+t],e[he+t]):Pe(e[J+t],e[he+t]),q=W.a,e[he+t]=W.b,e[J+t]=q}}if(l&E)for(var J=g,He=g+s*(r-S);J<=He;J+=B){var ee=J+R;h?Ne(e[J+t],e[ee+t]):Pe(e[J+t],e[ee+t]),q=W.a,e[ee+t]=W.b,e[J+t]=q}S=E,E>>=1}return g}function Gt(e,t,r,s,l,c,d,h,w,E){for(var S=0,g=0,ie=h,I=Math.trunc(l.value+(c+7)/8);l.value<I;)for(De(S,g,r,l),S=j.c,g=j.lc;g>=14;){var T=S>>g-14&16383,R=t[T];if(R.len)g-=R.len,se(R.lit,d,S,g,r,s,l,w,E,ie),S=K.c,g=K.lc;else{if(!R.p)throw"hufDecode issues";var B;for(B=0;B<R.lit;B++){for(var q=xe(e[R.p[B]]);g<q&&l.value<I;)De(S,g,r,l),S=j.c,g=j.lc;if(g>=q&&Ie(e[R.p[B]])==(S>>g-q&(1<<q)-1)){g-=q,se(R.p[B],d,S,g,r,s,l,w,E,ie),S=K.c,g=K.lc;break}}if(B==R.lit)throw"hufDecode issues"}}var Q=8-c&7;for(S>>=Q,g-=Q;g>0;){var R=t[S<<14-g&16383];if(R.len)g-=R.len,se(R.lit,d,S,g,r,s,l,w,E,ie),S=K.c,g=K.lc;else throw"hufDecode issues"}return!0}function At(e,t,r,s,l,c){var d={value:0},h=r.value,w=pe(t,r),E=pe(t,r);r.value+=4;var S=pe(t,r);if(r.value+=4,w<0||w>=65537||E<0||E>=65537)throw"Something wrong with HUF_ENCSIZE";var g=new Array(65537),ie=new Array(16384);G(ie);var I=s-(r.value-h);if(N(e,t,r,I,w,E,g),S>8*(s-(r.value-h)))throw"Something wrong with hufUncompress";ye(g,w,E,ie),Gt(g,ie,e,t,r,S,E,c,l,d)}function Ut(e,t,r){for(var s=0;s<r;++s)t[s]=e[t[s]]}function dt(e){for(var t=1;t<e.length;t++){var r=e[t-1]+e[t]-128;e[t]=r}}function pt(e,t){for(var r=0,s=Math.floor((e.length+1)/2),l=0,c=e.length-1;!(l>c||(t[l++]=e[r++],l>c));)t[l++]=e[s++]}function xt(e){for(var t=e.byteLength,r=new Array,s=0,l=new DataView(e);t>0;){var c=l.getInt8(s++);if(c<0){var d=-c;t-=d+1;for(var h=0;h<d;h++)r.push(l.getUint8(s++))}else{var d=c;t-=2;for(var w=l.getUint8(s++),h=0;h<d+1;h++)r.push(w)}}return r}function jt(e,t,r,s,l,c){var ee=new DataView(c.buffer),d=r[e.idx[0]].width,h=r[e.idx[0]].height,w=3,E=Math.floor(d/8),S=Math.ceil(d/8),g=Math.ceil(h/8),ie=d-(S-1)*8,I=h-(g-1)*8,T={value:0},R=new Array(w),B=new Array(w),q=new Array(w),Q=new Array(w),ve=new Array(w);for(let $=0;$<w;++$)ve[$]=t[e.idx[$]],R[$]=$<1?0:R[$-1]+S*g,B[$]=new Float32Array(64),q[$]=new Uint16Array(64),Q[$]=new Uint16Array(S*64);for(let $=0;$<g;++$){var be=8;$==g-1&&(be=I);var J=8;for(let ne=0;ne<S;++ne){ne==S-1&&(J=ie);for(let Y=0;Y<w;++Y)q[Y].fill(0),q[Y][0]=l[R[Y]++],It(T,s,q[Y]),Tt(q[Y],B[Y]),Mt(B[Y]);Wt(B);for(let Y=0;Y<w;++Y)Yt(B[Y],Q[Y],ne*64)}let Se=0;for(let ne=0;ne<w;++ne){const Y=r[e.idx[ne]].type;for(let Ce=8*$;Ce<8*$+be;++Ce){Se=ve[ne][Ce];for(let nt=0;nt<E;++nt){const Me=nt*64+(Ce&7)*8;ee.setUint16(Se+0*2*Y,Q[ne][Me+0],!0),ee.setUint16(Se+1*2*Y,Q[ne][Me+1],!0),ee.setUint16(Se+2*2*Y,Q[ne][Me+2],!0),ee.setUint16(Se+3*2*Y,Q[ne][Me+3],!0),ee.setUint16(Se+4*2*Y,Q[ne][Me+4],!0),ee.setUint16(Se+5*2*Y,Q[ne][Me+5],!0),ee.setUint16(Se+6*2*Y,Q[ne][Me+6],!0),ee.setUint16(Se+7*2*Y,Q[ne][Me+7],!0),Se+=8*2*Y}}if(E!=S)for(let Ce=8*$;Ce<8*$+be;++Ce){const nt=ve[ne][Ce]+8*E*2*Y,Me=E*64+(Ce&7)*8;for(let Ye=0;Ye<J;++Ye)ee.setUint16(nt+Ye*2*Y,Q[ne][Me+Ye],!0)}}}for(var He=new Uint16Array(d),ee=new DataView(c.buffer),he=0;he<w;++he){r[e.idx[he]].decoded=!0;var We=r[e.idx[he]].type;if(r[he].type==2)for(var wt=0;wt<h;++wt){const $=ve[he][wt];for(var Oe=0;Oe<d;++Oe)He[Oe]=ee.getUint16($+Oe*2*We,!0);for(var Oe=0;Oe<d;++Oe)ee.setFloat32($+Oe*2*We,m(He[Oe]),!0)}}}function It(e,t,r){for(var s,l=1;l<64;)s=t[e.value],s==65280?l=64:s>>8==255?l+=s&255:(r[l]=s,l++),e.value++}function Tt(e,t){t[0]=m(e[0]),t[1]=m(e[1]),t[2]=m(e[5]),t[3]=m(e[6]),t[4]=m(e[14]),t[5]=m(e[15]),t[6]=m(e[27]),t[7]=m(e[28]),t[8]=m(e[2]),t[9]=m(e[4]),t[10]=m(e[7]),t[11]=m(e[13]),t[12]=m(e[16]),t[13]=m(e[26]),t[14]=m(e[29]),t[15]=m(e[42]),t[16]=m(e[3]),t[17]=m(e[8]),t[18]=m(e[12]),t[19]=m(e[17]),t[20]=m(e[25]),t[21]=m(e[30]),t[22]=m(e[41]),t[23]=m(e[43]),t[24]=m(e[9]),t[25]=m(e[11]),t[26]=m(e[18]),t[27]=m(e[24]),t[28]=m(e[31]),t[29]=m(e[40]),t[30]=m(e[44]),t[31]=m(e[53]),t[32]=m(e[10]),t[33]=m(e[19]),t[34]=m(e[23]),t[35]=m(e[32]),t[36]=m(e[39]),t[37]=m(e[45]),t[38]=m(e[52]),t[39]=m(e[54]),t[40]=m(e[20]),t[41]=m(e[22]),t[42]=m(e[33]),t[43]=m(e[38]),t[44]=m(e[46]),t[45]=m(e[51]),t[46]=m(e[55]),t[47]=m(e[60]),t[48]=m(e[21]),t[49]=m(e[34]),t[50]=m(e[37]),t[51]=m(e[47]),t[52]=m(e[50]),t[53]=m(e[56]),t[54]=m(e[59]),t[55]=m(e[61]),t[56]=m(e[35]),t[57]=m(e[36]),t[58]=m(e[48]),t[59]=m(e[49]),t[60]=m(e[57]),t[61]=m(e[58]),t[62]=m(e[62]),t[63]=m(e[63])}function Mt(e){const t=.5*Math.cos(.7853975),r=.5*Math.cos(3.14159/16),s=.5*Math.cos(3.14159/8),l=.5*Math.cos(3*3.14159/16),c=.5*Math.cos(5*3.14159/16),d=.5*Math.cos(3*3.14159/8),h=.5*Math.cos(7*3.14159/16);for(var w=new Array(4),E=new Array(4),S=new Array(4),g=new Array(4),ie=0;ie<8;++ie){var I=ie*8;w[0]=s*e[I+2],w[1]=d*e[I+2],w[2]=s*e[I+6],w[3]=d*e[I+6],E[0]=r*e[I+1]+l*e[I+3]+c*e[I+5]+h*e[I+7],E[1]=l*e[I+1]-h*e[I+3]-r*e[I+5]-c*e[I+7],E[2]=c*e[I+1]-r*e[I+3]+h*e[I+5]+l*e[I+7],E[3]=h*e[I+1]-c*e[I+3]+l*e[I+5]-r*e[I+7],S[0]=t*(e[I+0]+e[I+4]),S[3]=t*(e[I+0]-e[I+4]),S[1]=w[0]+w[3],S[2]=w[1]-w[2],g[0]=S[0]+S[1],g[1]=S[3]+S[2],g[2]=S[3]-S[2],g[3]=S[0]-S[1],e[I+0]=g[0]+E[0],e[I+1]=g[1]+E[1],e[I+2]=g[2]+E[2],e[I+3]=g[3]+E[3],e[I+4]=g[3]-E[3],e[I+5]=g[2]-E[2],e[I+6]=g[1]-E[1],e[I+7]=g[0]-E[0]}for(var T=0;T<8;++T)w[0]=s*e[16+T],w[1]=d*e[16+T],w[2]=s*e[48+T],w[3]=d*e[48+T],E[0]=r*e[8+T]+l*e[24+T]+c*e[40+T]+h*e[56+T],E[1]=l*e[8+T]-h*e[24+T]-r*e[40+T]-c*e[56+T],E[2]=c*e[8+T]-r*e[24+T]+h*e[40+T]+l*e[56+T],E[3]=h*e[8+T]-c*e[24+T]+l*e[40+T]-r*e[56+T],S[0]=t*(e[T]+e[32+T]),S[3]=t*(e[T]-e[32+T]),S[1]=w[0]+w[3],S[2]=w[1]-w[2],g[0]=S[0]+S[1],g[1]=S[3]+S[2],g[2]=S[3]-S[2],g[3]=S[0]-S[1],e[0+T]=g[0]+E[0],e[8+T]=g[1]+E[1],e[16+T]=g[2]+E[2],e[24+T]=g[3]+E[3],e[32+T]=g[3]-E[3],e[40+T]=g[2]-E[2],e[48+T]=g[1]-E[1],e[56+T]=g[0]-E[0]}function Wt(e){for(var t=0;t<64;++t){var r=e[0][t],s=e[1][t],l=e[2][t];e[0][t]=r+1.5747*l,e[1][t]=r-.1873*s-.4682*l,e[2][t]=r+1.8556*s}}function Yt(e,t,r){for(var s=0;s<64;++s)t[r+s]=vt.toHalfFloat(Dt(e[s]))}function Dt(e){return e<=1?Math.sign(e)*Math.pow(Math.abs(e),2.2):Math.sign(e)*Math.pow(z,Math.abs(e)-1)}function it(e){return new DataView(e.array.buffer,e.offset.value,e.size)}function $e(e){var t=e.viewer.buffer.slice(e.offset.value,e.offset.value+e.size),r=new Uint8Array(xt(t)),s=new Uint8Array(r.length);return dt(r),pt(r,s),new DataView(s.buffer)}function mt(e){var t=e.array.slice(e.offset.value,e.offset.value+e.size),r=Nt(t),s=new Uint8Array(r.length);return dt(r),pt(r,s),new DataView(s.buffer)}function Xt(e){for(var t=e.viewer,r={value:e.offset.value},s=new Uint16Array(e.width*e.scanlineBlockSize*(e.channels*e.type)),l=new Uint8Array(8192),c=0,d=new Array(e.channels),h=0;h<e.channels;h++)d[h]={},d[h].start=c,d[h].end=d[h].start,d[h].nx=e.width,d[h].ny=e.lines,d[h].size=e.type,c+=d[h].nx*d[h].ny*d[h].size;var w=_e(t,r),E=_e(t,r);if(E>=8192)throw"Something is wrong with PIZ_COMPRESSION BITMAP_SIZE";if(w<=E)for(var h=0;h<E-w+1;h++)l[h+w]=a(t,r);var S=new Uint16Array(65536),g=U(l,S),ie=pe(t,r);At(e.array,t,r,ie,s,c);for(var h=0;h<e.channels;++h)for(var I=d[h],T=0;T<d[h].size;++T)Zt(s,I.start+T,I.nx,I.size,I.ny,I.nx*I.size,g);Ut(S,s,c);for(var R=0,B=new Uint8Array(s.buffer.byteLength),q=0;q<e.lines;q++)for(var Q=0;Q<e.channels;Q++){var I=d[Q],ve=I.nx*I.size,be=new Uint8Array(s.buffer,I.end*2,ve*2);B.set(be,R),R+=ve*2,I.end+=ve}return new DataView(B.buffer)}function Ot(e){var t=e.array.slice(e.offset.value,e.offset.value+e.size),r=Nt(t);const s=e.lines*e.channels*e.width,l=e.type==1?new Uint16Array(s):new Uint32Array(s);let c=0,d=0;const h=new Array(4);for(let w=0;w<e.lines;w++)for(let E=0;E<e.channels;E++){let S=0;switch(e.type){case 1:h[0]=c,h[1]=h[0]+e.width,c=h[1]+e.width;for(let g=0;g<e.width;++g){const ie=r[h[0]++]<<8|r[h[1]++];S+=ie,l[d]=S,d++}break;case 2:h[0]=c,h[1]=h[0]+e.width,h[2]=h[1]+e.width,c=h[2]+e.width;for(let g=0;g<e.width;++g){const ie=r[h[0]++]<<24|r[h[1]++]<<16|r[h[2]++]<<8;S+=ie,l[d]=S,d++}break}}return new DataView(l.buffer)}function at(e){var t=e.viewer,r={value:e.offset.value},s=new Uint8Array(e.width*e.lines*(e.channels*e.type*2)),l={version:f(t,r),unknownUncompressedSize:f(t,r),unknownCompressedSize:f(t,r),acCompressedSize:f(t,r),dcCompressedSize:f(t,r),rleCompressedSize:f(t,r),rleUncompressedSize:f(t,r),rleRawSize:f(t,r),totalAcUncompressedCount:f(t,r),totalDcUncompressedCount:f(t,r),acCompression:f(t,r)};if(l.version<2)throw"EXRLoader.parse: "+Et.compression+" version "+l.version+" is unsupported";for(var c=new Array,d=_e(t,r)-2;d>0;){var h=ot(t.buffer,r),w=a(t,r),E=w>>2&3,S=(w>>4)-1,g=new Int8Array([S])[0],ie=a(t,r);c.push({name:h,index:g,type:ie,compression:E}),d-=h.length+3}for(var I=Et.channels,T=new Array(e.channels),R=0;R<e.channels;++R){var B=T[R]={},q=I[R];B.name=q.name,B.compression=0,B.decoded=!1,B.type=q.pixelType,B.pLinear=q.pLinear,B.width=e.width,B.height=e.lines}for(var Q={idx:new Array(3)},ve=0;ve<e.channels;++ve)for(var B=T[ve],R=0;R<c.length;++R){var be=c[R];B.name==be.name&&(B.compression=be.compression,be.index>=0&&(Q.idx[be.index]=ve),B.offset=ve)}if(l.acCompressedSize>0)switch(l.acCompression){case 0:var ee=new Uint16Array(l.totalAcUncompressedCount);At(e.array,t,r,l.acCompressedSize,ee,l.totalAcUncompressedCount);break;case 1:var J=e.array.slice(r.value,r.value+l.totalAcUncompressedCount),He=Nt(J),ee=new Uint16Array(He.buffer);r.value+=l.totalAcUncompressedCount;break}if(l.dcCompressedSize>0){var he={array:e.array,offset:r,size:l.dcCompressedSize},We=new Uint16Array(mt(he).buffer);r.value+=l.dcCompressedSize}if(l.rleRawSize>0){var J=e.array.slice(r.value,r.value+l.rleCompressedSize),He=Nt(J),wt=xt(He.buffer);r.value+=l.rleCompressedSize}for(var Oe=0,$=new Array(T.length),R=0;R<$.length;++R)$[R]=new Array;for(var Se=0;Se<e.lines;++Se)for(var ne=0;ne<T.length;++ne)$[ne].push(Oe),Oe+=T[ne].width*e.type*2;jt(Q,$,T,ee,We,s);for(var R=0;R<T.length;++R){var B=T[R];if(!B.decoded)switch(B.compression){case 2:for(var Y=0,Ce=0,Se=0;Se<e.lines;++Se){for(var nt=$[R][Y],Me=0;Me<B.width;++Me){for(var Ye=0;Ye<2*B.type;++Ye)s[nt++]=wt[Ce+Ye*B.width*B.height];Ce++}Y++}break;case 1:default:throw"EXRLoader.parse: unsupported channel compression"}}return new DataView(s.buffer)}function ot(e,t){for(var r=new Uint8Array(e),s=0;r[t.value+s]!=0;)s+=1;var l=new TextDecoder().decode(r.slice(t.value,t.value+s));return t.value=t.value+s+1,l}function Vt(e,t,r){var s=new TextDecoder().decode(new Uint8Array(e).slice(t.value,t.value+r));return t.value=t.value+r,s}function Ct(e,t){var r=Qe(e,t),s=pe(e,t);return[r,s]}function Kt(e,t){var r=pe(e,t),s=pe(e,t);return[r,s]}function Qe(e,t){var r=e.getInt32(t.value,!0);return t.value=t.value+4,r}function pe(e,t){var r=e.getUint32(t.value,!0);return t.value=t.value+4,r}function st(e,t){var r=e[t.value];return t.value=t.value+1,r}function a(e,t){var r=e.getUint8(t.value);return t.value=t.value+1,r}const f=function(e,t){let r;return"getBigInt64"in DataView.prototype?r=Number(e.getBigInt64(t.value,!0)):r=e.getUint32(t.value+4,!0)+Number(e.getUint32(t.value,!0)<<32),t.value+=8,r};function A(e,t){var r=e.getFloat32(t.value,!0);return t.value+=4,r}function H(e,t){return vt.toHalfFloat(A(e,t))}function m(e){var t=(e&31744)>>10,r=e&1023;return(e>>15?-1:1)*(t?t===31?r?NaN:1/0:Math.pow(2,t-15)*(1+r/1024):6103515625e-14*(r/1024))}function _e(e,t){var r=e.getUint16(t.value,!0);return t.value+=2,r}function ke(e,t){return m(_e(e,t))}function ln(e,t,r,s){for(var l=r.value,c=[];r.value<l+s-1;){var d=ot(t,r),h=Qe(e,r),w=a(e,r);r.value+=3;var E=Qe(e,r),S=Qe(e,r);c.push({name:d,pixelType:h,pLinear:w,xSampling:E,ySampling:S})}return r.value+=1,c}function Rt(e,t){var r=A(e,t),s=A(e,t),l=A(e,t),c=A(e,t),d=A(e,t),h=A(e,t),w=A(e,t),E=A(e,t);return{redX:r,redY:s,greenX:l,greenY:c,blueX:d,blueY:h,whiteX:w,whiteY:E}}function Be(e,t){var r=["NO_COMPRESSION","RLE_COMPRESSION","ZIPS_COMPRESSION","ZIP_COMPRESSION","PIZ_COMPRESSION","PXR24_COMPRESSION","B44_COMPRESSION","B44A_COMPRESSION","DWAA_COMPRESSION","DWAB_COMPRESSION"],s=a(e,t);return r[s]}function ze(e,t){var r=pe(e,t),s=pe(e,t),l=pe(e,t),c=pe(e,t);return{xMin:r,yMin:s,xMax:l,yMax:c}}function Je(e,t){var r=["INCREASING_Y"],s=a(e,t);return r[s]}function et(e,t){var r=A(e,t),s=A(e,t);return[r,s]}function tt(e,t){var r=A(e,t),s=A(e,t),l=A(e,t);return[r,s,l]}function lt(e,t,r,s,l){if(s==="string"||s==="stringvector"||s==="iccProfile")return Vt(t,r,l);if(s==="chlist")return ln(e,t,r,l);if(s==="chromaticities")return Rt(e,r);if(s==="compression")return Be(e,r);if(s==="box2i")return ze(e,r);if(s==="lineOrder")return Je(e,r);if(s==="float")return A(e,r);if(s==="v2f")return et(e,r);if(s==="v3f")return tt(e,r);if(s==="int")return Qe(e,r);if(s==="rational")return Ct(e,r);if(s==="timecode")return Kt(e,r);if(s==="preview")return r.value+=l,"skipped";r.value+=l}function Nn(e,t,r){const s={};if(e.getUint32(0,!0)!=20000630)throw"THREE.EXRLoader: provided file doesn't appear to be in OpenEXR format.";s.version=e.getUint8(4);const l=e.getUint8(5);s.spec={singleTile:!!(l&2),longName:!!(l&4),deepFormat:!!(l&8),multiPart:!!(l&16)},r.value=8;for(var c=!0;c;){var d=ot(t,r);if(d==0)c=!1;else{var h=ot(t,r),w=pe(e,r),E=lt(e,t,r,h,w);E===void 0?console.warn(`EXRLoader.parse: skipped unknown header attribute type '${h}'.`):s[d]=E}}if(l&-5)throw console.error("EXRHeader:",s),"THREE.EXRLoader: provided file is currently unsupported.";return s}function Pn(e,t,r,s,l){const c={size:0,viewer:t,array:r,offset:s,width:e.dataWindow.xMax-e.dataWindow.xMin+1,height:e.dataWindow.yMax-e.dataWindow.yMin+1,channels:e.channels.length,bytesPerLine:null,lines:null,inputSize:null,type:e.channels[0].pixelType,uncompress:null,getter:null,format:null,[St?"colorSpace":"encoding"]:null};switch(e.compression){case"NO_COMPRESSION":c.lines=1,c.uncompress=it;break;case"RLE_COMPRESSION":c.lines=1,c.uncompress=$e;break;case"ZIPS_COMPRESSION":c.lines=1,c.uncompress=mt;break;case"ZIP_COMPRESSION":c.lines=16,c.uncompress=mt;break;case"PIZ_COMPRESSION":c.lines=32,c.uncompress=Xt;break;case"PXR24_COMPRESSION":c.lines=16,c.uncompress=Ot;break;case"DWAA_COMPRESSION":c.lines=32,c.uncompress=at;break;case"DWAB_COMPRESSION":c.lines=256,c.uncompress=at;break;default:throw"EXRLoader.parse: "+e.compression+" is unsupported"}if(c.scanlineBlockSize=c.lines,c.type==1)switch(l){case ft:c.getter=ke,c.inputSize=2;break;case Ve:c.getter=_e,c.inputSize=2;break}else if(c.type==2)switch(l){case ft:c.getter=A,c.inputSize=4;break;case Ve:c.getter=H,c.inputSize=4}else throw"EXRLoader.parse: unsupported pixelType "+c.type+" for "+e.compression+".";c.blockCount=(e.dataWindow.yMax+1)/c.scanlineBlockSize;for(var d=0;d<c.blockCount;d++)f(t,s);c.outputChannels=c.channels==3?4:c.channels;const h=c.width*c.height*c.outputChannels;switch(l){case ft:c.byteArray=new Float32Array(h),c.channels<c.outputChannels&&c.byteArray.fill(1,0,h);break;case Ve:c.byteArray=new Uint16Array(h),c.channels<c.outputChannels&&c.byteArray.fill(15360,0,h);break;default:console.error("THREE.EXRLoader: unsupported type: ",l);break}return c.bytesPerLine=c.width*c.inputSize*c.channels,c.outputChannels==4?c.format=jn:c.format=Wn,St?c.colorSpace="srgb-linear":c.encoding=3e3,c}const Lt=new DataView(i),Bn=new Uint8Array(i),gt={value:0},Et=Nn(Lt,i,gt),F=Pn(Et,Lt,Bn,gt,this.type),cn={value:0},zn={R:0,G:1,B:2,A:3,Y:0};for(let e=0;e<F.height/F.scanlineBlockSize;e++){const t=pe(Lt,gt);F.size=pe(Lt,gt),F.lines=t+F.scanlineBlockSize>F.height?F.height-t:F.scanlineBlockSize;const s=F.size<F.lines*F.bytesPerLine?F.uncompress(F):it(F);gt.value+=F.size;for(let l=0;l<F.scanlineBlockSize;l++){const c=l+e*F.scanlineBlockSize;if(c>=F.height)break;for(let d=0;d<F.channels;d++){const h=zn[Et.channels[d].name];for(let w=0;w<F.width;w++){cn.value=(l*(F.channels*F.width)+d*F.width+w)*F.inputSize;const E=(F.height-1-c)*(F.width*F.outputChannels)+w*F.outputChannels+h;F.byteArray[E]=F.getter(s,cn)}}}}return{header:Et,width:F.width,height:F.height,data:F.byteArray,format:F.format,[St?"colorSpace":"encoding"]:F[St?"colorSpace":"encoding"],type:this.type}}setDataType(i){return this.type=i,this}load(i,o,n,u){function p(x,_){St?x.colorSpace=_.colorSpace:x.encoding=_.encoding,x.minFilter=kt,x.magFilter=kt,x.generateMipmaps=!1,x.flipY=!1,o&&o(x,_)}return super.load(i,p,n,u)}}const gn=new sn,Bt=new le;class Rn extends Yn{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry";const i=[-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],o=[-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],n=[0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5];this.setIndex(n),this.setAttribute("position",new hn(i,3)),this.setAttribute("uv",new hn(o,2))}applyMatrix4(i){const o=this.attributes.instanceStart,n=this.attributes.instanceEnd;return o!==void 0&&(o.applyMatrix4(i),n.applyMatrix4(i),o.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}setPositions(i){let o;i instanceof Float32Array?o=i:Array.isArray(i)&&(o=new Float32Array(i));const n=new rn(o,6,1);return this.setAttribute("instanceStart",new ht(n,3,0)),this.setAttribute("instanceEnd",new ht(n,3,3)),this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(i,o=3){let n;i instanceof Float32Array?n=i:Array.isArray(i)&&(n=new Float32Array(i));const u=new rn(n,o*2,1);return this.setAttribute("instanceColorStart",new ht(u,o,0)),this.setAttribute("instanceColorEnd",new ht(u,o,o)),this}fromWireframeGeometry(i){return this.setPositions(i.attributes.position.array),this}fromEdgesGeometry(i){return this.setPositions(i.attributes.position.array),this}fromMesh(i){return this.fromWireframeGeometry(new Xn(i.geometry)),this}fromLineSegments(i){const o=i.geometry;return this.setPositions(o.attributes.position.array),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new sn);const i=this.attributes.instanceStart,o=this.attributes.instanceEnd;i!==void 0&&o!==void 0&&(this.boundingBox.setFromBufferAttribute(i),gn.setFromBufferAttribute(o),this.boundingBox.union(gn))}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Un),this.boundingBox===null&&this.computeBoundingBox();const i=this.attributes.instanceStart,o=this.attributes.instanceEnd;if(i!==void 0&&o!==void 0){const n=this.boundingSphere.center;this.boundingBox.getCenter(n);let u=0;for(let p=0,x=i.count;p<x;p++)Bt.fromBufferAttribute(i,p),u=Math.max(u,n.distanceToSquared(Bt)),Bt.fromBufferAttribute(o,p),u=Math.max(u,n.distanceToSquared(Bt));this.boundingSphere.radius=Math.sqrt(u),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}applyMatrix(i){return console.warn("THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4()."),this.applyMatrix4(i)}}class Er extends Rn{constructor(){super(),this.isLineGeometry=!0,this.type="LineGeometry"}setPositions(i){const o=i.length-3,n=new Float32Array(2*o);for(let u=0;u<o;u+=3)n[2*u]=i[u],n[2*u+1]=i[u+1],n[2*u+2]=i[u+2],n[2*u+3]=i[u+3],n[2*u+4]=i[u+4],n[2*u+5]=i[u+5];return super.setPositions(n),this}setColors(i,o=3){const n=i.length-o,u=new Float32Array(2*n);if(o===3)for(let p=0;p<n;p+=o)u[2*p]=i[p],u[2*p+1]=i[p+1],u[2*p+2]=i[p+2],u[2*p+3]=i[p+3],u[2*p+4]=i[p+4],u[2*p+5]=i[p+5];else for(let p=0;p<n;p+=o)u[2*p]=i[p],u[2*p+1]=i[p+1],u[2*p+2]=i[p+2],u[2*p+3]=i[p+3],u[2*p+4]=i[p+4],u[2*p+5]=i[p+5],u[2*p+6]=i[p+6],u[2*p+7]=i[p+7];return super.setColors(u,o),this}fromLine(i){const o=i.geometry;return this.setPositions(o.attributes.position.array),this}}class Ln extends bn{constructor(i){super({type:"LineMaterial",uniforms:fn.clone(fn.merge([dn.common,dn.fog,{worldUnits:{value:1},linewidth:{value:1},resolution:{value:new Re(1,1)},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}}])),vertexShader:`
				#include <common>
				#include <fog_pars_vertex>
				#include <logdepthbuf_pars_vertex>
				#include <clipping_planes_pars_vertex>

				uniform float linewidth;
				uniform vec2 resolution;

				attribute vec3 instanceStart;
				attribute vec3 instanceEnd;

				#ifdef USE_COLOR
					#ifdef USE_LINE_COLOR_ALPHA
						varying vec4 vLineColor;
						attribute vec4 instanceColorStart;
						attribute vec4 instanceColorEnd;
					#else
						varying vec3 vLineColor;
						attribute vec3 instanceColorStart;
						attribute vec3 instanceColorEnd;
					#endif
				#endif

				#ifdef WORLD_UNITS

					varying vec4 worldPos;
					varying vec3 worldStart;
					varying vec3 worldEnd;

					#ifdef USE_DASH

						varying vec2 vUv;

					#endif

				#else

					varying vec2 vUv;

				#endif

				#ifdef USE_DASH

					uniform float dashScale;
					attribute float instanceDistanceStart;
					attribute float instanceDistanceEnd;
					varying float vLineDistance;

				#endif

				void trimSegment( const in vec4 start, inout vec4 end ) {

					// trim end segment so it terminates between the camera plane and the near plane

					// conservative estimate of the near plane
					float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
					float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column
					float nearEstimate = - 0.5 * b / a;

					float alpha = ( nearEstimate - start.z ) / ( end.z - start.z );

					end.xyz = mix( start.xyz, end.xyz, alpha );

				}

				void main() {

					#ifdef USE_COLOR

						vLineColor = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

					#endif

					#ifdef USE_DASH

						vLineDistance = ( position.y < 0.5 ) ? dashScale * instanceDistanceStart : dashScale * instanceDistanceEnd;
						vUv = uv;

					#endif

					float aspect = resolution.x / resolution.y;

					// camera space
					vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
					vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );

					#ifdef WORLD_UNITS

						worldStart = start.xyz;
						worldEnd = end.xyz;

					#else

						vUv = uv;

					#endif

					// special case for perspective projection, and segments that terminate either in, or behind, the camera plane
					// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
					// but we need to perform ndc-space calculations in the shader, so we must address this issue directly
					// perhaps there is a more elegant solution -- WestLangley

					bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

					if ( perspective ) {

						if ( start.z < 0.0 && end.z >= 0.0 ) {

							trimSegment( start, end );

						} else if ( end.z < 0.0 && start.z >= 0.0 ) {

							trimSegment( end, start );

						}

					}

					// clip space
					vec4 clipStart = projectionMatrix * start;
					vec4 clipEnd = projectionMatrix * end;

					// ndc space
					vec3 ndcStart = clipStart.xyz / clipStart.w;
					vec3 ndcEnd = clipEnd.xyz / clipEnd.w;

					// direction
					vec2 dir = ndcEnd.xy - ndcStart.xy;

					// account for clip-space aspect ratio
					dir.x *= aspect;
					dir = normalize( dir );

					#ifdef WORLD_UNITS

						// get the offset direction as perpendicular to the view vector
						vec3 worldDir = normalize( end.xyz - start.xyz );
						vec3 offset;
						if ( position.y < 0.5 ) {

							offset = normalize( cross( start.xyz, worldDir ) );

						} else {

							offset = normalize( cross( end.xyz, worldDir ) );

						}

						// sign flip
						if ( position.x < 0.0 ) offset *= - 1.0;

						float forwardOffset = dot( worldDir, vec3( 0.0, 0.0, 1.0 ) );

						// don't extend the line if we're rendering dashes because we
						// won't be rendering the endcaps
						#ifndef USE_DASH

							// extend the line bounds to encompass  endcaps
							start.xyz += - worldDir * linewidth * 0.5;
							end.xyz += worldDir * linewidth * 0.5;

							// shift the position of the quad so it hugs the forward edge of the line
							offset.xy -= dir * forwardOffset;
							offset.z += 0.5;

						#endif

						// endcaps
						if ( position.y > 1.0 || position.y < 0.0 ) {

							offset.xy += dir * 2.0 * forwardOffset;

						}

						// adjust for linewidth
						offset *= linewidth * 0.5;

						// set the world position
						worldPos = ( position.y < 0.5 ) ? start : end;
						worldPos.xyz += offset;

						// project the worldpos
						vec4 clip = projectionMatrix * worldPos;

						// shift the depth of the projected points so the line
						// segments overlap neatly
						vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;
						clip.z = clipPose.z * clip.w;

					#else

						vec2 offset = vec2( dir.y, - dir.x );
						// undo aspect ratio adjustment
						dir.x /= aspect;
						offset.x /= aspect;

						// sign flip
						if ( position.x < 0.0 ) offset *= - 1.0;

						// endcaps
						if ( position.y < 0.0 ) {

							offset += - dir;

						} else if ( position.y > 1.0 ) {

							offset += dir;

						}

						// adjust for linewidth
						offset *= linewidth;

						// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
						offset /= resolution.y;

						// select end
						vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;

						// back to clip space
						offset *= clip.w;

						clip.xy += offset;

					#endif

					gl_Position = clip;

					vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

					#include <logdepthbuf_vertex>
					#include <clipping_planes_vertex>
					#include <fog_vertex>

				}
			`,fragmentShader:`
				uniform vec3 diffuse;
				uniform float opacity;
				uniform float linewidth;

				#ifdef USE_DASH

					uniform float dashOffset;
					uniform float dashSize;
					uniform float gapSize;

				#endif

				varying float vLineDistance;

				#ifdef WORLD_UNITS

					varying vec4 worldPos;
					varying vec3 worldStart;
					varying vec3 worldEnd;

					#ifdef USE_DASH

						varying vec2 vUv;

					#endif

				#else

					varying vec2 vUv;

				#endif

				#include <common>
				#include <fog_pars_fragment>
				#include <logdepthbuf_pars_fragment>
				#include <clipping_planes_pars_fragment>

				#ifdef USE_COLOR
					#ifdef USE_LINE_COLOR_ALPHA
						varying vec4 vLineColor;
					#else
						varying vec3 vLineColor;
					#endif
				#endif

				vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {

					float mua;
					float mub;

					vec3 p13 = p1 - p3;
					vec3 p43 = p4 - p3;

					vec3 p21 = p2 - p1;

					float d1343 = dot( p13, p43 );
					float d4321 = dot( p43, p21 );
					float d1321 = dot( p13, p21 );
					float d4343 = dot( p43, p43 );
					float d2121 = dot( p21, p21 );

					float denom = d2121 * d4343 - d4321 * d4321;

					float numer = d1343 * d4321 - d1321 * d4343;

					mua = numer / denom;
					mua = clamp( mua, 0.0, 1.0 );
					mub = ( d1343 + d4321 * ( mua ) ) / d4343;
					mub = clamp( mub, 0.0, 1.0 );

					return vec2( mua, mub );

				}

				void main() {

					#include <clipping_planes_fragment>

					#ifdef USE_DASH

						if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps

						if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX

					#endif

					float alpha = opacity;

					#ifdef WORLD_UNITS

						// Find the closest points on the view ray and the line segment
						vec3 rayEnd = normalize( worldPos.xyz ) * 1e5;
						vec3 lineDir = worldEnd - worldStart;
						vec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );

						vec3 p1 = worldStart + lineDir * params.x;
						vec3 p2 = rayEnd * params.y;
						vec3 delta = p1 - p2;
						float len = length( delta );
						float norm = len / linewidth;

						#ifndef USE_DASH

							#ifdef USE_ALPHA_TO_COVERAGE

								float dnorm = fwidth( norm );
								alpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, norm );

							#else

								if ( norm > 0.5 ) {

									discard;

								}

							#endif

						#endif

					#else

						#ifdef USE_ALPHA_TO_COVERAGE

							// artifacts appear on some hardware if a derivative is taken within a conditional
							float a = vUv.x;
							float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
							float len2 = a * a + b * b;
							float dlen = fwidth( len2 );

							if ( abs( vUv.y ) > 1.0 ) {

								alpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );

							}

						#else

							if ( abs( vUv.y ) > 1.0 ) {

								float a = vUv.x;
								float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
								float len2 = a * a + b * b;

								if ( len2 > 1.0 ) discard;

							}

						#endif

					#endif

					vec4 diffuseColor = vec4( diffuse, alpha );
					#ifdef USE_COLOR
						#ifdef USE_LINE_COLOR_ALPHA
							diffuseColor *= vLineColor;
						#else
							diffuseColor.rgb *= vLineColor;
						#endif
					#endif

					#include <logdepthbuf_fragment>

					gl_FragColor = diffuseColor;

					#include <tonemapping_fragment>
					#include <${Ht>=154?"colorspace_fragment":"encodings_fragment"}>
					#include <fog_fragment>
					#include <premultiplied_alpha_fragment>

				}
			`,clipping:!0}),this.isLineMaterial=!0,this.onBeforeCompile=function(){this.transparent?this.defines.USE_LINE_COLOR_ALPHA="1":delete this.defines.USE_LINE_COLOR_ALPHA},Object.defineProperties(this,{color:{enumerable:!0,get:function(){return this.uniforms.diffuse.value},set:function(o){this.uniforms.diffuse.value=o}},worldUnits:{enumerable:!0,get:function(){return"WORLD_UNITS"in this.defines},set:function(o){o===!0?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}},linewidth:{enumerable:!0,get:function(){return this.uniforms.linewidth.value},set:function(o){this.uniforms.linewidth.value=o}},dashed:{enumerable:!0,get:function(){return"USE_DASH"in this.defines},set(o){!!o!="USE_DASH"in this.defines&&(this.needsUpdate=!0),o===!0?this.defines.USE_DASH="":delete this.defines.USE_DASH}},dashScale:{enumerable:!0,get:function(){return this.uniforms.dashScale.value},set:function(o){this.uniforms.dashScale.value=o}},dashSize:{enumerable:!0,get:function(){return this.uniforms.dashSize.value},set:function(o){this.uniforms.dashSize.value=o}},dashOffset:{enumerable:!0,get:function(){return this.uniforms.dashOffset.value},set:function(o){this.uniforms.dashOffset.value=o}},gapSize:{enumerable:!0,get:function(){return this.uniforms.gapSize.value},set:function(o){this.uniforms.gapSize.value=o}},opacity:{enumerable:!0,get:function(){return this.uniforms.opacity.value},set:function(o){this.uniforms.opacity.value=o}},resolution:{enumerable:!0,get:function(){return this.uniforms.resolution.value},set:function(o){this.uniforms.resolution.value.copy(o)}},alphaToCoverage:{enumerable:!0,get:function(){return"USE_ALPHA_TO_COVERAGE"in this.defines},set:function(o){!!o!="USE_ALPHA_TO_COVERAGE"in this.defines&&(this.needsUpdate=!0),o===!0?(this.defines.USE_ALPHA_TO_COVERAGE="",this.extensions.derivatives=!0):(delete this.defines.USE_ALPHA_TO_COVERAGE,this.extensions.derivatives=!1)}}}),this.setValues(i)}}const en=new _t,En=new le,wn=new le,me=new _t,ge=new _t,Ze=new _t,tn=new le,nn=new Kn,Ee=new Vn,Sn=new le,zt=new sn,Ft=new Un,Ge=new _t;let je,rt;function yn(v,i,o){return Ge.set(0,0,-i,1).applyMatrix4(v.projectionMatrix),Ge.multiplyScalar(1/Ge.w),Ge.x=rt/o.width,Ge.y=rt/o.height,Ge.applyMatrix4(v.projectionMatrixInverse),Ge.multiplyScalar(1/Ge.w),Math.abs(Math.max(Ge.x,Ge.y))}function wr(v,i){const o=v.matrixWorld,n=v.geometry,u=n.attributes.instanceStart,p=n.attributes.instanceEnd,x=Math.min(n.instanceCount,u.count);for(let _=0,y=x;_<y;_++){Ee.start.fromBufferAttribute(u,_),Ee.end.fromBufferAttribute(p,_),Ee.applyMatrix4(o);const C=new le,D=new le;je.distanceSqToSegment(Ee.start,Ee.end,D,C),D.distanceTo(C)<rt*.5&&i.push({point:D,pointOnLine:C,distance:je.origin.distanceTo(D),object:v,face:null,faceIndex:_,uv:null,[xn]:null})}}function Sr(v,i,o){const n=i.projectionMatrix,p=v.material.resolution,x=v.matrixWorld,_=v.geometry,y=_.attributes.instanceStart,C=_.attributes.instanceEnd,D=Math.min(_.instanceCount,y.count),L=-i.near;je.at(1,Ze),Ze.w=1,Ze.applyMatrix4(i.matrixWorldInverse),Ze.applyMatrix4(n),Ze.multiplyScalar(1/Ze.w),Ze.x*=p.x/2,Ze.y*=p.y/2,Ze.z=0,tn.copy(Ze),nn.multiplyMatrices(i.matrixWorldInverse,x);for(let Z=0,ce=D;Z<ce;Z++){if(me.fromBufferAttribute(y,Z),ge.fromBufferAttribute(C,Z),me.w=1,ge.w=1,me.applyMatrix4(nn),ge.applyMatrix4(nn),me.z>L&&ge.z>L)continue;if(me.z>L){const oe=me.z-ge.z,re=(me.z-L)/oe;me.lerp(ge,re)}else if(ge.z>L){const oe=ge.z-me.z,re=(ge.z-L)/oe;ge.lerp(me,re)}me.applyMatrix4(n),ge.applyMatrix4(n),me.multiplyScalar(1/me.w),ge.multiplyScalar(1/ge.w),me.x*=p.x/2,me.y*=p.y/2,ge.x*=p.x/2,ge.y*=p.y/2,Ee.start.copy(me),Ee.start.z=0,Ee.end.copy(ge),Ee.end.z=0;const ue=Ee.closestPointToPointParameter(tn,!0);Ee.at(ue,Sn);const X=qn.lerp(me.z,ge.z,ue),ae=X>=-1&&X<=1,de=tn.distanceTo(Sn)<rt*.5;if(ae&&de){Ee.start.fromBufferAttribute(y,Z),Ee.end.fromBufferAttribute(C,Z),Ee.start.applyMatrix4(x),Ee.end.applyMatrix4(x);const oe=new le,re=new le;je.distanceSqToSegment(Ee.start,Ee.end,re,oe),o.push({point:re,pointOnLine:oe,distance:je.origin.distanceTo(re),object:v,face:null,faceIndex:Z,uv:null,[xn]:null})}}}class yr extends _n{constructor(i=new Rn,o=new Ln({color:Math.random()*16777215})){super(i,o),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){const i=this.geometry,o=i.attributes.instanceStart,n=i.attributes.instanceEnd,u=new Float32Array(2*o.count);for(let x=0,_=0,y=o.count;x<y;x++,_+=2)En.fromBufferAttribute(o,x),wn.fromBufferAttribute(n,x),u[_]=_===0?0:u[_-1],u[_+1]=u[_]+En.distanceTo(wn);const p=new rn(u,2,1);return i.setAttribute("instanceDistanceStart",new ht(p,1,0)),i.setAttribute("instanceDistanceEnd",new ht(p,1,1)),this}raycast(i,o){const n=this.material.worldUnits,u=i.camera;u===null&&!n&&console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.');const p=i.params.Line2!==void 0&&i.params.Line2.threshold||0;je=i.ray;const x=this.matrixWorld,_=this.geometry,y=this.material;rt=y.linewidth+p,_.boundingSphere===null&&_.computeBoundingSphere(),Ft.copy(_.boundingSphere).applyMatrix4(x);let C;if(n)C=rt*.5;else{const L=Math.max(u.near,Ft.distanceToPoint(je.origin));C=yn(u,L,y.resolution)}if(Ft.radius+=C,je.intersectsSphere(Ft)===!1)return;_.boundingBox===null&&_.computeBoundingBox(),zt.copy(_.boundingBox).applyMatrix4(x);let D;if(n)D=rt*.5;else{const L=Math.max(u.near,zt.distanceToPoint(je.origin));D=yn(u,L,y.resolution)}zt.expandByScalar(D),je.intersectsBox(zt)!==!1&&(n?wr(this,o):Sr(this,u,o))}onBeforeRender(i){const o=this.material.uniforms;o&&o.resolution&&(i.getViewport(en),this.material.uniforms.resolution.value.set(en.z,en.w))}}class Mr extends yr{constructor(i=new Er,o=new Ln({color:Math.random()*16777215})){super(i,o),this.isLine2=!0,this.type="Line2"}}export{Tr as E,br as G,Ur as H,yr as L,Ar as O,Ir as R,xr as V,Mr as a,Ln as b,Rn as c,Er as d};
