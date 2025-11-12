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
    AVATAR_NOT_PROVIDED: 'Файл аватара не предоставлен',
    INVALID_FILE_TYPE: 'Недопустимый тип файла. Разрешены только: jpg, jpeg, png, webp',
    FILE_TOO_LARGE: 'Файл слишком большой. Максимальный размер: 5MB',
    IMAGE_TOO_SMALL: 'Изображение слишком маленькое. Минимальный размер: 100x100px',
    AVATAR_UPLOAD_FAILED: 'Ошибка при загрузке аватара',
    AVATAR_DELETE_FAILED: 'Ошибка при удалении аватара',
  },

  // Сообщения об успехе
  SUCCESS: {
    PROFILE_UPDATED: 'Профиль успешно обновлен',
    PASSWORD_CHANGED: 'Пароль успешно изменен',
    LOGGED_OUT: 'Успешный выход',
    TOKEN_REFRESHED: 'Токен успешно обновлен',
    AVATAR_UPLOADED: 'Аватар успешно загружен',
    AVATAR_DELETED: 'Аватар успешно удален',
  },

  // Настройки загрузки файлов
  AVATAR: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_MIME_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
    MIN_WIDTH: 100,
    MIN_HEIGHT: 100,
    SIZES: {
      thumbnail: { width: 150, height: 150 },
      medium: { width: 300, height: 300 },
      large: { width: 600, height: 600 },
    },
    UPLOAD_PATH: 'uploads/avatars',
    QUALITY: 85,
  },
} as const;

