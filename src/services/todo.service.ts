import { CATEGORY_CONSTANTS } from '../constants/category.constants';
import { NOTIFICATION_CONSTANTS } from '../constants/notification.constants';
import { TODO_CONSTANTS } from '../constants/todo.constants';
import prisma from '../db/prisma';
import { PublicTaskDto, TaskDto } from '../dto/todo.dto';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { CreateTaskInput, UpdateTaskInput } from '../validators/todo.validator';
import { notificationService } from './notification.service';

/**
 * Селекты для задач
 */
const prismaCategory = (prisma as any).category;

const taskSelect = {
  id: true,
  user_id: true,
  name: true,
  description: true,
  status: true,
  priority: true,
  task_time: true,
  position: true,
  completed_at: true,
  assigned_to_id: true,
  shared_goal_id: true,
  category_id: true,
  created_at: true,
  updated_at: true,
  assigned_to: {
    select: {
      id: true,
      login: true,
      email: true,
    },
  },
  category: {
    select: {
      id: true,
      name: true,
      color: true,
      created_by: true,
      created_at: true,
      updated_at: true,
    },
  },
} as const;

const publicTaskSelect = {
  id: true,
  name: true,
  description: true,
  status: true,
  priority: true,
  task_time: true,
  position: true,
  category: {
    select: {
      id: true,
      name: true,
      color: true,
    },
  },
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
  async getUserTasks(
    userId: number,
    options?: { status?: string; assigned?: boolean; goalId?: number }
  ): Promise<TaskDto[]> {
    const where: any = {};

    if (options?.assigned) {
      // Задачи, назначенные пользователю
      where.assigned_to_id = userId;
    } else if (options?.goalId) {
      // Задачи в конкретной цели
      where.shared_goal_id = options.goalId;
      // Проверка доступа к цели
      const goal = await prisma.sharedGoal.findUnique({
        where: { id: options.goalId },
        select: {
          owner_id: true,
          members: {
            where: { user_id: userId },
            select: { user_id: true },
          },
        },
      });

      if (!goal || (goal.owner_id !== userId && goal.members.length === 0)) {
        throw new ForbiddenError(TODO_CONSTANTS.ERRORS.NO_PERMISSION);
      }
    } else {
      // Мои задачи (личные + в совместных целях, где я участник)
      where.OR = [
        { user_id: userId },
        {
          shared_goal: {
            members: {
              some: { user_id: userId },
            },
          },
        },
      ];
    }

    if (options?.status) {
      where.status = options.status;
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { position: 'asc' },
      select: taskSelect,
    });

    return tasks as TaskDto[];
  }

  /**
   * Создать новую задачу
   */
  async createTask(userId: number, data: CreateTaskInput): Promise<TaskDto> {
    // Если задача создается в совместной цели, проверяем доступ
    if (data.shared_goal_id) {
      await this.checkGoalAccess(data.shared_goal_id, userId);
    }

    await this.ensureCategoryExists(data.category_id ?? null);

    // Определяем позицию для новой задачи
    let position = data.position ?? 0;
    if (data.position === undefined) {
      // Находим максимальную позицию среди задач пользователя
      const maxPosition = await prisma.task.findFirst({
        where: { user_id: userId },
        orderBy: { position: 'desc' },
        select: { position: true },
      });
      position = (maxPosition?.position ?? -1) + 1;
    }

    const taskData: any = {
      user_id: userId,
      name: data.name,
      description: data.description || null,
      status: data.status || 'pending',
      priority: data.priority ?? null,
      task_time: data.task_time ?? null,
      position,
      category_id: data.category_id ?? null,
    };

    if (data.created_at) {
      taskData.created_at = new Date(data.created_at);
    }

    if (data.shared_goal_id) {
      taskData.shared_goal_id = data.shared_goal_id;
    }

    if (data.assigned_to_id) {
      taskData.assigned_to_id = data.assigned_to_id;
      // Создание уведомления для назначенного пользователя
      await notificationService.createNotification(
        data.assigned_to_id,
        NOTIFICATION_CONSTANTS.TYPES.TASK_ASSIGNED,
        'Вам назначена задача',
        `Вам назначена задача "${data.name}"`,
        null,
        data.shared_goal_id || null
      );
    }

    const task = await prisma.task.create({
      data: taskData,
      select: taskSelect,
    });

    return task as TaskDto;
  }

  /**
   * Обновить задачу
   */
  async updateTask(
    taskId: number,
    userId: number,
    data: UpdateTaskInput
  ): Promise<TaskDto> {
    // Получаем текущую задачу
    const currentTask = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        user_id: true,
        shared_goal_id: true,
        status: true,
        assigned_to_id: true,
      },
    });

    if (!currentTask) {
      throw new NotFoundError(TODO_CONSTANTS.ERRORS.TASK_NOT_FOUND);
    }

    // Проверка прав доступа
    await this.checkTaskAccess(taskId, userId);

    // Подготовка данных для обновления
    const updateData: any = {};
    
    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    if (data.status !== undefined) {
      updateData.status = data.status;
      
      // Если статус изменен на completed, устанавливаем completed_at
      if (data.status === 'completed' && currentTask.status !== 'completed') {
        updateData.completed_at = new Date();
      } else if (data.status !== 'completed' && currentTask.status === 'completed') {
        updateData.completed_at = null;
      }
    }

    if (data.priority !== undefined) {
      updateData.priority = data.priority;
    }

    if (data.task_time !== undefined) {
      updateData.task_time = data.task_time;
    }

    if (data.created_at !== undefined) {
      updateData.created_at = data.created_at ? new Date(data.created_at) : null;
    }

    if (data.category_id !== undefined) {
      await this.ensureCategoryExists(data.category_id ?? null);
      updateData.category_id = data.category_id ?? null;
    }

    if (data.assigned_to_id !== undefined) {
      updateData.assigned_to_id = data.assigned_to_id;
      
      // Если назначение изменилось, создаем уведомление
      if (data.assigned_to_id !== currentTask.assigned_to_id && data.assigned_to_id) {
        const task = await prisma.task.findUnique({
          where: { id: taskId },
          select: { name: true },
        });

        await notificationService.createNotification(
          data.assigned_to_id,
          NOTIFICATION_CONSTANTS.TYPES.TASK_ASSIGNED,
          'Вам назначена задача',
          `Вам назначена задача "${task?.name || ''}"`,
          taskId,
          currentTask.shared_goal_id
        );
      }
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      select: taskSelect,
    });

    // Если задача завершена, создаем уведомление для владельца и исполнителя
    if (data.status === 'completed' && currentTask.status !== 'completed') {
      const notifyUserIds = new Set<number>();
      if (task.user_id !== userId) {
        notifyUserIds.add(task.user_id);
      }
      if (task.assigned_to_id && task.assigned_to_id !== userId) {
        notifyUserIds.add(task.assigned_to_id);
      }

      for (const notifyUserId of notifyUserIds) {
        await notificationService.createNotification(
          notifyUserId,
          NOTIFICATION_CONSTANTS.TYPES.TASK_COMPLETED,
          'Задача завершена',
          `Задача "${task.name}" была завершена`,
          taskId,
          currentTask.shared_goal_id
        );
      }
    }

    return task as TaskDto;
  }

  /**
   * Удалить задачу
   */
  async deleteTask(taskId: number, userId: number): Promise<void> {
    // Проверка существования и прав доступа
    await this.checkTaskAccess(taskId, userId);

    await prisma.task.delete({
      where: { id: taskId },
    });
  }

  /**
   * Получить задачу по ID
   */
  async getTaskById(taskId: number, userId: number): Promise<TaskDto> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: taskSelect,
    });

    if (!task) {
      throw new NotFoundError(TODO_CONSTANTS.ERRORS.TASK_NOT_FOUND);
    }

    // Проверка доступа
    await this.checkTaskAccess(taskId, userId);

    return task as TaskDto;
  }

  /**
   * Публичное получение задачи по ID (без авторизации, только чтение)
   */
  async getTaskPublic(taskId: number): Promise<PublicTaskDto> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: publicTaskSelect,
    });

    if (!task) {
      throw new NotFoundError(TODO_CONSTANTS.ERRORS.TASK_NOT_FOUND);
    }

    return task as PublicTaskDto;
  }

  /**
   * Назначить задачу исполнителю
   */
  async assignTask(taskId: number, userId: number, assigneeId: number): Promise<TaskDto> {
    // Проверка доступа
    await this.checkTaskAccess(taskId, userId);

    const task = await prisma.task.update({
      where: { id: taskId },
      data: { assigned_to_id: assigneeId },
      select: taskSelect,
    });

    // Создание уведомления
    await notificationService.createNotification(
      assigneeId,
      NOTIFICATION_CONSTANTS.TYPES.TASK_ASSIGNED,
      'Вам назначена задача',
      `Вам назначена задача "${task.name}"`,
      taskId,
      task.shared_goal_id
    );

    return task as TaskDto;
  }

  /**
   * Снять назначение задачи
   */
  async unassignTask(taskId: number, userId: number): Promise<TaskDto> {
    // Проверка доступа
    await this.checkTaskAccess(taskId, userId);

    const task = await prisma.task.update({
      where: { id: taskId },
      data: { assigned_to_id: null },
      select: taskSelect,
    });

    return task as TaskDto;
  }

  /**
   * Проверка существования категории
   */
  private async ensureCategoryExists(categoryId: number | null): Promise<void> {
    if (categoryId === null || categoryId === undefined) {
      return;
    }

    const category = await prismaCategory.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundError(CATEGORY_CONSTANTS.ERRORS.NOT_FOUND);
    }
  }

  /**
   * Проверка прав доступа к задаче
   */
  private async checkTaskAccess(taskId: number, userId: number): Promise<void> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        user_id: true,
        shared_goal_id: true,
        shared_goal: {
          select: {
            owner_id: true,
            members: {
              where: { user_id: userId },
              select: { user_id: true },
            },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundError(TODO_CONSTANTS.ERRORS.TASK_NOT_FOUND);
    }

    // Владелец задачи всегда имеет доступ
    if (task.user_id === userId) {
      return;
    }

    // Если задача в совместной цели, проверяем участие
    if (task.shared_goal_id && task.shared_goal) {
      const isGoalOwner = task.shared_goal.owner_id === userId;
      const isMember = task.shared_goal.members && task.shared_goal.members.length > 0;

      if (isGoalOwner || isMember) {
        return;
      }
    }

    throw new ForbiddenError(TODO_CONSTANTS.ERRORS.NO_PERMISSION);
  }

  /**
   * Обновить позиции задач (для drag-and-drop)
   */
  async updateTaskPositions(userId: number, taskIds: number[]): Promise<void> {
    // Проверяем, что все задачи принадлежат пользователю
    const tasks = await prisma.task.findMany({
      where: {
        id: { in: taskIds },
        user_id: userId,
      },
      select: { id: true },
    });

    if (tasks.length !== taskIds.length) {
      throw new ForbiddenError(TODO_CONSTANTS.ERRORS.NO_PERMISSION);
    }

    // Обновляем позиции в транзакции
    await prisma.$transaction(
      taskIds.map((taskId, index) =>
        prisma.task.update({
          where: { id: taskId },
          data: { position: index },
        })
      )
    );
  }

  /**
   * Проверка прав доступа к цели
   */
  private async checkGoalAccess(goalId: number, userId: number): Promise<void> {
    const goal = await prisma.sharedGoal.findUnique({
      where: { id: goalId },
      select: {
        id: true,
        owner_id: true,
        members: {
          where: { user_id: userId },
          select: { user_id: true },
        },
      },
    });

    if (!goal) {
      throw new NotFoundError('Цель не найдена');
    }

    const isOwner = goal.owner_id === userId;
    const isMember = goal.members.length > 0;

    if (!isOwner && !isMember) {
      throw new ForbiddenError('У вас нет доступа к этой цели');
    }
  }
}

// Экспорт singleton экземпляра
export const todoService = new TodoService();

