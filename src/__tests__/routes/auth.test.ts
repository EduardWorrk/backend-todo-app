import express, { Express } from 'express';
import request from 'supertest';
import prisma from '../../db/prisma';
import { errorHandler } from '../../middleware/error-handler';
import authRouter from '../../routes/auth';
import { telegramService } from '../../services/telegram.service';

// Типы для моков
const mockPrisma = prisma as any;
const mockTelegramService = telegramService as any;

describe('POST /auth/telegram/request-code', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/', authRouter);
    app.use(errorHandler);
    
    // Очистка всех моков перед каждым тестом
    jest.clearAllMocks();
  });

  describe('Успешные сценарии', () => {
    it('должен отправить код авторизации в Telegram', async () => {
      const telegramId = 123456789;
      
      // Мокируем сервис Telegram
      mockTelegramService.isBotConfigured = jest.fn().mockReturnValue(true);
      mockTelegramService.generateAuthCode = jest.fn().mockResolvedValue('123456');

      // Выполняем запрос
      const response = await request(app)
        .post('/auth/telegram/request-code')
        .send({ telegram_id: telegramId })
        .expect(200);

      // Проверяем ответ
      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Код авторизации отправлен в Telegram');
      expect(mockTelegramService.generateAuthCode).toHaveBeenCalledWith(telegramId);
    });
  });

  describe('Ошибки валидации', () => {
    it('должен вернуть ошибку, если telegram_id не указан', async () => {
      const response = await request(app)
        .post('/auth/telegram/request-code')
        .send({})
        .expect(400);

      expect(response.body.status).toBe('error');
    });

    it('должен вернуть ошибку, если telegram_id не является числом', async () => {
      const response = await request(app)
        .post('/auth/telegram/request-code')
        .send({ telegram_id: 'invalid' })
        .expect(400);

      expect(response.body.status).toBe('error');
    });

    it('должен вернуть ошибку, если бот не настроен', async () => {
      mockTelegramService.isBotConfigured = jest.fn().mockReturnValue(false);

      const response = await request(app)
        .post('/auth/telegram/request-code')
        .send({ telegram_id: 123456789 })
        .expect(500);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Telegram бот не настроен');
    });
  });
});

describe('POST /auth/telegram/login', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/', authRouter);
    app.use(errorHandler);
    
    // Очистка всех моков перед каждым тестом
    jest.clearAllMocks();
  });

  describe('Успешные сценарии', () => {
    it('должен авторизовать существующего пользователя через Telegram', async () => {
      const telegramId = 123456789;
      const code = '123456';
      const mockUser = {
        id: 1,
        login: 'telegram_123456789',
        email: 'telegram_123456789@telegram.local',
        telegram_id: BigInt(telegramId),
        created_at: new Date('2025-01-10T12:00:00.000Z'),
      };

      // Мокируем сервис Telegram
      mockTelegramService.consumeAuthCode = jest.fn().mockResolvedValue(telegramId);
      
      // Мокируем Prisma
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // Выполняем запрос
      const response = await request(app)
        .post('/auth/telegram/login')
        .send({ code })
        .expect(200);

      // Проверяем ответ
      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Успешный вход через Telegram');
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toMatchObject({
        id: 1,
        login: 'telegram_123456789',
        email: 'telegram_123456789@telegram.local',
        telegram_id: telegramId,
      });
      expect(mockTelegramService.consumeAuthCode).toHaveBeenCalledWith(code, undefined);
    });

    it('должен создать нового пользователя при первом входе через Telegram', async () => {
      const telegramId = 987654321;
      const code = '654321';
      const mockNewUser = {
        id: 2,
        login: `telegram_${telegramId}`,
        email: `telegram_${telegramId}@telegram.local`,
        telegram_id: BigInt(telegramId),
        created_at: new Date('2025-01-10T12:00:00.000Z'),
      };

      // Мокируем сервис Telegram
      mockTelegramService.consumeAuthCode = jest.fn().mockResolvedValue(telegramId);
      
      // Мокируем Prisma - пользователь не найден, затем создается новый
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValueOnce(null); // checkUserExists
      (mockPrisma.user.create as jest.Mock).mockResolvedValue(mockNewUser);

      // Выполняем запрос
      const response = await request(app)
        .post('/auth/telegram/login')
        .send({ telegram_id: telegramId, code })
        .expect(200);

      // Проверяем ответ
      expect(response.body.status).toBe('success');
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toMatchObject({
        id: 2,
        login: `telegram_${telegramId}`,
        email: `telegram_${telegramId}@telegram.local`,
        telegram_id: telegramId,
      });
      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(mockTelegramService.consumeAuthCode).toHaveBeenCalledWith(code, telegramId);
    });
  });

  describe('Ошибки валидации', () => {
    it('должен вернуть ошибку, если код не указан', async () => {
      const response = await request(app)
        .post('/auth/telegram/login')
        .send({ telegram_id: 123456789 })
        .expect(400);

      expect(response.body.status).toBe('error');
    });

    it('должен вернуть ошибку, если код не состоит из 6 цифр', async () => {
      const response = await request(app)
        .post('/auth/telegram/login')
        .send({ telegram_id: 123456789, code: '12345' })
        .expect(400);

      expect(response.body.status).toBe('error');
    });

    it('должен вернуть ошибку, если код содержит не только цифры', async () => {
      const response = await request(app)
        .post('/auth/telegram/login')
        .send({ telegram_id: 123456789, code: '12345a' })
        .expect(400);

      expect(response.body.status).toBe('error');
    });
  });

  describe('Ошибки авторизации', () => {
    it('должен вернуть ошибку при неверном коде', async () => {
      const telegramId = 123456789;
      const code = '000000';

      // Мокируем сервис Telegram - код неверный
      mockTelegramService.consumeAuthCode = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/telegram/login')
        .send({ telegram_id: telegramId, code })
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Неверный или истекший код авторизации');
      expect(mockTelegramService.consumeAuthCode).toHaveBeenCalledWith(code, telegramId);
    });
  });
});



