@echo off
echo ================================================
echo Stopping Backend Todo Application
echo ================================================

echo.
docker-compose down

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] Application stopped successfully!
) else (
    echo.
    echo [ERROR] Failed to stop application
)

echo.
pause




