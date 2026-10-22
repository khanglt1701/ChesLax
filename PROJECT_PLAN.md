# Cheslax — Project Plan

**Play. Relax. Repeat.**

This document is the implementation map for turning the existing Cheslax Vite/React app (local chess, Ô ăn quan, guest ratings, and a Node/Socket.IO multiplayer prototype) into a production-minded full-stack platform: ASP.NET Core + SignalR + PostgreSQL, with a server-authoritative online game.

---

## Current repository (inspected 2026-10-22)

### Already working (preserve)

| Area | Location | Notes |
| --- | --- | --- |
| React 19 + Vite 7 + Tailwind 4 + TypeScript strict | `src/`, `vite.config.ts` | Keep at repo root |
| Local chess (`chess.js`) | `src/games/chess/` | Legal moves, promotion, clocks, AI, undo/reset, flip |
| Local Ô ăn quan engine | `src/games/o-an-quan/` | Independently tested rules |
| 15 ranks + Elo K=32 | `src/ranking/` | Thresholds already match the product spec |
| Design tokens, board/piece themes | `src/styles/index.css` | Wood / marble / modern; Fantasy SVG set (MIT) |
| Guest profile + local stats | Zustand stores | Must not block guests from local play |
| Node/Socket.IO prototype | `server/` | **Deprecated.** Replaced in Phase 6. Kept runnable until SignalR ships |

### Missing vs the product spec

- ASP.NET Core Web API, SignalR, EF Core, PostgreSQL
- Real authentication (register / login / logout / profiles)
- Server-side C# chess and Ô ăn quan engines
- Persistent matches, rating history, leaderboards from the database
- Routes: `/login`, `/register`, `/settings`, `/profile/:username`, `/play/:gameType/:roomCode`
- i18n message files (Vietnamese first)
- TanStack Query, Playwright
- Linux VPS / Nginx / HTTPS deployment
- Chess time controls `1+0`, `3+0`, `3+2`, `5+0`, `10+0` with increment
- Extra board themes (dark walnut, light ivory, green tournament)
- Extra Ô ăn quan themes (stone, minimal modern)
- Draw offer / rematch as first-class online commands

### Repository layout decision

The existing Vite app already lives at the repository root (`src/`, `public/`, `package.json`). Moving it into `frontend/` would break aliases, scripts, and a working tree for no runtime benefit.

**Keep the React app at the repo root. Add `backend/` for the .NET solution.** This is the documented alternative to the suggested `frontend/` + `backend/` split.

```text
cheslax/
├── src/                          # React + TypeScript frontend
├── public/
├── backend/
│   ├── Cheslax.sln
│   ├── src/
│   │   ├── Cheslax.Api
│   │   ├── Cheslax.Application
│   │   ├── Cheslax.Domain
│   │   ├── Cheslax.Infrastructure
│   │   └── Cheslax.GameEngine
│   └── tests/
│       ├── Cheslax.UnitTests
│       └── Cheslax.IntegrationTests
├── deploy/
├── docs/
├── PROJECT_PLAN.md
└── README.md
```

The Node `server/` directory is removed at the end of Phase 6.

---

## Architecture

Modular monolith. One ASP.NET Core process. One PostgreSQL database. No Redis until a second API instance is actually needed for SignalR scale-out.

```text
Browser
  │  HTTPS (prod) / Vite (dev)
  ├─ React static UI
  ├─ HTTP  /api/*        → Cheslax.Api controllers
  └─ WS    /hubs/game    → GameHub (SignalR)
                              │
                              ├─ Application services (rooms, matches, ratings, auth)
                              ├─ GameEngine (chess + Ô ăn quan, pure C#)
                              └─ Infrastructure (EF Core, Identity, file/avatar store)
                                    └─ PostgreSQL
```

### Layer rules

- **Cheslax.Domain** — entities, enums, value objects. No ASP.NET, no EF attributes beyond what Infrastructure needs mapped in `IEntityTypeConfiguration`.
- **Cheslax.GameEngine** — deterministic rules. No I/O, no SignalR, no DbContext.
- **Cheslax.Application** — use cases, DTOs, interfaces (`IGameEngine`, `IRoomService`, `IRatingService`). FluentValidation validators.
- **Cheslax.Infrastructure** — EF Core, Identity, repositories, clock, room persistence.
- **Cheslax.Api** — controllers, `GameHub`, middleware, DI composition, rate limits, CORS, health, OpenAPI.

Game rules never live in React components, controllers, or hub methods. The browser may use `chess.js` and the TypeScript Ô ăn quan engine for instant local feedback. Online, the server re-validates every command.

### Important defaults

