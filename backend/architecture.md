# Backend Architecture

Backend stack:

- Node.js
- TypeScript
- NestJS
- Prisma ORM
- PostgreSQL
- jose

The backend is generated from `domain/*.dsl`.

Each DSL entity becomes:

- Prisma model
- NestJS module
- CRUD controller
- Service
- DTO definitions

---

# Single Source of Truth

- `domain/*.dsl` is the only required input for backend generation.
- DTOs and REST API contracts must be derived from the domain model, primary keys, foreign keys, and enums defined in the domain DSL.
- Backend documentation, generation rules, and optional overrides must not duplicate entity, attribute, or relation structures outside the domain DSL.
- Deprecated multi-DSL inputs are compatibility-only artifacts and must never be treated as authoritative backend inputs or used to redefine entities, attributes, primary keys, foreign keys, relations, or enums.

---

# Project Structure

server/
package.json

prisma/
schema.prisma

src/
main.ts
app.module.ts

    auth/
      auth.module.ts
      guards/
      decorators/
      interfaces/

    config/
      env.validation.ts

    modules/

      {entity}/
        {entity}.module.ts
        {entity}.controller.ts
        {entity}.service.ts

        dto/
          create-{entity}.dto.ts
          update-{entity}.dto.ts
          {entity}.response.dto.ts

---

# Module Rules

Each entity generates exactly one NestJS module.

Example:

Entity:
Equipment

Module:

modules/
equipment/
equipment.module.ts
equipment.controller.ts
equipment.service.ts

---

# Controller Rules

Each entity controller must expose these endpoints:

- GET /{resource} — list
- GET /{resource}/:pk — get one
- POST /{resource} — create
- PATCH /{resource}/:pk — update
- DELETE /{resource}/:pk — delete

The path parameter **:pk** must use the **primary key attribute name** from the DSL, not always `:id`.

## Path parameter by primary key

| Entity        | Primary key (DSL) | Path parameter | Example routes                                           |
| ------------- | ----------------- | -------------- | -------------------------------------------------------- |
| Equipment     | id                | :id            | GET /equipment/:id, PATCH /equipment/:id                 |
| EquipmentType | code              | :code          | GET /equipment-types/:code, PATCH /equipment-types/:code |
| RepairOrder   | id                | :id            | GET /repair-orders/:id, PATCH /repair-orders/:id         |

**Rule:** Use the actual primary key name. For example, **EquipmentType** has PK `code`, so routes must be:

- GET /equipment-types/:code
- PATCH /equipment-types/:code
- DELETE /equipment-types/:code

**Do not** use `/equipment-types/:id` when the entity primary key is `code`.

---

# Health Endpoint

Every generated backend must expose a **health endpoint** so that runtime and orchestration can verify the API is up.

- **Path:** `GET /health`
- **Response:** JSON with a status indicator (e.g. `{ "status": "ok" }`).

## Controller example

```typescript
@Public()
@Controller("health")
export class HealthController {
  @Get()
  getHealth() {
    return { status: "ok" };
  }
}
```

Register the health controller in the root app module (or a dedicated health module). No authentication required for this endpoint.

---

# Authentication and Authorization

The generated backend must include explicit auth infrastructure by default.

Generate:

- `AuthModule`
- JWT guard
- roles guard
- `@Public()`
- `@Roles()`
- typed authenticated principal
- typed env validation for auth/runtime variables

Rules:

1. `/health` must remain public.
2. Generated CRUD routes must be protected by default.
3. JWT verification must use issuer + audience + JWKS.
4. Authorization roles must be extracted only from `realm_access.roles`.
5. The generated backend must not use deprecated Keycloak-specific Node adapters.

## CRUD RBAC defaults

Apply these defaults to generated CRUD controllers:

- `GET` -> `viewer`, `editor`, `admin`
- `POST` -> `editor`, `admin`
- `PATCH` -> `editor`, `admin`
- `PUT` -> `editor`, `admin`
- `DELETE` -> `admin`

These defaults must be encoded in generated guards/decorators, not left as informal guidance.

---

# List Endpoint

List endpoint must support pagination and filters via query parameters.

