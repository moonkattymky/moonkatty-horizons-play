/* life1.js — LIFE #1 «Awakening», played with the paws in the world (no menu windows).
   The server checkpoints and the save fields stay exactly the old ones (recorder, cells[], antenna, signal, chapter):
   ① the ship log tumbles out of the capsule and rolls downhill: catch it            → recorder  → c1_recorder
   ② 3 energy cells at the crashed rocket (150,130): on a wreck slab (jump), behind the rubble in the breach (carry the stones
      away, carry.js), and one rides a small runaway spark (side-quests2 spark AI on a ring around the hull) → cells → c1_cells
   ③ carry them to the tower while small meteors fall; a shadow on the ground shows where             → antenna → c1_antenna
   ④ walk around the tower with the hot/cold scanner, then climb the crate ladder to the mast platform → signal  → c1_signal
   ⑤ back at the capsule the radio wakes up: the crew's first message                                 → chapter end → life1
   The only new local flag is 'peak' (the signal spot was found). Players in the middle of the old life get the step derived
   from the old fields, so they land on the nearest new step and never go back. Pure logic: MoonLife1.logic (tests/life1.cjs). */
(function(root){
'use strict';
const frame=(x,z,yaw)=>{const c=Math.cos(yaw),s=Math.sin(yaw);return{x,z,yaw,W:(lx,lz)=>[x+c*lx+s*lz,z-s*lx+c*lz],L:(wx,wz)=>{const dx=wx-x,dz=wz-z;return[c*dx-s*dz,s*dx+c*dz];},D:(lx,lz)=>[c*lx+s*lz,-s*lx+c*lz]};};
const POD=[-5,-2],TOWER=[0,-24];
const RK=frame(150,130,.35),TW=frame(TOWER[0],TOWER[1],0);
// solid boxes (frame-local centre, half sizes, top): the wreck slab, the mast platform, the crate ladder
const WRECK={F:RK,a:-5,b:7.5,ha:1.1,hb:.7,top:1.0};
const PLAT={F:TW,a:2.4,b:0,ha:.8,hb:.8,top:2.4};
const LADDER=[{F:TW,a:3.6,b:0,ha:.4,hb:.4,top:1.6},{F:TW,a:4.4,b:0,ha:.4,hb:.4,top:.8}];
const CELL2=RK.W(4.6,.6);
const PEAKS=[[11,9],[-11,10],[10,-12],[-12,-9]].map(([a,b])=>TW.W(a,b));
// the small spark runs on an ellipse around the hull (rocket-local a=21, b=11); neighbours only, so it never cuts through
const EA=21,EB=11,RSPOTS=[];for(let i=0;i<10;i++){const a=i/10*Math.PI*2;RSPOTS.push(RK.W(Math.cos(a)*EA,Math.sin(a)*EB));}
const K={near:7,calm:12,alarm:2.5,fast:3.9,idle:1.1,slow:1.2,drain:.1,rest:.03,tireAt:.22,wakeAt:.6,catchR:1.9};
const RING={spots:RSPOTS,k:K,
 out(x,z){const[l,m]=RK.L(x,z);let nl=l/(EA*EA),nm=m/(EB*EB);const n=Math.hypot(nl,nm)||1;const d=RK.D(nl/n,nm/n);return d;},
 clamp(sp){const[l,m]=RK.L(sp.x,sp.z),r=Math.hypot(l/EA,m/EB)||1;let k=1;if(r<.8)k=.8/r;else if(r>1.3)k=1.3/r;if(k!==1){const[x,z]=RK.W(l*k,m*k);sp.x=x;sp.z=z;}}};
const STEPS=['log','cells','carry','scan','mast','pod'];
const OLD={recorder:1,cell1:1,cell2:1,cell3:1,antenna:1};
const hyp=Math.hypot,HG=.85,RADIO_R=3.5;
function inBox(B,x,z,pad){const[a,b]=B.F.L(x,z);return Math.abs(a-B.a)<B.ha+pad&&Math.abs(b-B.b)<B.hb+pad;}
const logic={POD,TOWER,RK,TW,WRECK,PLAT,LADDER,CELL2,PEAKS,RING,K,STEPS,OLD,inBox,
 // ---- which step (the migration is this function: it only reads the old save fields)
 step(s,loc){if(!s||s.chapter!==1)return null;if(!s.recorder)return'log';if(!Array.isArray(s.cells)||s.cells.length<3)return'cells';if(!s.antenna)return'carry';if(!s.signal)return loc&&loc.peak?'mast':'scan';return'pod';},
 // where the old life would have been (for the "never back" check)
 oldStep(s){if(!s.recorder)return 0;if(s.cells.length<3)return 1;if(!s.antenna)return 2;if(!s.signal)return 3;return 5;},
 fresh(){return{v:1,peak:false};},
 sanitize(raw,s){const f=logic.fresh();if(raw&&raw.v===1)f.peak=!!raw.peak;if(s&&(s.signal||s.chapter>1))f.peak=true;return f;},
 // ---- solids
 boxes(s,loc){const L=[WRECK,PLAT];if(loc&&loc.peak||s&&(s.signal||s.chapter>1))L.push(...LADDER);return L;},
 floor(list,x,z,alt){let f=0;for(const B of list)if(B.top<=alt+.15&&B.top>f&&inBox(B,x,z,.2))f=B.top;return f;},
 blocked(list,x,z,alt){for(const B of list)if(alt<B.top-.1&&inBox(B,x,z,.16))return true;return false;},
 // ---- ① the log
 logDir(blocked,height,from){let best=null;const h0=height?height(POD[0],POD[1]):0;
  for(let i=0;i<16;i++){const a=i/16*Math.PI*2,dx=Math.sin(a),dz=Math.cos(a);let len=0;for(let k=2;k<=24;k++){const x=POD[0]+dx*k,z=POD[1]+dz*k;if(blocked&&(blocked(x,z)||blocked(x+dz*1.1,z-dx*1.1)||blocked(x-dz*1.1,z+dx*1.1)))break;len=k-1.2;}
   if(len<12)continue;const drop=height?h0-height(POD[0]+dx*len,POD[1]+dz*len):0,behind=from?(()=>{const fx=POD[0]-from[0],fz=POD[1]-from[1],fl=hyp(fx,fz)||1;return(dx*fx+dz*fz)/fl;})():0,score=len*.2+drop*2-(dz>.7?.5:0)-(behind>.45?6:0)-(behind<-.3?4:0);if(!best||score>best.score)best={dx,dz,len,score};}
  return best||{dx:1,dz:0,len:12,score:0};},
 logStart(dir){return{x:POD[0]+dir.dx*1.8,z:POD[1]+dir.dz*1.8,dx:dir.dx,dz:dir.dz,len:dir.len,d:0,t:0,h:.6,spin:0,stop:false,held:false};},
 logSpeed(lg,dc){let v=lg.d<9?4.4:Math.max(1.3,4.4-(lg.d-9)*.24);if(dc>11)v=0;else if(dc>8)v*=.35;else if(dc<2.5)v*=1.1;return v;},   // fast start, then it slows; waits for a slow cat
 logStep(lg,px,pz,dt){if(!lg||lg.held||lg.stop)return lg;lg.t+=dt;const v=logic.logSpeed(lg,hyp(px-lg.x,pz-lg.z)),s=Math.min(v*dt,lg.len-lg.d);
  lg.x+=lg.dx*s;lg.z+=lg.dz*s;lg.d+=s;lg.spin+=s/.22;lg.h=Math.abs(Math.sin(lg.d*1.15))*.45*Math.min(1,v/3);if(lg.d>=lg.len-1e-6){lg.stop=true;lg.h=0;}return lg;},
 canTakeLog(lg,px,pz,alt){return !!lg&&!lg.held&&(alt||0)<.5&&hyp(px-lg.x,pz-lg.z)<1.9;},
 // ---- ② cells
 cellPos(id,sp){if(id==='cell1')return WRECK.F.W(WRECK.a,WRECK.b);if(id==='cell2')return CELL2;return sp?[sp.x,sp.z]:RSPOTS[0];},
 canTakeCell(s,id,px,pz,alt,cleared,sp){if(logic.step(s)!=='cells'||s.cells.includes(id))return false;alt=alt||0;
  if(id==='cell1'){const[x,z]=logic.cellPos('cell1');return alt>=WRECK.top-.15&&hyp(px-x,pz-z)<1.1;}
  if(id==='cell2')return !!cleared&&alt<.5&&hyp(px-CELL2[0],pz-CELL2[1])<1.3;
  return !!sp&&sp.tired&&alt<.3&&hyp(px-sp.x,pz-sp.z)<K.catchR;},
 spark(){const[x,z]=RSPOTS[0];return{x,z,h:.5,e:1,tired:false,held:false,ti:1,t:0,sc:.95};},
 // ---- ③ meteors (only near the tower while the cells are carried)
 meteorZone(s,px,pz){return logic.step(s)==='carry'&&hyp(px-TOWER[0],pz-TOWER[1])<75&&hyp(px-TOWER[0],pz-TOWER[1])>4.5;},
 meteorSpawn(list,rnd,px,pz,vx,vz){if(list.length>=3)return null;const m={x:px+vx*1.3+(rnd()-.5)*5,z:pz+vz*1.3+(rnd()-.5)*5,t:0,T:1.7,hit:false,R:1.15};list.push(m);return m;},
 meteorStep(list,dt,px,pz,alt){let hit=null;for(const m of list){m.t+=dt;if(!m.hit&&m.t>=m.T){m.hit=true;if((alt||0)<1&&hyp(px-m.x,pz-m.z)<m.R)hit=m;}}
  for(let i=list.length-1;i>=0;i--)if(list[i].t>list[i].T+1.4)list.splice(i,1);return hit;},
 canInsert(s,px,pz){return logic.step(s)==='carry'&&hyp(px-TOWER[0],pz-TOWER[1])<3.4;},
 // ---- ④ scanner + mast
 peak(blocked){for(const P of PEAKS){let ok=true;for(let a=0;a<6&&ok;a++)if(blocked&&blocked(P[0]+Math.sin(a)*1.2,P[1]+Math.cos(a)*1.2))ok=false;if(ok&&!(blocked&&blocked(P[0],P[1])))return P;}return PEAKS[0];},
 heat(px,pz,P){const d=hyp(px-P[0],pz-P[1]);return{d,band:d<4?'hot':d<12?'warm':'cold',period:Math.max(.35,Math.min(2,d/12))};},
 atPeak(s,loc,px,pz,P){return logic.step(s,loc)==='scan'&&hyp(px-P[0],pz-P[1])<1.6;},
 canTune(s,loc,px,pz,alt){return logic.step(s,loc)==='mast'&&(alt||0)>=PLAT.top-.15&&inBox(PLAT,px,pz,.15);},
 // ---- ⑤ capsule radio
 // crew hologram spot: beside the cat (side away from the capsule) or on the camera side; every figure + the beam must be clear of solids and the capsule
 holoSpot(px,pz,ex,ez,blocked){let fx=px-ex,fz=pz-ez;const fl=hyp(fx,fz)||1;fx/=fl;fz/=fl;const sx=-fz,sz=fx,P=(a,b)=>[px+sx*a+fx*b,pz+sz*a+fz*b];
  const clear=([x,z])=>hyp(x-POD[0],z-POD[1])>=3&&!(blocked&&blocked(x,z));
  const arc=(a,b)=>[0,1,2,3].map(k=>{const o=(k-1.5)*HG;return P(a+o,b+Math.abs(o)*.3);});
  const away=hyp(px+sx-POD[0],pz+sz-POD[1])>=hyp(px-sx-POD[0],pz-sz-POD[1])?1:-1;
  const L=[[-2,-1.2,1.2,2].map(a=>P(a,-.6)),[-2.1,-1.3,1.3,2.1].map(a=>P(a,-1.4)),...[away,-away].flatMap(k=>[arc(k*2.1,-.5),arc(k*2.7,-1.1),arc(k*3.2,0)]),arc(0,-3.6),arc(0,-4.6)];
  {let ox=px-POD[0],oz=pz-POD[1];const ol=hyp(ox,oz)||1;ox/=ol;oz/=ol;for(const R of[5,6.5,8])L.push([0,1,2,3].map(k=>{const o=(k-1.5)*HG;return[POD[0]+ox*R-oz*o,POD[1]+oz*R+ox*o];}));}
  for(const figs of L)if(figs.every(clear)){const[bx,bz]=[P(away*1.6,.8),P(-away*1.6,.8),P(away*1.6,-.6)].find(q=>!(blocked&&blocked(q[0],q[1])))||P(away*1.6,-.6);return{figs,bx,bz,dx:fx,dz:fz};}
  const figs=L[L.length-1],[bx,bz]=P(0,-5.8);return{figs,bx,bz,dx:fx,dz:fz};},
 canRadio(s,px,pz){return logic.step(s)==='pod'&&hyp(px-POD[0],pz-POD[1])<RADIO_R;},
 SCENE:9,HG};
const API={logic,loc:null,rt:{log:null,sp:null,met:[],scene:-1}};
root.MoonLife1=API;
if(typeof module!=='undefined'&&module.exports)module.exports=API;
if(typeof document==='undefined')return;
const Core=root.MoonCore;if(!Core)return;
const G=()=>root.MoonGame,KEY='moonkatty-life1-v1',rt=API.rt;
const tt=(k,fb,p)=>{try{const v=root._t?root._t(k,p):null;return v&&v!==k?v:fb.replace(/\{(\w+)\}/g,(_,q)=>p&&p[q]!=null?p[q]:'');}catch(e){return fb;}};
const toast=s=>{const g=G();g&&g.toast&&g.toast(s);};
const sfx=n=>{try{root.MoonSfx&&root.MoonSfx(n);}catch(e){}};
const gs=()=>{const g=G();return g&&g.state;};
try{API.loc=logic.sanitize(JSON.parse(localStorage.getItem(KEY)||'null'));}catch(e){API.loc=logic.fresh();}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(API.loc));}catch(e){}};
const cur=()=>{const s=gs();if(!s)return null;if(s.signal||s.chapter>1)API.loc.peak=true;return logic.step(s,API.loc);};
let PEAK=null;const peakPt=()=>{if(!PEAK){const g=G(),r=g&&g.renderer,s=gs();PEAK=logic.peak(r?(x,z)=>r.blocked(x,z,s,0)||!!(root.MoonRuins2&&root.MoonRuins2.blocked(x,z)):null);}return PEAK;};
// ---- quest text + targets (Core.quest / nearestTarget / interact wrappers; core's own logic stays for the old fields)
const DYN=Core.DYN||(Core.DYN={});
const oQuest=Core.quest,oNear=Core.nearestTarget,oInteract=Core.interact;
function myQuest(s){const st=logic.step(s,API.loc);if(!st)return null;
 if(st==='pod'){const g=G(),p=g&&g.player;if(!p||hyp(p.x-POD[0],p.z-POD[1])>=RADIO_R)return null;return{id:'l1radio',title:tt('l1.q_radio','Turn on the capsule radio'),detail:tt('l1.q_radio_d','Press the button at the capsule and listen to the crew.'),targets:['l1pod'],fraction:.9};}
 if(st==='log'){if(!rt.log)return{id:'l1find',title:tt('core.naydi_bortovoy','Find the ship log'),detail:tt('l1.q_find_d','Look around the capsule.'),targets:['l1pod'],fraction:0};
  return{id:'l1log',title:tt('l1.q_log','Catch the ship log!'),detail:tt('l1.q_log_d','It fell out of the capsule and is rolling downhill.'),targets:['l1log'],fraction:.05};}
 if(st==='cells'){const left=['cell1','cell2','cell3'].filter(id=>!s.cells.includes(id));return{id:'l1cells',title:tt('l1.q_cells','Energy cells at the rocket: {n}/3',{n:s.cells.length}),detail:tt('l1.q_cells_d','One on the wreck, one behind the rubble, one rides a runaway spark.'),targets:left.map(id=>'l1'+id),fraction:.2+s.cells.length*.08};}
 if(st==='carry')return{id:'l1carry',title:tt('l1.q_carry','Carry the cells to the tower'),detail:tt('l1.q_carry_d','Meteors fall near the tower: step away from the shadows.'),targets:['l1tower'],fraction:.5};
 if(st==='scan')return{id:'l1scan',title:tt('l1.q_scan','Catch the signal at the tower'),detail:tt('l1.q_scan_d','Walk around the tower: the scanner gets hot near the signal.'),targets:['l1tower'],fraction:.65};
 return{id:'l1mast',title:tt('l1.q_mast','Climb the mast'),detail:tt('l1.q_mast_d','Jump up the crates to the platform and tune the antenna.'),targets:['l1mast'],fraction:.8};}
