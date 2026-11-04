import { CookieOptions } from 'express';
import { env } from './env';

const isProduction = env.NODE_ENV === 'production';

export const REFRESH_TOKEN_COOKIE = 'refresh_token';

export const refreshTokenCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'strict' : 'lax',
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

export const clearRefreshTokenCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'strict' : 'lax',
  path: '/api/auth',
};
