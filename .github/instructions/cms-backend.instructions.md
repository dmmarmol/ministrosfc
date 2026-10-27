---
description: "Use when editing the TypeScript backend in packages/cms. Applies backend conventions for Express routes/controllers, Prisma models, services, middleware, shared API contracts, and CMS integration tests in the monorepo."
applyTo: "packages/cms/**/*.ts"
---

# CMS Backend Instructions

- Treat `packages/cms/src/routes/` as the controller layer for request validation, HTTP semantics, and response shaping.
- Keep business rules and orchestration in `packages/cms/src/services/`.
- Keep persistence logic and Prisma query composition in `packages/cms/src/models/` unless the existing slice already uses direct Prisma access for a clear reason.
- Keep auth, RBAC, validation, and other cross-cutting concerns in `packages/cms/src/middleware/`.
- Prefer explicit Zod validation for route params, query, and body shapes.
- Never return `passwordHash` or secrets in API responses.
- If a contract is shared across packages, define or update it in `packages/shared/src/types/` and import it via `@ministrosfc/shared`.
- If a type or reusable Zod schema is shared only inside CMS across route, service, and model layers, centralize it in `packages/cms/src/types/<domain>/`.
- Do not duplicate DTOs, enums, or validation schemas across backend layers.
- For route-level behavior changes, prefer adding or updating focused Jest integration tests in `packages/cms/tests/integration/` before or alongside implementation.
- After a substantive backend edit, validate with the narrowest relevant CMS command first, typically a focused Jest run, then `npm run lint` or `npm run build` if needed.
