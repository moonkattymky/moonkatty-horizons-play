/* v35 growth stage 2 UI: «Команда базы» (crew cats with hourly income + station store), welcome-back modal,
   «Код сигнала», ranks (HUD chip, profile, rank-up celebration) and the leaderboard. Rules: team-core.js.
   Works fully offline; the leaderboard and friend-only cats use the crew server when API_BASE is set. */
(function(){'use strict';
const Game=window.MoonGame,T=window.MoonTeam,UI=window.MoonGrowthUI;if(!Game||!T||!UI||!UI.kit)return;
const{ICON,chips,dialog,open,head,wireClose,haptic,esc,plural}=UI.kit;
const $=s=>document.querySelector(s),S=()=>Game.state,root=document.getElementById('app-viewport')||document.body;
const commit=()=>{UI.kit.commit();updateHud();};
const fmt=n=>Math.floor(n).toLocaleString('ru-RU');
const RAR={common:_t('team.obychnyy'),rare:_t('team.redkiy'),legend:_t('team.legendarnyy')};
const IC={team:'<svg class="gi" viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="9" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="16.5" cy="9" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M2.8 19c.6-3 2.7-4.6 5.2-4.6s4.6 1.6 5.2 4.6M11.6 15.2c1-.6 2.2-.8 3.4-.8 2.6 0 4.6 1.6 5.2 4.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M5.6 6.4l1-2 1.4 1.4M14.4 6.4l1-2 1.4 1.4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
 trophy:'<svg class="gi" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10v5a5 5 0 0 1-10 0z M7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5A3.5 3.5 0 0 1 16.5 11M12 14v3M8.5 20h7M9.5 17h5v3h-5z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/></svg>',
 signal:'<svg class="gi" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="2" fill="currentColor"/><path d="M8.2 9.2a5.4 5.4 0 0 0 0 7.6M15.8 9.2a5.4 5.4 0 0 1 0 7.6M5.4 6.4a9.4 9.4 0 0 0 0 13.2M18.6 6.4a9.4 9.4 0 0 1 0 13.2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
 lock:'<svg class="gi" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="9.5" rx="2.4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
 store:'<svg class="gi" viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 9.5L12 4l8.5 5.5V20h-17z M8 20v-6h8v6M8 17h8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
 up:'<svg class="gi" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V6M6.5 11.5L12 6l5.5 5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'};
// Rank insignia: roundel with chevrons / stars / crescent, tinted per rank.
let insSeq=0;function insignia(i,size=40){const c=[['#9fb7c9','#5d7487'],['#8ee4df','#3a8f9a'],['#7fc6ff','#2f6fb0'],['#f5d58f','#b9852f'],['#ffe7a8','#d39a35']][i]||['#9fb7c9','#5d7487'],id='ins'+i+'_'+(++insSeq);
 const chev=ys=>ys.map(y=>`<path d="M14 ${y}l10-6 10 6" fill="none" stroke="url(#${id}g)" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
 const star=(x,y,r)=>{let p='';for(let k=0;k<10;k++){const a=-Math.PI/2+k*Math.PI/5,rr=k%2?r*.45:r;p+=(k?'L':'M')+(x+Math.cos(a)*rr).toFixed(2)+' '+(y+Math.sin(a)*rr).toFixed(2);}return`<path d="${p}Z" fill="url(#${id}g)"/>`;};
 const inner=[chev([29]),chev([26,33]),star(24,13.5,4.6)+chev([26,32,38]),star(24,16,7.6)+chev([32,38]),`<mask id="${id}m"><rect width="48" height="48" fill="#fff"/><circle cx="28.5" cy="14.5" r="8.2" fill="#000"/></mask><circle cx="23" cy="18" r="10" fill="url(#${id}g)" mask="url(#${id}m)"/>`+star(14.5,33,3.3)+star(24,36.5,3.8)+star(33.5,33,3.3)][i]||chev([29]);
 return`<svg class="insignia r${i}" width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffaf0"/><stop offset=".45" stop-color="${c[0]}"/><stop offset="1" stop-color="${c[1]}"/></linearGradient><radialGradient id="${id}b" cx=".5" cy=".35" r=".7"><stop offset="0" stop-color="#244a66"/><stop offset="1" stop-color="#081a2a"/></radialGradient></defs><circle cx="24" cy="24" r="21.5" fill="url(#${id}b)" stroke="url(#${id}g)" stroke-width="2.4"/><circle cx="24" cy="24" r="17.8" fill="none" stroke="${c[0]}" stroke-opacity=".28" stroke-width="1"/>${inner}</svg>`;}
const portrait=id=>`assets/crew/${id}.webp`;
// Missing / failed portrait → calm navy placeholder with a paw instead of a broken-image icon.
const PORTRAIT_FALLBACK='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><radialGradient id="g" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#21506c"/><stop offset="1" stop-color="#0b2133"/></radialGradient></defs><rect width="64" height="64" fill="url(#g)"/><g fill="#e9c67a" opacity=".85"><ellipse cx="32" cy="40" rx="9" ry="7.5"/><circle cx="21" cy="29" r="4"/><circle cx="28" cy="23" r="4"/><circle cx="36" cy="23" r="4"/><circle cx="43" cy="29" r="4"/></g></svg>');
document.addEventListener('error',e=>{const im=e.target;if(im&&im.tagName==='IMG'&&/assets\/crew\//.test(im.getAttribute('src')||'')){im.src=PORTRAIT_FALLBACK;}},true);
function whenFree(fn,tries=160){const t=setInterval(()=>{if(--tries<0){clearInterval(t);return;}if(document.hidden||document.querySelector('dialog[open]')||window.MoonCinema?.playing)return;clearInterval(t);fn();},750);}
const name=()=>{const u=UI.user,tu=window.Telegram?.WebApp?.initDataUnsafe?.user;return(u&&u.firstName)||(tu&&tu.first_name)||_t('team.kosmonavt');};

// ---------- «Команда базы» ----------
const teamD=dialog('team','team-dialog');let teamTimer=0;
function storeHtml(){const s=S(),st=T.stored(s),cap=T.storeCap(s),r=T.rates(s),h=T.capHours(s),next=T.STORAGE[(s.team.cap||0)+1];
 const bar=(res,icon)=>{const c=cap[res]||0,v=Math.min(c,s.team.store[res]||0),pct=c?Math.round(v/c*100):0;return`<div class="ts-res"><span class="ts-ico">${icon}</span><div class="ts-bar"><i style="width:${pct}%"></i></div><b>${fmt(v)}<small>/${fmt(c)}</small></b></div>`;};
 const total=st.crystals+st.metal;
 return`<div class="team-store"><div class="ts-head">${IC.store}<div><b>${_t('team.sklad_stantsii')}</b><small>${r.crystals+r.metal?`${_t('team.chas_kopit',{crystals:r.crystals,metal:r.metal,h:h})}`:_t('team.pusto_dobav')}</small></div></div>${bar('crystals',ICON.crystal)}${bar('metal',ICON.metal)}
  <div class="ts-actions"><button class="primary g-cta" id="team-claim" ${total?'':'disabled'}>${total?`${_t('team.zabrat',{crystals:st.crystals,metal:st.metal})}`:_t('team.sklad_kopit')}</button>${next?`<button class="ts-up" id="team-storage">${_t('team.sklad_ch',{up:IC.up,hours:next.hours,cost:next.cost[0],cost2:next.cost[1]})}</button>`:'<span class="ts-max">'+_t('team.sklad_maksimalnyy')+'</span>'}</div></div>`;}
function cardHtml(c){const s=S(),l=T.level(s,c.id),unl=T.unlocked(s,c),inc=T.incomeOf(c,Math.max(1,l)),nextInc=l&&l<T.MAX_LEVEL?T.incomeOf(c,l+1):null;
 const income=`${inc.crystals?`<span>${ICON.crystal}+${inc.crystals}</span>`:''}${inc.metal?`<span>${ICON.metal}+${inc.metal}</span>`:''}<em>${_t('team.ch')}</em>`;
 let action;if(l){if(l>=T.MAX_LEVEL)action='<span class="tc-max">'+_t('team.maksimum')+'</span>';else{const cost=T.costOf(c,l),ok=s.crystals>=cost.crystals&&s.metal>=cost.metal;action=`<button class="tc-btn ${ok?'gold':''}" data-up="${c.id}">${IC.up}${cost.crystals} ◆ ${cost.metal} ▣</button>`;}}
 else if(c.hire&&unl){const ok=s.crystals>=c.hire.crystals&&s.metal>=c.hire.metal;action=`<button class="tc-btn ${ok?'gold':''}" data-hire="${c.id}">${_t('team.nanyat',{crystals:c.hire.crystals,metal:c.hire.metal})}</button>`;}
 else if(c.unlock.friends){const f=s.team.friends;action=`<button class="tc-btn invite" data-invite="1">${ICON.crew}${_t('team.druzey',{friends:Math.min(f,c.unlock.friends),friends2:c.unlock.friends})}</button>`;}
 else action=`<span class="tc-lock">${IC.lock}${esc(c.how)}</span>`;
 const pips=Array.from({length:T.MAX_LEVEL},(_,k)=>`<i class="${k<l?'on':''}"></i>`).join('');
 return`<article class="team-card ${c.rarity} ${l?'hired':'locked'}"><div class="tc-art"><img src="${portrait(c.id)}" alt="" loading="lazy">${l?`<span class="tc-lvl">${_t('team.ur',{v:l})}</span>`:`<span class="tc-badge">${c.unlock.friends?_t('team.druzey2'):c.hire&&unl?_t('team.mozhno_nanyat'):_t('team.skoro')}</span>`}<span class="tc-rar">${RAR[c.rarity]}</span></div>
  <div class="tc-body"><b>${esc(c.name)}</b><small>${esc(c.bio)}</small><div class="tc-pips">${pips}</div><div class="tc-inc">${income}${nextInc?`<span class="tc-next">→ ${nextInc.crystals?'+'+nextInc.crystals+'◆ ':''}${nextInc.metal?'+'+nextInc.metal+'▣':''}</span>`:''}</div>${action}</div></article>`;}
function renderTeam(){const s=S();T.accrue(s);const hired=T.CREW.filter(c=>T.level(s,c.id)).length;
 teamD.innerHTML=head(_t('team.passivnyy_dohod'),_t('team.komanda_bazy'),'team')+`<p class="g-lead">${_t('team.koty_ekipazha',{n:hired,total:T.CREW.length})}</p>`+
  `<div id="team-store-box">${storeHtml()}</div><p class="g-feedback" id="team-feedback" role="status"></p><div class="team-grid">${T.CREW.map(cardHtml).join('')}</div>`+
  `<p class="g-note">${_t('team.redkih_kotov')}</p>`;
 wireClose(teamD);wireTeam();}
function wireTeam(){const fb=t=>{const e=$('#team-feedback');if(e)e.textContent=t;};
 const c=$('#team-claim');if(c)c.onclick=()=>{const r=T.claim(S());fb(r.text);if(r.ok){haptic();commit();}renderTeam();fb(r.text);};
 const st=$('#team-storage');if(st)st.onclick=()=>{const r=T.upgradeStorage(S());if(r.ok){haptic();commit();}renderTeam();fb(r.text);};
 teamD.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{const r=T.upgrade(S(),b.dataset.up);if(r.ok){haptic();commit();checkRank();}else haptic('warning');renderTeam();fb(r.text);});
 teamD.querySelectorAll('[data-hire]').forEach(b=>b.onclick=()=>{const r=T.hire(S(),b.dataset.hire);if(r.ok){haptic();commit();checkRank();}else haptic('warning');renderTeam();fb(r.text);});
 teamD.querySelectorAll('[data-invite]').forEach(b=>b.onclick=()=>UI.openCrew());}
function openTeam(){renderTeam();open('team');clearInterval(teamTimer);teamTimer=setInterval(()=>{if(!teamD.open){clearInterval(teamTimer);return;}T.accrue(S());const box=$('#team-store-box');if(box){box.innerHTML=storeHtml();wireTeam();}},1000);}

// ---------- welcome back «Пока тебя не было» ----------
const welD=dialog('welcome','welcome-dialog');
function openWelcome(info){const s=S(),cats=T.CREW.filter(c=>T.level(s,c.id)).slice(0,5),h=info.hours;
 welD.innerHTML=head(_t('team.vozvrascheniem_baz'),_t('team.poka_tebya'),'welcome')+
  `<div class="wb-cats">${cats.map((c,k)=>`<img src="${portrait(c.id)}" alt="" style="z-index:${9-k}">`).join('')}</div>`+
  `<p class="g-lead">${_t('team.komanda_rabotala',{time:h>=1?_t('team.hours',{n:Math.floor(h)}):_t('team.min',{n:Math.max(1,Math.round(h*60))})})}</p>`+
  `<div class="wb-loot"><span>${ICON.crystal}<b>+${info.stored.crystals}</b><small>${_t('team.kristally')}</small></span><span>${ICON.metal}<b>+${info.stored.metal}</b><small>${_t('team.metall')}</small></span></div>`+
  (info.full?`<p class="wb-full">${_t('team.sklad_byl',{store:IC.store,hours:T.STORAGE[T.STORAGE.length-1].hours})}</p>`:'')+
  `<button class="primary g-cta" id="wb-claim">${_t('team.zabrat_vse')}</button><button class="g-secondary" id="wb-team">${_t('team.komanda_bazy2',{team:IC.team})}</button><p class="g-feedback" id="wb-feedback" role="status"></p>`;
 wireClose(welD);$('#wb-claim').onclick=()=>{const r=T.claim(S());if(r.ok){haptic();commit();Game.toast(r.text);welD.close();}else $('#wb-feedback').textContent=r.text;};$('#wb-team').onclick=()=>{welD.close();openTeam();};
 S().team.welcomeAt=Date.now();Game.save();open('welcome');}
function checkWelcome(acc){if(!acc)return;const info=T.welcomeInfo(S(),acc.away);if(info.show)whenFree(()=>{const again=T.welcomeInfo(S(),T.WELCOME_AWAY_MS);if(again.stored.crystals+again.stored.metal>=2)openWelcome({...info,stored:again.stored});});}

// ---------- ranks: HUD chip, profile, celebration ----------
const profD=dialog('profile','profile-dialog'),rankD=dialog('rankup','rankup-dialog');
const PART_NAMES={story:_t('team.syuzhet_zhizni'),cards:_t('team.kartochki_snaryazh'),base:_t('team.postroyki_bazy'),expeditions:_t('team.polevye_ekspeditsi'),watch:_t('team.dni_vahty'),crew:_t('team.komanda_bazy'),friends:_t('team.druzya_ekipazhe'),extras:_t('team.kody_signala')};
function updateHud(){const p=T.points(S()),r=T.rankOf(p.total),span=$('header .brand span');if(span){span.innerHTML=`${insignia(r.index,14)}${esc(r.rank.name)}`;span.classList.add('rank-mini');}
 const b=$('header .brand');if(b&&!b.dataset.rank){b.dataset.rank='1';b.setAttribute('role','button');b.setAttribute('aria-label',_t('team.profil_zvanie'));b.addEventListener('click',()=>{if(Game.running)openProfile();});}
 const st=T.stored(S()),cap=T.storeCap(S()),full=(cap.crystals+cap.metal)>0&&(st.crystals+st.metal)>=(cap.crystals+cap.metal)*.5;document.querySelectorAll('[data-team-nav="team"] .g-dot').forEach(d=>d.hidden=!full);}
function openProfile(){const s=S(),p=T.points(s),r=T.rankOf(p.total);
 profD.innerHTML=head(_t('team.profil_kosmonavta'),esc(name()),'profile')+
  `<div class="pf-hero"><div class="pf-badge">${insignia(r.index,96)}</div><div><span class="pf-rank">${esc(r.rank.name)}</span><b class="pf-pts">${_t('team.ekspeditsii',{n:p.total,pts:fmt(p.total)})}</b>${r.next?`<div class="pf-bar"><i style="width:${Math.round(r.progress*100)}%"></i></div><small class="pf-next">${_t('team.zvaniya',{name:esc(r.next.name),toNext:fmt(r.toNext)})}</small>`:'<small class="pf-next">'+_t('team.vysshee_zvanie')+'</small>'}</div></div>`+
  `<div class="pf-parts">${Object.entries(p.parts).map(([k,v])=>`<div><span>${PART_NAMES[k]}</span><b>${fmt(v)}</b></div>`).join('')}</div>`+
  `<h3 class="g-sub">${_t('team.zvaniya2')}</h3><div class="pf-ladder">${T.RANKS.map((x,k)=>`<div class="${k<r.index?'done':k===r.index?'now':'next'}">${insignia(k,34)}<span><b>${esc(x.name)}</b><small>${k?_t('team.x2',{pts:fmt(x.min)}):_t('team.start_ekspeditsii')}</small></span>${k<=r.index?`<i>${ICON.check}</i>`:''}</div>`).join('')}</div>`+
  `<p class="g-note pf-xp-note">${_t('moon.xp_note')}</p>`+(UI.moonCard?UI.moonCard():'')+
  `<button class="primary g-cta" id="pf-leaders">${_t('team.tablitsa_liderov',{trophy:IC.trophy})}</button><button class="g-secondary" id="pf-share">${ICON.share} ${_t('team.podelitsya_zvaniem')}</button><p class="g-note pts-disclaimer">${_t('points.disclaimer')}</p>`;
 wireClose(profD);$('#pf-leaders').onclick=()=>openLeaders('overall');$('#pf-share').onclick=()=>UI.openShare&&UI.openShare('invite');open('profile');}
function celebrate(r){rankD.innerHTML=`<div class="ru-rays" aria-hidden="true"></div><div class="ru-body"><span class="eyebrow">${_t('team.novoe_zvanie')}</span><div class="ru-badge">${insignia(r.index,132)}</div><h2>${esc(r.rank.name)}</h2><p>${['',_t('team.pervyy_polet'),_t('team.ty_znaesh'),_t('team.teper_ty'),_t('team.vysshee_zvanie2')][r.index]||''}</p>
  ${r.next?`<small>${_t('team.sleduyuschee_zvani',{name:esc(r.next.name),toNext:fmt(r.toNext)})}</small>`:''}<button class="primary g-cta" id="ru-ok">${_t('team.sluzhu_ekspeditsii')}</button><button class="g-secondary" id="ru-share">${ICON.share} ${_t('team.pohvastatsya_druzy')}</button></div>`;
 rankD.querySelector('#ru-ok').onclick=()=>rankD.close();rankD.querySelector('#ru-share').onclick=()=>{rankD.close();UI.openShare&&UI.openShare('invite');};
 haptic();try{window.MoonCinema?.sound?.chime?.();}catch{}open('rankup');}
function checkRank(){const up=T.rankUp(S());if(up){Game.save();whenFree(()=>celebrate(up));}updateHud();}

// ---------- leaderboard ----------
const leadD=dialog('leaders','leaders-dialog');let leadKind='overall',leadCache={},leadBusy=false;
// v37: places by server Moon Points; a hidden player is shown by a callsign («hide me» in Rules → Privacy).
const lbName=x=>x.hidden&&x.tag?_t('lb.callsign',{tag:x.tag}):x.name||_t('team.kosmonavt');
// v39: name frames (season pass / Telegram Stars) and the patron star are cosmetic only.
const FRAME_RE=/^frame_[a-z]+$/;
function rowHtml(x,kind){const medal=x.place<=3?`<i class="lb-medal m${x.place}">${x.place}</i>`:`<i class="lb-place">${x.place}</i>`,frame=FRAME_RE.test(x.frame||'')?' cos-name cos-'+x.frame:'';
 const ico=kind==='overall'?insignia(Math.max(0,Math.min(4,x.rank|0)),22):kind==='season'?`<span class="lb-ico lb-season">🏆</span>`:`<span class="lb-ico">${ICON.crew}</span>`;
 return`<div class="lb-row ${x.me?'me':''} ${x.hidden?'hidden-name':''}">${medal}<span class="lb-name">${ico}<b class="${frame.trim()}"><bdi>${esc(lbName(x))}</bdi>${x.patron?`<i class="patron-star" title="${esc(_t('shop.badge_patron'))}">✦</i>`:''}</b>${x.me?'<em>'+_t('team.ty')+'</em>':''}</span><span class="lb-val">${kind==='overall'?`${ICON.moon||''}${fmt(x.points||0)}`:kind==='season'?`${ICON.cup||''}${fmt(x.points||0)}`:`${x.full||0}<small> · ${x.joined||0}</small>`}</span></div>`;}
async function loadLeaders(kind){if(!UI.online||leadBusy)return;leadBusy=true;try{const r=await UI.api('/api/leaderboard',{kind});leadCache[kind]=r;}catch{leadCache[kind]={error:true};}leadBusy=false;if(leadD.open)renderLeaders();}
function renderLeaders(){const s=S(),p=T.points(s),r=T.rankOf(p.total),data=leadCache[leadKind];
 const tabs=`<div class="lb-tabs" role="tablist"><button role="tab" data-kind="overall" class="${leadKind==='overall'?'on':''}">${_t('team.obschiy_zachet',{trophy:IC.trophy})}</button><button role="tab" data-kind="recruiters" class="${leadKind==='recruiters'?'on':''}">${ICON.crew}${_t('team.verbovschiki')}</button><button role="tab" data-kind="season" class="${leadKind==='season'?'on':''}">🏆 ${_t('lb.tab_season')}</button></div>`;
 const mine=`<div class="lb-mine">${insignia(r.index,44)}<span><small>${_t('team.ty2',{name:'<bdi>'+esc(name())+'</bdi>'})}</small><b>${esc(r.rank.name)} ${_t('team.ochkov3',{total:fmt(p.total)})}</b></span>${data&&data.me&&data.me.place?`<i>#${data.me.place}</i>`:''}</div>`;
 let body;
 if(!UI.online)body=`<div class="lb-soon"><span class="gchip badge">${_t('growth.skoro')}</span><b>${_t('team.reyting_vseh')}</b><p>${_t('team.tablitsa_liderov2')}</p><button class="g-secondary" id="lb-invite">${ICON.crew} ${_t('team.pozvat_druzey')}</button></div>`;
 else if(!data){body='<div class="lb-loading">'+_t('team.zagruzhaem_reyting')+'</div>';loadLeaders(leadKind);}
 else if(data.error)body=`<div class="lb-soon"><b>${_t('team.net_svyazi')}</b><p>${_t('team.poprobuy_otkryt')}</p><button class="g-secondary" id="lb-retry">${_t('team.obnovit')}</button></div>`;
 else{const list=(data.top||[]);body=(list.length?`<div class="lb-head"><span>${_t('team.mesto')}</span><span>${leadKind==='recruiters'?_t('team.proshli_zhizn'):leadKind==='season'?_t('season.score'):_t('team.ochki')}</span></div><div class="lb-list">${list.map(x=>rowHtml(x,leadKind)).join('')}</div>`:'<div class="lb-soon"><b>'+_t('team.poka_pusto')+'</b><p>'+_t('team.stan_pervym')+'</p></div>')+(data.me&&data.me.place&&!list.some(x=>x.me)?`<div class="lb-list pinned">${rowHtml({...data.me,me:true,name:data.me.hidden?'':name()},leadKind)}</div>`:'');}
 leadD.innerHTML=head(_t('team.reyting_ekspeditsi'),_t('team.tablitsa_liderov3'),'leaders')+tabs+mine+body+'<p class="g-note">'+(leadKind==='recruiters'?_t('team.drug_zaschityvaets'):(leadKind==='season'?seasonNote():_t('team.ochki_syuzhet'))+'</p><p class="g-note pts-disclaimer">'+_t('points.disclaimer'))+'</p>'+(UI.online&&data&&!data.error?'<p class="g-note lb-snap">'+_t('lb.snapshot')+'</p>':'');
 wireClose(leadD);leadD.querySelectorAll('[data-kind]').forEach(b=>b.onclick=()=>{leadKind=b.dataset.kind;renderLeaders();});
 const inv=$('#lb-invite');if(inv)inv.onclick=()=>UI.openCrew();const rt=$('#lb-retry');if(rt)rt.onclick=()=>{delete leadCache[leadKind];renderLeaders();};}
function seasonNote(){const SU=window.MoonSeasonUI,SC=window.MoonSeason;let when='';try{const st=UI.stage3?.season||SC.seasonOf(Date.now());when=SU?SU.seasonName(st)+' · '+SU.leftText(st)+'. ':'';}catch{}return esc(when)+_t('lb.season_note');}
function openLeaders(kind='overall'){leadKind=kind;delete leadCache[kind];renderLeaders();open('leaders');}

// ---------- «Код сигнала» card inside «Связь с Землёй» (v37: checked on the server; offline → «available after launch») ----------
let codeMsg='',codeOk=false,codeBusy=false;
function codeCard(){const n=S().team.codes.length,on=!!UI.online,max=(UI.rules?UI.rules():window.MoonGrowth.MOON).code.max;
 return`<div class="code-card ${on?'':'pending'}"><div class="cc-top">${IC.signal}<div><b>${_t('team.kod_signala')}</b><small>${_t('team.kot_pryachet',{max})}</small></div></div>
 <form class="cc-form" id="code-form" autocomplete="off"><input id="code-input" maxlength="24" placeholder="${_t('team.kod_video')}" autocapitalize="characters" spellcheck="false" aria-label="${_t('team.kod_signala')}" ${on?'':'disabled'}><button class="primary" id="code-send" type="submit" ${on&&!codeBusy?'':'disabled'}>${codeBusy?'…':_t('team.vvesti')}</button></form>
 <p class="cc-msg ${codeOk?'ok':''}" id="code-msg" role="status">${esc(on?codeMsg:_t('code.offline'))}</p><small class="cc-count">${n?_t('team.aktivirovano_kodov',{n}):_t('team.kazhdyy_kod')}</small></div>`;}
function codeError(r){return r.error==='wrong_code'?_t('code.wrong',{n:Math.max(0,r.left|0)}):r.error==='too_many_attempts'?_t('code.too_many'):r.error==='too_short'?_t('code.short'):r.error==='already'?_t('tcore.etot_kod'):r.error==='expired'?_t('tcore.srok_deystviya'):_t('growth.net_svyazi');}
function wireCode(d){const f=d.querySelector('#code-form');if(!f)return;f.onsubmit=async e=>{e.preventDefault();const inp=d.querySelector('#code-input');if(codeBusy||!UI.online)return;const raw=inp.value;
 if(T.normalizeCode(raw).length<4){codeOk=false;codeMsg=_t('code.short');}
 else{codeBusy=true;const btn=d.querySelector('#code-send');if(btn){btn.disabled=true;btn.textContent='…';}
  let r;try{r=await UI.api('/api/code/redeem',{code:raw});}catch(err){r={ok:false,error:err.code||'network'};}codeBusy=false;codeOk=!!r.ok;
  if(r.ok){const got=window.MoonGrowth.applyServerReward(S(),r.reward)||{};T.addCode(S(),r.codeId);codeMsg=_t('team.signal_prinyat',{got:window.MoonGrowth.gotText({...got,points:r.reward?.points||0})});inp.value='';haptic();commit();checkRank();try{window.MoonCinema?.sound?.chime?.();}catch{}}
  else{if(r.error==='already')T.addCode(S(),r.codeId);codeMsg=codeError(r);haptic('warning');Game.save();}}
 const card=d.querySelector('.code-card');if(card){const t=document.createElement('div');t.innerHTML=codeCard();card.replaceWith(t.firstElementChild);wireCode(d);if(!codeOk){const ni=d.querySelector('#code-input');if(ni){ni.value=raw;ni.focus({preventScroll:true});ni.select?.();}}}};}
function openCode(){UI.openTasks();setTimeout(()=>{const i=$('#code-input');if(i){i.scrollIntoView({block:'center'});}},120);}

// ---------- entry points ----------
function navBtn(kind,label,cls,icon,fn){const b=document.createElement('button');b.className=cls;b.dataset.teamNav=kind;b.innerHTML=`<span class="gn-icon">${icon}</span><span class="gn-label">${label}</span><i class="g-dot" hidden></i>`;b.onclick=fn;return b;}
const nav=$('.growth-nav');if(nav&&!nav.querySelector('[data-team-nav]')){nav.append(navBtn('team',_t('core.komanda'),'gn',IC.team,openTeam));nav.classList.add('four');}
const dock=$('#growth-dock');if(dock&&!dock.querySelector('[data-team-nav]'))dock.append(navBtn('team',_t('core.komanda'),'gd',IC.team,openTeam));
const mnav=$('.menu-navigation');if(mnav&&!mnav.querySelector('[data-team-nav]'))for(const[k,l,ic,fn]of[['team',_t('team.komanda_bazy'),IC.team,openTeam],['profile',_t('team.zvanie'),IC.trophy,openProfile],['leaders',_t('team.lidery'),IC.trophy,()=>openLeaders('overall')],['code',_t('team.kod_signala'),IC.signal,openCode]]){const b=navBtn(k,l,'gm',ic,fn);b.addEventListener('click',()=>$('#chapters')?.close(),true);mnav.append(b);}
// Cards collection: a compact «Команда базы» strip above the daily panel.
const cardsD=$('#cards');function renderStrip(){if(!cardsD)return;let strip=$('#team-strip');if(!strip){strip=document.createElement('button');strip.id='team-strip';strip.className='team-strip';const daily=cardsD.querySelector('.daily-panel');(daily||cardsD.lastChild).before(strip);strip.onclick=()=>{cardsD.close();openTeam();};}
 const s=S();T.accrue(s);const r=T.rates(s),st=T.stored(s),hired=T.CREW.filter(c=>T.level(s,c.id));
 strip.innerHTML=`<span class="tsr-cats">${(hired.length?hired:T.CREW.slice(0,3)).slice(0,4).map(c=>`<img src="${portrait(c.id)}" alt="" class="${hired.length?'':'dim'}">`).join('')}</span><span class="tsr-text"><small>${_t('team.komanda_bazy3',{hired:hired.length,CREW:T.CREW.length})}</small><b>${r.crystals+r.metal?`${_t('team.chas2',{crystals:r.crystals,metal:r.metal})}`:_t('team.soberi_komandu')}</b><em>${st.crystals+st.metal?`${_t('team.sklade',{crystals:st.crystals,metal:st.metal})}`:_t('team.dohod_kopitsya')}</em></span><span class="tsr-go">›</span>`;}
if(cardsD)new MutationObserver(()=>{if(cardsD.open)renderStrip();}).observe(cardsD,{attributes:true,attributeFilter:['open']});

// ---------- life cycle ----------
function onCrew(c){if(!c)return;const fresh=T.setFriends(S(),c.count||0);announce(fresh);}
function announce(fresh){if(!fresh||!fresh.length)return;Game.save();const c=T.byId(fresh[0]),inc=T.incomeOf(c,1);Game.toast(`${_t('team.komande_bazy',{name:c.name,crystals:inc.crystals?'+'+inc.crystals+' ◆ ':'',metal:inc.metal?'+'+inc.metal+' ▣ ':''})}`);updateHud();}
let syncing=false;const prevSave=Game.onSave;Game.onSave=st=>{try{prevSave&&prevSave(st);}catch{}if(syncing)return;syncing=true;try{announce(T.syncCrew(S()));checkRank();}finally{syncing=false;}};
function tickEconomy(showWelcome){const s=S();const fresh=T.syncCrew(s);const acc=T.accrue(s);announce(fresh);if(showWelcome)checkWelcome(acc);updateHud();}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)tickEconomy(true);else{T.accrue(S());Game.save();}});
setInterval(()=>{if(!document.hidden)tickEconomy(false);},30000);
window.MoonTeamUI={openTeam,openProfile,openLeaders,openWelcome,celebrate,codeCard,wireCode,onCrew,insignia,refresh:updateHud};
// boot: income since last visit → welcome-back after the intro/daily modals; first rank check is silent.
tickEconomy(true);{const was=S().team.rankSeen;checkRank();if(was<0)Game.save();}
})();
