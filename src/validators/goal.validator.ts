import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { GOAL_CONSTANTS } from '../constants/goal.constants';
import { validate } from '../utils/validation';

/**
 * Схемы валидации для совместных целей с использованием Zod
 */

// Схема для создания цели
export const createGoalSchema = z.object({
  name: z
    .string({ message: 'Название должно быть строкой' })
    .min(1, GOAL_CONSTANTS.ERRORS.NAME_REQUIRED)
    .max(255, 'Название слишком длинное'),
  
  description: z
    .string({ message: 'Описание должно быть строкой' })
    .max(5000, 'Описание слишком длинное')
    .nullable()
    .optional(),
  
  member_ids: z
    .array(z.number().int().positive('ID участника должен быть положительным числом'))
    .optional(),
});

// Схема для обновления цели
export const updateGoalSchema = z.object({
  name: z
    .string({ message: 'Название должно быть строкой' })
    .min(1, GOAL_CONSTANTS.ERRORS.NAME_REQUIRED)
    .max(255, 'Название слишком длинное')
    .optional(),
  
  description: z
    .string({ message: 'Описание должно быть строкой' })
    .max(5000, 'Описание слишком длинное')
    .nullable()
    .optional(),
}).refine(
  (data) => data.name !== undefined || data.description !== undefined,
  {
    message: GOAL_CONSTANTS.ERRORS.NO_FIELDS_TO_UPDATE,
  }
);

// Схема для приглашения участника
export const inviteMemberSchema = z.object({
  user_id: z
    .number({ message: 'ID пользователя должен быть числом' })
    .int('ID пользователя должен быть целым числом')
    .positive('ID пользователя должен быть положительным числом')
    .optional(),
  
  email: z
    .string({ message: 'Email должен быть строкой' })
    .email('Неверный формат email')
    .optional(),
}).refine(
  (data) => data.user_id !== undefined || data.email !== undefined,
  {
    message: 'Необходимо указать user_id или email',
  }
);

// Схема для валидации ID цели
export const goalIdSchema = z.string().regex(/^\d+$/, GOAL_CONSTANTS.ERRORS.INVALID_GOAL_ID);

// Типы для TypeScript
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

/**
 * Middleware для валидации ID цели в параметрах
 */
export const validateGoalId = (req: Request, res: Response, next: NextFunction) => {
  try {
    goalIdSchema.parse(req.params.id);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: 'error',
        message: GOAL_CONSTANTS.ERRORS.INVALID_GOAL_ID,
      });
    }
    next(error);
  }
};

export { validate };

