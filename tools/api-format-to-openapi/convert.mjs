#!/usr/bin/env node
/**
 * api-format → OpenAPI 3.0
 *
 * Режимы:
 *   --mode deterministic  — маппинг только для схемы examples/api-format.example.json (и совместимых)
 *   --mode llm             — отправка входного JSON в OpenAI Chat Completions (нужен OPENAI_API_KEY)
 *
 * Примеры:
 *   node convert.mjs --in examples/api-format.example.json --out ../../openapi.generated.json
 *   node convert.mjs --mode llm --in my-api.json --out openapi.json
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const out = { mode: "deterministic", input: null, output: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--mode") out.mode = argv[++i];
    else if (a === "--in") out.input = argv[++i];
    else if (a === "--out") out.output = argv[++i];
    else if (a === "-h" || a === "--help") out.help = true;
  }
  return out;
}

function usage() {
  console.log(`
Usage: node convert.mjs --in <api-format.json> --out <openapi.json> [--mode deterministic|llm]

Environment (llm mode):
  OPENAI_API_KEY   required
  OPENAI_MODEL     optional, default gpt-4o-mini
  OPENAI_BASE_URL  optional, default https://api.openai.com/v1
`);
}

/** @param {string} t */
function fieldToSchema(t) {
  const map = {
    string: { type: "string" },
    uuid: { type: "string", format: "uuid" },
    int: { type: "integer" },
    integer: { type: "integer" },
    number: { type: "number" },
    float: { type: "number" },
    boolean: { type: "boolean" },
    date: { type: "string", format: "date" },
    datetime: { type: "string", format: "date-time" },
  };
  return map[t] || { type: "string", description: `unknown type: ${t}` };
}

/**
 * Детерминированная конвертация для apiFormatVersion "1" с полями как в example.
 * @param {any} api
 */
