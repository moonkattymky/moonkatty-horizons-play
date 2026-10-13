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
 glass:[12,[.30,.80,.66]],overall:[17,[.24,.42,.86]],mPocket:[17,[.18,.30,.66]],mHelmet:[17,[1,.56,.14]],vest:[17,[1,.62,.10]],reflect:[12,[1,1,.80]],bag:[17,[.62,.38,.20]],leaf:[17,[.36,.86,.52]],panel:[16,[.24,.40,.86]],wood:[17,[.86,.62,.38]],crystA:[12,[1,.62,.26]],crystV:[12,[.70,.40,1]],
 eye:[12,[.40,1,.96]],aMiner:[17,[1,.62,.22]],aMech:[17,[.24,.84,.92]],aBuild:[17,[1,.84,.24]],aCour:[17,[1,.50,.72]],hat:[17,[1,.82,.22]],box:[17,[.90,.66,.40]],lamp:[12,[1,.86,.50]]};
const ACC={miner:'aMiner',mechanic:'aMech',builder:'aBuild',courier:'aCour'};
// ---------- layout (local, +z = south, the entrance faces the camp at -z) ----------
const POS={road:[0,0],lamps:[0,0],house:[-4.6,-2.4],workshop:[4.8,-2.2],garden:[-4.4,3.8],house2:[4.6,3.8],solar:[0,6.4],tower:[-6.2,-5.9]};
const RAD={house:2.0,workshop:1.9,garden:1.9,house2:2.0,solar:1.8,tower:1.1};
const VEIN=[-7.6,1.2],PARCEL=[6.4,-6.4],GATE=[0,-8.6],FENCE_R=8.8;
const LAMPS=[0,1,2,3,4,5].map(i=>{const a=i/6*TAU+.52;return[Math.cos(a)*3.3,Math.sin(a)*3.3];});
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
 b.ring('gold',-1.15,1.5,-1.46,.42,.42,.35,.1,8);b.box('gold',-1.15,1.5,-1.5,.18,.18,.06);for(const s of[-1,1])b.box('lamp',s*1.55,1.7,-1.44,.18,.3,.04);}
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
 b.box('box',-r*.4,.2,r+.5,.5,.4,.5);b.box('box',-r*.4+.3,.55,r+.5,.4,.3,.4);b.box('stone',r*.3,.15,r+.6,.8,.3,.4);b.box('gold',r*.3,.32,r+.6,.84,.04,.44);}
// the base that is always there: plaza, gate, fence posts, crystal vein, parcel pad
function bBase(b){b.tube('stone',[0,-.12,0],[0,.08,0],2.6,32,2.5);b.tube('teal',[0,.08,0],[0,.1,0],1.9,32);b.tube('stone',[0,.09,0],[0,.13,0],1.7,32);b.paw(0,.14,0,1.3,'gold');
 for(const s of[-1,1]){b.tube('white',[s*1.8,0,GATE[1]],[s*1.8,2.6,GATE[1]],.16,10,.14);ball(b,'lamp',s*1.8,2.78,GATE[1],.2);}
 {let prev=null;for(let k=0;k<=12;k++){const t=k/12*Math.PI,q=[-Math.cos(t)*1.8,2.6+Math.sin(t)*.9,GATE[1]];if(prev)b.tube('roofP',prev,q,.12,8,.12);prev=q;}}
 b.ring('gold',0,3.25,GATE[1]-.02,.5,.5,.3,.08,12);b.paw(0,3.22,GATE[1]-.08,.5,'gold');
 for(let i=0;i<30;i++){const a=i/30*TAU,x=Math.sin(a)*FENCE_R,z=-Math.cos(a)*FENCE_R;if(Math.abs(x)<2.6&&z<0)continue;b.tube('white',[x,0,z],[x,.75,z],.07,6,.06);ball(b,i%2?'tealHi':'pinkG',x,.84,z,.08);}
 {const[x,z]=VEIN;b.tube('stone',[x,-.1,z],[x,.45,z],1.25,9,.9);const rr=[[0,0,.26,1.5,.2,0],[.6,.3,.18,1.0,.4,1.4],[-.5,.4,.16,.9,.45,3.2],[.2,-.6,.15,.8,.5,4.6],[-.4,-.4,.13,.7,.4,5.5]];
  rr.forEach(([dx,dz,r,h,l,d],i)=>crystal(b,i%2?'crystV':'crystA',x+dx,.35,z+dz,r,h,l,d));}
 {const[x,z]=PARCEL;b.tube('stone',[x,-.1,z],[x,.12,z],1.1,20,1.05);b.tube('pinkG',[x,.12,z],[x,.15,z],.9,20);b.box('box',x+.4,.4,z+.3,.5,.5,.5);b.box('box',x-.3,.32,z+.45,.38,.38,.38);b.box('gold',x+.4,.4,z+.04,.52,.06,.02);}}
