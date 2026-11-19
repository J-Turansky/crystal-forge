import {allPixelProfiles,PIXEL_PRESETS} from './pixel-profiles.js';
import {applyPixelFittingProfile} from './studio-pixel-fit.js';
import {pixelBoreIssue} from './studio-pixel-bore-validation.js';

const maximumHoles=16;
const minimumWeb=1;
const defaultProfile=PIXEL_PRESETS.find(profile=>profile.id==='seed');
export const pixelId=(hole,index)=>hole.id||'legacy-pixel-'+(index+1);
export const stablePixels=holes=>holes.map((hole,index)=>({...hole,id:pixelId(hole,index),rotation:hole.rotation??0}));
export function newPixel(profile=defaultProfile,x=0,z=0){
 return {id:globalThis.crypto?.randomUUID?.()??'pixel-'+Date.now()+'-'+Math.random().toString(36).slice(2),profileId:profile.id,followProfileClearance:profile.id.startsWith('custom-'),x,z,diameter:profile.bodyDiameter,clearance:profile.measuredFit?Math.round((profile.measuredFit.printedBoreDiameter-profile.measuredFit.bodyDiameter)*100)/100:.3,rotation:0};
}
export const checkedPixelBore=(recipe,hole,others)=>pixelBoreIssue(recipe,hole,others);
const radius=hole=>(hole.diameter+hole.clearance)/2;

export function addPixelHoleCuts(recipe,holes=[],{routed=false}={}){
 if(!Array.isArray(holes)||holes.length>maximumHoles)throw Error('Use up to 16 pixel holes per model.');
 for(let index=0;index<holes.length;index++){
  const hole=holes[index],label='Pixel hole '+(index+1);
  if(!hole||![hole.x,hole.z,hole.diameter,hole.clearance].every(Number.isFinite)||
    hole.diameter<2||hole.diameter>30||hole.clearance<-.5||hole.clearance>.8)
   throw Error(label+' needs numeric X/Z, a 2–30 mm diameter and −0.5 to 0.8 mm clearance.');
  const bore=radius(hole),{width,depth,height}=recipe.bounds;
  if(Math.abs(hole.x)+bore+minimumWeb>width/2||Math.abs(hole.z)+bore+minimumWeb>depth/2)
   throw Error(label+' is too close to the edge of the model bounds.');
  if(holes.slice(0,index).some(other=>Math.hypot(hole.x-other.x,hole.z-other.z)<bore+radius(other)+minimumWeb))
   throw Error(label+' overlaps or is too close to another pixel hole.');
  const cut={kind:'cylinder',radius:bore,height:height+12,position:[hole.x,height/2,hole.z],
   pixelHole:label,pixelId:pixelId(hole,index),pixelRotation:hole.rotation??0,pixelEntryFace:hole.entryFace};
  if(hole.socketProfile){
   if(hole.entryFace!=='underside'||recipe.partitioned||recipe.dualMaterial)
    throw Error(label+' requires an underside entry and single-material stock for a shaped socket.');
   const profile=hole.socketProfile;
   if(![profile.bodyHeight,profile.capHeight,profile.flangeDiameter,profile.flangeHeight,profile.wireWidth,profile.wireDepth,profile.retentionLip].every(Number.isFinite)||
    profile.bodyHeight<3||profile.bodyHeight>50||profile.capHeight<=0||profile.capHeight>=profile.bodyHeight||
    profile.flangeDiameter<0||profile.flangeDiameter>38||profile.flangeHeight<0||profile.flangeHeight+profile.capHeight>=profile.bodyHeight||
    profile.wireWidth<0||profile.wireWidth>12||profile.wireDepth<0||profile.wireDepth>8||profile.retentionLip<0||profile.retentionLip>.7)
    throw Error(label+' has invalid measured socket dimensions.');
   if(height<profile.bodyHeight+2.8)throw Error(label+' needs '+(profile.bodyHeight+2.8).toFixed(1)+' mm of stock for its socket and roof.');
   cut.kind='pixel-seat';
   cut.includeLocalWireRelief=!routed;
   cut.profile={...profile,id:hole.profileId,bodyDiameter:hole.diameter,clearance:hole.clearance,
    boreDiameter:bore*2,maxDiameter:Math.max(hole.diameter,profile.flangeDiameter)+hole.clearance};
  }
  recipe.negative.push(cut);
 }
 if(holes.some(hole=>!hole.socketProfile))recipe.warnings.push('Plain pixel bores pass vertically through the model. Inspect the prepared mesh before printing.');
 if(holes.some(hole=>hole.socketProfile))recipe.warnings.push('Inspect the prepared underside seats and test physical fit before printing the full part.');
}

