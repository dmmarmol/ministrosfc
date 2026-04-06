# Feature Specification: Centralize Shared Types in @ministrosfc/shared

**Feature Branch**: `chore/011-shared-types-migration`
**Created**: 2026-04-06
**Status**: Draft
**Priority**: P2 (technical debt, cross-cutting concern)

---

## User Scenarios & Testing

### User Story 1 — Developers get compile-time errors on type mismatches across packages (Priority: P1)

A developer changes a field name in the `ProfileService.getProfile` response on the CMS side. Today, the frontend `ProfileData` interface is a separate declaration in `useProfile.ts` — so TypeScript compiles successfully even though the two shapes are now out of sync, and the mismatch only surfaces at runtime.

After this feature, `ProfileService.getProfile` is annotated with the return type `PlayerProfileResponse` from `@ministrosfc/shared`, and `useProfile.ts` imports the same type. The same field rename now produces a compile error in *both* packages immediately.

**Why this priority**: Silent type drift between service response and frontend consumer is the root cause of the stale-data bug fixed in spec 010. Preventing recurrence requires the contract to be shared, not duplicated.

**Independent Test**: Rename a field (e.g., `jerseyNumber` → `jersey`) in only the CMS `getProfile` return object. TypeScript compilation in `packages/cms` AND `packages/frontend` must both fail.

**Acceptance Scenarios**:

1. **Given** a developer changes the shape of `ProfileService.getProfile` return, **When** they run `tsc --noEmit` in `packages/cms`, **Then** the compiler reports an error if the return shape no longer satisfies `PlayerProfileResponse`.
2. **Given** the same change, **When** they run `tsc --noEmit` in `packages/frontend`, **Then** the compiler reports an error in `useProfile.ts` because `ProfileData` has been replaced with the same `PlayerProfileResponse` import.
3. **Given** a developer changes `UpdatePlayerProfilePayload` in `@ministrosfc/shared`, **When** they run `tsc --noEmit` in both packages, **Then** all usages (route schema base, service method parameter, frontend composable `updateProfile` call) fail if the shape is no longer satisfied.

---

### User Story 2 — Developers use domain enums from shared instead of raw strings (Priority: P1)

A developer reads `ProfileService.ts` and sees `status: "ACTIVE"`, `playerType: "REGISTERED"` scattered through Prisma queries. They cannot tell whether `"ACTIVE"` refers to `PlayerStatus.ACTIVE` from shared without reading the enum definition separately. If the enum value ever changes, the string literal silently diverges.

After this feature, all raw string literals for domain enums in `packages/cms` and `packages/frontend` are replaced with imports from `@ministrosfc/shared` (`PlayerStatus`, `PlayerType`, `UserRole`). An IDE rename on the enum value cascades everywhere.

**Why this priority**: This resolves the `@TODO` comments in `ProfileService.ts` flagged as P1 by Principle VII (constitution v1.6.0).

**Independent Test**: Rename `PlayerStatus.ACTIVE` to `PlayerStatus.ACTIVO` in `packages/shared`. Run `tsc --noEmit` across the monorepo. Every file that previously used the raw string `"ACTIVE"` in a context typed with `PlayerStatus` must produce an error; files not yet migrated should also be identifiable.

**Acceptance Scenarios**:

1. **Given** `ProfileService.ts` references `playerType: "GUEST"` in a Prisma `where` clause, **When** migration is complete, **Then** that literal is replaced with `PlayerType.GUEST` imported from `@ministrosfc/shared`.
2. **Given** `ProfileService.ts` references `status: "ACTIVE"` and `status: "INACTIVE"`, **When** migration is complete, **Then** those literals are replaced with `PlayerStatus.ACTIVE` and `PlayerStatus.INACTIVE`.
3. **Given** `packages/frontend` components or composables use role/status/position string comparisons (including `ProfileEditForm.vue`'s `isActive` computed, `ProfileHeader.vue`'s `roleBadgeClass` and `statusBadgeClass`), **When** migration is complete, **Then** those comparisons use imported enum values from `@ministrosfc/shared`.

---

### User Story 3 — New API response types live in shared from day one (Priority: P2)

