# Быстрый старт

## Запуск проекта за 3 шага

### 1. Установите зависимости
```bash
npm install
```

### 2. Запустите базу данных
```bash
docker-compose up -d db
```

### 3. Создайте миграции и запустите проект
```bash
npm run prisma:migrate
npm run dev
```

Готово! Сервер запущен на http://localhost:3000

## Что дальше?

- Проверьте health endpoint: http://localhost:3000/health
- Зарегистрируйте пользователя: `POST http://localhost:3000/register`
- Войдите: `POST http://localhost:3000/login`

Подробная инструкция в [SETUP.md](./SETUP.md)

