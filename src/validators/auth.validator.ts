import { z } from 'zod';
import { AUTH_CONSTANTS } from '../constants/auth.constants';

/**
 * Схемы валидации для аутентификации с использованием Zod
 */

// Схема для регистрации
export const registerSchema = z.object({
  login: z
    .string({ message: 'Логин должен быть строкой' })
    .min(1, 'Логин не может быть пустым')
    .max(255, 'Логин слишком длинный'),
  
  email: z
    .string({ message: 'Email должен быть строкой' })
    .email('Неверный формат email')
    .max(255, 'Email слишком длинный'),
  
  password: z
    .string({ message: 'Пароль должен быть строкой' })
    .min(
      AUTH_CONSTANTS.MIN_PASSWORD_LENGTH,
      `Пароль должен содержать минимум ${AUTH_CONSTANTS.MIN_PASSWORD_LENGTH} символов`
    ),
});

// Схема для входа
export const loginSchema = z.object({
  email: z
    .string({ message: 'Email должен быть строкой' })
    .email('Неверный формат email'),
  
  password: z
    .string({ message: 'Пароль должен быть строкой' })
    .min(1, 'Пароль не может быть пустым'),
});

// Типы для TypeScript
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// Импортируем validate из общей утилиты
export { validate } from '../utils/validation';

