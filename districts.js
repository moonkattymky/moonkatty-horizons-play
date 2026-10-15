/* v55 NEW WORLD DISTRICTS: Golden City, Crystal Valley and Anomaly Crater inside the open world (all Lives).
   - layouts are plain data (colliders work without WebGL, so tests can walk them)
   - geometry is built lazily the first time the eye comes near, baked per material into world-space meshes,
     drawn only within DRAW_R of the eye; low quality skips the detail groups
   - a locked district (need = completed Lives) is ringed by a thin energy fence that blocks entry
   - secrets (chests) are opened by the server once per player (/api/district/open); relics are local collectibles
   - fast-travel gates at camp and at every district front; map + compass via Core.districtRegions (game.js) */
(function(root){'use strict';
const R=root.MoonRenderer&&root.MoonRenderer.prototype,Core=root.MoonCore,B=root.MoonOutpostBuilder,M=root.MoonRenderMath;
if(!R||!Core||!B||!Core.DISTRICTS)return;
const old={scene:R.scene,blocked:R.blocked,camera:R.cameraBlocked};
const TAU=Math.PI*2,DRAW_R=62,BUILD_R=68,CAMP=[0,-5],CAMP_GATE=[7,9];
const norm=v=>{const l=Math.hypot(v[0],v[1],v[2])||1;return[v[0]/l,v[1]/l,v[2]/l];},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
function rng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
const MATS={gold:[16,[1,.74,.30]],ivory:[17,[1,.92,.76]],win:[12,[1,.72,.30]],stone:[4,[.62,.58,.52]],dark:[0,[.06,.07,.09]],violet:[30,[.24,.62,1]],amber:[30,[.24,.62,1]],vcore:[12,[.15,.5,1]],acore:[12,[.15,.5,1]],path:[12,[.42,.70,1]],vpath:[12,[.70,.40,1]],rock:[4,[.40,.38,.43]],swirl:[12,[.58,.34,1]],swirl2:[12,[.28,.85,1]],fence:[12,[.40,.80,1]],chest:[0,[.34,.21,.11]],gate:[12,[1,.74,.34]],imp:[12,[1,.72,.32]],impv:[12,[.62,.32,1]]};
const GLOW={ivory:.34,win:1.25,imp:.55,impv:.6,vcore:.8,acore:.75,path:.32,vpath:.34,swirl:.9,swirl2:.85,fence:.55,gate:.45,violet:.2,amber:.3,gold:.3};
// ---------- layout (local: +z faces the camp) ----------
const D={};for(const d of Core.DISTRICTS){const f=[CAMP[0]-d.x,CAMP[1]-d.z],l=Math.hypot(f[0],f[1]);D[d.id]={...d,yaw:Math.atan2(f[0]/l,f[1]/l),cols:[],chests:[],relics:[]};}
const W=(d,lx,lz)=>{const c=Math.cos(d.yaw),s=Math.sin(d.yaw);return[d.x+c*lx+s*lz,d.z-s*lx+c*lz];};
const col=(d,lx,lz,r)=>{const p=W(d,lx,lz);d.cols.push([p[0],p[1],r]);};
const GOLD_SPIRES=[[-8.2,-7.5],[8.2,-7.5],[-8.6,2.8],[8.6,2.8],[-4,-9.8],[4,-9.8]];
const LAYOUT={
 gold:{chests:[[0,6.4],[-5.5,-10.5],[10.5,3.5],[-10.5,4.5]],relics:[[5.5,-10],[-4,9.5],[9,-6.5],[-9,-6.5]]},
 crystal:{chests:[[0,3.6],[-8.5,-5.5],[8,-6.5],[-9,5.5]],relics:[[5.5,8],[-5.5,-9.5],[10,1],[-2.5,-8.5]]},
 anomaly:{chests:[[0,7.6],[-7.5,-3.5],[7.5,-5],[-4,-9.5],[8.5,3.5]],relics:[[4,-8.5],[-9.5,3],[10,-1],[-2,9]]}};
for(const id in D){const d=D[id],L=LAYOUT[id];L.chests.forEach((p,i)=>{const w=W(d,p[0],p[1]);d.chests.push({id:id+'_'+(i+1),x:w[0],z:w[1],big:i===0});col(d,p[0],p[1],.55);});L.relics.forEach((p,i)=>{const w=W(d,p[0],p[1]);d.relics.push({id:id+'_r'+(i+1),x:w[0],z:w[1]});});d.gate=W(d,0,13.8);col(d,-1.55,13.8,.32);col(d,1.55,13.8,.32);}
// Golden City colliders
{const d=D.gold;col(d,0,-1.5,5.9);for(const[x,z]of GOLD_SPIRES)col(d,x,z,1.15);d.houses=[];const avoid=[...LAYOUT.gold.chests,...LAYOUT.gold.relics];for(let i=0;i<9;i++){const a=Math.PI*(1.08+i*.105),hx=Math.cos(a)*13.6,hz=Math.sin(a)*13.6;if(avoid.some(q=>Math.hypot(q[0]-hx,q[1]-hz)<3.6))continue;d.houses.push([hx,hz,1.9+(i%3)*.35]);col(d,hx,hz,2.3+(i%3)*.35);}for(const z of[8.5,11.5])for(const x of z>10?[-3.4,3.4]:[-2.7,2.7])col(d,x,z,.6);}
// Crystal Valley colliders (+ the field list used by the builder)
{const d=D.crystal;col(d,0,0,3.3);const r=rng(5501),free=[...LAYOUT.crystal.chests,...LAYOUT.crystal.relics];d.field=[];
 for(let i=0;i<160&&d.field.length<26;i++){const a=r()*TAU,rad=5+r()*6.3,lx=Math.cos(a)*rad,lz=Math.sin(a)*rad,sc=.8+r()*.7+(rad>10?.4:0);if(Math.abs(lx)<3.4&&lz>1)continue;if(Math.abs(rad-8.2)<1.1)continue;if(free.some(p=>Math.hypot(p[0]-lx,p[1]-lz)<2.6))continue;if(d.field.some(p=>Math.hypot(p[0]-lx,p[1]-lz)<2.5+sc*.6))continue;d.field.push([lx,lz,sc,i%2?'amber':'violet',r()*TAU]);col(d,lx,lz,.55*sc+.3);}}
// Anomaly Crater colliders
{const d=D.anomaly;col(d,0,0,4.2);for(let i=0;i<9;i++){const a=i/9*TAU+.35;if(Math.abs(Math.atan2(Math.sin(a),Math.cos(a))-Math.PI/2)<.5)continue;col(d,Math.cos(a)*11.6,Math.sin(a)*11.6,1.15);}}
// ---------- state helpers ----------
const _x=0;const lives=s=>Core.districtLives?Core.districtLives(s):0,isOpen=(d,s)=>lives(s)>=d.need;
function insideCols(x,z,s){for(const id in D){const d=D[id],dd=Math.hypot(x-d.x,z-d.z);if(dd>d.r+3)continue;if(!isOpen(d,s)&&Math.abs(dd-d.lock)<.55)return true;for(const[cx,cz,r]of d.cols)if(Math.hypot(x-cx,z-cz)<r)return true;}if(Math.hypot(x-CAMP_GATE[0]-1.55,z-CAMP_GATE[1])<.32||Math.hypot(x-CAMP_GATE[0]+1.55,z-CAMP_GATE[1])<.32)return true;return false;}
R.blocked=function(x,z,state,alt=0){if(state&&alt<2.2&&insideCols(x,z,state))return true;return old.blocked.call(this,x,z,state,alt);};
if(old.camera)R.cameraBlocked=function(x,z,state,alt=0){if(state&&alt<1.2&&insideCols(x,z,state))return true;return old.camera.call(this,x,z,state,alt);};
// ---------- geometry ----------
function grp(map,mat){let g=map.get(mat);if(!g)map.set(mat,g=[]);return g;}
function tri(map,mat,a,b,c){const n=norm(cross(sub(b,a),sub(c,a)));grp(map,mat).push(...a,...n,...b,...n,...c,...n);}
function bake(map,b,x,y,z,yaw=0){const c=Math.cos(yaw),s=Math.sin(yaw);for(const[mat,data]of b.groups){const g=grp(map,mat);for(let i=0;i<data.length;i+=6){const px=data[i],py=data[i+1],pz=data[i+2],nx=data[i+3],ny=data[i+4],nz=data[i+5];g.push(x+c*px+s*pz,y+py,z-s*px+c*pz,c*nx+s*nz,ny,-s*nx+c*nz);}}}
function xform(dst,data,x,y,z,sx,sy,sz,yaw){const c=Math.cos(yaw),s=Math.sin(yaw);for(let i=0;i<data.length;i+=6){const px=data[i]*sx,py=data[i+1]*sy,pz=data[i+2]*sz,n=norm([data[i+3]/sx,data[i+4]/sy,data[i+5]/sz]);dst.push(x+c*px+s*pz,y+py,z-s*px+c*pz,c*n[0]+s*n[2],n[1],-s*n[0]+c*n[2]);}}
function prism(map,mat,coreMat,x,y,z,r,h,yaw,pitch,roll,rnd){r*=.7;/* v80 thinner */const k=6,rad=[];for(let i=0;i<k;i++)rad.push(r*(.78+rnd()*.38));const tip=h*(.24+rnd()*.1),bev=h-tip,m=M?M.model(x,y,z,1,1,1,yaw,pitch,roll):null,T=p=>m?[m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]]:[x+p[0],y+p[1],z+p[2]];
 const ring=(yy,sc,rr0)=>rr0.map((rr,i)=>{const t=i/k*TAU;return T([Math.cos(t)*rr*sc,yy,Math.sin(t)*rr*sc]);}),b0=ring(-.15,1,rad),top=ring(bev,.9,rad),apex=T([0,h,0]);
 for(let i=0;i<k;i++){const n=(i+1)%k;tri(map,mat,b0[i],top[n],top[i]);tri(map,mat,b0[i],b0[n],top[n]);tri(map,mat,top[i],top[n],apex);}
 if(coreMat){const cr=rad.map(v=>v*.4),c0=ring(.05,1,cr),c1=ring(bev*.8,1,cr),ca=T([0,bev+tip*.5,0]);for(let i=0;i<k;i++){const n=(i+1)%k;tri(map,coreMat,c0[i],c1[n],c1[i]);tri(map,coreMat,c0[i],c0[n],c1[n]);tri(map,coreMat,c1[i],c1[n],ca);}}}
function cluster(map,mat,coreMat,x,y,z,sc,seed){const rnd=rng(seed);prism(map,mat,coreMat,x,y,z,.28*sc,(1.8+rnd()*.6)*sc,rnd()*TAU,(rnd()-.5)*.14,(rnd()-.5)*.14,rnd);
 for(let i=0;i<4;i++){const t=i/4*TAU+rnd()*.7,dd=(.3+rnd()*.15)*sc,tl=.3+rnd()*.25;prism(map,mat,coreMat,x+Math.cos(t)*dd,y,z+Math.sin(t)*dd,(.14+rnd()*.06)*sc,(.8+rnd()*.6)*sc,rnd()*TAU,Math.sin(t)*tl,-Math.cos(t)*tl,rnd);}}
// terrain-following glowing strip along a polyline of world points
function strip(map,mat,r,ch,pts,w){for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz)||1,nx=-dz/l*w/2,nz=dx/l*w/2,steps=Math.max(1,Math.ceil(l/1.2));for(let j=0;j<steps;j++){const t0=j/steps,t1=(j+1)/steps,P=(t,s)=>{const x=a[0]+dx*t+nx*s,z=a[1]+dz*t+nz*s;return[x,r.terrain(x,z,ch)+.035,z];};const p0=P(t0,-1),p1=P(t1,-1),p2=P(t1,1),p3=P(t0,1);grp(map,mat).push(...p0,0,1,0,...p2,0,1,0,...p1,0,1,0,...p0,0,1,0,...p3,0,1,0,...p2,0,1,0);}}}
const ground=(r,ch,x,z)=>r.terrain(x,z,ch);
function lantern(b,x,y,z,mat='gold'){b.tube(mat,[x,y,z],[x,y+2.2,z],.07,8);b.box('win',x,y+2.35,z,.26,.32,.26);b.tube(mat,[x,y+2.5,z],[x,y+2.68,z],.16,8,.02);}
function buildGold(r,ch,d){const main=new Map(),det=new Map();
 const place=(map,b,lx,lz,yaw=0,dy=0)=>{const w=W(d,lx,lz);bake(map,b,w[0],ground(r,ch,w[0],w[1])-.1+dy,w[1],d.yaw+yaw);};
 // palace: drum with glowing windows and gold columns, golden onion dome, lantern, spire
{const b=new B();b.shell('ivory',[[1,0],[1,.55],[.96,.6],[.96,1]],5.5,4.6);b.shell('gold',[[1.02,.52],[1.02,.6]],5.5,4.6);b.shell('gold',[[.99,.97],[1.03,1]],5.5,4.6);b.shell('dark',[[1.01,0],[1.01,.04]],5.5,1);
  for(let i=0;i<20;i++){const a=i/20*TAU;for(const y of[1.5,3.4])b.box('win',Math.sin(a)*5.53,y,Math.cos(a)*5.53,.62,1.1,.08,a);b.tube('gold',[Math.sin(a+.16)*5.7,0,Math.cos(a+.16)*5.7],[Math.sin(a+.16)*5.7,4.6,Math.cos(a+.16)*5.7],.17,8);}
  place(main,b,0,-1.5);const dome=new B();dome.shell('ivory',[[1,0],[1,1]],4.6,1.4);for(let i=0;i<16;i++){const a=i/16*TAU;dome.box('win',Math.sin(a)*4.62,.8,Math.cos(a)*4.62,.5,.7,.08,a);}const on=new B();on.shell('gold',[[.98,0],[1.08,.16],[1.02,.42],[.82,.66],[.5,.86],[.18,.97],[0,1]],4.7,7);on.tube('gold',[0,6.8,0],[0,11.5,0],.32,10,.02);on.box('win',0,7.3,0,.7,.7,.7);place(main,dome,0,-1.5,0,4.5);place(main,on,0,-1.5,0,5.8);}
 // four spires with glowing window bands and gold tips
 GOLD_SPIRES.forEach(([x,z],k)=>{const b=new B(),h=k>=4?13:9.5+(k%2)*1.8,r0=k>=4?.9:.85;b.tube('ivory',[0,0,0],[0,h,0],r0,12,r0*.75);for(const y of[2.4,h*.55,h-1.7])for(let i=0;i<8;i++){const a=i/8*TAU;b.box('win',Math.sin(a)*r0*.9,y,Math.cos(a)*r0*.9,.22,.62,.06,a);}
  b.tube('gold',[0,h,0],[0,h+.5,0],r0*.95,12,r0*.95);b.tube('gold',[0,h+.5,0],[0,h+5.2,0],r0*.95,12,.02);b.box('win',0,h+.9,0,.3,.3,.3);place(main,b,x,z);});
 // small domed houses
 for(const[x,z,hr]of d.houses){const b=new B(),hh=hr*1.3;b.shell('ivory',[[1,0],[1,1]],hr,hh);for(let i=0;i<6;i++){const a=i/6*TAU+.4;b.box('win',Math.sin(a)*hr*1.01,hh*.5,Math.cos(a)*hr*1.01,.5,.75,.06,a);}place(main,b,x,z);
  const b2=new B();b2.shell('gold',[[1.04,0],[.9,.45],[.54,.85],[0,1]],hr,hr*1.1);b2.tube('gold',[0,hr*1.05,0],[0,hr*1.05+1.2,0],.09,6,.01);place(main,b2,x,z,0,hh);}
 // avenue of golden arches with lanterns
 for(const z of[8.5,11.5]){const b=new B(),big=z>10,hw=big?3.4:2.7,ph=big?6:4.4;for(const x of[-hw,hw]){b.tube('gold',[x,0,0],[x,.35,0],.62,16,.56);b.tube('ivory',[x,.35,0],[x,ph-.2,0],.46,16,.36);for(const y of[ph*.33,ph*.66])b.tube('gold',[x,y-.07,0],[x,y+.07,0],.47,16,.43);b.tube('gold',[x,ph-.2,0],[x,ph+.25,0],.38,16,.6);if(big){b.tube('gold',[x,ph+.25,0],[x,ph+3.2,0],.4,10,.02);}}const seg=14;for(let i=0;i<seg;i++){const a0=i/seg*Math.PI,a1=(i+1)/seg*Math.PI;b.tube('gold',[Math.cos(a0)*hw,ph+.2+Math.sin(a0)*hw*.8,0],[Math.cos(a1)*hw,ph+.2+Math.sin(a1)*hw*.8,0],big?.32:.24,8);}b.box('win',0,ph+.2+hw*.8,0,.5,.5,.5);place(main,b,0,z);}
 {const b=new B();for(const z of[7,10,13])for(const x of[-4.6,4.6])lantern(b,x,0,z);place(main,b,0,0);}
 // golden path from the front gate to the palace + ring around the plaza
 const pts=[];for(let z=14;z>=4.5;z-=1.5)pts.push(W(d,0,z));strip(main,'win',r,ch,pts,1.8);const ring=[];for(let i=0;i<=40;i++){const a=i/40*TAU;ring.push(W(d,Math.cos(a)*7.4,-1.5+Math.sin(a)*7.4));}strip(main,'win',r,ch,ring,.4);
 return{main,det};}
