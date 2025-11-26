# Backend Todo API

Backend API для управления задачами с поддержкой WebSocket уведомлений в реальном времени.

## Возможности

- 🔐 Аутентификация через JWT (email/password или Telegram)
- 📱 Авторизация через Telegram Bot API с кодами
- ✅ Управление задачами (создание, обновление, удаление)
- 🏷️ Глобальные категории задач (создание, просмотр, удаление)
- 👥 Совместные цели и задачи
- 💬 Комментарии к задачам
- 🔔 WebSocket уведомления в реальном времени
- 📊 Swagger API документация

## Быстрый старт

### Установка и запуск

```bash
# Установка зависимостей
npm install

# Запуск базы данных (Docker)
docker-compose up -d db

# Применение миграций
npm run prisma:migrate

# Запуск сервера (разработка)
npm run dev

# Запуск сервера (продакшн)
npm run build
npm start
```

Сервер будет доступен по адресу: `http://localhost:3000`

## API Документация

Swagger UI доступен по адресу: `http://localhost:3000/api-docs`

## Авторизация через Telegram

API поддерживает авторизацию через Telegram Bot API. Пользователь получает код в Telegram и использует его для входа.

### Настройка Telegram бота

1. Создайте бота через [@BotFather](https://t.me/BotFather) в Telegram
2. Получите токен бота
3. Добавьте токен в переменные окружения:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_AUTH_CODE_EXPIRY_MINUTES=2  # Опционально, по умолчанию 2 минуты
```

### Процесс авторизации

1. **Нажмите `/start` в Telegram-боте**
   - бот автоматически сохранит ваш Telegram ID и сразу пришлёт 6-значный код
   - в сообщении бот покажет ваш ID только для информации — вводить его на фронте не нужно

2. **Вход с кодом (без Telegram ID):**
   ```bash
   POST /auth/telegram/login
   Content-Type: application/json
   
   {
     "code": "123456"
   }
   ```
   
   В ответе вы получите JWT токен и данные пользователя. Поле `telegram_id` можно передавать опционально (для обратной совместимости или если вы хотите запросить код вручную).

3. **(Опционально) Ручной запрос кода:**
   Если нужно повторно отправить код без команды `/start`, можно вызвать:
   ```bash
   POST /auth/telegram/request-code
   Content-Type: application/json
   
   {
     "telegram_id": 123456789
   }
   ```
   Бот отправит новый код на указанный Telegram ID.

### Особенности

- Код действителен 2 минуты (настраивается через `TELEGRAM_AUTH_CODE_EXPIRY_MINUTES`)
- Каждый код можно использовать только один раз
- При первом входе создается новый пользователь с логином `telegram_{telegram_id}` и временным email
- Авторизация через Telegram дополняет стандартную авторизацию (email/password)

## Категории задач

Категории видны всем пользователям. Создайте их один раз и привязывайте к задачам через поле `category_id`.

- `GET /categories` — список всех категорий (требуется авторизация)
- `POST /categories` — создать категорию (`name`, опционально `color` в формате HEX)
- `DELETE /categories/{id}` — удалить категорию без привязанных задач

Чтобы связать задачу с категорией, передайте `category_id` в запросах `POST /todos` или `PUT /todos/{id}`.

## WebSocket уведомления

### Подключение к WebSocket серверу

Для работы с уведомлениями в реальном времени используйте **socket.io-client**.

#### Установка

```bash
npm install socket.io-client
```

#### Пример подключения (JavaScript/TypeScript)

```javascript
import { io } from 'socket.io-client';

// URL вашего backend сервера
const SERVER_URL = 'http://localhost:3000';

// Подключение с JWT токеном
const socket = io(SERVER_URL, {
  auth: {
    token: 'your-jwt-token-here' // Токен, полученный при авторизации
  },
  transports: ['websocket'], // Используем только WebSocket
});

// Обработка успешного подключения
socket.on('connect', () => {
  console.log('✅ Подключено к WebSocket серверу');
  console.log('Socket ID:', socket.id);
});

// Получение подтверждения подключения от сервера
socket.on('connected', (data) => {
  console.log('Подключение подтверждено:', data);
  // data = { message: 'Connected to notification service', userId: 1 }
});

// Обработка ошибок подключения
socket.on('connect_error', (error) => {
  console.error('❌ Ошибка подключения:', error.message);
  // Возможные ошибки:
  // - "Authentication token is required" - не передан токен
  // - "Invalid token" - невалидный токен
  // - "Token expired" - токен истек
});

// Обработка отключения
socket.on('disconnect', (reason) => {
  console.log('🔌 Отключено от сервера:', reason);
});
```

### События уведомлений

#### 1. Новое уведомление (`notification:new`)

Срабатывает при создании нового уведомления для пользователя.

```javascript
socket.on('notification:new', (data) => {
  const { notification } = data;
  
  console.log('🔔 Новое уведомление:', notification);
  
  // Структура notification:
  // {
  //   id: 1,
  //   user_id: 1,
  //   type: 'task_assigned',
  //   title: 'Вам назначена задача',
  //   message: 'Вам назначена задача "Название задачи"',
  //   related_task_id: 123,
  //   related_goal_id: null,
  //   is_read: false,
  //   created_at: '2025-01-18T12:00:00.000Z'
  // }
  
  // Обновите UI с новым уведомлением
  addNotificationToUI(notification);
  showNotificationBadge();
});
```

#### 2. Уведомление прочитано (`notification:read`)

Срабатывает при прочтении конкретного уведомления.

```javascript
socket.on('notification:read', (data) => {
  const { notification_id } = data;
  
  console.log('✅ Уведомление прочитано:', notification_id);
  
  // Обновите статус уведомления в UI
  markNotificationAsRead(notification_id);
});
```

#### 3. Все уведомления прочитаны (`notification:all_read`)

Срабатывает при прочтении всех уведомлений пользователя.

```javascript
socket.on('notification:all_read', (data) => {
  const { user_id } = data;
  
  console.log('✅ Все уведомления прочитаны для пользователя:', user_id);
  
  // Обновите UI - все уведомления помечены как прочитанные
  markAllNotificationsAsRead();
  hideNotificationBadge();
});
```

### Типы уведомлений

Доступные типы уведомлений:

- `task_assigned` - Вам назначена задача
- `task_completed` - Задача завершена
- `task_updated` - Задача обновлена
- `comment_added` - Добавлен комментарий к задаче
- `goal_invited` - Вас пригласили в совместную цель
- `goal_updated` - Цель обновлена
- `member_added` - Добавлен участник в цель
- `member_removed` - Удален участник из цели

### Полный пример React компонента

```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  related_task_id: number | null;
  related_goal_id: number | null;
  is_read: boolean;
  created_at: string;
}

