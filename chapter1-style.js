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
try{const LS=root.localStorage,K=(root.MoonCore&&root.MoonCore.KEY||'moonkatty')+'-quality',nav=root.navigator||{};if(LS&&!LS.getItem('mk-q52')){const weak=(nav.deviceMemory&&nav.deviceMemory<3)||(nav.hardwareConcurrency&&nav.hardwareConcurrency<4);if(!weak)LS.setItem(K,'high');LS.setItem('mk-q52','1');}}catch(e){}
const R=root.MoonRenderer&&root.MoonRenderer.prototype,Core=root.MoonCore,B=root.MoonOutpostBuilder,M=root.MoonRenderMath;if(!R||!Core||!B)return;
const old={scene:R.scene,render:R.render,blocked:R.blocked,put:R.put};
const TAU=Math.PI*2,norm=v=>{const l=Math.hypot(v[0],v[1],v[2])||1;return[v[0]/l,v[1]/l,v[2]/l];},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
function rng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
const MATS={ivory:[17,[.93,.91,.86]],gold:[16,[.98,.70,.28]],pgold:[16,[1.0,.78,.34]],amber:[12,[1,.66,.22]],violet:[12,[.78,.36,1.0]],membrane:[12,[.30,.10,.62]],crystal:[30,[.24,.62,1.0]],crystalHi:[12,[.62,.88,1.0]],core:[12,[.80,.95,1.0]],aCrystal:[30,[.24,.62,1.0]],aCrystalHi:[12,[.62,.88,1.0]],aCore:[12,[.80,.95,1.0]],stone:[4,[.62,.60,.64]]};
// sites (checked clear of story points, resources and daily beacons; see tests/chapter1-style.cjs)
const PORTAL={x:-24,z:12,yaw:Math.PI/2,r:3.2},TOWERS=[[-27.5,17.5,1.25],[-27.5,6.5,1.25],[-13,39,1.1]],CRYSTALS=[[-20.5,7.5,1.0],[-20.5,16.8,.85],[-16.5,37.5,1.1],[-9.5,38.5,.8]];
const PEDESTALS=[-1,1].map(s=>[PORTAL.x,PORTAL.z+s*(PORTAL.r+.35)]);
function grp(map,mat){let g=map.get(mat);if(!g)map.set(mat,g=[]);return g;}
function bake(map,b,x,y,z,yaw=0){const c=Math.cos(yaw),s=Math.sin(yaw);for(const[mat,data]of b.groups){const g=grp(map,mat);for(let i=0;i<data.length;i+=6){const px=data[i],py=data[i+1],pz=data[i+2],nx=data[i+3],ny=data[i+4],nz=data[i+5];g.push(x+c*px+s*pz,y+py,z-s*px+c*pz,c*nx+s*nz,ny,-s*nx+c*nz);}}}
function prism(dst0,core,x,y,z,r,h,yaw,pitch,roll,rnd,withCore){const k=6,rad=[];for(let i=0;i<k;i++)rad.push(r*(.78+rnd()*.38));const tip=h*(.22+rnd()*.12),bev=h-tip;
 const m=M.model(x,y,z,1,1,1,yaw,pitch,roll),T=p=>[m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]];
 const ring=(yy,sc)=>rad.map((rr,i)=>{const t=i/k*TAU;return T([Math.cos(t)*rr*sc,yy,Math.sin(t)*rr*sc]);}),push=(d,a,b,c)=>{const n=norm(cross(sub(b,a),sub(c,a)));d.push(...a,...n,...b,...n,...c,...n);};
 const dst=dst0.lo?dst0:dst0,hi=dst0.hi||dst0;let fi=0;const push2=(a,b,c)=>push((fi++>>1)%2?hi:dst0.lo||dst0,a,b,c);const b0=ring(-.12,1.02),mid=ring(bev*.55,1.0),top=ring(bev,.9),apex=T([0,h,0]);
 for(let i=0;i<k;i++){const n=(i+1)%k;fi=i*2;push2(b0[i],mid[n],mid[i]);push2(b0[i],b0[n],mid[n]);fi=i*2+1;push2(mid[i],top[n],top[i]);push2(mid[i],mid[n],top[n]);fi=i*2;push2(top[i],top[n],apex);}
 if(withCore){const cr=rad.map(v=>v*.42),cring=yy=>cr.map((rr,i)=>{const t=i/k*TAU;return T([Math.cos(t)*rr,yy,Math.sin(t)*rr]);}),c0=cring(.02),c1=cring(bev*.82),ca=T([0,bev+tip*.55,0]);for(let i=0;i<k;i++){const n=(i+1)%k;push(core,c0[i],c1[n],c1[i]);push(core,c0[i],c0[n],c1[n]);push(core,c1[i],c1[n],ca);}}}
