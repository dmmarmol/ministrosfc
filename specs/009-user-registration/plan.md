# Implementation Plan: User Registration & Sign-In

**Branch**: `feature/user-registration` | **Date**: 2026-03-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/009-user-registration/spec.md`

## Summary

Add user self-registration (email + Google OAuth), a new DT role, user profile page, and admin role-management UI. Requires Prisma migrations (User: split `name` → `firstName`/`lastName`, add `googleSubjectId`, make `passwordHash` nullable; Role enum: add `DT`), new/modified CMS endpoints (register with Player auto-creation, Google OAuth callback, profile CRUD, role management), and new frontend pages (login page redesign with sign-up toggle + Google button, profile page with jersey SVG, admin user management).

## Technical Context

**Language/Version**: TypeScript 5 (strict mode, both packages)
**Primary Dependencies**: Express 4, Prisma 5, Zod v4, Nuxt 3.21, Vue 3.5, Pinia, Tailwind CSS, `google-auth-library` (new — Google OAuth)
**Storage**: PostgreSQL (Prisma ORM) + Redis (JWT refresh tokens, search cache) + Cloudinary (S3-compatible photo storage)
**Testing**: Vitest (CMS new files per constitution §Testing; Jest in legacy), Vitest (frontend), Playwright (E2E)
**Target Platform**: Node.js 18+ (CMS on port 5102), Nuxt 3 SSR/SPA (frontend on port 5103)
**Project Type**: REST web service (CMS) + Nuxt frontend (admin panel + player-facing pages)
**Performance Goals**: Registration/login < 300ms p95; profile CRUD < 200ms p95; Google OAuth round-trip < 2s (excluding Google consent screen)
**Constraints**: TDD; TypeScript strict; 80% coverage on new code; explicit imports in Nuxt files; `useRuntime()` composable for client/server branching; all UI labels in Spanish
**Scale/Scope**: ~50 players, ~100 total users; admin team 2–5; single-tenant

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate                                       | Status             | Notes                                                                                       |
| ------------------------------------------ | ------------------ | ------------------------------------------------------------------------------------------- |
| Spec-first (Principle II)                  | ✅ PASS            | `spec.md` complete: 30 FRs, 3 user stories, acceptance criteria, edge cases, clarifications |
| Plan-driven implementation (Principle III) | ✅ PASS            | This plan covers API design, schema migrations, component hierarchy, state management       |
| TDD mandate (Principle IV)                 | ✅ PASS (required) | Tests written before implementation; acceptance criteria map to test cases                  |
| TypeScript strict                          | ✅ PASS (required) | All new code strict-typed; no `as any` escapes                                              |
| `useRuntime()` composable                  | ✅ PASS (required) | No direct `import.meta.client/server` in frontend source                                    |
| Explicit imports in Nuxt files             | ✅ PASS (required) | All composable/store/component imports explicit                                             |
| 80% coverage on new code                   | ✅ PASS (required) | Unit + integration + E2E coverage                                                           |
| No new major dependencies w/o review       | ⚠️ JUSTIFIED       | `google-auth-library` (Google official library) required for FR-008–FR-011; no alternative  |
| Single-responsibility components           | ✅ PASS            | Each new component has a single purpose (see project structure)                             |
| Unidirectional data flow (Principle VI)    | ✅ PASS            | Server is source of truth; profile changes POST → wait → update UI                          |

## Project Structure

### Documentation (this feature)

```text
specs/009-user-registration/
├── plan.md              # This file
├── research.md          # Phase 0 output ✅
├── data-model.md        # Phase 1 output ✅
├── quickstart.md        # Phase 1 output ✅
├── contracts/
│   ├── auth-registration-contract.md   # Phase 1 ✅
│   ├── google-oauth-contract.md        # Phase 1 ✅
│   ├── profile-contract.md             # Phase 1 ✅
│   └── role-management-contract.md     # Phase 1 ✅
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
packages/cms/
├── prisma/
│   ├── schema.prisma                              # MODIFY: User fields, Role enum, relations
│   └── migrations/
│       ├── <ts>_split_user_name_fields/           # NEW: name → firstName + lastName
│       └── <ts>_add_dt_role_google_auth/          # NEW: DT role, googleSubjectId, nullable password
├── src/
│   ├── config/
│   │   └── auth.ts                                # MODIFY: add Google OAuth config vars
│   ├── models/
│   │   ├── User.ts                                # MODIFY: firstName/lastName, googleSubjectId
│   │   └── Player.ts                              # MODIFY: update name references
│   ├── services/
│   │   ├── AuthService.ts                         # MODIFY: register creates Player, Google OAuth flow
│   │   ├── UserService.ts                         # MODIFY: firstName/lastName, role management
│   │   └── ProfileService.ts                      # NEW: profile CRUD for authenticated users
│   ├── routes/
│   │   ├── auth.ts                                # MODIFY: update register schema, add Google callback
│   │   ├── profile.ts                             # NEW: authenticated user profile endpoints
│   │   └── users.ts                               # NEW: admin user management (role promote/demote)
│   ├── middleware/
│   │   ├── rbac.ts                                # MODIFY: add DT role to hierarchy
│   │   └── auth.ts                                # MODIFY: add DT to JwtPayload type
│   └── utils/
│       └── object-storage.ts                      # MODIFY: generalize upload for profile photos
└── tests/
    ├── unit/
    │   ├── AuthService.test.ts                    # MODIFY: register + Google OAuth cases
    │   ├── ProfileService.test.ts                 # NEW: profile CRUD cases
    │   └── UserService.test.ts                    # MODIFY: role management cases
    └── integration/
        ├── auth-register.test.ts                  # NEW: registration endpoint tests
        ├── google-oauth.test.ts                   # NEW: Google OAuth flow tests
        ├── profile.test.ts                        # NEW: profile endpoint tests
        └── role-management.test.ts                # NEW: role promote/demote tests

