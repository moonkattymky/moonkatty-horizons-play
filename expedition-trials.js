/* Authored jump and flight encounters, sharing collision footprints with MoonCore. */
(function(root){'use strict';
const R=root.MoonRenderer.prototype,Core=root.MoonCore,oldScene=R.scene,oldBlocked=R.blocked,oldModels=R.ensureWorldModels;
const GOLD=[.85,.63,.30],WHITE=[.87,.88,.85],DARK=[.075,.105,.12],CYAN=[.09,.62,.71];
R.ensureWorldModels=function(){oldModels.call(this);if(this.trialModelsReady)return;this.trialModelsReady=true;
 // Blend normals along authored rock edges while preserving the silhouettes.
 for(const name of['geology0','geology1','geology2','geology3','geologicalHorizon']){
  const mesh=this.meshes[name];if(!mesh)continue;const data=mesh.data.slice(),groups=new Map();
  for(let i=0;i<data.length;i+=6){const key=data.slice(i,i+3).map(v=>v.toFixed(4)).join('/');let group=groups.get(key);if(!group){group=[];groups.set(key,group);}group.push(i);}
  for(const group of groups.values())for(const i of group){const n=data.slice(i+3,i+6),sum=[0,0,0];for(const j of group){const m=mesh.data.slice(j+3,j+6);if(n.reduce((v,q,k)=>v+q*m[k],0)>.5)for(let k=0;k<3;k++)sum[k]+=m[k];}const len=Math.hypot(...sum)||1;for(let k=0;k<3;k++)data[i+3+k]=n[k]*.35+sum[k]/len*.65;}
  this.addMesh(name,data);
 }
 const f=Core.FIELD,band=[];
 for(let i=0;i<96;i++){const a=i*Math.PI/48,b=(i+1)*Math.PI/48,points=[[a,f.inner],[b,f.inner],[b,f.outer],[a,f.outer]].map(([angle,r])=>{const x=f.x+Math.sin(angle)*r,z=f.z+Math.cos(angle)*r;return[x,Core.height(x,z,2)+.16,z];});for(const k of[0,2,1,0,3,2])band.push(...points[k],0,1,0);}
 this.addMesh('riftBand',band);
};
R.blocked=function(x,z,state,alt=0){return !!Core.obstacleAt(state.chapter,x,z,alt)||oldBlocked.call(this,x,z,state,alt);};
function assemble(renderer,ch){
 const previous=renderer.queue;renderer.queue=[];const put=renderer.put.bind(renderer),h=(x,z)=>Core.height(x,z,ch);
 if(ch===1){for(const o of Core.BARRIERS){
  const horizontal=o.w>o.d,long=Math.max(o.w,o.d),count=Math.ceil(long/1.3),length=long/count;
  for(let i=0;i<count;i++){const offset=(i+.5)*length-long/2,x=o.x+(horizontal?offset:0),z=o.z+(horizontal?0:offset),y=h(x,z),w=horizontal?length:o.w,d=horizontal?o.d:length;
   put('round',x,y+o.h/2,z,w+.015,o.h,d+.015,o.h<1?[.48,.53,.53]:WHITE);put('round',x,y+o.h+.02,z,w,.055,d+.035,GOLD);
   put('round',x,y+o.h*.55,z,horizontal?.075:w+.02,o.h*.55,horizontal?d+.025:.075,GOLD);
   if(o.h>1)put('round',x,y+o.h*.57,z+(horizontal?d/2+.02:0),w*.44,.20,.035,DARK);
  }
 }
 // Landing arrows mark the jump enclosure, without hiding its low boundary.
 for(const z of[5.5,-5.5])for(const side of[-1,1])put('round',Core.POINTS.cell1[0]+side*.18,h(Core.POINTS.cell1[0],z)+.07,z,.08,.025,.55,CYAN,side*.6);
 }else{const f=Core.FIELD;put('riftBand',0,0,0,1,1,1,[.44,.42,.385],0,4);for(let i=0;i<22;i++){const angle=i*Math.PI/11,rr=f.outer+.11+Math.sin(i*4.7)*.34,x=f.x+Math.sin(angle)*rr,z=f.z+Math.cos(angle)*rr;put('geology1',x,h(x,z)+.17,z,.35+.11*(i%3),.36+.11*(i%2),.29+.14*(i%3),[.52,.51,.48],angle,4);}for(let i=0;i<16;i++){const angle=i*Math.PI/8,x=f.x+Math.sin(angle)*(f.outer+.3),z=f.z+Math.cos(angle)*(f.outer+.3),y=h(x,z);put('round',x,y+.23,z,.14,.45,.14,WHITE);put('round',x,y+.48,z,.16,.06,.16,GOLD);put('smooth',x,y+.52,z,.055,.035,.055,CYAN,0,12,.32);}
  put('ring',f.x,h(f.x,f.z)+.08,f.z,2.8,1,2.8,GOLD);
 }
 const objects=renderer.queue;renderer.queue=previous;const groups=new Map();
 for(const o of objects){const key=[...o.color,o.kind,o.glow].join('/');let g=groups.get(key);if(!g){g={data:[],color:o.color,kind:o.kind,glow:o.glow};groups.set(key,g);}const m=o.m,data=renderer.meshes[o.shape].data,sc=[0,4,8].map(i=>m[i]**2+m[i+1]**2+m[i+2]**2);
  for(let i=0;i<data.length;i+=6){const p=data.slice(i,i+3),n=[data[i+3]/sc[0],data[i+4]/sc[1],data[i+5]/sc[2]],normal=[m[0]*n[0]+m[4]*n[1]+m[8]*n[2],m[1]*n[0]+m[5]*n[1]+m[9]*n[2],m[2]*n[0]+m[6]*n[1]+m[10]*n[2]],len=Math.hypot(...normal)||1;g.data.push(m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14],...normal.map(v=>v/len));}
 }
 return [...groups.values()].map((g,i)=>{const shape='trial_'+ch+'_'+i;renderer.addMesh(shape,g.data);return{shape,...g};});
}
R.scene=function(state,...args){const out=oldScene.call(this,state,...args);this.trialAssemblies=this.trialAssemblies||{};const groups=this.trialAssemblies[state.chapter]||(this.trialAssemblies[state.chapter]=assemble(this,state.chapter));for(const g of groups)this.put(g.shape,0,0,0,1,1,1,g.color,0,g.kind,g.glow);return out;};
})(globalThis);