Core.quest=function(s){if(s&&s.chapter===1){try{const q=myQuest(s);if(q)return q;}catch(e){root.__life1Err=String(e);}}return oQuest.apply(this,arguments);};
function dyn(){const s=gs();DYN.l1pod=POD;DYN.l1log=rt.log?[rt.log.x,rt.log.z]:POD;DYN.l1cell1=logic.cellPos('cell1');DYN.l1cell2=CELL2;DYN.l1cell3=logic.cellPos('cell3',rt.sp);DYN.l1tower=TOWER;DYN.l1mast=TW.W(5.4,0);}
dyn();
Core.nearestTarget=function(s,p){const o=oNear.apply(this,arguments);if(!s||s.chapter!==1)return o;const q=myQuest(s);if(!q||q.id==='l1radio')return o;
 let mine=null,md=1e9;for(const id of q.targets){const P=DYN[id];if(!P)continue;const d=hyp(p.x-P[0],p.z-P[1]);if(d<md){md=d;mine={id,x:P[0],z:P[1]};}}
 const ok=o&&!OLD[o.id]&&!String(o.id).startsWith('l1')?o:null;if(mine&&md<=3.3)return mine;if(ok&&hyp(p.x-ok.x,p.z-ok.z)<=3.3)return ok;return mine||ok;};
