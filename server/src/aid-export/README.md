# AID export: OpenAPI + генератор приложения

**Полное описание задачи, сценариев и CLI:** [docs/AID_EXPORT_README.md](../../../docs/AID_EXPORT_README.md)

Ниже — краткая справка по HTTP-эндпоинтам.

---

## 1. `api-format` → OpenAPI 3.0

`POST /aid/export/openapi`

Внутри: `tools/api-format-to-openapi/convert.mjs` (режимы `deterministic` и `llm`).

**Тело:**

```json
{
  "apiFormat": { "apiFormatVersion": "1", "...": "..." },
  "mode": "deterministic"
}
```

**Ответ:** `{ "openapi": { ... } }`

---

## 2. DSL → сгенерированное приложение (бандл или запись на диск)

`POST /aid/export/app`

Внутри: `generation/generate.mjs`.

**Тело:**

```json
{
  "dsl": "domain TOiR {\n  ...\n}\n",
  "apply": false
}
```

- **`apply` по умолчанию `false` (рекомендуется для AID):** ответ содержит `files` — карта **путь от корня репозитория → текст файла** (Prisma, Nest-модули, React Admin и обновлённые `app.module.ts` / `App.tsx`). **На диск ничего не пишется.**
- **`apply: true`:** выполняется тот же процесс, что и `npm run generate:from-dsl` с `--apply` — **перезапись файлов в рабочей копии** на машине, где запущен Nest. Включено только если в окружении задано **`AID_GENERATOR_ALLOW_APPLY=1`** (или `true`). Иначе `403 Forbidden`.

**Ответ (бандл):**

```json
{
  "applied": false,
  "entityCount": 3,
  "enumCount": 3,
  "files": {
    "server/prisma/schema.prisma": "...",
    "server/src/modules/equipment/equipment.controller.ts": "...",
    "client/src/App.tsx": "..."
  }
}
```

**Ответ (apply):**

```json
{
  "applied": true,
  "message": "Generated 3 entities from ..."
}
```

### CLI-аналог бандла (без Nest)

Из **корня репозитория**:

```bash
node generation/generate.mjs --print-bundle-json --dsl examples/TOiR.domain.dsl > bundle.json
```

---

## Безопасность

- Если в `.env` задан **`AID_EXPORT_API_KEY`**, для **обоих** эндпоинтов нужен заголовок **`X-AID-Export-Key`** с тем же значением.
- Не включайте **`AID_GENERATOR_ALLOW_APPLY`** на публичных инстансах без понимания рисков.

## Требования

- Запуск Nest с **cwd = `server/`** относительно корня репо, чтобы находились `../generation/generate.mjs` и `../tools/...`.
