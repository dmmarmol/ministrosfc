---
description: "Use when editing the frontend in packages/frontend and consuming backend API contracts from the monorepo. Covers using @ministrosfc/shared types, avoiding duplicated API DTOs, and keeping composables/pages aligned with CMS contracts."
applyTo:
  - "packages/frontend/src/**/*.ts"
  - "packages/frontend/src/**/*.vue"
---

# Frontend Shared Contract Instructions

- When frontend code consumes a backend request or response shape that is shared with CMS, import the named contract from `@ministrosfc/shared` instead of redefining it locally.
- Treat `packages/shared/src/types/` as the source of truth for cross-package DTOs, enums, and API payload shapes.
- Do not duplicate CMS request or response contracts inside composables, pages, or components.
- If a frontend-only view model is needed, derive it from the shared contract instead of replacing the shared contract with an ad hoc local type.
- When an API contract changes, verify the adjacent frontend consumers, especially composables under `packages/frontend/src/composables/` and admin pages under `packages/frontend/src/pages/admin/`.
- Keep transport concerns in composables and avoid scattering response-shape assumptions across unrelated components.
- For contract-related regressions, prefer updating or adding focused frontend tests where the repo already has coverage for that slice.
