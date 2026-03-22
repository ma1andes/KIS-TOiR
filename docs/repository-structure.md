# Repository Structure

`KIS-TOiR` keeps the existing LLM-first generation philosophy and organizes the repository by meaning:

- `domain/`
  - canonical DSL inputs
  - DSL specification
- `prompts/`
  - active prompt corpus used to drive generation
- `docs/`
  - overview and repository-level architecture notes
- `tools/`
  - helper scripts for summary generation and validation
- `server/`
  - active backend target output
- `client/`
  - active frontend target output

The repository keeps LLM-first generation orchestration, but framework bootstrap is CLI-first:

- `server/` must remain a valid NestJS workspace baseline
- `client/` must remain a valid Vite React TypeScript workspace baseline
- repair a broken workspace before applying more domain-derived generation changes
- future agents must treat forbidden generation patterns in `prompts/` as contract violations, not suggestions

Root-level files stay limited to repository-level artifacts such as:

- `README.md`
- `package.json`
- `docker-compose.yml`
- `domain-summary.json`
- `toir-realm.json`
- `.gitignore`

The repository does not introduce a new generator engine or compiler platform. It keeps the current LLM-first pipeline and makes it cleaner, more explicit, and easier to navigate.
