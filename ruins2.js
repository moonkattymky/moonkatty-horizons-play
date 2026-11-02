/* v100 explorable ruins, second pass: modelled in the centre's language (ivory ceramic panels, gold bands and trims,
   steel frames, amber lamps, the MOONKATTY paw) instead of plain boxes.
   - crashed rocket: our rocket laid on its side, half buried, the mid hull torn open with scorched edges, debris and
     sparks; a dim interior (inner wall shell, ribs, deck, crates, console, lamps) and a glowing crystal find
   - old station, broken hangar, fallen dome: panels, gold trims, windows, antennas, broken beams, rubble, dust
   Interiors are darkened per vertex: ruin materials use kind+100, and the vertex normal length carries the light
   factor (shader multiplies the lit colour by it), so sunlight does not paint the inside of a closed hull.
   layout(R) is cheap (finds + colliders, used at load and for collisions); build(R) is a generator (split across frames). */
(function(root){'use strict';
const Core=root.MoonCore;if(!Core)return;
const TAU=Math.PI*2,norm=v=>{const l=Math.hypot(v[0],v[1],v[2])||1;return[v[0]/l,v[1]/l,v[2]/l];},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
function rng(seed){let s=(seed>>>0)||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
// materials: [kind, colour, glow]; kinds >=100 are ruin variants of the centre kinds (interior light in the normal length)
const MAT={zivory:[117,[.97,.96,.93],0],zgold:[116,[.92,.63,.25],0],zrgold:[116,[1.0,.76,.32],.12],zsteel:[117,[.66,.68,.72],0],zframe:[100,[.23,.28,.31],0],
 zdark:[100,[.045,.065,.085],0],zglass:[105,[.10,.16,.22],0],zscorch:[100,[.075,.058,.048],0],zsoot:[100,[.05,.042,.036],0],zwall:[119,[.60,.61,.64],0],
 zcrate:[117,[.80,.77,.70],0],zdust:[100,[.50,.45,.40],0],zsolar:[115,[.2,.3,.4],0],zfin:[12,[.95,.60,.22],.42],zamber:[12,[1.0,.57,.14],.55],
 zport:[12,[1.0,.62,.20],.5],zcore:[12,[.35,.80,1.0],.8],zscreen:[12,[.25,.75,1.0],.35]};
// ---------- local geometry ----------
const grp=(G,m)=>G[m]||(G[m]=[]);
function tri(G,m,a,b,c,n){n=n||norm(cross(sub(b,a),sub(c,a)));grp(G,m).push(...a,...n,...b,...n,...c,...n);}
function quad(G,m,a,b,c,d,n,two){tri(G,m,a,b,c,n);tri(G,m,a,c,d,n);if(two){const r=n?n.map(q=>-q):null;tri(G,m,a,c,b,r);tri(G,m,a,d,c,r);}}
function rot(v,yaw,pitch,roll){const cr=Math.cos(roll),sr=Math.sin(roll),cp=Math.cos(pitch),sp=Math.sin(pitch),cy=Math.cos(yaw),sy=Math.sin(yaw);
 const x1=v[0]*cr-v[1]*sr,y1=v[0]*sr+v[1]*cr,y2=y1*cp-v[2]*sp,z2=y1*sp+v[2]*cp;return[x1*cy+z2*sy,y2,-x1*sy+z2*cy];}
// closed box (outward faces) with full rotation
function box(G,m,cx,cy,cz,hx,hy,hz,yaw=0,pitch=0,roll=0){const F=[[[1,0,0],[0,1,0],[0,0,1]],[[-1,0,0],[0,0,1],[0,1,0]],[[0,1,0],[0,0,1],[1,0,0]],[[0,-1,0],[1,0,0],[0,0,1]],[[0,0,1],[1,0,0],[0,1,0]],[[0,0,-1],[0,1,0],[1,0,0]]],H=[hx,hy,hz];
 for(const[n,u,v]of F){const c=n.map((k,i)=>k*H[i]),U=u.map((k,i)=>k*H[i]),V=v.map((k,i)=>k*H[i]);const q=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>{const p=rot([c[0]+U[0]*a+V[0]*b,c[1]+U[1]*a+V[1]*b,c[2]+U[2]*a+V[2]*b],yaw,pitch,roll);return[cx+p[0],cy+p[1],cz+p[2]];});const nn=rot(n,yaw,pitch,roll);
  tri(G,m,q[0],q[1],q[2],nn);tri(G,m,q[0],q[2],q[3],nn);}}
// cylinder/tube between two points (sides, optional caps)
function tube(G,m,a,b,r,n=8,r2=r,caps=true){const d=sub(b,a),L=Math.hypot(...d)||1,ax=d.map(q=>q/L),u=norm(cross(ax,Math.abs(ax[1])>.9?[1,0,0]:[0,1,0])),v=cross(ax,u);
 const P=(o,t,rr)=>o.map((q,i)=>q+(u[i]*Math.cos(t)+v[i]*Math.sin(t))*rr),N=t=>norm(u.map((q,i)=>q*Math.cos(t)+v[i]*Math.sin(t)+ax[i]*(r-r2)/L));
 for(let i=0;i<n;i++){const t0=i/n*TAU,t1=(i+1)/n*TAU,g=grp(G,m),A=P(a,t0,r),B2=P(a,t1,r),C=P(b,t1,r2),D=P(b,t0,r2),n0=N(t0),n1=N(t1);g.push(...A,...n0,...B2,...n1,...C,...n1,...A,...n0,...C,...n1,...D,...n0);
  if(caps){tri(G,m,a,B2,A,ax.map(q=>-q));if(r2>.001)tri(G,m,b,D,C,ax);}}}
function lump(G,m,x,y,z,sx,sy,sz,seed,nu=7,nv=4){const q=rng(seed),P=[];for(let j=0;j<=nv;j++){P.push([]);for(let i=0;i<=nu;i++){const th=j/nv*Math.PI*.5,ph=i/nu*TAU,k=i<nu&&j<nv?.8+q()*.35:1;P[j].push([x+Math.cos(th)*Math.cos(ph)*sx*k,y+Math.sin(th)*sy*k,z+Math.cos(th)*Math.sin(ph)*sz*k]);}P[j][nu]=P[j][0];}
 for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=P[j][i],b=P[j][i+1],c=P[j+1][i+1],d=P[j+1][i];tri(G,m,a,c,b);tri(G,m,a,d,c);}}
function paw(G,m,x,y,z,s,yaw){const at=(dx,dy)=>{const p=rot([dx*s,dy*s,0],yaw,0,0);return[x+p[0],y+p[1],z+p[2]];},o=rot([0,0,1],yaw,0,0);
 const disc=(c,r)=>{for(let i=0;i<14;i++){const a=i/14*TAU,b=(i+1)/14*TAU,p=t=>{const w=rot([Math.cos(t)*r,Math.sin(t)*r,0],yaw,0,0);return[c[0]+w[0]+o[0]*.02,c[1]+w[1],c[2]+w[2]+o[2]*.02];};tri(G,m,[c[0]+o[0]*.02,c[1],c[2]+o[2]*.02],p(a),p(b),o);}};
 disc(at(0,-.06),s*.19);for(const[dx,dy]of[[-.22,.15],[-.075,.27],[.075,.27],[.22,.15]])disc(at(dx,dy),s*.088);}
// ---------- the four ruins ----------
const S=2.3,RB=1.15,RR=RB*S,RHO=-1.0,YC=7.0,AX=.45*RR,TILT=.07,HC=.2;
const holeW=(y,a)=>{const s=Math.sin(Math.PI*(y-2.9)/4.4);return s<=0?-1:1.12*Math.pow(s,.5)+.11*Math.sin(a*9+y*5)+.07*Math.sin(y*13.7+a*3);};
const wrap=a=>{a=(a+Math.PI)%TAU;if(a<0)a+=TAU;return a-Math.PI;};
const rocketHole=(y,phi)=>{const a=wrap(phi-RHO),w=holeW(y,a);return w<0?99:Math.abs(wrap(a-HC))-w;};   // <0 open, 0..0.2 scorched edge
const rk=p=>{const X=(YC-p[1])*S,u=p[0]*S,v=p[2]*S,cr=Math.cos(RHO),sr=Math.sin(RHO);return[X,AX+u*cr-v*sr-X*TILT,u*sr+v*cr];};
const rkN=n=>{const cr=Math.cos(RHO),sr=Math.sin(RHO);return[-n[1],n[0]*cr-n[2]*sr,n[0]*sr+n[2]*cr];};
const rocketAxisY=X=>AX-X*TILT;
function layout(R){const L=LAYOUT.get(R.id);if(L)return L;const col=[],seg=(ax,az,bx,bz,r=.45)=>col.push([ax,az,bx,bz,r]);let find=[0,0],ceil=null,walls=4;
 if(R.id==='rocketWreck'){const zw=Math.sqrt(RR*RR-AX*AX)-.15;seg(-15,-zw,16,-zw);seg(-15,-zw,-15,zw,.6);seg(16,-zw,16,zw,.6);
  let run=null;for(let X=-15;X<=16.01;X+=.5){const y=YC-X/S;let open=true;for(let a=-.45;a<=.16;a+=.1)if(rocketHole(y,a+RHO)>=0)open=false;if(!open){if(run===null)run=X;}else if(run!==null){seg(run,zw,X-.25,zw);run=null;}}if(run!==null)seg(run,zw,16,zw);
  seg(10.5,zw,13.5,5.4,.5);seg(10.5,-zw,13.0,-5.2,.5);find=[5.2,-.9];walls=4.4;
  ceil=(x,z)=>Math.abs(z)<zw&&x>-15&&x<16?rocketAxisY(x)+Math.sqrt(Math.max(0,RR*RR-z*z))-.4:null;}
 if(R.id==='oldStation'){const hx=6.5,hz=4.5;seg(-hx,-hz,hx,-hz);seg(-hx,-hz,-hx,hz);seg(hx,-hz,hx,hz);seg(-hx,hz,-1.3,hz);seg(1.3,hz,hx,hz);seg(2.2,-1.2,5.6,-3.6,.6);find=[-4.2,-2.2];walls=3.4;
  ceil=(x,z)=>Math.abs(x)<hx&&Math.abs(z)<hz?3.2:null;}
 if(R.id==='brokenHangar'){const r=6,zl=8;seg(-r+.2,-zl,-r+.2,zl,.55);seg(r-.2,-zl,r-.2,zl,.55);seg(-r,-zl,r,-zl,.5);seg(-3.2,-5.6,-1.2,-3.2,.5);find=[2.8,-5.2];walls=5.5;
  ceil=(x,z)=>Math.abs(z)<zl&&Math.abs(x)<r?Math.sqrt(Math.max(0,r*r-x*x))*.92-.4:null;}
 if(R.id==='fallenDome'){const r=6.6,nu=24;for(let i=0;i<nu;i++){const p0=i/nu*TAU,p1=(i+1)/nu*TAU;if(Math.cos((p0+p1)/2)>.93)continue;seg(Math.sin(p0)*r,Math.cos(p0)*r,Math.sin(p1)*r,Math.cos(p1)*r,.5);}
  seg(-1.4,r-.6,-1.4,r+2.6,.4);seg(1.4,r-.6,1.4,r+2.6,.4);find=[-2.2,-2.4];walls=5;ceil=(x,z)=>x*x+z*z<r*r?Math.sqrt(Math.max(0,r*r-x*x-z*z))*.82-.4:null;}
 const c=Math.cos(R.yaw),s=Math.sin(R.yaw),W=(lx,lz)=>[R.x+c*lx+s*lz,R.z-s*lx+c*lz];
 const out={col:col.map(([a,b,d,e,r])=>{const p=W(a,b),q=W(d,e);return[p[0],p[1],q[0],q[1],r];}),find:W(find[0],find[1]),walls,
  local:(x,z)=>{const dx=x-R.x,dz=z-R.z;return[c*dx-s*dz,s*dx+c*dz];},ceil};
 LAYOUT.set(R.id,out);return out;}
const LAYOUT=new Map();
function segHit(x,z,c){const dx=c[2]-c[0],dz=c[3]-c[1],L=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((x-c[0])*dx+(z-c[1])*dz)/L)),px=c[0]+dx*t-x,pz=c[1]+dz*t-z;return px*px+pz*pz<c[4]*c[4];}
function near(x,z,pad){for(const R of Core.RUINS||[])if(Math.abs(x-R.x)<R.r+pad&&Math.abs(z-R.z)<R.r+pad)return R;return null;}
function blocked(x,z){const R=near(x,z,4);if(!R)return false;for(const c of layout(R).col)if(segHit(x,z,c))return true;return false;}
// camera: walls up to their height, and the roof/hull when the camera would leave the interior through it
function cameraBlocked(x,z,alt){const R=near(x,z,4);if(!R)return false;const L=layout(R);if(alt<L.walls)for(const c of L.col)if(segHit(x,z,{0:c[0],1:c[1],2:c[2],3:c[3],4:c[4]*.8}))return true;
 const[lx,lz]=L.local(x,z),cl=L.ceil(lx,lz);return cl!==null&&alt>cl&&alt<cl+3.5;}
