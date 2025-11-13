import express, { Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
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

const app = express();
const PORT = process.env.PORT || 3000;

// Настройка CORS
app.use(cors({
  origin: '*', // Разрешить все источники (для разработки)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

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

// Endpoint для диагностики Swagger
app.get('/api-docs/info', (req: Request, res: Response) => {
  const spec = swaggerSpec as any; // Type assertion для доступа к paths и tags
  const pathsCount = Object.keys(spec.paths || {}).length;
  const tagsCount = spec.tags?.length || 0;
  const paths = Object.keys(spec.paths || {});
  
  res.json({
    status: 'ok',
    swagger: {
      pathsCount,
      tagsCount,
      paths: paths.slice(0, 20), // Первые 20 путей
      allPaths: paths,
      hasPaths: pathsCount > 0,
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      SERVER_URL: process.env.SERVER_URL,
      PORT: process.env.PORT,
      cwd: process.cwd(),
    },
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  const spec = swaggerSpec as any; // Type assertion для доступа к paths
  const pathsCount = Object.keys(spec.paths || {}).length;
  console.log(`[Swagger] Swagger spec loaded: ${pathsCount} paths`);
  if (pathsCount === 0) {
    console.error('[Swagger] WARNING: Swagger spec is empty! Check /api-docs/info for details');
  }
});

