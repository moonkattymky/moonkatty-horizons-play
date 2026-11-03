/* life2.js — LIFE #2 «Crew», played with the paws in the world (no menu windows).
   Server checkpoints and save fields stay exactly the old ones (engineerMet, tools[], engineerFixed, navigatorMet, beacons[],
   navigatorSolved, scoutMet, artifact, buildings[], complete, chapter):
   ① the engineer is stuck on the old station roof (-165,55): carry 2 crates to the wall and stack them → engineerMet → c2_engineer
   ② repair kits: one on the high shelf of the broken hangar (60,-195; climb the crates), the other rides on a small
      helper robot that runs away around the hangar (chase it until it is tired, then persuade it)  → tools[] → c2_tools
   ③ give the kits to the engineer; he fixes the jetpack → engineerFixed → c2_repair; then a first short flight over the rift (local flag: the jetpack needs engineerFixed)
   ④ fallen dome (-120,-155): light 3 beacons around the dome; each fades after a while, all 3 must burn → navigatorMet → c2_navigator
   ⑤ lead the navigator over the crack field: he walks in the cat's footsteps, cracks make him fall back → navigatorSolved → c2_route
   ⑥ the scout flashes a light from the far outskirts: find him by the light                    → scoutMet → c2_scout
   ⑦ canyon archive: drag a cable from the generator to the archive terminal around the rocks   → artifact → c2_artifact
   ⑧ bring 3 big module parts from the 3 ruins to the base pad; the module builds, the crew meets → habitat + complete → c2_final, life2
   Mid-life players get the step from the old fields only (never back). Local flags: kits given, parts placed.
   Pure logic: MoonLife2.logic (tests/life2.cjs). */