Core.interact=function(s,id,p){if(s&&s.chapter===1&&(String(id).startsWith('l1')||OLD[id])&&logic.step(s,API.loc)!=='pod'){const q=myQuest(s);return{ok:false,text:q?q.detail:tt('core.podoydi_blizhe','Come closer')};}return oInteract.apply(this,arguments);};
const old=(id)=>{const s=gs(),P=Core.POINTS[id];return oInteract.call(Core,s,id,{x:P[0],z:P[1],alt:0});};
const done=r=>{const g=G();if(!g)return;if(g.result)g.result(r);else{g.save&&g.save();g.hud&&g.hud();}};
// ---- solids: collision + standing floor (MoonSide2.floor is the game's floor source)
const R=root.MoonRenderer&&root.MoonRenderer.prototype;
const near=(x,z)=>hyp(x-RK.x,z-RK.z)<14||hyp(x-TW.x,z-TW.z)<9;
if(R){const ob=R.blocked;R.blocked=function(x,z,state,alt=0){if(near(x,z)&&logic.blocked(logic.boxes(state||gs(),API.loc),x,z,alt))return true;return ob.apply(this,arguments);};
 const opc=R.powerCell;R.powerCell=function(x,z,ch){if(ch===1)for(const id of['cell1','cell2','cell3']){const P=Core.POINTS[id];if(P[0]===x&&P[1]===z)return;}return opc.apply(this,arguments);};
 const os=R.scene;R.scene=function(state,p,...a){const out=os.call(this,state,p,...a);try{draw(this,state,p);}catch(e){root.__life1Err=String(e.stack||e);}return out;};}
{const S2=root.MoonSide2;if(S2){const of=S2.floor;S2.floor=(x,z,alt)=>{let f=of?of(x,z,alt):0;if(near(x,z))f=Math.max(f,logic.floor(logic.boxes(gs(),API.loc),x,z,alt));return f;};
 S2.extScan=p=>{if(cur()!=='scan'||hyp(p.x-TOWER[0],p.z-TOWER[1])>40)return null;return logic.heat(p.x,p.z,peakPt());};}}
