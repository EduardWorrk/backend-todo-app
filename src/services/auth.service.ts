import bcrypt from 'bcrypt';
import { AUTH_CONSTANTS } from '../constants/auth.constants';
import prisma from '../db/prisma';
import { TelegramLoginDto, UserDto } from '../dto/auth.dto';
import { AuthenticationError, ConflictError } from '../utils/errors';
import { generateToken } from '../utils/jwt';
import { SecurityLogger } from '../utils/security-logger';
import { LoginInput, RegisterInput } from '../validators/auth.validator';
import { telegramService } from './telegram.service';

type TelegramUserRecord = {
  id: number;
  login: string;
  email: string;
  telegram_id: bigint | null;
  created_at: Date;
};

/**
 * Сервис для бизнес-логики аутентификации
 */
export class AuthService {
  /**
   * Регистрация нового пользователя
   */
  async register(
    data: RegisterInput,
    metadata?: { ip?: string; userAgent?: string }
  ): Promise<{ user: UserDto; token: string }> {
    const { login, email, password } = data;

    // Проверка существования пользователя
    await this.checkUserExists(login, email);

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(
      password,
      AUTH_CONSTANTS.BCRYPT_SALT_ROUNDS
    );

    // Создание пользователя
    const user = await prisma.user.create({
      data: {
        login,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        login: true,
        email: true,
        created_at: true,
      },
    });

    if (!user) {
      throw new AuthenticationError(AUTH_CONSTANTS.ERRORS.INVALID_TELEGRAM_CODE);
    }

    // Генерация JWT токена
    const token = generateToken({
      id: user.id,
      login: user.login,
      email: user.email,
    });

    // Логирование регистрации
    SecurityLogger.logRegistration(
      user.id,
      user.email,
      user.login,
      metadata?.ip,
      metadata?.userAgent
    );

    return { user, token };
  }

