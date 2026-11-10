// PDF Export Integration & Unit Tests
// Run with: node --test tests/pdf.test.js

const test = require('node:test');
const assert = require('node:assert');
const stream = require('stream');
require('dotenv').config();
const { connectDB } = require('../src/config/db');
const app = require('../src/app');
const { generateFeasibilityPdf, getVerdictStyle } = require('../src/services/pdf/reportPdf');

let server, base;
test.before(async () => {
  await connectDB();
  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://localhost:${server.address().port}`;
});

test.after(async () => {
  server.close();
  const mongoose = require('mongoose');
  await mongoose.disconnect();
});

const post = (path, body, token) => fetch(`${base}${path}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
  body: JSON.stringify(body),
});

const get = (path, token) => fetch(`${base}${path}`, {
  headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
});

let token, reportId;
const testEmail = `pdfuser_${Date.now()}@example.com`;

test('Setup: register user and create a report', async () => {
  const regRes = await post('/api/auth/register', { name: 'PDF Tester', email: testEmail, password: 'password123' });
  const regBody = await regRes.json();
  assert.strictEqual(regRes.status, 201);
  token = regBody.token;

  // Run feasibility to generate and persist a report
  const feasRes = await post('/api/feasibility', {
    intendedUse: 'warehouse',
    frontEdgeIndex: 0,
    plot: {
      type: 'Polygon',
      coordinates: [[[76.96, 11.0], [76.9604, 11.0], [76.9604, 11.0005], [76.96, 11.0005], [76.96, 11.0]]],
    },
  }, token);

  const feasBody = await feasRes.json();
  assert.strictEqual(feasRes.status, 200);
  assert.ok(feasBody.reportId, 'Must have saved reportId');
  reportId = feasBody.reportId;
});

test('GET /api/reports/:id/pdf — returns 401 without auth token', async () => {
  const res = await get(`/api/reports/${reportId}/pdf`);
  assert.strictEqual(res.status, 401);
});

test('GET /api/reports/:id/pdf — returns 404 for invalid report id', async () => {
  const fakeId = '660000000000000000000099';
  const res = await get(`/api/reports/${fakeId}/pdf`, token);
  assert.strictEqual(res.status, 404);
});

test('GET /api/reports/:id/pdf — returns valid PDF stream for authenticated owner', async () => {
  const res = await get(`/api/reports/${reportId}/pdf`, token);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.headers.get('content-type'), 'application/pdf');
  assert.ok(res.headers.get('content-disposition').includes(`feasibility-report-${reportId}.pdf`));

  const buf = Buffer.from(await res.arrayBuffer());
  assert.ok(buf.length > 1000, 'PDF buffer should be larger than 1KB');
  // Check PDF magic bytes '%PDF-'
  assert.strictEqual(buf.subarray(0, 5).toString('ascii'), '%PDF-');
});

test('POST /api/feasibility/pdf — streams PDF directly for on-the-fly study', async () => {
  const res = await post('/api/feasibility/pdf', {
    intendedUse: 'warehouse',
    frontEdgeIndex: 0,
    plot: {
      type: 'Polygon',
      coordinates: [[[76.96, 11.0], [76.9604, 11.0], [76.9604, 11.0005], [76.96, 11.0005], [76.96, 11.0]]],
    },
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.headers.get('content-type'), 'application/pdf');

  const buf = Buffer.from(await res.arrayBuffer());
  assert.ok(buf.length > 1000, 'PDF buffer should be larger than 1KB');
  assert.strictEqual(buf.subarray(0, 5).toString('ascii'), '%PDF-');
});

test('POST /api/feasibility/pdf — rejects invalid geometry with 400', async () => {
  const res = await post('/api/feasibility/pdf', {
    intendedUse: 'warehouse',
    plot: {
      type: 'Polygon',
      coordinates: [[[76.96, 11.0], [76.9604, 11.0], [76.9604, 11.0005]]], // < 4 points
    },
  });

  assert.strictEqual(res.status, 400);
});

test('Unit: getVerdictStyle returns correct palette for all verdict types', () => {
  for (const v of ['feasible', 'conditionally_feasible', 'not_feasible', 'cannot_assess']) {
    const style = getVerdictStyle(v);
    assert.ok(style.label);
    assert.ok(style.badgeBg);
    assert.ok(style.badgeBorder);
    assert.ok(style.textColor);
  }
});

test('Unit: generateFeasibilityPdf works for unauthenticated report without errors', async () => {
  const dummyReport = {
    verdict: 'not_feasible',
    intendedUse: 'heavy_chemical_refinery',
    zoneCode: 'IND-1',
    zoneName: 'Industrial Belt',
    plotAreaSqM: 1500,
    buildableFootprintSqM: 0,
    maxFootprintSqM: 1125,
    maxFloorAreaSqM: 2250,
    estimatedFloors: 0,
    reasons: ['Use is prohibited in IND-1 under Rule 36.'],
    plot: {
      type: 'Polygon',
      coordinates: [[[76.96, 11.0], [76.9604, 11.0], [76.9604, 11.0005], [76.96, 11.0005], [76.96, 11.0]]],
    },
  };

  const chunks = [];
  const writable = new stream.Writable({
    write(chunk, encoding, callback) {
      chunks.push(chunk);
      callback();
    },
  });

  await generateFeasibilityPdf(dummyReport, null, writable);
  const pdfBuffer = Buffer.concat(chunks);
  assert.ok(pdfBuffer.length > 500);
  assert.strictEqual(pdfBuffer.subarray(0, 5).toString('ascii'), '%PDF-');
});

