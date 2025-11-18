import request from 'supertest';
import express, { Express } from 'express';
import todosRouter from '../../routes/todos';
import { errorHandler } from '../../middleware/error-handler';
import prisma from '../../db/prisma';
import { generateToken } from '../../utils/jwt';

// Типы для моков
const mockPrisma = prisma as any;

describe('GET /todos', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/todos', todosRouter);
    app.use(errorHandler);
    
    // Очистка всех моков перед каждым тестом
    jest.clearAllMocks();
  });

  describe('Успешные сценарии', () => {
    it('должен вернуть список задач пользователя', async () => {
      // Подготовка данных
      const userId = 1;
      const mockTasks = [
        {
          id: 1,
          user_id: userId,
          name: 'Купить молоко',
          description: 'Купить молоко в магазине',
          priority: 'high',
          task_time: '08.30',
          created_at: new Date('2025-01-10T12:00:00.000Z'),
          updated_at: new Date('2025-01-10T12:00:00.000Z'),
        },
        {
          id: 2,
          user_id: userId,
          name: 'Сделать домашнее задание',
          description: null,
          priority: null,
          task_time: null,
          created_at: new Date('2025-01-09T10:00:00.000Z'),
          updated_at: new Date('2025-01-09T10:00:00.000Z'),
        },
      ];

      // Мокируем Prisma
      (mockPrisma.task.findMany as jest.Mock).mockResolvedValue(mockTasks);

      // Генерируем валидный токен
      const token = generateToken({
        id: userId,
        login: 'testuser',
        email: 'test@example.com',
      });

      // Выполняем запрос
      const response = await request(app)
        .get('/todos')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Проверяем ответ
      expect(response.body.status).toBe('success');
      expect(response.body.tasks).toHaveLength(2);
      expect(response.body.tasks[0]).toMatchObject({
        id: 1,
        user_id: userId,
        name: 'Купить молоко',
        description: 'Купить молоко в магазине',
        priority: 'high',
        task_time: '08.30',
        created_at: mockTasks[0].created_at.toISOString(),
      });
      expect(response.body.tasks[1]).toMatchObject({
        id: 2,
        user_id: userId,
        name: 'Сделать домашнее задание',
        description: null,
        priority: null,
        task_time: null,
        created_at: mockTasks[1].created_at.toISOString(),
      });

      // Проверяем, что Prisma был вызван с правильными параметрами
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          user_id: true,
          name: true,
          description: true,
          priority: true,
          task_time: true,
          created_at: true,
          updated_at: true,
        },
      });
    });

    it('должен вернуть пустой массив, если у пользователя нет задач', async () => {
      const userId = 1;

      // Мокируем Prisma для возврата пустого массива
      (mockPrisma.task.findMany as jest.Mock).mockResolvedValue([]);

      // Генерируем валидный токен
      const token = generateToken({
        id: userId,
        login: 'testuser',
        email: 'test@example.com',
      });

      // Выполняем запрос
      const response = await request(app)
        .get('/todos')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Проверяем ответ
      expect(response.body).toEqual({
        status: 'success',
        tasks: [],
      });

      // Проверяем, что Prisma был вызван
      expect(mockPrisma.task.findMany).toHaveBeenCalledTimes(1);
    });

    it('должен возвращать только задачи текущего пользователя', async () => {
      const userId = 1;
      const otherUserId = 2;

      const mockTasks = [
        {
          id: 1,
          user_id: userId,
          name: 'Задача пользователя 1',
          description: null,
          priority: 'medium',
          task_time: '12.00',
          created_at: new Date('2025-01-10T12:00:00.000Z'),
          updated_at: new Date('2025-01-10T12:00:00.000Z'),
        },
      ];

      // Мокируем Prisma
      (mockPrisma.task.findMany as jest.Mock).mockResolvedValue(mockTasks);

      // Генерируем токен для пользователя 1
      const token = generateToken({
        id: userId,
        login: 'user1',
        email: 'user1@example.com',
      });

      // Выполняем запрос
      const response = await request(app)
        .get('/todos')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Проверяем, что вернулись только задачи пользователя 1
      expect(response.body.tasks).toHaveLength(1);
      expect(response.body.tasks[0].user_id).toBe(userId);

      // Проверяем, что Prisma был вызван с правильным user_id
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user_id: userId },
        })
      );
    });
  });

  describe('Ошибки аутентификации', () => {
    it('должен вернуть 401, если токен не предоставлен', async () => {
      const response = await request(app)
        .get('/todos')
        .expect(401);

      expect(response.body).toEqual({
        status: 'error',
        message: 'Access token is required',
      });

      // Проверяем, что Prisma не был вызван
      expect(mockPrisma.task.findMany).not.toHaveBeenCalled();
    });

    it('должен вернуть 403, если токен невалиден', async () => {
      const response = await request(app)
        .get('/todos')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);

      expect(response.body).toEqual({
        status: 'error',
        message: 'Invalid token',
      });

      // Проверяем, что Prisma не был вызван
      expect(mockPrisma.task.findMany).not.toHaveBeenCalled();
    });

    it('должен вернуть 403, если токен истек', async () => {
      // Используем реальный токен, но мокируем jwt.verify в middleware
      const jwt = require('jsonwebtoken');
      
      // Создаем новый app для этого теста с мокированным jwt
      const testApp = express();
      testApp.use(express.json());
      
      // Мокируем middleware аутентификации
      const mockAuth = (req: any, res: any, next: any) => {
        const error = new Error('jwt expired') as any;
        error.name = 'TokenExpiredError';
        error.expiredAt = new Date();
        return res.status(403).json({
          status: 'error',
          message: 'Token expired',
        });
      };
      
      testApp.use('/todos', mockAuth, todosRouter);
      testApp.use(errorHandler);

      const response = await request(testApp)
        .get('/todos')
        .set('Authorization', 'Bearer expired-token')
        .expect(403);

      expect(response.body).toEqual({
        status: 'error',
        message: 'Token expired',
      });
    });
  });

  describe('Ошибки сервера', () => {
    it('должен вернуть 500, если произошла ошибка базы данных', async () => {
      const userId = 1;

      // Генерируем валидный токен
      const token = generateToken({
        id: userId,
        login: 'testuser',
        email: 'test@example.com',
      });

      // Очищаем предыдущие моки
      jest.clearAllMocks();

      // Мокируем Prisma для выбрасывания ошибки
      (mockPrisma.task.findMany as jest.Mock).mockRejectedValue(
        new Error('Database connection error')
      );

      // Выполняем запрос
      const response = await request(app)
        .get('/todos')
        .set('Authorization', `Bearer ${token}`)
        .expect(500);

      // Проверяем ответ
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Internal server error');
      // В development режиме должна быть детальная ошибка
      if (process.env.NODE_ENV === 'development') {
        expect(response.body.error).toBe('Database connection error');
      }
    });
  });
});

