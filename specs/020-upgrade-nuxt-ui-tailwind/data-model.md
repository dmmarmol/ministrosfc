# Phase 1 Data Model - Frontend Dependency Upgrade Baseline

## Entity: DependencyTarget

- Purpose: Defines the locked version target for each required dependency.
- Fields:
  - name: enum (`nuxt`, `@nuxt/ui`, `tailwindcss`)
  - lockedVersion: string
  - lockDate: date
  - status: enum (`pending`, `in-progress`, `upgraded`, `blocked`, `rolled-back`)
- Validation Rules:
  - lockDate is identical for all three targets.
  - lockedVersion is immutable after plan approval.
  - status transitions only follow allowed state machine.
- State Transitions:
  - `pending -> in-progress -> upgraded`
  - `in-progress -> blocked`
  - `in-progress -> rolled-back`
  - `blocked -> in-progress` (after workaround or follow-up wave)

## Entity: UpgradeWave

- Purpose: Represents one execution wave (full or staged) for dependency updates.
- Fields:
  - waveId: string
  - mode: enum (`full`, `staged`)
  - targets: list of DependencyTarget.name
  - startedAt: datetime
  - completedAt: datetime nullable
  - outcome: enum (`success`, `blocked`, `rollback`)
  - blockerNotes: string nullable
- Validation Rules:
  - mode `full` must include all 3 dependencies.
  - mode `staged` must include at least 1 dependency.
  - blockerNotes required when outcome is `blocked`.

## Entity: ValidationRun

- Purpose: Captures objective regression evidence for each wave.
- Fields:
  - runId: string
  - stage: enum (`baseline-pre-upgrade`, `post-wave`, `pre-release`)
  - fullSuitePass: boolean
  - newFailuresCount: integer
  - mandatoryFlowsCovered: list of flow identifiers
  - createdAt: datetime
- Validation Rules:
  - baseline-pre-upgrade run must exist and `fullSuitePass=true` before first wave.
  - post-wave runs must report `newFailuresCount=0` for successful wave closure.
  - mandatoryFlowsCovered must include:
    - `auth-login`
    - `auth-register`
    - `auth-logout`
    - `players-list`
    - `players-detail`
    - `admin-user-create`
    - `admin-game-create`
    - `admin-player-create`

## Relationship Summary

- One UpgradeWave has many DependencyTargets (subset or full set).
- One UpgradeWave has one or more ValidationRuns.
- DependencyTarget status changes are justified by ValidationRun outcomes.
