if(typeof _t==='undefined'&&typeof require==='function')require('./i18n.js');
/* Growth rules shared by the game (browser) and the node tests: daily login streak «Вахта на базе»,
   reward application, referral links, Moon Points display rules and cloud-save conflict resolution.
   v37: Moon Points are a SERVER currency (first-game rules). The client never awards them; it shows the server balance
   from a cache, or «available after launch» while there is no server. Opening a social link pays nothing.
   No DOM access here. The server (server/src/logic.js) mirrors the same constants; tests check they match. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./core.js'):root.MoonCore);if(typeof module==='object'&&module.exports)module.exports=api;else root.MoonGrowth=api;})(typeof globalThis!=='undefined'?globalThis:this,function(Core){
'use strict';
const DAY_MS=86400000;
// Seven escalating days; the 7th is the big cargo drop. After day 7 the cycle starts again from day 1 while the run continues.
const STREAK_REWARDS=[{crystals:3},{metal:5},{crystals:4,energy:4},{metal:8},{crystals:6,energy:6},{crystals:5,metal:10},{crystals:15,metal:15,energy:10,badge:'watch7'}];
// Supply kit for both sides once the invited friend finishes LIFE #1 (together with +200 Moon Points from the server).
const REFERRAL_REWARDS={full:{crystals:15,metal:10}};
const CHANNEL_REWARD={crystals:10,metal:5,badge:'channel'};
const SHARE_REWARD={crystals:2};
// Moon Points rules (server side; shown in «Rules & Rewards»). Daily things use the UTC day.
const MOON={story:{life1:500,life2:500,life3:750},streak:[3,5,7,10,12,15,25],channel:5,social:{follow:5,daily:5},referral:200,referralCap:20,
 code:{default:10,min:1,max:50},codeFails:10,socialPending:3};
const streakPoints=run=>MOON.streak[Math.max(1,Math.min(7,Math.floor(run)||1))-1];
// Social tasks: personal code MKTY-XXXX in a post/comment + link → team review. The community chat is a plain link (no reward).
const SOCIAL_PLATFORMS=['x','tiktok','instagram','youtube'];
const SOCIAL_NAMES={x:'X',tiktok:'TikTok',instagram:'Instagram',youtube:'YouTube'};
const BADGE_NAMES={watch7:_t('gcore.vahta_7'),channel:_t('gcore.svyazist'),crew1:_t('gcore.pervyy_ekipazhe'),crew5:_t('gcore.komandir_ekipazha'),season:_t('season.badge_season'),beacon:_t('season.badge_beacon')};

// v37: the day changes at 00:00 UTC for everyone (same as the server).
function utcDay(now=Date.now()){return new Date(now).toISOString().slice(0,10);}
const localDay=utcDay;
function dayIndex(key){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(key||'');return m?Math.round(Date.UTC(+m[1],+m[2]-1,+m[3])/DAY_MS):NaN;}
function ensure(s){if(!s.streak)s.streak=Core.initial().streak;if(!s.growth)s.growth=Core.initial().growth;if(!s.growth.moon)s.growth.moon={points:0,at:0};return s;}

// Pure streak state machine. «claimed» = today's reward already taken; «day» = the 1..7 slot for today.
// One missed day per 7 days is forgiven (the «shield»), like on the server.
const SHIELD_DAYS=7;
function streakStatus(s,now=Date.now()){ensure(s);const today=utcDay(now),st=s.streak;
 if(st.day===today)return{today,claimed:true,day:st.count,run:st.run,broken:false,reward:STREAK_REWARDS[st.count-1]||null,points:streakPoints(st.run),locked:false};
 const diff=st.day?dayIndex(today)-dayIndex(st.day):Infinity;
 // Device clock moved backwards past the last claim: wait until that date comes again instead of paying twice.
 if(diff<0)return{today,claimed:true,day:st.count,run:st.run,broken:false,reward:null,points:0,locked:true};
 const shield=diff===2&&st.count>0&&(!st.shield||dayIndex(today)-dayIndex(st.shield)>=SHIELD_DAYS),continuing=diff===1||shield,day=continuing?st.count%7+1:1,run=continuing?st.run+1:1;
 return{today,claimed:false,day,run,shield,broken:!!st.day&&diff>1&&!shield,reward:STREAK_REWARDS[day-1],points:streakPoints(run),locked:false};}

function room(s,key){if(key==='energy')return Math.max(0,Core.energyCapacity(s)-s.energy);return Math.max(0,Core.capacity(s)-s[key]);}
// Applies a reward within backpack/station limits. Energy without a solar station (or above its capacity) becomes metal.
function applyReward(s,reward){ensure(s);const got={crystals:0,metal:0,energy:0,lost:0,converted:0};if(!reward)return got;
 let energyLeft=Math.max(0,Math.floor(reward.energy||0));const e=Math.min(energyLeft,Math.floor(room(s,'energy')));s.energy+=e;got.energy=e;energyLeft-=e;got.converted=energyLeft;
 for(const key of['crystals','metal']){let want=Math.max(0,Math.floor(reward[key]||0));if(key==='metal')want+=energyLeft;const give=Math.min(want,room(s,key));s[key]+=give;got[key]=give;got.lost+=want-give;}
 if(reward.badge&&!s.growth.badges.includes(reward.badge))s.growth.badges.push(reward.badge);return got;}
function rewardText(r){if(!r)return'';const parts=[];if(r.points)parts.push('+'+r.points+' ⭐');if(r.crystals)parts.push('+'+r.crystals+' ◆');if(r.metal)parts.push('+'+r.metal+' ▣');if(r.energy)parts.push('+'+r.energy+' ϟ');return parts.join(' · ');}
function gotText(got){const t=rewardText(got);return(t||_t('gcore.ryukzak_polon'))+(got.converted?' '+_t('gcore.energiya_stala'):'')+(got.lost?' · '+_t('gcore.vlezlo',{n:got.lost}):'');}

function claimStreak(s,now=Date.now()){const st=streakStatus(s,now);if(st.claimed)return{ok:false,status:st,text:st.locked?_t('gcore.chasy_ustroystva'):_t('gcore.nagrada_segodnya')};
 const got=applyReward(s,st.reward);s.streak={day:st.today,count:st.day,run:st.run,best:Math.max(s.streak.best||0,st.run),total:(s.streak.total||0)+1,shield:st.shield?st.today:(s.streak.shield||'')};
 return{ok:true,status:streakStatus(s,now),day:st.day,got,text:_t('gcore.vahta_den',{day:st.day})+': '+gotText(got)};}
// The daily modal opens once per calendar day, only while today's reward is waiting.
function shouldShowStreak(s,now=Date.now()){ensure(s);const st=streakStatus(s,now);return!st.claimed&&s.growth.seen!==st.today;}
function markStreakSeen(s,now=Date.now()){ensure(s).growth.seen=utcDay(now);}

function parseStartParam(v){const m=/^ref_(\d{3,15})$/.exec(String(v||'').trim());return m?m[1]:'';}
function inviteLink(cfg,userId){const bot=String(cfg?.BOT_USERNAME||'MoonkattyHorizonsBot').replace(/^@/,''),short=String(cfg?.MINIAPP_SHORTNAME||'').trim(),id=/^\d{3,15}$/.test(String(userId||''))?String(userId):'';
 if(!id)return'https://t.me/'+bot+(short?'/'+short:'');
 return short?`https://t.me/${bot}/${short}?startapp=ref_${id}`:`https://t.me/${bot}?start=ref_${id}`;}
function shareUrl(url,text){return'https://t.me/share/url?url='+encodeURIComponent(url)+'&text='+encodeURIComponent(text||'');}

function claimShare(s,now=Date.now()){ensure(s);const day=utcDay(now);if(s.growth.shareDay===day)return{ok:false,text:''};s.growth.shareDay=day;const got=applyReward(s,SHARE_REWARD);return{ok:true,got,text:_t('gcore.spasibo_chto')+' '+gotText(got)};}
// Server ledger rewards are applied once per id, even if the response is replayed.
// Moon Points in the reward are NOT added here: the balance always comes from the server (setMoon); `got.points` is only for the toast.
function applyServerReward(s,r){ensure(s);if(!r||!r.id||s.growth.applied.includes(r.id))return null;s.growth.applied.push(r.id);if(s.growth.applied.length>300)s.growth.applied.splice(0,s.growth.applied.length-300);if(r.kind==='channel')s.growth.channel=true;
 const got=applyReward(s,r);got.points=Math.max(0,Math.floor(r.points||0));return got;}
// ---------- Moon Points cache ----------
function setMoon(s,moon,now=Date.now()){ensure(s);const p=moon&&typeof moon.points==='number'?moon.points:NaN;if(!Number.isFinite(p)||p<0)return false;s.growth.moon={points:Math.floor(p),at:now};return true;}
// online: balance from the server (fresh); cached: last known server balance while the connection is down; pending: no server yet.
function moonView(s,online){ensure(s);const m=s.growth.moon;if(online&&m.at)return{state:'online',points:m.points,at:m.at};if(m.at)return{state:'cached',points:m.points,at:m.at};return{state:'pending',points:null,at:0};}
function formatPoints(n){const v=Math.max(0,Math.floor(Number(n)||0));try{return new Intl.NumberFormat((typeof MoonI18n!=='undefined'&&MoonI18n.lang)||'en').format(v);}catch{return String(v);}}

// Progress score for cloud-save conflicts. Story beats dominate; resources only break near-ties.
const FLAGS=['recorder','antenna','signal','supply','engineerMet','engineerFixed','navigatorMet','navigatorSolved','scoutMet','artifact','complete','signalBriefed','vaultOpen','blueprint','chapter3Complete'];
function progressScore(s){if(!s||typeof s!=='object')return 0;let p=(Number(s.chapter)||1)*10000;for(const f of FLAGS)if(s[f]===true)p+=400;
 const arr=k=>Array.isArray(s[k])?s[k].length:0;p+=arr('cells')*150+arr('tools')*150+arr('beacons')*150+arr('buildings')*200+arr('signalClues')*150;
 for(const v of Object.values(s.cards||{}))p+=Number.isFinite(v)?v*120:0;
 const ex=s.expeditions;if(ex&&ex.done&&typeof ex.done==='object')p+=Object.keys(ex.done).length*300;
 p+=Math.min(400,(Number(s.crystals)||0)+(Number(s.metal)||0));return Math.max(0,Math.floor(p));}
// Which copy wins when the phone and the cloud disagree: more progress, then newer; a deliberate restart beats both.
function pickSave(local,remote){if(!remote)return'local';if(!local)return'remote';const lr=local.growth?.resetAt||0,rr=remote.growth?.resetAt||0;if(lr!==rr)return lr>rr?'local':'remote';
 const a=progressScore(local),b=progressScore(remote);if(a!==b)return a>b?'local':'remote';return(local.updatedAt||0)>=(remote.updatedAt||0)?'local':'remote';}

return{DAY_MS,STREAK_REWARDS,REFERRAL_REWARDS,CHANNEL_REWARD,SHARE_REWARD,MOON,SHIELD_DAYS,SOCIAL_PLATFORMS,SOCIAL_NAMES,BADGE_NAMES,streakPoints,utcDay,localDay,dayIndex,streakStatus,applyReward,rewardText,gotText,claimStreak,shouldShowStreak,markStreakSeen,parseStartParam,inviteLink,shareUrl,claimShare,applyServerReward,setMoon,moonView,formatPoints,progressScore,pickSave};});
