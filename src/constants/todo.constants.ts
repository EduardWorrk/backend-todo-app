/**
 * Константы для модуля задач
 */

export const TODO_CONSTANTS = {
  // Сообщения об ошибках
  ERRORS: {
    NAME_REQUIRED: 'Название задачи обязательно',
    INVALID_TASK_ID: 'Неверный ID задачи',
    TASK_NOT_FOUND: 'Задача не найдена',
    NO_PERMISSION: 'Вы можете изменять только свои задачи',
    NO_FIELDS_TO_UPDATE: 'Необходимо указать хотя бы одно поле (name, description, status, priority, task_time или assigned_to_id) для обновления',
    INTERNAL_ERROR: 'Внутренняя ошибка сервера',
  },

  // Сообщения об успехе
  SUCCESS: {
    CREATED: 'Задача успешно создана',
    UPDATED: 'Задача успешно обновлена',
    DELETED: 'Задача успешно удалена',
  },
} as const;