function bRoad(b){const tile=(x,z,yaw)=>{b.box('stone',x,.04,z,.95,.08,.95,yaw);b.box('teal',x,.085,z,.5,.02,.5,yaw);};for(let z=GATE[1]+.6;z<-2.8;z+=1.15)tile(0,z,0);
 for(let i=0;i<22;i++){const a=i/22*TAU;tile(Math.sin(a)*4.6,-Math.cos(a)*4.6,a);}}
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
 add('scaffold',mk(b=>bScaffold(b,1.5)));for(const l of[2,3,4])add('lvl'+l,mk(b=>bLevel(b,l)));
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
// every bot gets a spot and an animation from its profession, state and index
function botPose(b,i,n,st,t){const ph=i*1.7,ready=b.state==='ready',idle=b.state==='idle';
 if(ready||idle){const a=i/Math.max(1,n)*TAU+.4,rr=1.15,x=Math.cos(a)*rr,z=Math.sin(a)*rr;return{x,z,yaw:Math.atan2(-x,-z)+Math.PI+Math.sin(t*.7+ph)*.3,moving:false,work:0,hop:ready?Math.abs(Math.sin(t*3.2+ph))*.18:0,sit:idle};}
 if(b.prof==='miner'){const a=Math.PI*.15+((i*1.3)%2.2),x=VEIN[0]+Math.cos(a)*1.85,z=VEIN[1]+Math.sin(a)*1.85;return{x,z,yaw:Math.atan2(VEIN[0]-x,VEIN[1]-z),work:1,swing:Math.sin(t*5+ph),hop:0};}
 if(b.prof==='builder'){const nx=st<STEPS.length?STEPS[st]:null,c=nx&&POS[nx]&&nx!=='road'&&nx!=='lamps'?POS[nx]:nx==='lamps'?LAMPS[i%6]:[0,-5.5];const a=i*2.1+.6,rr=nx&&RAD[nx]?RAD[nx]+.5:1.3,x=c[0]+Math.cos(a)*rr,z=c[1]+Math.sin(a)*rr;
  return{x,z,yaw:Math.atan2(c[0]-x,c[1]-z),work:1,swing:Math.sin(t*6+ph),hop:Math.max(0,Math.sin(t*6+ph))*.04};}
 if(b.prof==='mechanic'){const list=built(st).filter(k=>RAD[k]);if(!list.length){const w=walk([[-1.5,-3.6],[1.5,-3.6]],t+ph,.5);return{...w,work:0,hop:0};}
  const slot=Math.floor((t+ph*3)/9)%list.length,k=list[slot],c=POS[k],cyc=((t+ph*3)%9)/9,a=i*1.9,rr=RAD[k]+.45,tx=c[0]+Math.cos(a)*rr,tz=c[1]+Math.sin(a)*rr;
  if(cyc<.25){const pk=list[(slot+list.length-1)%list.length],pc=POS[pk],sx=pc[0]+Math.cos(a)*(RAD[pk]+.45),sz=pc[1]+Math.sin(a)*(RAD[pk]+.45),f=cyc/.25;return{x:sx+(tx-sx)*f,z:sz+(tz-sz)*f,yaw:Math.atan2(tx-sx,tz-sz),moving:true,work:0,hop:0};}
  return{x:tx,z:tz,yaw:Math.atan2(c[0]-tx,c[1]-tz),work:1,swing:Math.sin(t*7+ph),hop:0,spark:k};}
 if(b.prof==='courier'){const w=walk([[.4+i*.3,-1.2],[PARCEL[0]-1,PARCEL[1]+.8],[2.2,-8.2],[1.2,-15],[-3,-22]],t*.9+ph*4,1.1);return{...w,work:0,hop:0,parcel:true};}
 return{x:0,z:0,yaw:0,work:0,hop:0};}
// v66: workers visibly walk from the plot centre to their work spot, work, then stroll back for a break (a 26 s shift loop per bot)
function commute(b,i,n,q,t){if(b.state!=='working'||!q.work||b.prof==='courier')return q;const ph=i*1.7,f=(t+ph*5)%26,a=i/Math.max(1,n)*TAU+.4,hx=Math.cos(a)*1.2,hz=Math.sin(a)*1.2;
 const go=(sx,sz,ex,ez,k)=>{const x=sx+(ex-sx)*k,z=sz+(ez-sz)*k;return{...q,x,z,yaw:Math.atan2(ex-sx,ez-sz),moving:true,work:0,swing:0,hop:0,spark:null};};
 if(f<5)return go(hx,hz,q.x,q.z,f/5);if(f>22){return go(q.x,q.z,hx,hz,(f-22)/4);}return q;}
R.v59Poses=function(t){const M=view();if(!M)return[];const bots=(M.view.bots||[]).slice(0,12),st=Math.min(STEPS.length,(M.view.plot&&M.view.plot.stage)|0),now=serverNow(M);
 return bots.map((b0,i)=>{const b={...b0};if(b.state==='working'&&b.endsAt&&now>=b.endsAt)b.state='ready';return{b,...commute(b,i,bots.length,botPose(b,i,bots.length,st,t),t)};});};
