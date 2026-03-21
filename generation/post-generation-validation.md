# Post-Generation Validation

After generating the backend or fullstack application, run these checks to ensure the project will start cleanly and that the default auth model has been generated correctly.

---

# Validation Checklist

## 1. Frontend and backend env files

- [ ] `server/.env.example` exists and documents:
  - `PORT`
  - `DATABASE_URL`
  - `CORS_ALLOWED_ORIGINS`
  - `KEYCLOAK_ISSUER_URL`
  - `KEYCLOAK_AUDIENCE`
  - optional `KEYCLOAK_JWKS_URL`
- [ ] `client/.env.example` exists and documents:
  - `VITE_API_URL`
  - `VITE_KEYCLOAK_URL`
  - `VITE_KEYCLOAK_REALM`
  - `VITE_KEYCLOAK_CLIENT_ID`
- [ ] Runtime code fails fast when required auth or database env vars are missing.
- [ ] Runtime code does not silently fall back to production auth settings.

**Failure symptoms:** startup succeeds with undefined auth config, or fails later with opaque auth/runtime errors.

---

## 2. Keycloak realm artifact

- [ ] A root-level generated Keycloak realm import artifact exists.
- [ ] If the repository default filename `toir-realm.json` is not used, the project-specific equivalent is documented consistently across bootstrap and workflow docs.
- [ ] The generated realm artifact is self-contained and reproducible.
- [ ] The generated realm artifact parameterizes realm name, frontend client ID, backend audience/client ID, production URLs, and artifact filename consistently with the generated project auth config.
- [ ] It defines realm roles:
  - `admin`
  - `editor`
  - `viewer`
- [ ] It defines a frontend SPA client consistent with the generated frontend Keycloak client ID.
- [ ] It defines a backend audience/resource client consistent with the generated backend audience/client ID.
- [ ] It defines explicit audience delivery, such as an `api-audience` client scope.
- [ ] It does not rely on undeclared built-in client scopes being present after import.
- [ ] It explicitly addresses delivery of:
  - `sub`
  - `aud`
  - `realm_access.roles`

**Failure symptoms:** access tokens are missing required claims, or realm import succeeds but generated apps still cannot authenticate/authorize reliably.

---

## 3. Frontend auth files and behavior

- [ ] Generated frontend includes:
  - `client/src/config/env.ts`
  - `client/src/auth/keycloak.ts`
  - `client/src/auth/authProvider.ts`
  - `client/src/main.tsx`
  - `client/src/App.tsx`
  - `client/src/dataProvider.ts`
- [ ] `keycloak-js` is installed.
- [ ] Keycloak is initialized before the SPA renders.
- [ ] Login is redirect-based only.
- [ ] No custom in-app username/password login form is generated.
- [ ] `Authorization Code + PKCE (S256)` is encoded in the frontend auth flow.
- [ ] `client/src/dataProvider.ts` or the documented shared request seam injects `Authorization: Bearer <access_token>` into all API requests.
- [ ] Token refresh is concurrency-safe:
  - one shared in-flight refresh operation
  - no parallel refresh stampede
- [ ] Generated auth code does not persist access tokens or refresh tokens in `localStorage` or `sessionStorage`.
- [ ] React Admin auth semantics distinguish:
  - `401` -> force logout / re-authentication
  - `403` -> do not re-authenticate; surface access denied / permission error

**Failure symptoms:** app renders before auth is ready, reference calls miss auth headers, refresh storms occur, or `403` incorrectly forces logout.

---

## 4. Backend auth files and behavior

- [ ] Generated backend includes:
  - `server/src/auth/auth.module.ts`
  - JWT guard
  - roles guard
  - `@Public()` decorator
  - `@Roles()` decorator
  - typed authenticated principal interface
  - typed config validation in `server/src/config/`
- [ ] `jose` is installed.
- [ ] JWT verification uses issuer + audience + JWKS.
- [ ] JWKS resolution follows this exact priority:
  1. `KEYCLOAK_JWKS_URL`
  2. OIDC discovery
  3. `${issuer}/protocol/openid-connect/certs`
- [ ] Authorization roles are extracted only from `realm_access.roles`.
- [ ] Deprecated Keycloak-specific Node adapters are not used.

**Failure symptoms:** invalid tokens are accepted, valid tokens are rejected due to bad JWKS resolution, or RBAC depends on unstable/non-standard claims.

---

## 5. CRUD protection and RBAC defaults

- [ ] `/health` is public.
- [ ] Each generated CRUD controller method other than explicit public routes is protected by the generated auth/RBAC infrastructure.
- [ ] CRUD RBAC defaults are present:
  - `GET` -> `viewer | editor | admin`
  - `POST`, `PATCH`, `PUT` -> `editor | admin`
  - `DELETE` -> `admin`
- [ ] Unauthenticated request to a protected route returns `401`.
- [ ] Authenticated user with insufficient role receives `403`.

