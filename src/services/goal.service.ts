import prisma from '../db/prisma';
import { NotFoundError, ForbiddenError, ConflictError } from '../utils/errors';
import { GOAL_CONSTANTS } from '../constants/goal.constants';
import { CreateGoalInput, UpdateGoalInput, InviteMemberInput } from '../validators/goal.validator';
import { GoalDto, GoalWithTasksDto, GoalMemberDto } from '../dto/goal.dto';
import { notificationService } from './notification.service';
import { NOTIFICATION_CONSTANTS } from '../constants/notification.constants';

/**
 * Селекты для целей
 */
const goalSelect = {
  id: true,
  name: true,
  description: true,
  owner_id: true,
  created_at: true,
  updated_at: true,
} as const;

/**
 * Сервис для бизнес-логики совместных целей
 */
export class GoalService {
  /**
   * Создать совместную цель
   */
  async createGoal(userId: number, data: CreateGoalInput): Promise<GoalDto> {
    // Создание цели
    const goal = await prisma.sharedGoal.create({
      data: {
        name: data.name,
        description: data.description || null,
        owner_id: userId,
        members: {
          create: [
            {
              user_id: userId,
              role: GOAL_CONSTANTS.ROLES.OWNER,
            },
            ...(data.member_ids || []).map((memberId: number) => ({
              user_id: memberId,
              role: GOAL_CONSTANTS.ROLES.MEMBER,
            })),
          ],
        },
      },
      select: goalSelect,
    });

    // Создание уведомлений для приглашенных участников
    if (data.member_ids && data.member_ids.length > 0) {
      for (const memberId of data.member_ids) {
        await notificationService.createNotification(
          memberId,
          NOTIFICATION_CONSTANTS.TYPES.GOAL_INVITED,
          'Вас пригласили в совместную цель',
          `Вас пригласили в цель "${data.name}"`,
          null,
          goal.id
        );
      }
    }

    return goal;
  }

  /**
   * Получить цели пользователя
   */
  async getUserGoals(userId: number): Promise<GoalDto[]> {
    const goals = await prisma.sharedGoal.findMany({
      where: {
        OR: [
          { owner_id: userId },
          { members: { some: { user_id: userId } } },
        ],
      },
      orderBy: { created_at: 'desc' },
      select: goalSelect,
    });

    return goals;
  }