// ---------- builders (ruin-local, y=0 on the flattened ground; generators so the work spreads over frames) ----------
function* buildRocket(G,F){const q=rng(4711),segs=40;
 // hull: base flare, long cylinder (fine rows so the tear can be cut), nose cone
 const prof=[[.58,1.30],[.92,1.40],[1,1.52]];for(let y=1.8;y<8.4;y+=.3)prof.push([1,y]);prof.push([1,8.4]);for(const[r,t]of[[1,.16],[.97,.3],[.89,.46],[.75,.62],[.55,.76],[.32,.88],[.12,.96],[0,1]])prof.push([r,8.4+5.4*t]);
 const nrm=(j,t)=>{const lo=prof[Math.max(0,j-1)],hi=prof[Math.min(prof.length-1,j+1)],dy=hi[1]-lo[1],dr=(lo[0]-hi[0])*RB;return norm([Math.sin(t)*dy,dr,Math.cos(t)*dy]);};
 const P=(r,y,t)=>[Math.sin(t)*r*RB,y,Math.cos(t)*r*RB];
 for(let j=0;j<prof.length-1;j++){const[r0,y0]=prof[j],[r1,y1]=prof[j+1];for(let i=0;i<segs;i++){const t0=i/segs*TAU,t1=(i+1)/segs*TAU,tm=(t0+t1)/2,ym=(y0+y1)/2,h=rocketHole(ym,tm);if(h<0)continue;
   const noise=Math.sin(tm*7+ym*3.1)*Math.sin(ym*5.3+tm*2)+Math.sin(tm*13-ym*1.7)*.4;const burnt=h<.2||(ym>11.2&&noise>.55)||(ym<2.4&&noise>.35)||(Math.abs(ym-8.9)<.25&&noise>-.2);
   const m=burnt?'zscorch':((i+j*3)%17===0?'zsteel':'zivory');const a=P(r0,y0,t0),b=P(r0,y0,t1),c=P(r1,y1,t1),d=P(r1,y1,t0);
   const na=nrm(j,t0),nb=nrm(j,t1),g=grp(F,m);for(const[v,n]of[[a,na],[c,nrm(j+1,t1)],[b,nb],[a,na],[d,nrm(j+1,t0)],[c,nrm(j+1,t1)]])g.push(...v,...n);
   if(y0>=1.5&&y1<=13.3){const k=.955,w=grp(F,'zwall');const A=[a[0]*k,a[1],a[2]*k],B=[b[0]*k,b[1],b[2]*k],C=[c[0]*k,c[1],c[2]*k],D=[d[0]*k,d[1],d[2]*k],n0=na.map(v=>-v),n1=nb.map(v=>-v);
    for(const[v,n]of[[A,n0],[B,n1],[C,n1],[A,n0],[C,n1],[D,n0]])w.push(...v,...n);
}}yield;}
 yield;
 // gold bands, seams, the paw emblem, portholes, engine, fins (cut by the tear like the hull)
 const band=(y0,y1,r,m)=>{for(let i=0;i<48;i++){const t0=i/48*TAU,t1=(i+1)/48*TAU;if(rocketHole((y0+y1)/2,(t0+t1)/2)<.05)continue;const a=P(r/RB,y0,t0),b=P(r/RB,y0,t1),c=P(r/RB,y1,t1),d=P(r/RB,y1,t0),n=[Math.sin((t0+t1)/2),0,Math.cos((t0+t1)/2)];quad(F,m,a,b,c,d,n);
  const lo=[Math.sin(t0)*(r-.05),y0,Math.cos(t0)*(r-.05)],lo2=[Math.sin(t1)*(r-.05),y0,Math.cos(t1)*(r-.05)];quad(F,m,lo,lo2,b,a,[0,-1,0]);const hi=[Math.sin(t0)*(r-.05),y1,Math.cos(t0)*(r-.05)],hi2=[Math.sin(t1)*(r-.05),y1,Math.cos(t1)*(r-.05)];quad(F,m,d,c,hi2,hi,[0,1,0]);}};
 band(1.95,2.06,RB+.025,'zgold');band(2.36,2.42,RB+.02,'zgold');band(3.58,3.76,RB+.03,'zgold');band(4.9,4.98,RB+.02,'zrgold');band(7.2,7.28,RB+.02,'zrgold');band(8.24,8.4,RB+.03,'zgold');band(8.42,8.58,RB+.03,'zgold');band(9.25,9.33,RB*.99+.02,'zgold');
 for(let i=0;i<6;i++){const a=i/6*TAU+.2;for(let y=3.7;y<8.3;y+=.5){if(rocketHole(y+.25,a)<.1)continue;box(F,'zframe',Math.sin(a)*(RB+.012),y+.25,Math.cos(a)*(RB+.012),.03,.25,.03,a);}}
 paw(F,'zrgold',0,7.66,RB+.03,.95,0);for(let i=0;i<20;i++){const a=i/20*TAU,b=(i+1)/20*TAU,R1=.62,R2=.5,p=(t,r)=>[Math.sin(t)*r,7.75+Math.cos(t)*r,RB+.025];quad(F,'zrgold',p(a,R2),p(a,R1),p(b,R1),p(b,R2),[0,0,1]);}
 for(const[yy,rr,zz]of[[10.1,.26,RB*.96],[11.0,.2,RB*.86]]){for(let i=0;i<14;i++){const a=i/14*TAU,b=(i+1)/14*TAU;tri(F,'zport',[0,yy,zz+.05],[Math.sin(b)*rr*.82,yy+Math.cos(b)*rr*.82,zz+.04],[Math.sin(a)*rr*.82,yy+Math.cos(a)*rr*.82,zz+.04],[0,0,1]);quad(F,'zrgold',[Math.sin(a)*rr*.82,yy+Math.cos(a)*rr*.82,zz+.045],[Math.sin(b)*rr*.82,yy+Math.cos(b)*rr*.82,zz+.045],[Math.sin(b)*rr*1.1,yy+Math.cos(b)*rr*1.1,zz+.02],[Math.sin(a)*rr*1.1,yy+Math.cos(a)*rr*1.1,zz+.02],[0,0,1]);}}
 tube(F,'zdark',[0,.36,0],[0,1.38,0],.98,20,.5);tube(F,'zgold',[0,.30,0],[0,.42,0],1.02,24);tube(F,'zscorch',[0,.12,0],[0,.36,0],.62,16,.8,false);
 tube(F,'zgold',[0,13.12,0],[0,14.0,0],.18,10,.03);
 for(let i=0;i<4;i++){const a=i/4*TAU+TAU/8,c=Math.cos(a),s=Math.sin(a),Pf=(r,y,o)=>[c*r-s*o,y,s*r+c*o],th=.07,pts=[[RB*.97,3.2],[RB*.97,.9],[2.35,.12],[2.45,.75]];
  if(i===2)continue;   // this one broke off (lies in the dust)
  const bent=i===1?.25:0,PP=(r,y,o)=>{const p=Pf(r,y,o);if(bent){p[1]+=(r-RB)*bent;}return p;};
  quad(F,'zfin',...pts.map(([r,y])=>PP(r,y,th)).reverse());quad(F,'zfin',...pts.map(([r,y])=>PP(r,y,-th)));
  for(let k=0;k<4;k++){const[p,qq]=[pts[k],pts[(k+1)%4]];quad(F,'zfin',PP(p[0],p[1],-th),PP(qq[0],qq[1],-th),PP(qq[0],qq[1],th),PP(p[0],p[1],th));}
  tube(F,'zgold',PP(RB*.97,3.25,0),PP(2.47,.72,0),.07,6);tube(F,'zgold',PP(2.36,.08,0),PP(2.47,.76,0),.06,6);}
 yield;
 // move the rocket into the ruin frame
 let nF=0;for(const m in F){const a=F[m],g=grp(G,m);for(let i=0;i<a.length;i+=6){if(++nF%1200===0)yield;const p=rk([a[i],a[i+1],a[i+2]]),n=rkN([a[i+3],a[i+4],a[i+5]]);g.push(p[0],p[1],p[2],n[0],n[1],n[2]);}delete F[m];}
 yield;
 // interior: ribs, deck, crates, console, ceiling lamps, cable; the find glows on the deck
 const zw=Math.sqrt(RR*RR-AX*AX);
 for(let X=-1;X<=11;X+=2.2){const pts=[];for(let k=0;k<=22;k++){const a=-.42+k/22*(Math.PI+.84);if(Math.abs(wrap(a-HC))<holeW(YC-X/S,a)+.05){pts.push(null);continue;}pts.push([X,rocketAxisY(X)+Math.sin(a)*RR*.93,Math.cos(a)*RR*.93]);}
  for(let k=0;k<pts.length-1;k++)if(pts[k]&&pts[k+1])tube(G,'zframe',pts[k],pts[k+1],.07,5,.07,false);
}
 for(let X=-1.2;X<10.6;X+=1.95){yield;for(let zz=-1.6;zz<=1.61;zz+=1.6){if(q()<.08)continue;box(G,'zsteel',X,.09,zz,.9,.07,.74,0,0,(q()-.5)*.03);box(G,'zgold',X,.165,zz-.7,.86,.012,.03);}}
 yield;box(G,'zframe',4.6,.05,0,6.4,.03,zw-.1);
 for(const[X,zz,s,yw,rl]of[[1.0,-1.9,.42,.2,0],[1.9,-1.95,.34,.6,0],[1.4,-1.85,.3,.1,0],[7.6,-1.8,.44,-.3,0],[8.7,1.2,.4,.9,.45],[3.0,1.6,.3,.4,0]]){const y=s+.12;box(G,'zcrate',X,y,zz,s,s*.85,s*.8,yw,0,rl);box(G,'zgold',X,y+s*.35,zz,s*1.02,.03,s*.82,yw,0,rl);box(G,'zgold',X,y-s*.35,zz,s*1.02,.03,s*.82,yw,0,rl);}
 box(G,'zframe',9.6,1.1,-1.55,.7,.9,.35,.15);box(G,'zscreen',9.55,1.45,-1.18,.5,.28,.02,.15);box(G,'zamber',9.25,.7,-1.18,.06,.06,.02,.15);
 for(const X of[1.5,5.5,9.4]){const y=rocketAxisY(X)+RR*.86;box(G,'zframe',X,y+.08,0,.5,.05,.18);box(G,'zamber',X,y,0,.42,.03,.12);}
 for(let k=0;k<6;k++){const X=2.5+k*.7,y=rocketAxisY(X)+RR*.8-Math.sin(k/5*Math.PI)*.9;tube(G,'zdark',[X,y,-.6],[X+.7,rocketAxisY(X+.7)+RR*.8-Math.sin((k+1)/5*Math.PI)*.9,-.6],.035,4);}
 const[fx,fz]=[5.2,-.9];box(G,'zcore',fx,rocketAxisY(fx)+RR*.86,fz,.12,.04,.12);
 yield;
 // outside: hull petals, a broken fin, ribs, rubble, the furrow it ploughed, scorch on the ground
 for(let k=0;k<16;k++){const a=q()*TAU,d=7+q()*10,x=2+Math.cos(a)*d*1.2,z=Math.sin(a)*d+(Math.sin(a)>0?zw:-zw)*.6;if(Math.abs(z)<zw+.8&&x>-15&&x<16)continue;const w=.35+q()*.9,l=.3+q()*.7,yw=q()*TAU,pt=(q()-.5)*.7,rl=(q()-.5)*.9,y=.12+q()*.15;
  box(G,q()<.25?'zscorch':'zivory',x,y,z,w,.035,l,yw,pt,rl);if(q()<.5)box(G,'zgold',x,y+.04,z,w*.98,.012,.05,yw,pt,rl);}
 {const x=14.5,z=7.2,c=Math.cos(.7),s=Math.sin(.7),T=(u,v,y)=>[x+c*u+s*v,y,z-s*u+c*v],pts=[[0,0],[-2.3*S/2,0],[-2.6,1.2],[-.4,1.4]];
  quad(G,'zfin',...pts.map(([u,v])=>T(u,v,.25)));quad(G,'zfin',...pts.map(([u,v])=>T(u,v,.12)).reverse());tube(G,'zgold',T(0,0,.2),T(-.4,1.4,.2),.07,6);}
 yield;for(let k=0;k<26;k++){const x=-14+q()*31,side=q()<.5?-1:1,z=side*(zw+.3+q()*1.6),s=.25+q()*.7;lump(G,'zdust',x,-.05,z,s*1.6,s*.55,s,k*31+7);}
 yield;for(let k=0;k<14;k++){const x=17+q()*14,z=(q()-.5)*7,s=.5+q()*1.1;lump(G,'zdust',x,-.08,z,s*1.5,s*.4,s,k*17+3);}
 for(const[x,z,s]of[[16.5,0,4],[5,zw+1.4,2.4],[-2,zw+.9,1.6],[22,-1,3]])lump(G,'zsoot',x,-.02,z,s,.03,s*.7,(x*7)|0,9,1);
 for(let k=0;k<5;k++){const x=4+k*1.1+q(),y=.3+q()*.5,z=zw+1+q()*2;tube(G,'zframe',[x,y,z],[x+.8+q(),.1,z+.6],.05,5);}
 return{lights:[[2.2,1.6,zw-.2,'spark'],[6.8,3.2,zw-.6,'spark'],[5.5,rocketAxisY(5.5)+RR*.84,0,'flicker'],[fx,.6,fz,'find']]};}
