/* v37 «Правила и награды» (Rules & Rewards): how Moon Points are earned (first-game rules), fair play, FAQ and privacy
   with the leaderboard «hide me» switch. Opens from the 📜 button on the cover and from the main menu. All texts are
   translated (13 languages); numbers come from growth-core.js MOON (or the server when it is connected). */
(function(){'use strict';
const Game=window.MoonGame,G=window.MoonGrowth,UI=window.MoonGrowthUI;if(!Game||!G||!UI||!UI.kit)return;
const{dialog,open:openDialog,head,wireClose,esc,haptic}=UI.kit;const $=s=>document.querySelector(s),S=()=>Game.state,cfg=window.MoonGrowthConfig||{};
const d=dialog('rules','rules-dialog');let busy=false,tag='';
const SECTIONS=[['🌕','s_moon'],['🌙','s_story'],['⏳','s_vest'],['📅','s_daily'],['📡','s_social'],['🔑','s_codes'],['👥','s_friends'],['🏆','s_season'],['🗼','s_goal'],['🛍️','s_shop'],['🎖️','s_ranks'],['⚖️','s_fair'],['💎','s_value']];
// Signed numbers stay intact inside Hebrew/Arabic sentences.
const iso=v=>window.MoonI18n&&MoonI18n.isRTL(MoonI18n.lang)?'\u2066'+v+'\u2069':String(v);
function params(){const m=UI.rules?UI.rules():G.MOON;
 const v=m.vestDays||G.MOON.vestDays,dd=m.referralDays||G.MOON.referralDays;
 return{s_story:{a:m.story.life1,b:m.story.life2,c:m.story.life3,d:m.story.life4,v},s_vest:{v},a4:{d:dd},s_daily:{list:m.streak.slice(0,7).map(p=>iso('+'+p)).join(' · '),max:m.streak[6]},
  s_social:{ch:m.channel,f:m.social.follow,d:m.social.daily,p:m.socialPending},s_codes:{def:m.code.default,max:m.code.max,fails:m.codeFails},s_friends:{n:m.referral,cap:m.referralCap,d:dd,v},...stage3()};}
// v39: season length and pass/goal numbers (server state when online, else the defaults from season-core.js).
function stage3(){const SC=window.MoonSeason;if(!SC)return{};const st=UI.stage3||{},len=SC.seasonLength(st.season?.length),tiers=st.season?.tiers||SC.seasonTiers(len),goal=st.goal?.reward||SC.goalReward(len);
 return{s_season:{len:_t(len==='week'?'season.len_week':'season.len_month'),pts:tiers.reduce((a,t)=>a+(t.reward.points||0),0),g:SC.SEASON_GRACE_DAYS},s_goal:{a:iso('1'),b:iso('3'),c:iso('5'),n:goal.points,d:SC.GOAL_CLAIM_DAYS,m:st.goal?.minBeacons||SC.GOAL_MIN_BEACONS},s_shop:{},a7:{g:SC.SEASON_GRACE_DAYS}};}
function channelName(){return String(UI.channel?.username||cfg.CHANNEL_USERNAME||'').trim().replace(/^@/,'');}
function render(){const P=params(),online=!!UI.online,hidden=!!S().growth.lbHidden,ch=channelName();
 const state=online?(hidden?_t('rules.hide_on',{name:_t('lb.callsign',{tag:tag||'····'})}):_t('rules.hide_off')):_t('moon.after_launch');
 d.innerHTML=head(_t('rules.eyebrow'),_t('rules.title'),'rules')+`<p class="g-lead">${_t('rules.lead')}</p>`+UI.moonCard()+
  `<div class="rules-list">${SECTIONS.map(([ic,k])=>`<section class="rule rule-${k}"><span class="rule-ic" aria-hidden="true">${ic}</span><div><h3>${_t('rules.'+k+'_t')}</h3><p>${_t('rules.'+k,P[k]||{})}</p></div></section>`).join('')}</div>`+
  `<h3 class="g-sub">${_t('rules.faq')}</h3><div class="faq">${[1,2,3,4,5,6,7].map(i=>`<details><summary>${_t('rules.q'+i)}</summary><p>${_t('rules.a'+i,P['a'+i]||{})}</p></details>`).join('')}</div>`+
  `<h3 class="g-sub" id="rules-privacy">${_t('rules.privacy')}</h3><div class="privacy"><p>${_t('rules.p1')}</p><p>${_t('rules.p2')}</p>`+
  `<label class="pv-toggle ${online?'':'pending'}"><span class="pv-text"><b>${_t('rules.hide')}</b><small>${esc(state)}</small></span><input type="checkbox" role="switch" id="pv-hide" ${hidden?'checked':''} ${online&&!busy?'':'disabled'}><i class="pv-knob" aria-hidden="true"></i></label>`+
  `<p>${_t('rules.p3')}</p>${ch?`<button class="g-secondary" id="rules-channel">${_t('rules.channel_btn')}</button>`:''}</div>`+
  `<p class="g-note"><button type="button" class="link-btn" id="rules-terms">${_t('terms.title')}</button></p><p class="g-note pts-disclaimer">${_t('points.disclaimer')}</p>`;
 wireClose(d);const tb=$('#rules-terms');if(tb)tb.onclick=()=>window.MoonSeasonUI?.openTerms?.();const t=$('#pv-hide');if(t)t.onchange=()=>setHidden(t.checked);const c=$('#rules-channel');if(c)c.onclick=()=>UI.openUrl('https://t.me/'+ch);}
async function setHidden(v){if(!UI.online||busy)return;busy=true;render();try{const r=await UI.api('/api/privacy',{hidden:!!v});S().growth.lbHidden=!!r.hidden;tag=r.tag||tag;Game.save();haptic();}catch{haptic('warning');}busy=false;render();}
async function loadPrivacy(){if(!UI.online||tag)return;try{const r=await UI.api('/api/privacy',{});tag=r.tag||'';S().growth.lbHidden=!!r.hidden;if(d.open)render();}catch{}}
function openRules(section){render();openDialog('rules');d.scrollTop=0;if(section==='privacy')setTimeout(()=>$('#rules-privacy')?.scrollIntoView({block:'start'}),60);loadPrivacy();}
// Entry points: 📜 next to the cover language pill, and a row in the main menu under «Language».
function mount(){const cover=$('#cover');
 if(cover&&!$('#cover-rules')){let tools=cover.querySelector('.cover-tools');if(!tools){tools=document.createElement('div');tools.className='cover-tools';const lang=$('#cover-lang');if(lang){lang.before(tools);tools.append(lang);}else cover.append(tools);}
  const b=document.createElement('button');b.type='button';b.id='cover-rules';b.className='cover-rules';b.title=_t('rules.menu');b.setAttribute('aria-label',_t('rules.menu'));b.setAttribute('aria-haspopup','dialog');
  b.innerHTML='<span aria-hidden="true">📜</span>';b.addEventListener('click',()=>openRules());tools.append(b);}
 const lang=$('#menu-lang');if(lang&&!$('#menu-rules')){const b=document.createElement('button');b.type='button';b.id='menu-rules';b.className='menu-lang menu-rules';
  b.innerHTML=`<span>📜 ${esc(_t('rules.menu'))}</span><b aria-hidden="true">›</b>`;b.addEventListener('click',()=>openRules());lang.after(b);}}
mount();
window.MoonRulesUI={open:openRules,render};
})();
