/* The inner ellipsoid is kept independent of decorative ridges. Those
 * ridges only add material outside the unadorned shell. */
export function createPodShell({width, depth, height, facets, shellForm, surface, relief}) {
 const sides = Math.max(48, Math.round(facets) * 2);
 const layers = 25;
 const rx = width / 2, rz = depth / 2, ry = height / 2, centre = height * .43;
 const baseLatitude = Math.asin(-centre / ry);
 const vertices = [], faces = [];
 let maxX = 0, maxZ = 0;
 for (let ring = 0; ring < layers; ring++) {
  const latitude = baseLatitude + (Math.PI / 2 - baseLatitude) * ring / layers;
  const y = ring === 0 ? 0 : centre + ry * Math.sin(latitude);
  const radius = Math.cos(latitude);
  const fade = Math.sin(Math.PI * ring / layers) ** 2;
  for (let side = 0; side < sides; side++) {
   const a = side * Math.PI * 2 / sides;
   let form = 0;
   if (shellForm === 'Swept stone') form = .16 * (1 + Math.cos(a + latitude));
   if (shellForm === 'Lantern') {
    const sector = Math.PI / 4;
    const offset = a % sector - sector / 2;
    form = .12 + .9 * (1 / Math.cos(offset) - 1);
   }
   if (shellForm === 'Layered dome') form = .14 * (1 + Math.cos(latitude * 7));
   const texture = surface === 'Ribs' ? (1 + Math.cos(a * 12)) / 2
    : surface === 'Scallops' ? ((1 + Math.cos(a * 8 + latitude * 6)) / 2) ** 2 : 0;
   const scale = radius * (1 + fade * (form + relief * texture));
   const x = rx * scale * Math.cos(a), z = rz * scale * Math.sin(a);
   maxX = Math.max(maxX, Math.abs(x));
   maxZ = Math.max(maxZ, Math.abs(z));
   vertices.push(x, y, z);
  }
 }
 const bottom = vertices.length / 3, tip = bottom + 1, last = (layers - 1) * sides;
 vertices.push(0, 0, 0, 0, centre + ry, 0);
 for (let side = 0; side < sides; side++) {
  const next = (side + 1) % sides;
  faces.push(bottom, side, next, tip, last + next, last + side);
  for (let ring = 0; ring < layers - 1; ring++) {
   const a = ring * sides + side, b = ring * sides + next;
   const c = a + sides, d = b + sides;
   faces.push(a, c, b, b, c, d);
  }
 }
 return {
  kind: 'mesh',
  mesh: {points: new Float32Array(vertices), triangles: new Uint32Array(faces)},
  bounds: {width: maxX * 2, depth: maxZ * 2, height: centre + ry}
 };
}

