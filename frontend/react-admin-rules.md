# DSL → React Admin Mapping

Entity attributes determine UI fields.

---

# Authentication

Generated React Admin applications in this repository must include an `authProvider`.

Rules:

1. `authProvider` is mandatory.
2. The generated app must use redirect-based Keycloak login only.
3. The generator must not create a custom in-app username/password form.
4. The generated app must initialize authentication before rendering the admin UI.

---

# Shared Authenticated Request Layer

The generated frontend must attach bearer tokens through the shared request seam in `client/src/dataProvider.ts`.

Rules:

1. All resource calls must use the same authenticated request layer.
2. Reference lookups must use the same authenticated request layer.
3. The generated frontend must not attach auth headers directly inside resource components.

---

# Error Handling

The generated `authProvider.checkError` must distinguish authentication failures from authorization failures:

- `401` -> force logout / re-authentication
- `403` -> do not re-authenticate; surface access denied / permission error

The generator must not treat `401` and `403` as the same outcome.

---

# Token Handling

The generated frontend must use Keycloak JS token handling with these rules:

1. Use Authorization Code + PKCE (`S256`).
2. Refresh tokens before protected API calls when needed.
3. Token refresh must be concurrency-safe:
   - one shared in-flight refresh operation
   - no parallel refresh stampede
4. Do not store access tokens or refresh tokens in `localStorage` or `sessionStorage`.

---

# Type Mapping

| DSL Type | React Admin Component |
|---------|-----------------------|
| string | TextInput / TextField |
| integer | NumberInput |
| decimal | NumberInput |
| date | DateInput |
| enum | SelectInput |
| foreign key | ReferenceInput |

---

# Example

DSL

attribute name {
  type string;
}

React Admin

<TextInput source="name" />

---

# Enum Example

DSL

attribute status {
  type EquipmentStatus;
}

React Admin

<SelectInput source="status" choices={statusChoices} />

---

# Foreign Key Example

DSL

attribute equipmentTypeCode {
  type string;
}

React Admin

<ReferenceInput source="equipmentTypeCode" reference="equipment-types" />

---

# React Admin ID Field Requirement

React Admin requires every record in list and detail responses to contain a field named **`id`**. It uses this field for resource identity, cache keys, and references.

**Rules:**

1. Every record returned by the API must contain an **`id`** field.
2. If the DSL primary key is not named `id`, the generator must **map** the primary key value to an `id` field in the API response (backend) or in a frontend adapter.
3. The `id` field must contain the **value of the primary key** (e.g. uuid string, or `code` value for EquipmentType).

**Example:**

DSL entity with primary key `code`:

```
entity EquipmentType {
  attribute code {
    key primary;
    type string;
  }
  attribute name { type string; }
}
```

API response must include `id` so React Admin can identify the record:

```json
{
  "id": "pump",
  "code": "pump",
  "name": "Pump"
}
```

If the response only had `{ "code": "pump", "name": "Pump" }`, React Admin would not work correctly because it expects `id`. The backend or frontend adapter must therefore set `id: record.code` (or equivalent) when the primary key is not `id`.

This rule ensures compatibility with React Admin resource identity handling.
