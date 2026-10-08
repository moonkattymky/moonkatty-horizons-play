/* Growth stage 1 UI: «Вахта на базе» daily streak, «Пригласи члена экипажа», «Поделиться», channel/social tasks
   and optional cloud save. Everything works offline (localStorage); server features switch on when API_BASE is set
   and the game runs inside Telegram (signed initData). Rules live in growth-core.js. */
(function(){'use strict';
const Game=window.MoonGame,G=window.MoonGrowth,cfg=window.MoonGrowthConfig||{};if(!Game||!G)return;
const $=s=>document.querySelector(s),S=()=>Game.state,tg=()=>window.Telegram?.WebApp||null;
const root=$('#app-viewport')||document.body;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const plural=(n,a,b,c)=>{const m10=n%10,m100=n%100;return m10===1&&m100!==11?a:m10>=2&&m10<=4&&(m100<12||m100>14)?b:c;};
const API=String(cfg.API_BASE||'').replace(/\/+$/,'');
let online=false,serverUser=null,crew={count:0,list:[]},channelInfo={enabled:false,rewarded:false},lastCloud=0,cloudTimer=0,booted=false;

const ICON={
 crystal:'<svg class="gi gi-crystal" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.8 19.4 9 12 22.2 4.6 9Z" fill="#2f7dff"/><path d="M12 1.8 15.2 9 12 22.2 8.8 9Z" fill="#8ccaff"/><path d="M4.6 9h14.8" stroke="#e3f3ff" stroke-width="1.1"/></svg>',
 metal:'<svg class="gi gi-metal" viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 17.5 6.5 9h11l4 8.5Z" fill="#7f97aa"/><path d="M6.5 9h11L16 12.4H8Z" fill="#e1ebf2"/><path d="M2.5 17.5h19" stroke="#c9d7e1" stroke-width="1"/></svg>',
 energy:'<svg class="gi gi-energy" viewBox="0 0 24 24" aria-hidden="true"><path d="M13.6 1.5 4.8 13.4h6.1l-1.4 9.1 9.7-12.6h-6.4Z" fill="#ffcf5c"/></svg>',
 chest:'<svg class="gi gi-chest" viewBox="0 0 48 40" aria-hidden="true"><path d="M5 16h38v19a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3Z" fill="#b97a2a"/><path d="M5 16c0-8 6-13 19-13s19 5 19 13Z" fill="#e9b45a"/><path d="M5 16h38v5H5Z" fill="#ffe2a0"/><rect x="20" y="17" width="8" height="10" rx="2" fill="#2b6ee8"/><path d="M24 19.5 26 22l-2 3-2-3Z" fill="#bfe3ff"/><path d="M12 3.8v34M36 3.8v34" stroke="#8a561a" stroke-width="2"/></svg>',
 gift:'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="3.5" y="10" width="17" height="10.5" rx="1.8"/><path d="M2.5 7h19v3h-19zM12 7v13.5M12 7C10.5 3 6.5 2.8 6.5 5.2S12 7 12 7Zm0 0c1.5-4 5.5-4.2 5.5-1.8S12 7 12 7Z"/></svg>',
 crew:'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="9" cy="8" r="3.4"/><path d="M2.8 20c.6-3.8 3-5.8 6.2-5.8s5.6 2 6.2 5.8"/><circle cx="17" cy="9" r="2.6"/><path d="M16.4 14.3c2.6 0 4.4 1.6 4.9 4.6"/></svg>',
 tasks:'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 13v8M8.5 21h7"/><path d="M5.2 6.8a9.5 9.5 0 0 1 13.6 0M7.8 9.4a5.8 5.8 0 0 1 8.4 0"/><circle cx="12" cy="12.4" r="1.6" fill="currentColor"/></svg>',
 share:'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3.5M7.5 8 12 3.5 16.5 8"/><path d="M5 12.5v6.2A1.8 1.8 0 0 0 6.8 20.5h10.4a1.8 1.8 0 0 0 1.8-1.8v-6.2"/></svg>',
 telegram:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#2aa3e0"/><path d="M5.6 11.7 17.2 7.2c.6-.2 1.1.1.9.9l-2 9.3c-.1.6-.6.8-1.1.5l-3-2.2-1.5 1.4c-.2.2-.3.3-.6.3l.2-3.1 5.6-5.1c.3-.2-.1-.4-.4-.2l-6.9 4.4-3-.9c-.6-.2-.6-.6.1-.9Z" fill="#fff"/></svg>',
 youtube:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="1.5" y="5" width="21" height="14" rx="4.5" fill="#ff3d3d"/><path d="m10 9 5.2 3-5.2 3Z" fill="#fff"/></svg>',
 tiktok:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="1.5" y="1.5" width="21" height="21" rx="6" fill="#111"/><path d="M13.4 5.5h2.3c.2 1.6 1.3 2.8 3 3v2.3c-1.1 0-2.1-.3-3-.9v4.8a4.3 4.3 0 1 1-4.3-4.3h.4v2.4h-.4a1.9 1.9 0 1 0 1.9 1.9Z" fill="#fff"/><path d="M13.4 5.5h.8v9.6a4.3 4.3 0 0 1-4.3 4.3" stroke="#25f4ee" stroke-width=".7" fill="none"/></svg>',
 instagram:'<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="gig" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#feda75"/><stop offset=".45" stop-color="#d62976"/><stop offset="1" stop-color="#4f5bd5"/></linearGradient></defs><rect x="1.5" y="1.5" width="21" height="21" rx="6" fill="url(#gig)"/><rect x="6" y="6" width="12" height="12" rx="3.6" fill="none" stroke="#fff" stroke-width="1.7"/><circle cx="12" cy="12" r="2.8" fill="none" stroke="#fff" stroke-width="1.7"/><circle cx="16.3" cy="7.7" r=".9" fill="#fff"/></svg>',
 x:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="1.5" y="1.5" width="21" height="21" rx="6" fill="#0f1419"/><path d="M6.5 6h3.3l2.6 3.6L15.5 6h1.8l-4.1 4.7L18 18h-3.3l-2.8-3.9L8.6 18H6.8l4.3-4.9Z" fill="#fff"/></svg>',
 star:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.5 2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 16.8 6.2 20l1.4-6.4-4.9-4.4 6.5-.7Z" fill="#b48cff"/></svg>',
 link:'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.3 1.3"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.3-1.3"/></svg>',
 check:'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>'};
function chips(r,cls=''){if(!r)return'';const out=[];if(r.crystals)out.push(`<span class="gchip ${cls}">${ICON.crystal}+${r.crystals}</span>`);if(r.metal)out.push(`<span class="gchip ${cls}">${ICON.metal}+${r.metal}</span>`);if(r.energy)out.push(`<span class="gchip ${cls}">${ICON.energy}+${r.energy}</span>`);return out.join('');}
function haptic(kind='success'){try{tg()?.HapticFeedback?.notificationOccurred?.(kind);}catch{}}
function toast(t){if(t)Game.toast(t);}
function commit(){Game.save();Game.refresh();updateBadges();if(online)cloudSave(true);}

// ---------- Telegram identity, invite link, links ----------
function tgUser(){const u=tg()?.initDataUnsafe?.user;return u&&Number.isFinite(Number(u.id))?u:null;}
function myId(){return serverUser?.id||(tgUser()?String(tgUser().id):'');}
function invite(){return G.inviteLink(cfg,myId());}
function startParam(){let v=tg()?.initDataUnsafe?.start_param||'';if(!v){try{const q=new URLSearchParams(location.search);v=q.get('tgWebAppStartParam')||q.get('startapp')||q.get('start')||'';}catch{}}return G.parseStartParam(v);}
function openUrl(url){const t=tg(),app=t&&t.initData&&t.platform!=='unknown'?t:null;/* outside Telegram the SDK would navigate the game tab away */try{if(app&&/^https:\/\/t\.me\//.test(url)&&app.openTelegramLink){app.openTelegramLink(url);return;}if(app?.openLink){app.openLink(url);return;}}catch{}window.open(url,'_blank','noopener');}
function absolute(path){try{return new URL(path,location.href).href;}catch{return path;}}
async function copy(text){try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return true;}}catch{}try{const t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.append(t);t.select();const ok=document.execCommand('copy');t.remove();return ok;}catch{return false;}}

// ---------- server (optional) ----------
function initData(){return tg()?.initData||'';}
function setCrew(c){if(c)crew=c;try{window.MoonTeamUI?.onCrew?.(crew);}catch{}}
async function api(path,body={},timeout=9000){if(!API||!initData())throw new Error('offline');const ctrl=typeof AbortController==='function'?new AbortController():null,timer=setTimeout(()=>ctrl?.abort(),timeout);
 try{const r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'tma '+initData()},body:JSON.stringify(body),signal:ctrl?.signal});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||('HTTP '+r.status));return data;}finally{clearTimeout(timer);}}
