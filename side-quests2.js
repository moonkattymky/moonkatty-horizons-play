/* side-quests2.js — stage 2 side quests (local progress; Moon Points are decided by the server via side-quests.js).
   ① dome scanner (hot/cold): a HUD scanner pulses faster/warmer near a hidden crew crystal; it shows up very close, then pick it up.
   ② station power, 'Runaway spark': a living energy orb escaped from the generator and darts around the station; it flees when
      the cat is near, tires out, gets caught (Pick up), squirms and tugs the cat sideways, and goes back into the generator → lights on.
   ③ hangar crates: carry 3 crates, stack them (2-high + a step) and jump onto the high shelf to take the blueprint.
   Pure logic in MoonSide2.logic (tests/side-quests2.cjs). */
(function(root){
'use strict';
const frame=(x,z,yaw)=>{const c=Math.cos(yaw),s=Math.sin(yaw);return{x,z,yaw,W:(lx,lz)=>[x+c*lx+s*lz,z-s*lx+c*lz],L:(wx,wz)=>{const dx=wx-x,dz=wz-z;return[c*dx-s*dz,s*dx+c*dz];}};};
const ST=frame(-165,55,-.3),DM=frame(-120,-155,0),HG=frame(60,-195,.9);
const CRYSTAL=DM.W(8.6,-7.2);            // behind the dome, under a thin shaft of light
const PANEL=ST.W(-4.6,-3.0),GEN=PANEL;    // the generator: inside the station, by the back wall
const CRATE=.8,CH=.42,SHELF={x0:-.9,x1:.9,z0:-7.5,z1:-5.5,top:2.3},BP=HG.W(0,-6.8);
const PADS=[{a:.4,b:-4.7,max:1},{a:.4,b:-3.7,max:0}];   // magnetic spots: stack (2 high) by the shelf, then the step
const CRATE_START=[[-2.4,3.4],[0.6,5.0],[2.8,2.8]];
// spark hiding spots around the station (station-local): yard, corners, behind the rubble
// a ring around the building, in order: the spark only runs to a neighbouring spot, so it never cuts through the walls
const SPOTS=[[-9,8.5],[0,11],[9,8],[12,-1],[9,-9.5],[-1,-11.5],[-10,-9],[-12.5,1]].map(([a,b])=>ST.W(a,b));
const SPK={near:8,calm:13,alarm:3,fast:4.3,idle:1.2,slow:1.3,drain:.07,rest:.03,tireAt:.22,wakeAt:.6,catchR:1.5};
// a ring the spark runs on: spots in order, a push-out direction, and a clamp that keeps it off the building
const ringRadial=(F,r0,r1)=>({out(x,z){const ox=x-F.x,oz=z-F.z,ol=Math.hypot(ox,oz)||1;return[ox/ol,oz/ol];},clamp(sp){const ox=sp.x-F.x,oz=sp.z-F.z,ol=Math.hypot(ox,oz)||1;if(ol>r1){sp.x=F.x+ox/ol*r1;sp.z=F.z+oz/ol*r1;}if(ol<r0){sp.x=F.x+ox/ol*r0;sp.z=F.z+oz/ol*r0;}}});
const STRING=Object.assign({spots:SPOTS,k:SPK},ringRadial(ST,8.5,15));
const logic={ST,DM,HG,STRING,ringRadial,CRYSTAL,PANEL,GEN,SPOTS,SPK,SHELF,CRATE,BP,PADS,
 fresh(){return{v:1,found:false,power:false,bp:false,held:-1,crates:CRATE_START.map(([a,b])=>{const[x,z]=HG.W(a,b);return{x,z,lv:0};})};},
 sanitize(raw){const f=logic.fresh();if(!raw||raw.v!==1)return f;f.found=!!raw.found;f.power=!!raw.power;f.bp=!!raw.bp;
  if(Array.isArray(raw.crates)&&raw.crates.length===3)raw.crates.forEach((c,i)=>{if(c&&isFinite(c.x)&&isFinite(c.z)&&Math.hypot(c.x-HG.x,c.z-HG.z)<30)f.crates[i]={x:+c.x,z:+c.z,lv:Math.max(0,Math.min(2,c.lv|0))};});
  return f;},
 persist(st,p){const o=JSON.parse(JSON.stringify(st));if(o.held>=0&&p){o.crates[o.held]={x:p.x,z:p.z,lv:0};}o.held=-1;return o;},
 // ---- runaway spark (runtime only; a reload puts it back in the yard)
 spark(){const[x,z]=SPOTS[1];return{x,z,h:.6,e:1,tired:false,held:false,ti:1,t:0};},
 sparkStep(sp,px,pz,dt,ring){if(sp.held)return sp;sp.t+=dt;const RG=ring||STRING,SPOTS=RG.spots,K=RG.k||SPK,d=Math.hypot(px-sp.x,pz-sp.z),n=SPOTS.length;
  if(d<K.near)sp.al=K.alarm;else if(d>K.calm)sp.al=0;else sp.al=Math.max(0,(sp.al||0)-dt);   // stays scared for a moment
  const scared=(sp.al||0)>0,near=d<K.near;
  if(sp.tired){if(sp.e>=K.wakeAt)sp.tired=false;}else if(sp.e<=K.tireAt)sp.tired=true;
  let v=K.idle;const at=Math.hypot(SPOTS[sp.ti][0]-sp.x,SPOTS[sp.ti][1]-sp.z)<.6;
  if(scared&&!sp.tired){sp.e=Math.max(0,sp.e-K.drain*dt);v=K.fast;
   if(at||Math.hypot(SPOTS[sp.ti][0]-px,SPOTS[sp.ti][1]-pz)<d){const a=SPOTS[(sp.ti+1)%n],b=SPOTS[(sp.ti+n-1)%n],da=Math.hypot(a[0]-px,a[1]-pz),db=Math.hypot(b[0]-px,b[1]-pz);
    if(at||Math.max(da,db)>Math.hypot(SPOTS[sp.ti][0]-px,SPOTS[sp.ti][1]-pz))sp.ti=da>=db?(sp.ti+1)%n:(sp.ti+n-1)%n;}}
  else{if(!scared)sp.e=Math.min(1,sp.e+K.rest*dt);v=sp.tired?(near?K.slow:.5):K.idle;if(!sp.tired&&at)sp.ti=(sp.ti+1)%n;}
  let tx=SPOTS[sp.ti][0],tz=SPOTS[sp.ti][1];if(sp.tired&&near){const[ox,oz]=RG.out(sp.x,sp.z);tx=sp.x+(sp.x-px)+ox;tz=sp.z+(sp.z-pz)+oz;}
  const vx=tx-sp.x,vz=tz-sp.z,vl=Math.hypot(vx,vz)||1,stp=Math.min(vl,v*dt);sp.x+=vx/vl*stp;sp.z+=vz/vl*stp;
  RG.clamp(sp);
  sp.h=sp.tired?.35+.15*Math.abs(Math.sin(sp.t*3)):.5+(scared?1.4:.5)*Math.abs(Math.sin(sp.t*(scared?5:2.5)));return sp;},
 canCatch(st,sp,px,pz,alt){return !st.power&&!!sp&&!sp.held&&sp.tired&&(alt||0)<.3&&Math.hypot(px-sp.x,pz-sp.z)<SPK.catchR;},
 catchSpark(st,sp,px,pz,alt){if(!logic.canCatch(st,sp,px,pz,alt))return false;sp.held=true;return true;},
 canFeed(st,sp,px,pz){return !st.power&&!!sp&&sp.held&&Math.hypot(px-GEN[0],pz-GEN[1])<1.9;},
 feed(st,sp,px,pz){if(!logic.canFeed(st,sp,px,pz))return false;sp.held=false;st.power=true;return true;},
 tug(sp,t){return sp&&sp.held?.55*Math.sin(t*2.1)+.25*Math.sin(t*5.3):0;},   // sideways pull (m/s) while carried
 // ---- scanner
 heat(px,pz){const d=Math.hypot(px-CRYSTAL[0],pz-CRYSTAL[1]);return{d,band:d<6?'hot':d<15?'warm':'cold',period:Math.max(.35,Math.min(2,d/12))};},
 crystalVisible(st,px,pz){return !st.found&&Math.hypot(px-CRYSTAL[0],pz-CRYSTAL[1])<3.2;},
 canTakeCrystal(st,px,pz){return !st.found&&Math.hypot(px-CRYSTAL[0],pz-CRYSTAL[1])<1.4;},
 // ---- crates (collision in hangar-local axes)
 top(c){return (c.lv+1)*CRATE;},
 inBox(st,i,x,z,pad){const c=st.crates[i],[a,b]=HG.L(x,z),[ca,cb]=HG.L(c.x,c.z);return Math.abs(a-ca)<CH+pad&&Math.abs(b-cb)<CH+pad;},
 inShelf(x,z,pad){const[a,b]=HG.L(x,z);return a>SHELF.x0-pad&&a<SHELF.x1+pad&&b>SHELF.z0-pad&&b<SHELF.z1+pad;},
 floor(st,x,z,alt){if(Math.abs(x-HG.x)>12||Math.abs(z-HG.z)>12)return 0;let f=0;
  st.crates.forEach((c,i)=>{if(i===st.held)return;const t=logic.top(c);if(t<=alt+.15&&t>f&&logic.inBox(st,i,x,z,.2))f=t;});
  if(SHELF.top<=alt+.15&&logic.inShelf(x,z,.2))f=Math.max(f,SHELF.top);return f;},
 blocked(st,x,z,alt){if(Math.abs(x-HG.x)>12||Math.abs(z-HG.z)>12)return false;
  for(let i=0;i<st.crates.length;i++){if(i===st.held)continue;if(alt<logic.top(st.crates[i])-.1&&logic.inBox(st,i,x,z,.16))return true;}
  return alt<SHELF.top-.1&&logic.inShelf(x,z,.14);},
 topAt(st,x,z){let best=-1;st.crates.forEach((c,i)=>{if(i===st.held)return;if(Math.hypot(c.x-x,c.z-z)<.6&&(best<0||c.lv>st.crates[best].lv))best=i;});return best;},
 nearCrate(st,px,pz,alt){if(st.held>=0||alt>.15)return -1;let best=-1,bd=1.25;st.crates.forEach((c,i)=>{const d=Math.hypot(c.x-px,c.z-pz);if(d<bd&&!st.crates.some((o,j)=>j!==i&&o.lv>c.lv&&Math.hypot(o.x-c.x,o.z-c.z)<.3)){bd=d;best=i;}});return best;},
 pick(st,px,pz,alt){const i=logic.nearCrate(st,px,pz,alt);if(i<0)return{ok:false};st.held=i;return{ok:true,i};},
 drop(st,px,pz,yaw,alt,blocked){if(st.held<0)return{ok:false};if(alt>.15)return{ok:false,why:'air'};const fx=-Math.sin(yaw),fz=-Math.cos(yaw);let x=px+fx*1.0,z=pz+fz*1.0,lv=0;
  {const[a,b]=HG.L(x,z);const C=PADS.map(P=>[Math.hypot(a-P.a,b-P.b),P]).filter(q=>q[0]<1.6).sort((p,q)=>p[0]-q[0]);
   for(const[,P]of C){const[wx,wz]=HG.W(P.a,P.b),u=logic.topAt(st,wx,wz);if(u<0){st.crates[st.held]={x:wx,z:wz,lv:0};st.held=-1;return{ok:true,snapped:true};}
    if(st.crates[u].lv<P.max){st.crates[st.held]={x:wx,z:wz,lv:st.crates[u].lv+1};st.held=-1;return{ok:true,stacked:true,snapped:true};}}}
  const under=logic.topAt(st,x,z);if(under>=0){const u=st.crates[under];if(u.lv>=1)return{ok:false,why:'high'};x=u.x;z=u.z;lv=u.lv+1;}
  else{if(blocked&&blocked(x,z))return{ok:false,why:'blocked'};if(st.crates.some((c,i)=>i!==st.held&&Math.hypot(c.x-x,c.z-z)<1.0))return{ok:false,why:'blocked'};if(logic.inShelf(x,z,.5))return{ok:false,why:'blocked'};}
  st.crates[st.held]={x,z,lv};st.held=-1;return{ok:true,stacked:lv>0};},
 padLv(st,k){const[wx,wz]=HG.W(PADS[k].a,PADS[k].b),u=logic.topAt(st,wx,wz);return u<0?-1:st.crates[u].lv;},
 stackReady(st){return logic.padLv(st,0)>=1;},
 canTakeBP(st,px,pz,alt){return !st.bp&&logic.stackReady(st)&&alt>SHELF.top-.2&&Math.hypot(px-BP[0],pz-BP[1])<1.7;}};
const scanBusy=()=>{try{const L3=root.MoonLife3;return !!(L3&&L3.scanBusy&&L3.scanBusy());}catch(e){return false;}};   // life #3 borrows the dome scanner for its record
const API={logic,st:null,sp:null,get held(){return !!(API.st&&API.st.held>=0)||!!(API.sp&&API.sp.held);}};
root.MoonSide2=API;
if(typeof module!=='undefined'&&module.exports)module.exports=API;
if(typeof document==='undefined')return;
const KEY='moonkatty-side2-v1',G=()=>root.MoonGame;
try{API.st=logic.sanitize(JSON.parse(localStorage.getItem(KEY)||'null'));}catch(e){API.st=logic.fresh();}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(logic.persist(API.st,G()&&G().player)));}catch(e){}};
const tt=(k,fb,p)=>{try{const v=root._t?root._t(k,p):null;return v&&v!==k?v:fb;}catch(e){return fb;}};
const NAMES={scanner:['side.scanner','find the hidden crystal by the dome'],power:['side.power','turn on the station power'],crates:['side.crates','reach the hangar shelf']};
API.name=k=>tt(NAMES[k][0],NAMES[k][1]);
API.objectives=()=>{const st=API.st,o=[];if(!st)return o;if(!st.found&&!scanBusy())o.push(['scanner',DM.x,DM.z]);if(!st.power)o.push(['power',ST.x,ST.z]);if(!st.bp)o.push(['crates',HG.x,HG.z]);return o;};
API.quests=()=>{const st=API.st;return st?[['scanner',DM,st.found],['power',ST,st.power],['crates',HG,st.bp]]:[];};
API.floor=(x,z,alt)=>API.st?logic.floor(API.st,x,z,alt):0;
const toast=s=>{const g=G();g&&g.toast&&g.toast(s);};
// ---- renderer hooks
const R=root.MoonRenderer&&root.MoonRenderer.prototype;
if(R){const ob=R.blocked;R.blocked=function(x,z,state,alt=0){if(API.st&&logic.blocked(API.st,x,z,alt))return true;return ob.apply(this,arguments);};
 const oc=R.cameraBlocked;R.cameraBlocked=function(x,z,state,h=0){if(Math.abs(x-HG.x)<14&&Math.abs(z-HG.z)<14){const[a,b]=HG.L(x,z);if(b>-8.6&&b<7.9&&a*a+(h/.92)**2>5.75*5.75)return true;if(b<=-7.7&&b>-12&&Math.abs(a)<7)return true;}return (oc||this.blocked).apply(this,arguments);};
 R.camCeil=function(p){const up=Math.abs(p.x-HG.x)<9&&Math.abs(p.z-HG.z)<9&&(p.alt||0)>.6&&Math.abs(HG.L(p.x,p.z)[1])<7.9,fw=up?.32:0;this.fovExtra=(this.fovExtra||0)+(fw-(this.fovExtra||0))*.08;if(this.fovExtra<.002)this.fovExtra=0;
 if(Math.abs(p.x-HG.x)>9||Math.abs(p.z-HG.z)>9)return 1e9;const[a,b]=HG.L(p.x,p.z);if(Math.abs(b)>7.9||Math.abs(a)>5.6)return 1e9;return this.terrain(p.x,p.z,(G()&&G().state||{}).chapter)+.92*Math.sqrt(5.6*5.6-a*a)-.3;};
 const os=R.scene;R.scene=function(state,p,...a){this.flameFloor=(API.st&&p)?API.floor(p.x,p.z,p.alt||0):0;const out=os.call(this,state,p,...a);try{draw(this,state,p);}catch(e){root.__side2Err=String(e);}return out;};}