function buildCrystal(r,ch,d){const main=new Map(),det=new Map(),w0=W(d,0,0),y0=ground(r,ch,w0[0],w0[1]);
 // landmark: a giant violet spire with amber satellites
 {const rnd=rng(77);prism(main,'violet','vcore',w0[0],y0-.3,w0[1],1.8,15,.3,0,0,rnd);for(let i=0;i<7;i++){const a=i/7*TAU+.4,x=w0[0]+Math.cos(a)*2.2,z=w0[1]+Math.sin(a)*2.2;prism(main,i%2?'amber':'violet',i%2?'acore':'vcore',x,ground(r,ch,x,z)-.2,z,.8,5.5+rnd()*4,rnd()*TAU,Math.sin(a)*.32,-Math.cos(a)*.32,rnd);}}
 // crystal fields
 d.field.forEach(([lx,lz,sc,mat,yaw],i)=>{const w=W(d,lx,lz);cluster(i%4===3?det:main,mat,mat==='amber'?'acore':'vcore',w[0],ground(r,ch,w[0],w[1])-.15,w[1],sc*2.3,900+i);});
 // shards scattered on the ground (detail)
 {const rnd=rng(912);for(let i=0;i<26;i++){const a=rnd()*TAU,rad=3+rnd()*11,w=W(d,Math.cos(a)*rad,Math.sin(a)*rad);prism(det,rnd()<.5?'amber':'violet',null,w[0],ground(r,ch,w[0],w[1])-.05,w[1],.09,.35+rnd()*.3,rnd()*TAU,(rnd()-.5)*.8,(rnd()-.5)*.8,rnd);}}
 // glowing paths: front lane + loop + three spokes
 const lane=[];for(let z=14;z>=2.6;z-=1.4)lane.push(W(d,0,z));strip(main,'path',r,ch,lane,1.1);const loop=[];for(let i=0;i<=44;i++){const a=i/44*TAU;loop.push(W(d,Math.cos(a)*8.2,Math.sin(a)*8.2));}strip(main,'vpath',r,ch,loop,.7);
 for(const a of[-2.2,-.9,.9+Math.PI]){const sp=[];for(let k=2.6;k<=8.2;k+=1.4)sp.push(W(d,Math.cos(a)*k,Math.sin(a)*k));strip(det,'path',r,ch,sp,.5);}
 return{main,det};}
