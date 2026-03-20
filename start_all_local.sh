#!/bin/bash
set -e

echo "========================================"
echo "  MeetingHub - Local Dev Setup"
echo "========================================"

# ── Docker Network ───────────────────────────
echo ""
echo "[NETWORK] Creating Docker network..."
docker network create network 2>/dev/null || echo "[NETWORK] Network already exists, skipping."

# ── Supabase ─────────────────────────────────
echo ""
echo "[SUPABASE] Starting self-hosted Supabase..."
cd supabase/
docker compose up -d
echo "[SUPABASE] Waiting for Supabase to be ready..."
sleep 15
echo "[SUPABASE] Ready at http://localhost:8000"
echo "[SUPABASE] Studio at http://localhost:54323"

# ── Infrastructure (LiveKit, Redis, Egress, etc.) ──
echo ""
echo "[INFRA] Starting LiveKit, Redis, Egress, LibreTranslate..."
cd ..

if [ ! -f .env ]; then
  cp .env.example .env
  echo "[INFRA] .env created from .env.example — review and update values before continuing."
  exit 1
fi

docker compose up -d
echo "[INFRA] LiveKit at ws://localhost:7880"
echo "[INFRA] Redis at localhost:6379"
echo "[INFRA] LibreTranslate at http://localhost:5555"

# ── Backend ──────────────────────────────────
echo ""
echo "[BACKEND] Setting up..."
cd backend/

if [ ! -f .env ]; then
  cp .env.example .env
  echo "[BACKEND] .env created from .env.example — fill in values before continuing."
  exit 1
fi

npm install
npx prisma generate
npx prisma migrate dev --name init 2>/dev/null || echo "[BACKEND] Migrations already applied."

echo "[BACKEND] Starting dev server..."
npm run start:dev &
echo "[BACKEND] Ready at http://localhost:6001"
echo "[BACKEND] Swagger at http://localhost:6001/api"

# ── Frontend ─────────────────────────────────
echo ""
echo "[FRONTEND] Setting up..."
cd ../frontend/

if [ ! -f .env ]; then
  cp .env.example .env
  echo "[FRONTEND] .env created from .env.example — fill in values before continuing."
  exit 1
fi

npm install

echo "[FRONTEND] Starting dev server..."
npm run dev &
echo "[FRONTEND] Ready at http://localhost:3000"

echo ""
echo "========================================"
echo "  All services started!"
echo "  Frontend:        http://localhost:3000"
echo "  Backend API:     http://localhost:6001"
echo "  Swagger:         http://localhost:6001/api"
echo "  Supabase:        http://localhost:8000"
echo "  Supabase Studio: http://localhost:54323"
echo "  LiveKit:         ws://localhost:7880"
echo "  LibreTranslate:  http://localhost:5555"
echo "========================================"

wait