(function(root){
'use strict';
const frame=(x,z,yaw)=>{const c=Math.cos(yaw),s=Math.sin(yaw);return{x,z,yaw,W:(lx,lz)=>[x+c*lx+s*lz,z-s*lx+c*lz],L:(wx,wz)=>{const dx=wx-x,dz=wz-z;return[c*dx-s*dz,s*dx+c*dz];}};};
const hyp=Math.hypot;
const ST=frame(-165,55,-.3),DM=frame(-120,-155,0),HG=frame(60,-195,.9),RK=frame(150,130,.35);
// ① station roof + crate stack by the right wall
const ROOF=3.45,ENG_ROOF=ST.W(5.4,1.0),STACK=ST.W(7.6,1.0),CR=.8,CRH=.42;
const CRATES0=[ST.W(11,7),ST.W(3.5,9.6)];
const ENG_YARD=ST.W(9.2,4.2);
// ② hangar: kit on the shelf (side-quests2 shelf, top 2.3), robot ring around the hangar
const SHELF_TOP=2.3,KIT1=HG.W(-.45,-6.3);
const RSPOTS=[];for(let i=0;i<10;i++){const a=i/10*Math.PI*2;RSPOTS.push(HG.W(Math.cos(a)*11.5,Math.sin(a)*14));}
const RK_K={near:7,calm:12,alarm:2.5,fast:3.6,idle:1.0,slow:1.1,drain:.1,rest:.03,tireAt:.22,wakeAt:.6,catchR:1.9};
const RING={spots:RSPOTS,k:RK_K,out(x,z){const[a,b]=HG.L(x,z);const n=hyp(a/11.5,b/14)||1;const c=Math.cos(HG.yaw),s=Math.sin(HG.yaw),la=a/n/11.5,lb=b/n/14,l=hyp(la,lb)||1;return[(c*la+s*lb)/l,(-s*la+c*lb)/l];},
 clamp(sp){const[a,b]=HG.L(sp.x,sp.z),r=hyp(a/11.5,b/14)||1;let k=1;if(r<.8)k=.8/r;else if(r>1.3)k=1.3/r;if(k!==1){const[x,z]=HG.W(a*k,b*k);sp.x=x;sp.z=z;}}};
// ③ the rift in front of the station, landing ring on the far side
const RIFT={a0:-16,a1:16,b0:17,b1:20},LAND=ST.W(0,24.5),ENG_RIFT=ST.W(3,14.5);
// ④ dome beacons
const BEAC=[DM.W(0,-13),DM.W(11.3,6.5),DM.W(-11.3,6.5)],BEAC_LIFE=24,NAV_DOOR=DM.W(0,10.4);
// ⑤ crack field (dome-local lines across the path, each with one gap), goal ring
const CRACKS=[{b:18,gap:6},{b:25,gap:-7},{b:32,gap:3}],CRACK_A=16,GAP_W=1.7,GOAL=DM.W(5,40);
// ⑥ scout on the far outskirts
const SCOUT=[118,-44];
// ⑦ canyon: generator → archive terminal (core's artifact terminal at -24,-39), rocks in between
const GEN=[-8,-41],TERM=[-24,-39],ROCKS=[[-16,-39,1.9],[-13,-35,1.4],[-19.5,-43.5,1.5],[-15.5,-46.5,1.4],[-18,-32,1.3]],CABLE_MAX=24;
// ⑧ module parts at the 3 ruins, base pad (core build spot -5,-7)
const PARTS=[RK.W(0,15.5),ST.W(-11,-7),HG.W(0,12.5)],PAD=[-5,-7];
const STEPS=['eng','tools','repair','fly','nav','route','scout','archive','module','crew'];
const OLD={engineer:1,tool1:1,tool2:1,navigator:1,beacon1:1,beacon2:1,beacon3:1,scout:1,artifact:1,base:1,final:1};
const crackAt=(a,b,pad)=>{for(const C of CRACKS){if(Math.abs(b-C.b)<.45+(pad||0)&&Math.abs(a)<CRACK_A&&Math.abs(a-C.gap)>GAP_W/2)return C;}return null;};
const logic={ST,DM,HG,RK,ROOF,ENG_ROOF,STACK,CRATES0,KIT1,SHELF_TOP,RING,RIFT,LAND,BEAC,BEAC_LIFE,CRACKS,GOAL,SCOUT,GEN,TERM,ROCKS,CABLE_MAX,PARTS,PAD,STEPS,OLD,NAV_DOOR,
 // ---- which step (migration: reads only the old save fields + the local flags)
 step(s,loc){if(!s||s.chapter!==2)return null;if(!s.engineerMet)return'eng';if(!Array.isArray(s.tools)||s.tools.length<2)return'tools';if(!s.engineerFixed)return'repair';
  if(!s.navigatorMet&&loc&&loc.fly===1)return'fly';if(!s.navigatorMet)return'nav';if(!s.navigatorSolved)return'route';if(!s.scoutMet)return'scout';if(!s.artifact)return'archive';
  if(!(Array.isArray(s.buildings)&&s.buildings.includes('habitat')))return'module';if(!s.complete)return'crew';return null;},
 fresh(){return{v:1,kits:false,fly:0,parts:[0,0,0]};},
 sanitize(raw,s){const f=logic.fresh();if(raw&&raw.v===1){f.kits=raw.kits===true;f.fly=raw.fly===1||raw.fly===2?raw.fly:0;if(Array.isArray(raw.parts)&&raw.parts.length===3)f.parts=raw.parts.map(v=>v===2?2:0);}
  if(s&&(s.engineerFixed||s.chapter>2))f.kits=true;if(s&&(s.navigatorMet||s.chapter>2))f.fly=f.fly||2;return f;},
 // ---- ① crates
 crates(){return CRATES0.map(([x,z])=>({x,z,lv:0}));},
 top(c){return(c.lv+1)*CR;},
 nearCrate(cr,held,px,pz,alt){if(held>=0||(alt||0)>.2)return -1;let b=-1,bd=1.4;cr.forEach((c,i)=>{const d=hyp(c.x-px,c.z-pz);if(d<bd&&!cr.some((o,j)=>j!==i&&o.lv>c.lv&&hyp(o.x-c.x,o.z-c.z)<.3)){bd=d;b=i;}});return b;},
 dropCrate(cr,held,px,pz,yaw,blocked){if(held<0)return{ok:false};const fx=-Math.sin(yaw),fz=-Math.cos(yaw);let x=px+fx,z=pz+fz;
  if(hyp(x-STACK[0],z-STACK[1])<2||hyp(px-STACK[0],pz-STACK[1])<2.2){const on=cr.filter((c,i)=>i!==held&&hyp(c.x-STACK[0],c.z-STACK[1])<.3).length;cr[held]={x:STACK[0],z:STACK[1],lv:Math.min(on,1)};return{ok:true,snapped:true};}
  if(blocked&&blocked(x,z))return{ok:false};cr[held]={x,z,lv:0};return{ok:true};},
 stackReady(cr){return cr.filter(c=>hyp(c.x-STACK[0],c.z-STACK[1])<.3).length>=2;},
 crateFloor(cr,held,x,z,alt){let f=0;cr.forEach((c,i)=>{if(i===held)return;const t=logic.top(c);if(t<=alt+.15&&t>f&&Math.abs(x-c.x)<CRH+.2&&Math.abs(z-c.z)<CRH+.2)f=t;});return f;},
 crateBlocked(cr,held,x,z,alt){for(let i=0;i<cr.length;i++){if(i===held)continue;const c=cr[i];if(alt<logic.top(c)-.1&&Math.abs(x-c.x)<CRH+.16&&Math.abs(z-c.z)<CRH+.16)return true;}return false;},
 // ---- ② kits
 canTakeKit1(s,px,pz,alt){return logic.step(s)==='tools'&&!s.tools.includes('tool1')&&(alt||0)>=SHELF_TOP-.2&&hyp(px-KIT1[0],pz-KIT1[1])<1.3;},
 robot(){const[x,z]=RSPOTS[2];return{x,z,h:.3,e:1,tired:false,held:false,ti:1,t:0};},
 canPersuade(s,rb,px,pz,alt){return logic.step(s)==='tools'&&!s.tools.includes('tool2')&&!!rb&&rb.tired&&(alt||0)<.4&&hyp(px-rb.x,pz-rb.z)<RK_K.catchR;},
 // ---- ③ rift
 inRift(x,z,pad){const[a,b]=ST.L(x,z);pad=pad||0;return a>RIFT.a0-pad&&a<RIFT.a1+pad&&b>RIFT.b0-pad&&b<RIFT.b1+pad;},
 riftBlocked(x,z,alt){return(alt||0)<.4&&logic.inRift(x,z,.15);},
 landed(px,pz,alt){return(alt||0)<.6&&hyp(px-LAND[0],pz-LAND[1])<2.2;},
 // ---- ④ beacons: lit = times they were lit (seconds); all 3 burning at once wins
 beaconOn(lit,i,now){return lit[i]!=null&&now-lit[i]<BEAC_LIFE;},
 beaconLeft(lit,i,now){return lit[i]==null?0:Math.max(0,1-(now-lit[i])/BEAC_LIFE);},
 allLit(lit,now){return[0,1,2].every(i=>logic.beaconOn(lit,i,now));},
 nearBeacon(lit,px,pz,now){for(let i=0;i<3;i++)if(!logic.beaconOn(lit,i,now)&&hyp(px-BEAC[i][0],pz-BEAC[i][1])<2.2)return i;return -1;},
 // ---- ⑤ escort: the navigator walks along the cat's trail
 crackAt(x,z,pad){const[a,b]=DM.L(x,z);return crackAt(a,b,pad);},
 escort(){const[x,z]=NAV_DOOR;return{x,z,trail:[],safe:[x,z],fall:0,yaw:0,moving:false};},
 escortStep(es,px,pz,dt){if(es.fall>0){es.fall-=dt;es.moving=false;return null;}
  const last=es.trail[es.trail.length-1]||[es.x,es.z];if(hyp(px-last[0],pz-last[1])>.5)es.trail.push([px,pz]);
  const gap=hyp(px-es.x,pz-es.z);es.moving=false;let budget=4.2*dt;
  while(budget>0&&es.trail.length&&gap>1.8){const t=es.trail[0],d=hyp(t[0]-es.x,t[1]-es.z);if(d<=budget){es.x=t[0];es.z=t[1];es.trail.shift();budget-=d;}else{es.x+=(t[0]-es.x)/d*budget;es.z+=(t[1]-es.z)/d*budget;es.yaw=Math.atan2(-(t[0]-es.x),-(t[1]-es.z));budget=0;}es.moving=true;}
  if(logic.crackAt(es.x,es.z,0)){es.x=es.safe[0];es.z=es.safe[1];es.trail=[];es.fall=1.2;return'fell';}
  // a safe point after each crack line he crossed
  const[,b]=DM.L(es.x,es.z);for(const C of CRACKS)if(b>C.b+1.2){const[,sb]=DM.L(es.safe[0],es.safe[1]);if(sb<C.b)es.safe=[es.x,es.z];}
  if(hyp(es.x-GOAL[0],es.z-GOAL[1])<2.6)return'goal';return null;},
 // ---- ⑦ cable
 cable(){return{pts:[GEN.slice()],len:0,taut:false};},
 cableStep(cb,px,pz){const P=cb.pts,last=P[P.length-1];
  if(P.length>1){const pr=P[P.length-2];if(hyp(px-pr[0],pz-pr[1])<.45){P.pop();cb.len-=hyp(last[0]-pr[0],last[1]-pr[1]);cb.taut=false;return null;}}   // walking back rolls it up
  const d=hyp(px-last[0],pz-last[1]);if(d<.8)return null;if(cb.len+d>CABLE_MAX){cb.taut=true;return'taut';}cb.taut=false;P.push([px,pz]);cb.len+=d;return null;},
 cableReach(cb,px,pz){return hyp(px-TERM[0],pz-TERM[1])<2.3;},
 rockBlocked(x,z){for(const[a,b,r]of ROCKS)if(hyp(x-a,z-b)<r)return true;return false;},
 // ---- ⑧ parts
 nearPart(loc,held,px,pz){if(held>=0)return -1;for(let i=0;i<3;i++)if(loc.parts[i]===0&&hyp(px-PARTS[i][0],pz-PARTS[i][1])<2.3)return i;return -1;},
 atPad(px,pz){return hyp(px-PAD[0],pz-PAD[1])<3.6;},
 partsDone(loc){return loc.parts.every(v=>v===2);},
 SCENE:7};
const API={logic,loc:null,rt:{cr:null,held:-1,rb:null,lit:[null,null,null],es:null,cb:null,part:-1,scene:-1,flew:false,down:-1}};
root.MoonLife2=API;
logic.domeWait=s=>!!s&&(s.chapter||1)<=2&&!s.navigatorMet&&!s.complete;   // the side dome-beacons puzzle waits until c2_navigator
if(typeof module!=='undefined'&&module.exports)module.exports=API;
if(typeof document==='undefined')return;
const Core=root.MoonCore;if(!Core)return;
const G=()=>root.MoonGame,KEY='moonkatty-life2-v1',rt=API.rt;
const tt=(k,fb,p)=>{try{const v=root._t?root._t(k,p):null;return v&&v!==k?v:fb.replace(/\{(\w+)\}/g,(_,q)=>p&&p[q]!=null?p[q]:'');}catch(e){return fb;}};
const toast=s=>{const g=G();g&&g.toast&&g.toast(s);};
const sfx=n=>{try{root.MoonSfx&&root.MoonSfx(n);}catch(e){}};
const gs=()=>{const g=G();return g&&g.state;};
API.postponeDome=()=>logic.domeWait(gs());
try{API.loc=logic.sanitize(JSON.parse(localStorage.getItem(KEY)||'null'));}catch(e){API.loc=logic.fresh();}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(API.loc));}catch(e){}};
const cur=()=>{const s=gs();if(!s)return null;return logic.step(s,API.loc);};
const now=()=>performance.now()/1000;
// ---- quest text + targets
const DYN=Core.DYN||(Core.DYN={});
const oQuest=Core.quest,oNear=Core.nearestTarget,oInteract=Core.interact;
function myQuest(s){const st=logic.step(s,API.loc);if(!st)return null;const L=API.loc;
 if(st==='eng')return{id:'l2eng',title:tt('l2.q_eng','Help the engineer off the roof'),detail:tt('l2.q_eng_d','He is stuck on the old station roof. Stack 2 crates by the wall.'),targets:rt.held>=0?['l2stack']:['l2eng'],fraction:.05};
 if(st==='tools'){const n=s.tools.length;return{id:'l2tools',title:tt('l2.q_tools','Repair kits: {n}/2',{n}),detail:tt('l2.q_tools_d','One is on the high hangar shelf, the other rides on a runaway robot.'),targets:['tool1','tool2'].filter(id=>!s.tools.includes(id)).map(id=>id==='tool1'?'l2kit1':'l2robot'),fraction:.12+n*.04};}
 if(st==='repair')return{id:'l2kits',title:tt('l2.q_kits','Bring the kits to the engineer'),detail:tt('l2.q_kits_d','He is waiting by the old station.'),targets:['l2eng'],fraction:.22};
 if(st==='fly'){return{id:'l2fly',title:tt('l2.q_fly','Fly over the rift'),detail:tt('l2.q_fly_d','The jetpack is fixed! Jump and fly to the landing ring.'),targets:['l2land'],fraction:.27};}
 if(st==='nav'){const t=now(),n=[0,1,2].filter(i=>logic.beaconOn(rt.lit,i,t)).length;return{id:'l2nav',title:tt('l2.q_nav','Light the dome beacons: {n}/3',{n}),detail:tt('l2.q_nav_d','Each beacon fades soon. Light all 3 so they burn together.'),targets:[0,1,2].filter(i=>!logic.beaconOn(rt.lit,i,t)).map(i=>'l2b'+i),fraction:.35+n*.03};}
 if(st==='route')return{id:'l2route',title:tt('l2.q_route','Lead the navigator over the cracks'),detail:tt('l2.q_route_d','He steps where you step. Find the gaps in the glowing cracks.'),targets:[rt.es&&rt.es.go?'l2goal':'l2navi'],fraction:.5};
 if(st==='scout')return{id:'l2scout',title:tt('l2.q_scout','Find the scout by his light'),detail:tt('l2.q_scout_d','Watch the horizon: he flashes a lamp from the outskirts.'),targets:['l2scout'],fraction:.6};
 if(st==='archive')return{id:'l2arch',title:tt('l2.q_arch','Run the cable to the archive'),detail:tt('l2.q_arch_d','Take the cable at the generator and go around the rocks. It is not very long!'),targets:[rt.cb?'l2term':'l2gen'],fraction:.7};
 if(st==='module'){const n=L.parts.filter(v=>v===2).length;return{id:'l2mod',title:tt('l2.q_mod','Module parts on the pad: {n}/3',{n}),detail:tt('l2.q_mod_d','The parts lie at the 3 ruins. Carry them one by one to the base pad.'),targets:rt.part>=0?['l2pad']:[0,1,2].filter(i=>L.parts[i]!==2).map(i=>'l2p'+i),fraction:.8+n*.04};}
 return{id:'l2crew',title:tt('l2.q_crew','Meet the crew at the new module'),detail:tt('l2.q_crew_d','Everyone is home. Go to the module.'),targets:['l2pad'],fraction:.96};}
