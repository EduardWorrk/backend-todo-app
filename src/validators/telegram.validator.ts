import { z } from 'zod';

/**
 * Схемы валидации для Telegram аутентификации с использованием Zod
 */

// Схема для запроса кода авторизации
export const requestTelegramCodeSchema = z.object({
  telegram_id: z
    .number({ message: 'Telegram ID должен быть числом' })
    .int('Telegram ID должен быть целым числом')
    .positive('Telegram ID должен быть положительным числом'),
});

// Схема для входа через Telegram
export const telegramLoginSchema = z.object({
  telegram_id: z
    .number({ message: 'Telegram ID должен быть числом' })
    .int('Telegram ID должен быть целым числом')
    .positive('Telegram ID должен быть положительным числом')
    .optional(),
  code: z
    .string({ message: 'Код должен быть строкой' })
    .length(6, 'Код должен состоять из 6 символов')
    .regex(/^\d+$/, 'Код должен содержать только цифры'),
});

// Типы для TypeScript
export type RequestTelegramCodeInput = z.infer<typeof requestTelegramCodeSchema>;
export type TelegramLoginInput = z.infer<typeof telegramLoginSchema>;

// Импортируем validate из общей утилиты
export { validate } from '../utils/validation';



