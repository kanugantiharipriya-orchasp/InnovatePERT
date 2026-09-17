# InnovatePERT Frontend — Run Doc

## Reproduce uncommitted artifacts

- **Dependencies**: install with npm — `npm install` (creates `node_modules` from `package-lock.json`).
- **Env files**: none required. The app falls back to hardcoded API URLs
  (`http://localhost:8080` etc.) when `VITE_API_BASE_URL` is absent; no `.env.local` needed.
- **No build artifacts** are required to run the dev server (only needed for `npm run build`).

## Run the server

```bash
npm run dev
```

- Default port: **5173** (Vite).
- If 5173 is busy (another thread may own it), run on a free port:
  `npm run dev -- --port 5174 --strictPort`.
- Start detached with logs, then wait until the URL answers HTTP 200 before
  registering the preview.

## Notes

- Protected routes (`/admin/*`, `/project-manager/*`) require a token + role in
  `localStorage`; without them the app redirects to `/`.
- The backend API is not part of this repo — dashboard data requires the backend
  at the hardcoded `API_BASE` addresses.
