import { Request, Response } from 'express';
import { notificationService } from '../services/notification.service';
import { NOTIFICATION_CONSTANTS } from '../constants/notification.constants';
import {
  NotificationsResponseDto,
  NotificationResponseDto,
  UnreadCountResponseDto,
} from '../dto/notification.dto';

/**
 * Контроллер для обработки HTTP запросов уведомлений
 */
export class NotificationController {
  /**
   * Получить уведомления пользователя
   */
  async getNotifications(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
    const unreadOnly = req.query.unreadOnly === 'true';

    const notifications = await notificationService.getUserNotifications(userId, {
      limit,
      offset,
      unreadOnly,
    });

    const response: NotificationsResponseDto = {
      status: 'success',
      notifications,
    };

    res.json(response);
  }

  /**
   * Отметить уведомление как прочитанное
   */
  async markAsRead(req: Request, res: Response): Promise<void> {
    const notificationId = parseInt(req.params.id);
    const userId = req.user!.id;
    const notification = await notificationService.markAsRead(notificationId, userId);

    const response: NotificationResponseDto = {
      status: 'success',
      message: NOTIFICATION_CONSTANTS.SUCCESS.MARKED_AS_READ,
      notification,
    };

    res.json(response);
  }

  /**
   * Отметить все уведомления как прочитанные
   */
  async markAllAsRead(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    await notificationService.markAllAsRead(userId);

    res.json({
      status: 'success',
      message: NOTIFICATION_CONSTANTS.SUCCESS.ALL_MARKED_AS_READ,
    });
  }

  /**
   * Получить количество непрочитанных уведомлений
   */
  async getUnreadCount(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const count = await notificationService.getUnreadCount(userId);

    const response: UnreadCountResponseDto = {
      status: 'success',
      count,
    };

    res.json(response);
  }
}

// Экспорт singleton экземпляра
export const notificationController = new NotificationController();