// walls made of ivory panels between steel posts, gold trims, windows, a doorway, optional collapse
function wall(G,ax,az,bx,bz,H,o={}){const L=Math.hypot(bx-ax,bz-az),dx=(bx-ax)/L,dz=(bz-az)/L,yaw=Math.atan2(-dz,dx),n=Math.max(1,Math.round(L/1.6)),w=L/n,q=o.q||Math.random;
 for(let k=0;k<n;k++){const t=(k+.5)*w,cx=ax+dx*t,cz=az+dz*t,top=o.cut?Math.max(.4,H-o.cut(t,q)):H;
  if(o.door&&t>o.door[0]&&t<o.door[1]){box(G,'zivory',cx,H-.35,cz,w/2,.35,.12,yaw);continue;}
  const win=o.win&&o.win(k)&&top>2.4;
  if(win){box(G,'zivory',cx,.55,cz,w/2-.02,.55,.13,yaw);box(G,'zivory',cx,(2.25+top)/2,cz,w/2-.02,(top-2.25)/2,.13,yaw);box(G,'zglass',cx,1.68,cz,w/2-.2,.55,.05,yaw);
   box(G,'zgold',cx,1.12,cz,w/2-.1,.05,.15,yaw);box(G,'zgold',cx,2.24,cz,w/2-.1,.05,.15,yaw);if(o.lit&&o.lit(k))box(G,'zport',cx,1.68,cz,w/2-.24,.5,.02,yaw);}
  else box(G,'zivory',cx,top/2,cz,w/2-.02,top/2,.13,yaw);
  if(top>=H-.01){box(G,'zgold',cx,H-.08,cz,w/2,.08,.16,yaw);}
  box(G,'zgold',cx,.12,cz,w/2,.12,.16,yaw);
  const px=ax+dx*k*w,pz=az+dz*k*w,ph=o.cut?Math.max(.4,H-o.cut(k*w,q)*.8):H;box(G,'zframe',px,ph/2,pz,.12,ph/2,.18,yaw);}
 box(G,'zframe',bx,H/2,bz,.12,H/2,.18,yaw);}
