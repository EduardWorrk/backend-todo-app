# Диагностика проблем с базой данных

## Найденные проблемы

### 1. ✅ ИСПРАВЛЕНО: Неправильный DATABASE_URL в .env
**Проблема:** В `.env` файле был указан URL для Prisma Postgres сервера (`prisma+postgres://`), а не обычный PostgreSQL.

**Решение:** Исправлен `.env` файл с правильным форматом:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/todo_db
```

### 2. ⚠️ Docker Desktop не запущен
**Проблема:** Docker Desktop не запущен, поэтому контейнеры не могут быть созданы.

**Решение:** 
1. Запустите Docker Desktop
2. Дождитесь полного запуска (иконка в трее перестанет мигать)
3. Выполните: `docker-compose up -d db`

### 3. Проверка конфигурации

#### docker-compose.yml
- ✅ Конфигурация корректна
- ✅ Порт 5433 маппится на 5432 внутри контейнера
- ✅ Переменные окружения настроены правильно

#### prisma/schema.prisma
- ✅ Схема корректна
- ✅ Модели User и Task определены правильно

#### src/db/prisma.ts
- ✅ Автоматическое построение DATABASE_URL работает
- ✅ Fallback на отдельные переменные DB_* настроен

#### src/utils/env.ts
- ✅ Функция getDatabaseUrl() корректна
- ✅ Экранирование пароля работает

## Шаги для запуска

### Вариант 1: С Docker (рекомендуется)

```bash
# 1. Убедитесь что Docker Desktop запущен
# 2. Запустите базу данных
docker-compose up -d db

# 3. Подождите 5-10 секунд
Start-Sleep -Seconds 10

# 4. Проверьте подключение
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5433/todo_db"
npx prisma db push

# 5. Запустите сервер
npm run dev
```

### Вариант 2: Локальный PostgreSQL

Если у вас установлен PostgreSQL локально:

1. Обновите `.env`:
```
DB_HOST=localhost
DB_PORT=5432  # или ваш порт
DB_USER=postgres
DB_PASSWORD=ваш_пароль
DB_NAME=todo_db
DATABASE_URL=postgresql://postgres:ваш_пароль@localhost:5432/todo_db
```

2. Создайте базу данных:
```sql
CREATE DATABASE todo_db;
```

3. Примените миграции:
```bash
npm run prisma:migrate
```

## Проверка работы

### 1. Проверка базы данных
```bash
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5433/todo_db"
npx prisma db push
```

### 2. Проверка сервера
```bash
# В другом терминале
curl http://localhost:3000/health
# или
Invoke-WebRequest http://localhost:3000/health
```

### 3. Проверка через Prisma Studio
```bash
npm run prisma:studio
```

## Типичные ошибки

### "Can't reach database server"
- Docker Desktop не запущен
- Контейнер не запущен: `docker-compose up -d db`
- Неправильный порт в DATABASE_URL

### "Database schema is not in sync"
- Выполните: `npx prisma db push`
- Или создайте миграцию: `npm run prisma:migrate`

### "EADDRINUSE: address already in use :::3000"
- Порт 3000 занят другим процессом
- Остановите процесс: `Get-NetTCPConnection -LocalPort 3000 | Stop-Process`

## Текущий статус

- ✅ .env файл исправлен
- ✅ Конфигурация Prisma корректна
- ✅ Код миграции на Prisma завершен
- ⚠️ Docker Desktop нужно запустить вручную
- ⚠️ База данных не запущена (нужен Docker Desktop)

