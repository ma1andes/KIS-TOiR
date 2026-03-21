# Keycloak Architecture

This repository generates a fullstack CRUD application with **default Keycloak authentication and authorization**. Authentication is not an optional add-on and must not be described as a manual post-generation task.

---

# Default Auth Model

The generated application must use this runtime topology:

- **Frontend:** SPA served by Vite + React Admin
- **Backend:** NestJS API
- **Auth transport:** `Authorization: Bearer <access_token>`
- **Identity provider:** external Keycloak server

The generated application must **not** use:

- a BFF layer
- cookie/session authentication
- a custom in-app username/password login form

The generated application must use **redirect-based Keycloak login** only.

---

# Auth Is Part of Default Generation

The generator must produce:

- authenticated frontend bootstrap and request flow
- authenticated backend bootstrap and request guards
- auth-aware env examples
- auth-aware validation rules
- a root-level Keycloak realm import artifact that describes the Keycloak realm/client bootstrap

Repository defaults may use names such as `toir`, `toir-frontend`, `toir-backend`, and `toir-realm.json`, but future generations must parameterize realm name, client IDs, production URLs, and artifact filename from the generated project or explicit auth configuration.

The generated application must not require a separate prompt step such as "now add auth manually".

---

# Public and Protected Routes

The generated backend must keep:

- `GET /health` — public

All generated CRUD routes must be protected by default.

Authorization must be role-based and must use **only** Keycloak realm roles from `realm_access.roles`.

---

# Default Role Policy

Apply these RBAC defaults to generated CRUD controllers:

- `GET` list/detail: `viewer`, `editor`, `admin`
- `POST`, `PATCH`, `PUT`: `editor`, `admin`
- `DELETE`: `admin`

The frontend may use roles for display and permission awareness, but the backend remains the enforcement point.

---

# Token Contract

Generated auth context must guarantee that access tokens used by the SPA and API reliably contain:

- `sub`
- `aud`
- `realm_access.roles`

The frontend client and backend audience/client must be documented explicitly. The generator must not rely on undocumented Keycloak defaults for these claims.

---

# Runtime Boundaries

The repository's local runtime topology remains unchanged:

- `docker-compose.yml` provisions PostgreSQL only
- Keycloak remains external to this repo's Docker runtime

The generator must therefore produce:

- runtime documentation for importing/configuring the generated realm import artifact
- env contracts for frontend and backend
- validation rules that assume an external but reachable Keycloak server
