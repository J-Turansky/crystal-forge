import {pixelBoreIssue} from '../studio-pixel-bore-validation.js';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import Module from 'manifold-3d';
import {waveGenerator,tileGenerator,gearGenerator,capGenerator,pebbleGenerator,generators,applyBuildModules} from '../studio-catalogue.js';
import {findPixelPosition} from '../studio-pixel-builder.js';
import {previewRecipe,disposeGroup,prepareRecipe} from '../studio-geometry.js';
import {exportMaterialBodies} from '../studio-material-export.js';
const wasm=await Module();wasm.setup();
const joystick=capGenerator.presets.find(preset=>preset.id==='joystick');
assert.equal(joystick.parameters.controlStyle,'Thumb joystick');
for(const dualMaterial of [false,true]){
 const prepared=prepareRecipe(THREE,wasm,capGenerator.recipe({...joystick.parameters,dualMaterial}));
 const exported=exportMaterialBodies(prepared,{name:'thumb-joystick-regression'});
 assert.equal(exported.stls.length,dualMaterial?2:1);
 assert(exported.threeMF.length>100);
}
const indicator=capGenerator.presets.find(preset=>preset.id==='indicator');
const lens=prepareRecipe(THREE,wasm,capGenerator.recipe({...indicator.parameters,dualMaterial:false}));
const splitLens=prepareRecipe(THREE,wasm,capGenerator.recipe({...indicator.parameters,dualMaterial:true}));
assert.deepEqual(splitLens.bodies.map(body=>body.role),['primary','secondary']);
assert(Math.abs(splitLens.bodies.reduce((volume,body)=>volume+body.volume,0)-lens.bodies[0].volume)<1e-4,
 'The indicator material split must preserve the lens volume.');
