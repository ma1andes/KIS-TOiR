#!/usr/bin/env node
/**
 * Пошаговая демонстрация: api-format → OpenAPI 3.0 (детерминированный режим).
 *
 *   node demo-steps.mjs              — все шаги подряд в консоли
 *   node demo-steps.mjs --pause      — пауза после каждого шага (Enter)
 *
 * Результат также пишется в demo-output/openapi.json рядом со скриптом.
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXAMPLE = join(__dirname, "examples", "api-format.example.json");
const OUT_DIR = join(__dirname, "demo-output");
const OUT_OPENAPI = join(OUT_DIR, "openapi.json");
const usePause = process.argv.includes("--pause");

function banner(title) {
  const line = "═".repeat(Math.min(60, title.length + 8));
  console.log(`\n${line}\n  ${title}\n${line}\n`);
}

async function pause(msg = "Нажми Enter, чтобы перейти к следующему шагу…") {
  if (!usePause) return;
  const rl = createInterface({ input, output });
  await rl.question(msg);
  rl.close();
}

async function main() {
  console.clear?.();

  banner("Шаг 0. Задача");
  console.log(
    "У нас есть описание API в СВОЁМ формате (api-format), не OpenAPI.\n" +
      "Нужно получить стандартную спецификацию OpenAPI 3.0 — для Swagger, клиентов, AID.\n" +
      "Сейчас покажем путь на учебном примере (детерминированный маппинг в convert.mjs).",
  );
  await pause();

  banner("Шаг 1. Входной файл (фрагмент api-format)");
  console.log(`Файл: ${EXAMPLE}\n`);
  const rawIn = readFileSync(EXAMPLE, "utf8");
  const apiFormat = JSON.parse(rawIn);
  console.log(JSON.stringify(apiFormat, null, 2));
  console.log(
    "\n↑ Это НЕ OpenAPI. Здесь: версия формата, info, basePath, ресурс Equipment с полями и операциями CRUD.",
  );
  await pause();

  banner("Шаг 2. Что делает конвертер (логика)");
  console.log(`
  • apiFormatVersion "1" → включается ветка toOpenApiDeterministic в convert.mjs
  • Ресурс Equipment → components.schemas.Equipment + пути /api/equipment и /api/equipment/{id}
  • Поля (string, uuid, enum…) → JSON Schema в components.schemas
  • listQuery → query-параметры (_start, _end, _sort, _order, q, status…)
  • security bearer → components.securitySchemes + security на операциях
`);
  await pause();

  banner("Шаг 3. Запуск convert.mjs");
  mkdirSync(OUT_DIR, { recursive: true });
  const convertScript = join(__dirname, "convert.mjs");
  console.log(`Команда:\n  node convert.mjs --in examples/api-format.example.json --out demo-output/openapi.json\n`);
  execFileSync(process.execPath, [convertScript, "--in", EXAMPLE, "--out", OUT_OPENAPI], {
    stdio: "inherit",
  });
  console.log(`\nГотово. Файл: ${OUT_OPENAPI}`);
  await pause();

  banner("Шаг 4. Результат — структура OpenAPI");
  const spec = JSON.parse(readFileSync(OUT_OPENAPI, "utf8"));
  console.log(`openapi: ${spec.openapi}`);
  console.log(`title:   ${spec.info?.title}`);
  console.log(`version: ${spec.info?.version}`);
  console.log("\nПути (paths):");
  for (const p of Object.keys(spec.paths || {}).sort()) {
    const methods = Object.keys(spec.paths[p]).join(", ");
    console.log(`  ${p}  [${methods}]`);
  }
  console.log("\nСхемы (components.schemas):", Object.keys(spec.components?.schemas || {}).join(", "));
  await pause();

  banner("Шаг 5. Фрагмент: GET список (одна операция)");
  const listPath = Object.keys(spec.paths || {}).find((k) => k.endsWith("/equipment") && !k.includes("{"));
  if (listPath && spec.paths[listPath]?.get) {
    console.log(JSON.stringify({ [listPath]: { get: spec.paths[listPath].get } }, null, 2));
  } else {
    console.log("(путь списка не найден — открой demo-output/openapi.json)");
  }
  await pause();

  banner("Шаг 6. Как проверить дальше");
  console.log(`
  1) Открой целиком: ${OUT_OPENAPI}
  2) Валидация (из корня репозитория):
       npx -y @apidevtools/swagger-cli validate tools/api-format-to-openapi/demo-output/openapi.json
  3) Через Nest (сервер на 3001):
       POST http://127.0.0.1:3001/aid/export/openapi
       тело: { "apiFormat": <содержимое api-format.example.json>, "mode": "deterministic" }
  4) Режим LLM (другой входной JSON):
       node convert.mjs --mode llm --in your.json --out openapi.llm.json
       (нужен OPENAI_API_KEY)
`);
  console.log("Демо завершено.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
