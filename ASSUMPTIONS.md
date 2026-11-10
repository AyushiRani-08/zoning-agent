# ASSUMPTIONS

**Project:** Municipal Zoning & Land Development Feasibility Agent
**Company:** Ricoz Innovation (BookMyWarehouse)
**Author:** [Your name]
**Version:** 0.1
**Last updated:** 10 November 2026
**Status:** Active. Proceeding on these assumptions until the mentor or team says otherwise.

---

## 1. Purpose

The project brief was a single problem statement plus a mandated tech stack. Several decisions were left open (region, data, scope, AI provider, demo definition) and the mentor has not yet been reachable to confirm them.

This file records every assumption made so that:

- work can continue without waiting;
- the mentor and teammates can see exactly what was decided and why;
- any wrong assumption can be corrected quickly, with a clear idea of what it affects.

**How to use this file:** if you disagree with an assumption, reply with the ID (for example "A3") and the change you want. Each entry lists what would need to change.

---

## 2. Assumptions

Status values: **Active** (in use), **To verify** (in use but needs a source check), **Confirmed** (approved by mentor or team), **Changed** (replaced, see change log).

### 2.1 Scope and region

| ID | Assumption | Why | If wrong, impact | Status |
|---|---|---|---|---|
| A1 | The pilot region is **Tamil Nadu**, governed by the **Tamil Nadu Combined Development and Building Rules, 2019 (TNCDBR)** and its amendments. | One statewide rulebook is far simpler than separate rules per city. | Rules data and zone maps must be replaced; calculation code stays the same. | Active |
| A2 | The 45% demo covers **one city or industrial area** within Tamil Nadu: [city/area to be fixed by author]. | A single area keeps data collection realistic. | Seed data changes only. | Active |
| A3 | The first supported intended uses are **warehouse** and **light industry**. Other uses are reported as "not supported yet". | Matches BookMyWarehouse's business and keeps the rule set small. | Add uses to the rules data. | Active |
| A4 | Only **one zone type** (industrial) is modelled at 45%, with a flat set of values per zone. | Conditional rules (road width, plot size) add complexity that is not needed for a first demo. | Rules schema needs condition support (planned for later). | Active |
| A5 | Results are **indicative, not legal advice**. Every report carries a disclaimer. | A feasibility tool does not replace a licensed planner or the approving authority. | Wording of the disclaimer. | Active |

### 2.2 Rules and data

| ID | Assumption | Why | If wrong, impact | Status |
|---|---|---|---|---|
| A6 | The governing text for industrial parameters is **Rule 36 (Planning Parameters of Industries)** of TNCDBR 2019 (Page 47). Warehouses are verified permitted in Industrial Zone via Rule 33 & Annexure XVIII cl. 1(iv) & cl. 1(vi). | Rule 36 holds industrial FSI, setback (front 6m, side 3m, rear 2m), height (18.3m), and road-width (7m) tables. | None; verified from official TNCDBR 2019 gazette copy. | Confirmed |
| A7 | The base 2019 rules are modified by later gazette amendments. Amendments touching **Rule 36, Rule 2 definitions, Annexure IV (parking) and Annexure XXVII (industrial self-certification)** override the base text. | These are the parts the calculator relies on. | Rule values and their source references change. | **To verify** |
| A8 | G.O. (Ms) No. 194 of 26 October 2026 is treated as a real amendment, but the only source seen so far is a secondary explainer. The **gazette copy must be read** before its values are used. | Secondary sources can be wrong. | Industrial table values. | **To verify** |
| A9 | Each rule value is stored with its **source** (document, rule number, page) and an **effective date**. A value without a source is not used. | Traceability and the ability to reproduce old reports. | None; this is a design rule. | Active |
| A10 | FSI and FAR mean the same thing in this project. | Tamil Nadu uses "FSI"; the brief says "FAR". | Naming only. | Active |
| A11 | Zone boundaries come from the **master plan or detailed development plan** of the pilot area, digitized manually in QGIS where only PDFs or images exist. | Digital zone data is often unavailable. | Time spent on digitizing; accuracy of zone lookup. | Active |
| A12 | Environmental features (water bodies, roads, protected areas) are **not** included in the 45% build. Only plot-boundary setbacks are applied. | Keeps the first calculator verifiable by hand. | Add `environmentalFeatures` data and buffer step later. | Active |

