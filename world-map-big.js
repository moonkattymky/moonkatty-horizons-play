/* v99 big-world map: inside the classic area the illustrated map stays as it was, with a small overview of the whole
   800 m world in the corner; out in the far lands the map zooms out to the whole world (landmarks, crystal fields,
   the classic area as an inset, the golden paw). Pure SVG, built from the same seeded data as the 3D world. */
(function(root){'use strict';
const M=root.MoonWorldMap;if(!M||!M.svg)return;const base=M.svg,f1=v=>Math.round(v*10)/10;
const W=400,COLV='#b18cff',COLC='#7ef0ff';
let ART=null;
function icon(t,s){const c=t==='geode'||t==='beacon'?COLC:COLV;switch(t){
 case'obelisk':return`<path d="M0${-9*s}L${3*s} 0L0${2*s}L${-3*s} 0Z" fill="${c}" filter="url(#mkBigGlow)"/>`;
 case'arch':return`<path d="M${-7*s} ${3*s}V${-5*s}H${7*s}V${3*s}H${4*s}V${-2*s}H${-4*s}V${3*s}Z" fill="#8c84aa"/>`;
 case'stones':return`<g fill="#8c84aa">${[0,1,2,3,4,5].map(k=>`<circle cx="${f1(Math.cos(k*1.047)*6*s)}" cy="${f1(Math.sin(k*1.047)*6*s)}" r="${f1(1.5*s)}"/>`).join('')}<circle r="${f1(1.4*s)}" fill="${COLC}"/></g>`;
 case'beacon':return`<rect x="${-1.2*s}" y="${-9*s}" width="${2.4*s}" height="${10*s}" fill="#8c84aa"/><circle cy="${-10*s}" r="${2.6*s}" fill="#ffbf6a" filter="url(#mkBigGlow)"/>`;
 case'geode':return`<circle r="${6*s}" fill="#1a3a58"/><circle r="${3.6*s}" fill="${COLC}" filter="url(#mkBigGlow)"/>`;
 default:return`<circle r="${4*s}" fill="${c}"/>`;}}
function art(){if(ART)return ART;const O=root.MoonOuterWorld,C=root.MoonCore,o=[];
 o.push(`<defs><radialGradient id="mkBigGround" cx="50%" cy="50%" r="70%"><stop offset="0" stop-color="#5b5470"/><stop offset=".7" stop-color="#3f3a55"/><stop offset="1" stop-color="#26223a"/></radialGradient><filter id="mkBigGlow" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`);
 o.push(`<rect x="-410" y="-410" width="820" height="820" rx="26" fill="#14111f"/><rect x="${-W}" y="${-W}" width="${2*W}" height="${2*W}" rx="18" fill="url(#mkBigGround)" stroke="#8c84aa" stroke-width="3" stroke-dasharray="10 6"/>`);
 if(O){for(let i=0;i<O.N;i++)for(let j=0;j<O.N;j++){const c=O.chunkContent(i,j,1);let k=0;for(const t of c.it)if((t[0]==='cryV'||t[0]==='cryC')&&(k++)%8===0)o.push(`<circle cx="${f1(t[1])}" cy="${f1(t[2])}" r="3.2" fill="${t[0]==='cryV'?COLV:COLC}" opacity=".6"/>`);}
  for(const m of O.minis())o.push(`<g transform="translate(${f1(m.x)} ${f1(m.z)})" opacity=".95">${icon(m.t,1.1)}</g>`);}
 for(const U of ((C&&C.RUINS)||[])){o.push(`<g transform="translate(${U.x} ${U.z}) rotate(45)"><rect x="-7" y="-7" width="14" height="14" fill="#3a3550" stroke="#f0b26a" stroke-width="3"/></g>`);}
for(const L of(C&&C.LANDMARKS)||[]){if(L.id==='bigCrater')o.push(`<g transform="translate(${L.x} ${L.z})"><circle r="${L.r}" fill="#1e1a30" stroke="#d9d2f0" stroke-width="3" opacity=".9"/><circle r="10" fill="${COLV}" filter="url(#mkBigGlow)"/></g>`);
  else if(L.id==='mesa')o.push(`<g transform="translate(${L.x} ${L.z})"><circle r="${L.r}" fill="#7d6aa6" stroke="#b7a6e0" stroke-width="3"/></g>`);
  else if(L.id==='spireField')o.push(`<g transform="translate(${L.x} ${L.z})">${icon('obelisk',2.6)}${icon('obelisk',1.4).replace('<path','<path transform="translate(14 6)"')}</g>`);
  else if(L.id==='ridgeGate')o.push(`<g transform="translate(${L.x} ${L.z})">${icon('arch',2.4)}</g>`);}
 ART=o.join('');return ART;}
function big(state,player,regions,target,label){const inner=base(state,player,regions,target,label).replace('<svg class="mk-map" viewBox=','<svg x="-90" y="-92" width="180" height="176" viewBox=');const px=f1(player.x),pz=f1(player.z);
 return`<svg class="mk-map mk-map-big" viewBox="-410 -410 820 820" role="img" aria-label="${String(label||'').replace(/[&<>"']/g,'')}">${art()}<rect x="-92" y="-94" width="184" height="180" rx="10" fill="none" stroke="#ffd36a" stroke-width="2.4"/>${inner}`+
  `<g transform="translate(${px} ${pz})"><circle r="16" fill="none" stroke="#ffd36a" stroke-width="2.4"><animate attributeName="r" values="12;24;12" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values=".9;0;.9" dur="2s" repeatCount="indefinite"/></circle><circle r="13" fill="#2a1a05" opacity=".6"/><g transform="scale(2.6)"><ellipse cy="1.5" rx="2.6" ry="2.1" fill="#ffcf4a"/><ellipse cx="-2.7" cy="-1.5" rx=".95" ry="1.2" fill="#ffcf4a"/><ellipse cx="-.95" cy="-2.9" rx=".95" ry="1.25" fill="#ffcf4a"/><ellipse cx=".95" cy="-2.9" rx=".95" ry="1.25" fill="#ffcf4a"/><ellipse cx="2.7" cy="-1.5" rx=".95" ry="1.2" fill="#ffcf4a"/></g></g></svg>`;}
function inset(player){const s=36/820,px=f1(player.x*s),pz=f1(player.z*s);return`<g class="mk-overview" transform="translate(66 -50)" opacity=".92"><rect x="-19" y="-19" width="38" height="38" rx="3" fill="#14111f" stroke="#8c84aa" stroke-width=".5"/><g transform="scale(${f1(s*1000)/1000})">${art().replace(/<defs>.*?<\/defs>/,'')}</g><rect x="${f1(-90*s)}" y="${f1(-92*s)}" width="${f1(180*s)}" height="${f1(176*s)}" fill="none" stroke="#ffd36a" stroke-width=".5"/><circle cx="${px}" cy="${pz}" r="1.3" fill="#ffcf4a"/></g>`;}
M.svg=function(state,player,regions,target,label){const p=player||{x:0,z:0};if(Math.abs(p.x)>92||p.z>88||p.z<-94)return big(state,p,regions,target,label);const s=base(state,player,regions,target,label);const i=s.lastIndexOf('</svg>');return s.slice(0,i)+art().match(/<defs>.*?<\/defs>/)[0]+inset(p)+s.slice(i);};
M.bigSvg=big;
})(typeof window!=='undefined'?window:globalThis);
