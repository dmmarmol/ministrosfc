# Tasks: 011 — Centralize Shared Types in @ministrosfc/shared

**Branch**: `chore/011-shared-types-migration`
**Input**: [plan.md](plan.md) · [spec.md](spec.md) · [data-model.md](data-model.md) · [research.md](research.md) · [quickstart.md](quickstart.md)

---

## Phase 1: Setup (Shared Types — Blocks All Consumer Changes)

**Purpose**: Add `PlayerProfileResponse` and `UpdatePlayerProfilePayload` to `@ministrosfc/shared`. No consumer package may be updated until this phase is complete and `tsc --noEmit` passes in `packages/shared`.

**Note**: `packages/shared/src/index.ts` requires no change — `api.ts` is already re-exported via `packages/shared/src/types/index.ts`.

- [ ] T001 Add `PlayerProfileResponse` and `UpdatePlayerProfilePayload` interfaces to `packages/shared/src/types/api.ts` (see exact shapes in data-model.md; requires adding `import { PlayerStatus, PlayerType, Position } from "./player"` and `import { UserRole } from "./user"` at top of file)
- [ ] T002 Verify shared package compiles: run `tsc --noEmit` in `packages/shared` — must pass with zero errors before proceeding

**Checkpoint**: `packages/shared` clean ✓ — consumer packages can now be updated

---

## Phase 2: User Story 1 — Compile-Time Contract Enforcement (Priority: P1) 🎯

**Goal**: Both packages reference the same `PlayerProfileResponse` contract; a breaking CMS type change causes tsc to fail in both packages simultaneously.

**Independent Test**: Rename `jerseyNumber` → `jersey` in the `player` block of `PlayerProfileResponse` in `packages/shared/src/types/api.ts`. Run `tsc --noEmit` in `packages/cms` AND `packages/frontend` — both must fail.

- [ ] T003 [P] [US1] Update `packages/cms/src/services/ProfileService.ts`: add import of `PlayerStatus`, `PlayerType`, `PlayerProfileResponse`, `UpdatePlayerProfilePayload` from `@ministrosfc/shared`; annotate `getProfile` return type as `Promise<PlayerProfileResponse>`; replace `data` param type in `updateProfile` with `UpdatePlayerProfilePayload`; replace all 6 raw string literals with enum values (`"GUEST"` → `PlayerType.GUEST`, `"ACTIVE"` → `PlayerStatus.ACTIVE` ×2, `"INACTIVE"` → `PlayerStatus.INACTIVE`, `"REGISTERED"` → `PlayerType.REGISTERED` ×2); remove both `@TODO` comments (covers FR-003, FR-004, FR-006, FR-007, FR-012)
- [ ] T004 [P] [US1] Update `packages/frontend/src/composables/useProfile.ts`: add import of `PlayerProfileResponse` and `UpdatePlayerProfilePayload` from `@ministrosfc/shared`; delete the `export interface ProfileData { ... }` block (lines 6–40); replace all 4 `ProfileData` references with `PlayerProfileResponse` (`ref<>`, two `$fetch<>` generics); change `updateProfile(data: Record<string, unknown>)` param to `updateProfile(data: UpdatePlayerProfilePayload)` (covers FR-005, FR-013)

**Checkpoint**: US1 independently testable — compile-time drift detection works ✓

---

## Phase 3: User Story 2 — Enum Imports in Frontend Components (Priority: P1)

**Goal**: `ProfileEditForm.vue` and `ProfileHeader.vue` use `PlayerStatus`, `Position`, and `UserRole` from `@ministrosfc/shared` instead of raw string literals. Both adopt the `type Props = { ... }` component prop pattern.

**Independent Test**: Rename `PlayerStatus.ACTIVE` → `PlayerStatus.ACTIVO` in `packages/shared/src/types/player.ts`. Run `tsc --noEmit` in `packages/frontend` — `ProfileEditForm.vue` and `ProfileHeader.vue` must both fail.

