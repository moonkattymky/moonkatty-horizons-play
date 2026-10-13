if(typeof _t==='undefined'&&typeof require==='function')require('./i18n.js');
/* Shared quest/progress logic. No browser dependency. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MoonCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const WORLD={minX:-82,maxX:82,minZ:-84,maxZ:76};
const REGIONS=[{id:'crater',name:_t('core.tihiy_krater'),x:-55,z:-50},{id:'valley',name:_t('core.kristalnaya_dolina'),x:58,z:-30},{id:'research',name:_t('core.yuzhnaya_observato'),x:35,z:55}];
const KEY='moonkatty-new-horizons-v02';
const POINTS={recorder:[-5,-2],cell1:[-15,0],cell2:[-14,-9],cell3:[13,-15],antenna:[0,-24],pod:[-5,-2],engineer:[4,0],tool1:[-17,-15],tool2:[12,-10],navigator:[7,-25],beacon1:[-20,-23],beacon2:[17,-25],beacon3:[2,-37],scout:[-13,-30],artifact:[-24,-39],base:[-5,-7],final:[-5,-7],supply:[3,7],workshop:[-12,-7],solar:[-5,-14],dock:[-1,-12]};
/* v43 LIFE #4 · THE ROCKET: launch pad east of the camp, an old wreck in the south-west crater, a crystal cave in the
   east and an abandoned hangar in the west. The wreck keeps its crater bowl (RELIEF_KEEP); other points get flat ground. */
const PAD={x:28,z:4},ROCKET_SITES={pad:[28,4],wreck:[-25,55],cave:[69,4],hangar:[-58,26]};
Object.assign(POINTS,{pad:[22.6,5.2],wreck:[-20.5,50.5],wreckPanel:[-30.2,51.2],shard1:[64,-0.5],shard2:[67.5,9.5],shard3:[72.5,0.5],caveHeart:[73.4,6.2],hangar:[-48.6,26],nose:[-56.5,23.6],fins:[-60.5,28.4],rocket:[28,4],wreckHull:[-25,55],caveHall:[69,4],hangarHall:[-58,26]});
const REGIONS4=[{id:'pad',name:_t('ch4.place_pad'),x:28,z:4},{id:'wreck',name:_t('ch4.place_wreck'),x:-25,z:55},{id:'cave',name:_t('ch4.place_cave'),x:69,z:4},{id:'hangar',name:_t('ch4.place_hangar'),x:-58,z:26}];
const RELIEF_KEEP=['wreck','wreckPanel','wreckHull'];
// v55 explorable districts (same ids/coords/need as server/src/logic.js DISTRICTS). need = completed Lives.
// v59 the player's home plot (worker cat-bots build it; server PLOT_STEPS = HOME_STEPS, professions = server BOT_PROFS)
const HOME={x:10,z:27,r:9},HOME_STEPS=['road','lamps','house','workshop','garden','house2','solar','tower'],BOT_PROFS=['miner','mechanic','builder','courier'];
const DISTRICTS=[{id:'gold',x:-62,z:60,r:15,lock:12.5,need:0},{id:'crystal',x:64,z:34,r:15,lock:12.5,need:1},{id:'anomaly',x:45,z:-66,r:15,lock:12.5,need:2}];
function districtLives(s){if(!s)return 0;const ch=s.chapter||1;return(ch>=2||s.complete===true?1:0)+(ch>=3?1:0)+(ch>=3&&s.chapter3Complete===true?1:0)+(ch>=4&&s.chapter4Complete===true?1:0)+(ch>=5&&s.chapter5Complete===true?1:0)+(ch>=6&&s.chapter6Complete===true?1:0)+(ch>=7&&s.chapter7Complete===true?1:0)+(ch>=8&&s.chapter8Complete===true?1:0)+(ch>=9&&s.chapter9Complete===true?1:0);}
function districtRegions(s){const n=districtLives(s);return[...DISTRICTS.map(d=>({id:'district_'+d.id,name:_t('dist.'+d.id)+(n>=d.need?'':' · '+_t('dist.locked_short',{n:d.need})),x:d.x,z:d.z})),{id:'home',name:_t('bots.map'),x:HOME.x,z:HOME.z}];}
Object.assign(POINTS,{signalStart:[4,0],clueCrater:[-55,-55],clueValley:[58,-35],clueResearch:[35,50],vault:[40,52],blueprint:[40,52],blueprintReturn:[4,0]});
const SIGNAL_NOTES={clueValley:_t('core.kristalnaya_dolina2'),clueCrater:_t('core.tihiy_krater2'),clueResearch:_t('core.yuzhnaya_observato2')};
const resources=Array.from({length:22},(_,i)=>({id:'res'+i,type:i%2?'metal':'crystals',x:Math.sin(i*2.399)* (7+i*.8),z:Math.cos(i*2.399)*(7+i*.8)-10}));resources[0].x=1.8;resources[0].z=15.8;resources[2].x=-2.1;resources[2].z=12.5;
for(const area of REGIONS)for(let i=0;i<12;i++)resources.push({id:'res'+resources.length,type:i%2?'metal':'crystals',x:area.x+Math.sin(i*2.399)*(4+i*.65),z:area.z+Math.cos(i*2.399)*(4+i*.65)});
// Shared authored obstacles: rendering and movement use the same dimensions.
const FIELD={x:2,z:-37,inner:3.8,outer:6.6,height:2.2};
const BARRIERS=[{x:-15,z:4.4,w:9.2,d:.44,h:.72},{x:-15,z:-4.4,w:9.2,d:.44,h:.72},{x:-19.4,z:0,w:.44,d:8.8,h:.72},{x:-10.6,z:0,w:.44,d:8.8,h:.72},{x:-16.1,z:-4.4,w:5.6,d:1.1,h:1.7},{x:-11.5,z:-7.4,w:5.6,d:1.1,h:1.7},{x:-16.1,z:-12.6,w:5.6,d:1.1,h:1.7}];
function obstacleAt(ch,x,z,alt=0){if(ch===1)return BARRIERS.find(o=>alt<o.h+.12&&Math.abs(x-o.x)<o.w/2+.22&&Math.abs(z-o.z)<o.d/2+.22)||null;const d=Math.hypot(x-FIELD.x,z-FIELD.z);return d>FIELD.inner&&d<FIELD.outer&&alt<FIELD.height?FIELD:null;}
const BEACON_NOTES={beacon1:_t('core.biryuzovyy_mayak'),beacon2:_t('core.zolotoy_mayak'),beacon3:_t('core.belyy_mayak')};
function signalStrength(channel,value){return Math.max(0,Math.round(100-Math.abs(Number(value)-[32,68,45][channel])*7));}
/* Save schema v4 (growth stage 1): daily login streak, social/referral flags, cloud-sync timestamp.
   v2/v3 saves have none of these fields and migrate to safe defaults; existing progress is untouched. */
/* v7 (localization): lang = chosen UI language ('' = not chosen yet → auto-detect + show the picker once). */
const LANG_IDS=['en','ru','uk','es','pt','de','fr','it','tr','he','ar','ko','zh'];
/* v9 (v43): LIFE #4 · THE ROCKET — rocket assembly flags, crystal shards, hangar parts and the two puzzle states. */
const SAVE_VERSION=9,CREW_IDS=['geologist','engineer','navigator','scout','botanist','pilot','doctor','captain'],CINEMA_IDS=['intro','ch1','ch2','ch3','crystal','ch4','ch4end','ch5','ch5end','ch6','ch6end','ch7','ch7end','ch8','ch8end','ch9','ch9end'],BADGES=['watch7','channel','crew1','crew5','season','beacon'];
const DAY_RE=/^\d{4}-\d{2}-\d{2}$/;
function freshStreak(){return{day:'',count:0,run:0,best:0,total:0,shield:''};}
function freshTeam(){return{levels:{},at:0,store:{crystals:0,metal:0},cap:0,friends:0,codes:[],rankSeen:-1,welcomeAt:0};}
// v8: Moon Points are a server currency; `moon` is only a cached copy (at=0: never seen from the server). `lbHidden` mirrors «hide me».
function freshGrowth(){return{refBy:'',channel:false,badges:[],seen:'',applied:[],shareDay:'',resetAt:0,moon:{points:0,at:0},lbHidden:false,cos:{owned:[],frame:''}};}
function clampInt(v,lo,hi,d=0){return Number.isFinite(v)?Math.max(lo,Math.min(hi,Math.floor(v))):d;}
function migrateGrowth(raw,s){const st=raw.streak;if(st&&typeof st==='object'&&DAY_RE.test(st.day)){s.streak={day:st.day,count:clampInt(st.count,1,7,1),run:clampInt(st.run,1,100000,1),best:0,total:clampInt(st.total,1,100000,1)};s.streak.best=Math.max(s.streak.run,clampInt(st.best,0,100000));s.streak.shield=DAY_RE.test(st.shield)?st.shield:'';}
 const g=raw.growth;if(g&&typeof g==='object'){const out=s.growth;out.refBy=typeof g.refBy==='string'&&/^\d{1,15}$/.test(g.refBy)?g.refBy:'';out.channel=g.channel===true;
  // v8: the old «open a link, wait 30 s» social timers are dropped (links no longer pay; social tasks are reviewed on the server).
  const m=g.moon;if(m&&typeof m==='object'){out.moon={points:clampInt(m.points,0,1e9),at:clampInt(m.at,0,9e15)};}out.lbHidden=g.lbHidden===true;
  // v39: owned cosmetics cache (frames, patron badge, cargo bay). The server list replaces it when online.
  const cos=g.cos;if(cos&&typeof cos==='object'){const owned=Array.isArray(cos.owned)?[...new Set(cos.owned.filter(id=>typeof id==='string'&&/^[a-z_]{2,24}$/.test(id)))].slice(0,30):[];out.cos={owned,frame:typeof cos.frame==='string'&&owned.includes(cos.frame)&&/^frame_/.test(cos.frame)?cos.frame:''};}
  out.badges=Array.isArray(g.badges)?[...new Set(g.badges.filter(b=>BADGES.includes(b)))]:[];out.seen=DAY_RE.test(g.seen)?g.seen:'';out.shareDay=DAY_RE.test(g.shareDay)?g.shareDay:'';
  out.applied=Array.isArray(g.applied)?[...new Set(g.applied.filter(id=>typeof id==='string'&&/^[\w:.-]{1,80}$/.test(id)))].slice(-300):[];out.resetAt=clampInt(g.resetAt,0,9e15);}
 s.updatedAt=clampInt(raw.updatedAt,0,9e15);migrateCinema(raw,s);migrateTeam(raw,s);}
