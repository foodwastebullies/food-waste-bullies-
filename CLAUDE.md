# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (tsx server.ts) — runs both Express API and Vite frontend
npm run build     # Build production frontend bundle
npm run lint      # Type-check only (tsc --noEmit), no test runner configured
npm run clean     # Remove dist/
```

## Architecture

This is a full-stack household food management app ("FridgeShare") with a single-server setup:

- **`server.ts`** — Express backend that serves the REST API and, in development, uses Vite as middleware (so `npm run dev` runs everything from one process). In production it serves the built `dist/` folder.
- **`src/App.tsx`** — Single large React component containing all views (food list, user management, login). State is managed locally with `useState`/`useEffect` and all data fetching uses `fetch()` against the Express API.
- **`src/types.ts`** — Shared TypeScript interfaces (`User`, `Fridge`, `FoodItem`).
- **`src/slack-utils.ts`** — Slack webhook helper (sends formatted messages); Slack calls in `App.tsx` are currently commented out.

## Backend / Database

SQLite via `better-sqlite3`. The database file (`fridge.db`) is created at startup if it doesn't exist. Tables: `users`, `fridges`, `food_items`. Seed data (admin user, two housemates, five fridges) is inserted on first run.

All API routes are in `server.ts` under the `/api` prefix:
- `GET/POST /api/users`, `POST /api/login`
- `GET /api/fridges`
- `GET/POST /api/food-items`, `PATCH /api/food-items/:id/claim`, `DELETE /api/food-items/:id`

## Environment Variables

Create `.env.local` in the project root:

```
GEMINI_API_KEY=   # Google Gemini API key (exposed to frontend via vite.config.ts define)
SLACK_WEBHOOK_URL= # Optional — Slack incoming webhook URL
APP_URL=          # Optional — used in AI Studio context
JWT_SECRET=       # Secret for signing JWTs — set a strong value in production
```

`DISABLE_HMR=true` disables Vite hot module replacement (used in AI Studio).

## Key Conventions

- ES Modules throughout (`"type": "module"` in package.json).
- `tsx` is used to run `server.ts` directly in dev (no compile step).
- Vite is loaded programmatically inside `server.ts` in dev mode; the same file handles production static serving.
- Food item images use Picsum Photos (random image seeded by item `id`).
- Authentication: `POST /api/login` validates name + email, returns a signed JWT (7-day expiry). The token is stored in `localStorage` and sent as `Authorization: Bearer <token>` on every request. `GET /api/me` validates the token and returns the current user. All `/api/*` routes except `/api/login` require the token. `JWT_SECRET` defaults to a dev value — override in production.
