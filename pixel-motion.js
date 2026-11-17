/* Transactional pixel/edge edits. Every accepted movement is measured with the
 * same curved paths, collisions and length limits used by manufacturing. */
import {planHardware} from './hardware-layout.js';
import {nearestEdgePosition} from './edge-tabs.js';
const copy=x=>JSON.parse(JSON.stringify(x));
const angle=(x,z)=>Math.atan2(z,x)*180/Math.PI;
const normalized=(x,z)=>{const d=Math.hypot(x,z)||1;return {x:x/d,z:z/d};};
export function orientPixelChain(settings){
 const p=settings.manualPixelHoles;
 for(let i=0;i<p.length;i++){
  const before=i?p[i-1]:(Number.isFinite(settings.wireEntryX)&&Number.isFinite(settings.wireEntryZ)?{x:settings.wireEntryX,z:settings.wireEntryZ}:null);
  const after=i<p.length-1?p[i+1]:(Number.isFinite(settings.wireOutputX)&&Number.isFinite(settings.wireOutputZ)?{x:settings.wireOutputX,z:settings.wireOutputZ}:null);
  const incoming=before?normalized(p[i].x-before.x,p[i].z-before.z):null;
  const outgoing=after?normalized(after.x-p[i].x,after.z-p[i].z):null;
  const x=(incoming?.x??outgoing?.x??1)+(outgoing?.x??incoming?.x??1),z=(incoming?.z??outgoing?.z??0)+(outgoing?.z??incoming?.z??0);
  if(Math.hypot(x,z)>.01)p[i].wireAngle=angle(x,z);
 }
 return settings;
}
export function editablePixels(crystals,settings){
 const plan=planHardware(crystals,settings);
 return {...copy(settings),pixelPlacement:'manual',manualPixelHoles:settings.pixelPlacement==='manual'?copy(settings.manualPixelHoles):plan.sockets.map(p=>({id:p.id,x:p.x,z:p.z,profileId:p.profileId,wireAngle:p.wireAngle??0})),pixelCount:plan.sockets.length};
}
function physicalLayoutValid(plan,count,original){
 return plan.sockets.length===count&&!plan.invalidManualPixels.length&&!plan.skippedPixels&&!plan.invalidManualMounts.length&&
  plan.mounts.length===original.mounts.length&&plan.tabs.length===original.tabs.length&&plan.wirePlan?.ready;
}
export function solvePixelMove(crystals,settings,{pixelId=null,point=null,edgeKind=null,edgePoint=null,search=true}={}){
 const original=planHardware(crystals,settings),draft=editablePixels(crystals,settings),pixels=draft.manualPixelHoles;
 if(!pixels.length)return {valid:false,reason:'Add at least one valid pixel first.'};
 const index=pixels.findIndex(p=>String(p.id)===String(pixelId));
 if(pixelId!==null&&index<0)return {valid:false,reason:'The selected pixel no longer exists.'};
 if(point&&index>=0){if(!Number.isFinite(point.x)||!Number.isFinite(point.z))return {valid:false,reason:'Invalid pointer position.'};pixels[index].x=point.x;pixels[index].z=point.z;}
 if(edgeKind){
  if(!['input','output'].includes(edgeKind)||!edgePoint||!Number.isFinite(edgePoint.x)||!Number.isFinite(edgePoint.z))return {valid:false,reason:'Invalid edge handle.'};
  const edge=nearestEdgePosition(original.polygon,edgePoint);
  if(edgeKind==='input'){draft.wireEntryX=edge.x;draft.wireEntryZ=edge.z;}else{draft.wireOutputX=edge.x;draft.wireOutputZ=edge.z;}
 }
 orientPixelChain(draft);
 let plan=planHardware(crystals,draft);
 if(physicalLayoutValid(plan,pixels.length,original))return {valid:true,settings:draft,plan};
 // Search a small angular neighbourhood. A single axis still determines both
 // opposed IN/OUT ports; this never rotates the two ends independently.
 if(search){
  const indices=[...new Set([index,index-1,index+1,edgeKind==='input'?0:edgeKind==='output'?pixels.length-1:-1])].filter(i=>i>=0&&i<pixels.length);
  for(const i of indices){const base=pixels[i].wireAngle;
   for(const offset of [-15,15,-30,30,-60,60,90,-90,180]){
    pixels[i].wireAngle=base+offset;plan=planHardware(crystals,draft);
    if(physicalLayoutValid(plan,pixels.length,original))return {valid:true,settings:draft,plan};
   }
   pixels[i].wireAngle=base;
  }
 }
 return {valid:false,reason:plan.wirePlan?.messages?.join(' ')||'This position cannot meet the cable length and clearance limits.'};
}
export function setPixelEdgeMode(crystals,settings,pixelId,mode){
 if(!['none','input','output','both'].includes(mode))return {valid:false,reason:'Choose an edge-wire mode.'};
 const draft=editablePixels(crystals,settings),p=draft.manualPixelHoles,index=p.findIndex(p=>String(p.id)===String(pixelId));
 if(index<0)return {valid:false,reason:'Pixel not found.'};
 if(mode==='both'&&p.length!==1)return {valid:false,reason:'Both edges can belong to the same pixel only in a one-pixel string.'};
 if(mode==='none'){
  if(index===0)draft.wireInputEnabled=false;
  if(index===p.length-1)draft.wireOutputEnabled=false;
 }else{
  const selected=p.splice(index,1)[0];
  if(mode==='input'||mode==='both'){p.unshift(selected);draft.wireInputEnabled=true;}
  else p.push(selected);
  if(mode==='output'||mode==='both')draft.wireOutputEnabled=true;
 }
 draft.wireChannels=true;draft.wireMode='string';draft.cutSockets=true;draft.constrainPixelMotion=true;
 if(!draft.wireInputTailLength)draft.wireInputTailLength=draft.pixelStringSpacing||50;
 if(!draft.wireOutputTailLength)draft.wireOutputTailLength=draft.pixelStringSpacing||50;
 // Choosing a new endpoint lets the planner find its first safe perimeter
 // opening automatically instead of reusing an unrelated old endpoint.
 if(mode==='input'||mode==='both'){delete draft.wireEntryX;delete draft.wireEntryZ;}
 if(mode==='output'||mode==='both'){delete draft.wireOutputX;delete draft.wireOutputZ;}
 const solved=solvePixelMove(crystals,draft,{pixelId,search:true});
 if(!solved.valid)return {valid:false,reason:'No complete route fits the selected cable lengths. Move pixels closer, increase the edge cable length, or remove conflicting mounts. '+solved.reason};
 return solved;
}
export function pixelEdgeMode(plan,settings,index){
 const input=index===0&&settings.wireInputEnabled!==false,output=index===plan.sockets.length-1&&settings.wireOutputEnabled!==false;
 return input&&output?'both':input?'input':output?'output':'none';
}
export function edgeSamples(polygon,count=72){
 const lengths=polygon.map((a,i)=>Math.hypot(a.x-polygon[(i+1)%polygon.length].x,a.z-polygon[(i+1)%polygon.length].z)),total=lengths.reduce((s,n)=>s+n,0);
 return Array.from({length:count+1},(_,i)=>{let d=(i%count)/count*total,k=0;while(d>lengths[k]&&k<lengths.length-1)d-=lengths[k++];const a=polygon[k],b=polygon[(k+1)%polygon.length],t=d/(lengths[k]||1);return {x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t};});
}
export function motionGuide(crystals,settings,{pixelId=null,edgeKind=null}={}){
 const plan=planHardware(crystals,settings);
 if(edgeKind)return {kind:'edge',samples:edgeSamples(plan.polygon).map(point=>({...point,valid:solvePixelMove(crystals,settings,{edgeKind,edgePoint:point,search:false}).valid}))};
 const p=plan.sockets.find(p=>String(p.id)===String(pixelId));if(!p)return {kind:'pixel',samples:[]};
 const radius=Math.min(150,Number(settings.pixelStringSpacing)||50),samples=[];
 for(let i=0;i<=32;i++){
  const a=i%32/32*Math.PI*2;let last={x:p.x,z:p.z,valid:false};
  for(let j=0;j<=8;j++){const point={x:p.x+Math.cos(a)*radius*j/8,z:p.z+Math.sin(a)*radius*j/8};
   const valid=solvePixelMove(crystals,settings,{pixelId,point,search:false}).valid;if(!valid)break;last={...point,valid:true};}
  samples.push(last);
 }
 return {kind:'pixel',samples};
}
export function repairPixelRouting(crystals,settings){
 const original=planHardware(crystals,settings);
 if(original.invalidManualPixels.length||original.invalidManualMounts.length||original.skippedPixels)return {valid:false,reason:'Move the red holes inside the base and away from other holes first.'};
 const draft=editablePixels(crystals,settings);
 const first=solvePixelMove(crystals,draft,{pixelId:draft.manualPixelHoles[0]?.id});if(first.valid)return first;
 // Automatic repair may turn sockets and relocate the two edge openings, but
 // never moves a socket, changes a fixing, lengthens a cable or reduces a bend limit.
 delete draft.wireEntryX;delete draft.wireEntryZ;delete draft.wireOutputX;delete draft.wireOutputZ;
 orientPixelChain(draft);let pixels=draft.manualPixelHoles;if(!pixels.length)return {valid:false,reason:'Add at least one pixel.'};
 const indices=[...new Set([0,pixels.length-1])];
 let best=null,bestScore=Infinity;
 const score=plan=>(plan.wirePlan?.unrouted||0)*1000+(plan.wirePlan?.overLengthCount||0)*200+
  (plan.wirePlan?.connections||[]).reduce((n,c)=>n+Math.max(0,c.lengthMm-(c.allowedMm??Infinity)),0);
 for(const i of indices){const base=pixels[i].wireAngle;
  for(const offset of [0,15,-15,30,-30,60,-60,90,-90,180]){
   pixels[i].wireAngle=base+offset;const plan=planHardware(crystals,draft);
   if(physicalLayoutValid(plan,pixels.length,original))return {valid:true,settings:copy(draft),plan};
   const value=score(plan);if(value<bestScore){bestScore=value;best=copy(draft);}
  }
  if(best){Object.assign(draft,best);pixels=draft.manualPixelHoles;}
 }
 return {valid:false,reason:'No safe route fits without moving a pixel or changing your hardware. Move the first/last pixel closer to a clear edge, or use a longer measured cable. Your layout has not been changed.'};
}
