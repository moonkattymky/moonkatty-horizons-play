/* v99 big world (≈800×800 m). The classic ±104 m play area is untouched; everything here lives outside it.
   - MoonOuterWorld: pure, seeded content (rocks, crystal fields, small craters' rim stones, glowing plants, lamps, a mini landmark
     every ~100 m, the four big landmarks). Same data drives the meshes, the collisions and the big map.
   - detail terrain is streamed in 64×64 m chunks around the cat (2 m grid near, 4 m in the second ring), with skirts;
     a coarse 8 m ground covers the whole world (and a low apron beyond the rim) so the horizon never has holes.
   - chunk building is a job split across frames with a time budget (≈2 ms, 1.2 ms on low), so walking never hitches.
   - per chunk decoration is baked into one mesh per material (rock / violet crystal / cyan crystal / glow / lamp light): few draws,
     frustum-culled per chunk; landmarks are baked into world-wide meshes so they stay on the horizon. */
(function(root){'use strict';
const Core=root.MoonCore;if(!Core)return;
const CS=64,ORG=-416,N=13,CORE=104,LOAD=2,KEEP=3,LMC=100;
const norm=v=>{const l=Math.hypot(v[0],v[1],v[2])||1;return[v[0]/l,v[1]/l,v[2]/l];};
function rng(seed){let s=(seed>>>0)||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
const tkOf=ch=>ch===1?1:ch>=9?9:ch>=8?8:ch>=7?7:ch>=6?6:2;
const outside=(x,z,m=8)=>!(Math.abs(x)<CORE+m&&Math.abs(z)<CORE+m);
const inWorld=(x,z)=>Math.abs(x)<384&&Math.abs(z)<384;
// ---------------- content (pure) ----------------
const BIG=()=>Core.LANDMARKS||[];
const nearBig=(x,z,pad)=>BIG().some(L=>Math.hypot(x-L.x,z-L.z)<(L.r||30)+pad)||(Core.RUINS||[]).some(L=>Math.hypot(x-L.x,z-L.z)<L.r+6+pad);
let MINI=null;
function minis(){if(MINI)return MINI;MINI=[];const T=['obelisk','arch','stones','beacon','geode','obelisk','stones','beacon'];
 for(let I=-4;I<4;I++)for(let J=-4;J<4;J++){const q=rng(I*7919+J*104729+17),x=(I+.5)*LMC+(q()-.5)*44,z=(J+.5)*LMC+(q()-.5)*44;if(!outside(x,z,22)||!inWorld(x,z)||nearBig(x,z,24))continue;MINI.push({t:T[Math.floor(q()*T.length)],x,z,yaw:q()*6.28,s:.85+q()*.4,seed:Math.floor(q()*1e9)});}
 return MINI;}
// items: [type,x,z,yOffset,sx,sy,sz,yaw]; types: rock, cryV, cryC, glowV, glowC, lamp, stem
function pushLandmark(L,h,out,col){const q=rng(L.seed||((L.x*31+L.z*17)|0)),s=L.s||1,y=(x,z)=>h(x,z);
 const R=(x,z,sx,sy,sz,yaw,dy=0)=>out.push(['rock',x,z,y(x,z)+dy,sx,sy,sz,yaw]),P=(t,x,z,sx,sy,sz,yaw,dy=0)=>{if((t==='glowV'||t==='glowC')&&sx>2&&sy<=1.2)return;if(t==='cryV'||t==='cryC')dy=sy*.42;out.push([t,x,z,y(x,z)+dy,sx,sy,sz,yaw]);};
 const C=(x,z,r)=>col&&col.push([x,z,r]);
 switch(L.t||L.id){
 case'obelisk':{const t=q()<.5?'cryV':'cryC';P(t,L.x,L.z,2.2*s,9*s,2.2*s,L.yaw,8*s);C(L.x,L.z,2.4*s);for(let k=0;k<6;k++){const a=k/6*6.28+q(),d=3.5+q()*3,x=L.x+Math.cos(a)*d,z=L.z+Math.sin(a)*d,ss=(.9+q()*1.4)*s;P(t,x,z,ss*.7,ss*3.2,ss*.7,q()*6.3,ss*2.6);C(x,z,ss*.7);}P(t==='cryV'?'glowV':'glowC',L.x,L.z,3.2*s,1.2,3.2*s,0,.3);break;}
 case'arch':{for(const g of[-1,1]){const x=L.x+Math.cos(L.yaw)*g*6*s,z=L.z-Math.sin(L.yaw)*g*6*s;R(x,z,2.4*s,5.5*s,2.4*s,q()*6,4.6*s);C(x,z,2.6*s);}R(L.x,L.z,8.6*s,1.9*s,2.6*s,L.yaw,10.2*s);P('glowV',L.x,L.z,1.4,1.4,1.4,0,1.2);break;}
 case'stones':{for(let k=0;k<8;k++){const a=k/8*6.28,x=L.x+Math.cos(a)*9*s,z=L.z+Math.sin(a)*9*s,hh=(2.2+q()*2.6)*s;R(x,z,1.1*s,hh,1.1*s,a,hh*.8);C(x,z,1.3*s);}P('lamp',L.x,L.z,.32,3.2,.32,0,1.6);P('glowC',L.x,L.z,1.1,1.1,1.1,0,3.6);C(L.x,L.z,.8);break;}
 case'beacon':{R(L.x,L.z,1.3*s,9*s,1.3*s,0,8.5*s);R(L.x,L.z,3.6*s,1.4*s,3.6*s,0,.6);C(L.x,L.z,3.2*s);P('lampHi',L.x,L.z,1.6,1.6,1.6,0,18.6*s);for(let k=0;k<4;k++){const a=k/4*6.28+.4,x=L.x+Math.cos(a)*6,z=L.z+Math.sin(a)*6;P('cryC',x,z,.7,2.4,.7,a,1.9);}break;}
 case'geode':{for(let k=0;k<14;k++){const a=k/14*6.28,d=5+q()*1.5,x=L.x+Math.cos(a)*d,z=L.z+Math.sin(a)*d,ss=(1+q()*1.3)*s;P('cryC',x,z,ss*.6,ss*2.8,ss*.6,a,ss*1.8);if(ss>1.4)C(x,z,ss*.6);}P('glowC',L.x,L.z,5,1,5,0,.2);R(L.x,L.z,2.2,1.6,2.2,0,.6);C(L.x,L.z,2.2);break;}
 case'bigCrater':{for(let k=0;k<16;k++){const a=k/16*6.28+q()*.2,x=L.x+Math.cos(a)*L.r*1.04,z=L.z+Math.sin(a)*L.r*1.04,ss=2.4+q()*3.2;R(x,z,ss,ss*.9,ss*1.2,a,ss*.3);C(x,z,ss*.9);}
  for(let k=0;k<22;k++){const a=k/22*6.28,d=L.r*(.42+q()*.12),x=L.x+Math.cos(a)*d,z=L.z+Math.sin(a)*d,ss=1+q()*1.6;P(k%2?'cryV':'cryC',x,z,ss*.6,ss*3,ss*.6,a,ss*2.2);}
  P('cryV',L.x,L.z,3,13,3,0,11);C(L.x,L.z,3.2);for(let k=0;k<5;k++){const a=k/5*6.28,x=L.x+Math.cos(a)*5,z=L.z+Math.sin(a)*5;P('cryV',x,z,1.5,6,1.5,a,4.8);C(x,z,1.5);}P('glowV',L.x,L.z,16,1,16,0,.4);P('lampHi',L.x,L.z,2.2,2.2,2.2,0,26);break;}
 case'spireField':{for(let k=0;k<11;k++){const a=k/11*6.283+q()*.4,d=k?8+q()*22:0,x=L.x+Math.cos(a)*d,z=L.z+Math.sin(a)*d,ss=k?1.6+q()*1.8:4.4;P('cryV',x,z,ss*.6,ss*4.6,ss*.6,q()*6.3,ss*3.9);C(x,z,ss*.6);}P('glowV',L.x,L.z,20,1,20,0,.3);break;}
 case'ridgeGate':{for(const g of[-1,1]){const x=L.x+g*9,z=L.z;R(x,z,3.2,8,3.2,0,7);C(x,z,3.4);}R(L.x,L.z,12,2.4,3.4,0,15);P('lamp',L.x,L.z,.3,1,.3,0,13);P('glowC',L.x,L.z,1.3,1.3,1.3,0,13.2);break;}
 case'mesa':{for(let k=0;k<9;k++){const a=k/9*6.283,x=L.x+Math.cos(a)*(L.r+6),z=L.z+Math.sin(a)*(L.r+6),ss=2+q()*1.5,hh=ss*2.5+q()*5;R(x,z,ss,hh,ss,a,hh*.8);C(x,z,ss);}P('lampHi',L.x,L.z,1.8,1.8,1.8,0,h(L.x,L.z)-h(L.x,L.z)+4);break;}}}
const CACHE=new Map();
function chunkContent(ci,cj,ch){const key=ci+','+cj+','+tkOf(ch);let c=CACHE.get(key);if(c)return c;
 const h=(x,z)=>Core.height(x,z,ch),q=rng(ci*977+cj*131+5),x0=ORG+ci*CS,z0=ORG+cj*CS,it=[],col=[];
 const ok=(x,z)=>outside(x,z)&&inWorld(x,z)&&!nearBig(x,z,4);
 // boulder clusters
 const ncl=2+Math.floor(q()*3);for(let k=0;k<ncl;k++){const cx=x0+q()*CS,cz=z0+q()*CS,n=3+Math.floor(q()*5);for(let m=0;m<n;m++){const x=cx+(q()-.5)*14,z=cz+(q()-.5)*14;if(!ok(x,z))continue;const s=.5+q()*q()*3.4;it.push(['rock',x,z,h(x,z)+s*.12,s,s*(.5+q()*.4),s*(.8+q()*.4),q()*6.3]);if(s>1.15)col.push([x,z,s*.75]);}}
 // loose pebbles
 for(let k=0;k<8;k++){const x=x0+q()*CS,z=z0+q()*CS;if(!ok(x,z))continue;const s=.18+q()*.35;it.push(['rock',x,z,h(x,z)+s*.1,s,s*.6,s,q()*6.3]);}
 // crystal fields: violet or cyan, sometimes both
 const nf=q()<.75?1+(q()<.35?1:0):0;for(let f=0;f<nf;f++){const cx=x0+10+q()*(CS-20),cz=z0+10+q()*(CS-20);if(!ok(cx,cz))continue;const t=q()<.55?'cryV':'cryC',n=12+Math.floor(q()*14);for(let k=0;k<n;k++){const a=q()*6.3,d=Math.sqrt(q())*8,x=cx+Math.cos(a)*d,z=cz+Math.sin(a)*d,s=.3+q()*q()*1.6;it.push([q()<.15?(t==='cryV'?'cryC':'cryV'):t,x,z,h(x,z)+s*2.1*.40,s*.55,s*2.1,s*.55,q()*6.3]);if(s>1.0)col.push([x,z,s*.5]);}}
 // glowing plants (stalk + bulb)
 const np=q()<.6?3+Math.floor(q()*6):0,pcx=x0+q()*CS,pcz=z0+q()*CS;for(let k=0;k<np;k++){const x=pcx+(q()-.5)*16,z=pcz+(q()-.5)*16;if(!ok(x,z))continue;const s=.6+q()*.7,t=q()<.5?'glowV':'glowC';it.push(['stem',x,z,h(x,z)+s*.5,.05,s*.5,.05,0]);it.push([t,x,z,h(x,z)+s*1.05,.17*(1+s*.3),.2*(1+s*.3),.17*(1+s*.3),0]);}
 // a lamp post now and then (old expedition markers)
 if(q()<.35){const x=x0+8+q()*(CS-16),z=z0+8+q()*(CS-16);if(ok(x,z)){it.push(['stem',x,z,h(x,z)+1.1,.09,1.1,.09,0]);it.push(['lamp',x,z,h(x,z)+2.3,.26,.26,.26,0]);col.push([x,z,.35]);}}
 c={it,col};CACHE.set(key,c);if(CACHE.size>400)CACHE.delete(CACHE.keys().next().value);return c;}
let LMI=null,LMCOL=null;
function landmarkContent(ch){const tk=tkOf(ch);if(LMI&&LMI.tk===tk)return LMI;const it=[],col=[],h=(x,z)=>Core.height(x,z,ch);for(const L of BIG())pushLandmark(L,h,it,col);for(const L of minis())pushLandmark(L,h,it,col);LMI={tk,it,col};return LMI;}
function landmarkColliders(){if(!LMCOL){LMCOL=[];const h=(x,z)=>Core.height(x,z,1),it=[];for(const L of BIG())pushLandmark(L,h,it,LMCOL);for(const L of minis())pushLandmark(L,h,it,LMCOL);}return LMCOL;}
function blockedOuter(x,z,ch){if(!outside(x,z,0))return false;for(const c of landmarkColliders())if(Math.abs(x-c[0])<c[2]&&Math.hypot(x-c[0],z-c[1])<c[2])return true;
 const ci=Math.floor((x-ORG)/CS),cj=Math.floor((z-ORG)/CS);for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const i=ci+a,j=cj+b;if(i<0||j<0||i>=N||j>=N)continue;const lx=x-(ORG+i*CS),lz=z-(ORG+j*CS);if(lx<-8||lz<-8||lx>CS+8||lz>CS+8)continue;for(const c of chunkContent(i,j,ch||1).col)if(Math.abs(x-c[0])<c[2]&&Math.hypot(x-c[0],z-c[1])<c[2])return true;}return false;}
root.MoonOuterWorld={CS,ORG,N,CORE,minis,big:BIG,chunkContent,landmarkContent,blockedOuter};
// ---------------- rendering ----------------
const R=root.MoonRenderer&&root.MoonRenderer.prototype;
if(!R)return;
const old={scene:R.scene,blocked:R.blocked};
function lowSphere(nu,nv,seed){const o=[],q=seed?rng(seed):null,P=[];for(let j=0;j<=nv;j++){P.push([]);for(let i=0;i<=nu;i++){const th=j/nv*Math.PI,ph=i/nu*6.2832,k=q&&i<nu&&j>0&&j<nv?.78+q()*.38:(q?.95:1);P[j].push([Math.sin(th)*Math.cos(ph)*k,Math.cos(th)*k,Math.sin(th)*Math.sin(ph)*k]);}P[j][nu]=P[j][0];}
 const V=(a)=>{o.push(a[0],a[1],a[2],...norm(a));};for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=P[j][i],b=P[j][i+1],c=P[j+1][i+1],d=P[j+1][i];V(a);V(c);V(b);V(a);V(d);V(c);}return o;}
function lowCyl(n){const o=[];for(let i=0;i<n;i++){const a=i/n*6.2832,b=(i+1)/n*6.2832,ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b);o.push(ca,-1,sa,ca,0,sa,cb,1,sb,cb,0,sb,ca,1,sa,ca,0,sa,ca,-1,sa,ca,0,sa,cb,-1,sb,cb,0,sb,cb,1,sb,cb,0,sb,0,1,0,0,1,0,ca,1,sa,0,1,0,cb,1,sb,0,1,0);}return o;}
let MESH=null;function meshes(r){meshesLite();if(!MESH.cry)MESH.cry=r.meshes.crystal.data;return MESH;}
function bake(out,src,x,y,z,sx,sy,sz,yaw){const c=Math.cos(yaw),s=Math.sin(yaw);for(let i=0;i<src.length;i+=6){const px=src[i]*sx,py=src[i+1]*sy,pz=src[i+2]*sz,nx=src[i+3]/sx,ny=src[i+4]/sy,nz=src[i+5]/sz,l=Math.hypot(nx,ny,nz)||1;out.push(x+c*px+s*pz,y+py,z-s*px+c*pz,(c*nx+s*nz)/l,ny/l,(-s*nx+c*nz)/l);}}

