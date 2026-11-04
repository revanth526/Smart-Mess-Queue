import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from '../errors';

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      throw new ValidationError(result.error.issues);
    }

    // Write transformed data back so Zod transforms (e.g. email lowercasing) take effect
    const parsed = result.data as { body?: unknown; query?: unknown; params?: unknown };
    if (parsed.body) req.body = parsed.body;
    if (parsed.query) req.query = parsed.query as typeof req.query;
    if (parsed.params) req.params = parsed.params as typeof req.params;

    next();
  };
}
