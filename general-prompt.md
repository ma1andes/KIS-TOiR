ROLE

You are a Staff-level Fullstack Platform Engineer.

Your task is to generate a fully runnable fullstack CRUD application from the DSL context of this repository.

Use context7.

Follow official best practices from:

NestJS documentation

Prisma documentation

React Admin documentation

Vite documentation

Keycloak documentation

Docker documentation

The generated application must run without manual fixes.

PROJECT CONTEXT

You must read the project documentation in the following strict order:

domain/dsl-spec.md

examples/*.dsl

backend/architecture.md

backend/prisma-rules.md

backend/prisma-service.md

backend/service-rules.md

backend/runtime-rules.md

backend/database-runtime.md

backend/seed-rules.md

frontend/architecture.md

frontend/react-admin-rules.md

auth/keycloak-architecture.md

auth/frontend-auth-rules.md

auth/backend-auth-rules.md

auth/keycloak-realm-template-rules.md

generation/scaffolding-rules.md

generation/backend-generation.md

generation/frontend-generation.md

generation/runtime-bootstrap.md

generation/post-generation-validation.md

Do not ignore any rules defined in these documents.

GOAL

Generate a DSL-driven fullstack CRUD system with default Keycloak authentication and authorization.

Repository-specific defaults and examples may use names such as `toir`, `toir-frontend`, `toir-backend`, `toir-realm.json`, and `*.greact.ru`, but the generator must parameterize realm name, client IDs, production URLs, and realm-artifact filename for other generated projects.

Stack:

Backend

Node.js

NestJS

Prisma ORM

PostgreSQL

jose

Frontend

React

Vite

React Admin

MUI

shadcn/ui

Keycloak JS

PROJECT STRUCTURE

Root
docker-compose.yml
root-level Keycloak realm import artifact (default example filename: `toir-realm.json`)
server/
client/

Backend
server/
src/
auth/
config/
modules/{entity}/
prisma/schema.prisma
prisma/seed.ts
.env
.env.example

Frontend
client/
src/
auth/
config/
resources/{entity}/
App.tsx
main.tsx
dataProvider.ts
.env.example

STEP 1 — Parse DSL

Parse all DSL files and extract:

Entities
Attributes
Primary keys
Foreign keys
Enums

Respect the DSL specification.

STEP 2 — CLI scaffolding

Use official CLIs.

Backend
npx @nestjs/cli@10.3.2 new server --package-manager npm --skip-git

Frontend
npm create vite@5.2.0 client -- --template react-ts

STEP 3 — Install dependencies

Backend

@prisma/client
prisma
@nestjs/config
jose

Frontend

react-admin
ra-data-simple-rest
@mui/material
@emotion/react
@emotion/styled
keycloak-js

STEP 4 — Generate Prisma schema

From DSL domain generate:

models

enums

relations

primary keys

Type mapping

decimal → Decimal
date → DateTime

DTO mapping

decimal → string
date → ISO string

STEP 5 — Generate NestJS CRUD modules

Per entity generate:

module
controller
service
dto

Controller routes

GET /resource
GET /resource/:pk
POST /resource
PATCH /resource/:pk
DELETE /resource/:pk

Path parameter must match the DSL primary key name.

Examples

/equipment/:id
/equipment-types/:code
/repair-orders/:id

STEP 6 — Generate backend auth infrastructure

Generate:

AuthModule
JWT guard
roles guard
@Public()
@Roles()
typed authenticated principal
typed env validation

Rules:

- `/health` must remain public
- CRUD routes must be protected by default
- RBAC source must be `realm_access.roles`
- JWT verification must use issuer + audience + JWKS
- JWKS resolution priority must be:
  1. explicit `KEYCLOAK_JWKS_URL`
  2. OIDC discovery
  3. `${issuer}/protocol/openid-connect/certs`
- Do not use deprecated Keycloak-specific Node adapters

STEP 7 — Generate Service Layer

Service layer must follow backend/service-rules.md.

Important rule:

React Admin sends the id field in update payloads even when the primary key is not named id.

Therefore update payload must be sanitized before passing data to Prisma.

Services MUST NOT pass raw request DTO directly into Prisma.

Incorrect:

prisma.entity.update({
where,
data: dto
})

Correct pattern:

const { id, <primaryKey>, ...data } = dto

return prisma.entity.update({
where,
data
})

Example (PK = code)

const { id, code, ...data } = dto

return prisma.equipmentType.update({
where: { code },
data
})

Example (PK = id)

const { id: _pk, ...data } = dto

return prisma.entity.update({
where: { id },
data
})

Rules

Update payload passed to Prisma must not contain:

id
primary key attribute
readonly attributes

STEP 8 — Generate frontend auth integration

Generate:

client/src/config/env.ts
client/src/auth/keycloak.ts
client/src/auth/authProvider.ts

Rules:

- Keycloak login must be redirect-based only
- Use Authorization Code + PKCE (`S256`)
- Initialize Keycloak before rendering the SPA
- Attach `Authorization: Bearer <access_token>` through the shared request seam in `client/src/dataProvider.ts`
- `401` must force re-authentication
- `403` must surface access denied without forcing re-authentication
- Token refresh must be concurrency-safe
- Do not store tokens in `localStorage` or `sessionStorage`
- Frontend auth config must fail fast if required auth vars are missing

STEP 9 — Generate runtime infrastructure

Create:

server/.env
server/.env.example
client/.env.example
root-level Keycloak realm import artifact (default example filename: `toir-realm.json`)

Backend env examples must include:

PORT
DATABASE_URL
CORS_ALLOWED_ORIGINS
KEYCLOAK_ISSUER_URL
KEYCLOAK_AUDIENCE
KEYCLOAK_JWKS_URL (optional)

Frontend env examples must include:

VITE_API_URL
VITE_KEYCLOAK_URL
VITE_KEYCLOAK_REALM
VITE_KEYCLOAK_CLIENT_ID

Add to package.json:

postinstall: prisma generate

STEP 10 — Database runtime

Generate root:

docker-compose.yml

PostgreSQL container

postgres:16
port 5432

STEP 11 — Generate seed

Create:

server/prisma/seed.ts

Seed minimal data for:

EquipmentType
Equipment
RepairOrder

Add to package.json:

prisma.seed

STEP 12 — Generate React Admin resources

For each entity generate:

Field mapping

string → TextInput
number → NumberInput
date → DateInput
enum → SelectInput
FK → ReferenceInput

API responses MUST contain:

If PK ≠ id, map primary key to id.

Example

{
id: record.code,
code: record.code
}

STEP 13 — Validation

Verify:

docker-compose.yml exists
database container starts
prisma migrate dev works
prisma db seed works
API responds /health
React Admin receives id
update services sanitize payload before Prisma
frontend auth files exist
backend auth files exist
auth env examples exist
public /health is preserved
unauthenticated protected route returns 401
insufficient role returns 403
generated realm import artifact is self-contained and guarantees `sub`, `aud`, and `realm_access.roles`

OUTPUT

Provide:

FULLSTACK GENERATION REPORT

Include:

1 Parsed DSL
2 Prisma models
3 Backend modules
4 API endpoints
5 React Admin resources
6 Authentication and authorization
7 Runtime configuration
8 Validation results

RUN INSTRUCTIONS

The generated application must run successfully with:

Import the generated root-level Keycloak realm artifact (for example `toir-realm.json`) into the external Keycloak server

docker compose up -d

cd server
npm install
npx prisma migrate dev
npm run start

cd client
npm install
npm run dev