A developer working on a new feature (e.g., spec 012 Playground entity) needs to define an API response type. Before this feature, there is no convention — they may put it in the service file, in a route file, or in a frontend composable. After this feature, there is a clear, enforced location: `packages/shared/src/types/api.ts` (or a feature-specific file in `packages/shared/src/types/`).

**Why this priority**: Prevents the same drift problem from recurring in new features. Establishes the convention before spec 012 implementation begins.

**Independent Test**: Review spec 012 (Playground) implementation. Verify `PlaygroundResponse` and any other new cross-package types are defined in `@ministrosfc/shared` rather than in either consumer package.

**Acceptance Scenarios**:

1. **Given** a developer adding a new API endpoint, **When** they look at `packages/shared/src/types/`, **Then** they find the canonical location and example types to model their new type on.
2. **Given** the `@ministrosfc/shared` package, **When** a developer runs `tsc --noEmit` in isolation, **Then** it compiles without errors after all migrated types are added.
3. **Given** `@ministrosfc/shared`'s `index.ts`, **When** all new types are added, **Then** they are exported from the root index so consumers only need `import { X } from "@ministrosfc/shared"`.

---

### Edge Cases

- What about Prisma-specific types (e.g., `Prisma.PlayerWhereInput`) used internally inside a service? → These are NOT moved to shared; they stay local to `packages/cms`. Shared types represent API contracts, not ORM internals.
- What about types used only in a single package? → They stay in that package. Only types consumed by more than one package move to shared.
- What about the `Record<string, unknown>` intermediate objects inside `ProfileService` updates? → These are transient mutation accumulators, not contracts — they stay local and are out of scope. A follow-up chore can replace them with Prisma input types.
- What if a type in shared needs to be different from the Prisma-generated type? → The shared type is the API contract (serialized form); Prisma types are DB-layer. They may differ (e.g., `dateOfBirth: string | null` in the API vs `Date | null` in Prisma). Both are correct in their respective layers.

---

## Requirements

### Functional Requirements

- **FR-001**: `PlayerProfileResponse` MUST be defined in `packages/shared/src/types/api.ts` matching the exact shape returned by `ProfileService.getProfile`.
- **FR-002**: `UpdatePlayerProfilePayload` MUST be defined in `packages/shared/src/types/api.ts` matching the parameter accepted by `ProfileService.updateProfile`.
- **FR-003**: `ProfileService.getProfile` MUST be annotated with `Promise<PlayerProfileResponse>` as its explicit return type.
- **FR-004**: `ProfileService.updateProfile` MUST use `UpdatePlayerProfilePayload` as its `data` parameter type instead of an inline anonymous type.
- **FR-005**: `packages/frontend/src/composables/useProfile.ts` MUST import `PlayerProfileResponse` from `@ministrosfc/shared` and remove the local `ProfileData` interface declaration.
- **FR-006**: All raw string literals `"ACTIVE"`, `"INACTIVE"` in `packages/cms/src/services/ProfileService.ts` that represent `PlayerStatus` values MUST be replaced with `PlayerStatus.ACTIVE` / `PlayerStatus.INACTIVE` imported from `@ministrosfc/shared`.
- **FR-007**: All raw string literals `"REGISTERED"`, `"GUEST"` in `packages/cms/src/services/ProfileService.ts` that represent `PlayerType` values MUST be replaced with `PlayerType.REGISTERED` / `PlayerType.GUEST`.
- **FR-008**: All new types added to `@ministrosfc/shared` MUST be exported from `packages/shared/src/index.ts`.
- **FR-009**: `packages/shared` MUST compile without errors after the migration (`tsc --noEmit` passes in isolation).
- **FR-010**: `packages/cms` and `packages/frontend` MUST each compile without errors after the migration.
- **FR-011**: All existing tests in `packages/cms` and `packages/frontend` MUST continue to pass without modification (or with only import-path updates where the type name changes).
- **FR-012**: The `@TODO` comment on `ProfileService.getProfile` ("enforce return type in this method") and the `@TODO` on `updateProfile` ("try to use existing PlayerData types") MUST be removed upon completion.
- **FR-013**: `useProfile.ts`'s `updateProfile` function MUST use `UpdatePlayerProfilePayload` as its `data` parameter type instead of `Record<string, unknown>`.
- **FR-014**: `ProfileEditForm.vue` MUST define a `type Props = { ... }` (replacing the inline `defineProps<{...}>()` type) whose `status` field uses `PlayerStatus` and whose `position` field uses `Position | ""`. The existing local `ProfileFields` interface may be kept for the reactive form state but MUST use `PlayerStatus` for `status` and `Position | ""` for `position`.
- **FR-015**: `ProfileHeader.vue` MUST define a `type Props = { ..., role: UserRole, status: PlayerStatus, ... }` importing `UserRole` and `PlayerStatus` from `@ministrosfc/shared`. The `roleBadgeClass` computed MUST key on `UserRole` enum values; `statusBadgeClass` MUST compare against `PlayerStatus` enum values.
- **FR-016**: All `@TODO` comments in `packages/frontend/src/components/profile/` (specifically `ProfileEditForm.vue`, `ProfileHeader.vue`, and `InvitedGuestsList.vue`) MUST be resolved and removed. "Resolved" means the underlying issue addressed in code (type imported, utility extracted, etc.) — not silently deleted.

