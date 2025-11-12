import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { asyncHandler } from '../middleware/error-handler';
import authenticateToken from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Эндпоинты для управления уведомлениями (требуется аутентификация)
 */

// Применяем middleware для всех роутов уведомлений
router.use(authenticateToken);

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Получить уведомления пользователя
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Список уведомлений успешно получен
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    await notificationController.getNotifications(req, res);
  })
);

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     summary: Получить количество непрочитанных уведомлений
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Количество непрочитанных уведомлений
 */
router.get(
  '/unread-count',
  asyncHandler(async (req, res) => {
    await notificationController.getUnreadCount(req, res);
  })
);

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     summary: Отметить уведомление как прочитанное
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Уведомление отмечено как прочитанное
 */
router.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    await notificationController.markAsRead(req, res);
  })
);

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     summary: Отметить все уведомления как прочитанные
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Все уведомления отмечены как прочитанные
 */
router.patch(
  '/read-all',
  asyncHandler(async (req, res) => {
    await notificationController.markAllAsRead(req, res);
  })
);

export default router;

