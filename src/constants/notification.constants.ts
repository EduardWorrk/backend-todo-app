/**
 * Константы для модуля уведомлений
 */

export const NOTIFICATION_CONSTANTS = {
  // Типы уведомлений
  TYPES: {
    TASK_ASSIGNED: 'task_assigned',
    TASK_COMPLETED: 'task_completed',
    TASK_UPDATED: 'task_updated',
    COMMENT_ADDED: 'comment_added',
    GOAL_INVITED: 'goal_invited',
    GOAL_UPDATED: 'goal_updated',
    MEMBER_ADDED: 'member_added',
    MEMBER_REMOVED: 'member_removed',
  },

  // Сообщения об ошибках
  ERRORS: {
    INVALID_NOTIFICATION_ID: 'Неверный ID уведомления',
    NOTIFICATION_NOT_FOUND: 'Уведомление не найдено',
    NO_PERMISSION: 'У вас нет доступа к этому уведомлению',
  },

  // Сообщения об успехе
  SUCCESS: {
    MARKED_AS_READ: 'Уведомление отмечено как прочитанное',
    ALL_MARKED_AS_READ: 'Все уведомления отмечены как прочитанные',
  },
} as const;

