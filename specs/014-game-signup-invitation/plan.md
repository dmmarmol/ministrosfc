# Implementation Plan: Wave 4 — maxPlayers Default + Confirmed Count Display (FR-043, FR-044)

**Branch**: `chore/014-game-signup-invitation` | **Date**: 2026-04-11 | **Spec**: [spec.md](./spec.md)
**Input**: Extended scope from `specs/014-game-signup-invitation/spec.md` — FR-043 and FR-044 only. All prior tasks (T001–T081) are already shipped on this branch.

## Summary

Two incremental frontend improvements to existing pages:

1. **FR-043** — The game creation form (`/admin/games/create`) gains a `maxPlayers` input pre-seeded with `DEFAULT_MAX_PLAYERS = 16` from `@ministrosfc/shared`. Clearing the field submits `null` (unlimited). The value is included in the `POST /api/v1/games` request body; no backend schema changes are required since `maxPlayers` is already accepted.

2. **FR-044** — Both the public `/games/{slug}` detail page and the `/games/{slug}/signup` page unify their confirmed-player section header to `"Confirmados (X/Y)"` / `"Confirmados (X)"` in a `flex justify-between` row. When the game is at capacity (`confirmedCount === maxPlayers`), a green Heroicons `CheckCircleIcon` (solid) and the label `"Equipo completo"` are shown at the far right. The signup page updates this reactively; the public detail page computes it from the fetched participant list.

No new API endpoints, no new shared types, no DB changes.

## Technical Context

**Language/Version**: TypeScript 5.3 / Vue 3.4 / Nuxt 3  
**Primary Dependencies**: `@ministrosfc/shared` (constants), `@heroicons/vue` (icon — **not yet installed**)  
**Storage**: N/A (read-only display changes + existing `maxPlayers` write path)  
**Testing**: Vitest (unit), Playwright e2e  
**Target Platform**: Web (SSR + CSR via Nuxt)  
**Project Type**: Web application (monorepo — frontend package only, one backend validation removal)  
**Performance Goals**: No new requests; purely computed/reactive changes  
**Constraints**: Must stay reactive on signup page without full refresh; public detail page is SSR-rendered

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- [x] **Shared types gate**: No new shared types needed. `DEFAULT_MAX_PLAYERS` already exists in `@ministrosfc/shared/src/constants/games.ts` and is already exported. No additions to shared package are required.
- [x] **Page decomposition gate**: No new pages introduced. Modified pages: `pages/admin/games/create.vue`, `pages/games/[slug]/index.vue`, `pages/games/[slug]/signup.vue`. The "Equipo completo" row is a small inline fragment — not complex enough to warrant extraction to a new component (single-use, 3 lines of markup).
- [x] **Page meta declaration gate**: No new `pages/` files; all existing pages already have `definePageMeta`.

**No gate violations.**

## Project Structure

### Documentation (this feature)

```text
specs/014-game-signup-invitation/
├── plan.md        ← this file (Wave 4 addendum)
├── research.md    ← existing, no update needed for this wave
├── data-model.md  ← existing, no update needed
├── quickstart.md  ← existing, no update needed
├── contracts/     ← existing, no update needed
└── tasks.md       ← to be appended by /speckit.tasks (Phase 19)
```

### Source Code

```text
packages/frontend/
├── package.json                                      ← add @heroicons/vue
├── src/
│   ├── components/pages/games/signup/
│   │   └── SignupPlayerTable.vue                     ← FR-044: update header + "Equipo completo"
│   ├── pages/
│   │   ├── admin/games/create.vue                    ← FR-043: add maxPlayers input
│   │   └── games/[slug]/
│   │       ├── index.vue                             ← FR-044: update header + "Equipo completo"
│   │       └── signup.vue                            ← FR-044: update header + "Equipo completo"
```

## Phase 0: Research

No unresolved unknowns. All decisions documented below.

### Research Findings

**R-1: @heroicons/vue availability and usage**

- Decision: Install `@heroicons/vue` as a frontend dependency.
- Rationale: Already referenced in `admin.vue` as a TODO (`<!-- @TODO add user icon from a library like Heroicons -->`). This wave is the natural moment to introduce it. The package provides tree-shakeable Vue 3 SVG icon components.
- Usage: `import { CheckCircleIcon } from "@heroicons/vue/24/solid"` — use the 24px solid variant for the "Equipo completo" indicator.
- Alternatives considered: Inline SVG string (rejected — harder to maintain, not consistent with intended Heroicons adoption). Using an emoji ✅ (rejected — inaccessible, not pixel-precise).

**R-2: Where the "Confirmados" header renders on each affected page**

