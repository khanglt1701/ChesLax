# Cheslax Lite

Static React 19 + Vite 7 app. One-device play, AI, and local stats do not need an account or a database. Two-device rooms use Firebase Realtime Database. Preferences stay in `localStorage` under the `cheslax_lite_` prefix.

The full Cheslax app remains on `main`. This branch is the lightweight version.

## Requirements

- Node.js 20+

## Local development

```bash
npm install
npm run dev
```

Vite serves the app on port 5173. One-device play and AI work without Firebase. Copy `.env.example` to `.env` and fill in the Firebase web config before using two-device rooms.

```bash
npm run typecheck
npm test
npm run build
npm run preview
```

## Deploy on Vercel

1. Push this branch.
2. In Vercel, import the repository.
3. This repository is the Vite app, so leave **Root Directory** empty. Build command: `npm run build`. Output directory: `dist`.
4. Add the `VITE_FIREBASE_*` variables from `.env.example`. Do not add an API URL.
5. In Firebase Authentication, enable Anonymous sign-in and add the Vercel domain to Authorized domains.
6. Publish `database.rules.json` in the Realtime Database rules editor.
7. Deploy. `vercel.json` rewrites unknown paths, including `/play/:game/:code`, to `index.html`.

Direct links such as `/games/chess` and `/settings` must open without a server redirect.

## What is stored locally

| Key | Contents |
| --- | --- |
| `cheslax_lite_recent_room` | Last online room code |
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
