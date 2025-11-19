# Инструкция по деплою на сервер

## Подготовка к деплою

### 1. Проверка изменений

Перед деплоем убедитесь, что все изменения закоммичены:

```bash
# Проверить статус
git status

# Добавить все изменения
git add .

# Закоммитить
git commit -m "Описание изменений"

# Отправить в репозиторий
git push origin master
# или
git push origin main
```

### 2. Подготовка переменных окружения

Убедитесь, что на сервере есть файл `.env` с правильными настройками:

```env
# Database Configuration
DB_HOST=db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_NAME=todo_db

# Prisma Database URL
DATABASE_URL=postgresql://postgres:your_secure_password@db:5432/todo_db

# Server Configuration
PORT=3000
SERVER_URL=http://your-server-ip:3001

# JWT Secret (ОБЯЗАТЕЛЬНО измените в продакшене!)
JWT_SECRET=your-very-secure-secret-key-change-this
NODE_ENV=production
```

## Варианты деплоя

### Вариант 1: Деплой через Docker Compose (рекомендуется)

#### На сервере:

1. **Подключитесь к серверу по SSH:**
   ```bash
   ssh user@your-server-ip
   ```

2. **Перейдите в директорию проекта:**
   ```bash
   cd /path/to/backend-todo
   ```

3. **Получите последние изменения из Git:**
   ```bash
   git pull origin master
   # или
   git pull origin main
   ```

4. **Остановите текущие контейнеры:**
   ```bash
   docker-compose down
   ```

5. **Примените миграции базы данных (если есть новые):**
   ```bash
   docker-compose run --rm app npm run prisma:migrate
   ```

6. **Пересоберите и запустите контейнеры:**
   ```bash
   docker-compose up -d --build
   ```

7. **Проверьте логи:**
   ```bash
   docker-compose logs -f app
   ```

8. **Проверьте статус контейнеров:**
   ```bash
   docker-compose ps
   ```

#### Полная команда для быстрого деплоя:

```bash
cd /path/to/backend-todo && \
git pull origin master && \
docker-compose down && \
docker-compose run --rm app npm run prisma:migrate && \
docker-compose up -d --build && \
docker-compose logs -f app
```

### Вариант 2: Деплой без Docker (прямой запуск)

#### На сервере:

1. **Подключитесь к серверу:**
   ```bash
   ssh user@your-server-ip
   cd /path/to/backend-todo
   ```

2. **Получите изменения:**
   ```bash
   git pull origin master
   ```

3. **Установите зависимости:**
   ```bash
   npm install
   ```

4. **Примените миграции:**
   ```bash
   npm run prisma:migrate
   ```

5. **Соберите проект:**
   ```bash
   npm run build
   ```

6. **Остановите старый процесс (если запущен через PM2):**
   ```bash
   pm2 stop backend-todo
   # или
   pm2 delete backend-todo
   ```

7. **Запустите приложение:**
   
   **С PM2 (рекомендуется):**
   ```bash
   pm2 start dist/index.js --name backend-todo
   pm2 save
   pm2 startup
   ```
   
   **Или напрямую:**
   ```bash
   npm start
   ```

### Вариант 3: Деплой через CI/CD (GitHub Actions, GitLab CI)

Создайте файл `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Server

on:
  push:
    branches: [ master ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /path/to/backend-todo
            git pull origin master
            docker-compose down
            docker-compose run --rm app npm run prisma:migrate
            docker-compose up -d --build
```

## Проверка после деплоя

### 1. Проверка health endpoint

```bash
curl http://your-server-ip:3001/health
```

Ожидаемый ответ:
```json
{
  "status": "ok",
  "message": "Database connected successfully",
  "timestamp": "2025-01-18T12:00:00.000Z"
}
```

### 2. Проверка API документации

Откройте в браузере: `http://your-server-ip:3001/api-docs`

### 3. Проверка WebSocket

```bash
# Используйте тестовый скрипт
npx ts-node scripts/test-websocket.ts <your-jwt-token>
```

## Откат изменений (Rollback)

Если что-то пошло не так:

### С Docker Compose:

```bash
# Откатиться на предыдущий коммит
git checkout HEAD~1
docker-compose down
docker-compose up -d --build
```

### С PM2:

```bash
# Откатиться на предыдущий коммит
git checkout HEAD~1
npm run build
pm2 restart backend-todo
```

## Миграции базы данных

### Перед деплоем проверьте миграции:

```bash
# Просмотр статуса миграций
npx prisma migrate status

# Применить миграции (разработка)
npm run prisma:migrate

# Применить миграции (продакшн)
npm run prisma:deploy
```

### В Docker:

```bash
# Применить миграции
docker-compose run --rm app npm run prisma:deploy
```

## Обновление только кода (без пересборки Docker)

Если нужно быстро обновить только код без пересборки образа:

```bash
# На сервере
cd /path/to/backend-todo
git pull origin master

# Перезапустить контейнер
docker-compose restart app
```

**Внимание:** Это работает только если код монтируется как volume. Для продакшена лучше пересобрать образ.

## Полезные команды для мониторинга

### Docker:

```bash
# Просмотр логов
docker-compose logs -f app

# Просмотр использования ресурсов
docker stats

# Просмотр статуса
docker-compose ps

# Вход в контейнер
docker-compose exec app sh
```

### PM2:

```bash
# Просмотр логов
pm2 logs backend-todo

# Мониторинг
pm2 monit

# Статус
pm2 status
```

## Безопасность

### Перед деплоем в продакшн:

1. ✅ Измените `JWT_SECRET` на безопасный случайный ключ
2. ✅ Настройте CORS для конкретных доменов (не `*`)
3. ✅ Используйте HTTPS (настройте reverse proxy с nginx)
4. ✅ Настройте firewall
5. ✅ Используйте сильные пароли для базы данных
6. ✅ Регулярно обновляйте зависимости: `npm audit fix`

## Настройка Nginx (опционально)

Пример конфигурации для reverse proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Troubleshooting

### Проблема: Контейнер не запускается

```bash
# Проверьте логи
docker-compose logs app

# Проверьте переменные окружения
docker-compose config
```

### Проблема: База данных не подключается

```bash
# Проверьте, запущена ли БД
docker-compose ps db

# Проверьте подключение
docker-compose exec db psql -U postgres -d todo_db
```

### Проблема: Миграции не применяются

```bash
# Принудительно применить миграции
docker-compose run --rm app npx prisma migrate deploy --force
```

## Чеклист перед деплоем

- [ ] Все изменения закоммичены и запушены
- [ ] Тесты проходят: `npm test`
- [ ] Проект собирается: `npm run build`
- [ ] Переменные окружения настроены на сервере
- [ ] Миграции проверены
- [ ] JWT_SECRET изменен на безопасный
- [ ] CORS настроен для продакшена
- [ ] Резервная копия базы данных создана (если нужно)

