/* v65 LIFE #7 "The Lost Expedition": the frozen camp of the first expedition, in a snowy basin behind the Ice Ridge in the north
   (centre Core.LOST, 4/60; the ridge itself is terrain from chapter 7, core.js lostRidge, with the Ice Pass cut through it to the south).
   - snow cover draped over the basin and the ridge (ice-blue rock on the steep parts), giant ice spires crowning the peaks
   - the camp: three orange dome tents (one log in front of two of them), the crashed lander "Polaris" with its blinking beacon
     (the third log), a paw flag, snow drifts, crates
   - the signal mast with nine aurora lanterns (lights-out puzzle; lanterns follow state.auroraGrid), aurora curtains in the sky
     that blaze once the beacon wakes, the frozen hangar whose ice door melts and the Sky Drive floating in its doorway
   - ice lanterns along the pass, the Navigator waiting at its mouth
   Ridge colliders block walking (alt < .9 above the slope) so the Ice Pass is the way in on foot — or fly over it on the bike.
   Built lazily, baked per material, drawn from chapter 7 within DRAW_R. Low quality skips the detail group, snowfall and most halos.
   Load order: after depths-world.js, before chapter1-style.js. */
(function(root){'use strict';
const R=root.MoonRenderer&&root.MoonRenderer.prototype,Core=root.MoonCore,B=root.MoonOutpostBuilder,M=root.MoonRenderMath;
if(!R||!Core||!B||!Core.LOST)return;
const old={scene:R.scene,render:R.render,blocked:R.blocked};
const TAU=Math.PI*2,DRAW_R=150,CH=7,L0=Core.LOST,P=Core.POINTS;
const norm=v=>{const l=Math.hypot(v[0],v[1],v[2])||1;return[v[0]/l,v[1]/l,v[2]/l];},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
function rng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
// kinds: 17 bright/ivory, 4 stone, 12 emissive, 13 glass, 16 gold metal, 21 glossy, 0 matte
const MATS={snow:[18,[2.3,2.45,2.75]],iceRock:[4,[.60,.70,.86]],drift:[17,[.94,.97,1]],ice:[30,[.24,.62,1]],iceHi:[12,[.06,.32,1]],iceCore:[12,[.22,.58,1]],
 tent:[21,[1,.50,.16]],tentB:[21,[1,.80,.36]],cream:[21,[1,.95,.86]],dark:[0,[.08,.09,.12]],steel:[17,[.80,.84,.90]],gold:[16,[1,.78,.34]],
 hull:[21,[.92,.93,.96]],foil:[16,[1,.70,.25]],frost:[13,[.76,.92,1]],lampG:[12,[1,.82,.38]],drive:[12,[.45,1,.92]],driveHi:[12,[1,.9,.5]],screen:[12,[1,.72,.32]],flag:[21,[.30,.62,.96]],crate:[21,[.62,.42,.26]]};
const C=[L0.x,L0.z];
const TENTS=[[-3.4,59.8,1.65,'tent'],[11.2,64.0,1.5,'tent'],[9.6,55.6,1.25,'tentB']];
const LANDER=[6.6,70.2],MAST=[4,56.6],HANGAR=[-5.4,69.8,2.5],DRIVE=[-4.65,67.75];
const PANEL=[];for(let j=0;j<3;j++)for(let i=0;i<3;i++)PANEL.push([MAST[0]+(i-1)*.62,1.25+(2-j)*.62]);  // index = row*3+col, row 0 on top
const PASS_LAMPS=[];for(let z=40.6;z<=50.2;z+=3.2)PASS_LAMPS.push([L0.x-2.5,z],[L0.x+2.5,z]);
const CRATES=[[-1.2,57.4,.0],[13.4,61.8,.5],[8.4,68.4,.9],[1.6,63.6,.3]];
const SPIRES=[];{const rnd=rng(7101);for(let a=0;a<360;a+=17){const t=a*Math.PI/180;if(Math.abs(Math.atan2(Math.sin(t+Math.PI/2),Math.cos(t+Math.PI/2)))<.5)continue;const rr=L0.ridge+(rnd()-.5)*2.2,x=L0.x+Math.cos(t)*rr,z=L0.z+Math.sin(t)*rr;if(z>Core.WORLD.maxZ+6)continue;SPIRES.push([x,z,1.1+rnd()*.8,rnd()]);}}
const INNER=[[-6.8,55.2,.9],[14.6,57.6,.8],[-8.2,63.4,1.0],[15.2,66.2,.85],[0.2,71.6,.9],[12.4,70.6,.75],[-1.4,51.4,.7],[9.8,51.2,.7]];
const DRIFTS=[[-6,58,1.2],[16,61,1.0],[2,72,1.3],[-8.4,66.2,1.0],[13.8,68.6,1.1],[0,53.4,.8],[8.4,59,.6],[-2.6,65.8,.7]];
function grp(map,mat){let g=map.get(mat);if(!g)map.set(mat,g=[]);return g;}
function bake(map,b,x,y,z,yaw=0){const c=Math.cos(yaw),s=Math.sin(yaw);for(const[mat,data]of b.groups){const g=grp(map,mat);for(let i=0;i<data.length;i+=6){const px=data[i],py=data[i+1],pz=data[i+2],nx=data[i+3],ny=data[i+4],nz=data[i+5];g.push(x+c*px+s*pz,y+py,z-s*px+c*pz,c*nx+s*nz,ny,-s*nx+c*nz);}}}
function xform(dst,data,x,y,z,sx,sy,sz,yaw){const c=Math.cos(yaw),s=Math.sin(yaw);for(let i=0;i<data.length;i+=6){const px=data[i]*sx,py=data[i+1]*sy,pz=data[i+2]*sz;const n=norm([data[i+3]/sx,data[i+4]/sy,data[i+5]/sz]);dst.push(x+c*px+s*pz,y+py,z-s*px+c*pz,c*n[0]+s*n[2],n[1],-s*n[0]+c*n[2]);}}
function prism(lo,hi,core,x,y,z,r,h,yaw,pitch,roll,rnd,withCore){const k=6,rad=[];for(let i=0;i<k;i++)rad.push(r*(.78+rnd()*.38));const tip=h*(.22+rnd()*.12),bev=h-tip;
 const m=M.model(x,y,z,1,1,1,yaw,pitch,roll),T=p=>[m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]];
 const ring=(yy,sc)=>rad.map((rr,i)=>{const t=i/k*TAU;return T([Math.cos(t)*rr*sc,yy,Math.sin(t)*rr*sc]);}),push=(d,a,b,c)=>{const n=norm(cross(sub(b,a),sub(c,a)));d.push(...a,...n,...b,...n,...c,...n);};
 const b0=ring(-.12,1.02),mid=ring(bev*.55,1.0),top=ring(bev,.9),apex=T([0,h,0]);
 for(let i=0;i<k;i++){const n=(i+1)%k,d=i%2?hi:lo;push(d,b0[i],mid[n],mid[i]);push(d,b0[i],b0[n],mid[n]);push(i%2?lo:hi,mid[i],top[n],top[i]);push(i%2?lo:hi,mid[i],mid[n],top[n]);push(d,top[i],top[n],apex);}
 if(withCore){const cr=rad.map(v=>v*.42),cring=yy=>cr.map((rr,i)=>{const t=i/k*TAU;return T([Math.cos(t)*rr,yy,Math.sin(t)*rr]);}),c0=cring(.02),c1=cring(bev*.82),ca=T([0,bev+tip*.55,0]);for(let i=0;i<k;i++){const n=(i+1)%k;push(core,c0[i],c1[n],c1[i]);push(core,c0[i],c0[n],c1[n]);push(core,c1[i],c1[n],ca);}}}
function spire(map,x,y,z,scale0,seed,small){/* v80: small ice-crystal clusters (knee-to-waist) */const scale=Math.min(scale0,.26),TH=.6;const rnd=rng(seed),lo=grp(map,'ice'),hi=grp(map,'iceHi'),co=grp(map,'iceCore');
 prism(lo,hi,co,x,y,z,.42*scale*TH,(4.2+rnd()*1.6)*scale,rnd()*TAU,(rnd()-.5)*.12,(rnd()-.5)*.12,rnd,true);
 for(let i=0;i<5;i++){const t=i/5*TAU+rnd()*.6,d=(.4+rnd()*.2)*scale,tilt=.22+rnd()*.25;prism(lo,hi,co,x+Math.cos(t)*d,y,z+Math.sin(t)*d,(.2+rnd()*.08)*scale*TH,(1.6+rnd()*1.4)*scale,rnd()*TAU,Math.sin(t)*tilt,-Math.cos(t)*tilt,rnd,true);}
 if(small)for(let i=0;i<5;i++){const t=i/5*TAU+rnd()*.5,d=(.9+rnd()*.4)*scale,tilt=.45+rnd()*.4;prism(lo,hi,co,x+Math.cos(t)*d,y,z+Math.sin(t)*d,(.09+rnd()*.06)*scale*TH,(.5+rnd()*.6)*scale,rnd()*TAU,Math.sin(t)*tilt,-Math.cos(t)*tilt,rnd,false);}}
const G=(r,x,z)=>r.terrain(x,z,CH);
// snow edge: irregular radius around the camp + the pass corridor
const snowR=a=>21.6+1.5*Math.sin(a*3+.4)+.9*Math.sin(a*7+2.1)+.5*Math.sin(a*13);
function snowAt(x,z){const dx=x-L0.x,dz=z-L0.z;if(dz<0&&Math.abs(dx)<4.6+.6*Math.sin(z*.7)&&z>37.6+Math.sin(x*1.3)*.6)return true;return Math.hypot(dx,dz)<snowR(Math.atan2(dz,dx));}
function snowCover(r,main){const H=(x,z)=>G(r,x,z),sn=grp(main,'snow'),ir=grp(main,'iceRock');
 // soft wind ripples in the normals so the snow field is not a flat sheet
 const vert=(a,b)=>{const y=H(a,b),w=.06*Math.sin(a*1.7+b*.6)+.04*Math.sin(b*2.3-a*.9),n=norm([H(a-.25,b)-H(a+.25,b)+w,.5,H(a,b-.25)-H(a,b+.25)+w*.7]);return[a,y+.05,b,...n];};
 const quad=(x,z,S,part)=>{const q=[[x,z],[x+S,z],[x+S,z+S],[x,z+S]],in_=q.map(([a,b])=>snowAt(a,b));if(!in_.some(Boolean))return;
  if(!in_.every(Boolean)){if(S>.3){const h=S/2;for(const[dx,dz]of[[0,0],[h,0],[0,h],[h,h]])quad(x+dx,z+dz,h,true);return;}}
  const v=q.map(([a,b])=>vert(a,b));const steep=v.reduce((m,p)=>Math.min(m,p[4]),1)<.5,d=steep?ir:sn;
  for(const t of[[0,2,1],[0,3,2]])if(t.every(k=>in_[k]))for(const k of t)d.push(...v[k]);};
 for(let z=L0.z-25;z<Math.min(L0.z+25,Core.WORLD.maxZ+8);z+=1)for(let x=L0.x-25;x<L0.x+25;x+=1)quad(x,z,1);}
function dome(b,mat,x,y,z,r,h){const prof=[];for(let i=0;i<=10;i++){const a=i/10*Math.PI/2;prof.push([Math.max(.001,Math.cos(a)),Math.sin(a)]);}const k=new B();k.shell(mat,prof,r,h);for(const[m,d]of k.groups){const g=b.groups.get(m)||[];for(let i=0;i<d.length;i+=6)g.push(d[i]+x,d[i+1]+y,d[i+2]+z,d[i+3],d[i+4],d[i+5]);b.groups.set(m,g);}}
function build(r){const main=new Map(),detail=new Map(),door=new Map(),drive=new Map(),lamp=new Map(),beacon=new Map();
 const geo=k=>r.meshes['geology'+k]&&r.meshes['geology'+k].data;
 snowCover(r,main);
 SPIRES.forEach(([x,z,s,q],i)=>spire(i%3===2?detail:main,x,G(r,x,z)-.3,z,s,7200+i,true));
 INNER.forEach(([x,z,s],i)=>spire(main,x,G(r,x,z)-.15,z,s*.62,7300+i,true));
 // snow drifts: flattened boulders
 DRIFTS.forEach(([x,z,s],i)=>{const dm=geo(i%4);if(dm)xform(grp(main,'drift'),dm,x,G(r,x,z)+s*.12,z,s*1.5,s*.42,s*1.1,i*1.7);});
 // tents: orange domes with cream bands, a dark door, guy lines + pegs
 TENTS.forEach(([x,z,rad,mat],i)=>{const y=G(r,x,z)-.05,b=new B();dome(b,mat,0,0,0,rad,rad*1.05);b.tube('cream',[0,.0,0],[0,.12,0],rad*1.02,28,rad*1.0);
  for(const a of[-.55,.55]){const k=new B();k.ring('cream',0,0,0,rad*1.01,rad*1.05,.05,.06,28);for(const[m,d]of k.groups){const g=b.groups.get(m)||[];for(let j=0;j<d.length;j+=6){const px=d[j],py=d[j+1],pz=d[j+2],c=Math.cos(a),s=Math.sin(a);if(py<0)continue;g.push(px*c+pz*s,py,-px*s+pz*c,d[j+3]*c+d[j+5]*s,d[j+4],-d[j+3]*s+d[j+5]*c);}b.groups.set(m,g);}}
  b.box('dark',0,rad*.38,-rad*.93,rad*.62,rad*.74,.08);b.box('tentB',0,rad*.78,-rad*.96,rad*.7,.08,.06);b.tube('steel',[0,rad*1.0,0],[0,rad*1.3,0],.03,6);b.tube('gold',[0,rad*1.28,0],[0,rad*1.34,0],.07,8);
  for(const a of[.8,2.4,3.9,5.5]){const ex=Math.sin(a)*(rad+1.0),ez=Math.cos(a)*(rad+1.0);b.tube('steel',[Math.sin(a)*rad*.7,rad*.72,Math.cos(a)*rad*.7],[ex,.05,ez],.012,4);b.tube('gold',[ex,-.05,ez],[ex,.14,ez],.035,6);}
  bake(main,b,x,y,z,i===1?Math.PI*.95:i===2?-.4:Math.PI*.05+Math.PI);});
 // the lander "Polaris": a tilted hull on three legs, gold foil, round hatch, antenna dish
 {const[x,z]=LANDER,y=G(r,x,z),b=new B();const tilt=.22;
  const k=new B();k.tube('hull',[0,.9,0],[0,2.6,0],1.25,24,1.05);k.tube('hull',[0,2.6,0],[0,3.3,0],1.05,24,.55);k.tube('steel',[0,3.3,0],[0,3.45,0],.55,20,.45);k.tube('foil',[0,.55,0],[0,.92,0],1.32,24,1.28);k.tube('dark',[0,.35,0],[0,.56,0],.8,18,.95);
  k.ring('steel',0,1.95,-1.18,.42,.42,.18,.12,20);k.box('frost',0,1.95,-1.2,.5,.5,.04);k.tube('gold',[0,2.75,-.94],[0,2.75,-.86],.16,14);k.paw(0,2.75,-.99,.32,'dark');
  for(let i=0;i<3;i++){const a=i/3*TAU+.4,sx=Math.sin(a),sz=Math.cos(a);k.tube('steel',[sx*1.0,1.1,sz*1.0],[sx*1.9,-.1,sz*1.9],.07,8);k.tube('foil',[sx*1.9,-.1,sz*1.9],[sx*1.9,.02,sz*1.9],.28,14,.22);}
  k.tube('steel',[.6,3.3,.3],[.9,4.3,.4],.035,6);k.tube('steel',[.9,4.3,.4],[.9,4.36,.4],.32,18,.05);
  for(const[m,d]of k.groups){const g=b.groups.get(m)||[];const c=Math.cos(tilt),s=Math.sin(tilt);for(let i=0;i<d.length;i+=6){const px=d[i],py=d[i+1],pz=d[i+2];g.push(px,py*c-pz*s-.25,py*s+pz*c,d[i+3],d[i+4]*c-d[i+5]*s,d[i+4]*s+d[i+5]*c);}b.groups.set(m,g);}
  bake(main,b,x,y,z,.5);
  const bb=new B();bb.tube('lampG',[0,0,0],[0,.22,0],.16,12,.1);bake(beacon,bb,0,0,0,0);
  // paw flag beside it
  const fb=new B();fb.tube('steel',[0,0,0],[0,3.2,0],.045,8);fb.tube('gold',[0,3.2,0],[0,3.3,0],.09,10);fb.box('flag',.55,2.75,0,1.05,.68,.03);fb.paw(.55,2.75,.03,.42,'cream');fb.paw(.55,2.75,-.03,.42,'cream');bake(main,fb,x-3.2,G(r,x-3.2,z+.8)-.05,z+.8,.3);}
 // signal mast with the 3×3 lantern panel facing south (-z)
 {const[x,z]=MAST,y=G(r,x,z)-.05,b=new B();b.tube('steel',[0,0,0],[0,.25,0],.85,16,.75);b.tube('steel',[0,.25,.25],[0,8.8,.25],.1,10,.06);
  for(let j=0;j<5;j++){const yy=3.6+j*1.1;b.tube('steel',[-.32,yy,.25],[.32,yy,.25],.03,6);}b.tube('gold',[0,8.7,.25],[0,8.95,.25],.2,12);
  b.box('dark',0,1.87,-.35+.25,2.15,2.15,.14);b.box('steel',0,1.87,-.28+.25,2.3,2.3,.06);b.box('gold',0,3.03,-.3+.25,2.3,.1,.16);b.box('gold',0,.73,-.3+.25,2.3,.1,.16);
  bake(main,b,x,y,z,0);
  const lb=new B();lb.tube('steel',[0,0,0],[0,0,-.08],.24,14,.24);lb.tube('lampG',[0,0,-.08],[0,0,-.2],.2,14,.14);bake(lamp,lb,0,0,0,0);}
 // frozen hangar: quonset half-cylinder (door to the south-east), ice door that melts
 {const[x,z,rad]=HANGAR,y=G(r,x,z)-.08,b=new B(),N=14,L=5.4;for(let i=0;i<N;i++){const a0=i/N*Math.PI,a1=(i+1)/N*Math.PI;const p=a=>[Math.cos(a)*rad,Math.sin(a)*rad];const[x0,y0]=p(a0),[x1,y1]=p(a1);
   b.quad(i%4===0?'steel':'hull',[x0,y0,-L/2],[x1,y1,-L/2],[x1,y1,L/2],[x0,y0,L/2],norm([(x0+x1)/2,(y0+y1)/2,0]));b.quad('hull',[x0,y0,L/2],[x1,y1,L/2],[x1,y1,-L/2],[x0,y0,-L/2],norm([-(x0+x1)/2,-(y0+y1)/2,0]));}
  for(const zz of[-L/2,-L/6,L/6,L/2]){const k=new B();k.ring('steel',0,0,zz,rad+.06,rad+.06,.05,.14,28);for(const[m,d]of k.groups){const g=b.groups.get(m)||[];for(let j=0;j<d.length;j+=6)if(d[j+1]>=-.01)g.push(d[j],d[j+1],d[j+2],d[j+3],d[j+4],d[j+5]);b.groups.set(m,g);}}
  {const back=new B();back.tube('hull',[0,0,L/2],[0,0,L/2+.06],rad,28,rad);for(const[m,d]of back.groups){const g=b.groups.get(m)||[];for(let j=0;j<d.length;j+=6)if(d[j+1]>=-.01)g.push(...d.slice(j,j+6));b.groups.set(m,g);}}
  b.box('gold',0,rad+.02,-L/2-.05,1.1,.18,.12);b.paw(0,rad-.55,-L/2-.08,.55,'gold');
  for(let i=0;i<9;i++){const a=.25+i/8*(Math.PI-.5);b.tube('frost',[Math.cos(a)*rad,Math.sin(a)*rad-.02,-L/2-.02],[Math.cos(a)*rad*.97,Math.sin(a)*rad-.45-(i%3)*.18,-L/2-.02],.07,5,.005);}
  bake(main,b,x,y,z,-.35);
  const d=new B();const k=new B();k.tube('frost',[0,0,-L/2+.08],[0,0,-L/2+.22],rad*.96,28,rad*.96);for(const[m,dd]of k.groups){const g=d.groups.get(m)||[];for(let j=0;j<dd.length;j+=6)if(dd[j+1]>=-.01)g.push(...dd.slice(j,j+6));d.groups.set(m,g);}
  for(let i=0;i<6;i++){const a=.6+i/5*(Math.PI-1.2);d.tube('iceHi',[Math.cos(a)*rad*.6,Math.sin(a)*rad*.7,-L/2+.02],[Math.cos(a)*rad*.2,Math.sin(a)*rad*.25,-L/2+.02],.05,5,.02);}bake(door,d,x,y,z,-.35);
  const pb=new B();pb.tube('steel',[0,0,0],[0,.55,0],.42,16,.32);pb.tube('gold',[0,.55,0],[0,.62,0],.4,16);bake(main,pb,DRIVE[0],G(r,DRIVE[0],DRIVE[1])-.05,DRIVE[1],0);
  const sb=new B();for(let i=0;i<3;i++){const k=new B();k.ring(i===1?'driveHi':'gold',0,0,0,.42-i*.06,.42-i*.06,.18,.08,28);for(const[m,dd]of k.groups){const g=sb.groups.get(m)||[];const a=i*Math.PI/3;for(let j=0;j<dd.length;j+=6){const px=dd[j],py=dd[j+1],pz=dd[j+2],c=Math.cos(a),s=Math.sin(a);g.push(px*c+pz*s,py,-px*s+pz*c,dd[j+3]*c+dd[j+5]*s,dd[j+4],-dd[j+3]*s+dd[j+5]*c);}sb.groups.set(m,g);}}
  sb.tube('drive',[0,-.2,0],[0,.2,0],.13,14,.13);bake(drive,sb,0,0,0,0);}
 // crates with glowing log tablets
 CRATES.forEach(([x,z,yaw],i)=>{const b=new B();b.box('crate',0,.28,0,.8,.56,.6);b.box('steel',0,.58,0,.84,.05,.64);b.box('drift',0,.64,0,.7,.08,.5);bake(detail,b,x,G(r,x,z)-.04,z,yaw);});
 for(const id of['log1','log2','log3']){const[x,z]=P[id],b=new B();b.tube('steel',[0,0,0],[0,.82,0],.05,8);b.box('steel',0,.9,0,.5,.36,.06);b.box('screen',0,.9,-.04,.42,.28,.02);b.tube('gold',[0,0,0],[0,.06,0],.24,12);bake(main,b,x,G(r,x,z)-.03,z,0);}
 // ice lanterns along the pass
 for(const[x,z]of PASS_LAMPS){const y=G(r,x,z)-.05,b=new B();b.tube('steel',[0,0,0],[0,1.6,0],.07,8,.05);b.tube('gold',[0,1.55,0],[0,1.66,0],.17,10);bake(detail,b,x,y,z,0);spire(main,x,y+1.62,z,.13,7400+Math.round(x*7+z),false);}
 const Lm={},add=(n,map)=>{Lm[n]=[];for(const[mat,data]of map){if(!data.length)continue;const key='v65_'+n+'_'+mat;r.addMesh(key,data);Lm[n].push([key,mat]);}};
 add('main',main);add('detail',detail);add('door',door);add('drive',drive);add('lamp',lamp);add('beacon',beacon);return{L:Lm};}
const on=s=>!!s&&Number(s.chapter)>=7;
(root.MoonRockZones=root.MoonRockZones||[]).push({ch:7,out:r=>Math.hypot(r.x-L0.x,r.z-L0.z)<=L0.ridge+L0.width*2.2+r.s*.6||(Math.abs(r.x-L0.x)<6+r.s*.6&&r.z>34&&r.z<L0.z)});
R.v65Build=function(){if(this.v65)return this.v65;this.ensureWorldModels&&this.ensureWorldModels();return this.v65=build(this);};
const glowOf=(mat,t)=>/Core$/.test(mat)?.95:mat==='ice'?.34+.06*Math.sin(t*1.3):mat==='iceHi'?.5+.12*Math.sin(t*1.9):mat==='screen'?.85+.1*Math.sin(t*3):mat==='drive'?.95:mat==='driveHi'?.9:mat==='gold'?.08:mat==='steel'||mat==='hull'?.04:mat==='snow'||mat==='drift'?.06:0;
R.scene=function(state,p,t,...args){const out=old.scene.call(this,state,p,t,...args);if(!on(state))return out;const eye=this.eye||[0,0,0],dL=Math.hypot(eye[0]-L0.x,eye[2]-L0.z);if(dL>DRAW_R)return out;
 const v=this.v65Build(),low=this.quality==='low',lit=!!state.auroraLit,grid=state.auroraGrid||Core.AURORA_START;
 const draw=name=>{for(const[key,mat]of v.L[name]||[]){const[kind,col]=MATS[mat];this.put(key,0,0,0,1,1,1,col,0,kind,Math.min(1,glowOf(mat,t)));}};
 draw('main');if(!low)draw('detail');if(!lit)draw('door');
 // nine lanterns: lit = warm gold, dark = frosted
 PANEL.forEach(([x,y],i)=>{const on1=lit||grid[i]===1;for(const[key,mat]of v.L.lamp||[]){const[kind,col]=MATS[mat];this.put(key,x,this.terrain(MAST[0],MAST[1],CH)+y,MAST[1]-.12,1,1,1,mat==='lampG'?(on1?col:[.42,.52,.62]):col,0,on1&&mat==='lampG'?12:kind===12?17:kind,on1&&mat==='lampG'?.95:.05);}});
 // the lander's beacon: blinks until the lanterns wake it, then burns steady
 {const[x,z]=LANDER,blink=lit?1:(Math.sin(t*3.4)>.55?1:.15);for(const[key,mat]of v.L.beacon||[])this.put(key,x+.75,this.terrain(x,z,CH)+3.25,z-.2,1,1,1,[1,.82,.38],0,12,blink);}
 if(!state.driveTaken){const[x,z]=DRIVE,hy=this.terrain(x,z,CH)+1.25+.1*Math.sin(t*1.8);for(const[key,mat]of v.L.drive||[]){const[kind,col]=MATS[mat];this.put(key,x,hy,z,1,1,1,col,t*.9,kind,lit?Math.min(1,glowOf(mat,t)):glowOf(mat,t)*.45);}}
 if(dL<80){const[nx,nz]=P.nav7;this.cat(nx+1.1,nz+.4,Math.atan2(-(L0.x-nx),-(L0.z-nz))+Math.PI,t,0,0,CH,[.45,.72,1]);}
 return out;};
// ---------- collisions ----------
// the hangar is solid; once the lanterns are lit the melted door opens a walk-in doorway toward the Sky Drive
const DOOR_A=Math.atan2(DRIVE[1]-HANGAR[1],DRIVE[0]-HANGAR[0]);
function inHangar(x,z,state){const dx=x-HANGAR[0],dz=z-HANGAR[1],r=Math.hypot(dx,dz);if(r>=HANGAR[2]+.35)return false;
 if(state&&state.auroraLit){let d=Math.atan2(dz,dx)-DOOR_A;d=Math.atan2(Math.sin(d),Math.cos(d));if(Math.abs(d)<.5&&r>1.25)return false;}return true;}
function inside7(x,z,state){const dx=x-L0.x,dz=z-L0.z,rr=Math.hypot(dx,dz);
 if(rr>L0.basin-.5&&Core.lostRidge(x,z)>1.45)return true;
 for(const[tx,tz,rad]of TENTS)if(Math.hypot(x-tx,z-tz)<rad+.15)return true;
 if(Math.hypot(x-LANDER[0],z-LANDER[1])<2.05)return true;
 if(Math.hypot(x-MAST[0],z-MAST[1])<.95)return true;if(Math.abs(x-MAST[0])<1.25&&Math.abs(z-MAST[1]+.05)<.32)return true;
 if(inHangar(x,z,state))return true;if(Math.hypot(x-DRIVE[0],z-DRIVE[1])<.55)return true;
 for(const[sx,sz,s]of INNER)if(Math.hypot(x-sx,z-sz)<.55*s+.25)return true;
 for(const[lx,lz]of PASS_LAMPS)if(Math.hypot(x-lx,z-lz)<.3)return true;
 for(const[cx,cz]of CRATES)if(Math.abs(x-cx)<.55&&Math.abs(z-cz)<.5)return true;
 if(Math.hypot(x-(LANDER[0]-3.2),z-(LANDER[1]+.8))<.25)return true;
 return false;}
// walking (alt < .9 above the ground) is blocked by the ridge slopes and the camp; flying over the ridge is free
R.blocked=function(x,z,state,alt=0){if(on(state)&&Math.hypot(x-L0.x,z-L0.z)<30){if(alt<.9&&inside7(x,z,state))return true;if(alt<2.4&&inHangar(x,z,state))return true;}return old.blocked.call(this,x,z,state,alt);};
// ---------- fx: aurora curtains, snowfall, lantern + beacon halos, drive glow ----------
R.render=function(state,p,t,dt,yaw,pitch,scan){old.render.call(this,state,p,t,dt,yaw,pitch,scan);if(!on(state)||!this.v65||!this.vp||!this.gl||!this.v50Prog||this._v65Off)return;
 try{const P5=this.v50Prog();if(!P5)return;const gl=this.gl,low=this.quality==='low',eye=this.eye||[0,0,0],Q=[],V=this.vp,rl=Math.hypot(V[0],V[8])||1,rx=V[0]/rl,rz=V[8]/rl;
  const dL=Math.hypot(eye[0]-L0.x,eye[2]-L0.z);if(dL>DRAW_R)return;
  const T=(x,z)=>this.terrain(x,z,CH),lit=!!state.auroraLit,grid=state.auroraGrid||Core.AURORA_START,pul=.85+.15*Math.sin(t*2);
  const bill=(x,y,z,sx,sy,k,c,w)=>{for(const[u,q]of[[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]])Q.push(x+rx*u*sx,y+q*sy,z+rz*u*sx,u,q,k,0,c[0],c[1],c[2],w);};
  const flat=(x,z,rad,c,w)=>{const N=3;for(let j=0;j<N;j++)for(let i=0;i<N;i++){const q=[[i,j],[i+1,j],[i+1,j+1],[i,j+1]].map(([a,b])=>{const u=a/N*2-1,v=b/N*2-1,px=x+u*rad,pz=z+v*rad;return[px,T(px,pz)+.07,pz,u,v];});for(const n of[0,1,2,0,2,3])Q.push(...q[n],4,0,c[0],c[1],c[2],w);}};
  // aurora: soft vertical curtains on an arc over the north of the camp (fixed in the world, waving)
  {const N=low?7:30,A=lit?1:.45;for(let i=0;i<N;i++){const f=i/(N-1),a=Math.PI*(.12+.76*f),rr=24+4*Math.sin(f*7+t*.15),x=L0.x+Math.cos(a)*rr*1.2,z=L0.z+6+Math.sin(a)*rr*.55,w=.5+.5*Math.sin(f*9+t*.6)*Math.sin(f*4-t*.35);
    const y=T(x,z)+19+3*Math.sin(f*5+t*.25),c=f<.5?[.25,1,.62]:f<.8?[.30,.95,.95]:[1,.45,.8];bill(x,y,z,low?3.8:2.0,low?7:8+3*w,0,c,(.08+.16*w)*A);if(!low)bill(x,y+7,z,1.6,4,0,[1,.5,.85],.06*w*A);}}
  // lanterns
  PANEL.forEach(([x,y],i)=>{const on1=lit||grid[i]===1,yy=T(MAST[0],MAST[1])+y;if(on1)bill(x,yy,MAST[1]-.3,.45,.45,0,[1,.82,.4],.65*pul);});
  {const yy=T(MAST[0],MAST[1]);bill(MAST[0],yy+8.95,MAST[1]+.25,lit?1.4:.5,lit?1.4:.5,0,[1,.85,.45],(lit?.9:.4)*pul);if(lit&&!low)bill(MAST[0],yy+14,MAST[1]+.25,.35,6,0,[1,.9,.6],.25*pul);flat(MAST[0],MAST[1]-.6,1.8,[.3,.22,.08],lit?.9:.4);}
  // beacon on the lander: blinking gold → steady with a beam
  {const[x,z]=LANDER,y=T(x,z)+3.4,blink=lit?1:(Math.sin(t*3.4)>.55?1:.12);bill(x+.75,y,z-.2,1.3,1.3,0,[1,.78,.3],.8*blink);if(lit)bill(x+.75,y+9,z-.2,.5,9,0,[1,.85,.45],.22*pul);}
  // sky drive
  if(!state.driveTaken){const[x,z]=DRIVE,hy=T(x,z)+1.25;bill(x,hy,z,1.2,1.2,0,[.4,1,.9],(lit?.8:.3)*pul);if(!low&&lit)for(let j=0;j<6;j++){const ph=t*1.6+j*1.05;bill(x+Math.cos(ph)*.7,hy+Math.sin(ph*1.4)*.35,z+Math.sin(ph)*.7,.12,.12,2,[.8,1,.95],Math.max(0,Math.sin(ph*2)));}}
  // pass lanterns, spires, screens
  for(const[x,z]of PASS_LAMPS){const y=T(x,z);bill(x,y+1.85,z,.7,.7,0,[.55,.95,1],.6);}
  if(!low)SPIRES.forEach(([x,z,s])=>{const y=T(x,z);bill(x,y+2.6*s,z,2.2*s,3*s,0,[.5,.9,1],.12*pul);});
  for(const id of['log1','log2','log3']){const[x,z]=P[id],got=(state.lostLogs||[]).includes(id);bill(x,T(x,z)+.92,z,.45,.35,0,got?[.5,1,.8]:[1,.72,.32],got?.3:.55*pul);}
  // snowfall around the eye (high tier) or a few flakes (medium)
  if(!low&&dL<45){const n=this.quality==='high'?70:24;for(let i=0;i<n;i++){const a=i*2.39996,rr=2+(i*53%140)/10,f=(t*.08+i*.0517)%1,x=eye[0]+Math.cos(a+t*.03)*rr,z=eye[2]+Math.sin(a+t*.03)*rr;bill(x+Math.sin(t*.7+i)*.3,T(x,z)+9-f*9,z,.06,.06,2,[1,1,1],Math.sin(f*Math.PI)*.75);}}
  if(!Q.length)return;const data=new Float32Array(Q);
  gl.useProgram(P5.p);gl.uniformMatrix4fv(P5.vp,false,this.vp);gl.uniform1f(P5.time,t);gl.bindBuffer(gl.ARRAY_BUFFER,P5.buf);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);
  gl.enable(gl.DEPTH_TEST);gl.depthMask(false);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  gl.enableVertexAttribArray(P5.pos);gl.vertexAttribPointer(P5.pos,3,gl.FLOAT,false,44,0);gl.enableVertexAttribArray(P5.info);gl.vertexAttribPointer(P5.info,4,gl.FLOAT,false,44,12);gl.enableVertexAttribArray(P5.tone);gl.vertexAttribPointer(P5.tone,4,gl.FLOAT,false,44,28);
  gl.drawArrays(gl.TRIANGLES,0,data.length/11);gl.disableVertexAttribArray(P5.pos);gl.disableVertexAttribArray(P5.info);gl.disableVertexAttribArray(P5.tone);
  gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(true);gl.disable(gl.BLEND);this.v65Stats={fxQuads:data.length/66|0};}catch(e){this._v65Off=true;if(typeof console!=='undefined')console.warn('v65 fx off',e);}};
root.MoonLostWorld={TENTS,LANDER,MAST,HANGAR,DRIVE,PANEL,PASS_LAMPS,SPIRES,INNER,CRATES,inside:inside7,snowAt};
})(typeof window!=='undefined'?window:globalThis);
