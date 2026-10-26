# Cheslax frontend

React 19 + Vite 7 SPA for Cheslax. Builds to static files. Production serving is Nginx.

This repository does not include the ASP.NET API. Point it at a running Cheslax API.

## Requirements

- Node.js 20+

## Local development

```bash
cp .env.example .env
npm install
npm run dev
```

Vite listens on port 5173 and proxies `/api`, `/hubs`, `/health`, and `/swagger` to `http://127.0.0.1:5080` (override with `VITE_DEV_API_PROXY`).

Leave `VITE_API_URL` empty in development so the proxy (same origin) is used. Cookies stay first-party.

```bash
npm run typecheck
npm run build
npm run preview
```

## API URL

| Mode | `VITE_API_URL` | How the browser talks to the API |
| --- | --- | --- |
| Local Vite | empty | Proxy to `127.0.0.1:5080` |
| Production behind Nginx | empty | Same-origin `/api` and `/hubs` |
| Split hosts (not recommended) | `https://api.example.com` | CORS + credentialed cookies; API must list this origin |

`VITE_*` values are **embedded in public JavaScript** at build time. Never put database passwords, cookie keys, or other secrets in them.

SignalR uses `${VITE_API_URL}/hubs/game` (or `/hubs/game` when empty).

## Production (static + Nginx)

Preferred on a 4 GB VPS: build once, copy `dist/` to the host, let host Nginx serve files and proxy API. Frontend-only updates do not rebuild the API.

```bash
npm ci
npm run build
# copy dist/ to /var/www/cheslax
```

Host Nginx example: `deploy/nginx/cheslax.conf`. Container Nginx: `nginx.conf`. Both:

- SPA fallback (`try_files ... /index.html`)
- `/api/` reverse proxy
- `/hubs/` WebSocket upgrade for SignalR
- `/health` proxy

HTTPS: terminate TLS at Nginx (Let's Encrypt). Do not put certificates in this image.

### Optional frontend container

Only if you want Nginx in Docker next to the API (same Compose network `cheslax_cheslax_internal`). Start the backend stack first, then this compose file — not `docker run`, which lands on the default bridge and cannot resolve `api`:

```bash
# from backend/
docker compose up -d

# from frontend/
docker compose up -d --build
```

Then proxy 443 → `127.0.0.1:8088` on the host, or replace this with host Nginx to save RAM.

## Jenkins (production)

`Jenkinsfile` builds the SPA image and runs this Compose file on a Linux Docker agent.

1. Deploy the API stack first so network `cheslax_cheslax_internal` exists.
2. Optional: `/etc/cheslax/frontend.env` or Jenkins **File** credential `cheslax-fe-env`. Leave `VITE_API_URL` empty for same-origin `/api`.
3. New Pipeline job → this repo → Script Path `Jenkinsfile` (use `frontend/Jenkinsfile` in the monorepo).
4. On `main`: typecheck → build `cheslax-web` → `compose up -d` → `GET http://127.0.0.1:8088/`. Failed deploys roll back to `cheslax-web:previous`.
