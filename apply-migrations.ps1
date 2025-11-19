# Скрипт для применения миграций Prisma

Write-Host "Применение миграций Prisma..." -ForegroundColor Yellow

# Проверка наличия .env файла
if (-not (Test-Path .env)) {
    Write-Host "Ошибка: файл .env не найден!" -ForegroundColor Red
    exit 1
}

# Загрузка переменных окружения
Get-Content .env | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]*)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

# Проверка подключения к базе данных
Write-Host "`nПроверка подключения к базе данных..." -ForegroundColor Cyan
try {
    $dbUrl = $env:DATABASE_URL
    if (-not $dbUrl) {
        Write-Host "DATABASE_URL не найден в .env, создаю из отдельных переменных..." -ForegroundColor Yellow
        $dbHost = $env:DB_HOST ?? "localhost"
        $dbPort = $env:DB_PORT ?? "5433"
        $dbUser = $env:DB_USER ?? "postgres"
        $dbPassword = $env:DB_PASSWORD ?? "postgres"
        $dbName = $env:DB_NAME ?? "todo_db"
        $dbUrl = "postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}"
        $env:DATABASE_URL = $dbUrl
    }
    Write-Host "DATABASE_URL: $($dbUrl -replace ':[^:@]+@', ':****@')" -ForegroundColor Gray
} catch {
    Write-Host "Ошибка при настройке DATABASE_URL: $_" -ForegroundColor Red
    exit 1
}

# Применение миграций
Write-Host "`nПрименение миграций..." -ForegroundColor Cyan
try {
    npx prisma migrate deploy
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✓ Миграции успешно применены!" -ForegroundColor Green
    } else {
        Write-Host "`n✗ Ошибка при применении миграций" -ForegroundColor Red
        Write-Host "Попробуйте: npx prisma db push" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "`n✗ Ошибка: $_" -ForegroundColor Red
    Write-Host "`nПопробуйте альтернативный способ:" -ForegroundColor Yellow
    Write-Host "npx prisma db push" -ForegroundColor Cyan
    exit 1
}

# Генерация Prisma Client
Write-Host "`nГенерация Prisma Client..." -ForegroundColor Cyan
try {
    npx prisma generate
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Prisma Client сгенерирован!" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠ Предупреждение: не удалось сгенерировать Prisma Client: $_" -ForegroundColor Yellow
}

Write-Host "`nГотово! Теперь можно запустить сервер." -ForegroundColor Green