const tzOffset=()=>-new Date().getTimezoneOffset();
function applyServerRewards(list){let total={crystals:0,metal:0,energy:0},n=0;for(const r of list||[]){const got=G.applyServerReward(S(),r);if(got){n++;for(const k in total)total[k]+=got[k];}}if(n){commit();haptic();toast('Награды экипажа: '+(G.rewardText(total)||'рюкзак полон'));}return n;}
async function claimPending(list){if(!list?.length)return;try{const r=await api('/api/rewards/claim',{ids:list.map(x=>x.id)});applyServerRewards(r.rewards);}catch{}}
async function boot(){if(booted)return;booted=true;const ref=startParam(),s=S();
 if(ref&&ref!==myId()&&!s.growth.refBy){s.growth.refBy=ref;Game.save();setTimeout(()=>toast(online?'Ты в экипаже друга! Бонус уже в пути.':'Ты в экипаже друга! Добро пожаловать на Луну.'),2200);}
 if(!API||!initData()){renderAll();return;}
 try{const r=await api('/api/session',{startParam:ref?'ref_'+ref:'',tzOffset:tzOffset(),local:{updatedAt:s.updatedAt,progress:G.progressScore(s)}});online=true;serverUser=r.user||null;setCrew(r.crew);channelInfo=r.channel||channelInfo;
  if(r.save&&r.save.data&&G.pickSave(S(),r.save.data)==='remote'&&!Game.running){if(Game.replace(r.save.data))toast('Прогресс загружен из облака.');}
  else cloudSave(true);
  if(r.streak)syncServerStreak(r.streak,null);
  await claimPending(r.rewards);}catch(e){online=false;}
 renderAll();}