| Topic | Decision |
| --- | --- |
| .NET | **net10.0** (current LTS on this machine; SDK 10.0.401). Runtime 8.0 is also installed but 10 is the current LTS as of 2026. |
| Auth | ASP.NET Identity + **HttpOnly cookie** (`cheslax.auth`). SameSite=Lax. Secure in production. Sliding 14-day session. No refresh-token store. SPA 401/403 instead of login redirects. |
| SignalR auth | Same cookie; hub `[Authorize]` for rated play. Guests may explore and play local games only. |
| Chess library | **pax.chess** (.NET 10, FEN, legal moves, clocks). Wrapped by `IChessEngine`. |
| Ô ăn quan | C# port of the existing TypeScript engine. Same ruleset documented in `docs/o-an-quan-rules.md`. |
| Game type ids | `chess`, `o-an-quan` |
| Room codes | 6-character Crockford Base32, normalized uppercase, unique among active rooms |
| Time controls | `1+0`, `3+0`, `3+2`, `5+0`, `10+0`, plus `off` for unrated casual |
| Clocks | Server timestamps + remaining ms. Client clocks are display-only. |
| Idempotency | Per-room `Version` / move sequence. Duplicate commands return the current state, not a second rating update. |
| Concurrency | Per-room `SemaphoreSlim` plus EF `xmin`/row version on `GameMatch`. |
| Ratings | Elo K=32, start 1000, computed only on the server, one update per `MatchId`. |
| Leaderboard | Database query, paginated. No demo rows in production. |
| Avatars | Preset ids (`seal-1` … `seal-8`). No arbitrary file uploads in v1 (XSS/content-type risk). |
| i18n | Vietnamese message dictionaries in `src/i18n/vi.ts`. `t(key)` helper. English file can be added later. |
| Dev database | **SQL Server Express** `.\SQLEXPRESS`, database `Cheslax`, Windows auth. Integration tests still use SQLite. |
| Node server | Transitional only. Removed when SignalR rooms are production-ready. |
| Redis | Not used. |

### Auth token policy (cookie design)

- Cookie name: `cheslax.auth`
- HttpOnly, SameSite=Lax, path `/`
- Secure flag: true when `ASPNETCORE_ENVIRONMENT=Production`
- Sliding expiration 14 days
- CORS: explicit origins, `AllowCredentials`
- CSRF: SameSite=Lax is sufficient for the first deployment (no cross-site POSTs expected). Antiforgery can be added if a third-party origin is ever allowed.
- Passwords hashed by ASP.NET Identity (PBKDF2 / current Identity hasher)
- Never log passwords, cookies, or tokens

### SignalR contract (Phase 6)

Hub path: `/hubs/game`

**Client → server:** `JoinRoom`, `LeaveRoom`, `MakeMove`, `Resign`, `OfferDraw`, `RespondToDraw`, `RequestRematch`, `RequestGameState`

**Server → client:** `RoomJoined`, `PlayerJoined`, `PlayerDisconnected`, `GameStarted`, `MoveAccepted`, `MoveRejected`, `GameStateUpdated`, `ClockUpdated`, `DrawOffered`, `GameFinished`, `RatingUpdated`, `ErrorOccurred`

Documented in `docs/signalr-protocol.md` when the hub lands.

### Recovery policy

- Active rooms and in-progress matches are persisted (state snapshot + move list + clock remaining + last timestamp).
- After a backend restart, in-progress matches reload; clocks pause until both players reconnect, then resume from remaining time.
- Disconnect grace: 3 minutes. If a seated player never returns, the opponent wins by abandonment (rated, unless the match had not started).
- Abandoned waiting rooms expire after 2 hours idle.

---

## Phases

| Phase | Status | Goal |
| --- | --- | --- |
| 1 Foundation | **done** | .NET 10 solution, health, Swagger, SQLite/Npgsql config, frontend still builds |
| 2 Visual + routes | **done** | i18n dictionaries, `/login` `/register` `/settings` `/profile/:username` `/play/:gameType/:roomCode` |
| 3 Local chess | **done** | Time controls `1+0`…`10+0` with increment, extra board themes |
| 4 Local Ô ăn quan | **done** | `docs/o-an-quan-rules.md`, C# engine + tests, stone/modern themes |
| 5 Auth + database | **partial** | Cookie Identity, register/login/logout/`/api/users/me`. Match tables/migrations still to add |
| 6 SignalR multiplayer | **resume here** | Authoritative rooms, replace Node/Socket.IO |
| 7 Ratings | pending | DB leaderboards, history, duplicate-finalization tests |
| 8 UX polish | pending | Reconnect UI, a11y, empty/error states |
| 9 Linux deploy | started | `deploy/nginx`, `deploy/docker-compose.yml` drafted |
| 10 Verification | pending | All tests, production builds, README, report |

After each phase: frontend `npm test` + `npm run build`, backend `dotnet test` + `dotnet build`. Fix failures before starting the next phase.

---

## Acceptance criteria (definition of done)

See the product brief §20. In short: both games playable locally; two browsers can play a real online game; server validates moves and ratings; reconnect restores state; deployable behind Nginx with working WebSockets.

---

## Known limitations (v1)

- Single API instance. No Redis backplane.
- Preset avatars only (no user-uploaded images).
- No spectators.
- Local vs-AI chess ratings stay on-device until/unless we add a dedicated AI opponent identity.
- Cheating via two accounts or engine assistance is not prevented. Documented in `docs/security.md`.
- This development PC cannot run PostgreSQL until Docker or a Postgres install is available; SQLite is the local stand-in.

---

## Resume pointer

**Resume at Phase 6 — SignalR multiplayer.**

The Node `server/` Socket.IO prototype still runs for current online games. Replace it with `GameHub` at `/hubs/game`, persist rooms/matches, then delete `server/`. Ratings currently mix localStorage (local/AI) and the Node JSON file (online). Move rated online results to EF Core after the hub lands.

Auth that already works:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET`/`PUT /api/users/me`
- `GET /api/users/{username}` (no email)

Cookie: `cheslax.auth`, HttpOnly, SameSite=Lax.
