# Backend Generation Process

Backend generation follows a pipeline aligned with runtime, auth, and validation docs:

DSL
↓
CLI scaffolding
↓
backend code generation
↓
auth generation
↓
runtime infrastructure
↓
database runtime
↓
migration
↓
seed
↓
validation

Follow:

- `backend/architecture.md`
- `backend/runtime-rules.md`
- `backend/prisma-rules.md`
- `backend/prisma-service.md`
- `backend/database-runtime.md`
- `backend/seed-rules.md`
- `backend/service-rules.md`
- `auth/keycloak-architecture.md`
- `auth/backend-auth-rules.md`
- `auth/keycloak-realm-template-rules.md`

---

# Step 1 — Parse DSL

Read DSL inputs and extract:

- entities
- attributes, including the actual primary key attribute per entity
- enums
- foreign keys

The generator must treat auth as default runtime infrastructure, not as a DSL feature toggle.

---

# Step 2 — CLI scaffolding

Use official CLIs before generating backend code:

- NestJS project scaffold in `server/` (see `generation/scaffolding-rules.md`)
- install backend dependencies:
  - `@prisma/client`
  - `prisma`
  - `@nestjs/config`
  - `jose`
  - seed runner when needed by the chosen package tooling

The generator must **not** use deprecated Keycloak-specific Node adapters such as `keycloak-connect`.

---

# Step 3 — Core backend code generation

Generate backend source artifacts:

1. **Prisma schema** (`server/prisma/schema.prisma`) from the domain DSL:
   - attributes
   - primary keys
   - relations
   - enums
2. **NestJS modules** per entity:
   - module
   - controller
   - service
3. **DTO files**:
   - `create-entity.dto.ts`
   - `update-entity.dto.ts`
   - `entity.response.dto.ts` (or equivalent)
4. **PrismaService**:
   - implement `OnModuleInit`
   - call `await this.$connect()` in `onModuleInit()`
   - do not use a `beforeExit` hook
5. **Service update methods**:
   - sanitize update payload before Prisma
   - remove `id`, the entity primary key, and readonly attributes from `data`
   - do not pass the raw request body directly to `prisma.*.update()`

Use mapping rules from `backend/prisma-rules.md`:

- DSL `decimal` -> DTO `string`
- DSL `date` -> DTO `string` (ISO)

---

# Step 4 — Backend auth generation

Generate auth infrastructure as part of the normal backend output. Auth must not be deferred to a manual post-step.

Required generated auth artifacts:

- `server/src/auth/auth.module.ts`
- JWT auth guard
- roles guard
- `@Public()` decorator
- `@Roles()` decorator
- typed authenticated principal interface
- typed auth-aware config validation in `server/src/config/`

JWT verification rules:

- verify JWTs with issuer, audience, and JWKS
- use a standards-based library such as `jose`
- resolve JWKS in this exact order:
  1. explicit `KEYCLOAK_JWKS_URL`
  2. OIDC discovery
  3. `${issuer}/protocol/openid-connect/certs`

RBAC rules:

- extract authorization roles only from `realm_access.roles`
- do not infer roles from other claims
- apply CRUD defaults by HTTP method:
  - `GET` -> `viewer`, `editor`, `admin`
  - `POST`, `PATCH`, `PUT` -> `editor`, `admin`
  - `DELETE` -> `admin`
- mark `/health` as public with `@Public()`

Controller generation rules:

- generated CRUD controllers must receive auth decorators by default
- path params must still use the actual entity primary key name (`:id`, `:code`, etc.)
- public routes must be explicit rather than implicit

---

# Step 5 — Runtime infrastructure

Generate backend runtime config files:

- `server/.env`
- `server/.env.example`
- `server/src/config/*` typed validation helpers
- `server/package.json` lifecycle:
  - `"postinstall": "prisma generate"`
- `server/package.json` Prisma seed:
  - `"prisma": { "seed": "ts-node prisma/seed.ts" }` (or `tsx` equivalent if that is the chosen project standard)

The generated backend env contract must include:

- `PORT`
- `DATABASE_URL`
- `CORS_ALLOWED_ORIGINS`
- `KEYCLOAK_ISSUER_URL`
- `KEYCLOAK_AUDIENCE`
- `KEYCLOAK_JWKS_URL` (optional)

Fail-fast config rule:

- backend startup must fail fast when required auth or database env vars are missing
- the generator must not silently fall back to production auth values in code

Commands that must be supported and documented:

- `npx prisma generate`
- `npx prisma migrate dev`
- `npx prisma db seed`

---

# Step 6 — Database runtime

Create `docker-compose.yml` at the **project root** with PostgreSQL only.

Minimum required compose characteristics:

- `services.postgres`
- `image: postgres:16`
- `ports: ["5432:5432"]`

Credentials and database name in compose must match `DATABASE_URL`.

Keycloak must remain an external runtime dependency and must not be added to `docker-compose.yml` in this repository.

---

# Step 7 — Migration

Apply schema to the development database:

```bash
cd server
npx prisma migrate dev
```

---

# Step 8 — Seed

Run development seed:

```bash
cd server
npx prisma db seed
```

Seed file location: `server/prisma/seed.ts`.

---

# Step 9 — Validation

Run runtime, auth, and contract checks from `generation/post-generation-validation.md`, including:

- docker-compose exists and DB container starts
- Prisma lifecycle commands succeed
- seed runs
- `/health` responds without auth
- protected routes reject unauthenticated requests with `401`
- authenticated users with insufficient role receive `403`
- React Admin-compatible API responses include `id` for every record