function buildAnomaly(r,ch,d){const main=new Map(),det=new Map(),rocks=r.meshes&&r.meshes.geology0?['geology0','geology1','geology2'].map(k=>r.meshes[k].data):null;
 // boulder ring around the crater (gap toward the camp)
 if(rocks){const rnd=rng(4411);let n=0;for(const[cx,cz,rr]of D.anomaly.cols){if(rr<1||rr>2)continue;const g=grp(main,'rock');xform(g,rocks[(n++)%3],cx,ground(r,ch,cx,cz)-.25,cz,1.5+rnd()*.5,1.3+rnd()*.8,1.4+rnd()*.5,rnd()*TAU);}}
 // inner glowing cracks: radial strips toward the swirl
 for(let i=0;i<7;i++){const a=i/7*TAU+.2,pts=[];for(let k=3.4;k<=10;k+=1.1){const j=Math.sin(k*1.7+i)*.5;pts.push(W(d,Math.cos(a)*k+Math.sin(a)*j,Math.sin(a)*k-Math.cos(a)*j));}strip(i%2?det:main,i%2?'swirl2':'swirl',r,ch,pts,.28);}
 for(let arm=0;arm<4;arm++){const pts=[];for(let k=0;k<=24;k++){const rr=4.4+k*.32,a=arm/4*TAU+k*.22;pts.push(W(d,Math.cos(a)*rr,Math.sin(a)*rr));}strip(main,arm%2?'swirl2':'swirl',r,ch,pts,.45);}
 // warning beacons (amber posts with lamps)
 {const b=new B();for(const[x,z]of[[-4,12.4],[4,12.4],[-12.8,0],[12.8,0]]){b.tube('stone',[x,0,z],[x,1.6,z],.12,8);b.box('acore',x,1.75,z,.3,.3,.3);}const w=W(d,0,0);bake(det,b,w[0],ground(r,ch,w[0],w[1]),w[1],d.yaw);}
 return{main,det};}