function* buildStation(G){const q=rng(905),hx=6.5,hz=4.5,H=3.4;
 box(G,'zsteel',0,.12,0,hx+.6,.12,hz+.6);box(G,'zgold',0,.25,hz+.62,hx+.6,.02,.02);
 const cutR=(t)=>t>4.5?Math.min(2.6,(t-4.5)*.9)+Math.sin(t*5)*.25:0;
 wall(G,-hx,-hz,hx,-hz,H,{q,win:k=>k%2===1,lit:k=>k===1,cut:t=>t>9?Math.min(2.4,(t-9)*1.2)+Math.sin(t*4)*.2:0});
 wall(G,-hx,hz,-hx,-hz,H,{q,win:k=>k===2||k===4,lit:k=>k===2});
 wall(G,hx,-hz,hx,hz,H,{q,cut:t=>Math.min(2.7,1.2+t*.25)+Math.sin(t*6)*.2});
 wall(G,hx,hz,-hx,hz,H,{q,door:[hx-1.4,hx+1.4],win:k=>k===1||k===6,lit:k=>k===6});
 box(G,'zgold',-1.35,1.3,hz,.08,1.3,.2);box(G,'zgold',1.35,1.3,hz,.08,1.3,.2);box(G,'zgold',0,2.62,hz,1.45,.08,.2);box(G,'zamber',0,2.82,hz+.18,.4,.05,.03);
 yield;
 // roof: the left half holds, the right half has fallen in and leans on the floor
 for(let x=-hx+.7;x<.2;x+=1.3)box(G,'zivory',x,H+.1,0,.64,.1,hz+.15);box(G,'zgold',-hx/2,H+.24,hz+.15,hx/2+.2,.04,.04);box(G,'zgold',-hx/2,H+.24,-hz-.15,hx/2+.2,.04,.04);
 box(G,'zivory',3.0,1.85,-1.2,2.7,.1,2.9,.15,0,-.55);box(G,'zgold',5.4,.85,-1.0,.06,.06,2.8,.15,0,-.55);
 box(G,'zivory',3.6,.35,2.4,1.2,.08,.9,.6,.2,.15);
 tube(G,'zframe',[.4,H+.1,-hz],[4.6,.2,-hz+1.4],.09,6);tube(G,'zframe',[.4,H+.1,hz],[3.8,1.6,hz-1.0],.09,6);tube(G,'zframe',[.4,H,-hz],[.4,H,hz],.11,6);
 // antenna mast with a dish and a slow red beacon
 tube(G,'zframe',[-5.2,H+.2,-3.2],[-5.2,H+5.2,-3.2],.08,6);for(const y of[H+1.5,H+3,H+4.4])tube(G,'zgold',[-5.2,y,-3.5],[-5.2,y,-2.9],.03,4);
 {const c=[-5.2,H+3.4,-3.2];for(let i=0;i<14;i++){const a=i/14*TAU,b=(i+1)/14*TAU,p=(t,r,d)=>[c[0]+d,c[1]+Math.cos(t)*r,c[2]+Math.sin(t)*r];quad(G,'zivory',p(a,.2,.05),p(a,1.0,.38),p(b,1.0,.38),p(b,.2,.05),null,true);}tube(G,'zgold',c,[c[0]+.9,c[1],c[2]],.03,4);}
 box(G,'zsolar',-3.2,H+.55,1.8,1.6,.04,1.0,0,0,.35);tube(G,'zframe',[-3.2,H+.2,1.8],[-3.2,H+.5,1.8],.05,4);
 yield;
 // interior: console with a screen, lockers, a hanging lamp, rubble under the hole, crates and dust
 box(G,'zwall',0,.26,0,hx-.2,.02,hz-.2);
 box(G,'zframe',-5.4,.55,-2.2,.55,.55,1.1);box(G,'zscreen',-4.84,.95,-2.2,.02,.28,.7);box(G,'zgold',-5.4,1.12,-2.2,.6,.03,1.15);
 for(let k=0;k<4;k++)box(G,'zsteel',-3.6+k*.75,1.1,-hz+.45,.34,.85,.25);
 tube(G,'zdark',[-2.2,H,0],[-2.2,H-.8,0],.02,4);box(G,'zframe',-2.2,H-.85,0,.25,.05,.25);box(G,'zamber',-2.2,H-.92,0,.2,.02,.2);
 for(let k=0;k<10;k++)lump(G,'zdust',3+q()*3,.2,-2+q()*4,.4+q()*.6,.2+q()*.4,.4+q()*.5,k*13+1);
 for(const[x,z,s,yw]of[[-4.8,2.8,.4,.3],[-3.9,3.2,.32,.9],[1.6,-3.4,.36,.2]]){box(G,'zcrate',x,.26+s,z,s,s*.85,s*.8,yw);box(G,'zgold',x,.26+s*1.35,z,s*1.02,.03,s*.82,yw);}
 yield;
 // outside rubble and dust drifts against the walls
 for(let k=0;k<22;k++){const side=k%4,t=(q()-.5)*2,x=side<2?(side?1:-1)*(hx+.6+q()*1.4):t*hx,z=side<2?t*hz:(side===2?-1:1)*(hz+.7+q()*1.2);if(side===3&&Math.abs(x)<2)continue;lump(G,'zdust',x,0,z,.6+q()*1.2,.25+q()*.35,.5+q()*.8,k*7+5);}
 for(let k=0;k<7;k++){const x=hx+1+q()*4,z=-hz+q()*hz*2,w=.4+q()*.8;box(G,'zivory',x,.12,z,w,.05,.5+q()*.6,q()*TAU,(q()-.5)*.4,(q()-.5)*.5);}
 return{lights:[[-5.2,H+5.3,-3.2,'beacon'],[-2.2,H-1.0,0,'flicker']]};}
