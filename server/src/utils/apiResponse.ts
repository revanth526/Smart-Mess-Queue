import { Response } from 'express';

interface SuccessOptions<T> {
  res: Response;
  data: T;
  statusCode?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function sendSuccess<T>({ res, data, statusCode = 200, pagination }: SuccessOptions<T>) {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(pagination && { pagination }),
  });
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
) {
  const errorBody: { code: string; message: string; details?: unknown } = { code, message };
  if (details !== undefined) {
    errorBody.details = details;
  }
  return res.status(statusCode).json({
    success: false,
    error: errorBody,
  });
}