// v6: base crew (levels + station store), redeemed signal codes (hashes), friends count, last celebrated rank.
function migrateTeam(raw,s){const t=raw.team;if(!t||typeof t!=='object')return;const out=s.team;
 for(const id of CREW_IDS){const l=t.levels&&t.levels[id];if(Number.isInteger(l)&&l>0)out.levels[id]=Math.min(5,l);}
 out.at=clampInt(t.at,0,9e15);for(const r of['crystals','metal']){const v=Number(t.store&&t.store[r]);out.store[r]=Number.isFinite(v)?Math.max(0,Math.min(100000,v)):0;}
 out.cap=clampInt(t.cap,0,2);out.friends=raw.version>=8?clampInt(t.friends,0,100000):0;/* v8: friends = qualified friends (finished LIFE #1), refreshed from the server; v7 counted everyone who joined */out.codes=Array.isArray(t.codes)?[...new Set(t.codes.filter(h=>typeof h==='string'&&/^[0-9a-f]{24}$/.test(h)))].slice(-500):[];
 out.rankSeen=clampInt(t.rankSeen,-1,10,-1);out.welcomeAt=clampInt(t.welcomeAt,0,9e15);}// v5: which cutscenes were already shown. Older saves: skip openers of chapters the player has already started; the intro still plays once.
function migrateCinema(raw,s){const c=raw.cinema;if(c&&typeof c==='object'&&Array.isArray(c.seen)){s.cinema.seen=[...new Set(c.seen.filter(id=>CINEMA_IDS.includes(id)))];return;}
 const seen=[];for(let ch=1;ch<s.chapter;ch++)seen.push('ch'+ch);if(s.chapter===1&&s.recorder||s.chapter===2&&s.engineerMet||s.chapter===3&&s.signalBriefed||s.chapter===4&&s.rocketBriefed)seen.push('ch'+s.chapter);
 if(s.collected.some(id=>resources.find(r=>r.id===id)?.type==='crystals'))seen.push('crystal');s.cinema.seen=seen;}
const COST={habitat:[4,6],workshop:[2,3],solar:[2,3],beacon:[3,4],dock:[3,5]};
function initial(){return{version:SAVE_VERSION,chapter:1,x:0,z:12,crystals:0,metal:0,collected:[],cells:[],tools:[],beacons:[],buildings:[],recorder:false,antenna:false,signal:false,engineerMet:false,engineerFixed:false,navigatorMet:false,navigatorSolved:false,scoutMet:false,artifact:false,complete:false,supply:false,signalBriefed:false,signalClues:[],vaultOpen:false,blueprint:false,chapter3Complete:false,rocketBriefed:false,wreckFound:false,engineFound:false,engineInstalled:false,coreShards:[],coreFound:false,coreInstalled:false,hangarOpen:false,rocketParts:[],topInstalled:false,chapter4Complete:false,ignBriefed:false,groveFound:false,sunSparks:[],forgeLit:false,igniterIn:false,chapter5Complete:false,forgeLenses:FORGE_START.slice(),deepBriefed:false,scoutDeep:false,deepEchoes:[],songPlayed:false,heartTaken:false,chapter6Complete:false,lostBriefed:false,navLost:false,lostLogs:[],auroraLit:false,driveTaken:false,chapter7Complete:false,auroraGrid:AURORA_START.slice(),gateBriefed:false,scoutGate:false,gateGlyphs:[],ringsAligned:false,keyTaken:false,chapter8Complete:false,gateRings:RINGS_START.slice(),finalBriefed:false,navObs:false,obsLenses:[],courseSet:false,chapter9Complete:false,powerGrid:POWER_START.slice(),alignRings:ALIGN_START.slice(),cards:{},harvestAt:{},energy:0,productionAt:Date.now(),daily:{day:'',done:[],claimed:false},streak:freshStreak(),growth:freshGrowth(),cinema:{seen:[]},team:freshTeam(),lang:'',updatedAt:0};}
function sanitize(raw){const s=initial();if(!raw||![2,3,4,5,6,7,8,9].includes(raw.version))return s;for(const k of['recorder','antenna','signal','engineerMet','engineerFixed','navigatorMet','navigatorSolved','scoutMet','artifact','complete','supply','signalBriefed','vaultOpen','blueprint','chapter3Complete',...CH4_FLAGS,...CH5_FLAGS,...CH6_FLAGS,...CH7_FLAGS,...CH8_FLAGS,...CH9_FLAGS])s[k]=raw[k]===true;s.chapter=raw.chapter===9&&raw.complete===true&&raw.chapter3Complete===true&&raw.chapter4Complete===true&&raw.chapter5Complete===true&&raw.chapter6Complete===true&&raw.chapter7Complete===true?(raw.chapter8Complete===true?9:8):raw.chapter===8&&raw.complete===true&&raw.chapter3Complete===true&&raw.chapter4Complete===true&&raw.chapter5Complete===true&&raw.chapter6Complete===true?(raw.chapter7Complete===true?8:7):raw.chapter===7&&raw.complete===true&&raw.chapter3Complete===true&&raw.chapter4Complete===true&&raw.chapter5Complete===true?(raw.chapter6Complete===true?7:6):raw.chapter===6&&raw.complete===true&&raw.chapter3Complete===true&&raw.chapter4Complete===true?(raw.chapter5Complete===true?6:5):raw.chapter===5&&raw.complete===true&&raw.chapter3Complete===true?(raw.chapter4Complete===true?5:4):raw.chapter===4&&raw.complete===true?(raw.chapter3Complete===true?4:3):raw.chapter===3&&raw.complete===true?3:raw.chapter===2?2:1;if(s.chapter<4)for(const k of CH4_FLAGS)s[k]=false;if(s.chapter<5)for(const k of CH5_FLAGS)s[k]=false;if(s.chapter<6)for(const k of CH6_FLAGS)s[k]=false;if(s.chapter<7)for(const k of CH7_FLAGS)s[k]=false;if(s.chapter<8)for(const k of CH8_FLAGS)s[k]=false;if(s.chapter<9)for(const k of CH9_FLAGS)s[k]=false;for(const k of['crystals','metal'])s[k]=Number.isFinite(raw[k])?Math.max(0,Math.min(10000,Math.floor(raw[k]))):0;s.x=Number.isFinite(raw.x)?Math.max(WORLD.minX,Math.min(WORLD.maxX,raw.x)):s.x;s.z=Number.isFinite(raw.z)?Math.max(WORLD.minZ,Math.min(WORLD.maxZ,raw.z)):s.z;const valid={sunSparks:['spark1','spark2','spark3'],deepEchoes:['echo1','echo2','echo3'],lostLogs:['log1','log2','log3'],gateGlyphs:['glyph1','glyph2','glyph3'],obsLenses:['lens1','lens2','lens3'],coreShards:['shard1','shard2','shard3'],rocketParts:['nose','fins'],signalClues:Object.keys(SIGNAL_NOTES),collected:resources.map(r=>r.id),cells:['cell1','cell2','cell3'],tools:['tool1','tool2'],beacons:['beacon1','beacon2','beacon3'],buildings:Object.keys(COST)};for(const k in valid)s[k]=Array.isArray(raw[k])?[...new Set(raw[k].filter(v=>valid[k].includes(v)))]:[];s.cards={};for(const id of Object.keys(CARDS)){const level=raw.cards?.[id];if(Number.isInteger(level))s.cards[id]=Math.max(0,Math.min(3,level));}syncCards(s);
s.harvestAt={};for(const id of s.collected)s.harvestAt[id]=Number.isFinite(raw.harvestAt?.[id])?raw.harvestAt[id]:Date.now();
s.energy=Number.isFinite(raw.energy)?Math.max(0,Math.min(energyCapacity(s),raw.energy)):0;
s.productionAt=Number.isFinite(raw.productionAt)&&raw.productionAt>0?raw.productionAt:Date.now();
if(raw.daily&&/^\d{4}-\d{2}-\d{2}$/.test(raw.daily.day)){s.daily={day:raw.daily.day,done:Array.isArray(raw.daily.done)?[...new Set(raw.daily.done.filter(id=>['scanner','backpack','jetpack'].includes(id)))]:[],claimed:raw.daily.claimed===true};}if(s.chapter<4){s.coreShards=[];s.rocketParts=[];}if(s.chapter<5)s.sunSparks=[];if(s.chapter<6)s.deepEchoes=[];if(s.chapter<7)s.lostLogs=[];if(s.chapter<8)s.gateGlyphs=[];if(s.chapter<9)s.obsLenses=[];s.gateRings=Array.isArray(raw.gateRings)&&raw.gateRings.length===3&&raw.gateRings.every(n=>Number.isInteger(n)&&n>=0&&n<6)?raw.gateRings.slice():RINGS_START.slice();s.auroraGrid=Array.isArray(raw.auroraGrid)&&raw.auroraGrid.length===9&&raw.auroraGrid.every(n=>n===0||n===1)?raw.auroraGrid.slice():AURORA_START.slice();s.forgeLenses=Array.isArray(raw.forgeLenses)&&raw.forgeLenses.length===3&&raw.forgeLenses.every(n=>Number.isInteger(n)&&n>=0&&n<=4)?raw.forgeLenses.slice():FORGE_START.slice();s.powerGrid=Array.isArray(raw.powerGrid)&&raw.powerGrid.length===9&&raw.powerGrid.every(n=>Number.isInteger(n)&&n>=0&&n<=3)?raw.powerGrid.slice():POWER_START.slice();s.alignRings=Array.isArray(raw.alignRings)&&raw.alignRings.length===3&&raw.alignRings.every(n=>Number.isInteger(n)&&n>=0&&n<=7)?raw.alignRings.slice():ALIGN_START.slice();migrateGrowth(raw,s);s.lang=typeof raw.lang==='string'&&LANG_IDS.includes(raw.lang)?raw.lang:'';return s;}
function quest(s){if(s.chapter===9)return quest9(s);if(s.chapter===8)return quest8(s);if(s.chapter===7)return quest7(s);if(s.chapter===6)return quest6(s);if(s.chapter===5)return quest5(s);if(s.chapter===4)return quest4(s);if(s.chapter===3){if(s.chapter3Complete)return{id:'complete3',title:_t('ch4.q_ready'),detail:_t('ch4.q_ready_d'),targets:['blueprintReturn'],fraction:1};if(!s.signalBriefed)return{id:'signalStart',title:_t('core.novyy_signal'),detail:_t('core.pogovori_inzhenero'),targets:['signalStart'],fraction:0};if(s.signalClues.length<3)return{id:'signalClues',title:`${_t('core.soberi_zapisi',{signalClues:s.signalClues.length})}`,detail:_t('core.ischi_terminaly'),targets:Object.keys(SIGNAL_NOTES).filter(id=>!s.signalClues.includes(id)),fraction:.15+s.signalClues.length*.15};if(!s.vaultOpen)return{id:'vault',title:_t('core.rasshifruy_arhiv'),detail:_t('core.vernis_arhivnomu'),targets:['vault'],fraction:.65};if(!s.blueprint)return{id:'blueprint',title:_t('core.skachay_chertezh'),detail:_t('core.arhiv_razblokirova'),targets:['blueprint'],fraction:.8};return{id:'blueprintReturn',title:_t('core.pereday_chertezh'),detail:_t('core.vernis_lager'),targets:['blueprintReturn'],fraction:.9};}if(s.chapter===1){if(!s.recorder)return{id:'recorder',title:_t('core.naydi_bortovoy'),detail:_t('core.obsleduy_avariynuy'),targets:['recorder'],fraction:0};if(s.cells.length<3)return{id:'cells',title:`${_t('core.naydi_energobloki',{cells:s.cells.length})}`,detail:_t('core.odin_blok'),targets:['cell1','cell2','cell3'].filter(id=>!s.cells.includes(id)),fraction:.2};if(!s.antenna)return{id:'antenna',title:_t('core.vosstanovi_antennu'),detail:_t('core.dostav_energobloki'),targets:['antenna'],fraction:.5};if(!s.signal)return{id:'signal',title:_t('core.nastroy_signal'),detail:_t('core.naydi_pik'),targets:['antenna'],fraction:.7};return{id:'pod',title:_t('core.vernis_kapsule'),detail:_t('core.signal_nayden'),targets:['pod'],fraction:.9};}
if(s.complete)return{id:'complete',title:_t('core.dve_zhizni'),detail:_t('core.inzhener_obnaruzhi'),targets:['engineer'],fraction:1};
if(!s.engineerMet)return{id:'engineer',title:_t('core.naydi_inzhenera'),detail:_t('core.inzhener_zhdet'),targets:['engineer'],fraction:0};if(s.tools.length<2)return{id:'tools',title:`${_t('core.zaberi_remontnye',{tools:s.tools.length})}`,detail:_t('core.odin_nabor'),targets:['tool1','tool2'].filter(id=>!s.tools.includes(id)),fraction:.1};if(!s.engineerFixed)return{id:'repair',title:_t('core.vernis_inzheneru'),detail:_t('core.pereday_nabory'),targets:['engineer'],fraction:.25};if(!s.navigatorMet)return{id:'navigator',title:_t('core.pogovori_so'),detail:_t('core.nuzhna_karta'),targets:['navigator'],fraction:.35};if(s.beacons.length<3)return{id:'beacons',title:`${_t('core.aktiviruy_mayaki',{beacons:s.beacons.length})}`,detail:_t('core.tretiy_mayak'),targets:['beacon1','beacon2','beacon3'].filter(id=>!s.beacons.includes(id)),fraction:.45};if(!s.navigatorSolved)return{id:'route',title:_t('core.sostav_marshrut'),detail:_t('core.vernis_shturmanu'),targets:['navigator'],fraction:.6};if(!s.scoutMet)return{id:'scout',title:_t('core.naydi_razvedchika'),detail:_t('core.razvedchik_obnaruz'),targets:['scout'],fraction:.7};if(!s.artifact)return{id:'artifact',title:_t('core.zaberi_arhiv'),detail:_t('core.doydi_terminala'),targets:['artifact'],fraction:.8};if(!s.buildings.includes('habitat'))return{id:'base',title:_t('core.postroy_obschiy'),detail:_t('core.soberi_4'),targets:['base'],fraction:.9};return{id:'final',title:_t('core.soberi_ekipazh'),detail:_t('core.vernis_zhilomu'),targets:['final'],fraction:.95};}

