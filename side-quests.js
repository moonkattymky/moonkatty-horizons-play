/* side-quests.js — stage 1 parts B and C, built on the carry system (carry.js).
   B: old station (-165,55): carry 3 parts to the broken transmitter and set them in its slots → it lights up.
   C: fallen dome (-120,-155): switch on 4 beacons in the order shown on the clue board; a wrong one resets gently.
   Pure logic in MoonSide.logic (tests/side-quests.cjs). Progress is local; no Moon Points are awarded here. */
(function(root){
'use strict';
const frame=(x,z,yaw)=>{const c=Math.cos(yaw),s=Math.sin(yaw);return{x,z,yaw,W:(lx,lz)=>[x+c*lx+s*lz,z-s*lx+c*lz],L:(wx,wz)=>{const dx=wx-x,dz=wz-z;return[c*dx-s*dz,s*dx+c*dz];}};};
const ST=frame(-165,55,-.3),DM=frame(-120,-155,0);
const TX=ST.W(3.6,7.4);                         // broken transmitter, right of the station door
const PARTS=[['cell',-9.0,3.0],['board',-3.6,1.4],['dish',8.6,-2.2]]; // one is inside the station
const BEACONS=[[-8.6,4.6],[-4.6,8.8],[4.9,8.6],[8.7,4.4]].map(([a,b])=>DM.W(a,b));
const COLORS=[[.35,.65,1.0],[.35,.95,.55],[1.0,.45,.75],[1.0,.72,.25]]; // blue green pink amber
const ORDER=[3,0,2,1];                          // amber → blue → pink → green (shown on the board)
const BOARD=DM.W(2.3,11.2);
const PICK_R=1.7,INSTALL_R=2.2,PRESS_R=2.0,PART_R=.38,TX_R=.8,BEACON_R=.45;
const d2=(ax,az,bx,bz)=>Math.hypot(ax-bx,az-bz);
const logic={
 ST,DM,TX,PARTS,BEACONS,ORDER,BOARD,PICK_R,INSTALL_R,PRESS_R,
 fresh(){return{v:1,held:-1,parts:PARTS.map(([t,lx,lz],i)=>{const[x,z]=ST.W(lx,lz);return{id:i,t,x,z,yaw:i*1.1,in:false};}),fixed:false,seq:[],lit:false};},
 sanitize(raw){const f=logic.fresh();if(!raw||raw.v!==1)return f;
  if(Array.isArray(raw.parts)&&raw.parts.length===f.parts.length)f.parts.forEach((p,i)=>{const q=raw.parts[i];if(!q)return;
   if(q.in===true)p.in=true;else if(Number.isFinite(q.x)&&Number.isFinite(q.z)&&d2(q.x,q.z,ST.x,ST.z)<60){p.x=q.x;p.z=q.z;p.yaw=+q.yaw||0;}});
  f.fixed=f.parts.every(p=>p.in);f.lit=raw.lit===true;f.seq=[];if(f.lit)f.seq=ORDER.slice();return f;},
 nearPart(st,px,pz){let b=-1,bd=PICK_R;st.parts.forEach((p,i)=>{if(p.in||i===st.held)return;const d=d2(p.x,p.z,px,pz);if(d<bd){bd=d;b=i;}});return b;},
 atTransmitter(px,pz){return d2(px,pz,TX[0],TX[1])<INSTALL_R;},
 pick(st,px,pz){if(st.held>=0)return{ok:false,why:'busy'};const i=logic.nearPart(st,px,pz);if(i<0)return{ok:false,why:'far'};st.held=i;return{ok:true,id:i};},
 place(st,px,pz,yaw,blocked){if(st.held<0)return{ok:false,why:'empty'};const p=st.parts[st.held];
  if(logic.atTransmitter(px,pz)){p.in=true;p.x=TX[0];p.z=TX[1];st.held=-1;const was=st.fixed;st.fixed=st.parts.every(q=>q.in);return{ok:true,installed:true,justFixed:!was&&st.fixed,left:st.parts.filter(q=>!q.in).length};}
  const x=px-Math.sin(yaw)*.85,z=pz-Math.cos(yaw)*.85;if(blocked&&blocked(x,z))return{ok:false,why:'blocked'};
  if(st.parts.some((q,i)=>i!==st.held&&!q.in&&d2(q.x,q.z,x,z)<PART_R*1.8))return{ok:false,why:'blocked'};p.x=x;p.z=z;p.yaw=yaw;st.held=-1;return{ok:true,installed:false};},
 nearBeacon(st,px,pz){let b=-1,bd=PRESS_R;BEACONS.forEach(([x,z],i)=>{const d=d2(x,z,px,pz);if(d<bd){bd=d;b=i;}});return b;},
 press(st,i){if(st.lit)return{ok:false,why:'done'};if(st.seq.includes(i))return{ok:false,why:'on'};
  if(ORDER[st.seq.length]!==i){st.seq=[];return{ok:true,wrong:true};}st.seq.push(i);if(st.seq.length===ORDER.length){st.lit=true;return{ok:true,done:true};}return{ok:true,step:st.seq.length};},
 blocked(st,x,z){if(d2(x,z,TX[0],TX[1])<TX_R)return true;for(const[bx,bz]of BEACONS)if(d2(x,z,bx,bz)<BEACON_R)return true;if(d2(x,z,BOARD[0],BOARD[1])<.45)return true;
  for(let i=0;i<st.parts.length;i++){const p=st.parts[i];if(i===st.held||p.in)continue;if(d2(x,z,p.x,p.z)<PART_R)return true;}return false;},
 persist(st,p){const s2=JSON.parse(JSON.stringify(st));if(s2.held>=0&&p&&Number.isFinite(p.x)&&Number.isFinite(p.z)){s2.parts[s2.held].x=p.x;s2.parts[s2.held].z=p.z;}s2.held=-1;delete s2.seq;return s2;}
};
const API={logic,st:null,get held(){return !!(API.st&&API.st.held>=0);}};
root.MoonSide=API;
if(typeof module!=='undefined'&&module.exports)module.exports=API;
if(typeof document==='undefined')return;
const KEY='moonkatty-side-v1',G=()=>root.MoonGame;
try{API.st=logic.sanitize(JSON.parse(localStorage.getItem(KEY)||'null'));}catch(e){API.st=logic.fresh();}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(logic.persist(API.st,G()&&G().player)));}catch(e){}};
const tt=(k,fb,p)=>{try{const v=root._t?root._t(k,p):null;return v&&v!==k?v:fb;}catch(e){return fb;}};
const txt={take:()=>tt('carry.take','Pick up'),put:()=>tt('carry.put','Put down'),install:()=>tt('sq.install','Install'),on:()=>tt('sq.activate','Switch on'),
 stHint:()=>tt('sq.st_hint','The transmitter is broken.'),stLeft:n=>tt('sq.st_left','Parts left: '+n,{n}),stDone:()=>tt('sq.st_done','The transmitter works!'),
 bcHint:()=>tt('sq.bc_hint','Switch on the beacons in order.'),bcWrong:()=>tt('sq.bc_wrong','Wrong order.'),bcStep:n=>tt('sq.bc_step',n+'/4',{n}),bcDone:()=>tt('sq.bc_done','The dome is alive!'),
 noroom:()=>tt('carry.noroom','No room here.'),side:(name,d)=>tt('side.fmt',name+' · '+d+' m',{name,d}),
 n_rocket:()=>tt('side.rocket','Clear the rocket entrance'),n_station:()=>tt('side.station','Repair the transmitter'),n_dome:()=>tt('side.dome','Light the dome beacons')};