Core.quest=function(s){if(s&&s.chapter===2){try{const q=myQuest(s);if(q)return q;}catch(e){root.__life2Err=String(e);}}return oQuest.apply(this,arguments);};
function dyn(){DYN.l2eng=rt.down>=0||(gs()&&gs().engineerMet)?ENG_YARD:ENG_ROOF;DYN.l2stack=STACK;DYN.l2kit1=KIT1;DYN.l2robot=rt.rb?[rt.rb.x,rt.rb.z]:RSPOTS[2];DYN.l2land=LAND;
 for(let i=0;i<3;i++){DYN['l2b'+i]=BEAC[i];DYN['l2p'+i]=PARTS[i];}DYN.l2navi=rt.es?[rt.es.x,rt.es.z]:NAV_DOOR;DYN.l2goal=GOAL;DYN.l2scout=SCOUT;DYN.l2gen=GEN;DYN.l2term=TERM;DYN.l2pad=PAD;}
dyn();
Core.nearestTarget=function(s,p){const o=oNear.apply(this,arguments);if(!s||s.chapter!==2)return o;const q=myQuest(s);if(!q)return o;
 let mine=null,md=1e9;for(const id of q.targets){const P=DYN[id];if(!P)continue;const d=hyp(p.x-P[0],p.z-P[1]);if(d<md){md=d;mine={id,x:P[0],z:P[1]};}}
 const ok=o&&!OLD[o.id]&&!String(o.id).startsWith('l2')?o:null;if(mine&&md<=3.3)return mine;if(ok&&hyp(p.x-ok.x,p.z-ok.z)<=3.3)return ok;return mine||ok;};