assert.equal(exportMaterialBodies(splitLens,{name:'indicator-lens-regression'}).stls.length,2);
console.log('Indicator lens regression: connected material bodies, conserved volume and STL export passed.');
const river=pebbleGenerator.presets.find(preset=>preset.id==='river');
const riverSingle=prepareRecipe(THREE,wasm,pebbleGenerator.recipe({...river.parameters,dualMaterial:false}));
const riverDual=prepareRecipe(THREE,wasm,pebbleGenerator.recipe({...river.parameters,dualMaterial:true}));
assert.equal(exportMaterialBodies(riverDual,{name:'river-pod-regression'}).stls.length,2);
assert(Math.abs(riverDual.bodies.reduce((volume,body)=>volume+body.volume,0)-riverSingle.bodies[0].volume)<1e-4);
console.log('River pod regression: connected material bodies, conserved volume and STL export passed.');
const creativeGearIds=['crown-open','turbine','petal-web','scallop-lace','solid-crown','rail-pulley'];
const gearSignatures=new Set();
for(const id of creativeGearIds){
 const preset=gearGenerator.presets.find(item=>item.id===id);
 assert(preset,'Missing creative gear '+id);
 const recipe=gearGenerator.recipe(preset.parameters);
 gearSignatures.add(JSON.stringify(recipe.positive));
}
assert.equal(gearSignatures.size,creativeGearIds.length);
const turbine=gearGenerator.presets.find(item=>item.id==='turbine').parameters;
const sweeping=gearGenerator.recipe(turbine);
assert.notDeepEqual(gearGenerator.recipe({...turbine,webStyle:'Solid'}).positive,sweeping.positive);
assert.notDeepEqual(gearGenerator.recipe({...turbine,wheelStyle:'Crown'}).positive,sweeping.positive);
assert.notDeepEqual(gearGenerator.recipe({...turbine,reliefHeight:4}).positive,sweeping.positive);
for(const diameter of [100,110]){
 const parameters={...turbine,diameter,dualMaterial:false};
 const uncut=gearGenerator.recipe(parameters);
 const hole=findPixelPosition(uncut,[]);
 assert(hole,'Openwork turbine needs a printable pixel position.');
 assert.notDeepEqual([hole.x,hole.z],[diameter*.23,0],'The original candidate was in the window.');
 if(diameter===100){
  const misplaced={...hole,x:23,z:0};
  assert.throws(()=>prepareRecipe(THREE,wasm,applyBuildModules(uncut,{pixelHoles:[misplaced]},gearGenerator.capabilities)),
   /does not cut the model/, 'The reviewed placement must still fail fabrication.');
 }
 const cut=prepareRecipe(THREE,wasm,applyBuildModules(uncut,{pixelHoles:[hole]},gearGenerator.capabilities));
 const original=prepareRecipe(THREE,wasm,uncut);
 assert(original.bodies[0].volume-cut.bodies[0].volume>1);
 assert.equal(exportMaterialBodies(cut).stls.length,1);
}
for(const id of ['turbine','crown-open']){
 const p=gearGenerator.presets.find(item=>item.id===id).parameters;
 for(const thickness of [p.thickness,11]){
  const recipe=gearGenerator.recipe({...p,thickness,dualMaterial:true});
  const preview=previewRecipe(THREE,recipe);
  const face=preview.children.find(mesh=>mesh.userData.materialRole==='secondary');
  assert.equal(face.material.clippingPlanes[0].distanceToPoint(new THREE.Vector3(0,recipe.materialSplitHeight,0)),0);
  assert(face.material.clippingPlanes[0].distanceToPoint(new THREE.Vector3(0,thickness,0))>0);
  disposeGroup(preview);
  const result=prepareRecipe(THREE,wasm,recipe);
  for(const body of result.bodies){
   const positions=body.mesh.vertProperties??body.mesh.points,stride=body.mesh.numProp??3;
   for(let i=1;i<positions.length;i+=stride){
    if(body.role==='secondary')assert(positions[i]>=recipe.materialSplitHeight-1e-5);
    else assert(positions[i]<=recipe.materialSplitHeight+1e-5);
   }
  }
  const output=exportMaterialBodies(result);
  assert.equal(output.stls.length,2);
  assert(output.threeMF.length>100);
 }
}
for(const [generator,ids] of [[waveGenerator,['river','rings','eddy','saddle','dune']],[tileGenerator,['grass','basket','pebbles','scales']]]){
 const signatures=ids.map(id=>{
  const preset=generator.presets.find(item=>item.id===id);
  assert(preset,id);
  const {points}=generator.recipe(preset.parameters).positive[0].mesh;
  return JSON.stringify(Array.from(points).filter((_,index)=>index%93===1));
 });
 assert.equal(new Set(signatures).size,ids.length);
}
const presetParameters=(family,id)=>family.presets.find(preset=>preset.id===id).parameters;
const legacyKnob=presetParameters(capGenerator,'knob');
const rotaryDish=capGenerator.recipe({...legacyKnob,rotaryTop:'Dish',rotaryMark:'Recessed pointer'});
assert.equal(rotaryDish.positive[0].kind,'mesh');
assert.deepEqual(rotaryDish.negative.at(-1),capGenerator.recipe(legacyKnob).negative.at(-1),
 'The new face retains the measured socket cutter.');
const lantern=presetParameters(pebbleGenerator,'lantern');
const unlitLantern=prepareRecipe(THREE,wasm,pebbleGenerator.recipe({...lantern,illuminated:false}));
const litLantern=prepareRecipe(THREE,wasm,pebbleGenerator.recipe(lantern));
assert(unlitLantern.bodies[0].volume-litLantern.bodies[0].volume>100,'Lantern subtracts a real internal cavity.');

for(const generator of generators){
 assert(generator.presets.length>=3,generator.displayName+' requires three meaningful presets.');
 for(const preset of generator.presets){
  for(const dualMaterial of [false,true]){
   const p={...preset.parameters,dualMaterial};
   const recipe=applyBuildModules(generator.recipe(p),{},generator.capabilities);
   const again=applyBuildModules(generator.recipe(p),{},generator.capabilities);
   assert.deepEqual(recipe,again,'Deterministic '+generator.typeId+'/'+preset.id);
   const result=prepareRecipe(THREE,wasm,recipe);
   assert(result.report.ready);assert.equal(result.bodies.length,dualMaterial?2:1);
   const output=exportMaterialBodies(result,{name:preset.name});assert(output.threeMF.length>100);assert.equal(output.stls.length,result.bodies.length);
   console.log(generator.typeId+'/'+preset.id+' '+(dualMaterial?'dual':'single')+' passed');
  }
 }
}
console.log('All six new generators: real Manifold, connected material bodies and manufacturing exports passed.');