**Failure symptoms:** anonymous CRUD access remains open, or insufficient-role users are not denied properly.

---

## 6. PrismaService implementation

- [ ] A `PrismaService` (or equivalent) class exists and extends `PrismaClient`.
- [ ] It implements `OnModuleInit` and calls `await this.$connect()` in `onModuleInit()`.
- [ ] It does not use `this.$on('beforeExit', ...)` or any `beforeExit` hook.

**Failure symptom:** deprecation/runtime errors in Prisma 5 when using `beforeExit`.

**Reference:** `backend/prisma-service.md`

---

## 7. Prisma client lifecycle

- [ ] `package.json` includes a script that runs Prisma client generation:
  - either `"postinstall": "prisma generate"` (or `npx prisma generate`)
  - or clear documentation to run `npx prisma generate` after install
- [ ] After schema generation or change, `npx prisma generate` has been run or will run via `postinstall`.

**Failure symptom:** `Cannot find module '@prisma/client'` or missing generated types.

---

## 8. Database migration

- [ ] Migration workflow is documented.
- [ ] Instruction to run `npx prisma migrate dev` exists after first generation or schema change.
- [ ] Generation pipeline includes or documents the migration step.

**Failure symptom:** tables do not exist; Prisma errors on first query.

---

## 9. REST route parameters

- [ ] For each entity, path parameters use the correct primary key name from the DSL.
- [ ] Entity with PK `id` uses `/:id`.
- [ ] Entity with non-`id` primary key (for example `code`) uses the actual PK name such as `/:code`, not `/:id`.

**Failure symptom:** controller expects one param name while the route defines another, leading to broken CRUD behavior.

**Reference:** `backend/architecture.md`

---

## 10. DTO type mapping and React Admin ID compatibility

- [ ] DSL `decimal` maps to DTO/API `string`.
- [ ] DSL `date` maps to DTO/API `string` (ISO) or equivalent string serialization.
- [ ] Every API response object contains a field named `id`.
- [ ] If the entity primary key is not named `id`, the response maps the primary key to `id`.

**Failure symptoms:** serialization issues for decimals/dates, or React Admin cannot identify records.

---

## 11. Update payload sanitization

- [ ] Update endpoints do not pass `id` or the primary key in Prisma `data`.
- [ ] Generated update methods remove `id`, the entity primary key, and readonly attributes before calling `prisma.*.update()`.

**Failure symptom:** Prisma throws because immutable or invalid fields are passed in update `data`.

---

## 12. Database runtime

- [ ] `docker-compose.yml` exists at the project root.
- [ ] It defines a PostgreSQL service with image `postgres:16`, port `5432`, and credentials matching `DATABASE_URL`.
- [ ] `docker compose up -d` starts the database successfully.
- [ ] `docker-compose.yml` does not add Keycloak in this repository.

**Failure symptom:** Prisma cannot reach the development database or repo topology drifts from the documented external-Keycloak model.

---

## 13. Migrations, seed, and health endpoint

- [ ] `npx prisma migrate dev` runs successfully from `server/`.
- [ ] Seed script exists at `server/prisma/seed.ts` (or equivalent).
- [ ] `npx prisma db seed` runs without error.
- [ ] Backend exposes `GET /health`.
- [ ] `GET /health` returns HTTP 200 with a status payload.

**Failure symptom:** development bootstrap cannot complete end-to-end.

---

# Summary Table

| Check | Required artifact / rule |
| --- | --- |
| Frontend env | `client/.env.example` with required Vite auth vars |
| Backend env | `server/.env.example` with DB, CORS, and Keycloak vars |
| Fail-fast config | Startup fails when required auth env is missing |
| Realm artifact | Root generated realm import artifact with self-contained auth setup |
| Frontend auth | `keycloak.ts`, `authProvider.ts`, authenticated `dataProvider.ts` |
| Backend auth | `AuthModule`, guards, decorators, typed principal |
| JWKS strategy | explicit URL -> discovery -> certs fallback |
| Role source | `realm_access.roles` only |
| CRUD RBAC | GET viewer/editor/admin; write editor/admin; delete admin |
| `/health` | Public and returns 200 |
| Protected route unauthenticated | Returns `401` |
| Protected route insufficient role | Returns `403` |
| Token storage | No `localStorage` / `sessionStorage` persistence |
| Token refresh | Concurrency-safe single in-flight refresh |
| Prisma lifecycle | `OnModuleInit` + `$connect()`, no `beforeExit` |
| Update sanitization | Strip `id` / PK / readonly before Prisma update |
| React Admin `id` | Every record includes `id` |
| Database runtime | PostgreSQL compose exists and starts |

---

# Integration with generation pipeline

1. Backend and frontend generation must produce artifacts that satisfy the above by default.
2. Runtime bootstrap must include Keycloak realm import/verification before app startup.
3. After generation, run this checklist manually or via an automated script.
4. If any check fails, update the generator context so future runs pass without manual repair.