function cloudSave(force=false){if(!online)return;const now=Date.now();if(!force&&now-lastCloud<15000){clearTimeout(cloudTimer);cloudTimer=setTimeout(()=>cloudSave(true),15000-(now-lastCloud));return;}lastCloud=now;const s=S();
 api('/api/save',{data:s,updatedAt:s.updatedAt}).then(r=>{if(r.crew)setCrew(r.crew);if(r.rewards?.length)claimPending(r.rewards);if(r.accepted===false&&r.save?.data&&!Game.running&&G.pickSave(S(),r.save.data)==='remote')Game.replace(r.save.data);}).catch(()=>{});}
Game.onSave=()=>{if(online)cloudSave(false);};
// Last chance to upload when Telegram hides or closes the Mini App (keepalive survives page unload).
function flushCloud(){if(!online)return;try{fetch(API+'/api/save',{method:'POST',keepalive:true,headers:{'Content-Type':'application/json','Authorization':'tma '+initData()},body:JSON.stringify({data:S(),updatedAt:S().updatedAt})}).catch(()=>{});lastCloud=Date.now();}catch{}}
addEventListener('pagehide',flushCloud);document.addEventListener('visibilitychange',()=>{if(document.hidden)flushCloud();});

// ---------- dialogs ----------
function dialog(id,cls){let d=document.getElementById(id);if(d)return d;d=document.createElement('dialog');d.id=id;d.className='growth-dialog '+cls;root.append(d);d.addEventListener('click',e=>{if(e.target===d)d.close();});return d;}
function open(id){const d=document.getElementById(id);document.querySelectorAll('dialog[open]').forEach(x=>{if(x!==d)x.close();});if(!d.open)Game.openDialog(id);}
const head=(eyebrow,title,id)=>`<div class="g-head"><div><span class="eyebrow">${eyebrow}</span><h2>${title}</h2></div><button class="close-icon" data-gclose="${id}" aria-label="Закрыть">×</button></div>`;
function wireClose(d){d.querySelectorAll('[data-gclose]').forEach(b=>b.onclick=()=>d.close());}

