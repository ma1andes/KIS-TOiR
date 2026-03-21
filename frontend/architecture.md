# Frontend Architecture

Frontend stack:

- React
- TypeScript
- Vite
- React Admin
- shadcn/ui
- Keycloak JS

The frontend is generated from `domain/*.dsl`.

Each entity becomes a React Admin resource.

The generated frontend must also include Keycloak authentication by default.

---

# Single Source of Truth

- `domain/*.dsl` is the only required input for frontend generation.
- React Admin resources, fields, references, and routes must be derived from the domain model, primary keys, foreign keys, and enums defined in the domain DSL.
- Frontend documentation, generation rules, and optional overrides must not duplicate entity, attribute, or relation structures outside the domain DSL.
- Deprecated multi-DSL inputs are compatibility-only artifacts and must never be treated as authoritative frontend inputs or used to redefine entities, attributes, primary keys, foreign keys, relations, or enums.

---

# Project Structure

client/
  src/

    App.tsx

    main.tsx

    dataProvider.ts

    auth/
      keycloak.ts
      authProvider.ts

    config/
      env.ts

    resources/

      {entity}/
        {entity}List.tsx
        {entity}Create.tsx
        {entity}Edit.tsx
        {entity}Show.tsx

---

# Resource Registration

Each resource must be registered in App.tsx.

The generated `App.tsx` must register:

- `dataProvider`
- `authProvider`

The generated `Admin` root must enforce authenticated operation. The generated frontend must not operate anonymously once auth is enabled.
The generated `authProvider.getIdentity()` must resolve identity from token claims already present in the parsed token and must not trigger a baseline Keycloak `/account` request.

Example:

<Resource
  name="equipment"
  list={EquipmentList}
  create={EquipmentCreate}
  edit={EquipmentEdit}
  show={EquipmentShow}
/>

---

# Data Provider

React Admin uses a generated shared REST-compatible data provider.

API format must follow:

GET /resource
GET /resource/:id
POST /resource
PATCH /resource/:id
DELETE /resource/:id

List response format:

{
  data: [],
  total: number
}

The generated `dataProvider.ts` must remain the **single shared request seam** for backend API calls.

Rules:

1. Use an env-driven API base URL.
2. Attach `Authorization: Bearer <access_token>` in this shared seam.
3. Cover all React Admin operations, including references and bulk fetches.
4. Do not scatter auth headers across resource components.

---

# Application Bootstrap

The generated `main.tsx` must initialize Keycloak before rendering the SPA.

Rules:

1. Use redirect-based Keycloak login only.
2. Use Authorization Code + PKCE (`S256`).
3. Do not generate a custom in-app username/password login form.
4. Do not render the authenticated admin app before Keycloak initialization completes.
5. Do not introduce `keycloak.loadUserProfile()` or `/account` profile-fetch requests as part of baseline app startup or identity resolution.

---

# Config

The generated frontend must include a dedicated config module in `src/config/`.

Required env variables:

- `VITE_API_URL`
- `VITE_KEYCLOAK_URL`
- `VITE_KEYCLOAK_REALM`
- `VITE_KEYCLOAK_CLIENT_ID`

The generated frontend config must fail fast if required auth variables are missing. The generated frontend must not silently fall back to production auth settings in code.

---

# Foreign Keys

Foreign keys must use ReferenceInput and ReferenceField.

Example:

<ReferenceInput source="equipmentTypeCode" reference="equipment-types" />

---

# Naming Conventions

## React component naming

Components are named after the entity in PascalCase. One entity = one resource with four main views.

- **List:** `{Entity}List.tsx` (e.g. `EquipmentList.tsx`, `RepairOrderList.tsx`)
- **Create:** `{Entity}Create.tsx` (e.g. `EquipmentCreate.tsx`)
- **Edit:** `{Entity}Edit.tsx` (e.g. `EquipmentEdit.tsx`)
- **Show:** `{Entity}Show.tsx` (e.g. `EquipmentShow.tsx`)

Examples:
- Equipment → `EquipmentList.tsx`, `EquipmentCreate.tsx`, `EquipmentEdit.tsx`, `EquipmentShow.tsx`
- EquipmentType → `EquipmentTypeList.tsx`, `EquipmentTypeCreate.tsx`, `EquipmentTypeEdit.tsx`, `EquipmentTypeShow.tsx`
- RepairOrder → `RepairOrderList.tsx`, `RepairOrderCreate.tsx`, `RepairOrderEdit.tsx`, `RepairOrderShow.tsx`

## Resource folder naming

Folder under `resources/` uses kebab-case, matching the React Admin resource name:

- `resources/equipment/`
- `resources/equipment-type/`
- `resources/repair-order/`

---

# Resource Naming Rules

React Admin resource name (used in `<Resource name="..." />` and in `reference` for ReferenceInput) must match the API resource path (no leading slash, same segment string).

1. **Entity → resource name:** PascalCase entity name is converted to kebab-case and pluralized.
2. **Consistency with API:** The resource name must be the same as the backend path segment so that the data provider calls the correct URL.

| Entity (DSL)   | Resource name (React Admin) | API path   |
|----------------|-----------------------------|------------|
| Equipment      | equipment                   | /equipment |
| EquipmentType  | equipment-types             | /equipment-types |
| RepairOrder    | repair-orders               | /repair-orders   |

Examples in App.tsx:
- `<Resource name="equipment" list={EquipmentList} create={EquipmentCreate} edit={EquipmentEdit} show={EquipmentShow} />`
- `<Resource name="equipment-types" list={EquipmentTypeList} ... />`
- `<Resource name="repair-orders" list={RepairOrderList} ... />`