// ---------------- explorable ruins (ruins2.js models them; one crystal find inside each, same pickup as every other crystal) ----------------
const RU2=root.MoonRuins2;
function meshesLite(){if(!MESH)MESH={rocks:[lowSphere(9,6,11),lowSphere(9,6,23),lowSphere(8,6,37)],ball:lowSphere(10,7,0),cyl:lowCyl(9),cry:null};}
const blockedRuins=(x,z)=>RU2?RU2.blocked(x,z):false;
{for(const R of RU2?Core.RUINS||[]:[]){const id='ruin_'+R.id;if(Core.resources&&!Core.resources.some(r=>r.id===id)){const f=RU2.layout(R).find;Core.resources.push({id,type:'crystals',x:f[0],z:f[1],ruin:R.id});}}}
root.MoonOuterWorld.ruins=()=>Core.RUINS||[];root.MoonOuterWorld.blockedRuins=blockedRuins;

const MAT={rock:['rock',29,[.57,.545,.56],0],stem:['rock',29,[.30,.28,.34],0],cryV:['cryV',30,[.66,.38,1.0],.62],cryC:['cryC',30,[.22,.70,1.0],.62],glowV:['glowV',12,[.62,.34,1.0],.55],glowC:['glowC',12,[.20,.70,1.0],.55],lamp:['lamp',12,[1.0,.64,.30],.7],lampHi:['lamp',12,[1.0,.64,.30],.95],hull:['hull',0,[.66,.66,.72],0],dark:['dark',0,[.33,.32,.38],0],accent:['accent',0,[.86,.48,.26],0]};if(RU2)for(const k in RU2.MAT){const m=RU2.MAT[k];MAT[k]=[k,m[0],m[1],m[2]];}
function* bakeItems(r,items,skipSmall){const M=meshes(r),G={};let n=0;for(const[t,x,z,y,sx,sy,sz,yaw]of items){if(skipSmall&&(t==='stem'||(t==='rock'&&sx<.6)))continue;const m=MAT[t],g=G[m[0]]||(G[m[0]]=[]);
  const src=t==='rock'?M.rocks[(Math.abs(x*7+z*3)|0)%3]:t==='stem'?M.cyl:(t==='cryV'||t==='cryC')?M.cry:(sy<1.1&&sx>2?M.ball:M.ball);bake(g,src,x,y,z,sx,sy,sz,yaw);if(++n%40===0)yield;}return G;}
