This repository keeps the current LLM-first CRUD generation architecture as the primary working baseline.

It is not a new generator engine and it is not a compiler platform. The repository remains:

- an AI generation context
- an active generated and maintained fullstack CRUD project
- `server/` as the active backend target output path
- `client/` as the active frontend target output path
- an LLM-first orchestration baseline with CLI-first framework bootstrap
- a compact rule set that strengthens the existing pipeline with:
  - `domain-summary.json`
  - a physical root-level realm artifact
  - a lightweight automated validation gate

## Active knowledge blocks

The active prompt corpus is intentionally normalized to six stable blocks:

1. [prompts/general-prompt.md](prompts/general-prompt.md)
2. [prompts/auth-rules.md](prompts/auth-rules.md)
3. [prompts/backend-rules.md](prompts/backend-rules.md)
4. [prompts/frontend-rules.md](prompts/frontend-rules.md)
5. [prompts/runtime-rules.md](prompts/runtime-rules.md)
6. [prompts/validation-rules.md](prompts/validation-rules.md)

## Baseline contracts

- `domain/*.dsl` is the source of truth for the domain model.
- [domain-summary.json](domain-summary.json) is a derived artifact for LLM stabilization and validation.
- [toir-realm.json](toir-realm.json) is the physical Keycloak bootstrap artifact baseline.
- `server/` and `client/` are the active target output paths for this repository.
- `server/` must remain a valid NestJS workspace baseline.
- `client/` must remain a valid Vite React TypeScript workspace baseline.

## Scaffold baseline

- Generation remains LLM-first for orchestration and domain-derived feature code.
- Framework bootstrap is CLI-first:
  - backend baseline starts from official Nest CLI conventions
  - frontend baseline starts from official Vite React TypeScript conventions
- If `server/` or `client/` drift away from a valid workspace, repair the workspace baseline before generating more feature code.
- Do not replace the framework workspace with a hand-written minimal skeleton.

## Anti-regression contract

- The active prompts define forbidden generation patterns, required invariants, and recovery rules for future agents.
- Buildability is part of the baseline contract, not an optional follow-up.
- Validation targets `domain/*.dsl` as reusable source inputs, while TOiR names remain project defaults/examples.

## Repository layout

- [docs/repository-structure.md](docs/repository-structure.md) explains the normalized folder structure.
- Active prompts live in `prompts/`.
- Helper scripts live in `tools/`.

## Commands

```bash
npm run generate:domain-summary
npm run validate:generation
npm run validate:generation:runtime
```

`npm run validate:generation` now checks both contract shape and workspace validity. When dependencies are installed, it also verifies `npm run build` in `server/` and `client/`. If dependencies are missing, it reports build verification as skipped instead of pretending the baseline is fully green.

## AID export (OpenAPI + app generator)

HTTP-экспортёры для интеграции с AID: **`POST /aid/export/openapi`** (api-format → OpenAPI 3.0) и **`POST /aid/export/app`** (DSL → бандл файлов или `--apply`). Подробно: **[docs/AID_EXPORT_README.md](docs/AID_EXPORT_README.md)**.
