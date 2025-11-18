import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { TODO_CONSTANTS } from '../constants/todo.constants';

/**
 * Схемы валидации для задач с использованием Zod
 */

// Схема для создания задачи
export const createTaskSchema = z.object({
  name: z
    .string({ message: 'Название должно быть строкой' })
    .min(1, TODO_CONSTANTS.ERRORS.NAME_REQUIRED)
    .max(255, 'Название слишком длинное'),
  
  description: z
    .string({ message: 'Описание должно быть строкой' })
    .max(5000, 'Описание слишком длинное')
    .nullable()
    .optional(),
  
  status: z
    .enum(['pending', 'in_progress', 'completed'], {
      message: 'Статус должен быть одним из: pending, in_progress, completed',
    })
    .optional(),
  
  priority: z
    .enum(['low', 'medium', 'high'], {
      message: 'Приоритет должен быть одним из: low, medium, high',
    })
    .nullable()
    .optional(),
  
  task_time: z
    .string({ message: 'task_time должно быть строкой в формате HH.MM' })
    .regex(/^([01]\d|2[0-3])\.[0-5]\d$/, 'task_time должно быть в формате HH.MM (00.00 - 23.59)')
    .nullable()
    .optional(),
  
  created_at: z
    .string({ message: 'created_at должно быть в формате ISO 8601 (например, 2025-11-10T12:00:00.000Z)' })
    .datetime({ message: 'created_at должно быть валидной датой ISO 8601' })
    .nullable()
    .optional(),
  
  shared_goal_id: z
    .number({ message: 'ID совместной цели должен быть числом' })
    .int('ID совместной цели должен быть целым числом')
    .positive('ID совместной цели должен быть положительным числом')
    .nullable()
    .optional(),
  
  assigned_to_id: z
    .number({ message: 'ID исполнителя должен быть числом' })
    .int('ID исполнителя должен быть целым числом')
    .positive('ID исполнителя должен быть положительным числом')
    .nullable()
    .optional(),
});

// Схема для обновления задачи
export const updateTaskSchema = z.object({
  name: z
    .string({ message: 'Название должно быть строкой' })
    .min(1, TODO_CONSTANTS.ERRORS.NAME_REQUIRED)
    .max(255, 'Название слишком длинное')
    .optional(),
  
  description: z
    .string({ message: 'Описание должно быть строкой' })
    .max(5000, 'Описание слишком длинное')
    .nullable()
    .optional(),
  
  status: z
    .enum(['pending', 'in_progress', 'completed'], {
      message: 'Статус должен быть одним из: pending, in_progress, completed',
    })
    .optional(),
  
  priority: z
    .enum(['low', 'medium', 'high'], {
      message: 'Приоритет должен быть одним из: low, medium, high',
    })
    .nullable()
    .optional(),
  
  task_time: z
    .string({ message: 'task_time должно быть строкой в формате HH.MM' })
    .regex(/^([01]\d|2[0-3])\.[0-5]\d$/, 'task_time должно быть в формате HH.MM (00.00 - 23.59)')
    .nullable()
    .optional(),
  
  created_at: z
    .string({ message: 'created_at должно быть в формате ISO 8601 (например, 2025-11-10T12:00:00.000Z)' })
    .datetime({ message: 'created_at должно быть валидной датой ISO 8601' })
    .nullable()
    .optional(),
  
  assigned_to_id: z
    .number({ message: 'ID исполнителя должен быть числом' })
    .int('ID исполнителя должен быть целым числом')
    .positive('ID исполнителя должен быть положительным числом')
    .nullable()
    .optional(),
}).refine(
  (data) =>
    data.name !== undefined ||
    data.description !== undefined ||
    data.status !== undefined ||
    data.priority !== undefined ||
    data.task_time !== undefined ||
    data.created_at !== undefined ||
    data.assigned_to_id !== undefined,
  {
    message: TODO_CONSTANTS.ERRORS.NO_FIELDS_TO_UPDATE,
  }
);

// Схема для валидации ID задачи
export const taskIdSchema = z.string().regex(/^\d+$/, TODO_CONSTANTS.ERRORS.INVALID_TASK_ID);

// Типы для TypeScript
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

// Импортируем validate из общей утилиты
export { validate } from '../utils/validation';

/**
 * Middleware для валидации ID задачи в параметрах
 */
export const validateTaskId = (req: Request, res: Response, next: NextFunction) => {
  try {
    taskIdSchema.parse(req.params.id);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: 'error',
        message: TODO_CONSTANTS.ERRORS.INVALID_TASK_ID,
      });
    }
    next(error);
  }
};

