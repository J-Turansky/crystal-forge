import {addPixelHoleCuts} from './studio-pixel-builder.js';
import {generateTile,tactileTileGenerator} from './tactile-tile-generator.js';
import {createGeneratorRegistry} from './studio-generator-registry.js';
import {circle,heightField} from './studio-geometry.js';
const numeric=(key,label,value,min,max,unit='mm',step=.5)=>({key,label,type:'number',default:value,min,max,step,unit});
const choice=(key,label,value,options)=>({key,label,type:'select',default:value,options});
const boolean=(key,label,value=false)=>({key,label,type:'boolean',default:value});
const common=[numeric('seed','Repeatable seed',42,0,2147483647,'',1),boolean('dualMaterial','Two material regions')];
const lightingWarning='Optical diffusion, heat, LED fit and printed roof support require physical checks.';
const box=(size,position=[0,size[1]/2,0])=>({kind:'box',size,position});
const cylinder=(radius,height,position=[0,height/2,0])=>({kind:'cylinder',radius,height,position});
const sphere=(radii,position=[0,radii[1],0])=>({kind:'sphere',radii,position});
const extrusion=(outline,height,position=[0,0,0],holes=[])=>({kind:'extrude',outline,height,position,holes});
function define(typeId,displayName,category,schema,presets,recipe,capabilities={}){
 const parameterSchema=[...schema,...common],defaultParameters=Object.fromEntries(parameterSchema.map(p=>[p.key,p.default]));
 const generator={typeId,typeVersion:1,displayName,category,parameterSchema,defaultParameters,
  presets:presets.map(([id,name,parameters])=>({id,name,parameters:{...defaultParameters,...parameters}})),
  capabilities:{supportsBase:true,supportsMounting:true,supportsLEDs:false,supportsTactileSurfaces:false,supportsMechanisms:false,supportsDualMaterial:true,supportsPartSplitting:false,...capabilities},
  validateParameters(input){const p={...defaultParameters,...input},errors=[];
   for(const s of parameterSchema){const v=p[s.key];if(s.type==='number'&&(!Number.isFinite(v)||v<s.min||v>s.max))errors.push(s.label+' must be '+s.min+'–'+s.max+' '+s.unit+'.');if(s.type==='select'&&!s.options.includes(v))errors.push('Choose a supported '+s.label+'.');if(s.type==='boolean'&&typeof v!=='boolean')errors.push(s.label+' must be on or off.');}
   if(!Number.isInteger(p.seed))errors.push('Seed must be a whole number.');
   return {valid:!errors.length,errors,parameters:p};},
  recipe(input){const c=this.validateParameters(input);if(!c.valid)throw Error(c.errors.join(' '));return {...recipe(c.parameters),dualMaterial:c.parameters.dualMaterial};},
  generatePreview(input){return this.recipe(input);},generateManufacturingGeometry(input){return this.recipe(input);},
  estimateBounds(input){return this.recipe(input).bounds;},
  migrateParameters(version,data){if(version!==1)throw Error('Generator migration required.');return {...data};}
 };return generator;
}
export function gearOutline(p){
 const n=Math.round(p.teeth),alpha=p.pressureAngle*Math.PI/180,m=p.mode==='Mechanical'?p.module:p.diameter/(n+2);
 const pitch=m*n/2,base=pitch*Math.cos(alpha),outer=m*(n+2)/2,root=Math.max(m,pitch-1.25*m),half=Math.PI/(2*n),inv=a=>Math.tan(a)-a;
 const flank=r=>half+inv(alpha)-(r>base?inv(Math.acos(base/r)):0);
 const points=[];
 for(let i=0;i<n;i++){
  const centre=i*Math.PI*2/n;
  const polar=(r,a)=>points.push([r*Math.cos(a),r*Math.sin(a)]);
  const start=centre-Math.PI/n,end=centre+Math.PI/n;
  polar(root,start);polar(root,centre-flank(Math.max(base,root)));
  for(let j=0;j<=6;j++){const r=Math.max(root,base)+(outer-Math.max(root,base))*j/6;polar(r,centre-flank(r));}
  for(let j=1;j<=4;j++)polar(outer,centre-flank(outer)+2*flank(outer)*j/4);
  for(let j=5;j>=0;j--){const r=Math.max(root,base)+(outer-Math.max(root,base))*j/6;polar(r,centre+flank(r));}
  polar(root,centre+flank(Math.max(root,base)));polar(root,end);
 }
 // Consecutive root vertices are shared between neighbouring teeth.
 return points.filter((v,i)=>i===0||Math.hypot(v[0]-points[i-1][0],v[1]-points[i-1][1])>1e-7).filter((v,i,arr)=>i!==arr.length-1||Math.hypot(v[0]-arr[0][0],v[1]-arr[0][1])>1e-7);
}
export const gearGenerator=define('gears','Cogs & Gears','Mechanical',[
 choice('mode','Purpose','Decorative',['Decorative','Mechanical']),numeric('teeth','Tooth count',20,8,80,'',1),numeric('diameter','Decorative outer diameter',80,25,180),numeric('thickness','Body thickness',8,3,25),numeric('module','Mechanical module',3,1,5),numeric('pressureAngle','Pressure angle',20,14.5,30,'degrees'),numeric('bore','Measured shaft bore',8,0,30),numeric('hub','Hub diameter',20,10,45),numeric('spokes','Spoke cutouts',0,0,8,'',1),choice('wheelStyle','Decorative rim','Involute',['Involute','Rounded lobes','Angular teeth','Cam','Pulley']),numeric('toothDepth','Decorative tooth depth',20,5,30,'%',1),choice('holeStyle','Spoke window shape','Round',['Round','Oval','Diamond']),numeric('extraHoles','Extra fixing holes',0,0,6,'',1),choice('inlayStyle','Colour region','Face',['Face','Hub ring'])
],[['weather','Weather wheel',{}],['tactile','Large tactile cog',{teeth:12,diameter:100,thickness:10}],['pulley','Grooved pulley',{wheelStyle:'Pulley',spokes:5}],['flower','Rounded flower cog',{wheelStyle:'Rounded lobes',teeth:9,spokes:5,holeStyle:'Oval'}],['cam','Eccentric cam',{wheelStyle:'Cam',inlayStyle:'Hub ring'}],['mechanical','Module 2 mechanical',{mode:'Mechanical',teeth:24,module:2,bore:6}]],p=>{
 const diameter=p.mode==='Mechanical'?(Math.round(p.teeth)+2)*p.module:p.diameter;
 const radiusOuter=diameter/2;
 const decorative=p.mode!=='Mechanical';
 const outline=!decorative||p.wheelStyle==='Involute'?gearOutline(p):circle(radiusOuter,Math.max(120,Math.round(p.teeth)*12)).map(([x,z])=>{
  const angle=Math.atan2(z,x),wave=(1+Math.cos(angle*Math.round(p.teeth)))/2;
  const shape=p.wheelStyle==='Rounded lobes'?wave:p.wheelStyle==='Angular teeth'?Math.pow(wave,.35):1;
  const scale=p.wheelStyle==='Cam'?.79+.21*Math.cos(angle):1-(1-shape)*p.toothDepth/100;
  return [x*scale,z*scale];
 });
 if(p.bore>=Math.min(p.hub,diameter*.45))throw Error('Bore must leave at least a hub wall.');
 if(p.mode==='Mechanical'&&p.teeth<Math.ceil(2/Math.sin(p.pressureAngle*Math.PI/180)**2))throw Error('This tooth count risks involute undercut. Increase teeth or pressure angle.');
 const holes=p.bore? [circle(p.bore/2)]:[];
 const count=Math.round(p.spokes),radius=diameter*.24,holeRadius=Math.min(diameter*.065,Math.max(1,(diameter*.4-p.hub/2)/2));
 if(count&&radius-holeRadius>Math.max(p.hub/2,p.bore/2+2))for(let i=0;i<count;i++){
  const angle=i/count*Math.PI*2,cx=Math.cos(angle)*radius,cz=Math.sin(angle)*radius;
  const form=decorative?p.holeStyle:'Round';
  holes.push(circle(holeRadius,form==='Diamond'?4:32).map(([x,z])=>{
   const radial=x,side=form==='Oval'?z*.55:z;
   return [cx+radial*Math.cos(angle)-side*Math.sin(angle),cz+radial*Math.sin(angle)+side*Math.cos(angle)];
  }));
 }
 const extra=decorative?Math.round(p.extraHoles):0;
 for(let i=0;i<extra;i++){
  const angle=i/extra*Math.PI*2,candidate=circle(1.4,24,Math.cos(angle)*radiusOuter*.58,Math.sin(angle)*radiusOuter*.58);
  if(holes.some(h=>h.some(a=>candidate.some(b=>Math.hypot(a[0]-b[0],a[1]-b[1])<1.6))))throw Error('Extra fixing holes are too close to the bore or spoke windows.');
  if(p.wheelStyle==='Cam')throw Error('Choose a concentric rim for evenly spaced extra fixing holes.');
  holes.push(candidate);
 }
 const positive=[extrusion(outline,p.thickness,[0,0,0],holes)];
 if(decorative&&p.wheelStyle==='Pulley'){
  const inset=outline.map(([x,z])=>[x*.78,z*.78]),lip=Math.min(2,p.thickness*.28);
  positive.splice(0,1,extrusion(outline,lip,[0,0,0],holes),extrusion(inset,p.thickness-2*lip,[0,lip,0],holes),extrusion(outline,lip,[0,p.thickness-lip,0],holes));
 }
 const hubRadius=Math.min(radiusOuter*.27,p.hub/2);
 const inlay=decorative&&p.inlayStyle==='Hub ring';
 if(inlay&&p.bore/2>=hubRadius-1.5)throw Error('The hub ring needs more space around the bore.');
 const secondary=[extrusion(inlay?circle(hubRadius):outline,.8,[0,p.thickness-.8,0],inlay?(p.bore?[circle(p.bore/2)]:[circle(hubRadius*.55)]):holes)];
 return {positive,secondary,negative:[],bounds:{width:diameter,depth:diameter,height:p.thickness},warnings:['Pinch points and moving parts require guarding and physical checks. Mechanical meshing still requires a mating-gear test.']};
},{supportsMechanisms:true});
export const waveGenerator=define('waves','Waves & Organic Forms','Organic',[
 numeric('width','Length',110,30,200),numeric('depth','Width',65,20,160),numeric('thickness','Minimum base thickness',4,2,15),numeric('amplitude','Wave height',12,1,40),numeric('frequency','Wave count',2,0.5,6,'',.1),numeric('phase','Phase',0,0,360,'degrees'),numeric('direction','Direction',0,0,360,'degrees'),numeric('variation','Organic variation',.25,0,1,'',.05)
],[['river','Flowing river',{}],['wind','Wind surface',{frequency:1,amplitude:20,direction:30}],['ripples','Soft overlapping ripples',{frequency:4,amplitude:6,variation:.6}]],p=>{
 const a=p.direction*Math.PI/180,phase=p.phase*Math.PI/180;
 const top=(x,z)=>p.thickness+p.amplitude*(1+Math.sin((x*Math.cos(a)+z*Math.sin(a))/p.width*p.frequency*Math.PI*2+phase+Math.sin(z/p.depth*Math.PI*2+p.seed*.01)*p.variation))/2;
 const mesh=heightField(p.width,p.depth,top);
 return {positive:[{kind:'mesh',mesh}],secondary:[box([p.width,.8,p.depth],[0,.4,0])],negative:[],bounds:{width:p.width,depth:p.depth,height:p.thickness+p.amplitude},warnings:['Review the wave slopes in Cura; the flat underside is the intended bed face.']};
});
function raisedControlSymbol(symbol,width,surface,offset=0){
 const h=2.4,y=surface, size=width*.34;
 const block=(x,z)=>box([size*x,h,size*z],[0,y,offset]);
 const disc=(radius,x=0,z=0)=>cylinder(size*radius,h,[size*x,y,size*z+offset]);
 const polygon=points=>extrusion(points.map(([x,z])=>[size*x,size*z]),h,[0,y-h/2,offset]);
 switch(symbol){
  case 'Plus': return [block(1,.25),block(.25,1)];
  case 'Minus': return [block(1,.25)];
  case 'Dot': return [disc(.28)];
  case 'Pointer': return [polygon([[0,-.56],[.48,.35],[-.48,.35]])];
  case 'River wave': return [polygon([[-.54,.02],[-.28,-.24],[0,-.24],[.28,.02],[.54,-.1],[.54,.16],[.28,.28],[0,.02],[-.28,.02],[-.54,.28]])];
  case 'Mine crystal': return [polygon([[0,-.6],[.34,-.23],[.31,.29],[0,.55],[-.31,.29],[-.34,-.23]])];
  case 'Weather cloud': return [disc(.25,-.30,.08),disc(.34,0,-.08),disc(.26,.30,.08)];
  case 'Sun': return [disc(.3),block(1,.18),block(.18,1)];
  case 'Lightning': return [polygon([[-.10,-.55],[.34,-.55],[.07,-.10],[.40,-.10],[-.25,.58],[-.08,.11],[-.37,.11]])];
  case 'Goat hoof': return [disc(.27,-.20,-.12),disc(.27,.20,-.12),block(.50,.70)];
  default: return [];
 }
}

