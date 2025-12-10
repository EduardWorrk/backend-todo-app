import { Request, Response } from 'express';
import { COMMENT_CONSTANTS } from '../constants/comment.constants';
import {
  CommentResponseDto,
  CommentsResponseDto,
  DeleteCommentResponseDto,
} from '../dto/comment.dto';
import { commentService } from '../services/comment.service';

/**
 * Контроллер для обработки HTTP запросов комментариев
 */
export class CommentController {
  /**
   * Создать комментарий
   */
  async createComment(req: Request, res: Response): Promise<void> {
    const taskId = parseInt(req.params.id);
    const userId = req.user!.id;
    const comment = await commentService.createComment(taskId, userId, req.body);

    const response: CommentResponseDto = {
      status: 'success',
      message: COMMENT_CONSTANTS.SUCCESS.CREATED,
      comment,
    };

    res.status(201).json(response);
  }

  /**
   * Получить комментарии задачи
   */
  
  async getComments(req: Request, res: Response): Promise<void> {
    const taskId = parseInt(req.params.id);
    const userId = req.user!.id;
    const comments = await commentService.getTaskComments(taskId, userId);

    const response: CommentsResponseDto = {
      status: 'success',
      comments,
    };

    res.json(response);
  }

  /**
   * Обновить комментарий
   */
  async updateComment(req: Request, res: Response): Promise<void> {
    const commentId = parseInt(req.params.id);
    const userId = req.user!.id;
    const comment = await commentService.updateComment(commentId, userId, req.body);

    const response: CommentResponseDto = {
      status: 'success',
      message: COMMENT_CONSTANTS.SUCCESS.UPDATED,
      comment,
    };

    res.json(response);
  }

  /**
   * Удалить комментарий
   */
  async deleteComment(req: Request, res: Response): Promise<void> {
    const commentId = parseInt(req.params.id);
    const userId = req.user!.id;
    await commentService.deleteComment(commentId, userId);

    const response: DeleteCommentResponseDto = {
      status: 'success',
      message: COMMENT_CONSTANTS.SUCCESS.DELETED,
    };

    res.json(response);
  }
}

// Экспорт singleton экземпляра
export const commentController = new CommentController();

