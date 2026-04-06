# Tasks: 010 — Reusable Jersey Number Input Component

**Branch**: `feat/010-jersey-number-input`
**Priority**: P3 (UX enhancement)

---

## Problem

The jersey number input is a plain `<input type="number">` in both the onboarding page and the profile edit form. Users only learn a number is taken **after** submitting (409 error). The profile edit form shows taken numbers as a flat comma-separated list (`Ocupados: 2, 5, 10, 11, 14`), which is hard to parse when many numbers are taken.

## Goal

Create a reusable `JerseyNumberInput.vue` component that:

1. Fetches taken jersey numbers from the API on mount
2. Shows **available** ranges below the input (e.g., "Disponibles: 1, 3, 15-32, 34-60, 62-99")
3. Shows inline validation (red border + message) when the user types a taken number
4. Works in both contexts: onboarding (unauthenticated-style, no excludeId) and profile edit (excludes current player's own number)

## Existing Infrastructure

- **API**: `GET /api/v1/profile/player/jersey-availability?exclude=:playerId` → `{ data: { taken: number[] } }` — already exists in `packages/cms/src/routes/profile.ts` and `ProfileService.ts`
- **Composable**: `useProfile().fetchJerseyAvailability(excludePlayerId?)` — already exists in `packages/frontend/src/composables/useProfile.ts`
- **Profile edit form**: `ProfileEditForm.vue` receives `takenJerseys` prop and shows "Ocupados: ..." hint
- **Onboarding**: `onboarding.vue` has a bare `<input type="number">` with no availability feedback
- **Shared util**: `isValidJerseyNumber(n)` in `packages/shared/src/utils/validation.ts`

---

## Phase 1: Foundational — Availability range utility

- [x] T001 [P] Create `formatAvailableRanges(taken: number[], min?: number, max?: number): string` utility in `packages/shared/src/utils/jersey.ts` that computes available numbers (1-99 minus taken), collapses consecutive numbers into ranges, and returns a display string like `"1, 3, 15-32, 34-60, 62-99"`
- [x] T002 [P] Add unit tests for `formatAvailableRanges` covering: empty taken list, all taken, sparse taken, consecutive gaps, single available numbers, boundary values (1 and 99) in `packages/shared/src/utils/__tests__/jersey.test.ts`
- [x] T003 Export `formatAvailableRanges` from `packages/shared/src/utils/jersey.ts` via `packages/shared/src/index.ts`

---

## Phase 2: Foundational — API access from onboarding context

The existing `fetchJerseyAvailability` lives inside `useProfile()` which requires auth headers. The onboarding page also has auth (user just registered), but couples fetching availability to the full profile composable.

- [x] T004 Extract a standalone `useJerseyAvailability` composable in `packages/frontend/src/composables/useJerseyAvailability.ts` that exposes `{ taken, available, loading, fetch(excludePlayerId?) }` and calls `GET /api/v1/profile/player/jersey-availability`
- [x] T005 Update `useProfile.ts` to delegate jersey fetching to `useJerseyAvailability` internally (no public API change for `fetchJerseyAvailability`) in `packages/frontend/src/composables/useProfile.ts`

---

## Phase 3: Reusable component

- [x] T006 Create `JerseyNumberInput.vue` in `packages/frontend/src/components/ui/JerseyNumberInput.vue` with:
  - Props: `modelValue: number | null`, `takenNumbers: number[]`, `disabled?: boolean`
  - Emits: `update:modelValue`
  - Template: number input (min=1, max=99) + hint text showing available ranges via `formatAvailableRanges` + inline error when current value is in `takenNumbers`
  - Uses `v-model` pattern for two-way binding
- [x] T007 [P] Add unit tests for `JerseyNumberInput.vue` covering: renders available ranges, shows error on taken number, emits update on input, handles empty taken list in `packages/frontend/tests/unit/components/JerseyNumberInput.test.ts`

---

## Phase 4: Integration — Onboarding page

- [x] T008 Import and wire `useJerseyAvailability` in `packages/frontend/src/pages/auth/onboarding.vue` to fetch taken numbers on mount
- [x] T009 Replace bare `<input type="number">` with `<JerseyNumberInput>` in `packages/frontend/src/pages/auth/onboarding.vue`, passing `takenNumbers` and binding `v-model` to `jerseyNumber`
- [x] T010 Disable "Continuar" button when selected jersey number is in the taken list in `packages/frontend/src/pages/auth/onboarding.vue`

---

## Phase 5: Integration — Profile edit form

- [x] T011 Replace bare `<input type="number">` and "Ocupados" hint with `<JerseyNumberInput>` in `packages/frontend/src/components/profile/ProfileEditForm.vue`, passing `takenJerseys` prop through
- [x] T012 Add inline save-button disable when selected jersey is taken in `packages/frontend/src/components/profile/ProfileEditForm.vue`

---

## Phase 6: Verification

- [x] T013 Verify onboarding shows "Disponibles: ..." under jersey input after selecting "Soy jugador"
- [x] T014 Verify profile edit page shows "Disponibles: ..." and highlights taken numbers
- [x] T015 Verify typing a taken number shows inline error in both onboarding and profile edit
- [x] T016 Verify submit is blocked client-side when a taken number is entered

---

## Dependencies & Execution Order

- **Phase 1** (T001-T003): starts immediately, no dependencies
- **Phase 2** (T004-T005): starts immediately, parallel with Phase 1
- **Phase 3** (T006-T007): depends on Phase 1 (needs `formatAvailableRanges`)
- **Phase 4** (T008-T010): depends on Phase 2 + Phase 3
- **Phase 5** (T011-T012): depends on Phase 3
- **Phase 6** (T013-T016): depends on Phase 4 + Phase 5

## Parallel Opportunities

- T001 + T002 (utility + tests)
- T004 + T005 (composable extraction, parallel with Phase 1)
- T006 + T007 (component + tests)
- Phase 4 + Phase 5 (independent integrations after Phase 3)

---

## Phase 7: Bonus UI Components (discovered during implementation)

- [x] T017 Create reusable `IsPlayerCheckbox.vue` in `packages/frontend/src/components/ui/IsPlayerCheckbox.vue` with `modelValue: boolean` prop, optional `label` and `description` props, and use it in `packages/frontend/src/components/auth/RegisterForm.vue` and `packages/frontend/src/pages/auth/onboarding.vue`
- [x] T018 Replace hand-rolled `JerseySvg.vue` with `soccer-jersey` npm package in `packages/frontend/src/components/profile/JerseySvg.vue`

---

## Phase 8: Bug Fixes — Profile Update Stale Response

**Root cause**: `ProfileService.updateProfile` called `ProfileService.getProfile(userId)` inside a `prisma.$transaction()` callback using the outer `prisma` client (not `tx`). With READ COMMITTED isolation, this reads pre-transaction data, returning the old values in the 200 OK response. The frontend `watch` then resets the form to those stale values.

- [x] T019 Fix stale PATCH response in `packages/cms/src/services/ProfileService.ts`: change `return prisma.$transaction(async (tx) => { ... return ProfileService.getProfile(userId) })` to `await prisma.$transaction(...)` and call `return ProfileService.getProfile(userId)` after the transaction closes, so the read sees committed data
- [x] T020 Sync jersey preview after save in `packages/frontend/src/pages/profile/player.vue`: after `await updateProfile(data)` completes, update `previewJerseyNumber` and `previewLastName` from the confirmed `profile.value` so the jersey SVG reflects the saved values