function* terrainJob(ci,cj,step,ch,out){const h=Core.height,x0=ORG+ci*CS,z0=ORG+cj*CS,n=CS/step+1,m=n+2,H=new Float32Array(m*m);
 for(let j=0;j<m;j++){for(let i=0;i<m;i++)H[j*m+i]=h(x0+(i-1)*step,z0+(j-1)*step,ch);if(j%4===3)yield;}
 const P=new Array(n*n),a=[];for(let j=0;j<n;j++)for(let i=0;i<n;i++){const c=(j+1)*m+i+1;P[j*n+i]=[x0+i*step,H[c]-.04,z0+j*step,...norm([H[c-1]-H[c+1],2*step,H[c-m]-H[c+m]])];}
 const inCore=(x,z)=>x>=-CORE&&x+step<=CORE&&z>=-CORE&&z+step<=CORE;
 for(let j=0;j<n-1;j++)for(let i=0;i<n-1;i++){if(inCore(x0+i*step,z0+j*step))continue;const q=[j*n+i,j*n+i+1,(j+1)*n+i+1,(j+1)*n+i];for(const k of[0,2,1,0,3,2])a.push(...P[q[k]]);}
 yield;const sk=(A,B)=>{if(inCore(Math.min(A[0],B[0])-(A[0]===B[0]?step*.5:0),Math.min(A[2],B[2])-(A[2]===B[2]?step*.5:0)))return;const a2=[A[0],A[1]-1.8,A[2],...A.slice(3)],b2=[B[0],B[1]-1.8,B[2],...B.slice(3)];for(const v of[A,B,b2,A,b2,a2,A,b2,B,A,a2,b2])a.push(...v);};
 for(let i=0;i<n-1;i++){sk(P[i],P[i+1]);sk(P[(n-1)*n+i],P[(n-1)*n+i+1]);sk(P[i*n],P[(i+1)*n]);sk(P[i*n+n-1],P[(i+1)*n+n-1]);}out.terrain=a;}
