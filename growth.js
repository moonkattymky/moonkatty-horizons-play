/* Growth UI: «Вахта на базе» daily streak, «Пригласи члена экипажа», «Поделиться», «Связь с Землёй» tasks,
   Moon Points display and optional cloud save. Everything works offline (localStorage); server features switch on when
   API_BASE is set and the game runs inside Telegram (signed initData). Rules live in growth-core.js.
   v37: Moon Points come only from the server (a cached copy is shown); offline they read «available after launch».
   Social tasks = personal MKTY code + link reviewed by the team; signal codes and the channel are checked on the server. */
(function(){'use strict';
const Game=window.MoonGame,G=window.MoonGrowth,cfg=window.MoonGrowthConfig||{};if(!Game||!G)return;
const $=s=>document.querySelector(s),S=()=>Game.state,tg=()=>window.Telegram?.WebApp||null;
const root=$('#app-viewport')||document.body;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const plural=(n,a,b,c)=>{const m10=n%10,m100=n%100;return m10===1&&m100!==11?a:m10>=2&&m10<=4&&(m100<12||m100>14)?b:c;};
const API=String(cfg.API_BASE||'').replace(/\/+$/,'');
let online=false,serverUser=null,crew={count:0,joined:0,list:[]},channelInfo={enabled:false,rewarded:false},lastCloud=0,cloudTimer=0,booted=false;
let session=null,social=null,rules=null,stage3=null;// stage3 (v39): {season,goal,shop} from the server// session: {token,exp} after /api/session; social: personal code + statuses; rules: numbers from the server

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
 check:'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
 // v41 icons: moon coin = Moon Points, cup = season points (⭐ is used only for Telegram Stars).
 moon:'<svg class="gi gi-moon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.4" fill="#e9ad35"/><circle cx="12" cy="12" r="8.6" fill="#ffd772" stroke="#fff0b8" stroke-width=".9"/><path d="M14.2 6.3a6.1 6.1 0 1 0 3.6 10.3 5 5 0 1 1-3.6-10.3Z" fill="#c98419"/><circle cx="8.6" cy="9.4" r=".9" fill="#fff4cc"/></svg>',
 cup:'<svg class="gi gi-cup" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.8 5.4H4.4a2.7 2.7 0 0 0 3.1 4.6M17.2 5.4h2.4a2.7 2.7 0 0 1-3.1 4.6" fill="none" stroke="#f3b23a" stroke-width="1.7" stroke-linecap="round"/><path d="M6.8 3.2h10.4v5.6a5.2 5.2 0 0 1-10.4 0Z" fill="#ffcf4f"/><path d="M9.4 4.6v4" stroke="#fff3c4" stroke-width="1.3" stroke-linecap="round"/><path d="M10.5 13.7h3l.5 3.5h-4Z" fill="#e3a12b"/><rect x="7.6" y="17.2" width="8.8" height="3.6" rx="1.1" fill="#b9771b"/></svg>'};
function chips(r,cls=''){if(!r)return'';const out=[];if(!online&&(r.points||r.pending))out.push(`<span class="gchip mp later ${cls}" title="${esc(_t('moon.after_launch'))}">${ICON.moon}${_t('growth.skoro')}</span>`);else{if(r.points)out.push(`<span class="gchip mp ${cls}">${ICON.moon}+${r.points}</span>`);if(r.pending)out.push(`<span class="gchip mp pend ${cls}">${ICON.moon}+${r.pending}<i aria-hidden="true">⏳</i></span>`);}if(r.cup)out.push(`<span class="gchip cup ${cls}">${ICON.cup}+${r.cup}</span>`);if(r.crystals)out.push(`<span class="gchip ${cls}">${ICON.crystal}+${r.crystals}</span>`);if(r.metal)out.push(`<span class="gchip ${cls}">${ICON.metal}+${r.metal}</span>`);if(r.energy)out.push(`<span class="gchip ${cls}">${ICON.energy}+${r.energy}</span>`);return out.join('');}
function haptic(kind='success'){try{tg()?.HapticFeedback?.notificationOccurred?.(kind);}catch{}}
function toast(t){if(t)Game.toast(t);}
function commit(){Game.save();Game.refresh();updateBadges();if(online)cloudSave(true);}

// ---------- Telegram identity, invite link, links ----------
function tgUser(){const u=tg()?.initDataUnsafe?.user;return u&&Number.isFinite(Number(u.id))?u:null;}
function myId(){return serverUser?.id||(tgUser()?String(tgUser().id):'');}
function invite(){if(!online&&!String(cfg.MINIAPP_SHORTNAME||'').trim()&&cfg.DEMO_URL)return cfg.DEMO_URL;return G.inviteLink(cfg,myId());}
function startParam(){let v=tg()?.initDataUnsafe?.start_param||'';if(!v){try{const q=new URLSearchParams(location.search);v=q.get('tgWebAppStartParam')||q.get('startapp')||q.get('start')||'';}catch{}}return G.parseStartParam(v);}
function openUrl(url){const t=tg(),app=t&&t.initData&&t.platform!=='unknown'?t:null;/* outside Telegram the SDK would navigate the game tab away */try{if(app&&/^https:\/\/t\.me\//.test(url)&&app.openTelegramLink){app.openTelegramLink(url);return;}if(app?.openLink){app.openLink(url);return;}}catch{}window.open(url,'_blank','noopener');}
function absolute(path){try{return new URL(path,location.href).href;}catch{return path;}}
// Share pictures have their text baked in, one per language: 'assets/share/story-{lang}.jpg'.
function langAsset(path){return String(path||'').replace('{lang}',(window.MoonI18n&&MoonI18n.lang)||'en');}
async function copy(text){try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return true;}}catch{}try{const t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.append(t);t.select();const ok=document.execCommand('copy');t.remove();return ok;}catch{return false;}}

// ---------- server (optional) ----------
function initData(){return tg()?.initData||'';}
// Fresh initData (10 min) opens a session; then a 12-hour session token signs every call.
function authHeader(){return session&&session.exp*1000>Date.now()+60000?'session '+session.token:'tma '+initData();}
const M=()=>({...G.MOON,...(rules?{story:rules.story||G.MOON.story,streak:rules.streak||G.MOON.streak,channel:rules.channel??G.MOON.channel,social:rules.social||G.MOON.social,referral:rules.referral??G.MOON.referral,referralCap:rules.referralCap??G.MOON.referralCap,referralDays:rules.referralDays??G.MOON.referralDays,vestDays:rules.vestDays??G.MOON.vestDays,code:rules.code||G.MOON.code,codeFails:rules.codeFails??G.MOON.codeFails,socialPending:rules.socialPending??G.MOON.socialPending}:{})});
// Server balance → local cache (never computed on the phone).
function gotMoon(r){if(r&&r.moon&&G.setMoon(S(),r.moon)){Game.save();updateMoon();}}
function setCrew(c){if(c)crew=c;try{window.MoonTeamUI?.onCrew?.(crew);}catch{}}
async function api(path,body={},timeout=9000){if(!API||!initData())throw new Error('offline');const ctrl=typeof AbortController==='function'?new AbortController():null,timer=setTimeout(()=>ctrl?.abort(),timeout);
 try{const r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json','Authorization':path==='/api/session'?'tma '+initData():authHeader()},body:JSON.stringify(body),signal:ctrl?.signal});const data=await r.json().catch(()=>({}));
  if(r.status===401&&/session/.test(data.error||''))session=null;if(!r.ok){const e=new Error(data.error||('HTTP '+r.status));e.code=data.error||'';e.status=r.status;throw e;}gotMoon(data);return data;}finally{clearTimeout(timer);}}
// v39 seasons / shared goal / Stars shop state (shown by season.js). Owned cosmetics are cached in the save for the cargo bay.
function setStage3(r){stage3={...(stage3||{}),...(r.season?{season:r.season}:{}),...(r.goal?{goal:r.goal}:{}),...(r.shop?{shop:r.shop}:{})};if(r.shop&&window.MoonSeason&&MoonSeason.setCos(S(),r.shop))Game.save();try{window.MoonSeasonUI?.onState?.(stage3);}catch{}}
const tzOffset=()=>-new Date().getTimezoneOffset();
function applyServerRewards(list){let total={points:0,pending:0,crystals:0,metal:0,energy:0},n=0;for(const r of list||[]){const got=G.applyServerReward(S(),r);if(got){n++;for(const k in total)total[k]+=got[k]||0;}}if(n){commit();haptic();toast(_t('growth.nagrady_ekipazha')+' '+(G.rewardText(total)||_t('growth.ryukzak_polon')));}return n;}
async function claimPending(list){if(!list?.length)return;try{const r=await api('/api/rewards/claim',{ids:list.map(x=>x.id)});applyServerRewards(r.rewards);}catch{}}
async function boot(){if(booted)return;booted=true;const ref=startParam(),s=S();
 if(ref&&ref!==myId()&&!s.growth.refBy){s.growth.refBy=ref;Game.save();setTimeout(()=>toast(online?_t('growth.ty_ekipazhe'):_t('growth.ty_ekipazhe2')),2200);}
 if(!API||!initData()){renderAll();return;}
 try{const r=await api('/api/session',{startParam:ref?'ref_'+ref:'',tzOffset:tzOffset(),local:{updatedAt:s.updatedAt,progress:G.progressScore(s)}});online=true;serverUser=r.user||null;session=r.session||null;social=r.social||null;rules=r.rules||null;setCrew(r.crew);channelInfo=r.channel||channelInfo;
  if(r.privacy)S().growth.lbHidden=!!r.privacy.hidden;
  if(r.season||r.goal||r.shop)setStage3(r);
  if(r.save&&r.save.data&&G.pickSave(S(),r.save.data)==='remote'&&!Game.running){if(Game.replace(r.save.data))toast(_t('growth.progress_zagruzhen'));}
  else cloudSave(true);
  if(r.streak)syncServerStreak(r.streak,null);
  if(r.story)storyDone=r.story.done||[];
  await claimPending(r.rewards);}catch(e){online=false;}
 renderAll();if(online)syncStory();}
// ---------- v41 story checkpoint journal: the server pays LIFE #1/#2/#3 only from checkpoints posted in order ----------
// The save never pays. Reached checkpoints (growth-core storyCheckpoints) are posted one by one; the server stamps the
// time and refuses checkpoints that come too fast (429 too_fast) — then we simply try again a bit later.
let storyDone=[],storyBusy=false,storyTimer=0;
async function syncStory(){if(!online||storyBusy)return;const next=G.checkpointsToSend(S(),storyDone)[0];if(!next)return;storyBusy=true;clearTimeout(storyTimer);let wait=0;
 try{const r=await api('/api/story/checkpoint',{id:next});if(r.story)storyDone=r.story.done||storyDone;
  if(r.reward&&(r.reward.pending||r.reward.points)){G.applyServerReward(S(),r.reward);Game.save();api('/api/rewards/claim',{ids:[r.reward.id]}).catch(()=>{});
   haptic();toast(r.reward.pending?_t('moon.got_pending',{n:G.formatPoints(r.reward.pending)}):G.rewardText(r.reward));}wait=400;}
 catch(e){if(e.code==='too_fast')wait=15000;else if(e.code==='out_of_order'){try{const r=await api('/api/story',{});storyDone=r.story?.done||storyDone;wait=400;}catch{wait=30000;}}else if(e.status===429)wait=60000;else wait=0;}
 storyBusy=false;if(wait)storyTimer=setTimeout(syncStory,wait);}
function cloudSave(force=false){if(!online)return;const now=Date.now();if(!force&&now-lastCloud<15000){clearTimeout(cloudTimer);cloudTimer=setTimeout(()=>cloudSave(true),15000-(now-lastCloud));return;}lastCloud=now;const s=S();
 api('/api/save',{data:s,updatedAt:s.updatedAt}).then(r=>{if(r.crew)setCrew(r.crew);if(r.rewards?.length)claimPending(r.rewards);if(r.accepted===false&&r.save?.data&&!Game.running&&G.pickSave(S(),r.save.data)==='remote')Game.replace(r.save.data);}).catch(()=>{});}
Game.onSave=()=>{if(online){cloudSave(false);if(!storyBusy)syncStory();}};
// Last chance to upload when Telegram hides or closes the Mini App (keepalive survives page unload).
function flushCloud(){if(!online)return;try{fetch(API+'/api/save',{method:'POST',keepalive:true,headers:{'Content-Type':'application/json','Authorization':authHeader()},body:JSON.stringify({data:S(),updatedAt:S().updatedAt})}).catch(()=>{});lastCloud=Date.now();}catch{}}
addEventListener('pagehide',flushCloud);document.addEventListener('visibilitychange',()=>{if(document.hidden)flushCloud();});

// ---------- dialogs ----------
function dialog(id,cls){let d=document.getElementById(id);if(d)return d;d=document.createElement('dialog');d.id=id;d.className='growth-dialog '+cls;root.append(d);d.addEventListener('click',e=>{if(e.target===d)d.close();});return d;}
function open(id){const d=document.getElementById(id);document.querySelectorAll('dialog[open]').forEach(x=>{if(x!==d)x.close();});if(!d.open)Game.openDialog(id);}
const head=(eyebrow,title,id)=>`<div class="g-head"><div><span class="eyebrow">${eyebrow}</span><h2>${title}</h2></div><button class="close-icon" data-gclose="${id}" aria-label="${_t('growth.zakryt')}">×</button></div>`;
function wireClose(d){d.querySelectorAll('[data-gclose]').forEach(b=>b.onclick=()=>d.close());}

// «Вахта на базе»
const streakDialog=dialog('streak','streak-dialog');let claiming=false;
function renderStreak(flash=0){const s=S(),st=G.streakStatus(s),d=streakDialog;
 const tiles=G.STREAK_REWARDS.map((r,i)=>{const day=i+1,done=day<st.day||(st.claimed&&day===st.day),today=!st.claimed&&day===st.day,big=day===7;
  const icon=big?ICON.chest:r.energy?ICON.energy:r.metal&&!r.crystals?ICON.metal:ICON.crystal;
  return`<div class="st-tile${done?' done':''}${today?' today':''}${big?' big':''}${flash===day?' flash':''}"><small>${done?ICON.check:''}${big?_t('growth.den_7'):_t('growth.den',{n:day})}</small><div class="st-icon">${icon}</div><div class="st-reward">${chips(r)}</div></div>`;}).join('');
 const run=st.claimed?s.streak.run:st.run-1;
 d.innerHTML=head(_t('growth.ezhednevnaya_nagra'),_t('growth.vahta_baze'),'streak')+
  `<p class="g-lead">${st.claimed?(st.locked?_t('growth.chasy_ustroystva'):_t('growth.nagrada_dnya',{n:st.day})+' '+(st.day===7?_t('growth.nachnetsya_novaya'):_t('growth.dalshe_nagrady'))):st.broken?_t('growth.seriya_prervalas'):_t('growth.zahodi_kazhdyy')}</p>`+
  `<div class="st-grid">${tiles}</div>`+
  `<div class="st-meta"><span>${_t('growth.seriya',{n:run})}</span><span>${_t('growth.rekord',{n:Math.max(s.streak.best||0,run)})}</span></div>`+
  `<div class="st-moon ${online?'':'pending'}"><span class="stm-label">${ICON.moon} ${_t('moon.streak_row')}</span><span class="stm-days">${M().streak.map((p,i)=>`<i class="${online&&i===Math.min(7,st.run)-1&&!st.claimed?'now':''}">+${p}</i>`).join('')}</span>`+
  (online?(st.claimed?'':`<b class="stm-today">${_t('moon.today',{n:G.streakPoints(st.run)})}</b>`):`<small>${_t('growth.seriya_hranitsya')}</small>`)+`</div>`+
  `<button class="primary g-cta" id="streak-claim" ${st.claimed?'disabled':''}>${st.claimed?_t('growth.nagrada_poluchena'):_t('growth.zabrat_nagradu',{n:st.day})}</button>`+
  `<p class="g-feedback" id="streak-feedback" role="status"></p><p class="g-note">${_t('growth.propustish_den')}</p>`;
 wireClose(d);$('#streak-claim').onclick=claimStreak;}
function syncServerStreak(sv,reward){const s=S(),st=G.streakStatus(s);if(!sv)return;const shield=sv.shield?st.today:(s.streak.shield||'');
 if(reward&&!st.claimed){const got=G.applyReward(s,reward);got.points=reward.points||0;got.pending=reward.pending||0;s.streak={day:st.today,count:sv.count,run:sv.run,best:Math.max(sv.best||0,s.streak.best||0),total:(s.streak.total||0)+1,shield};return got;}
 if(sv.claimedToday&&!st.claimed){s.streak={day:st.today,count:sv.count,run:sv.run,best:Math.max(sv.best||0,s.streak.best||0),total:s.streak.total||0,shield};}return null;}
async function claimStreak(){if(claiming)return;claiming=true;const s=S();let text='',ok=false,day=G.streakStatus(s).day;
 try{if(online){try{const r=await api('/api/streak/claim',{tzOffset:tzOffset()});const got=syncServerStreak(r.streak,r.reward);if(got){ok=true;day=r.streak.count;text=_t('gcore.vahta_den',{day})+': '+G.gotText(got);}else text=_t('growth.nagrada_segodnya');}catch{const r=G.claimStreak(s);ok=r.ok;text=r.text;}}
  else{const r=G.claimStreak(s);ok=r.ok;text=r.text;}}finally{claiming=false;}
 if(ok){haptic();commit();renderStreak(day);toast(text);}const f=$('#streak-feedback');if(f)f.textContent=text;return{ok,text};}
function openStreak(){renderStreak();open('streak');}

// «Пригласи члена экипажа»
const crewDialog=dialog('crew','crew-dialog');
function renderCrew(){const d=crewDialog,R=G.REFERRAL_REWARDS,m=M(),link=invite(),inTg=!!tgUser(),list=crew.list||[],bonus={points:m.referral,...R.full};
 const friends=list.length?`<ul class="crew-list">${list.map(f=>{const done=f.status==='completed';return`<li><span class="crew-ava">${esc((f.name||'?').slice(0,1).toUpperCase())}</span><span class="crew-name">${esc(f.name||_t('growth.chlen_ekipazha'))}<small>${done?(f.paid===false?_t('crew.done_capped'):_t('crew.done_paid',{n:m.referral})):f.life1?_t('crew.wait_days',{n:f.days||0,d:crew.minDays||m.referralDays}):_t('crew.wait_life')}</small></span><span class="crew-st ${f.status}">${done?ICON.check:'…'}</span></li>`;}).join('')}</ul>`
  :online?`<div class="crew-empty"><b>${_t('growth.poka_nikogo')}</b><span>${_t('growth.otprav_ssylku')} ${chips({points:m.referral},'small')}</span></div>`
  :`<div class="crew-soon"><span class="soon-tag">${_t('growth.skoro')}</span><b>${_t('growth.nagrady_druzey')}</b><span>${_t('growth.server_ekipazha')}</span></div>`;
 d.innerHTML=head(_t('growth.priglasi_chlena'),_t('growth.soberi_svoy'),'crew')+
  `<div class="crew-hero" style="background-image:linear-gradient(180deg,#0b213300 45%,#0b2133e6 100%),url('${esc(cfg.CREW_HERO_IMAGE||'assets/crew-hero-v33.jpg')}')"><span class="crew-count">${ICON.crew}<b>${crew.count||0}</b> ${_t('growth.ekipazhe',{n:crew.count||0})}</span>${crew.joined>crew.count?`<span class="crew-joined">${_t('crew.joined',{n:crew.joined})}</span>`:''}</div>`+
  `<div class="crew-rewards">
    <div class="cr-row"><span class="cr-step">1</span><span class="cr-text"><b>${_t('growth.drug_otkryl')}</b><small>${_t('growth.tebe_srazu')}</small></span><span class="cr-chips"></span></div>
    <div class="cr-row"><span class="cr-step">2</span><span class="cr-text"><b>${_t('growth.drug_proshel',{d:crew.minDays||m.referralDays})}</b><small>${online?_t('growth.polnaya_nagrada',{n:m.referral}):_t('growth.nagrady_druzey')}</small></span><span class="cr-chips">${chips(online?bonus:{points:m.referral})}</span></div>
    <div class="cr-row cap"><span class="cr-step">⏱</span><span class="cr-text"><b>${_t('crew.cap_title')}</b><small>${_t('crew.cap_text',{cap:crew.cap||m.referralCap})}</small></span></div></div>`+
  `<div class="crew-link"><span class="cl-label">${ICON.link}${inTg?_t('growth.tvoya_lichnaya'):_t('growth.ssylka_igru')}</span><code>${esc(link.replace(/^https:\/\//,''))}</code><button id="crew-copy">${_t('growth.kopirovat')}</button></div>`+
  (inTg?'':'<p class="g-note">'+_t('growth.otkroy_igru')+'</p>')+
  `<button class="primary g-cta" id="crew-invite">${ICON.share}${_t('growth.otpravit_priglashe')}</button>`+
  (tg()?.shareToStory?`<button class="g-secondary" id="crew-story">${_t('growth.podelitsya_istorii')}</button>`:'')+
  `<h3 class="g-sub">${_t('growth.moy_ekipazh')} <span>${crew.count||0}</span></h3>${friends}<p class="g-note">${_t('crew.cats_note',{d:crew.minDays||m.referralDays})}</p><p class="g-feedback" id="crew-feedback" role="status"></p>`;
 wireClose(d);$('#crew-copy').onclick=async()=>{const ok=await copy(link);$('#crew-feedback').textContent=ok?_t('growth.ssylka_skopirovana'):_t('growth.udalos_skopirovat');if(ok)haptic();};
 $('#crew-invite').onclick=()=>shareChat('invite');if($('#crew-story'))$('#crew-story').onclick=shareStory;}
function openCrew(){renderCrew();open('crew');if(online)api('/api/crew',{}).then(r=>{setCrew(r.crew);if(crewDialog.open)renderCrew();}).catch(()=>{});}

// «Поделиться»
const shareDialog=dialog('share','share-dialog');let shareContext='invite';
function shareText(kind){const ch=S().chapter;if(kind==='chapter')return`${_t('growth.ya_proshel',{ch:Math.max(1,ch-1)})}`;return online?_t('growth.ya_issleduyu'):_t('share.demo_text');}
function rewardShare(){const r=G.claimShare(S());if(r.ok){commit();setTimeout(()=>toast(r.text),600);}}
function shareChat(kind=shareContext){const link=invite(),text=shareText(kind);if(tg())openUrl(G.shareUrl(link,text));else if(navigator.share)navigator.share({title:'MOONKATTY · New Horizons',text,url:link}).catch(()=>{});else openUrl(G.shareUrl(link,text));rewardShare();}
function shareStory(){const app=tg(),link=invite();if(!app?.shareToStory){shareChat();return;}const opts={text:_t('growth.lechu_lunu')};if(tgUser()?.is_premium)opts.widget_link={url:link,name:_t('growth.igrat_moonkatty')};else opts.text+=' '+link;
 try{app.shareToStory(absolute(langAsset(cfg.SHARE_STORY_IMAGE)),opts);rewardShare();}catch{shareChat();}}
function renderShare(){const d=shareDialog,story=!!tg()?.shareToStory,claimed=S().growth.shareDay===G.utcDay();
 d.innerHTML=head(_t('growth.podelitsya'),_t('growth.rasskazhi_moonkatt'),'share')+
  `<div class="share-preview"><img src="${esc(langAsset(cfg.SHARE_CARD_IMAGE))}" alt="${_t('growth.kartinka_moonkatty')}" loading="lazy"></div>`+
  `<p class="g-lead">${shareContext==='chapter'?_t('growth.otlichnaya_rabota'):_t(invite()===cfg.DEMO_URL?'share.demo_lead':'growth.kartinka_kotom')}</p>`+
  (story?`<button class="primary g-cta" id="share-story">${ICON.share}${_t('growth.istoriyu_telegram')}</button><button class="g-secondary" id="share-chat">${_t('growth.otpravit_chat')}</button>`:`<button class="primary g-cta" id="share-chat">${ICON.share}${_t('growth.otpravit_chat')}</button>`)+
  `<button class="g-secondary" id="share-copy">${ICON.link}${_t('growth.skopirovat_ssylku')}</button>`+
  `<div class="share-bonus ${claimed?'done':''}">${claimed?_t('growth.bonus_segodnya'):_t('growth.pervyy_raz')} ${chips(G.SHARE_REWARD,'small')}</div><p class="g-feedback" id="share-feedback" role="status"></p>`;
 wireClose(d);if($('#share-story'))$('#share-story').onclick=()=>{shareStory();renderShare();};$('#share-chat').onclick=()=>{shareChat(shareContext);renderShare();};
 $('#share-copy').onclick=async()=>{const ok=await copy(invite());$('#share-feedback').textContent=ok?_t('growth.ssylka_skopirovana2'):_t('growth.udalos_skopirovat2');};}
function openShare(kind='invite'){shareContext=kind;renderShare();open('share');}

// ---------- Moon Points card (server balance, cached; «available after launch» without a server) ----------
// v41: available balance + «Pending: N · +M unlock on the next day you play» (story/friend points vest over active days).
function moonCard(){const v=G.moonView(S(),online),btn=`<button type="button" class="mc-rules">${_t('moon.rules')}</button>`;
 if(v.state==='pending')return`<div class="moon-card pending"><span class="mc-star" aria-hidden="true">${ICON.moon}</span><span class="mc-text"><small>${_t('moon.title')}</small><b>${_t('moon.after_launch')}</b><em>${_t('moon.pending_note')}</em></span>${btn}</div>`;
 const pend=v.pending>0?`<span class="mc-pend"><b>⏳ ${_t('moon.pending',{n:G.formatPoints(v.pending)})}</b>${v.next>0?`<i>${_t('moon.next',{n:G.formatPoints(v.next)})}</i>`:''}</span>`:'';
 return`<div class="moon-card ${v.state}${pend?' has-pend':''}"><span class="mc-star" aria-hidden="true">${ICON.moon}</span><span class="mc-text"><small>${_t('moon.title')}</small><b class="mc-val">${G.formatPoints(v.points)}</b>${pend}${v.state==='cached'?`<em>${_t('moon.cached_note')}</em>`:''}</span>${btn}</div>`;}
function updateMoon(){document.querySelectorAll('.moon-card').forEach(el=>{const t=document.createElement('div');t.innerHTML=moonCard();el.replaceWith(t.firstElementChild);});}
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('.mc-rules'))window.MoonRulesUI?.open();});

