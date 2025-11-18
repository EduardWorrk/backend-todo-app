import { Router } from 'express';
import { todoController } from '../controllers/todo.controller';
import { validate, validateTaskId, createTaskSchema, updateTaskSchema } from '../validators/todo.validator';
import { asyncHandler } from '../middleware/error-handler';
import authenticateToken from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Todos
 *   description: Эндпоинты для управления задачами (требуется аутентификация)
 */

// Применяем middleware для всех роутов задач
router.use(authenticateToken);

/**
 * @swagger
 * /todos:
 *   get:
 *     summary: Получить список всех задач пользователя
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список задач успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TasksResponse'
 *             example:
 *               status: success
 *               tasks:
 *                 - id: 1
 *                   user_id: 1
 *                   name: Купить молоко
 *                   description: Купить молоко в магазине
 *                   priority: medium
 *                   task_time: "09.30"
 *                   created_at: "2025-11-10T12:00:00.000Z"
 *                   updated_at: "2025-11-10T12:00:00.000Z"
 *       401:
 *         description: Токен не предоставлен или невалиден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    await todoController.getTasks(req, res);
  })
);

/**
 * @swagger
 * /todos:
 *   post:
 *     summary: Создать новую задачу
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaskRequest'
 *           examples:
 *             example1:
 *               value:
 *                 name: Купить молоко
 *                 description: Купить молоко в магазине
 *                 priority: high
 *                 task_time: "08.15"
 *                 created_at: "2025-11-08T09:00:00.000Z"
 *     responses:
 *       201:
 *         description: Задача успешно создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskResponse'
 *       400:
 *         description: Ошибка валидации
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Токен не предоставлен или невалиден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/',
  validate(createTaskSchema),
  asyncHandler(async (req, res) => {
    await todoController.createTask(req, res);
  })
);

/**
 * @swagger
 * /todos/{id}:
 *   put:
 *     summary: Обновить задачу
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID задачи
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTaskRequest'
 *           examples:
 *             example1:
 *               value:
 *                 name: Купить молоко и хлеб
 *                 description: Купить молоко и хлеб в магазине
 *                 priority: medium
 *                 task_time: "19.00"
 *                 created_at: "2025-11-09T18:00:00.000Z"
 *     responses:
 *       200:
 *         description: Задача успешно обновлена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskResponse'
 *       400:
 *         description: Ошибка валидации или не указаны поля для обновления
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Токен не предоставлен или невалиден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Нет прав на обновление этой задачи
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Задача не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put(
  '/:id',
  validateTaskId,
  validate(updateTaskSchema),
  asyncHandler(async (req, res) => {
    await todoController.updateTask(req, res);
  })
);

/**
 * @swagger
 * /todos/{id}:
 *   delete:
 *     summary: Удалить задачу
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID задачи
 *         example: 1
 *     responses:
 *       200:
 *         description: Задача успешно удалена
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
 *                   example: Задача успешно удалена
 *       400:
 *         description: Неверный ID задачи
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Токен не предоставлен или невалиден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Нет прав на удаление этой задачи
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Задача не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  '/:id',
  validateTaskId,
  asyncHandler(async (req, res) => {
    await todoController.deleteTask(req, res);
  })
);

/**
 * @swagger
 * /todos/{id}/assign:
 *   patch:
 *     summary: Назначить задачу исполнителю
 *     tags: [Todos]
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
 *             type: object
 *             required:
 *               - assigned_to_id
 *             properties:
 *               assigned_to_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Задача успешно назначена
 */
router.patch(
  '/:id/assign',
  validateTaskId,
  asyncHandler(async (req, res) => {
    await todoController.assignTask(req, res);
  })
);

/**
 * @swagger
 * /todos/{id}/unassign:
 *   patch:
 *     summary: Снять назначение задачи
 *     tags: [Todos]
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
 *         description: Назначение успешно снято
 */
router.patch(
  '/:id/unassign',
  validateTaskId,
  asyncHandler(async (req, res) => {
    await todoController.unassignTask(req, res);
  })
);

export default router;
