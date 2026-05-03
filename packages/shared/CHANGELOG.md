# Changelog — @ministrosfc/shared

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

---

## [0.12.0] — 2026-05-03

### Added

- `RegistrationStatus` enum (`PENDING_APPROVAL | APPROVED | DENIED`) and `ApprovalDecisionType` enum (`APPROVE_NO_MERGE | APPROVE_WITH_MERGE`) in `src/types/user.ts`.
- `NotificationRecipient`, `NotificationSender`, and `NotificationSenderFactory` interfaces in new `src/types/notification.ts` — transport-agnostic contract for approval-flow email notifications.
- `PendingApprovalQueueItem`, `RelatedPlayerSuggestion`, `OrphanPlayerItem`, and `MergeResolution` DTOs in new `src/types/approval.ts` — shared API contract between CMS approval endpoints and frontend review UI.
- `PLAYER_POSITION_FILTER_ALL` constant (`"ALL"`) in `src/constants/players.ts` for position filter dropdowns that include an all-positions option.

### Changed

- No public API additions were required in this release; package version advanced to keep the shared workspace aligned with the monorepo `0.11.0` release.
- Shared player/position contracts continue to serve as the source of truth for the CMS import/auth flows and the frontend runtime.

## [0.10.0] — 2026-04-21

### Added

- `positionMap`: `Position` enum → short code string (e.g. `Position.CF → "CF"`). Moved from `@ministrosfc/cms` csv-import helpers.
- `spanishPositionMap`: Spanish informal position names (lowercase) → `Position` enum. Moved from `@ministrosfc/cms` csv-import helpers.
- `TeamStatPeriodDTO`, `TeamSummaryHeaderDTO`, `PlayerStatRowDTO`, `CsvImportResultDTO` types for team and player statistics API contracts.

---

## [0.9.0] — 2026-04-16

### Changed

- `formatDate`, `formatDateTime`, `formatTime` (date formatting) and `getInitials` (string initials) moved from frontend-local utils into `src/utils/datetime.ts` and `src/utils/strings.ts` and re-exported from the package. Deleted `packages/frontend/src/utils/formatDate.ts` and `initials.ts`.

---

## [0.8.1] — 2026-04-13

### Added

- `toISOWithOffset`: utility for consistent ISO 8601 datetime with timezone offset formatting (used by game create/edit API payloads).

---

## [0.8.0] — 2026-04-13

### Added

- `DEFAULT_MAX_PLAYERS` constant and shared game/player constants; tightened participant typing around position values.

---

## [0.7.0] — 2026-04-07

### Added

- `Playground`, `PlaygroundCreateDTO`, `PlaygroundUpdateDTO` types.

---

## [0.6.4] — prior

### Added

- `PlayerProfileResponse` and `UpdatePlayerProfilePayload` types migrated from frontend.

---

## [0.6.3] — prior

### Added

- Jersey number utility helpers (`src/utils/jersey.ts`).

---

## [0.6.0] — prior

### Added

- `UserRole` enum, password validation schema (`src/validation/password.ts`).
- User types updated: `firstName`/`lastName` split (replacing `name`), `googleSubjectId` field.
- Initial package: `Player`, `PlayerPublic`, `PlayerCreateDTO`, `PlayerUpdateDTO`, `PlayerStatus`, `PlayerType`, `Position`, `Foot`, `Contact`, `Game`, `GameParticipant`, `Tournament`, `OpponentTeam`, `User` types and related DTOs.
