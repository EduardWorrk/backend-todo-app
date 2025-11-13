import prisma from '../db/prisma';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { COMMENT_CONSTANTS } from '../constants/comment.constants';
import { CreateCommentInput, UpdateCommentInput } from '../validators/comment.validator';
import { CommentDto } from '../dto/comment.dto';
import { notificationService } from './notification.service';
import { NOTIFICATION_CONSTANTS } from '../constants/notification.constants';

/**
 * Селекты для комментариев
 */
const commentSelect = {
  id: true,
  task_id: true,
  user_id: true,
  content: true,
  created_at: true,
  updated_at: true,
  user: {
    select: {
      id: true,
      login: true,
      email: true,
    },
  },
} as const;

/**
 * Сервис для бизнес-логики комментариев
 */
export class CommentService {
  /**
   * Создать комментарий
   */
  async createComment(
    taskId: number,
    userId: number,
    data: CreateCommentInput
  ): Promise<CommentDto> {
    // Проверка доступа к задаче
    await this.checkTaskAccess(taskId, userId);

    const comment = await prisma.comment.create({
      data: {
        task_id: taskId,
        user_id: userId,
        content: data.content,
      },
      select: commentSelect,
    });

    // Создание уведомления для владельца задачи и других участников
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        user_id: true,
        shared_goal_id: true,
        shared_goal: {
          select: {
            id: true,
            owner_id: true,
            members: {
              select: { user_id: true },
            },
          },
        },
      },
    });

    if (task) {
      const notifyUserIds = new Set<number>();
      
      // Уведомляем владельца задачи, если это не он сам
      if (task.user_id !== userId) {
        notifyUserIds.add(task.user_id);
      }

      // Уведомляем участников совместной цели
      if (task.shared_goal_id && task.shared_goal) {
        for (const member of task.shared_goal.members) {
          if (member.user_id !== userId) {
            notifyUserIds.add(member.user_id);
          }
        }
      }

      // Создаем уведомления
      for (const notifyUserId of notifyUserIds) {
        await notificationService.createNotification(
          notifyUserId,
          NOTIFICATION_CONSTANTS.TYPES.COMMENT_ADDED,
          'Новый комментарий',
          `Добавлен комментарий к задаче`,
          taskId,
          task.shared_goal_id
        );
      }
    }

    return comment;
  }

  /**
   * Получить комментарии задачи
   */
  async getTaskComments(taskId: number, userId: number): Promise<CommentDto[]> {
    // Проверка доступа к задаче
    await this.checkTaskAccess(taskId, userId);

    const comments = await prisma.comment.findMany({
      where: { task_id: taskId },
      orderBy: { created_at: 'asc' },
      select: commentSelect,
    });

    return comments;
  }

  /**
   * Обновить комментарий
   */
  async updateComment(
    commentId: number,
    userId: number,
    data: UpdateCommentInput
  ): Promise<CommentDto> {
    // Проверка существования и прав доступа
    await this.checkCommentOwnership(commentId, userId);

    const comment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: data.content,
      },
      select: commentSelect,
    });

    return comment;
  }

  /**
   * Удалить комментарий
   */
  async deleteComment(commentId: number, userId: number): Promise<void> {
    // Проверка существования и прав доступа
    await this.checkCommentOwnership(commentId, userId);

    await prisma.comment.delete({
      where: { id: commentId },
    });
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
            id: true,
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
      throw new NotFoundError(COMMENT_CONSTANTS.ERRORS.TASK_NOT_FOUND);
    }

    // Проверка: владелец задачи или участник совместной цели
    const isOwner = task.user_id === userId;
    const isGoalOwner = task.shared_goal?.owner_id === userId;
    const isMember = task.shared_goal_id && task.shared_goal && (task.shared_goal.members.length > 0 || isGoalOwner);

    if (!isOwner && !isMember) {
      throw new ForbiddenError(COMMENT_CONSTANTS.ERRORS.NO_ACCESS_TO_TASK);
    }
  }

  /**
   * Проверка прав доступа к комментарию
   */
  private async checkCommentOwnership(commentId: number, userId: number): Promise<void> {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        user_id: true,
      },
    });

    if (!comment) {
      throw new NotFoundError(COMMENT_CONSTANTS.ERRORS.COMMENT_NOT_FOUND);
    }

    if (comment.user_id !== userId) {
      throw new ForbiddenError(COMMENT_CONSTANTS.ERRORS.NO_PERMISSION);
    }
  }
}

// Экспорт singleton экземпляра
export const commentService = new CommentService();

