# Update Strategy

When the DSL changes, regeneration must preserve the default auth-enabled runtime rather than falling back to CRUD-only output.

`domain/*.dsl` remains the single required source of truth for regeneration. DTOs, API contracts, and React Admin resources must be re-derived from it on every run. Optional overrides in `overrides/api-overrides.dsl` and `overrides/ui-overrides.dsl` may be applied after derivation, but they must never duplicate or redefine the domain model.
Regeneration must not resurrect or depend on supplemental DTO/API/UI DSL inputs. Every derived layer must be recalculated from `domain/*.dsl` plus optional non-duplicating overrides only.

## Required regeneration sequence

1. Regenerate `prisma/schema.prisma`.
2. Run `npx prisma migrate dev`.
3. Regenerate NestJS entity modules, DTOs, controllers, and services.
4. Regenerate backend auth infrastructure:
   - `AuthModule`
   - guards
   - decorators
   - typed authenticated principal
   - typed config validation
   - CRUD RBAC decorations
5. Regenerate React Admin resources.
6. Regenerate frontend auth infrastructure:
   - `src/config/env.ts`
   - `src/auth/keycloak.ts`
   - `src/auth/authProvider.ts`
   - authenticated `dataProvider.ts`
   - `App.tsx` auth wiring
   - `main.tsx` init-before-render flow
7. Regenerate backend and frontend `.env.example` files so the auth env contract stays in sync.
8. Regenerate root/package `.gitignore` files so local-only artifacts remain out of git after regeneration.
9. Regenerate the root-level Keycloak realm import artifact. The repository default example filename is `toir-realm.json`, but the generator must allow a project-specific equivalent.
10. Re-run post-generation validation, including:
   - gitignore coverage for dependency, build, env, coverage, and tsbuildinfo artifacts
   - auth dependency checks
   - fail-fast env checks
   - token-claim based identity with no `loadUserProfile()` / `/account` dependency
   - `/health` public check
   - unauthenticated protected route -> `401`
   - insufficient role -> `403`
   - natural-key `_sort=id` mapping checks
   - realm-template validation

## Guardrails

- Regeneration must not strip auth back out of the project.
- Auth remains outside the DSL grammar, but it is part of the default generated runtime.
- If a DSL change affects entities or routes, the generator must re-apply the default CRUD RBAC rules automatically.
- If a DSL change affects runtime topology or naming, the generator must keep backend/frontend env examples, CORS rules, and the generated realm import artifact aligned with the generated app.
