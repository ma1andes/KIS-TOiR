# Frontend Rules

The frontend stays a React Admin SPA generated from `domain/*.dsl` and anchored to the existing auth seams.

## Frontend scaffold baseline

- Start frontend initialization from the official Vite React TypeScript scaffold, not from manually assembled files.
- Preserve a valid Vite workspace baseline, including:
  - `client/index.html`
  - `client/tsconfig.json`
  - `client/vite.config.*`
  - `client/src/main.tsx`
- Add React Admin and auth seams on top of that baseline instead of replacing the workspace with a hand-written minimal shell.
- Do not delete required Vite entry/config files just because the LLM can write a shorter custom setup.

## Forbidden frontend generation patterns

- Do not bootstrap `client/` by hand-writing a pseudo-Vite project from memory.
- Do not remove `index.html`, `tsconfig*`, or `vite.config.*` after generation.
- Do not replace standard Vite package scripts with ad hoc commands that break `vite build`, `vite dev`, or `vite preview`.
- Do not continue React Admin resource generation on top of a degraded frontend workspace without repairing the workspace first.

## Resource generation

- Each entity becomes a React Admin resource with list/create/edit/show views.
- Resource names must stay aligned with backend path segments.
- Foreign keys must use `ReferenceInput` / `ReferenceField`.
- Foreign keys shown in list/show views must stay clickable via `ReferenceField link="show"` to open full details of the related resource.
- Lists must expose filters through `List` `filters` and an actions toolbar with `FilterButton`.
- For enum fields where multi-select is required (for example `status`), use `SelectArrayInput` in list filters.
- For foreign key filters and form selection use `ReferenceInput` + `AutocompleteInput` with `filterToQuery={(searchText) => ({ q: searchText })}`.
- Form mapping must stay type-safe:
  - `integer` / `decimal` -> `NumberInput`
  - `date` -> `DateInput`

## Provider seams

- `client/src/dataProvider.ts` is the single authenticated request seam.
- `client/src/auth/authProvider.ts` is the single React Admin auth seam.
- Auth logic must not leak into resource components.

## Identity and permissions

- `getIdentity()` must resolve from parsed token claims.
- `getPermissions()` may expose realm roles for UI awareness.
- Backend enforcement remains authoritative.

## React Admin compatibility

- Every resource record must include `id`.
- Natural-key resources must preserve route, update, and sort compatibility with React Admin contracts.
- Frontend requests must continue to work when the real primary key is not named `id`.
- `dataProvider` query serialization must preserve repeated query params for array filters (for example enum multi-select).
- `Resource` wiring in `App.tsx` must keep `show={...}` registration for all generated resources.

## Reproducibility invariants

- A freshly generated frontend must remain compatible with standard Vite commands such as `npm run dev` and `npm run build`.
- Missing Vite workspace files or missing local Vite executable wiring is a generation failure, not an acceptable simplification.
- The generated frontend should fail only on missing installation/env/runtime backend availability, not because the Vite app structure itself is incomplete.

## Recovery rule if frontend workspace degraded

- If required Vite scaffold files are missing or broken, restore the official workspace baseline before editing resources, auth seams, or UI code.
- Treat workspace repair as higher priority than feature generation, because generated React Admin code on top of a broken Vite workspace is invalid baseline output.
