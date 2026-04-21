# Changelog — @ministrosfc/shared

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

---

## [0.0.1] — 2026-04-21

### Added

- **Player types**: `Player`, `PlayerPublic`, `PlayerCreateDTO`, `PlayerUpdateDTO`, `PlayerStatus`, `PlayerType`, `Position`, `Foot`, `Contact`.
- **`PositionDisplayName`**: map from `Position` enum → Spanish display name.
- **`positionMap`**: map from `Position` enum → short code string (e.g. `Position.CF → "CF"`). Moved from `@ministrosfc/cms` csv-import helpers.
- **`spanishPositionMap`**: map from Spanish informal position names (lowercase) → `Position` enum. Moved from `@ministrosfc/cms` csv-import helpers.
- **Game types**: `Game`, `GameCreateDTO`, `GameUpdateDTO`, `GameStatus`, `GameWithParticipants`.
- **Game participant types**: `GameParticipant`, `GameParticipantCreateDTO`.
- **Tournament types**: `Tournament`, `TournamentCreateDTO`, `CompetitionType`.
- **Opponent team types**: `OpponentTeam`, `OpponentTeamCreateDTO`.
- **Playground types**: `Playground`, `PlaygroundCreateDTO`, `PlaygroundUpdateDTO`.
- **Statistics types**: `TeamStatPeriodDTO`, `TeamSummaryHeaderDTO`, `PlayerStatRowDTO`, `CsvImportResultDTO`.
- **User types**: `User`, `UserCreateDTO`, `UserRole`.
- **Address types**: `Address`, `AddressCreateDTO`.
- **Utility functions**: `formatDate`, `formatDateTime`, `formatTime` (datetime), `getInitials` (strings), `toISOWithOffset` (ISO 8601 with timezone offset), jersey number helpers.
- **Validation**: `validatePassword` (password strength rules).
- **Constants**: `DEFAULT_MAX_PLAYERS`, game and player constants.
- **Zod v4** as runtime dependency for schema validation utilities.