const near=(p,f,r)=>Math.abs(p.x-f.x)<r&&Math.abs(p.z-f.z)<r;
// ---- collision + drawing
const R=root.MoonRenderer&&root.MoonRenderer.prototype;
if(R){const ob=R.blocked;R.blocked=function(x,z,state,alt=0){if(alt<1.2&&API.st&&(near({x,z},ST,30)||near({x,z},DM,30))&&logic.blocked(API.st,x,z))return true;return ob.apply(this,arguments);};
 const os=R.scene;R.scene=function(state,p,...a){const out=os.call(this,state,p,...a);try{draw(this,state,p);}catch(e){root.__sideErr=String(e);}return out;};}
// 0 when the camera is within ~2.5 m of a glowing part, 1 from ~7 m: emissive parts never fill the screen close up
const camFade=(r,x,y,z)=>{const e=r.eye||r._eyeOut;if(!e)return 1;const d=Math.hypot(e[0]-x,e[1]-y,e[2]-z);return Math.max(0,Math.min(1,(d-2.5)/4.5));};
const GOLD=[.95,.68,.22],DARK=[.2,.21,.24],GREY=[.62,.63,.64],WHITE=[.9,.9,.87];
function part(r,t,x,y,z,yaw,sc,hl=0){const P=(sh,ly,sx,sy,sz,col,k,g)=>r.put(sh,x,y+ly*sc,z,sx*sc,sy*sc,sz*sc,col,yaw,k||0,(g||0)+hl);
 if(t==='cell'){P('cylinder',.3,.3,.55,.3,[.95,.48,.12]);P('cylinder',.36,.32,.1,.32,[.3,.85,1.0],12,.6);}
 else if(t==='dish'){P('sphere',.2,.66,.16,.66,WHITE);P('sphere',.27,.16,.1,.16,GOLD,0,.3);P('cylinder',.08,.08,.16,.08,DARK);}
 else{P('cube',.08,.6,.06,.44,[.16,.5,.32]);P('cube',.13,.14,.05,.12,GOLD,0,.3);P('cube',.13,.12,.04,.1,[.3,.85,1.0],12,.5);}}