export const useWebSocketNotifications = (token: string | null) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const newSocket = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('WebSocket подключен');
      setIsConnected(true);
    });

    newSocket.on('connected', (data) => {
      console.log('Подключение подтверждено:', data);
    });

    newSocket.on('notification:new', (data) => {
      const { notification } = data;
      setNotifications((prev) => [notification, ...prev]);
      
      // Показать уведомление в UI
      showBrowserNotification(notification);
    });

    newSocket.on('notification:read', (data) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === data.notification_id ? { ...n, is_read: true } : n
        )
      );
    });

    newSocket.on('notification:all_read', () => {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket отключен');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Ошибка подключения:', error.message);
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token]);

  return { socket, notifications, isConnected };
};

// Вспомогательная функция для показа браузерных уведомлений
const showBrowserNotification = (notification: Notification) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(notification.title, {
      body: notification.message,
      icon: '/notification-icon.png',
    });
  }
};
```

### Обработка переподключения

Socket.io автоматически переподключается при разрыве соединения. Вы можете отслеживать это:

```javascript
socket.on('reconnect', (attemptNumber) => {
  console.log('🔄 Переподключено после', attemptNumber, 'попыток');
});

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log('🔄 Попытка переподключения #', attemptNumber);
});

socket.on('reconnect_error', (error) => {
  console.error('❌ Ошибка переподключения:', error);
});

