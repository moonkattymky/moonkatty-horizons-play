/* v46 daily map tasks + explorer energy. The server seeds 3–5 tasks per player per UTC day at walkable world points,
   owns the energy (max 100, +1 every 3 min) and pays the rewards (Moon Points ledger + supplies). This file only shows
   them: HUD energy bar, glowing beacons over the world, a compass chip, the task panel and the «out of energy» screen.
   Story, exploration and expeditions never use this energy. Offline / outside Telegram everything stays hidden. */
(function(){'use strict';
const Game=window.MoonGame,UI=window.MoonGrowthUI,G=window.MoonGrowth,cfg=window.MoonGrowthConfig||{};if(!Game||!UI||typeof document==='undefined')return;
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const ICON={collect:'◆',scan:'⌖',deliver:'▣',stabilize:'✺'},HOLD={collect:1200,scan:2000,deliver:1500,stabilize:3000},REACH=3.5,KEY='moonkatty-daily-v46';
let data=null,at=0,busy=false,mem={day:'',track:-1,picked:{}},hold=null,pollT=null;
try{mem={...mem,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch{}
const keep=()=>{try{localStorage.setItem(KEY,JSON.stringify(mem));}catch{}};
const toast=t=>Game.toast&&Game.toast(t),tg=()=>window.Telegram?.WebApp||null;
function fmt(sec){sec=Math.max(0,Math.ceil(sec));const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;return h?h+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0'):m+':'+String(s).padStart(2,'0');}
// local view of the server energy between refreshes (same regen math as server/src/logic.js energyNow)
function energy(){if(!data)return null;const e=data.energy,el=(Date.now()-at)/1000;if(e.value>=e.max)return{value:e.max,max:e.max,full:0,next:0};
 const since=e.regenSec-e.nextInSec+el,ticks=Math.floor(since/e.regenSec),value=Math.min(e.max,e.value+ticks);
 return{value,max:e.max,full:Math.max(0,e.fullInSec-el),next:value>=e.max?0:e.regenSec-since%e.regenSec};}
const tasks=()=>data?data.tasks:[];
const goal=t=>t.kind==='deliver'&&t.status==='started'&&!mem.picked[t.slot]&&t.from?{x:t.from.x,z:t.from.z,pickup:true}:{x:t.x,z:t.z,pickup:false};
function set(d){if(!d)return;data=d;at=Date.now();if(mem.day!==d.day){mem={day:d.day,track:-1,picked:{}};keep();}
 const tr=tasks().find(t=>t.slot===mem.track);if(!tr||tr.status==='done'){const s=tasks().find(t=>t.status==='started');mem.track=s?s.slot:-1;keep();}render();}
async function refresh(){if(!UI.online)return;try{set((await UI.api('/api/daily',{})).daily);}catch{}}
function grantLocal(r){if(!r||!G||!G.applyServerReward)return;if(G.applyServerReward(Game.state,r)){Game.save();Game.hud();}}
// ---------- DOM ----------
function mount(){if($('#dm-energy'))return;
 const bar=document.createElement('button');bar.type='button';bar.id='dm-energy';bar.className='dm-energy';bar.hidden=true;bar.innerHTML='<span aria-hidden="true">🔋</span><i><b></b></i><em></em>';bar.onclick=()=>openPanel();document.getElementById('app-viewport')?.append(bar);
 const lay=document.createElement('div');lay.id='dm-beacons';lay.className='dm-beacons';lay.setAttribute('aria-hidden','true');document.getElementById('app-viewport')?.append(lay);
 const chip=document.createElement('button');chip.type='button';chip.id='dm-compass';chip.className='dm-compass';chip.hidden=true;chip.innerHTML='<span class="dm-arrow">↑</span><span class="dm-dist"></span>';chip.onclick=()=>openPanel();document.getElementById('app-viewport')?.append(chip);
 const act=document.createElement('button');act.type='button';act.id='dm-act';act.className='dm-act';act.hidden=true;act.innerHTML='<i></i><span></span>';document.getElementById('app-viewport')?.append(act);
 const startHold=e=>{e.preventDefault();const t=near();if(!t||busy)return;const g=goal(t);if(g.pickup){mem.picked[t.slot]=true;keep();toast(_t('dm.picked'));try{tg()?.HapticFeedback?.impactOccurred('light');}catch{}return;}
  hold={slot:t.slot,start:Date.now(),ms:HOLD[t.kind]||1500};act.classList.add('holding');};
 const stopHold=()=>{hold=null;act.classList.remove('holding');act.style.setProperty('--p','0');};
 act.addEventListener('pointerdown',startHold);act.addEventListener('pointerup',stopHold);act.addEventListener('pointerleave',stopHold);act.addEventListener('pointercancel',stopHold);
 const panel=document.createElement('dialog');panel.id='daily-map';panel.className='dm-panel';document.body.querySelector('#app-viewport')?.append(panel);
 const empty=document.createElement('dialog');empty.id='dm-empty';empty.className='dm-panel dm-empty-dialog';document.body.querySelector('#app-viewport')?.append(empty);
 const exp=$('#expeditions-button');if(exp&&!$('#menu-daily')){const b=document.createElement('button');b.type='button';b.id='menu-daily';b.className='menu-daily';b.hidden=true;b.onclick=()=>{$('#chapters')?.close();openPanel();};exp.after(b);}}
function rewardText(r){return _t('dm.reward',{p:r.points||0,c:r.crystals||0,m:r.metal||0});}
function renderPanel(){const d=$('#daily-map');if(!d)return;const e=energy();
 if(!UI.online||!data){d.innerHTML=`<span class="eyebrow">${_t('dm.eyebrow')}</span><h2>${_t('dm.title')}</h2><p>${_t('dm.offline')}</p><button class="quiet" data-dm-close>${_t('html.vernutsya_mir')}</button>`;}
 else{const rows=tasks().map(t=>`<div class="dm-task ${t.status}"><span class="dm-ico">${ICON[t.kind]}</span><span class="dm-txt"><b>${_t('dm.type_'+t.kind)}</b><small>${_t('dm.desc_'+t.kind)}</small><small class="dm-rw">${rewardText(t.reward)}</small></span><span class="dm-side">${t.status==='done'?`<em>✓ ${_t('dm.done')}</em>`:t.status==='started'?`<button data-dm-track="${t.slot}">${_t('dm.track')}</button>`:`<button class="primary" data-dm-start="${t.slot}">${_t('dm.start',{n:t.cost})}</button>`}</span></div>`).join('');
  const b=data.bonus;d.innerHTML=`<span class="eyebrow">${_t('dm.eyebrow')}</span><h2>${_t('dm.title')}</h2><p class="dm-lead">${_t('dm.lead')}</p>
  <div class="dm-meter"><span>🔋 ${_t('dm.energy')}</span><i><b style="width:${Math.round(e.value/e.max*100)}%"></b></i><em>${e.value}/${e.max}</em></div><small class="dm-sub">${e.value>=e.max?_t('dm.full'):_t('dm.next',{t:fmt(e.next)})} · ${_t('dm.new_tasks',{t:fmt(data.resetInSec-(Date.now()-at)/1000)})}</small>
  <div class="dm-list">${rows}</div><p class="dm-bonus ${b.claimed?'done':''}">${b.claimed?'✓ '+_t('dm.bonus_got'):_t('dm.bonus',{p:b.points})}</p><button class="quiet" data-dm-close>${_t('html.vernutsya_mir')}</button>`;}
 d.querySelectorAll('[data-dm-close]').forEach(x=>x.onclick=()=>d.close());
 d.querySelectorAll('[data-dm-start]').forEach(x=>x.onclick=()=>start(Number(x.dataset.dmStart)));
 d.querySelectorAll('[data-dm-track]').forEach(x=>x.onclick=()=>{mem.track=Number(x.dataset.dmTrack);keep();d.close();render();});}
let lastNeed=0;function renderEmpty(need){lastNeed=need;const d=$('#dm-empty');if(!d||!data)return;const e=energy(),r=data.refill;
 d.innerHTML=`<span class="eyebrow">${_t('dm.eyebrow')}</span><h2>${_t('dm.empty_title')}</h2><div class="dm-meter"><span>🔋</span><i><b style="width:${Math.round(e.value/e.max*100)}%"></b></i><em>${e.value}/${e.max}</em></div>
 ${need?`<p>${_t('dm.need',{n:need})}</p>`:''}<p class="dm-timer">${_t('dm.empty_text',{t:fmt(e.full)})}</p>
 ${adsOn()?`<button id="dm-ad">${_t('dm.ad')}<small class="dm-ad-left">${_t('dm.ad_left',{n:data.ads.left})}</small></button>`:''}${r&&r.enabled?`<button class="primary" id="dm-stars">${_t('dm.stars',{n:r.stars})}</button>`:''}<button class="quiet" data-dm-close>${_t('dm.wait')}</button>`;
 d.querySelector('[data-dm-close]').onclick=()=>d.close();const s=d.querySelector('#dm-stars');if(s)s.onclick=buyRefill;const a=d.querySelector('#dm-ad');if(a)a.onclick=watchAd;}
// v47 AdsGram rewarded ad: the SDK loads on first use; the server Reward URL adds the energy, the client only re-reads it.
const adsOn=()=>!!(cfg.ADS_ENABLED&&cfg.ADS_BLOCK_ID&&data&&data.ads&&data.ads.enabled&&data.ads.left>0&&tg());
let sdkP=null;function sdk(){if(window.Adsgram)return Promise.resolve(window.Adsgram);if(!sdkP)sdkP=new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://sad.adsgram.ai/js/sad.min.js';s.async=true;
 s.onload=()=>window.Adsgram?res(window.Adsgram):rej(new Error('no_sdk'));s.onerror=()=>{sdkP=null;rej(new Error('no_sdk'));};document.head.appendChild(s);});return sdkP;}
async function watchAd(){if(busy||!adsOn())return;busy=true;const before=energy().value;
 try{const A=await sdk(),ctl=A.init({blockId:String(cfg.ADS_BLOCK_ID)}),r=await ctl.show();if(r&&r.done){toast(_t('dm.ad_wait'));waitAd(before,0);}else toast(_t('dm.ad_none'));}
 catch(e){toast(_t('dm.ad_none'));}finally{busy=false;}}
function waitAd(before,n){clearTimeout(pollT);pollT=setTimeout(async()=>{await refresh();const e=energy();if(e&&e.value>before){toast(_t('dm.ad_done',{n:data.ads.energy}));if(e.value>=lastNeed)$('#dm-empty')?.close();return;}if(n<7)waitAd(before,n+1);else toast(_t('dm.ad_late'));},n?2500:1500);}
function openPanel(){mount();renderPanel();const d=$('#daily-map');if(d&&!d.open){Game.resetControls?.();d.showModal();}refresh();}
function openEmpty(need){mount();renderEmpty(need);const d=$('#dm-empty');if(d&&!d.open){Game.resetControls?.();d.showModal();}}
function errText(code){return code==='too_fast'?_t('dm.too_fast'):code==='too_far'?_t('dm.too_far'):_t('dm.error');}
async function start(slot){const t=tasks().find(x=>x.slot===slot);if(!t||busy)return;const e=energy();if(e.value<t.cost){$('#daily-map')?.close();openEmpty(t.cost);return;}
 busy=true;try{const r=await UI.api('/api/daily/start',{slot});mem.track=slot;keep();set(r.daily);$('#daily-map')?.close();toast(_t('dm.desc_'+t.kind));}
 catch(err){if(err.code==='no_energy'){await refresh();$('#daily-map')?.close();openEmpty(t.cost);}else toast(errText(err.code));}finally{busy=false;}}
async function complete(t){if(busy)return;busy=true;const p=Game.player;
 try{const r=await UI.api('/api/daily/complete',{slot:t.slot,x:p.x,z:p.z});set(r.daily);grantLocal(r.reward);grantLocal(r.bonus);
  toast(r.bonus?_t('dm.bonus_got'):r.reward?_t('dm.complete')+' '+rewardText(r.reward):_t('dm.complete'));try{tg()?.HapticFeedback?.notificationOccurred('success');}catch{}}
 catch(err){toast(errText(err.code));}finally{busy=false;}}
async function buyRefill(){if(busy)return;busy=true;try{const r=await UI.api('/api/stars/invoice',{item:'energy_refill'});const w=tg();
  if(!w||!w.openInvoice){busy=false;return;}w.openInvoice(r.link,status=>{busy=false;if(status==='paid')waitPaid(0);});}
 catch(err){busy=false;toast(err.code==='energy_full'?_t('dm.full'):_t('dm.error'));}}
function waitPaid(n){clearTimeout(pollT);pollT=setTimeout(async()=>{await refresh();const e=energy();if(e&&e.value>=e.max){toast(_t('dm.paid'));$('#dm-empty')?.close();return;}if(n<8)waitPaid(n+1);},n?2000:1200);}
// ---------- per-frame-ish HUD (8 Hz) ----------
function near(){const p=Game.player;if(!p||p.alt>1.1)return null;let best=null,bd=REACH;for(const t of tasks()){if(t.status!=='started')continue;const g=goal(t),dd=Math.hypot(p.x-g.x,p.z-g.z);if(dd<=bd){bd=dd;best=t;}}return best;}
function render(){mount();const on=!!(UI.online&&data),bar=$('#dm-energy'),menu=$('#menu-daily');if(menu){menu.hidden=!on;menu.textContent=_t('dm.menu');}
 if(bar){bar.hidden=!on;if(on){const e=energy();bar.querySelector('b').style.width=Math.round(e.value/e.max*100)+'%';bar.querySelector('em').textContent=e.value;bar.classList.toggle('low',e.value<15);bar.setAttribute('aria-label',_t('dm.energy')+' '+e.value+'/'+e.max);}}
 const d=$('#daily-map');if(d&&d.open)renderPanel();const em=$('#dm-empty');if(em&&em.open)renderEmpty(lastNeed);}
function tick(){const lay=$('#dm-beacons'),chip=$('#dm-compass'),act=$('#dm-act');if(!lay)return;const r=Game.renderer,p=Game.player,run=Game.running&&UI.online&&data&&r&&p;
 if(!run){lay.innerHTML='';chip.hidden=true;act.hidden=true;return;}
 let html='';const ch=Game.state.chapter;for(const t of tasks()){if(t.status==='done')continue;const pts=t.status==='started'?[goal(t)]:[t.from?{x:t.from.x,z:t.from.z}:{x:t.x,z:t.z}];
  for(const g of pts){const y=(window.MoonCore?.height?MoonCore.height(g.x,g.z,ch):0)+1.4,s=r.project?r.project(g.x,y,g.z):null;if(!s)continue;const dist=Math.hypot(p.x-g.x,p.z-g.z),sc=Math.max(.45,Math.min(1.25,9/Math.max(4,dist)));
   html+=`<i class="dm-beacon ${t.kind} ${t.status} ${t.slot===mem.track?'tracked':''}" style="transform:translate(${s.x.toFixed(1)}px,${s.y.toFixed(1)}px) scale(${sc.toFixed(2)})"><b>${ICON[t.kind]}</b>${dist>6?`<small>${Math.round(dist)} m</small>`:''}</i>`;}}
 lay.innerHTML=html;
 const tr=tasks().find(t=>t.slot===mem.track&&t.status==='started');if(tr){const g=goal(tr),a=Math.atan2(g.x-p.x,p.z-g.z);chip.hidden=false;chip.querySelector('.dm-arrow').style.transform=`rotate(${a+(Game.camYaw||0)}rad)`;chip.querySelector('.dm-dist').textContent=ICON[tr.kind]+' '+_t('dm.dist',{m:Math.round(Math.hypot(p.x-g.x,p.z-g.z))});}else chip.hidden=true;
 const n=near();act.hidden=!n;if(n){const g=goal(n);act.querySelector('span').textContent=g.pickup?_t('dm.act_pickup'):n.kind==='deliver'?_t('dm.act_deliver'):_t('dm.act_'+n.kind);
  if(hold&&hold.slot===n.slot){const k=Math.min(1,(Date.now()-hold.start)/hold.ms);act.style.setProperty('--p',k.toFixed(2));if(k>=1){hold=null;act.classList.remove('holding');act.style.setProperty('--p','0');complete(n);}}}
 else if(hold){hold=null;act.classList.remove('holding');}}
let lastBar=0;function loop(){try{tick();if(Date.now()-lastBar>1000){lastBar=Date.now();render();}}catch(e){}}
mount();setInterval(loop,125);
let tries=0;const boot=setInterval(()=>{if(UI.online){clearInterval(boot);refresh();}else if(++tries>40)clearInterval(boot);},1500);
setInterval(()=>{if(UI.online&&Game.running&&!document.hidden)refresh();},90000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
window.MoonDailyMap={open:openPanel,watchAd,adsOn,sdk,openEmpty,refresh,get data(){return data;},energy,set,fmt,goal,_tick:tick};
})();