// ---- drawing
const IVORY=[.92,.9,.86],GOLD=[.95,.66,.24],DARK=[.2,.21,.24],ORANGE=[1,.55,.16],CYAN=[.35,.85,1],SCORCH=[.12,.1,.09];
const camFade=(r,x,y,z)=>{const e=r.eye;if(!e)return 1;return Math.max(0,Math.min(1,(hyp(e[0]-x,e[1]-y,e[2]-z)-2.5)/4.5));};
function cell(r,x,y,z,t,sc,glow){sc=sc||1;r.put('cylinder',x,y+.32*sc,z,.2*sc,.5*sc,.2*sc,ORANGE,t*.5,0,0);r.put('cylinder',x,y+.32*sc,z,.23*sc,.14*sc,.23*sc,CYAN,0,12,.6+.3*Math.sin(t*4));
 r.put('cylinder',x,y+.62*sc,z,.08*sc,.08*sc,.08*sc,[.8,.82,.85],0,0,0);if(glow&&r.meshes&&r.meshes.mineralGlow)r.put('mineralGlow',x,y+.04,z,1.3*sc,1,1.3*sc,[.4,.85,1],0,22,.35+.1*Math.sin(t*3));}
function box3(r,B,y0,col,k,g){const[x,z]=B.F.W(B.a,B.b);r.put('cube',x,y0+B.top/2,z,B.ha*2,B.top,B.hb*2,col,B.F.yaw,k||0,g||0);}
function draw(r,state,p){if(!p)return;const ch=state&&state.chapter,t=performance.now()/1000,glow=r.meshes&&r.meshes.mineralGlow,s=state,st=ch===1?logic.step(s,API.loc):null,paw=root.MoonCarry&&root.MoonCarry.paw;
 // the wreck slab by the rocket (always there: a piece of our hull)
 if(hyp(p.x-RK.x,p.z-RK.z)<70){const[x,z]=WRECK.F.W(WRECK.a,WRECK.b),y=r.terrain(x,z,ch);box3(r,WRECK,y,IVORY);r.put('cube',x,y+WRECK.top+.01,z,WRECK.ha*2-.1,.04,.2,GOLD,RK.yaw,0,.1);
  r.put('cube',x+.3,y+.5,z,WRECK.ha*2+.04,.18,WRECK.hb*2+.04,SCORCH,RK.yaw,0,0);
  if(st==='cells'){
   if(!s.cells.includes('cell1')){cell(r,x,y+WRECK.top,z,t,1.3,glow);r.put('cylinder',x,y+WRECK.top+3,z,.06,6,.06,[1,.7,.3],0,12,.35+.2*Math.sin(t*3));if(glow)r.put('mineralGlow',x,y+WRECK.top+.05,z,2.4,1,2.4,[1,.65,.25],0,22,.45);if(paw&&hyp(p.x-x,p.z-z)<30)paw(r,x,y+WRECK.top+1.5,z,t);}
   if(!s.cells.includes('cell2')){const[cx,cz]=CELL2,cy=r.terrain(cx,cz,ch);cell(r,cx,cy,cz,t,1,glow);const C=root.MoonCarry;if(paw&&C&&C.st&&C.st.cleared&&hyp(p.x-cx,p.z-cz)<14)paw(r,cx,cy+1.1,cz,t);}
   if(!s.cells.includes('cell3')&&rt.sp&&root.MoonSide2&&root.MoonSide2.drawSpark){const sp=rt.sp;root.MoonSide2.drawSpark(r,sp,p,t,ch,glow);const sy=r.terrain(sp.x,sp.z,ch)+sp.h;r.put('cylinder',sp.x,sy-.05,sp.z,.09,.2,.09,ORANGE,t*3,12,.25);r.put('cylinder',sp.x,sy+2.5,sp.z,.05,5,.05,[1,.85,.4],0,12,.3+.2*Math.sin(t*4));if(glow)r.put('mineralGlow',sp.x,r.terrain(sp.x,sp.z,ch)+.05,sp.z,1.8,1,1.8,[1,.8,.35],0,22,.5);if(paw&&hyp(p.x-sp.x,p.z-sp.z)<25)paw(r,sp.x,sy+1.3,sp.z,t);}}}
 // the mast platform + crate ladder at the tower
 if(hyp(p.x-TW.x,p.z-TW.z)<70){const y=r.terrain(TW.x,TW.z,ch),[x,z]=PLAT.F.W(PLAT.a,PLAT.b);
  r.put('cube',x,y+PLAT.top-.07,z,PLAT.ha*2,.14,PLAT.hb*2,[.62,.64,.68],0,0,0);r.put('cube',x,y+PLAT.top-.15,z,PLAT.ha*2+.06,.05,PLAT.hb*2+.06,GOLD,0,0,.1);
  for(const[da,db]of[[-1,-1],[-1,1],[1,-1],[1,1]])r.put('cylinder',x+da*(PLAT.ha-.08),y+PLAT.top/2,z+db*(PLAT.hb-.08),.06,PLAT.top,.06,DARK,0,0,0);
  r.put('cube',x+PLAT.ha-.05,y+PLAT.top+.35,z,.05,.7,PLAT.hb*2,DARK,0,0,0);
  const tune=st==='mast'||st==='scan';r.put('cylinder',x-.2,y+PLAT.top+.45,z,.12,.9,.12,[.4,.42,.46],0,0,0);r.put('sphere',x-.2,y+PLAT.top+.95,z,.26,.12,.26,tune?[1,.75,.3]:CYAN,t*.7,12,tune?.4+.3*Math.sin(t*5):.35);
  if(logic.boxes(s,API.loc).length>2&&root.MoonSide2&&root.MoonSide2.crate){const C=root.MoonSide2.crate;const[ax,az]=TW.W(3.6,0),[bx,bz]=TW.W(4.4,0);C(r,ax,r.terrain(ax,az,ch),az,0,1);C(r,ax,r.terrain(ax,az,ch)+.8,az,0,1);C(r,bx,r.terrain(bx,bz,ch),bz,0,1);
   if(st==='mast'&&paw)paw(r,x,y+PLAT.top+1.5,z,t);}
  if(st==='scan'&&glow){const P=peakPt(),d=hyp(p.x-P[0],p.z-P[1]);if(d<6)r.put('mineralGlow',P[0],r.terrain(P[0],P[1],ch)+.05,P[1],1.6,1,1.6,[.4,.9,1],0,22,(.2+.25*Math.sin(t*6))*(1-d/6));}}
 if(ch!==1)return;
 // ① the log
 const lg=rt.log;if(st==='log'&&lg&&!lg.held){const y=r.terrain(lg.x,lg.z,ch)+.2+lg.h,yaw=Math.atan2(lg.dx,lg.dz);r.put('cube',lg.x,y+.1,lg.z,.62,.4,.5,ORANGE,yaw,0,0,lg.spin);r.put('cube',lg.x,y+.1,lg.z,.65,.14,.53,DARK,yaw,0,0,lg.spin);if(glow)r.put('mineralGlow',lg.x,y+.1,lg.z,1.3,1,1.3,[1,.6,.2],0,22,.35);
  r.put('sphere',lg.x,y+.14,lg.z,.07,.07,.07,(Math.floor(t*4)%2)?[1,.3,.2]:CYAN,0,12,1);if(glow)r.put('mineralGlow',lg.x,r.terrain(lg.x,lg.z,ch)+.05,lg.z,1.4,1,1.4,[1,.7,.3],0,22,.4);
  if(paw&&lg.stop)paw(r,lg.x,y+1,lg.z,t);}
 // ③ cells riding on the cat's back + meteors
 if(st==='carry'){const yb=r.terrain(p.x,p.z,ch)+(p.alt||0),fx=-Math.sin(p.yaw||0),fz=-Math.cos(p.yaw||0);for(let k=0;k<3;k++){const a=t*2+k*2.094;cell(r,p.x-fx*.45+Math.sin(a)*.35,yb+1.15+Math.cos(a*1.3)*.08,p.z-fz*.45+Math.cos(a)*.35,t+k,.45,false);}
  if(glow)r.put('mineralGlow',p.x,yb+.05,p.z,1.6,1,1.6,[.4,.85,1],0,22,.25);
  for(const m of rt.met){const gy=r.terrain(m.x,m.z,ch),u=Math.min(1,m.t/m.T);
   if(!m.hit){const rr=m.R*(.55+.45*u);r.put('cylinder',m.x,gy+.02,m.z,rr,.03,rr,[.07,.05,.05],0,0,0);r.put('ring',m.x,gy+.07,m.z,m.R*1.05,1,m.R*1.05,[1,.3+.3*Math.sin(t*12),.1],0,12,.9);if(glow){r.put('mineralGlow',m.x,gy+.05,m.z,m.R*2*(.5+u*.6),1,m.R*2*(.5+u*.6),[.03,.02,.02],0,22,.35+.5*u);r.put('mineralGlow',m.x,gy+.06,m.z,m.R*2.3,1,m.R*2.3,[1,.35,.12],0,22,(.12+.2*u)*(.6+.4*Math.sin(t*14)));}
    const h=(1-u)*16;r.put('sphere',m.x+(1-u)*3,gy+h+.3,m.z-(1-u)*2,.3,.3,.3,[1,.6,.25],t*6,12,.9);if(glow)r.put('mineralGlow',m.x+(1-u)*3,gy+h+.3,m.z-(1-u)*2,1.4,1,1.4,[1,.55,.2],Math.atan2((r.eye||[0,0,1])[0]-m.x,(r.eye||[0,0,1])[2]-m.z),22,.6,Math.PI/2);}
   else{const f=1-(m.t-m.T)/1.4;if(glow&&f>0)r.put('mineralGlow',m.x,gy+.06,m.z,3.2*(1.3-f*.5),1,3.2*(1.3-f*.5),[1,.55,.2],0,22,.8*f);if(f>0)r.put('sphere',m.x,gy+.05,m.z,.5,.12,.5,[.25,.12,.08],0,12,.4*f);}}}
 // ⑤ the radio scene at the capsule
 if(st==='pod'&&rt.scene>=0){const A=rt.anc||logic.holoSpot(p.x,p.z,(r.eye||[p.x,0,p.z+5])[0],(r.eye||[p.x,0,p.z+5])[2],null),u=Math.min(1,rt.scene/1.2),y=r.terrain(A.bx,A.bz,ch);
  // crew holograms stand two by two on both sides of the cat (or beside it) (logic.holoSpot keeps them out of the capsule), with a light beam behind them
  r.put('cylinder',A.bx,y+4,A.bz,.32*u,8*u,.32*u,[.1,.75,1],0,12,.8);
  if(glow){r.put('mineralGlow',A.bx,y+1.5,A.bz,1.6*u,1,1.6*u,[.45,.9,1],Math.atan2(-A.dx,-A.dz),22,.45+.15*Math.sin(t*5),Math.PI/2);}
  const sx=-A.dz,sz=A.dx;
  for(let k=0;k<4;k++){const[x,z]=A.figs[k],y=r.terrain(x,z,ch),b=Math.sin(t*2+k)*.06,fl=.75+.25*Math.sin(t*9+k*2);
   const Hs=1.15,HC=[[1,.5,.12],[.3,.6,1],[.3,.95,.4],[.12,.62,.9]][k],HB=HC.map(v=>v*.8);r.put('sphere',x,y+(1.45+b)*Hs,z,.2*u*Hs,.22*u*Hs,.2*u*Hs,HC,0,12,.42*fl);r.put('cylinder',x,y+(.95+b)*Hs,z,.17*u*Hs,.65*u*Hs,.17*u*Hs,HB,0,12,.36*fl);   // each crew hologram in its member's colour (engineer, navigator, scout, base)
r.put('sphere',x-sx*.13*Hs,y+(1.68+b)*Hs,z-sz*.13*Hs,.08*u*Hs,.08*u*Hs,.08*u*Hs,[.4,.95,1],0,12,.5*fl);r.put('sphere',x+sx*.13*Hs,y+(1.68+b)*Hs,z+sz*.13*Hs,.08*u*Hs,.08*u*Hs,.08*u*Hs,[.4,.95,1],0,12,.5*fl);
   if(glow)r.put('mineralGlow',x,y+.04,z,.9*u,1,.9*u,[.1,.65,1],0,22,.45);r.put('mineralGlow',x,y+1.6,z,1.3*u,1,1.3*u,[.1,.6,1],Math.atan2(sx,sz),22,.25,Math.PI/2);}}}
