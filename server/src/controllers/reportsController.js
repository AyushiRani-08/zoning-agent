const Report = require('../models/Report');
const { AppError } = require('../utils/errors');

// GET /api/reports  — list current user's reports (newest first)
exports.listReports = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      Report.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-buildableFootprint -edgeBreakdown'), // Omit heavy GeoJSON from list view
      Report.countDocuments({ userId: req.user.id }),
    ]);

    res.json({
      total,
      page,
      pages: Math.ceil(total / limit),
      reports,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/:id  — get one full report (including buildableFootprint GeoJSON)
exports.getReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) return next(new AppError('NOT_FOUND', 'Report not found', 404));

    // Users can only access their own reports; admins can access all
    if (report.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('FORBIDDEN', 'You do not have access to this report', 403));
    }

    res.json(report);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/reports/:id  — delete a report (owner or admin)
exports.deleteReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return next(new AppError('NOT_FOUND', 'Report not found', 404));

    if (report.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('FORBIDDEN', 'You do not have access to this report', 403));
    }

    await report.deleteOne();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

