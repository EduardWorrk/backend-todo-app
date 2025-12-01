import { Router } from 'express';
import { gigaChatController } from '../controllers/gigachat.controller';
import { asyncHandler } from '../middleware/error-handler';
import authenticateToken from '../middleware/auth';
import {
  sendGigaChatMessageSchema,
  validate,
} from '../validators/gigachat.validator';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: Эндпоинты для работы с GigaChat
 */

router.use(authenticateToken);

/**
 * @swagger
 * /ai/gigachat/chat:
 *   post:
 *     summary: Отправить сообщение в GigaChat и получить ответ
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendGigaChatMessageRequest'
 *           example:
 *             message: "что ты умеешь?"
 *             temperature: 0.2
 *     responses:
 *       200:
 *         description: Ответ успешно получен от GigaChat
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GigaChatResponse'
 *       400:
 *         description: Ошибка валидации входных данных
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Требуется авторизация
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       503:
 *         description: Интеграция с GigaChat не настроена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/gigachat/chat',
  validate(sendGigaChatMessageSchema),
  asyncHandler(async (req, res) => {
    await gigaChatController.sendMessage(req, res);
  })
);

export default router;