// ---- context button
let mode=null;
function pick(){const g=G();if(!g||!g.player)return null;const s=g.state,p=g.player,alt=p.alt||0,st=cur();if(!st)return null;
 if(root.MoonCarry&&(root.MoonCarry.own||root.MoonCarry.st&&root.MoonCarry.st.held>=0))return null;   // a story action beats picking up rubble; holding rubble beats the story
 if(st==='log')return logic.canTakeLog(rt.log,p.x,p.z,alt)?'log':null;
 if(st==='cells'){const cl=!!(root.MoonCarry&&root.MoonCarry.st&&root.MoonCarry.st.cleared);for(const id of['cell1','cell2','cell3'])if(logic.canTakeCell(s,id,p.x,p.z,alt,cl,rt.sp))return id;return null;}
 if(st==='carry')return logic.canInsert(s,p.x,p.z)?'insert':null;
 if(st==='mast')return logic.canTune(s,API.loc,p.x,p.z,alt)?'tune':null;
 if(st==='pod'&&logic.canRadio(s,p.x,p.z))return rt.scene<0?'radio':rt.scene<logic.SCENE?'wait':'reply';
 return null;}
const LBL={log:()=>tt('l1.log_take','Take the log'),cell1:()=>tt('carry.take','Pick up'),cell2:()=>tt('carry.take','Pick up'),cell3:()=>tt('l1.spark_take','Grab the spark'),
 insert:()=>tt('l1.insert','Plug in the cells'),tune:()=>tt('l1.tune','Tune the antenna'),radio:()=>tt('l1.radio','Turn on the radio'),wait:()=>tt('l1.listen','Listening...'),reply:()=>tt('l1.reply','Answer the crew')};
