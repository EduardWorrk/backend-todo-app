/**
 * DTO (Data Transfer Objects) для модуля совместных целей
 */

import { UserBasicDto } from './todo.dto';

export interface GoalDto {
  id: number;
  name: string;
  description: string | null;
  owner_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface GoalMemberDto {
  id: number;
  goal_id: number;
  user_id: number;
  role: string;
  joined_at: Date;
  user: UserBasicDto;
}

export interface GoalWithTasksDto extends GoalDto {
  members: GoalMemberDto[];
  tasks_count: number;
  completed_tasks_count: number;
}

export interface CreateGoalDto {
  name: string;
  description?: string | null;
  member_ids?: number[];
}

export interface UpdateGoalDto {
  name?: string;
  description?: string | null;
}

export interface InviteMemberDto {
  user_id?: number;
  email?: string;
}

export interface GoalsResponseDto {
  status: 'success' | 'error';
  goals: GoalDto[];
}

export interface GoalResponseDto {
  status: 'success' | 'error';
  message?: string;
  goal: GoalWithTasksDto;
}

export interface GoalMembersResponseDto {
  status: 'success' | 'error';
  members: GoalMemberDto[];
}

export interface InviteMemberResponseDto {
  status: 'success' | 'error';
  message: string;
  member: GoalMemberDto;
}