Core.interact=function(s,id,p){if(s&&s.chapter===2&&(String(id).startsWith('l2')||OLD[id])&&logic.step(s)){const q=myQuest(s);return{ok:false,text:q?q.detail:tt('core.podoydi_blizhe','Come closer')};}return oInteract.apply(this,arguments);};
const old=(id)=>{const s=gs(),P=Core.POINTS[id];return oInteract.call(Core,s,id,{x:P[0],z:P[1],alt:0});};
const done=r=>{const g=G();if(!g)return;if(g.result)g.result(r);else{g.save&&g.save();g.hud&&g.hud();}};
const hud=()=>{const g=G();g&&g.hud&&g.hud();};
// ---- crew placement (npc-life poses), the engineer stands on the roof
{const NL=root.MoonNpcLife;if(NL&&NL.pose){const op=NL.pose;NL.pose=function(id,hx,hz,t,p){const q=op.apply(this,arguments);const s=gs();if(!s||s.chapter!==2)return q;const P=place(id,s,t);if(!P)return q;return Object.assign({},q||{},P);};}}
function place(id,s,t){const st=logic.step(s,API.loc);if(!st)return null;const at=(P,yaw,alt,mv)=>({x:P[0],z:P[1],yaw:yaw||0,moving:!!mv,alt:alt||0});
 if(st==='crew'){const k={engineer:-1,navigator:0,scout:1}[id];if(k==null)return null;const A=rt.anchor;if(A&&rt.scene>=0){const fx=-Math.sin(A.y),fz=-Math.cos(A.y),[sx,d]=k<0?[-1.9,1.1]:k>0?[1.9,.9]:[-.7,3.4];return at([A.x+fx*d+Math.cos(A.y)*sx,A.z+fz*d-Math.sin(A.y)*sx],A.y+Math.PI);}return at([PAD[0]+k*1.6,PAD[1]+3.2],Math.PI);}
 if(id==='engineer'){if(st==='eng'){if(rt.down>=0){const k=Math.min(1,rt.down/2.4),P=k<.5?[ENG_ROOF[0]+(STACK[0]-ENG_ROOF[0])*k*2,ENG_ROOF[1]+(STACK[1]-ENG_ROOF[1])*k*2]:[STACK[0]+(ENG_YARD[0]-STACK[0])*(k-.5)*2,STACK[1]+(ENG_YARD[1]-STACK[1])*(k-.5)*2];const alt=k<.5?ROOF-(ROOF-1.6)*k*2+Math.sin(k*2*Math.PI)*.4:1.6*(1-(k-.5)*2)+Math.sin((k-.5)*2*Math.PI)*.4;return at(P,ST.yaw+1.2,Math.max(0,alt),true);}
   return at(ENG_ROOF,ST.yaw+Math.PI*.5+Math.sin(t*1.5)*.6,ROOF,false);}
  if(st==='tools'||st==='repair')return at(ENG_YARD,ST.yaw+2.4);if(st==='fly')return at(ENG_RIFT,ST.yaw);return null;}
 if(id==='navigator'){if(st==='nav')return at(NAV_DOOR,0);if(st==='route'){const e=rt.es;return e?at([e.x,e.z],e.yaw,0,e.moving):at(NAV_DOOR,0);}return null;}
 if(id==='scout'){if(st==='scout'||st==='nav'||st==='route')return at(SCOUT,-1.2);return null;}
 return null;}
const R=root.MoonRenderer&&root.MoonRenderer.prototype;
const nearSite=(x,z)=>hyp(x-ST.x,z-ST.z)<40||hyp(x-HG.x,z-HG.z)<24||hyp(x-GEN[0],z-GEN[1])<26;
const solids=()=>{const s=gs();return s&&s.chapter===2?logic.step(s,API.loc):null;};
if(R){const oc=R.cat;R.cat=function(x,z,yaw,t,moving,alt,ch,...a){const A=this._npcActor;if(A&&A.alt)alt=A.alt;return oc.call(this,x,z,yaw,t,moving,alt,ch,...a);};
 const osc=R.supplyContainer;if(osc)R.supplyContainer=function(x,z,ch){if(ch===2)for(const id of['tool1','tool2']){const P=Core.POINTS[id];if(P[0]===x&&P[1]===z)return;}return osc.apply(this,arguments);};
 const ob=R.blocked;R.blocked=function(x,z,state,alt=0){const st=solids();if(st&&nearSite(x,z)){if(st==='eng'&&rt.cr&&logic.crateBlocked(rt.cr,rt.held,x,z,alt))return true;if((st==='repair'||st==='fly')&&logic.riftBlocked(x,z,alt))return true;if(logic.rockBlocked(x,z)&&alt<1.2)return true;}return ob.apply(this,arguments);};
 const os=R.scene;R.scene=function(state,p,...a){const out=os.call(this,state,p,...a);try{draw(this,state,p);}catch(e){root.__life2Err=String(e.stack||e);}return out;};}
{const S2=root.MoonSide2;if(S2){const of=S2.floor;S2.floor=(x,z,alt)=>{let f=of?of(x,z,alt):0;if(rt.cr&&solids()==='eng'&&hyp(x-ST.x,z-ST.z)<30)f=Math.max(f,logic.crateFloor(rt.cr,rt.held,x,z,alt));return f;};}}
// ---- drawing
const GOLD=[.95,.66,.24],DARK=[.2,.21,.24],ORANGE=[1,.55,.16],CYAN=[.35,.85,1],IVORY=[.92,.9,.86],LAVA=[1,.45,.12];
function kit(r,x,y,z,yaw,t){r.put('cube',x,y+.18,z,.55,.32,.36,[.85,.25,.2],yaw,0,0);r.put('cube',x,y+.36,z,.2,.06,.06,DARK,yaw,0,0);r.put('cube',x,y+.19,z,.57,.06,.38,[.95,.95,.95],yaw,0,.1);}
function robot(r,rb,t,ch,glow,hasKit){const y=r.terrain(rb.x,rb.z,ch),b=Math.abs(Math.sin(t*14))*(rb.tired?0:.06),yaw=rb.yaw||t;
 r.put('cube',rb.x,y+.32+b,rb.z,.5,.38,.5,IVORY,yaw,0,0);r.put('cube',rb.x,y+.33+b,rb.z,.52,.08,.52,GOLD,yaw,0,.05);r.put('sphere',rb.x,y+.62+b,rb.z,.2,.16,.2,rb.tired?[.5,.6,.7]:CYAN,0,12,rb.tired?.1:.6);
 r.put('cylinder',rb.x,y+.12,rb.z,.34,.1,.34,DARK,0,0,0);r.put('cylinder',rb.x,y+.86+b,rb.z,.02,.3,.02,DARK,0,0,0);r.put('sphere',rb.x,y+1.03+b,rb.z,.06,.06,.06,rb.tired?[1,.3,.2]:[.4,1,.5],0,12,.8);
 if(hasKit)kit(r,rb.x,y+.5+b,rb.z,yaw,t);if(rb.tired&&glow)r.put('mineralGlow',rb.x,y+.05,rb.z,1.6,1,1.6,[1,.8,.35],0,22,.45);}
