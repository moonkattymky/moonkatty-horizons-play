/* v67 LIFE #8 "The Gate": the Sky Mesa west of the camp (centre Core.GATE; the mesa itself is terrain from chapter 8, core.js gateMesa).
   - sheer basalt cliffs (column prisms around the rim, layered strata), no ramp: the hover-bike is the only way up
   - on the plateau: the ancient Gate — three concentric rings standing on two pylons; each ring carries a gold star mark that follows
     state.gateRings; the ring console in front; three glyph monoliths on the rim (the hints); once aligned the Gate fills with a far
     blue sky and the Star Key floats out
   - the Scout waits at the foot of the cliffs, south of the mesa
   Cliff colliders block walking (alt < .9 on the cliff face) so you can neither walk up nor walk off the edge — fly.
   Load order: after lost-world.js, before home-plot.js. */
(function(root){'use strict';
const R=root.MoonRenderer&&root.MoonRenderer.prototype,Core=root.MoonCore,B=root.MoonOutpostBuilder,M=root.MoonRenderMath;
if(!R||!Core||!B||!Core.GATE)return;
const old={scene:R.scene,render:R.render,blocked:R.blocked};
const TAU=Math.PI*2,DRAW_R=150,CH=8,G0=Core.GATE,P=Core.POINTS;
function rng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
const norm=v=>{const l=Math.hypot(v[0],v[1],v[2])||1;return[v[0]/l,v[1]/l,v[2]/l];},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const MATS={basalt:[4,[.58,.30,.16]],basaltHi:[4,[.74,.44,.26]],sand:[4,[.86,.78,.66]],stone:[4,[.70,.66,.62]],gateA:[16,[.92,.80,.52]],gateB:[21,[.88,.90,.96]],
 gateDark:[0,[.10,.11,.16]],rune:[12,[.55,.85,1]],gold:[16,[1,.78,.34]],keyGold:[12,[1,.86,.42]],screen:[12,[.45,.9,1]],steel:[17,[.80,.84,.90]]};
const GATE_POS=[G0.x,G0.z+3.4],RINGS=[3.25,2.55,1.85],RING_Y=4.0;   // ring centre height above the plateau
const DIAL=P.gateDial,KEY=P.starKey,GLYPHS=['glyph1','glyph2','glyph3'].map(id=>P[id]);
const edgeR=a=>G0.mesa+.55*Math.sin(a*5+.3)+.35*Math.sin(a*11+1.7);
const COLS=[];   // v67: basalt columns were tried and dropped — the plain sheer cliff reads better}
const OBELISKS=[];for(let i=0;i<6;i++){const a=i/6*TAU+.52;if(Math.abs(Math.sin(a))>.9)continue;const e=edgeR(a)-1.1;OBELISKS.push([G0.x+Math.cos(a)*e,G0.z+Math.sin(a)*e,a]);}
function grp(map,mat){let g=map.get(mat);if(!g)map.set(mat,g=[]);return g;}
function bake(map,b,x,y,z,yaw=0){const c=Math.cos(yaw),s=Math.sin(yaw);for(const[mat,data]of b.groups){const g=grp(map,mat);for(let i=0;i<data.length;i+=6){const px=data[i],py=data[i+1],pz=data[i+2],nx=data[i+3],ny=data[i+4],nz=data[i+5];g.push(x+c*px+s*pz,y+py,z-s*px+c*pz,c*nx+s*nz,ny,-s*nx+c*nz);}}}
// hexagonal basalt column from the foot to a little under the plateau lip
function column(d,dHi,x,z,y0,y1,r,rnd){const k=6,a0=rnd()*TAU,ring=(y,sc)=>{const o=[];for(let i=0;i<k;i++){const t=a0+i/k*TAU;o.push([x+Math.cos(t)*r*sc,y,z+Math.sin(t)*r*sc]);}return o;};
 const lo=ring(y0,1.05),hi=ring(y1,1),top=[x,y1+.05,z],push=(g,a,b,c)=>{const n=norm(cross(sub(b,a),sub(c,a)));g.push(...a,...n,...b,...n,...c,...n);};
 for(let i=0;i<k;i++){const n=(i+1)%k,g=i%2?dHi:d;push(g,lo[i],hi[n],hi[i]);push(g,lo[i],lo[n],hi[n]);push(dHi,hi[i],hi[n],top);}}
const G=(r,x,z)=>r.terrain(x,z,CH);
function build(r){const main=new Map(),detail=new Map(),key=new Map(),dial=new Map();
 const bas=grp(main,'basalt'),basHi=grp(main,'basaltHi');
 // cliff columns: their tops follow the cliff profile so the face reads as a wall of stone organ pipes
 COLS.forEach(([x,z,s,q],i)=>{const rnd=rng(8200+i),top=Math.min(G0.height+.25,Math.max(.8,G(r,x,z)+.9+rnd()*1.1));column(i%4===3?grp(detail,'basalt'):bas,i%4===3?grp(detail,'basaltHi'):basHi,x,z,-.3,top,s,rnd);});
 // the Gate: two pylons, a base step and three rings (outer gold, middle silver, inner gold) facing south
 {const[gx,gz]=GATE_POS,y=G(r,gx,gz),b=new B();b.box('stone',0,.18,0,9.4,.36,2.4);b.box('stone',0,.5,-.2,8.2,.28,1.6);
  for(const sx of[-1,1]){b.box('stone',sx*3.75,2.2,0,.9,4.4,1.1);b.box('gateA',sx*3.75,4.55,0,1.2,.3,1.3);b.box('rune',sx*3.75,2.2,-.56,.18,2.8,.04);}
  RINGS.forEach((rr,i)=>b.ring(i===1?'gateB':'gateA',0,RING_Y,0,rr,rr,.16,.34+.08*(2-i),40));
  b.ring('gateDark',0,RING_Y,.02,RINGS[2]*.84,RINGS[2]*.84,.04,.2,40);bake(main,b,gx,y,gz);}
 // ring console: a slanted stone lectern with three blue ring dials
 {const[x,z]=DIAL,y=G(r,x,z),b=new B();b.box('stone',0,.5,0,1.1,1.0,.7);b.box('gateA',0,1.06,.05,1.25,.1,.85);
  for(let i=0;i<3;i++)b.ring('screen',(i-1)*.34,1.16,0,.13,.13,.35,.05,16);bake(dial,b,x,y,z,0);}
 // glyph monoliths: tall slabs with a glowing star glyph on the south face
 GLYPHS.forEach(([x,z],i)=>{const y=G(r,x,z),b=new B(),yaw=Math.atan2(G0.x-x,G0.z-z)+Math.PI;b.box('basaltHi',0,1.0,0,.8,2.0,.32);b.box('stone',0,.1,0,1.1,.2,.6);b.box('rune',0,1.35,-.17,.36,.36,.02);b.box('rune',0,.82,-.17,.5,.06,.02);bake(main,b,x,y,z,yaw);});
 OBELISKS.forEach(([x,z,a],i)=>{const y=G(r,x,z),b=new B();b.box('basaltHi',0,1.4,0,.5,2.8,.5);b.box('gateA',0,2.9,0,.62,.2,.62);bake(i%2?detail:main,b,x,y,z,a);});
 // the Star Key: a five-pointed gold star (prism) with a ring handle
 {const b=new B(),pts=[];for(let i=0;i<10;i++){const t=i/10*TAU,rr=i%2?.16:.38;pts.push([Math.sin(t)*rr,Math.cos(t)*rr]);}
  for(let i=0;i<10;i++){const p=pts[i],q=pts[(i+1)%10];b.tri('keyGold',[0,0,.07],[p[0],p[1],0],[q[0],q[1],0]);b.tri('keyGold',[0,0,-.07],[q[0],q[1],0],[p[0],p[1],0]);}
  b.ring('gold',0,-.55,0,.15,.15,.35,.05,14);b.box('gold',0,-.3,0,.06,.3,.06);bake(key,b,0,0,0);}
 const Lm={};const add=(n,map)=>{Lm[n]=[];for(const[mat,data]of map){if(!data.length)continue;const k='v67_'+n+'_'+mat;r.addMesh(k,data);Lm[n].push([k,mat]);}};
 add('main',main);add('detail',detail);add('key',key);add('dial',dial);return{L:Lm};}
const on=s=>!!s&&Number(s.chapter)>=8;
(root.MoonRockZones=root.MoonRockZones||[]).push({ch:8,out:r=>Math.hypot(r.x-G0.x,r.z-G0.z)<=G0.mesa+G0.cliff+7+r.s*.6});
R.v67Build=function(){if(this.v67)return this.v67;this.ensureWorldModels&&this.ensureWorldModels();return this.v67=build(this);};
const glowOf=(mat,t,lit)=>mat==='rune'?(lit?.95:.55+.15*Math.sin(t*2)):mat==='screen'?.8+.1*Math.sin(t*3):mat==='keyGold'?.9:mat==='gateA'||mat==='gold'?(lit?.25:.08):mat==='gateB'?(lit?.2:.05):0;
R.scene=function(state,p,t,...args){const out=old.scene.call(this,state,p,t,...args);if(!on(state))return out;const eye=this.eye||[0,0,0],dG=Math.hypot(eye[0]-G0.x,eye[2]-G0.z);if(dG>DRAW_R)return out;
 const v=this.v67Build(),low=this.quality==='low',lit=!!state.ringsAligned;
 const draw=(name,x=0,y=0,z=0,yaw=0)=>{for(const[k,mat]of v.L[name]||[]){const[kind,col]=MATS[mat];this.put(k,x,y,z,1,1,1,col,yaw,kind,Math.min(1,glowOf(mat,t,lit)));}};
 draw('main');if(!low)draw('detail');draw('dial');
 if(lit&&!state.keyTaken){const[x,z]=KEY;draw('key',x,this.terrain(x,z,CH)+1.35+.12*Math.sin(t*1.7),z,t*.8);}
 if(dG<80&&!state.chapter8Complete){const[nx,nz]=P.scout8;this.cat(nx+.9,nz-.3,Math.atan2(-(G0.x-nx),-(G0.z-nz))+Math.PI,t,0,0,CH,[.95,.62,.3]);}
 return out;};
// ---------- collisions ----------
function inside8(x,z,state){const dx=x-G0.x,dz=z-G0.z,rr=Math.hypot(dx,dz);
 const h=Core.gateMesa(x,z);if(h>.35&&h<G0.height-.35)return true;   // the cliff face (both directions)
 for(const[cx,cz,s]of COLS)if(Math.hypot(x-cx,z-cz)<s+.15)return true;
 const[gx,gz]=GATE_POS;if(Math.abs(z-gz)<.75){if(Math.abs(Math.abs(x-gx)-3.75)<.6)return true;}
 if(Math.abs(x-DIAL[0])<.65&&Math.abs(z-DIAL[1])<.45)return true;
 for(const[gx2,gz2]of GLYPHS)if(Math.hypot(x-gx2,z-gz2)<.55)return true;
 for(const[ox,oz]of OBELISKS)if(Math.hypot(x-ox,z-oz)<.42)return true;
 return false;}
R.blocked=function(x,z,state,alt=0){if(on(state)&&Math.hypot(x-G0.x,z-G0.z)<G0.mesa+G0.cliff+3){if(alt<.9&&inside8(x,z,state))return true;}return old.blocked.call(this,x,z,state,alt);};
// ---------- fx: ring star marks, portal sky, glyph halos, key sparkles, dust motes ----------
R.render=function(state,p,t,dt,yaw,pitch,scan){old.render.call(this,state,p,t,dt,yaw,pitch,scan);if(!on(state)||!this.v67||!this.vp||!this.gl||!this.v50Prog||this._v67Off)return;
 try{const P5=this.v50Prog();if(!P5)return;const gl=this.gl,low=this.quality==='low',eye=this.eye||[0,0,0],Q=[],V=this.vp,rl=Math.hypot(V[0],V[8])||1,rx=V[0]/rl,rz=V[8]/rl;
  const dG=Math.hypot(eye[0]-G0.x,eye[2]-G0.z);if(dG>DRAW_R)return;
  const T=(x,z)=>this.terrain(x,z,CH),lit=!!state.ringsAligned,rings=state.gateRings||Core.RINGS_START,pul=.85+.15*Math.sin(t*2);
  const bill=(x,y,z,sx,sy,k,c,w)=>{for(const[u,q]of[[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]])Q.push(x+rx*u*sx,y+q*sy,z+rz*u*sx,u,q,k,0,c[0],c[1],c[2],w);};
  // portal disc (world-facing, in the ring plane): layered blue sky once aligned, a faint shimmer before
  const[gx,gz]=GATE_POS,gy=T(gx,gz)+RING_Y;
  {const disc=(r0,c,w)=>{const N=low?14:28;for(let i=0;i<N;i++){const a=i/N*TAU,b=(i+1)/N*TAU;for(const[px,py,u,v]of[[0,0,0,0],[Math.sin(a)*r0,Math.cos(a)*r0,Math.sin(a),Math.cos(a)],[Math.sin(b)*r0,Math.cos(b)*r0,Math.sin(b),Math.cos(b)]])Q.push(gx+px,gy+py,gz-.05,u,v,0,0,c[0],c[1],c[2],w);}};
   if(lit){disc(RINGS[2]*.84,[.35,.62,1],.75*pul);disc(RINGS[2]*.6,[.6,.85,1],.5);disc(RINGS[2]*.3,[1,1,.95],.45*pul);bill(gx,gy,gz-.2,RINGS[0]*1.6,RINGS[0]*1.6,0,[.45,.7,1],.35*pul);if(!low)bill(gx,gy+14,gz,.6,14,0,[.6,.85,1],.18*pul);}
   else disc(RINGS[2]*.84,[.25,.35,.6],.14+.06*Math.sin(t*1.3));}
  // a gold star on each ring at its current position (0 = top); a blue marker at the top shows the goal
  RINGS.forEach((rr,i)=>{const a=(lit?0:rings[i])*TAU/6,mx=gx+Math.sin(a)*rr*.92,my=gy+Math.cos(a)*rr*.92,ok=lit||rings[i]===0;bill(mx,my,gz-.28,.5,.5,0,ok?[.6,1,.8]:[1,.78,.3],.95*pul);});
  bill(gx,gy+RINGS[0]+.45,gz-.25,.22,.22,0,[.5,.9,1],.8);
  // glyph halos
  ['glyph1','glyph2','glyph3'].forEach((id,i)=>{const[x,z]=GLYPHS[i],got=(state.gateGlyphs||[]).includes(id);bill(x,T(x,z)+1.35,z,.55,.55,0,got?[.5,1,.8]:[.55,.85,1],got?.3:.7*pul);if(!got&&!low)bill(x,T(x,z)+3.2,z,.2,2.2,0,[.55,.85,1],.2*pul);});
  // console glow + Star Key sparkles
  {const[x,z]=DIAL;bill(x,T(x,z)+1.3,z,.7,.35,0,[.45,.9,1],.45*pul);}
  if(lit&&!state.keyTaken){const[x,z]=KEY,hy=T(x,z)+1.35;bill(x,hy,z,1.1,1.1,0,[1,.85,.45],.7*pul);if(!low)for(let j=0;j<7;j++){const ph=t*1.4+j*.9;bill(x+Math.cos(ph)*.6,hy+Math.sin(ph*1.3)*.4,z+Math.sin(ph)*.6,.1,.1,2,[1,.95,.7],Math.max(0,Math.sin(ph*2)));}}
  // dust motes drifting off the plateau rim
  if(!low&&dG<50){for(let i=0;i<30;i++){const a=i*2.39996+t*.02,rr=G0.mesa-1+(i*37%30)/10,f=(t*.05+i*.071)%1,x=G0.x+Math.cos(a)*rr,z=G0.z+Math.sin(a)*rr;bill(x,G0.height+.3+f*3.5,z,.05,.05,2,[1,.95,.85],Math.sin(f*Math.PI)*.5);}}
  if(!Q.length)return;const data=new Float32Array(Q);
  gl.useProgram(P5.p);gl.uniformMatrix4fv(P5.vp,false,this.vp);gl.uniform1f(P5.time,t);gl.bindBuffer(gl.ARRAY_BUFFER,P5.buf);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);
  gl.enable(gl.DEPTH_TEST);gl.depthMask(false);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  gl.enableVertexAttribArray(P5.pos);gl.vertexAttribPointer(P5.pos,3,gl.FLOAT,false,44,0);gl.enableVertexAttribArray(P5.info);gl.vertexAttribPointer(P5.info,4,gl.FLOAT,false,44,12);gl.enableVertexAttribArray(P5.tone);gl.vertexAttribPointer(P5.tone,4,gl.FLOAT,false,44,28);
  gl.drawArrays(gl.TRIANGLES,0,data.length/11);gl.disableVertexAttribArray(P5.pos);gl.disableVertexAttribArray(P5.info);gl.disableVertexAttribArray(P5.tone);
  gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(true);gl.disable(gl.BLEND);this.v67Stats={fxQuads:data.length/66|0};}catch(e){this._v67Off=true;if(typeof console!=='undefined')console.warn('v67 fx off',e);}};
root.MoonGateWorld={GATE_POS,RINGS,RING_Y,DIAL,KEY,GLYPHS,COLS,OBELISKS,inside:inside8};
})(typeof window!=='undefined'?window:globalThis);
