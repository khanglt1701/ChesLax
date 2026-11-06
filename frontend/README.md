# Cheslax Lite

Static React 19 + Vite 7 app for playing Cheslax games on one device. It does not use a backend, accounts, SignalR, or a database. Preferences and local match stats stay in `localStorage` under the `cheslax_lite_` prefix.

The full Cheslax app remains on `main`. This branch is the lightweight version.

## Requirements

- Node.js 20+

## Local development

```bash
npm install
npm run dev
```

Vite serves the app on port 5173. No API process is required.

```bash
npm run typecheck
npm test
npm run build
npm run preview
```

## Deploy on Vercel

1. Push this branch.
2. In Vercel, import the repository.
3. Set **Root Directory** to `frontend`.
4. Framework preset: Vite. Build command: `npm run build`. Output directory: `dist`.
5. Do not add `VITE_API_URL` or any backend environment variable.
6. Deploy. `vercel.json` rewrites unknown paths to `index.html` so client-side routes survive refresh.

Direct links such as `/games/chess` and `/settings` must open without a server redirect.

## What is stored locally

| Key | Contents |
| --- | --- |
| `cheslax_lite_players` | Display names |
| `cheslax_lite_theme` | Light or dark |
| `cheslax_lite_chess_appearance` | Board and piece set |
| `cheslax_lite_chess_settings` | Chess opponent, level, clock |
| `cheslax_lite_caro_settings` | Caro opponent and level |
| `cheslax_lite_co_tuong_settings` | Cờ tướng opponent and level |
| `cheslax_lite_co_ganh_settings` | Cờ Gánh opponent and level |
| `cheslax_lite_oanquan_theme` | Ô ăn quan board theme |
| `cheslax_lite_stats` | Local win/draw counts and recent results |
| `cheslax_lite_imposter_session` | Current Kẻ giả mạo session (`sessionStorage`) |

Missing or corrupt values fall back to defaults. The app still runs if storage is blocked.
