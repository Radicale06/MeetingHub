@echo off
echo ............ Starting DB migration deployment ............
call npm run db:migrate:deploy
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Database migration failed. Exiting.
    exit /b 1
)
echo [OK] Database migration successful.

timeout /t 3 /nobreak >nul

echo ............ Seeding Supabase users ............
call npm run db:seed
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Seeding failed. Continuing anyway.
)

timeout /t 3 /nobreak >nul

echo ............ Starting Development mode ............
call npm run start:dev
