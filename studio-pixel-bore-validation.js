// Through-bore certificates use the same millimetre X/Z coordinate frame as
// fabrication. A hole plus its surrounding web must fit in one solid column.
const web = 1;
const minimumThickness = 2;
const tolerance = .0001;
const boreRadius = hole => (hole.diameter + hole.clearance) / 2;
const validHole = hole => hole && [hole.x, hole.z, hole.diameter, hole.clearance].every(Number.isFinite) &&
 hole.diameter >= 2 && hole.diameter <= 30 && hole.clearance >= -.5 && hole.clearance <= .8;

function diskVsContour(contour, x, z, radius) {
 let inside = false;
 for (let i = 0, j = contour.length - 1; i < contour.length; j = i++) {
  const [ax, az] = contour[j], [bx, bz] = contour[i];
  const dx = bx - ax, dz = bz - az, length = dx * dx + dz * dz;
  const t = length ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / length)) : 0;
  if (Math.hypot(x - ax - t * dx, z - az - t * dz) <= radius) return 'touching';
  if ((az > z) !== (bz > z) && x < (bx - ax) * (z - az) / (bz - az) + ax) inside = !inside;
 }
 return inside ? 'inside' : 'outside';
}

function certifiedPart(part, x, z, margin) {
 const [px, , pz] = part.position || [0, 0, 0];
 x -= px;
 z -= pz;
 if (part.rotation?.some(Boolean)) return false;
 if (part.kind === 'extrude') return part.height >= minimumThickness &&
  diskVsContour(part.outline, x, z, margin) === 'inside' &&
  (part.holes || []).every(contour => diskVsContour(contour, x, z, margin) === 'outside');
 if (part.kind === 'box') return part.size[1] >= minimumThickness &&
  Math.abs(x) + margin <= part.size[0] / 2 && Math.abs(z) + margin <= part.size[2] / 2;
 return false;
}

function cutMayIntersect(part, x, z, margin) {
 const [px, , pz] = part.position || [0, 0, 0];
 x -= px;
 z -= pz;
 const rotated = part.rotation?.some(Boolean);
 if (part.kind === 'cylinder') {
  const r = Math.max(part.radius, part.topRadius ?? part.radius);
  return Math.hypot(x, z) <= margin + (rotated ? Math.hypot(r, part.height / 2) : r);
 }
 if (part.kind === 'sphere') {
  // Circumscribed circular projection also covers faceted or rotated cutters.
  const r = rotated ? Math.max(...part.radii) : Math.max(part.radii[0], part.radii[2]);
  return Math.hypot(x, z) <= margin + r;
 }
 if (part.kind === 'box') {
  if (rotated) return Math.hypot(x, z) <= margin + Math.hypot(...part.size) / 2;
  return Math.hypot(Math.max(0, Math.abs(x) - part.size[0] / 2), Math.max(0, Math.abs(z) - part.size[2] / 2)) <= margin;
 }
 if (part.kind === 'extrude' && !rotated) {
  return diskVsContour(part.outline, x, z, margin) !== 'outside' &&
   !(part.holes || []).some(contour => diskVsContour(contour, x, z, margin) === 'inside');
 }
 // Never promise clearance from a cutter whose full projection is unknown.
 return true;
}

export function pixelBoreIssue(recipe, hole, otherHoles = []) {
 if (!validHole(hole)) return 'Enter numeric X/Z, a 2-30 mm diameter and -0.5 to 0.8 mm clearance.';
 if (!recipe?.bounds) return 'This model has no verified LED fitting surface.';
 const {x, z} = hole, {width, depth} = recipe.bounds;
 const margin = boreRadius(hole) + web + tolerance;
 if (Math.abs(x) + margin > width / 2 || Math.abs(z) + margin > depth / 2)
  return 'The bore needs at least 1 mm of material between it and the model edge.';
 if (otherHoles.some(other => !validHole(other) || Math.hypot(x - other.x, z - other.z) < margin + boreRadius(other)))
  return 'The bore overlaps or needs more clearance from another pixel.';
 if ((recipe.negative || []).some(part => cutMayIntersect(part, x, z, margin)))
  return 'The bore is too close to a mount, cavity, cable opening or other existing cut.';
 const support = recipe.pixelBoreSupport;
 if (support?.minThickness >= minimumThickness && diskVsContour(support.outline, x, z, margin) === 'inside') return null;
 const parts = recipe.positive || [];
 if (parts.some(part => certifiedPart(part, x, z, margin))) return null;
 const hasCertifiedPrimitive = parts.some(part => !part.rotation?.some(Boolean) && ['extrude', 'box'].includes(part.kind));
 if (support || hasCertifiedPrimitive) return 'Choose continuous solid material with enough room for the bore and its surrounding wall.';
 return 'Through bores are unavailable on this surface because its wall and cavity clearance cannot be verified.';
}

