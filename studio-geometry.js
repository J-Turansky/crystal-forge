/* Shared solid recipes. Preview components may overlap; only prepareRecipe
 * Boolean results may reach manufacturing exporters. Units mm; Y-up. */
export function recipeGeometry(THREE, part) {
 let geometry;
 if(part.kind==='mesh') {
  geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(part.mesh.points),3));
  geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(part.mesh.triangles),1));
 } else if(part.kind==='sphere') geometry=new THREE.SphereGeometry(1,part.segments||32,20);
 else if(part.kind==='box') geometry=new THREE.BoxGeometry(...part.size);
 else if(part.kind==='cylinder') geometry=new THREE.CylinderGeometry(part.topRadius??part.radius,part.radius,part.height,48);
 else if(part.kind==='extrude') {
  const make=points=>{const path=new THREE.Shape();points.forEach(([x,z],i)=>i?path.lineTo(x,-z):path.moveTo(x,-z));path.closePath();return path;};
  const shape=make(part.outline);
  for(const hole of part.holes||[])shape.holes.push(make(hole));
  geometry=new THREE.ExtrudeGeometry(shape,{depth:part.height,bevelEnabled:false,steps:1,curveSegments:16});
  geometry.rotateX(-Math.PI/2);
 } else throw Error('Unsupported solid primitive: '+part.kind);
 if(part.kind==='sphere')geometry.scale(...part.radii);
 if(part.rotation)geometry.rotateX(part.rotation[0]),geometry.rotateY(part.rotation[1]),geometry.rotateZ(part.rotation[2]);
 if(part.position)geometry.translate(...part.position);
 geometry.computeVertexNormals();return geometry;
}
export function previewRecipe(THREE, recipe, colours=[0x88bbff,0xffcf70]) {
 const group=new THREE.Group();
 for(const [role,parts] of [['primary',recipe.positive],['secondary',recipe.secondary||[]]])for(const part of parts){
  const mesh=new THREE.Mesh(recipeGeometry(THREE,part),new THREE.MeshStandardMaterial({color:colours[role==='primary'?0:1],roughness:.55,flatShading:false}));
  mesh.userData.materialRole=role;group.add(mesh);
 }
 return group;
}
export function disposeGroup(group){group.traverse(node=>{node.geometry?.dispose();if(Array.isArray(node.material))node.material.forEach(m=>m.dispose());else node.material?.dispose();});group.removeFromParent();}
export function prepareRecipe(THREE,wasm,recipe,{onProgress=()=>{}}={}){
 const owned=[];const hold=solid=>(owned.push(solid),solid);
 const convert=part=>{
  if(part.kind==='extrude'){
   // Fabricate from the planar contours rather than welding the display triangulation.
   const contours=[part.outline,...(part.holes||[])].map(loop=>loop.map(([x,z])=>[x,-z]));
   const section=new wasm.CrossSection(contours,'EvenOdd');
   try{
    let solid=hold(section.extrude(part.height));
    solid=hold(solid.rotate([-90,0,0]));
    if(part.rotation)solid=hold(solid.rotate(part.rotation.map(angle=>angle*180/Math.PI)));
    if(part.position)solid=hold(solid.translate(part.position));
    return solid;
   }finally{section.delete();}
  }
  const geometry=recipeGeometry(THREE,part);
  try{
   const positions=new Float32Array(geometry.attributes.position.array);
   const indices=geometry.index?new Uint32Array(geometry.index.array):Uint32Array.from({length:positions.length/3},(_,i)=>i);
   const input=new wasm.Mesh({numProp:3,vertProperties:positions,triVerts:indices});input.merge();
   const solid=hold(new wasm.Manifold(input));
   if(solid.status()!=='NoError'||solid.isEmpty())throw Error('A source component is not a valid closed solid.');
   return solid;
  }finally{geometry.dispose();}
 };
 const union=parts=>{if(!parts.length)throw Error('No model body.');let result=convert(parts[0]);for(const part of parts.slice(1))result=hold(result.add(convert(part)));return result;};
 try{
  onProgress('Joining physical bodies');let total=union(recipe.positive);
  if(recipe.secondary?.length&&!recipe.partitioned)total=hold(total.add(union(recipe.secondary)));
  for(const part of recipe.negative||[])total=hold(total.subtract(convert(part)));
  if(total.status()!=='NoError'||total.isEmpty()||total.volume()<=0)throw Error('Manufacturing produced no valid material.');
  let regions=[{role:'primary',solid:total}];
  if(recipe.dualMaterial&&recipe.secondary?.length){
   let secondary=union(recipe.secondary);
   if(recipe.partitioned){
    for(const part of recipe.negative||[])secondary=hold(secondary.subtract(convert(part)));
   }else secondary=hold(secondary.intersect(total));
   const primary=recipe.partitioned?total:hold(total.subtract(secondary));regions=[{role:'primary',solid:primary},{role:'secondary',solid:secondary}];
  }
  const bodies=regions.map(({role,solid})=>{
   if(solid.status()!=='NoError'||solid.isEmpty()||solid.volume()<=0)throw Error(role+' material is empty or invalid.');
   const parts=solid.decompose();try{if(parts.length!==1)throw Error(role+' contains '+parts.length+' disconnected pieces. Change the design before export.');}finally{parts.forEach(p=>p.delete());}
   return {role,volume:solid.volume(),mesh:solid.getMesh()};
  });
  if(regions.length===2){const overlap=hold(regions[0].solid.intersect(regions[1].solid));if(overlap.volume()>1e-4)throw Error('Material regions overlap.');}
  return {report:{ready:true,engine:'Manifold',coordinateFrame:'Y-up',warnings:recipe.warnings||[]},bodies};
 }finally{owned.reverse().forEach(solid=>solid.delete());}
}
export function circle(radius,segments=64,cx=0,cz=0){return Array.from({length:segments},(_,i)=>[cx+radius*Math.cos(i/segments*Math.PI*2),cz+radius*Math.sin(i/segments*Math.PI*2)]);}
export function heightField(width,depth,surface,segments=48){
 const points=[],triangles=[];const n=segments+1;
 for(let z=0;z<n;z++)for(let x=0;x<n;x++){const px=(x/segments-.5)*width,pz=(z/segments-.5)*depth;points.push(px,surface(px,pz),pz);}
 for(let z=0;z<segments;z++)for(let x=0;x<segments;x++){const a=z*n+x,b=a+1,c=a+n,d=c+1;triangles.push(a,c,b,b,c,d);}
 const rim=[];for(let x=0;x<n;x++)rim.push(x);for(let z=1;z<n;z++)rim.push(z*n+segments);for(let x=segments-1;x>=0;x--)rim.push(segments*n+x);for(let z=segments-1;z>0;z--)rim.push(z*n);
 const base=points.length/3;for(const i of rim)points.push(points[i*3],0,points[i*3+2]);const centre=points.length/3;points.push(0,0,0);
 for(let i=0;i<rim.length;i++){const j=(i+1)%rim.length;triangles.push(rim[i],rim[j],base+j,rim[i],base+j,base+i,centre,base+i,base+j);}
 return {points:new Float32Array(points),triangles:new Uint32Array(triangles)};
}