const camFade=(r,x,y,z)=>{const e=r.eye||r._eyeOut;if(!e)return 1;return Math.max(0,Math.min(1,(Math.hypot(e[0]-x,e[1]-y,e[2]-z)-2.5)/4.5));};
const WOOD=[.62,.45,.26],WOODD=[.42,.29,.16],GREY=[.55,.56,.58],DARK=[.2,.21,.24],BLUE=[.3,.62,1.0],WARM=[1.0,.82,.5];
function crate(r,x,y,z,yaw,sc){const P=(ly,sx,sy,sz,col)=>r.put('cube',x,y+ly*sc,z,sx*sc,sy*sc,sz*sc,col,yaw,0,0);
 P(.4,.8,.8,.8,WOOD);P(.4,.84,.12,.84,WOODD);P(.04,.84,.08,.84,WOODD);P(.76,.84,.08,.84,WOODD);}
// living energy orb: emissive core + two camera-facing soft halos + 3 flickering arcs + a short trail + ground glow (≈12 draws)
const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
function drawSpark(r,sp,p,t,ch,glow){let sx,sy,sz;const tired=sp.tired&&!sp.held;
 if(sp.held){const fx=-Math.sin(p.yaw||0),fz=-Math.cos(p.yaw||0),j=Math.sin(t*13)*.06,tg=logic.tug(sp,t)*.5;sx=p.x-fx*.1-fz*(.75+tg)+j;sz=p.z-fz*.1+fx*(.75+tg)-j;sy=r.terrain(p.x,p.z,ch)+(p.alt||0)+1.0+Math.sin(t*9)*.08;}
 else{sx=sp.x+Math.sin(t*17)*.03;sz=sp.z+Math.cos(t*13)*.03;sy=r.terrain(sp.x,sp.z,ch)+sp.h;}
 const tr=sp._tr||(sp._tr=[]),last=tr[0],mv=last?Math.hypot(sx-last[0],sz-last[2]):0;if(!last||mv>.25){tr.unshift([sx,sy,sz,t]);if(tr.length>5)tr.pop();}
 const vy=sp._py==null?0:(sy-sp._py)/Math.max(.016,t-(sp._pt||t-.016));sp._py=sy;sp._pt=t;const st2=Math.max(-.25,Math.min(.3,vy*.06)),sq=sp.held?0:Math.max(0,.18-(sy-r.terrain(sx,sz,ch)-.35)*.5);
 const flick=tired?(hash(Math.floor(t*9))<.25?.35:1):1,dim=(tired?.7:1)*flick,ys=1+st2-sq,xs=1/Math.sqrt(Math.max(.5,ys)),SC=sp.sc||1,R0=(sp.held?.22:.27)*SC;
 const e=r.eye||[sx,sy+2,sz+5],yaw=Math.atan2(e[0]-sx,e[2]-sz),pi2=Math.PI/2;
 r.put('sphere',sx,sy,sz,R0*xs,R0*ys,R0*xs,[.55,.92,1],t*4,12,.9*dim);
 r.put('sphere',sx,sy,sz,R0*.55*xs,R0*.55*ys,R0*.55*xs,[1,1,.92],0,12,1);
 if(glow){r.put('mineralGlow',sx,sy,sz,2.0*SC*xs,1,2.0*SC*ys,[.3,.85,1],yaw,22,1*dim,pi2);r.put('mineralGlow',sx,sy,sz,3.8*SC,1,3.8*SC,[1,.72,.25],yaw,22,.5*dim,pi2);
  r.put('mineralGlow',sx,r.terrain(sx,sz,ch)+.05,sz,2.4*SC,1,2.4*SC,[.4,.85,1],0,22,(.5+.2*Math.sin(t*7))*dim);}
 const rate=tired?4:14,k0=Math.floor(t*rate);for(let k=0;k<3;k++){const h=hash(k0*3+k);if(h<(tired?.55:.2))continue;const a=hash(k0*7+k)*6.283,b=(hash(k0*11+k)-.5)*2.2,L=.18+.22*hash(k0*5+k),d=R0+L*.5;
  r.put('cube',sx+Math.sin(a)*Math.cos(b)*d,sy+Math.sin(b)*d,sz+Math.cos(a)*Math.cos(b)*d,.025,.025,L,k%2?[.6,.95,1]:[1,.85,.4],a,12,.9*dim,-b);}
 if(!sp.held&&!tired)for(let k=1;k<tr.length;k++){const q=tr[k],f=1-k/tr.length;if(t-q[3]>.5)break;if(glow)r.put('mineralGlow',q[0],q[1],q[2],.9*f+.3,1,.9*f+.3,[.5,.9,1],yaw,22,.45*f,pi2);}}