function cluster(map,x,y,z,scale,seed,small,amb){const rnd=rng(seed),P=amb?'aCrystal':'crystal',a={lo:grp(map,P),hi:grp(map,P+'Hi')},c=grp(map,amb?'aCore':'core');
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
 {const fx=.97*s,h0=3.55*s,w=.34*s,hh=.62*s,t=.07*s;b.box('ivory',fx-.06,h0,0,.08,hh*1.5,w*2.6,0);b.tube('amber',[fx,h0-hh/2,-w],[fx,h0+hh/2,-w],t,5);b.tube('amber',[fx,h0-hh/2,w],[fx,h0+hh/2,w],t,5);b.tube('amber',[fx,h0+hh/2,-w],[fx,h0,0],t,5);b.tube('amber',[fx,h0+hh/2,w],[fx,h0,0],t,5);}
 bake(map,b,x,y,z,0);}
// distant golden domed skyline behind the portal (one baked mesh, far decor)
const SKYS={};function skyline(map,r,ch=1){const SKY=SKYS[ch]=[];const rnd=rng(777);for(let i=0;i<9;i++){const z=-26+i*8.5+(rnd()-.5)*3,x=-72-rnd()*14,y=r.terrain(x,z,ch)-.3,b=new B(),k=rnd();
 if(k<.45){const R0=2.2+rnd()*2.2;b.tube('ivory',[0,0,0],[0,R0*.9,0],R0,14);for(let j=1;j<=5;j++){const a0=(j-1)/5*Math.PI/2,a1=j/5*Math.PI/2;b.tube('gold',[0,R0*.9+Math.sin(a0)*R0,0],[0,R0*.9+Math.sin(a1)*R0,0],Math.cos(a0)*R0,14,Math.max(Math.cos(a1)*R0,.05));}b.tube('gold',[0,R0*1.9,0],[0,R0*1.9+2.4,0],.18,6,.02);SKY.push([x,y,z,0,R0]);for(let w=0;w<8;w++){const a=w/8*TAU+.2;b.box('amber',Math.cos(a)*R0*1.005,R0*.2,Math.sin(a)*R0*1.005,.25,.35,.25,-a);}for(let w=0;w<5;w++){const a=w/5*TAU;b.box('amber',Math.cos(a)*R0*1.01,R0*.45,Math.sin(a)*R0*1.01,.35,.7,.35,-a);}}
 else{const H=7+rnd()*9;b.tube('ivory',[0,0,0],[0,H,0],.9,10,.7);for(const f of[.4,.7])b.tube('gold',[0,H*f,0],[0,H*f+.25,0],.95-f*.2,10);b.tube('amber',[0,H*.55,0],[0,H*.62,0],.78,10);b.tube('gold',[0,H,0],[0,H+4,0],.75,10,.02);SKY.push([x,y,z,1,H]);for(let w=0;w<3;w++)for(let q=0;q<4;q++){const a=q/4*TAU+w;b.box('amber',Math.cos(a)*.86,H*(.2+w*.22),Math.sin(a)*.86,.2,.4,.2,-a);}}
 bake(map,b,x,y,z,0);}}
function portal(map,r){const{x,z,yaw,r:rad}=PORTAL,y=r.terrain(x,z,1)-.08,b=new B(),cy=rad+.95;
 b.box('stone',0,.2,0,1.6,.4,2*rad+2.4);b.box('gold',0,.43,0,1.3,.08,2*rad+2.0);
 b.ring('pgold',0,cy,0,rad,rad,.12,.55,40);b.ring('pgold',0,cy,0,rad*1.06,rad*1.06,.05,.62,40);b.ring('ivory',0,cy,0,rad*.9,rad*.9,.06,.42,40);b.ring('amber',0,cy,0,rad*.86,rad*.86,.025,.30,40);
 for(const s of[-1,1]){b.box('ivory',0,1.2,s*(rad+.35),.9,1.6,.9);b.box('gold',0,2.06,s*(rad+.35),1.0,.14,1.0);b.tube('gold',[0,2.1,s*(rad+.35)],[0,2.9,s*(rad+.35)],.22,10,.05);}
 b.tube('gold',[0,cy+rad,0],[0,cy+rad+.9,0],.28,10,.04);
 const m=new B();m.ring('membrane',0,cy,0,rad*.86,rad*.86,1,.04,40);
 // portal faces ±x after the yaw; paw emblems on both pedestal fronts
 bake(map,b,x,y,z,yaw);
 for(const s of[-1,1])for(const f of[-1,1]){const pb=new B();pb.paw(0,1.2,.46,.72,'violet');bake(map,pb,x,y,z+s*(rad+.35),f>0?Math.PI/2:-Math.PI/2);}}
