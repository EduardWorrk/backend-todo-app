import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { COMMENT_CONSTANTS } from '../constants/comment.constants';
import { validate } from '../utils/validation';

/**
 * Схемы валидации для комментариев с использованием Zod
 */


// Схема для создания комментария
export const createCommentSchema = z.object({
  content: z
    .string({ message: 'Содержимое должно быть строкой' })
    .min(1, COMMENT_CONSTANTS.ERRORS.CONTENT_REQUIRED)
    .max(5000, 'Содержимое слишком длинное'),
});

// Схема для обновления комментария (контент обязателен)
export const updateCommentSchema = z.object({
  content: z
    .string({ message: 'Содержимое должно быть строкой' })
    .min(1, COMMENT_CONSTANTS.ERRORS.CONTENT_REQUIRED)
    .max(5000, 'Содержимое слишком длинное'),
});

// Схема для валидации ID комментария
export const commentIdSchema = z.string().regex(/^\d+$/, COMMENT_CONSTANTS.ERRORS.INVALID_COMMENT_ID);

// Типы для TypeScript
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;

/**
 * Middleware для валидации ID комментария в параметрах
 */
export const validateCommentId = (req: Request, res: Response, next: NextFunction) => {
  try {
    commentIdSchema.parse(req.params.id);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: 'error',
        message: COMMENT_CONSTANTS.ERRORS.INVALID_COMMENT_ID,
      });
    }
    next(error);
  }
};

export { validate };

