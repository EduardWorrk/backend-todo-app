import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

/**
 * Централизованный обработчик ошибок
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Логирование ошибки
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Обработка кастомных ошибок приложения
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  // Обработка ошибок Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Ошибка уникального ограничения (дубликат)
    if (err.code === 'P2002') {
      const target = err.meta?.target as string[] | undefined;
      const field = target?.[0] || 'field';
      
      return res.status(409).json({
        status: 'error',
        message: `User with this ${field} already exists`,
      });
    }

    // Ошибка не найденной записи
    if (err.code === 'P2025') {
      return res.status(404).json({
        status: 'error',
        message: 'Resource not found',
      });
    }

    // Ошибка отсутствующего столбца (миграции не применены)
    if (err.code === 'P2021' || err.code === 'P2022' || err.message?.includes('column') || err.message?.includes('does not exist')) {
      return res.status(500).json({
        status: 'error',
        message: 'Database schema is out of sync. Please run migrations.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
        hint: process.env.NODE_ENV === 'development' ? 'Run: npx prisma db push or npm run prisma:migrate' : undefined,
      });
    }

    // Другие ошибки Prisma
    return res.status(500).json({
      status: 'error',
      message: 'Database error occurred',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      code: process.env.NODE_ENV === 'development' ? err.code : undefined,
    });
  }

  // Ошибки валидации Zod
  if (err instanceof ZodError) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation error',
      errors: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  // Обработка неизвестных ошибок
  return res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};

/**
 * Обертка для асинхронных обработчиков маршрутов
 * Автоматически перехватывает ошибки и передает их в errorHandler
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

