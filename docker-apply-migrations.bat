@echo off
echo Applying migrations through Docker...
echo.

REM Check if Docker container is running
docker ps --filter "name=backend-todo-db" --format "{{.Names}}" | findstr /C:"backend-todo-db" >nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Docker container 'backend-todo-db' is not running!
    echo Please start it with: docker-compose up -d db
    exit /b 1
)

echo Container is running. Applying migrations...
echo.

REM Apply priority column
echo Adding 'priority' column...
docker exec -i backend-todo-db psql -U postgres -d todo_db -c "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority VARCHAR(16);"
if %ERRORLEVEL% EQU 0 (
    echo [OK] priority column added
) else (
    echo [WARNING] priority column might already exist
)

echo.

REM Apply task_time column
echo Adding 'task_time' column...
docker exec -i backend-todo-db psql -U postgres -d todo_db -c "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_time VARCHAR(8);"
if %ERRORLEVEL% EQU 0 (
    echo [OK] task_time column added
) else (
    echo [WARNING] task_time column might already exist
)

echo.
echo Verifying columns...
docker exec -i backend-todo-db psql -U postgres -d todo_db -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tasks' AND column_name IN ('priority', 'task_time');"

echo.
echo Done! Now run: npm run prisma:generate
echo Then restart your server: npm run dev

