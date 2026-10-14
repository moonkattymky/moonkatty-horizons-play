/* v59 worker cat-bots: the hire / assign / collect panel. The server owns every number (timers, outputs, prices, the plot;
   /api/bots*). This file draws a dock button with a "ready" dot and the dialog, keeps the last server view for the 3D plot
   (home-plot.js reads window.MoonBots.view) and buys 24 h boost bots through the existing Stars invoice flow. */
(function(){'use strict';
const Game=window.MoonGame,UI=window.MoonGrowthUI;if(!Game||!UI||typeof document==='undefined')return;
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]),T=(k,p)=>window._t?_t(k,p):k;
const ICON={miner:'⛏️',mechanic:'🔧',builder:'🧱',courier:'📦'},BICON={road:'🐾',lamps:'💡',house:'🏠',workshop:'🛠️',garden:'🌱',house2:'🏡',solar:'☀️',tower:'🗼'};
const KEY='moonkatty-bots-v59';
let view=null,at=0,busy=false,tick=null,pick=null,refresh=null;
try{const c=JSON.parse(localStorage.getItem(KEY)||'null');if(c&&c.view&&c.at){view=c.view;at=c.at;}}catch{}
const toast=t=>t&&Game.toast&&Game.toast(t),buzz=k=>{try{window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(k);}catch{}};
const now=()=>view?view.now+(Date.now()-at):Date.now();
function fmt(sec){sec=Math.max(0,Math.ceil(sec));const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;return h?h+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0'):m+':'+String(s).padStart(2,'0');}
function setView(v){if(!v)return;view=v;at=Date.now();try{localStorage.setItem(KEY,JSON.stringify({view,at}));}catch{}badge();}
function stateOf(b){if(b.state==='working'&&b.endsAt&&now()>=b.endsAt)return'ready';return b.state;}
const readyCount=()=>view?view.bots.filter(b=>stateOf(b)==='ready').length:0;
function apply(r){const G=window.MoonGrowth;let ch=false;for(const w of(r.rewards||[]))if(G&&G.applyServerReward&&G.applyServerReward(Game.state,w))ch=true;if(r.moon&&G&&G.setMoon&&G.setMoon(Game.state,r.moon))ch=true;if(ch){Game.save();Game.hud&&Game.hud();UI.updateMoon&&UI.updateMoon();}}
function dlg(){let d=document.getElementById('bots-dialog');if(d)return d;d=document.createElement('dialog');d.id='bots-dialog';d.className='growth-dialog ret-dialog bots-dialog';(document.getElementById('app-viewport')||document.body).append(d);
 d.addEventListener('click',e=>{if(e.target===d)d.close();});d.addEventListener('close',()=>{clearInterval(tick);tick=null;pick=null;});return d;}
function show(d){d.querySelectorAll('[data-gclose]').forEach(b=>b.onclick=()=>d.close());if(!d.open){document.querySelectorAll('dialog[open]').forEach(x=>{if(x!==d)x.close();});Game.resetControls?.();d.showModal();}}
const head=()=>`<div class="g-head"><div><span class="eyebrow">${esc(T('bots.eyebrow'))}</span><h2>${esc(T('bots.title'))}</h2></div><button class="close-icon" data-gclose aria-label="×">×</button></div>`;
function outText(o){const a=[];if(o.crystals)a.push(T('bots.out_miner',{n:o.crystals}));if(o.metal&&!o.upgrade)a.push('+'+o.metal+' ⚙️');if(o.upgrade)a.push(T('bots.out_mechanic',{n:o.metal}));if(o.build)a.push(T('bots.out_builder',{n:o.build}));if(o.points)a.push(T('bots.out_courier',{n:o.points}));return a.join(' · ');}
function plotHtml(p){const n=p.stage,m=p.steps.length,done=n>=m,lo=p.prevAt,hi=p.nextAt||1,f=done?1:Math.max(0,Math.min(1,(p.build-lo)/Math.max(1,hi-lo)));
 let h=`<section class="bots-plot"><div class="bots-plot-row"><b>${esc(T('bots.plot',{n,m}))}</b><span class="bots-lvl">🔧 ${esc(T('bots.plot_level',{n:p.level,m:p.maxLevel,p:(p.level-1)*5}))}</span></div>`;
 h+='<div class="bots-steps">'+p.steps.map((id,i)=>`<span class="bots-step${i<n?' on':i===n?' next':''}" title="${esc(T('bots.b_'+id))}">${BICON[id]||'•'}</span>`).join('')+'</div>';
 h+=`<div class="ret-fill bots-fill"><i style="width:${Math.round(f*100)}%"></i></div><p class="ret-meta">${esc(done?T('bots.plot_done'):T('bots.plot_next',{b:T('bots.b_'+p.next),a:p.build,c:p.nextAt}))}</p>`;
 if(p.bonus&&(p.bonus.energy||p.bonus.workshop))h+=`<p class="ret-meta">${esc(T('bots.bonus',{e:p.bonus.energy,w:p.bonus.workshop}))}</p>`;return h+'</section>';}
function botHtml(b){const st=stateOf(b),left=st==='working'?Math.max(0,(b.endsAt-now())/1000):0,f=st==='working'?1-left/Math.max(1,b.shiftSec):st==='ready'?1:0;
 let h=`<li class="bot-card ${st}${b.source==='stars'?' boost':''}" data-bot="${b.id}"><span class="bot-ava a-${b.prof}"><i>🤖</i><em>${ICON[b.prof]}</em></span><div class="bot-main"><div class="bot-top"><b>${esc(T('bots.p_'+b.prof))}</b><span class="bot-lv">${esc(T('bots.level',{n:b.level}))}</span>${b.source==='life'?`<span class="bot-tag">${esc(T('bots.free',{n:b.slot.slice(4)}))}</span>`:''}${b.source==='stars'&&b.expiresInSec!=null?`<span class="bot-tag gold">⭐ ${esc(T('bots.boost_left',{t:fmt(b.expiresInSec-(Date.now()-at)/1000)}))}</span>`:''}</div>`;
 h+=`<div class="ret-fill bot-fill"><i style="width:${Math.round(f*100)}%"></i></div><div class="bot-sub"><span data-left="${b.id}">${esc(st==='working'?T('bots.working',{t:fmt(left)}):st==='ready'?T('bots.ready'):T('bots.idle'))}</span><small>${esc(outText(b.out))}</small></div>`;
 if(st==='idle'){if(pick===b.id){h+='<div class="bot-profs">'+(b.source==='stars'?['miner','mechanic','builder']:view.profs).map(p=>`<button type="button" data-prof="${p}" data-for="${b.id}" class="${p===b.prof?'on':''}">${ICON[p]} ${esc(T('bots.p_'+p))}<small>${esc(T('bots.d_'+p))}</small></button>`).join('')+'</div>';}
  h+=`<div class="ret-row"><button type="button" class="ret-ghost" data-pick="${b.id}">${esc(T('bots.choose'))}</button><button type="button" class="ret-main" data-start="${b.id}">${esc(T('bots.start'))}</button></div>`;}
 return h+'</div></li>';}
function render(){const d=dlg();let h=head();
 if(!view){d.innerHTML=h+`<p class="ret-note">${esc(UI.online?'…':T('bots.offline'))}</p>`;show(d);return;}
 const v=view,hi=v.hire,mp=Game.state?.growth?.moon?.points,ready=readyCount(),idle=v.bots.filter(b=>stateOf(b)==='idle').length;
 h+=`<p class="ret-sub">${esc(T('bots.sub'))}</p>`+plotHtml(v.plot);
 h+=`<div class="ret-row bots-actions"><button type="button" class="ret-main ret-wide" data-collect ${ready&&!busy?'':'disabled'}>${esc(ready?T('bots.collect_n',{n:ready}):T('bots.collect'))}</button>${idle>1?`<button type="button" class="ret-ghost" data-startall>${esc(T('bots.start_all'))}</button>`:''}</div>`;
 h+=`<h3 class="bots-h">${esc(T('bots.crew',{n:v.bots.length}))}</h3><ul class="bot-list">`+v.bots.map(botHtml).join('');
 for(const f of v.free)if(!f.got)h+=`<li class="bot-card locked"><span class="bot-ava"><i>🔒</i></span><div class="bot-main"><b>${esc(T('bots.free_locked',{n:f.lives}))}</b></div></li>`;h+='</ul>';
 h+=`<p class="ret-meta">📦 ${esc(T('bots.courier_cap',{n:v.courier.today,m:v.courier.cap}))}</p>`;
 // v74 crystal mine on the plot: levels 2..5 for Moon Points (server-side)
 const mi=v.mine;if(mi){h+=`<section class="bots-mine"><div class="bots-plot-row"><b>⛏️ ${esc(T('bots.mine_title'))}</b><span class="bots-lvl">${esc(T('bots.mine_lvl',{n:mi.level,m:mi.max}))}</span></div><p class="ret-meta">${esc(T('bots.mine_sub',{c:(mi.level-1)*mi.perLevel}))}</p>`;
  if(mi.price==null)h+=`<p class="ret-note small">${esc(T('bots.mine_max'))}</p>`;else if(!mi.open)h+=`<p class="ret-note small">${esc(T('bots.hire_locked'))}</p>`;
  else h+=`<button type="button" class="ret-main ret-wide" data-mine ${busy?'disabled':''}>${esc(T('bots.mine_up',{n:mi.level+1,p:mi.price,c:mi.perLevel}))}</button>${typeof mp==='number'&&mp<mi.price?`<p class="ret-meta">${esc(T('bots.hire_poor'))}</p>`:''}`;
  h+='</section>';}
 // hire for Moon Points
 h+=`<section class="bots-shop"><h3 class="bots-h">${esc(T('bots.hire_title'))}</h3>`;
 if(!hi.open)h+=`<p class="ret-note small">${esc(T('bots.hire_locked'))}</p>`;else if(hi.price==null)h+=`<p class="ret-note small">${esc(T('bots.hire_full',{n:v.bots.filter(b=>b.source!=='stars').length}))}</p>`;
 else{h+='<div class="bots-hire">'+view.profs.map(p=>`<button type="button" data-hire="${p}" ${busy?'disabled':''}><span>${ICON[p]}</span><b>${esc(T('bots.p_'+p))}</b><small>${esc(T('bots.d_'+p))}</small></button>`).join('')+'</div>';
  h+=`<p class="ret-meta bots-price">🌙 ${esc(T('bots.hire',{p:hi.price}))}${typeof mp==='number'&&mp<hi.price?' · '+esc(T('bots.hire_poor')):''}</p>`;}
 // 24 h boost bots for Telegram Stars (never Moon Points)
 const bo=v.boost;if(bo&&bo.enabled){h+=`<h3 class="bots-h">⭐ ${esc(T('bots.boost_title'))}</h3><p class="ret-note small">${esc(T('bots.boost_sub'))}</p><div class="bots-boost">`+bo.profs.map(p=>`<button type="button" data-boost="${p}" ${busy||bo.active>=bo.maxActive||bo.today>=bo.perDay||!window.Telegram?.WebApp?.openInvoice?'disabled':''}>${ICON[p]} ${esc(T('bots.p_'+p))}<b>${bo.stars} ⭐</b></button>`).join('')+`</div><p class="ret-meta">${esc(T('bots.boost_limit',{n:bo.today,m:bo.perDay,a:bo.active,b:bo.maxActive}))}</p>`;}
 h+=`</section><p class="ret-note small">🔔 ${esc(T('bots.remind'))}</p>`;
 d.innerHTML=h;wire(d);show(d);
 clearInterval(tick);tick=setInterval(()=>{if(!d.open)return;let re=false;for(const b of view.bots){const el=d.querySelector(`[data-left="${b.id}"]`);if(!el)continue;const st=stateOf(b);if(st!==(el.closest('.bot-card').classList.contains('ready')?'ready':el.closest('.bot-card').classList.contains('idle')?'idle':'working')){re=true;break;}
  if(st==='working'){const left=Math.max(0,(b.endsAt-now())/1000);el.textContent=T('bots.working',{t:fmt(left)});const bar=el.closest('.bot-main').querySelector('.bot-fill i');if(bar)bar.style.width=Math.round((1-left/Math.max(1,b.shiftSec))*100)+'%';}}if(re)render();},1000);}
function wire(d){const q=(s,f)=>d.querySelectorAll(s).forEach(b=>b.onclick=()=>f(b));
 q('[data-collect]',()=>collect());q('[data-startall]',()=>start(view.bots.filter(b=>stateOf(b)==='idle').map(b=>b.id)));
 q('[data-pick]',b=>{pick=pick===Number(b.dataset.pick)?null:Number(b.dataset.pick);render();});q('[data-prof]',b=>start([Number(b.dataset.for)],b.dataset.prof));q('[data-start]',b=>start([Number(b.dataset.start)]));
 q('[data-hire]',b=>hire(b.dataset.hire));q('[data-mine]',()=>mineUp());q('[data-boost]',b=>boost(b.dataset.boost));}
async function call(path,body){if(busy)return null;busy=true;try{const r=await UI.api(path,body);setView(r.bots);apply(r);return r;}catch(e){const er=e&&e.code||'';toast(er==='not_enough_points'?T('bots.hire_poor'):er==='busy'||er==='collect_first'?T('bots.busy'):er==='need_life1'?T('bots.hire_locked'):er==='max'?T('bots.mine_max'):T('bots.err'));try{setView((await UI.api('/api/bots',{})).bots);}catch{}return null;}finally{busy=false;render();}}
async function load(){if(!UI.online){render();return;}try{const r=await UI.api('/api/bots',{});setView(r.bots);}catch{}if(dlg().open)render();}
async function collect(){const r=await call('/api/bots/collect',{});if(!r)return;const c=r.collected;if(!c||!c.shifts){toast(T('bots.nothing'));return;}buzz('success');
 const list=[];if(c.crystals)list.push('+'+c.crystals+' 💎');if(c.metal)list.push('+'+c.metal+' ⚙️');if(c.points)list.push('+'+c.points+' 🌙');if(c.energy)list.push('+'+c.energy+' ⚡');if(c.build)list.push('+'+c.build+' 🧱');
 toast(T('bots.got',{list:list.join(' · ')}));if(c.built&&c.built.length)setTimeout(()=>toast(T('bots.built',{b:c.built.map(b=>T('bots.b_'+b)).join(', ')})),1600);else if(c.levelUps)setTimeout(()=>toast(T('bots.levelup')),1600);}
async function start(ids,prof){pick=null;const r=await call('/api/bots/start',prof?{ids,prof}:{ids});if(r)buzz('success');}
async function mineUp(){const r=await call('/api/bots/mine',{});if(r&&r.mine){buzz('success');toast(T('bots.mine_done',{n:r.mine.level}));}}
async function hire(prof){const r=await call('/api/bots/hire',{prof});if(r&&r.hired){buzz('success');toast(T('bots.hired',{p:T('bots.p_'+prof)}));}}
async function boost(prof){if(busy)return;const tg=window.Telegram?.WebApp;if(!tg||!tg.openInvoice)return;busy=true;try{const r=await UI.api('/api/stars/invoice',{item:'bot_boost_'+prof});
  tg.openInvoice(r.link,st=>{if(st==='paid'){toast(T('bots.paid'));buzz('success');let n=0;const poll=async()=>{await load();if(++n<6&&!(view&&view.bots.some(b=>b.source==='stars'&&b.expiresInSec>0&&(Date.now()-at)<5000&&b.startedAt&&view.now-b.startedAt<90000)))setTimeout(poll,2000);};setTimeout(poll,1200);}});}
 catch{toast(T('bots.err'));}busy=false;render();}
function badge(){const b=$('#growth-dock [data-bots] .g-dot');if(b)b.hidden=!readyCount();}
function mount(){const dock=$('#growth-dock');if(!dock)return false;if(dock.querySelector('[data-bots]'))return true;const b=document.createElement('button');b.type='button';b.className='gd ret-gd bots-gd';b.dataset.bots='1';
 b.innerHTML=`<span class="gn-icon" aria-hidden="true">🤖</span><span class="gn-label">${esc(T('bots.dock'))}</span><i class="g-dot" hidden></i>`;b.onclick=()=>{render();load();};dock.append(b);badge();return true;}
let tries=0;const iv=setInterval(()=>{if(mount()||++tries>120){clearInterval(iv);if(UI.online)load();}},500);
let first=false;refresh=setInterval(()=>{badge();if(UI.online&&document.visibilityState!=='hidden'&&(!first||(Date.now()-at)>180000)){first=true;load();}},15000);
const early=setInterval(()=>{if(UI.online&&!first){first=true;clearInterval(early);load();}},700);setTimeout(()=>clearInterval(early),60000);
document.addEventListener('moonkatty:lang',()=>{const l=$('#growth-dock [data-bots] .gn-label');if(l)l.textContent=T('bots.dock');if(dlg().open)render();});
window.MoonBots={get view(){return view;},get at(){return at;},open:()=>{render();load();},load,setView,readyCount};
})();