function unitMeshes(r){if(r.v55u)return r.v55u;const U={};
 const add=(k,b)=>{U[k]=[];for(const[mat,data]of b.groups){if(!data.length)continue;const key='v55u_'+k+'_'+mat;r.addMesh(key,data);U[k].push([key,mat]);}};
 {const b=new B();b.box('chest',0,.3,0,1.05,.6,.72);b.box('gold',0,.3,.37,.18,.36,.04);for(const x of[-.53,.53])b.box('gold',x,.3,0,.05,.62,.74);add('chest',b);}
 {const b=new B();b.box('chest',0,.74,0,1.07,.28,.74);b.box('gold',0,.74,0,1.1,.06,.76);add('lid',b);}
 {const b=new B();b.box('win',0,.62,0,.9,.06,.6);add('loot',b);}
 {const b=new B();b.tube('gold',[0,0,-.05],[0,0,.05],.34,16);b.paw(0,-.02,.06,.5,'win');add('relic',b);}
 {const b=new B();for(const x of[-1.55,1.55]){b.tube('gold',[x,0,0],[x,.3,0],.34,12,.3);b.tube('ivory',[x,.3,0],[x,2.5,0],.22,12,.18);b.tube('gold',[x,2.5,0],[x,2.7,0],.2,12,.3);}const seg=14;for(let i=0;i<seg;i++){const a0=i/seg*Math.PI,a1=(i+1)/seg*Math.PI;b.tube('gold',[Math.cos(a0)*1.55,2.6+Math.sin(a0)*1.1,0],[Math.cos(a1)*1.55,2.6+Math.sin(a1)*1.1,0],.14,8);}add('gateFrame',b);
  const g=new B();const n=28;for(let i=0;i<n;i++){const a0=i/n*TAU,a1=(i+1)/n*TAU;g.tube('gate',[Math.cos(a0)*1.22,2.2+Math.sin(a0)*1.32,0],[Math.cos(a1)*1.22,2.2+Math.sin(a1)*1.32,0],.06,6);}add('gateGlow',g);}
 {const b=new B();b.tube('fence',[0,0,0],[0,2.2,0],.06,6);b.box('fence',0,2.25,0,.16,.16,.16);add('pylon',b);}
 // anomaly swirl: three tilted glowing rings and a core
 {const b=new B();const n=28;for(let i=0;i<n;i++){const a0=i/n*TAU,a1=(i+1)/n*TAU;b.tube('swirl',[Math.cos(a0)*2.4,0,Math.sin(a0)*2.4],[Math.cos(a1)*2.4,Math.sin(a1*3)*.12,Math.sin(a1)*2.4],.09,6);}add('ringA',b);
  const c=new B();for(let i=0;i<n;i++){const a0=i/n*TAU,a1=(i+1)/n*TAU;c.tube('swirl2',[Math.cos(a0)*1.6,0,Math.sin(a0)*1.6],[Math.cos(a1)*1.6,0,Math.sin(a1)*1.6],.07,6);}add('ringB',c);
  const k=new B(),pts=[[0,1,0],[1,0,0],[0,0,1],[-1,0,0],[0,0,-1],[0,-1,0]],f=[[0,1,2],[0,2,3],[0,3,4],[0,4,1],[5,2,1],[5,3,2],[5,4,3],[5,1,4]];for(const[a,b2,cc]of f)k.tri('swirl',pts[a].map(v=>v*.7),pts[cc].map(v=>v*.7),pts[b2].map(v=>v*.7));add('core',k);}
 return r.v55u=U;}
