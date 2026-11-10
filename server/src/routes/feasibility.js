const { Router } = require('express');
const { z } = require('zod');
const validate = require('../middleware/validate');
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
router.post('/', validate(bodySchema), runFeasibility);
module.exports = router;
