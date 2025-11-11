import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { SecurityLogger, getClientIp, getUserAgent } from '../utils/security-logger';

// Расширяем интерфейс Request для добавления user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        login: string;
        email: string;
      };
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware для проверки JWT токена
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Access token is required'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; login: string; email: string };
    req.user = decoded;
    next();
  } catch (error) {
    const ip = getClientIp(req);
    const userAgent = getUserAgent(req);

    // Логирование ошибок токена
    if (error instanceof jwt.TokenExpiredError) {
      SecurityLogger.logExpiredToken(ip, userAgent);
      return res.status(403).json({
        status: 'error',
        message: 'Token expired'
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      SecurityLogger.logInvalidToken(error.message, ip, userAgent);
      return res.status(403).json({
        status: 'error',
        message: 'Invalid token'
      });
    }

    SecurityLogger.logInvalidToken('Unknown token error', ip, userAgent);
    return res.status(403).json({
      status: 'error',
      message: 'Invalid or expired token'
    });
  }
};

export default authenticateToken;