function coin(){const b=new B();b.tube('amber',[0,0,-.04],[0,0,.04],.34,18);b.ring('amber',0,0,0,.34,.34,.12,.1,18);b.paw(0,-.02,.04,.42,'amber');const c=new B();c.paw(0,-.02,-.057,.42,'amber');
 const map=new Map();bake(map,b,0,0,0,0);for(const[mat,d]of c.groups){const g=grp(map,mat);for(let i=0;i<d.length;i+=6)g.push(d[i],d[i+1],-d[i+2]-.0,d[i+3],d[i+4],-d[i+5]);}return map;}
function addGroups(r,prefix,map,list){for(const[mat,data]of map){if(!data.length)continue;const key=prefix+'_'+mat;r.addMesh(key,data);list.push([key,mat]);}}
R.v49Build=function(){if(this.v49)return this.v49;this.ensureWorldModels&&this.ensureWorldModels();const L={},add=(n,map)=>{L[n]=[];addGroups(this,'v49_'+n,map,L[n]);};
 const west=new Map(),north=new Map(),small=new Map();portal(west,this);tower(west,this,TOWERS[0][0],TOWERS[0][1],TOWERS[0][2]);tower(west,this,TOWERS[1][0],TOWERS[1][1],TOWERS[1][2]);
 cluster(west,CRYSTALS[0][0],this.terrain(CRYSTALS[0][0],CRYSTALS[0][1],1)-.05,CRYSTALS[0][1],CRYSTALS[0][2],491,false);cluster(west,CRYSTALS[1][0],this.terrain(CRYSTALS[1][0],CRYSTALS[1][1],1)-.05,CRYSTALS[1][1],CRYSTALS[1][2],492,false);
 cluster(small,CRYSTALS[0][0]+.6,this.terrain(CRYSTALS[0][0],CRYSTALS[0][1],1)-.05,CRYSTALS[0][1]-.4,.5,493,true);cluster(small,CRYSTALS[1][0]+.7,this.terrain(CRYSTALS[1][0],CRYSTALS[1][1],1)-.05,CRYSTALS[1][1]+.5,.6,498,true,true);const sky=new Map();skyline(sky,this);
 tower(north,this,TOWERS[2][0],TOWERS[2][1],TOWERS[2][2]);for(const[i,c]of[[2,CRYSTALS[2]],[3,CRYSTALS[3]]])cluster(north,c[0],this.terrain(c[0],c[1],1)-.05,c[1],c[2],494+i,true);
 add('west',west);add('north',north);add('small',small);add('sky',sky);return this.v49={L};};
const on=s=>!!(s&&Number(s.chapter)===1),onAll=s=>!!(s&&[1,2,3,4,5,6,7,8,9].includes(Number(s.chapter)));
// violet re-tint of blue crystal glass / glow while in chapter 1
const violet=c=>{const b=Math.max(c[2],.001);return[b*.66,Math.min(c[1],b)*.36+.03,b];};
R.put=function(shape,x,y,z,sx,sy,sz,color,yaw,kind,glow,...rest){if(this.v49On&&kind===13&&typeof shape==='string'&&(shape==='crystal'||shape==='crystal2'||shape.startsWith('v40_frag_')||shape.startsWith('v40_cluster_')||shape.startsWith('v43_')&&shape.endsWith('_crystal'))){const h=Math.abs(Math.sin(x*12.9898+z*78.233)*43758.5453)%1,amb=h<.3;kind=30;color=[.24,.62,1.];glow=.5;if(this._v52cr&&this._v52cr.length<40&&(x||z))this._v52cr.push([x,y,z,Math.min(1.4,Math.max(sy||1,.4)),amb]);}else if(this.v49On&&color&&(kind===13||kind===12)&&color[2]>.45&&color[2]>color[0]*1.7&&color[2]>=color[1]*1.05)color=violet(color);return old.put.call(this,shape,x,y,z,sx,sy,sz,color,yaw,kind,glow,...rest);};
R.scene=function(state,p,t,...args){const out=old.scene.call(this,state,p,t,...args);if(!onAll(state))return out;const ch=Number(state.chapter);if(ch!==1){if(this.quality!=='low'){const k='v52sky'+ch;if(!this[k]){const m=new Map();skyline(m,this,ch);const L=[];addGroups(this,'v52_sky'+ch,m,L);this[k]=L;}for(const[key,mat]of this[k]){const[kind,col]=MATS[mat];old.put.call(this,key,0,0,0,1,1,1,col,0,kind,mat==='amber'?.55:mat==='gold'?.08:0);}}return out;}const v=this.v49Build(),low=this.quality==='low',eye=this.eye||[0,0,0];
 const draw=(name,dx=0,dy=0,dz=0,yaw=0)=>{for(const[key,mat]of v.L[name]||[]){const[kind,col]=MATS[mat];const g=mat==="pgold"?.17+.04*Math.sin(t*1.5):mat==='gold'?.08:mat==='amber'?.55:mat==='violet'?.8+.2*Math.sin(t*2.1):mat==='core'?.85+.15*Math.sin(t*1.6):mat==='membrane'?.22+.08*Math.sin(t*1.3):mat==='crystal'||mat==='aCrystal'?.32+.08*Math.sin(t*1.7):mat==='crystalHi'||mat==='aCrystalHi'?.5+.15*Math.sin(t*2.3):mat==='aCore'?.9:0;old.put.call(this,key,dx,dy,dz,1,1,1,col,yaw,kind,g);}};
 const dW=Math.hypot(eye[0]-PORTAL.x,eye[2]-PORTAL.z),dN=Math.hypot(eye[0]-TOWERS[2][0],eye[2]-TOWERS[2][1]);
 if(dW<170){draw('west');if(!low&&dW<60)draw('small');}if(!low&&dN<150)draw('north');if(!low)draw('sky');
 return out;};
