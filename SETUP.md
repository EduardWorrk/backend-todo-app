# Инструкция по запуску проекта

## Предварительные требования

- Node.js (v18 или выше)
- Docker и Docker Compose (для базы данных)
- npm или yarn

## Шаги для запуска

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка переменных окружения

Файл `.env` уже создан с дефолтными значениями. Если нужно изменить настройки, отредактируйте `.env`:

```env
DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=todo_db
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/todo_db
PORT=3000
```

### 3. Запуск базы данных

```bash
docker-compose up -d db
```

Это запустит PostgreSQL в Docker контейнере.

### 4. Создание миграций Prisma

После запуска базы данных выполните:

```bash
npm run prisma:migrate
```

Или если база данных уже содержит таблицы:

```bash
npx prisma migrate dev --name init
```

### 5. Генерация Prisma Client

Prisma Client автоматически генерируется при установке зависимостей (postinstall скрипт). Если нужно сгенерировать вручную:

```bash
npm run prisma:generate
```

### 6. Запуск проекта

Для разработки:
```bash
npm run dev
```

Для продакшена:
```bash
npm run build
npm start
```

## Проверка работы

1. Проверьте health endpoint: `http://localhost:3000/health`
2. Зарегистрируйте пользователя: `POST http://localhost:3000/register`
3. Войдите: `POST http://localhost:3000/login`

## Полезные команды

- `npm run prisma:studio` - открыть Prisma Studio для просмотра данных
- `npm run prisma:migrate` - создать новую миграцию
- `npm run prisma:deploy` - применить миграции (для продакшена)

## Структура базы данных

Проект использует Prisma ORM с двумя моделями:
- **User** - пользователи (id, login, email, password, created_at)
- **Task** - задачи (id, user_id, name, description, created_at, updated_at)

## Устранение проблем

### База данных не подключается

1. Проверьте, что Docker контейнер запущен: `docker ps`
2. Проверьте переменные в `.env`
3. Убедитесь, что порт 5433 свободен

### Ошибки миграции

Если база данных уже содержит таблицы, используйте:
```bash
npx prisma db push
```

Это синхронизирует схему без создания миграций.