function draw(r,state,p){const st=API.st;if(!st||!p)return;const ch=state&&state.chapter,t=performance.now()/1000,glow=r.meshes&&r.meshes.mineralGlow;
 // ① crystal + a soft pool of light on the ground (the clue: look where the light falls)
 if(!st.found&&Math.hypot(p.x-CRYSTAL[0],p.z-CRYSTAL[1])<60){const[cx,cz]=CRYSTAL,y=r.terrain(cx,cz,ch);
  if(glow)r.put('mineralGlow',cx,y+.05,cz,2.4,1,2.4,[.95,.95,.85],0,22,.18+.05*Math.sin(t*1.7));
  if(!scanBusy()&&logic.crystalVisible(st,p.x,p.z)){const cf=camFade(r,cx,y+.5,cz),b=Math.sin(t*2)*.05;r.put('sphere',cx,y+.55+b,cz,.3,.56,.3,[.1,.45,.95],t*.8,0,.04+.05*cf);if(glow)r.put('mineralGlow',cx,y+.05,cz,1.2,1,1.2,[.2,.6,1],0,22,.35);}}
 // ② panel + lights
 if(Math.hypot(p.x-ST.x,p.z-ST.z)<70){const[px,pz]=PANEL,y=r.terrain(px,pz,ch);r.put('cube',px,y+1.1,pz,.7,.9,.12,DARK,ST.yaw,0,0);
  r.put('cube',px,y+1.1,pz,.5,.6,.14,st.power?[.3,1,.5]:[.35,.4,.5],ST.yaw,12,(st.power?.35:.06+.05*Math.sin(t*3))*camFade(r,px,y+1.1,pz));
  const sp=API.sp;if(!st.power&&sp)drawSpark(r,sp,p,t,ch,glow);
  if(st.power){for(const lx of[-4,0,4]){const[x,z]=ST.W(lx,0),yy=r.terrain(x,z,ch);r.put('sphere',x,yy+2.6,z,.3,.18,.3,[1,.6,.2],0,0,.06*camFade(r,x,yy+2.6,z));}
   for(const lx of[-2.3,2.3]){const[x,z]=ST.W(lx,5.6),yy=r.terrain(x,z,ch);r.put('cylinder',x,yy+1.1,z,.1,2.2,.1,DARK,0,0,0);r.put('cube',x,yy+2.36,z,.5,.12,.5,DARK,ST.yaw,0,0);r.put('sphere',x,yy+2.24,z,.38,.2,.38,[1,.55,.15],0,12,.22+.16*camFade(r,x,yy+2.24,z));r.put('sphere',x,yy+2.2,z,.7,.36,.7,[1,.6,.2],0,12,.1);
    if(glow){r.put('mineralGlow',x,yy+.05,z,3.8,1,3.8,[1,.6,.2],0,22,.75);r.put('mineralGlow',x,yy+.06,z,1.8,1,1.8,[1,.75,.35],0,22,.8);}}
   if(glow){const yy=r.terrain(ST.x,ST.z,ch);r.put('mineralGlow',ST.x,yy+.05,ST.z,8,1,6,WARM,0,22,.22+.03*Math.sin(t*1.3));const[dx,dz]=ST.W(0,6.2);r.put('mineralGlow',dx,r.terrain(dx,dz,ch)+.05,dz,3.2,1,2.2,WARM,0,22,.35);}}}
 // ③ crates, shelf, blueprint
 if(Math.hypot(p.x-HG.x,p.z-HG.z)<70){const sy=r.terrain(HG.x,HG.z,ch);const[sx,sz]=HG.W((SHELF.x0+SHELF.x1)/2,(SHELF.z0+SHELF.z1)/2);
  r.put('cube',sx,sy+SHELF.top-.08,sz,SHELF.x1-SHELF.x0,.16,SHELF.z1-SHELF.z0,GREY,HG.yaw,0,0);
  for(const[a,b]of[[SHELF.x0+.1,SHELF.z0+.1],[SHELF.x0+.1,SHELF.z1-.1],[SHELF.x1-.1,SHELF.z0+.1],[SHELF.x1-.1,SHELF.z1-.1]]){const[x,z]=HG.W(a,b);r.put('cube',x,sy+SHELF.top/2,z,.12,SHELF.top,.12,DARK,HG.yaw,0,0);}
  if(!st.bp){PADS.forEach((P,k)=>{if(logic.padLv(st,k)>=P.max)return;const[x,z]=HG.W(P.a,P.b),yy=r.terrain(x,z,ch)+(logic.padLv(st,k)+1)*CRATE*(logic.padLv(st,k)>=0?1:0)+.03,g=.25+.15*Math.sin(t*3);
    for(const[ox,oz,sx2,sz2]of[[0,-.44,.92,.06],[0,.44,.92,.06],[-.44,0,.06,.92],[.44,0,.06,.92]]){const[qx,qz]=HG.W(P.a+ox,P.b+oz);r.put('cube',qx,yy,qz,sx2,.03,sz2,[1,.72,.25],HG.yaw,12,g);}});}
  if(!st.bp&&logic.stackReady(st)){const cf=camFade(r,BP[0],sy+SHELF.top+.15,BP[1]);r.put('cylinder',BP[0],sy+SHELF.top+.1,BP[1],.14,.6,.14,BLUE,HG.yaw,12,.2+.25*cf,Math.PI/2);
   const C=root.MoonCarry;if(C&&C.paw&&Math.hypot(p.x-HG.x,p.z-HG.z)<16)C.paw(r,BP[0],sy+SHELF.top+.75,BP[1],t);}
  st.crates.forEach((c,i)=>{if(i===st.held)return;crate(r,c.x,r.terrain(c.x,c.z,ch)+c.lv*CRATE,c.z,HG.yaw,1);});
  if(st.held>=0){const y=r.terrain(p.x,p.z,ch)+(p.alt||0),fx=-Math.sin(p.yaw||0),fz=-Math.cos(p.yaw||0);crate(r,p.x+fx*.42,y+.22,p.z+fz*.42,p.yaw||0,.5);}}}