function toOpenApiDeterministic(api) {
  if (!api || api.apiFormatVersion !== "1") {
    throw new Error(
      'deterministic mode: ожидается apiFormatVersion "1". Для другого формата используйте --mode llm или расширьте маппинг в convert.mjs.',
    );
  }

  const base = (api.server?.basePath || "/api").replace(/\/$/, "");
  const info = api.info || { title: "API", version: "1.0.0" };
  const paths = {};
  const schemas = {};

  for (const res of api.resources || []) {
    const name = res.name;
    const seg = res.pathSegment || name.toLowerCase();
    const idParam = res.idParam || "id";
    const idType = res.idType || "uuid";

    const props = {};
    const required = [];
    for (const f of res.fields || []) {
      let sch;
      if (f.type === "enum" && Array.isArray(f.enumValues)) {
        sch = { type: "string", enum: f.enumValues };
      } else {
        sch = { ...fieldToSchema(f.type) };
      }
      if (f.readOnly) sch.readOnly = true;
      props[f.name] = sch;
      if (f.required) required.push(f.name);
    }

    schemas[name] = {
      type: "object",
      properties: props,
      ...(required.length ? { required } : {}),
    };

    const listPath = `${base}/${seg}`;
    const itemPath = `${base}/${seg}/{${idParam}}`;
    const idSchema = fieldToSchema(idType);

    const listQuery = [];
    const lq = res.listQuery;
    if (lq?.pagination) {
      for (const p of lq.pagination) {
        if (p === "_start" || p === "_end")
          listQuery.push({ name: p, in: "query", schema: { type: "integer" }, description: "pagination" });
      }
    }
    if (lq?.sort) {
      for (const p of lq.sort) {
        if (p === "_sort")
          listQuery.push({ name: "_sort", in: "query", schema: { type: "string" }, description: "sort field" });
        if (p === "_order")
          listQuery.push({
            name: "_order",
            in: "query",
            schema: { type: "string", enum: ["asc", "desc"] },
            description: "sort order",
          });
      }
    }
    if (lq?.filters) {
      for (const p of lq.filters) {
        if (p === "q")
          listQuery.push({ name: "q", in: "query", schema: { type: "string" }, description: "full-text search" });
        else {
          const field = (res.fields || []).find((x) => x.name === p);
          const isEnum = field?.type === "enum";
          listQuery.push({
            name: p,
            in: "query",
            schema: isEnum
              ? { type: "array", items: { type: "string", enum: field.enumValues || [] } }
              : { type: "string" },
            style: isEnum ? "form" : undefined,
            explode: isEnum ? true : undefined,
            description: isEnum ? "repeat param for multiple values" : undefined,
          });
        }
      }
    }

    const ops = new Set(res.operations || []);

    if (ops.has("list")) {
      paths[listPath] = paths[listPath] || {};
      paths[listPath].get = {
        tags: [name],
        summary: `List ${name}`,
        parameters: listQuery,
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: `#/components/schemas/${name}` } },
                    total: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      };
    }

    if (ops.has("create")) {
      paths[listPath] = paths[listPath] || {};
      paths[listPath].post = {
        tags: [name],
        summary: `Create ${name}`,
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: `#/components/schemas/${name}` } } },
        },
        responses: {
          "201": {
            description: "Created",
            content: { "application/json": { schema: { $ref: `#/components/schemas/${name}` } } },
          },
          "400": { description: "Bad request" },
        },
      };
    }

    if (ops.has("get")) {
      paths[itemPath] = paths[itemPath] || {};
      paths[itemPath].get = {
        tags: [name],
        summary: `Get ${name} by ${idParam}`,
        parameters: [{ name: idParam, in: "path", required: true, schema: idSchema }],
        responses: {
          "200": {
            description: "OK",
            content: { "application/json": { schema: { $ref: `#/components/schemas/${name}` } } },
          },
          "404": { description: "Not found" },
        },
      };
    }

    if (ops.has("update")) {
      paths[itemPath] = paths[itemPath] || {};
      paths[itemPath].patch = {
        tags: [name],
        summary: `Update ${name}`,
        parameters: [{ name: idParam, in: "path", required: true, schema: idSchema }],
        requestBody: {
          content: { "application/json": { schema: { $ref: `#/components/schemas/${name}` } } },
        },
        responses: {
          "200": {
            description: "OK",
            content: { "application/json": { schema: { $ref: `#/components/schemas/${name}` } } },
          },
          "404": { description: "Not found" },
        },
      };
    }

    if (ops.has("delete")) {
      paths[itemPath] = paths[itemPath] || {};
      paths[itemPath].delete = {
        tags: [name],
        summary: `Delete ${name}`,
        parameters: [{ name: idParam, in: "path", required: true, schema: idSchema }],
        responses: {
          "204": { description: "No content" },
          "404": { description: "Not found" },
        },
      };
    }
  }

  const doc = {
    openapi: "3.0.3",
    info: {
      title: info.title,
      version: info.version,
      ...(info.description ? { description: info.description } : {}),
    },
    servers: [{ url: base || "/" }],
    paths,
    components: {
      schemas,
      ...(api.security?.type === "bearer" || api.security?.scheme === "JWT"
        ? {
            securitySchemes: {
              bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
            },
          }
        : {}),
    },
  };

  if (doc.components.securitySchemes) {
    doc.security = [{ bearerAuth: [] }];
    for (const method of Object.values(paths)) {
      for (const op of Object.values(method)) {
        if (op && typeof op === "object" && op.responses) op.security = [{ bearerAuth: [] }];
      }
    }
  }

  return doc;
}

async function toOpenApiLlm(apiJson) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY не задан");

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const systemPath = resolve(__dirname, "prompts", "llm-system.md");
  const system = readFileSync(systemPath, "utf8");
  const user = JSON.stringify(apiJson, null, 2);

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      messages: [
        { role: "system", content: system },
        { role: "user", content: `Преобразуй следующий api-format в OpenAPI 3.0.3 JSON:\n\n${user}` },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI HTTP ${res.status}: ${text}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Пустой ответ от модели");

  const trimmed = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  return JSON.parse(trimmed);
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.input || !args.output) {
    usage();
    process.exit(args.help ? 0 : 1);
  }

  const inputPath = resolve(process.cwd(), args.input);
  const outputPath = resolve(process.cwd(), args.output);
  const raw = readFileSync(inputPath, "utf8");
  const api = JSON.parse(raw);

  let openapi;
  if (args.mode === "llm") {
    openapi = await toOpenApiLlm(api);
  } else {
    openapi = toOpenApiDeterministic(api);
  }

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(openapi, null, 2), "utf8");
  console.log(`Written: ${outputPath}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
