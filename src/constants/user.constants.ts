/**
 * Константы для модуля пользователя
 */

export const USER_CONSTANTS = {
  // Сообщения об ошибках
  ERRORS: {
    USER_NOT_FOUND: 'Пользователь не найден',
    INVALID_OLD_PASSWORD: 'Неверный текущий пароль',
    PASSWORD_SAME: 'Новый пароль должен отличаться от текущего',
    EMAIL_EXISTS: 'Пользователь с таким email уже существует',
    LOGIN_EXISTS: 'Пользователь с таким логином уже существует',
    INVALID_TOKEN: 'Неверный или истекший токен',
  },

  // Сообщения об успехе
  SUCCESS: {
    PROFILE_UPDATED: 'Профиль успешно обновлен',
    PASSWORD_CHANGED: 'Пароль успешно изменен',
    LOGGED_OUT: 'Успешный выход',
    TOKEN_REFRESHED: 'Токен успешно обновлен',
  },
} as const;

