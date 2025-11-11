/**
 * Константы для модуля аутентификации
 */

export const AUTH_CONSTANTS = {
  // Пароль
  MIN_PASSWORD_LENGTH: 6,
  BCRYPT_SALT_ROUNDS: 10,

  // Сообщения об ошибках
  ERRORS: {
    REQUIRED_FIELDS: 'Все поля (login, password, email) обязательны',
    INVALID_EMAIL: 'Неверный формат email',
    PASSWORD_TOO_SHORT: 'Пароль должен содержать минимум 6 символов',
    USER_EXISTS_LOGIN: 'Пользователь с таким логином уже существует',
    USER_EXISTS_EMAIL: 'Пользователь с таким email уже существует',
    USER_EXISTS_BOTH: 'Пользователь с таким логином и email уже существует',
    INVALID_CREDENTIALS: 'Неверный email или пароль',
    INTERNAL_ERROR: 'Внутренняя ошибка сервера',
  },

  // Сообщения об успехе
  SUCCESS: {
    REGISTERED: 'Пользователь успешно зарегистрирован',
    LOGIN: 'Успешный вход',
  },
} as const;

