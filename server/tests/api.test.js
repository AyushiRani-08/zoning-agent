const test = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');
const { rectPlot } = require('../src/services/feasibility/calculator');

let server, base;
test.before(async () => {
  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://localhost:${server.address().port}`;
});
test.after(() => server.close());

const post = (body) => fetch(`${base}/api/feasibility`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});

test('health check', async () => {
  const res = await fetch(`${base}/api/health`);
  assert.strictEqual(res.status, 200);
});

test('valid study returns a verdict', async () => {
  const res = await post({ intendedUse: 'warehouse', plot: rectPlot(76.96, 11.0, 40, 50) });
  const body = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(body.verdict, 'feasible');
  assert.ok(Math.abs(body.plotAreaSqM - 2000) < 20);
});

test('missing intendedUse is rejected with details', async () => {
  const res = await post({ plot: rectPlot(76.96, 11.0, 40, 50) });
  const body = await res.json();
  assert.strictEqual(res.status, 400);
  assert.strictEqual(body.error.code, 'INVALID_REQUEST');
});

test('unclosed ring returns INVALID_GEOMETRY', async () => {
  const plot = { type: 'Polygon', coordinates: [[[76.96, 11], [76.961, 11], [76.961, 11.001], [76.96, 11.001]]] };
  const res = await post({ intendedUse: 'warehouse', plot });
  const body = await res.json();
  assert.strictEqual(res.status, 400);
  assert.strictEqual(body.error.code, 'INVALID_GEOMETRY');
});

test('unknown route returns 404 JSON', async () => {
  const res = await fetch(`${base}/api/nope`);
  assert.strictEqual(res.status, 404);
});
