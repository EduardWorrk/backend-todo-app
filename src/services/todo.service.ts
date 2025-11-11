import prisma from '../db/prisma';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { TODO_CONSTANTS } from '../constants/todo.constants';
import { CreateTaskInput, UpdateTaskInput } from '../validators/todo.validator';
import { TaskDto } from '../dto/todo.dto';

/**
 * Селекты для задач
 */
const taskSelect = {
  id: true,
  user_id: true,
  name: true,
  description: true,
  created_at: true,
  updated_at: true,
} as const;

/**
 * Сервис для бизнес-логики задач
 */
export class TodoService {
  /**
   * Получить все задачи пользователя
   */
  async getUserTasks(userId: number): Promise<TaskDto[]> {
    const tasks = await prisma.task.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      select: taskSelect,
    });

    return tasks;
  }

  /**
   * Создать новую задачу
   */
  async createTask(userId: number, data: CreateTaskInput): Promise<TaskDto> {
    const task = await prisma.task.create({
      data: {
        user_id: userId,
        name: data.name,
        description: data.description || null,
      },
      select: taskSelect,
    });

    return task;
  }

  /**
   * Обновить задачу
   */
  async updateTask(
    taskId: number,
    userId: number,
    data: UpdateTaskInput
  ): Promise<TaskDto> {
    // Проверка существования и прав доступа
    await this.checkTaskOwnership(taskId, userId);

    // Подготовка данных для обновления
    const updateData: { name?: string; description?: string | null } = {};
    
    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      select: taskSelect,
    });

    return task;
  }

  /**
   * Удалить задачу
   */
  async deleteTask(taskId: number, userId: number): Promise<void> {
    // Проверка существования и прав доступа
    await this.checkTaskOwnership(taskId, userId);

    await prisma.task.delete({
      where: { id: taskId },
    });
  }

  /**
   * Проверка прав доступа к задаче
   */
  private async checkTaskOwnership(taskId: number, userId: number): Promise<void> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        user_id: true,
      },
    });

    if (!task) {
      throw new NotFoundError(TODO_CONSTANTS.ERRORS.TASK_NOT_FOUND);
    }

    if (task.user_id !== userId) {
      throw new ForbiddenError(TODO_CONSTANTS.ERRORS.NO_PERMISSION);
    }
  }
}

// Экспорт singleton экземпляра
export const todoService = new TodoService();

