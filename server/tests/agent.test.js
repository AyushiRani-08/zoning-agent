// AI Agent & Rule Extraction Tests
// Run with: node --test tests/agent.test.js

const test = require('node:test');
const assert = require('node:assert');
require('dotenv').config();
const { explainFeasibilityStudy, generateFallbackExplanation } = require('../src/services/agent/explainer');
const { extractRuleFromBylawText } = require('../src/services/agent/ruleExtractor');
const app = require('../src/app');

let server, base;
test.before(async () => {
  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://localhost:${server.address().port}`;
});

test.after(() => server.close());

const sampleStudy = {
  verdict: 'feasible',
  intendedUse: 'warehouse',
  zoneCode: 'IND-1',
  zoneName: 'Coimbatore Industrial Corridor',
  plotAreaSqM: 2000,
  buildableFootprintSqM: 986,
  maxFootprintSqM: 1500,
  maxFloorAreaSqM: 3000,
  estimatedFloors: 3,
  edgeBreakdown: [
    { edgeIndex: 0, type: 'front', setbackM: 7, lengthM: 44.5 },
    { edgeIndex: 1, type: 'side', setbackM: 3, lengthM: 55.6 },
    { edgeIndex: 2, type: 'rear', setbackM: 4, lengthM: 44.5 },
    { edgeIndex: 3, type: 'side', setbackM: 3, lengthM: 55.6 },
  ],
  reasons: [
    'Use "warehouse" is permitted in zone IND-1 under TNCDBR 2019 Rule 36.',
    'Clear buildable footprint of 986 m² remains after applying statutory setbacks.',
  ],
};

test('Unit: generateFallbackExplanation produces valid structured analysis', () => {
  const res = generateFallbackExplanation(sampleStudy);
  assert.ok(res.executiveSummary.length > 10);
  assert.ok(res.spatialAnalysis.length > 10);
  assert.ok(res.primaryBottleneck);
  assert.ok(Array.isArray(res.actionableAdvice) && res.actionableAdvice.length > 0);
  assert.strictEqual(res.source, 'deterministic-fallback');
});

test('Unit: explainFeasibilityStudy generates explanation via Gemini', async () => {
  const res = await explainFeasibilityStudy(sampleStudy);
  assert.ok(res.executiveSummary, 'Must have executiveSummary');
  assert.ok(res.spatialAnalysis, 'Must have spatialAnalysis');
  assert.ok(res.primaryBottleneck, 'Must have primaryBottleneck');
  assert.ok(Array.isArray(res.actionableAdvice), 'Must have actionableAdvice array');
  assert.ok(['gemini-3.8-flash', 'deterministic-fallback'].includes(res.source));
});

test('Unit: extractRuleFromBylawText parses statutory parameters with draft status', async () => {
  const bylawSnippet = `
    Rule 36. Planning Parameters for Industries.
    Zone Code: IND-1.
    Maximum FSI: 1.50. Maximum Ground Coverage: 75%.
    Maximum Height: 18.30m. Minimum Road Width: 7.0m.
    Setbacks: Front 6.0m, Side 3.0m, Rear 2.0m.
    Permitted Uses: Warehousing, light assembly, packaging.
    Conditional Uses: Cold storage depots.
    Source: TNCDBR 2019 Rule 36.
  `;

  const extracted = await extractRuleFromBylawText(bylawSnippet);
  assert.strictEqual(extracted.zoneCode, 'IND-1');
  assert.strictEqual(extracted.far, 1.5);
  assert.strictEqual(extracted.groundCoveragePct, 75);
  assert.strictEqual(extracted.setbacks.front, 6);
  assert.strictEqual(extracted.setbacks.side, 3);
  assert.strictEqual(extracted.setbacks.rear, 2);
  assert.strictEqual(extracted.status, 'draft', 'Extracted rules must be marked draft per Assumption A29');
  assert.ok(extracted.permittedUses.length >= 1);
});

test('API: POST /api/feasibility/explain returns explanation for plot', async () => {
  const res = await fetch(`${base}/api/feasibility/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intendedUse: 'warehouse',
      frontEdgeIndex: 0,
      plot: {
        type: 'Polygon',
        coordinates: [[[76.96, 11.0], [76.9604, 11.0], [76.9604, 11.0005], [76.96, 11.0005], [76.96, 11.0]]],
      },
    }),
  });

  const body = await res.json();
  assert.strictEqual(res.status, 200);
  assert.ok(body.verdict);
  assert.ok(body.explanation);
  assert.ok(body.explanation.executiveSummary);
  assert.ok(Array.isArray(body.explanation.actionableAdvice));
});

