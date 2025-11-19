@echo off
echo Applying Prisma migrations...
echo.

REM Check if .env exists
if not exist .env (
    echo Error: .env file not found!
    exit /b 1
)

REM Try to apply migrations using prisma db push
echo Syncing database schema...
call npx prisma db push --accept-data-loss
if %ERRORLEVEL% EQU 0 (
    echo.
    echo Success! Schema synced successfully.
    echo.
    echo Generating Prisma Client...
    call npx prisma generate
    echo.
    echo Done! You can now start the server with: npm run dev
    exit /b 0
)

REM If db push failed, try migrate deploy
echo.
echo Trying alternative method: prisma migrate deploy...
call npx prisma migrate deploy
if %ERRORLEVEL% EQU 0 (
    echo.
    echo Success! Migrations applied successfully.
    echo.
    echo Generating Prisma Client...
    call npx prisma generate
    echo.
    echo Done! You can now start the server with: npm run dev
    exit /b 0
)

echo.
echo Error: Failed to apply migrations.
echo Please try manually: npx prisma db push
exit /b 1

