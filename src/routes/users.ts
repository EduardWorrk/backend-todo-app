import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { validate, updateProfileSchema, changePasswordSchema } from '../validators/user.validator';
import { asyncHandler } from '../middleware/error-handler';
import authenticateToken from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Эндпоинты для управления профилем пользователя (требуется аутентификация)
 */

// Применяем middleware для всех роутов пользователя
router.use(authenticateToken);

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Получить профиль текущего пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Профиль успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     login:
 *                       type: string
 *                       example: johndoe
 *                     email:
 *                       type: string
 *                       example: john@example.com
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Токен не предоставлен или невалиден
 */
router.get(
  '/me',
  asyncHandler(async (req, res) => {
    await userController.getProfile(req, res);
  })
);

/**
 * @swagger
 * /users/me:
 *   put:
 *     summary: Обновить профиль текущего пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               login:
 *                 type: string
 *                 example: newlogin
 *               email:
 *                 type: string
 *                 example: newemail@example.com
 *     responses:
 *       200:
 *         description: Профиль успешно обновлен
 *       400:
 *         description: Ошибка валидации
 *       409:
 *         description: Пользователь с таким login или email уже существует
 */
router.put(
  '/me',
  validate(updateProfileSchema),
  asyncHandler(async (req, res) => {
    await userController.updateProfile(req, res);
  })
);

/**
 * @swagger
 * /users/me/change-password:
 *   post:
 *     summary: Сменить пароль текущего пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 example: oldpassword123
 *               newPassword:
 *                 type: string
 *                 example: newpassword456
 *     responses:
 *       200:
 *         description: Пароль успешно изменен
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неверный текущий пароль
 */
router.post(
  '/me/change-password',
  validate(changePasswordSchema),
  asyncHandler(async (req, res) => {
    await userController.changePassword(req, res);
  })
);

/**
 * @swagger
 * /users/me/refresh-token:
 *   post:
 *     summary: Обновить JWT токен
 *     tags: [Users]
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
  '/me/refresh-token',
  asyncHandler(async (req, res) => {
    await userController.refreshToken(req, res);
  })
);

/**
 * @swagger
 * /users/search:
 *   get:
 *     summary: Поиск пользователей по email или login
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Поисковый запрос (минимум 2 символа)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Список найденных пользователей
 */
router.get(
  '/search',
  asyncHandler(async (req, res) => {
    await userController.searchUsers(req, res);
  })
);

/**
 * @swagger
 * /users/me/logout:
 *   post:
 *     summary: Выход пользователя
 *     tags: [Users]
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
  '/me/logout',
  asyncHandler(async (req, res) => {
    await userController.logout(req, res);
  })
);

export default router;