packages/frontend/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.vue                      # NEW: extracted sign-in form
│   │   │   ├── RegisterForm.vue                   # NEW: sign-up form
│   │   │   └── GoogleSignInButton.vue             # NEW: Google OAuth button
│   │   ├── profile/
│   │   │   ├── ProfileHeader.vue                  # NEW: photo + name display
│   │   │   ├── ProfileEditForm.vue                # NEW: editable profile fields
│   │   │   ├── JerseySvg.vue                      # NEW: jersey number SVG display
│   │   │   └── InvitedGuestsList.vue              # NEW: guests this user invited
│   │   └── admin/
│   │       └── UserRoleManager.vue                # NEW: role promote/demote UI
│   ├── pages/
│   │   ├── login.vue                              # MODIFY: redesign with toggle + Google
│   │   ├── profile.vue                            # NEW: authenticated user profile
│   │   └── admin/
│   │       └── users/
│   │           └── index.vue                      # NEW: admin user management
│   ├── stores/
│   │   └── auth.ts                                # MODIFY: firstName/lastName, DT role, register action
│   └── composables/
│       └── useProfile.ts                          # NEW: profile data fetching/mutation
└── tests/
    ├── unit/
    │   ├── LoginForm.test.ts                      # NEW
    │   ├── RegisterForm.test.ts                   # NEW
    │   ├── ProfileEditForm.test.ts                # NEW
    │   └── JerseySvg.test.ts                      # NEW
    └── e2e/
        ├── registration.spec.ts                   # NEW: full registration E2E
        └── profile.spec.ts                        # NEW: profile edit E2E
```

**Structure Decision**: Existing monorepo with `packages/cms` (Express API) and `packages/frontend` (Nuxt 3 SPA). New files follow established patterns: models/services/routes in CMS, components/pages/stores in frontend.

## Complexity Tracking

| Violation                             | Why Needed                                               | Simpler Alternative Rejected Because                                                |
| ------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| New dependency: `google-auth-library` | Google OAuth (FR-008–FR-011) requires token verification | Manual JWT decode is insecure; Google's library handles key rotation and validation |

## Post-Design Constitution Re-Check

All gates still pass after Phase 1 design. One new dependency (`google-auth-library`) is justified and documented above. No new abstractions beyond what the spec requires. Migrations are isolated (two migrations: name split + enum/Google fields). All new frontend pages use `useRuntime()` and explicit imports per constitution mandate.
