import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { telegramService } from '../services/telegram.service';
import { AUTH_CONSTANTS } from '../constants/auth.constants';
import { AuthResponseDto } from '../dto/auth.dto';
import { getClientIp, getUserAgent } from '../utils/security-logger';
import { RequestTelegramCodeInput, TelegramLoginInput } from '../validators/telegram.validator';

/**
 * Контроллер для обработки HTTP запросов аутентификации
 */
export class AuthController {
  /**
   * Регистрация нового пользователя
   */
  async register(req: Request, res: Response): Promise<void> {
    const metadata = {
      ip: getClientIp(req),
      userAgent: getUserAgent(req),
    };

    const { user, token } = await authService.register(req.body, metadata);

    const response: AuthResponseDto = {
      status: 'success',
      message: AUTH_CONSTANTS.SUCCESS.REGISTERED,
      token,
      user,
    };

    res.status(201).json(response);
  }

  /**
   * Авторизация пользователя
   */
  async login(req: Request, res: Response): Promise<void> {
    const metadata = {
      ip: getClientIp(req),
      userAgent: getUserAgent(req),
    };

    const { user, token } = await authService.login(req.body, metadata);

    const response: AuthResponseDto = {
      status: 'success',
      message: AUTH_CONSTANTS.SUCCESS.LOGIN,
      token,
      user,
    };

    res.json(response);
  }

  /**
   * Запрос кода авторизации через Telegram
   */
  async requestTelegramCode(req: Request, res: Response): Promise<void> {
    if (!telegramService.isBotConfigured()) {
      res.status(500).json({
        status: 'error',
        message: AUTH_CONSTANTS.ERRORS.TELEGRAM_BOT_NOT_CONFIGURED,
      });
      return;
    }

    const data: RequestTelegramCodeInput = req.body;

    try {
      await telegramService.generateAuthCode(data.telegram_id);

      res.json({
        status: 'success',
        message: AUTH_CONSTANTS.SUCCESS.TELEGRAM_CODE_SENT,
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : AUTH_CONSTANTS.ERRORS.FAILED_TO_SEND_TELEGRAM_CODE,
      });
    }
  }

  /**
   * Авторизация через Telegram
   */
  async loginWithTelegram(req: Request, res: Response): Promise<void> {
    const metadata = {
      ip: getClientIp(req),
      userAgent: getUserAgent(req),
    };

    const data: TelegramLoginInput = req.body;
    const { user, token } = await authService.loginWithTelegram(
      data,
      metadata
    );

    const response: AuthResponseDto = {
      status: 'success',
      message: AUTH_CONSTANTS.SUCCESS.TELEGRAM_LOGIN,
      token,
      user,
    };

    res.json(response);
  }
}

// Экспорт singleton экземпляра
export const authController = new AuthController();