function impostor(r,id){r.v55i=r.v55i||{};if(r.v55i[id])return r.v55i[id];const b=new B();
 if(id==='gold'){b.shell('imp',[[1,0],[1,.4],[.9,.55],[.6,.8],[0,1]],5.5,12);for(const[x,z]of GOLD_SPIRES)b.tube('imp',[x,0,z],[x,15,z],.9,6,.05);b.tube('imp',[0,10,-1.5],[0,18,-1.5],.4,6,.02);}
 else if(id==='crystal'){const rnd=rng(31);for(let i=0;i<9;i++){const a=i/9*TAU,rr=i?4+rnd()*6:0;b.tube(i%2?'imp':'impv',[Math.cos(a)*rr,0,Math.sin(a)*rr],[Math.cos(a)*rr*1.1,i?5+rnd()*5:16,Math.sin(a)*rr*1.1],i?1.1:2,5,.05);}}
 else{for(let j=0;j<3;j++){const n=16,rr=5.5-j*1.3,y=6+j*1.2;for(let i=0;i<n;i++){const a0=i/n*TAU,a1=(i+1)/n*TAU;b.tube('impv',[Math.cos(a0)*rr,y,Math.sin(a0)*rr],[Math.cos(a1)*rr,y+.3,Math.sin(a1)*rr],.25,4);}}b.tube('impv',[0,3.5,0],[0,8.5,0],1.6,6,.1);}
 const L=[];for(const[mat,data]of b.groups){const key='v55i_'+id+'_'+mat;r.addMesh(key,data);L.push([key,mat]);}return r.v55i[id]=L;}
