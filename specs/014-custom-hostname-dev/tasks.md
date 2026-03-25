---

description: "Tasks for feature 014-custom-hostname-dev: Custom Hostname Dev Access"
---

# Tasks: Custom Hostname Dev Access

**Input**: Design documents from `/specs/014-custom-hostname-dev/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅
**Tests**: None — config-only change, no new business logic. Acceptance verified manually per spec and quickstart.md.
**Organization**: Tasks grouped by user story to enable independent verification of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup

**Prerequisite (already satisfied)**: The `/etc/hosts` entry `127.0.0.1 localhost.ministrosfc.com` must exist on the developer's machine. Verify with `grep "localhost.ministrosfc.com" /etc/hosts`. No code tasks needed here — this is a one-time machine-level setup outside the scope of this feature's deliverables.

> No implementation tasks in this phase.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Fix env file discrepancies that block user story work. The `CORS_ORIGIN` → `CORS_ORIGINS` typo in `packages/cms/.env.example` mismatches what `server.ts` actually reads — any developer copying this file will use the wrong key name. Both fixes must land before implementing user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T00 Fix `CORS_ORIGIN` (singular) → `CORS_ORIGINS` (plural) key name in `packages/cms/.env.example` to match the environment variable read by `packages/cms/src/config/server.ts`
- [x] T00 [P] Add `NUXT_HOST` variable with dev-setup comment to `packages/frontend/.env.example` (default value `localhost`; developers override to `0.0.0.0` in `.env.local`)

**Checkpoint**: Env examples are accurate — user story implementation can begin.

---

## Phase 3: User Story 1 — Frontend Dev Server Accepts Custom Hostname (Priority: P1) 🎯 MVP

**Goal**: Bind the Nuxt dev server to `0.0.0.0` via the `NUXT_HOST` env var so that `localhost.ministrosfc.com:5103` resolves to the running application.

**Independent Test**: Start the frontend dev server with `NUXT_HOST=0.0.0.0` set in `packages/frontend/.env.local`, open `http://localhost.ministrosfc.com:5103` in a browser, and verify the application loads with no connection errors.

### Implementation for User Story 1

- [x] T00 [US1] Add `devServer` block to `packages/frontend/nuxt.config.ts` reading `process.env.NUXT_HOST` (default `'localhost'`) and `process.env.NUXT_PORT` (default `'5103'`) — the `nitro.port` block already exists; add the parallel `devServer: { host, port }` block

**Checkpoint**: User Story 1 is independently functional — frontend dev server accepts `localhost.ministrosfc.com:5103` when `NUXT_HOST=0.0.0.0` is set.

---

## Phase 4: User Story 2 — API Calls Succeed from Custom Hostname Origin (Priority: P1)

**Goal**: Ensure the backend CORS allowlist includes `http://localhost.ministrosfc.com:5103` so browser API requests from the custom hostname are not rejected.

**Independent Test**: Open the app at `http://localhost.ministrosfc.com:5103`, perform any action that triggers an API call (log in, load player list), and confirm zero CORS errors appear in the browser DevTools Console.

### Implementation for User Story 2

- [x] T00 [US2] Update the `CORS_ORIGINS` example value in `packages/cms/.env.example` to document both origins: `http://localhost:5103,http://localhost.ministrosfc.com:5103` (with a comment explaining the `.env.local` override pattern)
- [x] T00 [P] [US2] Read `packages/cms/src/config/server.ts` and confirm the comma-separated origin parsing (`split(",").map(o => o.trim()).filter(Boolean)`) works correctly for multiple origins — no code change expected; add a brief inline comment confirming support if none exists

**Checkpoint**: User Stories 1 AND 2 are both independently functional. A developer running both servers with the `.env.local` files from quickstart.md can use the full custom hostname flow with zero CORS errors.

---

## Phase 5: User Story 3 — Backend API Accessible via Custom Hostname (Priority: P2)

**Goal**: Confirm the Express server already listens on all interfaces (`0.0.0.0`) so `localhost.ministrosfc.com:5102` works without any code change.

**Independent Test**: Start the backend dev server, send `curl http://localhost.ministrosfc.com:5102/api/v1/health`, and verify a valid health response is returned.

### Implementation for User Story 3

- [x] T00 [US3] Read `packages/cms/src/main.ts` and confirm that `app.listen(API_PORT)` passes no explicit host argument (Express defaults to `0.0.0.0`) — no code change expected; add a short comment confirming the implicit `0.0.0.0` binding if none exists

**Checkpoint**: All three user stories are independently functional. Backend is accessible via `localhost.ministrosfc.com:5102` with no changes beyond confirming the default binding.

---

## Phase 6: Vite Allowed Hosts

**Purpose**: Vite 6+ blocks requests from non-localhost hostnames by default as a security measure. The `devServer` block already binds to `0.0.0.0`, but Vite's `server.allowedHosts` must explicitly whitelist `localhost.ministrosfc.com` for the custom hostname to work in the browser.

- [x] T008 [US1] Add `localhost.ministrosfc.com` to `vite.server.allowedHosts` in `packages/frontend/nuxt.config.ts` via the `vite` config key so the dev server accepts requests addressed to the custom hostname

**Checkpoint**: Opening `http://localhost.ministrosfc.com:5103` no longer shows "Blocked request. This host is not allowed."

---

## Phase 7: Purge Legacy Port 3000/3001 References

**Purpose**: The project's canonical port assignments are PostgreSQL 5100, Redis 5101, CMS API 5102, Frontend 5103. Several files still reference the legacy 3000 (frontend) and 3001 (backend) ports. These stale references confuse new developers and cause deployment mismatches.

