import { Request, Response } from 'express';
import { todoService } from '../services/todo.service';
import { TODO_CONSTANTS } from '../constants/todo.constants';
import { TasksResponseDto, TaskResponseDto, DeleteTaskResponseDto } from '../dto/todo.dto';

/**
 * Контроллер для обработки HTTP запросов задач
 */
export class TodoController {
  /**
   * Получить все задачи пользователя
   */
  async getTasks(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const tasks = await todoService.getUserTasks(userId);

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
}

// Экспорт singleton экземпляра
export const todoController = new TodoController();

