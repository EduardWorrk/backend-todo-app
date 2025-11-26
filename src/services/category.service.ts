import prisma from '../db/prisma';
import { CATEGORY_CONSTANTS } from '../constants/category.constants';
import { CreateCategoryInput } from '../validators/category.validator';
import { CategoryDto } from '../dto/category.dto';
import { ConflictError, NotFoundError } from '../utils/errors';
import { Prisma } from '@prisma/client';

const prismaCategory = (prisma as any).category;

export class CategoryService {
  async getAll(): Promise<CategoryDto[]> {
    const categories = await prismaCategory.findMany({
      orderBy: [{ name: 'asc' }],
    });

    return categories as CategoryDto[];
  }

  async createCategory(userId: number, data: CreateCategoryInput): Promise<CategoryDto> {
    try {
      const category = await prismaCategory.create({
        data: {
          name: data.name,
          color: data.color ?? null,
          created_by: userId,
        },
      });

      return category as CategoryDto;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictError(CATEGORY_CONSTANTS.ERRORS.ALREADY_EXISTS);
      }
      throw error;
    }
  }

  async deleteCategory(categoryId: number): Promise<void> {
    const category = await prismaCategory.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundError(CATEGORY_CONSTANTS.ERRORS.NOT_FOUND);
    }

    const tasksWithCategory = await prisma.task.count({
      where: { category_id: categoryId },
    });

    if (tasksWithCategory > 0) {
      throw new ConflictError(CATEGORY_CONSTANTS.ERRORS.IN_USE);
    }

    await prismaCategory.delete({
      where: { id: categoryId },
    });
  }
}

export const categoryService = new CategoryService();