API.ctx=()=>{mode=pick();return mode?LBL[mode]():null;};
function act(e){const btn=e.target&&e.target.closest&&e.target.closest('#interact');if(!btn)return;const m=pick();if(!m)return;e.stopImmediatePropagation();e.preventDefault();const s=gs();
 if(m==='log'){rt.log.held=true;sfx('coin');done(old('recorder'));}
 else if(m==='cell1'||m==='cell2'||m==='cell3'){if(m==='cell3'){rt.sp=null;}sfx('coin');done(old(m));if(s.cells.length>=3)setTimeout(()=>toast(tt('l1.cells_all','All 3 cells! Now carry them to the tower.')),2600);}
 else if(m==='insert'){rt.met.length=0;sfx('coin');done(old('antenna'));setTimeout(()=>toast(tt('l1.scan_hint','The antenna is on, but the signal is weak. Walk around the tower with the scanner.')),2600);}
 else if(m==='tune'){const r=Core.solve(s,'signal',[32,68,45]);sfx('coin');done(r);setTimeout(()=>toast(tt('l1.go_pod','Signal found! Run back to the capsule radio.')),2600);}
 else if(m==='radio'){rt.scene=0;const g=G(),p=g.player,e=g.renderer&&g.renderer.eye;let dx=POD[0]-p.x,dz=POD[1]-p.z;if(e){dx=p.x-e[0];dz=p.z-e[2];}const r=g.renderer;rt.anc=logic.holoSpot(p.x,p.z,p.x-dx,p.z-dz,r?(x,z)=>r.blocked(x,z,gs(),0)||!!(root.MoonRuins2&&root.MoonRuins2.blocked(x,z)):null);sfx('click');}
 else if(m==='reply'){rt.scene=-1;done(old('pod'));}}