function draw(r,state,p){const st=API.st;if(!st||!p)return;const ch=state&&state.chapter,t=performance.now()/1000,glow=r.meshes&&r.meshes.mineralGlow,paw=root.MoonCarry&&root.MoonCarry.paw;
 if(near(p,ST,80)){const[tx,tz]=TX,ty=r.terrain(tx,tz,ch),yw=ST.yaw;
  r.put('cube',tx,ty+.3,tz,1.6,.6,.8,DARK,yw);r.put('cylinder',tx,ty+1.9,tz,.14,2.9,.14,GREY,yw);r.put('cube',tx,ty+3.1,tz,.9,.06,.06,GREY,yw);
  const cf=camFade(r,tx,ty+3.4,tz);r.put('sphere',tx,ty+3.4,tz,.8,.22,.8,st.fixed?[.42,.62,.72]:[.74,.76,.8],yw,0,0,.9);if(st.fixed&&cf>0)r.put('sphere',tx,ty+3.48,tz,.24*cf+.06,.1,.24*cf+.06,[.35,.85,1.0],yw,12,.28*cf,.9);   // small cyan core; fades out when the camera is close (no white blob)for(const h of[1.0,2.0])r.put('cylinder',tx,ty+h,tz,.24,.06,.24,GOLD,yw,0,.1);if(st.fixed&&cf>0)r.put('cylinder',tx,ty+7.5,tz,.08,8,.08,[.45,.85,1.0],0,12,.3*cf);
  const c=Math.cos(yw),s=Math.sin(yw);
  const pulse=.35+.25*Math.sin(t*3.2);
  st.parts.forEach((pt,i)=>{const lx=(i-1)*.5,sx=tx+c*lx+s*.41,sz=tz-s*lx+c*.41,fx=tx+c*lx+s*.4,fz=tz-s*lx+c*.4;   // slot: glowing outline frame + dark socket (cyan when filled)
   r.put('cube',fx,ty+.34,fz,.44,.44,.04,pt.in?[.4,.9,1.0]:[1.0,.72,.25],yw,12,pt.in?.55:(st.held>=0?.35+pulse:.3));
   r.put('cube',sx+s*.02,ty+.34,sz+c*.02,.34,.34,.04,pt.in?[.25,.7,.95]:[.05,.05,.07],yw,pt.in?12:0,pt.in?.4:0);if(pt.in)part(r,pt.t,sx+s*.06,ty+.24,sz+c*.06,yw,.42);});
  const lamp=st.fixed?(.6+.4*Math.sin(t*4))*cf:0;r.put('sphere',tx,ty+3.66,tz,.26,.26,.26,st.fixed?[1.0,.35,.3]:[.25,.12,.12],yw,st.fixed?12:0,lamp);
  if(st.fixed&&glow)r.put('mineralGlow',tx,ty+.04,tz,2.4,1,2.4,[.4,.85,1.0],0,22,.3+.1*Math.sin(t*2));
  else if(glow&&st.held>=0)r.put('mineralGlow',tx,ty+.04,tz,2.0,1,2.0,[1.0,.75,.32],0,22,.3+.12*Math.sin(t*2.6));
  const close=near(p,ST,15+15);
  st.parts.forEach((pt,i)=>{if(pt.in||i===st.held)return;const y=r.terrain(pt.x,pt.z,ch);part(r,pt.t,pt.x,y,pt.z,pt.yaw,1);
   if(Math.hypot(p.x-pt.x,p.z-pt.z)<15){if(glow)r.put('mineralGlow',pt.x,y+.04,pt.z,1.1,1,1.1,[1.0,.75,.32],0,22,.28+.12*Math.sin(t*2.6+i));if(paw)paw(r,pt.x,y+1.0,pt.z,t+i);}});}
 if(st.held>=0){const pt=st.parts[st.held],y=r.terrain(p.x,p.z,ch)+(p.alt||0),fx=-Math.sin(p.yaw||0),fz=-Math.cos(p.yaw||0);part(r,pt.t,p.x+fx*.34,y+.4,p.z+fz*.34,(p.yaw||0)+.4,.78,.22);}
 if(near(p,DM,80)){BEACONS.forEach(([bx,bz],i)=>{const by=r.terrain(bx,bz,ch),on=st.lit||st.seq.includes(i),col=COLORS[i],bf=camFade(r,bx,by+1.72,bz);
   r.put('cylinder',bx,by+.7,bz,.36,1.4,.36,DARK);r.put('cylinder',bx,by+1.42,bz,.5,.09,.5,GOLD,0,0,.15);
   r.put('sphere',bx,by+1.72,bz,.46,.46,.46,on?col:col.map(v=>v*.45),0,on&&bf>.3?12:0,on?(.45+.15*Math.sin(t*3+i))*bf:0);if(on&&bf>0)r.put('cylinder',bx,by+3.6,bz,.08,3.4,.08,col,0,12,.35*bf);
   if(on&&glow)r.put('mineralGlow',bx,by+.04,bz,1.6,1,1.6,col,0,22,.35);
   else if(!st.lit&&glow&&Math.hypot(p.x-bx,p.z-bz)<15)r.put('mineralGlow',bx,by+.04,bz,1.0,1,1.0,col,0,22,.16+.08*Math.sin(t*2+i));});
  // clue board: four lamps left→right in the right order, with 1..4 dots above each
  const[gx,gz]=BOARD,gy=r.terrain(gx,gz,ch);r.put('cube',gx,gy+.6,gz,.12,1.2,.12,DARK);r.put('cube',gx,gy+1.35,gz,1.7,.75,.08,[.12,.13,.16]);r.put('cube',gx,gy+1.35,gz+.01,1.78,.83,.05,GOLD,0,0,.1);
  const DEEP=[[.08,.3,1.0],[.05,.75,.2],[.95,.12,.5],[1.0,.5,.02]];   // saturated (no emissive wash) so the order reads at a glance
  ORDER.forEach((bi,k)=>{const lx=gx-.6+k*.4;r.put('sphere',lx,gy+1.25,gz+.07,.3,.3,.08,DEEP[bi],0,0,.06);for(let d=0;d<=k;d++)r.put('sphere',lx-(k*.05)+d*.1,gy+1.55,gz+.07,.05,.05,.03,WHITE,0,0,0);});
  if(st.lit&&glow)r.put('mineralGlow',DM.x,r.terrain(DM.x,DM.z,ch)+.05,DM.z,9,1,9,[.45,.8,1.0],0,22,.12+.04*Math.sin(t*1.5));}}
