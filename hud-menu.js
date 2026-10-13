/* v64 one-button HUD: the right dock (Вахта, Экипаж, Задания, Команда, Байк, Шифр, Копилка, Боты) and the icon row under the
   quest bar (scanner, build, map, cards) fold into ONE menu button on the right. The dock element itself becomes the panel grid,
   so every module keeps adding its own tile and its own .g-dot; the menu button shows a dot when any tile has one. */
(function(root){'use strict';if(typeof document==='undefined')return;
const $=s=>document.querySelector(s),T=(k,p)=>root._t?root._t(k,p):k,html=document.documentElement;
const GRID='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="2.2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2.2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2.2"/><rect x="13.5" y="13.5" width="7" height="7" rx="3.5"/></svg>';
const PROXY=[['shop','🛍️','menu.shop',null],['scan','⌖','menu.scan','#scan'],['build','⌂','menu.build','#build'],['map','◈','menu.map','#world-map-button'],['cards','▱','menu.cards','#collection']];
let btn=null,back=null,dock=null;
function isOpen(){return html.classList.contains('hud-menu-open');}
function setOpen(on){html.classList.toggle('hud-menu-open',!!on);if(btn)btn.setAttribute('aria-expanded',on?'true':'false');if(on)sync();try{root.Telegram?.WebApp?.HapticFeedback?.selectionChanged?.();}catch{}}
function tile(id,ico,key){const b=document.createElement('button');b.type='button';b.className='gd v64-tile';b.dataset.menu=id;b.innerHTML=`<span class="gn-icon" aria-hidden="true">${ico}</span><span class="gn-label">${T(key)}</span><i class="g-dot" hidden></i>`;return b;}
function addTiles(){if(!dock)return;for(const[id,ico,key,src]of PROXY){if(dock.querySelector(`[data-menu="${id}"]`))continue;const b=tile(id,ico,key);
  b.onclick=()=>{setOpen(false);if(id==='shop'){root.MoonSeasonUI?.openShop?root.MoonSeasonUI.openShop():root.MoonSeasonUI?.open?.();return;}const s=$(src);if(s&&!s.disabled)s.click();};
  const hd=dock.querySelector('.hm-head');if(id==='shop'&&hd)hd.after(b);else if(id==='shop')dock.prepend(b);else dock.append(b);}}
// proxy tiles follow their source button (hidden/disabled in the tutorial, cards count)
function sync(){if(!dock)return;for(const id of['scan','build','map','cards']){const b=dock.querySelector(`[data-menu="${id}"]`);if(b&&b.nextElementSibling&&!b.nextElementSibling.dataset.menu)dock.append(b);}for(const[id,,key,src]of PROXY){const b=dock.querySelector(`[data-menu="${id}"]`);if(!b||!src)continue;const s=$(src);b.hidden=!s||s.hidden;b.disabled=!!(s&&s.disabled);
  if(id==='cards'){const n=$('#card-count');b.querySelector('.gn-label').textContent=T(key)+(n&&n.textContent?' '+n.textContent:'');}}
 const sh=dock.querySelector('[data-menu="shop"] .g-dot');if(sh){const p=root.MoonGrowthUI?.stage3?.shop?.pack;sh.hidden=!(p&&p.active&&p.today&&(!p.today.bot||!p.today.energy));}
 dots();}
function dots(){if(!btn||!dock)return;const any=[...dock.querySelectorAll('.g-dot')].some(d=>!d.hidden&&!d.closest('[hidden]'));btn.querySelector('.g-dot').hidden=!any;btn.classList.toggle('ready',any);btn.hidden=dock.hidden;}
function mount(){dock=$('#growth-dock');if(!dock)return false;if(btn)return true;html.classList.add('v64-hud');
 const host=$('#app-viewport')||document.body;
 back=document.createElement('div');back.className='hud-menu-back';back.onclick=()=>setOpen(false);host.append(back);
 btn=document.createElement('button');btn.type='button';btn.id='hud-menu';btn.className='hud-menu';btn.setAttribute('aria-haspopup','true');btn.setAttribute('aria-expanded','false');
 btn.innerHTML=`<span class="hm-ico">${GRID}</span><span class="hm-lbl">${T('menu.open')}</span><i class="g-dot" hidden></i>`;btn.onclick=e=>{e.stopPropagation();setOpen(!isOpen());};host.append(btn);
 const head=document.createElement('div');head.className='hm-head';head.innerHTML=`<b>${T('menu.title')}</b><button type="button" class="hm-x" aria-label="×">×</button>`;head.querySelector('.hm-x').onclick=()=>setOpen(false);dock.prepend(head);
 dock.setAttribute('role','menu');addTiles();
 dock.addEventListener('click',e=>{const b=e.target.closest('button.gd');if(b&&!b.dataset.menu)setTimeout(()=>setOpen(false),0);});
 new MutationObserver(dots).observe(dock,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&isOpen())setOpen(false);});
 document.addEventListener('moonkatty:lang',()=>{btn.querySelector('.hm-lbl').textContent=T('menu.open');head.querySelector('b').textContent=T('menu.title');for(const[id,,key]of PROXY){const l=dock.querySelector(`[data-menu="${id}"] .gn-label`);if(l)l.textContent=T(key);}sync();});
 sync();return true;}
let n=0;const iv=setInterval(()=>{if(mount()){addTiles();sync();}if(++n>80)clearInterval(iv);},250);setInterval(()=>{if(btn)sync();else if(mount()){addTiles();sync();}},1500);   // the dock may appear later (after Life #1 / session)
root.MoonHudMenu={open:()=>setOpen(true),close:()=>setOpen(false),toggle:()=>setOpen(!isOpen()),get isOpen(){return isOpen();},sync};
})(typeof window!=='undefined'?window:globalThis);
