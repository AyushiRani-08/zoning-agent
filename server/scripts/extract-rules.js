require('dotenv').config();
const { extractRuleFromBylawText } = require('../src/services/agent/ruleExtractor');
const mongoose = require('mongoose');
const Rule = require('../src/models/Rule');

const SAMPLE_TNCDBR_RULE_36 = `
TAMIL NADU COMBINED DEVELOPMENT AND BUILDING RULES, 2019
PART IV - PLANNING PARAMETERS
RULE 36. Planning Parameters for Industries.

(1) The planning parameters for industrial buildings in industrial zones (Zone Code: IND-1, Industrial Use Zone) shall be as follows:
(a) Maximum permissible Floor Space Index (FSI / FAR): 1.50
(b) Maximum Ground Coverage: 75%
(c) Maximum Permissible Height: 18.30 metres
(d) Minimum Road Width required: 7.0 metres

(2) Setbacks from boundaries:
(i) Front setback: Minimum 6.0 metres from the road boundary.
(ii) Side setbacks: Minimum 3.0 metres on each side.
(iii) Rear setback: Minimum 2.0 metres from the rear boundary.

(3) Permissible Uses:
Industries in Green and Orange categories, storage warehouses, assembly units, light manufacturing, and packaging facilities are permitted as of right.
Cold storage facilities, logistics dispatch depots, and container yards are permitted conditionally subject to clearance from the Local Planning Authority.
Heavy chemical refining, hazardous tanning, and residential apartments are prohibited.
Source: TNCDBR 2019, Gazette Notification, Rule 36, Page 47.
`;

async function main() {
  console.log('--- Municipal Bylaw Rule Extraction via Gemini ---');
  console.log('Sending gazette excerpt to Gemini LLM for structured parameter extraction...');

  try {
    const extracted = await extractRuleFromBylawText(SAMPLE_TNCDBR_RULE_36);
    console.log('\n[SUCCESS] Extracted Statutory Rule:');
    console.log(JSON.stringify(extracted, null, 2));

    const shouldSave = process.argv.includes('--save');
    if (shouldSave) {
      const uri = process.env.MONGODB_URI;
      if (uri) {
        console.log('\nConnecting to MongoDB to store draft rule...');
        await mongoose.connect(uri);
        const draft = await Rule.findOneAndUpdate(
          { zoneCode: extracted.zoneCode },
          { ...extracted, status: 'draft' },
          { upsert: true, new: true }
        );
        console.log('[SAVED] Stored rule in MongoDB with status: draft (ID:', draft._id, ')');
        await mongoose.disconnect();
      }
    } else {
      console.log('\nTip: Run with --save to persist the extracted rule to MongoDB as a draft.');
    }
  } catch (err) {
    console.error('\n[ERROR] Extraction failed:', err.message);
    process.exit(1);
  }
}

main();

