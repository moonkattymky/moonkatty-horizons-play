(function(root){'use strict';
const RIDE={"image":"assets/moonkatty-ride-v63.webp?v=20261014-78a","imageWidth":865,"imageHeight":1099,"directions":{"up":{"x":0,"y":0,"w":385,"h":568,"anchorX":192.3,"anchorY":403.6,"bodyHeight":540.5,"hands":[[-0.791,0.448],[0.799,0.448]]},"left":{"x":391,"y":0,"w":461,"h":519,"anchorX":193.2,"anchorY":355.5,"bodyHeight":540.5,"hands":[[-0.722,0.504]]},"down":{"x":0,"y":574,"w":392,"h":514,"anchorX":196.2,"anchorY":356.1,"bodyHeight":540.5,"hands":[[-0.672,0.494],[0.695,0.494]]},"right":{"x":398,"y":574,"w":461,"h":519,"anchorX":267.8,"anchorY":355.5,"bodyHeight":540.5,"hands":[[0.722,0.504]]}}};
const atlas=root.MoonCharacterAtlas,R=root.MoonRenderer.prototype,originalCat=R.cat,originalScene=R.scene;
R.scene=function(...args){this.crewSprites=[];return originalScene.apply(this,args);};
const VERT=`attribute vec3 position;attribute vec2 texcoord;uniform mat4 vp;varying vec2 uv;varying vec3 W;void main(){uv=texcoord;W=position;gl_Position=vp*vec4(position,1.);}`;
const FRAG=`precision mediump float;uniform sampler2D spriteMap;uniform vec4 frameUV;uniform vec3 spriteRight;uniform vec3 eye;varying vec2 uv;varying vec3 W;void main(){vec4 c=texture2D(spriteMap,uv);if(c.a<.04)discard;vec2 q=(uv-frameUV.xy)/frameUV.zw*2.-1.;q.y=-q.y;vec3 front=vec3(-spriteRight.z,0.,spriteRight.x);vec3 n=normalize(spriteRight*q.x*.65+vec3(0.,q.y*.25,0.)+front*sqrt(max(.08,1.-q.x*q.x*.42-q.y*q.y*.12)));vec3 l=normalize(vec3(-.85,.48,-.45)),key=vec3(1.22,.98,.70);vec3 lit=pow(c.rgb,vec3(2.2));lit*=pow(max(dot(lit,vec3(.2126,.7152,.0722)),.04),-.12);vec3 fillDir=vec3(.66,.30,.69);lit*=vec3(.20,.24,.32)+vec3(.16,.22,.34)*max(dot(n,fillDir),0.)+key*max(dot(n,l),0.)*1.55;float sunSide=dot(l,spriteRight)>0.?1.:-1.;float edge=1.-texture2D(spriteMap,uv+frameUV.zw*vec2(sunSide*.018,-.008)).a;float edge2=1.-texture2D(spriteMap,uv+frameUV.zw*vec2(-sunSide*.012,-.004)).a;lit+=key*pow(c.rgb,vec3(1.4))*edge*(.55+.45*q.y*.5+.25)*.95+vec3(.10,.16,.28)*edge2*.18;float fog=1.-exp(-max(distance(eye,W)-15.,0.)*.021);lit=mix(lit,vec3(.060,.078,.118),fog*.80);lit*=1.18;lit=clamp((lit*(2.51*lit+.03))/(lit*(2.43*lit+.59)+.14),0.,1.);gl_FragColor=vec4(pow(lit,vec3(1./2.2)),c.a);}`;
const SHADOW=`precision mediump float;uniform float opacity;varying vec2 uv;void main(){float a=mix(-.62,2.35,uv.x),b=mix(-.62,.62,uv.y);float contact=exp(-(a*a+b*b)/.11);float sc=exp(-(pow(a-.95,2.)/.70+b*b/.10))*smoothstep(-.35,.25,a);float alpha=(contact*.90+sc*.85)*opacity*2.6;alpha=min(alpha,.88);if(alpha<.005)discard;gl_FragColor=vec4(.012,.016,.03,alpha);}`;
const CYCLES={down:[0,2,4,1,3,5],up:[0,2,3,5,1,4,1,4],left:[0,1,2,3,4,5],right:[0,1,2,3,4,5]};
// v77: billboards stay upright (cylindrical) for low cameras and lean back toward a high camera so the sprite plane faces the eye
// instead of collapsing to a sliver; feet stay pinned to the ground so the contact shadow still lines up.
function faceCam(eye,cx,cz,b){if(!eye)return v=>v;const dx=cx-eye[0],dz=cz-eye[2],dh=Math.hypot(dx,dz)||1e-3,el=Math.atan2(eye[1]-b,dh),th=Math.max(0,Math.min(1.25,el))*.8,cs=Math.cos(th),sn=Math.sin(th),ux=dx/dh,uz=dz/dh;
 return v=>{const h=v[1]-b;v[0]+=ux*h*sn;v[2]+=uz*h*sn;v[1]=b+h*cs;return v;};}
function directionFor(playerYaw,cameraYaw,previous){const a=playerYaw-cameraYaw,centers={up:0,down:Math.PI,left:Math.PI/2,right:-Math.PI/2};if(previous in centers){const d=a-centers[previous];if(Math.abs(Math.atan2(Math.sin(d),Math.cos(d)))<Math.PI/4+.12)return previous;}const c=Math.cos(a),s=Math.sin(a);return Math.abs(c)>=Math.abs(s)?(c>0?'up':'down'):(s>0?'left':'right');}
R.initCharacterSprites=function(){
 if(this.characterSprite)return this.characterSprite;
 const gl=this.gl,s={ready:false,idleReady:false,failed:false,time:0,direction:'up',frame:0,mode:'idle',directionTextures:{}};this.characterSprite=s;
 try{
  const shader=(type,source)=>{const sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh;};
  s.program=gl.createProgram();gl.attachShader(s.program,shader(gl.VERTEX_SHADER,VERT));gl.attachShader(s.program,shader(gl.FRAGMENT_SHADER,FRAG));gl.linkProgram(s.program);if(!gl.getProgramParameter(s.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(s.program));
  s.position=gl.getAttribLocation(s.program,'position');s.uv=gl.getAttribLocation(s.program,'texcoord');s.vp=gl.getUniformLocation(s.program,'vp');s.map=gl.getUniformLocation(s.program,'spriteMap');s.frameUV=gl.getUniformLocation(s.program,'frameUV');s.right=gl.getUniformLocation(s.program,'spriteRight');s.eye=gl.getUniformLocation(s.program,'eye');s.buffer=gl.createBuffer();s.texture=gl.createTexture();
  s.shadowProgram=gl.createProgram();gl.attachShader(s.shadowProgram,shader(gl.VERTEX_SHADER,VERT));gl.attachShader(s.shadowProgram,shader(gl.FRAGMENT_SHADER,SHADOW));gl.linkProgram(s.shadowProgram);if(!gl.getProgramParameter(s.shadowProgram,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(s.shadowProgram));s.shadowPosition=gl.getAttribLocation(s.shadowProgram,'position');s.shadowUV=gl.getAttribLocation(s.shadowProgram,'texcoord');s.shadowVP=gl.getUniformLocation(s.shadowProgram,'vp');s.shadowOpacity=gl.getUniformLocation(s.shadowProgram,'opacity');s.shadowBuffer=gl.createBuffer();s.idleTexture=gl.createTexture();
  if(typeof Image==='undefined')return s;
  const upload=(texture,image)=>{
   let source=image;const reported=gl.getParameter(gl.MAX_TEXTURE_SIZE),limit=Math.min(Number.isFinite(reported)&&reported>0?reported:1024,1024);
   if(image.width>limit&&typeof document!=='undefined'){const canvas=document.createElement('canvas');canvas.width=limit;canvas.height=Math.round(image.height*limit/image.width);const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,canvas.width,canvas.height);source=canvas;}
   gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);
   for(const key of[gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,key,gl.LINEAR);
   for(const key of[gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,key,gl.CLAMP_TO_EDGE);
  };
  s.upload=upload;const image=new Image();image.onload=()=>{try{upload(s.texture,image);s.ready=true;}catch(e){s.failed=true;}};image.onerror=()=>{s.failed=true;};image.src=atlas.image;s.image=image;
  const idle=new Image();idle.onload=()=>{try{upload(s.idleTexture,idle);s.idleReady=true;}catch(e){s.idleReady=false;}};idle.onerror=()=>{s.idleReady=false;};idle.src=atlas.idle.image;s.idleImage=idle;
  for(const [direction,row]of Object.entries(root.MoonCharacterWalkAtlas||{})){const item={texture:gl.createTexture(),ready:false};s.directionTextures[direction]=item;const frameImage=new Image();frameImage.onload=()=>{try{upload(item.texture,frameImage);item.ready=true;}catch(e){item.ready=false;}};frameImage.onerror=()=>{item.ready=false;};frameImage.src=row.image;item.image=frameImage;}
 }catch(e){s.failed=true;console.warn('MOONKATTY character sprite fallback:',e.message);}
 return s;
};
// v69: the 3D cat parts (sculpted-cat.js, ~0.8 MB) are only the fallback while the sprite sheets load, so they are fetched on demand
let sculptCatAsked=false;function loadSculptCat(r){if(sculptCatAsked||root.MoonSculptedCatReady||typeof document==='undefined')return;sculptCatAsked=true;setTimeout(()=>{let sp=null;try{sp=r.initCharacterSprites();}catch(e){}if(root.MoonSculptedCatReady||(sp&&sp.ready&&sp.idleReady)){sculptCatAsked=false;return;}const s=document.createElement('script');s.src='sculpted-cat.js?v=20261014-78a';s.async=true;document.head.appendChild(s);},8000);}
R.cat=function(x,z,yaw,t,moving,alt,ch,accent,hero,equipment){
 const sprite=this.initCharacterSprites();if(!sprite.ready||(!hero&&!sprite.idleReady)){loadSculptCat(this);return originalCat.call(this,x,z,yaw,t,moving,alt,ch,accent,hero,equipment);}
 if(!hero){const q=this._npcActor;(this.crewSprites||(this.crewSprites=[])).push({x,z,yaw,alt:(alt||0)+(q?q.hop:0),speed:q&&q.moving?1:0,lean:q?q.lean:0,t});return;}
 const ground=this.terrain(x,z,ch);
 if(alt>.15){const camera=Math.atan2(this.eye[0]-x,this.eye[2]-z);for(const side of[-1,1])this.put('cone',x+Math.cos(camera)*side*.20,ground+alt+.10,z-Math.sin(camera)*side*.20,.055,.38+Math.sin(t*35)*.04,.055,[.04,.7,1],0,0,1,Math.PI);}
};
R.drawCharacterShadow=function(vp,p,state,camera){
 const s=this.characterSprite,gl=this.gl,k=(.62+p.alt*.10)*(p.shadowScale||1),dx=.884,dz=.468;
 const point=(along,across,u,v)=>{const xx=p.x+dx*along*k-dz*across*k,zz=p.z+dz*along*k+dx*across*k;return[xx,this.terrain(xx,zz,state.chapter)+.075,zz,u,v];};
 const a=point(-.62,-.62,0,0),b=point(-.62,.62,0,1),c=point(2.35,.62,1,1),d=point(2.35,-.62,1,0);
 const shadowVertices=[...a,...b,...c,...a,...c,...d];if(root.MoonExportCapture)this.lastShadowVertices=shadowVertices;
 gl.useProgram(s.shadowProgram);gl.uniformMatrix4fv(s.shadowVP,false,vp);gl.uniform1f(s.shadowOpacity,.35/(1+p.alt*.55));gl.bindBuffer(gl.ARRAY_BUFFER,s.shadowBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(shadowVertices),gl.DYNAMIC_DRAW);
 gl.enable(gl.DEPTH_TEST);gl.depthMask(false);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.enableVertexAttribArray(s.shadowPosition);gl.vertexAttribPointer(s.shadowPosition,3,gl.FLOAT,false,20,0);gl.enableVertexAttribArray(s.shadowUV);gl.vertexAttribPointer(s.shadowUV,2,gl.FLOAT,false,20,12);gl.drawArrays(gl.TRIANGLES,0,6);gl.disableVertexAttribArray(s.shadowPosition);gl.disableVertexAttribArray(s.shadowUV);gl.depthMask(true);gl.disable(gl.BLEND);
};
R.drawCrewSprites=function(vp,state){
 const s=this.characterSprite,gl=this.gl;if(!s||!s.idleReady)return;
 if(root.MoonExportCapture)this.crewSpriteFrames=[];
 for(const actor of this.crewSprites||[]){const camera=Math.atan2(this.eye[0]-actor.x,this.eye[2]-actor.z),direction=directionFor(actor.yaw,camera),walkF=actor.speed>0&&s.ready,row=atlas.directions[direction],f=walkF?row.frames[CYCLES[direction][Math.floor((actor.t||0)*8)%CYCLES[direction].length]]:atlas.idle.directions[direction],scale=2.35/(walkF?row.referenceHeight:f.bodyHeight),right=[Math.cos(camera),-Math.sin(camera)],base=this.terrain(actor.x,actor.z,state.chapter)+actor.alt+.025,left=-f.anchorX*scale,bottom=(f.anchorY-f.h)*scale,top=f.anchorY*scale,width=f.w*scale;
 const fc=faceCam(this.eye,actor.x,actor.z,base),point=(x,y,u,v)=>fc([actor.x+right[0]*x,base+y,actor.z+right[1]*x,u,v]),IW=walkF?atlas.imageWidth:atlas.idle.imageWidth,IH=walkF?atlas.imageHeight:atlas.idle.imageHeight,u0=f.x/IW,u1=(f.x+f.w)/IW,v0=f.y/IH,v1=(f.y+f.h)/IH,ln=(actor.lean||0)*top;
 const a=point(left+ln,top,u0,v0),b=point(left,bottom,u0,v1),c=point(left+width,bottom,u1,v1),d=point(left+width+ln,top,u1,v0),vertices=[...a,...b,...c,...a,...c,...d];
 this.drawCharacterShadow(vp,actor,state,camera);
 if(root.MoonExportCapture)this.crewSpriteFrames.push({vertices,shadowVertices:this.lastShadowVertices,opacity:.35,frameUV:[u0,v0,u1-u0,v1-v0],spriteRight:[right[0],0,right[1]],shaders:root.MoonCharacterSpriteMath,image:atlas.idle.image});
 gl.useProgram(s.program);gl.uniformMatrix4fv(s.vp,false,vp);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,walkF?s.texture:s.idleTexture);gl.uniform1i(s.map,0);gl.uniform4f(s.frameUV,u0,v0,u1-u0,v1-v0);gl.uniform3fv(s.right,[right[0],0,right[1]]);gl.uniform3fv(s.eye,this.eye);gl.bindBuffer(gl.ARRAY_BUFFER,s.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.DYNAMIC_DRAW);
 gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.enableVertexAttribArray(s.position);gl.vertexAttribPointer(s.position,3,gl.FLOAT,false,20,0);gl.enableVertexAttribArray(s.uv);gl.vertexAttribPointer(s.uv,2,gl.FLOAT,false,20,12);gl.drawArrays(gl.TRIANGLES,0,6);gl.disableVertexAttribArray(s.position);gl.disableVertexAttribArray(s.uv);gl.disable(gl.BLEND);
 }
};

// v66 worker cat-astronauts: one 4-view turnaround per bot (assets/bot-cats-v66.webp: columns miner/mechanic/builder/courier, rows front/back/left/right),
// animated like a toy: step bob, waddle roll, squash on each footfall, a stride shear on side views; working = rhythmic lean with the tool.
const BOT_ATLAS={image:'assets/bot-cats-v66.webp?v=66',cols:{miner:0,mechanic:1,builder:2,courier:3},rows:{down:0,up:1,left:2,right:3},meta:{"miner":[[0.0166015625,0.002840909090909091,0.2158203125,0.24431818181818182,0.6424418604651163],[0.0283203125,0.2528409090909091,0.1923828125,0.24431818181818182,0.5726744186046512],[0.0263671875,0.5028409090909091,0.197265625,0.24431818181818182,0.5872093023255814],[0.0166015625,0.7528409090909091,0.2158203125,0.24431818181818182,0.6424418604651163]],"mechanic":[[0.296875,0.002840909090909091,0.1552734375,0.24431818181818182,0.4622093023255814],[0.2919921875,0.2528409090909091,0.166015625,0.24431818181818182,0.4941860465116279],[0.2763671875,0.5028409090909091,0.197265625,0.24431818181818182,0.5872093023255814],[0.2822265625,0.7528409090909091,0.1845703125,0.24431818181818182,0.5494186046511628]],"builder":[[0.5380859375,0.002840909090909091,0.173828125,0.24431818181818182,0.5174418604651163],[0.5419921875,0.2528409090909091,0.1650390625,0.24431818181818182,0.49127906976744184],[0.5234375,0.5028409090909091,0.2021484375,0.24431818181818182,0.6017441860465116],[0.5302734375,0.7528409090909091,0.189453125,0.24431818181818182,0.563953488372093]],"courier":[[0.7978515625,0.002840909090909091,0.1533203125,0.24431818181818182,0.4563953488372093],[0.79296875,0.2528409090909091,0.1640625,0.24431818181818182,0.4883720930232558],[0.771484375,0.5028409090909091,0.2060546875,0.24431818181818182,0.6133720930232558],[0.7724609375,0.7528409090909091,0.205078125,0.24431818181818182,0.6104651162790697]]}};
const BOT_H=1.92;
R.drawBotSprites=function(vp,state,t){const s=this.characterSprite,gl=this.gl,HP=root.MoonHomePlot;if(!s||!HP||!HP.H||!this.v59Poses)return;
 if(!s.bots){s.bots={texture:gl.createTexture(),ready:false};if(typeof Image==='undefined')return;const im=new Image();im.onload=()=>{try{s.upload(s.bots.texture,im);s.bots.ready=true;}catch(e){s.bots.failed=true;}};im.src=BOT_ATLAS.image;}
 if(!s.bots.ready)return;const H=HP.H,ch=state.chapter||1;let poses;try{poses=this.v59Poses(t);}catch(e){return;}
 const eye=this.eye;if(Math.hypot(eye[0]-H.x,eye[2]-H.z)>95)return;
 for(let i=0;i<poses.length;i++){const q=poses[i],b=q.b,col=BOT_ATLAS.cols[b.prof];if(col==null||q.hide)continue;const x=H.x+q.x,z=H.z+q.z;
  const camera=Math.atan2(eye[0]-x,eye[2]-z),dir=directionFor(q.yaw,camera),m=BOT_ATLAS.meta[b.prof][BOT_ATLAS.rows[dir]],side=dir==='left'||dir==='right';
  const ph=i*1.37,mv=!!q.moving,step=t*(mv?7.5:0)+ph,fall=Math.abs(Math.sin(step));
  let bob=mv?fall*.07:0,roll=mv?Math.sin(step)*.07:0,squash=mv?1-(1-fall)*.05:1,lean=0,shear=side&&mv?Math.sin(step*2)*.05:0;
  if(q.work){const w=q.swing||0;lean=w*.10;bob+=Math.max(0,-w)*.03;squash*=1-Math.max(0,-w)*.04;roll=Math.sin(t*2+ph)*.03;}
  if(q.hop)bob+=q.hop;if(q.sit){squash*=.9;}
  if(!mv&&!q.work){bob+=Math.sin(t*2.2+ph)*.012;roll=Math.sin(t*1.3+ph)*.025;}
  const sc=b.source==='stars'?1.06:1,hgt=BOT_H*sc*squash,wid=BOT_H*sc*m[4]*(2-squash),right=[Math.cos(camera),-Math.sin(camera)],base=this.terrain(x,z,ch)+.02+(q.dy||0)+bob;
  const u0=m[0],v0=m[1],u1=m[0]+m[2],v1=m[1]+m[3],cr=Math.cos(roll),sr=Math.sin(roll),fw=side?(dir==='left'?-1:1):0;
  const fc=faceCam(eye,x,z,base),pt=(px,py,u,v)=>{const sx=px+py*(lean*fw+shear),rx=sx*cr-py*sr,ry=sx*sr+py*cr;return fc([x+right[0]*rx,base+ry,z+right[1]*rx,u,v]);};
  const A=pt(-wid/2,hgt,u0,v0),Bq=pt(-wid/2,0,u0,v1),C=pt(wid/2,0,u1,v1),D=pt(wid/2,hgt,u1,v0),V=[...A,...Bq,...C,...A,...C,...D];
  try{this.drawCharacterShadow(vp,{x,z,alt:bob+(q.dy||0),yaw:q.yaw},state,camera);}catch(e){}
  gl.useProgram(s.program);gl.uniformMatrix4fv(s.vp,false,vp);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,s.bots.texture);gl.uniform1i(s.map,0);gl.uniform4f(s.frameUV,u0,v0,u1-u0,v1-v0);gl.uniform3fv(s.right,[right[0],0,right[1]]);gl.uniform3fv(s.eye,eye);gl.bindBuffer(gl.ARRAY_BUFFER,s.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(V),gl.DYNAMIC_DRAW);
  gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.enableVertexAttribArray(s.position);gl.vertexAttribPointer(s.position,3,gl.FLOAT,false,20,0);gl.enableVertexAttribArray(s.uv);gl.vertexAttribPointer(s.uv,2,gl.FLOAT,false,20,12);gl.drawArrays(gl.TRIANGLES,0,6);gl.disableVertexAttribArray(s.position);gl.disableVertexAttribArray(s.uv);gl.disable(gl.BLEND);}
 this.v66Bots=poses.length;};
const TILT_K=1;
R.drawCharacterSprites=function(vp,p,state,t,dt){
 const rideB=root.MoonBike&&root.MoonBike.on&&root.MoonBike.on(p)&&root.MoonBike.seat?root.MoonBike.seat:null;/* v61: seated on the hover-bike: no walk cycle, legs cut away inside the seat */
 const s=this.characterSprite;if(!s||!s.ready)return;this.drawCrewSprites(vp,state);try{this.drawBotSprites(vp,state,t||0);}catch(e){}
 const camera=Math.atan2(this.eye[0]-p.x,this.eye[2]-p.z),direction=directionFor(p.yaw,camera,s.direction);
 s.direction=direction;
 // v63: newly drawn seated riding frames (assets/moonkatty-ride-v63.webp): legs tucked, paws forward on the grips, hip on the seat
 if(rideB&&RIDE){if(!s.ride){s.ride={texture:this.gl.createTexture(),ready:false};const im=new Image();im.onload=()=>{try{s.upload(s.ride.texture,im);s.ride.ready=true;}catch(e){s.ride.failed=true;}};im.src=RIDE.image;s.ride.image=im;}
  if(s.ride.ready){const f=RIDE.directions[direction],scale=2.35/f.bodyHeight,right=[Math.cos(camera),-Math.sin(camera)],base=rideB.y,IW=RIDE.imageWidth,IH=RIDE.imageHeight;
   const left=-f.anchorX*scale,bottom=(f.anchorY-f.h)*scale,top=f.anchorY*scale,width=f.w*scale,ln=0,bob=Math.sin((t||0)*3.1)*.004;
   const fx=p.x+Math.sin(camera)*.45,fz=p.z+Math.cos(camera)*.45;/* drawn on the camera side of the bike so the near leg and the paws sit over the hull and grips */
   const fc=faceCam(this.eye,fx,fz,base),point=(x,y,u,v)=>fc([fx+right[0]*x,base+y+bob,fz+right[1]*x,u,v]),u0=f.x/IW,u1=(f.x+f.w)/IW,v0=f.y/IH,v1=(f.y+f.h)/IH;
   const tl=root.MoonBike&&root.MoonBike.tilt||0,tc=Math.cos(tl*TILT_K),ts=Math.sin(tl*TILT_K),PY=-.29,rot=(x,y,u,v)=>tl?point(x*tc-(y-PY)*ts,PY+x*ts+(y-PY)*tc,u,v):point(x,y,u,v);/* v65: in the sky the rider banks and barrel-rolls with the bike (rotation in the sprite plane around the hull centre) */
   const a=rot(left+ln,top,u0,v0),b=rot(left,bottom,u0,v1),c=rot(left+width,bottom,u1,v1),d=rot(left+width+ln,top,u1,v0);this.spriteLight={frameUV:[u0,v0,u1-u0,v1-v0],spriteRight:[right[0],0,right[1]]};s.mode='ride';
   this.drawCharacterShadow(vp,p,state,camera);const gl=this.gl;gl.useProgram(s.program);gl.uniformMatrix4fv(s.vp,false,vp);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,s.ride.texture);gl.uniform1i(s.map,0);gl.uniform4f(s.frameUV,u0,v0,u1-u0,v1-v0);gl.uniform3fv(s.right,[right[0],0,right[1]]);gl.uniform3fv(s.eye,this.eye);gl.bindBuffer(gl.ARRAY_BUFFER,s.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([...a,...b,...c,...a,...c,...d]),gl.DYNAMIC_DRAW);
   gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.enableVertexAttribArray(s.position);gl.vertexAttribPointer(s.position,3,gl.FLOAT,false,20,0);gl.enableVertexAttribArray(s.uv);gl.vertexAttribPointer(s.uv,2,gl.FLOAT,false,20,12);gl.drawArrays(gl.TRIANGLES,0,6);gl.disableVertexAttribArray(s.position);gl.disableVertexAttribArray(s.uv);gl.disable(gl.BLEND);return;}}
 const walking=!rideB&&p.speed>.08&&p.alt<.15;
 s.time=walking?s.time+Math.min(dt,.2)*Math.min(p.speed,1):0;
 const detailed=s.directionTextures[direction]?.ready,row=detailed?root.MoonCharacterWalkAtlas[direction]:atlas.directions[direction],cycle=detailed?[0,1,2,3,4,5]:CYCLES[direction],useIdle=!walking&&s.idleReady;
 s.frame=walking?cycle[Math.floor(s.time*cycle.length)%cycle.length]:0;s.mode=useIdle?'idle':'walk';
 const f=useIdle?atlas.idle.directions[direction]:row.frames[s.frame],scale=2.35/(useIdle?f.bodyHeight:row.referenceHeight),right=[Math.cos(camera),-Math.sin(camera)],base=this.terrain(p.x,p.z,state.chapter)+p.alt+.025;
 const left=-f.anchorX*scale,bottom=(f.anchorY-f.h)*scale,top=f.anchorY*scale,width=f.w*scale;
 const point=(x,y,u,v)=>[p.x+right[0]*x,base+y,p.z+right[1]*x,u,v];
 const source=useIdle?atlas.idle:detailed?row:atlas; s.currentImage=source.image; const u0=f.x/source.imageWidth,u1=(f.x+f.w)/source.imageWidth,v0=f.y/source.imageHeight,v1=(f.y+f.h)/source.imageHeight;
 let bot=bottom,vb=v1,dy=0;if(rideB){const cut=rideB.cut;bot=bottom+(top-bottom)*cut;vb=v1-(v1-v0)*cut;dy=rideB.y-(base+bot);}
 const fc=faceCam(this.eye,p.x,p.z,base+dy),P2=(x,y,u,v)=>{const q=point(x,y,u,v);q[1]+=dy;return fc(q);};const a=P2(left,top,u0,v0),b=P2(left,bot,u0,vb),c=P2(left+width,bot,u1,vb),d=P2(left+width,top,u1,v0);this.spriteLight={frameUV:[u0,v0,u1-u0,v1-v0],spriteRight:[right[0],0,right[1]]};
 this.drawCharacterShadow(vp,p,state,camera);
 const gl=this.gl;gl.useProgram(s.program);gl.uniformMatrix4fv(s.vp,false,vp);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,useIdle?s.idleTexture:detailed?s.directionTextures[direction].texture:s.texture);gl.uniform1i(s.map,0);gl.uniform4f(s.frameUV,u0,v0,u1-u0,v1-v0);gl.uniform3fv(s.right,[right[0],0,right[1]]);gl.uniform3fv(s.eye,this.eye);gl.bindBuffer(gl.ARRAY_BUFFER,s.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([...a,...b,...c,...a,...c,...d]),gl.DYNAMIC_DRAW);
 gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
 gl.enableVertexAttribArray(s.position);gl.vertexAttribPointer(s.position,3,gl.FLOAT,false,20,0);gl.enableVertexAttribArray(s.uv);gl.vertexAttribPointer(s.uv,2,gl.FLOAT,false,20,12);gl.drawArrays(gl.TRIANGLES,0,6);gl.disableVertexAttribArray(s.position);gl.disableVertexAttribArray(s.uv);gl.disable(gl.BLEND);
};
root.MoonCharacterSpriteMath={faceCam,directionFor,VERT,FRAG,SHADOW,CYCLES};
})(globalThis);
