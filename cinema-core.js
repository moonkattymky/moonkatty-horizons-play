/* v34 cinematic cutscenes: scene scripts and camera maths shared by the player (cinema.js) and the node tests.
   Each frame is one full-screen illustration with a slow camera move (Ken Burns): `from`/`to` are [focusX, focusY, zoom]
   in image fractions; the camera never shows an image edge. Art lives in assets/cinema/ and can be swapped for
   any size/aspect without code changes. No DOM access here. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MoonCinemaCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
const A='assets/cinema/';
// Glow spots [x, y, radius (fraction of image width), colour] pulse softly over windows, crystals, beacons and Earth.
const CH1={img:A+'ch1-awakening.jpg',from:[.46,.30,1.24],to:[.52,.37,1.04],sky:.27,fx:['stars','dust'],glows:[[.665,.315,.06,'blue'],[.04,.47,.07,'blue'],[.6,.485,.05,'blue'],[.8,.2,.16,'earth']],
 title:['Жизнь #1','Пробуждение'],kicker:'ЗАДАНИЕ',text:'Найди бортовой журнал у аварийной капсулы. Вдруг в нём сигнал экипажа?',mood:'title',mark:'ch1'};
const SCENES={
 intro:{name:'Вступление',frames:chapter=>[
  {img:A+'intro-1-voyage.jpg',from:[.40,.50,1.06],to:[.62,.42,1.0],sky:.8,fx:['stars','dust'],glows:[[.285,.585,.035,'amber'],[.25,.62,.03,'amber'],[.725,.25,.12,'earth'],[.10,.39,.03,'earth']],
   kicker:'ЭКСПЕДИЦИЯ «НОВЫЕ ГОРИЗОНТЫ»',text:'Корабль «Горизонт» несёт к Луне кота-космонавта MOONKATTY и его экипаж.',mood:'space'},
  {img:A+'intro-2-crash.jpg',from:[.49,.46,1.16],to:[.47,.64,1.02],sky:.25,fx:['meteors','fall','dust'],impact:{at:2400,x:.44,y:.70},glows:[[.47,.66,.05,'amber'],[.58,.45,.035,'amber'],[.64,.30,.03,'amber'],[.45,.18,.09,'earth']],
   kicker:'ТРЕВОГА · МЕТЕОРИТНЫЙ ПОТОК',text:'Удар! Капсулу отрывает от корабля, и она падает в лунный каньон.',mood:'danger'},
  {img:A+'intro-3-capsule.jpg',from:[.58,.38,1.3],to:[.55,.42,1.04],fx:['wake','alarm','dust'],glows:[[.955,.235,.025,'amber'],[.27,.04,.02,'amber'],[.12,.42,.08,'earth']],
   kicker:'КАПСУЛА · СВЯЗИ НЕТ',text:'…Тишина. Мигает аварийный свет. Экипаж не отвечает.',mood:'alarm'},
  {img:A+'intro-4-earth.jpg',from:[.34,.58,1.14],to:[.66,.44,1.0],sky:.3,fx:['stars','dust'],glows:[[.085,.69,.03,'blue'],[.43,.84,.035,'blue'],[.79,.33,.2,'earth'],[.80,.78,.03,'amber']],
   kicker:'MOONKATTY',text:'Там, над горизонтом, — Земля. Девять жизней, одна Вселенная. Пора найти своих.',mood:'hope'},
  ...(chapter===1?[CH1]:[])],marks:chapter=>chapter===1?['intro','ch1']:['intro']},
 ch1:{name:'Жизнь #1 · Пробуждение',frames:()=>[CH1],marks:()=>['ch1']},
 ch2:{name:'Жизнь #2 · Экипаж',frames:()=>[
  {img:A+'ch2-crew.jpg',from:[.44,.46,1.12],to:[.76,.56,1.0],sky:.42,fx:['stars','dust'],glows:[[.27,.64,.04,'blue'],[.03,.86,.04,'blue'],[.95,.86,.04,'blue'],[.84,.33,.03,'amber'],[.12,.33,.16,'earth']],
   kicker:'СИГНАЛ НАЙДЕН',text:'Координаты получены! Лагерь экипажа совсем рядом — за кратером.',mood:'hope'},
  {img:A+'ch2-camp.jpg',from:[.5,.30,1.26],to:[.5,.36,1.04],sky:.25,fx:['stars','dust'],glows:[[.64,.43,.04,'amber'],[.58,.44,.035,'amber'],[.875,.265,.03,'blue'],[.3,.5,.12,'violet']],
   title:['Жизнь #2','Экипаж'],kicker:'ЗАДАНИЕ',text:'Инженер, штурман и разведчик ждут помощи. Почини ранец, зажги маяки и построй общую базу.',mood:'title',mark:'ch2'}],marks:()=>['ch2']},
 ch3:{name:'Жизнь #3 · Тайна сигнала',frames:()=>[
  {img:A+'ch3-signal.jpg',from:[.34,.62,1.12],to:[.76,.40,1.0],sky:.4,fx:['stars','signal','dust'],signal:[.865,.16],glows:[[.33,.61,.04,'blue'],[.04,.66,.04,'blue'],[.95,.62,.04,'blue'],[.86,.67,.03,'amber']],
   kicker:'НОЧНАЯ ПЕРЕДАЧА',text:'Ночью инженер ловит странный сигнал. Его передаёт старая обсерватория на юге.',mood:'mystery'},
  {img:A+'ch3-observatory.jpg',from:[.5,.28,1.26],to:[.5,.36,1.04],sky:.24,fx:['stars','signal','dust'],signal:[.86,.33],glows:[[.06,.5,.06,'blue'],[.52,.33,.06,'blue'],[.78,.22,.16,'earth']],
   title:['Жизнь #3','Тайна сигнала'],kicker:'ЗАДАНИЕ',text:'Найди три записи старой экспедиции, расшифруй архив и забери чертёж ракеты.',mood:'title',mark:'ch3'}],marks:()=>['ch3']},
 crystal:{name:'Первый кристалл',flash:true,frames:()=>[
  {kind:'flash',img:A+'crystal.webp',dur:5600,kicker:'НАХОДКА',title:['Кристалл найден!',''],text:'Голубые кристаллы — энергия Луны. Из них строят базу и улучшают снаряжение.',mood:'chime'}],marks:()=>['crystal']}
};
const CHAR_MS=30,TYPE_DELAY=650,HOLD_MS=2600,FADE_MS=900;
// How long a frame stays before auto-advancing: long enough to read the subtitle calmly.
function frameDuration(f){if(f.dur)return f.dur;const n=(f.text||'').length;return Math.max(6200,TYPE_DELAY+n*CHAR_MS+HOLD_MS+(f.title?900:0));}
function ease(t){t=Math.max(0,Math.min(1,t));return .5-.5*Math.cos(Math.PI*t);}
// Camera placement for a viewport W×H and an image iw×ih at progress t: cover-fit × zoom, focus point centred, edges clamped.
function camera(f,iw,ih,W,H,t){const e=ease(t),from=f.from||[.5,.5,1.1],to=f.to||from,lerp=(a,b)=>a+(b-a)*e;
 const z=Math.max(1,lerp(from[2],to[2])),sc=Math.max(W/iw,H/ih)*z,dw=iw*sc,dh=ih*sc;
 let tx=W/2-lerp(from[0],to[0])*dw,ty=H/2-lerp(from[1],to[1])*dh;tx=Math.min(0,Math.max(W-dw,tx));ty=Math.min(0,Math.max(H-dh,ty));
 return{tx,ty,sc,dw,dh};}
function toScreen(cam,iw,ih,x,y){return[cam.tx+x*iw*cam.sc,cam.ty+y*ih*cam.sc];}
function frames(id,chapter){const s=SCENES[id];return s?s.frames(chapter||1):[];}
function marks(id,chapter){const s=SCENES[id];return s?s.marks(chapter||1):[];}
// Which cutscene (if any) should play before starting a chapter.
function openerFor(state){const id='ch'+(state&&state.chapter||1);return SCENES[id]&&!(state.cinema&&state.cinema.seen||[]).includes(id)?id:'';}
function needsIntro(state){return!(state&&state.cinema&&state.cinema.seen||[]).includes('intro');}
function images(){const set=new Set();for(const id in SCENES)for(const ch of[1,2,3])for(const f of SCENES[id].frames(ch))set.add(f.img);return[...set];}
return{SCENES,CHAR_MS,TYPE_DELAY,HOLD_MS,FADE_MS,frameDuration,ease,camera,toScreen,frames,marks,openerFor,needsIntro,images};});
