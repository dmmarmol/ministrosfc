# Quickstart: Monorepo Setup

**Feature**: 002-monorepo-setup | **Updated**: 2026-03-21

Get from `git clone` to a fully running local development environment for Ministros FC.

---

## Prerequisites

| Tool           | Minimum Version | Install                                                       |
| -------------- | --------------- | ------------------------------------------------------------- |
| Node.js        | 23.0.0          | [nodejs.org](https://nodejs.org) or `nvm install 23`          |
| npm            | 10.0.0          | Bundled with Node.js 23                                       |
| Podman Desktop | 1.0+            | [podman-desktop.io](https://podman-desktop.io)                |
| podman-compose | 1.0+            | `pip install podman-compose` or `brew install podman-compose` |

> **macOS users**: Podman Desktop installs both `podman` and `podman-compose`. Docker Desktop is also compatible — replace `podman-compose` with `docker compose` or set `docker:up` to use `docker compose`.

---

## Step 1 — Clone and install dependencies

```bash
git clone https://github.com/yourusername/ministrosfc.git
cd ministrosfc
npm install
```

`npm install` at the root installs all three package workspaces (`@ministrosfc/cms`, `@ministrosfc/frontend`, `@ministrosfc/shared`) in a single pass via npm workspaces.

---

## Step 2 — Copy environment files

```bash
cp packages/cms/.env.example packages/cms/.env
cp packages/frontend/.env.example packages/frontend/.env
```

The defaults in `.env.example` are pre-configured for local development. You only need to edit them for:

- Object storage (Cloudinary): obtain free-tier credentials at [cloudinary.com](https://cloudinary.com)
- Custom ports: only if 5100–5103 conflict with local services

---

## Step 3 — Start local services

```bash
npm run docker:up
```

This starts PostgreSQL 15 (port **5100**) and Redis 7 (port **5101**) via `podman-compose`. Both services have health checks; they are ready when:

```bash
podman ps
# NAME                    STATUS
# ministrosfc-postgres    Up (healthy)
# ministrosfc-redis       Up (healthy)
```

---

## Step 4 — Generate Prisma client

```bash
npm run gen:prisma
```

Required before the CMS can run. Generates the typed Prisma client from `packages/cms/prisma/schema.prisma`.

---

## Step 5 — Verify the build

```bash
npm run build:all
```

Compiles all three packages in TypeScript strict mode. Expect zero errors. Output:

- `packages/cms/dist/`
- `packages/shared/dist/`
- `packages/frontend/.nuxt/` (Nuxt generates output separately)

---

## Step 6 — Run the full test suite (optional verification)

```bash
npm run test:all
```

Expected: 98 CMS tests pass + 36 frontend tests pass. The CMS integration tests require Docker services to be running (Step 3 must be complete).

---

## Useful Commands

| Command               | What it does                       |
| --------------------- | ---------------------------------- |
| `npm run docker:up`   | Start PostgreSQL + Redis           |
| `npm run docker:down` | Stop all services                  |
| `npm run docker:logs` | Follow container logs              |
| `npm run build:all`   | TypeScript compile all packages    |
| `npm run dev:all`     | Run all packages in watch/dev mode |
| `npm run test:all`    | Run all test suites                |
| `npm run lint:all`    | ESLint across all packages         |
| `npm run gen:prisma`  | Regenerate Prisma client           |
| `npm run clean`       | Remove all dist/ and node_modules/ |

---

## Package Ports

| Service    | Port | Description                   |
| ---------- | ---- | ----------------------------- |
| PostgreSQL | 5100 | Local dev database            |
| Redis      | 5101 | Local dev cache               |
| CMS API    | 5102 | Express backend (`API_PORT`)  |
| Frontend   | 5103 | Nuxt dev server (`NUXT_PORT`) |

Non-standard ports are intentional — they avoid conflicts with any locally installed default PostgreSQL (5432), Redis (6379), or other web servers (3000/8080).

---

## Troubleshooting

**`podman-compose: command not found`**  
Install via `pip install podman-compose` or `brew install podman-compose`. Alternatively use Docker: change the `docker:up` script in `package.json` to `docker compose up -d`.

**`Error: Cannot find module '@ministrosfc/shared'`**  
Run `npm run build --workspace=@ministrosfc/shared` first. The shared package must be compiled before cms or frontend can import from it.

**Port already in use (5100/5101)**  
Edit the `.env` file in the repo root (or `packages/cms/.env`) and override: `DB_PORT=5200 REDIS_PORT=5201`. Then update `DATABASE_URL` and `REDIS_PORT` in `packages/cms/.env` to match.
