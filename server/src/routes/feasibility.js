const { Router } = require('express');
const { z } = require('zod');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { runFeasibility, exportFeasibilityPdf, explainFeasibility } = require('../controllers/feasibilityController');

const position = z.tuple([z.number(), z.number()]);
const ring = z.array(position).min(4).max(500);

const bodySchema = z.object({
  intendedUse: z.string().min(1).max(50),
  plot: z.object({
    type: z.literal('Polygon'),
    coordinates: z.array(ring).length(1), // outer ring only; holes not supported yet
  }),
  frontEdgeIndex: z.number().int().nonnegative().optional(),
});

const router = Router();

// authenticate is optional — if token is present, req.user is set
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticate(req, res, (err) => {
      if (err) return next(); // token invalid → still allow unauthenticated run
      next();
    });
  }
  next();
};

router.post('/', optionalAuth, validate(bodySchema), runFeasibility);
router.post('/pdf', optionalAuth, validate(bodySchema), exportFeasibilityPdf);
router.post('/explain', optionalAuth, validate(bodySchema), explainFeasibility);

module.exports = router;
