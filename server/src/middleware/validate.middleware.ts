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

    next();
  };
}
