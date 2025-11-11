import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { USER_CONSTANTS } from '../constants/user.constants';
import {
  UserProfileResponseDto,
  ChangePasswordResponseDto,
  RefreshTokenResponseDto,
  LogoutResponseDto,
} from '../dto/user.dto';
import { getClientIp, getUserAgent } from '../utils/security-logger';

/**
 * Контроллер для обработки HTTP запросов пользователя
 */
export class UserController {
  /**
   * Получить профиль текущего пользователя
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const user = await userService.getProfile(userId);

    const response: UserProfileResponseDto = {
      status: 'success',
      user,
    };

    res.json(response);
  }

  /**
   * Обновить профиль текущего пользователя
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const metadata = {
      ip: getClientIp(req),
      userAgent: getUserAgent(req),
    };

    const user = await userService.updateProfile(userId, req.body, metadata);

    const response: UserProfileResponseDto = {
      status: 'success',
      message: USER_CONSTANTS.SUCCESS.PROFILE_UPDATED,
      user,
    };

    res.json(response);
  }

  /**
   * Сменить пароль текущего пользователя
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const metadata = {
      ip: getClientIp(req),
      userAgent: getUserAgent(req),
    };

    await userService.changePassword(userId, req.body, metadata);

    const response: ChangePasswordResponseDto = {
      status: 'success',
      message: USER_CONSTANTS.SUCCESS.PASSWORD_CHANGED,
    };

    res.json(response);
  }

  /**
   * Обновить токен (refresh)
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const token = await userService.refreshToken(userId);

    const response: RefreshTokenResponseDto = {
      status: 'success',
      message: USER_CONSTANTS.SUCCESS.TOKEN_REFRESHED,
      token,
    };

    res.json(response);
  }

  /**
   * Выход пользователя
   */
  async logout(req: Request, res: Response): Promise<void> {
    // В текущей реализации JWT stateless, поэтому просто возвращаем успех
    // В будущем можно добавить blacklist токенов в Redis
    
    const response: LogoutResponseDto = {
      status: 'success',
      message: USER_CONSTANTS.SUCCESS.LOGGED_OUT,
    };

    res.json(response);
  }
}

// Экспорт singleton экземпляра
export const userController = new UserController();

