// Statutory rules from Tamil Nadu Combined Development and Building Rules, 2019 (TNCDBR 2019).
// Notification: G.O. (Ms) No.18, MAWS (MA.I) Department, dated 04.02.2019.
// Primary Source: Rule 36 "Planning Parameters of Industries" (Page 47, Table for Green & Orange Industries).
// Land Use Legality: Rule 33 & Annexure XVIII (Pages 185-186).
// Parking Norms: Annexure IV, Item 18 (Page 110).

module.exports = {
  zoneCode: 'IND-1',
  zoneName: 'Industrial Use Zone',
  industryCategory: 'Green & Orange industries',
  permittedUses: ['warehouse', 'light-industry'],
  conditionalUses: ['cold-storage'], // Annexure VI item 35 (small scale cold storage)
  far: 1.50, // Rule 36, Table Row C (Max FSI: 1.50)
  minRoadWidthM: 7.0, // Rule 36, Table Row A (Min road width: 7m)
  maxHeightM: 18.30, // Rule 36, Table Row B (Max height: 18.30m)
  groundCoveragePct: 60, // Conservative working ceiling; Rule 36 table sets no blanket cap, footprint is bounded by setbacks
  setbacks: {
    front: 6.0, // Rule 36, Table Row D(i) (Front setback: 6.0m)
    side: 3.0,  // Rule 36, Table Row D(ii) (Side setback: 3.0m)
    rear: 2.0,  // Rule 36, Table Row D(iii) (Rear setback: 2.0m)
  },
  parking: {
    warehouse: '1 lorry space for every 300 sq.m of covered area or part thereof',
    coldStorage: '1 lorry space for every 500 sq.m of floor area or part thereof',
    stallDimensionsM: { breadth: 3.5, length: 10.0, articulatedLength: 16.0 },
    source: 'TNCDBR 2019, Annexure IV, Part I Item 18 & Part II',
  },
  source: 'TNCDBR 2019, Rule 36 (Planning Parameters of Industries), Page 47',
};
