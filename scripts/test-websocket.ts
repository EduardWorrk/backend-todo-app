/**
 * Скрипт для ручного тестирования WebSocket соединений
 * 
 * Использование:
 * 1. Запустите сервер: npm run dev
 * 2. Зарегистрируйте пользователя и получите токен
 * 3. Запустите этот скрипт: npx ts-node scripts/test-websocket.ts <token>
 */

import { io } from 'socket.io-client';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const token = process.argv[2];

if (!token) {
  console.error('❌ Ошибка: Необходимо указать JWT токен');
  console.log('Использование: npx ts-node scripts/test-websocket.ts <your-jwt-token>');
  console.log('Пример: npx ts-node scripts/test-websocket.ts eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
  process.exit(1);
}

console.log('🔌 Подключение к WebSocket серверу...');
console.log(`📍 URL: ${SERVER_URL}`);
console.log(`🔑 Token: ${token.substring(0, 20)}...\n`);

const socket = io(SERVER_URL, {
  auth: {
    token,
  },
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('✅ Успешно подключено к WebSocket серверу!');
  console.log(`🆔 Socket ID: ${socket.id}\n`);
});

socket.on('connected', (data) => {
  console.log('📨 Получено событие "connected":');
  console.log(JSON.stringify(data, null, 2));
  console.log('');
});

socket.on('notification:new', (data) => {
  console.log('🔔 Получено новое уведомление:');
  console.log(JSON.stringify(data, null, 2));
  console.log('');
});

socket.on('notification:read', (data) => {
  console.log('✅ Уведомление прочитано:');
  console.log(JSON.stringify(data, null, 2));
  console.log('');
});

socket.on('notification:all_read', (data) => {
  console.log('✅ Все уведомления прочитаны:');
  console.log(JSON.stringify(data, null, 2));
  console.log('');
});

socket.on('connect_error', (error) => {
  console.error('❌ Ошибка подключения:', error.message);
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log(`🔌 Отключено от сервера. Причина: ${reason}`);
});

socket.on('error', (error) => {
  console.error('❌ Ошибка:', error);
});

// Обработка завершения процесса
process.on('SIGINT', () => {
  console.log('\n👋 Закрытие соединения...');
  socket.disconnect();
  process.exit(0);
});

console.log('⏳ Ожидание событий... (Нажмите Ctrl+C для выхода)\n');

