#!/bin/bash

# Скрипт для применения миграций Prisma

echo "Применение миграций Prisma..."

# Загрузка переменных окружения из .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "Ошибка: файл .env не найден!"
    exit 1
fi

# Проверка DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "DATABASE_URL не найден в .env, создаю из отдельных переменных..."
    DB_HOST=${DB_HOST:-localhost}
    DB_PORT=${DB_PORT:-5433}
    DB_USER=${DB_USER:-postgres}
    DB_PASSWORD=${DB_PASSWORD:-postgres}
    DB_NAME=${DB_NAME:-todo_db}
    export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
fi

echo "DATABASE_URL: $(echo $DATABASE_URL | sed 's/:[^:@]*@/:****@/')"

# Применение миграций
echo ""
echo "Применение миграций..."
if npx prisma migrate deploy; then
    echo ""
    echo "✓ Миграции успешно применены!"
else
    echo ""
    echo "✗ Ошибка при применении миграций"
    echo "Попробуйте: npx prisma db push"
    exit 1
fi

# Генерация Prisma Client
echo ""
echo "Генерация Prisma Client..."
npx prisma generate

echo ""
echo "Готово! Теперь можно запустить сервер."

