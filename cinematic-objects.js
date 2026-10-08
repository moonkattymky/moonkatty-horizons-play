/* Solid equipment/resources alongside fixed cinematic outpost meshes and existing collisions. */
(function(root){'use strict';
const R=root.MoonRenderer.prototype,atlas=root.MoonCinematicAtlas;
const solidKeys=new Set(['rocks','solar','antenna','powercell','crystals','metal','drone']);
const old={scene:R.scene,scenery:R.scenery,habitat:R.habitat,lander:R.lander,props:R.expeditionProps,companion:R.companion,cargo:R.supplyContainer,terminal:R.terminal,crystals:R.crystalDeposit,metal:R.metalDeposit,power:R.powerCell,antenna:R.scienceAntenna,solar:R.solarArray};
const VERT=`attribute vec3 position;attribute vec2 texcoord;attribute vec3 normal;uniform mat4 vp;uniform mat4 model;uniform vec3 dimensions;varying vec2 uv;varying vec3 world;varying vec3 local;varying vec3 surfaceNormal;void main(){uv=texcoord;local=position;surfaceNormal=normalize(normal/dimensions);world=(model*vec4(position,1.)).xyz;gl_Position=vp*vec4(world,1.);}`;
const FRAG=`precision mediump float;uniform sampler2D spriteMap;uniform vec4 frames[4];uniform sampler2D surfaceMap;uniform vec3 capColor;uniform float stone;uniform vec3 eye;varying vec2 uv;varying vec3 world;varying vec3 local;varying vec3 surfaceNormal;
vec4 sampleFrame(vec4 frame,vec2 p){vec4 c=texture2D(spriteMap,frame.xy+clamp(p,vec2(.002),vec2(.998))*frame.zw);c.a*=step(0.,p.x)*step(p.x,1.)*step(0.,p.y)*step(p.y,1.);return c;}
void main(){vec3 n=normalize(surfaceNormal);float y=.996-local.y;vec4 f=sampleFrame(frames[1],vec2(.5+local.x,y)),b=sampleFrame(frames[3],vec2(.5-local.x,y)),l=sampleFrame(frames[0],vec2(.5-local.z,y)),r=sampleFrame(frames[2],vec2(.5+local.z,y));float wf=pow(max(n.z,0.),6.)*f.a,wb=pow(max(-n.z,0.),6.)*b.a,wl=pow(max(n.x,0.),6.)*l.a,wr=pow(max(-n.x,0.),6.)*r.a;float total=wf+wb+wl+wr;vec3 color;if(total>.01)color=(f.rgb*wf+b.rgb*wb+l.rgb*wl+r.rgb*wr)/total;else color=capColor;vec2 tile=fract(world.xz*.14);vec3 cap=texture2D(surfaceMap,vec2(.02)+tile*.46).rgb;if(stone>1.5)cap=capColor*(.84+.16*max(n.y,0.));else if(stone>.5)cap=texture2D(surfaceMap,vec2(.02,.52)+tile*.46).rgb*.94;color=mix(color,cap,smoothstep(.20,.75,abs(n.y)));float fog=clamp((distance(eye,world)-28.)/180.,0.,.32);color*=.92+.08*max(n.y,0.);gl_FragColor=vec4(mix(color,vec3(.35,.42,.51),fog),1.);}`;
function viewIndex(angle,previous){const centers=[-Math.PI/4,Math.PI/4,-Math.PI*.75,Math.PI*.75];if(previous>=0&&previous<4){const delta=angle-centers[previous];if(Math.abs(Math.atan2(Math.sin(delta),Math.cos(delta)))<Math.PI/4+.14)return previous;}const a=Math.atan2(Math.sin(angle),Math.cos(angle));return Math.cos(a)>=0?(Math.sin(a)<0?0:1):(Math.sin(a)<0?2:3);}
R.initObjectArt=function(){
 if(this.objectArt)return this.objectArt;
 const gl=this.gl,maps=this.objectArt={};this.worldActors=[];
 const shader=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
 const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,VERT));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,FRAG));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
 this.objectShader={program,position:gl.getAttribLocation(program,'position'),uv:gl.getAttribLocation(program,'texcoord'),normal:gl.getAttribLocation(program,'normal'),dimensions:gl.getUniformLocation(program,'dimensions'),frames:gl.getUniformLocation(program,'frames[0]'),surface:gl.getUniformLocation(program,'surfaceMap'),capColor:gl.getUniformLocation(program,'capColor'),stone:gl.getUniformLocation(program,'stone'),model:gl.getUniformLocation(program,'model'),vp:gl.getUniformLocation(program,'vp'),eye:gl.getUniformLocation(program,'eye'),map:gl.getUniformLocation(program,'spriteMap'),buffer:gl.createBuffer()};
 for(const [key,meta]of Object.entries(atlas)){
  if(solidKeys.has(key))continue;
  const item=maps[key]={ready:false,failed:false,texture:gl.createTexture(),meta};if(typeof Image==='undefined')continue;
  const image=new Image();image.onload=()=>{try{let source=image;const maximum=gl.getParameter(gl.MAX_TEXTURE_SIZE),limit=Math.min(maximum>0?maximum:2048,2048);
   if(Math.max(image.width,image.height)>limit&&typeof document!=='undefined'){const canvas=document.createElement('canvas'),ratio=limit/Math.max(image.width,image.height);canvas.width=Math.round(image.width*ratio);canvas.height=Math.round(image.height*ratio);canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);source=canvas;}
   gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,item.texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);
   for(const k of[gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,k,gl.LINEAR);for(const k of[gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,k,gl.CLAMP_TO_EDGE);item.ready=true;
  }catch(e){item.failed=true;}};image.onerror=()=>{item.failed=true;};image.src=meta.image;item.image=image;
 }return maps;
};
R.artActor=function(key,x,y,z,height,options={}){const art=this.initObjectArt()[key];if(!art?.ready)return false;(this.worldActors||(this.worldActors=[])).push({key,x,y,z,height,...options});return true;};
R.scene=function(state,p,...args){this.initObjectArt();this.worldActors=[];const out=old.scene.call(this,state,p,...args);return out;};
R.habitat=function(x,z,ch){this.ensureWorldModels();if(!this.artActor(x===4?'station':'habitat',x,this.terrain(x,z,ch),z,x===4?7.15:2.5,{yaw:0,shadow:2.7}))return old.habitat.call(this,x,z,ch);};
R.lander=function(x,z,ch){this.ensureWorldModels();if(!this.artActor('rocket',x,this.terrain(x,z,ch),z,8.0,{yaw:0,shadow:2.45}))return old.lander.call(this,x,z,ch);};
R.expeditionProps=function(ch){if(!this.artActor('rover',4,this.terrain(4,4,ch),4,1.65,{yaw:0,shadow:1.20}))return old.props.call(this,ch);};
R.supplyContainer=function(x,z,ch){if(!this.artActor('cargo',x,this.terrain(x,z,ch),z,.94,{yaw:0,shadow:.47}))return old.cargo.call(this,x,z,ch);};
R.terminal=function(x,z,ch,color){if(!this.artActor('terminal',x,this.terrain(x,z,ch),z,1.80,{yaw:0,shadow:.40}))return old.terminal.call(this,x,z,ch,color);};
R.companion=function(x,y,z,p){return old.companion.call(this,p.x+1.8,y,p.z-1.2,p);};
R.crystalDeposit=old.crystals;
R.metalDeposit=old.metal;
R.powerCell=old.power;
R.scienceAntenna=old.antenna;
R.solarArray=old.solar;
R.scenery=old.scenery;
R.drawWorldSprites=function(vp,p,state){
 const gl=this.gl,s=this.objectShader;if(!s)return;this.objectSpriteFrames=[];this.objectViews=this.objectViews||new Map();
 const actors=this.worldActors.slice().sort((a,b)=>Math.hypot(b.x-this.eye[0],b.z-this.eye[2])-Math.hypot(a.x-this.eye[0],a.z-this.eye[2]));
 for(const actor of actors){if(actor.key!=='ridge'&&Math.hypot(actor.x-p.x,actor.z-p.z)>80)continue;const item=this.objectArt[actor.key],meta=item.meta,index=actor.view??(meta.directions?1:0),f=meta.views[index],height=actor.height,width=actor.width??height*f.w/f.h,camera=actor.yaw||0,co=Math.cos(camera),si=Math.sin(camera),depth=actor.depth??({station:4.8,habitat:2.8,rocket:2.8,antenna:1.8,solar:1.5,rover:1.4,cargo:.65,terminal:.48,powercell:.55,crystals:.9,metal:.46,arch:2.0,ridge:4,drone:.50}[actor.key]??width*.65),meshId=actor.key+'/'+index,source=root.MoonObjectVolumes[meshId];
  const center=[actor.x,actor.y+height*.5,actor.z],radius=Math.hypot(width,height,depth)*.5;let outside=false;for(const axis of[0,1,2])for(const sign of[-1,1]){const a=vp[3]+sign*vp[axis],b=vp[7]+sign*vp[axis+4],c=vp[11]+sign*vp[axis+8],d=vp[15]+sign*vp[axis+12];if(a*center[0]+b*center[1]+c*center[2]+d < -radius*Math.hypot(a,b,c))outside=true;}if(outside)continue;
  this.volumeMeshes=this.volumeMeshes||{};let mesh=this.volumeMeshes[meshId];if(!mesh){const raw=atob(source.vertices),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);const data=new Float32Array(bytes.buffer),buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);mesh=this.volumeMeshes[meshId]={buffer,data,count:source.count};}
  const frames=(meta.directions?meta.views:Array(4).fill(f)).flatMap(frame=>[frame.x/meta.imageWidth,frame.y/meta.imageHeight,frame.w/meta.imageWidth,frame.h/meta.imageHeight]);const model=new Float32Array([co*width,0,-si*width,0,0,height,0,0,si*depth,0,co*depth,0,actor.x,actor.y,actor.z,1]);
  if(actor.shadow&&this.initCharacterSprites){const shader=this.initCharacterSprites(),radius=actor.shadow,co=Math.cos(camera),si=Math.sin(camera),pt=(x,z,u,v)=>{const xx=actor.x+x*co+z*si,zz=actor.z-x*si+z*co;return[xx,this.terrain(xx,zz,state.chapter)+.022,zz,u,v];};
   const sa=pt(-radius,-radius*.60,0,0),sb=pt(-radius,radius*.60,0,1),sc=pt(radius,radius*.60,1,1),sd=pt(radius,-radius*.60,1,0),data=[...sa,...sb,...sc,...sa,...sc,...sd];
   gl.useProgram(shader.shadowProgram);gl.uniformMatrix4fv(shader.shadowVP,false,vp);gl.uniform1f(shader.shadowOpacity,.31);gl.bindBuffer(gl.ARRAY_BUFFER,shader.shadowBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.DYNAMIC_DRAW);gl.enable(gl.DEPTH_TEST);gl.depthMask(false);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.enableVertexAttribArray(shader.shadowPosition);gl.vertexAttribPointer(shader.shadowPosition,3,gl.FLOAT,false,20,0);gl.enableVertexAttribArray(shader.shadowUV);gl.vertexAttribPointer(shader.shadowUV,2,gl.FLOAT,false,20,12);gl.drawArrays(gl.TRIANGLES,0,6);gl.disableVertexAttribArray(shader.shadowPosition);gl.disableVertexAttribArray(shader.shadowUV);
   if(root.MoonExportCapture)actor.shadowVertices=data;
  }
  gl.useProgram(s.program);gl.uniformMatrix4fv(s.vp,false,vp);gl.uniformMatrix4fv(s.model,false,model);gl.uniform3fv(s.eye,this.eye);gl.uniform3fv(s.dimensions,[width,height,depth]);gl.uniform4fv(s.frames,frames);gl.uniform1i(s.surface,3);gl.uniform3fv(s.capColor,actor.key==='crystals'?[.18,.72,.92]:actor.key==='metal'?[.51,.43,.35]:[.84,.84,.80]);gl.uniform1f(s.stone,['rocks','ridge','arch'].includes(actor.key)?1:['crystals','metal'].includes(actor.key)?2:0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,item.texture);gl.uniform1i(s.map,0);gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);
  gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.enableVertexAttribArray(s.position);gl.vertexAttribPointer(s.position,3,gl.FLOAT,false,32,0);gl.enableVertexAttribArray(s.uv);gl.vertexAttribPointer(s.uv,2,gl.FLOAT,false,32,12);gl.enableVertexAttribArray(s.normal);gl.vertexAttribPointer(s.normal,3,gl.FLOAT,false,32,20);gl.drawArrays(gl.TRIANGLES,0,mesh.count);gl.disableVertexAttribArray(s.position);gl.disableVertexAttribArray(s.uv);gl.disableVertexAttribArray(s.normal);gl.disable(gl.BLEND);
  if(root.MoonExportCapture)this.objectSpriteFrames.push({key:actor.key,view:index,vertices:Array.from(mesh.data),model:Array.from(model),meshId,stride:8,dimensions:[width,height,depth],frames,capColor:actor.key==='crystals'?[.18,.72,.92]:actor.key==='metal'?[.51,.43,.35]:[.84,.84,.80],stone:['rocks','ridge','arch'].includes(actor.key)?1:['crystals','metal'].includes(actor.key)?2:0,image:meta.image,shaders:{VERT,FRAG,SHADOW:root.MoonCharacterSpriteMath.SHADOW},shadowVertices:actor.shadowVertices,opacity:.31,eye:this.eye});
 }gl.depthMask(true);gl.disable(gl.BLEND);
};
root.MoonCinematicMath={viewIndex,VERT,FRAG};
})(globalThis);
