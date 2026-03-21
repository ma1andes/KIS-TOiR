# Frontend Generation Process

Frontend generation must produce the React Admin CRUD application **and** the default Keycloak integration required by the runtime architecture.

Follow:

- `frontend/architecture.md`
- `frontend/react-admin-rules.md`
- `auth/keycloak-architecture.md`
- `auth/frontend-auth-rules.md`
- `auth/keycloak-realm-template-rules.md`

---

# Step 1 — Parse DSL

Extract:

- entities
- attributes
- relation fields required for reference inputs and reference displays

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

Resource generation must remain compatible with the auth-aware shared request seam.

---

# Step 4 — Map fields

Map DSL attributes to React Admin components according to existing field rules and relation semantics.

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
