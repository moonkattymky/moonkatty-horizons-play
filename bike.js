/* v60 MOON HOVER-BIKE: a cute hover-bike with a golden paw emblem for the open world.
   - unlocked by the story (Life 1 finished; the server derives it from story progress, so it is retroactive)
   - speed upgrades and paints are bought with Moon Points and validated by the server (/api/bike*, see server/src/index.js);
     this file keeps the last server view, draws the bike under the cat (hover bob, lean into turns, nose up when fast),
     a dust trail (all tiers) and a glow trail (high tier only), the mount button and the bike garage dialog
   - movement and collisions stay the game's own (game.js multiplies the walking speed by MoonBike.mult while riding)
   Load order: after bots.js. */
(function(root){'use strict';
const R=root.MoonRenderer&&root.MoonRenderer.prototype,B=root.MoonOutpostBuilder;
const KEY='moonkatty-bike-v60';
const PAINT={gold:[1,.74,.28],mint:[.45,.92,.74],berry:[.96,.40,.64],sky:[.44,.72,1],cocoa:[.66,.45,.32],galaxy:[.50,.36,.92]};
const ORDER=['gold','mint','berry','sky','cocoa','galaxy'];
const Bike=root.MoonBike={view:null,at:0,riding:false,PAINT,ORDER,
 get unlocked(){if(this.view)return!!this.view.unlocked;const s=root.MoonGame&&root.MoonGame.state;return!!(s&&(s.chapter>1||s.complete));},
 get mult(){return this.view&&this.view.mult||1.7;},
 get color(){return this.view&&PAINT[this.view.color]?this.view.color:'gold';}};
try{const c=JSON.parse(localStorage.getItem(KEY)||'null');if(c){Bike.view=c.view||null;Bike.riding=!!c.riding;}}catch{}
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify({view:Bike.view,riding:Bike.riding}));}catch{}};
// ---------- 3D ----------
if(R&&B){
 // v61: glossy sculpted body (kind 21 clear-coat), chrome (16), clear canopy (13), neon lines + rings (12, paint-matched)
 const MATS={paint:21,cream:21,seat:21,dark:21,chrome:16,gold:16,glass:21,neon:12,lamp:12,flame:12,ring:12};
 const COL={cream:[1,.95,.88],seat:[.30,.20,.26],dark:[.10,.11,.16],chrome:[.80,.84,.90],gold:[1,.80,.36],glass:[.16,.22,.32],lamp:[1,.94,.70],flame:[.45,.95,1]};
 function ball(b,mat,x,y,z,r,sy=1){const prof=[];for(let i=0;i<=10;i++){const a=-Math.PI/2+i/10*Math.PI;prof.push([Math.max(.001,Math.cos(a)),(Math.sin(a)+1)/2]);}const k=new B();k.shell(mat,prof,r,r*2*sy);for(const[m,d]of k.groups){const g=b.groups.get(m)||[];for(let i=0;i<d.length;i+=6)g.push(d[i]+x,d[i+1]-.15+y-r*sy,d[i+2]+z,d[i+3],d[i+4],d[i+5]);b.groups.set(m,g);}}
 // a lathe laid along -z: profile [radius fraction, 0 at the tail .. 1 at the nose], squashed to an oval cross-section
 function lathe(b,mat,prof,r,len,zb,cy,wx=1,hy=1,cx=0){const k=new B();k.shell(mat,prof,r,len);for(const[m,d]of k.groups){const g=b.groups.get(m)||[];for(let i=0;i<d.length;i+=6){const x=d[i],u=d[i+1]-.15,z=d[i+2];let nx=d[i+3]/wx,ny=d[i+5]/hy,nz=-d[i+4];const l=Math.hypot(nx,ny,nz)||1;g.push(cx+x*wx,cy+z*hy,zb-u,nx/l,ny/l,nz/l);}b.groups.set(m,g);}}
 const BODY=[[.001,0],[.42,.015],[.70,.07],[.88,.18],[.98,.34],[1,.48],[.96,.62],[.84,.76],[.62,.88],[.36,.96],[.001,1]];
 const LEN=2.2,ZB=1.08,CY=.56,R0=.36,WX=1.0,HY=.74;
 const radAt=f=>{for(let i=0;i<BODY.length-1;i++){const[a,y0]=BODY[i],[c,y1]=BODY[i+1];if(f<=y1){const q=(f-y0)/Math.max(1e-6,y1-y0);return a+(c-a)*q;}}return 0;};
 // something flat in local xy (a paw, a disc) turned to face the side (+x or -x)
 function side(b,side,y,z,fn){const k=new B();fn(k);for(const[m,d]of k.groups){const g=b.groups.get(m)||[];for(let i=0;i<d.length;i+=6){const px=d[i],pz=d[i+2],nx=d[i+3],nz=d[i+5];g.push(side*pz,d[i+1]+y,-px*side+z,side*nz,d[i+4],-nx*side);}b.groups.set(m,g);}}
 function bBike(b){
  lathe(b,'paint',BODY,R0,LEN,ZB,CY,WX,HY);
  // cream belly skirt and dark chin
  lathe(b,'cream',[[.001,0],[.6,.04],[.92,.2],[1,.5],[.9,.78],[.5,.95],[.001,1]],R0*1.02,LEN*.86,ZB-.12,CY-.09,1.04,.5);
  lathe(b,'dark',[[.001,0],[.8,.1],[1,.5],[.8,.9],[.001,1]],R0*.7,LEN*.6,ZB-.35,CY-.22,1.0,.32);
  // neon accent lines along both flanks (follow the hull)
  for(const sx of[-1,1]){let prev=null;for(let i=0;i<=14;i++){const f=.08+i/14*.84,q=[sx*(radAt(f)*R0*WX+.012),CY+.03,ZB-f*LEN];if(prev)b.tube('neon',prev,q,.017,6);prev=q;}
   prev=null;for(let i=0;i<=10;i++){const f=.2+i/10*.62,q=[sx*(radAt(f)*R0*1.02*1.04+.01),CY-.09,ZB-.12-f*LEN*.86];if(prev)b.tube('neon',prev,q,.012,6);prev=q;}}
  // paw badges: dark disc, cream rim, gold paw — readable on every paint
  for(const sx of[-1,1])side(b,sx,CY+.05,.12,k=>{const x0=R0*WX+.004;k.tube('cream',[0,0,x0-.01],[0,0,x0+.012],.165,28);k.tube('dark',[0,0,x0+.012],[0,0,x0+.022],.14,28);k.paw(0,-.005,x0+.024,.22,'gold');});
  // seat (rounded cushion) + tail cowl
  lathe(b,'seat',[[.001,0],[.7,.08],[.95,.3],[1,.6],[.85,.88],[.001,1]],.19,.78,.74,CY+.25,1.05,.42);
  lathe(b,'paint',[[.001,0],[.5,.1],[.9,.4],[1,.75],[.001,1]],.16,.4,1.02,CY+.22,1.1,.6);
  // canopy: chrome rim + clear bubble screen
  b.tube('chrome',[0,CY+.17,-.84],[0,CY+.195,-.84],.14,24,.14);
  {const k=new B();ball(k,'glass',0,0,0,.16,1);for(const[m,d]of k.groups){const g=b.groups.get(m)||[];for(let i=0;i<d.length;i+=6){if(d[i+1]<-.02)continue;g.push(d[i]*.9,CY+.18+d[i+1]*.85,-.86+d[i+2]*1.15-d[i+1]*.6,d[i+3],d[i+4],d[i+5]);}b.groups.set(m,g);}}
  // chrome handlebar with grips
  /* v63: wide grips where the drawn paws are (x ±.52, seat +.32, forward .5) */b.tube('chrome',[0,CY+.18,-.62],[0,CY+.52,-.52],.032,10);b.tube('chrome',[-.44,CY+.52,-.5],[.44,CY+.52,-.5],.028,10);for(const sx of[-1,1]){b.tube('chrome',[sx*.08,CY+.52,-.52],[sx*.44,CY+.52,-.5],.028,10);b.tube('seat',[sx*.42,CY+.52,-.5],[sx*.58,CY+.52,-.5],.045,10,.047);}
  // headlight + nose cap
  ball(b,'lamp',0,CY+.02,-1.08,.075,.8);b.tube('chrome',[0,CY+.02,-1.05],[0,CY+.02,-1.0],.1,16,.1);
  // swept side fins
  for(const sx of[-1,1]){b.tube('paint',[sx*.24,CY+.06,.62],[sx*.58,CY+.02,.95],.075,10,.02);b.tube('neon',[sx*.56,CY+.02,.93],[sx*.6,CY+.02,.98],.025,6,.02);}
  b.tube('paint',[0,CY+.22,.78],[0,CY+.5,1.0],.07,10,.02);
  // twin thruster nozzles (chrome bells, dark throats)
  for(const sx of[-1,1]){const x=sx*.17,y=CY-.02;b.tube('chrome',[x,y,.82],[x,y,1.16],.09,18,.125);b.tube('dark',[x,y,1.155],[x,y,1.165],.115,18,.115);b.tube('chrome',[x,y,.9],[x,y,.93],.105,18,.105);}
  // hover pads (dark housings)
  for(const z of[.5,-.5]){b.tube('dark',[0,CY-.3,z],[0,CY-.22,z],.3,28,.24);b.tube('chrome',[0,CY-.31,z],[0,CY-.3,z],.31,28,.31);}}
 function bGlow(b){for(const sx of[-1,1])b.tube('flame',[sx*.17,CY-.02,1.15],[sx*.17,CY-.02,1.17],.1,18,.1);}
 function bRings(b){for(const z of[.5,-.5]){b.tube('ring',[0,CY-.335,z],[0,CY-.315,z],.27,28,.27);b.tube('ring',[0,CY-.34,z],[0,CY-.33,z],.15,24,.15);}}
 let mesh=null;
 R.v60Build=function(){if(mesh)return mesh;mesh=[];for(const[part,fn]of[['body',bBike],['glow',bGlow],['rings',bRings]]){const b=new B();fn(b);for(const[m,d]of b.groups){if(!d.length)continue;const key='v61_bike_'+part+'_'+m;this.addMesh(key,d);mesh.push([key,m,part]);}}return mesh;};
 const NEON={gold:[.35,1,.9],mint:[.45,1,.78],berry:[1,.42,.74],sky:[.38,.9,.96],cocoa:[1,.66,.3],galaxy:[.76,.5,1]},neonOf=k=>NEON[k]||NEON.gold;
 const SC=1.45,S={yaw:null,roll:0,pitch:0,trail:[],lastX:null,lastZ:null};
 Bike.on=function(p){return Bike.riding&&Bike.unlocked&&p&&p.alt<.15;};
 const oldScene=R.scene,oldRender=R.render,oldCat=R.cat;
 R.scene=function(state,p,t,...a){if(!Bike.on(p)){S.yaw=null;S.pose=null;Bike.seat=null;return oldScene.call(this,state,p,t,...a);}
  this._v60ride={p,t};try{return oldScene.call(this,state,p,t,...a);}finally{this._v60ride=null;}};
 // the cat sits on the bike: draw the bike, then the cat higher and not walking
 R.cat=function(x,z,yaw,t,walking,alt,ch,col,isPlayer,...rest){const r=this._v60ride;if(!isPlayer||!r)return oldCat.call(this,x,z,yaw,t,walking,alt,ch,col,isPlayer,...rest);
  const p=r.p,dt=Math.min(.05,Math.max(0,t-(S.t||t)));S.t=t;
  if(S.yaw==null)S.yaw=yaw;let dy=Math.atan2(Math.sin(yaw-S.yaw),Math.cos(yaw-S.yaw));const turn=dt>0?dy/dt:0;S.yaw=yaw;
  S.roll+=(Math.max(-.32,Math.min(.32,-turn*.09*(.3+p.speed)))-S.roll)*Math.min(1,dt*6);S.pitch+=((p.speed>.2?.07:0)-S.pitch)*Math.min(1,dt*4);
  const hov=.32+Math.sin(t*3.1)*.05+(p.speed>.2?Math.sin(t*11)*.012:0),y=this.terrain(x,z,ch)+alt+hov,m=this.v60Build(),pc=PAINT[Bike.color];
  const nc=neonOf(Bike.color),thr=.75+.25*Math.sin(t*23)*Math.sin(t*7.3)+(p.speed>.2?.25:0),pulse=.6+.4*Math.sin(t*4.2);
  for(const[key,mat,part]of m){const kind=MATS[mat],c=mat==='paint'?pc:mat==='neon'||mat==='ring'||mat==='flame'?nc:COL[mat],g=part==='glow'?thr:part==='rings'?pulse:mat==='neon'?.85:mat==='lamp'?.9:mat==='gold'?.2:mat==='glass'?.0:0;this.put(key,x,y,z,SC,SC,SC,c,yaw,kind,g,S.pitch,S.roll);}
  S.pose={x,y,z,yaw,t,speed:p.speed};Bike.seat={y:y+(CY+.2)*SC,cut:.30};
  if(p.speed>.25){const last=S.trail[S.trail.length-1];if(!last||Math.hypot(last.x-x,last.z-z)>.35)S.trail.push({x:x+Math.sin(yaw)*1.15,z:z+Math.cos(yaw)*1.15,y:y-.1,t});}
  const sp=this.characterSprite;if(sp&&sp.ride&&sp.ride.ready)return;return oldCat.call(this,x,z,yaw,t,false,alt+hov+.62,ch,col,isPlayer,...rest);};
 R.render=function(state,p,t,dt,yaw,pitch,scan){const ride=Bike.on(p);S.camK=(S.camK||0)+((ride?1:0)-(S.camK||0))*Math.min(1,(dt||0)*3);
  if(S.camK>.001&&!root.__mkNoBikeCam){yaw+=.55*S.camK;pitch+=.5*S.camK;}
  oldRender.call(this,state,p,t,dt,yaw,pitch,scan);
  S.trail=S.trail.filter(q=>t-q.t<(this.quality==='low'?.7:1.2)&&t>=q.t);const P0=S.pose&&Bike.on(p)?S.pose:null;if((!S.trail.length&&!P0)||!this.vp||!this.gl||!this.v50Prog||this._v60Off)return;
  try{const P5=this.v50Prog();if(!P5)return;const gl=this.gl,glow=this.quality==='high',Q=[],V=this.vp,rl=Math.hypot(V[0],V[8])||1,rx=V[0]/rl,rz=V[8]/rl,life=this.quality==='low'?.7:1.2;
   const bill=(x,y,z,sx,sy,k,c,w)=>{for(const[u,q]of[[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]])Q.push(x+rx*u*sx,y+q*sy,z+rz*u*sx,u,q,k,0,c[0],c[1],c[2],w);};
   const pc=PAINT[Bike.color];
   for(const q of S.trail){const f=(t-q.t)/life,g=this.terrain(q.x,q.z,(state&&state.chapter)||1);
    bill(q.x,g+.25+f*.5,q.z,.35+f*.7,.3+f*.5,0,[.86,.80,.92],.30*(1-f));
    if(glow){bill(q.x,q.y,q.z,.32*(1-f)+.08,.12,0,[.3,.95,1],.55*(1-f));bill(q.x,q.y+.1,q.z,.2,.2,2,[pc[0]*.6+.4,pc[1]*.6+.4,pc[2]*.6+.4],.35*(1-f));}}
   if(P0){const low=this.quality==='low',nc=neonOf(Bike.color),sy=Math.sin(P0.yaw),cy=Math.cos(P0.yaw),L=(lx,ly,lz)=>[P0.x+(lx*cy+lz*sy)*SC,P0.y+ly*SC,P0.z+(-lx*sy+lz*cy)*SC],gy=this.terrain(P0.x,P0.z,(state&&state.chapter)||1),fl=.8+.2*Math.sin(t*31)+.15*Math.sin(t*13),run=P0.speed>.2?1:.45;
    // underglow on the ground (paint-matched), pulsing
    {const N=low?1:3,rad=1.25,pu=.75+.25*Math.sin(t*4.2);for(let j=0;j<N;j++)for(let i=0;i<N;i++){const q=[[i,j],[i+1,j],[i+1,j+1],[i,j+1]].map(([a,b])=>{const u=a/N*2-1,v=b/N*2-1,w=L(u*.7,0,v*1.1);return[w[0],gy+.06,w[2],u,v];});for(const n of[0,1,2,0,2,3])Q.push(...q[n],4,0,nc[0],nc[1],nc[2],.55*pu);}}
    // twin thruster flames + glow, exhaust shimmer (not on low tier)
    for(const sx of[-1,1]){const a=L(sx*.17,CY-.02,1.2);bill(a[0],a[1],a[2],.22,.22,0,nc,.9);
     if(!low){for(let k=1;k<=3;k++){const f=L(sx*.17,CY-.02,1.2+k*.14*fl*run);bill(f[0],f[1],f[2],(.16-.03*k)*fl,(.13-.025*k)*fl,0,k===1?[1,1,.95]:nc,(.8-.2*k)*run);}
      for(let k=0;k<2;k++){const ph=(t*1.7+k*.5+(sx>0?.25:0))%1,f=L(sx*.17,CY+.02+ph*.25,1.5+ph*.7);bill(f[0],f[1],f[2],.14+ph*.25,.12+ph*.2,2,[.9,.95,1],.12*(1-ph)*run);}}}
    // hover pad halos
    if(!low)for(const z of[.5,-.5]){const a=L(0,CY-.36,z);bill(a[0],a[1],a[2],.42,.1,0,nc,.35+.2*Math.sin(t*4.2+z));}}
   if(!Q.length)return;const data=new Float32Array(Q);
   gl.useProgram(P5.p);gl.uniformMatrix4fv(P5.vp,false,this.vp);gl.uniform1f(P5.time,t);gl.bindBuffer(gl.ARRAY_BUFFER,P5.buf);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);
   gl.enable(gl.DEPTH_TEST);gl.depthMask(false);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
   gl.enableVertexAttribArray(P5.pos);gl.vertexAttribPointer(P5.pos,3,gl.FLOAT,false,44,0);gl.enableVertexAttribArray(P5.info);gl.vertexAttribPointer(P5.info,4,gl.FLOAT,false,44,12);gl.enableVertexAttribArray(P5.tone);gl.vertexAttribPointer(P5.tone,4,gl.FLOAT,false,44,28);
   gl.drawArrays(gl.TRIANGLES,0,data.length/11);gl.disableVertexAttribArray(P5.pos);gl.disableVertexAttribArray(P5.info);gl.disableVertexAttribArray(P5.tone);
   gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(true);gl.disable(gl.BLEND);this.v60Stats={trail:S.trail.length,glow};}catch(e){this._v60Off=true;if(typeof console!=='undefined')console.warn('v60 trail off',e);}};
}
// ---------- UI: mount button + garage dialog ----------
const Game=root.MoonGame,UI=root.MoonGrowthUI;if(!Game||!UI||typeof document==='undefined')return;
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]),T=(k,p)=>root._t?_t(k,p):k;
const toast=t=>t&&Game.toast&&Game.toast(t);let busy=false;
function setView(v){if(!v)return;const was=Bike.view&&Bike.view.unlocked;Bike.view=v;if(!v.unlocked)Bike.riding=false;persist();btn();if(v.unlocked&&was===false)toast(T('bike.unlocked'));}
function apply(r){const G=root.MoonGrowth;if(r.moon&&G&&G.setMoon&&G.setMoon(Game.state,r.moon)){Game.save();Game.hud&&Game.hud();UI.updateMoon&&UI.updateMoon();}}
async function load(){if(!UI.online)return;try{const r=await UI.api('/api/bike',{});setView(r.bike);apply(r);}catch{}if(dlg().open)render();}
function setRide(on){if(on&&!Bike.unlocked){toast(T('bike.locked'));return;}const p=Game.player;if(on&&p&&p.alt>.15){toast(T('bike.land_first'));return;}Bike.riding=!!on;persist();btn();toast(T(on?'bike.on_toast':'bike.off_toast'));try{root.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');}catch{}}
Bike.setRide=setRide;Bike.load=load;
function btn(){let b=$('#bike-ride');if(!b){const host=document.querySelector('.controls')||document.body;b=document.createElement('button');b.type='button';b.id='bike-ride';b.className='bike-ride';b.onclick=()=>setRide(!Bike.riding);host.append(b);}
 b.hidden=!Bike.unlocked;b.classList.toggle('on',Bike.riding);b.setAttribute('aria-pressed',Bike.riding?'true':'false');b.innerHTML=`<span class="bike-ico" aria-hidden="true">🛵</span><span class="bike-lbl">${esc(T(Bike.riding?'bike.dismount':'bike.mount'))}</span>`;}
function dlg(){let d=document.getElementById('bike-dialog');if(d)return d;d=document.createElement('dialog');d.id='bike-dialog';d.className='growth-dialog ret-dialog bike-dialog';(document.getElementById('app-viewport')||document.body).append(d);d.addEventListener('click',e=>{if(e.target===d)d.close();});return d;}
function show(d){d.querySelectorAll('[data-gclose]').forEach(b=>b.onclick=()=>d.close());if(!d.open){document.querySelectorAll('dialog[open]').forEach(x=>{if(x!==d)x.close();});Game.resetControls?.();d.showModal();}}
const hex=c=>'#'+c.map(v=>Math.round(v*255).toString(16).padStart(2,'0')).join('');
function render(){const d=dlg(),v=Bike.view,un=Bike.unlocked,pts=(Game.state&&Game.state.growth&&Game.state.growth.moon&&Game.state.growth.moon.points)|0;
 let h=`<div class="g-head"><div><span class="eyebrow">${esc(T('bike.eyebrow'))}</span><h2>${esc(T('bike.title'))}</h2></div><button class="close-icon" data-gclose aria-label="×">×</button></div>`;
 h+=`<div class="bike-hero" style="--paint:${hex(PAINT[Bike.color])}"><div class="bike-art"><i class="b-body"></i><i class="b-seat"></i><i class="b-paw">🐾</i><i class="b-pad a"></i><i class="b-pad b"></i></div><p>${esc(T('bike.sub'))}</p></div>`;
 if(!un){h+=`<p class="bike-lock">🔒 ${esc(T('bike.locked'))}</p>`;d.innerHTML=h;show(d);return;}
 h+=`<button class="primary bike-toggle" data-ride>${esc(T(Bike.riding?'bike.dismount':'bike.mount'))}</button>`;
 if(!v){h+=`<p class="bike-note">${esc(T('bike.offline'))}</p>`;d.innerHTML=h;show(d);d.querySelector('[data-ride]').onclick=()=>{setRide(!Bike.riding);render();};return;}
 const lv=v.speed|0,mx=v.maxSpeed|0;h+=`<section class="bike-sec"><div class="bike-row"><b>⚡ ${esc(T('bike.speed',{n:lv,m:mx}))}</b><span>${esc(T('bike.mult',{x:v.mult}))}</span></div><div class="bike-bar">${Array.from({length:mx},(_,i)=>`<i class="${i<lv?'on':''}"></i>`).join('')}</div>`;
 h+=v.nextPrice!=null?`<button data-buy="speed" ${pts<v.nextPrice?'class="dim"':''}>${esc(T('bike.upgrade',{p:v.nextPrice}))}</button>`:`<p class="bike-note">${esc(T('bike.max'))}</p>`;h+=`</section>`;
 h+=`<section class="bike-sec"><b>🎨 ${esc(T('bike.paints'))}</b><div class="bike-paints">`;
 for(const k of ORDER){const own=(v.colors||[]).includes(k),cur=v.color===k,pr=(v.prices||{})[k]|0;
  h+=`<button class="bike-paint${cur?' cur':''}" data-paint="${k}" data-own="${own?1:0}"><i style="background:${hex(PAINT[k])}"></i><span>${esc(T('bike.c_'+k))}</span><small>${cur?'✓ '+esc(T('bike.on')):own?esc(T('bike.use')):esc(T('bike.buy',{p:pr}))}</small></button>`;}
 h+=`</div></section><p class="bike-note">${esc(T('bike.points',{n:pts}))}</p>`;
 d.innerHTML=h;show(d);
 d.querySelector('[data-ride]').onclick=()=>{setRide(!Bike.riding);render();if(Bike.riding)d.close();};
 d.querySelector('[data-buy]')?.addEventListener('click',()=>act('/api/bike/buy',{item:'speed'}));
 d.querySelectorAll('[data-paint]').forEach(b=>b.onclick=()=>{const k=b.dataset.paint;if(v.color===k)return;act(b.dataset.own==='1'?'/api/bike/paint':'/api/bike/buy',b.dataset.own==='1'?{color:k}:{item:'color:'+k});});}
async function act(path,body){if(busy)return;busy=true;try{const r=await UI.api(path,body);setView(r.bike);apply(r);if(r.bought)toast(T('bike.bought'));}catch(e){const c=e&&(e.code||e.message);toast(T(c==='not_enough_points'?'bike.need_points':'bike.error'));}finally{busy=false;}render();}
function mount(){const dock=$('#growth-dock');if(!dock)return false;if(dock.querySelector('[data-bike]'))return true;const b=document.createElement('button');b.type='button';b.className='gd ret-gd bike-gd';b.dataset.bike='1';
 b.innerHTML=`<span class="gn-icon" aria-hidden="true">🛵</span><span class="gn-label">${esc(T('bike.dock'))}</span>`;b.onclick=()=>{render();load();};dock.append(b);return true;}
document.addEventListener('moonkatty:lang',()=>{const l=$('#growth-dock [data-bike] .gn-label');if(l)l.textContent=T('bike.dock');btn();if(dlg().open)render();});
let tries=0;const iv=setInterval(()=>{const ok=mount();btn();if(ok||++tries>60)clearInterval(iv);},250);
setTimeout(load,1200);setInterval(()=>{if(!Bike.view||!Bike.view.unlocked)load();},120000);
Bike.render=render;
})(typeof window!=='undefined'?window:globalThis);
