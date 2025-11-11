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
        url: 'http://localhost:3000',
        description: 'Development server',
      },
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
    ],
  },
  apis: ['./src/routes/*.ts', './src/index.ts'], // Пути к файлам с JSDoc комментариями
};

export const swaggerSpec = swaggerJsdoc(options);

