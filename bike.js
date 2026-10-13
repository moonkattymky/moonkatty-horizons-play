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
 const MATS={paint:17,cream:17,seat:17,steel:17,dark:0,gold:16,teal:12,lamp:12,glass:12};
 const COL={cream:[1,.95,.86],seat:[.36,.24,.30],steel:[.72,.78,.86],dark:[.10,.11,.15],gold:[1,.78,.32],teal:[.22,.95,.86],lamp:[1,.92,.62],glass:[.40,.85,.95]};
 function ball(b,mat,x,y,z,r,sy=1){const prof=[];for(let i=0;i<=8;i++){const a=-Math.PI/2+i/8*Math.PI;prof.push([Math.max(.001,Math.cos(a)),(Math.sin(a)+1)/2]);}const k=new B();k.shell(mat,prof,r,r*2*sy);for(const[m,d]of k.groups){const g=b.groups.get(m)||[];for(let i=0;i<d.length;i+=6)g.push(d[i]+x,d[i+1]+y-r*sy,d[i+2]+z,d[i+3],d[i+4],d[i+5]);b.groups.set(m,g);}}
 function sidePaw(b,side,y,z,s){const k=new B();k.paw(0,0,0,s,'gold');for(const[m,d]of k.groups){const g=b.groups.get(m)||[];for(let i=0;i<d.length;i+=6){const px=d[i],pz=d[i+2],nx=d[i+3],nz=d[i+5];g.push(side*(pz+.01)+side*.36,d[i+1]+y,-px*side+z,side*nz,d[i+4],-nx*side);}b.groups.set(m,g);}}
 function bBike(b){
  // body: a rounded capsule, nose fairing in front (-z), tail fin behind
  b.tube('paint',[0,.52,.72],[0,.52,-.55],.30,16,.26);ball(b,'paint',0,.52,-.55,.26);ball(b,'paint',0,.52,.72,.30,.9);
  b.tube('cream',[0,.40,.62],[0,.40,-.48],.31,16,.27);
  b.box('gold',0,.52,.1,.66,.05,.9);sidePaw(b,1,.56,.1,.42);sidePaw(b,-1,.56,.1,.42);
  b.paw(0,.6,-.82,.34,'gold');ball(b,'lamp',0,.48,-.8,.09);
  b.box('seat',0,.84,.28,.40,.10,.62);b.box('cream',0,.80,.62,.42,.06,.14);
  b.tube('steel',[0,.72,-.42],[0,1.02,-.6],.04,6);b.tube('steel',[-.36,1.02,-.6],[.36,1.02,-.6],.035,6);ball(b,'seat',-.38,1.02,-.6,.06);ball(b,'seat',.38,1.02,-.6,.06);
  b.tube('glass',[0,.78,-.62],[0,1.02,-.74],.18,10,.12);
  b.box('paint',0,.82,.98,.06,.34,.26);ball(b,'teal',0,1.0,1.06,.06);
  for(const s of[-1,1])b.tube('steel',[s*.32,.5,.86],[s*.42,.5,1.02],.08,8,.06);
  // hover pads (glowing rings underneath)
  for(const z of[.5,-.42]){b.tube('dark',[0,.16,z],[0,.26,z],.34,18,.30);b.tube('teal',[0,.12,z],[0,.16,z],.27,18,.25);}}
 let mesh=null;
 R.v60Build=function(){if(mesh)return mesh;const b=new B();bBike(b);mesh=[];const map=new Map();for(const[m,d]of b.groups){if(!map.has(m))map.set(m,[]);const g=map.get(m);for(let i=0;i<d.length;i++)g.push(d[i]);}
  for(const[m,d]of map){if(!d.length)continue;const key='v60_bike_'+m;this.addMesh(key,d);mesh.push([key,m]);}return mesh;};
 const SC=1.25,S={yaw:null,roll:0,pitch:0,trail:[],lastX:null,lastZ:null};
 Bike.on=function(p){return Bike.riding&&Bike.unlocked&&p&&p.alt<.15;};
 const oldScene=R.scene,oldRender=R.render,oldCat=R.cat;
 R.scene=function(state,p,t,...a){if(!Bike.on(p)){S.yaw=null;return oldScene.call(this,state,p,t,...a);}
  this._v60ride={p,t};try{return oldScene.call(this,state,p,t,...a);}finally{this._v60ride=null;}};
 // the cat sits on the bike: draw the bike, then the cat higher and not walking
 R.cat=function(x,z,yaw,t,walking,alt,ch,col,isPlayer,...rest){const r=this._v60ride;if(!isPlayer||!r)return oldCat.call(this,x,z,yaw,t,walking,alt,ch,col,isPlayer,...rest);
  const p=r.p,dt=Math.min(.05,Math.max(0,t-(S.t||t)));S.t=t;
  if(S.yaw==null)S.yaw=yaw;let dy=Math.atan2(Math.sin(yaw-S.yaw),Math.cos(yaw-S.yaw));const turn=dt>0?dy/dt:0;S.yaw=yaw;
  S.roll+=(Math.max(-.32,Math.min(.32,-turn*.09*(.3+p.speed)))-S.roll)*Math.min(1,dt*6);S.pitch+=((p.speed>.2?.07:0)-S.pitch)*Math.min(1,dt*4);
  const hov=.32+Math.sin(t*3.1)*.05+(p.speed>.2?Math.sin(t*11)*.012:0),y=this.terrain(x,z,ch)+alt+hov,m=this.v60Build(),pc=PAINT[Bike.color];
  for(const[key,mat]of m){const kind=MATS[mat],c=mat==='paint'?pc:COL[mat],g=kind===12?(mat==='glass'?.25:.75+.2*Math.sin(t*4)):mat==='gold'?.18:0;this.put(key,x,y,z,SC,SC,SC,c,yaw,kind,g,S.pitch,S.roll);}
  if(p.speed>.25){const last=S.trail[S.trail.length-1];if(!last||Math.hypot(last.x-x,last.z-z)>.35)S.trail.push({x:x+Math.sin(yaw)*1.15,z:z+Math.cos(yaw)*1.15,y:y-.1,t});}
  return oldCat.call(this,x,z,yaw,t,false,alt+hov+.62,ch,col,isPlayer,...rest);};
 R.render=function(state,p,t,dt,yaw,pitch,scan){oldRender.call(this,state,p,t,dt,yaw,pitch,scan);
  S.trail=S.trail.filter(q=>t-q.t<(this.quality==='low'?.7:1.2)&&t>=q.t);if(!S.trail.length||!this.vp||!this.gl||!this.v50Prog||this._v60Off)return;
  try{const P5=this.v50Prog();if(!P5)return;const gl=this.gl,glow=this.quality==='high',Q=[],V=this.vp,rl=Math.hypot(V[0],V[8])||1,rx=V[0]/rl,rz=V[8]/rl,life=this.quality==='low'?.7:1.2;
   const bill=(x,y,z,sx,sy,k,c,w)=>{for(const[u,q]of[[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]])Q.push(x+rx*u*sx,y+q*sy,z+rz*u*sx,u,q,k,0,c[0],c[1],c[2],w);};
   const pc=PAINT[Bike.color];
   for(const q of S.trail){const f=(t-q.t)/life,g=this.terrain(q.x,q.z,(state&&state.chapter)||1);
    bill(q.x,g+.25+f*.5,q.z,.35+f*.7,.3+f*.5,0,[.86,.80,.92],.30*(1-f));
    if(glow){bill(q.x,q.y,q.z,.32*(1-f)+.08,.12,0,[.3,.95,1],.55*(1-f));bill(q.x,q.y+.1,q.z,.2,.2,2,[pc[0]*.6+.4,pc[1]*.6+.4,pc[2]*.6+.4],.35*(1-f));}}
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
