/* v48 AdsGram Task block inside «Задания» (tasks dialog): a partner task (subscribe to a channel / open an app).
   The reward (small Moon Points, daily cap) is paid ONLY by the server when AdsGram calls the Reward URL
   (/api/ads/reward?type=task&userid=[userId]&key=…); the client never grants anything, it just re-reads the balance.
   Hidden outside Telegram, offline, when the server key is missing, after the daily cap or when AdsGram has no task. */
(function(){'use strict';
const UI=window.MoonGrowthUI,cfg=window.MoonGrowthConfig||{};if(!UI||typeof document==='undefined')return;
const tg=()=>window.Telegram?.WebApp||null,toast=t=>window.MoonGame?.toast?.(t);
let row=null,noFill=false,wired=false;
function info(){const d=window.MoonDailyMap?.data;return d&&d.ads&&d.ads.task||null;}
function available(){const t=info();return!!(cfg.ADS_TASK_BLOCK_ID&&tg()&&UI.online&&t&&t.enabled&&t.left>0&&!noFill);}
function build(){const t=info()||{points:5,left:0};row=document.createElement('div');row.className='task-row ad-task-row';row.id='ad-task-row';
 row.innerHTML=`<div class="adt-head"><b>${_t('adtask.title')}</b><small class="adt-left"></small></div>`;
 const el=document.createElement('adsgram-task');el.setAttribute('block-id',String(cfg.ADS_TASK_BLOCK_ID));el.setAttribute('data-block-id',String(cfg.ADS_TASK_BLOCK_ID));el.className='mk-adtask';
 el.innerHTML=`<span slot="reward" class="adt-reward">+${t.points} Moon Points</span><button slot="button" type="button" class="tr-btn gold adt-btn">${_t('adtask.go')}</button><span slot="claim" class="tr-btn adt-claim">${_t('adtask.claim')}</span><span slot="done" class="adt-done">✓ ${_t('adtask.done')}</span>`;
 el.addEventListener('reward',onReward);for(const ev of['onBannerNotFound','onError','onTooLongSession'])el.addEventListener(ev,()=>{noFill=true;sync();});
 row.append(el);return row;}
function onReward(){toast(_t('adtask.wait'));const again=n=>setTimeout(async()=>{try{await UI.api('/api/moon',{});}catch{}try{await window.MoonDailyMap?.refresh?.();}catch{}if(n<2)again(n+1);},n?6000:2500);again(0);}
async function ensureSdk(){try{await window.MoonDailyMap?.sdk?.();return true;}catch{noFill=true;return false;}}
async function sync(){const d=document.getElementById('tasks');if(!d)return;const list=d.querySelector('.task-list');
 if(!available()||!list){if(row&&row.parentNode)row.remove();return;}
 if(!row){if(!await ensureSdk())return;build();}
 const t=info();row.querySelector('.adt-left').textContent=_t('adtask.left',{n:t.left,p:t.points});
 if(row.parentNode!==list)list.append(row);}
function wire(){const d=document.getElementById('tasks');if(!d||wired)return;wired=true;new MutationObserver(()=>{if(!row||!d.contains(row))sync();}).observe(d,{childList:true});sync();}
setInterval(()=>{wire();if(document.getElementById('tasks')?.open)sync();},1500);
window.MoonAdTask={sync,available,get row(){return row;},_reward:onReward};
})();