function part(r,i,x,y,z,t,sc){sc=sc||1;if(i===0){r.put('cylinder',x,y+.55*sc,z,.55*sc,1.1*sc,.55*sc,IVORY,0,0,0);r.put('cylinder',x,y+1.12*sc,z,.6*sc,.1*sc,.6*sc,GOLD,0,0,.1);r.put('cylinder',x,y+.05,z,.4*sc,.12*sc,.4*sc,DARK,0,0,0);}
 else if(i===1){r.put('cube',x,y+.45*sc,z,1.5*sc,.9*sc,.25*sc,IVORY,t*.0,0,0);r.put('cube',x,y+.45*sc,z+.14*sc,1.2*sc,.6*sc,.04,[.25,.55,.85],0,5,.15);}
 else{r.put('sphere',x,y+.6*sc,z,.6*sc,.6*sc,.6*sc,IVORY,0,0,0);r.put('cylinder',x,y+.6*sc,z,.64*sc,.1*sc,.64*sc,GOLD,0,0,.1);}}
function crack(r,a0,a1,b,ch,t,glow){const len=a1-a0;if(len<.2)return;const[x,z]=DM.W((a0+a1)/2,b),y=r.terrain(x,z,ch);const y2=y;r.put('cube',x,y2+.07,z,len,.08,.6,[.08,.05,.05],DM.yaw,0,0);r.put('cube',x,y2+.12,z,len,.03,.22,LAVA,DM.yaw,12,.6+.3*Math.sin(t*3+b));if(glow)r.put('mineralGlow',x,y+.06,z,len,1,1.6,[1,.4,.1],0,22,.3);}
function draw(r,state,p){if(!p||!state||state.chapter!==2)return;const s=state,st=logic.step(s,API.loc);if(!st)return;const t=performance.now()/1000,ch=2,glow=r.meshes&&r.meshes.mineralGlow,paw=root.MoonCarry&&root.MoonCarry.paw,C2=root.MoonSide2&&root.MoonSide2.crate,dS=hyp(p.x-ST.x,p.z-ST.z),dH=hyp(p.x-HG.x,p.z-HG.z),dD=hyp(p.x-DM.x,p.z-DM.z);
 // held things above the cat
 const py=r.terrain(p.x,p.z,ch)+(p.alt||0);
 if(st==='eng'&&dS<70&&rt.cr){rt.cr.forEach((c,i)=>{if(i===rt.held){if(C2)C2(r,p.x,py+1.95,p.z,0,.62);return;}if(C2)C2(r,c.x,r.terrain(c.x,c.z,ch)+c.lv*CR,c.z,ST.yaw,1);});
  if(glow){const y=r.terrain(STACK[0],STACK[1],ch);r.put('mineralGlow',STACK[0],y+.05,STACK[1],1.8,1,1.8,[1,.75,.3],0,22,.35+.15*Math.sin(t*4));}
  if(paw&&rt.held>=0)paw(r,STACK[0],r.terrain(STACK[0],STACK[1],ch)+2.2,STACK[1],t);}
 if(st==='tools'&&dH<70){if(!s.tools.includes('tool1')){const y=r.terrain(KIT1[0],KIT1[1],ch)+SHELF_TOP;kit(r,KIT1[0],y,KIT1[1],HG.yaw,t);if(glow)r.put('mineralGlow',KIT1[0],y+.05,KIT1[1],1.3,1,1.3,[1,.5,.4],0,22,.4);if(paw&&dH<20)paw(r,KIT1[0],y+1.2,KIT1[1],t);}
  if(!s.tools.includes('tool2')&&rt.rb){robot(r,rt.rb,t,ch,glow,true);if(paw&&rt.rb.tired)paw(r,rt.rb.x,r.terrain(rt.rb.x,rt.rb.z,ch)+1.6,rt.rb.z,t);}}
 if((st==='repair'||st==='fly')&&dS<80){// rift + landing ring
  const[x,z]=ST.W(0,(RIFT.b0+RIFT.b1)/2),y=r.terrain(x,z,ch),w=RIFT.a1-RIFT.a0,dpt=RIFT.b1-RIFT.b0;r.put('cube',x,y-.3,z,w,.7,dpt,[.05,.04,.04],ST.yaw,0,0);r.put('cube',x,y+.02,z,w,.04,dpt*.5,LAVA,ST.yaw,12,.35+.15*Math.sin(t*2));
  for(const e of[-1,1]){const[ex,ez]=ST.W(0,(RIFT.b0+RIFT.b1)/2+e*dpt/2);r.put('cube',ex,r.terrain(ex,ez,ch)+.1,ez,w,.22,.25,[.45,.38,.32],ST.yaw,0,0);}
  if(glow)r.put('mineralGlow',x,y+.08,z,w,1,dpt*1.6,[1,.4,.12],0,22,.35);
  const ly=r.terrain(LAND[0],LAND[1],ch);r.put('ring',LAND[0],ly+.07,LAND[1],1.8,1,1.8,API.loc.kits?CYAN:[.6,.6,.6],0,12,st==='fly'?.7:.1);if(st==='fly'&&paw)paw(r,LAND[0],ly+1.6,LAND[1],t);
  if(rt.scene>=0&&rt.scene<2.5){const[ex,ez]=ENG_YARD;for(let k=0;k<3;k++)r.put('sphere',ex+Math.sin(t*20+k)*.4,r.terrain(ex,ez,ch)+.9+Math.cos(t*17+k)*.3,ez+Math.cos(t*23+k)*.4,.06,.06,.06,[1,.85,.4],0,12,.9);}}
 if(st==='nav'&&dD<80){const tn=now();for(let i=0;i<3;i++){const[x,z]=BEAC[i],y=r.terrain(x,z,ch),k=logic.beaconLeft(rt.lit,i,tn),on=k>0;
   r.put('cylinder',x,y+.9,z,.18,1.8,.18,DARK,0,0,0);r.put('sphere',x,y+1.95,z,.32,.32,.32,on?[.4,.9,1]:[.35,.38,.42],0,12,on?.3+.6*k:0);
   if(on){r.put('cylinder',x,y+5,z,.12*k+.04,8,.12*k+.04,[.4,.9,1],0,12,.35+.4*k);if(glow)r.put('mineralGlow',x,y+.05,z,2.4*k+.6,1,2.4*k+.6,[.4,.85,1],0,22,.5);r.put('ring',x,y+.06,z,1.1,1,1.1,k<.3?[1,.4,.2]:CYAN,0,12,.5);}
   else if(paw&&hyp(p.x-x,p.z-z)<30)paw(r,x,y+2.9,z,t);}}
 if(st==='route'&&dD<90){for(const C of CRACKS){const g0=C.gap-GAP_W/2,g1=C.gap+GAP_W/2;crack(r,-CRACK_A,g0,C.b,ch,t,glow);crack(r,g1,CRACK_A,C.b,ch,t,glow);
   const[gx,gz]=DM.W(C.gap,C.b);if(glow&&rt.es)r.put('mineralGlow',gx,r.terrain(gx,gz,ch)+.05,gz,1.2,1,1.2,[.4,1,.6],0,22,.15);}
  const gy=r.terrain(GOAL[0],GOAL[1],ch);r.put('ring',GOAL[0],gy+.07,GOAL[1],2.2,1,2.2,CYAN,0,12,.7);r.put('cylinder',GOAL[0],gy+3,GOAL[1],.08,6,.08,CYAN,0,12,.5);}
 if(st==='scout'||st==='nav'||st==='route'){const[x,z]=[SCOUT[0]+1.7,SCOUT[1]],d=hyp(p.x-x,p.z-z);if(st==='scout'&&d<420){const y=r.terrain(x,z,ch),ph=(t%3)/3,fl=ph<.12?1-ph/.12:0;
   r.put('cylinder',x,y+22,z,.35+fl*.5,44,.35+fl*.5,[1,.95,.7],0,12,.15+.85*fl);if(glow&&d<160)r.put('mineralGlow',x,y+.1,z,6*fl+1,1,6*fl+1,[1,.9,.6],0,22,.6*fl+.1);
   if(d<60)r.put('sphere',x+.4,y+1.7,z,.18+fl*.25,.18+fl*.25,.18+fl*.25,[1,.95,.75],0,12,.4+.6*fl);}}
 if(st==='archive'&&hyp(p.x-GEN[0],p.z-GEN[1])<70){const[gx,gz]=GEN,gy=r.terrain(gx,gz,ch);r.put('cube',gx,gy+.6,gz,1.3,1.2,.9,IVORY,0,0,0);r.put('cube',gx,gy+1.25,gz,1.36,.1,.96,GOLD,0,0,.1);r.put('sphere',gx,gy+1.5,gz,.22,.22,.22,[1,.75,.3],0,12,.5+.3*Math.sin(t*4));
  for(const[a,b,rr]of ROCKS){const y=r.terrain(a,b,ch);r.put('sphere',a,y+rr*.45,b,rr,rr*.9,rr,[.42,.36,.32],a,0,0);}
  if(rt.cb){const P=rt.cb.pts.concat([[p.x,p.z]]);for(let i=1;i<P.length;i++){const[a0,b0]=P[i-1],[a1,b1]=P[i],L=hyp(a1-a0,b1-b0);if(L<.05)continue;const mx=(a0+a1)/2,mz=(b0+b1)/2;const cy=r.terrain(mx,mz,ch),cc=rt.cb.taut?[1,.3,.15]:[1,.85,.3];r.put('cube',mx,cy+.16,mz,.22,.22,L+.1,cc,Math.atan2(a1-a0,b1-b0),12,.9+.1*Math.sin(t*6));if(glow)r.put('mineralGlow',mx,cy+.05,mz,1.6,1,L+1.2,cc,Math.atan2(a1-a0,b1-b0),22,.45);}}
  else if(paw)paw(r,gx,gy+2.4,gz,t);
  if(rt.cb&&paw){const ty=r.terrain(TERM[0],TERM[1],ch);paw(r,TERM[0],ty+3.2,TERM[1],t);}}
 if(st==='module'){for(let i=0;i<3;i++){const L=API.loc.parts[i];if(i===rt.part){part(r,i,p.x,py+1.35,p.z,t,.8);continue;}const[x,z]=L===2?[PAD[0]+(i-1)*1.9,PAD[1]-.6]:PARTS[i];if(hyp(p.x-x,p.z-z)>90)continue;const y=r.terrain(x,z,ch);part(r,i,x,y,z,t,L===2?1.2:1.7);
   if(L!==2){r.put('cylinder',x,y+6,z,.14,12,.14,[1,.8,.4],0,12,.55);r.put('ring',x,y+.08,z,2,1,2,[1,.75,.3],0,12,.6+.3*Math.sin(t*3+i));if(glow)r.put('mineralGlow',x,y+.05,z,3.6,1,3.6,[1,.75,.3],0,22,.55+.15*Math.sin(t*2.6+i));if(paw&&hyp(p.x-x,p.z-z)<40&&rt.part<0)paw(r,x,y+3.4,z,t+i);}}
  if(rt.part>=0){const y=r.terrain(PAD[0],PAD[1],ch);r.put('ring',PAD[0],y+.08,PAD[1],2.6,1,2.6,CYAN,0,12,.7);if(glow)r.put('mineralGlow',PAD[0],y+.05,PAD[1],4,1,4,[.4,.9,1],0,22,.4+.2*Math.sin(t*4));if(paw)paw(r,PAD[0],y+2.6,PAD[1],t);}}}
