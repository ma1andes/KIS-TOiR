# Update Strategy

When the DSL changes, regeneration must preserve the default auth-enabled runtime rather than falling back to CRUD-only output.

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
8. Regenerate the root-level Keycloak realm import artifact. The repository default example filename is `toir-realm.json`, but the generator must allow a project-specific equivalent.
9. Re-run post-generation validation, including:
   - auth dependency checks
   - fail-fast env checks
   - `/health` public check
   - unauthenticated protected route -> `401`
   - insufficient role -> `403`
   - realm-template validation

## Guardrails

- Regeneration must not strip auth back out of the project.
- Auth remains outside the DSL grammar, but it is part of the default generated runtime.
- If a DSL change affects entities or routes, the generator must re-apply the default CRUD RBAC rules automatically.
- If a DSL change affects runtime topology or naming, the generator must keep backend/frontend env examples, CORS rules, and the generated realm import artifact aligned with the generated app.
