# Runtime Keycloak Auth

This repository now uses Keycloak-based authentication for the runtime application only (`client/` and `server/`).

## Required environment variables

### Frontend (`client/.env`)

- `VITE_API_URL` (example: `http://localhost:3000`)
- `VITE_KEYCLOAK_URL` (example: `https://sso.greact.ru`)
- `VITE_KEYCLOAK_REALM` (example: `toir`)
- `VITE_KEYCLOAK_CLIENT_ID` (example: `toir-frontend`)

The frontend fails fast at startup if any required auth/env variable is missing.

### Backend (`server/.env`)

- `PORT` (example: `3000`)
- `DATABASE_URL`
- `CORS_ALLOWED_ORIGINS` (comma-separated list)
- `KEYCLOAK_ISSUER_URL` (example: `https://sso.greact.ru/realms/toir`)
- `KEYCLOAK_AUDIENCE` (example: `toir-backend`)
- `KEYCLOAK_JWKS_URL` (optional)

Backend validates required env vars at startup and fails fast if missing.

## Frontend auth flow

- The SPA initializes Keycloak before rendering.
- Authentication is redirect-based Keycloak login only (no custom username/password form).
- Authorization Code + PKCE (`S256`) is used.
- Access token is attached to every API request via `Authorization: Bearer <token>`.
- `checkError` behavior:
  - `401`: force re-authentication.
  - `403`: keep session and surface access denied to React Admin.
- Token refresh is concurrency-safe: parallel requests share one in-flight refresh operation.

## Backend JWT validation and RBAC

- JWTs are verified against:
  - issuer: `KEYCLOAK_ISSUER_URL`
  - audience: `KEYCLOAK_AUDIENCE`
- JWKS resolution priority:
  1. explicit `KEYCLOAK_JWKS_URL`
  2. OIDC discovery (`/.well-known/openid-configuration`)
  3. fallback `${issuer}/protocol/openid-connect/certs`
- RBAC source is only `realm_access.roles`.

Role policy applied to CRUD endpoints:

- `GET`: `viewer`, `editor`, `admin`
- `POST`, `PATCH` (and `PUT` if added): `editor`, `admin`
- `DELETE`: `admin`

Public route:

- `GET /health`

All other existing API routes require authentication.

