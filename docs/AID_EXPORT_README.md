# AID: экспорт OpenAPI и генератор приложения

В репозитории добавлены **сервисы-экспортёры** для интеграции с **AID** (или любым другим клиентом по HTTP): автоматическое получение **OpenAPI 3.0** из доменного **api-format** и выдача **сгенерированного fullstack-приложения** из **DSL** без ручного копирования файлов.

---

## Что сделано

| Компонент | Назначение |
|-----------|------------|
| **`POST /aid/export/openapi`** (NestJS) | На вход JSON **api-format** → на выход документ **OpenAPI 3.0** в поле `openapi`. |
| **`POST /aid/export/app`** (NestJS) | На вход текст **DSL** → либо JSON-бандл всех сгенерированных файлов (`files`), либо запись в рабочую копию репозитория (`apply: true`, опционально). |
| **`tools/api-format-to-openapi/`** | CLI и промпт для LLM: тот же конвертер, что вызывает Nest. |
| **`generation/generate.mjs`** | Новый флаг **`--print-bundle-json`**: вывод в stdout JSON с `entityCount`, `enumCount`, `files` — без записи на диск (аналог «сухого» экспорта для AID). |
| **`server/src/aid-export/`** | Модуль Nest: контроллер, сервис, краткая справка в `README.md` рядом с кодом. |

Ветка с этими изменениями: **`add_aid_exporters`**.

---

## Требования к запуску

1. Репозиторий клонирован целиком (есть `generation/`, `tools/`, `server/`, `client/`).
2. Backend запускается из каталога **`server/`** (`npm run start` / `start:dev`), чтобы относительные пути `../generation/generate.mjs` и `../tools/api-format-to-openapi/convert.mjs` были корректны.
3. Для режима OpenAPI через LLM на сервере нужны **`OPENAI_API_KEY`** (и при необходимости `OPENAI_MODEL`, `OPENAI_BASE_URL`).

---

## Переменные окружения (`server/.env`)

| Переменная | Зачем |
|------------|--------|
| `AID_EXPORT_API_KEY` | Если задана, к **`/aid/export/*`** нужен заголовок **`X-AID-Export-Key`** с тем же значением. |
| `AID_GENERATOR_ALLOW_APPLY` | Должна быть **`1`** или **`true`**, иначе **`POST /aid/export/app`** с **`apply: true`** вернёт **403** (защита от случайной перезаписи репозитория на сервере). |
| `OPENAI_API_KEY` | Для `POST /aid/export/openapi` с **`"mode": "llm"`**. |

Остальное как для обычного бэкенда (`DATABASE_URL`, `PORT` и т.д.).

---

## HTTP API (интеграция с AID)

Базовый URL: `http://<host>:<port>` (например `http://localhost:3000`).

### 1. OpenAPI из api-format

**`POST /aid/export/openapi`**

```http
Content-Type: application/json
X-AID-Export-Key: <если задан AID_EXPORT_API_KEY>
```

```json
{
  "apiFormat": {
    "apiFormatVersion": "1",
    "info": { "title": "API", "version": "1.0.0" },
    "server": { "basePath": "/api" },
    "resources": []
  },
  "mode": "deterministic"
}
```

- **`mode`**: `deterministic` (по умолчанию) — маппинг в коде для схемы версии `1`; **`llm`** — вызов OpenAI по промпту из `tools/api-format-to-openapi/prompts/llm-system.md`.

**Ответ:** `{ "openapi": { "openapi": "3.0.3", ... } }`

Пример входа для теста: `tools/api-format-to-openapi/examples/api-format.example.json` (подставьте как значение `apiFormat`).

### 2. Генератор приложения из DSL

**`POST /aid/export/app`**

```json
{
  "dsl": "domain TOiR {\n  ...\n}\n",
  "apply": false
}
```

- **`apply: false`** (рекомендуется для AID): в ответе **`files`** — объект «путь от корня репо → текст файла». Диск на сервере не меняется. В бандл входят сгенерированные модули, `App.tsx`, **`server/src/common/field-labels.generated.ts`** (из DSL) и **канонические шаблоны рантайма** из **`generation/templates/runtime/`** (копируются в `server/src/main.ts`, `ApiExceptionFilter`, `dataProvider`, `AppNotification` при `npm run generate:from-dsl`).
- **`apply: true`**: выполняется запись файлов как у `npm run generate:from-dsl` с `--apply`; нужен **`AID_GENERATOR_ALLOW_APPLY=1`**.

**Ответ (бандл):** `{ "applied": false, "entityCount": N, "enumCount": M, "files": { ... } }`  
**Ответ (apply):** `{ "applied": true, "message": "Generated ..." }`

Эталон DSL: `examples/TOiR.domain.dsl`.

---

## CLI (без Nest)

### Пошаговая демонстрация в терминале

```bash
cd tools/api-format-to-openapi
npm run demo
# или с паузой после каждого шага (Enter):
npm run demo:pause
```

Показывает входной **api-format**, логику маппинга, запуск конвертера и структуру **OpenAPI**; результат — `demo-output/openapi.json`.

### api-format → OpenAPI

```bash
cd tools/api-format-to-openapi
node convert.mjs --in examples/api-format.example.json --out ../../openapi.generated.json
```

LLM:

```bash
set OPENAI_API_KEY=sk-...
node convert.mjs --mode llm --in your-api-format.json --out ../../openapi.llm.json
```

Подробнее: **`tools/api-format-to-openapi/README.md`**.

### DSL → JSON-бандл

Из **корня репозитория**:

```bash
node generation/generate.mjs --print-bundle-json --dsl examples/TOiR.domain.dsl > bundle.json
```

Из **`server/`**:

```bash
npm run generate:bundle-json > ../bundle.json
```

Применить генератор к файлам на диске (как раньше):

```bash
cd server
npm run generate:from-dsl
```

---

## Типичный сценарий для AID

1. AID уже сформировал **api-format** (как у вас принято после DTO).
2. AID вызывает **`POST /aid/export/openapi`** → получает **OpenAPI 3.0** → сохраняет в проект / отдаёт в Swagger / в реестр.
3. Для кода: AID передаёт **DSL** в **`POST /aid/export/app`** с **`apply: false`** → забирает **`files`** → применяет у себя (git apply, распаковка, PR).
4. Запись **`apply: true`** на общем сервере используйте только в доверенной среде и с **`AID_GENERATOR_ALLOW_APPLY`**.

---

## Где смотреть код и короткую справку

- Полное описание эндпоинтов рядом с реализацией: **`server/src/aid-export/README.md`**
- Общий dev-workflow (в т.ч. упоминание AID): **`generation/dev-workflow.md`**

---

## Ограничения и дальнейшие шаги

- Пример **api-format** в репозитории — **учебный**; под ваш продакшен-формат может понадобиться расширить маппинг в `convert.mjs` или отточить промпт **`llm-system.md`**.
- Ответ **`/aid/export/app`** с большим числом сущностей может быть объёмным; при необходимости добавьте сжатие, отдельное хранилище артефактов или пагинацию по файлам — контракт с AID лучше зафиксировать отдельно.
