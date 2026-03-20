@echo off
echo ========================================
echo   NestJS + React + Supabase Boilerplate
echo   Local Dev Setup (Windows)
echo ========================================

:: ── SUPABASE ─────────────────────────────────
echo.
echo [SUPABASE] Creating Docker network...
docker network create network 2>/dev/null || echo [SUPABASE] Network already exists, skipping.

echo [SUPABASE] Starting self-hosted Supabase...
cd supabase
call docker compose up -d
echo [SUPABASE] Waiting for Supabase to be ready...
timeout /t 15 /nobreak >/dev/null
echo [SUPABASE] Ready at http://localhost:8000
echo [SUPABASE] Studio at http://localhost:54323

:: ── BACKEND ──────────────────────────────────
echo.
echo [BACKEND] Setting up...

cd ..\backend

if not exist .env (
    copy .env.example .env
    echo [BACKEND] .env created from .env.example
    echo [BACKEND] Fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend\.env then re-run this script.
    pause
    exit /b 1
)

call npm install
call docker-compose up --build -d
call npm run db:seed

echo [BACKEND] Ready at http://localhost:6001
echo [BACKEND] Swagger at http://localhost:6001/api

:: ── FRONTEND ─────────────────────────────────
echo.
echo [FRONTEND] Setting up...

cd ..\frontend

if not exist .env (
    copy .env.example .env
    echo [FRONTEND] .env created from .env.example
    echo [FRONTEND] Fill in VITE_SUPABASE_ANON_KEY in frontend\.env then re-run this script.
    pause
    exit /b 1
)

copy /Y ..\backend\src\api\myApi.ts src\api\myApi.ts
call npm install
call docker-compose --profile dev up --build -d

echo [FRONTEND] Ready at http://localhost:3000
echo.
echo All done!
pause
