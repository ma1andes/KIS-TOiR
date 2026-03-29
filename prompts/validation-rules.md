# Validation Rules

Validation is now a lightweight automated gate instead of a prose-only checklist.

## Commands

- `npm run generate:domain-summary`
- `npm run validate:generation`
- `npm run validate:generation:runtime`

## Prompt-Gate Alignment Rule

- Every invariant described as required in the active prompt corpus must either be enforced by this gate or be called out explicitly as a manual/runtime-only check.
- Validation must not stay silent about a violation that the prompts describe as forbidden.
- Validation must not report green buildability when build verification was skipped.

## Gate groups

### Build checks

- at least one `domain/*.dsl` file exists
- required artifacts exist
- Prisma schema exists
- frontend/backend env contracts exist
- frontend/backend framework workspace files exist
- `domain-summary.json` matches the current DSL
- project `.env.example` files keep the working domain-based Keycloak examples unless explicitly overridden
- `server/` remains a valid Nest workspace
- `client/` remains a valid Vite workspace
- generation must not pass validation if framework scaffolding files were deleted and replaced by a hand-written minimal skeleton
- if dependencies are installed, build verification runs for `server/` and `client/`
- if dependencies are missing, build verification is reported as skipped with reason instead of green

### Auth checks

- frontend auth seam files exist
- backend auth seam files exist
- `401` and `403` semantics stay split
- auth code keeps the required Keycloak/JWT contracts
- JWKS resolution chain matches the contract:
  1. explicit `KEYCLOAK_JWKS_URL`
  2. OIDC discovery
  3. certs fallback

### Filter checks

- list resources expose filter UI (including `FilterButton`)
- reference filters use `ReferenceInput` + `AutocompleteInput` with `filterToQuery`
- data provider preserves repeated query params for array filters
- backend FK filters keep exact-match semantics
- enum repeated params are mapped to Prisma `in`
- typed form mapping is preserved:
  - `integer` / `decimal` -> `NumberInput`
  - `date` -> `DateInput`
- reference fields intended for navigation keep `ReferenceField link="show"`
- resources keep `show={...}` registration in `App.tsx`

### Natural-key checks

- response records expose `id`
- route/update contracts use the real primary key
- natural-key sort/update paths do not regress to a fake physical `id`

### Realm checks

- a root `*-realm.json` artifact exists
- realm roles exist
- audience delivery exists
- required claims are explicit
- SPA/backend client structure is explicit

### Runtime checks

- compose topology stays PostgreSQL-only
- Prisma lifecycle scripts remain in place
- `/health` stays public
- backend can execute `npm run build` inside `server/`
- frontend can execute `npm run build` inside `client/` after dependencies are installed
- client/server `.env.example` stay aligned with the working runtime defaults:
  - `https://sso.greact.ru`
  - `toir`
  - `toir-frontend`
  - `toir-backend`
  - `https://toir-frontend.greact.ru`
- optional runtime execution mode runs:
  - `npx prisma generate`
  - `npx prisma migrate dev`
  - `npx prisma db seed`

### API error contract (backend ↔ frontend)

- Backend errors use the shared `ApiExceptionFilter` shape: `statusCode`, `message` (**`string` or `string[]`** — для списков ошибок валидации), `code`, optional `details`, `path`, `timestamp`.
- Список ошибок валидации отдаётся в JSON как **`message: string[]`**, без склейки через `", "` на сервере (клиент сам склеивает для UI, например через `\n`).
- Клиентский `dataProvider` не должен резать одну строку `message` по запятым — только обрабатывать массив или целую строку.
- Подписи полей для русских сообщений `ValidationPipe` генерируются из DSL в **`server/src/common/field-labels.generated.ts`** (не дублировать огромный словарь вручную в `main.ts`).
- Поля DSL `decimal` в DTO принимают **число** (как шлёт React Admin `NumberInput`); в сервисе конвертация в `Prisma.Decimal` сохраняется.
- Атрибуты-enum в DTO валидируются **`@IsIn([...])`** по значениям enum из DSL, а не только `@IsString`.
- Бандл AID (`collectGeneratedBundle`) включает копии **`generation/templates/runtime/*`** (`main.ts`, `api-exception.filter.ts`, `dataProvider.ts`, `AppNotification.tsx`) — это канонический источник для шва ошибок; при `--apply` они перезаписываются в `server/` и `client/`.

### Scaffold checks

- backend initialization starts from official Nest CLI scaffolding
- frontend initialization starts from official Vite React TypeScript scaffolding
- feature generation happens after scaffold creation, not instead of scaffold creation
- repair happens before generation when workspace is degraded
- required framework configs and entry files must survive subsequent LLM edits

The automated gate is intentionally small. It enforces the critical reproducibility contract without turning the repository into a test platform or a generator engine.
