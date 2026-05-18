# RBAC Frontend — Next.js Dashboard & Portal

Next.js 16 (App Router) client for the RBAC platform: permission-driven navigation, middleware route gates, JWT session handling, and feature modules for staff (dashboard) and customers (portal).

**Demo logins:** [../README.md](../README.md#demo-credentials-start-here)

---

## Demo credentials (quick reference)

| Email | Password | Experience |
|-------|----------|------------|
| `admin@example.com` | `Admin123@` | Full sidebar — all modules |
| `manager@example.com` | `Manager123!` | Team users + permission grants |
| `agent1@example.com` | `Agent123!` | Leads, tasks, reports (seed overrides) |
| `agent2@example.com` | `Agent123!` | Dashboard only until manager grants more |
| `customer@example.com` | `Customer123!` | Redirects to `/portal` |

Login: **http://localhost:3000/login**

---

## Quick start

```bash
# 1. Install (from frontend/)
npm install

# 2. Environment
cp .env.example .env.local

# 3. Dev server (requires backend on :5000)
npm run dev
```

Open **http://localhost:3000**.

### Required environment (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
JWT_REFRESH_SECRET="same-value-as-backend-JWT_REFRESH_SECRET"
```

`JWT_REFRESH_SECRET` is used by `middleware.ts` to verify the httpOnly refresh cookie and read embedded permissions for route gating. It must **exactly match** the backend secret.

---

## What's working

### Authentication UX

- [x] Login page → stores access token in memory (Zustand) + refresh in httpOnly cookie (set by API)
- [x] Session bootstrap on load (`session-bootstrap` refreshes when needed)
- [x] Signup page (registers as customer by default)
- [x] Logout clears client state and calls API
- [x] Forgot-password page (UI placeholder — no email backend yet)

### Authorization & routing

- [x] **Middleware** (`middleware.ts`) verifies refresh JWT and checks route ↔ permission map
- [x] Unauthenticated users redirected to `/login` with safe `returnUrl`
- [x] Missing permission → `/403`
- [x] Customer role lands on `/portal`; staff on `/dashboard`
- [x] Dynamic **sidebar** built from resolved permission slugs
- [x] `npm run verify:routes` — static check that every dashboard route has a permission entry

### Feature pages

| Route | Permission | Status |
|-------|------------|--------|
| `/dashboard` | `dashboard.view` | Live (API-backed shell) |
| `/users` | `users.view` | Live — user management |
| `/permissions` | `permissions.view` | Live — matrix + assign |
| `/leads` | `leads.view` | UI demo — **localStorage** |
| `/tasks` | `tasks.view` | UI demo — **localStorage** |
| `/reports` | `reports.view` | Live shell |
| `/audit` | `audit.view` | Live — admin audit trail |
| `/settings` | `settings.view` | Live shell |
| `/portal/*` | portal atoms | Live — customer self-service |

### State & data

- [x] **Zustand** — auth user, permissions, access token
- [x] **TanStack Query** — API caching, mutations, stale-time defaults
- [x] **Axios** service layer with interceptors (attach Bearer, refresh on 401)
- [x] Set-based permission helpers (`hasPermission`) for O(1) checks

---

## Project structure

```
frontend/
├── middleware.ts              # Auth + permission route gates
├── scripts/
│   └── verify-route-permissions.ts
└── src/
    ├── app/
    │   ├── (dashboard)/       # Staff layout + modules
    │   │   ├── dashboard/
    │   │   ├── users/
    │   │   ├── permissions/
    │   │   ├── leads/
    │   │   ├── tasks/
    │   │   ├── reports/
    │   │   ├── audit/
    │   │   └── settings/
    │   ├── (portal)/          # Customer portal layout
    │   │   └── portal/
    │   ├── login/
    │   ├── signup/
    │   ├── forgot-password/
    │   └── 403/
    ├── components/
    │   ├── auth/              # Session bootstrap, forms
    │   ├── shared/            # Sidebar, layout chrome
    │   └── ui/                # shadcn-style primitives
    ├── constants/
    │   └── route-permissions.ts   # Must stay in sync with middleware
    ├── hooks/queries/         # TanStack Query hooks
    ├── services/              # API clients
    ├── store/                 # Zustand stores
    └── utils/                 # Permission helpers, safe redirects
```

---

## How route protection works

```
Request → middleware.ts
            │
            ├─ No refresh cookie / invalid JWT → redirect /login
            │
            ├─ Guest path (/login, /signup) + valid session → redirect home
            │
            └─ Protected path → getRequiredRoutePermission(pathname)
                                  │
                                  ├─ hasPermission(slug) → continue
                                  └─ else → redirect /403
```

Route map (`src/constants/route-permissions.ts`):

```typescript
'/dashboard'  → 'dashboard.view'
'/users'      → 'users.view'
'/permissions'→ 'permissions.view'
'/leads'      → 'leads.view'
// …
'/portal/tickets' → 'portal.tickets.view'
```

When adding a new page under `(dashboard)`, update **both** this map and the verify script expectations.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server (:3000) |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint (Next.js config) |
| `npm run verify:routes` | Validate route ↔ permission coverage |

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4, shadcn/radix components |
| Forms | react-hook-form + Zod |
| Server state | TanStack Query v5 |
| Client state | Zustand v5 |
| HTTP | Axios |
| JWT verify (middleware) | jose |
| Icons | lucide-react |
| Toasts | sonner |

---

## Development workflow

### Run with backend

1. Start API: `cd ../backend && npm run start:dev`
2. Start web: `npm run dev`
3. Log in with [demo credentials](../README.md#demo-credentials-start-here)

### Test permission changes

1. Log in as **manager**
2. Open **Permissions** → select **agent2**
3. Grant e.g. `leads.view`, `tasks.view`
4. Log in as **agent2** — sidebar should show new items (refresh if needed)

### Add a new protected route

1. Create `src/app/(dashboard)/your-module/page.tsx`
2. Add entry to `src/constants/route-permissions.ts`
3. Run `npm run verify:routes`
4. Ensure backend exposes APIs guarded by matching permission slug

---

## API integration

Base URL from `NEXT_PUBLIC_API_URL` (default `http://localhost:5000/api`).

Typical flow:

1. `POST /auth/login` — response includes `accessToken`; API sets `refreshToken` cookie
2. Authenticated requests send `Authorization: Bearer <accessToken>`
3. On 401, client calls `POST /auth/refresh` (cookie sent automatically)
4. `POST /auth/logout` — clears session

Service modules live under `src/services/`. Query hooks under `src/hooks/queries/`.

---

## Build & deploy

```bash
npm run build
npm run start
```

Production env:

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
JWT_REFRESH_SECRET="<production-secret-matching-backend>"
```

Ensure the API CORS origin includes your frontend URL (update `backend/src/main.ts` for non-localhost deploys).

---

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Instant redirect to login | Missing/wrong `JWT_REFRESH_SECRET` in `.env.local` |
| 403 on pages you expect | User lacks permission atom — check seed or manager grants |
| API network errors | Backend not running or wrong `NEXT_PUBLIC_API_URL` |
| Sidebar missing items | Permissions in JWT stale — log out and back in after grant changes |
| CORS errors | Backend `enableCors` origin must match frontend URL |

---

## Related docs

- [Root README](../README.md)
- [Backend README](../backend/README.md)
- [PERFORMANCE_OPTIMIZATIONS.md](../PERFORMANCE_OPTIMIZATIONS.md)
