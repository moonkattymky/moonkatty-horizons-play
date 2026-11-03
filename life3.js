/* life #3 «Тайна сигнала» in-world: the engineer gives a new-band scanner (c3_brief); 3 crew records: dome (scanner hot/cold),
   station roof (walk up the fallen roof slab), dark crater (lamp) - each one lights a digit on a wall (c3_clues);
   3 floor plates at the archive door in the order of the records, a wrong plate sparks you back (c3_vault);
   a dust devil carries the blueprint away - catch it with a jump (c3_blueprint); hand it to the engineer (life3).
   Checkpoint ids/payloads unchanged: every step ends in the original Core.interact/Core.solve. */
(function(root){
'use strict';
const frame=(x,z,yaw)=>{const c=Math.cos(yaw),s=Math.sin(yaw);return{x,z,yaw,W:(lx,lz)=>[x+c*lx+s*lz,z-s*lx+c*lz],L:(wx,wz)=>{const dx=wx-x,dz=wz-z;return[c*dx-s*dz,s*dx+c*dz];}};};
const hyp=Math.hypot;
const ST=frame(-165,55,-.3),DM=frame(-120,-155,0);
const CAMP=[4,0],ENG=[6.2,1.6];
// ② the three records (core ids keep their journal digits: valley=I:7, crater=II:3, research=III:2)
const CAPSULE=DM.W(-9.5,7.5),ROOF_Y=3.6,ROOF_REC=ST.W(-3.2,1.6),CRATER=[-55,-55],CRATER_R=13;
const CLUES=[{id:'clueValley',kind:'dome',P:CAPSULE,digit:7,ord:1,who:'engineer',panel:DM.W(-11.2,6.2)},
 {id:'clueCrater',kind:'crater',P:[CRATER[0]+1.5,CRATER[1]+1],digit:3,ord:2,who:'scout',panel:[CRATER[0]-1.2,CRATER[1]-1.8]},
 {id:'clueResearch',kind:'roof',P:ROOF_REC,digit:2,ord:3,who:'navigator',panel:ST.W(-5.4,-1.6)}];
const CODE=[7,3,2];
// ③ archive door (the old vault terminal at 40,52), plates in front of it, facing the camp
const VT=frame(40,52,Math.atan2(CAMP[0]-40,CAMP[1]-52));
const PLATES=[{d:3,P:VT.W(-2.6,3.6)},{d:7,P:VT.W(0,4.4)},{d:2,P:VT.W(2.6,3.6)}],PLATE_R=1.05;
const DEV_C=VT.W(0,9),DEV_R=9;
const STEPS=['brief','clues','vault','catch','home'];
const OLD={signalStart:1,clueValley:1,clueCrater:1,clueResearch:1,vault:1,blueprint:1,blueprintReturn:1};
const logic={ST,DM,VT,CAMP,ENG,CAPSULE,ROOF_Y,ROOF_REC,CRATER,CRATER_R,CLUES,CODE,PLATES,PLATE_R,DEV_C,DEV_R,STEPS,OLD,
 // ---- which step: only the old save fields (mid-life saves migrate, never back)
 step(s){if(!s||s.chapter!==3||s.chapter3Complete)return null;if(s.blueprint)return'home';if(s.vaultOpen)return'catch';
  const n=Array.isArray(s.signalClues)?s.signalClues.length:0;if(n>=3)return'vault';if(!s.signalBriefed&&!n)return'brief';return'clues';},
 clue(id){return CLUES.find(c=>c.id===id)||null;},
 // ② dome: scanner heat to the buried capsule
 heat(px,pz){const d=hyp(px-CAPSULE[0],pz-CAPSULE[1]);return{d,band:d<6?'hot':d<15?'warm':'cold',period:Math.max(.35,Math.min(2,d/12))};},
 capsuleVisible(px,pz){return hyp(px-CAPSULE[0],pz-CAPSULE[1])<3.4;},
 // ② roof: intact left half (top 3.6) + the fallen right half as a ramp from the floor
 roofFloor(x,z,alt){const[a,b]=ST.L(x,z);alt=alt||0;
  if(a>-6.3&&a<.4&&Math.abs(b)<4.4)return alt>=ROOF_Y-.6?ROOF_Y:0;
  if(a>=.4&&a<5.4&&b>-4&&b<1.7){const h=Math.min(ROOF_Y,.35+(5.4-a)/5*(ROOF_Y-.35));return alt>=h-.6?h:0;}return 0;},
 onRoof(x,z,alt){return(alt||0)>ROOF_Y-.3&&logic.roofFloor(x,z,alt)===ROOF_Y;},
 // ② crater: dark, the lamp shows the record
 inCrater(x,z){return hyp(x-CRATER[0],z-CRATER[1])<CRATER_R;},
 dark(x,z){const d=hyp(x-CRATER[0],z-CRATER[1]);return Math.max(0,Math.min(1,(CRATER_R+6-d)/7));},
 canHear(s,c,px,pz,alt,lamp){if(logic.step(s)!=='clues'||s.signalClues.includes(c.id))return false;const d=hyp(px-c.P[0],pz-c.P[1]);
  if(c.kind==='roof')return d<1.9&&logic.onRoof(px,pz,alt);if(c.kind==='crater')return !!lamp&&d<2.2&&(alt||0)<.6;return d<2.2&&(alt||0)<.6;},
 // ③ plates
 plateAt(px,pz,alt){if((alt||0)>.35)return -1;for(let i=0;i<3;i++)if(hyp(px-PLATES[i].P[0],pz-PLATES[i].P[1])<PLATE_R)return i;return -1;},
 press(seq,i){const want=CODE[seq.length];if(PLATES[i].d!==want)return{seq:[],res:'bad'};const n=seq.concat([i]);return{seq:n,res:n.length===3?'done':'ok'};},
 away(){return[Math.sin(VT.yaw),Math.cos(VT.yaw)];},
 // ④ the dust devil runs on a ring around the archive and gets tired near the cat
 devil(){return{a:0,e:1,tired:0,x:DEV_C[0]+DEV_R,z:DEV_C[1],sp:0};},
 devilStep(dv,px,pz,dt){const d=hyp(px-dv.x,pz-dv.z);let v;
  if(dv.tired>0){dv.tired-=dt;v=.35;}else if(d<8){v=3.3;dv.e-=dt*.17;if(dv.e<=0){dv.tired=3.4;dv.e=.75;}}else{v=1.1;dv.e=Math.min(1,dv.e+dt*.08);}
  const pa=Math.atan2(pz-DEV_C[1],px-DEV_C[0]);let df=pa-dv.a;while(df>Math.PI)df-=2*Math.PI;while(df<-Math.PI)df+=2*Math.PI;
  const dir=df>0?-1:1;dv.a+=dir*v/DEV_R*dt;const R=DEV_R+Math.sin(dv.a*3)*1.5;dv.x=DEV_C[0]+Math.cos(dv.a)*R;dv.z=DEV_C[1]+Math.sin(dv.a)*R;dv.sp=v;return dv.tired>0?'tired':null;},
 canCatch(dv,px,pz,alt){return !!dv&&hyp(px-dv.x,pz-dv.z)<(dv.tired>0?2.6:2.1)&&(alt||0)>=.45&&(alt||0)<=4.4;},
 SCENE:7.5,BRIEF:3.4,REC:4.2};
const API={logic,rt:{scene:-1,brief:-1,rec:null,lamp:false,seq:[],on:-1,zap:0,dv:null,devT:-1,anchor:null}};
root.MoonLife3=API;
if(typeof module!=='undefined'&&module.exports)module.exports=API;
if(typeof document==='undefined')return;
const Core=root.MoonCore;if(!Core)return;
const G=()=>root.MoonGame,rt=API.rt;
const tt=(k,fb,p)=>{try{const v=root._t?root._t(k,p):null;return v&&v!==k?v:fb.replace(/\{(\w+)\}/g,(_,q)=>p&&p[q]!=null?p[q]:'');}catch(e){return fb;}};
const toast=s=>{const g=G();g&&g.toast&&g.toast(s);};
const sfx=n=>{try{root.MoonSfx&&root.MoonSfx(n);}catch(e){}};
const gs=()=>{const g=G();return g&&g.state;};
const cur=()=>logic.step(gs());API.devil=()=>rt.dv?{x:rt.dv.x,z:rt.dv.z}:null;
API.scanBusy=()=>{const s=gs();return !!s&&logic.step(s)==='clues'&&!s.signalClues.includes('clueValley');};
const now=()=>performance.now()/1000;
const DYN=Core.DYN||(Core.DYN={});
const oQuest=Core.quest,oNear=Core.nearestTarget,oInteract=Core.interact;
const NEXT={dome:['l3.q_dome','Dome: follow the scanner'],roof:['l3.q_roof','Station roof: walk up the fallen roof'],crater:['l3.q_crater','Dark crater: switch on the lamp']};
function myQuest(s){const st=logic.step(s);if(!st)return null;
 if(st==='brief')return{id:'l3brief',title:tt('l3.q_brief','Talk to the engineer at camp'),detail:tt('l3.q_brief_d','He caught a strange new signal.'),targets:['l3eng'],fraction:.02};
 if(st==='clues'){const n=s.signalClues.length,left=CLUES.filter(c=>!s.signalClues.includes(c.id));return{id:'l3clues',title:tt('l3.q_clues','Crew records: {n}/3',{n}),detail:left.map(c=>tt(NEXT[c.kind][0],NEXT[c.kind][1])).join(' · '),targets:left.map(c=>'l3c_'+c.kind),fraction:.15+n*.15};}
 if(st==='vault')return{id:'l3vault',title:tt('l3.q_vault','Open the archive door'),detail:tt('l3.q_vault_d','Step on the floor plates in the order of the records: I, II, III.'),targets:['l3plates'],fraction:.65};
 if(st==='catch')return{id:'l3catch',title:tt('l3.q_catch','Catch the blueprint!'),detail:tt('l3.q_catch_d','A dust devil carries it away. Run after it and jump when it slows down.'),targets:['l3dev'],fraction:.8};
 return{id:'l3home',title:tt('l3.q_home','Bring the blueprint to the engineer'),detail:tt('l3.q_home_d','The crew is waiting at camp.'),targets:['l3eng'],fraction:.92};}
Core.quest=function(s){if(s&&s.chapter===3){try{const q=myQuest(s);if(q)return q;}catch(e){root.__life3Err=String(e);}}return oQuest.apply(this,arguments);};
function dyn(){DYN.l3eng=ENG;DYN.l3c_dome=CAPSULE;DYN.l3c_roof=hyp((gs()&&G().player?G().player.x:0)-ST.x,(G()&&G().player?G().player.z:0)-ST.z)<12?ROOF_REC:ST.W(4.6,3.2);DYN.l3c_crater=CLUES[1].P;DYN.l3plates=VT.W(0,3.6);DYN.l3dev=rt.dv?[rt.dv.x,rt.dv.z]:DEV_C;}
dyn();
Core.nearestTarget=function(s,p){const o=oNear.apply(this,arguments);if(!s||s.chapter!==3)return o;const q=myQuest(s);if(!q)return o;
 let mine=null,md=1e9;for(const id of q.targets){const P=DYN[id];if(!P)continue;const d=hyp(p.x-P[0],p.z-P[1]);if(d<md){md=d;mine={id,x:P[0],z:P[1]};}}
 const ok=o&&!OLD[o.id]&&!String(o.id).startsWith('l3')?o:null;if(mine&&md<=3.3)return mine;if(ok&&hyp(p.x-ok.x,p.z-ok.z)<=3.3)return ok;return mine||ok;};
Core.interact=function(s,id,p){if(s&&s.chapter===3&&(String(id).startsWith('l3')||OLD[id])&&logic.step(s)){const q=myQuest(s);return{ok:false,text:q?q.detail:tt('core.podoydi_blizhe','Come closer')};}return oInteract.apply(this,arguments);};
const old=(id)=>{const s=gs(),P=Core.POINTS[id];return oInteract.call(Core,s,id,{x:P[0],z:P[1],alt:0});};
const done=r=>{const g=G();if(!g)return;if(g.result)g.result(r);else{g.save&&g.save();g.hud&&g.hud();}};
const hud=()=>{const g=G();g&&g.hud&&g.hud();};
// ---- crew placement: the engineer waits at camp, the whole crew gathers for the finale
{const NL=root.MoonNpcLife;if(NL&&NL.pose){const op=NL.pose;NL.pose=function(id,hx,hz,t,p){const q=op.apply(this,arguments);const s=gs();if(!s||s.chapter!==3)return q;const P=place(id,s,t);if(!P)return q;return Object.assign({},q||{},P);};}}
function place(id,s,t){const st=logic.step(s);if(!st)return null;const at=(P,yaw,alt,mv)=>({x:P[0],z:P[1],yaw:yaw||0,moving:!!mv,alt:alt||0});const g=G(),p=g&&g.player;
 if(st==='home'&&rt.scene>=0&&rt.anchor){const k={engineer:-1,navigator:0,scout:1}[id];if(k==null)return null;const A=rt.anchor,fx=-Math.sin(A.y),fz=-Math.cos(A.y),[sx,d]=k<0?[-1.9,1.1]:k>0?[1.9,.9]:[-.7,3.4];const x=A.x+fx*d+Math.cos(A.y)*sx,z=A.z+fz*d-Math.sin(A.y)*sx;return at([x,z],Math.atan2(x-A.x,z-A.z));}
 if(id==='engineer'&&(st==='brief'||st==='home')){const y=p?Math.atan2(ENG[0]-p.x,ENG[1]-p.z):0;return at(ENG,y+Math.sin(t*1.3)*.25);}
 return null;}
// ---- world hooks
const R=root.MoonRenderer&&root.MoonRenderer.prototype;
const isCh3=()=>{const s=gs();return !!s&&s.chapter===3&&!!logic.step(s);};
if(R){const ot=R.terminal;if(ot)R.terminal=function(x,z,ch){if(ch===3&&isCh3()){for(const c of CLUES){const P=Core.POINTS[c.id];if(P&&P[0]===x&&P[1]===z)return;}}return ot.apply(this,arguments);};
 const oc=R.cat;R.cat=function(x,z,yaw,t,moving,alt,ch,...a){const A=this._npcActor;if(A&&A.alt)alt=A.alt;return oc.call(this,x,z,yaw,t,moving,alt,ch,...a);};
 const os=R.scene;R.scene=function(state,p,...a){const out=os.call(this,state,p,...a);try{draw(this,state,p);}catch(e){root.__life3Err=String(e.stack||e);}return out;};}
{const S2=root.MoonSide2;if(S2){const of=S2.floor;S2.floor=(x,z,alt)=>{let f=of?of(x,z,alt):0;if(isCh3()&&hyp(x-ST.x,z-ST.z)<12)f=Math.max(f,logic.roofFloor(x,z,alt));return f;};
 const oe=S2.extScan;S2.extScan=p=>{const s=gs();if(s&&s.chapter===3&&logic.step(s)==='clues'&&!s.signalClues.includes('clueValley')&&hyp(p.x-DM.x,p.z-DM.z)<45)return logic.heat(p.x,p.z);return oe?oe(p):null;};}}
// ---- drawing
const DARK=[.12,.13,.16],CYAN=[.35,.85,1],GOLD=[.95,.66,.24],RED=[1,.3,.2],WHITE=[.95,.95,.9];
const SEG={0:'abcdef',1:'bc',2:'abdeg',3:'abcdg',4:'bcfg',5:'acdfg',6:'acdefg',7:'abc',8:'abcdefg',9:'abcdfg'};
const SP={a:[0,.5,1],b:[.27,.25,0],c:[.27,-.25,0],d:[0,-.5,1],e:[-.27,-.25,0],f:[-.27,.25,0],g:[0,0,1]};
// upright digit on a wall panel facing yaw
function digit(r,x,y,z,yaw,n,col,k,a){const c=Math.cos(yaw),s=Math.sin(yaw);for(const ch of SEG[n]){const[lx,ly,h]=SP[ch];r.put('cube',x+c*lx*k,y+ly*k,z-s*lx*k,h?.5*k:.11*k,h?.11*k:.5*k,.06,col,yaw,12,a);}}
// flat digit lying on a plate (reads from the camp side)
function flat(r,x,y,z,yaw,n,col,k,a){const c=Math.cos(yaw),s=Math.sin(yaw);for(const ch of SEG[n]){const[lx,ly,h]=SP[ch];const px=x+c*lx*k-s*ly*k,pz=z-s*lx*k-c*ly*k;r.put('cube',px,y,pz,h?.5*k:.12*k,.04,h?.12*k:.5*k,col,yaw,12,a);}}
function panel(r,c,ch,lit,t){const[x,z]=c.panel,y=r.terrain(x,z,ch)+(c.kind==='roof'?ROOF_Y:0),yaw=c.kind==='roof'?ST.yaw+Math.PI*.5:Math.atan2(CAMP[0]-x,CAMP[1]-z);
 r.put('cube',x,y+1.25,z,1.5,2.3,.16,DARK,yaw,0,0);r.put('cube',x,y+2.42,z,1.6,.08,.2,GOLD,yaw,0,0);
 const nx=Math.sin(yaw)*.1,nz=Math.cos(yaw)*.1,col=lit?GOLD:[.25,.3,.35];digit(r,x+nx,y+1.5,z+nz,yaw,c.digit,col,1.15,lit?.9:0);
 for(let i=0;i<c.ord;i++){const o=(i-(c.ord-1)/2)*.28;r.put('cube',x+nx+Math.cos(yaw)*o,y+.55,z+nz-Math.sin(yaw)*o,.14,.14,.06,lit?CYAN:[.25,.3,.35],yaw,12,lit?.8:0);}
 if(lit&&r.meshes&&r.meshes.mineralGlow)r.put('mineralGlow',x+nx*4,y+.05,z+nz*4,2.6,1,2.6,GOLD,0,22,.35+.1*Math.sin(t*2));}
function recorder(r,x,y,z,t,col){r.put('cube',x,y+.22,z,.55,.44,.4,DARK,0,0,0);r.put('cube',x,y+.47,z,.5,.06,.36,col,0,12,.8);r.put('cylinder',x+.18,y+.85,z,.03,.8,.03,[.6,.6,.65]);r.put('cube',x+.18,y+1.27,z,.1,.1,.1,col,0,12,.6+.4*Math.sin(t*6));}
function draw(r,state,p){if(!p||!state||state.chapter!==3)return;const s=state,st=logic.step(s);if(!st)return;const t=now(),ch=3,glow=r.meshes&&r.meshes.mineralGlow,paw=root.MoonCarry&&root.MoonCarry.paw;
 // wall digits stay lit once heard (also for migrated saves)
 for(const c of CLUES){if(hyp(p.x-c.panel[0],p.z-c.panel[1])>90)continue;const heard=s.signalClues.includes(c.id);if(c.kind==='crater'&&!heard&&!(rt.lamp&&logic.inCrater(p.x,p.z)))continue;panel(r,c,ch,heard,t);}
 if(st==='clues'){
  // dome capsule: a dust mound, the capsule shows up close
  {const[x,z]=CAPSULE;if(!s.signalClues.includes('clueValley')&&hyp(p.x-x,p.z-z)<60){const y=r.terrain(x,z,ch);r.put('sphere',x,y-.1,z,1.6,.45,1.4,[.5,.46,.42],0,0,0);
   if(logic.capsuleVisible(p.x,p.z)){r.put('cylinder',x,y+.3,z,.32,.7,.32,[.85,.85,.82],.4,0,0,0,.7);r.put('cube',x,y+.62,z,.2,.08,.2,[1,.55,.15],0,12,.6+.4*Math.sin(t*7));if(glow)r.put('mineralGlow',x,y+.05,z,2.8,1,2.8,[1,.6,.2],0,22,.5);if(paw&&rt.rec==null)paw(r,x,y+2.2,z,t);}}}
  // roof: a recorder by the antenna + a signal beam; arrows on the fallen slab
  if(!s.signalClues.includes('clueResearch')&&hyp(p.x-ST.x,p.z-ST.z)<120){const[x,z]=ROOF_REC,y=r.terrain(x,z,ch)+ROOF_Y;recorder(r,x,y,z,t,CYAN);r.put('cylinder',x,y+9,z,.38,18,.38,CYAN,0,12,.32+.12*Math.sin(t*2.5));r.put('cylinder',x,y+9,z,.12,18,.12,WHITE,0,12,.55);r.put('sphere',x,y+18.2,z,.5,.5,.5,CYAN,0,12,.6+.4*Math.sin(t*4));
   if(hyp(p.x-ST.x,p.z-ST.z)<30){for(let i=0;i<3;i++){const a=4.6-i*1.5,[ax,az]=ST.W(a,-1.2),ay=r.terrain(ax,az,ch)+logic.roofFloor(ax,az,9)+.08;r.put('cube',ax,ay,az,.5,.05,.18,[1,.85,.3],ST.yaw,12,.5+.5*Math.sin(t*4-i));}
    const[dx,dz]=ST.W(0,4.6);if(glow&&p.alt<1)r.put('mineralGlow',dx,r.terrain(dx,dz,ch)+.05,dz,3,1,3,[1,.85,.3],0,22,.4);if(paw&&logic.onRoof(p.x,p.z,p.alt)&&rt.rec==null)paw(r,x,y+2.2,z,t);}}
  // crater: the record shows only in the lamp light
  if(!s.signalClues.includes('clueCrater')&&glow&&logic.inCrater(p.x,p.z)){const[x,z]=CLUES[1].P;const gy=r.terrain(x,z,ch);r.put('mineralGlow',x,gy+.05,z,2.4,1,2.4,[.4,1,.5],0,22,(rt.lamp?.6:.15)+(rt.lamp?.3:.1)*Math.sin(t*2.2));
   if(rt.lamp){const yw=p.yaw||0,fx=-Math.sin(yw),fz=-Math.cos(yw),vx=x-p.x,vz=z-p.z,dd=hyp(vx,vz);if(dd<9&&(vx*fx+vz*fz)/(dd||1)>.75){for(let i=0;i<8;i++){const a=t*3+i*.785,h=.4+((t*.8+i*.13)%1)*1.6;r.put('cube',x+Math.cos(a)*.55,gy+h,z+Math.sin(a)*.55,.08,.08,.08,[.7,1,.75],a,12,.9);}}}}
  if(!s.signalClues.includes('clueCrater')&&rt.lamp&&logic.inCrater(p.x,p.z)){const[x,z]=CLUES[1].P;recorder(r,x,r.terrain(x,z,ch),z,t,[.4,1,.5]);if(paw&&rt.rec==null)paw(r,x,r.terrain(x,z,ch)+2.2,z,t);}}
 if(rt.lamp&&logic.inCrater(p.x,p.z)&&glow){const yw=p.yaw||0,fx=-Math.sin(yw),fz=-Math.cos(yw);for(let i=1;i<=3;i++){const x=p.x+fx*i*1.6,z=p.z+fz*i*1.6;r.put('mineralGlow',x,r.terrain(x,z,ch)+.06,z,1.4+i*1,1,1.4+i*1,[1,.95,.75],0,22,.9-i*.12);}}
 // archive door + plates
 if(hyp(p.x-VT.x,p.z-VT.z)<90){const y=r.terrain(VT.x,VT.z,ch),[dx,dz]=VT.W(0,-1.8),dy=r.terrain(dx,dz,ch),open=!!s.vaultOpen;
  for(const sx of[-1.7,1.7]){const[px,pz]=VT.W(sx,-1.8);r.put('cube',px,dy+1.6,pz,.5,3.2,.6,[.55,.52,.5],VT.yaw,0,0);}
  {const[px,pz]=VT.W(0,-1.8);r.put('cube',px,dy+3.35,pz,4,.4,.7,[.55,.52,.5],VT.yaw,0,0);r.put('cube',px,dy+3.35,pz+0,4.05,.08,.72,GOLD,VT.yaw,0,0);}
  if(!open){r.put('cube',dx,dy+1.55,dz,2.9,3.1,.2,[.2,.24,.3],VT.yaw,0,0);r.put('cube',dx,dy+1.55,dz,.06,3,.24,CYAN,VT.yaw,12,.6);for(let i=0;i<3;i++){const lit=i<rt.seq.length;const[lx,lz]=VT.W(-.6+i*.6,-1.65);r.put('cube',lx,dy+2.7,lz,.3,.3,.1,lit?GOLD:[.25,.28,.32],VT.yaw,12,lit?1:0);}}
  else if(glow)r.put('mineralGlow',dx,dy+.05,dz,3.4,1,3.4,GOLD,0,22,.5);
  if(st==='vault'){for(let i=0;i<3;i++){const P=PLATES[i].P,py=r.terrain(P[0],P[1],ch),on=rt.seq.includes(i),z=rt.zap>0;
    r.put('cylinder',P[0],py+.06,P[1],PLATE_R*1.9,.16,PLATE_R*1.9,on?[1,.62,.12]:z?[.3,.12,.1]:[.1,.12,.16],0,on?12:0,on?.45:0);if(glow)r.put('mineralGlow',P[0],py+.05,P[1],PLATE_R*3,1,PLATE_R*3,on?GOLD:CYAN,0,22,on?.3:.12+.08*Math.sin(t*3+i));r.put('ring',P[0],py+.16,P[1],PLATE_R*1.9,1,PLATE_R*1.9,on?GOLD:CYAN,0,12,on?.9:.5+.2*Math.sin(t*3+i));
    {const yw=Math.atan2(CAMP[0]-P[0],CAMP[1]-P[1]),c=Math.cos(yw),sn=Math.sin(yw),n=CODE.indexOf(PLATES[i].d)+1;r.put('cylinder',P[0],py+.55,P[1],.05,.9,.05,[.5,.5,.55],0,0,0);r.put('cube',P[0],py+1.35,P[1],.9,1.15,.06,DARK,yw,0,0);
     digit(r,P[0]+sn*.05,py+1.45,P[1]+c*.05,yw,PLATES[i].d,on?GOLD:CYAN,.75,.95);for(let k=0;k<n;k++){const lx=(k-(n-1)/2)*.2;r.put('cube',P[0]+sn*.05+c*lx,py+.92,P[1]+c*.05-sn*lx,.07,.2,.06,on?GOLD:WHITE,yw,12,.9);}}}
   if(rt.zap>0){for(let i=0;i<10;i++){const a=t*23+i*2.1,rr=(i%4)*.5;const[sx,sz]=VT.W(Math.cos(a)*1.8*rr,-1.3+Math.sin(a*1.3)*.4);r.put('cube',sx,dy+.4+((i*37+t*40)%2.2),sz,.12,.12,.12,[1,.9,.3],a,12,1);}}}}
 // the dust devil with the blueprint
 if(st==='catch'&&rt.dv){const dv=rt.dv,y=r.terrain(dv.x,dv.z,ch);for(let i=0;i<7;i++){const h=.3+i*.42,rr=.35+i*.2,a=t*(7-i*.4)+i;r.put('ring',dv.x+Math.cos(a)*.15*i,y+h,dv.z+Math.sin(a)*.15*i,rr*2,1,rr*2,[.75,.66,.55],a,0,0);}
  for(let i=0;i<18;i++){const a=t*(4+i%3)+i*1.7,rr=.4+(i%6)*.32,h=((i*.37+t*.9)%1)*3.4;r.put('cube',dv.x+Math.cos(a)*rr,y+h,dv.z+Math.sin(a)*rr,.1,.1,.1,[.9,.8,.62],a,12,.7);}
  if(glow)r.put('mineralGlow',dv.x,y+.05,dv.z,4.2,1,4.2,[1,.8,.45],0,22,.55+.15*Math.sin(t*5));r.put('cylinder',dv.x,y+5,dv.z,.18,10,.18,[.4,.65,1],0,12,.35);const a=t*5,bx=dv.x+Math.cos(a)*.9,bz=dv.z+Math.sin(a)*.9,by=y+1.5+Math.sin(t*3)*.5;
  r.put('cube',bx,by,bz,.9,.04,.65,[.3,.55,1],a,12,.6,Math.sin(t*4)*.6,Math.cos(t*3)*.5);r.put('cube',bx,by+.03,bz,.7,.02,.06,WHITE,a,12,.8,Math.sin(t*4)*.6);
  if(paw&&dv.tired>0)paw(r,dv.x,y+3.4,dv.z,t);}
 if(st==='home'&&rt.scene<0){const y=r.terrain(ENG[0],ENG[1],ch);if(glow)r.put('mineralGlow',ENG[0],y+.05,ENG[1],3,1,3,[1,.55,.15],0,22,.35);if(paw)paw(r,ENG[0],y+3.4,ENG[1],t);
  const yw=(p.yaw||0)+t*2;r.put('cube',p.x,(r.terrain(p.x,p.z,ch)+(p.alt||0))+1.25,p.z,.6,.03,.42,[.3,.55,1],yw,12,.5);}
 if((st==='brief'&&rt.brief<0)||(st==='home'&&rt.scene<0)){const y=r.terrain(ENG[0],ENG[1],ch);if(paw&&!(st==='home'))paw(r,ENG[0],y+3.4,ENG[1],t);if(glow)r.put('mineralGlow',ENG[0],y+.05,ENG[1],2.6,1,2.6,[1,.6,.2],0,22,.45+.2*Math.sin(t*3));r.put('ring',ENG[0],y+.08,ENG[1],2.2,1,2.2,GOLD,0,12,.8);r.put('cylinder',ENG[0],y+8.5,ENG[1],.14,7,.14,GOLD,0,12,.3+.1*Math.sin(t*3));}}
// ---- dark crater overlay
const dark=document.createElement('div');dark.id='mk-l3-dark';dark.style.cssText='position:fixed;inset:0;z-index:0;pointer-events:none;display:none;transition:background .3s';{const cv=document.getElementById('world');if(cv&&cv.parentNode)cv.parentNode.insertBefore(dark,cv.nextSibling);else document.body.appendChild(dark);}
// ---- subtitles (speaker name in the crew colour)
const sub=document.createElement('div');sub.id='mk-l3-sub';sub.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:180px;max-width:86vw;z-index:31;display:none;padding:10px 14px;border-radius:14px;background:rgba(8,16,30,.78);border:1px solid rgba(120,210,255,.55);color:#dff6ff;font:600 15px/1.35 system-ui,sans-serif;text-align:center;text-shadow:0 1px 2px #000;pointer-events:none';
document.body.appendChild(sub);
function say(line){if(!line){if(sub.style.display!=='none'){sub.style.display='none';sub._k=null;}return;}if(sub._k===line[0])return;sub._k=line[0];const tx=tt(line[0],line[1]),ci=tx.search(/[:：]/),LK=root.MoonCrewLook&&root.MoonCrewLook[line[2]];sub.textContent='';
 if(LK&&ci>0){const b=document.createElement('b');b.style.color=LK.ui;b.textContent=tx.slice(0,ci+1);sub.append(b,tx.slice(ci+1));}else sub.textContent=tx;sub.style.display='block';}
const BRIEF=['l3.brief','Engineer: "A new band! This scanner hears old crew records. Find all three!"','engineer'];
const REC={clueValley:['l3.rec1','Engineer (record): "Digit I is seven. I painted it on the wall here."','engineer'],
 clueCrater:['l3.rec2','Scout (record): "Digit II is three. Dark here, right? Good thing you have a lamp."','scout'],
 clueResearch:['l3.rec3','Navigator (record): "Digit III is two. From this roof you can see the archive!"','navigator']};
const FIN=[[0,'l3.fin1','Engineer: "A rocket blueprint! A real one!"','engineer'],[2.4,'l3.fin2','Navigator: "So the signal came from the old archive all along."','navigator'],[4.8,'l3.fin3','Scout: "Then we build it. Next stop - the stars!"','scout']];
// ---- context button
let mode=null;
function pick(){const g=G();if(!g||!g.player)return null;const s=g.state,p=g.player,alt=p.alt||0,st=cur();if(!st||rt.rec)return null;
 if(root.MoonCarry&&root.MoonCarry.st&&root.MoonCarry.st.held>=0)return null;
 if(st==='brief'&&rt.brief<0&&hyp(p.x-ENG[0],p.z-ENG[1])<3&&alt<.6)return'talk';
 if(st==='clues'){for(const c of CLUES)if(logic.canHear(s,c,p.x,p.z,alt,rt.lamp))return'hear:'+c.id;if(logic.inCrater(p.x,p.z)&&!s.signalClues.includes('clueCrater'))return rt.lamp?'lampoff':'lamp';return null;}
 if(st==='home'&&rt.scene<0&&hyp(p.x-ENG[0],p.z-ENG[1])<3.2&&alt<.6)return'give';
 return null;}
const LBL={talk:()=>tt('l3.talk','Talk'),lamp:()=>tt('l3.lamp_on','Switch on the lamp'),lampoff:()=>tt('l3.lamp_off','Lamp off'),give:()=>tt('l3.give','Give the blueprint'),hear:()=>tt('l3.listen','Play the record')};
const ctx=()=>{mode=pick();return mode?LBL[mode.split(':')[0]]():null;};
API.ctx=ctx;
{const L1=root.MoonLife1;if(L1){const o=L1.ctx;L1.ctx=()=>ctx()||(o?o():null);}else root.MoonLife1={ctx};}
function act(e){const btn=e.target&&e.target.closest&&e.target.closest('#interact');if(!btn)return;const m=pick();if(!m)return;e.stopImmediatePropagation();e.preventDefault();const g=G();
 if(m==='talk'){rt.brief=0;sfx('click');}
 else if(m==='lamp'){rt.lamp=true;sfx('click');hud();}
 else if(m==='lampoff'){rt.lamp=false;sfx('click');hud();}
 else if(m.startsWith('hear:')){rt.rec={id:m.slice(5),t:0};sfx('coin');}
 else if(m==='give'){rt.anchor={x:g.player.x,z:g.player.z,y:g.camYaw||0};rt.scene=0;sfx('click');}}
root.addEventListener('click',act,true);
// ---- loop
let last=performance.now(),hints={},lastSt=null;
function loop(){const tn=performance.now(),dt=Math.min(.2,Math.max(0,(tn-last)/1000));last=tn;
 try{const g=G();if(g&&g.player&&g.state&&g.state.chapter===3&&cur()){const p=g.player,s=g.state,st=cur();
  if(st!==lastSt){lastSt=st;rt.scene=-1;rt.seq=[];rt.on=-1;say(null);if(st!=='catch')rt.dv=null;hud();}
  {const c=ctx();if(c){const sp=document.querySelector('#interact span');if(sp&&sp.textContent!==c){sp.textContent=c;sp.parentNode.style.opacity=1;}}if(c!==API._lastCtx){API._lastCtx=c;g.ui&&g.ui();}}
  // roof ramp: step up the slab (the game only falls down to a floor)
  if(hyp(p.x-ST.x,p.z-ST.z)<12){const f=logic.roofFloor(p.x,p.z,p.alt||0);if(f>(p.alt||0)&&f-(p.alt||0)<.6){p.alt=f;if(p.velocity<0)p.velocity=0;}}
  // darkness in the crater
  {const k=st==='clues'?logic.dark(p.x,p.z):0;if(k>0){dark.style.display='block';dark.style.background=rt.lamp?`radial-gradient(ellipse 46% 38% at 50% 56%,rgba(0,0,8,0) 0,rgba(0,0,8,${(.25*k).toFixed(2)}) 62%,rgba(0,0,10,${(.72*k).toFixed(2)}) 100%)`:`rgba(0,0,10,${(.64*k).toFixed(2)})`;}else if(dark.style.display!=='none'){dark.style.display='none';if(!logic.inCrater(p.x,p.z))rt.lamp=false;}}
  if(st==='brief'&&rt.brief>=0){rt.brief+=dt;say(BRIEF);if(rt.brief>=logic.BRIEF){rt.brief=-1;say(null);sfx('coin');toast(tt('l3.scanner_got','You got the new-band scanner!'));done(old('signalStart'));}}
  if(st==='clues'){
   if(!hints.dome&&hyp(p.x-DM.x,p.z-DM.z)<40&&!s.signalClues.includes('clueValley')){hints.dome=1;toast(tt('l3.hint_dome','The scanner beeps near the dome. Follow the warm signal!'));}
   if(!hints.roof&&hyp(p.x-ST.x,p.z-ST.z)<28&&!s.signalClues.includes('clueResearch')){hints.roof=1;toast(tt('l3.hint_roof','The record is on the station roof. Go inside: the fallen roof is a ramp up!'));}
   if(logic.inCrater(p.x,p.z)&&!s.signalClues.includes('clueCrater')){if(!rt.lamp&&!hints.dark){hints.dark=1;toast(tt('l3.hint_dark','Too dark here. Switch on your lamp!'));}}else hints.dark=0;
   if(rt.rec){rt.rec.t+=dt;say(REC[rt.rec.id]);if(rt.rec.t>=logic.REC){const id=rt.rec.id;rt.rec=null;say(null);done(old(id));}}}
  else if(rt.rec)rt.rec=null;
  if(st==='vault'){if(!hints.pl&&hyp(p.x-VT.x,p.z-VT.z)<16){hints.pl=1;toast(tt('l3.hint_plates','Three plates by the archive door. Step on them in the order of the records: I, II, III.'));}
   if(rt.zap>0){rt.zap-=dt;const[ax,az]=logic.away(),k=Math.min(1,dt*6)*(rt.zap>.3?1:0),nx=p.x+ax*k,nz=p.z+az*k;if(k&&!(g.renderer&&g.renderer.blocked(nx,nz,s,p.alt||0))){p.x=nx;p.z=nz;}}
   const i=logic.plateAt(p.x,p.z,p.alt);if(i!==rt.on){rt.on=i;if(i>=0&&rt.zap<=0&&!rt.seq.includes(i)){const r=logic.press(rt.seq,i);rt.seq=r.seq;
     if(r.res==='bad'){rt.zap=.9;sfx('click');try{navigator.vibrate&&navigator.vibrate(80);}catch(e){}toast(tt('l3.plate_bad','Wrong plate! Sparks push you away from the door.'));}
     else if(r.res==='ok'){sfx('click');toast(tt('l3.plate_ok','Click! Plate {n}/3',{n:rt.seq.length}));}
     else{sfx('coin');const res=Core.solve(s,'vault',CODE.slice());rt.seq=[];rt.devT=0;toast(tt('l3.vault_ok','The archive door opens!'));done(res);}}}}
  if(st==='catch'){if(!rt.dv){if(rt.devT<0)rt.devT=0;rt.devT+=dt;if(rt.devT>1.2){rt.dv=logic.devil();const[dx,dz]=VT.W(0,-.5);rt.dv.x=dx;rt.dv.z=dz;rt.dv.a=Math.atan2(dz-DEV_C[1],dx-DEV_C[0]);toast(tt('l3.wind','Whoa! A dust devil grabbed the blueprint!'));}}
   else{const r=logic.devilStep(rt.dv,p.x,p.z,dt);if(r==='tired'&&!hints.tired&&hyp(p.x-rt.dv.x,p.z-rt.dv.z)<10){hints.tired=1;toast(tt('l3.tired','The dust devil slows down - jump now!'));}else if(r!=='tired')hints.tired=0;
    if(logic.canCatch(rt.dv,p.x,p.z,p.alt)){rt.dv=null;sfx('coin');toast(tt('l3.caught','Got it! The blueprint is yours.'));done(old('blueprint'));}
    else if(hyp(p.x-rt.dv.x,p.z-rt.dv.z)<2.4&&(p.alt||0)<.3&&!hints.jump){hints.jump=1;toast(tt('l3.jump','Jump to grab it!'));}}}
  if(st==='home'&&rt.scene>=0){rt.scene+=dt;let line=null;for(const L of FIN)if(rt.scene>=L[0])line=L;say(line?[line[1],line[2],line[3]]:null);if(rt.scene>=logic.SCENE){rt.scene=-1;say(null);done(old('blueprintReturn'));}}
  dyn();}
  else{if(dark.style.display!=='none')dark.style.display='none';if(sub._k&&g&&g.state&&g.state.chapter!==3)say(null);}}catch(e){root.__life3Err=String(e.stack||e);}
 requestAnimationFrame(loop);}
requestAnimationFrame(loop);
})(typeof globalThis!=='undefined'?globalThis:this);
