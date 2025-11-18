import { defineConfig, env } from "prisma/config";

// Для генерации Prisma Client не нужна реальная база данных
// Используем дефолтное значение, если DATABASE_URL не задан
const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5433/todo_db";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: databaseUrl,
  },
});
