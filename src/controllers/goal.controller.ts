import { Request, Response } from 'express';
import { goalService } from '../services/goal.service';
import { GOAL_CONSTANTS } from '../constants/goal.constants';
import {
  GoalsResponseDto,
  GoalResponseDto,
  GoalMembersResponseDto,
  InviteMemberResponseDto,
} from '../dto/goal.dto';

/**
 * Контроллер для обработки HTTP запросов совместных целей
 */
export class GoalController {
  /**
   * Создать совместную цель
   */
  async createGoal(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const goal = await goalService.createGoal(userId, req.body);

    const response: GoalResponseDto = {
      status: 'success',
      message: GOAL_CONSTANTS.SUCCESS.CREATED,
      goal: {
        ...goal,
        members: [],
        tasks_count: 0,
        completed_tasks_count: 0,
      },
    };

    res.status(201).json(response);
  }

  /**
   * Получить цели пользователя
   */
  async getGoals(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const goals = await goalService.getUserGoals(userId);

    const response: GoalsResponseDto = {
      status: 'success',
      goals,
    };

    res.json(response);
  }

  /**
   * Получить цель по ID
   */
  async getGoal(req: Request, res: Response): Promise<void> {
    const goalId = parseInt(req.params.id);
    const userId = req.user!.id;
    const goal = await goalService.getGoalById(goalId, userId);

    const response: GoalResponseDto = {
      status: 'success',
      goal,
    };

    res.json(response);
  }

  /**
   * Обновить цель
   */
  async updateGoal(req: Request, res: Response): Promise<void> {
    const goalId = parseInt(req.params.id);
    const userId = req.user!.id;
    const goal = await goalService.updateGoal(goalId, userId, req.body);

    const goalWithDetails = await goalService.getGoalById(goalId, userId);

    const response: GoalResponseDto = {
      status: 'success',
      message: GOAL_CONSTANTS.SUCCESS.UPDATED,
      goal: goalWithDetails,
    };

    res.json(response);
  }

  /**
   * Удалить цель
   */
  async deleteGoal(req: Request, res: Response): Promise<void> {
    const goalId = parseInt(req.params.id);
    const userId = req.user!.id;
    await goalService.deleteGoal(goalId, userId);

    res.json({
      status: 'success',
      message: GOAL_CONSTANTS.SUCCESS.DELETED,
    });
  }

  /**
   * Пригласить участника
   */
  async inviteMember(req: Request, res: Response): Promise<void> {
    const goalId = parseInt(req.params.id);
    const userId = req.user!.id;
    const member = await goalService.inviteMember(goalId, userId, req.body);

    const response: InviteMemberResponseDto = {
      status: 'success',
      message: GOAL_CONSTANTS.SUCCESS.MEMBER_INVITED,
      member,
    };

    res.status(201).json(response);
  }

  /**
   * Удалить участника
   */
  async removeMember(req: Request, res: Response): Promise<void> {
    const goalId = parseInt(req.params.id);
    const targetUserId = parseInt(req.params.userId);
    const userId = req.user!.id;
    await goalService.removeMember(goalId, userId, targetUserId);

    res.json({
      status: 'success',
      message: GOAL_CONSTANTS.SUCCESS.MEMBER_REMOVED,
    });
  }

  /**
   * Покинуть цель
   */
  async leaveGoal(req: Request, res: Response): Promise<void> {
    const goalId = parseInt(req.params.id);
    const userId = req.user!.id;
    await goalService.leaveGoal(goalId, userId);

    res.json({
      status: 'success',
      message: GOAL_CONSTANTS.SUCCESS.LEFT,
    });
  }

  /**
   * Получить участников цели
   */
  async getMembers(req: Request, res: Response): Promise<void> {
    const goalId = parseInt(req.params.id);
    const userId = req.user!.id;
    const members = await goalService.getGoalMembers(goalId, userId);

    const response: GoalMembersResponseDto = {
      status: 'success',
      members,
    };

    res.json(response);
  }
}

// Экспорт singleton экземпляра
export const goalController = new GoalController();

