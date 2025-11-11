import prisma from './prisma';

export async function initDatabase(): Promise<void> {
  try {
    // Проверка подключения к базе данных
    await prisma.$connect();
    console.log('Database connected successfully');
    
    // Prisma migrations будут применяться через команду `prisma migrate dev` или `prisma migrate deploy`
    // Эта функция теперь только проверяет подключение
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
}