// ---- context button
let mode=null,nearI=-1;
function pick(){const g=G();if(!g||!API.st)return null;const p=g.player,st=API.st;
 if(st.held>=0)return logic.atTransmitter(p.x,p.z)?'install':'put';
 if(root.MoonCarry&&root.MoonCarry.own)return null;
 if(near(p,ST,30)){nearI=logic.nearPart(st,p.x,p.z);if(nearI>=0)return'take';}
 if(near(p,DM,30)&&!st.lit){nearI=logic.nearBeacon(st,p.x,p.z);if(nearI>=0&&!st.seq.includes(nearI))return'on';}return null;}
function ctx(){mode=pick();return mode?txt[mode]():null;}API.ctx=ctx;
function label(){const b=document.querySelector('#interact span'),btn=document.querySelector('#interact');if(!b)return;const w=ctx();
 if(w){if(b.textContent!==w)b.textContent=w;btn.style.opacity=1;}}
function act(e){const btn=e.target&&e.target.closest&&e.target.closest('#interact');if(!btn)return;const m=pick();if(!m)return;e.stopImmediatePropagation();e.preventDefault();
 const g=G(),p=g.player,st=API.st,toast=s=>g.toast&&g.toast(s);
 if(m==='take'){if((p.alt||0)>.6)return;if(logic.pick(st,p.x,p.z).ok)save();}
 else if(m==='put'||m==='install'){const rd=g.renderer,state=g.state;const r=logic.place(st,p.x,p.z,p.yaw||0,(x,z)=>rd.blocked(x,z,state,0)||!!(root.MoonRuins2&&root.MoonRuins2.blocked(x,z)));
  if(!r.ok)toast(txt.noroom());else{save();if(r.justFixed)toast(txt.stDone());else if(r.installed)toast(txt.stLeft(r.left));}}
 else if(m==='on'){const r=logic.press(st,nearI);if(r.wrong)toast(txt.bcWrong());else if(r.done){save();toast(txt.bcDone());}else if(r.ok)toast(txt.bcStep(r.step));}
 label();}
