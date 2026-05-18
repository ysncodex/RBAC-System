# RBAC System — Dynamic Role-Based Access Control

Enterprise-style permission platform: **roles are templates, permissions are atoms, and access is enforced everywhere** — API guards, middleware route gates, and a sidebar that renders only what the signed-in user may open.

| Layer      | Stack                                                                                |
| ---------- | ------------------------------------------------------------------------------------ |
| Frontend   | Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · TanStack Query · Zustand       |
| Backend    | NestJS 11 · Prisma 6 · PostgreSQL · JWT (access + refresh)                           |
| Auth model | Atom-level slugs (`users.view`, `tasks.create`, …) merged from role + user overrides |

---

## Demo credentials (start here)

Run the [Quick start](#quick-start) below once, then sign in at **http://localhost:3000/login**.

> **All passwords below are dummy values for local development only.**
> They are created by `backend/prisma/seed.ts`. Re-run `npx prisma db seed` anytime to reset them.

| Email                  | Password       | Role         | What you can explore                                                                 |
| ---------------------- | -------------- | ------------ | ------------------------------------------------------------------------------------ |
| `admin@example.com`    | `Admin123@`    | **Admin**    | Full system: all modules, all permissions, audit log, role templates, user lifecycle |
| `manager@example.com`  | `Manager123!`  | **Manager**  | Team-scoped users, grant agent overrides, leads/tasks/reports, no global audit       |
| `agent1@example.com`   | `Agent123!`    | **Agent**    | Manager has unlocked leads, tasks, and reports for this user                         |
| `agent2@example.com`   | `Agent123!`    | **Agent**    | Minimal agent — dashboard only until a manager grants more                           |
| `customer@example.com` | `Customer123!` | **Customer** | Customer portal only (tickets, orders, interactions)                                 |

### Copy-paste login blocks

**Admin (full access)**

```
Email:    admin@example.com
Password: Admin123@
```

**Manager (team lead)**

```
Email:    manager@example.com
Password: Manager123!
```

**Agent with unlocked modules (demo override)**

```
Email:    agent1@example.com
Password: Agent123!
```

**Agent with minimal access (compare sidebar)**

```
Email:    agent2@example.com
Password: Agent123!
```

**Customer portal**

```
Email:    customer@example.com
Password: Customer123!
```

**Suggested demo flow:** log in as `manager@example.com` → open **Users** / **Permissions** → grant `agent2@example.com` extra atoms → log in as agent2 and watch the sidebar update after refresh.

---

## What's working

Everything below is implemented and wired end-to-end unless noted.

### Authentication & sessions

- [x] Login, register, logout, silent refresh (`POST /api/auth/*`)
- [x] Access JWT (15 min, in memory on client) with permissions + `atv` (access-token version)
- [x] Refresh JWT in **httpOnly** cookie (7 days) with rotation on refresh
- [x] Refresh-token revocation on logout; `accessTokenVersion` bump on suspend/ban/logout invalidates stale access tokens
- [x] Login rate limiting (NestJS Throttler)
- [x] bcrypt password hashing (10 rounds)
- [x] Self-service signup defaults to **Customer** role (`SIGNUP_DEFAULT_ROLE_SLUG`)

### Authorization

- [x] Atom-level permission slugs across Users, Permissions, Dashboard, Leads, Tasks, Reports, Audit, Settings, Portal
- [x] Role templates: Admin, Manager, Agent, Customer (seeded)
- [x] Per-user permission overrides (manager → agent grant ceiling enforced)
- [x] Team scoping: managers see their subtree; admins see all (`users.view_all`)
- [x] NestJS `JwtAuthGuard` + `PermissionsGuard` on every protected API route
- [x] Next.js middleware verifies refresh cookie and gates routes by permission map

### Backend modules (REST)

- [x] **Auth** — register, login, refresh, logout
- [x] **Users** — CRUD, suspend, ban, reactivate, scoped listing
- [x] **Permissions** — grouped catalog, assign user overrides, assign role templates
- [x] **Audit** — append-only log (login, permission changes, user lifecycle, …)
- [x] **Health** — `GET /api` hello endpoint

### Frontend modules (UI)

- [x] Login / signup / forgot-password shells
- [x] Dynamic sidebar from resolved permissions
- [x] Dashboard, Users, Permissions matrix, Leads, Tasks, Reports, Settings, Audit
- [x] Customer portal (`/portal/*`) for portal permissions
- [x] 403 page when route permission is missing
- [x] Session bootstrap + React Query data layer
- [x] Route-permission verification script (`npm run verify:routes` in frontend)

### Data & seed

- [x] PostgreSQL schema via Prisma migrations
- [x] Seed script: roles, permissions, role mappings, demo hierarchy (manager → agents), demo customer

### Local-only / not yet backend-persisted

- [ ] **Leads** and **Tasks** UI data lives in browser storage (demo modules; not PostgreSQL-backed yet)
- [ ] Forgot-password flow (UI shell only)
- [ ] Email delivery / password reset

---

## Quick start

### Prerequisites

- **Node.js** 20+
- **PostgreSQL** 15+ (local install, Docker, or [Neon](https://neon.tech))
- **npm** 10+

### 1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment

**Backend** — copy `backend/.env.example` → `backend/.env`:

```env
PORT=5000
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/rbac?schema=public"

JWT_ACCESS_SECRET="dev-access-secret-min-32-characters-long"
JWT_REFRESH_SECRET="dev-refresh-secret-min-32-characters-long"
ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_EXPIRES=7d
SIGNUP_DEFAULT_ROLE_SLUG=customer
```

**Frontend** — copy `frontend/.env.example` → `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
JWT_REFRESH_SECRET="dev-refresh-secret-min-32-characters-long"
```

> `JWT_REFRESH_SECRET` **must match** the backend value — middleware uses it to read permissions from the refresh cookie.

### 3. Database migrate + seed

```bash
cd backend
npx prisma migrate deploy
npx prisma db seed
```

### 4. Run both apps

**Terminal 1 — API (port 5000)**

```bash
cd backend
npm run start:dev
```

**Terminal 2 — Web (port 3000)**

```bash
cd frontend
npm run dev
```

Open **http://localhost:3000/login** and use the [demo credentials](#demo-credentials-start-here) above.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Next.js 16 (App Router)                                      │
│  middleware.ts → refresh JWT → route permission check         │
│  Zustand session + TanStack Query                             │
└────────────────────────────┬─────────────────────────────────┘
                             │ Bearer access JWT + cookies
                             ▼
┌──────────────────────────────────────────────────────────────┐
│  NestJS 11 API  (/api/*)                                      │
│  JwtAuthGuard → PermissionsGuard → AuditService               │
└────────────────────────────┬─────────────────────────────────┘
                             │ Prisma
                             ▼
┌──────────────────────────────────────────────────────────────┐
│  PostgreSQL — users, roles, permissions, audit_logs, …        │
└──────────────────────────────────────────────────────────────┘
```

**Permission resolution:** `role_permissions` ∪ `user_permissions` → unique slug set → embedded in JWT → enforced on API and in Next.js middleware.

**Grant ceiling:** a manager cannot assign permission atoms they do not hold.

---

## Project structure

```
rbac-system/
├── README.md                 ← you are here
├── backend/                  ← NestJS API + Prisma
│   ├── README.md
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts           ← demo users & permissions
│   │   └── migrations/
│   └── src/
│       ├── auth/
│       ├── users/
│       ├── permissions/
│       ├── audit/
│       └── common/           ← guards, decorators, permission constants
└── frontend/                 ← Next.js dashboard + portal
    ├── README.md
    ├── middleware.ts         ← route gates
    └── src/
        ├── app/              ← (dashboard), (portal), login, …
        ├── components/
        ├── hooks/
        ├── services/         ← API client
        └── store/            ← Zustand
```

---

## API overview

Base URL: `http://localhost:5000/api`

| Method  | Path                         | Auth   | Notes                             |
| ------- | ---------------------------- | ------ | --------------------------------- |
| `POST`  | `/auth/login`                | Public | Sets `refreshToken` cookie        |
| `POST`  | `/auth/register`             | Public | Default customer role             |
| `POST`  | `/auth/refresh`              | Cookie | Rotates refresh token             |
| `POST`  | `/auth/logout`               | Cookie | Revokes refresh + clears cookie   |
| `GET`   | `/users`                     | Bearer | Scoped by role / `users.view_all` |
| `GET`   | `/permissions`               | Bearer | Grouped permission catalog        |
| `PATCH` | `/permissions/users/:userId` | Bearer | User override assignment          |
| `GET`   | `/audit`                     | Bearer | Requires `audit.view`             |

Full backend details: [backend/README.md](./backend/README.md)

---

## Role & permission matrix (seed defaults)

| Role         | Scope        | Highlights                                                                                     |
| ------------ | ------------ | ---------------------------------------------------------------------------------------------- |
| **Admin**    | Global       | All permission atoms including `audit.view`, `users.view_all`, `permissions.assign_roles`      |
| **Manager**  | Team subtree | User CRUD (scoped), suspend/ban/reactivate, assign user overrides, business modules — no audit |
| **Agent**    | Self         | Role template: `dashboard.view` only; real access comes from manager overrides                 |
| **Customer** | Portal       | `portal.view`, tickets, orders, interactions                                                   |

Seeded override example: **agent1** receives leads/tasks/reports atoms from the seed; **agent2** does not.

---

## Documentation map

| Document                                   | Contents                                               |
| ------------------------------------------ | ------------------------------------------------------ |
| [backend/README.md](./backend/README.md)   | API setup, env vars, Prisma commands, module reference |
| [frontend/README.md](./frontend/README.md) | App Router layout, middleware, state, UI conventions   |

---

## Production checklist

- Use strong random values for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
- Set `NODE_ENV=production` (secure cookies on HTTPS)
- Point `NEXT_PUBLIC_API_URL` at your deployed API
- Run `npx prisma migrate deploy` against production database
- Do **not** run seed in production unless you intend to create demo users

---

## License

Md. Yeasin
