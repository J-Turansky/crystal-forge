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

function insideWithMargin(contour,x,z,margin){
 let inside=false;
 for(let i=0,j=contour.length-1;i<contour.length;j=i++){
  const [ax,az]=contour[j],[bx,bz]=contour[i],dx=bx-ax,dz=bz-az;
  const length=dx*dx+dz*dz;
  const t=length?Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/length)):0;
  if(Math.hypot(x-ax-t*dx,z-az-t*dz)<margin)return null;
  if((az>z)!==(bz>z)&&x<(bx-ax)*(z-az)/(bz-az)+ax)inside=!inside;
 }
 return inside;
}

export function findPixelPosition(recipe,holes){
 const {width,depth}=recipe.bounds;
 const samples=[[.23,0],[0,.23],[-.23,0],[0,-.23],[0,0],[.23,.23],[-.23,.23],[.23,-.23],[-.23,-.23]];
 for(let ring=1;ring<=8;ring++)for(let step=0;step<24;step++){
  const angle=step*Math.PI/12,r=ring*.055;
  samples.push([r*Math.cos(angle),r*Math.sin(angle)]);
 }
 const extrusions=recipe.positive.filter(part=>part.kind==='extrude'&&!part.rotation);
 const requireSolidFootprint=recipe.positive.length>0&&extrusions.length===recipe.positive.length;
 return samples.map(([x,z])=>pilot(defaultProfile,Math.round(x*width*10)/10,Math.round(z*depth*10)/10)).find(option=>{
  const {x,z}=option,margin=radius(option)+minimumWeb;
  if(Math.abs(x)+margin>width/2||Math.abs(z)+margin>depth/2)return false;
  if(holes.some(hole=>Math.hypot(x-hole.x,z-hole.z)<margin+radius(hole)))return false;
  if(recipe.negative.some(cut=>cut.kind==='cylinder'&&!cut.rotation&&Math.hypot(x-(cut.position?.[0]||0),z-(cut.position?.[2]||0))<margin+cut.radius))return false;
  return !requireSolidFootprint||extrusions.some(part=>{
   const px=x-(part.position?.[0]||0),pz=z-(part.position?.[2]||0);
   return insideWithMargin(part.outline,px,pz,margin)===true&&
    (part.holes||[]).every(contour=>insideWithMargin(contour,px,pz,margin)===false);
  });
 });
}

export function bindPixelBuilder(panel,{holes=[],getRecipe,onChange,onError,reopen}){
 const add=panel.querySelector('#smsPixelAdd');
 if(!add)return;
 const update=next=>{if(onChange(next))reopen();};
 add.onclick=()=>{
  let best;
  try{best=findPixelPosition(getRecipe(),holes);}catch(error){onError(error.message);return;}
  if(!best){onError('No clear material for this pixel hole. Move an existing hole or increase the solid area.');return;}
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

