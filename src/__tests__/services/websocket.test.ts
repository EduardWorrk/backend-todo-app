import { Server as HTTPServer } from 'http';
import express from 'express';
import { Server as IOServer } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { websocketService } from '../../services/websocket.service';
import { generateToken } from '../../utils/jwt';

describe('WebSocket Service', () => {
  let httpServer: HTTPServer;
  let io: IOServer;
  let clientSocket: ClientSocket | null = null;
  const PORT = 3001;

  beforeAll((done) => {
    const app = express();
    httpServer = app.listen(PORT, () => {
      // Инициализируем WebSocket сервис
      websocketService.initialize(httpServer);
      // Получаем io из сервиса для закрытия
      io = (websocketService as any).io;
      done();
    });
  });

  afterAll((done) => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.close();
    }
    if (io) {
      io.close();
    }
    if (httpServer) {
      httpServer.close(done);
    } else {
      done();
    }
  });

  afterEach((done) => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    clientSocket = null;
    done();
  });

  describe('Подключение и аутентификация', () => {
    it('должен подключиться с валидным токеном', (done) => {
      const userId = 1;
      const token = generateToken({
        id: userId,
        login: 'testuser',
        email: 'test@example.com',
      });

      const socket = Client(`http://localhost:${PORT}`, {
        auth: {
          token,
        },
        transports: ['websocket'],
      });
      clientSocket = socket;

      socket.on('connect', () => {
        expect(socket.connected).toBe(true);
        done();
      });

      socket.on('connect_error', (error) => {
        done(error);
      });
    });

    it('должен отклонить подключение без токена', (done) => {
      const socket = Client(`http://localhost:${PORT}`, {
        transports: ['websocket'],
      });
      clientSocket = socket;

      socket.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication');
        done();
      });

      socket.on('connect', () => {
        done(new Error('Подключение не должно было произойти'));
      });
    });

    it('должен отклонить подключение с невалидным токеном', (done) => {
      const socket = Client(`http://localhost:${PORT}`, {
        auth: {
          token: 'invalid-token',
        },
        transports: ['websocket'],
      });
      clientSocket = socket;

      socket.on('connect_error', (error) => {
        expect(error.message).toContain('Invalid token');
        done();
      });

      socket.on('connect', () => {
        done(new Error('Подключение не должно было произойти'));
      });
    });

    it('должен получить событие connected после успешного подключения', (done) => {
      const userId = 1;
      const token = generateToken({
        id: userId,
        login: 'testuser',
        email: 'test@example.com',
      });

      const socket = Client(`http://localhost:${PORT}`, {
        auth: {
          token,
        },
        transports: ['websocket'],
      });
      clientSocket = socket;

      socket.on('connected', (data) => {
        expect(data).toHaveProperty('message');
        expect(data).toHaveProperty('userId', userId);
        done();
      });

      socket.on('connect_error', (error) => {
        done(error);
      });
    });
  });

  describe('Отправка уведомлений', () => {
    let authenticatedSocket: ClientSocket;
    let userId: number;
    let token: string;

    beforeEach((done) => {
      userId = 1;
      token = generateToken({
        id: userId,
        login: 'testuser',
        email: 'test@example.com',
      });

      authenticatedSocket = Client(`http://localhost:${PORT}`, {
        auth: {
          token,
        },
        transports: ['websocket'],
      });

      authenticatedSocket.on('connect', () => {
        done();
      });

      authenticatedSocket.on('connect_error', (error) => {
        done(error);
      });
    });

    afterEach((done) => {
      if (authenticatedSocket && authenticatedSocket.connected) {
        authenticatedSocket.disconnect();
      }
      done();
    });

    it('должен получить уведомление через WebSocket', (done) => {
      authenticatedSocket.on('notification:new', (data) => {
        expect(data).toHaveProperty('notification');
        expect(data.notification).toHaveProperty('id');
        expect(data.notification).toHaveProperty('type');
        expect(data.notification).toHaveProperty('title');
        expect(data.notification).toHaveProperty('message');
        expect(data.notification.user_id).toBe(userId);
        done();
      });

      // Отправляем тестовое уведомление напрямую через WebSocket сервис
      const mockNotification = {
        id: 1,
        user_id: userId,
        type: 'task_assigned',
        title: 'Тестовое уведомление',
        message: 'Это тестовое сообщение',
        related_task_id: null,
        related_goal_id: null,
        is_read: false,
        created_at: new Date(),
      };

      websocketService.sendNotification(userId, mockNotification);
    });

    it('должен получить событие notification:read при прочтении', (done) => {
      const notificationId = 123;

      authenticatedSocket.on('notification:read', (data) => {
        expect(data).toHaveProperty('notification_id', notificationId);
        done();
      });

      // Отправляем событие напрямую через WebSocket сервис
      websocketService.sendNotificationRead(userId, notificationId);
    });

    it('должен получить событие notification:all_read при прочтении всех', (done) => {
      authenticatedSocket.on('notification:all_read', (data) => {
        expect(data).toHaveProperty('user_id', userId);
        done();
      });

      // Отправляем событие напрямую через WebSocket сервис
      websocketService.sendAllNotificationsRead(userId);
    });
  });

  describe('Управление подключениями', () => {
    it('должен отслеживать количество подключенных пользователей', (done) => {
      const userId = 2;
      const token = generateToken({
        id: userId,
        login: 'testuser2',
        email: 'test2@example.com',
      });

      const testSocket = Client(`http://localhost:${PORT}`, {
        auth: {
          token,
        },
        transports: ['websocket'],
      });

      testSocket.on('connect', () => {
        // Даем время на обработку подключения
        setTimeout(() => {
          const count = websocketService.getConnectedUsersCount();
          expect(count).toBeGreaterThan(0);
          expect(websocketService.isUserConnected(userId)).toBe(true);
          
          testSocket.disconnect();
          done();
        }, 100);
      });

      testSocket.on('connect_error', (error) => {
        done(error);
      });
    });
  });
});

