import express, { Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import prisma from './db/prisma';
import { initDatabase } from './db/init';
import authRoutes from './routes/auth';
import todosRoutes from './routes/todos';
import usersRoutes from './routes/users';
import goalsRoutes from './routes/goals';
import commentsRoutes from './routes/comments';
import notificationsRoutes from './routes/notifications';
import { errorHandler } from './middleware/error-handler';
import { swaggerSpec } from './config/swagger';
import { USER_CONSTANTS } from './constants/user.constants';

const app = express();
const PORT = process.env.PORT || 3000;

// Настройка CORS
app.use(cors({
  origin: '*', // Разрешить все источники (для разработки)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Раздача статических файлов (аватары)
app.use('/uploads/avatars', express.static(path.join(process.cwd(), USER_CONSTANTS.AVATAR.UPLOAD_PATH)));

// Swagger UI документация
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Todo API Documentation',
}));

// Инициализация базы данных при запуске
initDatabase().catch(console.error);

app.get('/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT NOW()`;
    res.json({ 
      status: 'ok', 
      message: 'Database connected successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Hello from Express!' });
});

// Роуты авторизации
app.use('/', authRoutes);

// Роуты задач
app.use('/todos', todosRoutes);

// Роуты пользователя
app.use('/users', usersRoutes);

// Роуты совместных целей
app.use('/goals', goalsRoutes);

// Роуты комментариев
app.use('/', commentsRoutes);

// Роуты уведомлений
app.use('/notifications', notificationsRoutes);

// Централизованный обработчик ошибок (должен быть последним)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

