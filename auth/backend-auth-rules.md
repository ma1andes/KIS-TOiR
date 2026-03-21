# Backend Auth Rules

This document defines mandatory backend authentication and authorization behavior for generated applications.

---

# Generated Backend Auth Surface

The generator must create explicit auth infrastructure in the generated NestJS backend.

At minimum generate:

- `server/src/auth/auth.module.ts`
- JWT auth guard
- roles guard
- `@Public()`
- `@Roles()`
- typed authenticated principal interface
- typed environment validation in `server/src/config/`

The generator must not describe backend auth as an external manual integration step.

---

# Standards-Based JWT Verification

The generated backend must validate JWTs against Keycloak using standards-based libraries.

Rules:

1. Verify **issuer**
2. Verify **audience**
3. Verify signature via **JWKS**
4. Do **not** use deprecated Keycloak-specific Node adapters such as `keycloak-connect`

The default library rule for this repository is:

- **`jose`** for JWT and JWKS verification

---

# JWT Verification Contract

The generated backend must verify tokens with:

- `KEYCLOAK_ISSUER_URL`
- `KEYCLOAK_AUDIENCE`

JWKS resolution priority must be exactly:

1. explicit `KEYCLOAK_JWKS_URL`
2. OIDC discovery
3. fallback `${issuer}/protocol/openid-connect/certs`

The generator must encode this priority explicitly.

---

# Role Extraction

Authorization roles must be extracted **only** from:

- `realm_access.roles`

The generator must not mix in:

- resource roles
- custom frontend-only permissions
- undocumented claim fallbacks

`realm_access.roles` is the single RBAC source for this repository.

---

# Default RBAC Policy

Apply these RBAC defaults to generated CRUD controllers:

- `GET`: `viewer`, `editor`, `admin`
- `POST`: `editor`, `admin`
- `PATCH`: `editor`, `admin`
- `PUT`: `editor`, `admin`
- `DELETE`: `admin`

`GET /health` must remain public and must use the generated `@Public()` mechanism.

All other generated CRUD routes must be protected by default.

---

# Typed Principal

The generated backend must attach a typed authenticated principal to the request context.

At minimum, the generated principal type must be able to represent:

- `sub`
- user identity fields when present
- `roles`
- raw claims payload

This principal type is required so guards, controllers, and tests share one consistent contract.

---

# Backend Environment Contract

The generated backend env contract must include:

- `PORT`
- `DATABASE_URL`
- `CORS_ALLOWED_ORIGINS`
- `KEYCLOAK_ISSUER_URL`
- `KEYCLOAK_AUDIENCE`
- `KEYCLOAK_JWKS_URL` (optional)

The generated backend config must **fail fast** if required auth variables are missing.

The generated backend must not silently fall back to production auth settings in code.