// «Вахта на базе»
const streakDialog=dialog('streak','streak-dialog');let claiming=false;
function renderStreak(flash=0){const s=S(),st=G.streakStatus(s),d=streakDialog;
 const tiles=G.STREAK_REWARDS.map((r,i)=>{const day=i+1,done=day<st.day||(st.claimed&&day===st.day),today=!st.claimed&&day===st.day,big=day===7;
  const icon=big?ICON.chest:r.energy?ICON.energy:r.metal&&!r.crystals?ICON.metal:ICON.crystal;
  return`<div class="st-tile${done?' done':''}${today?' today':''}${big?' big':''}${flash===day?' flash':''}"><small>${done?ICON.check:''}${big?'ДЕНЬ 7 · ГРУЗ':'ДЕНЬ '+day}</small><div class="st-icon">${icon}</div><div class="st-reward">${chips(r)}</div></div>`;}).join('');
 const run=st.claimed?s.streak.run:st.run-1;
 d.innerHTML=head('ЕЖЕДНЕВНАЯ НАГРАДА','Вахта на базе','streak')+
  `<p class="g-lead">${st.claimed?(st.locked?'Часы устройства переведены назад — награда откроется, когда наступит новый день.':'Награда дня '+st.day+' получена. Возвращайся завтра — '+(st.day===7?'начнётся новая неделя вахты.':'дальше награды больше!')):st.broken?'Серия прервалась — вахта начинается заново. Заходи каждый день, чтобы дойти до груза 7-го дня.':'Заходи каждый день — награда растёт. На 7-й день прилетает грузовой контейнер и значок «Вахта».'}</p>`+
  `<div class="st-grid">${tiles}</div>`+
  `<div class="st-meta"><span>Серия: <b>${run} ${plural(run,'день','дня','дней')}</b> подряд</span><span>Рекорд: <b>${Math.max(s.streak.best||0,run)}</b></span></div>`+
  `<button class="primary g-cta" id="streak-claim" ${st.claimed?'disabled':''}>${st.claimed?'Награда получена · до завтра':'Забрать награду · день '+st.day}</button>`+
  `<p class="g-feedback" id="streak-feedback" role="status"></p><p class="g-note">Пропустишь день — вахта начнётся заново с первого дня.${online?'':' Серия хранится на этом устройстве.'}</p>`;
 wireClose(d);$('#streak-claim').onclick=claimStreak;}
function syncServerStreak(sv,reward){const s=S(),st=G.streakStatus(s);if(!sv)return;if(reward&&!st.claimed){const got=G.applyReward(s,reward);s.streak={day:st.today,count:sv.count,run:sv.run,best:Math.max(sv.best||0,s.streak.best||0),total:(s.streak.total||0)+1};return got;}
 if(sv.claimedToday&&!st.claimed){s.streak={day:st.today,count:sv.count,run:sv.run,best:Math.max(sv.best||0,s.streak.best||0),total:s.streak.total||0};}return null;}
async function claimStreak(){if(claiming)return;claiming=true;const s=S();let text='',ok=false,day=G.streakStatus(s).day;
 try{if(online){try{const r=await api('/api/streak/claim',{tzOffset:tzOffset()});const got=syncServerStreak(r.streak,r.reward);if(got){ok=true;day=r.streak.count;text='Вахта · день '+day+': '+G.gotText(got);}else text='Награда за сегодня уже получена на другом устройстве.';}catch{const r=G.claimStreak(s);ok=r.ok;text=r.text;}}
  else{const r=G.claimStreak(s);ok=r.ok;text=r.text;}}finally{claiming=false;}
 if(ok){haptic();commit();renderStreak(day);toast(text);}const f=$('#streak-feedback');if(f)f.textContent=text;}
function openStreak(){renderStreak();open('streak');}

