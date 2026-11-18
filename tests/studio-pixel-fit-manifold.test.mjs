import assert from 'node:assert/strict';
import * as THREE from 'three';
import Module from 'manifold-3d';
import {setThreeInstance,makeCalibrationStrip,encodeSTL,save3MF} from '../fabrication-v1.js';
import {pixelFitCouponRequest} from '../studio-pixel-fit.js';

setThreeInstance(THREE);
const wasm=await Module();wasm.setup();
const fitting={profileId:'seed',diameter:5.18,clearance:.28};
for(const kind of ['single','strip']){
 const request=pixelFitCouponRequest(fitting,kind);
 const coupon=makeCalibrationStrip(wasm,request.boreDiameter,{diameters:request.diameters});
 try{
  assert.deepEqual(coupon.diameters,request.diameters);
  assert.equal(coupon.labelsEngraved,request.diameters.length);
  assert(coupon.volumeMm3>0);
  const positions=coupon.geometry.attributes.position.array;
  const span=Math.max(...request.diameters),pitch=Math.max(32,span+20),width=Math.max(28,span+20);
  for(let j=0;j<request.diameters.length;j++){
   const cx=pitch*(j+.5),cz=width/2,r=request.diameters[j]/2;
   const levels=new Set();
   for(let i=0;i<positions.length;i+=3){
    const radius=Math.hypot(positions[i]-cx,positions[i+2]-cz);
    if(Math.abs(radius-r)<1e-4)levels.add(Math.round(positions[i+1]*1e4)/1e4);
   }
   assert(levels.has(0)&&levels.has(5),`The prepared mesh has a true through bore of ${r*2} mm at both faces.`);
  }
  const stl=encodeSTL(coupon.geometry),binary=new DataView(stl.buffer,stl.byteOffset,stl.byteLength);
  assert.equal(binary.getUint32(80,true),coupon.triangles);
  let minZ=Infinity,maxZ=-Infinity;
  for(let face=84;face<stl.length;face+=50)for(let vert=0;vert<3;vert++){
   const z=binary.getFloat32(face+12+vert*12+8,true);
   minZ=Math.min(minZ,z);maxZ=Math.max(maxZ,z);
  }
  assert.deepEqual([minZ,maxZ],[0,5],'STL remains Z-up with the coupon on the bed.');
  if(kind==='single'){
   const original=globalThis.document,anchor={clicked:false,click(){this.clicked=true;}};
   globalThis.document={createElement:()=>anchor};
   try{
    const name=request.filename+'.3mf',blob=save3MF(coupon.geometry,name);
    const zip=await blob.text();
    assert.equal(anchor.download,name);
    assert(anchor.clicked);
    assert(zip.includes('3D/3dmodel.model'));
    assert.match(zip,/<vertex x="[^"]+" y="[^"]+" z="0\.0+"\/>/);
   }finally{globalThis.document=original;}
  }
 }finally{coupon.geometry.dispose();}
}
assert.throws(()=>makeCalibrationStrip(wasm,5,{diameters:[0]}),/between 1.5 and 30.8/);
console.log('Manifold prepared actual single and clearance strip bores, flat Z-up STL and 3MF.');
