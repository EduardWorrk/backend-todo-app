import { Request, Response } from 'express';
import { categoryService } from '../services/category.service';
import { CATEGORY_CONSTANTS } from '../constants/category.constants';

class CategoryController {
  async getCategories(req: Request, res: Response): Promise<void> {
    const categories = await categoryService.getAll();

    res.json({
      status: 'success',
      categories,
    });
  }

  async createCategory(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const category = await categoryService.createCategory(userId, req.body);

    res.status(201).json({
      status: 'success',
      message: CATEGORY_CONSTANTS.SUCCESS.CREATED,
      category,
    });
  }

  async deleteCategory(req: Request, res: Response): Promise<void> {
    const categoryId = parseInt(req.params.id, 10);
    await categoryService.deleteCategory(categoryId);

    res.json({
      status: 'success',
      message: CATEGORY_CONSTANTS.SUCCESS.DELETED,
    });
  }
}

export const categoryController = new CategoryController();




