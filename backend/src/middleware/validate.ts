import { z, type ZodSchema } from 'zod';
import type { Request, Response, NextFunction } from 'express';

export const chatMessageSchema = z.object({
  message: z
    .string({ required_error: 'message is required' })
    .min(1, 'Message cannot be empty')
    .max(5000, 'Message is too long (max 5000 characters)')
    .transform((s) => s.trim())
    .refine((s) => s.length > 0, 'Message cannot be only whitespace'),

  sessionId: z.string().uuid('sessionId must be a valid UUID').optional(),
});

/** Generic body-validation middleware factory. Validates and replaces req.body. */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation error',
        details: result.error.errors.map((e) => ({
          field: e.path.join('.') || 'root',
          message: e.message,
        })),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