function roundedSquare(radius,rounding){
 if(!rounding)return [[-radius,-radius],[radius,-radius],[radius,radius],[-radius,radius]];
 return Array.from({length:4},(_,corner)=>{
  const angle=corner*Math.PI/2;
  const x=Math.cos(angle+Math.PI/4)*Math.SQRT2*(radius-rounding);
  const z=Math.sin(angle+Math.PI/4)*Math.SQRT2*(radius-rounding);
  return Array.from({length:9},(_,step)=>{
   const a=angle+step*Math.PI/16;
   return [x+rounding*Math.cos(a),z+rounding*Math.sin(a)];
  });
 }).flat();
}

function panelControlRecipe(p){
 const w=p.diameter,d=p.depth,h=p.height,r=w/2;
 const oval=(scale=1)=>circle(r*scale).map(([x,z])=>[x,z*d/w]);
 const gripOutline=()=>Array.from({length:192},(_,i)=>{
  const angle=i*Math.PI/96;
  const grip=p.gripProfile==='Smooth'?1:1-p.gripDepth/100*(1-Math.cos(angle*Math.round(p.gripCount)))/2;
  return [r*grip*Math.cos(angle),r*grip*Math.sin(angle)];
 });
 const shape=p.controlStyle;
 const negative=[],positive=[],secondary=[];
 let width=w,depth=d,top=h;
 if(shape==='Rotary knob'||shape==='Rotary selector'){
  depth=w;
  positive.push(extrusion(gripOutline(),h));
  if(shape==='Rotary selector'){
   positive.push(box([w*.26,h*.36,w*.8],[0,h*1.12,-w*.06]));
   top=h*1.3;
  }
  if(shape==='Rotary knob'){
   secondary.push(...raisedControlSymbol(p.symbol,w,h));
   if(secondary.length)top=h+1.2;
  }
  if(shape==='Rotary selector'){
   secondary.push(...raisedControlSymbol(p.symbol,w*.42,top,-w*.06));
   if(secondary.length)top+=1.2;
  }
 }else if(shape==='Toggle lever'||shape==='Thumb joystick'){
  const stem=Math.min(w,d)*.22,base=h*.28;
  const angle=shape==='Toggle lever'?p.leverAngle*Math.PI/180:0;
  const length=h*.82,tip=[Math.sin(angle)*length,base+Math.cos(angle)*length,0];
  positive.push(extrusion(oval(),base));
  positive.push({...cylinder(stem,length+1),rotation:[0,0,-angle],position:[tip[0]/2,base+Math.cos(angle)*length/2-.45,0]});
  const radius=shape==='Thumb joystick'?stem*1.8:stem*1.15;
  positive.push(sphere([radius,h*.21,radius],tip));
  width=Math.max(w,2*(Math.abs(tip[0])+radius));
  top=tip[1]+h*.21;
 }else if(shape==='Rocker'||shape==='Fader cap'){
  const corners=[[-r,-d*.33],[-w*.34,-d/2],[w*.34,-d/2],[r,-d*.33],[r,d*.33],[w*.34,d/2],[-w*.34,d/2],[-r,d*.33]];
  positive.push(extrusion(corners,h*.72));
  if(shape==='Rocker'){
   positive.push({...box([w*.72,h*.32,d*.73],[0,h*.73,0]),rotation:[p.leverAngle*Math.PI/180,0,0]});
   top=h+Math.sin(p.leverAngle*Math.PI/180)*d*.365;
  }else{
   positive.push(box([w*.8,h*.28,d*.74],[0,h*.8,0]));
   negative.push(box([w*.72,h*.12,d*.10],[0,h*.94,0]));
  }
 }else if(shape==='Directional pad'){
  positive.push(extrusion(oval(),h*.54),box([w*.84,h*.55,d*.3],[0,h*.71,0]),box([w*.3,h*.55,d*.84],[0,h*.71,0]));
 }else{
  positive.push(extrusion(oval(),h*.6),sphere([w*.36,h*.44,d*.36],[0,h*.55,0]));
 }
 const socket=p.shaft+p.tolerance;
 if(p.shaft){
  const socketRoof=['Toggle lever','Thumb joystick'].includes(shape)?h*.28:h*.54;
  if(p.socketDepth>socketRoof-1||socket>Math.min(width,depth)-4)throw Error('Reduce the socket diameter or depth, or increase the control size to leave a solid wall.');
  negative.push(p.socketProfile==='Rectangular'
   ?box([socket,p.socketDepth+.2,socket*.55],[0,(p.socketDepth-.2)/2,0])
   :cylinder(socket/2,p.socketDepth+.2,[0,(p.socketDepth-.2)/2,0]));
 }
 const band=Math.min(2,h*.16);
 return {positive,negative,secondary,materialBand:secondary.length?undefined:box([width+2,band,depth+2]),
  bounds:{width,depth,height:top},warnings:['Printed control shell. Measure the actual hardware and check fit and movement with a physical sample.']};
}