function* buildHangar(G){const q=rng(1213),r=6,zl=8,NA=14,NX=8,P=(x,y,z)=>[x,y,z],A=(phi,rr,z)=>[Math.cos(phi)*rr,Math.sin(phi)*rr*.92,z];
 const hole=(i,j)=>(j>=3&&j<=4&&i>=5&&i<=8)||(j===6&&i>=9&&i<=12)||(j===1&&i===3);
 for(let j=0;j<NX;j++){const z0=-zl+j*2*zl/NX,z1=z0+2*zl/NX;for(let i=0;i<NA;i++){if(hole(i,j))continue;const p0=i/NA*Math.PI,p1=(i+1)/NA*Math.PI,m=(i*3+j)%7===0?'zsteel':'zivory',pm=(p0+p1)/2,nn=[Math.cos(pm),Math.sin(pm),0];
   quad(G,m,A(p0,r,z0),A(p0,r,z1),A(p1,r,z1),A(p1,r,z0),nn);quad(G,'zwall',A(p0,r*.97,z0),A(p1,r*.97,z0),A(p1,r*.97,z1),A(p0,r*.97,z1),nn.map(v=>-v));}}
 for(let j=0;j<=NX;j++){const z=-zl+j*2*zl/NX,th=j===NX?.16:.09;for(let i=0;i<NA;i++){if(j>0&&j<NX&&hole(i,j)&&hole(i,j-1))continue;if(j===6&&i>=9&&i<=12)continue;tube(G,'zgold',A(i/NA*Math.PI,r+.02,z),A((i+1)/NA*Math.PI,r+.02,z),th,5,th,false);}}
 tube(G,'zframe',A(Math.PI/2,r*.96,-zl),A(Math.PI/2,r*.96,zl),.1,6);
 yield;
 // back wall with a hole, closing strips under the arch
 for(let k=0;k<12;k++){const x0=-r+k*r/6,x1=x0+r/6,xm=(x0+x1)/2,top=Math.sqrt(Math.max(0,r*r-xm*xm))*.92;if(xm>.8&&xm<3.2)continue;const t2=xm>3.2&&xm<4.4?top*.45:top;box(G,(k%3)?'zivory':'zsteel',xm,t2/2,-zl,r/12-.02,t2/2,.12);}
 box(G,'zivory',2.0,.55,-zl,1.2,.55,.12);
 yield;
 // the collapsed panels lie inside, a tilted door slab at the front, hanging lamps, workbench, crates, an old nose cone
 for(let k=0;k<6;k++){const x=-3+q()*6,z=-3.5+q()*3+(k%2)*6;box(G,q()<.3?'zsteel':'zivory',x,.15+q()*.3,z,.9+q()*.5,.05,.6+q()*.5,q()*TAU,(q()-.5)*.5,(q()-.5)*.6);}
 box(G,'zivory',-2.2,1.2,-4.4,1.5,.06,1.6,.6,.8,0);
 box(G,'zsteel',r-.4,1.6,zl+.9,.08,1.6,1.4,.3);box(G,'zgold',r-.4,3.25,zl+.9,.1,.06,1.45,.3);
 for(const z of[-4.5,0,4.5]){const y=r*.92-.8;tube(G,'zdark',[0,y,z],[0,r*.92-.1,z],.02,4);tube(G,'zframe',[0,y,z],[0,y+.14,z],.22,10,.08);box(G,'zamber',0,y-.02,z,.14,.02,.14);}
 box(G,'zframe',-4.2,.9,2.5,.6,.05,1.5);for(const[dx,dz]of[[-.5,-1.3],[.5,-1.3],[-.5,1.3],[.5,1.3]])box(G,'zframe',-4.2+dx,.45,2.5+dz,.04,.45,.04);box(G,'zcrate',-4.2,1.08,2.1,.3,.13,.4);box(G,'zscreen',-4.2,1.03,3.2,.25,.03,.18);
 for(const[x,z,s,yw]of[[3.8,-6.6,.5,.2],[4.6,-6.1,.36,.9],[-4.3,-6.8,.44,.4],[-3.9,-5.9,.3,1.1],[4.2,3.8,.4,.6]]){box(G,'zcrate',x,s*.85,z,s,s*.85,s*.8,yw);box(G,'zgold',x,s*1.3,z,s*1.02,.03,s*.82,yw);}
 {const c=[1.2,.9,1.5];const prof=[[1,0],[.97,.3],[.89,.46],[.75,.62],[.55,.76],[.32,.88],[.12,.96],[0,1]];for(let j=0;j<prof.length-1;j++)for(let i=0;i<20;i++){const a=i/20*TAU,b=(i+1)/20*TAU,pt=(rr,t,th)=>{const l=[Math.cos(th)*rr*.85,Math.sin(th)*rr*.85,t*2.4];const p=rot(l,.9,0,0);return[c[0]+p[0],c[1]+p[1]-.12,c[2]+p[2]];};quad(G,j<1?'zgold':'zivory',pt(prof[j][0],prof[j][1],a),pt(prof[j][0],prof[j][1],b),pt(prof[j+1][0],prof[j+1][1],b),pt(prof[j+1][0],prof[j+1][1],a));}}
 for(let k=0;k<12;k++)lump(G,'zdust',-1.2+q()*2.4,0,-2+q()*2.2+(k>6?4:0),.4+q()*.6,.2+q()*.3,.4+q()*.5,k*11+2);
 yield;
 for(let k=0;k<18;k++){const side=q()<.5?-1:1,x=side*(r+.3+q()*1.8),z=(q()-.5)*2*zl;lump(G,'zdust',x,0,z,.7+q()*1.2,.3+q()*.4,.6+q(),k*5+9);}
 for(let k=0;k<6;k++){const x=r+1.5+q()*3,z=2+q()*5;box(G,'zivory',x,.12,z,.8+q()*.6,.05,.6+q()*.4,q()*TAU,(q()-.5)*.3,(q()-.5)*.4);}
 tube(G,'zframe',[-r*.7,r*.6,-zl-.2],[-r*.7,r*.6+3,-zl-.2],.06,5);box(G,'zamber',-r*.7,r*.6+3.1,-zl-.2,.08,.08,.08);
 return{lights:[[0,r*.92-.95,0,'flicker'],[-r*.7,r*.6+3.2,-zl-.2,'beacon'],[1.6,4.8,-.2,'spark']]};}
