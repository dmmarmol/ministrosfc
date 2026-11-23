# MinistrosFC Agent Instructions

npm-workspaces monorepo for an amateur football club website with statistics.

- `packages/shared` — `@ministrosfc/shared`: shared TypeScript types and utilities
- `packages/cms` — `@ministrosfc/cms`: Express REST API (Prisma + PostgreSQL, Redis), port 5102
- `packages/frontend` — `@ministrosfc/frontend`: Nuxt 4 app (public site + admin), port 5103

## Skill Routing

Specialized skills live in `.github/skills/<name>/SKILL.md`. Before writing code, match the request to a skill, tell the user which one you are applying, and follow its `SKILL.md` strictly.

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

Follow `.github/skills/web-coder/SKILL.md`, plus:

- Before creating a helper or formatter in a component, look for an existing one in `packages/frontend/src/utils` or a nearby shared file and reuse it. Do not duplicate date/format/transform logic; share helpers used in more than one place.
- Every user-visible string (public and admin) MUST go through `t()` from `useI18n()`. Do not hardcode labels, validation messages, notifications, button copy, headings, empty states, or helper text. Only machine identifiers, technical constants, and enum values not shown to users may stay raw.

### Tests (Vue & Pinia)

Follow `.github/skills/unit-test-vue-pinia/SKILL.md`.

### CSS

Prioritize CSS variables defined in `theme.css`. For architecture questions, consult `.github/skills/tailwindcss/theme-architect/SKILL.md`.

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

Features are specified under `specs/NNN-name/` using spec-kit (`.github/agents/speckit.*`). Check the active branch's `tasks.md` for current work, and keep `CHANGELOG.md` (root and per-package) updated.

## Manual QA

Browser-driven scenarios (setup, ground rules, per-feature steps and known regressions) live in `docs/guides/MANUAL_QA_CHROME.md`. Use it when asked to test the app in Chrome, always at `https://localhost.ministrosfc.com:5103`. Add new scenarios there when a feature ships or a QA run finds a regression.
