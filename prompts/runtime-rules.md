# Runtime Rules

This repository keeps the current LLM-first CRUD generation architecture as the primary working baseline and strengthens the existing pipeline instead of replacing it.

## Baseline runtime topology

- `server/` is the active backend target output path.
- `client/` is the active frontend target output path.
- Docker scope remains PostgreSQL only.
- Keycloak remains external to the repository runtime.
- The project remains LLM-first: markdown knowledge blocks in `prompts/` orchestrate generation, while active generated/maintained code lives in `server/` and `client/`.

## Required input and derived artifacts

- Source of truth:
  - `domain/*.dsl`
- Required derived artifacts:
  - `domain-summary.json`
  - root-level `*-realm.json`

`domain-summary.json` exists to stabilize generation and validation; it must be regenerated from the DSL and treated as non-authoritative.

## Output contract

The strengthened baseline must produce and keep aligned:

- `server/prisma/schema.prisma`
- backend/frontend env examples
- backend/frontend auth seams
- root `.gitignore`, `server/.gitignore`, `client/.gitignore`
- `docker-compose.yml`
- `domain-summary.json`
- root-level realm import artifact

## Concrete runtime examples

Use these as the baseline examples for this project unless the prompt explicitly overrides them:

- Backend:
  - `PORT=3000`
  - `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/toir"`
  - `CORS_ALLOWED_ORIGINS="http://localhost:5173,https://toir-frontend.greact.ru"`
  - `KEYCLOAK_ISSUER_URL="https://sso.greact.ru/realms/toir"`
  - `KEYCLOAK_AUDIENCE="toir-backend"`
- Frontend:
  - `VITE_API_URL=http://localhost:3000`
  - `VITE_KEYCLOAK_URL=https://sso.greact.ru`
  - `VITE_KEYCLOAK_REALM=toir`
  - `VITE_KEYCLOAK_CLIENT_ID=toir-frontend`

These example values come from the already working runtime shape and are preferred over local-only Keycloak placeholders.

## Runtime bootstrap

1. Import the root-level realm artifact into Keycloak.
2. Start PostgreSQL with `docker compose up -d`.
3. From `server/` run:
   - initialize or repair the workspace with official Nest CLI scaffolding if required before generating domain code
   - `npm install`
   - `npx prisma generate`
   - `npx prisma migrate dev`
   - `npx prisma db seed`
   - `npm run build`
   - `npm run start`
4. From `client/` run:
   - initialize or repair the workspace with official Vite React TypeScript scaffolding if required before generating app code
   - `npm install`
   - `npm run build`
   - `npm run dev`

## Recovery and completion rules

- Repair degraded framework workspaces before applying any new domain-derived generation changes.
- Do not mark generation complete while `server/` or `client/` remains non-buildable.
- If dependency installation has not happened yet, buildability may be reported as skipped, but it must never be reported as green without verification.
- Runtime/bootstrap instructions are reusable project baseline rules; TOiR names remain examples, not the only supported domain project.

## Scaffold expectations

- NestJS workspace creation should follow the official Nest CLI path for new applications and resource scaffolding.
- Vite frontend creation should follow the official Vite `create-vite` path for React TypeScript applications.
- The LLM may customize generated code after scaffold creation, but must not replace official workspace initialization with ad hoc file creation.

## Common generation failures to avoid

- starting feature generation before scaffold repair
- leaving deleted framework config files unrepaired because the current diff looks smaller
- accepting a form-only validation pass while buildability is unknown
- binding runtime rules to one project-specific DSL filename instead of `domain/*.dsl`

## Baseline intent

- No new generator engine
- No compiler platform
- No planner/emitter/runtime redesign
- Only the current LLM-first pipeline, strengthened by summary, realm, and validation artifacts
