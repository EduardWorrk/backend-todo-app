@echo off
echo ================================================
echo Applying Prisma migrations via Docker Compose
echo ================================================

echo.
echo Step 1: Checking if database container is running...
docker ps --filter "name=backend-todo-db" --format "{{.Names}}" > temp.txt
set /p DB_RUNNING=<temp.txt
del temp.txt

if "%DB_RUNNING%"=="backend-todo-db" (
    echo [OK] Database container is running
) else (
    echo [INFO] Starting database container...
    docker-compose up -d db
    echo [INFO] Waiting 10 seconds for database to initialize...
    timeout /t 10 /nobreak >nul
)

echo.
echo Step 2: Running Prisma migrations...
docker-compose run --rm app npx prisma migrate deploy

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================
    echo [SUCCESS] Migrations applied successfully!
    echo ================================================
) else (
    echo.
    echo ================================================
    echo [ERROR] Migration failed with error code %ERRORLEVEL%
    echo ================================================
    echo.
    echo Troubleshooting:
    echo 1. Check if Docker Desktop is running
    echo 2. Check if database is accessible
    echo 3. Check logs: docker-compose logs db
)

echo.
pause




