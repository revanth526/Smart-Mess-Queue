const { verifyAccessToken } = require('../config/jwt');
const { UnauthorizedError } = require('../errors');

function authenticate(req, _res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('Missing access token');
    }

    const payload = verifyAccessToken(token);
    const userId = payload.userId || payload.id || payload.sub;
    const role = String(payload.role || '').trim().toUpperCase();

    req.user = { userId, role };
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
      return;
    }
    // jsonwebtoken errors
    const err = error;
    if (err.name === 'TokenExpiredError') {
      next(new UnauthorizedError('Access token has expired'));
      return;
    }
    if (err.name === 'JsonWebTokenError' || err.name === 'NotBeforeError') {
      next(new UnauthorizedError('Invalid access token'));
      return;
    }
    next(new UnauthorizedError('Authentication failed'));
  }
}

const verifyToken = authenticate;

module.exports = {
  authenticate,
  verifyToken,
};
