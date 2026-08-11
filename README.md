# Pyramid — Task Management System

A production-grade task management app built for the AbleSpace Full Stack Developer technical assessment, implementing the provided Figma design: Kanban board + list views, task detail with subtasks/comments/activity, projects, Google OAuth + Guest login, and a persistent theme system (light/dark × six accent colors).

**Live demo:** _URL added at deployment_ · **API docs (Swagger):** `<backend-url>/api/docs`

| | |
|---|---|
| Frontend | Next.js 16 (App Router), Tailwind CSS v4, shadcn/ui, TanStack Query, react-hook-form + zod, dnd-kit |
| Backend | NestJS 11, Prisma 6, PostgreSQL, Passport (Google OAuth 2.0 + JWT), Swagger |
| Language | TypeScript everywhere, strict mode in both apps |

### What's in it

- **Two views of the same data** — a drag-and-drop Kanban board (columns reorder and collapse, both persisted) and a status-grouped list, with the visible fields chosen per view.
- **Task detail** — inline title editing, labels, attached resources, a subtasks table, threaded comments and an activity feed that records status and priority changes.
- **Find and filter** — ⌘F search over titles and descriptions, plus filters for status, priority, member, label and reporter.
- **Guided tour** — a spotlight walkthrough runs once per account and is replayable from the topbar help menu, alongside a keyboard-shortcut reference.
- **Theming** — light/dark × six accent colors, persisted and applied before hydration so there's no flash of the wrong theme.

**Guest vs. real accounts:** *Continue as Guest* creates a throwaway account pre-filled with the demo workspace from the Figma, so the design is visible immediately. Signing in with Google creates an **empty** workspace — the app's empty states guide you to your first project and task. The sidebar reminds guests that their workspace is temporary.

---

## Running locally

Prerequisites: Node 20+, Docker (for Postgres).

```bash
# 1. Postgres
docker compose up -d

# 2. Backend  → http://localhost:4000  (Swagger at /api/docs)
cd backend
cp .env.example .env        # then edit: set JWT secrets (any random strings) and,
                            # optionally, Google OAuth credentials (see below)
npm install
npx prisma migrate dev      # applies migrations
npm run seed                # global demo members + labels (idempotent)
npm run start:dev

# 3. Frontend → http://localhost:3000
cd ../frontend
cp .env.example .env        # defaults are correct for local dev
npm install
npm run dev
```

Then open http://localhost:3000 and choose **Continue as Guest** — that creates an isolated demo workspace matching the Figma content, so the app looks like the design straight away. (Google sign-in starts you empty; see *Guest vs. real accounts* above.)

### Tests

```bash
cd backend && npm run test:e2e   # requires the docker Postgres to be up
```

