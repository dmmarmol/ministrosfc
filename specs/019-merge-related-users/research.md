# Research - Merge Related Users (Spec 019)

## Decision 1: Persist registration approval state on User

- Decision: Introduce explicit registration lifecycle state on User (`PENDING_APPROVAL`, `APPROVED`, `DENIED`), with new sign-ups defaulting to `PENDING_APPROVAL`.
- Rationale: FR-001/FR-002 require clear gatekeeping semantics; a dedicated state avoids overloading unrelated fields like `onboardingCompletedAt`.
- Alternatives considered: Use `role` to represent pending status (rejected: conflates authorization and lifecycle); infer pending from missing player link (rejected: approval without merge is valid).

## Decision 2: Store reviewer actions in dedicated audit entity

- Decision: Add a `UserApprovalDecision` audit table that records approval actions (`APPROVE_NO_MERGE`, `APPROVE_WITH_MERGE`) with `userId`, `reviewerId`, `decisionType`, `mergePlayerId`, and timestamp.
- Rationale: FR-011 requires durable and queryable approval auditability beyond mutable user fields, while denied pending users are hard-deleted without retained rejected-application data per FR-012.
- Alternatives considered: Store decision metadata directly on `User` only (rejected: loses approval history and does not scale for future multi-step governance).

## Decision 3: Enforce optimistic lock on review submission

- Decision: Require `expectedUpdatedAt` in approve/deny requests and reject with `409 CONFLICT` if user `updatedAt` has changed.
- Rationale: FR-017 requires deterministic conflict behavior for concurrent reviewers.
- Alternatives considered: Pessimistic DB row lock during review session (rejected: long-lived lock harms UX and throughput).

## Decision 4: Related-player suggestion pipeline

- Decision: Build a two-step matcher: DB prefilter to orphan players (no linked user), then application-side ranking by name similarity first, email match second, with curated output capped to top 5 suggestions and `matchScore >= 0.30`.
- Rationale: FR-005 mandates orphan-only candidate list and explicit ranking strategy.
- Alternatives considered: Full fuzzy matching in SQL only (rejected: difficult to tune/read); manual search only (rejected: misses curated candidate requirement).

## Decision 5: Approval API surface under admin users namespace

- Decision: Add approval endpoints under `/api/v1/admin/users` namespace to align with existing admin user management routes and RBAC.
- Rationale: Existing backend already mounts admin user operations at `/api/v1/admin/users`; reusing this surface minimizes cognitive load and middleware duplication.
- Alternatives considered: New top-level `/api/v1/approvals` router (rejected: duplicates admin governance domain and fragments contracts).

## Decision 6: Merge execution strategy

- Decision: During approve+merge, keep pending user credential identity (`firstName`, `lastName`, `email`, `passwordHash`) and link `user.playerId` to selected orphan player in one transaction.
- Rationale: FR-008/FR-009/FR-010 demand single resulting identity with user credentials prevailing and player domain data preserved.
- Alternatives considered: Create new user record from merge and delete original pending user (rejected: invalidates issued identity references and adds unnecessary migration risk).

## Decision 7: Notification contract as interface plus safe adapter

- Decision: Define a `NotificationSender` contract in shared types with async methods `send`, `sendCC`, `sendCCO`, and `sendSafe`; provide a no-op/logging adapter in CMS approval workflow.
- Rationale: FR-013..FR-016 require stable contract now without email transport coupling; approval flow must not fail on notification errors.
- Alternatives considered: Delay contract until email feature (rejected: violates current spec); synchronous notification API (rejected: inconsistent with non-blocking requirement).

## Decision 8: Frontend integration pattern

- Decision: Keep page-level route files thin and implement approval queue/editor blocks as page-scoped components under `packages/frontend/src/components/pages/admin/users/`.
- Rationale: Constitution Principle V (page decomposition) requires feature blocks outside large page templates.
- Alternatives considered: Put full queue and merge UI directly in page files (rejected: constitution violation and poor maintainability).
