/* Reference generator: closed, continuous tactile relief on a flat mounting face.
 * Coordinates are millimetres, Y-up. Conversion to slicer Z-up belongs to export.
 * Returned triangles are preview/source geometry until Manifold preparation.
 */
export const tilePatterns = ['grass', 'wool', 'river', 'mineral', 'rain', 'dots'];
export const tileOutlines = ['square', 'rounded', 'circle', 'hexagon'];
const defaults = {width: 80, depth: 80, thickness: 4, cornerRadius: 8,
 outline: 'rounded', pattern: 'grass', relief: 3, density: 5,
 orientation: 0, randomness: 0.2, seed: 42, border: 4, dualMaterial: false};
const ranges = {width: [20, 200], depth: [20, 200], thickness: [2, 20],
 cornerRadius: [0, 40], relief: [0.5, 12], density: [1, 12],
 orientation: [0, 360], randomness: [0, 1], seed: [0, 2147483647], border: [1, 20]};
export function validateTileParameters(input) {
 const p = {...defaults, ...input};
 const errors = [];
 for (const [key, [min, max]] of Object.entries(ranges))
  if (!Number.isFinite(p[key]) || p[key] < min || p[key] > max) errors.push(key + ' must be between ' + min + ' and ' + max + '.');
 if (!tilePatterns.includes(p.pattern)) errors.push('Unknown texture pattern.');
 if (!tileOutlines.includes(p.outline)) errors.push('Unknown tile outline.');
 if (typeof p.dualMaterial !== 'boolean') errors.push('Dual material must be a boolean.');
 if (p.cornerRadius > Math.min(p.width, p.depth) / 2) errors.push('Corner radius exceeds half the smaller tile dimension.');
 if (p.border >= Math.min(p.width, p.depth) / 2) errors.push('Border must leave an interior surface.');
 if (!Number.isInteger(p.seed)) errors.push('Seed must be an integer.');
 return {valid: errors.length === 0, errors, parameters: p};
}
const smooth = x => {const t = Math.max(0, Math.min(1, x)); return t*t*(3-2*t);};
function radial(p, angle) {
 const c = Math.abs(Math.cos(angle)), s = Math.abs(Math.sin(angle));
 const w = p.width/2, d = p.depth/2;
 if (p.outline === 'circle') return 1 / Math.hypot(c/w, s/d);
 if (p.outline === 'hexagon') {
  // An affine regular hexagon, with exact requested width and depth.
  const x = Math.cos(angle)/w, z = Math.sin(angle)/d;
  return 1 / Math.max(Math.abs(z), Math.abs(x) + Math.abs(z)/2);
 }
 const box = Math.min(w/Math.max(c, 1e-12), d/Math.max(s, 1e-12));
 if (p.outline === 'square' || p.cornerRadius === 0) return box;
 const r = p.cornerRadius;
 let low = 0, high = box;
 for (let i = 0; i < 30; i++) {
  const mid = (low + high)/2;
  const qx = c*mid - (w-r), qz = s*mid - (d-r);
  const sdf = Math.hypot(Math.max(qx,0), Math.max(qz,0)) + Math.min(Math.max(qx,qz),0) - r;
  if (sdf <= 0) low = mid; else high = mid;
 }
 return (low+high)/2;
}
function reliefAt(p, x, z, fraction) {
 const a = p.orientation * Math.PI/180, phase = p.seed * 0.001618033989;
 const u = (x*Math.cos(a) + z*Math.sin(a))*p.density/Math.max(p.width,p.depth)*Math.PI*2;
 const v = (-x*Math.sin(a) + z*Math.cos(a))*p.density/Math.max(p.width,p.depth)*Math.PI*2;
 const jitter = p.randomness * Math.sin(u*.73 + phase) * Math.cos(v*.91 - phase);
 let h;
 if (p.pattern === 'grass') h = Math.pow((1+Math.sin(u + Math.sin(v)*.4 + jitter))/2, 3);
 if (p.pattern === 'wool') h = (1+Math.sin(u + Math.sin(v+phase)*1.7+jitter))/2;
 if (p.pattern === 'river') h = (1+Math.sin(v + Math.sin(u*.55+phase)*.6+jitter))/2;
 if (p.pattern === 'mineral') h = .5 + .25*Math.sin(u+jitter) + .25*Math.cos(v*.83+phase);
 if (p.pattern === 'rain') h = Math.pow(Math.max(0, Math.cos(u+jitter)*Math.cos(v+phase)), 4);
 if (p.pattern === 'dots') h = Math.pow(Math.max(0, Math.cos(u)*Math.cos(v)), 2);
 // Raised border transition is continuous and never vanishes to a zero-height
 // secondary shell. It is a full connected contrasting top, not floating islands.
 const edge = smooth((1-fraction) * Math.min(p.width,p.depth)/2 / p.border);
 return p.relief * (.12 + .88*h*edge);
}
function shell(p, bottom, top, {rings=24, segments=96}={}) {
 if (!Number.isInteger(rings) || rings < 4 || rings > 64 ||
  !Number.isInteger(segments) || segments < 24 || segments > 192 || segments%12)
  throw Error('Resolution must use 4–64 rings and 24–192 segments divisible by 12.');
 const points = [], faces = [];
 const add = (x,y,z) => {points.push(x,y,z); return points.length/3-1;};
 const triangle = (a,b,c) => faces.push(a,b,c);
 const centre = add(0,top(0,0,0),0), ringIds = [];
 for (let ring=1; ring<=rings; ring++) {
  const fraction = ring/rings, ids = [];
  for (let i=0; i<segments; i++) {
   const angle = i/segments*Math.PI*2, radius = radial(p,angle)*fraction;
   const x = Math.cos(angle)*radius, z = Math.sin(angle)*radius;
   ids.push(add(x,top(x,z,fraction),z));
  }
  ringIds.push(ids);
 }
 // In the Y-up frame clockwise XZ triangles face upwards.
 for (let i=0; i<segments; i++) triangle(centre,ringIds[0][(i+1)%segments],ringIds[0][i]);
 for (let ring=1; ring<rings; ring++) for (let i=0; i<segments; i++) {
  const j=(i+1)%segments, inner=ringIds[ring-1], outer=ringIds[ring];
  triangle(inner[i],inner[j],outer[j]); triangle(inner[i],outer[j],outer[i]);
 }
 const rim=ringIds.at(-1), baseCentre=add(0,bottom,0), base=[];
 for(let i=0;i<segments;i++) base.push(add(points[rim[i]*3],bottom,points[rim[i]*3+2]));
 for(let i=0;i<segments;i++) {
  const j=(i+1)%segments;
  triangle(baseCentre,base[i],base[j]);
  triangle(rim[i],rim[j],base[j]); triangle(rim[i],base[j],base[i]);
 }
 return {points: new Float32Array(points), triangles: new Uint32Array(faces)};
}
export function generateTile(input, resolution) {
 const checked=validateTileParameters(input);
 if (!checked.valid) throw Error(checked.errors.join(' '));
 const p=checked.parameters;
 const combined=shell(p,0,(x,z,fraction)=>p.thickness+reliefAt(p,x,z,fraction),resolution);
 const bodies=p.dualMaterial ? [
  {role:'primary',mesh:shell(p,0,()=>p.thickness,resolution)},
  {role:'secondary',mesh:shell(p,p.thickness,(x,z,fraction)=>p.thickness+reliefAt(p,x,z,fraction),resolution)}
 ] : [{role:'primary',mesh:combined}];
 return {combined,bodies,parameters:p};
}
export function prepareTile(input, {wasm, resolution}={}) {
 if (!wasm?.Manifold || !wasm?.Mesh) throw Error('A loaded Manifold engine is required.');
 const generated=generateTile(input,resolution), solids=[];
 try {
  for (const body of generated.bodies) {
   const mesh = new wasm.Mesh({numProp:3,vertProperties:body.mesh.points,triVerts:body.mesh.triangles});
   mesh.merge();
   const solid = new wasm.Manifold(mesh); solids.push(solid);
   if (solid.isEmpty() || solid.status() !== 'NoError' || !(solid.volume()>0))
    throw Error('Tactile body did not pass Manifold validation.');
  }
  if (solids.length === 2) {
   const overlap=solids[0].intersect(solids[1]);
   try {if (overlap.volume()>1e-5) throw Error('Material bodies overlap.');}
   finally {overlap.delete();}
  }
  return {report:{ready:true,engine:'Manifold',coordinateFrame:'Y-up',sourceParameters:JSON.stringify(generated.parameters)},bodies:solids.map((solid,i)=>({role:generated.bodies[i].role,
   volume:solid.volume(),mesh:solid.getMesh()})), parameters:generated.parameters};
 } finally {for (const solid of solids) solid.delete();}
}
export const tactileTileGenerator = Object.freeze({
 typeId:'tactile-tiles', typeVersion:1, displayName:'Tactile Texture Tiles', category:'Tactile',
 capabilities:Object.freeze({supportsBase:false,supportsLEDs:false,supportsMounting:false,
  supportsTactileSurfaces:true,supportsMechanisms:false,supportsDualMaterial:true,supportsPartSplitting:false}),
 defaultParameters:Object.freeze({...defaults}),
 parameterSchema:Object.freeze([
  {key:'outline',type:'select',options:tileOutlines,default:defaults.outline},
  {key:'pattern',type:'select',options:tilePatterns,default:defaults.pattern},
  {key:'dualMaterial',type:'boolean',default:false,help:'Separate connected primary plate and contrasting tactile top.'},
  ...Object.entries(ranges).map(([key,[min,max]])=>Object.freeze({
  key,type:'number',min,max,default:defaults[key],
  unit:['width','depth','thickness','cornerRadius','relief','border'].includes(key)?'mm':key==='orientation'?'degrees':''
 }))]),
 presets:Object.freeze(tilePatterns.map(pattern=>Object.freeze({id:pattern,name:pattern,parameters:{...defaults,pattern}}))),
 validateParameters:validateTileParameters, generatePreview:generateTile,
 generateManufacturingGeometry:prepareTile,
 estimateBounds:input=>{const {valid,errors,parameters:p}=validateTileParameters(input);
  if(!valid)throw Error(errors.join(' '));
  return {width:p.width,depth:p.depth,height:p.thickness+p.relief};},
 migrateParameters:(version,input)=>{if(version!==1)throw Error('Unsupported texture generator version.');return {...input};}
});
