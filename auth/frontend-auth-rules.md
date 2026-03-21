# Frontend Auth Rules

This document defines mandatory frontend authentication behavior for generated applications.

---

# Generated Files

The generator must create at minimum:

- `client/src/config/env.ts`
- `client/src/auth/keycloak.ts`
- `client/src/auth/authProvider.ts`
- `client/src/App.tsx`
- `client/src/main.tsx`
- `client/src/dataProvider.ts`
- `client/.env.example`

`App.tsx`, `main.tsx`, and `dataProvider.ts` must be generated in an auth-aware form. Auth must not be bolted on later.

---

# Login Model

The generated frontend must use:

- **Keycloak JS**
- **Authorization Code Flow + PKCE**
- **PKCE method `S256`**
- **redirect-based login only**

The generator must **not** create a custom in-app username/password login form.

The generated SPA must initialize Keycloak **before rendering** the application. The app must not operate anonymously once auth is enabled.

---

# React Admin Integration

The generated frontend must use a React Admin **`authProvider`** and connect it at the `Admin` root.

Rules:

1. `authProvider` is mandatory.
2. The generated `Admin` root must enforce authenticated operation.
3. Auth bootstrap must happen before rendering `Admin`.

The generated frontend must not rely on anonymous access with later lazy auth attachment.

---

# Shared Request Seam

The generated frontend must use the shared request seam in `client/src/dataProvider.ts` as the single place where access tokens are attached.

Rules:

1. All backend requests must carry `Authorization: Bearer <access_token>`.
2. This must cover all React Admin calls, including:
   - list
   - get one
   - get many
   - get many reference
   - create
   - update
   - delete
3. Reference/resource lookups must flow through the same authenticated request seam.

The generator must not scatter token attachment across resource components.

---

# Error Semantics

The generated `authProvider.checkError` must distinguish authentication failures from authorization failures:

- `401` -> force logout / re-authentication
- `403` -> do **not** re-authenticate; surface access denied / permission error to React Admin

The generator must not treat `401` and `403` as equivalent.

---

# Token Refresh

The generated frontend must refresh tokens before protected API calls when needed.

Refresh behavior must be **concurrency-safe**:

- use one shared in-flight refresh operation
- parallel requests must wait for the same refresh promise
- do not trigger multiple parallel refresh requests for the same expiry window

The generator must explicitly describe or implement the shared in-flight refresh pattern.

---

# Browser Storage Rules

The generated frontend must **not** store access tokens or refresh tokens in:

- `localStorage`
- `sessionStorage`

In-memory handling via Keycloak JS behavior is the default rule for this repository.

---

# Frontend Environment Contract

The generated frontend env contract must include:

- `VITE_API_URL`
- `VITE_KEYCLOAK_URL`
- `VITE_KEYCLOAK_REALM`
- `VITE_KEYCLOAK_CLIENT_ID`

The generated frontend config module must **fail fast** if required auth variables are missing.

The generated frontend must not silently fall back to production auth settings in code.

---

# Default Values for Examples

`client/.env.example` must use these repository defaults as examples:

```env
VITE_API_URL=http://localhost:3000
VITE_KEYCLOAK_URL=https://sso.greact.ru
VITE_KEYCLOAK_REALM=toir
VITE_KEYCLOAK_CLIENT_ID=toir-frontend
```

