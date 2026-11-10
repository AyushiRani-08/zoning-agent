# Zoning Feasibility Agent

Checks a land plot against zoning rules (FSI/FAR, setbacks, permitted uses) and returns a feasibility verdict.
See `ASSUMPTIONS.md` for the decisions this build rests on.

## Run the server
```
cd server
npm install
npm run dev        # http://localhost:4000
npm test           # 14 tests: calculator + API
```

## Try it
```
curl -X POST http://localhost:4000/api/feasibility \
  -H "Content-Type: application/json" \
  -d '{"intendedUse":"warehouse","plot":{"type":"Polygon","coordinates":[[[76.96,11.0],[76.9604,11.0],[76.9604,11.0005],[76.96,11.0005],[76.96,11.0]]]}}'
```
Coordinates are `[longitude, latitude]` and the ring must be closed.

## Structure
```
server/src/
  routes/        HTTP routes + Zod request schemas
  controllers/   thin HTTP handlers
  middleware/    validation, error handling
  services/feasibility/calculator.js   pure calculation logic (no HTTP, no DB)
  rules/pilotRules.js                  PLACEHOLDER rule values -> replace with real TNCDBR values
server/tests/    unit + API tests
```

## Status
- [x] Calculator with tests
- [x] Express endpoint with validation and error handling
- [x] Real Rule 36 values with sources (TNCDBR 2019)
- [x] Per-edge setbacks (front edge marked by user)
- [ ] MongoDB zones and rules, zone lookup
- [ ] Auth, reports, PDF
- [ ] Next.js client (map)
- [ ] LLM rule extraction and explanation
