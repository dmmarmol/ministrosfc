# Implementation Plan: User Registration & Sign-In (Full Scope)

**Branch**: `feat/009-user-registration` | **Date**: 2026-03-29 | **Spec**: `/specs/009-user-registration/spec.md`  
**Input**: Feature specification from `/specs/009-user-registration/spec.md`

## Summary

Implement the full registration feature scope end-to-end:

1. Email registration and login UI improvements.
2. Google OAuth sign-in with account linking.
3. Unified post-signup onboarding as source of truth for player intent.
4. Profile management suite (photo, editable fields, jersey availability, guests list, jersey SVG).
5. Role management + DT role workflow (promotion/demotion, deactivate/reactivate, hard delete).
6. Schema evolution (`name` split migration + role enum extension + onboarding state).

This plan intentionally covers FR-001 through FR-037, including FR-016 to FR-030 (no deferral).

## Technical Context

**Language/Version**: TypeScript (Node 18+, Nuxt 4/Vue 3)  
**Primary Dependencies**: Express, Prisma, Zod, google-auth-library, Pinia  
**Storage**: PostgreSQL + Redis  
**Testing**: Jest unit/integration (CMS), frontend unit tests, optional Playwright E2E  
**Target Platform**: Web (CMS API + Nuxt frontend)  
**Project Type**: Monorepo web application (`packages/cms` + `packages/frontend`)  
**Performance Goals**: Auth and onboarding endpoints p95 < 300ms; profile fetch p95 < 250ms  
**Constraints**:

1. Preserve existing auth behavior for existing users.
2. Keep Spanish UI copy across auth/profile/admin flows.
3. Keep session storage token behavior unchanged.
4. Maintain backward-safe schema migrations with deterministic backfill.

**Scale/Scope**: Team-sized user base, low-medium auth traffic, full feature completion in one scope.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Pre-Design Gate

1. SPEC-FIRST: PASS
2. PLAN-DRIVEN: PASS
3. TDD: PASS (tests are included as first tasks per story)
4. Session storage mandate: PASS

### Post-Design Gate (Re-check)

1. No constitutional conflicts identified.
2. No exception table needed.

## Project Structure

### Documentation (this feature)

```text
specs/009-user-registration/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── auth-registration-contract.md
│   ├── google-oauth-contract.md
│   ├── onboarding-contract.md
│   ├── profile-contract.md
│   └── role-management-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
packages/cms/
├── prisma/schema.prisma
├── src/
│   ├── config/server.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── rbac.ts
│   ├── models/
│   │   ├── User.ts
│   │   └── Player.ts
│   ├── services/
│   │   ├── AuthService.ts
│   │   ├── ParticipationService.ts
│   │   ├── ProfileService.ts
│   │   ├── UserService.ts
│   │   └── OnboardingService.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── games.ts
│   │   ├── profile.ts
│   │   ├── users.ts
│   │   └── onboarding.ts
│   └── utils/object-storage.ts
└── tests/
    ├── integration/
    └── unit/

packages/frontend/
├── src/
│   ├── pages/
│   │   ├── login.vue
│   │   ├── auth/google/callback.vue
│   │   ├── auth/onboarding.vue
│   │   ├── profile.vue
│   │   └── admin/users/index.vue
│   ├── components/
│   │   ├── auth/
│   │   ├── profile/
│   │   └── admin/
│   ├── composables/
│   ├── middleware/
│   └── stores/auth.ts
└── tests/
```

**Structure Decision**: Keep monorepo layout and implement all FR groups in the same feature branch.

## Phase Design

### Phase A: Schema + Core Foundations

1. Migrate `User.name` and `Player.name` to `firstName` + `lastName`.
2. Add `Role.DT`, `User.googleSubjectId`, nullable `passwordHash`.
3. Add `User.onboardingCompletedAt` and backfill existing users as completed.
4. Update RBAC hierarchy and auth/user typing.

### Phase B: Authentication Flows

1. `/login` UI refactor with sign-in/sign-up modes and Google entry.
2. Email registration with onboarding-first redirect.
3. Google OAuth + account linking + onboarding-aware callback behavior.

### Phase C: Unified Onboarding

1. `GET /api/v1/onboarding/status`
2. `POST /api/v1/onboarding/complete`
3. Conditional player creation/update (`isPlayer` true) or no link (`isPlayer` false).

### Phase D: Profile Feature Set

1. Profile read/write endpoints and photo upload.
2. Jersey availability endpoint and conflict handling.
3. Frontend profile page with edit form, jersey SVG, invited guests list.
4. Deactivated player behavior preserved (can log in/edit, excluded from active participation features).

### Phase E: Role & DT Management

1. Admin role promotion/demotion matrix.
2. Admin/editor player status management (soft deactivate/reactivate).
3. Admin-only hard delete player.
4. DT permissions for tactics/guest-player flows.
5. Admin UI for user/role/player-status management.

## Risks & Mitigations

1. Risk: migration/backfill data mismatch for split names.
   - Mitigation: custom SQL migration with nullable-add, backfill, not-null, drop-old sequence.
2. Risk: onboarding and registration state divergence.
   - Mitigation: make onboarding endpoint the only player-link authority.
3. Risk: role escalation logic bugs.
   - Mitigation: explicit service-level role transition tests and integration tests.
4. Risk: regressions due to broad scope.
   - Mitigation: phased checkpoints and regression suite execution after each phase.

## Rollback Procedures

### Phase A rollback (schema + foundations)

1. Roll back Prisma migration for onboarding/Google/role additions if validation fails before production cutover.
2. If name split migration introduces data issues, restore pre-migration snapshot and re-run migration with corrected backfill SQL.
3. Keep backward-compatible reads for one deploy window (supporting legacy `name` fallback) until migration verification is complete.

### Phase B rollback (authentication flows)

1. Feature-flag new register response payload and Google callback branching; disable flag to restore prior login behavior.
2. Revert auth route handlers to last known-good commit if sign-in success rate drops below baseline.
3. Preserve token/session issuance contract to avoid forced logout during rollback.

### Phase C rollback (onboarding)

1. Disable onboarding middleware guard and fallback to direct role landing while keeping onboarding endpoints read-only.
2. Revert onboarding completion writes if idempotency or player-link logic produces inconsistent state.
3. Run reconciliation script to reset `onboardingCompletedAt` only for records created in the failed rollout window.

### Phase D rollback (profile)

1. Revert profile edit surface behind route-level feature flag if API validation or upload behavior regresses.
2. Keep profile reads enabled while disabling write endpoints (`PATCH /profile`, `PUT /profile/photo`) during incident containment.
3. Restore previous object-storage URL handling if upload adapter changes break existing images.

### Phase E rollback (roles + DT)

1. Disable admin role transition UI/actions while retaining read-only user management list.
2. Revert DT-specific permission checks in game routes if they block existing editor/admin operations.
3. Suspend hard-delete endpoint and fallback to soft deactivation-only mode until integrity checks pass.

### Cross-phase rollback validation checklist

1. Re-run auth regression tests and smoke login flow.
2. Verify onboarding redirect behavior for new vs existing users.
3. Validate role matrix invariants and deactivated-player restrictions.
4. Confirm profile read path and existing photo URLs remain valid.

## Complexity Tracking

No constitution violations requiring justification.
