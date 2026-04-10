# Implementation Plan: Game Signup Invitation — Wave 3 (014)

**Branch**: `chore/014-game-signup-invitation` | **Date**: 2026-04-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/014-game-signup-invitation/spec.md` (Wave 3 amendment: US-10, US-11, FR-036–FR-041)

## Summary

Wave 3 is a **frontend-only** UX overhaul of the Game Sign Up Page. It replaces the inline proxy-search and guest-form embedded in `SignupRegistrationRow` with a new self-contained `SignupAddPlayer` component that uses `DropdownAddMore` for player selection and switches to a standalone guest form via `v-if/v-else`. The page outer wrapper loses its `max-w-2xl` constraint and expands to full browser width. `SignupProxySearch.vue` is deleted. No DB migrations, no CMS changes, no new API endpoints.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Nuxt 3, Vue 3 Composition API, Tailwind CSS, vue-select (via `DropdownAddMore`), Vitest
**Storage**: N/A — Wave 3 is frontend-only; existing CMS endpoints unchanged
**Testing**: Vitest + Vue Test Utils (`@vue/test-utils`)
**Target Platform**: Nuxt 3 SPA/SSR hybrid, desktop ≥768 px and mobile
**Project Type**: Web application (frontend package only)
**Performance Goals**: No new network requests beyond existing — player catalogue fetch is single call on component mount
**Constraints**: No new shared types; no new CMS endpoints; no migrations; `DropdownAddMore` used as-is without modification
**Scale/Scope**: 1 new component, 3 modified files, 1 deleted file

## Constitution Check

_GATE: Evaluated against constitution v1.8.0. Re-checked after Phase 1 design — all gates pass._

- [x] **Shared types gate (Principle VII)**: No new cross-package types. `PlayerPublic`, `GuestSignupDTO`, `ProxySignupDTO`, `CurrentPlayerStatus`, `Position`, `PositionDisplayName` are already in `@ministrosfc/shared`. `DropdownOption` is explicitly frontend-only. No new shared type required for Wave 3.
- [x] **Page decomposition gate (Principle V)**: `signup.vue` remains a routing-entry-only page. New component `SignupAddPlayer.vue` is extracted to `components/pages/games/signup/` per constitution convention. `SignupRegistrationRow.vue` is simplified but already correctly placed. No constitution violation.
- [x] **Page meta declaration gate (Principle V)**: `signup.vue` already has `definePageMeta({ middleware: "auth", requiresAuth: true })`. No new pages introduced in Wave 3. Gate trivially passes.

## Project Structure

### Documentation (this feature)

```text
specs/014-game-signup-invitation/
├── plan.md              ← this file (Wave 3 plan)
├── research.md          ← updated with Wave 3 decisions (Phase 0)
├── data-model.md        ← updated with Wave 3 component model (Phase 1)
├── quickstart.md        ← updated with Wave 3 dev guide (Phase 1)
├── contracts/           ← unchanged (no new API endpoints)
└── tasks.md             ← Phase 18 tasks already written
```

### Source Code (repository root)

```text
packages/frontend/
├── src/
│   ├── pages/
│   │   └── games/[slug]/
│   │       └── signup.vue                        MODIFY: remove max-w-2xl; add SignupAddPlayer; wire proxyLoading/proxyError props
│   ├── components/
│   │   └── pages/games/signup/
│   │       ├── SignupAddPlayer.vue                NEW: v-if dropdown mode / v-else guest form mode
│   │       ├── SignupRegistrationRow.vue          MODIFY: remove guest form + proxy section; remove signup-guest/signup-proxy emits
│   │       └── SignupProxySearch.vue              DELETE: superseded by SignupAddPlayer
│   └── tests/ (or tests/ at package root)
│       └── components/pages/games/signup/
│           └── SignupAddPlayer.spec.ts            NEW: Vitest tests (T078, written first)
```

## Complexity Tracking

No constitution violations. No complexity justification needed.

---

## Phase 0: Research (Complete)

See [research.md](./research.md) — Wave 3 section. All four unknowns resolved:

| Unknown                                | Resolution                                                                  |
| -------------------------------------- | --------------------------------------------------------------------------- |
| DropdownAddMore slot vs. v-if/v-else   | `v-if/v-else` — slot is scoped inside VSelect dropdown, cannot replace root |
| Player list fetch timing               | Eagerly on `onMounted` inside `SignupAddPlayer`                             |
| DropdownOption shape and type location | Inline mapping in `SignupAddPlayer`; no shared type needed                  |
| Loading/error state contract           | Parent owns `proxyLoading` + `proxyError` refs; passed as props to child    |

---

## Phase 1: Design & Contracts (Complete)

### Data Model

No new DB entities. See [data-model.md](./data-model.md) — Wave 3 section for:

- `SignupAddPlayer` props, emits, internal state, computed refs
- `SignupRegistrationRow` diffs (removals)
- `signup.vue` diffs (layout + new state + new import)
- Deletion of `SignupProxySearch.vue`

### Contracts

No new API endpoints. Existing endpoints used:

- `GET /api/v1/players?status=ACTIVE&playerType=REGISTERED` — player catalogue for dropdown
- `POST /api/v1/games/:gameId/participants` (proxy mode via `signupProxy`) — unchanged
- `POST /api/v1/games/:gameId/participants` (guest mode via `signupGuest`) — unchanged

### Quickstart

See [quickstart.md](./quickstart.md) — Wave 3 section.

---

## Implementation Design

### Component: `SignupAddPlayer.vue`

**Mode switching**: `const mode = ref<'dropdown' | 'guest'>('dropdown')`.

```
mode === 'dropdown':
  ─ Render <DropdownAddMore> with options=dropdownOptions, disabled=proxyLoading, loading=fetchLoading
  ─ @select → emit('signup-proxy', option.id)
  ─ labels.addNew = "Agregar invitado"
  ─ When the user clicks "Agregar invitado" (inside list-footer of DropdownAddMore),
    the click handler calls mode.value = 'guest'
    NOTE: DropdownAddMore's open_create is internal — we do NOT use the inline-create slot.
    Instead, we intercept the "Agregar invitado" button click by providing an onCreate prop
    that sets mode to 'guest' and rejects (never completes), OR we use a custom labels.addNew
    footer without the slot at all. SIMPLEST: pass onCreate that throws, handle the switch
    in a @vue:error boundary — too complex.
    ───
    BEST APPROACH: Do NOT use DropdownAddMore's built-in "Agregar invitado" for this purpose.
    Instead, render a plain button "Agregar invitado" BELOW the DropdownAddMore (outside it,
    inside the box). Clicking it sets mode = 'guest'. This avoids all slot complexity and
    gives full control over placement — including the box-level × button placement.