// ---------- v43 LIFE #4 · THE ROCKET ----------
const CH4_FLAGS=['rocketBriefed','wreckFound','engineFound','engineInstalled','coreFound','coreInstalled','hangarOpen','topInstalled','chapter4Complete'];
// Power lines on the wreck's hull panel: a 3×3 grid of cable tiles (N=0 E=1 S=2 W=3). Power enters tile 0 from the west and must
// leave tile 8 to the east, where the cargo winch is. Tap a tile to turn it 90°.
const POWER_TYPES=['straight','elbow','elbow','straight','straight','elbow','elbow','elbow','straight'],POWER_START=[1,0,1,0,0,3,2,1,1];
function powerPorts(i,rot){const base=POWER_TYPES[i]==='straight'?[3,1]:[0,1];return base.map(p=>(p+rot)%4);}
function powerTrace(rots){const powered=[];let i=0,from=3;for(let step=0;step<9;step++){const ports=powerPorts(i,rots[i]);if(!ports.includes(from))break;powered.push(i);const out=ports.find(p=>p!==from),r=Math.floor(i/3),c=i%3;
  if(i===8&&out===1)return{powered,connected:true};const nr=r+(out===2)-(out===0),nc=c+(out===1)-(out===3);if(nr<0||nr>2||nc<0||nc>2)break;const next=nr*3+nc;if(powered.includes(next))break;i=next;from=(out+2)%4;}
 return{powered,connected:false};}
// Alignment of the upper stage on the pad: three rings (nose cone, tank collar, fins) with 8 positions. Turning a ring also turns
// the next one (the collar drags the fins), so the player aligns from the top down. All marks at 0 = aligned.
const ALIGN_START=[5,2,4];
function alignTurn(rings,i){const r=rings.slice();r[i]=(r[i]+1)%8;if(i<2)r[i+1]=(r[i+1]+1)%8;return r;}
// Which rocket parts stand on the pad: 0 scaffolding only, 1 engine, 2 + crystal-core tank, 3 complete rocket.
function rocketStage(s){return s.chapter<4?0:s.topInstalled?3:s.coreInstalled?2:s.engineInstalled?1:0;}
function quest4(s){const left=(list,have)=>list.filter(id=>!have.includes(id));
 if(s.chapter4Complete)return{id:'complete4',title:_t('ch5.q_ready'),detail:_t('ch5.q_ready_d'),targets:['pad'],fraction:1};
 if(!s.rocketBriefed)return{id:'padBrief',title:_t('ch4.q_brief'),detail:_t('ch4.q_brief_d'),targets:['pad'],fraction:0};
 if(!s.wreckFound)return{id:'wreck',title:_t('ch4.q_wreck'),detail:_t('ch4.q_wreck_d'),targets:['wreck'],fraction:.07};
 if(!s.engineFound)return{id:'wreckPower',title:_t('ch4.q_power'),detail:_t('ch4.q_power_d'),targets:['wreckPanel'],fraction:.15};
 if(!s.engineInstalled)return{id:'engineDeliver',title:_t('ch4.q_engine'),detail:_t('ch4.q_engine_d'),targets:['pad'],fraction:.24};
 if(s.coreShards.length<3)return{id:'shards',title:_t('ch4.q_shards',{n:s.coreShards.length}),detail:_t('ch4.q_shards_d'),targets:left(['shard1','shard2','shard3'],s.coreShards),fraction:.32+s.coreShards.length*.05};
 if(!s.coreFound)return{id:'caveHeart',title:_t('ch4.q_heart'),detail:_t('ch4.q_heart_d'),targets:['caveHeart'],fraction:.48};
 if(!s.coreInstalled)return{id:'coreDeliver',title:_t('ch4.q_core'),detail:_t('ch4.q_core_d'),targets:['pad'],fraction:.56};
 if(!s.hangarOpen)return{id:'hangar',title:_t('ch4.q_hangar'),detail:_t('ch4.q_hangar_d'),targets:['hangar'],fraction:.64};
 if(s.rocketParts.length<2)return{id:'parts',title:_t('ch4.q_parts',{n:s.rocketParts.length}),detail:_t('ch4.q_parts_d'),targets:left(['nose','fins'],s.rocketParts),fraction:.70+s.rocketParts.length*.06};
 if(!s.topInstalled)return{id:'align',title:_t('ch4.q_align'),detail:_t('ch4.q_align_d'),targets:['pad'],fraction:.84};
 return{id:'ignition',title:_t('ch4.q_ignition'),detail:_t('ch4.q_ignition_d'),targets:['pad'],fraction:.94};}
