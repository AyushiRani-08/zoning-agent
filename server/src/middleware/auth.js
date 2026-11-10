const jwt = require('jsonwebtoken');
const { AppError } = require('../utils/errors');
const User = require('../models/User');

/**
 * Verifies the JWT from the Authorization header.
 * Attaches req.user = { id, role } on success.
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('UNAUTHORIZED', 'Missing or malformed Authorization header', 401));
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('TOKEN_EXPIRED', 'Token has expired — please log in again', 401));
    }
    return next(new AppError('UNAUTHORIZED', 'Invalid token', 401));
  }
}

/**
 * Restricts access to users with a specific role.
 * Always use after authenticate().
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('FORBIDDEN', 'You do not have permission to perform this action', 403));
    }
    next();
  };
}

module.exports = { authenticate, requireRole };

