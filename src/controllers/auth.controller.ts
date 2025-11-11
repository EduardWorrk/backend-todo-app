import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { AUTH_CONSTANTS } from '../constants/auth.constants';
import { AuthResponseDto } from '../dto/auth.dto';
import { getClientIp, getUserAgent } from '../utils/security-logger';

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
}

// Экспорт singleton экземпляра
export const authController = new AuthController();

