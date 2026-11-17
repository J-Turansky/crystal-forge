import assert from 'node:assert/strict';
import {tilePatterns,tileOutlines,generateTile,validateTileParameters,tactileTileGenerator} from '../tactile-tile-generator.js';
import {createGeneratorRegistry} from '../studio-generator-registry.js';
function topology(mesh) {
 const edges=new Map(); let volume=0;
 const p=mesh.points,t=mesh.triangles;
 for(let i=0;i<t.length;i+=3){
  const [a,b,c]=[t[i],t[i+1],t[i+2]];
  for(const [v,w] of [[a,b],[b,c],[c,a]]){
   const key=Math.min(v,w)+':'+Math.max(v,w);
   const info=edges.get(key)||{count:0,direction:0};
   info.count++;info.direction+=v<w?1:-1;edges.set(key,info);
  }
  const ax=p[a*3],ay=p[a*3+1],az=p[a*3+2],
   bx=p[b*3],by=p[b*3+1],bz=p[b*3+2],
   cx=p[c*3],cy=p[c*3+1],cz=p[c*3+2];
  volume+=(ax*(by*cz-bz*cy)+ay*(bz*cx-bx*cz)+az*(bx*cy-by*cx))/6;
 }
 for(const edge of edges.values()){assert.equal(edge.count,2);assert.equal(edge.direction,0);}
 assert(volume>0); assert([...p].every(Number.isFinite));
 return volume;
}
for(const pattern of tilePatterns)for(const outline of tileOutlines){
 const input={pattern,outline,dualMaterial:true};
 const a=generateTile(input,{rings:8,segments:48});
 const b=generateTile(input,{rings:8,segments:48});
 assert.deepEqual(a,b);
 const whole=topology(a.combined);
 const primary=topology(a.bodies[0].mesh),secondary=topology(a.bodies[1].mesh);
 assert(Math.abs(whole-primary-secondary)<.01);
 const primaryTop=Math.max(...a.bodies[0].mesh.points.filter((_,i)=>i%3===1));
 const secondaryBottom=Math.min(...a.bodies[1].mesh.points.filter((_,i)=>i%3===1));
 assert.equal(primaryTop,secondaryBottom);
}
assert.equal(validateTileParameters({width:NaN}).valid,false);
assert.equal(validateTileParameters({thickness:0}).valid,false);
assert.equal(validateTileParameters({outline:'missing'}).valid,false);
assert.equal(validateTileParameters({width:20,depth:20,cornerRadius:30}).valid,false);
assert.throws(()=>generateTile({width:0}));
assert.throws(()=>generateTile({}, {rings:100,segments:24}));
assert.notDeepEqual(generateTile({pattern:'river',seed:42}),generateTile({pattern:'river',seed:43}));
const registry=createGeneratorRegistry();registry.register(tactileTileGenerator);
assert.equal(registry.get('tactile-tiles'),tactileTileGenerator);
assert.throws(()=>registry.register(tactileTileGenerator));
assert.throws(()=>registry.get('unavailable'));
assert.throws(()=>registry.register({typeId:'placeholder'}));
console.log('Tactile source meshes: 24 outline/pattern combinations, determinism, closed topology and material partitions passed.');
