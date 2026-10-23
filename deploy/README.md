# VPS deployment

Ubuntu host with Docker Compose and host Nginx. Frontend and backend ship independently.

1. Clone `backend/` (or the split `cheslax-be` repo) and `frontend/` (or `cheslax-fe`).
2. Copy `backend/.env.example` to `backend/.env` and set `POSTGRES_PASSWORD`, `ConnectionStrings__Default`, and `Cors__Origins`.
3. `cd backend && docker compose build && docker compose run --rm api -- --migrate && docker compose up -d`
4. `cd frontend && npm ci && npm run build` and copy `dist/` to `/var/www/cheslax`
5. Install `nginx/cheslax.conf`, replace `example.com`, obtain certificates (`certbot`).
6. `curl https://example.com/health`
7. Update API: rebuild/tag `cheslax-api`, migrate once, `docker compose up -d api`
8. Update frontend: rebuild `dist/` only; reload Nginx. No API rebuild.
9. Rollback API: retag the previous image. Rollback data: `pg_restore` from `pg_dump`.
10. Postgres is not published. Dump with `docker compose exec postgres pg_dump ...`

See `backend/README.md`, `frontend/README.md`, and `docs/repository-split.md`.
