# Тестирование WebSocket уведомлений

## Автоматические тесты

Запуск всех тестов WebSocket:

```bash
npm test -- src/__tests__/services/websocket.test.ts
```

Запуск всех тестов:

```bash
npm test
```

## Ручное тестирование

### 1. Запустите сервер

```bash
npm run dev
```

### 2. Получите JWT токен

Зарегистрируйте пользователя или войдите:

```bash
# Регистрация
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{
    "login": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'

# Вход
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Скопируйте `token` из ответа.

### 3. Запустите тестовый скрипт

```bash
npx ts-node scripts/test-websocket.ts <your-jwt-token>
```

Пример:
```bash
npx ts-node scripts/test-websocket.ts eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibG9naW4iOiJ0ZXN0dXNlciIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTYzODU2NzIwMH0...
```

### 4. Создайте уведомление (в другом терминале)

Создайте задачу или комментарий, чтобы сгенерировать уведомление:

```bash
# Создание задачи с назначением
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "name": "Тестовая задача",
    "assigned_to_id": 1
  }'
```

В терминале с WebSocket скриптом вы должны увидеть событие `notification:new`.

## Тестирование через браузер

Откройте консоль браузера и выполните:

```javascript
// Подключение к WebSocket
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token-here'
  }
});

// Слушаем события
socket.on('connect', () => {
  console.log('Подключено:', socket.id);
});

socket.on('connected', (data) => {
  console.log('Connected event:', data);
});

socket.on('notification:new', (data) => {
  console.log('Новое уведомление:', data);
});

socket.on('notification:read', (data) => {
  console.log('Уведомление прочитано:', data);
});

socket.on('notification:all_read', (data) => {
  console.log('Все уведомления прочитаны:', data);
});
```

## Проверка событий

### События, которые отправляет сервер:

1. **`connected`** - при успешном подключении
   ```json
   {
     "message": "Connected to notification service",
     "userId": 1
   }
   ```

2. **`notification:new`** - новое уведомление
   ```json
   {
     "notification": {
       "id": 1,
       "user_id": 1,
       "type": "task_assigned",
       "title": "Вам назначена задача",
       "message": "Вам назначена задача \"Название задачи\"",
       "related_task_id": null,
       "related_goal_id": null,
       "is_read": false,
       "created_at": "2025-01-18T12:00:00.000Z"
     }
   }
   ```

3. **`notification:read`** - уведомление прочитано
   ```json
   {
     "notification_id": 1
   }
   ```

4. **`notification:all_read`** - все уведомления прочитаны
   ```json
   {
     "user_id": 1
   }
   ```

## Устранение проблем

### Ошибка "Authentication token is required"
- Убедитесь, что передаете токен в параметре `auth.token`
- Проверьте, что токен не истек

### Ошибка "Invalid token"
- Проверьте правильность JWT токена
- Убедитесь, что используется правильный `JWT_SECRET`

### Не приходят уведомления
- Проверьте, что пользователь подключен (событие `connected`)
- Убедитесь, что уведомление создается для правильного `user_id`
- Проверьте логи сервера на наличие ошибок

