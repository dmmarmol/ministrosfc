# Research: Team Statistics Views

**Branch**: `chore/017-team-stats-views` | **Date**: 2026-04-16

---

## 1. CSV Import Strategy

**Decision**: Multipart `POST /api/v1/import/csv` endpoint accepting three named file fields (`historial`, `jugadores`, `apariciones`). Parsed in-process with `csv-parse` (already a common Node.js CSV library). All three files processed in a single transaction-scoped batch.

**Rationale**: Three files in one request keeps the import atomic from the admin's perspective. The CMS already uses `multer` for photo uploads, so multipart is a natural extension. Processing in-process (rather than background job) is acceptable because each CSV has at most ~1000 rows; import will complete in < 2 seconds.

**Alternatives considered**:
- Sequential individual uploads — rejected because partial imports leave the database in an inconsistent state with dangling Apariciones rows referencing missing Games.
- Background job queue — rejected as over-engineering for this data volume; synchronous response with a summary result is simpler.

---

## 2. Idempotency: Upsert Strategy

**Decision**: Use Prisma `upsert` with the following natural keys per entity:

| Entity          | Natural Key (upsert on)                                        |
| --------------- | -------------------------------------------------------------- |
| `OpponentTeam`  | `name` (case-insensitive, trimmed)                             |
| `Tournament`    | `name` (case-insensitive, trimmed)                             |
| `Player`        | `name` (case-insensitive, trimmed)                             |
| `Game`          | `(date + opponentTeamId + tournamentId)` — composite unique    |
| `GameParticipant` | `(gameId + playerId)` — already has `@@unique` in schema    |

**Rationale**: Prisma native upsert is the simplest mechanism, avoids race conditions in a single-process import, and keeps no extra import-log table. Re-importing the same CSVs will update non-key fields rather than duplicate rows.

**Alternatives considered**:
- Hash-based deduplication table — rejected (over-engineering for one-time historical import).
- Check-then-insert — rejected (race condition prone, more code).

---

## 3. Schema Additions Required

**Decision**: Additive migrations only — no existing fields removed or renamed.

**New fields on `Game`**:
- `startTime String?` — HH:MM string (from "Comienzo" column)
- `endTime String?` — HH:MM string (from "Finalización" column)
- `coach String?` — coach name at match time (from "DT" column)
- `photoUrl String?` — optional match photo URL (from "Foto" column)

**Note on `outcome`**: Win/Loss/Draw is derivable from `homeTeamScore` vs `awayTeamScore` at query time; no new column needed. The import maps "G" → game where homeTeamScore > awayTeamScore, "P" → homeTeamScore < awayTeamScore, "E" → scores equal. If scores are null (not filled), outcome string is stored as a `notes` annotation.

**New field on `GameParticipant`**:
- `isStarter Boolean?` — `true` = Titular, `false` = Suplente, `null` = unknown

**New field on `Game` (composite unique index)**:
- Add `@@unique([date, opponentTeamId, tournamentId])` to enable upsert.

**Rationale**: Minimal schema surface. All new fields are nullable to maintain backward compatibility with existing game creation flows.

---

## 4. Team Statistics Aggregation Pattern

**Decision**: Compute team stats at query time via Prisma aggregate queries (no pre-aggregated TeamStats table). Cache results in Redis with a 5-minute TTL, same pattern as existing `StatisticsService`.

Team stat queries are joins over `Game` + `Tournament` + `OpponentTeam` with GROUP BY:
- `getTeamStatsByYear()` — group completed games by calendar year
- `getTeamStatsByTournament()` — group by tournamentId + year
- `getTeamStatsByRival()` — group by opponentTeamId
- `getTeamSummaryHeader()` — single-pass aggregations for all-time records

**Rationale**: With ~1000 historical games the query will be fast without any pre-aggregation. The existing `Statistics` model stores player-level data; team-level data is a natural extension to the `StatisticsService` rather than a new model.

**Alternatives considered**:
- New `TeamStatistics` Prisma model — rejected (premature optimization, adds complexity for a read-only derived view).
- Materialized view in PostgreSQL — rejected (requires raw SQL, no Prisma support, overkill for 1000 rows).

---

## 5. CSV Real Data Observations

From inspecting `data/historial.csv`, `data/jugadores.csv`, `data/apariciones.csv`:

- **Historial**: 997 data rows. Date format `DD/MM/YYYY`. Has trailing empty columns. Last column appears to be a duplicate date `YYYY/MM/DD` — ignore. "Apariciones" column contains `TRUE`/`FALSE`, not a count.
- **Jugadores**: 61 data rows. First column header is `Jugador (62)` — the number is the player count annotation, not part of the field name. Has "Invitado Por" column (maps to `invitedById` lookup by name).
- **Apariciones**: 887 data rows. Date format `YYYY/MM/DD`. Column 5 (index 4) is outcome `G/P/E`. Column 6 = `Jugador` (full name), Column 7 = nickname. Column 11 = `Asistencia` (assists, not appearances). Column 12 = `Titular/Suplente`.

**Correction to spec**: Column formerly labeled "Apariciones" in Historial is a boolean flag, not count. "Asistencia" in Apariciones is assists (integer), not appearances.

---

## 6. URL Query Params for Filter State

**Decision**: Use Nuxt `useRoute` + `navigateTo` (or `router.replace`) to encode filters as query params. Focus mode stored as `mode=`, year as `year=`, tournament as `tournament=`, rival as `rival=`, player as `player=`. All as string query params.

**Rationale**: This matches the existing pattern in the codebase (spec-017 requirement). Nuxt's `useRoute().query` is reactive; on mount the composable reads query params to initialize filters.

---

## 7. Access Control on Stats Routes

**Decision**:
- `GET /api/v1/statistics/players` and `GET /api/v1/statistics/players/:id` — remain **public** (FR-001)
- New `GET /api/v1/statistics/team/*` endpoints — require **authentication** (`authenticate` middleware, no role restriction — any logged-in user)
- `POST /api/v1/import/csv` — **ADMIN only**

**Rationale**: Matches spec FR-002. Uses existing `authenticate` and `requireRole` middleware.

---

## 8. csv-parse vs Manual Split

**Decision**: Use `csv-parse` (Node.js) in synchronous/streaming mode. Already available as a common package; handles quoted fields (the jugadores CSV has quoted nicknames with embedded commas like `"El Colectivero"`).

**Rationale**: Manual `split(',')` would break on quoted fields observed in real data. `csv-parse` handles RFC 4180 correctly.