// ---- context button
let mode=null;
function pick(){const g=G();if(!g||!g.player)return null;const s=g.state,p=g.player,alt=p.alt||0,st=cur();if(!st)return null;
 if(root.MoonCarry&&root.MoonCarry.st&&root.MoonCarry.st.held>=0)return null;
 if(st==='eng'&&rt.cr&&rt.down<0){if(rt.held>=0)return'drop';return logic.nearCrate(rt.cr,rt.held,p.x,p.z,alt)>=0?'crate':null;}
 if(st==='tools'){if(logic.canTakeKit1(s,p.x,p.z,alt))return'kit1';if(logic.canPersuade(s,rt.rb,p.x,p.z,alt))return'persuade';return null;}
 if(st==='repair'&&rt.scene<0&&hyp(p.x-ENG_YARD[0],p.z-ENG_YARD[1])<2.8&&alt<.5)return'kits';
 if(st==='nav'&&logic.nearBeacon(rt.lit,p.x,p.z,now())>=0)return'beacon';
 if(st==='route'&&!(rt.es&&rt.es.go)&&hyp(p.x-NAV_DOOR[0],p.z-NAV_DOOR[1])<3.2)return'lead';
 if(st==='scout'&&hyp(p.x-SCOUT[0],p.z-SCOUT[1])<3)return'wave';
 if(st==='archive'){if(!rt.cb&&hyp(p.x-GEN[0],p.z-GEN[1])<2.4)return'cable';if(rt.cb&&logic.cableReach(rt.cb,p.x,p.z))return'plug';return null;}
 if(st==='module'){if(rt.part>=0)return logic.atPad(p.x,p.z)?'place':null;return logic.nearPart(API.loc,rt.part,p.x,p.z)>=0&&alt<.6?'part':null;}
 if(st==='crew'&&logic.atPad(p.x,p.z)&&rt.scene<0)return'crew';
 return null;}
