/**
 * Константы для модуля комментариев
 */

export const COMMENT_CONSTANTS = {
  ERRORS: {
    CONTENT_REQUIRED: 'Содержимое комментария обязательно',
    INVALID_COMMENT_ID: 'Неверный ID комментария',
    COMMENT_NOT_FOUND: 'Комментарий не найден',
    NO_PERMISSION: 'Вы можете изменять только свои комментарии',
    TASK_NOT_FOUND: 'Задача не найдена',
    NO_ACCESS_TO_TASK: 'У вас нет доступа к этой задаче',
  },

  SUCCESS: {
    CREATED: 'Комментарий успешно добавлен',
    UPDATED: 'Комментарий успешно обновлен',
    DELETED: 'Комментарий успешно удален',
  },
} as const;