- [ ] T005 [P] [US2] Update `packages/frontend/src/components/profile/ProfileEditForm.vue`: add import of `PlayerStatus` and `Position` from `@ministrosfc/shared`; replace inline `defineProps<{...}>()` with `type Props = { profile: ProfileFields; takenJerseys: number[]; loading: boolean; error: string }` + `const props = defineProps<Props>()`; update `ProfileFields` so `position` is `Position | ""` and `status` is `PlayerStatus`; replace `"ACTIVE"` / `"INACTIVE"` string literals with `PlayerStatus.ACTIVE` / `PlayerStatus.INACTIVE` in reactive defaults, watch handler, and `isActive` computed; remove `@TODO` comment (line 6) (covers FR-014)
- [ ] T006 [P] [US2] Update `packages/frontend/src/components/profile/ProfileHeader.vue`: add import of `UserRole` and `PlayerStatus` from `@ministrosfc/shared`; replace inline `defineProps<{...}>()` with `type Props = { firstName: string; lastName: string; role: UserRole; status: PlayerStatus; photoUrl: string | null; createdAt: string }` + `const props = defineProps<Props>()`; update `roleBadgeClass` computed to key on `UserRole.ADMIN`, `UserRole.EDITOR`, `UserRole.DT`, `UserRole.PLAYER`; update `statusBadgeClass` to compare `props.status === PlayerStatus.ACTIVE`; remove both `@TODO` comments (lines 4 and 28) (covers FR-015)

**Checkpoint**: US2 independently testable — IDE enum rename cascades to all frontend components ✓

---

## Phase 4: User Story 3 — Convention for Future Features (Priority: P2)

**Goal**: Pattern established for future specs; all `@TODO` comments in `components/profile/` resolved. `InvitedGuestsList.vue`'s date formatting extracted into a reusable utility.

**Independent Test**: Review `packages/shared/src/types/api.ts` — `PlayerProfileResponse` and `UpdatePlayerProfilePayload` serve as the model for future cross-package types. Zero `@TODO` comments remain in `packages/frontend/src/components/profile/`.

- [ ] T007 [US3] Create `packages/frontend/src/utils/formatDate.ts` — extract the date formatting function from `packages/frontend/src/components/profile/InvitedGuestsList.vue` into this new utility file; export a named function `formatDate(dateString: string, locale?: string): string`
- [ ] T008 [US3] Update `packages/frontend/src/components/profile/InvitedGuestsList.vue`: import `formatDate` from `~/utils/formatDate`; replace the inline date formatting logic with the imported utility; remove `@TODO` comment (covers FR-016 for InvitedGuestsList.vue)

**Checkpoint**: US3 independently testable — zero `@TODO` comments in `components/profile/`, `formatDate` utility exists and is used ✓

---

## Phase 5: Polish & Verification

**Purpose**: Cross-cutting final validation; confirm all success criteria from quickstart.md pass.

- [ ] T009 [P] Run full verification suite from `quickstart.md`: `tsc --noEmit` across all three packages (SC-001); `grep` check for zero raw literals in `ProfileService.ts` (SC-002); `grep` check that `ProfileData` no longer declared in `useProfile.ts` (SC-003); `grep` check that `@TODO` type comments removed from `ProfileService.ts` (SC-004); run `npm test` in `packages/cms` and `packages/frontend` (SC-005); `grep` check for zero `@TODO` in `components/profile/` (SC-006)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (US1)**: Depends on Phase 1 — T003 and T004 can run **in parallel** after T001+T002
- **Phase 3 (US2)**: Depends on Phase 1 — T005 and T006 can run **in parallel** after T001+T002 (also independent of Phase 2)
- **Phase 4 (US3)**: Depends only on Phase 1 (T007 creates a new file; T008 depends on T007)
- **Phase 5 (Polish)**: Depends on all phases complete

### Task-Level Dependency Graph

```
T001 → T002 ──┬── T003 [P]
              ├── T004 [P]
              ├── T005 [P]
              ├── T006 [P]
              └── T007 → T008
                              └── T009
```

### Parallel Execution After Phase 1

Once T001 and T002 complete, all of T003, T004, T005, T006, T007 can start in parallel (they touch different files in different packages).

---

## Parallel Example: After Phase 1

```bash
# All of these can run simultaneously after T002 passes:
T003: packages/cms/src/services/ProfileService.ts
T004: packages/frontend/src/composables/useProfile.ts
T005: packages/frontend/src/components/profile/ProfileEditForm.vue
T006: packages/frontend/src/components/profile/ProfileHeader.vue
T007: packages/frontend/src/utils/formatDate.ts  (then T008 sequentially)
```

---

## Implementation Strategy

### MVP (US1 Only)

1. Complete Phase 1: Add shared types + verify
2. Complete T003 and T004 (US1)
3. **Validate**: Rename a field in `PlayerProfileResponse` in shared → both packages must fail tsc
4. Revert the rename, confirm clean compile

### Full Delivery (Incremental)

1. Phase 1 → `packages/shared` clean
2. T003 + T004 in parallel → US1 done
3. T005 + T006 in parallel → US2 done
4. T007 → T008 → US3 done
5. T009 → all SC criteria pass
