/* v81 CAT HOUSE interior — lazy loaded when the player presses «Войти» at the house door (home-plot.js).
   A 2.5D room drawn with HTML/CSS: window with the Earth, trophy shelf (one trophy per completed Life), wall of chapter
   covers, garage with the owned bike paints (the Comet glows), crew bots resting, and the house look picker.
   House looks are Telegram Stars cosmetics (server: COSMETICS house_villa / house_observatory): looks only, no bonuses,
   no Moon Points. Buying goes through the shop's verified Stars flow (MoonSeasonUI.confirmBuy). */
(function(root){'use strict';
const d=root.document,_t=(k,p)=>root._t?root._t(k,p):k,esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const TROPHY=['📼','🎖️','💎','🚀','☀️','🔔','🏮','🗝️','🔭'];
const COVER=ch=>ch===9?'assets/world-cover-chapter9-v68.webp':ch===8?'assets/world-cover-chapter8-v67.jpg':ch===7?'assets/world-cover-chapter7-v65.webp':ch===6?'assets/world-cover-chapter6-v58.webp':ch===5?'assets/world-cover-chapter5-v57.webp':ch===4?'assets/world-cover-chapter4-v43.webp':`assets/world-cover-chapter${ch}-v44.webp`;
const LOOKS=[['',null],['house_villa',250],['house_observatory',350]];
const COL={miner:0,mechanic:1,builder:2,courier:3};
const PAINT_CSS={gold:'#ffbd48',mint:'#73ebbd',berry:'#f566a3',sky:'#70b8ff',cocoa:'#a87352',galaxy:'#805ceb',comet:'#17171c'};
function game(){return root.MoonGame;}
function lifeDone(s,n){if(!s)return false;const ch=Number(s.chapter)||1;if(n<ch)return true;if(n===1)return!!s.complete&&ch>1;return!!s['chapter'+n+'Complete'];}
function style(){const s=game()&&game().state,c=s&&s.growth&&s.growth.cos;return c&&(c.house==='house_villa'||c.house==='house_observatory')?c.house:'';}
function owned(id){const s=game()&&game().state,c=s&&s.growth&&s.growth.cos;return !id||!!(c&&Array.isArray(c.owned)&&c.owned.includes(id));}
function lookName(id){return id?_t('shop.'+id):_t('house.free');}
function render(el){const s=game()&&game().state,st=style(),bike=root.MoonBike&&root.MoonBike.view,bots=(root.MoonBots&&root.MoonBots.view&&root.MoonBots.view.bots)||[];
 const tro=TROPHY.map((ic,i)=>{const n=i+1,ok=lifeDone(s,n);return`<div class="chh-tro ${ok?'on':''}" title="${esc(ok?_t('house.t'+n):_t('house.locked'))}"><span class="ic">${ok?ic:'?'}</span><small>${esc(ok?_t('house.t'+n):_t('chapter.'+n))}</small></div>`;}).join('');
 const covers=[1,2,3,4,5,6,7,8,9].filter(n=>lifeDone(s,n)).map(n=>`<figure class="chh-cover"><img src="${COVER(n)}" alt="" loading="lazy"><figcaption>${esc(_t('chapter.'+n))}</figcaption></figure>`).join('')||`<p class="chh-empty">${esc(_t('house.locked'))}</p>`;
 const paints=bike&&bike.unlocked?(bike.colors||['gold']).map(c=>`<span class="chh-paint ${c==='comet'?'comet':''} ${bike.color===c?'cur':''}" style="--p:${PAINT_CSS[c]||'#ccc'}"><i></i><small>${esc(c==='comet'?_t('bike.comet'):_t('bike.c_'+c))}</small></span>`).join(''):`<p class="chh-empty">${esc(_t('house.no_bike'))}</p>`;
 const rest=bots.filter(b=>b.state!=='working').slice(0,6),crew=rest.length?rest.map(b=>`<div class="chh-bot"><i style="background-position:${(COL[b.prof]||0)*33.333}% 0%"></i><small>${esc(_t('bots.p_'+b.prof))} 💤</small></div>`).join(''):`<p class="chh-empty">${esc(_t('house.rest'))}</p>`;
 const looks=LOOKS.map(([id,stars])=>{const has=owned(id),cur=st===id;return`<button class="chh-look ${cur?'cur':''}" data-look="${id}" data-stars="${stars||''}"><span class="lk lk-${id||'free'}"></span><b>${esc(lookName(id))}</b><small>${cur?esc(_t('house.in_use')):has?esc(_t('house.use')):esc(_t('house.buy',{n:stars}))}</small></button>`;}).join('');
 el.className='chh chh-'+(st?st.replace('house_',''):'free');
 el.innerHTML=`<div class="chh-room"><header><b>🏠 ${esc(_t('house.title'))} · ${esc(lookName(st))}</b><button class="chh-exit" data-exit>✕ ${esc(_t('house.exit'))}</button></header>
 <div class="chh-wall"><div class="chh-window"><span class="earth"></span><span class="stars"></span></div>
  <section class="chh-shelf"><h4>🏆 ${esc(_t('house.trophies'))}</h4><div class="row">${tro}</div></section></div>
 <section class="chh-covers"><h4>📖 ${esc(_t('house.covers'))}</h4><div class="row">${covers}</div></section>
 <div class="chh-floor"><section class="chh-garage"><h4>🏍️ ${esc(_t('house.garage'))}</h4><div class="row">${paints}</div></section>
  <section class="chh-crew"><h4>🤖 ${esc(_t('house.crew'))}</h4><div class="row">${crew}</div></section></div>
 <section class="chh-looks"><h4>✨ ${esc(_t('house.looks'))}</h4><div class="row">${looks}</div><p class="chh-note">${esc(_t('house.no_bonus'))}</p></section></div>`;}
async function pick(id,stars){if(!owned(id)){root.MoonSeasonUI&&root.MoonSeasonUI.confirmBuy&&root.MoonSeasonUI.confirmBuy(id);return;}
 const UI=root.MoonGrowthUI;if(!UI||!UI.api)return;try{const r=await UI.api('/api/cosmetics/equip',{house:id});if(r&&r.shop&&root.MoonSeason&&game()){if(root.MoonSeason.setCos(game().state,r.shop))game().save&&game().save();}}catch(e){game()&&game().toast&&game().toast(String(e.message||e));}
 const el=d.getElementById('cat-house');if(el)render(el);}
function open(){let el=d.getElementById('cat-house');if(!el){el=d.createElement('div');el.id='cat-house';d.body.appendChild(el);
  el.addEventListener('click',e=>{const x=e.target.closest('[data-exit]');if(x){close();return;}const b=e.target.closest('[data-look]');if(b)pick(b.dataset.look,Number(b.dataset.stars)||0);});}
 render(el);el.hidden=false;d.body.classList.add('in-house');try{game()&&game().resetControls&&game().resetControls();}catch(e){}}
function close(){const el=d.getElementById('cat-house');if(el)el.hidden=true;d.body.classList.remove('in-house');}
root.MoonCatHouseRoom={open,close,render,lifeDone};
})(typeof window!=='undefined'?window:globalThis);
