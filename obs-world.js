/* v68 LIFE #9 "A New Horizon" (the finale): the old Observatory on a gentle hill east of the camp (centre Core.OBS; the hill is
   terrain from chapter 9, core.js obsHill).
   - a round drum with a silver dome, a gold telescope tube through the slit, a dark arched door facing the camp
   - three lens stands around the hill (a gold ring on a post holding a glowing glass lens until it is collected)
   - the star-chart console in front of the door; path lamps; a dish antenna; the Navigator on the slope
   Everything is round (tubes, shells, rings) — no flat slab props. Built lazily, baked per material, drawn from chapter 9.
   Load order: after gate-world.js, before home-plot.js. */
(function(root){'use strict';
const R=root.MoonRenderer&&root.MoonRenderer.prototype,Core=root.MoonCore,B=root.MoonOutpostBuilder;
if(!R||!Core||!B||!Core.OBS)return;
const old={scene:R.scene,render:R.render,blocked:R.blocked};
const TAU=Math.PI*2,DRAW_R=150,CH=9,O=Core.OBS,P=Core.POINTS;
const MATS={drum:[21,[.86,.88,.94]],band:[16,[1,.78,.34]],dome:[17,[.80,.84,.92]],dark:[0,[.06,.07,.10]],scope:[16,[.98,.80,.40]],glass:[13,[.70,.90,1]],
 lens:[12,[.55,.85,1]],post:[17,[.78,.82,.88]],lamp:[12,[1,.82,.40]],dish:[21,[.92,.93,.96]],screen:[12,[.45,.9,1]]};
const DOOR_YAW=Math.atan2(P.scope[0]-O.x,P.scope[1]-O.z);   // the door faces the console / the camp
const DRUM_R=3.4,DRUM_H=2.2,DOME_H=2.9;
const LENSES=['lens1','lens2','lens3'].map(id=>P[id]);
const LAMPS=[];{const A=[32.4,-4.6],Bp=[40.4,-11.2],dx=Bp[0]-A[0],dz=Bp[1]-A[1],l=Math.hypot(dx,dz),nx=-dz/l,nz=dx/l;for(let i=0;i<4;i++){const t=i/3,x=A[0]+dx*t,z=A[1]+dz*t;LAMPS.push([x+nx*1.5,z+nz*1.5],[x-nx*1.5,z-nz*1.5]);}}
const DISH=[O.x+4.6,O.z-3.8];
function grp(map,mat){let g=map.get(mat);if(!g)map.set(mat,g=[]);return g;}
function bake(map,b,x,y,z,yaw=0){const c=Math.cos(yaw),s=Math.sin(yaw);for(const[mat,data]of b.groups){const g=grp(map,mat);for(let i=0;i<data.length;i+=6){const px=data[i],py=data[i+1],pz=data[i+2],nx=data[i+3],ny=data[i+4],nz=data[i+5];g.push(x+c*px+s*pz,y+py,z-s*px+c*pz,c*nx+s*nz,ny,-s*nx+c*nz);}}}
const G=(r,x,z)=>r.terrain(x,z,CH);
function shellAt(b,mat,prof,r,h,y){const k=new B();k.shell(mat,prof,r,h);for(const[m,d]of k.groups){const g=b.groups.get(m)||[];for(let i=0;i<d.length;i+=6)g.push(d[i],d[i+1]+y,d[i+2],d[i+3],d[i+4],d[i+5]);b.groups.set(m,g);}}
function build(r){const main=new Map(),detail=new Map(),lens=new Map(),stand=new Map();
 // observatory: drum + gold bands + dome + telescope + door arch
 {const y=G(r,O.x,O.z)-.1,b=new B();b.tube('drum',[0,0,0],[0,DRUM_H,0],DRUM_R,40);b.tube('band',[0,DRUM_H-.02,0],[0,DRUM_H+.16,0],DRUM_R+.08,40);b.tube('band',[0,.0,0],[0,.22,0],DRUM_R+.12,40);
  const prof=[];for(let i=0;i<=12;i++){const a=i/12*Math.PI/2;prof.push([Math.max(.001,Math.cos(a)),Math.sin(a)]);}shellAt(b,'dome',prof,DRUM_R-.05,DOME_H,DRUM_H+.12);
  b.tube('dark',[0,DRUM_H+.2,DRUM_R*.2],[0,DRUM_H+DOME_H*.92,DRUM_R*.62],.42,10);
  b.tube('scope',[0,DRUM_H+.8,0],[0,DRUM_H+DOME_H+1.4,DRUM_R*.95],.38,20,.46);b.ring('band',0,DRUM_H+DOME_H+1.42,DRUM_R*.95,.5,.5,.25,.18,20);
  b.tube('glass',[0,DRUM_H+DOME_H+1.38,DRUM_R*.95],[0,DRUM_H+DOME_H+1.46,DRUM_R*.97],.36,20);
  b.ring('dark',0,0,DRUM_R+.02,1.0,1.55,.5,.16,24);b.ring('band',0,0,DRUM_R+.08,1.12,1.68,.08,.12,24);
  b.tube('band',[0,DRUM_H+DOME_H+.02,0],[0,DRUM_H+DOME_H+.45,0],.12,10);bake(main,b,O.x,y,O.z,DOOR_YAW);}
 // lens stands: a post and a gold ring frame (the glass lens itself is drawn separately until collected)
 LENSES.forEach(([x,z])=>{const y=G(r,x,z),b=new B();b.tube('post',[0,0,0],[0,1.1,0],.09,10);b.tube('band',[0,0,0],[0,.12,0],.32,16);b.ring('band',0,1.55,0,.46,.46,.2,.08,24);bake(stand,b,x,y,z,Math.atan2(O.x-x,O.z-z));});
 {const b=new B();b.ring('lens',0,0,0,.38,.38,1,.05,24);bake(lens,b,0,0,0);}
 // star-chart console: a round pedestal with a tilted ring screen
 {const[x,z]=P.scope,y=G(r,x,z),b=new B();b.tube('drum',[0,0,0],[0,.95,0],.42,20,.32);b.tube('band',[0,.92,0],[0,1.0,0],.5,20);b.ring('screen',0,1.25,0,.36,.36,1,.04,24);b.ring('band',0,1.25,0,.42,.42,.16,.06,24);bake(main,b,x,y,z,DOOR_YAW);}
 // path lamps (tubes with a gold cap) and the dish antenna (a shallow shell bowl on a mast)
 LAMPS.forEach(([x,z],i)=>{const y=G(r,x,z),b=new B();b.tube('post',[0,0,0],[0,1.3,0],.07,8);b.tube('band',[0,1.3,0],[0,1.42,0],.13,10);bake(i%2?detail:main,b,x,y,z);});
 {const[x,z]=DISH,y=G(r,x,z),b=new B();b.tube('post',[0,0,0],[0,2.4,0],.12,10);const prof=[];for(let i=0;i<=8;i++){const t=i/8;prof.push([Math.max(.001,t),.35*t*t]);}
  const k=new B();k.shell('dish',prof,1.25,1);for(const[m,d]of k.groups){const g=b.groups.get(m)||[];for(let i=0;i<d.length;i+=6){const px=d[i],py=d[i+1],pz=d[i+2],c=Math.cos(.7),sn=Math.sin(.7);g.push(px,2.4+py*c-pz*sn,py*sn+pz*c,d[i+3],d[i+4]*c-d[i+5]*sn,d[i+4]*sn+d[i+5]*c);}b.groups.set(m,g);}
  b.tube('band',[0,2.4,0],[0,3.3,.6],.04,6);bake(detail,b,x,y,z,-2.3);}
 const Lm={};const add=(n,map)=>{Lm[n]=[];for(const[mat,data]of map){if(!data.length)continue;const k='v68_'+n+'_'+mat;r.addMesh(k,data);Lm[n].push([k,mat]);}};
 add('main',main);add('detail',detail);add('lens',lens);add('stand',stand);return{L:Lm};}
const on=s=>!!s&&Number(s.chapter)>=9;
(root.MoonRockZones=root.MoonRockZones||[]).push({ch:9,out:r=>Math.hypot(r.x-O.x,r.z-O.z)<=O.hill+6+r.s*.6});
R.v68Build=function(){if(this.v68)return this.v68;this.ensureWorldModels&&this.ensureWorldModels();return this.v68=build(this);};
const glowOf=(mat,t,k)=>mat==='lens'?.9:mat==='screen'?.8+.1*Math.sin(t*3):mat==='glass'?.3+.5*k:mat==='band'||mat==='scope'?.08+.12*k:mat==='lamp'?.9:0;
R.scene=function(state,p,t,...args){const out=old.scene.call(this,state,p,t,...args);if(!on(state))return out;const eye=this.eye||[0,0,0],dO=Math.hypot(eye[0]-O.x,eye[2]-O.z);if(dO>DRAW_R)return out;
 const v=this.v68Build(),low=this.quality==='low',got=state.obsLenses||[],k=state.courseSet?1:got.length/3;
 const draw=(name,x=0,y=0,z=0,yaw=0)=>{for(const[key,mat]of v.L[name]||[]){const[kind,col]=MATS[mat];this.put(key,x,y,z,1,1,1,col,yaw,kind,Math.min(1,glowOf(mat,t,k)));}};
 draw('main');if(!low)draw('detail');draw('stand');
 ['lens1','lens2','lens3'].forEach((id,i)=>{if(got.includes(id))return;const[x,z]=LENSES[i];draw('lens',x,this.terrain(x,z,CH)+1.55+.05*Math.sin(t*1.6+i),z,Math.atan2(O.x-x,O.z-z));});
 if(dO<80&&!state.chapter9Complete){const[nx,nz]=P.nav9;this.cat(nx+.9,nz+.4,Math.atan2(-(O.x-nx),-(O.z-nz))+Math.PI,t,0,0,CH,[.45,.72,1]);}
 return out;};
// ---------- collisions ----------
function inside9(x,z){if(Math.hypot(x-O.x,z-O.z)<DRUM_R+.25)return true;
 for(const[lx,lz]of LENSES)if(Math.hypot(x-lx,z-lz)<.4)return true;
 if(Math.hypot(x-P.scope[0],z-P.scope[1])<.55)return true;
 for(const[lx,lz]of LAMPS)if(Math.hypot(x-lx,z-lz)<.22)return true;
 if(Math.hypot(x-DISH[0],z-DISH[1])<.3)return true;return false;}
R.blocked=function(x,z,state,alt=0){if(on(state)&&Math.hypot(x-O.x,z-O.z)<O.hill+3&&alt<.9&&inside9(x,z))return true;return old.blocked.call(this,x,z,state,alt);};
// ---------- fx: telescope beam, lens halos, lamp glows, star motes; after the course is set a gold beam points to the sky ----------
R.render=function(state,p,t,dt,yaw,pitch,scan){old.render.call(this,state,p,t,dt,yaw,pitch,scan);if(!on(state)||!this.v68||!this.vp||!this.gl||!this.v50Prog||this._v68Off)return;
 try{const P5=this.v50Prog();if(!P5)return;const gl=this.gl,low=this.quality==='low',eye=this.eye||[0,0,0],Q=[],V=this.vp,rl=Math.hypot(V[0],V[8])||1,rx=V[0]/rl,rz=V[8]/rl;
  const dO=Math.hypot(eye[0]-O.x,eye[2]-O.z);if(dO>DRAW_R)return;
  const T=(x,z)=>this.terrain(x,z,CH),got=state.obsLenses||[],set=!!state.courseSet,pul=.85+.15*Math.sin(t*2);
  const bill=(x,y,z,sx,sy,k,c,w)=>{for(const[u,q]of[[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]])Q.push(x+rx*u*sx,y+q*sy,z+rz*u*sx,u,q,k,0,c[0],c[1],c[2],w);};
  ['lens1','lens2','lens3'].forEach((id,i)=>{const[x,z]=LENSES[i],y=T(x,z)+1.55;if(!got.includes(id)){bill(x,y,z,.8,.8,0,[.55,.85,1],.6*pul);if(!low)bill(x,y+2.2,z,.16,2.2,0,[.55,.85,1],.18*pul);}});
  {const[x,z]=P.scope;bill(x,T(x,z)+1.3,z,.6,.6,0,[.45,.9,1],.45*pul);}
  for(const[x,z]of LAMPS)bill(x,T(x,z)+1.4,z,.55,.55,0,[1,.82,.4],.55);
  {const c=Math.cos(DOOR_YAW),s=Math.sin(DOOR_YAW),ty=T(O.x,O.z)+DRUM_H+DOME_H+1.3,tx=O.x+s*DRUM_R*.95,tz=O.z+c*DRUM_R*.95;bill(tx,ty,tz,.7,.7,0,set?[1,.85,.45]:[.55,.85,1],(.25+.25*got.length/3+(set?.4:0))*pul);
   if(set)for(let j=0,n=low?8:22;j<n;j++){const f=j/n;bill(tx+s*f*12,ty+f*22,tz+c*f*12,.6-.3*f,.6-.3*f,0,[1,.85,.5],.55*(1-f*.8)*pul);}}
  if(!low&&dO<45){for(let i=0;i<26;i++){const a=i*2.39996+t*.03,rr=2+(i*29%60)/10,f=(t*.06+i*.083)%1,x=O.x+Math.cos(a)*rr,z=O.z+Math.sin(a)*rr;bill(x,T(x,z)+.4+f*4,z,.05,.05,2,[.8,.9,1],Math.sin(f*Math.PI)*.6);}}
  if(!Q.length)return;const data=new Float32Array(Q);
  gl.useProgram(P5.p);gl.uniformMatrix4fv(P5.vp,false,this.vp);gl.uniform1f(P5.time,t);gl.bindBuffer(gl.ARRAY_BUFFER,P5.buf);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);
  gl.enable(gl.DEPTH_TEST);gl.depthMask(false);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  gl.enableVertexAttribArray(P5.pos);gl.vertexAttribPointer(P5.pos,3,gl.FLOAT,false,44,0);gl.enableVertexAttribArray(P5.info);gl.vertexAttribPointer(P5.info,4,gl.FLOAT,false,44,12);gl.enableVertexAttribArray(P5.tone);gl.vertexAttribPointer(P5.tone,4,gl.FLOAT,false,44,28);
  gl.drawArrays(gl.TRIANGLES,0,data.length/11);gl.disableVertexAttribArray(P5.pos);gl.disableVertexAttribArray(P5.info);gl.disableVertexAttribArray(P5.tone);
  gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(true);gl.disable(gl.BLEND);this.v68Stats={fxQuads:data.length/66|0};}catch(e){this._v68Off=true;if(typeof console!=='undefined')console.warn('v68 fx off',e);}};
root.MoonObsWorld={DRUM_R,LENSES,LAMPS,DISH,DOOR_YAW,inside:inside9};
})(typeof window!=='undefined'?window:globalThis);
