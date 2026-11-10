const { runStudy } = require('../services/feasibility/calculator');
const pilotRules = require('../rules/pilotRules');

// TODO: replace pilotRules with a MongoDB lookup by zone once zones are loaded.
exports.runFeasibility = (req, res, next) => {
  try {
    const { plot, intendedUse, frontEdgeIndex } = req.body;
    res.json(runStudy(plot, intendedUse, pilotRules, { frontEdgeIndex }));
  } catch (err) {
    next(err);
  }
};
