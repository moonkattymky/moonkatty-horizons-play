/* carry.js — pick up / carry / put down objects (stage 1: rubble at the crashed rocket breach).
   Pure logic in MoonCarry.logic (tested in tests/carry.cjs); the browser part hooks the renderer
   (draw + collision) and the context button (#interact: Взять / Положить, key E). Progress is local. */
(function(root){
'use strict';
const RUIN={id:'rocketWreck',x:150,z:130,yaw:.35};
const c=Math.cos(RUIN.yaw),s=Math.sin(RUIN.yaw);
const W=(lx,lz)=>[RUIN.x+c*lx+s*lz,RUIN.z-s*lx+c*lz];
const L=(x,z)=>{const dx=x-RUIN.x,dz=z-RUIN.z;return[c*dx-s*dz,s*dx+c*dz];};
// passage in front of the breach (rocket local frame): rubble inside it blocks the way in
const PASS={x0:2.0,x1:8.0,z0:1.7,z1:3.6};
const PICK_R=1.7,PIECE_R=.42;
const START=[[2.7,2.55,0,'rock'],[3.7,3.05,1,'plate'],[4.6,2.45,2,'rock'],[5.4,3.0,3,'plate'],[6.3,2.6,4,'rock'],[7.2,3.0,5,'rock']];
const inPass=(x,z)=>{const[lx,lz]=L(x,z);return lx>PASS.x0-PIECE_R&&lx<PASS.x1+PIECE_R&&lz>PASS.z0-PIECE_R&&lz<PASS.z1+PIECE_R;};
const logic={
 W,L,PASS,PICK_R,PIECE_R,inPass,
 fresh(){return{v:1,held:-1,cleared:false,pieces:START.map(([lx,lz,i,t])=>{const[x,z]=W(lx,lz);return{id:i,t,x,z,yaw:i*1.3};})};},
 sanitize(raw){const f=logic.fresh();if(!raw||raw.v!==1||!Array.isArray(raw.pieces)||raw.pieces.length!==f.pieces.length)return f;
  for(let i=0;i<f.pieces.length;i++){const p=raw.pieces[i];if(p&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&Math.hypot(p.x-RUIN.x,p.z-RUIN.z)<60){f.pieces[i].x=p.x;f.pieces[i].z=p.z;f.pieces[i].yaw=+p.yaw||0;}}
  f.cleared=!!raw.cleared||logic.isClear(f);f.logRead=!!raw.logRead;return f;},
 isClear(st){return st.pieces.every((p,i)=>i===st.held?false:!inPass(p.x,p.z))&&st.held<0;},
 nearest(st,px,pz){let best=-1,bd=PICK_R;st.pieces.forEach((p,i)=>{if(i===st.held)return;const d=Math.hypot(p.x-px,p.z-pz);if(d<bd){bd=d;best=i;}});return best;},
 pick(st,px,pz){if(st.held>=0)return{ok:false,why:'busy'};const i=logic.nearest(st,px,pz);if(i<0)return{ok:false,why:'far'};st.held=i;return{ok:true,id:i};},
 dropSpot(px,pz,yaw){return[px-Math.sin(yaw)*.85,pz-Math.cos(yaw)*.85];},
 drop(st,px,pz,yaw,blocked){if(st.held<0)return{ok:false,why:'empty'};const[x,z]=logic.dropSpot(px,pz,yaw);
  if(blocked&&blocked(x,z))return{ok:false,why:'blocked'};if(st.pieces.some((p,i)=>i!==st.held&&Math.hypot(p.x-x,p.z-z)<PIECE_R*1.8))return{ok:false,why:'blocked'};
  const p=st.pieces[st.held];p.x=x;p.z=z;p.yaw=yaw;st.held=-1;const was=st.cleared;st.cleared=st.cleared||logic.isClear(st);return{ok:true,justCleared:!was&&st.cleared};},
 // collision: each resting piece is a small round obstacle; until the way is cleared the breach mouth is closed
 blocked(st,x,z){if(!st.cleared){const[lx,lz]=L(x,z);if(lx>PASS.x0&&lx<PASS.x1&&lz>PASS.z0+.3&&lz<PASS.z1-.2)return true;}
  for(let i=0;i<st.pieces.length;i++){if(i===st.held)continue;const p=st.pieces[i];if(Math.abs(p.x-x)<PIECE_R&&Math.abs(p.z-z)<PIECE_R&&Math.hypot(p.x-x,p.z-z)<PIECE_R)return true;}return false;},
 persist(st,p){const s2=JSON.parse(JSON.stringify(st));if(s2.held>=0&&p&&Number.isFinite(p.x)&&Number.isFinite(p.z)){s2.pieces[s2.held].x=p.x;s2.pieces[s2.held].z=p.z;}s2.held=-1;return s2;},
 speedMul(st){return st&&st.held>=0?.62:1;},
 jumpMul(st){return st&&st.held>=0?.6:1;}
};
const API={logic,RUIN,st:null,get own(){return !!(API.st&&API.st.held>=0);},get held(){return API.own||!!(root.MoonSide&&root.MoonSide.held);}};
root.MoonCarry=API;
if(typeof module!=='undefined'&&module.exports)module.exports=API;
if(typeof document==='undefined')return;
const KEY='moonkatty-carry-v1';
try{API.st=logic.sanitize(JSON.parse(localStorage.getItem(KEY)||'null'));}catch(e){API.st=logic.fresh();}
const save=()=>{try{const s2=logic.persist(API.st,G()&&G().player);localStorage.setItem(KEY,JSON.stringify(s2));}catch(e){}};
const tt=(k,fb,p)=>{try{const v=root._t?root._t(k,p):null;return v&&v!==k?v:fb;}catch(e){return fb;}};
const txt={take:()=>tt('carry.take','Pick up'),put:()=>tt('carry.put','Put down'),hint:()=>tt('carry.hint','The rocket entrance is blocked.'),cleared:()=>tt('carry.cleared','The way is clear!'),noroom:()=>tt('carry.noroom','No room here.'),log:()=>tt('carry.log','Ship log found.'),left:n=>tt('carry.left','Pieces in the way: '+n,{n})};
const G=()=>root.MoonGame;
let hinted=false,nearIdx=-1;
// collision + drawing hooks on the renderer
const R=root.MoonRenderer&&root.MoonRenderer.prototype;
if(R){const ob=R.blocked;R.blocked=function(x,z,state,alt=0){if(alt<1.2&&API.st&&Math.abs(x-RUIN.x)<25&&Math.abs(z-RUIN.z)<25&&logic.blocked(API.st,x,z))return true;return ob.apply(this,arguments);};
 const os=R.scene;R.scene=function(state,p,...a){const out=os.call(this,state,p,...a);try{draw(this,state,p);}catch(e){root.__carryErr=String(e);}return out;};}
const WHITE=[.90,.90,.87],GOLD=[.95,.68,.22],DARK=[.20,.21,.24];
function piece(r,pc,x,y,z,yaw,sc){sc=sc||1;const P=(sh,ly,sx,sy,sz,col,k,g,pi,ro)=>r.put(sh,x,y+ly*sc,z,sx*sc,sy*sc,sz*sc,col,yaw,k||0,g||0,pi||0,ro||0);
 if(pc.t==='plate'){P('cube',.2,.95,.12,.66,WHITE,0,0,.25,.12);P('cube',.27,.95,.03,.12,GOLD,0,.15,.25,.12);P('cube',.14,.97,.05,.68,DARK,0,0,.25,.12);}
 else{P('cube',.3,.62,.5,.5,WHITE,0,0,.5,.35);P('cube',.32,.64,.12,.52,GOLD,0,.15,.5,.35);P('cube',.12,.5,.14,.44,DARK,0,0,.2,.1);}}
// small floating paw over a piece (pad + 3 toes), soft emissive
function paw(r,x,y,z,t){const e=r.eye,cf=e?Math.max(0,Math.min(1,(Math.hypot(e[0]-x,e[1]-y,e[2]-z)-2.5)/4.5)):1;if(cf<=0)return;const b=Math.sin(t*2.4)*.06,g=(.5+.3*Math.sin(t*3))*cf;r.put('sphere',x,y+b,z,.17,.13,.04,GOLD,0,12,g);
 for(const[ox,oy]of[[-.12,.13],[0,.18],[.12,.13]])r.put('sphere',x+ox,y+oy+b,z,.07,.07,.03,GOLD,0,12,g);}
API.piece=piece;API.paw=paw;
function draw(r,state,p){const st=API.st;if(!st||!p||Math.abs(p.x-RUIN.x)>70||Math.abs(p.z-RUIN.z)>70)return;const ch=state&&state.chapter,t=performance.now()/1000;
 const close=Math.hypot(p.x-RUIN.x,p.z-RUIN.z)<15,glow=r.meshes&&r.meshes.mineralGlow;
 st.pieces.forEach((pc,i)=>{if(i===st.held)return;const y=r.terrain(pc.x,pc.z,ch);piece(r,pc,pc.x,y,pc.z,pc.yaw,1);
  if(!st.cleared&&logic.inPass(pc.x,pc.z)&&close){if(glow)r.put('mineralGlow',pc.x,y+.04,pc.z,1.25,1,1.25,[1.0,.75,.32],0,22,.28+.12*Math.sin(t*2.6+i));paw(r,pc.x,y+1.15,pc.z,t+i);}});
 if(st.held>=0){const pc=st.pieces[st.held],y=r.terrain(p.x,p.z,ch)+(p.alt||0),fx=-Math.sin(p.yaw||0),fz=-Math.cos(p.yaw||0),bob=Math.sin(t*6)*.025*Math.min(1,p.speed||0);
  piece(r,{t:pc.t},p.x+fx*.3,y+.36+bob,p.z+fz*.3,(p.yaw||0)+.4,.6);}
 if(!st.cleared&&glow){const[zx,zz]=W(9.6,5.2);r.put('mineralGlow',zx,r.terrain(zx,zz,ch)+.03,zz,1.6,1,1.6,[1.0,.72,.3],0,22,.22+.06*Math.sin(t*2));}}
// context button: Взять / Положить
function ctx(){const g=G();if(!g||!g.player||!API.st)return null;if(API.st.held<0&&root.MoonLife1&&root.MoonLife1.ctx&&root.MoonLife1.ctx())return null;const p=g.player;nearIdx=API.st.held>=0||(root.MoonSide&&root.MoonSide.held)?-1:logic.nearest(API.st,p.x,p.z);return API.st.held>=0?txt.put():nearIdx>=0?txt.take():null;}
API.ctx=ctx;
function label(){const b=document.querySelector('#interact span'),btn=document.querySelector('#interact');if(!b)return;const want=ctx();
 if(want){if(b.textContent!==want)b.textContent=want;btn.style.opacity=1;btn.dataset.carry='1';}else if(btn.dataset.carry){delete btn.dataset.carry;}}
function act(e){const btn=e.target&&e.target.closest&&e.target.closest('#interact');if(!btn)return;const g=G();if(!g||!API.st)return;const p=g.player;
 if(API.st.held<0&&(root.MoonSide&&root.MoonSide.held||logic.nearest(API.st,p.x,p.z)<0||root.MoonLife1&&root.MoonLife1.ctx&&root.MoonLife1.ctx()))return;if(false&&logic.nearest(API.st,p.x,p.z)<0)return;e.stopImmediatePropagation();e.preventDefault();
 if(API.st.held<0){if((p.alt||0)>.6)return;const r=logic.pick(API.st,p.x,p.z);if(r.ok)save();if(r.ok&&root.MoonSfx)try{root.MoonSfx('pick');}catch(_){}}
 else{const rd=g.renderer,state=g.state;const r=logic.drop(API.st,p.x,p.z,p.yaw||0,(x,z)=>rd.blocked(x,z,state,0)||!!(root.MoonRuins2&&root.MoonRuins2.blocked(x,z)));
  if(!r.ok){g.toast&&g.toast(txt.noroom());}else{save();if(r.justCleared)g.toast&&g.toast(txt.cleared());else if(!API.st.cleared){const n=API.st.pieces.filter(pc=>logic.inPass(pc.x,pc.z)).length;g.toast&&g.toast(txt.left(n));}}}
 label();}
root.addEventListener('click',act,true);
function loop(){try{const g=G();if(g&&g.player&&API.st){const p=g.player;if(!API.st.cleared&&!hinted&&Math.hypot(p.x-RUIN.x,p.z-RUIN.z)<22){hinted=true;g.toast&&g.toast(txt.hint());}label();const st=g.state;if(API.st.cleared&&!API.st.logRead&&st&&Array.isArray(st.collected)&&st.collected.includes('ruin_rocketWreck')){API.st.logRead=true;save();setTimeout(()=>g.toast&&g.toast(txt.log()),1800);}}}catch(e){}requestAnimationFrame(loop);}
requestAnimationFrame(loop);
setInterval(()=>{if(API.st&&API.st.held>=0)save();},2000);root.addEventListener('pagehide',save);
// game.js ui() asks MoonCarry.ctx() first, so the label is right in the same frame
})(typeof globalThis!=='undefined'?globalThis:this);
