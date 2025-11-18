import { Socket } from 'socket.io';

/**
 * Типы для WebSocket событий
 */

export interface SocketUser {
  id: number;
  login: string;
  email: string;
}

export interface SocketData {
  userId?: number;
  user?: SocketUser;
}

/**
 * Типизированный Socket с нашими данными
 */
export type TypedSocket = Socket & {
  data: SocketData;
};

/**
 * События, которые клиент может отправлять на сервер
 */
export enum ClientSocketEvents {
  // Клиент может отправлять эти события
}

/**
 * События, которые сервер отправляет клиенту
 */
export enum ServerSocketEvents {
  NOTIFICATION_NEW = 'notification:new',
  NOTIFICATION_READ = 'notification:read',
  NOTIFICATION_ALL_READ = 'notification:all_read',
  CONNECTED = 'connected',
  ERROR = 'error',
}

/**
 * Payload для события notification:new
 */
export interface NotificationNewPayload {
  notification: {
    id: number;
    user_id: number;
    type: string;
    title: string;
    message: string;
    related_task_id: number | null;
    related_goal_id: number | null;
    is_read: boolean;
    created_at: Date;
  };
}

/**
 * Payload для события notification:read
 */
export interface NotificationReadPayload {
  notification_id: number;
}

/**
 * Payload для события notification:all_read
 */
export interface NotificationAllReadPayload {
  user_id: number;
}