### 2.3 Calculation

| ID | Assumption | Why | If wrong, impact | Status |
|---|---|---|---|---|
| A13 | Plot input is a **GeoJSON polygon** in WGS84, coordinates as **[longitude, latitude]**. Survey number and address lookup are out of scope. | Simplest reliable input. | Add lookup services later. | Active |
| A14 | The first calculator version applies the **largest setback uniformly** to all sides (conservative). | Easy to verify by hand and never over-estimates buildable area. | Buildable area is understated for plots with smaller side setbacks. | Active |
| A15 | Applies **front (6m), rear (2m) and side (3m) setbacks per edge**, with the **front edge marked by the user** (or falls back to uniform 6m if unspecified). | The system cannot know which side faces the road; per-edge geometry accurately reflects usable footprint. | Implemented via `computePerEdgeFootprint` with local metric projection. | Confirmed |
| A16 | Maximum floor area = **FSI x plot area**. Maximum footprint = the smaller of the setback footprint and the ground-coverage cap (if the rule gives one). | Standard definition used in the rules. | Formula changes if the rule defines exclusions from FSI. | Active |
| A17 | Area is measured with **Turf.js** (geodesic). Results are cross-checked against QGIS on sample plots. | Keeps the stack in JavaScript. | Switch to projected-CRS calculation if differences are material. | Active |
| A18 | A buildable footprint under **200 sq m** is treated as "not useful" for a warehouse. | Placeholder threshold. | Tune the constant. | **To verify** |
| A19 | Verdicts are: `feasible`, `conditionally_feasible`, `not_feasible`, and `cannot_assess` (outside coverage or rules missing). Missing data never produces a guess. | Safety and honesty. | None. | Active |
| A20 | Statutory rule values are sourced directly from TNCDBR 2019 Rule 36 (p. 47): FSI 1.50, min road width 7.0m, max height 18.30m, setbacks front 6.0m, side 3.0m, rear 2.0m. (Uniform buffer applies 6.0m). | Replaced placeholders in pilotRules.js with verified statutory values from TNCDBR 2019 gazette copy. | None. | Confirmed |

### 2.4 Technology

| ID | Assumption | Why | If wrong, impact | Status |
|---|---|---|---|---|
| A21 | Stack is exactly as mandated: **Next.js, Node.js + Express.js, MongoDB**. | Team instruction. | None. | Confirmed (team message) |
| A22 | GIS work uses **Turf.js and proj4js**. No Python service unless the team approves an exception. | Guideline 9 of the stack message. | Add a Python microservice after discussion. | Active |
| A23 | Language is **JavaScript** at the start. TypeScript may be adopted once teammates join. | Faster to start; not specified by the team. | Migration effort. | Active |
| A24 | Repository is a **monorepo** (`/client`, `/server`) on GitHub, with `main` always working. | Simplest for a small team. | Restructure later. | Active |
| A25 | The 45% version runs **locally and on one dev deployment**. Hosting target is undecided. | Not specified. | Deployment work later. | Active |
| A26 | Authentication is **JWT** with two roles (user, admin). No payments at 45%. | Matches the stack guidelines; billing is post-45%. | Add billing in a later phase. | Active |

### 2.5 AI

| ID | Assumption | Why | If wrong, impact | Status |
|---|---|---|---|---|
| A27 | The **calculator is built and tested first, with no LLM**. Rules for the pilot are entered **manually**. | The core must be correct before anything depends on it. | None. | Active |
| A28 | The LLM is added later for **two jobs only**: extracting structured rules from bylaw text, and writing a plain-language explanation. It never calculates and never decides the verdict. | Reproducible, defensible numbers. | None; this is a design rule. | Active |
| A29 | Extracted rules stay as **draft until a human approves them**. | LLMs can misread legal text. | Approval flow. | Active |
| A30 | LLM provider and budget are **not yet decided**. A low-cost provider with a small spending cap will be used, subject to approval. | No budget information given. | Swap the SDK; prompts may need tuning. | **To verify** |
| A31 | Manual rule entries serve as the **accuracy baseline** for LLM extraction (compare extracted values against manual ones). | Gives a real accuracy number for the 45% report. | None. | Active |

