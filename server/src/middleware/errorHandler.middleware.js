const { AppError } = require('../errors');
const { Prisma } = require('@prisma/client');

function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    const errorBody = {
      code: err.code,
      message: err.message,
    };
    if (err.details !== undefined) {
      errorBody.details = err.details;
    }
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: errorBody,
    });
  }

  // Handle Prisma known request errors cleanly
  if (err && (err instanceof Prisma.PrismaClientKnownRequestError || (typeof err.code === 'string' && err.code.startsWith('P')))) {
    if (err.code === 'P2025') {
      const msg = 'The requested resource was not found';
      return res.status(404).json({
        success: false,
        message: msg,
        error: {
          code: 'NOT_FOUND',
          message: msg,
        },
      });
    }
    if (err.code === 'P2003') {
      const msg = 'Cannot delete or update resource because other records depend on it';
      return res.status(400).json({
        success: false,
        message: msg,
        error: {
          code: 'FOREIGN_KEY_VIOLATION',
          message: msg,
        },
      });
    }
    if (err.code === 'P2002') {
      const msg = 'A resource with this unique value already exists';
      return res.status(409).json({
        success: false,
        message: msg,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: msg,
        },
      });
    }
  }

  // Unexpected error
  if (process.env.NODE_ENV !== 'test') {
    console.error('Unhandled error:', err);
  }
  const genericMsg = 'Something went wrong';
  return res.status(500).json({
    success: false,
    message: genericMsg,
    error: {
      code: 'INTERNAL_ERROR',
      message: genericMsg,
    },
  });
}

module.exports = {
  errorHandler,
};

