# Developer Workflow

This document describes the **developer workflow** for running a generated fullstack application locally. The generator must produce a project that supports this workflow so the app is **fully runnable** after generation, including authentication.

This workflow assumes the project was generated from `domain/*.dsl` plus optional non-duplicating overrides only. Developers must not need to prepare separate DTO/API/UI DSL inputs before running the app.

---

# Prerequisites

- **Node.js** (LTS, e.g. 18+)
- **npm**
- **Docker** and **Docker Compose** (for the development database)
- **External Keycloak server** reachable by the generated frontend and backend

The generated project must not require the developer to invent auth wiring manually after generation.

---

# Workflow Steps

## 1. Prepare Keycloak and env files

From the project root, the generated project must include:

- root-level generated Keycloak realm import artifact
  - repository default example filename: `toir-realm.json`
- `server/.env.example`
- `client/.env.example`

Required workflow:

1. Copy the generated env examples to real env files as needed.
2. Fill all required backend and frontend auth variables.
3. Import or verify the generated Keycloak realm import artifact in the external Keycloak server before starting the app.

The generator must document that auth config is fail-fast. Missing required auth env vars must stop startup instead of silently falling back to production values in code.

---

## 2. Start the database

From the **project root**:

```bash
docker compose up -d
```

This starts the PostgreSQL container defined in `docker-compose.yml`. Wait a few seconds for the database to accept connections.

Verify if needed:

```bash
docker compose ps
```

---

## 3. Backend setup and start

From the **server** directory:

```bash
cd server
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run start
```

- `npm install` installs dependencies and runs `postinstall` when configured.
- `npx prisma generate` explicitly generates Prisma client.
- `npx prisma migrate dev` creates/applies migrations.
- `npx prisma db seed` inserts minimal development data.
- `npm run start` starts the NestJS backend.

The API should be available at the configured port (for example `http://localhost:3000`).

Verify:

```bash
curl http://localhost:3000/health
```

Expected: `{ "status": "ok" }` (or equivalent).

Generated backend behavior must also ensure:

- protected CRUD routes require authentication by default
- insufficient roles result in `403`
- `/health` remains public

---

## 4. Frontend setup and start

In a **separate terminal**, from the **project root**:

```bash
cd client
npm install
npm run dev
```

- `npm install` installs frontend dependencies including `keycloak-js`.
- `npm run dev` starts the Vite dev server (for example `http://localhost:5173`).

Open the frontend URL in a browser. The generated React Admin app must:

- initialize Keycloak before render
- use redirect-based login only
- authenticate against the configured Keycloak realm/client
- call the backend with bearer tokens through the shared request seam

---

# Summary

| Step | Command / location |
|------|---------------------|
| Prepare Keycloak + env | Fill `server/.env` and `client/.env`; import or verify the generated realm import artifact |
| Start database | From root: `docker compose up -d` |
| Backend setup/start | `cd server && npm install && npx prisma generate && npx prisma migrate dev && npx prisma db seed && npm run start` |
| Frontend setup/start | `cd client && npm install && npm run dev` |

The generator must produce all required artifacts so that this workflow succeeds:

- docker-compose
- env examples
- schema
- migrations
- seed
- health endpoint
- frontend auth integration
- backend auth infrastructure
- root-level Keycloak realm import artifact
