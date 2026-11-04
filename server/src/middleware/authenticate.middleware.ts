import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../config/jwt';
import { UnauthorizedError } from '../errors';

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('Missing access token');
    }

    const payload = verifyAccessToken(token);
    req.user = { userId: payload.userId, role: payload.role };
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
      return;
    }
    // jsonwebtoken errors
    const err = error as Error;
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
