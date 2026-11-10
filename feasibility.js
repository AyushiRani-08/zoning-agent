// Day-1 core: plot polygon + rules -> area, buildable footprint, max floor area, verdict.
// No LLM, no database. Rules below are PLACEHOLDERS: replace with real values
// from your pilot region's rulebook (and keep the source for each one).

const turf = require('@turf/turf');

const RULES = {
    zoneCode: 'IND-1',
    permittedUses: ['warehouse', 'light-industry'],
    conditionalUses: ['cold-storage'],
    far: 1.5,                 // floor area ratio
    groundCoveragePct: 60,    // max % of plot the footprint may cover
    setbacks: { front: 6, side: 3, rear: 3 }, // metres
    source: 'PLACEHOLDER - replace with document, clause, page',
};

const MIN_USEFUL_FOOTPRINT_SQM = 200; // tune with your mentor

function validatePlot(plot) {
    if (!plot || plot.type !== 'Polygon') throw new Error('INVALID_GEOMETRY: expected a GeoJSON Polygon');
    const ring = plot.coordinates[0];
    if (!ring || ring.length < 4) throw new Error('INVALID_GEOMETRY: need at least 3 distinct points');
    const [first, last] = [ring[0], ring[ring.length - 1]];
    if (first[0] !== last[0] || first[1] !== last[1]) throw new Error('INVALID_GEOMETRY: ring is not closed');
    for (const [lng, lat] of ring) {
        if (Math.abs(lng) > 180 || Math.abs(lat) > 90) {
            throw new Error('INVALID_GEOMETRY: coordinates out of range (is it [lng, lat]?)');
        }
    }
    if (turf.kinks(turf.polygon(plot.coordinates)).features.length > 0) {
        throw new Error('INVALID_GEOMETRY: polygon crosses itself');
    }
}

function runStudy(plot, intendedUse, rules = RULES) {
    validatePlot(plot);
    const plotFeature = turf.polygon(plot.coordinates);
    const plotAreaSqM = turf.area(plotFeature);

    // 1. Use check
    let useStatus = 'prohibited';
    if (rules.permittedUses.includes(intendedUse)) useStatus = 'permitted';
    else if (rules.conditionalUses.includes(intendedUse)) useStatus = 'conditional';

    // 2. Buildable footprint. Option B (uniform inward buffer using the largest
    //    setback) is a conservative first version. Per-edge setbacks come later.
    const maxSetback = Math.max(rules.setbacks.front, rules.setbacks.side, rules.setbacks.rear);
    const shrunk = turf.buffer(plotFeature, -maxSetback, { units: 'meters' });
    const footprintAreaSqM = shrunk ? turf.area(shrunk) : 0;

    // 3. Limits
    const maxFloorAreaSqM = rules.far * plotAreaSqM;
    const coverageCapSqM = (rules.groundCoveragePct / 100) * plotAreaSqM;
    const maxFootprintSqM = Math.min(footprintAreaSqM, coverageCapSqM);
    const estFloors = maxFootprintSqM > 0 ? maxFloorAreaSqM / maxFootprintSqM : 0;

    // 4. Verdict
    const reasons = [];
    let verdict;
    if (useStatus === 'prohibited') {
        verdict = 'not_feasible';
        reasons.push(`${intendedUse} is not permitted in zone ${rules.zoneCode}`);
    } else if (maxFootprintSqM < MIN_USEFUL_FOOTPRINT_SQM) {
        verdict = 'not_feasible';
        reasons.push('Buildable footprint is too small after setbacks');
    } else if (useStatus === 'conditional') {
        verdict = 'conditionally_feasible';
        reasons.push(`${intendedUse} is only conditionally permitted in zone ${rules.zoneCode}`);
    } else {
        verdict = 'feasible';
        reasons.push(`${intendedUse} is permitted in zone ${rules.zoneCode}`);
    }

    const round = (n) => Math.round(n * 100) / 100;
    return {
        verdict,
        reasons,
        zoneCode: rules.zoneCode,
        plotAreaSqM: round(plotAreaSqM),
        buildableFootprintSqM: round(footprintAreaSqM),
        maxFootprintSqM: round(maxFootprintSqM),
        maxFloorAreaSqM: round(maxFloorAreaSqM),
        estimatedFloors: round(estFloors),
        method: 'uniform inward buffer (largest setback)',
        rulesSource: rules.source,
    };
}

// Helper to build a rectangular test plot of known size (in metres).
function rectPlot(originLng, originLat, widthM, depthM) {
    const o = turf.point([originLng, originLat]);
    const east = turf.destination(o, widthM, 90, { units: 'meters' });
    const ne = turf.destination(east, depthM, 0, { units: 'meters' });
    const north = turf.destination(o, depthM, 0, { units: 'meters' });
    return {
        type: 'Polygon',
        coordinates: [[
            o.geometry.coordinates,
            east.geometry.coordinates,
            ne.geometry.coordinates,
            north.geometry.coordinates,
            o.geometry.coordinates,
        ]],
    };
}

module.exports = { runStudy, validatePlot, rectPlot, RULES };

if (require.main === module) {
    const plot = rectPlot(76.96, 11.0, 40, 50); // 40 m x 50 m = 2,000 sq m
    console.log(runStudy(plot, 'warehouse'));
    console.log(runStudy(plot, 'residential'));
}