socket.on('reconnect_failed', () => {
  console.error('❌ Не удалось переподключиться');
});
```

### Отключение от сервера

```javascript
// Закрыть соединение
socket.disconnect();

// Или
socket.close();
```

### Проверка статуса подключения

```javascript
// Проверить, подключен ли сокет
if (socket.connected) {
  console.log('Сокет подключен');
}

// Получить ID сокета
console.log('Socket ID:', socket.id);
```

## Интеграция с API

### Получение JWT токена

```javascript
// Пример авторизации через API
const login = async (email, password) => {
  const response = await fetch('http://localhost:3000/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  
  if (data.status === 'success') {
    const token = data.token;
    
    // Сохраните токен (localStorage, cookie, etc.)
    localStorage.setItem('authToken', token);
    
    // Подключитесь к WebSocket с токеном
    connectWebSocket(token);
    
    return token;
  }
};
```

### Обновление токена

Если токен истекает, нужно переподключиться с новым токеном:

```javascript
const refreshToken = async () => {
  // Получите новый токен через API
  const newToken = await getNewToken();
  
  // Отключите старое соединение
  if (socket) {
    socket.disconnect();
  }
  
  // Подключитесь с новым токеном
  connectWebSocket(newToken);
};
```

## Безопасность

1. **Всегда используйте HTTPS в продакшене** - WebSocket соединения должны быть защищены
2. **Храните токен безопасно** - не передавайте токен в URL или публичных местах
3. **Обновляйте токен при истечении** - реализуйте механизм обновления токена
4. **Обрабатывайте ошибки аутентификации** - перенаправляйте на страницу входа при ошибках

## Примеры использования

### Vue.js

```vue
<template>
  <div>
    <div v-if="isConnected">🟢 Подключено</div>
    <div v-else>🔴 Отключено</div>
    
    <div v-for="notification in notifications" :key="notification.id">
      {{ notification.title }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';

const socket = ref(null);
const notifications = ref([]);
const isConnected = ref(false);

onMounted(() => {
  const token = localStorage.getItem('authToken');
  
  socket.value = io('http://localhost:3000', {
    auth: { token },
    transports: ['websocket'],
  });

  socket.value.on('connect', () => {
    isConnected.value = true;
  });

  socket.value.on('notification:new', (data) => {
    notifications.value.unshift(data.notification);
  });
});

onUnmounted(() => {
  if (socket.value) {
    socket.value.disconnect();
  }
});
</script>
```

### Angular

```typescript
import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private socket: Socket | null = null;
  private notifications$ = new BehaviorSubject<any[]>([]);
  private isConnected$ = new BehaviorSubject<boolean>(false);

  connect(token: string): void {
    this.socket = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      this.isConnected$.next(true);
    });

    this.socket.on('notification:new', (data) => {
      const current = this.notifications$.value;
      this.notifications$.next([data.notification, ...current]);
    });
  }

  getNotifications(): Observable<any[]> {
    return this.notifications$.asObservable();
  }

  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
```

## Устранение проблем

### Сокет не подключается

1. Проверьте, что сервер запущен
2. Убедитесь, что токен валидный и не истек
3. Проверьте CORS настройки на сервере
4. Проверьте консоль браузера на ошибки

### Уведомления не приходят

1. Убедитесь, что сокет подключен (`socket.connected === true`)
2. Проверьте, что вы подписаны на событие `notification:new`
3. Убедитесь, что уведомление создается для правильного `user_id`
4. Проверьте логи сервера

### Ошибка "Authentication token is required"

- Убедитесь, что передаете токен в `auth.token`
- Проверьте, что токен не пустой

### Ошибка "Invalid token"

- Проверьте правильность JWT токена
- Убедитесь, что токен не истек
- Получите новый токен через API

## Дополнительные ресурсы

- [Socket.io Client Documentation](https://socket.io/docs/v4/client-api/)
- [WebSocket Testing Guide](./WEBSOCKET_TESTING.md)
- [API Documentation](http://localhost:3000/api-docs)

## Лицензия

ISC

