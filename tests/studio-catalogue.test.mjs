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
