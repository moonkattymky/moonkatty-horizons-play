/* life #4 «Ракета» in-world: meet the engineer at the old crashed rocket (c4_brief); pull the winch cable down to the salvage
   engine, hook it, the winch lifts it out and it rolls to the pad behind the cat, who clears rocks off its way (c4_engine);
   crystal cave: shards hide when you come running, sneak up on them; the hot blue core may only be carried through shade, in
   the sun it overheats (c4_core); hangar (60,-195): open it, climb the crate stack to the nose on the high shelf, dig the fins
   out of the rubble; crane: drop the top section onto the mark when it swings over it (c4_top); ignition test (life4).
   Checkpoint ids/payloads unchanged: every step ends in the original Core.interact/Core.solve. */
(function(root){
'use strict';
const frame=(x,z,yaw)=>{const c=Math.cos(yaw),s=Math.sin(yaw);return{x,z,yaw,W:(lx,lz)=>[x+c*lx+s*lz,z-s*lx+c*lz],L:(wx,wz)=>{const dx=wx-x,dz=wz-z;return[c*dx-s*dz,s*dx+c*dz];}};};
const hyp=Math.hypot;
const RK=frame(150,130,.35),HG=frame(60,-195,.9);
const PAD=[28,4],PADP=[22.6,5.2],CON=[20.4,-.6],ENG=RK.W(0,23);
// ② engine: the salvage engine under the winch at the wreck, the cable drum on the rim, a road to the pad with 3 rocks on it
const ENGINE=[-28.6,52.4],DRUM=[-16.5,46.5],CABLE_MAX=24;
const PATH=[ENGINE,DRUM,[-2,30],[20.4,8.6]];
const SEGL=[];let PATH_L=0;for(let i=1;i<PATH.length;i++){const l=hyp(PATH[i][0]-PATH[i-1][0],PATH[i][1]-PATH[i-1][1]);SEGL.push(l);PATH_L+=l;}
const ROCKS=[24,40,56],ROCK_STOP=2.4,SLED_V=2.4,SLED_NEAR=8;
// ③ cave shards (core POINTS) + the heart, shade pools on the way to the pad
const SHARDS=['shard1','shard2','shard3'],HEART=[75.3,6.9],CAVE=[69,4],HIDE_R=7,NOISY=2.3,SNEAK=.42,HEAVY=.7,HIDE_T=4;
const SHADE=[[55,6.2],[44.5,6]],CORE_R=7.5,SHADE_R=2.9,HEAT_UP=1/3,HEAT_DN=.45;
// ④ hangar: the console at the door, nose on the high shelf (crate stack of side-quests2), fins under 3 rubble stones
const HDOOR=HG.W(0,9.6),NOSE=HG.W(-.45,-6.1),SHELF_TOP=2.3,FINS=HG.W(-5.2,1.6),RUBBLE=[[-.9,.5],[.8,-.4],[.1,1.1]].map(([a,b])=>HG.W(-5.2+a,1.6+b));
// ⑤ crane: the top section swings over the rocket, drop it on the mark
const SWING_A=2.3,SWING_W=1.7,HIT=.55;
const STEPS=['brief','engine','shards','core','hangar','top','ignite'];
const OLD={pad:1,wreck:1,wreckPanel:1,shard1:1,shard2:1,shard3:1,caveHeart:1,hangar:1,nose:1,fins:1,rocket:1};
const POWER=[0,2,0,0,1,0,0,0,0];
const n=(a)=>Array.isArray(a)?a.length:0;
const logic={CORE_R,RK,HG,PAD,PADP,CON,ENG,ENGINE,DRUM,CABLE_MAX,PATH,PATH_L,ROCKS,ROCK_STOP,SLED_V,SLED_NEAR,SHARDS,HEART,CAVE,HIDE_R,NOISY,SNEAK,HEAVY,HIDE_T,SHADE,SHADE_R,HEAT_UP,HEAT_DN,
 HDOOR,NOSE,SHELF_TOP,FINS,RUBBLE,SWING_A,SWING_W,HIT,STEPS,OLD,POWER,
 // ---- which step: only the old save fields, a later flag always wins (mid-life saves migrate, never back)
 step(s){if(!s||s.chapter!==4||s.chapter4Complete)return null;if(s.topInstalled)return'ignite';const parts=n(s.rocketParts);
  if(parts>=2)return'top';if(s.hangarOpen||parts>0||s.coreInstalled)return'hangar';if(s.coreFound||n(s.coreShards)>=3)return'core';
  if(n(s.coreShards)>0||s.engineInstalled)return'shards';if(s.engineFound||s.wreckFound||s.rocketBriefed)return'engine';return'brief';},
 // ② the road: point at distance d, the next rock still in the way
 at(d){d=Math.max(0,Math.min(PATH_L,d));for(let i=0;i<SEGL.length;i++){if(d<=SEGL[i]||i===SEGL.length-1){const k=SEGL[i]?d/SEGL[i]:0,a=PATH[i],b=PATH[i+1];return[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,Math.atan2(b[0]-a[0],b[1]-a[1])];}d-=SEGL[i];}return PATH[0].concat(0);},
 blockRock(d,clear){for(let i=0;i<ROCKS.length;i++)if(!clear[i]&&ROCKS[i]>d-.01)return i;return -1;},
 // the sled moves only with the cat nearby and stops in front of an uncleared rock
 sled(d,clear,px,pz,dt){const[x,z]=logic.at(d);if(hyp(px-x,pz-z)>SLED_NEAR)return{d,why:'far'};const r=logic.blockRock(d,clear);const lim=r>=0?ROCKS[r]-ROCK_STOP:PATH_L;
  const nd=Math.min(lim,d+SLED_V*dt);return{d:nd,why:nd>=PATH_L?'done':nd>=lim-1e-6&&r>=0?'rock':null};},
 cableOk(px,pz){return hyp(px-DRUM[0],pz-DRUM[1])<=CABLE_MAX;},
 // ③ shards: running close makes a shard hide
 noisy(speed,d){return d<HIDE_R&&speed>NOISY;},
 inShade(x,z){if(hyp(x-CAVE[0],z-CAVE[1])<9)return true;for(const[sx,sz]of SHADE)if(hyp(x-sx,z-sz)<SHADE_R)return true;return false;},
 heat(h,x,z,dt){return Math.max(0,h+(logic.inShade(x,z)?-HEAT_DN:HEAT_UP)*dt);},
 // ④ the nose only from the shelf top
 canNose(px,pz,alt){return(alt||0)>=SHELF_TOP-.35&&hyp(px-NOSE[0],pz-NOSE[1])<1.4;},
 // ⑤ crane swing offset and the drop
 swing(t){return SWING_A*Math.sin(t*SWING_W);},
 drop(t){return Math.abs(logic.swing(t))<HIT;},
 SCENE:6.5,BRIEF:4.6,IGN:6.4};
// solids for the new props (drawn whenever chapter 4 is active): hangar walls in HG-local [a0,a1,b0,b1,top], the tilted rocket as a ground capsule
const HSOL=[[-8.3,8.3,-8.8,-8.4,5.2],[-8.3,-7.7,-8.4,7.9,1.6],[7.7,8.3,-8.4,7.9,1.6]];
const ROLD=(()=>{const Y=.35+1.9,T=.5,h=Math.sin(T);return{a:RK.W(4.2,20.5),dx:Math.sin(Y)*h,dz:Math.cos(Y)*h,L:10,r:1.5,top:4.2};})();
logic.HSOL=HSOL;logic.ROLD=ROLD;
logic.solid=(x,z,alt)=>{const[a,b]=HG.L(x,z),m=.2;for(const B of HSOL)if(alt<B[4]-.1&&a>B[0]-m&&a<B[1]+m&&b>B[2]-m&&b<B[3]+m)return true;
 const R0=ROLD,px=x-R0.a[0],pz=z-R0.a[1],ll=R0.dx*R0.dx+R0.dz*R0.dz,k=Math.max(0,Math.min(R0.L,(px*R0.dx+pz*R0.dz)/ll));if(alt<R0.top&&hyp(px-R0.dx*k,pz-R0.dz*k)<R0.r)return true;return false;};
const API={logic,rt:{brief:-1,cable:false,d:0,clear:[0,0,0],roll:[-1,-1,-1],hide:[0,0,0],sneak:false,spd:0,carry:false,heat:0,open:-1,rub:[0,0,0],ruT:[-1,-1,-1],
 sw:0,fall:-1,miss:0,ign:-1,carryPart:null,partT:0}};
root.MoonLife4=API;
if(typeof module!=='undefined'&&module.exports)module.exports=API;
if(typeof document==='undefined')return;
const Core=root.MoonCore;if(!Core)return;
const G=()=>root.MoonGame,rt=API.rt;
const tt=(k,fb,p)=>{try{const v=root._t?root._t(k,p):null;return v&&v!==k?v:fb.replace(/\{(\w+)\}/g,(_,q)=>p&&p[q]!=null?p[q]:'');}catch(e){return fb;}};
const toast=s=>{const g=G();g&&g.toast&&g.toast(s);};
const sfx=k=>{try{root.MoonSfx&&root.MoonSfx(k);}catch(e){}};
const gs=()=>{const g=G();return g&&g.state;};
const cur=()=>logic.step(gs());
const now=()=>performance.now()/1000;
const LS='moonkatty-life4-v1';
const load=()=>{try{const o=JSON.parse(localStorage.getItem(LS)||'null');if(o&&typeof o.d==='number'){rt.d=Math.max(0,Math.min(PATH_L,o.d));rt.clear=(o.clear||[0,0,0]).map(v=>v?1:0);}}catch(e){}};
const keep=()=>{try{localStorage.setItem(LS,JSON.stringify({d:+rt.d.toFixed(2),clear:rt.clear}));}catch(e){}};
load();
const DYN=Core.DYN||(Core.DYN={});
const oQuest=Core.quest,oNear=Core.nearestTarget,oInteract=Core.interact;
function myQuest(s){const st=logic.step(s);if(!st)return null;
 if(st==='brief')return{id:'l4brief',title:tt('l4.q_brief','Meet the engineer at the old rocket'),detail:tt('l4.q_brief_d','The crashed rocket lies far to the north-east.'),targets:['l4eng'],fraction:.02};
 if(st==='engine'){if(!s.engineFound){if(!rt.cable)return{id:'l4cable',title:tt('l4.q_cable','Take the winch cable'),detail:tt('l4.q_cable_d','The cable drum stands on the rim by the wreck.'),targets:['l4drum'],fraction:.08};
   return{id:'l4hook',title:tt('l4.q_hook','Hook the engine'),detail:tt('l4.q_hook_d','Pull the cable down to the engine under the winch.'),targets:['l4engine'],fraction:.14};}
  return{id:'l4haul',title:tt('l4.q_haul','Lead the engine to the pad'),detail:tt('l4.q_haul_d','It rolls behind you. Clear the rocks off its way!'),targets:['l4sled'],fraction:.2};}
 if(st==='shards'){const k=n(s.coreShards);return{id:'l4shards',title:tt('l4.q_shards','Crystal shards: {n}/3',{n:k}),detail:tt('l4.q_shards_d','They hide from noise. Sneak up on them!'),targets:SHARDS.filter(id=>!s.coreShards.includes(id)).map(id=>'l4'+id),fraction:.3+k*.05};}
 if(st==='core'){if(!rt.carry)return{id:'l4core',title:tt('l4.q_core','Take the blue core'),detail:tt('l4.q_core_d','It is hot. Carry it through the shade only.'),targets:['l4heart'],fraction:.48};
  return{id:'l4carry',title:tt('l4.q_carry','Carry the core to the pad in the shade'),detail:tt('l4.q_carry_d','In the sun it overheats. Rest in the rock shadows.'),targets:['l4shade'],fraction:.54};}
 if(st==='hangar'){if(!s.hangarOpen)return{id:'l4hangar',title:tt('l4.q_hangar','Open the old hangar'),detail:tt('l4.q_hangar_d','The broken hangar is far to the south.'),targets:['l4door'],fraction:.64};
  const left=['nose','fins'].filter(id=>!s.rocketParts.includes(id));return{id:'l4parts',title:tt('l4.q_parts','Rocket parts: {n}/2',{n:n(s.rocketParts)}),detail:left.map(id=>id==='nose'?tt('l4.q_nose','Nose: up on the shelf, stack the crates'):tt('l4.q_fins','Fins: under the rubble')).join(' · '),targets:left.map(id=>'l4'+id),fraction:.7+n(s.rocketParts)*.06};}
 if(st==='top')return{id:'l4top',title:tt('l4.q_top','Lower the top section'),detail:tt('l4.q_top_d','At the crane console: drop it when it swings over the gold mark.'),targets:['l4con'],fraction:.84};
 return{id:'l4ign',title:tt('l4.q_ign','Ignition test!'),detail:tt('l4.q_ign_d','Stand at the console and start the engines.'),targets:['l4con'],fraction:.94};}
Core.quest=function(s){if(s&&s.chapter===4){try{const q=myQuest(s);if(q)return q;}catch(e){root.__life4Err=String(e);}}return oQuest.apply(this,arguments);};
function nextShade(){const g=G(),p=g&&g.player;if(!p)return SHADE[0];let best=[PAD[0]+6,PAD[1]+1];for(const P of SHADE){if(P[0]<p.x-1){best=P;break;}}return best;}
function dyn(){DYN.l4eng=ENG;DYN.l4drum=DRUM;DYN.l4engine=ENGINE;const a=logic.at(rt.d);DYN.l4sled=rt.d<1?ENGINE:[a[0],a[1]];
 const r=logic.blockRock(rt.d,rt.clear),A=r>=0?logic.at(ROCKS[r]):null;if(A&&rt.d>=ROCKS[r]-ROCK_STOP-.5)DYN.l4sled=[A[0],A[1]];
 for(const id of SHARDS)DYN['l4'+id]=Core.POINTS[id];DYN.l4heart=HEART;DYN.l4shade=rt.carry?nextShade():PADP;DYN.l4door=HDOOR;DYN.l4nose=NOSE;DYN.l4fins=FINS;DYN.l4con=CON;}
dyn();
Core.nearestTarget=function(s,p){const o=oNear.apply(this,arguments);if(!s||s.chapter!==4)return o;const q=myQuest(s);if(!q)return o;
 let mine=null,md=1e9;for(const id of q.targets){const P=DYN[id];if(!P)continue;const d=hyp(p.x-P[0],p.z-P[1]);if(d<md){md=d;mine={id,x:P[0],z:P[1]};}}
 const ok=o&&!OLD[o.id]&&!String(o.id).startsWith('l4')?o:null;if(mine&&md<=3.3)return mine;if(ok&&hyp(p.x-ok.x,p.z-ok.z)<=3.3)return ok;return mine||ok;};
Core.interact=function(s,id,p){if(s&&s.chapter===4&&(String(id).startsWith('l4')||OLD[id])&&logic.step(s)){const q=myQuest(s);return{ok:false,text:q?q.detail:tt('core.podoydi_blizhe','Come closer')};}return oInteract.apply(this,arguments);};
const old=(id)=>{const s=gs(),P=Core.POINTS[id];return oInteract.call(Core,s,id,{x:P[0],z:P[1],alt:0});};
const done=r=>{const g=G();if(!g)return;if(g.result)g.result(r);else{g.save&&g.save();g.hud&&g.hud();}};
const hud=()=>{const g=G();g&&g.hud&&g.hud();};
// ---- crew: the engineer waits at the old rocket, then at the pad console for the crane and the ignition
{const NL=root.MoonNpcLife;if(NL&&NL.pose){const op=NL.pose;NL.pose=function(id,hx,hz,t,p){const q=op.apply(this,arguments);const s=gs();if(!s||s.chapter!==4)return q;const P=place(id,s,t);if(!P)return q;return Object.assign({},q||{},P);};}}
function place(id,s,t){const st=logic.step(s);if(!st)return null;const g=G(),p=g&&g.player;const at=(P,yaw)=>({x:P[0],z:P[1],yaw:yaw||0,moving:false,alt:0});
 if(id==='engineer'&&st==='brief'){const y=p?Math.atan2(ENG[0]-p.x,ENG[1]-p.z):0;return at(ENG,y+Math.sin(t*1.3)*.25);}
 if(id==='engineer'&&(st==='top'||st==='ignite')){const P=[CON[0]-3.4,CON[1]-3.2];return at(P,Math.atan2(PAD[0]-P[0],PAD[1]-P[1])+Math.PI);}
 return null;}
// ---- world hooks
const R=root.MoonRenderer&&root.MoonRenderer.prototype;
const isCh4=()=>{const s=gs();return !!s&&s.chapter===4&&!!logic.step(s);};
// the old hangar (-58,26) keeps its shell, the nose and fins now wait in the big hangar
const hideOld=(state,fn)=>{if(!state||state.chapter!==4||!logic.step(state)||n(state.rocketParts)>=2)return fn();const k=state.rocketParts;state.rocketParts=['nose','fins'];try{return fn();}finally{state.rocketParts=k;}};
if(R){const os=R.scene;R.scene=function(state,p,...a){const out=hideOld(state,()=>os.call(this,state,p,...a));try{draw(this,state,p);}catch(e){root.__life4Err=String(e.stack||e);}return out;};
 const ob=R.blocked;R.blocked=function(x,z,state,alt){if(state&&state.chapter===4&&logic.step(state)&&logic.solid(x,z,alt||0))return true;return hideOld(state,()=>ob.apply(this,arguments));};}
// ---- drawing
const WINCH=[1,.55,.08],DARK=[.12,.13,.16],CYAN=[.35,.85,1],GOLD=[.95,.66,.24],FIRE=[1,.55,.15],WHITE=[.95,.95,.9],IVORY=[.9,.88,.82],STEEL=[.55,.58,.62],ROCK=[.42,.38,.35],BLUE=[.3,.6,1];
function rock(r,x,y,z,k,yaw){r.put('sphere',x,y+.35*k,z,1.1*k,.8*k,1*k,ROCK,yaw||0,0,0);r.put('sphere',x+.3*k,y+.55*k,z-.2*k,.6*k,.5*k,.6*k,[.48,.44,.4],(yaw||0)+1,0,0);}
function engineMesh(r,x,y,z,yaw,t,hot){r.put('cylinder',x,y+.9,z,1.1,1.3,1.1,STEEL,yaw,0,0);r.put('cylinder',x,y+.25,z,.8,.5,.8,DARK,yaw,0,0);r.put('cylinder',x,y+1.6,z,1.15,.12,1.15,GOLD,yaw,0,0);
 r.put('cylinder',x,y+1.75,z,.45,.25,.45,DARK,yaw,0,0);if(hot)r.put('cube',x,y+.05,z,.6,.06,.6,FIRE,0,12,.5+.3*Math.sin(t*8));}
function sled(r,x,y,z,yaw,t){r.put('cube',x,y+.18,z,2.2,.2,2.6,[.35,.36,.4],yaw,0,0);for(const sx of[-1,1]){const c=Math.cos(yaw),s=Math.sin(yaw);r.put('cube',x+c*sx*1,y+.08,z-s*sx*1,.18,.16,2.8,DARK,yaw,0,0);}
 r.put('cube',x,y+.3,z,1.6,.05,1.8,CYAN,yaw,12,.25+.15*Math.sin(t*4));}
function marker(r,x,y,z,t,col){const paw=root.MoonCarry&&root.MoonCarry.paw,glow=r.meshes&&r.meshes.mineralGlow;if(glow)r.put('mineralGlow',x,y+.05,z,2.6,1,2.6,col||GOLD,0,22,.45+.2*Math.sin(t*3));r.put('ring',x,y+.08,z,2.2,1,2.2,col||GOLD,0,12,.8);
 r.put('cylinder',x,y+8.5,z,.14,7,.14,col||GOLD,0,12,.3+.1*Math.sin(t*3));if(paw)paw(r,x,y+3.4,z,t);}
function cable(r,ax,ay,az,bx,by,bz,sag,col,w){const N=Math.max(4,Math.round(hyp(bx-ax,bz-az)/1.2));for(let i=0;i<N;i++){const k0=i/N,k1=(i+1)/N,s0=Math.sin(k0*Math.PI)*sag,s1=Math.sin(k1*Math.PI)*sag;
  const x0=ax+(bx-ax)*k0,y0=ay+(by-ay)*k0-s0,z0=az+(bz-az)*k0,x1=ax+(bx-ax)*k1,y1=ay+(by-ay)*k1-s1,z1=az+(bz-az)*k1,l=hyp(x1-x0,y1-y0,z1-z0);
  r.put('cylinder',(x0+x1)/2,(y0+y1)/2,(z0+z1)/2,.07,l,w||.07,col||[.2,.2,.22],Math.atan2(x1-x0,z1-z0),col?12:0,col?.85:0,Math.acos(Math.max(-1,Math.min(1,(y1-y0)/(l||1)))));}}
function topSection(r,x,y,z,t,a){r.put('cylinder',x,y+1.2,z,1.0,2.4,1.0,IVORY,0,0,0);r.put('cylinder',x,y+.05,z,1.05,.14,1.05,GOLD,0,0,0);r.put('sphere',x,y+2.6,z,.95,1.5,.95,IVORY,0,0,0);r.put('sphere',x,y+3.9,z,.18,.3,.18,[1,.35,.2],0,12,.6+.4*Math.sin(t*6));
 r.put('cylinder',x,y+1.5,z,.36,.08,.36,BLUE,Math.PI/2,12,.7,Math.PI/2);}
function hook(r,x,y,z,t){const H=[1,.15,.1],Y=[1,.8,.1];r.put('cube',x,y-.3,z,1.3,.6,.9,Y,0,12,.9);r.put('cube',x,y-1.1,z,.28,1,.28,H,0,12,1);r.put('cube',x+.35,y-1.65,z,1,.24,.28,H,0,12,1);r.put('cube',x+.75,y-1.35,z,.24,.7,.28,H,0,12,1);
 r.put('ring',x,y-1.2,z,2,1,2,Y,0,12,.5+.3*Math.sin(t*5));}
// ① the old crashed rocket by the engineer: a tilted, rusty hull with its nose up and fins half buried
const OLDR=RK.W(4.2,20.5),RUST=[.55,.27,.13],RUST2=[.36,.18,.1];
function oldRocket(r,ter){const[bx,bz]=OLDR,by=ter(bx,bz)-.4,Y=.35+1.9,T=.5,ax=Math.sin(Y)*Math.sin(T),ay=Math.cos(T),az=Math.cos(Y)*Math.sin(T),L=9,P=k=>[bx+ax*k,by+ay*k,bz+az*k];
 let c=P(L/2);r.put('cylinder',c[0],c[1],c[2],1.5,L,1.5,RUST,Y,0,0,T);
 for(const k of[1.2,4.2,7.4]){c=P(k);r.put('cylinder',c[0],c[1],c[2],1.58,.35,1.58,RUST2,Y,0,0,T);}
 c=P(L+1);r.put('sphere',c[0],c[1],c[2],1.45,2.4,1.45,[.62,.36,.2],Y,0,0,T);c=P(5.8);r.put('cylinder',c[0],c[1],c[2],.5,.1,.5,[.2,.5,.6],Y+Math.PI/2,12,.4,Math.PI/2);
 for(let i=0;i<3;i++){const a=Y+i*2.1,q=P(1.4);r.put('cube',q[0]+Math.sin(a)*1.4,q[1]-.2,q[2]+Math.cos(a)*1.4,.16,2.2,1.4,RUST2,a,0,0,T*.6);}
 c=P(-.2);r.put('cylinder',c[0],c[1],c[2],1.1,.9,1.1,[.18,.15,.14],Y,0,0,T);}
// ④ the hangar shell: arches, a roof frame and a back wall (frame-local a ±8, b -8.5..9)
function hangarShell(r,y,t){const M=[.5,.52,.58],D=[.3,.31,.36],W=(a,b)=>HG.W(a,b),Yw=HG.yaw;
 for(const b of[-8,-3,2,7.6]){for(const a of[-8,8]){const[x,z]=W(a,b);r.put('cube',x,y+2.7,z,.45,5.4,.45,M,Yw,0,0);}const[x,z]=W(0,b);r.put('cube',x,y+5.5,z,16.6,.4,.45,M,Yw,0,0);
  for(const sg of[-1,1]){const[qx,qz]=W(sg*4,b);r.put('cube',qx,y+6.2,qz,8.6,.3,.35,M,Yw,0,0,0,sg*.17);}}
 for(const a of[-8,0,8]){const[x,z]=W(a,-.2);r.put('cube',x,y+(a?5.5:6.9),z,.3,.3,15.8,D,Yw,0,0);}
 {const[x,z]=W(0,-8.6);r.put('cube',x,y+2.6,z,16.4,5.2,.3,[.4,.42,.47],Yw,0,0);}
 for(const a of[-8,8]){const[x,z]=W(a,-.2);r.put('cube',x,y+.8,z,.25,1.6,15.6,D,Yw,0,0);}
 {const[x,z]=W(0,9.1);r.put('cube',x,y+5.9,z,6,.6,.3,[1,.66,.2],Yw,12,.6);}}
let shake=0;
function draw(r,state,p){if(!p||!state||state.chapter!==4)return;const s=state,st=logic.step(s);if(!st)return;const t=now(),ch=4,glow=r.meshes&&r.meshes.mineralGlow,ter=(x,z)=>r.terrain(x,z,ch),near=(P,d)=>hyp(p.x-P[0],p.z-P[1])<d;
 if(near(OLDR,140))oldRocket(r,ter);
 if(st==='brief'&&near(ENG,70)){const y=Math.atan2(ENG[0]-p.x,ENG[1]-p.z)+Math.sin(t*1.3)*.25;const k=r._npcActor;r._npcActor={id:'engineer',x:ENG[0],z:ENG[1],yaw:y,hop:0,lean:0,moving:false};try{r.cat(ENG[0],ENG[1],y,t,0,0,4,[.78,.35,.12]);}finally{r._npcActor=k;}}
 if(st==='brief'&&rt.brief<0&&near(ENG,160))marker(r,ENG[0],ter(...ENG),ENG[1],t);
 if(st==='engine'){
  if(near(DRUM,120)){const y=ter(...DRUM);r.put('cube',DRUM[0],y+.4,DRUM[1],1.8,.8,1.4,[.3,.32,.36],.6,0,0);r.put('cylinder',DRUM[0],y+1.1,DRUM[1],.6,1.4,.6,GOLD,.6,0,0,Math.PI/2);r.put('cylinder',DRUM[0],y+1.1,DRUM[1],.66,.2,.66,DARK,.6,0,0,Math.PI/2);
   if(!s.engineFound){if(!rt.cable)marker(r,DRUM[0],y,DRUM[1],t);else{const py=ter(p.x,p.z)+(p.alt||0);cable(r,DRUM[0],y+1.1,DRUM[1],p.x,py+.7,p.z,Math.min(1.2,hyp(p.x-DRUM[0],p.z-DRUM[1])*.05),WINCH,.16);const ey=ter(...ENGINE);marker(r,ENGINE[0],ey,ENGINE[1],t,CYAN);}}}
  if(s.engineFound){const[x,z,yw]=logic.at(rt.d),y=ter(x,z);sled(r,x,y,z,yw,t);engineMesh(r,x,y+.3,z,yw,t,true);
   if(rt.d<SEGL[0]){const dy=ter(...DRUM);cable(r,DRUM[0],dy+1.1,DRUM[1],x,y+2.2,z,.2,WINCH,.16);}
   else if(!s.engineInstalled&&hyp(p.x-x,p.z-z)<14){const py=ter(p.x,p.z)+(p.alt||0);cable(r,x,y+1.4,z,p.x,py+.7,p.z,Math.min(.8,hyp(p.x-x,p.z-z)*.05),WINCH,.16);}
   ROCKS.forEach((d,i)=>{const[rx,rz,ry]=logic.at(d),c=Math.cos(ry),sn=Math.sin(ry);let k=1,ox=0;if(rt.roll[i]>=0){k=1;ox=Math.min(1,rt.roll[i]/.7)*3.4;}else if(rt.clear[i])ox=3.4;const X=rx+c*ox,Z=rz-sn*ox;rock(r,X,ter(X,Z),Z,1.05*k,d);
    if(!rt.clear[i]&&rt.roll[i]<0&&logic.blockRock(rt.d,rt.clear)===i&&rt.d>=d-ROCK_STOP-.6)marker(r,rx,ter(rx,rz)+1.2,rz,t,[1,.5,.2]);});
   if(glow&&near([x,z],60)){const[ex,ez]=PATH[PATH.length-1];r.put('mineralGlow',ex,ter(ex,ez)+.05,ez,3.4,1,3.4,GOLD,0,22,.4+.2*Math.sin(t*3));}
   if(hyp(p.x-x,p.z-z)>SLED_NEAR)marker(r,x,y+.6,z,t,CYAN);}}
 if(st==='shards'&&near(CAVE,80)){SHARDS.forEach((id,i)=>{if(s.coreShards.includes(id))return;const P=Core.POINTS[id],y=ter(...P);
   if(rt.hide[i]>0){const k=Math.min(1,rt.hide[i]*3);r.put('sphere',P[0],y+.3,P[1],1.5*k,1.3*k,1.5*k,[.22,.24,.3],i,0,0);}
   else if(near(P,HIDE_R+5)){if(glow)r.put('mineralGlow',P[0],y+.05,P[1],2.4,1,2.4,CYAN,0,22,.4+.25*Math.sin(t*4+i));if(near(P,HIDE_R)&&(rt.sneak||rt.spd<NOISY)){const paw=root.MoonCarry&&root.MoonCarry.paw;if(paw)paw(r,P[0],y+2.6,P[1],t);}
    for(let k=0;k<5;k++){const a=t*2+k*1.26;r.put('cube',P[0]+Math.cos(a)*.7,y+.6+((t*.5+k*.2)%1)*1.4,P[1]+Math.sin(a)*.7,.07,.07,.07,[.7,.95,1],a,12,.8);}}});
  if(rt.sneak){const y=ter(p.x,p.z);for(let k=0;k<3;k++){const a=k*2.1+t;r.put('ring',p.x,y+.06,p.z,1.2+k*.5,1,1.2+k*.5,[.5,.7,1],a,12,.25-k*.06);}}}
 if(st==='core'&&near(CAVE,120)){
  if(!rt.carry){const y=ter(...HEART);marker(r,HEART[0],y+.8,HEART[1],t,BLUE);}
  for(const[sx,sz]of SHADE){const y=ter(sx,sz);r.put('cylinder',sx,y+.03,sz,SHADE_R*2,.04,SHADE_R*2,[.08,.09,.13],0,0,0);rock(r,sx+.4,y,sz+SHADE_R+.9,2.4,sx);
   if(rt.carry)r.put('ring',sx,y+.08,sz,SHADE_R*2,1,SHADE_R*2,[.5,.7,1],0,12,.35+.15*Math.sin(t*3));}
  if(rt.carry){const D=[PAD[0]+6,PAD[1]+1],y=ter(...D);marker(r,D[0],y,D[1],t,GOLD);const py=ter(p.x,p.z)+(p.alt||0),h=Math.min(1,rt.heat),col=[.3+h*.7,.6-h*.25,1-h*.8];
   r.put('sphere',p.x,py+1.75+Math.sin(t*3)*.05,p.z,.42,.42,.42,col,t,12,.8);if(glow)r.put('mineralGlow',p.x,py+.05,p.z,1.6+h*1.6,1,1.6+h*1.6,col,0,22,.4+.3*h);
   if(h>.6)for(let k=0;k<4;k++){const a=t*5+k*1.6;r.put('cube',p.x+Math.cos(a)*.3,py+2+((t+k*.25)%1)*.9,p.z+Math.sin(a)*.3,.06,.06,.06,FIRE,a,12,.8);}}}
 if(near([HG.x,HG.z],140))hangarShell(r,ter(HG.x,HG.z),t);
 if(st==='hangar'&&near([HG.x,HG.z],140)){const y=ter(HG.x,HG.z);
  {const[x,z]=HDOOR,dy=ter(x,z);r.put('cube',x,dy+.6,z,.6,1.2,.5,DARK,HG.yaw,0,0);r.put('cube',x,dy+1.25,z,.5,.08,.4,s.hangarOpen?[.3,1,.5]:[1,.3,.2],HG.yaw,12,.9);
   const ang=rt.open>=0?Math.min(1,rt.open/1.4)*1.6:s.hangarOpen?1.6:0;r.put('cylinder',x,dy+1.35,z,.06,.8,.06,GOLD,HG.yaw,0,0,ang-.8);if(!s.hangarOpen&&rt.open<0)marker(r,x,dy,z,t);}
  if(s.hangarOpen){if(!s.rocketParts.includes('nose')){const[x,z]=NOSE;topSection(r,x,y+SHELF_TOP,z,t);r.put('cube',x,y+SHELF_TOP+.02,z,.7,.04,.7,GOLD,HG.yaw,12,.5);marker(r,x,y+SHELF_TOP,z,t);
     if(glow)r.put('mineralGlow',x,y+.05,z,3,1,3,GOLD,0,22,.3);}
   if(!s.rocketParts.includes('fins')){const[x,z]=FINS,fy=ter(x,z);for(let k=0;k<3;k++){const c=HG.yaw+k*2.1;r.put('cube',x+Math.cos(c)*.4,fy+.45,z+Math.sin(c)*.4,.08,.9,.7,[.85,.3,.2],c,0,0);}
     RUBBLE.forEach((P,i)=>{let X=P[0],Z=P[1];if(rt.rub[i]){const k=rt.ruT[i]>=0?Math.min(1,rt.ruT[i]/.6):1,dx=P[0]-x,dz=P[1]-z,l=hyp(dx,dz)||1;X+=dx/l*2.6*k;Z+=dz/l*2.6*k;}rock(r,X,ter(X,Z),Z,.75,i);});
     const left=rt.rub.indexOf(0);if(left>=0){const P=RUBBLE[left];marker(r,P[0],ter(...P)+.9,P[1],t,[1,.5,.2]);}else marker(r,x,fy+.9,z,t);}}}
 if((st==='top'||st==='ignite')&&near(PAD,120)){const by=ter(...PAD),cy=ter(...CON);
  r.put('cube',CON[0],cy+.55,CON[1],.9,1.1,.6,DARK,Math.atan2(PAD[0]-CON[0],PAD[1]-CON[1]),0,0);r.put('cube',CON[0],cy+1.15,CON[1],.8,.08,.5,st==='top'?CYAN:FIRE,Math.atan2(PAD[0]-CON[0],PAD[1]-CON[1]),12,.8+.2*Math.sin(t*5));
  if(rt.fall<0&&rt.ign<0)marker(r,CON[0],cy,CON[1],t,st==='top'?CYAN:FIRE);
  if(st==='top'){const mark=by+11.0;
   // crane: a tall mast beside the pad and a boom over the rocket axis
   const MX=PAD[0]+5.8,MZ=PAD[1]-4.8;r.put('cube',MX,by+11.5,MZ,.6,23,.6,[.85,.6,.2],0,0,0);r.put('cube',(MX+PAD[0])/2,by+23,(MZ+PAD[1])/2,hyp(MX-PAD[0],MZ-PAD[1])+3,.5,.5,[.85,.6,.2],Math.atan2(MZ-PAD[1],MX-PAD[0])*-1,0,0);
   r.put('ring',PAD[0],mark+.05,PAD[1],2.3,1,2.3,GOLD,0,12,.75+.25*Math.sin(t*4));if(glow)r.put('mineralGlow',PAD[0],mark+.05,PAD[1],3,1,3,GOLD,0,22,.4);
   let off=logic.swing(rt.sw),h=4.4;if(rt.fall>=0){off=rt.fallOff;h=4.4*(1-Math.min(1,rt.fall/.8));if(rt.miss>0)h=Math.min(4.4,h+(1-rt.miss)*0);}
   const sx=PAD[0],sz=PAD[1]+off;cable(r,sx,by+23,sz-0,sx,mark+h+6,sz,0,WINCH,.22);hook(r,sx,mark+h+6,sz,t);topSection(r,sx,mark+h,sz,t);
   if(rt.fall<0&&Math.abs(off)<HIT)r.put('ring',sx,mark+h-.02,sz,2.1,1,2.1,[.4,1,.5],0,12,.9);}
  if(st==='ignite'&&rt.ign>=0){const k=Math.min(1,Math.max(0,(rt.ign-2.4)/1));for(let i=0;i<26;i++){const a=i*2.4+t*9,rr=(i%5)*.35*k,h=((t*3+i*.13)%1);r.put('cube',PAD[0]+Math.cos(a)*rr,by+1.6-h*1.4,PAD[1]+Math.sin(a)*rr,.35*k+.05,.35*k+.05,.35*k+.05,[1,.4+h*.5,.1],a,12,.9*k);}
   if(glow){r.put('mineralGlow',PAD[0],by+.08,PAD[1],10*k+.1,1,10*k+.1,FIRE,0,22,.8*k);r.put('mineralGlow',PAD[0],by+.12,PAD[1],18*k+.1,1,18*k+.1,[1,.8,.4],0,22,.35*k);}
   for(let i=0;i<14;i++){const a=i*.45+t*.7,rr=3+((t*.8+i*.07)%1)*7*k,hh=.3+((t*.6+i*.11)%1)*2.5;r.put('sphere',PAD[0]+Math.cos(a)*rr,by+hh,PAD[1]+Math.sin(a)*rr,.9*k+.01,.7*k+.01,.9*k+.01,[.75,.7,.65],a,0,0,0,.6);}}}}
// ---- subtitles + the heat bar
const sub=document.createElement('div');sub.id='mk-l4-sub';sub.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:180px;max-width:86vw;z-index:31;display:none;padding:10px 14px;border-radius:14px;background:rgba(8,16,30,.78);border:1px solid rgba(120,210,255,.55);color:#dff6ff;font:600 15px/1.35 system-ui,sans-serif;text-align:center;text-shadow:0 1px 2px #000;pointer-events:none';
document.body.appendChild(sub);
function say(line){if(!line){if(sub.style.display!=='none'){sub.style.display='none';sub._k=null;}return;}if(sub._k===line[0])return;sub._k=line[0];const tx=tt(line[0],line[1]),ci=tx.search(/[:：]/),LK=root.MoonCrewLook&&root.MoonCrewLook[line[2]];sub.textContent='';
 if(LK&&ci>0){const b=document.createElement('b');b.style.color=LK.ui;b.textContent=tx.slice(0,ci+1);sub.append(b,tx.slice(ci+1));}else sub.textContent=tx;sub.style.display='block';}
const bar=document.createElement('div');bar.id='mk-l4-heat';bar.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:150px;width:58vw;max-width:260px;height:16px;z-index:31;display:none;border-radius:9px;background:rgba(8,16,30,.72);border:1px solid rgba(255,255,255,.35);overflow:hidden;pointer-events:none';
const fill=document.createElement('div');fill.style.cssText='height:100%;width:0;background:linear-gradient(90deg,#4aa8ff,#ffb02e,#ff4a2e)';const lab=document.createElement('span');lab.style.cssText='position:absolute;inset:0;font:700 11px/16px system-ui,sans-serif;color:#fff;text-align:center;text-shadow:0 1px 2px #000';bar.append(fill,lab);document.body.appendChild(bar);
const BRIEF=[[0,'l4.brief1','Engineer: "This old rocket will never fly again. But its plans will!"','engineer'],[2.3,'l4.brief2','Engineer: "We build a new one on the pad. First the engine from the wreck!"','engineer']];
const IGN=[[0,'l4.ign1','Engineer: "Ignition test. Three..."','engineer'],[1.2,'l4.ign2','Engineer: "Two... One..."','engineer'],[2.4,'l4.ign3','Engineer: "Fire! Look at that flame!"','engineer'],[4.6,'l4.ign4','Engineer: "She is ready. Next stop - the stars!"','engineer']];
// ---- context button
let mode=null;
function pick(){const g=G();if(!g||!g.player)return null;const s=g.state,p=g.player,alt=p.alt||0,st=cur();if(!st)return null;
 if(root.MoonCarry&&root.MoonCarry.st&&root.MoonCarry.st.held>=0)return null;const near=(P,d)=>hyp(p.x-P[0],p.z-P[1])<d;
 if(st==='brief')return rt.brief<0&&near(ENG,3)&&alt<.6?'talk':null;
 if(st==='engine'){if(!s.engineFound){if(!rt.cable)return near(DRUM,2.8)?'cable':null;return near(ENGINE,2.8)?'hook':null;}
  const r=logic.blockRock(rt.d,rt.clear);if(r>=0&&rt.roll[r]<0){const[x,z]=logic.at(ROCKS[r]);if(near([x,z],2.6))return'rock';}return null;}
 if(st==='shards'){for(let i=0;i<3;i++){const id=SHARDS[i];if(s.coreShards.includes(id)||rt.hide[i]>0)continue;if(near(Core.POINTS[id],1.8))return'shard:'+i;}if(near(CAVE,16))return rt.sneak?'walk':'sneak';return null;}
 if(st==='core'){if(!rt.carry)return near(HEART,2.6)?'core':null;return null;}
 if(st==='hangar'){if(!s.hangarOpen)return rt.open<0&&near(HDOOR,2.6)?'open':null;
  if(!s.rocketParts.includes('nose')&&logic.canNose(p.x,p.z,alt))return'nose';
  if(!s.rocketParts.includes('fins')){const i=rt.rub.indexOf(0);if(i>=0){if(near(RUBBLE[i],1.9)&&alt<.6)return'rub';}else if(near(FINS,2)&&alt<.6)return'fins';}return null;}
 if(st==='top')return rt.fall<0&&near(CON,2.6)?'drop':null;
 if(st==='ignite')return rt.ign<0&&near(CON,2.6)?'ign':null;
 return null;}
const LBL={talk:()=>tt('l3.talk','Talk'),cable:()=>tt('l4.b_cable','Take the cable'),hook:()=>tt('l4.b_hook','Hook the engine'),rock:()=>tt('l4.b_rock','Push the rock away'),
 shard:()=>tt('l4.b_shard','Take the shard'),sneak:()=>tt('l4.b_sneak','Sneak'),walk:()=>tt('l4.b_walk','Walk normally'),core:()=>tt('l4.b_core','Take the core'),
 open:()=>tt('l4.b_open','Pull the door lever'),nose:()=>tt('l4.b_nose','Take the nose'),rub:()=>tt('l4.b_rub','Move the rubble'),fins:()=>tt('l4.b_fins','Take the fins'),
 drop:()=>tt('l4.b_drop','Drop the section!'),ign:()=>tt('l4.b_ign','Ignition!')};
const ctx=()=>{mode=pick();return mode?LBL[mode.split(':')[0]]():null;};
API.ctx=ctx;
{const L1=root.MoonLife1;if(L1){const o=L1.ctx;L1.ctx=()=>ctx()||(o?o():null);}else root.MoonLife1={ctx};}
function act(e){const btn=e.target&&e.target.closest&&e.target.closest('#interact');if(!btn)return;const m=pick();if(!m)return;e.stopImmediatePropagation();e.preventDefault();const g=G(),s=g.state;
 if(m==='talk'){rt.brief=0;sfx('click');}
 else if(m==='cable'){rt.cable=true;sfx('click');toast(tt('l4.t_cable','Cable in paw! Pull it down to the engine.'));hud();}
 else if(m==='hook'){sfx('coin');if(!s.wreckFound)old('wreck');const r=Core.solve(s,'power',POWER.slice());rt.cable=false;rt.d=0;rt.clear=[0,0,0];keep();
  done({ok:!!r.ok,text:r.ok?tt('l4.t_hook','Hooked! The winch lifts the engine. Lead it to the pad!'):r.text});}
 else if(m==='rock'){const i=logic.blockRock(rt.d,rt.clear);rt.roll[i]=0;sfx('click');try{navigator.vibrate&&navigator.vibrate(40);}catch(e){}}
 else if(m.startsWith('shard:')){const i=+m.slice(6);sfx('coin');done(old(SHARDS[i]));}
 else if(m==='sneak'){rt.sneak=true;sfx('click');toast(tt('l4.t_sneak','Sneaking: slow and quiet.'));}
 else if(m==='walk'){rt.sneak=false;sfx('click');}
 else if(m==='core'){sfx('coin');rt.carry=true;rt.heat=0;if(!s.coreFound)done(old('caveHeart'));toast(tt('l4.t_core','The core is hot! Walk from shadow to shadow.'));hud();}
 else if(m==='open'){rt.open=0;sfx('click');}
 else if(m==='nose'){sfx('coin');done(old('nose'));}
 else if(m==='rub'){const i=rt.rub.indexOf(0);rt.rub[i]=1;rt.ruT[i]=0;sfx('click');try{navigator.vibrate&&navigator.vibrate(40);}catch(e){}}
 else if(m==='fins'){sfx('coin');done(old('fins'));}
 else if(m==='drop'){rt.fall=0;rt.fallOff=logic.swing(rt.sw);sfx('click');}
 else if(m==='ign'){rt.ign=0;sfx('click');}}
root.addEventListener('click',act,true);
// ---- loop
let last=performance.now(),hints={},lastSt=null,lp=null;
const cv=()=>document.getElementById('world');
function loop(){const tn=performance.now(),dt=Math.min(.2,Math.max(0,(tn-last)/1000));last=tn;
 try{const g=G();if(g&&g.player&&g.state&&g.state.chapter===4&&cur()){const p=g.player,s=g.state,st=cur();
  if(st!==lastSt){if(lastSt)hints={};lastSt=st;rt.brief=-1;rt.fall=-1;rt.ign=-1;rt.open=-1;if(st!=='core'){rt.carry=false;}if(st!=='shards')rt.sneak=false;say(null);hud();}
  {const c=ctx();if(c){const sp=document.querySelector('#interact span');if(sp&&sp.textContent!==c){sp.textContent=c;sp.parentNode.style.opacity=1;}}if(c!==API._lastCtx){API._lastCtx=c;g.ui&&g.ui();}}
  // speed + sneak / heavy core: pull the step back (the game moves the cat, we keep only a part of it)
  if(lp&&dt>0){const dx=p.x-lp[0],dz=p.z-lp[1],d=hyp(dx,dz);if(d<2){const f=st==='shards'&&rt.sneak?SNEAK:st==='core'&&rt.carry?HEAVY:1;if(f<1){p.x=lp[0]+dx*f;p.z=lp[1]+dz*f;}rt.spd=rt.spd*.8+(d*f/dt)*.2;}else rt.spd=0;}
  lp=[p.x,p.z];
  if(st==='brief'&&rt.brief>=0){rt.brief+=dt;let line=null;for(const L of BRIEF)if(rt.brief>=L[0])line=L;say([line[1],line[2],line[3]]);if(rt.brief>=logic.BRIEF){rt.brief=-1;say(null);sfx('coin');done(old('pad'));}}
  if(st==='engine'){
   if(!s.engineFound&&rt.cable&&!logic.cableOk(p.x,p.z)){rt.cable=false;sfx('click');toast(tt('l4.t_snap','The cable is too short this way - it slipped back to the drum.'));hud();}
   if(!s.engineFound&&!hints.wreck&&hyp(p.x-DRUM[0],p.z-DRUM[1])<30){hints.wreck=1;toast(tt('l4.h_wreck','The engine lies under the winch. Take the cable from the drum on the rim.'));}
   if(s.engineFound){rt.roll.forEach((v,i)=>{if(v>=0){rt.roll[i]+=dt;if(rt.roll[i]>.7){rt.roll[i]=-1;rt.clear[i]=1;keep();sfx('coin');}}});
    const r=logic.sled(rt.d,rt.clear,p.x,p.z,dt);if(r.d!==rt.d){rt.d=r.d;if(Math.floor(rt.d)%3===0)keep();}
    if(r.why==='rock'&&!hints['rk'+logic.blockRock(rt.d,rt.clear)]){hints['rk'+logic.blockRock(rt.d,rt.clear)]=1;toast(tt('l4.t_rock','A rock on the road! Push it away.'));}
    if(r.why==='far'&&!hints.far&&rt.d>0){hints.far=1;toast(tt('l4.t_far','The engine waits for you - stay close.'));}else if(r.why!=='far')hints.far=0;
    if(r.why==='done'){rt.d=0;rt.clear=[0,0,0];keep();sfx('coin');done(old('pad'));}}}
  if(st==='shards'){if(!hints.cave&&hyp(p.x-CAVE[0],p.z-CAVE[1])<22){hints.cave=1;toast(tt('l4.h_cave','Shh... the shards hide from noise. Press "Sneak" and walk up slowly.'));}
   for(let i=0;i<3;i++){if(rt.hide[i]>0){rt.hide[i]-=dt;continue;}if(s.coreShards.includes(SHARDS[i]))continue;const P=Core.POINTS[SHARDS[i]];if(logic.noisy(rt.spd,hyp(p.x-P[0],p.z-P[1]))){rt.hide[i]=HIDE_T;sfx('click');toast(tt('l4.t_hide','Too loud! The shard hid. Sneak!'));}}}
  if(st==='core'&&rt.carry){rt.heat=logic.heat(rt.heat,p.x,p.z,dt);const sh=logic.inShade(p.x,p.z);bar.style.display='block';fill.style.width=Math.round(Math.min(1,rt.heat)*100)+'%';lab.textContent=sh?tt('l4.shade','Shade - cooling'):tt('l4.sun','Sun - heating!');
   if(rt.heat>=1){rt.carry=false;rt.heat=0;sfx('click');try{navigator.vibrate&&navigator.vibrate(120);}catch(e){}toast(tt('l4.t_hot','Too hot! The core rolled back to the cave. Use the shade!'));hud();}
   else if(hyp(p.x-PAD[0],p.z-PAD[1])<CORE_R){rt.carry=false;sfx('coin');done(old('pad'));}}
  else if(bar.style.display!=='none')bar.style.display='none';
  if(st==='hangar'){if(!hints.hg&&hyp(p.x-HG.x,p.z-HG.z)<30){hints.hg=1;toast(s.hangarOpen?tt('l4.h_parts','The nose is up on the shelf: stack the crates and jump. The fins are under the rubble.'):tt('l4.h_door','The door lever is outside the hangar.'));}
   if(rt.open>=0){rt.open+=dt;if(rt.open>1.5){rt.open=-1;sfx('coin');hints.hg=0;done(old('hangar'));}}
   rt.ruT.forEach((v,i)=>{if(v>=0){rt.ruT[i]+=dt;if(rt.ruT[i]>.6)rt.ruT[i]=-1;}});}
  if(st==='top'){if(rt.fall<0)rt.sw+=dt;else{rt.fall+=dt;if(rt.fall>=.8){const ok=Math.abs(rt.fallOff)<HIT;rt.fall=-1;
     if(ok){sfx('coin');const r=Core.solve(s,'align',[0,0,0]);done(r);}else{sfx('click');try{navigator.vibrate&&navigator.vibrate(80);}catch(e){}toast(tt('l4.t_miss','Missed the mark! Wait until it swings right over the gold ring.'));}}}}
  if(st==='ignite'&&rt.ign>=0){rt.ign+=dt;let line=null;for(const L of IGN)if(rt.ign>=L[0])line=L;say([line[1],line[2],line[3]]);
   if(rt.ign>2.4){shake=Math.min(1,(rt.ign-2.4)/.6)*(rt.ign>5.6?Math.max(0,(logic.IGN-rt.ign)/.8):1);try{navigator.vibrate&&rt.ign<2.5&&navigator.vibrate([200,60,200,60,400]);}catch(e){}}
   if(rt.ign>=logic.IGN){rt.ign=-1;shake=0;say(null);sfx('coin');done(old('pad'));}}
  else shake=0;
  {const c=cv();if(c){if(shake>0)c.style.transform=`translate(${((Math.random()-.5)*9*shake).toFixed(1)}px,${((Math.random()-.5)*9*shake).toFixed(1)}px)`;else if(c.style.transform)c.style.transform='';}}
  dyn();}
  else{lp=null;if(bar.style.display!=='none')bar.style.display='none';if(sub._k&&g&&g.state&&g.state.chapter!==4)say(null);const c=cv();if(c&&c.style.transform)c.style.transform='';}}catch(e){root.__life4Err=String(e.stack||e);}
 requestAnimationFrame(loop);}
requestAnimationFrame(loop);
})(typeof globalThis!=='undefined'?globalThis:this);
