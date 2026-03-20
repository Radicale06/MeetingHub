@echo off
setlocal enabledelayedexpansion

echo.
echo *** WARNING: This will remove all containers and container data, and optionally reset .env ***
echo.

:: Support -y flag to skip all confirmations
set AUTO_CONFIRM=0
if "%1"=="-y" set AUTO_CONFIRM=1

call :confirm || exit /b 1

echo ==^> Stopping and removing all containers...

if exist ".env" (
    call docker compose -f docker-compose.yml -f ./dev/docker-compose.dev.yml down -v --remove-orphans
) else if exist ".env.example" (
    echo No .env found, using .env.example for docker compose down...
    call docker compose --env-file .env.example -f docker-compose.yml -f ./dev/docker-compose.dev.yml down -v --remove-orphans
) else (
    echo Skipping 'docker compose down' because there's no env-file.
)

echo ==^> Cleaning up bind-mounted directories...

call :remove_dir ".\volumes\db\data"
call :remove_dir ".\volumes\storage"

echo ==^> Resetting .env file ^(will save backup to .env.old^)...

call :confirm || exit /b 1

if exist ".env" (
    echo Renaming existing .env file to .env.old
    move /y .env .env.old >nul
) else (
    echo No .env file found.
)

if exist ".env.example" (
    echo Copying .env.example to .env
    copy /y .env.example .env >nul
) else (
    echo No .env.example found, can't restore .env to default values.
)

echo Cleanup complete!
echo Re-run 'docker compose pull' to update images.
echo.
endlocal
goto :eof

:: ── Subroutines ──────────────────────────────
:confirm
if "%AUTO_CONFIRM%"=="1" exit /b 0
set /p "_reply=Are you sure you want to proceed? (y/N): "
if /i "!_reply!"=="y" exit /b 0
echo Script canceled.
exit /b 1

:remove_dir
if exist "%~1" (
    echo Removing %~1...
    call :confirm || exit /b 1
    rmdir /s /q "%~1"
) else (
    echo %~1 not found.
)
exit /b 0
