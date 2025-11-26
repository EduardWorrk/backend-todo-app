import { z } from 'zod';
import { CATEGORY_CONSTANTS } from '../constants/category.constants';
import { Request, Response, NextFunction } from 'express';

export const createCategorySchema = z.object({
  name: z
    .string({ message: 'Название категории должно быть строкой' })
    .min(1, CATEGORY_CONSTANTS.ERRORS.NAME_REQUIRED)
    .max(120, CATEGORY_CONSTANTS.ERRORS.NAME_TOO_LONG)
    .transform((val) => val.trim()),
  color: z
    .string({ message: 'Цвет должен быть строкой' })
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, CATEGORY_CONSTANTS.ERRORS.INVALID_COLOR)
    .optional()
    .nullable(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export { validate } from '../utils/validation';

const categoryIdSchema = z
  .string()
  .min(1, 'ID категории обязателен')
  .regex(/^\d+$/, 'ID категории должен быть числом');

export const validateCategoryId = (req: Request, res: Response, next: NextFunction) => {
  try {
    categoryIdSchema.parse(req.params.id);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: 'error',
        message: error.issues[0]?.message || 'Некорректный ID категории',
      });
    }
    next(error);
  }
};