export const capGenerator=define('control-caps','Buttons & Control Caps','Controls',[
 choice('controlStyle','Control family','Pushbutton',['Pushbutton','Rotary knob','Rotary selector','Toggle lever','Rocker','Fader cap','Thumb joystick','Directional pad','Indicator lens']),
 choice('gripProfile','Rotary grip','Fluted',['Smooth','Fluted']),numeric('gripCount','Rotary grip count',16,4,32,'',1),numeric('gripDepth','Rotary grip depth',10,2,25,'%',1),
 numeric('leverAngle','Lever or rocker angle',15,0,32,'degrees',1),choice('socketProfile','Socket profile','Round',['Round','Rectangular']),
 choice('outline','Cap profile','Round',['Round','Square','Oval']),choice('top','Top shape','Domed',['Flat','Domed','Concave','Stepped']),numeric('diameter','Cap width',40,20,100),numeric('depth','Oval depth',30,20,100),numeric('height','Overall height',14,6,35),numeric('shaft','Measured switch shaft diameter',6,0,20),numeric('socketDepth','Socket depth',7,2,20),numeric('tolerance','Diametral fit clearance',.25,0,1,'mm',.05),numeric('cornerRound','Square corner radius',0,0,10),choice('symbol','Raised symbol','Plus',['None','Plus','Minus','Dot','Pointer','Goat hoof','River wave','Mine crystal','Weather cloud','Sun','Lightning'])
],[['weather','Weather control',{}],['arcade','Arcade cover',{diameter:55,height:16,shaft:12}],['plain','Non-electronic tactile cap',{shaft:0,symbol:'Dot',top:'Flat'}],
 ['knob','Fluted dial',{controlStyle:'Rotary knob',height:19,socketDepth:6}],
 ['selector','Rotary selector',{controlStyle:'Rotary selector',gripProfile:'Smooth',symbol:'Pointer',height:18,socketDepth:6}],
 ['toggle','Angled toggle',{controlStyle:'Toggle lever',height:24,socketDepth:4}],
 ['rocker','Panel rocker',{controlStyle:'Rocker',height:18,socketDepth:4}],
 ['fader','Mixer fader cap',{controlStyle:'Fader cap',height:14,socketDepth:4,socketProfile:'Rectangular'}],
 ['joystick','Thumb joystick',{controlStyle:'Thumb joystick',height:30,socketDepth:5}],
 ['pad','Four-way directional pad',{controlStyle:'Directional pad',height:15,socketDepth:4}],
 ['indicator','Pilot-light lens',{controlStyle:'Indicator lens',shaft:0,height:12}]],p=>{
 if(p.controlStyle!=='Pushbutton')return panelControlRecipe(p);
 const d=p.outline==='Oval'?p.depth:p.diameter,r=p.diameter/2;
 if(p.socketDepth>p.height-2&&p.shaft>0)throw Error('Socket must leave a 2 mm minimum top wall.');
 if(p.shaft+p.tolerance>Math.min(p.diameter,d)-6)throw Error('Socket leaves too little side wall.');
 const outline=p.outline==='Square'?roundedSquare(r,Math.min(p.cornerRound,r-.1)):circle(r).map(([x,z])=>[x,z*d/p.diameter]);
 const positive=[extrusion(outline,p.height)],secondary=[];
 if(p.top==='Domed')positive.push(sphere([r,p.height*.3,d/2],[0,p.height*.8,0]));
 if(p.top==='Stepped')positive.push(cylinder(r*.72,2,[0,p.height+1,0]));
 const negative=p.shaft?[cylinder((p.shaft+p.tolerance)/2,p.socketDepth+.1,[0,p.socketDepth/2-.05,0])]:[];
 if(p.top==='Concave')negative.push(sphere([r*.8,r*.65,r*.8],[0,p.height+r*.57,0]));
 const y=p.top==='Domed'?p.height*1.1:p.top==='Stepped'?p.height+2:p.top==='Concave'?p.height-r*.08:p.height;
 secondary.push(...raisedControlSymbol(p.symbol,Math.min(p.diameter,d),y));
 const materialBand=secondary.length?undefined:box([p.diameter+2,1,d+2]);
 return {positive,secondary,negative,materialBand,bounds:{width:p.diameter,depth:d,height:p.height*1.15+2},warnings:['Adapter dimensions are nominal: measure the real switch, print a fit coupon and test operation. This is a cap, not a printed click mechanism.']};
},{supportsMechanisms:true});
export const pebbleGenerator=define('light-pods','Glowing Pebbles & Light Pods','Lighting',[
 numeric('width','Width',70,30,150),numeric('depth','Depth',55,25,140),numeric('height','Height',35,18,90),numeric('wall','Wall thickness',2.4,1.2,8,'mm',.2),numeric('facets','Circumference facets',32,12,64,'',4),boolean('illuminated','Accessible illumination cavity',true),numeric('opening','Underside access diameter',24,12,55),numeric('cable','Cable exit diameter',5,3,10)
],[['river','River pebble',{}],['mineral','Faceted mineral pod',{facets:12,width:60,depth:50,height:45}],['solid','Solid tactile pebble',{illuminated:false,width:55,height:28}]],p=>{
 const radii=[p.width/2,p.height/2,p.depth/2],centre=[0,p.height*.43,0];
 if(p.wall>=Math.min(...radii)-3)throw Error('Wall thickness leaves no usable inner volume.');
 if(p.illuminated&&p.opening>Math.min(p.width,p.depth)-p.wall*2-2)throw Error('Access opening leaves too little wall.');
 const outer={...sphere(radii,centre),segments:Math.round(p.facets)};
 const negative=[box([p.width+2,p.height,p.depth+2],[0,-p.height/2,0])];
 if(p.illuminated){negative.push(sphere(radii.map(r=>r-p.wall),centre),cylinder(p.opening/2,p.height/2,[0,p.height/4-1,0]),{...cylinder(p.cable/2,p.depth),rotation:[Math.PI/2,0,0],position:[0,p.cable/2,p.depth/2]});}
 const bandHeight=Math.max(3,p.wall,p.illuminated?p.cable+.5:0);
 return {positive:[outer],secondary:[],negative,
  materialBand:box([p.width+2,bandHeight,p.depth+2]),bounds:{width:p.width,depth:p.depth,height:p.height*.93},warnings:p.illuminated?[lightingWarning,'Inspect access opening, cable exit and curved roof in Cura.']:['Non-illuminated solid variant.']};
},{supportsLEDs:true});
// Characters lie flat as extruded, connected silhouettes with broad features.
export const characterGenerator=define('characters','Characters & Silhouettes','Characters',[
 choice('character','Character','Goat',['Goat','Sheep','Cloud','Boat','Sun','Pickaxe']),numeric('width','Silhouette width',90,35,160),numeric('height','Silhouette height',65,25,140),numeric('depth','Relief depth',8,3,20),numeric('head','Head proportion',1,.65,1.3,'',.05),numeric('legs','Leg length',1,.5,1.3,'',.05)
],[['goat','Goat Farm goat',{}],['sheep','Woolly sheep',{character:'Sheep'}],['cloud','Weather cloud',{character:'Cloud'}],['boat','River boat',{character:'Boat'}],['sun','Weather sunshine',{character:'Sun'}],['mine','Mining pickaxe',{character:'Pickaxe'}]],p=>{
 const w=p.width,h=p.height,t=p.depth,positive=[],secondary=[];
 const ellipse=(rx,rz,x,z,depth=t,y=0)=>extrusion(circle(1,48).map(([a,b])=>[a*rx+x,b*rz+z]),depth,[0,y,0]);
 if(p.character==='Goat'||p.character==='Sheep'){
  positive.push(ellipse(w*.33,h*.25,-w*.08,0),ellipse(w*.16*p.head,h*.19*p.head,w*.29,-h*.16));
  for(const x of [-w*.25,w*.05])positive.push(box([w*.12,t,h*.36*p.legs],[x,t/2,h*.23]));
  if(p.character==='Goat')for(const x of [w*.22,w*.36])positive.push(extrusion([[x-w*.035,-h*.23],[x+w*.045,-h*.23],[x+w*.015,-h*.43]],t));
  else for(let i=0;i<6;i++)positive.push(ellipse(w*.11,h*.12,-w*.33+i*w*.105,-h*.15));
  secondary.push(ellipse(w*.035,h*.035,w*.34,-h*.20,1.2,t-.3));
 }else if(p.character==='Cloud'){
  positive.push(box([w*.65,t,h*.36],[0,t/2,h*.13]));for(const [x,z,r]of[[-.28,0,.20],[0,-.15,.28],[.28,0,.20]])positive.push(ellipse(w*r,h*r,x*w,z*h));
  secondary.push(ellipse(w*.12,h*.10,0,-h*.15,1.2,t-.3));
 }else if(p.character==='Boat'){
  positive.push(extrusion([[-w*.48,h*.08],[w*.48,h*.08],[w*.30,h*.34],[-w*.30,h*.34]],t),box([w*.06,t,h*.65],[0,t/2,-h*.05]));
  secondary.push(extrusion([[w*.02,-h*.4],[w*.38,h*.04],[w*.02,h*.04]],t));
 }else if(p.character==='Sun'){
  positive.push(ellipse(w*.30,h*.30,0,0));for(let i=0;i<8;i++){const a=i/8*Math.PI*2;positive.push(ellipse(w*.10,h*.10,Math.cos(a)*w*.30,Math.sin(a)*h*.30));}
  secondary.push(ellipse(w*.17,h*.17,0,0,1.2,t-.3));
 }else{
  positive.push(box([w*.12,t,h*.8],[0,t/2,h*.05]),extrusion([[-w*.47,-h*.25],[0,-h*.42],[w*.47,-h*.25],[w*.4,-h*.12],[0,-h*.26],[-w*.4,-h*.12]],t));
  secondary.push(box([w*.12,1.2,h*.3],[0,t+.3,h*.18]));
 }
 return {positive,secondary,negative:[],bounds:{width:w,depth:h,height:t+1.2},warnings:['Broad joined features reduce fragility; inspect printed horns, ears, legs and edges before participant use.']};
});
export const tileGenerator={...tactileTileGenerator,parameterSchema:tactileTileGenerator.parameterSchema.map(s=>({...s,label:s.label||s.key.replace(/[A-Z]/g,c=>' '+c.toLowerCase()),step:s.key==='seed'?1:s.key==='randomness'?.05:.5})),
 recipe(input){const r=generateTile(input);return {positive:[{kind:'mesh',mesh:r.bodies[0].mesh}],partitioned:r.parameters.dualMaterial,secondary:r.bodies.length===2?[{kind:'mesh',mesh:r.bodies[1].mesh}]:[],negative:[],dualMaterial:r.parameters.dualMaterial,bounds:this.estimateBounds(input),warnings:['Tactile feel, cleanability and edge comfort require a printed sample.']};}};
