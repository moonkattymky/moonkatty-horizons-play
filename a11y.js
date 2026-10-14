/* v85 ACCESSIBILITY — four player settings in the menu (stored on this device):
   • Large text      → html.mk-big-text   (panels, dialogs and the quest card are scaled up ~15%)
   • High contrast   → html.mk-contrast   (solid dark panels, white text, bright outlines)
   • Reduce motion   → html.mk-calm       (no CSS animations/transitions; cut-scenes skip shake, flashes, meteors)
                       default follows the phone's «reduce motion» setting
   • Colour-blind safe → html.mk-cb       (status is never shown by colour alone: shapes/icons + yellow/blue palette)
   Also: every icon-only button gets a spoken name (aria-label) from its title / tooltip, so screen readers never say just "button". */
(function(root){'use strict';
const d=root.document,h=d.documentElement,KEY='moonkatty-a11y',OPTS=['text','contrast','calm','cb'],CLS={text:'mk-big-text',contrast:'mk-contrast',calm:'mk-calm',cb:'mk-cb'};
function osCalm(){try{return!!(root.matchMedia&&root.matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(e){return false;}}
function load(){let v={};try{v=JSON.parse(root.localStorage.getItem(KEY)||'{}')||{};}catch(e){v={};}const o={};for(const k of OPTS)o[k]=typeof v[k]==='boolean'?v[k]:(k==='calm'?osCalm():false);return o;}
let state=load();
function apply(){for(const k of OPTS)h.classList.toggle(CLS[k],!!state[k]);}
function save(){try{root.localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}}
function set(k,v){if(!OPTS.includes(k))return;state[k]=!!v;save();apply();try{root.dispatchEvent(new CustomEvent('mk-a11y',{detail:{...state}}));}catch(e){}}
apply();
// ---- spoken names for icon-only buttons ----
const LETTER=/[\p{L}\p{N}]{2,}/u;
function nameOf(b){const t=b.getAttribute('title');if(t&&t.trim())return t.trim();const lab=b.querySelector('[aria-label]');if(lab)return lab.getAttribute('aria-label');const img=b.querySelector('img[alt]');if(img&&img.alt.trim())return img.alt.trim();
 if(b.matches('[data-close],.g-close,.close,[data-exit],.sheet-close'))return(root._t?root._t('a11y.close'):'Close');return'';}
function label(scope){const list=(scope||d).querySelectorAll?(scope||d).querySelectorAll('button:not([aria-label]):not([aria-labelledby]),[role=button]:not([aria-label])'):[];
 for(const b of list){const txt=(b.textContent||'').trim();if(LETTER.test(txt))continue;const n=nameOf(b);if(n)b.setAttribute('aria-label',n);}}
let pend=0;function soon(){if(pend)return;pend=root.setTimeout(()=>{pend=0;try{label(d);}catch(e){}},400);}
function wire(){for(const k of OPTS){const el=d.getElementById('opt-a11y-'+k);if(!el)continue;el.checked=!!state[k];el.onchange=()=>set(k,el.checked);}
 label(d);try{new MutationObserver(soon).observe(d.body,{childList:true,subtree:true});}catch(e){}}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',wire);else wire();
root.MoonA11y={get:()=>({...state}),set,calm:()=>!!state.calm,big:()=>!!state.text,label};
})(typeof window!=='undefined'?window:globalThis);
