/* MOONKATTY language picker: 13 languages in a 2-column grid. Shown once on the very first launch (detected language
   highlighted) and reachable from the cover (🌐 button) and the main menu. Choosing = save + clean reload (MoonI18n.choose). */
(()=>{'use strict';
const I=window.MoonI18n;if(!I||!document.body)return;
const ua=navigator.userAgent||'';
// Windows desktop has no flag emoji glyphs: show a small country-code badge instead of two stray letters.
const noFlags=/Windows NT/i.test(ua)&&!/Android|iPhone|iPad/i.test(ua);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const info=id=>I.LANGS.find(l=>l.id===id)||I.LANGS[0];
const flag=l=>noFlags&&l.cc!=='☾'?`<span class="lp-flag lp-cc" aria-hidden="true">${l.cc}</span>`:`<span class="lp-flag" aria-hidden="true">${l.flag}</span>`;
let dlg=null,first=false;
function build(){dlg=document.createElement('dialog');dlg.id='lang-picker';dlg.className='lang-picker';dlg.setAttribute('aria-labelledby','lang-picker-title');
 (document.getElementById('app-viewport')||document.body).append(dlg);
 dlg.addEventListener('cancel',e=>{if(first)e.preventDefault();});
 dlg.addEventListener('click',e=>{const b=e.target.closest('[data-lang-id]');if(b){pick(b.dataset.langId);return;}if(e.target.closest('[data-lp-close]'))close();});}
function render(highlight){const cur=highlight||I.lang;const tdir=I.isRTL(I.lang)?'rtl':'ltr';
 dlg.innerHTML=`<div class="lp-glow" aria-hidden="true"></div><header class="lp-head" dir="${tdir}"><span class="lp-globe" aria-hidden="true">🌐</span><span class="lp-eyebrow">${esc(_t('lang.eyebrow'))}</span><h2 id="lang-picker-title">${esc(_t('lang.title'))}</h2>${first?'':`<button type="button" class="lp-x" data-lp-close aria-label="${esc(_t('growth.zakryt'))}">×</button>`}</header>`+
 `<div class="lp-grid" role="listbox" aria-labelledby="lang-picker-title">${I.LANGS.map(l=>`<button type="button" role="option" data-lang-id="${l.id}" class="lp-item${l.id===cur?' on':''}" aria-selected="${l.id===cur}">${flag(l)}<span class="lp-name" lang="${l.id}" dir="${I.isRTL(l.id)?'rtl':'ltr'}">${esc(l.name)}</span>${l.id===cur?'<i class="lp-check" aria-hidden="true">✓</i>':''}</button>`).join('')}</div>`+
 `<p class="lp-hint" dir="${tdir}">${esc(_t('lang.hint'))}</p>`;}
function open({firstRun=false}={}){if(!dlg)build();first=firstRun;render(firstRun?I.detected:I.lang);
 if(!dlg.open){try{dlg.showModal();}catch{dlg.setAttribute('open','');}}
 fitNames();const on=dlg.querySelector('.lp-item.on');if(on)try{on.focus({preventScroll:true});}catch{}}
// Native names are never cut: a long single word shrinks a little; multi-word names may wrap to a second line.
function fitNames(){if(!dlg)return;dlg.querySelectorAll('.lp-name').forEach(el=>{el.style.fontSize='';el.style.overflowWrap='';if(!el.clientWidth)return;let fs=parseFloat(getComputedStyle(el).fontSize)||15;let n=0;
 while(el.scrollWidth>el.clientWidth+.5&&fs>12&&n++<10){fs-=.5;el.style.fontSize=fs+'px';}if(el.scrollWidth>el.clientWidth+.5)el.style.overflowWrap='anywhere';});}
addEventListener('resize',()=>{if(dlg&&dlg.open)fitNames();});
function close(){if(dlg&&dlg.open)dlg.close();}
function pick(id){const b=dlg.querySelector(`[data-lang-id="${id}"]`);if(b){dlg.querySelectorAll('.lp-item').forEach(x=>x.classList.toggle('on',x===b));b.classList.add('picked');}
 // v44: on the very first launch the world has not started yet — switch in place and start it, no page reload.
 if(window.MoonBoot&&window.MoonBoot.gated){I.choose(id,{reload:false});dlg.classList.add('leaving');
  I.switchTo(id).then(()=>{relabel();first=false;dlg.classList.remove('leaving');close();window.MoonBoot.release();});return;}
 const reloading=I.choose(id);
 if(reloading)dlg.classList.add('leaving');else setTimeout(close,140);}
// Entry points: cover globe pill + main menu row.
function label(){const l=info(I.lang);return `${noFlags&&l.cc!=='☾'?`<span class="lp-cc">${l.cc}</span>`:l.flag} ${esc(l.name)}`;}
function mount(){const cover=document.getElementById('cover');
 if(cover&&!document.getElementById('cover-lang')){const b=document.createElement('button');b.type='button';b.id='cover-lang';b.className='cover-lang';
  b.setAttribute('aria-label',_t('lang.menu'));b.setAttribute('aria-haspopup','dialog');b.innerHTML=`<span aria-hidden="true">🌐</span><b>${I.lang.toUpperCase()}</b>`;
  b.addEventListener('click',()=>open());cover.append(b);}
 const quality=document.querySelector('#chapters .setting');
 if(quality&&!document.getElementById('menu-lang')){const b=document.createElement('button');b.type='button';b.id='menu-lang';b.className='menu-lang';
  b.innerHTML=`<span>🌐 ${esc(_t('lang.menu'))}</span><b>${label()}</b>`;b.addEventListener('click',()=>open());quality.before(b);}}
mount();
function relabel(){const c=document.getElementById('cover-lang');if(c){c.setAttribute('aria-label',_t('lang.menu'));const b=c.querySelector('b');if(b)b.textContent=I.lang.toUpperCase();}
 const m=document.getElementById('menu-lang');if(m)m.innerHTML=`<span>🌐 ${esc(_t('lang.menu'))}</span><b>${label()}</b>`;}
// Long words (German, Italian…) on the small HUD action labels: shrink the type a little instead of cutting the word.
function over(el){if(el.scrollWidth>el.clientWidth)return true;const r=document.createRange();r.selectNodeContents(el);const cs=getComputedStyle(el);return r.getBoundingClientRect().width>el.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight)+.25;}
function fit(el){el.style.fontSize='';if(!el.clientWidth)return;let fs=parseFloat(getComputedStyle(el).fontSize)||12;let n=0;while(over(el)&&fs>8.5&&n++<12){fs-=.5;el.style.fontSize=fs+'px';}}
const labels=[...document.querySelectorAll('.actions button span, .joystick-wrap small')];
if(labels.length&&'MutationObserver'in window){const mo=new MutationObserver(list=>{for(const m of list){const el=m.target.nodeType===3?m.target.parentElement:m.target;if(labels.includes(el))fit(el);}});
 for(const el of labels){mo.observe(el,{childList:true,characterData:true,subtree:true});}
 const refit=()=>labels.forEach(fit);addEventListener('resize',refit);setTimeout(refit,300);
 if('ResizeObserver'in window){const ro=new ResizeObserver(es=>es.forEach(e=>{if(e.contentRect.width)fit(e.target);}));labels.forEach(el=>ro.observe(el));}}
window.MoonLangUI={open,close,get dialog(){return dlg;}};
const params=new URLSearchParams(location.search);
if(I.firstRun&&!params.has('nolang'))setTimeout(()=>open({firstRun:true}),0);
})();