  /**
   * Авторизация пользователя
   */
  async login(
    data: LoginInput,
    metadata?: { ip?: string; userAgent?: string }
  ): Promise<{ user: UserDto; token: string }> {
    const { email, password } = data;

    // Логирование попытки входа
    SecurityLogger.logAuthAttempt(email, metadata?.ip, metadata?.userAgent);

    // Поиск пользователя по email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        login: true,
        email: true,
        password: true,
        created_at: true,
        telegram_id: true,
      },
    });

    if (!user) {
      // Логирование неудачной попытки (пользователь не найден)
      SecurityLogger.logAuthFailure(
        email,
        'USER_NOT_FOUND',
        metadata?.ip,
        metadata?.userAgent
      );
      throw new AuthenticationError(AUTH_CONSTANTS.ERRORS.INVALID_CREDENTIALS);
    }

    // Проверка пароля
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Логирование неудачной попытки (неверный пароль)
      SecurityLogger.logAuthFailure(
        email,
        'INVALID_PASSWORD',
        metadata?.ip,
        metadata?.userAgent
      );
      throw new AuthenticationError(AUTH_CONSTANTS.ERRORS.INVALID_CREDENTIALS);
    }

    // Генерация JWT токена
    const token = generateToken({
      id: user.id,
      login: user.login,
      email: user.email,
    });

    // Удаляем пароль из объекта пользователя
    // Получаем аватар Telegram, если связан telegram_id
    let avatarUrl: string | null = null;
    const telegramIdNumber =
      typeof user.telegram_id === 'bigint'
        ? Number(user.telegram_id)
        : typeof user.telegram_id === 'number'
          ? user.telegram_id
          : null;

    if (telegramIdNumber && telegramService.isBotConfigured()) {
      try {
        avatarUrl = await telegramService.getUserAvatarUrl(telegramIdNumber);
      } catch {
        avatarUrl = null;
      }
    }

    const userResponse: UserDto = {
      id: user.id,
      login: user.login,
      email: user.email,
      telegram_id: telegramIdNumber,
      created_at: user.created_at,
      avatar_url: avatarUrl,
    };

    // Логирование успешного входа
    SecurityLogger.logAuthSuccess(
      user.id,
      user.email,
      metadata?.ip,
      metadata?.userAgent
    );

    return { user: userResponse, token };
  }

  /**
   * Авторизация через Telegram
   */
  async loginWithTelegram(
    data: TelegramLoginDto,
    metadata?: { ip?: string; userAgent?: string }
  ): Promise<{ user: UserDto; token: string }> {
    const { telegram_id: providedTelegramId, code } = data;

    const resolvedTelegramId = await telegramService.consumeAuthCode(
      code,
      providedTelegramId
    );

    if (!resolvedTelegramId) {
      SecurityLogger.logAuthFailure(
        providedTelegramId ? `telegram_${providedTelegramId}` : 'telegram_unknown',
        'INVALID_TELEGRAM_CODE',
        metadata?.ip,
        metadata?.userAgent
      );
      throw new AuthenticationError(AUTH_CONSTANTS.ERRORS.INVALID_TELEGRAM_CODE);
    }

    // Поиск пользователя по telegram_id
    const prismaClient = prisma as any;
    let user: TelegramUserRecord | null = await prismaClient.user.findUnique({
      where: { telegram_id: BigInt(resolvedTelegramId) },
      select: {
        id: true,
        login: true,
        email: true,
        telegram_id: true,
        created_at: true,
      },
    });

    // Если пользователь не найден, создаем нового
    if (!user) {
      let profileLogin: string | undefined;

      if (telegramService.isBotConfigured()) {
        const profile = await telegramService.getUserProfile(resolvedTelegramId);
        if (profile) {
          profileLogin = profile.username || profile.first_name || undefined;
        }
      }

    
      const login = profileLogin?.trim() || 'user';
      const email = ``;
      const tempPassword = await bcrypt.hash(
        `temp_${resolvedTelegramId}_${Date.now()}`,
        AUTH_CONSTANTS.BCRYPT_SALT_ROUNDS
      );

      await this.checkUserExists(login, email);

      user = await prismaClient.user.create({
        data: {
          login,
          email,
          password: tempPassword,
          telegram_id: BigInt(resolvedTelegramId),
        },
        select: {
          id: true,
          login: true,
          email: true,
          telegram_id: true,
          created_at: true,
        },
      });

      if (!user) {
        throw new AuthenticationError(AUTH_CONSTANTS.ERRORS.INTERNAL_ERROR);
      }

      SecurityLogger.logRegistration(
        user.id,
        user.email,
        user.login,
        metadata?.ip,
        metadata?.userAgent
      );
    }

    // Получаем ссылку на аватар, если настроен бот
    let avatarUrl: string | null = null;
    if (telegramService.isBotConfigured()) {
      try {
        avatarUrl = await telegramService.getUserAvatarUrl(resolvedTelegramId);
      } catch (error) {
        avatarUrl = null;
      }
    }

    if (!user) {
      throw new AuthenticationError(AUTH_CONSTANTS.ERRORS.INTERNAL_ERROR);
    }

    // Генерация JWT токена
    const token = generateToken({
      id: user.id,
      login: user.login,
      email: user.email,
    });

    const userResponse: UserDto = {
      id: user.id,
      login: user.login,
      email: user.email,
      telegram_id: Number(resolvedTelegramId),
      created_at: user.created_at,
      avatar_url: avatarUrl,
    };

    SecurityLogger.logAuthSuccess(
      user.id,
      user.email,
      metadata?.ip,
      metadata?.userAgent
    );

    return { user: userResponse, token };
  }

  /**
   * Проверка существования пользователя по login или email
   */
  private async checkUserExists(login: string, email: string): Promise<void> {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ login }, { email }],
      },
      select: {
        login: true,
        email: true,
      },
    });

    if (!existingUser) {
      return;
    }

    // Определяем, какое поле дублируется
    if (existingUser.login === login && existingUser.email === email) {
      throw new ConflictError(AUTH_CONSTANTS.ERRORS.USER_EXISTS_BOTH);
    } else if (existingUser.login === login) {
      throw new ConflictError(AUTH_CONSTANTS.ERRORS.USER_EXISTS_LOGIN);
    } else if (existingUser.email === email) {
      throw new ConflictError(AUTH_CONSTANTS.ERRORS.USER_EXISTS_EMAIL);
    }
  }
}

// Экспорт singleton экземпляра
export const authService = new AuthService();

