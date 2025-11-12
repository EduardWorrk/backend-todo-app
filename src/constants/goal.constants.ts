/**
 * Константы для модуля совместных целей
 */

export const GOAL_CONSTANTS = {
  // Сообщения об ошибках
  ERRORS: {
    NAME_REQUIRED: 'Название цели обязательно',
    INVALID_GOAL_ID: 'Неверный ID цели',
    GOAL_NOT_FOUND: 'Цель не найдена',
    NO_PERMISSION: 'У вас нет прав на выполнение этого действия',
    USER_NOT_FOUND: 'Пользователь не найден',
    USER_ALREADY_MEMBER: 'Пользователь уже является участником цели',
    USER_NOT_MEMBER: 'Пользователь не является участником цели',
    CANNOT_REMOVE_OWNER: 'Нельзя удалить владельца цели',
    CANNOT_LEAVE_OWN_GOAL: 'Владелец не может покинуть свою цель',
    NO_FIELDS_TO_UPDATE: 'Необходимо указать хотя бы одно поле (name или description) для обновления',
  },

  // Сообщения об успехе
  SUCCESS: {
    CREATED: 'Цель успешно создана',
    UPDATED: 'Цель успешно обновлена',
    DELETED: 'Цель успешно удалена',
    MEMBER_INVITED: 'Пользователь успешно приглашен',
    MEMBER_REMOVED: 'Участник успешно удален',
    LEFT: 'Вы успешно покинули цель',
  },

  // Роли участников
  ROLES: {
    OWNER: 'owner',
    ADMIN: 'admin',
    MEMBER: 'member',
  },
} as const;