const BUILDERS={gold:buildGold,crystal:buildCrystal,anomaly:buildAnomaly};
function build(r,id,ch){r.v55=r.v55||{};const k=id+':'+ch;if(r.v55[k])return r.v55[k];const d=D[id],g=BUILDERS[id](r,ch,d),L={main:[],det:[]};
 for(const part of['main','det'])for(const[mat,data]of g[part]){if(!data.length)continue;const key='v55_'+id+ch+'_'+part+'_'+mat;r.addMesh(key,data);L[part].push([key,mat]);}
 // floating rocks (anomaly) and fence pylons
 L.rocks=[];if(id==='anomaly'&&r.meshes.geology0){const rnd=rng(66);for(let i=0;i<11;i++){const a=i/11*TAU+.3,rad=5+rnd()*5,w=W(d,Math.cos(a)*rad,Math.sin(a)*rad);L.rocks.push({x:w[0],z:w[1],y:ground(r,ch,w[0],w[1])+3+rnd()*6,s:1.1+rnd()*1.5,mesh:'geology'+(i%3),ph:rnd()*TAU});}}
 L.pylons=[];for(let i=0;i<24;i++){const a=i/24*TAU,x=d.x+Math.cos(a)*d.lock,z=d.z+Math.sin(a)*d.lock;L.pylons.push([x,ground(r,ch,x,z)-.05,z]);}
 const w=W(d,0,0);L.y0=ground(r,ch,w[0],w[1]);
 L.cast=id==='crystal'?[{x:w[0],z:w[1],r:1.4,h:12,k:1},...d.field.map(([lx,lz,sc])=>{const q=W(d,lx,lz);return{x:q[0],z:q[1],r:.75*sc,h:2.8*sc,k:1};})]:[];return r.v55[k]=L;}
