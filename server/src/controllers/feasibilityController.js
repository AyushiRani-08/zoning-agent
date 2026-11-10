const { runStudy } = require('../services/feasibility/calculator');
const { lookupZoneAndRules } = require('../services/zoning/lookup');

exports.runFeasibility = async (req, res, next) => {
  try {
    const { plot, intendedUse, frontEdgeIndex } = req.body;

    const { zone, rules, outsideCoverage } = await lookupZoneAndRules(plot);

    if (outsideCoverage || !rules) {
      return res.json({
        verdict: 'cannot_assess',
        reasons: ['Plot location is outside the mapped pilot coverage area or zoning data is unavailable.'],
        zoneCode: null,
        plotAreaSqM: null,
        buildableFootprintSqM: 0,
        maxFootprintSqM: 0,
        maxFloorAreaSqM: 0,
        estimatedFloors: 0,
        method: 'spatial zone lookup ($geoIntersects)',
        rulesSource: null,
      });
    }

    const studyResult = runStudy(plot, intendedUse, rules, { frontEdgeIndex });

    res.json({
      ...studyResult,
      zoneName: zone ? zone.name : undefined,
    });
  } catch (err) {
    next(err);
  }
};
