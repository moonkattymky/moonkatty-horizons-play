/* v43 LIFE #4 "The Rocket": chapter-4 locations for the open world.
   - launch pad complex (plinth, twin lattice towers, gantry crane) with the rocket growing in stages 0..3
     (blueprint hologram rings mark the sections that are still missing)
   - wreck of an old ship in a crater (tilted broken hull, ribs, debris, winch over the salvage engine, power terminal)
   - crystal cave (boulder walls with an overhang, glowing wall crystals, three collectible shards, the core heart)
   - abandoned hangar (Quonset half-cylinder with missing panels, warm lamps, nose cone and fins until taken)
   Everything is baked once into world-space meshes per site and material (frustum culled per site), drawn only in
   chapter 4, collides through blocked()/cameraBlocked(), and adds warm/blue light pools and halos.
   Low quality skips debris, extra crystals and most halos. Chapters 1-3 are untouched. */
(function(root){'use strict';
const R=root.MoonRenderer&&root.MoonRenderer.prototype,Core=root.MoonCore,B=root.MoonOutpostBuilder,M=root.MoonRenderMath;
if(!R||!Core||!B)return;
const old={ensure:R.ensureWorldModels,scene:R.scene,render:R.render,blocked:R.blocked,camera:R.cameraBlocked};
const TAU=Math.PI*2,norm=v=>{const l=Math.hypot(v[0],v[1],v[2])||1;return[v[0]/l,v[1]/l,v[2]/l];},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
function rng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
const MATS={ivory:[17,[.88,.89,.87]],hull:[17,[.64,.62,.58]],pad:[17,[.52,.52,.50]],gold:[16,[.92,.63,.25]],steel:[0,[.23,.28,.31]],dark:[0,[.045,.065,.085]],rust:[0,[.30,.21,.15]],amber:[12,[1,.57,.14]],blue:[12,[.10,.62,1.0]],holo:[12,[.18,.66,1.0]],crystal:[13,[.06,.34,1.0]],core:[12,[.35,.80,1.0]],stone:[4,[.56,.56,.575]]};
const SITES=Core.ROCKET_SITES||{pad:[28,4],wreck:[-25,55],cave:[69,4],hangar:[-58,26]};
const PAD=SITES.pad,WRECK={c:[-25,57],a:[-31.6,57.9],b:[-18.6,56.2],r:2.25},ENGINE=[-28.6,52.4],CAVE=SITES.cave,HANGAR={x0:-66,x1:-51,z:26,r:6,door:2.8,doorH:3.9};
const HEART=[75.3,6.9],CAVE_ROCKS=[],PLINTH=4.4;
// ---------- small geometry helpers ----------
function grp(map,mat){let g=map.get(mat);if(!g)map.set(mat,g=[]);return g;}
function tri(map,mat,a,b,c,n){n=n||norm(cross(sub(b,a),sub(c,a)));grp(map,mat).push(...a,...n,...b,...n,...c,...n);}
function quad(map,mat,a,b,c,d,n){tri(map,mat,a,b,c,n);tri(map,mat,a,c,d,n);}
// bake a Builder (local space) into world-space groups with translation and yaw
function bake(map,b,x,y,z,yaw=0){const c=Math.cos(yaw),s=Math.sin(yaw);for(const[mat,data]of b.groups){const g=grp(map,mat);for(let i=0;i<data.length;i+=6){const px=data[i],py=data[i+1],pz=data[i+2],nx=data[i+3],ny=data[i+4],nz=data[i+5];g.push(x+c*px+s*pz,y+py,z-s*px+c*pz,c*nx+s*nz,ny,-s*nx+c*nz);}}}
// scaled copy of a unit mesh (rocks)
function xform(dst,data,x,y,z,sx,sy,sz,yaw){const c=Math.cos(yaw),s=Math.sin(yaw);for(let i=0;i<data.length;i+=6){const px=data[i]*sx,py=data[i+1]*sy,pz=data[i+2]*sz;const n=norm([data[i+3]/sx,data[i+4]/sy,data[i+5]/sz]);dst.push(x+c*px+s*pz,y+py,z-s*px+c*pz,c*n[0]+s*n[2],n[1],-s*n[0]+c*n[2]);}}
// faceted crystal prism (same language as the v40 clusters) with an emissive inner core
function prism(dst,core,x,y,z,r,h,yaw,pitch,roll,rnd,withCore){const k=6,rad=[];for(let i=0;i<k;i++)rad.push(r*(.78+rnd()*.38));const tip=h*(.22+rnd()*.12),bev=h-tip;
 const m=M?M.model(x,y,z,1,1,1,yaw,pitch,roll):null,T=p=>m?[m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]]:[x+p[0],y+p[1],z+p[2]];
 const ring=(yy,sc)=>rad.map((rr,i)=>{const t=i/k*TAU;return T([Math.cos(t)*rr*sc,yy,Math.sin(t)*rr*sc]);}),push=(a,b,c)=>{const n=norm(cross(sub(b,a),sub(c,a)));dst.push(...a,...n,...b,...n,...c,...n);};
 const b0=ring(-.12,1.02),mid=ring(bev*.55,1.0),top=ring(bev,.9),apex=T([0,h,0]);
 for(let i=0;i<k;i++){const n=(i+1)%k;push(b0[i],mid[n],mid[i]);push(b0[i],b0[n],mid[n]);push(mid[i],top[n],top[i]);push(mid[i],mid[n],top[n]);push(top[i],top[n],apex);}
 if(withCore){const cr=rad.map(v=>v*.42),cring=yy=>cr.map((rr,i)=>{const t=i/k*TAU;return T([Math.cos(t)*rr,yy,Math.sin(t)*rr]);}),c0=cring(.02),c1=cring(bev*.82),ca=T([0,bev+tip*.55,0]),pc=(a,b,c)=>{const n=norm(cross(sub(b,a),sub(c,a)));core.push(...a,...n,...b,...n,...c,...n);};for(let i=0;i<k;i++){const n=(i+1)%k;pc(c0[i],c1[n],c1[i]);pc(c0[i],c0[n],c1[n]);pc(c1[i],c1[n],ca);}}}
function cluster(dst,core,x,y,z,scale,seed,yaw=0,lean=0){const rnd=rng(seed);
 prism(dst,core,x,y,z,.24*scale,(1.7+rnd()*.5)*scale,yaw+rnd()*TAU,lean*.8+(rnd()-.5)*.12,(rnd()-.5)*.12,rnd,true);
 for(let i=0;i<5;i++){const t=i/5*TAU+rnd()*.6,d=(.22+rnd()*.12)*scale,tilt=.28+rnd()*.26;prism(dst,core,x+Math.cos(t)*d,y,z+Math.sin(t)*d,(.13+rnd()*.05)*scale,(.85+rnd()*.6)*scale,rnd()*TAU,Math.sin(t)*tilt+lean,-Math.cos(t)*tilt,rnd,true);}
 for(let i=0;i<6;i++){const t=i/6*TAU+rnd()*.5,d=(.45+rnd()*.25)*scale,tilt=.45+rnd()*.4;prism(dst,core,x+Math.cos(t)*d,y,z+Math.sin(t)*d,(.06+rnd()*.05)*scale,(.30+rnd()*.42)*scale,rnd()*TAU,Math.sin(t)*tilt+lean,-Math.cos(t)*tilt,rnd,false);}}
// horizontal annulus (two-sided) in world space
function annulus(map,mat,x,y,z,r0,r1,n=48){for(let i=0;i<n;i++){const a=i/n*TAU,b=(i+1)/n*TAU,p=(t,r)=>[x+Math.cos(t)*r,y,z+Math.sin(t)*r];quad(map,mat,p(a,r0),p(a,r1),p(b,r1),p(b,r0),[0,1,0]);quad(map,mat,p(b,r0),p(b,r1),p(a,r1),p(a,r0),[0,1,0]);}}
// vertical band ring (two-sided): hologram outline of a missing rocket section
function band(map,mat,x,y,z,r,h,n=36){for(let i=0;i<n;i++){const a=i/n*TAU,b=(i+1)/n*TAU,p=(t,yy)=>[x+Math.cos(t)*r,yy,z+Math.sin(t)*r],o=[Math.cos((a+b)/2),0,Math.sin((a+b)/2)];quad(map,mat,p(a,y),p(b,y),p(b,y+h),p(a,y+h),o);quad(map,mat,p(a,y+h),p(b,y+h),p(b,y),p(a,y),o.map(q=>-q));}}
// surface of revolution with absolute local heights (Builder.shell adds a fixed .15 offset)
function lathe(b,mat,profile,radius,y0,height,segs=48){const P=(r,y,t)=>[Math.sin(t)*r*radius,y0+y*height,Math.cos(t)*r*radius];
 const nrm=(j,t)=>{const lo=profile[Math.max(0,j-1)],hi=profile[Math.min(profile.length-1,j+1)],dy=(hi[1]-lo[1])*height,dr=(lo[0]-hi[0])*radius;return norm([Math.sin(t)*dy,dr,Math.cos(t)*dy]);};
 for(let j=0;j<profile.length-1;j++)for(let i=0;i<segs;i++){const a=i*TAU/segs,c=(i+1)*TAU/segs,[r0,y0_]=profile[j],[r1,y1_]=profile[j+1];b.quadNormals(mat,P(r0,y0_,a),P(r1,y1_,a),P(r1,y1_,c),P(r0,y0_,c),nrm(j,a),nrm(j+1,a),nrm(j+1,c),nrm(j,c));}}
// ---------- rocket (local space around the pad axis, y=0 on the plinth top) ----------
const RB=1.15;
function rocketStage(n){const b=new B();
 if(n===1){
  b.tube('dark',[0,.36,0],[0,1.38,0],.98,28,.5);b.tube('gold',[0,.30,0],[0,.42,0],1.02,28);b.tube('steel',[0,1.30,0],[0,1.46,0],.62,20);
  lathe(b,'ivory',[[.58,0],[.92,.1],[1,.2],[1,1]],RB,1.3,2.3);b.tube('gold',[0,1.95,0],[0,2.06,0],RB+.025,48);b.tube('gold',[0,2.36,0],[0,2.42,0],RB+.02,48);
  for(let i=0;i<4;i++){const a=i/4*TAU+TAU/8,c=Math.cos(a),s=Math.sin(a);b.box('steel',c*(RB+.02),2.9,s*(RB+.02),.34,.42,.34,-a);b.box('amber',c*(RB+.18),2.98,s*(RB+.18),.1,.06,.1,-a);}
 }
 if(n===2){
  lathe(b,'ivory',[[1,0],[1,1]],RB,3.6,4.8);b.tube('gold',[0,3.58,0],[0,3.76,0],RB+.03,48);b.tube('gold',[0,8.24,0],[0,8.4,0],RB+.03,48);
  // vertical seam strips and small hatches
  for(let i=0;i<6;i++){const a=i/6*TAU+.2,c=Math.cos(a),s=Math.sin(a);if(c<-.6)continue;b.box('steel',s*(RB+.012),6.0,c*(RB+.012),.05,3.6,.05,a);}
  b.box('steel',RB*.72,4.4,RB*.72,.32,.5,.06,TAU/8);
 }
 if(n===3){
  lathe(b,'ivory',[[1,0],[1,.16],[.97,.3],[.89,.46],[.75,.62],[.55,.76],[.32,.88],[.12,.96],[0,1]],RB,8.4,5.4);
  b.tube('gold',[0,8.42,0],[0,8.58,0],RB+.03,48);b.tube('gold',[0,9.25,0],[0,9.33,0],RB*.99+.02,48);b.tube('gold',[0,13.12,0],[0,14.2,0],.24,16,.015);
  // four swept fins with gold leading edges
  for(let i=0;i<4;i++){const a=i/4*TAU+TAU/8,c=Math.cos(a),s=Math.sin(a),P=(r,y,o)=>[c*r-s*o,y,s*r+c*o],th=.07;
   const pts=[[RB*.97,3.2],[RB*.97,.9],[2.35,.12],[2.45,.75]];
   b.quad('ivory',...pts.map(([r,y])=>P(r,y,th)).reverse());b.quad('ivory',...pts.map(([r,y])=>P(r,y,-th)));
   for(let k=0;k<4;k++){const[p,q]=[pts[k],pts[(k+1)%4]];b.quad('ivory',P(p[0],p[1],-th),P(q[0],q[1],-th),P(q[0],q[1],th),P(p[0],p[1],th));}
   b.tube('gold',P(RB*.97,3.25,0),P(2.47,.72,0),.07,6);b.tube('gold',P(2.36,.08,0),P(2.47,.76,0),.06,6);}
  // portholes facing the camp side (-x after yaw)
  for(const[yy,rr]of[[10.1,.26],[11.0,.2]]){b.ring('gold',0,yy,RB*.96+.03,rr,rr,.32,.12,14);}
 }
 return b;}
// window with the blue crystal fuel core (stage 2), built facing +z and baked with yaw -PI/2 so it faces the camp (-x)
function coreWindow(groups,x,y,z){const b=new B();b.ring('gold',0,6.0,RB-.02,.6,1.05,.2,.42,22);
 for(let i=0;i<22;i++){const a=i/22*TAU,c=(i+1)/22*TAU,p=t=>[Math.sin(t)*.52,6.0+Math.cos(t)*.95,Math.sqrt(Math.max(0,RB*RB-(Math.sin(t)*.52)**2))+.03];b.tri('blue',[0,6.0,RB+.03],p(c),p(a),[0,0,1]);}
 bake(groups,b,x,y,z,-Math.PI/2);
 const dst=grp(groups,'crystal'),core=grp(groups,'core'),rnd=rng(4343);
 for(let i=0;i<5;i++){const yy=5.25+i*.3;prism(dst,core,x-(RB+.02),y+yy,z+(rnd()-.5)*.5,.12+rnd()*.06,.55+rnd()*.35,rnd()*TAU,(rnd()-.5)*.6,Math.PI/2+(rnd()-.5)*.5,rnd,true);}}
// ---------- site builders ----------
function buildPad(r,ch){const out={main:new Map(),detail:new Map(),stages:[new Map(),new Map(),new Map()],holo:[new Map(),new Map(),new Map()],cap:new Map()};
 const[x,z]=PAD;let top=-1e9;for(let a=0;a<24;a++)for(const rr of[0,2,3.4,PLINTH])top=Math.max(top,r.terrain(x+Math.cos(a/24*TAU)*rr,z+Math.sin(a/24*TAU)*rr,ch));top+=.12;out.top=top;
 const b=new B();b.tube('pad',[0,-1.6,0],[0,0,0],PLINTH,44);b.tube('steel',[0,-1.7,0],[0,-.22,0],PLINTH+.12,44);b.tube('dark',[0,0,0],[0,.04,0],1.75,32);
 for(let i=0;i<16;i++){const a=i/16*TAU;b.box('amber',Math.cos(a)*(PLINTH-.22),.03,Math.sin(a)*(PLINTH-.22),.1,.07,.1,-a);}
 for(let i=0;i<4;i++){const a=i/4*TAU+TAU/8,c=Math.cos(a),s=Math.sin(a);b.box('steel',c*1.42,.22,s*1.42,.5,.44,.34,-a);b.box('gold',c*1.62,.48,s*1.62,.14,.1,.4,-a);}
 // twin lattice towers north and south of the rocket (the camp-facing side stays open)
 const tw=2.1,H=15.6,L=10;for(const side of[-1,1]){const cz=side*3.45,cx=.25;
  for(const[dx,dz]of[[-1,-1],[1,-1],[1,1],[-1,1]])b.box('gold',cx+dx*tw/2,H/2,cz+dz*tw/2,.1,H,.1);
  for(let k=1;k<=L;k++){const y=k*H/L,y0=(k-1)*H/L;b.box('gold',cx,y,cz-tw/2,tw,.08,.08);b.box('gold',cx,y,cz+tw/2,tw,.08,.08);b.box('gold',cx-tw/2,y,cz,.08,.08,tw);b.box('gold',cx+tw/2,y,cz,.08,.08,tw);
   const o=k%2?1:-1;b.tube('steel',[cx-tw/2,y0,cz+side*tw/2],[cx+tw/2,y,cz+side*tw/2],.035,4);b.tube('steel',[cx-tw/2*o,y0,cz-tw/2],[cx+tw/2*o,y,cz-tw/2],.035,4);b.tube('steel',[cx-tw/2,y0,cz-tw/2*o],[cx-tw/2,y,cz+tw/2*o],.035,4);b.tube('steel',[cx+tw/2,y0,cz+tw/2*o],[cx+tw/2,y,cz-tw/2*o],.035,4);
   if(k%3===0){b.box('dark',cx,y+.04,cz,tw,.05,tw);b.box('amber',cx-tw/2-.05,y-.14,cz-side*tw/2,.09,.09,.09);b.box('amber',cx+tw/2+.05,y-.14,cz-side*tw/2,.09,.09,.09);}}
  // service arms reaching the rocket at each section joint
  for(const y of[2.5,7.2,11.4])b.box('steel',cx-.15,y,side*(RB+.62),.46,.14,1.25);
  b.tube('dark',[cx-.6,H*.55,cz-side*tw/2],[0,5.4,side*RB*.9],.05,6);}
 // gantry crane bridging the tower tops with a trolley and hook
 b.box('gold',.25,H+.35,0,.16,.22,9.2);b.box('gold',-.35,H+.35,0,.12,.16,9.2);b.box('steel',-.05,H+.12,1.2,.8,.32,.7);b.tube('dark',[-.05,H,1.2],[-.05,H-2.2,1.2],.025,4);b.box('gold',-.05,H-2.3,1.2,.22,.18,.12);
 bake(out.main,b,x,top,z);
 // ground details around the plinth: cable runs, crates, a fuel cart (high quality only)
 const d=new B(),rnd=rng(431);for(const[a,len]of[[2.5,2.6],[3.6,2.1],[5.2,2.8]]){const c=Math.cos(a),s=Math.sin(a);d.tube('dark',[c*(PLINTH+.2),-.1,s*(PLINTH+.2)],[c*(PLINTH+len),-.1,s*(PLINTH+len)],.06,5);}
 bake(out.detail,d,x,top,z);
 const crate=(cx,cz,w,yaw,mat)=>{const y=r.terrain(cx,cz,ch);const c=new B();c.box(mat,0,w*.45,0,w,w*.9,w*.8);c.box('dark',0,w*.92,0,w*.7,.06,w*.5);bake(out.detail,c,cx,y-.05,cz,yaw);};
 crate(x+3.4,z+6.6,.9,.4,'ivory');crate(x+4.4,z+6.2,.7,1.1,'steel');crate(x+5.4,z-5.8,.8,.2,'ivory');crate(x-1.5,z-6.6,.75,.9,'steel');crate(x+6.3,z-4.9,.6,.5,'steel');
 // rocket sections
 for(let n=1;n<=3;n++)bake(out.stages[n-1],rocketStage(n),x,top,z,-Math.PI/2);coreWindow(out.stages[1],x,top,z);
 // stage 1 open top (dark cap) is visible only while the rocket is a stub
 const cap=new B();cap.tube('dark',[0,3.52,0],[0,3.6,0],RB*.98,32);cap.tube('gold',[0,3.5,0],[0,3.62,0],RB+.04,40);bake(out.cap,cap,x,top,z);
 // blueprint hologram outline of the missing sections
 const holo=(map,y0,y1,taper)=>{for(let y=y0;y<y1-.01;y+=.9){const t=(y-y0)/(y1-y0),rr=taper?RB*Math.max(.12,Math.cos(t*1.25)):RB;band(map,'holo',x,top+y,z,rr+.06,.035,32);}
  for(let i=0;i<4;i++){const a=i/4*TAU+TAU/8,p=[x+Math.cos(a)*(RB+.06),0,z+Math.sin(a)*(RB+.06)];const q=new B();q.box('holo',0,(y1-y0)/2,0,.035,y1-y0,.035);bake(map,q,p[0],top+y0,p[2]);}};
 holo(out.holo[0],.4,3.6,false);holo(out.holo[1],3.6,8.4,false);holo(out.holo[2],8.4,13.8,true);
 return out;}
function buildWreck(r,ch){const out={main:new Map(),detail:new Map(),engine:new Map()},rnd=rng(9431);
 const[ax,az]=WRECK.a,[bx,bz]=WRECK.b,ya=r.terrain(ax,az,ch)+.95,yb=r.terrain(bx,bz,ch)+.25,dir=norm([bx-ax,yb-ya,bz-az]),len=Math.hypot(bx-ax,yb-ya,bz-az),u=norm(cross(dir,[0,1,0])),v=cross(u,dir);
 // the hull rolls 0.35 rad onto its side
 const roll=-.55,U=u.map((q,i)=>q*Math.cos(roll)+v[i]*Math.sin(roll)),V=v.map((q,i)=>q*Math.cos(roll)-u[i]*Math.sin(roll));
 const P=(t,phi,rr)=>[ax+dir[0]*t*len+(U[0]*Math.cos(phi)+V[0]*Math.sin(phi))*rr,ya+dir[1]*t*len+(U[1]*Math.cos(phi)+V[1]*Math.sin(phi))*rr,az+dir[2]*t*len+(U[2]*Math.cos(phi)+V[2]*Math.sin(phi))*rr];
 const NA=18,NL=9,rad=t=>WRECK.r*(t>.82?Math.max(.25,1-(t-.82)/.18*.72):1);
 for(let j=0;j<NL;j++){const t0=j/NL,t1=(j+1)/NL;for(let i=0;i<NA;i++){const p0=i/NA*TAU,p1=(i+1)/NA*TAU,top=Math.sin((p0+p1)/2);
   const pm=P((t0+t1)/2,(p0+p1)/2,1),pc=P((t0+t1)/2,0,0),nw=[pm[0]-pc[0],pm[1]-pc[1],pm[2]-pc[2]],hole=(j>=2&&j<=6&&nw[1]>.42&&!(j===4&&i%6===2))||((j===3||j===4)&&nw[2]<-.6&&nw[1]>-.15)||(j===5&&nw[2]<-.75&&nw[1]>0)||(j===0&&rnd()<.45)||(j>1&&rnd()<.025);
   const ext=j===0?(rnd()-.2)*.06:0,burnt=j===0&&rnd()<.5,mat=burnt?'dark':rnd()<.13?'rust':'hull';
   const a=P(t0+ext,p0,rad(t0)),b=P(t0+ext,p1,rad(t0)),c=P(t1,p1,rad(t1)),d=P(t1,p0,rad(t1));
   if(!hole)quad(out.main,mat,a,d,c,b);
   const k=.94;quad(out.main,'dark',P(t0,p0,rad(t0)*k),P(t0,p1,rad(t0)*k),P(t1,p1,rad(t1)*k),P(t1,p0,rad(t1)*k));}}
 // exposed ribs and a stringer along the opened roof
 for(let j=1;j<NL;j++){const t=j/NL,rr=rad(t)*.99;for(let i=0;i<NA;i++){const b=new B();b.tube('rust',P(t,i/NA*TAU,rr),P(t,(i+1)/NA*TAU,rr),.07,4);bake(out.main,b,0,0,0);}}
 {const b=new B();for(const phi of[Math.PI*.42,Math.PI*.58])b.tube('steel',P(.18,phi,WRECK.r*.98),P(.72,phi,WRECK.r*.98),.06,5);bake(out.main,b,0,0,0);}
 // jagged broken end plates and an old tail fin sticking out
 {const b=new B();for(let i=0;i<7;i++){const phi=i/7*TAU+rnd()*.4,p=P(-.02,phi,WRECK.r*(.9+rnd()*.25));b.box(rnd()<.5?'hull':'rust',p[0],p[1],p[2],.9+rnd()*.6,.06,.6+rnd()*.5,rnd()*TAU);}bake(out.main,b,0,0,0);
  const f0=P(.12,Math.PI*.62,WRECK.r*.95),f1=P(.36,Math.PI*.62,WRECK.r*.95),tip=P(.06,Math.PI*.62,WRECK.r*2.25),tip2=P(.16,Math.PI*.62,WRECK.r*2.2);quad(out.main,'rust',f0,f1,tip2,tip);quad(out.main,'rust',tip,tip2,f1,f0);const e=new B();e.tube('gold',f0,tip,.05,5);bake(out.main,e,0,0,0);}
 // cockpit end: dark canopy windows with two emergency lights still burning
 {const b=new B();for(const s of[-1,1]){const p=P(.86,Math.PI*.5+s*.45,rad(.86)+.04);b.box('dark',p[0],p[1],p[2],.5,.3,.5);}const lamp=P(.6,Math.PI*.5,WRECK.r+.08),lamp2=P(.3,Math.PI*.25,WRECK.r+.06);b.box('amber',lamp[0],lamp[1],lamp[2],.1,.1,.1);b.box('amber',lamp2[0],lamp2[1],lamp2[2],.1,.1,.1);bake(out.main,b,0,0,0);out.lamps=[lamp,lamp2,P(.05,Math.PI*.7,WRECK.r+.05)];}
 // winch A-frame over the salvage engine and cable to the power terminal
 const[ex,ez]=ENGINE,ey=r.terrain(ex,ez,ch),pnl=Core.POINTS.wreckPanel;{const b=new B();for(const s of[-1,1]){b.tube('gold',[-1.5,0,s*1.1],[0,3.4,s*.2],.07,6);b.tube('gold',[1.5,0,s*1.1],[0,3.4,s*.2],.07,6);}b.tube('steel',[0,3.4,-.5],[0,3.4,.5],.12,10);b.box('steel',0,3.25,0,.4,.3,.4);b.tube('dark',[0,3.1,0],[0,2.6,0],.025,4);b.box('gold',0,2.55,0,.16,.12,.1);bake(out.main,b,ex,ey,ez,.3);
  const c=new B(),py=r.terrain(pnl[0],pnl[1],ch);c.tube('dark',[pnl[0]-ex-.4,py-ey+.08,pnl[1]-ez],[-.8,.08,-.6],.05,5);bake(out.main,c,ex,ey,ez,0);out.cable=[[pnl[0]-.4,pnl[1]],[ex-.8,ez-.6]];}
 {const b=new B();lathe(b,'dark',[[1,0],[.8,.3],[.62,.65],[.5,1]],.92,.35,1.0,24);b.tube('gold',[0,.3,0],[0,.4,0],.93,24);b.tube('steel',[0,1.3,0],[0,2.45,0],.6,20);b.tube('gold',[0,1.5,0],[0,1.62,0],.64,20);b.tube('gold',[0,2.2,0],[0,2.3,0],.64,20);
  lathe(b,'steel',[[1,0],[.8,.5],[.35,.9],[0,1]],.6,2.45,.45,20);for(let i=0;i<4;i++){const a=i/4*TAU;b.box('rust',Math.cos(a)*.62,1.9,Math.sin(a)*.62,.16,.5,.16,-a);}b.box('amber',.63,2.0,0,.06,.1,.1);b.tube('dark',[0,2.85,0],[0,3.25,0],.025,4);
  b.box('dark',0,.03,0,1.9,.06,1.9);bake(out.engine,b,ex,ey,ez,.3);}
 // debris field and bent plates around the crater floor
 {const b=new B();for(let i=0;i<16;i++){const a=rnd()*TAU,d=4+rnd()*6,px=-25+Math.cos(a)*d,pz=56+Math.sin(a)*d;if(Math.hypot(px-ex,pz-ez)<2.2||Object.values(Core.POINTS).some(p=>Math.hypot(px-p[0],pz-p[1])<1.6))continue;const y=r.terrain(px,pz,ch);const w=.4+rnd()*.9;b.box(rnd()<.6?'hull':'rust',px,y+.04,pz,w,.05,w*(.4+rnd()*.6),rnd()*TAU);}bake(out.detail,b,0,0,0);}
 out.P=P;return out;}
function buildCave(r,ch){const out={main:new Map(),detail:new Map(),shards:[],heart:{a:[],core:[]},crystals:[]},rnd=rng(6969),st=grp(out.main,'stone');
 const[cx,cz]=CAVE,data=k=>r.meshes['geology'+k]&&r.meshes['geology'+k].data;CAVE_ROCKS.length=0;
 const RV=root.MoonHorizons&&root.MoonHorizons.rockVariant,low=RV?[RV(31,2),RV(47,2),RV(59,1)]:[];
 // big wall boulders use the sculpted geology meshes; upper courses and roof slabs use low-poly faceted variants
 const rock=(x,z,s,h,yaw,lift=0,collide=true,k)=>{if(collide)CAVE_ROCKS.push([x,z,s*.82]);const y=r.terrain(x,z,ch);if(lift>0||k==='low'){const dm=low[Math.floor(rnd()*low.length)];if(dm)xform(st,dm,x,y+lift,z,s,h,s*.88,yaw);return;}const dm=data(Math.floor(rnd()*4));if(dm)xform(st,dm,x,y+h*.38,z,s,h*.55,s*.88,yaw);};
 // wall boulders in a horseshoe opening west, a second course on top and an overhanging roof over the back half
 for(let a=-145;a<=145;a+=19){const t=a*Math.PI/180,rr=8.6+rnd()*.5,x=cx+Math.cos(t)*rr,z=cz+Math.sin(t)*rr,s=2.3+rnd()*.8;rock(x,z,s,5.0+rnd()*1.6,rnd()*TAU);
  if(Math.abs(a)<120)rock(cx+Math.cos(t)*(rr+.6),cz+Math.sin(t)*(rr+.6),s*1.05,3.4,rnd()*TAU,3.6,false);}
 for(const[dx,dz,s]of[[3.2,0,4.8],[1.2,4.2,4.0],[1.6,-4.0,4.0],[5.6,3.2,3.6],[5.4,-3.0,3.6]])rock(cx+dx,cz+dz,s,2.2,rnd()*TAU,6.3,false);
 // mouth framing rocks
 for(const[dx,dz,s,h]of[[-9.6,-6.8,1.6,2.6],[-10.2,7.4,1.5,2.2],[-12.0,-4.6,.9,1.2]])rock(cx+dx,cz+dz,s,h*.9,rnd()*TAU,0,true,'low');
 // wall crystals (static) + their halos
 const cr=grp(out.main,'crystal'),core=grp(out.main,'core');
 for(const[a,rr,sc,lean]of[[-120,6.6,.9,.3],[-80,6.9,1.2,.25],[-40,6.8,.8,.2],[40,6.7,1.0,.25],[70,6.9,.8,.3],[110,6.6,1.1,.25],[-150,6.9,.7,.3],[150,6.7,.8,.3]]){const t=a*Math.PI/180,x=cx+Math.cos(t)*rr,z=cz+Math.sin(t)*rr,y=r.terrain(x,z,ch);cluster(cr,core,x,y,z,sc,500+a,rnd()*TAU,lean);out.crystals.push([x,y+sc*1.2,z,sc]);}
 if(true){const dc=grp(out.detail,'crystal'),dk=grp(out.detail,'core');for(let i=0;i<14;i++){const a=rnd()*TAU,d=2+rnd()*4.5,x=cx+Math.cos(a)*d+1,z=cz+Math.sin(a)*d;if(Object.values(Core.POINTS).some(p=>Math.hypot(x-p[0],z-p[1])<1.4))continue;const y=r.terrain(x,z,ch);prism(dc,dk,x,y,z,.07+rnd()*.06,.35+rnd()*.5,rnd()*TAU,(rnd()-.5)*.6,(rnd()-.5)*.6,rnd,true);}}
 // the heart: the big fuel-core formation at the back wall
 {const[hx,hz]=HEART,y=r.terrain(hx,hz,ch);cluster(out.heart.a,out.heart.core,hx,y,hz,2.1,7777,.4,0);out.heartPos=[hx,y+2.6,hz];}
 // three collectible shards (one mesh each)
 for(let i=1;i<=3;i++){const[x,z]=Core.POINTS['shard'+i],y=r.terrain(x,z,ch),a=[],c=[];cluster(a,c,x,y,z,.85,1000+i*17,i,0);out.shards.push({a,c,pos:[x,y+1.1,z]});}
 // work lamps the crew set up at the mouth
 {const b=new B();for(const[dx,dz]of[[-8.4,-4.6],[-8.0,5.2],[-1.5,6.2]]){const x=cx+dx,z=cz+dz,y=r.terrain(x,z,ch);const l=new B();l.tube('steel',[0,0,0],[0,2.1,0],.05,6);l.box('dark',0,2.15,0,.34,.2,.22);l.box('amber',0,2.1,.1,.24,.08,.04);for(const s of[-1,1])l.tube('steel',[0,.02,0],[s*.5,0,.35],.03,4);bake(out.main,l,x,y,z,Math.atan2(cx-x,cz-z));(out.lamps||(out.lamps=[])).push([x,y+2.1,z]);}}
 return out;}
function buildHangar(r,ch){const out={main:new Map(),detail:new Map(),nose:new Map(),fins:new Map(),lamps:[]},rnd=rng(5858),{x0,x1,z:hz,r:hr}=HANGAR;
 let lo=1e9;for(let x=x0;x<=x1;x+=1)for(const dz of[-hr,-hr/2,0,hr/2,hr])lo=Math.min(lo,r.terrain(x,hz+dz,ch));const base=lo-.25;out.base=base;
 const NA=14,NX=7,P=(x,phi,rr)=>[x,base+Math.sin(phi)*rr*.92,hz+Math.cos(phi)*rr];
 for(let j=0;j<NX;j++){const xa=x0+(x1-x0)*j/NX,xb=x0+(x1-x0)*(j+1)/NX;for(let i=0;i<NA;i++){const p0=i/NA*Math.PI,p1=(i+1)/NA*Math.PI,top=Math.sin((p0+p1)/2);
   const hole=(top>.8&&(j===2||j===3)&&i%2===0)||(top>.55&&j===5&&i===4)||rnd()<.05,mat=(i*3+j)%5===0?'steel':'hull';
   if(!hole)quad(out.main,mat,P(xa,p0,hr),P(xb,p0,hr),P(xb,p1,hr),P(xa,p1,hr));
   quad(out.main,'steel',P(xa,p1,hr*.97),P(xb,p1,hr*.97),P(xb,p0,hr*.97),P(xa,p0,hr*.97));}}
 // arched ribs (gold) at every bay and a heavier door frame
 {const b=new B();for(let j=0;j<=NX;j++){const x=x0+(x1-x0)*j/NX,th=j===NX?.16:.09;for(let i=0;i<NA;i++)b.tube('gold',P(x,i/NA*Math.PI,hr+.02),P(x,(i+1)/NA*Math.PI,hr+.02),th,5);}bake(out.main,b,0,0,0);}
 // back wall (closed) and front wall with a wide door opening: vertical strips under the arc, split at the door jambs
 const wall=(x,dir,open)=>{const lim=HANGAR.door,door=base+HANGAR.doorH,arc=[];for(let i=0;i<=NA;i++){const p=P(x,i/NA*Math.PI,hr);if(arc.length){const q=arc[arc.length-1];for(const e of[-lim,lim]){const za=q[2]-hz,zb=p[2]-hz;if((za-e)*(zb-e)<0){const f=(e-za)/(zb-za);arc.push([x,q[1]+(p[1]-q[1])*f,hz+e]);}}}arc.push(p);}
  for(let i=0;i<arc.length-1;i++){const a=arc[i],b=arc[i+1],mid=Math.abs((a[2]+b[2])/2-hz),bot=open&&mid<lim?door:base;if(a[1]<=bot+.01&&b[1]<=bot+.01)continue;
   const q=[[x,bot,a[2]],[x,bot,b[2]],[x,Math.max(bot,b[1]),b[2]],[x,Math.max(bot,a[1]),a[2]]];quad(out.main,'steel',q[0],q[1],q[2],q[3],[dir,0,0]);quad(out.main,'steel',q[3],q[2],q[1],q[0],[-dir,0,0]);}};
 wall(x0,-1,false);wall(x1,1,true);
 {const b=new B(),door=base+HANGAR.doorH,dw=HANGAR.door;b.box('gold',x1+.05,door,hz,.22,.22,dw*2+.5);for(const s of[-1,1])b.box('gold',x1+.05,(door+base)/2,hz+s*(dw+.05),.22,door-base,.22);
  // one sliding door left half-open, the other fallen on the ground
  b.box('steel',x1+.45,(door+base)/2,hz+dw+.9,.12,door-base-.1,2.8);for(let k=0;k<3;k++)b.box('rust',x1+.53,base+.9+k*1.1,hz+dw+.9,.04,.5,2.6);b.box('amber',x1+.1,door+.45,hz,.6,.12,.06);
  const fy=r.terrain(x1+2.2,hz-4.6,ch);b.box('steel',x1+2.0,fy+.08,hz-4.8,3.4,.12,2.6,.18);bake(out.main,b,0,0,0);}
 // hanging amber lamps with warm pools, a workbench, crates and cable reels inside
 {const b=new B();for(const x of[x0+3.5,x0+7.5,x0+11.5]){const y=base+hr*.92-.62;b.tube('dark',[x,y+.1,hz],[x,base+hr*.92-.05,hz],.02,4);b.tube('dark',[x,y,hz],[x,y+.12,hz],.2,12,.08);b.tube('amber',[x,y-.02,hz],[x,y,hz],.16,12);out.lamps.push([x,y-.1,hz]);}bake(out.main,b,0,0,0);}
 {const b=new B(),bx=x0+2.2,bz=hz-3.0,by=r.terrain(bx,bz,ch);b.box('steel',0,.9,0,2.6,.1,.9);for(const[dx,dz]of[[-1.2,-.4],[1.2,-.4],[-1.2,.4],[1.2,.4]])b.box('dark',dx,.45,dz,.08,.9,.08);b.box('ivory',-.6,1.1,0,.6,.3,.4);b.box('gold',.5,1.0,.1,.3,.12,.3);bake(out.detail,b,bx,by,bz,0);
  for(const[x,z,w,yaw,m]of[[x0+1.4,hz+3.0,1.1,.2,'ivory'],[x0+2.6,hz+3.4,.8,.7,'steel'],[x1-1.4,hz-3.3,.9,.4,'ivory'],[x0+5.5,hz-3.6,.7,1.2,'gold']]){const c=new B(),y=r.terrain(x,z,ch);c.box(m,0,w*.45,0,w,w*.9,w*.8);c.box('dark',0,w*.92,0,w*.7,.06,w*.5);bake(out.detail,c,x,y-.05,z,yaw);}}
 // nose cone on a cradle (until taken)
 {const[nx,nz]=Core.POINTS.nose,ny=r.terrain(nx,nz,ch),b=new B();b.box('steel',0,.2,0,1.5,.4,1.5);b.box('gold',0,.43,0,1.2,.06,1.2);b.shell('ivory',[[1,0],[.97,.18],[.86,.4],[.66,.6],[.4,.8],[.12,.95],[0,1]],.82,2.5);b.tube('gold',[0,.55,0],[0,.68,0],.85,32);b.tube('gold',[0,2.5,0],[0,3.0,0],.13,10,.01);bake(out.nose,b,nx,ny+.33,nz,0);}
 // fins on a rack (until taken)
 {const[fx,fz]=Core.POINTS.fins,fy=r.terrain(fx,fz,ch),b=new B();b.box('steel',0,.12,0,2.6,.24,1.0);for(const s of[-1,1])b.box('dark',s*1.2,.9,0,.08,1.6,.08);b.box('dark',0,1.7,0,2.5,.08,.08);
  for(let i=0;i<4;i++){const ox=-.9+i*.6,pts=[[0,1.9],[0,.3],[.9,.25],[.95,.8]],Q=(p,o)=>[ox+o,.24+p[1],p[0]-.45];b.quad('ivory',...pts.map(p=>Q(p,.04)));b.quad('ivory',...pts.map(p=>Q(p,-.04)).reverse());b.tube('gold',Q([0,1.9],0),Q([.95,.8],0),.05,5);}
  bake(out.fins,b,fx,fy,fz,.15);}
 return out;}
// ---------- mesh registration ----------
function addGroups(r,prefix,map,list){for(const[mat,data]of map){if(!data.length)continue;const key=prefix+'_'+mat;r.addMesh(key,data);list.push([key,mat]);}}
R.v43Build=function(){if(this.v43)return this.v43;this.ensureWorldModels();const ch=4,w={pad:buildPad(this,ch),wreck:buildWreck(this,ch),cave:buildCave(this,ch),hangar:buildHangar(this,ch)},L={};
 const add=(name,map)=>{L[name]=[];addGroups(this,'v43_'+name,map,L[name]);};
 add('pad',w.pad.main);add('padDetail',w.pad.detail);add('padCap',w.pad.cap);for(let i=0;i<3;i++){add('stage'+(i+1),w.pad.stages[i]);add('holo'+(i+1),w.pad.holo[i]);}
 add('wreck',w.wreck.main);add('wreckDetail',w.wreck.detail);add('engine',w.wreck.engine);
 add('cave',w.cave.main);add('caveDetail',w.cave.detail);add('heart',new Map([['crystal',w.cave.heart.a],['core',w.cave.heart.core]]));w.cave.shards.forEach((s,i)=>add('shard'+(i+1),new Map([['crystal',s.a],['core',s.c]])));
 add('hangar',w.hangar.main);add('hangarDetail',w.hangar.detail);add('nose',w.hangar.nose);add('fins',w.hangar.fins);
 return this.v43={w,L,pools:{buf:null,key:''}};};
function stageOf(state){return Core.rocketStage?Core.rocketStage(state):0;}
const SITE_R={pad:[PAD,22],wreck:[[-25,56],20],cave:[CAVE,18],hangar:[[-58,26],16]};
R.ensureWorldModels=function(){old.ensure.call(this);};
R.scene=function(state,p,t,...args){const out=old.scene.call(this,state,p,t,...args);if(!state||state.chapter!==4)return out;const v=this.v43Build(),low=this.quality==='low',L=v.L,eye=this.eye||[0,0,0];
 const far=(k)=>{const[c,rad]=SITE_R[k];return Math.hypot(eye[0]-c[0],eye[2]-c[1])>150+rad;};
 const draw=(name,glowMul=1)=>{for(const[key,mat]of L[name]||[]){const[kind,col]=MATS[mat]||[0,[.5,.5,.5]];const g=mat==='amber'?.5:mat==='blue'?.75+.2*Math.sin(t*2.2):mat==='holo'?(.35+.25*Math.max(0,Math.sin(t*3.1)))*glowMul:mat==='core'?.85+.15*Math.sin(t*1.7):mat==='crystal'?.24+.06*Math.sin(t*1.7):0;this.put(key,0,0,0,1,1,1,col,0,kind,g);}};
 const st=stageOf(state);
 if(!far('pad')){draw('pad');if(!low)draw('padDetail');for(let i=1;i<=3;i++){if(st>=i)draw('stage'+i);else draw('holo'+i,i===st+1?1.4:.7);}if(st===1)draw('padCap');}
 if(!far('wreck')){draw('wreck');if(!low)draw('wreckDetail');if(!state.engineFound)draw('engine');}
 if(!far('cave')){draw('cave');if(!low)draw('caveDetail');draw('heart');(state.coreShards||[]).length;for(let i=1;i<=3;i++)if(!(state.coreShards||[]).includes('shard'+i))draw('shard'+i);}
 if(!far('hangar')){draw('hangar');if(!low)draw('hangarDetail');const parts=state.rocketParts||[];if(!parts.includes('nose'))draw('nose');if(!parts.includes('fins'))draw('fins');}
 // crew on site (sprites, cheap): engineer at the pad, scout at the wreck, geologist at the cave mouth, navigator at the hangar door
 const crew=[[23.2,4.2,-Math.PI/2,[.78,.35,.12]],[-21.2,49.6,Math.PI*.8,[.21,.64,.68]],[61.6,7.4,Math.PI/2,[.35,.8,.45]],[-49.0,24.9,-Math.PI/2,[.30,.50,.95]]];
 for(const[x,z,yaw,col]of crew)if(Math.hypot(eye[0]-x,eye[2]-z)<70)this.cat(x,z,yaw,t,0,0,4,col);
 return out;};
// ---------- collisions ----------
function segDist(px,pz,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,l=dx*dx+dz*dz,t=Math.max(0,Math.min(1,((px-ax)*dx+(pz-az)*dz)/l));return Math.hypot(px-(ax+dx*t),pz-(az+dz*t));}
function inside4(x,z,state){
 if(Math.hypot(x-PAD[0],z-PAD[1])<PLINTH+.35)return true;
 if(segDist(x,z,WRECK.a[0],WRECK.a[1],WRECK.b[0],WRECK.b[1])<WRECK.r+.35)return true;
 if(!state.engineFound&&Math.hypot(x-ENGINE[0],z-ENGINE[1])<1.45)return true;
 for(const[rx,rz,rr]of CAVE_ROCKS)if(Math.hypot(x-rx,z-rz)<rr)return true;
 if(Math.hypot(x-HEART[0],z-HEART[1])<1.3)return true;
 const{x0,x1,z:hz}=HANGAR,dz=Math.abs(z-hz);
 const hr=HANGAR.r,dw=HANGAR.door;if(x>x0-.6&&x<x1+.15&&dz>hr-.75&&dz<hr+.6)return true;
 if(x>x0-.7&&x<x0+.35&&dz<hr+.6)return true;
 if(x>x1-.4&&x<x1+.6&&dz>dw-.1&&dz<hr+.6)return true;
 if(x>x1+.2&&x<x1+.8&&z>hz+dw-.2&&z<hz+dw+2.4)return true;
 const parts=state.rocketParts||[];const n=Core.POINTS.nose,f=Core.POINTS.fins;
 if(!parts.includes('nose')&&Math.hypot(x-n[0],z-n[1])<1.05)return true;
 if(!parts.includes('fins')&&Math.abs(x-f[0])<1.45&&Math.abs(z-f[1])<.75)return true;
 return false;}
R.blocked=function(x,z,state,alt=0){if(state&&state.chapter===4&&alt<2.2){if(!this.v43&&this.gl)this.v43Build();if(inside4(x,z,state))return true;}return old.blocked.call(this,x,z,state,alt);};
// the hangar is a closed arched shell: keep the follow camera on the cat's side of its walls (inside stays inside, outside stays outside)
let hangarBase=null;function hangarCam(r,x,z,y){const{x0,x1,z:hz,r:hr,door,doorH}=HANGAR;if(x<x0-.6||x>x1+.6||Math.abs(z-hz)>hr+.6)return false;
 if(hangarBase===null){let lo=1e9;for(let xx=x0;xx<=x1;xx+=1)for(const dz of[-hr,-hr/2,0,hr/2,hr])lo=Math.min(lo,r.terrain(xx,hz+dz,4));hangarBase=lo-.25;}
 const dz=z-hz,dy=y-hangarBase,e=Math.sqrt((dz/hr)**2+(Math.max(0,dy)/(hr*.92))**2);if(e>1.1)return false;
 if(x>=x0-.45&&x<=x1+.45&&e>.9)return true;
 if(Math.abs(x-x0)<.45)return true;
 if(Math.abs(x-x1)<.45&&!(Math.abs(dz)<door-.25&&dy<doorH-.3))return true;
 return false;}
if(old.camera)R.cameraBlocked=function(x,z,state,alt=0){if(state&&state.chapter===4){if(alt<1.6&&inside4(x,z,state))return true;if(hangarCam(this,x,z,this.terrain(x,z,4)+alt))return true;}return old.camera.call(this,x,z,state,alt);};
// ---------- light pools and halos ----------
function poolData(r,state,v){const out=[],ch=4,disc=(x,z,rad,col,k,ph)=>{const N=4,y0=(a,b)=>r.terrain(a,b,ch)+.035;for(let j=0;j<N;j++)for(let i=0;i<N;i++){const q=[[i,j],[i+1,j],[i+1,j+1],[i,j+1]].map(([a,b])=>{const u=a/N*2-1,w=b/N*2-1,px=x+u*rad,pz=z+w*rad;return[px,y0(px,pz),pz,u,w,ph,k];});for(const t of[0,1,2,0,2,3])out.push(...q[t],...col);}};
 const W=v.w,amber=[1.0,.58,.22],blue=[.16,.42,1.0],st=stageOf(state);
 for(let i=0;i<8;i++){const a=i/8*TAU+.2;disc(PAD[0]+Math.cos(a)*(PLINTH+.9),PAD[1]+Math.sin(a)*(PLINTH+.9),1.3,amber,.42,i);}
 if(st>=2)disc(PAD[0]-2.6,PAD[1],2.6,blue,.35,1);
 for(const l of W.wreck.lamps)disc(l[0],l[2],1.6,amber,.4,l[0]);
 if(state.engineFound||true)for(const[a,b]of[W.wreck.cable])for(let d=0;d<=1;d+=.25)disc(a[0]+(b[0]-a[0])*d,a[1]+(b[1]-a[1])*d,.5,amber,state.engineFound?.6:.22,d*7);
 for(const[x,y,z,s]of W.cave.crystals)disc(x,z,1.6+s,blue,.5,x);
 W.cave.shards.forEach((s,i)=>{if(!(state.coreShards||[]).includes('shard'+(i+1)))disc(s.pos[0],s.pos[2],2.2,blue,.55,i);});
 disc(HEART[0]-.6,HEART[1],3.6,blue,.6,3);for(const l of W.cave.lamps||[])disc(l[0],l[2],1.6,amber,.45,l[0]);
 for(const l of W.hangar.lamps)disc(l[0],l[2],1.5,amber,.32,l[0]);
 return new Float32Array(out);}
R.render=function(state,p,t,dt,yaw,pitch,scan){old.render.call(this,state,p,t,dt,yaw,pitch,scan);if(!state||state.chapter!==4||!this.v43||!this.vp||!this.initHorizons)return;
 const hv=this.initHorizons();if(!hv||!hv.ok)return;const gl=this.gl,v=this.v43,low=this.quality==='low',W=v.w,st=stageOf(state),eye=this.eye||[0,0,0];
 const key=st+':'+(state.coreShards||[]).length+':'+(state.engineFound?1:0)+':'+this.quality;if(!v.pools.buf)v.pools.buf=gl.createBuffer();if(key!==v.pools.key){v.pools.key=key;v.pools.data=poolData(this,state,v);gl.bindBuffer(gl.ARRAY_BUFFER,v.pools.buf);gl.bufferData(gl.ARRAY_BUFFER,v.pools.data,gl.STATIC_DRAW);}
 gl.useProgram(hv.p);gl.uniformMatrix4fv(hv.vp,false,this.vp);gl.uniform1f(hv.time,t);gl.bindBuffer(gl.ARRAY_BUFFER,v.pools.buf);gl.enable(gl.DEPTH_TEST);gl.depthMask(false);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(-2,-8);
 gl.enableVertexAttribArray(hv.pos);gl.vertexAttribPointer(hv.pos,3,gl.FLOAT,false,40,0);gl.enableVertexAttribArray(hv.info);gl.vertexAttribPointer(hv.info,4,gl.FLOAT,false,40,12);gl.enableVertexAttribArray(hv.tint);gl.vertexAttribPointer(hv.tint,3,gl.FLOAT,false,40,28);gl.drawArrays(gl.TRIANGLES,0,v.pools.data.length/10);gl.disableVertexAttribArray(hv.pos);gl.disableVertexAttribArray(hv.info);gl.disableVertexAttribArray(hv.tint);gl.disable(gl.POLYGON_OFFSET_FILL);
 const a=this.atmo;if(a&&a.ok){const Bq=[],quad=(x,y,z,size,r,g,b,w)=>{if(Math.hypot(x-eye[0],z-eye[2])>90)return;for(const[u,q]of[[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]])Bq.push(x,y,z,u,q,size,0,r,g,b,w);},pulse=.85+.15*Math.sin(t*2.1),top=W.pad.top;
  const[px,pz]=PAD;
  if(!low)for(let i=0;i<16;i+=2){const an=i/16*TAU;quad(px+Math.cos(an)*(PLINTH-.22),top+.12,pz+Math.sin(an)*(PLINTH-.22),.55,1.0,.62,.25,-.5);}
  for(const side of[-1,1])for(const k of[3,6,9]){const y=top+k*1.56-.14;quad(px+.25-1.1,y,pz+side*3.45-side*1.05,.7,1.0,.62,.25,-.55);if(!low)quad(px+.25+1.1,y,pz+side*3.45-side*1.05,.6,1.0,.62,.25,-.5);}
  if(st>=2){quad(px-RB-.2,top+4.9,pz,3.4,.2,.5,1.0,-.55*pulse);quad(px-RB-.25,top+4.9,pz,1.2,.6,.9,1.0,-.8*pulse);}
  if(st<3){const hb=.4+.3*Math.max(0,Math.sin(t*3.1));quad(px,top+(st===0?2:st===1?6:11),pz,4.0,.2,.55,1.0,-.22*hb);}
  if(st===3){const tb=.5+.5*Math.max(0,Math.sin(t*1.4));quad(px,top+14.35,pz,.9,1.0,.7,.3,-.8*tb);}
  W.wreck.lamps.forEach((l,i)=>{const bl=.45+.55*Math.max(0,Math.sin(t*2.6+i*1.9));quad(l[0],l[1]+.05,l[2],1.4,1.0,.6,.25,-.6*bl);quad(l[0],l[1]+.05,l[2],.4,1.0,.85,.6,-.9*bl);});
  if(!state.engineFound){const[ex,ez]=ENGINE;quad(ex+Math.cos(.3)*.7,this.terrain(ex,ez,4)+2.0,ez-Math.sin(.3)*.7,.5,1.0,.62,.25,-.7*pulse);}
  if(state.engineFound&&!low){const[a0,a1]=W.wreck.cable;for(let d=.1;d<1;d+=.2){const x=a0[0]+(a1[0]-a0[0])*d,z=a0[1]+(a1[1]-a0[1])*d;quad(x,this.terrain(x,z,4)+.12,z,.32,1.0,.62,.25,-.6*pulse);}}
  if(!low)for(const[x,y,z,s]of W.cave.crystals)quad(x,y,z,2.2+s,.18,.45,1.0,-.35*pulse);
  W.cave.shards.forEach((s,i)=>{if((state.coreShards||[]).includes('shard'+(i+1)))return;const sp=.7+.3*Math.sin(t*3+i);quad(s.pos[0],s.pos[1],s.pos[2],3.0,.22,.55,1.0,-.5*sp);quad(s.pos[0],s.pos[1]+.3,s.pos[2],.8,.7,.92,1.0,-.85*sp);});
  {const hp=W.cave.heartPos;quad(hp[0],hp[1],hp[2],6.0,.2,.5,1.0,-.42*pulse);quad(hp[0],hp[1]+.4,hp[2],1.6,.6,.9,1.0,-.8*pulse);}
  for(const l of W.cave.lamps||[])quad(l[0],l[1],l[2],.9,1.0,.62,.25,-.6);
  for(const l of W.hangar.lamps){quad(l[0],l[1],l[2],1.1,1.0,.6,.25,-.35);quad(l[0],l[1],l[2],.3,1.0,.85,.6,-.6);}
  if(Bq.length){const data=new Float32Array(Bq);gl.useProgram(a.bp);gl.uniformMatrix4fv(a.bpVP,false,this.vp);gl.uniform3fv(a.bpRight,[Math.cos(yaw),0,-Math.sin(yaw)]);gl.bindBuffer(gl.ARRAY_BUFFER,hv.bill);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
   gl.enableVertexAttribArray(a.bpPos);gl.vertexAttribPointer(a.bpPos,3,gl.FLOAT,false,44,0);gl.enableVertexAttribArray(a.bpCorner);gl.vertexAttribPointer(a.bpCorner,4,gl.FLOAT,false,44,12);gl.enableVertexAttribArray(a.bpTone);gl.vertexAttribPointer(a.bpTone,4,gl.FLOAT,false,44,28);gl.drawArrays(gl.TRIANGLES,0,data.length/11);gl.disableVertexAttribArray(a.bpPos);gl.disableVertexAttribArray(a.bpCorner);gl.disableVertexAttribArray(a.bpTone);}}
 gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(true);gl.disable(gl.BLEND);};
root.MoonRocketWorld={PAD,PLINTH,WRECK,ENGINE,CAVE,HEART,HANGAR,inside:inside4,caveRocks:CAVE_ROCKS};
})(globalThis);