**Scope**: Replace every occurrence of port 3000 → 5103 (frontend) and 3001 → 5102 (backend) in documentation, Dockerfiles, Fly.io config, and spec quickstarts. Exclude auto-generated files (tsconfig.tsbuildinfo).

### Infrastructure Files

- [x] T009 [P] Update `packages/frontend/Dockerfile`: change `ARG API_URL=http://backend:3001/api` → `http://backend:5102/api`, `ARG API_URL_PUBLIC=http://localhost:3001/api` → `http://localhost:5102/api`, health check default `3000` → `5103`, `EXPOSE 3000` → `EXPOSE 5103`, comment "Nuxt runs on 3000" → "Nuxt runs on 5103"
- [x] T010 [P] Update `packages/frontend/fly.toml`: change `internal_port = 3000` → `5103`, `APP_PORT = "3000"` → `"5103"``

### Documentation — README.md

- [x] T011 [P] Update `README.md` architecture diagram: change `Port: 3000` → `Port: 5103`, `Port: 3001` → `Port: 5102`
- [x] T012 [P] Update `README.md` dev commands section: change `Backend API on :3001` → `:5102`, `Frontend on :3000` → `:5103`

### Documentation — docs/guides/

- [x] T013 Update `docs/guides/TECH_STACK.md`: replace all `port 3000` → `port 5103`, `port 3001` → `port 5102`, `localhost:3000` → `localhost:5103`, `localhost:3001` → `localhost:5102`
- [x] T014 Update `docs/guides/PODMAN_SETUP.md`: replace all `localhost:3000` → `localhost:5103`, `localhost:3001` → `localhost:5102`, port mappings `3000:3000` → `5103:5103`, `3001:3001` → `5102:5102`, `CORS_ORIGIN` references to use `CORS_ORIGINS` with port 5103, `lsof -i :3000` → `:5103`, `lsof -i :3001` → `:5102`

### Spec Legacy References

- [x] T015 [P] Update `specs/013-admin-player-delete/quickstart.md`: change `localhost:3000` → `localhost:5102` (API) and `localhost:3001` → `localhost:5103` (frontend) based on context of each reference

**Checkpoint**: `grep -rn "3000\|3001" --include="*.md" --include="*.toml" --include="Dockerfile" .` returns zero matches (excluding node_modules and auto-generated files).

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Surface the custom hostname setup in the developer-facing project documentation so new contributors can discover the feature without reading the specs.

- [x] T00 [P] Add a **Custom Hostname Dev Access** subsection to the root `README.md` developer setup section, referencing `specs/014-custom-hostname-dev/quickstart.md` for full instructions and documenting the minimum steps: add `/etc/hosts` entry, create `.env.local` files per quickstart.md, run `npm run dev:all`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No code tasks — prerequisite is a machine-level `/etc/hosts` entry
- **Foundational (Phase 2)**: No dependencies — can start immediately; **BLOCKS all user stories**
- **User Story phases (3, 4, 5)**: All depend on Phase 2 completion; may proceed in parallel after Phase 2
- **Vite Allowed Hosts (Phase 6)**: Depends on Phase 3 (devServer block must exist); **BLOCKS browser access via custom hostname**
- **Purge Legacy Ports (Phase 7)**: Independent of user stories — can run in parallel; all T009-T015 are parallelizable (different files)
- **Polish (Phase 8)**: Depends on all previous phases completing

### User Story Dependencies

| Story | Depends On | Can Start |
|-------|-----------|-----------|
| US1 (P1) — Frontend hostname | Phase 2 | After T001, T002 |
| US2 (P1) — CORS origin | Phase 2 | After T001; T003 not required |
| US3 (P2) — Backend binding | Phase 2 | After T001, T002 (independent) |

- **US1 and US2** are independent of each other — both depend only on Foundational
- **US3** has no implementation tasks; it is a verification step only

### Within Each User Story

- T004 and T005 are both US2 tasks but touch different files — run in parallel
- T006 is a read-only verification — can run at any time after Phase 2

### Parallel Opportunities

- **T002 ∥ (start of any US)**: Frontend `.env.example` update is independent of CMS typo fix
- **T004 ∥ T005**: Both are US2 tasks on different files
- **T006 ∥ T003 ∥ T004**: US3 verification is independent of US1 and US2 implementation
- **T007**: Documentation task is independent of all implementation tasks

---

## Parallel Example: All User Stories (single developer)

```bash
# Phase 2 (sequential — typo fix first, then env doc in parallel if preferred)
T001 → T002

# Phase 3 (after Phase 2)
T003

# Phase 4 (after Phase 2, parallel within phase)
T004 ∥ T005

# Phase 5 (after Phase 2, independent)
T006

# Phase 6 (after all stories)
T007
```

---

## Implementation Strategy

**MVP scope**: User Story 1 (T001 → T002 → T003) gives a working frontend at the custom hostname. This is sufficient for initial verification.

**Full delivery**: Add US2 (T004, T005) for in-browser API calls to work. US3 (T006) is a passive verification with no code changes — it costs one read operation.

**No TDD**: This is a config-only feature. No new code paths, no new business logic. Existing test suites (Vitest + Jest) continue to pass unchanged. Acceptance verified manually per `specs/014-custom-hostname-dev/quickstart.md`.

**Risk**: Zero — all changes are either `.env.example` documentation, one `nuxt.config.ts` config block, or read-only verifications. The only production-relevant file touched is `nuxt.config.ts`, and the change defaults to the current behavior (`'localhost'`) when `NUXT_HOST` is unset.
