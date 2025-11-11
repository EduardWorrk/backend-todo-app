import { PrismaClient } from '@prisma/client';
import { getDatabaseUrl } from '../utils/env';

// Устанавливаем DATABASE_URL если он не задан
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = getDatabaseUrl();
}

const prisma = new PrismaClient();

export default prisma;