  /**
   * Получить цель с задачами и участниками
   */
  async getGoalById(goalId: number, userId: number): Promise<GoalWithTasksDto> {
    // Проверка доступа
    await this.checkGoalAccess(goalId, userId);

    const goal = await prisma.sharedGoal.findUnique({
      where: { id: goalId },
      select: {
        ...goalSelect,
        members: {
          select: {
            id: true,
            goal_id: true,
            user_id: true,
            role: true,
            joined_at: true,
            user: {
              select: {
                id: true,
                login: true,
                email: true,
                avatar_url: true,
              },
            },
          },
        },
        tasks: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!goal) {
      throw new NotFoundError(GOAL_CONSTANTS.ERRORS.GOAL_NOT_FOUND);
    }

    const tasksCount = goal.tasks.length;
    const completedTasksCount = goal.tasks.filter((t) => t.status === 'completed').length;

    return {
      ...goal,
      tasks_count: tasksCount,
      completed_tasks_count: completedTasksCount,
    };
  }

  /**
   * Обновить цель
   */
  async updateGoal(
    goalId: number,
    userId: number,
    data: UpdateGoalInput
  ): Promise<GoalDto> {
    // Проверка прав доступа (только владелец или админ)
    await this.checkGoalAdminAccess(goalId, userId);

    const updateData: { name?: string; description?: string | null } = {};
    
    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    const goal = await prisma.sharedGoal.update({
      where: { id: goalId },
      data: updateData,
      select: goalSelect,
    });

    // Создание уведомлений для участников
    const members = await prisma.goalMember.findMany({
      where: { goal_id: goalId },
      select: { user_id: true },
    });

    for (const member of members) {
      if (member.user_id !== userId) {
        await notificationService.createNotification(
          member.user_id,
          NOTIFICATION_CONSTANTS.TYPES.GOAL_UPDATED,
          'Цель обновлена',
          `Цель "${goal.name}" была обновлена`,
          null,
          goal.id
        );
      }
    }

    return goal;
  }

  /**
   * Удалить цель
   */
  async deleteGoal(goalId: number, userId: number): Promise<void> {
    // Проверка прав доступа (только владелец)
    const goal = await prisma.sharedGoal.findUnique({
      where: { id: goalId },
      select: {
        id: true,
        owner_id: true,
      },
    });

    if (!goal) {
      throw new NotFoundError(GOAL_CONSTANTS.ERRORS.GOAL_NOT_FOUND);
    }

    if (goal.owner_id !== userId) {
      throw new ForbiddenError(GOAL_CONSTANTS.ERRORS.NO_PERMISSION);
    }

    await prisma.sharedGoal.delete({
      where: { id: goalId },
    });
  }

  /**
   * Пригласить участника
   */
  async inviteMember(
    goalId: number,
    userId: number,
    data: InviteMemberInput
  ): Promise<GoalMemberDto> {
    // Проверка прав доступа (только владелец или админ)
    await this.checkGoalAdminAccess(goalId, userId);

    // Поиск пользователя
    let targetUserId: number;
    if (data.user_id) {
      targetUserId = data.user_id;
    } else if (data.email) {
      const user = await prisma.user.findUnique({
        where: { email: data.email },
        select: { id: true },
      });

      if (!user) {
        throw new NotFoundError(GOAL_CONSTANTS.ERRORS.USER_NOT_FOUND);
      }

      targetUserId = user.id;
    } else {
      throw new Error('Необходимо указать user_id или email');
    }

    // Проверка, не является ли пользователь уже участником
    const existingMember = await prisma.goalMember.findUnique({
      where: {
        goal_id_user_id: {
          goal_id: goalId,
          user_id: targetUserId,
        },
      },
    });

    if (existingMember) {
      throw new ConflictError(GOAL_CONSTANTS.ERRORS.USER_ALREADY_MEMBER);
    }

    // Добавление участника
    const member = await prisma.goalMember.create({
      data: {
        goal_id: goalId,
        user_id: targetUserId,
        role: GOAL_CONSTANTS.ROLES.MEMBER,
      },
      select: {
        id: true,
        goal_id: true,
        user_id: true,
        role: true,
        joined_at: true,
        user: {
          select: {
            id: true,
            login: true,
            email: true,
            avatar_url: true,
          },
        },
      },
    });

    // Создание уведомления
    const goal = await prisma.sharedGoal.findUnique({
      where: { id: goalId },
      select: { name: true },
    });

    await notificationService.createNotification(
      targetUserId,
      NOTIFICATION_CONSTANTS.TYPES.GOAL_INVITED,
      'Вас пригласили в совместную цель',
      `Вас пригласили в цель "${goal?.name || ''}"`,
      null,
      goalId
    );

    return member;
  }

  /**
   * Удалить участника
   */
  async removeMember(goalId: number, userId: number, targetUserId: number): Promise<void> {
    // Проверка прав доступа (только владелец или админ)
    await this.checkGoalAdminAccess(goalId, userId);

    // Проверка, что не пытаемся удалить владельца
    const goal = await prisma.sharedGoal.findUnique({
      where: { id: goalId },
      select: { owner_id: true },
    });

    if (goal?.owner_id === targetUserId) {
      throw new ForbiddenError(GOAL_CONSTANTS.ERRORS.CANNOT_REMOVE_OWNER);
    }

    // Проверка существования участника
    const member = await prisma.goalMember.findUnique({
      where: {
        goal_id_user_id: {
          goal_id: goalId,
          user_id: targetUserId,
        },
      },
    });

    if (!member) {
      throw new NotFoundError(GOAL_CONSTANTS.ERRORS.USER_NOT_MEMBER);
    }

    await prisma.goalMember.delete({
      where: {
        goal_id_user_id: {
          goal_id: goalId,
          user_id: targetUserId,
        },
      },
    });

    // Создание уведомления
    const goalData = await prisma.sharedGoal.findUnique({
      where: { id: goalId },
      select: { name: true },
    });

    await notificationService.createNotification(
      targetUserId,
      NOTIFICATION_CONSTANTS.TYPES.MEMBER_REMOVED,
      'Вас удалили из совместной цели',
      `Вас удалили из цели "${goalData?.name || ''}"`,
      null,
      goalId
    );
  }

  /**
   * Покинуть цель
   */
  async leaveGoal(goalId: number, userId: number): Promise<void> {
    // Проверка, что пользователь является участником
    const member = await prisma.goalMember.findUnique({
      where: {
        goal_id_user_id: {
          goal_id: goalId,
          user_id: userId,
        },
      },
      select: {
        role: true,
        goal: {
          select: {
            owner_id: true,
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundError(GOAL_CONSTANTS.ERRORS.USER_NOT_MEMBER);
    }

    // Проверка, что владелец не может покинуть свою цель
    if (member.goal.owner_id === userId) {
      throw new ForbiddenError(GOAL_CONSTANTS.ERRORS.CANNOT_LEAVE_OWN_GOAL);
    }

    await prisma.goalMember.delete({
      where: {
        goal_id_user_id: {
          goal_id: goalId,
          user_id: userId,
        },
      },
    });
  }

  /**
   * Получить участников цели
   */
  async getGoalMembers(goalId: number, userId: number): Promise<GoalMemberDto[]> {
    // Проверка доступа
    await this.checkGoalAccess(goalId, userId);

    const members = await prisma.goalMember.findMany({
      where: { goal_id: goalId },
      select: {
        id: true,
        goal_id: true,
        user_id: true,
        role: true,
        joined_at: true,
        user: {
          select: {
            id: true,
            login: true,
            email: true,
            avatar_url: true,
          },
        },
      },
      orderBy: { joined_at: 'asc' },
    });

    return members;
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
      throw new NotFoundError(GOAL_CONSTANTS.ERRORS.GOAL_NOT_FOUND);
    }

    const isOwner = goal.owner_id === userId;
    const isMember = goal.members.length > 0;

    if (!isOwner && !isMember) {
      throw new ForbiddenError(GOAL_CONSTANTS.ERRORS.NO_PERMISSION);
    }
  }

  /**
   * Проверка прав администратора цели
   */
  private async checkGoalAdminAccess(goalId: number, userId: number): Promise<void> {
    const goal = await prisma.sharedGoal.findUnique({
      where: { id: goalId },
      select: {
        id: true,
        owner_id: true,
        members: {
          where: {
            user_id: userId,
            role: { in: [GOAL_CONSTANTS.ROLES.OWNER, GOAL_CONSTANTS.ROLES.ADMIN] },
          },
          select: { user_id: true },
        },
      },
    });

    if (!goal) {
      throw new NotFoundError(GOAL_CONSTANTS.ERRORS.GOAL_NOT_FOUND);
    }

    const isOwner = goal.owner_id === userId;
    const isAdmin = goal.members.length > 0;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError(GOAL_CONSTANTS.ERRORS.NO_PERMISSION);
    }
  }
}

// Экспорт singleton экземпляра
export const goalService = new GoalService();

