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
  
  assigned_to_id: z
    .number({ message: 'ID исполнителя должен быть числом' })
    .int('ID исполнителя должен быть целым числом')
    .positive('ID исполнителя должен быть положительным числом')
    .nullable()
    .optional(),
}).refine(
  (data) => data.name !== undefined || data.description !== undefined || data.status !== undefined || data.assigned_to_id !== undefined,
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

