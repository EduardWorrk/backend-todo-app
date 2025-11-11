# Скрипт для проверки состояния базы данных и проекта

Write-Host "=== Проверка проекта ===" -ForegroundColor Cyan

# 1. Проверка Docker
Write-Host "`n1. Проверка Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>&1
    Write-Host "   ✓ Docker установлен: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Docker не найден" -ForegroundColor Red
}

# 2. Проверка Docker Desktop
Write-Host "`n2. Проверка Docker Desktop..." -ForegroundColor Yellow
try {
    $containers = docker ps -a 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ Docker Desktop запущен" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Docker Desktop не запущен" -ForegroundColor Red
        Write-Host "   → Запустите Docker Desktop и попробуйте снова" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ✗ Docker Desktop не запущен" -ForegroundColor Red
}

# 3. Проверка .env файла
Write-Host "`n3. Проверка .env файла..." -ForegroundColor Yellow
if (Test-Path .env) {
    Write-Host "   ✓ .env файл существует" -ForegroundColor Green
    $envContent = Get-Content .env -Raw
    if ($envContent -match "DATABASE_URL") {
        Write-Host "   ✓ DATABASE_URL найден" -ForegroundColor Green
        $dbUrl = ($envContent | Select-String -Pattern "DATABASE_URL=(.+)").Matches.Groups[1].Value
        Write-Host "   DATABASE_URL: $dbUrl" -ForegroundColor Gray
    } else {
        Write-Host "   ✗ DATABASE_URL не найден в .env" -ForegroundColor Red
    }
} else {
    Write-Host "   ✗ .env файл не найден" -ForegroundColor Red
}

# 4. Проверка контейнера базы данных
Write-Host "`n4. Проверка контейнера базы данных..." -ForegroundColor Yellow
try {
    $dbContainer = docker ps -a --filter "name=backend-todo-db" --format "{{.Names}} {{.Status}}" 2>&1
    if ($dbContainer -match "backend-todo-db") {
        Write-Host "   ✓ Контейнер найден: $dbContainer" -ForegroundColor Green
        if ($dbContainer -match "Up") {
            Write-Host "   ✓ Контейнер запущен" -ForegroundColor Green
        } else {
            Write-Host "   ✗ Контейнер не запущен" -ForegroundColor Red
            Write-Host "   → Запустите: docker-compose up -d db" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ✗ Контейнер не найден" -ForegroundColor Red
        Write-Host "   → Запустите: docker-compose up -d db" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ✗ Не удалось проверить контейнер" -ForegroundColor Red
}

# 5. Проверка подключения к базе данных
Write-Host "`n5. Проверка подключения к базе данных..." -ForegroundColor Yellow
try {
    $dbUrl = (Get-Content .env | Select-String -Pattern "DATABASE_URL=(.+)").Matches.Groups[1].Value
    if ($dbUrl) {
        $env:DATABASE_URL = $dbUrl
        $result = npx prisma db execute --stdin --schema prisma/schema.prisma 2>&1
        Write-Host "   Проверка через Prisma..." -ForegroundColor Gray
    }
} catch {
    Write-Host "   ✗ Не удалось проверить подключение" -ForegroundColor Red
}

# 6. Проверка сервера
Write-Host "`n6. Проверка сервера..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri http://localhost:3000/health -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✓ Сервер запущен на порту 3000" -ForegroundColor Green
        $content = $response.Content | ConvertFrom-Json
        if ($content.status -eq "ok") {
            Write-Host "   ✓ База данных подключена" -ForegroundColor Green
        } else {
            Write-Host "   ✗ База данных не подключена: $($content.message)" -ForegroundColor Red
        }
    } else {
        Write-Host "   ✗ Сервер не отвечает на порту 3000" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ Сервер не запущен или не отвечает" -ForegroundColor Red
    Write-Host "   → Запустите: npm run dev" -ForegroundColor Yellow
}

Write-Host "`n=== Проверка завершена ===" -ForegroundColor Cyan

