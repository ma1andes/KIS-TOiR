# Runtime Bootstrap

After project generation, the following commands and prerequisites must work in order so that the application runs without ad-hoc auth or database setup.

The generator must produce a **runnable development environment** consisting of:

- external Keycloak identity provider
- backend API
- frontend SPA
- PostgreSQL database

The generator must also produce the runtime artifacts required to bootstrap auth from zero, including a root-level Keycloak realm import artifact. The repository default example filename is `toir-realm.json`, but future generations must allow a project-specific equivalent.

---

# Bootstrap Sequence

## 1. Prepare Keycloak

Before starting the application, ensure an external Keycloak server is reachable and import or verify the generated realm artifact:

- root-level generated Keycloak realm import artifact
- repository default example filename: `toir-realm.json`

The runtime instructions must require importing or verifying this realm before frontend/backend startup.

Keycloak bootstrap expectations:

- realm import is self-contained
- frontend client exists
- backend audience client exists
- realm roles exist
- issued access tokens reliably contain `sub`, `aud`, and `realm_access.roles`

The generator must not rely on undeclared built-in client scopes magically existing after realm import.

---

## 2. Start the database

From the **project root**:

```bash
docker compose up -d
```

This starts the PostgreSQL container. The backend connects to it using `DATABASE_URL` from `server/.env`.

---

## 3. Backend setup and start

```bash
cd server
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run start
```

- `npm install` installs dependencies and runs `postinstall` if configured.
- `npx prisma generate` ensures Prisma client is generated explicitly after install or schema changes.
- `npx prisma migrate dev` creates/applies migrations.
- `npx prisma db seed` inserts minimal development data.
- `npm run start` starts the NestJS server.

Backend startup requirements:

- required database and auth env vars must be present
- startup must fail fast if required env vars are missing
- CORS must support the SPA -> API bearer-token model
- `/health` must remain public

---

## 4. Frontend setup and start

In a separate terminal, from the **project root**:

```bash
cd client
npm install
npm run dev
```

- `npm install` installs frontend dependencies including `keycloak-js`.
- `npm run dev` starts the Vite dev server.

Frontend startup requirements:

- required Vite auth vars must be present
- startup must fail fast if required auth vars are missing
- Keycloak must initialize before the SPA is rendered
- login must use redirect-based Keycloak authentication only

---

# Success Criteria

After completing the bootstrap sequence:

- Keycloak is reachable and the generated realm has been imported or verified.
- Database container is running and Prisma can connect.
- Backend responds on `/health` without auth.
- Protected backend routes require a valid bearer token.
- Frontend loads, redirects through Keycloak login when needed, and uses bearer auth for all API calls.

The generator is responsible for producing all artifacts and instructions needed for this sequence:

- `docker-compose.yml`
- schema
- migrations
- seed
- backend/frontend env examples
- health endpoint
- auth infrastructure
- root-level Keycloak realm import artifact

Docker scope must remain limited to PostgreSQL. Keycloak remains an external dependency in this repository.
