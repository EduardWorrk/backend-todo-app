/**
 * DTO (Data Transfer Objects) для модуля задач
 */

export interface UserBasicDto {
  id: number;
  login: string;
  email: string;
  avatar_url: string | null;
}

export interface TaskDto {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  status: string; // pending, in_progress, completed
  completed_at: Date | null;
  assigned_to_id: number | null;
  shared_goal_id: number | null;
  assigned_to: UserBasicDto | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTaskDto {
  name: string;
  description?: string | null;
  status?: string;
  shared_goal_id?: number | null;
  assigned_to_id?: number | null;
}

export interface UpdateTaskDto {
  name?: string;
  description?: string | null;
  status?: string;
  assigned_to_id?: number | null;
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

