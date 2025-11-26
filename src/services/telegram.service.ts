import TelegramBot from 'node-telegram-bot-api';
import prisma from '../db/prisma';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const CODE_EXPIRY_MINUTES = parseInt(process.env.TELEGRAM_AUTH_CODE_EXPIRY_MINUTES || '2', 10);

/**
 * Сервис для работы с Telegram Bot API
 */
export class TelegramService {
  private bot: TelegramBot | null = null;

  constructor() {
    if (!TELEGRAM_BOT_TOKEN) {
      console.error('[TelegramService] TELEGRAM_BOT_TOKEN is not set. Telegram bot features are disabled.');
      return;
    }

    this.bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
    this.bot.on('message', this.handleBotMessage);
    console.log('[TelegramService] Bot initialized and polling for messages.');
  }

  /**
   * Обрабатывает входящие сообщения от пользователей
   */
  private handleBotMessage = async (msg: TelegramBot.Message): Promise<void> => {
    if (!this.bot) {
      return;
    }

    const chatId = msg.chat.id;
    const text = msg.text?.trim();

    if (!text) {
      return;
    }

    try {
      if (text === '/start') {
        await this.bot.sendMessage(chatId, 'Привет! Это бот авторизации MEVO.');
        await this.generateAuthCode(chatId);
        return;
      }

      if (text === '/auth') {
        await this.bot.sendMessage(chatId, 'Привет! Это бот авторизации Todo.');
        await this.generateAuthCode(chatId);
        return;
      }

      await this.bot.sendMessage(
        chatId,
        'Команда не распознана. Используй /start или /auth, чтобы получить код.'
      );
    } catch (error) {
      console.error(`[TelegramService] Failed to handle message from ${chatId}:`, error);
      await this.bot.sendMessage(chatId, 'Не удалось создать код. Попробуй еще раз позже.');
    }
  };

  /**
   * Генерирует 6-значный код авторизации
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Генерирует уникальный код и сохраняет его в БД
   */
  async generateAuthCode(telegramId: number): Promise<string> {
    if (!this.bot) {
      throw new Error('Telegram bot token is not configured');
    }

    await this.cleanExpiredCodes();

    const code = await this.generateUniqueCode();
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

    await (prisma as any).telegramAuthCode.create({
      data: {
        telegram_id: BigInt(telegramId),
        code,
        expires_at: expiresAt,
        used: false,
      },
    });

    await this.sendCodeToUser(telegramId, code);

    return code;
  }

  /**
   * Потребляет (валидирует и помечает использованным) код авторизации.
   * Возвращает Telegram ID владельца кода.
   */
  async consumeAuthCode(code: string, telegramId?: number): Promise<number | null> {
    await this.cleanExpiredCodes();

    const where: Record<string, unknown> = {
      code,
      used: false,
      expires_at: {
        gt: new Date(),
      },
    };

    if (typeof telegramId === 'number') {
      where.telegram_id = BigInt(telegramId);
    }

    const authCode = await (prisma as any).telegramAuthCode.findFirst({
      where,
      orderBy: {
        created_at: 'desc',
      },
    });

    if (!authCode) {
      return null;
    }

    await (prisma as any).telegramAuthCode.update({
      where: { id: authCode.id },
      data: { used: true },
    });

    return Number(authCode.telegram_id);
  }

  /**
   * Отправляет код авторизации пользователю через Telegram бота
   */
  async sendCodeToUser(telegramId: number, code: string): Promise<void> {
    const activeBot = this.getActiveBot();

    try {
      const message = [
        `Твой код авторизации: ${code}`,
        '',
        `Код действителен ${CODE_EXPIRY_MINUTES} мин.`,
        'Введи его в приложении, чтобы войти.',
      ].join('\n');
      await activeBot.sendMessage(telegramId, message);
    } catch (error) {
      throw new Error(
        `Failed to send code to Telegram user ${telegramId}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Очищает истекшие или использованные коды из БД
   */
  private async cleanExpiredCodes(): Promise<void> {
    await (prisma as any).telegramAuthCode.deleteMany({
      where: {
        OR: [
          { expires_at: { lt: new Date() } },
          { used: true },
        ],
      },
    });
  }

  /**
   * Проверяет, настроен ли бот
   */
  isBotConfigured(): boolean {
    return this.bot !== null && TELEGRAM_BOT_TOKEN !== '';
  }

  private async generateUniqueCode(): Promise<string> {
    let code: string;
    let exists = true;

    do {
      code = this.generateCode();
      const activeCode = await (prisma as any).telegramAuthCode.findFirst({
        where: {
          code,
          used: false,
          expires_at: {
            gt: new Date(),
          },
        },
      });
      exists = Boolean(activeCode);
    } while (exists);

    return code;
  }

  private getActiveBot(): TelegramBot {
    if (!this.bot) {
      throw new Error('Telegram bot token is not configured');
    }
    return this.bot;
  }
}

// Экспорт singleton экземпляра
export const telegramService = new TelegramService();

