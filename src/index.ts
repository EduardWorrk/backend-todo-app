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
import categoriesRoutes from './routes/categories';
import aiRoutes from './routes/ai';
import { errorHandler } from './middleware/error-handler';
import { swaggerSpec } from './config/swagger';
import { websocketService } from './services/websocket.service';
import { Server as HTTPServer } from 'http';

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

// Статические файлы (для WebSocket тестера)
app.use(express.static('public'));

// Swagger UI документация
const swaggerUiOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Todo API Documentation',
  swaggerOptions: {
    persistAuthorization: true, // Сохранять авторизацию при перезагрузке
    displayRequestDuration: true, // Показывать время выполнения запросов
    // Убеждаемся, что Swagger UI использует правильный базовый URL
    url: undefined, // Используем spec из объекта, а не из URL
    // Если нужно явно указать сервер по умолчанию
    ...(process.env.SERVER_URL ? {
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
    } : {}),
  },
};

// Настройка Swagger UI - правильный синтаксис
app.use('/api-docs', ...swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

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
  res.json({ 
    message: 'Hello from Express!',
    apiDocs: '/api-docs',
    websocketTest: '/websocket-test.html'
  });
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

// Роуты категорий
app.use('/categories', categoriesRoutes);

// Роуты для интеграций с ИИ
app.use('/ai', aiRoutes);

// Централизованный обработчик ошибок (должен быть последним)
app.use(errorHandler);

// Endpoint для получения сырой Swagger спецификации (JSON)
app.get('/api-docs.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(swaggerSpec);
});

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
      servers: spec.servers || [],
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      SERVER_URL: process.env.SERVER_URL,
      PORT: process.env.PORT,
      cwd: process.cwd(),
    },
  });
});

// Создаем HTTP сервер для интеграции с socket.io
const server: HTTPServer = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  const spec = swaggerSpec as any; // Type assertion для доступа к paths
  const pathsCount = Object.keys(spec.paths || {}).length;
  console.log(`[Swagger] Swagger spec loaded: ${pathsCount} paths`);
  if (pathsCount === 0) {
    console.error('[Swagger] WARNING: Swagger spec is empty! Check /api-docs/info for details');
  }
});

// Инициализация WebSocket сервиса
websocketService.initialize(server);

