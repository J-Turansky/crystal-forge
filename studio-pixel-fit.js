import {allPixelProfiles,normalisePixelProfile,PIXEL_PRESETS} from './pixel-profiles.js';

const customDiameter={id:'custom',name:'Custom diameter'};
const round=value=>Math.round(value*100)/100;
const builtInIds=new Set(PIXEL_PRESETS.map(profile=>profile.id));
const inRange=(value,min,max)=>Number.isFinite(value)&&value>=min&&value<=max;

export function pixelFittingProfiles(customProfiles=[]){
 return [...allPixelProfiles({pixelProfiles:customProfiles}),customDiameter];
}

export function resolvePixelFitting(hole,customProfiles=[]){
 const saved=pixelFittingProfiles(customProfiles).find(profile=>profile.id===hole.profileId);
 const nominalDiameter=saved?.bodyDiameter??hole.diameter;
 return {
  profile:saved?.bodyDiameter?saved:null,
  profileName:saved?.name??'Saved diameter',
  nominalDiameter,
  diameter:hole.diameter,
  clearance:hole.clearance,
  boreDiameter:round(hole.diameter+hole.clearance),
  dimensions:saved?.bodyHeight?{length:saved.bodyHeight,flangeDiameter:saved.flangeDiameter}:null,
  warning:'Diameter-only through bore. Flange seating, retention and strain relief are outside this test.'
 };
}

export function applyPixelFittingProfile(hole,profileId,customProfiles=[]){
 const profile=pixelFittingProfiles(customProfiles).find(item=>item.id===profileId);
 if(!profile)throw Error('This pixel profile is unavailable. Select an existing profile or enter a custom diameter.');
 const next={...hole,profileId};
 delete next.fitCalibration;
 if(profile.bodyDiameter)next.diameter=profile.bodyDiameter;
 if(profile.measuredFit)next.clearance=round(profile.measuredFit.printedBoreDiameter-profile.measuredFit.bodyDiameter);
 return next;
}

export function withMeasuredPixelFit(hole,{bodyDiameter,printedBoreDiameter}){
 if(!inRange(bodyDiameter,2,30)||!Number.isFinite(printedBoreDiameter))
  throw Error('Enter the measured 2-30 mm pixel body and the bore that fit in your physical print.');
 const body=round(bodyDiameter),bore=round(printedBoreDiameter),clearance=round(bore-body);
 if(!inRange(clearance,-.5,.8))throw Error('The printed fit must be within -0.5 to 0.8 mm diameter clearance.');
 return {...hole,diameter:body,clearance,fitCalibration:{bodyDiameter:body,printedBoreDiameter:bore}};
}

export function saveablePixelFit(hole,measurement,{name,id,customProfiles=[]}={}){
 const next=withMeasuredPixelFit(hole,measurement);
 const original=resolvePixelFitting(hole,customProfiles).profile;
 if(!original?.bodyHeight)throw Error('Choose a named profile before saving a reusable calibrated copy. A custom diameter can be recorded on this fitting.');
 const profileId=original.id.startsWith('custom-')?original.id:id;
 if(typeof profileId!=='string'||!profileId.startsWith('custom-')||builtInIds.has(profileId)||!(name??original.name)?.trim())
  throw Error('Enter a name for the calibrated custom profile.');
 const profile=normalisePixelProfile({...original,id:profileId,name:name??original.name,
  bodyDiameter:next.diameter,measuredFit:next.fitCalibration});
 return {hole:{...next,profileId:profile.id},profile};
}

export function pixelFitCouponRequest(hole,kind='strip',customProfiles=[]){
 if(!inRange(hole.diameter,2,30)||!inRange(hole.clearance,-.5,.8))
  throw Error('Choose a 2-30 mm pixel diameter and -0.5 to 0.8 mm clearance before generating the test.');
 if(kind!=='strip'&&kind!=='single')throw Error('Choose one bore or a clearance strip.');
 const fitting=resolvePixelFitting(hole,customProfiles);
 const offsets=kind==='single'?[0]:[-.2,-.1,0,.1,.2];
 const diameters=[...new Set(offsets.map(delta=>round(hole.diameter+
  Math.max(-.5,Math.min(.8,hole.clearance+delta)))))];
 const name=String(hole.profileId||'custom').toLowerCase().replace(/[^a-z0-9-]+/g,'-').slice(0,45)||'custom';
 return {...fitting,diameters,filename:'pixel-fit-'+name+'-'+fitting.boreDiameter.toFixed(2).replace('.','_')+'mm-'+kind};
}

