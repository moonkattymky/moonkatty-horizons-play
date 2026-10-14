/* v86 daily life unlock. LIFE #1 is open at once; each next LIFE opens 24 h after the previous LIFE was completed (the server
   stamps the completion and refuses story checkpoints of a waiting LIFE — /api/story/checkpoint 423 life_locked). Each invited
   friend who qualifies gives one instant unlock. Stars never skip the wait. This file only draws: the countdown in the end-of-
   chapter dialog, the «Next Life opens in» screen, the lock on the cover / HUD / chapter list, and blocks story targets of a
   waiting LIFE (expeditions, resources, daily tasks, bots, mines and the house keep working). Without the server: no lock. */
(function(){'use strict';
const Game=window.MoonGame,GL=window.MoonGrowthLife,G=window.MoonGrowth;if(!Game||!GL||typeof document==='undefined')return;
const $=s=>document.querySelector(s),T=(k,p)=>window._t?window._t(k,p):k,pend={};let wasLocked=null;
const pad=n=>String(Math.max(0,Math.floor(n))).padStart(2,'0');
function fmt(ms){const s=Math.max(0,Math.ceil(ms/1000));return pad(s/3600)+':'+pad(s%3600/60)+':'+pad(s%60);}
// {life, at (local ms)} when LIFE n (default: the current chapter) waits, else null
function lockFor(state,n){const info=GL.info();if(!info||!GL.online()||!state)return null;const ch=n||Number(state.chapter)||1;if(ch<2||ch>9||!(info.hours>0))return null;
 if(info.next===ch&&info.locked&&info.opensAt)return{life:ch,at:Number(info.opensAt)-GL.skew()};
 const prev='life'+(ch-1),done=GL.done();if((info.open||[]).includes(ch)||done.includes(prev)||done.some(k=>new RegExp('^c'+ch+'_|^life'+ch+'$').test(k)))return null;
 // the previous LIFE is complete in the save but the server has not stamped it yet: it will wait a full day from now
 let local=[];try{local=G&&G.storyCheckpoints?G.storyCheckpoints(state):[];}catch{}if(!local.includes(prev))return null;
 if(!pend[ch])pend[ch]=Date.now()+info.hours*3600000;return{life:ch,at:pend[ch],pending:true};}
const left=lk=>lk?Math.max(0,lk.at-Date.now()):0;
const locked=(state,n)=>{const lk=lockFor(state,n);return lk&&left(lk)>0?lk:null;};
// a story target of the current chapter while its LIFE waits
function blocks(state,id){const lk=locked(state);if(!lk)return null;try{const q=window.MoonCore?window.MoonCore.quest(state):null;if(q&&Array.isArray(q.targets)&&!q.targets.includes(id))return null;}catch{}return lk;}
function waitHtml(lk){const info=GL.info()||{},tokens=Number(info.tokens)||0;
 return `<div class="lg-clock" aria-live="off"><span class="lg-lock" aria-hidden="true">🔒</span><b class="lg-count" data-at="${lk.at}">${fmt(left(lk))}</b></div>
 <p class="lg-meanwhile">${T('lg.meanwhile')}</p>
 <div class="lg-chips"><button type="button" data-lg="daily">🗺️ <span>${T('lg.c_daily')}</span></button><button type="button" data-lg="bots">🤖 <span>${T('lg.c_bots')}</span></button><button type="button" data-lg="mines">⛏️ <span>${T('lg.c_mines')}</span></button><button type="button" data-lg="house">🏠 <span>${T('lg.c_house')}</span></button></div>
 ${tokens>0?`<button type="button" class="primary lg-use" data-lg="use">🔓 ${T('lg.use',{n:tokens})}</button>`:''}
 <button type="button" class="${tokens>0?'secondary':'primary'} lg-invite" data-lg="invite">🐾 ${T('lg.invite')}</button>
 <p class="lg-hint">${T('lg.hint')} ${T('lg.notify')}</p>`;}
function chip(k){const close=()=>{const d=$('#life-wait');if(d&&d.open)d.close();const e=$('#end');if(e&&e.open)e.close();};
 if(k==='invite'){GL.invite();return;}
 if(k==='use'){const lk=lockFor(Game.state);if(!lk)return;GL.unlock(lk.life).then(r=>{if(r&&r.life&&!r.life.locked){close();Game.toast(T('lg.opened',{n:lk.life}));tick(true);}}).catch(()=>Game.toast(T('net.e_server')));return;}
 close();setTimeout(()=>{try{if(k==='daily'&&window.MoonDailyMap)MoonDailyMap.open();else if((k==='bots'||k==='mines')&&window.MoonBots)MoonBots.open();else if(k==='house'&&window.MoonCatHouse)MoonCatHouse.open();else if(window.MoonGrowthUI&&k==='daily')MoonGrowthUI.openTasks();}catch{}},60);}
function wire(root){root.querySelectorAll('[data-lg]').forEach(b=>b.onclick=()=>chip(b.dataset.lg));}
// «Next Life opens in HH:MM:SS» screen
function showWait(n){const lk=locked(Game.state,n);if(!lk)return false;let d=$('#life-wait');
 if(!d){d=document.createElement('dialog');d.id='life-wait';d.className='life-wait';d.setAttribute('aria-labelledby','lg-title');document.body.append(d);d.addEventListener('click',e=>{if(e.target===d)d.close();});}
 d.innerHTML=`<button class="close-icon" data-lgclose aria-label="${T('growth.zakryt')}">×</button><span class="eyebrow">${T('lg.eyebrow')}</span><h2 id="lg-title">${T('lg.title_n',{n:lk.life})}</h2>${waitHtml(lk)}<button type="button" class="lg-ok" data-lgclose>${T('lg.ok')}</button>`;
 d.querySelectorAll('[data-lgclose]').forEach(b=>b.onclick=()=>d.close());wire(d);document.querySelectorAll('dialog[open]').forEach(x=>{if(x!==d)x.close();});if(!d.open)Game.openDialog('life-wait');return true;}
// end-of-chapter dialog: the next LIFE will wait (the server stamps the completion when the player moves on)
function decorateEnd(ch){const e=$('#end');if(!e)return;e.querySelector('.lg-end')?.remove();if(!(ch>=1&&ch<9))return;const info=GL.info();if(!info||!GL.online()||!(info.hours>0)||(info.open||[]).includes(ch+1))return;
 if(info.next&&info.next>ch+1)return;let lk=locked(Game.state,ch+1);if(!lk){if(info.next===ch+1&&!info.locked)return;lk={life:ch+1,at:Date.now()+info.hours*3600000};pend[ch+1]=pend[ch+1]||lk.at;}
 const box=document.createElement('div');box.className='lg-end';box.innerHTML=`<span class="eyebrow">${T('lg.eyebrow')}</span><h3>${T('lg.title')}</h3>${waitHtml(lk)}`;wire(box);
 const next=$('#end-next');e.insertBefore(box,next);e.classList.add('lg-has');}
function chapterStatus(state,n){const lk=locked(state,n);return lk?{text:T('lg.status',{t:fmt(left(lk))}),at:lk.at}:null;}
// cover + HUD banner, live countdowns, «LIFE #N is open» toast
function banner(id,parent,before){let b=document.getElementById(id);if(!b&&parent){b=document.createElement('button');b.type='button';b.id=id;b.className='lg-banner';b.hidden=true;b.onclick=()=>showWait();parent.insertBefore(b,before||null);}return b;}
function tick(force){const st=Game.state,lk=locked(st);document.querySelectorAll('.lg-count').forEach(el=>{const at=Number(el.dataset.at);el.textContent=fmt(at-Date.now());});
 const cov=banner('lg-cover',$('#cover .cover-copy'),$('#begin')),hud=banner('lg-hud',document.body);
 const txt=lk?`🔒 ${T('lg.title_n',{n:lk.life})} <b>${fmt(left(lk))}</b>`:'';
 for(const b of[cov,hud]){if(!b)continue;b.hidden=!lk;if(lk&&b.innerHTML!==txt)b.innerHTML=txt;}
 if(hud)hud.classList.toggle('on',!!lk&&!!Game.running);
 const now=!!lk;if(wasLocked&&!now&&!force){Game.toast(T('lg.opened',{n:wasLocked}));GL.refresh().catch(()=>{});}wasLocked=lk?lk.life:null;
 if(!now&&$('#life-wait')?.open)$('#life-wait').close();}
setInterval(tick,1000);
window.MoonLife={lockFor,locked,blocks,showWait,decorateEnd,chapterStatus,fmt,update:()=>tick(true),tick};tick(true);
})();
