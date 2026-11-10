const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { listReports, getReport, deleteReport, exportReportPdf } = require('../controllers/reportsController');

const router = Router();
router.use(authenticate); // All report routes require a valid token

router.get('/', listReports);
router.get('/:id', getReport);
router.get('/:id/pdf', exportReportPdf);
router.delete('/:id', deleteReport);

module.exports = router;

