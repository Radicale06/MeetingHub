[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue)](https://www.linkedin.com/in/hassenamri005/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

# React TypeScript Boilerplate

A React 18 + TypeScript boilerplate with role-based routing, persistent Redux auth state, Ant Design UI, and Docker.

Clone it, add your pages and routes — auth, routing guards, and state management are already set up.

## Stack

- **React 18**, TypeScript, Vite
- **Node 20**
- **Ant Design 5** — UI components with custom theme
- **Redux Toolkit + redux-persist** — auth state survives page refresh
- **React Router 7** — role-based routing
- **@supabase/supabase-js** — Supabase client for storage, realtime, etc.
- **Docker** — dev (Vite) and prod (Nginx) via Docker Compose profiles

## Auth Flow

Auth is handled by the backend (`/auth/*` endpoints). The frontend:
1. Calls `POST /auth/login` → receives `{ accessToken, refreshToken, user: { id, email, roleId } }`
2. Stores tokens and user in Redux (persisted across refresh)
3. Routes to the correct dashboard based on `roleId` (2 = Admin, 3 = User)

## Prebuilt Pages

- Landing page (`/`)
- Login page (`/login`)
- Admin Dashboard (`/admin/dashboard`)
- User Dashboard (`/user/dashboard`)
- Unauthorized / fallback

## Routes

| Path | Access |
|---|---|
| `/` | Public — Landing page |
| `/login` | Public — Login |
| `/user/dashboard` | Private — roleId 3 (User) |
| `/admin/dashboard` | Private — roleId 2 (Admin) |
| `*` | Fallback |

## Add a New Route

1. Create your page in `src/pages/`
2. Register the path in `src/utils/routes_name.ts`
3. Add the route in `App.tsx` inside the appropriate guard (public or private)

## Environment

Copy `.env.example` to `.env`:

```env
VITE_BACKEND_API_URL=http://localhost:6001
VITE_SUPABASE_URL=http://localhost:8000
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Run with Docker

**Development:**
```sh
docker compose --profile dev up --build
```

**Production:**
```sh
docker compose --profile prod up --build
```

## Run Locally (no Docker)

```sh
npm install
npm run dev
```

App runs at `http://localhost:3000`.
