/**
 * DTO (Data Transfer Objects) для модуля задач
 */

export interface TaskDto {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTaskDto {
  name: string;
  description?: string | null;
}

export interface UpdateTaskDto {
  name?: string;
  description?: string | null;
}

export interface TasksResponseDto {
  status: 'success' | 'error';
  tasks: TaskDto[];
}

export interface TaskResponseDto {
  status: 'success' | 'error';
  message: string;
  task: TaskDto;
}

export interface DeleteTaskResponseDto {
  status: 'success' | 'error';
  message: string;
}

