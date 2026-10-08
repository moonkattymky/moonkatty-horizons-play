/* v34 cinematic cutscenes «motion comic»: full-screen illustrations with a slow camera, parallax stars/dust,
   pulsing glows, Russian subtitles with a typewriter fade, tap to advance, «Пропустить», optional WebAudio ambience.
   Loaded after game.js / growth.js. Scene scripts and camera maths: cinema-core.js. Saves: state.cinema.seen. */
(function(){'use strict';
const Game=window.MoonGame,C=window.MoonCinemaCore;if(!Game||!C||!document.body)return;
const $=s=>document.querySelector(s),S=()=>Game.state,tg=()=>window.Telegram&&window.Telegram.WebApp;
const reduce=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
const PREF='moonkatty-cinema-sound';
const seen=id=>!!(S().cinema&&S().cinema.seen.includes(id));
function mark(ids){const s=S();if(!s.cinema)s.cinema={seen:[]};let changed=false;for(const id of ids)if(!s.cinema.seen.includes(id)){s.cinema.seen.push(id);changed=true;}if(changed)Game.save();}
const COLORS={blue:'79,182,255',amber:'255,184,82',gold:'255,214,128',earth:'130,196,255',violet:'170,120,255'};

// ---------- sound: soft generated ambience (no audio files); off when muted in the menu or the app is hidden ----------
const Sound={ctx:null,master:null,nodes:[],timer:0,mood:'',
 get on(){try{return localStorage.getItem(PREF)!=='0';}catch{return true;}},
 set on(v){try{localStorage.setItem(PREF,v?'1':'0');}catch{}if(!v)this.stop(true);},
 ensure(){if(!this.on)return null;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
  if(!this.ctx){try{this.ctx=new AC();}catch{return null;}this.master=this.ctx.createGain();this.master.gain.value=0;this.master.connect(this.ctx.destination);}
  if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});return this.ctx;},
 get live(){return!!(this.ctx&&this.ctx.state==='running'&&this.on);},
 noise(sec=2){const c=this.ctx,b=c.createBuffer(1,c.sampleRate*sec,c.sampleRate),d=b.getChannelData(0);let last=0;for(let i=0;i<d.length;i++){last=(last+.02*(Math.random()*2-1))/1.02;d[i]=last*3.5;}return b;},
 start(){const c=this.ensure();if(!c||this.nodes.length)return;const t=c.currentTime,out=c.createBiquadFilter();out.type='lowpass';out.frequency.value=520;out.connect(this.master);
  for(const[f,type,g]of[[55,'sine',.16],[82.6,'sine',.09],[110.3,'triangle',.035]]){const o=c.createOscillator(),gn=c.createGain();o.type=type;o.frequency.value=f;gn.gain.value=g;o.connect(gn).connect(out);o.start(t);this.nodes.push(o);}
  const lfo=c.createOscillator(),lg=c.createGain();lfo.frequency.value=.07;lg.gain.value=160;lfo.connect(lg).connect(out.frequency);lfo.start(t);this.nodes.push(lfo);
  const n=c.createBufferSource();n.buffer=this.noise();n.loop=true;const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=650;bp.Q.value=.6;const ng=c.createGain();ng.gain.value=.05;n.connect(bp).connect(ng).connect(this.master);n.start(t);this.nodes.push(n);
  this.filter=out;this.master.gain.cancelScheduledValues(t);this.master.gain.setValueAtTime(this.master.gain.value,t);this.master.gain.linearRampToValueAtTime(.55,t+2.2);
  const shimmer=()=>{if(!this.live)return;const tt=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain(),f=[880,987.8,1174.7,1318.5,1480][Math.floor(Math.random()*5)];o.type='sine';o.frequency.value=f*(this.mood==='mystery'?.75:1);g.gain.setValueAtTime(0,tt);g.gain.linearRampToValueAtTime(.018,tt+1.2);g.gain.exponentialRampToValueAtTime(.0001,tt+4);o.connect(g).connect(this.master);o.start(tt);o.stop(tt+4.1);};
  this.timer=setInterval(shimmer,2600);},
 setMood(m){this.mood=m;if(!this.live||!this.filter)return;const t=this.ctx.currentTime,f={danger:900,alarm:420,title:760,hope:640,mystery:380}[m]||520;this.filter.frequency.setTargetAtTime(f,t,.8);
  if(m==='alarm')this.beeps(3);if(m==='title')this.swell();},
 tone(f,dur,gain,type='sine',at=0){if(!this.live)return;const c=this.ctx,t=c.currentTime+at,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(this.master);o.start(t);o.stop(t+dur+.05);return o;},
 beeps(n){for(let i=0;i<n;i++){this.tone(660,.32,.035,'sine',i*1.1);this.tone(523,.32,.03,'sine',i*1.1+.38);}},
 swell(){[220,277.2,329.6,440].forEach((f,i)=>this.tone(f,3.2,.03,'triangle',i*.12));},
 whoosh(){if(!this.live)return;const c=this.ctx,t=c.currentTime,n=c.createBufferSource(),bp=c.createBiquadFilter(),g=c.createGain();n.buffer=this.noise(1.2);bp.type='bandpass';bp.Q.value=1.4;bp.frequency.setValueAtTime(300,t);bp.frequency.exponentialRampToValueAtTime(2400,t+.9);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.12,t+.35);g.gain.exponentialRampToValueAtTime(.0001,t+1.1);n.connect(bp).connect(g).connect(this.master);n.start(t);n.stop(t+1.2);},
 boom(){if(!this.live)return;const c=this.ctx,t=c.currentTime,n=c.createBufferSource(),lp=c.createBiquadFilter(),g=c.createGain();n.buffer=this.noise(2);lp.type='lowpass';lp.frequency.setValueAtTime(1600,t);lp.frequency.exponentialRampToValueAtTime(120,t+1.6);g.gain.setValueAtTime(.9,t);g.gain.exponentialRampToValueAtTime(.0001,t+1.9);n.connect(lp).connect(g).connect(this.master);n.start(t);n.stop(t+2);
  const o=this.tone(62,1.4,.5,'sine');if(o)o.frequency.exponentialRampToValueAtTime(28,t+1.3);},
 chime(){[1318.5,1975.5,2637,3951].forEach((f,i)=>this.tone(f,1.8-i*.25,.06-i*.01,'sine',i*.07));},
 stop(now=false){clearInterval(this.timer);this.timer=0;if(!this.ctx)return;const t=this.ctx.currentTime,nodes=this.nodes;this.nodes=[];this.filter=null;this.master.gain.cancelScheduledValues(t);this.master.gain.setValueAtTime(this.master.gain.value,t);this.master.gain.linearRampToValueAtTime(0,t+(now?.08:.7));setTimeout(()=>nodes.forEach(n=>{try{n.stop();}catch{}}),now?120:800);},
 pause(){if(this.ctx&&this.ctx.state==='running')this.ctx.suspend().catch(()=>{});},
 resume(){if(this.ctx&&this.on&&this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});}};

