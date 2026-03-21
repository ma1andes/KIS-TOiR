# Project Scaffolding Rules

The generator must use **official CLI tools** to create base project structures.

The AI must **not** manually generate the entire project skeleton by hand. CLI scaffolding reduces drift and keeps the generated project aligned with current NestJS and Vite conventions.

Auth is part of the default generated runtime. Scaffolding must therefore install the required frontend and backend auth dependencies during the normal project bootstrap path.

---

# Backend Scaffolding

Use **NestJS CLI**.

## Command

```bash
npx @nestjs/cli@10.3.2 new server --package-manager npm --skip-git
```

## Rules

- **Project directory** must be `server`.
- **TypeScript** must be used.
- **npm** must be the package manager.
- **Git** initialization must be skipped.

## After scaffolding — install required dependencies

Run from the `server` directory:

```bash
npm install @prisma/client
npm install @nestjs/config
npm install jose
npm install prisma --save-dev
```

## Backend auth dependency rules

- `jose` must be installed by default because JWT verification is part of the default generated backend.
- The generator must **not** install deprecated Keycloak-specific Node adapters such as `keycloak-connect`.

---

# Frontend Scaffolding

Use **Vite CLI**.

## Command

```bash
npm create vite@5.2.0 client -- --template react-ts
```

## Rules

- **Project directory** must be `client`.
- **React + TypeScript** template must be used.

## After scaffolding — install required dependencies

Run from the `client` directory:

```bash
npm install react-admin
npm install ra-data-simple-rest
npm install @mui/material @emotion/react @emotion/styled
npm install keycloak-js
```

## Frontend auth dependency rules

- `keycloak-js` must be installed by default because redirect-based Keycloak login is part of the default generated frontend.
- The generated frontend must use `keycloak-js` for Authorization Code + PKCE and must not generate a custom in-app username/password login form.

---

# Scaffolding Strategy

Generation pipeline order:

1. **Parse DSL** — Read domain, DTO, API, and UI DSL files.
2. **Run CLI scaffolding** — Create `server` with NestJS CLI and `client` with Vite CLI; install runtime and auth dependencies listed above.
3. **Code generation** — Generate Prisma schema, NestJS modules/DTOs/PrismaService/auth infrastructure, and React Admin resources/auth integration.
4. **Runtime infrastructure** — Generate backend/frontend `.env.example`, runtime config files, lifecycle scripts, and a root-level Keycloak realm import artifact (repository default example filename: `toir-realm.json`).
5. **Database runtime** — Generate `docker-compose.yml` in project root with PostgreSQL service (`postgres`, image `postgres:16`, port `5432:5432`).
6. **Migration** — Apply schema with `npx prisma migrate dev`.
7. **Seed** — Populate minimal development data with `npx prisma db seed`.
8. **Validation** — Run checks from `generation/post-generation-validation.md`, including auth validation and realm-template validation.

Scaffolding (steps 1–2) must be done with the CLI. Steps 3–8 must be generated from the DSL and the project context documents, including the auth-specific context in `auth/*.md`.
