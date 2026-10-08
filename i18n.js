/* MOONKATTY i18n: 13 languages, t(key,params) with plural forms, language detection and the dictionary loader.
   Loaded first in <head>: picks the language (save → ?lang= → Telegram → browser → English) and writes the
   dictionary <script>s synchronously, so every later script can call _t() while it initialises.
   Switching language = save the choice + clean reload. In node (tests) the Russian dictionary is the default. */
(function(root){
'use strict';
const LANGS=[
 {id:'en',name:'English',flag:'🇬🇧',cc:'GB'},{id:'ru',name:'Русский',flag:'🇷🇺',cc:'RU'},{id:'uk',name:'Українська',flag:'🇺🇦',cc:'UA'},
 {id:'es',name:'Español',flag:'🇪🇸',cc:'ES'},{id:'pt',name:'Português',flag:'🇵🇹',cc:'PT'},{id:'de',name:'Deutsch',flag:'🇩🇪',cc:'DE'},
 {id:'fr',name:'Français',flag:'🇫🇷',cc:'FR'},{id:'it',name:'Italiano',flag:'🇮🇹',cc:'IT'},{id:'tr',name:'Türkçe',flag:'🇹🇷',cc:'TR'},
 {id:'he',name:'עברית',flag:'🇮🇱',cc:'IL'},{id:'ar',name:'العربية',flag:'🌙',cc:'☾'},{id:'ko',name:'한국어',flag:'🇰🇷',cc:'KR'},
 {id:'zh',name:'中文',flag:'🇨🇳',cc:'CN'}];
const IDS=LANGS.map(l=>l.id),RTL=['he','ar'],SAVE_KEY='moonkatty-new-horizons-v02',PREF_KEY='moonkatty-lang';
const ALIAS={iw:'he',ji:'he',ua:'uk',pt:'pt',zh:'zh',nb:'',ber:''};
const dicts={};let lang='ru';
// 'pt-BR'→pt, 'zh-Hant-TW'→zh, 'iw'→he, 'en_US'→en; unknown → ''
function normalize(code){const c=String(code||'').trim().toLowerCase().replace(/_/g,'-');if(!c)return'';const base=c.split('-')[0];const id=Object.hasOwn(ALIAS,base)?ALIAS[base]:base;return IDS.includes(id)?id:'';}
function telegramLanguage(){
 try{const u=root.Telegram?.WebApp?.initDataUnsafe?.user;if(u&&u.language_code)return u.language_code;}catch{}
 // telegram-web-app.js loads later; Telegram also passes init data in the URL hash.
 try{const h=new URLSearchParams(String(root.location?.hash||'').replace(/^#/,''));const data=h.get('tgWebAppData');if(data){const u=JSON.parse(new URLSearchParams(data).get('user')||'null');if(u&&u.language_code)return u.language_code;}}catch{}
 try{const p=JSON.parse(root.sessionStorage?.getItem('__telegram__initParams')||'null');const data=p&&p.tgWebAppData;if(data){const u=JSON.parse(new URLSearchParams(data).get('user')||'null');if(u&&u.language_code)return u.language_code;}}catch{}
 return '';}
function detect(tgCode=telegramLanguage(),navLangs){const nav=navLangs||(root.navigator?(root.navigator.languages&&root.navigator.languages.length?root.navigator.languages:[root.navigator.language]):[]);
 for(const c of[tgCode,...nav]){const id=normalize(c);if(id)return id;}return'en';}
function add(id,d){dicts[id]=Object.assign(dicts[id]||{},d);}
function setLang(id){lang=IDS.includes(id)?id:'en';return lang;}
function plural(n,id=lang){try{return new Intl.PluralRules(id).select(Number(n)||0);}catch{return Number(n)===1?'one':'other';}}
function lookup(key){for(const id of[lang,'en','ru']){const d=dicts[id];if(d&&d[key]!=null)return d[key];}return null;}
function t(key,params){let v=lookup(key);if(v==null)return key;
 if(typeof v==='object'){const n=params&&('n'in params)?params.n:0;v=v[plural(n)]??v.other??'';}
 if(params)v=v.replace(/\{(\w+)\}/g,(m,k)=>Object.hasOwn(params,k)?String(params[k]):m);return v;}
function has(key){return lookup(key)!=null;}
function isRTL(id=lang){return RTL.includes(id);}
// Fill static HTML: data-i18n (first text node), data-i18n-html, data-i18n-aria / -title / -placeholder.
function applyDom(doc=root.document){if(!doc)return;
 for(const el of doc.querySelectorAll('[data-i18n]')){const v=t(el.dataset.i18n);const node=[...el.childNodes].find(n=>n.nodeType===3&&n.nodeValue.trim());
  if(node){const m=/^(\s*)[\s\S]*?(\s*)$/.exec(node.nodeValue);node.nodeValue=m[1]+v+m[2];}else el.prepend(doc.createTextNode(v));}
 for(const el of doc.querySelectorAll('[data-i18n-html]'))el.innerHTML=t(el.dataset.i18nHtml);
 for(const[attr,ds]of[['aria-label','i18nAria'],['title','i18nTitle'],['placeholder','i18nPlaceholder']])for(const el of doc.querySelectorAll('[data-'+ds.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())+']'))el.setAttribute(attr,t(el.dataset[ds]));
 if(doc.title!==undefined&&has('html.title'))doc.title=t('html.title');}
const api={LANGS,IDS,RTL,SAVE_KEY,PREF_KEY,normalize,detect,telegramLanguage,add,setLang,plural,t,has,isRTL,applyDom,dicts,
 get lang(){return lang;},firstRun:false,detected:'en',
 // Persist + clean reload. The game save (schema v7) keeps the choice; PREF_KEY covers the moment before the first save.
 choose(id,{reload=true}={}){id=normalize(id)||'en';try{root.localStorage.setItem(PREF_KEY,id);}catch{}
  try{const g=root.MoonGame;if(g&&g.state){g.state.lang=id;g.save?.();}else{const raw=root.localStorage.getItem(SAVE_KEY);if(raw){const s=JSON.parse(raw);s.lang=id;root.localStorage.setItem(SAVE_KEY,JSON.stringify(s));}}}catch{}
  if(!reload||id===lang)return false;
  // A ?lang= override would win over the saved choice after the reload, so drop it.
  try{const u=new URL(root.location.href);if(u.searchParams.has('lang')){u.searchParams.delete('lang');root.location.replace(u.toString());return true;}}catch{}
  root.location.reload();return true;},
 // v44 first launch: switch the language in place (no reload) before the world scripts start. Resolves with the language id.
 switchTo(id){id=normalize(id)||'en';const doc=root.document;
  const done=()=>{setLang(id);const html=doc&&doc.documentElement;if(html){html.lang=lang;html.dir=isRTL()?'rtl':'ltr';if(html.dataset)html.dataset.lang=lang;}applyDom(doc);return lang;};
  if(dicts[id]||!doc||!doc.head)return Promise.resolve(done());
  return new Promise(res=>{const s=doc.createElement('script');s.src=base+id+'.js'+(q?'?'+q:'');s.onload=s.onerror=()=>res(done());doc.head.appendChild(s);});}};
root.MoonI18n=api;root._t=t;
if(typeof module==='object'&&module.exports){add('ru',require('./i18n/ru.js'));setLang('ru');module.exports=api;return;}
// ---- browser boot ----
const doc=root.document;if(!doc)return;
let saved='',pref='',param='';
try{const s=JSON.parse(root.localStorage.getItem(SAVE_KEY)||'null');saved=s&&typeof s.lang==='string'?s.lang:'';}catch{}
try{pref=root.localStorage.getItem(PREF_KEY)||'';}catch{}
try{param=new URLSearchParams(root.location.search).get('lang')||'';}catch{}
api.detected=detect();
api.firstRun=!normalize(saved)&&!normalize(pref)&&!normalize(param);
setLang(normalize(param)||normalize(saved)||normalize(pref)||api.detected);
const html=doc.documentElement;if(html){html.lang=lang;html.dir=isRTL()?'rtl':'ltr';if(html.dataset)html.dataset.lang=lang;}
const me=doc.currentScript,src=me?me.src:'i18n.js',q=(src.split('?')[1]||''),base=src.replace(/i18n\.js(\?.*)?$/,'i18n/');
if(doc.readyState==='loading'){for(const id of lang==='en'?['en']:['en',lang])doc.write('<script src="'+base+id+'.js'+(q?'?'+q:'')+'"><\/script>');}
})(typeof globalThis!=='undefined'?globalThis:this);