// «Пригласи члена экипажа»
const crewDialog=dialog('crew','crew-dialog');
function renderCrew(){const d=crewDialog,R=G.REFERRAL_REWARDS,link=invite(),inTg=!!tgUser(),list=crew.list||[];
 const friends=list.length?`<ul class="crew-list">${list.map(f=>`<li><span class="crew-ava">${esc((f.name||'?').slice(0,1).toUpperCase())}</span><span class="crew-name">${esc(f.name||'Член экипажа')}${f.premium?`<i class="crew-prem" title="Telegram Premium">${ICON.star}</i>`:''}<small>${f.status==='completed'?'Прошёл жизнь #1 · награда получена':'В экипаже · ждём прохождения жизни #1'}</small></span><span class="crew-st ${f.status}">${f.status==='completed'?ICON.check:'…'}</span></li>`).join('')}</ul>`
  :online?`<div class="crew-empty"><b>Пока никого</b><span>Отправь ссылку другу — его аватар появится здесь, а ты сразу получишь ${chips(R.joinReferrer,'small')}</span></div>`
  :`<div class="crew-soon"><span class="soon-tag">СКОРО</span><b>Награды за друзей готовятся к запуску</b><span>Сервер экипажа ещё подключается. Ссылку можно отправлять уже сейчас — когда награды заработают, друзья из твоего экипажа будут засчитаны.</span></div>`;
 d.innerHTML=head('ПРИГЛАСИ ЧЛЕНА ЭКИПАЖА','Собери свой экипаж','crew')+
  `<div class="crew-hero" style="background-image:linear-gradient(180deg,#0b213300 45%,#0b2133e6 100%),url('${esc(cfg.CREW_HERO_IMAGE||'assets/crew-hero-v33.jpg')}')"><span class="crew-count">${ICON.crew}<b>${crew.count||0}</b> ${plural(crew.count||0,'друг','друга','друзей')} в экипаже</span></div>`+
  `<div class="crew-rewards">
    <div class="cr-row"><span class="cr-step">1</span><span class="cr-text"><b>Друг открыл игру по ссылке</b><small>Тебе сразу, другу — стартовый набор ${chips(R.joinInvitee,'small')}</small></span><span class="cr-chips">${chips(R.joinReferrer)}</span></div>
    <div class="cr-row"><span class="cr-step">2</span><span class="cr-text"><b>Друг прошёл жизнь #1</b><small>Полная награда — вам обоим</small></span><span class="cr-chips">${chips(R.full)}</span></div>
    <div class="cr-row prem"><span class="cr-step">${ICON.star}</span><span class="cr-text"><b>Друг с Telegram Premium</b><small>Вместо шага 2 — двойная награда обоим</small></span><span class="cr-chips">${chips(R.fullPremium)}</span></div></div>`+
  `<div class="crew-link"><span class="cl-label">${ICON.link}${inTg?'Твоя личная ссылка':'Ссылка на игру'}</span><code>${esc(link.replace(/^https:\/\//,''))}</code><button id="crew-copy">Копировать</button></div>`+
  (inTg?'':'<p class="g-note">Открой игру в Telegram, чтобы получить личную ссылку с наградами.</p>')+
  `<button class="primary g-cta" id="crew-invite">${ICON.share}Отправить приглашение</button>`+
  (tg()?.shareToStory?`<button class="g-secondary" id="crew-story">Поделиться в истории</button>`:'')+
  `<h3 class="g-sub">Мой экипаж <span>${crew.count||0}</span></h3>${friends}<p class="g-feedback" id="crew-feedback" role="status"></p>`;
 wireClose(d);$('#crew-copy').onclick=async()=>{const ok=await copy(link);$('#crew-feedback').textContent=ok?'Ссылка скопирована. Отправь её другу!':'Не удалось скопировать — нажми «Отправить приглашение».';if(ok)haptic();};
 $('#crew-invite').onclick=()=>shareChat('invite');if($('#crew-story'))$('#crew-story').onclick=shareStory;}
function openCrew(){renderCrew();open('crew');if(online)api('/api/crew',{}).then(r=>{setCrew(r.crew);if(crewDialog.open)renderCrew();}).catch(()=>{});}

// «Поделиться»
const shareDialog=dialog('share','share-dialog');let shareContext='invite';
function shareText(kind){const ch=S().chapter;if(kind==='chapter')return`Я прошёл «Жизнь #${Math.max(1,ch-1)}» в MOONKATTY 🌕 Кот-космонавт ищет экипаж — летишь со мной?`;return'Я исследую Луну вместе с котом-космонавтом MOONKATTY 🚀 Присоединяйся к моему экипажу — получим бонусные кристаллы!';}
function rewardShare(){const r=G.claimShare(S());if(r.ok){commit();setTimeout(()=>toast(r.text),600);}}
function shareChat(kind=shareContext){const link=invite(),text=shareText(kind);if(tg())openUrl(G.shareUrl(link,text));else if(navigator.share)navigator.share({title:'MOONKATTY · New Horizons',text,url:link}).catch(()=>{});else openUrl(G.shareUrl(link,text));rewardShare();}
function shareStory(){const app=tg(),link=invite();if(!app?.shareToStory){shareChat();return;}const opts={text:'Лечу на Луну с MOONKATTY 🚀 Присоединяйся к экипажу!'};if(tgUser()?.is_premium)opts.widget_link={url:link,name:'Играть в MOONKATTY'};else opts.text+=' '+link;
 try{app.shareToStory(absolute(cfg.SHARE_STORY_IMAGE),opts);rewardShare();}catch{shareChat();}}