mode === 'guest':
  ─ Render guest form (firstName, lastName, position select, submit button)
  ─ Show × button at absolute top-right of container
  ─ Clicking × → mode.value = 'dropdown', clear form fields
  ─ Submit → validate → emit('signup-guest', ...)
  ─ Show proxyError (reused) or local guestError
```

**Revised DropdownAddMore usage**: `labels.addNew` footer is suppressed by not triggering the `inline-create` slot. Use `DropdownAddMore` purely as a searchable player selector. The "Agregar invitado" mode switch is a button rendered outside `DropdownAddMore`, below it, inside the `SignupAddPlayer` box.

**Key template structure**:

```html
<div class="relative bg-white border border-gray-200 rounded-xl p-4 mb-4">
  <!-- Guest-mode: × at top-right of box -->
  <button
    v-if="mode === 'guest'"
    @click="cancelGuest"
    class="absolute top-3 right-3 ..."
  >
    ×
  </button>

  <template v-if="mode === 'dropdown'">
    <DropdownAddMore
      v-model="selectedPlayerId"
      :options="dropdownOptions"
      :disabled="proxyLoading || fetchLoading"
      :loading="fetchLoading"
      :onCreate="noopCreate"
      :labels="{ addNew: '' }"
      @select="onPlayerSelected"
    />
    <!-- "Add guest" trigger outside DropdownAddMore -->
    <button @click="mode = 'guest'" class="mt-2 text-sm text-gray-500 ...">
      + Agregar invitado
    </button>
    <p v-if="proxyError" class="text-xs text-red-600 mt-2">{{ proxyError }}</p>
  </template>

  <template v-else>
    <!-- Guest form -->
    <input v-model="guestFirst" placeholder="Nombre" required />
    <input v-model="guestLast" placeholder="Apellido" required />
    <select v-model="guestPosition">
      ...
    </select>
    <button @click="submitGuest">Agregar</button>
    <p v-if="guestError" class="text-xs text-red-600">{{ guestError }}</p>
  </template>
</div>
```

> **Note**: `onCreate` is required by `DropdownAddMore` but not used here. Pass a no-op that returns a rejected promise; the button is suppressed by passing `labels.addNew = ''` (empty string hides the footer button text) or by CSS. Alternatively, pass `labels.addNew = undefined` — check template: `addNewLabel` defaults to "Agregar nueva..." — just pass empty string or a zero-width space to visually hide it.

### `signup.vue` Layout Change

```html
<!-- BEFORE -->
<div class="max-w-2xl mx-auto">
  <!-- AFTER -->
  <div><!-- or <div class="w-full"> --></div>
</div>
```

Right panel (inside `md:col-span-6`):

```html
<!-- 1. Self CTA -->
<SignupRegistrationRow
  v-if="game?.status === GameStatus.SCHEDULED && authStore.user?.role === UserRole.PLAYER"
  :current-player-status="currentPlayerStatus"
  :is-full="isFull"
  @signup-self="handleSignupSelf"
  @cancel-self="handleCancelSelf"
  @dismiss="() => {}"
/>

<!-- 2. Add player widget -->
<SignupAddPlayer
  v-if="game?.status === GameStatus.SCHEDULED && currentPlayerStatus === 'signed_up' && authStore.user?.role === UserRole.PLAYER && !isFull"
  :confirmed-player-ids="confirmedPlayerIds"
  :proxy-loading="proxyLoading"
  :proxy-error="proxyError"
  :is-full="isFull"
  @signup-proxy="handleSignupProxy"
  @signup-guest="handleSignupGuest"
/>

<!-- 3. Roster table -->
<SignupPlayerTable ... />
```

> **confirmedPlayerIds** computed: `computed(() => roster.value.map(r => r.player.id))`

---

## Constitution Check (Post-Design)

Re-evaluated after Phase 1 design:

- [x] **Principle V (decomposition)**: `SignupAddPlayer` as a dedicated page-scoped component is exactly the right decomposition. `signup.vue` stays lean.
- [x] **Principle V (page meta)**: No new pages.
- [x] **Principle VII (shared types)**: Confirmed — no new shared types needed. `DropdownOption` stays frontend-only.
- [x] **Principle VI (data flow)**: Parent owns `proxyLoading`/`proxyError`; child is stateless w.r.t. proxy lifecycle. Unidirectional.
- [x] **Principle IV (TDD)**: T078 (tests) written BEFORE T074 (implementation) per task ordering.

All gates pass. No violations to justify.