const LBL={crate:()=>tt('carry.take','Pick up'),drop:()=>tt('carry.put','Put down'),kit1:()=>tt('l2.kit_take','Take the kit'),persuade:()=>tt('l2.persuade','Persuade the robot'),kits:()=>tt('l2.give_kits','Give the kits'),
 beacon:()=>tt('l2.light','Light the beacon'),lead:()=>tt('l2.lead','Lead the way'),wave:()=>tt('l2.wave','Flash back'),cable:()=>tt('l2.cable_take','Take the cable'),plug:()=>tt('l2.plug','Plug in the cable'),
 part:()=>tt('carry.take','Pick up'),place:()=>tt('l2.place','Put on the pad'),crew:()=>tt('l2.crew_call','Call the crew')};
const ctx=()=>{mode=pick();return mode?LBL[mode]():null;};
API.ctx=ctx;
{const L1=root.MoonLife1;if(L1){const o=L1.ctx;L1.ctx=()=>ctx()||(o?o():null);}else root.MoonLife1={ctx};}
function act(e){const btn=e.target&&e.target.closest&&e.target.closest('#interact');if(!btn)return;const m=pick();if(!m)return;e.stopImmediatePropagation();e.preventDefault();const g=G(),s=g.state,p=g.player;
 if(m==='crate'){rt.held=logic.nearCrate(rt.cr,-1,p.x,p.z,p.alt||0);sfx('click');hud();}
 else if(m==='drop'){const r=logic.dropCrate(rt.cr,rt.held,p.x,p.z,p.yaw||0,(x,z)=>g.renderer.blocked(x,z,s,0));if(r.ok){rt.held=-1;sfx('click');if(logic.stackReady(rt.cr)){rt.down=0;toast(tt('l2.eng_down','The engineer: "Thank you, kitty! Coming down!"'));}hud();}else toast(tt('l2.no_room','No room here.'));}
 else if(m==='kit1'){sfx('coin');done(old('tool1'));}
 else if(m==='persuade'){sfx('coin');toast(tt('l2.robot_ok','Beep-boop! The robot gives you the kit.'));rt.rb=null;done(old('tool2'));}
 else if(m==='kits'){rt.scene=0;sfx('coin');toast(tt('l2.fixing','The engineer fixes your jetpack...'));hud();}
 else if(m==='beacon'){const i=logic.nearBeacon(rt.lit,p.x,p.z,now());rt.lit[i]=now();sfx('click');if(logic.allLit(rt.lit,now()))finishNav();else{toast(tt('l2.lit','Lit! It will fade soon - hurry to the next one.'));hud();}}
 else if(m==='lead'){rt.es=logic.escort();rt.es.go=true;sfx('click');toast(tt('l2.follow','The navigator: "I follow you. Mind the cracks!"'));hud();}
 else if(m==='wave'){sfx('coin');toast(tt('l2.scout_ok','The scout: "You saw my light! I am with you."'));done(old('scout'));}
 else if(m==='cable'){rt.cb=logic.cable();sfx('click');toast(tt('l2.cable_hint','The cable is short: go around the rocks the short way.'));hud();}
 else if(m==='plug'){rt.cb=null;sfx('coin');done(old('artifact'));}
 else if(m==='part'){rt.part=logic.nearPart(API.loc,-1,p.x,p.z);sfx('click');toast(tt('l2.part_hint','Carry it to the base pad.'));hud();}
 else if(m==='place'){API.loc.parts[rt.part]=2;rt.part=-1;save();sfx('coin');if(logic.partsDone(API.loc))buildModule();else hud();}
 else if(m==='crew'){const g=G();rt.anchor={x:g.player.x,z:g.player.z,y:g.camYaw||0};rt.scene=0;sfx('click');}}
