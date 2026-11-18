import {PIXEL_PRESETS} from './pixel-profiles.js';

const maximumHoles=16;
const minimumWeb=1;
const defaultProfile=PIXEL_PRESETS.find(profile=>profile.id==='seed');
const pilot=(profile,x,z)=>({profileId:profile.id,x,z,diameter:profile.bodyDiameter,clearance:.3});
const radius=hole=>(hole.diameter+hole.clearance)/2;

export function addPixelHoleCuts(recipe,holes=[]){
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
  recipe.negative.push({kind:'cylinder',radius:bore,height:height+12,position:[hole.x,height/2,hole.z],pixelHole:label});
 }
 if(holes.length)recipe.warnings.push('Pixel bores are cut vertically through the model. Inspect the prepared mesh and print a fit test before making the full part.');
}

function pixelHoleMarkup(hole,index,escape,disabled){
 const number=(field,label,attributes)=>'<label>'+label+'<input type="number" data-pixel-field="'+field+
  '" data-pixel-index="'+index+'" value="'+escape(hole[field])+'" required '+attributes+disabled+'></label>';
 return '<fieldset><legend>Pixel '+(index+1)+'</legend><label>Pixel profile<select data-pixel-field="profileId" data-pixel-index="'+index+'"'+disabled+'>'+
  [...PIXEL_PRESETS,{id:'custom',name:'Custom diameter'}].map(profile=>'<option value="'+escape(profile.id)+'"'+
  (profile.id===hole.profileId?' selected':'')+'>'+escape(profile.name)+'</option>').join('')+'</select></label>'+
  number('x','X (mm)','step=".1"')+number('z','Z (mm)','step=".1"')+
  number('diameter','Measured body diameter (mm)','min="2" max="30" step=".1"')+
  number('clearance','Diameter clearance (mm)','min="-.5" max=".8" step=".05"')+
  '<button type="button" data-pixel-remove="'+index+'"'+disabled+'>Remove pixel '+(index+1)+'</button></fieldset>';
}

export function pixelBuilderMarkup(model,escape){
 const holes=Array.isArray(model.build.pixelHoles)?model.build.pixelHoles:[],disabled=model.link?' disabled':'';
 return '<p>Enter X and Z from the model centre. Amber rings show where the holes will be cut when you prepare the print.</p>'+
  holes.map((hole,index)=>pixelHoleMarkup(hole,index,escape,disabled)).join('')+
  '<div class="sms-actions"><button type="button" id="smsPixelAdd"'+(holes.length>=maximumHoles?' disabled':disabled)+
  '>Add pixel hole</button><button id="smsPixelCoupon" type="button">Download pixel fit test STL</button></div>';
}

export function bindPixelBuilder(panel,{holes=[],getBounds,onChange,onError,reopen}){
 const add=panel.querySelector('#smsPixelAdd');
 if(!add)return;
 const update=next=>{if(onChange(next))reopen();};
 add.onclick=()=>{
  let bounds;
  try{bounds=getBounds();}catch(error){onError(error.message);return;}
  const positions=[[.23,0],[0,.23],[-.23,0],[0,-.23],[0,0],[.23,.23],[-.23,.23],[.23,-.23],[-.23,-.23]];
  const options=positions.map(([x,z])=>pilot(defaultProfile,Math.round(x*bounds.width*10)/10,Math.round(z*bounds.depth*10)/10));
  const best=options.find(option=>Math.abs(option.x)+radius(option)+minimumWeb<=bounds.width/2&&
   Math.abs(option.z)+radius(option)+minimumWeb<=bounds.depth/2&&
   !holes.some(hole=>Math.hypot(option.x-hole.x,option.z-hole.z)<radius(option)+radius(hole)+minimumWeb));
  if(!best){onError('Move an existing pixel or enlarge this model to make room for another hole.');return;}
  update([...holes,best]);
 };
 panel.querySelectorAll('[data-pixel-remove]').forEach(button=>button.onclick=()=>update(holes.filter((_,index)=>index!==Number(button.dataset.pixelRemove))));
 panel.querySelectorAll('[data-pixel-field]').forEach(input=>input.onchange=()=>{
  const index=Number(input.dataset.pixelIndex),field=input.dataset.pixelField,hole=holes[index];
  if(!input.checkValidity()){input.reportValidity();return;}
  const value=field==='profileId'?input.value:Number(input.value);
  const profile=field==='profileId'?PIXEL_PRESETS.find(item=>item.id===value):null;
  const changed={...hole,[field]:value};
  if(profile)changed.diameter=profile.bodyDiameter;
  if(field==='diameter')changed.profileId='custom';
  const next=holes.map((old,i)=>i===index?changed:old);
  if(onChange(next))reopen();
  else input.value=hole[field];
 });
}

