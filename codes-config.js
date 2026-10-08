/* «Код сигнала» — secret codes shown in MOONKATTY videos (YouTube / TikTok / channel posts).
   Only salted hashes are stored here, so the codes cannot be read from the game files.
   Add a code: node scripts/make-signal-code.cjs CODE crystals metal [until YYYY-MM-DD] [label] → paste the printed line below.
   Each code works once per player; `until` (optional, inclusive) ends it. */
window.MoonCodes=(window.MoonCodes||[]).concat([
 {"h":"2258741c2521c6413065b3cf","reward":{"crystals":5,"metal":5},"until":"2026-12-31","label":"Первое видео"},
 {"h":"07ec4f5fc385103eff866f06","reward":{"crystals":3,"metal":6},"label":"Кот на Луне"},
 {"h":"fa7f830d963ae6c0f317079c","reward":{"crystals":8,"metal":4},"label":"Девять жизней"}
]);
