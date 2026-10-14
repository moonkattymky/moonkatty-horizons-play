/* v87b MOONKATTY sound effects (background music removed) — 100% procedural WebAudio (no audio files, 0 KB to download, nothing copyrighted).
   Loaded lazily after the first tap (iOS autoplay rule). Pref: moonkatty-sfx ('0' = off).
   No background music: no music bus, no loop is ever created; only sound effects.
   SFX: footsteps, crystal/metal pickup, Moon Points chime, button tap, mine, jetpack/rocket whoosh, puzzle success, Life complete.
   Pauses when the app is hidden and ducks while a cut-scene plays its own sound. */
(function(root){'use strict';
const SP='moonkatty-sfx',get=k=>{try{return localStorage.getItem(k)!=='0';}catch{return true;}};
const AC=root.AudioContext||root.webkitAudioContext;if(!AC||root.MoonAudio)return;
const low=(()=>{try{return localStorage.getItem('moonkatty-new-horizons-v02-quality')==='low'||document.documentElement.classList.contains('quality-low');}catch{return false;}})();
const ctx=root.__mkAC||new AC(),out=ctx.createGain();out.gain.value=0.9;out.connect(ctx.destination);
const sfxBus=ctx.createGain();sfxBus.gain.value=get(SP)?0.55:0;
// generated reverb (decaying noise impulse) for SFX
const verb=ctx.createConvolver();(()=>{const len=ctx.sampleRate*(low?1.6:2.8),b=ctx.createBuffer(2,len,ctx.sampleRate);for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3);}verb.buffer=b;})();
const wet=ctx.createGain();wet.gain.value=0.45;verb.connect(wet);wet.connect(out);
sfxBus.connect(out);const sfxWet=ctx.createGain();sfxWet.gain.value=0.25;sfxBus.connect(sfxWet);sfxWet.connect(verb);
const now=()=>ctx.currentTime,hz=m=>440*Math.pow(2,(m-69)/12);
function env(g,t,a,peak,d){g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(0.0001,t+a+d);}
function tone(bus,{f=440,type='sine',t=now(),a=0.005,d=0.3,v=0.3,slide=0,lp=0}){const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f*slide),t+a+d);let n=o;if(lp){const fl=ctx.createBiquadFilter();fl.type='lowpass';fl.frequency.value=lp;o.connect(fl);n=fl;}n.connect(g);g.connect(bus);env(g,t,a,v,d);o.start(t);o.stop(t+a+d+0.05);}
let noiseBuf=null;function noise(bus,{t=now(),d=0.12,v=0.2,f=1200,q=1,type='bandpass',a=0.004,to=0}){if(!noiseBuf){noiseBuf=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const x=noiseBuf.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=Math.random()*2-1;}
 const s=ctx.createBufferSource(),fl=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=noiseBuf;s.loop=true;fl.type=type;fl.frequency.setValueAtTime(f,t);if(to)fl.frequency.exponentialRampToValueAtTime(to,t+a+d);fl.Q.value=q;s.connect(fl);fl.connect(g);g.connect(bus);env(g,t,a,v,d);s.start(t,Math.random()*0.5);s.stop(t+a+d+0.05);}
// ---------- SFX ----------
let stepAlt=0;const SFX={
 tap(){tone(sfxBus,{f:880,type:'triangle',d:0.06,v:0.12});},
 step(){stepAlt^=1;noise(sfxBus,{f:stepAlt?420:340,q:0.8,d:0.07,v:0.16,type:'lowpass'});},
 crystal(){const t=now();[88,95,100].forEach((m,i)=>tone(sfxBus,{f:hz(m),t:t+i*0.06,d:0.5,v:0.13}));},
 metal(){const t=now();tone(sfxBus,{f:hz(64),type:'square',t,d:0.12,v:0.05,lp:2200});tone(sfxBus,{f:hz(76),type:'triangle',t:t+0.05,d:0.35,v:0.12});},
 mp(){const t=now();[79,83,86,91].forEach((m,i)=>tone(sfxBus,{f:hz(m),type:'sine',t:t+i*0.07,d:0.6,v:0.12}));},
 mine(){const t=now();tone(sfxBus,{f:70,type:'sine',t,d:0.6,v:0.35,slide:0.6});noise(sfxBus,{t,f:300,to:90,d:0.7,v:0.25,type:'lowpass'});},
 rocket(){const t=now();noise(sfxBus,{t,a:0.08,f:500,to:2400,d:0.7,v:0.22,q:0.7});tone(sfxBus,{f:110,type:'sawtooth',t,a:0.05,d:0.6,v:0.04,slide:1.8,lp:900});},
 puzzle(){const t=now();[72,76,79,84].forEach((m,i)=>tone(sfxBus,{f:hz(m),type:'triangle',t:t+i*0.09,d:0.7,v:0.13}));},
 life(){const t=now();[60,64,67,72,76,79,84].forEach((m,i)=>tone(sfxBus,{f:hz(m),type:i%2?'sine':'triangle',t:t+i*0.11,d:1.4,v:0.11}));[48,55,64].forEach(m=>tone(sfxBus,{f:hz(m),t:t+0.7,a:0.4,d:2.5,v:0.08}));},
 error(){tone(sfxBus,{f:220,type:'triangle',d:0.18,v:0.1,slide:0.7});}};
function play(name){try{if(!get(SP)||!SFX[name])return;if(ctx.state!=='running')ctx.resume();SFX[name]();}catch(e){}}
let zone=1;
function sync(){const t=now();sfxBus.gain.setTargetAtTime(get(SP)&&!document.hidden?0.55:0,t,0.05);
 if(document.hidden){if(ctx.state==='running')ctx.suspend();}else if(get(SP)&&ctx.state!=='running')ctx.resume().catch(()=>{});}
document.addEventListener('visibilitychange',sync);root.addEventListener('pagehide',()=>{try{ctx.suspend();}catch{}});
try{root.Telegram?.WebApp?.onEvent?.('activated',sync);root.Telegram?.WebApp?.onEvent?.('deactivated',()=>{try{ctx.suspend();}catch{}});}catch{}
// ---------- game observers (no game logic touched) ----------
document.addEventListener('pointerdown',e=>{const b=e.target.closest&&e.target.closest('button,[role=button],.setting input');if(b&&!b.closest('#joystick'))play('tap');if(ctx.state!=='running'&&get(SP))ctx.resume().catch(()=>{});},true);
function watchNum(id,name){const el=document.getElementById(id);if(!el)return;let last=parseInt(el.textContent,10)||0;new MutationObserver(()=>{const v=parseInt(el.textContent,10)||0;if(v>last&&root.MoonGame?.running)play(name);last=v;}).observe(el,{childList:true,characterData:true,subtree:true});}
watchNum('crystals','crystal');watchNum('metal','metal');
let lx=null,lz=null,acc=0,lastZone=0,wasUp=false;
setInterval(()=>{const G=root.MoonGame;if(!G||!G.running)return;const p=G.player;if(!p)return;const ch=G.state?.chapter||1;if(ch!==lastZone){lastZone=ch;zone=Math.min(9,Math.max(1,ch));}
 if(lx!==null&&p.alt<0.05&&!root.MoonBike?.riding){acc+=Math.hypot(p.x-lx,p.z-lz);if(acc>1.1){acc=0;play('step');}}lx=p.x;lz=p.z;
},90);
setInterval(sync,1500);
root.MoonSfx=play;root.MoonAudio={play,sync,ctx,music:false,get sfx(){return get(SP);}};
sync();
})(typeof window!=='undefined'?window:globalThis);