function* buildDome(G){const q=rng(77),r=6.6,nu=24,nv=7,ky=.82,P=(th,ph,rr)=>[Math.sin(ph)*Math.cos(th)*rr,Math.sin(th)*rr*ky,Math.cos(ph)*Math.cos(th)*rr];
 const gone=(i,j)=>(j<2&&(i===0||i===23))||(j>=2&&j<=5&&i>=8&&i<=11)||(j>=3&&i===12)||(j===6&&(i%5===2))||(j>2&&q2(i,j)<.06);
 const q2=(i,j)=>((Math.sin(i*12.9898+j*78.233)*43758.5453)%1+1)%1;
 for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){if(gone(i,j))continue;const th0=j/nv*Math.PI/2,th1=(j+1)/nv*Math.PI/2,p0=i/nu*TAU,p1=(i+1)/nu*TAU;
  const win=j===1&&i%3===1,m=win?'zglass':(i+j)%6===0?'zsteel':'zivory',nn=norm(P((th0+th1)/2,(p0+p1)/2,1).map((v,k)=>k===1?v/ky/ky:v));
  quad(G,m,P(th0,p0,r),P(th0,p1,r),P(th1,p1,r),P(th1,p0,r),nn);quad(G,'zwall',P(th0,p0,r*.965),P(th1,p0,r*.965),P(th1,p1,r*.965),P(th0,p1,r*.965),nn.map(v=>-v));
  if(win&&i===4)quad(G,'zport',P(th0+.03,p0+.03,r*.99),P(th0+.03,p1-.03,r*.99),P(th1-.03,p1-.03,r*.99),P(th1-.03,p0+.03,r*.99),nn);}
 yield;
 for(let i=0;i<nu;i+=3){for(let j=0;j<nv;j++){if(gone(i,j)&&gone(i-1<0?nu-1:i-1,j))continue;tube(G,'zgold',P(j/nv*Math.PI/2,i/nu*TAU,r+.03),P((j+1)/nv*Math.PI/2,i/nu*TAU,r+.03),.07,5,.07,false);}}
 for(const j of[1,2,5]){for(let i=0;i<nu;i++){if(gone(i,j)&&gone(i,j-1))continue;tube(G,'zgold',P(j/nv*Math.PI/2,i/nu*TAU,r+.03),P(j/nv*Math.PI/2,(i+1)/nu*TAU,r+.03),j===1?.09:.06,5,j===1?.09:.06,false);}}
 for(let i=0;i<nu;i++){if(i===0||i===23)continue;box(G,'zsteel',Math.sin((i+.5)/nu*TAU)*r,.15,Math.cos((i+.5)/nu*TAU)*r,.85,.15,.25,(i+.5)/nu*TAU+Math.PI/2);}
 // entrance tunnel (half cylinder) with a gold frame
 for(let i=0;i<10;i++){const a=i/10*Math.PI,b=(i+1)/10*Math.PI,T=(t,zz,rr)=>[Math.cos(t)*rr,Math.sin(t)*rr,zz];quad(G,'zivory',T(a,r-.6,1.6),T(a,r+2.4,1.6),T(b,r+2.4,1.6),T(b,r-.6,1.6),[Math.cos((a+b)/2),Math.sin((a+b)/2),0]);
  quad(G,'zwall',T(a,r-.6,1.5),T(b,r-.6,1.5),T(b,r+2.4,1.5),T(a,r+2.4,1.5),[-Math.cos((a+b)/2),-Math.sin((a+b)/2),0]);tube(G,'zgold',T(a,r+2.45,1.66),T(b,r+2.45,1.66),.1,5,.1,false);tube(G,'zgold',T(a,r+.8,1.64),T(b,r+.8,1.64),.06,5,.06,false);}
 box(G,'zamber',0,1.75,r+2.4,.3,.05,.04);
 yield;
 // the fallen section lies outside the gap, antenna and a tilted solar wing on top, interior table, lamp, crates
 for(let k=0;k<9;k++){const a=(8+q()*4)/nu*TAU,d=r+1+q()*3.5,x=Math.sin(a)*d,z=Math.cos(a)*d;box(G,q()<.3?'zsteel':'zivory',x,.2+q()*.3,z,.6+q()*.7,.05,.5+q()*.6,a+q(),(q()-.5)*.6,(q()-.5)*.7);if(q()<.5)tube(G,'zgold',[x-.6,.2,z],[x+.7,.4+q()*.5,z+.4],.06,5);}
 for(let k=0;k<12;k++){const a=(7.5+q()*5)/nu*TAU,d=r*(.75+q()*.25),x=Math.sin(a)*d,z=Math.cos(a)*d;lump(G,'zdust',x,0,z,.6+q()*1.1,.3+q()*.5,.6+q()*.8,k*9+4);}
 tube(G,'zframe',[0,r*ky-.1,0],[0,r*ky+3.2,0],.07,6);box(G,'zamber',0,r*ky+3.3,0,.1,.1,.1);tube(G,'zgold',[-.5,r*ky+2.2,0],[.5,r*ky+2.2,0],.03,4);
 box(G,'zsolar',-3.5,r*ky*.8+.4,-2,1.5,.04,.9,.6,0,.5);tube(G,'zframe',[-3.0,r*ky*.72,-1.8],[-3.2,r*ky*.8+.3,-1.9],.05,4);
 box(G,'zwall',0,.06,0,r*.75,.03,r*.75);box(G,'zframe',1.2,.7,.6,1,.06,.6);tube(G,'zframe',[1.2,0,.6],[1.2,.66,.6],.12,8);box(G,'zscreen',1.2,.78,.6,.6,.01,.35);
 tube(G,'zdark',[0,r*ky-.2,0],[0,3.6,0],.02,4);tube(G,'zframe',[0,3.5,0],[0,3.65,0],.25,10,.08);box(G,'zamber',0,3.47,0,.17,.02,.17);
 for(const[x,z,s,yw]of[[-3.4,1.2,.42,.3],[-3.0,2.0,.3,.8],[3.6,-1.8,.38,.1]]){box(G,'zcrate',x,s*.85,z,s,s*.85,s*.8,yw);box(G,'zgold',x,s*1.3,z,s*1.02,.03,s*.82,yw);}
 for(let k=0;k<14;k++){const a=q()*TAU,x=Math.sin(a)*(r+.5+q()*1.5),z=Math.cos(a)*(r+.5+q()*1.5);if(Math.abs(x)<2&&z>0)continue;lump(G,'zdust',x,0,z,.6+q(),.25+q()*.3,.5+q()*.7,k*3+11);}
 return{lights:[[0,3.35,0,'flicker'],[0,r*ky+3.35,0,'beacon']]};}
