# Зависимости workspace (зафиксированные версии)

- Рабочие манифесты: **`server/package.json`**, **`client/package.json`** — прямые зависимости **без** префиксов `^` / `~`; точные версии синхронизированы с **`package-lock.json`** (скрипт `tools/pin-package-versions.mjs`).
- После добавления пакета: `npm install <pkg>` в `server/` или `client/` (с `save-exact` в `.npmrc`), затем при необходимости снова **`node tools/pin-package-versions.mjs server|client`** и коммит обоих файлов.
- Генератор **`generation/generate.mjs`** не перезаписывает `package.json`; агенты не должны ослаблять диапазоны версий при правках кода.