function* farJob(ch,out){const h=Core.height,a=[],S=8,E=400,A=960,SA=64;const hc=(x,z)=>{const cx=Math.max(-398,Math.min(398,x)),cz=Math.max(-398,Math.min(398,z)),o=Math.max(Math.abs(x),Math.abs(z))-398;return h(cx,cz,ch)+(o>0?Math.min(26,o*.06):0)-.9;};
 const quad=(x,z,s)=>{const v=[[x,z],[x+s,z],[x+s,z+s],[x,z+s]].map(([X,Z])=>{const y=hc(X,Z),e=s*.5;return[X,y,Z,...norm([hc(X-e,Z)-hc(X+e,Z),2*e,hc(X,Z-e)-hc(X,Z+e)])];});for(const k of[0,2,1,0,3,2])a.push(...v[k]);};
 for(let z=-E;z<E;z+=S){for(let x=-E;x<E;x+=S){if(x>=-CORE&&x+S<=CORE&&z>=-CORE&&z+S<=CORE)continue;quad(x,z,S);}yield;}
 for(let z=-A;z<A;z+=SA){for(let x=-A;x<A;x+=SA){if(x>=-E&&x+SA<=E&&z>=-E&&z+SA<=E)continue;quad(x,z,SA);}yield;}out.terrain=a;}
