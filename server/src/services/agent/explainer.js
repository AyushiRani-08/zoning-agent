const { getGeminiClient, DEFAULT_MODEL } = require('./geminiClient');

/**
 * Fallback deterministic generator when LLM is unavailable.
 */
function generateFallbackExplanation(studyResult) {
  const { verdict, intendedUse, plotAreaSqM, buildableFootprintSqM, zoneCode, edgeBreakdown } = studyResult;
  const coveragePct = plotAreaSqM && buildableFootprintSqM ? Math.round((buildableFootprintSqM / plotAreaSqM) * 100) : 0;
  const frontEdge = edgeBreakdown?.find(e => e.type === 'front' || e.classification === 'front');

  let executiveSummary = '';
  let primaryBottleneck = '';
  const actionableAdvice = [];

  switch (verdict) {
    case 'feasible':
      executiveSummary = `The proposed ${intendedUse} development is fully permitted in ${zoneCode || 'IND-1'} with an unencumbered buildable envelope of ${Math.round(buildableFootprintSqM || 0)} m² (${coveragePct}% ground coverage).`;
      primaryBottleneck = frontEdge ? `Statutory front setback requirement (${frontEdge.setbackM}m) along the road frontage.` : 'Uniform setback clearances.';
      actionableAdvice.push('Proceed with preliminary architectural footprint drafting within the green setback envelope.');
      actionableAdvice.push('Verify road width certification with the Local Planning Authority (LPA) prior to formal sanction.');
      break;

    case 'conditionally_feasible':
      executiveSummary = `The proposed use (${intendedUse}) is categorized as conditional under municipal zoning bylaws. Special clearance from the competent planning authority is mandated.`;
      primaryBottleneck = 'Statutory conditional clearance and environmental NOC requirements.';
      actionableAdvice.push('Apply for special planning permission from the Member Secretary / LPA.');
      actionableAdvice.push('Ensure pollution control board (TNPCB) categorization meets industrial corridor standards.');
      break;

    case 'not_feasible':
      executiveSummary = `The proposed development cannot proceed in its current configuration. Either the use is prohibited in this zone, or the site geometry cannot satisfy mandatory setbacks.`;
      primaryBottleneck = buildableFootprintSqM <= 0 ? 'Site dimensions are insufficient after deducting mandatory statutory setbacks.' : `Use "${intendedUse}" is prohibited in zone ${zoneCode}.`;
      actionableAdvice.push('Consider rezoning petition or alternate permitted land use categories.');
      actionableAdvice.push('Explore parcel amalgamation with adjacent survey plots to increase setback compliance.');
      break;

    default:
      executiveSummary = 'The subject parcel lies outside the current pilot spatial coverage area or zoning bylaws could not be resolved.';
      primaryBottleneck = 'Unmapped cadastral jurisdiction.';
      actionableAdvice.push('Submit a manual survey inquiry to the municipal corporation for official zone verification.');
  }

  return {
    executiveSummary,
    spatialAnalysis: `The plot yields an effective buildable footprint of ${Math.round(buildableFootprintSqM || 0)} m² after deducting statutory front, side, and rear setbacks. Ground coverage is ${coveragePct}%.`,
    primaryBottleneck,
    actionableAdvice,
    source: 'deterministic-fallback',
  };
}

/**
 * Generates an AI-powered natural language explanation of a feasibility study.
 *
 * @param {Object} studyResult - Study result from calculator/feasibilityController
 * @returns {Promise<Object>} Structured explanation
 */
async function explainFeasibilityStudy(studyResult) {
  const ai = getGeminiClient();

  if (!ai) {
    return generateFallbackExplanation(studyResult);
  }

  const prompt = `You are a Senior Municipal Planning Consultant specializing in Tamil Nadu Combined Development and Building Rules, 2019 (TNCDBR-2019).
Analyze this quantitative land feasibility assessment produced by our deterministic GIS engine:

Assessment Data:
- Intended Use: "${studyResult.intendedUse}"
- Municipal Zone: "${studyResult.zoneCode || 'IND-1'} (${studyResult.zoneName || 'Industrial Belt'})"
- Verdict: "${studyResult.verdict}"
- Plot Survey Area: ${studyResult.plotAreaSqM ? Math.round(studyResult.plotAreaSqM) + ' m²' : 'N/A'}
- Clear Buildable Footprint: ${studyResult.buildableFootprintSqM ? Math.round(studyResult.buildableFootprintSqM) + ' m²' : '0 m²'}
- Max Allowable Ground Coverage: ${studyResult.maxFootprintSqM ? Math.round(studyResult.maxFootprintSqM) + ' m²' : 'N/A'}
- Max Gross Floor Area (FAR): ${studyResult.maxFloorAreaSqM ? Math.round(studyResult.maxFloorAreaSqM) + ' m²' : 'N/A'}
- Estimated Achievable Floors: ${studyResult.estimatedFloors || 'N/A'}
- Setback Method: ${studyResult.method || 'Per-edge statutory offsets'}
- Edge Breakdown: ${JSON.stringify(studyResult.edgeBreakdown || [])}
- Technical Findings: ${JSON.stringify(studyResult.reasons || [])}

Rules:
1. Do NOT recalculate numbers. Accept the spatial engine numbers as verified ground truth.
2. Formulate clear, professional, actionable counsel for an architect or real estate developer.
3. Respond ONLY with a valid JSON object matching this schema:
{
  "executiveSummary": "2-3 sentences explaining the verdict and legal standing under TNCDBR 2019",
  "spatialAnalysis": "Concise analysis of how setbacks, depth, and ground coverage limit the footprint",
  "primaryBottleneck": "The single most limiting statutory factor for this plot",
  "actionableAdvice": ["Specific recommendation 1", "Specific recommendation 2"]
}`;

  try {
    const res = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(res.text);
    return {
      executiveSummary: parsed.executiveSummary || '',
      spatialAnalysis: parsed.spatialAnalysis || '',
      primaryBottleneck: parsed.primaryBottleneck || '',
      actionableAdvice: Array.isArray(parsed.actionableAdvice) ? parsed.actionableAdvice : [],
      source: 'gemini-3.8-flash',
    };
  } catch (err) {
    console.warn('[LLM Explainer] Gemini inference failed, using fallback:', err.message);
    return generateFallbackExplanation(studyResult);
  }
}

module.exports = {
  explainFeasibilityStudy,
  generateFallbackExplanation,
};