R.render=function(state,...args){const v=onAll(state);this._v52ch=v?Number(state.chapter):0;this._v52cr=[];this.v49On=v;this.skyMood=v?1:0;this.worldMood=v?(this._v52ch===1?1:2):0;
 if(typeof document==='object'&&document.body&&document.body.classList&&this._v49Ui!==v){this._v49Ui=v;document.body.classList.toggle('mk-v49',v);}
 const out=old.render.call(this,state,...args);if(v&&this.vp&&this.gl)try{this.v50Fx(state,args[0],args[1]||0,args[3]||0);if(this.quality!=='low'&&!this._v51Off&&!root.__mkNoBloom){const m=this.v51Measure,gl=this.gl;let t0=0;if(m){gl.finish();t0=performance.now();}this.v51Bloom();if(m){gl.finish();this.v51BloomMs=performance.now()-t0;}}}catch(e){this._v51Off=true;this._v50Off=true;if(typeof console!=='undefined')console.warn('v50 fx off',e);}return out;};
// ---------- v50 fx: one premultiplied overlay draw (portal swirl, glow halos, paw coins, sparkles, ground tint) ----------
const FXV='attribute vec3 pos;attribute vec4 info;attribute vec4 tone;uniform mat4 vp;varying vec4 I;varying vec4 T;void main(){I=info;T=tone;gl_Position=vp*vec4(pos,1.);}';
const FXF='precision mediump float;varying vec4 I;varying vec4 T;uniform float time;'+
 'float paw(vec2 q){float d=length((q-vec2(0.,-.22))*vec2(1.,1.25))-.34;d=min(d,length(q-vec2(-.40,.16))-.14);d=min(d,length(q-vec2(-.14,.40))-.15);d=min(d,length(q-vec2(.14,.40))-.15);d=min(d,length(q-vec2(.40,.16))-.14);return d;}'+
 'void main(){vec2 uv=I.xy;float k=I.z,r=length(uv);vec3 c=T.rgb;float w=T.a;vec4 o=vec4(0.);'+
 'if(k<.5){float g=exp(-r*r*3.2)*(1.-smoothstep(.7,1.,r));o=vec4(c*g*w,0.);}'+
 'else if(k<1.5){if(r>1.)discard;float an=atan(uv.y,uv.x);float sw=sin(an*3.+r*10.-time*2.4)*.5+.5;float sw2=sin(an*5.-r*14.+time*1.7)*.5+.5;'+
  'vec3 vio=vec3(.42,.10,.95),pink=vec3(1.,.36,.82),gold=vec3(1.,.78,.35);vec3 col=mix(vio,pink,smoothstep(.25,.95,sw*r+.15));col=mix(col,gold,smoothstep(.55,1.,sw2)*(1.-r)*.9);'+
  'col+=vec3(1.,.85,.65)*exp(-r*r*9.)*.45;col+=vec3(1.,.8,.5)*smoothstep(.82,1.,r)*.8;col*=.82;float a=(1.-smoothstep(.93,1.,r))*.92;o=vec4(col*a*w,a*w);}'+
 'else if(k<2.5){float s=max(0.,1.-abs(uv.x)*7.)*max(0.,1.-abs(uv.y))+max(0.,1.-abs(uv.y)*7.)*max(0.,1.-abs(uv.x));s=s*s+exp(-r*r*18.);o=vec4(c*s*w,0.);}'+
 'else if(k<3.5){float d=r/.72;if(d>1.){float h=exp(-(d-1.)*5.)*.5*(1.-smoothstep(1.25,1.39,d));o=vec4(vec3(1.,.72,.3)*h*w,0.);}else{float rim=smoothstep(.76,.84,d)*(1.-smoothstep(.95,1.,d));float pd=paw(uv/.72/.72);'+
  'vec3 g=.82*mix(vec3(1.,.86,.45),vec3(.86,.52,.12),uv.y/.72*-.5+.5);g=mix(g,vec3(.74,.40,.06),(1.-smoothstep(-.02,.02,pd))*.85);g=mix(g,vec3(1.,.93,.62),rim);'+
  'float sh=smoothstep(.12,0.,abs((uv.x+uv.y)/.72-mod(time*.9,4.)+2.))*.8;g+=vec3(1.,.95,.8)*sh;float a=1.-smoothstep(.97,1.,d);o=vec4(g*a*w,a*w);}}'+
 'else{float g=(1.-smoothstep(0.,1.,r));g*=g;o=vec4(c*g*w,0.);}'+
 'gl_FragColor=o;}';