// interior light factor per ruin (ruin-local point); 1 = full daylight
function shadeFn(id){const lamp=(L,p)=>{let s=0;for(const l of L){const d=(p[0]-l[0])**2+(p[1]-l[1])**2+(p[2]-l[2])**2;s+=.55*Math.exp(-d/3.2);}return s;};
 if(id==='rocketWreck'){const L=[[1.5,rocketAxisY(1.5)+RR*.8,0],[5.5,rocketAxisY(5.5)+RR*.8,0],[9.4,rocketAxisY(9.4)+RR*.8,0],[9.6,1.4,-1.2]];
  const NP=[[8.4,1],[8.4+5.4*.16,1],[8.4+5.4*.3,.97],[8.4+5.4*.46,.89],[8.4+5.4*.62,.75],[8.4+5.4*.76,.55],[8.4+5.4*.88,.32],[8.4+5.4*.96,.12],[13.8,0]],rp=X=>{const y=YC-X/S;if(y<=8.4)return y<1.8?.9:1;for(let i=1;i<NP.length;i++)if(y<=NP[i][0]){const a=NP[i-1],b=NP[i],t=(y-a[0])/(b[0]-a[0]);return a[1]+(b[1]-a[1])*t;}return 0;};
  return p=>{const X=p[0],dy=p[1]-rocketAxisY(X),rr=Math.hypot(dy,p[2]);if(rr>RR*rp(X)*.975-.02||X<-15.5||X>16)return 1;const o=(X-4.8)**2*.6+(p[1]-1.3)**2+(p[2]-RR)**2;return Math.min(1,.1+.42*Math.exp(-o/8)+lamp(L,p));};}
 if(id==='oldStation')return p=>{if(Math.abs(p[0])>6.4||Math.abs(p[2])>4.4||p[1]>3.35)return 1;const door=.6*Math.exp(-(p[0]**2+(p[2]-4.5)**2)/7),hole=p[0]>.5?.25+.3*Math.min(1,(p[0]-.5)/3):0;return Math.min(1,.16+door+hole+lamp([[-2.2,2.4,0],[-4.84,.95,-2.2]],p));};
 if(id==='brokenHangar')return p=>{if(Math.abs(p[2])>7.95||p[0]**2+(p[1]/.92)**2>(6*.975)**2)return 1;const front=.65*Math.exp(-((8-p[2])**2)/14),shaft=.35*Math.exp(-(p[0]**2*.3+(p[2]+.5)**2*.25))+.25*Math.exp(-((p[0]+3.2)**2*.3+(p[2]-4.5)**2*.3));return Math.min(1,.15+front+shaft+lamp([[0,4.4,-4.5],[0,4.4,0],[0,4.4,4.5]],p));};
 if(id==='fallenDome')return p=>{const rr=p[0]**2+p[2]**2+(p[1]/.82)**2;if(rr>(6.6*.97)**2&&!(Math.abs(p[0])<1.45&&p[2]>6&&p[2]<9&&p[1]<1.55))return 1;const gap=.45*Math.exp(-((p[0]-5)**2+(p[2]+2.4)**2)/10),door=.6*Math.exp(-(p[0]**2+(p[2]-8.8)**2)/8);return Math.min(1,.15+gap+door+lamp([[0,3.3,0],[1.2,.8,.6]],p));};
 return()=>1;}
