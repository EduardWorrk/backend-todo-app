import { Server as HTTPServer } from 'http';
import { Server as IOServer } from 'socket.io';
import { authenticateSocket } from '../middleware/socket-auth';
import { ServerSocketEvents, NotificationNewPayload, TypedSocket } from '../types/socket.types';
import { NotificationDto } from '../dto/notification.dto';

/**
 * Сервис для управления WebSocket подключениями через socket.io
 */
export class WebSocketService {
  private io: IOServer | null = null;
  private connectedUsers: Map<number, Set<string>> = new Map(); // userId -> Set of socketIds

  /**
   * Инициализация socket.io на HTTP сервере
   */
  initialize(server: HTTPServer): void {
    this.io = new IOServer(server, {
      cors: {
        origin: '*', // Разрешить все источники (для разработки)
        methods: ['GET', 'POST'],
        credentials: true,``
      },
    });

    // Применяем middleware аутентификации
    this.io.use(authenticateSocket);

    // Обработка подключений
    this.io.on('connection', (socket: TypedSocket) => {
      const userId = socket.data.userId;
      
      if (!userId) {
        socket.disconnect();
        return;
      }

      console.log(`[WebSocket] User ${userId} connected (socket: ${socket.id})`);

      // Добавляем пользователя в комнату по его ID
      this.joinUserRoom(userId, socket.id);

      // Отправляем подтверждение подключения
      socket.emit(ServerSocketEvents.CONNECTED, {
        message: 'Connected to notification service',
        userId,
      });

      // Обработка отключения
      socket.on('disconnect', () => {
        console.log(`[WebSocket] User ${userId} disconnected (socket: ${socket.id})`);
        this.handleDisconnect(userId, socket.id);
      });
    });

    console.log('[WebSocket] Socket.io initialized');
  }

  /**
   * Подключение пользователя к своей комнате
   */
  private joinUserRoom(userId: number, socketId: string): void {
    if (!this.io) return;

    // Создаем комнату для пользователя (по его ID)
    const roomName = `user:${userId}`;
    this.io.sockets.sockets.get(socketId)?.join(roomName);

    // Отслеживаем подключения пользователя
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId)!.add(socketId);

    console.log(`[WebSocket] User ${userId} joined room ${roomName} (socket: ${socketId})`);
  }

  /**
   * Обработка отключения пользователя
   */
  private handleDisconnect(userId: number, socketId: string): void {
    const userSockets = this.connectedUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socketId);
      if (userSockets.size === 0) {
        this.connectedUsers.delete(userId);
      }
    }
  }

  /**
   * Отправка уведомления конкретному пользователю
   */
  sendNotification(userId: number, notification: NotificationDto): void {
    if (!this.io) {
      console.warn('[WebSocket] Socket.io not initialized, cannot send notification');
      return;
    }

    const roomName = `user:${userId}`;
    const payload: NotificationNewPayload = {
      notification: {
        id: notification.id,
        user_id: notification.user_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        related_task_id: notification.related_task_id,
        related_goal_id: notification.related_goal_id,
        is_read: notification.is_read,
        created_at: notification.created_at,
      },
    };

    // Отправляем уведомление всем сокетам пользователя в его комнате
    this.io.to(roomName).emit(ServerSocketEvents.NOTIFICATION_NEW, payload);
    console.log(`[WebSocket] Notification sent to user ${userId} (room: ${roomName})`);
  }

  /**
   * Отправка события о прочтении уведомления
   */
  sendNotificationRead(userId: number, notificationId: number): void {
    if (!this.io) return;

    const roomName = `user:${userId}`;
    this.io.to(roomName).emit(ServerSocketEvents.NOTIFICATION_READ, {
      notification_id: notificationId,
    });
  }

  /**
   * Отправка события о прочтении всех уведомлений
   */
  sendAllNotificationsRead(userId: number): void {
    if (!this.io) return;

    const roomName = `user:${userId}`;
    this.io.to(roomName).emit(ServerSocketEvents.NOTIFICATION_ALL_READ, {
      user_id: userId,
    });
  }

  /**
   * Получить количество активных подключений пользователя
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Проверить, подключен ли пользователь
   */
  isUserConnected(userId: number): boolean {
    return this.connectedUsers.has(userId) && this.connectedUsers.get(userId)!.size > 0;
  }
}

// Экспорт singleton экземпляра
export const websocketService = new WebSocketService();

