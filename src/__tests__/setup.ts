/**
 * Настройка тестового окружения
 */

// Мокируем Prisma Client
const mockPrismaClient = {
  task: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  category: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  telegramAuthCode: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

jest.mock('../db/prisma', () => ({
  __esModule: true,
  default: mockPrismaClient,
}));

// Мокируем SecurityLogger чтобы не было лишних логов в тестах
jest.mock('../utils/security-logger', () => ({
  SecurityLogger: {
    logAuthAttempt: jest.fn(),
    logAuthSuccess: jest.fn(),
    logAuthFailure: jest.fn(),
    logRegistration: jest.fn(),
    logInvalidToken: jest.fn(),
    logExpiredToken: jest.fn(),
  },
  getClientIp: jest.fn(),
  getUserAgent: jest.fn(),
}));

// Мокируем Telegram сервис
jest.mock('../services/telegram.service', () => ({
  telegramService: {
    isBotConfigured: jest.fn(),
    generateAuthCode: jest.fn(),
    consumeAuthCode: jest.fn(),
    sendCodeToUser: jest.fn(),
  },
}));

// Мокируем GigaChat сервис
jest.mock('../services/gigachat.service', () => ({
  gigaChatService: {
    isConfigured: jest.fn(),
    sendMessage: jest.fn(),
  },
}));

