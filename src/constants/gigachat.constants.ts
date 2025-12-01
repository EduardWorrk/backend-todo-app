/**
 * Константы и сообщения для интеграции с GigaChat
 */
export const GIGACHAT_CONSTANTS = {
  DEFAULT_MODEL: 'GigaChat-2-Max',
  DEFAULT_SCOPE: 'GIGACHAT_API_PERS',
  DEFAULT_TIMEOUT_MS: 60_000,
  MAX_HISTORY_LENGTH: 20,
  MAX_MESSAGE_LENGTH: 4000,
  ERRORS: {
    NOT_CONFIGURED: 'GigaChat не настроен. Укажите переменные окружения GIGACHAT_*.',
    TOKEN_REQUEST_FAILED: 'Не удалось получить токен доступа GigaChat',
    CHAT_REQUEST_FAILED: 'Не удалось получить ответ от GigaChat',
    MESSAGE_OR_HISTORY_REQUIRED: 'Передайте текст сообщения или массив messages',
  },
  SUCCESS: {
    MESSAGE_SENT: 'Ответ получен от GigaChat',
  },
} as const;


