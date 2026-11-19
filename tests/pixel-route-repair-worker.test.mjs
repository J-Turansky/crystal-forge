import assert from 'node:assert/strict';
import {repairPixelRouting} from '../pixel-motion.js';
const reports=[];
globalThis.self={postMessage:message=>reports.push(message)};
await import('../pixel-route-repair-worker.js');
assert.equal(typeof self.onmessage,'function','Worker registers its isolated message handler');
const crystals=[{id:'fixture',x:0,y:0,z:0,h:70,r:20,rotation:0,leanX:0,leanZ:0,scale:1,family:'Quartz'}];
const settings={baseType:'integrated',baseStyle:'Circle',baseHeight:25,baseWidth:30,baseDome:0,baseEdgeRadius:0,
 lightingMode:'multi',pixelPlacement:'manual',pixelCount:2,cutSockets:true,pixelDiameter:5,pixelProfileId:'seed',pixelFit:.1,
 manualPixelHoles:[{id:'a',x:-15,z:0,wireAngle:180},{id:'b',x:15,z:0,wireAngle:180}],mount:'None',mountPlacement:'auto',
 wireChannels:true,wireMode:'string',wireWidth:2,wireDepth:1.5,wireMinBendRadius:2,wireSlack:0,pixelStringSpacing:50,
 wireInputTailLength:100,wireOutputTailLength:100};
const original=JSON.stringify(settings);
self.onmessage({data:{serial:1,crystals,settings}});
assert.equal(reports.length,1);
assert.equal(reports[0].serial,1);
const expected=repairPixelRouting(crystals,settings);
assert.equal(reports[0].valid,expected.valid,'Worker matches the actual route solver');
assert.equal(reports[0].reason,expected.reason||null,'Worker preserves solver failure reasoning');
if(expected.valid)assert.deepEqual(reports[0].settings.manualPixelHoles.map(p=>[p.x,p.z]),[[-15,0],[15,0]],
 'Automatic routing must not move accepted pixels');
assert.equal(JSON.stringify(settings),original,'Worker does not mutate source project');
reports.length=0;
self.onmessage({data:{serial:2,crystals:[],settings:null}});
assert.deepEqual([reports[0].serial,reports[0].valid,reports[0].error],[2,false,true],
 'Malformed request returns a failure instead of blocking the UI');
assert.match(reports[0].reason,/Invalid automatic routing request/);
console.log('Automatic route repair worker: real solver, immutable pixels, and safe errors passed.');
