if(typeof _t==='undefined'&&typeof require==='function')require('./i18n.js');
/* v34 cinematic cutscenes: scene scripts and camera maths shared by the player (cinema.js) and the node tests.
   Each frame is one full-screen illustration with a slow camera move (Ken Burns): `from`/`to` are [focusX, focusY, zoom]
   in image fractions; the camera never shows an image edge. Art lives in assets/cinema/ and can be swapped for
   any size/aspect without code changes. No DOM access here. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MoonCinemaCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
const A='assets/cinema/';
// Glow spots [x, y, radius (fraction of image width), colour] pulse softly over windows, crystals, beacons and Earth.
// v38 chapter covers are 16:9 (1280×720). On a portrait phone only ~26% of the width is visible, so each title card pans
// from the cat to the story object. V busts GitHub Pages / Telegram caches of the old portrait files that kept the same names.
const V='?v=38',V4='?v=43';
// Optional titleY (fraction of the screen height) moves the title card off the key object; default 66%.
const CH1={img:A+'ch1-awakening.jpg'+V,from:[.355,.42,1.08],to:[.60,.62,1.1],sky:.3,fx:['stars','dust'],glows:[[.415,.51,.05,'blue'],[.60,.54,.05,'amber'],[.083,.68,.03,'blue'],[.168,.835,.035,'blue'],[.79,.85,.035,'blue'],[.915,.75,.03,'blue'],[.78,.23,.14,'earth']],
 title:[_t('life.n',{n:1}),_t('chapter.1')],kicker:_t('cine.zadanie'),text:_t('cine.naydi_bortovoy'),mood:'title',mark:'ch1'};
const SCENES={
 intro:{name:_t('cine.vstuplenie'),frames:chapter=>[
  {img:A+'intro-1-voyage.jpg',from:[.40,.50,1.06],to:[.62,.42,1.0],sky:.8,fx:['stars','dust'],glows:[[.285,.585,.035,'amber'],[.25,.62,.03,'amber'],[.725,.25,.12,'earth'],[.10,.39,.03,'earth']],
   kicker:_t('cine.ekspeditsiya_novye'),text:_t('cine.korabl_gorizont'),mood:'space'},
  {img:A+'intro-2-crash.jpg',from:[.49,.46,1.16],to:[.47,.64,1.02],sky:.25,fx:['meteors','fall','dust'],impact:{at:2400,x:.44,y:.70},glows:[[.47,.66,.05,'amber'],[.58,.45,.035,'amber'],[.64,.30,.03,'amber'],[.45,.18,.09,'earth']],
   kicker:_t('cine.trevoga_meteoritny'),text:_t('cine.udar_kapsulu'),mood:'danger'},
  {img:A+'intro-3-capsule.jpg',from:[.58,.38,1.3],to:[.55,.42,1.04],fx:['wake','alarm','dust'],glows:[[.955,.235,.025,'amber'],[.27,.04,.02,'amber'],[.12,.42,.08,'earth']],
   kicker:_t('cine.kapsula_svyazi'),text:_t('cine.tishina_migaet'),mood:'alarm'},
  {img:A+'intro-4-earth.jpg',from:[.34,.58,1.14],to:[.66,.44,1.0],sky:.3,fx:['stars','dust'],glows:[[.085,.69,.03,'blue'],[.43,.84,.035,'blue'],[.79,.33,.2,'earth'],[.80,.78,.03,'amber']],
   kicker:'MOONKATTY',text:_t('cine.tam_nad'),mood:'hope'},
  ...(chapter===1?[CH1]:[])],marks:chapter=>chapter===1?['intro','ch1']:['intro']},
 ch1:{name:_t('life.title',{n:1,name:_t('chapter.1')}),frames:()=>[CH1],marks:()=>['ch1']},
 ch2:{name:_t('life.title',{n:2,name:_t('chapter.2')}),frames:()=>[
  {img:A+'ch2-crew.jpg',from:[.44,.46,1.12],to:[.76,.56,1.0],sky:.42,fx:['stars','dust'],glows:[[.27,.64,.04,'blue'],[.03,.86,.04,'blue'],[.95,.86,.04,'blue'],[.84,.33,.03,'amber'],[.12,.33,.16,'earth']],
   kicker:_t('cine.signal_nayden'),text:_t('cine.koordinaty_poluche'),mood:'hope'},
  {img:A+'ch2-camp.jpg'+V,from:[.30,.5,1.12],to:[.635,.5,1.04],sky:.24,titleY:.3,fx:['stars','dust'],glows:[[.08,.43,.05,'amber'],[.25,.43,.045,'amber'],[.57,.62,.055,'blue'],[.855,.80,.045,'blue'],[.72,.86,.035,'blue'],[.945,.74,.03,'blue'],[.852,.125,.05,'earth'],[.5,.22,.13,'violet']],
   title:[_t('life.n',{n:2}),_t('chapter.2')],kicker:_t('cine.zadanie'),text:_t('cine.inzhener_shturman'),mood:'title',mark:'ch2'}],marks:()=>['ch2']},
 ch3:{name:_t('life.title',{n:3,name:_t('chapter.3')}),frames:()=>[
  {img:A+'ch3-signal.jpg',from:[.34,.62,1.12],to:[.76,.40,1.0],sky:.4,fx:['stars','signal','dust'],signal:[.865,.16],glows:[[.33,.61,.04,'blue'],[.04,.66,.04,'blue'],[.95,.62,.04,'blue'],[.86,.67,.03,'amber']],
   kicker:_t('cine.nochnaya_peredacha'),text:_t('cine.nochyu_inzhener'),mood:'mystery'},
  {img:A+'ch3-observatory.jpg'+V,from:[.34,.95,1.07],to:[.52,.32,1.0],sky:.3,fx:['stars','signal','dust'],signal:[.615,.235],glows:[[.366,.373,.03,'blue'],[.43,.60,.06,'blue'],[.43,.82,.035,'blue'],[.08,.61,.035,'blue'],[.70,.77,.04,'blue'],[.62,.70,.03,'blue'],[.84,.165,.095,'earth']],
   title:[_t('life.n',{n:3}),_t('chapter.3')],kicker:_t('cine.zadanie'),text:_t('cine.naydi_tri'),mood:'title',mark:'ch3'}],marks:()=>['ch3']},
 // v43 LIFE #4 · THE ROCKET (1280×720 art, rocket centre ~x .62). Opener: the cat with the blueprint hologram → the welder's
 // sparks; title card pans from the cat to the glowing crystal core. Ending: same art, a slow pull-back from the silent core.
 ch4:{name:_t('life.title',{n:4,name:_t('chapter.4')}),frames:()=>[
  {img:A+'ch4-rocket.jpg'+V4,from:[.33,.58,1.22],to:[.12,.62,1.08],sky:.3,fx:['stars','dust'],glows:[[.40,.66,.06,'blue'],[.135,.785,.035,'amber'],[.12,.56,.04,'amber'],[.205,.56,.03,'amber'],[.607,.37,.05,'blue']],
   kicker:_t('ch4.cine_kicker'),text:_t('ch4.cine_text'),mood:'hope'},
  {img:A+'ch4-rocket.jpg'+V4,from:[.30,.56,1.12],to:[.62,.42,1.02],sky:.26,titleY:.74,fx:['stars','dust'],glows:[[.607,.37,.055,'blue'],[.607,.30,.03,'blue'],[.40,.66,.05,'blue'],[.535,.69,.035,'blue'],[.88,.88,.05,'blue'],[.135,.785,.03,'amber'],[.70,.30,.025,'amber'],[.51,.30,.025,'amber'],[.865,.20,.10,'earth']],
   title:[_t('life.n',{n:4}),_t('chapter.4')],kicker:_t('cine.zadanie'),text:_t('ch4.cine_mission'),mood:'title',mark:'ch4'}],marks:()=>['ch4']},
 ch4end:{name:_t('ch4.end_title'),frames:()=>[
  {img:A+'ch4-rocket.jpg'+V4,from:[.607,.40,1.55],to:[.62,.48,1.04],sky:.32,titleY:.24,fx:['stars','dust'],glows:[[.607,.37,.035,'blue'],[.865,.20,.10,'earth'],[.70,.30,.02,'amber']],
   title:[_t('ch4.end_title'),_t('ch4.end_silent')],kicker:_t('ch4.end_kicker'),text:_t('ch4.end_card'),mood:'mystery'}],marks:()=>['ch4end']},
 crystal:{name:_t('cine.pervyy_kristall'),flash:true,frames:()=>[
  {kind:'flash',img:A+'crystal.webp',dur:5600,kicker:_t('cine.nahodka'),title:[_t('cine.kristall_nayden'),''],text:_t('cine.golubye_kristally'),mood:'chime'}],marks:()=>['crystal']}
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
function images(){const set=new Set();for(const id in SCENES)for(const ch of[1,2,3,4])for(const f of SCENES[id].frames(ch))set.add(f.img);return[...set];}
return{SCENES,CHAR_MS,TYPE_DELAY,HOLD_MS,FADE_MS,frameDuration,ease,camera,toScreen,frames,marks,openerFor,needsIntro,images};});
