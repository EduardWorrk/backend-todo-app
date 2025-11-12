import { Router } from 'express';
import { goalController } from '../controllers/goal.controller';
import { validate, validateGoalId, createGoalSchema, updateGoalSchema, inviteMemberSchema } from '../validators/goal.validator';
import { asyncHandler } from '../middleware/error-handler';
import authenticateToken from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Goals
 *   description: Эндпоинты для управления совместными целями (требуется аутентификация)
 */

// Применяем middleware для всех роутов целей
router.use(authenticateToken);

/**
 * @swagger
 * /goals:
 *   get:
 *     summary: Получить список всех целей пользователя
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список целей успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GoalsResponse'
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    await goalController.getGoals(req, res);
  })
);

/**
 * @swagger
 * /goals:
 *   post:
 *     summary: Создать совместную цель
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateGoalRequest'
 *     responses:
 *       201:
 *         description: Цель успешно создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GoalResponse'
 */
router.post(
  '/',
  validate(createGoalSchema),
  asyncHandler(async (req, res) => {
    await goalController.createGoal(req, res);
  })
);

/**
 * @swagger
 * /goals/{id}:
 *   get:
 *     summary: Получить цель по ID
 *     tags: [Goals]
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
 *         description: Цель успешно получена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GoalResponse'
 */
router.get(
  '/:id',
  validateGoalId,
  asyncHandler(async (req, res) => {
    await goalController.getGoal(req, res);
  })
);

/**
 * @swagger
 * /goals/{id}:
 *   put:
 *     summary: Обновить цель
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateGoalRequest'
 *     responses:
 *       200:
 *         description: Цель успешно обновлена
 */
router.put(
  '/:id',
  validateGoalId,
  validate(updateGoalSchema),
  asyncHandler(async (req, res) => {
    await goalController.updateGoal(req, res);
  })
);

/**
 * @swagger
 * /goals/{id}:
 *   delete:
 *     summary: Удалить цель
 *     tags: [Goals]
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
 *         description: Цель успешно удалена
 */
router.delete(
  '/:id',
  validateGoalId,
  asyncHandler(async (req, res) => {
    await goalController.deleteGoal(req, res);
  })
);

/**
 * @swagger
 * /goals/{id}/invite:
 *   post:
 *     summary: Пригласить участника в цель
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InviteMemberRequest'
 *     responses:
 *       201:
 *         description: Участник успешно приглашен
 */
router.post(
  '/:id/invite',
  validateGoalId,
  validate(inviteMemberSchema),
  asyncHandler(async (req, res) => {
    await goalController.inviteMember(req, res);
  })
);

/**
 * @swagger
 * /goals/{id}/members/{userId}:
 *   delete:
 *     summary: Удалить участника из цели
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Участник успешно удален
 */
router.delete(
  '/:id/members/:userId',
  validateGoalId,
  asyncHandler(async (req, res) => {
    await goalController.removeMember(req, res);
  })
);

/**
 * @swagger
 * /goals/{id}/leave:
 *   post:
 *     summary: Покинуть цель
 *     tags: [Goals]
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
 *         description: Вы успешно покинули цель
 */
router.post(
  '/:id/leave',
  validateGoalId,
  asyncHandler(async (req, res) => {
    await goalController.leaveGoal(req, res);
  })
);

/**
 * @swagger
 * /goals/{id}/members:
 *   get:
 *     summary: Получить участников цели
 *     tags: [Goals]
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
 *         description: Список участников успешно получен
 */
router.get(
  '/:id/members',
  validateGoalId,
  asyncHandler(async (req, res) => {
    await goalController.getMembers(req, res);
  })
);

export default router;