R.v99Free=function(id){const m=this.meshes[id];if(m){try{this.gl.deleteBuffer(m.b||m.buffer);}catch(e){}delete this.meshes[id];}};
/* GPU uploads of finished jobs are spread too: at least one mesh per frame, more while the frame budget lasts;
   the meshes a job replaces are freed only after all of its new meshes are on the GPU (no holes in between) */
R.v99Upload=function(budget){const S=this._v99;if(!S||!S.upq||!S.upq.length)return;const t0=performance.now();let n=0;
 while(S.upq.length){const c=S.upq[0];if(c.up.length){if(n>0&&performance.now()-t0>budget)return;const[k,a]=c.up.shift();this.addMesh(k,a);n++;continue;}for(const id of c.free)this.v99Free(id);S.upq.shift();}};
R.v99Chunk=function(state,p){const ch=Number(state.chapter)||1,tk=tkOf(ch);if(!this._v99)this._v99={live:new Map(),tk:0,job:null,far:null,lm:null};const S=this._v99,low=this.quality==='low';
 if(!this.meshes.v99spark){meshesLite();this.addMesh('v99spark',MESH.ball);}
 if(S.tk!==tk){if(S.upq){this.v99Upload(1e9);}for(const[,c]of S.live)for(const id of c.ids)this.v99Free(id);S.live.clear();if(S.far)this.v99Free(S.far);if(S.lm)for(const id of S.lm)this.v99Free(id);S.far=null;S.lm=null;S.job=null;if(S.ruins){for(const[,e]of S.ruins)for(const id of e.ids)this.v99Free(id);S.ruins.clear();}S.tk=tk;}
 const px=p&&Number.isFinite(p.x)?p.x:0,pz=p&&Number.isFinite(p.z)?p.z:12,ci=Math.floor((px-ORG)/CS),cj=Math.floor((pz-ORG)/CS);
 for(const[k,c]of S.live)if(Math.max(Math.abs(c.i-ci),Math.abs(c.j-cj))>KEEP){for(const id of c.ids)this.v99Free(id);S.live.delete(k);}
 // pick next job: world ground and landmarks first, then nearest chunk that is missing or too coarse
 if(!S.job){if(!S.far){const out={};S.job={g:farJob(ch,out),out,done:()=>{const id='terrainV99far_'+tk;this.addMesh(id,out.terrain);S.far=id;}};}
  else if(!S.lm){const out={},self=this;S.job={g:(function*(){out.G=yield*bakeItems(self,landmarkContent(ch).it,false);})(),out,done:()=>{S.lm=[];for(const k in out.G){const id='v99lm_'+k+'_'+tk;this.addMesh(id,out.G[k]);S.lm.push(id);}}};}
  else{let best=null;for(let dj=-LOAD;dj<=LOAD;dj++)for(let di=-LOAD;di<=LOAD;di++){const i=ci+di,j=cj+dj;if(i<0||j<0||i>=N||j>=N)continue;const x0=ORG+i*CS,z0=ORG+j*CS;if(x0>=-CORE&&x0+CS<=CORE&&z0>=-CORE&&z0+CS<=CORE)continue;const ring=Math.max(Math.abs(di),Math.abs(dj)),step=ring<=1?(low?4:2):(low?8:4),k=i+','+j,c=S.live.get(k);if(c&&c.step<=step)continue;const d=ring+(c?.5:0);if(!best||d<best.d)best={d,i,j,step,k,ring};}
   if(best){const{i,j,step,k,ring}=best,out={},self=this,prev=S.live.get(k);S.job={g:(function*(){yield*terrainJob(i,j,step,ch,out);if(!prev||prev.small!==(ring<=1)){out.G=yield*bakeItems(self,chunkContent(i,j,ch).it,ring>1);}})(),out,done:()=>{const ids=[],tid='terrainV99_'+tk+'_'+k+'_'+step;this.addMesh(tid,out.terrain);ids.push(tid);let deco=prev?prev.deco:[];if(out.G){if(prev)for(const id of prev.deco)this.v99Free(id);deco=[];for(const m in out.G){const id='v99c_'+m+'_'+tk+'_'+k+'_'+step;this.addMesh(id,out.G[m]);deco.push(id);}}if(prev)this.v99Free(prev.tid);S.live.set(k,{i,j,step,tid,deco,small:out.G?ring<=1:prev.small,get ids(){return[this.tid,...this.deco];}});}};}}}
 if(!S.upq)S.upq=[];
 if(S.job){const t0=performance.now(),budget=this._v99Budget||(low?1.2:2.0);let r;do r=S.job.g.next();while(!r.done&&performance.now()-t0<budget);
  if(r.done){const cap={up:[],free:[]},am=this.addMesh,fr=this.v99Free;this.addMesh=(k,a)=>cap.up.push([k,a]);this.v99Free=id=>cap.free.push(id);try{S.job.done();}finally{this.addMesh=am;this.v99Free=fr;}S.upq.push(cap);S.job=null;
   if(this._v99Budget){this.v99Upload(1e9);if(--this._v99Spin>0)return this.v99Chunk(state,p);}}}
 this.v99Upload(low?1.0:1.6);
 if(!S.ruins)S.ruins=new Map();if(RU2)for(const RU of Core.RUINS||[]){const d=Math.hypot(px-RU.x,pz-RU.z),have=S.ruins.get(RU.id);
  if(!have&&d<250&&!S.job&&!S.upq.length){const out={},self=this;S.ruins.set(RU.id,{ids:[],lights:[],pending:1});S.job={g:(function*(){out.b=yield*RU2.build(RU,ch);})(),out,done:()=>{const e=S.ruins.get(RU.id);if(!e)return;for(const m in out.b.G)if(out.b.G[m].length){const id='v99r_'+m+'_'+RU.id+'_'+tk;this.addMesh(id,out.b.G[m]);e.ids.push(id);}e.lights=out.b.lights;e.pending=0;}};}
  else if(have&&!have.pending&&d>320){for(const id of have.ids)this.v99Free(id);S.ruins.delete(RU.id);}}
 const put=(id)=>{if(!this.meshes[id])return;const mat=id.split('_')[1],m=MAT[mat]||MAT.rock;this.put(id,0,0,0,1,1,1,m[2],0,m[1],m[3]);};
 if(S.far&&this.meshes[S.far])this.put(S.far,0,0,0,1,1,1,[.86,.815,.80],0,1);
 if(S.lm)for(const id of S.lm)put(id);if(S.ruins){let best=null,bd=28;for(const[,e]of S.ruins){if(!e.ids.length)continue;for(const L of e.lights){if(L.t!=='swing')continue;const dd=Math.hypot(L.x-px,L.z-pz);if(dd<bd){bd=dd;best=e;}}}
  if(best){const t=performance.now()/1000,P=[],C=[];for(const L of best.lights){if(P.length>=12)break;if(L.t==='swing'){const h=Math.sin(t*37+L.x)*Math.sin(t*23.3+L.z),f=h>-.85?1:.2;P.push(L.x+Math.sin(t*1.4+.5)*.16,L.y-1.3,L.z+Math.sin(t*.9)*.08);C.push(.8*f,.45*f,.16*f);}else if(L.t==='lampR'){const f=Math.sin(t*3.2+L.x)>0?1:.35;P.push(L.x,L.y-2.1,L.z);C.push(1.0*f,.12*f,.06*f);}else if(L.t==='lampB'){P.push(L.x,L.y,L.z);C.push(.12,.22,.55);}}
   while(P.length<12){P.push(0,-999,0);C.push(0,0,0);}this.lampPositions=new Float32Array(P);this.lampColors=new Float32Array(C);}}
 {const tgt=RU2&&RU2.inside&&RU2.inside(px,pz)?.32:0;this.fovInside=(this.fovInside||0)+(tgt-(this.fovInside||0))*.08;if(this.fovInside<.002)this.fovInside=0;}
 if(S.ruins){const t=performance.now()/1000;for(const[,e]of S.ruins){for(const id of e.ids)put(id);if(e.ids.length&&this.meshes.v99spark){for(const L of e.lights){const dd=Math.hypot(L.x-px,L.z-pz);if(dd>90)continue;const h=Math.sin(t*37+L.x)*Math.sin(t*23.3+L.z),f=L.t==='mote'?.5+.3*Math.sin(t*1.3+L.x*3):L.t==='alarm'?(Math.sin(t*3.2+L.x)>0?1:.25):L.t==='spark'?(h>.55?1:0):L.t==='flicker'?(.55+.45*Math.sin(t*9+L.x)*Math.sin(t*3.7))*(h>-.8?1:.15):L.t==='beacon'?(Math.sin(t*2.4)>.3?1:.15):.7+.3*Math.sin(t*2);if(f<=0)continue;
   if(L.t==='lampR'||L.t==='lampB'||L.t==='shaftT')continue;if(this.eye&&Math.hypot(L.x-this.eye[0],L.y-this.eye[1],L.z-this.eye[2])<1.3)continue;if(L.t==='shaftA'){if(!this.meshes.mineralGlow)continue;const T=e.lights[e.lights.indexOf(L)+1];if(!T)continue;const dx=T.x-L.x,dy=T.y-L.y,dz=T.z-L.z,hz=Math.hypot(dx,dz),len=Math.hypot(hz,dy),yw=Math.atan2(dx,dz),pt=Math.atan2(-dy,hz),fl=(.85+.15*Math.sin(t*.7+L.x))*(this.eye?Math.min(1,Math.max(0,(Math.hypot((L.x+T.x)/2-this.eye[0],(L.y+T.y)/2-this.eye[1],(L.z+T.z)/2-this.eye[2])-1.5)/2.5)):1);for(const rl of[0,1.5708,3.1416,4.7124]){const mx=(L.x+T.x)/2,my=(L.y+T.y)/2,mz=(L.z+T.z)/2;this.put('mineralGlow',mx,my,mz,.48,1,len*.56,[.35,.62,1.0],yw,22,.34*fl,pt,rl);this.put('mineralGlow',mx,my,mz,.2,1,len*.52,[.55,.75,1.0],yw,22,.30*fl,pt,rl);}this.put('mineralGlow',T.x,T.y+.005,T.z,.8,1,.65,[.35,.6,1.0],yw,22,.34*fl);if(this.meshes.v99spark&&Math.hypot(T.x-px,T.z-pz)<16)for(let k=0;k<4;k++){const u=((t*.06+k*.25+L.x*.1)%1),w=Math.sin(t*.5+k*1.9)*.12;this.put('v99spark',L.x+dx*u+w,L.y+dy*u+Math.cos(t*.4+k)*.08,L.z+dz*u-w,.012,.012,.012,[.7,.85,1.0],0,12,.5*Math.sin(u*3.1416));}continue;}if(L.t==='swing'){const sw=Math.sin(t*1.4+.5)*.16,sw2=Math.sin(t*.9)*.08,lx=L.x+sw,ly=L.y-.6,lz=L.z+sw2;this.put('v99spark',(L.x+lx)/2,(L.y+ly)/2,(L.z+lz)/2,.012,.3,.012,[.1,.1,.12],0,0,0);this.put('v99spark',lx,ly+.03,lz,.06,.03,.06,[.12,.11,.1],0,0,0);this.put('v99spark',lx,ly,lz,.035,.035,.035,[1.0,.6,.22],0,12,(h>-.85?.55:.12));continue;}if(L.t==='mote'){const mx=L.x+Math.sin(t*.31+L.z*5)*.4,my=L.y+Math.sin(t*.23+L.x*2)*.25,mz=L.z+Math.cos(t*.27+L.x)*.4;if(dd>16)continue;for(let k=0;k<3;k++){const ph=k*2.1+L.x;this.put('v99spark',mx+Math.sin(t*.19+ph)*.6,my+Math.sin(t*.13+ph*1.7)*.35,mz+Math.cos(t*.17+ph)*.6,.011,.011,.011,[.85,.8,.72],0,12,.32*f);}continue;}const c=L.t==='alarm'?[1.0,.18,.1]:L.t==='spark'?[1.0,.7,.35]:L.t==='find'?[.35,.8,1.0]:L.t==='beacon'?[1.0,.32,.18]:[1.0,.6,.25],sz=L.t==='alarm'?.05*f:L.t==='spark'?.025:L.t==='find'||L.t==='flicker'?.0:.05;if(sz>0)this.put('v99spark',L.x,L.y,L.z,sz,sz,sz,c,0,12,f*1.2);if(L.t==='spark'&&f>0)for(let k=0;k<3;k++){const a=t*11+k*2.1;this.put('v99spark',L.x+Math.sin(a)*.25*k,L.y-.15*k-(t*3%1)*.5,L.z+Math.cos(a)*.25*k,.03,.03,.03,c,0,12,1.4);}}}}}
 for(const[,c]of S.live){this.put(c.tid,0,0,0,1,1,1,[.86,.815,.80],0,1);for(const id of c.deco)put(id);}};
