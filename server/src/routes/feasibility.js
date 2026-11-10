const { Router } = require('express');
const { z } = require('zod');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { runFeasibility } = require('../controllers/feasibilityController');

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

// authenticate is optional — if token is present, req.user is set and report is saved
// If no token, the study still runs but nothing is persisted
router.post('/', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticate(req, res, (err) => {
      if (err) return next(); // token invalid → still allow unauthenticated run
      next();
    });
  }
  next();
}, validate(bodySchema), runFeasibility);

module.exports = router;
