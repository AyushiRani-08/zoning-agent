const { AppError } = require('../utils/errors');

// Validates req.body against a Zod schema and replaces it with the parsed value.
module.exports = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    return next(new AppError('INVALID_REQUEST', 'Request body is invalid', 400, details));
  }
  req.body = result.data;
  next();
};
