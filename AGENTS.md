# MinistrosFC Agent Instructions

npm-workspaces monorepo for an amateur football club website with statistics.

- `packages/shared` — `@ministrosfc/shared`: shared TypeScript types and utilities
- `packages/cms` — `@ministrosfc/cms`: Express REST API (Prisma + PostgreSQL, Redis), port 5102
- `packages/frontend` — `@ministrosfc/frontend`: Nuxt 4 app (public site + admin), port 5103

## Skill Routing

Claude Code assets live in `.claude/`: `skills/` (below), `commands/` (spec-kit slash commands such as `/speckit.plan`), `agents/` (subagents for the CMS API and Prisma work) and `rules/` (conventions scoped to `packages/cms` and `packages/frontend` paths).

Specialized skills live in `.claude/skills/<name>/SKILL.md`. Before writing code, match the request to a skill, tell the user which one you are applying, and follow its `SKILL.md` strictly.

| Skill                        | Use when                                                         |
| ---------------------------- | ---------------------------------------------------------------- |
| `git-commit`                 | The user asks to commit. Conventional commits, grouped by scope, even if a scope is a single chunk inside a file. |
| `unit-test-vue-pinia`        | Writing or updating Vue & Pinia tests.                           |
| `web-coder`                  | Writing or updating frontend code.                               |
| `tailwindcss/theme-architect`| Writing or updating CSS, or asking about CSS architecture.       |
| `create-release`             | Creating a release or publishing a new version.                  |
| `create-pr`                  | Opening or drafting a pull request (conventional title, Summary/Why/Changes/Documentation body). |

If a task needs several skills, split it into steps, run one skill per step, and surface partial output between steps.

## Tech Stack

- TypeScript 5.x (strict, `tsconfig.base.json`), Node.js >= 23, npm >= 10
- Backend: Express, Prisma, PostgreSQL, Redis, Zod, jsonwebtoken, bcryptjs, Pino logging
- Frontend: Nuxt 4, Vue 3 (Composition API, `<script setup>`), Pinia, `@nuxt/ui` 4, Tailwind CSS 4
- Testing: Jest (CMS), Vitest + Vue Test Utils (frontend), Playwright (E2E)
- Deployment: Fly.io; local PostgreSQL (port 5100) and Redis (port 5101) via Podman/Docker Compose

## Project Structure

```text
packages/
├── shared/src/types/        # Shared interfaces and enums
├── cms/
│   ├── src/{config,middleware,models,services,routes,utils,scripts}
│   ├── prisma/              # schema, migrations, seeds
│   ├── tests/
│   └── docs/API_ARCHITECTURE_OVERVIEW.md
└── frontend/
    └── src/{components,pages,stores,composables,utils,plugins,layouts,assets}
specs/NNN-feature-name/      # spec.md, plan.md, tasks.md, data-model.md, contracts/
.specify/                    # spec-kit constitution (TDD) and templates
docs/                        # architecture and guides
```

## Commands

```bash
npm run dev:all        # Start all packages in dev mode
npm run docker:up      # Start PostgreSQL + Redis containers
npm run docker:down    # Stop containers
npm run build:all      # Build all packages
npm run gen:prisma     # Generate Prisma client
npm run test:all       # Run tests for all packages
npm run lint:all       # Lint all packages

cd packages/cms
npx prisma migrate dev # Create and run migrations
npx prisma db seed     # Seed database
npx prisma studio      # Prisma Studio GUI
```

## Code Style

- TypeScript strict mode everywhere.
- Prefer existing user-defined or Prisma enums over raw string literals. If a literal is repeated, add it to the right enum or create one under `@ministrosfc/shared`.
- Frontend: Vue 3 Composition API, Pinia for state.
- API responses use a consistent structure: `{ success, data, error, statusCode }`.
- Logging: Pino structured JSON logs with correlation IDs.
- Testing: TDD (write tests before implementation), 80%+ coverage target.

### Frontend

Follow `.claude/skills/web-coder/SKILL.md`, plus:

- Before creating a helper or formatter in a component, look for an existing one in `packages/frontend/src/utils` or a nearby shared file and reuse it. Do not duplicate date/format/transform logic; share helpers used in more than one place.
- Every user-visible string (public and admin) MUST go through `t()` from `useI18n()`. Do not hardcode labels, validation messages, notifications, button copy, headings, empty states, or helper text. Only machine identifiers, technical constants, and enum values not shown to users may stay raw.

### Tests (Vue & Pinia)

Follow `.claude/skills/unit-test-vue-pinia/SKILL.md`.

### CSS

Prioritize CSS variables defined in `theme.css`. For architecture questions, consult `.claude/skills/tailwindcss/SKILL.md`.

## Key Architectural Decisions

- **MVP scope**: tournaments are grouping/categorization only, not full league standings.
- **Player photos**: external object storage (`photoUrl`), not the local filesystem.
- **CORS**: specific origins (production domain + localhost in dev), credentials enabled.
- **Rate limiting**: `express-rate-limit` (in-memory), 5 login attempts per 15 min per IP.
- **Soft deletes**: players use `status` (ACTIVE | INACTIVE) and are preserved in historical data.
- **Guest players**: `playerType=GUEST`, linked to the inviting player via `invitedById`.
- **Registration**: new users stay `PENDING_APPROVAL` until an Admin/Editor approves (spec 019).
- **CSV import**: durable import jobs; order is jugadores → canchas → historial → apariciones.

## CMS API

Read `packages/cms/docs/API_ARCHITECTURE_OVERVIEW.md` before changing the API architecture.

## Specs

Features are specified under `specs/NNN-name/` using spec-kit (slash commands `/speckit.specify`, `/speckit.plan`, `/speckit.tasks`, ... in `.claude/commands/`). Check the active branch's `tasks.md` for current work, and keep `CHANGELOG.md` (root and per-package) updated.

## Deployment

Production deploys automatically on merge to `main` (DEV on `develop`) through `.github/workflows/deploy.yml`. Architecture, environments, secret names, rollback and the owner-run bootstrap steps are in `docs/guides/DEPLOYMENT.md`; never put secret values in the repository. Fly config is per environment (`fly.development.toml`, `fly.production.toml`).

## Manual QA

For browser-driven QA, use Claude in Chrome against `https://localhost.ministrosfc.com:5103` (the frontend is served over HTTPS, the CMS runs on `http://localhost:5102`). The user signs in themselves; never type passwords. Prefer read-only checks on the dev database, clean up any `QA Temp ...` records you create, and check responsive layouts with same-origin iframes rather than `resize_window`. Private QA runbooks and design sketches live in the gitignored `private/` directory when present locally; they are intentionally not part of the repository.
