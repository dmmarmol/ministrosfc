# Feature Specification: Rename Specs & Branches

**Feature Branch**: `chore/rename-specs-branches`
**Created**: 2026-03-27
**Status**: Draft
**Type**: Chore (housekeeping)
**Input**: Spec directory renumbering + constitution §Git and Commit Conventions

## Context

Spec directories used non-sequential numbers (011-017) that did not match the actual development order. Additionally, git branches used a flat `NNN-short-name` format instead of the constitutional `type/short-description` convention. This spec aligns both spec numbering and branch naming.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Consistent Spec Numbering and Branch Naming (Priority: P1)

A developer browsing specs sees directories numbered sequentially (001-011) matching the order features were developed. Running `git branch` shows branches with typed prefixes (`feature/`, `fix/`, `chore/`) per the constitution.

**Acceptance Scenarios**:

1. **Given** the repository, **When** listing spec directories, **Then** they are numbered 001-011 with no gaps, matching development order.
2. **Given** the repository, **When** listing branches, **Then** all follow the `type/short-description` convention.
3. **Given** a legacy numbered branch, **When** the cleanup is done, **Then** superseded branches (003-010 range from initial setup) are deleted.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Spec directories MUST be renumbered to sequential order matching development timeline.
- **FR-002**: All active branches MUST be renamed from `NNN-short-name` to `type/short-name` per the constitution.
- **FR-003**: Legacy branches with no corresponding spec MUST be deleted.
- **FR-004**: All internal cross-references MUST be updated to reflect new spec numbers and branch names.

### Spec Rename Mapping

| Old | New | Feature |
|---|---|---|
| 011-test-code-quality | 004-test-code-quality | Test/code quality |
| 012-fix-auth-ssr-redirect | 005-fix-auth-ssr-redirect | Auth SSR fix |
| 013-admin-player-delete | 006-admin-player-delete | Admin player delete |
| 014-custom-hostname-dev | 007-custom-hostname-dev | Custom hostname |
| 015-user-registration | 008-user-registration | User registration |
| *(new)* | 009-rename-specs-branches | This spec |
| 016-playground-entity | 010-playground-entity | Playground entity |
| 017-dropdown-add-more | 011-dropdown-add-more | Dropdown add-more |

### Branch Rename Mapping

| Old Branch | New Branch | Type |
|---|---|---|
| `001-ministrosfc-monorepo` | `feature/ministrosfc-monorepo` | feature |
| `002-monorepo-setup` | `chore/monorepo-setup` | chore |
| `003-data-hydration` | `feature/data-hydration` | feature |
| `011-test-code-quality` | `chore/test-code-quality` | chore |
| `012-fix-auth-ssr-redirect` | `fix/auth-ssr-redirect` | fix |
| `013-admin-player-delete` | `feature/admin-player-delete` | feature |
| `014-custom-hostname-dev` | `feature/custom-hostname-dev` | feature |
| `014-vite-allowed-hosts` | `fix/vite-allowed-hosts` | fix |
| `015-user-registration` | `feature/user-registration` | feature |
| `016-playground-entity` | `feature/playground-entity` | feature |
| `017-dropdown-add-more` | `feature/dropdown-add-more` | feature |

### Branches to Delete

| Branch | Reason |
|---|---|
| `003-cms-backend-foundation` | Superseded by 001 monorepo |
| `004-cms-core-api` | Superseded by 001 monorepo |
| `005-cms-extended-api` | Superseded by 001 monorepo |
| `006-cms-extended-api` | Superseded by 001 monorepo |
| `007-frontend-setup` | Superseded by 001 monorepo |
| `008-frontend-pages` | Superseded by 001 monorepo |
| `009-testing-deployment` | Superseded by 001 monorepo |
| `010-cms-vitest-migration` | Superseded by 001 monorepo |

## Success Criteria *(mandatory)*

- **SC-001**: Spec directories are numbered 001-011 sequentially with no gaps.
- **SC-002**: `git branch` shows zero branches using the `NNN-short-name` pattern (only `main` + `type/short-name`).
- **SC-003**: All renamed branches retain full commit history.
- **SC-004**: All internal cross-references updated to new spec numbers and branch names.

## Out of Scope

- Updating `create-new-feature.sh` to enforce the new branch naming convention.
- Enforcing branch naming via git hooks.
