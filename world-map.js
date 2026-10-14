/* v75 illustrated world map: a painted lunar map (ground, craters, mountain ridges, glowing crystals, Earth on the horizon),
   a small illustrated icon for every place, visited places glow gold, unvisited ones sit under a light fog that clears on
   the first visit (state.mapSeen, saved with the game), the player is a golden paw, a dotted path leads to the next goal.
   Pure SVG built from a fixed seed, so it costs one string and no image download. game.js calls MoonWorldMap.svg(). */
(function(root){'use strict';
const VB=[-90,-92,180,176],SEEN_R=16;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
function rng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
const f1=v=>Math.round(v*10)/10;
// ---------- background art (built once) ----------
let ART=null;
function art(){if(ART)return ART;const R=rng(75),o=[];
 o.push(`<rect x="-90" y="-92" width="180" height="176" rx="9" fill="url(#mkGround)"/>`);
 // speckle texture
 for(let i=0;i<260;i++){const x=-88+R()*176,y=-90+R()*172;o.push(`<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(.25+R()*.6)}" fill="${R()<.5?'#ffffff':'#120e22'}" opacity="${f1(.05+R()*.12)}"/>`);}
 // soft maria (darker plains)
 for(const[x,y,rx,ry]of[[-40,30,30,18],[30,-50,26,14],[50,40,20,15],[-60,-40,18,12]])o.push(`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#1a1630" opacity=".35"/>`);
 // craters: dark bowl, lit rim (light from the upper left), shadow rim
 const crater=(x,y,r)=>`<g transform="translate(${f1(x)} ${f1(y)})"><ellipse rx="${f1(r*1.08)}" ry="${f1(r)}" fill="url(#mkCrater)"/><path d="M${f1(-r)} 0A${f1(r*1.08)} ${f1(r)} 0 0 1 ${f1(r)} 0" fill="none" stroke="#d9d2f0" stroke-width="${f1(Math.max(.35,r*.09))}" opacity=".55" transform="rotate(-25)"/><path d="M${f1(r)} 0A${f1(r*1.08)} ${f1(r)} 0 0 1 ${f1(-r)} 0" fill="none" stroke="#0c0a18" stroke-width="${f1(Math.max(.3,r*.07))}" opacity=".6" transform="rotate(-25)"/></g>`;
 for(const[x,y,r]of[[-56,-12,13],[-25,55,7],[-55,-50,9],[18,-72,5],[70,-60,6],[-75,62,6],[38,70,5],[-8,-30,4]])o.push(crater(x,y,r));
 for(let i=0;i<26;i++)o.push(crater(-84+R()*168,-86+R()*164,1.2+R()*3.2));
 // mountain ridges: light face + shadow face, a few snow tips
 const peak=(x,y,w,h,ice)=>`<path d="M${f1(x-w)} ${f1(y)}L${f1(x)} ${f1(y-h)}L${f1(x+w)} ${f1(y)}Z" fill="${ice?'#8fb4d8':'#5a5078'}"/><path d="M${f1(x)} ${f1(y-h)}L${f1(x+w)} ${f1(y)}L${f1(x+w*.15)} ${f1(y)}Z" fill="${ice?'#56789e':'#3a3254'}"/>${ice||h>7?`<path d="M${f1(x-w*.28)} ${f1(y-h*.72)}L${f1(x)} ${f1(y-h)}L${f1(x+w*.28)} ${f1(y-h*.72)}L${f1(x+w*.08)} ${f1(y-h*.64)}Z" fill="#eef4ff" opacity=".9"/>`:''}`;
 const range=(x0,y0,x1,y1,n,hmin,hmax,ice,seed)=>{const q=rng(seed);let s='';for(let i=0;i<n;i++){const t=i/(n-1),x=x0+(x1-x0)*t+(q()-.5)*3,y=y0+(y1-y0)*t+(q()-.5)*2;s+=peak(x,y,3+q()*3,hmin+q()*(hmax-hmin),ice);}return s;};
 o.push(range(-86,-78,-40,-86,7,4,9,false,1),range(46,80,86,70,6,4,8,false,2),range(-86,20,-80,80,6,4,8,false,3),range(80,-30,86,30,5,4,7,false,4));
 o.push(range(-8,75,16,74,6,6,10,true,5));                                   // the ice ridge round the frozen camp
 o.push(`<path d="M-35 20L-31 12H-21L-17 20Z" fill="#7d6aa6"/><path d="M-31 12H-21L-22 13.5H-30Z" fill="#b7a6e0"/><path d="M-21 12L-17 20H-20Z" fill="#4b3d70"/>`);   // sky mesa
 o.push(`<ellipse cx="42" cy="-14" rx="10" ry="5" fill="#4a426a"/><ellipse cx="41" cy="-15.5" rx="7" ry="3" fill="#62588a"/>`);   // observatory hill
 // glowing crystal clusters
 const cry=(x,y,s,c)=>`<g transform="translate(${f1(x)} ${f1(y)}) scale(${f1(s)})" filter="url(#mkGlow)"><path d="M0 0L-1.1-2.6L0-5.2L1.1-2.6Z" fill="${c}"/><path d="M1.4 .4L.7-1.6L1.6-3.4L2.4-1.5Z" fill="${c}" opacity=".85"/><path d="M-1.5 .4L-2.3-1.2L-1.7-2.8L-.9-1.3Z" fill="${c}" opacity=".8"/></g>`;
 for(const[x,y,s,c]of[[69,10,1.2,'#b18cff'],[60,-24,1,'#7ef0ff'],[64,36,1.1,'#ffbf6a'],[-50,-6,1,'#b18cff'],[-62,58,.9,'#ffd36a'],[12,-58,.8,'#7ef0ff'],[-18,-40,.7,'#b18cff'],[30,22,.7,'#7ef0ff'],[-72,-70,.8,'#ffbf6a'],[78,-80,.7,'#b18cff']])o.push(cry(x,y,s,c));
 // Earth over the horizon (top right) with clouds and a soft atmosphere
 o.push(`<g transform="translate(70 -76)"><circle r="17" fill="#6fd3ff" opacity=".18"/><circle r="13.5" fill="url(#mkEarth)"/><path d="M-6-6c3-2 6-1 7 2s-2 5-5 4-4-3-2-6zM2 3c3 0 6 2 5 5s-5 2-6 0 0-5 1-5zM-10 2c2 1 2 4 0 5s-3-2-2-3z" fill="#5fc27a" opacity=".9"/><path d="M-11-3c4-2 8-2 12 0M-4 7c4 1 8 0 11-3M-2-10c3-1 6 0 8 2" fill="none" stroke="#fff" stroke-width="1.1" stroke-linecap="round" opacity=".7"/><path d="M-13.5 0A13.5 13.5 0 0 0 13.5 0A13.5 9 0 0 1-13.5 0" fill="#06101e" opacity=".35"/></g>`);
 // compass rose
 o.push(`<g transform="translate(-79 72)" opacity=".85"><circle r="6" fill="#0d0b1c" opacity=".55" stroke="#e9c67a" stroke-width=".4"/><path d="M0-5L1.4 0L0 1.2L-1.4 0Z" fill="#ffd36a"/><path d="M0 5L1.4 0L0-1.2L-1.4 0Z" fill="#6a6290"/><text y="-6.8" text-anchor="middle" font-size="3.4" fill="#ffd98c" font-weight="700">N</text></g>`);
 return ART=o.join('');}
const DEFS=`<defs><radialGradient id="mkGround" cx="45%" cy="40%" r="75%"><stop offset="0" stop-color="#5b5178"/><stop offset=".55" stop-color="#3b3456"/><stop offset="1" stop-color="#1c1730"/></radialGradient>
<radialGradient id="mkCrater" cx="58%" cy="60%" r="60%"><stop offset="0" stop-color="#211b36"/><stop offset=".75" stop-color="#2d2646"/><stop offset="1" stop-color="#5d5480"/></radialGradient>
<radialGradient id="mkEarth" cx="35%" cy="35%" r="70%"><stop offset="0" stop-color="#8fe6ff"/><stop offset=".6" stop-color="#2f86d8"/><stop offset="1" stop-color="#123a7a"/></radialGradient>
<radialGradient id="mkHole"><stop offset=".45" stop-color="#000"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
<radialGradient id="mkGold"><stop offset="0" stop-color="#ffe7a0" stop-opacity=".95"/><stop offset=".5" stop-color="#ffc24a" stop-opacity=".45"/><stop offset="1" stop-color="#ffb02a" stop-opacity="0"/></radialGradient>
<filter id="mkGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation=".9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="mkFogBlur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5"/></filter></defs>`;
// ---------- place icons (about 8 units, drawn round 0,0) ----------
const IC={
 base:`<path d="M-4.6 1.6A4.6 4.6 0 0 1 4.6 1.6Z" fill="#f4efe2"/><rect x="-5" y="1.4" width="10" height="1.4" rx=".5" fill="#c9a05a"/><rect x="-1" y="-1.6" width="2" height="3" fill="#ffcf6a"/><path d="M3 -2.2V-6.4L6 -5.4L3 -4.6" fill="#ff7aa8" stroke="#fff" stroke-width=".3"/>`,
 crater:`<ellipse rx="4.6" ry="3.4" fill="#2a2342"/><path d="M-4.6 0A4.6 3.4 0 0 1 4.6 0" fill="none" stroke="#e0d8f6" stroke-width=".8"/><circle cx="1.6" cy=".8" r=".9" fill="#7ef0ff"/>`,
 valley:`<path d="M-5 2L-2.4-3L0 1L2.4-4L5 2Z" fill="#7266a0"/><path d="M-1.2 2.4L-.4-1.8L.4 2.4ZM1 2.4L1.8-.6L2.6 2.4Z" fill="#7ef0ff"/>`,
 research:`<rect x="-.5" y="-1" width="1" height="4" fill="#cfd6e8"/><path d="M-4.4-1.8A4.4 4.4 0 0 0 3 2.4Z" fill="#eef2fb"/><circle cx="-.8" cy=".2" r=".7" fill="#ffd36a"/><rect x="-3" y="3" width="6" height="1.2" rx=".4" fill="#8a7fb0"/>`,
 pad:`<path d="M0-6C2.2-4 2.4-1 2 2.4H-2C-2.4-1-2.2-4 0-6Z" fill="#f6f2ff"/><circle cy="-1.8" r=".9" fill="#5fd6e0"/><path d="M-2 .8L-3.6 3.4H-1.6ZM2 .8L3.6 3.4H1.6Z" fill="#ff7aa8"/><path d="M-1 2.6L0 5L1 2.6Z" fill="#ffb24a"/>`,
 wreck:`<path d="M-5 2.6L-1.4-2.4L1.6-.4L5 2.6Z" fill="#9aa3b8"/><path d="M-1.4-2.4L.4-4.6L1.6-.4Z" fill="#c4cbe0"/><circle cx="2.6" cy="-3.4" r=".8" fill="#ffb24a"/>`,
 cave:`<path d="M-5 3A5 6.4 0 0 1 5 3Z" fill="#5a5078"/><path d="M-2.2 3A2.2 3 0 0 1 2.2 3Z" fill="#151026"/><path d="M-.6 3L0 .8L.6 3Z" fill="#b18cff"/>`,
 hangar:`<path d="M-5 3V-.6A5 3.8 0 0 1 5-.6V3Z" fill="#a3acc2"/><rect x="-2.2" y="-.2" width="4.4" height="3.2" fill="#2a2440"/><path d="M-2.2 .9H2.2M-2.2 2H2.2" stroke="#6a7290" stroke-width=".35"/>`,
 forge:`<circle cy="-1.4" r="2.6" fill="#ffcf4a"/><g stroke="#ffcf4a" stroke-width=".7" stroke-linecap="round"><path d="M0-5.6V-4.8M-3.6-4.2L-3-3.6M3.6-4.2L3-3.6M-4.4-1.4H-3.6M4.4-1.4H3.6"/></g><path d="M-4 3.4H4L2.6 1.2H-2.6Z" fill="#6d5a8c"/><path d="M-1 1.2C-1.6 0-.4-.6 0-1.6C.6-.4 1.4.2.8 1.2Z" fill="#ff7a3a"/>`,
 depths:`<ellipse rx="5" ry="3" fill="#1b1530"/><ellipse rx="3.4" ry="1.8" fill="#2b2050"/><path d="M-1 .8L-.4-2L.2.8ZM.6.8L1.2-1L1.8.8Z" fill="#b18cff"/>`,
 lost:`<path d="M-5.4 3L-2.6-3.2L0 1L2.6-4.6L5.4 3Z" fill="#a9cdf0"/><path d="M2.6-4.6L5.4 3H3.4Z" fill="#6d93bd"/><path d="M-3.4 3.2L-2 1.2L-.6 3.2Z" fill="#ffcf6a"/>`,
 gate:`<path d="M-5 3.4L-3.6-.4H3.6L5 3.4Z" fill="#7d6aa6"/><ellipse cy="-3" rx="3" ry="2.6" fill="none" stroke="#7ef0ff" stroke-width="1"/><ellipse cy="-3" rx="1.6" ry="1.4" fill="#d9fbff" opacity=".7"/>`,
 obs:`<path d="M-4.2 1.2A4.2 4.2 0 0 1 4.2 1.2Z" fill="#eef2fb"/><rect x="-.6" y="-3.4" width="1.2" height="2.6" fill="#2b2a48" transform="rotate(30)"/><rect x="-4.6" y="1.2" width="9.2" height="2" rx=".6" fill="#8a7fb0"/><circle cx="3.4" cy="-4.4" r=".7" fill="#fff6c8"/>`,
 district_gold:`<path d="M-4.6 3.2V-.8L-2.4-2.6L-.2-.8V3.2Z" fill="#ffcf6a"/><path d="M0 3.2V-2.6L2.2-4.6L4.4-2.6V3.2Z" fill="#ffe08a"/><circle cx="2.2" cy="-1.4" r=".6" fill="#7a5a14"/>`,
 district_crystal:`<path d="M0-5L-2.4-.6L0 3.4L2.4-.6Z" fill="#ffbf6a"/><path d="M-3.4 3.4L-4.2.6L-2.6-1.2L-1.8 1.4ZM3.4 3.4L4.2.6L2.6-1.2L1.8 1.4Z" fill="#ffd9a0"/>`,
 district_anomaly:`<circle r="4.2" fill="#2a1f48"/><path d="M-3.2 0A3.2 3.2 0 1 0 0-3.2" fill="none" stroke="#c48cff" stroke-width=".9"/><circle r="1.2" fill="#f1d6ff"/>`,
 home:`<path d="M-4.4 3.4V-.4L0-4.2L4.4-.4V3.4Z" fill="#ffd8ea"/><path d="M-5.2 0L0-4.8L5.2 0" fill="none" stroke="#ff7aa8" stroke-width="1"/><g fill="#c98a2a"><ellipse cy="1.6" rx="1.3" ry="1"/><circle cx="-1.3" cy="-.1" r=".45"/><circle cx="-.45" cy="-.7" r=".45"/><circle cx=".45" cy="-.7" r=".45"/><circle cx="1.3" cy="-.1" r=".45"/></g>`};
const paw=(fill)=>`<ellipse cy="1.5" rx="2.6" ry="2.1" fill="${fill}"/><ellipse cx="-2.7" cy="-1.5" rx=".95" ry="1.2" fill="${fill}"/><ellipse cx="-.95" cy="-2.9" rx=".95" ry="1.25" fill="${fill}"/><ellipse cx=".95" cy="-2.9" rx=".95" ry="1.25" fill="${fill}"/><ellipse cx="2.7" cy="-1.5" rx=".95" ry="1.2" fill="${fill}"/>`;
// ---------- visited places ----------
function allPlaces(state){const C=root.MoonCore||{},list=[{id:'base',x:0,z:-5}];for(const k of['REGIONS','REGIONS4','REGIONS5','REGIONS6','REGIONS7','REGIONS8','REGIONS9'])for(const r of C[k]||[])list.push({id:r.id,x:r.x,z:r.z});
 if(C.districtRegions)try{for(const r of C.districtRegions(state))list.push({id:r.id,x:r.x,z:r.z});}catch(e){}return list;}
function seenList(state){if(!Array.isArray(state.mapSeen))state.mapSeen=['base'];return state.mapSeen;}
function visit(state,x,z){if(!state)return false;const seen=seenList(state);let ch=false;for(const r of allPlaces(state))if(!seen.includes(r.id)&&Math.hypot(x-r.x,z-r.z)<SEEN_R){seen.push(r.id);ch=true;}return ch;}
// ---------- the map ----------
function iconKey(id){return IC[id]?id:/^district_/.test(id)?(IC[id]?id:'district_gold'):'crater';}
function svg(state,player,regions,target,label){const seen=seenList(state),o=[];const px=f1(player.x),pz=f1(player.z);
 o.push(`<svg class="mk-map" viewBox="${VB.join(' ')}" role="img" aria-label="${esc(label||'')}">${DEFS}${art()}`);
 // fog: soft cloud banks over the whole map, holes around visited places and round the player
 o.push(`<mask id="mkFogMask"><rect x="-90" y="-92" width="180" height="176" fill="#fff"/>`);for(const r of regions)if(seen.includes(r.id))o.push(`<circle cx="${f1(r.x)}" cy="${f1(r.z)}" r="26" fill="url(#mkHole)"/>`);o.push(`<circle cx="${px}" cy="${pz}" r="18" fill="url(#mkHole)"/></mask>`);
 const F=rng(9);o.push(`<g mask="url(#mkFogMask)" class="mk-fog"><g filter="url(#mkFogBlur)" opacity=".42">`);for(let i=0;i<34;i++)o.push(`<ellipse cx="${f1(-88+F()*176)}" cy="${f1(-90+F()*172)}" rx="${f1(14+F()*16)}" ry="${f1(7+F()*8)}" fill="#cdd3ec"/>`);o.push(`</g><rect x="-90" y="-92" width="180" height="176" fill="#c9cfe8" opacity=".1"/></g>`);
 // dotted path to the next goal
 if(target&&isFinite(target.x)&&isFinite(target.z)&&Math.hypot(target.x-player.x,target.z-player.z)>6){const tx=f1(target.x),tz=f1(target.z),mx=(player.x+target.x)/2,mz=(player.z+target.z)/2,dx=target.x-player.x,dz=target.z-player.z,len=Math.hypot(dx,dz)||1,cx=f1(mx-dz/len*Math.min(14,len*.18)),cz=f1(mz+dx/len*Math.min(14,len*.18));
  {const P=[],qx=(t,a,b,c)=>(1-t)*(1-t)*a+2*(1-t)*t*b+t*t*c,n=Math.max(3,Math.round(len/4.2));for(let k=1;k<n;k++){const t=k/n;P.push([f1(qx(t,player.x,+cx,target.x)),f1(qx(t,player.z,+cz,target.z))]);}
   o.push(`<g class="mk-route" data-d="M${px} ${pz}Q${cx} ${cz} ${tx} ${tz}">`+P.map(([x,z],k)=>`<circle cx="${x}" cy="${z}" r="1.75" fill="#2a1a05" opacity=".6"/><circle cx="${x}" cy="${z}" r="1.15" fill="#ffd36a"><animate attributeName="opacity" values="1;.35;1" dur="1.4s" begin="${f1(k*.12)}s" repeatCount="indefinite"/></circle>`).join('')+'</g>');}
  o.push(`<g transform="translate(${tx} ${tz})"><circle r="3.4" fill="none" stroke="#ffd36a" stroke-width=".7"><animate attributeName="r" values="2.6;4.6;2.6" dur="1.6s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;.3;1" dur="1.6s" repeatCount="indefinite"/></circle><path d="M0-1V-7L4-5.6L0-4.2" fill="#ffd36a" stroke="#6a4a12" stroke-width=".3"/></g>`);}
 // places
 for(const r of regions){const v=seen.includes(r.id),x=f1(r.x),z=f1(r.z),k=iconKey(r.id);
  o.push(`<g class="mk-place ${v?'seen':'fog'}" data-region="${esc(r.id)}" transform="translate(${x} ${z})">`+(v?`<circle r="11" fill="url(#mkGold)"/>`:'')+`<circle r="7.2" fill="${v?'#2a1f12':'#2c2a40'}" stroke="${v?'#ffd36a':'#9aa3c0'}" stroke-width="${v?.9:.5}" opacity="${v?1:.85}"/><g transform="scale(1.08)" opacity="${v?1:.6}"${v?'':' filter="grayscale(1)"'}>${IC[k]}</g>`+
   `<text y="-9.6" text-anchor="middle" font-size="4.3" font-weight="700" fill="${v?'#ffe9b0':'#d8deef'}" stroke="#120e22" stroke-width="1.1" paint-order="stroke" opacity="${v?1:.85}">${esc(r.name)}</text></g>`);}
 // the player: a golden paw with a pulse
 o.push(`<g class="mk-me" transform="translate(${px} ${pz})"><circle r="5" fill="none" stroke="#ffd36a" stroke-width=".8"><animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values=".9;0;.9" dur="2s" repeatCount="indefinite"/></circle><circle r="5.4" fill="#2a1a05" opacity=".55"/><g filter="url(#mkGlow)">${paw('#ffcf4a')}</g></g>`);
 return o.join('')+'</svg>';}
// mark places as visited while playing (once a second, cheap)
let lastSave=0;if(typeof setInterval!=='undefined'){const iv=setInterval(()=>{const G=root.MoonGame;if(!G||!G.running||!G.state||!G.player)return;if(visit(G.state,G.player.x,G.player.z)&&Date.now()-lastSave>3000){lastSave=Date.now();try{G.save();}catch(e){}}},1000);if(iv&&iv.unref)iv.unref();}
root.MoonWorldMap={svg,visit,allPlaces,seenList,ICONS:Object.keys(IC),SEEN_R};
})(typeof window!=='undefined'?window:globalThis);
