import prisma from '../db/prisma';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { NOTIFICATION_CONSTANTS } from '../constants/notification.constants';
import { NotificationDto } from '../dto/notification.dto';
import { websocketService } from './websocket.service';

/**
 * Селекты для уведомлений
 */
const notificationSelect = {
  id: true,
  user_id: true,
  type: true,
  title: true,
  message: true,
  related_task_id: true,
  related_goal_id: true,
  is_read: true,
  created_at: true,
} as const;

/**
 * Сервис для бизнес-логики уведомлений
 */
export class NotificationService {
  /**
   * Создать уведомление
   */
  async createNotification(
    userId: number,
    type: string,
    title: string,
    message: string,
    relatedTaskId?: number | null,
    relatedGoalId?: number | null
  ): Promise<NotificationDto> {
    const notification = await prisma.notification.create({
      data: {
        user_id: userId,
        type,
        title,
        message,
        related_task_id: relatedTaskId || null,
        related_goal_id: relatedGoalId || null,
      },
      select: notificationSelect,
    });

    // Отправляем уведомление через WebSocket
    websocketService.sendNotification(userId, notification);

    return notification;
  }

  /**
   * Получить уведомления пользователя
   */
  async getUserNotifications(
    userId: number,
    options?: { limit?: number; offset?: number; unreadOnly?: boolean }
  ): Promise<NotificationDto[]> {
    const where: any = { user_id: userId };
    
    if (options?.unreadOnly) {
      where.is_read = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: options?.limit,
      skip: options?.offset,
      select: notificationSelect,
    });

    return notifications;
  }

  /**
   * Отметить уведомление как прочитанное
   */
  async markAsRead(notificationId: number, userId: number): Promise<NotificationDto> {
    // Проверка существования и прав доступа
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: {
        id: true,
        user_id: true,
      },
    });

    if (!notification) {
      throw new NotFoundError(NOTIFICATION_CONSTANTS.ERRORS.NOTIFICATION_NOT_FOUND);
    }

    if (notification.user_id !== userId) {
      throw new ForbiddenError(NOTIFICATION_CONSTANTS.ERRORS.NO_PERMISSION);
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { is_read: true },
      select: notificationSelect,
    });

    // Отправляем событие о прочтении через WebSocket
    websocketService.sendNotificationRead(userId, notificationId);

    return updatedNotification;
  }

  /**
   * Отметить все уведомления как прочитанные
   */
  async markAllAsRead(userId: number): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        user_id: userId,
        is_read: false,
      },
      data: {
        is_read: true,
      },
    });

    // Отправляем событие о прочтении всех уведомлений через WebSocket
    websocketService.sendAllNotificationsRead(userId);
  }

  /**
   * Получить количество непрочитанных уведомлений
   */
  async getUnreadCount(userId: number): Promise<number> {
    const count = await prisma.notification.count({
      where: {
        user_id: userId,
        is_read: false,
      },
    });

    return count;
  }
}

// Экспорт singleton экземпляра
export const notificationService = new NotificationService();

