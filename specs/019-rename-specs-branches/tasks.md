# Tasks: Rename Specs & Branches

**Input**: Design documents from `/specs/014-rename-specs-branches/`
**Prerequisites**: spec.md ✅

---

## Phase 1: Delete Legacy Branches

**Purpose**: Remove old numbered branches that have no corresponding spec and were superseded by later work

- [x] T001 Delete branch `003-cms-backend-foundation` via `git branch -D 003-cms-backend-foundation`
- [x] T002 [P] Delete branch `004-cms-core-api` via `git branch -D 004-cms-core-api`
- [x] T003 [P] Delete branch `005-cms-extended-api` via `git branch -D 005-cms-extended-api`
- [x] T004 [P] Delete branch `006-cms-extended-api` via `git branch -D 006-cms-extended-api`
- [x] T005 [P] Delete branch `007-frontend-setup` via `git branch -D 007-frontend-setup`
- [x] T006 [P] Delete branch `008-frontend-pages` via `git branch -D 008-frontend-pages`
- [x] T007 [P] Delete branch `009-testing-deployment` via `git branch -D 009-testing-deployment`
- [x] T008 [P] Delete branch `010-cms-vitest-migration` via `git branch -D 010-cms-vitest-migration`

---

## Phase 2: Rename Active Branches

**Purpose**: Rename all active branches from `NNN-short-name` to `type/short-name` per constitutional convention

- [x] T009 Rename `001-ministrosfc-monorepo` → `feature/ministrosfc-monorepo` via `git branch -m 001-ministrosfc-monorepo feature/ministrosfc-monorepo`
- [x] T010 Rename `002-monorepo-setup` → `chore/monorepo-setup` via `git branch -m 002-monorepo-setup chore/monorepo-setup`
- [x] T011 Rename `003-data-hydration` → `feature/data-hydration` via `git branch -m 003-data-hydration feature/data-hydration`
- [x] T012 Rename `011-test-code-quality` → `chore/test-code-quality` via `git branch -m 011-test-code-quality chore/test-code-quality`
- [x] T013 Rename `012-fix-auth-ssr-redirect` → `fix/auth-ssr-redirect` via `git branch -m 012-fix-auth-ssr-redirect fix/auth-ssr-redirect`
- [x] T014 Rename `013-admin-player-delete` → `feature/admin-player-delete` via `git branch -m 013-admin-player-delete feature/admin-player-delete`
- [x] T015 Rename `014-custom-hostname-dev` → `feature/custom-hostname-dev` via `git branch -m 014-custom-hostname-dev feature/custom-hostname-dev`
- [x] T016 Rename `014-vite-allowed-hosts` → `fix/vite-allowed-hosts` via `git branch -m 014-vite-allowed-hosts fix/vite-allowed-hosts`
- [x] T017 Rename `015-user-registration` → `feature/user-registration` via `git branch -m 015-user-registration feature/user-registration`
- [x] T018 Rename `016-playground-entity` → `feature/playground-entity` via `git branch -m 016-playground-entity feature/playground-entity`
- [x] T019 Rename `017-dropdown-add-more` → `feature/dropdown-add-more` via `git branch -m 017-dropdown-add-more feature/dropdown-add-more`
- [x] T020 Rename `018-record-audit-fields` → `feature/record-audit-fields` via `git branch -m 018-record-audit-fields feature/record-audit-fields`

---

## Phase 3: Update Documentation References

**Purpose**: Update all spec files that reference old branch names to use the new convention

- [x] T021 Bulk update all `Feature Branch`, `Branch`, and `git checkout` references in spec.md, plan.md, quickstart.md, tasks.md, and contract files across all spec directories

---

## Phase 4: Verification

- [x] T022 Run `git branch` and verify no branches use the `NNN-short-name` pattern (only `main` + `type/short-name` branches remain)
- [x] T023 Verify no spec files reference old-convention branch names (grep for backtick-quoted `NNN-` patterns)
