/* v54 retention: daily cipher + cat piggy bank + bot reminder switch. The server owns everything
   (the cipher answer never reaches the client before it is solved or all tries are used; the bank fills on
   the server clock). This file only draws two dock buttons and their dialogs. Offline it shows a note. */
(function(){'use strict';
const Game=window.MoonGame,UI=window.MoonGrowthUI;if(!Game||!UI||typeof document==='undefined')return;
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]),T=(k,p)=>window._t?_t(k,p):k;
const GLYPH={paw:'🐾',moon:'🌙',crystal:'💎',rocket:'🚀',star:'⭐',earth:'🌍'};
let cipher=null,bank=null,bankAt=0,pick=[],busy=false,tick=null;
const toast=t=>t&&Game.toast&&Game.toast(t),buzz=k=>{try{window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(k);}catch{}};
function fmt(sec){sec=Math.max(0,Math.ceil(sec));const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;return h?h+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0'):m+':'+String(s).padStart(2,'0');}
function grantLocal(r){const G=window.MoonGrowth;if(r&&G&&G.applyServerReward&&G.applyServerReward(Game.state,r)){Game.save();Game.hud();}}
function dlg(id){let d=document.getElementById(id);if(d)return d;d=document.createElement('dialog');d.id=id;d.className='growth-dialog ret-dialog';(document.getElementById('app-viewport')||document.body).append(d);d.addEventListener('click',e=>{if(e.target===d)d.close();});d.addEventListener('close',()=>{clearInterval(tick);tick=null;});return d;}
const head=(eb,title)=>`<div class="g-head"><div><span class="eyebrow">${esc(eb)}</span><h2>${esc(title)}</h2></div><button class="close-icon" data-gclose aria-label="×">×</button></div>`;
function show(d){d.querySelectorAll('[data-gclose]').forEach(b=>b.onclick=()=>d.close());if(!d.open){document.querySelectorAll('dialog[open]').forEach(x=>{if(x!==d)x.close();});Game.resetControls?.();d.showModal();}}
const offline=()=>`<p class="ret-note">${esc(T('ret.offline'))}</p>`;
// ---------- cipher ----------
function renderCipher(){const d=dlg('ret-cipher');let h=head(T('ret.cipher_eyebrow'),T('ret.cipher_title'));
 if(!cipher){d.innerHTML=h+(UI.online?'<p class="ret-note">…</p>':offline());show(d);return;}
 const c=cipher,done=c.solved||c.left===0;h+=`<p class="ret-sub">${esc(T('ret.cipher_sub'))}</p><ol class="ret-hints">`;
 c.hints.forEach((id,i)=>{h+=`<li><b>${esc(T('ret.hint',{n:i+1}))}</b><span>${esc(T('ret.h'+id))}</span></li>`;});h+='</ol>';
 const slots=done&&c.answer?c.answer:pick;h+='<div class="ret-slots">';for(let i=0;i<c.len;i++){const s=slots[i];h+=`<span class="ret-slot${s?' on':''}${done&&c.solved?' win':''}">${s?GLYPH[s]:''}</span>`;}h+='</div>';
 if(done){h+=`<p class="ret-result ${c.solved?'ok':'fail'}">${esc(c.solved?T('ret.solved',{p:c.points[Math.min(c.tries,c.points.length)-1]}):T('ret.failed'))}</p>`;}
 else{h+='<div class="ret-keys">'+c.symbols.map(s=>`<button type="button" data-sym="${s}" ${pick.length>=c.len?'disabled':''}><i>${GLYPH[s]}</i><small>${esc(T('ret.s_'+s))}</small></button>`).join('')+'</div>';
  h+=`<div class="ret-row"><button type="button" class="ret-ghost" data-clear ${pick.length?'':'disabled'}>${esc(T('ret.clear'))}</button><button type="button" class="ret-main" data-check ${pick.length===c.len&&!busy?'':'disabled'}>${esc(T('ret.check'))}</button></div>`;
  h+=`<p class="ret-meta">${esc(T('ret.tries',{n:c.left}))} · ${esc(T('ret.reward',{a:c.points[0],b:c.points[1],c:c.points[2]}))}</p>`;}
 if(c.attempts.length){h+='<ul class="ret-attempts">'+c.attempts.map(a=>`<li><span>${a.seq.map(s=>GLYPH[s]||'?').join(' ')}</span><em>${esc(T('ret.exact',{n:a.exact}))}</em></li>`).join('')+'</ul>';}
 h+=`<p class="ret-meta ret-next" data-next>${esc(T('ret.next',{t:fmt(c.resetInSec-(Date.now()-c._at)/1000)}))}</p>`;
 d.innerHTML=h;d.querySelectorAll('[data-sym]').forEach(b=>b.onclick=()=>{if(pick.length<c.len){pick.push(b.dataset.sym);try{window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();}catch{}renderCipher();}});
 const cl=d.querySelector('[data-clear]');if(cl)cl.onclick=()=>{pick=[];renderCipher();};const ck=d.querySelector('[data-check]');if(ck)ck.onclick=guess;show(d);
 clearInterval(tick);tick=setInterval(()=>{const n=d.querySelector('[data-next]');if(n)n.textContent=T('ret.next',{t:fmt(c.resetInSec-(Date.now()-c._at)/1000)});if(c.resetInSec-(Date.now()-c._at)/1000<=0){clearInterval(tick);loadCipher();}},1000);}
const setCipher=c=>{if(c){c._at=Date.now();cipher=c;}};
async function loadCipher(){if(!UI.online)return renderCipher();try{setCipher((await UI.api('/api/cipher',{})).cipher);}catch{}renderCipher();badges();}
async function guess(){if(busy||!cipher||pick.length!==cipher.len)return;busy=true;const seq=pick.slice();
 try{const r=await UI.api('/api/cipher/guess',{seq});setCipher(r.cipher);pick=[];if(r.solved){buzz('success');grantLocal(r.reward);toast(T('ret.solved',{p:r.reward?r.reward.points:0}));}else{buzz('warning');toast(T('ret.exact',{n:r.exact}));}}
 catch(e){if(e.status===409)try{setCipher((await UI.api('/api/cipher',{})).cipher);}catch{}}busy=false;renderCipher();badges();}
// ---------- piggy bank ----------
function stored(){if(!bank)return 0;if(bank.full||bank.fullInSec==null)return bank.stored;const el=(Date.now()-bankAt)/1000,left=Math.max(0,bank.fullInSec-el);return Math.min(bank.cap,Math.floor(bank.cap-left*bank.rate/3600));}
function renderBank(){const d=dlg('ret-bank');let h=head(T('ret.bank_eyebrow'),T('ret.bank_title'));
 if(!bank){d.innerHTML=h+(UI.online?'<p class="ret-note">…</p>':offline());show(d);return;}
 const b=bank,n=stored(),left=b.fullInSec==null?0:Math.max(0,b.fullInSec-(Date.now()-bankAt)/1000),full=b.full||left<=0;
 h+=`<p class="ret-sub">${esc(T('ret.bank_sub',{h:b.hours}))}</p><div class="ret-pig${full?' full':''}"><span class="ret-pig-ico">🐷</span><div class="ret-fill"><i style="width:${Math.round(n/b.cap*100)}%"></i></div><b data-amt>${n} / ${b.cap}</b></div>`;
 h+=`<p class="ret-meta">${esc(T('ret.bank_rate',{n:b.rate,l:b.lives,f:b.friends}))}</p><p class="ret-meta" data-left>${esc(full?T('ret.bank_full'):T('ret.bank_fill',{t:fmt(left)}))}</p>`;
 h+=`<button type="button" class="ret-main ret-wide" data-collect ${n>=1&&!busy?'':'disabled'}>${esc(T('ret.bank_collect'))}${n>=1?' +'+n:''}</button>`;
 h+=`<p class="ret-note small">${esc(T('ret.res_note'))}</p>`;
 const r=b.reminders||{};h+=`<div class="ret-remind"><label><input type="checkbox" data-remind ${r.on?'checked':''}><span>${esc(T('ret.remind'))}</span></label><p>${esc(T('ret.remind_hint'))}</p>`;
 if(!r.started||r.blocked)h+=`<button type="button" class="ret-ghost ret-wide" data-startbot>${esc(T('ret.remind_start'))}</button>`;h+='</div>';
 d.innerHTML=h;const cb=d.querySelector('[data-collect]');if(cb)cb.onclick=collect;
 const rm=d.querySelector('[data-remind]');if(rm)rm.onchange=async()=>{try{setBank((await UI.api('/api/reminders',{on:rm.checked})).bank);}catch{}renderBank();};
 const sb=d.querySelector('[data-startbot]');if(sb)sb.onclick=()=>{const u='https://t.me/'+(r.bot||'MoonkattyHorizonsBot')+'?start=remind';const w=window.Telegram?.WebApp;if(w&&w.openTelegramLink)w.openTelegramLink(u);else window.open(u,'_blank');};
 show(d);clearInterval(tick);tick=setInterval(()=>{if(!d.open)return;const m=stored(),a=d.querySelector('[data-amt]');if(a&&a.textContent!==m+' / '+b.cap){renderBank();}else{const l=d.querySelector('[data-left]'),lf=b.fullInSec==null?0:Math.max(0,b.fullInSec-(Date.now()-bankAt)/1000);if(l)l.textContent=lf<=0||b.full?T('ret.bank_full'):T('ret.bank_fill',{t:fmt(lf)});}},1000);}
const setBank=b=>{if(b){bank=b;bankAt=Date.now();}};
async function loadBank(){if(!UI.online)return renderBank();try{setBank((await UI.api('/api/bank',{})).bank);}catch{}renderBank();badges();}
async function collect(){if(busy)return;busy=true;try{const r=await UI.api('/api/bank/collect',{});setBank(r.bank);if(r.collected>0){buzz('success');grantLocal(r.reward);toast(T('ret.bank_got',{n:r.collected}));}else toast(T('ret.bank_empty'));}catch{}busy=false;renderBank();badges();}
// ---------- dock ----------
function badges(){const c=$('#growth-dock [data-ret="cipher"] .g-dot'),b=$('#growth-dock [data-ret="bank"] .g-dot');if(c)c.hidden=!(cipher&&!cipher.solved&&cipher.left>0);if(b)b.hidden=!(bank&&(bank.full||stored()>=bank.cap));}
function mount(){const dock=$('#growth-dock');if(!dock||dock.querySelector('[data-ret]'))return!!dock;
 for(const[k,ico]of[['cipher','🔣'],['bank','🐷']]){const b=document.createElement('button');b.type='button';b.className='gd ret-gd';b.dataset.ret=k;b.innerHTML=`<span class="gn-icon" aria-hidden="true">${ico}</span><span class="gn-label">${esc(T('ret.'+k))}</span><i class="g-dot" hidden></i>`;b.onclick=()=>k==='cipher'?(renderCipher(),loadCipher()):(renderBank(),loadBank());dock.append(b);}return true;}
let tries=0;const iv=setInterval(()=>{if(mount()||++tries>120){clearInterval(iv);if(UI.online){UI.api('/api/cipher',{}).then(r=>{setCipher(r.cipher);badges();}).catch(()=>{});}}},500);
document.addEventListener('moonkatty:lang',()=>{document.querySelectorAll('#growth-dock [data-ret]').forEach(b=>{const l=b.querySelector('.gn-label');if(l)l.textContent=T('ret.'+b.dataset.ret);});});
window.MoonRetention={openCipher:()=>{renderCipher();loadCipher();},openBank:()=>{renderBank();loadBank();},get cipher(){return cipher;},get bank(){return bank;}};
})();
