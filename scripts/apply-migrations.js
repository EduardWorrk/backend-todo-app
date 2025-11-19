#!/usr/bin/env node

/**
 * Скрипт для применения миграций Prisma
 * Обходит проблемы с PowerShell, выполняя команды напрямую через Node.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Применение миграций Prisma...\n');

// Проверка наличия .env файла
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ Ошибка: файл .env не найден!');
  process.exit(1);
}

// Загрузка переменных окружения вручную
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const trimmedLine = line.trim();
  if (trimmedLine && !trimmedLine.startsWith('#')) {
    const [key, ...valueParts] = trimmedLine.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      process.env[key.trim()] = value;
    }
  }
});

// Проверка DATABASE_URL
let databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.log('⚠️  DATABASE_URL не найден в .env, создаю из отдельных переменных...');
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || '5433';
  const dbUser = process.env.DB_USER || 'postgres';
  const dbPassword = process.env.DB_PASSWORD || 'postgres';
  const dbName = process.env.DB_NAME || 'todo_db';
  databaseUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
  process.env.DATABASE_URL = databaseUrl;
}

console.log(`📊 DATABASE_URL: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}\n`);

try {
  // Применение миграций через db push (самый простой способ)
  console.log('📦 Синхронизация схемы с базой данных...');
  execSync('npx prisma db push --accept-data-loss', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: databaseUrl },
    cwd: path.join(__dirname, '..'),
  });
  console.log('\n✅ Схема успешно синхронизирована!');
} catch (error) {
  console.error('\n❌ Ошибка при синхронизации схемы:', error.message);
  console.log('\n🔄 Пробую альтернативный способ: prisma migrate deploy...');
  
  try {
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: databaseUrl },
      cwd: path.join(__dirname, '..'),
    });
    console.log('\n✅ Миграции успешно применены!');
  } catch (migrateError) {
    console.error('\n❌ Ошибка при применении миграций:', migrateError.message);
    console.log('\n💡 Попробуйте выполнить вручную:');
    console.log('   npx prisma db push');
    process.exit(1);
  }
}

// Генерация Prisma Client
try {
  console.log('\n🔧 Генерация Prisma Client...');
  execSync('npx prisma generate', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: databaseUrl },
    cwd: path.join(__dirname, '..'),
  });
  console.log('\n✅ Prisma Client сгенерирован!');
} catch (error) {
  console.warn('\n⚠️  Предупреждение: не удалось сгенерировать Prisma Client:', error.message);
}

console.log('\n✨ Готово! Теперь можно запустить сервер: npm run dev\n');

