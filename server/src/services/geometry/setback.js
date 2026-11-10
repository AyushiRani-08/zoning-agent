const turf = require('@turf/turf');

/**
 * Computes the buildable footprint by offsetting each edge of a polygon
 * inward according to specific setback distances.
 *
 * @param {Object} plot - GeoJSON Polygon feature or geometry
 * @param {number} frontEdgeIndex - 0-based index of the edge abutting the road
 * @param {Object} setbacks - { front: number, side: number, rear: number } in metres
 * @returns {{ polygon: Object, area: number, edges: Array } | null}
 */
function computePerEdgeFootprint(plot, frontEdgeIndex, setbacks) {
  const coords = plot.type === 'Feature' ? plot.geometry.coordinates : plot.coordinates;
  const ring = coords[0];
  const N = ring.length - 1; // Number of unique vertices / edges

  if (frontEdgeIndex < 0 || frontEdgeIndex >= N) {
    throw new Error(`INVALID_FRONT_EDGE: index must be between 0 and ${N - 1}`);
  }

  const vertices = ring.slice(0, N);
  const plotFeature = turf.polygon(coords);
  const center = turf.centroid(plotFeature).geometry.coordinates;
  const [lng0, lat0] = center;

  // Local metric Cartesian projection (equirectangular projection around centroid)
  const rad = Math.PI / 180;
  const cosLat = Math.cos(lat0 * rad);
  const R = 6371008.8; // Mean Earth radius in metres

  const toMeters = ([lng, lat]) => [
    (lng - lng0) * rad * R * cosLat,
    (lat - lat0) * rad * R,
  ];
  const toLngLat = ([x, y]) => [
    lng0 + (x / (R * cosLat)) / rad,
    lat0 + (y / R) / rad,
  ];

  const pts = vertices.map(toMeters);
  const isCW = turf.booleanClockwise(turf.lineString(ring));

  // Identify rear edge:
  // For quadrilaterals (N=4), rear is opposite edge ((front + 2) % 4).
  // For arbitrary N-gons, find the edge most opposite to front direction.
  let rearEdgeIndex = (frontEdgeIndex + Math.floor(N / 2)) % N;

  const lines = [];
  const edgeDetails = [];

  for (let i = 0; i < N; i++) {
    const p1 = pts[i];
    const p2 = pts[(i + 1) % N];
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const len = Math.hypot(dx, dy);

    if (len === 0) throw new Error('INVALID_GEOMETRY: zero-length edge');

    // Inward normal vector
    const nx = isCW ? dy / len : -dy / len;
    const ny = isCW ? -dx / len : dx / len;

    let type = 'side';
    let s = setbacks.side;

    if (i === frontEdgeIndex) {
      type = 'front';
      s = setbacks.front;
    } else if (i === rearEdgeIndex) {
      type = 'rear';
      s = setbacks.rear;
    }

    // Line equation: nx * x + ny * y = C
    const C = nx * p1[0] + ny * p1[1] + s;
    lines.push({ nx, ny, C, s, type, edgeIndex: i });
    edgeDetails.push({ edgeIndex: i, type, setbackM: s });
  }

  // Intersect adjacent offset lines to obtain new vertices
  const newPts = [];
  for (let i = 0; i < N; i++) {
    const prev = lines[(i - 1 + N) % N];
    const curr = lines[i];
    const D = prev.nx * curr.ny - prev.ny * curr.nx;

    if (Math.abs(D) < 1e-6) {
      return null; // Collinear or parallel adjacent edges
    }

    const qx = (prev.C * curr.ny - curr.C * prev.ny) / D;
    const qy = (prev.nx * curr.C - curr.nx * prev.C) / D;
    newPts.push([qx, qy]);
  }

  // Close ring and unproject back to WGS84
  const newRing = [...newPts, newPts[0]].map(toLngLat);
  const newPoly = turf.polygon([newRing]);

  // Validate resulting polygon:
  // 1. Must not invert orientation (which happens if setbacks exceed plot size)
  const newCW = turf.booleanClockwise(turf.lineString(newRing));
  if (newCW !== isCW) {
    return null;
  }

  // 2. Must not self-intersect
  if (turf.kinks(newPoly).features.length > 0) {
    return null;
  }

  const area = turf.area(newPoly);
  if (area <= 0) {
    return null;
  }

  return {
    polygon: newPoly,
    area,
    edges: edgeDetails,
  };
}

module.exports = { computePerEdgeFootprint };

