import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { TypedSocket, SocketUser } from '../types/socket.types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Middleware для аутентификации WebSocket соединений
 * Проверяет JWT токен из handshake и сохраняет данные пользователя в socket.data
 */
export const authenticateSocket = async (socket: TypedSocket, next: (err?: Error) => void) => {
  try {
    // Извлекаем токен из query параметров или auth объекта
    const token = 
      (socket.handshake.auth?.token as string) || 
      (socket.handshake.query?.token as string) ||
      null;

    if (!token) {
      return next(new Error('Authentication token is required'));
    }

    // Валидируем токен
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; login: string; email: string };
    
    // Сохраняем данные пользователя в socket.data
    socket.data.userId = decoded.id;
    socket.data.user = {
      id: decoded.id,
      login: decoded.login,
      email: decoded.email,
    } as SocketUser;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new Error('Token expired'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      return next(new Error('Invalid token'));
    }
    return next(new Error('Authentication failed'));
  }
};