const on=s=>!!s;
R.scene=function(state,p,t,...args){const out=old.scene.call(this,state,p,t,...args);if(!on(state))return out;const eye=this.eye||[0,0,0];if(Math.hypot(eye[0]-H.x,eye[2]-H.z)>DRAW_R)return out;
 const v=this.v59Build(),ch=state.chapter||1,low=this.quality==='low',st=stageOf(state),pl=plotOf(state),lvl=pl?pl.level|0:1,G=(lx,lz)=>this.terrain(H.x+lx,H.z+lz,ch);
 const draw=(name,lx,lz,yaw=0,dy=0,sc=1,pitch=0,roll=0)=>{const y=G(lx,lz)+dy;for(const[key,mat]of v.L[name]||[]){const[kind,col]=MATS[mat];const g=kind===12?(mat==='glass'?.12:mat==='teal'?.55+.1*Math.sin(t*1.6):.8):mat==='gold'?.1:0;this.put(key,H.x+lx,y,H.z+lz,sc,sc,sc,col,yaw,kind,g,pitch,roll);}};
 draw('base',0,0,0,-.04);if(st>=1)draw('road',0,0,0,-.04);if(st>=2)draw('lamps',0,0,0,-.04);
 for(const k of['house','workshop','garden','house2','solar','tower']){const idx=STEPS.indexOf(k);if(st>idx)draw(k,POS[k][0],POS[k][1],k==='solar'?0:0,-.05);else if(st===idx)draw('scaffold',POS[k][0],POS[k][1],0,-.05);}
 for(let l=2;l<=Math.min(4,lvl);l++)draw('lvl'+l,0,0,0,-.04);
 // robo-cats
 if(!(this.characterSprite&&this.characterSprite.bots&&this.characterSprite.bots.ready))for(const q of this.v59Poses(t)){const{b}=q,yb=(q.hop||0)+(q.moving?Math.abs(Math.sin(t*9+q.x))*.06:0)-(q.sit?.1:0),sc=b.source==='stars'?1.42:1.36;
  draw('bot_'+b.prof,q.x,q.z,q.yaw,yb,sc);
  if(b.prof!=='courier'&&v.L['tool_'+b.prof]){const c=Math.cos(q.yaw),s=Math.sin(q.yaw),hx=q.x+(c*.36+s*.18)*sc,hz=q.z+(-s*.36+c*.18)*sc;const sw=q.work?q.swing:0;draw('tool_'+b.prof,hx,hz,q.yaw,(.62+(q.work?.08:0))*sc+yb,sc,q.work?-.6+sw*.75:-1.3,0);}}
 return out;};
// ---------- collisions (finished buildings, gate posts, vein, tower) ----------
function insideHome(x,z,state){const lx=x-H.x,lz=z-H.z;if(Math.hypot(lx,lz)>FENCE_R+1)return false;const st=stageOf(state);
 for(const k of['house','workshop','garden','house2','solar','tower']){const idx=STEPS.indexOf(k);if(st>=idx&&Math.hypot(lx-POS[k][0],lz-POS[k][1])<RAD[k]*(st===idx?.9:1))return true;}
 for(const s of[-1,1])if(Math.hypot(lx-s*1.8,lz-GATE[1])<.3)return true;if(Math.hypot(lx-VEIN[0],lz-VEIN[1])<1.3)return true;return false;}
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
  {const[x,z]=VEIN,y=T(x,z);bill(x,y+1.1,z,1.8,1.6,0,[1,.7,.35],.38*pul);}
  {const[x,z]=PARCEL;bill(x,T(x,z)+.4,z,1.2,.5,0,PINK,.3*pul);}
  for(const s of[-1,1])bill(s*1.8,T(s*1.8,GATE[1])+2.78,GATE[1],.55,.55,0,GOLD,.7);
  if(st>=2)for(const[x,z]of LAMPS)bill(x,T(x,z)+2.2,z,.6,.6,0,TEAL,.7);
  if(st>=7){const[x,z]=POS.tower;bill(x,T(x,z)+4.9,z,1.4,1.4,0,GOLD,.6*pul);bill(x,T(x,z)+6.2,z,.5,.5,0,TEAL,.9);}
  // hologram of the next building over its scaffolding
  if(st<STEPS.length){const k=STEPS[st],c=POS[k]&&RAD[k]?POS[k]:null;if(c){const y=T(c[0],c[1]),f=(t*.5)%1;bill(c[0],y+1.4,c[1],RAD[k]*1.05,1.6,0,TEAL,.16*pul);if(!low)bill(c[0],y+.2+f*2.6,c[1],RAD[k]*.9,.08,0,TEAL,(1-f)*.5);}}
  // bots: soft halo, ready "!" marker, work sparks, boost ring
  for(const q of this.v59Poses(t)){const y=T(q.x,q.z),b=q.b;bill(q.x,y+.6,q.z,.75,.6,0,b.source==='stars'?GOLD:TEAL,.16);
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
root.MoonHomePlot={H,POS,RAD,VEIN,PARCEL,GATE,LAMPS,FENCE_R,inside:insideHome,walk,botPose,commute};
})(typeof window!=='undefined'?window:globalThis);
