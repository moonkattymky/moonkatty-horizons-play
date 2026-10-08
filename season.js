/* v39 growth stage 3 screen «Сезон» (Season): the free season pass, the shared Crew goal «light N beacons together»,
   the season leaderboard (in team.js) and the expedition shop for Telegram Stars (cosmetics and comfort only — Stars never
   buy Moon Points). Every reward is paid by the server; offline (no API_BASE / outside Telegram) the screen shows the real
   season calendar and the whole pass, with «available after launch» states and no buttons that could look broken.
   Rules/numbers: season-core.js (mirrored by server/src/logic.js). */
(function(){'use strict';
const Game=window.MoonGame,G=window.MoonGrowth,SC=window.MoonSeason,UI=window.MoonGrowthUI;if(!Game||!G||!SC||!UI||!UI.kit)return;
const{dialog,open:openDialog,head,wireClose,esc,haptic,chips,ICON,toast,tg}=UI.kit;const $=s=>document.querySelector(s),S=()=>Game.state;
const d=dialog('season','season-dialog');let busy='',msg={},pollTimer=0;
const lang=()=>(window.MoonI18n&&MoonI18n.lang)||'en',rtl=()=>!!(window.MoonI18n&&MoonI18n.isRTL&&MoonI18n.isRTL(lang()));
const iso=v=>rtl()?'\u2066'+v+'\u2069':String(v);
const fmt=n=>G.formatPoints(n);
const IC={
 trophy:'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10v5a5 5 0 0 1-10 0Z"/><path d="M7 6H4.5a2.5 2.5 0 0 0 2.6 3.9M17 6h2.5a2.5 2.5 0 0 1-2.6 3.9M12 14v3.5M8.5 20.5h7M9.5 17.5h5"/></svg>',
 beacon:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.2 9.5h5.6l2 11.5H7.2Z" fill="#c9d7e1"/><path d="M8.6 13h6.8M8 16.6h8" stroke="#ff8a5c" stroke-width="1.6"/><rect x="8.4" y="6.2" width="7.2" height="3.6" rx="1" fill="#ffd36b"/><path d="M12 1.5v2.6M5.5 4.3l1.8 1.8M18.5 4.3l-1.8 1.8" stroke="#ffe7a3" stroke-width="1.6" stroke-linecap="round"/></svg>',
 star:'<svg class="tg-star" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.2c.5 0 .9.3 1.1.7l2.3 4.8 5.2.8c1 .2 1.4 1.4.7 2.1l-3.8 3.7.9 5.3c.2 1-.9 1.7-1.7 1.3L12 18.4l-4.7 2.5c-.9.5-1.9-.3-1.7-1.3l.9-5.3-3.8-3.7c-.7-.7-.3-2 .7-2.1l5.2-.8 2.3-4.8c.2-.4.6-.7 1.1-.7Z" fill="url(#tgs)"/><defs><linearGradient id="tgs" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd84d"/><stop offset="1" stop-color="#f59a0c"/></linearGradient></defs></svg>',
 lock:'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="10.5" width="14" height="10" rx="2.2"/><path d="M8.2 10.5V7.8a3.8 3.8 0 0 1 7.6 0v2.7"/></svg>',
 cargo:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8.5 12 4l9 4.5v8L12 21l-9-4.5Z" fill="#b97a2a"/><path d="M3 8.5 12 13l9-4.5M12 13v8" stroke="#ffe2a0" stroke-width="1.3" fill="none"/><path d="m7.5 6.2 9 4.5" stroke="#8a561a" stroke-width="1.6"/></svg>'};
// ---------- state: server (online) or the honest offline view ----------
function state(){const st=UI.online&&UI.stage3&&UI.stage3.season?UI.stage3:null;if(st)return{online:true,...st,shop:st.shop||SC.offlineView().shop};
 const off=SC.offlineView(Date.now());const cos=S().growth.cos||{owned:[],frame:''};off.shop.owned=cos.owned.slice();off.shop.frame=cos.frame;off.shop.items.forEach(i=>i.owned=cos.owned.includes(i.id));return{online:false,...off};}
const weekNo=s=>iso(s.id.slice(-2).replace(/^0/,''));
// v39.1 weekly seasons: «Week 41 · Oct 5 – 11» in the season header (dates in the player's language, UTC).
function weekDates(s){try{const f=new Intl.DateTimeFormat(lang(),{month:'short',day:'numeric',timeZone:'UTC'});return f.formatRange?f.formatRange(new Date(s.start),new Date(s.end-1)):f.format(new Date(s.start))+' – '+f.format(new Date(s.end-1));}catch{return'';}}
function seasonTitle(s){if(s.length!=='week')return seasonName(s);const dates=weekDates(s);return dates?_t('season.title_wk',{n:weekNo(s),dates}):seasonName(s);}
function seasonName(s){if(s.length==='week')return _t('season.title_week',{n:weekNo(s)});
 let month=s.id;try{const parts=new Intl.DateTimeFormat(lang(),{month:'long',year:'numeric',timeZone:'UTC'}).formatToParts(new Date(s.start+86400000));
  if(parts.length&&parts[parts.length-1].type==='literal'&&/\.\s*$/.test(parts[parts.length-1].value))parts.pop();/* «октябрь 2026 г.» → «октябрь 2026» */month=parts.map(p=>p.value).join('').trim();}catch{}return _t('season.title_month',{month});}
function leftText(s){const t=SC.timeLeft(s.end);return t.days?_t('season.left_days',{n:t.days}):_t('season.left_hours',{n:t.hours});}
const itemName=id=>_t('shop.'+id),badgeName=id=>(G.BADGE_NAMES&&G.BADGE_NAMES[id])||id;
function framePreview(id,label){return`<span class="cos-name ${id?'cos-'+id:''}"><bdi>${esc(label)}</bdi></span>`;}
function myName(){return UI.user?.firstName||tg()?.initDataUnsafe?.user?.first_name||_t('team.kosmonavt');}
function rewardHtml(r){let out=chips({points:r.points||0,crystals:r.crystals||0,metal:r.metal||0},'small');
 if(r.item)out+=`<span class="gchip cos-chip">${framePreview(r.item,itemName(r.item))}</span>`;if(r.badge)out+=`<span class="gchip badge">🎖️ ${esc(badgeName(r.badge))}</span>`;return out;}
// ---------- render ----------
function hero(st){const s=st.season,next=SC.nextTier(s.score,s.tiers);
 return`<div class="sn-hero ${st.online?'':'pending'}"><div class="sn-score"><span class="sn-ic">${IC.trophy}</span><span class="sn-pts"><small>${_t('season.score')}</small>${st.online?`<b class="sn-val">⭐ ${fmt(s.score)}</b>`:`<b class="sn-after">${_t('moon.after_launch')}</b><em class="sn-left-line">${leftText(s)}</em>`}</span>${st.online?`<span class="sn-left">${leftText(s)}</span>`:''}</div>`+
  `<div class="sn-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${s.tiers[s.tiers.length-1].need}" aria-valuenow="${s.score}"><i style="width:${Math.round(SC.trackFill(s.score,s.tiers)*100)}%"></i></div>`+
  (st.online?`<em class="sn-next">${next?_t('season.next',{n:fmt(next.need),tier:next.tier}):_t('season.done')}</em>`:'')+
  `<p>${_t('season.score_note')}</p></div>`;}
function pass(st){const s=st.season;
 const rows=s.tiers.map(t=>{const can=st.online&&t.ready&&!t.claimed,cls=t.claimed?'claimed':t.ready&&st.online?'ready':'locked';
  const side=t.claimed?`<span class="sp-done">${ICON.check}${_t('season.claimed')}</span>`:can?`<button class="tr-btn gold" data-tier="${t.tier}" ${busy?'disabled':''}>${busy==='t'+t.tier?'…':_t('season.claim')}</button>`:`<span class="sp-lock">${IC.lock}</span>`;
  return`<li class="sp-row ${cls}"><span class="sp-lvl">${t.tier}</span><span class="sp-body"><small>${_t('season.need',{n:fmt(t.need)})}</small><span class="sp-rew">${rewardHtml(t.reward)}</span></span><span class="sp-side">${side}</span></li>`;}).join('');
 return`<h3 class="g-sub">${_t('season.pass')} <span class="sp-free">${_t('season.free')}</span></h3>${st.online?'':`<p class="sn-off">${_t('season.offline')}</p>`}<ol class="sp-track ${st.online?'':'pending'}">${rows}</ol>`+
  (msg.pass?`<p class="g-feedback" role="status">${esc(msg.pass)}</p>`:'')+`<button class="g-secondary" id="sn-board">${IC.trophy}${_t('season.board')}</button>`;}
function goal(st){const g=st.goal,pct=Math.min(100,Math.round(g.progress/Math.max(1,g.target)*1000)/10);
 let action='';if(!st.online)action=`<p class="sn-off">${_t('goal.offline')}</p>`;
 else if(g.claimed)action=`<div class="th-state ok">${ICON.check}${_t('goal.claimed')}</div>`;
 else if(g.claimable)action=`<button class="primary g-cta" data-goal="${esc(g.id)}" ${busy?'disabled':''}>${busy==='goal'?'…':_t('goal.claim')}</button>`;
 else if(g.reached&&!g.mine)action=`<p class="sn-off">${_t('goal.need_one')}</p>`;
 const prev=st.online&&g.prev&&g.prev.claimable?`<div class="gl-prev"><span>${_t('goal.prev',{date:iso(new Date(g.prev.claimUntil-1).toISOString().slice(0,10))})}</span><button class="tr-btn gold" data-goal="${esc(g.prev.id)}" ${busy?'disabled':''}>${_t('goal.claim')}</button></div>`:'';
 return`<div class="gl-card ${st.online?'':'pending'} ${g.reached?'reached':''}"><div class="gl-top">${IC.beacon}<div><span class="eyebrow">${_t('goal.eyebrow')}</span><b>${_t('goal.title',{n:g.target,target:fmt(g.target)})}</b></div></div>`+
  `<div class="gl-bar"><i style="width:${st.online?pct:0}%"></i><span>${st.online?`${fmt(g.progress)} / ${fmt(g.target)}`:`— / ${fmt(g.target)}`}</span></div>`+
  (st.online?`<div class="gl-mine">${g.reached?`<b>${_t('goal.reached')}</b>`:''}<span>${_t('goal.mine',{n:g.mine})}</span></div>`:'')+
  `<p class="gl-how">${_t('goal.how',{a:iso('1'),b:iso('3'),c:iso('5')})}</p><div class="gl-reward"><small>${_t('goal.reward')}</small><span>${rewardHtml(g.reward)}</span></div>${action}${prev}`+
  (msg.goal?`<p class="g-feedback" role="status">${esc(msg.goal)}</p>`:'')+`</div>`;}
function canPay(st){return st.online&&st.shop.enabled&&!!tg()?.openInvoice;}
function shop(st){const sh=st.shop,pay=canPay(st),owned=new Set(sh.owned||[]);
 const note=!st.online?_t('shop.offline'):!sh.enabled||!tg()?.openInvoice?_t('shop.soon'):'';
 const items=sh.items.map(i=>{const has=owned.has(i.id),art=SC.COSMETICS[i.id].kind==='frame'?framePreview(i.id,myName()):i.id==='badge_patron'?`<span class="cos-name"><bdi>${esc(myName())}</bdi><i class="patron-star" aria-hidden="true">✦</i></span>`:`<span class="sh-cargo">${IC.cargo}<b>${iso('+'+SC.CARGO_HOURS)}</b></span>`;
  const btn=has?`<span class="sh-owned">${ICON.check}${_t('shop.owned')}</span>`:`<button class="sh-buy" data-buy="${i.id}" ${pay&&!busy?'':'disabled'} aria-label="${esc(itemName(i.id)+' · '+_t('shop.price',{n:i.stars}))}">${IC.star}<span>${busy==='buy:'+i.id?'…':_t('shop.price',{n:i.stars})}</span></button>`;
  return`<article class="sh-item ${has?'owned':''}"><div class="sh-art">${art}</div><b>${esc(itemName(i.id))}</b><small>${_t('shop.'+i.id+'_d',{n:SC.CARGO_HOURS})}</small>${btn}</article>`;}).join('');
 const frames=SC.FRAMES.filter(f=>owned.has(f));
 const wear=frames.length?`<div class="sh-wear"><small>${_t('shop.my_frames')}</small><div class="sh-frames">${['',...frames].map(f=>`<button class="${sh.frame===f?'on':''}" data-frame="${f}" ${st.online&&!busy?'':'disabled'} aria-pressed="${sh.frame===f}">${f?framePreview(f,itemName(f)):_t('shop.unequip')}</button>`).join('')}</div></div>`:'';
 return`<h3 class="g-sub">${_t('shop.title')}</h3><p class="sh-note">${_t('shop.note')}</p>${note?`<p class="sn-off">${note}</p>`:''}<div class="sh-grid">${items}</div>${wear}`+
  (msg.shop?`<p class="g-feedback" role="status">${esc(msg.shop)}</p>`:'')+`<p class="g-note pts-disclaimer">${_t('points.disclaimer')}</p>`;}
function render(){const st=state(),y=d.scrollTop;
 d.innerHTML=head(_t(st.season.length==='week'?'season.eyebrow_week':'season.eyebrow'),esc(seasonTitle(st.season)),'season')+hero(st)+pass(st)+goal(st)+shop(st);d.scrollTop=y;
 wireClose(d);d.querySelectorAll('[data-tier]').forEach(b=>b.onclick=()=>claimTier(Number(b.dataset.tier)));d.querySelectorAll('[data-goal]').forEach(b=>b.onclick=()=>claimGoal(b.dataset.goal));
 d.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>buy(b.dataset.buy));d.querySelectorAll('[data-frame]').forEach(b=>b.onclick=()=>wear(b.dataset.frame));
 const lb=$('#sn-board');if(lb)lb.onclick=()=>{d.close();window.MoonTeamUI?.openLeaders?.('season');};}
// ---------- actions (online only; every reward comes from the server) ----------
function errText(e){const c=e&&e.code;return c==='not_yet'?_t('season.not_yet'):c==='already'?_t('season.claimed'):c==='owned'?_t('shop.owned'):c==='stars_not_configured'?_t('shop.soon'):_t('growth.net_svyazi');}
function got(r){const g=G.applyServerReward(S(),r.reward)||{},p={...g,points:r.reward?.points||0},res=r.reward&&(r.reward.crystals||r.reward.metal||r.reward.energy);UI.kit.commit();return res?G.gotText(p):G.rewardText(p);}
async function claimTier(tier){if(busy||!UI.online)return;busy='t'+tier;msg.pass='';render();
 try{const r=await UI.api('/api/season/claim',{tier});UI.setStage3(r);const text=[got(r),r.item?_t('season.got_item',{item:itemName(r.item)}):'',r.reward?.badge?_t('season.got_badge',{badge:badgeName(r.reward.badge)}):''].filter(Boolean).join(' · ');
  haptic();toast(_t('season.got',{got:text}));}catch(e){msg.pass=errText(e);haptic('warning');if(e.code==='already')refresh();}busy='';render();}
async function claimGoal(id){if(busy||!UI.online)return;busy='goal';msg.goal='';render();
 try{const r=await UI.api('/api/goal/claim',{id});UI.setStage3(r);haptic();toast(_t('goal.got',{got:[got(r),r.reward?.badge?badgeName(r.reward.badge):''].filter(Boolean).join(' · ')}));}catch(e){msg.goal=e.code==='no_beacons'?_t('goal.need_one'):errText(e);haptic('warning');}busy='';render();}
async function wear(frame){if(busy||!UI.online)return;busy='wear';render();try{const r=await UI.api('/api/cosmetics/equip',{frame});UI.setStage3(r);haptic('success');}catch(e){msg.shop=errText(e);}busy='';render();}
// Telegram Stars: the server creates the invoice link; Telegram shows the payment sheet; the webhook delivers the item.
async function buy(id){const st=state();if(busy||!canPay(st))return;busy='buy:'+id;msg.shop='';render();
 try{const r=await UI.api('/api/stars/invoice',{item:id,title:itemName(id).slice(0,32),description:_t('shop.'+id+'_d',{n:SC.CARGO_HOURS}).slice(0,255)});
  tg().openInvoice(r.link,status=>{if(status==='paid'){msg.shop=_t('shop.paid');haptic();waitOwned(id,0);}else if(status==='failed'){msg.shop=_t('shop.failed');haptic('warning');}else msg.shop='';busy='';render();});}
 catch(e){msg.shop=errText(e);haptic('warning');busy='';render();if(e.code==='owned')refresh();}}
function waitOwned(id,n){clearTimeout(pollTimer);pollTimer=setTimeout(async()=>{try{const r=await UI.api('/api/stars/status',{});UI.setStage3(r);if(r.shop.owned.includes(id)){msg.shop=_t('shop.ready',{item:itemName(id)});toast(msg.shop);Game.refresh?.();if(d.open)render();return;}}catch{}if(n<8)waitOwned(id,n+1);},n?2000:1200);}
async function refresh(){if(!UI.online)return;try{const r=await UI.api('/api/season',{});UI.setStage3(r);}catch{}}
function openSeason(){msg={};render();openDialog('season');d.scrollTop=0;refresh();}
// ---------- entry points: cover pill, main menu row, a row in «Связь с Землёй», season tab in the leaderboard ----------
function taskRow(){const st=state(),s=st.season,ready=st.online&&s.tiers.some(t=>t.ready&&!t.claimed)||st.online&&st.goal.claimable;
 return`<div class="task-row season-row ${ready?'ready':''}"><span class="tr-icon">${IC.trophy}</span><span class="tr-text"><b>${esc(seasonName(s))}</b><small>${leftText(s)} · ${_t(s.length==='week'?'season.task_sub_week':'season.task_sub')}</small></span><span class="tr-side"><button class="tr-btn ${ready?'gold':''}" data-go="season">${ready?_t('season.claim'):_t('growth.otkryt')}</button></span></div>`;}
function mount(){const tools=$('#cover .cover-tools');
 if(tools&&!$('#cover-season')){const b=document.createElement('button');b.type='button';b.id='cover-season';b.className='cover-season';b.setAttribute('aria-haspopup','dialog');b.addEventListener('click',()=>openSeason());tools.append(b);}
 const rules=$('#menu-rules');if(rules&&!$('#menu-season')){const b=document.createElement('button');b.type='button';b.id='menu-season';b.className='menu-lang menu-rules menu-season';b.addEventListener('click',()=>openSeason());rules.after(b);}
 updateEntry();}
function updateEntry(){const st=state(),ready=st.online&&(st.season.tiers.some(t=>t.ready&&!t.claimed)||st.goal.claimable);
 const c=$('#cover-season');if(c){c.innerHTML=`${IC.trophy}<span>${esc(_t('season.menu'))}</span><i class="g-dot" ${ready?'':'hidden'}></i>`;c.title=seasonName(st.season)+' · '+leftText(st.season);c.setAttribute('aria-label',c.title);}
 const m=$('#menu-season');if(m)m.innerHTML=`<span>🏆 ${esc(_t('season.menu'))} <small>${esc(leftText(st.season))}</small></span><b aria-hidden="true">›</b>`;}
function onState(){updateEntry();if(d.open&&!busy)render();}
mount();setInterval(updateEntry,60000);
window.MoonSeasonUI={open:openSeason,render,taskRow,onState,seasonName,leftText,framePreview};
})();
