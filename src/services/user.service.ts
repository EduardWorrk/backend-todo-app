import prisma from '../db/prisma';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt';
import { AUTH_CONSTANTS } from '../constants/auth.constants';
import { USER_CONSTANTS } from '../constants/user.constants';
import { ConflictError, AuthenticationError, NotFoundError, BadRequestError } from '../utils/errors';
import { UpdateProfileInput, ChangePasswordInput } from '../validators/user.validator';
import { UserProfileDto } from '../dto/user.dto';
import { SecurityLogger } from '../utils/security-logger';
import { processAvatar, deleteAvatarFiles, getAvatarUrl } from '../utils/file-upload';
import path from 'path';

/**
 * Селекты для пользователя
 */
const userSelect = {
  id: true,
  login: true,
  email: true,
  avatar_url: true,
  created_at: true,
} as const;

/**
 * Сервис для бизнес-логики пользователя
 */
export class UserService {
  /**
   * Получить профиль пользователя
   */
  async getProfile(userId: number): Promise<UserProfileDto> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });

    if (!user) {
      throw new NotFoundError(USER_CONSTANTS.ERRORS.USER_NOT_FOUND);
    }

    return user;
  }

  /**
   * Обновить профиль пользователя
   */
  async updateProfile(
    userId: number,
    data: UpdateProfileInput,
    metadata?: { ip?: string; userAgent?: string }
  ): Promise<UserProfileDto> {
    // Проверка существования пользователя
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, login: true, email: true },
    });

    if (!existingUser) {
      throw new NotFoundError(USER_CONSTANTS.ERRORS.USER_NOT_FOUND);
    }

    // Проверка уникальности login и email, если они изменяются
    if (data.login || data.email) {
      await this.checkUserExistsForUpdate(
        userId,
        data.login || existingUser.login,
        data.email || existingUser.email
      );
    }

    // Подготовка данных для обновления
    const updateData: { login?: string; email?: string } = {};
    
    if (data.login !== undefined) {
      updateData.login = data.login;
    }

    if (data.email !== undefined) {
      updateData.email = data.email;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: userSelect,
    });

    // Логирование обновления профиля
    SecurityLogger.logAuthSuccess(
      user.id,
      user.email,
      metadata?.ip,
      metadata?.userAgent
    );

    return user;
  }

  /**
   * Сменить пароль пользователя
   */
  async changePassword(
    userId: number,
    data: ChangePasswordInput,
    metadata?: { ip?: string; userAgent?: string }
  ): Promise<void> {
    // Получаем пользователя с паролем
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });

    if (!user) {
      throw new NotFoundError(USER_CONSTANTS.ERRORS.USER_NOT_FOUND);
    }

    // Проверка старого пароля
    const isOldPasswordValid = await bcrypt.compare(data.oldPassword, user.password);

    if (!isOldPasswordValid) {
      SecurityLogger.logAuthFailure(
        user.email,
        'INVALID_PASSWORD',
        metadata?.ip,
        metadata?.userAgent
      );
      throw new AuthenticationError(USER_CONSTANTS.ERRORS.INVALID_OLD_PASSWORD);
    }

    // Хеширование нового пароля
    const hashedPassword = await bcrypt.hash(
      data.newPassword,
      AUTH_CONSTANTS.BCRYPT_SALT_ROUNDS
    );

    // Обновление пароля
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Логирование смены пароля
    SecurityLogger.logAuthSuccess(
      user.id,
      user.email,
      metadata?.ip,
      metadata?.userAgent
    );
  }

  /**
   * Обновить токен (refresh)
   */
  async refreshToken(userId: number): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });

    if (!user) {
      throw new NotFoundError(USER_CONSTANTS.ERRORS.USER_NOT_FOUND);
    }

    // Генерация нового токена
    const token = generateToken({
      id: user.id,
      login: user.login,
      email: user.email,
    });

    return token;
  }

  /**
   * Поиск пользователей по email или login
   */
  async searchUsers(query: string, limit: number = 10): Promise<UserProfileDto[]> {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { login: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: userSelect,
    });

    return users;
  }

  /**
   * Проверка существования пользователя при обновлении
   */
  private async checkUserExistsForUpdate(
    userId: number,
    login: string,
    email: string
  ): Promise<void> {
    const existingUser = await prisma.user.findFirst({
      where: {
        AND: [
          { id: { not: userId } }, // Исключаем текущего пользователя
          {
            OR: [{ login }, { email }],
          },
        ],
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
      throw new ConflictError(USER_CONSTANTS.ERRORS.EMAIL_EXISTS);
    } else if (existingUser.login === login) {
      throw new ConflictError(USER_CONSTANTS.ERRORS.LOGIN_EXISTS);
    } else if (existingUser.email === email) {
      throw new ConflictError(USER_CONSTANTS.ERRORS.EMAIL_EXISTS);
    }
  }

  /**
   * Загрузить аватар пользователя
   */
  async uploadAvatar(
    userId: number,
    file: Express.Multer.File
  ): Promise<{ avatar_url: string }> {
    if (!file) {
      throw new BadRequestError(USER_CONSTANTS.ERRORS.AVATAR_NOT_PROVIDED);
    }

    // Получаем текущего пользователя
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, avatar_url: true },
    });

    if (!user) {
      throw new NotFoundError(USER_CONSTANTS.ERRORS.USER_NOT_FOUND);
    }

    try {
      // Удаляем старый аватар, если есть
      if (user.avatar_url) {
        await deleteAvatarFiles(userId, user.avatar_url);
      }

      // Обрабатываем новое изображение
      const ext = path.extname(file.originalname).toLowerCase();
      const processedPaths = await processAvatar(file.buffer!, userId, ext);

      // Генерируем URL для medium размера (по умолчанию)
      // Извлекаем baseName из пути оригинального файла
      const originalFilename = path.basename(processedPaths.original);
      const baseName = path.basename(originalFilename, ext); // original-1234567890-123456789
      const avatarUrl = getAvatarUrl(userId, baseName, ext, 'medium');

      // Обновляем avatar_url в базе данных
      await prisma.user.update({
        where: { id: userId },
        data: { avatar_url: avatarUrl },
      });

      return { avatar_url: avatarUrl };
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestError(error.message);
      }
      throw new BadRequestError(USER_CONSTANTS.ERRORS.AVATAR_UPLOAD_FAILED);
    }
  }

  /**
   * Удалить аватар пользователя
   */
  async deleteAvatar(userId: number): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, avatar_url: true },
    });

    if (!user) {
      throw new NotFoundError(USER_CONSTANTS.ERRORS.USER_NOT_FOUND);
    }

    if (!user.avatar_url) {
      // Аватар уже отсутствует, ничего не делаем
      return;
    }

    try {
      // Удаляем файлы аватара
      await deleteAvatarFiles(userId, user.avatar_url);

      // Обновляем avatar_url в базе данных
      await prisma.user.update({
        where: { id: userId },
        data: { avatar_url: null },
      });
    } catch (error) {
      console.error('Error deleting avatar:', error);
      throw new BadRequestError(USER_CONSTANTS.ERRORS.AVATAR_DELETE_FAILED);
    }
  }
}

// Экспорт singleton экземпляра
export const userService = new UserService();