### Key Entities

- **PlayerProfileResponse**: New shared type. Represents the full player profile API response (user fields + player fields + contact + invitedGuests). Replaces `ProfileData` in frontend.
- **UpdatePlayerProfilePayload**: New shared type. Represents the validated set of fields a player can submit to update their own profile. Replaces the anonymous inline `data` type in `ProfileService.updateProfile` and `Record<string, unknown>` in `useProfile.ts`.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Running `tsc --noEmit` across all three packages produces zero errors after migration.
- **SC-002**: Zero occurrences of the raw string literals `"ACTIVE"`, `"INACTIVE"`, `"REGISTERED"`, `"GUEST"` remain in `packages/cms/src/services/ProfileService.ts` (all replaced with enum imports).
- **SC-003**: The local `ProfileData` interface in `packages/frontend/src/composables/useProfile.ts` no longer exists — replaced by an import from `@ministrosfc/shared`. The `updateProfile` function uses `UpdatePlayerProfilePayload` instead of `Record<string, unknown>`.
- **SC-004**: All `@TODO` type-sync comments in `ProfileService.ts` are resolved and removed.
- **SC-005**: All existing CMS and frontend tests pass after migration without changes to test assertions (only import paths may change).
- **SC-006**: Zero `@TODO` comments remain in `packages/frontend/src/components/profile/` after migration. All underlying issues are addressed in code.

---

## Assumptions

- Only the profile domain types (`PlayerProfileResponse`, `UpdatePlayerProfileInput`) and the raw enum literal replacements in `ProfileService.ts` are in scope. Other services (`GameService`, `PlayerService`, etc.) that may have similar issues are out of scope for this spec and will be addressed incrementally.
- `Prisma.PlayerWhereInput`, `Prisma.UserUpdateInput` and similar ORM-layer types are explicitly out of scope — they stay local to `packages/cms`.
- The `Record<string, unknown>` update accumulator objects inside `ProfileService.updateProfile` are out of scope (separate quality concern).
- No API behavior changes. This is purely a type-level refactor; request and response payloads remain identical.
- Frontend components that define their own prop interfaces (`ProfileEditForm.vue`, `ProfileHeader.vue`) ARE in scope: their prop types must adopt the `type Props = { ... }` pattern and use shared enum types (`PlayerStatus`, `UserRole`, `Position`) for typed fields.

---

## Out of Scope

- Migrating types for all other services (`GameService`, `PlayerService`, `AuthService`, etc.) — incremental follow-up
- Replacing `Record<string, unknown>` accumulators inside `ProfileService.updateProfile` with Prisma input types
- Adding shared types for game, tournament, or statistics API responses
- ESLint rule to enforce `no-restricted-imports` (future tooling hardening)
- Any changes to API payloads or database schema
- Frontend components outside `components/profile/` (out of scope for this spec)
