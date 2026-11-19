// Native model mounting holes share the validated X/Z solid-column certificate
// used by pixel bores. They are honest through-holes, not rated inserts.
import {pixelBoreIssue} from './studio-pixel-bore-validation.js';

const maximum=16;
export const stableMounts=holes=>(holes||[]).map((hole,index)=>({...hole,id:hole.id||'legacy-mount-'+(index+1),diameter:hole.diameter??3.4}));
export function newMount(x=0,z=0,diameter=3.4){
 return {id:globalThis.crypto?.randomUUID?.()??'mount-'+Date.now()+'-'+Math.random().toString(36).slice(2),x,z,diameter,entryFace:'top'};
}
export function mountHoleIssue(recipe,mount,otherMounts=[],pixelHoles=[]){
 if(!mount||![mount.x,mount.z,mount.diameter].every(Number.isFinite)||mount.diameter<2||mount.diameter>8)
  return 'Mounting holes need numeric X/Z and a diameter between 2 and 8 mm.';
 if(!['top','underside',undefined].includes(mount.entryFace))
  return 'Choose a supported top or underside entry for the vertical mounting hole.';
 const other=[...otherMounts.map(h=>({...h,clearance:0})),...pixelHoles];
 const reason=pixelBoreIssue(recipe,{...mount,clearance:0},other);
 if(!reason)return null;
 return reason.replace(/another pixel/g,'another pixel or mounting hole').replace(/^The bore/g,'The mount').replace(/^Through bores/g,'Through mounting holes');
}
export function addManualMountCuts(recipe,build={}){
 const mounts=build.manualMountHoles||[];
 if(!Array.isArray(mounts)||mounts.length>maximum)
  throw Error('Use up to 16 manually placed mounting holes.');
 const seen=new Set();
 for(let i=0;i<mounts.length;i++){
  const mount=mounts[i],id=mount?.id||'legacy-mount-'+(i+1);
  if(seen.has(id))throw Error('Mount IDs must be distinct.');
  seen.add(id);
  const issue=mountHoleIssue(recipe,mount,mounts.slice(0,i),build.pixelHoles||[]);
  if(issue)throw Error('M'+(i+1)+': '+issue);
  recipe.negative.push({
   kind:'cylinder',radius:mount.diameter/2,height:recipe.bounds.height+12,
   position:[mount.x,recipe.bounds.height/2,mount.z],
   mountHole:'Mount hole '+(i+1),mountId:id,mountEntryFace:mount.entryFace||'top'
  });
 }
 if(mounts.length)recipe.warnings.push('Manual mounting through-holes are un-rated; inspect remaining wall and print/measure the actual fixing before installation.');
}
