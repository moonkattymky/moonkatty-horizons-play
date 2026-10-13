/* v59 living crew: the Engineer, the Navigator and the Scout no longer stand like statues.
   Each runs a small daily routine on the local clock around its quest point (never farther than ~2.3 m, so talking and
   quests work exactly as before): the Engineer repairs the terminal and carries supply crates, the Navigator patrols
   with a scanner and checks the sky, the Scout mines a crystal rock and carries crystals to a pile. When the player
   comes close they stop, turn to the player, hop and wave. Props are a handful of primitives; low tier skips sparks. */
(function(root){'use strict';
const R=root.MoonRenderer&&root.MoonRenderer.prototype;if(!R)return;
const C={white:[1,1,1],steel:[.72,.78,.86],wood:[.86,.6,.34],crate:[.92,.66,.36],gold:[1,.78,.3],teal:[.3,1,.95],rock:[.62,.58,.68],cry:[1,.6,.25],cryV:[.72,.45,1],dark:[.1,.1,.14],cyan:[.35,.95,1],glove:[.95,.95,.98]};
const face=(dx,dz)=>Math.atan2(-dx,-dz),lerp=(a,b,f)=>a+(b-a)*f,ease=f=>f*f*(3-2*f);
// routine = list of steps {d:duration, at:[lx,lz] | from/to, act:'repair'|'carry'|'mine'|'scan'|'look'|'walk', look:[lx,lz]}
const ROUTINES={
 engineer:[{d:7,at:[-.35,.75],act:'repair',look:[-1,0]},{d:2.6,from:[-.35,.75],to:[1.7,1.2],act:'walk'},{d:1.4,at:[1.7,1.2],act:'lift',look:[2.4,1.6]},{d:2.6,from:[1.7,1.2],to:[-.2,.9],act:'carry'},{d:1.2,at:[-.2,.9],act:'drop',look:[-1,0]},{d:4,at:[.4,.4],act:'look',look:[0,-3]}],
 navigator:[{d:3,from:[0,0],to:[1.6,.8],act:'walk'},{d:4.5,at:[1.6,.8],act:'scan',look:[2,-2]},{d:3,from:[1.6,.8],to:[-1.4,1],act:'walk'},{d:4.5,at:[-1.4,1],act:'scan',look:[-2,-1]},{d:2.5,from:[-1.4,1],to:[0,0],act:'walk'},{d:3,at:[0,0],act:'look',look:[0,-4]}],
 scout:[{d:7,at:[1.15,-.35],act:'mine',look:[1.9,-.9]},{d:2.4,from:[1.15,-.35],to:[-1,.6],act:'carry'},{d:1.2,at:[-1,.6],act:'drop',look:[-1.6,1.1]},{d:2.4,from:[-1,.6],to:[1.15,-.35],act:'walk'},{d:3,at:[.2,.2],act:'look',look:[0,-4]}]};
const ROCK={scout:[1.9,-.9]},PILE={scout:[-1.6,1.1],engineer:[2.4,1.6]};
function routine(id,t){const R0=ROUTINES[id];const total=R0.reduce((a,s)=>a+s.d,0),ph={engineer:0,navigator:5,scout:11}[id]||0;let k=(t+ph)%total;for(const s of R0){if(k<s.d)return{s,f:k/s.d,k};k-=s.d;}return{s:R0[0],f:0,k:0};}
// pose in world space; p = player
function pose(id,hx,hz,t,p){if(!ROUTINES[id])return null;const{s,f,k}=routine(id,t);let lx,lz,yaw,moving=false;
 if(s.from){const e=ease(f);lx=lerp(s.from[0],s.to[0],e);lz=lerp(s.from[1],s.to[1],e);yaw=face(s.to[0]-s.from[0],s.to[1]-s.from[1]);moving=true;}
 else{lx=s.at[0];lz=s.at[1];const L=s.look||[0,-3];yaw=face(L[0]-lx,L[1]-lz)+(s.act==='look'?Math.sin(t*.8)*.6:0);}
 const x=hx+lx,z=hz+lz,q={id,x,z,yaw,moving,act:s.act,f,k,carry:s.act==='carry'||(s.act==='drop'&&f<.5)||(s.act==='lift'&&f>.5),lean:0,hop:0,wave:false};
 if(p){const dx=p.x-x,dz=p.z-z,d=Math.hypot(dx,dz);if(d<5.2){q.yaw=face(dx,dz);q.moving=false;q.wave=d>1.2;q.act='greet';q.carry=false;q.hop=Math.max(0,Math.sin(t*5.5))*.07;q.lean=Math.sin(t*5.5)*.04;return q;}}
 if(s.act==='repair'||s.act==='mine')q.lean=Math.sin(t*(s.act==='mine'?5:7))*.09;
 if(s.act==='scan')q.lean=Math.sin(t*1.3)*.05;if(s.act==='look')q.hop=Math.max(0,Math.sin(t*2.2))*.02;
 return q;}
// static work props + moving props (crate, crystal, tool), sparks (not on low tier)
function props(r,id,hx,hz,q,t,ch,low){const T=(x,z)=>r.terrain(x,z,ch),put=(sh,x,y,z,sx,sy,sz,c,yaw=0,kind=0,glow=0,pitch=0,roll=0)=>r.put(sh,x,y,z,sx,sy,sz,c,yaw,kind,glow,pitch,roll);
 if(ROCK[id]){const[x,z]=[hx+ROCK[id][0],hz+ROCK[id][1]],y=T(x,z);put('sphere',x,y+.2,z,.55,.42,.5,C.rock);put('cone',x+.1,y+.5,z,.12,.45,.12,C.cry,0,12,.7,.2,.1);put('cone',x-.2,y+.4,z+.15,.09,.32,.09,C.cryV,0,12,.7,-.2,.3);}
 if(PILE[id]){const[x,z]=[hx+PILE[id][0],hz+PILE[id][1]],y=T(x,z);if(id==='scout'){for(let i=0;i<4;i++)put('cone',x+Math.cos(i*1.6)*.18,y+.15,z+Math.sin(i*1.6)*.18,.08,.28,.08,i%2?C.cryV:C.cry,0,12,.6,Math.cos(i)*.4,Math.sin(i)*.4);}
  else{put('cube',x,y+.22,z,.44,.44,.44,C.crate);put('cube',x+.05,y+.62,z+.04,.36,.36,.36,C.crate,.4);put('cube',x,y+.22,z-.225,.46,.06,.02,C.gold);}}
 const c=Math.cos(q.yaw),s=Math.sin(q.yaw),fx=-s,fz=-c,y=T(q.x,q.z)+q.hop;   // forward of the cat
 if(q.carry){const cx=q.x+fx*.42,cz=q.z+fz*.42,bob=q.moving?Math.abs(Math.sin(t*9))*.04:0;if(id==='scout')put('cone',cx,y+1.05+bob,cz,.12,.36,.12,C.cry,q.yaw,12,.8);else{put('cube',cx,y+1.0+bob,cz,.42,.36,.36,C.crate,q.yaw);put('cube',cx+fx*.18,y+1.0+bob,cz+fz*.18,.44,.05,.02,C.gold,q.yaw);}}
 const side=[c,-s];   // the cat's right
 if(q.act==='repair'||q.act==='mine'){const sw=Math.sin(t*(q.act==='mine'?5:7)),hx2=q.x+fx*.45+side[0]*.32,hz2=q.z+fz*.45+side[1]*.32,hy=y+1.15+sw*.12;
  if(q.act==='mine'){put('cylinder',hx2,hy,hz2,.035,.32,.035,C.wood,q.yaw,0,0,-.9+sw*.7);put('cube',hx2+fx*.1,hy+.28,hz2+fz*.1,.42,.06,.06,C.steel,q.yaw,0,0,-.9+sw*.7);}
  else{put('cylinder',hx2,hy,hz2,.035,.24,.035,C.steel,q.yaw,0,0,-1.1+sw*.5);put('torus',hx2+fx*.12,hy+.2,hz2+fz*.12,.09,.4,.09,C.steel,q.yaw);}
  if(!low&&sw<-.6)for(let i=0;i<4;i++){const a=t*20+i*1.7;put('cube',hx2+fx*.3+Math.cos(a)*.15,hy-.1+Math.abs(Math.sin(a))*.25,hz2+fz*.3+Math.sin(a)*.15,.035,.035,.035,q.act==='mine'?C.cry:C.cyan,0,12,1);}}
 if(q.act==='scan'){const tx=q.x+fx*.4+side[0]*.18,tz=q.z+fz*.4+side[1]*.18;put('cube',tx,y+1.2,tz,.26,.18,.03,C.dark,q.yaw,0,0,-.5);put('cube',tx+fx*.02,y+1.2,tz+fz*.02,.22,.14,.01,C.cyan,q.yaw,12,.8,-.5);
  if(!low){const f=(t*.8)%1;put('torus',tx,y+1.4+f*.8,tz,.12+f*.5,.2,.12+f*.5,C.cyan,0,12,(1-f)*.6);}}
 if(q.wave){const k=Math.sin(t*9),ax=q.x+side[0]*.48+fx*.05,az=q.z+side[1]*.48+fz*.05;put('sphere',ax+side[0]*.12*k*.3,y+1.72,az+side[1]*.12*k*.3,.12,.3,.12,C.white,q.yaw,0,0,0,-.5+k*.45);put('sphere',ax+side[0]*(.2+k*.08),y+2.02,az+side[1]*(.2+k*.08),.11,.11,.11,C.glove,q.yaw);}}
root.MoonNpcLife={pose,props,ROUTINES,routine};
})(typeof window!=='undefined'?window:globalThis);
