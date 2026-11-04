import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess } from '../utils/apiResponse';
import {
  REFRESH_TOKEN_COOKIE,
  refreshTokenCookieOptions,
  clearRefreshTokenCookieOptions,
} from '../config/cookies';
import { UnauthorizedError } from '../errors';

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, studentId, password, rollNo } = req.body;

      const result = await authService.register({
        name,
        email,
        studentId,
        password,
        rollNo,
      });

      // Set refresh token as HTTP-only cookie
      res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, refreshTokenCookieOptions);

      return sendSuccess({
        res,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
        statusCode: 201,
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId, email, password } = req.body;

      const result = await authService.login({ studentId, email, password });

      // Set refresh token as HTTP-only cookie
      res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, refreshTokenCookieOptions);

      return sendSuccess({
        res,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

      if (!refreshToken) {
        throw new UnauthorizedError('No refresh token provided');
      }

      const result = await authService.refresh(refreshToken);

      // Set new refresh token cookie
      res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, refreshTokenCookieOptions);

      return sendSuccess({
        res,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      // Clear the cookie regardless
      res.clearCookie(REFRESH_TOKEN_COOKIE, clearRefreshTokenCookieOptions);

      return sendSuccess({ res, data: { message: 'Logged out successfully' } });
    } catch (error) {
      next(error);
    }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const user = await authService.getProfile(userId);
      return sendSuccess({ res, data: { user } });
    } catch (error) {
      next(error);
    }
  },
};
