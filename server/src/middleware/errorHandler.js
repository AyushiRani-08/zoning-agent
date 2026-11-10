const { AppError } = require('../utils/errors');

function notFound(req, res, next) {
  next(new AppError('NOT_FOUND', `No route for ${req.method} ${req.path}`, 404));
}

// Calculator errors are thrown as 'CODE: message'. Turn them into 400s with a code.
function errorHandler(err, req, res, next) {
  let { code, status, message, details } = err;
  if (!code) {
    const m = /^([A-Z_]+): (.*)$/.exec(err.message || '');
    if (m) { code = m[1]; message = m[2]; status = 400; }
  }
  if (err.type === 'entity.parse.failed') { code = 'INVALID_JSON'; message = 'Body is not valid JSON'; status = 400; }
  if (!code) {
    console.error(err);
    code = 'INTERNAL_ERROR'; message = 'Something went wrong'; status = 500;
  }
  res.status(status || 500).json({ error: { code, message, details } });
}

module.exports = { notFound, errorHandler };
