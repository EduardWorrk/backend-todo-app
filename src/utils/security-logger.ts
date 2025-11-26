import { Request } from 'express';

/**
 * Утилита для логирования событий безопасности
 */

interface SecurityLog {
  type: 'AUTH_ATTEMPT' | 'AUTH_SUCCESS' | 'AUTH_FAILURE' | 'REGISTRATION' | 'TOKEN_INVALID' | 'TOKEN_EXPIRED';
  message: string;
  metadata?: {
    ip?: string;
    userAgent?: string;
    email?: string;
    login?: string;
    userId?: number;
    reason?: string;
  };
  timestamp: Date;
}

/**
 * Логирование событий безопасности
 */
export class SecurityLogger {
  /**
   * Логирование попытки входа
   */
  static logAuthAttempt(email: string, ip?: string, userAgent?: string): void {
    this.log({
      type: 'AUTH_ATTEMPT',
      message: `Попытка входа: ${email}`,
      metadata: {
        email,
        ip,
        userAgent,
      },
      timestamp: new Date(),
    });
  }

  /**
   * Логирование успешного входа
   */
  static logAuthSuccess(userId: number, email: string, ip?: string, userAgent?: string): void {
    this.log({
      type: 'AUTH_SUCCESS',
      message: `Успешный вход: ${email} (ID: ${userId})`,
      metadata: {
        userId,
        email,
        ip,
        userAgent,
      },
      timestamp: new Date(),
    });
  }

  /**
   * Логирование неудачной попытки входа
   */
  static logAuthFailure(
    email: string,
    reason: 'USER_NOT_FOUND' | 'INVALID_PASSWORD' | 'INVALID_TELEGRAM_CODE',
    ip?: string,
    userAgent?: string
  ): void {
    const reasonTextMap: Record<'USER_NOT_FOUND' | 'INVALID_PASSWORD' | 'INVALID_TELEGRAM_CODE', string> = {
      USER_NOT_FOUND: 'Пользователь не найден',
      INVALID_PASSWORD: 'Неверный пароль',
      INVALID_TELEGRAM_CODE: 'Неверный Telegram-код',
    };
    const reasonText = reasonTextMap[reason];
    
    this.log({
      type: 'AUTH_FAILURE',
      message: `Неудачная попытка входа: ${email} - ${reasonText}`,
      metadata: {
        email,
        reason: reasonText,
        ip,
        userAgent,
      },
      timestamp: new Date(),
    });
  }

  /**
   * Логирование регистрации нового пользователя
   */
  static logRegistration(userId: number, email: string, login: string, ip?: string, userAgent?: string): void {
    this.log({
      type: 'REGISTRATION',
      message: `Регистрация нового пользователя: ${email} (ID: ${userId})`,
      metadata: {
        userId,
        email,
        login,
        ip,
        userAgent,
      },
      timestamp: new Date(),
    });
  }

  /**
   * Логирование невалидного токена
   */
  static logInvalidToken(reason: string, ip?: string, userAgent?: string): void {
    this.log({
      type: 'TOKEN_INVALID',
      message: `Попытка доступа с невалидным токеном: ${reason}`,
      metadata: {
        reason,
        ip,
        userAgent,
      },
      timestamp: new Date(),
    });
  }

  /**
   * Логирование истекшего токена
   */
  static logExpiredToken(ip?: string, userAgent?: string): void {
    this.log({
      type: 'TOKEN_EXPIRED',
      message: 'Попытка доступа с истекшим токеном',
      metadata: {
        ip,
        userAgent,
      },
      timestamp: new Date(),
    });
  }

  /**
   * Внутренний метод для логирования
   */
  private static log(logEntry: SecurityLog): void {
    const logLevel = this.getLogLevel(logEntry.type);
    const formattedMessage = this.formatLogEntry(logEntry);

    // В production можно отправлять в систему мониторинга (Sentry, CloudWatch, etc.)
    if (logLevel === 'ERROR' || logLevel === 'WARN') {
      console.error(`[SECURITY ${logLevel}]`, formattedMessage);
    } else {
      console.log(`[SECURITY ${logLevel}]`, formattedMessage);
    }

    // TODO: В production добавить отправку в систему логирования
    // Например: отправка в файл, базу данных, или внешний сервис
  }

  /**
   * Определение уровня логирования
   */
  private static getLogLevel(type: SecurityLog['type']): 'ERROR' | 'WARN' | 'INFO' {
    switch (type) {
      case 'AUTH_FAILURE':
      case 'TOKEN_INVALID':
      case 'TOKEN_EXPIRED':
        return 'WARN';
      case 'AUTH_SUCCESS':
      case 'REGISTRATION':
        return 'INFO';
      case 'AUTH_ATTEMPT':
        return 'INFO';
      default:
        return 'INFO';
    }
  }

  /**
   * Форматирование записи лога
   */
  private static formatLogEntry(logEntry: SecurityLog): string {
    const timestamp = logEntry.timestamp.toISOString();
    const metadata = logEntry.metadata
      ? ` | ${JSON.stringify(logEntry.metadata)}`
      : '';
    
    return `[${timestamp}] ${logEntry.message}${metadata}`;
  }
}

/**
 * Получение IP адреса из запроса
 */
export function getClientIp(req: Request): string | undefined {
  const xForwardedFor = req.headers['x-forwarded-for'];
  const forwardedIp = Array.isArray(xForwardedFor)
    ? xForwardedFor[0]?.trim()
    : xForwardedFor?.split(',')[0]?.trim();
  
  const realIp = req.headers['x-real-ip'];
  const realIpValue = Array.isArray(realIp) ? realIp[0] : realIp;
  
  return (
    forwardedIp ||
    realIpValue ||
    req.socket?.remoteAddress ||
    req.ip
  );
}

/**
 * Получение User-Agent из запроса
 */
export function getUserAgent(req: Request): string | undefined {
  return req.headers['user-agent'];
}

