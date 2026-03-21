# Backend Runtime Rules

This document defines runtime configuration requirements for the generated backend. Generators must produce a project that runs without errors when these rules are followed.

---

# Environment Variables

The backend **must** have a `.env` file at the project root (e.g. `server/.env` or backend package root). This file must **not** be committed with real credentials; provide an example instead (e.g. `.env.example`).

## Required variables

| Variable             | Required | Description |
| -------------------- | -------- | ----------- |
| PORT                 | Yes      | Backend listen port |
| DATABASE_URL         | Yes      | PostgreSQL connection string for Prisma |
| CORS_ALLOWED_ORIGINS | Yes      | Comma-separated SPA origins allowed to call the API |
| KEYCLOAK_ISSUER_URL  | Yes      | Keycloak issuer URL used for JWT verification |
| KEYCLOAK_AUDIENCE    | Yes      | Backend audience/client expected in access tokens |
| KEYCLOAK_JWKS_URL    | No       | Optional explicit JWKS URL |

## Example

```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/toir"
CORS_ALLOWED_ORIGINS="http://localhost:5173,https://toir-frontend.greact.ru"
KEYCLOAK_ISSUER_URL="https://sso.greact.ru/realms/toir"
KEYCLOAK_AUDIENCE="toir-backend"
# KEYCLOAK_JWKS_URL="https://sso.greact.ru/realms/toir/protocol/openid-connect/certs"
```

## Generation requirement

When generating the backend, **always** create:

1. **`.env.example`** — with placeholder DATABASE_URL and instructions.
2. **`.env`** — with local development example values so the app can start.

If the generator does not create `.env`, the first run will fail with:

```
Environment variable not found: DATABASE_URL
```

## Fail-fast requirement

The generated backend must validate required runtime and auth variables at startup.

Rules:

1. Missing required auth variables must stop startup immediately.
2. The generated backend must not silently fall back to production auth settings in code.
3. Auth env validation must be implemented explicitly in generated config/bootstrap code.

---

# Authentication Runtime Rules

The generated backend must verify JWTs against Keycloak using:

- issuer
- audience
- JWKS

JWKS resolution priority must be exactly:

1. explicit `KEYCLOAK_JWKS_URL`
2. OIDC discovery
3. `${issuer}/protocol/openid-connect/certs`

The generated backend must extract authorization roles only from `realm_access.roles`.

---

# Prisma Client Generation

After the Prisma schema is generated or modified, the Prisma client must be generated.

## Command

```bash
npx prisma generate
```

## Lifecycle rule

Add to generated `package.json` so that `prisma generate` runs after every `npm install`:

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

This ensures that after cloning or installing dependencies, the Prisma client is available without a manual step.

**Note:** Path may need to be adjusted if Prisma schema lives in a subfolder (e.g. `prisma generate` is typically run from the package root where `prisma/schema.prisma` exists).

---

# Database Migration

The generation process must document and support database migration.

## Command

```bash
npx prisma migrate dev
```

Run after:

1. Prisma schema has been generated or updated.
2. `npx prisma generate` has been run.

## Generation requirement

1. Include migration in the backend generation pipeline (see `generation/backend-generation.md`).
2. Document in README or post-generation validation that the user must run `npx prisma migrate dev` before first run (or provide a setup script that runs it).

---

# CORS Rules

The generated backend must support the SPA -> API bearer-token model explicitly.

Rules:

1. Use `CORS_ALLOWED_ORIGINS` as the allowed origin list.
2. Allow at minimum these example origins in `.env.example`:
   - `http://localhost:5173`
   - `https://toir-frontend.greact.ru`
3. Allow `Authorization` and JSON content headers.
4. Expose `Content-Range` because React Admin depends on it.
5. Do not enable credentials by default.

---

# Summary

| Requirement             | Action |
| ----------------------- | ------ |
| Runtime env             | Create `.env` and `.env.example` with DB, auth, and CORS variables |
| Fail-fast config        | Validate required auth/runtime variables at startup |
| Prisma client           | Run `npx prisma generate`; add `postinstall` script |
| Database schema         | Document/run `npx prisma migrate dev` after schema generation |
| JWT verification        | Use issuer + audience + JWKS with explicit resolution priority |
| Role extraction         | Use only `realm_access.roles` |
| CORS                    | Support SPA -> API bearer flow and expose `Content-Range` |
