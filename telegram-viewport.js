/* Use the visible Telegram sheet, not the underlying full WebView, as the game viewport.
   v52: ready + expand on launch, requestFullscreen on Bot API 8.0+, Telegram safe areas exposed as CSS vars
   (--tg-safe-top = device safe area + Telegram content safe area, i.e. clear of the notch and the Close/menu buttons). */
(function(root){'use strict';
 const doc=root.document,el=doc.documentElement;let app=null;
 function insets(){const a=app?.safeAreaInset||{},c=app?.contentSafeAreaInset||{},n=v=>Math.max(0,Number(v)||0);
  const top=n(a.top)+n(c.top),bottom=n(a.bottom)+n(c.bottom);el.style.setProperty('--tg-safe-top',top+'px');el.style.setProperty('--tg-safe-bottom',bottom+'px');
  el.dataset.tgFullscreen=app?.isFullscreen?'true':'false';}
 function sync(){const nativeHeight=Number(app?.viewportStableHeight||app?.viewportHeight),fallback=Number(root.visualViewport?.height||root.innerHeight),height=nativeHeight>0?nativeHeight:fallback;
  if(Number.isFinite(height)&&height>0){el.style.setProperty('--app-height',Math.round(height)+'px');el.dataset.shortViewport=height<560?'true':'false';}
  insets();}
 function connect(){const next=root.Telegram?.WebApp;if(!next||next===app)return;app=next;
  app.onEvent?.('viewportChanged',event=>{if(event?.isStateStable!==false)sync();});
  for(const e of['safeAreaChanged','contentSafeAreaChanged','fullscreenChanged'])app.onEvent?.(e,sync);
  app.onEvent?.('fullscreenFailed',()=>{try{app.expand?.();}catch(e){}sync();});
  sync();try{app.ready?.();}catch(e){}try{app.expand?.();}catch(e){}
  if(app.isVersionAtLeast?.('7.7'))try{app.disableVerticalSwipes?.();}catch(e){}
  const mobile=/^(ios|android)$/.test(String(app.platform||''));
  if(mobile&&app.isVersionAtLeast?.('8.0')&&!app.isFullscreen&&typeof app.requestFullscreen==='function')try{app.requestFullscreen();}catch(e){}
  root.setTimeout?.(sync,350);}
 sync();root.addEventListener('resize',sync);root.visualViewport?.addEventListener('resize',sync);doc.addEventListener('visibilitychange',()=>{if(!doc.hidden)sync();});connect();
 if(!app){const script=doc.createElement('script');script.src='https://telegram.org/js/telegram-web-app.js';script.async=true;script.onload=connect;script.onerror=sync;doc.head.append(script);}
 root.MoonTelegramViewport={sync,get app(){return app;}};
})(globalThis);
