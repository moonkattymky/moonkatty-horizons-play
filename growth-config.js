/* MOONKATTY growth settings. Edit these lines when the bot, channel and server are ready.
   Empty values are safe: the game stays fully playable offline and the matching feature is hidden or shown as “soon”. */
window.MoonGrowthConfig=Object.assign({
 API_BASE:'',                     // address of the Cloudflare Worker, e.g. 'https://moonkatty-api.example.workers.dev'. Empty = offline mode (progress only on this device)
 BOT_USERNAME:'MoonkattyHorizonsBot',
 DEMO_URL:'https://moonkattymky.github.io/moonkatty-horizons-play/',  // public story demo; used for «Share» / invite links while the server and short name are not set
 MINIAPP_SHORTNAME:'',            // short name from BotFather /newapp, e.g. 'play' → https://t.me/MoonkattyHorizonsBot/play?startapp=ref_<id>
 CHANNEL_USERNAME:'moonkattymkty',             // channel username without @, e.g. 'moonkattymkty'. Empty = channel task hidden
 CHAT_USERNAME:'moonkattymkty_chat',  // community chat username without @. Empty = chat task hidden
 SOCIAL:{youtube:'https://www.youtube.com/@moonkattymky',tiktok:'https://www.tiktok.com/@moonkattymky',instagram:'https://www.instagram.com/moonkattymky/',x:'https://x.com/moonkattymky'},  // full https:// links; empty = task hidden
 SHARE_STORY_IMAGE:'assets/share/story-{lang}.jpg',
 SHARE_CARD_IMAGE:'assets/share/card-{lang}.jpg'
},window.MoonGrowthConfig||{});
