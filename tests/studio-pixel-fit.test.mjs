import assert from 'node:assert/strict';
import {allPixelProfiles} from '../pixel-profiles.js';
import {
 pixelFittingProfiles,resolvePixelFitting,applyPixelFittingProfile,withMeasuredPixelFit,
 saveablePixelFit,pixelFitCouponRequest,
} from '../studio-pixel-fit.js';

const existing={id:'pixel-17',profileId:'seed',x:2,z:-9,rotation:37,diameter:5,clearance:.3};
assert.deepEqual(pixelFittingProfiles().map(profile=>profile.id),['gumdrop','bullet','seed','custom']);
const gumdrop=applyPixelFittingProfile(existing,'gumdrop');
assert.equal(resolvePixelFitting(gumdrop).nominalDiameter,12);
assert.equal(resolvePixelFitting(gumdrop).boreDiameter,12.3);
assert.equal(resolvePixelFitting(gumdrop).dimensions.flangeDiameter,12.5);
assert.match(resolvePixelFitting(gumdrop).warning,/Diameter-only/);
assert.equal(gumdrop.rotation,37);
assert.equal(gumdrop.id,existing.id);

const choice={bodyDiameter:5.18,printedBoreDiameter:5.46};
const calibrated=withMeasuredPixelFit(existing,choice);
assert.equal(calibrated.diameter,5.18);
assert.equal(calibrated.clearance,.28);
assert.throws(()=>withMeasuredPixelFit(existing,{...choice,printedBoreDiameter:9}),/clearance/);
assert.throws(()=>withMeasuredPixelFit(existing,{...choice,bodyDiameter:0}),/measured/);
assert.throws(()=>applyPixelFittingProfile(existing,'missing'),/unavailable/);

const {hole,profile}=saveablePixelFit(existing,choice,{id:'custom-seed-print',name:'Printed seed fit'});
assert.deepEqual(profile.measuredFit,choice);
assert.equal(profile.bodyDiameter,5.18);
assert.equal(allPixelProfiles({pixelProfiles:[profile]}).find(p=>p.id===profile.id).measuredFit.printedBoreDiameter,5.46);
const clone=applyPixelFittingProfile(existing,profile.id,[profile]);
assert.equal(clone.diameter,hole.diameter);
assert.equal(clone.clearance,hole.clearance);
assert.equal(clone.id,existing.id);

const single=pixelFitCouponRequest(hole,'single',[profile]);
assert.deepEqual(single.diameters,[5.46]);
assert.equal(single.profileName,'Printed seed fit');
assert.equal(single.filename,'pixel-fit-custom-seed-print-5_46mm-single');
assert.deepEqual(pixelFitCouponRequest(hole,'strip',[profile]).diameters,[5.26,5.36,5.46,5.56,5.66]);
assert.deepEqual(pixelFitCouponRequest({...existing,diameter:2,clearance:-.5}).diameters,[1.5,1.6,1.7]);
assert.deepEqual(pixelFitCouponRequest({...existing,diameter:30,clearance:.8}).diameters,[30.6,30.7,30.8]);
console.log('Measured pixel profiles, physical fit records and coupon diameter ranges passed.');

