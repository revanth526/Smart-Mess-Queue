const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { env } = require('./env');

function signAccessToken(payload) {
  return jwt.sign({ userId: payload.userId, role: payload.role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRY,
    subject: payload.userId,
  });
}

function verifyAccessToken(token) {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
  const userId = decoded.userId || decoded.id || decoded.sub || decoded.user?.id;
  const role = decoded.role || decoded.user?.role || decoded.userRole || decoded.roles?.[0];
  return { ...decoded, userId, role };
}

/**
 * Generate a cryptographically random refresh token.
 * Uses 64 bytes of randomness → 128 hex chars.
 */
function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

/**
 * Parse a duration string like '7d', '24h', '30m' into milliseconds.
 */
function parseDurationToMs(duration) {
  const match = duration.match(/^(\d+)([dhms])$/);
  if (!match) throw new Error(`Invalid duration format: ${duration}`);
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'm':
      return value * 60 * 1000;
    case 's':
      return value * 1000;
    default:
      throw new Error(`Unknown duration unit: ${unit}`);
  }
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  parseDurationToMs,
};

