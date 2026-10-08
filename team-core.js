if(typeof _t==='undefined'&&typeof require==='function')require('./i18n.js');
/* v35 growth stage 2 rules (no DOM): crew cats with hourly income that accrues while the game is closed,
   secret «Код сигнала» codes (stored only as hashes), ranks Кадет → Адмирал Луны. Shared by the game and node tests.
   Server mirror of the rank points: server/src/logic.js (tests compare). */
(function(root,factory){const node=typeof module==='object'&&module.exports;const api=factory(node?require('./core.js'):root.MoonCore);if(node)module.exports=api;else root.MoonTeam=api;})(typeof globalThis!=='undefined'?globalThis:this,function(Core){
const HOUR=3600000;
// income[res][level-1] per hour. Story cats join for free when you meet them; two are hired for resources; rare cats come with friends.
const CREW=[
 {id:'geologist',name:_t('tcore.geolog_kvarts'),role:_t('tcore.geolog'),rarity:'common',income:{crystals:[2,3,5,7,9]},unlock:{story:'antenna'},hire:{crystals:3,metal:4},how:_t('tcore.vosstanovi_antennu'),bio:_t('tcore.chuet_kristally')},
 {id:'engineer',name:_t('tcore.inzhener_boltik'),role:_t('tcore.inzhener'),rarity:'common',income:{metal:[3,5,7,10,13]},unlock:{story:'engineerMet'},how:_t('tcore.naydi_inzhenera'),bio:_t('tcore.chinit_vse')},
 {id:'navigator',name:_t('tcore.shturman_zvezdochk'),role:_t('tcore.shturman'),rarity:'common',income:{crystals:[2,3,5,6,8],metal:[1,2,2,3,4]},unlock:{story:'navigatorMet'},how:_t('tcore.pogovori_so'),bio:_t('tcore.prokladyvaet_put')},
 {id:'scout',name:_t('tcore.razvedchik_ugolek'),role:_t('tcore.razvedchik'),rarity:'common',income:{crystals:[1,2,2,3,4],metal:[2,3,5,6,8]},unlock:{story:'scoutMet'},how:_t('tcore.naydi_razvedchika'),bio:_t('tcore.pervym_nahodit')},
 {id:'botanist',name:_t('tcore.botanik_myata'),role:_t('tcore.botanik'),rarity:'common',income:{crystals:[2,3,4,6,8],metal:[2,3,4,6,8]},unlock:{story:'habitat'},hire:{crystals:6,metal:6},how:_t('tcore.postroy_zhiloy'),bio:_t('tcore.vyraschivaet_pervy')},
 {id:'pilot',name:_t('tcore.pilot_kometa'),role:_t('tcore.pilot'),rarity:'rare',income:{crystals:[3,5,7,10,13],metal:[3,5,7,10,13]},unlock:{friends:3},how:_t('tcore.priglasi_3'),bio:_t('tcore.posadit_raketu')},
 {id:'doctor',name:_t('tcore.doktor_lapkin'),role:_t('tcore.doktor'),rarity:'rare',income:{crystals:[4,6,9,12,16],metal:[3,5,7,10,13]},unlock:{friends:5},how:_t('tcore.priglasi_5'),bio:_t('tcore.lechit_ushiby')},
 {id:'captain',name:_t('tcore.kapitan_luna'),role:_t('tcore.kapitan'),rarity:'legend',income:{crystals:[6,9,13,18,24],metal:[6,9,13,18,24]},unlock:{friends:10},how:_t('tcore.priglasi_10'),bio:_t('tcore.legenda_pervoy')}];
const MAX_LEVEL=5,UPGRADE=[[4,5],[8,10],[14,18],[22,28]],RARITY_COST={common:1,rare:1.5,legend:2};
const STORAGE=[{hours:3},{hours:5,cost:[8,10]},{hours:8,cost:[16,20]}];
const WELCOME_AWAY_MS=15*60000;
const RANKS=[{id:'cadet',name:_t('rank.cadet'),min:0},{id:'pilot',name:_t('rank.pilot'),min:700},{id:'navigator',name:_t('rank.navigator'),min:1800},{id:'commander',name:_t('rank.commander'),min:3500},{id:'admiral',name:_t('rank.admiral'),min:6500}];
const byId=id=>CREW.find(c=>c.id===id);
function team(s){if(!s.team||typeof s.team!=='object')s.team=Core.initial().team;return s.team;}
function level(s,id){return team(s).levels[id]||0;}
function storyDone(s,key){return key==='habitat'?(s.buildings||[]).includes('habitat'):s[key]===true;}
function unlocked(s,c){return c.unlock.story?storyDone(s,c.unlock.story):team(s).friends>=c.unlock.friends;}
// Cats that join for free as soon as their condition is met (story meetings and friend milestones). Returns new ids.
function syncCrew(s){const t=team(s),fresh=[];for(const c of CREW)if(!t.levels[c.id]&&!c.hire&&unlocked(s,c)){t.levels[c.id]=1;fresh.push(c.id);}return fresh;}
function incomeOf(c,l){const out={crystals:0,metal:0};if(!l)return out;for(const r of['crystals','metal'])if(c.income[r])out[r]=c.income[r][Math.min(MAX_LEVEL,l)-1];return out;}
function rates(s){const out={crystals:0,metal:0};for(const c of CREW){const i=incomeOf(c,level(s,c.id));out.crystals+=i.crystals;out.metal+=i.metal;}return out;}
function capHours(s){return STORAGE[Math.min(STORAGE.length-1,team(s).cap||0)].hours;}
function storeCap(s){const r=rates(s),h=capHours(s);return{crystals:r.crystals*h,metal:r.metal*h};}
// Income accrues into the station store while the game is closed, up to `capHours` worth. Clock set back → no income.
function accrue(s,now=Date.now()){const t=team(s),out={away:0,counted:0,gained:{crystals:0,metal:0}};if(!t.at||!Number.isFinite(t.at)){t.at=now;return out;}
 const dt=now-t.at;if(dt<=0){t.at=Math.min(t.at,now);return out;}out.away=dt;const r=rates(s),cap=storeCap(s);
 for(const res of['crystals','metal']){if(!r[res])continue;const before=t.store[res]||0,room=Math.max(0,cap[res]-before),add=Math.min(room,r[res]*dt/HOUR);t.store[res]=Math.round((before+add)*1e4)/1e4;out.gained[res]=add;out.counted=Math.max(out.counted,r[res]?add/r[res]*HOUR:0);}
 t.at=now;return out;}
function stored(s){const t=team(s);return{crystals:Math.floor(t.store.crystals||0),metal:Math.floor(t.store.metal||0)};}
// Move whole units into the backpack (capacity respected); what does not fit stays in the store.
function claim(s,now=Date.now()){accrue(s,now);const t=team(s),cap=Core.capacity(s),got={crystals:0,metal:0},left={crystals:0,metal:0};
 for(const r of['crystals','metal']){const whole=Math.floor(t.store[r]||0),fit=Math.max(0,Math.min(whole,cap-s[r]));s[r]+=fit;t.store[r]=Math.round(((t.store[r]||0)-fit)*1e4)/1e4;got[r]=fit;left[r]=whole-fit;}
 t.welcomeAt=now;return{ok:got.crystals+got.metal>0,got,left,text:got.crystals+got.metal?`${_t('tcore.sklad_stantsii',{crystals:got.crystals,metal:got.metal})}`+(left.crystals+left.metal?' · '+_t('tcore.vlezlo_ryukzak',{n:left.crystals+left.metal}):''):(left.crystals+left.metal?_t('tcore.ryukzak_polon'):_t('tcore.sklad_poka'))};}
function welcomeInfo(s,away){const st=stored(s);return{show:away>=WELCOME_AWAY_MS&&st.crystals+st.metal>=2,hours:Math.min(away,capHours(s)*HOUR)/HOUR,full:away>=capHours(s)*HOUR,stored:st};}
function costOf(c,l){const k=RARITY_COST[c.rarity]||1,b=UPGRADE[l-1];return b?{crystals:Math.round(b[0]*k),metal:Math.round(b[1]*k)}:null;}
function canPay(s,c){return s.crystals>=(c.crystals||0)&&s.metal>=(c.metal||0);}
function pay(s,c){s.crystals-=c.crystals||0;s.metal-=c.metal||0;}
function hire(s,id,now=Date.now()){const c=byId(id);if(!c||!c.hire)return{ok:false,text:_t('tcore.etogo_chlena')};if(level(s,id))return{ok:false,text:_t('tcore.uzhe_komande')};if(!unlocked(s,c))return{ok:false,text:c.how};
 if(!canPay(s,c.hire))return{ok:false,text:`${_t('tcore.nuzhno',{crystals:c.hire.crystals,metal:c.hire.metal})}`};accrue(s,now);pay(s,c.hire);team(s).levels[id]=1;return{ok:true,text:_t('tcore.komande_dohod',{name:c.name})};}
function upgrade(s,id,now=Date.now()){const c=byId(id),l=level(s,id);if(!c||!l)return{ok:false,text:_t('tcore.snachala_dobav')};if(l>=MAX_LEVEL)return{ok:false,text:_t('core.maksimalnyy_uroven')};const cost=costOf(c,l);
 if(!canPay(s,cost))return{ok:false,text:`${_t('tcore.nuzhno',{crystals:cost.crystals,metal:cost.metal})}`};accrue(s,now);pay(s,cost);team(s).levels[id]=l+1;return{ok:true,text:`${_t('core.uroven',{name:c.name,v:l+1})}`};}
function upgradeStorage(s,now=Date.now()){const t=team(s),next=STORAGE[(t.cap||0)+1];if(!next)return{ok:false,text:_t('tcore.sklad_uzhe')};const cost={crystals:next.cost[0],metal:next.cost[1]};
 if(!canPay(s,cost))return{ok:false,text:`${_t('tcore.nuzhno',{crystals:cost.crystals,metal:cost.metal})}`};accrue(s,now);pay(s,cost);t.cap=(t.cap||0)+1;return{ok:true,text:`${_t('tcore.sklad_stantsii2',{hours:next.hours})}`};}
function setFriends(s,n){const t=team(s),v=Math.max(0,Math.min(100000,Math.floor(Number(n)||0)));if(v>t.friends)t.friends=v;return syncCrew(s);}

// ---------- «Код сигнала»: only salted SHA-256 prefixes are shipped; each code works once ----------
function sha256(msg){const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
 const bytes=[...unescape(encodeURIComponent(msg))].map(c=>c.charCodeAt(0)),l=bytes.length*8;bytes.push(0x80);while(bytes.length%64!==56)bytes.push(0);for(let i=7;i>=0;i--)bytes.push(i>3?0:(l>>>(i*8))&255);
 let H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];const r=(x,n)=>(x>>>n)|(x<<(32-n));
 for(let o=0;o<bytes.length;o+=64){const w=new Array(64);for(let i=0;i<16;i++)w[i]=(bytes[o+i*4]<<24)|(bytes[o+i*4+1]<<16)|(bytes[o+i*4+2]<<8)|bytes[o+i*4+3];
  for(let i=16;i<64;i++){const s0=r(w[i-15],7)^r(w[i-15],18)^(w[i-15]>>>3),s1=r(w[i-2],17)^r(w[i-2],19)^(w[i-2]>>>10);w[i]=(w[i-16]+s0+w[i-7]+s1)|0;}
  let[a,b,c,d,e,f,g,h]=H;for(let i=0;i<64;i++){const t1=(h+(r(e,6)^r(e,11)^r(e,25))+((e&f)^(~e&g))+K[i]+w[i])|0,t2=((r(a,2)^r(a,13)^r(a,22))+((a&b)^(a&c)^(b&c)))|0;h=g;g=f;f=e;e=(d+t1)|0;d=c;c=b;b=a;a=(t1+t2)|0;}
  H=H.map((v,i)=>(v+[a,b,c,d,e,f,g,h][i])|0);}
 return H.map(v=>(v>>>0).toString(16).padStart(8,'0')).join('');}
const CODE_SALT='moonkatty-signal-v1:';
// Players type codes from videos: case, spaces, dashes and Cyrillic look-alike letters do not matter.
function normalizeCode(raw){const map={'А':'A','В':'B','Е':'E','К':'K','М':'M','Н':'H','О':'O','Р':'P','С':'C','Т':'T','Х':'X','У':'Y'};return String(raw||'').toUpperCase().replace(/[\s\-_.]/g,'').replace(/[АВЕКМНОРСТХУ]/g,ch=>map[ch]).slice(0,24);}
function codeHash(raw){return sha256(CODE_SALT+normalizeCode(raw)).slice(0,24);}
const MAX_FAILS=5,LOCK_MS=60000;
function redeem(s,raw,list,now=Date.now(),today=Core.today?Core.today(now):''){const t=team(s),code=normalizeCode(raw);
 if(t.lockUntil>now)return{ok:false,locked:true,wait:Math.ceil((t.lockUntil-now)/1000),text:`${_t('tcore.slishkom_mnogo',{now:Math.ceil((t.lockUntil-now)/1000)})}`};
 if(code.length<4)return{ok:false,text:_t('tcore.kod_4')};
 const h=codeHash(code),entry=(Array.isArray(list)?list:[]).find(e=>e&&e.h===h);
 if(!entry){t.fails=(t.fails||0)+1;if(t.fails>=MAX_FAILS){t.fails=0;t.lockUntil=now+LOCK_MS;}return{ok:false,text:_t('tcore.signal_raspoznan')};}
 t.fails=0;if(t.codes.includes(h))return{ok:false,already:true,text:_t('tcore.etot_kod')};
 if(entry.until&&today&&today>entry.until)return{ok:false,expired:true,text:_t('tcore.srok_deystviya')};
 t.codes.push(h);return{ok:true,entry,reward:{crystals:Math.max(0,entry.reward?.crystals|0),metal:Math.max(0,entry.reward?.metal|0)},text:_t('tcore.signal_prinyat')};}

// ---------- ranks: points from overall progress (deterministic, recomputed from the save) ----------
const STORY_FLAGS=['recorder','antenna','signal','supply','engineerMet','engineerFixed','navigatorMet','navigatorSolved','scoutMet','artifact','complete','signalBriefed','vaultOpen','blueprint','chapter3Complete'];
function points(s,over={}){const parts={story:0,cards:0,base:0,expeditions:0,watch:0,crew:0,friends:0,extras:0};if(!s||typeof s!=='object')return{total:0,parts};
 const arr=k=>Array.isArray(s[k])?s[k].length:0;for(const f of STORY_FLAGS)if(s[f]===true)parts.story+=100;parts.story+=(Math.min(12,arr('cells'))+Math.min(12,arr('tools'))+Math.min(12,arr('beacons'))+Math.min(12,arr('signalClues')))*40;
 const ch=Number(s.chapter)||1;if(ch>=2)parts.story+=400;if(ch>=3)parts.story+=400;
 for(const v of Object.values(s.cards||{}))if(Number.isFinite(v))parts.cards+=Math.max(0,Math.min(3,v))*60;
 parts.base=Math.min(5,arr('buildings'))*80;const ex=s.expeditions&&s.expeditions.done;if(ex&&typeof ex==='object')parts.expeditions=Math.min(4,Object.keys(ex).length)*150;
 parts.watch=Math.min(over.maxDays!=null?over.maxDays:3650,3650,Math.max(0,Math.floor(Number(s.streak&&s.streak.total)||0)))*15;
 const lv=s.team&&s.team.levels||{};for(const c of CREW)parts.crew+=Math.max(0,Math.min(MAX_LEVEL,Number(lv[c.id])||0))*50;
 const friends=over.friends!=null?over.friends:Number(s.team&&s.team.friends)||0;parts.friends=Math.min(1000,Math.max(0,friends))*120;
 parts.extras=Math.min(200,(s.team&&Array.isArray(s.team.codes)?s.team.codes.length:0))*40+Math.min(20,(s.growth&&Array.isArray(s.growth.badges)?s.growth.badges.length:0))*60;
 let total=0;for(const k in parts)total+=parts[k];return{total,parts};}
function rankOf(total){let i=0;for(let k=0;k<RANKS.length;k++)if(total>=RANKS[k].min)i=k;const next=RANKS[i+1]||null;
 return{index:i,rank:RANKS[i],next,progress:next?(total-RANKS[i].min)/(next.min-RANKS[i].min):1,toNext:next?next.min-total:0};}
// Rank-up check: first evaluation is silent (old saves and new players do not get a celebration for their starting rank).
function rankUp(s){const t=team(s),r=rankOf(points(s).total);if(t.rankSeen<0){t.rankSeen=r.index;return null;}if(r.index>t.rankSeen){t.rankSeen=r.index;return r;}return null;}
return{HOUR,CREW,MAX_LEVEL,UPGRADE,STORAGE,RANKS,WELCOME_AWAY_MS,MAX_FAILS,LOCK_MS,CODE_SALT,byId,level,unlocked,syncCrew,incomeOf,rates,capHours,storeCap,accrue,stored,claim,welcomeInfo,costOf,hire,upgrade,upgradeStorage,setFriends,sha256,normalizeCode,codeHash,redeem,points,rankOf,rankUp};});