export const generators=[tileGenerator,gearGenerator,waveGenerator,capGenerator,characterGenerator,pebbleGenerator];
export function makeCatalogue(crystalAdapter){const registry=createGeneratorRegistry();for(const g of [crystalAdapter,...generators].filter(Boolean))registry.register(g);return registry;}
export function applyBuildModules(recipe,build={},capabilities={}){
 const r={...recipe,positive:[...recipe.positive],negative:[...(recipe.negative||[])],secondary:[...(recipe.secondary||[])],warnings:[...(recipe.warnings||[])]};
 // The same recipe reaches both preview and the fabrication worker.
 if(!r.partitioned){
  for(const role of ['positive','secondary']){
   r[role]=r[role].map((part,index)=>{
    if(part.kind==='mesh')return part;
    const partId=role+'-'+index+'-'+part.kind;
    const offset=build.partOffsets?.[partId];
    const position=part.position||[0,0,0];
    if(!offset)return {...part,partId};
    if(!Array.isArray(offset)||offset.length!==3||!offset.every(value=>Number.isFinite(value)&&Math.abs(value)<=50)||offset[1]<0)throw Error('Part offsets must be within 50 mm. Lift a part above its original position.');
    return {...part,partId,position:position.map((value,axis)=>value+offset[axis])};
   });
  }
 }
 const b=r.bounds;
 if(build.mounting&&capabilities.supportsMounting){
  const spacing=Math.min(build.spacing||b.width*.55,b.width*.65),diameter=build.holeDiameter||3.4;
  if(diameter<2||diameter>8||spacing<diameter*3)throw Error('Mounting hole spacing or diameter is unsafe.');
  const style=build.mountStyle||'Through holes';
  for(const x of [-spacing/2,spacing/2]){
   r.negative.push(cylinder(diameter/2,b.height+4,[x,b.height/2,0]));
   if(style==='Underside counterbores')r.negative.push(cylinder(diameter*.75,1.6,[x,.6,0]));
   if(style==='Underside countersinks'){
    r.negative.push({...cylinder(diameter*.75,1.6,[x,.6,0]),topRadius:diameter/2});
   }
  }
  r.warnings.push('Through mounting holes are un-rated; test actual mounting loads.');
 }
 if(build.base&&capabilities.supportsBase){const thickness=Number(build.baseThickness||3);if(thickness<2||thickness>15)throw Error('Base thickness must be 2–15 mm.');r.positive.push(box([b.width+6,thickness,b.depth+6]));r.bounds={...b,width:b.width+6,depth:b.depth+6};if(r.materialBand)r.materialBand={...r.materialBand,size:[r.bounds.width+2,r.materialBand.size[1],r.bounds.depth+2]};}
 addPixelHoleCuts(r,build.pixelHoles);
 return r;
}