function interact4(s,q,id){
 if(q.id==='padBrief'){s.rocketBriefed=true;return{ok:true,story:'rocketPlan'};}
 if(q.id==='wreck'){s.wreckFound=true;return{ok:true,story:'wreck'};}
 if(q.id==='wreckPower')return{ok:true,puzzle:'power'};
 if(q.id==='engineDeliver'){s.engineInstalled=true;return{ok:true,story:'engineIn',rocket:1};}
 if(q.id==='shards'){s.coreShards.push(id);return{ok:true,text:_t('ch4.shard_found',{n:s.coreShards.length})};}
 if(q.id==='caveHeart'){s.coreFound=true;return{ok:true,story:'cave'};}
 if(q.id==='coreDeliver'){s.coreInstalled=true;return{ok:true,story:'coreIn',rocket:2};}
 if(q.id==='hangar'){s.hangarOpen=true;return{ok:true,story:'hangar'};}
 if(q.id==='parts'){s.rocketParts.push(id);return{ok:true,text:id==='nose'?_t('ch4.nose_found'):_t('ch4.fins_found')};}
 if(q.id==='align')return{ok:true,puzzle:'align'};
 if(q.id==='ignition'){s.chapter4Complete=true;return{ok:true,chapterEnd:4};}
 return{ok:false,text:_t('core.nechego_aktivirova')};}
function solve4(s,type,value){const q=quest(s);
 if(type==='power'&&q.id==='wreckPower'){if(Array.isArray(value)&&value.length===9&&value.every(n=>Number.isInteger(n)&&n>=0&&n<=3)){s.powerGrid=value.slice();if(powerTrace(value).connected){s.engineFound=true;return{ok:true,text:_t('ch4.power_ok')};}}return{ok:false,text:_t('ch4.power_bad')};}
 if(type==='align'&&q.id==='align'){if(Array.isArray(value)&&value.length===3&&value.every(n=>Number.isInteger(n)&&n>=0&&n<=7)){s.alignRings=value.slice();if(value.every(n=>n===0)){s.topInstalled=true;return{ok:true,text:_t('ch4.align_ok'),rocket:3,story:'rocketReady'};}}return{ok:false,text:_t('ch4.align_bad')};}
 return{ok:false,text:_t('core.terminal_poka')};}
// ---------- v57 LIFE #5 · IGNITION ----------
// The rocket stands ready but the crystal core is cold. In the far south lies the Sun Forge, an old golden altar of the first
// expedition: three Sun Sparks (amber crystals) wake its lenses, the forged Igniter goes into the rocket, and the engines roar.
const CH5_FLAGS=['ignBriefed','groveFound','forgeLit','igniterIn','chapter5Complete'];
const FORGE={x:-12,z:-66},FORGE_START=[1,3,0];
Object.assign(POINTS,{forge:[-12,-61.6],quartz5:[-16.2,-59.4],spark1:[-19.6,-67.4],spark2:[-12,-74],spark3:[-4.4,-67.4],forgeHall:[-12,-66]});
const REGIONS5=[{id:'forge',name:_t('ch5.place_forge'),x:FORGE.x,z:FORGE.z},{id:'pad',name:_t('ch4.place_pad'),x:28,z:4}];
// Sun lenses: three dials 0..4 ("light"), tapping a lens also turns its neighbours (A = [[1,1,0],[1,1,1],[0,1,1]], invertible mod 5,
// so every start is solvable). All lenses at 4 = full sun.
function forgeTurn(v,i){const r=v.slice();for(const j of[i-1,i,i+1])if(j>=0&&j<3)r[j]=(r[j]+1)%5;return r;}
function quest5(s){const left=['spark1','spark2','spark3'].filter(id=>!s.sunSparks.includes(id));
 if(s.chapter5Complete)return{id:'complete5',title:_t('ch6.q_ready'),detail:_t('ch6.q_ready_d'),targets:['pad'],fraction:1};
 if(!s.ignBriefed)return{id:'ignBrief',title:_t('ch5.q_brief'),detail:_t('ch5.q_brief_d'),targets:['pad'],fraction:0};
 if(!s.groveFound)return{id:'grove',title:_t('ch5.q_grove'),detail:_t('ch5.q_grove_d'),targets:['quartz5'],fraction:.12};
 if(s.sunSparks.length<3)return{id:'sparks',title:_t('ch5.q_sparks',{n:s.sunSparks.length}),detail:_t('ch5.q_sparks_d'),targets:left,fraction:.25+s.sunSparks.length*.1};
 if(!s.forgeLit)return{id:'forge',title:_t('ch5.q_forge'),detail:_t('ch5.q_forge_d'),targets:['forge'],fraction:.58};
 if(!s.igniterIn)return{id:'igniterDeliver',title:_t('ch5.q_igniter'),detail:_t('ch5.q_igniter_d'),targets:['pad'],fraction:.74};
 return{id:'launch',title:_t('ch5.q_launch'),detail:_t('ch5.q_launch_d'),targets:['pad'],fraction:.9};}
function interact5(s,q,id){
 if(q.id==='ignBrief'){s.ignBriefed=true;return{ok:true,story:'ignPlan'};}
 if(q.id==='grove'){s.groveFound=true;return{ok:true,story:'grove'};}
 if(q.id==='sparks'){s.sunSparks.push(id);return{ok:true,text:_t('ch5.spark_found',{n:s.sunSparks.length})};}
 if(q.id==='forge')return{ok:true,puzzle:'forge'};
 if(q.id==='igniterDeliver'){s.igniterIn=true;return{ok:true,story:'igniterIn'};}
 if(q.id==='launch'){s.chapter5Complete=true;return{ok:true,chapterEnd:5};}
 return{ok:false,text:_t('core.nechego_aktivirova')};}
function solve5(s,value){if(quest(s).id!=='forge')return{ok:false,text:_t('core.terminal_poka')};
 if(Array.isArray(value)&&value.length===3&&value.every(n=>Number.isInteger(n)&&n>=0&&n<=4)){s.forgeLenses=value.slice();if(value.every(n=>n===4)){s.forgeLit=true;return{ok:true,text:_t('ch5.forge_ok'),story:'forgeLit'};}}
 return{ok:false,text:_t('ch5.forge_bad')};}
// ---------- v58 LIFE #6 · THE DEPTHS ----------
// After the test flight the scanner heard an echo under the west plains. There the ground has opened into a sunken crystal
// grotto: three Echo Crystals each keep one note, the Bell Altar plays the song back, the Crystal Door opens and the
// Heart of the Depths (a glowing star map) goes back to the Engineer — it points to the Lost Expedition (LIFE #7).
const CH6_FLAGS=['deepBriefed','scoutDeep','songPlayed','heartTaken','chapter6Complete'];
const DEEP={x:-56,z:-12,floor:9,rim:14,depth:2.6};
// bells: 0 teal, 1 pink, 2 violet, 3 gold; echo1/2/3 keep the 1st/2nd/3rd note of the song
const DEEP_SONG=[1,3,0],DEEP_BELLS=['teal','pink','violet','gold'];
Object.assign(POINTS,{scout6:[-46.6,-9.6],echo1:[-59,-4.6],echo2:[-58.5,-19.4],echo3:[-50.6,-18.6],chime:[-50.4,-12],deepHeart:[-60.9,-12],deepHall:[-56,-12]});
const REGIONS6=[{id:'depths',name:_t('ch6.place_depths'),x:DEEP.x,z:DEEP.z},{id:'pad',name:_t('ch4.place_pad'),x:28,z:4}];
// sinkhole depth (0..1): flat floor, smooth walls, a gentle ramp to the east (towards the camp)
function deepBowl(x,z){const dx=x-DEEP.x,dz=z-DEEP.z,r=Math.hypot(dx,dz),sm=v=>v<=0?0:v>=1?1:v*v*(3-2*v);let k=1-sm((r-DEEP.floor)/(DEEP.rim-DEEP.floor));
 if(dx>0&&Math.abs(dz)<4.2){const w=1-sm((Math.abs(dz)-2.6)/1.6),ramp=1-sm((dx-DEEP.floor)/11);k=Math.max(k,Math.min(w,ramp));}return k;}
function quest6(s){const left=['echo1','echo2','echo3'].filter(id=>!s.deepEchoes.includes(id));
 if(s.chapter6Complete)return{id:'complete6',title:_t('ch7.q_ready'),detail:_t('ch7.q_ready_d'),targets:['pad'],fraction:1};
 if(!s.deepBriefed)return{id:'deepBrief',title:_t('ch6.q_brief'),detail:_t('ch6.q_brief_d'),targets:['pad'],fraction:0};
 if(!s.scoutDeep)return{id:'deepScout',title:_t('ch6.q_scout'),detail:_t('ch6.q_scout_d'),targets:['scout6'],fraction:.12};
 if(s.deepEchoes.length<3)return{id:'echoes',title:_t('ch6.q_echoes',{n:s.deepEchoes.length}),detail:_t('ch6.q_echoes_d'),targets:left,fraction:.25+s.deepEchoes.length*.1};
 if(!s.songPlayed)return{id:'song',title:_t('ch6.q_song'),detail:_t('ch6.q_song_d'),targets:['chime'],fraction:.58};
 if(!s.heartTaken)return{id:'heart',title:_t('ch6.q_heart'),detail:_t('ch6.q_heart_d'),targets:['deepHeart'],fraction:.74};
 return{id:'deepReturn',title:_t('ch6.q_return'),detail:_t('ch6.q_return_d'),targets:['pad'],fraction:.9};}