function drawList(r,list,t,mul=1){for(const[key,mat]of list){const[kind,c]=MATS[mat]||[0,[.5,.5,.5]];const g=(GLOW[mat]||0)*(mat==='win'?1+.08*Math.sin(t*1.3):mat==='swirl'||mat==='swirl2'?.8+.25*Math.sin(t*2.1):1)*mul;r.put(key,0,0,0,1,1,1,c,0,kind,g);}}
const view={opened:[],relics:[]};
R.scene=function(state,p,t,...args){const out=old.scene.call(this,state,p,t,...args);if(!state)return out;const ch=state.chapter||1,eye=this.eye||[p?p.x:0,0,p?p.z:0],low=this.quality==='low',U=unitMeshes(this);
 for(const id in D){const d=D[id],dist=Math.hypot(eye[0]-d.x,eye[2]-d.z);if(dist>DRAW_R-2&&dist<215){const y=this.terrain(d.x,d.z,ch)-.2,f=Math.min(1,(dist-DRAW_R+2)/10);for(const[k,m]of impostor(this,id)){const[kind,cc]=MATS[m];this.put(k,d.x,y,d.z,1,1,1,cc,d.yaw,kind,GLOW[m]*f);}}if(dist>BUILD_R||dist>DRAW_R){if(this.v76Cast)this.v76Cast.delete(id);if(dist>BUILD_R)continue;}const L=build(this,id,ch);if(dist>DRAW_R)continue;
  drawList(this,L.main,t);if(!low)drawList(this,L.det,t);(this.v76Cast=this.v76Cast||new Map()).set(id,L.cast||[]);
  if(!isOpen(d,state))for(const[x,y,z]of L.pylons)for(const[k,m]of U.pylon){const[kind,cc]=MATS[m];this.put(k,x,y,z,1,1,1,cc,0,kind,.45+.2*Math.sin(t*2+x));}
  for(const c of d.chests){const y=this.terrain(c.x,c.z,ch)-.02,done=view.opened.includes(c.id),s=c.big?1.25:1;for(const[k,m]of U.chest){const[kind,cc]=MATS[m];this.put(k,c.x,y,c.z,s,s,s,cc,d.yaw,kind,m==='gold'?.1:0);}
   if(!done){for(const[k,m]of U.lid){const[kind,cc]=MATS[m];this.put(k,c.x,y,c.z,s,s,s,cc,d.yaw,kind,m==='gold'?.1:0);}for(const[k,m]of U.loot){const[kind,cc]=MATS[m];this.put(k,c.x,y+.25+.06*Math.sin(t*2.4+c.x),c.z,s,s,s,cc,d.yaw,kind,.75+.25*Math.sin(t*3+c.z));}}}
  for(const rl of d.relics){if(view.relics.includes(rl.id))continue;const y=this.terrain(rl.x,rl.z,ch)+1.0+.12*Math.sin(t*2+rl.x);for(const[k,m]of U.relic){const[kind,cc]=MATS[m];this.put(k,rl.x,y,rl.z,1,1,1,cc,t*1.6+rl.z,kind,m==='win'?.8:.12);}}
  const gy=this.terrain(d.gate[0],d.gate[1],ch);for(const[k,m]of[...U.gateFrame,...U.gateGlow]){const[kind,cc]=MATS[m];this.put(k,d.gate[0],gy-.05,d.gate[1],1,1,1,cc,d.yaw,kind,m==='gate'?.45+.2*Math.sin(t*2.6):m==='gold'?.08:0);}
  if(id==='anomaly'){const y=L.y0+6;for(const[k,m]of U.ringA){const[kind,cc]=MATS[m];for(let j=0;j<5;j++){const sc=2.6-j*.38;this.put(k,d.x,y-2.6+j*1.15,d.z,sc,sc,sc,cc,t*(.7+j*.25)*(j%2?-1:1),kind,.95,.3*Math.sin(j*1.3),.25*Math.cos(j*1.7));}}for(const[k,m]of U.ringB){const[kind,cc]=MATS[m];for(let j=0;j<3;j++)this.put(k,d.x,y-1.5+j*1.4,d.z,1.9-j*.3,1.9-j*.3,1.9-j*.3,cc,t*(1.5+j*.4),kind,.9,.15+j*.2,-.5+j*.3);}
   for(const[k,m]of U.core){const[kind,cc]=MATS[m];const s=1.6+.25*Math.sin(t*3.1);this.put(k,d.x,y,d.z,s,s*1.4,s,cc,t*.6,kind,1.2);}
   for(const rk of L.rocks){const[kind,cc]=MATS.rock;this.put(rk.mesh,rk.x,rk.y+.35*Math.sin(t*.8+rk.ph),rk.z,rk.s,rk.s*.8,rk.s,cc,t*.15+rk.ph,kind,0,.2*Math.sin(rk.ph),.15);}}}
 // camp gate
 if(Math.hypot(eye[0]-CAMP_GATE[0],eye[2]-CAMP_GATE[1])<DRAW_R){const gy=this.terrain(CAMP_GATE[0],CAMP_GATE[1],ch);for(const[k,m]of[...U.gateFrame,...U.gateGlow]){const[kind,cc]=MATS[m];this.put(k,CAMP_GATE[0],gy-.05,CAMP_GATE[1],1,1,1,cc,0,kind,m==='gate'?.45+.2*Math.sin(t*2.6):m==='gold'?.08:0);}}
 return out;};
