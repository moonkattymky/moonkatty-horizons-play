/* v58 LIFE #6 "The Depths": a sunken crystal grotto in the west plains (centre Core.DEEP, -64/-12, floor ~2.6 m below the plain;
   the terrain itself dips from chapter 6, core.js deepBowl, with a gentle ramp from the east).
   - ring of violet-blue boulders crowned by giant teal and pink crystals (a gap for the ramp), three stone arches over the bowl
     with hanging crystal stalactites: a cave you can still see the stars through, so it stays bright and readable
   - entrance arch at the top of the ramp, crystal lanterns along the way from the camp
   - three singing Echo Crystals on pedestals (glow brighter once listened to), the Bell Altar with four crystal bells,
     a turquoise pool, glowing mushrooms, and the Crystal Door with a swirling membrane guarding the Heart of the Depths
   - Scout waits at the bottom of the ramp
   Built lazily, baked per material, drawn from chapter 6 within DRAW_R. Low quality skips the detail group, motes and most halos
   (bloom stays high tier only). Load order: after ignition-world.js, before chapter1-style.js (fx drawn before bloom). */
(function(root){'use strict';
const R=root.MoonRenderer&&root.MoonRenderer.prototype,Core=root.MoonCore,B=root.MoonOutpostBuilder,M=root.MoonRenderMath;
if(!R||!Core||!B||!Core.DEEP)return;
const old={scene:R.scene,render:R.render,blocked:R.blocked,camera:R.cameraBlocked,scenery:R.scenery};
const TAU=Math.PI*2,DRAW_R=120,CH=6,D=Core.DEEP,P=Core.POINTS;
const norm=v=>{const l=Math.hypot(v[0],v[1],v[2])||1;return[v[0]/l,v[1]/l,v[2]/l];},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
function rng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
const MATS={stoneB:[4,[.80,.76,.98]],stoneL:[4,[.84,.82,.96]],silver:[17,[.88,.94,1]],gold:[16,[1,.78,.34]],
 tCrystal:[30,[.14,.88,.84]],tHi:[12,[.55,1,1]],tCore:[12,[.86,1,1]],pCrystal:[30,[.86,.28,.66]],pHi:[12,[1,.56,.86]],pCore:[12,[1,.9,.98]],
 vCrystal:[30,[.48,.22,.86]],vHi:[12,[.72,.52,1]],vCore:[12,[.95,.88,1]],stem:[17,[.90,.96,.94]],capT:[12,[.22,.92,.92]],capP:[12,[1,.44,.78]],
 bell0:[12,[.30,1,.92]],bell1:[12,[1,.48,.84]],bell2:[12,[.66,.46,1]],bell3:[12,[1,.78,.30]],pool:[12,[.22,.96,.90]],moss:[12,[.18,.72,.62]],heart:[12,[1,.62,.86]],heartHi:[12,[1,.92,.62]],dark:[0,[.07,.07,.10]]};
const CRY={t:['tCrystal','tHi','tCore'],p:['pCrystal','pHi','pCore'],v:['vCrystal','vHi','vCore']};
const ECHO=['echo1','echo2','echo3'].map((id,i)=>({id,x:P[id][0],z:P[id][1],c:['t','p','v'][i]}));
const ALTAR=[P.chime[0]-2.3,P.chime[1]],POOL=[D.x-1.6,D.z,2.3],DOOR={x:D.x-7.2,z:D.z,r:2.2},HEART=[D.x-9.2,D.z],ENTRY=[D.x+13.6,D.z];
const ARCH_X=[D.x+4.6,D.x-.4,D.x-5.2];
const WALL=[];{const rnd=rng(6061);for(let a=30;a<=330;a+=12.5){const t=a*Math.PI/180,rr=11.2+rnd()*.8;WALL.push([D.x+Math.cos(t)*rr,D.z+Math.sin(t)*rr,1.9+rnd()*.7,rnd()]);}}
const GIANTS=[[D.x-3,D.z+10.6,1.25,'t'],[D.x-9.6,D.z+6.4,1.1,'p'],[D.x-10.4,D.z-5.6,1.2,'t'],[D.x-2.6,D.z-10.8,1.15,'t'],[D.x+6.2,D.z-9.6,1.0,'v'],[D.x+6.6,D.z+9.4,1.0,'t'],[D.x-11.6,D.z+.4,.9,'v']];
const MUSH=[[D.x+2.6,D.z+5.2,1,'P'],[D.x-4.6,D.z+6.6,1.1,'T'],[D.x-6.8,D.z-6.4,1,'P'],[D.x+2.4,D.z-6.8,1.05,'T'],[D.x+7.2,D.z+4.2,.9,'T'],[D.x+7.6,D.z-4.6,.9,'P'],[D.x-1.2,D.z+8.2,.8,'P'],[D.x-8.4,D.z+2.8,.8,'T']];
const LANTERNS=[];for(let i=0;i<6;i++){const x=D.x+16+i*4.4;LANTERNS.push([x,D.z-3.1],[x,D.z+3.1]);}
function grp(map,mat){let g=map.get(mat);if(!g)map.set(mat,g=[]);return g;}
function bake(map,b,x,y,z,yaw=0){const c=Math.cos(yaw),s=Math.sin(yaw);for(const[mat,data]of b.groups){const g=grp(map,mat);for(let i=0;i<data.length;i+=6){const px=data[i],py=data[i+1],pz=data[i+2],nx=data[i+3],ny=data[i+4],nz=data[i+5];g.push(x+c*px+s*pz,y+py,z-s*px+c*pz,c*nx+s*nz,ny,-s*nx+c*nz);}}}
function xform(dst,data,x,y,z,sx,sy,sz,yaw){const c=Math.cos(yaw),s=Math.sin(yaw);for(let i=0;i<data.length;i+=6){const px=data[i]*sx,py=data[i+1]*sy,pz=data[i+2]*sz;const n=norm([data[i+3]/sx,data[i+4]/sy,data[i+5]/sz]);dst.push(x+c*px+s*pz,y+py,z-s*px+c*pz,c*n[0]+s*n[2],n[1],-s*n[0]+c*n[2]);}}
function prism(lo,hi,core,x,y,z,r,h,yaw,pitch,roll,rnd,withCore){const k=6,rad=[];for(let i=0;i<k;i++)rad.push(r*(.78+rnd()*.38));const tip=h*(.22+rnd()*.12),bev=h-tip;
 const m=M.model(x,y,z,1,1,1,yaw,pitch,roll),T=p=>[m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]];
 const ring=(yy,sc)=>rad.map((rr,i)=>{const t=i/k*TAU;return T([Math.cos(t)*rr*sc,yy,Math.sin(t)*rr*sc]);}),push=(d,a,b,c)=>{const n=norm(cross(sub(b,a),sub(c,a)));d.push(...a,...n,...b,...n,...c,...n);};
 const b0=ring(-.12,1.02),mid=ring(bev*.55,1.0),top=ring(bev,.9),apex=T([0,h,0]);
 for(let i=0;i<k;i++){const n=(i+1)%k,d=i%2?hi:lo;push(d,b0[i],mid[n],mid[i]);push(d,b0[i],b0[n],mid[n]);push(i%2?lo:hi,mid[i],top[n],top[i]);push(i%2?lo:hi,mid[i],mid[n],top[n]);push(d,top[i],top[n],apex);}
 if(withCore){const cr=rad.map(v=>v*.42),cring=yy=>cr.map((rr,i)=>{const t=i/k*TAU;return T([Math.cos(t)*rr,yy,Math.sin(t)*rr]);}),c0=cring(.02),c1=cring(bev*.82),ca=T([0,bev+tip*.55,0]);for(let i=0;i<k;i++){const n=(i+1)%k;push(core,c0[i],c1[n],c1[i]);push(core,c0[i],c0[n],c1[n]);push(core,c1[i],c1[n],ca);}}}
function cluster(map,x,y,z,scale0,seed,c,small,down){/* v80: knee-to-waist clusters of thin shards */const scale=Math.min(scale0,.56),TH=.55;const rnd=rng(seed),[a,b,k]=CRY[c],lo=grp(map,a),hi=grp(map,b),co=grp(map,k),fl=down?Math.PI:0;
 prism(lo,hi,co,x,y,z,.26*scale*TH,(1.9+rnd()*.5)*scale,rnd()*TAU,fl+(rnd()-.5)*.14,(rnd()-.5)*.14,rnd,true);
 for(let i=0;i<4;i++){const t=i/4*TAU+rnd()*.6,d=(.24+rnd()*.12)*scale,tilt=.3+rnd()*.25;prism(lo,hi,co,x+Math.cos(t)*d,y,z+Math.sin(t)*d,(.14+rnd()*.05)*scale*TH,(.9+rnd()*.6)*scale,rnd()*TAU,fl+Math.sin(t)*tilt,-Math.cos(t)*tilt,rnd,true);}
 if(small)for(let i=0;i<5;i++){const t=i/5*TAU+rnd()*.5,d=(.5+rnd()*.25)*scale,tilt=.5+rnd()*.4;prism(lo,hi,co,x+Math.cos(t)*d,y,z+Math.sin(t)*d,(.06+rnd()*.05)*scale*TH,(.3+rnd()*.4)*scale,rnd()*TAU,fl+Math.sin(t)*tilt,-Math.cos(t)*tilt,rnd,false);}}
const G=(r,x,z)=>r.terrain(x,z,CH);
function mushroom(map,r,x,z,s,c,seed){const rnd=rng(seed),b=new B();for(let i=0;i<4;i++){const a=i/4*TAU+rnd(),d=i?(.55+rnd()*.35)*s:0,h=(i?.6+rnd()*.5:1.25)*s,cr=(i?.32+rnd()*.12:.62)*s,px=Math.cos(a)*d,pz=Math.sin(a)*d;
  b.tube('stem',[px,0,pz],[px,h,pz],.07*s+cr*.12,8,.05*s+cr*.08);b.tube(c==='P'?'capP':'capT',[px,h-.06*s,pz],[px,h+cr*.55,pz],cr,14,.04);b.tube('stem',[px,h-.08*s,pz],[px,h-.02*s,pz],cr*.9,14);}
 bake(map,b,x,G(r,x,z)-.04,z,0);}
function build(r){const main=new Map(),detail=new Map(),echo=ECHO.map(()=>new Map()),heart=new Map(),door=new Map(),bells=new Map();
 const st=grp(main,'stoneB'),geo=k=>r.meshes['geology'+k]&&r.meshes['geology'+k].data,rnd=rng(6001);
 // grotto walls: boulders on the rim with crystal crowns
 WALL.forEach(([x,z,s,q],i)=>{const dm=geo(i%4);const y=G(r,x,z);if(dm)xform(st,dm,x,y+s*.55,z,s*.95,s*1.15,s*.85,q*TAU);if(i%2===0)cluster(i%4?detail:main,x,y+s*1.05,z,.9+q*.5,6100+i,['t','t','p','v'][(i/2)%4],true);});
 GIANTS.forEach(([x,z,s,c],i)=>cluster(main,x,G(r,x,z)-.1,z,1.6*s,6200+i,c,true));
 // three stone arches spanning the bowl north-south, with hanging stalactite crystals
 ARCH_X.forEach((ax,i)=>{const b=new B(),R0=10.6,H=8.4,N=14;let prev=null;for(let k=0;k<=N;k++){const t=k/N*Math.PI,zz=-Math.cos(t)*R0,yy=Math.sin(t)*H+(k===0||k===N?-.6:0);const p=[0,yy,zz];if(prev)b.tube(i===1?'silver':'stoneL',prev,p,.55-.18*Math.sin(t),9,.55-.18*Math.sin(t));prev=p;}
  bake(main,b,ax,D.floorY??G(r,ax,D.z),D.z,0);const by=G(r,ax,D.z);for(let k=0;k<5;k++){const t=(k+1.2)/6.4*Math.PI,zz=-Math.cos(t)*10.6,yy=Math.sin(t)*8.4-.35;cluster(k%2?detail:main,ax+(rnd()-.5)*.3,by+yy,D.z+zz,.42+rnd()*.2,6300+i*10+k,['t','p','v'][(k+i)%3],false,true);}});
 // entrance arch at the top of the ramp
 {const[x,z]=ENTRY,y=G(r,x,z),b=new B();for(const s of[-1,1]){b.tube('stoneL',[s*3.1,0,0],[s*3.1,3.6,0],.62,10,.5);b.tube('silver',[s*3.1,3.5,0],[s*3.1,3.7,0],.7,12);}
  {let prev=null;for(let k=0;k<=16;k++){const t=k/16*Math.PI,q=[-Math.cos(t)*3.1,3.6+Math.sin(t)*2.1,0];if(prev){b.tube('silver',prev,q,.2,8,.2);}prev=q;}}
  b.paw(0,6.25,.12,.8,'gold');b.paw(0,6.25,-.12,.8,'gold');bake(main,b,x,y-.05,z,Math.PI/2);/* local x = across the path */
  for(const s of[-1,1])cluster(main,x,y+.1,z+s*3.9,.7,6400+s,'t',true);}
 // pool: low silver rim + glowing water disc
 {const[x,z,pr]=POOL,y=G(r,x,z),b=new B();b.tube('stoneL',[0,-.1,0],[0,.22,0],pr+.35,24,pr+.3);b.tube('silver',[0,.2,0],[0,.27,0],pr+.32,24);b.tube('pool',[0,.2,0],[0,.24,0],pr,24);bake(main,b,x,y,z,0);
  cluster(main,x,y+.15,z,.55,6450,'t',false);}
 // bell altar: dais, silver frame, four crystal bells
 {const[x,z]=ALTAR,y=G(r,x,z),b=new B();b.tube('stoneL',[0,-.1,0],[0,.3,0],1.9,18,1.75);b.tube('silver',[0,.3,0],[0,.38,0],1.8,18);
  for(const s of[-1,1]){b.tube('silver',[0,.35,s*1.55],[0,3.1,s*1.55],.14,8);b.tube('gold',[0,3.05,s*1.55],[0,3.25,s*1.55],.22,10);}b.tube('silver',[0,3.15,-1.6],[0,3.15,1.6],.11,8);b.tube('gold',[0,3.15,-1.66],[0,3.15,-1.6],.18,8);
  for(let i=0;i<4;i++){const zz=-1.12+i*.75;b.tube('silver',[0,3.1,zz],[0,2.55,zz],.025,5);}bake(main,b,x,y,z,0);
  const bb=new B();for(let i=0;i<4;i++){const zz=-1.12+i*.75,m='bell'+i;bb.tube(m,[0,2.55,zz],[0,2.3,zz],.11,12,.2);bb.tube(m,[0,2.3,zz],[0,1.85,zz],.2,12,.34);bb.tube(m,[0,1.86,zz],[0,1.8,zz],.34,12,.3);bb.tube('gold',[0,1.85,zz],[0,1.68,zz],.05,6);}bake(bells,bb,x,y,z,0);}
 // echo crystals on pedestals
 ECHO.forEach((e,i)=>{const y=G(r,e.x,e.z)-.05,b=new B();b.tube('stoneL',[0,0,0],[0,.3,0],.8,12,.72);b.tube('silver',[0,.3,0],[0,.9,0],.42,12,.36);b.tube('gold',[0,.88,0],[0,.98,0],.5,14);b.paw(0,.6,.4,.36,'gold');bake(main,b,e.x,y,e.z,i*1.9);
  cluster(echo[i],e.x,y+.95,e.z,.7,6500+i,e.c,false);});
 // crystal door (ring + frame) and the Heart behind it
 {const y=G(r,DOOR.x,DOOR.z),b=new B(),rad=DOOR.r,cy=rad+.9;b.box('stoneL',0,.2,0,2*rad+2.4,.5,1.6);for(const s of[-1,1]){b.tube('stoneL',[s*(rad+.5),.3,0],[s*(rad+.5),2.4,0],.5,10,.42);}
  b.ring('silver',0,cy,0,rad,rad,.17,.6,40);b.ring('pHi',0,cy,0,rad*.86,rad*.86,.05,.35,40);b.ring('gold',0,cy,0,rad*1.08,rad*1.08,.05,.66,40);bake(door,b,DOOR.x,y-.05,DOOR.z,Math.PI/2);
  for(const s of[-1,1])cluster(main,DOOR.x+.4,y+.1,DOOR.z+s*(rad+1.4),.85,6600+s,'p',true);
  const[hx,hz]=HEART,hy=G(r,hx,hz),hb=new B();hb.tube('stoneL',[0,0,0],[0,.4,0],1.0,14,.9);hb.tube('silver',[0,.4,0],[0,.5,0],.95,14);bake(main,hb,hx,hy-.05,hz,0);
  const lo=grp(heart,'heart'),hi=grp(heart,'heartHi'),co=grp(heart,'pCore'),hr=rng(6700);prism(lo,hi,co,0,0,0,.36,1.0,0,0,0,hr,true);prism(lo,hi,co,0,0,0,.36,1.0,0,Math.PI,0,hr,true);}
 // mushrooms, lanterns, moss
 MUSH.forEach(([x,z,s,c],i)=>mushroom(i<4?main:detail,r,x,z,s,c,6800+i));
 for(const[x,z]of LANTERNS){const y=G(r,x,z)-.05,b=new B();b.tube('silver',[0,0,0],[0,1.7,0],.08,8,.06);b.tube('gold',[0,1.62,0],[0,1.74,0],.18,10);bake(detail,b,x,y,z,0);cluster(main,x,y+1.72,z,.2,6900+Math.round(x*7+z),'t',false);}
 const L={},add=(n,map)=>{L[n]=[];for(const[mat,data]of map){if(!data.length)continue;const key='v58_'+n+'_'+mat;r.addMesh(key,data);L[n].push([key,mat]);}};
 add('main',main);add('detail',detail);add('heart',heart);add('door',door);add('bells',bells);echo.forEach((m,i)=>add('echo'+(i+1),m));
 return{L};}
const on=s=>!!s&&Number(s.chapter)>=6;
// keep the base scatter boulders out of the grotto and off the lantern path (rock zones, see ignition-world.js)
(root.MoonRockZones=root.MoonRockZones||[]).push({ch:6,out:r=>Math.hypot(r.x-D.x,r.z-D.z)<=16+r.s*.6||(Math.abs(r.z-D.z)<5+r.s*.6&&r.x>D.x&&r.x<D.x+44)});
R.v58Build=function(){if(this.v58)return this.v58;this.ensureWorldModels&&this.ensureWorldModels();return this.v58=build(this);};
R.scene=function(state,p,t,...args){const out=old.scene.call(this,state,p,t,...args);if(!on(state))return out;const eye=this.eye||[0,0,0],dD=Math.hypot(eye[0]-D.x,eye[2]-D.z);if(dD>DRAW_R)return out;
 const v=this.v58Build(),low=this.quality==='low',ec=state.deepEchoes||[],open=!!state.songPlayed;
 const draw=(name,boost=0)=>{for(const[key,mat]of v.L[name]||[]){const[kind,col]=MATS[mat];const s1=Math.sin(t*1.7),s2=Math.sin(t*2.3);
  const g=/Core$/.test(mat)?.95:/Crystal$/.test(mat)?.38+.08*s1+boost:/Hi$/.test(mat)?.55+.15*s2+boost:mat==='pool'?.8+.08*Math.sin(t*1.2):/^cap/.test(mat)?.62+.1*Math.sin(t*1.4):/^bell/.test(mat)?(open?.95:.55+.25*ec.length/3)+.05*s2:mat==='moss'?.4:mat==='heart'?.75:mat==='heartHi'?.95:mat==='gold'?.08:mat==='silver'?.05:0;this.put(key,0,0,0,1,1,1,col,0,kind,Math.min(1,g));}};
 draw('main');draw('bells');draw('door');if(!low)draw('detail');ECHO.forEach((e,i)=>draw('echo'+(i+1),ec.includes(e.id)?.3:0));
 if(!state.heartTaken)for(const[key,mat]of v.L.heart||[]){const[kind,col]=MATS[mat];const[hx,hz]=HEART,hy=this.terrain(hx,hz,CH)+1.55+.15*Math.sin(t*1.6);this.put(key,hx,hy,hz,1,1,1,col,t*.7,kind,mat==='heart'?.8:.95);}
 if(dD<70){this.cat(P.scout6[0],P.scout6[1],Math.atan2(ENTRY[0]-P.scout6[0],ENTRY[1]-P.scout6[1])+Math.PI,t,0,0,4,[.95,.55,.25]);}
 return out;};
// ---------- collisions ----------
function inside6(x,z,state){const dx=x-D.x,dz=z-D.z,rr=Math.hypot(dx,dz);
 if(rr>10.4&&rr<13.2&&!(dx>0&&Math.abs(dz)<4.4))return true;
 if(Math.abs(x-ENTRY[0])<.8&&Math.abs(Math.abs(z-ENTRY[1])-3.1)<.75)return true;
 if(Math.hypot(x-POOL[0],z-POOL[1])<POOL[2]+.45)return true;
 if(Math.hypot(x-ALTAR[0],z-ALTAR[1])<1.95)return true;
 for(const e of ECHO)if(Math.hypot(x-e.x,z-e.z)<.9)return true;
 if(Math.abs(x-DOOR.x)<.9&&Math.abs(z-DOOR.z)<DOOR.r+1.5&&(!state||!state.songPlayed||Math.abs(z-DOOR.z)>DOOR.r-.3))return true;
 if(Math.hypot(x-HEART[0],z-HEART[1])<1.1)return true;
 for(const[gx,gz,s]of GIANTS)if(Math.hypot(x-gx,z-gz)<.75*s+.3)return true;
 for(const[mx,mz,s]of MUSH)if(Math.hypot(x-mx,z-mz)<.55*s)return true;
 for(const[lx,lz]of LANTERNS)if(Math.hypot(x-lx,z-lz)<.28)return true;
 return false;}
R.blocked=function(x,z,state,alt=0){if(on(state)&&alt<2.4&&Math.hypot(x-D.x,z-D.z)<45&&inside6(x,z,state))return true;return old.blocked.call(this,x,z,state,alt);};
if(old.camera)R.cameraBlocked=function(x,z,state,alt=0){if(on(state)&&alt<1.6&&Math.hypot(x-D.x,z-D.z)<45&&inside6(x,z,state)&&Math.hypot(x-D.x,z-D.z)<10.2)return true;return old.camera.call(this,x,z,state,alt);};
// ---------- fx: halos, door membrane, motes, light shafts, ground glow ----------
R.render=function(state,p,t,dt,yaw,pitch,scan){old.render.call(this,state,p,t,dt,yaw,pitch,scan);if(!on(state)||!this.v58||!this.vp||!this.gl||!this.v50Prog||this._v58Off)return;
 try{const P5=this.v50Prog();if(!P5)return;const gl=this.gl,low=this.quality==='low',eye=this.eye||[0,0,0],Q=[],V=this.vp,rl=Math.hypot(V[0],V[8])||1,rx=V[0]/rl,rz=V[8]/rl;
  if(Math.hypot(eye[0]-D.x,eye[2]-D.z)>110)return;
  const T=(x,z)=>this.terrain(x,z,CH);
  const bill=(x,y,z,sx,sy,k,c,w)=>{for(const[u,q]of[[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]])Q.push(x+rx*u*sx,y+q*sy,z+rz*u*sx,u,q,k,0,c[0],c[1],c[2],w);};
  const flat=(x,z,rad,c,w)=>{const N=3;for(let j=0;j<N;j++)for(let i=0;i<N;i++){const q=[[i,j],[i+1,j],[i+1,j+1],[i,j+1]].map(([a,b])=>{const u=a/N*2-1,v=b/N*2-1,px=x+u*rad,pz=z+v*rad;return[px,T(px,pz)+.06,pz,u,v];});for(const n of[0,1,2,0,2,3])Q.push(...q[n],4,0,c[0],c[1],c[2],w);}};
  const ec=state.deepEchoes||[],open=!!state.songPlayed,pul=.85+.15*Math.sin(t*2),TEAL=[.3,.95,1],PINK=[1,.5,.85],VIO=[.7,.5,1],COL={t:TEAL,p:PINK,v:VIO};
  flat(D.x,D.z,9.5,[.05,.22,.26],.8);flat(POOL[0],POOL[1],3.4,[.06,.30,.34],.9);
  bill(POOL[0],T(POOL[0],POOL[1])+.6,POOL[1],3.2,1.1,0,TEAL,.35*pul);
  // echo crystals
  ECHO.forEach((e,i)=>{const y=T(e.x,e.z),got=ec.includes(e.id),c=COL[e.c];bill(e.x,y+1.8,e.z,got?2.2:1.6,got?2.2:1.7,0,c,(got?.7:.42)*pul);flat(e.x,e.z,1.8,c.map(v=>v*.3),.8);
   if(!low)for(let j=0;j<3;j++){const ph=t*1.2+i*2.1+j*2.09,f=(t*.35+j/3+i*.2)%1;bill(e.x+Math.cos(ph)*.55,y+1.2+f*2.2,e.z+Math.sin(ph)*.55,.2,.2,2,[1,1,1],Math.sin(f*Math.PI)*.9);}
   if(got&&!low){const f=(t*.6+i*.3)%1;bill(e.x,y+1.6,e.z,.6+f*2.4,.6+f*2.4,0,c,(1-f)*.25);}});
  // bells
  {const[x,z]=ALTAR,y=T(x,z);for(let i=0;i<4;i++){const zz=z-1.12+i*.75,c=[TEAL,PINK,VIO,[1,.8,.35]][i];bill(x,y+2.05,zz,.55,.55,0,c,(open?.75:.35+.2*ec.length/3)*pul);}bill(x,y+2.4,z,2.2,1.6,0,TEAL,.18*pul);}
  // crystal door membrane (faces +-x): pink swirl, closed until the song is played, then wide open and bright
  {const y=T(DOOR.x,DOOR.z)-.05,cy=y+DOOR.r+.9,pr=DOOR.r*.86,mw=open?.95:.5;for(const[u,q]of[[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]])Q.push(DOOR.x,cy+q*pr,DOOR.z+u*pr,u,q,1,0,1,1,1,mw);
   bill(DOOR.x+.3,cy,DOOR.z,DOOR.r*2,DOOR.r*2,0,open?[1,.6,.9]:[.7,.4,1],(open?.5:.25)*pul);}
  // the heart
  if(!state.heartTaken){const[hx,hz]=HEART,hy=T(hx,hz)+1.55;bill(hx,hy,hz,1.6,1.6,0,[1,.55,.85],(open?.85:.4)*pul);if(!low)for(let j=0;j<5;j++){const ph=t*1.1+j*1.26;bill(hx+Math.cos(ph)*.9,hy+Math.sin(ph*1.3)*.5,hz+Math.sin(ph)*.9,.18,.18,2,[1,.9,.7],Math.max(0,Math.sin(ph*2)));}}
  // giants, mushrooms, lanterns, entrance
  GIANTS.forEach(([x,z,s,c])=>{const y=T(x,z);bill(x,y+1.6*s,z,2.6*s,2.8*s,0,COL[c],.42*pul);});
  MUSH.forEach(([x,z,s,c])=>{const y=T(x,z);bill(x,y+1.1*s,z,1.4*s,1.0*s,0,c==='P'?PINK:TEAL,.45*pul);if(!low)flat(x,z,1.4*s,c==='P'?[.28,.08,.2]:[.05,.25,.25],.7);});
  for(const[x,z]of LANTERNS){const y=T(x,z);bill(x,y+1.95,z,.8,.8,0,TEAL,.7);}
  {const[x,z]=ENTRY,y=T(x,z);bill(x,y+3.75,z,3.2,2.4,0,TEAL,.2*pul);bill(x,y+6.1,z,.9,.9,0,[1,.8,.4],.6*pul);}
  // drifting motes and soft light shafts between the arches (high tier)
  if(!low){for(let i=0;i<26;i++){const a=i*2.39996,rr=1.5+(i*37%80)/10,f=(t*.05+i*.037)%1,x=D.x+Math.cos(a)*rr,z=D.z+Math.sin(a)*rr;bill(x,T(x,z)+.4+f*6,z,.14,.14,2,i%3?TEAL:PINK,Math.sin(f*Math.PI)*.8);}
   for(const ax of[D.x+2.1,D.x-2.8]){const y=T(ax,D.z);bill(ax,y+4,D.z+(ax>D.x?2:-1.5),1.2,4.4,0,[.55,.9,1],.06);}}
  if(!Q.length)return;const data=new Float32Array(Q);
  gl.useProgram(P5.p);gl.uniformMatrix4fv(P5.vp,false,this.vp);gl.uniform1f(P5.time,t);gl.bindBuffer(gl.ARRAY_BUFFER,P5.buf);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);
  gl.enable(gl.DEPTH_TEST);gl.depthMask(false);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  gl.enableVertexAttribArray(P5.pos);gl.vertexAttribPointer(P5.pos,3,gl.FLOAT,false,44,0);gl.enableVertexAttribArray(P5.info);gl.vertexAttribPointer(P5.info,4,gl.FLOAT,false,44,12);gl.enableVertexAttribArray(P5.tone);gl.vertexAttribPointer(P5.tone,4,gl.FLOAT,false,44,28);
  gl.drawArrays(gl.TRIANGLES,0,data.length/11);gl.disableVertexAttribArray(P5.pos);gl.disableVertexAttribArray(P5.info);gl.disableVertexAttribArray(P5.tone);
  gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(true);gl.disable(gl.BLEND);this.v58Stats={fxQuads:data.length/66|0};}catch(e){this._v58Off=true;if(typeof console!=='undefined')console.warn('v58 fx off',e);}};
root.MoonDepthsWorld={ECHO,ALTAR,POOL,DOOR,HEART,ENTRY,GIANTS,MUSH,LANTERNS,WALL,inside:inside6};
})(typeof window!=='undefined'?window:globalThis);
