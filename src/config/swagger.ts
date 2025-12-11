import { existsSync, readdirSync } from 'fs';
import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';

const baseDir = process.cwd();

// Определяем, TS или JS проекта
const isTs = existsSync(path.join(baseDir, 'src'));
const routesDir = isTs
  ? path.join(baseDir, 'src', 'routes')
  : path.join(baseDir, 'dist', 'routes');

const indexPath = isTs
  ? path.join(baseDir, 'src', 'index.ts')
  : path.join(baseDir, 'dist', 'index.js');

let apiPaths: string[] = [];

if (existsSync(routesDir)) {
  const routeFiles = readdirSync(routesDir)
    .filter(f => f.endsWith(isTs ? '.ts' : '.js'))
    .map(f => path.join(routesDir, f));

  apiPaths.push(...routeFiles);
} else {
  console.error('[Swagger] Routes directory not found:', routesDir);
}

if (existsSync(indexPath)) {
  apiPaths.push(indexPath);
}

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Todo API',
      version: '1.0.0',
      description: `API для управления задачами (Todo) с аутентификацией и WebSocket уведомлениями в реальном времени.

## WebSocket уведомления

Для тестирования WebSocket используйте специальную страницу: [WebSocket Tester](/websocket-test.html)

### Подключение к WebSocket:

\`\`\`javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token-here'
  }
});
\`\`\`

### События:
- \`connected\` - подтверждение подключения
- \`notification:new\` - новое уведомление
- \`notification:read\` - уведомление прочитано
- \`notification:all_read\` - все уведомления прочитаны`,
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: process.env.SERVER_URL || `http://localhost:${process.env.HOST_PORT || process.env.PORT || 3002}`,
        description: process.env.SERVER_URL ? 'Production server' : 'Development server',
      },
      // Добавляем localhost для разработки, если указан SERVER_URL
      ...(process.env.SERVER_URL ? [{
        url: `http://localhost:${process.env.HOST_PORT || process.env.PORT || 3002}`,
        description: 'Development server (localhost)',
      }] : []),
    ],
    // Убеждаемся, что пути всегда относительные (Swagger UI добавит базовый URL)
    // Это стандартное поведение OpenAPI - пути должны быть относительными
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Введите JWT токен, полученный при авторизации',
        },
      },
      schemas: {
        // Auth Schemas
        RegisterRequest: {
          type: 'object',
          required: ['login', 'email', 'password'],
          properties: {
            login: {
              type: 'string',
              minLength: 1,
              maxLength: 255,
              example: 'johndoe',
              description: 'Уникальное имя пользователя',
            },
            email: {
              type: 'string',
              format: 'email',
              maxLength: 255,
              example: 'john@example.com',
              description: 'Email адрес пользователя',
            },
            password: {
              type: 'string',
              minLength: 6,
              example: 'password123',
              description: 'Пароль (минимум 6 символов)',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
              description: 'Email адрес пользователя',
            },
            password: {
              type: 'string',
              example: 'password123',
              description: 'Пароль пользователя',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            login: {
              type: 'string',
              example: 'johndoe',
            },
            email: {
              type: 'string',
              example: 'john@example.com',
            },
            telegram_id: {
              type: 'integer',
              nullable: true,
              example: 123456789,
              description: 'Telegram ID пользователя (если авторизован через Telegram)',
            },
            avatar_url: {
              type: 'string',
              nullable: true,
              example: 'https://api.telegram.org/file/bot<token>/photos/file_0.jpg',
              description: 'Ссылка на аватар Telegram (если доступен)',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2025-11-10T12:00:00.000Z',
              description: 'Дата создания задачи (можно задать вручную при создании/обновлении)',
            },
          },
        },
        RequestTelegramCodeRequest: {
          type: 'object',
          required: ['telegram_id'],
          properties: {
            telegram_id: {
              type: 'integer',
              example: 123456789,
              description: 'Telegram ID пользователя',
            },
          },
        },
        TelegramLoginRequest: {
          type: 'object',
          required: ['code'],
          properties: {
            telegram_id: {
              type: 'integer',
              example: 123456789,
              description: 'Telegram ID пользователя (опционально — вводить не обязательно)',
            },
            code: {
              type: 'string',
              pattern: '^\\d{4}$',
              example: '1234',
              description: '4-значный код авторизации, полученный в Telegram',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success',
            },
            message: {
              type: 'string',
              example: 'User registered successfully',
            },
            token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              description: 'JWT токен для аутентификации',
            },
            user: {
              $ref: '#/components/schemas/User',
            },
          },
        },
        GigaChatMessage: {
          type: 'object',
          properties: {
            role: {
              type: 'string',
              enum: ['system', 'user', 'assistant'],
              example: 'user',
            },
            content: {
              type: 'string',
              example: 'что ты умеешь?',
            },
          },
        },
        SendGigaChatMessageRequest: {
          type: 'object',
          properties: {
            model: {
              type: 'string',
              example: 'GigaChat-2-Max',
              description: 'Модель GigaChat (обязательное поле)',
            },
            message: {
              type: 'string',
              example: 'что ты умеешь?',
              description: 'Простое сообщение пользователя. Если указано, массив messages можно не передавать.',
            },
            messages: {
              type: 'array',
              description: 'Полная история общения в формате OpenAI/GigaChat',
              items: {
                $ref: '#/components/schemas/GigaChatMessage',
              },
            },
            temperature: {
              type: 'number',
              minimum: 0,
              maximum: 2,
              example: 0.3,
            },
            top_p: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              example: 0.9,
            },
          },
          required: ['model'],
        },
        GigaChatChoice: {
          type: 'object',
          properties: {
            index: {
              type: 'integer',
              example: 0,
            },
            message: {
              $ref: '#/components/schemas/GigaChatMessage',
            },
            finish_reason: {
              type: 'string',
              nullable: true,
              example: 'stop',
            },
          },
        },
        GigaChatUsage: {
          type: 'object',
          properties: {
            prompt_tokens: {
              type: 'integer',
              example: 25,
            },
            completion_tokens: {
              type: 'integer',
              example: 140,
            },
            total_tokens: {
              type: 'integer',
              example: 165,
            },
          },
        },
        GigaChatResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success',
            },
            message: {
              type: 'string',
              example: 'Ответ получен от GigaChat',
            },
            data: {
              type: 'object',
              properties: {
                reply: {
                  type: 'string',
                  example: 'Я виртуальный ассистент GigaChat...',
                },
                model: {
                  type: 'string',
                  example: 'GigaChat-2-Max',
                },
                choices: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/GigaChatChoice',
                  },
                },
                usage: {
                  $ref: '#/components/schemas/GigaChatUsage',
                },
              },
            },
          },
        },
        // Todo Schemas
        Task: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            user_id: {
              type: 'integer',
              example: 1,
            },
            name: {
              type: 'string',
              example: 'Купить молоко',
              description: 'Название задачи',
            },
            description: {
              type: 'string',
              nullable: true,
              example: 'Купить молоко в магазине',
              description: 'Описание задачи',
            },
            status: {
              type: 'string',
              enum: ['pending', 'in_progress', 'completed'],
              example: 'pending',
              description: 'Статус задачи',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              nullable: true,
              example: 'medium',
              description: 'Приоритет задачи',
            },
            task_time: {
              type: 'string',
              nullable: true,
              pattern: '^([01]\\d|2[0-3])\\.[0-5]\\d$',
              example: '14.30',
              description: 'Время задачи в формате HH.MM',
            },
            completed_at: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              example: '2025-11-10T12:00:00.000Z',
            },
            assigned_to_id: {
              type: 'integer',
              nullable: true,
              example: 2,
              description: 'ID назначенного исполнителя',
            },
            shared_goal_id: {
              type: 'integer',
              nullable: true,
              example: 1,
              description: 'ID совместной цели',
            },
            category_id: {
              type: 'integer',
              nullable: true,
              example: 2,
              description: 'ID категории задачи',
            },
            assigned_to: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'integer' },
                login: { type: 'string' },
                email: { type: 'string' },
              },
            },
            category: {
              $ref: '#/components/schemas/Category',
              nullable: true,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2025-11-10T12:00:00.000Z',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              example: '2025-11-10T12:00:00.000Z',
            },
          },
        },
        PublicTask: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Купить молоко' },
            description: { type: 'string', nullable: true, example: 'Купить молоко в магазине' },
            status: { type: 'string', example: 'pending' },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              nullable: true,
              example: 'medium',
            },
            task_time: { type: 'string', nullable: true, example: '09.30' },
            category: {
              $ref: '#/components/schemas/Category',
              nullable: true,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2025-11-10T12:00:00.000Z',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              example: '2025-11-10T12:00:00.000Z',
            },
          },
        },
        CreateTaskRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'string',
              example: 'Купить молоко',
              description: 'Название задачи (обязательное поле)',
            },
            description: {
              type: 'string',
              nullable: true,
              example: 'Купить молоко в магазине',
              description: 'Описание задачи (опциональное)',
            },
            status: {
              type: 'string',
              enum: ['pending', 'in_progress', 'completed'],
              example: 'pending',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              nullable: true,
              example: 'medium',
            },
            task_time: {
              type: 'string',
              nullable: true,
              pattern: '^([01]\\d|2[0-3])\\.[0-5]\\d$',
              example: '09.15',
            },
            shared_goal_id: {
              type: 'integer',
              nullable: true,
              example: 1,
            },
            assigned_to_id: {
              type: 'integer',
              nullable: true,
              example: 2,
            },
            category_id: {
              type: 'integer',
              nullable: true,
              example: 1,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              example: '2025-11-10T12:00:00.000Z',
              description: 'Опционально задать дату создания',
            },
          },
        },
        UpdateTaskRequest: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              example: 'Купить молоко и хлеб',
              description: 'Новое название задачи',
            },
            description: {
              type: 'string',
              nullable: true,
              example: 'Купить молоко и хлеб в магазине',
              description: 'Новое описание задачи',
            },
            status: {
              type: 'string',
              enum: ['pending', 'in_progress', 'completed'],
              example: 'in_progress',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              nullable: true,
              example: 'low',
            },
            task_time: {
              type: 'string',
              nullable: true,
              pattern: '^([01]\\d|2[0-3])\\.[0-5]\\d$',
              example: '18.45',
            },
            assigned_to_id: {
              type: 'integer',
              nullable: true,
              example: 2,
            },
            category_id: {
              type: 'integer',
              nullable: true,
              example: 1,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              example: '2025-11-09T09:00:00.000Z',
              description: 'Опционально изменить дату создания',
            },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Работа' },
            color: { type: 'string', nullable: true, example: '#FF0000' },
            created_by: { type: 'integer', nullable: true, example: 1 },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        CreateCategoryRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'string',
              maxLength: 120,
              example: 'Учеба',
              description: 'Название категории',
            },
            color: {
              type: 'string',
              nullable: true,
              example: '#123456',
              description: 'HEX код цвета (#RRGGBB или #RGB)',
            },
          },
        },
        CategoriesResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            categories: {
              type: 'array',
              items: { $ref: '#/components/schemas/Category' },
            },
          },
        },
        CategoryResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            message: { type: 'string', example: 'Категория успешно создана' },
            category: { $ref: '#/components/schemas/Category' },
          },
        },
        DeleteCategoryResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            message: { type: 'string', example: 'Категория успешно удалена' },
          },
        },
        // Goal Schemas
        Goal: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Организовать корпоратив' },
            description: { type: 'string', nullable: true, example: 'Подготовить мероприятие' },
            owner_id: { type: 'integer', example: 1 },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        GoalMember: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            goal_id: { type: 'integer' },
            user_id: { type: 'integer' },
            role: { type: 'string', enum: ['owner', 'admin', 'member'] },
            joined_at: { type: 'string', format: 'date-time' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        CreateGoalRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'Организовать корпоратив' },
            description: { type: 'string', nullable: true },
            member_ids: { type: 'array', items: { type: 'integer' } },
          },
        },
        UpdateGoalRequest: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
          },
        },
        InviteMemberRequest: {
          type: 'object',
          properties: {
            user_id: { type: 'integer', example: 2 },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
          },
        },
        GoalsResponse: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            goals: { type: 'array', items: { $ref: '#/components/schemas/Goal' } },
          },
        },
        GoalResponse: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' },
            goal: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
                description: { type: 'string', nullable: true },
                owner_id: { type: 'integer' },
                created_at: { type: 'string', format: 'date-time' },
                updated_at: { type: 'string', format: 'date-time' },
                members: { type: 'array', items: { $ref: '#/components/schemas/GoalMember' } },
                tasks_count: { type: 'integer' },
                completed_tasks_count: { type: 'integer' },
              },
            },
          },
        },
        GoalMembersResponse: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            members: { type: 'array', items: { $ref: '#/components/schemas/GoalMember' } },
          },
        },
        // Comment Schemas
        Comment: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            task_id: { type: 'integer' },
            user_id: { type: 'integer' },
            content: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        CreateCommentRequest: {
          type: 'object',
          required: ['content'],
          properties: {
            content: { type: 'string', example: 'Отличная идея!' },
          },
        },
        UpdateCommentRequest: {
          type: 'object',
          required: ['content'],
          properties: {
            content: { type: 'string', example: 'Обновленный текст комментария' },
          },
        },
        CommentsResponse: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            comments: { type: 'array', items: { $ref: '#/components/schemas/Comment' } },
          },
        },
        CommentResponse: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' },
            comment: { $ref: '#/components/schemas/Comment' },
          },
        },
        DeleteCommentResponse: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' },
          },
        },
        // Notification Schemas
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            type: { type: 'string' },
            title: { type: 'string' },
            message: { type: 'string' },
            related_task_id: { type: 'integer', nullable: true },
            related_goal_id: { type: 'integer', nullable: true },
            is_read: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        NotificationsResponse: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            notifications: { type: 'array', items: { $ref: '#/components/schemas/Notification' } },
          },
        },
        NotificationResponse: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' },
            notification: { $ref: '#/components/schemas/Notification' },
          },
        },
        UnreadCountResponse: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            count: { type: 'integer' },
          },
        },
        TasksResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success',
            },
            tasks: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Task',
              },
            },
          },
        },
        TaskResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success',
            },
            message: {
              type: 'string',
              example: 'Task created successfully',
            },
            task: {
              $ref: '#/components/schemas/Task',
            },
          },
        },
        PublicTaskResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            task: { $ref: '#/components/schemas/PublicTask' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error',
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            error: {
              type: 'string',
              example: 'Detailed error message (only in development)',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  path: {
                    type: 'string',
                    example: 'email',
                  },
                  message: {
                    type: 'string',
                    example: 'Invalid email format',
                  },
                },
              },
              description: 'Validation errors (only for validation errors)',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Auth',
        description: 'Эндпоинты для аутентификации и регистрации',
      },
      {
        name: 'Todos',
        description: 'Эндпоинты для управления задачами',
      },
      {
        name: 'Users',
        description: 'Эндпоинты для управления профилем пользователя',
      },
      {
        name: 'Goals',
        description: 'Эндпоинты для управления совместными целями',
      },
      {
        name: 'Comments',
        description: 'Эндпоинты для управления комментариями к задачам',
      },
      {
        name: 'Categories',
        description: 'Эндпоинты для управления категориями задач',
      },
      {
        name: 'Notifications',
        description: 'Эндпоинты для управления уведомлениями и WebSocket подключения',
      },
      {
        name: 'AI',
        description: 'Эндпоинты для работы с GigaChat',
      },
    ],
  },
  apis: apiPaths, // Пути к файлам с JSDoc комментариями
};