API.drawSpark=drawSpark;API.crate=crate;
// ---- context button
let mode=null;
function busyOther(){return !!(root.MoonCarry&&root.MoonCarry.own)||!!(root.MoonSide&&root.MoonSide.ownHeld);}
function pick(){const g=G();if(!g||!g.player||!API.st)return null;const p=g.player,st=API.st,alt=p.alt||0;
 if(API.sp&&API.sp.held)return logic.canFeed(st,API.sp,p.x,p.z)?'feed':null;
 if(st.held>=0)return'put';if(busyOther())return null;
 if(logic.canCatch(st,API.sp,p.x,p.z,alt))return'spark';
 if(!scanBusy()&&logic.canTakeCrystal(st,p.x,p.z))return'crystal';
 if(logic.canTakeBP(st,p.x,p.z,alt))return'bp';
 if(Math.hypot(p.x-HG.x,p.z-HG.z)<12&&logic.nearCrate(st,p.x,p.z,alt)>=0)return'take';return null;}
const LBL={put:()=>tt('carry.put','Put down'),take:()=>tt('carry.take','Pick up'),crystal:()=>tt('carry.take','Pick up'),bp:()=>tt('carry.take','Pick up'),spark:()=>tt('carry.take','Pick up'),feed:()=>tt('sq.sp_put','Put in generator')};
API.ctx=()=>{mode=pick();return mode?LBL[mode]():null;};
function act(e){const btn=e.target&&e.target.closest&&e.target.closest('#interact');if(!btn)return;const m=pick();if(!m)return;e.stopImmediatePropagation();e.preventDefault();
 const g=G(),p=g.player,st=API.st;
 if(m==='crystal'){st.found=true;save();toast(tt('sq.sc_done','Found it!'));root.MoonSfx&&root.MoonSfx('coin');}
 else if(m==='bp'){st.bp=true;save();toast(tt('sq.cr_done','You got the blueprint!'));}
 else if(m==='take'){if(logic.pick(st,p.x,p.z,p.alt||0).ok)save();}
 else if(m==='put'){const rd=g.renderer,state=g.state;const r=logic.drop(st,p.x,p.z,p.yaw||0,p.alt||0,(x,z)=>rd.blocked(x,z,state,0)||!!(root.MoonRuins2&&root.MoonRuins2.blocked(x,z)));
  if(!r.ok)toast(tt('carry.noroom','No room here.'));else{save();if(r.stacked)toast(tt('sq.cr_stack','Crate stacked'));}}
 else if(m==='spark'){if(logic.catchSpark(st,API.sp,p.x,p.z,p.alt||0)){toast(tt('sq.sp_carry','The spark is tugging! Bring it to the generator.'));root.MoonSfx&&root.MoonSfx('click');}}
 else if(m==='feed'){if(logic.feed(st,API.sp,p.x,p.z)){save();toast(tt('sq.pw_done','Power is back!'));root.MoonSfx&&root.MoonSfx('coin');}}}
