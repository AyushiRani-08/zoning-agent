const { z } = require('zod');
const { getGeminiClient, DEFAULT_MODEL } = require('./geminiClient');

const extractedRuleSchema = z.object({
  zoneCode: z.string().min(1),
  zoneName: z.string().min(1),
  far: z.number().positive(),
  groundCoveragePct: z.number().min(10).max(100),
  maxHeightM: z.number().positive(),
  minRoadWidthM: z.number().positive(),
  setbacks: z.object({
    front: z.number().nonnegative(),
    side: z.number().nonnegative(),
    rear: z.number().nonnegative(),
  }),
  permittedUses: z.array(z.string()).min(1),
  conditionalUses: z.array(z.string()).default([]),
  source: z.string().min(1),
  effectiveDate: z.string().optional(),
});

/**
 * Extracts structured municipal zoning parameters from raw legal text using Gemini.
 *
 * @param {string} bylawText - Raw excerpt or scanned text from municipal bylaw gazette
 * @returns {Promise<{ rule: Object, status: 'draft', rawTextSnippet: string }>}
 */
async function extractRuleFromBylawText(bylawText) {
  if (!bylawText || bylawText.trim().length < 20) {
    throw new Error('INVALID_INPUT: Bylaw text is too short to extract parameters.');
  }

  const ai = getGeminiClient();
  if (!ai) {
    throw new Error('CONFIGURATION_ERROR: GEMINI_API_KEY is not configured in server/.env.');
  }

  const prompt = `You are a Legal & Urban Planning AI Assistant specializing in Indian municipal building bylaws (such as TNCDBR 2019, BBMP, KMBR).
Read the following gazette text and extract the statutory zoning and planning parameters into a structured JSON object.

Bylaw Text Excerpt:
"""
${bylawText}
"""

Instructions:
1. Extract numerical values for:
   - far (Floor Area Ratio / Floor Space Index multiplier, e.g. 1.5, 2.0)
   - groundCoveragePct (Maximum ground coverage percentage, e.g. 60, 75)
   - maxHeightM (Maximum permissible structure height in metres)
   - minRoadWidthM (Minimum access road width requirement in metres)
   - setbacks in metres: front, side, and rear
2. Extract lists of:
   - permittedUses (all uses explicitly allowed as of right)
   - conditionalUses (uses permitted subject to special municipal sanction or conditional approval)
3. Identify:
   - zoneCode (e.g. IND-1, COM-1, RES-2)
   - zoneName (descriptive name of the zone)
   - source (document title, rule number, and page citation)
4. Standardize use names as lower_snake_case (e.g. "warehouse", "light_industry", "cold_storage").

Output MUST be a strict, valid JSON object conforming exactly to this schema:
{
  "zoneCode": "string",
  "zoneName": "string",
  "far": 1.5,
  "groundCoveragePct": 75,
  "maxHeightM": 18.3,
  "minRoadWidthM": 7.0,
  "setbacks": {
    "front": 6.0,
    "side": 3.0,
    "rear": 2.0
  },
  "permittedUses": ["warehouse", "light_industry"],
  "conditionalUses": ["cold_storage"],
  "source": "TNCDBR 2019, Rule 36, Page 47"
}`;

  const res = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    },
  });

  const parsed = JSON.parse(res.text);
  const validated = extractedRuleSchema.parse(parsed);

  return {
    ...validated,
    status: 'draft', // By Assumption A29: all extracted rules stay draft until verified
    extractedAt: new Date(),
  };
}

module.exports = {
  extractRuleFromBylawText,
  extractedRuleSchema,
};