root.addEventListener('click',act,true);
function finishNav(){const s=gs();sfx('coin');toast(tt('l2.nav_ok','All 3 beacons burn! The navigator comes out of the dome.'));const r=old('navigator');for(const id of['beacon1','beacon2','beacon3'])if(!s.beacons.includes(id))old(id);rt.lit=[null,null,null];done(r);}
function buildModule(){const s=gs();const[c,m]=Core.COST.habitat;s.crystals+=c;s.metal+=m;const r=Core.build(s,'habitat',{x:PAD[0],z:PAD[1],alt:0});if(!r.ok){s.crystals-=c;s.metal-=m;}toast(tt('l2.built','The parts click together: the habitat module is up!'));done(r);}
// ---- crew scene at the new module
const sub=document.createElement('div');sub.id='mk-l2-sub';sub.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:180px;max-width:86vw;z-index:31;display:none;padding:10px 14px;border-radius:14px;background:rgba(8,16,30,.78);border:1px solid rgba(120,210,255,.55);color:#dff6ff;font:600 15px/1.35 system-ui,sans-serif;text-align:center;text-shadow:0 1px 2px #000;pointer-events:none';
document.body.appendChild(sub);
const LINES=[[0,'l2.crew1','Engineer: "The module holds. I checked every bolt!"','engineer'],[2.3,'l2.crew2','Navigator: "And I know every safe path around here."','navigator'],[4.6,'l2.crew3','Scout: "Then let us find out who sends that strange signal!"','scout']];
// ---- loop
let last=performance.now(),hints={},stuckT=0;
function loop(){const tn=performance.now(),dt=Math.min(.2,Math.max(0,(tn-last)/1000));last=tn;
 try{const g=G();if(g&&g.player&&g.state&&g.state.chapter===2){const p=g.player,s=g.state,st=cur();if(st!==API._st){API._st=st;rt.scene=-1;rt.flew=false;sub.style.display='none';hud();}const dS=hyp(p.x-ST.x,p.z-ST.z),dH=hyp(p.x-HG.x,p.z-HG.z),dD=hyp(p.x-DM.x,p.z-DM.z);
  {const c=ctx();if(c){const sp=document.querySelector('#interact span');if(sp&&sp.textContent!==c){sp.textContent=c;sp.parentNode.style.opacity=1;}}if(c!==API._lastCtx){API._lastCtx=c;g.ui&&g.ui();}}
  if(st==='eng'){if(!rt.cr)rt.cr=logic.crates();if(!hints.eng&&dS<30){hints.eng=1;toast(tt('l2.eng_help','The engineer: "Kitty! I am stuck up here. Stack two crates by the wall!"'));}
   if(rt.down>=0){rt.down+=dt;if(rt.down>=2.6){rt.down=-1;rt.cr=null;rt.held=-1;sfx('coin');done(old('engineer'));}}}
  else if(rt.cr){rt.cr=null;rt.held=-1;}
  if(st==='tools'){if(!hints.hg&&dH<28){hints.hg=1;toast(tt('l2.tools_hint','One kit is on the high shelf. And a little robot is running off with the other!'));}
   if(!s.tools.includes('tool2')&&dH<70){if(!rt.rb)rt.rb=logic.robot();const S2=root.MoonSide2;if(S2&&S2.logic){const ox=rt.rb.x,oz=rt.rb.z;S2.logic.sparkStep(rt.rb,p.x,p.z,dt,RING);if(hyp(rt.rb.x-ox,rt.rb.z-oz)>.001)rt.rb.yaw=Math.atan2(rt.rb.x-ox,rt.rb.z-oz);}
    if(rt.rb.tired&&!hints.rbt&&hyp(p.x-rt.rb.x,p.z-rt.rb.z)<9){hints.rbt=1;toast(tt('l2.robot_tired','The robot is tired - talk to it!'));}else if(!rt.rb.tired)hints.rbt=0;}}
  if(st==='repair'&&rt.scene>=0){rt.scene+=dt;if(rt.scene>=2.5){rt.scene=-1;API.loc.kits=true;API.loc.fly=1;save();done(old('engineer'));toast(tt('l2.fly_hint','Jetpack fixed! Fly over the rift to the landing ring.'));}}
  if(st==='fly'){{if(logic.inRift(p.x,p.z,.3)&&(p.alt||0)>.4)rt.flew=true;if(logic.landed(p.x,p.z,p.alt)){if(rt.flew){rt.flew=false;API.loc.fly=2;save();sfx('coin');toast(tt('l2.flown','First flight! The engineer: "Perfect! Now find the navigator at the dome."'));hud();}else if(!hints.walk){hints.walk=1;toast(tt('l2.fly_needed','Nice try! Now fly over the rift with the jetpack.'));}}else hints.walk=0;}}
  if(st==='nav'){if(!hints.nav&&dD<34){hints.nav=1;toast(tt('l2.nav_hint','The beacons around the dome are dark. Light all 3 before they fade!'));}
   const tq=now();for(let i=0;i<3;i++)if(rt.lit[i]!=null&&!logic.beaconOn(rt.lit,i,tq)){rt.lit[i]=null;toast(tt('l2.faded','A beacon faded. Be quicker!'));hud();}}
  if(st==='route'&&rt.es&&rt.es.go){const r=logic.escortStep(rt.es,p.x,p.z,dt);if(r==='fell'){sfx('click');toast(tt('l2.fell','Ouch! A crack! Lead him through the gap.'));try{navigator.vibrate&&navigator.vibrate(60);}catch(e){}}
   else if(r==='goal'){const es=rt.es;rt.es=null;for(const id of['beacon1','beacon2','beacon3'])if(!s.beacons.includes(id))old(id);const res=Core.solve(s,'route',['cyan','gold','white']);sfx('coin');done(res);}
   else if(rt.es&&hyp(p.x-rt.es.x,p.z-rt.es.z)>16){stuckT+=dt;if(stuckT>2){stuckT=-6;toast(tt('l2.wait','The navigator: "Not so fast! Wait for me."'));}}}
  if(st==='route'&&!rt.es&&!hints.rt&&dD<30){hints.rt=1;toast(tt('l2.route_hint','The navigator will follow you. Show him the safe way over the cracks.'));}
  if(st==='scout'&&!hints.sc){hints.sc=1;toast(tt('l2.scout_hint','Look! A light flashes on the horizon. That is the scout!'));}
  if(st==='archive'){if(rt.cb){if(logic.cableStep(rt.cb,p.x,p.z)==='taut'){const P=rt.cb.pts[rt.cb.pts.length-1],d=hyp(p.x-P[0],p.z-P[1])||1;const k=Math.max(0,(d-.6)/d);p.x-=(p.x-P[0])*k*.5;p.z-=(p.z-P[1])*k*.5;if(!hints.taut){hints.taut=1;toast(tt('l2.taut','The cable is too short this way. Walk back and go around closer.'));}}else hints.taut=0;}}
  else if(rt.cb)rt.cb=null;
  if(st!=='module'&&rt.part>=0)rt.part=-1;
  if(st==='crew'){if(rt.scene>=0){rt.scene+=dt;let line=null;for(const L of LINES)if(rt.scene>=L[0])line=L;if(sub._k!==(line&&line[1])){sub._k=line&&line[1];const tx=line?tt(line[1],line[2]):'',ci=tx.search(/[:：]/),LK=line&&root.MoonCrewLook&&root.MoonCrewLook[line[3]];sub.textContent='';if(LK&&ci>0){const b=document.createElement('b');b.style.color=LK.ui;b.textContent=tx.slice(0,ci+1);sub.append(b,tx.slice(ci+1));}else sub.textContent=tx;}sub.style.display=line?'block':'none';if(rt.scene>=logic.SCENE){rt.scene=-1;sub.style.display='none';done(old('final'));}}}
  else if(sub.style.display!=='none')sub.style.display='none';
  dyn();}}catch(e){root.__life2Err=String(e.stack||e);}
 requestAnimationFrame(loop);}
requestAnimationFrame(loop);
})(typeof globalThis!=='undefined'?globalThis:this);
