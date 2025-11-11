import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

/**
 * Утилита для валидации запросов с использованием Zod
 */

/**
 * Middleware для валидации тела запроса
 */
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          status: 'error',
          message: 'Ошибка валидации',
          errors: error.issues.map((err: z.ZodIssue) => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