R.v50Prog=function(){if(this._v50P!==undefined)return this._v50P;const gl=this.gl,sh=(t,src)=>{const o=gl.createShader(t);gl.shaderSource(o,src);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(o));return o;};
 try{const p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,FXV));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,FXF));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error('link');
  this._v50P={p,pos:gl.getAttribLocation(p,'pos'),info:gl.getAttribLocation(p,'info'),tone:gl.getAttribLocation(p,'tone'),vp:gl.getUniformLocation(p,'vp'),time:gl.getUniformLocation(p,'time'),buf:gl.createBuffer()};}catch(e){this._v50P=null;}return this._v50P;};
// ---------- v51 cheap bloom: full-frame copy -> quarter-res bright pass -> separable blur -> additive composite ----------
const QV='attribute vec2 a;varying vec2 uv;void main(){uv=a*.5+.5;gl_Position=vec4(a,0.,1.);}';
const BRIGHT='precision mediump float;varying vec2 uv;uniform sampler2D src;uniform vec2 px;void main(){vec3 c=(texture2D(src,uv+px*vec2(-1.,-1.)).rgb+texture2D(src,uv+px*vec2(1.,-1.)).rgb+texture2D(src,uv+px*vec2(-1.,1.)).rgb+texture2D(src,uv+px*vec2(1.,1.)).rgb)*.25;float l=dot(c,vec3(.3,.55,.15))*.6+max(c.r,max(c.g,c.b))*.4;float k=smoothstep(.93,1.,l);gl_FragColor=vec4(c*k*k,1.);}';
const BLUR='precision mediump float;varying vec2 uv;uniform sampler2D src;uniform vec2 px;void main(){vec3 c=texture2D(src,uv).rgb*.227;c+=(texture2D(src,uv+px*1.38).rgb+texture2D(src,uv-px*1.38).rgb)*.316;c+=(texture2D(src,uv+px*3.23).rgb+texture2D(src,uv-px*3.23).rgb)*.070;gl_FragColor=vec4(c,1.);}';
const COMP='precision mediump float;varying vec2 uv;uniform sampler2D src;uniform vec2 px;void main(){gl_FragColor=vec4(texture2D(src,uv).rgb*px.x,1.);}';
R.v51Bloom=function(){const gl=this.gl,W=gl.drawingBufferWidth,H=gl.drawingBufferHeight;let b=this._v51;
 if(!b){const sh=(t,src)=>{const o=gl.createShader(t);gl.shaderSource(o,src);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(o));return o;},vs=sh(gl.VERTEX_SHADER,QV);
  const prog=f=>{const p=gl.createProgram();gl.attachShader(p,vs);gl.attachShader(p,sh(gl.FRAGMENT_SHADER,f));gl.bindAttribLocation(p,0,'a');gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error('bloom link');return{p,src:gl.getUniformLocation(p,'src'),px:gl.getUniformLocation(p,'px')};};
  const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  b=this._v51={bright:prog(BRIGHT),blur:prog(BLUR),comp:prog(COMP),buf,w:0,h:0};}
 const tex=(w,h)=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,w,h,0,gl.RGB,gl.UNSIGNED_BYTE,null);for(const[k,v]of[[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,k,v);return t;};
 gl.activeTexture(gl.TEXTURE7);
 if(b.w!==W||b.h!==H){for(const t of[b.full,b.t1,b.t2])if(t)gl.deleteTexture(t);for(const f of[b.f1,b.f2])if(f)gl.deleteFramebuffer(f);b.w=W;b.h=H;b.qw=Math.max(1,W>>2);b.qh=Math.max(1,H>>2);b.full=tex(W,H);b.t1=tex(b.qw,b.qh);b.t2=tex(b.qw,b.qh);
  const fb=t=>{const f=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,f);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('bloom fbo');return f;};b.f1=fb(b.t1);b.f2=fb(b.t2);gl.bindFramebuffer(gl.FRAMEBUFFER,null);}
 gl.bindTexture(gl.TEXTURE_2D,b.full);gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,W,H);
 gl.disable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.disable(gl.BLEND);gl.depthMask(false);gl.bindBuffer(gl.ARRAY_BUFFER,b.buf);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
 const pass=(P,fbo,w,h,src,px)=>{gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.viewport(0,0,w,h);gl.useProgram(P.p);gl.bindTexture(gl.TEXTURE_2D,src);gl.uniform1i(P.src,7);gl.uniform2fv(P.px,px);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);};
 pass(b.bright,b.f1,b.qw,b.qh,b.full,[1.5/W,1.5/H]);
 pass(b.blur,b.f2,b.qw,b.qh,b.t1,[1/b.qw,0]);pass(b.blur,b.f1,b.qw,b.qh,b.t2,[0,1/b.qh]);
 pass(b.blur,b.f2,b.qw,b.qh,b.t1,[2/b.qw,0]);pass(b.blur,b.f1,b.qw,b.qh,b.t2,[0,2/b.qh]);
 gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);pass(b.comp,null,W,H,b.t1,[.5,0]);
 gl.disableVertexAttribArray(0);gl.disable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(true);gl.enable(gl.DEPTH_TEST);gl.activeTexture(gl.TEXTURE0);};
