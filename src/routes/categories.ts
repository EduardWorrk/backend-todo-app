import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import authenticateToken from '../middleware/auth';
import { categoryController } from '../controllers/category.controller';
import { createCategorySchema, validate, validateCategoryId } from '../validators/category.validator';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Эндпоинты для управления категориями задач (требуется аутентификация)
 */

router.use(authenticateToken);

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Получить список категорий
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список категорий успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoriesResponse'
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    await categoryController.getCategories(req, res);
  })
);

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Создать категорию
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoryRequest'
 *     responses:
 *       201:
 *         description: Категория успешно создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryResponse'
 */
router.post(
  '/',
  validate(createCategorySchema),
  asyncHandler(async (req, res) => {
    await categoryController.createCategory(req, res);
  })
);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Удалить категорию
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID категории
 *     responses:
 *       200:
 *         description: Категория успешно удалена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeleteCategoryResponse'
 */
router.delete(
  '/:id',
  validateCategoryId,
  asyncHandler(async (req, res) => {
    await categoryController.deleteCategory(req, res);
  })
);

export default router;




