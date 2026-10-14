/* v82 HIDDEN MINE interior — lazy loaded when the player presses «Войти в шахту» at a found mine (home-plot.js).
   A 2.5D tunnel drawn with HTML/CSS: arches going into the rock, lamp strings, glowing crystals in the mine's material
   colour, rails with carts rolling in and out, and the miner bots that are on a trip here swinging their picks.
   Everything shown comes from the last server view (window.MoonBots.view.hidden); sending a miner goes to /api/mines/send. */
(function(root){'use strict';
const d=root.document,_t=(k,p)=>root._t?root._t(k,p):k,esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ICON={ice:'❄️',fire:'🔥',star:'✨'},MAT={ice:'mat_ice',fire:'mat_fire',star:'mat_star'};
let cur=null,tick=null;
function V(){const M=root.MoonBots;return M&&M.view?M.view:null;}
function now(){const M=root.MoonBots;return M&&M.view?M.view.now+(Date.now()-M.at):Date.now();}
function fmt(sec){sec=Math.max(0,Math.ceil(sec));const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;return h?h+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0'):m+':'+String(s).padStart(2,'0');}
// the floor: rails converging to the far glow, sleepers closer together with distance (simple perspective)
function floor(){const vx=50,vy=47,W=100,H=100;let g=`<svg class="mi-floor" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="miRail" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#dfe6f2"/><stop offset="1" stop-color="#6c7488" stop-opacity=".2"/></linearGradient></defs>`;
 g+=`<path d="M8 ${H} L${vx-2} ${vy+2} L${vx+2} ${vy+2} L92 ${H}Z" fill="#000" opacity=".28"/>`;
 for(let i=0;i<16;i++){const f=Math.pow(.78,i),y=vy+2+(H-vy-2)*f,hw=(42*f)+2,th=Math.max(.25,2.4*f);g+=`<rect x="${(vx-hw).toFixed(2)}" y="${(y-th).toFixed(2)}" width="${(hw*2).toFixed(2)}" height="${th.toFixed(2)}" rx="${(th/3).toFixed(2)}" fill="#7a5530" opacity="${(.45+.55*f).toFixed(2)}"/>`;}
 for(const s of[-1,1])g+=`<path d="M${vx+s*30} ${H} L${vx+s*1.2} ${vy+2}" stroke="url(#miRail)" stroke-width="1.6" fill="none"/>`;
 return g+'</svg>';}
function tunnel(id,workers){let h='<div class="mi-tunnel">';
 for(let i=0;i<7;i++)h+=`<i class="mi-arch" style="--k:${i};--f:${(.62**i).toFixed(4)};--br:${(1-i*.09).toFixed(2)}"></i>`;
 h+='<i class="mi-glowend"></i>'+floor();
 for(let i=0;i<6;i++)for(const s of[-1,1])h+=`<i class="mi-lamp" style="--k:${i};--s:${s};--f:${(.66**i).toFixed(4)};--g:${(.72**i).toFixed(4)}"></i>`;
 const C=[[-1,.15,1.1,0],[1,.3,.9,1],[-1,.55,.8,1],[1,.75,1.2,0],[-1,1.4,.7,0],[1,1.9,.9,1],[-1,2.6,.6,1],[1,3.2,.7,0]];
 for(const[s,k,sz,j]of C)h+=`<i class="mi-cry${j?' b':''}" style="--s:${s};--k:${k};--z:${sz};--f:${(.62**k).toFixed(4)};--g:${(.7**k).toFixed(4)}"></i>`;
 h+='<i class="mi-cart c1"><b></b></i><i class="mi-cart c2"><b></b></i>';
 const show=workers.length?workers.slice(0,4):[];
 show.forEach((b,i)=>{h+=`<span class="mi-bot" style="--i:${i};--o:${(i-(show.length-1)/2).toFixed(2)};--b:${i%2}"><i></i><em>⛏️</em></span>`;});
 return h+'</div>';}
function render(el){const v=V(),hd=v&&v.hidden,m=hd&&hd.mines.find(x=>x.id===cur),bots=(v&&v.bots)||[];
 const here=bots.filter(b=>b.site===cur),work=here.filter(b=>b.endsAt&&now()<b.endsAt),free=bots.find(b=>b.prof==='miner'&&b.source!=='stars'&&b.endsAt==null);
 el.className='mi mi-'+cur;
 let info=`<div class="mi-mats">`+['ice','fire','star'].map(k=>`<span class="m-${k}">${ICON[k]} <b>${hd?hd.mat[k]|0:0}</b><small>${esc(_t('mine.'+MAT[k]))}</small></span>`).join('')+'</div>';
 info+=`<p class="mi-status">${esc(work.length?_t('mine.workers',{n:work.length})+' · '+_t('mine.away',{t:fmt((Math.min(...work.map(b=>b.endsAt))-now())/1000)}):here.length?_t('mine.back'):_t('mine.empty'))}</p>`;
 if(m&&!here.length)info+=`<button class="mi-send" data-send ${free?'':'disabled'}>${esc(free?_t('mine.send'):_t('mine.no_miner'))}</button>`;
 if(cur==='star')info+=`<p class="mi-note">💠 ${esc(hd&&hd.ghost?_t('mine.ghost')+' ✓':_t('mine.ghost_hint'))}</p>`;
 el.innerHTML=`<div class="mi-scene">${tunnel(cur,work)}<header><b>${ICON[cur]} ${esc(_t('mine.'+cur))}</b><button class="mi-exit" data-exit>✕ ${esc(_t('mine.exit'))}</button></header><div class="mi-panel">${info}</div></div>`;}
async function send(){const v=V(),b=v&&v.bots.find(x=>x.prof==='miner'&&x.source!=='stars'&&x.endsAt==null),UI=root.MoonGrowthUI;if(!b||!UI||!UI.api)return;
 try{const r=await UI.api('/api/mines/send',{mine:cur,id:b.id});if(r&&r.bots&&root.MoonBots.setView)root.MoonBots.setView(r.bots);}catch(e){const G=root.MoonGame;G&&G.toast&&G.toast(_t('bots.err'));}
 const el=d.getElementById('mine-room');if(el&&!el.hidden)render(el);}
function open(id){cur=id;let el=d.getElementById('mine-room');if(!el){el=d.createElement('div');el.id='mine-room';d.body.appendChild(el);
  el.addEventListener('click',e=>{if(e.target.closest('[data-exit]')){close();return;}if(e.target.closest('[data-send]'))send();});}
 render(el);el.hidden=false;d.body.classList.add('in-mine');clearInterval(tick);tick=setInterval(()=>{if(!el.hidden)render(el);},1000);
 try{const G=root.MoonGame;G&&G.resetControls&&G.resetControls();}catch(e){}}
function close(){const el=d.getElementById('mine-room');if(el)el.hidden=true;clearInterval(tick);tick=null;d.body.classList.remove('in-mine');}
root.MoonMineRoom={open,close,render};
})(typeof window!=='undefined'?window:globalThis);