let swaggerSpec: any;
try {
  swaggerSpec = swaggerJsdoc(options);
  
  // Логируем результат генерации
  const spec = swaggerSpec as any; // Type assertion для доступа к paths и tags
  const pathsCount = Object.keys(spec.paths || {}).length;
  const tagsCount = spec.tags?.length || 0;
  console.log(`[Swagger] Generated spec: ${pathsCount} paths, ${tagsCount} tags`);
  
  if (pathsCount === 0) {
    console.error('[Swagger] WARNING: No paths found in Swagger spec!');
    console.error('[Swagger] This usually means JSDoc comments were not found in route files.');
    console.error('[Swagger] Check if route files contain @swagger JSDoc comments.');
    console.error('[Swagger] API paths used:', apiPaths);
    console.error('[Swagger] Full spec keys:', Object.keys(spec));
  } else {
    const paths = Object.keys(spec.paths || {});
    console.log('[Swagger] Available paths:', paths.slice(0, 10).join(', '), paths.length > 10 ? '...' : '');
  }
} catch (error) {
  console.error('[Swagger] ERROR generating spec:', error);
  // Создаем пустой spec в случае ошибки
  swaggerSpec = {
    openapi: '3.0.0',
    info: {
      title: 'Todo API',
      version: '1.0.0',
    },
    paths: {},
  };
}

export { swaggerSpec };

