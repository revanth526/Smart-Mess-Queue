import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    const errorBody: { code: string; message: string; details?: unknown } = {
      code: err.code,
      message: err.message,
    };
    if (err.details !== undefined) {
      errorBody.details = err.details;
    }
    return res.status(err.statusCode).json({
      success: false,
      error: errorBody,
    });
  }

  // Unexpected error
  console.error('Unhandled error:', err);
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong',
    },
  });
}