function interact6(s,q,id){
 if(q.id==='deepBrief'){s.deepBriefed=true;return{ok:true,story:'deepPlan'};}
 if(q.id==='deepScout'){s.scoutDeep=true;return{ok:true,story:'deepScout'};}
 if(q.id==='echoes'){s.deepEchoes.push(id);const k=['echo1','echo2','echo3'].indexOf(id);return{ok:true,text:_t('ch6.echo_found',{n:s.deepEchoes.length,note:_t('ch6.bell_'+DEEP_BELLS[DEEP_SONG[k]]),pos:k+1})};}
 if(q.id==='song')return{ok:true,puzzle:'song'};
 if(q.id==='heart'){s.heartTaken=true;return{ok:true,story:'deepHeart'};}
 if(q.id==='deepReturn'){s.chapter6Complete=true;return{ok:true,chapterEnd:6};}
 return{ok:false,text:_t('core.nechego_aktivirova')};}
function solve6(s,value){if(quest(s).id!=='song')return{ok:false,text:_t('core.terminal_poka')};
 if(Array.isArray(value)&&value.length===3&&value.every((n,i)=>Number.isInteger(n)&&n===DEEP_SONG[i])){s.songPlayed=true;return{ok:true,text:_t('ch6.song_ok'),story:'deepOpen'};}
 return{ok:false,text:_t('ch6.song_bad')};}
