@echo off
echo ================================================
echo Starting Backend Todo Application
echo ================================================

echo.
echo Step 1: Starting all services...
docker-compose up -d

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Step 2: Waiting for services to start...
    timeout /t 5 /nobreak >nul
    
    echo.
    echo ================================================
    echo [SUCCESS] Application started successfully!
    echo ================================================
    echo.
    echo Services:
    echo - Database: localhost:5433
    echo - API: http://localhost:3001
    echo - Swagger: http://localhost:3001/api-docs
    echo - WebSocket Test: http://localhost:3001/websocket-test
    echo.
    echo To view logs: docker-compose logs -f
    echo To stop: docker-compose down
) else (
    echo.
    echo ================================================
    echo [ERROR] Failed to start application
    echo ================================================
    echo.
    echo Troubleshooting:
    echo 1. Check if Docker Desktop is running
    echo 2. Check if ports 3001 and 5433 are available
    echo 3. Check logs: docker-compose logs
)

echo.
pause




