import jwt, { JwtPayload } from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from './env';
import { Role } from '@prisma/client';

export interface AccessTokenPayload {
  userId: string;
  role: Role;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign({ userId: payload.userId, role: payload.role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRY,
    subject: payload.userId,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload & AccessTokenPayload;
  return { userId: decoded.userId, role: decoded.role as Role };
}

/**
 * Generate a cryptographically random refresh token.
 * Uses 64 bytes of randomness → 128 hex chars.
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

/**
 * Parse a duration string like '7d', '24h', '30m' into milliseconds.
 */
export function parseDurationToMs(duration: string): number {
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