root.addEventListener('click',act,true);
// ---- scanner widget
const sc=document.createElement('div');sc.id='mk-scan2';
sc.style.cssText='position:fixed;right:12px;z-index:30;display:none;flex-direction:column;align-items:center;gap:3px;font:700 11px/1 system-ui,sans-serif;color:#fff;text-shadow:0 1px 2px #000;pointer-events:auto;cursor:pointer';
sc.innerHTML='<div class="r" style="width:50px;height:50px;border-radius:50%;border:2px solid currentColor;background:radial-gradient(circle,rgba(255,255,255,.25) 0 18%,rgba(10,14,28,.75) 20%);box-sizing:border-box;position:relative"><div class="w" style="position:absolute;inset:-2px;border-radius:50%;border:3px solid currentColor;opacity:0"></div></div><div class="b"></div>';
document.body.appendChild(sc);
const st2=document.createElement('style');st2.textContent='@keyframes mkscan{0%{transform:scale(.6);opacity:.9}100%{transform:scale(1.5);opacity:0}}';document.head.appendChild(st2);
sc.onclick=()=>{const g=G();if(!g||!g.player)return;let h=null;try{h=API.extScan&&API.extScan(g.player);}catch(e){}h=h||logic.heat(g.player.x,g.player.z);toast(tt('sq.sc_name','Scanner')+': '+tt('sq.sc_'+h.band,h.band));};
let hints={},lastBand='',lastPer=0;
function loop(){try{const g=G();if(g&&g.player&&API.st){const p=g.player,st=API.st;
  if(!hints.sc&&!st.found&&!scanBusy()&&Math.hypot(p.x-DM.x,p.z-DM.z)<24){hints.sc=1;setTimeout(()=>toast(tt('sq.sc_hint','A crew crystal is hidden near the dome.')),3200);}
  if(!st.power&&Math.hypot(p.x-ST.x,p.z-ST.z)<40){if(!API.sp)API.sp=logic.spark();const dt=Math.min(.05,Math.max(0,(performance.now()-(loop.l||performance.now()))/1000));logic.sparkStep(API.sp,p.x,p.z,dt);
   if(!hints.sp&&Math.hypot(p.x-ST.x,p.z-ST.z)<26){hints.sp=1;toast(tt('sq.sp_hint','The generator spark escaped! Catch it.'));}
   if(API.sp.tired&&!API.sp.held&&!hints.spt&&Math.hypot(p.x-API.sp.x,p.z-API.sp.z)<9){hints.spt=1;toast(tt('sq.sp_tired','The spark is tired - grab it!'));}else if(!API.sp.tired)hints.spt=0;
   const u=logic.tug(API.sp,performance.now()/1000)*dt;if(u){const yw=p.yaw||0,nx=p.x+Math.cos(yw)*u,nz=p.z-Math.sin(yw)*u,rd=g.renderer;if(!(rd&&rd.blocked&&rd.blocked(nx,nz,g.state,p.alt||0))){p.x=nx;p.z=nz;}}}
  else if(API.sp&&API.sp.held&&Math.hypot(p.x-ST.x,p.z-ST.z)>=40){API.sp=null;}
  loop.l=performance.now();
  if(!hints.cr&&!st.bp&&Math.hypot(p.x-HG.x,p.z-HG.z)<18){hints.cr=1;toast(tt('sq.cr_hint','Stack the crates and jump up.'));}
  let ext=null;try{ext=API.extScan?API.extScan(p):null;}catch(e){}   // another quest (life #1 tower) can borrow the scanner
  const show=(ext||!st.found&&Math.hypot(p.x-DM.x,p.z-DM.z)<45)&&!document.querySelector('dialog[open]');
  if(show){const h=ext||logic.heat(p.x,p.z),col=h.band==='hot'?'#ff5a3c':h.band==='warm'?'#ffb340':'#59b8ff',per=Math.round(h.period*20)/20;
   const top=document.querySelector('#destination');let tp=top&&!top.hidden?top.getBoundingClientRect().bottom+8:90;const mb=document.getElementById('hud-menu');if(mb&&mb.offsetParent!==null){const rb=mb.getBoundingClientRect();if(rb.right>innerWidth-80&&rb.bottom+8>tp&&rb.top<tp+70)tp=rb.bottom+10;}sc.style.top=tp+'px';
   sc.style.display='flex';sc.style.color=col;if(lastBand!==h.band){sc.querySelector('.b').textContent=tt('sq.sc_'+h.band,h.band);lastBand=h.band;}
   if(per!==lastPer){sc.querySelector('.w').style.animation='mkscan '+per+'s linear infinite';lastPer=per;}}else sc.style.display='none';}}catch(e){root.__side2Err=String(e.stack||e);}
 requestAnimationFrame(loop);}
requestAnimationFrame(loop);
setInterval(()=>{if(API.st&&API.st.held>=0)save();},2000);root.addEventListener('pagehide',save);
})(typeof globalThis!=='undefined'?globalThis:this);
