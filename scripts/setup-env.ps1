# Скрипт для настройки .env файла
$envFile = ".env"

if (Test-Path $envFile) {
    Write-Host ".env файл уже существует" -ForegroundColor Yellow
    exit 0
}

Write-Host "Создание .env файла..." -ForegroundColor Green

$dbHost = Read-Host "DB_HOST [localhost]"
if ([string]::IsNullOrWhiteSpace($dbHost)) { $dbHost = "localhost" }

$dbPort = Read-Host "DB_PORT [5433]"
if ([string]::IsNullOrWhiteSpace($dbPort)) { $dbPort = "5433" }

$dbUser = Read-Host "DB_USER [postgres]"
if ([string]::IsNullOrWhiteSpace($dbUser)) { $dbUser = "postgres" }

$dbPassword = Read-Host "DB_PASSWORD [postgres]" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))
if ([string]::IsNullOrWhiteSpace($dbPasswordPlain)) { $dbPasswordPlain = "postgres" }

$dbName = Read-Host "DB_NAME [todo_db]"
if ([string]::IsNullOrWhiteSpace($dbName)) { $dbName = "todo_db" }

$port = Read-Host "PORT [3000]"
if ([string]::IsNullOrWhiteSpace($port)) { $port = "3000" }

# Экранируем пароль для URL
$encodedPassword = [System.Web.HttpUtility]::UrlEncode($dbPasswordPlain)
$databaseUrl = "postgresql://${dbUser}:${encodedPassword}@${dbHost}:${dbPort}/${dbName}"

$content = @"
# Database Configuration
DB_HOST=$dbHost
DB_PORT=$dbPort
DB_USER=$dbUser
DB_PASSWORD=$dbPasswordPlain
DB_NAME=$dbName

# Prisma Database URL
DATABASE_URL=$databaseUrl

# Server Configuration
PORT=$port
"@

Set-Content -Path $envFile -Value $content
Write-Host ".env файл создан успешно!" -ForegroundColor Green

