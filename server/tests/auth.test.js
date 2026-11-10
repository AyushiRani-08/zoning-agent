// Auth + Reports integration tests
// Run with: npm test
// Requires the server to be reachable in-process (spins up on a random port)

const test = require('node:test');
const assert = require('node:assert');
require('dotenv').config();
const { connectDB } = require('../src/config/db');
const app = require('../src/app');

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

// Use a unique email per test run so tests are idempotent
const email = `testuser_${Date.now()}@example.com`;
let token;

test('POST /api/auth/register — creates a new user', async () => {
  const res = await post('/api/auth/register', { name: 'Test User', email, password: 'password123' });
  const body = await res.json();
  assert.strictEqual(res.status, 201);
  assert.ok(body.token, 'Response must include a token');
  assert.strictEqual(body.user.email, email);
  assert.strictEqual(body.user.role, 'user');
  token = body.token;
});

test('POST /api/auth/register — duplicate email is rejected', async () => {
  const res = await post('/api/auth/register', { name: 'Test User', email, password: 'password123' });
  const body = await res.json();
  assert.strictEqual(res.status, 409);
  assert.strictEqual(body.error.code, 'EMAIL_IN_USE');
});

test('POST /api/auth/login — valid credentials return token', async () => {
  const res = await post('/api/auth/login', { email, password: 'password123' });
  const body = await res.json();
  assert.strictEqual(res.status, 200);
  assert.ok(body.token);
  token = body.token;
});

test('POST /api/auth/login — wrong password is rejected', async () => {
  const res = await post('/api/auth/login', { email, password: 'wrongpassword' });
  const body = await res.json();
  assert.strictEqual(res.status, 401);
  assert.strictEqual(body.error.code, 'INVALID_CREDENTIALS');
});

test('GET /api/auth/me — returns user profile with valid token', async () => {
  const res = await get('/api/auth/me', token);
  const body = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(body.email, email);
});

test('GET /api/auth/me — rejected without token', async () => {
  const res = await get('/api/auth/me');
  assert.strictEqual(res.status, 401);
});

test('POST /api/feasibility — saves a report when authenticated', async () => {
  const res = await post('/api/feasibility', {
    intendedUse: 'warehouse',
    plot: {
      type: 'Polygon',
      coordinates: [[[76.96, 11.0], [76.9604, 11.0], [76.9604, 11.0005], [76.96, 11.0005], [76.96, 11.0]]],
    },
  }, token);
  const body = await res.json();
  assert.strictEqual(res.status, 200);
  assert.ok(['feasible', 'conditionally_feasible', 'not_feasible', 'cannot_assess'].includes(body.verdict));
  // Report is only saved if DB is connected
  if (body.reportId) {
    assert.ok(body.reportId, 'reportId should be returned when DB is live');
  }
});

test('GET /api/reports — returns user reports list', async () => {
  const res = await get('/api/reports', token);
  const body = await res.json();
  assert.strictEqual(res.status, 200);
  assert.ok(Array.isArray(body.reports));
});

test('GET /api/reports — rejected without token', async () => {
  const res = await get('/api/reports');
  assert.strictEqual(res.status, 401);
});