// ---------- v65 LIFE #7 · THE LOST EXPEDITION ----------
// The Heart of the Depths showed the beacon of the first expedition. It blinks far in the north: behind the Ice Ridge lies their
// frozen camp. The Navigator waits at the Ice Pass; three expedition logs tell the story; the nine aurora lanterns on the signal
// mast must all burn to wake the beacon (lights-out: a lantern also flips its four neighbours); the beacon thaws the hangar and
// the Sky Drive they left behind goes to the Engineer — who fits it to every hover-bike: BIKE FLIGHT. Next: LIFE #8 · The Gates.
const CH7_FLAGS=['lostBriefed','navLost','auroraLit','driveTaken','chapter7Complete'];
const LOST={x:4,z:60,basin:12.5,ridge:17.2,width:3.6,height:7.2,passW:3.1};
// lanterns 0..8 (row by row); 1 = burning. Start = all lit, then four lanterns tapped (0,4,6,7) — so it is always solvable.
function auroraTap(v,i){const r=v.slice(),x=i%3,y=(i/3)|0;for(const[dx,dy]of[[0,0],[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx>=0&&nx<3&&ny>=0&&ny<3)r[ny*3+nx]^=1;}return r;}
const AURORA_START=[0,4,6,7].reduce((v,i)=>auroraTap(v,i),[1,1,1,1,1,1,1,1,1]);
Object.assign(POINTS,{nav7:[4.6,40.6],log1:[-3.4,57.2],log2:[11.2,61.4],log3:[5.6,67.4],mast:[4,54.4],skyDrive:[-4.0,66.0],lostHall:[4,60]});
const REGIONS7=[{id:'lost',name:_t('ch7.place_camp'),x:LOST.x,z:LOST.z},{id:'pad',name:_t('ch4.place_pad'),x:28,z:4}];
// the Ice Ridge: a ring of snowy peaks around the camp (0 inside the basin), with the Ice Pass cut through it to the south
function lostRidge(x,z){const dx=x-LOST.x,dz=z-LOST.z,r=Math.hypot(dx,dz);if(r<LOST.basin-1||r>LOST.ridge+LOST.width*2.6)return 0;
 const a=Math.atan2(dz,dx),sm=v=>v<=0?0:v>=1?1:v*v*(3-2*v),q=(r-LOST.ridge)/LOST.width,band=Math.exp(-q*q*1.15),amp=1+.12*Math.sin(a*5+.6)+.08*Math.sin(a*11+1.3)+.05*Math.sin(a*23);
 const pass=dz<0?1-sm((Math.abs(dx)-LOST.passW)/2.4):0;return LOST.height*band*amp*(1-.985*pass);}
function quest7(s){const left=['log1','log2','log3'].filter(id=>!s.lostLogs.includes(id));
 if(s.chapter7Complete)return{id:'complete7',title:_t('ch8.q_ready'),detail:_t('ch8.q_ready_d'),targets:['pad'],fraction:1};
 if(!s.lostBriefed)return{id:'lostBrief',title:_t('ch7.q_brief'),detail:_t('ch7.q_brief_d'),targets:['pad'],fraction:0};
 if(!s.navLost)return{id:'lostNav',title:_t('ch7.q_nav'),detail:_t('ch7.q_nav_d'),targets:['nav7'],fraction:.12};
 if(s.lostLogs.length<3)return{id:'logs',title:_t('ch7.q_logs',{n:s.lostLogs.length}),detail:_t('ch7.q_logs_d'),targets:left,fraction:.25+s.lostLogs.length*.1};
 if(!s.auroraLit)return{id:'aurora',title:_t('ch7.q_aurora'),detail:_t('ch7.q_aurora_d'),targets:['mast'],fraction:.58};
 if(!s.driveTaken)return{id:'drive',title:_t('ch7.q_drive'),detail:_t('ch7.q_drive_d'),targets:['skyDrive'],fraction:.74};
 return{id:'lostReturn',title:_t('ch7.q_return'),detail:_t('ch7.q_return_d'),targets:['pad'],fraction:.9};}
function interact7(s,q,id){
 if(q.id==='lostBrief'){s.lostBriefed=true;return{ok:true,story:'lostPlan'};}
 if(q.id==='lostNav'){s.navLost=true;return{ok:true,story:'lostNav'};}
 if(q.id==='logs'){s.lostLogs.push(id);const k=['log1','log2','log3'].indexOf(id);return{ok:true,text:_t('ch7.log_found',{n:s.lostLogs.length}),log:k+1,story:'lostLog'+(k+1)};}
 if(q.id==='aurora')return{ok:true,puzzle:'aurora'};
 if(q.id==='drive'){s.driveTaken=true;return{ok:true,story:'skyDrive'};}
 if(q.id==='lostReturn'){s.chapter7Complete=true;return{ok:true,chapterEnd:7};}
 return{ok:false,text:_t('core.nechego_aktivirova')};}
function solve7(s,value){if(quest(s).id!=='aurora')return{ok:false,text:_t('core.terminal_poka')};
 if(Array.isArray(value)&&value.length===9&&value.every(n=>n===0||n===1)){s.auroraGrid=value.slice();if(value.every(n=>n===1)){s.auroraLit=true;return{ok:true,text:_t('ch7.aurora_ok'),story:'lostBeacon'};}}
 return{ok:false,text:_t('ch7.aurora_bad')};}
// ---------- v68 LIFE #9 · A NEW HORIZON (the finale) ----------
// The Star Key fits the rocket's navigation core — but a course through the Gate needs the old Observatory east of the camp. The
// Navigator waits on its hill; three telescope lenses lie scattered around it; set them back, then draw the Cat constellation on the
// star chart in one stroke (an Euler path: never the same line twice). The course is set: the whole crew boards, the rocket lifts off
// through the Gate toward a blue horizon. After the finale the daily tasks, the weekly season and the crew bots keep the camp alive.
const CH9_FLAGS=['finalBriefed','navObs','courseSet','chapter9Complete'];
const OBS={x:42,z:-16,hill:8,height:1.1};
// the Cat constellation: 8 stars (x,y in 0..1 of the chart), 9 lines; stars 1 and 3 have an odd number of lines → start at one of them
const STARS9=[[.24,.12],[.33,.42],[.76,.12],[.67,.42],[.5,.86],[.27,.66],[.73,.66],[.5,.36]];
const LINES9=[[5,1],[1,0],[0,7],[7,2],[2,3],[3,6],[6,4],[4,5],[1,3]];
const edgeKey=(a,b)=>a<b?a+'-'+b:b+'-'+a;
function starsValid(seq){if(!Array.isArray(seq)||seq.length!==LINES9.length+1||!seq.every(n=>Number.isInteger(n)&&n>=0&&n<STARS9.length))return false;
 const need=new Set(LINES9.map(([a,b])=>edgeKey(a,b))),used=new Set();for(let i=1;i<seq.length;i++){const k=edgeKey(seq[i-1],seq[i]);if(!need.has(k)||used.has(k))return false;used.add(k);}return used.size===need.size;}
Object.assign(POINTS,{nav9:[36.2,-2.9],lens1:[35.2,-11.4],lens2:[49.4,-11.6],lens3:[45.8,-23.8],scope:[42,-12.4],obsHall:[42,-16]});
const REGIONS9=[{id:'obs',name:_t('ch9.place_obs'),x:OBS.x,z:OBS.z},{id:'pad',name:_t('ch4.place_pad'),x:28,z:4}];
// a low, gentle hill under the Observatory (walkable; the dome sits on top)
function obsHill(x,z){const r=Math.hypot(x-OBS.x,z-OBS.z);if(r>=OBS.hill)return 0;const t=r/OBS.hill;return OBS.height*(1-t*t)*(1-t*t);}
function quest9(s){const left=['lens1','lens2','lens3'].filter(id=>!s.obsLenses.includes(id));
 if(s.chapter9Complete)return{id:'complete9',title:_t('ch9.q_done'),detail:_t('ch9.q_done_d'),targets:[],fraction:1};
 if(!s.finalBriefed)return{id:'finalBrief',title:_t('ch9.q_brief'),detail:_t('ch9.q_brief_d'),targets:['pad'],fraction:0};
 if(!s.navObs)return{id:'obsNav',title:_t('ch9.q_nav'),detail:_t('ch9.q_nav_d'),targets:['nav9'],fraction:.14};
 if(s.obsLenses.length<3)return{id:'lenses',title:_t('ch9.q_lenses',{n:s.obsLenses.length}),detail:_t('ch9.q_lenses_d'),targets:left,fraction:.28+s.obsLenses.length*.1};
 if(!s.courseSet)return{id:'stars',title:_t('ch9.q_stars'),detail:_t('ch9.q_stars_d'),targets:['scope'],fraction:.62};
 return{id:'launch',title:_t('ch9.q_launch'),detail:_t('ch9.q_launch_d'),targets:['pad'],fraction:.86};}
function interact9(s,q,id){
 if(q.id==='finalBrief'){s.finalBriefed=true;return{ok:true,story:'finalPlan'};}
 if(q.id==='obsNav'){s.navObs=true;return{ok:true,story:'obsNav'};}
 if(q.id==='lenses'){s.obsLenses.push(id);const k=['lens1','lens2','lens3'].indexOf(id);return{ok:true,text:_t('ch9.lens_found',{n:s.obsLenses.length}),story:'obsLens'+(k+1)};}
 if(q.id==='stars')return{ok:true,puzzle:'stars'};
 if(q.id==='launch'){s.chapter9Complete=true;return{ok:true,chapterEnd:9};}
 return{ok:false,text:_t('core.nechego_aktivirova')};}
function solve9(s,value){if(quest(s).id!=='stars')return{ok:false,text:_t('core.terminal_poka')};
 if(starsValid(value)){s.courseSet=true;return{ok:true,text:_t('ch9.stars_ok'),story:'courseSet'};}
 return{ok:false,text:_t('ch9.stars_bad')};}
// ---------- v67 LIFE #8 · THE GATE ----------
// The last log of the first expedition: "we fly on, beyond the mountains, to the Gate". West of the camp a lonely Sky Mesa rises with
// sheer cliffs — no path leads up: only the flying hover-bike reaches its top. The Scout waits at the foot; three star glyphs on the
// plateau each tell how one ring of the Gate turns; the ring dial (outer turns the middle along, the middle turns the inner along)
// must bring all three star marks to the top; the Gate awakens and shows a far blue sky — and leaves the Star Key. The Engineer
// knows: with it the Gate can open all the way. Next: LIFE #9 · A New Horizon (the finale).
const CH8_FLAGS=['gateBriefed','scoutGate','ringsAligned','keyTaken','chapter8Complete'];
const GATE={x:-26,z:16,mesa:9.2,cliff:2.0,height:7.2};
// three rings 0..5 (outer, middle, inner); a turn of a ring also turns the next inner one. Start = solved, then turns applied → solvable.
function ringTap(v,i){const r=v.slice();r[i]=(r[i]+1)%6;if(i<2)r[i+1]=(r[i+1]+1)%6;return r;}
const RINGS_START=[0,0,1,1,1,2].reduce((v,i)=>ringTap(v,i),[0,0,0]);
Object.assign(POINTS,{scout8:[-26.6,1.6],glyph1:[-32.4,13.6],glyph2:[-19.8,13.0],glyph3:[-27.8,21.6],gateDial:[-26,14.4],starKey:[-26,18.2],gateHall:[-26,16]});
const REGIONS8=[{id:'gate',name:_t('ch8.place_gate'),x:GATE.x,z:GATE.z},{id:'pad',name:_t('ch4.place_pad'),x:28,z:4}];
// the Sky Mesa: a flat-topped table mountain with sheer, slightly ragged cliffs (no ramp — reach it by flying)
function gateMesa(x,z){const dx=x-GATE.x,dz=z-GATE.z,r=Math.hypot(dx,dz),a=Math.atan2(dz,dx),edge=GATE.mesa+.55*Math.sin(a*5+.3)+.35*Math.sin(a*11+1.7);
 if(r>edge+GATE.cliff)return 0;const sm=v=>v<=0?0:v>=1?1:v*v*(3-2*v),f=1-sm((r-edge)/GATE.cliff);return GATE.height*f*(1+.03*Math.sin(dx*1.3)*Math.sin(dz*1.1));}
function quest8(s){const left=['glyph1','glyph2','glyph3'].filter(id=>!s.gateGlyphs.includes(id));
 if(s.chapter8Complete)return{id:'complete8',title:_t('ch9.q_ready'),detail:_t('ch9.q_ready_d'),targets:['pad'],fraction:1};
 if(!s.gateBriefed)return{id:'gateBrief',title:_t('ch8.q_brief'),detail:_t('ch8.q_brief_d'),targets:['pad'],fraction:0};
 if(!s.scoutGate)return{id:'gateScout',title:_t('ch8.q_scout'),detail:_t('ch8.q_scout_d'),targets:['scout8'],fraction:.12};
 if(s.gateGlyphs.length<3)return{id:'glyphs',title:_t('ch8.q_glyphs',{n:s.gateGlyphs.length}),detail:_t('ch8.q_glyphs_d'),targets:left,fraction:.25+s.gateGlyphs.length*.1};
 if(!s.ringsAligned)return{id:'rings',title:_t('ch8.q_rings'),detail:_t('ch8.q_rings_d'),targets:['gateDial'],fraction:.58};
 if(!s.keyTaken)return{id:'key',title:_t('ch8.q_key'),detail:_t('ch8.q_key_d'),targets:['starKey'],fraction:.74};
 return{id:'gateReturn',title:_t('ch8.q_return'),detail:_t('ch8.q_return_d'),targets:['pad'],fraction:.9};}
function interact8(s,q,id){
 if(q.id==='gateBrief'){s.gateBriefed=true;return{ok:true,story:'gatePlan'};}
 if(q.id==='gateScout'){s.scoutGate=true;return{ok:true,story:'gateScout'};}
 if(q.id==='glyphs'){s.gateGlyphs.push(id);const k=['glyph1','glyph2','glyph3'].indexOf(id);return{ok:true,text:_t('ch8.glyph_found',{n:s.gateGlyphs.length}),glyph:k+1,story:'gateGlyph'+(k+1)};}
 if(q.id==='rings')return{ok:true,puzzle:'rings'};
 if(q.id==='key'){s.keyTaken=true;return{ok:true,story:'starKey'};}
 if(q.id==='gateReturn'){s.chapter8Complete=true;return{ok:true,chapterEnd:8};}
 return{ok:false,text:_t('core.nechego_aktivirova')};}
function solve8(s,value){if(quest(s).id!=='rings')return{ok:false,text:_t('core.terminal_poka')};
 if(Array.isArray(value)&&value.length===3&&value.every(n=>Number.isInteger(n)&&n>=0&&n<6)){s.gateRings=value.slice();if(value.every(n=>n===0)){s.ringsAligned=true;return{ok:true,text:_t('ch8.rings_ok'),story:'gateOpen'};}}
 return{ok:false,text:_t('ch8.rings_bad')};}
function nearestTarget(s,p){let q=quest(s),list=q.targets.map(id=>({id,x:POINTS[id][0],z:POINTS[id][1]}));if(!s.supply)list.push({id:'supply',x:3,z:7});for(const r of resources)if(!s.collected.includes(r.id))list.push({...r});const distance=t=>Math.hypot(p.x-t.x,p.z-t.z);const nearbyQuest=list.filter(t=>q.targets.includes(t.id)&&distance(t)<=3.3).sort((a,b)=>distance(a)-distance(b));return nearbyQuest[0]||list.sort((a,b)=>distance(a)-distance(b))[0]||null;}
function interact(s,id,p){let r=resources.find(r=>r.id===id),point=r?[r.x,r.z]:POINTS[id];if(!point||Math.hypot(p.x-point[0],p.z-point[1])>3.3||p.alt>1.1)return{ok:false,text:_t('core.podoydi_blizhe')};if(id==='supply'){if(s.supply)return{ok:false,text:_t('core.konteyner_uzhe')};s.supply=true;syncCards(s);return{ok:true,text:_t('core.novaya_kartochka')};}if(r){if(s.collected.includes(id))return{ok:false,text:_t('core.resursy_uzhe')};let amount=r.type==='crystals'?2:3;if(s[r.type]+amount>capacity(s))return{ok:false,text:_t('core.ryukzak_zapolnen')};s.collected.push(id);s.harvestAt[id]=Date.now();s[r.type]+=amount;markDaily(s,'backpack');return{ok:true,found:r.type,text:r.type==='crystals'?_t('core.2_kristalla'):_t('core.3_metalla')};}
const q=quest(s);if(!q.targets.includes(id))return{ok:false,text:_t('core.snachala_vypolni')};if(q.id==='complete'||q.id==='complete3'||q.id==='complete4'||q.id==='complete5'||q.id==='complete6'||q.id==='complete7'||q.id==='complete8')return{ok:true,nextLife:true};if(s.chapter===9)return interact9(s,q,id);if(s.chapter===8)return interact8(s,q,id);if(s.chapter===7)return interact7(s,q,id);if(s.chapter===6)return interact6(s,q,id);if(s.chapter===5)return interact5(s,q,id);if(s.chapter===4)return interact4(s,q,id);if(q.id==='signalStart'){s.signalBriefed=true;return{ok:true,story:'signalStart'};}if(q.id==='signalClues'){s.signalClues.push(id);return{ok:true,text:SIGNAL_NOTES[id],journal:true};}if(q.id==='vault')return{ok:true,puzzle:'vault'};if(q.id==='blueprint'){s.blueprint=true;return{ok:true,story:'blueprint'};}if(q.id==='blueprintReturn'){s.chapter3Complete=true;return{ok:true,chapterEnd:3};}if(q.id==='recorder'){s.recorder=true;return{ok:true,story:'recorder'};}if(q.id==='cells'){s.cells.push(id);return{ok:true,text:`${_t('core.energoblok_nayden',{cells:s.cells.length})}`};}if(q.id==='antenna'){s.antenna=true;syncCards(s);return{ok:true,text:_t('core.antenna_vosstanovl')};}if(q.id==='signal')return{ok:true,puzzle:'signal'};if(q.id==='pod')return{ok:true,chapterEnd:1};if(q.id==='engineer'){s.engineerMet=true;return{ok:true,story:'engineer'};}if(q.id==='tools'){s.tools.push(id);return{ok:true,text:`${_t('core.remontnyy_nabor',{tools:s.tools.length})}`};}if(q.id==='repair'){s.engineerFixed=true;syncCards(s);return{ok:true,story:'repair'};}if(q.id==='navigator'){s.navigatorMet=true;return{ok:true,story:'navigator'};}if(q.id==='beacons'){s.beacons.push(id);return{ok:true,text:BEACON_NOTES[id]+` · ${s.beacons.length}/3`};}if(q.id==='route')return{ok:true,puzzle:'route'};if(q.id==='scout'){s.scoutMet=true;return{ok:true,story:'scout'};}if(q.id==='artifact'){s.artifact=true;return{ok:true,story:'artifact'};}if(q.id==='base')return{ok:true,builder:true};if(q.id==='final'){s.complete=true;return{ok:true,chapterEnd:2};}return{ok:false,text:_t('core.nechego_aktivirova')};}
function solve(s,type,value){if(type==='stars')return solve9(s,value);if(type==='rings')return solve8(s,value);if(type==='aurora')return solve7(s,value);if(type==='song')return solve6(s,value);if(type==='forge')return solve5(s,value);if(type==='power'||type==='align')return solve4(s,type,value);if(type==='vault'&&quest(s).id==='vault'){if(Array.isArray(value)&&value.length===3&&value.every((v,i)=>Number.isInteger(v)&&v===[7,3,2][i])){s.vaultOpen=true;return{ok:true,text:_t('core.arhiv_otkryt')};}return{ok:false,text:_t('core.kod_sovpal')};}if(type==='signal'&&quest(s).id==='signal'){if(value.length===3&&value.every((v,i)=>Math.abs(v-[32,68,45][i])<=3)){s.signal=true;return{ok:true,text:_t('core.svyaz_ustanovlena')};}return{ok:false,text:_t('core.signal_shumit')};}if(type==='route'&&quest(s).id==='route'){if(JSON.stringify(value)===JSON.stringify(['cyan','gold','white'])){s.navigatorSolved=true;syncCards(s);return{ok:true,text:_t('core.bezopasnyy_marshru')};}return{ok:false,text:_t('core.marshrut_soedinen')};}return{ok:false,text:_t('core.terminal_poka')};}
function build(s,type,p){if(s.chapter<2||!s.artifact)return{ok:false,text:_t('core.stroitelstvo_otkro')};if(Math.hypot(p.x+5,p.z+7)>7||p.alt>1)return{ok:false,text:_t('core.vernis_stroitelnuy')};if(!COST[type])return{ok:false,text:_t('core.neizvestnyy_modul')};if(s.buildings.includes(type))return{ok:false,text:_t('core.modul_uzhe')};if(type==='workshop'&&!s.engineerFixed)return{ok:false,text:_t('core.snachala_pomogi')};if(type==='solar'&&level(s,'workshop')<1)return{ok:false,text:_t('core.snachala_postroy')};if(type==='beacon'&&level(s,'workshop')<2)return{ok:false,text:_t('core.nuzhna_masterskaya')};if(type==='dock'&&level(s,'workshop')<3)return{ok:false,text:_t('core.nuzhna_masterskaya2')};let [c,m]=COST[type];if(s.crystals<c||s.metal<m)return{ok:false,text:`${_t('core.nuzhno_kristalla',{v:c,m:m})}`};s.crystals-=c;s.metal-=m;s.buildings.push(type);syncCards(s);if(type==='solar')s.productionAt=Date.now();return{ok:true,text:_t('core.modul_ustanovlen')};}
function nextChapter(s){if(s.chapter===1&&quest(s).id==='pod'){s.chapter=2;s.x=0;s.z=10;return true;}if(s.chapter===2&&s.complete){s.chapter=3;s.x=4;s.z=3;return true;}if(s.chapter===3&&s.chapter3Complete){s.chapter=4;s.x=6;s.z=4;return true;}if(s.chapter===8&&s.chapter8Complete){s.chapter=9;s.x=17;s.z=8;return true;}if(s.chapter===7&&s.chapter7Complete){s.chapter=8;s.x=17;s.z=8;return true;}if(s.chapter===6&&s.chapter6Complete){s.chapter=7;s.x=17;s.z=8;return true;}if(s.chapter===5&&s.chapter5Complete){s.chapter=6;s.x=17;s.z=8;return true;}if(s.chapter===4&&s.chapter4Complete){s.chapter=5;s.x=17;s.z=8;return true;}return false;}

const CARDS={
 scanner:{name:_t('core.skaner'),subtitle:_t('core.sledy_pyli'),category:_t('core.issledovanie'),chapter:1,unlock:_t('core.vosstanovi_antennu2'),point:'antenna',costs:[[2,3],[4,5]],ready:s=>s.antenna},
 backpack:{name:_t('core.ryukzak_issledovat'),subtitle:_t('core.vse_nuzhnoe'),category:_t('core.snaryazhenie'),chapter:1,unlock:_t('core.otkroy_konteyner'),point:'supply',costs:[[2,3],[4,5]],ready:s=>s.supply},
 jetpack:{name:_t('core.reaktivnyy_ranets'),subtitle:_t('core.vyshe_gorizonta'),category:_t('core.snaryazhenie'),chapter:2,unlock:_t('core.pomogi_inzheneru'),point:'engineer',costs:[[3,4],[5,6]],ready:s=>s.engineerFixed},
 workshop:{name:_t('core.masterskaya'),subtitle:_t('core.mesto_novyh'),category:_t('core.baza'),chapter:2,unlock:_t('core.poluchi_arhiv'),point:'workshop',costs:[[3,4],[5,6]],ready:s=>s.engineerFixed&&s.buildings.includes('workshop')},
 solar:{name:_t('core.solnechnaya_stants'),subtitle:_t('core.energiya_novogo'),category:_t('core.baza'),chapter:2,unlock:_t('core.postroy_masterskuy'),point:'solar',costs:[[3,4],[5,6]],ready:s=>s.buildings.includes('solar')},
 drone:{name:_t('core.dron_razvedchik'),subtitle:_t('core.tvoy_naparnik'),category:_t('core.komanda'),chapter:2,unlock:_t('core.vosstanovi_marshru'),point:'navigator',costs:[[3,4],[5,6]],ready:s=>s.navigatorSolved}
};
function level(s,id){return s.cards?.[id]||0;}
function syncCards(s){s.cards=s.cards||{};const unlocked=[];for(const[id,c]of Object.entries(CARDS)){if(c.ready(s)){if(!s.cards[id]){s.cards[id]=1;unlocked.push(id);}}else delete s.cards[id];}return unlocked;}
function capacity(s){return[40,60,90,140][level(s,'backpack')];}
function fuelDrain(s){return[3.7,3.7,2.8,2.1][level(s,'jetpack')];}
function combo(s){return level(s,'scanner')>0&&level(s,'drone')>0&&s.navigatorSolved;}
function scanRadius(s){return[14,22,32,44][level(s,'scanner')]*(combo(s)?1.2:1);}
function droneRadius(s){return[0,12,20,30][level(s,'drone')]*(s.buildings.includes('dock')?1.25:1);}
function energyCapacity(s){return[0,12,24,40][level(s,'solar')];}
function energyRate(s){return[0,6,12,20][level(s,'solar')];}
function cardEffect(s,id,l=level(s,id)){switch(id){case'scanner':return`${_t('core.radius_poiska',{v:[14,22,32,44][l]})}`;case'backpack':return`${_t('core.vmeschaet_resursov',{v:[40,60,90,140][l]})}`;case'jetpack':return`${_t('core.polet_sek',{v:Math.floor(100/[3.7,3.7,2.8,2.1][l])})}`;case'workshop':return[_t('core.postroy_modul'),_t('core.chertezh_stantsii'),_t('core.chertezh_mayaka'),_t('core.chertezh_doka')][l];case'solar':return`${_t('core.energii_ch',{v:[0,6,12,20][l],v2:[0,12,24,40][l]})}`;case'drone':return`${_t('core.razvedka_ryadom',{v:[0,12,20,30][l]})}`;}}
function upgrade(s,id,now=Date.now()){const c=Object.hasOwn(CARDS,id)?CARDS[id]:null,l=level(s,id);if(!c||!l||l>=3)return{ok:false,text:!l?_t('core.kartochka_esche'):_t('core.maksimalnyy_uroven')};const[crystals,metal]=c.costs[l-1];if(s.crystals<crystals||s.metal<metal)return{ok:false,text:`${_t('core.nuzhno_kristalla2',{crystals:crystals,metal:metal})}`};tick(s,now);s.crystals-=crystals;s.metal-=metal;s.cards[id]=l+1;return{ok:true,text:`${_t('core.uroven',{name:c.name,v:l+1})}`};}
function tick(s,now=Date.now()){let changed=false;for(const id of [...s.collected]){const at=s.harvestAt[id];if(!Number.isFinite(at)||at>now){s.harvestAt[id]=now;changed=true;}else if(now-at>=90000){s.collected=s.collected.filter(v=>v!==id);delete s.harvestAt[id];changed=true;}}
if(!s.productionAt||now<s.productionAt){s.productionAt=now;return changed;}const elapsed=Math.min(now-s.productionAt,86400000);if(elapsed>=1000){const energy=s.energy;s.energy=Math.min(energyCapacity(s),s.energy+elapsed/3600000*energyRate(s));s.productionAt=now;changed=changed||s.energy!==energy;}return changed;}
function craft(s,type,p){if(s.chapter<2||Math.hypot(p.x+5,p.z+7)>7||p.alt>1)return{ok:false,text:_t('core.dlya_izgotovleniya')};if(!['crystals','metal'].includes(type))return{ok:false,text:_t('core.neizvestnyy_retsep')};const recipe={crystals:{level:1,energy:3},metal:{level:2,energy:2}}[type];if(!recipe||level(s,'workshop')<recipe.level)return{ok:false,text:_t('core.snachala_uluchshi')};if(s.energy<recipe.energy)return{ok:false,text:`${_t('core.nuzhno_energii',{energy:recipe.energy})}`};if(s[type]>=capacity(s))return{ok:false,text:_t('core.ryukzak_zapolnen2')};s.energy-=recipe.energy;s[type]++;return{ok:true,text:type==='crystals'?_t('core.1_kristall'):_t('core.1_metall')};}
function today(now=Date.now()){const d=new Date(now);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function daily(s,now=Date.now()){const day=today(now);if(s.daily.day!==day)s.daily={day,done:[],claimed:false};return s.daily;}
function markDaily(s,id,now=Date.now()){if(!level(s,id))return;const d=daily(s,now);if(!d.done.includes(id))d.done.push(id);}
function claimDaily(s,now=Date.now()){const d=daily(s,now);if(d.claimed||!['scanner','backpack','jetpack'].every(id=>d.done.includes(id)))return{ok:false,text:_t('core.vypolni_tri')};if(s.crystals+4>capacity(s)||s.metal+6>capacity(s))return{ok:false,text:_t('core.osvobodi_mesto')};d.claimed=true;s.crystals+=4;s.metal+=6;return{ok:true,text:_t('core.ekspeditsiya_dnya')};}
function discoveries(s,p,radius){const list=resources.filter(r=>!s.collected.includes(r.id)).map(r=>({...r,label:r.type==='crystals'?_t('core.kristally'):_t('core.metall')}));if(!s.supply)list.push({id:'supply',x:3,z:7,label:_t('core.avariynyy_konteyne')});return list.filter(r=>Math.hypot(r.x-p.x,r.z-p.z)<=radius).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z));}

