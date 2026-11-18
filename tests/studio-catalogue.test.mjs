import assert from 'node:assert/strict';
import * as THREE from 'three';
import Module from 'manifold-3d';
import {capGenerator,generators,applyBuildModules} from '../studio-catalogue.js';
import {prepareRecipe} from '../studio-geometry.js';
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
