/* v70 reliability: one global catcher for uncaught errors and promise rejections (queued on the phone, sent to the Crew server
   in small batches), a non-blocking "No connection — retry" bar while the server is unreachable (progress keeps saving locally and
   is uploaded when the link is back), and a full-screen retry when the game itself fails to load. Loaded right after i18n.js. */
(function(root){'use strict';
const Q_KEY='mk-err-q',P_KEY='mk-sync-pending',MAX_Q=12,BUILD='20261016-97a',T=(k,d)=>{try{const v=root._t?root._t(k):k;return v&&v!==k?v:d;}catch(e){return d;}};
let q=[];try{q=JSON.parse(localStorage.getItem(Q_KEY)||'[]');if(!Array.isArray(q))q=[];}catch(e){q=[];}
const seen=new Set(q.map(e=>e.msg+'|'+e.src));let sending=false,transport=null,bar=null,fatal=null,netDown=false,retryFn=null;
function store(){try{localStorage.setItem(Q_KEY,JSON.stringify(q.slice(-MAX_Q)));}catch(e){}}
const NOISE=/ResizeObserver loop|Script error\.?$|^Load failed$|NotAllowedError|play\(\) request was interrupted|AbortError/i;
function report(kind,msg,src,line,col,stack){msg=String(msg||'').slice(0,300);if(!msg||NOISE.test(msg))return;src=String(src||'').split('?')[0].slice(-160);const key=msg+'|'+src;if(seen.has(key))return;seen.add(key);
 let ch=0;try{ch=root.MoonGame&&MoonGame.state?MoonGame.state.chapter|0:0;}catch(e){}
 q.push({kind,msg,src,line:Number.isInteger(line)?line:0,col:Number.isInteger(col)?col:0,stack:String(stack||'').slice(0,600),build:BUILD,ch,at:Date.now()});if(q.length>MAX_Q)q=q.slice(-MAX_Q);store();setTimeout(flush,1500);}
root.addEventListener('error',e=>{if(e&&e.target&&e.target!==root&&(e.target.src||e.target.href)){return;}report('error',e.message||(e.error&&e.error.message),e.filename,e.lineno,e.colno,e.error&&e.error.stack);});
root.addEventListener('unhandledrejection',e=>{const r=e&&e.reason;if(r&&(r.message==='offline'||r.name==='AbortError'))return;report('promise',r&&r.message||String(r),r&&r.stack&&(/\/([\w.-]+\.js)/.exec(r.stack)||[])[1],0,0,r&&r.stack);});
async function flush(){if(sending||!transport||!q.length||netDown)return;sending=true;const batch=q.slice(0,5);
 try{await transport(batch.map(({kind,msg,src,line,build,ch})=>({kind,msg,src,line,build,ch})));q=q.slice(batch.length);store();}catch(e){}sending=false;if(q.length)setTimeout(flush,20000);}
setInterval(flush,60000);
// ---------- UI ----------
const css=`.mk-net{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 112px);width:min(360px,calc(100% - 20px));box-sizing:border-box;transform:translateX(-50%);z-index:9998;display:flex;align-items:center;gap:10px;max-width:calc(100% - 20px);padding:8px 10px 8px 14px;border-radius:14px;background:rgba(40,18,30,.92);border:1px solid rgba(255,140,140,.45);color:#ffe9e9;font:600 13px/1.25 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.35)}
.mk-net[hidden]{display:none}.mk-net>div{flex:1;min-width:0}.mk-net small{display:block;font-weight:500;opacity:.8;font-size:11.5px}.mk-net button{flex:none;border:0;border-radius:10px;padding:8px 12px;background:#ffd6a0;color:#3a1d0b;font:700 13px system-ui,sans-serif}
.mk-net.ok{background:rgba(14,52,40,.92);border-color:rgba(120,240,190,.5);color:#e4fff4}
.mk-fatal{position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:28px;text-align:center;background:radial-gradient(circle at 50% 30%,#123a55,#06121d 70%);color:#e9f6ff;font:500 15px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
.mk-fatal h2{margin:0;font-size:22px}.mk-fatal p{margin:0;max-width:320px;opacity:.85}.mk-fatal .mk-cat{font-size:54px}.mk-fatal button{border:0;border-radius:14px;padding:13px 26px;background:linear-gradient(180deg,#9ff0e4,#5cc9c0);color:#06232a;font:700 16px system-ui,sans-serif}`;
function style(){if(document.getElementById('mk-rel-css'))return;const s=document.createElement('style');s.id='mk-rel-css';s.textContent=css;document.head.appendChild(s);}
function showNet(down,pending){style();if(!bar){bar=document.createElement('div');bar.className='mk-net';bar.id='net-bar';bar.setAttribute('role','status');(document.getElementById('app-viewport')||document.body).appendChild(bar);}
 if(down){bar.className='mk-net';bar.innerHTML='';const t=document.createElement('div');t.innerHTML='';const b=document.createElement('b');b.textContent=T('net.offline_title','No connection');const sm=document.createElement('small');sm.textContent=pending?T('net.offline_pending','Progress is saved on this phone and will be sent when the connection is back.'):T('net.offline_text','You can keep playing — progress is saved on this phone.');t.append(b,sm);
  const btn=document.createElement('button');btn.type='button';btn.id='net-retry';btn.textContent=T('net.retry','Retry');btn.onclick=()=>{btn.disabled=true;btn.textContent='…';Promise.resolve(retryFn&&retryFn()).catch(()=>{}).finally(()=>{btn.disabled=false;btn.textContent=T('net.retry','Retry');});};bar.append(t,btn);bar.hidden=false;}
 else if(!bar.hidden&&bar.dataset.was==='down'){bar.className='mk-net ok';bar.textContent=T('net.back','Connection restored — progress sent');setTimeout(()=>{if(!netDown)bar.hidden=true;},2600);}
 else bar.hidden=true;bar.dataset.was=down?'down':'up';}
function setNet(down,pending){const was=netDown;netDown=!!down;if(down!==was||down)showNet(netDown,pending);if(!netDown)setTimeout(flush,800);}
function bootFail(why,force){if(fatal||!force&&root.MoonGame&&root.MoonGame.running)return;report('boot',why||'boot failed','',0,0,'');style();fatal=document.createElement('div');fatal.className='mk-fatal';fatal.id='boot-fail';fatal.setAttribute('role','alert');
 const c=document.createElement('div');c.className='mk-cat';c.textContent='🐱‍🚀';const h=document.createElement('h2');h.textContent=T('net.boot_title','The game did not load');const p=document.createElement('p');p.textContent=navigator.onLine===false?T('net.boot_offline','No internet connection. Check it and try again — your progress is safe.'):T('net.boot_text','Something went wrong while loading. Try again — your progress is safe.');
 const b=document.createElement('button');b.type='button';b.id='boot-retry';b.textContent=T('net.reload','Try again');b.onclick=()=>{try{location.reload();}catch(e){}};fatal.append(c,h,p,b);document.body.appendChild(fatal);}
root.addEventListener('offline',()=>setNet(true,pending()));root.addEventListener('online',()=>{if(retryFn)retryFn();else setNet(false);});
function pending(){try{return localStorage.getItem(P_KEY)==='1';}catch(e){return false;}}
function markPending(v){try{if(v)localStorage.setItem(P_KEY,'1');else localStorage.removeItem(P_KEY);}catch(e){}}
// v85 friendly network messages: the last server error is remembered by the API client (growth.js) and turned into plain words.
let lastErr=null;function noteErr(kind){lastErr={kind:String(kind||''),at:Date.now()};}
function netText(){const k=lastErr&&Date.now()-lastErr.at<60000?lastErr.kind:'';if(root.navigator&&root.navigator.onLine===false||k==='offline')return T('net.e_offline','No internet right now. Your progress is safe — try again when you are back online.');
 if(k==='timeout')return T('net.e_slow','The connection is very slow. We tried a few times — please try again in a moment.');if(k==='busy')return T('net.e_busy','Too many taps at once — wait a few seconds and try again.');
 if(k==='server')return T('net.e_server','Our server is taking a short break. Your progress is safe — try again in a minute.');return T('growth.net_svyazi','No connection to the server. Try again a bit later.');}
root.MoonReliability={report,flush,bootFail,setNet,pending,markPending,noteErr,netText,get down(){return netDown;},get queue(){return q.slice();},
 set transport(f){transport=f;setTimeout(flush,3000);},set retry(f){retryFn=f;},BUILD};
})(typeof window!=='undefined'?window:globalThis);
