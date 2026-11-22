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

## Status — 45% Milestone (100% Complete)

### ✅ Done
- [x] Draw a plot on map (Leaflet draw tool + presets)
- [x] Zone detection (`$geoIntersects` → pilot bounds fallback)
- [x] Permitted-use check (warehouse / light industry vs zone rules)
- [x] Setback footprint overlay on map (buildable polygon)
- [x] Maximum floor area (FAR × plot area)
- [x] Verdict (`feasible` / `conditionally_feasible` / `not_feasible` / `cannot_assess`)
- [x] PDF feasibility report export (PDFKit, downloadable from ResultCard + Reports page)
- [x] LLM rule extraction and explanation (Google Gemini 3.8 Flash with deterministic fallback)
- [x] Auth and saved reports (JWT + MongoDB Atlas)
- [x] CI/CD (GitHub Actions — test matrix Node 20×22, Next.js build, security audit)
- [x] **GeoJSON file upload** — user uploads a `.geojson` plot file directly from the UI
- [x] **Rule source citations in UI** — surfaces "TNCDBR 2019, Rule 36, Page 47" statutory citation in ResultCard
- [x] **"Outside coverage" UI message** — user-facing alert banner when a parcel lies outside pilot bounds
- [x] **39/39 tests passing** (unit + API + auth + PDF + agent) & clean production Next.js build

### Out of scope for 45%
- Multiple cities / states
- Payments and subscriptions
- Flood, CRZ, protected-area checks
- Survey number / address lookup
- Conditional rules (road width, plot size) and parking norms
- Production hosting, monitoring, backups