function renderShare(){const d=shareDialog,story=!!tg()?.shareToStory,claimed=S().growth.shareDay===G.localDay();
 d.innerHTML=head('ПОДЕЛИТЬСЯ','Расскажи о MOONKATTY','share')+
  `<div class="share-preview"><img src="${esc(cfg.SHARE_CARD_IMAGE)}" alt="Картинка MOONKATTY с котом-космонавтом" loading="lazy"></div>`+
  `<p class="g-lead">${shareContext==='chapter'?'Отличная работа! Покажи друзьям, как далеко продвинулась экспедиция.':'Картинка с котом-космонавтом и твоя личная ссылка-приглашение.'}</p>`+
  (story?`<button class="primary g-cta" id="share-story">${ICON.share}В историю Telegram</button><button class="g-secondary" id="share-chat">Отправить в чат</button>`:`<button class="primary g-cta" id="share-chat">${ICON.share}Отправить в чат</button>`)+
  `<button class="g-secondary" id="share-copy">${ICON.link}Скопировать ссылку</button>`+
  `<div class="share-bonus ${claimed?'done':''}">${claimed?'Бонус за сегодня получен':'Первый раз за день'} ${chips(G.SHARE_REWARD,'small')}</div><p class="g-feedback" id="share-feedback" role="status"></p>`;
 wireClose(d);if($('#share-story'))$('#share-story').onclick=()=>{shareStory();renderShare();};$('#share-chat').onclick=()=>{shareChat(shareContext);renderShare();};
 $('#share-copy').onclick=async()=>{const ok=await copy(invite());$('#share-feedback').textContent=ok?'Ссылка скопирована.':'Не удалось скопировать ссылку.';};}
function openShare(kind='invite'){shareContext=kind;renderShare();open('share');}

