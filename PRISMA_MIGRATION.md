# Prisma Migration Guide

Проект был мигрирован с сырых SQL-запросов на Prisma ORM.

## Настройка DATABASE_URL

Prisma требует переменную окружения `DATABASE_URL`. Если у вас уже настроены переменные `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, вы можете создать `DATABASE_URL` следующим образом:

```
DATABASE_URL=postgresql://DB_USER:DB_PASSWORD@DB_HOST:DB_PORT/DB_NAME
```

Пример:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/todo_db
```

## Команды Prisma

- `npm run prisma:generate` - сгенерировать Prisma Client
- `npm run prisma:migrate` - создать и применить миграцию (для разработки)
- `npm run prisma:deploy` - применить миграции (для продакшена)
- `npm run prisma:studio` - открыть Prisma Studio для просмотра данных

## Первая миграция

Если база данных уже существует с таблицами, выполните:

```bash
npx prisma migrate dev --name init
```

Это создаст миграцию на основе существующей схемы.

## Изменения в коде

- Все `pool.query()` заменены на методы Prisma
- `src/routes/auth.ts` - использует `prisma.user`
- `src/routes/todos.ts` - использует `prisma.task`
- `src/db/prisma.ts` - экспортирует Prisma Client instance
- `src/db/init.ts` - теперь только проверяет подключение (миграции через Prisma CLI)

