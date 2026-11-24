const { env } = require('./env');

const isProduction = env.NODE_ENV === 'production';

const REFRESH_TOKEN_COOKIE = 'refresh_token';

// In production across separate domains (e.g. Vercel frontend + Render backend),
// sameSite must be 'none' with secure: true to permit credentials across origins.
const sameSitePolicy = isProduction
  ? process.env.COOKIE_SAME_SITE || 'none'
  : 'lax';

const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: sameSitePolicy,
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

const clearRefreshTokenCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: sameSitePolicy,
  path: '/api/auth',
};

module.exports = {
  REFRESH_TOKEN_COOKIE,
  refreshTokenCookieOptions,
  clearRefreshTokenCookieOptions,
};