// Задания: канал + соцсети
const tasksDialog=dialog('tasks','tasks-dialog');let channelBusy=false,channelMsg='';
function socialUrl(id){if(id==='chat'){const c=String(cfg.CHAT_USERNAME||'').trim().replace(/^@/,'');return /^[A-Za-z0-9_]{4,}$/.test(c)?'https://t.me/'+c:'';}return String(cfg.SOCIAL?.[id]||'');}
function socialTasks(){return G.SOCIAL_TASKS.filter(t=>/^https:\/\//.test(socialUrl(t.id)));}
function renderTasks(){const d=tasksDialog,s=S(),ch=String(cfg.CHANNEL_USERNAME||'').replace(/^@/,''),st=G.streakStatus(s),shareDone=s.growth.shareDay===G.localDay();
 const channelDone=s.growth.channel||channelInfo.rewarded;
 const channel=ch?`<div class="task-hero ${channelDone?'done':''}"><div class="th-top">${ICON.telegram}<div><b>Подпишись на канал MOONKATTY</b><small>Новости экспедиции, коды сигналов и новые главы</small></div></div>
   <div class="th-reward">${chips(G.CHANNEL_REWARD)}<span class="gchip badge">Значок «Связист»</span></div>
   ${channelDone?`<div class="th-state ok">${ICON.check}Подписка подтверждена · награда получена</div>`:`<div class="th-actions"><button class="primary" id="channel-open">Подписаться</button><button id="channel-check" ${online?'':'disabled'}>${channelBusy?'Проверяем…':'Проверить'}</button></div><div class="th-state ${online?'':'pending'}">${esc(channelMsg)||(online?'Подпишись, затем нажми «Проверить».':'Проверка подписки скоро заработает — награда будет ждать тебя.')}</div>`}</div>`:'';
 const row=(icon,title,sub,reward,btn,cls='')=>`<div class="task-row ${cls}"><span class="tr-icon">${icon}</span><span class="tr-text"><b>${title}</b><small>${sub}</small></span><span class="tr-side">${reward}${btn}</span></div>`;
 const socials=socialTasks().map(t=>{const ss=G.socialState(s,t.id);const btn=ss.state==='claimed'?`<i class="tr-done">${ICON.check}</i>`:ss.state==='ready'?`<button class="tr-btn gold" data-social-claim="${t.id}">Забрать</button>`:ss.state==='waiting'?`<button class="tr-btn" disabled>0:${String(Math.ceil(ss.left/1000)).padStart(2,'0')}</button>`:`<button class="tr-btn" data-social-open="${t.id}">Открыть</button>`;
  return row(ICON[t.id==='chat'?'telegram':t.id],t.title,ss.state==='waiting'?'Проверяем переход…':ss.state==='ready'?'Готово — забери награду':t.name+' · MOONKATTY',ss.state==='claimed'?'':chips(t.reward,'small'),btn,ss.state);}).join('');
 d.innerHTML=head('ЗАДАНИЯ · БОНУСЫ','Связь с Землёй','tasks')+
  `<p class="g-lead">Помоги экспедиции стать известной — за каждое задание кристаллы и металл.</p>`+channel+(window.MoonTeamUI?window.MoonTeamUI.codeCard():'')+
  `<div class="task-list">`+
   row(ICON.gift,'Вахта на базе',st.claimed?'День '+st.day+' из 7 · награда получена':'День '+st.day+' из 7 · награда ждёт',st.claimed?'':chips(st.reward,'small'),`<button class="tr-btn ${st.claimed?'':'gold'}" data-go="streak">${st.claimed?'Открыть':'Забрать'}</button>`,st.claimed?'claimed':'ready')+
   row(ICON.crew,'Пригласи друга','Награда за каждого члена экипажа',chips(G.REFERRAL_REWARDS.full,'small'),'<button class="tr-btn" data-go="crew">Позвать</button>')+
   row(ICON.share,'Поделись игрой',shareDone?'Сегодня уже поделился · спасибо!':'Раз в день · в чат или в историю',shareDone?'':chips(G.SHARE_REWARD,'small'),`<button class="tr-btn" data-go="share">${shareDone?'Ещё раз':'Поделиться'}</button>`,shareDone?'claimed':'')+
  `</div>`+(socials?`<h3 class="g-sub">Мы в соцсетях</h3><div class="task-list">${socials}</div><p class="g-note">Задания соцсетей засчитываются через 30 секунд после перехода.</p>`:'');
 wireClose(d);
 d.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>({streak:openStreak,crew:openCrew,share:()=>openShare('invite')})[b.dataset.go]());
 d.querySelectorAll('[data-social-open]').forEach(b=>b.onclick=()=>{const id=b.dataset.socialOpen;G.startSocial(S(),id);Game.save();openUrl(socialUrl(id));renderTasks();});
 d.querySelectorAll('[data-social-claim]').forEach(b=>b.onclick=()=>{const r=G.claimSocial(S(),b.dataset.socialClaim);if(r.ok){haptic();commit();}toast(r.text);renderTasks();});
 if($('#channel-open'))$('#channel-open').onclick=()=>{openUrl('https://t.me/'+ch);channelMsg=online?'Подписался? Нажми «Проверить».':'Спасибо! Проверка подписки скоро заработает — награда будет ждать тебя.';renderTasks();};
 if($('#channel-check'))$('#channel-check').onclick=checkChannel;window.MoonTeamUI?.wireCode?.(d);}
async function checkChannel(){if(channelBusy||!online)return;channelBusy=true;renderTasks();try{const r=await api('/api/channel/check',{});if(r.member){channelInfo.rewarded=true;S().growth.channel=true;if(r.reward)applyServerRewards([r.reward]);else commit();channelMsg='';haptic();}else{channelMsg=r.error==='channel_not_configured'?'Проверка канала ещё настраивается.':'Пока не видим подписку. Подпишись и нажми «Проверить» ещё раз.';haptic('warning');}}catch{channelMsg='Нет связи с сервером. Попробуй чуть позже.';}channelBusy=false;renderTasks();}
function openTasks(){renderTasks();open('tasks');}

// ---------- entry points ----------
const OPEN={streak:openStreak,crew:openCrew,tasks:openTasks,share:()=>openShare('invite')};
function navButton(kind,label,cls){const b=document.createElement('button');b.className=cls;b.dataset.growth=kind;b.innerHTML=`<span class="gn-icon">${ICON[{streak:'gift',crew:'crew',tasks:'tasks',share:'share'}[kind]]}</span><span class="gn-label">${label}</span><i class="g-dot" hidden></i>`;b.onclick=()=>OPEN[kind]();return b;}
function mount(){
 const coverNav=$('.cover-navigation');if(coverNav&&!$('.growth-nav')){const nav=document.createElement('nav');nav.className='growth-nav';nav.setAttribute('aria-label','Бонусы и экипаж');nav.append(navButton('streak','Вахта','gn'),navButton('crew','Экипаж','gn'),navButton('tasks','Задания','gn'));coverNav.after(nav);}
 const menuNav=$('.menu-navigation');if(menuNav&&!menuNav.querySelector('[data-growth]')){for(const[k,l]of[['streak','Вахта на базе'],['crew','Экипаж'],['tasks','Задания'],['share','Поделиться']]){const b=navButton(k,l,'gm');b.addEventListener('click',()=>$('#chapters')?.close(),true);menuNav.append(b);}}
 if(!$('#growth-dock')){const dock=document.createElement('div');dock.id='growth-dock';dock.setAttribute('aria-label','Бонусы');for(const[k,l]of[['streak','Вахта'],['crew','Экипаж'],['tasks','Задания']])dock.append(navButton(k,l,'gd'));root.append(dock);}
 const daily=$('.daily-panel');if(daily&&!$('#streak-strip')){const strip=document.createElement('button');strip.id='streak-strip';strip.type='button';strip.onclick=()=>{$('#cards')?.close();openStreak();};daily.parentNode.insertBefore(strip,daily);}
 const end=$('#end-next');if(end&&!$('#end-share')){const b=document.createElement('button');b.id='end-share';b.className='g-secondary';b.innerHTML=ICON.share+'Поделиться с друзьями';b.onclick=()=>{$('#end')?.close();openShare('chapter');};end.after(b);}
}
function updateBadges(){const s=S(),st=G.streakStatus(s),cover=$('#cover'),dock=$('#growth-dock');
 const socialReady=socialTasks().some(t=>G.socialState(s,t.id).state==='ready'),alerts={streak:!st.claimed,crew:false,tasks:socialReady||(!st.claimed),share:false};
 document.querySelectorAll('[data-growth]').forEach(b=>{const dot=b.querySelector('.g-dot');if(dot)dot.hidden=!alerts[b.dataset.growth];});
 document.querySelectorAll('.growth-nav [data-growth="streak"] .gn-label,#growth-dock [data-growth="streak"] .gn-label').forEach(l=>l.textContent=st.claimed?'Вахта ✓':'День '+st.day);
 if(dock)dock.hidden=!cover||!cover.hidden;
 const strip=$('#streak-strip');if(strip){strip.className=st.claimed?'claimed':'ready';strip.innerHTML=`<span class="ss-dots">${[1,2,3,4,5,6,7].map(d=>`<i class="${d<st.day||(st.claimed&&d===st.day)?'on':d===st.day?'now':''}"></i>`).join('')}</span><span class="ss-text"><span class="eyebrow">ВАХТА НА БАЗЕ</span><b>${st.claimed?'День '+st.day+' из 7 · получено':'День '+st.day+' из 7 · награда ждёт'}</b></span><span class="ss-go">${st.claimed?'›':'Забрать'}</span>`;}}
function renderAll(){updateBadges();if(streakDialog.open)renderStreak();if(crewDialog.open)renderCrew();if(tasksDialog.open)renderTasks();if(shareDialog.open)renderShare();}
mount();updateBadges();
setInterval(()=>{updateBadges();if(tasksDialog.open&&socialTasks().some(t=>G.socialState(S(),t.id).state==='waiting'))renderTasks();},1000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){renderAll();maybeShowStreak(1200);}});
function maybeShowStreak(delay=900){setTimeout(()=>{const s=S();if(document.querySelector('dialog[open]')||!G.shouldShowStreak(s))return;G.markStreakSeen(s);Game.save();openStreak();},delay);}
// Wait briefly for telegram-web-app.js (loaded async by telegram-viewport.js) before talking to the server.
let waited=0;(function waitTelegram(){if(tg()?.initData||waited>=2500||!API){boot();return;}waited+=250;setTimeout(waitTelegram,250);})();
maybeShowStreak(1100);
window.MoonGrowthUI={openStreak,openCrew,openTasks,openShare,maybeStreak:maybeShowStreak,api,kit:{ICON,chips,dialog,open,head,wireClose,haptic,commit,esc,plural},get crew(){return crew;},get user(){return serverUser;},get online(){return online;},renderAll};
})();
