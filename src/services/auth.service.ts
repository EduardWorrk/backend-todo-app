import prisma from '../db/prisma';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt';
import { AUTH_CONSTANTS } from '../constants/auth.constants';
import { ConflictError, AuthenticationError } from '../utils/errors';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import { UserDto } from '../dto/auth.dto';
import { SecurityLogger } from '../utils/security-logger';

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
    const { password: _, ...userWithoutPassword } = user;

    // Логирование успешного входа
    SecurityLogger.logAuthSuccess(
      user.id,
      user.email,
      metadata?.ip,
      metadata?.userAgent
    );

    return { user: userWithoutPassword, token };
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

