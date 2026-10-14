/* v59 HOME PLOT + WORKER CAT-BOTS: the player's own district south of the camp (Core.HOME).
   - the server owns everything (bots, shifts, plot build points: /api/bots, see bots.js); this file only draws the last
     server view (window.MoonBots.view) and moves the robo-cats on the local clock between server updates
   - the plot grows step by step: paw road, crystal lamps, dome house, workshop, moon garden, pink house, solar field,
     beacon tower (Core.HOME_STEPS = server PLOT_STEPS); the next building stands in scaffolding with a hologram while
     builders hammer; mechanics walk between finished buildings with sparks; miners dig the crystal vein; couriers walk
     out towards the other districts with a parcel and come back
   - cute robo-cats: rounded body, visor face with glowing eyes, ears, antenna, a tail; hat/tool per profession
   - meshes are baked once in local space and placed with put() (terrain-following), drawn within DRAW_R
   - low quality: no sparks/motes, fewer halos. Load order: after depths-world.js, before chapter1-style.js. */
(function(root){'use strict';
const R=root.MoonRenderer&&root.MoonRenderer.prototype,Core=root.MoonCore,B=root.MoonOutpostBuilder;
if(!R||!Core||!B||!Core.HOME)return;
const old={scene:R.scene,render:R.render,blocked:R.blocked,camera:R.cameraBlocked};
const TAU=Math.PI*2,DRAW_R=95,H=Core.HOME,STEPS=Core.HOME_STEPS;
const MATS={ivory:[17,[1,.95,.86]],white:[17,[.97,.97,1]],steel:[17,[.70,.76,.84]],dark:[0,[.08,.09,.12]],gold:[16,[1,.76,.32]],stone:[4,[.80,.76,.90]],
 teal:[12,[.20,.95,.86]],tealHi:[12,[.70,1,.96]],amber:[12,[1,.66,.24]],pink:[17,[1,.62,.80]],pinkG:[12,[1,.52,.80]],roofP:[17,[.96,.46,.66]],roofB:[17,[.36,.70,.96]],
 glass:[12,[.30,.80,.66]],overall:[17,[.24,.42,.86]],mPocket:[17,[.18,.30,.66]],mHelmet:[17,[1,.56,.14]],vest:[17,[1,.62,.10]],reflect:[12,[1,1,.80]],bag:[17,[.62,.38,.20]],leaf:[17,[.36,.86,.52]],panel:[16,[.24,.40,.86]],wood:[17,[.86,.62,.38]],crystA:[30,[1,.62,.26]],crystV:[30,[.70,.40,1]],
 eye:[12,[.40,1,.96]],aMiner:[17,[1,.62,.22]],aMech:[17,[.24,.84,.92]],aBuild:[17,[1,.84,.24]],aCour:[17,[1,.50,.72]],hat:[17,[1,.82,.22]],box:[17,[.90,.66,.40]],lamp:[12,[1,.86,.50]],rock:[4,[.58,.54,.64]],rockD:[4,[.42,.39,.50]],rockL:[4,[.72,.68,.78]],weld:[12,[.75,.95,1]],flame:[12,[1,.62,.24]],rail:[16,[.62,.66,.74]]};
const ACC={miner:'aMiner',mechanic:'aMech',builder:'aBuild',courier:'aCour'};
// ---------- layout (local, +z = south, the gate faces the camp at -z) ----------
// v74: the plot is wider (fence 11.6 m) and every place has its own spot on a ring around the cat's plaza in the centre;
// paw paths run from the plaza to each place, crystal lamps stand along the paths.
const SITE=(deg,r)=>{const a=deg*Math.PI/180;return[+(Math.sin(a)*r).toFixed(2),+(-Math.cos(a)*r).toFixed(2)];};
const POS={road:[0,0],lamps:[0,0],house:SITE(310,7.4),workshop:SITE(50,7.4),garden:SITE(268,7.6),house2:SITE(140,7.4),solar:SITE(180,7.6),tower:SITE(335,9.6)};
const RAD={house:2.0,workshop:1.9,garden:1.9,house2:2.0,solar:1.8,tower:1.1};
const MS=1.4,MINE=SITE(222,8.7),PAD=SITE(95,7.6),PARCEL=PAD,GATE=[0,-11.3],FENCE_R=11.6,PLAZA=2.6,SPARE=SITE(22,9.4);
const VEIN=MINE;   // v59 name kept for older code
const face=(x,z)=>Math.atan2(-x,-z);                 // yaw that turns local +z towards the plaza
const MINE_YAW=face(...MINE),PAD_YAW=face(...PAD);
const rot=(yaw,x,z)=>{const c=Math.cos(yaw),s=Math.sin(yaw);return[x*c+z*s,-x*s+z*c];};
const at=(o,yaw,x,z)=>{const r=rot(yaw,x,z);return[o[0]+r[0],o[1]+r[1]];};
const MINE_DOOR=at(MINE,MINE_YAW,0,1.75*MS),MINE_CART=at(MINE,MINE_YAW,.4*MS,3.6*MS),MINE_OUT=at(MINE,MINE_YAW,-.6*MS,3.4*MS);
// buildings with a door turn their front (local -z) to the plaza
const BYAW={};for(const k of['house','workshop','house2','tower','garden'])BYAW[k]=Math.atan2(POS[k][0],POS[k][1]);BYAW.solar=0;
const WS_DOOR=at(POS.workshop,BYAW.workshop,0,-2.1),WS_WIN=at(POS.workshop,BYAW.workshop,1.05,-1.52);
const SPOKES=[...['house','workshop','garden','house2','solar'].map(k=>[POS[k],RAD[k]]),[MINE,6.1],[PAD,1.4]];
const LAMPS=SPOKES.map(([c],i)=>{const d=Math.hypot(c[0],c[1]),ux=c[0]/d,uz=c[1]/d,s=i%2?1:-1,r=PLAZA+1.8;return[+(ux*r-uz*s*.85).toFixed(2),+(uz*r+ux*s*.85).toFixed(2)];}).concat([[1.15,-5.2],[-1.15,-8.4]]);
const W=(lx,lz)=>[H.x+lx,H.z+lz];
function grp(map,mat){let g=map.get(mat);if(!g)map.set(mat,g=[]);return g;}
function merge(map,b){for(const[mat,data]of b.groups){const g=grp(map,mat);for(let i=0;i<data.length;i++)g.push(data[i]);}}
function dome(b,mat,r,h,y0=0){const prof=[];for(let i=0;i<=8;i++){const a=i/8*Math.PI/2;prof.push([Math.cos(a),y0/h+Math.sin(a)]);}b.shell(mat,prof,r,h);}
function ball(b,mat,x,y,z,r){const prof=[];for(let i=0;i<=8;i++){const a=-Math.PI/2+i/8*Math.PI;prof.push([Math.max(.001,Math.cos(a)),(Math.sin(a)+1)/2]);}const k=new B();k.shell(mat,prof,r,r*2);for(const[m,d]of k.groups){const g=b.groups.get(m)||[];for(let i=0;i<d.length;i+=6)g.push(d[i]+x,d[i+1]+y-r,d[i+2]+z,d[i+3],d[i+4],d[i+5]);b.groups.set(m,g);}}
function crystal(b,mat,x,y,z,r,h,lean=0,dir=0){const dx=Math.sin(dir)*lean,dz=Math.cos(dir)*lean;b.tube(mat,[x,y,z],[x+dx*h*.7,y+h*.7,z+dz*h*.7],r,6,r*.95);b.tube(mat,[x+dx*h*.7,y+h*.7,z+dz*h*.7],[x+dx*h,y+h,z+dz*h],r*.95,6,.01);}
// ---------- buildings (local to their own origin) ----------
function bHouse(b,roof){b.tube('stone',[0,-.1,0],[0,.22,0],2.0,24,1.95);b.shell('ivory',[[1,0],[1,.28]],1.7,2.2);dome(b,roof,1.72,1.5,.6);b.tube('gold',[0,.6,0],[0,.68,0],1.76,24);
 b.box('ivory',0,.8,-1.66,1.0,1.5,.36);b.box('wood',0,.68,-1.86,.66,1.2,.06);b.box('gold',0,1.42,-1.86,.74,.08,.08);
 for(const a of[-.9,.9,2.3,-2.3]){const x=Math.sin(a)*1.72,z=-Math.cos(a)*1.72;b.ring('lamp',x,1.2,z,.26,.26,.4,.06,10);}
 b.tube('steel',[0,2.05,0],[0,2.7,0],.04,6);ball(b,'tealHi',0,2.78,0,.11);b.paw(0,1.05,-1.9,.42,'gold');}
function bWorkshop(b){b.box('steel',0,1.1,0,3.4,2.2,2.8);b.box('roofB',0,2.32,0,3.6,.26,3.0);b.box('gold',0,2.18,-1.42,3.5,.1,.08);
 b.box('amber',0,.8,-1.42,1.6,1.4,.06);for(let i=0;i<4;i++)b.box('steel',0,.3+i*.34,-1.47,1.62,.05,.03);
 b.tube('steel',[1.1,2.3,.6],[1.1,3.3,.6],.2,10,.18);b.tube('dark',[1.1,3.28,.6],[1.1,3.34,.6],.21,10);
 b.ring('gold',-1.15,1.5,-1.46,.42,.42,.35,.1,8);b.box('gold',-1.15,1.5,-1.5,.18,.18,.06);for(const s of[-1,1])b.box('lamp',s*1.55,1.7,-1.44,.18,.3,.04);
 b.box('gold',1.05,1.45,-1.43,.86,.62,.05);b.box('weld',1.05,1.45,-1.47,.72,.48,.03);b.box('steel',1.05,1.45,-1.5,.04,.5,.02);b.box('steel',1.05,1.45,-1.5,.74,.04,.02);}
function bGarden(b){b.tube('stone',[0,-.1,0],[0,.2,0],1.95,24,1.9);dome(b,'glass',1.75,1.7,.18);for(let i=0;i<8;i++){const a=i/8*TAU;let prev=null;for(let k=0;k<=6;k++){const t=k/6*Math.PI/2,q=[Math.cos(a)*Math.cos(t)*1.77,.18+Math.sin(t)*1.7,Math.sin(a)*Math.cos(t)*1.77];if(prev)b.tube('gold',prev,q,.035,5);prev=q;}}b.tube('gold',[0,.18,0],[0,.26,0],1.8,24);
 for(let i=0;i<7;i++){const a=i/7*TAU,r=i?1.0:0,x=Math.cos(a)*r,z=Math.sin(a)*r,h=.5+((i*37)%5)/10;b.tube('leaf',[x,.2,z],[x,.2+h,z],.22,8,.02);}
 ball(b,'pinkG',.5,.95,.2,.12);ball(b,'lamp',-.4,.85,-.5,.1);}
function bSolar(b){for(const s of[-1.25,0,1.25]){b.tube('steel',[s,0,0],[s,.75,0],.06,6);b.box('panel',s,.95,0,1.05,.06,1.5);b.box('gold',s,.92,0,1.1,.03,1.55);}
 b.box('steel',0,.12,-.95,3.6,.2,.3);}
function bTower(b){b.tube('stone',[0,-.1,0],[0,.3,0],1.05,16,1.0);b.tube('white',[0,.3,0],[0,4.4,0],.55,14,.38);for(const y of[1.3,2.5,3.6])b.tube('roofP',[0,y,0],[0,y+.22,0],.56-.04*y,14);
 b.tube('gold',[0,4.4,0],[0,4.55,0],.7,14);b.tube('lamp',[0,4.55,0],[0,5.2,0],.36,12,.3);dome(b,'roofP',.48,.5,0);
 const k=new B();dome(k,'roofP',.48,.5,0);for(const[m,d]of k.groups){const g=b.groups.get(m)||[];for(let i=0;i<d.length;i+=6)g.push(d[i],d[i+1]+5.2,d[i+2],d[i+3],d[i+4],d[i+5]);b.groups.set(m,g);}
 b.tube('gold',[0,5.65,0],[0,6.1,0],.04,6);ball(b,'tealHi',0,6.18,0,.13);b.paw(0,2.0,-.48,.55,'gold');}
function bScaffold(b,r){const h=2.4;for(const[x,z]of[[-r,-r],[r,-r],[r,r],[-r,r]]){b.tube('wood',[x,0,z],[x,h,z],.06,6);}for(const y of[.9,1.8])for(const[a,c]of[[[-r,y,-r],[r,y,-r]],[[r,y,-r],[r,y,r]],[[r,y,r],[-r,y,r]],[[-r,y,r],[-r,y,-r]]])b.tube('wood',a,c,.045,6);
 for(const y of[.9,1.8])for(const[x,z,w,d]of[[0,-r,2*r+.3,.42],[0,r,2*r+.3,.42],[-r,0,.42,2*r+.3],[r,0,.42,2*r+.3]])b.box('wood',x,y+.02,z,w,.06,d);
 for(let k=0;k<6;k++)b.box('steel',r+.32,.3+k*.36,-r*.5,.04,.04,.42);for(const dz of[-.21,.21])b.tube('steel',[r+.32,0,-r*.5+dz],[r+.32,2.1,-r*.5+dz],.03,5);
 b.box('box',-r*.4,.2,r+.5,.5,.4,.5);b.box('box',-r*.4+.3,.55,r+.5,.4,.3,.4);b.box('stone',r*.3,.15,r+.6,.8,.3,.4);b.box('gold',r*.3,.32,r+.6,.84,.04,.44);}
// v74 crystal mine: a rock hill with a timbered entrance at local +z, rails out to the cart
function bMine(b){const lump=(m,x,y,z,r,h)=>{const k=new B();dome(k,m,r,h,0);for(const[mm,d]of k.groups){const g=b.groups.get(mm)||[];for(let i=0;i<d.length;i+=6)g.push(d[i]+x,d[i+1]+y,d[i+2]+z,d[i+3],d[i+4],d[i+5]);b.groups.set(mm,g);}};
 lump('rock',0,-.2,-.4,2.3,2.3);lump('rockD',-1.5,-.2,.2,1.25,1.5);lump('rockL',1.45,-.2,.0,1.2,1.7);lump('rockD',.4,-.2,-1.8,1.4,1.9);lump('rockL',-.7,1.2,-.9,.9,1.3);
 for(const[x,y,z,r]of[[1.9,.15,1.3,.35],[-2.0,.12,1.2,.3],[2.3,.1,-.7,.28],[-.9,2.0,.6,.2]])ball(b,'rockD',x,y,z,r);
 // entrance: dark tunnel mouth, timber frame, lantern
 b.tube('dark',[0,.82,1.1],[0,.82,2.05],.78,14,.8);b.box('dark',0,.42,1.62,1.56,.84,1.0);
 for(const s of[-1,1]){b.box('wood',s*.88,.82,2.08,.2,1.7,.22);b.box('wood',s*.88,.06,2.08,.3,.12,.3);}b.box('wood',0,1.72,2.1,2.14,.22,.26);b.box('gold',0,1.72,2.24,.5,.14,.02);
 b.tube('steel',[.0,1.83,2.12],[.0,2.05,2.12],.02,5);ball(b,'lamp',0,1.58,2.3,.13);
 // rails + sleepers to the cart stop
 for(let z=2.0;z<4.1;z+=.42)b.box('wood',.4,.03,z,.95,.06,.16);for(const x of[.12,.68])b.box('rail',x,.09,3.05,.05,.06,2.2);b.box('wood',.4,.2,4.18,.9,.4,.12);}
function bCart(b){b.box('steel',0,.42,0,.62,.36,.86);b.box('wood',0,.62,0,.66,.06,.9);b.box('dark',0,.6,0,.5,.03,.74);for(const z of[-.28,.28])for(const s of[-1,1])b.tube('dark',[s*.3,.15,z],[s*.36,.15,z],.14,10);b.tube('gold',[0,.62,-.47],[0,.86,-.62],.025,5);}
function bCartLoad(b){for(const[x,z,h,m]of[[0,0,.5,'crystA'],[-.16,.22,.36,'crystV'],[.16,-.2,.4,'crystV'],[.17,.24,.3,'crystA'],[-.18,-.22,.32,'crystA']])crystal(b,m,x,.6,z,.08,h,.25,x*9+z);}
function bMineLevel(b,l){const C=[[1.0,1.9,-.6],[-.9,1.7,.5],[.3,2.6,-1.2],[1.8,1.3,.3]][l-2];const[x,y,z]=C;for(let j=0;j<3;j++)crystal(b,j%2?'crystV':'crystA',x+(j-1)*.24,y-.15,z+(j%2)*.18,.17+.04*j,.8+.2*j,.3,j*2.1+l);}
function bRocket(b){for(let i=0;i<3;i++){const a=i/3*TAU;b.tube('steel',[Math.sin(a)*.3,.5,Math.cos(a)*.3],[Math.sin(a)*.62,0,Math.cos(a)*.62],.04,5);b.box('aCour',Math.sin(a)*.52,.42,Math.cos(a)*.52,.06,.5,.3,a);}
 b.tube('white',[0,.3,0],[0,1.7,0],.42,16,.44);b.tube('aCour',[0,1.15,0],[0,1.32,0],.45,16);b.tube('white',[0,1.7,0],[0,2.35,0],.44,16,.04);b.tube('gold',[0,.22,0],[0,.32,0],.3,12,.42);
 ball(b,'tealHi',0,1.5,.42,.13);b.ring('gold',0,1.5,.43,.18,.18,.3,.05,10);b.paw(0,.86,.44,.32,'gold');b.box('box',0,.86,-.46,.3,.26,.06);}
// the base that is always there: plaza, gate, fence posts, crystal vein, parcel pad
function bBase(b){b.tube('stone',[0,-.12,0],[0,.08,0],PLAZA,32,PLAZA-.1);b.tube('teal',[0,.08,0],[0,.1,0],1.9,32);b.tube('stone',[0,.09,0],[0,.13,0],1.7,32);b.paw(0,.14,0,1.3,'gold');
 // the cat's corner on the plaza: a round cushion bed and a little food bowl
 b.tube('pink',[-1.25,.1,1.15],[-1.25,.32,1.15],.55,18,.5);b.tube('ivory',[-1.25,.3,1.15],[-1.25,.34,1.15],.42,18);b.tube('steel',[-.45,.12,1.55],[-.45,.24,1.55],.2,12,.24);ball(b,'amber',-.45,.25,1.55,.06);
 for(const s of[-1,1]){b.tube('white',[s*1.8,0,GATE[1]],[s*1.8,2.6,GATE[1]],.16,10,.14);ball(b,'lamp',s*1.8,2.78,GATE[1],.2);}
 {let prev=null;for(let k=0;k<=12;k++){const t=k/12*Math.PI,q=[-Math.cos(t)*1.8,2.6+Math.sin(t)*.9,GATE[1]];if(prev)b.tube('roofP',prev,q,.12,8,.12);prev=q;}}
 b.ring('gold',0,3.25,GATE[1]-.02,.5,.5,.3,.08,12);b.paw(0,3.22,GATE[1]-.08,.5,'gold');
 for(let i=0;i<40;i++){const a=i/40*TAU,x=Math.sin(a)*FENCE_R,z=-Math.cos(a)*FENCE_R;if(Math.abs(x)<2.6&&z<0)continue;b.tube('white',[x,0,z],[x,.75,z],.07,6,.06);ball(b,i%2?'tealHi':'pinkG',x,.84,z,.08);}
 {const[x,z]=PAD;b.tube('stone',[x,-.1,z],[x,.14,z],1.35,24,1.3);b.tube('pinkG',[x,.14,z],[x,.17,z],1.1,24);b.tube('stone',[x,.16,z],[x,.19,z],.8,24);
  for(let i=0;i<6;i++){const a=i/6*TAU;ball(b,'lamp',x+Math.cos(a)*1.2,.2,z+Math.sin(a)*1.2,.07);}
  const[px,pz]=at(PAD,PAD_YAW,-1.15,1.05);b.box('box',px,.3,pz,.42,.42,.42);b.box('box',px+.12,.66,pz-.05,.3,.3,.3);b.box('gold',px,.3,pz+.22,.44,.06,.02);}}
// v74 paths: gate road, a ring round the plaza and a paw path from the plaza to every place
function bRoad(b){const tile=(x,z,yaw)=>{b.box('stone',x,.04,z,.95,.08,.95,yaw);b.box('teal',x,.085,z,.5,.02,.5,yaw);};for(let z=GATE[1]+.6;z<-PLAZA-.6;z+=1.15)tile(0,z,0);
 for(let i=0;i<26;i++){const a=i/26*TAU;tile(Math.sin(a)*(PLAZA+.75),-Math.cos(a)*(PLAZA+.75),a);}
 for(const[c,r]of SPOKES){const d=Math.hypot(c[0],c[1]),ux=c[0]/d,uz=c[1]/d,yaw=Math.atan2(ux,uz);for(let k=PLAZA+1.75;k<d-r-.2;k+=1.1)tile(ux*k,uz*k,yaw);}}
function bLamps(b){for(const[x,z]of LAMPS){b.tube('white',[x,0,z],[x,1.9,z],.06,8,.05);b.tube('gold',[x,1.88,z],[x,1.96,z],.16,10);crystal(b,'tealHi',x,1.96,z,.12,.42);}}
// mechanic level trims (plot level 2..4): gold rim on the plaza, flags on the gate, glowing plaza ring
function bLevel(b,l){if(l===2)for(let i=0;i<16;i++){const a=i/16*TAU;ball(b,'gold',Math.cos(a)*2.62,.16,Math.sin(a)*2.62,.11);}if(l===3)for(const s of[-1,1]){b.tube('steel',[s*1.8,2.6,GATE[1]],[s*1.8,3.6,GATE[1]],.03,6);b.box(s<0?'aMech':'pinkG',s*1.8+s*.28,3.4,GATE[1],.5,.32,.03);}if(l===4)for(let i=0;i<16;i++){const a=(i+.5)/16*TAU;ball(b,'tealHi',Math.cos(a)*2.62,.16,Math.sin(a)*2.62,.09);}}
// ---------- robo-cat (local, faces +z, ~1.05 m) ----------
function bBot(b,prof){const acc=ACC[prof],suit=prof==='mechanic'?'overall':'white';
 for(const[x,z]of[[-.2,-.22],[.2,-.22],[-.2,.22],[.2,.22]])b.tube(prof==='mechanic'?'overall':'steel',[x,0,z],[x,.26,z],.08,8,.09);
 b.box(suit,0,.44,0,.62,.4,.76);b.box('white',0,.88,.2,.6,.46,.5);b.box('dark',0,.88,.46,.48,.28,.03);b.box('eye',-.12,.9,.48,.09,.1,.02);b.box('eye',.12,.9,.48,.09,.1,.02);b.box('pinkG',0,.8,.48,.06,.04,.02);
 for(const s of[-1,1]){b.tube('white',[s*.2,1.08,.2],[s*.25,1.3,.2],.11,4,.01);b.tube('pinkG',[s*.2,1.09,.22],[s*.24,1.24,.22],.05,4,.01);}
 b.tube(acc,[0,.5,-.38],[0,.62,-.6],.06,8,.05);b.tube(acc,[0,.62,-.6],[0,.9,-.66],.05,8,.035);
 const hatOn=(mat,r,h,y,z)=>{const k=new B();dome(k,mat,r,h,0);for(const[m,d]of k.groups){const g=b.groups.get(m)||[];for(let i=0;i<d.length;i+=6)g.push(d[i],d[i+1]+y,d[i+2]+z,d[i+3],d[i+4],d[i+5]);b.groups.set(m,g);}};
 if(prof==='miner'){hatOn('mHelmet',.35,.24,1.1,.2);b.tube('mHelmet',[0,1.1,.2],[0,1.13,.2],.38,16);b.box('steel',0,1.2,.5,.16,.12,.08);b.box('lamp',0,1.2,.55,.11,.08,.02);b.box('aMiner',0,.44,.39,.42,.26,.03);}
 if(prof==='mechanic'){for(const s of[-1,1])b.box('overall',s*.16,.72,.4,.08,.34,.03);b.box('overall',0,.5,.39,.4,.3,.03);b.box('gold',0,.55,.41,.1,.08,.02);b.box('mPocket',-.32,.44,.05,.04,.18,.26);}
 if(prof==='builder'){hatOn('hat',.36,.22,1.1,.2);b.box('hat',0,1.12,.48,.46,.03,.16);b.tube('hat',[0,1.32,.2],[0,1.34,.2],.06,8);
  b.box('vest',0,.46,0,.66,.3,.8);for(const y of[.4,.54])b.box('reflect',0,y,0,.67,.035,.81);}
 if(prof==='courier'){b.tube('aCour',[0,1.1,.2],[0,1.22,.2],.3,16,.27);hatOn('aCour',.27,.12,1.22,.2);b.box('aCour',0,1.12,.5,.36,.03,.24);b.ball&&0;
  b.box('aCour',0,.5,0,.64,.12,.78);b.tube('wood',[-.3,.62,.3],[.3,.62,-.3],.025,6);b.box('bag',.36,.42,-.22,.14,.3,.36);b.box('gold',.44,.45,-.22,.02,.08,.12);}}
function bTool(b,prof){if(prof==='miner'){b.tube('wood',[0,0,0],[0,0,.55],.025,6);b.tube('steel',[0,0,.55],[-.24,-.06,.5],.035,6,.01);b.tube('steel',[0,0,.55],[.24,-.06,.5],.035,6,.01);}
 else if(prof==='builder'){b.tube('wood',[0,0,0],[0,0,.45],.03,6);b.box('steel',0,0,.48,.12,.12,.22);b.box('dark',0,0,.6,.1,.1,.04);}
 else if(prof==='mechanic'){b.tube('steel',[0,0,0],[0,0,.42],.025,6);b.ring('steel',0,0,.46,.07,.07,.5,.03,8);}}
function build(r){const L={},add=(n,b)=>{const map=new Map();merge(map,b);L[n]=[];for(const[mat,data]of map){if(!data.length)continue;const key='v59_'+n+'_'+mat;r.addMesh(key,data);L[n].push([key,mat]);}};
 const mk=f=>{const b=new B();f(b);return b;};
 add('base',mk(bBase));add('road',mk(bRoad));add('lamps',mk(bLamps));add('house',mk(b=>bHouse(b,'roofB')));add('house2',mk(b=>bHouse(b,'roofP')));add('workshop',mk(bWorkshop));add('garden',mk(bGarden));add('solar',mk(bSolar));add('tower',mk(bTower));
 add('scaffold',mk(b=>bScaffold(b,1.5)));add('mine',mk(bMine));add('cart',mk(bCart));add('cartLoad',mk(bCartLoad));add('rocket',mk(bRocket));for(const l of[2,3,4,5])add('mineL'+l,mk(b=>bMineLevel(b,l)));for(const l of[2,3,4])add('lvl'+l,mk(b=>bLevel(b,l)));
 for(const p of Core.BOT_PROFS){add('bot_'+p,mk(b=>bBot(b,p)));if(p!=='courier')add('tool_'+p,mk(b=>bTool(b,p)));}
 return{L};}
R.v59Build=function(){if(this.v59)return this.v59;return this.v59=build(this);};
// ---------- live view → what to draw ----------
function view(){const M=root.MoonBots;return M&&M.view?M:null;}
function serverNow(M){return M.view.now+(Date.now()-M.at);}
function plotOf(state){const M=view();if(M&&M.view.plot)return M.view.plot;return null;}
function stageOf(state){const p=plotOf(state);return p?Math.min(STEPS.length,p.stage|0):0;}
const built=st=>STEPS.slice(0,st);
// a polyline walker: position + heading at time t, speed m/s, looping back and forth
function walk(pts,t,speed){let len=0;const seg=[];for(let i=0;i<pts.length-1;i++){const l=Math.hypot(pts[i+1][0]-pts[i][0],pts[i+1][1]-pts[i][1]);seg.push(l);len+=l;}
 let d=(t*speed)%(len*2),back=false;if(d>len){d=len*2-d;back=true;}
 for(let i=0;i<seg.length;i++){if(d<=seg[i]||i===seg.length-1){const a=pts[i],b=pts[i+1],f=seg[i]?Math.min(1,d/seg[i]):0,x=a[0]+(b[0]-a[0])*f,z=a[1]+(b[1]-a[1])*f;let yaw=Math.atan2(b[0]-a[0],b[1]-a[1]);if(back)yaw+=Math.PI;return{x,z,yaw,moving:true};}d-=seg[i];}return{x:pts[0][0],z:pts[0][1],yaw:0,moving:false};}
// every bot gets a spot and an animation from its profession, state and index (v74: work places)
const home=(i,n)=>{const a=i/Math.max(1,n)*TAU+.4;return[Math.cos(a)*1.15,Math.sin(a)*1.15];};
const lerp=(a,b,f)=>[a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f];
function go(a,b,f,extra){const p=lerp(a,b,Math.max(0,Math.min(1,f)));return{x:p[0],z:p[1],yaw:Math.atan2(b[0]-a[0],b[1]-a[1]),moving:true,work:0,hop:0,...extra};}
const COUR_LOOP=40;
// courier rocket flight on a 40 s loop: walk to the pad, board, lift off, away, land with a parcel, walk home
function rocketAt(t,ph){const f=(t+ph)%COUR_LOOP;if(f<7||f>=31)return{y:0,on:true,fly:0};if(f<12){const k=(f-7)/5;return{y:k*k*34,on:true,fly:1,up:1};}if(f<25)return{on:false};const k=(31-f)/6;return{y:k*k*34,on:true,fly:1,up:0};}
function botPose(b,i,n,st,t,cIdx=0){const ph=i*1.7,ready=b.state==='ready',idle=b.state==='idle',hm=home(i,n);
 if(idle){const[x,z]=hm;return{x,z,yaw:Math.atan2(-x,-z)+Math.PI+Math.sin(t*.7+ph)*.3,moving:false,work:0,hop:0,sit:true};}
 if(b.prof==='miner'){
  if(ready){const o=at(MINE_OUT,0,(i%3)*.5-.5,0);return{x:o[0]+.3*(i%2),z:o[1],yaw:Math.atan2(MINE_CART[0]-o[0],MINE_CART[1]-o[1]),moving:false,work:0,hop:Math.abs(Math.sin(t*3.2+ph))*.14,cart:true};}
  const f=(t+ph*7)%60,door=MINE_DOOR,inside=at(MINE,MINE_YAW,0,.6*MS);
  if(f<6)return go(hm,door,f/6);if(f<7)return go(door,inside,f-6,{fade:1});if(f<56)return{x:inside[0],z:inside[1],yaw:MINE_YAW+Math.PI,hide:true,inMine:true,work:1};
  if(f<57)return go(inside,door,f-56);return go(door,hm,(f-57)/3);}
 if(b.prof==='mechanic'){const ws=st>STEPS.indexOf('workshop');
  if(ws&&!ready){const f=(t+ph*5)%50,inside=at(POS.workshop,BYAW.workshop,0,0);if(f<6)return go(hm,WS_DOOR,f/6);if(f<46)return{x:inside[0],z:inside[1],yaw:0,hide:true,weld:1,work:1};return go(WS_DOOR,hm,(f-46)/4);}
  if(ready){const[x,z]=hm;return{x,z,yaw:Math.atan2(-x,-z)+Math.PI,moving:false,work:0,hop:Math.abs(Math.sin(t*3.2+ph))*.18};}
  const list=built(st).filter(k=>RAD[k]);if(!list.length){const w=walk([[-1.5,-3.6],[1.5,-3.6]],t+ph,.5);return{...w,work:0,hop:0};}
  const k=list[Math.floor((t+ph*3)/9)%list.length],c=POS[k],a=i*1.9,rr=RAD[k]+.45,tx=c[0]+Math.cos(a)*rr,tz=c[1]+Math.sin(a)*rr;return{x:tx,z:tz,yaw:Math.atan2(c[0]-tx,c[1]-tz),work:1,swing:Math.sin(t*7+ph),hop:0,spark:k};}
 if(b.prof==='builder'){if(ready){const[x,z]=hm;return{x,z,yaw:Math.atan2(-x,-z)+Math.PI,moving:false,work:0,hop:Math.abs(Math.sin(t*3.2+ph))*.18};}
  const nx=st<STEPS.length?STEPS[st]:null,c=nx&&RAD[nx]?POS[nx]:SPARE,yaw0=Math.atan2(-c[0],-c[1]),side=(i%3)-1,lvl=i%2;
  // on the boards of the scaffold, on the side that faces the plaza, two floors
  const[lx,lz]=rot(yaw0,side*.75,1.5+.1),x=c[0]+lx,z=c[1]+lz;
  if(nx==='road'||nx==='lamps'){const L=LAMPS[i%LAMPS.length];return{x:L[0]+.6,z:L[1],yaw:-Math.PI/2,work:1,swing:Math.sin(t*6+ph),hop:0};}
  return{x,z,yaw:yaw0+Math.PI,work:1,swing:Math.sin(t*6+ph),hop:0,dy:lvl?1.84:.94,scaffold:true};}
 if(b.prof==='courier'){
  if(ready){const[x,z]=hm;return{x,z,yaw:Math.atan2(-x,-z)+Math.PI,moving:false,work:0,hop:Math.abs(Math.sin(t*3.2+ph))*.18,parcel:true};}
  const pad=at(PAD,PAD_YAW,0,1.25);if(cIdx>0){const w=walk([hm,pad],t*.5+ph*4,1.0);return{...w,work:0,hop:0,parcel:w.yaw!==0};}
  const f=t%COUR_LOOP;if(f<6)return go(hm,pad,f/6);if(f<7)return go(pad,PAD,f-6);if(f<31)return{x:PAD[0],z:PAD[1],yaw:0,hide:true};if(f<32)return go(PAD,pad,f-31,{parcel:true});return go(pad,hm,(f-32)/8,{parcel:true});}
 return{x:0,z:0,yaw:0,work:0,hop:0};}
function commute(b,i,n,q){return q;}
R.v59Poses=function(t){const M=view();if(!M)return[];const bots=(M.view.bots||[]).slice(0,12),st=Math.min(STEPS.length,(M.view.plot&&M.view.plot.stage)|0),now=serverNow(M);
 let ci=0;return bots.map((b0,i)=>{const b={...b0};if(b.state==='working'&&b.endsAt&&now>=b.endsAt)b.state='ready';const c=b.prof==='courier'&&b.state==='working'?ci++:0;return{b,...botPose(b,i,bots.length,st,t,c)};});};
function mineLvl(){const M=view();return M&&M.view.mine?Math.max(1,Math.min(5,M.view.mine.level|0)):1;}
function courierFlying(t){const M=view();if(!M)return false;return(M.view.bots||[]).some(b=>b.prof==='courier'&&b.state==='working'&&!(b.endsAt&&serverNow(M)>=b.endsAt));}
const on=s=>!!s;
R.scene=function(state,p,t,...args){const out=old.scene.call(this,state,p,t,...args);if(!on(state))return out;const eye=this.eye||[0,0,0];if(Math.hypot(eye[0]-H.x,eye[2]-H.z)>DRAW_R)return out;
 const v=this.v59Build(),ch=state.chapter||1,low=this.quality==='low',st=stageOf(state),pl=plotOf(state),lvl=pl?pl.level|0:1,G=(lx,lz)=>this.terrain(H.x+lx,H.z+lz,ch);
 const draw=(name,lx,lz,yaw=0,dy=0,sc=1,pitch=0,roll=0)=>{const y=G(lx,lz)+dy;for(const[key,mat]of v.L[name]||[]){const[kind,col]=MATS[mat];const g=kind===30?.35:kind===12?(mat==='glass'?.12:mat==='teal'?.55+.1*Math.sin(t*1.6):.8):mat==='gold'?.1:0;this.put(key,H.x+lx,y,H.z+lz,sc,sc,sc,col,yaw,kind,g,pitch,roll);}};
 draw('base',0,0,0,-.04);if(st>=1)draw('road',0,0,0,-.04);if(st>=2)draw('lamps',0,0,0,-.04);
 for(const k of['house','workshop','garden','house2','solar','tower']){const idx=STEPS.indexOf(k);if(st>idx)draw(k,POS[k][0],POS[k][1],BYAW[k]||0,-.05);else if(st===idx)draw('scaffold',POS[k][0],POS[k][1],Math.atan2(-POS[k][0],-POS[k][1])+Math.PI/2,-.05);}
 if(st>=STEPS.length)draw('scaffold',SPARE[0],SPARE[1],Math.atan2(-SPARE[0],-SPARE[1])+Math.PI/2,-.05);
 // v74 mine (+ crystals per level), cart (full when a miner is back), courier rocket
 draw('mine',MINE[0],MINE[1],MINE_YAW,-.15,MS);for(let l=2;l<=mineLvl();l++)draw('mineL'+l,MINE[0],MINE[1],MINE_YAW,-.15,MS);
 const poses=this.v59Poses(t),full=poses.some(q=>q.cart);draw('cart',MINE_CART[0],MINE_CART[1],MINE_YAW,.05);if(full)draw('cartLoad',MINE_CART[0],MINE_CART[1],MINE_YAW,.05);
 {const r=courierFlying()?rocketAt(t,0):{y:0,on:true};this._v74Rocket=r;if(r.on)draw('rocket',PAD[0]+(r.fly?Math.sin(t*9)*.03:0),PAD[1],PAD_YAW,.17+r.y,1,0,0);}
 for(let l=2;l<=Math.min(4,lvl);l++)draw('lvl'+l,0,0,0,-.04);
 // robo-cats
 if(!(this.characterSprite&&this.characterSprite.bots&&this.characterSprite.bots.ready))for(const q of poses){if(q.hide)continue;const{b}=q,yb=(q.dy||0)+(q.hop||0)+(q.moving?Math.abs(Math.sin(t*9+q.x))*.06:0)-(q.sit?.1:0),sc=b.source==='stars'?1.42:1.36;
  draw('bot_'+b.prof,q.x,q.z,q.yaw,yb,sc);
  if(b.prof!=='courier'&&v.L['tool_'+b.prof]){const c=Math.cos(q.yaw),s=Math.sin(q.yaw),hx=q.x+(c*.36+s*.18)*sc,hz=q.z+(-s*.36+c*.18)*sc;const sw=q.work?q.swing:0;draw('tool_'+b.prof,hx,hz,q.yaw,(.62+(q.work?.08:0))*sc+yb,sc,q.work?-.6+sw*.75:-1.3,0);}}
 return out;};
// ---------- collisions (finished buildings, gate posts, vein, tower) ----------
function insideHome(x,z,state){const lx=x-H.x,lz=z-H.z;if(Math.hypot(lx,lz)>FENCE_R+1)return false;const st=stageOf(state);
 for(const k of['house','workshop','garden','house2','solar','tower']){const idx=STEPS.indexOf(k);if(st>=idx&&Math.hypot(lx-POS[k][0],lz-POS[k][1])<RAD[k]*(st===idx?.9:1))return true;}
 for(const s of[-1,1])if(Math.hypot(lx-s*1.8,lz-GATE[1])<.3)return true;if(Math.hypot(lx-MINE[0],lz-MINE[1])<2.3*MS)return true;if(Math.hypot(lx-PAD[0],lz-PAD[1])<.75)return true;return false;}
R.blocked=function(x,z,state,alt=0){if(state&&alt<2.4&&insideHome(x,z,state))return true;return old.blocked.call(this,x,z,state,alt);};
if(old.camera)R.cameraBlocked=function(x,z,state,alt=0){if(state&&alt<1.4&&insideHome(x,z,state))return true;return old.camera.call(this,x,z,state,alt);};
(root.MoonRockZones=root.MoonRockZones||[]).push({ch:1,out:r=>Math.hypot(r.x-H.x,r.z-H.z)<=H.r+3+r.s*.6||(Math.abs(r.x-H.x)<3.5+r.s*.6&&r.z<H.z&&r.z>H.z-24)});
// ---------- fx: halos, hologram of the next building, sparks, ready markers ----------
R.render=function(state,p,t,dt,yaw,pitch,scan){old.render.call(this,state,p,t,dt,yaw,pitch,scan);if(!on(state)||!this.v59||!this.vp||!this.gl||!this.v50Prog||this._v59Off)return;
 try{const P5=this.v50Prog();if(!P5)return;const gl=this.gl,low=this.quality==='low',eye=this.eye||[0,0,0],Q=[],V=this.vp,rl=Math.hypot(V[0],V[8])||1,rx=V[0]/rl,rz=V[8]/rl;
  if(Math.hypot(eye[0]-H.x,eye[2]-H.z)>DRAW_R)return;const ch=state.chapter||1,T=(lx,lz)=>this.terrain(H.x+lx,H.z+lz,ch),st=stageOf(state);
  const bill=(lx,y,lz,sx,sy,k,c,w)=>{const x=H.x+lx,z=H.z+lz;for(const[u,q]of[[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]])Q.push(x+rx*u*sx,y+q*sy,z+rz*u*sx,u,q,k,0,c[0],c[1],c[2],w);};
  const flat=(lx,lz,rad,c,w)=>{const N=3;for(let j=0;j<N;j++)for(let i=0;i<N;i++){const q=[[i,j],[i+1,j],[i+1,j+1],[i,j+1]].map(([a,b])=>{const u=a/N*2-1,v=b/N*2-1,px=lx+u*rad,pz=lz+v*rad;return[H.x+px,T(px,pz)+.07,H.z+pz,u,v];});for(const n of[0,1,2,0,2,3])Q.push(...q[n],4,0,c[0],c[1],c[2],w);}};
  const pul=.85+.15*Math.sin(t*2),TEAL=[.3,.95,1],GOLD=[1,.8,.4],PINK=[1,.55,.85];
  flat(0,0,3.2,[.05,.24,.26],.7);bill(0,T(0,0)+.5,0,2.6,.7,0,TEAL,.22*pul);
  const poses=this.v59Poses(t),inMine=poses.filter(q=>q.inMine).length,welding=poses.some(q=>q.weld);
  {const[x,z]=MINE_DOOR,y=T(x,z),lt=at(MINE,MINE_YAW,0,2.3*MS);bill(lt[0],T(lt[0],lt[1])+1.58*MS,lt[1],.7,.7,0,[1,.8,.45],.75*pul);bill(x,y+.8,z,.95,.85,0,[1,.62,.3],(inMine?.55:.22)*(.8+.2*Math.sin(t*7)));
   if(inMine&&!low)for(let j=0;j<6;j++){const k=(t*1.7+j/6)%1,a=j*2.4+t;bill(x+Math.cos(a)*.35*k,y+.5+k*.9,z+Math.sin(a)*.35*k,.07,.07,2,[1,.78,.35],(1-k)*.95);}}
  if(welding&&st>STEPS.indexOf('workshop')){const[x,z]=WS_WIN,y=T(x,z)+1.45,fl=Math.max(0,Math.sin(t*23)*Math.sin(t*7.3));bill(x,y,z,.55,.4,0,[.6,.95,1],.35+.6*fl);
   if(!low)for(let j=0;j<7;j++){const k=(t*2.3+j/7)%1,a=j*1.9;bill(x+Math.cos(a)*.4*k,y-.1-k*k*.6,z+Math.sin(a)*.4*k,.05,.05,2,[1,.9,.5],(1-k)*fl*1.2);}}
  {const r=this._v74Rocket;if(r&&r.on){const y=T(PAD[0],PAD[1])+.17+r.y;bill(PAD[0],y+1.2,PAD[1],.9,1.4,0,PINK,.14);if(r.fly){bill(PAD[0],y-.1,PAD[1],.32,.55+.15*Math.sin(t*30),2,[1,.62,.24],.95);bill(PAD[0],y-.3,PAD[1],.6,.7,0,[1,.5,.2],.45);}}
   bill(PAD[0],T(PAD[0],PAD[1])+.3,PAD[1],1.3,.4,0,PINK,.3*pul);}
  for(const s of[-1,1])bill(s*1.8,T(s*1.8,GATE[1])+2.78,GATE[1],.55,.55,0,GOLD,.7);
  if(st>=2)for(const[x,z]of LAMPS)bill(x,T(x,z)+2.2,z,.6,.6,0,TEAL,.7);
  if(st>=7){const[x,z]=POS.tower;bill(x,T(x,z)+4.9,z,1.4,1.4,0,GOLD,.6*pul);bill(x,T(x,z)+6.2,z,.5,.5,0,TEAL,.9);}
  // hologram of the next building over its scaffolding
  if(st<STEPS.length){const k=STEPS[st],c=POS[k]&&RAD[k]?POS[k]:null;if(c){const y=T(c[0],c[1]),f=(t*.5)%1;bill(c[0],y+1.4,c[1],RAD[k]*1.05,1.6,0,TEAL,.16*pul);if(!low)bill(c[0],y+.2+f*2.6,c[1],RAD[k]*.9,.08,0,TEAL,(1-f)*.5);}}
  // bots: soft halo, ready "!" marker, work sparks, boost ring
  for(const q of poses){if(q.hide)continue;const y=T(q.x,q.z)+(q.dy||0),b=q.b;bill(q.x,y+.6,q.z,.75,.6,0,b.source==='stars'?GOLD:TEAL,.16);
   if(b.state==='ready'){bill(q.x,y+2.3+.08*Math.sin(t*4),q.z,.32,.32,0,GOLD,.95);bill(q.x,y+2.3,q.z,.75,.75,0,GOLD,.35*pul);}
   if(b.source==='stars')flat(q.x,q.z,.7,[.35,.26,.05],.8);
   if(!low&&q.work){const c=Math.cos(q.yaw),s=Math.sin(q.yaw),fx=q.x+s*.7,fz=q.z+c*.7,hit=Math.max(0,-q.swing);for(let j=0;j<3;j++){const a=t*3+j*2.1;bill(fx+Math.cos(a)*.25*hit,y+.5+hit*.4+j*.1,fz+Math.sin(a)*.25*hit,.09,.09,2,b.prof==='miner'?[1,.75,.35]:b.prof==='mechanic'?[.6,1,1]:[1,.95,.6],hit*.9);}}
   if(q.parcel&&!low)bill(q.x,y+1.1,q.z,.3,.3,2,PINK,.4);}
  if(!Q.length)return;const data=new Float32Array(Q);
  gl.useProgram(P5.p);gl.uniformMatrix4fv(P5.vp,false,this.vp);gl.uniform1f(P5.time,t);gl.bindBuffer(gl.ARRAY_BUFFER,P5.buf);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);
  gl.enable(gl.DEPTH_TEST);gl.depthMask(false);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  gl.enableVertexAttribArray(P5.pos);gl.vertexAttribPointer(P5.pos,3,gl.FLOAT,false,44,0);gl.enableVertexAttribArray(P5.info);gl.vertexAttribPointer(P5.info,4,gl.FLOAT,false,44,12);gl.enableVertexAttribArray(P5.tone);gl.vertexAttribPointer(P5.tone,4,gl.FLOAT,false,44,28);
  gl.drawArrays(gl.TRIANGLES,0,data.length/11);gl.disableVertexAttribArray(P5.pos);gl.disableVertexAttribArray(P5.info);gl.disableVertexAttribArray(P5.tone);
  gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(true);gl.disable(gl.BLEND);this.v59Stats={fxQuads:data.length/66|0};}catch(e){this._v59Off=true;if(typeof console!=='undefined')console.warn('v59 fx off',e);}};
root.MoonHomePlot={H,POS,RAD,VEIN,MINE,PAD,PARCEL,GATE,LAMPS,FENCE_R,SPOKES,MINE_DOOR,WS_DOOR,rocketAt,inside:insideHome,walk,botPose,commute};
})(typeof window!=='undefined'?window:globalThis);
