# RBAC Backend — NestJS API

REST API for the RBAC platform: JWT authentication, permission guards, user lifecycle, permission assignment with grant-ceiling enforcement, and append-only audit logging. Data layer is **PostgreSQL + Prisma 6**.

Parent overview and **demo login table**: [../README.md](../README.md#demo-credentials-start-here)

---

## Demo credentials (after seed)

| Email | Password | Role |
|-------|----------|------|
| `admin@example.com` | `Admin123@` | Admin |
| `manager@example.com` | `Manager123!` | Manager |
| `agent1@example.com` | `Agent123!` | Agent (with manager overrides) |
| `agent2@example.com` | `Agent123!` | Agent (minimal) |
| `customer@example.com` | `Customer123!` | Customer |

```bash
npx prisma db seed
```

---

## Quick start

```bash
# 1. Install
npm install

# 2. Environment
cp .env.example .env
# Fill DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET

# 3. Database
npx prisma migrate deploy
npx prisma db seed

# 4. Development server (http://localhost:5000/api)
npm run start:dev
```

Verify: `GET http://localhost:5000/api` returns the health/hello response.

---

## Environment variables

Copy `.env.example` to `.env`. Never commit real secrets.

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | HTTP port (default `5000`) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Yes | Signs short-lived access JWTs |
| `JWT_REFRESH_SECRET` | Yes | Signs refresh JWTs (must match frontend `JWT_REFRESH_SECRET`) |
| `ACCESS_TOKEN_EXPIRES` | No | Access TTL (default `15m`) |
| `REFRESH_TOKEN_EXPIRES` | No | Refresh TTL (default `7d`) |
| `SIGNUP_DEFAULT_ROLE_SLUG` | No | Role for self-registration (default `customer`) |
| `NODE_ENV` | No | Set `production` for secure cookies |

Example `.env`:

```env
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rbac?schema=public"

JWT_ACCESS_SECRET="change-me-access-min-32-chars-long!!"
JWT_REFRESH_SECRET="change-me-refresh-min-32-chars-long!!"
ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_EXPIRES=7d
SIGNUP_DEFAULT_ROLE_SLUG=customer
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Watch mode development |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run compiled app |
| `npm run test` | Unit tests (Jest) |
| `npm run test:e2e` | E2E tests |
| `npm run lint` | ESLint |
| `npx prisma migrate deploy` | Apply migrations |
| `npx prisma migrate dev` | Create migration (dev) |
| `npx prisma db seed` | Seed roles, permissions, demo users |
| `npx prisma studio` | Visual DB browser |

---

## What's implemented

### Auth (`/api/auth`)

| Endpoint | Throttle | Description |
|----------|----------|-------------|
| `POST /auth/login` | 10/min | Returns `accessToken` + user; sets httpOnly `refreshToken` cookie |
| `POST /auth/register` | 5/min | Creates user with signup default role |
| `POST /auth/refresh` | — | Rotates refresh token; returns new access token |
| `POST /auth/logout` | — | Revokes refresh token, clears cookie, bumps `accessTokenVersion` |

Access JWT payload includes: `sub`, `email`, `role`, `permissions[]`, `atv` (access token version).

Refresh tokens are stored in `refresh_tokens` with revocation support.

### Users (`/api/users`)

All routes require `JwtAuthGuard` + `PermissionsGuard`.

| Method | Path | Permission | Notes |
|--------|------|------------|-------|
| `GET` | `/users` | `users.view` | Scoped list (manager subtree vs admin all) |
| `GET` | `/users/:id` | `users.view` | Single user |
| `POST` | `/users` | `users.create` | Grant ceiling on role/permissions |
| `PATCH` | `/users/:id` | `users.edit` | |
| `DELETE` | `/users/:id` | `users.delete` | |
| `POST` | `/users/:id/suspend` | `users.suspend` | Bumps `accessTokenVersion` |
| `POST` | `/users/:id/ban` | `users.ban` | Bumps `accessTokenVersion` |
| `POST` | `/users/:id/reactivate` | `users.reactivate` | |

### Permissions (`/api/permissions`)

| Method | Path | Permission |
|--------|------|------------|
| `GET` | `/permissions` | `permissions.view` |
| `GET` | `/permissions/roles` | `users.view` |
| `GET` | `/permissions/roles/:roleId` | `permissions.view` |
| `PATCH` | `/permissions/users/:userId` | `permissions.assign` |
| `PATCH` | `/permissions/roles/:roleId` | `permissions.assign_roles` |

Assignment endpoints enforce **grant ceiling** — actors cannot grant atoms they do not hold.

### Audit (`/api/audit`)

| Method | Path | Permission |
|--------|------|------------|
| `GET` | `/audit` | `audit.view` |

Append-only `audit_logs` records: login, logout, register, CRUD, permission assign/remove, suspend, ban.

---

## Permission model

Constants live in `src/common/constants/permissions.ts`. Resolution merges:

1. Permissions linked to the user's **role** (`role_permissions`)
2. **User overrides** (`user_permissions`)

```typescript
// Example slugs
"users.view" | "users.view_all" | "permissions.assign" | "audit.view" | …
```

Roles (seeded):

- `admin` — all atoms
- `manager` — team + business modules, no audit
- `agent` — `dashboard.view` baseline; overrides from manager
- `customer` — portal atoms only

---

## Project layout

```
backend/
├── prisma/
│   ├── schema.prisma       # User, Role, Permission, AuditLog, RefreshToken, …
│   ├── seed.ts             # Demo data (see credentials above)
│   └── migrations/
├── src/
│   ├── main.ts             # CORS, cookie-parser, global /api prefix, ValidationPipe
│   ├── auth/               # Login, refresh rotation, register
│   ├── users/              # CRUD + lifecycle
│   ├── permissions/        # Catalog + assignment
│   ├── audit/              # Read audit trail
│   ├── prisma/             # PrismaService module
│   └── common/
│       ├── guards/         # jwt-auth.guard, permissions.guard
│       ├── decorators/     # @CurrentUser, @RequirePermissions, …
│       └── utils/          # grant ceiling, team scope, permission map
└── test/                   # Jest e2e
```

---

## Database schema (summary)

| Model | Purpose |
|-------|---------|
| `User` | Account, status (`ACTIVE` / `SUSPENDED` / `BANNED`), `accessTokenVersion`, manager hierarchy |
| `Role` | Named template (`admin`, `manager`, …) |
| `Permission` | Atom slug + module grouping |
| `RolePermission` | Role ↔ permission join |
| `UserPermission` | User override join |
| `RefreshToken` | Hashed refresh token storage + revocation |
| `AuditLog` | Immutable action trail |

---

## Development notes

### CORS

`main.ts` allows `http://localhost:3000` with credentials for cookie-based refresh during local dev.

### Validation

Global `ValidationPipe`: whitelist, forbid non-whitelisted fields, auto-transform DTOs.

### Testing login via curl

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123@"}' \
  -c cookies.txt

# Use accessToken from JSON response:
curl http://localhost:5000/api/users \
  -H "Authorization: Bearer <accessToken>" \
  -b cookies.txt
```

### Troubleshooting

| Issue | Fix |
|-------|-----|
| Prisma `P1001` (can't reach DB) | Start PostgreSQL / wake Neon project / check `DATABASE_URL` |
| `EADDRINUSE` on 5000 | Set `PORT=5001` in `.env` and update frontend `NEXT_PUBLIC_API_URL` |
| 401 after suspend/ban | Expected — `accessTokenVersion` invalidated; re-login blocked until reactivate |
| Frontend middleware redirects to login | Ensure `JWT_REFRESH_SECRET` matches between backend `.env` and frontend `.env.local` |

---

## Production

```bash
npm run build
npm run start:prod
```

- Use TLS termination so `secure` refresh cookies work (`NODE_ENV=production`).
- Run migrations with `npx prisma migrate deploy`.
- Do not expose `.env` or run seed against production unless intentional.

---

## Related docs

- [Root README](../README.md)
- [Frontend README](../frontend/README.md)