// coins on the path from camp to the portal (decor only)
const COINS=[[-6,12.4],[-8.5,11.6],[-11,12.6],[-13.5,11.6],[-16,12.4],[-18.5,11.8]];
R.v50Fx=function(state,p,t,yaw){if(this._v50Off)return;const P=this.v50Prog();if(!P)return;const gl=this.gl,low=this.quality==='low',eye=this.eye||[0,0,0],Q=[];
 const V=this.vp,rl=Math.hypot(V[0],V[8])||1,rx=V[0]/rl,rz=V[8]/rl;
 const bill=(x,y,z,sx,sy,k,c,w)=>{if(Math.hypot(x-eye[0],z-eye[2])>140)return;for(const[u,q]of[[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]])Q.push(x+rx*u*sx,y+q*sy,z+rz*u*sx,u,q,k,0,c[0],c[1],c[2],w);};
 const flat=(x,z,rad,c,w,fch=1)=>{const N=3;for(let j=0;j<N;j++)for(let i=0;i<N;i++){const q=[[i,j],[i+1,j],[i+1,j+1],[i,j+1]].map(([a,b])=>{const u=a/N*2-1,v=b/N*2-1,px=x+u*rad,pz=z+v*rad;return[px,this.terrain(px,pz,fch)+.04,pz,u,v];});for(const n of[0,1,2,0,2,3])Q.push(...q[n],4,0,c[0],c[1],c[2],w);}};
 const ch=this._v52ch||1;const ty=this.terrain(PORTAL.x,PORTAL.z,1)-.08,cy=ty+PORTAL.r+.95,pr=PORTAL.r*.87,pul=.85+.15*Math.sin(t*2.);
 if(ch===1){
 // ground tint pools: warm gold plaza + violet near crystals (static-looking, cheap)
 flat(PORTAL.x+2.5,PORTAL.z,6.5,[.30,.19,.07],.9);if(!low){flat(-18,12,5,[.22,.14,.05],.7);for(const[x,z,sc]of CRYSTALS)flat(x,z,2.6*sc+.8,[.05,.18,.42],.9);flat(TOWERS[0][0]+1,TOWERS[0][1],3,[.25,.15,.05],.7);flat(TOWERS[1][0]+1,TOWERS[1][1],3,[.25,.15,.05],.7);}
 // portal swirl disc in the portal plane (faces +-x)
 for(const[u,q]of[[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]])Q.push(PORTAL.x,cy+q*pr,PORTAL.z+u*pr,u,q,1,0,1,1,1,1);
 bill(PORTAL.x+.3,cy,PORTAL.z,PORTAL.r*2.1,PORTAL.r*2.1,0,[.75,.35,1.],.32*pul);bill(PORTAL.x+.4,cy,PORTAL.z,PORTAL.r*1.2,PORTAL.r*1.2,0,[1.,.7,.35],.18);
 // tower beacons + window glows + M emblems
 for(const[x,z,sc]of TOWERS){const y=this.terrain(x,z,1)-.1;bill(x,y+6.0*sc,z,1.6*sc,1.6*sc,0,[1.,.66,.25],.9*pul);if(!low){bill(x+1.05*sc,y+3.55*sc,z,.9*sc,.9*sc,0,[1.,.7,.3],.8);bill(x,y+8.6*sc,z,.5,.5,2,[1.,.9,.6],.9);}}
 // crystal halos + sparkles
 CRYSTALS.forEach(([x,z,sc],i)=>{const y=this.terrain(x,z,1);bill(x,y+1.0*sc,z,3.0*sc,2.8*sc,0,[.25,.62,1.],.6*pul);bill(x,y+.9*sc,z,1.0*sc,1.3*sc,0,[.75,.92,1.],.4*pul);if(!low)for(let j=0;j<3;j++){const ph=t*1.3+i*2.1+j*2.09,tw=Math.max(0,Math.sin(ph*2.3));bill(x+Math.cos(ph)*.45*sc,y+(.6+j*.55)*sc,z+Math.sin(ph)*.45*sc,.28*sc,.28*sc,2,[.95,.85,1.],tw);}});
 // amber small cluster glow
 bill(CRYSTALS[1][0]+.7,this.terrain(CRYSTALS[1][0],CRYSTALS[1][1],1)+.5,CRYSTALS[1][1]+.5,1.4,1.2,0,[.3,.66,1.],.8*pul);
 // floating sparkles drifting up around the portal
 if(!low)for(let i=0;i<14;i++){const a=i*2.39996,f=((t*.12+i*.071)%1),R2=pr*(.9+.6*((i*.37)%1));const x=PORTAL.x+.6+Math.sin(a+t*.2)*.8,z=PORTAL.z+Math.cos(a)*R2,y=ty+.5+f*(PORTAL.r*2.6);bill(x,y,z,.22,.22,2,i%3?[1.,.8,.45]:[.85,.55,1.],Math.sin(f*Math.PI)*.9);}
 }
 // generic crystal glow (re-tinted camp crystals, all chapters)
 const crL=(this._v52cr||[]).slice();if(this.v76Cast)for(const L of this.v76Cast.values())for(const c of L){if(Math.hypot(c.x-eye[0],c.z-eye[2])<70)crL.push([c.x,this.terrain(c.x,c.z,ch),c.z,Math.min(2.6,c.h*.5),0]);}
 for(const[x,y,z,sz,amb]of crL){bill(x,y+sz*.6,z,sz*3.,sz*2.8,0,[.2,.5,1.],.4*pul);bill(x,y+sz*.45,z,sz*.9,sz*1.2,0,[.6,.85,1.],.18*pul);flat(x,z,sz*1.8+.6,[.10,.36,.95],1.,ch);if(!low){const ph=t*1.5+x;bill(x+Math.cos(ph)*.3*sz,y+sz*(.4+.3*Math.sin(ph*.7)),z+Math.sin(ph)*.3*sz,.22*sz,.22*sz,2,[1.,.9,1.],Math.max(0,Math.sin(ph*2.1)));}}
 // v53 rocket engine glow (all stages) and animated launch flame once the rocket is complete
 if(ch>=4&&this.v43&&this.v43.w&&this.v43.w.pad&&root.MoonRocketWorld){let[px,pz]=root.MoonRocketWorld.PAD;const top=this.v43.w.pad.top,st=root.MoonCore&&root.MoonCore.rocketStage?root.MoonCore.rocketStage(state):0;
  const ed=Math.hypot(eye[0]-px,eye[2]-pz)||1,ox=(eye[0]-px)/ed*1.25,oz=(eye[2]-pz)/ed*1.25;px+=ox;pz+=oz;if(st>=1){const fl=.8+.2*Math.sin(t*9.)*Math.sin(t*5.3);bill(px,top+.2,pz,2.2,1.0,0,[1.,.55,.2],.45*fl);
   if(ch===4?state.chapter4Complete:ch===5&&state.igniterIn){for(let i=0;i<6;i++){const f=((t*2.4+i/6)%1),y=top+.55-f*.6,w=.45+f*1.3;bill(px+Math.sin(t*13+i)*.06,y,pz,w,w*1.5,0,f<.35?[1.,.9,.65]:[1.,.5,.15],(1.-f)*.55);}bill(px,top+.55,pz,.45,.5,0,[1.,.95,.8],.8*fl);bill(px,top+.35,pz,3.6,.6,0,[1.,.6,.25],.5*fl);}}}
 // paw coins: big readable billboards that spin (width ~ |cos|) with halo, bobbing
 const CO=ch!==1?[]:COINS.map(([x,z],i)=>[x,this.terrain(x,z,1)+1.7+Math.sin(t*2+i)*.15,z]);if(ch!==1){const ax=3,az=10,ay=this.terrain(ax,az,ch)+3.4;for(let i=0;i<6;i++){const an=t*.4+i/6*TAU;CO.push([ax+Math.cos(an)*3.2,ay+Math.sin(t*1.3+i)*.25,az+Math.sin(an)*3.2]);}}else for(let i=0;i<6;i++){const an=t*.35+i/6*TAU,R3=PORTAL.r+1.3;CO.push([PORTAL.x+.2,cy+Math.sin(an)*R3,PORTAL.z+Math.cos(an)*R3]);}
 CO.forEach(([x,y,z],i)=>{const fd=Math.min(1,Math.max(0,(Math.hypot(x-eye[0],z-eye[2])-3.5)/3),p&&p.x!=null&&i<COINS.length?Math.max(0,(Math.hypot(x-p.x,z-p.z)-2.2)/2):1);if(fd<=0)return;const sp=Math.cos(t*2.2+i*.9),C=i<COINS.length?.5:.85,sx=C*(.78+.22*Math.abs(sp));bill(x,y,z,C*1.5,C*1.5,0,[1.,.66,.22],.22*fd);bill(x,y,z,sx/.72,C/.72,3,[1,1,1],fd);});
 if(!low)for(const[x,y,z,tp,S]of SKYS[ch]||[]){if(tp===0){bill(x+S,y+S*.45,z,S*1.6,S*.9,0,[1.,.6,.22],.55);bill(x,y+S*1.9+2.5,z,.6,.6,0,[1.,.85,.5],.9*pul);bill(x+S*.5,y+S*1.6,z,S*1.3,S*.8,0,[1.,.72,.3],.35);}else{bill(x+.8,y+S*.5,z,1.4,S*.5,0,[1.,.6,.22],.45);bill(x,y+S+4.1,z,.5,.5,2,[1.,.9,.6],.9*pul);}}
 // soft warm/violet rim halo behind the hero
 if(p&&p.x!=null&&!low){const hx=p.x,hz=p.z,hy=this.terrain(hx,hz,ch)+.9+(p.alt||0);const bx=hx-Math.sin(yaw)*.35,bz=hz-Math.cos(yaw)*.35;bill(bx,hy,bz,1.35,1.45,0,[.75,.45,1.],.2);bill(bx,hy+.15,bz,.95,1.15,0,[1.,.78,.42],.12);}
 if(!Q.length)return;const data=new Float32Array(Q);
 gl.useProgram(P.p);gl.uniformMatrix4fv(P.vp,false,this.vp);gl.uniform1f(P.time,t);gl.bindBuffer(gl.ARRAY_BUFFER,P.buf);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);
 gl.enable(gl.DEPTH_TEST);gl.depthMask(false);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
 gl.enableVertexAttribArray(P.pos);gl.vertexAttribPointer(P.pos,3,gl.FLOAT,false,44,0);gl.enableVertexAttribArray(P.info);gl.vertexAttribPointer(P.info,4,gl.FLOAT,false,44,12);gl.enableVertexAttribArray(P.tone);gl.vertexAttribPointer(P.tone,4,gl.FLOAT,false,44,28);
 gl.drawArrays(gl.TRIANGLES,0,data.length/11);gl.disableVertexAttribArray(P.pos);gl.disableVertexAttribArray(P.info);gl.disableVertexAttribArray(P.tone);
 gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(true);gl.disable(gl.BLEND);this.v50Stats={fxQuads:data.length/66|0};};
function inside1(x,z){for(const[tx,tz,s]of TOWERS)if(Math.hypot(x-tx,z-tz)<1.6*s+.3)return true;for(const[px,pz]of PEDESTALS)if(Math.abs(x-px)<.85&&Math.abs(z-pz)<.85)return true;
 for(const[cx,cz,s]of CRYSTALS)if(Math.hypot(x-cx,z-cz)<.55*s+.25)return true;return false;}
R.blocked=function(x,z,state,alt=0){if(on(state)&&alt<2.4&&inside1(x,z))return true;return old.blocked.call(this,x,z,state,alt);};
root.MoonChapter1Style={PORTAL,TOWERS,CRYSTALS,PEDESTALS,inside:inside1,violet};
})(typeof window!=='undefined'?window:globalThis);
