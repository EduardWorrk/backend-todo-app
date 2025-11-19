# 🚀 Быстрое исправление ошибки "Database schema is out of sync"

## Проблема
Получаете ошибку:
```json
{
  "status": "error",
  "message": "Database schema is out of sync. Please run migrations."
}
```

## ⚡ Решение - Запустите батник!

Я создал батник файл для автоматического применения миграций. Просто **двойной клик** на файл:

```
apply-migrations.bat
```

Или запустите в командной строке (cmd, не PowerShell):
```cmd
apply-migrations.bat
```

## Альтернативные способы

### Способ 1: Через npm скрипт (если PowerShell работает нормально)

```bash
npm run prisma:push
```

### Способ 2: Напрямую через npx

Откройте **новый терминал CMD** (не PowerShell) и выполните:

```cmd
npx prisma db push
```

### Способ 3: Через Node.js скрипт

```bash
npm run apply-migrations
```

### Способ 4: Ручное применение через SQL

Если у вас есть доступ к базе данных через клиент (pgAdmin, DBeaver, psql):

1. Откройте файл `apply-migrations-manual.sql`
2. Выполните его в вашей базе данных `todo_db`

Или через psql:
```bash
psql -h localhost -p 5433 -U postgres -d todo_db -f apply-migrations-manual.sql
```

### Способ 5: Через Docker (если база в контейнере)

```bash
docker exec -i backend-todo-db psql -U postgres -d todo_db < apply-migrations-manual.sql
```

## Проверка

После применения миграций:

1. Перезапустите сервер:
   ```bash
   npm run dev
   ```

2. Проверьте эндпоинт `/todos` - ошибка должна исчезнуть

3. Проверьте через Prisma Studio:
   ```bash
   npm run prisma:studio
   ```
   Откройте таблицу `tasks` и убедитесь, что поля `priority` и `task_time` существуют.

## Что делают миграции?

Добавляют два новых поля в таблицу `tasks`:
- `priority` (VARCHAR(16)) - приоритет задачи (low/medium/high)
- `task_time` (VARCHAR(8)) - время задачи в формате HH.MM

## Если ничего не помогает

1. Проверьте, что база данных запущена:
   ```bash
   docker-compose ps
   ```

2. Проверьте подключение:
   ```bash
   npm run prisma:studio
   ```

3. Проверьте `.env` файл - там должен быть правильный `DATABASE_URL`

## Примечание о PowerShell

Если у вас проблемы с PowerShell (команды не выполняются), используйте:
- **CMD** (командная строка Windows) вместо PowerShell
- Или **двойной клик** на `apply-migrations.bat`
