require('dotenv').config();
const mongoose = require('mongoose');
const Zone = require('../src/models/Zone');
const Rule = require('../src/models/Rule');
const pilotRules = require('../src/rules/pilotRules');

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('<db_password>')) {
    console.error('Error: MONGODB_URI is not configured in server/.env with a valid password.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(uri);
  console.log('Connected.');

  console.log('Clearing old pilot zones & rules...');
  await Zone.deleteMany({ region: 'Tamil Nadu Pilot' });
  await Rule.deleteMany({ zoneCode: { $in: ['IND-1', 'COM-1'] } });

  // 1. Seed Industrial Zone (Coimbatore Pilot Corridor)
  // Polygon enclosing the pilot test coordinates [76.96, 11.0]
  const industrialZone = await Zone.create({
    code: 'IND-1',
    name: 'Industrial Use Zone (SIDCO Pilot Corridor)',
    region: 'Tamil Nadu Pilot',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [76.90, 10.95],
        [77.05, 10.95],
        [77.05, 11.08],
        [76.90, 11.08],
        [76.90, 10.95],
      ]],
    },
  });

  // 2. Seed Commercial Zone adjacent to it
  const commercialZone = await Zone.create({
    code: 'COM-1',
    name: 'Commercial Use Zone (Pilot Central)',
    region: 'Tamil Nadu Pilot',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [77.05, 10.95],
        [77.15, 10.95],
        [77.15, 11.08],
        [77.05, 11.08],
        [77.05, 10.95],
      ]],
    },
  });

  // 3. Seed Rule for IND-1
  await Rule.create({
    zoneCode: 'IND-1',
    zoneName: 'Industrial Use Zone',
    industryCategory: 'Green & Orange industries',
    permittedUses: pilotRules.permittedUses,
    conditionalUses: pilotRules.conditionalUses,
    far: pilotRules.far,
    minRoadWidthM: pilotRules.minRoadWidthM,
    maxHeightM: pilotRules.maxHeightM,
    groundCoveragePct: pilotRules.groundCoveragePct,
    setbacks: pilotRules.setbacks,
    parking: pilotRules.parking,
    source: pilotRules.source,
    effectiveDate: new Date('2019-02-04'),
  });

  // 4. Seed Rule for COM-1
  await Rule.create({
    zoneCode: 'COM-1',
    zoneName: 'Commercial Use Zone',
    permittedUses: ['retail', 'office', 'bank', 'warehouse'],
    conditionalUses: ['fuel-station'],
    far: 2.0,
    minRoadWidthM: 9.0,
    maxHeightM: 18.30,
    groundCoveragePct: 70,
    setbacks: { front: 4.5, side: 2.5, rear: 2.5 },
    source: 'TNCDBR 2019, Rule 35 & Annexure XVIII, Page 40 & 184',
    effectiveDate: new Date('2019-02-04'),
  });

  console.log(`Successfully seeded:`);
  console.log(`- Zones: ${industrialZone.code}, ${commercialZone.code}`);
  console.log(`- Rules: IND-1 (FSI ${pilotRules.far}), COM-1 (FSI 2.0)`);
  console.log('2dsphere geospatial index ensured.');

  await mongoose.disconnect();
  console.log('Database disconnected.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