export function pixelProfiles(customProfiles=[]){
 return [...allPixelProfiles({pixelProfiles:customProfiles}),{id:'custom',name:'Custom diameter',bodyDiameter:5}];
}

export function pixelHoleMarkup(hole,index,escape,disabled,profiles){
 const number=(field,label,attributes)=>'<label>'+label+'<input type="number" data-pixel-field="'+field+
  '" data-pixel-index="'+index+'" value="'+escape(hole[field]??0)+'" required '+attributes+disabled+'></label>';
 return '<fieldset><legend>P'+(index+1)+'</legend><label>Pixel profile<select data-pixel-field="profileId" data-pixel-index="'+index+'"'+disabled+'>'+
  profiles.map(profile=>'<option value="'+escape(profile.id)+'"'+
  (profile.id===hole.profileId?' selected':'')+'>'+escape(profile.name)+'</option>').join('')+'</select></label>'+
  number('x','X (mm)','step=".1"')+number('z','Z (mm)','step=".1"')+
  number('rotation','Body rotation (°)','min="0" max="359" step="1"')+
  number('diameter','Measured body diameter (mm)','min="2" max="30" step=".1"')+
  number('clearance','Diameter clearance (mm)','min="-.5" max=".8" step=".05"')+
  '<button type="button" data-pixel-remove="'+index+'"'+disabled+'>Remove P'+(index+1)+'</button></fieldset>';
}

export function pixelBuilderMarkup(model,escape,profiles=pixelProfiles()){
 const holes=stablePixels(model.build.pixelHoles||[]),disabled=model.link?' disabled':'';
 return '<p>Choose P1, P2 or another numbered fitting to edit it. Placement needs a continuous solid area.</p>'+
  holes.map((hole,index)=>pixelHoleMarkup(hole,index,escape,disabled,profiles)).join('')+
  '<div class="sms-actions"><button type="button" id="smsPixelAdd"'+(holes.length>=maximumHoles?' disabled':disabled)+
  '>Add pixel hole</button><button id="smsPixelCoupon" type="button">Download pixel fit test STL</button></div>';
}

export function findPixelPosition(recipe,holes,profile=defaultProfile){
 const {width,depth}=recipe.bounds;
 const samples=[[.23,0],[0,.23],[-.23,0],[0,-.23],[0,0],[.23,.23],[-.23,.23],[.23,-.23],[-.23,-.23]];
 for(let ring=1;ring<=8;ring++)for(let step=0;step<24;step++){
  const angle=step*Math.PI/12,r=ring*.055;
  samples.push([r*Math.cos(angle),r*Math.sin(angle)]);
 }
 const pilot=newPixel(profile);
 for(const [x,z] of samples){
  const option={...pilot,x:Math.round(x*width*10)/10,z:Math.round(z*depth*10)/10};
  if(!pixelBoreIssue(recipe,option,holes))return option;
 }
}

export function bindPixelBuilder(panel,{holes=[],profiles=pixelProfiles(),onAdd,onEdit,onRemove}){
 const add=panel.querySelector('#smsPixelAdd');
 if(add)add.onclick=onAdd;
 panel.querySelectorAll('[data-pixel-remove]').forEach(button=>button.onclick=()=>onRemove(Number(button.dataset.pixelRemove)));
 panel.querySelectorAll('[data-pixel-field]').forEach(input=>input.onchange=()=>{
  const index=Number(input.dataset.pixelIndex),field=input.dataset.pixelField,hole=holes[index];
  if(!input.checkValidity()){input.reportValidity();input.value=hole[field]??0;return;}
  const value=field==='profileId'?input.value:Number(input.value);
  const changed=field==='profileId'?applyPixelFittingProfile(hole,value,profiles.filter(profile=>profile.id!=='custom')):{...hole,[field]:value};
  if(field==='diameter'||field==='clearance'){delete changed.fitCalibration;changed.followProfileClearance=false;}
  if(!onEdit(index,changed))input.value=hole[field]??0;
 });
}
