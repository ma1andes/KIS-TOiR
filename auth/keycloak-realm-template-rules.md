# Keycloak Realm Template Rules

This document defines the required Keycloak realm/bootstrap artifact that the generator must produce.

---

# Required Artifact

The generator must create a root-level Keycloak import artifact:

- project-specific realm import artifact
- repository default example filename: `toir-realm.json`

This artifact is part of the normal generated result and must be documented in the runtime bootstrap flow.

The generator must parameterize at minimum:

- realm name
- frontend SPA client ID
- backend audience/resource client ID
- production frontend URLs
- realm-artifact filename

Repository defaults may use `toir`, `toir-frontend`, `toir-backend`, `toir-realm.json`, and `https://toir-frontend.greact.ru` as examples, but those names must not be treated as universal requirements for all future generated applications.

---

# Strategy Choice

This repository uses the **robust bootstrap strategy** by default.

That means the generated realm/client setup must be:

- self-contained
- reproducible after import
- explicit about audience delivery
- explicit about role delivery
- explicit about required claims

The generator must **not** rely on built-in client scopes magically existing and attaching correctly after realm import.

---

# Required Realm Structure

The generated realm import artifact must define:

- realm name derived from generated project auth config
- realm roles:
  - `admin`
  - `editor`
  - `viewer`
- frontend SPA client ID derived from generated project auth config
- backend audience/resource client ID derived from generated project auth config
- dedicated audience client scope for audience delivery
  - repository default example: `api-audience`

The audience client scope must explicitly add the generated backend audience/client ID to SPA access tokens.

---

# Required Frontend Client Rules

The generated SPA client must be configured as a public SPA client with:

- `publicClient: true`
- `standardFlowEnabled: true`
- `implicitFlowEnabled: false`
- `directAccessGrantsEnabled: false`
- `serviceAccountsEnabled: false`
- `pkce.code.challenge.method: S256`

Default rule:

- keep `fullScopeAllowed: true`

Reason:

- this repository uses realm-role RBAC
- earlier failures came from fragile or implicit scope behavior
- the robust default is explicit audience delivery plus explicit claim mappers, not a partially documented scoped-role setup

If a future prompt chooses `fullScopeAllowed: false`, it must also fully document role scope mappings and validation rules. The generator must not switch to that strategy silently.

---

# Required Claim Delivery

The generated realm/client configuration must reliably produce access tokens containing:

- `sub`
- `aud`
- `realm_access.roles`

The generator must explicitly address claim delivery and must not leave it implicit.

The generated realm import artifact must therefore define explicit protocol mappers for:

- `sub`
- user identity claims needed by the frontend
- `realm_access.roles`

The generator must not assume these claims will appear through undeclared built-in scopes.

Post-generation validation must fail if the generated realm contract leaves `sub`, `aud`, or `realm_access.roles` implicit instead of explicitly delivered.

---

# Required Role Delivery

The generated realm/client configuration must explicitly deliver realm roles into the access token.

Rules:

1. Role delivery must be configured intentionally.
2. `realm_access.roles` must be present in the access token after import.
3. The generator must validate that realm role delivery is part of the generated realm artifact.

---

# Redirect URIs and Web Origins

The generated realm template guidance must document local and production frontend URLs derived from the generated project configuration.

Repository default production examples may include:

- `http://localhost:5173`
- `https://toir-frontend.greact.ru`

The generated SPA client must include matching redirect URIs and web origins for the generated local and production frontend URLs. These values must be explicit in the generated realm artifact or in a generated artifact template with explicit placeholders and validation instructions.

---

# Anti-Regression Rule

The earlier broken realm-template behavior must not be reproduced.

The generator context must explicitly prevent:

- missing audience in SPA access tokens
- missing `sub`
- missing `realm_access.roles`
- realm imports that depend on undeclared built-in scopes being present
- ambiguous role-delivery behavior

The generated realm/bootstrap guidance must be self-contained enough that another engineer can import the artifact and predict the access-token shape without relying on hidden Keycloak defaults.

The generator must guarantee through the generated realm artifact plus post-generation validation that imported access tokens reliably contain:

- `sub`
- `aud`
- `realm_access.roles`
