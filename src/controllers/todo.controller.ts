import { Request, Response } from 'express';
import { TODO_CONSTANTS } from '../constants/todo.constants';
import { DeleteTaskResponseDto, PublicTaskResponseDto, TaskResponseDto, TasksResponseDto } from '../dto/todo.dto';
import { todoService } from '../services/todo.service';

/**
 * Контроллер для обработки HTTP запросов задач
 */
export class TodoController {
  /**
   * Получить все задачи пользователя
   */
  async getTasks(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const status = req.query.status as string | undefined;
    const assigned = req.query.assigned === 'true';
    const goalId = req.query.goalId ? parseInt(req.query.goalId as string) : undefined;

    const tasks = await todoService.getUserTasks(userId, {
      status,
      assigned,
      goalId,
    });

    const response: TasksResponseDto = {
      status: 'success',
      tasks,
    };

    res.json(response);
  }

  /**
   * Создать новую задачу
   */
  async createTask(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const task = await todoService.createTask(userId, req.body);

    const response: TaskResponseDto = {
      status: 'success',
      message: TODO_CONSTANTS.SUCCESS.CREATED,
      task,
    };

    res.status(201).json(response);
  }

  /**
   * Обновить задачу
   */
  async updateTask(req: Request, res: Response): Promise<void> {
    const taskId = parseInt(req.params.id);
    const userId = req.user!.id;
    const task = await todoService.updateTask(taskId, userId, req.body);

    const response: TaskResponseDto = {
      status: 'success',
      message: TODO_CONSTANTS.SUCCESS.UPDATED,
      task,
    };

    res.json(response);
  }

  /**
   * Удалить задачу
   */
  async deleteTask(req: Request, res: Response): Promise<void> {
    const taskId = parseInt(req.params.id);
    const userId = req.user!.id;
    await todoService.deleteTask(taskId, userId);

    const response: DeleteTaskResponseDto = {
      status: 'success',
      message: TODO_CONSTANTS.SUCCESS.DELETED,
    };

    res.json(response);
  }

  /**
   * Назначить задачу исполнителю
   */
  async assignTask(req: Request, res: Response): Promise<void> {
    const taskId = parseInt(req.params.id);
    const userId = req.user!.id;
    const assigneeId = parseInt(req.body.assigned_to_id);

    if (!assigneeId) {
      res.status(400).json({
        status: 'error',
        message: 'Необходимо указать assigned_to_id',
      });
      return;
    }

    const task = await todoService.assignTask(taskId, userId, assigneeId);

    const response: TaskResponseDto = {
      status: 'success',
      message: 'Задача успешно назначена',
      task,
    };

    res.json(response);
  }

  /**
   * Снять назначение задачи
   */
  async unassignTask(req: Request, res: Response): Promise<void> {
    const taskId = parseInt(req.params.id);
    const userId = req.user!.id;
    const task = await todoService.unassignTask(taskId, userId);

    const response: TaskResponseDto = {
      status: 'success',
      message: 'Назначение успешно снято',
      task,
    };

    res.json(response);
  }

  /**
   * Публично получить задачу по ID (без авторизации, только чтение)
   */
  async getTaskPublic(req: Request, res: Response): Promise<void> {
    const taskId = parseInt(req.params.id);
    const task = await todoService.getTaskPublic(taskId);

    const response: PublicTaskResponseDto = {
      status: 'success',
      task,
    };

    res.json(response);
  }
}

// Экспорт singleton экземпляра
export const todoController = new TodoController();

