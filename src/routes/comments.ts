import { Router } from 'express';
import { commentController } from '../controllers/comment.controller';
import authenticateToken from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { createCommentSchema, updateCommentSchema, validate, validateCommentId } from '../validators/comment.validator';
import { validateTaskId } from '../validators/todo.validator';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Эндпоинты для управления комментариями к задачам (требуется аутентификация)
 */

// Применяем middleware для всех роутов комментариев
router.use(authenticateToken);

/**
 * @swagger
 * /tasks/{id}/comments:
 *   get:
 *     summary: Получить комментарии задачи
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Список комментариев успешно получен
 */
router.get(
  '/tasks/:id/comments',
  validateTaskId,
  asyncHandler(async (req, res) => {
    await commentController.getComments(req, res);
  })
);

/**
 * @swagger
 * /tasks/{id}/comments:
 *   post:
 *     summary: Добавить комментарий к задаче
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCommentRequest'
 *     responses:
 *       201:
 *         description: Комментарий успешно добавлен
 */
router.post(
  '/tasks/:id/comments',
  validateTaskId,
  validate(createCommentSchema),
  asyncHandler(async (req, res) => {
    await commentController.createComment(req, res);
  })
);

/**
 * @swagger
 * /tasks/comments/{id}:
 *   patch:
 *     summary: Обновить комментарий
 *     tags: [Comments]
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
 *             $ref: '#/components/schemas/UpdateCommentRequest'
 *     responses:
 *       200:
 *         description: Комментарий успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommentResponse'
 *   delete:
 *     summary: Удалить комментарий
 *     tags: [Comments]
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
 *         description: Комментарий успешно удален
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeleteCommentResponse'
 */
router.patch(
  '/tasks/comments/:id',
  validateCommentId,
  validate(updateCommentSchema),
  asyncHandler(async (req, res) => {
    await commentController.updateComment(req, res);
  })
);

router.delete(
  '/tasks/comments/:id',
  validateCommentId,
  asyncHandler(async (req, res) => {
    await commentController.deleteComment(req, res);
  })
);

export default router;

