/* v84 MOONKATTY sound & music — 100% procedural WebAudio (no audio files, 0 KB to download, nothing copyrighted).
   Loaded lazily after the first tap (iOS autoplay rule). Prefs: moonkatty-music / moonkatty-sfx ('0' = off).
   Music: calm magical space pad + soft pentatonic bells through a generated reverb; the chord colour follows the Life (zone).
   SFX: footsteps, crystal/metal pickup, Moon Points chime, button tap, mine, jetpack/rocket whoosh, puzzle success, Life complete.
   Pauses when the app is hidden and ducks while a cut-scene plays its own sound. */
(function(root){'use strict';
const MP='moonkatty-music',SP='moonkatty-sfx',get=k=>{try{return localStorage.getItem(k)!=='0';}catch{return true;}};
const AC=root.AudioContext||root.webkitAudioContext;if(!AC||root.MoonAudio)return;
const low=(()=>{try{return localStorage.getItem('moonkatty-new-horizons-v02-quality')==='low'||document.documentElement.classList.contains('quality-low');}catch{return false;}})();
const ctx=root.__mkAC||new AC(),out=ctx.createGain();out.gain.value=0.9;out.connect(ctx.destination);
const musicBus=ctx.createGain(),sfxBus=ctx.createGain();musicBus.gain.value=0;sfxBus.gain.value=get(SP)?0.55:0;
// generated reverb (decaying noise impulse) shared by music and bells
const verb=ctx.createConvolver();(()=>{const len=ctx.sampleRate*(low?1.6:2.8),b=ctx.createBuffer(2,len,ctx.sampleRate);for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3);}verb.buffer=b;})();
const wet=ctx.createGain();wet.gain.value=0.45;verb.connect(wet);wet.connect(out);
musicBus.connect(out);musicBus.connect(verb);sfxBus.connect(out);const sfxWet=ctx.createGain();sfxWet.gain.value=0.25;sfxBus.connect(sfxWet);sfxWet.connect(verb);
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
// ---------- music (generative, never the same twice, loops forever) ----------
// one calm progression per Life/zone (MIDI roots), all major/lydian colours
const ZONES={1:[[50,57,62,66],[47,54,59,62],[43,50,55,59],[45,52,57,61]],2:[[48,55,60,64],[45,52,57,60],[41,48,53,57],[43,50,55,59]],3:[[52,59,64,68],[49,56,61,64],[45,52,57,61],[47,54,59,63]],
 4:[[46,53,58,62],[43,50,55,58],[39,46,51,55],[41,48,53,57]],5:[[53,60,65,69],[50,57,62,65],[46,53,58,62],[48,55,60,64]],6:[[51,58,63,67],[48,55,60,63],[44,51,56,60],[46,53,58,62]],
 7:[[49,56,61,65],[46,53,58,61],[42,49,54,58],[44,51,56,60]],8:[[47,54,59,63],[44,51,56,59],[40,47,52,56],[42,49,54,58]],9:[[50,57,62,66],[52,59,64,67],[47,54,59,62],[43,50,55,62]]};
const PENTA=[0,2,4,7,9];let bar=0,timer=0,running=false,zone=1;
function chord(notes,t,dur){const n=low?notes.slice(0,3):notes;n.forEach((m,i)=>{for(const det of low?[0]:[-6,6]){const o=ctx.createOscillator(),g=ctx.createGain(),fl=ctx.createBiquadFilter();o.type=i?'triangle':'sine';o.frequency.value=hz(m);o.detune.value=det;fl.type='lowpass';fl.frequency.value=900;
 o.connect(fl);fl.connect(g);g.connect(musicBus);const pk=0.05/(low?1:1.6);g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(pk,t+dur*0.4);g.gain.setValueAtTime(pk,t+dur*0.65);g.gain.exponentialRampToValueAtTime(0.0001,t+dur+1.5);o.start(t);o.stop(t+dur+1.6);}});}
function bells(root,t,dur){const k=low?2:3+Math.floor(Math.random()*3);for(let i=0;i<k;i++){const m=root+24+PENTA[Math.floor(Math.random()*5)]+(Math.random()<0.3?12:0);tone(musicBus,{f:hz(m),type:'sine',t:t+0.6+Math.random()*(dur-1.2),a:0.01,d:1.8,v:0.035});}}
function schedule(){if(!running)return;const prog=ZONES[zone]||ZONES[1],dur=6.4,t=now()+0.1,c=prog[bar%prog.length];chord(c,t,dur);bells(c[0],t,dur);bar++;timer=setTimeout(schedule,dur*1000-150);}
function musicTarget(){const hidden=document.hidden,cin=[...document.querySelectorAll('.cin-top')].some(e=>e.offsetParent);return get(MP)&&!hidden&&!cin?0.8:0;}
function startMusic(){if(running)return;running=true;bar=0;schedule();}
function stopMusic(){running=false;clearTimeout(timer);}
function sync(){const tgt=musicTarget(),t=now();musicBus.gain.cancelScheduledValues(t);musicBus.gain.setTargetAtTime(tgt,t,tgt?1.2:0.25);sfxBus.gain.setTargetAtTime(get(SP)&&!document.hidden?0.55:0,t,0.05);
 if(tgt&&!running)startMusic();if(!tgt&&running)setTimeout(()=>{if(!musicTarget())stopMusic();},1500);
 if(document.hidden){if(ctx.state==='running')ctx.suspend();}else if((get(MP)||get(SP))&&ctx.state!=='running')ctx.resume().catch(()=>{});}
document.addEventListener('visibilitychange',sync);root.addEventListener('pagehide',()=>{try{ctx.suspend();}catch{}});
try{root.Telegram?.WebApp?.onEvent?.('activated',sync);root.Telegram?.WebApp?.onEvent?.('deactivated',()=>{try{ctx.suspend();}catch{}});}catch{}
// ---------- game observers (no game logic touched) ----------
document.addEventListener('pointerdown',e=>{const b=e.target.closest&&e.target.closest('button,[role=button],.setting input');if(b&&!b.closest('#joystick'))play('tap');if(ctx.state!=='running'&&(get(MP)||get(SP)))ctx.resume().catch(()=>{});},true);
function watchNum(id,name){const el=document.getElementById(id);if(!el)return;let last=parseInt(el.textContent,10)||0;new MutationObserver(()=>{const v=parseInt(el.textContent,10)||0;if(v>last&&root.MoonGame?.running)play(name);last=v;}).observe(el,{childList:true,characterData:true,subtree:true});}
watchNum('crystals','crystal');watchNum('metal','metal');
let lx=null,lz=null,acc=0,lastZone=0,wasUp=false;
setInterval(()=>{const G=root.MoonGame;if(!G||!G.running)return;const p=G.player;if(!p)return;const ch=G.state?.chapter||1;if(ch!==lastZone){lastZone=ch;zone=Math.min(9,Math.max(1,ch));}
 if(lx!==null&&p.alt<0.05&&!root.MoonBike?.riding){acc+=Math.hypot(p.x-lx,p.z-lz);if(acc>1.1){acc=0;play('step');}}lx=p.x;lz=p.z;
},90);
setInterval(sync,1500);
root.MoonSfx=play;root.MoonAudio={play,sync,ctx,get music(){return get(MP);},get sfx(){return get(SP);}};
sync();
})(typeof window!=='undefined'?window:globalThis);