The e2e suite covers guest auth, cookie issuance, demo seeding for guests, empty workspaces for Google accounts, DTO validation, task CRUD/move, cross-tenant isolation (user B gets 404s for user A's tasks), refresh-token rotation with reuse detection, and logout revocation.

---

## Google OAuth setup

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → **Create OAuth client ID** (type: *Web application*).
2. Authorized redirect URI (local): `http://localhost:3000/api/auth/google/callback`
   (For production, the same path on the deployed frontend origin — see Deployment.)
3. Put the client ID/secret into `backend/.env` (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) and set `GOOGLE_CALLBACK_URL` to the URI from step 2.

Note the redirect URI points at the **frontend** origin: the Next.js server proxies `/api/*` to NestJS (below), which keeps the OAuth callback and auth cookies first-party. Without credentials configured, the Google button redirects back to the login page with a friendly error; Guest login always works.

## Architecture

```
┌──────────────┐   /api/* rewrite    ┌──────────────┐        ┌────────────┐
│   Next.js    │ ──────────────────▶ │    NestJS    │ ─────▶ │  Postgres  │
│  (App Router)│   (same-origin      │  (REST API)  │ Prisma │            │
└──────────────┘    cookie proxy)    └──────────────┘        └────────────┘
```

**Same-origin API proxy.** The browser only ever talks to the frontend origin; `next.config.ts` rewrites `/api/*` to the NestJS server. Auth cookies are therefore always first-party (`SameSite=Lax`, `httpOnly`, `Secure` in prod) — no cross-site cookie workarounds, no CORS complexity in the browser, and the Next.js proxy (`src/proxy.ts`) can gate routes by session cookie at the edge.

**Auth.** Google OAuth (passport-google-oauth20) and Guest login are separate flows that converge on the same session mechanics: short-lived access JWT (15 min) + rotating refresh JWT (7 days, unique `jti`), stored in httpOnly cookies. The SHA-256 hash of the current refresh token is stored per-user; presenting a stale refresh token (reuse) revokes the whole session, and logout nulls the hash which also invalidates outstanding access tokens immediately. The frontend API client transparently refreshes once on a 401 and retries.

**Workspace model.** Every user owns an isolated workspace: their projects/tasks are scoped by `ownerId` on every query. Assignable "members" (Admin, Designer, QA Team, …) are shared demo personas seeded globally — they can be assigned to tasks but can never log in (`isDemo`). Subtasks are tasks with a `parentId`; board ordering uses fractional `position` keys so drag-and-drop is a single-row update.

**Frontend state.** TanStack Query owns all server state (one typed API client in `src/lib/api.ts`, hooks in `src/hooks/use-api.ts`); drag-and-drop uses an optimistic cache update with rollback on error. View preferences (List/Board, visible fields) and theming persist in `localStorage`; the accent color is applied by an inline script before hydration so there is no flash of the wrong theme.

### Folder structure

```
backend/
  prisma/            # schema, migrations, CLI seed
  src/
    auth/            # controller, service, google/jwt/refresh strategies, guards
    users/ projects/ tasks/ labels/   # one module per domain, DTO-validated
    seed/            # demo-workspace seeding (shared by signup + CLI)
    prisma/ common/  # Prisma service, exception filter, decorators
  test/              # supertest e2e suite
frontend/
  src/
    app/             # routes: login, (app)/{tasks,projects}, settings, error/404
    components/
      ui/            # shadcn/ui primitives (Button, Dialog, Table, Sidebar, …)
      tasks/         # board, list, detail, pickers, dialogs — reused everywhere
      projects/ providers/
    hooks/ lib/      # query hooks, typed API client, types, utils
  src/proxy.ts       # route protection (Next 16 middleware)
```

## Environment variables

### `backend/.env`

| Variable | Purpose |
|---|---|
| `PORT` | API port (default 4000) |
| `NODE_ENV` | `development` / `production` (controls Secure cookies) |
| `FRONTEND_URL` | Frontend origin — CORS + OAuth redirect target |
| `DATABASE_URL` | Postgres connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Signing secrets (`openssl rand -base64 32`) |
| `JWT_ACCESS_TTL` / `JWT_REFRESH_TTL` | Token lifetimes (default `15m` / `7d`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth client credentials (optional locally) |
| `GOOGLE_CALLBACK_URL` | Registered redirect URI (frontend origin + `/api/auth/google/callback`) |
| `COOKIE_DOMAIN` | Usually empty; set only for a shared apex domain |

### `frontend/.env`

| Variable | Purpose |
|---|---|
| `API_URL` | NestJS origin the server-side proxy forwards `/api/*` to |

## Deployment

Target: **Vercel** (frontend) + **Render** (backend web service + managed Postgres). Railway works identically.

1. **Postgres (Render):** create a Postgres instance, copy the *internal* connection string.
2. **Backend (Render web service):** root dir `backend`, build `npm ci && npx prisma generate && npm run build`, pre-deploy `npx prisma migrate deploy`, start `npm run start:prod`. Set every backend env var above (`NODE_ENV=production`, `FRONTEND_URL=https://<app>.vercel.app`, `GOOGLE_CALLBACK_URL=https://<app>.vercel.app/api/auth/google/callback`).
3. **Frontend (Vercel):** root dir `frontend`, framework Next.js, env `API_URL=https://<backend>.onrender.com`.
4. **Google Cloud Console:** add `https://<app>.vercel.app/api/auth/google/callback` to the OAuth client's authorized redirect URIs.
5. Seed once: `npm run seed` against the production `DATABASE_URL` (or rely on first-login seeding, which also upserts the globals).

### Troubleshooting: signed in with Google but bounced back to `/login`

Symptom: the Google consent screen works, you land back on the app, and every
API call returns `401`.

Cause: `GOOGLE_CALLBACK_URL` (and the URI registered in Google) points at the
**API** origin instead of the **frontend** origin. The browser only ever talks
to the frontend, which proxies `/api/*` to NestJS, so the callback must go
through that proxy for the session cookie to be set on the frontend's domain. A
callback sent straight to the API host sets the cookie on the API's domain, and
the browser will never send that cookie back to the frontend.

```
wrong  https://<backend>.onrender.com/api/auth/google/callback
right  https://<app>.vercel.app/api/auth/google/callback
```

Fix it in three places, then redeploy the backend: the Google Console redirect
URI, `GOOGLE_CALLBACK_URL` on the backend, and — while you are there — make sure
`FRONTEND_URL` has **no trailing slash** (a trailing slash yields a `//tasks`
redirect and a CORS origin that can never match a real `Origin` header).

To confirm which callback is live, check the `redirect_uri` the API hands to
Google:

```bash
curl -sI https://<app>.vercel.app/api/auth/google | tr '&' '\n' | grep redirect_uri
```

**45-day availability notes:** Vercel Hobby and Render free Postgres stay up well past 45 days (Render free Postgres expires after 90). Render free *web services* sleep after inactivity — the first request may take ~50s to cold-start; a paid instance or an uptime pinger avoids this. No other free-tier limits apply at this app's scale.

## Intentional deviations from the Figma

Documented per the assessment brief; everything else follows the design as closely as possible.

- **Placeholder content replaced with coherent data.** The mock repeats identical rows in every list group ("Design Homepage / Develop Login Feature / Test Payment Gateway" three times) and duplicates chips ("Deployment Deployment", two "Members" toggles in Fields, a comment reading "dsds"). The seed uses the same names/dates but as one consistent workspace: the board tasks are the source of truth, the three project rows exist once as projects (and as that project's tasks), and the demo comment is realistic.
- **Multiplayer cursors** ("Ankita Sharma", "Ritik Rawat") are Figma collaboration artifacts, not app features — not implemented.
- **Detail-page status.** The mock's board shows the task in "To Do" while its detail shows "Backlog"; seeded tasks use their board column status ("Backlog" remains an available status).
- **Second "Subtasks" heading** above the comment thread in the mock is labeled **Comments** here.
- **Teams** appears in the Details sidebar and filter menu of the mock but has no data model in this scope — the Details row renders "—" and it's omitted from filters.
- **Log out** was added to the user menu (the mock shows no way to end a session).
- **Avatars.** The mock's cartoon avatars are replaced with DiceBear-generated ones (same visual role); Google users get their real profile photo, guests get initials — matching the mock's "CN" initials pattern.
- **Fields defaults** show Labels on the board cards (as the mock's board does); toggling Labels off in Fields reproduces the mock's exact list-view columns.
- **Additions beyond the mock**, added because shipping them felt more honest than leaving dead UI or an unexplained first run: the column drag handle and column "…" menu are wired to real behaviour (reorder / collapse) rather than being decorative; a help menu in the topbar hosts the product tour and keyboard shortcuts; and the sidebar shows guests a note that their workspace is temporary.

## Assessment mapping

- **Part 1** — this repository (design fidelity, theme persistence, guest login, reusable components, NestJS APIs with validation, responsive across desktop/tablet/mobile).
- **Part 2** — the AbleSpace "Take Data" workflow write-up is submitted as a separate document alongside this repo.
