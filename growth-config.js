/* MOONKATTY growth settings. Edit these lines when the bot, channel and server are ready.
   Empty values are safe: the game stays fully playable offline and the matching feature is hidden or shown as «скоро». */
window.MoonGrowthConfig=Object.assign({
 API_BASE:'',                     // address of the Cloudflare Worker, e.g. 'https://moonkatty-api.example.workers.dev'. Empty = offline mode (progress only on this device)
 BOT_USERNAME:'MoonkattyHorizonsBot',
 MINIAPP_SHORTNAME:'',            // short name from BotFather /newapp, e.g. 'play' → https://t.me/MoonkattyHorizonsBot/play?startapp=ref_<id>
 CHANNEL_USERNAME:'',             // channel username without @, e.g. 'moonkatty_official'. Empty = channel task hidden
 SOCIAL:{youtube:'',tiktok:'',instagram:'',x:''},  // full https:// links; empty = task hidden
 SHARE_STORY_IMAGE:'assets/share-story-v33.jpg',
 SHARE_CARD_IMAGE:'assets/share-card-v33.jpg'
},window.MoonGrowthConfig||{});
