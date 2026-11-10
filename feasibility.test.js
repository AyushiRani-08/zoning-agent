// Run with: node --test
// Expected values are worked out BY HAND (see comments), not copied from the program.
// Placeholder rules: FAR 1.5, coverage 60%, setbacks front 6 / side 3 / rear 3.
// The calculator uses the largest setback (6 m) on every side, so each side shrinks by 6 m.

const test = require('node:test');
const assert = require('node:assert');
const { runStudy, rectPlot } = require('./feasibility');

const near = (actual, expected, pct = 1) =>
    assert.ok(
        Math.abs(actual - expected) <= (expected * pct) / 100,
        `expected about ${expected}, got ${actual}`
    );

const O = [76.96, 11.0]; // origin; any location works for these tests

test('40 x 50 plot, warehouse', () => {
    // area 2000; footprint (40-12) x (50-12) = 28 x 38 = 1064
    // coverage cap 60% x 2000 = 1200 (not binding); max floor area 1.5 x 2000 = 3000
    const r = runStudy(rectPlot(...O, 40, 50), 'warehouse');
    near(r.plotAreaSqM, 2000);
    near(r.buildableFootprintSqM, 1064);
    near(r.maxFootprintSqM, 1064);
    near(r.maxFloorAreaSqM, 3000);
    assert.strictEqual(r.verdict, 'feasible');
});

test('30 x 60 plot, warehouse', () => {
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

test('10 x 20 plot: too small after setbacks', () => {
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