import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

function stripInlineComment(line) {
  let inString = false;
  let result = '';

  for (let index = 0; index < line.length; index += 1) {
    const current = line[index];
    const next = line[index + 1];

    if (current === '"' && line[index - 1] !== '\\') {
      inString = !inString;
      result += current;
      continue;
    }

    if (!inString && current === '/' && next === '/') {
      break;
    }

    result += current;
  }

  return result.trim();
}

function parseDefaultValue(rawValue) {
  const trimmed = rawValue.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }

  if (/^-?\d+$/.test(trimmed)) {
    return Number(trimmed);
  }

  return trimmed;
}

export function getDslFiles(rootDir) {
  const domainDir = path.join(rootDir, 'domain');

  return readdirSync(domainDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.dsl'))
    .map((entry) => path.join(domainDir, entry.name))
    .sort((left, right) => left.localeCompare(right));
}

function getOverrideFiles(rootDir) {
  const overridesDir = path.join(rootDir, 'overrides');
  const files = ['api-overrides.dsl', 'ui-overrides.dsl']
    .map((name) => path.join(overridesDir, name))
    .filter((filePath) => {
      try {
        return readdirSync(path.dirname(filePath)).includes(path.basename(filePath));
      } catch {
        return false;
      }
    });

  return files;
}

export function parseDslFiles(rootDir) {
  const dslFiles = getDslFiles(rootDir);
  const enums = [];
  const entities = [];
  const stack = [];

  for (const filePath of dslFiles) {
    const contents = readFileSync(filePath, 'utf8');
    const lines = contents.split(/\r?\n/);

    for (const rawLine of lines) {
      const line = stripInlineComment(rawLine);
      if (!line) {
        continue;
      }

      const top = stack.at(-1);

      const enumMatch = line.match(/^enum\s+([A-Za-z][A-Za-z0-9_]*)\s*\{$/);
      if (!top && enumMatch) {
        const enumDefinition = { name: enumMatch[1], values: [] };
        enums.push(enumDefinition);
        stack.push({ type: 'enum', ref: enumDefinition });
        continue;
      }

      const entityMatch = line.match(/^entity\s+([A-Za-z][A-Za-z0-9_]*)\s*\{$/);
      if (!top && entityMatch) {
        const entityDefinition = {
          name: entityMatch[1],
          primaryKey: null,
          fields: [],
          foreignKeys: [],
        };
        entities.push(entityDefinition);
        stack.push({ type: 'entity', ref: entityDefinition });
        continue;
      }

      const valueMatch = line.match(/^value\s+([A-Za-z][A-Za-z0-9_]*)\s*\{$/);
      if (top?.type === 'enum' && valueMatch) {
        const enumValue = { name: valueMatch[1] };
        top.ref.values.push(enumValue);
        stack.push({ type: 'enumValue', ref: enumValue });
        continue;
      }

      const attributeMatch = line.match(/^attribute\s+([A-Za-z][A-Za-z0-9_]*)\s*\{$/);
      if (top?.type === 'entity' && attributeMatch) {
        const field = {
          name: attributeMatch[1],
          type: null,
          required: false,
          unique: false,
          default: null,
        };
        top.ref.fields.push(field);
        stack.push({ type: 'field', ref: field, entity: top.ref });
        continue;
      }

      if (top?.type === 'field' && /^key\s+foreign\s*\{$/.test(line)) {
        stack.push({ type: 'foreignKey', ref: top.ref, entity: top.entity });
        continue;
      }

      if (top?.type === 'enumValue') {
        const labelMatch = line.match(/^label\s+"(.*)"\s*;$/);
        if (labelMatch) {
          top.ref.label = labelMatch[1];
          continue;
        }
      }

      if (top?.type === 'field') {
        const typeMatch = line.match(/^type\s+([A-Za-z][A-Za-z0-9_]*)\s*;$/);
        if (typeMatch) {
          top.ref.type = typeMatch[1];
          continue;
        }

        if (/^key\s+primary\s*;$/.test(line)) {
          top.ref.primary = true;
          top.entity.primaryKey = top.ref.name;
          continue;
        }

        const defaultMatch = line.match(/^default\s+(.+)\s*;$/);
        if (defaultMatch) {
          top.ref.default = parseDefaultValue(defaultMatch[1]);
          continue;
        }

        if (/^is\s+required\s*;$/.test(line)) {
          top.ref.required = true;
          continue;
        }

        if (/^is\s+unique\s*;$/.test(line)) {
          top.ref.unique = true;
          continue;
        }
      }

      if (top?.type === 'foreignKey') {
        const relatesMatch = line.match(
          /^relates\s+([A-Za-z][A-Za-z0-9_]*)\.([A-Za-z][A-Za-z0-9_]*)\s*;$/,
        );
        if (relatesMatch) {
          const foreignKey = {
            field: top.ref.name,
            references: {
              entity: relatesMatch[1],
              field: relatesMatch[2],
            },
          };

          top.ref.foreignKey = foreignKey.references;
          top.entity.foreignKeys.push(foreignKey);
          continue;
        }
      }

      if (/^}\s*;?$/.test(line)) {
        stack.pop();
      }
    }
  }

  return { dslFiles, enums, entities };
}

function assertNoDomainRedefinition(line, filePath) {
  const blocked = [/^\s*entity\s+/i, /^\s*enum\s+/i, /^\s*attribute\s+/i, /^\s*key\s+primary/i, /^\s*key\s+foreign/i];
  for (const pattern of blocked) {
    if (pattern.test(line)) {
      throw new Error(
        `Override file ${path.basename(filePath)} attempts to redefine domain structure: ${line.trim()}`,
      );
    }
  }
}

export function parseOverrides(rootDir, entities) {
  const overrideFiles = getOverrideFiles(rootDir);
  const entityNames = new Set(entities.map((entity) => entity.name));
  const fieldNames = new Set(
    entities.flatMap((entity) => entity.fields.map((field) => `${entity.name}.${field.name}`)),
  );

  const api = { resources: {} };
  const ui = { fields: {} };

  for (const filePath of overrideFiles) {
    const isApi = filePath.endsWith('api-overrides.dsl');
    const isUi = filePath.endsWith('ui-overrides.dsl');
    const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);

    for (const rawLine of lines) {
      const line = stripInlineComment(rawLine);
      if (!line) {
        continue;
      }

      assertNoDomainRedefinition(line, filePath);

      if (isApi) {
        const match = line.match(/^resource\s+([A-Za-z][A-Za-z0-9_]*)\s+path\s+"([^"]+)"\s*;$/);
        if (!match) {
          throw new Error(
            `Unsupported API override syntax in ${path.basename(filePath)}: ${line}`,
          );
        }
        const [, entityName, resourcePath] = match;
        if (!entityNames.has(entityName)) {
          throw new Error(`API override references unknown entity ${entityName}`);
        }
        api.resources[entityName] = { path: resourcePath };
      }

      if (isUi) {
        const match = line.match(
          /^field\s+([A-Za-z][A-Za-z0-9_]*)\.([A-Za-z][A-Za-z0-9_]*)\s+widget\s+"([^"]+)"\s*;$/,
        );
        if (!match) {
          throw new Error(
            `Unsupported UI override syntax in ${path.basename(filePath)}: ${line}`,
          );
        }
        const [, entityName, fieldName, widget] = match;
        const key = `${entityName}.${fieldName}`;
        if (!fieldNames.has(key)) {
          throw new Error(`UI override references unknown field ${key}`);
        }
        ui.fields[key] = { widget };
      }
    }
  }

  return { api, ui, sourceFiles: overrideFiles.map((filePath) => path.relative(rootDir, filePath).replaceAll('\\', '/')) };
}

export function buildDomainSummary(rootDir) {
  const { dslFiles, enums, entities } = parseDslFiles(rootDir);
  parseOverrides(rootDir, entities);
  const entityByName = new Map(entities.map((entity) => [entity.name, entity]));
  const enumByName = new Map(enums.map((entry) => [entry.name, entry]));

  for (const entity of entities) {
    if (!entity.primaryKey) {
      throw new Error(`Entity ${entity.name} is missing a primary key`);
    }

    const primaryKeyField = entity.fields.find((field) => field.name === entity.primaryKey);
    if (!primaryKeyField) {
      throw new Error(
        `Entity ${entity.name} declares primary key ${entity.primaryKey}, but the field is missing`,
      );
    }

    if (entity.fields.some((field) => !field.type)) {
      throw new Error(`Entity ${entity.name} has attributes with missing type`);
    }

    for (const foreignKey of entity.foreignKeys) {
      const targetEntity = entityByName.get(foreignKey.references.entity);
      if (!targetEntity) {
        throw new Error(
          `Foreign key ${entity.name}.${foreignKey.field} references missing entity ${foreignKey.references.entity}`,
        );
      }

      const targetField = targetEntity.fields.find(
        (field) => field.name === foreignKey.references.field,
      );
      if (!targetField) {
        throw new Error(
          `Foreign key ${entity.name}.${foreignKey.field} references missing field ${foreignKey.references.entity}.${foreignKey.references.field}`,
        );
      }

      const sourceField = entity.fields.find((field) => field.name === foreignKey.field);
      if (sourceField && sourceField.type !== targetField.type) {
        throw new Error(
          `Foreign key ${entity.name}.${foreignKey.field} type ${sourceField.type} does not match ${foreignKey.references.entity}.${foreignKey.references.field} type ${targetField.type}`,
        );
      }
    }

    const fieldNames = new Set();
    for (const field of entity.fields) {
      if (fieldNames.has(field.name)) {
        throw new Error(`Entity ${entity.name} has duplicate field ${field.name}`);
      }
      fieldNames.add(field.name);
    }
  }

  const entityNames = new Set();
  for (const entity of entities) {
    if (entityNames.has(entity.name)) {
      throw new Error(`Duplicate entity definition: ${entity.name}`);
    }
    entityNames.add(entity.name);
  }

  for (const [enumName, enumDefinition] of enumByName.entries()) {
    const valueNames = new Set();
    for (const value of enumDefinition.values) {
      if (valueNames.has(value.name)) {
        throw new Error(`Enum ${enumName} has duplicate value ${value.name}`);
      }
      valueNames.add(value.name);
    }
  }

  return {
    sourceFiles: dslFiles.map((filePath) => path.relative(rootDir, filePath).replaceAll('\\', '/')),
    entities: entities.map((entity) => ({
      name: entity.name,
      primaryKey: entity.primaryKey,
      fields: entity.fields.map((field) => ({
        name: field.name,
        type: field.type,
        required: field.required,
        unique: field.unique,
        default: field.default,
      })),
      foreignKeys: entity.foreignKeys,
    })),
    enums,
  };
}
