const { runStudy, validatePlot } = require('../services/feasibility/calculator');
const { lookupZoneAndRules } = require('../services/zoning/lookup');
const Report = require('../models/Report');
const mongoose = require('mongoose');

exports.runFeasibility = async (req, res, next) => {
  try {
    const { plot, intendedUse, frontEdgeIndex } = req.body;

    validatePlot(plot);

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
    const result = {
      ...studyResult,
      zoneName: zone ? zone.name : undefined,
    };

    // Save report to DB if the user is authenticated (token is optional on this route)
    if (req.user && mongoose.connection.readyState === 1) {
      try {
        const saved = await Report.create({
          userId: req.user.id,
          plot,
          intendedUse,
          frontEdgeIndex: frontEdgeIndex ?? null,
          verdict: studyResult.verdict,
          reasons: studyResult.reasons,
          zoneCode: studyResult.zoneCode,
          zoneName: zone ? zone.name : undefined,
          plotAreaSqM: studyResult.plotAreaSqM,
          buildableFootprintSqM: studyResult.buildableFootprintSqM,
          maxFootprintSqM: studyResult.maxFootprintSqM,
          maxFloorAreaSqM: studyResult.maxFloorAreaSqM,
          estimatedFloors: studyResult.estimatedFloors,
          method: studyResult.method,
          edgeBreakdown: studyResult.edgeBreakdown,
          buildableFootprint: studyResult.buildableFootprint,
          rulesSource: studyResult.rulesSource,
        });
        result.reportId = saved._id;
      } catch (saveErr) {
        // Don't fail the response if save fails — just log it
        console.error('[Report] Save failed:', saveErr.message);
      }
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
};