| Page                                                  | Current location | Current string                                                            |
| ----------------------------------------------------- | ---------------- | ------------------------------------------------------------------------- |
| `pages/games/[slug]/index.vue`                        | lines ~163–166   | `Jugadores ({{ participants.length }})` — uses `<h2>`                     |
| `pages/games/[slug]/signup.vue`                       | lines ~217–221   | `Confirmados (X / Y)` — `<h3>`, `v-if game?.maxPlayers` for the `/Y` part |
| `components/pages/games/signup/SignupPlayerTable.vue` | lines ~33–36     | `Confirmados (X / Y)` — standalone `<h3>` in table component              |

All three locations need to become `flex justify-between` rows with the `CheckCircleIcon` + `"Equipo completo"` indicator on the right when full.

**R-3: isFull computation on the public detail page**

- The public `[slug]/index.vue` fetches participants separately from the game record. It has no `isFull` boolean from the API.
- Decision: Compute inline as `participants.length >= (game.maxPlayers ?? Infinity)` — no server change needed.
- `game.maxPlayers` is returned by `GET /api/v1/games/:id` (the field is already in the game response).

**R-4: `maxPlayers` in the create form POST body**

- The `gameCreateSchema` in `packages/cms/src/routes/games.ts` already accepts `maxPlayers: z.coerce.number().int().min(1).optional().nullable()`.
- The `GameService.createGame` DTO already has `maxPlayers?: number | null`.
- No backend changes needed — only the frontend form needs to be updated.

**R-5: Input type & clearing behaviour**

- Use `<input type="number" min="1" step="1">` with `v-model.number="form.maxPlayers"`.
- When cleared, `v-model.number` produces `NaN` on empty string in Vue. Coerce in submit: `maxPlayers: Number.isNaN(form.maxPlayers) ? null : form.maxPlayers`.
- The existing `edit.vue` already uses this same pattern (`v-model.number`, null coercion) — follow it exactly.

## Phase 1: Design & Contracts

No new contracts, no new data model additions. The existing API contract already documents `maxPlayers` as a nullable integer on the game create endpoint. No updates to `contracts/api.md` are needed for this wave.

### Component Design

#### FR-043 — `create.vue` form field

Add to the form `reactive` initial state:

```ts
import { DEFAULT_MAX_PLAYERS } from "@ministrosfc/shared";
// in reactive({ ... })
maxPlayers: DEFAULT_MAX_PLAYERS as number | null,
```

Add to `submit()` body construction:

```ts
maxPlayers: Number.isNaN(form.maxPlayers as any) ? null : (form.maxPlayers ?? null),
```

Template addition (alongside existing Tipo de Partido and Torneo fields):

```html
<div>
  <label class="block text-xs font-medium text-gray-700 mb-1"
    >Cupo máximo</label
  >
  <input
    v-model.number="form.maxPlayers"
    type="number"
    min="1"
    step="1"
    placeholder="Sin límite"
    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
  />
</div>
```

#### FR-044 — Confirmed header row pattern (shared between both pages)

The header row replaces the existing plain `<h2>`/`<h3>` in both pages:

```html
<div class="flex items-center justify-between mb-4">
  <h2 class="text-lg font-bold text-gray-800">
    Confirmados ({{ participants.length }}<span v-if="game?.maxPlayers">
      / {{ game.maxPlayers }}</span
    >)
  </h2>
  <div
    v-if="isTeamFull"
    class="flex items-center gap-1.5 text-green-600 text-sm font-medium"
  >
    <CheckCircleIcon class="w-5 h-5" />
    Equipo completo
  </div>
</div>
```

**`isTeamFull` per page:**

- `index.vue`: `computed(() => game.value?.maxPlayers != null && participants.value.length >= game.value.maxPlayers)`
- `signup.vue`: already has `isFull` from `useGameSignup` composable — use that directly

### Agent context

No agent-context update needed (no new technology beyond `@heroicons/vue`, which is the same vendor as the existing TODO comments already reference).

## Implementation Tasks (Wave 4 — Phase 19)

> Full task list to be generated by `/speckit.tasks`. The following is a preview of the task breakdown:

| #    | Task                                                                          | FR            | File(s)                 |
| ---- | ----------------------------------------------------------------------------- | ------------- | ----------------------- |
| T082 | Install `@heroicons/vue` in `packages/frontend`                               | FR-044        | `package.json`          |
| T083 | Add `maxPlayers` field to create game form with `DEFAULT_MAX_PLAYERS` default | FR-043        | `create.vue`            |
| T084 | Update public game detail page confirmed-player header (FR-044)               | FR-044        | `[slug]/index.vue`      |
| T085 | Update signup page confirmed-player header (FR-044) — reactive, uses `isFull` | FR-044        | `[slug]/signup.vue`     |
| T086 | Update `SignupPlayerTable.vue` confirmed-player header (FR-044 parity)        | FR-044        | `SignupPlayerTable.vue` |
| T087 | Add Wave 4 TDD coverage (unit + e2e) for FR-043/FR-044                        | FR-043/FR-044 | tests                   |

## Next Steps

After completing the plan, **MUST** output the following block to the user:

```
## Next Steps

**Recommended**: `/speckit.tasks` — generate the ordered task list from this plan.
```
