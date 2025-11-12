/**
 * DTO (Data Transfer Objects) для модуля комментариев
 */

import { UserBasicDto } from './todo.dto';

export interface CommentDto {
  id: number;
  task_id: number;
  user_id: number;
  content: string;
  created_at: Date;
  updated_at: Date;
  user: UserBasicDto;
}

export interface CreateCommentDto {
  content: string;
}

export interface UpdateCommentDto {
  content: string;
}

export interface CommentsResponseDto {
  status: 'success' | 'error';
  comments: CommentDto[];
}

export interface CommentResponseDto {
  status: 'success' | 'error';
  message: string;
  comment: CommentDto;
}

export interface DeleteCommentResponseDto {
  status: 'success' | 'error';
  message: string;
}

