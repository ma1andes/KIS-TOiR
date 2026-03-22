# Auth Rules

This repository keeps the current LLM-first CRUD generation architecture as the primary working baseline.

- Auth is part of the default generation path, not a post-generation addon.
- `server/` is the active backend target output path.
- `client/` is the active frontend target output path.
- The generated runtime stays SPA + API + external Keycloak + PostgreSQL only.

## Frontend auth invariants

- Use `keycloak-js` with redirect-based login only.
- Initialize Keycloak before rendering the SPA.
- Use Authorization Code Flow + PKCE (`S256`).
- Keep `authProvider`, `dataProvider`, `getIdentity()`, `getPermissions()`, and `checkError()` as stable provider seams.
- Derive identity from token claims already present in the parsed token.
- Do not call `loadUserProfile()` and do not depend on `/account` for the baseline app.
- `401` must force re-authentication; `403` must stay an authorization error.
- Keep token handling in memory and refresh through one shared in-flight operation.

## Working runtime defaults

Use the already working project defaults unless a prompt explicitly overrides them.

- Frontend Keycloak base URL example:
  - `VITE_KEYCLOAK_URL=https://sso.greact.ru`
- Frontend realm and client example:
  - `VITE_KEYCLOAK_REALM=toir`
  - `VITE_KEYCLOAK_CLIENT_ID=toir-frontend`
- Backend issuer and audience example:
  - `KEYCLOAK_ISSUER_URL=https://sso.greact.ru/realms/toir`
  - `KEYCLOAK_AUDIENCE=toir-backend`
- CORS example:
  - `CORS_ALLOWED_ORIGINS=http://localhost:5173,https://toir-frontend.greact.ru`

Anti-regression rule:

- Do not switch the baseline Keycloak example back to `http://localhost:8080` in generated `.env.example` files unless the prompt explicitly asks for a local Keycloak runtime.
- Localhost Keycloak values may exist in private `.env.local` or `.env` overrides, but they are not the default project examples.

## Backend auth invariants

- Verify JWTs with `jose`.
- Validate issuer + audience + signature via JWKS.
- Resolve JWKS in this order:
  1. `KEYCLOAK_JWKS_URL`
  2. OIDC discovery at `/.well-known/openid-configuration`
  3. `${issuer}/protocol/openid-connect/certs`
- Extract roles only from `realm_access.roles`.
- Keep `/health` public and all generated CRUD routes protected by default.

## Auth anti-regression invariants

- The accepted JWKS resolution chain above is the only baseline truth path. Do not document one order and implement another.
- If auth implementation changes, `prompts/auth-rules.md` and `prompts/validation-rules.md` must be updated in the same change.
- Do not skip OIDC discovery when no explicit `KEYCLOAK_JWKS_URL` is provided.
- Do not switch role extraction to alternative claims unless the prompt explicitly changes the baseline contract.
- Do not reintroduce localhost Keycloak defaults into shared baseline examples.

## Realm artifact contract

- A physical root-level `*-realm.json` artifact is mandatory output.
- The artifact must be importable, versioned, and aligned with generated backend/frontend env contracts.
- It must parameterize:
  - realm name
  - frontend client id
  - backend client id / audience
  - local and production frontend URLs
  - artifact filename
- It must explicitly deliver:
  - `sub`
  - `aud`
  - `realm_access.roles`
- It must define:
  - realm roles `admin`, `editor`, `viewer`
  - a public SPA client with PKCE S256
  - a bearer-only backend client
  - an explicit audience client scope
  - explicit protocol mappers for baseline identity and role claims
