const { authService } = require('../services/auth.service');
const { sendSuccess } = require('../utils/apiResponse');
const {
  REFRESH_TOKEN_COOKIE,
  refreshTokenCookieOptions,
  clearRefreshTokenCookieOptions,
} = require('../config/cookies');
const { UnauthorizedError } = require('../errors');

const authController = {
  async register(req, res, next) {
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

  async login(req, res, next) {
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

  async refresh(req, res, next) {
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

  async logout(req, res, next) {
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

  async me(req, res, next) {
    try {
      const userId = req.user.userId;
      const user = await authService.getProfile(userId);
      return sendSuccess({ res, data: { user } });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = {
  authController,
};
