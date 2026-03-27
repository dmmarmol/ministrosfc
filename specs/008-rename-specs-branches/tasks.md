# Tasks: Rename Specs & Branches

**Input**: Design documents from `/specs/008-rename-specs-branches/`
**Prerequisites**: spec.md ✅

---

## Phase 1: Rename Spec Directories

- [x] T001 Rename `011-test-code-quality` → `004-test-code-quality`
- [x] T002 Rename `012-fix-auth-ssr-redirect` → `005-fix-auth-ssr-redirect`
- [x] T003 Rename `013-admin-player-delete` → `006-admin-player-delete`
- [x] T004 Rename `014-custom-hostname-dev` → `007-custom-hostname-dev`
- [x] T005 Create `008-rename-specs-branches` (this spec)
- [x] T006 Rename `015-user-registration` → `009-user-registration`
- [x] T007 Rename `016-playground-entity` → `010-playground-entity`
- [x] T008 Rename `017-dropdown-add-more` → `011-dropdown-add-more`

---

## Phase 2: Update Cross-References

- [x] T009 Update all spec path references (`NNN-short-name` slugs) across all `.md`, `.ts`, `.vue` files
- [x] T010 Update all "Feature NNN" textual references
- [x] T011 Update all backtick-quoted branch name references to constitutional `type/short-name` convention

---

## Phase 3: Delete Legacy Branches

- [x] T012 Delete branch `003-cms-backend-foundation`
- [x] T013 [P] Delete branch `004-cms-core-api`
- [x] T014 [P] Delete branch `005-cms-extended-api`
- [x] T015 [P] Delete branch `006-cms-extended-api`
- [x] T016 [P] Delete branch `007-frontend-setup`
- [x] T017 [P] Delete branch `008-frontend-pages`
- [x] T018 [P] Delete branch `009-testing-deployment`
- [x] T019 [P] Delete branch `010-cms-vitest-migration`

---

## Phase 4: Rename Active Branches

- [x] T020 Rename `001-ministrosfc-monorepo` → `feature/ministrosfc-monorepo`
- [x] T021 Rename `002-monorepo-setup` → `chore/monorepo-setup`
- [x] T022 Rename `003-data-hydration` → `feature/data-hydration`
- [x] T023 Rename `011-test-code-quality` → `chore/test-code-quality`
- [x] T024 Rename `012-fix-auth-ssr-redirect` → `fix/auth-ssr-redirect`
- [x] T025 Rename `013-admin-player-delete` → `feature/admin-player-delete`
- [x] T026 Rename `014-custom-hostname-dev` → `feature/custom-hostname-dev`
- [x] T027 Rename `014-vite-allowed-hosts` → `fix/vite-allowed-hosts`
- [x] T028 Rename `015-user-registration` → `feature/user-registration`
- [x] T029 Rename `016-playground-entity` → `feature/playground-entity`
- [x] T030 Rename `017-dropdown-add-more` → `feature/dropdown-add-more`

---

## Phase 5: Verification

- [x] T031 Verify spec directories are 001-011 sequential with no gaps
- [x] T032 Verify no branch uses old `NNN-short-name` pattern
- [x] T033 Verify no spec file references old numbering or old branch names
