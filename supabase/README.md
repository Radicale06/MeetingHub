# Supabase — Self-Hosted

Self-hosted Supabase via Docker Compose. Provides Auth, PostgreSQL, PostgREST, Storage, Realtime, and Studio.

## Setup

1. Copy `.env.example` to `.env` and fill in all secrets (JWT secret, passwords, keys).
2. Create the shared Docker network (once):
   ```sh
   docker network create network
   ```
3. Start Supabase:
   ```sh
   docker compose up -d
   ```

## Services

| Service | URL |
|---|---|
| Studio (dashboard) | http://localhost:8000 |
| API (Kong gateway) | http://localhost:8000 |
| PostgreSQL | localhost:5432 |

## Reset

**Linux/macOS:**
```sh
./reset.sh
```

**Windows:**
```bat
reset.bat
```

Stops all containers and removes all Supabase data volumes. Use to start fresh.

## Update

```sh
docker compose pull
docker compose down
docker compose up -d
```

Review [CHANGELOG.md](./CHANGELOG.md) for breaking changes before updating.

## Security

The default config is **not production-ready**. Before going live:
- Replace all default passwords and secrets in `.env`
- Generate new JWT secrets
- Review CORS settings
- Set up a secure reverse proxy

See: https://supabase.com/docs/guides/self-hosting/docker#configuring-and-securing-supabase