root.addEventListener('click',act,true);
// ---- subtitles for the radio scene
const sub=document.createElement('div');sub.id='mk-l1-sub';sub.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:180px;max-width:86vw;z-index:31;display:none;padding:10px 14px;border-radius:14px;background:rgba(8,16,30,.78);border:1px solid rgba(120,210,255,.55);color:#dff6ff;font:600 15px/1.35 system-ui,sans-serif;text-align:center;text-shadow:0 1px 2px #000;pointer-events:none';
document.body.appendChild(sub);
const LINES=[[0,'l1.crew1','...krrr... Is anyone there? This is the crew of the Moonkatty!'],[3,'l1.crew2','Kitty? Is that you? We see your signal on the map!'],[6,'l1.crew3','Hold on, we are coming. Wait for us by the capsule!']];
// ---- loop
let last=performance.now(),hints={},spawnT=0,hitT=0,prev=null,rnd=Math.random;
function loop(){const now=performance.now(),dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;
 try{const g=G();if(g&&g.player&&g.state&&g.state.chapter===1){const p=g.player,s=g.state,st=cur(),dP=hyp(p.x-POD[0],p.z-POD[1]),dR=hyp(p.x-RK.x,p.z-RK.z),dT=hyp(p.x-TOWER[0],p.z-TOWER[1]);{const qid=st==='pod'&&dP<RADIO_R?'r':st==='pod'?'p':'';if(qid!==rt.qid){const was=rt.qid;rt.qid=qid;if(was!==undefined&&g.hud)g.hud();}}
  if(st==='log'){if(!rt.log&&dP<8){const r=g.renderer;rt.log=logic.logStart(logic.logDir((x,z)=>r.blocked(x,z,s,0)||!!(root.MoonRuins2&&root.MoonRuins2.blocked(x,z)),(x,z)=>r.terrain(x,z,1),[p.x,p.z]));toast(tt('l1.log_out','Oops! The ship log fell out and is rolling away. Catch it!'));sfx('click');g.hud&&g.hud();}
   if(rt.log)logic.logStep(rt.log,p.x,p.z,dt);}
  {const c=API.ctx();if(c){const sp=document.querySelector('#interact span');if(sp&&sp.textContent!==c){sp.textContent=c;sp.parentNode.style.opacity=1;}}if(c!==API._lastCtx){API._lastCtx=c;g.ui&&g.ui();}}
  if(st==='cells'){if(!hints.rk&&dR<32){hints.rk=1;toast(tt('l1.cells_hint','Cells! One on the wreck - jump up. One behind the rubble. And one rides a spark!'));}
   if(!s.cells.includes('cell3')&&dR<60){if(!rt.sp)rt.sp=logic.spark();const S2=root.MoonSide2;if(S2&&S2.logic)S2.logic.sparkStep(rt.sp,p.x,p.z,dt,RING);
    if(rt.sp.tired&&!hints.spt&&hyp(p.x-rt.sp.x,p.z-rt.sp.z)<9){hints.spt=1;toast(tt('l1.spark_tired','The spark is tired - grab it!'));}else if(!rt.sp.tired)hints.spt=0;}}
  if(st==='carry'){const vx=prev?(p.x-prev[0])/Math.max(dt,.001):0,vz=prev?(p.z-prev[1])/Math.max(dt,.001):0;
   if(logic.meteorZone(s,p.x,p.z)){if(!hints.met){hints.met=1;toast(tt('l1.meteor','Meteors! Watch the shadows on the ground.'));}spawnT-=dt;if(spawnT<=0&&hitT<2.5){spawnT=1.25+rnd()*.5;const sp=Math.hypot(vx,vz)>8?0:1;logic.meteorSpawn(rt.met,rnd,p.x,p.z,vx*sp,vz*sp);}}
   const hit=logic.meteorStep(rt.met,dt,p.x,p.z,p.alt||0);hitT-=dt;
   if(hit){sfx('click');const ox=p.x-hit.x,oz=p.z-hit.z,ol=hyp(ox,oz)||1,nx=p.x+ox/ol*1.1,nz=p.z+oz/ol*1.1,r=g.renderer;if(!(r&&r.blocked(nx,nz,s,p.alt||0))){p.x=nx;p.z=nz;}if(hitT<=0){hitT=4;toast(tt('l1.hit','Ouch! Keep out of the shadows.'));}try{navigator.vibrate&&navigator.vibrate(60);}catch(e){}}}
  else if(rt.met.length)rt.met.length=0;
  if(st==='scan'){const P=peakPt();if(!hints.sc&&dT<20){hints.sc=1;toast(tt('l1.scan_hint','The antenna is on, but the signal is weak. Walk around the tower with the scanner.'));}
   if(logic.atPeak(s,API.loc,p.x,p.z,P)){API.loc.peak=true;save();sfx('coin');toast(tt('l1.peak','Here it is! The signal is up high: climb the crates to the mast.'));g.hud&&g.hud();}}
  if(st==='pod'){if(rt.scene>=0&&rt.scene<logic.SCENE){rt.scene+=dt;let line=null;for(const L of LINES)if(rt.scene>=L[0])line=L;sub.textContent=line?tt(line[1],line[2]):'';sub.style.display=line?'block':'none';if(rt.scene>=logic.SCENE){sub.style.display='none';toast(tt('l1.reply_hint','Tap to answer the crew!'));}}
   if(rt.scene>=0&&dP>9){rt.scene=-1;sub.style.display='none';}}
  else if(sub.style.display!=='none')sub.style.display='none';
  prev=[p.x,p.z];dyn();}}catch(e){root.__life1Err=String(e.stack||e);}
 requestAnimationFrame(loop);}
requestAnimationFrame(loop);
})(typeof globalThis!=='undefined'?globalThis:this);