### 2.6 The 45% milestone

| ID | Assumption | Why | If wrong, impact | Status |
|---|---|---|---|---|
| A32 | The 45% demo shows: draw or upload a plot, zone detection, permitted-use check, setback footprint on a map, maximum floor area, verdict, rule sources, PDF report, a clear "outside coverage" message, and one example of LLM rule extraction. | Matches the PRD's MVP scope. | Scope of the final two weeks. | **To verify** |
| A33 | Success means the calculator **matches hand-calculated results on at least 5 sample plots**. | Correctness is the main value of the product. | Test set. | Active |
| A34 | The 45% timeline is **14 days** of focused work. | Working assumption; the real deadline is unknown. | Reschedule the plan. | **To verify** |
| A35 | After 45%, teammates take over: frontend, backend and admin, data collection, and QA. The author keeps the calculation engine and architecture. | From the project brief. | Reassign tasks. | Active |

---

## 3. Out of scope for the 45% build

- Multiple cities or states
- Payments, subscriptions and API keys
- Flood, CRZ, protected-area and road-access checks
- Survey number or address lookup
- Conditional rules (road width, plot size) and parking norms
- Chat about reports and bylaw search over large document sets
- Production hosting, monitoring and backups
- Branded or multi-template reports

---

## 4. Items that must be verified before they are relied on

1. [VERIFIED] Download TNCDBR 2019 and read the gazette copy (G.O.(Ms) No.18 dated 04.02.2019) (A6, A7).
2. [VERIFIED] Confirm whether warehouses are covered by Rule 36 or another rule: Warehouses permitted in Industrial Zone via Rule 33 & Annexure XVIII cl. 1(iv) & cl. 1(vi); parameters governed by Rule 36 (A6).
3. [VERIFIED] Read Rule 36's tables and record statutory values: FSI 1.50, min road width 7.0m, max height 18.30m, front setback 6.0m, side setback 3.0m, rear setback 2.0m (Page 47) (A9, A20).
4. Check whether any value depends on **plot size or road width** (A4). (Rule 36 notes road width min 7m; front setback varies for cottage industries but is fixed 6.0m for Green/Orange).
5. Get the master plan or zoning map for the chosen area and confirm it is the current one (A11).
6. Cross-check three plot areas against QGIS (A17).

---

## 5. Open questions for the mentor or team

These do not block work, but a reply would change an assumption.

1. Is Tamil Nadu (TNCDBR) acceptable as the pilot region, and which city or area?
2. Does the company already have zoning data, parcel data or a BookMyWarehouse database to reuse?
3. What exactly should the 45% demo show, and by what date?
4. Which LLM provider and budget are approved?
5. JavaScript or TypeScript, and where will it be hosted?
6. Who can review the results from a planning or legal point of view?

---

## 6. Change log

| Date | ID | Change | Reason | Decided by |
|---|---|---|---|---|
| 10 Nov 2026 | All | Initial version | Mentor unreachable; proceeding on documented assumptions | Author |
| 10 Nov 2026 | A6, A20 | Confirmed Rule 36 parameters & land use legality from official TNCDBR 2019 gazette copy; updated pilotRules.js (rear setback set to statutory 2.0m, road width 7m, height 18.3m, parking norms added) | Official TNCDBR 2019 gazette provided | Author |
| 10 Nov 2026 | A15 | Implemented per-edge setbacks (`setback.js` with local metric projection & line intersection); updated `calculator.js`, API controller, and Zod schema with unit tests | Implemented feature | Author |

When an assumption changes, mark the old row **Changed**, add the new one, and add a line here.