# Implementation Plan: Merge Related Users

**Branch**: `chore/019-merge-related-users` | **Date**: 2026-04-27 | **Spec**: `/specs/019-merge-related-users/spec.md`
**Input**: Feature specification from `/specs/019-merge-related-users/spec.md`

## Summary

Implement a reviewer-governed registration approval workflow where new sign-ups are blocked in pending status until Admin/Editor decision. Reviewers can approve without merge, approve with merge against orphan players, or deny with reason and account erasure. The design introduces explicit approval lifecycle state, auditable approval decision persistence, hard-delete denial handling without retained rejected-application data, optimistic locking for concurrent reviewers, and a notification sender contract (no transport implementation in scope).

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js >= 23 for CMS, Vue/Nuxt TypeScript on frontend)  
**Primary Dependencies**: Express, Zod, Prisma, jsonwebtoken, bcryptjs, Redis client, Nuxt 4, Pinia  
**Storage**: PostgreSQL (primary), Redis (auth/session/cache support)  
**Testing**: Jest (CMS unit/integration), Vitest (frontend unit), Playwright (frontend E2E where needed)  
**Target Platform**: Web app (Node API + Nuxt SSR frontend)
**Project Type**: Monorepo web application (backend + frontend + shared package)  
**Performance Goals**: Approval queue and decision endpoints should remain within existing API target (<300ms average in normal load) and return deterministic conflict responses for races  
**Constraints**: Must preserve current RBAC hierarchy; notification failure cannot block approve/deny; merge must be transactional; enforce orphan-only merge targets; curated suggestions must enforce `matchScore >= 0.30` and a top-5 cap; denied applications must be hard-deleted without retained rejected-application data; no page-level monolith templates in new UI  
**Scale/Scope**: Team-scale admin workflow (tens of concurrent reviewer actions, thousands of user/player records over time)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Pre-Phase 0 result: PASS

- [x] **Shared types gate (Principle VII)**: New cross-package DTOs/interfaces are expected (`RegistrationStatus`, pending approval DTOs, notification sender contract) and will be defined in `packages/shared/src/types/` and exported from `@ministrosfc/shared` before implementation.
- [x] **Page decomposition gate (Principle V)**: New/updated admin users UI will keep route files thin; feature blocks will live under `packages/frontend/src/components/pages/admin/users/` (queue table, review panel, merge selector, decision modal).
- [x] **Page meta declaration gate (Principle V)**: Any new page under `packages/frontend/src/pages/admin/users/` will declare `definePageMeta({ layout: "admin", middleware: "auth", requiresAuth: true, requiresRole: "editor" })`.

Post-Phase 1 re-check: PASS

- [x] Data model and contracts preserve shared-types-first approach for cross-package APIs.
- [x] Planned UI structure explicitly decomposes page-scoped blocks.
- [x] Access/meta requirement remains explicit for any introduced page file.

## Project Structure

### Documentation (this feature)

```text
specs/019-merge-related-users/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── approval-review-api.md
│   └── notification-sender.md
└── tasks.md
```

### Source Code (repository root)

```text
packages/
├── cms/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   └── users.ts
│   │   ├── services/
│   │   │   ├── AuthService.ts
│   │   │   └── UserService.ts
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   └── Player.ts
│   │   └── config/server.ts
│   └── tests/
│       ├── integration/
│       └── unit/
├── frontend/
│   ├── src/
│   │   ├── pages/admin/users/
│   │   ├── components/admin/
│   │   └── components/pages/admin/users/
│   └── tests/
│       └── unit/
└── shared/
    └── src/types/
```

**Structure Decision**: Use the existing monorepo package boundaries (`cms`, `frontend`, `shared`) with contracts enforced through shared types and admin-user route namespace reuse.

## Phase 0 Outcome (Research)

Research completed in `/specs/019-merge-related-users/research.md`.

Key outcomes:

- Explicit registration lifecycle status on user.
- Dedicated approval decision audit entity for approval paths.
- Optimistic locking with `expectedUpdatedAt`.
- Orphan-player prefilter plus ranked suggestions with `matchScore >= 0.30` and top-5 cap.
- Denied applications are hard-deleted with no retained rejected-application data.
- Notification sender interface with safe non-throwing path.

No unresolved technical clarifications remain.

## Phase 1 Outcome (Design and Contracts)

Generated artifacts:

- Data model: `/specs/019-merge-related-users/data-model.md`
- Contracts: `/specs/019-merge-related-users/contracts/approval-review-api.md`, `/specs/019-merge-related-users/contracts/notification-sender.md`
- Quickstart: `/specs/019-merge-related-users/quickstart.md`

Design alignment notes:

- Approval endpoints are defined under existing admin-users API surface.
- Post-approval merge path is preserved via user edition capabilities.
- Denial endpoint requires reason input for confirmation/validation and performs hard-delete without retaining rejected-application records.
- Notification integration is contract-first and transport-agnostic.

## Complexity Tracking

No constitution violations identified; complexity exemptions are not required.
