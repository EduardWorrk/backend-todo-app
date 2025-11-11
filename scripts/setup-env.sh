#!/bin/bash
# Скрипт для настройки .env файла

if [ -f .env ]; then
    echo ".env файл уже существует"
    exit 0
fi

echo "Создание .env файла..."

read -p "DB_HOST [localhost]: " db_host
db_host=${db_host:-localhost}

read -p "DB_PORT [5433]: " db_port
db_port=${db_port:-5433}

read -p "DB_USER [postgres]: " db_user
db_user=${db_user:-postgres}

read -sp "DB_PASSWORD [postgres]: " db_password
db_password=${db_password:-postgres}
echo ""

read -p "DB_NAME [todo_db]: " db_name
db_name=${db_name:-todo_db}

read -p "PORT [3000]: " port
port=${port:-3000}

# Экранируем пароль для URL
encoded_password=$(printf '%s' "$db_password" | jq -sRr @uri 2>/dev/null || printf '%s' "$db_password" | sed 's/:/%3A/g; s/@/%40/g; s/\//%2F/g')
database_url="postgresql://${db_user}:${encoded_password}@${db_host}:${db_port}/${db_name}"

cat > .env << EOF
# Database Configuration
DB_HOST=$db_host
DB_PORT=$db_port
DB_USER=$db_user
DB_PASSWORD=$db_password
DB_NAME=$db_name

# Prisma Database URL
DATABASE_URL=$database_url

# Server Configuration
PORT=$port
EOF

echo ".env файл создан успешно!"

