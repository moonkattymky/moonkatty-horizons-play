/* v57 LIFE #5 "Ignition": the Sun Forge in the far south of the open world (centre Core.FORGE, -12/-66).
   - golden paved plaza hugging the terrain, a big gold Sun Gate ring with a swirling portal membrane (dim until the forge is lit)
   - the forge altar (gold bowl with three sun lenses on arms) in front of the gate
   - three ivory pedestals carrying floating amber Sun Spark crystals (vanish when collected)
   - two gold/ivory spires, amber + violet crystal clusters, lamp posts along the path from the camp, paw coins round the gate
   - geologist Quartz waits at the plaza edge; at the pad the forged Igniter makes the rocket glow amber
   Built lazily (first frame within reach), baked per material into world-space meshes, drawn only from chapter 5 and within
   DRAW_R. Low quality skips the detail group, coins, sparkles and most halos (bloom stays high tier only, chapter1-style.js).
   Load order: after districts.js and before chapter1-style.js, so the fx below are drawn before the v51 bloom pass. */
(function(root){'use strict';
const R=root.MoonRenderer&&root.MoonRenderer.prototype,Core=root.MoonCore,B=root.MoonOutpostBuilder,M=root.MoonRenderMath;
if(!R||!Core||!B||!Core.FORGE)return;
const old={scene:R.scene,render:R.render,blocked:R.blocked,camera:R.cameraBlocked};
const TAU=Math.PI*2,DRAW_R=150,CH=5,F=Core.FORGE,P=Core.POINTS;
const norm=v=>{const l=Math.hypot(v[0],v[1],v[2])||1;return[v[0]/l,v[1]/l,v[2]/l];},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
function rng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
const MATS={ivory:[17,[.97,.94,.86]],gold:[16,[1,.76,.30]],pgold:[16,[1,.82,.38]],stone:[4,[.60,.55,.50]],amber:[12,[1,.62,.18]],aCrystal:[30,[.98,.52,.14]],aHi:[12,[1,.80,.40]],aCore:[12,[1,.88,.55]],vCrystal:[30,[.42,.16,.82]],vHi:[12,[.70,.42,1]],vCore:[12,[1,.82,1]],lens:[12,[1,.86,.45]],tile:[16,[.86,.62,.26]],tile2:[17,[.92,.86,.72]],dark:[0,[.07,.07,.09]]};
const GATE={x:F.x,z:F.z-1.2,r:2.7},BOWL=[F.x,F.z+3.1],SPIRES=[[F.x-7.2,F.z-3.4,1.15],[F.x+7.2,F.z-3.4,1.15]];
const SPARKS=['spark1','spark2','spark3'].map(id=>({id,x:P[id][0],z:P[id][1]}));
const CRYST=[[F.x-9.6,F.z+2.6,1.0,1],[F.x+9.4,F.z+2.2,.9,1],[F.x-4.4,F.z-8.6,.8,0],[F.x+4.6,F.z-8.4,.85,1],[F.x-10.5,F.z-6.5,.7,0],[F.x+10.8,F.z-6.0,.75,0]];
const LAMPS=[];for(let i=0;i<5;i++){const z=F.z+9+i*4.2;LAMPS.push([F.x-2.6+Math.sin(z*.3)*.4,z],[F.x+2.6+Math.sin(z*.3)*.4,z]);}
function grp(map,mat){let g=map.get(mat);if(!g)map.set(mat,g=[]);return g;}
function bake(map,b,x,y,z,yaw=0){const c=Math.cos(yaw),s=Math.sin(yaw);for(const[mat,data]of b.groups){const g=grp(map,mat);for(let i=0;i<data.length;i+=6){const px=data[i],py=data[i+1],pz=data[i+2],nx=data[i+3],ny=data[i+4],nz=data[i+5];g.push(x+c*px+s*pz,y+py,z-s*px+c*pz,c*nx+s*nz,ny,-s*nx+c*nz);}}}
function prism(lo,hi,core,x,y,z,r,h,yaw,pitch,roll,rnd,withCore){const k=6,rad=[];for(let i=0;i<k;i++)rad.push(r*(.78+rnd()*.38));const tip=h*(.22+rnd()*.12),bev=h-tip;
 const m=M.model(x,y,z,1,1,1,yaw,pitch,roll),T=p=>[m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]];
 const ring=(yy,sc)=>rad.map((rr,i)=>{const t=i/k*TAU;return T([Math.cos(t)*rr*sc,yy,Math.sin(t)*rr*sc]);}),push=(d,a,b,c)=>{const n=norm(cross(sub(b,a),sub(c,a)));d.push(...a,...n,...b,...n,...c,...n);};
 const b0=ring(-.12,1.02),mid=ring(bev*.55,1.0),top=ring(bev,.9),apex=T([0,h,0]);
 for(let i=0;i<k;i++){const n=(i+1)%k,d=i%2?hi:lo;push(d,b0[i],mid[n],mid[i]);push(d,b0[i],b0[n],mid[n]);push(i%2?lo:hi,mid[i],top[n],top[i]);push(i%2?lo:hi,mid[i],mid[n],top[n]);push(d,top[i],top[n],apex);}
 if(withCore){const cr=rad.map(v=>v*.42),cring=yy=>cr.map((rr,i)=>{const t=i/k*TAU;return T([Math.cos(t)*rr,yy,Math.sin(t)*rr]);}),c0=cring(.02),c1=cring(bev*.82),ca=T([0,bev+tip*.55,0]);for(let i=0;i<k;i++){const n=(i+1)%k;push(core,c0[i],c1[n],c1[i]);push(core,c0[i],c0[n],c1[n]);push(core,c1[i],c1[n],ca);}}}
function cluster(map,x,y,z,scale,seed,amber,small){const rnd=rng(seed),lo=grp(map,amber?'aCrystal':'vCrystal'),hi=grp(map,amber?'aHi':'vHi'),c=grp(map,amber?'aCore':'vCore');
 prism(lo,hi,c,x,y,z,.26*scale,(1.9+rnd()*.5)*scale,rnd()*TAU,(rnd()-.5)*.14,(rnd()-.5)*.14,rnd,true);
 for(let i=0;i<4;i++){const t=i/4*TAU+rnd()*.6,d=(.24+rnd()*.12)*scale,tilt=.3+rnd()*.25;prism(lo,hi,c,x+Math.cos(t)*d,y,z+Math.sin(t)*d,(.14+rnd()*.05)*scale,(.9+rnd()*.6)*scale,rnd()*TAU,Math.sin(t)*tilt,-Math.cos(t)*tilt,rnd,true);}
 if(small)for(let i=0;i<5;i++){const t=i/5*TAU+rnd()*.5,d=(.5+rnd()*.25)*scale,tilt=.5+rnd()*.4;prism(lo,hi,c,x+Math.cos(t)*d,y,z+Math.sin(t)*d,(.06+rnd()*.05)*scale,(.3+rnd()*.4)*scale,rnd()*TAU,Math.sin(t)*tilt,-Math.cos(t)*tilt,rnd,false);}}
function spire(map,r,x,z,s){const y=r.terrain(x,z,CH)-.1,b=new B();
 b.tube('stone',[0,0,0],[0,.5,0],1.55*s,12,1.45*s);b.tube('gold',[0,.5,0],[0,.68,0],1.42*s,16);
 b.tube('ivory',[0,.68,0],[0,4.6*s,0],.95*s,14,.82*s);for(const h of[1.9,3.3,4.6])b.tube('gold',[0,h*s-.1,0],[0,h*s+.06,0],(1.02-h*.04)*s,16);
 for(let i=0;i<4;i++){const a=i/4*TAU+.4;b.box('amber',Math.cos(a)*.86*s,2.6*s,Math.sin(a)*.86*s,.28*s,.62*s,.28*s,-a);}
 b.tube('ivory',[0,4.66*s,0],[0,5.3*s,0],.9*s,14,.6*s);b.tube('gold',[0,5.3*s,0],[0,5.42*s,0],.64*s,14);
 b.tube('amber',[0,5.42*s,0],[0,6.1*s,0],.36*s,10,.3*s);b.tube('gold',[0,6.1*s,0],[0,8.1*s,0],.5*s,12,.02);b.tube('gold',[0,8.0*s,0],[0,8.6*s,0],.05,6);
 for(let i=0;i<6;i++){const a=i/6*TAU;b.tube('gold',[Math.cos(a)*.9*s,4.66*s,Math.sin(a)*.9*s],[Math.cos(a)*.35*s,6.0*s,Math.sin(a)*.35*s],.06*s,5);}
 b.paw(0,3.4*s,.97*s,.62*s,'gold');bake(map,b,x,y,z,0);}
// terrain-hugging paving: rings of tiles, every corner sits on the ground (+2..4 cm)
function paving(map,r){const g=grp(map,'tile'),g2=grp(map,'tile2'),Y=(x,z,o)=>r.terrain(x,z,CH)+o;
 const tile=(dst,a0,a1,r0,r1,o)=>{const p=(a,rr)=>{const x=F.x+Math.cos(a)*rr,z=F.z+Math.sin(a)*rr;return[x,Y(x,z,o),z];};const A=p(a0,r0),Bp=p(a0,r1),C=p(a1,r1),D=p(a1,r0);for(const[a,b,c]of[[A,C,Bp],[A,D,C]]){const n=norm(cross(sub(b,a),sub(c,a)));const nn=n[1]<0?n.map(q=>-q):n;dst.push(...a,...nn,...b,...nn,...c,...nn);}};
 const rings=[[0,1.6,1],[1.7,3.4,10],[3.5,5.3,16],[5.4,7.4,22]];rings.forEach(([r0,r1,n],k)=>{for(let i=0;i<n;i++){const a0=i/n*TAU+.012,a1=(i+1)/n*TAU-.012;tile((i+k)%2?g:g2,a0,a1,r0+.04,r1-.04,.035+k*.002);}});
 // gold path towards the camp (north, +z)
 for(let i=0;i<9;i++){const z0=F.z+7.6+i*2.1,z1=z0+1.8;for(const s of[-1,1]){const x0=F.x+(s<0?-1.7:.1),x1=x0+1.6;const q=[[x0,z0],[x1,z0],[x1,z1],[x0,z1]].map(([x,z])=>[x,Y(x,z,.04),z]);const dst=(i+(s>0))%2?g:g2;for(const[a,b,c]of[[q[0],q[2],q[1]],[q[0],q[3],q[2]]]){const n=norm(cross(sub(b,a),sub(c,a))),nn=n[1]<0?n.map(v=>-v):n;dst.push(...a,...nn,...b,...nn,...c,...nn);}}}}
function build(r){const main=new Map(),detail=new Map(),sparks=SPARKS.map(()=>new Map()),igniter=new Map(),lens=new Map();
 let top=-1e9;for(let a=0;a<12;a++)for(const rr of[0,1.5,2.6])top=Math.max(top,r.terrain(GATE.x+Math.cos(a/12*TAU)*rr,GATE.z+Math.sin(a/12*TAU)*rr,CH));
 paving(main,r);
 // Sun Gate: stone base + legs, big gold ring (faces the camp, +z), inner ivory ring, sun rays, paw medallion on top
 {const b=new B(),rad=GATE.r,cy=rad+1.15;b.box('stone',0,.15,0,2*rad+2.6,.5,1.5);b.box('gold',0,.43,0,2*rad+2.2,.08,1.25);
  for(const s of[-1,1]){b.box('ivory',s*(rad+.55),1.0,0,.95,1.4,.95);b.box('gold',s*(rad+.55),1.76,0,1.08,.14,1.08);b.tube('gold',[s*(rad+.55),1.8,0],[s*(rad+.55),2.7,0],.22,10,.05);}
  b.ring('pgold',0,cy,0,rad,rad,.16,.6,44);b.ring('gold',0,cy,0,rad*1.07,rad*1.07,.06,.68,44);b.ring('ivory',0,cy,0,rad*.9,rad*.9,.07,.46,44);b.ring('amber',0,cy,0,rad*.85,rad*.85,.03,.32,44);
  for(let i=0;i<12;i++){const a=i/12*TAU,c=Math.cos(a),s=Math.sin(a),r0=rad*1.12,r1=rad*(i%2?1.32:1.48);b.tube('gold',[c*r0,cy+s*r0,0],[c*r1,cy+s*r1,0],.09,6,.02);}
  b.tube('gold',[0,cy+rad*1.1,0],[0,cy+rad*1.1+.5,0],.3,10,.2);b.paw(0,cy+rad*1.1+.95,.12,.9,'pgold');b.paw(0,cy+rad*1.1+.95,-.12,.9,'pgold');
  bake(main,b,GATE.x,top-.05,GATE.z,0);}
 // forge altar: ivory pedestal, gold bowl, three lens arms (lenses glow brighter as the forge is lit)
 {const[x,z]=BOWL,y=r.terrain(x,z,CH)-.05,b=new B();b.tube('stone',[0,0,0],[0,.32,0],1.05,16,.98);b.tube('ivory',[0,.32,0],[0,1.05,0],.42,14,.34);b.tube('gold',[0,1.0,0],[0,1.12,0],.5,16);
  b.tube('gold',[0,1.1,0],[0,1.55,0],.42,18,.95);b.tube('dark',[0,1.5,0],[0,1.56,0],.86,18);b.tube('gold',[0,1.52,0],[0,1.6,0],.98,20);
  for(let i=0;i<3;i++){const a=i/3*TAU+Math.PI/2,c=Math.cos(a),s=Math.sin(a);b.tube('gold',[c*.8,1.5,s*.8],[c*1.35,2.25,s*1.35],.06,6);b.ring('gold',c*1.35,2.42,s*1.35,.3,.3,.07,.12,16);}
  bake(main,b,x,y,z,0);const l=new B();for(let i=0;i<3;i++){const a=i/3*TAU+Math.PI/2,c=Math.cos(a),s=Math.sin(a);l.tube('lens',[c*1.35,2.42,s*1.35-.03],[c*1.35,2.42,s*1.35+.03],.25,14);}bake(lens,l,x,y,z,0);
  // the forged Igniter crystal hovering above the bowl
  cluster(igniter,x,y+1.45,z,.42,5701,true,false);}
 // spark pedestals + floating amber crystals
 SPARKS.forEach((p,i)=>{const y=r.terrain(p.x,p.z,CH)-.05,b=new B();b.tube('stone',[0,0,0],[0,.25,0],.7,12,.64);b.tube('ivory',[0,.25,0],[0,1.15,0],.36,12,.3);b.tube('gold',[0,1.1,0],[0,1.24,0],.46,14);b.tube('gold',[0,1.24,0],[0,1.34,0],.3,14,.4);b.paw(0,.72,.33,.34,'gold');bake(main,b,p.x,y,p.z,i*1.7);
  cluster(sparks[i],p.x,y+1.55,p.z,.45,5711+i,true,false);});
 // spires, crystals, lamp posts
 for(const[x,z,s]of SPIRES)spire(main,r,x,z,s);
 CRYST.forEach(([x,z,s,amb],i)=>cluster(i<2?main:detail,x,r.terrain(x,z,CH)-.05,z,s,5751+i,!!amb,true));
 for(const[x,z]of LAMPS){const y=r.terrain(x,z,CH)-.05,b=new B();b.tube('ivory',[0,0,0],[0,2.0,0],.09,8,.07);b.tube('gold',[0,1.9,0],[0,2.06,0],.2,10);b.tube('amber',[0,2.06,0],[0,2.36,0],.15,10,.12);b.tube('gold',[0,2.36,0],[0,2.5,0],.2,10,.04);bake(detail,b,x,y,z,0);}
 // igniter installed at the pad: an amber crystal ring around the engine skirt
 const pad=new Map();const PAD=root.MoonRocketWorld&&root.MoonRocketWorld.PAD;if(PAD){let pt=-1e9;for(let a=0;a<24;a++)for(const rr of[0,2,3.4,4.4])pt=Math.max(pt,r.terrain(PAD[0]+Math.cos(a/24*TAU)*rr,PAD[1]+Math.sin(a/24*TAU)*rr,4));pt+=.12;
  const b=new B();b.tube('gold',[0,.05,0],[0,.16,0],1.6,32);bake(pad,b,PAD[0],pt,PAD[1],0);for(let i=0;i<6;i++){const a=i/6*TAU;cluster(pad,PAD[0]+Math.cos(a)*1.55,pt+.1,PAD[1]+Math.sin(a)*1.55,.32,5801+i,true,false);}}
 const L={},add=(n,map)=>{L[n]=[];for(const[mat,data]of map){if(!data.length)continue;const key='v57_'+n+'_'+mat;r.addMesh(key,data);L[n].push([key,mat]);}};
 add('main',main);add('detail',detail);add('lens',lens);add('igniter',igniter);add('pad',pad);sparks.forEach((m,i)=>add('spark'+(i+1),m));
 return{L,top,padTop:PAD?r.terrain(PAD[0],PAD[1],4):0};}
const on=s=>!!s&&Number(s.chapter)>=5;
// v58 rock zones: a later Life can clear the base scatter boulders off its area (from its chapter on). The same filtered list is
// seen by the scenery batch, the collisions, the camera and the shadows, so a cleared boulder is never an invisible wall.
const ZONES=root.MoonRockZones=root.MoonRockZones||[];
// Sun Forge: plaza and the gold path (the boulders hid the Sun Gate from the approach)
ZONES.push({ch:5,out:r=>Math.hypot(r.x-F.x,r.z-F.z)<=15+r.s*.6||(Math.abs(r.x-F.x)<5+r.s*.6&&r.z>F.z&&r.z<F.z+26)});
function rocksFor(self,ch){const all=self.rocks,c=(self._rockZones=self._rockZones||{})[ch];if(c&&c.src===all&&c.n===all.length)return c.list;
 const list=all.filter(r=>!ZONES.some(z=>ch>=z.ch&&z.out(r)));self._rockZones[ch]={src:all,n:all.length,list};return list;}
function withRocks(self,state,fn){const ch=Number(state&&state.chapter)||1;if(ch<5||!self.rocks)return fn();if(self.ensureWorldModels)self.ensureWorldModels();
 const all=self.rocks,list=rocksFor(self,ch);if(list.length===all.length)return fn();self.rocks=list;try{return fn();}finally{self.rocks=all;}}
R.v57Build=function(){if(this.v57)return this.v57;this.ensureWorldModels&&this.ensureWorldModels();return this.v57=build(this);};
R.scene=function(state,p,t,...args){const out=old.scene.call(this,state,p,t,...args);if(!on(state))return out;const eye=this.eye||[0,0,0],dF=Math.hypot(eye[0]-F.x,eye[2]-F.z);
 const nearPad=root.MoonRocketWorld&&Math.hypot(eye[0]-root.MoonRocketWorld.PAD[0],eye[2]-root.MoonRocketWorld.PAD[1])<DRAW_R;if(dF>DRAW_R+20&&!nearPad)return out;
 const v=this.v57Build(),low=this.quality==='low',lit=!!state.forgeLit,sp=state.sunSparks||[];
 const draw=name=>{for(const[key,mat]of v.L[name]||[]){const[kind,col]=MATS[mat];const g=mat==='amber'?.6+.1*Math.sin(t*2.2):mat==='lens'?(lit?.95:.35+.15*sp.length)+.05*Math.sin(t*3):mat==='aCore'||mat==='vCore'?.9:mat==='aCrystal'||mat==='vCrystal'?.34+.08*Math.sin(t*1.7):mat==='aHi'||mat==='vHi'?.52+.15*Math.sin(t*2.3):mat==='pgold'?.16+.05*Math.sin(t*1.5):mat==='gold'||mat==='tile'?.07:0;this.put(key,0,0,0,1,1,1,col,0,kind,g);}};
 if(dF<DRAW_R){draw('main');draw('lens');if(!low)draw('detail');SPARKS.forEach((s,i)=>{if(!sp.includes(s.id))draw('spark'+(i+1));});if(lit&&!state.igniterIn)draw('igniter');
  if(Math.hypot(eye[0]-P.quartz5[0],eye[2]-P.quartz5[1])<70)this.cat(P.quartz5[0],P.quartz5[1],Math.atan2(BOWL[0]-P.quartz5[0],BOWL[1]-P.quartz5[1])+Math.PI,t,0,0,4,[.35,.8,.45]);}
 if(state.igniterIn&&nearPad)draw('pad');
 return out;};
// ---------- collisions ----------
function inside5(x,z,state){
 if(Math.abs(z-GATE.z)<.85&&Math.abs(x-GATE.x)<GATE.r+1.35)return true;
 if(Math.hypot(x-BOWL[0],z-BOWL[1])<1.25)return true;
 for(const s of SPARKS)if(Math.hypot(x-s.x,z-s.z)<.8)return true;
 for(const[sx,sz,s]of SPIRES)if(Math.hypot(x-sx,z-sz)<1.6*s+.3)return true;
 for(const[cx,cz,s]of CRYST)if(Math.hypot(x-cx,z-cz)<.55*s+.3)return true;
 for(const[lx,lz]of LAMPS)if(Math.hypot(x-lx,z-lz)<.3)return true;
 return false;}
R.blocked=function(x,z,state,alt=0){if(on(state)&&alt<2.4&&Math.hypot(x-F.x,z-F.z)<30&&inside5(x,z,state))return true;return old.blocked.call(this,x,z,state,alt);};
if(old.camera)R.cameraBlocked=function(x,z,state,alt=0){if(on(state)&&alt<1.6&&Math.hypot(x-F.x,z-F.z)<30&&inside5(x,z,state))return true;return old.camera.call(this,x,z,state,alt);};
// ---------- fx: swirl membrane, halos, sparkles, paw coins, ground glow (one draw through the v50 overlay program) ----------
R.render=function(state,p,t,dt,yaw,pitch,scan){old.render.call(this,state,p,t,dt,yaw,pitch,scan);if(!on(state)||!this.v57||!this.vp||!this.gl||!this.v50Prog||this._v57Off)return;
 try{const P5=this.v50Prog();if(!P5)return;const gl=this.gl,low=this.quality==='low',eye=this.eye||[0,0,0],Q=[],V=this.vp,rl=Math.hypot(V[0],V[8])||1,rx=V[0]/rl,rz=V[8]/rl;
  const bill=(x,y,z,sx,sy,k,c,w)=>{if(Math.hypot(x-eye[0],z-eye[2])>140)return;for(const[u,q]of[[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]])Q.push(x+rx*u*sx,y+q*sy,z+rz*u*sx,u,q,k,0,c[0],c[1],c[2],w);};
  const flat=(x,z,rad,c,w)=>{const N=3;for(let j=0;j<N;j++)for(let i=0;i<N;i++){const q=[[i,j],[i+1,j],[i+1,j+1],[i,j+1]].map(([a,b])=>{const u=a/N*2-1,v=b/N*2-1,px=x+u*rad,pz=z+v*rad;return[px,this.terrain(px,pz,CH)+.06,pz,u,v];});for(const n of[0,1,2,0,2,3])Q.push(...q[n],4,0,c[0],c[1],c[2],w);}};
  const lit=!!state.forgeLit,sp=state.sunSparks||[],pul=.85+.15*Math.sin(t*2),dF=Math.hypot(eye[0]-F.x,eye[2]-F.z),top=this.v57.top;
  if(dF<140){const cy=top-.05+GATE.r+1.15,pr=GATE.r*.86;
   flat(F.x,F.z,7.8,[.32,.20,.07],.75);
   // portal membrane in the gate plane (faces +-z), sleepy until the forge is lit
   const mw=lit?1:.42;for(const[u,q]of[[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]])Q.push(GATE.x+u*pr,cy+q*pr,GATE.z,u,q,1,0,1,1,1,mw);
   bill(GATE.x,cy,GATE.z+.3,GATE.r*2.2,GATE.r*2.2,0,lit?[1,.62,.25]:[.7,.35,1],(lit?.42:.22)*pul);
   bill(GATE.x,cy+GATE.r*1.1+.95,GATE.z+.3,1.2,1.2,0,[1,.8,.4],.7*pul);
   // forge bowl fire + lens glows
   const[bx,bz]=BOWL,by=this.terrain(bx,bz,CH);bill(bx,by+1.75,bz,lit?1.6:.8,lit?1.4:.6,0,[1,.6,.2],(lit?.9:.25+.12*sp.length)*pul);
   for(let i=0;i<3;i++){const a=i/3*TAU+Math.PI/2;bill(bx+Math.cos(a)*1.35,by+2.42,bz+Math.sin(a)*1.35+.05,.6,.6,0,[1,.82,.4],(lit?.8:.18+.14*sp.length)*pul);}
   if(lit&&!state.igniterIn){bill(bx,by+1.85,bz,1.3,1.3,0,[1,.7,.3],.7*pul);if(!low)for(let j=0;j<4;j++){const ph=t*1.6+j*1.57;bill(bx+Math.cos(ph)*.5,by+1.7+.25*Math.sin(ph*1.3),bz+Math.sin(ph)*.5,.22,.22,2,[1,.92,.7],Math.max(0,Math.sin(ph*2)));}}
   // spark crystals: warm halo + sparkles while waiting on their pedestal
   SPARKS.forEach((s,i)=>{const y=this.terrain(s.x,s.z,CH);if(sp.includes(s.id)){bill(s.x,y+1.35,s.z,.7,.4,0,[1,.6,.2],.25);return;}bill(s.x,y+2.0,s.z,1.9,2.0,0,[1,.55,.15],.6*pul);bill(s.x,y+2.0,s.z,.8,1.0,0,[1,.9,.6],.35*pul);flat(s.x,s.z,1.8,[.30,.16,.04],.8);
    if(!low)for(let j=0;j<3;j++){const ph=t*1.3+i*2.1+j*2.09;bill(s.x+Math.cos(ph)*.5,y+1.6+j*.35,s.z+Math.sin(ph)*.5,.24,.24,2,[1,.92,.7],Math.max(0,Math.sin(ph*2.3)));}});
   // crystals, spires, lamps
   CRYST.forEach(([x,z,s,amb])=>{const y=this.terrain(x,z,CH);bill(x,y+s,z,2.4*s,2.2*s,0,amb?[1,.55,.15]:[.62,.25,1],.5*pul);});
   for(const[x,z,s]of SPIRES){const y=this.terrain(x,z,CH)-.1;bill(x,y+5.8*s,z,1.5*s,1.5*s,0,[1,.66,.25],.85*pul);if(!low)bill(x,y+8.6*s,z,.5,.5,2,[1,.9,.6],.9);}
   for(const[x,z]of LAMPS){const y=this.terrain(x,z,CH);bill(x,y+2.2,z,.9,.9,0,[1,.66,.28],.75);if(!low)flat(x,z,1.2,[.28,.17,.05],.7);}
   // paw coins orbiting the gate, faster once the forge is lit; sparkles rising through the portal
   if(!low){for(let i=0;i<6;i++){const an=t*(lit?.6:.3)+i/6*TAU,R3=GATE.r+1.25,x=GATE.x+Math.cos(an)*R3,y=cy+Math.sin(an)*R3,z=GATE.z+.25,sx=.5*(.78+.22*Math.abs(Math.cos(t*2.2+i)));bill(x,y,z,.75,.75,0,[1,.66,.22],.22);bill(x,y,z,sx/.72,.5/.72,3,[1,1,1],1);}
    if(lit)for(let i=0;i<12;i++){const a=i*2.39996,f=((t*.14+i*.083)%1);bill(GATE.x+Math.cos(a)*pr*.8,top+.4+f*GATE.r*2.6,GATE.z+.2,.2,.2,2,i%3?[1,.82,.45]:[.85,.55,1],Math.sin(f*Math.PI)*.9);}}}
  // the Igniter at the pad: amber ring glow, and a roaring flame once LIFE #5 is complete (chapter1-style draws the base flame)
  const RW=root.MoonRocketWorld;if(state.igniterIn&&RW){const[px,pz]=RW.PAD,pt=this.v43&&this.v43.w&&this.v43.w.pad?this.v43.w.pad.top:this.terrain(px,pz,4);bill(px,pt+.6,pz,3.4,1.2,0,[1,.6,.22],.55*pul);
   if(state.chapter5Complete&&state.chapter===5&&!low)for(let i=0;i<8;i++){const f=((t*1.1+i/8)%1);bill(px+Math.sin(t*3+i)*.4*f,pt+.4+f*1.2,pz+Math.cos(t*2+i)*.4*f,.8+f*2.2,.8+f*2.2,0,[1,.75-.3*f,.35-.25*f],(1-f)*.35);}}
  if(!Q.length)return;const data=new Float32Array(Q);
  gl.useProgram(P5.p);gl.uniformMatrix4fv(P5.vp,false,this.vp);gl.uniform1f(P5.time,t);gl.bindBuffer(gl.ARRAY_BUFFER,P5.buf);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);
  gl.enable(gl.DEPTH_TEST);gl.depthMask(false);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  gl.enableVertexAttribArray(P5.pos);gl.vertexAttribPointer(P5.pos,3,gl.FLOAT,false,44,0);gl.enableVertexAttribArray(P5.info);gl.vertexAttribPointer(P5.info,4,gl.FLOAT,false,44,12);gl.enableVertexAttribArray(P5.tone);gl.vertexAttribPointer(P5.tone,4,gl.FLOAT,false,44,28);
  gl.drawArrays(gl.TRIANGLES,0,data.length/11);gl.disableVertexAttribArray(P5.pos);gl.disableVertexAttribArray(P5.info);gl.disableVertexAttribArray(P5.tone);
  gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(true);gl.disable(gl.BLEND);this.v57Stats={fxQuads:data.length/66|0};}catch(e){this._v57Off=true;if(typeof console!=='undefined')console.warn('v57 fx off',e);}};
{const w={scene:R.scene,render:R.render,blocked:R.blocked,camera:R.cameraBlocked,scenery:R.scenery};
 R.scene=function(state,...a){return withRocks(this,state,()=>w.scene.call(this,state,...a));};
 R.render=function(state,...a){return withRocks(this,state,()=>w.render.call(this,state,...a));};
 R.blocked=function(x,z,state,alt=0){return withRocks(this,state,()=>w.blocked.call(this,x,z,state,alt));};
 if(w.camera)R.cameraBlocked=function(x,z,state,alt=0){return withRocks(this,state,()=>w.camera.call(this,x,z,state,alt));};
 R.rocksForChapter=function(ch){return this.rocks?rocksFor(this,ch):[];};}
root.MoonIgnitionWorld={GATE,BOWL,SPARKS,SPIRES,CRYST,LAMPS,inside:inside5};
})(typeof window!=='undefined'?window:globalThis);
