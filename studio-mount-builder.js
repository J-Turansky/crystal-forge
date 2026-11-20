// Native model mounting holes share the validated X/Z solid-column certificate
// used by pixel bores. They are honest through-holes, not rated inserts.
import {pixelBoreIssue} from './studio-pixel-bore-validation.js';

const maximum=16;
export const mountProfiles=['Through-hole','Counterbore','Countersink'];
export function recessDimensions(mount){
 return {diameter:mount.recessDiameter??mount.diameter*1.5,depth:mount.recessDepth??1.4};
}
export const stableMounts=holes=>(holes||[]).map((hole,index)=>({...hole,id:hole.id||'legacy-mount-'+(index+1),diameter:hole.diameter??3.4}));
export function newMount(x=0,z=0,diameter=3.4){
 return {id:globalThis.crypto?.randomUUID?.()??'mount-'+Date.now()+'-'+Math.random().toString(36).slice(2),x,z,diameter,entryFace:'top'};
}
export function mountHoleIssue(recipe,mount,otherMounts=[],pixelHoles=[]){
 if(!mount||![mount.x,mount.z,mount.diameter].every(Number.isFinite)||mount.diameter<2||mount.diameter>8)
  return 'Mounting holes need numeric X/Z and a diameter between 2 and 8 mm.';
 if(!['top','underside',undefined].includes(mount.entryFace))
  return 'Choose a supported top or underside entry for the vertical mounting hole.';
 const profile=mount.profile??mountProfiles[0];
 if(!mountProfiles.includes(profile))return 'Choose a supported fixing profile.';
 if(profile!==mountProfiles[0]){
  const recess=recessDimensions(mount);
  if(mount.entryFace!=='underside'&&!Number.isFinite(recipe.serialSupport?.topY))
   return 'Place the mount on an underside or supported planar top face to add a recess.';
  if(!Number.isFinite(recess.diameter)||recess.diameter<mount.diameter+.4||recess.diameter>12||
     !Number.isFinite(recess.depth)||recess.depth<.5||recess.depth>8)
   return 'Choose a recess 0.5–8 mm deep and at least 0.4 mm wider than the through-hole, up to 12 mm.';
 }
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
  const fixingId='manual-fixing-'+id;
  recipe.negative.push({
   fixingId,kind:'cylinder',radius:mount.diameter/2,height:recipe.bounds.height+12,
   position:[mount.x,recipe.bounds.height/2,mount.z],
   mountHole:'Mount hole '+(i+1),mountId:id,mountEntryFace:mount.entryFace||'top'
  });
  if(mount.profile&&mount.profile!==mountProfiles[0]){
   const {diameter,depth}=recessDimensions(mount);
   const top=mount.entryFace!=='underside',surfaceY=top?recipe.serialSupport.topY:0;
   const tapered=mount.profile==='Countersink',pilot=mount.diameter/2,opening=diameter/2;
   const outer=tapered?opening+(opening-pilot)*.2/depth:opening;
   const cut={kind:'cylinder',radius:top&&tapered?pilot:outer,topRadius:!top&&tapered?pilot:outer,
    height:depth+.2,position:[mount.x,surfaceY+(top?-1:1)*(depth-.2)/2,mount.z],
    fixingId,fixingRecess:'M'+(i+1)+' recess',manualMountRecess:true,fixingSurfaceY:surfaceY,fixingTopEntry:top};
   recipe.negative.push(cut);
  }
 }
 if(mounts.length)recipe.warnings.push('Manual mounting through-holes are un-rated; inspect remaining wall and print/measure the actual fixing before installation.');
}
