import {makeRoutedSocketSpecimen} from '../studio-catalogue.js';
import {PIXEL_PRESETS} from '../pixel-profiles.js';
import {pixelBoreIssue} from '../studio-pixel-bore-validation.js';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import Module from 'manifold-3d';
import {waveGenerator,tileGenerator,gearGenerator,capGenerator,characterGenerator,pebbleGenerator,generators,applyBuildModules} from '../studio-catalogue.js';
import {findPixelPosition,newPixel} from '../studio-pixel-builder.js';
import {planNativePixelString} from '../studio-native-routing.js';
import {previewRecipe,disposeGroup,prepareRecipe,nativeFittingPreviews} from '../studio-geometry.js';
import {exportMaterialBodies,preparedDimensionsMm} from '../studio-material-export.js';
const wasm=await Module();wasm.setup();
// Independently read both exports of an asymmetric, translated solid.
{
 const fixture=prepareRecipe(THREE,wasm,{positive:[{kind:'box',size:[37,11,23],position:[8,9,-5]}],negative:[],secondary:[]});
 const {stls,threeMF}=exportMaterialBodies(fixture);
 const expected=[37,23,11],bounds=points=>[0,1,2].map(axis=>{
  const coords=points.map(p=>p[axis]);return Math.max(...coords)-Math.min(...coords);
 });
 assert.deepEqual(preparedDimensionsMm(fixture),expected);
 const stl=Buffer.from(stls[0].bytes),vertices=[];
 for(let face=0;face<stl.readUInt32LE(80);face++)for(let i=0;i<3;i++){
  const offset=96+face*50+i*12;
  vertices.push([0,4,8].map(axis=>stl.readFloatLE(offset+axis)));
 }
 assert.deepEqual(bounds(vertices),expected);
 const zip=Buffer.from(threeMF);
 let model;
 for(let i=0;zip.readUInt32LE(i)===0x04034b50;){
  const nameLength=zip.readUInt16LE(i+26),start=i+30+nameLength+zip.readUInt16LE(i+28),size=zip.readUInt32LE(i+18);
  if(zip.toString('utf8',i+30,i+30+nameLength)==='3D/3dmodel.model'){
   assert.equal(zip.readUInt16LE(i+8),0);
   model=zip.toString('utf8',start,start+size);break;
  }
  i=start+size;
 }
 assert.match(model,/<model unit="millimeter"/);
 assert.match(model,/<item objectid="2" transform="1 0 0 0 1 0 0 0 1 0 0 0"/);
 assert.deepEqual(bounds([...model.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"\/>/g)].map(m=>m.slice(1).map(Number))),expected);
 console.log('Prepared, STL and 3MF fixture bounds agree: 37 x 23 x 11 mm');
}
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


// FIT-02: Gear top and Tile underside share the production Manifold cutter,
// its physical positive profile and the same placement transform as Print.
{
 const gumdrop=PIXEL_PRESETS.find(item=>item.id==='gumdrop');
 const configs=[
  {type:'Gear top',family:gearGenerator,params:{diameter:80,bore:0,thickness:25,
   wheelStyle:'Cam',dualMaterial:false},
   profile:{...gumdrop,retentionLip:0},face:{y:25,normal:[0,1,0]}},
  {type:'Tile underside',family:tileGenerator,params:{pattern:'terraces',width:90,
   depth:90,thickness:20,relief:2,dualMaterial:false},
   // A smaller REAL profile fits this thinner tile. A 22 mm gumdrop
   // must be rejected without additional material and is not pretended to fit.
   profile:{...gumdrop,bodyHeight:14,capHeight:2,flangeHeight:2,retentionLip:0},face:null}
 ];
 for(const fixture of configs){
  const source=fixture.family.recipe(fixture.params);
  assert.equal(source.negative?.length||0,0,fixture.type+' test needs isolated stock');
  const hole={id:'physical-preview',x:0,z:0,diameter:fixture.profile.bodyDiameter,clearance:.15,
   checked:true,rotation:17,entryFace:fixture.face?'top':'underside',profileId:'gumdrop',
   socketProfile:fixture.profile,...(fixture.face?{surface:fixture.face}:{})};
  const recipe=applyBuildModules(source,{pixelBuilderVersion:1,pixelHoles:[hole]},fixture.family.capabilities);
  const previews=nativeFittingPreviews(THREE,wasm,recipe);
  assert.equal(previews.length,1,fixture.type+' displays one real profile fitting');
  const preview=previews[0];
  assert.equal(preview.pixelId,'physical-preview');
  assert.equal(preview.insertionDepth,fixture.profile.bodyHeight);
  assert(preview.positive.triVerts.length>0&&preview.negative.triVerts.length>0);
  assert([preview.exposedVolume,preview.collisionVolume,preview.nominalRoofAllowance].every(Number.isFinite));
  const stock=prepareRecipe(THREE,wasm,{...recipe,negative:[],nativeRouting:null});
  const finished=prepareRecipe(THREE,wasm,recipe);
  const blankSolid=new wasm.Manifold(stock.bodies[0].mesh);
  const negativeSolid=new wasm.Manifold(preview.negative);
  const positiveSolid=new wasm.Manifold(preview.positive);
  const expected=blankSolid.subtract(negativeSolid);
  const missingEnvelope=positiveSolid.subtract(negativeSolid);
  try{
   const expectedVolume=expected.volume(),manufacturedVolume=finished.bodies[0].volume;
   assert(Math.abs(expectedVolume-manufacturedVolume)<.02,
    fixture.type+' preview negative must be same Boolean cutter and pose as manufactured model');
   assert(missingEnvelope.volume()<.02,
    fixture.type+' actual production socket must enclose the full positive pixel; mismatch volume '+missingEnvelope.volume().toFixed(5)+' mm³, positive '+positiveSolid.volume().toFixed(5)+' mm³, cutter '+negativeSolid.volume().toFixed(5)+' mm³');
  }finally{missingEnvelope.delete();expected.delete();positiveSolid.delete();negativeSolid.delete();blankSolid.delete();}
 }
 console.log('FIT-02 native Gear top/Tile underside positive and negative overlays match manufactured cutter');
}
const checked=(id,x,z=0,rotation=0)=>({id,x,z,rotation,checked:true,diameter:5,clearance:.3,profileId:'seed'});
const serial={version:1,enabled:true,pitch:50,tail:200};

/* WT-021 AUD-02: socket fit tolerance is *not* an independent wire-width knob.
 * A changed body-bore clearance must never alter the channel's usable width.
 * The physical relief F or explicit channelWidthMm governs that dimension. */
{
 const recipe=gearGenerator.recipe({mode:'Decorative',wheelStyle:'Rounded lobes',
  webStyle:'Solid',bore:0,diameter:100,teeth:12,thickness:8});
 const build=(boreClearance,physicalWireWidth=5.5,requestedWireWidth=2.5)=>({
  pixelHoles:[checked('wire-a',-15),checked('wire-b',15)].map(hole=>({
   ...hole,clearance:boreClearance,entryFace:'underside',
   socketProfile:{wireWidth:physicalWireWidth,wireDepth:1.8}
  })),
  serialRouting:{...serial,channelWidthMm:requestedWireWidth}
 });
 const tight=planNativePixelString(recipe,build(.1));
 const loose=planNativePixelString(recipe,build(.5));
 assert.equal(tight.channelWidthMm,5.5);
 assert.equal(loose.channelWidthMm,tight.channelWidthMm,
  'Changing socket diametral fit clearance must not change the actual routed wire width');
 assert.equal(planNativePixelString(recipe,build(.1,6)).channelWidthMm,6,
  'Changing measured physical wire relief F must change the minimum route width');
 assert.equal(planNativePixelString(recipe,build(.1,5.5,7)).channelWidthMm,7,
  'An independently requested wider wire channel must be respected');
 console.log('WT-021 native route width stays independent from body-bore clearance');
}
const tileRoute=tileGenerator.recipe({pattern:'terraces',width:84,depth:76,thickness:5});
const gearRoute=gearGenerator.recipe({mode:'Decorative',wheelStyle:'Rounded lobes',webStyle:'Solid',bore:0,diameter:100,teeth:12,thickness:8});
for(const [recipe,family] of [[tileRoute,tileGenerator],[gearRoute,gearGenerator]]){
 for(const count of [1,2,3]){
  const pixelHoles=Array.from({length:count},(_,i)=>checked('led-'+i,.37+(i-(count-1)/2)*25,1.23));
  const build={pixelHoles,pixelBuilderVersion:1};
  const bored=prepareRecipe(THREE,wasm,applyBuildModules(recipe,build,family.capabilities));
  const routedRecipe=applyBuildModules(recipe,{...build,serialRouting:{...serial,pitch:25}},family.capabilities);
  assert.equal(routedRecipe.nativeRouting.links.length,count+1);
  assert.match(routedRecipe.nativeRouting.links[0].label,/EDGE IN/);
  assert.match(routedRecipe.nativeRouting.links.at(-1).label,/EDGE OUT/);
  const routed=prepareRecipe(THREE,wasm,routedRecipe);
  assert(bored.bodies[0].volume-routed.bodies[0].volume>100);
  const mesh=routed.bodies[0].mesh;
  const vertices=mesh.vertProperties||mesh.points,stride=mesh.numProp||3;
  const ceilingVertices=[];
  for(let i=0;i<vertices.length;i+=stride)if(Math.abs(vertices[i+1]-1.8)<1e-4)ceilingVertices.push(vertices[i]);
  assert(Math.min(...ceilingVertices)<-30&&Math.max(...ceilingVertices)>30,'Channel ceiling reaches both external sides.');
  console.log('WT-012 routed export:',family.typeId,count);
  const output=exportMaterialBodies(routed,{name:family.typeId+'-routed'});
  assert.equal(output.stls.length,1);assert(output.threeMF.length>100);
 }
}
for(const recipe of [tileRoute,gearRoute]){
 const build={pixelHoles:[checked('left',-15),checked('right',15)],pixelBuilderVersion:1,serialRouting:serial};
 const planned=applyBuildModules(recipe,build).nativeRouting;
 assert.equal(planned.ready,true);
 assert.equal(planned.links[1].label,'P1 → P2');
 assert.deepEqual(applyBuildModules(recipe,JSON.parse(JSON.stringify(build))).nativeRouting,planned);
 const short={...build,serialRouting:{...serial,pitch:25}};
 assert.match(applyBuildModules(recipe,short,{}, {preview:true}).nativeRouting.links[1].reason,/Cable budget/);
 assert.throws(()=>applyBuildModules(recipe,short),/P1 → P2: Cable budget exceeded/);
 assert.throws(()=>applyBuildModules(recipe,{...build,mounting:true},{supportsMounting:true}),/mounting cuts/);
}
// The selected opening changes the viewport marker, while both openings
// are machined by the same through-bore and route cutters.
{
 const pixelHoles=[checked('left',-15),checked('right',15)];
 const prepare=entryFace=>applyBuildModules(gearRoute,{
  pixelBuilderVersion:1,serialRouting:serial,pixelHoles:pixelHoles.map(hole=>({...hole,entryFace}))
 },gearGenerator.capabilities);
 const top=prepare('top'),underside=prepare('underside');
 assert.equal(underside.negative.find(part=>part.pixelHole).pixelEntryFace,'underside');
 assert.deepEqual(top.nativeRouting,underside.nativeRouting);
 const topBody=prepareRecipe(THREE,wasm,top);
 const undersideBody=prepareRecipe(THREE,wasm,underside);
 assert.equal(topBody.bodies[0].volume,undersideBody.bodies[0].volume);
 const output=exportMaterialBodies(undersideBody,{name:'gear-underside'});
 assert.equal(output.stls.length,1);
 assert(output.threeMF.length>100);
}
const curveBuild={pixelHoles:[checked('left',-15),checked('right',15,2)],pixelBuilderVersion:1,serialRouting:serial};
const curvePlan=applyBuildModules(tileRoute,curveBuild).nativeRouting;
const flatStock={bounds:{width:70,depth:40,height:10},
 positive:[{kind:'box',size:[70,10,40],position:[0,5,0]}],negative:[],
 serialSupport:{outline:[[-35,-20],[35,-20],[35,20],[-35,20]],thickness:10}};
const flatBuild={...curveBuild,pixelHoles:[checked('left',-15),checked('right',15)],serialRouting:serial};
const automatic=applyBuildModules(flatStock,flatBuild).nativeRouting;
const pinnedBuild={...flatBuild,serialRouting:{...serial,inEdgePercent:automatic.edgePositions.in-2,outEdgePercent:automatic.edgePositions.out+2}};
const pinned=applyBuildModules(flatStock,pinnedBuild);
assert.equal(pinned.nativeRouting.cutters.length,3,'Pinned openings retain both exterior cutters');
assert(pinned.nativeRouting.links[0].path.length>2,'Offset IN is a smooth curved path');
assert(prepareRecipe(THREE,wasm,pinned).bodies[0].volume>0);
assert.throws(()=>applyBuildModules(flatStock,{...pinnedBuild,serialRouting:{...serial,inEdgePercent:100}}),/Chosen IN edge/);
const guideBuild={...curveBuild,serialRouting:{...serial,enabled:false}};
const guideRecipe=applyBuildModules(tileRoute,guideBuild,{},{preview:true});
const boreOnly=applyBuildModules(tileRoute,guideBuild);
assert.equal(guideRecipe.nativeRouting.enabled,false);
assert.deepEqual(guideRecipe.nativeRouting.links,curvePlan.links);
assert.deepEqual(guideRecipe.nativeRouting.cutters,[]);
assert.deepEqual(guideRecipe.negative,boreOnly.negative);
assert.equal(boreOnly.nativeRouting.links.length,0);
assert(curvePlan.links[1].path.length>2);
const shortTail=applyBuildModules(tileRoute,{...curveBuild,serialRouting:{...serial,inTail:5,outTail:100}}, {},{preview:true}).nativeRouting;
assert.match(shortTail.links[0].reason,/Cable budget/);assert.equal(shortTail.links.at(-1).reason,'');
assert(curvePlan.links[1].measure>Math.hypot(30,2));
assert.throws(()=>applyBuildModules(tileRoute,{...curveBuild,serialRouting:{...serial,pitch:25}}),/Cable budget exceeded/);
assert.throws(()=>applyBuildModules(tileRoute,{...curveBuild,pixelHoles:[...curveBuild.pixelHoles].reverse()}),/tangent-compatible/);
assert.throws(()=>applyBuildModules(tileGenerator.recipe({thickness:2}),curveBuild),/3.8 mm/);
assert.throws(()=>applyBuildModules(gearGenerator.recipe(turbine),{serialRouting:serial}),/solid decorative/);
assert.throws(()=>applyBuildModules(pebbleGenerator.recipe(river.parameters),{serialRouting:serial}),/fitting backing/);
assert.throws(()=>applyBuildModules(gearRoute,{...curveBuild,mounting:true}),/mounting cuts/);
const curved=prepareRecipe(THREE,wasm,applyBuildModules(tileRoute,curveBuild));
assert.equal(curved.report.nativeRouting.channels.length,3);
assert(exportMaterialBodies(curved).threeMF.length>100);
for(const [family,ids,baseline] of [[tileGenerator,['terraces','quilt'],'grass'],[gearGenerator,['forked-sun','forked-rotor'],'turbine'],[pebbleGenerator,['beacon-tall','beacon-low'],'lantern']]){
 const volumes=[baseline,...ids].map(id=>{
  const preset=family.presets.find(item=>item.id===id);
  return Math.round(prepareRecipe(THREE,wasm,family.recipe(preset.parameters)).bodies[0].volume);
 });
 assert.equal(new Set(volumes).size,3);
}
console.log('WT-012 catalogue and native serial channel fabrication passed.');

// WT-017: certified, real cut geometry and STL/3MF exports for all six
// non-Crystal families. Original Crystal hardware regressions run separately.
const fittingCases=[
 [tileGenerator,{pattern:'grass',dualMaterial:false},{}],
 [gearGenerator,{mode:'Decorative',webStyle:'Solid',bore:0,spokes:0,extraHoles:0,dualMaterial:false},{}],
 [waveGenerator,{flowStyle:'Parallel',dualMaterial:false},{}],
 [capGenerator,{controlStyle:'Pushbutton',shaft:0,dualMaterial:false},{}],
 [characterGenerator,{character:'Cloud',construction:'Classic',dualMaterial:false},{}],
 [pebbleGenerator,{illuminated:false,dualMaterial:false},{pixelBacking:true}]
];
for(const [family,parameters,options] of fittingCases){
 const source=family.recipe(parameters);
 const base=applyBuildModules(source,{...options,pixelBuilderVersion:1,pixelHoles:[]},family.capabilities);
 const profile={id:'custom-wt017',bodyDiameter:4.5},pixel=findPixelPosition(base,[],profile);
 assert(pixel,family.typeId+' should offer a certifiably printable placement (explicit backing on Pod).');
 const hole={...pixel,checked:true};
 assert.equal(pixelBoreIssue(base,hole),null,family.typeId+' needs a verified solid column');
 const made=applyBuildModules(source,{...options,pixelBuilderVersion:1,pixelHoles:[hole]},family.capabilities);
 assert.equal(made.negative.filter(part=>part.pixelHole).length,1);
 const empty=prepareRecipe(THREE,wasm,base),bored=prepareRecipe(THREE,wasm,made);
 const before=empty.bodies.reduce((n,body)=>n+body.volume,0);
 const after=bored.bodies.reduce((n,body)=>n+body.volume,0);
 assert(before-after>.1,family.typeId+' fitting must subtract actual material');
 const files=exportMaterialBodies(bored,{name:'wt017-'+family.typeId});
 assert(files.stls.length>=1&&files.threeMF.length>100,family.typeId+' needs valid exported STL and 3MF');
}
assert.match(pixelBoreIssue(pebbleGenerator.recipe({illuminated:false}),newPixel({id:'seed',bodyDiameter:5})),/cavity|unavailable|solid/);
// WT-020: every native family makes an actual, validated M1 through-hole
// using the same verified solid-column source as pixel bores. No mock preview.
for(const [family,parameters,options] of fittingCases){
 const source=family.recipe(parameters),build={...options,pixelBuilderVersion:1,pixelHoles:[]};
 const uncut=applyBuildModules(source,build,family.capabilities);
 const target=findPixelPosition(uncut,[],{id:'seed',bodyDiameter:5});
 assert(target,family.typeId+' must expose solid stock for a certified mount');
 const mount={id:'m-'+family.typeId,x:target.x,z:target.z,diameter:3.4,entryFace:'top'};
 const cut=applyBuildModules(source,{...build,manualMountHoles:[mount]},family.capabilities);
 assert.equal(cut.negative.filter(part=>part.mountHole).length,1,family.typeId+' has actual cutter');
 const visible=previewRecipe(THREE,cut);
 assert.equal(visible.children.filter(part=>part.userData.mountId).length,1,'Mount marker must match saved M1');
 disposeGroup(visible);
 const before=prepareRecipe(THREE,wasm,uncut).bodies.reduce((total,body)=>total+body.volume,0);
 const printed=prepareRecipe(THREE,wasm,cut);
 const after=printed.bodies.reduce((total,body)=>total+body.volume,0);
 assert(before-after>.1,family.typeId+' mount must subtract actual printable material');
 const files=exportMaterialBodies(printed,{name:'wt020-mount-'+family.typeId});
 assert(files.stls.length&&files.threeMF.length>100,'Mount persists in real STL/3MF export');
 assert.throws(()=>applyBuildModules(source,{...build,manualMountHoles:[mount],
  pixelHoles:[{...target,checked:true}]},family.capabilities),/another pixel|mount|close/i,
  family.typeId+' must reject overlapping LED and mount');
}
console.log('WT-020 native family mounting through-holes: actual Manifold volume, markers, STL/3MF and collision guards passed.');

console.log('WT-017 native family actual bores and export passed; Crystal checked by original hardware fixtures.');

// WT-021: real external fixing tabs on an explicitly enabled stationary backing.
for(const [family,parameters] of fittingCases){
 const source=family.recipe(parameters),build={pixelBacking:true};
 const backing=applyBuildModules(source,build,family.capabilities);
 const backingTabs=[{u:.125},{u:.625}];
 const recipe=applyBuildModules(source,{...build,backingTabs},family.capabilities);
 assert.equal(recipe.positive.length,backing.positive.length+2);
 assert.equal(recipe.negative.filter(cut=>cut.tabHole).length,2);
 assert(recipe.bounds.width>backing.bounds.width||recipe.bounds.depth>backing.bounds.depth);
 const before=prepareRecipe(THREE,wasm,backing);
 const after=prepareRecipe(THREE,wasm,recipe);
 assert.equal(after.bodies.length,1);
 assert(after.bodies[0].volume>before.bodies[0].volume+1);
 const files=exportMaterialBodies(after);
 assert(files.stls.length===1&&files.threeMF.length>100);
 assert.throws(()=>applyBuildModules(source,{...build,backingTabs:[{u:.125},{u:.125}]},family.capabilities),/overlapping/);
 assert.throws(()=>applyBuildModules(source,{backingTabs},family.capabilities),/stationary fitting backing/);
}
// Single-material Tiles have separate fitting-backing capability from legacy base.
assert.equal(tileGenerator.capabilities.supportsBase,false);
assert.equal(tileGenerator.capabilities.supportsStationaryFittingBacking,true);
assert.throws(()=>applyBuildModules(tileGenerator.recipe({pattern:'grass',dualMaterial:true}),
 {pixelBacking:true,backingTabs:[{u:.125}]},tileGenerator.capabilities),
 /stationary single-material|dual-material/);
assert.throws(()=>applyBuildModules(tileGenerator.recipe({pattern:'grass',dualMaterial:false}),
 {backingTabs:[{u:.125}]},tileGenerator.capabilities),
 /stationary fitting backing/);
console.log('WT-021 attached backing tabs: six native families, volume, union, fixing cuts and STL/3MF.');

const extendedRouting=[
 [waveGenerator,{flowStyle:'Parallel',dualMaterial:false},false],
 [capGenerator,{controlStyle:'Pushbutton',shaft:0,dualMaterial:false},true],
 [characterGenerator,{character:'Cloud',construction:'Classic',dualMaterial:false},true],
 [pebbleGenerator,{illuminated:false,dualMaterial:false},true]
];
for(const [family,parameters,pixelBacking] of extendedRouting){
 const source=family.recipe(parameters),build={pixelBacking,pixelBuilderVersion:1,pixelHoles:[]};
 const backing=applyBuildModules(source,build,family.capabilities);
 const hole=findPixelPosition(backing,[],{id:'seed',bodyDiameter:5});
 assert(hole,family.typeId+' has a verified fitting position');
 build.pixelHoles=[{...hole,rotation:0,checked:true}];
 const before=prepareRecipe(THREE,wasm,applyBuildModules(source,build,family.capabilities));
 const recipe=applyBuildModules(source,{...build,serialRouting:serial},family.capabilities);
 const after=prepareRecipe(THREE,wasm,recipe);
 assert.equal(after.report.nativeRouting.channels.length,2);
 assert(before.bodies[0].volume-after.bodies[0].volume>10);
 const files=exportMaterialBodies(after);
 assert(files.stls.length&&files.threeMF.length>100);
}
assert.throws(()=>applyBuildModules(pebbleGenerator.recipe({illuminated:true,dualMaterial:false}),{
 pixelBacking:true,serialRouting:serial
},pebbleGenerator.capabilities),/Existing cavities/);
assert.throws(()=>applyBuildModules(capGenerator.recipe({shaft:8,dualMaterial:false}),{
 pixelBacking:true,serialRouting:serial
},capGenerator.capabilities),/Existing cavities/);

const vaultedSpecimen=makeRoutedSocketSpecimen(PIXEL_PRESETS[0],{vaulted:true,channelWidthMm:6});
assert.equal(vaultedSpecimen.nativeRouting.cutters.length,3);
assert.equal(vaultedSpecimen.nativeRouting.channelWidthMm,6);
for(const {mesh} of vaultedSpecimen.nativeRouting.cutters){
 assert(mesh.points[10]>mesh.points[7],'Roof rises above the original usable channel depth');
 assert(mesh.points[7]>0,'Rectangular usable section is preserved');
 assert(Math.abs(Math.hypot(mesh.points[3]-mesh.points[0],mesh.points[5]-mesh.points[2])-6)<1e-6,'Actual cutter entry width is 6 mm');
}
assert(prepareRecipe(THREE,wasm,vaultedSpecimen).bodies.length>0,'Vaulted routed specimen prepares with Manifold');
const routeSpecimen=makeRoutedSocketSpecimen(PIXEL_PRESETS[0],{clearance:.15,retentionLip:.2});
assert.equal(routeSpecimen.negative.filter(part=>part.kind==='pixel-seat').length,2);
assert.equal(routeSpecimen.negative.filter(part=>part.wireChannel).length,3);
const routedSocketMesh=prepareRecipe(THREE,wasm,routeSpecimen);
assert.equal(routedSocketMesh.bodies.length,1);
assert(routedSocketMesh.bodies[0].volume<70*40*26-1000);
const routedSocketFiles=exportMaterialBodies(routedSocketMesh);
assert(routedSocketFiles.stls[0].bytes.length>84&&routedSocketFiles.threeMF.length>100);
const thinSocket={...routeSpecimen,positive:[{kind:'box',size:[70,10,40],position:[0,5,0]}]};
assert.throws(()=>prepareRecipe(THREE,wasm,thinSocket),/continuous underside stock/);

const specimenSolid=routedSocketMesh.bodies[0].mesh;
const specimenGeometry=new THREE.BufferGeometry();
const specimenPositions=[];
for(let i=0;i<specimenSolid.vertProperties.length;i+=specimenSolid.numProp)
 specimenPositions.push(...specimenSolid.vertProperties.subarray(i,i+3));
specimenGeometry.setAttribute('position',new THREE.Float32BufferAttribute(specimenPositions,3));
specimenGeometry.setIndex(Array.from(specimenSolid.triVerts));
const specimenMaterial=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
const specimenMesh=new THREE.Mesh(specimenGeometry,specimenMaterial);
const pathRay=new THREE.Raycaster(new THREE.Vector3(-36,.8,0),new THREE.Vector3(1,0,0),0,72);
assert.equal(pathRay.intersectObject(specimenMesh).length,0,'The printed route is open across IN, both seats and OUT');
const undersideRoof=new THREE.Raycaster(new THREE.Vector3(0,-1,0),new THREE.Vector3(0,1,0));
assert(Math.abs(undersideRoof.intersectObject(specimenMesh)[0].point.y-2)<.01,'The groove is recessed 2 mm and has a roof');
specimenGeometry.dispose();specimenMaterial.dispose();

const sourceSeat=routeSpecimen.negative.find(part=>part.kind==='pixel-seat');
const faceBlock={...routeSpecimen,nativeRouting:null,positive:[{kind:'box',size:[70,30,40],position:[0,15,0]}]};
const topSeat={...sourceSeat,position:[0,0,0],surface:{y:30,normal:[0,1,0]}};
const sideSeat={...sourceSeat,position:[35,0,0],surface:{y:15,normal:[1,0,0]}};
const solidBlock=prepareRecipe(THREE,wasm,{...faceBlock,negative:[]}).bodies[0];
for(const seat of [topSeat,sideSeat]){
 const prepared=prepareRecipe(THREE,wasm,{...faceBlock,negative:[seat]});
 assert.equal(prepared.bodies.length,1);
 assert(solidBlock.volume-prepared.bodies[0].volume>1000);
 const mesh=prepared.bodies[0].mesh,p=mesh.vertProperties,n=mesh.numProp;
 const [x,,z]=seat.position,{y,normal}=seat.surface;
 const points=Array.from({length:p.length/n},(_,i)=>new THREE.Vector3(...p.subarray(i*n,i*n+3)));
 assert(points.some(point=>{
  const delta=point.clone().sub(new THREE.Vector3(x,y,z));
  const depth=-delta.dot(new THREE.Vector3(...normal));
  return depth>20&&depth<23&&delta.length()<24;
 }),'The dome is cut inward from the installation face');
 assert(exportMaterialBodies(prepared).threeMF.length>100);
}
assert.throws(()=>prepareRecipe(THREE,wasm,{...faceBlock,negative:[{...topSeat,surface:{y:10,normal:[0,1,0]}}]}),
 /obstructed insertion opening/);
