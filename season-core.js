/* v39 growth stage 3, shared by the game (browser) and the node tests: UTC seasons with a free season pass, the shared
   Crew goal «light N beacons together», and the Telegram Stars cosmetics catalog (looks and convenience only — Stars
   NEVER buy Moon Points). Every reward is paid by the server (server/src/logic.js mirrors these numbers; tests compare).
   Here: display data, the season clock and the owned-cosmetics cache in the save (growth.cos). No DOM access. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MoonSeason=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const DAY_MS=86400000;
const SEASON_TIERS=[{need:30,reward:{crystals:20,metal:10}},{need:100,reward:{points:15}},{need:200,reward:{item:'frame_aurora'}},{need:350,reward:{points:25}},
 {need:550,reward:{crystals:40,metal:30}},{need:800,reward:{points:40}},{need:1100,reward:{badge:'season'}},{need:1500,reward:{points:60,item:'frame_gold'}}];
const WEEK_DIVISOR=4,SEASON_SCORE_SKIP=['story','season','goal'];
const GOAL_BEACONS={streak:1,story:3,ref_invitee:5},GOAL_TARGET={month:10000,week:2500},GOAL_REWARD={points:50,badge:'beacon'},GOAL_CLAIM_DAYS=7;
const COSMETICS={frame_aurora:{kind:'frame',source:'season'},frame_gold:{kind:'frame',source:'season'},frame_nebula:{kind:'frame',stars:30},frame_comet:{kind:'frame',stars:30},badge_patron:{kind:'badge',stars:60},cargo_bay:{kind:'boost',stars:40}};
const CARGO_HOURS=3,FRAMES=Object.keys(COSMETICS).filter(id=>COSMETICS[id].kind==='frame');
const seasonLength=v=>v==='week'?'week':'month';
function seasonOf(now,length='month'){
 if(seasonLength(length)==='week'){const day=Math.floor(now/DAY_MS),dow=(new Date(day*DAY_MS).getUTCDay()+6)%7,startDay=day-dow,thu=new Date((startDay+3)*DAY_MS),y=thu.getUTCFullYear();
  const week=Math.floor(((startDay+3)*DAY_MS-Date.UTC(y,0,1))/DAY_MS/7)+1;return{id:`W${y}-${String(week).padStart(2,'0')}`,length:'week',start:startDay*DAY_MS,end:(startDay+7)*DAY_MS,week};}
 const d=new Date(now),y=d.getUTCFullYear(),m=d.getUTCMonth();return{id:`S${y}-${String(m+1).padStart(2,'0')}`,length:'month',start:Date.UTC(y,m,1),end:Date.UTC(y,m+1,1)};}
function seasonTiers(length='month'){const k=seasonLength(length)==='week'?WEEK_DIVISOR:1;
 return SEASON_TIERS.map((t,i)=>({tier:i+1,need:Math.ceil(t.need/k),reward:t.reward.points?{...t.reward,points:Math.ceil(t.reward.points/k)}:{...t.reward}}));}
const goalReward=length=>seasonLength(length)==='week'?{...GOAL_REWARD,points:Math.ceil(GOAL_REWARD.points/WEEK_DIVISOR)}:{...GOAL_REWARD};
const shopItems=()=>Object.entries(COSMETICS).filter(([,v])=>v.stars).map(([id,v])=>({id,kind:v.kind,stars:v.stars}));
// Time left until the season ends (UTC): whole days, or hours on the last day.
function timeLeft(end,now=Date.now()){const ms=Math.max(0,end-now);return ms>=DAY_MS?{days:Math.ceil(ms/DAY_MS),hours:0}:{days:0,hours:Math.max(1,Math.ceil(ms/3600000))};}
// Progress of the pass track as 0..1 between tiers, for the bar.
function trackFill(score,tiers){const last=tiers[tiers.length-1].need;return Math.max(0,Math.min(1,(Number(score)||0)/last));}
function nextTier(score,tiers){return tiers.find(t=>score<t.need)||null;}
// Offline view (no server): the real calendar, the real pass, zero progress. Nothing can be claimed.
function offlineView(now=Date.now(),length='month'){const s=seasonOf(now,length);
 return{season:{...s,score:0,tiers:seasonTiers(s.length).map(t=>({...t,claimed:false,ready:false}))},goal:{id:s.id,length:s.length,end:s.end,progress:0,target:GOAL_TARGET[s.length],reached:false,mine:0,claimed:false,claimable:false,reward:goalReward(s.length),prev:null},
  shop:{enabled:false,items:shopItems().map(i=>({...i,owned:false})),owned:[],frame:'',cargoHours:CARGO_HOURS}};}
// ---------- owned cosmetics cache (growth.cos in the save; the server list always wins when online) ----------
function cleanCos(raw){const owned=Array.isArray(raw&&raw.owned)?[...new Set(raw.owned.filter(id=>typeof id==='string'&&COSMETICS[id]))]:[];const frame=raw&&typeof raw.frame==='string'&&owned.includes(raw.frame)&&COSMETICS[raw.frame].kind==='frame'?raw.frame:'';return{owned,frame};}
function setCos(s,shop){if(!s||!s.growth||!shop||!Array.isArray(shop.owned))return false;const next=cleanCos({owned:shop.owned,frame:shop.frame||''}),prev=s.growth.cos||{owned:[],frame:''};
 const same=prev.frame===next.frame&&prev.owned.length===next.owned.length&&prev.owned.every((x,i)=>x===next.owned[i]);s.growth.cos=next;return!same;}
const owns=(s,id)=>!!(s&&s.growth&&s.growth.cos&&Array.isArray(s.growth.cos.owned)&&s.growth.cos.owned.includes(id));
const cargoHours=s=>owns(s,'cargo_bay')?CARGO_HOURS:0;
return{DAY_MS,SEASON_TIERS,WEEK_DIVISOR,SEASON_SCORE_SKIP,GOAL_BEACONS,GOAL_TARGET,GOAL_REWARD,GOAL_CLAIM_DAYS,COSMETICS,CARGO_HOURS,FRAMES,seasonLength,seasonOf,seasonTiers,goalReward,shopItems,timeLeft,trackFill,nextTier,offlineView,cleanCos,setCos,owns,cargoHours};});
