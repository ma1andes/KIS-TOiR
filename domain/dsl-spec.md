# DSL Language Specification

This document describes the single DSL (Domain Specific Language) used to specify fullstack CRUD applications. The only required DSL input is `domain/*.dsl`.

---

# DSL Responsibility

The domain DSL defines only:

- domain model
- relations
- enums

The domain DSL is the single source of truth for:

- entities
- attributes
- primary keys
- foreign keys
- enums

The following layers are always derived from the domain DSL and must not be authored as standalone authoritative DSL inputs:

- DTO
- API
- UI

Optional extension mechanism:

```text
overrides/
  api-overrides.dsl
  ui-overrides.dsl
```

Override rules:

- Overrides are optional.
- The generator must work without them.
- Overrides may refine derived API or UI behavior, but they must not duplicate or redefine entities, attributes, primary keys, foreign keys, relations, or enums.

---

# DSL Grammar Concepts

## entity

An **entity** is a domain object that becomes a database table and a first-class resource in the backend and frontend.

```
entity Equipment {
  attribute id { type uuid; key primary; }
  attribute name { type string; is required; }
}
```

- **Domain:** Defines the canonical model; one entity = one Prisma model, one NestJS module, one React Admin resource.
- **Naming:** PascalCase (e.g. `Equipment`, `EquipmentType`, `RepairOrder`).

---

## attribute

An **attribute** is a field of an entity. It has a type and optional modifiers.

```
attribute name {
  description "Наименование";
  type string;
  is required;
  is unique;
}
```

**Modifiers:**

- `type` — required; one of: `string`, `uuid`, `integer`, `decimal`, `date`, `text`, or an enum name.
- `key primary` — this attribute is the primary key.
- `key foreign { relates Entity.field }` — foreign key to another entity's field.
- `is required` — non-nullable.
- `is unique` — unique constraint.
- `default Value` — default value (for enums or literals).
- `description "..."` — human-readable description.

---

## enum

An **enum** defines a fixed set of values. Used for attributes that can only take one of these values.

```
enum EquipmentStatus {
  value Active { label "В эксплуатации"; }
  value Repair { label "В ремонте"; }
}
```

- **value** — identifier used in data and code.
- **label** — optional display label for UI.

---

## primary key

Exactly one attribute per entity must be marked as primary key.

```
attribute id {
  type uuid;
  key primary;
}
```

Or for a natural key:

```
attribute code {
  type string;
  key primary;
  is required;
  is unique;
}
```

---

## foreign key

A **foreign key** links to another entity's primary key. The attribute type must match the referenced primary key type.

```
attribute equipmentTypeCode {
  type string;
  key foreign {
    relates EquipmentType.code;
  }
  is required;
}
```

- `relates Entity.attribute` — references `Entity`'s `attribute` (must be primary key).
- FK type must equal referenced PK type (e.g. `string` → `EquipmentType.code`, `uuid` → `Equipment.id`).

---

## required

- **is required** — attribute is non-nullable in the domain model and drives requiredness in derived DTO/API/UI artifacts.
- Absence of `is required` means the attribute is optional (nullable).

---

## default

- **default Value** — applied when no value is provided (e.g. enum defaults like `default Active`).
- Value must exist in the enum when the attribute type is an enum.

---

# DSL → System Component Mapping

## DSL → Prisma

| DSL Concept  | Prisma Result               |
| ------------ | --------------------------- |
| entity       | model                       |
| attribute    | field                       |
| enum         | enum                        |
| key primary  | @id or @id @default(uuid()) |
| key foreign  | relation + references       |
| type string  | String                      |
| type uuid    | String @id @default(uuid()) |
| type integer | Int                         |
| type decimal | Decimal                     |
| type date    | DateTime                    |
| type text    | String                      |

---

## DSL → NestJS

| DSL Concept    | NestJS Result                         |
| -------------- | ------------------------------------- |
| entity         | One module (e.g. equipment.module.ts) |
| entity         | Controller with CRUD endpoints        |
| entity         | Service with Prisma CRUD              |
| entity + attribute metadata | create-{entity}.dto.ts     |
| entity + attribute metadata | update-{entity}.dto.ts     |
| entity + attribute metadata | Response DTO / API shape   |

API paths are derived from entity name: PascalCase → kebab-case, pluralized (e.g. `Equipment` → `/equipment`, `RepairOrder` → `/repair-orders`).

---

## DSL → React Admin

| DSL Concept           | React Admin Result                  |
| --------------------- | ----------------------------------- |
| entity                | Resource (name = kebab-case plural) |
| attribute             | Form field / column                 |
| type string           | TextInput, TextField                |
| type integer/decimal  | NumberInput, NumberField            |
| type date             | DateInput, DateField                |
| enum                  | SelectInput with choices            |
| foreign key           | ReferenceInput, ReferenceField      |

---

# Derived Layer Mapping

- **Create DTO** — derived from domain attributes and must not include generated primary keys (for example no `id` for uuid PKs).
- **Update DTO** — derived from the same domain attributes with all fields optional for partial updates.
- **API response shape** — derived from domain attributes and must expose React Admin-compatible identifiers when needed.
- **UI field mapping** — derived from attribute types, descriptions, enums, and foreign keys without a separate UI DSL.
