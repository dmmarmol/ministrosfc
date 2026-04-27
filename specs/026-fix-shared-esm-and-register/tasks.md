# Tasks: 017 — Fix @ministrosfc/shared ESM & Deduplicate isPlayer

**Branch**: `fix/018-fix-shared-esm-and-register`
**Priority**: P0 (blocks all frontend pages importing from shared package)

---

## Problem 1: `exports is not defined` in browser

`@ministrosfc/shared` compiles to CommonJS (`module: "commonjs"` via `tsconfig.base.json`).
The package is symlinked into the workspace via npm workspaces. Vite excludes symlinked
packages from pre-bundling, so it serves the raw CJS `dist/index.js` to the browser as-is.
The browser has no `exports` global → every page that imports from `@ministrosfc/shared`
(RegisterForm via `PASSWORD_RULES`, onboarding via `Position`/`PositionDisplayName`) crashes
with `Uncaught ReferenceError: exports is not defined`, killing Vue event handlers on the
entire login page.

### Root Cause

- `packages/shared/tsconfig.json` extends `tsconfig.base.json` which sets `"module": "commonjs"`
- `packages/shared/package.json` has `"main": "dist/index.js"` (CJS entry only, no ESM `"module"` field)
- Vite resolves the symlink → reads `dist/index.js` → serves it unchanged
- `build.transpile` and `optimizeDeps.include` in `nuxt.config.ts` do not affect symlinked workspace packages in dev mode

### Fix

Add a Vite `resolve.alias` in `nuxt.config.ts` that points `@ministrosfc/shared` directly
at the TypeScript source (`../shared/src/index.ts`). Vite compiles `.ts` natively as ESM,
bypassing the CJS dist entirely.

## Problem 2: `isPlayer` checkbox duplicated

The "¿Eres un jugador del equipo?" checkbox appeared in both `RegisterForm.vue` and
`onboarding.vue`. Registration should only collect credentials; player-specific questions
belong in the onboarding step.

### Fix

Remove `isPlayer` from `RegisterForm.vue` (template, reactive state, emit payload) and from
the parent `login.vue` handler type. Update `auth.ts` store `register()` DTO to drop
`isPlayer`. The backend `registerSchema` already has `isPlayer: z.boolean().optional().default(true)`,
so omitting the field is safe.

---

## Phase 1: Fix shared package ESM resolution

- [x] T001 Add `vite.resolve.alias` mapping `@ministrosfc/shared` → `../shared/src/index.ts` in `packages/frontend/nuxt.config.ts`
- [x] T002 Add `build.transpile: ["@ministrosfc/shared"]` as fallback for production builds in `packages/frontend/nuxt.config.ts`
- [x] T003 Clear Vite cache (`node_modules/.vite`) and Nuxt cache (`.nuxt`) and verify `exports is not defined` error is gone in browser console

---

## Phase 2: Deduplicate isPlayer field

- [x] T004 Remove `isPlayer` from `form` reactive state, `emit` payload type, and checkbox template in `packages/frontend/src/components/auth/RegisterForm.vue`
- [x] T005 Remove `isPlayer` from `handleRegister` payload type in `packages/frontend/src/pages/login.vue`
- [x] T006 Remove `isPlayer` from `register()` DTO type in `packages/frontend/src/stores/auth.ts`
- [x] T007 Verify backend `registerSchema` in `packages/cms/src/routes/auth.ts` already has `isPlayer: z.boolean().optional().default(true)` — no API change needed

---

## Phase 3: Fix /player/games 500 (page does not exist)

- [x] T008 Replace `/player/games` redirect with `/` in `navigateAfterOnboarding()` in `packages/frontend/src/pages/auth/onboarding.vue`
- [x] T009 Replace `/player/games` redirect with `/` in auth middleware login-redirect branch in `packages/frontend/src/middleware/auth.ts`

---

## Phase 4: Verification

- [x] T010 Verify register form submits successfully without `isPlayer` field (API returns 201)
- [x] T011 Verify onboarding page loads and shows the `isPlayer` checkbox after registration
- [x] T012 Verify post-onboarding redirect goes to `/` for non-editor users (no 500)
- [ ] T013 Verify login → navigate works (no JS errors in console)