// ---------- DOM ----------
const ICON={on:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.6 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
 off:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 9.5l5 5m0-5l-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'};
const d=document.createElement('dialog');d.id='cinema';d.className='cinema';d.setAttribute('aria-label',_t('cinui.rolik_ekspeditsii'));
d.innerHTML=`<div class="cin-stage"><div class="cin-slides"></div><canvas class="cin-fx" aria-hidden="true"></canvas><div class="cin-alarm"></div><div class="cin-lids" aria-hidden="true"><i></i><i></i></div><div class="cin-vignette"></div><div class="cin-flash"></div></div>
<div class="cin-burst" aria-hidden="true"><div class="cin-rays"></div><img class="cin-crystal" alt=""></div>
<div class="cin-title" aria-live="polite"><small>MOONKATTY · NEW HORIZONS</small><h2></h2><p></p></div>
<div class="cin-sub"><span class="cin-kicker"></span><p class="cin-text"></p><span class="cin-hint">${_t('cinui.nazhmi_chtoby')} <b>›</b></span></div>
<div class="cin-top"><div class="cin-bars"></div><div class="cin-row"><button class="cin-sound" type="button"></button><button class="cin-skip" type="button">${_t('cinui.propustit')} <b>›</b></button></div></div>
<div class="cin-preroll"><div class="cin-logo">MOONKATTY</div><small dir="ltr">${_t('cinui.new_horizons')}</small><button class="cin-start" type="button"><span>▶</span> ${_t('cinui.smotret_vstuplenie')}</button><button class="cin-later" type="button">${_t('cinui.propustit')}</button></div>
<div class="cin-loading" aria-hidden="true"></div>`;
(document.getElementById('app-viewport')||document.body).append(d);
const stage=d.querySelector('.cin-stage'),slides=d.querySelector('.cin-slides'),canvas=d.querySelector('.cin-fx'),ctx2=canvas.getContext('2d'),bars=d.querySelector('.cin-bars'),
 sub=d.querySelector('.cin-sub'),kick=d.querySelector('.cin-kicker'),text=d.querySelector('.cin-text'),titleBox=d.querySelector('.cin-title'),soundBtn=d.querySelector('.cin-sound'),
 flashEl=d.querySelector('.cin-flash'),preroll=d.querySelector('.cin-preroll'),burst=d.querySelector('.cin-burst');
function paintSound(){const on=Sound.on;soundBtn.innerHTML=on?ICON.on:ICON.off;soundBtn.setAttribute('aria-label',on?_t('cinui.vyklyuchit_zvuk'):_t('cinui.vklyuchit_zvuk'));soundBtn.classList.toggle('muted',!on);}
paintSound();

// ---------- playback ----------
let P=null; // current playback
const imgCache={};function load(src){if(imgCache[src])return imgCache[src];const im=new Image();im.decoding='async';const p=new Promise(res=>{im.onload=()=>res(im);im.onerror=()=>res(null);});im.src=src;return imgCache[src]=p;}
function play(id,opts={}){if(P)return false;const frames=C.frames(id,S().chapter);if(!frames.length)return false;const scene=C.SCENES[id];
 document.querySelectorAll('dialog[open]').forEach(x=>{if(x!==d)x.close();});Game.resetControls&&Game.resetControls();
 P={id,frames,scene,i:-1,start:0,dur:0,typed:false,paused:0,pausedAt:0,onEnd:opts.onEnd||null,slide:null,old:null,raf:0,parts:{},fall:null,flashAt:-1,shake:0,typeTimer:0};
 d.className='cinema'+(scene.flash?' flash-mode':'');d.classList.remove('out');slides.innerHTML='';bars.innerHTML=scene.flash?'':frames.map(()=>'<span><i></i></span>').join('');
 titleBox.classList.remove('show');sub.classList.remove('show','typed');burst.classList.remove('show');
 try{d.showModal();}catch{d.setAttribute('open','');}
 frames.forEach(f=>load(f.img));
 const go=()=>{preroll.classList.remove('show');Sound.start();next();P.raf=requestAnimationFrame(tick);};
 if(opts.preroll){preroll.classList.add('show');preroll.querySelector('.cin-start').onclick=e=>{e.stopPropagation();Sound.ensure();go();};preroll.querySelector('.cin-later').onclick=e=>{e.stopPropagation();finish(true);};}
 else go();
 return true;}
async function next(){if(!P||P.busy)return;P.busy=true;try{await nextFrame();}finally{if(P)P.busy=false;}}
async function nextFrame(){const i=P.i+1;if(i>=P.frames.length)return finish(false);const f=P.frames[i];d.classList.add('loading');const im=await Promise.race([load(f.img),new Promise(r=>setTimeout(()=>r(null),4000))]);d.classList.remove('loading');if(!P)return;
 P.i=i;P.typed=false;clearTimeout(P.typeTimer);P.fall=null;P.flashAt=-1;P.parts={};
 if(f.kind==='flash')return showFlash(f,im);
 const sl=document.createElement('div');sl.className='cin-slide'+(f.fx.includes('wake')&&!reduce?' wake':'');const plane=document.createElement('div');plane.className='cin-plane';
 const iw=im?im.naturalWidth:1280,ih=im?im.naturalHeight:720;plane.style.width=iw+'px';plane.style.height=ih+'px';
 if(im){const img=document.createElement('img');img.src=f.img;img.alt='';img.draggable=false;plane.append(img);}
 for(const[x,y,r,c]of f.glows||[]){const g=document.createElement('span');g.className='cin-glow';const px=r*iw;g.style.cssText=`left:${x*iw-px}px;top:${y*ih-px}px;width:${px*2}px;height:${px*2}px;--c:${COLORS[c]||COLORS.gold};animation-delay:${(-Math.random()*3).toFixed(2)}s;animation-duration:${(2.6+Math.random()*1.6).toFixed(2)}s`;plane.append(g);}
 sl.append(plane);slides.append(sl);P.old=P.slide;P.slide={el:sl,plane,iw,ih,f,cam:null};place(P.slide,0);
 requestAnimationFrame(()=>sl.classList.add('in'));if(P.old){const old=P.old;old.el.classList.add('leaving');setTimeout(()=>old.el.remove(),C.FADE_MS+80);}
 d.classList.toggle('fx-alarm',f.fx.includes('alarm'));d.classList.toggle('fx-wake',f.fx.includes('wake')&&!reduce);
 P.start=performance.now();P.paused=0;P.dur=C.frameDuration(f);if(i>0)Sound.whoosh();Sound.setMood(f.mood);
 if(f.fx.includes('fall'))P.fall={t0:500,t1:f.impact.at,x:f.impact.x,y:f.impact.y,hit:false};
 // title card + subtitles
 titleBox.classList.remove('show');if(f.title){titleBox.querySelector('h2').textContent=f.title[0];titleBox.querySelector('p').textContent=f.title[1];setTimeout(()=>P&&P.frames[P.i]===f&&titleBox.classList.add('show'),450);}
 subtitle(f,f.title?1300:C.TYPE_DELAY);}
function subtitle(f,delay){sub.classList.remove('show','typed');kick.textContent=f.kicker||'';const chars=[...(f.text||'')];
 text.innerHTML=chars.map((ch,k)=>`<span style="animation-delay:${delay+k*C.CHAR_MS}ms">${ch===' '?' ':ch.replace(/[<>&]/g,'')}</span>`).join('');void sub.offsetWidth;sub.classList.add('show');
 P.typeTimer=setTimeout(()=>{if(P){P.typed=true;sub.classList.add('typed');}},delay+chars.length*C.CHAR_MS+300);}
function showFlash(f,im){burst.querySelector('img').src=f.img;burst.classList.remove('show');void burst.offsetWidth;burst.classList.add('show');
 titleBox.querySelector('h2').textContent=f.title[0];titleBox.querySelector('p').textContent=f.title[1]||'';titleBox.classList.add('show');
 P.start=performance.now();P.dur=f.dur;Sound.chime();tg()?.HapticFeedback?.notificationOccurred?.('success');subtitle(f,500);
 const W=stage.clientWidth,H=stage.clientHeight;P.parts.sparks=Array.from({length:46},()=>{const a=Math.random()*Math.PI*2,v=60+Math.random()*220;return{x:W/2,y:H*.4,vx:Math.cos(a)*v,vy:Math.sin(a)*v-40,life:1+Math.random()*1.2,r:1+Math.random()*2.4};});}
function place(sl,t){const W=stage.clientWidth||innerWidth,H=stage.clientHeight||innerHeight;const cam=C.camera(sl.f,sl.iw,sl.ih,W,H,reduce?0:t);sl.cam=cam;sl.plane.style.transform=`translate3d(${cam.tx.toFixed(2)}px,${cam.ty.toFixed(2)}px,0) scale(${cam.sc.toFixed(5)})`;}
function finish(skipped){if(!P)return;const p=P;P=null;cancelAnimationFrame(p.raf);clearTimeout(p.typeTimer);mark(C.marks(p.id,S().chapter));Sound.stop();d.classList.add('out');
 setTimeout(()=>{try{d.close();}catch{d.removeAttribute('open');}d.classList.remove('out','fx-alarm','fx-wake');slides.innerHTML='';preroll.classList.remove('show');
  ctx2.clearRect(0,0,canvas.width,canvas.height);if(p.onEnd)p.onEnd(skipped);setTimeout(()=>window.MoonGrowthUI&&window.MoonGrowthUI.maybeStreak&&window.MoonGrowthUI.maybeStreak(600),50);},reduce?120:480);}
function advance(){if(!P||P.i<0)return;if(!P.typed){P.typed=true;clearTimeout(P.typeTimer);sub.classList.add('typed','instant');setTimeout(()=>sub.classList.remove('instant'),50);const el=performance.now()-P.start-P.paused;P.dur=Math.max(P.dur,el+1800);return;}next();}

// ---------- particles on one canvas (screen space) ----------
function sizeCanvas(){const dpr=Math.min(2,window.devicePixelRatio||1),W=stage.clientWidth||innerWidth,H=stage.clientHeight||innerHeight;if(canvas.width!==Math.round(W*dpr)||canvas.height!==Math.round(H*dpr)){canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);}return{W,H,dpr};}
function glowDot(x,y,r,rgb,a){const g=ctx2.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${rgb},${a})`);g.addColorStop(1,`rgba(${rgb},0)`);ctx2.fillStyle=g;ctx2.beginPath();ctx2.arc(x,y,r,0,7);ctx2.fill();}
function tick(now){if(!P)return;P.raf=requestAnimationFrame(tick);if(document.hidden||P.pausedAt)return;const f=P.frames[P.i];if(!f)return;const el=now-P.start-P.paused,{W,H,dpr}=sizeCanvas();
 const prog=Math.min(1,el/P.dur);const segs=bars.children;for(let k=0;k<segs.length;k++)segs[k].firstChild.style.transform=`scaleX(${k<P.i?1:k===P.i?prog:0})`;
 if(P.slide)place(P.slide,el/(P.dur+C.FADE_MS));if(P.old&&P.old.cam)place(P.old,1);
 ctx2.setTransform(dpr,0,0,dpr,0,0);ctx2.clearRect(0,0,W,H);const dt=Math.min(.05,(now-(P.last||now))/1000);P.last=now;const fx=f.fx||[],cam=P.slide&&P.slide.cam,parts=P.parts;
 const dx=cam&&P.lastTx!=null?cam.tx-P.lastTx:0,dy=cam&&P.lastTy!=null?cam.ty-P.lastTy:0;if(cam){P.lastTx=cam.tx;P.lastTy=cam.ty;}
 if(fx.includes('stars')){const sky=(f.sky||.4)*H;parts.stars=parts.stars||Array.from({length:Math.round(W*H/5200)},()=>({x:Math.random()*W,y:Math.random()*sky,r:.4+Math.random()*1.1,ph:Math.random()*7,sp:.6+Math.random()*1.8}));
  for(const s of parts.stars){s.x+=dx*.55;s.y+=dy*.55;if(s.x<0)s.x+=W;if(s.x>W)s.x-=W;const a=.35+.45*Math.sin(now/1000*s.sp+s.ph);if(s.y>sky||s.y<0)continue;ctx2.fillStyle=`rgba(225,238,255,${Math.max(0,a)*.8})`;ctx2.beginPath();ctx2.arc(s.x,s.y,s.r,0,7);ctx2.fill();}}
 if(fx.includes('dust')){parts.dust=parts.dust||Array.from({length:reduce?10:Math.round(W*H/9000)},()=>({x:Math.random()*W,y:Math.random()*H,r:.8+Math.random()*2.6,vx:6+Math.random()*12,vy:-3-Math.random()*8,a:.12+Math.random()*.35}));
  for(const p of parts.dust){p.x+=p.vx*dt+dx*1.6;p.y+=p.vy*dt+dy*1.6;if(p.x>W+10)p.x-=W+20;if(p.x<-10)p.x+=W+20;if(p.y<-10)p.y+=H+20;if(p.y>H+10)p.y-=H+20;glowDot(p.x,p.y,p.r*2.2,'255,236,205',p.a);}}
 if(fx.includes('ship')&&cam&&f.ship){const t=C.ease(Math.min(1,el/(P.dur+C.FADE_MS))),sx=f.ship.from[0]+(f.ship.to[0]-f.ship.from[0])*t,sy=f.ship.from[1]+(f.ship.to[1]-f.ship.from[1])*t;const[x,y]=C.toScreen(cam,P.slide.iw,P.slide.ih,sx,sy);
  parts.trail=parts.trail||[];/*ship*/parts.trail.push([x,y]);if(parts.trail.length>42)parts.trail.shift();const tr=parts.trail;for(let k=1;k<tr.length;k++){const a=k/tr.length;ctx2.strokeStyle=`rgba(255,200,120,${a*.55})`;ctx2.lineWidth=a*3.2;ctx2.beginPath();ctx2.moveTo(tr[k-1][0],tr[k-1][1]);ctx2.lineTo(tr[k][0],tr[k][1]);ctx2.stroke();}
  const fl=.85+.15*Math.sin(now/45);glowDot(x,y,26*fl,'255,196,110',.55);glowDot(x,y,7,'255,255,240',1);ctx2.strokeStyle='rgba(255,240,210,.5)';ctx2.lineWidth=1;ctx2.beginPath();ctx2.moveTo(x-18*fl,y);ctx2.lineTo(x+18*fl,y);ctx2.moveTo(x,y-11*fl);ctx2.lineTo(x,y+11*fl);ctx2.stroke();}
 if(fx.includes('meteors')&&!reduce){parts.met=parts.met||[];if(Math.random()<dt*2.4&&(!P.fall||el<P.fall.t1+1500))parts.met.push({x:W*(.4+Math.random()*.8),y:-20,vx:-(260+Math.random()*200),vy:420+Math.random()*260,life:1});
  for(const m of parts.met){m.x+=m.vx*dt;m.y+=m.vy*dt;m.life-=dt*.9;const g=ctx2.createLinearGradient(m.x,m.y,m.x-m.vx*.18,m.y-m.vy*.18);g.addColorStop(0,`rgba(255,240,210,${Math.min(1,m.life*1.2)})`);g.addColorStop(1,'rgba(255,150,70,0)');ctx2.strokeStyle=g;ctx2.lineWidth=2.6;ctx2.beginPath();ctx2.moveTo(m.x,m.y);ctx2.lineTo(m.x-m.vx*.18,m.y-m.vy*.18);ctx2.stroke();}parts.met=parts.met.filter(m=>m.life>0&&m.y<H+40);}
 const fall=P.fall;if(fall){const tx=fall.x*W,ty=fall.y*H,sx0=W*.9,sy0=-H*.06;if(el>fall.t0&&el<fall.t1){const t=(el-fall.t0)/(fall.t1-fall.t0),e=t*t,x=sx0+(tx-sx0)*e,y=sy0+(ty-sy0)*e,bx=x-(tx-sx0)*.34,by=y-(ty-sy0)*.34;
   parts.smoke=parts.smoke||[];parts.smoke.push({x,y,r:5+Math.random()*5,a:.55});for(const s of parts.smoke){s.r+=dt*30;s.a-=dt*.4;if(s.a>0)glowDot(s.x,s.y,s.r,'150,128,112',s.a*.55);}
   ctx2.lineCap='round';for(const[w,c0,c1]of[[16,'rgba(255,120,40,.45)','rgba(255,80,20,0)'],[7,'rgba(255,200,120,.95)','rgba(255,110,40,0)'],[2.5,'rgba(255,255,240,1)','rgba(255,220,160,0)']]){const g=ctx2.createLinearGradient(x,y,bx,by);g.addColorStop(0,c0);g.addColorStop(1,c1);ctx2.strokeStyle=g;ctx2.lineWidth=w;ctx2.beginPath();ctx2.moveTo(x,y);ctx2.lineTo(bx,by);ctx2.stroke();}
   glowDot(x,y,58,'255,150,60',.75);glowDot(x,y,22,'255,230,180',.95);glowDot(x,y,8,'255,255,255',1);}
  if(el>=fall.t1&&!fall.hit){fall.hit=true;P.flashAt=now;P.shake=now;Sound.boom();tg()?.HapticFeedback?.impactOccurred?.('heavy');parts.debris=Array.from({length:reduce?10:44},()=>{const a=-Math.PI*Math.random(),v=120+Math.random()*420;return{x:tx,y:ty,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:1.4+Math.random(),r:1.5+Math.random()*3.5};});}
  if(fall.hit){glowDot(tx,ty,70+10*Math.sin(now/90),'255,140,60',.35);for(const p of parts.debris||[]){p.vy+=260*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;if(p.life<=0)continue;glowDot(p.x,p.y,p.r*2.6,'255,170,90',Math.min(1,p.life)*.5);ctx2.fillStyle=`rgba(40,32,28,${Math.min(1,p.life)})`;ctx2.beginPath();ctx2.arc(p.x,p.y,p.r,0,7);ctx2.fill();}}}
 if(fx.includes('signal')&&cam&&f.signal){const[x,y]=C.toScreen(cam,P.slide.iw,P.slide.ih,f.signal[0],f.signal[1]);for(let k=0;k<3;k++){const ph=((now/1600)+k/3)%1;ctx2.strokeStyle=`rgba(120,220,255,${(1-ph)*.55})`;ctx2.lineWidth=2-ph*1.4;ctx2.beginPath();ctx2.arc(x,y,12+ph*150,Math.PI*.9,Math.PI*2.1);ctx2.stroke();}glowDot(x,y,16,'140,225,255',.7);}
 if(parts.sparks){for(const p of parts.sparks){p.vy+=70*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;if(p.life>0){glowDot(p.x,p.y,p.r*3,'110,200,255',Math.min(1,p.life)*.7);ctx2.fillStyle=`rgba(235,248,255,${Math.min(1,p.life)})`;ctx2.fillRect(p.x-p.r/2,p.y-p.r/2,p.r,p.r);}}}
 // impact flash + camera shake
 if(P.flashAt>0){const a=Math.max(0,1-(now-P.flashAt)/700);flashEl.style.opacity=(a*a*.88).toFixed(3);if(!a)P.flashAt=-1;}
 if(P.shake){const k=Math.max(0,1-(now-P.shake)/900);stage.style.transform=k&&!reduce?`translate3d(${(Math.random()-.5)*18*k}px,${(Math.random()-.5)*14*k}px,0) scale(1.04)`:'';if(!k)P.shake=0;}
 if(el>=P.dur&&!P.busy){if(f.kind==='flash'||P.i>=P.frames.length-1)finish(false);else next();}}

// ---------- input ----------
d.addEventListener('click',e=>{if(!P)return;if(e.target.closest('.cin-skip')){e.stopPropagation();finish(true);return;}if(e.target.closest('.cin-sound')){e.stopPropagation();Sound.on=!Sound.on;paintSound();if(Sound.on){Sound.start();if(P.frames[P.i])Sound.setMood(P.frames[P.i].mood);}return;}if(e.target.closest('.cin-preroll'))return;
 Sound.ensure();if(Sound.on&&!Sound.nodes.length)Sound.start();if(P.frames[P.i]&&P.frames[P.i].kind==='flash'){finish(false);return;}advance();});
d.addEventListener('cancel',e=>{e.preventDefault();finish(true);});
document.addEventListener('visibilitychange',()=>{if(!P)return;if(document.hidden){P.pausedAt=performance.now();Sound.pause();}else{if(P.pausedAt)P.paused+=performance.now()-P.pausedAt;P.pausedAt=0;P.last=0;Sound.resume();}});
const T=tg();if(T&&T.onEvent){try{T.onEvent('deactivated',()=>Sound.pause());T.onEvent('activated',()=>P&&Sound.resume());}catch{}}

// ---------- game hooks ----------
const begin=$('#begin');if(begin&&begin.onclick){const original=begin.onclick;begin.onclick=function(e){const id=C.openerFor(S());if(id&&play(id,{onEnd:()=>original.call(begin,e)}))return;return original.call(begin,e);};}
Game.onResult=r=>{if(r&&r.found==='crystals'&&!seen('crystal'))setTimeout(()=>{if(!seen('crystal')&&!document.querySelector('dialog[open]'))play('crystal');},420);};
// Main menu: replay the intro and chapter openers; sound switch.
const menu=$('#chapters');if(menu&&!$('#cinema-menu')){const box=document.createElement('section');box.id='cinema-menu';box.className='cinema-menu';
 box.innerHTML=`<button id="watch-intro" class="cin-watch" type="button"><span class="cin-play">▶</span><span><b>${_t('cinui.smotret_vstuplenie')}</b><small>${_t('cinui.polet_avariya')}</small></span></button><div class="cin-chips" id="cinema-chips"></div><button id="cinema-sound" class="cin-switch" type="button" role="switch"></button>`;
 const list=$('#chapter-list');(list||menu.firstChild).after(box);
 const render=()=>{const ch=S().chapter;$('#cinema-chips').innerHTML=['ch1','ch2','ch3'].map((id,k)=>`<button type="button" data-cin="${id}" ${k+1>ch?'disabled':''}>${k+1>ch?'🔒 ':''}${_t('life.n',{n:k+1})}</button>`).join('');
  const sb=$('#cinema-sound');sb.setAttribute('aria-checked',String(Sound.on));sb.innerHTML=`<span>${_t('cinui.zvuk_rolikah')}</span><i class="${Sound.on?'on':''}"><b></b></i>`;};
 render();new MutationObserver(()=>{if(menu.open)render();}).observe(menu,{attributes:true,attributeFilter:['open']});
 box.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;if(b.id==='watch-intro'){menu.close();play('intro');}else if(b.dataset.cin){menu.close();play(b.dataset.cin);}else if(b.id==='cinema-sound'){Sound.on=!Sound.on;paintSound();render();}});}
// Small control surface (menu, QA screenshots): hold/release freeze the timeline and CSS animations.
window.MoonCinema={play,get playing(){return P?P.id:'';},sound:Sound,skip:()=>finish(true),advance,
 get frame(){return P?P.i:-1;},get elapsed(){return P&&P.start?(P.pausedAt||performance.now())-P.start-P.paused:0;},
 hold(){if(P&&!P.pausedAt){P.pausedAt=performance.now();d.classList.add('held');}},release(){if(P&&P.pausedAt){P.paused+=performance.now()-P.pausedAt;P.pausedAt=0;P.last=0;}d.classList.remove('held');},
 jump(i){if(!P||P.busy||i<0||i>=P.frames.length)return;P.i=i-1;next();}};
// First launch: the intro plays once before the cover. A short start screen lets the tap unlock sound.
if(C.needsIntro(S())&&!new URLSearchParams(location.search).has('nointro'))play('intro',{preroll:true});
})();
