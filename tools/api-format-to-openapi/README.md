# api-format → OpenAPI 3.0

Абстрактная заготовка под задачу: **из доменного описания API получить OpenAPI 3.0**, затем встроить в общий пайплайн (кнопка / CI / генератор).

## Что внутри

| Файл | Назначение |
|------|------------|
| `examples/api-format.example.json` | Пример **не-OpenAPI** формата: ресурсы, поля, операции, query для списка |
| `prompts/llm-system.md` | Системный промпт для LLM: «верни только JSON OpenAPI 3.0.3» |
| `convert.mjs` | CLI: режим `deterministic` (маппинг в коде) и `llm` (OpenAI API) |

## Пошаговая демонстрация в терминале

Чтобы **постепенно** увидеть: входной api-format → что делает конвертер → структура OpenAPI:

```bash
cd tools/api-format-to-openapi
npm run demo
```

С паузой после каждого шага (нажимай Enter):

```bash
npm run demo:pause
```

Результат кладётся в `demo-output/openapi.json`.

## Детерминированный режим (без LLM)

Подходит для **фиксированной** схемы `apiFormatVersion: "1"` как в примере.

```bash
cd tools/api-format-to-openapi
node convert.mjs --in examples/api-format.example.json --out ../../openapi.generated.json
```

Или через npm:

```bash
cd tools/api-format-to-openapi
npm run convert
```

## Режим LLM

Когда реальный формат отличается или богаче — прогон через модель с промптом из `prompts/llm-system.md`.

```bash
set OPENAI_API_KEY=sk-...
cd tools/api-format-to-openapi
node convert.mjs --mode llm --in path/to/your-api-format.json --out ../../openapi.llm.json
```

Переменные:

- `OPENAI_API_KEY` — обязательно
- `OPENAI_MODEL` — по умолчанию `gpt-4o-mini`
- `OPENAI_BASE_URL` — по умолчанию `https://api.openai.com/v1` (совместимо с прокси)

## HTTP-экспортёр для AID (NestJS)

В `server` добавлен модуль **`AidExportModule`**: `POST /aid/export/openapi` принимает `{ "apiFormat": {...}, "mode"?: "deterministic"|"llm" }` и возвращает `{ "openapi": {...} }`. Подробности: `server/src/aid-export/README.md`.

## Интеграция позже

1. Заменить/расширить `examples/api-format.example.json` под ваш настоящий контракт из «алабужского» гита.
2. Либо расширить `toOpenApiDeterministic` в `convert.mjs`, либо перейти на `--mode llm` с отточенным промптом.
3. Согласовать с AID точный URL, заголовки и (при необходимости) обёртку ответа; при необходимости добавить отдельный маршрут «сырой» OpenAPI без `{ openapi: ... }`.

## Валидация OpenAPI (опционально)

После генерации можно проверить спеку любым валидатором, например:

```bash
npx -y @apidevtools/swagger-cli validate ../../openapi.generated.json
```