// «Связь с Землёй»: channel (bot check) · signal code (server) · daily list · social review tasks · community chat (link only)
const tasksDialog=dialog('tasks','tasks-dialog');let channelBusy=false,channelMsg='',socOpen='',socKind={},socDraft={},socMsg={},socBusy=false;
function socialUrl(id){if(id==='chat'){const c=String(cfg.CHAT_USERNAME||'').trim().replace(/^@/,'');return /^[A-Za-z0-9_]{4,}$/.test(c)?'https://t.me/'+c:'';}return String(cfg.SOCIAL?.[id]||'');}
function socialPlatforms(){return G.SOCIAL_PLATFORMS.filter(id=>/^https:\/\//.test(socialUrl(id)));}
const SOC_TITLE={x:'gcore.chitay_moonkatty',tiktok:'gcore.podpishis_tiktok',instagram:'gcore.podpishis_instagra',youtube:'gcore.podpishis_youtube'};
function socWord(state,n){return state==='pending'?_t('soc.s_pending'):state==='approved'?_t('soc.s_approved'):state==='rejected'?_t('soc.s_rejected'):'🌕+'+n;}
function socError(e,id){const name=G.SOCIAL_NAMES[id]||id,c=e&&e.code;return c==='bad_proof'?_t('soc.e_bad_proof',{platform:name}):c==='already'?_t('soc.e_already',{platform:name}):c==='daily_limit'?_t('soc.e_daily_limit',{platform:name}):c==='pending_limit'?_t('soc.e_pending_limit',{n:M().socialPending}):c==='duplicate_proof'?_t('soc.e_duplicate'):_t('growth.net_svyazi');}
function socialHtml(){const ids=socialPlatforms(),chat=socialUrl('chat'),m=M();if(!ids.length&&!chat)return'';
 const code=online&&social?`<div class="soc-code"><span class="sc-text"><small>${_t('soc.code_title')}</small><b dir="ltr">${esc(social.code)}</b></span><button type="button" id="soc-copy">${_t('growth.kopirovat')}</button><p>${_t('soc.code_hint')}</p></div>`
  :`<div class="soc-code pending"><span class="sc-text"><small>${_t('soc.code_title')}</small><b dir="ltr">MKTY-····</b></span><p>${_t('soc.code_offline')}</p></div>`;
 const rows=ids.map(id=>{const st=social?.platforms?.[id]||{follow:'none',daily:'none'},open=online&&socOpen===id,kind=socKind[id]||(st.follow==='none'||st.follow==='rejected'?'follow':'daily'),msg=socMsg[id];
  const done=st.follow==='approved'&&st.daily==='approved',sub=online?_t('soc.line',{follow:socWord(st.follow,m.social.follow),daily:socWord(st.daily,m.social.daily)}):G.SOCIAL_NAMES[id]+' · MOONKATTY';
  return`<div class="task-row soc-row ${done?'claimed':''} ${open?'open':''}"><span class="tr-icon">${ICON[id]}</span><span class="tr-text"><b>${_t(SOC_TITLE[id])}</b><small>${sub}</small></span><span class="tr-side"><button class="tr-btn" data-soc-open="${id}">${_t('growth.otkryt')}</button>${online?`<button class="tr-btn gold" data-soc-form="${id}" aria-expanded="${open}">${_t('soc.send')}</button>`:''}</span></div>`+
   (open?`<form class="soc-form" data-soc-submit="${id}" autocomplete="off"><div class="soc-kinds" role="tablist"><button type="button" role="tab" data-soc-kind="follow" class="${kind==='follow'?'on':''}">${_t('soc.follow')} · ${ICON.moon}+${m.social.follow}</button><button type="button" role="tab" data-soc-kind="daily" class="${kind==='daily'?'on':''}">${_t('soc.daily')} · ${ICON.moon}+${m.social.daily}</button></div>`+
    `<div class="soc-input"><input name="proof" dir="ltr" inputmode="url" autocapitalize="off" spellcheck="false" maxlength="300" value="${esc(socDraft[id]||'')}" placeholder="${esc(_t(kind==='follow'?'soc.ph_follow':'soc.ph_daily'))}" aria-label="${esc(_t(kind==='follow'?'soc.ph_follow':'soc.ph_daily'))}"><button class="primary" type="submit" ${socBusy?'disabled':''}>${_t('soc.send_btn')}</button></div>`+
    `<p class="soc-msg ${msg?.ok?'ok':''}" role="status">${esc(msg?.text||'')}</p></form>`:'');}).join('');
 const chatRow=chat?`<div class="task-row chat-row"><span class="tr-icon">${ICON.telegram}</span><span class="tr-text"><b>${_t('gcore.vstupi_chat')}</b><small>${_t('soc.chat_sub')}</small></span><span class="tr-side"><button class="tr-btn" data-soc-open="chat">${_t('growth.otkryt')}</button></span></div>`:'';
 return`<h3 class="g-sub">${_t('growth.my_sotssetyah')}</h3>${code}<p class="soc-steps">${_t('soc.steps',{n:m.social.follow})}</p><div class="task-list">${rows}${chatRow}</div><p class="g-note">${online?_t('growth.zadaniya_sotssetey'):_t('soc.offline')}</p>`;}
function renderTasks(){const d=tasksDialog,s=S(),m=M(),ch=String(cfg.CHANNEL_USERNAME||'').replace(/^@/,''),st=G.streakStatus(s),shareDone=s.growth.shareDay===G.utcDay();
 const channelDone=s.growth.channel||channelInfo.rewarded,focus=document.activeElement&&d.contains(document.activeElement)&&document.activeElement.name==='proof';
 const channel=ch?`<div class="task-hero ${channelDone?'done':''}"><div class="th-top">${ICON.telegram}<div><b>${_t('growth.podpishis_kanal')}</b><small>${_t('growth.novosti_ekspeditsi')}</small></div></div>
   <div class="th-reward">${chips(online?{points:m.channel,...G.CHANNEL_REWARD}:{points:m.channel})}<span class="gchip badge">${_t('growth.znachok_svyazist')}</span></div>
   ${channelDone?`<div class="th-state ok">${ICON.check}${_t('growth.podpiska_podtverzh')}</div>`:`<div class="th-actions"><button class="primary" id="channel-open">${_t('growth.podpisatsya')}</button><button id="channel-check" ${online?'':'disabled'}>${channelBusy?_t('growth.proveryaem'):_t('growth.proverit')}</button></div><div class="th-state ${online?'':'pending'}">${esc(channelMsg)||(online?_t('growth.podpishis_zatem'):_t('growth.proverka_podpiski'))}</div>`}</div>`:'';
 const row=(icon,title,sub,reward,btn,cls='')=>`<div class="task-row ${cls}"><span class="tr-icon">${icon}</span><span class="tr-text"><b>${title}</b><small>${sub}</small></span><span class="tr-side">${reward}${btn}</span></div>`;
 d.innerHTML=head(_t('growth.zadaniya_bonusy'),_t('growth.svyaz_zemley'),'tasks')+
  `<p class="g-lead">${_t('growth.pomogi_ekspeditsii')}</p>`+moonCard()+channel+(window.MoonTeamUI?window.MoonTeamUI.codeCard():'')+
  `<div class="task-list">`+(window.MoonSeasonUI?.taskRow?window.MoonSeasonUI.taskRow():'')+
   row(ICON.gift,_t('growth.vahta_baze'),_t(st.claimed?'growth.7_nagrada':'growth.7_nagrada2',{n:st.day}),st.claimed?'':chips({points:online?st.points:0,...st.reward},'small'),`<button class="tr-btn ${st.claimed?'':'gold'}" data-go="streak">${st.claimed?_t('growth.otkryt'):_t('growth.zabrat')}</button>`,st.claimed?'claimed':'ready')+
   row(ICON.crew,_t('growth.priglasi_druga'),online?_t('growth.nagrada_kazhdogo',{n:m.referral,d:m.referralDays}):_t('growth.nagrady_druzey'),chips({points:m.referral},'small'),'<button class="tr-btn" data-go="crew">'+_t('growth.pozvat')+'</button>')+
   row(ICON.share,_t('growth.podelis_igroy'),shareDone?_t('growth.segodnya_uzhe'):_t('growth.raz_den'),shareDone?'':chips(G.SHARE_REWARD,'small'),`<button class="tr-btn" data-go="share">${shareDone?_t('growth.esche_raz'):_t('growth.podelitsya2')}</button>`,shareDone?'claimed':'')+
  `</div>`+socialHtml();
 wireClose(d);
 d.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>({streak:openStreak,crew:openCrew,share:()=>openShare('invite'),season:OPEN.season})[b.dataset.go]());
 d.querySelectorAll('[data-soc-open]').forEach(b=>b.onclick=()=>openUrl(socialUrl(b.dataset.socOpen)));
 d.querySelectorAll('[data-soc-form]').forEach(b=>b.onclick=()=>{const id=b.dataset.socForm;socOpen=socOpen===id?'':id;renderTasks();if(socOpen)setTimeout(()=>d.querySelector('.soc-form input')?.focus({preventScroll:true}),30);});
 d.querySelectorAll('.soc-form').forEach(f=>{const id=f.dataset.socSubmit,inp=f.querySelector('input');inp.oninput=()=>{socDraft[id]=inp.value;};
  f.querySelectorAll('[data-soc-kind]').forEach(b=>b.onclick=()=>{socKind[id]=b.dataset.socKind;socMsg[id]=null;renderTasks();});
  f.onsubmit=e=>{e.preventDefault();submitSocial(id,socKind[id]||f.querySelector('[data-soc-kind].on')?.dataset.socKind||'follow',inp.value);};});
 if(focus)d.querySelector('.soc-form input')?.focus({preventScroll:true});
 const cp=$('#soc-copy');if(cp)cp.onclick=async()=>{const ok=await copy(social?.code||'');if(ok){haptic();toast(_t('soc.code_copied'));}};
 if($('#channel-open'))$('#channel-open').onclick=()=>{openUrl('https://t.me/'+ch);channelMsg=online?_t('growth.podpisalsya_nazhmi'):_t('growth.spasibo_proverka');renderTasks();};
 if($('#channel-check'))$('#channel-check').onclick=checkChannel;window.MoonTeamUI?.wireCode?.(d);}
async function submitSocial(id,kind,proof){if(socBusy||!online)return;socBusy=true;socMsg[id]=null;renderTasks();
 try{const r=await api('/api/social/submit',{platform:id,kind,proof:String(proof||'').trim()});social=r.social||social;socMsg[id]={ok:true,text:_t('soc.sent')};socDraft[id]='';haptic();}
 catch(e){socMsg[id]={ok:false,text:socError(e,id)};haptic('warning');}socBusy=false;renderTasks();}
async function refreshSocial(){if(!online)return;try{const r=await api('/api/social/status',{});social=r.social||social;if(tasksDialog.open)renderTasks();}catch{}}
async function checkChannel(){if(channelBusy||!online)return;channelBusy=true;renderTasks();try{const r=await api('/api/channel/check',{});if(r.member){channelInfo.rewarded=true;S().growth.channel=true;if(r.reward)applyServerRewards([r.reward]);else commit();channelMsg='';haptic();}else{channelMsg=r.error==='channel_not_configured'?_t('growth.proverka_kanala'):_t('growth.poka_vidim');haptic('warning');}}catch{channelMsg=_t('growth.net_svyazi');}channelBusy=false;renderTasks();}
function openTasks(){renderTasks();open('tasks');refreshSocial();}

// ---------- entry points ----------
const OPEN={streak:openStreak,crew:openCrew,tasks:openTasks,share:()=>openShare('invite'),rules:()=>window.MoonRulesUI?.open(),season:()=>window.MoonSeasonUI?.open()};
function navButton(kind,label,cls){const b=document.createElement('button');b.className=cls;b.dataset.growth=kind;b.innerHTML=`<span class="gn-icon">${ICON[{streak:'gift',crew:'crew',tasks:'tasks',share:'share'}[kind]]}</span><span class="gn-label">${label}</span><i class="g-dot" hidden></i>`;b.onclick=()=>OPEN[kind]();return b;}
function mount(){
 const coverNav=$('.cover-navigation');if(coverNav&&!$('.growth-nav')){const nav=document.createElement('nav');nav.className='growth-nav';nav.setAttribute('aria-label',_t('growth.bonusy_ekipazh'));nav.append(navButton('streak',_t('growth.vahta'),'gn'),navButton('crew',_t('game.ekipazh'),'gn'),navButton('tasks',_t('growth.zadaniya'),'gn'));coverNav.after(nav);}
 const menuNav=$('.menu-navigation');if(menuNav&&!menuNav.querySelector('[data-growth]')){for(const[k,l]of[['streak',_t('growth.vahta_baze')],['crew',_t('game.ekipazh')],['tasks',_t('growth.zadaniya')],['share',_t('growth.podelitsya2')]]){const b=navButton(k,l,'gm');b.addEventListener('click',()=>$('#chapters')?.close(),true);menuNav.append(b);}}
 if(!$('#growth-dock')){const dock=document.createElement('div');dock.id='growth-dock';dock.setAttribute('aria-label',_t('growth.bonusy'));for(const[k,l]of[['streak',_t('growth.vahta')],['crew',_t('game.ekipazh')],['tasks',_t('growth.zadaniya')]])dock.append(navButton(k,l,'gd'));root.append(dock);}
 const daily=$('.daily-panel');if(daily&&!$('#streak-strip')){const strip=document.createElement('button');strip.id='streak-strip';strip.type='button';strip.onclick=()=>{$('#cards')?.close();openStreak();};daily.parentNode.insertBefore(strip,daily);}
 const end=$('#end-next');if(end&&!$('#end-share')){const b=document.createElement('button');b.id='end-share';b.className='g-secondary';b.innerHTML=ICON.share+_t('growth.podelitsya_druzyam');b.onclick=()=>{$('#end')?.close();openShare('chapter');};end.after(b);}
}
function updateBadges(){const s=S(),st=G.streakStatus(s),cover=$('#cover'),dock=$('#growth-dock');
 const alerts={streak:!st.claimed,crew:false,tasks:!st.claimed,share:false};
 document.querySelectorAll('[data-growth]').forEach(b=>{const dot=b.querySelector('.g-dot');if(dot)dot.hidden=!alerts[b.dataset.growth];});
 document.querySelectorAll('.growth-nav [data-growth="streak"] .gn-label,#growth-dock [data-growth="streak"] .gn-label').forEach(l=>l.textContent=st.claimed?_t('growth.vahta2'):_t('growth.den3',{n:st.day}));
 if(dock)dock.hidden=!cover||!cover.hidden;if(cover&&!cover.hidden?!$('#streak-pill')&&!st.claimed&&returning():$('#streak-pill'))streakPill();
 const strip=$('#streak-strip');if(strip){strip.className=st.claimed?'claimed':'ready';strip.innerHTML=`<span class="ss-dots">${[1,2,3,4,5,6,7].map(d=>`<i class="${d<st.day||(st.claimed&&d===st.day)?'on':d===st.day?'now':''}"></i>`).join('')}</span><span class="ss-text"><span class="eyebrow">${_t('growth.vahta_baze2')}</span><b>${_t(st.claimed?'growth.7_polucheno':'growth.7_nagrada2',{n:st.day})}</b></span><span class="ss-go">${st.claimed?'›':_t('growth.zabrat')}</span>`;}}
function renderAll(){updateBadges();updateMoon();if(streakDialog.open)renderStreak();if(crewDialog.open)renderCrew();if(tasksDialog.open)renderTasks();if(shareDialog.open)renderShare();}
mount();updateBadges();
setInterval(updateBadges,1000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){renderAll();maybeShowStreak(1200);}});
function maybeShowStreak(delay=900){setTimeout(streakPill,delay);}
// v44: the daily watch never covers «Start expedition». Returning players get a one-tap pill above the title; first-time
// players meet the watch after their first walk (dock / cover badges), so the first minute is story → world.
function returning(){try{return localStorage.getItem('moonkatty-entered')==='1';}catch{return false;}}
function streakPill(){const cover=$('#cover'),copy=cover&&cover.querySelector('.cover-copy');let pill=$('#streak-pill');const s=S(),st=G.streakStatus(s);
 if(pill&&pill.classList.contains('done'))return;
 if(!copy||cover.hidden||st.claimed||!returning()){if(pill)pill.remove();return;}
 if(!pill){pill=document.createElement('div');pill.id='streak-pill';pill.className='streak-pill';copy.prepend(pill);if(G.shouldShowStreak(s)){G.markStreakSeen(s);Game.save();}}
 pill.innerHTML=`<span class="sp-ico" aria-hidden="true">${ICON.gift}</span><span class="sp-text" role="button" tabindex="0"><b>${_t('growth.vahta_baze')}</b>${_t('growth.den3',{n:st.day})}</span><span class="sp-chips">${chips(st.reward,'small')}</span><button type="button" id="streak-pill-claim">${_t('growth.zabrat')}</button>`;
 pill.querySelector('.sp-text').onclick=openStreak;
 $('#streak-pill-claim').onclick=async e=>{e.stopPropagation();pill.classList.add('done');const r=await claimStreak();if(r&&r.ok){pill.innerHTML=`<span class="sp-ico" aria-hidden="true">${ICON.check}</span><span class="sp-text"><b>${_t('growth.vahta_baze')}</b>${esc(r.text)}</span>`;pill.classList.add('done');setTimeout(()=>pill.remove(),2700);}else{pill.classList.remove('done');streakPill();}};}
// Wait briefly for telegram-web-app.js (loaded async by telegram-viewport.js) before talking to the server.
let waited=0;(function waitTelegram(){if(tg()?.initData||waited>=2500||!API){boot();return;}waited+=250;setTimeout(waitTelegram,250);})();
maybeShowStreak(1100);
{const b=$('#cover-share');if(b)b.onclick=()=>openShare('invite');}
window.MoonGrowthUI={openStreak,openCrew,openTasks,openShare,maybeStreak:maybeShowStreak,api,moonCard,updateMoon,openUrl,rules:M,kit:{ICON,chips,dialog,open,head,wireClose,haptic,commit,esc,plural,toast,tg},setStage3,get stage3(){return stage3;},get crew(){return crew;},get user(){return serverUser;},get online(){return online;},get storyDone(){return storyDone;},syncStory,get channel(){return channelInfo;},renderAll};
})();
