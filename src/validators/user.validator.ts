import { z } from 'zod';
import { AUTH_CONSTANTS } from '../constants/auth.constants';

/**
 * Схемы валидации для пользователя с использованием Zod
 */

// Схема для обновления профиля
export const updateProfileSchema = z.object({
  login: z
    .string({ message: 'Логин должен быть строкой' })
    .min(1, 'Логин не может быть пустым')
    .max(255, 'Логин слишком длинный')
    .optional(),
  
  email: z
    .string({ message: 'Email должен быть строкой' })
    .email('Неверный формат email')
    .max(255, 'Email слишком длинный')
    .optional(),
}).refine(
  (data) => data.login !== undefined || data.email !== undefined,
  {
    message: 'Необходимо указать хотя бы одно поле (login или email) для обновления',
  }
);

// Схема для смены пароля
export const changePasswordSchema = z.object({
  oldPassword: z
    .string({ message: 'Текущий пароль должен быть строкой' })
    .min(1, 'Текущий пароль не может быть пустым'),
  
  newPassword: z
    .string({ message: 'Новый пароль должен быть строкой' })
    .min(
      AUTH_CONSTANTS.MIN_PASSWORD_LENGTH,
      `Новый пароль должен содержать минимум ${AUTH_CONSTANTS.MIN_PASSWORD_LENGTH} символов`
    ),
}).refine(
  (data) => data.oldPassword !== data.newPassword,
  {
    message: 'Новый пароль должен отличаться от текущего',
    path: ['newPassword'],
  }
);

// Типы для TypeScript
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// Импортируем validate из общей утилиты
export { validate } from '../utils/validation';

