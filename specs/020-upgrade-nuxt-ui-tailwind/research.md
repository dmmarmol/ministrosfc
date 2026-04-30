# Phase 0 Research - Frontend Dependency Upgrade Baseline

## Decision 1: Lock target versions at branch creation date

- Decision: Resolve "latest stable" as versions published on branch creation date and keep them fixed for the feature lifecycle.
- Rationale: Prevents moving targets in staged rollouts and keeps acceptance criteria deterministic.
- Alternatives considered: Per-wave "latest at time of upgrade" was rejected because it can invalidate earlier validation work and create scope drift.

## Decision 2: Use staged rollout only when compatibility blocks full upgrade

- Decision: Attempt full upgrade first; if blocked, stage by dependency with blocker documentation and mandatory follow-up task.
- Rationale: Balances delivery progress with constitutional requirement for explicit planning and non-optional completion.
- Alternatives considered: All-or-nothing upgrade was rejected due to potential delivery deadlock; permanent downgrade to older versions was rejected as out-of-scope for modernization.

## Decision 3: Treat automated test-suite green state as release gate

- Decision: Require full automated test-suite pass before migration and after each upgrade wave, with zero new failures.
- Rationale: Provides objective behavior-preservation evidence and avoids subjective manual sign-off.
- Alternatives considered: Manual exploratory-only validation was rejected as insufficiently reproducible; incident-window-only measurement was rejected as delayed feedback.

## Decision 4: Fix mandatory regression journeys to minimal core flows

- Decision: Mandatory flow evidence must include login/register/logout, players listing/details, user creation, game creation, and player creation.
- Rationale: Keeps validation focused and repeatable while covering auth, core domain read paths, and critical admin create paths.
- Alternatives considered: Full-surface validation was rejected as too broad for this feature; single-flow validation was rejected as too weak.

## Decision 5: Keep scope strictly limited to compatibility updates

- Decision: Exclude unrelated feature work, UI redesign, broad refactors, and non-required test rewrites.
- Rationale: Enforces feature isolation and semantic commit grouping constraints from constitution.
- Alternatives considered: Opportunistic cleanup during upgrade was rejected because it obscures regression attribution.

## Decision 6: No new shared contract types for this feature

- Decision: Do not introduce new shared domain types unless required by actual API contract changes discovered during implementation.
- Rationale: Current scope is dependency/runtime compatibility; introducing new shared types without need increases migration surface.
- Alternatives considered: Preemptive shared-type refactor was rejected as non-goal.
