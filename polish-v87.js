/* v87 graphics polish (no new art): world micro-detail scattered around the cat (rocks, alien plants, fireflies, dust motes;
   fewer on the low tier, still/no drift with reduce motion), and 2D reward effects (Moon Points gold burst, crystal sparkle,
   life-complete confetti). Effects respect MoonA11y.calm() and set MoonFX.joy for the cat's happy bounce (character-sprites.js). */
(function(root){'use strict';
const calm=()=>{try{return!!(root.MoonA11y&&root.MoonA11y.calm());}catch(e){return false;}};
const FX=root.MoonFX={joy:-1e9,calm,count:0};
const R=root.MoonRenderer&&root.MoonRenderer.prototype;
if(R&&R.scene){const old=R.scene,cache=new Map(),hash=(a,b,c)=>{let h=(a*374761393+b*668265263+c*2147483647)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967296;};
 const ROCK=[[.36,.37,.40],[.44,.40,.48],[.30,.30,.36]],PLANT=[[.78,.22,.80],[.55,.25,.95],[.20,.55,1.0]],BULB=[[1,.45,.95],[.70,.55,1],[.35,.85,1]],GOLD=[1,.78,.38];
 R.scene=function(state,p,t,scan){const out=old.apply(this,arguments);try{if(!p||!this.queue||root.MoonExportCapture)return out;
  const low=this.quality==='low',still=calm(),ch=state.chapter||1,C=2.2,RAD=low?10:16,px=Math.round(p.x/C),pz=Math.round(p.z/C),n=Math.ceil(RAD/C),put=this.put.bind(this);let used=0;const MAX=low?20:44;
  if(cache.size>4000)cache.clear();
  for(let i=-n;i<=n&&used<MAX;i++)for(let j=-n;j<=n&&used<MAX;j++){const cx=px+i,cz=pz+j,r=hash(cx,cz,ch);if(r>(low?.3:.5))continue;
   const key=ch+':'+cx+':'+cz;let c=cache.get(key);
   if(c===undefined){const x=cx*C+(hash(cz,cx,7)-.5)*1.8,z=cz*C+(hash(cx,cz,11)-.5)*1.8;let ok=true;try{ok=!this.blocked(x,z,state,0)&&!this.blocked(x+.6,z,state,0)&&!this.blocked(x,z+.6,state,0);}catch(e){ok=false;}c=ok?{x,z,y:this.terrain(x,z,ch),k:hash(cx,cz,3),s:.6+hash(cz,cx,5)*.8}:null;cache.set(key,c);}
   if(!c)continue;const d=Math.hypot(c.x-p.x,c.z-p.z);if(d>RAD||d<1.2)continue;used++;const k=c.k,s=c.s,v=Math.floor(k*97)%3;
   if(k<.5){put('geology'+(v+1),c.x,c.y+.08*s,c.z,.42*s,.24*s,.36*s,ROCK[v],k*40,4);if(!low&&k<.18)put('geology1',c.x+.55*s,c.y+.02,c.z-.4*s,.2*s,.12*s,.17*s,ROCK[(v+1)%3],k*70,4);}
   else if(k<.82){const h=.5+.4*s,sw=still?0:Math.sin(t*1.3+k*20)*.12;put('cone',c.x,c.y+h*.5,c.z,.07,h,.07,PLANT[v],0,0,0,sw*.6,sw);put('smooth',c.x+sw*h*.5,c.y+h,c.z,.15*s,.15*s,.15*s,BULB[v],0,12,.4+(still?0:Math.sin(t*2+k*9)*.15));
    if(!low){put('cone',c.x+.22,c.y+h*.35,c.z+.05,.05,h*.6,.05,PLANT[(v+1)%3],0,0,0,-.35,.2);}}
   else{const fy=still?0:Math.sin(t*1.7+k*30)*.18,fx=still?0:Math.sin(t*.9+k*17)*.25;put('smooth',c.x+fx,c.y+.7+fy+s*.4,c.z+fx*.6,.09,.09,.09,k>.93?[.4,.8,1]:GOLD,0,12,.75+(still?0:Math.sin(t*5+k*40)*.2));}}
  if(!low&&!still){for(let i=0;i<10;i++){const a=i*2.399+t*.05,r=2+(i%5)*1.4,x=p.x+Math.cos(a)*r,z=p.z+Math.sin(a)*r;put('smooth',x,this.terrain(x,z,ch)+.5+((t*.12+i*.37)%1)*2.2,z,.035,.035,.035,[.95,.92,1],0,12,.5);}}
  FX.count=used;}catch(e){}return out;};}
/* ---- 2D reward particles ---- */
let cv=null,cx2=null,parts=[],raf=0;
function canvasIn(host){if(!root.document)return null;if(!cv){cv=document.createElement('canvas');cv.className='mk-fx';cv.setAttribute('aria-hidden','true');cv.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2147483000';cx2=cv.getContext('2d');}
 const h=host||document.body;if(cv.parentNode!==h)h.appendChild(cv);const dpr=Math.min(2,root.devicePixelRatio||1),W=innerWidth,H=innerHeight;if(cv.width!==Math.round(W*dpr)||cv.height!==Math.round(H*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);}cx2.setTransform(dpr,0,0,dpr,0,0);return cv;}
const lowTier=()=>{try{return root.MoonGame&&root.MoonGame.renderer&&root.MoonGame.renderer.quality==='low';}catch(e){return false;}};
function glow(el){if(!el||!el.style)return;const o=el.style.boxShadow;el.style.boxShadow='0 0 0 2px rgba(255,214,120,.9),0 0 14px rgba(255,200,90,.7)';setTimeout(()=>{el.style.boxShadow=o;},700);}
function burst(kind,x,y,host){FX.joy=performance.now();if(calm()){return;}if(!canvasIn(host))return;const lo=lowTier(),n=kind==='life'?(lo?50:110):kind==='mp'?(lo?14:28):(lo?10:20);
 const pal=kind==='crystal'?['#7fd6ff','#bfeaff','#ffffff','#5aa8ff']:kind==='life'?['#ffd27a','#ffffff','#b77dff','#ff6fd8','#7fd6ff']:['#ffd27a','#fff1c4','#ffb347','#ffffff'];
 for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,sp=kind==='life'?120+Math.random()*320:50+Math.random()*130;
  parts.push({x:kind==='life'?innerWidth*(.2+Math.random()*.6):x,y:kind==='life'?innerHeight*.18:y,vx:Math.cos(a)*sp,vy:kind==='life'?-Math.abs(Math.sin(a))*sp*.7-60:Math.sin(a)*sp-40,life:0,max:kind==='life'?1.8+Math.random()*.8:.6+Math.random()*.4,c:pal[i%pal.length],s:kind==='life'?3+Math.random()*4:1.5+Math.random()*2.2,conf:kind==='life'&&i%2===0,r:Math.random()*6,g:kind==='life'?260:120});}
 if(!raf){let last=performance.now();const step=now=>{const dt=Math.min(.05,(now-last)/1000);last=now;cx2.clearRect(0,0,innerWidth,innerHeight);cx2.globalCompositeOperation='lighter';
  parts=parts.filter(q=>(q.life+=dt)<q.max);for(const q of parts){q.vy+=q.g*dt;q.vx*=.985;q.x+=q.vx*dt;q.y+=q.vy*dt;q.r+=dt*8;const a=1-q.life/q.max;cx2.globalAlpha=a;cx2.fillStyle=q.c;
   if(q.conf){cx2.globalCompositeOperation='source-over';cx2.save();cx2.translate(q.x,q.y);cx2.rotate(q.r);cx2.fillRect(-q.s,-q.s*.45,q.s*2,q.s*.9);cx2.restore();cx2.globalCompositeOperation='lighter';}
   else{cx2.beginPath();cx2.arc(q.x,q.y,q.s,0,6.283);cx2.fill();if(q.s>2.4){cx2.globalAlpha=a*.5;cx2.fillRect(q.x-q.s*2.4,q.y-.5,q.s*4.8,1);cx2.fillRect(q.x-.5,q.y-q.s*2.4,1,q.s*4.8);}}}
  cx2.globalAlpha=1;cx2.globalCompositeOperation='source-over';if(parts.length)raf=requestAnimationFrame(step);else{raf=0;cx2.clearRect(0,0,innerWidth,innerHeight);}};raf=requestAnimationFrame(step);}}
function at(el,kind){let x=innerWidth/2,y=innerHeight*.3;if(el&&el.getBoundingClientRect){const b=el.getBoundingClientRect();if(b.width){x=b.left+b.width/2;y=b.top+b.height/2;}}if(calm())glow(el&&el.closest?el.closest('span,div')||el:el);burst(kind,x,y);}
FX.burst=(kind,el)=>kind==='life'?burst('life',0,0,document.querySelector('dialog[open]')):at(el,kind);
/* hooks: MoonSfx('mp'|'life') calls (they are made whether or not sound is on) and the HUD crystal counter going up */
let inner=root.MoonSfx;const wrap=function(name){try{if(name==='mp')at(document.querySelector('.mc-val'),'mp');else if(name==='life')setTimeout(()=>FX.burst('life'),250);}catch(e){}if(typeof inner==='function')return inner.apply(this,arguments);};
try{Object.defineProperty(root,'MoonSfx',{configurable:true,get:()=>wrap,set:v=>{inner=v;}});}catch(e){}
if(root.document&&root.MutationObserver){const watch=()=>{const el=document.getElementById('crystals');if(!el)return;let prev=parseInt(el.textContent,10)||0;new MutationObserver(()=>{const v=parseInt(el.textContent,10)||0;if(v>prev&&root.MoonGame&&root.MoonGame.running)at(el,'crystal');prev=v;}).observe(el,{childList:true,characterData:true,subtree:true});};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch);else watch();}
})(globalThis);
