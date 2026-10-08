/* Use the visible Telegram sheet, not the underlying full WebView, as the game viewport. */
(function(root){'use strict';
 const doc=root.document,el=doc.documentElement;let app=null;
 function sync(){const nativeHeight=Number(app?.viewportStableHeight||app?.viewportHeight),fallback=Number(root.visualViewport?.height||root.innerHeight),height=nativeHeight>0?nativeHeight:fallback;
  if(Number.isFinite(height)&&height>0){el.style.setProperty('--app-height',Math.round(height)+'px');el.dataset.shortViewport=height<560?'true':'false';}
 }
 function connect(){const next=root.Telegram?.WebApp;if(!next||next===app)return;app=next;app.onEvent?.('viewportChanged',event=>{if(event?.isStateStable!==false)sync();});sync();app.ready?.();app.expand?.();if(app.isVersionAtLeast?.('7.7'))app.disableVerticalSwipes?.();}
 sync();root.addEventListener('resize',sync);root.visualViewport?.addEventListener('resize',sync);doc.addEventListener('visibilitychange',()=>{if(!doc.hidden)sync();});connect();
 if(!app){const script=doc.createElement('script');script.src='https://telegram.org/js/telegram-web-app.js';script.async=true;script.onload=connect;script.onerror=sync;doc.head.append(script);}
})(globalThis);