function noise(x,z){return Math.sin(x*.18+Math.sin(z*.13))*Math.cos(z*.19)*.33+Math.sin(x*.54+z*.31)*.09;}
/* v40 relief: gentle dunes, rimmed craters and the far crater wall beyond the playable edge. Faded to flat ground around every quest point, resource and route so gameplay heights stay as before. Sampled from a lazily built 1 m grid. */
const RELIEF_CRATERS=[[-38,22,9,1.1],[40,10,7,.85],[-40,-15,8,.9],[30,-60,10,1.2],[-25,55,12,1.4],[60,30,8,.9],[-70,10,7,.8],[12,45,6,.6],[-10,-60,9,1.0],[70,-70,9,.9],[-65,40,8,.9],[-45,-75,8,.8],[-75,-30,7,.8],[20,-75,8,.9],[30,25,7,.8],[45,-5,6,.6],[-60,65,9,1.0],[75,5,6,.7],[-22,30,4,.4],[22,-50,4,.4],[-48,8,5,.5],[50,45,4,.4]];
const RELIEF_EXTRA=[[-55,-55],[-62,-45],[-50,-51],[-58,-63],[58,-35],[51,-26],[59,-23],[65,-31],[32,54],[-12,-30],[-5,-40],[7,-45],[17,-36],[12,-25],[0,12],[0,4],[-1,0],[-2,-8],[-5,-13],[-5,-20],[1,4],[3,1],[7,-1],[7,-6],[44,48],[-55,-58]];
let reliefGrid=null;const RG=106,RS=2*RG+1;
function reliefRaw(x,z){let d=.40*Math.sin(x*.047+Math.sin(z*.031)*1.7)*Math.cos(z*.052-x*.013)+.20*Math.sin(x*.11-z*.07+Math.cos(x*.05))*Math.sin(z*.093+x*.03)+.07*Math.sin(x*.29+z*.21)*Math.cos(z*.33-x*.12);
 for(const[cx,cz,r,dep]of RELIEF_CRATERS){const dx=x-cx,dz=z-cz;if(Math.abs(dx)>r*2||Math.abs(dz)>r*2)continue;const q=Math.hypot(dx,dz)/r;d+=dep*(.42*Math.exp(-((q-1)**2)/.03)-Math.exp(-q*q*2.2)+.07*Math.exp(-((q-1.45)**2)/.12));}
 return d;}
