import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Todo API',
      version: '1.0.0',
      description: 'API для управления задачами (Todo) с аутентификацией',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3000}`,
        description: process.env.SERVER_URL ? 'Production server' : 'Development server',
      },
      // Добавляем localhost для разработки, если указан SERVER_URL
      ...(process.env.SERVER_URL ? [{
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Development server (localhost)',
      }] : []),
    ],
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
            avatar_url: {
              type: 'string',
              nullable: true,
              example: '/uploads/avatars/1/original-1234567890-medium.jpg',
              description: 'URL аватара пользователя',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2025-11-10T12:00:00.000Z',
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
            assigned_to: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'integer' },
                login: { type: 'string' },
                email: { type: 'string' },
              },
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
            assigned_to_id: {
              type: 'integer',
              nullable: true,
              example: 2,
            },
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
            content: { type: 'string' },
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
        name: 'Notifications',
        description: 'Эндпоинты для управления уведомлениями',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/index.ts'], // Пути к файлам с JSDoc комментариями
};

export const swaggerSpec = swaggerJsdoc(options);

