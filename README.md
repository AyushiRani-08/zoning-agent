# Zoning Feasibility Agent

Checks a land plot against zoning rules (FSI/FAR, setbacks, permitted uses) and returns a feasibility verdict.
See `ASSUMPTIONS.md` for the decisions this build rests on.

## Run the application (Full Stack with one command)
```bash
npm install
npm run dev        # Starts both Server (port 4000) and Next.js Studio (port 3000)
```

Or run individually:
- Backend Server: `cd server && npm run dev`
- Frontend Client: `cd client && npm run dev`
- Full Test Suite: `npm test` (39/39 passing tests)

## Try it
```
curl -X POST http://localhost:4000/api/feasibility \
  -H "Content-Type: application/json" \
  -d '{"intendedUse":"warehouse","plot":{"type":"Polygon","coordinates":[[[76.96,11.0],[76.9604,11.0],[76.9604,11.0005],[76.96,11.0005],[76.96,11.0]]]}}'
```
Coordinates are `[longitude, latitude]` and the ring must be closed.

## Run the client (Next.js Map Studio)
```bash
cd client
npm install
npm run dev        # http://localhost:3000
```

## Structure
```
client/              # Next.js 14 App Router + Tailwind CSS + Leaflet GIS
  app/               # / (Map Studio), /reports (Dashboard), /login, /register
  components/        # MapView, LeafletMap, StudyControls, ResultCard, VerdictBadge
  lib/               # api client, auth context
server/src/
  routes/            # HTTP routes + Zod request schemas
  controllers/       # thin HTTP handlers
  middleware/        # auth, validation, error handling
  services/feasibility/calculator.js   pure calculation logic (no HTTP, no DB)
  services/geometry/                   setback & coordinate projection
  services/pdf/reportPdf.js            vector PDF generation (PDFKit)
  rules/pilotRules.js                  statutory TNCDBR 2019 Rule 36 values
server/tests/        unit + API + auth + PDF integration tests
```

## Status
- [x] Calculator with tests
- [x] Express endpoint with validation and error handling
- [x] Real Rule 36 values with sources (TNCDBR 2019)
- [x] Per-edge setbacks (front edge marked by user)
- [x] MongoDB zones and rules, spatial zone lookup ($geoIntersects)
- [x] Auth and saved reports (JWT + MongoDB Atlas)
- [x] PDF feasibility report export
- [x] Next.js client (map)
- [x] LLM rule extraction and explanation (Google Gemini 3.8 Flash)