root.MoonDistricts={D,CAMP_GATE,view,lives,isOpen,insideCols,W};
// ---------- UI: discovery, secrets, relics, gates ----------
if(typeof document!=='undefined')(function(){const KEY='moonkatty-districts-v55',T=(k,p)=>root._t?root._t(k,p):k,$=q=>document.querySelector(q);
 let mem={seen:[],relics:[]};try{mem={...mem,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch{}view.relics=mem.relics;
 const keep=()=>{try{localStorage.setItem(KEY,JSON.stringify(mem));}catch{}},G=()=>root.MoonGame,UI=()=>root.MoonGrowthUI,toast=t=>G()&&G().toast&&G().toast(t);
 let act=null,target=null,busy=false,warn={},synced=false;
 const name=id=>T('dist.'+id),stats=d=>T('dist.progress',{a:d.chests.filter(c=>view.opened.includes(c.id)).length,b:d.chests.length,c:d.relics.filter(r=>view.relics.includes(r.id)).length,d:d.relics.length});
 function mount(){if(act)return;act=document.createElement('button');act.type='button';act.id='ds-act';act.className='dm-act ds-act';act.hidden=true;act.onclick=()=>{if(!target)return;if(target.kind==='chest')openChest(target.c);else travel(target.from);};(document.getElementById('app-viewport')||document.body).append(act);}
 async function sync(){const ui=UI();if(!ui||!ui.online||synced)return;synced=true;try{const r=await ui.api('/api/districts',{});view.opened=r.districts.opened||[];}catch{synced=false;}}
 function grantLocal(r){const Gr=root.MoonGrowth,g=G();if(r&&Gr&&Gr.applyServerReward&&Gr.applyServerReward(g.state,r)){g.save();g.hud();}}
 async function openChest(c){const ui=UI();if(busy)return;if(!ui||!ui.online){toast(T('dist.offline'));return;}busy=true;
  try{const r=await ui.api('/api/district/open',{id:c.id});view.opened=r.districts.opened||view.opened;if(!view.opened.includes(c.id))view.opened.push(c.id);
   if(r.reward){grantLocal(r.reward);toast(T('dist.got',{p:r.reward.points+(r.reward.pending||0),c:r.reward.crystals,m:r.reward.metal}));try{root.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');}catch{}}else toast(T('dist.already'));}
  catch(e){toast(e&&e.code==='district_locked'?T('dist.locked',{name:name(c.id.split('_')[0]),n:D[c.id.split('_')[0]].need}):T('dist.offline'));}busy=false;}
 function travel(from){let d=document.getElementById('ds-travel');if(!d){d=document.createElement('dialog');d.id='ds-travel';d.className='growth-dialog ds-travel';(document.getElementById('app-viewport')||document.body).append(d);d.addEventListener('click',e=>{if(e.target===d)d.close();});}
  const g=G(),s=g.state,list=[{id:'camp',name:T('dist.camp'),to:[CAMP_GATE[0],CAMP_GATE[1]-2.6],open:true,sub:''},...Object.values(D).map(x=>{const w=W(x,0,11.6);return{id:x.id,name:name(x.id),to:w,open:isOpen(x,s),sub:isOpen(x,s)?stats(x):T('dist.locked_short',{n:x.need})};})].filter(x=>x.id!==from);
  d.innerHTML=`<div class="g-head"><div><span class="eyebrow">${T('dist.gate')}</span><h2>${T('dist.travel_title')}</h2></div><button class="close-icon" data-x aria-label="×">×</button></div><p class="ds-sub">${T('dist.travel_sub')}</p>`+list.map(x=>`<button type="button" class="ds-dest" data-id="${x.id}" ${x.open?'':'disabled'}><b>${x.name}</b><small>${x.sub}</small></button>`).join('');
  d.querySelector('[data-x]').onclick=()=>d.close();d.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{const x=list.find(q=>q.id===b.dataset.id);if(!x||!x.open)return;const p=g.player;p.x=x.to[0];p.z=x.to[1];p.alt=0;d.close();g.save&&g.save();toast(T('dist.arrived',{name:x.name}));});
  document.querySelectorAll('dialog[open]').forEach(x=>{if(x!==d)x.close();});g.resetControls&&g.resetControls();d.showModal();}
 function tick(){const g=G();if(!g||!g.player||!g.state)return;mount();sync();const p=g.player,s=g.state,now=Date.now();let best=null;
  for(const id in D){const d=D[id],dd=Math.hypot(p.x-d.x,p.z-d.z),open=isOpen(d,s);
   if(open&&dd<d.r&&!mem.seen.includes(id)){mem.seen.push(id);keep();toast(T('dist.discovered',{name:name(id)})+' · '+T('dist.'+id+'_sub'));}
   if(!open&&dd<d.lock+3&&dd>d.lock-1&&!(warn[id]>now)){warn[id]=now+6000;toast(T('dist.locked',{name:name(id),n:d.need}));}
   if(id==='anomaly'&&open&&dd<5.8&&dd>.01){p.x=d.x+(p.x-d.x)/dd*6;p.z=d.z+(p.z-d.z)/dd*6;if(!(warn.push>now)){warn.push=now+8000;toast(T('dist.danger'));}}
   if(!open||dd>d.r+2)continue;
   for(const r of d.relics)if(!view.relics.includes(r.id)&&Math.hypot(p.x-r.x,p.z-r.z)<1.7){view.relics.push(r.id);mem.relics=view.relics;keep();toast(T('dist.relic',{n:d.relics.filter(q=>view.relics.includes(q.id)).length,t:d.relics.length})+' · '+name(id));try{root.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');}catch{}}
   for(const c of d.chests){const k=Math.hypot(p.x-c.x,p.z-c.z);if(k<2.4&&!view.opened.includes(c.id)&&(!best||k<best.k))best={kind:'chest',c,k};}
   const kg=Math.hypot(p.x-d.gate[0],p.z-d.gate[1]);if(kg<2.9&&(!best||kg<best.k))best={kind:'gate',from:id,k:kg};}
  const kc=Math.hypot(p.x-CAMP_GATE[0],p.z-CAMP_GATE[1]);if(kc<2.9&&(!best||kc<best.k))best={kind:'gate',from:'camp',k:kc};
  target=best;if(act){act.hidden=!best||!!document.querySelector('dialog[open]');if(best)act.textContent=best.kind==='chest'?'✦ '+T('dist.open'):'⛩ '+T('dist.gate');}}
 setInterval(tick,250);
 root.MoonDistricts.ui={tick,travel,openChest,sync,mem};})();

})(typeof window!=='undefined'?window:globalThis);
