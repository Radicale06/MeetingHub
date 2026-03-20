[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue)](https://www.linkedin.com/in/hassenamri005/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

# NestJS Boilerplate

A NestJS 10 boilerplate with Supabase Auth, Prisma (empty schema ready for your models), Swagger, and Docker.

Clone it, add your models and business logic — everything else is already wired up.

## Stack

- **NestJS 10** — modular Node.js framework
- **Node 20**, TypeScript, ESLint v9
- **Prisma 5** — empty schema, ready to add your tables
- **Supabase Auth** — proxied through the API (no custom JWT implementation)
- **Swagger** — auto-generated API docs at `/api`
- **Docker** — dev and prod configurations

## Auth Flow

```
POST /auth/login                     → supabase.auth.signInWithPassword()
POST /auth/register                  → supabase.auth.admin.createUser()
POST /auth/refresh-token
POST /auth/request-reset-password-email
POST /auth/reset-password
GET  /auth/me                        → requires Bearer token
```

Protected routes use `@UseGuards(SupabaseAuthGuard)` — validates JWT via `supabase.auth.getUser(token)`.

Response shape: `{ accessToken, refreshToken, user: { id, email, roleId } }`
`roleId` is stored in Supabase `user.app_metadata.roleId` (default: 3).

## Environment

Copy `.env.example` to `.env`:

```env
APP_PORT=6001
FRONTEND_URL=http://localhost:3000

SUPABASE_URL=http://localhost:8000
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mydb?schema=public
```

## Run with Docker

**Development:**
```sh
docker compose -f docker-compose.yaml up --build
```

**Production:**
```sh
docker compose -f docker-compose.prod.yaml up --build
```

The dev container runs `scripts/start.dev.sh` which:
1. Generates Prisma client
2. Deploys migrations
3. Seeds Supabase users
4. Starts the app in watch mode

## Run Locally (no Docker)

```sh
npm install
npm run start:dev
```

## Useful Commands

```sh
npm run db:migrate          # create a new Prisma migration
npm run db:migrate:deploy   # deploy migrations
npm run db:seed             # seed Supabase users
npm run db:studio           # open Prisma Studio
npm run swagger:ts          # generate TS API client from swagger.json
```

## Seeded Users

| Email | Password | Role |
|---|---|---|
| superadmin@example.com | password123 | SUPERADMIN (roleId 1) |
| admin@example.com | password123 | ADMIN (roleId 2) |
| user@example.com | password123 | USER (roleId 3) |

## Adding Your Own Tables

1. Add models to `prisma/schema.prisma`
2. Run `npm run db:migrate`
3. Inject `PrismaService` in your NestJS service

## Swagger

Available at `http://localhost:6001/api` when the server is running.
After adding endpoints, run `npm run swagger:ts` and copy `src/api/myApi.ts` to your frontend.
