/* v49 Stage B look, LIFE #1 only: bright "storybook" space world on top of the existing open world.
   - sky mood (violet lift, stronger violet/pink aurora, brighter Earth rim, extra twinkling stars) and a soft violet/gold rim
     light in the main shader (renderer.js uniforms skyMood/worldMood, 0 outside chapter 1)
   - glowing violet crystals: blue glass/emissive crystal colours are re-tinted to violet while in chapter 1
   - a golden paw portal (gold ring, violet membrane, paw-emblem pedestals) with two golden spire towers on the west plaza,
     a second spire with crystals to the north, and six gold paw coins slowly orbiting the portal (decor, not collectible)
   - gold/violet UI accents (body.mk-v49)
   Budget: everything is baked into ~12 static meshes (one draw per material per site, +6 tiny coin draws); low quality
   skips the north site, the coins and the small crystals. No new textures. Other chapters are untouched. */
(function(root){'use strict';
const R=root.MoonRenderer&&root.MoonRenderer.prototype,Core=root.MoonCore,B=root.MoonOutpostBuilder,M=root.MoonRenderMath;if(!R||!Core||!B)return;
const old={scene:R.scene,render:R.render,blocked:R.blocked,put:R.put};
const TAU=Math.PI*2,norm=v=>{const l=Math.hypot(v[0],v[1],v[2])||1;return[v[0]/l,v[1]/l,v[2]/l];},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
function rng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
const MATS={ivory:[17,[.93,.91,.86]],gold:[16,[.98,.70,.28]],amber:[12,[1,.66,.22]],violet:[12,[.78,.36,1.0]],membrane:[12,[.30,.10,.62]],crystal:[12,[.55,.22,.95]],core:[12,[.86,.50,1.0]],stone:[4,[.62,.60,.64]]};
// sites (checked clear of story points, resources and daily beacons; see tests/chapter1-style.cjs)
const PORTAL={x:-24,z:12,yaw:Math.PI/2,r:3.2},TOWERS=[[-27.5,17.5,1.25],[-27.5,6.5,1.25],[-13,39,1.1]],CRYSTALS=[[-20.5,7.5,1.0],[-20.5,16.8,.85],[-16.5,37.5,1.1],[-9.5,38.5,.8]];
const PEDESTALS=[-1,1].map(s=>[PORTAL.x,PORTAL.z+s*(PORTAL.r+.35)]);
function grp(map,mat){let g=map.get(mat);if(!g)map.set(mat,g=[]);return g;}
function bake(map,b,x,y,z,yaw=0){const c=Math.cos(yaw),s=Math.sin(yaw);for(const[mat,data]of b.groups){const g=grp(map,mat);for(let i=0;i<data.length;i+=6){const px=data[i],py=data[i+1],pz=data[i+2],nx=data[i+3],ny=data[i+4],nz=data[i+5];g.push(x+c*px+s*pz,y+py,z-s*px+c*pz,c*nx+s*nz,ny,-s*nx+c*nz);}}}
function prism(dst,core,x,y,z,r,h,yaw,pitch,roll,rnd,withCore){const k=6,rad=[];for(let i=0;i<k;i++)rad.push(r*(.78+rnd()*.38));const tip=h*(.22+rnd()*.12),bev=h-tip;
 const m=M.model(x,y,z,1,1,1,yaw,pitch,roll),T=p=>[m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]];
 const ring=(yy,sc)=>rad.map((rr,i)=>{const t=i/k*TAU;return T([Math.cos(t)*rr*sc,yy,Math.sin(t)*rr*sc]);}),push=(d,a,b,c)=>{const n=norm(cross(sub(b,a),sub(c,a)));d.push(...a,...n,...b,...n,...c,...n);};
 const b0=ring(-.12,1.02),mid=ring(bev*.55,1.0),top=ring(bev,.9),apex=T([0,h,0]);
 for(let i=0;i<k;i++){const n=(i+1)%k;push(dst,b0[i],mid[n],mid[i]);push(dst,b0[i],b0[n],mid[n]);push(dst,mid[i],top[n],top[i]);push(dst,mid[i],mid[n],top[n]);push(dst,top[i],top[n],apex);}
 if(withCore){const cr=rad.map(v=>v*.42),cring=yy=>cr.map((rr,i)=>{const t=i/k*TAU;return T([Math.cos(t)*rr,yy,Math.sin(t)*rr]);}),c0=cring(.02),c1=cring(bev*.82),ca=T([0,bev+tip*.55,0]);for(let i=0;i<k;i++){const n=(i+1)%k;push(core,c0[i],c1[n],c1[i]);push(core,c0[i],c0[n],c1[n]);push(core,c1[i],c1[n],ca);}}}
function cluster(map,x,y,z,scale,seed,small){const rnd=rng(seed),a=grp(map,'crystal'),c=grp(map,'core');
 prism(a,c,x,y,z,.26*scale,(1.9+rnd()*.5)*scale,rnd()*TAU,(rnd()-.5)*.14,(rnd()-.5)*.14,rnd,true);
 for(let i=0;i<4;i++){const t=i/4*TAU+rnd()*.6,d=(.24+rnd()*.12)*scale,tilt=.3+rnd()*.25;prism(a,c,x+Math.cos(t)*d,y,z+Math.sin(t)*d,(.14+rnd()*.05)*scale,(.9+rnd()*.6)*scale,rnd()*TAU,Math.sin(t)*tilt,-Math.cos(t)*tilt,rnd,true);}
 if(small)for(let i=0;i<5;i++){const t=i/5*TAU+rnd()*.5,d=(.5+rnd()*.25)*scale,tilt=.5+rnd()*.4;prism(a,c,x+Math.cos(t)*d,y,z+Math.sin(t)*d,(.06+rnd()*.05)*scale,(.3+rnd()*.4)*scale,rnd()*TAU,Math.sin(t)*tilt,-Math.cos(t)*tilt,rnd,false);}}
function tower(map,r,x,z,s){const y=r.terrain(x,z,1)-.1,b=new B();
 b.tube('stone',[0,0,0],[0,.5,0],1.55*s,12,1.45*s);b.tube('gold',[0,.5,0],[0,.68,0],1.42*s,16);
 b.tube('ivory',[0,.68,0],[0,4.6*s,0],.95*s,14,.82*s);for(const h of[1.9,3.3,4.6])b.tube('gold',[0,h*s-.1,0],[0,h*s+.06,0],(1.02-h*.04)*s,16);
 for(let i=0;i<4;i++){const a=i/4*TAU+.4;b.box('amber',Math.cos(a)*.86*s,2.6*s,Math.sin(a)*.86*s,.28*s,.62*s,.28*s,-a);}
 b.tube('ivory',[0,4.66*s,0],[0,5.3*s,0],.9*s,14,.6*s);b.tube('gold',[0,5.3*s,0],[0,5.42*s,0],.64*s,14);
 b.tube('amber',[0,5.42*s,0],[0,6.1*s,0],.36*s,10,.3*s);b.tube('gold',[0,6.1*s,0],[0,8.1*s,0],.5*s,12,.02);b.tube('gold',[0,8.0*s,0],[0,8.6*s,0],.05,6);
 for(let i=0;i<6;i++){const a=i/6*TAU;b.tube('gold',[Math.cos(a)*.9*s,4.66*s,Math.sin(a)*.9*s],[Math.cos(a)*.35*s,6.0*s,Math.sin(a)*.35*s],.06*s,5);}
 bake(map,b,x,y,z,0);}
function portal(map,r){const{x,z,yaw,r:rad}=PORTAL,y=r.terrain(x,z,1)-.08,b=new B(),cy=rad+.95;
 b.box('stone',0,.2,0,1.6,.4,2*rad+2.4);b.box('gold',0,.43,0,1.3,.08,2*rad+2.0);
 b.ring('gold',0,cy,0,rad,rad,.12,.55,40);b.ring('ivory',0,cy,0,rad*.9,rad*.9,.06,.42,40);b.ring('amber',0,cy,0,rad*.86,rad*.86,.025,.30,40);
 for(const s of[-1,1]){b.box('ivory',0,1.2,s*(rad+.35),.9,1.6,.9);b.box('gold',0,2.06,s*(rad+.35),1.0,.14,1.0);b.tube('gold',[0,2.1,s*(rad+.35)],[0,2.9,s*(rad+.35)],.22,10,.05);}
 b.tube('gold',[0,cy+rad,0],[0,cy+rad+.9,0],.28,10,.04);
 const m=new B();m.ring('membrane',0,cy,0,rad*.86,rad*.86,1,.04,40);
 // portal faces ±x after the yaw; paw emblems on both pedestal fronts
 bake(map,b,x,y,z,yaw);bake(map,m,x,y,z,yaw);
 for(const s of[-1,1])for(const f of[-1,1]){const pb=new B();pb.paw(0,1.2,.46,.72,'violet');bake(map,pb,x,y,z+s*(rad+.35),f>0?Math.PI/2:-Math.PI/2);}}
function coin(){const b=new B();b.tube('amber',[0,0,-.04],[0,0,.04],.34,18);b.ring('amber',0,0,0,.34,.34,.12,.1,18);b.paw(0,-.02,.04,.42,'amber');const c=new B();c.paw(0,-.02,-.057,.42,'amber');
 const map=new Map();bake(map,b,0,0,0,0);for(const[mat,d]of c.groups){const g=grp(map,mat);for(let i=0;i<d.length;i+=6)g.push(d[i],d[i+1],-d[i+2]-.0,d[i+3],d[i+4],-d[i+5]);}return map;}
function addGroups(r,prefix,map,list){for(const[mat,data]of map){if(!data.length)continue;const key=prefix+'_'+mat;r.addMesh(key,data);list.push([key,mat]);}}
R.v49Build=function(){if(this.v49)return this.v49;this.ensureWorldModels&&this.ensureWorldModels();const L={},add=(n,map)=>{L[n]=[];addGroups(this,'v49_'+n,map,L[n]);};
 const west=new Map(),north=new Map(),small=new Map();portal(west,this);tower(west,this,TOWERS[0][0],TOWERS[0][1],TOWERS[0][2]);tower(west,this,TOWERS[1][0],TOWERS[1][1],TOWERS[1][2]);
 cluster(west,CRYSTALS[0][0],this.terrain(CRYSTALS[0][0],CRYSTALS[0][1],1)-.05,CRYSTALS[0][1],CRYSTALS[0][2],491,false);cluster(west,CRYSTALS[1][0],this.terrain(CRYSTALS[1][0],CRYSTALS[1][1],1)-.05,CRYSTALS[1][1],CRYSTALS[1][2],492,false);
 cluster(small,CRYSTALS[0][0]+.6,this.terrain(CRYSTALS[0][0],CRYSTALS[0][1],1)-.05,CRYSTALS[0][1]-.4,.5,493,true);
 tower(north,this,TOWERS[2][0],TOWERS[2][1],TOWERS[2][2]);for(const[i,c]of[[2,CRYSTALS[2]],[3,CRYSTALS[3]]])cluster(north,c[0],this.terrain(c[0],c[1],1)-.05,c[1],c[2],494+i,true);
 add('west',west);add('north',north);add('small',small);add('coin',coin());return this.v49={L};};
const on=s=>!!(s&&Number(s.chapter)===1);
// violet re-tint of blue crystal glass / glow while in chapter 1
const violet=c=>{const b=Math.max(c[2],.001);return[b*.66,Math.min(c[1],b)*.36+.03,b];};
R.put=function(shape,x,y,z,sx,sy,sz,color,yaw,kind,glow,...rest){if(this.v49On&&color&&(kind===13||kind===12)&&color[2]>.45&&color[2]>color[0]*1.7&&color[2]>=color[1]*1.05)color=violet(color);return old.put.call(this,shape,x,y,z,sx,sy,sz,color,yaw,kind,glow,...rest);};
R.scene=function(state,p,t,...args){const out=old.scene.call(this,state,p,t,...args);if(!on(state))return out;const v=this.v49Build(),low=this.quality==='low',eye=this.eye||[0,0,0];
 const draw=(name,dx=0,dy=0,dz=0,yaw=0)=>{for(const[key,mat]of v.L[name]||[]){const[kind,col]=MATS[mat];const g=mat==='amber'?.55:mat==='violet'?.8+.2*Math.sin(t*2.1):mat==='core'?.85+.15*Math.sin(t*1.6):mat==='membrane'?.22+.08*Math.sin(t*1.3):mat==='crystal'?.3+.08*Math.sin(t*1.7):0;old.put.call(this,key,dx,dy,dz,1,1,1,col,yaw,kind,g);}};
 const dW=Math.hypot(eye[0]-PORTAL.x,eye[2]-PORTAL.z),dN=Math.hypot(eye[0]-TOWERS[2][0],eye[2]-TOWERS[2][1]);
 if(dW<170){draw('west');if(!low&&dW<60)draw('small');}if(!low&&dN<150)draw('north');
 if(!low&&dW<70){const cy=this.terrain(PORTAL.x,PORTAL.z,1)+PORTAL.r+.95;for(let i=0;i<6;i++){const a=t*.35+i/6*TAU,R2=PORTAL.r+1.2;draw('coin',PORTAL.x,cy+Math.sin(a)*R2,PORTAL.z+Math.cos(a)*R2,t*1.6+i);}}
 return out;};
R.render=function(state,...args){const v=on(state);this.v49On=v;this.skyMood=v?1:0;this.worldMood=v?1:0;
 if(typeof document==='object'&&document.body&&document.body.classList&&this._v49Ui!==v){this._v49Ui=v;document.body.classList.toggle('mk-v49',v);}
 return old.render.call(this,state,...args);};
function inside1(x,z){for(const[tx,tz,s]of TOWERS)if(Math.hypot(x-tx,z-tz)<1.6*s+.3)return true;for(const[px,pz]of PEDESTALS)if(Math.abs(x-px)<.85&&Math.abs(z-pz)<.85)return true;
 for(const[cx,cz,s]of CRYSTALS)if(Math.hypot(x-cx,z-cz)<.55*s+.25)return true;return false;}
R.blocked=function(x,z,state,alt=0){if(on(state)&&alt<2.4&&inside1(x,z))return true;return old.blocked.call(this,x,z,state,alt);};
root.MoonChapter1Style={PORTAL,TOWERS,CRYSTALS,PEDESTALS,inside:inside1,violet};
})(typeof window!=='undefined'?window:globalThis);
