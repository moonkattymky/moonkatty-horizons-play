/* MOONKATTY New Horizons · v44 offline shell (cold-open from cache).
   - Page (navigation): network first (3.5 s), cached copy when offline or the network hangs.
   - Versioned files (?v=build) and art in assets/: cache first, refreshed in the background.
   - Other origins (Telegram SDK, Crew server API) are never touched. A new build gets a new cache; old ones are dropped. */
const BUILD='20261009-45a',CACHE='mk-horizons-'+BUILD,PAGE='mk-horizons-page';
self.addEventListener('install',e=>{self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('mk-horizons-')&&k!==CACHE&&k!==PAGE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
function timeout(ms){return new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),ms));}
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==self.location.origin)return;
 const root=new URL(self.registration.scope).pathname;
 if(req.mode==='navigate'){if(url.pathname!==root&&url.pathname!==root+'index.html')return;e.respondWith((async()=>{const page=await caches.open(PAGE);
  try{const res=await Promise.race([fetch(req),timeout(3500)]);if(res&&res.ok)page.put('index',res.clone());return res;}
  catch(err){const hit=await page.match('index');if(hit)return hit;return fetch(req);}})());return;}
 if(url.pathname.endsWith('/sw.js'))return;
 e.respondWith((async()=>{const cache=await caches.open(CACHE),hit=await cache.match(req);
  const net=fetch(req).then(res=>{if(res&&res.ok&&res.type==='basic')cache.put(req,res.clone());return res;});
  if(hit){e.waitUntil(net.catch(()=>{}));return hit;}return net;})());});