R.scene=function(state,p,...args){const out=old.scene.call(this,state,p,...args);try{if(state&&p){this.v99Chunk(state,p);if(!this.meshes.v99_ridges&&this.meshes.v40_ridges){const d=this.meshes.v40_ridges.data.slice(),half=d.length/2;for(let i=0;i<d.length;i+=6){const R0=i<half?138:168,r=Math.hypot(d[i],d[i+2]);if(r>R0+5){d[i+1]=-16;d[i]*=1.04;d[i+2]*=1.04;}}this.addMesh('v99_ridges',d);}const hiCam=this.eye&&this.eye[1]-Core.height(this.eye[0],this.eye[2],state.chapter)>26;if(hiCam)this.queue=this.queue.filter(o=>o.shape!=='v40_ridges');for(const o of this.queue)if(o.shape==='v40_ridges'&&!o.v99){o.v99=1;if(this.meshes.v99_ridges)o.shape='v99_ridges';const m=o.m;for(const i of[0,2,8,10])m[i]*=2.0;for(const i of[4,5,6])m[i]*=2.1;m[13]-=7;}}}catch(e){if(!this._v99Warn){this._v99Warn=1;if(typeof console!=='undefined')console.warn('v99 chunks',e);}}return out;};
const oldCam=R.cameraBlocked;R.cameraBlocked=function(x,z,state,alt=0){if(RU2&&RU2.cameraBlocked(x,z,alt))return true;return oldCam?oldCam.call(this,x,z,state,alt):this.blocked.call(this,x,z,state,alt);};
R.blocked=function(x,z,state,alt){if(old.blocked.call(this,x,z,state,alt))return true;if(alt>2)return false;return blockedOuter(x,z,state&&state.chapter)||blockedRuins(x,z);};
})(globalThis);