Example:

GET /equipment?page=0&size=10

Response format must follow React Admin requirements:

{
"data": [],
"total": number
}

Sorting rules:

1. Generated list/query logic must use actual model field names in ORM `orderBy` clauses.
2. If an entity primary key is not literally `id` but the API exposes synthetic `id` for React Admin compatibility, incoming `_sort=id` must be mapped to the real primary key field before building the query.
3. This mapping rule applies generally to all natural-key entities, not as a one-off entity hack.

---

# Service Layer

Services implement CRUD operations using Prisma.

Example:

findAll()
findOne(id)
create(data)
update(id, data)
remove(id)

---

# DTO Rules

DTOs are generated automatically from the domain DSL and are never a separate required DSL input.

Create DTO:

- contains required fields
- does NOT contain generated primary keys

Update DTO:

- all fields optional

Response DTO:

- mirrors domain entity attributes

---

# Naming Conventions

## Entity naming

DSL entities use PascalCase. Generated backend artifacts use the same base name in lowercase for folders and file prefixes.

- **Equipment** → equipment module
- **EquipmentType** → equipment-type module (or equipment-type as path segment)
- **RepairOrder** → repair-order module

## Module naming

One entity = one module folder. Folder name = entity name in kebab-case (lowercase, hyphen-separated).

- Equipment → `modules/equipment/`
- EquipmentType → `modules/equipment-type/`
- RepairOrder → `modules/repair-order/`

## Controller naming

- File: `{entity-kebab}.controller.ts`
- Class: `EquipmentController`, `EquipmentTypeController`, `RepairOrderController`

Examples:

- `equipment.controller.ts`
- `equipment-type.controller.ts`
- `repair-order.controller.ts`

## Service naming

- File: `{entity-kebab}.service.ts`
- Class: `EquipmentService`, `EquipmentTypeService`, `RepairOrderService`

Examples:

- `equipment.service.ts`
- `equipment-type.service.ts`
- `repair-order.service.ts`

## DTO naming

- Create: `create-{entity-kebab}.dto.ts` (e.g. `create-equipment.dto.ts`, `create-repair-order.dto.ts`)
- Update: `update-{entity-kebab}.dto.ts` (e.g. `update-equipment.dto.ts`)
- Response: `{entity-kebab}.response.dto.ts` or use entity name for list/detail response types

---

# Resource Naming Rules

API resource paths are derived from the entity name:

1. **PascalCase → kebab-case:** Replace camelCase with lowercase hyphenated segments.
2. **Pluralize:** Use plural form for the resource path (list endpoint represents a collection).

| Entity (DSL)  | API path (resource) |
| ------------- | ------------------- |
| Equipment     | /equipment          |
| EquipmentType | /equipment-types    |
| RepairOrder   | /repair-orders      |

Rules:

- **Equipment** → `equipment` (already singular-looking; path is still `/equipment` for consistency with REST resource naming).
- **EquipmentType** → `equipment-types` (camelCase "EquipmentType" → "equipment-type", then plural → "equipment-types").
- **RepairOrder** → `repair-orders` ("RepairOrder" → "repair-order" → "repair-orders").

Standard endpoints per resource:

- GET /{resource} — list
- GET /{resource}/:pk — get one (pk = primary key name, e.g. :id or :code)
- POST /{resource} — create
- PATCH /{resource}/:pk — update
- DELETE /{resource}/:pk — delete

See **Controller Rules** above for the rule that :pk must match the entity's primary key attribute name.

---

# Environment and runtime

- **Environment variables:** Backend requires runtime and auth variables. See **backend/runtime-rules.md**.
- **.env:** Generated project must include a `.env` (and `.env.example`) with database, auth, and CORS variables so the app starts without runtime errors.
- **PrismaService:** Must follow **backend/prisma-service.md** (OnModuleInit, $connect; no beforeExit).
- **Prisma client:** Add `"postinstall": "prisma generate"` (or equivalent) to package.json so the client is generated after install.
- **Migrations:** Document or run `npx prisma migrate dev` after schema generation. See **backend/runtime-rules.md** and **generation/backend-generation.md**.
