/**
 * DTO (Data Transfer Objects) для модуля уведомлений
 */

export interface NotificationDto {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  related_task_id: number | null;
  related_goal_id: number | null;
  is_read: boolean;
  created_at: Date;
}

export interface NotificationsResponseDto {
  status: 'success' | 'error';
  notifications: NotificationDto[];
}

export interface NotificationResponseDto {
  status: 'success' | 'error';
  message: string;
  notification: NotificationDto;
}

export interface UnreadCountResponseDto {
  status: 'success' | 'error';
  count: number;
}

