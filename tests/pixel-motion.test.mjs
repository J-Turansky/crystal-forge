import assert from 'node:assert/strict';
import {solvePixelMove,setPixelEdgeMode,pixelEdgeMode,orientPixelChain,repairPixelRouting} from '../pixel-motion.js';
import {routingSummary} from '../routing-feedback.js';
import {planHardware} from '../hardware-layout.js';
const crystals=[{id:'fixture',x:0,y:0,z:0,h:70,r:20,rotation:0,leanX:0,leanZ:0,scale:1,family:'Quartz'}];
const settings={baseType:'integrated',baseStyle:'Circle',baseHeight:25,baseWidth:30,baseDome:0,baseEdgeRadius:0,
 lightingMode:'multi',pixelPlacement:'manual',pixelCount:2,cutSockets:true,pixelDiameter:5,pixelProfileId:'seed',pixelFit:.1,
 manualPixelHoles:[{id:'a',x:-15,z:0,wireAngle:0},{id:'b',x:15,z:0,wireAngle:0}],mount:'None',mountPlacement:'auto',
 wireChannels:true,wireMode:'string',wireWidth:2,wireDepth:1.5,wireMinBendRadius:2,wireSlack:0,pixelStringSpacing:50,
 wireInputTailLength:100,wireOutputTailLength:100};
const original=JSON.stringify(settings);
const enabled=setPixelEdgeMode(crystals,settings,'a','input');
assert.equal(JSON.stringify(settings),original,'Solver never mutates the original settings.');
assert(enabled.valid,enabled.reason);
assert.equal(enabled.settings.manualPixelHoles[0].id,'a');
const plan=planHardware(crystals,enabled.settings);assert.equal(plan.wirePlan.ready,true);
assert.equal(pixelEdgeMode(plan,enabled.settings,0),'input');
const moved=solvePixelMove(crystals,enabled.settings,{pixelId:'a',point:{x:-13,z:1}});
assert(moved.valid,moved.reason);assert.equal(moved.settings.manualPixelHoles[0].x,-13);
const impossible=solvePixelMove(crystals,enabled.settings,{pixelId:'a',point:{x:-1000,z:1000}});assert.equal(impossible.valid,false);
assert.equal(setPixelEdgeMode(crystals,settings,'a','both').valid,false);
const short={...enabled.settings,wireInputTailLength:5};
assert.equal(solvePixelMove(crystals,short,{}).valid,false,'Edge tails use a real length bound.');
const opposite=orientPixelChain({...settings,manualPixelHoles:[{id:'a',x:0,z:0},{id:'b',x:10,z:10}]});
assert(Math.abs(opposite.manualPixelHoles[0].wireAngle-45)<1e-8);
const repaired=repairPixelRouting(crystals,{...settings,manualPixelHoles:settings.manualPixelHoles.map(p=>({...p,wireAngle:180}))});
assert(repaired.valid,repaired.reason);
assert.deepEqual(repaired.settings.manualPixelHoles.map(p=>[p.id,p.x,p.z]),settings.manualPixelHoles.map(p=>[p.id,p.x,p.z]),'Repair may turn sockets but never moves them.');
assert.equal(routingSummary(repaired.plan,settings).severity,'success');
const shortPlan=planHardware(crystals,{...settings,pixelStringSpacing:10});
assert.equal(routingSummary(shortPlan,settings).severity,'error');
assert(!routingSummary(shortPlan,settings).title.includes('tangent'));
console.log('Pixel motion: immutable trials, endpoint selection, auto axes and curved length rejection passed.');