root.addEventListener('click',act,true);
// ---- side objective pill (does not touch the chapter quest)
const pill=document.createElement('div');pill.id='sideq';pill.style.cssText='position:fixed;left:12px;z-index:30;pointer-events:none;padding:5px 10px;border-radius:12px;background:rgba(14,18,34,.72);border:1px solid rgba(255,190,90,.55);color:#ffd9a0;font:600 12px/1.3 system-ui,sans-serif;max-width:70vw;display:none';
document.body.appendChild(pill);
let hintS=false,hintD=false;
function loop(){try{const g=G();if(g&&g.player&&API.st){const p=g.player,st=API.st;label();
  if(!hintS&&!st.fixed&&Math.hypot(p.x-ST.x,p.z-ST.z)<22){hintS=true;g.toast&&g.toast(txt.stHint());}
  if(!hintD&&!st.lit&&Math.hypot(p.x-DM.x,p.z-DM.z)<22){hintD=true;g.toast&&g.toast(txt.bcHint());}
  const C=root.MoonCarry,list=[];if(C&&C.st&&!C.st.cleared)list.push(['rocket',C.RUIN.x,C.RUIN.z]);if(!st.fixed)list.push(['station',ST.x,ST.z]);if(!st.lit)list.push(['dome',DM.x,DM.z]);
  let best=null,bd=260;for(const q of list){const d=Math.hypot(p.x-q[1],p.z-q[2]);if(d<bd){bd=d;best=q;}}
  const dir=document.querySelector('#destination'),top=dir&&!dir.hidden?dir.getBoundingClientRect().bottom+8:null;
  if(best&&top&&!document.querySelector('dialog[open]')){pill.textContent='★ '+txt.side(txt['n_'+best[0]](),Math.round(bd));pill.style.top=top+'px';pill.style.display='block';}else pill.style.display="none";}}catch(e){root.__sideErr=String(e.stack||e);}
 requestAnimationFrame(loop);}
requestAnimationFrame(loop);
setInterval(()=>{if(API.st&&API.st.held>=0)save();},2000);root.addEventListener('pagehide',save);
// ---- Moon Points: server checkpoints (server decides and pays; the client only reports). start = first visit, then completion.
const PK='moonkatty-side-pts-v1',SIDE_IDS={rocket:'side_rocket_rubble',station:'side_station_tx',dome:'side_dome_beacons'};
let pts={seen:{},done:{}};try{const o=JSON.parse(localStorage.getItem(PK)||'null');if(o&&typeof o==='object')pts={seen:o.seen||{},done:o.done||{}};}catch(e){}
const savePts=()=>{try{localStorage.setItem(PK,JSON.stringify(pts));}catch(e){}};
const wait={};let busy=false;
async function report(key,start){const id=SIDE_IDS[key],UI=root.MoonGrowthUI;if(!UI||!UI.api||busy||(wait[id+start]||0)>Date.now())return;busy=true;
 try{const r=await UI.api('/api/story/checkpoint',start?{id,start:true}:{id});
  if(start)pts.seen[id]=1;else{pts.done[id]=1;pts.seen[id]=1;const rw=r&&r.reward,n=rw?(rw.points||0)+(rw.pending||0):0;if(n>0){const g=G();g&&g.toast&&g.toast(tt('sq.points','+'+n+' Moon Points',{n}));try{UI.updateMoon&&UI.updateMoon();}catch(e){}}}
  savePts();}
 catch(e){const c=e&&e.code;if(c==='not_started'){delete pts.seen[id];savePts();wait[id+start]=Date.now()+3000;}
  else wait[id+start]=Date.now()+(c==='too_fast'?15000:c==='story_not_started'?60000:c==='bad_checkpoint'?600000:20000);}   // retry later (offline, busy, too early; an old server without side quests → every 10 min)
 finally{busy=false;}}
API.points={ids:SIDE_IDS,state:()=>pts,report};
setInterval(()=>{try{const g=G(),p=g&&g.player,st=API.st,C=root.MoonCarry;if(!p||!st)return;
 const q=[['rocket',C&&C.RUIN,C&&C.st&&C.st.cleared],['station',ST,st.fixed],['dome',DM,st.lit]];
 for(const[k,f,ok]of q){const id=SIDE_IDS[k];if(!f||pts.done[id])continue;if(!pts.seen[id]&&(ok||Math.hypot(p.x-f.x,p.z-f.z)<40)){report(k,true);return;}if(ok&&pts.seen[id]){report(k,false);return;}}}catch(e){}},2500);
})(typeof globalThis!=='undefined'?globalThis:this);
