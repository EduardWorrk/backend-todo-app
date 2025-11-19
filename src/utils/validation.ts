import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

/**
 * Утилита для валидации запросов с использованием Zod
 */

/**
 * Middleware для валидации тела запроса
 * Нормализует данные и заменяет req.body валидированными значениями
 */
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Парсим и валидируем данные, получаем нормализованный результат
      const validatedData = schema.parse(req.body);
      // Заменяем req.body на валидированные данные
      req.body = validatedData;
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

