# 🚀 Запуск проекта Backend Todo

## ✅ Что уже готово

- ✅ Prisma ORM настроен и интегрирован
- ✅ Все SQL-запросы заменены на Prisma методы
- ✅ `.env` файл создан с дефолтными настройками
- ✅ Prisma Client сгенерирован
- ✅ TypeScript компилируется без ошибок
- ✅ Docker Compose настроен

## 🏃 Быстрый запуск

### Вариант 1: Локальная разработка

```bash
# 1. Запустите базу данных
docker-compose up -d db

# 2. Создайте миграции (первый раз)
npm run prisma:migrate

# 3. Запустите проект
npm run dev
```

### Вариант 2: Полный Docker

```bash
docker-compose up -d
```

## 📝 Следующие шаги

1. **Если база данных уже содержит таблицы**, используйте:
   ```bash
   npx prisma db push
   ```
   Это синхронизирует схему без создания миграций.

2. **Для создания миграции** (если база пустая):
   ```bash
   npm run prisma:migrate
   ```

3. **Проверьте работу**:
   - Health endpoint: http://localhost:3000/health
   - API документация в `SETUP.md`

## 📚 Документация

- [QUICK_START.md](./QUICK_START.md) - быстрый старт
- [SETUP.md](./SETUP.md) - подробная инструкция
- [PRISMA_MIGRATION.md](./PRISMA_MIGRATION.md) - информация о миграции на Prisma

## 🔧 Полезные команды

```bash
npm run dev              # Запуск в режиме разработки
npm run build            # Сборка проекта
npm run start            # Запуск продакшн версии
npm run prisma:generate  # Генерация Prisma Client
npm run prisma:migrate   # Создание миграции
npm run prisma:studio    # Открыть Prisma Studio
```

## ⚠️ Важно

- Убедитесь, что Docker запущен
- Порт 5433 должен быть свободен для PostgreSQL
- При первом запуске обязательно создайте миграцию

