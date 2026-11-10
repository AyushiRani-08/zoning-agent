// Run with: npm test
// Expected values are worked out BY HAND (see comments), not copied from the program.
// Statutory rules (TNCDBR 2019 Rule 36): FAR 1.5, coverage 60%, setbacks front 6 / side 3 / rear 2.
// In uniform mode, largest setback (6 m) is applied to all sides.
// In per-edge mode, front is 6m, rear is 2m, and sides are 3m each.

const test = require('node:test');
const assert = require('node:assert');
const { runStudy: run, rectPlot } = require('../../src/services/feasibility/calculator');
const rules = require('../../src/rules/pilotRules');
const runStudy = (plot, use, options) => run(plot, use, rules, options);

const near = (actual, expected, pct = 1) =>
  assert.ok(
    Math.abs(actual - expected) <= (expected * pct) / 100,
    `expected about ${expected}, got ${actual}`
  );

const O = [76.96, 11.0]; // origin; any location works for these tests

test('40 x 50 plot, warehouse (uniform buffer fallback)', () => {
  // area 2000; footprint (40-12) x (50-12) = 28 x 38 = 1064
  // coverage cap 60% x 2000 = 1200 (not binding); max floor area 1.5 x 2000 = 3000
  const r = runStudy(rectPlot(...O, 40, 50), 'warehouse');
  near(r.plotAreaSqM, 2000);
  near(r.buildableFootprintSqM, 1064);
  near(r.maxFootprintSqM, 1064);
  near(r.maxFloorAreaSqM, 3000);
  assert.strictEqual(r.verdict, 'feasible');
  assert.strictEqual(r.method, 'uniform inward buffer (largest setback)');
});

test('40 x 50 plot, per-edge setbacks (frontEdgeIndex: 0)', () => {
  // Edge 0 is 40m wide (South, front facing road: 6m setback)
  // Edge 2 is 40m wide (North, rear: 2m setback) -> depth remaining: 50 - 6 - 2 = 42m
  // Edges 1 & 3 are 50m deep (East & West, sides: 3m setback each) -> width remaining: 40 - 3 - 3 = 34m
  // Footprint: 34 x 42 = 1428 sq m.
  // Coverage cap: 60% x 2000 = 1200 sq m (binding).
  const r = runStudy(rectPlot(...O, 40, 50), 'warehouse', { frontEdgeIndex: 0 });
  near(r.plotAreaSqM, 2000);
  near(r.buildableFootprintSqM, 1428);
  near(r.maxFootprintSqM, 1200);
  near(r.maxFloorAreaSqM, 3000);
  assert.strictEqual(r.verdict, 'feasible');
  assert.ok(r.method.includes('per-edge setbacks'));
  assert.strictEqual(r.edgeBreakdown.length, 4);
  assert.strictEqual(r.edgeBreakdown[0].type, 'front');
  assert.strictEqual(r.edgeBreakdown[0].setbackM, 6);
  assert.strictEqual(r.edgeBreakdown[2].type, 'rear');
  assert.strictEqual(r.edgeBreakdown[2].setbackM, 2);
  assert.strictEqual(r.edgeBreakdown[1].type, 'side');
  assert.strictEqual(r.edgeBreakdown[1].setbackM, 3);
  assert.ok(r.buildableFootprint && r.buildableFootprint.type === 'Polygon');
});

test('40 x 50 plot, per-edge setbacks (frontEdgeIndex: 1)', () => {
  // Edge 1 is 50m deep (East, front facing road: 6m setback)
  // Edge 3 is 50m deep (West, rear: 2m setback) -> width remaining: 40 - 6 - 2 = 32m
  // Edges 0 & 2 are 40m wide (North & South, sides: 3m setback each) -> depth remaining: 50 - 3 - 3 = 44m
  // Footprint: 32 x 44 = 1408 sq m.
  const r = runStudy(rectPlot(...O, 40, 50), 'warehouse', { frontEdgeIndex: 1 });
  near(r.plotAreaSqM, 2000);
  near(r.buildableFootprintSqM, 1408);
  assert.strictEqual(r.verdict, 'feasible');
});

test('invalid frontEdgeIndex throws error', () => {
  assert.throws(
    () => runStudy(rectPlot(...O, 40, 50), 'warehouse', { frontEdgeIndex: 99 }),
    /INVALID_FRONT_EDGE/
  );
});

test('30 x 60 plot, warehouse (uniform)', () => {
  // area 1800; footprint 18 x 48 = 864; coverage cap 1080 (not binding); floor area 2700
  const r = runStudy(rectPlot(...O, 30, 60), 'warehouse');
  near(r.plotAreaSqM, 1800);
  near(r.buildableFootprintSqM, 864);
  near(r.maxFloorAreaSqM, 2700);
  assert.strictEqual(r.verdict, 'feasible');
});

test('100 x 100 plot: ground coverage cap is the limit', () => {
  // area 10000; footprint 88 x 88 = 7744; coverage cap 6000 -> max footprint 6000
  // floor area 15000; floors = 15000 / 6000 = 2.5
  const r = runStudy(rectPlot(...O, 100, 100), 'warehouse');
  near(r.buildableFootprintSqM, 7744);
  near(r.maxFootprintSqM, 6000);
  near(r.maxFloorAreaSqM, 15000);
  near(r.estimatedFloors, 2.5);
  assert.strictEqual(r.verdict, 'feasible');
});

test('10 x 20 plot: too small after setbacks (per-edge)', () => {
  // width: 10 - 3 - 3 = 4m; depth: 20 - 6 - 2 = 12m -> footprint 48 sq m < 200
  const r = runStudy(rectPlot(...O, 10, 20), 'warehouse', { frontEdgeIndex: 0 });
  near(r.plotAreaSqM, 200);
  near(r.buildableFootprintSqM, 48);
  assert.strictEqual(r.verdict, 'not_feasible');
});

test('10 x 20 plot: too small after setbacks (uniform)', () => {
  // area 200; footprint (10-12) is negative -> nothing left
  const r = runStudy(rectPlot(...O, 10, 20), 'warehouse');
  near(r.plotAreaSqM, 200);
  assert.strictEqual(r.buildableFootprintSqM, 0);
  assert.strictEqual(r.verdict, 'not_feasible');
});

test('residential use is prohibited in the industrial zone', () => {
  const r = runStudy(rectPlot(...O, 40, 50), 'residential');
  assert.strictEqual(r.verdict, 'not_feasible');
});

test('cold storage is conditional', () => {
  const r = runStudy(rectPlot(...O, 40, 50), 'cold-storage');
  assert.strictEqual(r.verdict, 'conditionally_feasible');
});

test('unclosed ring is rejected', () => {
  const bad = { type: 'Polygon', coordinates: [[[76.96, 11], [76.961, 11], [76.961, 11.001], [76.96, 11.001]]] };
  assert.throws(() => runStudy(bad, 'warehouse'), /not closed/);
});

test('out-of-range coordinates are rejected', () => {
  const bad = { type: 'Polygon', coordinates: [[[200, 11], [201, 11], [201, 12], [200, 11]]] };
  assert.throws(() => runStudy(bad, 'warehouse'), /out of range/);
});

test('self-crossing polygon is rejected', () => {
  const bow = { type: 'Polygon', coordinates: [[[76.96, 11], [76.961, 11.001], [76.961, 11], [76.96, 11.001], [76.96, 11]]] };
  assert.throws(() => runStudy(bow, 'warehouse'), /crosses itself/);
});
