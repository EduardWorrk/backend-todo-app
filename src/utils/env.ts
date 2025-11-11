/**
 * Получает DATABASE_URL из переменных окружения
 * Если DATABASE_URL не задан, строит его из отдельных переменных DB_*
 */
export function getDatabaseUrl(): string {
  // Если DATABASE_URL уже задан, используем его
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // Иначе строим из отдельных переменных
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  const user = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASSWORD || 'postgres';
  const database = process.env.DB_NAME || 'todo_db';

  // Экранируем специальные символы в пароле для URL
  const encodedPassword = encodeURIComponent(password);

  return `postgresql://${user}:${encodedPassword}@${host}:${port}/${database}`;
}

