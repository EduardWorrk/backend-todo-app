import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { userController } from '../controllers/user.controller';
import { validate, registerSchema, loginSchema } from '../validators/auth.validator';
import { validate as validateTelegram, requestTelegramCodeSchema, telegramLoginSchema } from '../validators/telegram.validator';
import { asyncHandler } from '../middleware/error-handler';
import authenticateToken from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Эндпоинты для аутентификации и регистрации
 */

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           examples:
 *             example1:
 *               value:
 *                 login: johndoe
 *                 email: john@example.com
 *                 password: password123
 *     responses:
 *       201:
 *         description: Пользователь успешно зарегистрирован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               status: success
 *               message: User registered successfully
 *               token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *               user:
 *                 id: 1
 *                 login: johndoe
 *                 email: john@example.com
 *                 created_at: "2025-11-10T12:00:00.000Z"
 *       400:
 *         description: Ошибка валидации
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Пользователь с таким login или email уже существует
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    await authController.register(req, res);
  })
);

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Авторизация пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             example1:
 *               value:
 *                 email: john@example.com
 *                 password: password123
 *     responses:
 *       200:
 *         description: Успешная авторизация
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               status: success
 *               message: Login successful
 *               token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *               user:
 *                 id: 1
 *                 login: johndoe
 *                 email: john@example.com
 *                 created_at: "2025-11-10T12:00:00.000Z"
 *       400:
 *         description: Ошибка валидации
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Неверный email или пароль
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    await authController.login(req, res);
  })
);

/**
 * @swagger
 * /refresh:
 *   post:
 *     summary: Обновить JWT токен (альтернативный эндпоинт)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Токен успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *       401:
 *         description: Токен не предоставлен или невалиден
 */
router.post(
  '/refresh',
  authenticateToken,
  asyncHandler(async (req, res) => {
    await userController.refreshToken(req, res);
  })
);

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Выход пользователя (альтернативный эндпоинт)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Успешный выход
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 */
router.post(
  '/logout',
  authenticateToken,
  asyncHandler(async (req, res) => {
    await userController.logout(req, res);
  })
);

/**
 * @swagger
 * /auth/telegram/request-code:
 *   post:
 *     summary: Запросить код авторизации через Telegram
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - telegram_id
 *             properties:
 *               telegram_id:
 *                 type: integer
 *                 description: Telegram ID пользователя
 *                 example: 123456789
 *           examples:
 *             example1:
 *               value:
 *                 telegram_id: 123456789
 *     responses:
 *       200:
 *         description: Код авторизации успешно отправлен в Telegram
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Код авторизации отправлен в Telegram
 *       400:
 *         description: Ошибка валидации
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Ошибка отправки кода или бот не настроен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/auth/telegram/request-code',
  validateTelegram(requestTelegramCodeSchema),
  asyncHandler(async (req, res) => {
    await authController.requestTelegramCode(req, res);
  })
);

/**
 * @swagger
 * /auth/telegram/login:
 *   post:
 *     summary: Авторизация через Telegram с кодом
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               telegram_id:
 *                 type: integer
 *                 description: Telegram ID пользователя (опционально — для ручного запроса кода)
 *                 example: 123456789
 *               code:
 *                 type: string
 *                 description: 6-значный код авторизации
 *                 example: "123456"
 *           examples:
 *             example1:
 *               value:
 *                 code: "123456"
 *     responses:
 *       200:
 *         description: Успешная авторизация через Telegram
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               status: success
 *               message: Успешный вход через Telegram
 *               token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *               user:
 *                 id: 1
 *                 login: telegram_123456789
 *                 email: telegram_123456789@telegram.local
 *                 created_at: "2025-11-10T12:00:00.000Z"
 *       400:
 *         description: Ошибка валидации
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Неверный или истекший код авторизации
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/auth/telegram/login',
  validateTelegram(telegramLoginSchema),
  asyncHandler(async (req, res) => {
    await authController.loginWithTelegram(req, res);
  })
);

export default router;

