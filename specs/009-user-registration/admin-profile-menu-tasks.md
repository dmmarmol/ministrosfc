# Tasks: Admin Button Profile Menu

**Input**: Current authenticated navigation in `packages/frontend/src/components/common/Navigation.vue`, admin layout in `packages/frontend/src/layouts/admin.vue`, user profile route in `packages/frontend/src/pages/profile.vue`, player profile route in `packages/frontend/src/pages/players/[id].vue`, and auth payload/store shape in `packages/cms/src/services/AuthService.ts` and `packages/frontend/src/stores/auth.ts`

**Scope**: Replace the current top-nav `Admin` link with a popover menu that shows `Perfil de Usuario`, `Perfil de Jugador` when the authenticated user has a linked player, and `Cerrar sesión` separated by a divider.

**Assumption**: The top-nav `Admin` button is intentionally repurposed as the menu trigger, and direct access to admin pages remains available through existing `/admin/*` routes and the admin sidebar.

**Tests**: Not included in this task set because the request did not require a TDD pass.

## Phase 1: Foundational

**Purpose**: Expose enough authenticated user data in the frontend to build the conditional player-profile link without relying on an extra request.

- [x] T052 Update auth response user shape to include optional `playerId` in `packages/shared/src/types/user.ts`, `packages/cms/src/services/AuthService.ts`, and `packages/frontend/src/stores/auth.ts`
- [x] T053 Persist and hydrate optional `playerId` in frontend auth state/local storage handling in `packages/frontend/src/stores/auth.ts` and `packages/frontend/src/pages/auth/google/callback.vue`

**Checkpoint**: Authenticated frontend state exposes `user.playerId` when the logged-in user is linked to a player record.

---

## Phase 2: User Story 1 - Open Menu and Reach User Profile (Priority: P1)

**Goal**: Clicking the current `Admin` button opens a menu instead of navigating immediately, and the user can reach `/profile` from that menu.

**Independent Test**: Log in as an editor/admin user, click `Admin` in the top navigation, confirm the popover opens, and select `Perfil de Usuario` to navigate to `/profile`.

- [x] T054 [US1] Create a reusable authenticated popover menu component in `packages/frontend/src/components/common/AdminProfileMenu.vue` with trigger button, menu panel, item styling, close-on-outside-click, and close-on-selection behavior
- [x] T055 [US1] Replace the plain `Admin` `NuxtLink` in `packages/frontend/src/components/common/Navigation.vue` with the new menu trigger and add a `Perfil de Usuario` item pointing to `/profile`
- [x] T056 [US1] Keep the current authenticated/editor visibility rules intact for the trigger in `packages/frontend/src/components/common/Navigation.vue` so the menu only appears where the existing `Admin` entry appears today

**Checkpoint**: The top-nav `Admin` control opens a menu and the user profile page is reachable from it.

---

## Phase 3: User Story 2 - Reach Player Profile and Log Out (Priority: P1)

**Goal**: Users with a linked player record see a player-profile entry, and the menu also offers logout separated by a divider.

**Independent Test**: Log in as a user with `playerId`, click `Admin`, verify `Perfil de Jugador` appears and routes to `/players/{id}`; verify a divider separates logout and that `Cerrar sesión` clears auth state.

- [x] T057 [US2] Add a conditional `Perfil de Jugador` item in `packages/frontend/src/components/common/AdminProfileMenu.vue` that renders only when `authStore.user.playerId` exists and links to `'/players/' + playerId`
- [x] T058 [US2] Add a visual divider and `Cerrar sesión` action to `packages/frontend/src/components/common/AdminProfileMenu.vue` and wire the action to `authStore.logout()` from `packages/frontend/src/components/common/Navigation.vue`
- [x] T059 [US2] Ensure the menu closes cleanly after logout and the top navigation falls back to the unauthenticated state in `packages/frontend/src/components/common/Navigation.vue`

**Checkpoint**: Player-linked users can reach both profile destinations and logout from the same popover.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Align the final interaction with existing UI conventions and avoid leaving edge-case gaps.

- [x] T060 [P] Align final labels and interaction copy with the existing Spanish navigation style in `packages/frontend/src/components/common/AdminProfileMenu.vue` and `packages/frontend/src/components/common/Navigation.vue`
- [x] T061 Ensure the menu supports keyboard dismissal (`Escape`) and returns focus to the trigger after close in `packages/frontend/src/components/common/AdminProfileMenu.vue`
- [ ] T062 Run manual validation for both cases in `packages/frontend/src/components/common/Navigation.vue`: editor/admin without `playerId` and editor/admin with `playerId`

---

## Dependencies & Execution Order

- **Phase 1**: Must complete first because `Perfil de Jugador` depends on `playerId` being available in frontend auth state.
- **Phase 2**: Depends on Phase 1.
- **Phase 3**: Depends on Phase 1 and Phase 2.
- **Phase 4**: Depends on the menu behavior from Phases 2 and 3 being in place.

## Parallel Opportunities

- `T052` and `T054` can be worked in parallel once the team agrees the menu will rely on auth-carried `playerId` rather than a lazy `/profile` fetch.
- `T060` can run in parallel with `T061` after `T057` and `T058` are implemented.

## Suggested MVP Scope

1. Complete `T052` to `T056` for a working `Perfil de Usuario` menu entry.
2. Add `T057` to `T059` once player-linked auth state is confirmed in manual validation.