// build: ruin-local geometry -> world, with the interior factor folded into the normal length
function* build(R,ch){const G={},F={},y0=Core.height(R.x,R.z,ch||1);let info={lights:[]};
 const gen=R.id==='rocketWreck'?buildRocket(G,F):R.id==='oldStation'?buildStation(G):R.id==='brokenHangar'?buildHangar(G):buildDome(G);
 for(;;){const r=gen.next();if(r.done){info=r.value||info;break;}yield;}
 const sh=shadeFn(R.id),c=Math.cos(R.yaw),s=Math.sin(R.yaw),OUT={};let n=0;
 for(const m in G){const a=G[m],o=OUT[m]=new Float32Array(a.length),lit=MAT[m]&&MAT[m][0]>=100;
  for(let i=0;i<a.length;i+=6){const x=a[i],y=a[i+1],z=a[i+2];let k=1;if(lit)k=Math.max(.06,sh([x,y,z]));const nl=Math.hypot(a[i+3],a[i+4],a[i+5])||1,f=k/nl;
   o[i]=R.x+c*x+s*z;o[i+1]=y0+y;o[i+2]=R.z-s*x+c*z;o[i+3]=(c*a[i+3]+s*a[i+5])*f;o[i+4]=a[i+4]*f;o[i+5]=(-s*a[i+3]+c*a[i+5])*f;if(++n%1500===0)yield;}}
 const lights=(info.lights||[]).map(([x,y,z,t])=>({x:R.x+c*x+s*z,y:y0+y,z:R.z-s*x+c*z,t}));
 return{G:OUT,lights};}
function buildSync(R,ch){const g=build(R,ch);let r;do r=g.next();while(!r.done);return r.value;}
root.MoonRuins2={MAT,layout,build,buildSync,blocked,cameraBlocked,rocketHole,segHit};
})(typeof window!=='undefined'?window:globalThis);
