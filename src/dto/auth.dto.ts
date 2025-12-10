/**
 * DTO (Data Transfer Objects) для модуля аутентификации
 */

export interface RegisterDto {
  login: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponseDto {
  status: 'success' | 'error';
  message: string;
  token?: string;
  user?: {
    id: number;
    login: string;
    email: string;
    telegram_id?: number | null;
    created_at: Date;
    avatar_url?: string | null;
  };
  error?: string;
}

export interface UserDto {
  id: number;
  login: string;
  email: string;
  telegram_id?: number | null;
  created_at: Date;
   avatar_url?: string | null;
}

export interface RequestTelegramCodeDto {
  telegram_id: number;
}

export interface TelegramLoginDto {
  telegram_id?: number;
  code: string;
}