const symbolOptions=capGenerator.parameterSchema.find(field=>field.key==='symbol').options;
for(const id of ['knob','selector']){
 const preset=capGenerator.presets.find(item=>item.id===id);
 const symbols=new Set();
 for(const symbol of symbolOptions){
  const recipe=capGenerator.recipe({...preset.parameters,symbol,dualMaterial:true});
  symbols.add(JSON.stringify(recipe.secondary));
  assert.equal(prepareRecipe(THREE,wasm,recipe).bodies.length,2,id+'/'+symbol);
 }
 assert.equal(symbols.size,symbolOptions.length,'Every '+id+' symbol has distinct geometry');
}

// Append to tests/studio-catalogue.test.mjs and import pixelBoreIssue from
// ../studio-pixel-bore-validation.js. Runs with the existing Manifold setup.
{
 const newBore={id:'fixture-pixel',x:10.7,z:9.4,profileId:'seed',diameter:5,clearance:.3};
 const tactile=tileGenerator.recipe({outline:'circle',dualMaterial:true});
 const wave=waveGenerator.recipe({flowStyle:'Saddle',dualMaterial:true});
 assert.match(pixelBoreIssue(tactile,{...newBore,x:32,z:32}),/continuous solid material/, 'Bounds corners are outside the real disc.');
 assert.match(pixelBoreIssue(tactile,newBore,[{...newBore,id:'other-pixel'}]),/another pixel/);
 assert.match(pixelBoreIssue(wave,{...newBore,x:54}),/model edge/);
 assert.match(pixelBoreIssue(gearGenerator.recipe(turbine),{...newBore,x:23,z:0}),/continuous solid material/);
 assert.match(pixelBoreIssue(pebbleGenerator.recipe({...river.parameters,illuminated:false}),{
  ...newBore,x:0,z:0
 }),/cavity/);
 const mounted=applyBuildModules(wave,{mounting:true,spacing:35,mountStyle:'Underside counterbores'},waveGenerator.capabilities);
 assert.match(pixelBoreIssue(mounted,{...newBore,x:21,z:0}),/existing cut/, 'Preserve web around the larger counterbore.');
 const thin={positive:[{kind:'box',size:[30,1,30]}],negative:[],bounds:{width:30,depth:30,height:1}};
 assert.match(pixelBoreIssue(thin,newBore),/continuous solid material/);
 for(const [recipe,capabilities] of [[tactile,tileGenerator.capabilities],[wave,waveGenerator.capabilities]]){
  assert.equal(pixelBoreIssue(recipe,newBore),null);
  const cutRecipe=applyBuildModules(recipe,{pixelHoles:[newBore]},capabilities);
  const manufactured=prepareRecipe(THREE,wasm,cutRecipe);
  const nominal=(newBore.diameter+newBore.clearance)/2;
  const original=prepareRecipe(THREE,wasm,recipe);
  assert.equal(manufactured.bodies.length,2);
  for(const [index,body] of manufactured.bodies.entries()){
   const {vertProperties,numProp}=body.mesh, ring=[];
   for(let i=0;i<vertProperties.length;i+=numProp){
    const distance=Math.hypot(vertProperties[i]-newBore.x,vertProperties[i+2]-newBore.z);
    if(Math.abs(distance-nominal)<.007)ring.push(distance);
   }
   assert(ring.length>=12,'Prepared material has a measured ring at the actual requested bore radius.');
   assert(original.bodies[index].volume-body.volume>1,'The bore removes material from both bodies.');
  }
  const files=exportMaterialBodies(manufactured,{name:'verified-pixel-bore'});
  assert.equal(files.stls.length,2);
  assert(files.threeMF.length>100);
 }
 console.log('WT-006 bore: fabricable calibrated radius, strict void/mount/web rejection and dual material exports.');
}