function reliefEdge(x,z){const ex=Math.max(0,Math.abs(x)-84),ez=Math.max(0,z>0?z-78:-z-86),e=Math.hypot(ex,ez);if(e<=0)return 0;const k=Math.min(e,24);const m=.78+.32*Math.sin(x*.071+z*.053+Math.sin(z*.031)*2.)+.18*Math.sin(x*.16-z*.13),r1=1-Math.abs(Math.sin(x*.21+z*.17+Math.sin(z*.09+x*.04)*1.6)),r2=1-Math.abs(Math.sin(x*.43-z*.37+Math.sin(x*.13)*1.2)),f=Math.min(k,12)/12;return k*k*.028*Math.max(.35,m)+f*(r1*r1*4.2+r2*r2*1.8)+Math.min(k,8)*.05*Math.sin(x*.9+z*.7);}
function buildRelief(){const pts=[];const add=(x,z,s)=>pts.push([x,z,s*s]);for(const k in POINTS)if(!RELIEF_KEEP.includes(k))add(POINTS[k][0],POINTS[k][1],6.5);for(const p of RELIEF_EXTRA)add(p[0],p[1],5.5);for(const r of resources)add(r.x,r.z,3.6);for(const r of REGIONS)add(r.x,r.z,10);for(const d of DISTRICTS)add(d.x,d.z,13);add(FIELD.x,FIELD.z,14);add(-5,-4,12);add(4,-5,9);
 const g=new Float32Array(RS*RS);for(let j=0;j<RS;j++)for(let i=0;i<RS;i++){const x=i-RG,z=j-RG;let m=1;for(const p of pts){const dx=x-p[0],dz=z-p[1],d2=dx*dx+dz*dz;if(d2<p[2]*9)m*=1-Math.exp(-d2/p[2]);}const w=Math.min(1,Math.max(0,(Math.hypot(x+2,z+5)-14)/26));g[j*RS+i]=reliefRaw(x,z)*m*(.35+.65*w);}return g;}
function relief(x,z){if(!reliefGrid)reliefGrid=buildRelief();let fx=Math.min(RS-1.001,Math.max(0,x+RG)),fz=Math.min(RS-1.001,Math.max(0,z+RG));const i=fx|0,j=fz|0,u=fx-i,v=fz-j,g=reliefGrid,a=g[j*RS+i],b=g[j*RS+i+1],c=g[(j+1)*RS+i],d=g[(j+1)*RS+i+1];return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v+reliefEdge(x,z);}
function height(x,z,chapter=1){let path=Math.exp(-((x-Math.sin(z*.07)*5)**2)/30);let h=noise(x,z)+(.065*Math.sin(x*.41+z*.24)+.046*Math.sin(z*.53-x*.33)+.027*Math.sin(x*.63+z*.67))*(1-path*.65);for(const[cx,cz,r,d]of [[16,17,8,.8],[-20,14,7,.7],[24,-32,6,.55],[-55,-50,13,1.3],[58,-30,11,.7],[35,55,9,.6],[45,-66,10,1.1]]){let q=Math.hypot(x-cx,z-cz)/r;h+=d*(.35*Math.exp(-((q-1.05)**2)/.025)-Math.exp(-q*q*2.5));}if(chapter>=2){const radius=Math.hypot(x-FIELD.x,z-FIELD.z);h+=2.4*Math.exp(-radius*radius/75);h-=2.2*Math.exp(-((radius-5.2)**2)/.85);h-=.45*Math.exp(-((x+24)**2+(z+39)**2)/70);}if(chapter>=6)h-=DEEP.depth*deepBowl(x,z);if(chapter>=7)h+=lostRidge(x,z);if(chapter>=8)h+=gateMesa(x,z);if(chapter>=9)h+=obsHill(x,z);return h+relief(x,z);}
function surfaceHeight(x,z,chapter=1){const sx=-5,sz=-2;return Math.hypot(x-sx,z-sz)<3.55?Math.max(height(x,z,chapter),height(sx,sz,chapter)+.14):height(x,z,chapter);}
const LATE_POINTS=['scout6','echo1','echo2','echo3','chime','deepHeart','deepHall','nav7','log1','log2','log3','mast','skyDrive','lostHall','scout8','glyph1','glyph2','glyph3','gateDial','starKey','gateHall','nav9','lens1','lens2','lens3','scope','obsHall'];
return{CH9_FLAGS,OBS,STARS9,LINES9,starsValid,REGIONS9,obsHill,CH8_FLAGS,GATE,RINGS_START,ringTap,REGIONS8,gateMesa,CH7_FLAGS,LOST,AURORA_START,auroraTap,REGIONS7,lostRidge,LATE_POINTS,CH6_FLAGS,DEEP,DEEP_SONG,DEEP_BELLS,REGIONS6,deepBowl,CH5_FLAGS,FORGE,FORGE_START,REGIONS5,forgeTurn,RELIEF_KEEP,PAD,ROCKET_SITES,REGIONS4,DISTRICTS,districtLives,districtRegions,HOME,HOME_STEPS,BOT_PROFS,CH4_FLAGS,POWER_TYPES,POWER_START,powerPorts,powerTrace,ALIGN_START,alignTurn,rocketStage,LANG_IDS,SIGNAL_NOTES,WORLD,REGIONS,FIELD,BARRIERS,BEACON_NOTES,obstacleAt,signalStrength,surfaceHeight,CARDS,level,syncCards,capacity,fuelDrain,combo,scanRadius,droneRadius,energyCapacity,energyRate,cardEffect,upgrade,tick,craft,daily,markDaily,claimDaily,discoveries,KEY,POINTS,SAVE_VERSION,CINEMA_IDS,CREW_IDS,BADGES,today,resources,COST,initial,sanitize,quest,nearestTarget,interact,solve,build,nextChapter,height,relief};});
