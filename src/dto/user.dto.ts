/**
 * DTO (Data Transfer Objects) для модуля пользователя
 */

export interface UserProfileDto {
  id: number;
  login: string;
  email: string;
  avatar_url: string | null;
  created_at: Date;
}

export interface UpdateProfileDto {
  login?: string;
  email?: string;
}

export interface ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
}

export interface UserProfileResponseDto {
  status: 'success' | 'error';
  message?: string;
  user?: UserProfileDto;
}

export interface ChangePasswordResponseDto {
  status: 'success' | 'error';
  message: string;
}

export interface RefreshTokenResponseDto {
  status: 'success' | 'error';
  message: string;
  token?: string;
}

export interface LogoutResponseDto {
  status: 'success' | 'error';
  message: string;
}

export interface UploadAvatarResponseDto {
  status: 'success' | 'error';
  message: string;
  avatar_url?: string;
}

export interface DeleteAvatarResponseDto {
  status: 'success' | 'error';
  message: string;
}

