/**
 * DTO для работы с GigaChat
 */

export type GigaChatRole = 'system' | 'user' | 'assistant';

export interface GigaChatMessageDto {
  role: GigaChatRole;
  content: string;
}

export interface SendGigaChatMessageDto {
  /**
   * Упрощённый вариант запроса — одиночное сообщение пользователя
   */
  message?: string;

  /**
   * Полная история в формате OpenAI / GigaChat
   */
  messages?: GigaChatMessageDto[];

  /**
   * Дополнительные параметры модели
   */
  temperature?: number;
  top_p?: number;
}

export interface GigaChatUsageDto {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

export interface GigaChatChoiceDto {
  index: number;
  message: GigaChatMessageDto;
  finish_reason?: string | null;
}

export interface GigaChatResponseDto {
  reply: string;
  model: string;
  usage?: GigaChatUsageDto | null;
}


