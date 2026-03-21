# Frontend Generation Process

Frontend generation must produce the React Admin CRUD application **and** the default Keycloak integration required by the runtime architecture.

Follow:

- `frontend/architecture.md`
- `frontend/react-admin-rules.md`
- `auth/keycloak-architecture.md`
- `auth/frontend-auth-rules.md`
- `auth/keycloak-realm-template-rules.md`

---

# Input Contract

Required input:

- `domain/*.dsl`

Optional extension input:

- `overrides/ui-overrides.dsl`

Optional extension layout:

```text
overrides/
  ui-overrides.dsl
```

Rules:

- Parse `domain/*.dsl` as the only authoritative DSL input.
- Generate React Admin resources, views, and field mappings automatically from the parsed domain model.
- The generator must work when `overrides/ui-overrides.dsl` is absent.
- Optional overrides may refine derived UI behavior but must not redefine entities, attributes, primary keys, foreign keys, relations, or enums.
- Supplemental UI DSL inputs must not participate in frontend parsing, dependency resolution, or frontend generation decisions.
- Do not read a standalone UI DSL file.

---

# Step 1 — Parse Domain DSL

Extract:

- entities
- attributes
- relation fields required for reference inputs and reference displays

All frontend resources, fields, references, routes, and type-driven widget choices must be derived from the parsed domain DSL before optional overrides are considered.

If `overrides/ui-overrides.dsl` exists, process it only after the domain model has been parsed and only as optional non-authoritative metadata.

The generator must treat auth as default frontend infrastructure rather than as an optional feature.

---

# Step 2 — Generate frontend runtime structure

Generate the base frontend structure required by the proven runtime:

- `client/src/main.tsx`
- `client/src/App.tsx`
- `client/src/dataProvider.ts`
- `client/src/config/env.ts`
- `client/src/auth/keycloak.ts`
- `client/src/auth/authProvider.ts`
- `client/.env.example`

The generated frontend must:

- initialize Keycloak before rendering the SPA
- register React Admin with a mandatory `authProvider`
- enforce authenticated operation rather than anonymous operation
- use environment-driven runtime config and fail fast when required auth vars are missing

---

# Step 3 — Generate React Admin resources

For each entity create:

- `EntityList.tsx`
- `EntityCreate.tsx`
- `EntityEdit.tsx`
- `EntityShow.tsx`

Resource generation must remain compatible with the auth-aware shared request seam and must be derived from domain metadata rather than a separate UI DSL.

---

# Step 4 — Map fields

Map DSL attributes to React Admin components according to existing field rules and relation semantics.

Minimum type mapping:

- `string`, `text` -> `TextInput`, `TextField`
- `integer`, `decimal` -> `NumberInput`, `NumberField`
- `date` -> `DateInput`, `DateField`
- `enum` -> `SelectInput`
- foreign key -> `ReferenceInput`, `ReferenceField`

Reference/resource lookups must continue to flow through the same shared authenticated request layer used by the main CRUD resources.

---

# Step 5 — Generate auth-aware API layer

Generate a shared `dataProvider.ts` that:

- reads the API base URL from `VITE_API_URL`
- attaches `Authorization: Bearer <access_token>` to every backend request
- uses the same request seam for all React Admin operations, including:
  - list
  - get one
  - get many
  - get many reference
  - create
  - update
  - delete
- handles token refresh before protected requests
- keeps token refresh concurrency-safe by sharing one in-flight refresh operation
- does not store access tokens or refresh tokens in `localStorage` or `sessionStorage`

The generator must not create multiple competing HTTP clients for authenticated and unauthenticated traffic. The shared request seam is the single bearer injection point.

---

# Step 6 — Generate frontend auth flow

Generate Keycloak frontend integration with these required rules:

- use `keycloak-js`
- redirect-based login only
- no custom in-app username/password login form
- Authorization Code + PKCE with `S256`
- initialize Keycloak before React render
- provide a React Admin `authProvider`
- derive `authProvider.getIdentity()` from token claims already present in the parsed token
- prefer `sub`, `preferred_username`, `email`, and `name` for identity resolution
- do not call `keycloak.loadUserProfile()` by default
- do not rely on the Keycloak `/account` endpoint for baseline CRUD/admin generation
- avoid the `/account` request entirely by default rather than broadening Keycloak CORS behavior
- distinguish auth failures from authorization failures:
  - `401` -> force logout / re-authentication
  - `403` -> do not re-authenticate; surface access denied / permission error

The generator must not silently fall back to production auth settings in code. Example values belong in `.env.example`, but runtime config must fail fast if required values are absent.

---

# Step 7 — Register resources and auth

Register resources in `App.tsx` and wire them into an authenticated `Admin` root.

Generated `App.tsx` must:

- register the shared `dataProvider`
- register the mandatory `authProvider`
- configure the app so it does not operate anonymously once auth is enabled

Example shape:

```tsx
<Admin dataProvider={dataProvider} authProvider={authProvider}>
  <Resource name="equipment" ... />
</Admin>
```

---

# Step 8 — Frontend runtime config

Generate frontend env examples and config access for:

- `VITE_API_URL`
- `VITE_KEYCLOAK_URL`
- `VITE_KEYCLOAK_REALM`
- `VITE_KEYCLOAK_CLIENT_ID`

`client/.env.example` must use filled example values that match the documented Keycloak and local dev topology, while runtime code must fail fast if any required variable is missing.
